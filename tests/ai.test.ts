import { aiSummarizer } from '../lib/aiSummarizer';
import { aiPlanner } from '../lib/aiPlanner';

// Mock the database and encryption
jest.mock('../lib/db', () => ({
  db: {
    tasks: {
      where: jest.fn().mockReturnThis(),
      equals: jest.fn().mockReturnThis(),
      filter: jest.fn().mockReturnThis(),
      toArray: jest.fn().mockResolvedValue([]),
    },
    behaviors: {
      where: jest.fn().mockReturnThis(),
      equals: jest.fn().mockReturnThis(),
      filter: jest.fn().mockReturnThis(),
      toArray: jest.fn().mockResolvedValue([]),
    },
    reflections: {
      where: jest.fn().mockReturnThis(),
      equals: jest.fn().mockReturnThis(),
      filter: jest.fn().mockReturnThis(),
      toArray: jest.fn().mockResolvedValue([]),
    },
  },
}));

jest.mock('../lib/encrypt', () => ({
  encryptionService: {
    decryptUserData: jest.fn().mockResolvedValue({}),
  },
}));

describe('AI Services', () => {
  describe('aiSummarizer', () => {
    test('generates summary with default data when no user data', async () => {
      const summary = await aiSummarizer.generateSummary('test-user');
      
      expect(summary).toHaveProperty('summary');
      expect(summary).toHaveProperty('patterns');
      expect(summary.summary).toHaveProperty('completionRate');
      expect(summary.summary).toHaveProperty('averageMood');
    });

    test('prepares AI request data', async () => {
      const requestData = await aiSummarizer.prepareAIRequestData('test-user');
      
      expect(typeof requestData).toBe('string');
      const parsedData = JSON.parse(requestData);
      expect(parsedData).toHaveProperty('productivity');
      expect(parsedData).toHaveProperty('wellbeing');
      expect(parsedData).toHaveProperty('patterns');
    });
  });

  describe('aiPlanner', () => {
    test('generates offline plan when no API key', async () => {
      // Mock no API key
      process.env.NEXT_PUBLIC_DEEPSEEK_API_KEY = '';
      process.env.NEXT_PUBLIC_OPENAI_API_KEY = '';

      const plan = await aiPlanner.generateDailyPlan('test-user');
      
      expect(plan).toHaveProperty('tasks');
      expect(plan).toHaveProperty('motivationalQuote');
      expect(plan).toHaveProperty('insights');
      expect(plan).toHaveProperty('focusArea');
      expect(Array.isArray(plan.tasks)).toBe(true);
      expect(plan.tasks.length).toBeLessThanOrEqual(5);
    });
  });
}); 