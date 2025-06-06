import os
from dotenv import load_dotenv
from pathlib import Path

# Dynamically resolve the root .env file path
root_env_path = Path(__file__).resolve().parent.parent / ".env"

# Load from root .env
load_dotenv(dotenv_path=root_env_path)

# Normalize environment variable names
# Use service role key for backend operations (has elevated permissions for table creation/management)
os.environ['SUPABASE_KEY'] = os.getenv('SUPABASE_SERVICE_ROLE_KEY', os.getenv('SUPABASE_ANON_KEY', ''))
os.environ['OPENAI_API_KEY'] = os.getenv('OPENAI_4o_KEY', '')  # Use the 4o key as default
os.environ['SMARTSHEET_ACCESS_TOKEN'] = os.getenv('SMARTSHEET_API_KEY', '')
