"use client"

import type React from "react"
import { MessageSquare, X } from "lucide-react"

import { useState, useRef, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Paperclip, Bot, User, ChevronDown, Clock, DollarSign, Cpu, Upload, Link, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { FloatingInputDock } from "./floating-input-dock"
import { AdminPanel } from "./admin-panel"
import { toast } from "sonner"

// Import our new API services and hooks
import { useChatSessions, useFileUpload, useMutation } from "@/hooks/useApi"
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
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)

  // API hooks for chat functionality
  const { data: chatSessions, refetch: refetchSessions } = useChatSessions()
  const { uploadFiles } = useFileUpload()
  
  const sendMessageMutation = useMutation(
    async ({ sessionId, message, fileIds = [] }: { 
      sessionId: string; 
      message: string; 
      fileIds?: string[] 
    }) => {
      console.log("🔧 sendMessageMutation called with:", { sessionId, message, fileIds })
      const result = await chatApi.sendMessage(sessionId, message)
      console.log("🔧 chatApi.sendMessage result:", result)
      return result
    }
  )

  console.log("🔧 sendMessageMutation state:", { 
    loading: sendMessageMutation.loading, 
    error: sendMessageMutation.error 
  })

  // Initialize current session from parent activeChat
  useEffect(() => {
    console.log("🔄 Session initialization effect triggered")
    console.log("📨 activeSessionId:", activeSessionId)
    console.log("💬 chatSessions:", chatSessions?.length || 0, "sessions available")
    console.log("🆔 currentSessionId before:", currentSessionId)
    
    // Use the activeSessionId from parent component
    if (activeSessionId) {
      console.log("✅ Setting currentSessionId from activeSessionId:", activeSessionId)
      setCurrentSessionId(activeSessionId)
    } else if (chatSessions && chatSessions.length > 0 && !currentSessionId) {
      // Fallback to first session if no active session provided
      console.log("⚠️ No activeSessionId, falling back to first session:", chatSessions[0].id)
      setCurrentSessionId(chatSessions[0].id)
    } else {
      console.log("❌ No session available to set")
    }
  }, [activeSessionId, chatSessions, currentSessionId])

  // WebSocket message handling
  useEffect(() => {
    if (!currentSessionId) return

    const handleWebSocketMessage = (wsMessage: any) => {
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
        
        setMessages(prev => [...prev, newMessage])
        setIsTyping(false)
        toast.success('Response received!')
      } else if (wsMessage.type === 'processing_status') {
        if (wsMessage.data.status === 'processing') {
          setIsTyping(true)
        } else if (wsMessage.data.status === 'completed') {
          setIsTyping(false)
        }
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
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isTyping])

  // Load persisted messages
  useEffect(() => {
    const saved = localStorage.getItem("pip-ai-messages")
    if (saved && messages.length === 0) {
      try {
        const parsedMessages = JSON.parse(saved).map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
        }))
        setMessages(parsedMessages)
      } catch (error) {
        console.error("Failed to load messages:", error)
      }
    }
  }, [])

  // Persist messages
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem("pip-ai-messages", JSON.stringify(messages))
    }
  }, [messages])

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
    console.log("🚀 handleSend called")
    console.log("📝 Input value:", input)
    console.log("📎 Attached files:", attachedFiles.length)
    console.log("🔗 Smartsheet URLs:", smartsheetUrls.length)
    console.log("🆔 Current session ID:", currentSessionId)
    console.log("🌐 Is connected:", isConnected)
    console.log("⌨️ Is typing:", isTyping)

    if (!input.trim() && attachedFiles.length === 0 && smartsheetUrls.length === 0) {
      console.log("❌ No content to send")
      return
    }
    
    if (!currentSessionId) {
      console.log("❌ No session ID available")
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

    // Create user message locally first
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
      attachments: attachedFiles.length > 0 ? [...attachedFiles] : undefined,
      smartsheetData:
        smartsheetUrls.length > 0
          ? {
              name: "Connected Smartsheet",
              url: smartsheetUrls[0],
              rows: Math.floor(Math.random() * 200) + 50,
            }
          : undefined,
    }

    console.log("📨 Created user message:", userMessage)
    setMessages((prev) => [...prev, userMessage])
    const messageContent = input // Store input before clearing
    setInput("")
    setAttachedFiles([])
    setSmartsheetUrls([])
    setIsTyping(true)

    console.log("🤖 Sending message to backend...")
    // Send message to backend
    try {
      const response = await sendMessageMutation.mutate({
        sessionId: currentSessionId,
        message: messageContent,
        fileIds: uploadedFileIds
      })
      
      console.log("📦 Backend response:", response)
      
      // If direct response (fallback for when WebSocket isn't working)
      if (response) {
        console.log("✅ Processing direct response...")
        const agentMessage: Message = {
          id: response.id,
          role: response.role as "user" | "assistant",
          content: response.content,
          agent: response.agent_type || "Manager Agent",
          timestamp: new Date(response.timestamp),
          tokenCost: response.metadata?.token_cost,
          processingTime: response.metadata?.processing_time,
          metadata: response.metadata ? {
            model: response.metadata.model || "gpt-4-turbo",
            confidence: response.metadata.confidence || 0.85,
            sources: response.metadata.sources || ["internal_knowledge"]
          } : undefined
        }
        setMessages(prev => [...prev, agentMessage])
        setIsTyping(false)
        toast.success('Response received!')
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

  return (
    <div className="bg-background flex flex-col pb-32 relative">
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
        <div className="flex-1 overflow-y-auto space-y-6 p-6 pb-8">
          {messages.length === 0 && !isTyping && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-[#E60023] to-[#C4001A] rounded-full flex items-center justify-center mb-6 shadow-lg">
                <MessageSquare className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-semibold text-foreground mb-2">What are you working on?</h2>
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
          <AnimatePresence>
            {messages.map((message, index) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.1 }}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <Card
                  className={`max-w-2xl p-4 shadow-lg transition-all hover:shadow-xl border-0 ${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground ml-12"
                      : "bg-card dark:bg-zinc-800 mr-12 border border-border shadow-md"
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    {message.role === "assistant" && (
                      <motion.div
                        className="w-8 h-8 bg-gradient-to-br from-[#E60023] to-[#C4001A] rounded-full flex items-center justify-center flex-shrink-0"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Bot className="w-4 h-4 text-white" />
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
                      <p
                        className={`text-sm leading-relaxed ${message.role === "user" ? "text-white" : "text-foreground"}`}
                      >
                        {message.content}
                      </p>

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
                                <Paperclip className="w-3 h-3" />
                                <span className="truncate max-w-32">{file.name}</span>
                                <span className="text-xs opacity-70">({formatFileSize(file.size)})</span>
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
            ))}
          </AnimatePresence>

          {isTyping && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
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
            initial={{ opacity: 0, y: 20 }}
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
