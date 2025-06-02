import React from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import {
  DollarSign,
  Download,
  Maximize2,
  TrendingUp,
  TrendingDown,
  PieChart as PieChartIcon,
} from "lucide-react";

interface BudgetCategory {
  name: string;
  allocated: number;
  spent: number;
  remaining: number;
  percentage: number;
  status: "under" | "on-track" | "over";
  color: string;
}

interface BudgetBreakdownData {
  categories: BudgetCategory[];
  totalBudget: number;
  totalSpent: number;
  projectedSpend: number;
  variance: number;
  lastUpdated: string;
}

interface BudgetBreakdownChartProps {
  data?: BudgetBreakdownData;
  title?: string;
  className?: string;
  isLoading?: boolean;
  chartType?: "pie" | "bar";
  height?: number;
}

export function BudgetBreakdownChart({ 
  data, 
  title = "Budget Breakdown", 
  className,
  isLoading = false,
  chartType = "pie",
  height = 300
}: BudgetBreakdownChartProps) {
  const mockData: BudgetBreakdownData = {
    categories: [
      {
        name: "AI Models & APIs",
        allocated: 50000,
        spent: 35000,
        remaining: 15000,
        percentage: 40,
        status: "on-track",
        color: "#3B82F6"
      },
      {
        name: "Development Resources",
        allocated: 40000,
        spent: 28000,
        remaining: 12000,
        status: "on-track",
        percentage: 32,
        color: "#10B981"
      },
      {
        name: "Infrastructure",
        allocated: 25000,
        spent: 17500,
        remaining: 7500,
        status: "on-track",
        percentage: 20,
        color: "#8B5CF6"
      },
      {
        name: "Testing & QA",
        allocated: 10000,
        spent: 7000,
        remaining: 3000,
        status: "on-track",
        percentage: 8,
        color: "#F97316"
      },
    ],
    totalBudget: 125000,
    totalSpent: 87500,
    projectedSpend: 118750,
    variance: -6250,
    lastUpdated: "1 hour ago",
  };

  const budgetData = data || mockData;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "under":
        return "text-green-600 bg-green-100";
      case "on-track":
        return "text-blue-600 bg-blue-100";
      case "over":
        return "text-red-600 bg-red-100";
      default:
        return "text-slate-600 bg-slate-100";
    }
  };

  // Prepare data for charts
  const pieData = budgetData.categories.map(cat => ({
    name: cat.name,
    value: cat.spent,
    percentage: cat.percentage,
    color: cat.color,
    allocated: cat.allocated,
    remaining: cat.remaining,
  }));

  const barData = budgetData.categories.map(cat => ({
    name: cat.name.split(' ')[0], // Shorten names for bar chart
    allocated: cat.allocated,
    spent: cat.spent,
    remaining: cat.remaining,
  }));

  const CustomPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white dark:bg-slate-800 p-3 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg">
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            {data.name}
          </p>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between gap-4">
              <span className="text-slate-600 dark:text-slate-400">Spent:</span>
              <span className="font-medium text-slate-800 dark:text-slate-200">
                {formatCurrency(data.value)}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-slate-600 dark:text-slate-400">Allocated:</span>
              <span className="font-medium text-slate-800 dark:text-slate-200">
                {formatCurrency(data.allocated)}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-slate-600 dark:text-slate-400">Remaining:</span>
              <span className="font-medium text-slate-800 dark:text-slate-200">
                {formatCurrency(data.remaining)}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-slate-600 dark:text-slate-400">Percentage:</span>
              <span className="font-medium text-slate-800 dark:text-slate-200">
                {data.percentage}%
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  const CustomBarTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-slate-800 p-3 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg">
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            {label}
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
                {formatCurrency(entry.value)}
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
      transition={{ duration: 0.4, delay: 0.1 }}
    >
      <Card className={cn("hover:shadow-lg transition-shadow duration-300", className)}>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-[#E60023]" />
              <CardTitle className="text-lg">{title}</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="h-8 px-2">
                <PieChartIcon className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" className="h-8 px-2">
                <Download className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" className="h-8 px-2">
                <Maximize2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <CardDescription>
            Budget allocation and spending analysis by category
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Budget Summary */}
          <div className="grid grid-cols-3 gap-4 p-3 bg-slate-50 rounded-lg">
            <div className="text-center">
              <p className="text-xs text-slate-500 mb-1">Total Budget</p>
              <p className="text-lg font-bold text-slate-800">
                {formatCurrency(budgetData.totalBudget)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-slate-500 mb-1">Spent</p>
              <p className="text-lg font-bold text-blue-600">
                {formatCurrency(budgetData.totalSpent)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-slate-500 mb-1">Projected</p>
              <div className="flex items-center justify-center gap-1">
                <p className="text-lg font-bold text-green-600">
                  {formatCurrency(budgetData.projectedSpend)}
                </p>
                {budgetData.variance < 0 ? (
                  <TrendingDown className="w-4 h-4 text-green-500" />
                ) : (
                  <TrendingUp className="w-4 h-4 text-red-500" />
                )}
              </div>
            </div>
          </div>

          {/* Chart */}
          <div style={{ height: `${height}px` }}>
            <ResponsiveContainer width="100%" height="100%">
              {chartType === "pie" ? (
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={120}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomPieTooltip />} />
                  <Legend 
                    wrapperStyle={{ fontSize: '12px' }}
                    iconType="circle"
                  />
                </PieChart>
              ) : (
                <BarChart
                  data={barData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis 
                    dataKey="name" 
                    stroke="#64748B"
                    fontSize={12}
                  />
                  <YAxis 
                    stroke="#64748B"
                    fontSize={12}
                    tickFormatter={(value) => `$${value / 1000}k`}
                  />
                  <Tooltip content={<CustomBarTooltip />} />
                  <Legend />
                  <Bar dataKey="allocated" fill="#E2E8F0" name="Allocated" />
                  <Bar dataKey="spent" fill="#3B82F6" name="Spent" />
                  <Bar dataKey="remaining" fill="#10B981" name="Remaining" />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>

          {/* Category Details */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-slate-700">Category Details</h4>
            <div className="space-y-2">
              {budgetData.categories.map((category, index) => (
                <motion.div
                  key={category.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * index }}
                  className="flex items-center justify-between p-2 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: category.color }}
                    />
                    <div>
                      <p className="text-sm font-medium text-slate-800">{category.name}</p>
                      <p className="text-xs text-slate-500">
                        {formatCurrency(category.spent)} / {formatCurrency(category.allocated)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge 
                      variant="secondary" 
                      className={cn("text-xs mb-1", getStatusColor(category.status))}
                    >
                      {category.status.replace('-', ' ').toUpperCase()}
                    </Badge>
                    <p className="text-xs text-slate-500">
                      {category.percentage}% of total
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-2 border-t">
            <div className="text-xs text-slate-500">
              {budgetData.variance < 0 ? 'Under budget by' : 'Over budget by'} {' '}
              <span className={cn(
                "font-medium",
                budgetData.variance < 0 ? "text-green-600" : "text-red-600"
              )}>
                {formatCurrency(Math.abs(budgetData.variance))}
              </span>
            </div>
            <div className="text-xs text-slate-500">
              Updated {budgetData.lastUpdated}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
