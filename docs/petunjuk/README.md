# Buku Petunjuk Penggunaan PELITA

`Petunjuk-Penggunaan-PELITA.pdf` — 37 halaman A4, mencakup seluruh peran
(siswa, guru, admin, DUDI) beserta tangkapan layar aslinya.

## Cara membuat ulang

1. **Isi data demo.** Semua barisnya diberi penanda `DEMO` / awalan `demo.`
   supaya tidak ada data siswa sungguhan yang ikut terekam.
2. **Ambil tangkapan layar** memakai Chrome yang sudah terpasang
   (puppeteer-core), login lewat formulir sungguhan dengan akun demo.
   Halaman siswa diambil pada 420x900 (tampilan ponsel), halaman guru dan
   admin pada 1280x900, keduanya `deviceScaleFactor: 2`.
3. **Susun PDF:**

   ```
   python docs/petunjuk/buat-petunjuk.py
   chrome.exe --headless --disable-gpu --no-pdf-header-footer \
     --print-to-pdf="docs/petunjuk/Petunjuk-Penggunaan-PELITA.pdf" \
     --virtual-time-budget=30000 \
     "file:///D:/LMS/docs/petunjuk/Petunjuk-Penggunaan-PELITA.html"
   ```

4. **Hapus data demo** dari basis data begitu tangkapan layar selesai.

Skrip pengisi dan penghapus data demo sengaja tidak disimpan di repo: keduanya
menulis langsung ke basis data produksi dan tidak boleh sampai terjalankan
tanpa sengaja. Berkas HTML perantara juga tidak ikut dikomit karena ukurannya
~11 MB (gambar tertanam base64) dan selalu bisa dibuat ulang dari
`buat-petunjuk.py`.
