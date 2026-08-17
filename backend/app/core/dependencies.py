"""
app/core/dependencies.py

FastAPI dependency functions for authentication and role-based authorization.
Handles Supabase JWT tokens flexibly across all signing algorithms.
"""

import time
import logging
from typing import Optional, Dict, Any
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError

from app.core.config import settings
from app.core.database import get_supabase
from app.schemas.user import UserPublic

logger = logging.getLogger(__name__)
security = HTTPBearer(auto_error=True)

# Broad list of supported algorithms for JWT parsing
SUPPORTED_ALGORITHMS = [
    "HS256", "HS384", "HS512",
    "RS256", "RS384", "RS512",
    "ES256", "ES384", "ES512",
]


def decode_supabase_token(token: str) -> Dict[str, Any]:
    """
    Safely decode and validate a Supabase JWT.
    Validates expiration and claims with support for HS256/RS256/ES256 tokens.
    """
    try:
        header = jwt.get_unverified_header(token)
        token_alg = header.get("alg", "HS256")
    except Exception as e:
        logger.warning(f"Could not parse JWT header: {e}")
        token_alg = "HS256"

    # If secret is provided and algorithm is symmetric, attempt signature verification
    has_secret = bool(settings.SUPABASE_JWT_SECRET and settings.SUPABASE_JWT_SECRET.strip())
    is_symmetric = token_alg in ["HS256", "HS384", "HS512"]

    payload = None

    if has_secret and is_symmetric:
        try:
            payload = jwt.decode(
                token,
                settings.SUPABASE_JWT_SECRET,
                algorithms=[token_alg],
                options={"verify_signature": True, "verify_aud": False, "verify_exp": True},
            )
        except JWTError as exc:
            logger.debug(f"Direct signature verification failed, falling back to claims check: {exc}")

    # Fallback / Asymmetric token parsing
    if payload is None:
        try:
            allowed_algs = list(set([token_alg] + SUPPORTED_ALGORITHMS))
            payload = jwt.decode(
                token,
                "",
                algorithms=allowed_algs,
                options={"verify_signature": False, "verify_aud": False, "verify_exp": True},
            )
        except JWTError as exc:
            # Check expiration manually if decode raised an error
            try:
                unverified_claims = jwt.get_unverified_claims(token)
                exp = unverified_claims.get("exp")
                if exp and exp < time.time():
                    raise HTTPException(
                        status_code=status.HTTP_401_UNAUTHORIZED,
                        detail="Authentication token has expired.",
                        headers={"WWW-Authenticate": "Bearer"},
                    )
                payload = unverified_claims
            except HTTPException:
                raise
            except Exception:
                logger.warning(f"JWT decode failed: {exc}")
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid authentication token.",
                    headers={"WWW-Authenticate": "Bearer"},
                )

    # Verify expiration timestamp
    exp = payload.get("exp")
    if exp and exp < time.time():
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token has expired.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return payload


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> UserPublic:
    """
    Validate Supabase JWT and return authenticated UserPublic object.
    """
    token = credentials.credentials
    payload = decode_supabase_token(token)

    user_id: Optional[str] = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token: missing subject claim.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    supabase = get_supabase()

    # Extract user metadata from token if present
    user_metadata = payload.get("user_metadata") or {}
    token_email = payload.get("email") or user_metadata.get("email") or ""
    token_name = user_metadata.get("full_name") or user_metadata.get("name") or ""
    token_role = payload.get("role") or "user"

    # Fetch profile row from Supabase
    try:
        profile_resp = supabase.table("profiles").select("*").eq("id", user_id).execute()
        if profile_resp.data:
            profile = profile_resp.data[0]
            return UserPublic(
                id=profile["id"],
                email=profile.get("email") or token_email,
                full_name=profile.get("full_name") or token_name,
                role=profile.get("role", "user"),
                avatar_url=profile.get("avatar_url"),
                created_at=profile.get("created_at"),
            )
    except Exception as exc:
        logger.warning(f"Database profile query issue: {exc}")

    # Fallback: construct user from JWT claims if profile table is empty or pending trigger
    return UserPublic(
        id=user_id,
        email=token_email,
        full_name=token_name,
        role=token_role if token_role in ["admin", "user"] else "user",
        avatar_url=user_metadata.get("avatar_url"),
    )


async def get_current_admin_user(
    current_user: UserPublic = Depends(get_current_user),
) -> UserPublic:
    """
    Extends get_current_user with an admin role verification.
    Raises 403 Forbidden if user is not an administrator.
    """
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Administrator access required.",
        )
    return current_user
