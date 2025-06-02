import { useState, useEffect, useCallback, useMemo } from 'react';
import { DateRange } from '../Filters/DateRangeFilter';

export interface AnalyticsFilters {
  dateRange: DateRange;
  selectedProjects: string[];
  selectedMetrics: string[];
  department?: string;
  status?: string[];
  priority?: string[];
}

export interface AnalyticsData {
  quickStats: {
    totalProjects: number;
    activeProjects: number;
    completedProjects: number;
    totalRevenue: number;
    budgetUtilization: number;
    teamProductivity: number;
    clientSatisfaction: number;
    overallHealth: number;
  };
  trends: {
    revenue: Array<{ date: string; value: number; change: number }>;
    projects: Array<{ date: string; active: number; completed: number }>;
    productivity: Array<{ date: string; value: number; target: number }>;
    satisfaction: Array<{ date: string; value: number; benchmark: number }>;
  };
  performance: {
    projectHealth: {
      excellent: number;
      good: number;
      warning: number;
      critical: number;
    };
    budgetMetrics: {
      allocated: number;
      spent: number;
      remaining: number;
      forecasted: number;
    };
    teamMetrics: {
      utilization: number;
      efficiency: number;
      capacity: number;
      satisfaction: number;
    };
  };
  predictions: {
    revenueForeccast: Array<{ month: string; predicted: number; confidence: number }>;
    projectCompletion: Array<{ project: string; probability: number; riskFactors: string[] }>;
    resourceNeeds: Array<{ skill: string; demand: number; supply: number; gap: number }>;
  };
}

export interface UseAnalyticsReturn {
  data: AnalyticsData | null;
  filters: AnalyticsFilters;
  isLoading: boolean;
  error: string | null;
  updateFilters: (newFilters: Partial<AnalyticsFilters>) => void;
  refreshData: () => Promise<void>;
  exportData: (options: any) => Promise<void>;
  lastUpdated: Date | null;
}

// Mock data generator
const generateMockData = (filters: AnalyticsFilters): AnalyticsData => {
  const now = new Date();
  const mockTrends = Array.from({ length: 30 }, (_, i) => {
    const date = new Date(now);
    date.setDate(date.getDate() - (29 - i));
    return date.toISOString().split('T')[0];
  });

  return {
    quickStats: {
      totalProjects: 24 + Math.floor(Math.random() * 10),
      activeProjects: 12 + Math.floor(Math.random() * 5),
      completedProjects: 8 + Math.floor(Math.random() * 3),
      totalRevenue: 2450000 + Math.floor(Math.random() * 500000),
      budgetUtilization: 72 + Math.floor(Math.random() * 15),
      teamProductivity: 85 + Math.floor(Math.random() * 10),
      clientSatisfaction: 4.3 + Math.random() * 0.4,
      overallHealth: 78 + Math.floor(Math.random() * 15)
    },
    trends: {
      revenue: mockTrends.map(date => ({
        date,
        value: 80000 + Math.floor(Math.random() * 40000),
        change: -5 + Math.random() * 10
      })),
      projects: mockTrends.map(date => ({
        date,
        active: 10 + Math.floor(Math.random() * 8),
        completed: Math.floor(Math.random() * 3)
      })),
      productivity: mockTrends.map(date => ({
        date,
        value: 70 + Math.random() * 25,
        target: 85
      })),
      satisfaction: mockTrends.map(date => ({
        date,
        value: 3.8 + Math.random() * 1.2,
        benchmark: 4.2
      }))
    },
    performance: {
      projectHealth: {
        excellent: 35 + Math.floor(Math.random() * 15),
        good: 40 + Math.floor(Math.random() * 10),
        warning: 15 + Math.floor(Math.random() * 10),
        critical: 5 + Math.floor(Math.random() * 5)
      },
      budgetMetrics: {
        allocated: 3200000,
        spent: 2300000 + Math.floor(Math.random() * 200000),
        remaining: 900000 - Math.floor(Math.random() * 200000),
        forecasted: 3100000 + Math.floor(Math.random() * 300000)
      },
      teamMetrics: {
        utilization: 78 + Math.floor(Math.random() * 15),
        efficiency: 85 + Math.floor(Math.random() * 10),
        capacity: 92 + Math.floor(Math.random() * 8),
        satisfaction: 4.1 + Math.random() * 0.6
      }
    },
    predictions: {
      revenueForeccast: Array.from({ length: 6 }, (_, i) => {
        const month = new Date();
        month.setMonth(month.getMonth() + i);
        return {
          month: month.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          predicted: 400000 + Math.floor(Math.random() * 200000),
          confidence: 70 + Math.random() * 25
        };
      }),
      projectCompletion: [
        {
          project: 'E-commerce Platform',
          probability: 85 + Math.random() * 10,
          riskFactors: ['Resource availability', 'Technical complexity']
        },
        {
          project: 'AI Integration',
          probability: 70 + Math.random() * 15,
          riskFactors: ['Budget constraints', 'Timeline pressure']
        },
        {
          project: 'Mobile App',
          probability: 90 + Math.random() * 8,
          riskFactors: ['Stakeholder approval']
        }
      ],
      resourceNeeds: [
        { skill: 'Frontend Development', demand: 120, supply: 100, gap: 20 },
        { skill: 'Backend Development', demand: 80, supply: 90, gap: -10 },
        { skill: 'UI/UX Design', demand: 60, supply: 45, gap: 15 },
        { skill: 'Data Analysis', demand: 40, supply: 35, gap: 5 }
      ]
    }
  };
};

export const useAnalytics = (initialFilters?: Partial<AnalyticsFilters>): UseAnalyticsReturn => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const [filters, setFilters] = useState<AnalyticsFilters>({
    dateRange: { from: null, to: null },
    selectedProjects: [],
    selectedMetrics: [],
    department: undefined,
    status: [],
    priority: [],
    ...initialFilters
  });

  // Fetch analytics data
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 800));

      // In a real implementation, this would be an API call
      const mockData = generateMockData(filters);
      setData(mockData);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch analytics data');
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  // Update filters
  const updateFilters = useCallback((newFilters: Partial<AnalyticsFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  // Refresh data
  const refreshData = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  // Export data
  const exportData = useCallback(async (options: any) => {
    try {
      // Simulate export process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // In a real implementation, this would generate and download the file
      console.log('Exporting data with options:', options);
      
      // Create mock download
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${options.fileName || 'analytics-export'}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      throw new Error('Export failed: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  }, [data]);

  // Filter hash for dependency optimization
  const filtersHash = useMemo(() => {
    return JSON.stringify(filters);
  }, [filters]);

  // Load data when filters change
  useEffect(() => {
    fetchData();
  }, [filtersHash, fetchData]);

  // Auto-refresh data every 5 minutes for real-time metrics
  useEffect(() => {
    const interval = setInterval(() => {
      if (data && !isLoading) {
        fetchData();
      }
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [data, isLoading, fetchData]);

  return {
    data,
    filters,
    isLoading,
    error,
    updateFilters,
    refreshData,
    exportData,
    lastUpdated
  };
};

export default useAnalytics;
