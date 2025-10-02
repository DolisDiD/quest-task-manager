// Основные типы для Quest Manager
// Обеспечивает типобезопасность и лучшую разработку

// Базовые типы
export interface User {
  id: string;
  name: string;
  email: string;
  level: number;
  xp: number;
  xpToNext: number;
  totalXp: number;
  completedQuests: number;
  avatar: AvatarType;
  createdAt: string;
  updatedAt: string;
}

export type AvatarType = 
  | 'Hero' 
  | 'Warrior' 
  | 'Mage' 
  | 'Archer' 
  | 'Paladin' 
  | 'Wizard' 
  | 'Knight' 
  | 'Ranger' 
  | 'Alchemist';

export type QuestType = 'main' | 'side';
export type QuestDifficulty = 'common' | 'rare' | 'epic' | 'legendary';
export type QuestStatus = 'active' | 'completed' | 'overdue';

// Квесты
export interface Quest {
  id: string;
  title: string;
  description?: string;
  type: QuestType;
  difficulty: QuestDifficulty;
  xp: number;
  reward?: string;
  bonus?: string;
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
  completed: boolean;
  progress: number;
  totalSteps: number;
  subtasks: QuestSubtask[];
  createdBy: string;
  assignedTo?: string;
  assignedBy?: string;
  assignedByProfile?: User;
  assignedToProfile?: User;
}

export interface QuestSubtask {
  id: string;
  questId: string;
  title: string;
  completed: boolean;
  xp: number;
  orderIndex: number;
}

export interface CreateQuestData {
  title: string;
  description?: string;
  type: QuestType;
  difficulty: QuestDifficulty;
  xp: number;
  reward?: string;
  bonus?: string;
  dueDate?: string;
  subtasks?: Omit<QuestSubtask, 'id' | 'questId'>[];
  assignedTo?: string;
}

// Награды
export interface Reward {
  id: string;
  userId: string;
  questId: string;
  questTitle: string;
  title: string;
  bonus?: string;
  xp: number;
  type: QuestType;
  earnedAt: string;
  claimedAt?: string;
  claimed: boolean;
}

// Карточки и коллекции
export interface Card {
  id: string;
  packId: string;
  title: string;
  rarity: CardRarity;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export type CardRarity = 'base' | 'rare' | 'epic' | 'legendary';

export interface CardPack {
  id: string;
  title: string;
  description?: string;
  isBuiltin: boolean;
  ownerId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserCard {
  cardId: string;
  packId: string;
  title: string;
  rarity: CardRarity;
  imageUrl?: string;
  qty: {
    base: number;
    rare: number;
    epic: number;
    legendary: number;
  };
}

// Друзья и социальные функции
export interface Friend {
  id: string;
  user1Id: string;
  user2Id: string;
  createdAt: string;
  user1?: User;
  user2?: User;
}

export interface FriendRequest {
  id: string;
  fromUserId: string;
  toUserId: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
  fromUser?: User;
  toUser?: User;
}

// Система ролей
export interface UserRole {
  id: string;
  userId: string;
  roleType: RoleType;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type RoleType = 'admin' | 'archimage' | 'explorer';

export interface RoleLimits {
  roleType: RoleType;
  maxPacks: number;
  maxInvitationCodes: number;
  canCreatePacks: boolean;
  canCreateCodes: boolean;
  canManageUsers: boolean;
}

export interface InvitationCode {
  id: string;
  code: string;
  createdBy: string;
  usedBy?: string;
  roleType: RoleType;
  isActive: boolean;
  createdAt: string;
  usedAt?: string;
  expiresAt?: string;
}

export interface Subscription {
  id: string;
  userId: string;
  status: 'active' | 'inactive' | 'expired';
  startDate: string;
  endDate: string;
  createdAt: string;
  updatedAt: string;
}

// UI и состояние
export interface Notification {
  id: string | number;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  timestamp?: number;
  autoClose?: boolean;
  timeout?: number;
}

export interface FilterState {
  search: string;
  status: string;
  difficulty: string;
  type: string;
}

export interface SortState {
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

export interface PaginationState {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// API ответы
export interface ApiResponse<T> {
  data: T;
  error?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Формы
export interface AuthForm {
  email: string;
  password: string;
  name?: string;
  confirmPassword?: string;
}

export interface ProfileForm {
  name: string;
  email: string;
  oldPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
}

export interface QuestForm {
  title: string;
  description: string;
  type: QuestType;
  difficulty: QuestDifficulty;
  xp: number;
  reward: string;
  bonus: string;
  dueDate: string;
  subtasks: Omit<QuestSubtask, 'id' | 'questId'>[];
}

export interface CardForm {
  title: string;
  rarity: CardRarity;
  image?: File;
}

export interface PackForm {
  title: string;
  description: string;
}

// Хуки и состояние
export interface UseQuestsReturn {
  quests: Quest[];
  loading: boolean;
  error: string | null;
  questStats: QuestStats;
  filters: FilterState;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  expandedQuests: Set<string>;
  updateFilters: (filters: Partial<FilterState>) => void;
  updateSorting: (sortBy: string, sortOrder: 'asc' | 'desc') => void;
  resetFilters: () => void;
  toggleExpanded: (questId: string) => void;
  loadQuests: () => Promise<void>;
  createQuest: (data: CreateQuestData) => Promise<ApiResponse<Quest>>;
  updateQuest: (questId: string, updates: Partial<Quest>) => Promise<ApiResponse<void>>;
  toggleQuest: (questId: string) => Promise<ApiResponse<void>>;
  toggleSubtask: (questId: string, subtaskId: string) => Promise<ApiResponse<void>>;
  deleteQuest: (questId: string) => Promise<ApiResponse<void>>;
}

export interface QuestStats {
  total: number;
  completed: number;
  active: number;
  overdue: number;
  totalXp: number;
  completionRate: number;
}

// Утилиты
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

// Константы
export const QUEST_DIFFICULTY_COLORS: Record<QuestDifficulty, string> = {
  common: 'text-gray-300 border-gray-500',
  rare: 'text-blue-400 border-blue-500',
  epic: 'text-purple-400 border-purple-500',
  legendary: 'text-yellow-400 border-yellow-500'
};

export const CARD_RARITY_COLORS: Record<CardRarity, string> = {
  base: 'text-gray-300 border-gray-500',
  rare: 'text-blue-400 border-blue-500',
  epic: 'text-purple-400 border-purple-500',
  legendary: 'text-yellow-400 border-yellow-500'
};

export const ROLE_PERMISSIONS: Record<RoleType, string[]> = {
  admin: ['can_create_packs', 'can_create_codes', 'can_manage_users', 'can_view_all'],
  archimage: ['can_create_packs', 'can_create_codes'],
  explorer: []
};




