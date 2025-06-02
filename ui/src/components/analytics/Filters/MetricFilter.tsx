import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BarChart3, 
  ChevronDown, 
  X, 
  CheckSquare, 
  Square, 
  TrendingUp,
  DollarSign,
  Clock,
  Users,
  Target,
  Activity,
  Zap,
  AlertTriangle,
  Search,
  Filter
} from 'lucide-react';
import { Button } from '../../ui/button';
import { Card } from '../../ui/card';
import { Input } from '../../ui/input';
import { Badge } from '../../ui/badge';
import { cn } from '../../../lib/utils';

export interface Metric {
  id: string;
  name: string;
  description: string;
  category: 'performance' | 'financial' | 'quality' | 'efficiency' | 'engagement' | 'risk';
  type: 'percentage' | 'currency' | 'number' | 'ratio' | 'time' | 'score';
  unit?: string;
  isKPI: boolean;
  source: 'system' | 'manual' | 'api' | 'calculated';
  updateFrequency: 'real-time' | 'hourly' | 'daily' | 'weekly' | 'monthly';
  tags: string[];
  icon: React.ComponentType<any>;
}

export interface MetricFilterProps {
  metrics?: Metric[];
  selectedMetrics: string[];
  onChange: (metricIds: string[]) => void;
  className?: string;
  disabled?: boolean;
  placeholder?: string;
  maxSelections?: number;
  showMetricDetails?: boolean;
  allowCategoryFiltering?: boolean;
  allowTypeFiltering?: boolean;
}

// Mock metrics data for development
const MOCK_METRICS: Metric[] = [
  {
    id: 'revenue',
    name: 'Total Revenue',
    description: 'Total revenue generated across all projects',
    category: 'financial',
    type: 'currency',
    unit: 'USD',
    isKPI: true,
    source: 'api',
    updateFrequency: 'daily',
    tags: ['revenue', 'income', 'financial'],
    icon: DollarSign
  },
  {
    id: 'project_completion',
    name: 'Project Completion Rate',
    description: 'Percentage of projects completed on time',
    category: 'performance',
    type: 'percentage',
    unit: '%',
    isKPI: true,
    source: 'calculated',
    updateFrequency: 'daily',
    tags: ['completion', 'timeline', 'delivery'],
    icon: Target
  },
  {
    id: 'budget_utilization',
    name: 'Budget Utilization',
    description: 'Percentage of allocated budget used',
    category: 'financial',
    type: 'percentage',
    unit: '%',
    isKPI: true,
    source: 'calculated',
    updateFrequency: 'daily',
    tags: ['budget', 'spending', 'utilization'],
    icon: TrendingUp
  },
  {
    id: 'team_productivity',
    name: 'Team Productivity Score',
    description: 'Overall team productivity measurement',
    category: 'efficiency',
    type: 'score',
    unit: 'points',
    isKPI: true,
    source: 'calculated',
    updateFrequency: 'hourly',
    tags: ['productivity', 'team', 'efficiency'],
    icon: Users
  },
  {
    id: 'response_time',
    name: 'Average Response Time',
    description: 'Average time to respond to client requests',
    category: 'performance',
    type: 'time',
    unit: 'hours',
    isKPI: false,
    source: 'system',
    updateFrequency: 'real-time',
    tags: ['response', 'time', 'service'],
    icon: Clock
  },
  {
    id: 'quality_score',
    name: 'Quality Score',
    description: 'Overall quality assessment of deliverables',
    category: 'quality',
    type: 'score',
    unit: 'points',
    isKPI: true,
    source: 'manual',
    updateFrequency: 'weekly',
    tags: ['quality', 'assessment', 'deliverables'],
    icon: Target
  },
  {
    id: 'client_satisfaction',
    name: 'Client Satisfaction',
    description: 'Client satisfaction rating',
    category: 'engagement',
    type: 'score',
    unit: 'stars',
    isKPI: true,
    source: 'api',
    updateFrequency: 'weekly',
    tags: ['satisfaction', 'client', 'rating'],
    icon: Activity
  },
  {
    id: 'resource_efficiency',
    name: 'Resource Efficiency',
    description: 'Efficiency of resource allocation and usage',
    category: 'efficiency',
    type: 'percentage',
    unit: '%',
    isKPI: false,
    source: 'calculated',
    updateFrequency: 'daily',
    tags: ['resource', 'efficiency', 'allocation'],
    icon: Zap
  },
  {
    id: 'risk_score',
    name: 'Risk Assessment Score',
    description: 'Overall project risk assessment',
    category: 'risk',
    type: 'score',
    unit: 'points',
    isKPI: true,
    source: 'calculated',
    updateFrequency: 'daily',
    tags: ['risk', 'assessment', 'project'],
    icon: AlertTriangle
  },
  {
    id: 'active_projects',
    name: 'Active Projects Count',
    description: 'Number of currently active projects',
    category: 'performance',
    type: 'number',
    unit: 'projects',
    isKPI: false,
    source: 'system',
    updateFrequency: 'real-time',
    tags: ['projects', 'active', 'count'],
    icon: BarChart3
  }
];

const CATEGORY_CONFIG = {
  performance: { label: 'Performance', color: 'bg-blue-100 text-blue-800', icon: TrendingUp },
  financial: { label: 'Financial', color: 'bg-green-100 text-green-800', icon: DollarSign },
  quality: { label: 'Quality', color: 'bg-purple-100 text-purple-800', icon: Target },
  efficiency: { label: 'Efficiency', color: 'bg-orange-100 text-orange-800', icon: Zap },
  engagement: { label: 'Engagement', color: 'bg-pink-100 text-pink-800', icon: Activity },
  risk: { label: 'Risk', color: 'bg-red-100 text-red-800', icon: AlertTriangle }
};

const TYPE_CONFIG = {
  percentage: { label: 'Percentage', color: 'bg-blue-50 text-blue-700' },
  currency: { label: 'Currency', color: 'bg-green-50 text-green-700' },
  number: { label: 'Number', color: 'bg-gray-50 text-gray-700' },
  ratio: { label: 'Ratio', color: 'bg-purple-50 text-purple-700' },
  time: { label: 'Time', color: 'bg-orange-50 text-orange-700' },
  score: { label: 'Score', color: 'bg-pink-50 text-pink-700' }
};

export const MetricFilter: React.FC<MetricFilterProps> = ({
  metrics = MOCK_METRICS,
  selectedMetrics,
  onChange,
  className,
  disabled = false,
  placeholder = 'Select metrics',
  maxSelections,
  showMetricDetails = true,
  allowCategoryFiltering = true,
  allowTypeFiltering = true
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategories, setFilterCategories] = useState<string[]>([]);
  const [filterTypes, setFilterTypes] = useState<string[]>([]);
  const [showKPIOnly, setShowKPIOnly] = useState(false);

  // Get unique categories and types
  const categories = useMemo(() => {
    return Array.from(new Set(metrics.map(m => m.category))).sort();
  }, [metrics]);

  const types = useMemo(() => {
    return Array.from(new Set(metrics.map(m => m.type))).sort();
  }, [metrics]);

  // Filter metrics based on search and filters
  const filteredMetrics = useMemo(() => {
    return metrics.filter(metric => {
      const matchesSearch = !searchTerm || 
        metric.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        metric.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        metric.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesCategory = filterCategories.length === 0 || filterCategories.includes(metric.category);
      const matchesType = filterTypes.length === 0 || filterTypes.includes(metric.type);
      const matchesKPI = !showKPIOnly || metric.isKPI;

      return matchesSearch && matchesCategory && matchesType && matchesKPI;
    });
  }, [metrics, searchTerm, filterCategories, filterTypes, showKPIOnly]);

  // Get display text
  const getDisplayText = () => {
    if (selectedMetrics.length === 0) return placeholder;
    if (selectedMetrics.length === 1) {
      const metric = metrics.find(m => m.id === selectedMetrics[0]);
      return metric?.name || 'Unknown Metric';
    }
    return `${selectedMetrics.length} metrics selected`;
  };

  // Handle metric selection
  const handleMetricToggle = (metricId: string) => {
    const isSelected = selectedMetrics.includes(metricId);
    let newSelection: string[];

    if (isSelected) {
      newSelection = selectedMetrics.filter(id => id !== metricId);
    } else {
      if (maxSelections && selectedMetrics.length >= maxSelections) {
        return;
      }
      newSelection = [...selectedMetrics, metricId];
    }

    onChange(newSelection);
  };

  // Handle select all/none
  const handleSelectAll = () => {
    if (selectedMetrics.length === filteredMetrics.length) {
      onChange([]);
    } else {
      const allIds = filteredMetrics.map(m => m.id);
      onChange(maxSelections ? allIds.slice(0, maxSelections) : allIds);
    }
  };

  // Clear selection
  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange([]);
  };

  // Toggle filter
  const toggleFilter = (filterArray: string[], setFilter: React.Dispatch<React.SetStateAction<string[]>>, value: string) => {
    if (filterArray.includes(value)) {
      setFilter(filterArray.filter(f => f !== value));
    } else {
      setFilter([...filterArray, value]);
    }
  };

  return (
    <div className={cn('relative', className)}>
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          'w-full justify-between text-left font-normal',
          'border-gray-200 hover:border-[#E60023] focus:border-[#E60023]',
          'transition-all duration-200',
          selectedMetrics.length === 0 && 'text-gray-500'
        )}
      >
        <div className="flex items-center space-x-2 flex-1 min-w-0">
          <BarChart3 className="h-4 w-4 text-gray-400 flex-shrink-0" />
          <span className="truncate">{getDisplayText()}</span>
          {selectedMetrics.length > 0 && (
            <Badge variant="secondary" className="bg-[#E60023] text-white text-xs">
              {selectedMetrics.length}
            </Badge>
          )}
        </div>
        <div className="flex items-center space-x-1 flex-shrink-0">
          {selectedMetrics.length > 0 && (
            <X
              className="h-4 w-4 text-gray-400 hover:text-[#E60023] transition-colors"
              onClick={handleClear}
            />
          )}
          <ChevronDown className={cn(
            'h-4 w-4 text-gray-400 transition-transform duration-200',
            isOpen && 'rotate-180'
          )} />
        </div>
      </Button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full left-0 right-0 z-50 mt-2"
          >
            <Card className="p-4 shadow-lg border-gray-200 bg-white/95 backdrop-blur-sm max-h-96 overflow-hidden flex flex-col">
              {/* Search and Controls */}
              <div className="space-y-3 mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search metrics..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 text-sm border-gray-200 focus:border-[#E60023]"
                  />
                </div>

                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleSelectAll}
                      className="text-xs hover:bg-gray-50"
                    >
                      {selectedMetrics.length === filteredMetrics.length ? 'Clear All' : 'Select All'}
                    </Button>
                    <Button
                      variant={showKPIOnly ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setShowKPIOnly(!showKPIOnly)}
                      className={cn(
                        'text-xs',
                        showKPIOnly
                          ? 'bg-[#E60023] hover:bg-[#CC001F] text-white'
                          : 'hover:bg-gray-50'
                      )}
                    >
                      KPIs Only
                    </Button>
                  </div>
                  <span className="text-xs text-gray-500">
                    {filteredMetrics.length} metric{filteredMetrics.length !== 1 ? 's' : ''}
                    {maxSelections && ` (max ${maxSelections})`}
                  </span>
                </div>

                {/* Quick Filters */}
                <div className="space-y-2">
                  {/* Category Filter */}
                  {allowCategoryFiltering && (
                    <div>
                      <label className="text-xs font-medium text-gray-600 mb-1 block">Category</label>
                      <div className="flex flex-wrap gap-1">
                        {categories.map(category => {
                          const config = CATEGORY_CONFIG[category as keyof typeof CATEGORY_CONFIG];
                          return (
                            <Button
                              key={category}
                              variant={filterCategories.includes(category) ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => toggleFilter(filterCategories, setFilterCategories, category)}
                              className={cn(
                                'text-xs h-6',
                                filterCategories.includes(category)
                                  ? 'bg-[#E60023] hover:bg-[#CC001F] text-white'
                                  : 'hover:border-[#E60023]'
                              )}
                            >
                              <config.icon className="h-3 w-3 mr-1" />
                              {config.label}
                            </Button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Type Filter */}
                  {allowTypeFiltering && (
                    <div>
                      <label className="text-xs font-medium text-gray-600 mb-1 block">Type</label>
                      <div className="flex flex-wrap gap-1">
                        {types.map(type => {
                          const config = TYPE_CONFIG[type as keyof typeof TYPE_CONFIG];
                          return (
                            <Button
                              key={type}
                              variant={filterTypes.includes(type) ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => toggleFilter(filterTypes, setFilterTypes, type)}
                              className={cn(
                                'text-xs h-6',
                                filterTypes.includes(type)
                                  ? 'bg-[#E60023] hover:bg-[#CC001F] text-white'
                                  : 'hover:border-[#E60023]'
                              )}
                            >
                              {config.label}
                            </Button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Metrics List */}
              <div className="flex-1 overflow-y-auto space-y-2">
                {filteredMetrics.map((metric) => {
                  const isSelected = selectedMetrics.includes(metric.id);
                  const categoryConfig = CATEGORY_CONFIG[metric.category];
                  const typeConfig = TYPE_CONFIG[metric.type];
                  const IconComponent = metric.icon;

                  return (
                    <motion.div
                      key={metric.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={cn(
                        'p-3 rounded-lg border cursor-pointer transition-all duration-200',
                        'hover:border-[#E60023] hover:shadow-sm',
                        isSelected
                          ? 'border-[#E60023] bg-[#E60023]/5'
                          : 'border-gray-200 hover:bg-gray-50'
                      )}
                      onClick={() => handleMetricToggle(metric.id)}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 mt-0.5">
                          {isSelected ? (
                            <CheckSquare className="h-4 w-4 text-[#E60023]" />
                          ) : (
                            <Square className="h-4 w-4 text-gray-400" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center space-x-2">
                              <IconComponent className="h-4 w-4 text-gray-600" />
                              <h4 className="text-sm font-medium text-gray-900 truncate">
                                {metric.name}
                              </h4>
                              {metric.isKPI && (
                                <Badge className="text-xs bg-[#E60023] text-white">KPI</Badge>
                              )}
                            </div>
                          </div>

                          {showMetricDetails && (
                            <div className="space-y-1">
                              <p className="text-xs text-gray-600 mb-2">{metric.description}</p>
                              
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                  <Badge className={cn('text-xs', categoryConfig.color)}>
                                    {categoryConfig.label}
                                  </Badge>
                                  <Badge className={cn('text-xs', typeConfig.color)}>
                                    {typeConfig.label}
                                  </Badge>
                                </div>
                                <span className="text-xs text-gray-500">
                                  {metric.updateFrequency}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}

                {filteredMetrics.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Filter className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No metrics found</p>
                  </div>
                )}
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default MetricFilter;
