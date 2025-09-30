import React, { memo, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  Sword, Target, Zap, Trophy, Star, Calendar, 
  CheckCircle, Circle, ChevronDown, ChevronRight 
} from 'lucide-react';
import { QuestStatusBadge } from './UI/StatusBadge';

// Мемоизированный компонент карточки квеста
const QuestCard = memo(({ 
  quest, 
  onToggle, 
  onExpand, 
  onSubtaskToggle,
  isExpanded = false 
}) => {
  const typeIcons = useMemo(() => ({
    main: <Sword className="w-4 h-4" />,
    side: <Target className="w-4 h-4" />
  }), []);

  const difficultyColors = useMemo(() => ({
    common: 'text-gray-300 border-gray-500',
    rare: 'text-blue-400 border-blue-500',
    epic: 'text-purple-400 border-purple-500',
    legendary: 'text-yellow-400 border-yellow-500'
  }), []);

  // Мемоизированные обработчики
  const handleToggle = useCallback(() => {
    onToggle(quest.id);
  }, [onToggle, quest.id]);

  const handleExpand = useCallback(() => {
    onExpand(quest.id);
  }, [onExpand, quest.id]);

  const handleSubtaskToggle = useCallback((subtaskId) => {
    onSubtaskToggle(quest.id, subtaskId);
  }, [onSubtaskToggle, quest.id]);

  // Мемоизированные вычисления
  const progressPercentage = useMemo(() => {
    if (quest.totalSteps === 0) return 0;
    return Math.round((quest.progress / quest.totalSteps) * 100);
  }, [quest.progress, quest.totalSteps]);

  const difficultyColor = useMemo(() => {
    return difficultyColors[quest.difficulty] || difficultyColors.common;
  }, [quest.difficulty, difficultyColors]);

  const isOverdue = useMemo(() => {
    if (!quest.dueDate) return false;
    return new Date(quest.dueDate) < new Date();
  }, [quest.dueDate]);

  const formatDate = useMemo(() => {
    if (!quest.dueDate) return null;
    const date = new Date(quest.dueDate);
    const now = new Date();
    const diffTime = date - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return `Просрочено на ${Math.abs(diffDays)} дн.`;
    if (diffDays === 0) return 'Сегодня';
    if (diffDays === 1) return 'Завтра';
    return `${diffDays} дн.`;
  }, [quest.dueDate]);

  const getDateColor = useMemo(() => {
    if (!quest.dueDate) return 'text-gray-400';
    const date = new Date(quest.dueDate);
    const now = new Date();
    const diffTime = date - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'text-red-400';
    if (diffDays <= 1) return 'text-yellow-400';
    if (diffDays <= 3) return 'text-orange-400';
    return 'text-gray-400';
  }, [quest.dueDate]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className={`bg-gradient-to-r from-gray-800/60 to-gray-900/60 backdrop-blur-sm border rounded-xl overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-yellow-400/10 ${
        quest.completed ? 'border-green-500/50' : difficultyColor
      }`}
    >
      <div className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between space-y-4 sm:space-y-0">
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <div className="flex items-center space-x-2">
                {typeIcons[quest.type]}
                <QuestStatusBadge 
                  difficulty={quest.difficulty} 
                  completed={quest.completed}
                />
              </div>
              {quest.completed && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="flex items-center space-x-1 text-green-400"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-sm font-medium">Выполнено</span>
                </motion.div>
              )}
            </div>

            <h3 className="text-lg sm:text-xl font-bold text-white mb-2 line-clamp-2">
              {quest.title}
            </h3>

            {quest.description && (
              <p className="text-gray-300 text-sm mb-3 line-clamp-2">
                {quest.description}
              </p>
            )}

            <div className="flex items-center space-x-3">
              <button
                onClick={quest.subtasks?.length === 0 ? handleToggle : handleExpand}
                className="flex items-center space-x-2 hover:text-yellow-400 transition-colors"
              >
                {quest.subtasks?.length > 0 ? (
                  isExpanded ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )
                ) : (
                  quest.completed ? (
                    <Circle className="w-4 h-4" />
                  ) : (
                    <CheckCircle className="w-4 h-4" />
                  )
                )}
                <span className="text-sm">
                  {quest.subtasks?.length > 0 
                    ? (isExpanded ? 'Свернуть' : 'Развернуть')
                    : (quest.completed ? 'Отметить как невыполненное' : 'Отметить как выполненное')
                  }
                </span>
              </button>
            </div>

            {quest.totalSteps > 1 && (
              <div className="mt-4">
                <div className="flex justify-between text-sm text-gray-400 mb-1">
                  <span>Прогресс: {quest.progress}/{quest.totalSteps}</span>
                  <span>{progressPercentage}%</span>
                </div>
                <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 transition-all duration-500"
                    style={{ width: `${progressPercentage}%` }}
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercentage}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="text-left sm:text-right sm:ml-6 space-y-2">
            <div className="flex items-center space-x-2">
              <Zap className="w-4 h-4 text-blue-400" />
              <span className="text-sm font-medium">{quest.xp} XP</span>
            </div>
            <div className="flex items-center space-x-2">
              <Trophy className="w-4 h-4 text-yellow-400" />
              <span className="text-sm font-medium">{quest.reward || 'Награда'}</span>
            </div>
            {quest.bonus && (
              <div className="flex items-center space-x-2">
                <Star className="w-4 h-4 text-purple-400" />
                <span className="text-sm font-medium">{quest.bonus}</span>
              </div>
            )}
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-gray-400" />
              <span className={`text-sm ${getDateColor}`}>
                {formatDate || 'Без срока'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {isExpanded && quest.subtasks?.length > 0 && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="border-t border-gray-700 bg-black/20"
        >
          <div className="p-4">
            <h4 className="text-sm font-semibold text-gray-300 mb-3">Подзадачи:</h4>
            <div className="space-y-2">
              {quest.subtasks.map((subtask) => (
                <motion.div
                  key={subtask.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                  className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg hover:bg-gray-700/50 transition-colors cursor-pointer"
                  onClick={() => handleSubtaskToggle(subtask.id)}
                >
                  <div className="flex items-center space-x-3">
                    {subtask.completed ? (
                      <CheckCircle className="w-4 h-4 text-green-400" />
                    ) : (
                      <Circle className="w-4 h-4 text-gray-400" />
                    )}
                    <span className={`text-sm ${subtask.completed ? 'line-through text-gray-400' : 'text-white'}`}>
                      {subtask.title}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Zap className="w-3 h-3 text-blue-400" />
                    <span className="text-xs text-gray-400">{subtask.xp} XP</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
});

QuestCard.displayName = 'QuestCard';

export default QuestCard;

