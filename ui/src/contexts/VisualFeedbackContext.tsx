import React, { createContext, useContext, useState, useCallback } from 'react';
import { FeedbackNotification } from '@/components/ui/feedback-notification';

interface NotificationConfig {
  id: string;
  type: "success" | "error" | "warning" | "info";
  title?: string;
  message: string;
  autoClose?: boolean;
  autoCloseDelay?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface VisualFeedbackContextType {
  showNotification: (config: Omit<NotificationConfig, 'id'>) => string;
  hideNotification: (id: string) => void;
  showSuccess: (message: string, title?: string) => string;
  showError: (message: string, title?: string) => string;
  showWarning: (message: string, title?: string) => string;
  showInfo: (message: string, title?: string) => string;
  clearAll: () => void;
}

const VisualFeedbackContext = createContext<VisualFeedbackContextType | undefined>(undefined);

export const useVisualFeedback = () => {
  const context = useContext(VisualFeedbackContext);
  if (!context) {
    throw new Error('useVisualFeedback must be used within a VisualFeedbackProvider');
  }
  return context;
};

export const VisualFeedbackProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<NotificationConfig[]>([]);

  const showNotification = useCallback((config: Omit<NotificationConfig, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const notification: NotificationConfig = { ...config, id };
    
    setNotifications(prev => [...prev, notification]);
    
    return id;
  }, []);

  const hideNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const showSuccess = useCallback((message: string, title?: string) => {
    return showNotification({ type: 'success', message, title });
  }, [showNotification]);

  const showError = useCallback((message: string, title?: string) => {
    return showNotification({ type: 'error', message, title });
  }, [showNotification]);

  const showWarning = useCallback((message: string, title?: string) => {
    return showNotification({ type: 'warning', message, title });
  }, [showNotification]);

  const showInfo = useCallback((message: string, title?: string) => {
    return showNotification({ type: 'info', message, title });
  }, [showNotification]);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  const value = {
    showNotification,
    hideNotification,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    clearAll
  };

  return (
    <VisualFeedbackContext.Provider value={value}>
      {children}
      {/* Render notifications */}
      <div className="fixed inset-0 pointer-events-none z-50">
        {notifications.map((notification, index) => (
          <FeedbackNotification
            key={notification.id}
            type={notification.type}
            title={notification.title}
            message={notification.message}
            isVisible={true}
            onClose={() => hideNotification(notification.id)}
            autoClose={notification.autoClose}
            autoCloseDelay={notification.autoCloseDelay}
            action={notification.action}
            position="top-right"
          />
        ))}
      </div>
    </VisualFeedbackContext.Provider>
  );
};