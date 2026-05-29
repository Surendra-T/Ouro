# /backend/app/services/vector_store.py

from __future__ import annotations

import hashlib
import logging
import os
from pathlib import Path
from typing import Any, Dict, List, Optional, Sequence

import chromadb
import fitz
from chromadb.api.models.Collection import Collection
from chromadb.config import Settings
from langchain_core.documents import Document
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter
from pypdf import PdfReader

logger = logging.getLogger(__name__)

DEFAULT_EMBEDDING_MODEL = "sentence-transformers/all-MiniLM-L6-v2"
DEFAULT_COLLECTION_NAME = "ouro_documents"
DEFAULT_PERSIST_DIRECTORY = Path(__file__).resolve().parents[2] / "data" / "chroma"

DEFAULT_CHUNK_SIZE = 900
DEFAULT_CHUNK_OVERLAP = 180

DEFAULT_EMBEDDING_DEVICE = os.getenv("OURO_EMBEDDING_DEVICE", "cpu")
DEFAULT_OCR_ENABLED = os.getenv("OURO_OCR_ENABLED", "true").lower() == "true"
DEFAULT_OCR_LANGUAGE = os.getenv("OURO_OCR_LANGUAGE", "eng")
DEFAULT_OCR_DPI = int(os.getenv("OURO_OCR_DPI", "300"))
DEFAULT_TESSDATA_DIR = os.getenv("TESSDATA_PREFIX") or r"C:\Program Files\Tesseract-OCR\tessdata"

class VectorStoreError(Exception):
    pass


class PDFIngestionError(VectorStoreError):
    pass


class EmptyDocumentError(VectorStoreError):
    pass


class OCRDependencyError(VectorStoreError):
    pass


class VectorStoreService:
    def __init__(
        self,
        persist_directory: str | Path = DEFAULT_PERSIST_DIRECTORY,
        collection_name: str = DEFAULT_COLLECTION_NAME,
        embedding_model_name: str = DEFAULT_EMBEDDING_MODEL,
        embedding_device: str = DEFAULT_EMBEDDING_DEVICE,
        chunk_size: int = DEFAULT_CHUNK_SIZE,
        chunk_overlap: int = DEFAULT_CHUNK_OVERLAP,
        ocr_enabled: bool = DEFAULT_OCR_ENABLED,
        ocr_language: str = DEFAULT_OCR_LANGUAGE,
        ocr_dpi: int = DEFAULT_OCR_DPI,
        tessdata_dir: Optional[str] = DEFAULT_TESSDATA_DIR,
    ) -> None:
        if chunk_size <= 0:
            raise ValueError("chunk_size must be > 0")
        if chunk_overlap < 0:
            raise ValueError("chunk_overlap must be >= 0")
        if chunk_overlap >= chunk_size:
            raise ValueError("chunk_overlap must be smaller than chunk_size")
        if ocr_dpi < 72:
            raise ValueError("ocr_dpi must be >= 72")

        self.persist_directory = Path(persist_directory).resolve()
        self.persist_directory.mkdir(parents=True, exist_ok=True)

        self.collection_name = collection_name
        self.embedding_model_name = embedding_model_name
        self.embedding_device = embedding_device
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap

        self.ocr_enabled = ocr_enabled
        self.ocr_language = ocr_language
        self.ocr_dpi = ocr_dpi
        self.tessdata_dir = tessdata_dir

        self._client = self._create_persistent_client()
        self._embedding_function = self._create_embedding_model()
        self._collection = self._get_or_create_collection()

    def _create_persistent_client(self) -> chromadb.PersistentClient:
        return chromadb.PersistentClient(
            path=str(self.persist_directory),
            settings=Settings(anonymized_telemetry=False),
        )

    def _create_embedding_model(self) -> HuggingFaceEmbeddings:
        return HuggingFaceEmbeddings(
            model_name=self.embedding_model_name,
            model_kwargs={"device": self.embedding_device},
            encode_kwargs={"normalize_embeddings": True},
        )

    def _get_or_create_collection(self) -> Collection:
        return self._client.get_or_create_collection(
            name=self.collection_name,
            metadata={
                "embedding_model": self.embedding_model_name,
                "embedding_device": self.embedding_device,
                "distance_space": "cosine",
                "chunk_size": self.chunk_size,
                "chunk_overlap": self.chunk_overlap,
                "ocr_enabled": self.ocr_enabled,
                "ocr_language": self.ocr_language,
                "ocr_dpi": self.ocr_dpi,
            },
        )

    @property
    def collection(self) -> Collection:
        return self._collection

    @property
    def embeddings(self) -> HuggingFaceEmbeddings:
        return self._embedding_function

    def _build_text_splitter(self) -> RecursiveCharacterTextSplitter:
        return RecursiveCharacterTextSplitter(
            chunk_size=self.chunk_size,
            chunk_overlap=self.chunk_overlap,
            separators=["\n\n", "\n", ". ", " ", ""],
            length_function=len,
            is_separator_regex=False,
        )

    def load_pdf(self, pdf_path: str | Path) -> List[Document]:
        pdf_path = Path(pdf_path).resolve()

        if not pdf_path.exists():
            raise PDFIngestionError(f"PDF file not found: {pdf_path}")
        if pdf_path.suffix.lower() != ".pdf":
            raise PDFIngestionError(f"Expected a .pdf file, got: {pdf_path.suffix}")

        try:
            reader = PdfReader(str(pdf_path))
        except Exception as exc:
            raise PDFIngestionError(f"Failed to open PDF with pypdf: {pdf_path}") from exc

        try:
            fitz_doc = fitz.open(str(pdf_path))
        except Exception as exc:
            raise PDFIngestionError(f"Failed to open PDF with PyMuPDF: {pdf_path}") from exc

        documents: List[Document] = []
        total_pages = min(len(reader.pages), len(fitz_doc))

        for page_index in range(total_pages):
            page_number = page_index + 1
            extracted_text = self._extract_text_with_pypdf(reader, page_index)
            extraction_method = "pypdf"

            if not extracted_text and self.ocr_enabled:
                extracted_text = self._extract_text_with_ocr(fitz_doc, page_index)
                extraction_method = "ocr"

            cleaned_text = self._clean_text(extracted_text)
            if not cleaned_text:
                continue

            documents.append(
                Document(
                    page_content=cleaned_text,
                    metadata={
                        "source": str(pdf_path),
                        "filename": pdf_path.name,
                        "page": page_number,
                        "total_pages": total_pages,
                        "extraction_method": extraction_method,
                    },
                )
            )

        fitz_doc.close()

        if not documents:
            raise EmptyDocumentError(
                f"No extractable text found in PDF: {pdf_path.name}. "
                "If scanned, verify Tesseract installation."
            )

        return documents

    def chunk_documents(self, documents: Sequence[Document]) -> List[Document]:
        if not documents:
            raise EmptyDocumentError("No documents provided for chunking")

        splitter = self._build_text_splitter()
        chunks = splitter.split_documents(list(documents))

        if not chunks:
            raise EmptyDocumentError("Chunking produced zero chunks")

        for index, chunk in enumerate(chunks):
            chunk.metadata["chunk_index"] = index
            chunk.metadata["chunk_char_count"] = len(chunk.page_content)
            chunk.metadata["document_id"] = self._stable_document_id(
                source=chunk.metadata.get("source", "unknown"),
                page=int(chunk.metadata.get("page", -1)),
                chunk_index=index,
                text=chunk.page_content,
            )

        return chunks

    def ingest_pdf(self, pdf_path: str | Path) -> Dict[str, Any]:
        page_documents = self.load_pdf(pdf_path)
        chunked_documents = self.chunk_documents(page_documents)

        ids = [doc.metadata["document_id"] for doc in chunked_documents]
        texts = [doc.page_content for doc in chunked_documents]
        metadatas = [self._sanitize_metadata(doc.metadata) for doc in chunked_documents]

        embeddings = self.embeddings.embed_documents(texts)

        self.collection.upsert(
            ids=ids,
            documents=texts,
            metadatas=metadatas,
            embeddings=embeddings,
        )

        return {
            "status": "success",
            "source_file": Path(pdf_path).name,
            "pages_indexed": len({doc.metadata["page"] for doc in chunked_documents}),
            "chunks_indexed": len(chunked_documents),
            "persist_directory": str(self.persist_directory),
        }

    def similarity_search(
        self,
        query: str,
        k: int = 5,
        where: Optional[Dict[str, Any]] = None,
    ) -> List[Document]:
        if not query.strip():
            raise ValueError("query must not be empty")

        query_embedding = self.embeddings.embed_query(query.strip())
        results = self.collection.query(
            query_embeddings=[query_embedding],
            n_results=k,
            where=where,
        )

        documents = results.get("documents", [[]])[0]
        metadatas = results.get("metadatas", [[]])[0]
        distances = results.get("distances", [[]])[0]

        output: List[Document] = []
        for text, metadata, distance in zip(documents, metadatas, distances):
            item_metadata = dict(metadata or {})
            item_metadata["distance"] = distance
            output.append(Document(page_content=text, metadata=item_metadata))

        return output

    def collection_stats(self) -> Dict[str, Any]:
        return {
            "collection_name": self.collection_name,
            "document_count": self.collection.count(),
            "persist_directory": str(self.persist_directory),
            "embedding_model": self.embedding_model_name,
            "embedding_device": self.embedding_device,
            "chunk_size": self.chunk_size,
            "chunk_overlap": self.chunk_overlap,
            "ocr_enabled": self.ocr_enabled,
            "ocr_language": self.ocr_language,
            "ocr_dpi": self.ocr_dpi,
        }

    def _extract_text_with_pypdf(self, reader: PdfReader, page_index: int) -> str:
        try:
            return reader.pages[page_index].extract_text() or ""
        except Exception as exc:
            logger.warning("pypdf extraction failed on page %s: %s", page_index + 1, exc)
            return ""

    def _extract_text_with_ocr(self, fitz_doc: fitz.Document, page_index: int) -> str:
        try:
            page = fitz_doc[page_index]
            kwargs: Dict[str, Any] = {
                "dpi": self.ocr_dpi,
                "language": self.ocr_language,
                "full": True,
            }
            if self.tessdata_dir:
                kwargs["tessdata"] = self.tessdata_dir

            text_page = page.get_textpage_ocr(**kwargs)
            return text_page.extractText() or ""
        except RuntimeError as exc:
            raise OCRDependencyError(
                "OCR failed. Verify Tesseract is installed and TESSDATA_PREFIX is set."
            ) from exc

    @staticmethod
    def _clean_text(text: str) -> str:
        return " ".join(text.split())

    @staticmethod
    def _sanitize_metadata(metadata: Dict[str, Any]) -> Dict[str, Any]:
        clean: Dict[str, Any] = {}
        for key, value in metadata.items():
            if isinstance(value, (str, int, float, bool)) or value is None:
                clean[key] = value if value is not None else ""
            else:
                clean[key] = str(value)
        return clean

    @staticmethod
    def _stable_document_id(source: str, page: int, chunk_index: int, text: str) -> str:
        raw = f"{source}:{page}:{chunk_index}:{text}".encode("utf-8", errors="ignore")
        return hashlib.sha256(raw).hexdigest()


vector_store = VectorStoreService()