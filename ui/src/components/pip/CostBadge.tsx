import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Zap, DollarSign, Clock, RefreshCw } from "lucide-react";

export type ModelType =
  | "gpt-4"
  | "gpt-3.5"
  | "claude-3"
  | "local"
  | "specialized"
  | "enhanced-routing"
  | "gpt-4-turbo" // Added
  | "claude-3-opus" // Added
  | "gemini-pro" // Added
  | "gpt-3.5-turbo"; // Added

interface CostBadgeProps {
  model: ModelType;
  cost: number;
  duration: number;
  onRetry?: () => void;
  className?: string;
  format?: 'currency' | 'tokens' | 'both';
}

const modelConfig: Record<
  ModelType,
  { icon: typeof Zap; color: string; label: string }
> = {
  "gpt-4": { icon: Zap, color: "purple-500", label: "GPT-4" },
  "gpt-3.5": { icon: Zap, color: "blue-500", label: "GPT-3.5" },
  "claude-3": { icon: Zap, color: "orange-500", label: "Claude-3" },
  local: { icon: Zap, color: "green-500", label: "Local" },
  specialized: { icon: Zap, color: "cdo-500", label: "Specialized" },
  "enhanced-routing": { icon: Zap, color: "red-500", label: "Enhanced Routing" },
  "gpt-4-turbo": { icon: Zap, color: "teal-500", label: "GPT-4 Turbo" }, // Added
  "claude-3-opus": { icon: Zap, color: "amber-500", label: "Claude 3 Opus" }, // Added
  "gemini-pro": { icon: Zap, color: "sky-500", label: "Gemini Pro" }, // Added
  "gpt-3.5-turbo": { icon: Zap, color: "indigo-500", label: "GPT-3.5 Turbo" }, // Added
};

export function CostBadge({
  model,
  cost,
  duration,
  onRetry,
  className,
  format = 'currency',
}: CostBadgeProps) {
  const config = modelConfig[model];
  const Icon = config.icon;

  const formatCost = (cost: number) => {
    if (cost < 0.01) return `$${(cost * 1000).toFixed(1)}m`;
    return `$${cost.toFixed(3)}`;
  };

  const formatTokens = (cost: number) => {
    // Estimate tokens based on cost (rough approximation)
    // GPT-4: ~$0.03 per 1K tokens, GPT-3.5: ~$0.002 per 1K tokens
    const tokensPerDollar = model.includes('gpt-4') ? 33333 : 500000;
    const estimatedTokens = Math.round(cost * tokensPerDollar);
    return estimatedTokens > 1000 ? `${(estimatedTokens / 1000).toFixed(1)}K` : `${estimatedTokens}`;
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const getCostDisplay = () => {
    switch (format) {
      case 'tokens':
        return `${formatTokens(cost)} tokens`;
      case 'both':
        return `${formatCost(cost)} / ${formatTokens(cost)} tokens`;
      case 'currency':
      default:
        return formatCost(cost);
    }
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className={cn("flex items-center gap-1", className)}>
          <Badge
            variant="outline"
            className={cn(
              "text-xs bg-black/20 border-white/20 text-white/80 backdrop-blur-sm",
              "hover:bg-black/30 transition-colors cursor-help",
            )}
          >
            <Icon className={cn("w-3 h-3 mr-1", `text-${config.color}`)} />
            {config.label}
          </Badge>

          <Badge
            variant="outline"
            className="text-xs bg-black/20 border-white/20 text-white/80 backdrop-blur-sm"
          >
            <DollarSign className="w-3 h-3 mr-1 text-red-400" />
            {getCostDisplay()}
          </Badge>

          <Badge
            variant="outline"
            className="text-xs bg-black/20 border-white/20 text-white/80 backdrop-blur-sm"
          >
            <Clock className="w-3 h-3 mr-1 text-gray-400" />
            {formatDuration(duration)}
          </Badge>

          {onRetry && (
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0 hover:bg-white/10"
              onClick={onRetry}
            >
              <RefreshCw className="w-3 h-3 text-white/60 hover:text-white/90" />
            </Button>
          )}
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <div className="text-sm">
          <div className="font-medium">{config.label} Model</div>
          <div className="text-muted-foreground">
            Cost: {formatCost(cost)} • Duration: {formatDuration(duration)}
          </div>
          {onRetry && (
            <div className="text-xs text-muted-foreground mt-1">
              Click refresh to retry with different model
            </div>
          )}
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
