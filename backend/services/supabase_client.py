# filepath: /Users/thekiiid/pipbycdo/backend/services/supabase_client.py
import os
from supabase import create_client, Client

# Initialize a global supabase client variable
supabase_client: Client | None = None

def initialize_supabase_client():
    """Initialize the Supabase client using environment variables."""
    global supabase_client
    
    # Attempt to get Supabase URL and Key from environment variables
    SUPABASE_URL: str | None = os.environ.get("SUPABASE_URL")
    SUPABASE_KEY: str | None = os.environ.get("SUPABASE_KEY")

    if SUPABASE_URL and SUPABASE_KEY:
        try:
            supabase_client = create_client(SUPABASE_URL, SUPABASE_KEY)
            print("Supabase client initialized successfully.")
        except Exception as e:
            print(f"Error initializing Supabase client: {e}")
            supabase_client = None # Ensure client is None if initialization fails
    else:
        print("SUPABASE_URL and SUPABASE_KEY environment variables are not set. Supabase client not initialized.")

# Initialize on module import
initialize_supabase_client()

def get_supabase_client() -> Client:
    """
    Returns the initialized Supabase client.
    Raises an exception if the client is not initialized.
    """
    if supabase_client is None:
        raise RuntimeError(
            "Supabase client is not initialized. "
            "Ensure SUPABASE_URL and SUPABASE_KEY are set in your environment."
        )
    return supabase_client

# Example of how you might define your table name
TASKS_TABLE_NAME = "tasks"
