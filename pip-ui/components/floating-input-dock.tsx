"use client"

import type React from "react"
import { useState, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Send, Paperclip, Mic, Square, FileText, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface FloatingInputDockProps {
  input: string
  setInput: (value: string) => void
  onSend: () => void
  onFileAttach: () => void
  attachedFiles: File[]
  removeFile: (index: number) => void
  clearAllFiles: () => void
  isConnected: boolean
  isTyping: boolean
  formatFileSize: (bytes: number) => string
  sidebarWidth: number // New prop for sidebar width
}

export function FloatingInputDock({
  input,
  setInput,
  onSend,
  onFileAttach,
  attachedFiles,
  removeFile,
  clearAllFiles,
  isConnected,
  isTyping,
  formatFileSize,
  sidebarWidth,
}: FloatingInputDockProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const canSend = (input.trim() || attachedFiles.length > 0) && !isTyping && isConnected

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      if (canSend) {
        onSend()
      }
    }
  }

  const toggleRecording = () => {
    setIsRecording(!isRecording)
    // TODO: Implement voice recording logic
  }

  return (
    <TooltipProvider>
      <motion.div
        className="fixed bottom-0 right-0 z-50"
        style={{ left: sidebarWidth }}
        animate={{ left: sidebarWidth }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
      >
        {/* Background blur overlay */}
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />

        {/* Main container */}
        <div className="relative max-w-4xl mx-auto px-6 pb-6">
          {/* Attached Files Preview */}
          <AnimatePresence>
            {attachedFiles.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20, height: 0 }}
                animate={{ opacity: 1, y: 0, height: "auto" }}
                exit={{ opacity: 0, y: 20, height: 0 }}
                className="mb-4"
              >
                <div className="bg-card/95 backdrop-blur-xl rounded-2xl border border-border shadow-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-foreground">
                      {attachedFiles.length} file{attachedFiles.length > 1 ? "s" : ""} attached
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearAllFiles}
                      className="text-muted-foreground hover:text-destructive h-6 px-2"
                    >
                      Clear all
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {attachedFiles.map((file, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="flex items-center space-x-2 bg-secondary/50 rounded-lg px-3 py-2 text-sm group"
                      >
                        <FileText className="w-4 h-4 text-muted-foreground" />
                        <span className="truncate max-w-32 text-foreground">{file.name}</span>
                        <span className="text-xs text-muted-foreground">({formatFileSize(file.size)})</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(index)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-0 h-auto text-muted-foreground hover:text-destructive"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Main Input Area */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative">
            <div
              className={`bg-card/95 backdrop-blur-xl rounded-2xl border transition-all duration-200 shadow-lg ${
                isFocused ? "border-primary shadow-xl" : "border-border"
              }`}
            >
              <div className="flex items-end space-x-3 p-4">
                {/* Attach Button */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={onFileAttach}
                      disabled={!isConnected}
                      className="text-muted-foreground hover:text-foreground hover:bg-secondary/50 h-10 w-10 p-0 rounded-xl"
                    >
                      <Paperclip className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Attach files</TooltipContent>
                </Tooltip>

                {/* Text Input */}
                <div className="flex-1 relative">
                  <Textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    onKeyDown={handleKeyDown}
                    placeholder={
                      !isConnected
                        ? "Reconnecting..."
                        : attachedFiles.length > 0
                          ? `Ask about your ${attachedFiles.length} attached file${attachedFiles.length > 1 ? "s" : ""}...`
                          : "Drop some plans, Paste a link or say 'What's Up!'"
                    }
                    disabled={!isConnected}
                    className="min-h-[24px] max-h-32 resize-none border-0 bg-transparent text-foreground placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0 p-0 text-base"
                    rows={1}
                    style={{
                      height: "auto",
                      minHeight: "24px",
                    }}
                    onInput={(e) => {
                      const target = e.target as HTMLTextAreaElement
                      target.style.height = "auto"
                      target.style.height = Math.min(target.scrollHeight, 128) + "px"
                    }}
                  />
                </div>

                {/* Voice/Send Button */}
                <div className="flex items-center space-x-2">
                  {/* Voice Recording Button */}
                  {!input.trim() && attachedFiles.length === 0 && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={toggleRecording}
                          disabled={!isConnected}
                          className={`h-10 w-10 p-0 rounded-xl transition-all ${
                            isRecording
                              ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                          }`}
                        >
                          {isRecording ? <Square className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>{isRecording ? "Stop recording" : "Voice message"}</TooltipContent>
                    </Tooltip>
                  )}

                  {/* Send Button */}
                  {(input.trim() || attachedFiles.length > 0) && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    >
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            onClick={onSend}
                            disabled={!canSend}
                            className="bg-primary hover:bg-primary/90 text-primary-foreground h-10 w-10 p-0 rounded-xl transition-all"
                          >
                            <Send className="w-4 h-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Send message</TooltipContent>
                      </Tooltip>
                    </motion.div>
                  )}
                </div>
              </div>

              {/* Connection Status */}
              {!isConnected && (
                <div className="px-4 pb-3">
                  <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                    <div className="w-2 h-2 bg-destructive rounded-full animate-pulse" />
                    <span>Reconnecting...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => {
                // This would be handled by the parent component
                if (e.target.files) {
                  // Handle file selection
                }
              }}
              accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.txt"
            />
          </motion.div>

          {/* Keyboard Shortcut Hint */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-center mt-3"
          >
            <p className="text-xs text-muted-foreground">
              Press <kbd className="px-1.5 py-0.5 bg-secondary rounded text-xs">Enter</kbd> to send,{" "}
              <kbd className="px-1.5 py-0.5 bg-secondary rounded text-xs">Shift + Enter</kbd> for new line
            </p>
          </motion.div>
        </div>
      </motion.div>
    </TooltipProvider>
  )
}
