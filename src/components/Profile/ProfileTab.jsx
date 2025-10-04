import React, { useState, useEffect, useCallback } from 'react';
import { 
  Edit2, X, Mail, Lock, Trophy, Users, Shield, Settings, 
  Crown, Key, User, Zap, Award, Eye, Gift
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

const ProfileTab = ({ 
  user, 
  currentUser, 
  userRole, 
  friends = [], 
  onTabChange, 
  onShowActivateCodeModal,
  hasPermission,
  addNotification 
}) => {
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: currentUser?.name || '',
    email: currentUser?.email || '',
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Синхронизировать форму профиля с актуальными данными пользователя
  useEffect(() => {
    if (user && currentUser) {
      setProfileForm(prev => ({
        ...prev,
        name: currentUser.name || user.user_metadata?.name || user.email?.split('@')[0] || '',
        email: currentUser.email || user.email || ''
      }));
    }
  }, [user, currentUser]);

  const getAvatarIcon = (avatar) => {
    switch (avatar) {
      case 'Hero': return <User className="w-6 h-6 sm:w-8 sm:h-8 text-blue-400" />;
      case 'Wizard': return <Zap className="w-6 h-6 sm:w-8 sm:h-8 text-indigo-400" />;
      case 'Knight': return <Award className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />;
      case 'Ranger': return <Eye className="w-6 h-6 sm:w-8 sm:h-8 text-emerald-400" />;
      case 'Alchemist': return <Gift className="w-6 h-6 sm:w-8 sm:h-8 text-orange-400" />;
      default: return <User className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />;
    }
  };

  const testStorageConnection = async () => {
    try {
      const { data: publicListData, error: publicListError } = await supabase.storage
        .from('public')
        .list('', { limit: 1 });
      
      const { data: publicUploadData, error: publicUploadError } = await supabase.storage
        .from('public')
        .upload('test.txt', new Blob(['test'], { type: 'text/plain' }), { upsert: true });
      
      return {
        publicBucket: { list: publicListData, listError: publicListError, upload: publicUploadData, uploadError: publicUploadError }
      };
    } catch (e) {
      console.error('Storage test failed:', e);
      return { error: e.message };
    }
  };

  const saveProfile = async () => {
    try {
      if (!user) {
        alert('Пользователь не авторизован');
        return;
      }

      if (profileForm.newPassword && profileForm.newPassword !== profileForm.confirmPassword) {
        alert('Пароли не совпадают!');
        return;
      }

      // Обновить метаданные пользователя
      const updates = {};
      const metaUpdates = {};

      if (profileForm.name && profileForm.name !== (user.user_metadata?.name || currentUser.name)) {
        metaUpdates.name = profileForm.name;
      }
      if (Object.keys(metaUpdates).length > 0) {
        const { error: metaErr } = await supabase.auth.updateUser({ data: metaUpdates });
        if (metaErr) {
          console.error('❌ Error updating user metadata:', metaErr);
          alert('Ошибка обновления имени: ' + metaErr.message);
          return;
        }
      }

      if (profileForm.email && profileForm.email !== user.email) {
        updates.email = profileForm.email;
      }
      if (profileForm.newPassword) {
        updates.password = profileForm.newPassword;
      }
      if (Object.keys(updates).length > 0) {
        const { error: authErr } = await supabase.auth.updateUser(updates);
        if (authErr) {
          console.error('❌ Error updating auth:', authErr);
          alert('Ошибка обновления данных: ' + authErr.message);
          return;
        }
      }

      // Обновить профиль в базе
      const { error: profileErr } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          name: profileForm.name || currentUser.name,
          email: profileForm.email || user.email,
          level: currentUser.level || 2,
          avatar: currentUser.avatar || 'Hero'
        });

      if (profileErr) {
        console.error('❌ Error updating profile row:', profileErr);
        alert('Ошибка обновления профиля: ' + profileErr.message);
        return;
      }

      setEditingProfile(false);
      setProfileForm(prev => ({ ...prev, oldPassword: '', newPassword: '', confirmPassword: '' }));

      addNotification('Данные изменены', 'success');

      // Если изменили email или пароль, перезагрузить страницу
      const emailOrPasswordChanged = (updates.email && updates.email !== user.email) || !!updates.password;
      if (emailOrPasswordChanged) {
        setTimeout(() => {
          window.location.reload();
        }, 1000);
        addNotification('Выполнен выход. Войдите с новыми данными', 'info');
      }
    } catch (error) {
      console.error('❌ Error in saveProfile:', error);
      alert('Ошибка: ' + error.message);
    }
  };

  if (!user || !currentUser) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-gray-800/50 rounded-xl p-4 sm:p-6">
          <div className="text-center text-gray-400">
            Загрузка профиля...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-gray-800/50 rounded-xl p-4 sm:p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Личный кабинет</h2>
          <button
            onClick={() => {
              const next = !editingProfile;
              setEditingProfile(next);
              if (next) {
                setProfileForm(prev => ({
                  ...prev,
                  name: currentUser.name || user?.user_metadata?.name || (user?.email ? user.email.split('@')[0] : ''),
                  email: currentUser.email || user?.email || '',
                  oldPassword: '',
                  newPassword: '',
                  confirmPassword: ''
                }));
              }
            }}
            className="text-blue-400 hover:text-blue-300 transition-colors"
          >
            {editingProfile ? <X className="w-5 h-5" /> : <Edit2 className="w-5 h-5" />}
          </button>
        </div>

        {!editingProfile ? (
          <div className="space-y-6">
            <div className="flex items-center space-x-6">
              <div className="flex-shrink-0">
                {getAvatarIcon(currentUser.avatar)}
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold gradient-text">{currentUser.name}</h3>
              </div>
            </div>
            {userRole && (
              <div className="flex items-center space-x-2 mt-1">
                <Shield className="w-4 h-4 text-blue-400" />
                <span className="text-sm text-blue-400">
                  {userRole.role_type === 'admin' ? 'Админ' : 
                   userRole.role_type === 'archimage' ? 'Архимаг' : 
                   userRole.role_type === 'explorer' ? 'Исследователь' : userRole.role_type}
                </span>
                {userRole?.role_type === 'admin' && (
                  <button
                    onClick={async () => {
                      console.log('Running Storage test...');
                      const result = await testStorageConnection();
                      console.log('Storage test completed:', result);
                      addNotification('Результат теста Storage в консоли', 'info');
                    }}
                    className="text-xs bg-yellow-600 hover:bg-yellow-700 px-2 py-1 rounded transition-colors ml-2"
                  >
                    Тест Storage
                  </button>
                )}
              </div>
            )}
            <div className="space-y-3 mt-6">
              <div className="flex items-center space-x-3">
                <Mail className="w-5 h-5 text-gray-400" />
                <span className="truncate">{currentUser.email}</span>
              </div>
              <div className="flex items-center space-x-3">
                <Lock className="w-5 h-5 text-gray-400" />
                <span>{'••••••••'}</span>
              </div>
              <div className="flex items-center space-x-3">
                <Trophy className="w-5 h-5 text-gray-400" />
                <span>{currentUser.completedQuests} квестов выполнено</span>
              </div>
              <div className="flex items-center space-x-3">
                <Users className="w-5 h-5 text-gray-400" />
                <span>{friends.length} друзей</span>
              </div>
            </div>

            {/* Административные функции */}
            {(hasPermission('can_create_packs') || hasPermission('can_create_codes') || userRole?.role_type === 'admin') && (
              <div className="border-t border-gray-700 pt-6 mt-6">
                <h3 className="text-lg font-semibold mb-4 text-blue-400">Административные функции</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {hasPermission('can_create_packs') && (
                    <button
                      onClick={() => onTabChange('pack-manager')}
                      className="flex items-center space-x-3 p-3 bg-gray-700/50 hover:bg-gray-600/50 rounded-lg transition-colors border border-gray-600"
                    >
                      <Settings className="w-5 h-5 text-blue-400" />
                      <span>Управление пачками</span>
                    </button>
                  )}
                  
                  {hasPermission('can_create_codes') && (
                    <button
                      onClick={() => onTabChange('invitation-codes')}
                      className="flex items-center space-x-3 p-3 bg-gray-700/50 hover:bg-gray-600/50 rounded-lg transition-colors border border-gray-600"
                    >
                      <Shield className="w-5 h-5 text-green-400" />
                      <span>Коды приглашений</span>
                    </button>
                  )}
                  
                  {userRole?.role_type === 'admin' && (
                    <button
                      onClick={() => onTabChange('admin')}
                      className="flex items-center space-x-3 p-3 bg-gray-700/50 hover:bg-gray-600/50 rounded-lg transition-colors border border-gray-600"
                    >
                      <Crown className="w-5 h-5 text-purple-400" />
                      <span>Админ-панель</span>
                    </button>
                  )}
                  
                  <button
                    onClick={() => onShowActivateCodeModal(true)}
                    className="flex items-center space-x-3 p-3 bg-gray-700/50 hover:bg-gray-600/50 rounded-lg transition-colors border border-gray-600"
                  >
                    <Key className="w-5 h-5 text-yellow-400" />
                    <span>Активировать код</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Имя</label>
              <input
                type="text"
                value={profileForm.name}
                onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <input
                type="email"
                value={profileForm.email}
                onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
              />
            </div>

            <div className="border-t border-gray-700 pt-4">
              <h4 className="font-medium mb-3">Изменить пароль</h4>
              
              <div className="space-y-3">
                <input
                  type="password"
                  placeholder="Старый пароль"
                  value={profileForm.oldPassword}
                  onChange={(e) => setProfileForm({ ...profileForm, oldPassword: e.target.value })}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
                />
                <input
                  type="password"
                  placeholder="Новый пароль"
                  value={profileForm.newPassword}
                  onChange={(e) => setProfileForm({ ...profileForm, newPassword: e.target.value })}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
                />
                <input
                  type="password"
                  placeholder="Подтвердите новый пароль"
                  value={profileForm.confirmPassword}
                  onChange={(e) => setProfileForm({ ...profileForm, confirmPassword: e.target.value })}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 pt-4">
              <button
                onClick={saveProfile}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
              >
                Сохранить изменения
              </button>
              <button
                onClick={() => {
                  setEditingProfile(false);
                  setProfileForm(prev => ({ ...prev, oldPassword: '', newPassword: '', confirmPassword: '' }));
                }}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
              >
                Отмена
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileTab;
