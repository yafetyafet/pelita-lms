const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("Seeding admin user...");
  
  await prisma.user.create({
    data: {
      username: 'admin',
      password: 'skansakon', // Di aplikasi nyata gunakan bcrypt, tapi untuk demo ini plaintext
      name: 'Administrator',
      role: 'ADMIN',
    }
  });

  console.log("Admin user created!");
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
