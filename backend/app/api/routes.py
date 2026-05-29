# /backend/app/api/routes.py

from __future__ import annotations

import logging
from pathlib import Path

from fastapi import APIRouter, Body, File, HTTPException, UploadFile, status
import httpx

from app.core.config import settings
from app.core.schemas import (
    CollectionStatsResponse,
    ErrorResponse,
    GraphRetrievedChunk,
    HealthResponse,
    GraphResearchRequest,
    GraphResearchResponse,
    GraphRetrievedChunk,
    IngestResponse,
    IngestRequest,
    RetrieveRequest,
    RetrieveResponse,
    RetrievedChunk,
    UploadResponse,
)
from app.services.file_store import save_upload
from app.graph.workflow import run_research_graph

from app.services.vector_store import (
    EmptyDocumentError,
    OCRDependencyError,
    PDFIngestionError,
    VectorStoreService,
)

logger = logging.getLogger(__name__)

router = APIRouter()

_vector_store: VectorStoreService | None = None


def get_vector_store() -> VectorStoreService:
    global _vector_store
    if _vector_store is None:
        _vector_store = VectorStoreService(
            persist_directory=settings.chroma_dir,
            collection_name=settings.chroma_collection_name,
            embedding_model_name=settings.embedding_model_name,
            embedding_device=settings.embedding_device,
            chunk_size=settings.chunk_size,
            chunk_overlap=settings.chunk_overlap,
            ocr_enabled=settings.ocr_enabled,
            ocr_language=settings.ocr_language,
            ocr_dpi=settings.ocr_dpi,
            tessdata_dir=settings.tessdata_prefix,
        )
    return _vector_store


@router.get(
    "/health/live",
    response_model=HealthResponse,
    summary="Liveness check",
    tags=["System"],
)
async def health_live() -> HealthResponse:
    return HealthResponse(
        status="ok",
        app_name=settings.app_name,
        app_version=settings.app_version,
    )


@router.get(
    "/health/ready",
    summary="Readiness check",
    tags=["System"],
)
async def health_ready():
    checks: dict[str, dict[str, str]] = {}

    try:
        vs = get_vector_store()
        _ = vs.collection_stats()
        checks["vector_store"] = {"status": "ok"}
    except Exception as exc:
        checks["vector_store"] = {"status": "error", "detail": str(exc)}

    try:
        async with httpx.AsyncClient(timeout=3.0) as client:
            response = await client.get(f"{settings.ollama_base_url}/api/tags")
            response.raise_for_status()
        checks["ollama"] = {"status": "ok"}
    except Exception as exc:
        checks["ollama"] = {"status": "error", "detail": str(exc)}

    all_ok = all(item["status"] == "ok" for item in checks.values())

    if not all_ok:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={
                "message": "Service not ready.",
                "checks": checks,
            },
        )

    return {
        "status": "ok",
        "checks": checks,
    }


@router.get(
    "/stats",
    response_model=CollectionStatsResponse,
    summary="Vector store collection statistics",
    tags=["System"],
)
async def collection_stats() -> CollectionStatsResponse:
    try:
        vs = get_vector_store()
        raw = vs.collection_stats()
        return CollectionStatsResponse(**raw)
    except Exception as exc:
        logger.exception("Failed to fetch collection stats")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Could not fetch collection stats: {exc}",
        )


@router.post(
    "/upload",
    response_model=UploadResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Upload a PDF file",
    tags=["Documents"],
    responses={
        400: {"model": ErrorResponse, "description": "No filename or invalid request"},
        413: {"model": ErrorResponse, "description": "File too large"},
        415: {"model": ErrorResponse, "description": "Unsupported file type"},
    },
)
async def upload_pdf(
    file: UploadFile = File(..., description="PDF file to upload"),
) -> UploadResponse:
    saved_path, file_size = await save_upload(file)

    return UploadResponse(
        status="success",
        filename=file.filename or "unknown",
        stored_filename=Path(saved_path).name,
        file_path=saved_path,
        content_type=file.content_type or "application/pdf",
        size_bytes=file_size,
    )

@router.post(
    "/ingest",
    response_model=IngestResponse,
    summary="Ingest an uploaded PDF into the vector store",
    tags=["Documents"],
    responses={
        400: {"model": ErrorResponse, "description": "Bad file path or empty document"},
        404: {"model": ErrorResponse, "description": "Uploaded file not found"},
        422: {"model": ErrorResponse, "description": "OCR dependency missing"},
        500: {"model": ErrorResponse, "description": "Ingestion failure"},
    },
)
async def ingest_pdf(
    body: IngestRequest = Body(...),
) -> IngestResponse:
    resolved = Path(body.file_path).resolve()

    if not str(resolved).startswith(str(settings.uploads_dir.resolve())):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="file_path must point to a file inside the uploads directory.",
        )

    if not resolved.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"File not found: {resolved}",
        )

    try:
        vs = get_vector_store()
        result = vs.ingest_pdf(resolved)
    except PDFIngestionError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        )
    except EmptyDocumentError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        )
    except OCRDependencyError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(exc),
        )
    except Exception as exc:
        logger.exception("Unexpected ingestion error")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ingestion failed: {exc}",
        )

    return IngestResponse(**result)
    


@router.post(
    "/retrieve",
    response_model=RetrieveResponse,
    summary="Retrieve semantically relevant chunks from a specific source",
    tags=["Retrieval"],
    responses={
        400: {"model": ErrorResponse, "description": "Invalid query or source"},
        500: {"model": ErrorResponse, "description": "Retrieval failure"},
    },
)
async def retrieve(body: RetrieveRequest) -> RetrieveResponse:
    try:
        vs = get_vector_store()
        results = vs.similarity_search(
            query=body.query,
            k=body.k,
            where={"source": body.source},
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        )
    except Exception as exc:
        logger.exception("Retrieval error")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Retrieval failed: {exc}",
        )

    return RetrieveResponse(
        status="success",
        query=body.query,
        source=body.source,
        k=body.k,
        results=[
            RetrievedChunk(content=doc.page_content, metadata=doc.metadata)
            for doc in results
        ],
    )

@router.post(
    "/research",
    response_model=GraphResearchResponse,
    summary="Run the full LangGraph research pipeline",
    tags=["Research"],
    responses={
        400: {"model": ErrorResponse, "description": "Invalid input"},
        500: {"model": ErrorResponse, "description": "Pipeline failure"},
    },
)
async def research(body: GraphResearchRequest) -> GraphResearchResponse:
    try:
        result = run_research_graph(
            query=body.query,
            source=body.source,
            k=body.k,
        )
    except Exception as exc:
        logger.exception("Research pipeline failed")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Research pipeline failed: {exc}",
        )

    retrieved = [
        GraphRetrievedChunk(content=item["content"], metadata=item["metadata"])
        for item in result.get("retrieved_chunks", [])
    ]

    return GraphResearchResponse(
        query=result.get("query", body.query),
        source=result.get("source", body.source),
        k=result.get("k", body.k),
        retrieved_chunks=retrieved,
        synthesis=result.get("synthesis", ""),
        critique=result.get("critique", ""),
        supported=result.get("supported", False),
        error=result.get("error"),
    )