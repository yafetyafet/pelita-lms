"use client"

import React from "react"
import type { ProfilSekolah } from "@/app/actions/sekolah"

/**
 * Kop surat resmi di atas setiap laporan cetak.
 *
 * Logo memakai <img> biasa, bukan next/image, karena sumbernya tautan bebas
 * yang diisi admin — next/image menuntut domainnya didaftarkan lebih dulu di
 * next.config, dan itu tidak praktis untuk nilai yang bisa berubah kapan saja.
 */
/**
 * Satu slot logo pada kop.
 *
 * Ruangnya SELALU disediakan meski logonya kosong, supaya blok teks di tengah
 * tetap benar-benar di tengah - kop dengan satu logo saja akan terlihat
 * miring kalau sisi yang kosong ikut menghilang.
 *
 * `onError` menyembunyikan gambar yang gagal dimuat: tautan yang salah lebih
 * baik menyisakan ruang kosong daripada ikon gambar rusak di tengah dokumen
 * resmi yang akan ditandatangani kepala sekolah.
 */
function SlotLogo({ url, alt }: { url: string; alt: string }) {
  if (!url) {
    return (
      <div
        className="w-20 h-20 shrink-0"
        aria-hidden
        data-slot-logo-kosong
      />
    )
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt={alt}
      className="w-20 h-20 object-contain shrink-0"
      onError={(e) => {
        e.currentTarget.style.visibility = "hidden"
      }}
    />
  )
}

export function KopSurat({ profil }: { profil: ProfilSekolah }) {
  const adaKontak = profil.telepon || profil.email || profil.website

  return (
    <header className="border-b-[3px] border-black pb-2 mb-4">
      <div className="flex items-center gap-4">
        <SlotLogo url={profil.logoUrl} alt="Logo pemerintah/yayasan" />

        <div className="flex-1 text-center leading-tight">
          {profil.namaYayasan && (
            <p className="text-[13px] font-semibold uppercase tracking-wide">
              {profil.namaYayasan}
            </p>
          )}
          <h1 className="text-xl font-bold uppercase tracking-wide">
            {profil.namaSekolah}
          </h1>
          {profil.alamat && (
            <p className="text-[11px] mt-0.5">{profil.alamat}</p>
          )}
          {adaKontak && (
            <p className="text-[11px]">
              {[
                profil.telepon && `Telp. ${profil.telepon}`,
                profil.email,
                profil.website,
              ]
                .filter(Boolean)
                .join(" · ")}
            </p>
          )}
          {profil.npsn && (
            <p className="text-[11px]">NPSN: {profil.npsn}</p>
          )}
        </div>

        <SlotLogo url={profil.logoKananUrl} alt="Logo sekolah" />
      </div>
    </header>
  )
}

/** Judul laporan beserta keterangan di bawah kop. */
export function JudulLaporan({
  judul,
  baris,
}: {
  judul: string
  baris: { label: string; nilai: string }[]
}) {
  return (
    <div className="mb-4">
      <h2 className="text-center text-base font-bold uppercase underline underline-offset-4 mb-3">
        {judul}
      </h2>
      <table className="text-[12px]">
        <tbody>
          {baris
            .filter((b) => b.nilai)
            .map((b) => (
              <tr key={b.label}>
                <td className="pr-2 align-top whitespace-nowrap">{b.label}</td>
                <td className="pr-2 align-top">:</td>
                <td className="align-top font-semibold">{b.nilai}</td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  )
}

/**
 * Blok tanda tangan dua kolom: kepala sekolah di kiri, guru di kanan —
 * susunan lazim pada dokumen sekolah di Indonesia.
 */
export function BlokTandaTangan({
  profil,
  namaGuru,
  nipGuru,
  jabatanKanan = "Guru Mata Pelajaran",
  tanggal,
}: {
  profil: ProfilSekolah
  namaGuru: string
  nipGuru?: string | null
  jabatanKanan?: string
  tanggal?: Date
}) {
  const tgl = (tanggal ?? new Date()).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })

  const Kolom = ({
    jabatan,
    nama,
    nip,
    tempatTanggal,
  }: {
    jabatan: string
    nama: string
    nip?: string | null
    tempatTanggal?: string
  }) => (
    <div className="text-[12px] leading-relaxed">
      {/* Baris tempat-tanggal hanya di kolom kanan, sesuai kelaziman surat. */}
      <p className="h-5">{tempatTanggal || " "}</p>
      <p>{jabatan},</p>
      {/* Ruang tanda tangan basah */}
      <div className="h-20" />
      <p className="font-bold underline underline-offset-2">
        {nama || "........................................"}
      </p>
      <p>NIP. {nip || "........................................"}</p>
    </div>
  )

  return (
    <section className="mt-8 grid grid-cols-2 gap-8 hindari-potong">
      <Kolom
        jabatan="Kepala Sekolah"
        nama={profil.kepalaSekolah}
        nip={profil.nipKepalaSekolah}
      />
      <Kolom
        jabatan={jabatanKanan}
        nama={namaGuru}
        nip={nipGuru}
        tempatTanggal={`${profil.kotaTandaTangan || "..........."}, ${tgl}`}
      />
    </section>
  )
}

/** Peringatan bila identitas sekolah belum diisi — hanya tampil di layar. */
export function PeringatanProfil({ profil }: { profil: ProfilSekolah }) {
  const kurang: string[] = []
  if (!profil.kepalaSekolah) kurang.push("nama kepala sekolah")
  if (!profil.nipKepalaSekolah) kurang.push("NIP kepala sekolah")
  if (!profil.alamat) kurang.push("alamat")
  if (!profil.logoUrl && !profil.logoKananUrl) kurang.push("logo kop")

  if (kurang.length === 0) return null

  return (
    <div
      data-no-cetak
      className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-[11px] text-amber-900 leading-relaxed mb-3"
    >
      <strong className="block">Identitas sekolah belum lengkap.</strong>
      Belum diisi: {kurang.join(", ")}. Bagian itu akan tercetak sebagai titik-titik.
      Admin dapat melengkapinya di menu <strong>Identitas Sekolah</strong>.
    </div>
  )
}
