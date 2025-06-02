import React from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { motion } from "framer-motion";
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  AreaChart,
  Area,
  ComposedChart,
  Bar,
} from "recharts";
import {
  Target,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Maximize2,
  Download,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
  Users,
  Activity,
  Zap,
} from "lucide-react";

interface KPIMetric {
  id: string;
  name: string;
  value: number;
  target: number;
  unit: string;
  trend: number; // percentage change
  status: "excellent" | "good" | "warning" | "critical";
  description: string;
  category: "performance" | "financial" | "quality" | "efficiency";
}

interface KPITrendData {
  date: string;
  projectHealth: number;
  budgetEfficiency: number;
  teamProductivity: number;
  qualityScore: number;
  agentEfficiency: number;
  riskLevel: number;
}

interface KPIMetricsData {
  metrics: KPIMetric[];
  trendData: KPITrendData[];
  overallScore: number;
  benchmarks: {
    industry: number;
    previous: number;
    target: number;
  };
  lastUpdated: string;
  nextUpdate: string;
}

interface KPIMetricsChartProps {
  data?: KPIMetricsData;
  title?: string;
  className?: string;
  isLoading?: boolean;
  height?: number;
  showTrends?: boolean;
  variant?: "radar" | "line" | "combined";
}

export function KPIMetricsChart({ 
  data, 
  title = "Key Performance Indicators", 
  className,
  isLoading = false,
  height = 400,
  showTrends = true,
  variant = "combined"
}: KPIMetricsChartProps) {
  const mockData: KPIMetricsData = {
    metrics: [
      {
        id: "kpi-1",
        name: "Project Health",
        value: 87,
        target: 90,
        unit: "%",
        trend: 5.2,
        status: "good",
        description: "Overall project performance and milestone achievement",
        category: "performance",
      },
      {
        id: "kpi-2",
        name: "Budget Efficiency",
        value: 92,
        target: 85,
        unit: "%",
        trend: 3.1,
        status: "excellent",
        description: "Cost management and budget utilization effectiveness",
        category: "financial",
      },
      {
        id: "kpi-3",
        name: "Quality Score",
        value: 94,
        target: 95,
        unit: "%",
        trend: 1.8,
        status: "good",
        description: "Quality assurance and deliverable standards",
        category: "quality",
      },
      {
        id: "kpi-4",
        name: "Team Productivity",
        value: 78,
        target: 85,
        unit: "%",
        trend: -2.1,
        status: "warning",
        description: "Team efficiency and task completion rates",
        category: "efficiency",
      },
      {
        id: "kpi-5",
        name: "Agent Efficiency",
        value: 96,
        target: 90,
        unit: "%",
        trend: 8.7,
        status: "excellent",
        description: "AI agent performance and automation success",
        category: "efficiency",
      },
      {
        id: "kpi-6",
        name: "Risk Level",
        value: 23,
        target: 30,
        unit: "points",
        trend: -12.5,
        status: "excellent",
        description: "Project risk assessment and mitigation effectiveness",
        category: "performance",
      },
    ],
    trendData: [
      { date: "Week 1", projectHealth: 82, budgetEfficiency: 88, teamProductivity: 75, qualityScore: 89, agentEfficiency: 91, riskLevel: 35 },
      { date: "Week 2", projectHealth: 84, budgetEfficiency: 89, teamProductivity: 76, qualityScore: 91, agentEfficiency: 93, riskLevel: 32 },
      { date: "Week 3", projectHealth: 85, budgetEfficiency: 90, teamProductivity: 77, qualityScore: 92, agentEfficiency: 94, riskLevel: 28 },
      { date: "Week 4", projectHealth: 87, budgetEfficiency: 92, teamProductivity: 78, qualityScore: 94, agentEfficiency: 96, riskLevel: 23 },
    ],
    overallScore: 87,
    benchmarks: {
      industry: 82,
      previous: 83,
      target: 90,
    },
    lastUpdated: "5 minutes ago",
    nextUpdate: "in 25 minutes",
  };

  const kpiData = data || mockData;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "excellent":
        return "text-green-600 bg-green-100";
      case "good":
        return "text-blue-600 bg-blue-100";
      case "warning":
        return "text-yellow-600 bg-yellow-100";
      case "critical":
        return "text-red-600 bg-red-100";
      default:
        return "text-slate-600 bg-slate-100";
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "performance":
        return Target;
      case "financial":
        return DollarSign;
      case "quality":
        return CheckCircle;
      case "efficiency":
        return Zap;
      default:
        return Activity;
    }
  };

  const formatMetricValue = (metric: KPIMetric) => {
    if (metric.unit === "%") {
      return `${metric.value}${metric.unit}`;
    }
    return `${metric.value} ${metric.unit}`;
  };

  // Prepare radar chart data
  const radarData = kpiData.metrics.map(metric => ({
    metric: metric.name,
    value: metric.value,
    target: metric.target,
    fullMark: 100,
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-3">
          <p className="font-medium text-slate-800 mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              <div 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-slate-600">{entry.dataKey}:</span>
              <span className="font-medium text-slate-800">
                {entry.value}{entry.dataKey === 'riskLevel' ? ' pts' : '%'}
              </span>
            </div>
          ))}
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
        <CardContent className="space-y-4">
          <div className="h-64 bg-slate-200 rounded"></div>
          <div className="grid grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-16 bg-slate-200 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay: 0.4 }}
    >
      <Card className={cn("hover:shadow-lg transition-shadow duration-300", className)}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-[#E60023]" />
              <CardTitle className="text-lg">{title}</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                Score: {kpiData.overallScore}/100
              </Badge>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                <RefreshCw className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                <Download className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                <Maximize2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <CardDescription>
            Comprehensive performance metrics and trend analysis
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Overall Score & Benchmarks */}
          <div className="bg-slate-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-slate-700">Overall Performance</h4>
              <div className="flex items-center gap-1">
                {kpiData.overallScore >= kpiData.benchmarks.target ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-yellow-500" />
                )}
                <span className="text-xs text-slate-500">
                  vs Target: {kpiData.benchmarks.target}%
                </span>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-xs text-slate-500 mb-1">Current</p>
                <p className="text-xl font-bold text-slate-800">{kpiData.overallScore}%</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Industry Avg</p>
                <p className="text-lg font-semibold text-blue-600">{kpiData.benchmarks.industry}%</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Previous</p>
                <p className="text-lg font-semibold text-slate-600">{kpiData.benchmarks.previous}%</p>
              </div>
            </div>
            <Progress value={kpiData.overallScore} className="h-2 mt-3" />
          </div>

          {/* KPI Metrics Grid */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-slate-700">Key Metrics</h4>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
              {kpiData.metrics.map((metric, index) => {
                const IconComponent = getCategoryIcon(metric.category);
                return (
                  <motion.div
                    key={metric.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * index }}
                    className="p-3 bg-white border border-slate-200 rounded-lg hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <IconComponent className="w-4 h-4 text-slate-500" />
                      <span className="text-xs font-medium text-slate-700">{metric.name}</span>
                    </div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-lg font-bold text-slate-800">
                        {formatMetricValue(metric)}
                      </span>
                      <Badge 
                        variant="secondary" 
                        className={cn("text-xs", getStatusColor(metric.status))}
                      >
                        {metric.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1 mb-2">
                      {metric.trend > 0 ? (
                        <TrendingUp className="w-3 h-3 text-green-500" />
                      ) : (
                        <TrendingDown className="w-3 h-3 text-red-500" />
                      )}
                      <span className="text-xs text-slate-500">
                        {metric.trend > 0 ? '+' : ''}{metric.trend}%
                      </span>
                      <span className="text-xs text-slate-400">vs last period</span>
                    </div>
                    <Progress 
                      value={(metric.value / metric.target) * 100} 
                      className="h-1.5" 
                    />
                    <div className="flex justify-between text-xs text-slate-500 mt-1">
                      <span>Target: {metric.target}{metric.unit}</span>
                      <span>{Math.round((metric.value / metric.target) * 100)}%</span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Trend Chart */}
          {showTrends && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-slate-700">Performance Trends</h4>
                <div className="flex items-center gap-2">
                  {['radar', 'line', 'combined'].map((chartType) => (
                    <Button
                      key={chartType}
                      variant={variant === chartType ? "secondary" : "ghost"}
                      size="sm"
                      className="h-6 px-2 text-xs"
                      onClick={() => {}}
                    >
                      {chartType}
                    </Button>
                  ))}
                </div>
              </div>
              
              <div style={{ height: `${height}px` }}>
                <ResponsiveContainer width="100%" height="100%">
                  {variant === "radar" ? (
                    <RadarChart data={radarData}>
                      <PolarGrid stroke="#E2E8F0" />
                      <PolarAngleAxis dataKey="metric" tick={{ fontSize: 10 }} />
                      <PolarRadiusAxis 
                        angle={90} 
                        domain={[0, 100]} 
                        tick={{ fontSize: 10 }}
                      />
                      <Radar
                        name="Current"
                        dataKey="value"
                        stroke="#3B82F6"
                        fill="#3B82F6"
                        fillOpacity={0.1}
                        strokeWidth={2}
                      />
                      <Radar
                        name="Target"
                        dataKey="target"
                        stroke="#E60023"
                        fill="transparent"
                        strokeWidth={2}
                        strokeDasharray="5 5"
                      />
                      <Tooltip content={<CustomTooltip />} />
                    </RadarChart>
                  ) : variant === "line" ? (
                    <LineChart data={kpiData.trendData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                      <XAxis dataKey="date" stroke="#64748B" fontSize={12} />
                      <YAxis stroke="#64748B" fontSize={12} />
                      <Tooltip content={<CustomTooltip />} />
                      <Line 
                        type="monotone" 
                        dataKey="projectHealth" 
                        stroke="#3B82F6" 
                        strokeWidth={2}
                        dot={{ fill: "#3B82F6", r: 4 }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="budgetEfficiency" 
                        stroke="#10B981" 
                        strokeWidth={2}
                        dot={{ fill: "#10B981", r: 4 }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="agentEfficiency" 
                        stroke="#8B5CF6" 
                        strokeWidth={2}
                        dot={{ fill: "#8B5CF6", r: 4 }}
                      />
                    </LineChart>
                  ) : (
                    <ComposedChart data={kpiData.trendData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                      <XAxis dataKey="date" stroke="#64748B" fontSize={12} />
                      <YAxis stroke="#64748B" fontSize={12} />
                      <Tooltip content={<CustomTooltip />} />
                      <Area 
                        type="monotone" 
                        dataKey="projectHealth" 
                        fill="#3B82F6" 
                        fillOpacity={0.1}
                        stroke="#3B82F6"
                        strokeWidth={2}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="agentEfficiency" 
                        stroke="#8B5CF6" 
                        strokeWidth={2}
                        dot={{ fill: "#8B5CF6", r: 4 }}
                      />
                      <Bar 
                        dataKey="riskLevel" 
                        fill="#EF4444" 
                        fillOpacity={0.3}
                        yAxisId="right"
                      />
                    </ComposedChart>
                  )}
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Update Information */}
          <div className="flex items-center justify-between pt-2 border-t">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Clock className="w-3 h-3" />
              <span>Last updated {kpiData.lastUpdated}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <RefreshCw className="w-3 h-3" />
              <span>Next update {kpiData.nextUpdate}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
