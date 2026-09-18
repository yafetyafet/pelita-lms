/**
 * Seed akun admin. Kata sandi di-hash dengan format yang sama seperti
 * src/lib/auth/password.ts (scrypt$<salt hex>$<key hex>) — versi lama
 * menyimpannya sebagai plaintext.
 *
 * Pakai: node seed_admin.cjs
 *        SEED_ADMIN_PASSWORD=rahasia node seed_admin.cjs
 */
const { PrismaClient } = require('@prisma/client');
const { randomBytes, scryptSync } = require('node:crypto');

const prisma = new PrismaClient();

function hashPassword(plain) {
  const salt = randomBytes(16);
  const key = scryptSync(plain, salt, 64);
  return `scrypt$${salt.toString('hex')}$${key.toString('hex')}`;
}

async function main() {
  const username = process.env.SEED_ADMIN_USERNAME || 'admin';
  const password = process.env.SEED_ADMIN_PASSWORD || 'skansakon';

  console.log(`Seeding admin user "${username}"...`);

  await prisma.user.upsert({
    where: { username },
    update: {},
    create: {
      username,
      password: hashPassword(password),
      name: 'Administrator',
      role: 'ADMIN',
      mustChangePassword: true,
    },
  });

  console.log('Admin siap. Ganti kata sandi setelah login pertama.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
