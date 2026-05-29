# /backend/tests/test_routes.py

from __future__ import annotations

from io import BytesIO

import pytest


def test_health_live(client) -> None:
    response = client.get("/api/health/live")
    assert response.status_code == 200

    body = response.json()
    assert body["status"] == "ok"
    assert body["app_name"] == "Ouro API"
    assert "X-Request-ID" in response.headers


def test_health_ready_success(client, monkeypatch) -> None:
    class FakeVectorStore:
        def collection_stats(self):
            return {"collection_name": "test", "document_count": 0}

    async def fake_get(*args, **kwargs):
        class FakeResponse:
            def raise_for_status(self):
                return None
        return FakeResponse()

    class FakeAsyncClient:
        def __init__(self, *args, **kwargs):
            pass

        async def __aenter__(self):
            return self

        async def __aexit__(self, exc_type, exc, tb):
            return None

        async def get(self, *args, **kwargs):
            return await fake_get(*args, **kwargs)

    monkeypatch.setattr("app.api.routes.get_vector_store", lambda: FakeVectorStore())
    monkeypatch.setattr("app.api.routes.httpx.AsyncClient", FakeAsyncClient)

    response = client.get("/api/health/ready")
    assert response.status_code == 200

    body = response.json()
    assert body["status"] == "ok"
    assert body["checks"]["vector_store"]["status"] == "ok"
    assert body["checks"]["ollama"]["status"] == "ok"


def test_health_ready_failure_when_ollama_unavailable(client, monkeypatch) -> None:
    class FakeVectorStore:
        def collection_stats(self):
            return {"collection_name": "test", "document_count": 0}

    class FakeAsyncClient:
        def __init__(self, *args, **kwargs):
            pass

        async def __aenter__(self):
            return self

        async def __aexit__(self, exc_type, exc, tb):
            return None

        async def get(self, *args, **kwargs):
            raise RuntimeError("Ollama unavailable")

    monkeypatch.setattr("app.api.routes.get_vector_store", lambda: FakeVectorStore())
    monkeypatch.setattr("app.api.routes.httpx.AsyncClient", FakeAsyncClient)

    response = client.get("/api/health/ready")
    assert response.status_code == 503

    body = response.json()
    assert body["status"] == "error"
    assert body["error"]["code"] == "http_503"


def test_upload_rejects_non_pdf(client) -> None:
    response = client.post(
        "/api/upload",
        files={"file": ("note.txt", BytesIO(b"hello"), "text/plain")},
    )

    assert response.status_code == 415
    body = response.json()
    assert "error" in body or "detail" in body


def test_ingest_route_with_mocked_service(client, monkeypatch, temp_paths) -> None:
    fake_pdf = temp_paths["uploads_dir"] / "sample.pdf"
    fake_pdf.write_bytes(b"%PDF-1.4 fake pdf")

    class FakeVectorStore:
        def ingest_pdf(self, path):
            return {
                "status": "success",
                "collection_name": "ouro_documents",
                "source_file": "sample.pdf",
                "pages_indexed": 2,
                "chunks_indexed": 4,
                "embedding_model": "sentence-transformers/all-MiniLM-L6-v2",
                "persist_directory": str(temp_paths["chroma_dir"]),
            }

    monkeypatch.setattr("app.api.routes.get_vector_store", lambda: FakeVectorStore())

    response = client.post("/api/ingest", json={"file_path": str(fake_pdf)})
    assert response.status_code == 200

    body = response.json()
    assert body["status"] == "success"
    assert body["chunks_indexed"] == 4


def test_retrieve_route_with_mocked_service(client, monkeypatch) -> None:
    class FakeDoc:
        def __init__(self, content, metadata):
            self.page_content = content
            self.metadata = metadata

    class FakeVectorStore:
        def similarity_search(self, query, k, where):
            return [
                FakeDoc(
                    "Dart is a programming language.",
                    {"page": 2, "source": "fake.pdf"},
                )
            ]

    monkeypatch.setattr("app.api.routes.get_vector_store", lambda: FakeVectorStore())

    response = client.post(
        "/api/retrieve",
        json={"query": "What is Dart?", "source": "fake.pdf", "k": 3},
    )
    assert response.status_code == 200

    body = response.json()
    assert body["status"] == "success"
    assert body["query"] == "What is Dart?"
    assert body["source"] == "fake.pdf"
    assert body["k"] == 3
    assert len(body["results"]) == 1
    assert body["results"][0]["content"] == "Dart is a programming language."
    assert body["results"][0]["metadata"]["page"] == 2


def test_research_route_with_mocked_graph(client, monkeypatch) -> None:
    def fake_run_research_graph(query: str, source: str, k: int):
        return {
            "query": query,
            "source": source,
            "k": k,
            "retrieved_chunks": [
                {
                    "content": "Dart is a language by Google.",
                    "metadata": {"page": 1, "source": source},
                }
            ],
            "synthesis": "The document is about Dart. [Chunk 1]",
            "critique": "Grounded in evidence.",
            "supported": True,
            "error": None,
        }

    monkeypatch.setattr("app.api.routes.run_research_graph", fake_run_research_graph)

    response = client.post(
        "/api/research",
        json={"query": "What is this document about?", "source": "fake.pdf", "k": 3},
    )
    assert response.status_code == 200

    print(response.json())
    body = response.json()
    assert body["supported"] is True
    assert body["synthesis"] == "The document is about Dart. [Chunk 1]"
    assert body["critique"] == "Grounded in evidence."
    assert "X-Request-ID" in response.headers