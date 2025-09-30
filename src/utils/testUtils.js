// Утилиты для тестирования
// Обеспечивают удобное тестирование компонентов и функций

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'styled-components';

// Создаем тестовую тему
const testTheme = {
  colors: {
    primary: '#3b82f6',
    secondary: '#8b5cf6',
    success: '#10b981',
    error: '#ef4444',
    warning: '#f59e0b',
    info: '#06b6d4'
  },
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px'
  }
};

// Создаем тестовый QueryClient
const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      cacheTime: 0
    },
    mutations: {
      retry: false
    }
  }
});

// Обертка для тестирования компонентов
export const renderWithProviders = (
  ui,
  {
    preloadedState = {},
    store = null,
    ...renderOptions
  } = {}
) => {
  const queryClient = createTestQueryClient();

  const Wrapper = ({ children }) => (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={testTheme}>
        <BrowserRouter>
          {children}
        </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  );

  return {
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
    queryClient
  };
};

// Моки для Supabase
export const createMockSupabase = () => ({
  auth: {
    getUser: jest.fn(),
    signIn: jest.fn(),
    signUp: jest.fn(),
    signOut: jest.fn(),
    onAuthStateChange: jest.fn(() => ({
      data: { subscription: { unsubscribe: jest.fn() } }
    }))
  },
  from: jest.fn(() => ({
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    neq: jest.fn().mockReturnThis(),
    or: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    range: jest.fn().mockReturnThis(),
    single: jest.fn(),
    then: jest.fn()
  })),
  channel: jest.fn(() => ({
    on: jest.fn().mockReturnThis(),
    subscribe: jest.fn(() => ({ unsubscribe: jest.fn() }))
  }))
});

// Тестовые данные
export const mockUser = {
  id: 'test-user-id',
  name: 'Test User',
  email: 'test@example.com',
  level: 5,
  xp: 2500,
  xpToNext: 3000,
  totalXp: 10000,
  completedQuests: 15,
  avatar: 'Hero'
};

export const mockQuest = {
  id: 'test-quest-id',
  title: 'Test Quest',
  description: 'A test quest description',
  type: 'main',
  difficulty: 'rare',
  xp: 200,
  reward: 'Test Reward',
  bonus: 'Test Bonus',
  dueDate: '2024-12-31',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  completed: false,
  progress: 0,
  totalSteps: 3,
  subtasks: [
    {
      id: 'subtask-1',
      questId: 'test-quest-id',
      title: 'Subtask 1',
      completed: false,
      xp: 50,
      orderIndex: 0
    },
    {
      id: 'subtask-2',
      questId: 'test-quest-id',
      title: 'Subtask 2',
      completed: false,
      xp: 50,
      orderIndex: 1
    }
  ],
  createdBy: 'test-user-id'
};

export const mockCard = {
  id: 'test-card-id',
  packId: 'test-pack-id',
  title: 'Test Card',
  rarity: 'rare',
  imageUrl: 'https://example.com/card.jpg',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z'
};

export const mockCardPack = {
  id: 'test-pack-id',
  title: 'Test Pack',
  description: 'A test card pack',
  isBuiltin: false,
  ownerId: 'test-user-id',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z'
};

// Утилиты для тестирования форм
export const fillForm = (formData) => {
  Object.entries(formData).forEach(([name, value]) => {
    const input = screen.getByRole('textbox', { name }) || 
                  screen.getByRole('combobox', { name }) ||
                  screen.getByDisplayValue('');
    
    if (input) {
      fireEvent.change(input, { target: { value } });
    }
  });
};

export const submitForm = (form) => {
  const submitButton = form.querySelector('button[type="submit"]') ||
                      screen.getByRole('button', { name: /submit|save|create/i });
  
  if (submitButton) {
    fireEvent.click(submitButton);
  }
};

// Утилиты для тестирования асинхронных операций
export const waitForLoadingToFinish = () => 
  waitFor(() => {
    expect(screen.queryByText(/loading|загрузка/i)).not.toBeInTheDocument();
  });

export const waitForError = (errorMessage) =>
  waitFor(() => {
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

export const waitForSuccess = (successMessage) =>
  waitFor(() => {
    expect(screen.getByText(successMessage)).toBeInTheDocument();
  });

// Утилиты для тестирования навигации
export const navigateToTab = (tabName) => {
  const tab = screen.getByRole('tab', { name: new RegExp(tabName, 'i') });
  fireEvent.click(tab);
};

export const expectTabToBeActive = (tabName) => {
  const tab = screen.getByRole('tab', { name: new RegExp(tabName, 'i') });
  expect(tab).toHaveAttribute('aria-selected', 'true');
};

// Утилиты для тестирования модальных окон
export const openModal = (modalName) => {
  const button = screen.getByRole('button', { name: new RegExp(modalName, 'i') });
  fireEvent.click(button);
};

export const closeModal = () => {
  const closeButton = screen.getByRole('button', { name: /close|cancel|отмена/i });
  fireEvent.click(closeButton);
};

export const expectModalToBeOpen = (modalName) => {
  expect(screen.getByRole('dialog', { name: new RegExp(modalName, 'i') })).toBeInTheDocument();
};

export const expectModalToBeClosed = (modalName) => {
  expect(screen.queryByRole('dialog', { name: new RegExp(modalName, 'i') })).not.toBeInTheDocument();
};

// Утилиты для тестирования уведомлений
export const expectNotification = (message, type = 'info') => {
  expect(screen.getByText(message)).toBeInTheDocument();
  // Можно добавить проверку типа уведомления по CSS классу
};

export const expectNoNotifications = () => {
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
};

// Утилиты для тестирования производительности
export const measureRenderTime = (renderFn) => {
  const start = performance.now();
  renderFn();
  const end = performance.now();
  return end - start;
};

export const expectRenderTimeToBeLessThan = (renderFn, maxTime) => {
  const renderTime = measureRenderTime(renderFn);
  expect(renderTime).toBeLessThan(maxTime);
};

// Утилиты для тестирования доступности
export const expectToBeAccessible = async (container) => {
  const results = await axe(container);
  expect(results).toHaveNoViolations();
};

export const expectToHaveFocus = (element) => {
  expect(element).toHaveFocus();
};

export const expectToBeInDocument = (element) => {
  expect(element).toBeInTheDocument();
};

// Утилиты для тестирования мобильных устройств
export const simulateMobileViewport = () => {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: 375
  });
  Object.defineProperty(window, 'innerHeight', {
    writable: true,
    configurable: true,
    value: 667
  });
  window.dispatchEvent(new Event('resize'));
};

export const simulateDesktopViewport = () => {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: 1920
  });
  Object.defineProperty(window, 'innerHeight', {
    writable: true,
    configurable: true,
    value: 1080
  });
  window.dispatchEvent(new Event('resize'));
};

// Утилиты для тестирования API
export const mockApiResponse = (data, error = null) => ({
  data,
  error,
  success: !error
});

export const mockApiError = (message) => ({
  data: null,
  error: { message },
  success: false
});

// Утилиты для тестирования localStorage
export const mockLocalStorage = () => {
  const store = {};
  return {
    getItem: jest.fn((key) => store[key] || null),
    setItem: jest.fn((key, value) => {
      store[key] = value.toString();
    }),
    removeItem: jest.fn((key) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      Object.keys(store).forEach(key => delete store[key]);
    })
  };
};

// Утилиты для тестирования WebSocket соединений
export const mockWebSocket = () => {
  const mockWs = {
    send: jest.fn(),
    close: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    readyState: WebSocket.OPEN
  };
  
  global.WebSocket = jest.fn(() => mockWs);
  return mockWs;
};

// Экспорт всех утилит
export default {
  renderWithProviders,
  createMockSupabase,
  mockUser,
  mockQuest,
  mockCard,
  mockCardPack,
  fillForm,
  submitForm,
  waitForLoadingToFinish,
  waitForError,
  waitForSuccess,
  navigateToTab,
  expectTabToBeActive,
  openModal,
  closeModal,
  expectModalToBeOpen,
  expectModalToBeClosed,
  expectNotification,
  expectNoNotifications,
  measureRenderTime,
  expectRenderTimeToBeLessThan,
  expectToBeAccessible,
  expectToHaveFocus,
  expectToBeInDocument,
  simulateMobileViewport,
  simulateDesktopViewport,
  mockApiResponse,
  mockApiError,
  mockLocalStorage,
  mockWebSocket
};

