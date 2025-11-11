import Dexie, { type Table } from 'dexie';
import { DB_NAME, DB_VERSION } from './constants';

export interface User {
  id: string;
  googleId: string;
  encryptedKey: string; // Encrypted encryption key
  // Optional profile fields populated from Google OAuth
  email?: string;
  name?: string;
  picture?: string;
  createdAt: Date;
}

export interface Task {
  id: string;
  userId: string;
  title: string;
  category: 'work' | 'personal' | 'health' | 'learning' | 'other';
  scheduledTime?: string;
  completed: boolean;
  completedAt?: Date;
  createdAt: Date;
  encryptedData: string; // Encrypted task details
}

export interface Behavior {
  id: string;
  userId: string;
  type: 'task_add' | 'task_complete' | 'task_uncomplete' | 'task_skip' | 'task_delete' | 'reflection_add' | 'app_open';
  action: string;
  timestamp: Date;
  encryptedData: string;
}

export interface Reflection {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  mood: 1 | 2 | 3 | 4 | 5; // 1-5 scale
  text: string;
  encryptedData: string;
}

export interface Streak {
  id: string;
  userId: string;
  habitType: string;
  startDate: Date;
  currentCount: number;
  longestCount: number;
  lastUpdated: Date;
}

export interface AISummary {
  id: string;
  userId: string;
  date: string;
  summaryJSON: string;
  encryptedData: string;
  createdAt: Date;
}

class DayFlowDB extends Dexie {
  users!: Table<User, string>;
  tasks!: Table<Task, string>;
  behaviors!: Table<Behavior, string>;
  reflections!: Table<Reflection, string>;
  streaks!: Table<Streak, string>;
  aiSummaries!: Table<AISummary, string>;

  constructor() {
    super(DB_NAME);
    this.version(DB_VERSION).stores({
      users: 'id, googleId, createdAt',
      tasks: 'id, userId, category, completed, createdAt',
      behaviors: 'id, userId, type, timestamp',
      reflections: 'id, userId, date',
      streaks: 'id, userId, habitType, lastUpdated',
      aiSummaries: 'id, userId, date, createdAt'
    });
  }
}

export const db = new DayFlowDB();

// Migration helper for future versions
export async function migrateDatabase() {
  // Future migration logic here
  console.log('Database migration completed');
}