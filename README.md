# Ouro

A premium desktop-first local AI research workspace for grounded document analysis, retrieval, synthesis, and developer-visible reasoning.

Ouro is a self-owned full-stack project built around a local multi-agent RAG workflow. Users upload PDF documents, ingest them into a vector store, run grounded research queries, inspect evidence-backed outputs, and explore internal system state through a premium frontend designed for desktop use.

## What Ouro does

Ouro is built for serious research over personal or curated document collections.

Core capabilities:
- Upload PDF documents to the local backend.
- Ingest documents into a persistent vector store.
- Retrieve semantically relevant chunks for a given query.
- Run an end-to-end research flow that retrieves, synthesizes, critiques, and returns a grounded response.
- Persist session history in the frontend experience.
- Surface technical and diagnostic details for power users through a developer-oriented mode.
- Export outputs through copy, Markdown, and PDF-friendly flows.

## Product philosophy

Ouro is not a generic AI chat app and not a flashy demo dashboard.

The product is designed around:
- Desktop-first interaction.
- Quiet luxury visual design.
- Apple-inspired clarity, restraint, and spatial continuity.
- Claude-like readability for long-form answers.
- Real utility over startup-demo theatrics.
- Technical transparency for users who want to inspect how the system works.

## Architecture

The project is split into two major parts:

### Backend
A FastAPI application that handles:
- health and readiness endpoints,
- PDF upload validation and storage,
- ingestion into the vector database,
- semantic retrieval,
- LangGraph-powered research execution,
- model and runtime integration.

### Frontend
A desktop-focused React application that handles:
- welcome and auth-facing product shell,
- home and research workspace UI,
- source upload and source management,
- output rendering,
- session history,
- settings and runtime visibility,
- developer-facing transparency mode.

## High-level flow

1. Start the backend.
2. Start the frontend.
3. Upload a PDF.
4. Ingest the uploaded file.
5. Ask a research question.
6. Let the backend retrieve relevant chunks and run the research graph.
7. Review the grounded result in the frontend.
8. Revisit prior sessions through persisted history.

## Repository structure

```text
Ouro/
├── backend/
│   ├── app/
│   ├── tests/
│   ├── .env.example
│   ├── main.py
│   └── requirements.txt
├── docs/
├── frontend/
│   ├── src/
│   ├── index.html
│   ├── package.json
│   ├── package-lock.json
│   ├── tailwind.config.ts
│   └── vite.config.ts
├── .gitignore
├── LICENSE
└── README.md
```

## Tech stack

### Frontend
- React
- TypeScript
- Vite
- Tailwind CSS
- modern component/state tooling for a desktop-first product experience

### Backend
- FastAPI
- Python
- Pydantic settings and schemas
- vector store integration for retrieval
- LangGraph for the research workflow
- local model/runtime integration

## Backend features

The backend currently supports:
- `GET /health/live` for basic liveness.
- `GET /health/ready` for readiness and dependency checks.
- `GET /stats` for vector store collection statistics.
- `POST /upload` for validated PDF uploads.
- `POST /ingest` for ingesting uploaded PDFs.
- `POST /retrieve` for semantic chunk retrieval.
- `POST /research` for running the full research pipeline.

## Frontend features

The frontend currently supports:
- desktop-only product layout,
- premium workspace shell,
- PDF upload flow,
- source-aware research workflow,
- answer rendering optimized for long-form reading,
- persisted history,
- export actions,
- settings surface,
- premium motion and theme treatment,
- developer-facing technical visibility.

## Local development setup

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd Ouro
```

### 2. Backend setup

Create and activate a virtual environment inside `backend/`, then install dependencies.

#### Windows PowerShell

```powershell
cd backend
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
```

#### Start the backend

```powershell
uvicorn main:app --reload
```

Backend will usually run at:

```text
http://127.0.0.1:8000
```

### 3. Frontend setup

Open a second terminal.

```powershell
cd frontend
npm install
npm run dev
```

The frontend dev server will start on the Vite local URL shown in the terminal.

## Environment configuration

### Backend
Use `backend/.env.example` as the reference for required environment values.

Typical categories include:
- application metadata,
- upload and storage settings,
- embedding and retrieval settings,
- OCR-related settings,
- local model/runtime integration settings.

### Frontend
Frontend environment variables should live in a local `.env` file inside `frontend/` and should not be committed.

## Typical usage

1. Launch the backend.
2. Launch the frontend.
3. Open the app in the browser.
4. Upload a PDF file.
5. Trigger ingestion if the workflow requires it.
6. Ask a question grounded in the uploaded source.
7. Review the generated answer and supporting evidence.
8. Inspect dev mode if deeper runtime visibility is needed.
9. Reopen previous sessions through history.

## Testing and verification

### Backend tests
Run backend tests from the `backend/` directory with the virtual environment active.

```powershell
pytest tests -q
```

### Frontend verification
Typical validation steps:
- `npm run dev` for development,
- verify upload flow,
- verify research responses,
- verify history persistence,
- verify export actions,
- verify desktop layout quality.

## Notes for contributors and reviewers

This repository is intentionally focused on a polished local-first product experience.

Important constraints:
- The frontend is desktop-first.
- Runtime junk and local dependency folders should not be committed.
- Frontend `.env` files should remain local.
- Backend runtime data should remain local unless explicitly required for a demo artifact.

## Recommended .git hygiene

Do not commit:
- `frontend/node_modules/`
- `frontend/dist/`
- `frontend/.env`
- `backend/venv/`
- `backend/data/`
- `__pycache__/`
- `.pytest_cache/`

## Project status

Ouro is a finished self-owned portfolio project focused on product quality, local research workflows, and premium interaction design.

## License

This project is distributed under the terms of the standard `MIT` License.