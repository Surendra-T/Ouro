# /backend/app/agents/synthesizer.py

from __future__ import annotations

import logging
from typing import Dict, Any

from langchain_ollama import ChatOllama
from langchain_core.messages import HumanMessage, SystemMessage

from app.core.state import OuroState
from app.core.config import settings

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are a precise research synthesizer. Your task is to answer the user's query strictly and only using the provided evidence chunks.

Rules:
1. Answer ONLY from the provided evidence. Do not use prior knowledge.
2. If the evidence does not contain enough information to answer, say exactly: "INSUFFICIENT EVIDENCE"
3. Be concise and direct. No filler phrases.
4. Cite evidence inline using [Chunk N] notation.
5. Never speculate or infer beyond what is explicitly stated in the evidence."""


def _build_evidence_block(chunks: list[Dict[str, Any]]) -> str:
    lines = []
    for i, chunk in enumerate(chunks, start=1):
        page = chunk["metadata"].get("page", "?")
        lines.append(f"[Chunk {i}] (Page {page}):\n{chunk['content']}")
    return "\n\n---\n\n".join(lines)


def synthesizer_node(state: OuroState) -> Dict[str, Any]:
    if state.get("error"):
        logger.warning("Synthesizer skipped due to upstream error: %s", state["error"])
        return {"synthesis": ""}

    chunks = state.get("retrieved_chunks", [])
    if not chunks:
        return {
            "synthesis": "INSUFFICIENT EVIDENCE",
            "error": "No chunks available for synthesis.",
        }

    query = state["query"]
    evidence_block = _build_evidence_block(chunks)

    human_message = f"""Query: {query}

Evidence:
{evidence_block}

Synthesize a precise answer using only the evidence above."""

    try:
        llm = ChatOllama(
            model=settings.ollama_model,
            base_url=settings.ollama_base_url,
            temperature=settings.ollama_temperature,
            num_ctx=settings.ollama_context_window,
        )

        messages = [
            SystemMessage(content=SYSTEM_PROMPT),
            HumanMessage(content=human_message),
        ]

        response = llm.invoke(messages)
        synthesis = response.content.strip()

    except Exception as exc:
        logger.exception("Synthesizer node failed during LLM call")
        return {
            "synthesis": "",
            "error": f"Synthesis failed: {exc}",
        }

    logger.info("Synthesizer node: synthesis produced (%d chars)", len(synthesis))
    return {"synthesis": synthesis, "error": None}