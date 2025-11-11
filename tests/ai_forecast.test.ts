export {};
// Mock DB to avoid loading Dexie's ESM bundle during unit tests
jest.mock('../lib/db', () => ({ db: {} }));

import { aiSummarizer } from '../lib/aiSummarizer';

describe('aiSummarizer forecasting', () => {
  test('high completion and consistency -> high probability', () => {
    const prob = aiSummarizer.forecastGoalCompletion(90, 80);
    expect(typeof prob).toBe('number');
    expect(prob).toBeGreaterThan(0.7);
  });

  test('low completion and low consistency -> low probability', () => {
    const prob = aiSummarizer.forecastGoalCompletion(20, 10);
    expect(typeof prob).toBe('number');
    expect(prob).toBeLessThan(0.4);
  });

  test('mid values produce mid probability', () => {
    const prob = aiSummarizer.forecastGoalCompletion(50, 50);
    expect(prob).toBeGreaterThanOrEqual(0.4);
    expect(prob).toBeLessThanOrEqual(0.7);
  });
});
