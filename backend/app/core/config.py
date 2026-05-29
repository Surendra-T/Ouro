# /backend/app/core/config.py

from __future__ import annotations

from functools import lru_cache
from pathlib import Path
from typing import Literal, Optional

from pydantic import Field, field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
        env_ignore_empty=True,
    )

    app_name: str = Field(default="Ouro API")
    app_version: str = Field(default="0.1.0")
    environment: Literal["dev", "local-prod", "test"] = Field(default="dev")
    debug: bool = Field(default=True)

    api_prefix: str = Field(default="/api")

    backend_dir: Path = Field(default_factory=lambda: Path(__file__).resolve().parents[2])
    data_dir: Path = Field(default_factory=lambda: Path(__file__).resolve().parents[2] / "data")
    uploads_dir: Path = Field(default_factory=lambda: Path(__file__).resolve().parents[2] / "data" / "uploads")
    chroma_dir: Path = Field(default_factory=lambda: Path(__file__).resolve().parents[2] / "data" / "chroma")
    docs_dir: Path = Field(default_factory=lambda: Path(__file__).resolve().parents[3] / "docs")

    max_upload_size_bytes: int = Field(default=25 * 1024 * 1024, ge=1)
    allowed_upload_extensions: list[str] = Field(default_factory=lambda: [".pdf"])

    chroma_collection_name: str = Field(default="ouro_documents")

    embedding_model_name: str = Field(default="sentence-transformers/all-MiniLM-L6-v2")
    embedding_device: Literal["cpu", "cuda"] = Field(default="cpu")

    chunk_size: int = Field(default=900, ge=100, le=4000)
    chunk_overlap: int = Field(default=180, ge=0, le=1000)
    default_retrieval_k: int = Field(default=5, ge=1, le=20)
    max_synthesis_chunks: int = Field(default=5, ge=1, le=10)

    ocr_enabled: bool = Field(default=True)
    ocr_language: Optional[str] = Field(default="eng")
    ocr_dpi: Optional[int] = Field(default=300, ge=72, le=600)
    tessdata_prefix: Optional[str] = Field(default=None)

    ollama_base_url: str = Field(default="http://localhost:11434")
    ollama_model: str = Field(default="llama3.1:latest")
    ollama_temperature: float = Field(default=0.1, ge=0.0, le=1.0)
    ollama_context_window: int = Field(default=4096, ge=512, le=32768)
    critic_min_confidence: float = Field(default=0.6, ge=0.0, le=1.0)

    cors_allowed_origins: list[str] = Field(
        default_factory=lambda: ["http://localhost:3000", "http://127.0.0.1:3000"]
    )

    @field_validator("api_prefix")
    @classmethod
    def validate_api_prefix(cls, value: str) -> str:
        value = value.strip()
        if not value.startswith("/"):
            raise ValueError("api_prefix must start with '/'")
        if len(value) > 1 and value.endswith("/"):
            raise ValueError("api_prefix must not end with '/'")
        return value

    @field_validator("allowed_upload_extensions", mode="before")
    @classmethod
    def normalize_extensions(cls, value):
        if not value:
            raise ValueError("allowed_upload_extensions must not be empty")

        if isinstance(value, str):
            parts = [part.strip() for part in value.split(",") if part.strip()]
        else:
            parts = list(value)

        normalized = []
        for ext in parts:
            ext = ext.strip().lower()
            if not ext.startswith("."):
                ext = f".{ext}"
            normalized.append(ext)

        deduped = sorted(set(normalized))
        if not deduped:
            raise ValueError("allowed_upload_extensions must contain at least one extension")
        return deduped

    @field_validator("ollama_base_url")
    @classmethod
    def validate_ollama_base_url(cls, value: str) -> str:
        value = value.strip().rstrip("/")
        if not value.startswith(("http://", "https://")):
            raise ValueError("ollama_base_url must start with http:// or https://")
        return value

    @field_validator("ollama_model")
    @classmethod
    def validate_ollama_model(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("ollama_model must not be empty")
        return value

    @field_validator(
        "backend_dir",
        "data_dir",
        "uploads_dir",
        "chroma_dir",
        "docs_dir",
        mode="before",
    )
    @classmethod
    def coerce_paths(cls, value):
        return Path(value).resolve() if value is not None else value

    @model_validator(mode="after")
    def validate_cross_field_constraints(self) -> "Settings":
        if self.chunk_overlap >= self.chunk_size:
            raise ValueError("chunk_overlap must be smaller than chunk_size")

        if self.max_synthesis_chunks > self.default_retrieval_k:
            raise ValueError("max_synthesis_chunks must be <= default_retrieval_k")

        if self.ocr_enabled:
            if not self.ocr_language:
                raise ValueError("ocr_language must be set when ocr_enabled is true")
            if self.ocr_dpi is None:
                raise ValueError("ocr_dpi must be set when ocr_enabled is true")

        if self.environment == "local-prod" and self.debug:
            raise ValueError("debug must be false when environment is 'local-prod'")

        return self

    def ensure_directories(self) -> None:
        self.data_dir.mkdir(parents=True, exist_ok=True)
        self.uploads_dir.mkdir(parents=True, exist_ok=True)
        self.chroma_dir.mkdir(parents=True, exist_ok=True)

    @property
    def is_dev(self) -> bool:
        return self.environment == "dev"

    @property
    def is_local_prod(self) -> bool:
        return self.environment == "local-prod"

    @property
    def is_test(self) -> bool:
        return self.environment == "test"


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    settings = Settings()
    settings.ensure_directories()
    return settings


settings = get_settings()