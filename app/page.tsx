'use client';

import { useEffect, useState } from 'react';
import { useAppStore } from '../store/appState';
import AuthButton from '../components/AuthButton';
import TaskList from '../components/TaskList';
import AddTaskModal from '../components/AddTaskModal';
import ReflectionCard from '../components/ReflectionCard';
import RewardTree from '../components/RewardTree';
import StreakCard from '../components/StreakCard';
import { ThemeToggle } from '../components/ThemeToggle';
import { aiPlanner } from '../lib/aiPlanner';
import { Task, Reflection } from '../lib/db';
import type { AIPlan, AITaskSuggestion } from '../lib/aiPlanner';
import { ChevronRight, Sparkles, Zap, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Home() {
  const {
    user,
    tasks,
    filteredTasks,
    todayReflection,
    isAddTaskModalOpen,
    setAddTaskModalOpen,
    addReflection,
    getTodayReflection,
    toggleTaskCompletion,
    deleteTask,
    loadUserData,
    currentStreak,
  } = useAppStore();

  const [aiPlan, setAiPlan] = useState<AIPlan | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [activeTab, setActiveTab] = useState<'tasks' | 'plan' | 'reflection'>('tasks');
  const [isLoadingPlan, setIsLoadingPlan] = useState(false);

  const loadAIPlan = async () => {
    if (!user) return;
    
    setIsLoadingPlan(true);
    try {
      const plan = await aiPlanner.getTodayPlan(user.id);
      if (!plan) {
        const newPlan = await aiPlanner.generateDailyPlan(user.id);
        setAiPlan(newPlan);
      } else {
        setAiPlan(plan);
      }
    } catch (error) {
      console.error('Error loading AI plan:', error);
    } finally {
      setIsLoadingPlan(false);
    }
  };

  // Re-initialize encryption key when user is restored from storage on page load
  useEffect(() => {
    if (user) {
      // Restore encryption key from stored user if it exists
      const initializeEncryptionKey = async () => {
        try {
          const { encryptionService } = await import('../lib/encrypt');
          const { db } = await import('../lib/db');
          
          // Fetch the user from DB to get their stored encrypted key
          const storedUser = await db.users.get(user.id);
          if (storedUser && storedUser.encryptedKey) {
            // Reconstruct the encryption key from the stored encrypted key
            const keyBuffer = Uint8Array.from(
              atob(storedUser.encryptedKey),
              (c: string) => c.charCodeAt(0)
            );
            const arrayBuffer = new Uint8Array(keyBuffer).buffer;
            const encryptionKey = await encryptionService.importKey(arrayBuffer);
            encryptionService.setUserKey(encryptionKey);
          }
          
          // Now that key is initialized, load user data and AI plan
          await loadUserData();
          await loadAIPlan();
        } catch (error) {
          console.error('Error initializing encryption key:', error);
        }
      };
      
      initializeEncryptionKey();
    }
  }, [user, loadUserData]);

  const handleAddTask = () => {
    setEditingTask(null);
    setAddTaskModalOpen(true);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setAddTaskModalOpen(true);
  };

  const handleSaveReflection = async (reflectionData: Omit<Reflection, 'id' | 'userId' | 'encryptedData'>) => {
    if (!user) return;
    
    try {
      await addReflection(reflectionData);
      await loadAIPlan();
    } catch (error) {
      console.error('Error saving reflection:', error);
    }
  };

  const handleToggleComplete = async (taskId: string) => {
    try {
      await toggleTaskCompletion(taskId);
      await loadAIPlan();
    } catch (error) {
      console.error('Error toggling task completion:', error);
    }
  };

  // 🎨 Auth Screen - Futuristic Gradient & Glass
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-cyan-50 dark:from-slate-950 dark:via-purple-950 dark:to-slate-900 flex items-center justify-center px-4 overflow-hidden">
        {/* Animated background blobs */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-400/20 dark:bg-purple-600/10 rounded-full blur-3xl animate-blob" />
          <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-cyan-400/20 dark:bg-cyan-600/10 rounded-full blur-3xl animate-blob animation-delay-2000" />
          <div className="absolute -bottom-1/4 left-1/3 w-80 h-80 bg-blue-400/20 dark:bg-blue-600/10 rounded-full blur-3xl animate-blob animation-delay-4000" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative z-10 max-w-md w-full"
        >
          {/* Glass card */}
          <div className="glass rounded-3xl p-8 backdrop-blur-2xl">
            {/* Header */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-center mb-8"
            >
              <div className="text-5xl mb-4">🧠</div>
              <h1 className="text-4xl font-bold gradient-ai bg-clip-text text-transparent mb-2">
                DailyAITracker
              </h1>
              <p className="text-foreground/60 text-sm leading-relaxed">
                Your intelligent companion for AI-powered daily planning, task tracking, and habit building
              </p>
            </motion.div>

            {/* Auth button */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="mb-6"
            >
              <AuthButton />
            </motion.div>

            {/* Features grid */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="space-y-3 pt-6 border-t border-white/20 dark:border-white/10"
            >
              <div className="flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-sm text-foreground">AI-Powered Planning</div>
                  <div className="text-xs text-foreground/50">Smart daily insights</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Zap className="w-5 h-5 text-cyan-500 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-sm text-foreground">Local-First Privacy</div>
                  <div className="text-xs text-foreground/50">Your data stays with you</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <TrendingUp className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-sm text-foreground">Growth Focused</div>
                  <div className="text-xs text-foreground/50">Build better habits</div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Footer text */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-center text-xs text-foreground/40 mt-6"
          >
            Secure • Open Source • Built for You
          </motion.p>
        </motion.div>
      </div>
    );
  }

  // 🎯 Dashboard - Futuristic AI-Inspired Design
  return (
    <div className="min-h-screen bg-background transition-colors duration-300">
      {/* Header with gradient */}
      <header className="sticky top-0 z-50 border-b border-border/50 backdrop-blur-xl bg-background/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-3xl">🧠</div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">DailyAITracker</h1>
                <p className="text-sm text-foreground/60">
                  Welcome, {user?.email?.split('@')[0]}! Ready for a productive day?
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <AuthButton />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Quick Stats Row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          {/* Productivity Score */}
          <div className="card-hover p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-foreground/60 text-sm font-medium">Productivity Score</span>
              <TrendingUp className="w-4 h-4 text-cyan-500" />
            </div>
            <div className="text-4xl font-bold gradient-ai bg-clip-text text-transparent">
              {Math.round((tasks.filter(t => t.completed).length / Math.max(tasks.length, 1)) * 100)}%
            </div>
            <p className="text-xs text-foreground/50 mt-1">
              {tasks.filter(t => t.completed).length} of {tasks.length} tasks
            </p>
          </div>

          {/* Current Streak */}
          <div className="card-hover p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-foreground/60 text-sm font-medium">Current Streak</span>
              <Zap className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-4xl font-bold text-amber-500">{currentStreak}</div>
            <p className="text-xs text-foreground/50 mt-1">days in a row 🔥</p>
          </div>

          {/* Today's Status */}
          <div className="card-hover p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-foreground/60 text-sm font-medium">Today&apos;s Status</span>
              <Sparkles className="w-4 h-4 text-purple-500" />
            </div>
            <div className="text-4xl font-bold">
              {todayReflection ? '✅' : '📝'}
            </div>
            <p className="text-xs text-foreground/50 mt-1">
              {todayReflection ? 'Reflection completed' : 'Add your reflection'}
            </p>
          </div>
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Tasks & Plans */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-2 space-y-6"
          >
            {/* Tabs */}
            <div className="flex gap-2 p-1.5 bg-card border border-border rounded-2xl">
              {[
                { id: 'tasks' as const, label: '📝 Tasks', icon: '📝' },
                { id: 'plan' as const, label: '🤖 AI Plan', icon: '🤖' },
                { id: 'reflection' as const, label: '✨ Reflection', icon: '✨' },
              ].map((tab) => (
                <motion.button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`flex-1 py-2.5 px-3 rounded-xl text-sm font-semibold transition-all duration-300 ${
                    activeTab === tab.id
                      ? 'bg-gradient-ai text-white shadow-md'
                      : 'text-foreground/60 hover:text-foreground hover:bg-background'
                  }`}
                >
                  {tab.label}
                </motion.button>
              ))}
            </div>

            {/* Tasks Tab */}
            {activeTab === 'tasks' && (
              <motion.div
                key="tasks"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="card p-6"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                    <span>📋</span> Today&apos;s Tasks
                  </h2>
                  <motion.button
                    onClick={handleAddTask}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="btn-primary"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Add Task</span>
                  </motion.button>
                </div>
                
                {filteredTasks.length > 0 ? (
                  <TaskList
                    tasks={filteredTasks}
                    onToggleComplete={handleToggleComplete}
                    onEdit={handleEditTask}
                    onDelete={deleteTask}
                  />
                ) : (
                  <div className="text-center py-12 text-foreground/50">
                    <div className="text-5xl mb-3">🎉</div>
                    <p className="text-sm">No tasks yet! Add one to get started.</p>
                  </div>
                )}
              </motion.div>
            )}

            {/* AI Plan Tab */}
            {activeTab === 'plan' && (
              <motion.div
                key="plan"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="card p-6"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-gradient-ai flex items-center justify-center text-white font-bold">
                    🤖
                  </div>
                  <h2 className="text-xl font-bold text-foreground">Your AI-Powered Plan</h2>
                </div>

                {isLoadingPlan ? (
                  <div className="text-center py-12">
                    <div className="inline-block">
                      <div className="w-8 h-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
                    </div>
                    <p className="text-foreground/60 mt-3">Generating your plan...</p>
                  </div>
                ) : aiPlan ? (
                  <div className="space-y-6">
                    {/* Focus Area */}
                    <div className="glass rounded-2xl p-6 backdrop-blur-xl">
                      <p className="text-xs text-primary font-bold uppercase tracking-widest mb-2">Focus Area</p>
                      <h3 className="text-lg font-bold text-foreground mb-3">{aiPlan.focusArea}</h3>
                      <p className="text-sm text-foreground/70 italic border-l-2 border-primary/30 pl-4">
                        &ldquo;{aiPlan.motivationalQuote}&rdquo;
                      </p>
                    </div>

                    {/* Recommended Tasks */}
                    <div>
                      <h4 className="font-bold text-foreground mb-4">Recommended Tasks</h4>
                      <div className="space-y-3">
                        {aiPlan.tasks.map((task: AITaskSuggestion, index: number) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="card-hover p-4 border-l-2 border-secondary"
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <h5 className="font-semibold text-foreground">{task.title}</h5>
                                <p className="text-sm text-foreground/60 mt-1">{task.reason}</p>
                                {task.estimatedTime && (
                                  <p className="text-xs text-foreground/50 mt-2 flex items-center gap-1">
                                    ⏱️ {task.estimatedTime}
                                  </p>
                                )}
                              </div>
                              <span className="badge-secondary flex-shrink-0">{task.category}</span>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>

                    {/* Insights */}
                    {aiPlan.insights && (
                      <div className="glass rounded-2xl p-6 backdrop-blur-xl">
                        <h4 className="font-bold text-foreground mb-4 flex items-center gap-2">
                          <Sparkles className="w-5 h-5 text-amber-500" />
                          Key Insights
                        </h4>
                        <ul className="space-y-2">
                          {aiPlan.insights.map((insight: string, index: number) => (
                            <li key={index} className="text-sm text-foreground/70 flex items-start gap-2">
                              <span className="text-amber-500 flex-shrink-0">💡</span>
                              <span>{insight}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12 text-foreground/50">
                    <div className="text-5xl mb-3">🤔</div>
                    <p className="text-sm mb-4">No AI plan available yet.</p>
                    <motion.button
                      onClick={loadAIPlan}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="btn-secondary"
                    >
                      <Sparkles className="w-4 h-4" />
                      Generate Plan
                    </motion.button>
                  </div>
                )}
              </motion.div>
            )}

            {/* Reflection Tab */}
            {activeTab === 'reflection' && (
              <motion.div
                key="reflection"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <ReflectionCard
                  reflection={todayReflection}
                  onSave={handleSaveReflection}
                />
              </motion.div>
            )}
          </motion.div>

          {/* Right Column - Rewards & Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-6"
          >
            <RewardTree
              streak={currentStreak}
              completedTasks={tasks.filter(t => t.completed).length}
            />
            
            <StreakCard />
          </motion.div>
        </div>
      </main>

      {/* Modals */}
      <AddTaskModal
        isOpen={isAddTaskModalOpen}
        onClose={() => {
          setAddTaskModalOpen(false);
          setEditingTask(null);
        }}
        editTask={editingTask}
      />
    </div>
  );
} 