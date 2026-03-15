import os
import httpx
from pydantic import BaseModel
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_ANON_KEY")

class User(BaseModel):
    id: str
    email: str
    role: str

security = HTTPBearer()

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    if not SUPABASE_URL or not SUPABASE_KEY:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Supabase is not properly configured."
        )
    
    token = credentials.credentials
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{SUPABASE_URL}/auth/v1/user",
                headers={
                    "Authorization": f"Bearer {token}",
                    "apikey": SUPABASE_KEY
                }
            )
            
            if response.status_code != 200:
                raise ValueError("Invalid credentials or token expired.")
                
            user_data = response.json()
            # Construct simple user model to mimic original behavior
            return User(
                id=user_data.get("id", ""),
                email=user_data.get("email", ""),
                role=user_data.get("role", "")
            )
            
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials or token expired.",
            headers={"WWW-Authenticate": "Bearer"},
        )
