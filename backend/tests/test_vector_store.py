# /backend/tests/test_vector_store.py

from __future__ import annotations

from langchain_core.documents import Document

from app.services.vector_store import VectorStoreService


def test_clean_text_collapses_whitespace() -> None:
    raw = "Hello   world\n\nThis   is   a test.\n\n"
    cleaned = VectorStoreService._clean_text(raw)
    assert cleaned == "Hello world This is a test."


def test_sanitize_metadata_preserves_primitives() -> None:
    metadata = {
        "text": "hello",
        "count": 3,
        "score": 1.5,
        "active": True,
        "extra": {"nested": "value"},
        "none_value": None,
    }

    clean = VectorStoreService._sanitize_metadata(metadata)

    assert clean["text"] == "hello"
    assert clean["count"] == 3
    assert clean["score"] == 1.5
    assert clean["active"] is True
    assert clean["extra"] == "{'nested': 'value'}"
    assert clean["none_value"] == ""


def test_stable_document_id_is_deterministic() -> None:
    one = VectorStoreService._stable_document_id(
        source="file.pdf",
        page=1,
        chunk_index=0,
        text="hello world",
    )
    two = VectorStoreService._stable_document_id(
        source="file.pdf",
        page=1,
        chunk_index=0,
        text="hello world",
    )

    assert one == two
    assert isinstance(one, str)
    assert len(one) == 64


def test_chunk_documents_adds_required_metadata(tmp_path) -> None:
    service = VectorStoreService(
        persist_directory=tmp_path / "chroma",
        collection_name="test_collection",
        embedding_model_name="sentence-transformers/all-MiniLM-L6-v2",
        embedding_device="cpu",
        chunk_size=50,
        chunk_overlap=10,
        ocr_enabled=False,
    )

    docs = [
        Document(
            page_content="This is a test document. " * 10,
            metadata={"source": "test.pdf", "page": 1, "filename": "test.pdf"},
        )
    ]

    chunks = service.chunk_documents(docs)

    assert len(chunks) >= 1
    first = chunks[0]

    assert "chunk_index" in first.metadata
    assert "chunk_char_count" in first.metadata
    assert "document_id" in first.metadata
    assert first.metadata["source"] == "test.pdf"