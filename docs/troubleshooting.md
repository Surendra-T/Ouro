# /docs/troubleshooting.md

# Ouro Troubleshooting

## Pylance cannot resolve pytest

Cause:
- VS Code is using the wrong interpreter.

Fix:
1. Open Command Palette.
2. Run `Python: Select Interpreter`.
3. Select `backend\venv\Scripts\python.exe`.

## Ollama readiness fails

Symptoms:
- `/api/health/ready` returns 503
- research route may fail during synthesis or critique

Checks:
```powershell
ollama serve
curl http://localhost:11434/api/tags
```

## Chroma issues

Symptoms:
- ingest fails
- retrieve fails
- readiness reports vector store error

Checks:
- verify `backend\data\chroma` exists
- verify app can write to that directory
- verify collection name matches config

## Upload failures

Symptoms:
- upload route returns 400 or 422

Checks:
- file extension must be `.pdf`
- file size must be below configured limit
- multipart form upload must use key `file`

## Research route returns supported=false

This is not necessarily a backend failure.

It means:
- the critic judged the synthesis insufficiently grounded, or
- the evidence did not fully support the synthesis.

Check:
- retrieved chunks
- synthesis text
- critique text

## Logging noise after pytest

If tests pass but teardown prints logging errors from `httpx`, `httpcore`, or `huggingface_hub`, suppress those loggers in `tests/conftest.py` by raising their level to `WARNING`.

## Rollback point

Last known good backend checkpoint:
- upload works
- ingest works
- retrieve works
- research works
- health/live works
- health/ready works
- request IDs are present

If a future change breaks the backend, revert to the last commit where the full regression path passed.