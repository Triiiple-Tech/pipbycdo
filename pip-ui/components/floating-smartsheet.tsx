"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, ExternalLink, Grid3X3, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"

interface FloatingSmartsheetProps {
  isOpen: boolean
  onClose: () => void
  onSheetSelected: (sheetUrl: string, sheetData: any) => void
}

interface SmartsheetData {
  id: string
  name: string
  url: string
  rows: number
  attachments: number
  lastModified: string
}

export function FloatingSmartsheet({ isOpen, onClose, onSheetSelected }: FloatingSmartsheetProps) {
  const [sheetUrl, setSheetUrl] = useState("")
  const [sheets, setSheets] = useState<SmartsheetData[]>([
    {
      id: "1",
      name: "Construction Project Alpha",
      url: "https://app.smartsheet.com/sheets/abc123",
      rows: 156,
      attachments: 23,
      lastModified: "2 hours ago",
    },
    {
      id: "2",
      name: "Trade Analysis Q4",
      url: "https://app.smartsheet.com/sheets/def456",
      rows: 89,
      attachments: 12,
      lastModified: "1 day ago",
    },
  ])

  const handleConnectSheet = () => {
    if (sheetUrl.trim()) {
      const newSheet: SmartsheetData = {
        id: Date.now().toString(),
        name: "New Smartsheet",
        url: sheetUrl,
        rows: 0,
        attachments: 0,
        lastModified: "Just now",
      }
      setSheets((prev) => [newSheet, ...prev])
      setSheetUrl("")
    }
  }

  const handleSelectSheet = (sheet: SmartsheetData) => {
    onSheetSelected(sheet.url, sheet)
    onClose()
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
            className="w-full max-w-2xl max-h-[80vh] overflow-hidden"
          >
            <Card className="bg-background/95 backdrop-blur-xl border border-border shadow-2xl">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-border">
                <div className="flex items-center space-x-3">
                  <Grid3X3 className="w-6 h-6 text-primary" />
                  <h2 className="text-xl font-semibold text-foreground">Smartsheet Integration</h2>
                </div>
                <Button variant="ghost" size="sm" onClick={onClose}>
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
                {/* Connect New Sheet */}
                <Card className="p-4 border border-border">
                  <h3 className="font-semibold text-foreground mb-3">Connect New Sheet</h3>
                  <div className="flex space-x-3">
                    <Input
                      placeholder="Enter Smartsheet URL or ID..."
                      value={sheetUrl}
                      onChange={(e) => setSheetUrl(e.target.value)}
                      className="flex-1"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleConnectSheet()
                        }
                      }}
                    />
                    <Button onClick={handleConnectSheet} disabled={!sheetUrl.trim()}>
                      <Plus className="w-4 h-4 mr-2" />
                      Connect
                    </Button>
                  </div>
                </Card>

                {/* Available Sheets */}
                <div>
                  <h3 className="font-semibold text-foreground mb-3">Available Sheets</h3>
                  <div className="space-y-3">
                    {sheets.map((sheet) => (
                      <Card
                        key={sheet.id}
                        className="p-4 cursor-pointer hover:bg-secondary/50 transition-colors border border-border"
                        onClick={() => handleSelectSheet(sheet)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                              <Grid3X3 className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                              <h4 className="font-medium text-foreground">{sheet.name}</h4>
                              <p className="text-sm text-muted-foreground">
                                {sheet.rows} rows • {sheet.attachments} attachments • {sheet.lastModified}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge variant="secondary">Connected</Badge>
                            <Button variant="ghost" size="sm">
                              <ExternalLink className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>

                {/* Instructions */}
                <Card className="p-4 bg-muted/50">
                  <h4 className="font-medium text-foreground mb-2">How to use:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Connect a Smartsheet by pasting its URL above</li>
                    <li>• Select a sheet to import its data into your chat</li>
                    <li>• Ask questions about the sheet data or attachments</li>
                    <li>• Export analysis results back to Smartsheet</li>
                  </ul>
                </Card>
              </div>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
