# File management routes for PIP AI application
# Handles file uploads, CRUD operations, and processing status

from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List, Optional, Dict, Any, cast
from datetime import datetime, timezone
import uuid
import os
import shutil
import logging

# Set up logging
logger = logging.getLogger(__name__)

router = APIRouter()

# Pydantic models
class FileUploadResponse(BaseModel):
    id: str
    filename: str
    original_name: str
    size: int
    mime_type: str
    url: str
    project_id: Optional[str]
    user_id: str
    created_at: str
    processing_status: str = "pending"
    metadata: Optional[Dict[str, Any]] = None

class FileListResponse(BaseModel):
    id: str
    filename: str
    original_name: str
    size: int
    mime_type: str
    url: str
    project_id: Optional[str]
    created_at: str
    processing_status: str
    metadata: Optional[Dict[str, Any]] = None

# In-memory storage for demo purposes
# In production, this should be replaced with a proper database
files_storage: Dict[str, Dict[str, Any]] = {}

# Configuration
UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "local_storage", "uploads")
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
ALLOWED_EXTENSIONS = {".pdf", ".doc", ".docx", ".xls", ".xlsx", ".txt", ".csv"}

# Ensure upload directory exists
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Helper functions
def get_current_user_id() -> str:
    """Get current user ID - placeholder for actual auth"""
    return "user_123"  # TODO: Implement proper authentication

def create_file_id() -> str:
    return str(uuid.uuid4())

def get_current_timestamp() -> str:
    return datetime.now(timezone.utc).isoformat()

def get_file_extension(filename: str) -> str:
    return os.path.splitext(filename)[1].lower()

def generate_unique_filename(original_filename: str) -> str:
    """Generate a unique filename to avoid conflicts"""
    file_id = str(uuid.uuid4())[:8]
    name, ext = os.path.splitext(original_filename)
    return f"{name}_{file_id}{ext}"

def validate_file(file: UploadFile) -> None:
    """Validate file type and size"""
    if file.size is None:
        raise HTTPException(status_code=400, detail="File size unknown")
    
    if file.size > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail=f"File size exceeds {MAX_FILE_SIZE} bytes")
    
    if file.filename is None:
        raise HTTPException(status_code=400, detail="Filename is required")
    
    ext = get_file_extension(file.filename)
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail=f"File type {ext} not allowed")

# File upload endpoints
@router.post("/upload", response_model=List[FileUploadResponse])
async def upload_files(
    files: List[UploadFile] = File(...),
    project_id: Optional[str] = Form(None)
):
    """Upload one or more files"""
    try:
        if not files:
            raise HTTPException(status_code=400, detail="No files provided")
        
        user_id = get_current_user_id()
        timestamp = get_current_timestamp()
        uploaded_files: List[FileUploadResponse] = []
        
        for file in files:
            # Validate file
            validate_file(file)
            
            # Type guards
            if file.filename is None or file.size is None:
                raise HTTPException(status_code=400, detail="Invalid file data")
            
            # Generate unique filename and save file
            unique_filename = generate_unique_filename(file.filename)
            file_path = os.path.join(UPLOAD_DIR, unique_filename)
            
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
            
            # Create file record
            file_id = create_file_id()
            file_data: Dict[str, Any] = {
                "id": file_id,
                "filename": unique_filename,
                "original_name": file.filename,
                "size": file.size,
                "mime_type": file.content_type or "application/octet-stream",
                "url": f"/api/files/{file_id}/download",
                "project_id": project_id,
                "user_id": user_id,
                "created_at": timestamp,
                "processing_status": "pending",
                "metadata": {
                    "file_path": file_path,
                    "upload_timestamp": timestamp
                }
            }
            
            files_storage[file_id] = file_data
            uploaded_files.append(FileUploadResponse(**file_data))
            
            logger.info(f"File uploaded: {file.filename} -> {unique_filename}")
        
        return uploaded_files
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error uploading files: {e}")
        raise HTTPException(status_code=500, detail="Failed to upload files")

# File management endpoints
@router.get("/", response_model=List[FileListResponse])
async def get_files(project_id: Optional[str] = None):
    """Get all files, optionally filtered by project"""
    try:
        user_id = get_current_user_id()
        user_files: List[FileListResponse] = []
        
        for file_data in files_storage.values():
            if file_data.get("user_id") == user_id:
                if project_id is None or file_data.get("project_id") == project_id:
                    user_files.append(FileListResponse(**file_data))
        
        return user_files
    except Exception as e:
        logger.error(f"Error getting files: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve files")

@router.get("/{file_id}", response_model=FileListResponse)
async def get_file(file_id: str):
    """Get a specific file"""
    try:
        if file_id not in files_storage:
            raise HTTPException(status_code=404, detail="File not found")
        
        file_data = files_storage[file_id]
        user_id = get_current_user_id()
        
        if file_data.get("user_id") != user_id:
            raise HTTPException(status_code=403, detail="Access denied")
        
        return FileListResponse(**file_data)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting file {file_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve file")

@router.delete("/{file_id}")
async def delete_file(file_id: str):
    """Delete a file"""
    try:
        if file_id not in files_storage:
            raise HTTPException(status_code=404, detail="File not found")
        
        file_data = files_storage[file_id]
        user_id = get_current_user_id()
        
        if file_data.get("user_id") != user_id:
            raise HTTPException(status_code=403, detail="Access denied")
        
        # Delete physical file
        metadata = file_data.get("metadata", {})
        file_path = metadata.get("file_path")
        if file_path and isinstance(file_path, str) and os.path.exists(file_path):
            os.remove(file_path)
        
        # Remove from storage
        del files_storage[file_id]
        
        logger.info(f"File deleted: {file_id}")
        return JSONResponse({"message": "File deleted successfully"})
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting file {file_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete file")

@router.get("/{file_id}/download")
async def download_file(file_id: str):
    """Download a file"""
    try:
        if file_id not in files_storage:
            raise HTTPException(status_code=404, detail="File not found")
        
        file_data = files_storage[file_id]
        user_id = get_current_user_id()
        
        if file_data.get("user_id") != user_id:
            raise HTTPException(status_code=403, detail="Access denied")
        
        metadata = file_data.get("metadata", {})
        file_path = metadata.get("file_path")
        
        if not file_path or not isinstance(file_path, str) or not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail="Physical file not found")
        
        # TODO: Return proper file response with streaming
        # For now, return file info
        return JSONResponse({
            "message": "File download endpoint",
            "file_id": file_id,
            "filename": file_data["original_name"],
            "file_path": file_path
        })
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error downloading file {file_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to download file")

# File processing status endpoints
@router.put("/{file_id}/status")
async def update_file_status(file_id: str, status: str):
    """Update file processing status"""
    try:
        if file_id not in files_storage:
            raise HTTPException(status_code=404, detail="File not found")
        
        file_data = files_storage[file_id]
        user_id = get_current_user_id()
        
        if file_data.get("user_id") != user_id:
            raise HTTPException(status_code=403, detail="Access denied")
        
        valid_statuses = ["pending", "processing", "completed", "failed"]
        if status not in valid_statuses:
            raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {valid_statuses}")
        
        files_storage[file_id]["processing_status"] = status
        if "metadata" not in files_storage[file_id]:
            files_storage[file_id]["metadata"] = {}
        
        metadata_dict = files_storage[file_id]["metadata"]
        if isinstance(metadata_dict, dict):
            metadata_dict["last_updated"] = get_current_timestamp()
        
        logger.info(f"File status updated: {file_id} -> {status}")
        return JSONResponse({"message": "Status updated successfully", "status": status})
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating file status {file_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to update file status")

@router.get("/{file_id}/metadata")
async def get_file_metadata(file_id: str) -> Dict[str, Any]:
    """Get file metadata"""
    try:
        if file_id not in files_storage:
            raise HTTPException(status_code=404, detail="File not found")
        
        file_data = files_storage[file_id]
        user_id = get_current_user_id()
        
        if file_data.get("user_id") != user_id:
            raise HTTPException(status_code=403, detail="Access denied")
        
        metadata = file_data.get("metadata", {})
        # Ensure we return a properly typed dictionary
        if isinstance(metadata, dict):
            # Cast to proper type to avoid type checker issues
            return cast(Dict[str, Any], metadata)
        return cast(Dict[str, Any], {})
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting file metadata {file_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to get file metadata")

@router.put("/{file_id}/metadata")
async def update_file_metadata(file_id: str, metadata: Dict[str, Any]):
    """Update file metadata"""
    try:
        if file_id not in files_storage:
            raise HTTPException(status_code=404, detail="File not found")
        
        file_data = files_storage[file_id]
        user_id = get_current_user_id()
        
        if file_data.get("user_id") != user_id:
            raise HTTPException(status_code=403, detail="Access denied")
        
        # Merge new metadata with existing
        current_metadata = files_storage[file_id].get("metadata", {})
        # Ensure proper typing for metadata merge
        if isinstance(current_metadata, dict):
            current_dict = cast(Dict[str, Any], current_metadata)
        else:
            current_dict = {}
        updated_metadata: Dict[str, Any] = {**current_dict, **metadata, "last_updated": get_current_timestamp()}
        
        files_storage[file_id]["metadata"] = updated_metadata
        
        logger.info(f"File metadata updated: {file_id}")
        return JSONResponse({"message": "Metadata updated successfully"})
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating file metadata {file_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to update file metadata")

# Bulk operations
@router.delete("/bulk")
async def delete_multiple_files(file_ids: List[str]):
    """Delete multiple files"""
    try:
        user_id = get_current_user_id()
        deleted_files: List[str] = []
        errors: List[str] = []
        
        for file_id in file_ids:
            try:
                if file_id not in files_storage:
                    errors.append(f"File {file_id} not found")
                    continue
                
                file_data = files_storage[file_id]
                if file_data.get("user_id") != user_id:
                    errors.append(f"Access denied for file {file_id}")
                    continue
                
                # Delete physical file
                metadata = file_data.get("metadata", {})
                file_path = metadata.get("file_path")
                if file_path and isinstance(file_path, str) and os.path.exists(file_path):
                    os.remove(file_path)
                
                # Remove from storage
                del files_storage[file_id]
                deleted_files.append(file_id)
                
            except Exception as e:
                errors.append(f"Error deleting file {file_id}: {str(e)}")
        
        return JSONResponse({
            "message": f"Deleted {len(deleted_files)} files",
            "deleted_files": deleted_files,
            "errors": errors
        })
    except Exception as e:
        logger.error(f"Error in bulk delete: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete files")

@router.get("/stats")
async def get_file_stats() -> Dict[str, Any]:
    """Get file statistics"""
    try:
        user_id = get_current_user_id()
        user_files = [f for f in files_storage.values() if f.get("user_id") == user_id]
        
        total_size = sum(f.get("size", 0) for f in user_files if isinstance(f.get("size"), int))
        status_counts: Dict[str, int] = {}
        
        for file_data in user_files:
            status = file_data.get("processing_status", "unknown")
            if isinstance(status, str):
                status_counts[status] = status_counts.get(status, 0) + 1
        
        return {
            "total_files": len(user_files),
            "total_size_bytes": total_size,
            "total_size_mb": round(total_size / (1024 * 1024), 2),
            "status_counts": status_counts,
            "allowed_extensions": list(ALLOWED_EXTENSIONS),
            "max_file_size_mb": MAX_FILE_SIZE / (1024 * 1024)
        }
    except Exception as e:
        logger.error(f"Error getting file stats: {e}")
        raise HTTPException(status_code=500, detail="Failed to get file statistics")
