import { cn } from "@/lib/utils";
import { AgentAvatar, AgentType, AgentStatus } from "./AgentAvatar";
import { CostBadge, ModelType } from "./CostBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Copy, ThumbsUp, ThumbsDown, MoreHorizontal, Info, Eye, EyeOff, Clock, Zap, Bot, User } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useState } from "react";
import { motion, AnimatePresence } from 'framer-motion';
import { FileCard, FileCardData } from "./FileCard"; // Import FileCard
import { useAdminConfig } from "@/contexts/AdminConfigContext";

export interface MessageAttachment {
  name: string;
  size?: number;
  type?: string;
  status?: "queued" | "parsing" | "done" | "error";
  // Add other relevant file metadata if needed, e.g., a previewUrl
}

export interface Message {
  id: string;
  type: "user" | "agent" | "system";
  content: string;
  timestamp: Date;
  attachments?: MessageAttachment[];
  // Optional fields from UX Enhancement Master Doc & Index.tsx usage
  sender?: string; // Retained from previous, though 'type' seems primary
  isLoading?: boolean;
  agentName?: string;
  modelUsed?: ModelType;
  cost?: number;
  duration?: number; // Added from UX doc, if applicable to a message
  agentType?: AgentType; // For styling/iconography based on agent role
  agentStatus?: AgentStatus; // For status indicators on agent messages
  debugInfo?: any; // For collapsible debug metadata
  isFileCard?: boolean; // To render message as a file card
  onReanalyze?: (fileId: string) => void; // Interaction for file cards
  onRemoveFile?: (fileId: string) => void; // Interaction for file cards
  error?: string | null; // For displaying errors in the message bubble
}

interface MessageBubbleProps {
  message: Message;
  onCopy?: () => void;
  onFeedback?: (positive: boolean) => void;
  showMetadata?: boolean;
  onToggleMetadata?: () => void;
  className?: string;
  isGrouped?: boolean; // New prop for message grouping
  isLastInGroup?: boolean; // New prop for bubble tails
  showAgentTyping?: boolean; // New prop for typing indicators
  isMobile?: boolean; // Responsive prop
}

export function MessageBubble({
  message,
  onCopy,
  onFeedback,
  showMetadata = false,
  onToggleMetadata,
  className,
  isGrouped = false,
  isLastInGroup = true,
  showAgentTyping = false,
  isMobile = false,
}: MessageBubbleProps) {
  const [localShowMetadata, setLocalShowMetadata] = useState(false);
  const isUser = message.type === "user";
  const isSystem = message.type === "system";
  
  // Get admin configuration for cost display
  const { config } = useAdminConfig();

  // Use global metadata toggle or local state
  const metadataVisible = showMetadata || localShowMetadata;

  // Enhanced agent styling with glassmorphism
  const getAgentStyling = () => {
    if (isUser) {
      return {
        background: "bg-gradient-to-br from-slate-600 to-slate-700",
        border: "border-slate-500/30",
        text: "text-white",
        glow: "shadow-glow-slate",
        backdrop: "backdrop-blur-xl bg-white/10"
      };
    }
    
    switch (message.agentType) {
      case "manager":
        return {
          background: "bg-gradient-to-br from-purple-500/20 to-purple-600/10",
          border: "border-purple-400/30",
          text: "text-purple-900 dark:text-purple-100",
          glow: "shadow-glow-purple",
          backdrop: "backdrop-blur-xl bg-purple-50/80 dark:bg-purple-900/20"
        };
      case "file-reader":
        return {
          background: "bg-gradient-to-br from-teal-500/20 to-teal-600/10",
          border: "border-teal-400/30",
          text: "text-teal-900 dark:text-teal-100",
          glow: "shadow-glow-teal",
          backdrop: "backdrop-blur-xl bg-teal-50/80 dark:bg-teal-900/20"
        };
      case "estimator":
        return {
          background: "bg-gradient-to-br from-green-500/20 to-green-600/10",
          border: "border-green-400/30",
          text: "text-green-900 dark:text-green-100",
          glow: "shadow-glow-green",
          backdrop: "backdrop-blur-xl bg-green-50/80 dark:bg-green-900/20"
        };
      default:
        return {
          background: "bg-gradient-to-br from-blue-500/20 to-blue-600/10",
          border: "border-blue-400/30",
          text: "text-blue-900 dark:text-blue-100",
          glow: "shadow-glow-blue",
          backdrop: "backdrop-blur-xl bg-blue-50/80 dark:bg-blue-900/20"
        };
    }
  };

  const styling = getAgentStyling();

  if (isSystem) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className={cn("flex justify-center my-6", className)}
      >
        <Badge
          variant="outline"
          className="bg-slate-100/80 backdrop-blur-sm dark:bg-slate-800/80 border-slate-300/50 dark:border-slate-700/50 text-slate-600 dark:text-slate-300 text-xs px-4 py-2 rounded-full shadow-soft"
        >
          {message.content}
        </Badge>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ 
        duration: 0.4, 
        ease: "easeOut",
        type: "spring",
        stiffness: 100,
        damping: 15
      }}
      className={cn(
        "flex gap-4 group",
        isUser ? "flex-row-reverse" : "flex-row",
        isGrouped ? "mb-2" : "mb-6", // Closer spacing for grouped messages
        className,
      )}
    >
      {/* Enhanced Agent Avatar with floating animation */}
      {!isUser && message.agentType && !isGrouped && (
        <div className="flex-shrink-0 animate-float">
          <AgentAvatar
            type={message.agentType}
            status={message.agentStatus || "idle"}
            name={message.agentName || message.agentType}
            role={message.agentType}
            model={message.modelUsed}
            size="md"
            showLabel={false}
            className="ring-2 ring-white/50 shadow-glow"
          />
        </div>
      )}

      {/* Spacer for grouped messages */}
      {!isUser && isGrouped && (
        <div className="flex-shrink-0 w-12" />
      )}

      {/* Enhanced User Avatar with gradient */}
      {isUser && (
        <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-slate-500 to-slate-600 flex items-center justify-center text-white font-semibold shadow-glow ring-2 ring-white/30">
          <User className="w-5 h-5" />
        </div>
      )}

      <div
        className={cn(
          "flex flex-col gap-2 max-w-[75%] min-w-0",
          isUser ? "items-end" : "items-start",
        )}
      >
        {/* Agent Badge - only show for non-grouped messages */}
        {!isUser && !isGrouped && message.agentName && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1, duration: 0.3 }}
            className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/60 backdrop-blur-sm border border-white/30 shadow-soft"
          >
            <Bot className="w-3 h-3 text-purple-600" />
            <span className="text-xs font-semibold text-purple-900">{message.agentName} Agent</span>
            {showAgentTyping && (
              <div className="flex items-center gap-1">
                <motion.div 
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 1 }}
                  className="w-1 h-1 bg-purple-500 rounded-full" 
                />
                <motion.div 
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 1, delay: 0.2 }}
                  className="w-1 h-1 bg-purple-500 rounded-full" 
                />
                <motion.div 
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 1, delay: 0.4 }}
                  className="w-1 h-1 bg-purple-500 rounded-full" 
                />
              </div>
            )}
          </motion.div>
        )}

        {/* Enhanced Message Content Bubble with glassmorphism */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.4, ease: "easeOut" }}
          whileHover={{ scale: 1.02, y: -2 }}
          className={cn(
            "rounded-2xl px-5 py-4 border-2 transition-all duration-300 relative overflow-hidden cursor-default",
            styling.background,
            styling.border,
            styling.text,
            styling.backdrop,
            // Add bubble tail for last message in group
            isLastInGroup && !isUser && "rounded-bl-lg",
            isLastInGroup && isUser && "rounded-br-lg",
          )}
        >
          {/* Glassmorphism overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-white/5 rounded-2xl" />
          
          {/* Shimmer effect */}
          <div className="absolute inset-0 shimmer-gradient rounded-2xl opacity-30" />

          {/* Message text content */}
          <div className="relative z-10 text-sm leading-relaxed whitespace-pre-wrap break-words">
            {message.isLoading ? (
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="animate-spin w-4 h-4 border-2 border-current/30 border-t-current rounded-full"></div>
                  <div className="absolute inset-0 animate-ping w-4 h-4 border border-current/20 rounded-full"></div>
                </div>
                <span className="animate-pulse">Generating response...</span>
              </div>
            ) : (
              message.content
            )}
          </div>

          {/* Enhanced error display */}
          {message.error && (
            <div className="relative z-10 mt-3 p-3 bg-red-500/10 backdrop-blur-sm border border-red-400/30 rounded-lg animate-shake">
              <div className="text-sm text-red-600 dark:text-red-400 flex items-center gap-2">
                <span className="text-red-500">⚠️</span>
                <strong>Error:</strong> {message.error}
              </div>
            </div>
          )}

          {/* Enhanced file attachments */}
          {message.attachments && message.attachments.length > 0 && (
            <div className="relative z-10 flex flex-wrap gap-2 mt-3">
              {message.attachments.map((attachment, index) => {
                // Convert MessageAttachment to FileCardData
                const fileCardData: FileCardData = {
                  id: `${message.id}-${index}`,
                  name: attachment.name,
                  size: attachment.size,
                  type: attachment.type,
                  status: attachment.status,
                  uploadedAt: message.timestamp,
                };

                return (
                  <FileCard
                    key={index}
                    file={fileCardData}
                    compact={true}
                    className="text-xs backdrop-blur-sm transition-all duration-300"
                    onReanalyze={message.onReanalyze}
                    onRemove={message.onRemoveFile}
                    onCompress={(file) => {
                      // Handle compression for files in message attachments
                      console.log(`Compressing file ${file.name} from message`);
                    }}
                  />
                );
              })}
            </div>
          )}

          {/* Enhanced message actions */}
          <div className={cn(
            "absolute top-3 opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:translate-y-0 translate-y-2",
            isUser ? "left-3" : "right-3"
          )}>
            <div className="flex items-center gap-1 bg-white/80 backdrop-blur-sm rounded-lg p-1 shadow-soft border border-white/30">
              {onToggleMetadata && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 w-7 p-0 hover:bg-black/10 transition-all duration-200 hover:scale-110"
                  onClick={() => setLocalShowMetadata(!localShowMetadata)}
                  title="Toggle metadata"
                >
                  {metadataVisible ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                </Button>
              )}
              <Button
                size="sm"
                variant="ghost"
                className="h-7 w-7 p-0 hover:bg-black/10 transition-all duration-200 hover:scale-110"
                onClick={onCopy}
                title="Copy message"
              >
                <Copy className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Enhanced metadata with better visual hierarchy */}
        <AnimatePresence>
          {metadataVisible && (
            <motion.div 
              initial={{ opacity: 0, height: 0, scale: 0.8 }}
              animate={{ opacity: 1, height: "auto", scale: 1 }}
              exit={{ opacity: 0, height: 0, scale: 0.8 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className={cn(
                "flex flex-wrap items-center gap-3 text-xs px-2 py-2 rounded-lg bg-white/40 backdrop-blur-sm border border-white/30 shadow-soft overflow-hidden",
                isUser ? "flex-row-reverse" : "flex-row"
              )}
            >
            {/* Timestamp with icon */}
            <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
              <Clock className="w-3 h-3" />
              <span className="font-medium">{formatDistanceToNow(message.timestamp, { addSuffix: true })}</span>
            </div>

            {/* Enhanced model badge */}
            {message.modelUsed && (
              <Badge 
                variant="outline" 
                className="text-xs border-purple-300/50 bg-purple-100/80 text-purple-700 backdrop-blur-sm"
              >
                <Zap className="w-3 h-3 mr-1" />
                {message.modelUsed}
              </Badge>
            )}

            {/* Enhanced cost badge */}
            {config.costDisplay.enabled && !isUser && message.cost !== undefined && message.duration !== undefined && message.modelUsed && (
              <CostBadge
                model={message.modelUsed}
                cost={message.cost}
                duration={message.duration}
                className="backdrop-blur-sm"
                format={config.costDisplay.format}
              />
            )}

            {/* Enhanced feedback buttons */}
            {!isUser && onFeedback && (
              <div className="flex items-center gap-1 ml-2 bg-white/60 rounded-lg p-1 backdrop-blur-sm">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0 hover:bg-green-100/80 transition-all duration-200 hover:scale-110"
                  onClick={() => onFeedback(true)}
                  title="Good response"
                >
                  <ThumbsUp className="w-3 h-3 text-green-600" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0 hover:bg-red-100/80 transition-all duration-200 hover:scale-110"
                  onClick={() => onFeedback(false)}
                  title="Poor response"
                >
                  <ThumbsDown className="w-3 h-3 text-red-600" />
                </Button>
              </div>
            )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
