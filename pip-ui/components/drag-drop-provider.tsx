"use client"

import React from "react"

import { createContext, useContext, useState, useCallback, type ReactNode } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Upload, FileText, ImageIcon, FileSpreadsheet } from "lucide-react"

interface DragDropContextType {
  isDragging: boolean
  draggedFiles: File[]
  setIsDragging: (dragging: boolean) => void
  handleGlobalDrop: (files: File[]) => void
  onFilesAccepted?: (files: File[]) => void
}

const DragDropContext = createContext<DragDropContextType | null>(null)

export function useDragDrop() {
  const context = useContext(DragDropContext)
  if (!context) {
    throw new Error("useDragDrop must be used within DragDropProvider")
  }
  return context
}

interface DragDropProviderProps {
  children: ReactNode
  onFilesAccepted?: (files: File[]) => void
}

export function DragDropProvider({ children, onFilesAccepted }: DragDropProviderProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [draggedFiles, setDraggedFiles] = useState<File[]>([])
  const [showGlobalOverlay, setShowGlobalOverlay] = useState(false)
  const [dragCounter, setDragCounter] = useState(0)

  const handleGlobalDragEnter = useCallback((e: DragEvent) => {
    e.preventDefault()
    setDragCounter((prev) => prev + 1)
    if (e.dataTransfer?.types.includes("Files")) {
      setIsDragging(true)
      setShowGlobalOverlay(true)
    }
  }, [])

  const handleGlobalDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault()
    setDragCounter((prev) => {
      const newCounter = prev - 1
      if (newCounter === 0) {
        setIsDragging(false)
        setShowGlobalOverlay(false)
      }
      return newCounter
    })
  }, [])

  const handleGlobalDragOver = useCallback((e: DragEvent) => {
    e.preventDefault()
  }, [])

  const handleGlobalDrop = useCallback(
    (files: File[]) => {
      setIsDragging(false)
      setShowGlobalOverlay(false)
      setDragCounter(0)
      setDraggedFiles(files)
      onFilesAccepted?.(files)
    },
    [onFilesAccepted],
  )

  const handleGlobalDropEvent = useCallback(
    (e: DragEvent) => {
      e.preventDefault()
      const files = Array.from(e.dataTransfer?.files || [])
      handleGlobalDrop(files)
    },
    [handleGlobalDrop],
  )

  // Global drag and drop event listeners
  React.useEffect(() => {
    document.addEventListener("dragenter", handleGlobalDragEnter)
    document.addEventListener("dragleave", handleGlobalDragLeave)
    document.addEventListener("dragover", handleGlobalDragOver)
    document.addEventListener("drop", handleGlobalDropEvent)

    return () => {
      document.removeEventListener("dragenter", handleGlobalDragEnter)
      document.removeEventListener("dragleave", handleGlobalDragLeave)
      document.removeEventListener("dragover", handleGlobalDragOver)
      document.removeEventListener("drop", handleGlobalDropEvent)
    }
  }, [handleGlobalDragEnter, handleGlobalDragLeave, handleGlobalDragOver, handleGlobalDropEvent])

  const getFileIcon = (file: File) => {
    if (file.type.startsWith("image/")) return ImageIcon
    if (file.type.includes("sheet") || file.type.includes("excel")) return FileSpreadsheet
    return FileText
  }

  return (
    <DragDropContext.Provider
      value={{
        isDragging,
        draggedFiles,
        setIsDragging,
        handleGlobalDrop,
        onFilesAccepted,
      }}
    >
      {children}

      {/* Global Drag Overlay */}
      <AnimatePresence>
        {showGlobalOverlay && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#E60023]/10 backdrop-blur-sm z-50 pointer-events-none"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-[#E60023]/20 to-transparent" />
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <div className="bg-white/90 backdrop-blur-xl rounded-2xl p-12 shadow-2xl border-2 border-dashed border-[#E60023] max-w-md mx-4">
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
                  className="text-center"
                >
                  <div className="w-20 h-20 bg-gradient-to-br from-[#E60023] to-[#C4001A] rounded-full flex items-center justify-center mx-auto mb-6">
                    <Upload className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Drop Files Here</h3>
                  <p className="text-gray-600 mb-4">Release to upload and analyze your files</p>
                  <div className="flex justify-center space-x-2">
                    {[FileText, ImageIcon, FileSpreadsheet].map((Icon, index) => (
                      <motion.div
                        key={index}
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 1, delay: index * 0.2, repeat: Number.POSITIVE_INFINITY }}
                        className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center"
                      >
                        <Icon className="w-4 h-4 text-gray-600" />
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </DragDropContext.Provider>
  )
}
