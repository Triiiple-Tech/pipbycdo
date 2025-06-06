// Configuration utilities for PIP AI application
// Handles environment variables and app configuration

export const config = {
  // API Configuration
  api: {
    baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
    wsUrl: process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000/api/chat/ws',
  },

  // App Configuration
  app: {
    name: process.env.NEXT_PUBLIC_APP_NAME || 'PIP AI',
    version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
  },

  // Feature Flags
  features: {
    websocket: process.env.NEXT_PUBLIC_ENABLE_WEBSOCKET === 'true',
    smartsheet: process.env.NEXT_PUBLIC_ENABLE_SMARTSHEET === 'true',
    adminPanel: process.env.NEXT_PUBLIC_ENABLE_ADMIN_PANEL === 'true',
    analytics: process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === 'true',
  },

  // File Upload Configuration
  upload: {
    maxFileSize: parseInt(process.env.NEXT_PUBLIC_MAX_FILE_SIZE || '10485760', 10), // 10MB default
    allowedFileTypes: (process.env.NEXT_PUBLIC_ALLOWED_FILE_TYPES || 'pdf,doc,docx,xls,xlsx,txt,csv').split(','),
  },

  // UI Configuration
  ui: {
    defaultTheme: process.env.NEXT_PUBLIC_DEFAULT_THEME || 'light',
    enableDarkMode: process.env.NEXT_PUBLIC_ENABLE_DARK_MODE === 'true',
  },

  // Development Configuration
  dev: {
    debugMode: process.env.NEXT_PUBLIC_DEBUG_MODE === 'true',
    logLevel: process.env.NEXT_PUBLIC_LOG_LEVEL || 'warn',
  },
};

// Utility functions
export const isProduction = () => process.env.NODE_ENV === 'production';
export const isDevelopment = () => process.env.NODE_ENV === 'development';

// File validation utilities
export const validateFileType = (file: File): boolean => {
  const extension = file.name.split('.').pop()?.toLowerCase();
  return extension ? config.upload.allowedFileTypes.includes(extension) : false;
};

export const validateFileSize = (file: File): boolean => {
  return file.size <= config.upload.maxFileSize;
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Debug logging utility
export const debugLog = (message: string, data?: any) => {
  if (config.dev.debugMode) {
    console.log(`[PIP AI Debug] ${message}`, data);
  }
};

// Error logging utility
export const errorLog = (message: string, error?: any) => {
  console.error(`[PIP AI Error] ${message}`, error);
};

export default config;
