/**
 * Seed data demo untuk menguji fitur zoom gambar soal ujian.
 *
 * Membuat:
 *   • Mapel "Matematika" (jika belum ada)
 *   • Kelas "X-DEMO" (jika belum ada)
 *   • Akun guru demo (username: guru_demo / password: demo1234)
 *   • Akun siswa demo (username: siswa_demo / password: demo1234)
 *   • Ujian "Ujian Demo Bergambar" dengan 5 soal (3 pakai gambar)
 *   • Token ujian: DEMO-12345
 *
 * Pakai: node seed_demo_ujian.cjs
 */
const { PrismaClient } = require("@prisma/client");
const { randomBytes, scryptSync } = require("node:crypto");

const prisma = new PrismaClient();

function hashPassword(plain) {
  const salt = randomBytes(16);
  const key = scryptSync(plain, salt, 64);
  return `scrypt$${salt.toString("hex")}$${key.toString("hex")}`;
}

async function main() {
  console.log("🌱 Menyiapkan data demo ujian bergambar...\n");

  // 1. Mapel
  const mapel = await prisma.subject.upsert({
    where: { name: "Matematika" },
    update: {},
    create: { name: "Matematika", code: "MTK", description: "Mata pelajaran Matematika" },
  });
  console.log(`  ✓ Mapel: ${mapel.name} (${mapel.id})`);

  // 2. Kelas
  const kelas = await prisma.class.upsert({
    where: { name: "X-DEMO" },
    update: {},
    create: { name: "X-DEMO", description: "Kelas demo untuk uji coba", level: 10 },
  });
  console.log(`  ✓ Kelas: ${kelas.name} (${kelas.id})`);

  // 3. Akun guru
  const guru = await prisma.user.upsert({
    where: { username: "guru_demo" },
    update: {},
    create: {
      username: "guru_demo",
      password: hashPassword("demo1234"),
      name: "Guru Demo",
      role: "TEACHER",
    },
  });
  console.log(`  ✓ Guru: ${guru.username} / demo1234`);

  // Hubungkan guru ke kelas-mapel
  await prisma.classTeacher.upsert({
    where: {
      userId_classId_subjectId: {
        userId: guru.id,
        classId: kelas.id,
        subjectId: mapel.id,
      },
    },
    update: {},
    create: { userId: guru.id, classId: kelas.id, subjectId: mapel.id },
  });

  // 4. Akun siswa
  const siswa = await prisma.user.upsert({
    where: { username: "siswa_demo" },
    update: {},
    create: {
      username: "siswa_demo",
      password: hashPassword("demo1234"),
      name: "Siswa Demo",
      role: "STUDENT",
      nomorInduk: "99001",
    },
  });
  console.log(`  ✓ Siswa: ${siswa.username} / demo1234`);

  // Masukkan siswa ke kelas
  await prisma.classStudent.upsert({
    where: { userId_classId: { userId: siswa.id, classId: kelas.id } },
    update: {},
    create: { userId: siswa.id, classId: kelas.id },
  });

  // 5. Hapus ujian demo lama (jika ada) supaya seed bersih
  const ujianLama = await prisma.exam.findFirst({
    where: { title: "Ujian Demo Bergambar" },
  });
  if (ujianLama) {
    await prisma.exam.delete({ where: { id: ujianLama.id } });
    console.log("  ⟳ Ujian demo lama dihapus");
  }

  // 6. Buat ujian baru
  const sekarang = new Date();
  const besok = new Date(sekarang.getTime() + 24 * 60 * 60 * 1000);

  const ujian = await prisma.exam.create({
    data: {
      title: "Ujian Demo Bergambar",
      description:
        "Ujian demo untuk menguji fitur zoom gambar soal. Berisi soal dengan gambar diagram yang perlu diperbesar untuk dibaca.",
      type: "PG",
      subjectId: mapel.id,
      authorId: guru.id,
      duration: 30, // 30 menit
      startAt: sekarang,
      endAt: besok,
      token: "DEMO-12345",
      shuffle: false,
      isPublished: true,
      showResult: true,
      classes: {
        create: { classId: kelas.id },
      },
      questions: {
        create: [
          {
            question:
              "Perhatikan gambar segitiga siku-siku berikut.\nBerapakah panjang sisi AC?",
            imageUrl: "/soal_demo_1.jpg",
            type: "PG",
            options: JSON.stringify(["10 cm", "12 cm", "14 cm", "8 cm"]),
            correctAnswer: "0",
            points: 20,
            order: 1,
          },
          {
            question:
              "Perhatikan diagram anatomi jantung manusia berikut.\nBagian yang berfungsi memompa darah ke seluruh tubuh adalah...",
            imageUrl: "/soal_demo_2.jpg",
            type: "PG",
            options: JSON.stringify([
              "Ventrikel Kiri",
              "Atrium Kanan",
              "Ventrikel Kanan",
              "Atrium Kiri",
            ]),
            correctAnswer: "0",
            points: 20,
            order: 2,
          },
          {
            question:
              "Perhatikan rangkaian listrik pada gambar berikut.\nBerapakah hambatan total rangkaian tersebut?",
            imageUrl: "/soal_demo_3.jpg",
            type: "PG",
            options: JSON.stringify(["22 Ω", "60 Ω", "12 Ω", "30 Ω"]),
            correctAnswer: "0",
            points: 20,
            order: 3,
          },
          {
            question:
              "Sebuah persegi panjang memiliki panjang 15 cm dan lebar 8 cm. Berapakah luas persegi panjang tersebut?",
            imageUrl: null,
            type: "PG",
            options: JSON.stringify([
              "120 cm²",
              "46 cm²",
              "100 cm²",
              "80 cm²",
            ]),
            correctAnswer: "0",
            points: 20,
            order: 4,
          },
          {
            question:
              "Jelaskan dengan singkat bagaimana cara menghitung luas segitiga jika diketahui alas dan tingginya.",
            imageUrl: null,
            type: "ESAI",
            options: null,
            correctAnswer: null,
            points: 20,
            order: 5,
          },
        ],
      },
    },
  });

  console.log(`  ✓ Ujian: "${ujian.title}" (${ujian.id})`);
  console.log(`  ✓ Token ujian: DEMO-12345`);
  console.log(`  ✓ 5 soal (3 bergambar + 1 PG biasa + 1 esai)\n`);

  console.log("═══════════════════════════════════════════");
  console.log("  AKUN DEMO");
  console.log("═══════════════════════════════════════════");
  console.log("  Siswa:  siswa_demo / demo1234");
  console.log("  Guru:   guru_demo  / demo1234");
  console.log("  Token:  DEMO-12345");
  console.log("═══════════════════════════════════════════\n");
}

main()
  .catch((e) => {
    console.error("❌ Gagal:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
