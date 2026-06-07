const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Testing connection...');
  try {
    const result = await prisma.$queryRaw`SELECT 1`;
    console.log('Database query successful:', result);
    const users = await prisma.user.findMany({ take: 5 });
    console.log('Users found:', users.length);
  } catch (error) {
    console.error('Error during database test:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
