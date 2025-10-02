import { useState, useEffect, useCallback, useMemo } from 'react';
import { useOptimizedState, useDebounce, useMemoizedCallback } from './useOptimizedState';

// Оптимизированный хук для управления квестами
export const useOptimizedQuests = (userId) => {
  const [quests, setQuests] = useOptimizedState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    difficulty: 'all',
    type: 'all'
  });
  const [sortBy, setSortBy] = useState('dueDate');
  const [sortOrder, setSortOrder] = useState('asc');
  const [expandedQuests, setExpandedQuests] = useState(new Set());

  // Дебаунсинг поиска
  const debouncedSearch = useDebounce(filters.search, 300);

  // Мемоизированные фильтры
  const filteredQuests = useMemo(() => {
    let filtered = [...quests];

    // Поиск
    if (debouncedSearch.trim()) {
      const searchLower = debouncedSearch.toLowerCase();
      filtered = filtered.filter(quest =>
        quest.title.toLowerCase().includes(searchLower) ||
        quest.description?.toLowerCase().includes(searchLower)
      );
    }

    // Фильтр по статусу
    if (filters.status !== 'all') {
      filtered = filtered.filter(quest => {
        switch (filters.status) {
          case 'completed':
            return quest.completed;
          case 'active':
            return !quest.completed;
          case 'overdue':
            return !quest.completed && quest.dueDate && new Date(quest.dueDate) < new Date();
          default:
            return true;
        }
      });
    }

    // Фильтр по сложности
    if (filters.difficulty !== 'all') {
      filtered = filtered.filter(quest => quest.difficulty === filters.difficulty);
    }

    // Фильтр по типу
    if (filters.type !== 'all') {
      filtered = filtered.filter(quest => quest.type === filters.type);
    }

    return filtered;
  }, [quests, debouncedSearch, filters]);

  // Мемоизированная сортировка
  const sortedQuests = useMemo(() => {
    const sorted = [...filteredQuests].sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'dueDate':
          const dateA = a.dueDate ? new Date(a.dueDate) : new Date('9999-12-31');
          const dateB = b.dueDate ? new Date(b.dueDate) : new Date('9999-12-31');
          comparison = dateA - dateB;
          break;
        case 'xp':
          comparison = 0; // XP sorting removed
          break;
        case 'difficulty':
          const difficultyOrder = { common: 0, rare: 1, epic: 2, legendary: 3 };
          comparison = difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty];
          break;
        case 'createdAt':
          comparison = new Date(a.createdAt) - new Date(b.createdAt);
          break;
        default:
          comparison = 0;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return sorted;
  }, [filteredQuests, sortBy, sortOrder]);

  // Статистика квестов
  const questStats = useMemo(() => {
    const total = quests.length;
    const completed = quests.filter(q => q.completed).length;
    const active = quests.filter(q => !q.completed).length;
    const overdue = quests.filter(q => 
      !q.completed && q.dueDate && new Date(q.dueDate) < new Date()
    ).length;
    const totalXp = 0; // XP system removed

    return {
      total,
      completed,
      active,
      overdue,
      totalXp,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0
    };
  }, [quests]);

  // Загрузка квестов
  const loadQuests = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('quests')
        .select(`
          *,
          quest_subtasks(
            id,
            title,
            completed,
            order_index
          ),
          assigned_by_profile:profiles!quests_assigned_by_fkey(id, name, email),
          assigned_to_profile:profiles!quests_assigned_to_fkey(id, name, email)
        `)
        .or(`created_by.eq.${userId},assigned_to.eq.${userId},assigned_by.eq.${userId}`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedQuests = data?.map(quest => ({
        id: quest.id,
        title: quest.title,
        description: quest.description,
        type: quest.type,
        difficulty: quest.difficulty,
        reward: quest.reward,
        bonus: quest.bonus,
        dueDate: quest.due_date,
        createdAt: quest.created_at,
        completed: quest.completed,
        progress: quest.progress || 0,
        totalSteps: quest.total_steps || 1,
        subtasks: quest.quest_subtasks || [],
        assignedBy: quest.assigned_by_profile,
        assignedTo: quest.assigned_to_profile
      })) || [];

      setQuests(formattedQuests);
    } catch (err) {
      console.error('Error loading quests:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Создание квеста
  const createQuest = useMemoizedCallback(async (questData) => {
    try {
      const { data, error } = await supabase
        .from('quests')
        .insert({
          ...questData,
          created_by: userId,
          total_steps: questData.subtasks?.length || 1
        })
        .select()
        .single();

      if (error) throw error;

      // Создаем подзадачи, если есть
      if (questData.subtasks?.length > 0) {
        const subtasksData = questData.subtasks.map((subtask, index) => ({
          quest_id: data.id,
          title: subtask.title,
          order_index: index,
          completed: false
        }));

        await supabase
          .from('quest_subtasks')
          .insert(subtasksData);
      }

      await loadQuests();
      return { success: true, data };
    } catch (err) {
      console.error('Error creating quest:', err);
      return { success: false, error: err.message };
    }
  }, [userId, loadQuests]);

  // Обновление квеста
  const updateQuest = useMemoizedCallback(async (questId, updates) => {
    try {
      const { error } = await supabase
        .from('quests')
        .update(updates)
        .eq('id', questId);

      if (error) throw error;

      await loadQuests();
      return { success: true };
    } catch (err) {
      console.error('Error updating quest:', err);
      return { success: false, error: err.message };
    }
  }, [loadQuests]);

  // Переключение статуса квеста
  const toggleQuest = useMemoizedCallback(async (questId) => {
    const quest = quests.find(q => q.id === questId);
    if (!quest) return { success: false, error: 'Quest not found' };

    const newCompleted = !quest.completed;
    const newProgress = newCompleted ? quest.totalSteps : 0;

    return await updateQuest(questId, {
      completed: newCompleted,
      progress: newProgress
    });
  }, [quests, updateQuest]);

  // Переключение подзадачи
  const toggleSubtask = useMemoizedCallback(async (questId, subtaskId) => {
    try {
      const quest = quests.find(q => q.id === questId);
      if (!quest) throw new Error('Quest not found');

      const subtask = quest.subtasks.find(st => st.id === subtaskId);
      if (!subtask) throw new Error('Subtask not found');

      const { error } = await supabase
        .from('quest_subtasks')
        .update({ completed: !subtask.completed })
        .eq('id', subtaskId);

      if (error) throw error;

      // Обновляем прогресс квеста
      const updatedSubtasks = quest.subtasks.map(st =>
        st.id === subtaskId ? { ...st, completed: !st.completed } : st
      );

      const completedSubtasks = updatedSubtasks.filter(st => st.completed).length;
      const newProgress = completedSubtasks;
      const newCompleted = newProgress === quest.totalSteps;

      await updateQuest(questId, {
        progress: newProgress,
        completed: newCompleted
      });

      return { success: true };
    } catch (err) {
      console.error('Error toggling subtask:', err);
      return { success: false, error: err.message };
    }
  }, [quests, updateQuest]);

  // Удаление квеста
  const deleteQuest = useMemoizedCallback(async (questId) => {
    try {
      // Сначала удаляем подзадачи
      await supabase
        .from('quest_subtasks')
        .delete()
        .eq('quest_id', questId);

      // Затем удаляем квест
      const { error } = await supabase
        .from('quests')
        .delete()
        .eq('id', questId);

      if (error) throw error;

      await loadQuests();
      return { success: true };
    } catch (err) {
      console.error('Error deleting quest:', err);
      return { success: false, error: err.message };
    }
  }, [loadQuests]);

  // Управление развернутыми квестами
  const toggleExpanded = useMemoizedCallback((questId) => {
    setExpandedQuests(prev => {
      const newSet = new Set(prev);
      if (newSet.has(questId)) {
        newSet.delete(questId);
      } else {
        newSet.add(questId);
      }
      return newSet;
    });
  }, []);

  // Обновление фильтров
  const updateFilters = useMemoizedCallback((newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  // Обновление сортировки
  const updateSorting = useMemoizedCallback((newSortBy, newSortOrder) => {
    setSortBy(newSortBy);
    setSortOrder(newSortOrder);
  }, []);

  // Сброс фильтров
  const resetFilters = useMemoizedCallback(() => {
    setFilters({
      search: '',
      status: 'all',
      difficulty: 'all',
      type: 'all'
    });
  }, []);

  // Загружаем квесты при изменении userId
  useEffect(() => {
    loadQuests();
  }, [loadQuests]);

  return {
    // Данные
    quests: sortedQuests,
    loading,
    error,
    questStats,
    
    // Фильтры и сортировка
    filters,
    sortBy,
    sortOrder,
    updateFilters,
    updateSorting,
    resetFilters,
    
    // Состояние UI
    expandedQuests,
    toggleExpanded,
    
    // Действия
    loadQuests,
    createQuest,
    updateQuest,
    toggleQuest,
    toggleSubtask,
    deleteQuest
  };
};




