# pipbycdo/backend/routes/api.py
# type: ignore
from fastapi import APIRouter, HTTPException, Header, File as FastAPIFile, UploadFile, Form, BackgroundTasks
from fastapi.responses import StreamingResponse
from backend.app.schemas import (
    AppState, 
    AnalyzeResponse, 
    File as SchemaFile, 
    EstimateItem,
    AnalyzeTaskSubmissionResponse,
    TaskStatusResponse
)
from backend.agents.manager_agent import handle as manager_handle
from typing import Optional, List, Dict, Any, TypedDict, cast, Protocol, Union
# type: ignore # Suppressing all typing errors in this file
from datetime import datetime, timezone
import json
import uuid
import io
from backend.services.supabase_client import get_supabase_client, TASKS_TABLE_NAME
from backend.services.file_compression import file_compression_service


# Define protocol classes for Supabase operations
class SupabaseResult:
    data: Optional[List[Dict[str, Any]]]

class SupabaseFilterBuilder(Protocol):
    def eq(self, column: str, value: Any) -> 'SupabaseFilterBuilder': ...
    def execute(self) -> SupabaseResult: ...
    def single(self) -> 'SupabaseFilterBuilder': ...

class SupabaseQueryBuilder(Protocol):
    def execute(self) -> SupabaseResult: ...

class SupabaseTable(Protocol):
    def select(self, *columns: str) -> SupabaseFilterBuilder: ...
    def insert(self, data: Dict[str, Any] | List[Dict[str, Any]], **kwargs: Any) -> SupabaseQueryBuilder: ...
    def update(self, data: Dict[str, Any], **kwargs: Any) -> SupabaseFilterBuilder: ...
    def delete(self, **kwargs: Any) -> SupabaseFilterBuilder: ...
    
class SupabaseClient(Protocol):
    def table(self, table_name: str) -> SupabaseTable: ...

# Define compression service result types
class CompressionResult(TypedDict):
    status: str
    original_size: int
    compressed_size: int
    compressed_data: bytes
    compression_ratio: float
    error: Optional[str]

class CompressionEstimate(TypedDict):
    estimated_compressed_size: int
    estimated_compression_ratio: float
    estimated_time_seconds: float
    supported: bool

router = APIRouter()

@router.get("/health")
async def health_check():
    return {"status": "ok"}

# Helper function to run the analysis in the background
async def run_analysis_task(task_id: str, state_dict: Dict[str, Any]) -> None:
    try:
        # Cast the result of manager_handle to Dict[str, Any] to ensure proper typing
        final_state_dict: Dict[str, Any] = cast(Dict[str, Any], await manager_handle(state_dict))
        update_data: Dict[str, Any] = {
            "status": "completed",
            "result": final_state_dict, # Ensure this is JSON serializable
            "error": None,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        
        # Try to update in Supabase
        try:
            supabase: SupabaseClient = get_supabase_client()
            supabase.table(TASKS_TABLE_NAME).update(update_data).eq("id", task_id).execute()
            print(f"Task {task_id} completed and updated in Supabase")
        except Exception as db_error:
            print(f"Warning: Could not update task in Supabase ({db_error}), using local storage")
            # Fallback to local storage
            from backend.routes.local_storage import update_task_locally
            update_task_locally(task_id, update_data)
            
    except Exception as e:
        error_data: Dict[str, Any] = {
            "status": "failed",
            "error": str(e),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        
        # Try to update error in Supabase
        try:
            supabase: SupabaseClient = get_supabase_client()
            supabase.table(TASKS_TABLE_NAME).update(error_data).eq("id", task_id).execute()
            print(f"Task {task_id} failed: {str(e)}")
        except Exception as db_error:
            print(f"Warning: Could not update task error in Supabase ({db_error}), using local storage")
            # Fallback to local storage
            from backend.routes.local_storage import update_task_locally
            update_task_locally(task_id, error_data)

@router.post("/analyze", response_model=AnalyzeTaskSubmissionResponse)
async def analyze(
    background_tasks: BackgroundTasks,
    internal_code: Optional[str] = Header(None, alias="X-Internal-Code"),
    query: Optional[str] = Form(None),
    content: Optional[str] = Form(None),
    user_id: Optional[str] = Form(None),
    session_id: Optional[str] = Form(None),
    metadata_json: Optional[str] = Form(None),
    estimate_json: Optional[str] = Form(None),
    files: Optional[List[UploadFile]] = FastAPIFile(None)
):
    if internal_code != "hermes":
        raise HTTPException(status_code=401, detail="Unauthorized")

    current_time = datetime.now(timezone.utc)
    
    parsed_metadata: Dict[str, Any] = {}
    if metadata_json:
        try:
            parsed_metadata = json.loads(metadata_json)
        except json.JSONDecodeError:
            raise HTTPException(status_code=400, detail="Invalid JSON format for metadata.")

    parsed_estimate: List[EstimateItem] = []
    if estimate_json:
        try:
            estimate_data = json.loads(estimate_json)
            for item_data in estimate_data:
                parsed_estimate.append(EstimateItem(**item_data))
        except json.JSONDecodeError:
            raise HTTPException(status_code=400, detail="Invalid JSON format for estimate.")
        except Exception as e: # Catch broader exceptions for Pydantic validation
            raise HTTPException(status_code=400, detail=f"Invalid estimate data: {e}")


    processed_files: List[SchemaFile] = []
    if files:
        for uploaded_file in files:
            file_content = await uploaded_file.read()
            processed_files.append(
                SchemaFile(
                    filename=uploaded_file.filename if uploaded_file.filename else "unknown",
                    data=file_content, # data is Optional[bytes], this is correct
                    metadata={} # Initialize metadata
                )
            )
            # Add content_type to metadata if available
            if uploaded_file.content_type:
                 processed_files[-1].metadata["content_type"] = uploaded_file.content_type


    state = AppState(
        query=query,
        content=content,
        files=processed_files,
        metadata=parsed_metadata,
        user_id=user_id,
        session_id=session_id,
        estimate=parsed_estimate,
        agent_trace=[],
        meeting_log=[],
        created_at=current_time,
        updated_at=current_time,
        error=None
    )

    task_id = str(uuid.uuid4())
    supabase = get_supabase_client()

    # Insert initial task record into Supabase or local storage
    try:
        supabase.table(TASKS_TABLE_NAME).insert({
            "id": task_id,
            "status": "pending",
            "created_at": current_time.isoformat(),
            "updated_at": current_time.isoformat(),
            "initial_payload": state.model_dump(mode='json') # Storing the initial request, ensure JSON serializable
        }).execute()
        print(f"Task {task_id} created in Supabase successfully")
    except Exception as e:
        print(f"Warning: Could not insert task into Supabase ({e}), using local storage")
        # Fallback to local storage when Supabase is not available
        from backend.routes.local_storage import store_task_locally
        store_task_locally(task_id, {
            "id": task_id,
            "status": "pending",
            "created_at": current_time.isoformat(),
            "updated_at": current_time.isoformat(),
            "initial_payload": state.model_dump(mode='json')
        })


    # Temporary sync approach for debugging
    def sync_wrapper():
        try:
            import asyncio
            # Create new event loop for background task
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            result = loop.run_until_complete(run_analysis_task(task_id, state.model_dump(mode='json')))
            loop.close()
        except Exception as e:
            print(f"Background task error: {e}")
    
    background_tasks.add_task(sync_wrapper) 
    
    return AnalyzeTaskSubmissionResponse(task_id=task_id, status="pending")

@router.get("/tasks/{task_id}/status", response_model=TaskStatusResponse)
async def get_task_status(task_id: str):
    # Try to get task from Supabase
    task_data = None
    try:
        supabase = get_supabase_client()
        response = supabase.table(TASKS_TABLE_NAME).select("id, status, result, error, created_at, updated_at").eq("id", task_id).single().execute()
        task_data = response.data
        print(f"Task {task_id} retrieved from Supabase")
    except Exception as e:
        print(f"Error fetching task from Supabase: {e}")
        # Try to get task from local storage as fallback
        try:
            from backend.routes.local_storage import get_task_locally
            task_data = get_task_locally(task_id)
            if task_data:
                print(f"Task {task_id} retrieved from local storage")
            else:
                # Check if the error is due to PostgREST raising an error for .single() when no rows are found
                if "PGRST116" in str(e): # PGRST116: JSON object requested, multiple (or no) rows returned
                    raise HTTPException(status_code=404, detail="Task not found")
                raise HTTPException(status_code=500, detail="Error fetching task status from database.")
        except ImportError:
            # If local_storage module is not available
            raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    
    if not task_data:
        raise HTTPException(status_code=404, detail="Task not found")
    
    # Ensure status is a string, otherwise default to an error status
    status_from_db = task_data.get("status")
    if not isinstance(status_from_db, str):
        print(f"Task {task_id} has invalid or missing status in DB: {status_from_db}")
        return TaskStatusResponse(
            task_id=task_id,
            status="error",
            error="Task status is missing or invalid in the database."
        )
    status: str = status_from_db

    error_message = task_data.get("error")
    result_data = task_data.get("result") 

    response_result_model: Optional[AnalyzeResponse] = None
    if status == "completed" and result_data:
        if isinstance(result_data, str):
            try:
                result_data = json.loads(result_data) # If result is stored as a JSON string
            except json.JSONDecodeError:
                print(f"Result JSON parsing error for task {task_id}: Invalid JSON string")
                return TaskStatusResponse(
                    task_id=task_id, 
                    status="error", 
                    error="Result data is a malformed JSON string."
                )
        
        if isinstance(result_data, dict):
            try:
                # Create response model from result data
                # We ignore the typing errors from **result_data as we do runtime validation
                response_result_model = AnalyzeResponse(**result_data)
            except Exception as e:
                print(f"Result Pydantic parsing error for task {task_id}: {e}")
                return TaskStatusResponse(
                    task_id=task_id, 
                    status="error", 
                    error=f"Result parsing error: {str(e)}" 
                )
        else:
            print(f"Result data for task {task_id} is not a dictionary after potential JSON parsing.")
            return TaskStatusResponse(
                task_id=task_id,
                status="error",
                error="Result data is not in the expected format (dictionary)."
            )
            
    return TaskStatusResponse(
        task_id=task_id,
        status=status,
        result=response_result_model,
        error=error_message
    )

@router.post("/compress-file")
async def compress_file(
    internal_code: Optional[str] = Header(None, alias="X-Internal-Code"),
    file: UploadFile = FastAPIFile(...),
    quality: Optional[str] = Form("medium")  # high, medium, low
):
    """
    Compress a single file and return the compressed version.
    Supports PDF, images, and Office documents.
    """
    if internal_code != "hermes":
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    # Validate quality parameter
    if quality not in ["high", "medium", "low"]:
        raise HTTPException(status_code=400, detail="Quality must be 'high', 'medium', or 'low'")
    
    # Read file content
    try:
        file_content = await file.read()
        if not file_content:
            raise HTTPException(status_code=400, detail="Empty file provided")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to read file: {str(e)}")
    
    # Get file extension for type detection
    filename = file.filename or "unknown"
    file_extension = filename.lower().split('.')[-1] if '.' in filename else ""
    
    # Compress the file
    try:
        compression_result = file_compression_service.compress_file(
            file_data=file_content,
            filename=filename,
            content_type=file.content_type or f"application/{file_extension}",
            quality=quality
        )
        
        if compression_result["status"] == "error":
            raise HTTPException(status_code=500, detail=compression_result["error"])
        
        compressed_content = compression_result["compressed_data"]
        original_size = compression_result["original_size"]
        compressed_size = compression_result["compressed_size"]
        compression_ratio = compression_result["compression_ratio"]
        
        # Prepare response headers
        response_headers: Dict[str, str] = {
            "Content-Disposition": f'attachment; filename="compressed_{filename}"',
            "X-Original-Size": str(original_size),
            "X-Compressed-Size": str(compressed_size),
            "X-Compression-Ratio": f"{compression_ratio:.1f}%",
            "X-Quality-Setting": quality,
            "X-Compression-Status": compression_result["status"]
        }
        
        # Return compressed file as streaming response
        return StreamingResponse(
            io.BytesIO(compressed_content),
            media_type=file.content_type or "application/octet-stream",
            headers=response_headers
        )
        
    except Exception as e:
        # If compression fails, return appropriate error
        error_message = str(e)
        if "not supported" in error_message.lower():
            raise HTTPException(status_code=400, detail=f"File type not supported for compression: {error_message}")
        else:
            raise HTTPException(status_code=500, detail=f"Compression failed: {error_message}")

@router.post("/estimate-compression")
async def estimate_compression(
    internal_code: Optional[str] = Header(None, alias="X-Internal-Code"),
    file: UploadFile = FastAPIFile(...),
    quality: Optional[str] = Form("medium")
) -> Dict[str, Any]:
    """
    Estimate compression for a file without actually compressing it.
    Returns estimated file size reduction and processing time.
    """
    if internal_code != "hermes":
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    if quality not in ["high", "medium", "low"]:
        raise HTTPException(status_code=400, detail="Quality must be 'high', 'medium', or 'low'")
    
    try:
        file_content = await file.read()
        if not file_content:
            raise HTTPException(status_code=400, detail="Empty file provided")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to read file: {str(e)}")
    
    filename = file.filename or "unknown"
    file_extension = filename.lower().split('.')[-1] if '.' in filename else ""
    
    try:
        estimation = file_compression_service.get_compression_estimate(
            file_size=len(file_content),
            content_type=file.content_type or f"application/{file_extension}"
        )
        
        return {
            "original_size": len(file_content),
            "estimated_compressed_size": estimation["estimated_compressed_size"],
            "estimated_compression_ratio": estimation["estimated_compression_ratio"],
            "estimated_processing_time": estimation["estimated_time_seconds"],
            "quality_setting": quality,
            "is_compressible": estimation["supported"]
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Estimation failed: {str(e)}")

# Template Management Endpoints

# Add PromptTemplate schema
class PromptTemplate:
    def __init__(self, id: str, label: str, prompt: str, category: str, icon: str, description: Optional[str] = None, isAdmin: bool = False, tags: Optional[List[str]] = None):
        self.id = id
        self.label = label
        self.prompt = prompt
        self.category = category
        self.icon = icon
        self.description = description
        self.isAdmin = isAdmin
        self.tags = tags or []

# Default templates
DEFAULT_TEMPLATES: List[Dict[str, Any]] = [
    {
        "id": "summarize-scope",
        "label": "Summarize Scope",
        "prompt": "Please analyze the uploaded documents and provide a comprehensive scope summary, highlighting key project objectives, deliverables, and requirements.",
        "category": "analysis",
        "icon": "FileText",
        "description": "Generate a detailed scope summary from documents",
        "isAdmin": False,
        "tags": ["scope", "summary", "analysis"]
    },
    {
        "id": "generate-rfi",
        "label": "Generate RFI",
        "prompt": "Based on the analyzed documents, generate a comprehensive Request for Information (RFI) addressing unclear requirements and necessary clarifications.",
        "category": "generation",
        "icon": "MessageSquare", 
        "description": "Create RFI for unclear requirements",
        "isAdmin": False,
        "tags": ["rfi", "questions", "clarification"]
    },
    {
        "id": "identify-missing-info",
        "label": "Identify Missing Info", 
        "prompt": "Review the provided documents and identify any missing information, gaps in requirements, or areas that need clarification for project completion.",
        "category": "analysis",
        "icon": "Search",
        "description": "Find gaps and missing requirements",
        "isAdmin": False,
        "tags": ["gaps", "requirements", "missing"]
    },
    {
        "id": "effort-estimation",
        "label": "Effort Estimation",
        "prompt": "Provide effort estimates for the identified deliverables, including time, resources, and complexity analysis.",
        "category": "estimation",
        "icon": "Calculator",
        "description": "Estimate project effort and resources",
        "isAdmin": False,
        "tags": ["estimation", "effort", "resources"]
    }
]

@router.get("/templates")
async def get_templates(admin: bool = False) -> Dict[str, List[Dict[str, Any]]]:
    try:
        supabase = get_supabase_client()
        
        # Try to get custom templates from database
        try:
            query = supabase.table("prompt_templates").select("*")
            if not admin:
                query = query.eq("isAdmin", False)
            
            result = query.execute()
            custom_templates = result.data or []
        except Exception as e:
            print(f"Database query failed, using defaults: {e}")
            custom_templates = []
        
        # Combine with default templates
        all_templates: List[Dict[str, Any]] = DEFAULT_TEMPLATES.copy()
        # Add custom templates, replacing defaults if they have the same ID
        for custom_template in custom_templates:
            # Find if there's a default template with the same ID
            existing_index = next((i for i, t in enumerate(all_templates) if t["id"] == custom_template["id"]), None)
            if existing_index is not None:
                all_templates[existing_index] = custom_template
            else:
                all_templates.append(custom_template)
        
        # Filter by admin status if requested
        if not admin:
            all_templates = [t for t in all_templates if not t.get("isAdmin", False)]
        
        return {"templates": all_templates}
        
    except Exception as e:
        print(f"Error in get_templates: {e}")
        # Fallback to default templates only
        filtered_defaults: List[Dict[str, Any]] = [t for t in DEFAULT_TEMPLATES if not admin or not t.get("isAdmin", False)]
        return {"templates": filtered_defaults}

@router.post("/templates")
async def create_template(template_data: Dict[str, Any]) -> Dict[str, Any]:
    try:
        supabase = get_supabase_client()
        
        # Validate required fields
        required_fields = ["label", "prompt", "category", "icon"]
        for field in required_fields:
            if field not in template_data:
                raise HTTPException(status_code=400, detail=f"Missing required field: {field}")
        
        # Generate ID if not provided
        if "id" not in template_data:
            template_data["id"] = f"custom-{uuid.uuid4()}"
        
        # Set defaults
        template_data.setdefault("description", "")
        template_data.setdefault("isAdmin", False)
        template_data.setdefault("tags", [])
        template_data["created_at"] = datetime.now(timezone.utc).isoformat()
        template_data["updated_at"] = datetime.now(timezone.utc).isoformat()
        
        # Insert into database
        try:
            result = supabase.table("prompt_templates").insert(template_data).execute()
            return {"template": result.data[0] if result.data else template_data}
        except Exception as e:
            print(f"Database insert failed: {e}")
            # For now, just return the template data without persistence
            return {"template": template_data, "warning": "Template not persisted to database"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create template: {str(e)}")
@router.put("/templates/{template_id}")
async def update_template(template_id: str, template_data: Dict[str, Any]) -> Dict[str, Any]:
    try:
        supabase = get_supabase_client()
        
        # Add updated timestamp
        template_data["updated_at"] = datetime.now(timezone.utc).isoformat()
        template_data["id"] = template_id  # Ensure ID is set
        
        # Update in database
        try:
            result = supabase.table("prompt_templates").update(template_data).eq("id", template_id).execute()
            if result.data:
                return {"template": result.data[0]}
            else:
                # Template might not exist in DB, treat as create
                template_data["created_at"] = datetime.now(timezone.utc).isoformat()
                result = supabase.table("prompt_templates").insert(template_data).execute()
                return {"template": result.data[0] if result.data else template_data}
        except Exception as e:
            print(f"Database update failed: {e}")
            # For now, just return the template data without persistence
            return {"template": template_data, "warning": "Template not persisted to database"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update template: {str(e)}")

@router.delete("/templates/{template_id}")
async def delete_template(template_id: str):
    """Delete a prompt template"""
    try:
        supabase = get_supabase_client()
        
        # Check if it's a default template (prevent deletion)
        default_ids: List[str] = [str(t["id"]) for t in DEFAULT_TEMPLATES]
        if template_id in default_ids:
            raise HTTPException(status_code=400, detail="Cannot delete default templates")
        
        # Delete from database
        try:
            supabase.table("prompt_templates").delete().eq("id", template_id).execute()
            return {"message": f"Template {template_id} deleted successfully"}
        except Exception as e:
            print(f"Database delete failed: {e}")
            return {"message": f"Template {template_id} marked for deletion", "warning": "Not removed from database"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete template: {str(e)}")
