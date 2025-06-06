#!/usr/bin/env python3
"""
Enhanced Route Planner Demonstration Script

This script demonstrates the intelligent routing capabilities of the enhanced route planner
system with realistic construction estimation scenarios.
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from backend.services.intent_classifier import intent_classifier
from backend.services.route_planner import route_planner
from backend.app.schemas import AppState, File, EstimateItem
import json


def dummy_agent(state):
    """Dummy agent function for demonstration."""
    return state


def demo_scenario(title, description, state, available_agents):
    """Run a demonstration scenario and display results."""
    print(f"\n{'='*60}")
    print(f"🎯 SCENARIO: {title}")
    print(f"📋 Description: {description}")
    print(f"{'='*60}")
    
    # Classify intent
    print("\n🧠 INTENT CLASSIFICATION:")
    intent_result = intent_classifier.classify_intent(state)
    print(f"   Intent: {intent_result['primary_intent']}")
    print(f"   Confidence: {intent_result['confidence']:.2f}")
    print(f"   Reasoning: {intent_result['reasoning']}")
    if intent_result.get('fallback_used'):
        print(f"   ⚠️  Fallback Used: {intent_result['fallback_used']}")
    
    # Plan route
    print("\n🛣️  ROUTE PLANNING:")
    route_result = route_planner.plan_route(state, available_agents)
    print(f"   Planned Sequence: {route_result['sequence']}")
    print(f"   Skipped Agents: {route_result.get('skipped_agents', [])}")
    print(f"   Optimization Applied: {route_result['optimization_applied']}")
    
    # Show benefits
    total_agents = len(available_agents)
    active_agents = len(route_result['sequence'])
    skipped_agents = total_agents - active_agents
    efficiency = (skipped_agents / total_agents) * 100 if total_agents > 0 else 0
    
    print(f"\n📊 PERFORMANCE METRICS:")
    print(f"   Total Available Agents: {total_agents}")
    print(f"   Agents to Execute: {active_agents}")
    print(f"   Agents Skipped: {skipped_agents}")
    print(f"   Efficiency Gain: {efficiency:.1f}%")
    
    return route_result


def main():
    """Run enhanced routing demonstrations."""
    print("🚀 Enhanced Route Planner Demonstration")
    print("This demo shows how the system intelligently routes through agents")
    print("based on user intent and existing data state.")
    
    # Define available agents (simulating the real manager agent setup)
    available_agents = {
        "file_reader": (dummy_agent, "processed_files_content"),
        "trade_mapper": (dummy_agent, "trade_mapping"),
        "scope": (dummy_agent, "scope_items"),
        "takeoff": (dummy_agent, "takeoff_data"),
        "estimator": (dummy_agent, None),
        "qa_validator": (dummy_agent, None),
        "exporter": (dummy_agent, None)
    }
    
    # Scenario 1: Fresh project estimation
    print("\n" + "="*80)
    print("🏗️  CONSTRUCTION ESTIMATION SCENARIOS")
    print("="*80)
    
    scenario1_state = AppState(
        query="Please provide a detailed cost estimate for this commercial building project",
        files=[
            File(filename="architectural_plans.pdf", type="pdf"),
            File(filename="specifications.docx", type="docx"),
            File(filename="site_survey.xlsx", type="xlsx")
        ]
    )
    
    demo_scenario(
        "Fresh Project Estimation",
        "New project with architectural plans, specs, and site survey",
        scenario1_state,
        available_agents
    )
    
    # Scenario 2: Export existing estimate
    scenario2_state = AppState(
        query="Export the current estimate to Excel format for the client presentation",
        estimate=[
            EstimateItem(item="Foundation Work", qty=1, unit="LS", unit_price=45000, total=45000),
            EstimateItem(item="Framing", qty=2500, unit="SF", unit_price=8.50, total=21250),
            EstimateItem(item="Electrical", qty=1, unit="LS", unit_price=35000, total=35000),
            EstimateItem(item="Plumbing", qty=1, unit="LS", unit_price=28000, total=28000)
        ]
    )
    
    demo_scenario(
        "Export Existing Estimate",
        "Complete estimate ready for client export",
        scenario2_state,
        available_agents
    )
    
    # Scenario 3: Quick estimate with partial data
    scenario3_state = AppState(
        query="Give me a quick estimate update - just need the final numbers",
        processed_files_content={"plans.pdf": "Commercial building, 5000 SF, 2-story"},
        trade_mapping=[
            {"trade": "concrete", "items": ["foundation", "slab"]},
            {"trade": "steel", "items": ["framing", "reinforcement"]}
        ],
        scope_items=[
            {"item": "Foundation work", "trade": "concrete"},
            {"item": "Steel framing", "trade": "steel"}
        ]
    )
    
    demo_scenario(
        "Quick Estimate with Existing Data",
        "Partial data available, need final estimate only",
        scenario3_state,
        available_agents
    )
    
    # Scenario 4: Data analysis only
    scenario4_state = AppState(
        query="Analyze the project scope and extract key trade items from these documents",
        files=[File(filename="project_specs.pdf", type="pdf")]
    )
    
    demo_scenario(
        "Scope Analysis Only",
        "User wants data analysis without full estimation",
        scenario4_state,
        available_agents
    )
    
    # Summary
    print("\n" + "="*80)
    print("✨ ENHANCED ROUTING SYSTEM BENEFITS")
    print("="*80)
    print("""
🎯 INTELLIGENT INTENT CLASSIFICATION
   • LLM-powered understanding of user requests
   • 6 distinct intent types with confidence scoring
   • Robust fallback for LLM failures

🛣️  SMART ROUTE OPTIMIZATION  
   • Skip agents when data already exists
   • Dependency-aware sequencing
   • Context-sensitive agent selection

⚡ PERFORMANCE IMPROVEMENTS
   • Reduced processing time for partial requests
   • Lower LLM costs through intelligent skipping
   • Faster exports and data analysis requests

🔧 ROBUST ERROR HANDLING
   • Graceful degradation when components fail
   • Comprehensive logging for debugging
   • Fallback processing maintains functionality

📊 TRANSPARENT OPERATIONS
   • Detailed routing decisions logged
   • Performance metrics tracked
   • Clear optimization reporting
""")
    
    print("\n🎉 Enhanced Route Planner demonstration complete!")
    print("The system successfully demonstrates intelligent routing based on")
    print("user intent and existing data state, providing significant")
    print("performance improvements while maintaining reliability.")


if __name__ == "__main__":
    main()
