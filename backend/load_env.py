import os
from dotenv import load_dotenv
from pathlib import Path

# Dynamically resolve the root .env file path
root_env_path = Path(__file__).resolve().parent.parent / ".env"

# Load from root .env
load_dotenv(dotenv_path=root_env_path)

# Normalize environment variable names and set up the required variables
# Use service role key for backend operations (has elevated permissions for table creation/management)
os.environ['SUPABASE_KEY'] = os.getenv('SUPABASE_SERVICE_ROLE_KEY', os.getenv('SUPABASE_ANON_KEY', ''))

# Set up OpenAI API keys - normalize the variable names
os.environ['OPENAI_API_KEY'] = os.getenv('OPENAI_4o_KEY', '')  # Use the 4o key as default
os.environ['OPENAI_o4_mini_KEY'] = os.getenv('OPENAI_o4-mini_KEY', '')
os.environ['OPENAI_4_1_KEY'] = os.getenv('OPENAI_4.1_KEY', '')
os.environ['OPENAI_4_1_mini_KEY'] = os.getenv('OPENAI_4.1-mini_KEY', '')

# Set up other API keys
os.environ['SMARTSHEET_ACCESS_TOKEN'] = os.getenv('SMARTSHEET_API_KEY', '')

# Set up application settings
os.environ['ENVIRONMENT'] = os.getenv('ENVIRONMENT', 'development')
os.environ['DEBUG'] = os.getenv('DEBUG', 'true')
os.environ['LOG_LEVEL'] = os.getenv('LOG_LEVEL', 'INFO')

print("Environment variables loaded successfully")
print(f"SUPABASE_URL: {os.getenv('SUPABASE_URL', 'Not set')}")
print(f"SUPABASE_KEY: {'***' if os.getenv('SUPABASE_KEY') else 'Not set'}")
print(f"OPENAI_API_KEY: {'***' if os.getenv('OPENAI_API_KEY') else 'Not set'}")
print(f"SMARTSHEET_ACCESS_TOKEN: {'***' if os.getenv('SMARTSHEET_ACCESS_TOKEN') else 'Not set'}")
