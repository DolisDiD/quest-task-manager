import React, { useState, useEffect } from 'react';
import { useInvitationCodes } from '../../hooks/useInvitationCodes';
import { useRoles } from '../../hooks/useRoles';
import { supabase } from '../../lib/supabase';
import { 
  Crown, Shield, Users, Plus, Copy, Check, 
  RefreshCw, Eye, EyeOff, Trash2, AlertCircle
} from 'lucide-react';

const AdminPanel = ({ userId }) => {
  const { 
    codes, 
    loading: codesLoading, 
    createInvitationCode, 
    reloadCodes 
  } = useInvitationCodes(userId);
  
  const { roleLimits } = useRoles(userId);
  
  const [allUsers, setAllUsers] = useState([]);
  const [allCodes, setAllCodes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copiedCode, setCopiedCode] = useState(null);

  // Загрузка всех пользователей
  const loadAllUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('user_roles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAllUsers(data || []);
    } catch (err) {
      console.error('Error loading users:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Загрузка всех кодов
  const loadAllCodes = async () => {
    try {
      const { data, error } = await supabase
        .from('invitation_codes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAllCodes(data || []);
    } catch (err) {
      console.error('Error loading all codes:', err);
    }
  };

  // Создание кода подписки
  const createSubscriptionCode = async () => {
    try {
      const result = await createInvitationCode('archimage', 365); // 1 год
      if (result.error) {
        alert(`Ошибка создания кода: ${result.error}`);
      } else {
        alert('Код подписки создан успешно!');
        loadAllCodes();
      }
    } catch (err) {
      alert(`Ошибка: ${err.message}`);
    }
  };

  // Копирование кода
  const copyToClipboard = async (code) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  // Форматирование даты
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Получение иконки роли
  const getRoleIcon = (roleType) => {
    switch (roleType) {
      case 'admin': return <Crown className="w-4 h-4 text-purple-500" />;
      case 'archimage': return <Crown className="w-4 h-4 text-yellow-500" />;
      case 'explorer': return <Shield className="w-4 h-4 text-blue-500" />;
      default: return <Shield className="w-4 h-4 text-gray-500" />;
    }
  };

  // Получение названия роли
  const getRoleName = (roleType) => {
    switch (roleType) {
      case 'admin': return 'Админ';
      case 'archimage': return 'Архимаг';
      case 'explorer': return 'Исследователь';
      default: return roleType;
    }
  };

  useEffect(() => {
    loadAllUsers();
    loadAllCodes();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
        <span className="ml-2">Загрузка админ-панели...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Заголовок */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
          <Crown className="w-6 h-6 text-purple-500" />
          <span>Админ-панель</span>
        </h2>
        <p className="text-gray-600 mt-1">
          Управление пользователями и кодами приглашений
        </p>
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-blue-600" />
            <span className="font-medium text-blue-900">Всего пользователей</span>
          </div>
          <p className="text-2xl font-bold text-blue-800 mt-2">
            {allUsers.length}
          </p>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <Shield className="w-5 h-5 text-green-600" />
            <span className="font-medium text-green-900">Активные коды</span>
          </div>
          <p className="text-2xl font-bold text-green-800 mt-2">
            {allCodes.filter(code => code.is_active && !code.used_by).length}
          </p>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <Crown className="w-5 h-5 text-yellow-600" />
            <span className="font-medium text-yellow-900">Архимаги</span>
          </div>
          <p className="text-2xl font-bold text-yellow-800 mt-2">
            {allUsers.filter(user => user.role_type === 'archimage').length}
          </p>
        </div>
      </div>

      {/* Управление кодами */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Управление кодами</h3>
          <button
            onClick={createSubscriptionCode}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Создать код подписки</span>
          </button>
        </div>

        <div className="space-y-3">
          {allCodes.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Shield className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>Коды приглашений не найдены</p>
            </div>
          ) : (
            allCodes.map((code) => (
              <div
                key={code.id}
                className={`border rounded-lg p-4 ${
                  code.is_active && !code.used_by
                    ? 'border-green-200 bg-green-50'
                    : 'border-red-200 bg-red-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {getRoleIcon(code.role_type)}
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-lg font-bold">
                          {code.code}
                        </span>
                        {copiedCode === code.code && (
                          <Check className="w-4 h-4 text-green-500" />
                        )}
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                        <span>Создан: {formatDate(code.created_at)}</span>
                        <span>Истекает: {formatDate(code.expires_at)}</span>
                        {code.used_by && (
                          <span className="text-green-600">
                            Использован: {formatDate(code.used_at)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => copyToClipboard(code.code)}
                      className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                      title="Копировать код"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Список пользователей */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Пользователи</h3>
        
        <div className="space-y-3">
          {allUsers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>Пользователи не найдены</p>
            </div>
          ) : (
            allUsers.map((user) => (
              <div
                key={user.id}
                className="border border-gray-200 rounded-lg p-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {getRoleIcon(user.role_type)}
                    <div>
                      <div className="font-medium">
                        Пользователь ID: {user.user_id}
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                        <span className="flex items-center space-x-1">
                          <Shield className="w-3 h-3" />
                          <span>{getRoleName(user.role_type)}</span>
                        </span>
                        <span>
                          Зарегистрирован: {formatDate(user.created_at)}
                        </span>
                        {user.expires_at && (
                          <span>
                            Истекает: {formatDate(user.expires_at)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      user.is_active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {user.is_active ? 'Активен' : 'Неактивен'}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
