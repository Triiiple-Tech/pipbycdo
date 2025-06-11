# 🎯 Frontend Brief for Cline - Interactive Smartsheet File Selection

## **Project Overview**
Create an interactive chat interface where users can click checkboxes to select Smartsheet files and submit their selection for analysis, with or without additional text input.

## **✅ Backend Already Complete**
- ✅ **File Selection Endpoint**: `/api/chat/sessions/{session_id}/file-selection`
- ✅ **Enhanced Message Processing**: Handles file selection submissions
- ✅ **Interactive UI Generation**: SmartsheetAgent generates structured metadata
- ✅ **Async Architecture**: All operations are non-blocking

## **🎯 Frontend Requirements**

### **1. Core Component Structure**
```typescript
// Located in: /pip-ui/components/chat/
interface FileSelectionMessage {
  type: 'file_selection';
  sheet_id: string;
  files: Array<{
    id: string;
    name: string;
    size: string;
    type: 'pdf' | 'xlsx' | 'docx' | 'unknown';
    icon: string;
  }>;
}

interface FileSelectionState {
  selectedFiles: string[];
  additionalText: string;
  action: 'analyze_selected' | 'analyze_all' | 'cancel';
}
```

### **2. Message Parsing Logic**
```typescript
// Parse agent messages for interactive content
function parseMessageForInteractivity(content: string): FileSelectionMessage | null {
  // Look for: <!-- METADATA: {JSON} -->
  const metadataMatch = content.match(/<!-- METADATA: (.+?) -->/);
  if (metadataMatch) {
    try {
      return JSON.parse(metadataMatch[1]);
    } catch (e) {
      return null;
    }
  }
  return null;
}
```

### **3. Interactive File Selection Component**
```tsx
// /pip-ui/components/chat/FileSelectionCard.tsx
export function FileSelectionCard({ 
  files, 
  sheetId, 
  onSubmit 
}: {
  files: FileSelectionMessage['files'];
  sheetId: string;
  onSubmit: (selection: FileSelectionState) => void;
}) {
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [additionalText, setAdditionalText] = useState('');

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          📊 Smartsheet Files Retrieved
        </CardTitle>
        <CardDescription>
          Sheet ID: <code>{sheetId}</code> • {files.length} files available
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* File Selection Grid */}
        <div className="grid gap-2">
          {files.map((file) => (
            <div key={file.id} className="flex items-center space-x-3 p-2 border rounded-lg hover:bg-muted/50">
              <Checkbox
                checked={selectedFiles.includes(file.id)}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setSelectedFiles([...selectedFiles, file.id]);
                  } else {
                    setSelectedFiles(selectedFiles.filter(id => id !== file.id));
                  }
                }}
              />
              <span className="text-lg">{file.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{file.name}</div>
                <div className="text-sm text-muted-foreground">{file.size}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Additional Instructions */}
        <div className="space-y-2">
          <Label htmlFor="instructions">Additional Analysis Instructions (Optional)</Label>
          <Textarea
            id="instructions"
            placeholder="e.g., Focus on cost estimation, analyze blueprints for electrical work..."
            value={additionalText}
            onChange={(e) => setAdditionalText(e.target.value)}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-4">
          <Button
            onClick={() => onSubmit({
              selectedFiles,
              additionalText,
              action: 'analyze_selected'
            })}
            disabled={selectedFiles.length === 0 && !additionalText.trim()}
            className="flex-1"
          >
            Analyze Selected ({selectedFiles.length})
          </Button>
          
          <Button
            variant="outline"
            onClick={() => onSubmit({
              selectedFiles: files.map(f => f.id),
              additionalText,
              action: 'analyze_all'
            })}
          >
            Analyze All
          </Button>
          
          <Button
            variant="ghost"
            onClick={() => setSelectedFiles([])}
          >
            Clear
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
```

### **4. Chat Message Enhancement**
```tsx
// /pip-ui/components/chat/ChatMessage.tsx
export function ChatMessage({ message }: { message: Message }) {
  const fileSelection = parseMessageForInteractivity(message.content);
  
  if (fileSelection?.type === 'file_selection') {
    return (
      <div className="flex gap-3">
        <Avatar className="w-8 h-8">
          <AvatarFallback>🤖</AvatarFallback>
        </Avatar>
        
        <div className="flex-1 space-y-3">
          {/* Regular message content (without metadata) */}
          <div className="prose prose-sm max-w-none">
            {message.content.replace(/<!-- METADATA:.*? -->/, '').trim()}
          </div>
          
          {/* Interactive file selection */}
          <FileSelectionCard
            files={fileSelection.files}
            sheetId={fileSelection.sheet_id}
            onSubmit={handleFileSelection}
          />
        </div>
      </div>
    );
  }
  
  // Regular message rendering...
}
```

### **5. API Integration**
```typescript
// /pip-ui/services/chatApi.ts
export async function submitFileSelection(
  sessionId: string,
  selection: FileSelectionState
): Promise<{ success: boolean; selection_message: any; agent_response: any }> {
  const response = await fetch(`/api/chat/sessions/${sessionId}/file-selection`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      selected_files: selection.selectedFiles,
      action: selection.action,
      additional_text: selection.additionalText
    })
  });
  
  return response.json();
}
```

### **6. Chat Hook Enhancement**
```typescript
// /pip-ui/hooks/useChat.ts
export function useChat(sessionId: string) {
  // ... existing logic ...
  
  const handleFileSelection = async (selection: FileSelectionState) => {
    try {
      setIsLoading(true);
      
      const result = await submitFileSelection(sessionId, selection);
      
      if (result.success) {
        // Add both selection and response to messages
        setMessages(prev => [
          ...prev,
          result.selection_message,
          result.agent_response
        ]);
      }
    } catch (error) {
      console.error('File selection failed:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  return {
    // ... existing returns ...
    handleFileSelection
  };
}
```

## **🎨 Design Requirements**

### **Visual Design**
- **Modern UI**: Use shadcn/ui components with Tailwind CSS
- **File Icons**: 📄 PDF, 📊 Excel, 📝 Word, 📎 Other
- **Interactive States**: Clear hover, selected, disabled states
- **Responsive**: Works on mobile and desktop

### **UX Flow**
1. **User pastes Smartsheet URL** → Agent responds with file selection UI
2. **User clicks checkboxes** → Visual feedback, selection count updates
3. **User adds instructions** → Optional text area for specific requirements
4. **User clicks "Analyze Selected"** → Sends selection to backend
5. **System processes** → Shows loading state, then results

### **Accessibility**
- ✅ **Keyboard Navigation**: All interactive elements accessible via keyboard
- ✅ **Screen Reader**: Proper ARIA labels and descriptions
- ✅ **Color Contrast**: Meets WCAG guidelines
- ✅ **Focus Management**: Clear focus indicators

## **🔧 Implementation Files**

### **Create These Components:**
1. **`/pip-ui/components/chat/FileSelectionCard.tsx`** - Main interactive component
2. **`/pip-ui/components/chat/FileCheckbox.tsx`** - Individual file checkbox
3. **`/pip-ui/hooks/useFileSelection.ts`** - Selection state management
4. **`/pip-ui/utils/messageParser.ts`** - Parse metadata from messages

### **Modify These Files:**
1. **`/pip-ui/components/chat/ChatMessage.tsx`** - Add interactive message rendering
2. **`/pip-ui/hooks/useChat.ts`** - Add file selection handling
3. **`/pip-ui/services/chatApi.ts`** - Add file selection API call

## **🚀 Success Criteria**

### **Functional Requirements**
- ✅ **Interactive Checkboxes**: Users can select/deselect files
- ✅ **Real-time Updates**: Selection count updates immediately
- ✅ **Multiple Actions**: "Analyze Selected", "Analyze All", "Clear"
- ✅ **Text Integration**: Additional instructions work with selection
- ✅ **API Integration**: Submissions processed correctly

### **Performance Requirements**
- ✅ **Fast Rendering**: Checkbox interactions under 100ms
- ✅ **Smooth Animations**: Hover and selection transitions
- ✅ **Efficient Updates**: Only re-render changed components

### **Error Handling**
- ✅ **Network Failures**: Graceful degradation with retry options
- ✅ **Invalid Selections**: Clear validation messages
- ✅ **Backend Errors**: User-friendly error display

## **📋 Implementation Checklist**

### **Phase 1: Core Components**
- [ ] Create `FileSelectionCard` component
- [ ] Implement checkbox selection logic
- [ ] Add file icon mapping
- [ ] Style with Tailwind CSS

### **Phase 2: Integration**
- [ ] Parse metadata from agent messages
- [ ] Integrate with existing chat message rendering
- [ ] Add API call for file selection submission
- [ ] Handle loading and error states

### **Phase 3: Enhancement**
- [ ] Add keyboard navigation support
- [ ] Implement accessibility features
- [ ] Add smooth animations and transitions
- [ ] Test on mobile and desktop

### **Phase 4: Polish**
- [ ] Add comprehensive error handling
- [ ] Implement retry mechanisms
- [ ] Add user feedback (toast notifications)
- [ ] Performance optimization

## **🎯 Ready to Start!**

The backend is **fully implemented and tested** with your real Smartsheet URL. You can now focus entirely on creating the interactive frontend components that will make file selection smooth and intuitive for users.

**Next Step**: Start with the `FileSelectionCard` component using the provided TypeScript interfaces and gradually integrate it into the existing chat system.
