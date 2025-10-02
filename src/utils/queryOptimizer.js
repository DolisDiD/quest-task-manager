// Система оптимизации запросов и кэширования
// Обеспечивает высокую производительность при работе с большими объемами данных

import { createClient } from '@supabase/supabase-js';

// Конфигурация Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Кэш для запросов
class QueryCache {
  constructor(maxSize = 100, defaultTtl = 5 * 60 * 1000) { // 5 минут по умолчанию
    this.cache = new Map();
    this.maxSize = maxSize;
    this.defaultTtl = defaultTtl;
  }

  generateKey(query, params = {}) {
    const sortedParams = Object.keys(params)
      .sort()
      .reduce((result, key) => {
        result[key] = params[key];
        return result;
      }, {});
    
    return `${query}_${JSON.stringify(sortedParams)}`;
  }

  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;

    // Проверяем TTL
    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  set(key, data, ttl = this.defaultTtl) {
    // Если кэш переполнен, удаляем самый старый элемент
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(key, {
      data,
      expiresAt: Date.now() + ttl
    });
  }

  delete(key) {
    this.cache.delete(key);
  }

  clear() {
    this.cache.clear();
  }

  // Удаляет все ключи, содержащие определенную строку
  deletePattern(pattern) {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }
}

// Создаем глобальный кэш
const queryCache = new QueryCache();

// Оптимизированные запросы
export const optimizedQueries = {
  // Получение квестов с кэшированием
  async getQuests(userId, options = {}) {
    const cacheKey = queryCache.generateKey('quests', { userId, ...options });
    const cached = queryCache.get(cacheKey);
    
    if (cached) {
      console.log('📦 Cache hit for quests');
      return cached;
    }

    console.log('🔄 Fetching quests from database');
    
    const { data, error } = await supabase
      .from('quests')
      .select(`
        *,
        quest_subtasks(
          id,
          title,
          completed,
          xp,
          order_index
        ),
        assigned_by_profile:profiles!quests_assigned_by_fkey(id, name, email),
        assigned_to_profile:profiles!quests_assigned_to_fkey(id, name, email)
      `)
      .or(`created_by.eq.${userId},assigned_to.eq.${userId},assigned_by.eq.${userId}`)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const result = data || [];
    queryCache.set(cacheKey, result, 2 * 60 * 1000); // 2 минуты для квестов
    
    return result;
  },

  // Получение пользователей с пагинацией
  async getUsers(page = 0, limit = 20, search = '') {
    const cacheKey = queryCache.generateKey('users', { page, limit, search });
    const cached = queryCache.get(cacheKey);
    
    if (cached) {
      console.log('📦 Cache hit for users');
      return cached;
    }

    console.log('🔄 Fetching users from database');
    
    let query = supabase
      .from('profiles')
      .select('id, name, email, level, avatar, created_at')
      .order('created_at', { ascending: false })
      .range(page * limit, (page + 1) * limit - 1);

    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    const { data, error, count } = await query;

    if (error) throw error;

    const result = {
      data: data || [],
      count: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit)
    };

    queryCache.set(cacheKey, result, 5 * 60 * 1000); // 5 минут для пользователей
    
    return result;
  },

  // Получение друзей
  async getFriends(userId) {
    const cacheKey = queryCache.generateKey('friends', { userId });
    const cached = queryCache.get(cacheKey);
    
    if (cached) {
      console.log('📦 Cache hit for friends');
      return cached;
    }

    console.log('🔄 Fetching friends from database');
    
    const { data, error } = await supabase
      .from('friends')
      .select(`
        *,
        user1:profiles!friends_user1_id_fkey(id, name, email, level, avatar),
        user2:profiles!friends_user2_id_fkey(id, name, email, level, avatar)
      `)
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`);

    if (error) throw error;

    const result = data || [];
    queryCache.set(cacheKey, result, 10 * 60 * 1000); // 10 минут для друзей
    
    return result;
  },

  // Получение наград
  async getRewards(userId) {
    const cacheKey = queryCache.generateKey('rewards', { userId });
    const cached = queryCache.get(cacheKey);
    
    if (cached) {
      console.log('📦 Cache hit for rewards');
      return cached;
    }

    console.log('🔄 Fetching rewards from database');
    
    const { data, error } = await supabase
      .from('rewards')
      .select(`
        *,
        quest:quests(id, title)
      `)
      .eq('user_id', userId)
      .order('earned_at', { ascending: false });

    if (error) throw error;

    const result = data || [];
    queryCache.set(cacheKey, result, 3 * 60 * 1000); // 3 минуты для наград
    
    return result;
  }
};

// Функции для инвалидации кэша
export const cacheInvalidation = {
  // Инвалидирует кэш квестов
  invalidateQuests(userId) {
    queryCache.deletePattern(`quests_${userId}`);
    console.log('🗑️ Invalidated quests cache');
  },

  // Инвалидирует кэш пользователей
  invalidateUsers() {
    queryCache.deletePattern('users_');
    console.log('🗑️ Invalidated users cache');
  },

  // Инвалидирует кэш друзей
  invalidateFriends(userId) {
    queryCache.deletePattern(`friends_${userId}`);
    console.log('🗑️ Invalidated friends cache');
  },

  // Инвалидирует кэш наград
  invalidateRewards(userId) {
    queryCache.deletePattern(`rewards_${userId}`);
    console.log('🗑️ Invalidated rewards cache');
  },

  // Инвалидирует весь кэш
  invalidateAll() {
    queryCache.clear();
    console.log('🗑️ Invalidated all cache');
  }
};

// Хук для оптимизированных запросов
export const useOptimizedQuery = (queryKey, queryFn, options = {}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const executeQuery = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await queryFn();
      setData(result);
    } catch (err) {
      setError(err);
      console.error('Query error:', err);
    } finally {
      setLoading(false);
    }
  }, [queryFn]);

  useEffect(() => {
    executeQuery();
  }, [executeQuery]);

  return {
    data,
    loading,
    error,
    refetch: executeQuery
  };
};

// Система батчинга запросов
export class QueryBatcher {
  constructor(batchDelay = 50) {
    this.batchDelay = batchDelay;
    this.pendingQueries = new Map();
    this.batchTimeout = null;
  }

  addQuery(key, queryFn) {
    return new Promise((resolve, reject) => {
      this.pendingQueries.set(key, { queryFn, resolve, reject });
      
      if (this.batchTimeout) {
        clearTimeout(this.batchTimeout);
      }
      
      this.batchTimeout = setTimeout(() => {
        this.executeBatch();
      }, this.batchDelay);
    });
  }

  async executeBatch() {
    const queries = Array.from(this.pendingQueries.entries());
    this.pendingQueries.clear();
    this.batchTimeout = null;

    // Выполняем все запросы параллельно
    const results = await Promise.allSettled(
      queries.map(([key, { queryFn }]) => queryFn())
    );

    // Разрешаем или отклоняем промисы
    queries.forEach(([key, { resolve, reject }], index) => {
      const result = results[index];
      if (result.status === 'fulfilled') {
        resolve(result.value);
      } else {
        reject(result.reason);
      }
    });
  }
}

// Создаем глобальный батчер
export const queryBatcher = new QueryBatcher();

// Функция для оптимизации больших списков
export const optimizeListRendering = (items, itemHeight = 50, containerHeight = 400) => {
  const [scrollTop, setScrollTop] = useState(0);
  
  const visibleCount = Math.ceil(containerHeight / itemHeight) + 2; // +2 для буфера
  const startIndex = Math.floor(scrollTop / itemHeight);
  const endIndex = Math.min(startIndex + visibleCount, items.length);
  
  const visibleItems = items.slice(startIndex, endIndex);
  const totalHeight = items.length * itemHeight;
  const offsetY = startIndex * itemHeight;

  return {
    visibleItems,
    totalHeight,
    offsetY,
    setScrollTop
  };
};

// Функция для дебаунсинга поиска
export const createDebouncedSearch = (callback, delay = 300) => {
  let timeoutId;
  
  return (value) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => callback(value), delay);
  };
};

// Функция для мемоизации селекторов
export const createMemoizedSelector = (selectorFn, dependencies = []) => {
  let lastResult;
  let lastDependencies;

  return (state) => {
    const dependenciesChanged = !lastDependencies || 
      dependencies.some((dep, index) => dep !== lastDependencies[index]);

    if (dependenciesChanged) {
      lastResult = selectorFn(state);
      lastDependencies = dependencies;
    }

    return lastResult;
  };
};

// Экспортируем кэш для отладки
export { queryCache };




