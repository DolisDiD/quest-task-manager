import { useState, useCallback, useRef, useEffect } from 'react';

// Оптимизированный хук состояния с мемоизацией
export const useOptimizedState = (initialValue) => {
  const [state, setState] = useState(initialValue);
  const stateRef = useRef(state);
  
  // Обновляем ref при изменении состояния
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const setOptimizedState = useCallback((newValue) => {
    if (typeof newValue === 'function') {
      setState(prevState => {
        const result = newValue(prevState);
        // Проверяем, действительно ли значение изменилось
        if (Object.is(result, prevState)) {
          return prevState;
        }
        return result;
      });
    } else {
      // Проверяем, действительно ли значение изменилось
      if (Object.is(newValue, stateRef.current)) {
        return;
      }
      setState(newValue);
    }
  }, []);

  return [state, setOptimizedState];
};

// Хук для дебаунсинга
export const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// Хук для мемоизации колбэков
export const useMemoizedCallback = (callback, deps) => {
  const callbackRef = useRef(callback);
  
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  return useCallback((...args) => {
    return callbackRef.current(...args);
  }, deps);
};

// Хук для состояния загрузки
export const useLoadingState = (initialLoading = false) => {
  const [isLoading, setIsLoading] = useState(initialLoading);
  const [error, setError] = useState(null);

  const startLoading = useCallback(() => {
    setIsLoading(true);
    setError(null);
  }, []);

  const stopLoading = useCallback(() => {
    setIsLoading(false);
  }, []);

  const setLoadingError = useCallback((error) => {
    setIsLoading(false);
    setError(error);
  }, []);

  const reset = useCallback(() => {
    setIsLoading(false);
    setError(null);
  }, []);

  return {
    isLoading,
    error,
    startLoading,
    stopLoading,
    setLoadingError,
    reset
  };
};

// Хук для уведомлений
export const useNotificationState = () => {
  const [notifications, setNotifications] = useState([]);

  const addNotification = useCallback((message, type = 'info', duration = 5000) => {
    const id = Date.now() + Math.random();
    const notification = { id, message, type, duration };
    
    setNotifications(prev => [...prev, notification]);

    // Автоматическое удаление
    if (duration > 0) {
      setTimeout(() => {
        removeNotification(id);
      }, duration);
    }
  }, []);

  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  return {
    notifications,
    addNotification,
    removeNotification,
    clearAll
  };
};

// Хук для оптимизированного поиска
export const useOptimizedSearch = (items, searchFields, searchTerm) => {
  const [filteredItems, setFilteredItems] = useState(items);

  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredItems(items);
      return;
    }

    const searchLower = searchTerm.toLowerCase();
    const filtered = items.filter(item => {
      return searchFields.some(field => {
        const value = item[field];
        return value && value.toString().toLowerCase().includes(searchLower);
      });
    });

    setFilteredItems(filtered);
  }, [items, searchFields, searchTerm]);

  return filteredItems;
};

// Хук для виртуализации списков
export const useVirtualization = (items, itemHeight, containerHeight) => {
  const [scrollTop, setScrollTop] = useState(0);
  
  const visibleStart = Math.floor(scrollTop / itemHeight);
  const visibleEnd = Math.min(
    visibleStart + Math.ceil(containerHeight / itemHeight) + 1,
    items.length
  );
  
  const visibleItems = items.slice(visibleStart, visibleEnd);
  const totalHeight = items.length * itemHeight;
  const offsetY = visibleStart * itemHeight;

  const handleScroll = useCallback((e) => {
    setScrollTop(e.target.scrollTop);
  }, []);

  return {
    visibleItems,
    totalHeight,
    offsetY,
    handleScroll
  };
};
