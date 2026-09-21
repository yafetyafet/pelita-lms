import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /**
   * Hasil build mandiri untuk dijalankan di luar Vercel.
   *
   * Menghasilkan `.next/standalone` berisi server beserta HANYA dependensi
   * yang benar-benar dipakai saat berjalan - sekitar 200 MB, bukan 920 MB
   * `node_modules` penuh. Ini yang membuat aplikasi bisa dibangun di komputer
   * sekolah lalu dikirim ke server, tanpa perlu `npm install` di sana.
   *
   * Tidak mengganggu penempatan di Vercel: Vercel memakai jalur build-nya
   * sendiri dan mengabaikan berkas standalone ini.
   */
  output: "standalone",
};

export default nextConfig;
