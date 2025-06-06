"use client"

import { useState } from "react"
import { Search, ExternalLink, Download, Play, Grid3X3 } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"

interface SmartsheetData {
  id: string
  name: string
  rows: number
  attachments: number
  lastModified: string
}

interface Attachment {
  id: string
  name: string
  type: string
  size: string
  status: "pending" | "analyzing" | "complete"
}

export function SmartsheetPanel() {
  const [sheetUrl, setSheetUrl] = useState("")
  const [sheets, setSheets] = useState<SmartsheetData[]>([
    {
      id: "1",
      name: "Construction Project Alpha",
      rows: 156,
      attachments: 23,
      lastModified: "2 hours ago",
    },
    {
      id: "2",
      name: "Trade Analysis Q4",
      rows: 89,
      attachments: 12,
      lastModified: "1 day ago",
    },
  ])

  const [selectedSheet, setSelectedSheet] = useState<SmartsheetData | null>(null)
  const [attachments, setAttachments] = useState<Attachment[]>([
    { id: "1", name: "Floor_Plans.pdf", type: "PDF", size: "2.4 MB", status: "pending" },
    { id: "2", name: "Material_List.xlsx", type: "Excel", size: "856 KB", status: "complete" },
    { id: "3", name: "Specifications.docx", type: "Word", size: "1.2 MB", status: "pending" },
  ])

  const analyzeAttachment = (attachmentId: string) => {
    setAttachments((prev) => prev.map((att) => (att.id === attachmentId ? { ...att, status: "analyzing" } : att)))

    setTimeout(() => {
      setAttachments((prev) => prev.map((att) => (att.id === attachmentId ? { ...att, status: "complete" } : att)))
    }, 3000)
  }

  const analyzeAllAttachments = () => {
    setAttachments((prev) => prev.map((att) => ({ ...att, status: "analyzing" })))

    setTimeout(() => {
      setAttachments((prev) => prev.map((att) => ({ ...att, status: "complete" })))
    }, 5000)
  }

  return (
    <div className="h-full p-6 space-y-6">
      {/* Sheet Connection */}
      <Card className="p-6 bg-black/20 backdrop-blur-xl border border-white/10 shadow-lg">
        <h2 className="text-xl font-semibold text-white mb-4">Smartsheet Integration</h2>
        <div className="flex space-x-4">
          <Input
            placeholder="Enter Smartsheet URL or ID..."
            value={sheetUrl}
            onChange={(e) => setSheetUrl(e.target.value)}
            className="flex-1 bg-black/20 border-white/20 text-white placeholder:text-white/40 focus:border-[#E60023]"
          />
          <Button className="bg-[#E60023] hover:bg-[#E60023]/90 text-white">
            <Search className="w-4 h-4 mr-2" />
            Connect
          </Button>
        </div>
      </Card>

      {/* Available Sheets */}
      <Card className="p-6 bg-black/20 backdrop-blur-xl border border-white/10 shadow-lg">
        <h3 className="text-lg font-semibold text-white mb-4">Available Sheets</h3>
        <div className="space-y-3">
          {sheets.map((sheet) => (
            <div
              key={sheet.id}
              className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                selectedSheet?.id === sheet.id
                  ? "border-[#E60023] bg-[#E60023]/5"
                  : "border-gray-200 hover:border-[#E60023]/50"
              }`}
              onClick={() => setSelectedSheet(sheet)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Grid3X3 className="w-5 h-5 text-[#E60023]" />
                  <div>
                    <h4 className="font-medium text-white">{sheet.name}</h4>
                    <p className="text-sm text-white/60">
                      {sheet.rows} rows • {sheet.attachments} attachments • {sheet.lastModified}
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="sm">
                  <ExternalLink className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Sheet Details */}
      {selectedSheet && (
        <Card className="p-6 bg-black/20 backdrop-blur-xl border border-white/10 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">{selectedSheet.name} - Attachments</h3>
            <Button onClick={analyzeAllAttachments} className="bg-[#E60023] hover:bg-[#E60023]/90 text-white">
              <Play className="w-4 h-4 mr-2" />
              Analyze All
            </Button>
          </div>

          <div className="space-y-3">
            {attachments.map((attachment) => (
              <div key={attachment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-[#E60023]/10 rounded-lg flex items-center justify-center">
                    <span className="text-xs font-medium text-[#E60023]">{attachment.type}</span>
                  </div>
                  <div>
                    <p className="font-medium text-white">{attachment.name}</p>
                    <p className="text-sm text-white/60">{attachment.size}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Badge
                    variant={attachment.status === "complete" ? "default" : "secondary"}
                    className={attachment.status === "analyzing" ? "animate-pulse" : ""}
                  >
                    {attachment.status}
                  </Badge>

                  <div className="flex space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => analyzeAttachment(attachment.id)}
                      disabled={attachment.status === "analyzing"}
                    >
                      <Play className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
