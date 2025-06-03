import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, XCircle, AlertCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatusIndicatorProps {
  status: "idle" | "loading" | "success" | "error" | "warning";
  message?: string;
  showIcon?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  status,
  message,
  showIcon = true,
  size = "md",
  className
}) => {
  const getSizeClasses = () => {
    switch (size) {
      case "sm":
        return "w-3 h-3 text-xs";
      case "lg":
        return "w-6 h-6 text-base";
      default:
        return "w-4 h-4 text-sm";
    }
  };

  const getStatusStyles = () => {
    switch (status) {
      case "loading":
        return {
          dot: "bg-blue-500",
          text: "text-blue-600 dark:text-blue-400",
          icon: Loader2,
          iconClass: "animate-spin text-blue-500"
        };
      case "success":
        return {
          dot: "bg-green-500",
          text: "text-green-600 dark:text-green-400",
          icon: CheckCircle,
          iconClass: "text-green-500"
        };
      case "error":
        return {
          dot: "bg-red-500",
          text: "text-red-600 dark:text-red-400",
          icon: XCircle,
          iconClass: "text-red-500"
        };
      case "warning":
        return {
          dot: "bg-yellow-500",
          text: "text-yellow-600 dark:text-yellow-400",
          icon: AlertCircle,
          iconClass: "text-yellow-500"
        };
      default:
        return {
          dot: "bg-gray-500",
          text: "text-gray-600 dark:text-gray-400",
          icon: null,
          iconClass: "text-gray-500"
        };
    }
  };

  const statusConfig = getStatusStyles();
  const Icon = statusConfig.icon;

  return (
    <motion.div
      className={cn("flex items-center gap-2", className)}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
    >
      <AnimatePresence mode="wait">
        {showIcon && Icon ? (
          <motion.div
            key={status}
            initial={{ opacity: 0, rotate: -90 }}
            animate={{ opacity: 1, rotate: 0 }}
            exit={{ opacity: 0, rotate: 90 }}
            transition={{ duration: 0.2 }}
          >
            <Icon className={cn(getSizeClasses(), statusConfig.iconClass)} />
          </motion.div>
        ) : (
          <motion.div
            key={status}
            className={cn(
              "rounded-full",
              getSizeClasses().split(' ')[0] + ' ' + getSizeClasses().split(' ')[1],
              statusConfig.dot,
              status === "loading" && "animate-pulse"
            )}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.2 }}
          />
        )}
      </AnimatePresence>
      
      {message && (
        <motion.span
          className={cn(
            "font-medium",
            getSizeClasses().split(' ')[2],
            statusConfig.text
          )}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.2, delay: 0.1 }}
        >
          {message}
        </motion.span>
      )}
    </motion.div>
  );
};

export { StatusIndicator };