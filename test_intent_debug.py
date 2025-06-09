#!/usr/bin/env python3
"""
Quick test to debug intent classification for Smartsheet URLs
"""
import sys
import os
import asyncio

# Add project root to Python path
sys.path.insert(0, '/Users/thekiiid/pipbycdo')

from backend.services.intent_classifier import intent_classifier
from backend.app.schemas import AppState

async def test_smartsheet_intent():
    """Test intent classification for Smartsheet URL"""
    
    # Create test state with Smartsheet URL
    test_url = "https://app.smartsheet.com/sheets/xchRwXGQ8HJ4pM3Fh73MM6X2H56Mhw64f4pGmPm1?view=grid"
    state = AppState(
        query=test_url,
        files=[],
        metadata={}
    )
    
    print(f"Testing intent classification for: {test_url}")
    print("-" * 60)
    
    # Test intent classification
    intent_type, metadata = await intent_classifier.classify_intent(state)
    
    print(f"Intent Type: {intent_type}")
    print(f"Metadata: {metadata}")
    print("-" * 60)
    
    # Test URL extraction directly
    extracted_url = intent_classifier._extract_smartsheet_url(test_url)
    print(f"Extracted URL: {extracted_url}")
    
    # Test pattern matching
    has_smartsheet = bool(extracted_url)
    print(f"Has Smartsheet URL: {has_smartsheet}")

if __name__ == "__main__":
    asyncio.run(test_smartsheet_intent())
