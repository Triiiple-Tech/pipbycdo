import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

export type ThemeMode = 'light' | 'dark' | 'high-contrast' | 'auto';
export type ColorBlindMode = 'normal' | 'protanopia' | 'deuteranopia' | 'tritanopia' | 'monochrome';
export type FontSize = 'small' | 'medium' | 'large' | 'extra-large';
export type MotionPreference = 'auto' | 'reduced' | 'none';

export interface AccessibilityPreferences {
  // Theme and visual preferences
  themeMode: ThemeMode;
  colorBlindMode: ColorBlindMode;
  fontSize: FontSize;
  highContrast: boolean;
  
  // Motion and interaction preferences
  motionPreference: MotionPreference;
  reducedTransparency: boolean;
  
  // Audio and feedback preferences
  screenReaderOptimized: boolean;
  announceChanges: boolean;
  
  // Keyboard and focus preferences
  enhancedFocus: boolean;
  skipLinks: boolean;
}

const defaultPreferences: AccessibilityPreferences = {
  themeMode: 'auto',
  colorBlindMode: 'normal',
  fontSize: 'medium',
  highContrast: false,
  motionPreference: 'auto',
  reducedTransparency: false,
  screenReaderOptimized: false,
  announceChanges: true,
  enhancedFocus: true,
  skipLinks: true,
};

interface AccessibilityContextType {
  preferences: AccessibilityPreferences;
  updatePreference: <K extends keyof AccessibilityPreferences>(
    key: K,
    value: AccessibilityPreferences[K]
  ) => void;
  resetPreferences: () => void;
  announceToScreenReader: (message: string) => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

const STORAGE_KEY = 'pip-accessibility-preferences';

interface AccessibilityProviderProps {
  children: ReactNode;
}

export function AccessibilityProvider({ children }: AccessibilityProviderProps) {
  const [preferences, setPreferences] = useState<AccessibilityPreferences>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Merge with defaults to ensure new preferences are included
        return { ...defaultPreferences, ...parsed };
      }
    } catch (error) {
      console.error('Failed to load accessibility preferences:', error);
    }
    return defaultPreferences;
  });

  // Update document classes and CSS variables based on preferences
  useEffect(() => {
    const root = document.documentElement;
    
    // Apply theme mode
    root.classList.remove('light', 'dark', 'high-contrast');
    if (preferences.themeMode === 'auto') {
      // Use system preference
      const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.classList.add(systemDark ? 'dark' : 'light');
    } else {
      root.classList.add(preferences.themeMode);
    }
    
    // Apply high contrast
    root.classList.toggle('high-contrast', preferences.highContrast);
    
    // Apply color blind mode
    root.classList.remove('protanopia', 'deuteranopia', 'tritanopia', 'monochrome');
    if (preferences.colorBlindMode !== 'normal') {
      root.classList.add(preferences.colorBlindMode);
    }
    
    // Apply font size
    root.classList.remove('font-small', 'font-medium', 'font-large', 'font-extra-large');
    root.classList.add(`font-${preferences.fontSize}`);
    
    // Apply motion preference
    root.classList.remove('motion-auto', 'motion-reduced', 'motion-none');
    root.classList.add(`motion-${preferences.motionPreference}`);
    
    // Apply other preferences
    root.classList.toggle('reduced-transparency', preferences.reducedTransparency);
    root.classList.toggle('enhanced-focus', preferences.enhancedFocus);
    root.classList.toggle('screen-reader-optimized', preferences.screenReaderOptimized);
    
  }, [preferences]);

  // Listen for system theme changes when using auto mode
  useEffect(() => {
    if (preferences.themeMode !== 'auto') return;
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      const root = document.documentElement;
      root.classList.remove('light', 'dark');
      root.classList.add(mediaQuery.matches ? 'dark' : 'light');
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [preferences.themeMode]);

  // Listen for system motion preference changes
  useEffect(() => {
    if (preferences.motionPreference !== 'auto') return;
    
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleChange = () => {
      const root = document.documentElement;
      root.classList.remove('motion-auto', 'motion-reduced', 'motion-none');
      root.classList.add(mediaQuery.matches ? 'motion-reduced' : 'motion-auto');
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [preferences.motionPreference]);

  // Save preferences to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
    } catch (error) {
      console.error('Failed to save accessibility preferences:', error);
    }
  }, [preferences]);

  const updatePreference = <K extends keyof AccessibilityPreferences>(
    key: K,
    value: AccessibilityPreferences[K]
  ) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value,
    }));
    
    // Announce changes to screen readers if enabled
    if (preferences.announceChanges) {
      announceToScreenReader(`${key} changed to ${value}`);
    }
  };

  const resetPreferences = () => {
    setPreferences(defaultPreferences);
    announceToScreenReader('Accessibility preferences reset to defaults');
  };

  // Create an ARIA live region for screen reader announcements
  const announceToScreenReader = (message: string) => {
    if (!preferences.screenReaderOptimized) return;
    
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.setAttribute('class', 'sr-only');
    announcement.textContent = message;
    
    document.body.appendChild(announcement);
    
    // Remove after announcement
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  };

  const contextValue: AccessibilityContextType = {
    preferences,
    updatePreference,
    resetPreferences,
    announceToScreenReader,
  };

  return (
    <AccessibilityContext.Provider value={contextValue}>
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  const context = useContext(AccessibilityContext);
  if (context === undefined) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
}

// Hook to get current theme (useful for components that need to know the active theme)
export function useTheme() {
  const { preferences } = useAccessibility();
  
  // Return the effective theme considering auto mode
  const getEffectiveTheme = (): 'light' | 'dark' | 'high-contrast' => {
    if (preferences.highContrast) return 'high-contrast';
    if (preferences.themeMode === 'auto') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return preferences.themeMode as 'light' | 'dark';
  };
  
  return {
    theme: getEffectiveTheme(),
    setTheme: (mode: ThemeMode) => preferences,
    isDark: getEffectiveTheme() === 'dark',
    isHighContrast: preferences.highContrast,
  };
}