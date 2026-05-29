# /backend/app/agents/retriever.py

from __future__ import annotations

import logging
from typing import Dict, Any

from app.core.state import OuroState
from app.core.config import settings
from app.services.vector_store import VectorStoreService

logger = logging.getLogger(__name__)

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


def retriever_node(state: OuroState) -> Dict[str, Any]:
    query = state["query"]
    source = state["source"]
    k = state.get("k", settings.default_retrieval_k)

    if not query or not query.strip():
        return {"error": "Query is empty. Cannot retrieve.", "retrieved_chunks": []}

    if not source or not source.strip():
        return {"error": "Source is empty. Cannot retrieve.", "retrieved_chunks": []}

    try:
        vs = get_vector_store()
        results = vs.similarity_search(
            query=query,
            k=min(k, settings.max_synthesis_chunks),
            where={"source": source},
        )
    except Exception as exc:
        logger.exception("Retriever node failed during similarity search")
        return {
            "error": f"Retrieval failed: {exc}",
            "retrieved_chunks": [],
        }

    if not results:
        return {
            "error": "No relevant chunks found for the given query and source.",
            "retrieved_chunks": [],
        }

    chunks = [
        {"content": doc.page_content, "metadata": doc.metadata}
        for doc in results
    ]

    logger.info(
        "Retriever node: retrieved %d chunks for query='%s' source='%s'",
        len(chunks), query[:60], source,
    )

    return {"retrieved_chunks": chunks, "error": None}