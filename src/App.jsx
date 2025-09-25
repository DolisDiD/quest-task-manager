import React, { useState, useEffect } from 'react';
import { Plus, Trophy, CheckCircle, Clock, Eye, EyeOff, Star, Gift, Target } from 'lucide-react';

const App = () => {
  const [activeTab, setActiveTab] = useState('myTasks');
  const [tasks, setTasks] = useState([]);
  const [assignedTasks, setAssignedTasks] = useState([]);
  const [rewards, setRewards] = useState([]);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [showRewardForm, setShowRewardForm] = useState(false);
  
  // Состояния для подвкладок
  const [myTasksSubTab, setMyTasksSubTab] = useState('inProgress');
  const [rewardsSubTab, setRewardsSubTab] = useState('available');
  const [assignedTasksSubTab, setAssignedTasksSubTab] = useState('inProgress');
  
  // Состояния для скрытия завершенных элементов
  const [hideCompletedMyTasks, setHideCompletedMyTasks] = useState(false);
  const [hideClaimedRewards, setHideClaimedRewards] = useState(false);
  const [hideCompletedAssignedTasks, setHideCompletedAssignedTasks] = useState(false);

  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    points: 10,
    assignedTo: ''
  });

  const [newReward, setNewReward] = useState({
    title: '',
    description: '',
    cost: 50
  });

  // Загрузка данных из localStorage
  useEffect(() => {
    const savedTasks = localStorage.getItem('questTasks');
    const savedAssignedTasks = localStorage.getItem('questAssignedTasks');
    const savedRewards = localStorage.getItem('questRewards');
    
    if (savedTasks) setTasks(JSON.parse(savedTasks));
    if (savedAssignedTasks) setAssignedTasks(JSON.parse(savedAssignedTasks));
    if (savedRewards) setRewards(JSON.parse(savedRewards));
  }, []);

  // Сохранение в localStorage
  useEffect(() => {
    localStorage.setItem('questTasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('questAssignedTasks', JSON.stringify(assignedTasks));
  }, [assignedTasks]);

  useEffect(() => {
    localStorage.setItem('questRewards', JSON.stringify(rewards));
  }, [rewards]);

  const addTask = () => {
    if (newTask.title.trim()) {
      const task = {
        id: Date.now(),
        ...newTask,
        completed: false,
        createdAt: new Date().toISOString()
      };
      setTasks([...tasks, task]);
      setNewTask({ title: '', description: '', points: 10, assignedTo: '' });
      setShowTaskForm(false);
    }
  };

  const addReward = () => {
    if (newReward.title.trim()) {
      const reward = {
        id: Date.now(),
        ...newReward,
        claimed: false,
        createdAt: new Date().toISOString()
      };
      setRewards([...rewards, reward]);
      setNewReward({ title: '', description: '', cost: 50 });
      setShowRewardForm(false);
    }
  };

  const toggleTaskComplete = (taskId) => {
    setTasks(tasks.map(task => 
      task.id === taskId ? { ...task, completed: !task.completed } : task
    ));
  };

  const toggleAssignedTaskComplete = (taskId) => {
    setAssignedTasks(assignedTasks.map(task => 
      task.id === taskId ? { ...task, completed: !task.completed } : task
    ));
  };

  const claimReward = (rewardId) => {
    setRewards(rewards.map(reward => 
      reward.id === rewardId ? { ...reward, claimed: true } : reward
    ));
  };

  const deleteTask = (taskId) => {
    setTasks(tasks.filter(task => task.id !== taskId));
  };

  const deleteAssignedTask = (taskId) => {
    setAssignedTasks(assignedTasks.filter(task => task.id !== taskId));
  };

  const deleteReward = (rewardId) => {
    setRewards(rewards.filter(reward => reward.id !== rewardId));
  };

  // Функции для фильтрации данных
  const getFilteredMyTasks = () => {
    if (myTasksSubTab === 'inProgress') {
      return tasks.filter(task => !task.completed);
    } else {
      return hideCompletedMyTasks ? [] : tasks.filter(task => task.completed);
    }
  };

  const getFilteredRewards = () => {
    if (rewardsSubTab === 'available') {
      return rewards.filter(reward => !reward.claimed);
    } else {
      return hideClaimedRewards ? [] : rewards.filter(reward => reward.claimed);
    }
  };

  const getFilteredAssignedTasks = () => {
    if (assignedTasksSubTab === 'inProgress') {
      return assignedTasks.filter(task => !task.completed);
    } else {
      return hideCompletedAssignedTasks ? [] : assignedTasks.filter(task => task.completed);
    }
  };

  // Компонент подвкладок
  const SubTabs = ({ activeSubTab, setActiveSubTab, tabs, hideCompleted, setHideCompleted }) => (
    <div className="flex items-center justify-between mb-4 bg-gray-50 p-2 rounded-lg">
      <div className="flex space-x-1">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeSubTab === tab.id
                ? 'bg-blue-500 text-white'
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {tabs.find(tab => tab.id === activeSubTab)?.canHide && (
        <button
          onClick={() => setHideCompleted(!hideCompleted)}
          className="flex items-center space-x-1 px-3 py-1 text-sm text-gray-600 hover:text-gray-800 bg-white rounded border"
        >
          {hideCompleted ? <Eye size={16} /> : <EyeOff size={16} />}
          <span>{hideCompleted ? 'Показать' : 'Скрыть'}</span>
        </button>
      )}
    </div>
  );

  const renderMyTasks = () => {
    const myTasksTabs = [
      { id: 'inProgress', label: 'Выполняю', canHide: false },
      { id: 'completed', label: 'Выполнено', canHide: true }
    ];

    const filteredTasks = getFilteredMyTasks();

    return (
      <div>
        <SubTabs
          activeSubTab={myTasksSubTab}
          setActiveSubTab={setMyTasksSubTab}
          tabs={myTasksTabs}
          hideCompleted={hideCompletedMyTasks}
          setHideCompleted={setHideCompletedMyTasks}
        />
        
        <div className="space-y-4">
          {filteredTasks.map(task => (
            <div key={task.id} className="bg-white p-4 rounded-lg shadow border">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className={`font-semibold ${task.completed ? 'line-through text-gray-500' : 'text-gray-800'}`}>
                    {task.title}
                  </h3>
                  {task.description && (
                    <p className={`text-sm mt-1 ${task.completed ? 'text-gray-400' : 'text-gray-600'}`}>
                      {task.description}
                    </p>
                  )}
                  <div className="flex items-center mt-2 space-x-4">
                    <span className="flex items-center text-sm text-blue-600">
                      <Star size={16} className="mr-1" />
                      {task.points} очков
                    </span>
                    {task.assignedTo && (
                      <span className="text-sm text-gray-500">
                        Назначено: {task.assignedTo}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2 ml-4">
                  <button
                    onClick={() => toggleTaskComplete(task.id)}
                    className={`p-2 rounded-full ${
                      task.completed 
                        ? 'bg-green-100 text-green-600' 
                        : 'bg-gray-100 text-gray-400 hover:bg-green-100 hover:text-green-600'
                    }`}
                  >
                    <CheckCircle size={20} />
                  </button>
                  <button
                    onClick={() => deleteTask(task.id)}
                    className="p-2 rounded-full bg-red-100 text-red-600 hover:bg-red-200"
                  >
                    ×
                  </button>
                </div>
              </div>
            </div>
          ))}
          
          {filteredTasks.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              {myTasksSubTab === 'inProgress' ? 'Нет активных задач' : 'Нет выполненных задач'}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderRewards = () => {
    const rewardsTabs = [
      { id: 'available', label: 'К получению', canHide: false },
      { id: 'claimed', label: 'Получены', canHide: true }
    ];

    const filteredRewards = getFilteredRewards();

    return (
      <div>
        <SubTabs
          activeSubTab={rewardsSubTab}
          setActiveSubTab={setRewardsSubTab}
          tabs={rewardsTabs}
          hideCompleted={hideClaimedRewards}
          setHideCompleted={setHideClaimedRewards}
        />
        
        <div className="space-y-4">
          {filteredRewards.map(reward => (
            <div key={reward.id} className="bg-white p-4 rounded-lg shadow border">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className={`font-semibold ${reward.claimed ? 'line-through text-gray-500' : 'text-gray-800'}`}>
                    {reward.title}
                  </h3>
                  {reward.description && (
                    <p className={`text-sm mt-1 ${reward.claimed ? 'text-gray-400' : 'text-gray-600'}`}>
                      {reward.description}
                    </p>
                  )}
                  <div className="flex items-center mt-2">
                    <span className="flex items-center text-sm text-purple-600">
                      <Gift size={16} className="mr-1" />
                      {reward.cost} очков
                    </span>
                  </div>
                </div>
                <div className="flex items-center space-x-2 ml-4">
                  {!reward.claimed && (
                    <button
                      onClick={() => claimReward(reward.id)}
                      className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 text-sm"
                    >
                      Получить
                    </button>
                  )}
                  {reward.claimed && (
                    <span className="px-4 py-2 bg-green-100 text-green-600 rounded-lg text-sm">
                      Получено
                    </span>
                  )}
                  <button
                    onClick={() => deleteReward(reward.id)}
                    className="p-2 rounded-full bg-red-100 text-red-600 hover:bg-red-200"
                  >
                    ×
                  </button>
                </div>
              </div>
            </div>
          ))}
          
          {filteredRewards.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              {rewardsSubTab === 'available' ? 'Нет доступных наград' : 'Нет полученных наград'}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderAssignedTasks = () => {
    const assignedTasksTabs = [
      { id: 'inProgress', label: 'На выполнении', canHide: false },
      { id: 'completed', label: 'Выполнено', canHide: true }
    ];

    const filteredTasks = getFilteredAssignedTasks();

    return (
      <div>
        <SubTabs
          activeSubTab={assignedTasksSubTab}
          setActiveSubTab={setAssignedTasksSubTab}
          tabs={assignedTasksTabs}
          hideCompleted={hideCompletedAssignedTasks}
          setHideCompleted={setHideCompletedAssignedTasks}
        />
        
        <div className="space-y-4">
          {filteredTasks.map(task => (
            <div key={task.id} className="bg-white p-4 rounded-lg shadow border">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className={`font-semibold ${task.completed ? 'line-through text-gray-500' : 'text-gray-800'}`}>
                    {task.title}
                  </h3>
                  {task.description && (
                    <p className={`text-sm mt-1 ${task.completed ? 'text-gray-400' : 'text-gray-600'}`}>
                      {task.description}
                    </p>
                  )}
                  <div className="flex items-center mt-2 space-x-4">
                    <span className="flex items-center text-sm text-blue-600">
                      <Star size={16} className="mr-1" />
                      {task.points} очков
                    </span>
                    {task.assignedTo && (
                      <span className="text-sm text-gray-500">
                        Назначено: {task.assignedTo}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2 ml-4">
                  <button
                    onClick={() => toggleAssignedTaskComplete(task.id)}
                    className={`p-2 rounded-full ${
                      task.completed 
                        ? 'bg-green-100 text-green-600' 
                        : 'bg-gray-100 text-gray-400 hover:bg-green-100 hover:text-green-600'
                    }`}
                  >
                    <CheckCircle size={20} />
                  </button>
                  <button
                    onClick={() => deleteAssignedTask(task.id)}
                    className="p-2 rounded-full bg-red-100 text-red-600 hover:bg-red-200"
                  >
                    ×
                  </button>
                </div>
              </div>
            </div>
          ))}
          
          {filteredTasks.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              {assignedTasksSubTab === 'inProgress' ? 'Нет активных поставленных задач' : 'Нет выполненных поставленных задач'}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-4xl mx-auto p-6">
        <header className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Quest Manager</h1>
          <p className="text-gray-600">Управляй задачами как квестами в игре</p>
        </header>

        {/* Основные вкладки */}
        <div className="flex justify-center mb-8">
          <div className="flex bg-white rounded-lg shadow p-1">
            <button
              onClick={() => setActiveTab('myTasks')}
              className={`flex items-center px-6 py-3 rounded-md font-medium transition-colors ${
                activeTab === 'myTasks'
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <Target size={20} className="mr-2" />
              Мои задания
            </button>
            <button
              onClick={() => setActiveTab('rewards')}
              className={`flex items-center px-6 py-3 rounded-md font-medium transition-colors ${
                activeTab === 'rewards'
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <Trophy size={20} className="mr-2" />
              Награды
            </button>
            <button
              onClick={() => setActiveTab('assignedTasks')}
              className={`flex items-center px-6 py-3 rounded-md font-medium transition-colors ${
                activeTab === 'assignedTasks'
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <Clock size={20} className="mr-2" />
              Поставленные задачи
            </button>
          </div>
        </div>

        {/* Кнопки добавления */}
        <div className="flex justify-center mb-6 space-x-4">
          {(activeTab === 'myTasks' || activeTab === 'assignedTasks') && (
            <button
              onClick={() => setShowTaskForm(true)}
              className="flex items-center px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
            >
              <Plus size={20} className="mr-2" />
              Добавить задачу
            </button>
          )}
          {activeTab === 'rewards' && (
            <button
              onClick={() => setShowRewardForm(true)}
              className="flex items-center px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600"
            >
              <Plus size={20} className="mr-2" />
              Добавить награду
            </button>
          )}
        </div>

        {/* Контент вкладок */}
        <div className="bg-gray-50 rounded-lg p-6">
          {activeTab === 'myTasks' && renderMyTasks()}
          {activeTab === 'rewards' && renderRewards()}
          {activeTab === 'assignedTasks' && renderAssignedTasks()}
        </div>

        {/* Модальные окна */}
        {showTaskForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-bold mb-4">Добавить новую задачу</h2>
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Название задачи"
                  value={newTask.title}
                  onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                  className="w-full p-3 border rounded-lg"
                />
                <textarea
                  placeholder="Описание задачи"
                  value={newTask.description}
                  onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                  className="w-full p-3 border rounded-lg h-24"
                />
                <input
                  type="number"
                  placeholder="Очки за выполнение"
                  value={newTask.points}
                  onChange={(e) => setNewTask({...newTask, points: parseInt(e.target.value) || 0})}
                  className="w-full p-3 border rounded-lg"
                />
                <input
                  type="text"
                  placeholder="Кому назначено (необязательно)"
                  value={newTask.assignedTo}
                  onChange={(e) => setNewTask({...newTask, assignedTo: e.target.value})}
                  className="w-full p-3 border rounded-lg"
                />
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowTaskForm(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Отмена
                </button>
                <button
                  onClick={addTask}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                  Добавить
                </button>
              </div>
            </div>
          </div>
        )}

        {showRewardForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-bold mb-4">Добавить новую награду</h2>
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Название награды"
                  value={newReward.title}
                  onChange={(e) => setNewReward({...newReward, title: e.target.value})}
                  className="w-full p-3 border rounded-lg"
                />
                <textarea
                  placeholder="Описание награды"
                  value={newReward.description}
                  onChange={(e) => setNewReward({...newReward, description: e.target.value})}
                  className="w-full p-3 border rounded-lg h-24"
                />
                <input
                  type="number"
                  placeholder="Стоимость в очках"
                  value={newReward.cost}
                  onChange={(e) => setNewReward({...newReward, cost: parseInt(e.target.value) || 0})}
                  className="w-full p-3 border rounded-lg"
                />
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowRewardForm(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Отмена
                </button>
                <button
                  onClick={addReward}
                  className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600"
                >
                  Добавить
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;