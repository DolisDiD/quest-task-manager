import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export const useInvitationCodes = (userId) => {
  const [codes, setCodes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Генерация случайного кода
  const generateCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  // Загрузка кодов пользователя
  const loadCodes = async () => {
    if (!userId) return;

    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('invitation_codes')
        .select('*')
        .eq('created_by', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setCodes(data || []);
    } catch (err) {
      console.error('Error loading invitation codes:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Создание кода приглашения
  const createInvitationCode = async (roleType, expiresInDays = 30) => {
    if (!userId) return { error: 'User ID required' };

    try {
      setError(null);

      // Генерируем уникальный код
      let code;
      let isUnique = false;
      let attempts = 0;

      while (!isUnique && attempts < 10) {
        code = generateCode();
        const { data: existingCode } = await supabase
          .from('invitation_codes')
          .select('id')
          .eq('code', code)
          .single();

        if (!existingCode) {
          isUnique = true;
        }
        attempts++;
      }

      if (!isUnique) {
        throw new Error('Не удалось сгенерировать уникальный код');
      }

      // Устанавливаем дату истечения
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expiresInDays);

      const { data, error } = await supabase
        .from('invitation_codes')
        .insert({
          code,
          role_type: roleType,
          expires_at: expiresAt.toISOString(),
          created_by: userId
        })
        .select('*')
        .single();

      if (error) throw error;

      // Обновляем список кодов
      setCodes(prev => [data, ...prev]);

      return { data, error: null };
    } catch (err) {
      console.error('Error creating invitation code:', err);
      setError(err.message);
      return { error: err.message };
    }
  };

  // Использование кода приглашения
  const useInvitationCode = async (code) => {
    if (!userId) return { error: 'User ID required' };

    try {
      setError(null);

      // Проверяем код
      const { data: codeData, error: codeError } = await supabase
        .from('invitation_codes')
        .select('*')
        .eq('code', code.toUpperCase())
        .eq('is_active', true)
        .is('used_by', null)
        .single();

      if (codeError) {
        if (codeError.code === 'PGRST116') {
          return { error: 'Код не найден или уже использован' };
        }
        throw codeError;
      }

      // Проверяем срок действия
      if (new Date() > new Date(codeData.expires_at)) {
        return { error: 'Код истек' };
      }

      // Активируем роль
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: userId,
          role_type: codeData.role_type,
          expires_at: codeData.expires_at
        });

      if (roleError) {
        throw roleError;
      }

      // Помечаем код как использованный
      const { error: updateError } = await supabase
        .from('invitation_codes')
        .update({ 
          used_by: userId, 
          used_at: new Date().toISOString() 
        })
        .eq('id', codeData.id);

      if (updateError) {
        throw updateError;
      }

      return { 
        success: true, 
        roleType: codeData.role_type,
        message: `Роль ${codeData.role_type} успешно активирована!`
      };
    } catch (err) {
      console.error('Error using invitation code:', err);
      setError(err.message);
      return { error: err.message };
    }
  };

  // Деактивация кода
  const deactivateCode = async (codeId) => {
    try {
      const { error } = await supabase
        .from('invitation_codes')
        .update({ is_active: false })
        .eq('id', codeId);

      if (error) throw error;

      // Обновляем список кодов
      setCodes(prev => 
        prev.map(code => 
          code.id === codeId 
            ? { ...code, is_active: false }
            : code
        )
      );

      return { success: true };
    } catch (err) {
      console.error('Error deactivating code:', err);
      setError(err.message);
      return { error: err.message };
    }
  };

  useEffect(() => {
    loadCodes();
  }, [userId]);

  return {
    codes,
    loading,
    error,
    createInvitationCode,
    useInvitationCode,
    deactivateCode,
    reloadCodes: loadCodes
  };
};
