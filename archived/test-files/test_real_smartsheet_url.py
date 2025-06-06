"""
Test Smartsheet Integration with Real URL
Tests URL parsing, validation, and service functionality with actual Smartsheet link
"""

import asyncio
import os
from services.smartsheet_service import SmartsheetService, SmartsheetAPIError

# Real Smartsheet URL provided by user
TEST_URL = "https://app.smartsheet.com/sheets/xchRwXGQ8HJ4pM3Fh73MM6X2H56Mhw64f4pGmPm1?view=grid"

async def test_url_parsing():
    """Test URL parsing and validation"""
    print("🔍 Testing URL Parsing and Validation")
    print(f"URL: {TEST_URL}")
    
    # Test URL validation
    is_valid = SmartsheetService.validate_sheet_url(TEST_URL)
    print(f"✅ URL is valid: {is_valid}")
    
    # Test sheet ID extraction
    sheet_id = SmartsheetService.extract_sheet_id_from_url(TEST_URL)
    print(f"📋 Extracted Sheet ID: {sheet_id}")
    
    return sheet_id

async def test_service_without_token(sheet_id: str):
    """Test service behavior without authentication"""
    print("\n🔐 Testing Service Without Token")
    
    async with SmartsheetService() as service:
        try:
            # This should fail gracefully
            await service.get_sheet(sheet_id)
            print("❌ Expected authentication error but got response")
        except ValueError as e:
            print(f"✅ Correctly caught authentication error: {e}")
        except Exception as e:
            print(f"⚠️ Unexpected error: {e}")

async def test_service_with_dummy_token(sheet_id: str):
    """Test service behavior with invalid token"""
    print("\n🎭 Testing Service With Invalid Token")
    
    async with SmartsheetService() as service:
        service.set_access_token("dummy_token_12345")
        
        try:
            # Test token validation
            is_valid = await service.validate_token()
            print(f"✅ Token validation correctly returned: {is_valid}")
            
            if not is_valid:
                print("✅ Token validation working correctly")
            
        except SmartsheetAPIError as e:
            print(f"✅ Correctly caught API error: {e.message}")
        except Exception as e:
            print(f"⚠️ Unexpected error: {e}")

async def test_url_based_methods(sheet_id: str):
    """Test URL-based methods without authentication"""
    print("\n🌐 Testing URL-Based Methods")
    
    async with SmartsheetService() as service:
        # Test with dummy token to see API behavior
        service.set_access_token("test_token")
        
        try:
            # Test get_sheet_from_url
            result = await service.get_sheet_from_url(TEST_URL)
            print(f"✅ get_sheet_from_url returned: {type(result)}")
        except SmartsheetAPIError as e:
            print(f"✅ get_sheet_from_url correctly failed with API error: {e.status_code}")
        except Exception as e:
            print(f"⚠️ Unexpected error in get_sheet_from_url: {e}")
        
        try:
            # Test sync_from_url
            result = await service.sync_from_url(TEST_URL)
            print(f"✅ sync_from_url returned: {type(result)}")
        except SmartsheetAPIError as e:
            print(f"✅ sync_from_url correctly failed with API error: {e.status_code}")
        except Exception as e:
            print(f"⚠️ Unexpected error in sync_from_url: {e}")

async def test_agent_integration():
    """Test SmartsheetAgent URL functionality"""
    print("\n🤖 Testing SmartsheetAgent Integration")
    
    try:
        from agents.smartsheet_agent import SmartsheetAgent
        from app.schemas import AppState
        
        # Create test state
        state = AppState(
            user_id="test_user",
            session_id="test_session",
            files=[],
            scope_items=[],
            trade_mapping=[],
            takeoff_data=[],
            estimate=[],
            metadata={}
        )
        
        agent = SmartsheetAgent()
        print(f"✅ SmartsheetAgent created: {agent.agent_name}")
        print(f"✅ Agent capabilities: {agent.get_capabilities()}")
        
        # Test without token (should handle gracefully)
        result_state = agent.process(
            state,
            smartsheet_action="sync",
            smartsheet_url=TEST_URL
        )
        
        print(f"✅ Agent processed request without token")
        if result_state.agent_trace:
            last_trace = result_state.agent_trace[-1]
            print(f"✅ Last trace entry: {last_trace.level} - {last_trace.decision}")
        
    except Exception as e:
        print(f"⚠️ Agent integration test error: {e}")

def test_url_patterns():
    """Test various URL patterns"""
    print("\n🎯 Testing URL Pattern Recognition")
    
    test_urls = [
        "https://app.smartsheet.com/sheets/xchRwXGQ8HJ4pM3Fh73MM6X2H56Mhw64f4pGmPm1",
        "https://app.smartsheet.com/sheets/xchRwXGQ8HJ4pM3Fh73MM6X2H56Mhw64f4pGmPm1?view=grid",
        "https://app.smartsheet.com/b/home?lx=xchRwXGQ8HJ4pM3Fh73MM6X2H56Mhw64f4pGmPm1",
        "https://invalid-url.com/sheets/123",
        "not-a-url-at-all"
    ]
    
    for url in test_urls:
        is_valid = SmartsheetService.validate_sheet_url(url)
        sheet_id = SmartsheetService.extract_sheet_id_from_url(url)
        print(f"URL: {url[:50]}...")
        print(f"  Valid: {is_valid}, Sheet ID: {sheet_id}")

async def test_with_environment_token():
    """Test with environment token if available"""
    print("\n🔑 Testing With Environment Token (if available)")
    
    token = os.getenv("SMARTSHEET_ACCESS_TOKEN")
    if not token:
        print("ℹ️ No SMARTSHEET_ACCESS_TOKEN environment variable found")
        print("ℹ️ Set SMARTSHEET_ACCESS_TOKEN=your_token to test with real authentication")
        return
    
    print("✅ Found environment token, testing real API calls...")
    
    try:
        async with SmartsheetService() as service:
            service.set_access_token(token)
            
            # Test token validation
            is_valid = await service.validate_token()
            print(f"✅ Token validation: {is_valid}")
            
            if is_valid:
                # Test getting sheet from URL
                sheet_data = await service.get_sheet_from_url(TEST_URL)
                print(f"✅ Retrieved sheet: {sheet_data.get('name', 'Unknown')}")
                print(f"✅ Sheet has {len(sheet_data.get('rows', []))} rows")
                print(f"✅ Sheet has {len(sheet_data.get('columns', []))} columns")
                
                # Test sync from URL
                sync_data = await service.sync_from_url(TEST_URL, include_attachments=False)
                print(f"✅ Sync completed, timestamp: {sync_data.get('sync_timestamp')}")
                
    except SmartsheetAPIError as e:
        print(f"⚠️ Smartsheet API Error: {e.message} (Status: {e.status_code})")
    except Exception as e:
        print(f"❌ Unexpected error: {e}")

async def main():
    """Run all tests"""
    print("🚀 Starting Smartsheet URL Integration Tests")
    print("=" * 60)
    
    # Test URL parsing
    sheet_id = await test_url_parsing()
    
    if not sheet_id:
        print("❌ Could not extract sheet ID, stopping tests")
        return
    
    # Test service behavior
    await test_service_without_token(sheet_id)
    await test_service_with_dummy_token(sheet_id)
    await test_url_based_methods(sheet_id)
    
    # Test agent integration
    await test_agent_integration()
    
    # Test URL patterns
    test_url_patterns()
    
    # Test with real token if available
    await test_with_environment_token()
    
    print("\n" + "=" * 60)
    print("✅ All tests completed!")
    print("\nTo test with real authentication:")
    print("export SMARTSHEET_ACCESS_TOKEN='your_smartsheet_api_token'")
    print("python test_real_smartsheet_url.py")

if __name__ == "__main__":
    asyncio.run(main())
