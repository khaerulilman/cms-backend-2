import { PrismaClient } from '@prisma/client';

let prisma;

/**
 * Safety check: ensure tests never run against a production database.
 * The DATABASE_URL should be overridden by .env.test in test scripts.
 */
function assertTestDatabase() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    throw new Error('DATABASE_URL is not set. Make sure .env.test is loaded.');
  }
  // Block known production database hosts
  const productionPatterns = ['rds.amazonaws.com', 'production'];
  for (const pattern of productionPatterns) {
    if (dbUrl.includes(pattern)) {
      throw new Error(
        `SAFETY: DATABASE_URL appears to point to a production database (contains "${pattern}"). ` +
          'Ensure .env.test is loaded to override DATABASE_URL for tests.',
      );
    }
  }
}

export function getPrismaTestClient() {
  if (!prisma) {
    assertTestDatabase();
    prisma = new PrismaClient();
  }
  return prisma;
}

export async function cleanDatabase() {
  const prisma = getPrismaTestClient();

  // Delete in order to respect foreign key constraints
  await prisma.cmsCell.deleteMany();
  await prisma.cmsRow.deleteMany();
  await prisma.cmsColumn.deleteMany();
  await prisma.cmsTable.deleteMany();
  await prisma.project.deleteMany();
  await prisma.apiKey.deleteMany();
  await prisma.user.deleteMany();
}

export async function createTestUser(data = {}) {
  const prisma = getPrismaTestClient();
  return await prisma.user.create({
    data: {
      email: data.email || 'test@example.com',
      password: data.password || 'hashedpassword',
      name: data.name || 'Test User',
      ...data,
    },
  });
}

export async function createTestProject(userId, data = {}) {
  const prisma = getPrismaTestClient();
  return await prisma.project.create({
    data: {
      userId,
      name: data.name || 'Test Project',
      description: data.description || 'Test Description',
      ...data,
    },
  });
}
