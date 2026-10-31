import { prisma } from "./prisma"

let isRunning = false

export async function register() {
  if (isRunning) return
  isRunning = true

  console.log("[CRON] Menjalankan pemutar token CBT (15 menit)...")

  // Rotasi setiap 15 menit
  setInterval(async () => {
    try {
      const now = new Date()

      // Cari apakah ada ujian yang sedang aktif
      // Aktif = isPublished: true, startAt <= now, endAt >= now (atau null)
      const ujianAktif = await prisma.exam.findFirst({
        where: {
          isPublished: true,
          AND: [
            {
              OR: [{ startAt: null }, { startAt: { lte: now } }]
            },
            {
              OR: [{ endAt: null }, { endAt: { gte: now } }]
            }
          ]
        },
        select: { id: true }
      })

      if (ujianAktif) {
        // Buat token 5 karakter seperti di front-end
        const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
        let token = "CBT-"
        for (let i = 0; i < 5; i++) {
          token += chars.charAt(Math.floor(Math.random() * chars.length))
        }

        await prisma.appSetting.upsert({
          where: { key: "CBT_TOKEN" },
          update: { value: token },
          create: { key: "CBT_TOKEN", value: token }
        })

        console.log(`[CRON] Ada ujian aktif. Token CBT global diperbarui menjadi: ${token}`)
      } else {
        console.log("[CRON] Tidak ada ujian aktif. Token tidak diperbarui.")
      }
    } catch (e) {
      console.error("[CRON] Gagal merotasi token CBT:", e)
    }
  }, 15 * 60 * 1000)
}
