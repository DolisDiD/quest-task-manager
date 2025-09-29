import React from 'react';
import { motion } from 'framer-motion';
import { Loader2, RefreshCw } from 'lucide-react';

const LoadingSpinner = ({ 
  size = 'md', 
  color = 'primary',
  className = '' 
}) => {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  };

  const colors = {
    primary: 'text-primary-500',
    secondary: 'text-secondary-500',
    accent: 'text-accent-500',
    white: 'text-white',
    gray: 'text-gray-400'
  };

  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      className={`${sizes[size]} ${colors[color]} ${className}`}
    >
      <Loader2 className="w-full h-full" />
    </motion.div>
  );
};

const LoadingDots = ({ className = '' }) => (
  <div className={`flex space-x-1 ${className}`}>
    {[0, 1, 2].map((index) => (
      <motion.div
        key={index}
        className="w-2 h-2 bg-primary-500 rounded-full"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.5, 1, 0.5]
        }}
        transition={{
          duration: 0.6,
          repeat: Infinity,
          delay: index * 0.2
        }}
      />
    ))}
  </div>
);

const LoadingPulse = ({ className = '' }) => (
  <motion.div
    className={`bg-primary-500 rounded-full ${className}`}
    animate={{
      scale: [1, 1.1, 1],
      opacity: [0.7, 1, 0.7]
    }}
    transition={{
      duration: 1.5,
      repeat: Infinity,
      ease: "easeInOut"
    }}
  />
);

const LoadingScreen = ({ message = 'Загрузка...' }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center z-50"
  >
    <div className="text-center">
      <motion.div
        animate={{ 
          rotate: 360,
          scale: [1, 1.1, 1]
        }}
        transition={{ 
          rotate: { duration: 2, repeat: Infinity, ease: "linear" },
          scale: { duration: 1, repeat: Infinity, ease: "easeInOut" }
        }}
        className="w-16 h-16 text-primary-500 mx-auto mb-4"
      >
        <RefreshCw className="w-full h-full" />
      </motion.div>
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-xl text-gray-300"
      >
        {message}
      </motion.p>
    </div>
  </motion.div>
);

const LoadingButton = ({ 
  loading = false, 
  children, 
  className = '',
  ...props 
}) => (
  <motion.button
    className={`
      relative inline-flex items-center justify-center
      px-4 py-2 rounded-lg font-medium
      transition-all duration-300
      ${loading ? 'opacity-75 cursor-not-allowed' : ''}
      ${className}
    `}
    disabled={loading}
    whileHover={loading ? {} : { scale: 1.05 }}
    whileTap={loading ? {} : { scale: 0.95 }}
    {...props}
  >
    {loading && (
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="absolute inset-0 flex items-center justify-center"
      >
        <LoadingSpinner size="sm" color="white" />
      </motion.div>
    )}
    <motion.span
      animate={{ opacity: loading ? 0 : 1 }}
      transition={{ duration: 0.2 }}
    >
      {children}
    </motion.span>
  </motion.button>
);

const LoadingOverlay = ({ 
  loading = false, 
  children, 
  message = 'Загрузка...' 
}) => (
  <div className="relative">
    {children}
    {loading && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center rounded-lg"
      >
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-2 text-sm text-gray-300">{message}</p>
        </div>
      </motion.div>
    )}
  </div>
);

export {
  LoadingSpinner,
  LoadingDots,
  LoadingPulse,
  LoadingScreen,
  LoadingButton,
  LoadingOverlay
};
