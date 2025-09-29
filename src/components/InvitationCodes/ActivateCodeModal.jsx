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
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-xl p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-white flex items-center space-x-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Shield className="w-6 h-6 text-blue-400" />
            </div>
            <span>Активация кода приглашения</span>
          </h3>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white hover:bg-gray-700/50 p-2 rounded-lg transition-all duration-200"
            disabled={isActivating}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Код приглашения
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="Введите код приглашения"
              className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-center text-xl tracking-wider text-white"
              disabled={isActivating}
            />
          </div>

          {/* Сообщения об ошибках */}
          {error && (
            <div className="flex items-center space-x-3 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
              <div className="p-2 bg-red-500/20 rounded-lg">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
              </div>
              <span className="text-red-300 text-sm">{error}</span>
            </div>
          )}

          {/* Сообщения об успехе */}
          {success && (
            <div className="flex items-center space-x-3 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
              </div>
              <span className="text-green-300 text-sm">{success}</span>
            </div>
          )}

          {/* Информация о кодах */}
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Shield className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
              </div>
              <div className="text-sm text-blue-300">
                <p className="font-medium mb-2 text-blue-200">Что дают коды приглашений:</p>
                <ul className="space-y-1 text-xs">
                  <li>• <strong className="text-blue-100">Исследователь:</strong> базовый доступ к приложению</li>
                  <li>• <strong className="text-blue-100">Архимаг:</strong> создание пачек карточек и кодов приглашений</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3 mt-8">
          <button
            onClick={handleClose}
            className="px-6 py-3 text-gray-300 hover:text-white hover:bg-gray-700/50 rounded-lg transition-all duration-200"
            disabled={isActivating}
          >
            Отмена
          </button>
          <button
            onClick={handleActivate}
            disabled={isActivating || !code.trim()}
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-3 rounded-lg transition-all duration-200 disabled:opacity-50 flex items-center space-x-2"
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
