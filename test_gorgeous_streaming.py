#!/usr/bin/env python3
"""
Test script for gorgeous agent-to-agent streaming conversation
Demonstrates the beautiful in-chat streaming where agents talk to each other
"""

import asyncio
import json
import time
from datetime import datetime, timezone
from backend.routes.chat import (
    broadcast_agent_conversation,
    broadcast_manager_thinking,
    broadcast_agent_substep,
    broadcast_workflow_state_change,
    broadcast_brain_allocation
)

async def simulate_gorgeous_agent_conversation(session_id: str):
    """
    Simulate a gorgeous agent-to-agent conversation for demonstration
    This shows how agents appear to be talking to each other in real-time
    """
    print("🎬 Starting gorgeous agent conversation simulation...")
    
    # Manager starts thinking
    await broadcast_manager_thinking(session_id, {
        "thinking_type": "initial_analysis",
        "analysis": "I need to analyze this construction document. Let me route this to the appropriate agents for processing.",
        "confidence": 0.95
    })
    
    await asyncio.sleep(1.5)
    
    # Manager talks to File Reader Agent
    await broadcast_agent_conversation(
        session_id=session_id,
        agent_name="Manager Agent",
        content="I've received a construction document that needs analysis. File Reader Agent, can you extract the key information from this PDF?",
        message_type="handoff",
        target_agent="File Reader Agent",
        metadata={"priority": "high", "document_type": "construction_plans"}
    )
    
    await asyncio.sleep(2)
    
    # File Reader Agent responds
    await broadcast_agent_conversation(
        session_id=session_id,
        agent_name="File Reader Agent",
        content="Absolutely! I'm analyzing the document structure now. I can see this is a 45-page construction specification with detailed material lists and scope definitions.",
        message_type="action",
        metadata={"pages_detected": 45, "document_confidence": 0.92}
    )
    
    await broadcast_agent_substep(session_id, "File Reader Agent", "Extracting text from pages 1-15", 25.0)
    await asyncio.sleep(1)
    
    await broadcast_agent_substep(session_id, "File Reader Agent", "Processing material specifications", 50.0)
    await asyncio.sleep(1)
    
    await broadcast_agent_substep(session_id, "File Reader Agent", "Identifying trade categories", 75.0)
    await asyncio.sleep(1)
    
    await broadcast_agent_substep(session_id, "File Reader Agent", "Extraction complete", 100.0)
    await asyncio.sleep(0.5)
    
    # File Reader Agent completes and hands off
    await broadcast_agent_conversation(
        session_id=session_id,
        agent_name="File Reader Agent",
        content="✅ Document analysis complete! I've extracted 247 line items across 8 trade categories. The scope includes electrical, plumbing, HVAC, and structural work. Handing this off to Trade Mapper Agent for categorization.",
        message_type="result",
        target_agent="Trade Mapper Agent",
        metadata={"line_items": 247, "trade_categories": 8}
    )
    
    await asyncio.sleep(1.5)
    
    # Manager allocates brain power
    await broadcast_brain_allocation(session_id, "Trade Mapper Agent", {
        "model_selected": "gpt-4o",
        "reasoning": "Complex trade categorization requires advanced reasoning capabilities",
        "token_budget": 2000,
        "expected_accuracy": 0.94
    })
    
    await asyncio.sleep(1)
    
    # Trade Mapper Agent starts working
    await broadcast_agent_conversation(
        session_id=session_id,
        agent_name="Trade Mapper Agent",
        content="Perfect! I'm now categorizing these 247 items. I can see some complex multi-trade items that need careful classification.",
        message_type="thinking",
        metadata={"complexity_score": 0.78}
    )
    
    await broadcast_agent_substep(session_id, "Trade Mapper Agent", "Categorizing electrical items", 20.0)
    await asyncio.sleep(0.8)
    
    await broadcast_agent_substep(session_id, "Trade Mapper Agent", "Processing HVAC components", 40.0)
    await asyncio.sleep(0.8)
    
    await broadcast_agent_substep(session_id, "Trade Mapper Agent", "Analyzing structural elements", 60.0)
    await asyncio.sleep(0.8)
    
    await broadcast_agent_substep(session_id, "Trade Mapper Agent", "Finalizing trade assignments", 80.0)
    await asyncio.sleep(0.8)
    
    await broadcast_agent_substep(session_id, "Trade Mapper Agent", "Trade mapping complete", 100.0)
    await asyncio.sleep(0.5)
    
    # Trade Mapper hands off to Takeoff Agent
    await broadcast_agent_conversation(
        session_id=session_id,
        agent_name="Trade Mapper Agent",
        content="🎯 Trade mapping complete! I've successfully categorized all items: 67 electrical, 45 plumbing, 52 HVAC, 38 structural, and 45 other trades. Takeoff Agent, you're up for quantity calculations!",
        message_type="handoff",
        target_agent="Takeoff Agent",
        metadata={"electrical": 67, "plumbing": 45, "hvac": 52, "structural": 38, "other": 45}
    )
    
    await asyncio.sleep(1.5)
    
    # Workflow state change
    await broadcast_workflow_state_change(session_id, "phase_transition", {
        "current_stage": "quantity_takeoff",
        "previous_stage": "trade_mapping",
        "completion_percentage": 45.0,
        "estimated_time_remaining": "3 minutes"
    })
    
    await asyncio.sleep(1)
    
    # Takeoff Agent starts working
    await broadcast_agent_conversation(
        session_id=session_id,
        agent_name="Takeoff Agent",
        content="Excellent work, Trade Mapper! I'm now calculating precise quantities for each trade. I notice some items require complex geometric calculations.",
        message_type="action",
        metadata={"calculation_complexity": "high"}
    )
    
    await broadcast_agent_substep(session_id, "Takeoff Agent", "Calculating linear footage for electrical", 15.0)
    await asyncio.sleep(1)
    
    await broadcast_agent_substep(session_id, "Takeoff Agent", "Computing HVAC ductwork volumes", 35.0)
    await asyncio.sleep(1)
    
    await broadcast_agent_substep(session_id, "Takeoff Agent", "Measuring structural steel quantities", 55.0)
    await asyncio.sleep(1)
    
    await broadcast_agent_substep(session_id, "Takeoff Agent", "Finalizing quantity calculations", 85.0)
    await asyncio.sleep(1)
    
    await broadcast_agent_substep(session_id, "Takeoff Agent", "Takeoff calculations complete", 100.0)
    await asyncio.sleep(0.5)
    
    # Takeoff Agent hands off to Estimator
    await broadcast_agent_conversation(
        session_id=session_id,
        agent_name="Takeoff Agent",
        content="📐 Quantity takeoff complete! Total project scope: 12,450 sq ft, 2,340 linear ft of conduit, 890 fixtures, and 156 tons of HVAC equipment. Estimator Agent, ready for your pricing magic!",
        message_type="handoff",
        target_agent="Estimator Agent",
        metadata={"total_sqft": 12450, "linear_ft": 2340, "fixtures": 890, "hvac_tons": 156}
    )
    
    await asyncio.sleep(1.5)
    
    # Brain allocation for estimator
    await broadcast_brain_allocation(session_id, "Estimator Agent", {
        "model_selected": "gpt-4o-mini",
        "reasoning": "Cost estimation with current market data - efficient model sufficient",
        "token_budget": 1500,
        "market_data_access": True
    })
    
    await asyncio.sleep(1)
    
    # Estimator Agent works
    await broadcast_agent_conversation(
        session_id=session_id,
        agent_name="Estimator Agent",
        content="💰 Perfect quantities, Takeoff Agent! I'm now applying current market rates and regional pricing adjustments. Accessing latest material costs...",
        message_type="action",
        metadata={"market_data_date": "2025-06-10", "region": "midwest"}
    )
    
    await broadcast_agent_substep(session_id, "Estimator Agent", "Applying electrical pricing", 25.0)
    await asyncio.sleep(1)
    
    await broadcast_agent_substep(session_id, "Estimator Agent", "Calculating labor costs", 50.0)
    await asyncio.sleep(1)
    
    await broadcast_agent_substep(session_id, "Estimator Agent", "Adding overhead and profit", 75.0)
    await asyncio.sleep(1)
    
    await broadcast_agent_substep(session_id, "Estimator Agent", "Cost estimation complete", 100.0)
    await asyncio.sleep(0.5)
    
    # Final workflow state
    await broadcast_workflow_state_change(session_id, "completion", {
        "current_stage": "complete",
        "completion_percentage": 100.0,
        "total_processing_time": "8 minutes",
        "final_estimate": "$847,250"
    })
    
    await asyncio.sleep(1)
    
    # Estimator Agent delivers final result
    await broadcast_agent_conversation(
        session_id=session_id,
        agent_name="Estimator Agent",
        content="🎉 Complete estimate ready! Total project cost: $847,250 (±5%). Breakdown: $312k electrical, $198k HVAC, $156k plumbing, $181k other trades. Manager Agent, the full analysis is ready for the client!",
        message_type="result",
        target_agent="Manager Agent",
        metadata={
            "total_cost": 847250,
            "confidence_interval": 0.05,
            "electrical": 312000,
            "hvac": 198000,
            "plumbing": 156000,
            "other": 181250
        }
    )
    
    await asyncio.sleep(1.5)
    
    # Manager Agent concludes
    await broadcast_agent_conversation(
        session_id=session_id,
        agent_name="Manager Agent",
        content="✨ Outstanding teamwork! The complete construction analysis is ready. We've successfully processed 247 line items, calculated precise quantities, and delivered a comprehensive $847k estimate. The client will receive a detailed breakdown with full transparency.",
        message_type="result",
        metadata={
            "processing_complete": True,
            "total_items_processed": 247,
            "agents_involved": 4,
            "processing_time_minutes": 8
        }
    )
    
    print("🎬 Gorgeous agent conversation simulation complete!")
    print("✨ This demonstrates how agents appear to talk to each other in real-time")
    print("💫 Users see a beautiful streaming conversation between AI agents")

async def main():
    """Main test function"""
    session_id = "test-gorgeous-streaming-session"
    
    print("🚀 Testing Gorgeous Agent-to-Agent Streaming")
    print("=" * 60)
    print(f"📡 Session ID: {session_id}")
    print(f"⏰ Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()
    
    try:
        await simulate_gorgeous_agent_conversation(session_id)
        print()
        print("✅ Test completed successfully!")
        print("🎨 The frontend will display this as a gorgeous conversation")
        print("💬 Each agent appears to be talking to the others in real-time")
        print("🌟 Users see thinking, actions, handoffs, and results streaming live")
        
    except Exception as e:
        print(f"❌ Test failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(main())
