"use client"

import type React from "react"
import { MessageSquare, X } from "lucide-react"

import { useState, useRef, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Paperclip, Bot, User, ChevronDown, Clock, DollarSign, Cpu, Upload, Link, FileText, Zap, Calculator, Search, Database } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { FloatingInputDock } from "@/components/floating-input-dock"
import { AdminPanel } from "@/components/admin-panel"
import { StepwisePresenter } from "@/components/stepwise-presenter"
import { FormattedMessageContent } from "@/components/formatted-message-content"
import { FileSelectionCard } from "@/components/chat/FileSelectionCard"
import { AgentConversation } from "@/components/agent-conversation"
import { StreamingMessage } from "@/components/streaming-message"
import { parseMessageForInteractivity, cleanMessageContent } from "@/utils/messageParser"
import { toast } from "sonner"

// Import our new API services and hooks
import { useChatSessions, useFileUpload, useMutation } from "@/hooks/useApi"
import { useDirectSendMessage } from "@/hooks/useDirectApi"
import { chatApi } from "@/services/chatApi"
import { apiClient } from "@/services/api"
import { ChatMessage, ChatSession } from "@/lib/types"

// Updated to use our new ChatMessage type, keeping backwards compatibility
interface Message {
  id: string
  role: "user" | "assistant" // Using 'role' instead of 'type' to match ChatMessage
  content: string
  agent?: string
  timestamp: Date
  tokenCost?: number
  processingTime?: number
  attachments?: File[]
  smartsheetData?: {
    name: string
    url: string
    rows: number
  }
  metadata?: {
    model: string
    confidence: number
    sources: string[]
  }
}

interface EnhancedChatInterfaceProps {
  messages: Message[]
  setMessages: (messages: Message[] | ((prev: Message[]) => Message[])) => void
  isConnected: boolean
  sidebarWidth: number
  showAdmin: boolean
  setShowAdmin: (show: boolean) => void
  activeSessionId?: string | null // Add this prop to receive the active session from parent
}

// Helper functions for agent styling and icons - matching agent-status.tsx
const getAgentStyle = (agent?: string): string => {
  const agentLower = agent?.toLowerCase() || ""
  
  if (agentLower.includes("smartsheet")) {
    return "bg-orange-500"
  } else if (agentLower.includes("file") || agentLower.includes("reader")) {
    return "bg-blue-500"
  } else if (agentLower.includes("estimator")) {
    return "bg-green-600"
  } else if (agentLower.includes("takeoff")) {
    return "bg-yellow-500"
  } else if (agentLower.includes("scope")) {
    return "bg-purple-500"
  } else if (agentLower.includes("exporter")) {
    return "bg-indigo-500"
  } else if (agentLower.includes("trade") || agentLower.includes("mapper")) {
    return "bg-teal-500"
  } else {
    // Default for Manager Agent and others
    return "bg-[#E60023]"
  }
}

const getAgentIcon = (agent?: string): React.ReactElement => {
  const agentLower = agent?.toLowerCase() || ""
  
  if (agentLower.includes("smartsheet")) {
    return <Database className="w-4 h-4 text-white" />
  } else if (agentLower.includes("file") || agentLower.includes("reader")) {
    return <FileText className="w-4 h-4 text-white" />
  } else if (agentLower.includes("estimator")) {
    return <Calculator className="w-4 h-4 text-white" />
  } else if (agentLower.includes("takeoff")) {
    return <Calculator className="w-4 h-4 text-white" />
  } else if (agentLower.includes("scope")) {
    return <Zap className="w-4 h-4 text-white" />
  } else if (agentLower.includes("exporter")) {
    return <Upload className="w-4 h-4 text-white" />
  } else if (agentLower.includes("trade") || agentLower.includes("mapper")) {
    return <Search className="w-4 h-4 text-white" />
  } else {
    // Default for Manager Agent and others
    return <Bot className="w-4 h-4 text-white" />
  }
}

export function EnhancedChatInterface({
  messages,
  setMessages,
  isConnected,
  sidebarWidth,
  showAdmin,
  setShowAdmin,
  activeSessionId,
}: EnhancedChatInterfaceProps) {
  const [input, setInput] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [expandedMetadata, setExpandedMetadata] = useState<string[]>([])
  const [attachedFiles, setAttachedFiles] = useState<File[]>([])
  const [isDragOverChat, setIsDragOverChat] = useState(false)
  const [dragDepth, setDragDepth] = useState(0)
  const [smartsheetUrls, setSmartsheetUrls] = useState<string[]>([])
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)
  const [managerThinking, setManagerThinking] = useState<string | null>(null)
  const [agentProgress, setAgentProgress] = useState<{[key: string]: {substep: string, progress: number}}>({})
  const [workflowState, setWorkflowState] = useState<any>(null)
  const [brainAllocations, setBrainAllocations] = useState<{[key: string]: string}>({})
  const [pendingDecision, setPendingDecision] = useState<any>(null)
  const [errorRecovery, setErrorRecovery] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)

  // API hooks for chat functionality
  const { data: chatSessions, refetch: refetchSessions } = useChatSessions()
  const { uploadFiles } = useFileUpload()
  const { sendMessage: directSendMessage, loading: sendingMessage, error: sendError } = useDirectSendMessage()

  console.log("🔧 directSendMessage state:", { 
    sendingMessage, 
    sendError 
  })

  // Initialize current session from parent activeChat
  useEffect(() => {
    console.log("🔄 Session initialization effect triggered")
    console.log("📨 activeSessionId:", activeSessionId)
    console.log("💬 chatSessions:", chatSessions?.length || 0, "sessions available")
    console.log("🆔 currentSessionId before:", currentSessionId)
    
    // Use the activeSessionId from parent component
    if (activeSessionId && activeSessionId !== currentSessionId) {
      console.log("✅ Setting currentSessionId from activeSessionId:", activeSessionId)
      setCurrentSessionId(activeSessionId)
    } else if (chatSessions && chatSessions.length > 0 && !currentSessionId && !activeSessionId) {
      // Fallback to first session if no active session provided
      console.log("⚠️ No activeSessionId, falling back to first session:", chatSessions[0].id)
      setCurrentSessionId(chatSessions[0].id)
    }
  }, [activeSessionId, chatSessions])

  // WebSocket message handling
  useEffect(() => {
    if (!currentSessionId) return

    const handleWebSocketMessage = (wsMessage: any) => {
      console.log("📨 WebSocket message received:", wsMessage)
      
      if (wsMessage.type === 'chat_message' && wsMessage.session_id === currentSessionId) {
        const newMessage: Message = {
          id: wsMessage.data.id,
          role: wsMessage.data.role as "user" | "assistant",
          content: wsMessage.data.content,
          agent: wsMessage.data.agent_type,
          timestamp: new Date(wsMessage.data.timestamp),
          tokenCost: wsMessage.data.metadata?.token_cost,
          processingTime: wsMessage.data.metadata?.processing_time,
          metadata: wsMessage.data.metadata ? {
            model: wsMessage.data.metadata.model || "gpt-4-turbo",
            confidence: wsMessage.data.metadata.confidence || 0.85,
            sources: wsMessage.data.metadata.sources || ["internal_knowledge"]
          } : undefined
        }
        
        console.log("✅ Adding WebSocket message to state:", newMessage)
        setMessages(prev => {
          // Check if message already exists to prevent duplicates
          const exists = prev.some(msg => msg.id === newMessage.id)
          if (exists) {
            console.log("⚠️ Message already exists, skipping:", newMessage.id)
            return prev
          }
          const newMessages = [...prev, newMessage]
          console.log("📝 Updated messages array length:", newMessages.length)
          return newMessages
        })
        setIsTyping(false)
        toast.success('Response received!')
      } else if (wsMessage.type === 'processing_status') {
        if (wsMessage.data.status === 'processing') {
          setIsTyping(true)
        } else if (wsMessage.data.status === 'completed') {
          setIsTyping(false)
        }
      } else if (wsMessage.type === 'manager_thinking') {
        // Enhanced: Manager decision broadcasting
        handleManagerThinking(wsMessage.data)
      } else if (wsMessage.type === 'agent_substep') {
        // Enhanced: Granular agent progress
        handleAgentSubstep(wsMessage.data)
      } else if (wsMessage.type === 'workflow_state_change') {
        // Enhanced: Workflow visualization
        handleWorkflowStateChange(wsMessage.data)
      } else if (wsMessage.type === 'brain_allocation') {
        // Enhanced: Brain allocation decisions
        handleBrainAllocation(wsMessage.data)
      } else if (wsMessage.type === 'user_decision_needed') {
        // Enhanced: Interactive user decisions
        handleUserDecisionNeeded(wsMessage.data)
      } else if (wsMessage.type === 'error_recovery') {
        // Enhanced: Error recovery streaming
        handleErrorRecovery(wsMessage.data)
      } else if (wsMessage.type === 'agent_processing_start' || wsMessage.type === 'agent_processing_complete') {
        // Enhanced: Agent processing events
        handleAgentProcessingEvent(wsMessage.data)
      }
    }

    chatApi.onMessage('enhanced-chat', handleWebSocketMessage)

    return () => {
      chatApi.offMessage('enhanced-chat')
    }
  }, [currentSessionId, setMessages])

  // Hidden admin keyboard shortcut: Ctrl+Shift+A
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === "A") {
        e.preventDefault()
        setShowAdmin(true)
        toast.success("Admin panel accessed", {
          description: "Welcome, administrator",
          duration: 2000,
        })
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [setShowAdmin])

  // Chat-specific drag and drop handlers
  const handleChatDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragDepth((prev) => prev + 1)
    if (e.dataTransfer.types.includes("Files")) {
      setIsDragOverChat(true)
    }
  }, [])

  const handleChatDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragDepth((prev) => {
      const newDepth = prev - 1
      if (newDepth === 0) {
        setIsDragOverChat(false)
      }
      return newDepth
    })
  }, [])

  const handleChatDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleChatDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOverChat(false)
    setDragDepth(0)

    const droppedFiles = Array.from(e.dataTransfer.files)
    if (droppedFiles.length > 0) {
      setAttachedFiles((prev) => [...prev, ...droppedFiles])
      toast.success(`${droppedFiles.length} file(s) attached to your message`)
    }

    // Check for text data (URLs)
    const textData = e.dataTransfer.getData("text/plain")
    if (textData && textData.includes("smartsheet.com")) {
      handleSmartsheetUrl(textData)
    }
  }, [])

  // Auto-scroll to bottom
  useEffect(() => {
    // Scroll the chat container to bottom instead of the entire page
    const chatContainer = chatContainerRef.current?.querySelector('.overflow-y-auto')
    if (chatContainer) {
      chatContainer.scrollTop = chatContainer.scrollHeight
    }
  }, [messages, isTyping])

  // Load persisted messages only on initial load
  useEffect(() => {
    // Only load from localStorage if no active session and no messages
    if (!activeSessionId && messages.length === 0) {
      const saved = localStorage.getItem("pip-ai-messages")
      if (saved) {
        try {
          const parsedMessages = JSON.parse(saved).map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp),
          }))
          console.log("📁 Loading persisted messages:", parsedMessages.length)
          setMessages(parsedMessages)
        } catch (error) {
          console.error("Failed to load messages:", error)
          localStorage.removeItem("pip-ai-messages") // Clear corrupted data
        }
      }
    }
  }, []) // Only run on initial mount

  // Persist messages to localStorage when messages change
  useEffect(() => {
    if (messages.length > 0) {
      console.log("💾 Persisting messages to localStorage:", messages.length)
      localStorage.setItem("pip-ai-messages", JSON.stringify(messages))
    }
  }, [messages])

  // Enhanced streaming message handlers
  const handleManagerThinking = useCallback((data: any) => {
    console.log("🧠 Manager thinking:", data)
    setManagerThinking(data.analysis || data.thinking_type || "Manager is analyzing...")
    toast.info(`Manager: ${data.thinking_type || 'Thinking'}`, {
      description: data.analysis?.substring(0, 100) + "...",
      duration: 3000,
    })
    
    // Clear thinking after a delay
    setTimeout(() => setManagerThinking(null), 5000)
  }, [])

  const handleAgentSubstep = useCallback((data: any) => {
    console.log("📊 Agent substep:", data)
    const agentName = data.agent_name
    const substep = data.substep
    const progress = data.progress_percentage || 0
    
    setAgentProgress(prev => ({
      ...prev,
      [agentName]: { substep, progress }
    }))
    
    toast.info(`${agentName}: ${substep}`, {
      description: `${progress}% complete`,
      duration: 2000,
    })
  }, [])

  const handleWorkflowStateChange = useCallback((data: any) => {
    console.log("🎯 Workflow state change:", data)
    setWorkflowState(data)
    
    if (data.change_type === 'phase_transition') {
      toast.success(`Workflow: ${data.current_stage}`, {
        description: `${data.workflow_visualization?.completion_percentage || 0}% complete`,
        duration: 3000,
      })
    }
  }, [])

  const handleBrainAllocation = useCallback((data: any) => {
    console.log("🤖 Brain allocation:", data)
    const agentName = data.agent_name
    const model = data.model_selected
    
    setBrainAllocations(prev => ({
      ...prev,
      [agentName]: model
    }))
    
    toast.info(`Brain Allocation: ${agentName}`, {
      description: `Using ${model} - ${data.reasoning?.substring(0, 80)}...`,
      duration: 4000,
    })
  }, [])

  const handleUserDecisionNeeded = useCallback((data: any) => {
    console.log("🤔 User decision needed:", data)
    setPendingDecision(data)
    
    toast.warning("Decision Required", {
      description: data.prompt?.substring(0, 100) + "...",
      duration: 10000,
    })
  }, [])

  const handleErrorRecovery = useCallback((data: any) => {
    console.log("🚨 Error recovery:", data)
    setErrorRecovery(data.error_message)
    
    const severity = data.severity || 'medium'
    const toastFn = severity === 'high' ? toast.error : severity === 'low' ? toast.info : toast.warning
    
    toastFn("Error Recovery", {
      description: `${data.error_message} - ${data.recovery_strategy}`,
      duration: 6000,
    })
    
    // Clear error recovery after delay
    setTimeout(() => setErrorRecovery(null), 10000)
  }, [])

  const handleAgentProcessingEvent = useCallback((data: any) => {
    console.log("⚡ Agent processing event:", data)
    const agentName = data.agent_name
    const status = data.status
    
    if (status === 'start') {
      toast.info(`${agentName} Starting`, {
        description: `Step ${data.step_number}/${data.total_steps}`,
        duration: 2000,
      })
    } else if (status === 'complete') {
      toast.success(`${agentName} Complete`, {
        description: data.result_summary || "Processing completed",
        duration: 3000,
      })
    }
  }, [])

  const toggleMetadata = (messageId: string) => {
    setExpandedMetadata((prev) =>
      prev.includes(messageId) ? prev.filter((id) => id !== messageId) : [...prev, messageId],
    )
  }

  const handleFileAttach = () => {
    fileInputRef.current?.click()
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length > 0) {
      setAttachedFiles((prev) => [...prev, ...files])
      toast.success(`${files.length} file(s) selected`)
    }
  }

  const removeFile = (index: number) => {
    const removedFile = attachedFiles[index]
    setAttachedFiles((prev) => prev.filter((_, i) => i !== index))
    toast.info(`Removed ${removedFile.name}`)
  }

  const handleSmartsheetUrl = (url: string) => {
    if (url.includes("smartsheet.com") && !smartsheetUrls.includes(url)) {
      setSmartsheetUrls((prev) => [...prev, url])
      toast.success("Smartsheet URL detected and will be processed")
    }
  }

  const handleInputChange = (value: string) => {
    setInput(value)

    // Check for smartsheet URLs in the input
    const smartsheetRegex = /https?:\/\/[^\s]*smartsheet\.com[^\s]*/gi
    const matches = value.match(smartsheetRegex)
    if (matches) {
      matches.forEach((url) => {
        if (!smartsheetUrls.includes(url)) {
          handleSmartsheetUrl(url)
        }
      })
    }
  }

  const removeSmartsheetUrl = (url: string) => {
    setSmartsheetUrls((prev) => prev.filter((u) => u !== url))
    setInput((prev) => prev.replace(url, "").trim())
    toast.info("Smartsheet URL removed")
  }

  const handleSend = async () => {
    console.log("🚀 FRONTEND DEBUG: handleSend called")
    console.log("📝 FRONTEND DEBUG: Input value:", input)
    console.log("📎 FRONTEND DEBUG: Attached files:", attachedFiles.length)
    console.log("🔗 FRONTEND DEBUG: Smartsheet URLs:", smartsheetUrls.length)
    console.log("🆔 FRONTEND DEBUG: Current session ID:", currentSessionId)
    console.log("🌐 FRONTEND DEBUG: Is connected:", isConnected)
    console.log("⌨️ FRONTEND DEBUG: Is typing:", isTyping)
    console.log("🔧 FRONTEND DEBUG: sendingMessage state:", sendingMessage)

    if (!input.trim() && attachedFiles.length === 0 && smartsheetUrls.length === 0) {
      console.log("❌ FRONTEND DEBUG: No content to send")
      return
    }
    
    if (!currentSessionId) {
      console.log("❌ FRONTEND DEBUG: No session ID available")
      toast.error("No active chat session. Please refresh the page.")
      return
    }

    if (!isConnected) {
      console.log("❌ Not connected")
      toast.error("Connection lost. Please wait for reconnection.")
      return
    }

    console.log("✅ All checks passed, proceeding to send message...")

    // Handle file uploads first if we have files
    let uploadedFileIds: string[] = []
    if (attachedFiles.length > 0) {
      try {
        console.log("📤 Uploading files...")
        const uploadResult = await uploadFiles(attachedFiles)
        if (uploadResult && uploadResult.length > 0) {
          uploadedFileIds = uploadResult.map((file: any) => file.id)
          console.log("✅ Files uploaded successfully:", uploadedFileIds)
        }
      } catch (error) {
        console.error('❌ File upload failed:', error)
        toast.error('Failed to upload files. Sending message without attachments.')
      }
    }

    // Store input content before clearing (user message will come via WebSocket)
    const messageContent = input
    setInput("")
    setAttachedFiles([])
    setSmartsheetUrls([])
    setIsTyping(true)

    console.log("🤖 Sending message to backend...")
    // Send message to backend using direct API
    try {
      const response = await directSendMessage(currentSessionId, messageContent, attachedFiles)
      
      console.log("📦 Backend response:", response)
      
      // Only handle direct response if WebSocket is not working
      // In normal operation, response comes through WebSocket
      if (response.success && response.data) {
        console.log("✅ Direct API response received, checking if WebSocket will handle it...")
        
        // Handle the new response format which may contain both user and agent messages
        const handleDirectResponse = (responseData: any) => {
          const messagesToAdd: Message[] = []
          
          // Handle the new format with user_message and agent_response
          if (responseData.user_message) {
            const userMsg: Message = {
              id: responseData.user_message.id,
              role: responseData.user_message.role as "user" | "assistant",
              content: responseData.user_message.content,
              agent: responseData.user_message.agent_type || "User",
              timestamp: new Date(responseData.user_message.timestamp),
              metadata: responseData.user_message.metadata
            }
            messagesToAdd.push(userMsg)
          }
          
          if (responseData.agent_response) {
            const agentMsg: Message = {
              id: responseData.agent_response.id,
              role: responseData.agent_response.role as "user" | "assistant",
              content: responseData.agent_response.content,
              agent: responseData.agent_response.agent_type || "Manager Agent",
              timestamp: new Date(responseData.agent_response.timestamp),
              tokenCost: responseData.agent_response.metadata?.token_cost,
              processingTime: responseData.agent_response.metadata?.processing_time,
              metadata: responseData.agent_response.metadata ? {
                model: responseData.agent_response.metadata.model || "gpt-4-turbo",
                confidence: responseData.agent_response.metadata.confidence || 0.85,
                sources: responseData.agent_response.metadata.sources || ["internal_knowledge"]
              } : undefined
            }
            messagesToAdd.push(agentMsg)
          }
          
          // If no new format, handle legacy single message format
          if (!responseData.user_message && !responseData.agent_response) {
            const legacyMsg: Message = {
              id: responseData.id,
              role: responseData.role as "user" | "assistant",
              content: responseData.content,
              agent: responseData.agent_type || "Manager Agent",
              timestamp: new Date(responseData.timestamp),
              tokenCost: responseData.metadata?.token_cost,
              processingTime: responseData.metadata?.processing_time,
              metadata: responseData.metadata ? {
                model: responseData.metadata.model || "gpt-4-turbo",
                confidence: responseData.metadata.confidence || 0.85,
                sources: responseData.metadata.sources || ["internal_knowledge"]
              } : undefined
            }
            messagesToAdd.push(legacyMsg)
          }
          
          return messagesToAdd
        }
        
        // Wait a short time to see if WebSocket message arrives
        setTimeout(() => {
          setMessages(prev => {
            const messagesToAdd = handleDirectResponse(response.data)
            const newMessagesFiltered = messagesToAdd.filter(newMsg => 
              !prev.some(existingMsg => existingMsg.id === newMsg.id)
            )
            
            if (newMessagesFiltered.length > 0) {
              console.log(`🔄 WebSocket didn't handle ${newMessagesFiltered.length} messages, adding via direct API`)
              const newMessages = [...prev, ...newMessagesFiltered]
              console.log("📝 Added direct API response, total messages:", newMessages.length)
              return newMessages
            } else {
              console.log("✅ WebSocket already handled all messages, skipping direct API add")
              return prev
            }
          })
          setIsTyping(false)
          toast.success('Response received!')
        }, 500) // Wait 500ms for WebSocket
      } else {
        console.error("❌ Send message failed:", response.error)
        setIsTyping(false)
        toast.error(`Failed to send message: ${response.error}`)
      }
      
      // The response will come through WebSocket in normal operation
    } catch (error) {
      console.error('❌ Failed to send message:', error)
      setIsTyping(false)
      
      const errorMessage: Message = {
        id: (Date.now() + 2).toString(),
        role: "assistant",
        content: "I apologize, but I encountered an error processing your request. Please try again.",
        agent: "System",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
      toast.error("Failed to send message. Please try again.")
    }
  }

  const generateRealisticResponse = (query: string, files: File[], urls: string[]) => {
    const fileContext = files.length > 0 ? ` I've analyzed the ${files.length} file(s) you uploaded.` : ""
    const sheetContext = urls.length > 0 ? ` I've also processed the Smartsheet data you provided.` : ""

    const responses = [
      `I've analyzed your request and found several key insights.${fileContext}${sheetContext} Based on the project scope, I estimate approximately 240 hours of work across 15 different trade categories.`,
      `After reviewing the uploaded documents${sheetContext ? " and Smartsheet data" : ""}, I've identified potential cost savings of 12-15% through optimized material selection and scheduling.${fileContext}`,
      `The analysis reveals 3 critical path items that require immediate attention.${fileContext}${sheetContext} I've also flagged 7 potential risk areas for your review.`,
      `I've processed the data and cross-referenced it with industry standards.${fileContext}${sheetContext} The current timeline appears feasible with minor adjustments.`,
    ]
    return responses[Math.floor(Math.random() * responses.length)]
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const exportChat = () => {
    const chatData = {
      messages,
      exportDate: new Date().toISOString(),
      totalMessages: messages.length,
    }

    const blob = new Blob([JSON.stringify(chatData, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `pip-ai-chat-${new Date().toISOString().split("T")[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
    toast.success("Chat exported successfully!")
  }

  const clearChat = () => {
    setMessages([])
    localStorage.removeItem("pip-ai-messages")
    toast.success("Chat cleared!")
  }

  // Handle file selection submission
  const handleFileSelection = async (selection: {
    selectedFiles: string[]
    additionalText: string
    action: 'analyze_selected' | 'analyze_all' | 'cancel'
  }) => {
    if (!currentSessionId) {
      toast.error("No active chat session")
      return
    }

    try {
      setIsTyping(true)
      console.log("🔄 Processing file selection:", selection)
      
      const result = await chatApi.submitFileSelection(currentSessionId, selection)
      console.log("📦 File selection result:", result)
      
      if (result.success && result.data) {
        // Convert the response data to Message format
        const messagesToAdd: Message[] = []
        
        if (result.data.selection_message) {
          const selectionMsg: Message = {
            id: result.data.selection_message.id,
            role: result.data.selection_message.role as "user" | "assistant",
            content: result.data.selection_message.content,
            agent: result.data.selection_message.agent_type || "User",
            timestamp: new Date(result.data.selection_message.timestamp),
            metadata: result.data.selection_message.metadata
          }
          messagesToAdd.push(selectionMsg)
        }
        
        if (result.data.agent_response) {
          const agentMsg: Message = {
            id: result.data.agent_response.id,
            role: result.data.agent_response.role as "user" | "assistant",
            content: result.data.agent_response.content,
            agent: result.data.agent_response.agent_type || "Smartsheet Agent",
            timestamp: new Date(result.data.agent_response.timestamp),
            tokenCost: result.data.agent_response.metadata?.token_cost,
            processingTime: result.data.agent_response.metadata?.processing_time,
            metadata: result.data.agent_response.metadata ? {
              model: result.data.agent_response.metadata.model || "gpt-4-turbo",
              confidence: result.data.agent_response.metadata.confidence || 0.85,
              sources: result.data.agent_response.metadata.sources || ["smartsheet"]
            } : undefined
          }
          messagesToAdd.push(agentMsg)
        }
        
        // Add messages to state
        if (messagesToAdd.length > 0) {
          setMessages(prev => [...prev, ...messagesToAdd])
          console.log("✅ Added file selection messages to chat:", messagesToAdd.length)
        }
        
        toast.success('File selection processed!')
      } else {
        console.error("❌ File selection failed:", result.error)
        toast.error(`Failed to process file selection: ${result.error}`)
      }
    } catch (error) {
      console.error('❌ File selection failed:', error)
      toast.error('Failed to process file selection')
    } finally {
      setIsTyping(false)
    }
  }

  return (
    <div className="bg-background flex flex-col h-full relative">
      {/* Chat Drag Overlay */}
      <AnimatePresence>
        {isDragOverChat && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-primary/10 backdrop-blur-sm z-40 pointer-events-none"
          >
            <div className="absolute inset-0 border-4 border-dashed border-primary rounded-lg m-4" />
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <div className="bg-background/80 dark:bg-zinc-800/80 backdrop-blur-xl rounded-xl p-8 shadow-xl border border-border">
                <div className="text-center">
                  <div className="w-16 h-16 bg-[#E60023] rounded-full flex items-center justify-center mx-auto mb-4">
                    <Upload className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">Drop Files or URLs</h3>
                  <p className="text-muted-foreground">Drop files to attach or paste Smartsheet URLs</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Chat Area */}
      <div
        ref={chatContainerRef}
        className="h-full flex flex-col"
        onDragEnter={handleChatDragEnter}
        onDragLeave={handleChatDragLeave}
        onDragOver={handleChatDragOver}
        onDrop={handleChatDrop}
      >
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto space-y-6 p-4 pb-32 scrollbar-hide max-w-full">
          {/* Stepwise Presenter - Protocol Agent Workflow Display */}
          <StepwisePresenter 
            sessionId={currentSessionId || undefined}
            className="mb-6"
          />
          
          {/* Action buttons at top when there are messages */}
          {messages.length > 0 && (
            <div className="flex justify-center mb-6">
              <div className="flex space-x-4">
                <Button onClick={handleFileAttach} variant="outline" className="border-primary text-primary">
                  <FileText className="w-4 h-4 mr-2" />
                  Upload Files
                </Button>
                <Button onClick={exportChat} variant="outline" disabled={messages.length === 0}>
                  Export Chat
                </Button>
                <Button onClick={clearChat} variant="outline" disabled={messages.length === 0}>
                  Clear Chat
                </Button>
              </div>
            </div>
          )}
          
          {messages.length === 0 && !isTyping && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-[#E60023] to-[#C4001A] rounded-full flex items-center justify-center mb-6 shadow-lg">
                <MessageSquare className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-semibold text-foreground mb-2">Let's Build!</h2>
              <p className="text-muted-foreground mb-6">
                Start a new conversation, upload files, or paste Smartsheet URLs.
              </p>
              <div className="flex space-x-4">
                <Button onClick={handleFileAttach} variant="outline" className="border-primary text-primary">
                  <FileText className="w-4 h-4 mr-2" />
                  Upload Files
                </Button>
                <Button onClick={exportChat} variant="outline" disabled={messages.length === 0}>
                  Export Chat
                </Button>
                <Button onClick={clearChat} variant="outline" disabled={messages.length === 0}>
                  Clear Chat
                </Button>
              </div>
            </div>
          )}
          
          {/* Debug message count */}
          {messages.length > 0 && (
            <div className="text-xs text-muted-foreground mb-4">
              Displaying {messages.length} message{messages.length !== 1 ? 's' : ''}
            </div>
          )}
          
          <AnimatePresence>
            {messages.map((message, index) => {
              console.log("🎨 Rendering message:", message.id, message.content.substring(0, 50) + "...")
              
              // Check if this is a file selection message
              const fileSelection = message.role === "assistant" ? parseMessageForInteractivity(message.content) : null
              
              return (
              <motion.div
                key={message.id}
                initial={{ opacity: 1, y: 0 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: 0 }}
                className={`flex w-full ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <Card
                  className={`max-w-[85%] p-4 shadow-lg transition-all hover:shadow-xl border-0 ${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-card dark:bg-zinc-800 border border-border shadow-md"
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    {message.role === "assistant" && (
                      <motion.div
                        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${getAgentStyle(message.agent)}`}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        {getAgentIcon(message.agent)}
                      </motion.div>
                    )}
                    <div className="flex-1">
                      {message.role === "assistant" && message.agent && (
                        <div className="flex items-center space-x-2 mb-2">
                          <Badge
                            variant="secondary"
                            className="bg-secondary text-secondary-foreground border-border text-xs"
                          >
                            {message.agent}
                          </Badge>
                          {message.metadata && (
                            <Badge variant="outline" className="bg-muted text-muted-foreground border-border text-xs">
                              {Math.round(message.metadata.confidence * 100)}% confidence
                            </Badge>
                          )}
                        </div>
                      )}

                      {/* Message Content */}
                      <div className="text-sm leading-relaxed break-words overflow-wrap-anywhere">
                        <FormattedMessageContent 
                          content={fileSelection ? cleanMessageContent(message.content) : message.content}
                          isUser={message.role === "user"}
                        />
                      </div>

                      {/* Interactive File Selection */}
                      {fileSelection && (
                        <div className="mt-3">
                          <FileSelectionCard
                            files={fileSelection.files}
                            sheetId={fileSelection.sheet_id}
                            onSubmit={handleFileSelection}
                          />
                        </div>
                      )}

                      {/* Attachments */}
                      {message.attachments && message.attachments.length > 0 && (
                        <div className="mt-3 space-y-2">
                          <p
                            className={`text-xs ${message.role === "user" ? "text-primary-foreground/70" : "text-muted-foreground"}`}
                          >
                            Attachments:
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {message.attachments.map((file, index) => (
                              <div
                                key={index}
                                className={`flex items-center space-x-2 px-3 py-1 rounded-lg text-xs ${
                                  message.role === "user"
                                    ? "bg-primary/80 text-primary-foreground"
                                    : "bg-secondary text-secondary-foreground"
                                }`}
                              >
                                <Paperclip className="w-3 h-3 flex-shrink-0" />
                                <span className="truncate flex-1 min-w-0">{file.name}</span>
                                <span className="text-xs opacity-70 flex-shrink-0">({formatFileSize(file.size)})</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Smartsheet Data */}
                      {message.smartsheetData && (
                        <div className="mt-3 space-y-2">
                          <p
                            className={`text-xs ${message.role === "user" ? "text-primary-foreground/70" : "text-muted-foreground"}`}
                          >
                            Smartsheet:
                          </p>
                          <div
                            className={`flex items-center space-x-2 px-3 py-1 rounded-lg text-xs ${
                              message.role === "user"
                                ? "bg-primary/80 text-primary-foreground"
                                : "bg-secondary text-secondary-foreground"
                            }`}
                          >
                            <Link className="w-3 h-3" />
                            <span className="truncate max-w-32">{message.smartsheetData.name}</span>
                            <span className="text-xs opacity-70">({message.smartsheetData.rows} rows)</span>
                          </div>
                        </div>
                      )}

                      {/* Collapsible Metadata */}
                      {message.role === "assistant" &&
                        (message.tokenCost || message.processingTime || message.metadata) && (
                          <Collapsible>
                            <CollapsibleTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="mt-2 p-0 h-auto text-xs text-muted-foreground hover:text-foreground"
                                onClick={() => toggleMetadata(message.id)}
                              >
                                <ChevronDown
                                  className={`w-3 h-3 mr-1 transition-transform ${
                                    expandedMetadata.includes(message.id) ? "rotate-180" : ""
                                  }`}
                                />
                                Show details
                              </Button>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mt-2 p-3 bg-muted/50 backdrop-blur-sm rounded-lg space-y-2 border border-border"
                              >
                                {message.tokenCost && (
                                  <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                                    <DollarSign className="w-3 h-3" />
                                    <span>Tokens: {message.tokenCost}</span>
                                  </div>
                                )}
                                {message.processingTime && (
                                  <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                                    <Clock className="w-3 h-3" />
                                    <span>Processing: {message.processingTime}ms</span>
                                  </div>
                                )}
                                {message.metadata && (
                                  <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                                    <Cpu className="w-3 h-3" />
                                    <span>Model: {message.metadata.model}</span>
                                  </div>
                                )}
                              </motion.div>
                            </CollapsibleContent>
                          </Collapsible>
                        )}

                      <p
                        className={`text-xs mt-2 ${message.role === "user" ? "text-white/70" : "text-muted-foreground"}`}
                      >
                        {message.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                    {message.role === "user" && (
                      <motion.div
                        className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center flex-shrink-0"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <User className="w-4 h-4 text-white" />
                      </motion.div>
                    )}
                  </div>
                </Card>
              </motion.div>
              )
            })}
          </AnimatePresence>

          {isTyping && (
            <motion.div
              initial={{ opacity: 1, y: 0 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex justify-start"
            >
              <Card className="max-w-2xl p-4 bg-card dark:bg-zinc-800 shadow-lg mr-12 border border-border">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-[#E60023] to-[#C4001A] rounded-full flex items-center justify-center">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex space-x-1">
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        className="w-2 h-2 bg-muted-foreground rounded-full"
                        animate={{ y: [0, -8, 0] }}
                        transition={{
                          duration: 0.6,
                          repeat: Number.POSITIVE_INFINITY,
                          delay: i * 0.2,
                        }}
                      />
                    ))}
                  </div>
                </div>
              </Card>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Smartsheet URLs Preview */}
      <AnimatePresence>
        {smartsheetUrls.length > 0 && (
          <motion.div
            initial={{ opacity: 1, y: 0 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-32 right-6 z-40"
            style={{ left: sidebarWidth + 24 }}
          >
            <Card className="p-4 bg-card/95 backdrop-blur-xl border border-border shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-foreground">Smartsheet URLs detected</span>
              </div>
              <div className="space-y-2">
                {smartsheetUrls.map((url, index) => (
                  <div key={index} className="flex items-center space-x-2 text-sm">
                    <Link className="w-4 h-4 text-primary" />
                    <span className="truncate max-w-48 text-foreground">{url}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeSmartsheetUrl(url)}
                      className="p-0 h-auto text-muted-foreground hover:text-destructive"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Input Dock */}
      <FloatingInputDock
        input={input}
        setInput={handleInputChange}
        onSend={handleSend}
        onFileAttach={handleFileAttach}
        attachedFiles={attachedFiles}
        removeFile={removeFile}
        clearAllFiles={() => setAttachedFiles([])}
        isConnected={isConnected}
        isTyping={isTyping}
        formatFileSize={formatFileSize}
        sidebarWidth={sidebarWidth}
      />

      {/* Admin Panel as Floating Modal */}
      <AnimatePresence>
        {showAdmin && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowAdmin(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", duration: 0.5 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-6xl max-h-[90vh] overflow-hidden"
            >
              <Card className="bg-background/95 backdrop-blur-xl border border-border shadow-2xl">
                <div className="flex items-center justify-between p-6 border-b border-border">
                  <h2 className="text-xl font-semibold text-foreground">Admin Panel</h2>
                  <Button variant="ghost" size="sm" onClick={() => setShowAdmin(false)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <div className="max-h-[80vh] overflow-y-auto">
                  <AdminPanel />
                </div>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={handleFileSelect}
        accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.txt"
      />
    </div>
  )
}
