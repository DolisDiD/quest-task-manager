import React, { useState } from 'react';
import { motion } from 'framer-motion';

const Input = ({ 
  label,
  error,
  success,
  icon = null,
  iconPosition = 'left',
  className = '',
  ...props 
}) => {
  const [focused, setFocused] = useState(false);

  const inputVariants = {
    focused: {
      scale: 1.02,
      transition: { duration: 0.2 }
    }
  };

  return (
    <div className={`relative ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-300 mb-2">
          {label}
        </label>
      )}
      
      <motion.div
        variants={inputVariants}
        animate={focused ? "focused" : "initial"}
        className="relative"
      >
        {icon && iconPosition === 'left' && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            {icon}
          </div>
        )}
        
        <input
          className={`
            w-full px-4 py-3 rounded-lg
            bg-glass border border-glass-border
            text-gray-100 placeholder-gray-400
            transition-all duration-300
            focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
            focus:bg-glass-hover
            ${icon && iconPosition === 'left' ? 'pl-10' : ''}
            ${icon && iconPosition === 'right' ? 'pr-10' : ''}
            ${error ? 'border-error-500 focus:ring-error-500' : ''}
            ${success ? 'border-success-500 focus:ring-success-500' : ''}
          `}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          {...props}
        />
        
        {icon && iconPosition === 'right' && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            {icon}
          </div>
        )}
      </motion.div>
      
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-1 text-sm text-error-500"
        >
          {error}
        </motion.p>
      )}
      
      {success && (
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-1 text-sm text-success-500"
        >
          {success}
        </motion.p>
      )}
    </div>
  );
};

export default Input;
