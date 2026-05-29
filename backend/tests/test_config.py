# /backend/tests/test_config.py

from __future__ import annotations

from pathlib import Path

import pytest

from app.core.config import Settings


def test_settings_valid_configuration(tmp_path: Path) -> None:
    settings = Settings(
        environment="test",
        debug=False,
        backend_dir=tmp_path,
        data_dir=tmp_path / "data",
        uploads_dir=tmp_path / "data" / "uploads",
        chroma_dir=tmp_path / "data" / "chroma",
        docs_dir=tmp_path / "docs",
        chunk_size=900,
        chunk_overlap=180,
        default_retrieval_k=5,
        max_synthesis_chunks=5,
        ocr_enabled=True,
        ocr_language="eng",
        ocr_dpi=300,
        ollama_base_url="http://localhost:11434",
        ollama_model="llama3.1:latest",
    )

    assert settings.environment == "test"
    assert settings.chunk_overlap < settings.chunk_size
    assert settings.ollama_base_url == "http://localhost:11434"


def test_settings_reject_invalid_chunk_overlap(tmp_path: Path) -> None:
    with pytest.raises(ValueError, match="chunk_overlap must be smaller than chunk_size"):
        Settings(
            environment="test",
            debug=False,
            backend_dir=tmp_path,
            data_dir=tmp_path / "data",
            uploads_dir=tmp_path / "data" / "uploads",
            chroma_dir=tmp_path / "data" / "chroma",
            docs_dir=tmp_path / "docs",
            chunk_size=500,
            chunk_overlap=500,
        )


def test_settings_reject_invalid_ollama_url(tmp_path: Path) -> None:
    with pytest.raises(ValueError, match="ollama_base_url must start with http:// or https://"):
        Settings(
            environment="test",
            debug=False,
            backend_dir=tmp_path,
            data_dir=tmp_path / "data",
            uploads_dir=tmp_path / "data" / "uploads",
            chroma_dir=tmp_path / "data" / "chroma",
            docs_dir=tmp_path / "docs",
            ollama_base_url="localhost:11434",
        )


def test_settings_reject_local_prod_with_debug_true(tmp_path: Path) -> None:
    with pytest.raises(ValueError, match="debug must be false when environment is 'local-prod'"):
        Settings(
            environment="local-prod",
            debug=True,
            backend_dir=tmp_path,
            data_dir=tmp_path / "data",
            uploads_dir=tmp_path / "data" / "uploads",
            chroma_dir=tmp_path / "data" / "chroma",
            docs_dir=tmp_path / "docs",
        )