import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Memulai proses seeding database...')

  // 1. Buat User Admin
  const admin = await prisma.user.upsert({
    where: { email: 'admin@smkn1kemangkon.sch.id' },
    update: {},
    create: {
      email: 'admin@smkn1kemangkon.sch.id',
      name: 'Super Administrator',
      role: 'ADMIN',
    },
  })
  console.log('✅ Admin dibuat:', admin.name)

  // 2. Buat User Guru & Siswa
  const guru = await prisma.user.upsert({
    where: { email: 'kurniawan@smkn1kemangkon.sch.id' },
    update: {},
    create: {
      email: 'kurniawan@smkn1kemangkon.sch.id',
      name: 'Bpk. Kurniawan S, S.Kom',
      role: 'TEACHER',
    }
  })
  
  const siswa = await prisma.user.upsert({
    where: { email: 'fajar@smkn1kemangkon.sch.id' },
    update: {},
    create: {
      email: 'fajar@smkn1kemangkon.sch.id',
      name: 'Fajar Pratama',
      role: 'STUDENT',
    }
  })
  console.log('✅ Guru & Siswa dibuat')

  // 3. Buat Kelas / Rombel
  const kelas = await prisma.class.create({
    data: { name: 'XII RPL 1', level: 12 }
  })
  console.log('✅ Rombel (Kelas) dibuat')

  // 4. Buat Mata Pelajaran
  const mapel = await prisma.subject.upsert({
    where: { code: 'RPL01' },
    update: {},
    create: { code: 'RPL01', name: 'Pemrograman Web & Perangkat Bergerak' },
  })
  console.log('✅ Mata Pelajaran dibuat')

  console.log('🎉 Seeding selesai! Database siap digunakan oleh 500+ user.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
