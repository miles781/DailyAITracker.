import Dexie from 'dexie';
import { DB_NAME, DB_VERSION } from '../lib/constants';

export interface User {
  id: string;
  googleId: string;
  encryptedKey: string;
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
  encryptedData: string;
}

export interface Behavior {
  id: string;
  userId: string;
  type: 'task_add' | 'task_complete' | 'task_skip' | 'reflection_add' | 'app_open';
  action: string;
  timestamp: Date;
  encryptedData: string;
}

export interface Reflection {
  id: string;
  userId: string;
  date: string;
  mood: 1 | 2 | 3 | 4 | 5;
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
  users!: Dexie.Table<User, string>;
  tasks!: Dexie.Table<Task, string>;
  behaviors!: Dexie.Table<Behavior, string>;
  reflections!: Dexie.Table<Reflection, string>;
  streaks!: Dexie.Table<Streak, string>;
  aiSummaries!: Dexie.Table<AISummary, string>;

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

export async function migrateDatabase() {
  console.log('Database migration completed');
}