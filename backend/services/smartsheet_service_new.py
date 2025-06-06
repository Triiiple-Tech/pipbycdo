"""
Smartsheet Integration Service for PIP AI
Provides comprehensive Smartsheet API integration capabilities with proper type safety
"""

from typing import Optional, List, Dict, Any, Union, Type, Tuple
from datetime import datetime, timezone
import aiohttp
from pathlib import Path
import mimetypes
import re
from urllib.parse import urlparse, parse_qs
import logging

logger = logging.getLogger(__name__)

class SmartsheetAPIError(Exception):
    """Custom exception for Smartsheet API errors"""
    
    def __init__(self, message: str, status_code: int, response_data: Dict[str, Any]):
        super().__init__(message)
        self.status_code = status_code
        self.response_data = response_data
        self.message = message
    
    def __str__(self):
        return f"SmartsheetAPIError({self.status_code}): {self.message}"

class SmartsheetService:
    """
    Comprehensive Smartsheet API integration service
    Handles authentication, sheet operations, and data synchronization
    """
    
    def __init__(self):
        self.base_url = "https://api.smartsheet.com/2.0"
        self.access_token: Optional[str] = None
        self.session: Optional[aiohttp.ClientSession] = None
        
    async def __aenter__(self):
        """Async context manager entry"""
        self.session = aiohttp.ClientSession()
        return self
    
    async def __aexit__(self, exc_type: Optional[Type[BaseException]], exc_val: Optional[BaseException], exc_tb: Optional[Any]):
        """Async context manager exit"""
        if self.session:
            await self.session.close()
    
    def set_access_token(self, token: str):
        """Set the Smartsheet access token"""
        self.access_token = token
    
    def _get_headers(self) -> Dict[str, str]:
        """Get default headers for Smartsheet API requests"""
        if not self.access_token:
            raise ValueError("Access token not set. Call set_access_token() first.")
        
        return {
            "Authorization": f"Bearer {self.access_token}",
            "Content-Type": "application/json",
            "User-Agent": "PIP-AI/1.0"
        }
    
    async def _make_request(
        self, 
        method: str, 
        endpoint: str, 
        data: Optional[Dict[str, Any]] = None,
        params: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Make authenticated request to Smartsheet API"""
        if not self.session:
            raise RuntimeError("Service not initialized. Use async with statement.")
        
        url = f"{self.base_url}/{endpoint.lstrip('/')}"
        headers = self._get_headers()
        
        try:
            async with self.session.request(
                method=method,
                url=url,
                headers=headers,
                json=data,
                params=params
            ) as response:
                response_data = await response.json()
                
                if response.status >= 400:
                    raise SmartsheetAPIError(
                        f"Smartsheet API error: {response.status}",
                        response.status,
                        response_data
                    )
                
                return response_data
                
        except aiohttp.ClientError as e:
            raise SmartsheetAPIError(f"Network error: {str(e)}", 0, {})
    
    # Authentication & User Info
    async def get_current_user(self) -> Dict[str, Any]:
        """Get current user information"""
        return await self._make_request("GET", "/users/me")
    
    async def validate_token(self) -> bool:
        """Validate the current access token"""
        try:
            await self.get_current_user()
            return True
        except SmartsheetAPIError:
            return False
    
    # Sheet Management
    async def list_sheets(
        self, 
        include_owner_info: bool = True,
        modified_since: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """List all accessible sheets"""
        params: Dict[str, str] = {}
        if include_owner_info:
            params["includeOwnerInfo"] = "true"
        if modified_since:
            params["modifiedSince"] = modified_since
            
        response = await self._make_request("GET", "/sheets", params=params)
        return response.get("data", [])
    
    async def get_sheet(
        self, 
        sheet_id: Union[str, int],
        include_attachments: bool = True,
        include_discussions: bool = True,
        include_filters: bool = False,
        include_format: bool = False,
        include_object_value: bool = False
    ) -> Dict[str, Any]:
        """Get detailed sheet information"""
        include_params: List[str] = []
        
        if include_attachments:
            include_params.append("attachments")
        if include_discussions:
            include_params.append("discussions")
        if include_filters:
            include_params.append("filters")
        if include_format:
            include_params.append("format")
        if include_object_value:
            include_params.append("objectValue")
            
        params: Dict[str, str] = {}
        if include_params:
            params["include"] = ",".join(include_params)
        
        return await self._make_request("GET", f"/sheets/{sheet_id}", params=params)
    
    async def search_sheets(self, query: str) -> List[Dict[str, Any]]:
        """Search sheets by name or content"""
        params = {"query": query}
        response = await self._make_request("GET", "/search", params=params)
        return response.get("results", [])
    
    # Row Operations
    async def get_rows(
        self, 
        sheet_id: Union[str, int],
        row_ids: Optional[List[int]] = None,
        include_attachments: bool = True
    ) -> List[Dict[str, Any]]:
        """Get rows from a sheet"""
        params: Dict[str, str] = {}
        
        if row_ids:
            # Get specific rows
            row_ids_str = ",".join(map(str, row_ids))
            endpoint = f"/sheets/{sheet_id}/rows"
            params["ids"] = row_ids_str
        else:
            # Get all rows
            endpoint = f"/sheets/{sheet_id}/rows"
        
        if include_attachments:
            params["include"] = "attachments"
        
        response = await self._make_request("GET", endpoint, params=params)
        return response.get("data", [])
    
    async def add_rows(
        self, 
        sheet_id: Union[str, int],
        rows: List[Dict[str, Any]],
        to_top: bool = False
    ) -> Dict[str, Any]:
        """Add new rows to a sheet"""
        data: Dict[str, Any] = {
            "toTop": to_top,
            "rows": rows
        }
        return await self._make_request("POST", f"/sheets/{sheet_id}/rows", data=data)
    
    async def update_rows(
        self, 
        sheet_id: Union[str, int],
        rows: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Update existing rows in a sheet"""
        data: Dict[str, Any] = {"rows": rows}
        return await self._make_request("PUT", f"/sheets/{sheet_id}/rows", data=data)
    
    async def delete_rows(
        self, 
        sheet_id: Union[str, int],
        row_ids: List[int]
    ) -> Dict[str, Any]:
        """Delete rows from a sheet"""
        row_ids_str = ",".join(map(str, row_ids))
        params = {"ids": row_ids_str}
        return await self._make_request("DELETE", f"/sheets/{sheet_id}/rows", params=params)
    
    # Cell Operations
    async def update_cells(
        self, 
        sheet_id: Union[str, int],
        row_id: int,
        cells: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Update specific cells in a row"""
        rows: List[Dict[str, Any]] = [{
            "id": row_id,
            "cells": cells
        }]
        return await self.update_rows(sheet_id, rows)
    
    async def add_cell_comment(
        self,
        sheet_id: Union[str, int],
        row_id: int,
        column_id: int,
        comment_text: str
    ) -> Dict[str, Any]:
        """Add a comment to a specific cell"""
        data = {
            "text": comment_text
        }
        endpoint = f"/sheets/{sheet_id}/rows/{row_id}/columns/{column_id}/comments"
        return await self._make_request("POST", endpoint, data=data)
    
    # Attachment Operations
    async def list_attachments(
        self, 
        sheet_id: Union[str, int],
        row_id: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        """List attachments for a sheet or specific row"""
        if row_id:
            endpoint = f"/sheets/{sheet_id}/rows/{row_id}/attachments"
        else:
            endpoint = f"/sheets/{sheet_id}/attachments"
        
        response = await self._make_request("GET", endpoint)
        return response.get("data", [])

    async def get_attachments(
        self, 
        sheet_id: Union[str, int],
        row_id: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        """Get attachments from sheet or specific row (alias for list_attachments)"""
        return await self.list_attachments(sheet_id, row_id)
    
    async def download_attachment(
        self,
        sheet_id: Union[str, int],
        attachment_id: int
    ) -> Tuple[bytes, str, str]:
        """Download attachment content and return content, filename, and content type"""
        if not self.session:
            raise RuntimeError("Service not initialized.")
        
        url = f"{self.base_url}/sheets/{sheet_id}/attachments/{attachment_id}"
        headers = {
            "Authorization": f"Bearer {self.access_token}",
            "User-Agent": "PIP-AI/1.0"
        }
        
        async with self.session.get(url, headers=headers) as response:
            if response.status >= 400:
                raise SmartsheetAPIError(
                    f"Failed to download attachment: {response.status}",
                    response.status,
                    {}
                )
            content = await response.read()
            filename = response.headers.get("Content-Disposition", "attachment.bin")
            content_type = response.headers.get("Content-Type", "application/octet-stream")
            
            return content, filename, content_type
    
    async def upload_attachment(
        self,
        sheet_id: Union[str, int],
        file_path: Optional[str] = None,
        file_name: Optional[str] = None,
        row_id: Optional[int] = None,
        file_content: Optional[bytes] = None
    ) -> Dict[str, Any]:
        """Upload a file as attachment to sheet or row"""
        if not self.session:
            raise RuntimeError("Service not initialized.")
        
        # Handle file content from either path or direct content
        if file_content and file_name:
            content = file_content
            filename = file_name
        elif file_path:
            path_obj = Path(file_path)
            if not path_obj.exists():
                raise FileNotFoundError(f"File not found: {file_path}")
            
            filename = file_name or path_obj.name
            with open(file_path, 'rb') as f:
                content = f.read()
        else:
            raise ValueError("Either file_path or (file_content and file_name) must be provided")
        
        # Determine endpoint
        if row_id:
            url = f"{self.base_url}/sheets/{sheet_id}/rows/{row_id}/attachments"
        else:
            url = f"{self.base_url}/sheets/{sheet_id}/attachments"
        
        # Prepare headers (no Content-Type for multipart)
        headers = {
            "Authorization": f"Bearer {self.access_token}",
            "User-Agent": "PIP-AI/1.0"
        }
        
        # Prepare multipart form data
        mime_type = mimetypes.guess_type(filename)[0] or "application/octet-stream"
        form_data = aiohttp.FormData()
        form_data.add_field(
            'file',
            content,
            filename=filename,
            content_type=mime_type
        )
        
        async with self.session.post(url, headers=headers, data=form_data) as response:
            response_data = await response.json()
            
            if response.status >= 400:
                raise SmartsheetAPIError(
                    f"Failed to upload attachment: {response.status}",
                    response.status,
                    response_data
                )
            
            return response_data
    
    # Export Operations
    async def export_sheet(
        self,
        sheet_id: Union[str, int],
        format_type: str = "excel",
        paper_size: str = "A4"
    ) -> Tuple[bytes, str]:
        """Export sheet in specified format and return content and filename"""
        if not self.session:
            raise RuntimeError("Service not initialized.")
        
        valid_formats = ["excel", "pdf", "csv"]
        if format_type not in valid_formats:
            raise ValueError(f"Invalid format. Must be one of: {valid_formats}")
        
        params: Dict[str, str] = {}
        if format_type == "pdf":
            params["paperSize"] = paper_size
        
        url = f"{self.base_url}/sheets/{sheet_id}"
        headers = self._get_headers()
        headers["Accept"] = f"application/{format_type}"
        
        async with self.session.get(url, headers=headers, params=params) as response:
            if response.status >= 400:
                error_text = await response.text()
                raise SmartsheetAPIError(
                    f"Export failed: {response.status}",
                    response.status,
                    {"error": error_text}
                )
            
            content = await response.read()
            filename = f"sheet_{sheet_id}.{format_type}"
            
            return content, filename
    
    # URL Parsing and Sheet ID Extraction
    @staticmethod
    def extract_sheet_id_from_url(url: str) -> Optional[str]:
        """
        Extract Smartsheet sheet ID from various URL formats
        
        Supports URLs like:
        - https://app.smartsheet.com/sheets/[sheet_id]
        - https://app.smartsheet.com/b/home?lx=[sheet_id]
        - https://app.smartsheet.com/sheets/[sheet_id]/grid/view/[view_id]
        """
        if not url:
            return None
            
        # Parse the URL
        parsed = urlparse(url)
        
        # Method 1: Direct sheet URL pattern
        # https://app.smartsheet.com/sheets/[sheet_id]
        sheet_match = re.search(r'/sheets/(\d+)', parsed.path)
        if sheet_match:
            return sheet_match.group(1)
        
        # Method 2: Home URL with lx parameter
        # https://app.smartsheet.com/b/home?lx=[sheet_id]
        query_params = parse_qs(parsed.query)
        if 'lx' in query_params:
            lx_value = query_params['lx'][0]
            return lx_value
        
        # Method 3: Look for any numeric ID in the path
        numeric_match = re.search(r'/(\d{10,})', parsed.path)
        if numeric_match:
            return numeric_match.group(1)
        
        return None
    
    @staticmethod
    def validate_sheet_url(url: str) -> bool:
        """Validate if URL is a valid Smartsheet URL"""
        if not url:
            return False
            
        parsed = urlparse(url)
        return (
            parsed.netloc in ['app.smartsheet.com', 'smartsheet.com'] and
            ('sheets' in parsed.path or 'lx=' in parsed.query)
        )
    
    async def get_sheet_from_url(
        self, 
        url: str, 
        include_attachments: bool = True,
        include_discussions: bool = True
    ) -> Dict[str, Any]:
        """Get sheet data directly from a Smartsheet URL"""
        sheet_id = self.extract_sheet_id_from_url(url)
        if not sheet_id:
            raise ValueError(f"Could not extract sheet ID from URL: {url}")
        
        return await self.get_sheet(
            sheet_id, 
            include_attachments=include_attachments,
            include_discussions=include_discussions
        )
    
    async def sync_from_url(
        self, 
        url: str, 
        include_attachments: bool = True,
        include_discussions: bool = False
    ) -> Dict[str, Any]:
        """
        Comprehensive sync of sheet data from URL
        Returns all sheet data including rows, columns, and optionally attachments
        """
        return await self.get_sheet_from_url(
            url, 
            include_attachments=include_attachments,
            include_discussions=include_discussions
        )
    
    # Enhanced Row and Column Operations
    async def get_row_by_number(
        self, 
        sheet_id: Union[str, int], 
        row_number: int,
        include_attachments: bool = True
    ) -> Optional[Dict[str, Any]]:
        """Get a specific row by its row number (position in sheet)"""
        sheet_data = await self.get_sheet(sheet_id, include_attachments=False, include_discussions=False)
        rows = sheet_data.get("rows", [])
        
        if 0 <= row_number - 1 < len(rows):  # Convert to 0-indexed
            row = rows[row_number - 1]
            if include_attachments and row.get("id"):
                # Get attachments for this specific row
                attachments = await self.get_attachments(sheet_id, row_id=row["id"])
                row["attachments"] = attachments
            return row
        return None
    
    async def find_rows_by_criteria(
        self, 
        sheet_id: Union[str, int],
        search_criteria: Dict[str, Any],
        exact_match: bool = True
    ) -> List[Dict[str, Any]]:
        """
        Find rows that match specific criteria
        search_criteria: {"column_name": "value_to_match"}
        """
        sheet_data = await self.get_sheet(sheet_id, include_attachments=False, include_discussions=False)
        columns = {col["title"]: col["id"] for col in sheet_data.get("columns", [])}
        rows = sheet_data.get("rows", [])
        
        matching_rows: List[Dict[str, Any]] = []
        
        for row in rows:
            cells = {cell.get("columnId"): cell.get("value", "") for cell in row.get("cells", [])}
            
            matches = True
            for column_name, expected_value in search_criteria.items():
                column_id = columns.get(column_name)
                if not column_id:
                    matches = False
                    break
                
                cell_value = str(cells.get(column_id, "")).strip()
                expected_str = str(expected_value).strip()
                
                if exact_match:
                    if cell_value != expected_str:
                        matches = False
                        break
                else:
                    if expected_str.lower() not in cell_value.lower():
                        matches = False
                        break
            
            if matches:
                matching_rows.append(row)
        
        return matching_rows
    
    async def update_row_by_criteria(
        self,
        sheet_id: Union[str, int],
        search_criteria: Dict[str, Any],
        update_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Update rows that match specific criteria
        search_criteria: {"column_name": "value_to_match"}
        update_data: {"column_name": "new_value"}
        """
        # Find matching rows
        matching_rows = await self.find_rows_by_criteria(sheet_id, search_criteria)
        if not matching_rows:
            raise ValueError("No rows found matching the specified criteria")
        
        # Get column mapping
        sheet_data = await self.get_sheet(sheet_id, include_attachments=False, include_discussions=False)
        columns = {col["title"]: col["id"] for col in sheet_data.get("columns", [])}
        
        # Prepare updates
        updated_rows: List[Dict[str, Any]] = []
        for row in matching_rows:
            cells: List[Dict[str, Any]] = []
            for column_name, new_value in update_data.items():
                column_id = columns.get(column_name)
                if column_id:
                    cells.append({
                        "columnId": column_id,
                        "value": new_value
                    })
            
            if cells:
                updated_rows.append({
                    "id": row["id"],
                    "cells": cells
                })
        
        # Perform the update
        return await self.update_rows(sheet_id, updated_rows)
    
    async def bulk_upload_attachments(
        self,
        sheet_id: Union[str, int],
        attachments: List[Dict[str, Any]],
        row_criteria: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        """
        Bulk upload multiple attachments
        attachments: [{"file_path": "path", "filename": "name"}, ...]
        row_criteria: Optional criteria to attach to specific rows
        """
        results: List[Dict[str, Any]] = []
        
        # If row criteria specified, find the target row
        target_row_id = None
        if row_criteria:
            matching_rows = await self.find_rows_by_criteria(sheet_id, row_criteria)
            if matching_rows:
                target_row_id = matching_rows[0].get("id")
        
        for attachment_info in attachments:
            try:
                file_path = attachment_info.get("file_path")
                filename = attachment_info.get("filename")
                
                if not file_path:
                    results.append({"error": "No file_path provided", "filename": filename})
                    continue
                
                # Upload attachment
                result = await self.upload_attachment(
                    sheet_id=sheet_id,
                    file_path=file_path,
                    file_name=filename,
                    row_id=target_row_id
                )
                
                results.append({
                    "filename": filename or Path(file_path).name,
                    "success": True,
                    "attachment_id": result.get("id"),
                    "result": result
                })
                
            except Exception as e:
                results.append({
                    "filename": attachment_info.get("filename", "unknown"),
                    "success": False,
                    "error": str(e)
                })
        
        return results
    
    # Integration Helpers
    async def create_pip_ai_sheet(
        self,
        project_name: str,
        template_columns: Optional[List[Dict[str, Any]]] = None
    ) -> Dict[str, Any]:
        """Create a new sheet optimized for PIP AI integration"""
        default_columns: List[Dict[str, Any]] = [
            {"title": "Task", "type": "TEXT_NUMBER", "primary": True},
            {"title": "Status", "type": "PICKLIST", "options": ["Not Started", "In Progress", "Complete"]},
            {"title": "PIP AI Analysis", "type": "TEXT_NUMBER"},
            {"title": "Estimate", "type": "TEXT_NUMBER"},
            {"title": "Trade", "type": "TEXT_NUMBER"},
            {"title": "Last Updated", "type": "DATE"},
            {"title": "Comments", "type": "TEXT_NUMBER"}
        ]
        
        columns: List[Dict[str, Any]] = template_columns or default_columns
        
        sheet_data: Dict[str, Any] = {
            "name": f"PIP AI - {project_name}",
            "columns": columns
        }
        
        return await self._make_request("POST", "/sheets", data=sheet_data)
    
    async def sync_pip_ai_results(
        self,
        sheet_id: Union[str, int],
        analysis_results: Dict[str, Any],
        row_id: Optional[int] = None
    ) -> Dict[str, Any]:
        """Sync PIP AI analysis results to Smartsheet"""
        # Extract key information from analysis results
        cells: List[Dict[str, Any]] = []
        
        if "estimate" in analysis_results:
            cells.append({
                "columnId": await self._get_column_id(sheet_id, "Estimate"),
                "value": str(analysis_results["estimate"])
            })
        
        if "trade" in analysis_results:
            cells.append({
                "columnId": await self._get_column_id(sheet_id, "Trade"),
                "value": str(analysis_results["trade"])
            })
        
        if "analysis" in analysis_results:
            cells.append({
                "columnId": await self._get_column_id(sheet_id, "PIP AI Analysis"),
                "value": str(analysis_results["analysis"])
            })
        
        # Update status and timestamp
        cells.extend([
            {
                "columnId": await self._get_column_id(sheet_id, "Status"),
                "value": "Complete"
            },
            {
                "columnId": await self._get_column_id(sheet_id, "Last Updated"),
                "value": datetime.now(timezone.utc).isoformat()
            }
        ])
        
        if row_id:
            # Update existing row
            return await self.update_cells(sheet_id, row_id, cells)
        else:
            # Create new row
            rows: List[Dict[str, Any]] = [{
                "toTop": True,
                "cells": cells
            }]
            return await self.add_rows(sheet_id, rows)
    
    async def _get_column_id(self, sheet_id: Union[str, int], column_title: str) -> int:
        """Helper to get column ID by title"""
        sheet = await self.get_sheet(sheet_id, include_attachments=False, include_discussions=False)
        
        for column in sheet.get("columns", []):
            if column.get("title") == column_title:
                return column["id"]
        
        raise ValueError(f"Column '{column_title}' not found in sheet")
    
    # Enhanced PIP AI Integration Methods
    async def create_pip_ai_project_sheet(
        self,
        project_name: str,
        project_data: Dict[str, Any],
        estimates: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Create a comprehensive PIP AI project sheet with all data
        """
        sheet_name = f"PIP AI - {project_name} - {datetime.now().strftime('%Y-%m-%d')}"
        
        # Create sheet with construction estimate template
        sheet = await self.create_pip_ai_sheet(sheet_name)
        sheet_id = sheet.get("id")
        
        if not sheet_id:
            raise ValueError("Failed to create sheet")
        
        # Add project overview information
        overview_rows: List[Dict[str, Any]] = []
        if project_data:
            overview_rows.extend([
                {"cells": [{"value": "PROJECT OVERVIEW"}, {"value": ""}]},
                {"cells": [{"value": "Project Name"}, {"value": project_data.get("name", "")}]},
                {"cells": [{"value": "Description"}, {"value": project_data.get("description", "")}]},
                {"cells": [{"value": "Analysis Date"}, {"value": datetime.now().strftime("%Y-%m-%d %H:%M")}]},
                {"cells": [{"value": ""}, {"value": ""}]},  # Separator
            ])
        
        # Add estimate data
        if estimates:
            overview_rows.append({"cells": [{"value": "COST ESTIMATES"}, {"value": ""}]})
            for estimate in estimates:
                overview_rows.append({
                    "cells": [
                        {"value": estimate.get("item", "")},
                        {"value": estimate.get("cost", "")},
                        {"value": estimate.get("description", "")}
                    ]
                })
        
        # Add the rows to the sheet
        if overview_rows:
            await self.add_rows(sheet_id, overview_rows)
        
        return {
            "sheet": sheet,
            "sheet_id": sheet_id,
            "project_data": project_data,
            "estimates_count": len(estimates),
            "url": f"https://app.smartsheet.com/sheets/{sheet_id}"
        }
    
    async def update_pip_ai_progress(
        self,
        sheet_id: Union[str, int],
        progress_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Update PIP AI project progress in an existing sheet
        """
        # Find progress section or create it
        progress_criteria = {"Task": "PROGRESS UPDATE"}
        existing_rows = await self.find_rows_by_criteria(sheet_id, progress_criteria, exact_match=False)
        
        current_date = datetime.now().strftime("%Y-%m-%d %H:%M")
        
        if existing_rows:
            # Update existing progress row
            update_data: Dict[str, Any] = {
                "Status": progress_data.get("status", "In Progress"),
                "Last Updated": current_date,
                "Comments": progress_data.get("notes", "")
            }
            return await self.update_row_by_criteria(sheet_id, progress_criteria, update_data)
        else:
            # Add new progress row
            progress_row: List[Dict[str, Any]] = [{
                "cells": [
                    {"value": "PROGRESS UPDATE"},
                    {"value": progress_data.get("status", "In Progress")},
                    {"value": ""},  # PIP AI Analysis
                    {"value": ""},  # Estimate
                    {"value": ""},  # Trade
                    {"value": current_date},
                    {"value": progress_data.get("notes", "")}
                ]
            }]
            return await self.add_rows(sheet_id, progress_row)

# Singleton instance for global use
smartsheet_service = SmartsheetService()
