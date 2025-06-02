import React from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import {
  Server,
  Cpu,
  HardDrive,
  Wifi,
  Users,
  Clock,
  Activity,
  TrendingUp,
  TrendingDown,
  Zap,
  Database,
  Monitor,
} from "lucide-react";

interface ResourceMetrics {
  name: string;
  type: "cpu" | "memory" | "storage" | "network" | "database" | "api";
  usage: number; // percentage
  capacity: number;
  used: number;
  status: "optimal" | "warning" | "critical";
  trend: number; // percentage change
}

interface TeamUtilization {
  totalMembers: number;
  activeMembers: number;
  avgUtilization: number;
  peakHours: string;
  productivityScore: number;
}

interface ResourceUtilizationData {
  systemResources: ResourceMetrics[];
  teamUtilization: TeamUtilization;
  fileProcessing: {
    totalFiles: number;
    processedFiles: number;
    processingSpeed: number; // files per hour
    avgProcessingTime: number; // minutes
    successRate: number;
  };
  apiMetrics: {
    totalRequests: number;
    responseTime: number; // ms
    errorRate: number; // percentage
    throughput: number; // requests per minute
  };
  costMetrics: {
    totalCost: number;
    costPerUser: number;
    costPerTask: number;
    efficiency: number; // cost efficiency score
  };
  trends: {
    resourceUsage: number;
    teamProductivity: number;
    processingSpeed: number;
  };
  lastUpdated: string;
}

interface ResourceUtilizationWidgetProps {
  data?: ResourceUtilizationData;
  isLoading?: boolean;
  className?: string;
}

export function ResourceUtilizationWidget({ data, isLoading, className }: ResourceUtilizationWidgetProps) {
  const mockData: ResourceUtilizationData = {
    systemResources: [
      {
        name: "CPU Usage",
        type: "cpu",
        usage: 68,
        capacity: 100,
        used: 68,
        status: "optimal",
        trend: -2.3,
      },
      {
        name: "Memory",
        type: "memory",
        usage: 82,
        capacity: 32, // GB
        used: 26.24,
        status: "warning",
        trend: 5.1,
      },
      {
        name: "Storage",
        type: "storage",
        usage: 45,
        capacity: 1000, // GB
        used: 450,
        status: "optimal",
        trend: 1.2,
      },
      {
        name: "API Calls",
        type: "api",
        usage: 73,
        capacity: 10000, // per hour
        used: 7300,
        status: "optimal",
        trend: 8.7,
      },
    ],
    teamUtilization: {
      totalMembers: 12,
      activeMembers: 9,
      avgUtilization: 84,
      peakHours: "10AM - 3PM",
      productivityScore: 92,
    },
    fileProcessing: {
      totalFiles: 2847,
      processedFiles: 2698,
      processingSpeed: 127,
      avgProcessingTime: 4.5,
      successRate: 98.2,
    },
    apiMetrics: {
      totalRequests: 45672,
      responseTime: 234,
      errorRate: 0.8,
      throughput: 152,
    },
    costMetrics: {
      totalCost: 2340,
      costPerUser: 195,
      costPerTask: 1.87,
      efficiency: 87,
    },
    trends: {
      resourceUsage: -3.2,
      teamProductivity: 6.4,
      processingSpeed: 12.3,
    },
    lastUpdated: "45 seconds ago",
  };

  const resourceData = data || mockData;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "optimal":
        return "text-green-600 bg-green-100";
      case "warning":
        return "text-yellow-600 bg-yellow-100";
      case "critical":
        return "text-red-600 bg-red-100";
      default:
        return "text-slate-600 bg-slate-100";
    }
  };

  const getResourceIcon = (type: string) => {
    switch (type) {
      case "cpu":
        return <Cpu className="w-4 h-4" />;
      case "memory":
        return <Monitor className="w-4 h-4" />;
      case "storage":
        return <HardDrive className="w-4 h-4" />;
      case "network":
        return <Wifi className="w-4 h-4" />;
      case "database":
        return <Database className="w-4 h-4" />;
      case "api":
        return <Server className="w-4 h-4" />;
      default:
        return <Activity className="w-4 h-4" />;
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes >= 1000) return `${(bytes / 1000).toFixed(1)}TB`;
    return `${bytes}GB`;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
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
      transition={{ duration: 0.3, delay: 0.3 }}
    >
      <Card className={cn("hover:shadow-lg transition-shadow duration-300", className)}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Server className="w-5 h-5 text-[#E60023]" />
              <CardTitle className="text-lg">Resource Utilization</CardTitle>
            </div>
            <Badge variant="secondary" className="text-xs">
              {resourceData.trends.resourceUsage > 0 ? 'High' : 'Normal'} Load
            </Badge>
          </div>
          <CardDescription>
            System resources, team productivity, and processing metrics
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* System Resources */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-slate-700">System Resources</h4>
            <div className="space-y-2">
              {resourceData.systemResources.map((resource, index) => (
                <motion.div
                  key={resource.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * index }}
                  className="space-y-1"
                >
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      {getResourceIcon(resource.type)}
                      <span className="text-slate-600">{resource.name}</span>
                      <Badge 
                        variant="secondary" 
                        className={cn("text-xs", getStatusColor(resource.status))}
                      >
                        {resource.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="font-medium">{resource.usage}%</span>
                      {resource.trend > 0 ? (
                        <TrendingUp className="w-3 h-3 text-red-500" />
                      ) : (
                        <TrendingDown className="w-3 h-3 text-green-500" />
                      )}
                      <span className="text-slate-500">
                        {resource.trend > 0 ? '+' : ''}{resource.trend}%
                      </span>
                    </div>
                  </div>
                  <Progress value={resource.usage} className="h-1.5" />
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>
                      Used: {resource.type === 'storage' || resource.type === 'memory' 
                        ? formatBytes(resource.used) 
                        : resource.used.toLocaleString()}
                    </span>
                    <span>
                      Total: {resource.type === 'storage' || resource.type === 'memory' 
                        ? formatBytes(resource.capacity) 
                        : resource.capacity.toLocaleString()}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Team Utilization */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-slate-700">Team Productivity</h4>
            <div className="bg-slate-50 rounded-lg p-3 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Users className="w-4 h-4 text-slate-500" />
                    <span className="text-xs text-slate-500">Active Members</span>
                  </div>
                  <p className="text-lg font-semibold text-slate-800">
                    {resourceData.teamUtilization.activeMembers}/{resourceData.teamUtilization.totalMembers}
                  </p>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Zap className="w-4 h-4 text-slate-500" />
                    <span className="text-xs text-slate-500">Productivity Score</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <p className="text-lg font-semibold text-green-600">
                      {resourceData.teamUtilization.productivityScore}%
                    </p>
                    {resourceData.trends.teamProductivity > 0 ? (
                      <TrendingUp className="w-3 h-3 text-green-500" />
                    ) : (
                      <TrendingDown className="w-3 h-3 text-red-500" />
                    )}
                  </div>
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600">Average Utilization</span>
                  <span className="font-medium">{resourceData.teamUtilization.avgUtilization}%</span>
                </div>
                <Progress value={resourceData.teamUtilization.avgUtilization} className="h-2" />
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Clock className="w-3 h-3" />
                <span>Peak Hours: {resourceData.teamUtilization.peakHours}</span>
              </div>
            </div>
          </div>

          {/* Processing Metrics */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-slate-700">File Processing</h4>
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Success Rate</span>
                  <span className="font-medium text-green-600">
                    {resourceData.fileProcessing.successRate}%
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Processing Speed</span>
                  <span className="font-medium">
                    {resourceData.fileProcessing.processingSpeed}/hr
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Avg Time</span>
                  <span className="font-medium">
                    {resourceData.fileProcessing.avgProcessingTime}m
                  </span>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-slate-700">API Performance</h4>
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Response Time</span>
                  <span className="font-medium">
                    {resourceData.apiMetrics.responseTime}ms
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Error Rate</span>
                  <span className="font-medium text-green-600">
                    {resourceData.apiMetrics.errorRate}%
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Throughput</span>
                  <span className="font-medium">
                    {resourceData.apiMetrics.throughput}/min
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Cost Efficiency */}
          <div className="bg-slate-50 rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-slate-700">Cost Efficiency</h4>
              <Badge variant="secondary" className="text-green-600 bg-green-100 text-xs">
                {resourceData.costMetrics.efficiency}% Efficient
              </Badge>
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div>
                <span className="text-slate-500">Total Cost:</span>
                <span className="font-medium ml-1">
                  {formatCurrency(resourceData.costMetrics.totalCost)}
                </span>
              </div>
              <div>
                <span className="text-slate-500">Per User:</span>
                <span className="font-medium ml-1">
                  {formatCurrency(resourceData.costMetrics.costPerUser)}
                </span>
              </div>
              <div>
                <span className="text-slate-500">Per Task:</span>
                <span className="font-medium ml-1">
                  ${resourceData.costMetrics.costPerTask}
                </span>
              </div>
            </div>
          </div>

          {/* Last Updated */}
          <div className="text-xs text-slate-500 text-center pt-2 border-t">
            Updated {resourceData.lastUpdated}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
