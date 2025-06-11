"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Download, 
  Share, 
  Eye,
  ChevronRight,
  FileText,
  Database,
  ArrowRight
} from "lucide-react"
import { chatApi } from "@/services/chatApi"
import { toast } from "sonner"

interface StepResult {
  agent: string
  title: string
  status: "pending" | "processing" | "complete" | "error"
  result?: string
  details?: string[]
  timestamp?: string
  canViewDetails?: boolean
  canProceed?: boolean
  requiresUserInput?: boolean
  userPrompt?: string
}

interface StepwisePresenterProps {
  className?: string
  sessionId?: string
}

export function StepwisePresenter({ className = "", sessionId }: StepwisePresenterProps) {
  const [steps, setSteps] = useState<StepResult[]>([])
  const [currentStep, setCurrentStep] = useState(0)
  const [isProcessing, setIsProcessing] = useState(false)
  const [workflowActive, setWorkflowActive] = useState(false)
  const [finalOutputs, setFinalOutputs] = useState<{
    estimate?: { total: number, items: number }
    takeoff?: { items: number }
    scope?: { items: number }
    trades?: { count: number }
    exportOptions?: string[]
  }>({})

  useEffect(() => {
    const handleWebSocketMessage = (wsMessage: any) => {
      console.log("📋 Stepwise Presenter WebSocket message:", wsMessage)
      
      // Handle agent processing start
      if (wsMessage.type === 'agent_processing_start') {
        const { agent_name, step_number, total_steps } = wsMessage.data
        setWorkflowActive(true)
        setCurrentStep(step_number || 0)
        
        // Update or add step
        setSteps(prev => {
          const updated = [...prev]
          const stepIndex = updated.findIndex(s => s.agent === agent_name)
          
          if (stepIndex >= 0) {
            updated[stepIndex] = {
              ...updated[stepIndex],
              status: "processing"
            }
          } else {
            updated.push({
              agent: agent_name,
              title: getAgentTitle(agent_name),
              status: "processing"
            })
          }
          return updated
        })
      }
      
      // Handle agent completion
      if (wsMessage.type === 'agent_processing_complete') {
        const { agent_name, result_summary } = wsMessage.data
        
        setSteps(prev => prev.map(step => {
          if (step.agent === agent_name) {
            return {
              ...step,
              status: "complete",
              result: result_summary,
              timestamp: new Date().toISOString(),
              canViewDetails: true,
              canProceed: needsUserInput(agent_name, result_summary)
            }
          }
          return step
        }))
      }
      
      // Handle agent errors
      if (wsMessage.type === 'agent_processing_error') {
        const { agent_name, error_message } = wsMessage.data
        
        setSteps(prev => prev.map(step => {
          if (step.agent === agent_name) {
            return {
              ...step,
              status: "error",
              result: error_message,
              timestamp: new Date().toISOString()
            }
          }
          return step
        }))
      }
      
      // Parse chat messages for stepwise presentation
      if (wsMessage.type === 'chat_message' && wsMessage.data?.content) {
        const content = wsMessage.data.content
        parseStepwiseMessage(content)
      }
      
      // Handle workflow completion
      if (wsMessage.type === 'workflow_complete') {
        setWorkflowActive(false)
        setIsProcessing(false)
      }
    }

    if (sessionId) {
      chatApi.onMessage('stepwise-presenter', handleWebSocketMessage)
    }

    return () => {
      if (sessionId) {
        chatApi.offMessage('stepwise-presenter')
      }
    }
  }, [sessionId])

  const parseStepwiseMessage = (content: string) => {
    // Parse protocol-specific messages
    const patterns = [
      { 
        pattern: /📖 FileReader: (.+)/, 
        agent: "file_reader",
        title: "File Reader Agent"
      },
      { 
        pattern: /🏗️ TradeMapper: (.+)/, 
        agent: "trade_mapper",
        title: "Trade Mapper Agent"
      },
      { 
        pattern: /📋 ScopeAgent: (.+)/, 
        agent: "scope",
        title: "Scope Analysis Agent"
      },
      { 
        pattern: /📏 TakeoffAgent: (.+)/, 
        agent: "takeoff",
        title: "Takeoff Calculation Agent"
      },
      { 
        pattern: /💰 EstimatorAgent: (.+)/, 
        agent: "estimator",
        title: "Cost Estimator Agent"
      },
      { 
        pattern: /📄 ExporterAgent: (.+)/, 
        agent: "exporter",
        title: "Export Management Agent"
      },
      { 
        pattern: /📊 SmartsheetAgent: (.+)/, 
        agent: "smartsheet",
        title: "Smartsheet Integration Agent"
      }
    ]
    
    patterns.forEach(({ pattern, agent, title }) => {
      const match = content.match(pattern)
      if (match) {
        const result = match[1]
        const requiresInput = result.includes("Proceed?") || result.includes("View details?")
        
        setSteps(prev => {
          const updated = [...prev]
          const stepIndex = updated.findIndex(s => s.agent === agent)
          
          const step: StepResult = {
            agent,
            title,
            status: "complete",
            result,
            timestamp: new Date().toISOString(),
            canViewDetails: true,
            canProceed: requiresInput,
            requiresUserInput: requiresInput,
            userPrompt: requiresInput ? result : undefined
          }
          
          if (stepIndex >= 0) {
            updated[stepIndex] = step
          } else {
            updated.push(step)
          }
          return updated
        })
      }
    })
    
    // Parse output management messages
    if (content.includes("📋 Available Export Options")) {
      parseExportOptions(content)
    }
    
    if (content.includes("✅ Protocol Complete")) {
      setWorkflowActive(false)
      setIsProcessing(false)
      toast.success("Protocol completed successfully!")
    }
  }

  const parseExportOptions = (content: string) => {
    const outputs: any = {}
    
    // Extract estimate information
    const estimateMatch = content.match(/💰 Cost Estimate \(\$([0-9,]+\.\d{2})\)/)
    if (estimateMatch) {
      outputs.estimate = { total: parseFloat(estimateMatch[1].replace(/,/g, '')) }
    }
    
    // Extract counts
    const takeoffMatch = content.match(/📏 Takeoff Data \((\d+) items\)/)
    if (takeoffMatch) {
      outputs.takeoff = { items: parseInt(takeoffMatch[1]) }
    }
    
    const scopeMatch = content.match(/📋 Scope Analysis \((\d+) items\)/)
    if (scopeMatch) {
      outputs.scope = { items: parseInt(scopeMatch[1]) }
    }
    
    const tradesMatch = content.match(/🏗️ Trade Mapping \((\d+) trades\)/)
    if (tradesMatch) {
      outputs.trades = { count: parseInt(tradesMatch[1]) }
    }
    
    outputs.exportOptions = ["XLSX", "PDF", "JSON", "Smartsheet"]
    setFinalOutputs(outputs)
  }

  const getAgentTitle = (agentName: string): string => {
    const titles: Record<string, string> = {
      manager: "Manager Agent",
      file_reader: "File Reader Agent", 
      trade_mapper: "Trade Mapper Agent",
      scope: "Scope Analysis Agent",
      takeoff: "Takeoff Calculation Agent",
      estimator: "Cost Estimator Agent",
      exporter: "Export Management Agent",
      smartsheet: "Smartsheet Integration Agent"
    }
    return titles[agentName] || agentName.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  const needsUserInput = (agentName: string, result: string): boolean => {
    return result.includes("Proceed?") || 
           result.includes("View details?") || 
           result.includes("Download or export?") ||
           agentName === "trade_mapper" && result.includes("Identified")
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "complete":
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case "processing":
        return <Clock className="w-4 h-4 text-blue-500 animate-spin" />
      case "error":
        return <AlertCircle className="w-4 h-4 text-red-500" />
      default:
        return <div className="w-4 h-4 rounded-full bg-gray-300" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "complete":
        return "bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800"
      case "processing":
        return "bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800"
      case "error":
        return "bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800"
      default:
        return "bg-gray-50 border-gray-200 dark:bg-gray-950 dark:border-gray-800"
    }
  }

  const handleProceedClick = async (step: StepResult) => {
    if (!sessionId) return
    
    try {
      await chatApi.sendMessage(sessionId, "Proceed")
      toast.success("Continuing workflow...")
    } catch (error) {
      toast.error("Failed to continue workflow")
    }
  }

  const handleViewDetails = (step: StepResult) => {
    toast.info(`${step.title}: ${step.result}`, {
      duration: 5000,
      description: step.details?.join(", ")
    })
  }

  const handleExport = (format: string) => {
    toast.info(`Exporting to ${format}...`, {
      description: "Export functionality will be implemented"
    })
  }

  if (steps.length === 0 && !workflowActive) {
    return null
  }

  return (
    <div className={`${className} flex items-center justify-between px-3 py-2 bg-muted/20 rounded-md border border-border/30`}>
      {/* Just the dots and current status */}
      <div className="flex items-center space-x-2">
        {steps.length > 0 ? (
          <div className="flex items-center space-x-1">
            {steps.map((step, index) => (
              <div
                key={step.agent}
                className={`w-2 h-2 rounded-full transition-all ${
                  step.status === "complete"
                    ? "bg-green-500"
                    : step.status === "processing"
                    ? "bg-blue-500 animate-pulse"
                    : step.status === "error"
                    ? "bg-red-500"
                    : "bg-gray-300"
                }`}
                title={step.title}
              />
            ))}
          </div>
        ) : workflowActive ? (
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
        ) : null}
        
        {/* Current step name - only if processing */}
        {(() => {
          const currentStepData = steps.find(s => s.status === "processing")
          if (currentStepData) {
            return (
              <span className="text-xs text-muted-foreground">
                {currentStepData.title.replace(' Agent', '')}
              </span>
            )
          }
          return null
        })()}
      </div>

      {/* Final results - minimal */}
      {finalOutputs.estimate && (
        <span className="text-xs text-green-600 dark:text-green-400 font-medium">
          ${finalOutputs.estimate.total.toLocaleString()}
        </span>
      )}
    </div>
  )
}
