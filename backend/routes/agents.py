# Agent management routes for PIP AI application
# Handles agent status, monitoring, and task management

from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta, timezone
import uuid
import logging
import random

# Set up logging
logger = logging.getLogger(__name__)

router = APIRouter()

# Type definitions for better type safety
class PerformanceMetrics(BaseModel):
    tasks_completed: int
    average_response_time: float
    success_rate: float

class AgentData(BaseModel):
    id: str
    name: str
    type: str
    status: str
    description: str
    capabilities: List[str]
    current_task: Optional[str]
    last_active: str
    performance_metrics: Optional[PerformanceMetrics]

class TaskData(BaseModel):
    id: str
    type: str
    parameters: Dict[str, Any]
    status: str
    created_at: str
    assigned_at: str

# Pydantic models
class AgentResponse(BaseModel):
    id: str
    name: str
    type: str
    status: str
    description: str
    capabilities: List[str]
    current_task: Optional[str] = None
    last_active: str
    performance_metrics: Optional[Dict[str, Any]] = None

class AgentStatusUpdate(BaseModel):
    status: str
    current_task: Optional[str] = None

class TaskRequest(BaseModel):
    agent_id: str
    task_type: str
    parameters: Dict[str, Any]

# In-memory storage for demo purposes - with proper type annotations
agents_data: Dict[str, Dict[str, Any]] = {}
agent_tasks: Dict[str, List[Dict[str, Any]]] = {}

# Initialize default agents
def initialize_agents() -> None:
    """Initialize the default PIP AI agents"""
    if agents_data:  # Already initialized
        return
    
    default_agents: List[Dict[str, Any]] = [
        {
            "id": "agent_text_extraction",
            "name": "Text Extraction Agent",
            "type": "text_extraction",
            "status": "idle",
            "description": "Extracts text content from various document formats",
            "capabilities": ["pdf_extraction", "ocr", "text_parsing"],
            "current_task": None,
            "last_active": get_current_timestamp(),
            "performance_metrics": {
                "tasks_completed": 45,
                "average_response_time": 2.3,
                "success_rate": 0.96
            }
        },
        {
            "id": "agent_cost_estimation",
            "name": "Cost Estimation Agent",
            "type": "cost_estimation",
            "status": "idle",
            "description": "Analyzes documents and generates cost estimates",
            "capabilities": ["cost_analysis", "pricing_models", "estimation_algorithms"],
            "current_task": None,
            "last_active": get_current_timestamp(),
            "performance_metrics": {
                "tasks_completed": 32,
                "average_response_time": 5.7,
                "success_rate": 0.91
            }
        },
        {
            "id": "agent_qa_validation",
            "name": "QA Validation Agent",
            "type": "qa_validation",
            "status": "processing",
            "description": "Validates and quality-checks processed documents",
            "capabilities": ["quality_assurance", "data_validation", "error_detection"],
            "current_task": "Validating cost estimate for project ABC123",
            "last_active": get_current_timestamp(),
            "performance_metrics": {
                "tasks_completed": 67,
                "average_response_time": 1.8,
                "success_rate": 0.98
            }
        },
        {
            "id": "agent_smartsheet_sync",
            "name": "Smartsheet Sync Agent",
            "type": "smartsheet_sync",
            "status": "idle",
            "description": "Synchronizes data with Smartsheet platforms",
            "capabilities": ["smartsheet_api", "data_sync", "webhook_handling"],
            "current_task": None,
            "last_active": get_current_timestamp(),
            "performance_metrics": {
                "tasks_completed": 28,
                "average_response_time": 3.2,
                "success_rate": 0.94
            }
        },
        {
            "id": "agent_admin",
            "name": "Admin Agent",
            "type": "admin",
            "status": "idle",
            "description": "Handles administrative tasks and system management",
            "capabilities": ["user_management", "system_monitoring", "task_scheduling"],
            "current_task": None,
            "last_active": get_current_timestamp(),
            "performance_metrics": {
                "tasks_completed": 15,
                "average_response_time": 1.2,
                "success_rate": 1.0
            }
        },
        {
            "id": "agent_analytics",
            "name": "Analytics Agent",
            "type": "analytics",
            "status": "processing",
            "description": "Generates analytics and insights from processed data",
            "capabilities": ["data_analysis", "reporting", "metrics_generation"],
            "current_task": "Generating monthly analytics report",
            "last_active": get_current_timestamp(),
            "performance_metrics": {
                "tasks_completed": 22,
                "average_response_time": 4.1,
                "success_rate": 0.95
            }
        },
        {
            "id": "agent_file_processing",
            "name": "File Processing Agent",
            "type": "file_processing",
            "status": "idle",
            "description": "Handles file uploads, compression, and format conversion",
            "capabilities": ["file_compression", "format_conversion", "batch_processing"],
            "current_task": None,
            "last_active": get_current_timestamp(),
            "performance_metrics": {
                "tasks_completed": 89,
                "average_response_time": 1.5,
                "success_rate": 0.97
            }
        },
        {
            "id": "agent_general",
            "name": "General Assistant Agent",
            "type": "general",
            "status": "idle",
            "description": "General-purpose assistant for user queries and help",
            "capabilities": ["natural_language", "help_assistance", "general_queries"],
            "current_task": None,
            "last_active": get_current_timestamp(),
            "performance_metrics": {
                "tasks_completed": 156,
                "average_response_time": 0.8,
                "success_rate": 0.93
            }
        }
    ]
    
    for agent in default_agents:
        agents_data[agent["id"]] = agent
        agent_tasks[agent["id"]] = []

# Helper functions
def get_current_timestamp() -> str:
    return datetime.now(timezone.utc).isoformat()

def simulate_agent_activity() -> None:
    """Simulate realistic agent activity for demo purposes"""
    for _, agent in agents_data.items():
        # Randomly update agent status
        if random.random() < 0.1:  # 10% chance to change status
            current_status: str = agent["status"]
            if current_status == "idle":
                if random.random() < 0.3:  # 30% chance to start processing
                    agent["status"] = "processing"
                    agent["current_task"] = f"Processing task {random.randint(1000, 9999)}"
            elif current_status == "processing":
                if random.random() < 0.4:  # 40% chance to finish
                    agent["status"] = "idle"
                    agent["current_task"] = None
                    # Update performance metrics
                    if "performance_metrics" in agent and agent["performance_metrics"]:
                        agent["performance_metrics"]["tasks_completed"] += 1
        
        # Update last_active timestamp
        agent["last_active"] = get_current_timestamp()

# Initialize agents on module load
initialize_agents()

# Agent management endpoints
@router.get("/", response_model=List[AgentResponse])
async def get_agents():
    """Get all available agents"""
    try:
        simulate_agent_activity()
        return [AgentResponse(**agent) for agent in agents_data.values()]
    except Exception as e:
        logger.error(f"Error getting agents: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve agents")

@router.get("/status", response_model=Dict[str, AgentResponse])
async def get_agent_status() -> Dict[str, AgentResponse]:
    """Get status of all agents"""
    try:
        simulate_agent_activity()
        return {
            agent_id: AgentResponse(**agent_data) 
            for agent_id, agent_data in agents_data.items()
        }
    except Exception as e:
        logger.error(f"Error getting agent status: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve agent status")

@router.get("/{agent_id}", response_model=AgentResponse)
async def get_agent(agent_id: str):
    """Get a specific agent"""
    try:
        if agent_id not in agents_data:
            raise HTTPException(status_code=404, detail="Agent not found")
        
        simulate_agent_activity()
        return AgentResponse(**agents_data[agent_id])
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting agent {agent_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve agent")

@router.put("/{agent_id}/status")
async def update_agent_status(agent_id: str, status_update: AgentStatusUpdate):
    """Update agent status"""
    try:
        if agent_id not in agents_data:
            raise HTTPException(status_code=404, detail="Agent not found")
        
        valid_statuses = ["idle", "processing", "error", "offline"]
        if status_update.status not in valid_statuses:
            raise HTTPException(
                status_code=400, 
                detail=f"Invalid status. Must be one of: {valid_statuses}"
            )
        
        agents_data[agent_id]["status"] = status_update.status
        agents_data[agent_id]["current_task"] = status_update.current_task
        agents_data[agent_id]["last_active"] = get_current_timestamp()
        
        logger.info(f"Agent status updated: {agent_id} -> {status_update.status}")
        return JSONResponse({"message": "Agent status updated successfully"})
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating agent status {agent_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to update agent status")

@router.post("/{agent_id}/tasks")
async def assign_task_to_agent(agent_id: str, task: TaskRequest) -> JSONResponse:
    """Assign a task to a specific agent"""
    try:
        if agent_id not in agents_data:
            raise HTTPException(status_code=404, detail="Agent not found")
        
        agent: Dict[str, Any] = agents_data[agent_id]
        if agent["status"] == "offline":
            raise HTTPException(status_code=400, detail="Agent is offline")
        
        task_id = str(uuid.uuid4())
        task_data: Dict[str, Any] = {
            "id": task_id,
            "type": task.task_type,
            "parameters": task.parameters,
            "status": "assigned",
            "created_at": get_current_timestamp(),
            "assigned_at": get_current_timestamp()
        }
        
        # Add task to agent's task list
        if agent_id not in agent_tasks:
            agent_tasks[agent_id] = []
        agent_tasks[agent_id].append(task_data)
        
        # Update agent status
        agents_data[agent_id]["status"] = "processing"
        agents_data[agent_id]["current_task"] = f"{task.task_type} (Task {task_id[:8]})"
        agents_data[agent_id]["last_active"] = get_current_timestamp()
        
        logger.info(f"Task assigned to agent {agent_id}: {task_id}")
        return JSONResponse({
            "message": "Task assigned successfully",
            "task_id": task_id,
            "agent_id": agent_id
        })
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error assigning task to agent {agent_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to assign task")

@router.get("/{agent_id}/tasks")
async def get_agent_tasks(agent_id: str) -> Dict[str, Any]:
    """Get tasks assigned to a specific agent"""
    try:
        if agent_id not in agents_data:
            raise HTTPException(status_code=404, detail="Agent not found")
        
        tasks: List[Dict[str, Any]] = agent_tasks.get(agent_id, [])
        return {"agent_id": agent_id, "tasks": tasks}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting tasks for agent {agent_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve agent tasks")

@router.get("/{agent_id}/performance")
async def get_agent_performance(agent_id: str) -> Dict[str, Any]:
    """Get performance metrics for a specific agent"""
    try:
        if agent_id not in agents_data:
            raise HTTPException(status_code=404, detail="Agent not found")
        
        agent: Dict[str, Any] = agents_data[agent_id]
        performance: Dict[str, Any] = agent.get("performance_metrics", {})
        
        # Calculate additional metrics
        total_tasks = len(agent_tasks.get(agent_id, []))
        recent_tasks: List[Dict[str, Any]] = [
            task for task in agent_tasks.get(agent_id, [])
            if datetime.fromisoformat(task.get("created_at", "1970-01-01T00:00:00"))
            > datetime.now(timezone.utc) - timedelta(days=7)
        ]
        
        return {
            "agent_id": agent_id,
            "agent_name": agent["name"],
            "performance_metrics": performance,
            "total_tasks_assigned": total_tasks,
            "recent_tasks_count": len(recent_tasks),
            "uptime_status": "online" if agent["status"] != "offline" else "offline",
            "last_active": agent["last_active"]
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting performance for agent {agent_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve agent performance")

@router.get("/performance/summary")
async def get_agents_performance_summary() -> Dict[str, Any]:
    """Get performance summary for all agents"""
    try:
        simulate_agent_activity()
        summary: Dict[str, Any] = {
            "total_agents": len(agents_data),
            "active_agents": len([a for a in agents_data.values() if a["status"] != "offline"]),
            "processing_agents": len([a for a in agents_data.values() if a["status"] == "processing"]),
            "idle_agents": len([a for a in agents_data.values() if a["status"] == "idle"]),
            "error_agents": len([a for a in agents_data.values() if a["status"] == "error"]),
            "offline_agents": len([a for a in agents_data.values() if a["status"] == "offline"]),
            "agents": []
        }
        
        for agent_id, agent in agents_data.items():
            agent_summary: Dict[str, Any] = {
                "id": agent_id,
                "name": agent["name"],
                "type": agent["type"],
                "status": agent["status"],
                "tasks_completed": agent.get("performance_metrics", {}).get("tasks_completed", 0),
                "success_rate": agent.get("performance_metrics", {}).get("success_rate", 0),
                "last_active": agent["last_active"]
            }
            summary["agents"].append(agent_summary)
        
        return summary
    except Exception as e:
        logger.error(f"Error getting agents performance summary: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve performance summary")

@router.post("/restart/{agent_id}")
async def restart_agent(agent_id: str):
    """Restart a specific agent"""
    try:
        if agent_id not in agents_data:
            raise HTTPException(status_code=404, detail="Agent not found")
        
        # Simulate agent restart
        agents_data[agent_id]["status"] = "idle"
        agents_data[agent_id]["current_task"] = None
        agents_data[agent_id]["last_active"] = get_current_timestamp()
        
        logger.info(f"Agent restarted: {agent_id}")
        return JSONResponse({"message": f"Agent {agent_id} restarted successfully"})
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error restarting agent {agent_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to restart agent")

@router.post("/restart/all")
async def restart_all_agents():
    """Restart all agents"""
    try:
        timestamp = get_current_timestamp()
        for agent_id in agents_data:
            agents_data[agent_id]["status"] = "idle"
            agents_data[agent_id]["current_task"] = None
            agents_data[agent_id]["last_active"] = timestamp
        
        logger.info("All agents restarted")
        return JSONResponse({"message": "All agents restarted successfully"})
    except Exception as e:
        logger.error(f"Error restarting all agents: {e}")
        raise HTTPException(status_code=500, detail="Failed to restart all agents")
