import React, { Suspense, lazy, memo } from 'react';
import { ErrorBoundary } from './ErrorBoundary';
import { useOptimizedState, useLoadingState } from '../hooks/useOptimizedState';
import { useNotificationState } from '../hooks/useOptimizedState';

// Lazy loading компонентов для code splitting
const Dashboard = lazy(() => import('./Dashboard/Dashboard'));
const QuestsTab = lazy(() => import('./Quests/QuestsTab'));
const RewardsTab = lazy(() => import('./Rewards/RewardsTab'));
const CollectionTab = lazy(() => import('./Collection/CollectionTab'));
const PackManagerTab = lazy(() => import('./PackManager/PackManagerTab'));
const FriendsTab = lazy(() => import('./Friends/FriendsTab'));
const AdminPanel = lazy(() => import('./Admin/AdminPanel'));
const InvitationCodesTab = lazy(() => import('./InvitationCodes/InvitationCodesTab'));

// Мемоизированные компоненты
const Header = memo(lazy(() => import('./Layout/Header')));
const Navigation = memo(lazy(() => import('./Layout/Navigation')));
const NotificationSystem = memo(lazy(() => import('./UI/NotificationSystem')));

// Основной оптимизированный компонент приложения
const OptimizedApp = () => {
  const [activeTab, setActiveTab] = useOptimizedState('dashboard');
  const [user, setUser] = useOptimizedState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useOptimizedState(false);
  
  const { notifications, addNotification, removeNotification } = useNotificationState();
  const { isLoading, error, startLoading, stopLoading, setLoadingError } = useLoadingState();

  // Мемоизированные обработчики
  const handleTabChange = useCallback((tabId) => {
    setActiveTab(tabId);
    setMobileMenuOpen(false);
  }, [setActiveTab, setMobileMenuOpen]);

  const handleMobileMenuToggle = useCallback(() => {
    setMobileMenuOpen(prev => !prev);
  }, [setMobileMenuOpen]);

  // Рендер контента вкладки
  const renderTabContent = useCallback(() => {
    if (!user) return null;

    switch (activeTab) {
      case 'dashboard':
        return <Dashboard user={user} />;
      case 'my-quests':
        return <QuestsTab userId={user.id} />;
      case 'rewards':
        return <RewardsTab userId={user.id} />;
      case 'collection':
        return <CollectionTab userId={user.id} />;
      case 'pack-manager':
        return <PackManagerTab userId={user.id} />;
      case 'friends':
        return <FriendsTab userId={user.id} />;
      case 'admin':
        return <AdminPanel userId={user.id} />;
      case 'invitation-codes':
        return <InvitationCodesTab userId={user.id} />;
      default:
        return <Dashboard user={user} />;
    }
  }, [activeTab, user]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-300">Загрузка приложения...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-error-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-error-500" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-4">Ошибка загрузки</h1>
          <p className="text-gray-300 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="gradient-bg text-white px-6 py-3 rounded-lg font-semibold hover:shadow-glow transition-all duration-200"
          >
            Перезагрузить
          </button>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
        <Suspense fallback={<div className="h-16 bg-gray-800 animate-pulse" />}>
          <Header 
            user={user}
            onMobileMenuToggle={handleMobileMenuToggle}
            mobileMenuOpen={mobileMenuOpen}
          />
        </Suspense>

        <Suspense fallback={<div className="h-12 bg-gray-800 animate-pulse" />}>
          <Navigation 
            activeTab={activeTab}
            onTabChange={handleTabChange}
            user={user}
          />
        </Suspense>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <Suspense fallback={
            <div className="space-y-4">
              <div className="h-8 bg-gray-800 rounded animate-pulse" />
              <div className="h-32 bg-gray-800 rounded animate-pulse" />
              <div className="h-32 bg-gray-800 rounded animate-pulse" />
            </div>
          }>
            {renderTabContent()}
          </Suspense>
        </main>

        <Suspense fallback={null}>
          <NotificationSystem 
            notifications={notifications}
            onClose={removeNotification}
          />
        </Suspense>
      </div>
    </ErrorBoundary>
  );
};

export default OptimizedApp;

