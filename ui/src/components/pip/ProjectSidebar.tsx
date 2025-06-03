import { useState } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { AgentAvatar, AgentType, AgentStatus } from "./AgentAvatar";
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  Settings,
  Activity,
  FolderOpen,
  Clock,
  DollarSign,
  Users,
  MessageSquare,
  UploadCloud,
  Sheet,
  Trash2,
  PlusSquare,
  FileText,
  MapPin,
  Calculator,
  Shield,
  Brain,
  BarChart3,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";

// Import analytics hooks for real-time data
import { useAnalytics } from "@/hooks/useAnalytics";
import { useKPIMetrics } from "@/hooks/useKPIMetrics";

interface ProjectInfo {
  name: string;
  id: string;
  phase: string;
  progress: number;
  budget: number;
  spent: number;
  timeline: string;
  teamSize: number;
}

interface AgentInfo {
  type: AgentType;
  status: AgentStatus;
  name: string;
  tasksCompleted: number;
  currentTask?: string;
}

interface ProjectSidebarProps {
  project?: ProjectInfo;
  agents: AgentInfo[];
  isCollapsed?: boolean;
  onToggle?: () => void;
  className?: string;
  isMobile?: boolean;
}

const defaultProject: ProjectInfo = {
  name: "Office Renovation",
  id: "ORV-2024-001",
  phase: "Preconstruction",
  progress: 35,
  budget: 750000,
  spent: 125000,
  timeline: "6 months",
  teamSize: 8,
};

const defaultAgents: AgentInfo[] = [
  {
    type: "manager",
    status: "idle",
    name: "Project Manager",
    tasksCompleted: 12,
  },
  {
    type: "file-reader",
    status: "working",
    name: "Document Processor",
    tasksCompleted: 47,
    currentTask: "Analyzing CAD files...",
  },
  {
    type: "trade-mapper",
    status: "complete",
    name: "Scope Mapper",
    tasksCompleted: 23,
  },
  {
    type: "estimator",
    status: "idle",
    name: "Cost Estimator",
    tasksCompleted: 18,
  },
  {
    type: "qa-validator",
    status: "idle",
    name: "Quality Validator",
    tasksCompleted: 9,
  },
  {
    type: "exporter",
    status: "idle",
    name: "Document Generator",
    tasksCompleted: 15,
  },
];

export function ProjectSidebar({
  project = defaultProject,
  agents = defaultAgents,
  isCollapsed = false,
  onToggle,
  className,
  isMobile = false,
}: ProjectSidebarProps) {
  const [activeSection, setActiveSection] = useState<
    "overview" | "agents" | "activity" | "analytics"
  >("overview");

  // Analytics integration
  const { data: analyticsData, isLoading: isAnalyticsLoading } = useAnalytics({
    dateRange: {
      from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
      to: new Date(),
    },
    selectedProjects: [project.id],
    selectedMetrics: ['budget', 'progress', 'agents'],
  });

  const { metrics: kpiMetrics, analysis: kpiAnalysis } = useKPIMetrics();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const budgetUsed = (project.spent / project.budget) * 100;

  if (isCollapsed) {
    return (
      <div
        className={cn(
          "w-20 h-full bg-white/30 backdrop-blur-md shadow-lg border-r border-white/10 flex flex-col items-center py-6 gap-6 transition-all duration-300 ease-in-out", // Updated: w-20, glassmorphic, py-6, gap-6
          className,
        )}
      >
        {/* Logo Placeholder - Replace with actual logo */}
        <div className="w-10 h-10 bg-cdo-red rounded-lg flex items-center justify-center">
          <img src="/favicon.ico" alt="PIP AI Logo" className="w-6 h-6" />
        </div>

        <Button
          variant="ghost"
          size="icon" // Changed to icon size
          onClick={onToggle}
          className="text-slate-700 hover:bg-black/10 hover:text-white focus-visible:ring-cdo-red"
          aria-label="Expand Sidebar"
        >
          <ChevronRight className="w-7 h-7" />
        </Button>

        <Separator className="bg-black/10 w-3/4" />

        {/* Collapsed Navigation Icons */}
        <nav className="flex flex-col gap-4 items-center">
          {[ // Icons: Chat, File Upload, Smartsheet, Clear, New
            { key: "chat", label: "Chat", icon: MessageSquare, action: () => console.log("Chat clicked") },
            { key: "upload", label: "File Upload", icon: UploadCloud, action: () => console.log("Upload clicked") },
            { key: "smartsheet", label: "Smartsheet", icon: Sheet, action: () => console.log("Smartsheet clicked") },
            { key: "clear", label: "Clear Session", icon: Trash2, action: () => console.log("Clear clicked") },
            { key: "new", label: "New Project", icon: PlusSquare, action: () => console.log("New clicked") },
          ].map(({ key, label, icon: Icon, action }) => (
            <Button
              key={key}
              variant="ghost"
              size="icon"
              onClick={action}
              className="text-slate-700 hover:bg-black/10 hover:text-white focus-visible:ring-cdo-red w-12 h-12"
              aria-label={label}
            >
              <Icon className="w-7 h-7" />
            </Button>
          ))}
        </nav>

        <div className="mt-auto flex flex-col items-center gap-4">
          <Separator className="bg-black/10 w-3/4" />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => console.log("Settings")}
            className="text-slate-700 hover:bg-black/10 hover:text-white focus-visible:ring-cdo-red w-12 h-12"
            aria-label="Settings"
          >
            <Settings className="w-7 h-7" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "w-80 h-full bg-white/30 backdrop-blur-md shadow-lg border-r border-white/10 flex flex-col transition-all duration-300 ease-in-out", // Glassmorphic
        className,
      )}
    >
      {/* Header */}
      <div className="p-6 border-b border-black/10"> {/* Adjusted border color */}
        <div className="flex items-center justify-between mb-6"> {/* Increased mb */} 
          <div className="flex items-center gap-3"> {/* Increased gap */} 
            {/* Logo Placeholder - Replace with actual logo */}
            <div className="w-10 h-10 bg-cdo-red rounded-lg flex items-center justify-center shadow-md">
              <img src="/favicon.ico" alt="PIP AI Logo" className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">PIP AI</h2> {/* Typography: Section Header style */} 
              <p className="text-xs text-slate-500">Project Intelligence</p> {/* Typography: Metadata style */} 
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon" // Changed to icon size
            onClick={onToggle}
            className="text-slate-700 hover:bg-black/10 hover:text-white focus-visible:ring-cdo-red"
            aria-label="Collapse Sidebar"
          >
            <ChevronLeft className="w-7 h-7" />
          </Button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-1 p-1 bg-black/5 rounded-lg">
          {[
            { key: "overview", label: "Overview", icon: FolderOpen },
            { key: "agents", label: "Agents", icon: Users },
            { key: "activity", label: "Activity", icon: Activity },
            { key: "analytics", label: "Analytics", icon: BarChart3 },
          ].map(({ key, label, icon: Icon }) => (
            <Button
              key={key}
              variant={activeSection === key ? "secondary" : "ghost"} // Use secondary for active
              size="sm"
              className={cn(
                "flex-1 h-9 text-xs gap-1.5 focus-visible:ring-cdo-red", // Ensure focus ring
                activeSection === key
                  ? "bg-black/10 text-slate-800 font-semibold shadow-sm"
                  : "text-slate-600 hover:text-slate-800 hover:bg-black/5",
              )}
              onClick={() => setActiveSection(key as any)}
            >
              <Icon className="w-4 h-4" /> {/* Adjusted icon size for tab buttons */}
              {label}
            </Button>
          ))}
        </div>
      </div>

      {/* Content Area - Ensure p-6 from design rules */}
      <div className="flex-1 p-6 overflow-y-auto space-y-8"> {/* Added p-6 and space-y-8 */} 
        {activeSection === "overview" && (
          <div className="space-y-6">
            {/* Project Info Card (Implicit) */}
            <div>
              <h3 className="text-xl font-semibold text-slate-800 mb-4"> {/* Typography: Section Header style */} 
                {project.name}
              </h3>
              <div className="space-y-3 text-sm"> {/* Typography: text-sm for metadata section */} 
                <div className="flex justify-between">
                  <span className="text-slate-500">Project ID</span>
                  <span className="text-slate-700 font-medium">{project.id}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Phase</span>
                  <Badge
                    variant="outline"
                    className="border-cdo-red/50 text-cdo-red bg-cdo-red/10 text-xs font-medium" // CDO Red Badge
                  >
                    {project.phase}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Timeline</span>
                  <span className="text-slate-700 font-medium">{project.timeline}</span>
                </div>
              </div>
            </div>

            <Separator className="bg-black/10" />

            {/* Progress Card (Implicit) */}
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-500">Overall Progress</span>
                <span className="text-slate-700 font-semibold">{project.progress}%</span>
              </div>
              <Progress value={project.progress} className="h-2 bg-slate-200" /> {/* CDO Red Progress via bg-primary */}
            </div>

            <Separator className="bg-black/10" />

            {/* Budget Card (Implicit) */}
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-500">Budget Usage</span>
                <span className="text-slate-700 font-semibold">{budgetUsed.toFixed(1)}%</span>
              </div>
              <Progress value={budgetUsed} className="h-2 mb-3 bg-slate-200" /> {/* CDO Red Progress via bg-primary */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-slate-500">Total Budget</div>
                  <div className="text-slate-700 font-semibold text-base"> {/* Typography: text-base */} 
                    {formatCurrency(project.budget)}
                  </div>
                </div>
                <div>
                  <div className="text-slate-500">Spent</div>
                  <div className="text-slate-700 font-semibold text-base"> {/* Typography: text-base */} 
                    {formatCurrency(project.spent)}
                  </div>
                </div>
              </div>
            </div>

            <Separator className="bg-black/10" />

            {/* Quick Stats - Styled as mini-cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white rounded-lg shadow-lg p-4 flex items-center gap-3 border border-slate-200"> {/* Card Styling */} 
                <Users className="w-7 h-7 text-cdo-red" /> {/* Icon Styling */} 
                <div>
                  <div className="text-xs text-slate-500">Team Size</div>
                  <div className="text-base font-semibold text-slate-800"> {/* Typography */} 
                    {project.teamSize}
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-lg p-4 flex items-center gap-3 border border-slate-200"> {/* Card Styling */} 
                <Activity className="w-7 h-7 text-cdo-red" /> {/* Icon Styling */} 
                <div>
                  <div className="text-xs text-slate-500">Active Agents</div>
                  <div className="text-base font-semibold text-slate-800"> {/* Typography */} 
                    {agents.filter((a) => a.status === "working").length}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeSection === "agents" && (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-slate-800 mb-4">AI Team Status</h3> {/* Typography */} 
            {agents.map((agent) => (
              <div
                key={agent.type}
                className="bg-white rounded-lg shadow-lg p-4 flex items-center gap-4 border border-slate-200 hover:shadow-xl transition-shadow duration-200" // Card Styling
              >
                <AgentAvatar
                  type={agent.type}
                  status={agent.status}
                  name={agent.name}
                  size="md" // Slightly larger avatar
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-base font-semibold text-slate-800"> {/* Typography */} 
                      {agent.name}
                    </span>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-xs font-medium px-2 py-0.5 rounded-full", // Base badge style
                        agent.status === "working" &&
                          "border-agent-blue/50 text-agent-blue bg-agent-blue/10 shadow-sm animate-pulse-glow [--tw-shadow-color:theme(colors.agent-blue)]", // Agent Blue with pulse
                        agent.status === "complete" &&
                          "border-agent-green/50 text-agent-green bg-agent-green/10 shadow-sm", // Agent Green
                        agent.status === "idle" &&
                          "border-slate-300 text-slate-500 bg-slate-100 shadow-sm", // Neutral Gray
                        agent.status === "error" &&
                          "border-red-500/50 text-red-600 bg-red-500/10 shadow-sm animate-bounce-subtle", // Error Red
                      )}
                    >
                      {agent.status.charAt(0).toUpperCase() + agent.status.slice(1)}
                    </Badge>
                  </div>
                  <div className="text-xs text-slate-500 mb-1.5">
                    {agent.tasksCompleted} tasks completed
                  </div>
                  {agent.currentTask && (
                    <div className="text-xs text-slate-600 italic bg-slate-50 p-2 rounded-md border border-slate-200">
                      Current: {agent.currentTask}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeSection === "activity" && (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-slate-800 mb-4"> {/* Typography */} 
              Recent Activity
            </h3>
            <div className="space-y-3">
              {[
                {
                  time: "2 min ago",
                  agent: "File Reader",
                  action: "Processed 15 CAD drawings",
                  icon: FileText, // Added icon
                  color: "agent-blue",
                },
                {
                  time: "5 min ago",
                  agent: "Trade Mapper",
                  action: "Mapped electrical scope to CSI 26",
                  icon: MapPin, // Added icon
                  color: "agent-teal",
                },
                {
                  time: "12 min ago",
                  agent: "Estimator",
                  action: "Updated labor costs for HVAC",
                  icon: Calculator, // Added icon
                  color: "agent-teal", 
                },
                {
                  time: "18 min ago",
                  agent: "QA Validator",
                  action: "Flagged potential schedule conflict",
                  icon: Shield, // Added icon
                  color: "slate-500", // Neutral for QA
                },
                {
                  time: "25 min ago",
                  agent: "Manager",
                  action: "Triaged new RFI request",
                  icon: Brain, // Added icon
                  color: "slate-500", // Neutral for Manager
                },
              ].map((activity, index) => {
                const ActivityIcon = activity.icon;
                return (
                  <div
                    key={index}
                    className="bg-white rounded-lg shadow-lg p-4 flex items-start gap-4 border border-slate-200" // Card Styling
                  >
                    <div className={cn("w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5", `bg-${activity.color}/10`)}>
                      <ActivityIcon className={cn("w-5 h-5", `text-${activity.color}`)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-700 font-medium"> {/* Typography */} 
                        {activity.action}
                      </p>
                      <p className="text-xs text-slate-500 mt-1"> {/* Typography */} 
                        {activity.agent} • {activity.time}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeSection === "analytics" && (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-slate-800 mb-4">Project Analytics</h3>
            
            {/* Analytics Loading State */}
            {isAnalyticsLoading && !analyticsData && (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="bg-white rounded-lg shadow-lg p-4 border border-slate-200 animate-pulse">
                    <div className="h-4 bg-slate-200 rounded w-1/2 mb-2"></div>
                    <div className="h-6 bg-slate-200 rounded w-3/4"></div>
                  </div>
                ))}
              </div>
            )}

            {/* Analytics Content */}
            {!isAnalyticsLoading && analyticsData && (
              <>
                {/* KPI Summary Cards */}
                <div className="space-y-3">
                  <div className="bg-white rounded-lg shadow-lg p-4 border border-slate-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-slate-500">Project Health</span>
                      <TrendingUp className="w-4 h-4 text-green-500" />
                    </div>
                    <div className="text-2xl font-bold text-slate-800">
                      {kpiAnalysis?.overallScore || analyticsData?.quickStats?.overallHealth || 85}%
                    </div>
                    <div className="text-xs text-green-600 mt-1">
                      +5.2% from last week
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow-lg p-4 border border-slate-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-slate-500">Budget Efficiency</span>
                      <DollarSign className="w-4 h-4 text-blue-500" />
                    </div>
                    <div className="text-2xl font-bold text-slate-800">
                      {analyticsData?.quickStats?.budgetUtilization || 72}%
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      ${formatCurrency(project.spent)} / ${formatCurrency(project.budget)}
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow-lg p-4 border border-slate-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-slate-500">Team Productivity</span>
                      <Users className="w-4 h-4 text-purple-500" />
                    </div>
                    <div className="text-2xl font-bold text-slate-800">
                      {analyticsData?.quickStats?.teamProductivity || 88}%
                    </div>
                    <div className="text-xs text-purple-600 mt-1">
                      {agents.filter(a => a.status === 'working').length} agents active
                    </div>
                  </div>
                </div>

                {/* Performance Insights */}
                {kpiAnalysis?.recommendations && kpiAnalysis.recommendations.length > 0 && (
                  <div className="bg-white rounded-lg shadow-lg p-4 border border-slate-200">
                    <div className="flex items-center gap-2 mb-3">
                      <AlertTriangle className="w-4 h-4 text-orange-500" />
                      <span className="text-sm font-medium text-slate-800">Insights</span>
                    </div>
                    <div className="space-y-2">
                      {kpiAnalysis.recommendations.slice(0, 2).map((rec, index) => (
                        <div key={index} className="text-xs">
                          <div className="font-medium text-slate-700">{rec.action}</div>
                          <div className="text-slate-500">{rec.impact}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quick Actions */}
                <div className="bg-white rounded-lg shadow-lg p-4 border border-slate-200">
                  <div className="text-sm font-medium text-slate-800 mb-3">Quick Actions</div>
                  <div className="space-y-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start gap-2 text-xs"
                      onClick={() => console.log('View full analytics')}
                    >
                      <BarChart3 className="w-3 h-3" />
                      View Full Dashboard
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start gap-2 text-xs"
                      onClick={() => console.log('Export report')}
                    >
                      <FileText className="w-3 h-3" />
                      Export Report
                    </Button>
                  </div>
                </div>
              </>
            )}

            {/* Error State */}
            {!isAnalyticsLoading && !analyticsData && (
              <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                  <span className="text-sm font-medium text-red-800">Analytics Unavailable</span>
                </div>
                <p className="text-xs text-red-600">
                  Unable to load analytics data. Please try refreshing.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer - Ensure p-6 from design rules */}
      <div className="p-6 border-t border-black/10">
        <Button
          variant="outline"
          size="default" // Default size for better tap target
          className="w-full border-slate-300 text-slate-700 hover:bg-slate-100 hover:border-slate-400 focus-visible:ring-cdo-red"
          aria-label="Open Project Settings"
        >
          <Settings className="w-5 h-5 mr-2" /> {/* Icon size adjusted for default button */}
          Project Settings
        </Button>
      </div>
    </div>
  );
}
