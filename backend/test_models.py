#!/usr/bin/env python3
"""Test script to list available OpenAI models"""

import os
import sys
from openai import OpenAI

print("🔍 Starting OpenAI model discovery...")

# Load environment variables manually
env_file = "/Users/thekiiid/pipbycdo/.env"
if os.path.exists(env_file):
    print(f"📁 Loading environment from: {env_file}")
    with open(env_file, 'r') as f:
        for line in f:
            if '=' in line and not line.strip().startswith('#'):
                key, value = line.strip().split('=', 1)
                os.environ[key] = value
    print("✅ Environment loaded")
else:
    print(f"❌ Environment file not found: {env_file}")

def test_models():
    """Test which models are available"""
    
    # Try different API keys
    api_keys = [
        ("OPENAI_4o_KEY", os.getenv("OPENAI_4o_KEY")),
        ("OPENAI_o4-mini_KEY", os.getenv("OPENAI_o4-mini_KEY")),
        ("OPENAI_o3_KEY", os.getenv("OPENAI_o3_KEY")),
        ("OPENAI_4.1_KEY", os.getenv("OPENAI_4.1_KEY")),
    ]
    
    for key_name, api_key in api_keys:
        if not api_key:
            print(f"❌ {key_name}: Not found")
            continue
            
        print(f"✅ {key_name}: Found (ends with ...{api_key[-4:]})")
        
        try:
            client = OpenAI(api_key=api_key)
            
            # List available models
            models = client.models.list()
            model_names = [model.id for model in models.data]
            
            print(f"   📋 Available models ({len(model_names)} total):")
            
            # Filter for relevant models
            relevant_models = []
            for model in model_names:
                if any(keyword in model.lower() for keyword in ['gpt-4', 'o3', 'o4', 'chatgpt']):
                    relevant_models.append(model)
            
            relevant_models.sort()
            for model in relevant_models[:20]:  # Show first 20 relevant models
                print(f"      • {model}")
                
            if len(relevant_models) > 20:
                print(f"      ... and {len(relevant_models) - 20} more")
            
            # Test a simple completion with a known model
            test_models = ['gpt-4o', 'gpt-4o-mini', 'o3-mini', 'o4-mini', 'gpt-4-turbo']
            
            print(f"   🧪 Testing model availability:")
            for test_model in test_models:
                if test_model in model_names:
                    try:
                        response = client.chat.completions.create(
                            model=test_model,
                            messages=[{"role": "user", "content": "Hello"}],
                            max_tokens=5
                        )
                        print(f"      ✅ {test_model}: Working")
                    except Exception as e:
                        print(f"      ❌ {test_model}: Error - {str(e)[:50]}...")
                else:
                    print(f"      ❓ {test_model}: Not in model list")
            
            break  # Use first working API key
            
        except Exception as e:
            print(f"   ❌ Error with {key_name}: {str(e)[:100]}...")
            continue

if __name__ == "__main__":
    test_models()
