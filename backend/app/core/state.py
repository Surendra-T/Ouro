# /backend/app/core/state.py

from __future__ import annotations

from typing import Any, Dict, List, Optional
from typing_extensions import TypedDict


class RetrievedChunk(TypedDict):
    content: str
    metadata: Dict[str, Any]


class OuroState(TypedDict):
    query: str
    source: str
    k: int
    retrieved_chunks: List[RetrievedChunk]
    synthesis: str
    critique: str
    supported: bool
    error: Optional[str]