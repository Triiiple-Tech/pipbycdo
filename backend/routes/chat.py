# Chat management routes for PIP AI application
# Handles chat sessions, messages, and real-time communication

from fastapi import APIRouter, HTTPException, WebSocket, WebSocketDisconnect
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

class ChatMessageWithAgent(BaseModel):
    content: str
    agent_type: Optional[str] = None

class FileAnalysisRequest(BaseModel):
    file_id: str
    instructions: Optional[str] = None

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

@router.post("/sessions/{session_id}/messages", response_model=ChatMessageResponse)
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
            "data": message_data,
            "timestamp": timestamp
        })
        
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
                
                # Send WebSocket notification for agent response
                await broadcast_message(session_id, {
                    "type": "chat_message",
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
            
            await broadcast_message(session_id, {
                "type": "chat_message", 
                "data": fallback_message_data,
                "timestamp": fallback_timestamp
            })
        
        return ChatMessageResponse(**message_data)
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

# WebSocket endpoint for real-time communication
@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for real-time chat communication"""
    await websocket.accept()
    connection_id = str(uuid.uuid4())
    websocket_connections[connection_id] = websocket
    
    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            
            # Handle different message types
            if message.get("type") == "typing_indicator":
                await broadcast_typing(message.get("session_id"), message.get("is_typing", False))
            
    except WebSocketDisconnect:
        if connection_id in websocket_connections:
            del websocket_connections[connection_id]
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        if connection_id in websocket_connections:
            del websocket_connections[connection_id]

# Utility functions for WebSocket broadcasting
async def broadcast_message(session_id: str, message: Dict[str, Any]):
    """Broadcast a message to all connected clients"""
    for connection in websocket_connections.values():
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
