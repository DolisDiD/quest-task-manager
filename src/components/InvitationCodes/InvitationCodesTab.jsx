import React, { useState } from 'react';
import { useInvitationCodes } from '../../hooks/useInvitationCodes';
import { useRoles } from '../../hooks/useRoles';
import { 
  Plus, Copy, Check, X, Clock, User, Shield, Crown, 
  Eye, EyeOff, Trash2, RefreshCw
} from 'lucide-react';

const InvitationCodesTab = ({ userId }) => {
  const { 
    codes, 
    loading, 
    error, 
    createInvitationCode, 
    deactivateCode,
    reloadCodes 
  } = useInvitationCodes(userId);
  
  const { roleLimits, checkCodeLimit } = useRoles(userId);
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCodeType, setNewCodeType] = useState('explorer');
  const [expiresInDays, setExpiresInDays] = useState(30);
  const [copiedCode, setCopiedCode] = useState(null);
  const [isCreating, setIsCreating] = useState(false);

  // Создание нового кода
  const handleCreateCode = async () => {
    if (!roleLimits?.can_create_codes) {
      alert('У вас нет прав для создания кодов приглашений');
      return;
    }

    const canCreate = await checkCodeLimit();
    if (!canCreate) {
      alert(`Достигнут лимит кодов приглашений (${roleLimits.max_invitation_codes})`);
      return;
    }

    setIsCreating(true);
    const result = await createInvitationCode(newCodeType, expiresInDays);
    setIsCreating(false);

    if (result.error) {
      alert(`Ошибка создания кода: ${result.error}`);
    } else {
      setShowCreateModal(false);
      setNewCodeType('explorer');
      setExpiresInDays(30);
    }
  };

  // Копирование кода в буфер обмена
  const copyToClipboard = async (code) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  // Деактивация кода
  const handleDeactivateCode = async (codeId) => {
    if (!confirm('Вы уверены, что хотите деактивировать этот код?')) {
      return;
    }

    const result = await deactivateCode(codeId);
    if (result.error) {
      alert(`Ошибка деактивации кода: ${result.error}`);
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
      case 'archimage': return <Crown className="w-4 h-4 text-yellow-500" />;
      case 'explorer': return <User className="w-4 h-4 text-blue-500" />;
      default: return <Shield className="w-4 h-4 text-gray-500" />;
    }
  };

  // Получение названия роли
  const getRoleName = (roleType) => {
    switch (roleType) {
      case 'archimage': return 'Архимаг';
      case 'explorer': return 'Исследователь';
      default: return roleType;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
        <span className="ml-2">Загрузка кодов...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Заголовок и кнопка создания */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold text-white flex items-center space-x-3">
              <Shield className="w-8 h-8 text-blue-400" />
              <span>Коды приглашений</span>
            </h2>
            <p className="text-gray-300 mt-2">
              Создавайте коды для приглашения исследователей
            </p>
          </div>
        
        {roleLimits?.can_create_codes && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-3 rounded-xl flex items-center space-x-2 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            <Plus className="w-5 h-5" />
            <span>Создать код</span>
          </button>
        )}
        </div>

      {/* Статистика кодов */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 border border-blue-400/30 rounded-xl p-6 backdrop-blur-sm">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-blue-500/20 rounded-lg">
              <Shield className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <p className="text-blue-300 text-sm font-medium">Создано кодов</p>
              <p className="text-2xl font-bold text-white">{codes.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500/20 to-green-600/20 border border-green-400/30 rounded-xl p-6 backdrop-blur-sm">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-green-500/20 rounded-lg">
              <Check className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <p className="text-green-300 text-sm font-medium">Использовано</p>
              <p className="text-2xl font-bold text-white">{codes.filter(code => code.used_by).length}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 border border-yellow-400/30 rounded-xl p-6 backdrop-blur-sm">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-yellow-500/20 rounded-lg">
              <Clock className="w-6 h-6 text-yellow-400" />
            </div>
            <div>
              <p className="text-yellow-300 text-sm font-medium">Активных</p>
              <p className="text-2xl font-bold text-white">{codes.filter(code => code.is_active && !code.used_by).length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Список кодов */}
      <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700/50 rounded-xl p-6 backdrop-blur-sm">
        <h3 className="text-xl font-semibold text-white mb-6 flex items-center space-x-2">
          <Shield className="w-5 h-5 text-blue-400" />
          <span>Ваши коды приглашений</span>
        </h3>
        
        <div className="space-y-4">
          {codes.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-700/50 rounded-full flex items-center justify-center">
                <Shield className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-300 text-lg mb-2">У вас пока нет кодов приглашений</p>
              {roleLimits?.can_create_codes && (
                <p className="text-gray-400 text-sm">Создайте первый код, чтобы пригласить исследователей</p>
              )}
            </div>
          ) : (
            codes.map((code) => (
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
                        <span className="flex items-center space-x-2">
                          <Shield className="w-4 h-4" />
                          <span>{getRoleName(code.role_type)}</span>
                        </span>
                        <span className="flex items-center space-x-2">
                          <Clock className="w-4 h-4" />
                          <span>Истекает: {formatDate(code.expires_at)}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {code.is_active && !code.used_by && (
                      <button
                        onClick={() => copyToClipboard(code.code)}
                        className="p-3 text-gray-300 hover:text-blue-400 hover:bg-blue-500/20 rounded-lg transition-all duration-200"
                        title="Копировать код"
                      >
                        <Copy className="w-5 h-5" />
                      </button>
                    )}
                    
                    {code.is_active && !code.used_by && (
                      <button
                        onClick={() => handleDeactivateCode(code.id)}
                        className="p-3 text-gray-300 hover:text-red-400 hover:bg-red-500/20 rounded-lg transition-all duration-200"
                        title="Деактивировать код"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    )}
                  </div>
              </div>

                {/* Информация об использовании */}
                {code.used_by && (
                  <div className="mt-4 pt-4 border-t border-gray-600/30">
                    <div className="flex items-center space-x-2 text-sm">
                      <div className="p-2 bg-green-500/20 rounded-lg">
                        <User className="w-4 h-4 text-green-400" />
                      </div>
                      <span className="text-green-300">
                        Использован: {formatDate(code.used_at)}
                      </span>
                    </div>
                  </div>
                )}
            </div>
          ))
        )}
        </div>
      </div>
    </div>

      {/* Модальное окно создания кода */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Plus className="w-5 h-5 text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold text-white">Создать код приглашения</h3>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  Тип роли
                </label>
                <select
                  value={newCodeType}
                  onChange={(e) => setNewCodeType(e.target.value)}
                  className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="explorer">Исследователь</option>
                  {roleLimits?.role_type === 'admin' && (
                    <option value="archimage">Архимаг</option>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  Срок действия (дни)
                </label>
                <input
                  type="number"
                  value={expiresInDays}
                  onChange={(e) => setExpiresInDays(parseInt(e.target.value))}
                  min="1"
                  max="365"
                  className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-8">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-6 py-3 text-gray-300 hover:text-white hover:bg-gray-700/50 rounded-lg transition-all duration-200"
                disabled={isCreating}
              >
                Отмена
              </button>
              <button
                onClick={handleCreateCode}
                disabled={isCreating}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-3 rounded-lg transition-all duration-200 disabled:opacity-50 flex items-center space-x-2"
              >
                {isCreating && <RefreshCw className="w-4 h-4 animate-spin" />}
                <span>{isCreating ? 'Создание...' : 'Создать код'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvitationCodesTab;
