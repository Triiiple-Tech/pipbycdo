"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Send, Paperclip, Bot, User, ChevronDown, Clock, DollarSign, Cpu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

interface Message {
  id: string
  type: "user" | "agent"
  content: string
  agent?: string
  timestamp: Date
  tokenCost?: number
  processingTime?: number
  metadata?: {
    model: string
    confidence: number
    sources: string[]
  }
}

interface ChatInterfaceProps {
  messages: Message[]
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>
  isConnected: boolean
}

export function ChatInterface({ messages, setMessages, isConnected }: ChatInterfaceProps) {
  const [input, setInput] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [expandedMetadata, setExpandedMetadata] = useState<string[]>([])
  const [attachedFiles, setAttachedFiles] = useState<File[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

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
    const responses = [
      "I've analyzed your request and found several key insights. Based on the project scope, I estimate approximately 240 hours of work across 15 different trade categories.",
      "After reviewing the uploaded documents, I've identified potential cost savings of 12-15% through optimized material selection and scheduling.",
      "The analysis reveals 3 critical path items that require immediate attention. I've also flagged 7 potential risk areas for your review.",
      "I've processed the Smartsheet data and cross-referenced it with industry standards. The current timeline appears feasible with minor adjustments.",
    ]
    return responses[Math.floor(Math.random() * responses.length)]
  }

  return (
    <div className="h-full flex flex-col">
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
                    <p
                      className={`text-sm leading-relaxed ${message.type === "user" ? "text-white" : "text-gray-800"}`}
                    >
                      {message.content}
                    </p>

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
      {attachedFiles.length > 0 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="px-6 py-2 bg-gray-50 border-t"
        >
          <div className="flex flex-wrap gap-2">
            {attachedFiles.map((file, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center space-x-2 bg-white rounded-lg px-3 py-1 text-sm"
              >
                <span className="truncate max-w-32">{file.name}</span>
                <Button variant="ghost" size="sm" onClick={() => removeFile(index)} className="p-0 h-auto">
                  ×
                </Button>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Input Area */}
      <div className="p-6 bg-white/50 backdrop-blur-sm border-t border-white/20">
        <div className="flex space-x-4">
          <div className="flex-1 relative">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={isConnected ? "Ask me anything about your project..." : "Reconnecting..."}
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
            >
              <Paperclip className="w-4 h-4" />
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={handleFileSelect}
              accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
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
