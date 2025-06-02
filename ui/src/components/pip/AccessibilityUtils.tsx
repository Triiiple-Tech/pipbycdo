import { motion } from 'framer-motion';
import { ReactNode, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface FocusManagerProps {
  children: ReactNode;
  className?: string;
  trapFocus?: boolean;
  restoreFocus?: boolean;
  autoFocus?: boolean;
}

export function FocusManager({ 
  children, 
  className, 
  trapFocus = false, 
  restoreFocus = true,
  autoFocus = false 
}: FocusManagerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (restoreFocus) {
      previousActiveElement.current = document.activeElement as HTMLElement;
    }

    if (autoFocus && containerRef.current) {
      const firstFocusable = containerRef.current.querySelector(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      ) as HTMLElement;
      firstFocusable?.focus();
    }

    return () => {
      if (restoreFocus && previousActiveElement.current) {
        previousActiveElement.current.focus();
      }
    };
  }, [autoFocus, restoreFocus]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!trapFocus) return;

    if (e.key === 'Tab') {
      const focusableElements = containerRef.current?.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );

      if (!focusableElements || focusableElements.length === 0) return;

      const firstElement = focusableElements[0] as HTMLElement;
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    }
  };

  return (
    <div
      ref={containerRef}
      className={cn('focus-within:outline-none', className)}
      onKeyDown={handleKeyDown}
      role="region"
    >
      {children}
    </div>
  );
}

interface AccessibleButtonProps {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  ariaLabel?: string;
  ariaDescribedBy?: string;
}

export function AccessibleButton({
  children,
  onClick,
  disabled = false,
  variant = 'primary',
  size = 'md',
  className,
  ariaLabel,
  ariaDescribedBy,
}: AccessibleButtonProps) {
  const baseClasses = 'focus-ring inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variantClasses = {
    primary: 'bg-cdo-red text-white hover:bg-cdo-red/90 focus-visible:ring-cdo-red',
    secondary: 'bg-slate-100 text-slate-900 hover:bg-slate-200 focus-visible:ring-slate-500',
    ghost: 'bg-transparent hover:bg-slate-100 focus-visible:ring-slate-500'
  };

  const sizeClasses = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-3 text-base',
    lg: 'px-6 py-4 text-lg'
  };

  return (
    <motion.button
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      className={cn(baseClasses, variantClasses[variant], sizeClasses[size], className)}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedBy}
      type="button"
    >
      {children}
    </motion.button>
  );
}

interface SkipLinkProps {
  href: string;
  children: ReactNode;
}

export function SkipLink({ href, children }: SkipLinkProps) {
  return (
    <a
      href={href}
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-cdo-red text-white px-4 py-2 rounded-lg font-medium focus-ring z-50"
    >
      {children}
    </a>
  );
}

interface AnnouncementProps {
  children: ReactNode;
  priority?: 'polite' | 'assertive';
  className?: string;
}

export function Announcement({ children, priority = 'polite', className }: AnnouncementProps) {
  return (
    <div
      className={cn('sr-only', className)}
      aria-live={priority}
      aria-atomic="true"
    >
      {children}
    </div>
  );
}

interface ProgressIndicatorProps {
  value: number;
  max?: number;
  label?: string;
  className?: string;
}

export function ProgressIndicator({ value, max = 100, label, className }: ProgressIndicatorProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  return (
    <div className={cn('w-full', className)}>
      {label && (
        <div className="flex justify-between text-sm font-medium mb-2">
          <span>{label}</span>
          <span>{Math.round(percentage)}%</span>
        </div>
      )}
      <div
        className="w-full bg-slate-200 rounded-full h-2"
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={label || 'Progress'}
      >
        <motion.div
          className="bg-cdo-red h-2 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}
