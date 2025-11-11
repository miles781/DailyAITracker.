import { aiSummarizer } from '../lib/aiSummarizer';
import { aiPlanner } from '../lib/aiPlanner';

// Mock DB and encryption so we can feed controlled synthetic data
jest.mock('../lib/db', () => {
  // Create synthetic createdAt dates (within last 7 days)
  const today = new Date();
  const createdAt = new Date(today);
  createdAt.setDate(today.getDate() - 1);

  const reflections = [
    {
      id: 'r1',
      userId: 'test-user',
      date: '2025-11-11',
      mood: 3,
      text: 'Felt tired in the morning but completed gym session.',
      encryptedData: JSON.stringify({ mood: 3, text: 'Felt tired in the morning but completed gym session.', date: '2025-11-11' })
    },
    {
      id: 'r2',
      userId: 'test-user',
      date: '2025-11-10',
      mood: 2,
      text: 'Missed journaling, plan to sleep earlier.',
      encryptedData: JSON.stringify({ mood: 2, text: 'Missed journaling, plan to sleep earlier.', date: '2025-11-10' })
    },
    {
      id: 'r3',
      userId: 'test-user',
      date: '2025-11-09',
      mood: 4,
      text: 'Completed 4/5 goals today — felt more focused.',
      encryptedData: JSON.stringify({ mood: 4, text: 'Completed 4/5 goals today — felt more focused.', date: '2025-11-09' })
    }
  ];

  const tasks = [
    {
      id: 't1',
      userId: 'test-user',
      title: 'Gym session',
      category: 'health',
      completed: true,
      createdAt: createdAt,
      encryptedData: JSON.stringify({ title: 'Gym session', category: 'health', completed: true, createdAt: createdAt })
    },
    {
      id: 't2',
      userId: 'test-user',
      title: 'Write journal',
      category: 'personal',
      completed: false,
      createdAt: createdAt,
      encryptedData: JSON.stringify({ title: 'Write journal', category: 'personal', completed: false, createdAt: createdAt })
    },
    {
      id: 't3',
      userId: 'test-user',
      title: 'Finish project report',
      category: 'work',
      completed: true,
      createdAt: createdAt,
      encryptedData: JSON.stringify({ title: 'Finish project report', category: 'work', completed: true, createdAt: createdAt })
    },
    {
      id: 't4',
      userId: 'test-user',
      title: 'Read article',
      category: 'learning',
      completed: false,
      createdAt: createdAt,
      encryptedData: JSON.stringify({ title: 'Read article', category: 'learning', completed: false, createdAt: createdAt })
    },
    {
      id: 't5',
      userId: 'test-user',
      title: 'Plan tomorrow',
      category: 'other',
      completed: false,
      createdAt: createdAt,
      encryptedData: JSON.stringify({ title: 'Plan tomorrow', category: 'other', completed: false, createdAt: createdAt })
    }
  ];

  const behaviors = [
    { id: 'b1', userId: 'test-user', type: 'task_complete', action: 'completed task', timestamp: new Date().toISOString(), encryptedData: '{}' },
    { id: 'b2', userId: 'test-user', type: 'reflection_add', action: 'added reflection', timestamp: new Date().toISOString(), encryptedData: '{}' }
  ];

  return {
    db: {
      tasks: {
        where: jest.fn().mockReturnThis(),
        equals: jest.fn().mockReturnThis(),
        filter: jest.fn().mockReturnThis(),
        toArray: jest.fn().mockResolvedValue(tasks),
      },
      behaviors: {
        where: jest.fn().mockReturnThis(),
        equals: jest.fn().mockReturnThis(),
        filter: jest.fn().mockReturnThis(),
        toArray: jest.fn().mockResolvedValue(behaviors),
      },
      reflections: {
        where: jest.fn().mockReturnThis(),
        equals: jest.fn().mockReturnThis(),
        filter: jest.fn().mockReturnThis(),
        toArray: jest.fn().mockResolvedValue(reflections),
      },
      aiSummaries: {
        add: jest.fn().mockResolvedValue(true),
        where: jest.fn().mockReturnThis(),
        equals: jest.fn().mockReturnThis(),
        and: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue(null),
      }
    }
  };
});

jest.mock('../lib/encrypt', () => ({
  encryptionService: {
    decryptUserData: jest.fn(async (encrypted: string) => {
      try {
        return JSON.parse(encrypted);
      } catch (e) {
        return {};
      }
    }),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      encryptUserData: jest.fn(async (data: any) => {
      return JSON.stringify(data);
    })
  }
}));

describe('AI behavior with synthetic data', () => {
  test('aiSummarizer produces expected aggregated summary', async () => {
    const summary = await aiSummarizer.generateSummary('test-user', 7);

    expect(summary).toHaveProperty('summary');
    expect(summary.summary.totalTasks).toBeGreaterThanOrEqual(5);
    expect(summary.summary.completedTasks).toBeGreaterThanOrEqual(2);
    expect(Array.isArray(summary.summary.frequentCategories)).toBe(true);
    expect(summary.patterns).toHaveProperty('bestPerformingCategory');
  });

  test('prepareAIRequestData returns safe JSON for planner', async () => {
    const requestData = await aiSummarizer.prepareAIRequestData('test-user');
    expect(typeof requestData).toBe('string');
    const parsed = JSON.parse(requestData);
    expect(parsed).toHaveProperty('productivity');
    expect(parsed.productivity).toHaveProperty('taskCompletion');
    expect(parsed.wellbeing).toHaveProperty('moodTrend');
  });

  test('aiPlanner.generateDailyPlan returns a plan (offline template used)', async () => {
    // Ensure no API key so offline plan is used
    process.env.NEXT_PUBLIC_DEEPSEEK_API_KEY = '';
    process.env.NEXT_PUBLIC_OPENAI_API_KEY = '';

    const plan = await aiPlanner.generateDailyPlan('test-user');
    expect(plan).toHaveProperty('tasks');
    expect(Array.isArray(plan.tasks)).toBe(true);
    expect(plan.tasks.length).toBeGreaterThan(0);
    expect(plan).toHaveProperty('motivationalQuote');
    expect(plan).toHaveProperty('insights');
  });
});
