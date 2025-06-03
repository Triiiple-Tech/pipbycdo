import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const enhancedButtonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow hover:bg-primary/90 hover:shadow-lg active:scale-95",
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90 hover:shadow-lg active:scale-95",
        outline:
          "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground hover:border-accent-foreground/50 hover:shadow-md active:scale-95",
        secondary:
          "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80 hover:shadow-md active:scale-95",
        ghost: 
          "hover:bg-accent hover:text-accent-foreground hover:shadow-sm active:scale-95",
        link: 
          "text-primary underline-offset-4 hover:underline active:scale-95",
        success:
          "bg-green-600 text-white shadow hover:bg-green-700 hover:shadow-lg active:scale-95",
        warning:
          "bg-yellow-600 text-white shadow hover:bg-yellow-700 hover:shadow-lg active:scale-95",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9",
      },
      animation: {
        none: "",
        subtle: "hover:scale-105",
        bounce: "hover:scale-105 active:scale-95",
        pulse: "hover:scale-105 active:scale-95 focus:animate-pulse",
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      animation: "bounce",
    },
  }
);

export interface EnhancedButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof enhancedButtonVariants> {
  asChild?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const EnhancedButton = React.forwardRef<HTMLButtonElement, EnhancedButtonProps>(
  ({ className, variant, size, animation, asChild = false, loading = false, icon, rightIcon, children, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : motion.button;
    
    const buttonContent = (
      <>
        {loading ? (
          <motion.div
            className="w-4 h-4 border-2 border-current border-t-transparent rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
        ) : (
          icon && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.2 }}
            >
              {icon}
            </motion.div>
          )
        )}
        {children}
        {rightIcon && !loading && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.2, delay: 0.1 }}
          >
            {rightIcon}
          </motion.div>
        )}
      </>
    );

    return (
      <Comp
        className={cn(enhancedButtonVariants({ variant, size, animation, className }))}
        ref={ref}
        disabled={disabled || loading}
        whileHover={animation !== "none" ? { scale: 1.05 } : undefined}
        whileTap={animation !== "none" ? { scale: 0.95 } : undefined}
        transition={{ duration: 0.15, ease: "easeInOut" }}
        {...props}
      >
        {buttonContent}
      </Comp>
    );
  }
);
EnhancedButton.displayName = "EnhancedButton";

export { EnhancedButton, enhancedButtonVariants };