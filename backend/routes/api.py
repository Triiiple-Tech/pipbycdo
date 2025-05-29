# pipbycdo/backend/routes/api.py
from fastapi import APIRouter, HTTPException, Header, File as FastAPIFile, UploadFile, Form, BackgroundTasks
from backend.app.schemas import (
    AppState, 
    AnalyzeResponse, 
    File as SchemaFile, 
    EstimateItem,
    AnalyzeTaskSubmissionResponse,
    TaskStatusResponse
)
from backend.agents.manager_agent import handle as manager_handle
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any 
import json
import uuid
from backend.services.supabase_client import get_supabase_client, TASKS_TABLE_NAME

router = APIRouter()

@router.get("/health")
async def health_check():
    return {"status": "ok"}

# Helper function to run the analysis in the background
def run_analysis_task(task_id: str, state_dict: dict):
    supabase = get_supabase_client()
    try:
        final_state_dict = manager_handle(state_dict)
        # Update task in Supabase
        supabase.table(TASKS_TABLE_NAME).update({
            "status": "completed",
            "result": final_state_dict, # Ensure this is JSON serializable
            "error": None,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }).eq("id", task_id).execute()
    except Exception as e:
        # Update task in Supabase with error
        supabase.table(TASKS_TABLE_NAME).update({
            "status": "failed",
            "error": str(e),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }).eq("id", task_id).execute()

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
                    name=uploaded_file.filename if uploaded_file.filename else "unknown",
                    content=file_content, # content is Optional[bytes], this is correct
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

    # Insert initial task record into Supabase
    try:
        supabase.table(TASKS_TABLE_NAME).insert({
            "id": task_id,
            "status": "pending",
            "created_at": current_time.isoformat(),
            "updated_at": current_time.isoformat(),
            "initial_payload": state.model_dump(mode='json') # Storing the initial request, ensure JSON serializable
        }).execute()
    except Exception as e:
        print(f"Error inserting initial task record into Supabase: {e}")
        raise HTTPException(status_code=500, detail="Failed to create task in database.")


    background_tasks.add_task(run_analysis_task, task_id, state.model_dump(mode='json')) 
    
    return AnalyzeTaskSubmissionResponse(task_id=task_id, status="pending")

@router.get("/tasks/{task_id}/status", response_model=TaskStatusResponse)
async def get_task_status(task_id: str):
    supabase = get_supabase_client()
    try:
        response = supabase.table(TASKS_TABLE_NAME).select("id, status, result, error, created_at, updated_at").eq("id", task_id).single().execute()
        task_data = response.data
    except Exception as e:
        print(f"Error fetching task from Supabase: {e}")
        # Check if the error is due to PostgREST raising an error for .single() when no rows are found
        if "PGRST116" in str(e): # PGRST116: JSON object requested, multiple (or no) rows returned
             raise HTTPException(status_code=404, detail="Task not found")
        raise HTTPException(status_code=500, detail="Error fetching task status from database.")

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
