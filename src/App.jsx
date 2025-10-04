import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';
import { motion, AnimatePresence } from 'framer-motion';
import BottomSheet from './components/UI/BottomSheet';
import { QuestStatusBadge } from './components/UI/StatusBadge';
import PageTransition from './components/UI/PageTransition';
import { SkeletonQuestList } from './components/UI/SkeletonList';
import { FadeIn, StaggeredList, StaggeredItem } from './components/UI/MicroAnimations';
import { Heading1, Heading2, Heading3, Paragraph, GradientText } from './components/UI/Typography';
import ErrorBoundary from './components/ErrorBoundary';
// Импорты для валидации и оптимизации
import { useFormValidation, validationSchemas, sanitizeInput, validateForm } from './utils/validation';
import { useOptimizedState, useDebounce, useMemoizedCallback } from './hooks/useOptimizedState';
import { measureAsyncPerformance, usePerformanceMonitor } from './utils/performanceMonitor';
import { 
  Plus, Sword, Trophy, Star, CheckCircle, Circle, ChevronDown, ChevronRight, 
  Target, Zap, Search, Filter, Calendar, User, Users, Gift,
  Mail, Lock, Save, X, UserPlus, Send, Award, Home, ListChecks,
  Bell, Check, Eye, Edit2, Shield, LogOut, LogIn, Menu, Settings, Crown, Key
} from 'lucide-react';

// Импорты для системы ролей
import { useRoles } from './hooks/useRoles';
import { useInvitationCodes } from './hooks/useInvitationCodes';
import { useSubscriptions } from './hooks/useSubscriptions';
import InvitationCodesTab from './components/InvitationCodes/InvitationCodesTab';
import ActivateCodeModal from './components/InvitationCodes/ActivateCodeModal';
import AdminPanel from './components/Admin/AdminPanel';

// Импортируем Supabase клиент из lib
import { supabase } from './lib/supabase';
// Default built-in card pack for personal quests
const defaultPackId = 'a0384274-e165-4536-9296-c6ddc6633bce';

// Modern notification system with animations
const NotificationSystem = ({ notifications, onClose }) => {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {notifications.map(n => (
        <motion.div
          key={n.id}
          initial={{ opacity: 0, x: 300, scale: 0.8 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 300, scale: 0.8 }}
          transition={{ 
            type: "spring", 
            stiffness: 300, 
            damping: 30 
          }}
          className={`
            px-4 py-3 rounded-xl shadow-lg border backdrop-blur-sm
            flex items-center justify-between max-w-sm
            ${n.type === 'success' ? 'bg-success-500/10 border-success-500/30 text-success-100' :
              n.type === 'error' ? 'bg-error-500/10 border-error-500/30 text-error-100' :
              n.type === 'warning' ? 'bg-warning-500/10 border-warning-500/30 text-warning-100' :
              'bg-accent-500/10 border-accent-500/30 text-accent-100'
            }
            hover:shadow-xl transition-all duration-300
          `}
        >
          <div className="flex items-center space-x-3">
            <div className={`
              w-2 h-2 rounded-full
              ${n.type === 'success' ? 'bg-success-500' :
                n.type === 'error' ? 'bg-error-500' :
                n.type === 'warning' ? 'bg-warning-500' :
                'bg-accent-500'
              }
            `} />
            <span className="text-sm font-medium">{n.message}</span>
          </div>
          <motion.button
            onClick={() => onClose(n.id)}
            className="ml-2 p-1 rounded-lg hover:bg-white/10 transition-colors"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <X className="w-4 h-4 text-gray-400 hover:text-white" />
          </motion.button>
        </motion.div>
      ))}
    </div>
  );
};

const QuestTaskManager = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [user, setUser] = useState(null);
  const [tabLoading, setTabLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);

  // Функция переключения вкладок с загрузкой
  const handleTabChange = useCallback(async (tabId) => {
    if (tabId === activeTab) return;
    
    setTabLoading(true);
    setActiveTab(tabId);
    setMobileMenuOpen(false);
    
    // Небольшая задержка для плавности перехода
    setTimeout(() => {
      setTabLoading(false);
    }, 300);
  }, [activeTab]);
  
  // Состояние для системы ролей
  const [showActivateCodeModal, setShowActivateCodeModal] = useState(false);
  const [expandedQuests, setExpandedQuests] = useState(new Set());
  
  // Хуки для системы ролей
  const { userRole, roleLimits, hasPermission, loading: roleLoading, updateRole } = useRoles(user?.id);
  const { codes, createInvitationCode } = useInvitationCodes(user?.id);
  const { subscription } = useSubscriptions(user?.id);
  
  
  const addNotification = (message, type = 'info', timeoutMs = 3000) => {
    const id = Date.now() + Math.random();
    setNotifications(prev => [...prev, { id, message, type }]);
    if (timeoutMs > 0) {
      setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), timeoutMs);
    }
  };
  const closeNotification = (id) => setNotifications(prev => prev.filter(n => n.id !== id));
  
  // Auth states
  const [authMode, setAuthMode] = useState('login');
  const [authForm, setAuthForm] = useState({
    email: '',
    password: '',
    name: '',
    confirmPassword: ''
  });

  const [currentUser, setCurrentUser] = useState({
    id: 1,
    name: 'Герой',
    email: 'hero@quest.com',
    completedQuests: 0,
    avatar: 'Hero'
  });

  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: currentUser.name,
    email: currentUser.email,
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [profile, setProfile] = useState(null);
  const [friends, setFriends] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [quests, setQuests] = useOptimizedState([]);
  const [rewards, setRewards] = useOptimizedState({pending: [], claimed: []});
  const [achievements, setAchievements] = useOptimizedState([]);
  const [showAchievements, setShowAchievements] = useOptimizedState(false);
  // Card packs and cards cache
  const [cardPacks, setCardPacks] = useOptimizedState([]);
  const [cardsById, setCardsById] = useOptimizedState({});
  // Collection
  const [selectedPackId, setSelectedPackId] = useOptimizedState(null);
  const [userCards, setUserCards] = useOptimizedState([]);
  
  // Pack Management
  const [editingPackId, setEditingPackId] = useState(null);
  const [packCards, setPackCards] = useState([]);
  const [editingCard, setEditingCard] = useState(null);
  const [showCreatePack, setShowCreatePack] = useState(false);
  const [showCreateCard, setShowCreateCard] = useState(false);
  const [newPackForm, setNewPackForm] = useState({ title: '', description: '' });
  const [newCardForm, setNewCardForm] = useState({ title: '', rarity: 'base' });
  
  const difficultyColors = {
    common: 'text-gray-300 border-gray-500',
    rare: 'text-blue-400 border-blue-500',
    epic: 'text-purple-400 border-purple-500',
    legendary: 'text-yellow-400 border-yellow-500'
  };

  const typeIcons = {
    main: <Sword className="w-4 h-4" />,
    side: <Target className="w-4 h-4" />
  };

  const getAvatarIcon = (avatar) => {
    switch(avatar) {
      case 'Hero': return <Sword className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-400" />;
      case 'Warrior': return <Sword className="w-6 h-6 sm:w-8 sm:h-8 text-red-400" />;
      case 'Mage': return <Star className="w-6 h-6 sm:w-8 sm:h-8 text-purple-400" />;
      case 'Archer': return <Target className="w-6 h-6 sm:w-8 sm:h-8 text-green-400" />;
      case 'Paladin': return <Shield className="w-6 h-6 sm:w-8 sm:h-8 text-blue-400" />;
      case 'Wizard': return <Zap className="w-6 h-6 sm:w-8 sm:h-8 text-indigo-400" />;
      case 'Knight': return <Award className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />;
      case 'Ranger': return <Eye className="w-6 h-6 sm:w-8 sm:h-8 text-emerald-400" />;
      case 'Alchemist': return <Gift className="w-6 h-6 sm:w-8 sm:h-8 text-orange-400" />;
      default: return <User className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />;
    }
  };

  const getFriendById = (id) => friends.find(f => f.id === id);
  const getMyQuests = useMemoizedCallback(() => quests.filter(q =>
    (q.assignedTo === user?.id) ||
    (!q.assignedBy && !q.assignedTo && q.createdBy === user?.id)
  ), [quests, user?.id]);
  
  const getQuestsFromFriends = useMemoizedCallback(() => quests.filter(q => q.assignedBy && q.assignedTo === user?.id), [quests, user?.id]);
  
  const getQuestsToFriends = useMemoizedCallback(() => quests.filter(q => q.assignedBy === user?.id && q.assignedTo), [quests, user?.id]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        setCurrentUser(prev => ({
          ...prev,
          email: session.user.email,
          name: session.user.user_metadata?.name || session.user.email.split('@')[0]
        }));
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        setCurrentUser(prev => ({
          ...prev,
          email: session.user.email,
          name: session.user.user_metadata?.name || session.user.email.split('@')[0]
        }));
      }
      if (event === 'PASSWORD_RECOVERY') {
        setAuthMode('set-new-password');
        addNotification('Введите новый пароль', 'info');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      loadUserData();
      loadQuests();
      loadRewards();
      loadPacks();

      const friendRequestsSubscription = supabase
        .channel('friend_requests_changes')
        .on('postgres_changes', 
          { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'friend_requests',
            filter: `to_user=eq.${user.id}` 
          }, 
          (payload) => {
            console.log('🔔 Новый запрос на дружбу:', payload);
            loadUserData();
          }
        )
        .on('postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public', 
            table: 'friend_requests'
          },
          (payload) => {
            console.log('🔄 Запрос на дружбу обновлен:', payload);
            loadUserData();
          }
        )
        .subscribe();

      const rewardsSubscription = supabase
        .channel('rewards_changes')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'rewards'
        }, (payload) => {
          console.log('🎁 Reward updated:', payload);
          loadRewards();
        })
        .subscribe();

      const friendsSubscription = supabase
        .channel('friends_changes')
        .on('postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'friends'
          },
          (payload) => {
            console.log('👥 Новый друг добавлен:', payload);
            loadUserData();
          }
        )
        .subscribe();

      const questsSubscription = supabase
        .channel('quests_changes')
        .on('postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'quests'
          },
          (payload) => {
            console.log('🎯 Quest updated:', payload);
            loadQuests();
          }
        )
        .subscribe();

      return () => {
        friendRequestsSubscription.unsubscribe();
        rewardsSubscription.unsubscribe();        
        friendsSubscription.unsubscribe();
        questsSubscription.unsubscribe();
      };
    }
  }, [user]);

  const loadUserData = async () => {
    try {
      console.log('📊 Loading user data for:', user?.email);

      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          name: currentUser.name,
          email: user.email,
          avatar: currentUser.avatar || 'Hero'
        });

      if (profileError) {
        console.error('❌ Error upserting profile:', profileError);
      } else {
        console.log('✅ Profile updated successfully');
      }

      const { data: friendsData, error: friendsError } = await supabase
        .from('friends')
        .select(`
          *,
          user1:profiles!friends_user1_id_fkey(*),
          user2:profiles!friends_user2_id_fkey(*)
        `)
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`);

      if (friendsError) {
        console.error('❌ Error loading friends:', friendsError);
      } else {
        console.log('👥 Friends data loaded:', friendsData);
        if (friendsData) {
          const friendsList = friendsData.map(friendship => {
            const friend = friendship.user1_id === user.id ? friendship.user2 : friendship.user1;
            return {
              ...friend,
              status: 'online',
              avatar: friend.avatar || 'Hero'
            };
          });
          setFriends(friendsList);
          console.log('👥 Processed friends list:', friendsList);
        }
      }

      const { data: requestsData, error: requestsError } = await supabase
        .from('friend_requests')
        .select(`
          id,
          from_user,
          to_user,
          status,
          created_at,
          from_profile:profiles!friend_requests_from_user_fkey(*)
        `)
        .eq('to_user', user.id)
        .eq('status', 'pending');

      if (requestsError) {
        console.error('❌ Error loading friend requests:', requestsError);
      } else {
        console.log('📨 Friend requests data loaded:', requestsData);
        if (requestsData && requestsData.length > 0) {
          const requests = requestsData.map(req => ({
            ...req.from_profile,
            request_id: req.id,
            from_user: req.from_user,
            avatar: req.from_profile?.avatar || 'Hero'
          }));
          setFriendRequests(requests);
          console.log('📨 Processed friend requests:', requests);
        } else {
          setFriendRequests([]);
        }
      }

      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select('id, name, email, level, avatar')
        .neq('id', user.id);

      if (usersError) {
        console.error('❌ Error loading users:', usersError);
      } else {
        console.log('👤 All users loaded:', usersData);
        if (usersData) {
          setAllUsers(usersData.map(u => ({
            ...u,
            avatar: u.avatar || 'Hero'
          })));
        }
      }

    } catch (error) {
      console.error('❌ Error in loadUserData:', error);
    }
  };

  const loadQuests = async () => {
    if (!user) return;

    return measureAsyncPerformance('loadQuests', async () => {
      try {
        console.log('📋 Loading quests for user:', user.id);

      const { data: questsData, error: questsError } = await supabase
        .from('quests')
        .select(`
          *,
          quest_subtasks(
            id,
            title,
            completed,
            order_index
          ),
          assigned_by_profile:profiles!quests_assigned_by_fkey(id, name, email),
          assigned_to_profile:profiles!quests_assigned_to_fkey(id, name, email)
        `)
        .or(`created_by.eq.${user.id},assigned_to.eq.${user.id},assigned_by.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (questsError) {
        console.error('❌ Error loading quests:', questsError);
        return;
      }

      console.log('📋 Quests loaded with subtasks:', questsData);

      if (questsData) {
        const formattedQuests = questsData.map(quest => ({
          id: quest.id,
          title: quest.title,
          description: quest.description,
          type: quest.type,
          difficulty: quest.difficulty,
          reward: quest.reward,
          bonus: quest.bonus,
          completed: quest.completed,
          progress: quest.progress || 0,
          totalSteps: quest.total_steps || 1,
          createdAt: new Date(quest.created_at),
          createdBy: quest.created_by,
          dueDate: quest.due_date ? new Date(quest.due_date) : null,
          assignedBy: quest.assigned_by,
          assignedTo: quest.assigned_to,
          rewardPackId: quest.reward_pack_id || null,
          assignedByName: quest.assigned_by_profile?.name || null,
          assignedToName: quest.assigned_to_profile?.name || null,
          expanded: false,
          subtasks: quest.quest_subtasks ? quest.quest_subtasks
            .sort((a, b) => (a.order_index || 0) - (b.order_index || 0))
            .map(st => ({
              id: st.id,
              title: st.title,
              completed: st.completed || false
            })) : []
        }));

        setQuests(formattedQuests);
        console.log('📋 Formatted quests with subtasks:', formattedQuests);
      }

      } catch (error) {
        console.error('❌ Error in loadQuests:', error);
      }
    });
  };

  const loadRewards = async () => {
    if (!user) return;

    try {
      console.log('🎁 Loading rewards for user:', user.id);

      const { data: rewardsData, error: rewardsError } = await supabase
        .from('rewards')
        .select('*')
        .eq('user_id', user.id)
        .order('earned_at', { ascending: false });

      if (rewardsError) {
        console.error('❌ Error loading rewards:', rewardsError);
        return;
      }

      if (rewardsData) {
        const pending = rewardsData
          .filter(r => !r.claimed)
          .map(r => ({
            id: r.id,
            questId: r.quest_id,
            questTitle: r.quest_title || 'Unknown Quest',
            reward: r.title,
            bonus: r.bonus,
            earnedAt: new Date(r.earned_at),
            type: r.type,
            claimed: false
          }));

        const claimed = rewardsData
          .filter(r => r.claimed)
          .map(r => ({
            id: r.id,
            questId: r.quest_id,
            questTitle: r.quest_title || 'Unknown Quest',
            reward: r.title,
            bonus: r.bonus,
            earnedAt: new Date(r.earned_at),
            claimedAt: r.claimed_at ? new Date(r.claimed_at) : null,
            type: r.type,
            claimed: true
          }));

        setRewards({ pending, claimed });
      }
    } catch (error) {
      console.error('❌ Error in loadRewards:', error);
    }
  };

  const loadPacks = async () => {
    try {
      const { data: packs, error } = await supabase
        .from('card_packs')
        .select('id, title, description, is_builtin, owner_id')
        .order('is_builtin', { ascending: false })
        .order('title', { ascending: true });
      if (error) {
        console.error('❌ Error loading packs:', error);
        return;
      }
      setCardPacks(packs || []);
      const def = (packs || []).find(p => p.is_builtin) || (packs || [])[0] || null;
      setSelectedPackId(def ? def.id : null);

      // Preload cards for quick name resolving (optional)
      const { data: allCards } = await supabase
        .from('cards')
        .select('id, pack_id, title, rarity');
      const map = {};
      (allCards || []).forEach(c => { map[c.id] = c; });
      setCardsById(map);
    } catch (e) {
      console.error('❌ Error in loadPacks:', e);
    }
  };

  const loadCollection = async (packId) => {
    try {
      if (!user || !packId) return;
      const { data, error } = await supabase
        .from('user_cards')
        .select('card_id, qty_base, qty_rare, qty_epic, qty_legendary, cards!inner(id, pack_id, title, rarity, image_url)')
        .eq('user_id', user.id)
        .eq('cards.pack_id', packId);
      if (error) {
        console.error('❌ Error loading collection:', error);
        return;
      }
      const items = (data || []).map(row => ({
        cardId: row.card_id,
        packId: row.cards.pack_id,
        title: row.cards.title,
        rarity: row.cards.rarity,
        imageUrl: row.cards.image_url || null,
        qty: {
          base: row.qty_base,
          rare: row.qty_rare,
          epic: row.qty_epic,
          legendary: row.qty_legendary
        }
      }));
      setUserCards(items);
    } catch (e) {
      console.error('❌ Error in loadCollection:', e);
    }
  };

  const loadPackCards = async (packId) => {
    try {
      if (!packId) return;
      const { data, error } = await supabase
        .from('cards')
        .select('id, pack_id, title, rarity, image_url')
        .eq('pack_id', packId)
        .order('rarity', { ascending: false })
        .order('title', { ascending: true });
      
      if (error) {
        console.error('❌ Error loading pack cards:', error);
        return;
      }
      
      setPackCards(data || []);
    } catch (e) {
      console.error('❌ Error in loadPackCards:', e);
    }
  };

  const updateCard = async (cardId, updates) => {
    try {
      const { data, error } = await supabase
        .from('cards')
        .update(updates)
        .eq('id', cardId)
        .select();
      
      if (error) {
        console.error('❌ Error updating card:', error);
        addNotification('Ошибка обновления карточки: ' + error.message, 'error');
        return false;
      }
      
      addNotification('Карточка обновлена', 'success');
      return true;
    } catch (e) {
      console.error('❌ Error in updateCard:', e);
      addNotification('Ошибка: ' + (e?.message || e), 'error');
      return false;
    }
  };

  // Функция для тестирования Storage
  const testStorageConnection = async () => {
    try {
      console.log('Testing Storage connection...');
      
      // Тест 1: Прямой доступ к bucket 'cards'
      console.log('Testing cards bucket access...');
      const { data: listData, error: listError } = await supabase.storage.from('cards').list('', { limit: 1 });
      console.log('Cards bucket list result:', { listData, listError });
      
      // Тест 2: Проверяем права на загрузку в 'cards'
      console.log('Testing upload to cards bucket...');
      const testFile = new File(['test'], 'test.txt', { type: 'text/plain' });
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('cards')
        .upload('test/test.txt', testFile, { upsert: true });
      console.log('Cards bucket upload result:', { uploadData, uploadError });
      
      // Тест 3: Проверяем доступ к 'public' bucket
      console.log('Testing public bucket access...');
      const { data: publicListData, error: publicListError } = await supabase.storage.from('public').list('', { limit: 1 });
      console.log('Public bucket list result:', { publicListData, publicListError });
      
      // Тест 4: Проверяем загрузку в 'public'
      console.log('Testing upload to public bucket...');
      const { data: publicUploadData, error: publicUploadError } = await supabase.storage
        .from('public')
        .upload('test/public-test.txt', testFile, { upsert: true });
      console.log('Public bucket upload result:', { publicUploadData, publicUploadError });
      
      return {
        cardsBucket: { list: listData, listError, upload: uploadData, uploadError },
        publicBucket: { list: publicListData, listError: publicListError, upload: publicUploadData, uploadError: publicUploadError }
      };
    } catch (e) {
      console.error('Storage test failed:', e);
      return { error: e.message };
    }
  };

  // Функция для создания bucket'а для пользователя
  const createUserBucket = async (userId) => {
    try {
      const bucketName = `user-${userId}-cards`;
      
      // Проверяем, существует ли уже bucket для этого пользователя
      const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
      
      if (bucketError) {
        console.error('Error checking buckets:', bucketError);
        return { success: false, error: bucketError.message };
      }
      
      const existingBucket = buckets?.find(bucket => bucket.name === bucketName);
      if (existingBucket) {
        return { success: true, bucketName };
      }
      
      // Пробуем создать bucket через RPC функцию
      const { data: rpcData, error: rpcError } = await supabase.rpc('create_user_bucket', {
        bucket_name: bucketName,
        user_id: userId
      });
      
      if (rpcError) {
        console.warn('RPC function failed, trying alternative approach:', rpcError);
        
        // Альтернативный подход: создаем bucket через прямой API
        // Это может не работать из-за ограничений безопасности, но попробуем
        try {
          const { data: createData, error: createError } = await supabase
            .from('storage.buckets')
            .insert({
              id: bucketName,
              name: bucketName,
              public: true,
              file_size_limit: 5242880,
              allowed_mime_types: ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
            });
            
          if (createError) {
            console.error('Direct API creation failed:', createError);
            return { success: false, error: createError.message };
          }
          
          return { success: true, bucketName };
        } catch (apiError) {
          console.error('API creation failed:', apiError);
          return { success: false, error: 'Не удалось создать bucket. Обратитесь к администратору.' };
        }
      }
      
      return { success: true, bucketName };
    } catch (e) {
      console.error('❌ Error in createUserBucket:', e);
      return { success: false, error: e.message };
    }
  };

  const uploadCardImage = async (cardId, file, packId = null) => {
    try {
      console.log('🖼️ Starting image upload for card:', cardId);
      console.log('📁 File:', file.name, 'Size:', file.size, 'Type:', file.type);
      
      // Проверяем размер файла (максимум 5MB)
      if (file.size > 5 * 1024 * 1024) {
        addNotification('Файл слишком большой. Максимальный размер: 5MB', 'error');
        return null;
      }
      
      // Проверяем тип файла
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        addNotification('Неподдерживаемый тип файла. Разрешены: JPG, PNG, WebP, GIF', 'error');
        return null;
      }
      
      // Определяем путь для загрузки
      const fileExtension = file.name.split('.').pop() || 'jpg';
      let path = `card-images/${cardId}.${fileExtension}`;
      
      console.log('📂 Upload path:', path);
      
      // Сначала пробуем загрузить в bucket 'public' (он должен существовать по умолчанию)
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('public')
        .upload(path, file, { 
          upsert: true,
          cacheControl: '3600'
        });
      
      if (uploadError) {
        console.error('❌ Upload error:', uploadError);
        
        // Если public bucket не работает, пробуем создать временный URL
        console.log('🔄 Trying alternative approach...');
        
        // Конвертируем файл в base64 и сохраняем как data URL
        const reader = new FileReader();
        return new Promise((resolve) => {
          reader.onload = (e) => {
            const dataUrl = e.target.result;
            console.log('✅ Created data URL for image');
            resolve(dataUrl);
          };
          reader.onerror = () => {
            console.error('❌ Failed to read file');
            addNotification('Ошибка чтения файла', 'error');
            resolve(null);
          };
          reader.readAsDataURL(file);
        });
      }
      
      // Получаем публичный URL
      const { data: publicUrlData } = supabase.storage
        .from('public')
        .getPublicUrl(path);
      
      const publicUrl = publicUrlData?.publicUrl;
      
      if (!publicUrl) {
        console.error('❌ Failed to get public URL');
        addNotification('Не удалось получить URL изображения', 'error');
        return null;
      }
      
      console.log('✅ Successfully uploaded image:', publicUrl);
      addNotification('Изображение загружено успешно', 'success');
      return publicUrl;
      
    } catch (e) {
      console.error('❌ Error in uploadCardImage:', e);
      addNotification('Ошибка загрузки: ' + (e?.message || e), 'error');
      return null;
    }
  };

  const createPack = async (title, description) => {
    try {
      const { data, error } = await supabase
        .from('card_packs')
        .insert({
          title,
          description: description || '',
          is_builtin: false,
          owner_id: user.id
        })
        .select()
        .single();
      
      if (error) {
        console.error('❌ Error creating pack:', error);
        addNotification('Ошибка создания пачки: ' + error.message, 'error');
        return null;
      }
      
      addNotification('Пачка создана успешно', 'success');
      await loadPacks(); // Reload packs
      return data;
    } catch (e) {
      console.error('❌ Error in createPack:', e);
      addNotification('Ошибка: ' + (e?.message || e), 'error');
      return null;
    }
  };

  const createCard = async (packId, title, rarity) => {
    try {
      const { data, error } = await supabase
        .from('cards')
        .insert({
          pack_id: packId,
          title,
          rarity
        })
        .select()
        .single();
      
      if (error) {
        console.error('❌ Error creating card:', error);
        addNotification('Ошибка создания карточки: ' + error.message, 'error');
        return null;
      }
      
      addNotification('Карточка создана успешно', 'success');
      await loadPackCards(packId); // Reload pack cards
      return data;
    } catch (e) {
      console.error('❌ Error in createCard:', e);
      addNotification('Ошибка: ' + (e?.message || e), 'error');
      return null;
    }
  };

  useEffect(() => {
    if (selectedPackId) loadCollection(selectedPackId);
  }, [selectedPackId, user]);

  useEffect(() => {
    if (editingPackId) loadPackCards(editingPackId);
  }, [editingPackId]);

  const handleAuth = async (e) => {
    e.preventDefault();
    
    try {
      if (authMode === 'register') {
        if (authForm.password !== authForm.confirmPassword) {
          alert('Пароли не совпадают!');
          return;
        }
        
        const { data, error } = await supabase.auth.signUp({
          email: authForm.email,
          password: authForm.password,
          options: {
            data: {
              name: authForm.name
            }
          }
        });
        
        if (error) {
          alert('Ошибка регистрации: ' + error.message);
        } else {
          alert('Регистрация успешна! Проверьте email для подтверждения.');
          setAuthMode('login');
        }
      } else if (authMode === 'login') {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: authForm.email,
          password: authForm.password
        });
        
        if (error) {
          alert('Ошибка входа: ' + error.message);
        } else {
          addNotification('Вход выполнен', 'success');
        }
      } else if (authMode === 'set-new-password') {
        if (!authForm.password || authForm.password !== authForm.confirmPassword) {
          alert('Пароли не совпадают!');
          return;
        }
        const { error } = await supabase.auth.updateUser({ password: authForm.password });
        if (error) {
          alert('Ошибка смены пароля: ' + error.message);
          return;
        }
        addNotification('Пароль обновлен, выполните вход', 'success');
        await supabase.auth.signOut();
        setAuthMode('login');
      }
    } catch (error) {
      alert('Ошибка: ' + error.message);
    }
  };

  // Reset password modal state
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const sendResetEmail = async () => {
    try {
      const emailToUse = resetEmail || authForm.email;
      if (!emailToUse) {
        alert('Введите email');
        return;
      }
      const { error } = await supabase.auth.resetPasswordForEmail(emailToUse, {
        redirectTo: window.location.origin
      });
      if (error) {
        alert('Ошибка отправки письма: ' + error.message);
        return;
      }
      addNotification('Письмо для восстановления отправлено', 'success');
      setShowResetModal(false);
      setResetEmail('');
    } catch (e) {
      alert('Ошибка: ' + e.message);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const sendFriendRequest = async (targetEmail) => {
    try {
      const { data: targetUser, error: userError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', targetEmail)
        .single();

      if (userError || !targetUser) {
        alert('Пользователь с таким email не найден!');
        return;
      }

      const { data: existingRequest } = await supabase
        .from('friend_requests')
        .select('id')
        .eq('from_user', user.id)
        .eq('to_user', targetUser.id)
        .eq('status', 'pending')
        .single();

      if (existingRequest) {
        alert('Запрос уже отправлен этому пользователю!');
        return;
      }

      const { error } = await supabase
        .from('friend_requests')
        .insert({
          from_user: user.id,
          to_user: targetUser.id,
          to_user_email: targetEmail,
          status: 'pending'
        });

      if (error) {
        console.error('❌ Error sending friend request:', error);
        alert('Ошибка: ' + error.message);
      } else {
        alert('Запрос дружбы отправлен!');
        await loadUserData();
      }
    } catch (error) {
      console.error('❌ Error in sendFriendRequest:', error);
      alert('Ошибка: ' + error.message);
    }
  };

  const acceptFriendRequest = async (requestId, fromUserId) => {
    try {
      console.log('🤝 Accepting friend request:', requestId, 'from user:', fromUserId);
      
      const { error: friendError } = await supabase
        .from('friends')
        .insert({
          user1_id: user.id,
          user2_id: fromUserId
        });

      if (friendError) {
        console.error('❌ Error creating friendship:', friendError);
        alert('Ошибка при создании дружбы: ' + friendError.message);
        return;
      }

      console.log('✅ Friendship created successfully');

      const { error: updateError } = await supabase
        .from('friend_requests')
        .update({ 
          status: 'accepted'
        })
        .eq('id', requestId);

      if (updateError) {
        console.error('❌ Error updating request status:', updateError);
      } else {
        console.log('✅ Request status updated to accepted');
      }

      await loadUserData();
      alert('Заявка в друзья принята!');
      
    } catch (error) {
      console.error('❌ Error in acceptFriendRequest:', error);
      alert('Ошибка: ' + error.message);
    }
  };

  const claimReward = async (rewardId) => {
    try {
      console.log('🎁 Claiming reward:', rewardId);

      const reward = rewards.pending.find(r => r.id === rewardId);
      if (!reward) {
        console.error('❌ Reward not found');
        return;
      }

      const { error: updateError } = await supabase
        .from('rewards')
        .update({ 
          claimed: true,
          claimed_at: new Date().toISOString()
        })
        .eq('id', rewardId);

      if (updateError) {
        console.error('❌ Error claiming reward:', updateError);
        alert('Ошибка получения награды: ' + updateError.message);
        return;
      }

      // Reward claimed successfully

      await loadRewards();

    } catch (error) {
      console.error('❌ Error in claimReward:', error);
      alert('Ошибка: ' + error.message);
    }
  };

  // Grant cards from pack upon quest completion
  const grantCardsFromPack = async (quest, difficulty) => {
    try {
      console.log('🎁 Granting cards for quest:', quest.title, 'difficulty:', difficulty);
      
      // Проверяем, что квест был поставлен другом (не самим пользователем)
      if (!quest.assignedBy || quest.assignedBy === user.id) {
        console.log('ℹ️ Quest was self-assigned, skipping card rewards');
        addNotification(`Квест выполнен!`, 'success');
        return;
      }
      
      const packId = quest.rewardPackId || defaultPackId;
      console.log('📦 Using pack ID:', packId);
      
      // Проверяем, существует ли RPC функция
      const { data, error } = await supabase.rpc('draw_card', {
        p_user_id: user.id,
        p_pack_id: packId,
        p_difficulty: difficulty
      });
      
      if (error) {
        console.error('❌ Error draw_card RPC:', error);
        
        // Если RPC функция не существует, создаем простую награду
        if (error.code === '42883' || error.message.includes('function') || error.message.includes('does not exist')) {
          console.log('⚠️ RPC function draw_card not found, creating simple reward');
          addNotification(`Квест выполнен!`, 'success');
          return;
        }
        
        addNotification('Ошибка выдачи карточки: ' + error.message, 'error');
        return;
      }
      
      console.log('✅ RPC draw_card result:', data);
      
      const drops = Array.isArray(data) ? data : [];
      console.log('🎯 Card drops:', drops);
      
      if (drops.length === 0) {
        addNotification(`Квест выполнен!`, 'success');
        return;
      }
      
      drops.forEach(d => {
        const card = cardsById[d.card_id];
        const title = card?.title || 'Неизвестная карточка';
        addNotification(`Выпала карточка: ${title} (${d.rarity})`, 'success');
        
        if (d.upgraded && d.upgraded !== null) {
          const upCard = cardsById[d.upgraded.card_id];
          const upTitle = upCard?.title || title;
          addNotification(`Слияние: 3× ${upTitle} → ${d.upgraded.to}`, 'info');
        }
      });
      
    } catch (e) {
      console.error('❌ Error in grantCardsFromPack:', e);
      addNotification('Квест выполнен!', 'success');
    }
  };

  const CollectionTab = () => {
    const packs = cardPacks;
    const curPackId = selectedPackId;
    const grouped = userCards.reduce((acc, item) => {
      acc[item.rarity] = acc[item.rarity] || [];
      acc[item.rarity].push(item);
      return acc;
    }, {});

    return (
      <div>
        <div className="mb-6 bg-gray-800/30 rounded-xl p-4">
          <label className="block text-sm font-medium mb-2">Пачка карточек</label>
          <select
            value={curPackId || ''}
            onChange={(e) => setSelectedPackId(e.target.value)}
            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {packs.map(p => (
              <option key={p.id} value={p.id} className="bg-gray-700 text-white">
                {p.title}{p.is_builtin ? ' (встроенная)' : ''}
              </option>
            ))}
          </select>
        </div>

        {['legendary','epic','rare','base'].map(r => (
          <div key={r} className="mb-6">
            <h3 className="text-lg font-bold mb-3 capitalize">{r === 'base' ? 'Базовые' : r === 'rare' ? 'Редкие' : r === 'epic' ? 'Эпические' : 'Легендарные'}</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {(grouped[r] || []).length === 0 && (
                <div className="text-gray-500 col-span-full">Нет карточек этого уровня</div>
              )}
              {(grouped[r] || []).map(card => (
                <div key={card.cardId} className="bg-gray-800/30 border border-gray-700 rounded-xl p-2 group">
                  <div className="relative w-full h-56 sm:h-64 rounded-lg overflow-hidden">
                    {card.imageUrl ? (
                      <img src={card.imageUrl} alt={card.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center text-xs text-gray-300">
                        Нет изображения
                      </div>
                    )}
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-3 py-2">
                      <div className="text-sm sm:text-base font-semibold truncate">{card.title}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Create Pack Modal Component
  const CreatePackModal = () => {
    const [localForm, setLocalForm] = useState({ title: '', description: '' });

    const handleSubmit = async () => {
      if (!localForm.title.trim()) {
        addNotification('Введите название пачки', 'error');
        return;
      }
      
      const pack = await createPack(localForm.title, localForm.description);
      if (pack) {
        setLocalForm({ title: '', description: '' });
        setShowCreatePack(false);
        setEditingPackId(pack.id);
      }
    };

    const handleCancel = () => {
      setLocalForm({ title: '', description: '' });
      setShowCreatePack(false);
    };

    if (!showCreatePack) return null;

    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md">
          <h3 className="text-xl font-bold mb-4">Создать новую пачку</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Название пачки</label>
              <input
                type="text"
                value={localForm.title}
                onChange={(e) => setLocalForm(prev => ({ ...prev, title: e.target.value }))}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
                placeholder="Введите название пачки"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Описание (необязательно)</label>
              <textarea
                value={localForm.description}
                onChange={(e) => setLocalForm(prev => ({ ...prev, description: e.target.value }))}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white h-20 resize-none"
                placeholder="Описание пачки"
              />
            </div>
            <div className="flex space-x-3">
              <button
                onClick={handleSubmit}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
              >
                Создать
              </button>
              <button
                onClick={handleCancel}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg"
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Create Card Modal Component
  const CreateCardModal = () => {
    const [localForm, setLocalForm] = useState({ title: '', rarity: 'base' });

    const handleSubmit = async () => {
      if (!localForm.title.trim()) {
        addNotification('Введите название карточки', 'error');
        return;
      }
      
      if (!editingPackId) {
        addNotification('Выберите пачку для создания карточки', 'error');
        return;
      }
      
      const card = await createCard(editingPackId, localForm.title, localForm.rarity);
      if (card) {
        setLocalForm({ title: '', rarity: 'base' });
        setShowCreateCard(false);
      }
    };

    const handleCancel = () => {
      setLocalForm({ title: '', rarity: 'base' });
      setShowCreateCard(false);
    };

    if (!showCreateCard) return null;

    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md">
          <h3 className="text-xl font-bold mb-4">Добавить карточку</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Название карточки</label>
              <input
                type="text"
                value={localForm.title}
                onChange={(e) => setLocalForm(prev => ({ ...prev, title: e.target.value }))}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
                placeholder="Введите название карточки"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Редкость</label>
              <select
                value={localForm.rarity}
                onChange={(e) => setLocalForm(prev => ({ ...prev, rarity: e.target.value }))}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="base" className="bg-gray-700 text-white">Базовая</option>
                <option value="rare" className="bg-gray-700 text-white">Редкая</option>
              </select>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={handleSubmit}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
              >
                Добавить
              </button>
              <button
                onClick={handleCancel}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg"
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const PackManagerTab = () => {
    const packs = cardPacks;
    const isAdmin = userRole?.role_type === 'admin'; // Use role system instead of hardcoded ID
    const [editingCards, setEditingCards] = useState({});
    
    // Check if user can edit a pack
    const canEditPack = (pack) => {
      if (pack.is_builtin) {
        return isAdmin; // Only admin can edit built-in packs
      }
      return pack.owner_id === user?.id; // Only owner can edit custom packs
    };

    const handleImageUpload = async (cardId, file) => {
      const imageUrl = await uploadCardImage(cardId, file, editingPackId);
      
      if (imageUrl) {
        const updateResult = await updateCard(cardId, { image_url: imageUrl });
        
        if (updateResult) {
          await loadPackCards(editingPackId);
        }
      }
    };

    const handleCardEdit = async (cardId, field, value) => {
      const success = await updateCard(cardId, { [field]: value });
      if (success) {
        await loadPackCards(editingPackId);
      }
    };

    const handleCardInputChange = (cardId, field, value) => {
      setEditingCards(prev => ({
        ...prev,
        [cardId]: {
          ...prev[cardId],
          [field]: value
        }
      }));
    };

    const handleCardInputBlur = async (cardId, field) => {
      const value = editingCards[cardId]?.[field];
      if (value !== undefined) {
        await handleCardEdit(cardId, field, value);
        // Очищаем локальное состояние после сохранения
        setEditingCards(prev => {
          const newState = { ...prev };
          if (newState[cardId]) {
            delete newState[cardId][field];
            if (Object.keys(newState[cardId]).length === 0) {
              delete newState[cardId];
            }
          }
          return newState;
        });
      }
    };

    const groupedCards = packCards.reduce((acc, card) => {
      acc[card.rarity] = acc[card.rarity] || [];
      acc[card.rarity].push(card);
      return acc;
    }, {});

    return (
      <div>
        <div className="mb-6 bg-gray-800/30 rounded-xl p-4">
          <div className="flex items-center justify-between mb-4">
            <label className="block text-sm font-medium">Выберите пачку для редактирования</label>
            <button
              onClick={() => setShowCreatePack(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Создать пачку</span>
            </button>
          </div>
          <select
            value={editingPackId || ''}
            onChange={(e) => setEditingPackId(e.target.value)}
            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="" className="bg-gray-700 text-white">Выберите пачку...</option>
            {packs.map(p => (
              <option 
                key={p.id} 
                value={p.id} 
                disabled={!canEditPack(p)}
                className="bg-gray-700 text-white"
              >
                {p.title}{p.is_builtin ? ' (встроенная)' : ''} {!canEditPack(p) ? '- Нет доступа' : ''}
              </option>
            ))}
          </select>
        </div>

        {editingPackId && (
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold">
                Редактирование пачки: {packs.find(p => p.id === editingPackId)?.title}
              </h2>
              <div className="flex items-center space-x-4">
                <div className="text-sm text-gray-400">
                  {packCards.filter(c => c.rarity === 'base').length} базовых, {packCards.filter(c => c.rarity === 'rare').length} редких
                </div>
                <button
                  onClick={() => setShowCreateCard(true)}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm flex items-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Добавить карточку</span>
                </button>
              </div>
            </div>

            {['base', 'rare'].map(r => (
              <div key={r} className="mb-8">
                <h3 className="text-lg font-bold mb-4 capitalize text-center">
                  {r === 'base' ? 'Базовые карточки (25 шт.)' : 'Редкие карточки (5 шт.)'}
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                  {(groupedCards[r] || []).map(card => (
                    <div key={card.id} className="bg-gray-800/30 border border-gray-700 rounded-xl p-3 group">
                      <div className="relative w-full h-48 sm:h-56 rounded-lg overflow-hidden mb-3">
                        {card.image_url ? (
                          <img src={card.image_url} alt={card.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center text-xs text-gray-300">
                            Нет изображения
                          </div>
                        )}
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-3 py-2">
                          <div className="text-sm font-semibold truncate">{card.title}</div>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div>
                          <label className="block text-xs text-gray-400 mb-1">Название</label>
                          <input
                            type="text"
                            value={editingCards[card.id]?.title !== undefined ? editingCards[card.id].title : card.title}
                            onChange={(e) => handleCardInputChange(card.id, 'title', e.target.value)}
                            onBlur={() => handleCardInputBlur(card.id, 'title')}
                            className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm text-white"
                            disabled={!canEditPack(packs.find(p => p.id === editingPackId))}
                          />
                        </div>
                        
                        <div>
                          <label className="block text-xs text-gray-400 mb-1">Редкость</label>
                          <select
                            value={editingCards[card.id]?.rarity !== undefined ? editingCards[card.id].rarity : card.rarity}
                            onChange={(e) => handleCardInputChange(card.id, 'rarity', e.target.value)}
                            onBlur={() => handleCardInputBlur(card.id, 'rarity')}
                            className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            disabled={!canEditPack(packs.find(p => p.id === editingPackId))}
                          >
                            <option value="base" className="bg-gray-700 text-white">Базовая</option>
                            <option value="rare" className="bg-gray-700 text-white">Редкая</option>
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-xs text-gray-400 mb-1">Изображение</label>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleImageUpload(card.id, file);
                            }}
                            className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-xs text-white file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:bg-gray-600 file:text-white hover:file:bg-gray-500"
                            disabled={!canEditPack(packs.find(p => p.id === editingPackId))}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        <CreatePackModal />
        <CreateCardModal />
      </div>
    );
  };

  useEffect(() => {
    // Синхронизировать форму профиля с актуальными данными пользователя
    if (user) {
      setProfileForm(prev => ({
        ...prev,
        name: currentUser.name || user.user_metadata?.name || user.email?.split('@')[0] || '',
        email: currentUser.email || user.email || ''
      }));
    }
  }, [user, currentUser]);

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

      // Обновить Supabase Auth: имя (metadata), email и пароль при необходимости
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
          console.error('❌ Error updating auth user:', authErr);
          alert('Ошибка обновления учетной записи: ' + authErr.message);
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

      // Обновить локальное состояние
      setCurrentUser(prev => ({
        ...prev,
        name: profileForm.name || prev.name,
        email: profileForm.email || prev.email
      }));

      const emailOrPasswordChanged = (updates.email && updates.email !== user.email) || !!updates.password;

      // Обновить локальные данные из актуальной сессии
      const { data: sessionData } = await supabase.auth.getSession();
      const newUser = sessionData?.session?.user;
      if (newUser) {
        setCurrentUser(prev => ({
          ...prev,
          email: newUser.email || prev.email,
          name: newUser.user_metadata?.name || prev.name
        }));
        setProfileForm(prev => ({
          ...prev,
          name: newUser.user_metadata?.name || prev.name,
          email: newUser.email || prev.email
        }));
      }

      setEditingProfile(false);
      setProfileForm(prev => ({ ...prev, oldPassword: '', newPassword: '', confirmPassword: '' }));

      addNotification('Данные изменены', 'success');

      if (emailOrPasswordChanged) {
        await supabase.auth.signOut();
        addNotification('Выполнен выход. Войдите с новыми данными', 'info');
      }
    } catch (error) {
      console.error('❌ Error in saveProfile:', error);
      alert('Ошибка: ' + error.message);
    }
  };

  const toggleSubtask = useCallback(async (questId, subtaskId) => {
    try {
      const quest = quests.find(q => q.id === questId);
      const subtask = quest?.subtasks.find(st => st.id === subtaskId);
      
      if (!subtask) {
        console.error('❌ Subtask not found');
        return;
      }

      const newCompletedStatus = !subtask.completed;

      const { error: updateError } = await supabase
        .from('quest_subtasks')
        .update({ completed: newCompletedStatus })
        .eq('id', subtaskId);

      if (updateError) {
        console.error('❌ Error updating subtask:', updateError);
        alert('Ошибка обновления подзадачи: ' + updateError.message);
        return;
      }

      const updatedSubtasks = quest.subtasks.map(st => 
        st.id === subtaskId ? { ...st, completed: newCompletedStatus } : st
      );
      const completedCount = updatedSubtasks.filter(st => st.completed).length;
      const isQuestComplete = completedCount === quest.totalSteps;

      const { error: questUpdateError } = await supabase
        .from('quests')
        .update({ 
          progress: completedCount, 
          completed: isQuestComplete 
        })
        .eq('id', questId);

      if (questUpdateError) {
        console.error('❌ Error updating quest progress:', questUpdateError);
      }

      // Для Legendary: не создавать награды за подзадачи
      if (quest.difficulty !== 'legendary') {
        if (newCompletedStatus && !subtask.completed) {
          console.log('🎁 Creating subtask reward for:', subtask.title);
          const { data: createdReward, error: subtaskRewardError } = await supabase
            .from('rewards')
            .insert({
              user_id: user.id,
              quest_id: quest.id,
              quest_title: quest.title,
              title: `${subtask.title} - Выполнено`,
              bonus: null,
              type: 'subtask',
              claimed: false,
              earned_at: new Date().toISOString()
            })
            .select()
            .single();

          if (subtaskRewardError) {
            console.error('❌ Error creating subtask reward:', subtaskRewardError);
          } else {
            console.log('✅ Subtask reward created:', createdReward);
          }
        } else if (!newCompletedStatus && subtask.completed) {
          const { error: deleteSubtaskRewardError } = await supabase
            .from('rewards')
            .delete()
            .eq('quest_id', questId)
            .eq('title', `${subtask.title} - Выполнено`)
            .eq('type', 'subtask')
            .eq('claimed', false);

          if (deleteSubtaskRewardError) {
            console.error('❌ Error deleting subtask reward:', deleteSubtaskRewardError);
          }
        }
      }

      if (isQuestComplete && !quest.completed) {
        console.log('🎁 Creating main quest reward for:', quest.title);
        const { data: createdMainReward, error: mainRewardError } = await supabase
          .from('rewards')
          .insert({
            user_id: user.id,
            quest_id: quest.id,
            quest_title: quest.title,
            title: quest.reward || 'Квест выполнен!',
            bonus: quest.bonus,
            type: 'main',
            claimed: false,
            earned_at: new Date().toISOString()
          })
          .select()
          .single();

        if (mainRewardError) {
          console.error('❌ Error creating main reward:', mainRewardError);
        } else {
          console.log('✅ Main quest reward created:', createdMainReward);
        }

        // Grant collection cards from pack according to difficulty (only if assigned by friend)
        await grantCardsFromPack(quest, quest.difficulty);
      } else if (!isQuestComplete && quest.completed) {
        const { error: deleteMainRewardError } = await supabase
          .from('rewards')
          .delete()
          .eq('quest_id', questId)
          .eq('type', 'main')
          .eq('claimed', false);

        if (deleteMainRewardError) {
          console.error('❌ Error deleting main reward:', deleteMainRewardError);
        }
      }
          
      setQuests(currentQuests => 
        currentQuests.map(q => {
          if (q.id === questId) {
            return {
              ...q,
              subtasks: updatedSubtasks,
              progress: completedCount,
              completed: isQuestComplete
            };
          }
          return q;
        })
      );

      // Обновляем награды без задержки
      loadRewards();

    } catch (error) {
      console.error('❌ Error in toggleSubtask:', error);
      alert('Ошибка: ' + error.message);
    }
  }, [quests, user?.id, addNotification]);

  const toggleQuest = useCallback(async (questId) => {
    try {
      setQuests(currentQuests => {
        const quest = currentQuests.find(q => q.id === questId);
        if (!quest || quest.subtasks.length > 0) {
          console.log('❌ Quest not found or has subtasks');
          return currentQuests;
        }

        const newCompletedStatus = !quest.completed;
        console.log(`🔄 Toggling quest ${questId} to ${newCompletedStatus}`);

        // Обновляем квест в базе данных
        supabase
          .from('quests')
          .update({ 
            completed: newCompletedStatus,
            progress: newCompletedStatus ? 1 : 0
          })
          .eq('id', questId)
          .then(({ error: questUpdateError }) => {
            if (questUpdateError) {
              console.error('❌ Error updating quest:', questUpdateError);
              alert('Ошибка обновления квеста: ' + questUpdateError.message);
              return;
            }

            // Обновляем состояние локально
            setQuests(currentQuests => 
              currentQuests.map(q => {
                if (q.id === questId) {
                  if (newCompletedStatus && !q.completed) {
                    setCurrentUser(prev => ({
                      ...prev,
                      completedQuests: prev.completedQuests + 1
                    }));
                  } else if (!newCompletedStatus && q.completed) {
                    setCurrentUser(prev => ({
                      ...prev,
                      completedQuests: Math.max(0, prev.completedQuests - 1)
                    }));
                  }
                  
                  return { 
                    ...q, 
                    completed: newCompletedStatus, 
                    progress: newCompletedStatus ? 1 : 0
                  };
                }
                return q;
              })
            );

            // Обновляем награды
            loadRewards();
          });

        return currentQuests;
      });

    } catch (error) {
      console.error('❌ Error in toggleQuest:', error);
      alert('Ошибка: ' + error.message);
    }
  }, [user?.id, addNotification]);

  const expandQuest = useCallback((questId) => {
    setExpandedQuests(prev => {
      const newSet = new Set(prev);
      if (newSet.has(questId)) {
        newSet.delete(questId);
      } else {
        newSet.add(questId);
      }
      return newSet;
    });
  }, []);

  const getProgressPercentage = (quest) => {
    if (quest.totalSteps === 0) return quest.completed ? 100 : 0;
    return (quest.progress / quest.totalSteps) * 100;
  };

  const getQuestStatus = (quest) => {
    if (quest.completed) return 'completed';
    if (quest.progress > 0) return 'in-progress';
    return 'pending';
  };

  const formatDate = (date) => {
    if (!date) return 'Без срока';
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    
    const diffTime = targetDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return `Просрочено на ${Math.abs(diffDays)} дн.`;
    if (diffDays === 0) return 'Сегодня';
    if (diffDays === 1) return 'Завтра';
    return `Осталось ${diffDays} дн.`;
  };

  const getDateColor = (date) => {
    if (!date) return 'text-gray-400';
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    
    const diffTime = targetDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'text-red-400';
    if (diffDays <= 1) return 'text-yellow-400';
    if (diffDays <= 3) return 'text-orange-400';
    return 'text-gray-400';
  };

  const QuestCard = ({ quest }) => {
    const isExpanded = expandedQuests.has(quest.id);
    
    return (
    <div
      className={`bg-gradient-to-r from-gray-800/60 to-gray-900/60 backdrop-blur-sm border rounded-xl overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-yellow-400/10 ${
        quest.completed ? 'border-green-500/50' : difficultyColors[quest.difficulty]
      }`}
    >
      <div className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between space-y-4 sm:space-y-0">
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <div className="flex items-center space-x-2">
                {typeIcons[quest.type]}
                <QuestStatusBadge 
                  difficulty={quest.difficulty} 
                  completed={quest.completed}
                />
              </div>
              {quest.completed && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="text-green-400"
                >
                  <CheckCircle className="w-5 h-5" />
                </motion.div>
              )}
              {quest.assignedBy && (
                <span className="text-xs text-blue-400">
                  От: {quest.assignedByName || getFriendById(quest.assignedBy)?.name || 'Неизвестно'}
                </span>
              )}
              {quest.assignedTo && (
                <span className="text-xs text-purple-400">
                  Для: {quest.assignedToName || getFriendById(quest.assignedTo)?.name || 'Неизвестно'}
                </span>
              )}
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={() => quest.subtasks?.length === 0 ? toggleQuest(quest.id) : expandQuest(quest.id)}
                className="flex items-center space-x-2 hover:text-yellow-400 transition-colors"
              >
                {quest.subtasks?.length > 0 ? (
                  isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />
                ) : (
                  quest.completed ? <CheckCircle className="w-5 h-5 text-green-400" /> : <Circle className="w-5 h-5" />
                )}
                <h3 className={`text-lg sm:text-xl font-bold ${quest.completed ? 'line-through text-gray-500' : ''}`}>
                  {quest.title}
                </h3>
              </button>
            </div>
            
            <p className="text-gray-400 mt-2 text-sm sm:text-base">{quest.description}</p>
            
            {quest.totalSteps > 1 && (
              <div className="mt-4">
                <div className="flex justify-between text-sm text-gray-400 mb-1">
                  <span>Прогресс: {quest.progress}/{quest.totalSteps}</span>
                  <span>{Math.round(getProgressPercentage(quest))}%</span>
                </div>
                <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 transition-all duration-500"
                    style={{ width: `${getProgressPercentage(quest)}%` }}
                  />
                </div>
              </div>
            )}
          </div>
          
          <div className="text-left sm:text-right sm:ml-6 space-y-2">
            <div className="flex items-center space-x-2">
              <Trophy className="w-4 h-4 text-yellow-400" />
              <span className="text-yellow-400 text-sm">{quest.reward}</span>
            </div>
            {quest.bonus && (
              <div className="flex items-center space-x-2">
                <Star className="w-4 h-4 text-purple-400" />
                <span className="text-purple-400 text-sm">{quest.bonus}</span>
              </div>
            )}
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-gray-400" />
              <span className={`text-sm ${getDateColor(quest.dueDate)}`}>
                {formatDate(quest.dueDate)}
              </span>
            </div>
          </div>
        </div>
      </div>
      
      {isExpanded && quest.subtasks?.length > 0 && (
        <div className="border-t border-gray-700 bg-black/20">
          <div className="p-4">
            <h4 className="text-sm font-semibold text-gray-300 mb-3">Подзадачи:</h4>
            <div className="space-y-2">
              {quest.subtasks.map((subtask) => (
                <div
                  key={subtask.id}
                  className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg hover:bg-gray-700/50 transition-colors cursor-pointer"
                  onClick={() => toggleSubtask(quest.id, subtask.id)}
                >
                  <div className="flex items-center space-x-3">
                    {subtask.completed ? (
                      <CheckCircle className="w-4 h-4 text-green-400" />
                    ) : (
                      <Circle className="w-4 h-4 text-gray-400" />
                    )}
                    <span className={`text-sm ${subtask.completed ? 'line-through text-gray-500' : ''}`}>
                      {subtask.title}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Zap className="w-3 h-3 text-blue-400" />
                    <span className="text-blue-400 text-sm">✓</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
    );
  };

  const RewardsTab = () => {
    const [localRewardSearch, setLocalRewardSearch] = useState('');
    const [localRewardFilter, setLocalRewardFilter] = useState('all');
    // Sub-tabs: pending/claimed with ability to hide claimed
    const [activeRewardsSubtab, setActiveRewardsSubtab] = useState('pending');
    const [hideClaimedRewards, setHideClaimedRewards] = useState(false);
    
    let filteredRewards = localRewardFilter === 'all' 
      ? [...rewards.pending, ...rewards.claimed]
      : localRewardFilter === 'pending' 
        ? rewards.pending 
        : rewards.claimed;

    // Apply sub-tab selection first
    filteredRewards = activeRewardsSubtab === 'pending' ? rewards.pending : rewards.claimed;
    // Respect hide toggle: when hiding claimed, force pending
    if (hideClaimedRewards) {
      filteredRewards = rewards.pending;
    }

    return (
      <div>
        <div className="mb-3 flex items-center space-x-2">
          <button
            onClick={() => setActiveRewardsSubtab('pending')}
            className={`px-3 py-1 rounded-lg text-sm border ${activeRewardsSubtab === 'pending' ? 'bg-yellow-600/20 border-yellow-500 text-yellow-300' : 'bg-gray-800/40 border-gray-600 text-gray-300 hover:bg-gray-700/40'}`}
          >
            К получению ({rewards.pending.length})
          </button>
          {!hideClaimedRewards && (
            <button
              onClick={() => setActiveRewardsSubtab('claimed')}
              className={`px-3 py-1 rounded-lg text-sm border ${activeRewardsSubtab === 'claimed' ? 'bg-green-600/20 border-green-500 text-green-300' : 'bg-gray-800/40 border-gray-600 text-gray-300 hover:bg-gray-700/40'}`}
            >
              Получены ({rewards.claimed.length})
            </button>
          )}
          <label className="ml-auto flex items-center space-x-2 text-xs text-gray-400">
            <input
              type="checkbox"
              checked={hideClaimedRewards}
              onChange={(e) => {
                const hide = e.target.checked;
                setHideClaimedRewards(hide);
                if (hide) setActiveRewardsSubtab('pending');
              }}
            />
            <span>Скрыть вкладку «Получены»</span>
          </label>
        </div>

        <div className="mb-6 bg-gray-800/30 rounded-xl p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={localRewardFilter}
                onChange={(e) => setLocalRewardFilter(e.target.value)}
                className="bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all" className="bg-gray-700 text-white">Все награды</option>
                <option value="pending" className="bg-gray-700 text-white">К получению</option>
                <option value="claimed" className="bg-gray-700 text-white">Полученные</option>
              </select>
            </div>
            
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Поиск наград..."
                value={localRewardSearch}
                onChange={(e) => setLocalRewardSearch(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-400 text-sm"
              />
            </div>
          </div>

          <div className="mt-4 flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-6 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
              <span className="text-gray-400">К получению: {rewards.pending.length}</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-400 rounded-full"></div>
              <span className="text-gray-400">Получено: {rewards.claimed.length}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {filteredRewards
            .filter(reward => 
              localRewardSearch === '' || 
              reward.reward.toLowerCase().includes(localRewardSearch.toLowerCase()) ||
              reward.questTitle.toLowerCase().includes(localRewardSearch.toLowerCase())
            )
            .map(reward => (
              <div
                key={reward.id}
                className={`bg-gradient-to-r ${
                  reward.claimed 
                    ? 'from-gray-700/50 to-gray-800/50 border-green-400/30' 
                    : 'from-yellow-900/20 to-orange-900/20 border-yellow-400/30'
                } border rounded-xl p-4`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between space-y-4 sm:space-y-0">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      {reward.type === 'main' ? (
                        <Trophy className="w-5 h-5 text-yellow-400" />
                      ) : (
                        <Star className="w-5 h-5 text-blue-400" />
                      )}
                      <span className="text-xs text-gray-400">
                        от {reward.questTitle}
                      </span>
                    </div>
                    
                    <h3 className="text-lg font-semibold text-white mb-1">
                      {reward.reward}
                    </h3>
                    
                    {reward.bonus && (
                      <div className="flex items-center space-x-2 mb-2">
                        <Gift className="w-3 h-3 text-purple-400" />
                        <span className="text-purple-400 text-sm">{reward.bonus}</span>
                      </div>
                    )}
                    
                    <div className="text-xs text-gray-500">
                      {reward.claimed ? (
                        <span>Получено: {new Date(reward.claimedAt).toLocaleDateString()}</span>
                      ) : (
                        <span>Заработано: {new Date(reward.earnedAt).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-left sm:text-right">
                    {!reward.claimed && (
                      <button
                        onClick={() => claimReward(reward.id)}
                        className="bg-green-600 hover:bg-green-500 px-3 py-1 rounded text-sm transition-colors"
                      >
                        Получить
                      </button>
                    )}
                    {reward.claimed && (
                      <Check className="w-5 h-5 text-green-400" />
                    )}
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>
    );
  };

const MyQuestsTab = () => {
  const [localQuestSearch, setLocalQuestSearch] = useState('');
  const [localStatusFilter, setLocalStatusFilter] = useState('all');
  const [localSortBy, setLocalSortBy] = useState('dueDate');
  const [localSortOrder, setLocalSortOrder] = useState('asc');
  const [localShowNewQuest, setLocalShowNewQuest] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Оптимизированный поиск с дебаунсингом
  const debouncedSearch = useDebounce(localQuestSearch, 300);
  // Sub-tabs for my quests
  const [activeMyQuestsSubtab, setActiveMyQuestsSubtab] = useState('active');
  const [hideCompletedMyQuests, setHideCompletedMyQuests] = useState(false);
  const [questType, setQuestType] = useState('rare');
  const [localNewQuest, setLocalNewQuest] = useState({
    title: '',
    description: '',
    type: 'main',
    difficulty: 'rare',
    reward: '',
    bonus: '',
    dueDate: '',
    assignedTo: null,
    subtasks: []
  });
  const [showSubtaskForm, setShowSubtaskForm] = useState(false);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  
  // Мемоизированные квесты для предотвращения лишних перерендеров
  const myQuests = useMemo(() => getMyQuests(), [quests, user?.id]);
  const allMyQuests = myQuests;
  
  // Мемоизированная фильтрация квестов
  const filterQuests = useCallback((quests) => {
    let filtered = quests;
    
    if (debouncedSearch.trim()) {
      filtered = filtered.filter(quest =>
        quest.title.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        quest.description.toLowerCase().includes(debouncedSearch.toLowerCase())
      );
    }
    
    if (localStatusFilter !== 'all') {
      filtered = filtered.filter(quest => getQuestStatus(quest) === localStatusFilter);
    }
    
    return filtered;
  }, [debouncedSearch, localStatusFilter]);
  
  const sortQuests = useCallback((quests) => {
    const sorted = [...quests].sort((a, b) => {
      let comparison = 0;
      
      switch (localSortBy) {
        case 'dueDate':
          const dateA = a.dueDate || new Date('2099-12-31');
          const dateB = b.dueDate || new Date('2099-12-31');
          comparison = dateA - dateB;
          break;
        case 'created':
          comparison = a.createdAt - b.createdAt;
          break;
        case 'difficulty':
          const difficultyOrder = { common: 1, rare: 2, epic: 3, legendary: 4 };
          comparison = difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty];
          break;
        case 'xp':
          comparison = 0; // XP sorting removed
          break;
        case 'alphabetical':
          comparison = a.title.localeCompare(b.title);
          break;
        default:
          comparison = 0;
      }
      
      return localSortOrder === 'desc' ? -comparison : comparison;
    });
    
    return sorted;
  }, [localSortBy, localSortOrder]);
  
  // Мемоизированная фильтрация и сортировка квестов
  const filteredAndSortedQuests = useMemo(() => {
    const subtabFiltered = (activeMyQuestsSubtab === 'active' || hideCompletedMyQuests)
      ? allMyQuests.filter(q => !q.completed)
      : allMyQuests.filter(q => q.completed);
    return sortQuests(filterQuests(subtabFiltered));
  }, [allMyQuests, activeMyQuestsSubtab, hideCompletedMyQuests, filterQuests, localSortBy, localSortOrder]);
  
  const addSubtask = () => {
    if (newSubtaskTitle.trim()) {
      setLocalNewQuest({
        ...localNewQuest,
        subtasks: [
          ...localNewQuest.subtasks,
          { id: Date.now(), title: newSubtaskTitle, completed: false, xp: 50 }
        ]
      });
      setNewSubtaskTitle('');
      setShowSubtaskForm(false);
    }
  };
  
  const removeSubtask = (subtaskId) => {
    setLocalNewQuest({
      ...localNewQuest,
      subtasks: localNewQuest.subtasks.filter(st => st.id !== subtaskId)
    });
  };
  
  const addLocalNewQuest = async () => {
    return measureAsyncPerformance('addLocalNewQuest', async () => {
      console.log('🔍 addLocalNewQuest called with:', {
        title: localNewQuest.title,
        description: localNewQuest.description,
        questType,
        user: user?.id
      });

    // Валидация с использованием схемы
    const questData = {
      title: localNewQuest.title,
      description: localNewQuest.description,
      dueDate: localNewQuest.dueDate
    };

    const validation = validateForm(questData, validationSchemas.quest);
    if (!validation.isValid) {
      const firstError = Object.values(validation.errors)[0];
      addNotification(firstError, 'error');
      return;
    }

    if (!user?.id) {
      addNotification('Пользователь не авторизован!', 'error');
      return;
    }
    
    try {
      console.log('📝 Creating personal quest with subtasks:', localNewQuest.subtasks);
      
      const questDataForDB = {
        title: sanitizeInput(localNewQuest.title),
        description: sanitizeInput(localNewQuest.description || ''),
        type: localNewQuest.type,
        difficulty: questType,
        reward: sanitizeInput(localNewQuest.reward || ''),
        bonus: sanitizeInput(localNewQuest.bonus || ''),
        due_date: localNewQuest.dueDate ? new Date(localNewQuest.dueDate).toISOString() : null,
        created_by: user.id,
        total_steps: localNewQuest.subtasks.length || 1,
        reward_pack_id: defaultPackId
      };

      const { data: createdQuest, error: questError } = await supabase
        .from('quests')
        .insert(questDataForDB)
        .select()
        .single();

      if (questError) {
        console.error('⚠ Error creating quest:', questError);
        addNotification('Ошибка создания квеста: ' + questError.message, 'error');
        return;
      }

      console.log('✅ Quest created:', createdQuest);

      if (localNewQuest.subtasks.length > 0) {
        const subtasksData = localNewQuest.subtasks.map((subtask, index) => ({
          quest_id: createdQuest.id,
          title: sanitizeInput(subtask.title),
          order_index: index,
          completed: false
        }));

        console.log('📝 Creating subtasks:', subtasksData);

        const { error: subtasksError } = await supabase
          .from('quest_subtasks')
          .insert(subtasksData);

        if (subtasksError) {
          console.error('⚠ Error creating subtasks:', subtasksError);
          addNotification('Ошибка создания подзадач: ' + subtasksError.message, 'error');
        } else {
          console.log('✅ Subtasks created successfully');
        }
      }

      // Сбрасываем форму
      setLocalNewQuest({
        title: '',
        description: '',
        type: 'main',
        difficulty: 'rare',
        reward: '',
        bonus: '',
        dueDate: '',
        assignedTo: null,
        subtasks: []
      });
      setLocalShowNewQuest(false);
      setQuestType('rare');
      setShowSubtaskForm(false);

      // Обновляем список квестов
      await loadQuests();
      
      addNotification('Квест создан!', 'success');

      } catch (error) {
        console.error('⚠ Error creating personal quest:', error);
        addNotification('Ошибка: ' + error.message, 'error');
      }
    });
  };

  return (
    <div>
      <div className="mb-3 flex items-center space-x-2">
        <button
          onClick={() => setActiveMyQuestsSubtab('active')}
          className={`px-3 py-1 rounded-lg text-sm border ${activeMyQuestsSubtab === 'active' ? 'bg-blue-600/20 border-blue-500 text-blue-300' : 'bg-gray-800/40 border-gray-600 text-gray-300 hover:bg-gray-700/40'}`}
        >
          Выполняю
        </button>
        {!hideCompletedMyQuests && (
          <button
            onClick={() => setActiveMyQuestsSubtab('completed')}
            className={`px-3 py-1 rounded-lg text-sm border ${activeMyQuestsSubtab === 'completed' ? 'bg-green-600/20 border-green-500 text-green-300' : 'bg-gray-800/40 border-gray-600 text-gray-300 hover:bg-gray-700/40'}`}
          >
            Выполнено
          </button>
        )}
        <label className="ml-auto flex items-center space-x-2 text-xs text-gray-400">
          <input
            type="checkbox"
            checked={hideCompletedMyQuests}
            onChange={(e) => {
              const hide = e.target.checked;
              setHideCompletedMyQuests(hide);
              if (hide) setActiveMyQuestsSubtab('active');
            }}
          />
          <span>Скрыть вкладку «Выполнено»</span>
        </label>
      </div>
      <div className="mb-6">
        <button
          onClick={() => setLocalShowNewQuest(!localShowNewQuest)}
          className="flex items-center space-x-2 bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-500 hover:to-emerald-600 px-4 py-2 rounded-lg transition-all duration-200 transform hover:scale-105"
        >
          <Plus className="w-4 h-4" />
          <span>Новый квест</span>
        </button>
      </div>

      <div className="mb-8 bg-gray-800/30 backdrop-blur-sm border border-gray-700 rounded-xl p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="relative lg:col-span-2">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Поиск квестов..."
              value={localQuestSearch}
              onChange={(e) => setLocalQuestSearch(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-yellow-400 text-sm"
            />
          </div>
          
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <select
              value={localStatusFilter}
              onChange={(e) => setLocalStatusFilter(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:border-yellow-400 appearance-none text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all" className="bg-gray-700 text-white">Все квесты</option>
              <option value="pending" className="bg-gray-700 text-white">В ожидании</option>
              <option value="in-progress" className="bg-gray-700 text-white">В процессе</option>
              <option value="completed" className="bg-gray-700 text-white">Выполнено</option>
            </select>
          </div>
          
          <select
            value={localSortBy}
            onChange={(e) => setLocalSortBy(e.target.value)}
            className="bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-yellow-400 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="dueDate" className="bg-gray-700 text-white">По сроку</option>
            <option value="created" className="bg-gray-700 text-white">По дате создания</option>
            <option value="difficulty" className="bg-gray-700 text-white">По сложности</option>
            <option value="alphabetical" className="bg-gray-700 text-white">По алфавиту</option>
          </select>
        </div>
        
        <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <button
            onClick={() => setLocalSortOrder(localSortOrder === 'asc' ? 'desc' : 'asc')}
            className="bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white hover:bg-gray-600 transition-colors flex items-center justify-center space-x-2 text-sm"
          >
            <span>{localSortOrder === 'asc' ? '↑' : '↓'}</span>
              <span>{localSortOrder === 'asc' ? 'По возрастанию' : 'По убыванию'}</span>
          </button>
          
          <div className="text-sm text-gray-400">
            Показано {filteredAndSortedQuests.length} из {allMyQuests.length} квестов
          </div>
        </div>
      </div>

      {localShowNewQuest && (
        <div className="mb-8 bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-4 sm:p-6">
          <h3 className="text-xl font-bold mb-4 text-yellow-400">Создать новый квест</h3>
          
          <div className="mb-6">
            <label className="block text-sm font-medium mb-3">Тип квеста</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                onClick={() => {
                  setQuestType('rare');
                  setLocalNewQuest({ ...localNewQuest, difficulty: 'rare', subtasks: [] });
                  setShowSubtaskForm(false);
                }}
                className={`p-4 rounded-lg border-2 transition-all ${
                  questType === 'rare'
                    ? 'border-blue-400 bg-blue-900/20'
                    : 'border-gray-600 bg-gray-700/30 hover:border-gray-500'
                }`}
              >
                <div className="flex items-center justify-center mb-2">
                  <Star className="w-8 h-8 text-blue-400" />
                </div>
                <div className="font-bold text-blue-400">Rare</div>
                <div className="text-xs text-gray-400 mt-1">Одиночная задача</div>
              </button>
              
              <button
                onClick={() => {
                  setQuestType('legendary');
                  setLocalNewQuest({ ...localNewQuest, difficulty: 'legendary' });
                }}
                className={`p-4 rounded-lg border-2 transition-all ${
                  questType === 'legendary'
                    ? 'border-yellow-400 bg-yellow-900/20'
                    : 'border-gray-600 bg-gray-700/30 hover:border-gray-500'
                }`}
              >
                <div className="flex items-center justify-center mb-2">
                  <Trophy className="w-8 h-8 text-yellow-400" />
                </div>
                <div className="font-bold text-yellow-400">Legendary</div>
                <div className="text-xs text-gray-400 mt-1">С подзадачами</div>
              </button>
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Название {questType === 'legendary' ? 'главного ' : ''}квеста</label>
              <input
                type="text"
                placeholder={`Название ${questType === 'legendary' ? 'главного ' : ''}квеста`}
                value={localNewQuest.title}
                onChange={(e) => setLocalNewQuest({ ...localNewQuest, title: e.target.value })}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-400"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Описание квеста</label>
              <textarea
                placeholder="Описание квеста"
                value={localNewQuest.description}
                onChange={(e) => setLocalNewQuest({ ...localNewQuest, description: e.target.value })}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-400"
                rows="3"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Награда за квест</label>
              <input
                type="text"
                placeholder="Награда за выполнение"
                value={localNewQuest.reward}
                onChange={(e) => setLocalNewQuest({ ...localNewQuest, reward: e.target.value })}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-400"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Дедлайн задачи</label>
              <input
                type="date"
                value={localNewQuest.dueDate}
                onChange={(e) => setLocalNewQuest({ ...localNewQuest, dueDate: e.target.value })}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-400"
              />
            </div>
            
            {questType === 'legendary' && (
              <div className="mt-6 pt-6 border-t border-gray-600">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium">Подзадачи</h4>
                  <button
                    onClick={() => setShowSubtaskForm(!showSubtaskForm)}
                    className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-500 px-3 py-1 rounded-lg transition-colors text-sm"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Добавить подзадачу</span>
                  </button>
                </div>
                
                {showSubtaskForm && (
                  <div className="mb-4 p-4 bg-gray-700/50 rounded-lg">
                    <label className="block text-sm font-medium mb-2">Название подзадачи</label>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="text"
                        placeholder="Введите название подзадачи"
                        value={newSubtaskTitle}
                        onChange={(e) => setNewSubtaskTitle(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && addSubtask()}
                        className="flex-1 bg-gray-600 border border-gray-500 rounded-lg px-4 py-2 text-white placeholder-gray-400"
                      />
                      <div className="flex space-x-2">
                        <button
                          onClick={addSubtask}
                          className="bg-green-600 hover:bg-green-500 px-4 py-2 rounded-lg transition-colors"
                        >
                          Добавить
                        </button>
                        <button
                          onClick={() => {
                            setShowSubtaskForm(false);
                            setNewSubtaskTitle('');
                          }}
                          className="bg-gray-600 hover:bg-gray-500 px-4 py-2 rounded-lg transition-colors"
                        >
                          Отмена
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                
                {localNewQuest.subtasks.length > 0 && (
                  <div className="space-y-2">
                    {localNewQuest.subtasks.map((subtask, index) => (
                      <div key={subtask.id} className="flex items-center justify-between bg-gray-700/30 rounded p-3">
                        <span className="text-sm">
                          {index + 1}. {subtask.title}
                        </span>
                        <button
                          onClick={() => removeSubtask(subtask.id)}
                          className="text-red-400 hover:text-red-300"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
          
          <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 mt-6">
            <button
              onClick={addLocalNewQuest}
              className="bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-500 hover:to-emerald-600 px-6 py-2 rounded-lg transition-all duration-200"
            >
              Создать квест
            </button>
            <button
              onClick={() => {
                setLocalShowNewQuest(false);
                setLocalNewQuest({
                  title: '',
                  description: '',
                  type: 'main',
                  difficulty: 'rare',
                  reward: '',
                  bonus: '',
                  dueDate: '',
                  assignedTo: null,
                  subtasks: []
                });
                setQuestType('rare');
                setShowSubtaskForm(false);
                setNewSubtaskTitle('');
              }}
              className="bg-gray-600 hover:bg-gray-500 px-6 py-2 rounded-lg transition-all duration-200"
            >
              Отмена
            </button>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {filteredAndSortedQuests.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-lg mb-2">Квесты не найдены</div>
            <div className="text-gray-500">Попробуйте изменить параметры поиска или фильтры</div>
          </div>
        ) : (
          <StaggeredList>
            {isLoading ? (
              <SkeletonQuestList count={5} />
            ) : (
              filteredAndSortedQuests.map((quest, index) => (
                <StaggeredItem key={quest.id}>
                  <QuestCard quest={quest} />
                </StaggeredItem>
              ))
            )}
          </StaggeredList>
        )}
      </div>
    </div>
  );
};

  const FriendsTab = () => {
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [newFriendEmail, setNewFriendEmail] = useState('');
  const [localFriendSearch, setLocalFriendSearch] = useState('');

  return (
    <div>
      <div className="mb-6 bg-gray-800/30 rounded-xl p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Поиск друзей..."
              value={localFriendSearch}
              onChange={(e) => setLocalFriendSearch(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-400"
            />
          </div>
          <button
            onClick={() => setShowAddFriend(true)}
            className="flex items-center space-x-2 bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-500 hover:to-emerald-600 px-4 py-2 rounded-lg transition-all duration-200"
          >
            <UserPlus className="w-4 h-4" />
            <span>Добавить друга</span>
          </button>
        </div>
      </div>

      {showAddFriend && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-600 rounded-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-yellow-400">Добавить друга</h3>
              <button
                onClick={() => {
                  setShowAddFriend(false);
                  setNewFriendEmail('');
                }}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Email пользователя</label>
                <input
                  type="email"
                  placeholder="friend@quest.com"
                  value={newFriendEmail}
                  onChange={(e) => setNewFriendEmail(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-400"
                />
              </div>
              
              <div className="bg-gray-700/50 rounded-lg p-3 text-sm text-gray-400">
                <div className="font-medium mb-2">Введите email пользователя:</div>
                <div className="text-xs mb-2">
                  Убедитесь, что пользователь уже зарегистрирован в системе
                </div>
                {allUsers.length > 0 && (
                  <div>
                    <div className="font-medium mb-2">Доступные пользователи:</div>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {allUsers.slice(0, 5).map(user => (
                        <div key={user.id} className="flex items-center justify-between p-1 hover:bg-gray-600/50 rounded">
                          <div className="flex items-center space-x-2">
                            <div className="w-6 h-6">{getAvatarIcon(user.avatar)}</div>
                            <span className="text-xs">{user.name}</span>
                          </div>
                          <button
                            onClick={() => setNewFriendEmail(user.email)}
                            className="text-xs text-blue-400 hover:text-blue-300 truncate max-w-[120px]"
                          >
                            {user.email}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
                
              <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
                <button
                  onClick={() => {
                    sendFriendRequest(newFriendEmail);
                    setNewFriendEmail('');
                    setShowAddFriend(false);
                  }}
                  className="flex-1 bg-green-600 hover:bg-green-500 px-4 py-2 rounded-lg transition-colors"
                >
                  Отправить запрос
                </button>
                <button
                  onClick={() => {
                    setShowAddFriend(false);
                    setNewFriendEmail('');
                  }}
                  className="flex-1 bg-gray-600 hover:bg-gray-500 px-4 py-2 rounded-lg transition-colors"
                >
                  Отмена
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {friendRequests.length > 0 && (
        <div className="mb-6">
          <h3 className="text-xl font-bold mb-4 text-yellow-400 flex items-center space-x-2">
            <Bell className="w-5 h-5" />
            <span>Запросы в друзья ({friendRequests.length})</span>
          </h3>
          <div className="grid grid-cols-1 gap-4">
            {friendRequests.map(request => (
              <div key={request.request_id} className="bg-yellow-900/20 border border-yellow-400/30 rounded-xl p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0">
                  <div className="flex items-center space-x-3">
                    <div>{getAvatarIcon(request.avatar)}</div>
                    <div>
                      <h4 className="font-bold text-white">{request.name}</h4>
                      <div className="text-xs text-yellow-400 truncate">{request.email}</div>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                    <button
                      onClick={() => acceptFriendRequest(request.request_id, request.id)}
                      className="bg-green-600 hover:bg-green-500 px-3 py-1 rounded text-sm transition-colors"
                    >
                      Принять
                    </button>
                    <button
                      onClick={() => {
                        addNotification('Функция отклонения будет добавлена', 'info');
                      }}
                      className="bg-red-600 hover:bg-red-500 px-3 py-1 rounded text-sm transition-colors"
                    >
                      Отклонить
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <h3 className="text-xl font-bold mb-4">Мои друзья ({friends.length})</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {friends
            .filter(friend => 
              localFriendSearch === '' || 
              friend.name.toLowerCase().includes(localFriendSearch.toLowerCase())
            )
            .map(friend => (
              <div key={friend.id} className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
                <div className="flex items-center space-x-3">
                  <div>{getAvatarIcon(friend.avatar)}</div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold truncate">{friend.name}</h4>
                    <div className={`text-xs ${friend.status === 'online' ? 'text-green-400' : 'text-gray-500'}`}>
                      {friend.status === 'online' ? '● В сети' : '○ Не в сети'}
                    </div>
                  </div>
                </div>
              </div>
            ))}
        </div>
        {friends.length === 0 && (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <div className="text-gray-400 text-lg mb-2">У вас пока нет друзей</div>
            <div className="text-gray-500">Добавьте друзей, чтобы делиться квестами!</div>
          </div>
        )}
      </div>
    </div>
  );
};

  const AssignedQuestsTab = () => {
  const [showNewAssignedQuest, setShowNewAssignedQuest] = useState(false);
  const [assignedQuestType, setAssignedQuestType] = useState('rare');
  const [activeAssignedSubtab, setActiveAssignedSubtab] = useState('active');
  const [hideCompletedAssigned, setHideCompletedAssigned] = useState(false);
  const [newAssignedQuest, setNewAssignedQuest] = useState({
    title: '',
    description: '',
    type: 'main',
    difficulty: 'rare',
    reward: '',
    bonus: '',
    dueDate: '',
    assignedTo: null,
    subtasks: []
  });
  const [assignedRewardPackId, setAssignedRewardPackId] = useState(defaultPackId);
  const [showAssignedSubtaskForm, setShowAssignedSubtaskForm] = useState(false);
  const [newAssignedSubtaskTitle, setNewAssignedSubtaskTitle] = useState('');
  
  const assignedQuests = getQuestsToFriends();
  const activeQuests = assignedQuests.filter(q => !q.completed);
  const completedQuests = assignedQuests.filter(q => q.completed);
  
  const addAssignedSubtask = () => {
    if (newAssignedSubtaskTitle.trim()) {
      setNewAssignedQuest({
        ...newAssignedQuest,
        subtasks: [
          ...newAssignedQuest.subtasks,
          { id: Date.now(), title: newAssignedSubtaskTitle, completed: false, xp: 50 }
        ]
      });
      setNewAssignedSubtaskTitle('');
      setShowAssignedSubtaskForm(false);
    }
  };
  
  const removeAssignedSubtask = (subtaskId) => {
    setNewAssignedQuest({
      ...newAssignedQuest,
      subtasks: newAssignedQuest.subtasks.filter(st => st.id !== subtaskId)
    });
  };
  
  const createAssignedQuest = async () => {
    return measureAsyncPerformance('createAssignedQuest', async () => {
      // Валидация с использованием схемы
      const questData = {
        title: newAssignedQuest.title,
        description: newAssignedQuest.description,
        dueDate: newAssignedQuest.dueDate
      };

      const validation = validateForm(questData, validationSchemas.quest);
      if (!validation.isValid) {
        const firstError = Object.values(validation.errors)[0];
        addNotification(firstError, 'error');
        return;
      }
      
      if (!newAssignedQuest.assignedTo) {
        addNotification('Выберите друга!', 'error');
        return;
      }

    try {
      console.log('🎯 Creating assigned quest for friend:', newAssignedQuest.assignedTo);
      console.log('🎯 With subtasks:', newAssignedQuest.subtasks);
      
      const questDataForDB = {
        title: sanitizeInput(newAssignedQuest.title),
        description: sanitizeInput(newAssignedQuest.description || ''),
        type: newAssignedQuest.type,
        difficulty: assignedQuestType,
        reward: sanitizeInput(newAssignedQuest.reward || ''),
        bonus: sanitizeInput(newAssignedQuest.bonus || ''),
        due_date: newAssignedQuest.dueDate ? new Date(newAssignedQuest.dueDate).toISOString() : null,
        assigned_by: user.id,
        assigned_to: newAssignedQuest.assignedTo,
        created_by: user.id,
        total_steps: newAssignedQuest.subtasks.length || 1,
        reward_pack_id: assignedRewardPackId || defaultPackId
      };

      const { data: createdQuest, error: questError } = await supabase
        .from('quests')
        .insert(questDataForDB)
        .select()
        .single();

      if (questError) {
        console.error('⚠ Error creating quest:', questError);
        addNotification('Ошибка создания квеста: ' + questError.message, 'error');
        return;
      }

      console.log('✅ Assigned quest created:', createdQuest);

      if (newAssignedQuest.subtasks.length > 0) {
        const subtasksData = newAssignedQuest.subtasks.map((subtask, index) => ({
          quest_id: createdQuest.id,
          title: sanitizeInput(subtask.title),
          order_index: index,
          completed: false
        }));

        console.log('📝 Creating assigned quest subtasks:', subtasksData);

        const { error: subtasksError } = await supabase
          .from('quest_subtasks')
          .insert(subtasksData);

        if (subtasksError) {
          console.error('⚠ Error creating assigned subtasks:', subtasksError);
          addNotification('Ошибка создания подзадач: ' + subtasksError.message, 'error');
        } else {
          console.log('✅ Assigned quest subtasks created successfully');
        }
      }

      const friend = friends.find(f => f.id === newAssignedQuest.assignedTo);
      const friendName = friend ? friend.name : 'друга';

      setNewAssignedQuest({
        title: '',
        description: '',
        type: 'main',
        difficulty: 'rare',
        reward: '',
        bonus: '',
        dueDate: '',
        assignedTo: null,
        subtasks: []
      });
      setShowNewAssignedQuest(false);
      setAssignedQuestType('rare');
      setShowAssignedSubtaskForm(false);
      setAssignedRewardPackId(defaultPackId);

      await loadQuests();
      
      addNotification(`Квест успешно назначен для ${friendName}!`, 'success');

      } catch (error) {
        console.error('⚠ Error in createAssignedQuest:', error);
        addNotification('Ошибка: ' + error.message, 'error');
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="mb-3 flex items-center space-x-2">
        <button
          onClick={() => setActiveAssignedSubtab('active')}
          className={`px-3 py-1 rounded-lg text-sm border ${activeAssignedSubtab === 'active' ? 'bg-blue-600/20 border-blue-500 text-blue-300' : 'bg-gray-800/40 border-gray-600 text-gray-300 hover:bg-gray-700/40'}`}
        >
          На выполнении
        </button>
        {!hideCompletedAssigned && (
          <button
            onClick={() => setActiveAssignedSubtab('completed')}
            className={`px-3 py-1 rounded-lg text-sm border ${activeAssignedSubtab === 'completed' ? 'bg-green-600/20 border-green-500 text-green-300' : 'bg-gray-800/40 border-gray-600 text-gray-300 hover:bg-gray-700/40'}`}
          >
            Выполнено
          </button>
        )}
        <label className="ml-auto flex items-center space-x-2 text-xs text-gray-400">
          <input
            type="checkbox"
            checked={hideCompletedAssigned}
            onChange={(e) => {
              const hide = e.target.checked;
              setHideCompletedAssigned(hide);
              if (hide) setActiveAssignedSubtab('active');
            }}
          />
          <span>Скрыть вкладку «Выполнено»</span>
        </label>
      </div>
      <div>
        <button
          onClick={() => setShowNewAssignedQuest(!showNewAssignedQuest)}
          className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-500 hover:to-indigo-600 px-4 py-2 rounded-lg transition-all duration-200 transform hover:scale-105"
        >
          <Send className="w-4 h-4" />
          <span>Поставить задачу другу</span>
        </button>
      </div>

      {showNewAssignedQuest && (
        <div className="mb-8 bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-4 sm:p-6">
          <h3 className="text-xl font-bold mb-4 text-blue-400">Создать задачу для друга</h3>
          
          <div className="mb-6">
            <label className="block text-sm font-medium mb-3">Выберите друга *</label>
            <select
              value={newAssignedQuest.assignedTo || ''}
              onChange={(e) => setNewAssignedQuest({ ...newAssignedQuest, assignedTo: e.target.value })}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white mb-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="" className="bg-gray-700 text-white">-- Выберите друга --</option>
              {friends.map(friend => (
                <option key={friend.id} value={friend.id} className="bg-gray-700 text-white">
                  {friend.name}
                </option>
              ))}
            </select>

            <label className="block text-sm font-medium mb-3">Пачка карточек для награды</label>
            <select
              value={assignedRewardPackId}
              onChange={(e) => setAssignedRewardPackId(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {cardPacks.map(p => (
                <option key={p.id} value={p.id} className="bg-gray-700 text-white">{p.title}{p.is_builtin ? ' (встроенная)' : ''}</option>
              ))}
            </select>
          </div>
          
          <div className="mb-6">
            <label className="block text-sm font-medium mb-3">Тип квеста</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                onClick={() => {
                  setAssignedQuestType('rare');
                  setNewAssignedQuest({ ...newAssignedQuest, difficulty: 'rare', subtasks: [] });
                  setShowAssignedSubtaskForm(false);
                }}
                className={`p-4 rounded-lg border-2 transition-all ${
                  assignedQuestType === 'rare'
                    ? 'border-blue-400 bg-blue-900/20'
                    : 'border-gray-600 bg-gray-700/30 hover:border-gray-500'
                }`}
              >
                <div className="flex items-center justify-center mb-2">
                  <Star className="w-8 h-8 text-blue-400" />
                </div>
                <div className="font-bold text-blue-400">Rare</div>
                <div className="text-xs text-gray-400 mt-1">Одиночная задача</div>
              </button>
              
              <button
                onClick={() => {
                  setAssignedQuestType('legendary');
                  setNewAssignedQuest({ ...newAssignedQuest, difficulty: 'legendary' });
                }}
                className={`p-4 rounded-lg border-2 transition-all ${
                  assignedQuestType === 'legendary'
                    ? 'border-yellow-400 bg-yellow-900/20'
                    : 'border-gray-600 bg-gray-700/30 hover:border-gray-500'
                }`}
              >
                <div className="flex items-center justify-center mb-2">
                  <Trophy className="w-8 h-8 text-yellow-400" />
                </div>
                <div className="font-bold text-yellow-400">Legendary</div>
                <div className="text-xs text-gray-400 mt-1">С подзадачами</div>
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Название {assignedQuestType === 'legendary' ? 'главного ' : ''}квеста</label>
              <input
                type="text"
                placeholder={`Название ${assignedQuestType === 'legendary' ? 'главного ' : ''}квеста`}
                value={newAssignedQuest.title}
                onChange={(e) => setNewAssignedQuest({ ...newAssignedQuest, title: e.target.value })}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-400"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Описание квеста</label>
              <textarea
                placeholder="Описание квеста"
                value={newAssignedQuest.description}
                onChange={(e) => setNewAssignedQuest({ ...newAssignedQuest, description: e.target.value })}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-400"
                rows="3"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Награда за квест</label>
              <input
                type="text"
                placeholder="Награда за выполнение"
                value={newAssignedQuest.reward}
                onChange={(e) => setNewAssignedQuest({ ...newAssignedQuest, reward: e.target.value })}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-400"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Дедлайн задачи</label>
              <input
                type="date"
                value={newAssignedQuest.dueDate}
                onChange={(e) => setNewAssignedQuest({ ...newAssignedQuest, dueDate: e.target.value })}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-400"
              />
            </div>
            
            {assignedQuestType === 'legendary' && (
              <div className="mt-6 pt-6 border-t border-gray-600">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium">Подзадачи</h4>
                  <button
                    onClick={() => setShowAssignedSubtaskForm(!showAssignedSubtaskForm)}
                    className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-500 px-3 py-1 rounded-lg transition-colors text-sm"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Добавить подзадачу</span>
                  </button>
                </div>
                
                {showAssignedSubtaskForm && (
                  <div className="mb-4 p-4 bg-gray-700/50 rounded-lg">
                    <label className="block text-sm font-medium mb-2">Название подзадачи</label>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="text"
                        placeholder="Введите название подзадачи"
                        value={newAssignedSubtaskTitle}
                        onChange={(e) => setNewAssignedSubtaskTitle(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && addAssignedSubtask()}
                        className="flex-1 bg-gray-600 border border-gray-500 rounded-lg px-4 py-2 text-white placeholder-gray-400"
                      />
                      <div className="flex space-x-2">
                        <button
                          onClick={addAssignedSubtask}
                          className="bg-green-600 hover:bg-green-500 px-4 py-2 rounded-lg transition-colors"
                        >
                          Добавить
                        </button>
                        <button
                          onClick={() => {
                            setShowAssignedSubtaskForm(false);
                            setNewAssignedSubtaskTitle('');
                          }}
                          className="bg-gray-600 hover:bg-gray-500 px-4 py-2 rounded-lg transition-colors"
                        >
                          Отмена
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                
                {newAssignedQuest.subtasks.length > 0 && (
                  <div className="space-y-2">
                    {newAssignedQuest.subtasks.map((subtask, index) => (
                      <div key={subtask.id} className="flex items-center justify-between bg-gray-700/30 rounded p-3">
                        <span className="text-sm">
                          {index + 1}. {subtask.title}
                        </span>
                        <button
                          onClick={() => removeAssignedSubtask(subtask.id)}
                          className="text-red-400 hover:text-red-300"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
          
          <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 mt-6">
            <button
              onClick={createAssignedQuest}
              className="bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-500 hover:to-indigo-600 px-6 py-2 rounded-lg transition-all duration-200"
            >
              Создать квест
            </button>
            <button
              onClick={() => {
                setShowNewAssignedQuest(false);
                setNewAssignedQuest({
                  title: '',
                  description: '',
                  type: 'main',
                  difficulty: 'rare',
                  reward: '',
                  bonus: '',
                  dueDate: '',
                  assignedTo: null,
                  subtasks: []
                });
                setAssignedQuestType('rare');
                setShowAssignedSubtaskForm(false);
                setNewAssignedSubtaskTitle('');
              }}
              className="bg-gray-600 hover:bg-gray-500 px-6 py-2 rounded-lg transition-all duration-200"
            >
              Отмена
            </button>
          </div>
        </div>
      )}

      {(activeAssignedSubtab === 'active' || hideCompletedAssigned) && activeQuests.length > 0 && (
        <div>
          <h3 className="text-xl font-bold mb-4 text-yellow-400">Активные задания</h3>
          <div className="space-y-4">
            {activeQuests.map(quest => (
              <QuestCard key={quest.id} quest={quest} />
            ))}
          </div>
        </div>
      )}

      {activeAssignedSubtab === 'completed' && !hideCompletedAssigned && completedQuests.length > 0 && (
        <div>
          <h3 className="text-xl font-bold mb-4 text-green-400">Выполненные задания</h3>
          <div className="space-y-4">
            {completedQuests.map(quest => (
              <QuestCard key={quest.id} quest={quest} />
            ))}
          </div>
        </div>
      )}

      {assignedQuests.length === 0 && (
        <div className="text-center py-12">
          <Send className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <div className="text-gray-400 text-lg mb-2">Нет поставленных заданий</div>
          <div className="text-gray-500">Создайте квест и назначьте его другу!</div>
        </div>
      )}
    </div>
  );
};

  // Loading screen
  // Loading screen
if (loading) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white flex items-center justify-center">
      <div className="text-center">
        <Sword className="w-16 h-16 text-yellow-400 mx-auto mb-4 animate-pulse" />
        <div className="text-xl">Загрузка...</div>
      </div>
    </div>
  );
}

// Auth screen - УЛУЧШЕННАЯ ПОЛНАЯ ВЕРСИЯ
if (!user) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
      <NotificationSystem notifications={notifications} onClose={closeNotification} />
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl max-w-md w-full p-8">
          <div className="text-center mb-8">
            <Sword className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
            <h1 className="text-3xl font-bold mb-2">Quest Manager</h1>
            <p className="text-gray-400">Превращай задачи в приключения</p>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            {authMode === 'register' && (
              <div>
                <label className="block text-sm font-medium mb-2">Имя</label>
                <input
                  type="text"
                  required
                  value={authForm.name}
                  onChange={(e) => setAuthForm({ ...authForm, name: e.target.value })}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
                  placeholder="Ваше имя"
                />
              </div>
            )}

            {authMode !== 'set-new-password' && (
            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <input
                type="email"
                required
                value={authForm.email}
                onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
                placeholder="your@email.com"
              />
            </div>
            )}

            {authMode === 'login' && (
              <div>
                <label className="block text-sm font-medium mb-2">Пароль</label>
                <input
                  type="password"
                  required
                  value={authForm.password}
                  onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
                  placeholder="••••••••"
                />
              </div>
            )}

            {authMode === 'set-new-password' && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-2">Новый пароль</label>
                  <input
                    type="password"
                    required
                    value={authForm.password}
                    onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
                    placeholder="••••••••"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Подтвердите пароль</label>
                  <input
                    type="password"
                    required
                    value={authForm.confirmPassword}
                    onChange={(e) => setAuthForm({ ...authForm, confirmPassword: e.target.value })}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
                    placeholder="••••••••"
                  />
                </div>
              </>
            )}

            {authMode === 'register' && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-2">Пароль</label>
                  <input
                    type="password"
                    required
                    value={authForm.password}
                    onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
                    placeholder="••••••••"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Подтвердите пароль</label>
                  <input
                    type="password"
                    required
                    value={authForm.confirmPassword}
                    onChange={(e) => setAuthForm({ ...authForm, confirmPassword: e.target.value })}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
                    placeholder="••••••••"
                  />
                </div>
              </>
            )}

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 px-4 py-2 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2"
            >
              {authMode === 'login' && <LogIn className="w-4 h-4" />}
              {authMode === 'register' && <UserPlus className="w-4 h-4" />}
              <span>
                {authMode === 'login' ? 'Войти' : authMode === 'register' ? 'Зарегистрироваться' : 'Обновить пароль'}
              </span>
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
              className="text-blue-400 hover:text-blue-300 transition-colors"
            >
              {authMode === 'login' 
                ? 'Нет аккаунта? Зарегистрироваться' 
                : 'Уже есть аккаунт? Войти'
              }
            </button>
            {authMode === 'login' && (
              <div className="mt-3">
                <button
                  onClick={async () => {
                    if (!authForm.email) { alert('Введите email сверху и нажмите'); return; }
                    const { error } = await supabase.auth.resetPasswordForEmail(authForm.email, { redirectTo: window.location.origin });
                    if (error) { alert('Ошибка отправки письма: ' + error.message); }
                    else { addNotification('Письмо для восстановления отправлено', 'success'); }
                  }}
                  className="text-sm text-blue-400 hover:text-blue-300"
                >
                  Забыли пароль?
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const tabs = [
  { id: 'dashboard', label: 'Главная', icon: Home },
  { id: 'profile', label: 'Профиль', icon: User },
  { id: 'my-quests', label: 'Мои задачи', icon: ListChecks },
  { id: 'rewards', label: 'Награды', icon: Trophy },
  { id: 'assigned-quests', label: 'Поставленные задачи', icon: Send },
  { id: 'friends', label: 'Друзья', icon: Users }
];

return (
  <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
    {/* НОВОЕ: Система уведомлений */}
    <NotificationSystem notifications={notifications} onClose={closeNotification} />

    {/* Header */}
    <div className="bg-glass backdrop-blur-strong border-b border-glass-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Sword className="w-8 h-8 text-yellow-400" />
            <button
              onClick={() => handleTabChange('profile')}
              className="hidden sm:flex items-center space-x-2 glass hover:glass-hover px-4 py-2 rounded-lg transition-all duration-300 hover:scale-105"
            >
              <Mail className="w-4 h-4 text-blue-400" />
              <span className="text-white font-medium">Профиль</span>
            </button>
            
            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="sm:hidden flex items-center space-x-2 bg-gray-700 hover:bg-gray-600 px-3 py-2 rounded-lg transition-colors"
            >
              <Menu className="w-4 h-4" />
            </button>
          </div>
          
          <div className="flex items-center space-x-3 sm:space-x-6">
            
            {/* Collection button */}
            <button
              onClick={() => handleTabChange('collection')}
              className="flex items-center space-x-1 sm:space-x-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 px-2 sm:px-4 py-2 rounded-lg transition-all duration-200 transform hover:scale-105"
            >
              <Award className="w-4 h-4" />
              <span className="hidden sm:inline">Коллекция</span>
            </button>

            {/* Logout button */}
            <button
              onClick={handleLogout}
              className="flex items-center space-x-1 sm:space-x-2 gradient-bg hover:shadow-glow px-2 sm:px-3 py-2 rounded-lg transition-all duration-300 hover:scale-105"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Выйти</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    {/* Mobile Navigation Menu - Bottom Sheet */}
    <BottomSheet
      isOpen={mobileMenuOpen}
      onClose={() => setMobileMenuOpen(false)}
      title="Навигация"
    >
      <div className="p-4 space-y-2">
        {tabs.map((tab, index) => {
          const Icon = tab.icon;
          return (
            <motion.button
              key={tab.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => handleTabChange(tab.id)}
              className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-300 relative ${
                activeTab === tab.id
                  ? 'glass text-primary-400 shadow-glow'
                  : 'text-gray-400 hover:text-white hover:glass-hover'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-base font-medium">{tab.label}</span>
              {tab.id === 'friends' && friendRequests.length > 0 && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="ml-auto bg-error-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center"
                >
                  {friendRequests.length}
                </motion.div>
              )}
              {tab.id === 'rewards' && rewards.pending.length > 0 && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="ml-auto bg-warning-500 text-black text-xs rounded-full w-6 h-6 flex items-center justify-center"
                >
                  {rewards.pending.length}
                </motion.div>
              )}
            </motion.button>
          );
        })}
      </div>
    </BottomSheet>

    {/* Desktop Navigation Tabs */}
    <div className="hidden sm:block bg-gray-800/30 backdrop-blur-sm border-b border-gray-700 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex space-x-1 overflow-x-auto">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-3 rounded-t-lg transition-all duration-300 relative ${
                  activeTab === tab.id
                    ? 'glass text-primary-400 border-b-2 border-primary-500 shadow-glow'
                    : 'text-gray-400 hover:text-white hover:glass-hover'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="whitespace-nowrap">{tab.label}</span>
                {tab.id === 'friends' && friendRequests.length > 0 && (
                  <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {friendRequests.length}
                  </div>
                )}
                {tab.id === 'rewards' && rewards.pending.length > 0 && (
                  <div className="absolute -top-1 -right-1 bg-yellow-500 text-black text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {rewards.pending.length}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>

    {/* Main Content */}
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <PageTransition activeTab={activeTab}>
        {activeTab === 'dashboard' && (
        <div className="space-y-6">
          
          <div className="glass-card p-4 sm:p-6">
            <Heading3 animate={true} className="mb-4">Быстрые действия</Heading3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <button
                onClick={() => handleTabChange('my-quests')}
                className="gradient-bg hover:shadow-glow rounded-lg p-3 transition-all duration-300 hover:scale-105"
              >
                <ListChecks className="w-5 h-5 mb-1 mx-auto" />
                <div className="text-xs">Мои задачи</div>
              </button>
              <button
                onClick={() => handleTabChange('rewards')}
                className="gradient-bg-secondary hover:shadow-glow-purple rounded-lg p-3 transition-all duration-300 hover:scale-105"
              >
                <Trophy className="w-5 h-5 mb-1 mx-auto" />
                <div className="text-xs">Награды</div>
              </button>
              <button
                onClick={() => handleTabChange('assigned-quests')}
                className="gradient-bg-accent hover:shadow-glow-cyan rounded-lg p-3 transition-all duration-300 hover:scale-105"
              >
                <Send className="w-5 h-5 mb-1 mx-auto" />
                <div className="text-xs">Поставленные задачи</div>
              </button>
              <button
                onClick={() => handleTabChange('friends')}
                className="gradient-bg-accent hover:shadow-glow-cyan rounded-lg p-3 transition-all duration-300 hover:scale-105"
              >
                <Users className="w-5 h-5 mb-1 mx-auto" />
                <div className="text-xs">Друзья</div>
              </button>
            </div>
          </div>

          <div className="bg-gray-800/50 rounded-xl p-4 sm:p-6">
            <h3 className="text-xl font-bold mb-4">Последняя активность</h3>
            <div className="space-y-3">
              {rewards.pending.slice(0, 3).map(reward => (
                <div key={reward.id} className="flex flex-col sm:flex-row sm:items-center justify-between bg-gray-700/50 rounded-lg p-3 space-y-3 sm:space-y-0">
                  <div className="flex items-center space-x-3">
                    <Gift className="w-5 h-5 text-yellow-400" />
                    <div>
                      <div className="font-medium">{reward.reward}</div>
                      <div className="text-xs text-gray-400">от {reward.questTitle}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => claimReward(reward.id)}
                    className="bg-green-600 hover:bg-green-500 px-3 py-1 rounded text-sm transition-colors w-full sm:w-auto"
                  >
                    Получить
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      
      {activeTab === 'profile' && (
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
                          onClick={() => handleTabChange('pack-manager')}
                          className="flex items-center space-x-3 p-3 bg-gray-700/50 hover:bg-gray-600/50 rounded-lg transition-colors border border-gray-600"
                        >
                          <Settings className="w-5 h-5 text-blue-400" />
                          <span>Управление пачками</span>
                        </button>
                      )}
                      
                      {hasPermission('can_create_codes') && (
                        <button
                          onClick={() => handleTabChange('invitation-codes')}
                          className="flex items-center space-x-3 p-3 bg-gray-700/50 hover:bg-gray-600/50 rounded-lg transition-colors border border-gray-600"
                        >
                          <Shield className="w-5 h-5 text-green-400" />
                          <span>Коды приглашений</span>
                        </button>
                      )}
                      
                      {userRole?.role_type === 'admin' && (
                        <button
                          onClick={() => handleTabChange('admin')}
                          className="flex items-center space-x-3 p-3 bg-gray-700/50 hover:bg-gray-600/50 rounded-lg transition-colors border border-gray-600"
                        >
                          <Crown className="w-5 h-5 text-purple-400" />
                          <span>Админ-панель</span>
                        </button>
                      )}
                      
                      <button
                        onClick={() => setShowActivateCodeModal(true)}
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
                    className="flex items-center justify-center space-x-2 bg-green-600 hover:bg-green-500 px-4 py-2 rounded-lg transition-colors"
                  >
                    <Save className="w-4 h-4" />
                    <span>Сохранить</span>
                  </button>
                  <button
                    onClick={() => {
                      setEditingProfile(false);
                      setProfileForm({
                        name: currentUser.name,
                        email: currentUser.email,
                        oldPassword: '',
                        newPassword: '',
                        confirmPassword: ''
                      });
                    }}
                    className="bg-gray-600 hover:bg-gray-500 px-4 py-2 rounded-lg transition-colors"
                  >
                    Отмена
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      
      {activeTab === 'rewards' && <RewardsTab />}
      {activeTab === 'collection' && <CollectionTab />}
      {activeTab === 'my-quests' && (
        tabLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="ml-3 text-gray-300">Загрузка квестов...</span>
          </div>
        ) : (
          <MyQuestsTab />
        )
      )}
      {activeTab === 'friends' && <FriendsTab />}
      {activeTab === 'assigned-quests' && <AssignedQuestsTab />}
      
      {/* Административные вкладки (доступны через профиль) */}
      {activeTab === 'pack-manager' && <PackManagerTab />}
      {activeTab === 'invitation-codes' && <InvitationCodesTab userId={user?.id} />}
      {activeTab === 'admin' && <AdminPanel userId={user?.id} />}
      </PageTransition>
    </div>

    {/* Achievements Modal */}
    <AnimatePresence>
      {showAchievements && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 50 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="glass-card border-glass-border max-w-4xl w-full max-h-[80vh] overflow-hidden"
          >
          <div className="flex items-center justify-between p-6 border-b border-gray-700">
            <div className="flex items-center space-x-3">
              <Award className="w-6 h-6 text-yellow-400" />
              <h2 className="text-2xl font-bold text-yellow-400">Достижения</h2>
            </div>
            <button
              onClick={() => setShowAchievements(false)}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          
          <div className="p-6 overflow-y-auto max-h-[60vh]" style={{ scrollbarWidth: 'thin', scrollbarColor: '#4B5563 #1F2937' }}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pr-2">
              {achievements.map((achievement, index) => (
                <motion.div
                  key={achievement.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`glass-card ${
                    achievement.unlocked
                      ? 'border-success-500/30 shadow-glow-success'
                      : 'border-gray-600'
                  } p-4`}
                >
                  <div className="flex items-start space-x-3">
                    <div className={`${achievement.unlocked ? '' : 'opacity-50 grayscale'}`}>
                      {achievement.icon === 'Target' && <Target className="w-10 h-10 text-green-400" />}
                      {achievement.icon === 'Team' && <Users className="w-10 h-10 text-blue-400" />}
                      {achievement.icon === 'Mentor' && <Award className="w-10 h-10 text-purple-400" />}
                      {achievement.icon === 'Crown' && <Trophy className="w-10 h-10 text-yellow-400" />}
                      {achievement.icon === 'Speed' && <Zap className="w-10 h-10 text-orange-400" />}
                    </div>
                    <div className="flex-1">
                      <h3 className={`font-bold ${achievement.unlocked ? 'text-yellow-400' : 'text-gray-400'}`}>
                        {achievement.title}
                      </h3>
                      <p className="text-sm text-gray-400 mt-1">{achievement.description}</p>
                      {!achievement.unlocked && achievement.progress !== undefined && (
                        <div className="mt-2">
                          <div className="flex justify-between text-xs text-gray-500 mb-1">
                            <span>Прогресс</span>
                            <span>{achievement.progress}/{achievement.total}</span>
                          </div>
                          <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-blue-400 to-purple-500"
                              style={{ width: `${(achievement.progress / achievement.total) * 100}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>

    {/* Модальное окно для активации кода приглашения */}
    <ActivateCodeModal
      isOpen={showActivateCodeModal}
      onClose={() => setShowActivateCodeModal(false)}
      onSuccess={(roleType) => {
        addNotification(`Роль ${roleType} успешно активирована!`, 'success');
      }}
    />
  </div>
);
};

// Обертываем приложение в ErrorBoundary для обработки ошибок
const App = () => {
  return (
    <ErrorBoundary>
      <QuestTaskManager />
    </ErrorBoundary>
  );
};

export default App;