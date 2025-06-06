# Audit Log API endpoint for PIP AI system
"""
Add this to the end of analytics.py or create as separate audit.py
"""

from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import StreamingResponse
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
from enum import Enum
from pydantic import BaseModel, Field
import random
import uuid
import json
import io

# Define router - note that in production this would be imported from analytics.py
router = APIRouter(prefix="/analytics", tags=["analytics"])

# Enums for validation
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

# Pydantic Models for Audit Logs
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

# In-memory storage for audit logs when database is unavailable
local_audit_logs: List[Dict[str, Any]] = []

def store_audit_log_locally(audit_log: Dict[str, Any]) -> None:
    """Store an audit log entry in local memory for development/testing"""
    local_audit_logs.append(audit_log)
    # Limit the size of in-memory logs to prevent memory issues
    if len(local_audit_logs) > 1000:
        local_audit_logs.pop(0)  # Remove oldest log

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
    filtered_entries = audit_entries
    
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
            search_lower in e["event_details"].lower() or 
            search_lower in e["agent"].lower() or
            search_lower in e["user_email"].lower()]
    
    # Sort by timestamp (newest first)
    filtered_entries.sort(key=lambda x: x["timestamp"], reverse=True)
    
    # Pagination
    total_count = len(filtered_entries)
    start_index = (page - 1) * page_size
    end_index = start_index + page_size
    paginated_entries = filtered_entries[start_index:end_index]
    
    # Convert datetime objects to ISO strings for JSON serialization
    for entry in paginated_entries:
        entry["timestamp"] = entry["timestamp"].isoformat()
    
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
):
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

@router.post("/audit-logs")
async def create_audit_log(
    user_id: Optional[str] = None,
    agent: str = "system",
    event_type: EventType = EventType.system_event,
    event_details: str = "Manual audit log entry",
    model_used: Optional[str] = None,
    session_id: Optional[str] = None,
    task_id: Optional[str] = None,
    cost_estimate: Optional[float] = None,
    duration_ms: Optional[int] = None,
    level: LogLevel = LogLevel.info
) -> Dict[str, Any]:
    """Create a new audit log entry"""
    try:
        # In production, this would insert into the database
        audit_entry: Dict[str, Any] = {
            "id": f"audit-manual-{uuid.uuid4().hex[:8]}",
            "timestamp": datetime.now().isoformat(),
            "user_id": user_id,
            "agent": agent,
            "event_type": event_type.value,
            "event_details": event_details,
            "model_used": model_used,
            "session_id": session_id,
            "task_id": task_id,
            "cost_estimate": cost_estimate,
            "duration_ms": duration_ms,
            "level": level.value
        }
        
        return {"message": "Audit log entry created successfully", "entry": audit_entry}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create audit log: {str(e)}")

@router.get("/audit-logs/export")
async def export_audit_logs(
    format: str = Query("csv", pattern="^(csv|json|excel)$"),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    agent: Optional[str] = Query(None),
    event_type: Optional[str] = Query(None),
    user_id: Optional[str] = Query(None),
    level: Optional[str] = Query(None),
    search: Optional[str] = Query(None)
):
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
            import csv
            from io import StringIO
            
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
        
        else:  # excel
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
        stats_data: Dict[str, Any] = {
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
        
        return stats_data
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch audit logs stats: {str(e)}")
