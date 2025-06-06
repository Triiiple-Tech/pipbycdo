"""
Smartsheet Agent for PIP AI
Specialized agent for Smartsheet integration and data synchronization
"""

import logging
from typing import Dict, Any, Optional, List
from datetime import datetime, timezone

from backend.agents.base_agent import BaseAgent
from backend.services.smartsheet_service import SmartsheetService, SmartsheetAPIError
from app.schemas import AppState

logger = logging.getLogger(__name__)

class SmartsheetAgent(BaseAgent):
    """
    Agent responsible for Smartsheet integration operations
    Handles sheet creation, data sync, and export functionality
    """
    
    def __init__(self):
        super().__init__("smartsheet")
        self.agent_type = "smartsheet"
        self.agent_name = "Smartsheet Integration Agent"
        self.capabilities = [
            "sheet_creation",
            "data_synchronization", 
            "export_management",
            "template_application",
            "collaboration_setup"
        ]
    
    def process(self, state: AppState, **kwargs: Any) -> AppState:
        """
        Process Smartsheet integration requests
        
        Args:
            state: Current application state
            **kwargs: Additional processing options
            
        Returns:
            Updated application state
        """
        import asyncio
        return asyncio.run(self._process_async_impl(state, **kwargs))
    
    async def _process_async_impl(self, state: AppState, **kwargs: Any) -> AppState:
        """
        Async implementation of the process method
        """
        try:
            logger.info(f"[{self.agent_name}] Starting Smartsheet processing")
            
            # Extract Smartsheet-specific parameters
            smartsheet_action: str = kwargs.get("smartsheet_action", "sync")
            access_token: Optional[str] = kwargs.get("smartsheet_token")
            template_type: str = kwargs.get("template_type", "construction_estimate")
            sheet_name: Optional[str] = kwargs.get("sheet_name")
            # Auto-export flag is stored in kwargs but not used directly here
            
            if not access_token:
                logger.warning(f"[{self.agent_name}] No Smartsheet token provided")
                return self._add_trace_entry(
                    state,
                    "warning", 
                    "No Smartsheet access token provided - skipping integration"
                )
            
            # Initialize Smartsheet service
            async with SmartsheetService() as service:
                service.set_access_token(access_token)
                
                # Validate token first
                if not await service.validate_token():
                    logger.error(f"[{self.agent_name}] Invalid Smartsheet token")
                    return self._add_trace_entry(
                        state,
                        "error",
                        "Invalid Smartsheet access token"
                    )
                
                # Process based on action type
                if smartsheet_action == "sync":
                    state = await self._sync_to_smartsheet(state, service, template_type, sheet_name)
                elif smartsheet_action == "create_sheet":
                    state = await self._create_sheet(state, service, template_type, sheet_name)
                elif smartsheet_action == "export":
                    state = await self._export_data(state, service, kwargs)
                elif smartsheet_action == "update":
                    state = await self._update_existing(state, service, kwargs)
                else:
                    logger.warning(f"[{self.agent_name}] Unknown action: {smartsheet_action}")
                    return self._add_trace_entry(
                        state,
                        "warning",
                        f"Unknown Smartsheet action: {smartsheet_action}"
                    )
                
                logger.info(f"[{self.agent_name}] Smartsheet processing completed successfully")
                return self._add_trace_entry(
                    state,
                    "success",
                    f"Smartsheet {smartsheet_action} completed successfully"
                )
                
        except SmartsheetAPIError as e:
            logger.error(f"[{self.agent_name}] Smartsheet API error: {e}")
            return self._add_trace_entry(
                state,
                "error",
                f"Smartsheet API error: {e.message}"
            )
        except Exception as e:
            logger.error(f"[{self.agent_name}] Unexpected error: {e}")
            return self._add_trace_entry(
                state,
                "error",
                f"Smartsheet processing failed: {str(e)}"
            )
    
    async def _sync_to_smartsheet(
        self, 
        state: AppState, 
        service: SmartsheetService,
        template_type: str,
        sheet_name: Optional[str]
    ) -> AppState:
        """Sync PIP AI data to Smartsheet"""
        logger.info(f"[{self.agent_name}] Syncing data to Smartsheet")
        
        # Prepare project data for Smartsheet
        project_name = sheet_name or f"PIP AI Analysis - {datetime.now().strftime('%Y-%m-%d %H:%M')}"
        
        # Transform PIP AI estimate data to Smartsheet format
        estimates_data = self._transform_estimates_to_smartsheet(state.estimate or [])
        
        # Create project data dictionary
        project_data: Dict[str, Any] = {
            "name": project_name,
            "analysis_date": datetime.now().strftime("%Y-%m-%d %H:%M"),
            "user_id": state.user_id,
            "session_id": state.session_id,
            "total_items": len(estimates_data),
            "processed_files": [f.filename for f in (state.files or [])]
        }
        
        # Create and populate Smartsheet
        result = await service.create_pip_ai_project_sheet(
            project_name,
            project_data,
            estimates_data
        )
        
        # Update state with Smartsheet information
        self._update_state_with_smartsheet_info(state, result, template_type)
        
        logger.info(f"[{self.agent_name}] Data synced to sheet ID: {result.get('sheet_id')}")
        return state
    
    async def _create_sheet(
        self,
        state: AppState,
        service: SmartsheetService,
        template_type: str,
        sheet_name: Optional[str]
    ) -> AppState:
        """Create a new Smartsheet with PIP AI template"""
        logger.info(f"[{self.agent_name}] Creating new Smartsheet")
        
        name = sheet_name or f"PIP AI - {datetime.now().strftime('%Y-%m-%d %H:%M')}"
        
        # Create sheet using PIP AI template
        sheet: Dict[str, Any] = await service.create_pip_ai_sheet(
            project_name=name
        )
        
        # Update state with sheet information
        if not state.metadata:
            state.metadata = {}
        
        state.metadata["smartsheet"] = {
            "sheet_id": sheet.get("id"),
            "sheet_name": sheet.get("name"),
            "sheet_url": sheet.get("permalink"),
            "created_date": datetime.now(timezone.utc).isoformat(),
            "template_type": template_type
        }
        
        logger.info(f"[{self.agent_name}] Sheet created with ID: {sheet.get('id')}")
        return state
    
    async def _export_data(
        self,
        state: AppState,
        service: SmartsheetService,
        options: Dict[str, Any]
    ) -> AppState:
        """Export Smartsheet data"""
        logger.info(f"[{self.agent_name}] Exporting Smartsheet data")
        
        sheet_id = options.get("sheet_id")
        if not sheet_id and state.metadata and state.metadata.get("smartsheet"):
            sheet_id = state.metadata["smartsheet"].get("sheet_id")
        
        if not sheet_id:
            raise ValueError("No sheet ID provided for export")
        
        export_format = options.get("format", "PDF")
        paper_size = options.get("paper_size", "A4")
        
        # Export sheet
        file_content, filename = await service.export_sheet(
            sheet_id=sheet_id,
            format_type=export_format,
            paper_size=paper_size
        )
        
        # Update state with export information
        if not state.metadata:
            state.metadata = {}
        
        if "smartsheet" not in state.metadata:
            state.metadata["smartsheet"] = {}
        
        state.metadata["smartsheet"]["last_export"] = {
            "format": export_format,
            "filename": filename,
            "export_date": datetime.now(timezone.utc).isoformat(),
            "file_size": len(file_content)
        }
        
        logger.info(f"[{self.agent_name}] Sheet exported as {filename}")
        return state
    
    async def _update_existing(
        self,
        state: AppState,
        service: SmartsheetService,
        options: Dict[str, Any]
    ) -> AppState:
        """Update existing Smartsheet data"""
        logger.info(f"[{self.agent_name}] Updating existing Smartsheet")
        
        sheet_id = options.get("sheet_id")
        if not sheet_id and state.metadata and state.metadata.get("smartsheet"):
            sheet_id = state.metadata["smartsheet"].get("sheet_id")
        
        if not sheet_id:
            raise ValueError("No sheet ID provided for update")
        
        # Get current sheet structure
        sheet: Dict[str, Any] = await service.get_sheet(
            sheet_id,
            include_attachments=False,
            include_discussions=False,
            include_filters=False,
            include_format=False,
            include_object_value=False
        )
        
        # Update with new estimate data if available
        if state.estimate:
            rows_to_add: List[Dict[str, Any]] = []
            for item in state.estimate:
                row_cells: List[Dict[str, Any]] = []
                
                # Map estimate data to sheet columns
                # This would need to be customized based on the actual sheet structure
                column_mappings: Dict[str, Any] = {
                    "Description": item.description,
                    "Quantity": item.qty,
                    "Unit": item.unit,
                    "Unit Cost": item.unit_price,
                    "Total Cost": item.total
                }
                
                for column in sheet.get("columns", []):
                    column_title: str = column.get("title")
                    if column_title in column_mappings:
                        row_cells.append({
                            "columnId": column["id"],
                            "value": column_mappings[column_title]
                        })
                
                if row_cells:
                    rows_to_add.append({"cells": row_cells})
            
            if rows_to_add:
                # Add rows to the sheet
                await service.add_rows(sheet_id, rows_to_add)
                logger.info(f"[{self.agent_name}] Added {len(rows_to_add)} rows to sheet")
        
        # Update metadata
        if not state.metadata:
            state.metadata = {}
        
        if "smartsheet" not in state.metadata:
            state.metadata["smartsheet"] = {}
        
        state.metadata["smartsheet"]["last_updated"] = datetime.now(timezone.utc).isoformat()
        
        return state
    
    def _add_trace_entry(self, state: AppState, level: str, message: str) -> AppState:
        """Add a trace entry to the state"""
        from app.schemas import AgentTraceEntry
        
        trace_entry = AgentTraceEntry(
            agent=self.agent_name,
            decision=message,
            timestamp=datetime.now(timezone.utc),
            level=level
        )
        
        state.agent_trace.append(trace_entry)
        return state
    
    def get_capabilities(self) -> List[str]:
        """Return list of agent capabilities"""
        return self.capabilities
    
    def get_agent_info(self) -> Dict[str, Any]:
        """Return agent information"""
        return {
            "name": self.agent_name,
            "type": self.agent_type,
            "capabilities": self.capabilities,
            "description": "Handles Smartsheet integration, data sync, and export operations",
            "version": "1.0.0"
        }
    
    def _transform_estimates_to_smartsheet(self, estimates: List[Any]) -> List[Dict[str, Any]]:
        """Transform PIP AI estimates to Smartsheet format"""
        smartsheet_estimates: List[Dict[str, Any]] = []
        
        for item in estimates:
            estimate_data: Dict[str, Any] = {
                "item": getattr(item, 'item', ''),
                "cost": getattr(item, 'total', 0),
                "description": getattr(item, 'description', ''),
                "quantity": getattr(item, 'qty', 0),
                "unit": getattr(item, 'unit', ''),
                "unit_cost": getattr(item, 'unit_price', 0),
                "trade": getattr(item, 'csi_division', 'General'),
                "category": getattr(item, 'notes', 'Labor')
            }
            smartsheet_estimates.append(estimate_data)
        
        return smartsheet_estimates
    
    def _update_state_with_smartsheet_info(
        self, 
        state: AppState, 
        result: Dict[str, Any], 
        template_type: str
    ) -> None:
        """Update AppState with Smartsheet information"""
        if not state.metadata:
            state.metadata = {}
        
        state.metadata["smartsheet"] = {
            "sheet_id": result.get("sheet_id"),
            "sheet_url": result.get("permalink"),
            "sync_date": datetime.now(timezone.utc).isoformat(),
            "template_type": template_type,
            "rows_created": result.get("rows_added", 0)
        }


# Singleton instance for global use
smartsheet_agent = SmartsheetAgent()
