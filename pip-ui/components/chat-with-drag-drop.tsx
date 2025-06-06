"use client"

import type React from "react"

import { useState, useRef, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Send, Paperclip, Bot, User, ChevronDown, Clock, DollarSign, Cpu, Upload, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { useDragDrop } from "./drag-drop-provider"

interface Message {
  id: string
  type: "user" | "agent"
  content: string
  agent?: string
  timestamp: Date
  tokenCost?: number
  processingTime?: number
  attachments?: File[]
  metadata?: {
    model: string
    confidence: number
    sources: string[]
  }
}

interface ChatWithDragDropProps {
  messages: Message[]
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>
  isConnected: boolean
}

export function ChatWithDragDrop({ messages, setMessages, isConnected }: ChatWithDragDropProps) {
  const [input, setInput] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [expandedMetadata, setExpandedMetadata] = useState<string[]>([])
  const [attachedFiles, setAttachedFiles] = useState<File[]>([])
  const [isDragOverChat, setIsDragOverChat] = useState(false)
  const [dragDepth, setDragDepth] = useState(0)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)

  const { isDragging: globalDragging, handleGlobalDrop } = useDragDrop()

  // Handle files dropped from global drag drop provider
  useEffect(() => {
    const handleFilesFromGlobal = (files: File[]) => {
      setAttachedFiles((prev) => [...prev, ...files])
    }

    // This would be called from the global provider when files are dropped
    // For now, we'll handle it locally in the chat
  }, [])

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
    setAttachedFiles((prev) => [...prev, ...droppedFiles])
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
    setAttachedFiles((prev) => [...prev, ...files])
  }

  const removeFile = (index: number) => {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSend = async () => {
    if (!input.trim() && attachedFiles.length === 0) return
    if (!isConnected) {
      alert("Connection lost. Please wait for reconnection.")
      return
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: input,
      timestamp: new Date(),
      attachments: attachedFiles.length > 0 ? [...attachedFiles] : undefined,
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setAttachedFiles([])
    setIsTyping(true)

    // Simulate realistic agent processing
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500 + Math.random() * 2000))

      const agentMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "agent",
        content: generateRealisticResponse(input, attachedFiles),
        agent: "Manager Agent",
        timestamp: new Date(),
        tokenCost: Math.floor(Math.random() * 500) + 100,
        processingTime: Math.floor(Math.random() * 3000) + 1000,
        metadata: {
          model: "gpt-4-turbo",
          confidence: 0.85 + Math.random() * 0.15,
          sources: ["internal_knowledge", "uploaded_files", "smartsheet_data"],
        },
      }

      setMessages((prev) => [...prev, agentMessage])
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 2).toString(),
        type: "agent",
        content: "I apologize, but I encountered an error processing your request. Please try again.",
        agent: "System",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsTyping(false)
    }
  }

  const generateRealisticResponse = (query: string, files: File[]) => {
    const fileContext = files.length > 0 ? ` I've analyzed the ${files.length} file(s) you uploaded.` : ""
    const responses = [
      `I've analyzed your request and found several key insights.${fileContext} Based on the project scope, I estimate approximately 240 hours of work across 15 different trade categories.`,
      `After reviewing the uploaded documents, I've identified potential cost savings of 12-15% through optimized material selection and scheduling.${fileContext}`,
      `The analysis reveals 3 critical path items that require immediate attention.${fileContext} I've also flagged 7 potential risk areas for your review.`,
      `I've processed the data and cross-referenced it with industry standards.${fileContext} The current timeline appears feasible with minor adjustments.`,
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

  return (
    <div
      ref={chatContainerRef}
      className="h-full flex flex-col relative"
      onDragEnter={handleChatDragEnter}
      onDragLeave={handleChatDragLeave}
      onDragOver={handleChatDragOver}
      onDrop={handleChatDrop}
    >
      {/* Chat Drag Overlay */}
      <AnimatePresence>
        {isDragOverChat && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-[#E60023]/10 backdrop-blur-sm z-40 pointer-events-none"
          >
            <div className="absolute inset-0 border-4 border-dashed border-[#E60023] rounded-lg m-4" />
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <div className="bg-white/90 backdrop-blur-xl rounded-xl p-8 shadow-xl">
                <div className="text-center">
                  <div className="w-16 h-16 bg-[#E60023] rounded-full flex items-center justify-center mx-auto mb-4">
                    <Upload className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Add to Chat</h3>
                  <p className="text-gray-600">Drop files to attach to your message</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto space-y-6 p-6">
        <AnimatePresence>
          {messages.map((message, index) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: index * 0.1 }}
              className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}
            >
              <Card
                className={`max-w-2xl p-4 shadow-lg transition-all hover:shadow-xl ${
                  message.type === "user"
                    ? "bg-gradient-to-r from-[#E60023] to-[#C4001A] text-white ml-12"
                    : "bg-white/80 backdrop-blur-sm mr-12 border border-white/20"
                }`}
              >
                <div className="flex items-start space-x-3">
                  {message.type === "agent" && (
                    <motion.div
                      className="w-8 h-8 bg-gradient-to-br from-[#E60023] to-[#C4001A] rounded-full flex items-center justify-center flex-shrink-0"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Bot className="w-4 h-4 text-white" />
                    </motion.div>
                  )}
                  <div className="flex-1">
                    {message.type === "agent" && (
                      <div className="flex items-center space-x-2 mb-2">
                        <Badge variant="secondary" className="text-xs">
                          {message.agent}
                        </Badge>
                        {message.metadata && (
                          <Badge variant="outline" className="text-xs">
                            {Math.round(message.metadata.confidence * 100)}% confidence
                          </Badge>
                        )}
                      </div>
                    )}

                    {/* Message Content */}
                    <p
                      className={`text-sm leading-relaxed ${message.type === "user" ? "text-white" : "text-gray-800"}`}
                    >
                      {message.content}
                    </p>

                    {/* Attachments */}
                    {message.attachments && message.attachments.length > 0 && (
                      <div className="mt-3 space-y-2">
                        <p className={`text-xs ${message.type === "user" ? "text-white/70" : "text-gray-500"}`}>
                          Attachments:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {message.attachments.map((file, index) => (
                            <div
                              key={index}
                              className={`flex items-center space-x-2 px-3 py-1 rounded-lg text-xs ${
                                message.type === "user" ? "bg-white/20 text-white" : "bg-gray-100 text-gray-700"
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

                    {/* Collapsible Metadata */}
                    {message.type === "agent" && (message.tokenCost || message.processingTime || message.metadata) && (
                      <Collapsible>
                        <CollapsibleTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="mt-2 p-0 h-auto text-xs text-gray-500 hover:text-gray-700"
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
                            className="mt-2 p-3 bg-gray-50 rounded-lg space-y-2"
                          >
                            {message.tokenCost && (
                              <div className="flex items-center space-x-2 text-xs text-gray-600">
                                <DollarSign className="w-3 h-3" />
                                <span>Tokens: {message.tokenCost}</span>
                              </div>
                            )}
                            {message.processingTime && (
                              <div className="flex items-center space-x-2 text-xs text-gray-600">
                                <Clock className="w-3 h-3" />
                                <span>Processing: {message.processingTime}ms</span>
                              </div>
                            )}
                            {message.metadata && (
                              <div className="flex items-center space-x-2 text-xs text-gray-600">
                                <Cpu className="w-3 h-3" />
                                <span>Model: {message.metadata.model}</span>
                              </div>
                            )}
                          </motion.div>
                        </CollapsibleContent>
                      </Collapsible>
                    )}

                    <p className={`text-xs mt-2 ${message.type === "user" ? "text-white/70" : "text-gray-500"}`}>
                      {message.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                  {message.type === "user" && (
                    <motion.div
                      className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center flex-shrink-0"
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
            <Card className="max-w-2xl p-4 bg-white/80 backdrop-blur-sm shadow-lg mr-12">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-[#E60023] to-[#C4001A] rounded-full flex items-center justify-center">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="flex space-x-1">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      className="w-2 h-2 bg-gray-400 rounded-full"
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

      {/* Attached Files Preview */}
      <AnimatePresence>
        {attachedFiles.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="px-6 py-3 bg-gray-50/80 backdrop-blur-sm border-t border-white/20"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Attached Files ({attachedFiles.length})</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setAttachedFiles([])}
                className="text-gray-500 hover:text-red-500"
              >
                Clear All
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {attachedFiles.map((file, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="flex items-center space-x-2 bg-white/80 backdrop-blur-sm rounded-lg px-3 py-2 text-sm shadow-sm"
                >
                  <Paperclip className="w-4 h-4 text-gray-500" />
                  <span className="truncate max-w-32">{file.name}</span>
                  <span className="text-xs text-gray-500">({formatFileSize(file.size)})</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(index)}
                    className="p-0 h-auto text-gray-400 hover:text-red-500"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input Area */}
      <div className="p-6 bg-white/50 backdrop-blur-sm border-t border-white/20">
        <div className="flex space-x-4">
          <div className="flex-1 relative">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                isConnected
                  ? attachedFiles.length > 0
                    ? `Ask about your ${attachedFiles.length} attached file(s)...`
                    : "Ask me anything about your project..."
                  : "Reconnecting..."
              }
              disabled={!isConnected}
              className="min-h-[60px] pr-12 bg-white/80 backdrop-blur-sm border-white/30 focus:border-[#E60023] resize-none transition-all"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  handleSend()
                }
              }}
            />
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-2 top-2 text-gray-500 hover:text-[#E60023] transition-colors"
              onClick={handleFileAttach}
              disabled={!isConnected}
              title="Attach files"
            >
              <Paperclip className="w-4 h-4" />
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={handleFileSelect}
              accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.txt"
            />
          </div>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              onClick={handleSend}
              disabled={(!input.trim() && attachedFiles.length === 0) || isTyping || !isConnected}
              className="bg-gradient-to-r from-[#E60023] to-[#C4001A] hover:from-[#C4001A] hover:to-[#E60023] text-white px-6 h-[60px] transition-all"
            >
              <Send className="w-4 h-4" />
            </Button>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
