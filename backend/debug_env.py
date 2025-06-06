#!/usr/bin/env python3
"""
Debug script to check environment variables
"""

import sys
import os

# Add parent directory to path and load environment variables
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import load_env  # type: ignore # noqa: F401
# Environment variables are loaded by importing load_env module
_ = load_env  # Explicitly reference to avoid unused import warning

def check_environment():
    """Check what environment variables are loaded"""
    print("=== Environment Variables ===")
    print(f"SUPABASE_URL: {os.environ.get('SUPABASE_URL', 'NOT SET')}")
    print(f"SUPABASE_KEY: {os.environ.get('SUPABASE_KEY', 'NOT SET')[:50]}..." if os.environ.get('SUPABASE_KEY') else "SUPABASE_KEY: NOT SET")
    print(f"SUPABASE_ANON_KEY: {os.environ.get('SUPABASE_ANON_KEY', 'NOT SET')[:50]}..." if os.environ.get('SUPABASE_ANON_KEY') else "SUPABASE_ANON_KEY: NOT SET")
    print(f"SUPABASE_SERVICE_ROLE_KEY: {os.environ.get('SUPABASE_SERVICE_ROLE_KEY', 'NOT SET')[:50]}..." if os.environ.get('SUPABASE_SERVICE_ROLE_KEY') else "SUPABASE_SERVICE_ROLE_KEY: NOT SET")
    
    # Test if we can make a basic request to the Supabase URL
    import requests
    url = os.environ.get('SUPABASE_URL')
    if url:
        try:
            # Test with anon key
            anon_key = os.environ.get('SUPABASE_ANON_KEY')
            if anon_key:
                headers = {
                    'apikey': anon_key,
                    'Authorization': f'Bearer {anon_key}',
                    'Content-Type': 'application/json'
                }
                response = requests.get(f"{url}/rest/v1/", headers=headers)
                print(f"\n=== Test with ANON KEY ===")
                print(f"Status: {response.status_code}")
                print(f"Response: {response.text[:200]}...")
            
            # Test with service role key
            service_key = os.environ.get('SUPABASE_SERVICE_ROLE_KEY')
            if service_key:
                headers = {
                    'apikey': service_key,
                    'Authorization': f'Bearer {service_key}',
                    'Content-Type': 'application/json'
                }
                response = requests.get(f"{url}/rest/v1/", headers=headers)
                print(f"\n=== Test with SERVICE ROLE KEY ===")
                print(f"Status: {response.status_code}")
                print(f"Response: {response.text[:200]}...")
                
        except Exception as e:
            print(f"HTTP test failed: {e}")

if __name__ == "__main__":
    check_environment()
