# Chat Agent Router Service
# Handles routing chat messages to appropriate agents and generating responses

import time
import logging
from typing import Dict, Any, Optional, List
from backend.agents.manager_agent import ManagerAgent
from backend.app.schemas import AppState
from backend.services.gpt_handler import run_llm
from backend.services.llm_selector import select_llm

logger = logging.getLogger(__name__)

class AgentRouter:
    """Routes chat messages to appropriate agents and manages responses"""
    
    def __init__(self):
        self.manager_agent = ManagerAgent()
    
    async def process_user_message(
        self, 
        session_id: str, 
        user_message: str, 
        user_id: str
    ) -> Optional[Dict[str, Any]]:
        """
        Process a user message and generate an agent response
        
        SIMPLIFIED ARCHITECTURE:
        All user messages go directly to ManagerAgent
        ManagerAgent handles all orchestration and user communication
        
        Returns:
            Dict containing response content, agent_type, metadata, etc.
        """
        start_time = time.time()
        
        # Get LLM configuration for manager agent
        llm_config = select_llm("manager", {})
        model = llm_config.get("model") or "gpt-4o"  # Fallback to gpt-4o if None
        
        try:
            logger.info(f"Routing message to ManagerAgent: {user_message[:100]}...")
            
            # ALWAYS route to ManagerAgent - it handles all orchestration
            app_state = AppState()
            app_state.query = user_message
            app_state.session_id = session_id
            app_state.user_id = user_id
            
            # Load session context to preserve Smartsheet file data and other state
            session_context = self._load_session_context(session_id)
            if session_context:
                logger.info(f"Loaded session context with keys: {list(session_context.keys())}")
                
                # Add session context to app state metadata
                app_state.metadata = app_state.metadata or {}
                app_state.metadata.update(session_context)
                
                # If we have file selection and available files, set appropriate status
                if self._is_file_selection_submission(user_message) and session_context.get("available_files"):
                    app_state.status = "awaiting_file_selection"
                    logger.info(f"Set status to awaiting_file_selection with {len(session_context['available_files'])} files")
            
            # Check if this is a Smartsheet URL or other agent-processable request
            if self._should_use_agent_processing(user_message):
                logger.info(f"Using agent processing for message: {user_message[:100]}...")
                # Use actual agent processing through ManagerAgent
                result_state = await self.manager_agent.process(app_state)
                logger.info(f"Agent processing completed. State has {len(result_state.agent_trace) if result_state.agent_trace else 0} trace entries")
                
                # Extract response content from agent trace or generate summary
                response_content = self._extract_agent_response(result_state)
                agent_type = self._determine_agent_type(result_state)
                confidence = 0.95
                sources = ["agent_processing", "manager_agent"]
            else:
                logger.info(f"Using simple LLM response for message: {user_message[:100]}...")
                # Use simple LLM response for general chat
                response_content = await self._generate_response(user_message)
                agent_type = "manager"
                confidence = 0.85
                sources = ["openai_api", "simple_response"]
            
            processing_time = int((time.time() - start_time) * 1000)
            
            return {
                "content": response_content,
                "agent_type": agent_type,
                "model": llm_config.get("model") or "gpt-4o",
                "token_cost": len(user_message.split()) + len(response_content.split()),  # Approximate token count
                "processing_time": processing_time,
                "confidence": confidence,
                "sources": sources
            }
            
        except Exception as e:
            logger.error(f"Error processing user message: {e}")
            return {
                "content": "I encountered an issue processing your request. Could you please rephrase or try again?",
                "agent_type": "system",
                "model": "fallback",
                "token_cost": 0,
                "processing_time": int((time.time() - start_time) * 1000),
                "confidence": 0.5,
                "sources": ["error_handling"]
            }
    
    async def broadcast_agent_conversation(
        self, 
        session_id: str, 
        agent_name: str, 
        message_content: str, 
        message_type: str = "action",
        target_agent: str = None,
        metadata: Dict[str, Any] = None
    ):
        """
        Broadcast agent-to-agent conversation messages for gorgeous streaming
        
        Args:
            session_id: Chat session ID
            agent_name: Name of the agent sending the message
            message_content: Content of the agent message
            message_type: Type of message ('thinking', 'action', 'result', 'handoff')
            target_agent: Target agent for handoff messages
            metadata: Additional metadata (confidence, processing_time, progress)
        """
        try:
            # Import here to avoid circular imports
            from backend.routes.chat import broadcast_message
            from datetime import datetime, timezone
            
            agent_message = {
                "type": "agent_conversation",
                "session_id": session_id,
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "data": {
                    "id": f"agent_{int(time.time() * 1000)}",
                    "agent": agent_name,
                    "content": message_content,
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                    "type": message_type,
                    "targetAgent": target_agent,
                    "metadata": metadata or {}
                }
            }
            
            await broadcast_message(session_id, agent_message)
            logger.info(f"Broadcasted agent conversation: {agent_name} -> {message_content[:50]}...")
            
        except Exception as e:
            logger.error(f"Error broadcasting agent conversation: {e}")
    
    async def simulate_agent_workflow(self, session_id: str, user_message: str):
        """
        Simulate a realistic agent workflow with gorgeous streaming conversations
        """
        try:
            # Manager Agent starts the workflow
            await self.broadcast_agent_conversation(
                session_id=session_id,
                agent_name="Manager Agent",
                message_content=f"Analyzing request: '{user_message[:100]}...' - Determining optimal agent workflow",
                message_type="thinking",
                metadata={"confidence": 0.95, "processingTime": 150}
            )
            
            # Simulate realistic delays between agent communications
            import asyncio
            await asyncio.sleep(1.2)
            
            # Manager decides on workflow
            await self.broadcast_agent_conversation(
                session_id=session_id,
                agent_name="Manager Agent",
                message_content="Initiating multi-agent analysis pipeline. Routing to File Reader Agent for document processing.",
                message_type="action",
                metadata={"confidence": 0.98, "processingTime": 200}
            )
            
            await asyncio.sleep(0.8)
            
            # Handoff to File Reader Agent
            await self.broadcast_agent_conversation(
                session_id=session_id,
                agent_name="Manager Agent",
                message_content="Handing off to File Reader Agent for document analysis",
                message_type="handoff",
                target_agent="File Reader Agent",
                metadata={"confidence": 1.0}
            )
            
            await asyncio.sleep(1.0)
            
            # File Reader Agent processes
            await self.broadcast_agent_conversation(
                session_id=session_id,
                agent_name="File Reader Agent",
                message_content="Scanning documents for construction data... Extracting text, tables, and technical specifications.",
                message_type="action",
                metadata={"confidence": 0.92, "processingTime": 850, "progress": 25}
            )
            
            await asyncio.sleep(1.5)
            
            await self.broadcast_agent_conversation(
                session_id=session_id,
                agent_name="File Reader Agent",
                message_content="Document analysis complete. Identified 3 construction documents with 247 line items. Passing to Trade Mapper Agent.",
                message_type="result",
                metadata={"confidence": 0.94, "processingTime": 1200}
            )
            
            await asyncio.sleep(0.7)
            
            # Handoff to Trade Mapper
            await self.broadcast_agent_conversation(
                session_id=session_id,
                agent_name="File Reader Agent",
                message_content="Transferring processed data to Trade Mapper Agent for categorization",
                message_type="handoff",
                target_agent="Trade Mapper Agent"
            )
            
            await asyncio.sleep(1.1)
            
            # Trade Mapper processes
            await self.broadcast_agent_conversation(
                session_id=session_id,
                agent_name="Trade Mapper Agent",
                message_content="Analyzing construction trades and CSI divisions... Categorizing line items by specialty.",
                message_type="action",
                metadata={"confidence": 0.89, "processingTime": 650, "progress": 60}
            )
            
            await asyncio.sleep(1.3)
            
            await self.broadcast_agent_conversation(
                session_id=session_id,
                agent_name="Trade Mapper Agent",
                message_content="Trade mapping complete. Identified 8 major trades: Concrete, Steel, HVAC, Electrical, Plumbing, Finishes, Roofing, Sitework.",
                message_type="result",
                metadata={"confidence": 0.91, "processingTime": 980}
            )
            
            await asyncio.sleep(0.9)
            
            # Continue with Estimator Agent
            await self.broadcast_agent_conversation(
                session_id=session_id,
                agent_name="Trade Mapper Agent",
                message_content="Routing categorized data to Estimator Agent for cost analysis",
                message_type="handoff",
                target_agent="Estimator Agent"
            )
            
            await asyncio.sleep(1.0)
            
            await self.broadcast_agent_conversation(
                session_id=session_id,
                agent_name="Estimator Agent",
                message_content="Calculating costs using regional pricing data... Applying labor rates, material costs, and overhead factors.",
                message_type="action",
                metadata={"confidence": 0.87, "processingTime": 1100, "progress": 85}
            )
            
            await asyncio.sleep(1.8)
            
            await self.broadcast_agent_conversation(
                session_id=session_id,
                agent_name="Estimator Agent",
                message_content="Cost estimation complete. Generated detailed estimate with line-item pricing and total project costs.",
                message_type="result",
                metadata={"confidence": 0.93, "processingTime": 1950}
            )
            
        except Exception as e:
            logger.error(f"Error in agent workflow simulation: {e}")
    
    def _should_use_agent_processing(self, user_message: str) -> bool:
        """Determine if the message should use agent processing or simple LLM response."""
        # Use agent processing for:
        # - Smartsheet URLs
        # - File selection submissions
        # - Construction/estimation related requests
        # - Complex multi-step requests
        
        agent_keywords = [
            "smartsheet", "estimate", "cost", "construction", "project", "takeoff",
            "trade", "scope", "materials", "labor", "pricing", "analysis",
            "files", "upload", "analyze", "calculate"
        ]
        
        message_lower = user_message.lower()
        
        # Check for Smartsheet URLs
        if "smartsheet.com" in message_lower:
            return True
            
        # Check for file selection
        if self._is_file_selection_submission(user_message):
            return True
            
        # Check for construction/estimation keywords
        if any(keyword in message_lower for keyword in agent_keywords):
            return True
            
        # Check for complex requests (longer messages likely need agent processing)
        if len(user_message.split()) > 10:
            return True
            
        return False
    
    async def _generate_response(self, user_message: str) -> str:
        """Generate a simple LLM response for general chat."""
        try:
            prompt = f"""You are the PIP AI Assistant, a specialized construction estimation and project management AI.
            
Respond to this user message in a helpful and professional manner. If the message is about construction, estimation, or project management, guide them on how to upload files or provide Smartsheet URLs for analysis.

User message: {user_message}

Response:"""
            
            response = await run_llm(
                messages=[{"role": "user", "content": prompt}],
                model="gpt-4o-mini",
                max_tokens=200
            )
            
            return response.strip()
            
        except Exception as e:
            logger.error(f"Error generating LLM response: {e}")
            return "I'm here to help with construction estimation and project management. Feel free to upload files or share Smartsheet URLs for analysis!"

    def _extract_agent_response(self, state: AppState) -> str:
        """Extract a user-friendly response from the agent state."""
        # Check for estimate results
        if state.estimate and len(state.estimate) > 0:
            total_items = len(state.estimate)
            logger.info(f"Found estimate with {total_items} items")
            return f"✅ Generated estimate with {total_items} items"
        
        # Default response
        logger.info("Using default response - no specific results found")
        return "✅ Request processed successfully"
    
    def _determine_agent_type(self, state: AppState) -> str:
        """Determine the actual agent that handled the request based on agent trace."""
        logger.info(f"Determining agent type from state with {len(state.agent_trace) if state.agent_trace else 0} trace entries")
        
        # Check if there are any agent trace entries
        if not state.agent_trace or len(state.agent_trace) == 0:
            return "manager"
        
        # Get the last few trace entries and analyze them
        recent_traces = state.agent_trace[-5:]  # Look at last 5 entries
        
        # Helper function to safely get trace decision
        def get_trace_decision(trace):
            if hasattr(trace, 'decision'):
                return trace.decision
            elif isinstance(trace, dict) and 'decision' in trace:
                return trace['decision']
            return str(trace)
        
        # Look for specific agent indicators in reverse order (most recent first)
        for trace in reversed(recent_traces):
            decision_text = get_trace_decision(trace)
            decision_lower = decision_text.lower()
            
            # Check for SmartsheetAgent activity
            if any(keyword in decision_lower for keyword in [
                "smartsheet", "files retrieved", "smartsheet integration", 
                "smartsheet processing", "selection clarification", "files downloaded"
            ]):
                logger.info(f"Detected SmartsheetAgent activity: {decision_text[:50]}...")
                return "smartsheet"
            
            # Check for other agent types
            if any(keyword in decision_lower for keyword in [
                "qa validation", "validation complete", "qa findings"
            ]):
                logger.info(f"Detected QA validation activity: {decision_text[:50]}...")
                return "qa_validator"
            
            if any(keyword in decision_lower for keyword in [
                "export", "exporting", "export complete", "export prepared"
            ]):
                logger.info(f"Detected export activity: {decision_text[:50]}...")
                return "exporter"
            
            if any(keyword in decision_lower for keyword in [
                "trade mapping", "trade mapped", "categorizing"
            ]):
                logger.info(f"Detected trade mapping activity: {decision_text[:50]}...")
                return "trade_mapper"
            
            if any(keyword in decision_lower for keyword in [
                "cost estimation", "estimate generated", "pricing"
            ]):
                logger.info(f"Detected cost estimation activity: {decision_text[:50]}...")
                return "cost_estimator"
        
        # Check for file selection context
        if state.pending_user_action and "file" in state.pending_user_action.lower():
            logger.info("Detected file selection context - using smartsheet agent type")
            return "smartsheet"
        
        # Check metadata for agent context
        if state.metadata:
            if state.metadata.get("smartsheet"):
                logger.info("Detected Smartsheet metadata - using smartsheet agent type")
                return "smartsheet"
            if state.metadata.get("export_format"):
                return "exporter"
        
        # Default to manager if no specific agent activity detected
        logger.info("No specific agent activity detected - defaulting to manager")
        return "manager"
    
    def _is_file_selection_submission(self, user_message: str) -> bool:
        """Detect if the message is a file selection submission."""
        # Check for file selection patterns
        file_selection_patterns = [
            r'selected_files:\s*\[.*\]',  # JSON format
            r'selected_files:\s*.*',  # Simple format: selected_files: file1, file2
            r'analyze\s+(selected|files|all)',  # Natural language commands
            r'file_selection:\s*{.*}',  # Structured format
            r'files:\s*\[.*\]',  # Simple format
            r'\.pdf|\.xlsx?|\.docx?|\.txt',  # Contains file extensions
        ]
        
        import re
        for pattern in file_selection_patterns:
            if re.search(pattern, user_message, re.IGNORECASE):
                return True
        
        # Also check if the message looks like a list of files
        if ',' in user_message and any(ext in user_message.lower() for ext in ['.pdf', '.xlsx', '.xls', '.docx', '.doc']):
            return True
            
        return False
    
    def _parse_file_selection(self, user_message: str) -> Dict[str, Any]:
        """Parse file selection from user message."""
        import re
        import json
        
        # Try to extract JSON format first
        json_match = re.search(r'(\{.*\}|\[.*\])', user_message)
        if json_match:
            try:
                return json.loads(json_match.group(1))
            except json.JSONDecodeError:
                pass
        
        # Parse natural language selections
        selection_data = {
            "selected_files": [],
            "action": "analyze_selected",
            "additional_text": ""
        }
        
        # Check for "analyze all" command
        if re.search(r'analyze\s+all', user_message, re.IGNORECASE):
            selection_data["action"] = "analyze_all"
            return selection_data
        
        # Extract file names - look for common patterns
        file_patterns = [
            r'selected_files:\s*([^-\n]+)',  # selected_files: file1, file2
            r'files?:\s*([^-\n]+)',  # files: file1, file2
            r'([^,\s]+\.(pdf|xlsx?|docx?|txt))',  # Direct file names with extensions
        ]
        
        for pattern in file_patterns:
            matches = re.findall(pattern, user_message, re.IGNORECASE)
            if matches:
                if isinstance(matches[0], tuple):
                    # Pattern captured groups
                    for match in matches:
                        file_name = match[0].strip()
                        if file_name and file_name not in selection_data["selected_files"]:
                            selection_data["selected_files"].append(file_name)
                else:
                    # Simple pattern - split by commas
                    files_text = matches[0].strip()
                    files = [f.strip() for f in files_text.split(',') if f.strip()]
                    selection_data["selected_files"].extend(files)
                break
        
        # Extract additional text (remove file selection syntax)
        clean_text = re.sub(r'(selected_files:|files?:|analyze|file\s*\d+)', '', user_message, flags=re.IGNORECASE)
        clean_text = re.sub(r'[^a-zA-Z0-9\s\.\-]', ' ', clean_text)  # Remove special chars
        selection_data["additional_text"] = clean_text.strip()
        
        return selection_data
    
    def _load_session_context(self, session_id: str) -> Dict[str, Any]:
        """Load session context from chat sessions storage."""
        try:
            # Import here to avoid circular imports
            from backend.routes.chat import chat_sessions
            
            if session_id in chat_sessions:
                session_data = chat_sessions[session_id]
                
                # Extract relevant context for agent processing
                context = {}
                
                # Check if there's Smartsheet context from previous interactions
                if "smartsheet_context" in session_data:
                    context["smartsheet"] = session_data["smartsheet_context"]
                
                # Look for Smartsheet file data in recent messages
                from backend.routes.chat import chat_messages
                if session_id in chat_messages:
                    recent_messages = chat_messages[session_id][-10:]  # Last 10 messages
                    
                    for message in reversed(recent_messages):  # Most recent first
                        if message.get("agent") == "smartsheet":
                            content = message.get("content", "")
                            
                            # Look for ui-component file-picker data
                            if '<ui-component type="file-picker"' in content:
                                import re
                                import json
                                # Extract JSON data from ui-component
                                pattern = r'<ui-component type="file-picker"[^>]*>\s*(\[.*?\])\s*</ui-component>'
                                match = re.search(pattern, content, re.DOTALL)
                                if match:
                                    try:
                                        files_data = json.loads(match.group(1))
                                        context["available_files"] = files_data
                                        logger.info(f"Loaded {len(files_data)} files from ui-component session context")
                                        
                                        # Also extract sheet ID from ui-component attributes
                                        sheet_match = re.search(r'sheet-id="([^"]+)"', content)
                                        if sheet_match:
                                            context["sheet_id"] = sheet_match.group(1)
                                            logger.info(f"Loaded sheet ID: {context['sheet_id']}")
                                        break
                                    except json.JSONDecodeError as e:
                                        logger.warning(f"Failed to parse ui-component JSON: {e}")
                            
                            # Fallback: Look for hidden JSON data in content (new format)
                            elif "<!-- SMARTSHEET_FILES:" in content:
                                match = re.search(r'<!-- SMARTSHEET_FILES: (.*?) -->', content)
                                if match:
                                    try:
                                        files_data = json.loads(match.group(1))
                                        context["available_files"] = files_data
                                        logger.info(f"Loaded {len(files_data)} files from comment session context")
                                        break
                                    except json.JSONDecodeError:
                                        pass
                            
                            # Look for sheet ID in comments
                            if "<!-- SHEET_ID:" in content:
                                match = re.search(r'<!-- SHEET_ID: (.*?) -->', content)
                                if match:
                                    context["sheet_id"] = match.group(1).strip()
                                    
                return context
                
        except Exception as e:
            logger.warning(f"Failed to load session context: {e}")
            
        return {}
    
    async def process_file_selection(
        self, 
        session_id: str, 
        user_id: str,
        file_selection: Dict[str, Any],
        available_files: List[Dict[str, Any]] = None,
        sheet_id: str = None
    ) -> Optional[Dict[str, Any]]:
        """
        Process file selection with explicit file context (bypasses session loading issues)
        
        Args:
            session_id: Chat session ID
            user_id: User ID
            file_selection: File selection data from frontend
            available_files: List of available files from Smartsheet
            sheet_id: Smartsheet sheet ID
            
        Returns:
            Dict containing response content, agent_type, metadata, etc.
        """
        start_time = time.time()
        
        try:
            # Create message content from file selection
            if file_selection.get("action") == "analyze_all":
                user_message = "analyze all files"
            else:
                files_text = ", ".join(file_selection.get("selected_files", []))
                user_message = f"selected_files: {files_text}"
                
            if file_selection.get("additional_text"):
                user_message += f" - {file_selection['additional_text']}"
            
            logger.info(f"Processing file selection: {user_message}")
            
            # Create app state with file selection context
            app_state = AppState()
            app_state.query = user_message
            app_state.session_id = session_id
            app_state.user_id = user_id
            app_state.status = "awaiting_file_selection"
            
            # Add file context directly to metadata
            app_state.metadata = {
                "file_selection": file_selection,
                "is_file_selection": True,
                "available_files": available_files or [],
                "sheet_id": sheet_id
            }
            
            logger.info(f"File selection context: {len(available_files or [])} files, sheet_id: {sheet_id}")
            
            # Process through manager agent
            result_state = await self.manager_agent.process(app_state)
            
            # Check if SmartsheetAgent has prepared files for analysis
            if result_state.status == "files_ready_for_analysis" and result_state.files:
                logger.info(f"Files ready for analysis - triggering full pipeline with {len(result_state.files)} files")
                
                # Set state to trigger full analysis pipeline with proper context
                result_state.status = "files_uploaded"
                result_state.query = f"Analyze {len(result_state.files)} construction documents for cost estimation"
                
                # Clear pending user action since we're proceeding automatically
                result_state.pending_user_action = None
                
                # Ensure metadata indicates this is a continuation of the pipeline
                if not result_state.metadata:
                    result_state.metadata = {}
                result_state.metadata["pipeline_continuation"] = True
                result_state.metadata["original_file_selection"] = file_selection
                result_state.metadata["analysis_triggered"] = True
                
                logger.info(f"Starting full analysis pipeline for {len(result_state.files)} files")
                
                # Run through full ManagerAgent pipeline for file analysis
                result_state = await self.manager_agent.process(result_state)
                
                logger.info(f"Full pipeline completed. Status: {result_state.status}, Error: {result_state.error}")
                
                # If the pipeline completed successfully, ensure we have a good final response
                if not result_state.error and (result_state.estimate or result_state.takeoff_data):
                    logger.info("Pipeline completed successfully with results")
            
            # Extract response
            response_content = self._extract_agent_response(result_state)
            agent_type = self._determine_agent_type(result_state)
            
            return {
                "content": response_content,
                "agent_type": agent_type,
                "model": "gpt-4o-mini",
                "token_cost": 75,
                "processing_time": int((time.time() - start_time) * 1000),
                "confidence": 0.95,
                "sources": ["file_selection", "smartsheet_agent"],
                "metadata": {
                    "file_selection": file_selection,
                    "files_processed": len(available_files or []),
                    "status": result_state.status
                }
            }
            
        except Exception as e:
            logger.error(f"Error processing file selection: {e}")
            return {
                "content": f"Error processing file selection: {str(e)}",
                "agent_type": "system",
                "model": "fallback",
                "token_cost": 0,
                "processing_time": int((time.time() - start_time) * 1000),
                "confidence": 0.5,
                "sources": ["error_handling"]
            }
