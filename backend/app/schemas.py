from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone

class File(BaseModel):
    filename: str  # Changed from 'name' to 'filename' to match spec
    type: Optional[str] = None  # pdf, docx, xlsx, txt, image, etc.
    status: Optional[str] = None  # parsed, raw, error, etc.
    data: Optional[bytes] = None # Raw file content
    content: Optional[str] = None # Parsed text content
    metadata: Dict[str, Any] = Field(default_factory=dict)

class LLMConfig(BaseModel):
    model: str
    api_key: Optional[str] = None
    params: Dict[str, Any] = Field(default_factory=lambda: {
        "temperature": 0,
        "max_tokens": 4000
    })
    token_usage: Optional[Dict[str, Any]] = None
    cost_estimate: Optional[float] = None

class HistoryEntry(BaseModel):
    role: str  # "user", "assistant", "system"
    content: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class AgentTraceEntry(BaseModel):
    agent: str
    decision: str
    model: Optional[str] = None  # Track which model was used
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    level: Optional[str] = None # e.g., 'info', 'error'
    error: Optional[str] = None

class MeetingLogEntry(BaseModel):
    agent: str
    message: str
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
    # Core input fields
    query: Optional[str] = None
    content: Optional[str] = None
    files: List[File] = Field(default_factory=lambda: [])
    
    # Metadata about the request/project
    metadata: Dict[str, Any] = Field(default_factory=lambda: {
        "project_name": None,
        "location": None,
        "trade": None,
        "sheet_id": None,
        "source": None,
        "user_id": None
    })
    
    # LLM configuration
    llm_config: Optional[LLMConfig] = None
    
    # Conversation history
    history: List[HistoryEntry] = Field(default_factory=lambda: [])
    
    # Agent coordination and logging
    meeting_log: List[MeetingLogEntry] = Field(default_factory=lambda: [])
    agent_trace: List[AgentTraceEntry] = Field(default_factory=lambda: [])
    
    # Agent-specific output fields
    processed_files_content: Optional[Dict[str, str]] = Field(default_factory=lambda: {}) # For File Reader output
    trade_mapping: Optional[List[Dict[str, Any]]] = Field(default_factory=lambda: []) # For Trade Mapper output
    scope_items: Optional[List[Dict[str, Any]]] = Field(default_factory=lambda: []) # For Scope Agent output
    takeoff_data: Optional[List[Dict[str, Any]]] = Field(default_factory=lambda: []) # For Takeoff Agent output
    qa_findings: Optional[List[Dict[str, Any]]] = Field(default_factory=lambda: []) # For QA Validator output
    
    # User and session management
    user_id: Optional[str] = None
    session_id: Optional[str] = None
    
    # Final outputs
    estimate: List[EstimateItem] = Field(default_factory=lambda: [])
    result: Optional[Any] = None  # General result field
    manager_response: Optional[str] = None  # For direct manager responses
    
    # Export functionality
    export: Optional[str] = None # Result from exporter agent - general message
    export_options: Optional[Dict[str, Any]] = Field(default_factory=lambda: {}) # For export parameters
    exported_file_content: Optional[bytes] = None # For the content of the exported file
    exported_file_name: Optional[str] = None # For the name of the exported file
    exported_content_type: Optional[str] = None # For the MIME type of the exported file
    
    # State management
    status: Optional[str] = None  # Protocol status: processing, awaiting_user_input, complete, error
    pending_user_action: Optional[str] = None  # What action is needed from user
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    error: Optional[str] = None

    model_config = ConfigDict(from_attributes=True) 

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

