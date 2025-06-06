#!/usr/bin/env python3

import sys
import os
import logging

# Add project root to path
project_root = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, project_root)

# Set up logging
logging.basicConfig(level=logging.DEBUG)

try:
    from backend.services.agent_router import AgentRouter
    from backend.services.gpt_handler import run_llm
    from backend.services.llm_selector import select_llm
    
    print("✅ All imports successful")
    
    # Test LLM selector
    print("\n--- Testing LLM Selector ---")
    llm_config = select_llm("manager", {})
    print(f"LLM Config: {llm_config}")
    
    # Test direct LLM call with proper parameters
    print("\n--- Testing Direct LLM Call ---")
    try:
        response = run_llm(
            prompt="Hello, this is a test.",
            model=llm_config.get("model", "o4-mini"),
            api_key=llm_config.get("api_key"),
            system_prompt="You are a helpful assistant.",
            max_completion_tokens=100,  # Use max_completion_tokens for newer models
            temperature=0.7
        )
        print(f"✅ Direct LLM Response: {response[:100]}...")
    except Exception as e:
        print(f"❌ Direct LLM Error: {e}")
        import traceback
        traceback.print_exc()
    
    # Test AgentRouter
    print("\n--- Testing AgentRouter ---")
    router = AgentRouter()
    print("✅ AgentRouter created")
    
    # Test async method (but call it synchronously for testing)
    import asyncio
    
    async def test_router():
        try:
            result = await router.process_user_message(
                session_id="test-session",
                user_message="Hello, can you help me with construction documents?",
                user_id="test-user"
            )
            print(f"✅ Router Response: {result}")
        except Exception as e:
            print(f"❌ Router Error: {e}")
            import traceback
            traceback.print_exc()
    
    asyncio.run(test_router())
    
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()
