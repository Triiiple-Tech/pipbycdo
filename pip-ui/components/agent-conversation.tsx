"use client"

import React, { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Bot, 
  FileText, 
  Search, 
  Calculator, 
  DollarSign, 
  Upload, 
  Database,
  Zap,
  Brain,
  MessageCircle,
  ArrowRight,
  Clock,
  CheckCircle
} from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

interface AgentMessage {
  id: string
  agent: string
  content: string
  timestamp: Date
  type: 'thinking' | 'action' | 'result' | 'handoff'
  targetAgent?: string
  metadata?: {
    confidence?: number
    processingTime?: number
    progress?: number
  }
}

interface AgentConversationProps {
  messages: AgentMessage[]
  isActive?: boolean
  currentAgent?: string
  className?: string
}

const agentConfig = {
  'Manager Agent': {
    color: 'from-red-500 to-red-600',
    icon: <Brain className="w-4 h-4 text-white" />,
    initials: 'MA',
    role: 'Orchestrator'
  },
  'File Reader Agent': {
    color: 'from-blue-500 to-blue-600',
    icon: <FileText className="w-4 h-4 text-white" />,
    initials: 'FR',
    role: 'Document Parser'
  },
  'Trade Mapper Agent': {
    color: 'from-teal-500 to-teal-600',
    icon: <Search className="w-4 h-4 text-white" />,
    initials: 'TM',
    role: 'Trade Classifier'
  },
  'Scope Agent': {
    color: 'from-purple-500 to-purple-600',
    icon: <Zap className="w-4 h-4 text-white" />,
    initials: 'SC',
    role: 'Scope Analyzer'
  },
  'Takeoff Agent': {
    color: 'from-yellow-500 to-yellow-600',
    icon: <Calculator className="w-4 h-4 text-white" />,
    initials: 'TO',
    role: 'Quantity Calculator'
  },
  'Estimator Agent': {
    color: 'from-green-500 to-green-600',
    icon: <DollarSign className="w-4 h-4 text-white" />,
    initials: 'ES',
    role: 'Cost Estimator'
  },
  'Exporter Agent': {
    color: 'from-indigo-500 to-indigo-600',
    icon: <Upload className="w-4 h-4 text-white" />,
    initials: 'EX',
    role: 'Report Generator'
  },
  'Smartsheet Agent': {
    color: 'from-orange-500 to-orange-600',
    icon: <Database className="w-4 h-4 text-white" />,
    initials: 'SS',
    role: 'Data Sync'
  }
}

const getMessageTypeStyle = (type: string) => {
  switch (type) {
    case 'thinking':
      return 'border-l-4 border-l-blue-400 bg-blue-50/50 dark:bg-blue-950/20'
    case 'action':
      return 'border-l-4 border-l-yellow-400 bg-yellow-50/50 dark:bg-yellow-950/20'
    case 'result':
      return 'border-l-4 border-l-green-400 bg-green-50/50 dark:bg-green-950/20'
    case 'handoff':
      return 'border-l-4 border-l-purple-400 bg-purple-50/50 dark:bg-purple-950/20'
    default:
      return 'border-l-4 border-l-gray-400 bg-gray-50/50 dark:bg-gray-950/20'
  }
}

const getMessageTypeIcon = (type: string) => {
  switch (type) {
    case 'thinking':
      return <Brain className="w-3 h-3 text-blue-500" />
    case 'action':
      return <Zap className="w-3 h-3 text-yellow-500" />
    case 'result':
      return <CheckCircle className="w-3 h-3 text-green-500" />
    case 'handoff':
      return <ArrowRight className="w-3 h-3 text-purple-500" />
    default:
      return <MessageCircle className="w-3 h-3 text-gray-500" />
  }
}

export function AgentConversation({
  messages,
  isActive = false,
  currentAgent,
  className = ""
}: AgentConversationProps) {
  const [visibleMessages, setVisibleMessages] = useState<AgentMessage[]>([])
  const [typingAgent, setTypingAgent] = useState<string | null>(null)

  // Simulate real-time message streaming
  useEffect(() => {
    if (messages.length === 0) return

    let messageIndex = 0
    const showNextMessage = () => {
      if (messageIndex < messages.length) {
        const message = messages[messageIndex]
        
        // Show typing indicator
        setTypingAgent(message.agent)
        
        setTimeout(() => {
          setVisibleMessages(prev => [...prev, message])
          setTypingAgent(null)
          messageIndex++
          
          // Continue to next message after a delay
          if (messageIndex < messages.length) {
            setTimeout(showNextMessage, 1500 + Math.random() * 1000)
          }
        }, 800 + Math.random() * 1200) // Realistic typing delay
      }
    }

    // Reset and start streaming
    setVisibleMessages([])
    showNextMessage()
  }, [messages])

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center space-x-3 mb-6">
        <div className="flex items-center space-x-2">
          <motion.div
            animate={isActive ? { 
              boxShadow: [
                "0 0 0 0 rgba(59, 130, 246, 0.4)",
                "0 0 0 8px rgba(59, 130, 246, 0)",
                "0 0 0 0 rgba(59, 130, 246, 0)"
              ]
            } : {}}
            transition={{ duration: 2, repeat: isActive ? Infinity : 0 }}
            className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center"
          >
            <MessageCircle className="w-4 h-4 text-white" />
          </motion.div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Agent Collaboration</h3>
            <p className="text-xs text-muted-foreground">
              {isActive ? 'Agents are working together...' : 'Collaboration complete'}
            </p>
          </div>
        </div>
        
        {currentAgent && (
          <Badge variant="outline" className="ml-auto">
            Active: {currentAgent}
          </Badge>
        )}
      </div>

      {/* Messages */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        <AnimatePresence>
          {visibleMessages.map((message, index) => {
            const agent = agentConfig[message.agent as keyof typeof agentConfig]
            
            return (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ 
                  type: "spring", 
                  stiffness: 300, 
                  damping: 30,
                  delay: index * 0.1
                }}
                className="flex items-start space-x-3"
              >
                {/* Agent Avatar */}
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  className={`w-8 h-8 rounded-full bg-gradient-to-br ${agent?.color || 'from-gray-400 to-gray-500'} flex items-center justify-center shadow-lg flex-shrink-0`}
                >
                  {agent?.icon || <Bot className="w-4 h-4 text-white" />}
                </motion.div>

                {/* Message Content */}
                <div className="flex-1 min-w-0">
                  <Card className={`p-3 ${getMessageTypeStyle(message.type)} border-0 shadow-sm`}>
                    {/* Message Header */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-medium text-foreground">
                          {message.agent}
                        </span>
                        <div className="flex items-center space-x-1">
                          {getMessageTypeIcon(message.type)}
                          <span className="text-xs text-muted-foreground capitalize">
                            {message.type}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                        {message.metadata?.processingTime && (
                          <div className="flex items-center space-x-1">
                            <Clock className="w-3 h-3" />
                            <span>{message.metadata.processingTime}ms</span>
                          </div>
                        )}
                        <span>{message.timestamp.toLocaleTimeString()}</span>
                      </div>
                    </div>

                    {/* Message Text */}
                    <p className="text-sm text-foreground leading-relaxed">
                      {message.content}
                    </p>

                    {/* Handoff Arrow */}
                    {message.type === 'handoff' && message.targetAgent && (
                      <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center space-x-2 mt-2 pt-2 border-t border-border/30"
                      >
                        <ArrowRight className="w-4 h-4 text-purple-500" />
                        <span className="text-xs text-muted-foreground">
                          Handing off to <strong>{message.targetAgent}</strong>
                        </span>
                      </motion.div>
                    )}

                    {/* Progress Bar */}
                    {message.metadata?.progress !== undefined && (
                      <div className="mt-2 pt-2 border-t border-border/30">
                        <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                          <span>Progress</span>
                          <span>{Math.round(message.metadata.progress)}%</span>
                        </div>
                        <div className="w-full bg-muted/30 rounded-full h-1.5">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${message.metadata.progress}%` }}
                            transition={{ duration: 1, ease: "easeOut" }}
                            className="bg-gradient-to-r from-blue-500 to-purple-500 h-1.5 rounded-full"
                          />
                        </div>
                      </div>
                    )}
                  </Card>
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>

        {/* Typing Indicator */}
        {typingAgent && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-start space-x-3"
          >
            <motion.div
              animate={{ 
                boxShadow: [
                  "0 0 0 0 rgba(59, 130, 246, 0.4)",
                  "0 0 0 6px rgba(59, 130, 246, 0)",
                  "0 0 0 0 rgba(59, 130, 246, 0)"
                ]
              }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className={`w-8 h-8 rounded-full bg-gradient-to-br ${
                agentConfig[typingAgent as keyof typeof agentConfig]?.color || 'from-gray-400 to-gray-500'
              } flex items-center justify-center shadow-lg flex-shrink-0`}
            >
              {agentConfig[typingAgent as keyof typeof agentConfig]?.icon || <Bot className="w-4 h-4 text-white" />}
            </motion.div>

            <Card className="p-3 border-0 shadow-sm bg-muted/30">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-medium text-foreground">
                  {typingAgent}
                </span>
                <span className="text-xs text-muted-foreground">is thinking...</span>
              </div>
              
              <div className="flex space-x-1 mt-2">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="w-2 h-2 bg-muted-foreground/60 rounded-full"
                    animate={{ y: [0, -4, 0] }}
                    transition={{
                      duration: 0.6,
                      repeat: Infinity,
                      delay: i * 0.2,
                    }}
                  />
                ))}
              </div>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  )
}
