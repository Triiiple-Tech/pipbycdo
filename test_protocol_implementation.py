#!/usr/bin/env python3
"""
Test script to verify all agents have been updated with Autonomous Agentic Manager Protocol brain prompts
"""

import sys
import os

# Add backend to path
sys.path.append('/Users/thekiiid/pipbycdo/backend')

def test_agent_brain_prompts():
    """Test that all agents have the correct brain prompts from the protocol"""
    
    print("🧠 Testing Agent Brain Prompts from Autonomous Agentic Manager Protocol")
    print("=" * 80)
    
    agents_to_test = [
        ('FileReaderAgent', '/Users/thekiiid/pipbycdo/backend/agents/file_reader_agent.py'),
        ('TradeMapperAgent', '/Users/thekiiid/pipbycdo/backend/agents/trade_mapper_agent.py'),
        ('ScopeAgent', '/Users/thekiiid/pipbycdo/backend/agents/scope_agent.py'),
        ('TakeoffAgent', '/Users/thekiiid/pipbycdo/backend/agents/takeoff_agent.py'),
        ('EstimatorAgent', '/Users/thekiiid/pipbycdo/backend/agents/estimator_agent.py'),
        ('ExporterAgent', '/Users/thekiiid/pipbycdo/backend/agents/exporter_agent.py'),
        ('SmartsheetAgent', '/Users/thekiiid/pipbycdo/backend/agents/smartsheet_agent.py')
    ]
    
    expected_prompts = {
        'FileReaderAgent': "You are the FileReaderAgent. Your sole task is to extract all readable content from all files",
        'TradeMapperAgent': "You are the TradeMapperAgent. Your job is to analyze processed_files_content and identify",
        'ScopeAgent': "You are the ScopeAgent. Use trade_mapping to extract all detailed scope items",
        'TakeoffAgent': "You are the TakeoffAgent. Accept scope_items and extract or calculate",
        'EstimatorAgent': "You are the EstimatorAgent. Use takeoff_data to generate a complete",
        'ExporterAgent': "You are the ExporterAgent. Accept any prior output and convert it",
        'SmartsheetAgent': "You are the SmartsheetAgent. Accept the user's Smartsheet token"
    }
    
    all_passed = True
    
    for agent_name, file_path in agents_to_test:
        print(f"\n🔍 Testing {agent_name}...")
        
        try:
            with open(file_path, 'r') as f:
                content = f.read()
            
            # Check if BRAIN_PROMPT exists
            if 'BRAIN_PROMPT' not in content:
                print(f"❌ {agent_name}: BRAIN_PROMPT not found")
                all_passed = False
                continue
            
            # Check if the expected prompt text is present
            expected_start = expected_prompts.get(agent_name, '')
            if expected_start and expected_start not in content:
                print(f"❌ {agent_name}: Expected prompt text not found")
                all_passed = False
                continue
            
            # Check if brain_prompt is assigned in __init__
            if 'self.brain_prompt = self.BRAIN_PROMPT' not in content:
                print(f"❌ {agent_name}: brain_prompt not assigned in __init__")
                all_passed = False
                continue
                
            print(f"✅ {agent_name}: Brain prompt correctly implemented")
            
        except Exception as e:
            print(f"❌ {agent_name}: Error reading file - {e}")
            all_passed = False
    
    print("\n" + "=" * 80)
    if all_passed:
        print("🎉 ALL AGENTS SUCCESSFULLY UPDATED WITH PROTOCOL BRAIN PROMPTS!")
        print("✅ Ready for Autonomous Agentic Manager Protocol implementation")
    else:
        print("❌ Some agents need brain prompt updates")
        return False
    
    return True

def test_manager_agent_integration():
    """Test that ManagerAgent is properly set up for the protocol"""
    
    print("\n🔧 Testing ManagerAgent Protocol Integration")
    print("=" * 60)
    
    try:
        with open('/Users/thekiiid/pipbycdo/backend/agents/manager_agent.py', 'r') as f:
            content = f.read()
        
        # Check for key protocol methods
        required_methods = [
            '_universal_intake',
            '_execute_autonomous_workflow',
            '_handle_agent_error',
            '_handle_agent_exception'
        ]
        
        for method in required_methods:
            if method not in content:
                print(f"❌ ManagerAgent: Missing method {method}")
                return False
            else:
                print(f"✅ ManagerAgent: Found method {method}")
        
        print("✅ ManagerAgent: Protocol integration looks good")
        return True
        
    except Exception as e:
        print(f"❌ ManagerAgent: Error reading file - {e}")
        return False

if __name__ == "__main__":
    print("🚀 PIP AI - Autonomous Agentic Manager Protocol Verification")
    print("Testing agent brain prompt implementations...")
    
    success1 = test_agent_brain_prompts()
    success2 = test_manager_agent_integration()
    
    if success1 and success2:
        print("\n🎯 PROTOCOL IMPLEMENTATION STATUS: READY")
        print("All agents updated with exact brain prompts from protocol document")
        print("ManagerAgent properly configured for autonomous workflow")
        sys.exit(0)
    else:
        print("\n⚠️  PROTOCOL IMPLEMENTATION STATUS: NEEDS WORK")
        sys.exit(1)
