"use client"

import { useState, useEffect } from "react"
import { Bot, Zap, FileText, Calculator, Search, CheckCircle, Upload, Database, AlertCircle, ChevronDown, ChevronUp } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { chatApi } from "@/services/chatApi"

interface Agent {
  id: string
  name: string
  type: "manager" | "file_reader" | "trade_mapper" | "scope" | "takeoff" | "estimator" | "exporter" | "smartsheet"
  status: "idle" | "processing" | "complete" | "error" | "skipped"
  icon: any
  progress: number
  description?: string
  result?: string
  stepNumber?: number
  totalSteps?: number
}

interface AgentStatusProps {
  className?: string
  showProgress?: boolean
  compact?: boolean
}

export function AgentStatus({ className = "", showProgress = true, compact = false }: AgentStatusProps) {
  const [agents, setAgents] = useState<Agent[]>([
    { id: "manager", name: "Manager", type: "manager", status: "idle", icon: Bot, progress: 0, description: "Orchestrates workflow and routing" },
    { id: "file_reader", name: "File Reader", type: "file_reader", status: "idle", icon: FileText, progress: 0, description: "Extracts content from uploaded files" },
    { id: "trade_mapper", name: "Trade Mapper", type: "trade_mapper", status: "idle", icon: Search, progress: 0, description: "Identifies construction trades" },
    { id: "scope", name: "Scope Agent", type: "scope", status: "idle", icon: Zap, progress: 0, description: "Extracts detailed scope items" },
    { id: "takeoff", name: "Takeoff Agent", type: "takeoff", status: "idle", icon: Calculator, progress: 0, description: "Calculates quantities and measurements" },
    { id: "estimator", name: "Estimator", type: "estimator", status: "idle", icon: Calculator, progress: 0, description: "Generates cost estimates" },
    { id: "exporter", name: "Exporter", type: "exporter", status: "idle", icon: Upload, progress: 0, description: "Formats and exports results" },
    { id: "smartsheet", name: "Smartsheet", type: "smartsheet", status: "idle", icon: Database, progress: 0, description: "Syncs with Smartsheet integration" },
  ])

  const [currentWorkflow, setCurrentWorkflow] = useState<{
    isActive: boolean
    totalSteps: number
    currentStep: number
    completedAgents: string[]
  }>({
    isActive: false,
    totalSteps: 0,
    currentStep: 0,
    completedAgents: []
  })

  const [isExpanded, setIsExpanded] = useState(false)

  useEffect(() => {
    const handleWebSocketMessage = (wsMessage: any) => {
      console.log("🤖 Agent Status WebSocket message:", wsMessage)
      
      if (wsMessage.type === 'agent_processing_start') {
        const { agent_name, step_number, total_steps } = wsMessage.data
        
        setCurrentWorkflow(prev => ({
          ...prev,
          isActive: true,
          totalSteps: total_steps || prev.totalSteps,
          currentStep: step_number || prev.currentStep
        }))
        
        setAgents(prev => prev.map(agent => {
          if (agent.type === agent_name || agent.id === agent_name) {
            return { ...agent, status: "processing", progress: 0, stepNumber: step_number, totalSteps: total_steps }
          }
          return agent
        }))
      }
      
      if (wsMessage.type === 'agent_processing_complete') {
        const { agent_name, step_number, total_steps, result_summary } = wsMessage.data
        
        setCurrentWorkflow(prev => ({
          ...prev,
          currentStep: step_number || prev.currentStep,
          completedAgents: [...prev.completedAgents.filter(a => a !== agent_name), agent_name]
        }))
        
        setAgents(prev => prev.map(agent => {
          if (agent.type === agent_name || agent.id === agent_name) {
            return { 
              ...agent, 
              status: "complete", 
              progress: 100, 
              result: result_summary,
              stepNumber: step_number,
              totalSteps: total_steps
            }
          }
          return agent
        }))
      }
      
      if (wsMessage.type === 'agent_processing_error') {
        const { agent_name, error_message } = wsMessage.data
        
        setAgents(prev => prev.map(agent => {
          if (agent.type === agent_name || agent.id === agent_name) {
            return { ...agent, status: "error", progress: 0, result: error_message }
          }
          return agent
        }))
      }
      
      if (wsMessage.type === 'workflow_complete') {
        setCurrentWorkflow(prev => ({
          ...prev,
          isActive: false,
          currentStep: prev.totalSteps
        }))
      }
      
      // Handle chat messages that contain agent completion information
      if (wsMessage.type === 'chat_message' && wsMessage.data?.content) {
        const content = wsMessage.data.content
        
        // Parse stepwise presentation messages from ManagerAgent
        const agentCompletionPatterns = [
          { pattern: /📖 FileReader: (.+)/, agent: "file_reader" },
          { pattern: /🏗️ TradeMapper: (.+)/, agent: "trade_mapper" },
          { pattern: /📋 ScopeAgent: (.+)/, agent: "scope" },
          { pattern: /📏 TakeoffAgent: (.+)/, agent: "takeoff" },
          { pattern: /💰 EstimatorAgent: (.+)/, agent: "estimator" },
          { pattern: /📄 ExporterAgent: (.+)/, agent: "exporter" },
          { pattern: /📊 SmartsheetAgent: (.+)/, agent: "smartsheet" }
        ]
        
        agentCompletionPatterns.forEach(({ pattern, agent }) => {
          const match = content.match(pattern)
          if (match) {
            const result = match[1]
            setAgents(prev => prev.map(a => {
              if (a.type === agent || a.id === agent) {
                return { ...a, status: "complete", progress: 100, result }
              }
              return a
            }))
          }
        })
        
        // Handle workflow start indicators
        if (content.includes("🎯 Starting Autonomous Agentic Manager Protocol")) {
          setCurrentWorkflow({ isActive: true, totalSteps: 0, currentStep: 0, completedAgents: [] })
          setAgents(prev => prev.map(agent => ({ ...agent, status: "idle", progress: 0, result: undefined })))
        }
        
        // Handle step progression
        const stepMatch = content.match(/⚡ Step (\d+)\/(\d+): (\w+)/)
        if (stepMatch) {
          const [, currentStep, totalSteps, agentName] = stepMatch
          setCurrentWorkflow(prev => ({
            ...prev,
            isActive: true,
            totalSteps: parseInt(totalSteps),
            currentStep: parseInt(currentStep)
          }))
          
          setAgents(prev => prev.map(agent => {
            if (agent.type === agentName || agent.id === agentName) {
              return { ...agent, status: "processing", progress: 50, stepNumber: parseInt(currentStep), totalSteps: parseInt(totalSteps) }
            }
            return agent
          }))
        }
      }
    }

    chatApi.onMessage('agent-status', handleWebSocketMessage)

    return () => {
      chatApi.offMessage('agent-status')
    }
  }, [])

  const getAgentColor = (type: string, status: string) => {
    if (status === "processing") return "bg-[#E60023] animate-pulse"
    if (status === "complete") return "bg-green-500"
    if (status === "error") return "bg-red-500"
    if (status === "skipped") return "bg-gray-400"

    switch (type) {
      case "manager":
        return "bg-[#E60023]"
      case "file_reader":
        return "bg-blue-500"
      case "trade_mapper":
        return "bg-teal-500"
      case "scope":
        return "bg-purple-500"
      case "takeoff":
        return "bg-yellow-500"
      case "estimator":
        return "bg-green-600"
      case "exporter":
        return "bg-indigo-500"
      case "smartsheet":
        return "bg-orange-500"
      default:
        return "bg-gray-400"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "complete":
        return <CheckCircle className="w-3 h-3 text-green-500" />
      case "error":
        return <AlertCircle className="w-3 h-3 text-red-500" />
      default:
        return null
    }
  }

  const getWorkflowProgress = () => {
    if (!currentWorkflow.isActive && currentWorkflow.completedAgents.length === 0) return 0
    if (!currentWorkflow.totalSteps) return 0
    return Math.round((currentWorkflow.currentStep / currentWorkflow.totalSteps) * 100)
  }

  if (compact) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <div className="flex space-x-1">
          {agents.slice(0, 4).map((agent) => (
            <div key={agent.id} className="flex items-center space-x-1">
              <div className={`w-2 h-2 rounded-full ${getAgentColor(agent.type, agent.status)}`} />
              {getStatusIcon(agent.status)}
            </div>
          ))}
        </div>
        {currentWorkflow.isActive && (
          <Badge variant="secondary" className="text-xs">
            {currentWorkflow.currentStep}/{currentWorkflow.totalSteps}
          </Badge>
        )}
      </div>
    )
  }

  const activeAgent = agents.find(agent => agent.status === "processing")
  const hasActivity = currentWorkflow.isActive || agents.some(agent => agent.status === "processing")

  return (
    <div className={`bg-muted/20 rounded-md border border-border/30 transition-all duration-200 ${className}`}>
      {/* Collapsed view - minimal dots with enhanced active agent */}
      <div 
        className="flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-muted/30 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center space-x-2">
          {/* Agent dots with enhanced active state */}
          <div className="flex items-center space-x-1">
            {agents.map((agent) => (
              <div
                key={agent.id}
                className={`rounded-full transition-all duration-300 ${
                  agent.status === "processing" 
                    ? "w-3 h-3 shadow-lg shadow-[#E60023]/50" 
                    : "w-2 h-2"
                } ${getAgentColor(agent.type, agent.status)}`}
                title={`${agent.name}: ${agent.status}`}
              />
            ))}
          </div>
          
          {/* Active agent name */}
          {activeAgent && (
            <span className="text-xs text-foreground font-medium">
              {activeAgent.name}
            </span>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Current step indicator */}
          {currentWorkflow.isActive && (
            <span className="text-xs text-muted-foreground">
              {currentWorkflow.currentStep}/{currentWorkflow.totalSteps}
            </span>
          )}
          
          {/* Expand/collapse button - always show */}
          <Button variant="ghost" size="sm" className="h-4 w-4 p-0">
            {isExpanded ? (
              <ChevronUp className="w-3 h-3" />
            ) : (
              <ChevronDown className="w-3 h-3" />
            )}
          </Button>
        </div>
      </div>

      {/* Expanded view - detailed agent information */}
      {isExpanded && (
        <div className="px-3 pb-3 border-t border-border/30">
          {showProgress && currentWorkflow.isActive && (
            <div className="mb-3 mt-3">
              <Progress value={getWorkflowProgress()} className="h-1" />
              <p className="text-xs text-muted-foreground mt-1">
                Progress: {getWorkflowProgress()}%
              </p>
            </div>
          )}
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {(hasActivity ? agents.filter(agent => agent.status !== "idle") : agents).map((agent) => (
              <div key={agent.id} className="space-y-1">
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${getAgentColor(agent.type, agent.status)}`} />
                  <span className="text-xs font-medium text-foreground truncate">{agent.name}</span>
                  {getStatusIcon(agent.status)}
                </div>
                
                {agent.status === "processing" && showProgress && (
                  <Progress value={agent.progress} className="h-0.5" />
                )}
                
                {agent.result && (
                  <p className="text-xs text-muted-foreground truncate" title={agent.result}>
                    {agent.result}
                  </p>
                )}
                
                {!hasActivity && agent.description && (
                  <p className="text-xs text-muted-foreground truncate" title={agent.description}>
                    {agent.description}
                  </p>
                )}
              </div>
            ))}
          </div>
          
          {currentWorkflow.completedAgents.length > 0 && (
            <div className="mt-3 pt-2 border-t border-border/50">
              <p className="text-xs text-muted-foreground">
                Completed: {currentWorkflow.completedAgents.join(", ")}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
