import React from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import {
  Users,
  Download,
  Maximize2,
  Bot,
  Activity,
} from "lucide-react";

interface AgentActivityData {
  agentName: string;
  agentType: string;
  tasksCompleted: number;
  activeHours: number;
  efficiency: number;
  workload: number;
  status: "active" | "idle" | "busy" | "offline";
  color: string;
}

interface AgentActivityChartProps {
  data?: AgentActivityData[];
  title?: string;
  className?: string;
  isLoading?: boolean;
  height?: number;
}

export function AgentActivityChart({ 
  data, 
  title = "Agent Activity", 
  className,
  isLoading = false,
  height = 300
}: AgentActivityChartProps) {
  const mockData: AgentActivityData[] = [
    {
      agentName: "CodeGen Pro",
      agentType: "Development",
      tasksCompleted: 234,
      activeHours: 18,
      efficiency: 95,
      workload: 75,
      status: "active",
      color: "#3B82F6"
    },
    {
      agentName: "DataAnalyzer",
      agentType: "Analysis",
      tasksCompleted: 189,
      activeHours: 16,
      efficiency: 89,
      workload: 90,
      status: "busy",
      color: "#10B981"
    },
    {
      agentName: "DesignCraft",
      agentType: "Design",
      tasksCompleted: 156,
      activeHours: 14,
      efficiency: 88,
      workload: 20,
      status: "idle",
      color: "#8B5CF6"
    },
    {
      agentName: "TestMaster",
      agentType: "Testing",
      tasksCompleted: 298,
      activeHours: 20,
      efficiency: 97,
      workload: 60,
      status: "active",
      color: "#F97316"
    },
    {
      agentName: "ResearchBot",
      agentType: "Research",
      tasksCompleted: 127,
      activeHours: 12,
      efficiency: 85,
      workload: 45,
      status: "active",
      color: "#EF4444"
    },
  ];

  const agentData = data || mockData;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white dark:bg-slate-800 p-3 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg">
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            {data.agentName}
          </p>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between gap-4">
              <span className="text-slate-600 dark:text-slate-400">Type:</span>
              <span className="font-medium text-slate-800 dark:text-slate-200">
                {data.agentType}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-slate-600 dark:text-slate-400">Tasks:</span>
              <span className="font-medium text-slate-800 dark:text-slate-200">
                {data.tasksCompleted}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-slate-600 dark:text-slate-400">Efficiency:</span>
              <span className="font-medium text-slate-800 dark:text-slate-200">
                {data.efficiency}%
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-slate-600 dark:text-slate-400">Workload:</span>
              <span className="font-medium text-slate-800 dark:text-slate-200">
                {data.workload}%
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  if (isLoading) {
    return (
      <Card className={cn("animate-pulse", className)}>
        <CardHeader className="space-y-2">
          <div className="h-5 bg-slate-200 rounded w-3/4"></div>
          <div className="h-4 bg-slate-200 rounded w-1/2"></div>
        </CardHeader>
        <CardContent>
          <div className={`h-[${height}px] bg-slate-200 rounded`}></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, delay: 0.2 }}
    >
      <Card className={cn("hover:shadow-lg transition-shadow duration-300", className)}>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-[#E60023]" />
              <CardTitle className="text-lg">{title}</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="h-8 px-2">
                <Download className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" className="h-8 px-2">
                <Maximize2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <CardDescription>
            Agent workload distribution and performance metrics
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-4 p-3 bg-slate-50 rounded-lg">
            <div className="text-center">
              <p className="text-xs text-slate-500 mb-1">Total Agents</p>
              <p className="text-lg font-bold text-slate-800">{agentData.length}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-slate-500 mb-1">Total Tasks</p>
              <p className="text-lg font-bold text-blue-600">
                {agentData.reduce((sum, agent) => sum + agent.tasksCompleted, 0)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-slate-500 mb-1">Avg Efficiency</p>
              <p className="text-lg font-bold text-green-600">
                {Math.round(agentData.reduce((sum, agent) => sum + agent.efficiency, 0) / agentData.length)}%
              </p>
            </div>
          </div>

          {/* Chart */}
          <div style={{ height: `${height}px` }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={agentData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis 
                  dataKey="agentName" 
                  stroke="#64748B"
                  fontSize={12}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis 
                  stroke="#64748B"
                  fontSize={12}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar 
                  dataKey="tasksCompleted" 
                  name="Tasks Completed"
                  radius={[4, 4, 0, 0]}
                >
                  {agentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Agent Status List */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-slate-700">Agent Status</h4>
            <div className="grid grid-cols-1 gap-2">
              {agentData.map((agent, index) => {
                const getStatusColor = (status: string) => {
                  switch (status) {
                    case "active": return "text-green-600 bg-green-100";
                    case "busy": return "text-blue-600 bg-blue-100";
                    case "idle": return "text-yellow-600 bg-yellow-100";
                    case "offline": return "text-red-600 bg-red-100";
                    default: return "text-slate-600 bg-slate-100";
                  }
                };

                return (
                  <motion.div
                    key={agent.agentName}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 * index }}
                    className="flex items-center justify-between p-2 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: agent.color }}
                      />
                      <div>
                        <p className="text-sm font-medium text-slate-800">
                          {agent.agentName}
                        </p>
                        <p className="text-xs text-slate-500">
                          {agent.agentType} • {agent.activeHours}h active
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant="secondary" 
                        className={cn("text-xs", getStatusColor(agent.status))}
                      >
                        {agent.status}
                      </Badge>
                      <div className="text-right text-xs">
                        <p className="font-medium text-slate-800">
                          {agent.efficiency}%
                        </p>
                        <p className="text-slate-500">efficiency</p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-2 border-t">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Bot className="w-3 h-3" />
              <span>Real-time agent monitoring</span>
            </div>
            <div className="text-xs text-slate-500">
              Updated 1 min ago
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
