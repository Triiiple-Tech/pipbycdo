import * as React from "react";

// Responsive breakpoints following Tailwind CSS standards
export const BREAKPOINTS = {
  mobile: 640,   // sm
  tablet: 768,   // md  
  desktop: 1024, // lg
  wide: 1280,    // xl
} as const;

export type DeviceType = 'mobile' | 'tablet' | 'desktop' | 'wide';

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(
    undefined,
  );

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${BREAKPOINTS.mobile - 1}px)`);
    const onChange = () => {
      setIsMobile(window.innerWidth < BREAKPOINTS.mobile);
    };
    mql.addEventListener("change", onChange);
    setIsMobile(window.innerWidth < BREAKPOINTS.mobile);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return !!isMobile;
}

export function useDeviceType(): DeviceType {
  const [deviceType, setDeviceType] = React.useState<DeviceType>('desktop');

  React.useEffect(() => {
    const updateDeviceType = () => {
      const width = window.innerWidth;
      if (width < BREAKPOINTS.mobile) {
        setDeviceType('mobile');
      } else if (width < BREAKPOINTS.tablet) {
        setDeviceType('tablet');
      } else if (width < BREAKPOINTS.desktop) {
        setDeviceType('desktop');
      } else {
        setDeviceType('wide');
      }
    };

    // Create media query listeners for each breakpoint
    const mediaQueries = [
      window.matchMedia(`(max-width: ${BREAKPOINTS.mobile - 1}px)`),
      window.matchMedia(`(min-width: ${BREAKPOINTS.mobile}px) and (max-width: ${BREAKPOINTS.tablet - 1}px)`),
      window.matchMedia(`(min-width: ${BREAKPOINTS.tablet}px) and (max-width: ${BREAKPOINTS.desktop - 1}px)`),
      window.matchMedia(`(min-width: ${BREAKPOINTS.desktop}px)`),
    ];

    // Add listeners to all media queries
    mediaQueries.forEach(mql => mql.addEventListener("change", updateDeviceType));
    
    // Set initial value
    updateDeviceType();

    // Cleanup listeners
    return () => {
      mediaQueries.forEach(mql => mql.removeEventListener("change", updateDeviceType));
    };
  }, []);

  return deviceType;
}

export function useIsTablet() {
  const deviceType = useDeviceType();
  return deviceType === 'tablet';
}

export function useIsDesktop() {
  const deviceType = useDeviceType();
  return deviceType === 'desktop' || deviceType === 'wide';
}
