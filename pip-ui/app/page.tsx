"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { ChatSidebar } from "@/components/chat-sidebar"
import { EnhancedChatInterface } from "@/components/enhanced-chat-interface"
import { AgentStatus } from "@/components/agent-status"
import { StepwisePresenter } from "@/components/stepwise-presenter"
import { ConfirmModal } from "@/components/confirm-modal"
import { ChatExportModal } from "@/components/chat-export-modal"
import { DragDropProvider } from "@/components/drag-drop-provider"
import { useChatSessions, useAgentStatus, useSimpleChatSessions } from "@/hooks/useApi"
import { useDirectChatSessions } from "@/hooks/useDirectApi"
import { chatApi } from "@/services/chatApi"
import { ChatSession, ChatMessage } from "@/lib/types"
import { toast } from "sonner"

// Message interface to match the enhanced chat interface
interface Message {
  id: string
  role: "user" | "assistant"
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

export default function PIPAIWorkspace() {
  const [activeChat, setActiveChat] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)
  const [showExportModal, setShowExportModal] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [isConnected, setIsConnected] = useState(true)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [showAdmin, setShowAdmin] = useState(false)

  const sidebarWidth = isCollapsed ? 64 : 320

  // Create a default project context for the demo
  const defaultProjectId = "demo-project-123"

  // API hooks - Using direct approach that bypasses useEffect
  const { data: chatSessions, loading: loadingSessions, refetch: refetchSessions } = useDirectChatSessions()
  const { agentStatus } = useAgentStatus()

  // Auto-select first chat session when sessions are loaded, or create one if none exist
  useEffect(() => {
    const initializeSession = async () => {
      if (!loadingSessions) {
        if (chatSessions && chatSessions.length > 0 && !activeChat) {
          // Select the most recent chat session (first in the list)
          console.log("🔄 Auto-selecting first chat session:", chatSessions[0].id)
          setActiveChat(chatSessions[0].id)
        } else if (chatSessions && chatSessions.length === 0 && !activeChat) {
          // No sessions exist, create a default one for the demo
          console.log("🆕 No sessions found, creating default session...")
          try {
            const response = await chatApi.createChatSession('Demo Chat Session')
            if (response.success && response.data) {
              console.log("✅ Default session created:", response.data.id)
              setActiveChat(response.data.id)
              refetchSessions()
              toast.success('Welcome! Chat session ready.')
            }
          } catch (error) {
            console.error('Failed to create default chat session:', error)
            toast.error('Failed to initialize chat session')
          }
        }
      }
    }

    initializeSession()
  }, [chatSessions, activeChat, loadingSessions])

  // WebSocket connection monitoring
  useEffect(() => {
    // Monitor connection status through agent status updates
    // If agents are responsive, we consider the connection good
    setIsConnected(Object.keys(agentStatus).length > 0 || true) // Default to connected
  }, [agentStatus])

  // Load messages when active chat changes
  useEffect(() => {
    const loadChatMessages = async () => {
      if (!activeChat) {
        console.log("🧹 No active chat, clearing messages")
        setMessages([])
        return
      }

      console.log("📥 Loading messages for chat:", activeChat)
      try {
        const response = await chatApi.getMessages(activeChat)
        if (response.success && response.data) {
          // Convert ChatMessage[] to Message[]
          const convertedMessages: Message[] = response.data.map((msg: ChatMessage) => ({
            id: msg.id,
            role: msg.role as "user" | "assistant",
            content: msg.content,
            agent: msg.agent_type,
            timestamp: new Date(msg.timestamp),
            tokenCost: msg.metadata?.token_cost,
            processingTime: msg.metadata?.processing_time,
            metadata: msg.metadata ? {
              model: msg.metadata.model || "gpt-4-turbo",
              confidence: msg.metadata.confidence || 0.85,
              sources: msg.metadata.sources || ["internal_knowledge"]
            } : undefined
          }))
          console.log("✅ Loaded messages:", convertedMessages.length)
          setMessages(convertedMessages)
        } else {
          console.log("📭 No messages found for chat:", activeChat)
          setMessages([])
        }
      } catch (error) {
        console.error('Failed to load chat messages:', error)
        toast.error('Failed to load chat messages')
        setMessages([]) // Clear messages on error
      }
    }

    loadChatMessages()
  }, [activeChat])

  const handleNewChat = async () => {
    try {
      const response = await chatApi.createChatSession('New Chat Session')
      if (response.success && response.data) {
        setActiveChat(response.data.id)
        setMessages([])
        refetchSessions()
        toast.success('New chat session created')
      }
    } catch (error) {
      console.error('Failed to create new chat:', error)
      toast.error('Failed to create new chat session')
    }
  }

  const handleDeleteChat = (chatId: string) => {
    setShowDeleteConfirm(chatId)
  }

  const confirmDeleteChat = async () => {
    if (!showDeleteConfirm) return

    try {
      const response = await chatApi.deleteChatSession(showDeleteConfirm)
      if (response.success) {
        if (activeChat === showDeleteConfirm) {
          setActiveChat(null)
          setMessages([])
        }
        refetchSessions()
        toast.success('Chat deleted successfully')
      }
    } catch (error) {
      console.error('Failed to delete chat:', error)
      toast.error('Failed to delete chat')
    } finally {
      setShowDeleteConfirm(null)
    }
  }

  const handleRenameChat = async (chatId: string, newTitle: string) => {
    try {
      const response = await chatApi.updateChatSession(chatId, { name: newTitle })
      if (response.success) {
        refetchSessions()
        toast.success('Chat renamed successfully')
      }
    } catch (error) {
      console.error('Failed to rename chat:', error)
      toast.error('Failed to rename chat')
    }
  }

  return (
    <DragDropProvider onFilesAccepted={(files) => console.log("Global files:", files)}>
      <div className="h-screen bg-background flex text-foreground overflow-hidden">
        {/* Connection Status Indicator */}
        <motion.div
          initial={{ opacity: isConnected ? 0 : 1, y: isConnected ? -20 : 0 }}
          animate={{ opacity: isConnected ? 0 : 1, y: isConnected ? -20 : 0 }}
          className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-destructive/90 backdrop-blur-sm text-destructive-foreground px-4 py-2 rounded-lg shadow-lg border border-destructive/20"
        >
          Connection lost - Reconnecting...
        </motion.div>

        {/* Fixed Sidebar */}
        <div className="flex-shrink-0">
          <ChatSidebar
            activeChat={activeChat}
            setActiveChat={setActiveChat}
            onNewChat={handleNewChat}
            onDeleteChat={handleDeleteChat}
            onRenameChat={handleRenameChat}
            isCollapsed={isCollapsed}
            setIsCollapsed={setIsCollapsed}
            onOpenAdmin={() => setShowAdmin(true)}
            chatSessions={chatSessions || []}
            loading={loadingSessions}
          />
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 h-full">
          {/* Fixed Agent Status Bar */}
          <div className="flex-shrink-0">
            <AgentStatus />
          </div>

          {/* Scrollable Chat Interface - Full Width */}
          <div className="flex-1 min-h-0">
            <EnhancedChatInterface
              messages={messages}
              setMessages={setMessages}
              isConnected={isConnected}
              sidebarWidth={sidebarWidth}
              showAdmin={showAdmin}
              setShowAdmin={setShowAdmin}
              activeSessionId={activeChat}
            />
          </div>
        </div>

        {/* Modals */}
        <ConfirmModal
          isOpen={!!showDeleteConfirm}
          onClose={() => setShowDeleteConfirm(null)}
          onConfirm={confirmDeleteChat}
          title="Delete Chat"
          message="Are you sure you want to delete this chat? This action cannot be undone."
          variant="danger"
        />

        <ChatExportModal isOpen={showExportModal} onClose={() => setShowExportModal(false)} messages={messages} />
      </div>
    </DragDropProvider>
  )
}
