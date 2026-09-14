const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({ datasources: { db: { url: process.env.DATABASE_URL } } });
prisma.user.findFirst().then(u => console.log('Connected! User:', u?.email)).catch(console.error).finally(() => prisma.$disconnect());
