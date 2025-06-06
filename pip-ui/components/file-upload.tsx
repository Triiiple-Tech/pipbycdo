"use client"

import type React from "react"

import { useState, useCallback } from "react"
import { Upload, File, X, CheckCircle, AlertCircle, Loader2 } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface UploadedFile {
  id: string
  name: string
  size: number
  type: string
  status: "uploading" | "analyzing" | "complete" | "error"
  progress: number
  result?: string
}

export function FileUpload() {
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [isDragOver, setIsDragOver] = useState(false)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)

    const droppedFiles = Array.from(e.dataTransfer.files)
    processFiles(droppedFiles)
  }, [])

  const processFiles = (fileList: File[]) => {
    fileList.forEach((file) => {
      const uploadedFile: UploadedFile = {
        id: Date.now().toString() + Math.random(),
        name: file.name,
        size: file.size,
        type: file.type,
        status: "uploading",
        progress: 0,
      }

      setFiles((prev) => [...prev, uploadedFile])

      // Simulate upload and analysis
      simulateFileProcessing(uploadedFile.id)
    })
  }

  const simulateFileProcessing = (fileId: string) => {
    // Simulate upload progress
    const uploadInterval = setInterval(() => {
      setFiles((prev) =>
        prev.map((file) => {
          if (file.id === fileId && file.status === "uploading") {
            const newProgress = Math.min(file.progress + 20, 100)
            if (newProgress === 100) {
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
    }, 300)
  }

  const simulateAnalysis = (fileId: string) => {
    const analysisInterval = setInterval(() => {
      setFiles((prev) =>
        prev.map((file) => {
          if (file.id === fileId && file.status === "analyzing") {
            const newProgress = Math.min(file.progress + 15, 100)
            if (newProgress === 100) {
              clearInterval(analysisInterval)
              setTimeout(() => {
                setFiles((prev) =>
                  prev.map((f) =>
                    f.id === fileId
                      ? {
                          ...f,
                          status: "complete",
                          result: "Analysis complete: Found 15 trade items, estimated 240 hours total.",
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
    }, 400)
  }

  const removeFile = (fileId: string) => {
    setFiles((prev) => prev.filter((file) => file.id !== fileId))
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "uploading":
      case "analyzing":
        return <Loader2 className="w-4 h-4 animate-spin text-[#E60023]" />
      case "complete":
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case "error":
        return <AlertCircle className="w-4 h-4 text-red-500" />
      default:
        return <File className="w-4 h-4 text-gray-400" />
    }
  }

  return (
    <div className="h-full p-6 space-y-6">
      {/* Drop Zone */}
      <Card
        className={`relative border-2 border-dashed transition-all duration-300 ${
          isDragOver ? "border-[#E60023] bg-[#E60023]/5 scale-105" : "border-gray-300 hover:border-[#E60023]/50"
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="p-12 text-center">
          <div
            className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center transition-colors ${
              isDragOver ? "bg-[#E60023] text-white" : "bg-gray-100 text-gray-400"
            }`}
          >
            <Upload className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Drop files here to analyze</h3>
          <p className="text-gray-600 mb-4">Support for PDF, Excel, Word, and image files</p>
          <Button
            variant="outline"
            className="border-[#E60023] text-[#E60023] hover:bg-[#E60023] hover:text-white"
            onClick={() => document.getElementById("file-input")?.click()}
          >
            Browse Files
          </Button>
          <input
            id="file-input"
            type="file"
            multiple
            className="hidden"
            onChange={(e) => e.target.files && processFiles(Array.from(e.target.files))}
          />
        </div>
      </Card>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Uploaded Files</h3>
          {files.map((file) => (
            <Card key={file.id} className="p-4 bg-white/80 backdrop-blur-sm shadow-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3 flex-1">
                  {getStatusIcon(file.status)}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{file.name}</p>
                    <p className="text-sm text-gray-500">{formatFileSize(file.size)}</p>
                    {file.status !== "complete" && (
                      <div className="mt-2">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-[#E60023] h-2 rounded-full transition-all duration-300"
                            style={{ width: `${file.progress}%` }}
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {file.status === "uploading" ? "Uploading..." : "Analyzing..."}
                        </p>
                      </div>
                    )}
                    {file.result && <p className="text-sm text-green-600 mt-2">{file.result}</p>}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant={file.status === "complete" ? "default" : "secondary"}>{file.status}</Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(file.id)}
                    className="text-gray-400 hover:text-red-500"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
