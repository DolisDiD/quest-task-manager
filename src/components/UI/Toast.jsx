import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertCircle, Info, X, AlertTriangle } from 'lucide-react';

const Toast = ({ notification, onClose }) => {
  const icons = {
    success: <CheckCircle className="w-5 h-5 text-success-500" />,
    error: <AlertCircle className="w-5 h-5 text-error-500" />,
    warning: <AlertTriangle className="w-5 h-5 text-warning-500" />,
    info: <Info className="w-5 h-5 text-accent-500" />
  };

  const colors = {
    success: 'border-success-500/30 bg-success-500/10',
    error: 'border-error-500/30 bg-error-500/10',
    warning: 'border-warning-500/30 bg-warning-500/10',
    info: 'border-accent-500/30 bg-accent-500/10'
  };

  useEffect(() => {
    if (notification.timeoutMs > 0) {
      const timer = setTimeout(() => {
        onClose(notification.id);
      }, notification.timeoutMs);

      return () => clearTimeout(timer);
    }
  }, [notification.id, notification.timeoutMs, onClose]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -50, scale: 0.9 }}
      transition={{ 
        type: "spring", 
        stiffness: 300, 
        damping: 30 
      }}
      className={`
        relative flex items-start space-x-3 p-4 rounded-xl border backdrop-blur-sm
        ${colors[notification.type] || colors.info}
        shadow-lg hover:shadow-xl transition-all duration-300
        max-w-sm w-full
      `}
    >
      <div className="flex-shrink-0">
        {icons[notification.type] || icons.info}
      </div>
      
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-100">
          {notification.message}
        </p>
      </div>
      
      <button
        onClick={() => onClose(notification.id)}
        className="flex-shrink-0 p-1 rounded-lg hover:bg-white/10 transition-colors"
      >
        <X className="w-4 h-4 text-gray-400 hover:text-white" />
      </button>
    </motion.div>
  );
};

const ToastContainer = ({ notifications, onClose }) => {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      <AnimatePresence>
        {notifications.map((notification) => (
          <Toast
            key={notification.id}
            notification={notification}
            onClose={onClose}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};

export default ToastContainer;
