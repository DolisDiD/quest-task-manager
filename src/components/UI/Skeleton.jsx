import React from 'react';
import { motion } from 'framer-motion';

const Skeleton = ({ 
  className = '', 
  variant = 'rectangular',
  width = '100%',
  height = '1rem',
  ...props 
}) => {
  const variants = {
    rectangular: 'rounded-lg',
    circular: 'rounded-full',
    text: 'rounded',
    card: 'rounded-xl'
  };

  return (
    <motion.div
      className={`
        loading-skeleton
        ${variants[variant]}
        ${className}
      `}
      style={{ width, height }}
      animate={{
        opacity: [0.5, 1, 0.5],
      }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        ease: "easeInOut"
      }}
      {...props}
    />
  );
};

// Предустановленные скелетоны для разных компонентов
export const SkeletonCard = () => (
  <div className="glass-card p-6 space-y-4">
    <div className="flex items-center space-x-3">
      <Skeleton variant="circular" width="2.5rem" height="2.5rem" />
      <div className="space-y-2 flex-1">
        <Skeleton height="1rem" width="60%" />
        <Skeleton height="0.75rem" width="40%" />
      </div>
    </div>
    <Skeleton height="1rem" width="100%" />
    <Skeleton height="1rem" width="80%" />
    <div className="flex space-x-2">
      <Skeleton height="2rem" width="4rem" />
      <Skeleton height="2rem" width="4rem" />
    </div>
  </div>
);

export const SkeletonQuest = () => (
  <div className="glass-card p-4 space-y-3">
    <div className="flex items-center justify-between">
      <Skeleton height="1.25rem" width="70%" />
      <Skeleton variant="circular" width="1.5rem" height="1.5rem" />
    </div>
    <Skeleton height="1rem" width="100%" />
    <Skeleton height="1rem" width="90%" />
    <div className="flex items-center space-x-2">
      <Skeleton height="1.5rem" width="3rem" />
      <Skeleton height="1.5rem" width="3rem" />
      <Skeleton height="1.5rem" width="3rem" />
    </div>
  </div>
);

export const SkeletonButton = () => (
  <Skeleton height="2.5rem" width="8rem" className="rounded-lg" />
);

export const SkeletonInput = () => (
  <div className="space-y-2">
    <Skeleton height="1rem" width="4rem" />
    <Skeleton height="3rem" width="100%" className="rounded-lg" />
  </div>
);

export const SkeletonList = ({ count = 3 }) => (
  <div className="space-y-4">
    {Array.from({ length: count }).map((_, index) => (
      <SkeletonCard key={index} />
    ))}
  </div>
);

export default Skeleton;
