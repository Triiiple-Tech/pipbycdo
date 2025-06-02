import React from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
  Legend,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Download,
  Maximize2,
  Calendar,
  Activity,
} from "lucide-react";

interface TimeSeriesDataPoint {
  date: string;
  progress: number;
  budget: number;
  quality: number;
  velocity: number;
  timestamp: number;
}

interface TimeSeriesChartProps {
  data?: TimeSeriesDataPoint[];
  title?: string;
  className?: string;
  isLoading?: boolean;
  showLegend?: boolean;
  height?: number;
}

export function TimeSeriesChart({ 
  data, 
  title = "Time Series Analysis", 
  className,
  isLoading = false,
  showLegend = true,
  height = 300
}: TimeSeriesChartProps) {
  const mockData: TimeSeriesDataPoint[] = [
    { date: "2024-12-01", progress: 45, budget: 32, quality: 88, velocity: 12, timestamp: 1733011200000 },
    { date: "2024-12-03", progress: 52, budget: 38, quality: 89, velocity: 14, timestamp: 1733184000000 },
    { date: "2024-12-05", progress: 58, budget: 45, quality: 91, velocity: 16, timestamp: 1733356800000 },
    { date: "2024-12-07", progress: 63, budget: 52, quality: 89, velocity: 15, timestamp: 1733529600000 },
    { date: "2024-12-09", progress: 68, budget: 58, quality: 92, velocity: 17, timestamp: 1733702400000 },
    { date: "2024-12-11", progress: 72, budget: 63, quality: 94, velocity: 18, timestamp: 1733875200000 },
    { date: "2024-12-13", progress: 76, budget: 69, quality: 93, velocity: 16, timestamp: 1734048000000 },
    { date: "2024-12-15", progress: 82, budget: 75, quality: 95, velocity: 19, timestamp: 1734220800000 },
    { date: "2024-12-17", progress: 87, budget: 81, quality: 96, velocity: 20, timestamp: 1734393600000 },
    { date: "2024-12-19", progress: 91, budget: 86, quality: 97, velocity: 18, timestamp: 1734566400000 },
    { date: "2024-12-21", progress: 94, budget: 91, quality: 98, velocity: 17, timestamp: 1734739200000 },
    { date: "2024-12-23", progress: 97, budget: 95, quality: 99, velocity: 15, timestamp: 1734912000000 },
  ];

  const chartData = data || mockData;

  // Calculate trends
  const getSparklineTrend = (dataKey: keyof TimeSeriesDataPoint) => {
    if (chartData.length < 2) return 0;
    const first = chartData[0][dataKey] as number;
    const last = chartData[chartData.length - 1][dataKey] as number;
    return ((last - first) / first) * 100;
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-slate-800 p-3 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg">
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            {new Date(label).toLocaleDateString('en-US', { 
              month: 'short', 
              day: 'numeric',
              year: 'numeric'
            })}
          </p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2 text-xs">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-slate-600 dark:text-slate-400 capitalize">
                {entry.dataKey}:
              </span>
              <span className="font-medium text-slate-800 dark:text-slate-200">
                {entry.value}
                {entry.dataKey === 'progress' || entry.dataKey === 'budget' || entry.dataKey === 'quality' ? '%' : ''}
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
      transition={{ duration: 0.4 }}
    >
      <Card className={cn("hover:shadow-lg transition-shadow duration-300", className)}>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-[#E60023]" />
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
            Track key metrics over time with trend analysis
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Quick Stats */}
          <div className="grid grid-cols-4 gap-3">
            {[
              { key: 'progress', label: 'Progress', color: 'text-blue-600' },
              { key: 'budget', label: 'Budget', color: 'text-green-600' },
              { key: 'quality', label: 'Quality', color: 'text-purple-600' },
              { key: 'velocity', label: 'Velocity', color: 'text-orange-600' },
            ].map((metric) => {
              const trend = getSparklineTrend(metric.key as keyof TimeSeriesDataPoint);
              const currentValue = chartData[chartData.length - 1]?.[metric.key as keyof TimeSeriesDataPoint] as number;
              
              return (
                <div key={metric.key} className="text-center p-2 bg-slate-50 rounded-lg">
                  <p className="text-xs text-slate-500 mb-1">{metric.label}</p>
                  <p className={cn("text-lg font-bold", metric.color)}>
                    {currentValue}
                    {metric.key !== 'velocity' ? '%' : ''}
                  </p>
                  <div className="flex items-center justify-center gap-1 mt-1">
                    {trend > 0 ? (
                      <TrendingUp className="w-3 h-3 text-green-500" />
                    ) : (
                      <TrendingDown className="w-3 h-3 text-red-500" />
                    )}
                    <span className="text-xs text-slate-500">
                      {trend > 0 ? '+' : ''}{trend.toFixed(1)}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Chart */}
          <div style={{ height: `${height}px` }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={chartData}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="progressGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="budgetGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="qualityGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis 
                  dataKey="date" 
                  stroke="#64748B"
                  fontSize={12}
                  tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                />
                <YAxis 
                  stroke="#64748B"
                  fontSize={12}
                />
                <Tooltip content={<CustomTooltip />} />
                {showLegend && (
                  <Legend 
                    wrapperStyle={{ fontSize: '12px' }}
                    iconType="circle"
                  />
                )}
                
                <Area
                  type="monotone"
                  dataKey="progress"
                  stroke="#3B82F6"
                  strokeWidth={2}
                  fill="url(#progressGradient)"
                  name="Progress"
                />
                <Area
                  type="monotone"
                  dataKey="budget"
                  stroke="#10B981"
                  strokeWidth={2}
                  fill="url(#budgetGradient)"
                  name="Budget"
                />
                <Area
                  type="monotone"
                  dataKey="quality"
                  stroke="#8B5CF6"
                  strokeWidth={2}
                  fill="url(#qualityGradient)"
                  name="Quality"
                />
                <Line
                  type="monotone"
                  dataKey="velocity"
                  stroke="#F97316"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  name="Velocity"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Chart Controls */}
          <div className="flex items-center justify-between pt-2 border-t">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Calendar className="w-3 h-3" />
              <span>Last 30 days</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                Real-time
              </Badge>
              <span className="text-xs text-slate-500">
                Updated 2 min ago
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
