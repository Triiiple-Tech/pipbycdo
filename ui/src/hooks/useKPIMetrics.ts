import { useState, useEffect, useCallback, useMemo } from 'react';

export interface KPIMetric {
  id: string;
  name: string;
  category: 'performance' | 'financial' | 'quality' | 'efficiency';
  currentValue: number;
  targetValue: number;
  previousValue: number;
  industryAverage: number;
  unit: string;
  format: 'percentage' | 'currency' | 'number' | 'decimal';
  trend: 'up' | 'down' | 'stable';
  status: 'excellent' | 'good' | 'warning' | 'critical';
  weight: number; // Importance weight for overall score calculation
  historical: Array<{
    date: string;
    value: number;
    target: number;
  }>;
}

export interface KPIAnalysis {
  overallScore: number;
  scoreByCategory: Record<string, number>;
  topPerformers: KPIMetric[];
  underPerformers: KPIMetric[];
  trends: {
    improving: KPIMetric[];
    declining: KPIMetric[];
    stable: KPIMetric[];
  };
  recommendations: Array<{
    metric: string;
    priority: 'high' | 'medium' | 'low';
    action: string;
    impact: string;
  }>;
}

export interface UseKPIMetricsReturn {
  metrics: KPIMetric[];
  analysis: KPIAnalysis | null;
  isLoading: boolean;
  error: string | null;
  refreshMetrics: () => Promise<void>;
  updateTarget: (metricId: string, newTarget: number) => Promise<void>;
  getMetricsByCategory: (category: string) => KPIMetric[];
  calculateCategoryScore: (category: string) => number;
  lastUpdated: Date | null;
}

// Mock KPI data generator
const generateMockKPIData = (): KPIMetric[] => {
  const generateHistorical = (baseValue: number, days: number = 30) => {
    return Array.from({ length: days }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (days - 1 - i));
      const variation = 0.8 + Math.random() * 0.4; // ±20% variation
      return {
        date: date.toISOString().split('T')[0],
        value: Math.round(baseValue * variation * 100) / 100,
        target: baseValue * 1.1 // Target is 10% above base
      };
    });
  };

  const metrics: KPIMetric[] = [
    {
      id: 'project_delivery',
      name: 'On-Time Project Delivery',
      category: 'performance',
      currentValue: 87.5,
      targetValue: 90,
      previousValue: 82.3,
      industryAverage: 78.2,
      unit: '%',
      format: 'percentage',
      trend: 'up',
      status: 'good',
      weight: 0.2,
      historical: generateHistorical(87.5)
    },
    {
      id: 'budget_variance',
      name: 'Budget Variance',
      category: 'financial',
      currentValue: 5.2,
      targetValue: 3.0,
      previousValue: 7.8,
      industryAverage: 8.5,
      unit: '%',
      format: 'percentage',
      trend: 'down',
      status: 'warning',
      weight: 0.25,
      historical: generateHistorical(5.2)
    },
    {
      id: 'client_satisfaction',
      name: 'Client Satisfaction Score',
      category: 'quality',
      currentValue: 4.6,
      targetValue: 4.8,
      previousValue: 4.4,
      industryAverage: 4.2,
      unit: '/5',
      format: 'decimal',
      trend: 'up',
      status: 'good',
      weight: 0.2,
      historical: generateHistorical(4.6)
    },
    {
      id: 'team_utilization',
      name: 'Team Utilization Rate',
      category: 'efficiency',
      currentValue: 78.9,
      targetValue: 85,
      previousValue: 76.2,
      industryAverage: 72.5,
      unit: '%',
      format: 'percentage',
      trend: 'up',
      status: 'good',
      weight: 0.15,
      historical: generateHistorical(78.9)
    },
    {
      id: 'revenue_growth',
      name: 'Revenue Growth Rate',
      category: 'financial',
      currentValue: 15.3,
      targetValue: 18,
      previousValue: 12.7,
      industryAverage: 11.8,
      unit: '%',
      format: 'percentage',
      trend: 'up',
      status: 'good',
      weight: 0.2,
      historical: generateHistorical(15.3)
    }
  ];

  return metrics;
};

// Calculate metric status based on performance
const calculateStatus = (current: number, target: number, isHigherBetter: boolean = true): KPIMetric['status'] => {
  const ratio = current / target;
  
  if (isHigherBetter) {
    if (ratio >= 1.05) return 'excellent';
    if (ratio >= 0.95) return 'good';
    if (ratio >= 0.85) return 'warning';
    return 'critical';
  } else {
    if (ratio <= 0.85) return 'excellent';
    if (ratio <= 0.95) return 'good';
    if (ratio <= 1.05) return 'warning';
    return 'critical';
  }
};

// Calculate trend based on current vs previous
const calculateTrend = (current: number, previous: number, threshold: number = 0.02): KPIMetric['trend'] => {
  const change = Math.abs(current - previous) / previous;
  if (change < threshold) return 'stable';
  return current > previous ? 'up' : 'down';
};

// Generate KPI analysis
const generateKPIAnalysis = (metrics: KPIMetric[]): KPIAnalysis => {
  // Calculate overall score (weighted average)
  const overallScore = metrics.reduce((sum, metric) => {
    const score = Math.min(100, (metric.currentValue / metric.targetValue) * 100);
    return sum + (score * metric.weight);
  }, 0);

  // Calculate scores by category
  const scoreByCategory: Record<string, number> = {};
  const categories = [...new Set(metrics.map(m => m.category))];
  
  categories.forEach(category => {
    const categoryMetrics = metrics.filter(m => m.category === category);
    const totalWeight = categoryMetrics.reduce((sum, m) => sum + m.weight, 0);
    const weightedScore = categoryMetrics.reduce((sum, metric) => {
      const score = Math.min(100, (metric.currentValue / metric.targetValue) * 100);
      return sum + (score * (metric.weight / totalWeight));
    }, 0);
    scoreByCategory[category] = weightedScore;
  });

  // Identify top and under performers
  const sortedByPerformance = [...metrics].sort((a, b) => {
    const scoreA = a.currentValue / a.targetValue;
    const scoreB = b.currentValue / b.targetValue;
    return scoreB - scoreA;
  });

  const topPerformers = sortedByPerformance.slice(0, 2);
  const underPerformers = sortedByPerformance.slice(-2);

  // Categorize trends
  const trends = {
    improving: metrics.filter(m => m.trend === 'up'),
    declining: metrics.filter(m => m.trend === 'down'),
    stable: metrics.filter(m => m.trend === 'stable')
  };

  // Generate recommendations
  const recommendations = underPerformers.map(metric => ({
    metric: metric.name,
    priority: metric.status === 'critical' ? 'high' as const : 'medium' as const,
    action: getRecommendedAction(metric),
    impact: getImpactDescription(metric)
  }));

  return {
    overallScore,
    scoreByCategory,
    topPerformers,
    underPerformers,
    trends,
    recommendations
  };
};

const getRecommendedAction = (metric: KPIMetric): string => {
  const actions: Record<string, string> = {
    'project_delivery': 'Review project planning and resource allocation processes',
    'budget_variance': 'Implement more frequent budget monitoring and approval workflows',
    'client_satisfaction': 'Conduct client feedback sessions and improve communication protocols',
    'team_utilization': 'Optimize task assignment and consider capacity planning tools',
    'revenue_growth': 'Focus on high-value client acquisition and upselling strategies'
  };
  return actions[metric.id] || 'Review processes and implement improvement measures';
};

const getImpactDescription = (metric: KPIMetric): string => {
  const impacts: Record<string, string> = {
    'project_delivery': 'Improved client satisfaction and reduced operational costs',
    'budget_variance': 'Better financial control and increased profitability',
    'client_satisfaction': 'Higher client retention and referral rates',
    'team_utilization': 'Increased productivity and employee satisfaction',
    'revenue_growth': 'Enhanced business growth and market position'
  };
  return impacts[metric.id] || 'Positive impact on overall business performance';
};

export const useKPIMetrics = (): UseKPIMetricsReturn => {
  const [metrics, setMetrics] = useState<KPIMetric[]>([]);
  const [analysis, setAnalysis] = useState<KPIAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Fetch KPI metrics
  const fetchMetrics = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 600));

      const mockMetrics = generateMockKPIData();
      
      // Update status and trends based on current data
      const updatedMetrics = mockMetrics.map(metric => ({
        ...metric,
        status: calculateStatus(
          metric.currentValue, 
          metric.targetValue, 
          !['budget_variance'].includes(metric.id) // Budget variance is lower-is-better
        ),
        trend: calculateTrend(metric.currentValue, metric.previousValue)
      }));

      setMetrics(updatedMetrics);
      setAnalysis(generateKPIAnalysis(updatedMetrics));
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch KPI metrics');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Refresh metrics
  const refreshMetrics = useCallback(async () => {
    await fetchMetrics();
  }, [fetchMetrics]);

  // Update target value for a metric
  const updateTarget = useCallback(async (metricId: string, newTarget: number) => {
    try {
      setIsLoading(true);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));

      setMetrics(prev => {
        const updated = prev.map(metric => 
          metric.id === metricId ? { ...metric, targetValue: newTarget } : metric
        );
        
        // Recalculate analysis with new targets
        setAnalysis(generateKPIAnalysis(updated));
        return updated;
      });

      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update target');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Get metrics by category
  const getMetricsByCategory = useCallback((category: string): KPIMetric[] => {
    return metrics.filter(metric => metric.category === category);
  }, [metrics]);

  // Calculate category score
  const calculateCategoryScore = useCallback((category: string): number => {
    if (!analysis) return 0;
    return analysis.scoreByCategory[category] || 0;
  }, [analysis]);

  // Load initial data
  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  // Auto-refresh every 10 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isLoading) {
        fetchMetrics();
      }
    }, 10 * 60 * 1000); // 10 minutes

    return () => clearInterval(interval);
  }, [isLoading, fetchMetrics]);

  return {
    metrics,
    analysis,
    isLoading,
    error,
    refreshMetrics,
    updateTarget,
    getMetricsByCategory,
    calculateCategoryScore,
    lastUpdated
  };
};

export default useKPIMetrics;
