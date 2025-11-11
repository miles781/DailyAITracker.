export {};
// Mock the DB to avoid importing Dexie during these small unit tests
jest.mock('../lib/db', () => ({
  db: {}
}));

const { aiSummarizer } = require('../lib/aiSummarizer');

describe('aiSummarizer sentiment analysis', () => {
  test('positive reflections produce positive sentiment', () => {
    const reflections = [
      { mood: 5, text: 'I felt great and productive today. Completed all my goals.' },
      { mood: 4, text: 'Good energy and focused on work.' },
    ];

    const sentiment = aiSummarizer.analyzeSentiment(reflections as any);
    expect(typeof sentiment).toBe('number');
    expect(sentiment).toBeGreaterThan(0);
  });

  test('negative reflections produce negative sentiment', () => {
    const reflections = [
      { mood: 1, text: 'I was tired and missed my tasks. Felt overwhelmed.' },
      { mood: 2, text: 'Struggling and anxious about work.' },
    ];

    const sentiment = aiSummarizer.analyzeSentiment(reflections as any);
    expect(typeof sentiment).toBe('number');
    expect(sentiment).toBeLessThan(0);
  });

  test('neutral reflections produce near-zero sentiment', () => {
    const reflections = [
      { mood: 3, text: 'It was an okay day, did some tasks.' },
      { mood: 3, text: 'Average day, nothing special.' },
    ];

    const sentiment = aiSummarizer.analyzeSentiment(reflections as any);
    expect(typeof sentiment).toBe('number');
    expect(Math.abs(sentiment)).toBeLessThanOrEqual(0.4);
  });
});
