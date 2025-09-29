import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const PageTransition = ({ 
  children, 
  activeTab, 
  className = '' 
}) => {
  const pageVariants = {
    initial: { 
      opacity: 0, 
      x: 20,
      scale: 0.98
    },
    in: { 
      opacity: 1, 
      x: 0,
      scale: 1,
      transition: {
        duration: 0.3,
        ease: [0.4, 0, 0.2, 1]
      }
    },
    out: { 
      opacity: 0, 
      x: -20,
      scale: 0.98,
      transition: {
        duration: 0.2,
        ease: [0.4, 0, 0.2, 1]
      }
    }
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={activeTab}
        initial="initial"
        animate="in"
        exit="out"
        variants={pageVariants}
        className={className}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};

// Специализированные переходы
export const FadeTransition = ({ children, key, className = '' }) => (
  <motion.div
    key={key}
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.3 }}
    className={className}
  >
    {children}
  </motion.div>
);

export const SlideTransition = ({ children, key, direction = 'right', className = '' }) => {
  const slideVariants = {
    initial: { 
      x: direction === 'right' ? 100 : -100,
      opacity: 0
    },
    in: { 
      x: 0,
      opacity: 1,
      transition: {
        duration: 0.4,
        ease: [0.4, 0, 0.2, 1]
      }
    },
    out: { 
      x: direction === 'right' ? -100 : 100,
      opacity: 0,
      transition: {
        duration: 0.3,
        ease: [0.4, 0, 0.2, 1]
      }
    }
  };

  return (
    <motion.div
      key={key}
      initial="initial"
      animate="in"
      exit="out"
      variants={slideVariants}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export const ScaleTransition = ({ children, key, className = '' }) => (
  <motion.div
    key={key}
    initial={{ scale: 0.8, opacity: 0 }}
    animate={{ scale: 1, opacity: 1 }}
    exit={{ scale: 0.8, opacity: 0 }}
    transition={{ 
      duration: 0.3,
      ease: [0.4, 0, 0.2, 1]
    }}
    className={className}
  >
    {children}
  </motion.div>
);

export default PageTransition;
