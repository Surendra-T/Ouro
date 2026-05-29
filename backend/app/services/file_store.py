# /backend/app/services/file_store.py

from __future__ import annotations

import shutil
from pathlib import Path
from uuid import uuid4

from fastapi import HTTPException, UploadFile, status

from app.core.config import settings


def _safe_filename(filename: str) -> str:
    original = Path(filename).name.strip()
    if not original:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid filename.",
        )

    ext = Path(original).suffix.lower()
    if ext != ".pdf":
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="Only PDF files are supported.",
        )

    stem = Path(original).stem
    sanitized_stem = "".join(ch if ch.isalnum() or ch in {"-", "_"} else "_" for ch in stem)
    sanitized_stem = sanitized_stem.strip("._") or "document"

    return f"{sanitized_stem}_{uuid4().hex[:8]}.pdf"


async def save_upload(file: UploadFile) -> tuple[str, int]:
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file must have a filename.",
        )

    settings.ensure_directories()

    safe_name = _safe_filename(file.filename)
    destination = settings.uploads_dir / safe_name
    max_bytes = settings.max_upload_size_bytes

    size = 0

    try:
        with destination.open("wb") as buffer:
            while True:
                chunk = await file.read(1024 * 1024)
                if not chunk:
                    break

                size += len(chunk)

                if size > max_bytes:
                    if destination.exists():
                        destination.unlink(missing_ok=True)
                    raise HTTPException(
                        status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                        detail=f"File exceeds the maximum allowed size of {max_bytes} bytes.",
                    )

                buffer.write(chunk)

    except HTTPException:
        raise
    except Exception as exc:
        if destination.exists():
            destination.unlink(missing_ok=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save uploaded file: {exc}",
        ) from exc
    finally:
        await file.close()

    return str(destination.resolve()), size