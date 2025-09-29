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
    <div className="space-y-6">
      {/* Заголовок и кнопка создания */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Коды приглашений</h2>
          <p className="text-gray-600 mt-1">
            Создавайте коды для приглашения пользователей
          </p>
        </div>
        
        {roleLimits?.can_create_codes && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Создать код</span>
          </button>
        )}
      </div>

      {/* Информация о лимитах */}
      {roleLimits && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <Shield className="w-5 h-5 text-blue-600" />
            <span className="font-medium text-blue-900">Ваши лимиты:</span>
          </div>
          <div className="mt-2 text-sm text-blue-800">
            <p>Максимум кодов: {roleLimits.max_invitation_codes}</p>
            <p>Создано кодов: {codes.length}</p>
          </div>
        </div>
      )}

      {/* Список кодов */}
      <div className="space-y-4">
        {codes.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Shield className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>У вас пока нет кодов приглашений</p>
            {roleLimits?.can_create_codes && (
              <p className="text-sm mt-1">Создайте первый код, чтобы пригласить пользователей</p>
            )}
          </div>
        ) : (
          codes.map((code) => (
            <div
              key={code.id}
              className={`border rounded-lg p-4 ${
                code.is_active 
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
                      <span className="flex items-center space-x-1">
                        <Shield className="w-3 h-3" />
                        <span>{getRoleName(code.role_type)}</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>Истекает: {formatDate(code.expires_at)}</span>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {code.is_active && (
                    <button
                      onClick={() => copyToClipboard(code.code)}
                      className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                      title="Копировать код"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  )}
                  
                  {code.is_active && (
                    <button
                      onClick={() => handleDeactivateCode(code.id)}
                      className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                      title="Деактивировать код"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Информация об использовании */}
              {code.used_by && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <div className="flex items-center space-x-2 text-sm">
                    <User className="w-4 h-4 text-green-500" />
                    <span className="text-gray-600">
                      Использован: {formatDate(code.used_at)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Модальное окно создания кода */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Создать код приглашения</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Тип роли
                </label>
                <select
                  value={newCodeType}
                  onChange={(e) => setNewCodeType(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="explorer">Исследователь</option>
                  {roleLimits?.role_type === 'admin' && (
                    <option value="archimage">Архимаг</option>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Срок действия (дни)
                </label>
                <input
                  type="number"
                  value={expiresInDays}
                  onChange={(e) => setExpiresInDays(parseInt(e.target.value))}
                  min="1"
                  max="365"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                disabled={isCreating}
              >
                Отмена
              </button>
              <button
                onClick={handleCreateCode}
                disabled={isCreating}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
              >
                {isCreating ? 'Создание...' : 'Создать код'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvitationCodesTab;
