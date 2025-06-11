# Chat management routes for PIP AI application
# Handles chat sessions, messages, and real-time communication
# Enhanced with Real-Time Streaming Support for Manager Decisions and Agent Progress

from fastapi import APIRouter, HTTPException, WebSocket, WebSocketDisconnect, Form, File, UploadFile
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
import json
import uuid
import logging
from backend.services.agent_router import AgentRouter

# Set up logging
logger = logging.getLogger(__name__)

router = APIRouter()

# ===== ENHANCED STREAMING MESSAGE TYPES =====

class ManagerThinkingMessage(BaseModel):
    """Manager's real-time thinking process"""
    type: str = "manager_thinking"
    session_id: str
    timestamp: str
    data: Dict[str, Any]

class AgentSubstepMessage(BaseModel):
    """Granular agent progress updates"""
    type: str = "agent_substep"
    session_id: str
    timestamp: str
    data: Dict[str, Any]

class UserDecisionMessage(BaseModel):
    """Interactive user decision requests"""
    type: str = "user_decision_needed"
    session_id: str
    timestamp: str
    data: Dict[str, Any]

class WorkflowStateMessage(BaseModel):
    """Visual workflow pipeline representation"""
    type: str = "workflow_state_change"
    session_id: str
    timestamp: str
    data: Dict[str, Any]

class BrainAllocationMessage(BaseModel):
    """Manager's LLM model allocation decisions"""
    type: str = "brain_allocation"
    session_id: str
    timestamp: str
    data: Dict[str, Any]

class ErrorRecoveryMessage(BaseModel):
    """Error handling and recovery status"""
    type: str = "error_recovery"
    session_id: str
    timestamp: str
    data: Dict[str, Any]

class AgentConversationMessage(BaseModel):
    """Agent-to-agent conversation messages"""
    type: str = "agent_conversation"
    session_id: str
    timestamp: str
    data: Dict[str, Any]

# ===== EXISTING MESSAGE TYPES =====

# Pydantic models for request/response
class ChatSessionCreate(BaseModel):
    name: str
    project_id: Optional[str] = None

class ChatSessionUpdate(BaseModel):
    name: Optional[str] = None
    project_id: Optional[str] = None
    status: Optional[str] = None

class ChatSessionResponse(BaseModel):
    id: str
    name: str
    project_id: Optional[str]
    user_id: str
    created_at: str
    updated_at: str
    status: str = "active"

class ChatMessageCreate(BaseModel):
    content: str

class ChatMessageResponse(BaseModel):
    id: str
    content: str
    role: str = "user"
    timestamp: str
    session_id: str
    user_id: str
    agent_type: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None

class ChatMessagesResponse(BaseModel):
    user_message: ChatMessageResponse
    agent_response: Optional[ChatMessageResponse] = None

class ChatMessageWithAgent(BaseModel):
    content: str
    agent_type: Optional[str] = None

class FileAnalysisRequest(BaseModel):
    file_id: str
    instructions: Optional[str] = None

class FileSelectionRequest(BaseModel):
    selected_files: List[str]
    action: str = "analyze_selected"  # analyze_selected, analyze_all, cancel
    additional_text: Optional[str] = None
    sheet_id: Optional[str] = None
    available_files: Optional[List[Dict[str, Any]]] = None  # Include file context

# In-memory storage for demo purposes
# In production, this should be replaced with a proper database
chat_sessions: Dict[str, Dict[str, Any]] = {}
chat_messages: Dict[str, List[Dict[str, Any]]] = {}
websocket_connections: Dict[str, WebSocket] = {}

# Initialize agent router
agent_router = AgentRouter()

# Helper functions
def get_current_user_id() -> str:
    """Get current user ID - placeholder for actual auth"""
    return "user_123"  # TODO: Implement proper authentication

def create_session_id() -> str:
    return str(uuid.uuid4())

def create_message_id() -> str:
    return str(uuid.uuid4())

def get_current_timestamp() -> str:
    return datetime.now(timezone.utc).isoformat()

# Chat session endpoints
@router.get("/sessions", response_model=List[ChatSessionResponse])
async def get_chat_sessions(project_id: Optional[str] = None):
    """Get all chat sessions, optionally filtered by project"""
    try:
        user_id = get_current_user_id()
        sessions: List[ChatSessionResponse] = []
        
        for session_data in chat_sessions.values():
            if session_data.get("user_id") == user_id:
                if project_id is None or session_data.get("project_id") == project_id:
                    sessions.append(ChatSessionResponse(**session_data))
        
        return sessions
    except Exception as e:
        logger.error(f"Error getting chat sessions: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve chat sessions")

@router.get("/sessions/{session_id}", response_model=ChatSessionResponse)
async def get_chat_session(session_id: str):
    """Get a specific chat session"""
    try:
        if session_id not in chat_sessions:
            raise HTTPException(status_code=404, detail="Chat session not found")
        
        session_data = chat_sessions[session_id]
        user_id = get_current_user_id()
        
        if session_data.get("user_id") != user_id:
            raise HTTPException(status_code=403, detail="Access denied")
        
        return ChatSessionResponse(**session_data)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting chat session {session_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve chat session")

@router.post("/sessions", response_model=ChatSessionResponse)
async def create_chat_session(session: ChatSessionCreate):
    """Create a new chat session"""
    try:
        session_id = create_session_id()
        user_id = get_current_user_id()
        timestamp = get_current_timestamp()
        
        session_data: Dict[str, Any] = {
            "id": session_id,
            "name": session.name,
            "project_id": session.project_id,
            "user_id": user_id,
            "created_at": timestamp,
            "updated_at": timestamp,
            "status": "active"
        }
        
        chat_sessions[session_id] = session_data
        chat_messages[session_id] = []
        
        return ChatSessionResponse(**session_data)
    except Exception as e:
        logger.error(f"Error creating chat session: {e}")
        raise HTTPException(status_code=500, detail="Failed to create chat session")

@router.put("/sessions/{session_id}", response_model=ChatSessionResponse)
async def update_chat_session(session_id: str, updates: ChatSessionUpdate):
    """Update a chat session"""
    try:
        if session_id not in chat_sessions:
            raise HTTPException(status_code=404, detail="Chat session not found")
        
        session_data = chat_sessions[session_id]
        user_id = get_current_user_id()
        
        if session_data.get("user_id") != user_id:
            raise HTTPException(status_code=403, detail="Access denied")
        
        # Update session data only for provided fields
        if updates.name is not None:
            session_data["name"] = updates.name
        if updates.project_id is not None:
            session_data["project_id"] = updates.project_id
        if updates.status is not None:
            session_data["status"] = updates.status
        session_data["updated_at"] = get_current_timestamp()
        
        chat_sessions[session_id] = session_data
        
        return ChatSessionResponse(**session_data)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating chat session {session_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to update chat session")

@router.delete("/sessions/{session_id}")
async def delete_chat_session(session_id: str):
    """Delete a chat session"""
    try:
        if session_id not in chat_sessions:
            raise HTTPException(status_code=404, detail="Chat session not found")
        
        session_data = chat_sessions[session_id]
        user_id = get_current_user_id()
        
        if session_data.get("user_id") != user_id:
            raise HTTPException(status_code=403, detail="Access denied")
        
        # Delete session and associated messages
        del chat_sessions[session_id]
        if session_id in chat_messages:
            del chat_messages[session_id]
        
        return JSONResponse({"message": "Chat session deleted successfully"})
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting chat session {session_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete chat session")

# Chat message endpoints
@router.get("/sessions/{session_id}/messages", response_model=List[ChatMessageResponse])
async def get_chat_messages(session_id: str):
    """Get all messages for a chat session"""
    try:
        if session_id not in chat_sessions:
            raise HTTPException(status_code=404, detail="Chat session not found")
        
        session_data = chat_sessions[session_id]
        user_id = get_current_user_id()
        
        if session_data.get("user_id") != user_id:
            raise HTTPException(status_code=403, detail="Access denied")
        
        messages = chat_messages.get(session_id, [])
        return [ChatMessageResponse(**msg) for msg in messages]
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting messages for session {session_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve messages")

@router.post("/sessions/{session_id}/messages", response_model=ChatMessagesResponse)
async def send_chat_message(session_id: str, message: ChatMessageCreate):
    """Send a message to a chat session"""
    try:
        if session_id not in chat_sessions:
            raise HTTPException(status_code=404, detail="Chat session not found")
        
        session_data = chat_sessions[session_id]
        user_id = get_current_user_id()
        
        if session_data.get("user_id") != user_id:
            raise HTTPException(status_code=403, detail="Access denied")
        
        message_id = create_message_id()
        timestamp = get_current_timestamp()
        
        message_data: Dict[str, Any] = {
            "id": message_id,
            "content": message.content,
            "role": "user",
            "timestamp": timestamp,
            "session_id": session_id,
            "user_id": user_id,
            "metadata": {}
        }
        
        # Add message to storage
        if session_id not in chat_messages:
            chat_messages[session_id] = []
        chat_messages[session_id].append(message_data)
        
        # Update session timestamp
        chat_sessions[session_id]["updated_at"] = timestamp
        
        # Send WebSocket notification for user message
        await broadcast_message(session_id, {
            "type": "chat_message",
            "session_id": session_id,
            "data": message_data,
            "timestamp": timestamp
        })
        
        # Initialize response with user message
        response = ChatMessagesResponse(
            user_message=ChatMessageResponse(**message_data)
        )
        
        # Process message with AI agent and generate response
        try:
            # Import agent router here to avoid circular imports
            from backend.services.agent_router import AgentRouter
            
            # Initialize agent router
            agent_router = AgentRouter()
            
            # Process the user message and get agent response
            agent_response = await agent_router.process_user_message(
                session_id=session_id,
                user_message=message.content,
                user_id=user_id
            )
            
            if agent_response:
                # Create agent response message
                agent_message_id = create_message_id()
                agent_timestamp = get_current_timestamp()
                
                agent_message_data: Dict[str, Any] = {
                    "id": agent_message_id,
                    "content": agent_response.get("content", ""),
                    "role": "assistant",
                    "timestamp": agent_timestamp,
                    "session_id": session_id,
                    "user_id": user_id,
                    "agent_type": agent_response.get("agent_type", "manager"),
                    "metadata": {
                        "model": agent_response.get("model", "gpt-4-turbo"),
                        "token_cost": agent_response.get("token_cost", 0),
                        "processing_time": agent_response.get("processing_time", 0),
                        "confidence": agent_response.get("confidence", 0.85),
                        "sources": agent_response.get("sources", ["internal_knowledge"])
                    }
                }
                
                # Add agent message to storage
                chat_messages[session_id].append(agent_message_data)
                
                # Add agent response to return data
                response.agent_response = ChatMessageResponse(**agent_message_data)
                
                # Send WebSocket notification for agent response
                await broadcast_message(session_id, {
                    "type": "chat_message",
                    "session_id": session_id,
                    "data": agent_message_data,
                    "timestamp": agent_timestamp
                })
        
        except Exception as agent_error:
            logger.error(f"Agent processing error: {agent_error}")
            # Send fallback response
            fallback_message_id = create_message_id()
            fallback_timestamp = get_current_timestamp()
            
            fallback_message_data: Dict[str, Any] = {
                "id": fallback_message_id,
                "content": "I'm processing your request. Let me analyze this and get back to you with detailed insights.",
                "role": "assistant",
                "timestamp": fallback_timestamp,
                "session_id": session_id,
                "user_id": user_id,
                "agent_type": "manager",
                "metadata": {
                    "model": "fallback",
                    "token_cost": 0,
                    "processing_time": 100,
                    "confidence": 0.7,
                    "sources": ["system"]
                }
            }
            
            chat_messages[session_id].append(fallback_message_data)
            
            # Add fallback response to return data
            response.agent_response = ChatMessageResponse(**fallback_message_data)
            
            await broadcast_message(session_id, {
                "type": "chat_message", 
                "session_id": session_id,
                "data": fallback_message_data,
                "timestamp": fallback_timestamp
            })
        
        return response
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error sending message to session {session_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to send message")

@router.post("/sessions/{session_id}/agent", response_model=ChatMessageResponse)
async def send_message_to_agent(session_id: str, message: ChatMessageWithAgent):
    """Send a message to a specific agent"""
    try:
        if session_id not in chat_sessions:
            raise HTTPException(status_code=404, detail="Chat session not found")
        
        session_data = chat_sessions[session_id]
        user_id = get_current_user_id()
        
        if session_data.get("user_id") != user_id:
            raise HTTPException(status_code=403, detail="Access denied")
        
        # TODO: Route message to specific agent based on agent_type
        agent_type = message.agent_type or "general"
        
        message_id = create_message_id()
        timestamp = get_current_timestamp()
        
        message_data: Dict[str, Any] = {
            "id": message_id,
            "content": message.content,
            "role": "user",
            "timestamp": timestamp,
            "session_id": session_id,
            "user_id": user_id,
            "metadata": {"agent_type": agent_type}
        }
        
        # Add message to storage
        if session_id not in chat_messages:
            chat_messages[session_id] = []
        chat_messages[session_id].append(message_data)
        
        # TODO: Process with specific agent and add response
        
        return ChatMessageResponse(**message_data)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error sending message to agent for session {session_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to send message to agent")

@router.post("/sessions/{session_id}/analyze", response_model=ChatMessageResponse)
async def analyze_file_in_chat(session_id: str, request: FileAnalysisRequest):
    """Analyze a file within a chat session"""
    try:
        if session_id not in chat_sessions:
            raise HTTPException(status_code=404, detail="Chat session not found")
        
        session_data = chat_sessions[session_id]
        user_id = get_current_user_id()
        
        if session_data.get("user_id") != user_id:
            raise HTTPException(status_code=403, detail="Access denied")
        
        # TODO: Integrate with existing file analysis from api.py
        
        message_id = create_message_id()
        timestamp = get_current_timestamp()
        
        message_data: Dict[str, Any] = {
            "id": message_id,
            "content": f"Analyzing file {request.file_id}...",
            "role": "assistant",
            "timestamp": timestamp,
            "session_id": session_id,
            "user_id": user_id,
            "metadata": {
                "file_id": request.file_id,
                "instructions": request.instructions,
                "type": "file_analysis"
            }
        }
        
        # Add message to storage
        if session_id not in chat_messages:
            chat_messages[session_id] = []
        chat_messages[session_id].append(message_data)
        
        return ChatMessageResponse(**message_data)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error analyzing file in session {session_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to analyze file")

# File selection endpoint for interactive UI
@router.post("/sessions/{session_id}/file-selection")
async def submit_file_selection(
    session_id: str,
    file_selection: FileSelectionRequest,
    user_id: str = "default_user"
) -> JSONResponse:
    """Handle interactive file selection from frontend checkbox UI"""
    try:
        # Validate session exists
        if session_id not in chat_sessions:
            raise HTTPException(status_code=404, detail="Chat session not found")
        
        # Import agent router
        from backend.services.agent_router import AgentRouter
        agent_router = AgentRouter()
        
        # Extract file context from the last Smartsheet message in this session
        available_files = []
        sheet_id = None
        
        # Look for Smartsheet context in recent messages
        if session_id in chat_messages:
            recent_messages = chat_messages[session_id][-10:]  # Last 10 messages
            
            for message in reversed(recent_messages):  # Most recent first
                if message.get("agent_type") == "smartsheet":
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
                                available_files = json.loads(match.group(1))
                                logger.info(f"Extracted {len(available_files)} files from recent Smartsheet message")
                                
                                # Also extract sheet ID from ui-component attributes
                                sheet_match = re.search(r'sheet-id="([^"]+)"', content)
                                if sheet_match:
                                    sheet_id = sheet_match.group(1)
                                    logger.info(f"Extracted sheet ID: {sheet_id}")
                                break
                            except json.JSONDecodeError as e:
                                logger.warning(f"Failed to parse ui-component JSON: {e}")
        
        if not available_files:
            logger.warning("No available files found in session - file selection may fail")
        
        # Process file selection with explicit context
        agent_response = await agent_router.process_file_selection(
            session_id=session_id,
            user_id=user_id,
            file_selection=file_selection.model_dump(),
            available_files=available_files or [],
            sheet_id=sheet_id or ""
        )
        
        if agent_response:
            # Create message content for logging
            if file_selection.action == "analyze_all":
                message_content = "analyze all files"
            else:
                files_text = ", ".join(file_selection.selected_files)
                message_content = f"selected_files: {files_text}"
                
            if file_selection.additional_text:
                message_content += f" - {file_selection.additional_text}"
            
            # Store the selection message
            message_id = create_message_id()
            timestamp = get_current_timestamp()
            
            selection_message = {
                "id": message_id,
                "content": message_content,
                "role": "user",
                "timestamp": timestamp,
                "session_id": session_id,
                "user_id": user_id,
                "metadata": {
                    "file_selection": file_selection.model_dump(),
                    "is_file_selection": True
                }
            }
            
            # Store user selection message
            if session_id not in chat_messages:
                chat_messages[session_id] = []
            chat_messages[session_id].append(selection_message)
            
            # Store agent response
            agent_message_id = create_message_id()
            agent_timestamp = get_current_timestamp()
            
            agent_message = {
                "id": agent_message_id,
                "content": agent_response.get("content", ""),
                "role": "assistant",
                "timestamp": agent_timestamp,
                "session_id": session_id,
                "user_id": user_id,
                "agent_type": agent_response.get("agent_type", "smartsheet"),
                "metadata": agent_response.get("metadata", {})
            }
            
            chat_messages[session_id].append(agent_message)
            
            # Update session
            chat_sessions[session_id]["updated_at"] = agent_timestamp
            
            # Broadcast via WebSocket
            await broadcast_message(session_id, {
                "type": "file_selection_processed",
                "session_id": session_id,
                "selection": selection_message,
                "response": agent_message,
                "timestamp": agent_timestamp
            })
            
            return JSONResponse({
                "success": True,
                "selection_message": selection_message,
                "agent_response": agent_message
            })
        
        return JSONResponse({
            "success": False,
            "error": "No agent response generated"
        }, status_code=500)
        
    except Exception as e:
        logger.error(f"Error processing file selection: {e}")
        return JSONResponse({
            "success": False,
            "error": str(e)
        }, status_code=500)

@router.post("/sessions/{session_id}/messages-with-files")
async def send_message_with_files(
    session_id: str,
    content: Optional[str] = Form(None),
    files: Optional[List[UploadFile]] = File(None)
) -> JSONResponse:
    """Send a message with attached files - unified processing endpoint"""
    try:
        if session_id not in chat_sessions:
            raise HTTPException(status_code=404, detail="Chat session not found")
        
        session_data = chat_sessions[session_id]
        user_id = get_current_user_id()
        
        if session_data.get("user_id") != user_id:
            raise HTTPException(status_code=403, detail="Access denied")
        
        # Validate that we have either content or files
        if not content and (not files or len(files) == 0):
            raise HTTPException(status_code=400, detail="Either message content or files must be provided")
        
        message_content = content or "File upload"
        
        # Process uploaded files
        processed_files = []
        if files:
            for uploaded_file in files:
                if uploaded_file.filename:
                    file_content = await uploaded_file.read()
                    processed_files.append({
                        "filename": uploaded_file.filename,
                        "data": file_content,
                        "content_type": uploaded_file.content_type or "application/octet-stream",
                        "size": len(file_content),
                        "metadata": {}
                    })
        
        # Create user message
        message_id = create_message_id()
        timestamp = get_current_timestamp()
        
        user_message_data = {
            "id": message_id,
            "content": message_content,
            "role": "user",
            "timestamp": timestamp,
            "session_id": session_id,
            "user_id": user_id,
            "metadata": {
                "has_files": len(processed_files) > 0,
                "file_count": len(processed_files)
            }
        }
        
        # Add message to storage
        if session_id not in chat_messages:
            chat_messages[session_id] = []
        chat_messages[session_id].append(user_message_data)
        
        # Update session timestamp
        chat_sessions[session_id]["updated_at"] = timestamp
        
        # Send WebSocket notification for user message
        await broadcast_message(session_id, {
            "type": "chat_message",
            "session_id": session_id,
            "data": user_message_data,
            "timestamp": timestamp
        })
        
        # Process with agent pipeline if we have files or content that needs processing
        agent_response = None
        if processed_files or content:
            try:
                # Import agent router
                from backend.services.agent_router import AgentRouter
                from backend.app.schemas import AppState, SchemaFile
                
                # Create AppState with files for agent processing
                app_state = AppState()
                app_state.query = message_content
                app_state.session_id = session_id
                app_state.user_id = user_id
                app_state.status = "files_uploaded" if processed_files else "query_received"
                
                # Convert uploaded files to SchemaFile format
                if processed_files:
                    schema_files = []
                    for file_data in processed_files:
                        schema_file = SchemaFile(
                            filename=file_data["filename"],
                            data=file_data["data"],
                            metadata=file_data["metadata"]
                        )
                        schema_files.append(schema_file)
                    app_state.files = schema_files
                
                # Initialize agent router and process
                agent_router = AgentRouter()
                result_state = await agent_router.manager_agent.process(app_state)
                
                # Extract agent response
                response_content = agent_router._extract_agent_response(result_state)
                agent_type = agent_router._determine_agent_type(result_state)
                
                # Create agent response message
                agent_message_id = create_message_id()
                agent_timestamp = get_current_timestamp()
                
                agent_message_data = {
                    "id": agent_message_id,
                    "content": response_content,
                    "role": "assistant",
                    "timestamp": agent_timestamp,
                    "session_id": session_id,
                    "user_id": user_id,
                    "agent_type": agent_type,
                    "metadata": {
                        "files_processed": len(processed_files),
                        "processing_status": result_state.status,
                        "model": "gpt-4o-mini",
                        "confidence": 0.9
                    }
                }
                
                # Add agent message to storage
                chat_messages[session_id].append(agent_message_data)
                
                # Send WebSocket notification for agent response
                await broadcast_message(session_id, {
                    "type": "chat_message",
                    "session_id": session_id,
                    "data": agent_message_data,
                    "timestamp": agent_timestamp
                })
                
                agent_response = agent_message_data
                
            except Exception as agent_error:
                logger.error(f"Agent processing error: {agent_error}")
                # Create fallback response
                fallback_message_id = create_message_id()
                fallback_timestamp = get_current_timestamp()
                
                fallback_content = f"I've received your message"
                if processed_files:
                    fallback_content += f" with {len(processed_files)} file(s)"
                fallback_content += ". I'm processing this information and will provide detailed insights shortly."
                
                fallback_message_data = {
                    "id": fallback_message_id,
                    "content": fallback_content,
                    "role": "assistant",
                    "timestamp": fallback_timestamp,
                    "session_id": session_id,
                    "user_id": user_id,
                    "agent_type": "manager",
                    "metadata": {
                        "files_received": len(processed_files),
                        "model": "fallback",
                        "confidence": 0.7
                    }
                }
                
                chat_messages[session_id].append(fallback_message_data)
                
                await broadcast_message(session_id, {
                    "type": "chat_message",
                    "session_id": session_id,
                    "data": fallback_message_data,
                    "timestamp": fallback_timestamp
                })
                
                agent_response = fallback_message_data
        
        # Return response
        return JSONResponse({
            "success": True,
            "user_message": user_message_data,
            "agent_response": agent_response,
            "files_processed": len(processed_files)
        })
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error sending message with files: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to send message with files: {str(e)}")

# ===== ENHANCED WEBSOCKET BROADCASTING =====

async def broadcast_manager_thinking(session_id: str, thinking_data: Dict[str, Any]):
    """
    🧠 Broadcast manager's thinking process in real-time
    """
    message = ManagerThinkingMessage(
        session_id=session_id,
        timestamp=datetime.now(timezone.utc).isoformat(),
        data=thinking_data
    )
    await broadcast_message(session_id, message.model_dump())

async def broadcast_agent_substep(session_id: str, agent_name: str, substep: str, 
                                progress_pct: float, details: Optional[Dict[str, Any]] = None):
    """
    📊 Broadcast granular agent progress
    """
    substep_data = {
        "agent_name": agent_name,
        "substep": substep,
        "progress_percentage": progress_pct,
        "details": details or {},
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    
    message = AgentSubstepMessage(
        session_id=session_id,
        timestamp=datetime.now(timezone.utc).isoformat(),
        data=substep_data
    )
    await broadcast_message(session_id, message.model_dump())

async def broadcast_user_decision_needed(session_id: str, decision_context: Dict[str, Any]):
    """
    🤔 Broadcast when user input is required
    """
    message = UserDecisionMessage(
        session_id=session_id,
        timestamp=datetime.now(timezone.utc).isoformat(),
        data=decision_context
    )
    await broadcast_message(session_id, message.model_dump())

async def broadcast_workflow_state_change(session_id: str, change_type: str, workflow_data: Dict[str, Any]):
    """
    🎯 Broadcast workflow state changes for visual representation
    """
    state_data = {
        "change_type": change_type,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        **workflow_data
    }
    
    message = WorkflowStateMessage(
        session_id=session_id,
        timestamp=datetime.now(timezone.utc).isoformat(),
        data=state_data
    )
    await broadcast_message(session_id, message.model_dump())

async def broadcast_brain_allocation(session_id: str, agent_name: str, allocation_data: Dict[str, Any]):
    """
    🤖 Broadcast manager's LLM model allocation decisions
    """
    brain_data = {
        "agent_name": agent_name,
        "allocation_timestamp": datetime.now(timezone.utc).isoformat(),
        **allocation_data
    }
    
    message = BrainAllocationMessage(
        session_id=session_id,
        timestamp=datetime.now(timezone.utc).isoformat(),
        data=brain_data
    )
    await broadcast_message(session_id, message.model_dump())

async def broadcast_error_recovery(session_id: str, error_data: Dict[str, Any]):
    """
    🚨 Broadcast error recovery status
    """
    message = ErrorRecoveryMessage(
        session_id=session_id,
        timestamp=datetime.now(timezone.utc).isoformat(),
        data=error_data
    )
    await broadcast_message(session_id, message.model_dump())

async def broadcast_agent_conversation(session_id: str, agent_name: str, content: str, 
                                     message_type: str = "thinking", target_agent: str = None,
                                     metadata: Optional[Dict[str, Any]] = None):
    """
    💬 Broadcast agent-to-agent conversation messages for gorgeous streaming
    """
    conversation_data = {
        "id": str(uuid.uuid4()),
        "agent": agent_name,
        "content": content,
        "timestamp": datetime.now(timezone.utc),
        "type": message_type,  # thinking, action, result, handoff
        "target_agent": target_agent,
        "metadata": metadata or {}
    }
    
    message = AgentConversationMessage(
        session_id=session_id,
        timestamp=datetime.now(timezone.utc).isoformat(),
        data=conversation_data
    )
    await broadcast_message(session_id, message.model_dump())

# ===== ENHANCED WEBSOCKET ENDPOINT =====

@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """Enhanced WebSocket endpoint for real-time communication with streaming support"""
    connection_id = str(uuid.uuid4())
    try:
        await websocket.accept()
        websocket_connections[connection_id] = websocket
        
        logger.info(f"Enhanced WebSocket connection established: {connection_id}")
        
        # Send initial connection confirmation with streaming capabilities
        await websocket.send_text(json.dumps({
            "type": "connection_established",
            "connection_id": connection_id,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "streaming_features": [
                "manager_thinking",
                "agent_substeps", 
                "user_decisions",
                "workflow_visualization",
                "brain_allocation",
                "error_recovery"
            ]
        }))
        
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            
            logger.info(f"Enhanced WebSocket message received: {message.get('type', 'unknown')}")
            
            # Handle different message types including enhanced streaming
            message_type = message.get("type")
            
            if message_type == "typing_indicator":
                await broadcast_typing(message.get("session_id"), message.get("is_typing", False))
            elif message_type == "ping":
                await websocket.send_text(json.dumps({"type": "pong"}))
            elif message_type == "user_decision_response":
                # Handle user responses to decision prompts
                await handle_user_decision_response(message)
            elif message_type == "request_workflow_status":
                # Send current workflow status
                await send_workflow_status(websocket, message.get("session_id"))
            elif message_type == "subscribe_to_agent":
                # Subscribe to specific agent updates
                await handle_agent_subscription(websocket, message)
            
    except WebSocketDisconnect:
        logger.info(f"Enhanced WebSocket disconnected: {connection_id}")
        if connection_id in websocket_connections:
            del websocket_connections[connection_id]
    except Exception as e:
        logger.error(f"Enhanced WebSocket error: {e}")
        if connection_id in websocket_connections:
            del websocket_connections[connection_id]
        try:
            await websocket.close()
        except:
            pass

# ===== ENHANCED WEBSOCKET HANDLERS =====

async def handle_user_decision_response(message: Dict[str, Any]):
    """Handle user responses to interactive decision prompts"""
    session_id = message.get("session_id")
    decision_id = message.get("decision_id")
    response = message.get("response")
    
    if not session_id:
        logger.warning("No session_id in user decision response")
        return
    
    logger.info(f"User decision response received: session={session_id}, decision={decision_id}, response={response}")
    
    # TODO: Route response to appropriate agent/manager
    # For now, just broadcast acknowledgment
    await broadcast_message(session_id, {
        "type": "decision_response_acknowledged",
        "decision_id": decision_id,
        "response": response,
        "timestamp": datetime.now(timezone.utc).isoformat()
    })

async def send_workflow_status(websocket: WebSocket, session_id: Optional[str]):
    """Send current workflow status to requesting client"""
    if not session_id:
        return
        
    # TODO: Implement actual workflow status retrieval
    status: Dict[str, Any] = {
        "type": "workflow_status",
        "session_id": session_id,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "data": {
            "current_phase": "processing",
            "active_agents": [],
            "completion_percentage": 0.0,
            "estimated_completion": "calculating..."
        }
    }
    
    await websocket.send_text(json.dumps(status))

async def handle_agent_subscription(websocket: WebSocket, message: Dict[str, Any]):
    """Handle subscription to specific agent updates"""
    agent_name = message.get("agent_name")
    session_id = message.get("session_id")
    
    logger.info(f"Agent subscription request: agent={agent_name}, session={session_id}")
    
    # TODO: Implement agent-specific subscription logic
    response = {
        "type": "agent_subscription_confirmed",
        "agent_name": agent_name,
        "session_id": session_id,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    
    await websocket.send_text(json.dumps(response))

# Utility functions for WebSocket broadcasting
async def broadcast_message(session_id: str, message: Dict[str, Any]):
    """Broadcast a message to all connected clients"""
    # Create a snapshot of connections to avoid iteration issues
    connections_snapshot = list(websocket_connections.values())
    for connection in connections_snapshot:
        try:
            await connection.send_text(json.dumps(message))
        except Exception as e:
            logger.error(f"Error broadcasting message: {e}")

async def broadcast_typing(session_id: str, is_typing: bool):
    """Broadcast typing indicator"""
    message: Dict[str, Any] = {
        "type": "typing_indicator",
        "session_id": session_id,
        "is_typing": is_typing,
        "timestamp": get_current_timestamp()
    }
    
    for connection in websocket_connections.values():
        try:
            await connection.send_text(json.dumps(message))
        except Exception as e:
            logger.error(f"Error broadcasting typing indicator: {e}")

# Search and stats endpoints
@router.get("/chat/search", response_model=List[ChatMessageResponse])
async def search_messages(query: str, session_id: Optional[str] = None, project_id: Optional[str] = None):
    """Search messages across chat sessions"""
    try:
        user_id = get_current_user_id()
        results: List[ChatMessageResponse] = []
        
        for sess_id, messages in chat_messages.items():
            session_data = chat_sessions.get(sess_id)
            if not session_data or session_data.get("user_id") != user_id:
                continue
            
            # Filter by session_id if provided
            if session_id and sess_id != session_id:
                continue
                
            # Filter by project_id if provided
            if project_id and session_data.get("project_id") != project_id:
                continue
            
            # Search in message content
            for message in messages:
                if query.lower() in message.get("content", "").lower():
                    results.append(ChatMessageResponse(**message))
        
        return results
    except Exception as e:
        logger.error(f"Error searching messages: {e}")
        raise HTTPException(status_code=500, detail="Failed to search messages")

@router.get("/chat/stats")
async def get_chat_stats(session_id: Optional[str] = None) -> Dict[str, Any]:
    """Get chat statistics"""
    try:
        user_id = get_current_user_id()
        
        if session_id:
            # Stats for specific session
            if session_id not in chat_sessions:
                raise HTTPException(status_code=404, detail="Chat session not found")
            
            session_data = chat_sessions[session_id]
            if session_data.get("user_id") != user_id:
                raise HTTPException(status_code=403, detail="Access denied")
            
            messages = chat_messages.get(session_id, [])
            return {
                "session_id": session_id,
                "total_messages": len(messages),
                "user_messages": len([m for m in messages if m.get("role") == "user"]),
                "assistant_messages": len([m for m in messages if m.get("role") == "assistant"]),
                "created_at": session_data.get("created_at"),
                "updated_at": session_data.get("updated_at")
            }
        else:
            # Overall stats
            user_sessions = [s for s in chat_sessions.values() if s.get("user_id") == user_id]
            total_messages = sum(len(chat_messages.get(s["id"], [])) for s in user_sessions)
            
            return {
                "total_sessions": len(user_sessions),
                "total_messages": total_messages,
                "active_sessions": len([s for s in user_sessions if s.get("status") == "active"]),
                "avg_messages_per_session": total_messages / len(user_sessions) if user_sessions else 0
            }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting chat stats: {e}")
        raise HTTPException(status_code=500, detail="Failed to get chat statistics")
