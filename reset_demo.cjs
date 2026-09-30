const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();

async function main() {
  // Hapus submission demo lama agar siswa bisa mulai ulang
  const del = await p.examSubmission.deleteMany({
    where: {
      exam: { title: "Ujian Demo Bergambar" },
      user: { username: "siswa_demo" },
    },
  });
  console.log("Submission dihapus:", del.count);
  await p.$disconnect();
}

main();
