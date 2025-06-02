import React from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import {
  Target,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  AlertTriangle,
  Activity,
} from "lucide-react";

interface ProjectHealthData {
  overallScore: number;
  progressPercentage: number;
  timelineStatus: "on-track" | "at-risk" | "delayed";
  budgetStatus: "under" | "on-track" | "over";
  qualityScore: number;
  riskLevel: "low" | "medium" | "high";
  lastUpdated: string;
  trends: {
    progress: number;
    quality: number;
    timeline: number;
  };
}

interface ProjectHealthWidgetProps {
  data?: ProjectHealthData;
  isLoading?: boolean;
  className?: string;
}

export function ProjectHealthWidget({ data, isLoading, className }: ProjectHealthWidgetProps) {
  const mockData: ProjectHealthData = {
    overallScore: 87,
    progressPercentage: 74,
    timelineStatus: "on-track",
    budgetStatus: "on-track",
    qualityScore: 92,
    riskLevel: "low",
    lastUpdated: "2 minutes ago",
    trends: {
      progress: 5.2,
      quality: 2.1,
      timeline: 0.8,
    },
  };

  const healthData = data || mockData;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "on-track":
      case "under":
      case "low":
        return "text-green-600 bg-green-100";
      case "at-risk":
      case "medium":
        return "text-yellow-600 bg-yellow-100";
      case "delayed":
      case "over":
      case "high":
        return "text-red-600 bg-red-100";
      default:
        return "text-slate-600 bg-slate-100";
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
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
      transition={{ duration: 0.3 }}
    >
      <Card className={cn("hover:shadow-lg transition-shadow duration-300", className)}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-[#E60023]" />
              <CardTitle className="text-lg">Project Health</CardTitle>
            </div>
            <Badge 
              variant="secondary" 
              className={cn("text-xs", getStatusColor(healthData.riskLevel))}
            >
              {healthData.riskLevel.toUpperCase()} RISK
            </Badge>
          </div>
          <CardDescription>
            Overall project performance and health metrics
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Overall Score */}
          <div className="text-center">
            <div className="relative inline-flex items-center justify-center">
              <svg className="w-24 h-24 transform -rotate-90">
                <circle
                  cx="48"
                  cy="48"
                  r="40"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  className="text-slate-200"
                />
                <circle
                  cx="48"
                  cy="48"
                  r="40"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 40}`}
                  strokeDashoffset={`${2 * Math.PI * 40 * (1 - healthData.overallScore / 100)}`}
                  className={cn(
                    "transition-all duration-1000 ease-out",
                    getScoreColor(healthData.overallScore)
                  )}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className={cn("text-2xl font-bold", getScoreColor(healthData.overallScore))}>
                  {healthData.overallScore}
                </span>
              </div>
            </div>
            <p className="text-sm text-slate-600 mt-2">Health Score</p>
          </div>

          {/* Key Metrics */}
          <div className="space-y-4">
            {/* Progress */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-700">Progress</span>
                <div className="flex items-center gap-1">
                  <span className="text-sm font-semibold">{healthData.progressPercentage}%</span>
                  {healthData.trends.progress > 0 ? (
                    <TrendingUp className="w-3 h-3 text-green-500" />
                  ) : (
                    <TrendingDown className="w-3 h-3 text-red-500" />
                  )}
                  <span className="text-xs text-slate-500">
                    {healthData.trends.progress > 0 ? '+' : ''}{healthData.trends.progress}%
                  </span>
                </div>
              </div>
              <Progress value={healthData.progressPercentage} className="h-2" />
            </div>

            {/* Quality Score */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-700">Quality</span>
                <div className="flex items-center gap-1">
                  <span className="text-sm font-semibold">{healthData.qualityScore}%</span>
                  {healthData.trends.quality > 0 ? (
                    <TrendingUp className="w-3 h-3 text-green-500" />
                  ) : (
                    <TrendingDown className="w-3 h-3 text-red-500" />
                  )}
                  <span className="text-xs text-slate-500">
                    {healthData.trends.quality > 0 ? '+' : ''}{healthData.trends.quality}%
                  </span>
                </div>
              </div>
              <Progress value={healthData.qualityScore} className="h-2" />
            </div>
          </div>

          {/* Status Indicators */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-500" />
              <div>
                <p className="text-xs text-slate-500">Timeline</p>
                <Badge 
                  variant="secondary" 
                  className={cn("text-xs", getStatusColor(healthData.timelineStatus))}
                >
                  {healthData.timelineStatus.replace('-', ' ').toUpperCase()}
                </Badge>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-slate-500" />
              <div>
                <p className="text-xs text-slate-500">Budget</p>
                <Badge 
                  variant="secondary" 
                  className={cn("text-xs", getStatusColor(healthData.budgetStatus))}
                >
                  {healthData.budgetStatus.replace('-', ' ').toUpperCase()}
                </Badge>
              </div>
            </div>
          </div>

          {/* Last Updated */}
          <div className="text-xs text-slate-500 text-center pt-2 border-t">
            Updated {healthData.lastUpdated}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
