import React, { useState } from 'react';
import { useInvitationCodes } from '../../hooks/useInvitationCodes';
import { useRoles } from '../../hooks/useRoles';
import { Shield, Check, X, AlertCircle } from 'lucide-react';

const ActivateCodeModal = ({ isOpen, onClose, onSuccess }) => {
  const [code, setCode] = useState('');
  const [isActivating, setIsActivating] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const { useInvitationCode } = useInvitationCodes();
  const { reloadRole } = useRoles();

  const handleActivate = async () => {
    if (!code.trim()) {
      setError('Введите код приглашения');
      return;
    }

    setIsActivating(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await useInvitationCode(code.trim().toUpperCase());
      
      if (result.error) {
        setError(result.error);
      } else {
        setSuccess(result.message);
        setCode('');
        
        // Обновляем роль пользователя
        await reloadRole();
        
        // Уведомляем родительский компонент об успехе
        if (onSuccess) {
          onSuccess(result.roleType);
        }
        
        // Закрываем модальное окно через 2 секунды
        setTimeout(() => {
          onClose();
          setSuccess(null);
        }, 2000);
      }
    } catch (err) {
      setError('Произошла ошибка при активации кода');
      console.error('Error activating code:', err);
    } finally {
      setIsActivating(false);
    }
  };

  const handleClose = () => {
    setCode('');
    setError(null);
    setSuccess(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center space-x-2">
            <Shield className="w-5 h-5 text-blue-500" />
            <span>Активация кода приглашения</span>
          </h3>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={isActivating}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Код приглашения
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="Введите код приглашения"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-center text-lg tracking-wider"
              disabled={isActivating}
            />
          </div>

          {/* Сообщения об ошибках */}
          {error && (
            <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <span className="text-red-700 text-sm">{error}</span>
            </div>
          )}

          {/* Сообщения об успехе */}
          {success && (
            <div className="flex items-center space-x-2 p-3 bg-green-50 border border-green-200 rounded-lg">
              <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
              <span className="text-green-700 text-sm">{success}</span>
            </div>
          )}

          {/* Информация о кодах */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-start space-x-2">
              <Shield className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Что дают коды приглашений:</p>
                <ul className="space-y-1 text-xs">
                  <li>• <strong>Исследователь:</strong> базовый доступ к приложению</li>
                  <li>• <strong>Архимаг:</strong> создание пачек карточек и кодов приглашений</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3 mt-6">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            disabled={isActivating}
          >
            Отмена
          </button>
          <button
            onClick={handleActivate}
            disabled={isActivating || !code.trim()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50 flex items-center space-x-2"
          >
            {isActivating && (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            )}
            <span>{isActivating ? 'Активация...' : 'Активировать'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ActivateCodeModal;
