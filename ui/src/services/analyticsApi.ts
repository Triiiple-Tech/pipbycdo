/**
 * Analytics API Service Layer
 * Handles all analytics-related API communications for Section IV
 */

import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Types for API responses
export interface AnalyticsData {
  projects: ProjectMetrics[];
  agents: AgentMetrics[];
  kpis: KPIMetrics[];
  realTimeData: RealTimeMetrics;
  timestamp: string;
}

export interface ProjectMetrics {
  id: string;
  name: string;
  status: 'active' | 'planning' | 'completed' | 'on_hold';
  progress: number;
  budget: {
    total: number;
    spent: number;
    remaining: number;
    burnRate: number;
  };
  timeline: {
    startDate: string;
    endDate: string;
    daysRemaining: number;
    milestones: Milestone[];
  };
  team: {
    size: number;
    roles: string[];
    utilization: number;
  };
  health: {
    score: number;
    factors: HealthFactor[];
    risks: Risk[];
  };
  createdAt: string;
  updatedAt: string;
}

export interface AgentMetrics {
  id: string;
  name: string;
  type: 'manager' | 'file-reader' | 'trade-mapper' | 'scope' | 'takeoff' | 'estimator' | 'qa-validator' | 'exporter';
  status: 'active' | 'idle' | 'error' | 'processing';
  performance: {
    tasksCompleted: number;
    successRate: number;
    averageProcessingTime: number;
    errorRate: number;
  };
  resources: {
    tokensUsed: number;
    modelCalls: number;
    costPerTask: number;
    efficiency: number;
  };
  currentTask?: {
    id: string;
    description: string;
    startTime: string;
    estimatedCompletion: string;
  };
}

export interface KPIMetrics {
  category: 'project' | 'agent' | 'system' | 'financial';
  metrics: {
    name: string;
    value: number;
    unit: string;
    target?: number;
    trend: 'up' | 'down' | 'stable';
    trendPercentage: number;
    description: string;
  }[];
  period: {
    start: string;
    end: string;
    type: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  };
}

export interface RealTimeMetrics {
  activeUsers: number;
  activeProjects: number;
  systemLoad: number;
  apiResponseTime: number;
  tasksInProgress: number;
  alerts: Alert[];
  lastUpdated: string;
}

export interface Milestone {
  id: string;
  name: string;
  dueDate: string;
  status: 'pending' | 'in_progress' | 'completed' | 'overdue';
  completion: number;
}

export interface HealthFactor {
  name: string;
  score: number;
  weight: number;
  description: string;
}

export interface Risk {
  id: string;
  type: 'schedule' | 'budget' | 'quality' | 'resource';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  probability: number;
  impact: number;
  mitigation?: string;
}

export interface Alert {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  timestamp: string;
  acknowledged: boolean;
  projectId?: string;
  agentId?: string;
}

export interface ExportRequest {
  format: 'pdf' | 'excel' | 'csv' | 'png' | 'json';
  data: 'dashboard' | 'projects' | 'agents' | 'kpis' | 'custom';
  filters?: {
    dateRange?: {
      start: string;
      end: string;
    };
    projectIds?: string[];
    agentTypes?: string[];
    metrics?: string[];
  };
  options?: {
    includeCharts?: boolean;
    compression?: boolean;
    templateId?: string;
  };
}

export interface ExportResponse {
  jobId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  downloadUrl?: string;
  error?: string;
  estimatedCompletion?: string;
}

// API Service Class
class AnalyticsApiService {
  private axiosInstance;

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: `${API_BASE_URL}/api/analytics`,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Code': 'hermes', // Internal auth header
      },
    });

    // Request interceptor for auth
    this.axiosInstance.interceptors.request.use((config) => {
      // Add any additional auth headers here
      return config;
    });

    // Response interceptor for error handling
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error('Analytics API Error:', error);
        throw this.handleApiError(error);
      }
    );
  }

  private handleApiError(error: any) {
    if (error.response) {
      // Server responded with error status
      return new Error(`API Error: ${error.response.data?.message || error.response.statusText}`);
    } else if (error.request) {
      // Request made but no response received
      return new Error('Network Error: Unable to reach analytics service');
    } else {
      // Something else happened
      return new Error(`Request Error: ${error.message}`);
    }
  }

  // Dashboard Data
  async getDashboardData(
    filters?: {
      dateRange?: { start: string; end: string };
      projectIds?: string[];
    }
  ): Promise<AnalyticsData> {
    const response = await this.axiosInstance.get('/dashboard', {
      params: filters,
    });
    return response.data;
  }

  // Project Analytics
  async getProjectMetrics(projectId?: string): Promise<ProjectMetrics[]> {
    const url = projectId ? `/projects/${projectId}` : '/projects';
    const response = await this.axiosInstance.get(url);
    return response.data;
  }

  async getProjectHealthScore(projectId: string): Promise<{
    score: number;
    factors: HealthFactor[];
    recommendations: string[];
  }> {
    const response = await this.axiosInstance.get(`/projects/${projectId}/health`);
    return response.data;
  }

  // Agent Analytics
  async getAgentMetrics(agentType?: string): Promise<AgentMetrics[]> {
    const response = await this.axiosInstance.get('/agents', {
      params: { type: agentType },
    });
    return response.data;
  }

  async getAgentPerformance(
    agentId: string,
    period?: { start: string; end: string }
  ): Promise<{
    performance: AgentMetrics['performance'];
    timeline: Array<{ date: string; metrics: any }>;
  }> {
    const response = await this.axiosInstance.get(`/agents/${agentId}/performance`, {
      params: period,
    });
    return response.data;
  }

  // KPI Analytics
  async getKPIMetrics(
    category?: 'project' | 'agent' | 'system' | 'financial',
    period?: { start: string; end: string; type: 'daily' | 'weekly' | 'monthly' }
  ): Promise<KPIMetrics[]> {
    const response = await this.axiosInstance.get('/kpis', {
      params: { category, ...period },
    });
    return response.data;
  }

  async getKPITrends(
    metricNames: string[],
    period: { start: string; end: string }
  ): Promise<{
    [metricName: string]: Array<{ date: string; value: number }>;
  }> {
    const response = await this.axiosInstance.post('/kpis/trends', {
      metrics: metricNames,
      period,
    });
    return response.data;
  }

  // Real-time Data
  async getRealTimeMetrics(): Promise<RealTimeMetrics> {
    const response = await this.axiosInstance.get('/realtime');
    return response.data;
  }

  // System Health
  async getSystemHealth(): Promise<{
    status: 'healthy' | 'warning' | 'critical';
    services: Array<{
      name: string;
      status: 'up' | 'down' | 'degraded';
      responseTime: number;
      lastCheck: string;
    }>;
    alerts: Alert[];
  }> {
    const response = await this.axiosInstance.get('/system/health');
    return response.data;
  }

  // Data Export
  async createExport(request: ExportRequest): Promise<ExportResponse> {
    const response = await this.axiosInstance.post('/exports', request);
    return response.data;
  }

  async getExportStatus(jobId: string): Promise<ExportResponse> {
    const response = await this.axiosInstance.get(`/exports/${jobId}/status`);
    return response.data;
  }

  async downloadExport(jobId: string): Promise<Blob> {
    const response = await this.axiosInstance.get(`/exports/${jobId}/download`, {
      responseType: 'blob',
    });
    return response.data;
  }

  // Alerts Management
  async getAlerts(filters?: {
    type?: 'info' | 'warning' | 'error' | 'success';
    acknowledged?: boolean;
    projectId?: string;
  }): Promise<Alert[]> {
    const response = await this.axiosInstance.get('/alerts', {
      params: filters,
    });
    return response.data;
  }

  async acknowledgeAlert(alertId: string): Promise<void> {
    await this.axiosInstance.patch(`/alerts/${alertId}/acknowledge`);
  }

  async dismissAlert(alertId: string): Promise<void> {
    await this.axiosInstance.delete(`/alerts/${alertId}`);
  }

  // Time Series Data
  async getTimeSeriesData(
    metric: string,
    period: { start: string; end: string },
    granularity: 'hour' | 'day' | 'week' | 'month' = 'day'
  ): Promise<Array<{ timestamp: string; value: number; metadata?: any }>> {
    const response = await this.axiosInstance.get('/timeseries', {
      params: { metric, granularity, ...period },
    });
    return response.data;
  }

  // Budget Analytics
  async getBudgetAnalytics(
    projectId?: string,
    period?: { start: string; end: string }
  ): Promise<{
    totalBudget: number;
    totalSpent: number;
    burnRate: number;
    forecast: Array<{ date: string; projected: number; actual?: number }>;
    categories: Array<{ name: string; budgeted: number; spent: number }>;
    alerts: Array<{ type: string; message: string; severity: string }>;
  }> {
    const response = await this.axiosInstance.get('/budget', {
      params: { projectId, ...period },
    });
    return response.data;
  }

  // Resource Utilization
  async getResourceUtilization(
    period?: { start: string; end: string }
  ): Promise<{
    team: {
      totalMembers: number;
      activeMembers: number;
      utilization: number;
      productivity: number;
    };
    system: {
      cpuUsage: number;
      memoryUsage: number;
      storageUsage: number;
      apiCalls: number;
    };
    costs: {
      totalCost: number;
      costPerProject: number;
      costPerTask: number;
      efficiency: number;
    };
  }> {
    const response = await this.axiosInstance.get('/resources', {
      params: period,
    });
    return response.data;
  }
}

// Create singleton instance
export const analyticsApi = new AnalyticsApiService();

// Export default service
export default analyticsApi;
