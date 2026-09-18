import { PrismaClient } from "@prisma/client"
import { randomBytes, scrypt as scryptCb } from "node:crypto"
import { promisify } from "node:util"

const prisma = new PrismaClient()
const scrypt = promisify(scryptCb) as (
  password: string,
  salt: Buffer,
  keylen: number
) => Promise<Buffer>

/**
 * Harus menghasilkan format yang sama dengan `src/lib/auth/password.ts`
 * (`scrypt$<salt hex>$<key hex>`). Logikanya disalin, bukan diimpor, karena
 * seed dijalankan lewat ts-node di luar resolusi alias `@/` milik Next.
 */
async function hashPassword(plain: string): Promise<string> {
  const salt = randomBytes(16)
  const key = await scrypt(plain, salt, 64)
  return `scrypt$${salt.toString("hex")}$${key.toString("hex")}`
}

async function main() {
  const username = process.env.SEED_ADMIN_USERNAME || "admin"
  const password = process.env.SEED_ADMIN_PASSWORD || "skansakon"

  console.log(`Seeding admin user "${username}"...`)

  await prisma.user.upsert({
    where: { username },
    // Jangan menimpa kata sandi admin yang sudah ada.
    update: {},
    create: {
      username,
      password: await hashPassword(password),
      name: "Super Admin",
      role: "ADMIN",
      // Kata sandi bawaan wajib diganti saat login pertama.
      mustChangePassword: true,
    },
  })

  console.log("Selesai. Ganti kata sandi admin setelah login pertama.")
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
