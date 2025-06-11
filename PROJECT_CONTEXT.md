# PIP AI - Project Context for Cursor Background Agents
*Last Updated: June 11, 2025*

## 🎯 Current System Status: **PRODUCTION READY WITH ACTIVE ISSUES**

### ✅ What's Working Perfectly
- **Backend**: FastAPI server running on port 8000 ✅
- **Frontend**: Next.js app running on port 3000 ✅
- **WebSocket**: Real-time communication operational ✅
- **Supabase**: Database integration working ✅
- **Authentication**: Internal API auth configured ✅
- **Agent Pipeline**: All 7 agents implemented and functional ✅
- **Smartsheet Integration**: Basic connectivity established ✅

### 🚨 Critical Issues to Fix

#### 1. **File Upload Disconnect** (HIGH PRIORITY)
**Problem**: Files uploaded via drag-drop or file picker aren't processed by the agent pipeline
**Root Cause**: File uploads use `/api/files/upload` but chat messages use separate endpoint
**Impact**: Users can upload files but they don't get analyzed by AI agents
**Files Involved**:
- `pip-ui/components/enhanced-chat-interface.tsx` (lines 491-656)
- `backend/routes/chat.py` (lines 288-424)
- `backend/routes/files.py` (entire file)

#### 2. **Smartsheet Pipeline Break** (HIGH PRIORITY)  
**Problem**: After Smartsheet file selection, the system doesn't trigger full analysis pipeline
**Root Cause**: File selection handler doesn't properly continue to agent processing
**Impact**: Smartsheet integration works but files aren't analyzed
**Files Involved**:
- `backend/services/agent_router.py` (lines 517-656)
- `pip-ui/components/chat/FileSelectionCard.tsx`
- `backend/routes/chat.py` (lines 517-656)

### 🔧 Recent Fixes Applied
- ✅ Fixed syntax error in `agent_router.py` (unclosed parenthesis)
- ✅ Added unified message+files endpoint in `chat.py`
- ✅ Configured proper environment variables and paths
- ✅ Set up comprehensive Cursor configuration

## 🏗️ System Architecture Overview

### Backend Stack
```
FastAPI (Python 3.13)
├── 7 AI Agents (Autonomous Pipeline)
├── WebSocket (Real-time Communication)  
├── Supabase (Database)
├── OpenAI Integration (GPT-4o/o1/o3)
└── Smartsheet API
```

### Frontend Stack
```
Next.js 15 (TypeScript)
├── shadcn/ui Components
├── Tailwind CSS
├── Framer Motion
├── WebSocket Client
└── Custom API Hooks
```

### Data Flow (Current Issue)
```
User Uploads File → File Storage → ❌ DISCONNECT ❌ → Agent Pipeline
User Sends Message → Chat Handler → ✅ Agent Processing ✅
Smartsheet URL → File Selection → ❌ PIPELINE BREAK ❌
```

### Data Flow (Target Fix)
```
User Uploads File → Unified Handler → ✅ Agent Pipeline ✅
User Sends Message → Unified Handler → ✅ Agent Pipeline ✅  
Smartsheet URL → File Selection → ✅ Full Analysis ✅
```

## 🧠 Agent Pipeline (Working Correctly)
1. **ManagerAgent**: Routes and orchestrates workflow
2. **FileReaderAgent**: Extracts text/data from files
3. **TradeMapperAgent**: Categorizes construction trades
4. **ScopeAgent**: Identifies scope items and specifications
5. **TakeoffAgent**: Calculates quantities and measurements
6. **EstimatorAgent**: Generates cost estimates
7. **SmartsheetAgent**: Handles Smartsheet integration

## 📁 Key Files for Background Agents

### Frontend Issues
```typescript
// pip-ui/components/enhanced-chat-interface.tsx
// ISSUE: handleSend() uploads files separately, doesn't send to agent pipeline
// FIX NEEDED: Use unified endpoint for messages+files

// pip-ui/hooks/useApi.ts  
// ISSUE: uploadFiles() and sendMessage() are separate
// FIX NEEDED: Create unified hook for message+files

// pip-ui/components/chat/FileSelectionCard.tsx
// ISSUE: File selection doesn't trigger full pipeline
// FIX NEEDED: Ensure selection continues to analysis
```

### Backend Issues
```python
# backend/routes/chat.py
# RECENT FIX: Added send_message_with_files() endpoint (lines 425-600)
# NEED: Connect frontend to use this new endpoint

# backend/services/agent_router.py  
# ISSUE: process_file_selection() doesn't trigger full pipeline
# FIX NEEDED: Ensure file selection continues to analysis

# backend/routes/files.py
# ISSUE: File upload endpoint is isolated
# FIX NEEDED: Integrate with agent pipeline
```

## 🔄 WebSocket Message Types (Working)
- `chat_message`: User/agent messages ✅
- `manager_thinking`: Real-time agent decisions ✅
- `agent_substep`: Progress updates ✅
- `workflow_state_change`: Pipeline changes ✅
- `file_selection_processed`: File selection results ✅

## 🌐 API Endpoints (Current)
```
✅ GET  /api/health              # System health check
✅ POST /api/chat/sessions       # Create chat session  
✅ POST /api/chat/sessions/{id}/messages  # Send message (text only)
🆕 POST /api/chat/sessions/{id}/messages-with-files  # NEW: Message + files
✅ POST /api/files/upload        # File upload (isolated)
✅ POST /api/chat/sessions/{id}/file-selection  # Smartsheet file selection
✅ WS   /api/chat/ws            # WebSocket connection
```

## 🎯 Fix Strategy for Background Agents

### Phase 1: Frontend Connection
1. **Update enhanced-chat-interface.tsx**:
   - Modify `handleSend()` to use new unified endpoint
   - Send files and message together in one request
   - Remove separate file upload logic

2. **Update useApi.ts**:
   - Create `sendMessageWithFiles()` hook
   - Handle FormData for file uploads
   - Maintain existing WebSocket integration

### Phase 2: Backend Pipeline
1. **Complete agent_router.py**:
   - Fix `process_file_selection()` to trigger full pipeline
   - Ensure proper state transitions
   - Add comprehensive error handling

2. **Enhance chat.py**:
   - Verify new endpoint works with agent pipeline
   - Add proper file validation
   - Maintain WebSocket broadcasting

### Phase 3: Integration Testing
1. **Test file upload → analysis flow**
2. **Test Smartsheet → file selection → analysis flow**  
3. **Verify real-time WebSocket updates**
4. **Test error handling and recovery**

## 💡 Development Environment (Optimized for Agents)

### Local Setup
```bash
# Backend (Terminal 1)
cd backend && python3 -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Frontend (Terminal 2)  
cd pip-ui && npm run dev

# Status Check
./start_dev_environment.sh status
```

### Environment Variables (Configured)
- ✅ `SUPABASE_URL`: Database connection
- ✅ `SUPABASE_KEY`: Database authentication
- ✅ `OPENAI_API_KEY`: LLM integration
- ✅ `SMARTSHEET_ACCESS_TOKEN`: External API

### Testing Commands
```bash
# Backend tests
cd backend && python -m pytest tests/

# Integration tests
./start_dev_environment.sh test

# Check logs
./start_dev_environment.sh logs
```

## 🔍 Debugging Information

### Current Error Patterns
- File uploads succeed but don't trigger agent processing
- Smartsheet file selection completes but pipeline stops
- WebSocket shows "workflow_completed" but no file analysis

### Expected Success Pattern
1. User uploads file or selects from Smartsheet
2. ManagerAgent routes to FileReaderAgent
3. Pipeline processes through all 6 agents
4. Real-time updates via WebSocket
5. Results displayed in chat interface

### Log Files to Monitor
- `backend/backend.log` - Backend application logs
- `pip-ui/frontend.log` - Frontend development logs  
- Browser DevTools Console - WebSocket messages and API calls

## 🎯 Success Criteria
- ✅ Files uploaded via drag-drop are immediately analyzed
- ✅ Smartsheet file selection triggers full analysis pipeline
- ✅ Real-time progress updates via WebSocket
- ✅ Complete end-to-end workflow working
- ✅ Error handling and recovery functional

## 📚 Additional Context Files
- `.cursorrules` - General project rules
- `pip-ui/.cursorrules` - Frontend-specific rules  
- `backend/.cursorrules` - Backend-specific rules
- `.vscode/settings.json` - IDE configuration
- Various test files and documentation

---

**For Cursor Background Agents**: Use this context to understand the current state and prioritize fixes for the file upload and Smartsheet pipeline issues. The system is 90% functional - we just need to connect the file processing dots! 