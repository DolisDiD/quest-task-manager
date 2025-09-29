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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Заголовок */}
        <div>
          <h2 className="text-3xl font-bold text-white flex items-center space-x-3">
            <Crown className="w-8 h-8 text-purple-400" />
            <span>Админ-панель</span>
          </h2>
          <p className="text-gray-300 mt-2">
            Управление пользователями и кодами приглашений
          </p>
        </div>

        {/* Статистика */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 border border-blue-400/30 rounded-xl p-6 backdrop-blur-sm">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-blue-500/20 rounded-lg">
                <Users className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <p className="text-blue-300 text-sm font-medium">Всего пользователей</p>
                <p className="text-2xl font-bold text-white">{allUsers.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-500/20 to-green-600/20 border border-green-400/30 rounded-xl p-6 backdrop-blur-sm">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-green-500/20 rounded-lg">
                <Shield className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <p className="text-green-300 text-sm font-medium">Активные коды</p>
                <p className="text-2xl font-bold text-white">{allCodes.filter(code => code.is_active && !code.used_by).length}</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 border border-yellow-400/30 rounded-xl p-6 backdrop-blur-sm">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-yellow-500/20 rounded-lg">
                <Crown className="w-6 h-6 text-yellow-400" />
              </div>
              <div>
                <p className="text-yellow-300 text-sm font-medium">Архимаги</p>
                <p className="text-2xl font-bold text-white">{allUsers.filter(user => user.role_type === 'archimage').length}</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 border border-purple-400/30 rounded-xl p-6 backdrop-blur-sm">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-purple-500/20 rounded-lg">
                <User className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <p className="text-purple-300 text-sm font-medium">Исследователи</p>
                <p className="text-2xl font-bold text-white">{allUsers.filter(user => user.role_type === 'explorer').length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Управление кодами */}
        <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700/50 rounded-xl p-6 backdrop-blur-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold text-white flex items-center space-x-2">
              <Shield className="w-5 h-5 text-blue-400" />
              <span>Управление кодами</span>
            </h3>
            <button
              onClick={createSubscriptionCode}
              className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white px-6 py-3 rounded-xl flex items-center space-x-2 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <Plus className="w-5 h-5" />
              <span>Создать код подписки</span>
            </button>
          </div>

          <div className="space-y-4">
            {allCodes.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-700/50 rounded-full flex items-center justify-center">
                  <Shield className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-300 text-lg">Коды приглашений не найдены</p>
              </div>
            ) : (
              allCodes.map((code) => (
                <div
                  key={code.id}
                  className={`border rounded-xl p-6 transition-all duration-200 ${
                    code.is_active && !code.used_by
                      ? 'border-green-400/30 bg-gradient-to-r from-green-500/10 to-green-600/10 hover:from-green-500/20 hover:to-green-600/20'
                      : code.used_by
                      ? 'border-blue-400/30 bg-gradient-to-r from-blue-500/10 to-blue-600/10'
                      : 'border-red-400/30 bg-gradient-to-r from-red-500/10 to-red-600/10'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="p-3 bg-gray-700/50 rounded-lg">
                        {getRoleIcon(code.role_type)}
                      </div>
                      <div>
                        <div className="flex items-center space-x-3">
                          <span className="font-mono text-xl font-bold text-white bg-gray-800/50 px-3 py-1 rounded-lg">
                            {code.code}
                          </span>
                          {copiedCode === code.code && (
                            <div className="flex items-center space-x-1 text-green-400">
                              <Check className="w-4 h-4" />
                              <span className="text-sm">Скопировано!</span>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center space-x-6 text-sm text-gray-300 mt-2">
                          <span>Создан: {formatDate(code.created_at)}</span>
                          <span>Истекает: {formatDate(code.expires_at)}</span>
                          {code.used_by && (
                            <span className="text-green-400">
                              Использован: {formatDate(code.used_at)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => copyToClipboard(code.code)}
                        className="p-3 text-gray-300 hover:text-blue-400 hover:bg-blue-500/20 rounded-lg transition-all duration-200"
                        title="Копировать код"
                      >
                        <Copy className="w-5 h-5" />
                      </button>
                    </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

        {/* Список пользователей */}
        <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700/50 rounded-xl p-6 backdrop-blur-sm">
          <h3 className="text-xl font-semibold text-white mb-6 flex items-center space-x-2">
            <Users className="w-5 h-5 text-blue-400" />
            <span>Пользователи</span>
          </h3>
        
          <div className="space-y-4">
            {allUsers.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-700/50 rounded-full flex items-center justify-center">
                  <Users className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-300 text-lg">Пользователи не найдены</p>
              </div>
            ) : (
              allUsers.map((user) => (
                <div
                  key={user.id}
                  className="border border-gray-600/30 rounded-xl p-6 bg-gradient-to-r from-gray-700/20 to-gray-800/20 hover:from-gray-700/30 hover:to-gray-800/30 transition-all duration-200"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="p-3 bg-gray-700/50 rounded-lg">
                        {getRoleIcon(user.role_type)}
                      </div>
                      <div>
                        <div className="font-medium text-white">
                          Пользователь ID: {user.user_id}
                        </div>
                        <div className="flex items-center space-x-6 text-sm text-gray-300 mt-2">
                          <span className="flex items-center space-x-2">
                            <Shield className="w-4 h-4" />
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
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        user.is_active
                          ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                          : 'bg-red-500/20 text-red-400 border border-red-500/30'
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
    </div>
  );
};

export default AdminPanel;
