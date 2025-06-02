import React from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Target,
  Calendar,
  BarChart3,
} from "lucide-react";

interface BudgetData {
  totalBudget: number;
  spentAmount: number;
  remainingAmount: number;
  burnRate: number; // per day
  projectedSpend: number;
  budgetUtilization: number; // percentage
  daysRemaining: number;
  status: "healthy" | "warning" | "critical";
  categories: {
    name: string;
    allocated: number;
    spent: number;
    percentage: number;
  }[];
  trends: {
    weeklySpend: number;
    monthlySpend: number;
    projectedOverrun: number;
  };
  lastUpdated: string;
}

interface BudgetAnalyticsWidgetProps {
  data?: BudgetData;
  isLoading?: boolean;
  className?: string;
}

export function BudgetAnalyticsWidget({ data, isLoading, className }: BudgetAnalyticsWidgetProps) {
  const mockData: BudgetData = {
    totalBudget: 125000,
    spentAmount: 87500,
    remainingAmount: 37500,
    burnRate: 1250,
    projectedSpend: 118750,
    budgetUtilization: 70,
    daysRemaining: 30,
    status: "healthy",
    categories: [
      { name: "AI Models", allocated: 50000, spent: 35000, percentage: 70 },
      { name: "Development", allocated: 40000, spent: 28000, percentage: 70 },
      { name: "Infrastructure", allocated: 25000, spent: 17500, percentage: 70 },
      { name: "Testing", allocated: 10000, spent: 7000, percentage: 70 },
    ],
    trends: {
      weeklySpend: 8750,
      monthlySpend: 35000,
      projectedOverrun: -6250,
    },
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
      case "healthy":
        return "text-green-600 bg-green-100";
      case "warning":
        return "text-yellow-600 bg-yellow-100";
      case "critical":
        return "text-red-600 bg-red-100";
      default:
        return "text-slate-600 bg-slate-100";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "healthy":
        return <CheckCircle className="w-4 h-4" />;
      case "warning":
      case "critical":
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <Target className="w-4 h-4" />;
    }
  };

  if (isLoading) {
    return (
      <Card className={cn("animate-pulse", className)}>
        <CardHeader className="space-y-2">
          <div className="h-5 bg-slate-200 rounded w-3/4"></div>
          <div className="h-4 bg-slate-200 rounded w-1/2"></div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="h-20 bg-slate-200 rounded"></div>
          <div className="space-y-2">
            <div className="h-4 bg-slate-200 rounded"></div>
            <div className="h-4 bg-slate-200 rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay: 0.1 }}
    >
      <Card className={cn("hover:shadow-lg transition-shadow duration-300", className)}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-[#E60023]" />
              <CardTitle className="text-lg">Budget Analytics</CardTitle>
            </div>
            <Badge 
              variant="secondary" 
              className={cn("text-xs", getStatusColor(budgetData.status))}
            >
              {getStatusIcon(budgetData.status)}
              <span className="ml-1">{budgetData.status.toUpperCase()}</span>
            </Badge>
          </div>
          <CardDescription>
            Budget tracking, utilization, and forecasting
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Budget Overview */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-slate-500 mb-1">Total Budget</p>
              <p className="text-xl font-bold text-slate-800">
                {formatCurrency(budgetData.totalBudget)}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Remaining</p>
              <p className="text-xl font-bold text-green-600">
                {formatCurrency(budgetData.remainingAmount)}
              </p>
            </div>
          </div>

          {/* Budget Utilization */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-700">Utilization</span>
              <span className="text-sm font-semibold">{budgetData.budgetUtilization}%</span>
            </div>
            <Progress value={budgetData.budgetUtilization} className="h-3" />
            <div className="flex justify-between text-xs text-slate-500">
              <span>Spent: {formatCurrency(budgetData.spentAmount)}</span>
              <span>Target: {formatCurrency(budgetData.projectedSpend)}</span>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-xs text-slate-500">Daily Burn Rate</p>
              <div className="flex items-center gap-1">
                <p className="text-lg font-semibold text-slate-800">
                  {formatCurrency(budgetData.burnRate)}
                </p>
                {budgetData.trends.weeklySpend > 0 ? (
                  <TrendingUp className="w-3 h-3 text-red-500" />
                ) : (
                  <TrendingDown className="w-3 h-3 text-green-500" />
                )}
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-slate-500">Days Remaining</p>
              <div className="flex items-center gap-1">
                <p className="text-lg font-semibold text-slate-800">
                  {budgetData.daysRemaining}
                </p>
                <Calendar className="w-3 h-3 text-slate-500" />
              </div>
            </div>
          </div>

          {/* Category Breakdown */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-slate-700">Category Breakdown</h4>
              <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
                <BarChart3 className="w-3 h-3 mr-1" />
                Details
              </Button>
            </div>
            <div className="space-y-2">
              {budgetData.categories.slice(0, 3).map((category, index) => (
                <div key={category.name} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-600">{category.name}</span>
                    <span className="font-medium">
                      {formatCurrency(category.spent)} / {formatCurrency(category.allocated)}
                    </span>
                  </div>
                  <Progress value={category.percentage} className="h-1.5" />
                </div>
              ))}
            </div>
          </div>

          {/* Forecast */}
          <div className="bg-slate-50 rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-slate-700">Projection</h4>
              {budgetData.trends.projectedOverrun < 0 ? (
                <Badge variant="secondary" className="text-green-600 bg-green-100 text-xs">
                  Under Budget
                </Badge>
              ) : (
                <Badge variant="secondary" className="text-red-600 bg-red-100 text-xs">
                  Over Budget
                </Badge>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-slate-500">Projected Total:</span>
                <span className="font-medium ml-1">
                  {formatCurrency(budgetData.projectedSpend)}
                </span>
              </div>
              <div>
                <span className="text-slate-500">Variance:</span>
                <span className={cn(
                  "font-medium ml-1",
                  budgetData.trends.projectedOverrun < 0 ? "text-green-600" : "text-red-600"
                )}>
                  {budgetData.trends.projectedOverrun < 0 ? '-' : '+'}
                  {formatCurrency(Math.abs(budgetData.trends.projectedOverrun))}
                </span>
              </div>
            </div>
          </div>

          {/* Last Updated */}
          <div className="text-xs text-slate-500 text-center pt-2 border-t">
            Updated {budgetData.lastUpdated}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
