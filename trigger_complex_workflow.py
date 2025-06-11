#!/usr/bin/env python3
"""
Trigger Complex Workflow for Enhanced Streaming
Sends a realistic construction project to activate all streaming features
"""

import requests

# Session ID from our previous creation
SESSION_ID = "02fe5641-7aa4-46bb-911a-d25c24a9f16f"
API_URL = "http://localhost:8000/api"

def trigger_complex_construction_workflow():
    """Send a complex construction project that should trigger all agents"""
    
    complex_construction_request = {
        "content": """URGENT: Complete cost analysis needed for large commercial renovation project.

PROJECT OVERVIEW:
Building: 75,000 sq ft office complex renovation
Location: San Francisco, CA (Union Square District)
Timeline: 8 months (Must start in 30 days)
Budget Range: $3.5 - 5.2 million
Project Type: Class A office space renovation

DETAILED SCOPE OF WORK:

1. ELECTRICAL SYSTEMS (Priority: Critical)
   - Complete electrical service upgrade to 800A
   - LED lighting retrofit (750+ fixtures)
   - Emergency power and generator systems
   - Data center and telecommunications infrastructure
   - Security systems and access control
   - Fire alarm system upgrades
   Materials Needed: panels, conduit, wire, fixtures, controls
   
2. HVAC SYSTEMS (Priority: Critical)
   - New VAV system installation (15 zones)
   - Rooftop unit replacements (4 units, 25-ton each)
   - Ductwork modifications throughout building
   - Building automation system (BAS) integration
   - Energy recovery units and heat exchangers
   - Zone control and monitoring systems
   Materials Needed: ductwork, units, controls, dampers, sensors

3. PLUMBING WORK (Priority: High)
   - Complete restroom renovations (12 restrooms)
   - Break room and kitchen facility upgrades
   - Fire sprinkler system modifications
   - Water heater upgrades (2 commercial units)
   - Pipe replacement in mechanical rooms
   Materials Needed: fixtures, piping, water heaters, sprinkler heads

4. GENERAL CONSTRUCTION (Priority: Medium-High)
   - Demolition of 25,000 sq ft of existing offices
   - New partition walls and glass office fronts
   - Suspended ceiling installation (50,000 sq ft)
   - Flooring replacement (carpet, tile, hardwood)
   - Paint and architectural finishes
   - Door and hardware installation (150+ doors)
   Materials Needed: framing, drywall, flooring, ceiling tiles, paint

ANALYSIS REQUIREMENTS:
✓ Process through ALL analysis agents
✓ Generate detailed material takeoffs by trade
✓ Calculate labor hours with crew composition
✓ Include equipment and tool rental costs
✓ Provide phased timeline with critical path
✓ Risk analysis with contingency recommendations
✓ Market rate pricing (San Francisco rates)
✓ Export ready deliverables

DECISION POINTS NEEDED:
- Selection of specific electrical panel manufacturers
- HVAC equipment brand preferences
- Flooring material choices (3 options per area)
- Project phasing strategy approval
- Budget allocation by trade approval

COMPLEXITY FACTORS:
- Historic building (permit complications)
- Active tenant spaces (phased work required)
- Seismic retrofit requirements
- LEED certification goals
- Union labor requirements
- Limited material storage space

Please analyze this project using your complete autonomous workflow including:
1. Trade identification and classification
2. Detailed scope breakdown by trade and phase
3. Quantity takeoffs with measurement calculations
4. Cost estimation with current SF market rates
5. Timeline analysis with resource allocation
6. Risk assessment and mitigation strategies

This is a high-value project requiring immediate detailed analysis. Please proceed with full pipeline processing and provide real-time progress updates.""",
        
        "metadata": {
            "project_type": "commercial_renovation",
            "complexity": "very_high",
            "building_size_sqft": 75000,
            "location": "san_francisco_ca",
            "timeline_months": 8,
            "budget_range_millions": "3.5-5.2",
            "priority": "urgent",
            "trades_count": 4,
            "decision_points": 5,
            "requires_full_analysis": True,
            "requires_user_decisions": True,
            "test_scenario": "enhanced_streaming_validation"
        }
    }
    
    print("🏗️ Triggering complex construction workflow...")
    print(f"📝 Project: 75,000 sq ft office renovation")
    print(f"💰 Budget: $3.5-5.2M")
    print(f"🏢 Location: San Francisco, CA")
    print(f"⏰ Timeline: 8 months")
    print("")
    
    try:
        response = requests.post(
            f"{API_URL}/chat/sessions/{SESSION_ID}/messages",
            json=complex_construction_request,
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Complex workflow triggered successfully!")
            print(f"📊 Response received with {len(result.get('content', ''))} characters")
            print("")
            print("🎯 This should activate ALL enhanced streaming features:")
            print("  🧠 Manager Decision Broadcasting")
            print("  📊 Agent Progress Streaming") 
            print("  🤖 Brain Allocation Decisions")
            print("  🤔 Interactive User Decisions")
            print("  🎯 Workflow Visualization")
            print("  🚨 Error Recovery Streaming")
            print("")
            print("💡 Run the WebSocket monitor or check frontend to see real-time streaming!")
            
        else:
            print(f"❌ Request failed with status {response.status_code}")
            print(f"Response: {response.text}")
            
    except Exception as e:
        print(f"❌ Error triggering workflow: {e}")


if __name__ == "__main__":
    print("🚀 Enhanced Streaming Complex Workflow Trigger")
    print("=" * 50)
    trigger_complex_construction_workflow() 