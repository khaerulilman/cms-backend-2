import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

/**
 * Push Prisma schema to the test database.
 * DATABASE_URL is already overridden by .env.test via dotenv-cli in npm scripts.
 */
export async function setupTestDatabase() {
  await execAsync("npx prisma db push --skip-generate");
}
