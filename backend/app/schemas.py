from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone

class File(BaseModel):
    name: str
    content: Optional[str] = None # Or bytes, depending on how you handle file content
    metadata: Dict[str, Any] = Field(default_factory=dict)

class AgentTraceEntry(BaseModel):
    agent: str
    decision: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    level: Optional[str] = None # e.g., 'info', 'error'
    error: Optional[str] = None

class MeetingLogEntry(BaseModel):
    agent: Optional[str] = None
    message: Optional[str] = None
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class EstimateItem(BaseModel):
    item: str
    qty: float
    unit: str
    unit_price: float
    total: float

class AppState(BaseModel):
    query: Optional[str] = None
    content: Optional[str] = None
    files: List[File] = Field(default_factory=list)
    metadata: Dict[str, Any] = Field(default_factory=dict)
    user_id: Optional[str] = None
    session_id: Optional[str] = None
    estimate: List[EstimateItem] = Field(default_factory=list)
    
    agent_trace: List[AgentTraceEntry] = Field(default_factory=list)
    meeting_log: List[MeetingLogEntry] = Field(default_factory=list)
    
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    error: Optional[str] = None
    
    # To hold results from agents
    export: Optional[str] = None # Result from exporter agent

    class Config:
        # formerly orm_mode, allows Pydantic to work with ORM objects if you use them later
        from_attributes = True 

# For API request body, if it's different from AppState or a subset
class AnalyzeRequest(BaseModel):
    query: Optional[str] = None
    content: Optional[str] = None
    files: Optional[List[File]] = None
    metadata: Optional[Dict[str, Any]] = None
    user_id: Optional[str] = None
    session_id: Optional[str] = None
    estimate: Optional[List[EstimateItem]] = None

# For API response body
class AnalyzeResponse(AppState): # The response can be the full state
    pass

