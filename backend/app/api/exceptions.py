# /backend/app/api/exceptions.py

from __future__ import annotations

import logging
from typing import Any, Dict

from fastapi import FastAPI, HTTPException, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

logger = logging.getLogger(__name__)


def _build_error_payload(
    *,
    code: str,
    message: str,
    request_id: str | None = None,
    details: Any = None,
) -> Dict[str, Any]:
    return {
        "status": "error",
        "error": {
            "code": code,
            "message": message,
            "details": details,
            "request_id": request_id,
        },
    }


async def http_exception_handler(request: Request, exc: HTTPException) -> JSONResponse:
    request_id = getattr(request.state, "request_id", None)

    return JSONResponse(
        status_code=exc.status_code,
        content=_build_error_payload(
            code=f"http_{exc.status_code}",
            message=str(exc.detail),
            request_id=request_id,
        ),
    )


async def validation_exception_handler(
    request: Request,
    exc: RequestValidationError,
) -> JSONResponse:
    request_id = getattr(request.state, "request_id", None)

    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content=_build_error_payload(
            code="validation_error",
            message="Request validation failed.",
            request_id=request_id,
            details=exc.errors(),
        ),
    )


async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    request_id = getattr(request.state, "request_id", None)

    logger.exception("Unhandled exception occurred. request_id=%s", request_id)

    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content=_build_error_payload(
            code="internal_server_error",
            message="An unexpected server error occurred.",
            request_id=request_id,
        ),
    )


def register_exception_handlers(app: FastAPI) -> None:
    app.add_exception_handler(HTTPException, http_exception_handler)
    app.add_exception_handler(RequestValidationError, validation_exception_handler)
    app.add_exception_handler(Exception, unhandled_exception_handler)