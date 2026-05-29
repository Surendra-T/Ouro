# /backend/app/graph/workflow.py

from __future__ import annotations

import logging
from typing import Any, Dict

from langgraph.graph import END, START, StateGraph

from app.agents.retriever import retriever_node
from app.agents.synthesizer import synthesizer_node
from app.agents.critic import critic_node
from app.core.state import OuroState

logger = logging.getLogger(__name__)


def build_research_graph():
    graph = StateGraph(OuroState)

    graph.add_node("retriever", retriever_node)
    graph.add_node("synthesizer", synthesizer_node)
    graph.add_node("critic", critic_node)

    graph.add_edge(START, "retriever")
    graph.add_edge("retriever", "synthesizer")
    graph.add_edge("synthesizer", "critic")
    graph.add_edge("critic", END)

    return graph.compile()


research_graph = build_research_graph()


def run_research_graph(query: str, source: str, k: int) -> Dict[str, Any]:
    initial_state: OuroState = {
        "query": query,
        "source": source,
        "k": k,
        "retrieved_chunks": [],
        "synthesis": "",
        "critique": "",
        "supported": False,
        "error": None,
    }

    result = research_graph.invoke(initial_state)

    logger.info(
        "Graph run complete: supported=%s, error=%s, retrieved_chunks=%d",
        result.get("supported"),
        result.get("error"),
        len(result.get("retrieved_chunks", [])),
    )

    return result