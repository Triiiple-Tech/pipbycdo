import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  Activity,
  BarChart3,
  PieChart,
  LineChart,
  Download,
  Filter,
  RefreshCw,
  Calendar,
  DollarSign,
  Users,
  FileText,
  Clock,
  Target,
  AlertTriangle,
  CheckCircle,
  Zap,
} from "lucide-react";

// Import dashboard widgets
import { ProjectHealthWidget } from "./DashboardWidgets/ProjectHealthWidget";
import { BudgetAnalyticsWidget } from "./DashboardWidgets/BudgetAnalyticsWidget";
import { AgentPerformanceWidget } from "./DashboardWidgets/AgentPerformanceWidget";
import { ResourceUtilizationWidget } from "./DashboardWidgets/ResourceUtilizationWidget";
import { PredictiveInsightsWidget } from "./DashboardWidgets/PredictiveInsightsWidget";

// Import chart components
import { TimeSeriesChart } from "./Charts/TimeSeriesChart";
import { BudgetBreakdownChart } from "./Charts/BudgetBreakdownChart";
import { AgentActivityChart } from "./Charts/AgentActivityChart";
import { ProjectTimelineChart } from "./Charts/ProjectTimelineChart";
import { KPIMetricsChart } from "./Charts/KPIMetricsChart";

// Import filters
import { DateRangeFilter } from "./Filters/DateRangeFilter";
import { ProjectFilter } from "./Filters/ProjectFilter";
import { MetricFilter } from "./Filters/MetricFilter";

// Import export manager
import { ExportManager } from "./DataExports/ExportManager";

// Import custom hooks
import { useAnalytics } from "@/hooks/useAnalytics";
import { useKPIMetrics } from "@/hooks/useKPIMetrics";
import { useRealTimeData } from "@/hooks/useRealTimeData";

// Import analytics API service
import { analyticsApi } from "@/services/analyticsApi";

interface AnalyticsTabProps {
  className?: string;
}

export function AnalyticsTab({ className }: AnalyticsTabProps) {
  const [activeView, setActiveView] = useState<"overview" | "detailed" | "custom">("overview");
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    to: new Date(),
  });
  const [selectedProject, setSelectedProject] = useState<string>("all");
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>([
    "progress",
    "budget",
    "agents",
    "timeline",
  ]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [apiHealth, setApiHealth] = useState<'healthy' | 'degraded' | 'down'>('healthy');

  // Custom hooks for data management
  const { analyticsData, isLoading, error, refreshData } = useAnalytics({
    dateRange,
    projectId: selectedProject,
  });

  const { kpiMetrics, isLoadingKPIs } = useKPIMetrics({
    dateRange,
    projectId: selectedProject,
  });

  const { realTimeData, connectionStatus } = useRealTimeData({
    enabled: true,
    metrics: selectedMetrics,
  });

  // Check API health on component mount
  useEffect(() => {
    const checkApiHealth = async () => {
      try {
        await analyticsApi.getSystemHealth();
        setApiHealth('healthy');
      } catch (error) {
        console.warn('Analytics API health check failed:', error);
        setApiHealth('degraded');
      }
    };

    checkApiHealth();
    // Check health every 5 minutes
    const healthInterval = setInterval(checkApiHealth, 5 * 60 * 1000);
    
    return () => clearInterval(healthInterval);
  }, []);

  // Refresh data handler with API integration
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshData();
      // Trigger API health check on refresh
      await analyticsApi.getSystemHealth();
      setApiHealth('healthy');
    } catch (error) {
      console.error('Failed to refresh data:', error);
      setApiHealth('degraded');
    } finally {
      setTimeout(() => setIsRefreshing(false), 1000);
    }
  };

  // Quick stats for header
  const quickStats = [
    {
      label: "Project Health",
      value: kpiMetrics?.projectHealth || 0,
      unit: "%",
      trend: "+5.2%",
      icon: Target,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      label: "Budget Usage",
      value: kpiMetrics?.budgetUsage || 0,
      unit: "%",
      trend: "+2.1%",
      icon: DollarSign,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      label: "Active Agents",
      value: kpiMetrics?.activeAgents || 0,
      unit: "",
      trend: "stable",
      icon: Users,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
    {
      label: "Files Processed",
      value: kpiMetrics?.filesProcessed || 0,
      unit: "",
      trend: "+12.5%",
      icon: FileText,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
    },
  ];

  return (
    <div className={cn("h-full bg-gray-50 dark:bg-slate-900 flex flex-col", className)}>
      {/* Header */}
      <div className="flex-shrink-0 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-200">
              Analytics Dashboard
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Smart data visualization and project insights
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            {/* API Health Status */}
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  "w-2 h-2 rounded-full",
                  apiHealth === 'healthy' 
                    ? "bg-green-500" 
                    : apiHealth === 'degraded' 
                    ? "bg-yellow-500" 
                    : "bg-red-500"
                )}
              />
              <span className="text-xs text-slate-500 capitalize">
                API {apiHealth}
              </span>
            </div>

            {/* Real-time status indicator */}
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  "w-2 h-2 rounded-full",
                  connectionStatus === "connected" ? "bg-green-500 animate-pulse" : "bg-red-500"
                )}
              />
              <span className="text-xs text-slate-500">
                {connectionStatus === "connected" ? "Live" : "Offline"}
              </span>
            </div>

            {/* Refresh button */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="gap-2"
            >
              <RefreshCw className={cn("w-4 h-4", isRefreshing && "animate-spin")} />
              Refresh
            </Button>

            {/* Export manager */}
            <ExportManager 
              data={analyticsData}
              dateRange={dateRange}
              selectedMetrics={selectedMetrics}
            />
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {quickStats.map((stat, index) => {
            const IconComponent = stat.icon;
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="hover:shadow-md transition-shadow duration-200">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-slate-500 font-medium">{stat.label}</p>
                        <p className="text-2xl font-bold text-slate-800 dark:text-slate-200">
                          {stat.value}{stat.unit}
                        </p>
                        <div className="flex items-center gap-1 mt-1">
                          {stat.trend !== "stable" ? (
                            stat.trend.startsWith("+") ? (
                              <TrendingUp className="w-3 h-3 text-green-500" />
                            ) : (
                              <TrendingDown className="w-3 h-3 text-red-500" />
                            )
                          ) : null}
                          <span className="text-xs text-slate-500">{stat.trend}</span>
                        </div>
                      </div>
                      <div className={cn("p-2 rounded-lg", stat.bgColor)}>
                        <IconComponent className={cn("w-5 h-5", stat.color)} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4">
          <DateRangeFilter
            value={dateRange}
            onChange={setDateRange}
          />
          <ProjectFilter
            value={selectedProject}
            onChange={setSelectedProject}
          />
          <MetricFilter
            value={selectedMetrics}
            onChange={setSelectedMetrics}
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <Tabs value={activeView} onValueChange={(value) => setActiveView(value as any)} className="h-full">
          <TabsList className="mx-6 mt-4 grid w-auto grid-cols-3">
            <TabsTrigger value="overview" className="gap-2">
              <BarChart3 className="w-4 h-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="detailed" className="gap-2">
              <LineChart className="w-4 h-4" />
              Detailed
            </TabsTrigger>
            <TabsTrigger value="custom" className="gap-2">
              <PieChart className="w-4 h-4" />
              Custom
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6 px-6 space-y-6">
            {/* Error State */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6"
              >
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                  <span className="text-sm font-medium text-red-800 dark:text-red-200">
                    Failed to load analytics data
                  </span>
                </div>
                <p className="text-xs text-red-600 dark:text-red-300 mt-1">
                  {error instanceof Error ? error.message : 'Unknown error occurred'}
                </p>
              </motion.div>
            )}

            {/* Loading State */}
            {(isLoading || isLoadingKPIs) && !analyticsData && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {[...Array(4)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-6">
                      <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2 mb-4"></div>
                      <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-3/4 mb-2"></div>
                      <div className="h-20 bg-slate-200 dark:bg-slate-700 rounded"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Dashboard Widgets */}
            {!isLoading && analyticsData && (
              <>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <ProjectHealthWidget 
                    data={analyticsData?.projectHealth}
                    isLoading={isLoading}
                    className="lg:col-span-1"
                  />
                  <BudgetAnalyticsWidget
                    data={analyticsData?.budget}
                    isLoading={isLoading}
                    className="lg:col-span-1"
                  />
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <AgentPerformanceWidget
                    data={analyticsData?.agents}
                    isLoading={isLoading}
                    className="lg:col-span-1"
                  />
                  <ResourceUtilizationWidget
                    data={analyticsData?.resources}
                    isLoading={isLoading}
                    className="lg:col-span-1"
                  />
                </div>

                <PredictiveInsightsWidget
                  data={analyticsData?.predictions}
                  isLoading={isLoading}
                  className="w-full"
                />
              </>
            )}
          </TabsContent>

          <TabsContent value="detailed" className="mt-6 px-6 space-y-6">
            {/* Error State */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6"
              >
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                  <span className="text-sm font-medium text-red-800 dark:text-red-200">
                    Failed to load detailed analytics
                  </span>
                </div>
              </motion.div>
            )}

            {/* Loading State */}
            {isLoading && !analyticsData && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                  {[...Array(4)].map((_, i) => (
                    <Card key={i} className="animate-pulse">
                      <CardContent className="p-6">
                        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/3 mb-4"></div>
                        <div className="h-48 bg-slate-200 dark:bg-slate-700 rounded"></div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Detailed Charts */}
            {!isLoading && analyticsData && (
              <>
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                  <TimeSeriesChart
                    data={analyticsData?.timeSeries}
                    title="Progress Over Time"
                    className="xl:col-span-1"
                  />
                  <BudgetBreakdownChart
                    data={analyticsData?.budgetBreakdown}
                    title="Budget Distribution"
                    className="xl:col-span-1"
                  />
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                  <AgentActivityChart
                    data={analyticsData?.agentActivity}
                    title="Agent Workload"
                    className="xl:col-span-1"
                  />
                  <ProjectTimelineChart
                    data={analyticsData?.timeline}
                    title="Project Timeline"
                    className="xl:col-span-1"
                  />
                </div>

                <KPIMetricsChart
                  data={kpiMetrics}
                  title="Key Performance Indicators"
                  className="w-full"
                />
              </>
            )}
          </TabsContent>

          <TabsContent value="custom" className="mt-6 px-6">
            <Card>
              <CardHeader>
                <CardTitle>Custom Dashboard</CardTitle>
                <CardDescription>
                  Build your own dashboard with drag-and-drop widgets
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <div className="mx-auto w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                    <PieChart className="w-12 h-12 text-slate-400" />
                  </div>
                  <p className="text-slate-500 mb-4">Custom dashboard builder coming soon</p>
                  <Badge variant="outline">Future Enhancement</Badge>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
