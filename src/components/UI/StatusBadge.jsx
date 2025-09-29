import React from 'react';
import { motion } from 'framer-motion';

const StatusBadge = ({ 
  status,
  variant = 'default',
  size = 'md',
  className = '',
  children
}) => {
  const variants = {
    success: 'bg-success-500/20 text-success-400 border-success-500/30',
    warning: 'bg-warning-500/20 text-warning-400 border-warning-500/30',
    error: 'bg-error-500/20 text-error-400 border-error-500/30',
    info: 'bg-accent-500/20 text-accent-400 border-accent-500/30',
    primary: 'bg-primary-500/20 text-primary-400 border-primary-500/30',
    secondary: 'bg-secondary-500/20 text-secondary-400 border-secondary-500/30',
    default: 'bg-gray-500/20 text-gray-400 border-gray-500/30'
  };

  const sizes = {
    xs: 'px-1.5 py-0.5 text-xs',
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base'
  };

  const getStatusConfig = (status) => {
    switch (status) {
      case 'completed':
      case 'success':
      case 'active':
        return { variant: 'success', icon: '✓' };
      case 'pending':
      case 'waiting':
        return { variant: 'warning', icon: '⏳' };
      case 'error':
      case 'failed':
        return { variant: 'error', icon: '✗' };
      case 'info':
      case 'new':
        return { variant: 'info', icon: 'ℹ' };
      case 'rare':
        return { variant: 'primary', icon: '⭐' };
      case 'legendary':
        return { variant: 'secondary', icon: '👑' };
      case 'epic':
        return { variant: 'info', icon: '💎' };
      default:
        return { variant: 'default', icon: null };
    }
  };

  const config = getStatusConfig(status);

  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`
        inline-flex items-center space-x-1
        rounded-full border font-medium
        ${variants[config.variant]}
        ${sizes[size]}
        ${className}
      `}
    >
      {config.icon && (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          {config.icon}
        </motion.span>
      )}
      <span>{children || status}</span>
    </motion.span>
  );
};

// Специализированные бейджи
export const QuestStatusBadge = ({ difficulty, completed, className = '' }) => (
  <StatusBadge
    status={completed ? 'completed' : difficulty}
    size="sm"
    className={className}
  >
    {completed ? 'Выполнено' : difficulty?.toUpperCase()}
  </StatusBadge>
);

export const RewardStatusBadge = ({ claimed, className = '' }) => (
  <StatusBadge
    status={claimed ? 'completed' : 'pending'}
    size="sm"
    className={className}
  >
    {claimed ? 'Получено' : 'Ожидает'}
  </StatusBadge>
);

export const CardRarityBadge = ({ rarity, className = '' }) => (
  <StatusBadge
    status={rarity}
    size="sm"
    className={className}
  >
    {rarity?.toUpperCase()}
  </StatusBadge>
);

export const FriendStatusBadge = ({ status, className = '' }) => {
  const statusMap = {
    'pending': 'Ожидает',
    'accepted': 'Друг',
    'blocked': 'Заблокирован'
  };

  return (
    <StatusBadge
      status={status}
      size="sm"
      className={className}
    >
      {statusMap[status] || status}
    </StatusBadge>
  );
};

export default StatusBadge;
