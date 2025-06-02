import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  Brain,
  FileText,
  MapPin,
  Calculator,
  Shield,
  Download,
  Users,
  Bot,
} from "lucide-react";

export type AgentType =
  | "manager"
  | "file-reader"
  | "trade-mapper"
  | "estimator"
  | "qa-validator"
  | "exporter"
  | "team"
  | "default"; // Added default type

export type AgentStatus = "idle" | "working" | "complete" | "error" | "pending"; // Added pending

interface AgentAvatarProps {
  type: AgentType;
  status: AgentStatus;
  name: string; // Name is now for the label, not directly part of avatar visual
  role?: string; // Added role for sub-label
  model?: string; // Added model for sub-label
  costBadge?: boolean; // Added for optional cost badge
  className?: string;
  showLabel?: boolean; // Controls visibility of name, role, model, status badge
  size?: "sm" | "md" | "lg" | "xl"; // Added xl size
}

// Agent Color Map from Design Brief
const agentColorMap: Record<AgentType, string> = {
  manager: "agent-blue",
  "file-reader": "agent-teal",
  "trade-mapper": "agent-green",
  estimator: "agent-blue", // Example: Re-using colors or define new ones
  "qa-validator": "agent-teal",
  exporter: "agent-green",
  team: "slate-500", // Neutral for team/generic
  default: "slate-400", // Fallback color
};

const agentIconMap: Record<AgentType, typeof Brain> = {
  manager: Brain,
  "file-reader": FileText,
  "trade-mapper": MapPin,
  estimator: Calculator,
  "qa-validator": Shield,
  exporter: Download,
  team: Users,
  default: Bot, // Fallback icon
};

// Status-specific animations and visual cues
const statusConfig: Record<
  AgentStatus,
  {
    baseRingColor: string; // e.g., 'ring-slate-300'
    activeRingColor?: string; // e.g., 'ring-agent-blue' for working state
    animation?: string; // e.g., 'animate-pulse-glow'
    iconAnimation?: string; // e.g. 'animate-spin'
    statusDotColor?: string; // e.g., 'bg-agent-blue'
    statusDotAnimation?: string; // e.g., 'animate-ping'
  }
> = {
  idle: {
    baseRingColor: "ring-slate-300",
    animation: "animate-pulse-subtle", // Subtle breathing
  },
  pending: {
    baseRingColor: "ring-slate-400",
    animation: "animate-pulse opacity-75", // Pulsing with reduced opacity
  },
  working: {
    baseRingColor: "ring-transparent", // Base ring is transparent as activeRing will take over
    animation: "animate-pulse-glow", // Active pulsing glow
    iconAnimation: "animate-none", // No spin, but could be agent-specific later
    statusDotColor: "dynamic", // Will be set dynamically
    statusDotAnimation: "animate-ping",
  },
  complete: {
    baseRingColor: "ring-green-500", // Success indication
    statusDotColor: "bg-green-500",
  },
  error: {
    baseRingColor: "ring-red-500", // Error indication
    animation: "animate-bounce-subtle",
    statusDotColor: "bg-red-500",
    statusDotAnimation: "animate-ping",
  },
};

export function AgentAvatar({
  type,
  status,
  name,
  role,
  model,
  costBadge, // Prop for cost badge (implementation separate)
  className,
  showLabel = false,
  size = "md",
}: AgentAvatarProps) {
  const agentBaseColor = agentColorMap[type] || agentColorMap.default;
  const IconComponent = agentIconMap[type] || agentIconMap.default;
  const currentStatusConfig = statusConfig[status];

  const sizeClasses = {
    sm: "w-10 h-10", // Adjusted sizes
    md: "w-16 h-16",
    lg: "w-20 h-20",
    xl: "w-24 h-24",
  };

  const iconSizeClasses = {
    sm: "w-5 h-5", // Adjusted icon sizes
    md: "w-8 h-8",
    lg: "w-10 h-10",
    xl: "w-12 h-12",
  };

  // Get the appropriate ring color for working status
  const getRingColor = () => {
    if (status === "working") {
      return `ring-${agentBaseColor}`;
    }
    return currentStatusConfig.baseRingColor;
  };

  // Get the appropriate text color for the icon
  const getIconColor = () => {
    return `text-${agentBaseColor}`;
  };

  // Get the appropriate background color for status dot
  const getStatusDotColor = () => {
    if (status === "working") {
      return `bg-${agentBaseColor}`;
    }
    return currentStatusConfig.statusDotColor || "";
  };

  // Style for dynamic glow color
  const getGlowStyle = () => {
    if (status === "working" && agentBaseColor) {
      // Map agent color to CSS variable for glow
      const colorMap: Record<string, string> = {
        "agent-blue": "hsl(var(--agent-blue))",
        "agent-teal": "hsl(var(--agent-teal))",
        "agent-green": "hsl(var(--agent-green))",
        "slate-500": "hsl(215 25% 27%)", // fallback for neutral colors
        "slate-400": "hsl(215 20% 65%)",
      };
      return {
        "--tw-shadow-color": colorMap[agentBaseColor] || "hsl(215 25% 27%)",
      } as React.CSSProperties;
    }
    return {};
  };

  return (
    <div className={cn("flex flex-col items-center gap-3", className)}>
      <div
        className={cn(
          "relative rounded-full flex items-center justify-center",
          "bg-white/30 backdrop-blur-md shadow-lg", // Glassmorphic base
          "ring-2 ring-offset-2 ring-offset-transparent", // Base ring structure
          getRingColor(),
          currentStatusConfig.animation,
          sizeClasses[size]
        )}
        style={getGlowStyle()}
        title={`${name} - ${status.charAt(0).toUpperCase() + status.slice(1)}`}
      >
        <IconComponent
          className={cn(
            iconSizeClasses[size],
            getIconColor(), // Icon color from agent type
            currentStatusConfig.iconAnimation
          )}
        />

        {/* Status Indicator Dot - more prominent and uses agent color */}
        {(status === "working" || status === "error" || status === "complete" || status === "pending") && (
          <div
            className={cn(
              "absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-slate-800",
              getStatusDotColor()
            )}
          >
            {(status === "working" || status === "error") && currentStatusConfig.statusDotAnimation && (
              <div
                className={cn(
                  "absolute inset-0 rounded-full",
                  currentStatusConfig.statusDotAnimation,
                  getStatusDotColor()
                )}
              />
            )}
          </div>
        )}
      </div>

      {showLabel && (
        <div className="text-center">
          <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">
            {name}
          </div>
          {role && (
            <div className="text-xs text-slate-500 dark:text-slate-400">
              {role}
            </div>
          )}
          {model && (
            <Badge
              variant="outline"
              className="mt-1 text-xs border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
            >
              {model}
            </Badge>
          )}
          {/* CostBadge would be a separate component, potentially passed as a child or controlled here */}
          {/* Example: {costBadge && <CostBadge amount={...} />} */}
        </div>
      )}
    </div>
  );
}
