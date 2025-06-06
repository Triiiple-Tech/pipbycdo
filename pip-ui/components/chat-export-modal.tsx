"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Download, Mail, Copy, FileText, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"

interface ChatExportModalProps {
  isOpen: boolean
  onClose: () => void
  messages: any[]
}

export function ChatExportModal({ isOpen, onClose, messages }: ChatExportModalProps) {
  const [exportFormat, setExportFormat] = useState<"pdf" | "txt" | "json">("pdf")
  const [emailAddress, setEmailAddress] = useState("")
  const [isExporting, setIsExporting] = useState(false)
  const [exportSuccess, setExportSuccess] = useState(false)

  const handleExport = async (method: "download" | "email" | "copy") => {
    setIsExporting(true)

    // Simulate export process
    await new Promise((resolve) => setTimeout(resolve, 2000))

    if (method === "download") {
      // Simulate file download
      const blob = new Blob([generateExportContent()], { type: "text/plain" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `pip-ai-chat-${new Date().toISOString().split("T")[0]}.${exportFormat}`
      a.click()
      URL.revokeObjectURL(url)
    } else if (method === "email") {
      // Simulate email sending
      console.log("Sending to:", emailAddress)
    } else if (method === "copy") {
      // Copy to clipboard
      navigator.clipboard.writeText(generateExportContent())
    }

    setIsExporting(false)
    setExportSuccess(true)
    setTimeout(() => {
      setExportSuccess(false)
      onClose()
    }, 1500)
  }

  const generateExportContent = () => {
    return messages
      .map((msg) => {
        const timestamp = new Date(msg.timestamp).toLocaleString()
        const sender = msg.type === "user" ? "User" : msg.agent || "Agent"
        return `[${timestamp}] ${sender}: ${msg.content}`
      })
      .join("\n\n")
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", duration: 0.5 }}
            onClick={(e) => e.stopPropagation()}
          >
            <Card className="w-full max-w-lg p-6 bg-white/90 backdrop-blur-xl shadow-2xl border border-white/20">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">Export Chat History</h3>
                <Button variant="ghost" size="sm" onClick={onClose}>
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {exportSuccess ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-8"
                >
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FileText className="w-8 h-8 text-green-600" />
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">Export Successful!</h4>
                  <p className="text-gray-600">Your chat history has been exported successfully.</p>
                </motion.div>
              ) : (
                <div className="space-y-6">
                  {/* Export Format */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">Export Format</label>
                    <div className="flex space-x-2">
                      {["pdf", "txt", "json"].map((format) => (
                        <Button
                          key={format}
                          variant={exportFormat === format ? "default" : "outline"}
                          size="sm"
                          onClick={() => setExportFormat(format as any)}
                          className={exportFormat === format ? "bg-[#E60023] text-white" : ""}
                        >
                          {format.toUpperCase()}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Chat Summary */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <span>Total Messages:</span>
                      <Badge variant="secondary">{messages.length}</Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm text-gray-600 mt-2">
                      <span>Date Range:</span>
                      <span>
                        {messages.length > 0
                          ? `${new Date(messages[0].timestamp).toLocaleDateString()} - ${new Date(
                              messages[messages.length - 1].timestamp,
                            ).toLocaleDateString()}`
                          : "No messages"}
                      </span>
                    </div>
                  </div>

                  {/* Export Options */}
                  <div className="space-y-4">
                    {/* Download */}
                    <Button
                      onClick={() => handleExport("download")}
                      disabled={isExporting || messages.length === 0}
                      className="w-full bg-[#E60023] hover:bg-[#C4001A] text-white"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      {isExporting ? "Exporting..." : "Download File"}
                    </Button>

                    {/* Email */}
                    <div className="space-y-2">
                      <Input
                        placeholder="Enter email address..."
                        value={emailAddress}
                        onChange={(e) => setEmailAddress(e.target.value)}
                        type="email"
                      />
                      <Button
                        onClick={() => handleExport("email")}
                        disabled={isExporting || !emailAddress || messages.length === 0}
                        variant="outline"
                        className="w-full"
                      >
                        <Mail className="w-4 h-4 mr-2" />
                        Email Export
                      </Button>
                    </div>

                    {/* Copy to Clipboard */}
                    <Button
                      onClick={() => handleExport("copy")}
                      disabled={isExporting || messages.length === 0}
                      variant="outline"
                      className="w-full"
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Copy to Clipboard
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
