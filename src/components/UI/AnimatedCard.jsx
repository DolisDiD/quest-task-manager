import React from 'react';
import { motion } from 'framer-motion';

const AnimatedCard = ({ 
  children, 
  className = '',
  hover = true,
  glow = false,
  glowColor = 'primary',
  delay = 0,
  onClick,
  ...props 
}) => {
  const glowClasses = {
    primary: 'hover:shadow-glow',
    purple: 'hover:shadow-glow-purple',
    cyan: 'hover:shadow-glow-cyan',
    success: 'hover:shadow-glow-success',
    warning: 'hover:shadow-glow-warning',
    error: 'hover:shadow-glow-error'
  };

  const cardVariants = {
    hidden: { 
      opacity: 0, 
      y: 20,
      scale: 0.95
    },
    visible: { 
      opacity: 1, 
      y: 0,
      scale: 1,
      transition: {
        duration: 0.5,
        delay,
        ease: [0.4, 0, 0.2, 1]
      }
    },
    hover: hover ? {
      y: -8,
      scale: 1.02,
      transition: {
        duration: 0.3,
        ease: [0.4, 0, 0.2, 1]
      }
    } : {},
    tap: {
      scale: 0.98,
      transition: {
        duration: 0.1
      }
    }
  };

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover={hover ? "hover" : undefined}
      whileTap="tap"
      className={`
        glass-card
        ${hover ? 'hover-lift' : ''}
        ${glow ? glowClasses[glowColor] : ''}
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
      onClick={onClick}
      {...props}
    >
      {children}
    </motion.div>
  );
};

// Специализированные карточки
export const QuestCard = ({ quest, onClick, delay = 0 }) => (
  <AnimatedCard
    delay={delay}
    onClick={onClick}
    className="p-6"
    glow={quest.completed}
    glowColor={quest.completed ? 'success' : 'primary'}
  >
    <div className="flex items-start justify-between mb-4">
      <div className="flex items-center space-x-3">
        <div className={`
          w-3 h-3 rounded-full
          ${quest.completed ? 'bg-success-500' : 'bg-primary-500'}
        `} />
        <h3 className="text-lg font-semibold text-white">
          {quest.title}
        </h3>
      </div>
      {quest.completed && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="text-success-500"
        >
          ✓
        </motion.div>
      )}
    </div>
    
    <p className="text-gray-300 text-sm mb-4 line-clamp-2">
      {quest.description}
    </p>
    
    <div className="flex items-center justify-between">
      <span className={`
        text-xs px-2 py-1 rounded-full
        ${quest.difficulty === 'legendary' ? 'bg-purple-500/20 text-purple-400' :
          quest.difficulty === 'rare' ? 'bg-blue-500/20 text-blue-400' :
          'bg-gray-500/20 text-gray-400'}
      `}>
        {quest.difficulty?.toUpperCase()}
      </span>
      
      <div className="flex items-center space-x-2 text-sm text-gray-400">
        <span>+{quest.xp} XP</span>
        {quest.reward && (
          <span>• {quest.reward}</span>
        )}
      </div>
    </div>
  </AnimatedCard>
);

export const RewardCard = ({ reward, onClick, delay = 0 }) => (
  <AnimatedCard
    delay={delay}
    onClick={onClick}
    className="p-4"
    glow={!reward.claimed}
    glowColor={reward.claimed ? 'gray' : 'warning'}
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
        {reward.bonus && (
          <div className="text-xs text-gray-400">
            +{reward.bonus} бонус
          </div>
        )}
      </div>
    </div>
  </AnimatedCard>
);

export const FriendCard = ({ friend, onClick, delay = 0 }) => (
  <AnimatedCard
    delay={delay}
    onClick={onClick}
    className="p-4"
    glow={true}
    glowColor="accent"
  >
    <div className="flex items-center space-x-3">
      <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
        <span className="text-white font-bold text-sm">
          {friend.name?.charAt(0)?.toUpperCase()}
        </span>
      </div>
      <div className="flex-1">
        <h4 className="font-semibold text-white">{friend.name}</h4>
        <p className="text-sm text-gray-400">{friend.email}</p>
      </div>
      <div className="text-right">
        <div className="text-sm text-gray-400">
          Уровень {friend.level}
        </div>
        <div className="text-xs text-gray-500">
          {friend.totalXp} XP
        </div>
      </div>
    </div>
  </AnimatedCard>
);

export default AnimatedCard;
