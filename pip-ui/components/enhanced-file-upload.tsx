"use client"

import type React from "react"

import { useState, useCallback, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Upload,
  File,
  X,
  CheckCircle,
  AlertCircle,
  Loader2,
  FileText,
  ImageIcon,
  FileSpreadsheet,
  Archive,
  Play,
  Pause,
  RotateCcw,
} from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { useDragDrop } from "@/components/drag-drop-provider"

interface UploadedFile {
  id: string
  file: File
  name: string
  size: number
  type: string
  status: "uploading" | "analyzing" | "complete" | "error" | "paused"
  progress: number
  result?: string
  error?: string
  thumbnail?: string
}

const ACCEPTED_FILE_TYPES = {
  "application/pdf": { icon: FileText, color: "text-red-600 dark:text-red-400", bg: "bg-red-100 dark:bg-red-900/30" },
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": {
    icon: FileText,
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-100 dark:bg-blue-900/30",
  },
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": {
    icon: FileSpreadsheet,
    color: "text-green-600 dark:text-green-400",
    bg: "bg-green-100 dark:bg-green-900/30",
  },
  "text/plain": { icon: FileText, color: "text-gray-600 dark:text-gray-400", bg: "bg-gray-100 dark:bg-gray-900/30" },
  "image/jpeg": {
    icon: ImageIcon,
    color: "text-purple-600 dark:text-purple-400",
    bg: "bg-purple-100 dark:bg-purple-900/30",
  },
  "image/png": {
    icon: ImageIcon,
    color: "text-purple-600 dark:text-purple-400",
    bg: "bg-purple-100 dark:bg-purple-900/30",
  },
  "application/zip": {
    icon: Archive,
    color: "text-yellow-600 dark:text-yellow-400",
    bg: "bg-yellow-100 dark:bg-yellow-900/30",
  },
}

const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB
const MAX_FILES = 10

export function EnhancedFileUpload() {
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [isDragOver, setIsDragOver] = useState(false)
  const [dragDepth, setDragDepth] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { isDragging: globalDragging } = useDragDrop()

  const validateFile = (file: File): string | null => {
    if (file.size > MAX_FILE_SIZE) {
      return `File size exceeds 50MB limit`
    }
    if (!Object.keys(ACCEPTED_FILE_TYPES).includes(file.type)) {
      return `File type ${file.type} not supported`
    }
    if (files.length >= MAX_FILES) {
      return `Maximum ${MAX_FILES} files allowed`
    }
    return null
  }

  const generateThumbnail = async (file: File): Promise<string | undefined> => {
    if (file.type.startsWith("image/")) {
      return new Promise((resolve) => {
        const reader = new FileReader()
        reader.onload = (e) => resolve(e.target?.result as string)
        reader.readAsDataURL(file)
      })
    }
    return undefined
  }

  const processFiles = async (fileList: File[]) => {
    const validFiles: UploadedFile[] = []
    const errors: string[] = []

    for (const file of fileList) {
      const error = validateFile(file)
      if (error) {
        errors.push(`${file.name}: ${error}`)
        continue
      }

      const thumbnail = await generateThumbnail(file)
      const uploadedFile: UploadedFile = {
        id: Date.now().toString() + Math.random(),
        file,
        name: file.name,
        size: file.size,
        type: file.type,
        status: "uploading",
        progress: 0,
        thumbnail,
      }

      validFiles.push(uploadedFile)
    }

    if (errors.length > 0) {
      alert(`Some files were rejected:\n${errors.join("\n")}`)
    }

    setFiles((prev) => [...prev, ...validFiles])

    // Process each file
    validFiles.forEach((file) => {
      simulateFileProcessing(file.id)
    })
  }

  const simulateFileProcessing = async (fileId: string) => {
    // Upload simulation
    const uploadInterval = setInterval(() => {
      setFiles((prev) =>
        prev.map((file) => {
          if (file.id === fileId && file.status === "uploading") {
            const newProgress = Math.min(file.progress + Math.random() * 25, 100)
            if (newProgress >= 100) {
              clearInterval(uploadInterval)
              setTimeout(() => {
                setFiles((prev) => prev.map((f) => (f.id === fileId ? { ...f, status: "analyzing", progress: 0 } : f)))
                simulateAnalysis(fileId)
              }, 500)
            }
            return { ...file, progress: newProgress }
          }
          return file
        }),
      )
    }, 200)
  }

  const simulateAnalysis = (fileId: string) => {
    const analysisInterval = setInterval(() => {
      setFiles((prev) =>
        prev.map((file) => {
          if (file.id === fileId && file.status === "analyzing") {
            const newProgress = Math.min(file.progress + Math.random() * 15, 100)
            if (newProgress >= 100) {
              clearInterval(analysisInterval)
              setTimeout(() => {
                const success = Math.random() > 0.1 // 90% success rate
                setFiles((prev) =>
                  prev.map((f) =>
                    f.id === fileId
                      ? {
                          ...f,
                          status: success ? "complete" : "error",
                          result: success
                            ? `Analysis complete: Found ${Math.floor(Math.random() * 20) + 5} key insights, estimated ${Math.floor(Math.random() * 500) + 100} hours total.`
                            : undefined,
                          error: success ? undefined : "Analysis failed due to corrupted file format",
                        }
                      : f,
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

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragDepth((prev) => prev + 1)
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragDepth((prev) => {
      const newDepth = prev - 1
      if (newDepth === 0) {
        setIsDragOver(false)
      }
      return newDepth
    })
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
    setDragDepth(0)

    const droppedFiles = Array.from(e.dataTransfer.files)
    processFiles(droppedFiles)
  }, [])

  const removeFile = (fileId: string) => {
    setFiles((prev) => prev.filter((file) => file.id !== fileId))
  }

  const retryFile = (fileId: string) => {
    setFiles((prev) => prev.map((f) => (f.id === fileId ? { ...f, status: "uploading", progress: 0 } : f)))
    simulateFileProcessing(fileId)
  }

  const pauseFile = (fileId: string) => {
    setFiles((prev) => prev.map((f) => (f.id === fileId ? { ...f, status: "paused" } : f)))
  }

  const resumeFile = (fileId: string) => {
    setFiles((prev) => prev.map((f) => (f.id === fileId ? { ...f, status: "uploading" } : f)))
    simulateFileProcessing(fileId)
  }

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

  const getStatusIcon = (file: UploadedFile) => {
    switch (file.status) {
      case "uploading":
        return <Loader2 className="w-4 h-4 animate-spin text-[#E60023]" />
      case "analyzing":
        return <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
      case "complete":
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case "error":
        return <AlertCircle className="w-4 h-4 text-red-500" />
      case "paused":
        return <Pause className="w-4 h-4 text-yellow-500" />
      default:
        return <File className="w-4 h-4 text-gray-400" />
    }
  }

  return (
    <div className="h-full p-6 space-y-6">
      {/* Enhanced Drop Zone */}
      <motion.div
        animate={{
          scale: isDragOver || globalDragging ? 1.02 : 1,
          borderColor: isDragOver ? "#E60023" : "#D1D5DB",
        }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        <Card
          className={`relative border-2 border-dashed transition-all duration-300 overflow-hidden ${
            isDragOver
              ? "border-[#E60023] bg-[#E60023]/5 shadow-lg"
              : "border-border hover:border-primary/50 hover:shadow-md"
          }`}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          {/* Animated Background */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-br from-[#E60023]/10 to-transparent"
            animate={{ opacity: isDragOver ? 1 : 0 }}
            transition={{ duration: 0.3 }}
          />

          <div className="relative p-12 text-center">
            <motion.div
              animate={{
                y: isDragOver ? -10 : 0,
                scale: isDragOver ? 1.1 : 1,
              }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className={`w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center transition-colors ${
                isDragOver ? "bg-[#E60023] text-white" : "bg-muted text-muted-foreground"
              }`}
            >
              <Upload className="w-10 h-10" />
            </motion.div>

            <motion.h3 animate={{ color: isDragOver ? "#E60023" : "#111827" }} className="text-xl font-semibold mb-2">
              {isDragOver ? "Drop files to upload" : "Drag & drop files here"}
            </motion.h3>

            <p className="text-white/80 mb-6">Support for PDF, Excel, Word, images, and text files up to 50MB each</p>

            <div className="flex flex-wrap justify-center gap-2 mb-6">
              {Object.entries(ACCEPTED_FILE_TYPES).map(([type, info]) => (
                <motion.div
                  key={type}
                  whileHover={{ scale: 1.05 }}
                  className={`flex items-center space-x-1 px-3 py-1 rounded-full text-xs ${info.bg} ${info.color}`}
                >
                  <info.icon className="w-3 h-3" />
                  <span>{type.split("/")[1].toUpperCase()}</span>
                </motion.div>
              ))}
            </div>

            <Button
              variant="outline"
              className="border-[#E60023] text-[#E60023] hover:bg-[#E60023] hover:text-white transition-all"
              onClick={() => fileInputRef.current?.click()}
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
      </motion.div>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">Uploaded Files ({files.length})</h3>
            <div className="flex space-x-2">
              <Badge variant="secondary">{files.filter((f) => f.status === "complete").length} Complete</Badge>
              <Badge variant="outline">{files.filter((f) => f.status === "error").length} Errors</Badge>
            </div>
          </div>

          <AnimatePresence>
            {files.map((file) => {
              const typeInfo = getFileTypeInfo(file.type)
              return (
                <motion.div
                  key={file.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  layout
                >
                  <Card className="p-4 bg-black/20 backdrop-blur-xl border border-white/10 shadow-lg hover:shadow-xl transition-all">
                    <div className="flex items-center space-x-4">
                      {/* File Icon/Thumbnail */}
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${typeInfo.bg}`}>
                        {file.thumbnail ? (
                          <img
                            src={file.thumbnail || "/placeholder.svg"}
                            alt={file.name}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        ) : (
                          <typeInfo.icon className={`w-6 h-6 ${typeInfo.color}`} />
                        )}
                      </div>

                      {/* File Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <p className="font-medium text-white truncate">{file.name}</p>
                          {getStatusIcon(file)}
                        </div>
                        <p className="text-sm text-white/60 mb-2">{formatFileSize(file.size)}</p>

                        {/* Progress Bar */}
                        {(file.status === "uploading" || file.status === "analyzing") && (
                          <div className="space-y-1">
                            <Progress value={file.progress} className="h-2" />
                            <p className="text-xs text-white/60">
                              {file.status === "uploading" ? "Uploading..." : "Analyzing..."}{" "}
                              {Math.round(file.progress)}%
                            </p>
                          </div>
                        )}

                        {/* Results */}
                        {file.result && (
                          <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-sm text-green-600 mt-2 p-2 bg-green-50 rounded"
                          >
                            {file.result}
                          </motion.p>
                        )}

                        {/* Errors */}
                        {file.error && (
                          <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-sm text-red-600 mt-2 p-2 bg-red-50 rounded"
                          >
                            {file.error}
                          </motion.p>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center space-x-2">
                        <Badge
                          variant={
                            file.status === "complete"
                              ? "default"
                              : file.status === "error"
                                ? "destructive"
                                : "secondary"
                          }
                          className={file.status === "analyzing" || file.status === "uploading" ? "animate-pulse" : ""}
                        >
                          {file.status}
                        </Badge>

                        <div className="flex space-x-1">
                          {file.status === "error" && (
                            <Button variant="ghost" size="sm" onClick={() => retryFile(file.id)} title="Retry">
                              <RotateCcw className="w-4 h-4" />
                            </Button>
                          )}

                          {(file.status === "uploading" || file.status === "analyzing") && (
                            <Button variant="ghost" size="sm" onClick={() => pauseFile(file.id)} title="Pause">
                              <Pause className="w-4 h-4" />
                            </Button>
                          )}

                          {file.status === "paused" && (
                            <Button variant="ghost" size="sm" onClick={() => resumeFile(file.id)} title="Resume">
                              <Play className="w-4 h-4" />
                            </Button>
                          )}

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFile(file.id)}
                            className="text-gray-400 hover:text-red-500"
                            title="Remove"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
