import { useEffect, useState } from 'react';
import { useDeviceType } from './use-mobile';

interface PerformanceMetrics {
  connectionType?: string;
  effectiveType?: string;
  isLowEnd?: boolean;
  memoryLevel?: 'low' | 'medium' | 'high';
  shouldOptimize?: boolean;
}

export function usePerformanceOptimization(): PerformanceMetrics {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({});
  const deviceType = useDeviceType();

  useEffect(() => {
    // Check device capabilities
    const checkPerformance = () => {
      const newMetrics: PerformanceMetrics = {};

      // Check network connection
      if ('connection' in navigator) {
        const connection = (navigator as any).connection;
        newMetrics.connectionType = connection?.type;
        newMetrics.effectiveType = connection?.effectiveType;
      }

      // Check device memory (Chrome only)
      if ('deviceMemory' in navigator) {
        const memory = (navigator as any).deviceMemory;
        if (memory <= 2) {
          newMetrics.memoryLevel = 'low';
        } else if (memory <= 4) {
          newMetrics.memoryLevel = 'medium';
        } else {
          newMetrics.memoryLevel = 'high';
        }
      }

      // Check hardware concurrency
      const cores = navigator.hardwareConcurrency || 4;
      newMetrics.isLowEnd = cores <= 2;

      // Determine if we should optimize
      newMetrics.shouldOptimize = 
        deviceType === 'mobile' ||
        newMetrics.memoryLevel === 'low' ||
        newMetrics.isLowEnd ||
        newMetrics.effectiveType === 'slow-2g' ||
        newMetrics.effectiveType === '2g' ||
        newMetrics.effectiveType === '3g';

      setMetrics(newMetrics);
    };

    checkPerformance();

    // Listen for network changes
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      connection?.addEventListener('change', checkPerformance);
      
      return () => {
        connection?.removeEventListener('change', checkPerformance);
      };
    }
  }, [deviceType]);

  return metrics;
}

export function useVirtualScrolling(
  items: any[],
  itemHeight: number,
  containerHeight: number,
  enabled: boolean = true
) {
  const [visibleItems, setVisibleItems] = useState<{ start: number; end: number }>({
    start: 0,
    end: Math.ceil(containerHeight / itemHeight),
  });

  const [scrollTop, setScrollTop] = useState(0);

  useEffect(() => {
    if (!enabled) {
      setVisibleItems({ start: 0, end: items.length });
      return;
    }

    const buffer = 5; // Render extra items for smooth scrolling
    const start = Math.max(0, Math.floor(scrollTop / itemHeight) - buffer);
    const end = Math.min(
      items.length,
      Math.ceil((scrollTop + containerHeight) / itemHeight) + buffer
    );

    setVisibleItems({ start, end });
  }, [scrollTop, itemHeight, containerHeight, items.length, enabled]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  };

  return {
    visibleItems,
    handleScroll,
    totalHeight: items.length * itemHeight,
    offsetY: visibleItems.start * itemHeight,
  };
}

export function useLazyLoading(threshold = 0.1) {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [ref, setRef] = useState<Element | null>(null);

  useEffect(() => {
    if (!ref) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
      },
      { threshold }
    );

    observer.observe(ref);

    return () => {
      observer.disconnect();
    };
  }, [ref, threshold]);

  return { ref: setRef, isIntersecting };
}

export function useImageOptimization() {
  const { shouldOptimize } = usePerformanceOptimization();

  const getOptimizedImageProps = (src: string, alt: string) => {
    return {
      src,
      alt,
      loading: 'lazy' as const,
      decoding: 'async' as const,
      ...(shouldOptimize && {
        // For low-end devices, prefer smaller images
        style: { imageRendering: 'auto' },
      }),
    };
  };

  return { getOptimizedImageProps, shouldOptimize };
}