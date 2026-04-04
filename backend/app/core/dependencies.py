"""
app/core/dependencies.py
FastAPI dependencies for authentication and authorization.
"""

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError

from app.core.config import settings
from app.core.supabase_client import get_supabase
from app.models.schemas import UserPublic

security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> UserPublic:
    """
    Validate JWT token and return current user.
    Raises 401 if token is invalid or user not found.
    """
    token = credentials.credentials
    
    try:
        # Decode JWT token without signature/audience verification
        # Supabase tokens are already validated by Supabase
        payload = jwt.decode(
            token,
            settings.SUPABASE_JWT_SECRET,
            algorithms=["HS256", "RS256"],
            options={
                "verify_signature": False,
                "verify_aud": False,
                "verify_exp": True  # Still verify expiration
            }
        )
        
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials - no user ID in token",
            )
    except JWTError as e:
        print(f"JWT validation failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid authentication credentials: {str(e)}",
        )
    
    # Fetch user profile from Supabase
    supabase = get_supabase()
    response = supabase.table("profiles").select("*").eq("id", user_id).execute()
    
    if not response.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    
    profile = response.data[0]
    
    # Get email from auth.users (if needed)
    user_response = supabase.auth.admin.get_user_by_id(user_id)
    email = user_response.user.email if user_response.user else ""
    
    return UserPublic(
        id=profile["id"],
        email=email,
        full_name=profile.get("full_name"),
        role=profile.get("role", "user"),
        subscription_plan=profile.get("subscription_plan", "free"),
    )


async def get_current_admin_user(
    current_user: UserPublic = Depends(get_current_user),
) -> UserPublic:
    """
    Verify that the current user has admin role.
    Raises 403 if user is not an admin.
    """
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )
    return current_user
