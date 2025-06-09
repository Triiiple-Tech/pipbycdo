#!/usr/bin/env python3

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

import asyncio
from app.models.types import AppState
from services.intent_classifier import IntentClassifier

async def test_smartsheet_intent():
    """Test intent classification for Smartsheet URLs"""
    
    # Create a state with Smartsheet URL
    state = AppState(
        query="https://app.smartsheet.com/sheets/xchRwXGQ8HJ4pM3Fh73MM6X2H56Mhw64f4pGmPm1?view=grid",
        files=[],
        metadata={}
    )
    
    # Initialize intent classifier
    classifier = IntentClassifier()
    
    # Test intent classification
    intent, metadata = await classifier.classify_intent(state)
    
    print(f"Intent: {intent}")
    print(f"Metadata: {metadata}")
    print(f"Expected: smartsheet_integration")

if __name__ == "__main__":
    asyncio.run(test_smartsheet_intent())
