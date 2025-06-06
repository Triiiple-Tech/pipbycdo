"""
Analytics API Routes for Section IV
Provides comprehensive analytics endpoints for the PIP AI system
"""

from fastapi import APIRouter, HTTPException, Query, BackgroundTasks, Body
from fastapi.responses import StreamingResponse
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
from pydantic import BaseModel, Field
from enum import Enum
from io import StringIO
import random
import json
import io
import uuid
import csv
from io import StringIO

try:
    # For regular app runtime
    from ..services.supabase_client import get_supabase_client  # type: ignore
    supabase_available = True
except (ImportError, ValueError):
    # For tests where relative imports might fail
    try:
        from services.supabase_client import get_supabase_client  # type: ignore
        supabase_available = True
    except ImportError:
        # Mock function for testing/development
        supabase_available = False
        def get_supabase_client():  # type: ignore
            class MockSupabase:
                def table(self, table_name: str):
                    return self
                def insert(self, data: Dict[str, Any]):
                    return self
                def execute(self):
                    class MockResult:
                        def __init__(self):
                            self.data = [{'success': True}]
                    return MockResult()
            return MockSupabase()

router = APIRouter(tags=["analytics"])

# Enums for validation
class ProjectStatus(str, Enum):
    active = "active"
    planning = "planning"
    completed = "completed"
    on_hold = "on_hold"

class ExportFormat(str, Enum):
    pdf = "pdf"
    excel = "excel"
    csv = "csv"
    png = "png"
    json = "json"

class ExportDataType(str, Enum):
    dashboard = "dashboard"
    projects = "projects"
    agents = "agents"
    kpis = "kpis"
    custom = "custom"

class EventType(str, Enum):
    file_upload = "file_upload"
    agent_call = "agent_call"
    sheet_export = "sheet_export"
    prompt_edit = "prompt_edit"
    user_action = "user_action"
    system_event = "system_event"

class LogLevel(str, Enum):
    debug = "debug"
    info = "info"
    warning = "warning"
    error = "error"
    critical = "critical"

# Pydantic Models for Analytics
class ProjectMetrics(BaseModel):
    id: str
    name: str
    status: str = Field(..., pattern="^(active|planning|completed|on_hold)$")
    progress: float = Field(..., ge=0, le=100)
    budget: Dict[str, float]
    timeline: Dict[str, Any]
    team: Dict[str, Any]
    health: Dict[str, Any]
    created_at: datetime
    updated_at: datetime

class AgentMetrics(BaseModel):
    id: str
    name: str
    type: str
    status: str
    performance: Dict[str, float]
    resources: Dict[str, float]
    current_task: Optional[Dict[str, Any]] = None

class KPIMetrics(BaseModel):
    category: str
    metrics: List[Dict[str, Any]]
    period: Dict[str, Any]

class RealTimeMetrics(BaseModel):
    active_users: int
    active_projects: int
    system_load: float
    api_response_time: float
    tasks_in_progress: int
    alerts: List[Dict[str, Any]]
    last_updated: datetime

class ExportRequest(BaseModel):
    format: str = Field(..., pattern="^(pdf|excel|csv|png|json)$")
    data: str = Field(..., pattern="^(dashboard|projects|agents|kpis|custom)$")
    filters: Optional[Dict[str, Any]] = None
    options: Optional[Dict[str, Any]] = None

class ExportResponse(BaseModel):
    job_id: str
    status: str
    download_url: Optional[str] = None
    error: Optional[str] = None
    estimated_completion: Optional[datetime] = None

class AuditLogEntry(BaseModel):
    id: str
    timestamp: datetime
    user_id: Optional[str] = None
    user_email: Optional[str] = None
    agent: str
    event_type: str = Field(..., pattern="^(file_upload|agent_call|sheet_export|prompt_edit|user_action|system_event)$")
    event_details: str
    model_used: Optional[str] = None
    session_id: Optional[str] = None
    task_id: Optional[str] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    cost_estimate: Optional[float] = None
    duration_ms: Optional[int] = None
    error: Optional[str] = None
    level: str = Field(default="info", pattern="^(debug|info|warning|error|critical)$")

class AuditLogResponse(BaseModel):
    logs: List[AuditLogEntry]
    total_count: int
    page: int
    page_size: int
    filters_applied: Dict[str, Any]

class AuditLogCreate(BaseModel):
    """Schema for creating a new audit log entry"""
    user_id: Optional[str] = None
    user_email: Optional[str] = None
    agent: str
    event_type: str = Field(..., pattern="^(file_upload|agent_call|sheet_export|prompt_edit|user_action|system_event)$")
    event_details: str
    model_used: Optional[str] = None
    session_id: Optional[str] = None
    task_id: Optional[str] = None
    cost_estimate: Optional[float] = None
    duration_ms: Optional[int] = None
    level: str = Field(default="info", pattern="^(debug|info|warning|error|critical)$")
    error: Optional[str] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None

# In-memory storage for audit logs when database is unavailable
local_audit_logs: List[Dict[str, Any]] = []

def store_audit_log_locally(audit_log: Dict[str, Any]) -> None:
    """Store an audit log entry in local memory for development/testing"""
    local_audit_logs.append(audit_log)
    # Limit the size of in-memory logs to prevent memory issues
    if len(local_audit_logs) > 1000:
        local_audit_logs.pop(0)  # Remove oldest log

# Mock Data Generators (for development)
def generate_mock_project_metrics() -> List[Dict[str, Any]]:
    """Generate mock project metrics data"""
    projects: List[Dict[str, Any]] = []
    for i in range(5):
        project_id = f"PRJ-2025-{str(i+1).zfill(3)}"
        projects.append({
            "id": project_id,
            "name": f"Project {chr(65+i)} - Office Renovation",
            "status": ["active", "planning", "completed"][i % 3],
            "progress": min(100, 15 + i * 20 + (i * 5)),
            "budget": {
                "total": 500000 + (i * 100000),
                "spent": 50000 + (i * 75000),
                "remaining": 450000 + (i * 25000),
                "burn_rate": 25000 + (i * 5000)
            },
            "timeline": {
                "start_date": (datetime.now() - timedelta(days=30+i*10)).isoformat(),
                "end_date": (datetime.now() + timedelta(days=120-i*20)).isoformat(),
                "days_remaining": 120 - i*20,
                "milestones": [
                    {
                        "id": f"M{j+1}",
                        "name": f"Milestone {j+1}",
                        "due_date": (datetime.now() + timedelta(days=30+j*30)).isoformat(),
                        "status": ["pending", "in_progress", "completed"][j % 3],
                        "completion": j * 25
                    } for j in range(4)
                ]
            },
            "team": {
                "size": 6 + i,
                "roles": ["Project Manager", "Estimator", "QA Specialist", "Document Analyst"],
                "utilization": 75 + (i * 5)
            },
            "health": {
                "score": 85 - (i * 3),
                "factors": [
                    {"name": "Schedule", "score": 90 - i*2, "weight": 0.3, "description": "On track"},
                    {"name": "Budget", "score": 85 - i*3, "weight": 0.3, "description": "Within limits"},
                    {"name": "Quality", "score": 88 - i, "weight": 0.2, "description": "High quality"},
                    {"name": "Team", "score": 92 - i*2, "weight": 0.2, "description": "Good collaboration"}
                ],
                "risks": [
                    {
                        "id": f"R{i+1}",
                        "type": ["schedule", "budget", "quality"][i % 3],
                        "severity": ["low", "medium", "high"][i % 3],
                        "description": f"Risk {i+1} description",
                        "probability": 0.2 + (i * 0.1),
                        "impact": 0.3 + (i * 0.1)
                    }
                ]
            },
            "created_at": (datetime.now() - timedelta(days=60+i*10)).isoformat(),
            "updated_at": datetime.now().isoformat()
        })
    return projects

def generate_mock_agent_metrics() -> List[Dict[str, Any]]:
    """Generate mock agent metrics data"""
    agent_types = ["manager", "file-reader", "trade-mapper", "scope", "takeoff", "estimator", "qa-validator", "exporter"]
    agents: List[Dict[str, Any]] = []
    
    for i, agent_type in enumerate(agent_types):
        agents.append({
            "id": f"agent-{agent_type}-{i+1}",
            "name": f"{agent_type.replace('-', ' ').title()} Agent",
            "type": agent_type,
            "status": ["active", "idle", "processing"][i % 3],
            "performance": {
                "tasks_completed": 50 + (i * 20),
                "success_rate": 0.95 - (i * 0.02),
                "average_processing_time": 2.5 + (i * 0.5),
                "error_rate": 0.05 + (i * 0.01)
            },
            "resources": {
                "tokens_used": 10000 + (i * 5000),
                "model_calls": 100 + (i * 50),
                "cost_per_task": 0.15 + (i * 0.05),
                "efficiency": 0.85 - (i * 0.03)
            },
            "current_task": {
                "id": f"task-{i+1}",
                "description": f"Processing {agent_type} task",
                "start_time": (datetime.now() - timedelta(minutes=5+i)).isoformat(),
                "estimated_completion": (datetime.now() + timedelta(minutes=10-i)).isoformat()
            } if i % 3 == 0 else None
        })
    return agents

def generate_mock_kpi_metrics() -> List[Dict[str, Any]]:
    """Generate mock KPI metrics data"""
    categories = ["project", "agent", "system", "financial"]
    kpis: List[Dict[str, Any]] = []
    
    for category in categories:
        metrics: List[Dict[str, Any]] = []
        if category == "project":
            metrics = [
                {"name": "Project Success Rate", "value": 92.5, "unit": "%", "target": 95, "trend": "up", "trend_percentage": 2.1, "description": "Percentage of projects completed successfully"},
                {"name": "Average Project Duration", "value": 45, "unit": "days", "target": 40, "trend": "down", "trend_percentage": -5.2, "description": "Average time to complete projects"},
                {"name": "Budget Variance", "value": 3.2, "unit": "%", "target": 5, "trend": "stable", "trend_percentage": 0.1, "description": "Average budget deviation"},
                {"name": "Quality Score", "value": 4.7, "unit": "/5", "target": 4.5, "trend": "up", "trend_percentage": 4.4, "description": "Average project quality rating"}
            ]
        elif category == "agent":
            metrics = [
                {"name": "Agent Uptime", "value": 99.2, "unit": "%", "target": 99.5, "trend": "stable", "trend_percentage": 0.0, "description": "System availability percentage"},
                {"name": "Processing Speed", "value": 2.3, "unit": "tasks/min", "target": 2.5, "trend": "up", "trend_percentage": 8.7, "description": "Average task processing rate"},
                {"name": "Error Rate", "value": 0.8, "unit": "%", "target": 1.0, "trend": "down", "trend_percentage": -20.0, "description": "Percentage of failed tasks"},
                {"name": "Cost Efficiency", "value": 87.5, "unit": "%", "target": 85, "trend": "up", "trend_percentage": 2.9, "description": "Cost optimization score"}
            ]
        elif category == "system":
            metrics = [
                {"name": "API Response Time", "value": 245, "unit": "ms", "target": 200, "trend": "down", "trend_percentage": -8.3, "description": "Average API response time"},
                {"name": "System Load", "value": 68.2, "unit": "%", "target": 80, "trend": "stable", "trend_percentage": 1.2, "description": "Current system utilization"},
                {"name": "Active Users", "value": 24, "unit": "users", "target": 30, "trend": "up", "trend_percentage": 20.0, "description": "Currently active users"},
                {"name": "Data Processing", "value": 1.2, "unit": "GB/hour", "target": 1.0, "trend": "up", "trend_percentage": 15.4, "description": "Data throughput rate"}
            ]
        else:  # financial
            metrics = [
                {"name": "Cost per Task", "value": 0.18, "unit": "$", "target": 0.20, "trend": "down", "trend_percentage": -10.0, "description": "Average cost per processed task"},
                {"name": "Monthly Savings", "value": 12500, "unit": "$", "target": 10000, "trend": "up", "trend_percentage": 25.0, "description": "Monthly cost savings vs manual"},
                {"name": "ROI", "value": 340, "unit": "%", "target": 300, "trend": "up", "trend_percentage": 13.3, "description": "Return on investment"},
                {"name": "Revenue Impact", "value": 45000, "unit": "$", "target": 40000, "trend": "up", "trend_percentage": 12.5, "description": "Monthly revenue impact"}
            ]
        
        kpis.append({
            "category": category,
            "metrics": metrics,
            "period": {
                "start": (datetime.now() - timedelta(days=30)).isoformat(),
                "end": datetime.now().isoformat(),
                "type": "monthly"
            }
        })
    
    return kpis

def generate_mock_realtime_metrics() -> Dict[str, Any]:
    """Generate mock real-time metrics"""
    return {
        "active_users": 24,
        "active_projects": 8,
        "system_load": 68.2,
        "api_response_time": 245.5,
        "tasks_in_progress": 15,
        "alerts": [
            {
                "id": "alert-1",
                "type": "warning",
                "title": "High System Load",
                "message": "System load is approaching 70%, consider scaling resources",
                "timestamp": (datetime.now() - timedelta(minutes=5)).isoformat(),
                "acknowledged": False,
                "project_id": "PRJ-2025-001"
            },
            {
                "id": "alert-2",
                "type": "info",
                "title": "Export Complete",
                "message": "Budget analysis export has been completed successfully",
                "timestamp": (datetime.now() - timedelta(minutes=10)).isoformat(),
                "acknowledged": True,
                "project_id": "PRJ-2025-002"
            }
        ],
        "last_updated": datetime.now().isoformat()
    }

# Mock audit log data generator
def generate_mock_audit_logs(
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    agent: Optional[str] = None,
    event_type: Optional[str] = None,
    user_id: Optional[str] = None,
    level: Optional[str] = None,
    search: Optional[str] = None,
    page: int = 1,
    page_size: int = 50
) -> Dict[str, Any]:
    """Generate mock audit log data with filtering"""
    # Generate base audit entries
    audit_entries: List[Dict[str, Any]] = []
    users = ["alice@acme.com", "bob@acme.com", "charlie@acme.com", "diana@acme.com"]
    agents = ["manager", "file-reader", "trade-mapper", "scope", "takeoff", "estimator", "qa-validator", "exporter"]
    event_types = ["file_upload", "agent_call", "sheet_export", "prompt_edit", "user_action", "system_event"]
    levels = ["debug", "info", "warning", "error", "critical"]
    models = ["gpt-4o", "o3", "gpt-4o-mini", "claude-3-sonnet"]
    
    # Generate 100 mock entries for the last 30 days
    for i in range(100):
        entry_date = datetime.now() - timedelta(
            days=random.randint(0, 30),
            hours=random.randint(0, 23),
            minutes=random.randint(0, 59)
        )
        
        selected_agent = random.choice(agents)
        selected_event_type = random.choice(event_types)
        selected_user = random.choice(users)
        selected_level = random.choice(levels)
        selected_model = random.choice(models)
        
        # Generate realistic event details based on event type
        if selected_event_type == "file_upload":
            details = f"Uploaded {random.choice(['blueprint.pdf', 'estimate.xlsx', 'specs.docx', 'photos.zip'])} ({random.randint(100, 5000)}KB)"
        elif selected_event_type == "agent_call":
            details = f"Processed {random.choice(['estimation request', 'file analysis', 'trade mapping', 'QA validation'])}"
        elif selected_event_type == "sheet_export":
            details = f"Exported to Smartsheet: {random.choice(['Budget Analysis', 'Material List', 'Labor Estimate', 'Project Summary'])}"
        elif selected_event_type == "prompt_edit":
            details = f"Modified template: {random.choice(['Summarize Scope', 'Generate RFI', 'Effort Estimation'])}"
        elif selected_event_type == "user_action":
            details = f"User {random.choice(['logged in', 'updated settings', 'viewed dashboard', 'downloaded report'])}"
        else:  # system_event
            details = f"System {random.choice(['backup completed', 'cache cleared', 'model updated', 'maintenance performed'])}"
        
        entry: Dict[str, Any] = {
            "id": f"audit-{str(i+1).zfill(4)}",
            "timestamp": entry_date,
            "user_id": selected_user.split('@')[0],
            "user_email": selected_user,
            "agent": selected_agent,
            "event_type": selected_event_type,
            "event_details": details,
            "model_used": selected_model if selected_event_type == "agent_call" else None,
            "session_id": f"sess-{random.randint(1000, 9999)}",
            "task_id": f"task-{random.randint(100, 999)}" if selected_event_type == "agent_call" else None,
            "ip_address": f"192.168.1.{random.randint(100, 200)}",
            "user_agent": "Mozilla/5.0 (PIP AI Dashboard)",
            "cost_estimate": round(random.uniform(0.01, 0.50), 3) if selected_event_type == "agent_call" else None,
            "duration_ms": random.randint(500, 5000) if selected_event_type == "agent_call" else random.randint(100, 1000),
            "error": f"Error: {random.choice(['Timeout', 'Rate limit', 'Invalid input'])}" if selected_level == "error" else None,
            "level": selected_level
        }
        
        audit_entries.append(entry)
    
    # Apply filters
    filtered_entries = audit_entries.copy()
    
    if start_date:
        filtered_entries = [e for e in filtered_entries if e["timestamp"] >= start_date]
    if end_date:
        filtered_entries = [e for e in filtered_entries if e["timestamp"] <= end_date]
    if agent:
        filtered_entries = [e for e in filtered_entries if e["agent"] == agent]
    if event_type:
        filtered_entries = [e for e in filtered_entries if e["event_type"] == event_type]
    if user_id:
        filtered_entries = [e for e in filtered_entries if e["user_id"] == user_id]
    if level:
        filtered_entries = [e for e in filtered_entries if e["level"] == level]
    if search:
        search_lower = search.lower()
        filtered_entries = [e for e in filtered_entries if 
            search_lower in str(e["event_details"]).lower() or 
            search_lower in str(e["agent"]).lower() or
            search_lower in str(e["user_email"]).lower()]
    
    # Sort by timestamp (newest first)
    filtered_entries.sort(key=lambda x: x["timestamp"], reverse=True)
    
    # Pagination
    total_count = len(filtered_entries)
    start_index = (page - 1) * page_size
    end_index = start_index + page_size
    paginated_entries = filtered_entries[start_index:end_index]
    
    # Keep datetime objects as-is for Pydantic model validation
    # The AuditLogEntry model expects datetime objects, not ISO strings
    
    return {
        "logs": paginated_entries,
        "total_count": total_count,
        "page": page,
        "page_size": page_size,
        "filters_applied": {
            "start_date": start_date.isoformat() if start_date else None,
            "end_date": end_date.isoformat() if end_date else None,
            "agent": agent,
            "event_type": event_type,
            "user_id": user_id,
            "level": level,
            "search": search
        }
    }

# API Endpoints

@router.get("/dashboard")
async def get_dashboard_data(
    date_start: Optional[str] = Query(None),
    date_end: Optional[str] = Query(None),
    project_ids: Optional[List[str]] = Query(None)
) -> Dict[str, Any]:
    """Get comprehensive dashboard analytics data"""
    try:
        # In production, this would query the database with filters
        return {
            "projects": generate_mock_project_metrics(),
            "agents": generate_mock_agent_metrics(),
            "kpis": generate_mock_kpi_metrics(),
            "realtime_data": generate_mock_realtime_metrics(),
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch dashboard data: {str(e)}")

@router.get("/projects")
async def get_project_metrics(
    project_id: Optional[str] = Query(None)
) -> List[Dict[str, Any]]:
    """Get project metrics data"""
    try:
        projects = generate_mock_project_metrics()
        if project_id:
            projects = [p for p in projects if p["id"] == project_id]
            if not projects:
                raise HTTPException(status_code=404, detail="Project not found")
        return projects
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch project metrics: {str(e)}")

@router.get("/projects/{project_id}/health")
async def get_project_health(project_id: str) -> Dict[str, Any]:
    """Get detailed project health analysis"""
    try:
        projects = generate_mock_project_metrics()
        project = next((p for p in projects if p["id"] == project_id), None)
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        
        return {
            "score": project["health"]["score"],
            "factors": project["health"]["factors"],
            "recommendations": [
                "Consider increasing QA resources for better quality assurance",
                "Schedule buffer should be added for critical path activities",
                "Budget monitoring frequency should be increased"
            ]
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch project health: {str(e)}")

@router.get("/agents")
async def get_agent_metrics(
    agent_type: Optional[str] = Query(None)
) -> List[Dict[str, Any]]:
    """Get agent performance metrics"""
    try:
        agents = generate_mock_agent_metrics()
        if agent_type:
            agents = [a for a in agents if a["type"] == agent_type]
        return agents
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch agent metrics: {str(e)}")

@router.get("/agents/{agent_id}/performance")
async def get_agent_performance(
    agent_id: str,
    start: Optional[str] = Query(None),
    end: Optional[str] = Query(None)
) -> Dict[str, Any]:
    """Get detailed agent performance data"""
    try:
        agents = generate_mock_agent_metrics()
        agent = next((a for a in agents if a["id"] == agent_id), None)
        if not agent:
            raise HTTPException(status_code=404, detail="Agent not found")
        
        # Generate timeline data for the specified period
        timeline: List[Dict[str, Any]] = []
        for i in range(30):  # Last 30 days
            date = datetime.now() - timedelta(days=29-i)
            timeline.append({
                "date": date.isoformat(),
                "metrics": {
                    "tasks_completed": max(0, agent["performance"]["tasks_completed"] + (i * 2) - 30),
                    "success_rate": max(0.7, agent["performance"]["success_rate"] + (i * 0.01) - 0.15),
                    "processing_time": max(1.0, agent["performance"]["average_processing_time"] + (i * 0.1) - 1.5),
                    "cost": max(0.05, agent["resources"]["cost_per_task"] + (i * 0.002) - 0.03)
                }
            })
        
        return {
            "performance": agent["performance"],
            "timeline": timeline
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch agent performance: {str(e)}")

@router.get("/kpis")
async def get_kpi_metrics(
    category: Optional[str] = Query(None),
    start: Optional[str] = Query(None),
    end: Optional[str] = Query(None),
    type: Optional[str] = Query("monthly")
) -> List[Dict[str, Any]]:
    """Get KPI metrics data"""
    try:
        kpis = generate_mock_kpi_metrics()
        if category:
            kpis = [k for k in kpis if k["category"] == category]
        return kpis
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch KPI metrics: {str(e)}")

@router.post("/kpis/trends")
async def get_kpi_trends(request: Dict[str, Any]) -> Dict[str, List[Dict[str, Any]]]:
    """Get KPI trend data for specified metrics"""
    try:
        metrics = request.get("metrics", [])
        
        trends: Dict[str, List[Dict[str, Any]]] = {}
        for metric in metrics:
            # Generate trend data for the last 30 days
            trend_data: List[Dict[str, Any]] = []
            for i in range(30):
                date = datetime.now() - timedelta(days=29-i)
                # Generate realistic trend values
                base_value = 75 + (hash(str(metric)) % 50)  # Deterministic but varied base
                variation = 10 * (0.5 - (i % 10) / 20)  # Some variation
                value = max(0, base_value + variation + (i * 0.5))
                trend_data.append({
                    "date": date.isoformat(),
                    "value": round(value, 2)
                })
            trends[str(metric)] = trend_data
        
        return trends
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch KPI trends: {str(e)}")

@router.get("/realtime")
async def get_realtime_metrics() -> Dict[str, Any]:
    """Get real-time system metrics"""
    try:
        return generate_mock_realtime_metrics()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch real-time metrics: {str(e)}")

@router.get("/system/health")
async def get_system_health() -> Dict[str, Any]:
    """Get system health status"""
    try:
        return {
            "status": "healthy",
            "services": [
                {"name": "Database", "status": "up", "response_time": 12.5, "last_check": datetime.now().isoformat()},
                {"name": "Redis", "status": "up", "response_time": 3.2, "last_check": datetime.now().isoformat()},
                {"name": "File Storage", "status": "up", "response_time": 45.1, "last_check": datetime.now().isoformat()},
                {"name": "AI Models", "status": "up", "response_time": 234.7, "last_check": datetime.now().isoformat()},
                {"name": "WebSocket", "status": "up", "response_time": 8.9, "last_check": datetime.now().isoformat()}
            ],
            "alerts": generate_mock_realtime_metrics()["alerts"]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch system health: {str(e)}")

@router.post("/exports", response_model=ExportResponse)
async def create_export(request: ExportRequest, background_tasks: BackgroundTasks) -> ExportResponse:
    """Create a new data export job"""
    try:
        job_id = str(uuid.uuid4())
        
        # In production, this would start a background job
        # For now, we'll simulate the export process
        export_response = ExportResponse(
            job_id=job_id,
            status="pending",
            estimated_completion=datetime.now() + timedelta(minutes=2)
        )
        
        # Add background task to process the export
        background_tasks.add_task(process_export_job, job_id, request.model_dump())
        
        return export_response
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create export: {str(e)}")

@router.get("/exports/{job_id}/status", response_model=ExportResponse)
async def get_export_status(job_id: str) -> ExportResponse:
    """Get export job status"""
    try:
        # In production, this would check job status in database/queue
        # For now, simulate different statuses
        return ExportResponse(
            job_id=job_id,
            status="completed",
            download_url=f"/api/analytics/exports/{job_id}/download"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get export status: {str(e)}")

@router.get("/exports/{job_id}/download")
async def download_export(job_id: str) -> StreamingResponse:
    """Download completed export file"""
    try:
        # In production, this would retrieve the actual file
        # For now, return a sample JSON export
        mock_data: Dict[str, Any] = {
            "export_id": job_id,
            "timestamp": datetime.now().isoformat(),
            "data": generate_mock_project_metrics(),
            "metadata": {
                "total_records": 5,
                "export_format": "json",
                "generated_by": "PIP AI Analytics"
            }
        }
        
        json_str = json.dumps(mock_data, indent=2)
        
        return StreamingResponse(
            io.BytesIO(json_str.encode()),
            media_type="application/json",
            headers={
                "Content-Disposition": f"attachment; filename=analytics_export_{job_id}.json"
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to download export: {str(e)}")

@router.get("/alerts")
async def get_alerts(
    alert_type: Optional[str] = Query(None),
    acknowledged: Optional[bool] = Query(None),
    project_id: Optional[str] = Query(None)
) -> List[Dict[str, Any]]:
    """Get system alerts with optional filtering"""
    try:
        alerts = generate_mock_realtime_metrics()["alerts"]
        
        if alert_type:
            alerts = [a for a in alerts if a["type"] == alert_type]
        if acknowledged is not None:
            alerts = [a for a in alerts if a["acknowledged"] == acknowledged]
        if project_id:
            alerts = [a for a in alerts if a.get("project_id") == project_id]
        
        return alerts
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch alerts: {str(e)}")

@router.patch("/alerts/{alert_id}/acknowledge")
async def acknowledge_alert(alert_id: str) -> Dict[str, str]:
    """Acknowledge an alert"""
    try:
        # In production, this would update the alert in the database
        return {"message": f"Alert {alert_id} acknowledged successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to acknowledge alert: {str(e)}")

@router.delete("/alerts/{alert_id}")
async def dismiss_alert(alert_id: str) -> Dict[str, str]:
    """Dismiss an alert"""
    try:
        # In production, this would remove the alert from the database
        return {"message": f"Alert {alert_id} dismissed successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to dismiss alert: {str(e)}")

@router.get("/timeseries")
async def get_timeseries_data(
    metric: str = Query(...),
    start: str = Query(...),
    end: str = Query(...),
    granularity: str = Query("day")
) -> List[Dict[str, Any]]:
    """Get time series data for specified metric"""
    try:
        # Parse dates
        start_date = datetime.fromisoformat(start.replace('Z', '+00:00'))
        end_date = datetime.fromisoformat(end.replace('Z', '+00:00'))
        
        # Generate time series data
        data: List[Dict[str, Any]] = []
        current_date = start_date
        
        while current_date <= end_date:
            # Generate realistic values based on metric name
            base_value = 50 + (hash(metric) % 100)
            variation = 20 * (0.5 - (current_date.day % 10) / 20)
            value = max(0, base_value + variation)
            
            data.append({
                "timestamp": current_date.isoformat(),
                "value": round(value, 2),
                "metadata": {"metric": metric, "granularity": granularity}
            })
            
            # Increment based on granularity
            if granularity == "hour":
                current_date += timedelta(hours=1)
            elif granularity == "day":
                current_date += timedelta(days=1)
            elif granularity == "week":
                current_date += timedelta(weeks=1)
            else:  # month
                current_date += timedelta(days=30)
        
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch time series data: {str(e)}")

@router.get("/budget")
async def get_budget_analytics(
    project_id: Optional[str] = Query(None),
    start: Optional[str] = Query(None),
    end: Optional[str] = Query(None)
) -> Dict[str, Any]:
    """Get budget analytics data"""
    try:
        return {
            "total_budget": 750000,
            "total_spent": 425000,
            "burn_rate": 25000,
            "forecast": [
                {"date": (datetime.now() + timedelta(days=i*7)).isoformat(), 
                 "projected": 425000 + (i * 25000), 
                 "actual": 425000 + (i * 23000) if i < 4 else None} 
                for i in range(12)
            ],
            "categories": [
                {"name": "Labor", "budgeted": 300000, "spent": 175000},
                {"name": "Materials", "budgeted": 250000, "spent": 150000},
                {"name": "Equipment", "budgeted": 125000, "spent": 75000},
                {"name": "Overhead", "budgeted": 75000, "spent": 25000}
            ],
            "alerts": [
                {"type": "warning", "message": "Materials spending is 10% over projected", "severity": "medium"},
                {"type": "info", "message": "Labor costs are within expected range", "severity": "low"}
            ]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch budget analytics: {str(e)}")

@router.get("/resources")
async def get_resource_utilization(
    start: Optional[str] = Query(None),
    end: Optional[str] = Query(None)
) -> Dict[str, Any]:
    """Get resource utilization metrics"""
    try:
        return {
            "team": {
                "total_members": 32,
                "active_members": 28,
                "utilization": 87.5,
                "productivity": 92.3
            },
            "system": {
                "cpu_usage": 68.2,
                "memory_usage": 74.5,
                "storage_usage": 45.8,
                "api_calls": 1250
            },
            "costs": {
                "total_cost": 15750.00,
                "cost_per_project": 1968.75,
                "cost_per_task": 23.45,
                "efficiency": 89.2
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch resource utilization: {str(e)}")

# Audit logs API endpoint
@router.get("/audit-logs", response_model=AuditLogResponse)
async def get_audit_logs(
    start_date: Optional[str] = Query(None, description="Start date in ISO format"),
    end_date: Optional[str] = Query(None, description="End date in ISO format"),
    agent: Optional[str] = Query(None, description="Filter by agent name"),
    event_type: Optional[str] = Query(None, description="Filter by event type"),
    user_id: Optional[str] = Query(None, description="Filter by user ID"),
    level: Optional[str] = Query(None, description="Filter by log level"),
    search: Optional[str] = Query(None, description="Search in event details"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(50, ge=1, le=200, description="Items per page")
) -> AuditLogResponse:
    """Get audit logs with filtering and pagination"""
    try:
        # Parse date parameters
        parsed_start_date = None
        parsed_end_date = None
        
        if start_date:
            try:
                parsed_start_date = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
            except ValueError:
                raise HTTPException(status_code=400, detail="Invalid start_date format. Use ISO format.")
        
        if end_date:
            try:
                parsed_end_date = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
            except ValueError:
                raise HTTPException(status_code=400, detail="Invalid end_date format. Use ISO format.")
        
        # In production, this would query the actual audit logs from database
        # Here we use mock data
        result = generate_mock_audit_logs(
            start_date=parsed_start_date,
            end_date=parsed_end_date,
            agent=agent,
            event_type=event_type,
            user_id=user_id,
            level=level,
            search=search,
            page=page,
            page_size=page_size
        )
        
        return AuditLogResponse(**result)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch audit logs: {str(e)}")

@router.get("/audit-logs/export")
async def export_audit_logs(
    format: str = Query("csv", description="Export format: csv, json, excel"),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    agent: Optional[str] = Query(None),
    event_type: Optional[str] = Query(None),
    user_id: Optional[str] = Query(None),
    level: Optional[str] = Query(None),
    search: Optional[str] = Query(None)
) -> StreamingResponse:
    """Export audit logs in various formats"""
    try:
        # Parse dates
        parsed_start_date = None
        parsed_end_date = None
        
        if start_date:
            parsed_start_date = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
        if end_date:
            parsed_end_date = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
        
        # Get all logs (no pagination for export)
        logs_data = generate_mock_audit_logs(
            start_date=parsed_start_date,
            end_date=parsed_end_date,
            agent=agent,
            event_type=event_type,
            user_id=user_id,
            level=level,
            search=search,
            page=1,
            page_size=10000  # Large number to get all results
        )
        
        if format == "json":
            # Return JSON format
            json_str = json.dumps(logs_data, indent=2)
            return StreamingResponse(
                io.BytesIO(json_str.encode()),
                media_type="application/json",
                headers={
                    "Content-Disposition": f"attachment; filename=audit_logs_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
                }
            )
        
        elif format == "csv":
            # Generate CSV format
            output = StringIO()
            writer = csv.writer(output)
            
            # Write headers
            headers = [
                "ID", "Timestamp", "User Email", "Agent", "Event Type", "Event Details",
                "Model Used", "Session ID", "Task ID", "Cost Estimate", "Duration (ms)",
                "Error", "Level"
            ]
            writer.writerow(headers)
            
            # Write data rows
            for log in logs_data["logs"]:
                writer.writerow([
                    log["id"],
                    log["timestamp"],
                    log["user_email"],
                    log["agent"],
                    log["event_type"],
                    log["event_details"],
                    log["model_used"] or "",
                    log["session_id"] or "",
                    log["task_id"] or "",
                    log["cost_estimate"] or "",
                    log["duration_ms"] or "",
                    log["error"] or "",
                    log["level"]
                ])
            
            csv_content = output.getvalue()
            output.close()
            
            return StreamingResponse(
                io.BytesIO(csv_content.encode()),
                media_type="text/csv",
                headers={
                    "Content-Disposition": f"attachment; filename=audit_logs_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
                }
            )
        
        else:  # excel or other formats
            # For Excel, we'll return a simple JSON for now
            # In production, you'd use openpyxl or similar library
            json_str = json.dumps(logs_data, indent=2)
            return StreamingResponse(
                io.BytesIO(json_str.encode()),
                media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                headers={
                    "Content-Disposition": f"attachment; filename=audit_logs_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
                }
            )
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to export audit logs: {str(e)}")

@router.get("/audit-logs/stats")
async def get_audit_logs_stats(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None)
) -> Dict[str, Any]:
    """Get audit logs statistics and summary"""
    try:
        # Parse dates
        parsed_start_date = None
        parsed_end_date = None
        
        if start_date:
            parsed_start_date = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
        if end_date:
            parsed_end_date = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
        
        # In production, this would query aggregated stats from database
        # For now, use mock data
        return {
            "total_entries": 1247,
            "date_range": {
                "start": (parsed_start_date or datetime.now() - timedelta(days=30)).isoformat(),
                "end": (parsed_end_date or datetime.now()).isoformat()
            },
            "by_event_type": {
                "agent_call": 567,
                "file_upload": 234,
                "sheet_export": 189,
                "user_action": 156,
                "prompt_edit": 67,
                "system_event": 34
            },
            "by_agent": {
                "estimator": 234,
                "file-reader": 198,
                "manager": 187,
                "qa-validator": 156,
                "trade-mapper": 134,
                "scope": 123,
                "takeoff": 112,
                "exporter": 103
            },
            "by_level": {
                "info": 1089,
                "warning": 98,
                "error": 34,
                "debug": 23,
                "critical": 3
            },
            "cost_summary": {
                "total_cost": 127.45,
                "average_cost_per_call": 0.23,
                "highest_cost": 2.34,
                "lowest_cost": 0.01
            },
            "performance": {
                "average_duration_ms": 1234,
                "fastest_operation_ms": 45,
                "slowest_operation_ms": 8900,
                "success_rate": 97.3
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch audit logs stats: {str(e)}")

@router.post("/audit-logs")
async def create_audit_log(audit_log: AuditLogCreate = Body(...)) -> Dict[str, str]:
    """Create a new audit log entry and store it in the database"""
    try:
        # Generate a unique ID for the audit log
        log_id = f"audit-{uuid.uuid4().hex[:8]}"
        
        # Create a complete audit log entry with timestamp and ID
        audit_entry: Dict[str, Any] = {
            "id": log_id,
            "timestamp": datetime.now().isoformat(),
            **audit_log.model_dump(exclude_none=True)
        }
        
        if supabase_available:
            try:
                # Store the audit log in Supabase
                supabase = get_supabase_client()
                result = supabase.table("audit_logs").insert(audit_entry).execute()
                
                # Check if the insert was successful
                if hasattr(result, 'data') and result.data:
                    return {"message": "Audit log entry created successfully", "log_id": log_id}
                else:
                    # Fall back to local storage if Supabase fails
                    print(f"Warning: Supabase insert failed, using local storage for audit log {log_id}")
            except Exception as db_error:
                # Log the database error but continue with local storage
                print(f"Database error: {db_error}")
        
        # For development or when Supabase is not available, store mock data in memory
        store_audit_log_locally(audit_entry)
        return {"message": "Audit log entry created successfully", "log_id": log_id}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create audit log: {str(e)}")

# Background task function
async def process_export_job(job_id: str, request_data: Dict[str, Any]) -> None:
    """Process export job in background"""
    # In production, this would:
    # 1. Generate the requested export
    # 2. Save to file storage
    # 3. Update job status in database
    # 4. Send notification when complete
    pass
