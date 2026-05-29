# /backend/tests/test_graph.py

from __future__ import annotations

from app.agents.critic import _parse_critic_response
from app.graph.workflow import run_research_graph


def test_parse_critic_response_valid_format() -> None:
    raw = """SUPPORTED: true
CONFIDENCE: 0.91
CRITIQUE: The answer is fully grounded in the evidence."""
    parsed = _parse_critic_response(raw)

    assert parsed["supported"] is True
    assert parsed["confidence"] == 0.91
    assert parsed["critique"] == "The answer is fully grounded in the evidence."


def test_parse_critic_response_invalid_confidence_falls_back() -> None:
    raw = """SUPPORTED: false
CONFIDENCE: not-a-number
CRITIQUE: Unsupported claims detected."""
    parsed = _parse_critic_response(raw)

    assert parsed["supported"] is False
    assert parsed["confidence"] == 0.0
    assert parsed["critique"] == "Unsupported claims detected."


def test_run_research_graph_with_mocked_nodes(monkeypatch) -> None:
    def fake_retriever_node(state):
        return {
            "retrieved_chunks": [
                {
                    "content": "Dart is a programming language developed by Google.",
                    "metadata": {"page": 1, "source": "fake.pdf"},
                }
            ],
            "error": None,
        }

    def fake_synthesizer_node(state):
        return {
            "synthesis": "The document is about Dart. [Chunk 1]",
            "error": None,
        }

    def fake_critic_node(state):
        return {
            "critique": "Grounded in evidence.",
            "supported": True,
            "error": None,
        }

    monkeypatch.setattr("app.graph.workflow.retriever_node", fake_retriever_node)
    monkeypatch.setattr("app.graph.workflow.synthesizer_node", fake_synthesizer_node)
    monkeypatch.setattr("app.graph.workflow.critic_node", fake_critic_node)
    monkeypatch.setattr("app.graph.workflow.research_graph", None)

    from langgraph.graph import END, START, StateGraph
    from app.core.state import OuroState

    graph = StateGraph(OuroState)
    graph.add_node("retriever", fake_retriever_node)
    graph.add_node("synthesizer", fake_synthesizer_node)
    graph.add_node("critic", fake_critic_node)
    graph.add_edge(START, "retriever")
    graph.add_edge("retriever", "synthesizer")
    graph.add_edge("synthesizer", "critic")
    graph.add_edge("critic", END)

    monkeypatch.setattr("app.graph.workflow.research_graph", graph.compile())

    result = run_research_graph(query="What is this about?", source="fake.pdf", k=3)

    assert result["synthesis"] == "The document is about Dart. [Chunk 1]"
    assert result["critique"] == "Grounded in evidence."
    assert result["supported"] is True
    assert result["error"] is None