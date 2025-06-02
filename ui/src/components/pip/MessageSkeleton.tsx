import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface MessageSkeletonProps {
  isUser?: boolean;
  className?: string;
}

export function MessageSkeleton({ isUser = false, className }: MessageSkeletonProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "flex gap-4",
        isUser ? "flex-row-reverse" : "flex-row",
        className
      )}
      role="status"
      aria-label={`Loading ${isUser ? 'your' : 'assistant'} message`}
    >
      {/* Enhanced Avatar skeleton with pulse effect */}
      {!isUser && (
        <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 animate-pulse relative overflow-hidden">
          <div className="absolute inset-0 shimmer-gradient rounded-full" />
        </div>
      )}
      
      {isUser && (
        <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-slate-300 to-slate-400 animate-pulse relative overflow-hidden">
          <div className="absolute inset-0 shimmer-gradient rounded-full" />
        </div>
      )}

      <div className={cn(
        "flex flex-col gap-2 max-w-[75%] min-w-0",
        isUser ? "items-end" : "items-start"
      )}>
        {/* Agent badge skeleton - only for agent messages */}
        {!isUser && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="h-6 w-32 bg-gradient-to-r from-slate-200 to-slate-300 rounded-full animate-pulse relative overflow-hidden"
          >
            <div className="absolute inset-0 shimmer-gradient rounded-full" />
          </motion.div>
        )}

        {/* Enhanced Message bubble skeleton */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className={cn(
            "rounded-2xl px-5 py-4 min-h-[60px] w-full max-w-md relative overflow-hidden",
            isUser
              ? "bg-gradient-to-br from-slate-300 to-slate-400 rounded-br-lg"
              : "bg-gradient-to-br from-slate-200 to-slate-300 rounded-bl-lg"
          )}
        >
          {/* Shimmer overlay */}
          <div className="absolute inset-0 shimmer-gradient rounded-2xl" />
          
          {/* Enhanced Text lines skeleton */}
          <div className="space-y-2 relative z-10">
            <div className="h-4 bg-slate-300/70 rounded w-3/4 animate-pulse" />
            <div className="h-4 bg-slate-300/70 rounded w-1/2 animate-pulse" />
            <div className="h-4 bg-slate-300/70 rounded w-5/6 animate-pulse" />
          </div>

          {/* Enhanced Typing dots animation */}
          <div className="flex items-center gap-1 mt-3 relative z-10">
            <motion.div
              animate={{ 
                scale: [1, 1.3, 1],
                opacity: [0.5, 1, 0.5]
              }}
              transition={{ repeat: Infinity, duration: 1.2 }}
              className="w-2 h-2 bg-cdo-red/70 rounded-full"
            />
            <motion.div
              animate={{ 
                scale: [1, 1.3, 1],
                opacity: [0.5, 1, 0.5]
              }}
              transition={{ repeat: Infinity, duration: 1.2, delay: 0.2 }}
              className="w-2 h-2 bg-cdo-red/70 rounded-full"
            />
            <motion.div
              animate={{ 
                scale: [1, 1.3, 1],
                opacity: [0.5, 1, 0.5]
              }}
              transition={{ repeat: Infinity, duration: 1.2, delay: 0.4 }}
              className="w-2 h-2 bg-cdo-red/70 rounded-full"
            />
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

// Enhanced typing indicator for agent responses with CDO Red branding
export function AgentTypingIndicator({ agentName = "Agent", agentType = "assistant" }: { agentName?: string; agentType?: string }) {
  const getAgentColor = () => {
    switch (agentType) {
      case "manager": return "text-purple-600 bg-purple-50 border-purple-200";
      case "file-reader": return "text-agent-teal bg-teal-50 border-teal-200";
      case "estimator": return "text-agent-green bg-green-50 border-green-200";
      default: return "text-agent-blue bg-blue-50 border-blue-200";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
      className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-white/90 backdrop-blur-sm border border-white/50 shadow-soft max-w-xs relative overflow-hidden"
      role="status"
      aria-label={`${agentName} is typing a response`}
      aria-live="polite"
    >
      {/* Shimmer background */}
      <div className="absolute inset-0 shimmer-gradient rounded-2xl opacity-30" />
      
      <div className={cn("w-8 h-8 rounded-full flex items-center justify-center border relative z-10", getAgentColor())}>
        <span className="text-xs font-semibold">{agentName.charAt(0)}</span>
        {/* Pulsing ring */}
        <div className="absolute inset-0 rounded-full animate-ping border border-current opacity-20" />
      </div>
      
      <div className="flex flex-col relative z-10">
        <span className="text-xs font-medium text-slate-700">{agentName} is typing</span>
        <div className="flex items-center gap-1 mt-1">
          <motion.div
            animate={{ 
              scale: [1, 1.5, 1], 
              opacity: [0.3, 1, 0.3] 
            }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="w-1.5 h-1.5 rounded-full bg-cdo-red"
          />
          <motion.div
            animate={{ 
              scale: [1, 1.5, 1], 
              opacity: [0.3, 1, 0.3] 
            }}
            transition={{ repeat: Infinity, duration: 1.5, delay: 0.3 }}
            className="w-1.5 h-1.5 rounded-full bg-cdo-red"
          />
          <motion.div
            animate={{ 
              scale: [1, 1.5, 1], 
              opacity: [0.3, 1, 0.3] 
            }}
            transition={{ repeat: Infinity, duration: 1.5, delay: 0.6 }}
            className="w-1.5 h-1.5 rounded-full bg-cdo-red"
          />
        </div>
      </div>
    </motion.div>
  );
}
