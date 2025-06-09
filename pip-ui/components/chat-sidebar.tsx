"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { MessageSquare, Plus, Edit3, Trash2, Search, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface ChatHistory {
  id: string
  title: string
  lastMessage: string
  timestamp: Date
  messageCount: number
}

interface ChatSidebarProps {
  activeChat: string | null
  setActiveChat: (chatId: string | null) => void
  onNewChat: () => void
  onDeleteChat: (chatId: string) => void
  onRenameChat: (chatId: string, newTitle: string) => void
  isCollapsed: boolean
  setIsCollapsed: (collapsed: boolean) => void
  onOpenAdmin: () => void
  chatSessions?: Array<{
    id: string
    name: string
    created_at: string
    updated_at: string
    message_count?: number
  }>
  loading?: boolean
}

export function ChatSidebar({
  activeChat,
  setActiveChat,
  onNewChat,
  onDeleteChat,
  onRenameChat,
  isCollapsed,
  setIsCollapsed,
  onOpenAdmin,
  chatSessions = [],
  loading = false,
}: ChatSidebarProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [editingChat, setEditingChat] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState("")
  const [adminClickCount, setAdminClickCount] = useState(0)

  console.log("ChatSidebar received chatSessions:", chatSessions);

  // Convert chat sessions to chat history format
  const chatHistory: ChatHistory[] = chatSessions.map(session => ({
    id: session.id,
    title: session.name,
    lastMessage: "Click to view messages...", // We could fetch this separately if needed
    timestamp: new Date(session.updated_at),
    messageCount: session.message_count || 0,
  }))

  const filteredChats = chatHistory.filter(
    (chat) =>
      chat.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      chat.lastMessage.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const handleStartEdit = (chat: ChatHistory) => {
    setEditingChat(chat.id)
    setEditTitle(chat.title)
  }

  const handleSaveEdit = () => {
    if (editingChat && editTitle.trim()) {
      onRenameChat(editingChat, editTitle.trim())
    }
    setEditingChat(null)
    setEditTitle("")
  }

  const handleCancelEdit = () => {
    setEditingChat(null)
    setEditTitle("")
  }

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date()
    const diff = now.getTime() - timestamp.getTime()
    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    return `${days}d ago`
  }

  // Hidden admin access - click version number 5 times
  const handleVersionClick = () => {
    setAdminClickCount((prev) => {
      const newCount = prev + 1
      if (newCount >= 5) {
        onOpenAdmin()
        return 0
      }
      return newCount
    })

    // Reset count after 3 seconds of inactivity
    setTimeout(() => {
      setAdminClickCount(0)
    }, 3000)
  }

  return (
    <motion.div
      animate={{ width: isCollapsed ? 64 : 320 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="bg-gray-100 dark:bg-zinc-900 border-r border-gray-200 dark:border-zinc-800 flex flex-col h-screen relative"
    >
      {/* Collapsed State - New Chat Button */}
      {isCollapsed && (
        <div className="p-4 flex flex-col items-center space-y-4">
          <Button
            onClick={onNewChat}
            size="sm"
            className="w-10 h-10 p-0 bg-transparent hover:bg-gray-200 dark:hover:bg-zinc-800 text-foreground border border-border"
          >
            <Plus className="w-4 h-4" />
          </Button>

          {/* Collapse Toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(false)}
            className="w-10 h-10 p-0 hover:bg-gray-200 dark:hover:bg-zinc-800"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Expanded State */}
      <AnimatePresence>
        {!isCollapsed && (
          <motion.div
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col h-full"
          >
            {/* Header */}
            <div className="p-6 border-b border-gray-200 dark:border-zinc-800">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  {/* CDO Logo */}
                  <div className="w-10 h-10 bg-gradient-to-br from-[#E60023] to-[#C4001A] rounded-xl flex items-center justify-center shadow-lg">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-white">
                      <path
                        d="M12 2L2 7L12 12L22 7L12 2Z"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M2 17L12 22L22 17"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M2 12L12 17L22 12"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  <div>
                    <span className="font-bold text-foreground text-lg">PIP AI</span>
                    <p className="text-xs text-muted-foreground">CDO Intelligence Platform</p>
                  </div>
                </div>

                {/* Collapse Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsCollapsed(true)}
                  className="p-2 hover:bg-gray-200 dark:hover:bg-zinc-800"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
              </div>

              {/* New Chat Button */}
              <Button
                onClick={onNewChat}
                className="bg-transparent hover:bg-gray-200 dark:hover:bg-zinc-800 text-foreground border border-border w-full transition-all"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Chat
              </Button>
            </div>

            {/* Search */}
            <div className="p-4 border-b border-gray-200 dark:border-zinc-800">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search chats..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-gray-200 dark:bg-zinc-800 border-border text-foreground placeholder:text-muted-foreground focus:border-primary"
                />
              </div>
            </div>

            {/* Chat History */}
            <div className="flex-1 overflow-y-auto min-h-0">
              <div className="p-2 space-y-1">
                {filteredChats.map((chat) => (
                  <motion.div
                    key={chat.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={cn(
                      "group relative p-3 rounded-lg cursor-pointer transition-all hover:bg-gray-200 dark:hover:bg-zinc-800",
                      activeChat === chat.id ? "bg-gray-200 dark:bg-zinc-800 border border-border" : "",
                    )}
                    onClick={() => setActiveChat(chat.id)}
                  >
                    {editingChat === chat.id ? (
                      <div className="space-y-2">
                        <Input
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          className="bg-background border-border text-foreground text-sm"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleSaveEdit()
                            if (e.key === "Escape") handleCancelEdit()
                          }}
                          autoFocus
                        />
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            onClick={handleSaveEdit}
                            className="bg-[#E60023] hover:bg-[#C4001A] text-white"
                          >
                            Save
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={handleCancelEdit}
                            className="text-muted-foreground hover:text-foreground"
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-1">
                              <MessageSquare className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                              <h3 className="font-medium text-foreground text-sm truncate">{chat.title}</h3>
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{chat.lastMessage}</p>
                            <div className="flex items-center justify-between text-xs text-muted-foreground/70">
                              <span>{formatTimestamp(chat.timestamp)}</span>
                              <span>{chat.messageCount} messages</span>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1 ml-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleStartEdit(chat)
                              }}
                              className="p-1 h-auto text-muted-foreground hover:text-foreground hover:bg-gray-300 dark:hover:bg-zinc-700"
                            >
                              <Edit3 className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation()
                                onDeleteChat(chat.id)
                              }}
                              className="p-1 h-auto text-muted-foreground hover:text-destructive hover:bg-gray-300 dark:hover:bg-zinc-700"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Footer with Hidden Admin Access */}
            <div className="p-4 border-t border-gray-200 dark:border-zinc-800">
              <div className="text-center space-y-1">
                <p className="text-xs text-muted-foreground">CDO AI Workspace</p>
                <button
                  onClick={handleVersionClick}
                  className="text-xs text-muted-foreground/70 hover:text-muted-foreground transition-colors cursor-pointer"
                >
                  v2.0.1 • Connected
                  {adminClickCount > 0 && <span className="ml-1 text-primary">{"•".repeat(adminClickCount)}</span>}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
