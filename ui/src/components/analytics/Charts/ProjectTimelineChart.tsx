import React from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import {
  Calendar,
  Download,
  Maximize2,
  Clock,
  CheckCircle,
  AlertTriangle,
  Activity,
} from "lucide-react";

interface TimelinePhase {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  status: "completed" | "in-progress" | "pending" | "delayed";
  progress: number;
  dependencies: string[];
  milestones: {
    name: string;
    date: string;
    completed: boolean;
  }[];
}

interface ProjectTimelineData {
  phases: TimelinePhase[];
  totalDuration: number; // days
  completedDuration: number; // days
  currentPhase: string;
  nextMilestone: {
    name: string;
    date: string;
    daysRemaining: number;
  };
  riskFactors: {
    factor: string;
    impact: "low" | "medium" | "high";
    probability: number;
  }[];
}

interface ProjectTimelineChartProps {
  data?: ProjectTimelineData;
  title?: string;
  className?: string;
  isLoading?: boolean;
  height?: number;
}

export function ProjectTimelineChart({ 
  data, 
  title = "Project Timeline", 
  className,
  isLoading = false,
  height = 400
}: ProjectTimelineChartProps) {
  const mockData: ProjectTimelineData = {
    phases: [
      {
        id: "phase-1",
        name: "Planning & Design",
        startDate: "2024-11-01",
        endDate: "2024-11-15",
        status: "completed",
        progress: 100,
        dependencies: [],
        milestones: [
          { name: "Requirements Analysis", date: "2024-11-05", completed: true },
          { name: "System Design", date: "2024-11-12", completed: true },
          { name: "UI/UX Mockups", date: "2024-11-15", completed: true },
        ]
      },
      {
        id: "phase-2",
        name: "Core Development",
        startDate: "2024-11-16",
        endDate: "2024-12-15",
        status: "in-progress",
        progress: 75,
        dependencies: ["phase-1"],
        milestones: [
          { name: "Backend API", date: "2024-11-30", completed: true },
          { name: "Database Setup", date: "2024-12-05", completed: true },
          { name: "Frontend Framework", date: "2024-12-15", completed: false },
        ]
      },
      {
        id: "phase-3",
        name: "AI Integration",
        startDate: "2024-12-10",
        endDate: "2024-12-30",
        status: "in-progress",
        progress: 40,
        dependencies: ["phase-2"],
        milestones: [
          { name: "Model Integration", date: "2024-12-20", completed: false },
          { name: "Agent Framework", date: "2024-12-25", completed: false },
          { name: "Performance Optimization", date: "2024-12-30", completed: false },
        ]
      },
      {
        id: "phase-4",
        name: "Testing & QA",
        startDate: "2024-12-25",
        endDate: "2025-01-15",
        status: "pending",
        progress: 0,
        dependencies: ["phase-3"],
        milestones: [
          { name: "Unit Testing", date: "2025-01-05", completed: false },
          { name: "Integration Testing", date: "2025-01-10", completed: false },
          { name: "User Acceptance Testing", date: "2025-01-15", completed: false },
        ]
      },
      {
        id: "phase-5",
        name: "Deployment",
        startDate: "2025-01-10",
        endDate: "2025-01-25",
        status: "pending",
        progress: 0,
        dependencies: ["phase-4"],
        milestones: [
          { name: "Production Setup", date: "2025-01-15", completed: false },
          { name: "Go-Live", date: "2025-01-20", completed: false },
          { name: "Post-Launch Monitoring", date: "2025-01-25", completed: false },
        ]
      },
    ],
    totalDuration: 85,
    completedDuration: 45,
    currentPhase: "phase-3",
    nextMilestone: {
      name: "Model Integration",
      date: "2024-12-20",
      daysRemaining: 6,
    },
    riskFactors: [
      { factor: "API Rate Limits", impact: "high", probability: 75 },
      { factor: "Resource Availability", impact: "medium", probability: 45 },
      { factor: "Third-party Dependencies", impact: "low", probability: 30 },
    ],
  };

  const timelineData = data || mockData;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500";
      case "in-progress":
        return "bg-blue-500";
      case "pending":
        return "bg-slate-300";
      case "delayed":
        return "bg-red-500";
      default:
        return "bg-slate-300";
    }
  };

  const getStatusTextColor = (status: string) => {
    switch (status) {
      case "completed":
        return "text-green-600 bg-green-100";
      case "in-progress":
        return "text-blue-600 bg-blue-100";
      case "pending":
        return "text-slate-600 bg-slate-100";
      case "delayed":
        return "text-red-600 bg-red-100";
      default:
        return "text-slate-600 bg-slate-100";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "in-progress":
        return <Activity className="w-4 h-4 text-blue-500" />;
      case "delayed":
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-slate-500" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const calculateDuration = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
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
      transition={{ duration: 0.4, delay: 0.3 }}
    >
      <Card className={cn("hover:shadow-lg transition-shadow duration-300", className)}>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#E60023]" />
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
            Project phases, milestones, and timeline tracking
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Progress Summary */}
          <div className="grid grid-cols-3 gap-4 p-3 bg-slate-50 rounded-lg">
            <div className="text-center">
              <p className="text-xs text-slate-500 mb-1">Overall Progress</p>
              <p className="text-lg font-bold text-slate-800">
                {Math.round((timelineData.completedDuration / timelineData.totalDuration) * 100)}%
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-slate-500 mb-1">Next Milestone</p>
              <p className="text-sm font-bold text-blue-600">
                {timelineData.nextMilestone.daysRemaining} days
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-slate-500 mb-1">Current Phase</p>
              <p className="text-sm font-bold text-green-600">
                {timelineData.phases.find(p => p.id === timelineData.currentPhase)?.name.split(' ')[0]}
              </p>
            </div>
          </div>

          {/* Timeline Visualization */}
          <div className="space-y-4" style={{ minHeight: `${height - 100}px` }}>
            <h4 className="text-sm font-medium text-slate-700">Project Phases</h4>
            <div className="space-y-4">
              {timelineData.phases.map((phase, index) => (
                <motion.div
                  key={phase.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * index }}
                  className="relative"
                >
                  {/* Timeline connector */}
                  {index < timelineData.phases.length - 1 && (
                    <div className="absolute left-6 top-12 w-0.5 h-8 bg-slate-200" />
                  )}
                  
                  <div className="flex items-start gap-4 p-3 bg-white border border-slate-200 rounded-lg hover:shadow-md transition-shadow">
                    {/* Status indicator */}
                    <div className="flex items-center justify-center w-12 h-12 rounded-full bg-slate-100">
                      {getStatusIcon(phase.status)}
                    </div>
                    
                    {/* Phase content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="text-sm font-medium text-slate-800">
                          {phase.name}
                        </h5>
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant="secondary" 
                            className={cn("text-xs", getStatusTextColor(phase.status))}
                          >
                            {phase.status.replace('-', ' ').toUpperCase()}
                          </Badge>
                          <span className="text-xs text-slate-500">
                            {phase.progress}%
                          </span>
                        </div>
                      </div>
                      
                      {/* Date range */}
                      <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
                        <Calendar className="w-3 h-3" />
                        <span>
                          {formatDate(phase.startDate)} - {formatDate(phase.endDate)}
                        </span>
                        <span>({calculateDuration(phase.startDate, phase.endDate)} days)</span>
                      </div>
                      
                      {/* Progress bar */}
                      <div className="w-full bg-slate-200 rounded-full h-2 mb-3">
                        <div 
                          className={cn("h-2 rounded-full transition-all duration-500", getStatusColor(phase.status))}
                          style={{ width: `${phase.progress}%` }}
                        />
                      </div>
                      
                      {/* Milestones */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                        {phase.milestones.map((milestone, mIndex) => (
                          <div 
                            key={mIndex}
                            className="flex items-center gap-2 text-xs"
                          >
                            {milestone.completed ? (
                              <CheckCircle className="w-3 h-3 text-green-500" />
                            ) : (
                              <Clock className="w-3 h-3 text-slate-400" />
                            )}
                            <span className={cn(
                              "truncate",
                              milestone.completed ? "text-green-600" : "text-slate-500"
                            )}>
                              {milestone.name}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Risk Factors */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-slate-700">Risk Factors</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              {timelineData.riskFactors.map((risk, index) => {
                const getImpactColor = (impact: string) => {
                  switch (impact) {
                    case "high": return "text-red-600 bg-red-100";
                    case "medium": return "text-yellow-600 bg-yellow-100";
                    case "low": return "text-green-600 bg-green-100";
                    default: return "text-slate-600 bg-slate-100";
                  }
                };

                return (
                  <div key={index} className="p-2 bg-slate-50 rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-slate-700">
                        {risk.factor}
                      </span>
                      <Badge 
                        variant="secondary" 
                        className={cn("text-xs", getImpactColor(risk.impact))}
                      >
                        {risk.impact.toUpperCase()}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-slate-200 rounded-full h-1">
                        <div 
                          className="bg-red-500 h-1 rounded-full transition-all duration-500"
                          style={{ width: `${risk.probability}%` }}
                        />
                      </div>
                      <span className="text-xs text-slate-500">
                        {risk.probability}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-2 border-t">
            <div className="text-xs text-slate-500">
              Next: <span className="font-medium">{timelineData.nextMilestone.name}</span> in {timelineData.nextMilestone.daysRemaining} days
            </div>
            <div className="text-xs text-slate-500">
              Updated 30 min ago
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
