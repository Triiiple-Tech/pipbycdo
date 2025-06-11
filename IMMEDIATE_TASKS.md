# 🎯 IMMEDIATE TASKS FOR CURSOR AGENTS
*Priority fixes needed for PIP AI file processing*

## ✅ SETUP COMPLETE 
- Environment configured ✅
- Both services running ✅  
- WebSocket communication working ✅
- Context files created ✅

## 🚨 CRITICAL FIXES NEEDED

### 1. **Frontend File Upload Fix** (30 minutes)
**File**: `pip-ui/components/enhanced-chat-interface.tsx`
**Lines**: 491-656 (handleSend function)

**Current Problem**: 
```typescript
// Files uploaded separately, not sent to agent pipeline
const uploadResult = await uploadFiles(attachedFiles)
// Then sends message without files
const response = await directSendMessage(currentSessionId, messageContent, attachedFiles)
```

**Required Fix**:
```typescript
const handleSend = async () => {
  if (!input.trim() && attachedFiles.length === 0) return;
  if (!currentSessionId) return;

  setIsTyping(true);
  
  // Create FormData for unified endpoint
  const formData = new FormData();
  
  if (input.trim()) {
    formData.append('content', input);
  }
  
  // Add files directly to FormData
  attachedFiles.forEach(file => {
    formData.append('files', file);
  });
  
  try {
    // Call unified endpoint that processes files AND triggers agents
    const response = await fetch(`/api/chat/sessions/${currentSessionId}/messages-with-files`, {
      method: 'POST',
      body: formData
    });
    
    const result = await response.json();
    
    if (result.success) {
      // Clear inputs
      setInput("");
      setAttachedFiles([]);
      
      // Messages will come via WebSocket
      toast.success('Message and files sent!');
    } else {
      throw new Error(result.error);
    }
  } catch (error) {
    console.error('Send error:', error);
    toast.error('Failed to send message');
  } finally {
    setIsTyping(false);
  }
};
```

### 2. **Backend Pipeline Continuation Fix** (45 minutes)
**File**: `backend/services/agent_router.py`
**Lines**: 580-632 (process_file_selection function)

**Current Problem**:
```python
# Pipeline stops after files_ready_for_analysis
if result_state.status == "files_ready_for_analysis" and result_state.files:
    # Sets status but doesn't continue processing
    result_state.status = "files_uploaded"
    # Missing: Re-run through ManagerAgent for full pipeline
```

**Required Fix**:
```python
# Check if SmartsheetAgent has prepared files for analysis
if result_state.status == "files_ready_for_analysis" and result_state.files:
    logger.info(f"Files ready for analysis - triggering full pipeline with {len(result_state.files)} files")
    
    # Reset state for full pipeline processing
    result_state.status = "files_uploaded"
    result_state.query = f"Analyze {len(result_state.files)} construction documents for cost estimation"
    result_state.pending_user_action = None
    
    # Ensure metadata indicates pipeline continuation
    if not result_state.metadata:
        result_state.metadata = {}
    result_state.metadata.update({
        "pipeline_continuation": True,
        "analysis_triggered": True,
        "original_file_selection": file_selection
    })
    
    logger.info("Re-routing to ManagerAgent for full analysis pipeline")
    
    # CRITICAL: Process through ManagerAgent again for complete pipeline
    try:
        result_state = await self.manager_agent.process(result_state)
        logger.info(f"Full pipeline completed. Final status: {result_state.status}")
    except Exception as e:
        logger.error(f"Error in full pipeline processing: {e}")
        result_state.error = f"Pipeline processing failed: {str(e)}"
```

### 3. **Backend Endpoint Error Fix** (15 minutes)
**File**: `backend/routes/chat.py`
**Lines**: 425-600 (send_message_with_files function)

**Current Problem**: Missing imports causing linter errors

**Required Fix**: Add missing imports at top of file:
```python
from backend.app.schemas import AppState, SchemaFile
```

And fix the method call:
```python
# Change this line (around line 760):
response_content = agent_router._extract_agent_response(result_state)

# To this:
response_content = self._extract_agent_response_safely(result_state)

# And add this helper method:
def _extract_agent_response_safely(self, state: AppState) -> str:
    """Safely extract agent response from state."""
    if state.estimate and len(state.estimate) > 0:
        return f"✅ Generated estimate with {len(state.estimate)} items"
    elif state.takeoff_data:
        return f"✅ Completed takeoff analysis"
    elif state.scope_items:
        return f"✅ Identified {len(state.scope_items)} scope items"
    elif state.processed_files_content:
        return f"✅ Processed {len(state.files) if state.files else 0} files"
    else:
        return "✅ Request processed successfully"
```

## 🧪 TESTING STEPS

### Test File Upload Fix
1. Start both services: `./start_dev_environment.sh start`
2. Open http://localhost:3000
3. Drag and drop a PDF file
4. Click Send
5. **Expected**: Agent processing starts immediately
6. **Check logs**: `tail -f backend/backend.log | grep -i "filereadragent\|processing"`

### Test Smartsheet Fix  
1. Paste Smartsheet URL in chat
2. Select files from the picker UI
3. **Expected**: Full analysis pipeline runs
4. **Check logs**: `tail -f backend/backend.log | grep -i "full pipeline\|analysis"`

## 🎯 SUCCESS CRITERIA

### ✅ File Upload Working
- [ ] Files uploaded via drag-drop trigger agent processing
- [ ] Real-time progress updates via WebSocket
- [ ] FileReaderAgent → TradeMapperAgent → ... → EstimatorAgent
- [ ] Final results displayed in chat

### ✅ Smartsheet Pipeline Working  
- [ ] File selection triggers full analysis
- [ ] Status changes from "files_ready_for_analysis" → "processing"
- [ ] Complete agent pipeline runs
- [ ] Results include detailed analysis

## 🚨 PRIORITY ORDER
1. **Fix frontend file upload** (enables basic file processing)
2. **Fix backend pipeline continuation** (enables Smartsheet flow)
3. **Fix backend imports** (resolves linter errors)
4. **Test end-to-end** (validate everything works)

## 📞 VALIDATION COMMANDS

After each fix:
```bash
# Check system status
./start_dev_environment.sh status

# Run integration test
./start_dev_environment.sh test

# Check specific logs
tail -f backend/backend.log | grep -i "agent\|pipeline\|processing"
```

---

**FOR CURSOR AGENTS**: These are the exact fixes needed. The system is 90% working - these three specific changes will connect the missing pieces and enable full file processing functionality! 