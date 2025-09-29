import React from 'react';
import { motion } from 'framer-motion';

const ProgressRing = ({ 
  progress = 0, 
  size = 120, 
  strokeWidth = 8,
  color = 'primary',
  backgroundColor = 'gray-700',
  showPercentage = true,
  className = '',
  children
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  const colors = {
    primary: '#6366f1',
    secondary: '#a855f7',
    accent: '#06b6d4',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444'
  };

  const bgColors = {
    'gray-700': '#374151',
    'gray-600': '#4b5563',
    'gray-500': '#6b7280'
  };

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={bgColors[backgroundColor]}
          strokeWidth={strokeWidth}
          fill="transparent"
          className="opacity-30"
        />
        
        {/* Progress circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors[color]}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeLinecap="round"
          strokeDasharray={strokeDasharray}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1, ease: "easeInOut" }}
          className="drop-shadow-lg"
        />
      </svg>
      
      {/* Content inside the ring */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {children || (
          showPercentage && (
            <motion.span
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
              className="text-2xl font-bold text-white"
            >
              {Math.round(progress)}%
            </motion.span>
          )
        )}
      </div>
    </div>
  );
};

// Специализированные компоненты
export const XPProgressRing = ({ currentXP, maxXP, level, className = '' }) => {
  const progress = (currentXP / maxXP) * 100;
  
  return (
    <ProgressRing
      progress={progress}
      color="primary"
      className={className}
    >
      <div className="text-center">
        <div className="text-2xl font-bold text-white">{level}</div>
        <div className="text-xs text-gray-400">Уровень</div>
      </div>
    </ProgressRing>
  );
};

export const QuestProgressRing = ({ completed, total, className = '' }) => {
  const progress = (completed / total) * 100;
  
  return (
    <ProgressRing
      progress={progress}
      color="success"
      className={className}
    >
      <div className="text-center">
        <div className="text-lg font-bold text-white">{completed}</div>
        <div className="text-xs text-gray-400">из {total}</div>
      </div>
    </ProgressRing>
  );
};

export const CollectionProgressRing = ({ collected, total, className = '' }) => {
  const progress = (collected / total) * 100;
  
  return (
    <ProgressRing
      progress={progress}
      color="accent"
      className={className}
    >
      <div className="text-center">
        <div className="text-lg font-bold text-white">{collected}</div>
        <div className="text-xs text-gray-400">из {total}</div>
      </div>
    </ProgressRing>
  );
};

export default ProgressRing;
