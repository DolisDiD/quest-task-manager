import React from 'react';
import { motion } from 'framer-motion';
import { 
  Home, ListChecks, Trophy, Users, Gift, Award, 
  Shield, Settings, Plus, Bell, User, Send
} from 'lucide-react';

const MobileNavigation = ({ 
  activeTab, 
  onTabChange, 
  friendRequestsCount = 0,
  className = '' 
}) => {
  const tabs = [
    { id: 'dashboard', label: 'Главная', icon: Home },
    { id: 'my-quests', label: 'Мои задачи', icon: ListChecks },
    { id: 'rewards', label: 'Награды', icon: Trophy },
    { id: 'assigned-quests', label: 'Поставленные', icon: Send },
    { id: 'friends', label: 'Друзья', icon: Users, badge: friendRequestsCount }
  ];

  return (
    <motion.div
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      className={`
        fixed bottom-0 left-0 right-0 z-40
        bg-glass backdrop-blur-strong border-t border-glass-border
        ${className}
      `}
    >
      <div className="flex items-center justify-around px-2 py-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <motion.button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`
                relative flex flex-col items-center justify-center
                px-3 py-2 rounded-xl transition-all duration-300
                ${isActive 
                  ? 'text-primary-400 bg-primary-500/20' 
                  : 'text-gray-400 hover:text-white hover:bg-gray-700/30'
                }
              `}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className="relative">
                <Icon className="w-5 h-5" />
                {tab.badge && tab.badge > 0 && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 bg-error-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center"
                  >
                    {tab.badge > 9 ? '9+' : tab.badge}
                  </motion.div>
                )}
              </div>
              <span className="text-xs mt-1 font-medium">
                {tab.label}
              </span>
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-primary-500/20 rounded-xl"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
};

export default MobileNavigation;
