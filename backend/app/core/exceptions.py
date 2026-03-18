from typing import Any, Dict, Optional
from fastapi import Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException

class CustomAPIException(Exception):
    """
    Base custom exception for the application.
    Allows returning professional error responses.
    """
    def __init__(
        self,
        message: str,
        code: str = "INTERNAL_ERROR",
        status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR,
        details: Optional[Dict[str, Any]] = None
    ):
        self.message = message
        self.code = code
        self.status_code = status_code
        self.details = details

async def custom_api_exception_handler(request: Request, exc: CustomAPIException):
    """Handles CustomAPIException globally."""
    content = {
        "error": {
            "code": exc.code,
            "message": exc.message,
        }
    }
    if exc.details:
        content["error"]["details"] = exc.details
        
    return JSONResponse(status_code=exc.status_code, content=content)

async def standard_http_exception_handler(request: Request, exc: StarletteHTTPException):
    """Overrides default FastAPI/Starlette HTTP exceptions to match our format."""
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": {
                "code": "HTTP_ERROR",
                "message": str(exc.detail)
            }
        }
    )

async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Overrides default FastAPI Validation errors to match our format."""
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "error": {
                "code": "VALIDATION_ERROR",
                "message": "The request contained invalid data.",
                "details": exc.errors()
            }
        }
    )

def setup_exception_handlers(app):
    """Utility function to map all handlers to the FastAPI app instance."""
    app.add_exception_handler(CustomAPIException, custom_api_exception_handler)
    app.add_exception_handler(StarletteHTTPException, standard_http_exception_handler)
    app.add_exception_handler(RequestValidationError, validation_exception_handler)
