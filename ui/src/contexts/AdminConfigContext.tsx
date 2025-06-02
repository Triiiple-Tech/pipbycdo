import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface CostDisplayConfig {
  enabled: boolean;
  format: 'currency' | 'tokens' | 'both';
  showForAllUsers: boolean; // Admin can choose if cost is visible to all users or admin-only
}

export interface AgentModelAssignment {
  estimator: string;
  manager: string;
  rfi: string;
  exporter: string;
  validator: string;
  assistant: string;
}

export interface SmartsheetConfig {
  connected: boolean;
  apiToken: string;
  defaultWorkspaceId?: string;
  autoExport: boolean;
}

export interface FeatureFlags {
  enhancedAgentRouting: boolean;
  realTimeCollaboration: boolean;
  advancedAnalytics: boolean;
  betaFeatures: boolean;
  costOptimization: boolean;
  multiLanguageSupport: boolean;
}

export interface AdminConfiguration {
  costDisplay: CostDisplayConfig;
  agentModelAssignments: AgentModelAssignment;
  smartsheetIntegration: SmartsheetConfig;
  featureFlags: FeatureFlags;
  auditLogging: boolean;
  dataRetentionDays: number;
  maxFileSize: number;
  allowedFileTypes: string[];
}

interface AdminConfigContextType {
  config: AdminConfiguration;
  updateConfig: (updates: Partial<AdminConfiguration>) => void;
  resetConfig: () => void;
  saveConfig: () => Promise<void>;
  loadConfig: () => Promise<void>;
  isLoading: boolean;
  isDirty: boolean;
}

const defaultConfig: AdminConfiguration = {
  costDisplay: {
    enabled: false,
    format: 'currency',
    showForAllUsers: false,
  },
  agentModelAssignments: {
    estimator: 'gpt-4',
    manager: 'gpt-4-turbo',
    rfi: 'gpt-3.5-turbo',
    exporter: 'claude-3',
    validator: 'gpt-4',
    assistant: 'gpt-3.5-turbo',
  },
  smartsheetIntegration: {
    connected: false,
    apiToken: '',
    autoExport: false,
  },
  featureFlags: {
    enhancedAgentRouting: false,
    realTimeCollaboration: false,
    advancedAnalytics: true,
    betaFeatures: false,
    costOptimization: true,
    multiLanguageSupport: false,
  },
  auditLogging: true,
  dataRetentionDays: 90,
  maxFileSize: 25,
  allowedFileTypes: ['.pdf', '.docx', '.xlsx', '.txt', '.csv', '.jpg', '.jpeg', '.png'],
};

const AdminConfigContext = createContext<AdminConfigContextType | undefined>(undefined);

export function AdminConfigProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<AdminConfiguration>(defaultConfig);
  const [isLoading, setIsLoading] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  // Load configuration from localStorage on mount
  useEffect(() => {
    loadConfig();
  }, []);

  const updateConfig = (updates: Partial<AdminConfiguration>) => {
    setConfig(prev => {
      const newConfig = { ...prev, ...updates };
      // Deep merge for nested objects
      if (updates.costDisplay) {
        newConfig.costDisplay = { ...prev.costDisplay, ...updates.costDisplay };
      }
      if (updates.agentModelAssignments) {
        newConfig.agentModelAssignments = { ...prev.agentModelAssignments, ...updates.agentModelAssignments };
      }
      if (updates.smartsheetIntegration) {
        newConfig.smartsheetIntegration = { ...prev.smartsheetIntegration, ...updates.smartsheetIntegration };
      }
      if (updates.featureFlags) {
        newConfig.featureFlags = { ...prev.featureFlags, ...updates.featureFlags };
      }
      return newConfig;
    });
    setIsDirty(true);
  };

  const resetConfig = () => {
    setConfig(defaultConfig);
    setIsDirty(true);
  };

  const saveConfig = async () => {
    setIsLoading(true);
    try {
      // Save to localStorage (in a real app, this would be an API call)
      localStorage.setItem('pipAdminConfig', JSON.stringify(config));
      
      // TODO: In production, this would make an API call:
      // await fetch('/api/admin/config', {
      //   method: 'PUT',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(config),
      // });
      
      setIsDirty(false);
      console.log('Configuration saved successfully');
    } catch (error) {
      console.error('Failed to save configuration:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const loadConfig = async () => {
    setIsLoading(true);
    try {
      // Load from localStorage (in a real app, this would be an API call)
      const savedConfig = localStorage.getItem('pipAdminConfig');
      if (savedConfig) {
        const parsedConfig = JSON.parse(savedConfig);
        // Merge with defaults to ensure all new properties are included
        setConfig({ ...defaultConfig, ...parsedConfig });
      }
      
      // TODO: In production, this would make an API call:
      // const response = await fetch('/api/admin/config');
      // const serverConfig = await response.json();
      // setConfig({ ...defaultConfig, ...serverConfig });
      
      setIsDirty(false);
    } catch (error) {
      console.error('Failed to load configuration:', error);
      // Fall back to default config
      setConfig(defaultConfig);
    } finally {
      setIsLoading(false);
    }
  };

  const value: AdminConfigContextType = {
    config,
    updateConfig,
    resetConfig,
    saveConfig,
    loadConfig,
    isLoading,
    isDirty,
  };

  return (
    <AdminConfigContext.Provider value={value}>
      {children}
    </AdminConfigContext.Provider>
  );
}

export function useAdminConfig() {
  const context = useContext(AdminConfigContext);
  if (context === undefined) {
    throw new Error('useAdminConfig must be used within an AdminConfigProvider');
  }
  return context;
}

// Hook for checking if cost display should be shown for current user
export function useCostDisplaySettings() {
  const { config } = useAdminConfig();
  
  // In a real app, you'd also check user permissions here
  // For now, we'll assume admin users can always see costs
  const isAdmin = true; // TODO: Get from auth context
  
  const shouldShowCosts = config.costDisplay.enabled && 
    (config.costDisplay.showForAllUsers || isAdmin);
  
  return {
    shouldShowCosts,
    format: config.costDisplay.format,
    enabled: config.costDisplay.enabled,
  };
}

// Hook for getting agent model assignments
export function useAgentModelAssignments() {
  const { config } = useAdminConfig();
  return config.agentModelAssignments;
}

// Hook for feature flags
export function useFeatureFlags() {
  const { config } = useAdminConfig();
  return config.featureFlags;
}
