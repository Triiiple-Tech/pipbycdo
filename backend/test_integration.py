#!/usr/bin/env python3
"""
Integration test for the modernized Team-of-Agents system.
Tests the complete pipeline with all modernized agents.
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.schemas import AppState, EstimateItem, LLMConfig
from agents.file_reader_agent import handle as file_reader_handle
from agents.trade_mapper_agent import handle as trade_mapper_handle
from agents.scope_agent import handle as scope_handle
from agents.takeoff_agent import handle as takeoff_handle
from agents.estimator_agent import handle as estimator_handle
from agents.qa_validator_agent import handle as qa_validator_handle
from agents.exporter_agent import handle as exporter_handle


def test_integration_pipeline():
    """Test complete pipeline integration with all modernized agents."""
    print("🚀 Starting Team-of-Agents Integration Test")
    
    # Initialize state with simulated processed content (as if it came from File Reader)
    state = AppState(
        content="Install 100 linear feet of 2-inch PVC pipe and 50 linear feet of 4-inch PVC pipe. Include 10 PVC fittings.",
        processed_files_content={
            "test_file.txt": "Install 100 linear feet of 2-inch PVC pipe and 50 linear feet of 4-inch PVC pipe. Include 10 PVC fittings."
        },
        llm_config=LLMConfig(
            model="gpt-4o-mini",
            api_key="test-key",  # Will use fallback methods if no real key
            params={"temperature": 0, "max_tokens": 1000}
        )
    )
    
    print(f"✅ Initial state created with processed content: {(state.content or '')[:50]}...")
    
    # Step 1: File Reader - Skip since we're simulating processed content
    print("📄 Step 1: File Reader - Simulated (content pre-processed)")
    print(f"✅ File reading complete: {len(state.processed_files_content or {})} files processed")
    
    # Step 2: Trade Mapper
    print("🗺️  Step 2: Trade Mapper - Mapping trades")
    state_dict = trade_mapper_handle(state.model_dump())
    state = AppState(**state_dict)
    print(f"✅ Trade mapping complete: {len(state.trade_mapping or [])}")
    
    # Step 3: Scope Agent
    print("📋 Step 3: Scope Agent - Extracting scope items")
    state_dict = scope_handle(state.model_dump())
    state = AppState(**state_dict)
    print(f"✅ Scope extraction complete: {len(state.scope_items or [])} scope items")
    
    # Step 4: Takeoff Agent
    print("📏 Step 4: Takeoff Agent - Generating quantities")
    state_dict = takeoff_handle(state.model_dump())
    state = AppState(**state_dict)
    print(f"✅ Takeoff complete: {len(state.takeoff_data or [])} takeoff items")
    
    # Step 5: Estimator Agent
    print("💰 Step 5: Estimator Agent - Calculating pricing")
    state_dict = estimator_handle(state.model_dump())
    state = AppState(**state_dict)
    print(f"✅ Estimation complete: {len(state.estimate or [])} estimate items")
    
    # Step 6: QA Validator Agent
    print("🔍 Step 6: QA Validator - Validating results")
    state_dict = qa_validator_handle(state.model_dump())
    state = AppState(**state_dict)
    print(f"✅ QA validation complete: {len(state.qa_findings or [])} findings")
    
    # Step 7: Exporter Agent
    print("📤 Step 7: Exporter Agent - Exporting results")
    state_dict = exporter_handle(state.model_dump())
    state = AppState(**state_dict)
    print(f"✅ Export complete: {state.export}")
    
    # Summary
    print("\n📊 Integration Test Summary:")
    print(f"   • Content processed: ✅")
    print(f"   • Files processed: {len(state.processed_files_content or {})}")
    print(f"   • Trades mapped: {len(state.trade_mapping or [])}")
    print(f"   • Scope items: {len(state.scope_items or [])}")
    print(f"   • Takeoff items: {len(state.takeoff_data or [])}")
    print(f"   • Estimate items: {len(state.estimate or [])}")
    print(f"   • QA findings: {len(state.qa_findings or [])}")
    print(f"   • Export status: {'✅' if state.export else '❌'}")
    print(f"   • Meeting log entries: {len(state.meeting_log or [])}")
    print(f"   • Agent trace entries: {len(state.agent_trace or [])}")
    
    # Validate key aspects
    success = True
    if not (state.scope_items and len(state.scope_items) > 0):
        print("❌ No scope items generated")
        success = False
    if not (state.takeoff_data and len(state.takeoff_data) > 0):
        print("❌ No takeoff data generated")
        success = False
    if not (state.estimate and len(state.estimate) > 0):
        print("❌ No estimate generated")
        success = False
    if not state.export:
        print("❌ Export failed")
        success = False
    
    if success:
        print("\n🎉 Integration test PASSED! All agents working together successfully.")
        # Print sample of results
        if state.estimate:
            total = sum(item.total for item in state.estimate)
            print(f"   📈 Total estimate value: ${total:,.2f}")
        if state.qa_findings:
            critical_findings = [f for f in state.qa_findings if f.get('severity') == 'high']
            print(f"   🚨 Critical QA findings: {len(critical_findings)}")
    else:
        print("\n❌ Integration test FAILED! Some agents are not working properly.")
    
    return success


if __name__ == "__main__":
    test_integration_pipeline()
