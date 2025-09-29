import React from 'react';
import { motion } from 'framer-motion';
import Skeleton, { SkeletonCard, SkeletonQuest } from './Skeleton';

const SkeletonList = ({ 
  type = 'card',
  count = 3,
  className = '',
  showHeader = true
}) => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.5,
        ease: [0.4, 0, 0.2, 1]
      }
    }
  };

  const renderSkeleton = (index) => {
    switch (type) {
      case 'quest':
        return <SkeletonQuest key={index} />;
      case 'card':
      default:
        return <SkeletonCard key={index} />;
    }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={`space-y-4 ${className}`}
    >
      {showHeader && (
        <motion.div variants={itemVariants} className="space-y-2">
          <Skeleton height="2rem" width="40%" />
          <Skeleton height="1rem" width="60%" />
        </motion.div>
      )}
      
      {Array.from({ length: count }).map((_, index) => (
        <motion.div key={index} variants={itemVariants}>
          {renderSkeleton(index)}
        </motion.div>
      ))}
    </motion.div>
  );
};

// Специализированные списки
export const SkeletonQuestList = ({ count = 5, className = '' }) => (
  <SkeletonList 
    type="quest" 
    count={count} 
    className={className}
    showHeader={true}
  />
);

export const SkeletonRewardList = ({ count = 3, className = '' }) => (
  <SkeletonList 
    type="card" 
    count={count} 
    className={className}
    showHeader={true}
  />
);

export const SkeletonFriendList = ({ count = 4, className = '' }) => (
  <SkeletonList 
    type="card" 
    count={count} 
    className={className}
    showHeader={true}
  />
);

export const SkeletonCollectionList = ({ count = 6, className = '' }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 ${className}`}
  >
    {Array.from({ length: count }).map((_, index) => (
      <motion.div
        key={index}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: index * 0.1 }}
        className="aspect-[3/4] glass-card rounded-xl p-4"
      >
        <Skeleton height="100%" width="100%" className="rounded-lg" />
      </motion.div>
    ))}
  </motion.div>
);

export default SkeletonList;
