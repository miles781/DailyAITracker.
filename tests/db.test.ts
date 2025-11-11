import { DB_NAME, DB_VERSION } from '../lib/constants';

test('db constants are defined', () => {
  expect(DB_NAME).toBeDefined();
  expect(typeof DB_VERSION).toBe('number');
});