"use client"

import {
  MessageSquare,
  Upload,
  Grid3X3,
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Settings,
  Download,
} from "lucide-react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface SidebarProps {
  activeView: "chat" | "files" | "smartsheet" | "admin"
  setActiveView: (view: "chat" | "files" | "smartsheet" | "admin") => void
  isCollapsed: boolean
  setIsCollapsed: (collapsed: boolean) => void
  onClearChat: () => void
  onNewChat: () => void
  onExportChat: () => void
  messageCount: number
}

export function Sidebar({
  activeView,
  setActiveView,
  isCollapsed,
  setIsCollapsed,
  onClearChat,
  onNewChat,
  onExportChat,
  messageCount,
}: SidebarProps) {
  const navItems = [
    { id: "chat", label: "Chat", icon: MessageSquare, badge: messageCount > 0 ? messageCount : null },
    { id: "files", label: "File Analysis", icon: Upload },
    { id: "smartsheet", label: "Smartsheet", icon: Grid3X3 },
    { id: "admin", label: "Admin", icon: Settings },
  ]

  return (
    <motion.div
      className={cn("fixed left-0 top-0 h-screen transition-all duration-300 z-50")}
      animate={{ width: isCollapsed ? 64 : 320 }}
      layout
    >
      {/* Glassmorphic Background */}
      <div className="absolute inset-0 bg-white/70 backdrop-blur-xl border-r border-white/20 shadow-2xl" />

      {/* Content */}
      <div className="relative h-full flex flex-col p-4">
        {/* Header with Real CDO Logo */}
        <motion.div className="flex items-center justify-between mb-8" layout>
          {!isCollapsed && (
            <motion.div
              className="flex items-center space-x-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
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
                <span className="font-bold text-gray-900 text-lg">PIP AI</span>
                <p className="text-xs text-gray-500">CDO Intelligence Platform</p>
              </div>
            </motion.div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 hover:bg-white/50 transition-colors"
          >
            <motion.div animate={{ rotate: isCollapsed ? 0 : 180 }} transition={{ duration: 0.2 }}>
              {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </motion.div>
          </Button>
        </motion.div>

        {/* Navigation */}
        <nav className="space-y-2 flex-1">
          {navItems.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Button
                variant={activeView === item.id ? "default" : "ghost"}
                className={cn(
                  "w-full justify-start transition-all duration-200 relative",
                  activeView === item.id
                    ? "bg-[#E60023] text-white shadow-lg hover:bg-[#E60023]/90"
                    : "hover:bg-white/50 text-gray-700",
                  isCollapsed ? "px-2" : "px-4",
                )}
                onClick={() => setActiveView(item.id as any)}
              >
                <item.icon className={cn("w-5 h-5", isCollapsed ? "" : "mr-3")} />
                {!isCollapsed && <span className="flex-1 text-left">{item.label}</span>}
                {!isCollapsed && item.badge && (
                  <Badge variant="secondary" className="ml-auto">
                    {item.badge}
                  </Badge>
                )}
              </Button>
            </motion.div>
          ))}

          {/* Quick Actions */}
          {!isCollapsed && (
            <motion.div
              className="pt-6 space-y-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide px-4">Quick Actions</p>
              <Button
                variant="ghost"
                className="w-full justify-start text-gray-700 hover:bg-white/50 transition-colors"
                onClick={onNewChat}
              >
                <Plus className="w-4 h-4 mr-3" />
                New Chat
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start text-gray-700 hover:bg-white/50 transition-colors"
                onClick={onClearChat}
                disabled={messageCount === 0}
              >
                <Trash2 className="w-4 h-4 mr-3" />
                Clear Chat
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start text-gray-700 hover:bg-white/50 transition-colors"
                onClick={onExportChat}
                disabled={messageCount === 0}
              >
                <Download className="w-4 h-4 mr-3" />
                Export Chat
              </Button>
            </motion.div>
          )}
        </nav>

        {/* Footer */}
        {!isCollapsed && (
          <motion.div
            className="mt-auto pt-4 border-t border-white/20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <div className="text-center space-y-1">
              <p className="text-xs text-gray-500">CDO AI Workspace</p>
              <p className="text-xs text-gray-400">v2.0.1 • Connected</p>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}
