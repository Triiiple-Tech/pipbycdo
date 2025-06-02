import React from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  Brain,
  AlertTriangle,
  CheckCircle,
  Clock,
  Target,
  Zap,
  Calendar,
  BarChart3,
  Activity,
  Star,
} from "lucide-react";

interface Prediction {
  id: string;
  type: "timeline" | "budget" | "risk" | "performance" | "quality";
  title: string;
  description: string;
  confidence: number; // percentage
  impact: "low" | "medium" | "high";
  timeframe: string;
  recommendation: string;
  trend: "positive" | "negative" | "neutral";
  probability: number; // percentage
  currentValue?: number;
  predictedValue?: number;
  unit?: string;
}

interface PredictiveInsightsData {
  predictions: Prediction[];
  overallRiskScore: number;
  predictiveAccuracy: number;
  lastAnalysis: string;
  modelVersion: string;
  trendsAnalyzed: number;
  recommendations: {
    immediate: string[];
    shortTerm: string[];
    longTerm: string[];
  };
  confidenceMetrics: {
    high: number; // count of high confidence predictions
    medium: number;
    low: number;
  };
}

interface PredictiveInsightsWidgetProps {
  data?: PredictiveInsightsData;
  isLoading?: boolean;
  className?: string;
}

export function PredictiveInsightsWidget({ data, isLoading, className }: PredictiveInsightsWidgetProps) {
  const mockData: PredictiveInsightsData = {
    predictions: [
      {
        id: "pred-1",
        type: "timeline",
        title: "Project Completion Forecast",
        description: "Based on current velocity, project will complete 3 days ahead of schedule",
        confidence: 87,
        impact: "medium",
        timeframe: "14 days",
        recommendation: "Maintain current pace and consider bringing forward next milestone",
        trend: "positive",
        probability: 89,
        currentValue: 74,
        predictedValue: 100,
        unit: "%"
      },
      {
        id: "pred-2",
        type: "budget",
        title: "Budget Utilization Trend",
        description: "Current spending trajectory suggests 8% budget savings opportunity",
        confidence: 92,
        impact: "high",
        timeframe: "30 days",
        recommendation: "Reallocate savings to additional features or quality assurance",
        trend: "positive",
        probability: 85,
        currentValue: 87500,
        predictedValue: 118750,
        unit: "$"
      },
      {
        id: "pred-3",
        type: "risk",
        title: "Resource Bottleneck Alert",
        description: "API rate limits may be reached if current usage pattern continues",
        confidence: 78,
        impact: "high",
        timeframe: "7 days",
        recommendation: "Implement request caching and consider upgrading API tier",
        trend: "negative",
        probability: 73,
      },
      {
        id: "pred-4",
        type: "performance",
        title: "Agent Efficiency Optimization",
        description: "CodeGen Pro agent showing 15% efficiency improvement potential",
        confidence: 84,
        impact: "medium",
        timeframe: "21 days",
        recommendation: "Fine-tune agent parameters and allocate more complex tasks",
        trend: "positive",
        probability: 81,
      },
      {
        id: "pred-5",
        type: "quality",
        title: "Quality Score Projection",
        description: "Quality metrics trending upward, expected to reach 95% by next milestone",
        confidence: 90,
        impact: "medium",
        timeframe: "14 days",
        recommendation: "Continue current testing approach and document best practices",
        trend: "positive",
        probability: 88,
      },
    ],
    overallRiskScore: 23, // lower is better
    predictiveAccuracy: 91,
    lastAnalysis: "12 minutes ago",
    modelVersion: "v2.4.1",
    trendsAnalyzed: 47,
    recommendations: {
      immediate: [
        "Monitor API usage closely for next 48 hours",
        "Review CodeGen Pro task allocation",
      ],
      shortTerm: [
        "Plan feature scope expansion with budget savings",
        "Implement caching strategy for API optimization",
      ],
      longTerm: [
        "Document successful efficiency patterns",
        "Consider advanced API tier for future projects",
      ],
    },
    confidenceMetrics: {
      high: 3, // 80%+ confidence
      medium: 2, // 60-79% confidence
      low: 0, // <60% confidence
    },
  };

  const insightsData = data || mockData;

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case "high":
        return "text-red-600 bg-red-100";
      case "medium":
        return "text-yellow-600 bg-yellow-100";
      case "low":
        return "text-green-600 bg-green-100";
      default:
        return "text-slate-600 bg-slate-100";
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case "positive":
        return "text-green-600";
      case "negative":
        return "text-red-600";
      case "neutral":
        return "text-slate-600";
      default:
        return "text-slate-600";
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "positive":
        return <TrendingUp className="w-4 h-4" />;
      case "negative":
        return <TrendingDown className="w-4 h-4" />;
      case "neutral":
        return <Activity className="w-4 h-4" />;
      default:
        return <Activity className="w-4 h-4" />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "timeline":
        return <Calendar className="w-4 h-4" />;
      case "budget":
        return <BarChart3 className="w-4 h-4" />;
      case "risk":
        return <AlertTriangle className="w-4 h-4" />;
      case "performance":
        return <Zap className="w-4 h-4" />;
      case "quality":
        return <Star className="w-4 h-4" />;
      default:
        return <Target className="w-4 h-4" />;
    }
  };

  const getRiskScoreColor = (score: number) => {
    if (score <= 25) return "text-green-600";
    if (score <= 50) return "text-yellow-600";
    return "text-red-600";
  };

  const formatValue = (value: number | undefined, unit: string | undefined) => {
    if (value === undefined || unit === undefined) return "";
    
    if (unit === "$") {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
      }).format(value);
    }
    
    return `${value}${unit}`;
  };

  if (isLoading) {
    return (
      <Card className={cn("animate-pulse", className)}>
        <CardHeader className="space-y-2">
          <div className="h-5 bg-slate-200 rounded w-3/4"></div>
          <div className="h-4 bg-slate-200 rounded w-1/2"></div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="h-32 bg-slate-200 rounded"></div>
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
      transition={{ duration: 0.3, delay: 0.4 }}
    >
      <Card className={cn("hover:shadow-lg transition-shadow duration-300", className)}>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-[#E60023]" />
              <CardTitle className="text-lg">Predictive Insights</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                Model {insightsData.modelVersion}
              </Badge>
              <Badge 
                variant="secondary" 
                className={cn("text-xs", getRiskScoreColor(insightsData.overallRiskScore))}
              >
                Risk Score: {insightsData.overallRiskScore}
              </Badge>
            </div>
          </div>
          <CardDescription>
            AI-powered predictions and recommendations for project optimization
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Model Performance */}
          <div className="grid grid-cols-3 gap-4 p-3 bg-slate-50 rounded-lg">
            <div className="text-center">
              <p className="text-xs text-slate-500 mb-1">Accuracy</p>
              <p className="text-lg font-bold text-green-600">{insightsData.predictiveAccuracy}%</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-slate-500 mb-1">Trends Analyzed</p>
              <p className="text-lg font-bold text-slate-800">{insightsData.trendsAnalyzed}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-slate-500 mb-1">High Confidence</p>
              <p className="text-lg font-bold text-blue-600">{insightsData.confidenceMetrics.high}</p>
            </div>
          </div>

          {/* Key Predictions */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-slate-700">Key Predictions</h4>
              <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
                <BarChart3 className="w-3 h-3 mr-1" />
                View All
              </Button>
            </div>
            
            <div className="space-y-3">
              {insightsData.predictions.slice(0, 3).map((prediction, index) => (
                <motion.div
                  key={prediction.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index }}
                  className="p-3 border border-slate-200 rounded-lg hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getTypeIcon(prediction.type)}
                      <h5 className="text-sm font-medium text-slate-800">{prediction.title}</h5>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant="secondary" 
                        className={cn("text-xs", getImpactColor(prediction.impact))}
                      >
                        {prediction.impact.toUpperCase()}
                      </Badge>
                      <div className={cn("flex items-center gap-1", getTrendColor(prediction.trend))}>
                        {getTrendIcon(prediction.trend)}
                        <span className="text-xs font-medium">{prediction.confidence}%</span>
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-xs text-slate-600 mb-2">{prediction.description}</p>
                  
                  {prediction.currentValue && prediction.predictedValue && (
                    <div className="flex items-center gap-4 mb-2 text-xs">
                      <span className="text-slate-500">
                        Current: {formatValue(prediction.currentValue, prediction.unit)}
                      </span>
                      <span className="text-slate-500">
                        Predicted: {formatValue(prediction.predictedValue, prediction.unit)}
                      </span>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 text-slate-500">
                      <Clock className="w-3 h-3" />
                      <span>in {prediction.timeframe}</span>
                    </div>
                    <span className="text-slate-500">
                      {prediction.probability}% probability
                    </span>
                  </div>
                  
                  <div className="mt-2 p-2 bg-blue-50 rounded text-xs text-blue-800">
                    <strong>Recommendation:</strong> {prediction.recommendation}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Quick Recommendations */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-slate-700">Immediate Actions</h4>
            <div className="space-y-2">
              {insightsData.recommendations.immediate.map((rec, index) => (
                <div key={index} className="flex items-center gap-2 text-xs">
                  <CheckCircle className="w-3 h-3 text-green-500 flex-shrink-0" />
                  <span className="text-slate-600">{rec}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Confidence Distribution */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-slate-700">Prediction Confidence</h4>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="text-center p-2 bg-green-50 rounded">
                <p className="font-semibold text-green-600">{insightsData.confidenceMetrics.high}</p>
                <p className="text-green-600">High (80%+)</p>
              </div>
              <div className="text-center p-2 bg-yellow-50 rounded">
                <p className="font-semibold text-yellow-600">{insightsData.confidenceMetrics.medium}</p>
                <p className="text-yellow-600">Medium (60-79%)</p>
              </div>
              <div className="text-center p-2 bg-red-50 rounded">
                <p className="font-semibold text-red-600">{insightsData.confidenceMetrics.low}</p>
                <p className="text-red-600">Low (<60%)</p>
              </div>
            </div>
          </div>

          {/* Last Updated */}
          <div className="text-xs text-slate-500 text-center pt-2 border-t">
            Analysis updated {insightsData.lastAnalysis}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
