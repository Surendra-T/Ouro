# /backend/app/agents/critic.py

from __future__ import annotations

import logging
from typing import Dict, Any

from langchain_ollama import ChatOllama
from langchain_core.messages import HumanMessage, SystemMessage

from app.core.state import OuroState
from app.core.config import settings

logger = logging.getLogger(__name__)

CRITIC_SYSTEM_PROMPT = """You are a strict evidence critic. Your job is to evaluate whether a synthesized answer is fully supported by the provided evidence chunks.

Rules:
1. Check every factual claim in the answer against the evidence.
2. Respond ONLY in this exact format, nothing else:

SUPPORTED: <true or false>
CONFIDENCE: <a decimal between 0.0 and 1.0>
CRITIQUE: <one paragraph, precise, no filler>

3. SUPPORTED is true only if every claim in the answer is directly traceable to the evidence.
4. SUPPORTED is false if any claim goes beyond, contradicts, or is absent from the evidence.
5. CONFIDENCE reflects how well the answer is grounded: 1.0 = fully grounded, 0.0 = not grounded at all."""


def _parse_critic_response(raw: str) -> Dict[str, Any]:
    supported = False
    confidence = 0.0
    critique = raw.strip()

    for line in raw.splitlines():
        line = line.strip()
        if line.upper().startswith("SUPPORTED:"):
            val = line.split(":", 1)[-1].strip().lower()
            supported = val == "true"
        elif line.upper().startswith("CONFIDENCE:"):
            try:
                confidence = float(line.split(":", 1)[-1].strip())
                confidence = max(0.0, min(1.0, confidence))
            except ValueError:
                confidence = 0.0
        elif line.upper().startswith("CRITIQUE:"):
            critique = line.split(":", 1)[-1].strip()

    return {
        "supported": supported,
        "confidence": confidence,
        "critique": critique,
    }


def critic_node(state: OuroState) -> Dict[str, Any]:
    if state.get("error"):
        logger.warning("Critic skipped due to upstream error: %s", state["error"])
        return {
            "critique": "Skipped due to upstream error.",
            "supported": False,
        }

    synthesis = state.get("synthesis", "")
    chunks = state.get("retrieved_chunks", [])

    if not synthesis or synthesis == "INSUFFICIENT EVIDENCE":
        return {
            "critique": "No synthesis to evaluate.",
            "supported": False,
        }

    evidence_text = "\n\n---\n\n".join(
        [f"[Chunk {i+1}]: {c['content']}" for i, c in enumerate(chunks)]
    )

    human_message = f"""Synthesis to evaluate:
{synthesis}

Evidence used:
{evidence_text}

Evaluate strictly."""

    try:
        llm = ChatOllama(
            model=settings.ollama_model,
            base_url=settings.ollama_base_url,
            temperature=0.0,
            num_ctx=settings.ollama_context_window,
        )

        messages = [
            SystemMessage(content=CRITIC_SYSTEM_PROMPT),
            HumanMessage(content=human_message),
        ]

        response = llm.invoke(messages)
        parsed = _parse_critic_response(response.content)

    except Exception as exc:
        logger.exception("Critic node failed during LLM call")
        return {
            "critique": f"Critic failed: {exc}",
            "supported": False,
        }

    logger.info(
        "Critic node: supported=%s confidence=%.2f",
        parsed["supported"],
        parsed["confidence"],
    )

    return {
        "critique": parsed["critique"],
        "supported": parsed["supported"],
        "error": None,
    }