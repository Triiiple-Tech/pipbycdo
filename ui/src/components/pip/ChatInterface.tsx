import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MessageBubble, Message, MessageAttachment } from "./MessageBubble";
import { FileUpload } from "./FileUpload";
import { MessageSkeleton, AgentTypingIndicator } from "./MessageSkeleton";
import { FileUploadOverlay } from "./FileUploadOverlay";
import { ConfirmModal } from "./ConfirmModal";
import { PromptTemplatesDropdown, PromptTemplate } from "./PromptTemplatesDropdown";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from 'framer-motion';
import { auditLogger } from '../../services/auditLogger';
import {
  Send,
  Paperclip,
  Mic,
  Square,
  Sparkles,
  Zap,
  FileText,
  Calculator,
  Users,
  X,
  Upload,
  Eye,
  EyeOff,
  RotateCcw,
  Trash2,
} from "lucide-react";

export interface ChatInterfaceProps {
  messages: Message[];
  onSendMessage: (content: string, files?: File[]) => void;
  onFileUpload?: (files: File[]) => void;
  isTyping?: boolean;
  typingAgentName?: string; // Added for showing which agent is typing
  className?: string;
  // Props for toolbar actions from UX Master Doc
  onClearChat?: () => void;
  onNewChat?: () => void;
  onToggleAdminView?: () => void;
  isAdminView?: boolean;
  // For prompt templates
  promptTemplates?: Array<{ label: string; prompt: string; icon?: React.ElementType }>; 
  onSelectPromptTemplate?: (prompt: string) => void;
  // Chat metadata toggle
  showMetadata?: boolean;
  onToggleMetadata?: () => void;
  // Token count display
  estimatedTokens?: number;
  // Responsive props
  deviceType?: 'mobile' | 'tablet' | 'desktop' | 'wide';
  isMobile?: boolean;
  isTablet?: boolean;
}

// Updated quick actions with better icons and CDO Red theme
const quickActions = [
  {
    icon: FileText,
    label: "Analyze Files",
    prompt: "Please analyze the uploaded project files and extract key information.",
    color: "cdo-red",
  },
  {
    icon: Calculator,
    label: "Generate Estimate",
    prompt: "Create a detailed cost estimate based on the project scope.",
    color: "agent-blue",
  },
  {
    icon: Users,
    label: "Review Team",
    prompt: "Show me the current status of all AI agents and their tasks.",
    color: "agent-teal",
  },
  {
    icon: Zap,
    label: "Quick Summary",
    prompt: "Provide a quick summary of the project status and next steps.",
    color: "agent-green",
  },
];

export function ChatInterface({
  messages,
  onSendMessage,
  onFileUpload,
  isTyping = false,
  typingAgentName = "AI Assistant",
  className,
  onClearChat,
  onNewChat,
  onToggleAdminView,
  isAdminView,
  promptTemplates,
  onSelectPromptTemplate,
  showMetadata = false,
  onToggleMetadata,
  estimatedTokens = 0,
  deviceType = 'desktop',
  isMobile = false,
  isTablet = false,
}: ChatInterfaceProps) {
  const [input, setInput] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Drag and drop handlers
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    handleFilesUploaded(files);
  };

  const handleSend = () => {
    if (!input.trim() && pendingFiles.length === 0) return;

    const currentSessionId = localStorage.getItem("pipSessionId") || 'default-session';
    
    // Log message send action
    auditLogger.logUserAction(
      'message_sent_from_ui',
      `User sent message${pendingFiles.length > 0 ? ` with ${pendingFiles.length} files` : ''}: "${input.substring(0, 100)}${input.length > 100 ? '...' : ''}"`,
      currentSessionId
    );

    onSendMessage(input, pendingFiles.length > 0 ? pendingFiles : undefined);
    setInput("");
    setPendingFiles([]);
    setShowFileUpload(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleQuickAction = (prompt: string, label?: string) => {
    const currentSessionId = localStorage.getItem("pipSessionId") || 'default-session';
    auditLogger.logUserAction(
      'quick_action_selected',
      `User selected quick action${label ? ` "${label}"` : ''}: "${prompt.substring(0, 50)}${prompt.length > 50 ? '...' : ''}"`,
      currentSessionId
    );
    
    if (onSelectPromptTemplate) {
      onSelectPromptTemplate(prompt);
    } else {
      onSendMessage(prompt);
    }
  };

  const handleTemplateSelect = (template: PromptTemplate) => {
    const currentSessionId = localStorage.getItem("pipSessionId") || 'default-session';
    auditLogger.logUserAction(
      'template_selected',
      `User selected template: "${template.label}"`,
      currentSessionId
    );
    
    if (onSelectPromptTemplate) {
      onSelectPromptTemplate(template.prompt);
    } else {
      setInput(template.prompt);
      textareaRef.current?.focus();
    }
  };

  const handleFilesUploaded = (files: File[]) => {
    const currentSessionId = localStorage.getItem("pipSessionId") || 'default-session';
    
    // Log file upload to audit logger
    auditLogger.logUserAction(
      'files_added_to_ui',
      `User added ${files.length} file(s) to the UI: ${files.map(f => f.name).join(', ')}`,
      currentSessionId
    );
    
    setPendingFiles((prev) => [...prev, ...files]);
    onFileUpload?.(files);
  };

  const removePendingFile = (index: number) => {
    const fileToRemove = pendingFiles[index];
    if (fileToRemove) {
      const currentSessionId = localStorage.getItem("pipSessionId") || 'default-session';
      
      // Log file removal to audit logger
      auditLogger.logUserAction(
        'file_removed_from_ui',
        `User removed file from upload queue: ${fileToRemove.name}`,
        currentSessionId
      );
    }
    
    setPendingFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleClearChat = () => {
    if (messages.length > 0) {
      setShowClearConfirm(true);
    }
  };

  const confirmClearChat = () => {
    onClearChat?.();
    setShowClearConfirm(false);
  };

  // Calculate input token estimate (rough approximation)
  const inputTokenEstimate = Math.ceil(input.length / 4);

  return (
    <div 
      className={cn("flex flex-col h-full bg-white dark:bg-slate-900 relative", className)}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      role="main"
      aria-label="AI Project Intelligence Chat Interface"
    >
      {/* Enhanced File Upload Overlay - Responsive */}
      <FileUploadOverlay
        isVisible={isDragOver || showFileUpload}
        onClose={() => {
          setIsDragOver(false);
          setShowFileUpload(false);
        }}
        onFilesDrop={handleFilesUploaded}
        acceptedTypes={['.pdf', '.docx', '.txt', '.png', '.jpg', '.jpeg']}
        maxFileSize={10}
        isMobile={isMobile}
      />

      {/* Chat Header Toolbar - Responsive */}
      <div className={cn(
        "flex items-center justify-between border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800",
        // Responsive padding
        isMobile ? "p-3" : "p-4"
      )}>
        <div className="flex items-center gap-2 sm:gap-3">
          <h2 className={cn(
            "font-semibold text-slate-800 dark:text-slate-200",
            // Responsive typography
            isMobile ? "text-base" : "text-lg"
          )}>
            {isMobile ? "Chat" : "Project Chat"}
          </h2>
          {messages.length > 0 && !isMobile && (
            <Badge variant="outline" className="text-xs" aria-label={`${messages.length} messages in conversation`}>
              {messages.length} messages
            </Badge>
          )}
        </div>
        
        <div className={cn(
          "flex items-center",
          isMobile ? "gap-1" : "gap-2"
        )}>
          {onToggleMetadata && !isMobile && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleMetadata}
              className="text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 focus-visible:ring-cdo-red"
              title={showMetadata ? "Hide metadata" : "Show metadata"}
              aria-label={showMetadata ? "Hide message metadata" : "Show message metadata"}
            >
              {showMetadata ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              <span className="ml-1 text-xs">Metadata</span>
            </Button>
          )}
          
          {onNewChat && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onNewChat}
              className={cn(
                "text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 focus-visible:ring-cdo-red",
                // Touch-optimized sizing on mobile
                isMobile && "h-9 w-9 p-0"
              )}
              title="New chat"
              aria-label="Start new chat conversation"
            >
              <RotateCcw className={cn(isMobile ? "w-4 h-4" : "w-4 h-4")} />
            </Button>
          )}
          
          {onClearChat && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearChat}
              disabled={messages.length === 0}
              className={cn(
                "text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 focus-visible:ring-cdo-red disabled:opacity-50 disabled:cursor-not-allowed",
                // Touch-optimized sizing on mobile
                isMobile && "h-9 w-9 p-0"
              )}
              title="Clear chat"
              aria-label="Clear all messages in current chat"
            >
              <Trash2 className={cn(isMobile ? "w-4 h-4" : "w-4 h-4")} />
            </Button>
          )}
        </div>
      </div>

      {/* Chat Messages - Responsive */}
      <div 
        className={cn(
          "flex-1 overflow-y-auto space-y-4 bg-gray-50 dark:bg-slate-900",
          // Responsive padding
          isMobile ? "p-4" : "p-6",
          // Responsive spacing
          isMobile ? "space-y-4" : "space-y-6"
        )}
        role="log"
        aria-label="Chat conversation history"
        aria-live="polite"
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center" role="banner">
            <div className={cn(
              "rounded-full bg-gradient-to-br from-cdo-red to-cdo-red/70 shadow-lg flex items-center justify-center mb-6",
              // Responsive sizing
              isMobile ? "w-16 h-16" : "w-24 h-24"
            )}>
              <Sparkles className={cn("text-white", isMobile ? "w-8 h-8" : "w-12 h-12")} />
            </div>
            <h2 className={cn(
              "font-bold text-slate-800 dark:text-slate-200 mb-3",
              // Responsive typography
              isMobile ? "text-xl" : "text-3xl"
            )}>
              Welcome to PIP AI
            </h2>
            <p className={cn(
              "text-slate-600 dark:text-slate-400 mb-8 max-w-md leading-relaxed",
              // Responsive typography
              isMobile ? "text-sm px-4" : "text-base"
            )}>
              Your project intelligence platform. Upload files, ask questions,
              and get intelligent insights about your construction projects.
            </p>

            {/* Enhanced Quick Actions Grid - Responsive */}
            <div className={cn(
              "gap-4 max-w-md w-full",
              // Responsive grid layout
              isMobile ? "grid grid-cols-1" : "grid grid-cols-2"
            )}>
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <Button
                    key={action.label}
                    variant="outline"
                    className={cn(
                      "h-auto bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-cdo-red hover:bg-cdo-red/5 dark:hover:bg-cdo-red/10 transition-all duration-200 flex flex-col gap-3 shadow-sm hover:shadow-md focus-visible:ring-cdo-red",
                      // Responsive padding and sizing
                      isMobile ? "p-4 min-h-[60px]" : "p-6"
                    )}
                    onClick={() => handleQuickAction(action.prompt, action.label)}
                    aria-label={`Quick action: ${action.label}`}
                  >
                    <Icon className={cn("text-cdo-red", isMobile ? "w-6 h-6" : "w-8 h-8")} />
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      {action.label}
                    </span>
                  </Button>
                );
              })}
            </div>
          </div>
        ) : (
          <>
            {messages.map((message, index) => (
              <MessageBubble
                key={message.id}
                message={message}
                showMetadata={showMetadata}
                onToggleMetadata={onToggleMetadata}
                isMobile={isMobile}
                onCopy={() => {
                  navigator.clipboard.writeText(message.content);
                  const currentSessionId = localStorage.getItem("pipSessionId") || 'default-session';
                  const agentName = message.agentType || message.agentName || 'assistant';
                  auditLogger.logUserAction(
                    'message_copied',
                    `User copied message content from ${message.type === 'user' ? 'user' : agentName}`,
                    currentSessionId
                  );
                }}
                onFeedback={(positive) => {
                  console.log("Feedback:", positive);
                  const currentSessionId = localStorage.getItem("pipSessionId") || 'default-session';
                  const agentName = message.agentType || message.agentName || 'assistant';
                  auditLogger.logUserAction(
                    'message_feedback',
                    `User gave ${positive ? 'positive' : 'negative'} feedback to ${agentName} message`,
                    currentSessionId
                  );
                }}
                aria-label={`Message ${index + 1} from ${message.type === 'user' ? 'you' : message.agentName || 'assistant'}`}
              />
            ))}

            {/* Enhanced Typing Indicator */}
            <AnimatePresence>
              {isTyping && (
                <div className="flex gap-4 mb-6" aria-live="polite" aria-label={`${typingAgentName} is typing`}>
                  <AgentTypingIndicator 
                    agentName={typingAgentName}
                    agentType="assistant"
                  />
                </div>
              )}
            </AnimatePresence>
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Enhanced File Upload Area - Responsive */}
      {showFileUpload && (
        <div className={cn(
          "border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800",
          // Responsive padding
          isMobile ? "p-4" : "p-6"
        )}>
          <FileUpload 
            onFilesUploaded={handleFilesUploaded}
            onFileReanalyze={(fileId) => console.log("Reanalyze:", fileId)}
            onFileRemove={(fileId) => console.log("Remove:", fileId)}
            onFilePreview={(file) => console.log("Preview:", file)}
            className="border-2 border-dashed border-cdo-red/50 bg-cdo-red/5 hover:border-cdo-red hover:bg-cdo-red/10 transition-all duration-200 rounded-xl" 
            maxFileSize={75}
            supportedFormats={['.pdf', '.docx', '.xlsx', '.txt', '.jpg', '.jpeg', '.png', '.gif', '.csv']}
            showFileCards={true}
            compressionWarning={true}
            isMobile={isMobile}
          />
        </div>
      )}

      {/* Enhanced Pending Files Display - Responsive */}
      <AnimatePresence>
        {pendingFiles.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className={cn(
              "border-t border-slate-200 dark:border-slate-700 bg-gradient-to-r from-red-50 to-red-100/50 dark:from-red-900/10 dark:to-red-800/10",
              // Responsive padding
              isMobile ? "px-4 py-3" : "px-6 py-4"
            )}
            role="status"
            aria-label={`${pendingFiles.length} files ready to upload`}
          >
            <motion.div 
              initial={{ x: -20 }}
              animate={{ x: 0 }}
              className={cn("flex items-center gap-2", isMobile ? "mb-2" : "mb-3")}
            >
              <Upload className="w-4 h-4 text-cdo-red" />
              <span className={cn(
                "font-medium text-slate-700 dark:text-slate-300",
                isMobile ? "text-xs" : "text-sm"
              )}>
                Ready to upload ({pendingFiles.length} files)
              </span>
            </motion.div>
            <div className="flex flex-wrap gap-2">
              {pendingFiles.map((file, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ delay: index * 0.1 }}
                  layout
                >
                  <Badge
                    variant="outline"
                    className="bg-cdo-red/10 border-cdo-red/30 text-cdo-red pr-1 max-w-xs hover:bg-cdo-red/20 transition-colors"
                  >
                    <span className="truncate">📎 {file.name}</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      className={cn(
                        "ml-2 hover:bg-cdo-red/20 focus-visible:ring-cdo-red",
                        // Touch-optimized sizing
                        isMobile ? "h-5 w-5 p-0" : "h-4 w-4 p-0"
                      )}
                      onClick={() => removePendingFile(index)}
                      aria-label={`Remove ${file.name} from upload queue`}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </Badge>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick Actions (when messages exist) - Responsive */}
      {messages.length > 0 && (
        <div className={cn(
          "border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800",
          // Responsive padding
          isMobile ? "px-4 py-2" : "px-6 py-3"
        )}>
          <div className="flex gap-2 overflow-x-auto" role="toolbar" aria-label="Quick action buttons">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Button
                  key={action.label}
                  variant="outline"
                  size="sm"
                  className={cn(
                    "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-cdo-red hover:bg-cdo-red/5 dark:hover:bg-cdo-red/10 whitespace-nowrap transition-all duration-200 focus-visible:ring-cdo-red",
                    // Touch-optimized sizing on mobile
                    isMobile && "h-9 text-xs"
                  )}
                  onClick={() => handleQuickAction(action.prompt, action.label)}
                  aria-label={`Quick action: ${action.label}`}
                >
                  <Icon className={cn("mr-2 text-cdo-red", isMobile ? "w-3 h-3" : "w-4 h-4")} />
                  {action.label}
                </Button>
              );
            })}
          </div>
        </div>
      )}

      {/* Fixed Input Bar - Responsive and Touch-Optimized */}
      <div className={cn(
        "border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800",
        // Responsive padding
        isMobile ? "p-4" : "p-6"
      )}>
        <div className="relative">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isMobile ? "Ask about your project..." : "Ask about your project, upload files, or request analysis..."}
            className={cn(
              "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 placeholder:text-slate-500 dark:placeholder:text-slate-400 resize-none rounded-xl focus-visible:ring-cdo-red",
              // Responsive sizing and spacing
              isMobile ? "min-h-[80px] pr-36 text-base" : "min-h-[120px] pr-52"
            )}
            maxLength={2000}
            aria-label="Type your message or question"
            aria-describedby="input-help"
          />

          {/* Input Actions - Responsive */}
          <div className={cn(
            "absolute bottom-3 flex items-center",
            // Responsive positioning
            isMobile ? "right-2 gap-1" : "right-3 gap-2"
          )}>
            {/* Prompt Templates Dropdown - Hidden on mobile or simplified */}
            {!isMobile && (
              <PromptTemplatesDropdown
                onSelectTemplate={handleTemplateSelect}
                disabled={false}
                size="sm"
                variant="ghost"
              showCategories={true}
              isAdminMode={isAdminView}
              className="border-slate-200 dark:border-slate-700"
            />
            )}

            {/* File attachment button - Touch optimized */}
            <Button
              size="sm"
              variant="ghost"
              className={cn(
                "hover:bg-slate-100 dark:hover:bg-slate-700 focus-visible:ring-cdo-red",
                // Touch-optimized sizing
                isMobile ? "h-9 w-9 p-0" : "h-8 w-8 p-0"
              )}
              onClick={() => {
                const newState = !showFileUpload;
                const currentSessionId = localStorage.getItem("pipSessionId") || 'default-session';
                auditLogger.logUserAction(
                  'file_upload_panel_toggled',
                  `User ${newState ? 'opened' : 'closed'} file upload panel`,
                  currentSessionId
                );
                setShowFileUpload(newState);
              }}
              title="Attach files"
              aria-label="Attach files to message"
            >
              <Paperclip className={cn("text-slate-600 dark:text-slate-400", isMobile ? "w-5 h-5" : "w-4 h-4")} />
            </Button>

            {/* Voice input button - Touch optimized, hidden on mobile for now */}
            {!isMobile && (
              <Button
                size="sm"
                variant="ghost"
                className={cn(
                  "h-8 w-8 p-0 hover:bg-slate-100 dark:hover:bg-slate-700 focus-visible:ring-cdo-red",
                  isRecording && "bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400",
                )}
                onClick={() => {
                  const newState = !isRecording;
                  const currentSessionId = localStorage.getItem("pipSessionId") || 'default-session';
                  auditLogger.logUserAction(
                    'voice_recording_toggled',
                    `User ${newState ? 'started' : 'stopped'} voice recording`,
                    currentSessionId
                  );
                  setIsRecording(newState);
                }}
                title={isRecording ? "Stop recording" : "Voice input"}
                aria-label={isRecording ? "Stop voice recording" : "Start voice recording"}
              >
                {isRecording ? (
                  <Square className="w-4 h-4" />
                ) : (
                  <Mic className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                )}
              </Button>
            )}

            {/* Send button - Touch optimized */}
            <Button
              size="sm"
              onClick={handleSend}
              disabled={!input.trim() && pendingFiles.length === 0}
              className={cn(
                "bg-cdo-red hover:bg-cdo-red/90 text-white shadow-sm hover:shadow-md transition-all duration-200 focus-visible:ring-cdo-red focus-visible:ring-offset-2",
                // Touch-optimized sizing
                isMobile ? "h-9 px-3" : "h-8 px-4"
              )}
              aria-label="Send message"
            >
              <Send className={cn(isMobile ? "w-5 h-5" : "w-4 h-4")} />
            </Button>
          </div>
        </div>

        {/* Input Status Bar - Responsive */}
        {!isMobile && (
          <div className="flex justify-between items-center mt-3 text-xs text-slate-500 dark:text-slate-400" id="input-help">
            <div className="flex items-center gap-4">
              <span>Press ⌘+Enter to send, Shift+Enter for new line</span>
              {inputTokenEstimate > 0 && (
                <span className="flex items-center gap-1" aria-label={`Estimated ${inputTokenEstimate} tokens for current input`}>
                  <Zap className="w-3 h-3" />
                  ~{inputTokenEstimate} tokens
                </span>
              )}
              {estimatedTokens > 0 && (
                <span aria-label={`Total estimated tokens: ${estimatedTokens}`}>Total: ~{estimatedTokens} tokens</span>
              )}
            </div>
            <span className={cn(
              input.length > 1800 && "text-amber-600 dark:text-amber-400",
              input.length >= 2000 && "text-red-600 dark:text-red-400"
            )} aria-label={`Character count: ${input.length} of 2000`}>
              {input.length}/2000
            </span>
          </div>
        )}
      </div>

      {/* Clear Chat Confirmation Modal */}
      <ConfirmModal
        isOpen={showClearConfirm}
        onClose={() => setShowClearConfirm(false)}
        onConfirm={confirmClearChat}
        title="Clear Chat History"
        description={`Are you sure you want to clear all ${messages.length} messages? This action cannot be undone.`}
        confirmText="Clear Chat"
        cancelText="Cancel"
        variant="destructive"
      />
    </div>
  );
}
