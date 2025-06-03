import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface LoadingStateProps {
  isLoading: boolean;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  variant?: "spinner" | "dots" | "bars" | "pulse" | "skeleton";
  size?: "sm" | "md" | "lg";
  message?: string;
  className?: string;
}

const LoadingSpinner: React.FC<{ size: string }> = ({ size }) => (
  <motion.div
    className={cn(
      "border-2 border-current border-t-transparent rounded-full",
      size === "sm" ? "w-4 h-4" : size === "lg" ? "w-8 h-8" : "w-6 h-6"
    )}
    animate={{ rotate: 360 }}
    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
  />
);

const LoadingDots: React.FC<{ size: string }> = ({ size }) => {
  const dotSize = size === "sm" ? "w-1 h-1" : size === "lg" ? "w-3 h-3" : "w-2 h-2";
  
  return (
    <div className="flex gap-1">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className={cn("bg-current rounded-full", dotSize)}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.5, 1, 0.5]
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            delay: i * 0.2,
            ease: "easeInOut"
          }}
        />
      ))}
    </div>
  );
};

const LoadingBars: React.FC<{ size: string }> = ({ size }) => {
  const barHeight = size === "sm" ? "h-3" : size === "lg" ? "h-6" : "h-4";
  const barWidth = size === "sm" ? "w-0.5" : size === "lg" ? "w-1" : "w-0.5";
  
  return (
    <div className="flex items-end gap-1">
      {[0, 1, 2, 3].map((i) => (
        <motion.div
          key={i}
          className={cn("bg-current", barWidth, barHeight)}
          animate={{
            scaleY: [0.3, 1, 0.3]
          }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            delay: i * 0.1,
            ease: "easeInOut"
          }}
          style={{ originY: 1 }}
        />
      ))}
    </div>
  );
};

const LoadingPulse: React.FC<{ size: string }> = ({ size }) => (
  <motion.div
    className={cn(
      "bg-current rounded-full",
      size === "sm" ? "w-4 h-4" : size === "lg" ? "w-8 h-8" : "w-6 h-6"
    )}
    animate={{
      scale: [1, 1.3, 1],
      opacity: [0.7, 1, 0.7]
    }}
    transition={{
      duration: 1.5,
      repeat: Infinity,
      ease: "easeInOut"
    }}
  />
);

const LoadingSkeleton: React.FC<{ size: string }> = ({ size }) => (
  <div className="space-y-2">
    <motion.div
      className={cn(
        "bg-current rounded-md opacity-20",
        size === "sm" ? "h-3 w-24" : size === "lg" ? "h-6 w-40" : "h-4 w-32"
      )}
      animate={{ opacity: [0.2, 0.5, 0.2] }}
      transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
    />
    <motion.div
      className={cn(
        "bg-current rounded-md opacity-20",
        size === "sm" ? "h-3 w-16" : size === "lg" ? "h-6 w-28" : "h-4 w-24"
      )}
      animate={{ opacity: [0.2, 0.5, 0.2] }}
      transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
    />
  </div>
);

const LoadingState: React.FC<LoadingStateProps> = ({
  isLoading,
  children,
  fallback,
  variant = "spinner",
  size = "md",
  message,
  className
}) => {
  const renderLoader = () => {
    switch (variant) {
      case "dots":
        return <LoadingDots size={size} />;
      case "bars":
        return <LoadingBars size={size} />;
      case "pulse":
        return <LoadingPulse size={size} />;
      case "skeleton":
        return <LoadingSkeleton size={size} />;
      default:
        return <LoadingSpinner size={size} />;
    }
  };

  const defaultFallback = (
    <div className={cn("flex flex-col items-center justify-center gap-3 p-8", className)}>
      <div className="text-muted-foreground">
        {renderLoader()}
      </div>
      {message && (
        <motion.p
          className="text-sm text-muted-foreground text-center"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {message}
        </motion.p>
      )}
    </div>
  );

  return (
    <AnimatePresence mode="wait">
      {isLoading ? (
        <motion.div
          key="loading"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
        >
          {fallback || defaultFallback}
        </motion.div>
      ) : (
        <motion.div
          key="content"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2 }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export { LoadingState };