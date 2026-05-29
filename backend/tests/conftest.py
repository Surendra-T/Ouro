# /backend/tests/conftest.py

from __future__ import annotations

from pathlib import Path
from typing import Generator

import pytest
from fastapi.testclient import TestClient

from app.core.config import settings
from main import app

import logging

logging.getLogger("httpcore").setLevel(logging.WARNING)
logging.getLogger("httpx").setLevel(logging.WARNING)
logging.getLogger("huggingface_hub").setLevel(logging.WARNING)

@pytest.fixture()
def temp_paths(tmp_path: Path) -> dict[str, Path]:
    data_dir = tmp_path / "data"
    uploads_dir = data_dir / "uploads"
    chroma_dir = data_dir / "chroma"
    docs_dir = tmp_path / "docs"

    uploads_dir.mkdir(parents=True, exist_ok=True)
    chroma_dir.mkdir(parents=True, exist_ok=True)
    docs_dir.mkdir(parents=True, exist_ok=True)

    return {
        "data_dir": data_dir,
        "uploads_dir": uploads_dir,
        "chroma_dir": chroma_dir,
        "docs_dir": docs_dir,
    }


@pytest.fixture()
def patched_settings(monkeypatch: pytest.MonkeyPatch, temp_paths: dict[str, Path]) -> None:
    monkeypatch.setattr(settings, "environment", "test")
    monkeypatch.setattr(settings, "debug", False)
    monkeypatch.setattr(settings, "data_dir", temp_paths["data_dir"])
    monkeypatch.setattr(settings, "uploads_dir", temp_paths["uploads_dir"])
    monkeypatch.setattr(settings, "chroma_dir", temp_paths["chroma_dir"])
    monkeypatch.setattr(settings, "docs_dir", temp_paths["docs_dir"])
    monkeypatch.setattr(settings, "cors_allowed_origins", ["http://testserver"])
    settings.ensure_directories()


@pytest.fixture()
def client(patched_settings: None) -> Generator[TestClient, None, None]:
    with TestClient(app) as test_client:
        yield test_client