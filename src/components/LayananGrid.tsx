"use client"

import React from "react"
import Link from "next/link"
import type { LucideIcon } from "lucide-react"

/**
 * Grid menu beranda: dua baris terlihat, sisanya digulir di dalam kotaknya.
 *
 * Sebelumnya seluruh modul dirender apa adanya dalam satu grid tanpa batas
 * tinggi. Begitu jumlahnya melewati delapan, barisnya terus memanjang dan
 * mendorong seluruh isi beranda berikutnya (jadwal, tugas, pengumuman) turun
 * jauh ke bawah layar ponsel. Kini tinggi grid dipatok dua baris - delapan
 * modul di ponsel - dan modul selebihnya dicapai dengan menggulir grid itu
 * saja, tanpa mengganggu tata letak halaman.
 */

export type ItemLayanan = {
  id: string
  title: string
  subtitle?: string | null
  icon: LucideIcon
  /** Kelas gradien Tailwind, mis. "from-sky-500 to-blue-600". */
  color: string
  badge?: string | number | null
  href?: string
  onClick?: () => void
}

const MAKS_TERLIHAT = 8

export function LayananGrid({
  items,
  accent = "blue",
}: {
  items: ItemLayanan[]
  /** Warna sorot saat kartu disentuh; menyesuaikan tema tiap peran. */
  accent?: "blue" | "emerald"
}) {
  const tersembunyi = Math.max(0, items.length - MAKS_TERLIHAT)
  const border =
    accent === "emerald" ? "hover:border-emerald-300" : "hover:border-blue-300"

  const isi = (item: ItemLayanan) => {
    const Icon = item.icon
    return (
      <>
        <div className="relative mb-1.5">
          <div
            className={`w-11 h-11 rounded-2xl bg-gradient-to-tr ${item.color} flex items-center justify-center text-white shadow-sm shadow-slate-300 group-hover:scale-105 transition-transform`}
          >
            <Icon className="w-5 h-5 stroke-[2.2px]" />
          </div>
          {item.badge ? (
            <span className="absolute -top-1 -right-1 text-[9px] font-extrabold px-1.5 py-0.5 rounded-full bg-red-500 text-white shadow-sm">
              {item.badge}
            </span>
          ) : null}
        </div>
        <span className="text-[11px] font-semibold text-slate-800 leading-tight line-clamp-1">
          {item.title}
        </span>
        <span className="text-[9px] text-slate-400 mt-0.5 line-clamp-1 font-medium">
          {item.subtitle}
        </span>
      </>
    )
  }

  const kelasKartu = `group flex flex-col items-center text-center p-2 rounded-2xl bg-white border border-slate-200/70 ${border} hover:shadow-md transition-all active:scale-95`

  return (
    <div className="relative">
      <div
        // grid-rows-[repeat(2,auto)] tidak bisa dipakai untuk memotong tinggi,
        // jadi tinggi baris dipatok agar batas dua baris bisa dihitung pasti.
        className="grid grid-cols-4 md:grid-cols-8 gap-2.5 auto-rows-[6.5rem] max-h-[13.625rem] md:max-h-none overflow-y-auto overscroll-contain pr-0.5"
      >
        {items.map((item) =>
          item.href ? (
            <Link key={item.id} href={item.href} className={kelasKartu}>
              {isi(item)}
            </Link>
          ) : (
            <button
              key={item.id}
              type="button"
              onClick={item.onClick}
              className={kelasKartu}
            >
              {isi(item)}
            </button>
          )
        )}
      </div>

      {tersembunyi > 0 && (
        <p className="md:hidden text-[10px] text-slate-400 text-center mt-1.5">
          Gulir di area menu untuk {tersembunyi} modul lainnya
        </p>
      )}
    </div>
  )
}
