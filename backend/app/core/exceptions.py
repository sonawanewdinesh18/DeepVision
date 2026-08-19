"""
app/core/exceptions.py

Global exception handling and standard RFC-compliant error responses.
"""

from typing import Any, Dict, Optional
from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException


class CustomAPIException(Exception):
    """
    Base custom exception for predictable, structured API error responses.
    """
    def __init__(
        self,
        message: str,
        code: str = "INTERNAL_ERROR",
        status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR,
        details: Optional[Dict[str, Any]] = None,
    ):
        self.message = message
        self.code = code
        self.status_code = status_code
        self.details = details
        super().__init__(message)


def _cors_headers(request: Request) -> Dict[str, str]:
    origin = request.headers.get("origin")
    if origin:
        return {
            "Access-Control-Allow-Origin": origin,
            "Access-Control-Allow-Credentials": "true",
            "Access-Control-Allow-Methods": "*",
            "Access-Control-Allow-Headers": "*",
        }
    return {
        "Access-Control-Allow-Origin": "*",
    }


async def custom_api_exception_handler(request: Request, exc: CustomAPIException) -> JSONResponse:
    """Handles all CustomAPIException instances."""
    content = {
        "error": {
            "code": exc.code,
            "message": exc.message,
        }
    }
    if exc.details:
        content["error"]["details"] = exc.details

    return JSONResponse(status_code=exc.status_code, content=content, headers=_cors_headers(request))


async def standard_http_exception_handler(request: Request, exc: StarletteHTTPException) -> JSONResponse:
    """Standardizes default FastAPI/Starlette HTTP exceptions."""
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": {
                "code": "HTTP_ERROR",
                "message": str(exc.detail),
            }
        },
        headers=_cors_headers(request),
    )


async def validation_exception_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    """Standardizes request validation errors (Pydantic 422)."""
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "error": {
                "code": "VALIDATION_ERROR",
                "message": "The request contained invalid parameters or payload.",
                "details": exc.errors(),
            }
        },
        headers=_cors_headers(request),
    )


async def generic_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Catch-all handler for unexpected internal server errors (500)."""
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": {
                "code": "INTERNAL_SERVER_ERROR",
                "message": f"Internal processing error: {str(exc)}",
            }
        },
        headers=_cors_headers(request),
    )


def setup_exception_handlers(app: FastAPI) -> None:
    """Attach global exception handlers to the FastAPI app instance."""
    app.add_exception_handler(CustomAPIException, custom_api_exception_handler)
    app.add_exception_handler(StarletteHTTPException, standard_http_exception_handler)
    app.add_exception_handler(RequestValidationError, validation_exception_handler)
    app.add_exception_handler(Exception, generic_exception_handler)

