import React from 'react';
import { cn } from '@/lib/utils';
import { useImageOptimization, useLazyLoading } from '@/hooks/use-performance';
import { useDeviceType } from '@/hooks/use-mobile';

interface ResponsiveImageProps {
  src: string;
  alt: string;
  className?: string;
  aspectRatio?: 'square' | '16/9' | '4/3' | '3/2' | 'auto';
  sizes?: {
    mobile?: string;
    tablet?: string;
    desktop?: string;
  };
  fallback?: string;
  lazy?: boolean;
  priority?: boolean;
}

export function ResponsiveImage({
  src,
  alt,
  className,
  aspectRatio = 'auto',
  sizes,
  fallback,
  lazy = true,
  priority = false,
}: ResponsiveImageProps) {
  const deviceType = useDeviceType();
  const { getOptimizedImageProps, shouldOptimize } = useImageOptimization();
  const { ref: lazyRef, isIntersecting } = useLazyLoading();
  const [imageError, setImageError] = React.useState(false);
  const [isLoaded, setIsLoaded] = React.useState(false);

  const shouldLoad = !lazy || isIntersecting || priority;

  const getAspectRatioClass = () => {
    switch (aspectRatio) {
      case 'square':
        return 'aspect-square';
      case '16/9':
        return 'aspect-video';
      case '4/3':
        return 'aspect-[4/3]';
      case '3/2':
        return 'aspect-[3/2]';
      default:
        return '';
    }
  };

  const getResponsiveSrc = () => {
    if (sizes) {
      switch (deviceType) {
        case 'mobile':
          return sizes.mobile || src;
        case 'tablet':
          return sizes.tablet || src;
        case 'desktop':
        case 'wide':
          return sizes.desktop || src;
        default:
          return src;
      }
    }
    return src;
  };

  const imageSrc = imageError && fallback ? fallback : getResponsiveSrc();
  const optimizedProps = getOptimizedImageProps(imageSrc, alt);

  return (
    <div
      ref={lazyRef}
      className={cn(
        'relative overflow-hidden bg-gray-100 dark:bg-gray-800',
        getAspectRatioClass(),
        className
      )}
    >
      {shouldLoad && (
        <>
          {/* Loading placeholder */}
          {!isLoaded && (
            <div
              className={cn(
                'absolute inset-0 flex items-center justify-center',
                'bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700',
                shouldOptimize ? 'animate-pulse' : 'animate-shimmer'
              )}
            >
              <div className="w-8 h-8 text-gray-400 dark:text-gray-500">
                <svg
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    fillRule="evenodd"
                    d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </div>
          )}

          {/* Actual image */}
          <img
            {...optimizedProps}
            className={cn(
              'w-full h-full object-cover transition-opacity duration-300',
              isLoaded ? 'opacity-100' : 'opacity-0'
            )}
            onLoad={() => setIsLoaded(true)}
            onError={() => setImageError(true)}
            style={{
              // Additional optimization for low-end devices
              ...(shouldOptimize && {
                imageRendering: 'auto',
                willChange: 'auto',
              }),
            }}
          />
        </>
      )}

      {/* Error state */}
      {imageError && !fallback && (
        <div className="absolute inset-0 flex items-center justify-center bg-red-50 dark:bg-red-900/20">
          <div className="text-center">
            <div className="w-8 h-8 mx-auto mb-2 text-red-400">
              <svg
                fill="currentColor"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <p className="text-xs text-red-600 dark:text-red-400">
              Failed to load image
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// Preset responsive image configurations
export const ImagePresets = {
  avatar: {
    aspectRatio: 'square' as const,
    sizes: {
      mobile: '80w',
      tablet: '120w',
      desktop: '160w',
    },
  },
  hero: {
    aspectRatio: '16/9' as const,
    sizes: {
      mobile: '640w',
      tablet: '1024w',
      desktop: '1920w',
    },
  },
  thumbnail: {
    aspectRatio: '4/3' as const,
    sizes: {
      mobile: '200w',
      tablet: '300w',
      desktop: '400w',
    },
  },
  card: {
    aspectRatio: '3/2' as const,
    sizes: {
      mobile: '320w',
      tablet: '480w',
      desktop: '640w',
    },
  },
} as const;