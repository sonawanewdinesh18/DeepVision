import os
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from app.core.dependencies import get_current_user
from app.core.exceptions import setup_exception_handlers

load_dotenv()

app = FastAPI()

# Setup professional error handling globally
setup_exception_handlers(app)

# SECURITY: Allow your frontend to talk to your backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("ALLOWED_ORIGINS", "*")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def home():
    return {"status": "DeepVision API is Running"}

@app.get("/api/protected")
def protected_route(current_user=Depends(get_current_user)):
    """
    A protected route demonstrating how the backend verifies Supabase JWTs.
    Only accessible if a valid JWT is passed in the Authorization header.
    """
    return {
        "message": "Authenticated successfully with Supabase!",
        "user_id": current_user.id,
        "email": current_user.email,
        "role": current_user.role
    }