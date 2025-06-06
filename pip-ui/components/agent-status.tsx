"use client"

import { useState } from "react"
import { Bot, Zap, FileText, Calculator } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface Agent {
  id: string
  name: string
  type: "manager" | "reader" | "mapper" | "estimator"
  status: "idle" | "working" | "complete"
  icon: any
}

export function AgentStatus() {
  const [agents, setAgents] = useState<Agent[]>([
    { id: "1", name: "Manager", type: "manager", status: "idle", icon: Bot },
    { id: "2", name: "File Reader", type: "reader", status: "idle", icon: FileText },
    { id: "3", name: "Trade Mapper", type: "mapper", status: "idle", icon: Zap },
    { id: "4", name: "Estimator", type: "estimator", status: "idle", icon: Calculator },
  ])

  const getAgentColor = (type: string, status: string) => {
    if (status === "working") return "bg-[#E60023] animate-pulse"
    if (status === "complete") return "bg-green-500"

    switch (type) {
      case "manager":
        return "bg-[#E60023]"
      case "reader":
        return "bg-blue-500"
      case "mapper":
        return "bg-teal-500"
      case "estimator":
        return "bg-purple-500"
      default:
        return "bg-gray-400"
    }
  }

  return (
    <div className="bg-secondary/30 dark:bg-zinc-900/50 backdrop-blur-sm border-b border-border flex items-center px-6 h-16">
      <div className="flex items-center space-x-4">
        <span className="text-sm font-medium text-foreground">Agent Status:</span>
        <div className="flex space-x-3">
          {agents.map((agent) => (
            <div key={agent.id} className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${getAgentColor(agent.type, agent.status)}`} />
              <span className="text-sm text-muted-foreground">{agent.name}</span>
              {agent.status === "working" && (
                <Badge variant="secondary" className="text-xs bg-muted text-muted-foreground border-border">
                  Working...
                </Badge>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
