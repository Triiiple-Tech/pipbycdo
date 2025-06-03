import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-opacity-70 focus-visible:scale-105 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0", // Enhanced focus indicators
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-md active:scale-95",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 hover:shadow-md active:scale-95",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground hover:border-accent-foreground/50 hover:shadow-sm active:scale-95",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 hover:shadow-sm active:scale-95",
        ghost: "hover:bg-accent hover:text-accent-foreground hover:shadow-sm active:scale-95",
        link: "text-primary underline-offset-4 hover:underline active:scale-95",
      },
      size: {
        default: "h-10 px-4 py-2 [&_svg]:size-5", // Icon size 20px
        sm: "h-9 rounded-md px-3 [&_svg]:size-4",    // Icon size 16px
        lg: "h-11 rounded-md px-8 [&_svg]:size-6",   // Icon size 24px
        icon: "h-10 w-10 [&_svg]:size-7",            // Icon size 28px (w-7 h-7)
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
