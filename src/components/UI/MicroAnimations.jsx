import React from 'react';
import { motion } from 'framer-motion';

// Анимация появления элемента
export const FadeIn = ({ 
  children, 
  delay = 0, 
  duration = 0.5,
  className = '' 
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ 
      duration, 
      delay,
      ease: [0.4, 0, 0.2, 1]
    }}
    className={className}
  >
    {children}
  </motion.div>
);

// Анимация появления слева
export const SlideInLeft = ({ 
  children, 
  delay = 0, 
  duration = 0.5,
  className = '' 
}) => (
  <motion.div
    initial={{ opacity: 0, x: -50 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ 
      duration, 
      delay,
      ease: [0.4, 0, 0.2, 1]
    }}
    className={className}
  >
    {children}
  </motion.div>
);

// Анимация появления справа
export const SlideInRight = ({ 
  children, 
  delay = 0, 
  duration = 0.5,
  className = '' 
}) => (
  <motion.div
    initial={{ opacity: 0, x: 50 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ 
      duration, 
      delay,
      ease: [0.4, 0, 0.2, 1]
    }}
    className={className}
  >
    {children}
  </motion.div>
);

// Анимация масштабирования
export const ScaleIn = ({ 
  children, 
  delay = 0, 
  duration = 0.4,
  className = '' 
}) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ 
      duration, 
      delay,
      ease: [0.4, 0, 0.2, 1]
    }}
    className={className}
  >
    {children}
  </motion.div>
);

// Анимация вращения
export const RotateIn = ({ 
  children, 
  delay = 0, 
  duration = 0.6,
  className = '' 
}) => (
  <motion.div
    initial={{ opacity: 0, rotate: -180 }}
    animate={{ opacity: 1, rotate: 0 }}
    transition={{ 
      duration, 
      delay,
      ease: [0.4, 0, 0.2, 1]
    }}
    className={className}
  >
    {children}
  </motion.div>
);

// Анимация пульсации
export const Pulse = ({ 
  children, 
  className = '' 
}) => (
  <motion.div
    animate={{ 
      scale: [1, 1.05, 1],
      opacity: [1, 0.8, 1]
    }}
    transition={{ 
      duration: 2,
      repeat: Infinity,
      ease: "easeInOut"
    }}
    className={className}
  >
    {children}
  </motion.div>
);

// Анимация покачивания
export const Wiggle = ({ 
  children, 
  className = '' 
}) => (
  <motion.div
    animate={{ 
      rotate: [0, -5, 5, -5, 5, 0]
    }}
    transition={{ 
      duration: 0.5,
      ease: "easeInOut"
    }}
    className={className}
  >
    {children}
  </motion.div>
);

// Анимация подпрыгивания
export const Bounce = ({ 
  children, 
  className = '' 
}) => (
  <motion.div
    animate={{ 
      y: [0, -10, 0]
    }}
    transition={{ 
      duration: 0.6,
      ease: "easeOut"
    }}
    className={className}
  >
    {children}
  </motion.div>
);

// Анимация появления с задержкой для списков
export const StaggeredList = ({ 
  children, 
  staggerDelay = 0.1,
  className = '' 
}) => (
  <motion.div
    initial="hidden"
    animate="visible"
    variants={{
      hidden: { opacity: 0 },
      visible: {
        opacity: 1,
        transition: {
          staggerChildren: staggerDelay
        }
      }
    }}
    className={className}
  >
    {children}
  </motion.div>
);

// Анимация элемента в списке
export const StaggeredItem = ({ 
  children, 
  className = '' 
}) => (
  <motion.div
    variants={{
      hidden: { opacity: 0, y: 20 },
      visible: { 
        opacity: 1, 
        y: 0,
        transition: {
          duration: 0.5,
          ease: [0.4, 0, 0.2, 1]
        }
      }
    }}
    className={className}
  >
    {children}
  </motion.div>
);

// Анимация успешного действия
export const SuccessAnimation = ({ 
  children, 
  show = false,
  className = '' 
}) => (
  <motion.div
    animate={show ? {
      scale: [1, 1.2, 1],
      rotate: [0, 5, -5, 0]
    } : {}}
    transition={{ 
      duration: 0.6,
      ease: "easeOut"
    }}
    className={className}
  >
    {children}
  </motion.div>
);

// Анимация ошибки
export const ErrorAnimation = ({ 
  children, 
  show = false,
  className = '' 
}) => (
  <motion.div
    animate={show ? {
      x: [0, -10, 10, -10, 10, 0]
    } : {}}
    transition={{ 
      duration: 0.5,
      ease: "easeInOut"
    }}
    className={className}
  >
    {children}
  </motion.div>
);

// Анимация загрузки
export const LoadingAnimation = ({ 
  children, 
  loading = false,
  className = '' 
}) => (
  <motion.div
    animate={loading ? {
      opacity: [0.5, 1, 0.5]
    } : {
      opacity: 1
    }}
    transition={{ 
      duration: 1.5,
      repeat: loading ? Infinity : 0,
      ease: "easeInOut"
    }}
    className={className}
  >
    {children}
  </motion.div>
);
