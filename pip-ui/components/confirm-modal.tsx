"use client"

import { motion, AnimatePresence } from "framer-motion"
import { AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

interface ConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: "danger" | "warning" | "info"
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "warning",
}: ConfirmModalProps) {
  const handleConfirm = () => {
    onConfirm()
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
          >
            <Card className="w-full max-w-md p-6 bg-white/90 backdrop-blur-xl shadow-2xl border border-white/20">
              <div className="flex items-start space-x-4">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                    variant === "danger"
                      ? "bg-red-100 text-red-600"
                      : variant === "warning"
                        ? "bg-yellow-100 text-yellow-600"
                        : "bg-blue-100 text-blue-600"
                  }`}
                >
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
                  <p className="text-gray-600 mb-6">{message}</p>
                  <div className="flex space-x-3 justify-end">
                    <Button variant="outline" onClick={onClose} className="transition-all hover:bg-gray-50">
                      {cancelText}
                    </Button>
                    <Button
                      onClick={handleConfirm}
                      className={`transition-all ${
                        variant === "danger"
                          ? "bg-red-600 hover:bg-red-700 text-white"
                          : "bg-[#E60023] hover:bg-[#C4001A] text-white"
                      }`}
                    >
                      {confirmText}
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
