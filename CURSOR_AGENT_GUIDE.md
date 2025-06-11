# Cursor Background Agent Guide
*Your Complete Toolkit for PIP AI Development*

## 🚀 Quick Start Commands

### Development Environment
```bash
# Check system status
./start_dev_environment.sh status

# Start both services
./start_dev_environment.sh start

# Run integration tests
./start_dev_environment.sh test

# View logs
./start_dev_environment.sh logs

# Stop services
./start_dev_environment.sh stop
```

### Testing Specific Components
```bash
# Backend tests
cd backend && python -m pytest tests/ -v

# Specific agent test
cd backend && python -m pytest tests/test_agent_specific.py -v

# Frontend type checking
cd pip-ui && npm run type-check

# Frontend linting
cd pip-ui && npm run lint
```

## 🎯 Priority Issue Fixes

### Issue 1: File Upload Disconnect

**Problem**: Files uploaded don't trigger agent pipeline
**Fix Location**: `pip-ui/components/enhanced-chat-interface.tsx`

**Current Code (lines ~520-540)**:
```typescript
// Handle file uploads first if we have files
let uploadedFileIds: string[] = []
if (attachedFiles.length > 0) {
  try {
    console.log("📤 Uploading files...")
    const uploadResult = await uploadFiles(attachedFiles)
    // ... files uploaded but not sent to agent pipeline
  }
}
```

**Fix Strategy**:
```typescript
// NEW: Use unified endpoint for message + files
const handleSend = async () => {
  if (!currentSessionId) return;
  
  // Create FormData for unified endpoint
  const formData = new FormData();
  if (input.trim()) {
    formData.append('content', input);
  }
  
  // Add files directly to form
  attachedFiles.forEach(file => {
    formData.append('files', file);
  });
  
  // Call new unified endpoint
  const response = await fetch(`/api/chat/sessions/${currentSessionId}/messages-with-files`, {
    method: 'POST',
    body: formData
  });
  
  // Handle response...
};
```

### Issue 2: Smartsheet Pipeline Break

**Problem**: File selection doesn't continue to analysis
**Fix Location**: `backend/services/agent_router.py`

**Current Code (lines ~580-620)**:
```python
# Check if SmartsheetAgent has prepared files for analysis
if result_state.status == "files_ready_for_analysis" and result_state.files:
    logger.info(f"Files ready for analysis - triggering full pipeline with {len(result_state.files)} files")
    
    # Set state to trigger full analysis pipeline with proper context
    result_state.status = "files_uploaded"
    # ... but pipeline doesn't continue properly
```

**Fix Strategy**:
```python
# ENHANCED: Ensure proper pipeline continuation
if result_state.status == "files_ready_for_analysis" and result_state.files:
    logger.info(f"Files ready for analysis - triggering full pipeline")
    
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
    
    # CRITICAL: Run through ManagerAgent again for full pipeline
    logger.info("Re-routing to ManagerAgent for full analysis pipeline")
    result_state = await self.manager_agent.process(result_state)
```

## 🛠️ Development Patterns

### Adding New API Endpoints

**Backend Pattern** (`backend/routes/example.py`):
```python
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Any
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

class RequestModel(BaseModel):
    field: str

@router.post("/new-endpoint")
async def new_endpoint(request: RequestModel) -> Dict[str, Any]:
    """Endpoint description."""
    try:
        # Implementation
        result = await process_request(request)
        return {"success": True, "data": result}
    except Exception as e:
        logger.error(f"Error in new_endpoint: {e}")
        raise HTTPException(status_code=500, detail=str(e))
```

**Frontend Pattern** (`pip-ui/hooks/useNewApi.ts`):
```typescript
import { useState } from 'react';
import { apiClient } from '@/services/api';

export function useNewApi() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const callApi = async (data: RequestData) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.makeRequest('/api/new-endpoint', {
        method: 'POST',
        body: JSON.stringify(data)
      });
      
      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { callApi, loading, error };
}
```

### WebSocket Integration Pattern

**Backend Broadcasting**:
```python
from backend.routes.chat import broadcast_message
from datetime import datetime, timezone

async def send_progress_update(session_id: str, progress: Dict[str, Any]):
    """Send real-time progress update."""
    await broadcast_message(session_id, {
        "type": "progress_update",
        "session_id": session_id,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "data": progress
    })
```

**Frontend Handling**:
```typescript
// In component
useEffect(() => {
  const handleProgressUpdate = (message: any) => {
    if (message.type === 'progress_update') {
      setProgress(message.data);
    }
  };
  
  chatApi.onMessage('progress-handler', handleProgressUpdate);
  
  return () => {
    chatApi.offMessage('progress-handler');
  };
}, []);
```

## 🧪 Testing Patterns

### Backend Test Example
```python
import pytest
from unittest.mock import AsyncMock, patch
from backend.services.agent_router import AgentRouter

@pytest.mark.asyncio
async def test_file_processing_flow():
    """Test complete file processing workflow."""
    # Arrange
    agent_router = AgentRouter()
    mock_files = [create_mock_file("test.pdf")]
    
    # Mock external dependencies
    with patch('backend.services.gpt_handler.run_llm') as mock_llm:
        mock_llm.return_value = "Mocked LLM response"
        
        # Act
        result = await agent_router.process_user_message(
            session_id="test-session",
            user_message="Analyze my files",
            user_id="test-user"
        )
        
        # Assert
        assert result is not None
        assert "content" in result
        mock_llm.assert_called()
```

### Frontend Test Example
```typescript
import { render, screen, waitFor } from '@testing-library/react';
import { ChatInterface } from '@/components/enhanced-chat-interface';

test('file upload triggers processing', async () => {
  // Arrange
  const mockFiles = [new File(['test'], 'test.pdf', { type: 'application/pdf' })];
  
  render(<ChatInterface />);
  
  // Act
  const fileInput = screen.getByTestId('file-input');
  fireEvent.change(fileInput, { target: { files: mockFiles } });
  
  const sendButton = screen.getByText('Send');
  fireEvent.click(sendButton);
  
  // Assert
  await waitFor(() => {
    expect(screen.getByText(/processing/i)).toBeInTheDocument();
  });
});
```

## 🔍 Debugging Strategies

### Backend Debugging
```python
# Add comprehensive logging
import logging
logger = logging.getLogger(__name__)

def debug_agent_state(state: AppState, checkpoint: str):
    """Debug helper for agent state."""
    logger.info(f"CHECKPOINT {checkpoint}:")
    logger.info(f"  Status: {state.status}")
    logger.info(f"  Files: {len(state.files) if state.files else 0}")
    logger.info(f"  Query: {state.query[:50] if state.query else 'None'}...")
    logger.info(f"  Error: {state.error}")
    logger.info(f"  Trace entries: {len(state.agent_trace)}")

# Use in agents
async def process(self, state: AppState) -> AppState:
    debug_agent_state(state, "BEFORE_PROCESSING")
    # ... processing logic
    debug_agent_state(state, "AFTER_PROCESSING")
    return state
```

### Frontend Debugging
```typescript
// Enhanced console logging
const debugApiCall = (endpoint: string, data: any, response: any) => {
  console.group(`🌐 API Call: ${endpoint}`);
  console.log('📤 Request:', data);
  console.log('📥 Response:', response);
  console.groupEnd();
};

// WebSocket debugging
const debugWebSocket = (message: any) => {
  console.group('🔌 WebSocket Message');
  console.log('Type:', message.type);
  console.log('Data:', message.data);
  console.log('Timestamp:', message.timestamp);
  console.groupEnd();
};
```

## 📊 Performance Monitoring

### Backend Performance
```python
import time
from functools import wraps

def monitor_performance(func):
    """Decorator to monitor function performance."""
    @wraps(func)
    async def wrapper(*args, **kwargs):
        start_time = time.time()
        try:
            result = await func(*args, **kwargs)
            duration = time.time() - start_time
            logger.info(f"{func.__name__} completed in {duration:.2f}s")
            return result
        except Exception as e:
            duration = time.time() - start_time
            logger.error(f"{func.__name__} failed after {duration:.2f}s: {e}")
            raise
    return wrapper

# Usage
@monitor_performance
async def process_large_file(file_data: bytes) -> Dict[str, Any]:
    # Implementation
    pass
```

### Frontend Performance
```typescript
// Performance monitoring hook
export function usePerformanceMonitor(componentName: string) {
  useEffect(() => {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      console.log(`⚡ ${componentName} render time: ${endTime - startTime}ms`);
    };
  }, [componentName]);
}

// Usage in components
export function MyComponent() {
  usePerformanceMonitor('MyComponent');
  // Component logic
}
```

## 🎯 Success Validation

### Check File Upload Fix
```bash
# 1. Start services
./start_dev_environment.sh start

# 2. Open browser to http://localhost:3000
# 3. Upload a file via drag-drop
# 4. Check backend logs for agent processing:
tail -f backend/backend.log | grep -i "filereadragent\|manager\|processing"

# 5. Verify WebSocket messages in browser DevTools
```

### Check Smartsheet Fix
```bash
# 1. Paste Smartsheet URL in chat
# 2. Select files from the picker
# 3. Verify full pipeline runs:
tail -f backend/backend.log | grep -i "pipeline\|analysis\|estimator"

# 4. Check for "files_ready_for_analysis" → "full pipeline" flow
```

## 🚨 Emergency Recovery

### If Backend Won't Start
```bash
# Check for syntax errors
cd backend && python -m py_compile app/main.py

# Check imports
cd backend && python -c "from app.main import app; print('✅ Imports OK')"

# Reset virtual environment
rm -rf .venv && python3 -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt
```

### If Frontend Won't Start
```bash
# Clear Next.js cache
cd pip-ui && rm -rf .next

# Reinstall dependencies
rm -rf node_modules package-lock.json && npm install

# Check for TypeScript errors
npm run type-check
```

---

**Remember**: You have full context now. The system is 90% working - focus on connecting the file upload and Smartsheet pipeline gaps. Every change should maintain the existing WebSocket real-time functionality! 