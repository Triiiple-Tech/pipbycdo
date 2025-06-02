import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { TemplateManager } from './TemplateManager';
import { PromptTemplate } from './PromptTemplatesDropdown';
import { TemplateApiService } from '@/services/templateApi';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useKPIMetrics } from '@/hooks/useKPIMetrics';
import { useAdminConfig } from '@/contexts/AdminConfigContext';
import AuditLogsPanel from './AuditLogsPanel';
import { auditLogger } from '../../services/auditLogger';
import { motion, AnimatePresence } from 'framer-motion';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import {
  Settings,
  Sparkles,
  BarChart3,
  Users,
  Database,
  Activity,
  TrendingUp,
  Clock,
  AlertCircle,
  CheckCircle,
  Loader2,
  RefreshCw,
  Download,
  Target,
  Zap,
  DollarSign,
  Star,
  Calendar,
  Save,
  RotateCcw,
  X,
} from 'lucide-react';

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

interface SystemStats {
  totalTemplates: number;
  customTemplates: number;
  activeUsers: number;
  totalUsage: number;
  recentUsage: number;
}

export function AdminPanel({ isOpen, onClose, className }: AdminPanelProps) {
  const [templates, setTemplates] = useState<PromptTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [systemStats, setSystemStats] = useState<SystemStats>({
    totalTemplates: 0,
    customTemplates: 0,
    activeUsers: 0,
    totalUsage: 0,
    recentUsage: 0,
  });
  const [refreshing, setRefreshing] = useState(false);

  // Analytics hooks
  const analytics = useAnalytics();
  const kpiMetrics = useKPIMetrics();
  
  // Admin configuration
  const { config, updateConfig, saveConfig, resetConfig, isLoading: configLoading, isDirty } = useAdminConfig();

  // Chart colors for consistent theming
  const chartColors = {
    primary: '#dc2626', // CDO red
    secondary: '#1e40af', // Blue
    success: '#16a34a', // Green
    warning: '#ca8a04', // Yellow
    danger: '#dc2626', // Red
    muted: '#64748b', // Gray
  };

  // Load templates and stats
  const loadData = async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true);
    try {
      setError(null);
      
      // Load templates (including admin templates)
      const templatesData = await TemplateApiService.getTemplates(true);
      setTemplates(templatesData);
      
      // Load system stats
      const analytics = await TemplateApiService.getTemplateAnalytics();
      setSystemStats({
        totalTemplates: templatesData.length,
        customTemplates: templatesData.filter(t => t.id.startsWith('custom-')).length,
        activeUsers: 15, // Placeholder
        totalUsage: analytics.totalUsage || 127,
        recentUsage: analytics.recentUsage || 23,
      });
      
    } catch (err) {
      console.error('Failed to load admin data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
      if (showRefreshing) setRefreshing(false);
    }
  };

  // Load data when panel opens
  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const handleTemplatesUpdate = (updatedTemplates: PromptTemplate[]) => {
    setTemplates(updatedTemplates);
    setSystemStats(prev => ({
      ...prev,
      totalTemplates: updatedTemplates.length,
      customTemplates: updatedTemplates.filter(t => t.id.startsWith('custom-')).length,
    }));
  };

  const handleRefresh = () => {
    loadData(true);
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className={cn(
          "fixed right-0 top-0 h-full w-full max-w-4xl bg-white dark:bg-slate-900 shadow-2xl",
          "border-l border-slate-200 dark:border-slate-700",
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-cdo-red/10 flex items-center justify-center">
              <Settings className="w-5 h-5 text-cdo-red" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                Admin Panel
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Manage templates and system settings
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
              className="text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
            >
              <RefreshCw className={cn("w-4 h-4", refreshing && "animate-spin")} />
              Refresh
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
            >
              Close
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Loading admin data...</span>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center max-w-md">
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">
                  Error Loading Data
                </h3>
                <p className="text-slate-600 dark:text-slate-400 mb-4">{error}</p>
                <Button onClick={handleRefresh} variant="outline">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
              </div>
            </div>
          ) : (
            <Tabs 
                defaultValue="overview" 
                className="h-full flex flex-col"
                onValueChange={(value) => {
                  const currentSessionId = localStorage.getItem("pipSessionId") || 'default-session';
                  auditLogger.logUserAction(
                    'admin_panel_tab_change',
                    `User navigated to ${value} tab in admin panel`,
                    currentSessionId
                  );
                }}
              >
              <div className="px-6 pt-6">
                <TabsList className="grid w-full grid-cols-7">
                  <TabsTrigger value="overview" className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4" />
                    Overview
                  </TabsTrigger>
                  <TabsTrigger value="templates" className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    Templates
                  </TabsTrigger>
                  <TabsTrigger value="analytics" className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    Analytics
                  </TabsTrigger>
                  <TabsTrigger value="auditLogs" className="flex items-center gap-2">
                    <Activity className="w-4 h-4" />
                    Audit Logs
                  </TabsTrigger>
                  <TabsTrigger value="usage" className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    Usage
                  </TabsTrigger>
                  <TabsTrigger value="config" className="flex items-center gap-2">
                    <Settings className="w-4 h-4" />
                    Config
                  </TabsTrigger>
                  <TabsTrigger value="exports" className="flex items-center gap-2">
                    <Download className="w-4 h-4" />
                    Exports
                  </TabsTrigger>
                </TabsList>
              </div>

              <div className="flex-1 overflow-hidden">
                <TabsContent value="overview" className="h-full m-0 p-6 space-y-6 overflow-y-auto">
                  {/* System Stats Cards */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-cdo-red" />
                          Templates
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{systemStats.totalTemplates}</div>
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                          {systemStats.customTemplates} custom
                        </p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                          <Users className="w-4 h-4 text-blue-500" />
                          Active Users
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{systemStats.activeUsers}</div>
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                          Last 24 hours
                        </p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                          <Activity className="w-4 h-4 text-green-500" />
                          Total Usage
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{systemStats.totalUsage}</div>
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                          Template uses
                        </p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                          <Clock className="w-4 h-4 text-purple-500" />
                          Recent
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{systemStats.recentUsage}</div>
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                          Last 7 days
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* System Status with Enhanced Monitoring */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Database className="w-5 h-5" />
                        System Status & Performance
                      </CardTitle>
                      <CardDescription>Real-time system health and monitoring</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-3">
                          <h4 className="text-sm font-medium">Core Services</h4>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">Template API</span>
                              <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Online
                              </Badge>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">Analytics Engine</span>
                              <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Active
                              </Badge>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">Database Connection</span>
                              <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Connected
                              </Badge>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">Template Sync</span>
                              <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Synced
                              </Badge>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <h4 className="text-sm font-medium">Performance Metrics</h4>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm">Response Time</span>
                              <span className="text-sm font-medium text-green-600">145ms</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm">Uptime</span>
                              <span className="text-sm font-medium text-green-600">99.8%</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm">Active Sessions</span>
                              <span className="text-sm font-medium">{systemStats.activeUsers}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm">Memory Usage</span>
                              <span className="text-sm font-medium">68%</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <Separator />

                      {/* Recent System Events */}
                      <div>
                        <h4 className="text-sm font-medium mb-2">Recent Events</h4>
                        <div className="space-y-1">
                          <div className="text-xs text-muted-foreground flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                            Template "Business Plan" updated successfully
                          </div>
                          <div className="text-xs text-muted-foreground flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                            Analytics data refreshed
                          </div>
                          <div className="text-xs text-muted-foreground flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                            New user session started
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="templates" className="h-full m-0 p-6 overflow-y-auto">
                  <TemplateManager
                    templates={templates}
                    onUpdateTemplates={handleTemplatesUpdate}
                    className="h-full"
                  />
                </TabsContent>

                <TabsContent value="analytics" className="h-full m-0 p-6 space-y-6 overflow-y-auto">
                  {/* Analytics Header */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold tracking-tight">Analytics Dashboard</h2>
                      <p className="text-muted-foreground">
                        Comprehensive system performance and usage analytics
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={analytics.refreshData}
                        disabled={analytics.isLoading}
                      >
                        <RefreshCw className={cn("w-4 h-4 mr-2", analytics.isLoading && "animate-spin")} />
                        Refresh
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => analytics.exportData({ fileName: 'admin-analytics', format: 'csv' })}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Export
                      </Button>
                    </div>
                  </div>

                  {analytics.error && (
                    <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 text-red-800 dark:text-red-400">
                          <AlertCircle className="w-4 h-4" />
                          <span className="text-sm font-medium">Error loading analytics data</span>
                        </div>
                        <p className="text-sm text-red-600 dark:text-red-300 mt-1">{analytics.error}</p>
                      </CardContent>
                    </Card>
                  )}

                  {/* KPI Overview Cards */}
                  {analytics.data && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <DollarSign className="w-4 h-4 text-green-500" />
                            Total Revenue
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">
                            ${analytics.data.quickStats.totalRevenue.toLocaleString()}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {analytics.data.quickStats.budgetUtilization}% budget utilization
                          </p>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <Target className="w-4 h-4 text-blue-500" />
                            Projects
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">{analytics.data.quickStats.activeProjects}</div>
                          <p className="text-xs text-muted-foreground">
                            {analytics.data.quickStats.completedProjects} completed this month
                          </p>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <Zap className="w-4 h-4 text-purple-500" />
                            Productivity
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">{analytics.data.quickStats.teamProductivity}%</div>
                          <p className="text-xs text-muted-foreground">
                            Team efficiency score
                          </p>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <Star className="w-4 h-4 text-yellow-500" />
                            Satisfaction
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">{analytics.data.quickStats.clientSatisfaction.toFixed(1)}</div>
                          <p className="text-xs text-muted-foreground">
                            Client satisfaction rating
                          </p>
                        </CardContent>
                      </Card>
                    </div>
                  )}

                  {/* Charts Row */}
                  {analytics.data && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Revenue Trend Chart */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="w-5 h-5" />
                            Revenue Trends
                          </CardTitle>
                          <CardDescription>Daily revenue over the last 30 days</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <ChartContainer
                            config={{
                              revenue: {
                                label: "Revenue",
                                color: chartColors.primary,
                              },
                            }}
                          >
                            <AreaChart data={analytics.data.trends.revenue}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis 
                                dataKey="date" 
                                tickFormatter={(value) => new Date(value).getDate().toString()}
                              />
                              <YAxis 
                                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                              />
                              <ChartTooltip
                                content={
                                  <ChartTooltipContent
                                    formatter={(value) => [`$${Number(value).toLocaleString()}`, "Revenue"]}
                                  />
                                }
                              />
                              <Area
                                type="monotone"
                                dataKey="value"
                                stroke={chartColors.primary}
                                fill={chartColors.primary}
                                fillOpacity={0.2}
                              />
                            </AreaChart>
                          </ChartContainer>
                        </CardContent>
                      </Card>

                      {/* Project Health Distribution */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Activity className="w-5 h-5" />
                            Project Health
                          </CardTitle>
                          <CardDescription>Distribution of project health status</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <ChartContainer
                            config={{
                              excellent: { label: "Excellent", color: chartColors.success },
                              good: { label: "Good", color: chartColors.secondary },
                              warning: { label: "Warning", color: chartColors.warning },
                              critical: { label: "Critical", color: chartColors.danger },
                            }}
                          >
                            <PieChart>
                              <Pie
                                data={[
                                  { name: 'Excellent', value: analytics.data.performance.projectHealth.excellent, fill: chartColors.success },
                                  { name: 'Good', value: analytics.data.performance.projectHealth.good, fill: chartColors.secondary },
                                  { name: 'Warning', value: analytics.data.performance.projectHealth.warning, fill: chartColors.warning },
                                  { name: 'Critical', value: analytics.data.performance.projectHealth.critical, fill: chartColors.danger },
                                ]}
                                cx="50%"
                                cy="50%"
                                innerRadius={40}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                              />
                              <ChartTooltip
                                content={
                                  <ChartTooltipContent
                                    formatter={(value, name) => [`${value}%`, name]}
                                  />
                                }
                              />
                            </PieChart>
                          </ChartContainer>
                        </CardContent>
                      </Card>
                    </div>
                  )}

                  {/* KPI Metrics and Recommendations */}
                  {kpiMetrics.metrics.length > 0 && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      <div className="lg:col-span-2">
                        <Card>
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                              <BarChart3 className="w-5 h-5" />
                              Key Performance Indicators
                            </CardTitle>
                            <CardDescription>
                              Track critical business metrics and performance indicators
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-6">
                            {kpiMetrics.metrics.map((metric) => (
                              <div key={metric.id} className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <div className={cn(
                                      "w-2 h-2 rounded-full",
                                      metric.status === 'excellent' && "bg-green-500",
                                      metric.status === 'good' && "bg-blue-500",
                                      metric.status === 'warning' && "bg-yellow-500",
                                      metric.status === 'critical' && "bg-red-500"
                                    )} />
                                    <span className="font-medium">{metric.name}</span>
                                    <Badge variant="outline" className="text-xs">
                                      {metric.category}
                                    </Badge>
                                  </div>
                                  <div className="text-right">
                                    <div className="font-bold">
                                      {metric.format === 'percentage' ? `${metric.currentValue}%` :
                                       metric.format === 'currency' ? `$${metric.currentValue.toLocaleString()}` :
                                       metric.format === 'decimal' ? metric.currentValue.toFixed(1) :
                                       metric.currentValue.toString()} 
                                      <span className="text-sm text-muted-foreground ml-1">{metric.unit}</span>
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      Target: {metric.format === 'percentage' ? `${metric.targetValue}%` :
                                              metric.format === 'currency' ? `$${metric.targetValue.toLocaleString()}` :
                                              metric.format === 'decimal' ? metric.targetValue.toFixed(1) :
                                              metric.targetValue.toString()}
                                    </div>
                                  </div>
                                </div>
                                <Progress 
                                  value={Math.min(100, (metric.currentValue / metric.targetValue) * 100)} 
                                  className="h-2"
                                />
                              </div>
                            ))}
                          </CardContent>
                        </Card>
                      </div>

                      {/* Performance Insights and Recommendations */}
                      <div className="space-y-6">
                        {kpiMetrics.analysis && (
                          <Card>
                            <CardHeader>
                              <CardTitle className="flex items-center gap-2">
                                <Target className="w-5 h-5" />
                                Performance Score
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="text-center">
                                <div className="text-3xl font-bold mb-2">
                                  {Math.round(kpiMetrics.analysis.overallScore)}%
                                </div>
                                <p className="text-sm text-muted-foreground mb-4">Overall Performance</p>
                                <Progress value={kpiMetrics.analysis.overallScore} className="h-3" />
                              </div>
                            </CardContent>
                          </Card>
                        )}

                        {kpiMetrics.analysis?.recommendations && kpiMetrics.analysis.recommendations.length > 0 && (
                          <Card>
                            <CardHeader>
                              <CardTitle className="flex items-center gap-2">
                                <Zap className="w-5 h-5" />
                                Recommendations
                              </CardTitle>
                              <CardDescription>Actionable insights to improve performance</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                              {kpiMetrics.analysis.recommendations.slice(0, 3).map((rec, index) => (
                                <div key={index} className="space-y-2">
                                  <div className="flex items-center gap-2">
                                    <Badge 
                                      variant={rec.priority === 'high' ? 'destructive' : rec.priority === 'medium' ? 'default' : 'secondary'}
                                      className="text-xs"
                                    >
                                      {rec.priority}
                                    </Badge>
                                    <span className="text-sm font-medium">{rec.metric}</span>
                                  </div>
                                  <p className="text-xs text-muted-foreground">{rec.action}</p>
                                  <p className="text-xs text-green-600 dark:text-green-400">{rec.impact}</p>
                                </div>
                              ))}
                            </CardContent>
                          </Card>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Performance Insights */}
                  {analytics.data && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      <Card>
                        <CardHeader>
                          <CardTitle>Budget Overview</CardTitle>
                          <CardDescription>Budget allocation and spending analysis</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>Allocated</span>
                              <span className="font-medium">${analytics.data.performance.budgetMetrics.allocated.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span>Spent</span>
                              <span className="font-medium">${analytics.data.performance.budgetMetrics.spent.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span>Remaining</span>
                              <span className="font-medium text-green-600">${analytics.data.performance.budgetMetrics.remaining.toLocaleString()}</span>
                            </div>
                            <Separator />
                            <div className="flex justify-between">
                              <span className="text-sm font-medium">Utilization</span>
                              <span className="text-lg font-bold">
                                {Math.round((analytics.data.performance.budgetMetrics.spent / analytics.data.performance.budgetMetrics.allocated) * 100)}%
                              </span>
                            </div>
                            <Progress 
                              value={(analytics.data.performance.budgetMetrics.spent / analytics.data.performance.budgetMetrics.allocated) * 100} 
                              className="h-2"
                            />
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle>Team Performance</CardTitle>
                          <CardDescription>Team efficiency and capacity metrics</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {Object.entries(analytics.data.performance.teamMetrics).map(([key, value]) => (
                            <div key={key} className="space-y-1">
                              <div className="flex justify-between text-sm">
                                <span className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                                <span className="font-medium">
                                  {key === 'satisfaction' ? `${value.toFixed(1)}/5` : `${value}%`}
                                </span>
                              </div>
                              <Progress 
                                value={key === 'satisfaction' ? (value / 5) * 100 : value} 
                                className="h-2"
                              />
                            </div>
                          ))}
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle>Resource Forecasting</CardTitle>
                          <CardDescription>Predicted resource needs and gaps</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {analytics.data.predictions.resourceNeeds.slice(0, 4).map((resource) => (
                            <div key={resource.skill} className="space-y-1">
                              <div className="flex justify-between text-sm">
                                <span className="font-medium">{resource.skill}</span>
                                <span className={cn(
                                  "text-xs font-medium",
                                  resource.gap > 0 ? "text-red-600" : "text-green-600"
                                )}>
                                  {resource.gap > 0 ? `+${resource.gap}` : resource.gap}
                                </span>
                              </div>
                              <div className="flex justify-between text-xs text-muted-foreground">
                                <span>Demand: {resource.demand}</span>
                                <span>Supply: {resource.supply}</span>
                              </div>
                              <Progress 
                                value={(resource.supply / resource.demand) * 100} 
                                className="h-1"
                              />
                            </div>
                          ))}
                        </CardContent>
                      </Card>
                    </div>
                  )}

                  {/* Future Predictions */}
                  {analytics.data && analytics.data.predictions.revenueForeccast.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <TrendingUp className="w-5 h-5" />
                          Revenue Forecast
                        </CardTitle>
                        <CardDescription>Projected revenue for the next 6 months</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ChartContainer
                          config={{
                            predicted: {
                              label: "Predicted Revenue",
                              color: chartColors.secondary,
                            },
                            confidence: {
                              label: "Confidence",
                              color: chartColors.muted,
                            },
                          }}
                        >
                          <BarChart data={analytics.data.predictions.revenueForeccast}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" />
                            <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
                            <ChartTooltip
                              content={
                                <ChartTooltipContent
                                  formatter={(value, name) => [
                                    name === 'predicted' 
                                      ? `$${Number(value).toLocaleString()}` 
                                      : `${Number(value).toFixed(1)}%`,
                                    name === 'predicted' ? 'Revenue' : 'Confidence'
                                  ]}
                                />
                              }
                            />
                            <Bar dataKey="predicted" fill={chartColors.secondary} />
                          </BarChart>
                        </ChartContainer>
                      </CardContent>
                    </Card>
                  )}

                  {/* Loading States */}
                  {(analytics.isLoading || kpiMetrics.isLoading) && (
                    <div className="flex items-center justify-center py-12">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Loading analytics data...</span>
                      </div>
                    </div>
                  )}

                  {/* Last Updated */}
                  {analytics.lastUpdated && (
                    <div className="flex items-center justify-center text-xs text-muted-foreground">
                      <Calendar className="w-3 h-3 mr-1" />
                      Last updated: {analytics.lastUpdated.toLocaleString()}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="auditLogs" className="h-full m-0 p-6 overflow-y-auto">
                  <AuditLogsPanel />
                </TabsContent>

                <TabsContent value="usage" className="h-full m-0 p-6 overflow-y-auto">
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-lg font-medium mb-2">Usage & Cost Tracking</h2>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
                        Monitor AI model usage, token consumption, and associated costs
                      </p>
                    </div>

                    {/* Cost Overview Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <DollarSign className="w-4 h-4 text-green-500" />
                            Total Cost (Month)
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">$127.50</div>
                          <p className="text-xs text-slate-600 dark:text-slate-400">
                            +12% from last month
                          </p>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <Activity className="w-4 h-4 text-blue-500" />
                            Total Tokens
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">1.2M</div>
                          <p className="text-xs text-slate-600 dark:text-slate-400">
                            850K input, 350K output
                          </p>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <Zap className="w-4 h-4 text-purple-500" />
                            API Calls
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">2,845</div>
                          <p className="text-xs text-slate-600 dark:text-slate-400">
                            Across all agents
                          </p>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <Target className="w-4 h-4 text-orange-500" />
                            Budget Status
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">68%</div>
                          <p className="text-xs text-slate-600 dark:text-slate-400">
                            $72.50 remaining
                          </p>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Cost Trend Chart */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="w-5 h-5" />
                            Daily Cost Trends
                          </CardTitle>
                          <CardDescription>Cost breakdown over the last 30 days</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <ChartContainer
                            config={{
                              cost: {
                                label: "Daily Cost",
                                color: chartColors.primary,
                              },
                            }}
                          >
                            <LineChart data={[
                              { date: '2024-01-01', cost: 2.50 },
                              { date: '2024-01-02', cost: 3.75 },
                              { date: '2024-01-03', cost: 4.20 },
                              { date: '2024-01-04', cost: 2.80 },
                              { date: '2024-01-05', cost: 5.10 },
                              { date: '2024-01-06', cost: 3.95 },
                              { date: '2024-01-07', cost: 6.25 },
                            ]}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis 
                                dataKey="date" 
                                tickFormatter={(value) => new Date(value).getDate().toString()}
                              />
                              <YAxis 
                                tickFormatter={(value) => `$${value}`}
                              />
                              <ChartTooltip
                                content={
                                  <ChartTooltipContent
                                    formatter={(value) => [`$${Number(value).toFixed(2)}`, "Cost"]}
                                  />
                                }
                              />
                              <Line
                                type="monotone"
                                dataKey="cost"
                                stroke={chartColors.primary}
                                strokeWidth={2}
                              />
                            </LineChart>
                          </ChartContainer>
                        </CardContent>
                      </Card>

                      {/* Agent Usage Distribution */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <BarChart3 className="w-5 h-5" />
                            Usage by Agent
                          </CardTitle>
                          <CardDescription>Cost distribution across agent types</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <ChartContainer
                            config={{
                              manager: { label: "Manager", color: chartColors.primary },
                              fileReader: { label: "File Reader", color: chartColors.secondary },
                              tradeMapper: { label: "Trade Mapper", color: chartColors.success },
                              estimator: { label: "Estimator", color: chartColors.warning },
                              qaValidator: { label: "QA Validator", color: chartColors.danger },
                              exporter: { label: "Exporter", color: chartColors.muted },
                            }}
                          >
                            <PieChart>
                              <Pie
                                data={[
                                  { name: 'Manager', value: 25, fill: chartColors.primary },
                                  { name: 'File Reader', value: 20, fill: chartColors.secondary },
                                  { name: 'Trade Mapper', value: 18, fill: chartColors.success },
                                  { name: 'Estimator', value: 15, fill: chartColors.warning },
                                  { name: 'QA Validator', value: 12, fill: chartColors.danger },
                                  { name: 'Exporter', value: 10, fill: chartColors.muted },
                                ]}
                                cx="50%"
                                cy="50%"
                                innerRadius={40}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                              />
                              <ChartTooltip
                                content={
                                  <ChartTooltipContent
                                    formatter={(value, name) => [`${value}%`, name]}
                                  />
                                }
                              />
                            </PieChart>
                          </ChartContainer>
                        </CardContent>
                      </Card>
                    </div>

                  {/* Model Usage Breakdown */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Database className="w-5 h-5" />
                        Model Usage & Costs
                      </CardTitle>
                      <CardDescription>Detailed breakdown by AI model</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {[
                          { model: 'GPT-4', calls: 1250, tokens: '680K', cost: '$52.40', percentage: 41 },
                          { model: 'GPT-4-Turbo', calls: 890, tokens: '320K', cost: '$28.70', percentage: 23 },
                          { model: 'Claude-3-Opus', calls: 520, tokens: '180K', cost: '$24.60', percentage: 19 },
                          { model: 'GPT-3.5-Turbo', calls: 185, tokens: '45K', cost: '$21.80', percentage: 17 },
                        ].map((model) => (
                          <div key={model.model} className="space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <span className="font-medium">{model.model}</span>
                                <Badge variant="outline" className="text-xs">
                                  {model.calls} calls
                                </Badge>
                              </div>
                              <div className="text-right">
                                <div className="font-bold">{model.cost}</div>
                                <div className="text-xs text-muted-foreground">{model.tokens} tokens</div>
                              </div>
                            </div>
                            <Progress value={model.percentage} className="h-2" />
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Budget Monitoring */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Target className="w-5 h-5" />
                        Budget Monitoring
                      </CardTitle>
                      <CardDescription>Track spending against monthly budgets</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Monthly Budget</span>
                            <span className="font-medium">$200.00</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Spent</span>
                            <span className="font-medium">$127.50</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Remaining</span>
                            <span className="font-medium text-green-600">$72.50</span>
                          </div>
                          <Progress value={68} className="h-3" />
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Projected Monthly</span>
                            <span className="font-medium">$185.20</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Current Rate</span>
                            <span className="font-medium">$4.25/day</span>
                          </div>
                          <div className="text-xs text-orange-600">
                            ⚠️ On track to exceed budget by $15
                          </div>
                          <Progress value={92} className="h-3" />
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Cost Efficiency</span>
                            <span className="font-medium">94%</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>vs Last Month</span>
                            <span className="font-medium text-green-600">+8%</span>
                          </div>
                          <div className="text-xs text-green-600">
                            ✓ Improving efficiency
                          </div>
                          <Progress value={94} className="h-3" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Export Options */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Download className="w-5 h-5" />
                        Export Usage Data
                      </CardTitle>
                      <CardDescription>Download detailed usage reports</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        <Button size="sm" variant="outline">
                          <Download className="w-4 h-4 mr-2" />
                          CSV Report
                        </Button>
                        <Button size="sm" variant="outline">
                          <Download className="w-4 h-4 mr-2" />
                          JSON Data
                        </Button>
                        <Button size="sm" variant="outline">
                          <Download className="w-4 h-4 mr-2" />
                          PDF Summary
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                  </div>
                </TabsContent>

                <TabsContent value="config" className="h-full m-0 p-6 overflow-y-auto">
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-lg font-medium mb-4">System Configuration</h2>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
                        Manage system settings, agent configurations, and feature toggles
                      </p>
                    </div>

                    {/* Cost Tracking Configuration */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <DollarSign className="w-5 h-5" />
                          Cost Tracking
                        </CardTitle>
                        <CardDescription>
                          Control visibility of model costs and token usage in chat messages
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <label className="text-sm font-medium">Show Cost per Message (Admin Only)</label>
                            <p className="text-xs text-slate-600 dark:text-slate-400">
                              Display estimated model/token cost on agent messages for administrators
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input 
                              type="checkbox" 
                              id="showCosts" 
                              className="rounded border-gray-300 text-cdo-red focus:ring-cdo-red"
                              checked={config.costDisplay.enabled}
                              onChange={(e) => updateConfig({
                                costDisplay: { ...config.costDisplay, enabled: e.target.checked }
                              })}
                            />
                            <label htmlFor="showCosts" className="text-sm">Enable</label>
                          </div>
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between">
                          <div>
                            <label className="text-sm font-medium">Default Cost Display Format</label>
                            <p className="text-xs text-slate-600 dark:text-slate-400">
                              Choose how costs are displayed in the UI
                            </p>
                          </div>
                          <select 
                            className="border rounded px-3 py-1 text-sm"
                            value={config.costDisplay.format}
                            onChange={(e) => updateConfig({
                              costDisplay: { ...config.costDisplay, format: e.target.value as 'currency' | 'tokens' | 'both' }
                            })}
                          >
                            <option value="currency">Currency ($0.003)</option>
                            <option value="tokens">Tokens (1,250)</option>
                            <option value="both">Both ($0.003 / 1,250 tokens)</option>
                          </select>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Agent/Model Assignment */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Settings className="w-5 h-5" />
                          Agent/Model Assignment
                        </CardTitle>
                        <CardDescription>
                          Configure which AI models are used by each agent type
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {[
                          { label: 'Manager Agent', key: 'manager' },
                          { label: 'File Reader', key: 'rfi' },
                          { label: 'Trade Mapper', key: 'assistant' },
                          { label: 'Estimator', key: 'estimator' },
                          { label: 'QA Validator', key: 'validator' },
                          { label: 'Exporter', key: 'exporter' },
                        ].map(({ label, key }) => (
                          <div key={key} className="flex items-center justify-between">
                            <div>
                              <span className="text-sm font-medium">{label}</span>
                              <p className="text-xs text-slate-600 dark:text-slate-400">
                                Currently using {config.agentModelAssignments[key]}
                              </p>
                            </div>
                            <select
                              className="border rounded px-3 py-1 text-sm"
                              value={config.agentModelAssignments[key]}
                              onChange={(e) =>
                                updateConfig({
                                  agentModelAssignments: {
                                    ...config.agentModelAssignments,
                                    [key]: e.target.value,
                                  },
                                })
                              }
                            >
                              <option value="gpt-4">GPT-4</option>
                              <option value="gpt-4-turbo">GPT-4-Turbo</option>
                              <option value="gpt-3.5-turbo">GPT-3.5-Turbo</option>
                              <option value="claude-3">Claude-3</option>
                              <option value="claude-3-opus">Claude-3-Opus</option>
                              <option value="gemini-pro">Gemini-Pro</option>
                            </select>
                          </div>
                        ))}
                      </CardContent>
                    </Card>

                    {/* Smartsheet Integration */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Database className="w-5 h-5" />
                          Smartsheet Integration
                        </CardTitle>
                        <CardDescription>
                          Manage Smartsheet authentication and connection settings
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-sm font-medium">Connection Status</span>
                            <p className="text-xs text-slate-600 dark:text-slate-400">
                              Current authentication state
                            </p>
                          </div>
                          <Badge variant="secondary" className={`${config.smartsheetIntegration.connected ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'}`}>
                            {config.smartsheetIntegration.connected ? (<><CheckCircle className="w-3 h-3 mr-1" />Connected</>) : (<><X className="w-3 h-3 mr-1" />Disconnected</>)}
                          </Badge>
                        </div>
                        <Separator />
                        <div className="space-y-2">
                          <label className="text-sm font-medium">API Token</label>
                          <div className="flex gap-2">
                            <input
                              type="password"
                              placeholder="Enter Smartsheet API token..."
                              className="flex-1 border rounded px-3 py-2 text-sm"
                              value={config.smartsheetIntegration.apiToken}
                              onChange={(e) =>
                                updateConfig({
                                  smartsheetIntegration: {
                                    ...config.smartsheetIntegration,
                                    apiToken: e.target.value,
                                  },
                                })
                              }
                            />
                            <Button size="sm" variant="outline" onClick={saveConfig} disabled={configLoading}>
                              Update
                            </Button>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-sm font-medium">Auto-sync Enabled</span>
                            <p className="text-xs text-slate-600 dark:text-slate-400">
                              Automatically sync data with Smartsheet
                            </p>
                          </div>
                          <input
                            type="checkbox"
                            className="rounded border-gray-300 text-cdo-red focus:ring-cdo-red"
                            checked={config.smartsheetIntegration.autoExport}
                            onChange={(e) =>
                              updateConfig({
                                smartsheetIntegration: {
                                  ...config.smartsheetIntegration,
                                  autoExport: e.target.checked,
                                },
                              })
                            }
                          />
                        </div>
                      </CardContent>
                    </Card>

                    {/* Feature Flags */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Zap className="w-5 h-5" />
                          Feature Flags
                        </CardTitle>
                        <CardDescription>
                          Enable or disable experimental features and A/B test configurations
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {[
                          { key: 'enhancedAgentRouting', feature: 'Enhanced Agent Routing', description: 'Use improved agent selection algorithm' },
                          { key: 'realTimeCollaboration', feature: 'Real-time Collaboration', description: 'Enable multi-user chat sessions' },
                          { key: 'advancedAnalytics', feature: 'Advanced Analytics', description: 'Enable advanced analytics dashboards' },
                          { key: 'betaFeatures', feature: 'Beta UI Components', description: 'Show experimental UI improvements' },
                          { key: 'costOptimization', feature: 'Cost Optimization', description: 'Enable cost optimization suggestions' },
                          { key: 'multiLanguageSupport', feature: 'Multi-Language Support', description: 'Support chat in multiple languages' },
                        ].map(({ key, feature, description }) => (
                          <div key={key} className="flex items-center justify-between">
                            <div>
                              <span className="text-sm font-medium">{feature}</span>
                              <p className="text-xs text-slate-600 dark:text-slate-400">{description}</p>
                            </div>
                            <input
                              type="checkbox"
                              className="rounded border-gray-300 text-cdo-red focus:ring-cdo-red"
                              checked={config.featureFlags[key]}
                              onChange={(e) =>
                                updateConfig({
                                  featureFlags: {
                                    ...config.featureFlags,
                                    [key]: e.target.checked,
                                  },
                                })
                              }
                            />
                          </div>
                        ))}
                      </CardContent>
                    </Card>

                    {/* Save Configuration */}
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={resetConfig} disabled={!isDirty || configLoading}>
                        Reset to Defaults
                      </Button>
                      <Button className="bg-cdo-red hover:bg-cdo-red/90" onClick={saveConfig} disabled={!isDirty || configLoading}>
                        {configLoading ? 'Saving...' : 'Save Configuration'}
                      </Button>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="exports" className="h-full m-0 p-6 overflow-y-auto">
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-lg font-medium mb-2">Exports & Data Portability</h2>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
                        Export chat conversations, audit logs, and system data in various formats
                      </p>
                    </div>

                    {/* Chat Export Options */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Download className="w-5 h-5" />
                          Chat Export
                        </CardTitle>
                        <CardDescription>
                          Export chat conversations with formatting and metadata
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        {/* Export Format Selection */}
                        <div className="space-y-3">
                          <label className="text-sm font-medium">Export Format</label>
                          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                            {[
                              { format: 'markdown', label: 'Markdown', description: 'Human-readable text format', icon: '📝' },
                              { format: 'pdf', label: 'PDF', description: 'Professional document format', icon: '📄' },
                              { format: 'json', label: 'JSON', description: 'Structured data format', icon: '🔧' },
                              { format: 'html', label: 'HTML', description: 'Web-friendly format', icon: '🌐' },
                            ].map((option) => (
                              <label key={option.format} className="flex items-center space-x-2 p-3 border rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800">
                                <input type="radio" name="exportFormat" value={option.format} defaultChecked={option.format === 'markdown'} />
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <span>{option.icon}</span>
                                    <span className="font-medium text-sm">{option.label}</span>
                                  </div>
                                  <p className="text-xs text-slate-600 dark:text-slate-400">{option.description}</p>
                                </div>
                              </label>
                            ))}
                          </div>
                        </div>

                        <Separator />

                        {/* Date Range Selection */}
                        <div className="space-y-3">
                          <label className="text-sm font-medium">Date Range</label>
                          <div className="flex items-center gap-2">
                            <input 
                              type="date" 
                              className="border rounded px-3 py-2 text-sm"
                              defaultValue="2024-01-01"
                            />
                            <span className="text-sm text-slate-500">to</span>
                            <input 
                              type="date" 
                              className="border rounded px-3 py-2 text-sm"
                              defaultValue={new Date().toISOString().split('T')[0]}
                            />
                            <Button size="sm" variant="outline" className="ml-2">
                              Last 30 Days
                            </Button>
                            <Button size="sm" variant="outline">
                              All Time
                            </Button>
                          </div>
                        </div>

                        <Separator />

                        {/* Content Selection */}
                        <div className="space-y-3">
                          <label className="text-sm font-medium">Include in Export</label>
                          <div className="space-y-2">
                            {[
                              { id: 'messages', label: 'Chat Messages', description: 'User and agent messages', checked: true },
                              { id: 'metadata', label: 'Message Metadata', description: 'Timestamps, agents, models used', checked: true },
                              { id: 'files', label: 'File Attachments', description: 'Uploaded files and documents', checked: false },
                              { id: 'costs', label: 'Cost Information', description: 'Token usage and estimated costs', checked: false },
                              { id: 'system', label: 'System Messages', description: 'Agent routing and system notifications', checked: false },
                            ].map((option) => (
                              <label key={option.id} className="flex items-center space-x-3">
                                <input 
                                  type="checkbox" 
                                  defaultChecked={option.checked}
                                  className="rounded border-gray-300 text-cdo-red focus:ring-cdo-red"
                                />
                                <div>
                                  <span className="text-sm font-medium">{option.label}</span>
                                  <p className="text-xs text-slate-600 dark:text-slate-400">{option.description}</p>
                                </div>
                              </label>
                            ))}
                          </div>
                        </div>

                        <Separator />

                        {/* Delivery Method */}
                        <div className="space-y-3">
                          <label className="text-sm font-medium">Delivery Method</label>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {[
                              { method: 'download', label: 'Direct Download', description: 'Download file immediately', icon: '💾' },
                              { method: 'email', label: 'Email Delivery', description: 'Send to specified email address', icon: '📧' },
                              { method: 'smartsheet', label: 'Export to Smartsheet', description: 'Create new Smartsheet with data', icon: '📊' },
                              { method: 'cloud', label: 'Cloud Storage', description: 'Save to connected cloud service', icon: '☁️' },
                            ].map((option) => (
                              <label key={option.method} className="flex items-center space-x-2 p-3 border rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800">
                                <input type="radio" name="deliveryMethod" value={option.method} defaultChecked={option.method === 'download'} />
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <span>{option.icon}</span>
                                    <span className="font-medium text-sm">{option.label}</span>
                                  </div>
                                  <p className="text-xs text-slate-600 dark:text-slate-400">{option.description}</p>
                                </div>
                              </label>
                            ))}
                          </div>
                        </div>

                        {/* Email Delivery Options (conditional) */}
                        <div className="space-y-3 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                          <label className="text-sm font-medium">Email Address (Optional)</label>
                          <input 
                            type="email" 
                            placeholder="recipient@example.com"
                            className="w-full border rounded px-3 py-2 text-sm"
                          />
                          <p className="text-xs text-slate-600 dark:text-slate-400">
                            Leave blank to send to your account email
                          </p>
                        </div>

                        {/* Export Actions */}
                        <div className="flex items-center justify-between pt-4">
                          <div className="text-sm text-slate-600 dark:text-slate-400">
                            Estimated file size: ~2.5 MB
                          </div>
                          <div className="flex gap-2">
                            <Button variant="outline">
                              Preview Export
                            </Button>
                            <Button className="bg-cdo-red hover:bg-cdo-red/90">
                              <Download className="w-4 h-4 mr-2" />
                              Start Export
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* System Data Export */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Database className="w-5 h-5" />
                          System Data Export
                        </CardTitle>
                        <CardDescription>
                          Export audit logs, usage data, and system configurations
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {[
                            { 
                              type: 'audit-logs', 
                              title: 'Audit Logs', 
                              description: 'Complete audit trail with user actions',
                              size: '~150 KB',
                              records: '2,840 entries'
                            },
                            { 
                              type: 'usage-data', 
                              title: 'Usage Analytics', 
                              description: 'Model usage, costs, and performance metrics',
                              size: '~85 KB',
                              records: '30 days of data'
                            },
                            { 
                              type: 'templates', 
                              title: 'Template Library', 
                              description: 'All prompt templates and configurations',
                              size: '~45 KB',
                              records: '23 templates'
                            },
                            { 
                              type: 'system-config', 
                              title: 'System Configuration', 
                              description: 'Agent settings, feature flags, and preferences',
                              size: '~12 KB',
                              records: 'Current settings'
                            },
                          ].map((item) => (
                            <div key={item.type} className="p-4 border rounded-lg space-y-3">
                              <div>
                                <h4 className="font-medium">{item.title}</h4>
                                <p className="text-sm text-slate-600 dark:text-slate-400">{item.description}</p>
                              </div>
                              <div className="flex items-center justify-between text-xs text-slate-500">
                                <span>{item.records}</span>
                                <span>{item.size}</span>
                              </div>
                              <div className="flex gap-2">
                                <Button size="sm" variant="outline" className="flex-1">
                                  <Download className="w-3 h-3 mr-1" />
                                  JSON
                                </Button>
                                <Button size="sm" variant="outline" className="flex-1">
                                  <Download className="w-3 h-3 mr-1" />
                                  CSV
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Recent Exports */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Clock className="w-5 h-5" />
                          Recent Exports
                        </CardTitle>
                        <CardDescription>
                          View and re-download recent export files
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {[
                            {
                              file: 'chat_export_2024-01-15.pdf',
                              type: 'Chat Export',
                              date: '2024-01-15 14:30',
                              size: '2.8 MB',
                              status: 'completed'
                            },
                            {
                              file: 'audit_logs_2024-01-10.csv',
                              type: 'Audit Logs',
                              date: '2024-01-10 09:15',
                              size: '156 KB',
                              status: 'completed'
                            },
                            {
                              file: 'usage_analytics_2024-01-05.json',
                              type: 'Usage Data',
                              date: '2024-01-05 16:45',
                              size: '89 KB',
                              status: 'completed'
                            },
                          ].map((export_item, index) => (
                            <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded bg-cdo-red/10 flex items-center justify-center">
                                  <Download className="w-4 h-4 text-cdo-red" />
                                </div>
                                <div>
                                  <div className="font-medium text-sm">{export_item.file}</div>
                                  <div className="text-xs text-slate-600 dark:text-slate-400">
                                    {export_item.type} • {export_item.date} • {export_item.size}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge 
                                  variant="secondary" 
                                  className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                                >
                                  {export_item.status}
                                </Badge>
                                <Button size="sm" variant="ghost">
                                  <Download className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
              </div>
            </Tabs>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
