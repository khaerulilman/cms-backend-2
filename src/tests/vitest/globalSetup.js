import { beforeAll } from 'vitest';

import { setupTestDatabase } from './setup.js';

beforeAll(async () => {
  await setupTestDatabase();
});
