"""
app/core/database.py

Supabase Database and Storage Client Singleton.
Uses the service role key when available to perform authorized server-side operations,
falling back to the anon key.
"""

import logging
from typing import Optional
from supabase import create_client, Client
from app.core.config import settings

logger = logging.getLogger(__name__)

_supabase_client: Optional[Client] = None


def get_supabase() -> Client:
    """
    Returns the Supabase Client singleton.
    Initializes lazily on first access.
    """
    global _supabase_client

    if _supabase_client is None:
        url = settings.SUPABASE_URL
        key = settings.SUPABASE_SERVICE_ROLE_KEY or settings.SUPABASE_ANON_KEY

        if not url or not key:
            logger.warning(
                "Supabase URL or Key is not configured. Database operations will fail."
            )

        _supabase_client = create_client(url, key)

    return _supabase_client
