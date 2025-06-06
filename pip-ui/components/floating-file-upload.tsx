"use client"

import type React from "react"

import { useState, useCallback, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Upload, FileText, ImageIcon, FileSpreadsheet, CheckCircle, AlertCircle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

interface FloatingFileUploadProps {
  isOpen: boolean
  onClose: () => void
  onFilesSelected: (files: File[]) => void
}

interface UploadedFile {
  id: string
  file: File
  name: string
  size: number
  type: string
  status: "uploading" | "analyzing" | "complete" | "error"
  progress: number
  result?: string
}

const ACCEPTED_FILE_TYPES = {
  "application/pdf": { icon: FileText, color: "text-red-600", bg: "bg-red-100" },
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": {
    icon: FileText,
    color: "text-blue-600",
    bg: "bg-blue-100",
  },
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": {
    icon: FileSpreadsheet,
    color: "text-green-600",
    bg: "bg-green-100",
  },
  "text/plain": { icon: FileText, color: "text-gray-600", bg: "bg-gray-100" },
  "image/jpeg": { icon: ImageIcon, color: "text-purple-600", bg: "bg-purple-100" },
  "image/png": { icon: ImageIcon, color: "text-purple-600", bg: "bg-purple-100" },
}

export function FloatingFileUpload({ isOpen, onClose, onFilesSelected }: FloatingFileUploadProps) {
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const processFiles = (fileList: File[]) => {
    const newFiles: UploadedFile[] = fileList.map((file) => ({
      id: Date.now().toString() + Math.random(),
      file,
      name: file.name,
      size: file.size,
      type: file.type,
      status: "uploading",
      progress: 0,
    }))

    setFiles((prev) => [...prev, ...newFiles])
    onFilesSelected(fileList)

    // Simulate processing
    newFiles.forEach((file) => {
      simulateProcessing(file.id)
    })
  }

  const simulateProcessing = (fileId: string) => {
    const interval = setInterval(() => {
      setFiles((prev) =>
        prev.map((file) => {
          if (file.id === fileId && file.status === "uploading") {
            const newProgress = Math.min(file.progress + 20, 100)
            if (newProgress === 100) {
              clearInterval(interval)
              setTimeout(() => {
                setFiles((prev) =>
                  prev.map((f) =>
                    f.id === fileId ? { ...f, status: "complete", result: "File processed successfully" } : f,
                  ),
                )
              }, 500)
            }
            return { ...file, progress: newProgress }
          }
          return file
        }),
      )
    }, 300)
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    const droppedFiles = Array.from(e.dataTransfer.files)
    processFiles(droppedFiles)
  }, [])

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const getFileTypeInfo = (type: string) => {
    return ACCEPTED_FILE_TYPES[type as keyof typeof ACCEPTED_FILE_TYPES] || ACCEPTED_FILE_TYPES["text/plain"]
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
                <h2 className="text-xl font-semibold text-foreground">Upload Files</h2>
                <Button variant="ghost" size="sm" onClick={onClose}>
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
                {/* Drop Zone */}
                <Card
                  className={`border-2 border-dashed transition-all ${
                    isDragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                  }`}
                  onDragOver={(e) => {
                    e.preventDefault()
                    setIsDragOver(true)
                  }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={handleDrop}
                >
                  <div className="p-8 text-center">
                    <Upload
                      className={`w-12 h-12 mx-auto mb-4 ${isDragOver ? "text-primary" : "text-muted-foreground"}`}
                    />
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      {isDragOver ? "Drop files here" : "Drag & drop files here"}
                    </h3>
                    <p className="text-muted-foreground mb-4">Support for PDF, Excel, Word, images, and text files</p>
                    <Button
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                    >
                      Browse Files
                    </Button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      className="hidden"
                      accept={Object.keys(ACCEPTED_FILE_TYPES).join(",")}
                      onChange={(e) => e.target.files && processFiles(Array.from(e.target.files))}
                    />
                  </div>
                </Card>

                {/* File List */}
                {files.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="font-semibold text-foreground">Uploaded Files ({files.length})</h3>
                    {files.map((file) => {
                      const typeInfo = getFileTypeInfo(file.type)
                      return (
                        <Card key={file.id} className="p-4">
                          <div className="flex items-center space-x-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${typeInfo.bg}`}>
                              <typeInfo.icon className={`w-5 h-5 ${typeInfo.color}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-foreground truncate">{file.name}</p>
                              <p className="text-sm text-muted-foreground">{formatFileSize(file.size)}</p>
                              {file.status !== "complete" && (
                                <div className="mt-2">
                                  <Progress value={file.progress} className="h-2" />
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {file.status === "uploading" ? "Processing..." : "Analyzing..."}
                                  </p>
                                </div>
                              )}
                              {file.result && <p className="text-sm text-green-600 mt-2">{file.result}</p>}
                            </div>
                            <div className="flex items-center">
                              {file.status === "uploading" && <Loader2 className="w-4 h-4 animate-spin text-primary" />}
                              {file.status === "complete" && <CheckCircle className="w-4 h-4 text-green-500" />}
                              {file.status === "error" && <AlertCircle className="w-4 h-4 text-red-500" />}
                            </div>
                          </div>
                        </Card>
                      )
                    })}
                  </div>
                )}
              </div>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
