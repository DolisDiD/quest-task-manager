import React, { useState, useRef } from 'react';
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { Trash2, Edit2, Check, X } from 'lucide-react';

const SwipeableCard = ({ 
  children, 
  onSwipeLeft, 
  onSwipeRight,
  onEdit,
  onDelete,
  className = '',
  swipeThreshold = 100
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const x = useMotionValue(0);
  const opacity = useTransform(x, [-200, 0, 200], [0.5, 1, 0.5]);
  const scale = useTransform(x, [-200, 0, 200], [0.95, 1, 0.95]);

  const handleDragStart = () => {
    setIsDragging(true);
  };

  const handleDragEnd = (event: any, info: PanInfo) => {
    setIsDragging(false);
    
    if (Math.abs(info.offset.x) > swipeThreshold) {
      if (info.offset.x > 0) {
        // Swipe right
        onSwipeRight?.();
      } else {
        // Swipe left
        onSwipeLeft?.();
      }
    }
    
    // Reset position
    x.set(0);
  };

  return (
    <motion.div
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.2}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      style={{ x, opacity, scale }}
      className={`relative ${className}`}
    >
      {/* Background actions */}
      <div className="absolute inset-0 flex items-center justify-between px-4">
        <motion.div
          className="flex items-center space-x-2"
          style={{
            opacity: useTransform(x, [-100, -50], [1, 0]),
            x: useTransform(x, [-100, -50], [0, -20])
          }}
        >
          <button
            onClick={onEdit}
            className="p-2 bg-blue-500 text-white rounded-full shadow-lg"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={onDelete}
            className="p-2 bg-red-500 text-white rounded-full shadow-lg"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </motion.div>
        
        <motion.div
          className="flex items-center space-x-2"
          style={{
            opacity: useTransform(x, [50, 100], [0, 1]),
            x: useTransform(x, [50, 100], [20, 0])
          }}
        >
          <button
            onClick={onSwipeRight}
            className="p-2 bg-green-500 text-white rounded-full shadow-lg"
          >
            <Check className="w-4 h-4" />
          </button>
        </motion.div>
      </div>

      {/* Main content */}
      <motion.div
        className={`
          relative z-10 glass-card p-4
          ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}
        `}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        {children}
      </motion.div>
    </motion.div>
  );
};

// Специализированные компоненты
export const SwipeableQuestCard = ({ 
  quest, 
  onComplete, 
  onEdit, 
  onDelete,
  className = '' 
}) => (
  <SwipeableCard
    onSwipeRight={onComplete}
    onEdit={onEdit}
    onDelete={onDelete}
    className={className}
  >
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <h3 className="font-semibold text-white mb-2">{quest.title}</h3>
        <p className="text-sm text-gray-400 mb-3">{quest.description}</p>
        <div className="flex items-center space-x-2">
          <StatusBadge status={quest.difficulty} size="xs" />
          <span className="text-xs text-gray-500">+{quest.xp} XP</span>
        </div>
      </div>
      {quest.completed && (
        <div className="text-green-500 text-2xl">✓</div>
      )}
    </div>
  </SwipeableCard>
);

export const SwipeableRewardCard = ({ 
  reward, 
  onClaim, 
  onEdit, 
  onDelete,
  className = '' 
}) => (
  <SwipeableCard
    onSwipeRight={!reward.claimed ? onClaim : undefined}
    onEdit={onEdit}
    onDelete={onDelete}
    className={className}
  >
    <div className="flex items-center space-x-3">
      <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center">
        <span className="text-white font-bold">🏆</span>
      </div>
      <div className="flex-1">
        <h4 className="font-semibold text-white">{reward.title}</h4>
        <p className="text-sm text-gray-400">{reward.quest_title}</p>
      </div>
      <div className="text-right">
        <div className="text-sm font-medium text-yellow-400">
          +{reward.xp} XP
        </div>
        <StatusBadge 
          status={reward.claimed ? 'completed' : 'pending'} 
          size="xs" 
        />
      </div>
    </div>
  </SwipeableCard>
);

export default SwipeableCard;
