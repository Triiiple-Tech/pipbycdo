"use client"

import React, { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Bot, Sparkles, Zap, Brain, Clock, CheckCircle, AlertCircle } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"

interface StreamingMessageProps {
  content: string
  agent?: string
  isStreaming?: boolean
  streamingStage?: string
  progress?: number
  metadata?: {
    model?: string
    confidence?: number
    processingTime?: number
    tokenCost?: number
  }
  onStreamComplete?: () => void
}

const getAgentStyle = (agent?: string): string => {
  const agentLower = agent?.toLowerCase() || ""
  
  if (agentLower.includes("smartsheet")) {
    return "from-orange-500 to-orange-600"
  } else if (agentLower.includes("file") || agentLower.includes("reader")) {
    return "from-blue-500 to-blue-600"
  } else if (agentLower.includes("estimator")) {
    return "from-green-500 to-green-600"
  } else if (agentLower.includes("takeoff")) {
    return "from-yellow-500 to-yellow-600"
  } else if (agentLower.includes("scope")) {
    return "from-purple-500 to-purple-600"
  } else if (agentLower.includes("exporter")) {
    return "from-indigo-500 to-indigo-600"
  } else if (agentLower.includes("trade") || agentLower.includes("mapper")) {
    return "from-teal-500 to-teal-600"
  } else {
    return "from-[#E60023] to-[#C4001A]"
  }
}

const getAgentIcon = (agent?: string): React.ReactElement => {
  const agentLower = agent?.toLowerCase() || ""
  
  if (agentLower.includes("smartsheet")) {
    return <Zap className="w-4 h-4 text-white" />
  } else if (agentLower.includes("file") || agentLower.includes("reader")) {
    return <Bot className="w-4 h-4 text-white" />
  } else if (agentLower.includes("estimator")) {
    return <Brain className="w-4 h-4 text-white" />
  } else if (agentLower.includes("takeoff")) {
    return <Sparkles className="w-4 h-4 text-white" />
  } else if (agentLower.includes("scope")) {
    return <CheckCircle className="w-4 h-4 text-white" />
  } else if (agentLower.includes("exporter")) {
    return <AlertCircle className="w-4 h-4 text-white" />
  } else if (agentLower.includes("trade") || agentLower.includes("mapper")) {
    return <Zap className="w-4 h-4 text-white" />
  } else {
    return <Bot className="w-4 h-4 text-white" />
  }
}

export function StreamingMessage({
  content,
  agent,
  isStreaming = false,
  streamingStage,
  progress = 0,
  metadata,
  onStreamComplete
}: StreamingMessageProps) {
  const [displayedContent, setDisplayedContent] = useState("")
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isComplete, setIsComplete] = useState(false)

  // Streaming text effect
  useEffect(() => {
    if (!isStreaming) {
      setDisplayedContent(content)
      setIsComplete(true)
      return
    }

    if (currentIndex < content.length) {
      const timer = setTimeout(() => {
        setDisplayedContent(content.slice(0, currentIndex + 1))
        setCurrentIndex(currentIndex + 1)
      }, 20) // Adjust speed as needed

      return () => clearTimeout(timer)
    } else {
      setIsComplete(true)
      onStreamComplete?.()
    }
  }, [content, currentIndex, isStreaming, onStreamComplete])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ 
        type: "spring", 
        stiffness: 300, 
        damping: 30,
        opacity: { duration: 0.2 }
      }}
      className="flex justify-start w-full"
    >
      <Card className="max-w-[85%] p-0 shadow-lg hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-card/95 to-card/90 backdrop-blur-xl">
        {/* Agent Header */}
        <div className="flex items-center space-x-3 p-4 pb-2">
          <motion.div
            className={`w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-br ${getAgentStyle(agent)} shadow-lg`}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            animate={isStreaming ? { 
              boxShadow: [
                "0 0 0 0 rgba(230, 0, 35, 0.4)",
                "0 0 0 10px rgba(230, 0, 35, 0)",
                "0 0 0 0 rgba(230, 0, 35, 0)"
              ]
            } : {}}
            transition={{ 
              duration: 2, 
              repeat: isStreaming ? Infinity : 0,
              ease: "easeInOut"
            }}
          >
            {getAgentIcon(agent)}
          </motion.div>
          
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <Badge
                variant="secondary"
                className="bg-secondary/80 text-secondary-foreground border-border/50 text-xs font-medium"
              >
                {agent || "AI Assistant"}
              </Badge>
              
              {metadata?.confidence && (
                <Badge 
                  variant="outline" 
                  className="bg-muted/50 text-muted-foreground border-border/50 text-xs"
                >
                  {Math.round(metadata.confidence * 100)}% confidence
                </Badge>
              )}
              
              {isStreaming && (
                <motion.div
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="flex items-center space-x-1"
                >
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <span className="text-xs text-green-600 font-medium">Live</span>
                </motion.div>
              )}
            </div>
            
            {streamingStage && (
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-xs text-muted-foreground mt-1"
              >
                {streamingStage}
              </motion.p>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        {isStreaming && progress > 0 && (
          <div className="px-4 pb-2">
            <Progress 
              value={progress} 
              className="h-1.5 bg-muted/30"
            />
            <p className="text-xs text-muted-foreground mt-1 text-right">
              {Math.round(progress)}% complete
            </p>
          </div>
        )}

        {/* Message Content */}
        <div className="px-4 pb-4">
          <div className="text-sm leading-relaxed text-foreground">
            {displayedContent}
            
            {/* Typing cursor */}
            {isStreaming && !isComplete && (
              <motion.span
                animate={{ opacity: [0, 1, 0] }}
                transition={{ duration: 0.8, repeat: Infinity }}
                className="inline-block w-0.5 h-4 bg-primary ml-1"
              />
            )}
          </div>
          
          {/* Metadata */}
          {isComplete && metadata && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              transition={{ delay: 0.5 }}
              className="mt-3 pt-3 border-t border-border/30"
            >
              <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                {metadata.model && (
                  <div className="flex items-center space-x-1">
                    <Brain className="w-3 h-3" />
                    <span>{metadata.model}</span>
                  </div>
                )}
                
                {metadata.processingTime && (
                  <div className="flex items-center space-x-1">
                    <Clock className="w-3 h-3" />
                    <span>{metadata.processingTime}ms</span>
                  </div>
                )}
                
                {metadata.tokenCost && (
                  <div className="flex items-center space-x-1">
                    <Sparkles className="w-3 h-3" />
                    <span>{metadata.tokenCost} tokens</span>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </div>
      </Card>
    </motion.div>
  )
}
