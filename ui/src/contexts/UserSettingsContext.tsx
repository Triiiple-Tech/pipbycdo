import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Theme settings
export interface ThemeSettings {
  mode: 'light' | 'dark' | 'system';
  accent: 'cdo-red' | 'blue' | 'green' | 'purple' | 'orange';
  fontSize: 'small' | 'medium' | 'large';
  highContrast: boolean;
  reducedMotion: boolean;
}

// Notification settings
export interface NotificationSettings {
  enabled: boolean;
  sound: boolean;
  desktop: boolean;
  email: boolean;
  agentUpdates: boolean;
  projectProgress: boolean;
  costAlerts: boolean;
  systemMaintenance: boolean;
}

// Privacy settings
export interface PrivacySettings {
  shareUsageAnalytics: boolean;
  allowCookies: boolean;
  trackingOptOut: boolean;
  dataRetention: '30' | '90' | '365' | 'indefinite';
  exportable: boolean;
}

// API key management
export interface ApiKeySettings {
  openai: string;
  anthropic: string;
  google: string;
  azure: string;
  custom: { [provider: string]: string };
}

// Language preferences
export interface LanguageSettings {
  interface: 'en' | 'es' | 'fr' | 'de' | 'pt' | 'ja' | 'zh';
  dateFormat: 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD';
  timeFormat: '12h' | '24h';
  timezone: string;
  currency: 'USD' | 'EUR' | 'GBP' | 'CAD' | 'AUD' | 'JPY';
}

// Profile settings
export interface ProfileSettings {
  name: string;
  email: string;
  avatar: string;
  title: string;
  organization: string;
  bio: string;
  showOnlineStatus: boolean;
}

// Workspace settings
export interface WorkspaceSettings {
  defaultView: 'chat' | 'projects' | 'dashboard';
  sidebarCollapsed: boolean;
  showAgentStatus: boolean;
  autoSaveChats: boolean;
  chatHistoryLimit: number;
  fileUploadLimit: number;
  shortcuts: { [key: string]: string };
}

// Developer options
export interface DeveloperSettings {
  enableDebugMode: boolean;
  showApiLogs: boolean;
  enableExperimentalFeatures: boolean;
  customCssEnabled: boolean;
  customCss: string;
  apiEndpoint: string;
  logLevel: 'error' | 'warn' | 'info' | 'debug';
}

// Main user settings interface
export interface UserSettings {
  theme: ThemeSettings;
  notifications: NotificationSettings;
  privacy: PrivacySettings;
  apiKeys: ApiKeySettings;
  language: LanguageSettings;
  profile: ProfileSettings;
  workspace: WorkspaceSettings;
  developer: DeveloperSettings;
}

interface UserSettingsContextType {
  settings: UserSettings;
  updateSettings: (updates: Partial<UserSettings>) => void;
  updateTheme: (updates: Partial<ThemeSettings>) => void;
  updateNotifications: (updates: Partial<NotificationSettings>) => void;
  updatePrivacy: (updates: Partial<PrivacySettings>) => void;
  updateApiKeys: (updates: Partial<ApiKeySettings>) => void;
  updateLanguage: (updates: Partial<LanguageSettings>) => void;
  updateProfile: (updates: Partial<ProfileSettings>) => void;
  updateWorkspace: (updates: Partial<WorkspaceSettings>) => void;
  updateDeveloper: (updates: Partial<DeveloperSettings>) => void;
  resetSettings: () => void;
  exportSettings: () => string;
  importSettings: (settingsJson: string) => Promise<boolean>;
  isLoading: boolean;
  isDirty: boolean;
}

const defaultSettings: UserSettings = {
  theme: {
    mode: 'system',
    accent: 'cdo-red',
    fontSize: 'medium',
    highContrast: false,
    reducedMotion: false,
  },
  notifications: {
    enabled: true,
    sound: true,
    desktop: false,
    email: false,
    agentUpdates: true,
    projectProgress: true,
    costAlerts: true,
    systemMaintenance: true,
  },
  privacy: {
    shareUsageAnalytics: false,
    allowCookies: true,
    trackingOptOut: false,
    dataRetention: '90',
    exportable: true,
  },
  apiKeys: {
    openai: '',
    anthropic: '',
    google: '',
    azure: '',
    custom: {},
  },
  language: {
    interface: 'en',
    dateFormat: 'MM/DD/YYYY',
    timeFormat: '12h',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    currency: 'USD',
  },
  profile: {
    name: '',
    email: '',
    avatar: '',
    title: '',
    organization: '',
    bio: '',
    showOnlineStatus: true,
  },
  workspace: {
    defaultView: 'chat',
    sidebarCollapsed: false,
    showAgentStatus: true,
    autoSaveChats: true,
    chatHistoryLimit: 100,
    fileUploadLimit: 25,
    shortcuts: {
      'ctrl+1': 'template:summarize',
      'ctrl+2': 'template:rfi',
      'ctrl+3': 'template:missing',
      'ctrl+`': 'toggle:admin',
      'ctrl+shift+s': 'toggle:settings',
    },
  },
  developer: {
    enableDebugMode: false,
    showApiLogs: false,
    enableExperimentalFeatures: false,
    customCssEnabled: false,
    customCss: '',
    apiEndpoint: '',
    logLevel: 'info',
  },
};

const UserSettingsContext = createContext<UserSettingsContextType | undefined>(undefined);

export function UserSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  // Load settings from localStorage on mount
  useEffect(() => {
    loadSettings();
  }, []);

  // Auto-save settings when they change
  useEffect(() => {
    if (isDirty) {
      const saveTimeout = setTimeout(() => {
        saveSettings();
      }, 1000); // Auto-save after 1 second of inactivity

      return () => clearTimeout(saveTimeout);
    }
  }, [settings, isDirty]);

  const loadSettings = () => {
    try {
      const savedSettings = localStorage.getItem('pipUserSettings');
      if (savedSettings) {
        const parsedSettings = JSON.parse(savedSettings);
        // Merge with defaults to ensure all new properties are included
        setSettings(mergeSettings(defaultSettings, parsedSettings));
      }
    } catch (error) {
      console.error('Failed to load user settings:', error);
      // Fall back to default settings
      setSettings(defaultSettings);
    }
  };

  const saveSettings = async () => {
    try {
      localStorage.setItem('pipUserSettings', JSON.stringify(settings));
      setIsDirty(false);
      console.log('User settings saved successfully');
    } catch (error) {
      console.error('Failed to save user settings:', error);
      throw error;
    }
  };

  const mergeSettings = (defaults: UserSettings, saved: Partial<UserSettings>): UserSettings => {
    return {
      theme: { ...defaults.theme, ...saved.theme },
      notifications: { ...defaults.notifications, ...saved.notifications },
      privacy: { ...defaults.privacy, ...saved.privacy },
      apiKeys: { ...defaults.apiKeys, ...saved.apiKeys },
      language: { ...defaults.language, ...saved.language },
      profile: { ...defaults.profile, ...saved.profile },
      workspace: { ...defaults.workspace, ...saved.workspace },
      developer: { ...defaults.developer, ...saved.developer },
    };
  };

  const updateSettings = (updates: Partial<UserSettings>) => {
    setSettings(prev => mergeSettings(prev, updates));
    setIsDirty(true);
  };

  const updateTheme = (updates: Partial<ThemeSettings>) => {
    setSettings(prev => ({
      ...prev,
      theme: { ...prev.theme, ...updates }
    }));
    setIsDirty(true);
    
    // Apply theme changes immediately
    applyThemeSettings({ ...settings.theme, ...updates });
  };

  const updateNotifications = (updates: Partial<NotificationSettings>) => {
    setSettings(prev => ({
      ...prev,
      notifications: { ...prev.notifications, ...updates }
    }));
    setIsDirty(true);
  };

  const updatePrivacy = (updates: Partial<PrivacySettings>) => {
    setSettings(prev => ({
      ...prev,
      privacy: { ...prev.privacy, ...updates }
    }));
    setIsDirty(true);
  };

  const updateApiKeys = (updates: Partial<ApiKeySettings>) => {
    setSettings(prev => ({
      ...prev,
      apiKeys: { ...prev.apiKeys, ...updates }
    }));
    setIsDirty(true);
  };

  const updateLanguage = (updates: Partial<LanguageSettings>) => {
    setSettings(prev => ({
      ...prev,
      language: { ...prev.language, ...updates }
    }));
    setIsDirty(true);
  };

  const updateProfile = (updates: Partial<ProfileSettings>) => {
    setSettings(prev => ({
      ...prev,
      profile: { ...prev.profile, ...updates }
    }));
    setIsDirty(true);
  };

  const updateWorkspace = (updates: Partial<WorkspaceSettings>) => {
    setSettings(prev => ({
      ...prev,
      workspace: { ...prev.workspace, ...updates }
    }));
    setIsDirty(true);
  };

  const updateDeveloper = (updates: Partial<DeveloperSettings>) => {
    setSettings(prev => ({
      ...prev,
      developer: { ...prev.developer, ...updates }
    }));
    setIsDirty(true);
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
    setIsDirty(true);
    applyThemeSettings(defaultSettings.theme);
  };

  const exportSettings = (): string => {
    return JSON.stringify(settings, null, 2);
  };

  const importSettings = async (settingsJson: string): Promise<boolean> => {
    try {
      const importedSettings = JSON.parse(settingsJson);
      const mergedSettings = mergeSettings(defaultSettings, importedSettings);
      setSettings(mergedSettings);
      setIsDirty(true);
      applyThemeSettings(mergedSettings.theme);
      return true;
    } catch (error) {
      console.error('Failed to import settings:', error);
      return false;
    }
  };

  const applyThemeSettings = (themeSettings: ThemeSettings) => {
    const root = document.documentElement;
    
    // Apply theme mode
    if (themeSettings.mode === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.classList.toggle('dark', prefersDark);
    } else {
      root.classList.toggle('dark', themeSettings.mode === 'dark');
    }
    
    // Apply font size
    root.style.setProperty('--font-size-base', 
      themeSettings.fontSize === 'small' ? '14px' :
      themeSettings.fontSize === 'large' ? '18px' : '16px'
    );
    
    // Apply accent color
    root.setAttribute('data-accent', themeSettings.accent);
    
    // Apply accessibility settings
    if (themeSettings.reducedMotion) {
      root.style.setProperty('--animation-duration', '0s');
    } else {
      root.style.removeProperty('--animation-duration');
    }
    
    if (themeSettings.highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }
  };

  // Apply theme settings on mount and when they change
  useEffect(() => {
    applyThemeSettings(settings.theme);
  }, [settings.theme]);

  const value: UserSettingsContextType = {
    settings,
    updateSettings,
    updateTheme,
    updateNotifications,
    updatePrivacy,
    updateApiKeys,
    updateLanguage,
    updateProfile,
    updateWorkspace,
    updateDeveloper,
    resetSettings,
    exportSettings,
    importSettings,
    isLoading,
    isDirty,
  };

  return (
    <UserSettingsContext.Provider value={value}>
      {children}
    </UserSettingsContext.Provider>
  );
}

export function useUserSettings() {
  const context = useContext(UserSettingsContext);
  if (context === undefined) {
    throw new Error('useUserSettings must be used within a UserSettingsProvider');
  }
  return context;
}

// Convenience hooks for specific setting sections
export function useThemeSettings() {
  const { settings, updateTheme } = useUserSettings();
  return { theme: settings.theme, updateTheme };
}

export function useNotificationSettings() {
  const { settings, updateNotifications } = useUserSettings();
  return { notifications: settings.notifications, updateNotifications };
}

export function useWorkspaceSettings() {
  const { settings, updateWorkspace } = useUserSettings();
  return { workspace: settings.workspace, updateWorkspace };
}

export function useProfileSettings() {
  const { settings, updateProfile } = useUserSettings();
  return { profile: settings.profile, updateProfile };
}