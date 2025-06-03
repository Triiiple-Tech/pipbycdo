import React, { useState, useEffect, useCallback, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { cn } from "@/lib/utils"; // Added cn import
import { Message, MessageAttachment } from '../components/pip/MessageBubble';
import { ChatInterface, ChatInterfaceProps } from '../components/pip/ChatInterface';
import { useAnalysis, UseAnalysisOptions, AnalysisState } from '../hooks/useAnalysis';
import { AgentTrace, ProcessedState } from '../services/api';
import { ModelType } from '../components/pip/CostBadge';
import { AgentType as AvatarAgentType, AgentStatus as AvatarAgentStatus } from '../components/pip/AgentAvatar';
import { Button } from "@/components/ui/button";
import { Sparkles, FileText, Zap, Settings, Trash2, PlusSquare } from 'lucide-react';
import { ProjectSidebar } from "@/components/pip/ProjectSidebar";
import { AdminPanel } from "@/components/pip/AdminPanel";
import { StatusIndicator } from "@/components/ui/status-indicator";
import { useVisualFeedback } from "@/contexts/VisualFeedbackContext";
import { auditLogger } from '../services/auditLogger';

interface AgentInfo {
  type: AvatarAgentType; // Use AvatarAgentType for compatibility with ProjectSidebar
  status: AvatarAgentStatus; // Use AvatarAgentStatus for compatibility
  name: string;
  tasksCompleted: number;
  currentTask?: string;
  modelUsed?: ModelType;
  cost?: number;
}

interface PromptTemplate {
  label: string;
  prompt: string;
  icon: React.ElementType;
}

export default function Index() {
  const { showSuccess, showError, showInfo } = useVisualFeedback();
  const [messages, setMessages] = useState<Message[]>(() => {
    const storedMessages = localStorage.getItem("pipMessages");
    if (storedMessages) {
      try {
        const parsedMessages = JSON.parse(storedMessages);
        return parsedMessages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
          // Ensure attachments are correctly formed as MessageAttachment[]
          attachments: msg.attachments?.map((att: any) =>
            typeof att === 'string' ? { name: att, status: 'processed' } : att
          ) as MessageAttachment[] | undefined,
        }));
      } catch (error) {
        console.error("Failed to parse messages from localStorage", error);
        return [];
      }
    }
    return [];
  });

  const [currentSessionId, setCurrentSessionId] = useState<string>(() => {
    let sessionId = localStorage.getItem("pipSessionId");
    if (!sessionId) {
      sessionId = uuidv4();
      localStorage.setItem("pipSessionId", sessionId);
    }
    return sessionId;
  });

  const [chatInput, setChatInput] = useState(''); // For ChatInterface input if controlled from here
  const [isTyping, setIsTyping] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isAdminView, setIsAdminView] = useState(false);
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  const [lastProgressMessage, setLastProgressMessage] = useState<string>('');

  const [agents, setAgents] = useState<AgentInfo[]>([
    { type: "manager", status: "idle", name: "Project Manager", tasksCompleted: 12, modelUsed: "gpt-4-turbo" },
    { type: "file-reader", status: "idle", name: "Document Processor", tasksCompleted: 47, modelUsed: "claude-3-opus" },
    { type: "trade-mapper", status: "idle", name: "Scope Mapper", tasksCompleted: 23, modelUsed: "gemini-pro" },
    { type: "estimator", status: "idle", name: "Cost Estimator", tasksCompleted: 18, modelUsed: "gpt-3.5-turbo" },
    { type: "qa-validator", status: "idle", name: "Quality Validator", tasksCompleted: 9, modelUsed: "gpt-4" },
    { type: "exporter", status: "idle", name: "Document Generator", tasksCompleted: 15, modelUsed: "gpt-3.5-turbo" },
  ]);

  const analysis = useAnalysis({
    onProgress: (update: string) => {
      setLastProgressMessage(update);
      // Log progress updates for analysis
      auditLogger.logSystemEvent(
        'analysis_progress',
        update,
        'debug'
      );
    },
    onComplete: (result: ProcessedState) => {
      handleAnalysisComplete(result);
    },
    onError: async (errorMsg: string) => {
      // Log analysis error
      await auditLogger.logSystemEvent(
        'analysis_error',
        `Analysis failed: ${errorMsg}`,
        'error'
      );

      // Show error notification
      showError(
        `Analysis failed: ${errorMsg}`,
        "Analysis Error"
      );

      const errorMessage: Message = {
        id: uuidv4(),
        type: "system", // Use 'type' as per Message interface
        content: `❌ Analysis failed: ${errorMsg}`, // Use 'content'
        timestamp: new Date(),
        attachments: [],
        isLoading: false,
      };
      setMessages(prev => [...prev, errorMessage]);
      setIsTyping(false);
    },
  });

  const handleAnalysisComplete = async (result: ProcessedState) => {
    setIsTyping(false);
    let responseSummary = "✅ Analysis completed successfully!\n";

    if (result.processed_files_content) {
      const fileCount = Object.keys(result.processed_files_content).length;
      responseSummary += `📄 **Files Processed:** ${fileCount} documents analyzed\n`;
      
      // Show success notification for file processing
      showSuccess(
        `Successfully analyzed ${fileCount} documents`,
        "Analysis Complete"
      );
    }
    if (result.trade_mapping?.length) {
      responseSummary += `🔧 **Trades Identified:** ${result.trade_mapping.length} trade categories\n`;
    }

    const newMessages: Message[] = [];

    // Display agent trace messages and log them
    if (result.agent_trace && result.agent_trace.length > 0) {
      responseSummary += "\\n🤖 **Agent Workflow Details (see below):**\\n";
      
      for (const trace of result.agent_trace) {
        const agentName = trace.agent || 'System';
        const traceMessageText = trace.message || trace.details || '';
        let agentContent = `Agent: ${agentName}`;
        if (traceMessageText) agentContent += `\\n${traceMessageText}`;
        else if (trace.level) agentContent += `\\nStatus: ${trace.level}`;

        // Log each agent trace event
        await auditLogger.logAgentCall(
          agentName.toLowerCase().replace(/\s+/g, '-'),
          traceMessageText || `Agent ${agentName} ${trace.level || 'activity'}`,
          'system', // Model info not available in trace
          undefined,
          undefined,
          currentSessionId
        );

        newMessages.push({
          id: uuidv4(),
          type: "system", // Or 'agent' if preferred, ensure Message supports agentType then
          content: agentContent,
          timestamp: new Date(trace.timestamp),
          attachments: [],
          isLoading: false,
          agentName: agentName, // Custom prop, ensure Message interface supports it
        });
      }
    }

    responseSummary += "\\nYou can now export results, ask for specific details, or upload additional files for analysis.";
    
    const managerAgentInfo = agents.find(a => a.type === 'manager');
    newMessages.push({
      id: uuidv4(),
      type: "agent",
      agentType: "manager", // Custom prop
      agentStatus: "complete", // Custom prop
      content: responseSummary,
      timestamp: new Date(),
      modelUsed: managerAgentInfo?.modelUsed || "gpt-4-turbo", // Custom prop
      cost: isAdminView ? 0.045 : undefined, // Custom prop
      isLoading: false,
    });

    // Log completion of analysis
    await auditLogger.logAgentCall(
      'manager',
      `Analysis completed successfully. Processed ${result.processed_files_content ? Object.keys(result.processed_files_content).length : 0} files, identified ${result.trade_mapping?.length || 0} trades.`,
      managerAgentInfo?.modelUsed || "gpt-4-turbo",
      isAdminView ? 0.045 : undefined,
      undefined,
      currentSessionId
    );

    setMessages(prev => [...prev, ...newMessages]);
  };

  const handleSendMessage = async (text: string, files?: File[]) => {
    const startTime = Date.now();
    
    // Log user message
    await auditLogger.logUserAction(
      'message_sent',
      `User sent message: "${text.substring(0, 100)}${text.length > 100 ? '...' : ''}"${files ? ` with ${files.length} file(s)` : ''}`,
      currentSessionId
    );

    const userMessage: Message = {
      id: uuidv4(),
      type: "user",
      content: text,
      timestamp: new Date(),
      attachments: files?.map(f => ({
        name: f.name,
        size: f.size,
        type: f.type,
        status: 'queued',
      })),
      isLoading: false,
    };
    setMessages((prev) => [...prev, userMessage]);
    setIsTyping(true);

    const managerAgentInfo = agents.find(a => a.type === 'manager');
    const managerReceivedMessage: Message = {
      id: uuidv4(),
      type: "agent",
      agentType: "manager",
      agentStatus: "working",
      content: "Received your request. Analyzing and routing to specialist agents...",
      timestamp: new Date(),
      modelUsed: managerAgentInfo?.modelUsed,
      cost: isAdminView && managerAgentInfo?.cost ? managerAgentInfo.cost : undefined,
      isLoading: false,
    };
    setMessages(prev => [...prev, managerReceivedMessage]);

    // Log manager agent call
    await auditLogger.logAgentCall(
      'manager',
      `Processing user request: "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"`,
      managerAgentInfo?.modelUsed || 'gpt-4-turbo',
      managerAgentInfo?.cost,
      undefined,
      currentSessionId
    );

    if (files && files.length > 0) {
      const fileReaderAgentInfo = agents.find(a => a.type === 'file-reader');
      
      // Log file uploads
      for (const file of files) {
        await auditLogger.logFileUpload(file.name, file.size, file.type, currentSessionId);
      }
      
      // Update agent status to working
      setAgents(prev => prev.map(agent => 
        agent.type === 'file-reader' 
          ? { ...agent, status: "working" as AvatarAgentStatus, currentTask: `Processing ${files.length} file(s)` }
          : agent
      ));

      const fileReaderMessage: Message = {
        id: uuidv4(),
        type: "agent",
        agentType: "file-reader",
        agentStatus: "working",
        content: `📁 Processing ${files.length} file(s): ${files.map(f => f.name).join(', ')}
        
Files will be automatically routed based on type:
• Documents (.pdf, .docx) → Document analysis
• Spreadsheets (.xlsx, .csv) → Data extraction  
• Images → OCR processing
• Large files (>75MB) → Compression handling

Status will be tracked live in chat...`,
        timestamp: new Date(),
        modelUsed: fileReaderAgentInfo?.modelUsed,
        cost: isAdminView && fileReaderAgentInfo?.cost ? fileReaderAgentInfo.cost * files.length : undefined,
        isLoading: false,
        attachments: files.map(f => ({
          name: f.name,
          size: f.size,
          type: f.type,
          status: 'parsing' as const,
        })),
      };
      setMessages(prev => [...prev, fileReaderMessage]);

      // Log file reader agent call
      await auditLogger.logAgentCall(
        'file-reader',
        `Processing ${files.length} file(s): ${files.map(f => f.name).join(', ')}`,
        fileReaderAgentInfo?.modelUsed || 'claude-3-opus',
        fileReaderAgentInfo?.cost ? fileReaderAgentInfo.cost * files.length : undefined,
        undefined,
        currentSessionId
      );
    }

    try {
      await analysis.submitAnalysis({
        query: text,
        // Ensure files are correctly formatted for the backend API if needed
        files: files?.map(f => ({ name: f.name, type: f.type, data: f /* or f.arrayBuffer() if needed */ })) as any || [],
        user_id: "demo-user",
        session_id: currentSessionId,
      });
    } catch (err) {
      const duration = Date.now() - startTime;
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      
      // Log error
      await auditLogger.logAgentCall(
        'system',
        `Analysis submission failed: ${errorMessage}`,
        'system',
        undefined,
        duration,
        currentSessionId,
        errorMessage
      );

      // Show error notification
      showError(
        `Failed to submit analysis: ${errorMessage}`,
        "Submission Error"
      );

      setIsTyping(false);
      const errorResponseMessage: Message = {
        id: uuidv4(),
        type: "system",
        content: `❌ Failed to submit analysis: ${errorMessage}`,
        timestamp: new Date(),
        isLoading: false,
      };
      setMessages((prev) => [...prev, errorResponseMessage]);
    }
  };

  const handleFileUpload = useCallback(async (uploadedFiles: File[]) => {
    // Log file uploads
    for (const file of uploadedFiles) {
      await auditLogger.logFileUpload(file.name, file.size, file.type, currentSessionId);
    }

    // Log user action for file drop
    await auditLogger.logUserAction(
      'files_dropped',
      `User dropped ${uploadedFiles.length} file(s): ${uploadedFiles.map(f => f.name).join(', ')}`,
      currentSessionId
    );

    // Show success notification for file upload
    showSuccess(
      `Successfully uploaded ${uploadedFiles.length} file(s): ${uploadedFiles.map(f => f.name).join(', ')}`,
      "Files Uploaded"
    );

    const fileDisplayMessages: Message[] = uploadedFiles.map(file => ({
      id: uuidv4(),
      type: "user", // Or 'system' to denote file drop
      content: `File uploaded: ${file.name}`,
      timestamp: new Date(),
      attachments: [{ name: file.name, size: file.size, type: file.type, status: 'queued' } as MessageAttachment],
      isLoading: false,
      isFileCard: true, // Custom prop, ensure Message interface supports it
    }));
    setMessages(prev => [...prev, ...fileDisplayMessages]);
    // Optionally trigger analysis: handleSendMessage("Analyze uploaded files", uploadedFiles);
  }, [currentSessionId, showSuccess]);

  useEffect(() => {
    try {
      localStorage.setItem("pipMessages", JSON.stringify(messages));
    } catch (error) {
      console.error("Failed to save messages to localStorage", error);
      auditLogger.logSystemEvent(
        'localStorage_error',
        `Failed to save messages: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'error'
      );
    }
  }, [messages]);

  useEffect(() => {
    if (messages.length === 0 && !analysis.isLoading) {
      // Log system startup
      auditLogger.logSystemEvent(
        'system_startup',
        `PIP AI interface initialized with session ID: ${currentSessionId}`,
        'info'
      );
      
      const welcomeMessage: Message = {
        id: "welcome",
        type: "system",
        content: "Welcome to PIP AI - Your Project Intelligence Platform. Chat with PIP or upload your files to begin.",
        timestamp: new Date(),
        isLoading: false,
      };
      setMessages([welcomeMessage]);
    }
  }, [messages.length, analysis.isLoading, currentSessionId]);

  useEffect(() => {
    setIsTyping(analysis.isLoading);
  }, [analysis.isLoading]);

  const promptTemplates: PromptTemplate[] = [
    { label: "Summarize Scope", prompt: "Summarize the scope of work from the provided documents.", icon: Sparkles },
    { label: "Generate RFI", prompt: "Identify potential RFIs based on the current information.", icon: FileText },
    { label: "Identify Missing Info", prompt: "What information is missing to complete the estimate?", icon: Zap },
  ];

  const handleSelectPromptTemplate = async (prompt: string) => {
    // Log prompt template selection
    const templateLabel = promptTemplates.find(t => t.prompt === prompt)?.label || 'Unknown Template';
    await auditLogger.logUserAction(
      'prompt_template_selected',
      `Selected template "${templateLabel}": ${prompt.substring(0, 100)}${prompt.length > 100 ? '...' : ''}`,
      currentSessionId
    );

    setChatInput(prompt); // Update chatInput state
    // ChatInterface will need to use this value if its input is controlled
    // Or, if ChatInterface manages its own input, this might trigger a direct send:
    // handleSendMessage(prompt);
  };

  // Keyboard shortcuts for templates
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only trigger if Ctrl/Cmd is pressed
      if (!(event.ctrlKey || event.metaKey)) return;
      
      // Prevent default browser behavior
      event.preventDefault();
      
      const key = event.key;
      let template: PromptTemplate | undefined;
      
      switch (key) {
        case '1':
          template = promptTemplates[0]; // Summarize Scope
          auditLogger.logUserAction(
            'keyboard_shortcut',
            `Used keyboard shortcut Ctrl/Cmd+1 for template "${promptTemplates[0].label}"`,
            currentSessionId
          );
          break;
        case '2':
          template = promptTemplates[1]; // Generate RFI
          auditLogger.logUserAction(
            'keyboard_shortcut',
            `Used keyboard shortcut Ctrl/Cmd+2 for template "${promptTemplates[1].label}"`,
            currentSessionId
          );
          break;
        case '3':
          template = promptTemplates[2]; // Identify Missing Info
          auditLogger.logUserAction(
            'keyboard_shortcut',
            `Used keyboard shortcut Ctrl/Cmd+3 for template "${promptTemplates[2].label}"`,
            currentSessionId
          );
          break;
        case '`':
        case '~':
          // Toggle Admin Panel with Ctrl/Cmd + `
          auditLogger.logUserAction(
            'keyboard_shortcut',
            `Used keyboard shortcut Ctrl/Cmd+\` to toggle admin panel`,
            currentSessionId
          );
          setIsAdminPanelOpen(prev => !prev);
          return;
        default:
          return;
      }
      
      if (template) {
        handleSelectPromptTemplate(template.prompt);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [promptTemplates]);

  const handleClearChat = async () => {
    // Log chat clear action
    await auditLogger.logUserAction(
      'chat_cleared',
      `User cleared chat with ${messages.length} messages`,
      currentSessionId
    );

    // Show info notification
    showInfo(
      `Cleared ${messages.length} messages from chat`,
      "Chat Cleared"
    );

    setMessages([]);
    // Reset agents to idle status when clearing chat
    setAgents(prev => prev.map(agent => ({
      ...agent,
      status: "idle" as AvatarAgentStatus,
      currentTask: ""
    })));
    setIsTyping(false);
    setLastProgressMessage("");
    analysis.reset();
  };

  const handleNewChat = async () => {
    // Log new chat action
    await auditLogger.logUserAction(
      'new_chat_started',
      'User started a new chat session',
      currentSessionId
    );

    const newSessionId = uuidv4();
    localStorage.setItem("pipSessionId", newSessionId);
    setCurrentSessionId(newSessionId);
    handleClearChat();
  };

  const toggleAdminView = async () => {
    const newAdminView = !isAdminView;
    await auditLogger.logUserAction(
      'admin_view_toggled',
      `Admin view ${newAdminView ? 'enabled' : 'disabled'}`,
      currentSessionId
    );
    setIsAdminView(newAdminView);
  };

  return (
    <div className="h-screen bg-white dark:bg-slate-900 flex overflow-hidden">
      {/* Remove gradient overlay for cleaner Apple-esque design */}
      
      <ProjectSidebar
        agents={agents} // agents state now uses AvatarAgentType for `type` field
        isCollapsed={sidebarCollapsed}
        onToggle={async () => {
          const newState = !sidebarCollapsed;
          await auditLogger.logUserAction(
            'sidebar_toggled',
            `User ${newState ? 'collapsed' : 'expanded'} sidebar`,
            currentSessionId
          );
          setSidebarCollapsed(newState);
        }}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header - Apply design brief typography and colors */}
        <div className="h-16 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center justify-between px-6 shrink-0 shadow-sm">
          <div>
            <h1 className="text-xl font-bold text-slate-800 dark:text-slate-200">PIP AI</h1> {/* Typography: Page Header style */}
            <p className="text-sm text-slate-500 dark:text-slate-400">Project Intelligence Platform</p> {/* Typography: Metadata style */}
          </div>
          <div className="flex items-center gap-4">
            {/* Admin Panel Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                await auditLogger.logUserAction(
                  'admin_panel_opened',
                  'User opened admin panel',
                  currentSessionId
                );
                setIsAdminPanelOpen(true);
              }}
              className={cn(
                "text-xs h-7 px-3",
                "border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:border-cdo-red hover:text-cdo-red focus-visible:ring-cdo-red"
              )}
            >
              <Settings className="w-3 h-3 mr-1" />
              Admin Panel
            </Button>
            
            {/* Status Indicator */}
            <StatusIndicator
              status={analysis.isLoading ? "loading" : analysis.error ? "error" : "idle"}
              message={analysis.isLoading ? (lastProgressMessage || 'Processing...') : analysis.error ? 'Error' : 'Ready'}
              size="sm"
            />
            
            {/* Admin Toggle */}
            <Button
              variant={isAdminView ? "default" : "outline"}
              size="sm"
              onClick={toggleAdminView}
              className={cn(
                "text-xs h-7 px-3",
                isAdminView 
                  ? "bg-cdo-red hover:bg-cdo-red/90 text-white focus-visible:ring-cdo-red" 
                  : "border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:border-cdo-red hover:text-cdo-red focus-visible:ring-cdo-red"
              )}
            >
              Admin: {isAdminView ? 'ON' : 'OFF'}
            </Button>
          </div>
        </div>

        <ChatInterface
          messages={messages}
          onSendMessage={handleSendMessage}
          onFileUpload={handleFileUpload}
          isTyping={isTyping}
          typingAgentName={lastProgressMessage ? "AI Assistant" : "PIP AI"} // Use the new prop
          className="flex-1"
          onClearChat={handleClearChat}
          onNewChat={handleNewChat}
          isAdminView={isAdminView}
          promptTemplates={promptTemplates}
          onSelectPromptTemplate={handleSelectPromptTemplate}
          showMetadata={isAdminView} // Show metadata when in admin view
          onToggleMetadata={() => setIsAdminView(!isAdminView)} // Toggle admin view to show/hide metadata
        />
      </div>
      
      {/* Admin Panel */}
      <AdminPanel 
        isOpen={isAdminPanelOpen}
        onClose={async () => {
          await auditLogger.logUserAction(
            'admin_panel_closed',
            'User closed admin panel',
            currentSessionId
          );
          setIsAdminPanelOpen(false);
        }}
      />
    </div>
  );
}
