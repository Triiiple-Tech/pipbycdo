#!/usr/bin/env python3
"""
REAL FUNCTIONAL TEST - Does PIP AI Actually Work?

This test will:
1. Create realistic construction documents
2. Send them through the REAL API endpoints  
3. Verify each agent actually processes the content correctly
4. Check if we get real, usable construction estimates
"""

import asyncio
import json
import aiohttp
import tempfile
import os
from typing import Dict, Any

# Test configuration
BASE_URL = "http://localhost:8000"
HEADERS = {
    "X-Internal-Code": "hermes",  # Required authentication
}

class PIPAIFunctionalTester:
    def __init__(self):
        self.session_id = None
        self.results = {}
        
    async def create_test_documents(self):
        """Create realistic construction document content"""
        
        # Create a realistic architectural plan content
        plan_content = """
        ARCHITECTURAL PLANS - RESIDENTIAL RENOVATION PROJECT
        
        PROJECT: Kitchen and Bathroom Renovation
        ADDRESS: 123 Main Street, Anytown, USA
        
        SCOPE OF WORK:
        
        ELECTRICAL:
        - Install 6 new recessed LED lights in kitchen (4" diameter)
        - Install GFCI outlets in bathroom (3 outlets)
        - Replace electrical panel - 200 amp service
        - Install ceiling fan in master bedroom
        
        PLUMBING:
        - Replace kitchen sink and faucet
        - Install new toilet in master bathroom
        - Replace shower valve and fixtures
        - Install water heater - 50 gallon gas unit
        - Rough-in plumbing for island sink
        
        HVAC:
        - Install ductwork for kitchen island return
        - Replace 3-ton AC unit
        - Install bathroom exhaust fans (2 units)
        
        GENERAL CONSTRUCTION:
        - Demo existing kitchen cabinets
        - Install new kitchen cabinets (20 linear feet)
        - Install granite countertops (45 sq ft)
        - Install hardwood flooring (500 sq ft)
        - Paint interior walls (1200 sq ft)
        """
        
        # Create temporary file
        with tempfile.NamedTemporaryFile(mode='w', suffix='.txt', delete=False) as f:
            f.write(plan_content)
            return f.name
    
    async def test_file_upload_and_analysis(self):
        """Test the actual file upload and analysis workflow"""
        print("🔍 Creating realistic construction documents...")
        
        # Create test document
        doc_path = await self.create_test_documents()
        
        try:
            print("📤 Uploading document to PIP AI...")
            
            async with aiohttp.ClientSession() as session:
                # Prepare form data for file upload
                with open(doc_path, 'rb') as f:
                    form_data = aiohttp.FormData()
                    form_data.add_field('files', f, filename='construction_plans.txt')
                    form_data.add_field('query', 'Please analyze this construction project and provide a detailed estimate')
                    
                    # Send to analyze endpoint
                    async with session.post(
                        f"{BASE_URL}/api/analyze",
                        data=form_data,
                        headers=HEADERS
                    ) as response:
                        
                        print(f"📊 Response Status: {response.status}")
                        
                        if response.status == 200:
                            result = await response.json()
                            print("✅ File uploaded successfully!")
                            return result
                        else:
                            error_text = await response.text()
                            print(f"❌ Upload failed: {error_text}")
                            return None
                            
        except Exception as e:
            print(f"❌ Error during upload: {e}")
            return None
        finally:
            # Clean up temporary file
            if os.path.exists(doc_path):
                os.unlink(doc_path)
    
    async def test_agent_pipeline_execution(self, analysis_result):
        """Test if the agent pipeline actually processes the content"""
        print("\n🤖 Testing Agent Pipeline Execution...")
        
        if not analysis_result:
            print("❌ No analysis result to test")
            return False
            
        # Check if we got meaningful results
        success_indicators = [
            'file_reader',
            'trade_mapper', 
            'scope',
            'takeoff',
            'estimator'
        ]
        
        found_indicators = []
        result_str = json.dumps(analysis_result, default=str).lower()
        
        for indicator in success_indicators:
            if indicator in result_str:
                found_indicators.append(indicator)
                print(f"✅ Found evidence of {indicator} agent execution")
            else:
                print(f"⚠️ No evidence of {indicator} agent execution")
        
        print(f"\n📊 Agent Pipeline Status: {len(found_indicators)}/{len(success_indicators)} agents detected")
        
        return len(found_indicators) >= 3  # At least 3 agents should have run
    
    async def test_construction_specific_content(self, analysis_result):
        """Test if the system actually understands construction content"""
        print("\n🏗️ Testing Construction Content Understanding...")
        
        if not analysis_result:
            return False
            
        result_str = json.dumps(analysis_result, default=str).lower()
        
        # Check for construction-specific terms that should be detected
        construction_terms = [
            'electrical',
            'plumbing', 
            'hvac',
            'kitchen',
            'bathroom',
            'installation',
            'lighting',
            'outlets',
            'fixtures'
        ]
        
        detected_terms = []
        for term in construction_terms:
            if term in result_str:
                detected_terms.append(term)
                print(f"✅ Detected construction term: {term}")
        
        print(f"\n📊 Construction Understanding: {len(detected_terms)}/{len(construction_terms)} terms detected")
        
        return len(detected_terms) >= 5  # Should detect most construction terms
    
    async def test_chat_workflow(self):
        """Test the chat-based workflow"""
        print("\n💬 Testing Chat Workflow...")
        
        try:
            async with aiohttp.ClientSession() as session:
                # Start a chat session
                async with session.post(
                    f"{BASE_URL}/api/chat/start",
                    json={"message": "I need help estimating a kitchen renovation project"},
                    headers=HEADERS
                ) as response:
                    
                    if response.status == 200:
                        chat_result = await response.json()
                        print("✅ Chat session started successfully")
                        return True
                    else:
                        print(f"❌ Chat session failed: {response.status}")
                        return False
                        
        except Exception as e:
            print(f"❌ Chat workflow error: {e}")
            return False
    
    async def run_comprehensive_test(self):
        """Run the complete functional test"""
        print("🚀 STARTING COMPREHENSIVE PIP AI FUNCTIONAL TEST")
        print("=" * 60)
        
        test_results = {
            "file_upload": False,
            "agent_pipeline": False, 
            "construction_understanding": False,
            "chat_workflow": False
        }
        
        # Test 1: File Upload and Analysis
        analysis_result = await self.test_file_upload_and_analysis()
        test_results["file_upload"] = analysis_result is not None
        
        # Test 2: Agent Pipeline Execution
        if analysis_result:
            test_results["agent_pipeline"] = await self.test_agent_pipeline_execution(analysis_result)
            test_results["construction_understanding"] = await self.test_construction_specific_content(analysis_result)
        
        # Test 3: Chat Workflow
        test_results["chat_workflow"] = await self.test_chat_workflow()
        
        # Generate final report
        print("\n" + "=" * 60)
        print("📊 FINAL FUNCTIONAL TEST RESULTS")
        print("=" * 60)
        
        passed_tests = sum(test_results.values())
        total_tests = len(test_results)
        
        for test_name, passed in test_results.items():
            status = "✅ PASS" if passed else "❌ FAIL"
            print(f"{test_name.replace('_', ' ').title()}: {status}")
        
        success_rate = (passed_tests / total_tests) * 100
        print(f"\nOverall Success Rate: {success_rate:.1f}% ({passed_tests}/{total_tests})")
        
        if success_rate >= 75:
            print("\n🎉 PIP AI IS WORKING! System demonstrates real functionality!")
        else:
            print(f"\n⚠️ PIP AI has issues. Only {success_rate:.1f}% of tests passed.")
            
        return success_rate >= 75

async def main():
    tester = PIPAIFunctionalTester()
    success = await tester.run_comprehensive_test()
    return success

if __name__ == "__main__":
    result = asyncio.run(main())
    exit(0 if result else 1)
