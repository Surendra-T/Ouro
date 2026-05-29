# /docs/backend-config.md

# Ouro Backend Configuration

This document defines the runtime configuration contract for the Ouro backend.

## Environment modes

- `dev`: local development, debug-friendly defaults
- `local-prod`: hardened local production mode, debug must be false
- `test`: isolated test mode

## Core settings

### App
- `APP_NAME`: API display name
- `APP_VERSION`: semantic version string
- `ENVIRONMENT`: `dev`, `local-prod`, or `test`
- `DEBUG`: enables debug behavior; must be false in `local-prod`

### API
- `API_PREFIX`: root path prefix for all API endpoints, example `/api`

### Uploads
- `MAX_UPLOAD_SIZE_BYTES`: max accepted upload size in bytes
- `ALLOWED_UPLOAD_EXTENSIONS`: comma-separated allowed extensions, example `.pdf`

### Vector store
- `CHROMA_COLLECTION_NAME`: Chroma collection name
- `EMBEDDING_MODEL_NAME`: embedding model identifier
- `EMBEDDING_DEVICE`: `cpu` or `cuda`
- `CHUNK_SIZE`: text chunk size
- `CHUNK_OVERLAP`: overlap between chunks
- `DEFAULT_RETRIEVAL_K`: default retrieval count
- `MAX_SYNTHESIS_CHUNKS`: max chunks passed into synthesis; must be less than or equal to `DEFAULT_RETRIEVAL_K`

### OCR
- `OCR_ENABLED`: enables OCR fallback
- `OCR_LANGUAGE`: Tesseract language code
- `OCR_DPI`: DPI used for OCR rendering
- `TESSDATA_PREFIX`: optional Tesseract data directory

### Ollama
- `OLLAMA_BASE_URL`: local Ollama server URL
- `OLLAMA_MODEL`: installed Ollama model name
- `OLLAMA_TEMPERATURE`: synthesis temperature
- `OLLAMA_CONTEXT_WINDOW`: model context window
- `CRITIC_MIN_CONFIDENCE`: threshold reserved for future graph hardening

## Validation rules

The backend will fail at startup if:

- `API_PREFIX` does not start with `/`
- `API_PREFIX` ends with `/` and is longer than one character
- `CHUNK_OVERLAP >= CHUNK_SIZE`
- `MAX_SYNTHESIS_CHUNKS > DEFAULT_RETRIEVAL_K`
- OCR is enabled but `OCR_LANGUAGE` or `OCR_DPI` is missing
- `ENVIRONMENT=local-prod` while `DEBUG=true`
- `OLLAMA_BASE_URL` does not start with `http://` or `https://`
- `OLLAMA_MODEL` is empty

## Notes

- Paths are resolved automatically from the backend project structure.
- Data, upload, and Chroma directories are created automatically at startup.
- `.env.example` is the canonical template for local configuration.