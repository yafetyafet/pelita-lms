/**
 * Parser soal tempel/copas untuk guru.
 *
 * Dulu tertanam di dalam komponen halaman ujian sehingga tidak bisa diuji
 * langsung. Kini modul murni: masukan teks, keluaran daftar soal + catatan.
 *
 * Yang dikenali per baris:
 *   1. / 1)                -> soal baru
 *   A. / A)  s.d. H.       -> opsi jawaban (atau pernyataan pada Benar/Salah)
 *   - teks / • teks         -> pernyataan Benar/Salah
 *   Gambar: <url>           -> gambar soal; juga ![](url) dan baris berisi
 *                              tautan gambar saja
 *   Jawaban: A / A,B,D      -> kunci PG / PG kompleks
 *   Jawaban: B,S,B          -> kunci Benar/Salah (juga "Benar, Salah, ...")
 *   Poin: 15                -> bobot soal
 *   Esai / Uraian           -> paksa uraian
 *   Benar/Salah             -> paksa Benar/Salah
 *
 * Tanda bintang pada jawaban benar - tidak perlu baris "Jawaban:" lagi:
 *   A. Bahasa markup *      -> opsi A benar    (bintang di akhir)
 *   *A. Bahasa markup       -> sama            (bintang di awal)
 *   A.* Bahasa markup       -> sama
 *   Pada Benar/Salah, pernyataan berbintang = BENAR, tanpa bintang = SALAH.
 *   Boleh juga eksplisit:   - Air mendidih di 100°C (B)   /   ... (S)
 *
 * Deteksi tipe otomatis (kalau tidak dipaksa lewat penanda):
 *   - tidak ada opsi sama sekali                  -> ESAI
 *   - stem berbunyi "benar atau salah", "benar/salah",
 *     "tentukan ... benar/salah", atau ada pernyataan
 *     bertanda (B)/(S)                            -> BENAR_SALAH
 *   - satu jawaban benar                          -> PG
 *   - lebih dari satu jawaban benar               -> PG_KOMPLEKS
 */

import { normalisasiUrlGambar } from './gambar-url'

export type SoalTempel = {
  question: string
  imageUrl: string
  type: "PG" | "PG_KOMPLEKS" | "BENAR_SALAH" | "ESAI"
  options: string[]
  correctAnswer: string
  points: number
}

export type HasilParse = { soal: SoalTempel[]; catatan: string[] }

const HURUF = "ABCDEFGH"

const isTautanGambar = (t: string) =>
  /^https?:\/\/\S+$/i.test(t) &&
  (/\.(png|jpe?g|gif|webp|svg|bmp)(\?\S*)?$/i.test(t) ||
    /(drive\.google|googleusercontent|imgur|ibb\.co|cloudinary|blogspot|wp\.com)/i.test(t))

/** Stem yang jelas-jelas meminta penilaian benar/salah per pernyataan. */
const stemTerlihatBS = (q: string) =>
  /benar\s*(atau|\/|-|dan)\s*salah|salah\s*(atau|\/)\s*benar|tentukan\s+(b\s*\/\s*s|benar|salah)|sesuai\s*(atau|\/)\s*tidak\s*sesuai/i.test(
    q
  )

/**
 * Pisahkan penanda kunci dari teks satu opsi/pernyataan.
 *
 * Mengembalikan teks bersih, apakah berbintang, dan tanda B/S eksplisit
 * bila ada. Bintang dikenali di awal maupun akhir; "(B)", "[S]", "(Benar)"
 * hanya di akhir.
 */
function pisahPenanda(teks: string): { teks: string; bintang: boolean; bs: "B" | "S" | null } {
  let t = teks.trim()
  let bintang = false
  let bs: "B" | "S" | null = null

  if (/^\*+\s*/.test(t)) {
    bintang = true
    t = t.replace(/^\*+\s*/, "")
  }
  if (/\s*\*+$/.test(t)) {
    bintang = true
    t = t.replace(/\s*\*+$/, "")
  }

  const mBS = t.match(/\s*[\(\[]\s*(B|S|BENAR|SALAH|T|F|TRUE|FALSE)\s*[\)\]]\s*$/i)
  if (mBS) {
    const v = mBS[1].toUpperCase()
    bs = v === "B" || v === "BENAR" || v === "T" || v === "TRUE" ? "B" : "S"
    t = t.slice(0, mBS.index).trim()
  }

  return { teks: t.trim(), bintang, bs }
}

type Draf = SoalTempel & {
  teksSelesai: boolean
  dipaksa: boolean
  bintang: boolean[]
  tandaBS: ("B" | "S" | null)[]
  kunciDariBaris: string | null
}

export function parseSoalTempel(teksMentah: string): HasilParse {
  const lines = teksMentah.split("\n")
  const soal: SoalTempel[] = []
  const catatan: string[] = []

  let current: Draf | null = null

  const tutup = () => {
    if (!current) return
    const c = current
    current = null
    const nomor = soal.length + 1
    const cuplik = String(c.question).slice(0, 24) + "..."

    // Buang opsi kosong beserta penandanya di posisi yang sama.
    const isi: string[] = []
    const bintang: boolean[] = []
    const tandaBS: ("B" | "S" | null)[] = []
    c.options.forEach((o, i) => {
      if (String(o).trim()) {
        isi.push(String(o).trim())
        bintang.push(Boolean(c.bintang[i]))
        tandaBS.push(c.tandaBS[i] ?? null)
      }
    })

    // ---------- tentukan tipe ----------
    let tipe = c.type
    if (!c.dipaksa) {
      if (isi.length === 0 && !c.kunciDariBaris) {
        tipe = "ESAI"
      } else if (
        tipe !== "BENAR_SALAH" &&
        (stemTerlihatBS(c.question) || tandaBS.some((x) => x !== null))
      ) {
        tipe = "BENAR_SALAH"
      }
    }

    // ---------- ESAI ----------
    if (tipe === "ESAI") {
      if (c.type !== "ESAI" && isi.length > 0) {
        catatan.push(`Soal ${nomor} "${cuplik}": dipaksa esai padahal punya opsi`)
      }
      soal.push({
        question: c.question.trim(),
        imageUrl: normalisasiUrlGambar(c.imageUrl),
        type: "ESAI",
        options: ["", "", "", "", ""],
        correctAnswer: "",
        points: c.points,
      })
      return
    }

    // ---------- BENAR/SALAH ----------
    if (tipe === "BENAR_SALAH") {
      let kunci: string[] | null = null
      if (c.kunciDariBaris) {
        kunci = c.kunciDariBaris.split(",")
      } else if (tandaBS.some((x) => x !== null) || bintang.some(Boolean)) {
        // Tanda eksplisit (B)/(S) didahulukan; kalau tidak ada, bintang
        // berarti BENAR dan sisanya SALAH.
        kunci = isi.map((_, i) => tandaBS[i] ?? (bintang[i] ? "B" : "S"))
      }

      if (isi.length < 2) {
        catatan.push(`Soal ${nomor} "${cuplik}": Benar/Salah butuh minimal 2 pernyataan`)
      } else if (!kunci) {
        catatan.push(`Soal ${nomor} "${cuplik}": kunci Benar/Salah belum ada - beri * pada yang benar, atau (B)/(S), atau baris Jawaban:`)
      } else if (kunci.length !== isi.length) {
        catatan.push(`Soal ${nomor} "${cuplik}": kunci ${kunci.length} nilai, pernyataan ${isi.length}`)
      }

      soal.push({
        question: c.question.trim(),
        imageUrl: normalisasiUrlGambar(c.imageUrl),
        type: "BENAR_SALAH",
        options: isi,
        correctAnswer: kunci ? kunci.join(",") : "",
        points: c.points,
      })
      return
    }

    // ---------- PG / PG KOMPLEKS ----------
    if (isi.length < 2) {
      catatan.push(`Soal ${nomor} "${cuplik}": opsi kurang dari 2 → jadi Esai`)
      soal.push({
        question: c.question.trim(),
        imageUrl: normalisasiUrlGambar(c.imageUrl),
        type: "ESAI",
        options: ["", "", "", "", ""],
        correctAnswer: "",
        points: c.points,
      })
      return
    }

    const dariBintang = isi.map((_, i) => i).filter((i) => bintang[i])
    let kunci = c.kunciDariBaris

    if (kunci && dariBintang.length > 0) {
      const a = kunci.split(",").map(Number).sort((x, y) => x - y).join(",")
      const b = dariBintang.join(",")
      if (a !== b) {
        catatan.push(`Soal ${nomor} "${cuplik}": tanda * dan baris Jawaban: tidak sama - dipakai baris Jawaban:`)
      }
    } else if (!kunci && dariBintang.length > 0) {
      kunci = dariBintang.join(",")
    }

    if (!kunci) {
      catatan.push(`Soal ${nomor} "${cuplik}": kunci belum ada - beri * pada jawaban benar atau baris Jawaban:`)
    }

    const jumlahKunci = kunci ? kunci.split(",").filter(Boolean).length : 0
    if (!c.dipaksa) {
      tipe = jumlahKunci > 1 ? "PG_KOMPLEKS" : "PG"
    } else if (tipe === "PG" && jumlahKunci > 1) {
      tipe = "PG_KOMPLEKS"
    }

    // Selalu sediakan lima kolom opsi (A–E) agar formulir tidak timpang.
    while (isi.length < 5) isi.push("")

    soal.push({
      question: c.question.trim(),
      imageUrl: normalisasiUrlGambar(c.imageUrl),
      type: tipe as "PG" | "PG_KOMPLEKS",
      options: isi,
      correctAnswer: kunci ?? "",
      points: c.points,
    })
  }

  for (const raw of lines) {
    const t = raw.trim()
    if (!t) continue

    // --- soal baru: "1." / "1)" tetapi bukan "1. " di dalam opsi ---
    if (/^\d+[.)]/.test(t)) {
      tutup()
      current = {
        question: t.replace(/^\d+[.)]\s*/, ""),
        imageUrl: "",
        type: "PG",
        options: [],
        correctAnswer: "",
        points: 10,
        teksSelesai: false,
        dipaksa: false,
        bintang: [],
        tandaBS: [],
        kunciDariBaris: null,
      }
      continue
    }
    if (!current) continue

    // --- gambar ---
    const mGambar = t.match(/^(gambar|image|img|foto)\s*[:=]\s*(\S+)/i)
    if (mGambar) {
      current.imageUrl = mGambar[2]
      continue
    }
    const mMd = t.match(/^!\[[^\]]*\]\((\S+)\)/)
    if (mMd) {
      current.imageUrl = mMd[1]
      continue
    }
    if (!current.imageUrl && isTautanGambar(t)) {
      current.imageUrl = t
      continue
    }

    // --- bobot ---
    const mPoin = t.match(/^(poin|point|bobot|skor)\s*[:=]\s*(\d+)/i)
    if (mPoin) {
      const n = parseInt(mPoin[2], 10)
      if (n > 0) current.points = n
      current.teksSelesai = true
      continue
    }

    // --- paksa tipe ---
    if (/^(esai|essay|uraian)\s*$/i.test(t)) {
      current.type = "ESAI"
      current.dipaksa = true
      current.teksSelesai = true
      continue
    }
    if (/^(benar\s*[\/-]\s*salah|b\s*\/\s*s|bs|true\s*[\/-]\s*false)\s*$/i.test(t)) {
      current.type = "BENAR_SALAH"
      current.dipaksa = true
      current.teksSelesai = true
      continue
    }

    // --- kunci jawaban lewat baris ---
    const mJawab = t.match(/^(jawaban|kunci|answer)\s*[:=]\s*(.+)$/i)
    if (mJawab) {
      const bagian = mJawab[2]
        .toUpperCase()
        .split(/[,;/ ]+/)
        .map((x) => x.trim().replace(/[.)]$/, ""))
        .filter(Boolean)

      const tokenBS = bagian.map((x) =>
        x === "BENAR" || x === "TRUE" || x === "T" ? "B" : x === "SALAH" || x === "FALSE" || x === "F" ? "S" : x
      )
      const adaTandaBS = bagian.some((x) => ["S", "SALAH", "BENAR", "TRUE", "FALSE", "T", "F"].includes(x))
      const semuaBS = tokenBS.every((x) => x === "B" || x === "S")

      if (current.type === "BENAR_SALAH" || stemTerlihatBS(current.question) || (adaTandaBS && semuaBS)) {
        current.type = "BENAR_SALAH"
        if (semuaBS) current.kunciDariBaris = tokenBS.join(",")
        else catatan.push(`Kunci Benar/Salah "${mJawab[2].trim()}" hanya boleh B atau S`)
        current.teksSelesai = true
        continue
      }

      const indeks = Array.from(
        new Set(
          bagian
            .map((x) => (/^[A-H]$/.test(x) ? HURUF.indexOf(x) : Number(x) - 1))
            .filter((n) => Number.isInteger(n) && n >= 0)
        )
      ).sort((a, b) => a - b)

      if (indeks.length === 0) catatan.push(`Jawaban "${mJawab[2].trim()}" tidak dikenali`)
      else current.kunciDariBaris = indeks.join(",")
      current.teksSelesai = true
      continue
    }

    // --- opsi A–H, dengan bintang di awal atau akhir ---
    const mOpsi = t.match(/^\*?\s*([A-H])[.)]\s*(.*)$/i)
    if (mOpsi) {
      const p = pisahPenanda(mOpsi[2])
      const bintangAwal = /^\*/.test(t)
      current.options.push(p.teks)
      current.bintang.push(p.bintang || bintangAwal)
      current.tandaBS.push(p.bs)
      continue
    }

    // --- pernyataan Benar/Salah berawalan "-" atau "•" ---
    // Hanya dianggap pernyataan bila soalnya memang Benar/Salah (dipaksa,
    // atau stemnya jelas). Di soal lain, baris "-" adalah lanjutan teks.
    const mPernyataan = t.match(/^[-•]\s*(.+)$/)
    if (mPernyataan && (current.type === "BENAR_SALAH" || stemTerlihatBS(current.question))) {
      const p = pisahPenanda(mPernyataan[1])
      current.options.push(p.teks)
      current.bintang.push(p.bintang)
      current.tandaBS.push(p.bs)
      continue
    }

    // --- lanjutan teks soal ---
    if (!current.teksSelesai && current.options.length === 0) {
      current.question += " " + t
    }
  }
  tutup()

  return { soal, catatan }
}
