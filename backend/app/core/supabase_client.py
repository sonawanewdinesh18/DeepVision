"""
app/core/supabase_client.py
Supabase client initialization and helper functions.
"""

from supabase import create_client, Client
from app.core.config import settings

# Initialize Supabase client
supabase: Client = create_client(
    settings.SUPABASE_URL,
    settings.SUPABASE_SERVICE_ROLE_KEY or settings.SUPABASE_ANON_KEY
)

def get_supabase() -> Client:
    """Dependency to get Supabase client."""
    return supabase
