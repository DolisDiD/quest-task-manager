import React from 'react';
import { motion } from 'framer-motion';

// Заголовки
export const Heading1 = ({ 
  children, 
  className = '',
  animate = false,
  ...props 
}) => {
  const Component = animate ? motion.h1 : 'h1';
  const motionProps = animate ? {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, ease: [0.4, 0, 0.2, 1] }
  } : {};

  return (
    <Component
      className={`text-4xl md:text-5xl font-bold gradient-text leading-tight ${className}`}
      {...motionProps}
      {...props}
    >
      {children}
    </Component>
  );
};

export const Heading2 = ({ 
  children, 
  className = '',
  animate = false,
  ...props 
}) => {
  const Component = animate ? motion.h2 : 'h2';
  const motionProps = animate ? {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] }
  } : {};

  return (
    <Component
      className={`text-3xl md:text-4xl font-bold text-white leading-tight ${className}`}
      {...motionProps}
      {...props}
    >
      {children}
    </Component>
  );
};

export const Heading3 = ({ 
  children, 
  className = '',
  animate = false,
  ...props 
}) => {
  const Component = animate ? motion.h3 : 'h3';
  const motionProps = animate ? {
    initial: { opacity: 0, y: 15 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] }
  } : {};

  return (
    <Component
      className={`text-2xl md:text-3xl font-semibold text-white leading-tight ${className}`}
      {...motionProps}
      {...props}
    >
      {children}
    </Component>
  );
};

export const Heading4 = ({ 
  children, 
  className = '',
  animate = false,
  ...props 
}) => {
  const Component = animate ? motion.h4 : 'h4';
  const motionProps = animate ? {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] }
  } : {};

  return (
    <Component
      className={`text-xl md:text-2xl font-semibold text-white leading-tight ${className}`}
      {...motionProps}
      {...props}
    >
      {children}
    </Component>
  );
};

// Параграфы
export const Paragraph = ({ 
  children, 
  size = 'base',
  color = 'gray-300',
  className = '',
  animate = false,
  ...props 
}) => {
  const Component = animate ? motion.p : 'p';
  const motionProps = animate ? {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] }
  } : {};

  const sizeClasses = {
    xs: 'text-xs',
    sm: 'text-sm',
    base: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl'
  };

  const colorClasses = {
    'gray-300': 'text-gray-300',
    'gray-400': 'text-gray-400',
    'gray-500': 'text-gray-500',
    'white': 'text-white',
    'primary': 'text-primary-400',
    'secondary': 'text-secondary-400',
    'accent': 'text-accent-400'
  };

  return (
    <Component
      className={`${sizeClasses[size]} ${colorClasses[color]} leading-relaxed ${className}`}
      {...motionProps}
      {...props}
    >
      {children}
    </Component>
  );
};

// Специальные текстовые элементы
export const Caption = ({ 
  children, 
  className = '',
  animate = false,
  ...props 
}) => {
  const Component = animate ? motion.span : 'span';
  const motionProps = animate ? {
    initial: { opacity: 0, scale: 0.9 },
    animate: { opacity: 1, scale: 1 },
    transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] }
  } : {};

  return (
    <Component
      className={`text-xs text-gray-400 uppercase tracking-wider font-medium ${className}`}
      {...motionProps}
      {...props}
    >
      {children}
    </Component>
  );
};

export const Label = ({ 
  children, 
  className = '',
  animate = false,
  ...props 
}) => {
  const Component = animate ? motion.label : 'label';
  const motionProps = animate ? {
    initial: { opacity: 0, y: 5 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] }
  } : {};

  return (
    <Component
      className={`text-sm font-medium text-gray-300 block mb-2 ${className}`}
      {...motionProps}
      {...props}
    >
      {children}
    </Component>
  );
};

// Код и моноширинный текст
export const Code = ({ 
  children, 
  className = '',
  animate = false,
  ...props 
}) => {
  const Component = animate ? motion.code : 'code';
  const motionProps = animate ? {
    initial: { opacity: 0, scale: 0.9 },
    animate: { opacity: 1, scale: 1 },
    transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] }
  } : {};

  return (
    <Component
      className={`font-mono text-sm bg-gray-800/50 px-2 py-1 rounded border border-gray-600 text-gray-300 ${className}`}
      {...motionProps}
      {...props}
    >
      {children}
    </Component>
  );
};

// Ссылки
export const Link = ({ 
  children, 
  href,
  className = '',
  animate = false,
  ...props 
}) => {
  const Component = animate ? motion.a : 'a';
  const motionProps = animate ? {
    whileHover: { scale: 1.05 },
    whileTap: { scale: 0.95 },
    transition: { duration: 0.2 }
  } : {};

  return (
    <Component
      href={href}
      className={`text-primary-400 hover:text-primary-300 transition-colors duration-200 underline-offset-4 hover:underline ${className}`}
      {...motionProps}
      {...props}
    >
      {children}
    </Component>
  );
};

// Счетчики и числа
export const Counter = ({ 
  value, 
  className = '',
  animate = false,
  ...props 
}) => {
  const Component = animate ? motion.span : 'span';
  const motionProps = animate ? {
    initial: { scale: 0.8, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    transition: { 
      duration: 0.5, 
      ease: [0.4, 0, 0.2, 1],
      type: "spring",
      stiffness: 200
    }
  } : {};

  return (
    <Component
      className={`font-bold text-white ${className}`}
      {...motionProps}
      {...props}
    >
      {value}
    </Component>
  );
};

// Градиентный текст
export const GradientText = ({ 
  children, 
  gradient = 'primary',
  className = '',
  animate = false,
  ...props 
}) => {
  const Component = animate ? motion.span : 'span';
  const motionProps = animate ? {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] }
  } : {};

  const gradientClasses = {
    primary: 'gradient-text',
    secondary: 'bg-gradient-to-r from-secondary-400 to-accent-400 bg-clip-text text-transparent',
    accent: 'bg-gradient-to-r from-accent-400 to-primary-400 bg-clip-text text-transparent',
    success: 'bg-gradient-to-r from-success-400 to-accent-400 bg-clip-text text-transparent',
    warning: 'bg-gradient-to-r from-warning-400 to-error-400 bg-clip-text text-transparent'
  };

  return (
    <Component
      className={`${gradientClasses[gradient]} font-bold ${className}`}
      {...motionProps}
      {...props}
    >
      {children}
    </Component>
  );
};
