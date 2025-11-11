import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { db, type User, type Task, type Reflection, type Behavior, type Streak } from '../lib/db';
import { encryptionService } from '../lib/encrypt';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setIsLoading: (loading: boolean) => void;
  loadUserData: () => Promise<void>;
}

interface TaskState {
  tasks: Task[];
  filteredTasks: Task[];
  selectedDate: Date;
  addTask: (taskData: Omit<Task, 'id' | 'userId' | 'encryptedData' | 'createdAt'>) => Promise<void>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  toggleTaskCompletion: (id: string) => Promise<void>;
  filterTasksByCategory: (category: Task['category'] | 'all') => void;
  filterTasksByDate: (date: Date) => void;
  loadTasks: () => Promise<void>;
}

interface ReflectionState {
  reflections: Reflection[];
  todayReflection: Reflection | null;
  addReflection: (reflectionData: Omit<Reflection, 'id' | 'userId' | 'encryptedData'>) => Promise<void>;
  updateReflection: (id: string, updates: Partial<Reflection>) => Promise<void>;
  getTodayReflection: () => Promise<void>;
}

interface BehaviorState {
  logBehavior: (type: Behavior['type'], action: string, data?: any) => Promise<void>;
}

interface StreakState {
  streaks: Streak[];
  currentStreak: number;
  updateStreak: (habitType: string, completed: boolean) => Promise<void>;
  getCurrentStreak: () => Promise<void>;
}

interface UIState {
  isAddTaskModalOpen: boolean;
  isReflectionModalOpen: boolean;
  theme: 'light' | 'dark';
  setAddTaskModalOpen: (open: boolean) => void;
  setReflectionModalOpen: (open: boolean) => void;
  toggleTheme: () => void;
}

type AppState = AuthState & TaskState & ReflectionState & BehaviorState & StreakState & UIState;

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Auth State
      user: null,
      isAuthenticated: false,
      isLoading: false,
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setIsLoading: (isLoading) => set({ isLoading }),

      loadUserData: async () => {
        const { user } = get();
        if (!user) return;

        try {
          await get().loadTasks();
          await get().getTodayReflection();
        } catch (error) {
          console.error('Error loading user data:', error);
        }
      },

      // Task State
      tasks: [],
      filteredTasks: [],
      selectedDate: new Date(),

      loadTasks: async () => {
        const { user } = get();
        if (!user) return;

        try {
          const tasks = await db.tasks
            .where('userId')
            .equals(user.id)
            .toArray();
          
          set({ tasks, filteredTasks: tasks });
        } catch (error) {
          console.error('Error loading tasks:', error);
        }
      },

      addTask: async (taskData) => {
        const { user } = get();
        if (!user) throw new Error('User not authenticated');

        try {
          const encryptedData = await encryptionService.encryptUserData({
            title: taskData.title,
            category: taskData.category,
            scheduledTime: taskData.scheduledTime,
          });

          // Create full Task object including id before adding to Dexie.
          const id = crypto.randomUUID();
          const taskToAdd: Task = {
            id,
            userId: user.id,
            title: taskData.title,
            category: taskData.category,
            scheduledTime: taskData.scheduledTime,
            completed: false,
            createdAt: new Date(),
            encryptedData,
          };

          await db.tasks.add(taskToAdd);

          set((state) => ({
            tasks: [...state.tasks, taskToAdd],
            filteredTasks: [...state.filteredTasks, taskToAdd],
          }));

          get().logBehavior('task_add', `Added task: ${taskData.title}`);
        } catch (error) {
          console.error('Error adding task:', error);
          throw error;
        }
      },

      updateTask: async (id, updates) => {
        try {
          await db.tasks.update(id, updates);
          set((state) => ({
            tasks: state.tasks.map(task => task.id === id ? { ...task, ...updates } : task),
            filteredTasks: state.filteredTasks.map(task => task.id === id ? { ...task, ...updates } : task),
          }));
        } catch (error) {
          console.error('Error updating task:', error);
          throw error;
        }
      },

      deleteTask: async (id) => {
        try {
          await db.tasks.delete(id);
          set((state) => ({
            tasks: state.tasks.filter(task => task.id !== id),
            filteredTasks: state.filteredTasks.filter(task => task.id !== id),
          }));
          get().logBehavior('task_delete', `Deleted task: ${id}`);
        } catch (error) {
          console.error('Error deleting task:', error);
          throw error;
        }
      },

      toggleTaskCompletion: async (id) => {
        const task = get().tasks.find(t => t.id === id);
        if (!task) return;

        const updates = {
          completed: !task.completed,
          completedAt: !task.completed ? new Date() : undefined,
        };

        await get().updateTask(id, updates);
        
        const action = updates.completed ? 'task_complete' : 'task_uncomplete';
        get().logBehavior(action, `Task ${updates.completed ? 'completed' : 'uncompleted'}: ${task.title}`);
        
        if (updates.completed) {
          get().updateStreak('daily_tasks', true);
        }
      },

      filterTasksByCategory: (category) => {
        const { tasks } = get();
        if (category === 'all') {
          set({ filteredTasks: tasks });
        } else {
          set({ filteredTasks: tasks.filter(task => task.category === category) });
        }
      },

      filterTasksByDate: (date) => {
        set({ selectedDate: date });
      },

      // Reflection State
      reflections: [],
      todayReflection: null,

      addReflection: async (reflectionData) => {
        const { user } = get();
        if (!user) throw new Error('User not authenticated');

        try {
          const encryptedData = await encryptionService.encryptUserData({
            mood: reflectionData.mood,
            text: reflectionData.text,
          });

          const id = crypto.randomUUID();
          const reflection: Reflection = {
            id,
            userId: user.id,
            date: reflectionData.date,
            mood: reflectionData.mood,
            text: reflectionData.text,
            encryptedData,
          };

          await db.reflections.add(reflection);
          
          set((state) => ({
            reflections: [...state.reflections, reflection],
            todayReflection: reflection,
          }));

          get().logBehavior('reflection_add', 'Added daily reflection');
        } catch (error) {
          console.error('Error adding reflection:', error);
          throw error;
        }
      },

      updateReflection: async (id, updates) => {
        try {
          await db.reflections.update(id, updates);
          set((state) => ({
            reflections: state.reflections.map(ref => ref.id === id ? { ...ref, ...updates } : ref),
            todayReflection: state.todayReflection?.id === id ? { ...state.todayReflection, ...updates } : state.todayReflection,
          }));
        } catch (error) {
          console.error('Error updating reflection:', error);
          throw error;
        }
      },

      getTodayReflection: async () => {
        const { user } = get();
        if (!user) return;

        try {
          const today = new Date().toISOString().split('T')[0];
          const reflection = await db.reflections
            .where('date')
            .equals(today)
            .and(r => r.userId === user.id)
            .first();

          set({ todayReflection: reflection || null });
        } catch (error) {
          console.error('Error getting today reflection:', error);
        }
      },

      // Behavior State
      logBehavior: async (type, action, data = {}) => {
        const { user } = get();
        if (!user) return;

        try {
          const encryptedData = await encryptionService.encryptUserData(data);

          const behavior: Omit<Behavior, 'id'> = {
            userId: user.id,
            type,
            action,
            timestamp: new Date(),
            encryptedData,
          };

          await db.behaviors.add({ id: crypto.randomUUID(), ...behavior } as Behavior);
        } catch (error) {
          console.error('Error logging behavior:', error);
        }
      },

      // Streak State
      streaks: [],
      currentStreak: 0,

      updateStreak: async (habitType, completed) => {
        const { user } = get();
        if (!user) return;

        // Basic streak implementation
        try {
          const today = new Date().toISOString().split('T')[0];
          let streak = await db.streaks
            .where('habitType')
            .equals(habitType)
            .and(s => s.userId === user.id)
            .first();

          if (!streak) {
            streak = {
              id: crypto.randomUUID(),
              userId: user.id,
              habitType,
              startDate: new Date(),
              currentCount: completed ? 1 : 0,
              longestCount: completed ? 1 : 0,
              lastUpdated: new Date(),
            };
            await db.streaks.add(streak);
          } else {
            const lastUpdated = new Date(streak.lastUpdated);
            const today = new Date();
            
            if (lastUpdated.toDateString() === today.toDateString()) {
              // Already updated today
              return;
            }

            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);

            if (lastUpdated.toDateString() === yesterday.toDateString() && completed) {
              // Consecutive day
              streak.currentCount += 1;
            } else if (completed) {
              // New streak
              streak.currentCount = 1;
            } else {
              // Broken streak
              streak.currentCount = 0;
            }

            streak.longestCount = Math.max(streak.longestCount, streak.currentCount);
            streak.lastUpdated = new Date();

            await db.streaks.update(streak.id, streak);
          }

          // Update store
          const streaks = await db.streaks
            .where('userId')
            .equals(user.id)
            .toArray();
          
          set({ streaks, currentStreak: streak.currentCount });
        } catch (error) {
          console.error('Error updating streak:', error);
        }
      },

      getCurrentStreak: async () => {
        const { user } = get();
        if (!user) return;

        try {
          const streaks = await db.streaks
            .where('userId')
            .equals(user.id)
            .toArray();
          
          const dailyStreak = streaks.find(s => s.habitType === 'daily_tasks');
          set({ 
            streaks, 
            currentStreak: dailyStreak?.currentCount || 0 
          });
        } catch (error) {
          console.error('Error getting current streak:', error);
        }
      },

      // UI State
      isAddTaskModalOpen: false,
      isReflectionModalOpen: false,
      theme: 'light',
      setAddTaskModalOpen: (open) => set({ isAddTaskModalOpen: open }),
      setReflectionModalOpen: (open) => set({ isReflectionModalOpen: open }),
      toggleTheme: () => set((state) => ({ theme: state.theme === 'light' ? 'dark' : 'light' })),
    }),
    {
      name: 'dayflow-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ 
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        theme: state.theme 
      }),
    }
  )
);