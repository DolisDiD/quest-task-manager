import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export const useRoles = (userId) => {
  const [userRole, setUserRole] = useState(null);
  const [roleLimits, setRoleLimits] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Загрузка роли пользователя
  const loadUserRole = async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Получаем активную роль пользователя
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (roleError && roleError.code !== 'PGRST116') {
        throw roleError;
      }

      if (roleData) {
        setUserRole(roleData);
        // Устанавливаем базовые лимиты для ролей
        const defaultLimits = {
          admin: { max_packs: 999, max_invitation_codes: 999, can_create_packs: true, can_create_codes: true, can_manage_users: true, can_view_all: true },
          archimage: { max_packs: 10, max_invitation_codes: 5, can_create_packs: true, can_create_codes: true, can_manage_users: false, can_view_all: false },
          explorer: { max_packs: 3, max_invitation_codes: 1, can_create_packs: false, can_create_codes: false, can_manage_users: false, can_view_all: false }
        };
        setRoleLimits(defaultLimits[roleData.role_type] || defaultLimits.explorer);
      } else {
        // Если роли нет, создаем роль исследователя по умолчанию
        const { data: defaultRole, error: defaultError } = await supabase
          .from('user_roles')
          .insert({
            user_id: userId,
            role_type: 'explorer'
          })
          .select('*')
          .single();

        if (defaultError) {
          throw defaultError;
        }

        setUserRole(defaultRole);
        // Устанавливаем лимиты для исследователя
        const defaultLimits = {
          admin: { max_packs: 999, max_invitation_codes: 999, can_create_packs: true, can_create_codes: true, can_manage_users: true, can_view_all: true },
          archimage: { max_packs: 10, max_invitation_codes: 5, can_create_packs: true, can_create_codes: true, can_manage_users: false, can_view_all: false },
          explorer: { max_packs: 3, max_invitation_codes: 1, can_create_packs: false, can_create_codes: false, can_manage_users: false, can_view_all: false }
        };
        setRoleLimits(defaultLimits.explorer);
      }
    } catch (err) {
      console.error('Error loading user role:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Проверка прав доступа
  const hasPermission = (permission) => {
    if (!roleLimits) return false;
    return roleLimits[permission] || false;
  };

  // Проверка лимита пачек
  const checkPackLimit = async () => {
    if (!userId || !roleLimits) return false;

    try {
      const { data: packs, error } = await supabase
        .from('card_packs')
        .select('id')
        .eq('created_by', userId);

      if (error) throw error;

      return packs.length < roleLimits.max_packs;
    } catch (err) {
      console.error('Error checking pack limit:', err);
      return false;
    }
  };

  // Проверка лимита кодов приглашений
  const checkCodeLimit = async () => {
    if (!userId || !roleLimits) return false;

    try {
      const { data: codes, error } = await supabase
        .from('invitation_codes')
        .select('id')
        .eq('created_by', userId)
        .eq('is_active', true);

      if (error) throw error;

      return codes.length < roleLimits.max_invitation_codes;
    } catch (err) {
      console.error('Error checking code limit:', err);
      return false;
    }
  };

  // Обновление роли
  const updateRole = async (newRoleType, expiresAt = null) => {
    if (!userId) return { error: 'User ID required' };

    try {
      const { data, error } = await supabase
        .from('user_roles')
        .insert({
          user_id: userId,
          role_type: newRoleType,
          expires_at: expiresAt
        })
        .select('*')
        .single();

      if (error) throw error;

      setUserRole(data);
      
      // Устанавливаем лимиты для новой роли
      const defaultLimits = {
        admin: { max_packs: 999, max_invitation_codes: 999, can_create_packs: true, can_create_codes: true, can_manage_users: true, can_view_all: true },
        archimage: { max_packs: 10, max_invitation_codes: 5, can_create_packs: true, can_create_codes: true, can_manage_users: false, can_view_all: false },
        explorer: { max_packs: 3, max_invitation_codes: 1, can_create_packs: false, can_create_codes: false, can_manage_users: false, can_view_all: false }
      };
      setRoleLimits(defaultLimits[newRoleType] || defaultLimits.explorer);

      return { data, error: null };
    } catch (err) {
      console.error('Error updating role:', err);
      return { error: err.message };
    }
  };

  useEffect(() => {
    loadUserRole();
  }, [userId]);

  return {
    userRole,
    roleLimits,
    loading,
    error,
    hasPermission,
    checkPackLimit,
    checkCodeLimit,
    updateRole,
    reloadRole: loadUserRole
  };
};
