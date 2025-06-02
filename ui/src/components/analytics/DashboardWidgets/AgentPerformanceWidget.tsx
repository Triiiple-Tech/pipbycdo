import React from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import {
  Users,
  Bot,
  Zap,
  Clock,
  Target,
  TrendingUp,
  TrendingDown,
  Activity,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

interface AgentMetrics {
  id: string;
  name: string;
  type: "code" | "analysis" | "design" | "testing" | "research";
  status: "active" | "idle" | "busy" | "offline";
  tasksCompleted: number;
  successRate: number;
  avgProcessingTime: number; // in minutes
  efficiency: number; // percentage
  currentLoad: number; // percentage
  lastActive: string;
}

interface AgentPerformanceData {
  totalAgents: number;
  activeAgents: number;
  totalTasksCompleted: number;
  overallEfficiency: number;
  averageSuccessRate: number;
  totalProcessingTime: number;
  agents: AgentMetrics[];
  trends: {
    efficiency: number;
    throughput: number;
    successRate: number;
  };
  lastUpdated: string;
}

interface AgentPerformanceWidgetProps {
  data?: AgentPerformanceData;
  isLoading?: boolean;
  className?: string;
}

export function AgentPerformanceWidget({ data, isLoading, className }: AgentPerformanceWidgetProps) {
  const mockData: AgentPerformanceData = {
    totalAgents: 8,
    activeAgents: 6,
    totalTasksCompleted: 1247,
    overallEfficiency: 92,
    averageSuccessRate: 96,
    totalProcessingTime: 4320, // minutes
    agents: [
      {
        id: "agent-1",
        name: "CodeGen Pro",
        type: "code",
        status: "active",
        tasksCompleted: 234,
        successRate: 98,
        avgProcessingTime: 12,
        efficiency: 95,
        currentLoad: 75,
        lastActive: "2 minutes ago",
      },
      {
        id: "agent-2",
        name: "DataAnalyzer",
        type: "analysis",
        status: "busy",
        tasksCompleted: 189,
        successRate: 94,
        avgProcessingTime: 18,
        efficiency: 89,
        currentLoad: 90,
        lastActive: "active now",
      },
      {
        id: "agent-3",
        name: "DesignCraft",
        type: "design",
        status: "idle",
        tasksCompleted: 156,
        successRate: 97,
        avgProcessingTime: 25,
        efficiency: 88,
        currentLoad: 20,
        lastActive: "15 minutes ago",
      },
      {
        id: "agent-4",
        name: "TestMaster",
        type: "testing",
        status: "active",
        tasksCompleted: 298,
        successRate: 99,
        avgProcessingTime: 8,
        efficiency: 97,
        currentLoad: 60,
        lastActive: "1 minute ago",
      },
    ],
    trends: {
      efficiency: 3.2,
      throughput: 8.7,
      successRate: 1.4,
    },
    lastUpdated: "30 seconds ago",
  };

  const performanceData = data || mockData;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "text-green-600 bg-green-100";
      case "busy":
        return "text-blue-600 bg-blue-100";
      case "idle":
        return "text-yellow-600 bg-yellow-100";
      case "offline":
        return "text-red-600 bg-red-100";
      default:
        return "text-slate-600 bg-slate-100";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <CheckCircle className="w-3 h-3" />;
      case "busy":
        return <Zap className="w-3 h-3" />;
      case "idle":
        return <Clock className="w-3 h-3" />;
      case "offline":
        return <AlertCircle className="w-3 h-3" />;
      default:
        return <Activity className="w-3 h-3" />;
    }
  };

  const getAgentTypeIcon = (type: string) => {
    switch (type) {
      case "code":
        return "💻";
      case "analysis":
        return "📊";
      case "design":
        return "🎨";
      case "testing":
        return "🧪";
      case "research":
        return "🔍";
      default:
        return "🤖";
    }
  };

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  };

  if (isLoading) {
    return (
      <Card className={cn("animate-pulse", className)}>
        <CardHeader className="space-y-2">
          <div className="h-5 bg-slate-200 rounded w-3/4"></div>
          <div className="h-4 bg-slate-200 rounded w-1/2"></div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="h-20 bg-slate-200 rounded"></div>
          <div className="space-y-2">
            <div className="h-4 bg-slate-200 rounded"></div>
            <div className="h-4 bg-slate-200 rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay: 0.2 }}
    >
      <Card className={cn("hover:shadow-lg transition-shadow duration-300", className)}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-[#E60023]" />
              <CardTitle className="text-lg">Agent Performance</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                {performanceData.activeAgents}/{performanceData.totalAgents} Active
              </Badge>
            </div>
          </div>
          <CardDescription>
            AI agent metrics, efficiency, and workload analysis
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-slate-500 mb-1">Overall Efficiency</p>
              <div className="flex items-center gap-2">
                <p className="text-xl font-bold text-slate-800">
                  {performanceData.overallEfficiency}%
                </p>
                {performanceData.trends.efficiency > 0 ? (
                  <TrendingUp className="w-4 h-4 text-green-500" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-500" />
                )}
                <span className="text-xs text-slate-500">
                  {performanceData.trends.efficiency > 0 ? '+' : ''}{performanceData.trends.efficiency}%
                </span>
              </div>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Success Rate</p>
              <div className="flex items-center gap-2">
                <p className="text-xl font-bold text-green-600">
                  {performanceData.averageSuccessRate}%
                </p>
                {performanceData.trends.successRate > 0 ? (
                  <TrendingUp className="w-4 h-4 text-green-500" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-500" />
                )}
                <span className="text-xs text-slate-500">
                  {performanceData.trends.successRate > 0 ? '+' : ''}{performanceData.trends.successRate}%
                </span>
              </div>
            </div>
          </div>

          {/* Tasks Completed */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-700">Tasks Completed Today</span>
              <div className="flex items-center gap-1">
                <span className="text-sm font-semibold">{performanceData.totalTasksCompleted}</span>
                {performanceData.trends.throughput > 0 ? (
                  <TrendingUp className="w-3 h-3 text-green-500" />
                ) : (
                  <TrendingDown className="w-3 h-3 text-red-500" />
                )}
                <span className="text-xs text-slate-500">
                  {performanceData.trends.throughput > 0 ? '+' : ''}{performanceData.trends.throughput}%
                </span>
              </div>
            </div>
            <div className="bg-slate-100 rounded-full h-2 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-blue-500 to-purple-500 h-full transition-all duration-1000 ease-out"
                style={{ width: `${Math.min((performanceData.totalTasksCompleted / 1500) * 100, 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-slate-500">
              <span>Target: 1,500</span>
              <span>{Math.round((performanceData.totalTasksCompleted / 1500) * 100)}% Complete</span>
            </div>
          </div>

          {/* Agent List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-slate-700">Top Performers</h4>
              <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
                <Bot className="w-3 h-3 mr-1" />
                View All
              </Button>
            </div>
            <div className="space-y-2">
              {performanceData.agents.slice(0, 3).map((agent, index) => (
                <motion.div
                  key={agent.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * index }}
                  className="flex items-center justify-between p-2 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{getAgentTypeIcon(agent.type)}</span>
                    <div>
                      <p className="text-sm font-medium text-slate-800">{agent.name}</p>
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant="secondary" 
                          className={cn("text-xs", getStatusColor(agent.status))}
                        >
                          {getStatusIcon(agent.status)}
                          <span className="ml-1">{agent.status}</span>
                        </Badge>
                        <span className="text-xs text-slate-500">
                          {agent.tasksCompleted} tasks
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-slate-800">{agent.efficiency}%</p>
                    <p className="text-xs text-slate-500">{formatTime(agent.avgProcessingTime)} avg</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Performance Summary */}
          <div className="bg-slate-50 rounded-lg p-3 space-y-2">
            <h4 className="text-sm font-medium text-slate-700">Performance Summary</h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-slate-500">Total Processing Time:</span>
                <span className="font-medium ml-1">
                  {formatTime(performanceData.totalProcessingTime)}
                </span>
              </div>
              <div>
                <span className="text-slate-500">Avg per Task:</span>
                <span className="font-medium ml-1">
                  {formatTime(Math.round(performanceData.totalProcessingTime / performanceData.totalTasksCompleted))}
                </span>
              </div>
            </div>
          </div>

          {/* Last Updated */}
          <div className="text-xs text-slate-500 text-center pt-2 border-t">
            Updated {performanceData.lastUpdated}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
