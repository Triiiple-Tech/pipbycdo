"""
Smartsheet Integration Service for PIP AI
Provides comprehensive Smartsheet API integration capabilities with URL-based operations
"""

from typing import Optional, List, Dict, Any, Union, Type, Tuple
from datetime import datetime, timezone
import aiohttp
from pathlib import Path
import mimetypes
import re


class SmartsheetAPIError(Exception):
    """Custom exception for Smartsheet API errors"""
    
    def __init__(self, message: str, status_code: int = 0, response_data: Optional[Dict[str, Any]] = None):
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.response_data = response_data or {}


class SmartsheetService:
    """
    Comprehensive Smartsheet API integration service
    Handles authentication, sheet operations, and data synchronization with URL support
    """
    
    def __init__(self):
        self.base_url = "https://api.smartsheet.com/2.0"
        self.access_token: Optional[str] = None
        self.session: Optional[aiohttp.ClientSession] = None
        
    async def __aenter__(self) -> 'SmartsheetService':
        """Async context manager entry"""
        self.session = aiohttp.ClientSession()
        return self
    
    async def __aexit__(self, exc_type: Optional[Type[BaseException]], exc_val: Optional[BaseException], exc_tb: Optional[Any]) -> None:
        """Async context manager exit"""
        if self.session:
            await self.session.close()
    
    def set_access_token(self, token: str) -> None:
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
    
    # URL Validation and Extraction Methods
    @staticmethod
    def validate_sheet_url(url: str) -> bool:
        """Validate if URL is a valid Smartsheet URL format"""
        patterns = [
            r'https?://app\.smartsheet\.com/sheets/[\w\-_]+',
            r'https?://app\.smartsheet\.com/b/home\?lx=[\w\-_]+',
            r'https?://[\w\-]+\.smartsheet\.com/sheets/[\w\-_]+',
        ]
        return any(re.match(pattern, url) for pattern in patterns)
    
    @staticmethod
    def extract_sheet_id_from_url(url: str) -> Optional[str]:
        """Extract sheet ID from various Smartsheet URL formats"""
        patterns = [
            r'https?://app\.smartsheet\.com/sheets/([\w\-_]+)',
            r'https?://app\.smartsheet\.com/b/home\?lx=([\w\-_]+)',
            r'https?://[\w\-]+\.smartsheet\.com/sheets/([\w\-_]+)',
        ]
        
        for pattern in patterns:
            match = re.search(pattern, url)
            if match:
                return match.group(1)
        return None
    
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
        include_shared_to: bool = False,
        modified_since: Optional[datetime] = None
    ) -> Dict[str, Any]:
        """List all sheets accessible to the user"""
        params: Dict[str, Any] = {}
        include_params: List[str] = []
        
        if include_owner_info:
            include_params.append("ownerInfo")
        if include_shared_to:
            include_params.append("sharedTo")
        
        if include_params:
            params["include"] = ",".join(include_params)
        
        if modified_since:
            params["modifiedSince"] = modified_since.isoformat()
        
        return await self._make_request("GET", "/sheets", params=params)
    
    async def get_sheet(
        self,
        sheet_id: Union[str, int],
        include_attachments: bool = False,
        include_discussions: bool = False,
        include_filters: bool = False,
        include_format: bool = False,
        include_object_value: bool = False
    ) -> Dict[str, Any]:
        """Get sheet details by ID"""
        params: Dict[str, Any] = {}
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
        
        if include_params:
            params["include"] = ",".join(include_params)
        
        return await self._make_request("GET", f"/sheets/{sheet_id}", params=params)
    
    async def get_sheet_from_url(self, url: str) -> Dict[str, Any]:
        """Get sheet data directly from Smartsheet URL"""
        sheet_id = self.extract_sheet_id_from_url(url)
        if not sheet_id:
            raise SmartsheetAPIError("Could not extract sheet ID from URL", 400)
        
        return await self.get_sheet(sheet_id, include_attachments=True, include_discussions=False)
    
    async def search_sheets(self, query: str) -> Dict[str, Any]:
        """Search for sheets by query string"""
        params = {"query": query}
        return await self._make_request("GET", "/search/sheets", params=params)
    
    async def create_sheet(
        self,
        name: str,
        columns: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Create a new sheet with specified columns"""
        sheet_data: Dict[str, Any] = {
            "name": name,
            "columns": columns
        }
        return await self._make_request("POST", "/sheets", data=sheet_data)
    
    async def delete_sheet(self, sheet_id: Union[str, int]) -> Dict[str, Any]:
        """Delete a sheet"""
        return await self._make_request("DELETE", f"/sheets/{sheet_id}")
    
    # Enhanced Sheet Creation
    async def create_pip_ai_sheet(
        self, 
        project_name: str,
        template_columns: Optional[List[Dict[str, Any]]] = None
    ) -> Dict[str, Any]:
        """Create a new PIP AI project sheet with predefined structure"""
        default_columns: List[Dict[str, Any]] = [
            {"title": "Task", "type": "TEXT_NUMBER", "primary": True},
            {"title": "Estimate", "type": "TEXT_NUMBER"},
            {"title": "Description", "type": "TEXT_NUMBER"},
            {"title": "Status", "type": "PICKLIST", "options": ["Not Started", "In Progress", "Complete"]},
            {"title": "Assigned To", "type": "CONTACT_LIST"},
            {"title": "Due Date", "type": "DATE"}
        ]
        
        columns = template_columns or default_columns
        
        sheet_data: Dict[str, Any] = {
            "name": f"PIP AI - {project_name}",
            "columns": columns
        }
        
        return await self._make_request("POST", "/sheets", data=sheet_data)
    
    # Row Operations
    async def get_rows(
        self,
        sheet_id: Union[str, int],
        row_ids: Optional[List[int]] = None,
        include_all: bool = False
    ) -> Dict[str, Any]:
        """Get specific rows or all rows from a sheet"""
        if row_ids:
            row_id_str = ",".join(map(str, row_ids))
            return await self._make_request("GET", f"/sheets/{sheet_id}/rows/{row_id_str}")
        else:
            # Get the sheet with all rows
            sheet_data = await self.get_sheet(sheet_id, include_attachments=include_all)
            return {"data": sheet_data.get("rows", [])}
    
    async def add_rows(
        self,
        sheet_id: Union[str, int],
        rows: List[Dict[str, Any]],
        to_top: bool = False
    ) -> Dict[str, Any]:
        """Add new rows to a sheet"""
        data: Dict[str, Any] = {
            "rows": rows,
            "toTop": to_top
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
        row_id_str = ",".join(map(str, row_ids))
        return await self._make_request("DELETE", f"/sheets/{sheet_id}/rows", params={"ids": row_id_str})
    
    async def update_cells(
        self,
        sheet_id: Union[str, int],
        row_id: int,
        cells: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Update specific cells in a row"""
        data: Dict[str, Any] = {
            "rows": [{
                "id": row_id,
                "cells": cells
            }]
        }
        return await self.update_rows(sheet_id, data["rows"])
    
    # Enhanced Search and Update Methods
    async def get_row_by_number(
        self,
        sheet_id: Union[str, int],
        row_number: int,
        include_attachments: bool = False
    ) -> Optional[Dict[str, Any]]:
        """Get a specific row by its row number (1-based)"""
        sheet_data = await self.get_sheet(sheet_id, include_attachments=False)
        rows = sheet_data.get("rows", [])
        
        if row_number <= 0 or row_number > len(rows):
            return None
        
        row = rows[row_number - 1]
        
        if include_attachments:
            attachments = await self.list_attachments(sheet_id, row_id=row.get("id"))
            row["attachments"] = attachments
        
        return row
    
    async def find_rows_by_criteria(
        self,
        sheet_id: Union[str, int],
        search_criteria: Dict[str, Any],
        exact_match: bool = False
    ) -> List[Dict[str, Any]]:
        """Find rows that match specific criteria"""
        sheet_data = await self.get_sheet(sheet_id, include_attachments=False)
        rows = sheet_data.get("rows", [])
        columns = {col["title"]: col["id"] for col in sheet_data.get("columns", [])}
        
        matching_rows: List[Dict[str, Any]] = []
        
        for row in rows:
            cells = {cell["columnId"]: cell for cell in row.get("cells", [])}
            match = True
            
            for column_name, expected_value in search_criteria.items():
                column_id = columns.get(column_name)
                if not column_id:
                    continue
                
                cell = cells.get(column_id)
                cell_value = cell.get("value", "") if cell else ""
                expected_str = str(expected_value)
                
                if exact_match:
                    if str(cell_value) != expected_str:
                        match = False
                        break
                else:
                    if expected_str.lower() not in str(cell_value).lower():
                        match = False
                        break
            
            if match:
                matching_rows.append(row)
        
        return matching_rows
    
    async def update_row_by_criteria(
        self,
        sheet_id: Union[str, int],
        search_criteria: Dict[str, Any],
        update_data: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """Update rows that match specific criteria"""
        matching_rows = await self.find_rows_by_criteria(sheet_id, search_criteria)
        sheet_data = await self.get_sheet(sheet_id, include_attachments=False)
        columns = {col["title"]: col["id"] for col in sheet_data.get("columns", [])}
        
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
                updated_row: Dict[str, Any] = {
                    "id": row.get("id"),
                    "cells": cells
                }
                updated_rows.append(updated_row)
        
        if updated_rows:
            await self.update_rows(sheet_id, updated_rows)
            return updated_rows
        
        return []
    
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
    
    async def upload_attachment(
        self,
        sheet_id: Union[str, int],
        file_path: Optional[str] = None,
        file_name: Optional[str] = None,
        row_id: Optional[int] = None,
        file_content: Optional[bytes] = None
    ) -> Dict[str, Any]:
        """Upload attachment to sheet or row"""
        if not self.session:
            raise RuntimeError("Service not initialized.")
        
        # Determine endpoint
        if row_id:
            url = f"{self.base_url}/sheets/{sheet_id}/rows/{row_id}/attachments"
        else:
            url = f"{self.base_url}/sheets/{sheet_id}/attachments"
        
        # Handle file content
        if file_content and file_name:
            content = file_content
            filename = file_name
            content_type = mimetypes.guess_type(filename)[0] or "application/octet-stream"
        elif file_path:
            path = Path(file_path)
            if not path.exists():
                raise ValueError(f"File not found: {file_path}")
            
            with open(path, "rb") as f:
                content = f.read()
            filename = file_name or path.name
            content_type = mimetypes.guess_type(str(path))[0] or "application/octet-stream"
        else:
            raise ValueError("Either file_path or (file_content and file_name) must be provided")
        
        # Prepare headers for file upload
        headers = {
            "Authorization": f"Bearer {self.access_token}",
            "User-Agent": "PIP-AI/1.0"
        }
        
        # Create multipart form data
        form_data = aiohttp.FormData()
        form_data.add_field('file', content, filename=filename, content_type=content_type)
        
        try:
            async with self.session.post(url, headers=headers, data=form_data) as response:
                response_data = await response.json()
                
                if response.status >= 400:
                    raise SmartsheetAPIError(
                        f"Upload failed: {response.status}",
                        response.status,
                        response_data
                    )
                
                return response_data
                
        except aiohttp.ClientError as e:
            raise SmartsheetAPIError(f"Upload error: {str(e)}", 0, {})
    
    async def download_attachment(self, sheet_id: Union[str, int], attachment_id: Union[str, int]) -> Tuple[bytes, str, str]:
        """Download attachment and return content, filename, and content type"""
        if not self.session:
            raise RuntimeError("Service not initialized.")
        
        url = f"{self.base_url}/sheets/{sheet_id}/attachments/{attachment_id}"
        headers = {
            "Authorization": f"Bearer {self.access_token}",
            "User-Agent": "PIP-AI/1.0"
        }
        
        try:
            async with self.session.get(url, headers=headers) as response:
                if response.status >= 400:
                    raise SmartsheetAPIError(f"Download failed: {response.status}", response.status)
                
                content = await response.read()
                filename = response.headers.get("Content-Disposition", "attachment.bin")
                content_type = response.headers.get("Content-Type", "application/octet-stream")
                
                return content, filename, content_type
                
        except aiohttp.ClientError as e:
            raise SmartsheetAPIError(f"Download error: {str(e)}", 0, {})
    
    async def bulk_upload_attachments(
        self,
        sheet_id: Union[str, int],
        file_paths: List[str],
        target_row_criteria: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        """Upload multiple attachments to a sheet or specific row based on criteria"""
        results: List[Dict[str, Any]] = []
        target_row_id = None
        
        # Find target row if criteria provided
        if target_row_criteria:
            matching_rows = await self.find_rows_by_criteria(sheet_id, target_row_criteria)
            if matching_rows:
                target_row_id = matching_rows[0].get("id")
        
        for file_path in file_paths:
            try:
                with open(file_path, "rb") as f:
                    content = f.read()
                
                result = await self.upload_attachment(
                    sheet_id=sheet_id,
                    file_content=content,
                    file_name=Path(file_path).name,
                    row_id=target_row_id
                )
                
                results.append({
                    "file_path": file_path,
                    "success": True,
                    "result": result
                })
                
            except Exception as e:
                results.append({
                    "file_path": file_path,
                    "success": False,
                    "error": str(e)
                })
        
        return results
    
    # Export Operations
    async def export_sheet(
        self,
        sheet_id: Union[str, int],
        format_type: str = "xlsx",
        paper_size: str = "A4"
    ) -> Tuple[bytes, str]:
        """Export sheet in specified format"""
        if not self.session:
            raise RuntimeError("Service not initialized.")
        
        params = {"format": format_type}
        if format_type == "pdf":
            params["paperSize"] = paper_size
        
        url = f"{self.base_url}/sheets/{sheet_id}/export"
        headers = {
            "Authorization": f"Bearer {self.access_token}",
            "User-Agent": "PIP-AI/1.0"
        }
        
        try:
            async with self.session.get(url, headers=headers, params=params) as response:
                if response.status >= 400:
                    raise SmartsheetAPIError(
                        f"Export failed: {response.status}",
                        response.status,
                        await response.json()
                    )
                
                content = await response.read()
                filename = f"sheet_{sheet_id}.{format_type}"
                
                return content, filename
                
        except aiohttp.ClientError as e:
            raise SmartsheetAPIError(f"Export error: {str(e)}", 0, {})
    
    # URL-based Operations
    async def sync_from_url(
        self,
        url: str,
        include_attachments: bool = True,
        include_discussions: bool = False
    ) -> Dict[str, Any]:
        """Comprehensive data sync from Smartsheet URL"""
        if not self.validate_sheet_url(url):
            raise SmartsheetAPIError("Invalid Smartsheet URL format", 400)
        
        sheet_id = self.extract_sheet_id_from_url(url)
        if not sheet_id:
            raise SmartsheetAPIError("Could not extract sheet ID from URL", 400)
        
        # Get comprehensive sheet data
        sheet_data = await self.get_sheet(
            sheet_id,
            include_attachments=include_attachments,
            include_discussions=include_discussions,
            include_filters=True,
            include_format=False
        )
        
        # Add metadata
        sheet_data["sync_timestamp"] = datetime.now(timezone.utc).isoformat()
        sheet_data["source_url"] = url
        
        return sheet_data
    
    # PIP AI Specific Methods
    async def create_pip_ai_project_sheet(
        self,
        project_name: str,
        project_data: Optional[Dict[str, Any]] = None,
        estimates: Optional[List[Dict[str, Any]]] = None
    ) -> Dict[str, Any]:
        """Create a comprehensive PIP AI project sheet"""
        # Create the sheet
        sheet = await self.create_pip_ai_sheet(project_name)
        sheet_id = sheet.get("result", {}).get("id")
        
        if not sheet_id:
            raise ValueError("Failed to create sheet")
        
        # Add project data rows if provided
        rows: List[Dict[str, Any]] = []
        
        # Add header rows with project information
        if project_data:
            rows.extend([
                {"cells": [{"value": "Project Name"}, {"value": project_data.get("name", project_name)}]},
                {"cells": [{"value": "Analysis Date"}, {"value": datetime.now().strftime("%Y-%m-%d %H:%M")}]},
                {"cells": [{"value": "Status"}, {"value": "In Progress"}]},
            ])
        
        # Add estimate rows if provided
        if estimates:
            for estimate in estimates:
                rows.append({
                    "cells": [
                        {"value": estimate.get("item", "")},
                        {"value": estimate.get("cost", "")},
                        {"value": estimate.get("description", "")}
                    ]
                })
        
        if rows:
            await self.add_rows(sheet_id, rows)
        
        return {
            "sheet_id": sheet_id,
            "sheet_data": sheet,
            "rows_added": len(rows)
        }
    
    async def update_pip_ai_progress(
        self,
        sheet_id: Union[str, int],
        progress_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Update PIP AI project progress in sheet"""
        # Update status row
        status_criteria = {"Project Name": progress_data.get("project_name", "")}
        update_data = {"Status": progress_data.get("status", "In Progress")}
        
        # Add progress tracking row
        current_date = datetime.now().strftime("%Y-%m-%d %H:%M")
        progress_row: List[Dict[str, Any]] = [{
            "cells": [
                {"value": f"Progress Update - {current_date}"},
                {"value": progress_data.get("completion_percentage", "")},
                {"value": progress_data.get("notes", "")}
            ]
        }]
        
        # Update existing rows and add progress row
        await self.update_row_by_criteria(sheet_id, status_criteria, update_data)
        return await self.add_rows(sheet_id, progress_row)
    
    async def sync_pip_ai_results(
        self,
        sheet_id: Union[str, int],
        analysis_results: Dict[str, Any],
        cost_estimates: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Sync PIP AI analysis results to Smartsheet"""
        rows: List[Dict[str, Any]] = []
        
        # Add analysis summary
        rows.append({
            "cells": [
                {"value": "Analysis Summary"},
                {"value": analysis_results.get("total_cost", "")},
                {"value": f"Analysis completed: {datetime.now().strftime('%Y-%m-%d %H:%M')}"}
            ]
        })
        
        # Add cost breakdown
        for estimate in cost_estimates:
            rows.append({
                "cells": [
                    {"value": estimate.get("category", "")},
                    {"value": estimate.get("amount", "")},
                    {"value": estimate.get("details", "")}
                ]
            })
        
        return await self.add_rows(sheet_id, rows)
