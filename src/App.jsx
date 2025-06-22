import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  Plus, Sword, Trophy, Star, CheckCircle, Circle, ChevronDown, ChevronRight, 
  Target, Zap, Search, Filter, Calendar, User, Users, Gift,
  Mail, Lock, Save, X, UserPlus, Send, Award, Home, ListChecks,
  Bell, Check, Eye, Edit2, Shield, LogOut, LogIn, Menu
} from 'lucide-react';

// 🔥 ВАШИ ДАННЫЕ SUPABASE:
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://hqhaqtwxqawslwpjrojd.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhxaGFxdHd4cWF3c2x3cGpyb2pkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAyNDc5MjcsImV4cCI6MjA2NTgyMzkyN30.bNQxmic8Tju-bbCNRoAgbYZCMhPQRY_tPa4K-GHcZM4';

const supabase = createClient(supabaseUrl, supabaseKey);

const QuestTaskManager = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
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
    level: 1,
    xp: 0,
    xpToNext: 1000,
    completedQuests: 0,
    totalXp: 0,
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
  const [quests, setQuests] = useState([]);
  const [rewards, setRewards] = useState({pending: [], claimed: []});
  const [achievements, setAchievements] = useState([]);
  const [showAchievements, setShowAchievements] = useState(false);
  
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
  const getMyQuests = () => quests.filter(q => !q.assignedBy && !q.assignedTo);
  const getQuestsFromFriends = () => quests.filter(q => q.assignedBy !== null);
  const getQuestsToFriends = () => quests.filter(q => q.assignedTo !== null);

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

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        setCurrentUser(prev => ({
          ...prev,
          email: session.user.email,
          name: session.user.user_metadata?.name || session.user.email.split('@')[0]
        }));
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      loadUserData();
      loadQuests();
      loadRewards();

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
          level: currentUser.level || 1,
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
              level: friend.level || 1,
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
            level: req.from_profile?.level || 1,
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
            level: u.level || 1,
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
            xp,
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
          xp: quest.xp,
          reward: quest.reward,
          bonus: quest.bonus,
          completed: quest.completed,
          progress: quest.progress || 0,
          totalSteps: quest.total_steps || 1,
          createdAt: new Date(quest.created_at),
          dueDate: quest.due_date ? new Date(quest.due_date) : null,
          assignedBy: quest.assigned_by,
          assignedTo: quest.assigned_to,
          expanded: false,
          subtasks: quest.quest_subtasks ? quest.quest_subtasks
            .sort((a, b) => (a.order_index || 0) - (b.order_index || 0))
            .map(st => ({
              id: st.id,
              title: st.title,
              completed: st.completed || false,
              xp: st.xp || 50
            })) : []
        }));

        setQuests(formattedQuests);
        console.log('📋 Formatted quests with subtasks:', formattedQuests);
      }

    } catch (error) {
      console.error('❌ Error in loadQuests:', error);
    }
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
            xp: r.xp,
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
            xp: r.xp,
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
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: authForm.email,
          password: authForm.password
        });
        
        if (error) {
          alert('Ошибка входа: ' + error.message);
        }
      }
    } catch (error) {
      alert('Ошибка: ' + error.message);
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

  const removeFriend = async (friendId) => {
    try {
      console.log('🗑️ Removing friend:', friendId);
      
      // Удаляем дружбу из таблицы friends
      const { error: deleteFriendError } = await supabase
        .from('friends')
        .delete()
        .or(`and(user1_id.eq.${user.id},user2_id.eq.${friendId}),and(user1_id.eq.${friendId},user2_id.eq.${user.id})`);

      if (deleteFriendError) {
        console.error('❌ Error removing friend:', deleteFriendError);
        alert('Ошибка удаления из друзей: ' + deleteFriendError.message);
        return;
      }

      console.log('✅ Friend removed successfully');
      
      // Перезагружаем данные пользователя
      await loadUserData();
      alert('Пользователь удален из друзей');
      
    } catch (error) {
      console.error('❌ Error in removeFriend:', error);
      alert('Ошибка: ' + error.message);
    }
  };
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

      setCurrentUser(prev => {
        const newXp = prev.xp + reward.xp;
        const levelUp = newXp >= prev.xpToNext;
        return {
          ...prev,
          xp: levelUp ? newXp - prev.xpToNext : newXp,
          level: levelUp ? prev.level + 1 : prev.level,
          xpToNext: levelUp ? prev.xpToNext + 500 : prev.xpToNext,
          totalXp: prev.totalXp + reward.xp
        };
      });

      await loadRewards();

    } catch (error) {
      console.error('❌ Error in claimReward:', error);
      alert('Ошибка: ' + error.message);
    }
  };

  const saveProfile = () => {
    if (profileForm.newPassword && profileForm.newPassword !== profileForm.confirmPassword) {
      alert('Пароли не совпадают!');
      return;
    }
    
    setCurrentUser({
      ...currentUser,
      name: profileForm.name,
      email: profileForm.email
    });
    
    setEditingProfile(false);
    setProfileForm({ ...profileForm, oldPassword: '', newPassword: '', confirmPassword: '' });
  };

  const toggleSubtask = async (questId, subtaskId) => {
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
            xp: subtask.xp,
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
            xp: quest.xp,
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
          
      setQuests(quests.map(q => {
        if (q.id === questId) {
          return {
            ...q,
            subtasks: updatedSubtasks,
            progress: completedCount,
            completed: isQuestComplete
          };
        }
        return q;
      }));

      setTimeout(async () => {
        await loadRewards();
      }, 500);

    } catch (error) {
      console.error('❌ Error in toggleSubtask:', error);
      alert('Ошибка: ' + error.message);
    }
  };

  const toggleQuest = async (questId) => {
    try {
      const quest = quests.find(q => q.id === questId);
      if (!quest || quest.subtasks.length > 0) {
        console.log('❌ Quest not found or has subtasks');
        return;
      }

      const newCompletedStatus = !quest.completed;
      console.log(`🔄 Toggling quest ${questId} to ${newCompletedStatus}`);

      const { error: questUpdateError } = await supabase
        .from('quests')
        .update({ 
          completed: newCompletedStatus,
          progress: newCompletedStatus ? 1 : 0
        })
        .eq('id', questId);

      if (questUpdateError) {
        console.error('❌ Error updating quest:', questUpdateError);
        alert('Ошибка обновления квеста: ' + questUpdateError.message);
        return;
      }

      if (newCompletedStatus && !quest.completed) {
        const rewardData = {
          user_id: user.id,
          quest_id: quest.id,
          quest_title: quest.title,
          title: quest.reward || 'Quest Completed',
          bonus: quest.bonus,
          xp: quest.xp,
          type: 'main',
          claimed: false
        };

        const { error: rewardError } = await supabase
          .from('rewards')
          .insert(rewardData);

        if (rewardError) {
          console.error('❌ Error creating reward:', rewardError);
        }
      }
      else if (!newCompletedStatus && quest.completed) {
        const { error: deleteRewardError } = await supabase
          .from('rewards')
          .delete()
          .eq('quest_id', questId)
          .eq('type', 'main')
          .eq('claimed', false);

        if (deleteRewardError) {
          console.error('❌ Error deleting reward:', deleteRewardError);
        }
      }

      setQuests(quests.map(q => {
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
          
          return { ...q, completed: newCompletedStatus, progress: newCompletedStatus ? 1 : 0 };
        }
        return q;
      }));

      await loadRewards();

    } catch (error) {
      console.error('❌ Error in toggleQuest:', error);
      alert('Ошибка: ' + error.message);
    }
  };

  const expandQuest = (questId) => {
    setQuests(quests.map(quest => {
      if (quest.id === questId) {
        return { ...quest, expanded: !quest.expanded };
      }
      return quest;
    }));
  };

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
    
    const diffTime = targetDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    // Форматируем время
    const timeString = targetDate.toLocaleTimeString('ru-RU', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
    
    if (diffDays < 0) return `Просрочено на ${Math.abs(diffDays)} дн. (${timeString})`;
    if (diffDays === 0) return `Сегодня ${timeString}`;
    if (diffDays === 1) return `Завтра ${timeString}`;
    return `Осталось ${diffDays} дн. (${timeString})`;
  };

  const getDateColor = (date) => {
    if (!date) return 'text-gray-400';
    const today = new Date();
    const targetDate = new Date(date);
    
    const diffTime = targetDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffTime < 0) return 'text-red-400'; // Просрочено
    if (diffTime < 24 * 60 * 60 * 1000) return 'text-yellow-400'; // Меньше дня
    if (diffDays <= 3) return 'text-orange-400'; // 3 дня или меньше
    return 'text-gray-400';
  };

  const QuestCard = ({ quest }) => (
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
                <span className={`text-xs px-2 py-1 rounded-full border ${difficultyColors[quest.difficulty]} bg-black/30`}>
                  {quest.difficulty.toUpperCase()}
                </span>
              </div>
              {quest.completed && <CheckCircle className="w-5 h-5 text-green-400" />}
              {quest.assignedBy && (
                <span className="text-xs text-blue-400">
                  От: {getFriendById(quest.assignedBy)?.name || 'Неизвестно'}
                </span>
              )}
              {quest.assignedTo && (
                <span className="text-xs text-purple-400">
                  Для: {getFriendById(quest.assignedTo)?.name || 'Неизвестно'}
                </span>
              )}
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={() => quest.subtasks?.length === 0 ? toggleQuest(quest.id) : expandQuest(quest.id)}
                className="flex items-center space-x-2 hover:text-yellow-400 transition-colors"
              >
                {quest.subtasks?.length > 0 ? (
                  quest.expanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />
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
              <Zap className="w-4 h-4 text-blue-400" />
              <span className="text-blue-400 font-bold">{quest.xp} XP</span>
            </div>
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
      
      {quest.expanded && quest.subtasks?.length > 0 && (
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
                    <span className="text-blue-400 text-sm">{subtask.xp}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const RewardsTab = () => {
    const [localRewardSearch, setLocalRewardSearch] = useState('');
    const [localRewardFilter, setLocalRewardFilter] = useState('all');
    
    const filteredRewards = localRewardFilter === 'all' 
      ? [...rewards.pending, ...rewards.claimed]
      : localRewardFilter === 'pending' 
        ? rewards.pending 
        : rewards.claimed;

    return (
      <div>
        <div className="mb-6 bg-gray-800/30 rounded-xl p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={localRewardFilter}
                onChange={(e) => setLocalRewardFilter(e.target.value)}
                className="bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white text-sm"
              >
                <option value="all">Все награды</option>
                <option value="pending">К получению</option>
                <option value="claimed">Полученные</option>
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
                    <div className="flex items-center space-x-1 mb-2">
                      <Zap className="w-4 h-4 text-blue-400" />
                      <span className="text-blue-400 font-bold">{reward.xp} XP</span>
                    </div>
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
    const [questType, setQuestType] = useState('rare');
    const [localNewQuest, setLocalNewQuest] = useState({
      title: '',
      description: '',
      type: 'main',
      difficulty: 'rare',
      xp: 200,
      reward: '',
      bonus: '',
      dueDate: '',
      assignedTo: null,
      subtasks: []
    });
    const [showSubtaskForm, setShowSubtaskForm] = useState(false);
    const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
    
    const myQuests = getMyQuests();
    const questsFromFriends = getQuestsFromFriends();
    const allMyQuests = [...myQuests, ...questsFromFriends];
    
    const filterQuests = (quests) => {
      let filtered = quests;
      
      if (localQuestSearch.trim()) {
        filtered = filtered.filter(quest =>
          quest.title.toLowerCase().includes(localQuestSearch.toLowerCase()) ||
          quest.description.toLowerCase().includes(localQuestSearch.toLowerCase())
        );
      }
      
      if (localStatusFilter !== 'all') {
        filtered = filtered.filter(quest => getQuestStatus(quest) === localStatusFilter);
      }
      
      return filtered;
    };
    
    const sortQuests = (quests) => {
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
            comparison = a.xp - b.xp;
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
    };
    
    const filteredAndSortedQuests = sortQuests(filterQuests(allMyQuests));
    
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
      if (!localNewQuest.title.trim()) {
        alert('Введите название квеста!');
        return;
      }
      
      try {
        console.log('📝 Creating personal quest with subtasks:', localNewQuest.subtasks);
        
        const questData = {
          title: localNewQuest.title,
          description: localNewQuest.description,
          type: localNewQuest.type,
          difficulty: questType,
          xp: questType === 'rare' ? 200 : 500,
          reward: localNewQuest.reward,
          bonus: localNewQuest.bonus,
          due_date: localNewQuest.dueDate ? new Date(localNewQuest.dueDate).toISOString() : null,
          created_by: user.id,
          total_steps: localNewQuest.subtasks.length || 1
        };

        const { data: createdQuest, error: questError } = await supabase
          .from('quests')
          .insert(questData)
          .select()
          .single();

        if (questError) {
          console.error('❌ Error creating quest:', questError);
          alert('Ошибка создания квеста: ' + questError.message);
          return;
        }

        console.log('✅ Quest created:', createdQuest);

        if (localNewQuest.subtasks.length > 0) {
          const subtasksData = localNewQuest.subtasks.map((subtask, index) => ({
            quest_id: createdQuest.id,
            title: subtask.title,
            xp: subtask.xp || 50,
            order_index: index,
            completed: false
          }));

          console.log('📝 Creating subtasks:', subtasksData);

          const { error: subtasksError } = await supabase
            .from('quest_subtasks')
            .insert(subtasksData);

          if (subtasksError) {
            console.error('❌ Error creating subtasks:', subtasksError);
            alert('Ошибка создания подзадач: ' + subtasksError.message);
          } else {
            console.log('✅ Subtasks created successfully');
          }
        }

        setLocalNewQuest({
          title: '',
          description: '',
          type: 'main',
          difficulty: 'rare',
          xp: 200,
          reward: '',
          bonus: '',
          dueDate: '',
          assignedTo: null,
          subtasks: []
        });
        setLocalShowNewQuest(false);
        setQuestType('rare');
        setShowSubtaskForm(false);

        await loadQuests();
        
        alert('Квест создан!');

      } catch (error) {
        console.error('❌ Error creating personal quest:', error);
        alert('Ошибка: ' + error.message);
      }
    };

    return (
      <div>
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
                className="w-full bg-gray-700 border border-gray-600 rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:border-yellow-400 appearance-none text-sm"
              >
                <option value="all">Все квесты</option>
                <option value="pending">В ожидании</option>
                <option value="in-progress">В процессе</option>
                <option value="completed">Выполнено</option>
              </select>
            </div>
            
            <select
              value={localSortBy}
              onChange={(e) => setLocalSortBy(e.target.value)}
              className="bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-yellow-400 text-sm"
            >
              <option value="dueDate">По сроку</option>
              <option value="created">По дате создания</option>
              <option value="difficulty">По сложности</option>
              <option value="xp">По XP</option>
              <option value="alphabetical">По алфавиту</option>
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
                  <div className="text-xs text-gray-400 mt-1">Одиночная задача (200 XP)</div>
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
                  <div className="text-xs text-gray-400 mt-1">С подзадачами (500 XP)</div>
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="date"
                    value={localNewQuest.dueDate ? localNewQuest.dueDate.split('T')[0] : ''}
                    onChange={(e) => {
                      const currentTime = localNewQuest.dueDate ? localNewQuest.dueDate.split('T')[1] || '23:59' : '23:59';
                      setLocalNewQuest({ 
                        ...localNewQuest, 
                        dueDate: e.target.value ? `${e.target.value}T${currentTime}` : '' 
                      });
                    }}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-400"
                  />
                  <input
                    type="time"
                    value={localNewQuest.dueDate ? localNewQuest.dueDate.split('T')[1] || '23:59' : '23:59'}
                    onChange={(e) => {
                      const currentDate = localNewQuest.dueDate ? localNewQuest.dueDate.split('T')[0] : new Date().toISOString().split('T')[0];
                      setLocalNewQuest({ 
                        ...localNewQuest, 
                        dueDate: `${currentDate}T${e.target.value}` 
                      });
                    }}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-400"
                  />
                </div>
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
                    xp: 200,
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
            <div className="space-y-4">
              {filteredAndSortedQuests.map(quest => (
                <QuestCard key={quest.id} quest={quest} />
              ))}
            </div>
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
                        <div className="text-sm text-gray-400">Уровень {request.level}</div>
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
                          alert('Функция отклонения будет добавлена');
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
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div>{getAvatarIcon(friend.avatar)}</div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold truncate">{friend.name}</h4>
                        <div className="text-sm text-gray-400">Уровень {friend.level}</div>
                        <div className={`text-xs ${friend.status === 'online' ? 'text-green-400' : 'text-gray-500'}`}>
                          {friend.status === 'online' ? '● В сети' : '○ Не в сети'}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        if (confirm(`Удалить ${friend.name} из друзей?`)) {
                          removeFriend(friend.id);
                        }
                      }}
                      className="text-red-400 hover:text-red-300 transition-colors p-2 hover:bg-red-900/20 rounded-lg"
                      title="Удалить из друзей"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    );
  };

  const AssignedQuestsTab = () => {
    const [showNewAssignedQuest, setShowNewAssignedQuest] = useState(false);
    const [assignedQuestType, setAssignedQuestType] = useState('rare');
    const [newAssignedQuest, setNewAssignedQuest] = useState({
      title: '',
      description: '',
      type: 'main',
      difficulty: 'rare',
      xp: 200,
      reward: '',
      bonus: '',
      dueDate: '',
      assignedTo: null,
      subtasks: []
    });
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
      if (!newAssignedQuest.title.trim()) {
        alert('Введите название квеста!');
        return;
      }
      
      if (!newAssignedQuest.assignedTo) {
        alert('Выберите друга!');
        return;
      }

      try {
        console.log('🎯 Creating assigned quest for friend:', newAssignedQuest.assignedTo);
        console.log('🎯 With subtasks:', newAssignedQuest.subtasks);
        
        const questData = {
          title: newAssignedQuest.title,
          description: newAssignedQuest.description,
          type: newAssignedQuest.type,
          difficulty: assignedQuestType,
          xp: assignedQuestType === 'rare' ? 200 : 500,
          reward: newAssignedQuest.reward,
          bonus: newAssignedQuest.bonus,
          due_date: newAssignedQuest.dueDate ? new Date(newAssignedQuest.dueDate).toISOString() : null,
          assigned_by: user.id,
          assigned_to: newAssignedQuest.assignedTo,
          created_by: user.id,
          total_steps: newAssignedQuest.subtasks.length || 1
        };

        const { data: createdQuest, error: questError } = await supabase
          .from('quests')
          .insert(questData)
          .select()
          .single();

        if (questError) {
          console.error('❌ Error creating quest:', questError);
          alert('Ошибка создания квеста: ' + questError.message);
          return;
        }

        console.log('✅ Assigned quest created:', createdQuest);

        if (newAssignedQuest.subtasks.length > 0) {
          const subtasksData = newAssignedQuest.subtasks.map((subtask, index) => ({
            quest_id: createdQuest.id,
            title: subtask.title,
            xp: subtask.xp || 50,
            order_index: index,
            completed: false
          }));

          console.log('📝 Creating assigned quest subtasks:', subtasksData);

          const { error: subtasksError } = await supabase
            .from('quest_subtasks')
            .insert(subtasksData);

          if (subtasksError) {
            console.error('❌ Error creating assigned subtasks:', subtasksError);
            alert('Ошибка создания подзадач: ' + subtasksError.message);
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
          xp: 200,
          reward: '',
          bonus: '',
          dueDate: '',
          assignedTo: null,
          subtasks: []
        });
        setShowNewAssignedQuest(false);
        setAssignedQuestType('rare');
        setShowAssignedSubtaskForm(false);

        await loadQuests();
        
        alert(`Квест успешно назначен для ${friendName}!`);

      } catch (error) {
        console.error('❌ Error in createAssignedQuest:', error);
        alert('Ошибка: ' + error.message);
      }
    };

    return (
      <div className="space-y-6">
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
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white mb-4"
              >
                <option value="">-- Выберите друга --</option>
                {friends.map(friend => (
                  <option key={friend.id} value={friend.id}>
                    {friend.name} (Уровень {friend.level})
                  </option>
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
                  <div className="text-xs text-gray-400 mt-1">Одиночная задача (200 XP)</div>
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
                  <div className="text-xs text-gray-400 mt-1">С подзадачами (500 XP)</div>
                </button>
              </div>
            </div>

            {/* Остальная часть формы создания квеста */}
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="date"
                    value={newAssignedQuest.dueDate ? newAssignedQuest.dueDate.split('T')[0] : ''}
                    onChange={(e) => {
                      const currentTime = newAssignedQuest.dueDate ? newAssignedQuest.dueDate.split('T')[1] || '23:59' : '23:59';
                      setNewAssignedQuest({ 
                        ...newAssignedQuest, 
                        dueDate: e.target.value ? `${e.target.value}T${currentTime}` : '' 
                      });
                    }}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-400"
                  />
                  <input
                    type="time"
                    value={newAssignedQuest.dueDate ? newAssignedQuest.dueDate.split('T')[1] || '23:59' : '23:59'}
                    onChange={(e) => {
                      const currentDate = newAssignedQuest.dueDate ? newAssignedQuest.dueDate.split('T')[0] : new Date().toISOString().split('T')[0];
                      setNewAssignedQuest({ 
                        ...newAssignedQuest, 
                        dueDate: `${currentDate}T${e.target.value}` 
                      });
                    }}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-400"
                  />
                </div>
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
                    xp: 200,
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

        {activeQuests.length > 0 && (
          <div>
            <h3 className="text-xl font-bold mb-4 text-yellow-400">Активные задания</h3>
            <div className="space-y-4">
              {activeQuests.map(quest => (
                <QuestCard key={quest.id} quest={quest} />
              ))}
            </div>
          </div>
        )}

        {completedQuests.length > 0 && (
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

  // Auth screen - УБРАНА ПОДПИСЬ О ПОЛНОЙ ВЕРСИИ
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
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

              {authMode === 'register' && (
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
              )}

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 px-4 py-2 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2"
              >
                {authMode === 'login' ? <LogIn className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                <span>{authMode === 'login' ? 'Войти' : 'Зарегистрироваться'}</span>
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
            </div>
          </div>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'dashboard', label: 'Главная', icon: Home },
    { id: 'my-quests', label: 'Мои задания', icon: ListChecks },
    { id: 'rewards', label: 'Награды', icon: Trophy },
    { id: 'assigned-quests', label: 'Поставленные задачи', icon: Send },
    { id: 'friends', label: 'Друзья', icon: Users }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
      {/* Header */}
      <div className="bg-black/50 backdrop-blur-sm border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Sword className="w-8 h-8 text-yellow-400" />
              <button
                onClick={() => setActiveTab('profile')}
                className="hidden sm:flex items-center space-x-2 bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700 px-4 py-2 rounded-lg transition-all duration-200 border border-gray-600 hover:border-gray-500"
              >
                <Mail className="w-4 h-4 text-blue-400" />
                <span className="text-white font-medium truncate max-w-[150px]">{currentUser.email}</span>
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
              {/* XP Progress - скрываем текст на мобильных */}
              <div className="text-right">
                <div className="text-xs sm:text-sm text-gray-400">Уровень {currentUser.level}</div>
                <div className="w-20 sm:w-32 h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-300"
                    style={{ width: `${(currentUser.xp / currentUser.xpToNext) * 100}%` }}
                  />
                </div>
                <div className="text-xs text-gray-500">{currentUser.xp}/{currentUser.xpToNext} XP</div>
              </div>
              
              {/* Achievements button */}
              <button
                onClick={() => setShowAchievements(true)}
                className="flex items-center space-x-1 sm:space-x-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 px-2 sm:px-4 py-2 rounded-lg transition-all duration-200 transform hover:scale-105"
              >
                <Trophy className="w-4 h-4" />
                <span className="text-sm">{currentUser.completedQuests}</span>
                <Zap className="w-4 h-4" />
                <span className="text-sm">{currentUser.totalXp}</span>
              </button>

              {/* Logout button */}
              <button
                onClick={handleLogout}
                className="flex items-center space-x-1 sm:space-x-2 bg-red-600 hover:bg-red-500 px-2 sm:px-3 py-2 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Выйти</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {mobileMenuOpen && (
        <div className="sm:hidden bg-gray-800/95 backdrop-blur-sm border-b border-gray-700">
          <div className="max-w-7xl mx-auto px-4 py-2">
            <div className="grid grid-cols-2 gap-2">
              {tabs.map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all relative ${
                      activeTab === tab.id
                        ? 'bg-gray-700 text-yellow-400'
                        : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-sm">{tab.label}</span>
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
      )}

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
                  className={`flex items-center space-x-2 px-4 py-3 rounded-t-lg transition-all relative ${
                    activeTab === tab.id
                      ? 'bg-gray-700 text-yellow-400 border-b-2 border-yellow-400'
                      : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
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
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <div className="bg-gray-800/50 rounded-xl p-4 sm:p-6">
              <h3 className="text-xl font-bold mb-4">Быстрые действия</h3>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <button
                  onClick={() => setActiveTab('my-quests')}
                  className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 rounded-lg p-4 transition-all"
                >
                  <ListChecks className="w-6 h-6 mb-2 mx-auto" />
                  <div className="text-sm">Мои квесты</div>
                </button>
                <button
                  onClick={() => setActiveTab('rewards')}
                  className="bg-gradient-to-r from-yellow-600 to-yellow-700 hover:from-yellow-500 hover:to-yellow-600 rounded-lg p-4 transition-all"
                >
                  <Trophy className="w-6 h-6 mb-2 mx-auto" />
                  <div className="text-sm">Награды</div>
                </button>
                <button
                  onClick={() => setActiveTab('friends')}
                  className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 rounded-lg p-4 transition-all"
                >
                  <Users className="w-6 h-6 mb-2 mx-auto" />
                  <div className="text-sm">Друзья</div>
                </button>
                <button
                  onClick={() => setShowAchievements(true)}
                  className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 rounded-lg p-4 transition-all"
                >
                  <Award className="w-6 h-6 mb-2 mx-auto" />
                  <div className="text-sm">Достижения</div>
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
                  onClick={() => setEditingProfile(!editingProfile)}
                  className="text-blue-400 hover:text-blue-300 transition-colors"
                >
                  {editingProfile ? <X className="w-5 h-5" /> : <Edit2 className="w-5 h-5" />}
                </button>
              </div>

              {!editingProfile ? (
                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <div>{getAvatarIcon(currentUser.avatar)}</div>
                    <div>
                      <h3 className="text-xl font-bold">{currentUser.name}</h3>
                      <div className="text-gray-400">Уровень {currentUser.level} • {currentUser.totalXp} XP</div>
                    </div>
                  </div>

                  <div className="space-y-3 mt-6">
                    <div className="flex items-center space-x-3">
                      <Mail className="w-5 h-5 text-gray-400" />
                      <span className="truncate">{currentUser.email}</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Lock className="w-5 h-5 text-gray-400" />
                      <span>••••••••</span>
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
        {activeTab === 'my-quests' && <MyQuestsTab />}
        {activeTab === 'friends' && <FriendsTab />}
        {activeTab === 'assigned-quests' && <AssignedQuestsTab />}
      </div>

      {/* Achievements Modal */}
      {showAchievements && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-600 rounded-xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
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
                {achievements.map(achievement => (
                  <div
                    key={achievement.id}
                    className={`bg-gradient-to-r ${
                      achievement.unlocked
                        ? 'from-yellow-900/20 to-orange-900/20 border-yellow-400/30'
                        : 'from-gray-700/30 to-gray-800/30 border-gray-600'
                    } border rounded-lg p-4`}
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
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuestTaskManager;