const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const halls = await prisma.weddingHall.findMany({
    select: {
      hallId: true,
      name: true,
      district: true,
      address: true,
      status: true,
    }
  });
  console.log('--- ALL HALLS IN DB ---');
  console.log(JSON.stringify(halls, null, 2));
  console.log('-----------------------');
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
