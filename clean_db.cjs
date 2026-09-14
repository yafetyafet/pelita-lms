const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("Menghapus data demo...");
  
  // Hapus semua relasi dan data transaksional
  await prisma.attendance.deleteMany();
  await prisma.violation.deleteMany();
  await prisma.classStudent.deleteMany();
  await prisma.classTeacher.deleteMany();
  
  // Hapus master data demo
  await prisma.class.deleteMany();
  await prisma.subject.deleteMany();

  // Opsional: Hapus user demo SELAIN admin utama? 
  // Kita pertahankan 3 akun utama agar tetap bisa login (admin, kurniawan, fajar)
  await prisma.user.deleteMany({
    where: {
      email: {
        notIn: [
          'admin@smkn1kemangkon.sch.id',
          'kurniawan@smkn1kemangkon.sch.id',
          'fajar@smkn1kemangkon.sch.id'
        ]
      }
    }
  });

  console.log("Database berhasil dibersihkan dari data demo!");
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
