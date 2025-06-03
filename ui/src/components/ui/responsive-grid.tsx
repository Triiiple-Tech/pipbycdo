import React from 'react';
import { cn } from '@/lib/utils';
import { useDeviceType } from '@/hooks/use-mobile';

interface ResponsiveGridProps {
  children: React.ReactNode;
  className?: string;
  cols?: {
    mobile?: number;
    tablet?: number;
    desktop?: number;
    wide?: number;
  };
  gap?: 'sm' | 'md' | 'lg' | 'xl';
  responsive?: boolean;
  minItemWidth?: string; // e.g., "200px", "15rem"
}

export function ResponsiveGrid({
  children,
  className,
  cols = { mobile: 1, tablet: 2, desktop: 3, wide: 4 },
  gap = 'md',
  responsive = true,
  minItemWidth,
}: ResponsiveGridProps) {
  const deviceType = useDeviceType();

  const getGridCols = () => {
    if (!responsive) {
      return '';
    }

    if (minItemWidth) {
      return `grid-cols-[repeat(auto-fit,minmax(${minItemWidth},1fr))]`;
    }

    // Default responsive grid based on device type
    const colsMap = {
      mobile: cols.mobile || 1,
      tablet: cols.tablet || 2,
      desktop: cols.desktop || 3,
      wide: cols.wide || 4,
    };

    const currentCols = colsMap[deviceType];
    
    // Generate Tailwind classes for responsive grid
    return cn(
      `grid-cols-${cols.mobile || 1}`,
      `sm:grid-cols-${cols.tablet || 2}`,
      `md:grid-cols-${cols.desktop || 3}`,
      `lg:grid-cols-${cols.wide || 4}`
    );
  };

  const getGapClass = () => {
    const gapMap = {
      sm: 'gap-2 sm:gap-3',
      md: 'gap-3 sm:gap-4 lg:gap-6',
      lg: 'gap-4 sm:gap-6 lg:gap-8',
      xl: 'gap-6 sm:gap-8 lg:gap-12',
    };
    return gapMap[gap];
  };

  return (
    <div
      className={cn(
        'grid',
        getGridCols(),
        getGapClass(),
        className
      )}
    >
      {children}
    </div>
  );
}

interface ResponsiveStackProps {
  children: React.ReactNode;
  className?: string;
  direction?: {
    mobile?: 'row' | 'col';
    tablet?: 'row' | 'col';
    desktop?: 'row' | 'col';
  };
  gap?: 'sm' | 'md' | 'lg' | 'xl';
  align?: 'start' | 'center' | 'end' | 'stretch';
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
}

export function ResponsiveStack({
  children,
  className,
  direction = { mobile: 'col', tablet: 'row', desktop: 'row' },
  gap = 'md',
  align = 'start',
  justify = 'start',
}: ResponsiveStackProps) {
  const getDirectionClasses = () => {
    const mobile = direction.mobile || 'col';
    const tablet = direction.tablet || 'row';
    const desktop = direction.desktop || 'row';

    return cn(
      `flex-${mobile}`,
      `sm:flex-${tablet}`,
      `lg:flex-${desktop}`
    );
  };

  const getGapClass = () => {
    const gapMap = {
      sm: 'gap-2',
      md: 'gap-4',
      lg: 'gap-6',
      xl: 'gap-8',
    };
    return gapMap[gap];
  };

  const getAlignClass = () => {
    const alignMap = {
      start: 'items-start',
      center: 'items-center',
      end: 'items-end',
      stretch: 'items-stretch',
    };
    return alignMap[align];
  };

  const getJustifyClass = () => {
    const justifyMap = {
      start: 'justify-start',
      center: 'justify-center',
      end: 'justify-end',
      between: 'justify-between',
      around: 'justify-around',
      evenly: 'justify-evenly',
    };
    return justifyMap[justify];
  };

  return (
    <div
      className={cn(
        'flex',
        getDirectionClasses(),
        getGapClass(),
        getAlignClass(),
        getJustifyClass(),
        className
      )}
    >
      {children}
    </div>
  );
}

interface ResponsiveContainerProps {
  children: React.ReactNode;
  className?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  padding?: boolean;
  center?: boolean;
}

export function ResponsiveContainer({
  children,
  className,
  maxWidth = 'xl',
  padding = true,
  center = true,
}: ResponsiveContainerProps) {
  const getMaxWidthClass = () => {
    if (maxWidth === 'full') return 'w-full';
    return `max-w-${maxWidth}`;
  };

  return (
    <div
      className={cn(
        'w-full',
        getMaxWidthClass(),
        center && 'mx-auto',
        padding && 'px-4 sm:px-6 lg:px-8',
        className
      )}
    >
      {children}
    </div>
  );
}

// Responsive breakpoint utilities
export const breakpoints = {
  mobile: '(max-width: 639px)',
  tablet: '(min-width: 640px) and (max-width: 1023px)',
  desktop: '(min-width: 1024px)',
  wide: '(min-width: 1280px)',
} as const;

// Hook for responsive breakpoint matching
export function useBreakpoint(breakpoint: keyof typeof breakpoints) {
  const [matches, setMatches] = React.useState(false);

  React.useEffect(() => {
    const mediaQuery = window.matchMedia(breakpoints[breakpoint]);
    setMatches(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    mediaQuery.addEventListener('change', handler);

    return () => mediaQuery.removeEventListener('change', handler);
  }, [breakpoint]);

  return matches;
}