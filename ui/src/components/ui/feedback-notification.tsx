import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, XCircle, AlertTriangle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface FeedbackNotificationProps {
  type: "success" | "error" | "warning" | "info";
  title?: string;
  message: string;
  isVisible: boolean;
  onClose?: () => void;
  autoClose?: boolean;
  autoCloseDelay?: number;
  position?: "top-right" | "top-left" | "bottom-right" | "bottom-left" | "top-center" | "bottom-center";
  showIcon?: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
}

const FeedbackNotification: React.FC<FeedbackNotificationProps> = ({
  type,
  title,
  message,
  isVisible,
  onClose,
  autoClose = true,
  autoCloseDelay = 5000,
  position = "top-right",
  showIcon = true,
  action
}) => {
  React.useEffect(() => {
    if (isVisible && autoClose && onClose) {
      const timer = setTimeout(onClose, autoCloseDelay);
      return () => clearTimeout(timer);
    }
  }, [isVisible, autoClose, autoCloseDelay, onClose]);

  const getTypeConfig = () => {
    switch (type) {
      case "success":
        return {
          icon: CheckCircle,
          colors: "bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-100",
          iconColor: "text-green-500",
          buttonColor: "text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-200"
        };
      case "error":
        return {
          icon: XCircle,
          colors: "bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-100",
          iconColor: "text-red-500",
          buttonColor: "text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200"
        };
      case "warning":
        return {
          icon: AlertTriangle,
          colors: "bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-100",
          iconColor: "text-yellow-500",
          buttonColor: "text-yellow-600 hover:text-yellow-800 dark:text-yellow-400 dark:hover:text-yellow-200"
        };
      case "info":
        return {
          icon: Info,
          colors: "bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-100",
          iconColor: "text-blue-500",
          buttonColor: "text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
        };
    }
  };

  const getPositionClasses = () => {
    switch (position) {
      case "top-left":
        return "top-4 left-4";
      case "top-center":
        return "top-4 left-1/2 transform -translate-x-1/2";
      case "top-right":
        return "top-4 right-4";
      case "bottom-left":
        return "bottom-4 left-4";
      case "bottom-center":
        return "bottom-4 left-1/2 transform -translate-x-1/2";
      case "bottom-right":
        return "bottom-4 right-4";
      default:
        return "top-4 right-4";
    }
  };

  const typeConfig = getTypeConfig();
  const Icon = typeConfig.icon;

  const slideAnimation = {
    initial: {
      opacity: 0,
      y: position.startsWith("top") ? -50 : 50,
      x: position.includes("left") ? -50 : position.includes("right") ? 50 : 0,
      scale: 0.9
    },
    animate: {
      opacity: 1,
      y: 0,
      x: 0,
      scale: 1
    },
    exit: {
      opacity: 0,
      y: position.startsWith("top") ? -50 : 50,
      x: position.includes("left") ? -50 : position.includes("right") ? 50 : 0,
      scale: 0.9
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className={cn(
            "fixed z-50 max-w-sm w-full shadow-lg rounded-lg border p-4",
            getPositionClasses(),
            typeConfig.colors
          )}
          {...slideAnimation}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          <div className="flex items-start gap-3">
            {showIcon && (
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.1, duration: 0.4, ease: "easeOut" }}
              >
                <Icon className={cn("w-5 h-5 mt-0.5", typeConfig.iconColor)} />
              </motion.div>
            )}
            
            <div className="flex-1 min-w-0">
              {title && (
                <motion.h4
                  className="text-sm font-semibold mb-1"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.3 }}
                >
                  {title}
                </motion.h4>
              )}
              <motion.p
                className="text-sm"
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: title ? 0.3 : 0.2, duration: 0.3 }}
              >
                {message}
              </motion.p>
              
              {action && (
                <motion.button
                  className={cn(
                    "mt-2 text-sm font-medium underline underline-offset-2",
                    typeConfig.buttonColor
                  )}
                  onClick={action.onClick}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.3 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {action.label}
                </motion.button>
              )}
            </div>
            
            {onClose && (
              <motion.button
                className={cn(
                  "p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/5 transition-colors",
                  typeConfig.buttonColor
                )}
                onClick={onClose}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3, duration: 0.2 }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <X className="w-4 h-4" />
              </motion.button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export { FeedbackNotification };