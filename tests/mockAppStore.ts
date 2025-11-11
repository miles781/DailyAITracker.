// This file exposes a mocked app store used in tests (moved out of .test to avoid Jest running it as a test)
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { db, type User, type Task, type Reflection, type Behavior, type Streak } from '../lib/db';
import { encryptionService } from '../lib/encrypt';

// Valid behavior types
type BehaviorType = 'task_add' | 'task_complete' | 'task_skip' | 'reflection_add' | 'app_open';

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
  logBehavior: (type: BehaviorType, action: string, data?: Record<string, unknown>) => Promise<void>;
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
      setUser: (user: User | null) => set({ user, isAuthenticated: !!user }),
      setIsLoading: (isLoading: boolean) => set({ isLoading }),

      loadUserData: async (): Promise<void> => {
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

      loadTasks: async (): Promise<void> => {
        const { user } = get();
        if (!user) return;

        try {
          const tasks: Task[] = await db.tasks
            .where('userId')
            .equals(user.id)
            .toArray();
          
          set({ tasks, filteredTasks: tasks });
        } catch (error) {
          console.error('Error loading tasks:', error);
        }
      },

      addTask: async (taskData: Omit<Task, 'id' | 'userId' | 'encryptedData' | 'createdAt'>): Promise<void> => {
        const { user } = get();
        if (!user) throw new Error('User not authenticated');

        try {
          const encryptedData: string = await encryptionService.encryptUserData({
            title: taskData.title,
            category: taskData.category,
            scheduledTime: taskData.scheduledTime,
            planForNextDay: taskData.planForNextDay,
          });

          const task: Omit<Task, 'id'> = {
            userId: user.id,
            title: taskData.title,
            category: taskData.category,
            scheduledTime: taskData.scheduledTime,
            planForNextDay: taskData.planForNextDay,
            completed: false,
            createdAt: new Date(),
            encryptedData,
          };

          const id: string = await db.tasks.add(task as Task);
          const newTask: Task = { ...task, id } as Task;
          
          set((state: AppState) => ({
            tasks: [...state.tasks, newTask],
            filteredTasks: [...state.filteredTasks, newTask],
          }));

          get().logBehavior('task_add', `Added task: ${taskData.title}`);
        } catch (error) {
          console.error('Error adding task:', error);
        }
      },

      updateTask: async (id: string, updates: Partial<Task>): Promise<void> => {
        try {
          await db.tasks.update(id, updates);
          set((state: AppState) => ({
            tasks: state.tasks.map((task: Task) => task.id === id ? { ...task, ...updates } : task),
            filteredTasks: state.filteredTasks.map((task: Task) => task.id === id ? { ...task, ...updates } : task),
          }));
        } catch (error) {
          console.error('Error updating task:', error);
        }
      },

      deleteTask: async (id: string): Promise<void> => {
        try {
          const taskToDelete: Task | undefined = get().tasks.find((task: Task) => task.id === id);
          
          await db.tasks.delete(id);
          set((state: AppState) => ({
            tasks: state.tasks.filter((task: Task) => task.id !== id),
            filteredTasks: state.filteredTasks.filter((task: Task) => task.id !== id),
          }));
          
          get().logBehavior('task_skip', `Deleted task: ${taskToDelete?.title || id}`);
        } catch (error) {
          console.error('Error deleting task:', error);
        }
      },

      toggleTaskCompletion: async (id: string): Promise<void> => {
        const task: Task | undefined = get().tasks.find((t: Task) => t.id === id);
        if (!task) return;

        const updates: Partial<Task> = {
          completed: !task.completed,
          completedAt: !task.completed ? new Date() : undefined,
        };

        await get().updateTask(id, updates);
        
        const behaviorType: BehaviorType = updates.completed ? 'task_complete' : 'task_skip';
        get().logBehavior(behaviorType, `Task ${updates.completed ? 'completed' : 'skipped'}: ${task.title}`);
        
        if (updates.completed) {
          get().updateStreak('daily_tasks', true);
        }
      },

      filterTasksByCategory: (category: Task['category'] | 'all'): void => {
        const { tasks } = get();
        if (category === 'all') {
          set({ filteredTasks: tasks });
        } else {
          set({ filteredTasks: tasks.filter((task: Task) => task.category === category) });
        }
      },

      filterTasksByDate: (date: Date): void => {
        set({ selectedDate: date });
      },

      // Reflection State
      reflections: [],
      todayReflection: null,

      addReflection: async (reflectionData: Omit<Reflection, 'id' | 'userId' | 'encryptedData'>): Promise<void> => {
        const { user } = get();
        if (!user) throw new Error('User not authenticated');

        try {
          const encryptedData: string = await encryptionService.encryptUserData({
            mood: reflectionData.mood,
            text: reflectionData.text,
          });

          const reflection: Omit<Reflection, 'id'> = {
            userId: user.id,
            date: reflectionData.date,
            mood: reflectionData.mood,
            text: reflectionData.text,
            encryptedData,
          };

          const id: string = await db.reflections.add(reflection as Reflection);
          const newReflection: Reflection = { ...reflection, id } as Reflection;
          
          set((state: AppState) => ({
            reflections: [...state.reflections, newReflection],
            todayReflection: newReflection,
          }));

          get().logBehavior('reflection_add', 'Added daily reflection');
        } catch (error) {
          console.error('Error adding reflection:', error);
        }
      },

      updateReflection: async (id: string, updates: Partial<Reflection>): Promise<void> => {
        try {
          await db.reflections.update(id, updates);
          set((state: AppState) => ({
            reflections: state.reflections.map((ref: Reflection) => ref.id === id ? { ...ref, ...updates } : ref),
            todayReflection: state.todayReflection?.id === id ? { ...state.todayReflection, ...updates } : state.todayReflection,
          }));
        } catch (error) {
          console.error('Error updating reflection:', error);
        }
      },

      getTodayReflection: async (): Promise<void> => {
        const { user } = get();
        if (!user) return;

        try {
          const today: string = new Date().toISOString().split('T')[0];
          const reflection: Reflection | undefined = await db.reflections
            .where('date')
            .equals(today)
            .filter((r: Reflection) => r.userId === user.id)
            .first();

          set({ todayReflection: reflection || null });
        } catch (error) {
          console.error('Error getting today reflection:', error);
        }
      },

      // Behavior State
      logBehavior: async (type: BehaviorType, action: string, data: Record<string, unknown> = {}): Promise<void> => {
        const { user } = get();
        if (!user) return;

        try {
          const encryptedData: string = await encryptionService.encryptUserData(data);

          const behavior: Omit<Behavior, 'id'> = {
            userId: user.id,
            type,
            action,
            timestamp: new Date(),
            encryptedData,
          };

          await db.behaviors.add(behavior as Behavior);
        } catch (error) {
          console.error('Error logging behavior:', error);
        }
      },

      // Streak State
      streaks: [],
      currentStreak: 0,

      updateStreak: async (habitType: string, completed: boolean): Promise<void> => {
        const { user } = get();
        if (!user) return;

        try {
          const _todayStr: string = new Date().toISOString().split('T')[0];
          let streak: Streak | undefined = await db.streaks
            .where('habitType')
            .equals(habitType)
            .filter((s: Streak) => s.userId === user.id)
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
            const lastUpdated: Date = new Date(streak.lastUpdated);
            const today: Date = new Date();
            
            if (lastUpdated.toDateString() === today.toDateString()) {
              // Already updated today
              return;
            }

            const yesterday: Date = new Date(today);
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
          const streaks: Streak[] = await db.streaks
            .where('userId')
            .equals(user.id)
            .toArray();
          
          set({ streaks, currentStreak: streak.currentCount });
        } catch (error) {
          console.error('Error updating streak:', error);
        }
      },

      getCurrentStreak: async (): Promise<void> => {
        const { user } = get();
        if (!user) return;

        try {
          const streaks: Streak[] = await db.streaks
            .where('userId')
            .equals(user.id)
            .toArray();
          
          const dailyStreak: Streak | undefined = streaks.find((s: Streak) => s.habitType === 'daily_tasks');
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
      setAddTaskModalOpen: (open: boolean) => set({ isAddTaskModalOpen: open }),
      setReflectionModalOpen: (open: boolean) => set({ isReflectionModalOpen: open }),
      toggleTheme: () => set((state: AppState) => ({ theme: state.theme === 'light' ? 'dark' : 'light' })),
    }),
    {
      name: 'dayflow-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state: AppState) => ({ 
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        theme: state.theme 
      }),
    }
  )
);
