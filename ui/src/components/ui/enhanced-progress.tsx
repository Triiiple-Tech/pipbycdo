import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface EnhancedProgressProps extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> {
  variant?: "default" | "success" | "error" | "warning";
  showPulse?: boolean;
  animated?: boolean;
  label?: string;
}

const EnhancedProgress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  EnhancedProgressProps
>(({ className, value, variant = "default", showPulse = false, animated = true, label, ...props }, ref) => {
  const getVariantStyles = () => {
    switch (variant) {
      case "success":
        return "bg-green-500";
      case "error":
        return "bg-red-500";
      case "warning":
        return "bg-yellow-500";
      default:
        return "bg-primary";
    }
  };

  return (
    <div className="w-full space-y-2">
      {label && (
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-foreground">{label}</span>
          <span className="text-sm text-muted-foreground">{Math.round(value || 0)}%</span>
        </div>
      )}
      <ProgressPrimitive.Root
        ref={ref}
        className={cn(
          "relative h-2 w-full overflow-hidden rounded-full bg-secondary",
          className,
        )}
        {...props}
      >
        <ProgressPrimitive.Indicator
          className={cn(
            "h-full w-full flex-1 transition-all duration-500 ease-out",
            getVariantStyles(),
            showPulse && "animate-pulse"
          )}
          style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
          asChild={animated}
        >
          {animated ? (
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              style={{ originX: 0 }}
            />
          ) : (
            <div />
          )}
        </ProgressPrimitive.Indicator>
      </ProgressPrimitive.Root>
    </div>
  );
});
EnhancedProgress.displayName = "EnhancedProgress";

export { EnhancedProgress };