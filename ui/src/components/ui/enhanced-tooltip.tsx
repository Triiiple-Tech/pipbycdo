import * as React from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface EnhancedTooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
  delayDuration?: number;
  variant?: "default" | "info" | "success" | "warning" | "error";
  showArrow?: boolean;
}

const EnhancedTooltip: React.FC<EnhancedTooltipProps> = ({
  content,
  children,
  side = "top",
  align = "center",
  delayDuration = 300,
  variant = "default",
  showArrow = true
}) => {
  const [open, setOpen] = React.useState(false);

  const getVariantStyles = () => {
    switch (variant) {
      case "info":
        return "bg-blue-900 text-blue-100 border-blue-700";
      case "success":
        return "bg-green-900 text-green-100 border-green-700";
      case "warning":
        return "bg-yellow-900 text-yellow-100 border-yellow-700";
      case "error":
        return "bg-red-900 text-red-100 border-red-700";
      default:
        return "bg-popover text-popover-foreground border";
    }
  };

  return (
    <TooltipPrimitive.Provider delayDuration={delayDuration}>
      <TooltipPrimitive.Root open={open} onOpenChange={setOpen}>
        <TooltipPrimitive.Trigger asChild>
          {children}
        </TooltipPrimitive.Trigger>
        <AnimatePresence>
          {open && (
            <TooltipPrimitive.Portal forceMount>
              <TooltipPrimitive.Content
                side={side}
                align={align}
                sideOffset={8}
                className="z-50 overflow-hidden rounded-lg px-3 py-2 text-sm shadow-lg"
                asChild
              >
                <motion.div
                  className={cn(
                    "max-w-xs",
                    getVariantStyles()
                  )}
                  initial={{
                    opacity: 0,
                    scale: 0.8,
                    y: side === "top" ? 10 : side === "bottom" ? -10 : 0,
                    x: side === "left" ? 10 : side === "right" ? -10 : 0
                  }}
                  animate={{
                    opacity: 1,
                    scale: 1,
                    y: 0,
                    x: 0
                  }}
                  exit={{
                    opacity: 0,
                    scale: 0.8,
                    y: side === "top" ? 10 : side === "bottom" ? -10 : 0,
                    x: side === "left" ? 10 : side === "right" ? -10 : 0
                  }}
                  transition={{
                    duration: 0.15,
                    ease: "easeOut"
                  }}
                >
                  {content}
                  {showArrow && (
                    <TooltipPrimitive.Arrow
                      className={cn(
                        "fill-current",
                        variant === "default" ? "text-border" : getVariantStyles().split(' ')[0].replace('bg-', 'text-')
                      )}
                      width={12}
                      height={6}
                    />
                  )}
                </motion.div>
              </TooltipPrimitive.Content>
            </TooltipPrimitive.Portal>
          )}
        </AnimatePresence>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  );
};

export { EnhancedTooltip };