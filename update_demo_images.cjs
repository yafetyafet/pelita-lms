const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();

async function main() {
  const soal = await p.examQuestion.findMany({
    where: { exam: { title: "Ujian Demo Bergambar" } },
    orderBy: { order: "asc" },
  });

  // URL gambar publik dari internet (bukan file lokal)
  // Ini mensimulasikan cara kerja embed link Google Drive
  // karena normalisasiUrlGambar() juga menghasilkan URL https://...
  const gambar = [
    // Soal 1: Diagram segitiga (dari picsum/placeholder — bisa diganti)
    "https://www.mathsisfun.com/geometry/images/triangle-3-4-5.svg",
    // Soal 2: Diagram jantung
    "https://cdn.britannica.com/77/91677-050-1A3B0012/heart.jpg",
    // Soal 3: Rangkaian listrik
    "https://www.physicsclassroom.com/Class/circuits/u9l4a1.gif",
  ];

  for (let i = 0; i < 3 && i < soal.length; i++) {
    await p.examQuestion.update({
      where: { id: soal[i].id },
      data: { imageUrl: gambar[i] },
    });
    console.log("  ✓ Soal " + (i + 1) + " -> " + gambar[i]);
  }

  // Juga hapus submission lama agar bisa mulai ulang
  const del = await p.examSubmission.deleteMany({
    where: {
      exam: { title: "Ujian Demo Bergambar" },
      user: { username: "siswa_demo" },
    },
  });
  if (del.count > 0) console.log("  ✓ Submission lama dihapus");

  console.log("\nSelesai! Gambar soal sekarang dari link internet.");
  await p.$disconnect();
}

main();
