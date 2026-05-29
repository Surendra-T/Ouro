# /docs/backend-runbook.md

# Ouro Backend Runbook

## Start backend

```powershell
cd C:\Users\Surendra Tripathi\Desktop\Projects\Ouro\backend
.\venv\Scripts\activate
uvicorn main:app --reload
```

## Start Ollama

```powershell
ollama serve
```

Verify Ollama:

```powershell
curl http://localhost:11434/api/tags
```

## Health checks

### Liveness
`GET /api/health/live`

Expected:
- HTTP 200
- app metadata
- `X-Request-ID` response header

### Readiness
`GET /api/health/ready`

Expected:
- HTTP 200 when vector store and Ollama are available
- HTTP 503 with structured error payload when a dependency is unavailable

## Core workflow

1. Upload PDF
2. Ingest PDF into Chroma
3. Retrieve chunks
4. Run research graph
5. Inspect synthesis, critique, and supported flag

## Run tests

```powershell
pytest tests -q
```

## Manual smoke test

Use the known-good PDF and run:

1. `/api/upload`
2. `/api/ingest`
3. `/api/retrieve`
4. `/api/research`

Expected:
- non-empty retrieved chunks
- non-empty synthesis
- non-empty critique
- no unhandled server error

## Logs

Each request should include:
- method
- path
- status code
- duration
- `X-Request-ID`

Use request ID to trace failures across logs and responses.