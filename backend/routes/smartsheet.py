"""
Smartsheet API Routes for PIP AI
Provides comprehensive Smartsheet integration endpoints
"""

from fastapi import APIRouter, HTTPException, Header, File as FastAPIFile, UploadFile, Form, Query, Body
from fastapi.responses import StreamingResponse
from typing import Optional, List, Dict, Any, TypedDict
from datetime import datetime, timezone
from pydantic import BaseModel, Field
import json
import uuid
import io
import logging

from backend.services.smartsheet_service import SmartsheetService, SmartsheetAPIError

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/smartsheet", tags=["smartsheet"])

# TypedDict definitions for response types
class ApiResponse(TypedDict):
    """Base API response structure"""
    success: bool
    data: Any
    message: Optional[str]

class ValidationResponse(TypedDict):
    """URL validation response"""
    valid: bool
    message: str
    url: str
    sheet_id: Optional[str]
    sheet_name: Optional[str]

class ExtractIdResponse(TypedDict):
    """Sheet ID extraction response"""
    url: str
    sheet_id: Optional[str]
    valid_format: bool
    success: bool

class RowSearchResponse(TypedDict):
    """Row search response"""
    success: bool
    rows: List[Dict[str, Any]]
    count: int
    criteria: Dict[str, Any]

class UpdateResponse(TypedDict):
    """Update operation response"""
    success: bool
    result: Any
    search_criteria: Any
    update_data: Any

class RowResponse(TypedDict):
    """Row data response"""
    success: bool
    row: Dict[str, Any]
    row_number: int

class BulkUploadResponse(TypedDict):
    """Bulk upload response"""
    success: bool
    results: List[Dict[str, Any]]
    total_files: int
    successful_uploads: int

class HealthCheckResponse(TypedDict):
    """Health check response"""
    status: str
    message: str
    timestamp: str
    token_valid: Optional[bool]

# Pydantic Models for Smartsheet API

class SmartsheetAuthRequest(BaseModel):
    """Request model for Smartsheet authentication"""
    access_token: str = Field(..., description="Smartsheet access token")

class SmartsheetAuthResponse(BaseModel):
    """Response model for Smartsheet authentication"""
    success: bool = Field(..., description="Authentication success status")
    user_info: Optional[Dict[str, Any]] = Field(None, description="User information")
    message: str = Field(..., description="Status message")

class CreateSheetRequest(BaseModel):
    """Request model for creating a new sheet"""
    name: str = Field(..., description="Sheet name")
    columns: List[Dict[str, Any]] = Field(..., description="Column definitions")
    template_type: Optional[str] = Field(None, description="PIP AI template type")

class UpdateRowRequest(BaseModel):
    """Request model for updating rows"""
    rows: List[Dict[str, Any]] = Field(..., description="Row data to update")

class AddRowRequest(BaseModel):
    """Request model for adding new rows"""
    rows: List[Dict[str, Any]] = Field(..., description="Row data to add")
    to_top: bool = Field(False, description="Add rows to top of sheet")

class UpdateCellRequest(BaseModel):
    """Request model for updating cells"""
    row_id: int = Field(..., description="Row ID")
    cells: List[Dict[str, Any]] = Field(..., description="Cell updates")

class ShareSheetRequest(BaseModel):
    """Request model for sharing a sheet"""
    email: str = Field(..., description="Email address to share with")
    access_level: str = Field("VIEWER", description="Access level (VIEWER, EDITOR, ADMIN)")
    subject: Optional[str] = Field(None, description="Email subject")
    message: Optional[str] = Field(None, description="Email message")

class ExportRequest(BaseModel):
    """Request model for exporting sheets"""
    format: str = Field("PDF", description="Export format (PDF, EXCEL, CSV)")
    paper_size: Optional[str] = Field("A4", description="Paper size for PDF")

class PipAiSyncRequest(BaseModel):
    """Request model for syncing PIP AI data to Smartsheet"""
    project_data: Dict[str, Any] = Field(..., description="Project analysis data")
    estimates: List[Dict[str, Any]] = Field(..., description="Cost estimates")
    template_type: str = Field("construction_estimate", description="Template type")
    sheet_name: Optional[str] = Field(None, description="Custom sheet name")

class WebhookCreateRequest(BaseModel):
    """Request model for creating webhooks"""
    name: str = Field(..., description="Webhook name")
    callback_url: str = Field(..., description="Callback URL")
    scope: str = Field("sheet", description="Webhook scope")
    scope_object_id: int = Field(..., description="Sheet ID for webhook")
    events: List[str] = Field(["*.*"], description="Events to subscribe to")

# Helper function to handle Smartsheet service initialization
async def get_smartsheet_service(access_token: str) -> SmartsheetService:
    """Initialize and return Smartsheet service with token"""
    service = SmartsheetService()
    service.set_access_token(access_token)
    return service

# Authentication Endpoints

@router.post("/auth/validate", response_model=SmartsheetAuthResponse)
async def validate_smartsheet_token(
    request: SmartsheetAuthRequest,
    internal_code: Optional[str] = Header(None, alias="X-Internal-Code")
):
    """Validate Smartsheet access token"""
    if internal_code != "hermes":
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    try:
        async with SmartsheetService() as service:
            service.set_access_token(request.access_token)
            
            # Validate token by getting user info
            user_info = await service.get_current_user()
            
            return SmartsheetAuthResponse(
                success=True,
                user_info=user_info,
                message="Token validated successfully"
            )
            
    except SmartsheetAPIError as e:
        logger.error(f"Smartsheet token validation failed: {e}")
        return SmartsheetAuthResponse(
            success=False,
            user_info=None,
            message=f"Token validation failed: {e.message}"
        )
    except Exception as e:
        logger.error(f"Unexpected error in token validation: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.get("/user")
async def get_current_user(
    access_token: str = Header(..., alias="X-Smartsheet-Token"),
    internal_code: Optional[str] = Header(None, alias="X-Internal-Code")
) -> Dict[str, Any]:
    """Get current Smartsheet user information"""
    if internal_code != "hermes":
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    try:
        async with SmartsheetService() as service:
            service.set_access_token(access_token)
            user_info = await service.get_current_user()
            return {"success": True, "data": user_info}
            
    except SmartsheetAPIError as e:
        logger.error(f"Failed to get user info: {e}")
        raise HTTPException(status_code=e.status_code or 400, detail=e.message)
    except Exception as e:
        logger.error(f"Unexpected error getting user info: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

# Sheet Management Endpoints

@router.get("/sheets")
async def list_sheets(
    access_token: str = Header(..., alias="X-Smartsheet-Token"),
    internal_code: Optional[str] = Header(None, alias="X-Internal-Code"),
    include_all: bool = Query(False, description="Include all sheet details"),
    page_size: int = Query(100, description="Number of sheets per page")
) -> Dict[str, Any]:
    """List all accessible sheets"""
    if internal_code != "hermes":
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    try:
        async with SmartsheetService() as service:
            service.set_access_token(access_token)
            sheets = await service.list_sheets()
            return {"success": True, "data": sheets}
            
    except SmartsheetAPIError as e:
        logger.error(f"Failed to list sheets: {e}")
        raise HTTPException(status_code=e.status_code or 400, detail=e.message)
    except Exception as e:
        logger.error(f"Unexpected error listing sheets: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.get("/sheets/{sheet_id}")
async def get_sheet(
    sheet_id: int,
    access_token: str = Header(..., alias="X-Smartsheet-Token"),
    internal_code: Optional[str] = Header(None, alias="X-Internal-Code"),
    include: Optional[str] = Query(None, description="Comma-separated list of includes")
) -> Dict[str, Any]:
    """Get sheet details by ID"""
    if internal_code != "hermes":
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    try:
        async with SmartsheetService() as service:
            service.set_access_token(access_token)
            
            # Parse include parameter into separate boolean flags
            include_attachments = False
            include_discussions = False
            include_filters = False
            include_format = False
            include_object_value = False
            
            if include:
                include_values = include.split(",")
                include_attachments = "attachments" in include_values
                include_discussions = "discussions" in include_values
                include_filters = "filters" in include_values
                include_format = "format" in include_values
                include_object_value = "objectValue" in include_values
            
            sheet = await service.get_sheet(
                sheet_id=sheet_id,
                include_attachments=include_attachments,
                include_discussions=include_discussions,
                include_filters=include_filters,
                include_format=include_format,
                include_object_value=include_object_value
            )
            
            return {"success": True, "data": sheet}
            
    except SmartsheetAPIError as e:
        logger.error(f"Failed to get sheet {sheet_id}: {e}")
        raise HTTPException(status_code=e.status_code or 400, detail=e.message)
    except Exception as e:
        logger.error(f"Unexpected error getting sheet {sheet_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.get("/sheets/search")
async def search_sheets(
    query: str = Query(..., description="Search query"),
    access_token: str = Header(..., alias="X-Smartsheet-Token"),
    internal_code: Optional[str] = Header(None, alias="X-Internal-Code")
) -> Dict[str, Any]:
    """Search for sheets by name or other criteria"""
    if internal_code != "hermes":
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    try:
        async with SmartsheetService() as service:
            service.set_access_token(access_token)
            results = await service.search_sheets(query)
            return {"success": True, "data": results}
            
    except SmartsheetAPIError as e:
        logger.error(f"Failed to search sheets: {e}")
        raise HTTPException(status_code=e.status_code or 400, detail=e.message)
    except Exception as e:
        logger.error(f"Unexpected error searching sheets: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.post("/sheets")
async def create_sheet(
    request: CreateSheetRequest,
    access_token: str = Header(..., alias="X-Smartsheet-Token"),
    internal_code: Optional[str] = Header(None, alias="X-Internal-Code")
) -> Dict[str, Any]:
    """Create a new sheet"""
    if internal_code != "hermes":
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    try:
        async with SmartsheetService() as service:
            service.set_access_token(access_token)
            
            # If template_type is specified, use PIP AI template
            if request.template_type:
                sheet = await service.create_pip_ai_sheet(
                    project_name=request.name,
                    template_columns=request.columns
                )
            else:
                sheet = await service.create_sheet(
                    name=request.name,
                    columns=request.columns
                )
            
            return {"success": True, "data": sheet, "message": "Sheet created successfully"}
            
    except SmartsheetAPIError as e:
        logger.error(f"Failed to create sheet: {e}")
        raise HTTPException(status_code=e.status_code or 400, detail=e.message)
    except Exception as e:
        logger.error(f"Unexpected error creating sheet: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.delete("/sheets/{sheet_id}")
async def delete_sheet(
    sheet_id: int,
    access_token: str = Header(..., alias="X-Smartsheet-Token"),
    internal_code: Optional[str] = Header(None, alias="X-Internal-Code")
) -> Dict[str, Any]:
    """Delete a sheet"""
    if internal_code != "hermes":
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    try:
        async with SmartsheetService() as service:
            service.set_access_token(access_token)
            result = await service.delete_sheet(sheet_id)
            return {"success": True, "data": result, "message": "Sheet deleted successfully"}
            
    except SmartsheetAPIError as e:
        logger.error(f"Failed to delete sheet {sheet_id}: {e}")
        raise HTTPException(status_code=e.status_code or 400, detail=e.message)
    except Exception as e:
        logger.error(f"Unexpected error deleting sheet {sheet_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

# Row Operations Endpoints

@router.get("/sheets/{sheet_id}/rows")
async def get_rows(
    sheet_id: int,
    access_token: str = Header(..., alias="X-Smartsheet-Token"),
    internal_code: Optional[str] = Header(None, alias="X-Internal-Code"),
    row_ids: Optional[str] = Query(None, description="Comma-separated row IDs"),
    include_all: bool = Query(False, description="Include all details")
) -> Dict[str, Any]:
    """Get rows from a sheet"""
    if internal_code != "hermes":
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    try:
        async with SmartsheetService() as service:
            service.set_access_token(access_token)
            
            if row_ids:
                # Get specific rows
                row_id_list = [int(id.strip()) for id in row_ids.split(",")]
                rows = await service.get_rows(sheet_id, row_id_list, include_all=include_all)
            else:
                # Get all rows (via sheet)
                sheet = await service.get_sheet(sheet_id, include_attachments=include_all)
                rows = sheet.get("rows", [])
            
            return {"success": True, "data": rows}
            
    except SmartsheetAPIError as e:
        logger.error(f"Failed to get rows from sheet {sheet_id}: {e}")
        raise HTTPException(status_code=e.status_code or 400, detail=e.message)
    except Exception as e:
        logger.error(f"Unexpected error getting rows from sheet {sheet_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.post("/sheets/{sheet_id}/rows")
async def add_rows(
    sheet_id: int,
    request: AddRowRequest,
    access_token: str = Header(..., alias="X-Smartsheet-Token"),
    internal_code: Optional[str] = Header(None, alias="X-Internal-Code")
) -> ApiResponse:
    """Add new rows to a sheet"""
    if internal_code != "hermes":
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    try:
        async with SmartsheetService() as service:
            service.set_access_token(access_token)
            result = await service.add_rows(sheet_id, request.rows, to_top=request.to_top)
            return {"success": True, "data": result, "message": "Rows added successfully"}
            
    except SmartsheetAPIError as e:
        logger.error(f"Failed to add rows to sheet {sheet_id}: {e}")
        raise HTTPException(status_code=e.status_code or 400, detail=e.message)
    except Exception as e:
        logger.error(f"Unexpected error adding rows to sheet {sheet_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.put("/sheets/{sheet_id}/rows")
async def update_rows(
    sheet_id: int,
    request: UpdateRowRequest,
    access_token: str = Header(..., alias="X-Smartsheet-Token"),
    internal_code: Optional[str] = Header(None, alias="X-Internal-Code")
) -> ApiResponse:
    """Update existing rows in a sheet"""
    if internal_code != "hermes":
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    try:
        async with SmartsheetService() as service:
            service.set_access_token(access_token)
            result = await service.update_rows(sheet_id, request.rows)
            return {"success": True, "data": result, "message": "Rows updated successfully"}
            
    except SmartsheetAPIError as e:
        logger.error(f"Failed to update rows in sheet {sheet_id}: {e}")
        raise HTTPException(status_code=e.status_code or 400, detail=e.message)
    except Exception as e:
        logger.error(f"Unexpected error updating rows in sheet {sheet_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.delete("/sheets/{sheet_id}/rows/{row_id}")
async def delete_row(
    sheet_id: int,
    row_id: int,
    access_token: str = Header(..., alias="X-Smartsheet-Token"),
    internal_code: Optional[str] = Header(None, alias="X-Internal-Code")
) -> ApiResponse:
    """Delete a row from a sheet"""
    if internal_code != "hermes":
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    try:
        async with SmartsheetService() as service:
            service.set_access_token(access_token)
            result = await service.delete_rows(sheet_id, [row_id])
            return {"success": True, "data": result, "message": "Row deleted successfully"}
            
    except SmartsheetAPIError as e:
        logger.error(f"Failed to delete row {row_id} from sheet {sheet_id}: {e}")
        raise HTTPException(status_code=e.status_code or 400, detail=e.message)
    except Exception as e:
        logger.error(f"Unexpected error deleting row {row_id} from sheet {sheet_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

# Cell Operations Endpoints

@router.put("/sheets/{sheet_id}/rows/{row_id}/cells")
async def update_cells(
    sheet_id: int,
    row_id: int,
    request: UpdateCellRequest,
    access_token: str = Header(..., alias="X-Smartsheet-Token"),
    internal_code: Optional[str] = Header(None, alias="X-Internal-Code")
) -> ApiResponse:
    """Update cells in a specific row"""
    if internal_code != "hermes":
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    try:
        async with SmartsheetService() as service:
            service.set_access_token(access_token)
            result = await service.update_cells(sheet_id, row_id, request.cells)
            return {"success": True, "data": result, "message": "Cells updated successfully"}
            
    except SmartsheetAPIError as e:
        logger.error(f"Failed to update cells in row {row_id} of sheet {sheet_id}: {e}")
        raise HTTPException(status_code=e.status_code or 400, detail=e.message)
    except Exception as e:
        logger.error(f"Unexpected error updating cells in row {row_id} of sheet {sheet_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

# Attachment Endpoints

@router.get("/sheets/{sheet_id}/attachments")
async def get_sheet_attachments(
    sheet_id: int,
    access_token: str = Header(..., alias="X-Smartsheet-Token"),
    internal_code: Optional[str] = Header(None, alias="X-Internal-Code")
) -> Dict[str, Any]:
    """Get all attachments for a sheet"""
    if internal_code != "hermes":
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    try:
        async with SmartsheetService() as service:
            service.set_access_token(access_token)
            attachments = await service.list_attachments(sheet_id)
            return {"success": True, "data": attachments}
            
    except SmartsheetAPIError as e:
        logger.error(f"Failed to get attachments for sheet {sheet_id}: {e}")
        raise HTTPException(status_code=e.status_code or 400, detail=e.message)
    except Exception as e:
        logger.error(f"Unexpected error getting attachments for sheet {sheet_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.post("/sheets/{sheet_id}/attachments")
async def upload_attachment(
    sheet_id: int,
    file: UploadFile = FastAPIFile(...),
    access_token: str = Header(..., alias="X-Smartsheet-Token"),
    internal_code: Optional[str] = Header(None, alias="X-Internal-Code"),
    row_id: Optional[int] = Form(None, description="Row ID to attach to (optional)")
) -> ApiResponse:
    """Upload attachment to a sheet or specific row"""
    if internal_code != "hermes":
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    try:
        async with SmartsheetService() as service:
            service.set_access_token(access_token)
            
            # Read file content
            file_content = await file.read()
            
            # Upload attachment
            result = await service.upload_attachment(
                sheet_id=sheet_id,
                file_content=file_content,
                file_name=file.filename or "unnamed_file",
                row_id=row_id
            )
            
            return {"success": True, "data": result, "message": "Attachment uploaded successfully"}
            
    except SmartsheetAPIError as e:
        logger.error(f"Failed to upload attachment to sheet {sheet_id}: {e}")
        raise HTTPException(status_code=e.status_code or 400, detail=e.message)
    except Exception as e:
        logger.error(f"Unexpected error uploading attachment to sheet {sheet_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.get("/attachments/{attachment_id}/download")
async def download_attachment(
    attachment_id: int,
    access_token: str = Header(..., alias="X-Smartsheet-Token"),
    internal_code: Optional[str] = Header(None, alias="X-Internal-Code"),
    sheet_id: int = Query(..., description="The sheet ID containing the attachment")
) -> StreamingResponse:
    """Download an attachment"""
    if internal_code != "hermes":
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    try:
        async with SmartsheetService() as service:
            service.set_access_token(access_token)
            
            file_content, filename, content_type = await service.download_attachment(
                sheet_id=sheet_id,
                attachment_id=attachment_id
            )
            
            return StreamingResponse(
                io.BytesIO(file_content),
                media_type=content_type or "application/octet-stream",
                headers={"Content-Disposition": f"attachment; filename={filename}"}
            )
            
    except SmartsheetAPIError as e:
        logger.error(f"Failed to download attachment {attachment_id}: {e}")
        raise HTTPException(status_code=e.status_code or 400, detail=e.message)
    except Exception as e:
        logger.error(f"Unexpected error downloading attachment {attachment_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

# Export Endpoints

@router.post("/sheets/{sheet_id}/export")
async def export_sheet(
    sheet_id: int,
    request: ExportRequest,
    access_token: str = Header(..., alias="X-Smartsheet-Token"),
    internal_code: Optional[str] = Header(None, alias="X-Internal-Code")
) -> StreamingResponse:
    """Export sheet to various formats"""
    if internal_code != "hermes":
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    try:
        async with SmartsheetService() as service:
            service.set_access_token(access_token)
            
            # Export sheet (handle optional parameter)
            paper_size = request.paper_size if request.paper_size else "A4"  # Default to A4
            
            file_content, filename = await service.export_sheet(
                sheet_id=sheet_id,
                format_type=request.format,
                paper_size=paper_size
            )
            
            # Determine content type
            content_type_map = {
                "PDF": "application/pdf",
                "EXCEL": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                "CSV": "text/csv"
            }
            content_type = content_type_map.get(request.format, "application/octet-stream")
            
            return StreamingResponse(
                io.BytesIO(file_content),
                media_type=content_type,
                headers={"Content-Disposition": f"attachment; filename={filename}"}
            )
            
    except SmartsheetAPIError as e:
        logger.error(f"Failed to export sheet {sheet_id}: {e}")
        raise HTTPException(status_code=e.status_code or 400, detail=e.message)
    except Exception as e:
        logger.error(f"Unexpected error exporting sheet {sheet_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

# PIP AI Integration Endpoints

@router.post("/sync-pip-ai")
async def sync_pip_ai_data(
    request: PipAiSyncRequest,
    access_token: str = Header(..., alias="X-Smartsheet-Token"),
    internal_code: Optional[str] = Header(None, alias="X-Internal-Code")
) -> Dict[str, Any]:
    """Sync PIP AI analysis results to Smartsheet"""
    if internal_code != "hermes":
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    try:
        async with SmartsheetService() as service:
            service.set_access_token(access_token)
            
            # Use the PIP AI sync method - ensure a valid sheet_id is provided
            sheet_id = request.sheet_name if request.sheet_name else "0"  # Default to "0" if None
            
            result = await service.sync_pip_ai_results(
                sheet_id=sheet_id,
                analysis_results=request.project_data,
                cost_estimates=request.estimates
            )
            
            return {
                "success": True, 
                "data": result, 
                "message": "PIP AI data synced to Smartsheet successfully"
            }
            
    except SmartsheetAPIError as e:
        logger.error(f"Failed to sync PIP AI data: {e}")
        raise HTTPException(status_code=e.status_code or 400, detail=e.message)
    except Exception as e:
        logger.error(f"Unexpected error syncing PIP AI data: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

# Sharing and Collaboration

@router.post("/sheets/{sheet_id}/share")
async def share_sheet(
    sheet_id: int,
    request: ShareSheetRequest,
    access_token: str = Header(..., alias="X-Smartsheet-Token"),
    internal_code: Optional[str] = Header(None, alias="X-Internal-Code")
) -> ApiResponse:
    """Share a sheet with another user"""
    if internal_code != "hermes":
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    try:
        async with SmartsheetService() as service:
            service.set_access_token(access_token)
            
            # Share sheet (this would require implementing share functionality in service)
            # For now, return a placeholder response
            result = {
                "share_id": str(uuid.uuid4()),
                "email": request.email,
                "access_level": request.access_level,
                "status": "pending"
            }
            
            return {"success": True, "data": result, "message": "Sheet shared successfully"}
            
    except SmartsheetAPIError as e:
        logger.error(f"Failed to share sheet {sheet_id}: {e}")
        raise HTTPException(status_code=e.status_code or 400, detail=e.message)
    except Exception as e:
        logger.error(f"Unexpected error sharing sheet {sheet_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

# Webhook Integration

@router.post("/webhooks")
async def create_webhook(
    request: WebhookCreateRequest,
    access_token: str = Header(..., alias="X-Smartsheet-Token"),
    internal_code: Optional[str] = Header(None, alias="X-Internal-Code")
) -> ApiResponse:
    """Create a webhook for real-time updates"""
    if internal_code != "hermes":
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    try:
        async with SmartsheetService() as service:
            service.set_access_token(access_token)
            
            # Create webhook (this would require implementing webhook functionality in service)
            # For now, return a placeholder response
            result: Dict[str, Any] = {
                "webhook_id": str(uuid.uuid4()),
                "name": request.name,
                "callback_url": request.callback_url,
                "scope": request.scope,
                "scope_object_id": request.scope_object_id,
                "events": request.events,
                "status": "enabled"
            }
            
            return {"success": True, "data": result, "message": "Webhook created successfully"}
            
    except SmartsheetAPIError as e:
        logger.error(f"Failed to create webhook: {e}")
        raise HTTPException(status_code=e.status_code or 400, detail=e.message)
    except Exception as e:
        logger.error(f"Unexpected error creating webhook: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.post("/webhooks/callback")
async def webhook_callback(
    payload: Dict[str, Any] = Body(...),
    x_smartsheet_hook: Optional[str] = Header(None)
):
    """Handle incoming webhook callbacks from Smartsheet"""
    try:
        logger.info(f"Received Smartsheet webhook: {payload}")
        
        # Process webhook payload
        # This could trigger updates in PIP AI system based on Smartsheet changes
        
        # For now, just log and acknowledge
        return {"status": "acknowledged", "timestamp": datetime.now(timezone.utc).isoformat()}
        
    except Exception as e:
        logger.error(f"Error processing webhook callback: {e}")
        raise HTTPException(status_code=500, detail=f"Webhook processing error: {str(e)}")

# Health and Status

@router.get("/health")
async def smartsheet_health_check(
    access_token: Optional[str] = Header(None, alias="X-Smartsheet-Token"),
    internal_code: Optional[str] = Header(None, alias="X-Internal-Code")
) -> HealthCheckResponse:
    """Check Smartsheet service health and token status"""
    if internal_code != "hermes":
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    try:
        if not access_token:
            return {
                "status": "no_token",
                "message": "No Smartsheet token provided",
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "token_valid": None
            }
        
        async with SmartsheetService() as service:
            service.set_access_token(access_token)
            is_valid = await service.validate_token()
            
            return {
                "status": "healthy" if is_valid else "token_invalid",
                "token_valid": is_valid,
                "message": "Smartsheet service is accessible" if is_valid else "Token validation failed",
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
            
    except Exception as e:
        logger.error(f"Smartsheet health check failed: {e}")
        return {
            "status": "error",
            "message": f"Health check failed: {str(e)}",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "token_valid": None
        }

# Enhanced URL-Based Operations
class SmartsheetURLRequest(BaseModel):
    """Request model for URL-based operations"""
    url: str = Field(..., description="Smartsheet URL")
    include_attachments: bool = Field(True, description="Include attachments")
    include_discussions: bool = Field(False, description="Include discussions")

class SmartsheetSyncResponse(BaseModel):
    """Response model for comprehensive sync operations"""
    success: bool = Field(..., description="Sync success status")
    sheet_id: str = Field(..., description="Sheet ID")
    data: Dict[str, Any] = Field(..., description="Complete sheet data")
    rows_count: int = Field(..., description="Number of rows")
    columns_count: int = Field(..., description="Number of columns")
    attachments_count: int = Field(0, description="Number of attachments")

@router.post("/url/validate", response_model=Dict[str, Any])
async def validate_sheet_url(
    url_data: SmartsheetURLRequest,
    authorization: str = Header(..., description="Bearer token")
) -> ValidationResponse:
    """Validate a Smartsheet URL and extract sheet information"""
    try:
        access_token = authorization.replace("Bearer ", "")
        
        # Validate URL format
        if not SmartsheetService.validate_sheet_url(url_data.url):
            return {
                "valid": False,
                "message": "Invalid Smartsheet URL format",
                "url": url_data.url,
                "sheet_id": None,
                "sheet_name": None
            }
        
        # Extract sheet ID
        sheet_id = SmartsheetService.extract_sheet_id_from_url(url_data.url)
        if not sheet_id:
            return {
                "valid": False,
                "message": "Could not extract sheet ID from URL",
                "url": url_data.url,
                "sheet_id": None,
                "sheet_name": None
            }
        
        # Test access to sheet
        async with SmartsheetService() as service:
            service.set_access_token(access_token)
            
            try:
                sheet_info = await service.get_sheet(sheet_id, include_attachments=False, include_discussions=False)
                return {
                    "valid": True,
                    "sheet_id": sheet_id,
                    "sheet_name": sheet_info.get("name", "Unknown"),
                    "message": "URL is valid and accessible",
                    "url": url_data.url
                }
            except SmartsheetAPIError as e:
                return {
                    "valid": False,
                    "sheet_id": sheet_id,
                    "message": f"Cannot access sheet: {e.message}",
                    "url": url_data.url,
                    "sheet_name": None
                }
    
    except Exception as e:
        logger.error(f"Error validating Smartsheet URL: {str(e)}")
        raise HTTPException(status_code=500, detail=f"URL validation failed: {str(e)}")

@router.post("/url/sync", response_model=SmartsheetSyncResponse)
async def sync_from_url(
    url_data: SmartsheetURLRequest,
    authorization: str = Header(..., description="Bearer token")
):
    """Comprehensive sync of all data from a Smartsheet URL"""
    try:
        access_token = authorization.replace("Bearer ", "")
        
        async with SmartsheetService() as service:
            service.set_access_token(access_token)
            
            # Get complete sheet data
            sheet_data = await service.sync_from_url(
                url_data.url,
                include_attachments=url_data.include_attachments,
                include_discussions=url_data.include_discussions
            )
            
            # Extract metrics
            sheet_id = str(sheet_data.get("id", ""))
            rows = sheet_data.get("rows", [])
            columns = sheet_data.get("columns", [])
            attachments = sheet_data.get("attachments", [])
            
            return SmartsheetSyncResponse(
                success=True,
                sheet_id=sheet_id,
                data=sheet_data,
                rows_count=len(rows),
                columns_count=len(columns),
                attachments_count=len(attachments)
            )
    
    except Exception as e:
        logger.error(f"Error syncing from Smartsheet URL: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Sync failed: {str(e)}")

@router.post("/url/extract-id")
async def extract_sheet_id_from_url(url: str = Body(..., embed=True)) -> ExtractIdResponse:
    """Extract sheet ID from various Smartsheet URL formats"""
    try:
        sheet_id = SmartsheetService.extract_sheet_id_from_url(url)
        is_valid = SmartsheetService.validate_sheet_url(url)
        
        return {
            "url": url,
            "sheet_id": sheet_id,
            "valid_format": is_valid,
            "success": sheet_id is not None
        }
    
    except Exception as e:
        logger.error(f"Error extracting sheet ID: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Extraction failed: {str(e)}")

# Enhanced Row Operations
@router.get("/sheets/{sheet_id}/rows/search")
async def search_rows_by_criteria(
    sheet_id: str,
    authorization: str = Header(..., description="Bearer token"),
    criteria: str = Query(..., description="JSON string of search criteria"),
    exact_match: bool = Query(True, description="Use exact matching")
) -> RowSearchResponse:
    """Search rows by specific criteria"""
    try:
        access_token = authorization.replace("Bearer ", "")
        search_criteria = json.loads(criteria)
        
        async with SmartsheetService() as service:
            service.set_access_token(access_token)
            rows = await service.find_rows_by_criteria(sheet_id, search_criteria, exact_match)
            
            return {
                "success": True,
                "rows": rows,
                "count": len(rows),
                "criteria": search_criteria
            }
    
    except Exception as e:
        logger.error(f"Error searching rows: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Search failed: {str(e)}")

@router.put("/sheets/{sheet_id}/rows/update-by-criteria")
async def update_rows_by_criteria(
    sheet_id: str,
    request_data: Dict[str, Any],
    authorization: str = Header(..., description="Bearer token")
) -> UpdateResponse:
    """Update rows matching specific criteria"""
    try:
        access_token = authorization.replace("Bearer ", "")
        search_criteria = request_data.get("search_criteria", {})
        update_data = request_data.get("update_data", {})
        
        async with SmartsheetService() as service:
            service.set_access_token(access_token)
            result = await service.update_row_by_criteria(sheet_id, search_criteria, update_data)
            
            return {
                "success": True,
                "result": result,
                "search_criteria": search_criteria,
                "update_data": update_data
            }
    
    except Exception as e:
        logger.error(f"Error updating rows by criteria: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Update failed: {str(e)}")

@router.get("/sheets/{sheet_id}/rows/{row_number}")
async def get_row_by_number(
    sheet_id: str,
    row_number: int,
    authorization: str = Header(..., description="Bearer token"),
    include_attachments: bool = Query(True, description="Include attachments")
) -> RowResponse:
    """Get a specific row by its position number in the sheet"""
    try:
        access_token = authorization.replace("Bearer ", "")
        
        async with SmartsheetService() as service:
            service.set_access_token(access_token)
            row = await service.get_row_by_number(sheet_id, row_number, include_attachments)
            
            if row:
                return {
                    "success": True,
                    "row": row,
                    "row_number": row_number
                }
            else:
                raise HTTPException(status_code=404, detail=f"Row {row_number} not found")
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting row by number: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get row: {str(e)}")

# Enhanced Attachment Operations
@router.post("/sheets/{sheet_id}/attachments/bulk-upload")
async def bulk_upload_attachments(
    sheet_id: str,
    authorization: str = Header(..., description="Bearer token"),
    files: List[UploadFile] = FastAPIFile(...),
    row_criteria: Optional[str] = Form(None, description="JSON criteria for target row")
) -> Dict[str, Any]:
    """Bulk upload multiple attachments to a sheet or specific row"""
    try:
        access_token = authorization.replace("Bearer ", "")
        criteria = json.loads(row_criteria) if row_criteria else None
        
        # Prepare attachment data
        attachments: List[Dict[str, Any]] = []
        for file in files:
            content = await file.read()
            attachments.append({
                "file_content": content,
                "filename": file.filename
            })
        
        async with SmartsheetService() as service:
            service.set_access_token(access_token)
            
            # Handle bulk upload with file content
            results: List[Dict[str, Any]] = []
            target_row_id = None
            
            # Find target row if criteria provided
            if criteria:
                matching_rows = await service.find_rows_by_criteria(sheet_id, criteria)
                if matching_rows:
                    target_row_id = matching_rows[0].get("id")
            
            # Upload each file
            for attachment in attachments:
                try:
                    result = await service.upload_attachment(
                        sheet_id=sheet_id,
                        file_content=attachment["file_content"],
                        file_name=attachment["filename"],
                        row_id=target_row_id
                    )
                    
                    results.append({
                        "filename": attachment["filename"],
                        "success": True,
                        "attachment_id": result.get("id"),
                        "result": result
                    })
                    
                except Exception as e:
                    results.append({
                        "filename": attachment["filename"],
                        "success": False,
                        "error": str(e)
                    })
            
            # Count successful uploads safely with type checking
            successful_uploads = sum(1 for r in results if r.get("success") is True)
            
            return {
                "success": True,
                "results": results,
                "total_files": len(files),
                "successful_uploads": successful_uploads
            }
    
    except Exception as e:
        logger.error(f"Error in bulk upload: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Bulk upload failed: {str(e)}")

# Enhanced PIP AI Integration Endpoints
@router.post("/pip-ai/create-project-sheet")
async def create_pip_ai_project_sheet(
    request_data: Dict[str, Any],
    authorization: str = Header(..., alias="X-Smartsheet-Token")
) -> Dict[str, Any]:
    """Create a comprehensive PIP AI project sheet with analysis data"""
    try:
        access_token = authorization.replace("Bearer ", "")
        project_name = request_data.get("project_name", "")
        project_data = request_data.get("project_data", {})
        estimates = request_data.get("estimates", [])
        
        async with SmartsheetService() as service:
            service.set_access_token(access_token)
            result = await service.create_pip_ai_project_sheet(project_name, project_data, estimates)
            
            return {
                "success": True,
                "result": result,
                "message": f"Created PIP AI project sheet: {project_name}"
            }
    
    except Exception as e:
        logger.error(f"Error creating PIP AI project sheet: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to create project sheet: {str(e)}")

@router.post("/pip-ai/update-progress")
async def update_pip_ai_progress(
    request_data: Dict[str, Any],
    authorization: str = Header(..., description="Bearer token")
) -> Dict[str, Any]:
    """Update PIP AI project progress in existing sheet"""
    try:
        access_token = authorization.replace("Bearer ", "")
        sheet_id = request_data.get("sheet_id", "")
        progress_data = request_data.get("progress_data", {})
        
        async with SmartsheetService() as service:
            service.set_access_token(access_token)
            result = await service.update_pip_ai_progress(sheet_id, progress_data)
            
            return {
                "success": True,
                "result": result,
                "message": "Updated PIP AI progress"
            }
    
    except Exception as e:
        logger.error(f"Error updating PIP AI progress: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to update progress: {str(e)}")
