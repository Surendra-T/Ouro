# /backend/app/core/schemas.py

from __future__ import annotations

from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field

class HealthResponse(BaseModel):
    status: str = Field(default="ok")
    app_name: str
    app_version: str


class UploadResponse(BaseModel):
    status: str = Field(default="success")
    filename: str
    stored_filename: str
    file_path: str
    content_type: str
    size_bytes: int


class IngestRequest(BaseModel):
    file_path: str = Field(..., min_length=1, description="Absolute or backend-managed PDF path")


class IngestResponse(BaseModel):
    status: str
    source_file: str
    pages_indexed: int
    chunks_indexed: int
    persist_directory: str


class RetrieveRequest(BaseModel):
    query: str = Field(..., min_length=1, description="User search query")
    source: str = Field(..., min_length=1, description="Exact source path to constrain retrieval")
    k: int = Field(default=5, ge=1, le=10, description="Number of chunks to return")


class RetrievedChunk(BaseModel):
    content: str
    metadata: Dict[str, Any]


class RetrieveResponse(BaseModel):
    status: str = Field(default="success")
    query: str
    source: str
    k: int
    results: List[RetrievedChunk]


class ErrorResponse(BaseModel):
    detail: str


class CollectionStatsResponse(BaseModel):
    collection_name: str
    document_count: int
    persist_directory: str
    embedding_model: str
    embedding_device: str
    chunk_size: int
    chunk_overlap: int
    ocr_enabled: bool
    ocr_language: Optional[str] = None
    ocr_dpi: Optional[int] = None

class GraphResearchRequest(BaseModel):
    query: str = Field(..., min_length=1)
    source: str = Field(..., min_length=1)
    k: int = Field(default=5, ge=1, le=10)

class GraphRetrievedChunk(BaseModel):
    content: str
    metadata: Dict[str, Any]


class GraphResearchResponse(BaseModel):
    query: str
    source: str
    k: int
    retrieved_chunks: List[GraphRetrievedChunk]
    synthesis: str
    critique: str
    supported: bool
    error: Optional[str] = None