import sys
import os
from dotenv import load_dotenv

# Add parent directory to path and load environment variables
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
load_dotenv()  # Load environment variables from root .env

from services.supabase_client import initialize_supabase_client, get_supabase_client

def test_supabase_connectivity():
    print("Environment variables:")
    print(f"SUPABASE_URL: {os.environ.get('SUPABASE_URL')}")
    print(f"SUPABASE_KEY: {os.environ.get('SUPABASE_KEY')}")
    
    try:
        initialize_supabase_client()
        client = get_supabase_client()
        print("Supabase client initialized successfully.")
        # Test a simple health check query with an existing table
        response = client.table("prompt_templates").select("id").limit(1).execute()
        print(f"Database connection successful. Tables are accessible. Response: {response}")
    except Exception as e:
        print("Error during Supabase connectivity test:", e)

if __name__ == "__main__":
    test_supabase_connectivity()
