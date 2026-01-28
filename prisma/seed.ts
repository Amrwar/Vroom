import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  const workers = [
    { name: 'Ahmed' },
    { name: 'Mohamed' },
    { name: 'Hassan' },
    { name: 'Ali' },
  ];

  for (const worker of workers) {
    await prisma.worker.upsert({
      where: { name: worker.name },
      update: {},
      create: worker,
    });
  }

  console.log('Seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
