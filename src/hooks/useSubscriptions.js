import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export const useSubscriptions = (userId) => {
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Загрузка подписки пользователя
  const loadSubscription = async () => {
    if (!userId) return;

    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .gt('end_date', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      setSubscription(data);
    } catch (err) {
      console.error('Error loading subscription:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Создание подписки
  const createSubscription = async (planType, paymentId) => {
    if (!userId) return { error: 'User ID required' };

    try {
      setError(null);

      const startDate = new Date();
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 1); // 1 месяц

      const { data, error } = await supabase
        .from('subscriptions')
        .insert({
          user_id: userId,
          plan_type: planType,
          status: 'active',
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
          payment_id: paymentId
        })
        .select('*')
        .single();

      if (error) throw error;

      setSubscription(data);

      return { data, error: null };
    } catch (err) {
      console.error('Error creating subscription:', err);
      setError(err.message);
      return { error: err.message };
    }
  };

  // Проверка активной подписки
  const checkActiveSubscription = async () => {
    if (!userId) return false;

    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .gt('end_date', new Date().toISOString())
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return !!data;
    } catch (err) {
      console.error('Error checking active subscription:', err);
      return false;
    }
  };

  // Продление подписки
  const extendSubscription = async (months = 1) => {
    if (!subscription) return { error: 'No active subscription' };

    try {
      setError(null);

      const newEndDate = new Date(subscription.end_date);
      newEndDate.setMonth(newEndDate.getMonth() + months);

      const { data, error } = await supabase
        .from('subscriptions')
        .update({
          end_date: newEndDate.toISOString()
        })
        .eq('id', subscription.id)
        .select('*')
        .single();

      if (error) throw error;

      setSubscription(data);

      return { data, error: null };
    } catch (err) {
      console.error('Error extending subscription:', err);
      setError(err.message);
      return { error: err.message };
    }
  };

  // Отмена подписки
  const cancelSubscription = async () => {
    if (!subscription) return { error: 'No active subscription' };

    try {
      setError(null);

      const { data, error } = await supabase
        .from('subscriptions')
        .update({
          status: 'cancelled'
        })
        .eq('id', subscription.id)
        .select('*')
        .single();

      if (error) throw error;

      setSubscription(data);

      return { data, error: null };
    } catch (err) {
      console.error('Error cancelling subscription:', err);
      setError(err.message);
      return { error: err.message };
    }
  };

  // Проверка истечения подписки
  const checkExpiration = async () => {
    if (!subscription) return false;

    const now = new Date();
    const endDate = new Date(subscription.end_date);

    if (now > endDate) {
      // Подписка истекла, обновляем статус
      const { error } = await supabase
        .from('subscriptions')
        .update({ status: 'expired' })
        .eq('id', subscription.id);

      if (!error) {
        setSubscription(null);
      }

      return true;
    }

    return false;
  };

  useEffect(() => {
    loadSubscription();
  }, [userId]);

  // Проверяем истечение подписки каждые 5 минут
  useEffect(() => {
    if (!subscription) return;

    const interval = setInterval(() => {
      checkExpiration();
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [subscription]);

  return {
    subscription,
    loading,
    error,
    createSubscription,
    checkActiveSubscription,
    extendSubscription,
    cancelSubscription,
    checkExpiration,
    reloadSubscription: loadSubscription
  };
};
