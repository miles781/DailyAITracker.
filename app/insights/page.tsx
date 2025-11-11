'use client';

import { useEffect, useState } from 'react';
import { useAppStore } from '../../store/appState';
import { db, type Task as DbTask, type Reflection as DbReflection } from '../../lib/db';
import { encryptionService } from '../../lib/encrypt';
import { 
  LineChart, Line, PieChart, Pie, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';

// Type definitions
interface Task {
  id: string;
  userId: string;
  title: string;
  category: string;
  completed: boolean;
  createdAt: Date;
  encryptedData?: string;
}

interface Reflection {
  id: string;
  userId: string;
  date: string; // ISO string
  mood: number;
  encryptedData?: string;
}

interface InsightsData {
  dailyCompletion: { date: string; completionRate: number }[];
  categoryDistribution: { category: string; count: number }[];
  moodTrend: { date: string; mood: number }[];
  weeklyStreak: { day: string; completed: boolean }[];
}

interface DailyData {
  total: number;
  completed: number;
}

interface DecryptedTask {
  title: string;
  category: string;
  completed: boolean;
  createdAt: Date;
  scheduledTime?: string;
}

interface DecryptedReflection {
  mood: number;
  text: string;
}

export default function InsightsPage() {
  const { user } = useAppStore();
  const [insightsData, setInsightsData] = useState<InsightsData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    if (user) {
      loadInsightsData();
    }
  }, [user]);

  const loadInsightsData = async (): Promise<void> => {
    if (!user) return;

    setIsLoading(true);
    try {
      // Get last 30 days of data
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);

      const [tasks, reflections] = await Promise.all([
        db.tasks
          .where('userId')
          .equals(user.id)
          .filter((task: DbTask) => task.createdAt >= startDate)
          .toArray(),
        db.reflections
          .where('userId')
          .equals(user.id)
          .filter((reflection: DbReflection) => reflection.date >= startDate.toISOString().split('T')[0])
          .toArray(),
      ]);

      // Decrypt data with proper typing
      const decryptedTasks = await Promise.all(
        tasks.map(async (task: DbTask) => {
          try {
            const decrypted = await encryptionService.decryptUserData(task.encryptedData) as DecryptedTask;
            return {
              ...task,
              ...decrypted
            };
          } catch {
            return null;
          }
        })
      ).then((results: (Task | null)[]) => results.filter(Boolean)) as Task[];

      const decryptedReflections = await Promise.all(
        reflections.map(async (reflection: DbReflection) => {
          try {
            const decrypted = await encryptionService.decryptUserData(reflection.encryptedData) as DecryptedReflection;
            return {
              ...reflection,
              ...decrypted
            };
          } catch {
            return null;
          }
        })
      ).then((results: (Reflection | null)[]) => results.filter(Boolean)) as Reflection[];

      // Process data for charts
      const dailyCompletion = processDailyCompletion(decryptedTasks, startDate);
      const categoryDistribution = processCategoryDistribution(decryptedTasks);
      const moodTrend = processMoodTrend(decryptedReflections);
      const weeklyStreak = processWeeklyStreak(decryptedTasks);

      setInsightsData({
        dailyCompletion,
        categoryDistribution,
        moodTrend,
        weeklyStreak,
      });
    } catch (error) {
      console.error('Error loading insights data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const processDailyCompletion = (tasks: Task[], startDate: Date): { date: string; completionRate: number }[] => {
    const dailyData: Record<string, DailyData> = {};
    
    tasks.forEach((task: Task) => {
      const date = task.createdAt.toISOString().split('T')[0];
      if (!dailyData[date]) {
        dailyData[date] = { total: 0, completed: 0 };
      }
      dailyData[date].total++;
      if (task.completed) dailyData[date].completed++;
    });

    return Object.entries(dailyData)
      .map(([date, data]: [string, DailyData]) => ({
        date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        completionRate: Math.round((data.completed / data.total) * 100),
      }))
      .slice(-14); // Last 14 days
  };

  const processCategoryDistribution = (tasks: Task[]): { category: string; count: number }[] => {
    const categoryCount = tasks.reduce((acc: Record<string, number>, task: Task) => {
      acc[task.category] = (acc[task.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(categoryCount).map(([category, count]: [string, number]) => ({
      category: category.charAt(0).toUpperCase() + category.slice(1),
      count: count,
    }));
  };

  const processMoodTrend = (reflections: Reflection[]): { date: string; mood: number }[] => {
    return reflections
      .map((reflection: Reflection) => ({
        date: new Date(reflection.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        mood: reflection.mood,
      }))
      .slice(-14); // Last 14 days
  };

  const processWeeklyStreak = (tasks: Task[]): { day: string; completed: boolean }[] => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const dayCompletion = days.map((day: string, i: number) => ({ 
      day, 
      // Deterministic mock activity based on date to avoid Math.random in render
      completed: ((new Date().getDate() + i) % 4) !== 0
    }));
    return dayCompletion;
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Please sign in to view insights.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Your Insights</h1>
          <p className="text-gray-600">Track your progress and patterns</p>
        </header>

        {insightsData ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Completion Rate Chart */}
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="text-lg font-semibold mb-4">Daily Completion Rate</h3>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={insightsData.dailyCompletion}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="completionRate" stroke="#3b82f6" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Category Distribution */}
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="text-lg font-semibold mb-4">Task Categories</h3>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={insightsData.categoryDistribution}
                    dataKey="count"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    label
                  />
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Mood Trend */}
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="text-lg font-semibold mb-4">Mood Trend</h3>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={insightsData.moodTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis domain={[1, 5]} />
                  <Tooltip />
                  <Line type="monotone" dataKey="mood" stroke="#10b981" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Weekly Streak */}
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="text-lg font-semibold mb-4">This Week</h3>
              <div className="flex justify-between">
                {insightsData.weeklyStreak.map(({ day, completed }: { day: string; completed: boolean }) => (
                  <div key={day} className="text-center">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        completed ? 'bg-green-500 text-white' : 'bg-gray-200'
                      }`}
                    >
                      {completed ? '✓' : ''}
                    </div>
                    <div className="text-sm mt-2">{day}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-600">No data available yet. Start using DayFlow to see insights!</p>
          </div>
        )}
      </div>
    </div>
  );
}