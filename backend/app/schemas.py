from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
import json # Added for parsing JSON strings from form data

class File(BaseModel):
    name: str
    content: Optional[bytes] = None # Changed to bytes for raw file content
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
    description: Optional[str] = None # Added
    qty: float
    unit: str
    unit_price: float
    total: float
    csi_division: Optional[str] = None # Added
    notes: Optional[str] = None # Added

class AppState(BaseModel):
    query: Optional[str] = None
    content: Optional[str] = None
    files: List[File] = Field(default_factory=list)
    
    # Outputs from various agents
    processed_files_content: Optional[Dict[str, str]] = Field(default_factory=dict) # For File Reader output
    trade_mapping: Optional[List[Dict[str, Any]]] = Field(default_factory=list) # For Trade Mapper output
    scope_items: Optional[List[Dict[str, Any]]] = Field(default_factory=list) # For Scope Agent output
    takeoff_data: Optional[List[Dict[str, Any]]] = Field(default_factory=list) # For Takeoff Agent output
    
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
    export: Optional[str] = None # Result from exporter agent - general message
    export_options: Optional[Dict[str, Any]] = Field(default_factory=dict) # For export parameters
    exported_file_content: Optional[bytes] = None # For the content of the exported file
    exported_file_name: Optional[str] = None # For the name of the exported file
    exported_content_type: Optional[str] = None # For the MIME type of the exported file

    class Config:
        # formerly orm_mode, allows Pydantic to work with ORM objects if you use them later
        from_attributes = True 

# For API request body - this will now primarily be for non-file data
# when using multipart/form-data. Files will be handled separately.
# Complex objects like 'metadata' and 'estimate' will be sent as JSON strings
# and parsed in the endpoint.
class AnalyzeRequestData(BaseModel):
    query: Optional[str] = None
    content: Optional[str] = None # For main text content, if not in a file
    # files: Optional[List[File]] = None # This will be handled by UploadFile directly
    metadata_json: Optional[str] = None # To be parsed into Dict[str, Any]
    user_id: Optional[str] = None
    session_id: Optional[str] = None
    estimate_json: Optional[str] = None # To be parsed into List[EstimateItem]

# For API response body
class AnalyzeResponse(AppState): # The response can be the full state
    pass

class AnalyzeTaskSubmissionResponse(BaseModel):
    task_id: str
    status: str

class TaskStatusResponse(BaseModel):
    task_id: str
    status: str
    result: Optional[AnalyzeResponse] = None
    error: Optional[str] = None

