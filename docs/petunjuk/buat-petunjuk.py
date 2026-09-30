"""
Susun buku petunjuk PELITA LMS menjadi satu berkas HTML, lalu dicetak ke PDF
oleh Chrome (lihat perintah di akhir berkas ini).

Tangkapan layar diambil oleh tangkap-layar.mjs dari aplikasi yang benar-benar
berjalan, memakai akun demo - bukan tiruan, dan tanpa data siswa asli.
"""
import base64
import io
import os
import html as H

GAMBAR = os.path.join(os.path.dirname(__file__), 'gambar')
KELUAR = os.path.join(os.path.dirname(__file__), 'Petunjuk-Penggunaan-PELITA.html')
TANGGAL = '23 September 2026'


def img(nama, lebar='100%'):
    """Sematkan gambar sebagai data URI supaya PDF-nya satu berkas mandiri."""
    p = os.path.join(GAMBAR, nama + '.png')
    if not os.path.exists(p):
        return f'<p class="hilang">[gambar {nama} belum tersedia]</p>'
    with open(p, 'rb') as f:
        b64 = base64.b64encode(f.read()).decode()
    return f'<img class="ss" style="max-width:{lebar}" src="data:image/png;base64,{b64}" alt="">'


def langkah(*isi):
    li = ''.join(f'<li>{x}</li>' for x in isi)
    return f'<ol class="langkah">{li}</ol>'


def catatan(teks, jenis='info'):
    label = {'info': 'Catatan', 'awas': 'Perhatian', 'tips': 'Tips'}[jenis]
    return f'<div class="kotak {jenis}"><strong>{label}.</strong> {teks}</div>'


def bagian(nomor, judul, isi):
    return f'<section class="bab"><h1><span class="nomor">{nomor}</span>{judul}</h1>{isi}</section>'


def fitur(judul, gambar, isi, lebar='100%'):
    g = img(gambar, lebar) if gambar else ''
    return f'<div class="fitur"><h3>{judul}</h3>{isi}{g}</div>'


# =====================================================================
# ISI
# =====================================================================

sampul = f'''
<section class="sampul">
  {img('_logo', '150px')}
  <h1>Petunjuk Penggunaan</h1>
  <div class="nama">PELITA</div>
  <p class="tagline">Platform Edukasi, Layanan Informasi, dan Tata Kelola Akademik</p>
  <p class="sekolah">SMK Negeri 1 Kemangkon</p>
  <div class="alamat">pelita.smkn1kemangkon.sch.id</div>
  <p class="versi">Untuk peran Siswa, Guru, Admin, dan Mitra DUDI<br>Edisi {TANGGAL}</p>
</section>
'''

daftar_isi = '''
<section class="bab daftar-isi">
  <h1><span class="nomor">&nbsp;</span>Daftar Isi</h1>
  <ol class="toc">
    <li><span>Sebelum Mulai</span></li>
    <li><span>Masuk ke Aplikasi</span></li>
    <li><span>Panduan Siswa</span></li>
    <li><span>Panduan Guru</span></li>
    <li><span>Panduan Admin</span></li>
    <li><span>Panduan Mitra DUDI</span></li>
    <li><span>Masalah yang Sering Terjadi</span></li>
    <li><span>Daftar Istilah</span></li>
  </ol>
</section>
'''

# ---------------------------------------------------------------- 1
b1 = bagian(1, 'Sebelum Mulai', f'''
<p>PELITA adalah aplikasi sekolah yang dipakai dari <strong>telepon genggam maupun
komputer</strong>. Tidak perlu memasang aplikasi dari Play Store — cukup buka
alamatnya lewat peramban (Chrome, Edge, atau Safari).</p>

<table class="tabel">
  <tr><th>Alamat</th><td><code>https://pelita.smkn1kemangkon.sch.id</code></td></tr>
  <tr><th>Perangkat</th><td>HP Android/iPhone, laptop, atau komputer sekolah</td></tr>
  <tr><th>Peramban</th><td>Chrome, Edge, atau Safari versi terbaru</td></tr>
  <tr><th>Akun</th><td>Diberikan oleh sekolah. Hubungi wali kelas atau admin bila belum punya</td></tr>
</table>

<h3>Empat peran, empat tampilan berbeda</h3>
<table class="tabel">
  <tr><th>Siswa</th><td>Presensi, jadwal, materi, tugas, ujian, pembiasaan, buku disiplin</td></tr>
  <tr><th>Guru</th><td>Jurnal mengajar, tugas, presensi kelas, ujian, penilaian, cetak laporan</td></tr>
  <tr><th>Admin</th><td>Pengguna, rombel, mapel, jadwal, pengaturan sekolah, backup</td></tr>
  <tr><th>Mitra DUDI</th><td>Pemantauan siswa PKL di tempat industri</td></tr>
</table>

{catatan('Menu yang muncul menyesuaikan peran akun Anda. Siswa tidak akan melihat menu guru, begitu pula sebaliknya. Ini bukan kerusakan.')}

<h3>Memasang pintasan di layar utama HP</h3>
{langkah(
  'Buka <code>pelita.smkn1kemangkon.sch.id</code> di Chrome.',
  'Tekan tombol titik tiga di pojok kanan atas.',
  'Pilih <strong>Tambahkan ke layar utama</strong> (Add to Home screen).',
  'Setelah itu PELITA bisa dibuka seperti aplikasi biasa, lengkap dengan ikon obornya.',
)}
{catatan('Sangat disarankan sebelum hari ujian. Membuka aplikasi sekali sebelumnya membuat peramban menyimpan berkasnya, sehingga saat ujian halaman terbuka jauh lebih cepat.', 'tips')}
''')

# ---------------------------------------------------------------- 2
b2 = bagian(2, 'Masuk ke Aplikasi', f'''
{langkah(
  'Buka <code>pelita.smkn1kemangkon.sch.id</code>.',
  'Isi <strong>Username</strong> — untuk siswa biasanya NIS, untuk guru NIP atau nama pengguna yang diberikan sekolah.',
  'Isi <strong>Password</strong>. Tekan ikon mata untuk memastikan ketikan benar.',
  'Tekan <strong>Masuk</strong>. Aplikasi otomatis membuka halaman sesuai peran Anda.',
)}
{img('login', '340px')}

{catatan('Huruf besar/kecil pada username tidak berpengaruh, tetapi pada password <strong>berpengaruh</strong>. Pastikan tombol Caps Lock tidak menyala.', 'awas')}

<h3>Lupa password</h3>
<p>Password tidak bisa diatur ulang sendiri. Hubungi <strong>wali kelas</strong> atau
<strong>admin sekolah</strong> — admin dapat menggantinya lewat menu Kelola Pengguna.</p>

<h3>Keluar (logout)</h3>
<p>Tekan ikon keluar berwarna merah di pojok kanan atas beranda. Selalu lakukan ini
bila memakai komputer bersama, misalnya di laboratorium.</p>
''')

# ---------------------------------------------------------------- 3 SISWA
b3 = bagian(3, 'Panduan Siswa', f'''
<p>Beranda siswa memuat kartu presensi di bagian atas, delapan modul Layanan
Akademik, lalu jadwal dan tugas terdekat.</p>
{img('siswa-beranda', '340px')}
{catatan('Modul yang tampil maksimal delapan. Bila menunya lebih banyak, <strong>geser di area menu</strong> untuk melihat sisanya.', 'tips')}

''' + fitur('3.1 Presensi Masuk dan Pulang', 'siswa-presensi', f'''
<p>Presensi memakai GPS. Aplikasi memeriksa apakah Anda benar-benar berada di area sekolah.</p>
{langkah(
  'Buka menu <strong>Presensi</strong>.',
  'Izinkan akses lokasi saat peramban bertanya. Tanpa izin ini presensi tidak bisa diverifikasi.',
  'Tunggu sampai status berubah menjadi <strong>Berada di area…</strong> beserta jaraknya.',
  'Tekan <strong>Kirim Presensi Hadir</strong>.',
  'Saat pulang, buka menu yang sama dan tekan <strong>Kirim Presensi Pulang</strong>.',
)}
{catatan('Sekolah memiliki dua gedung. Presensi sah bila Anda berada di <strong>salah satu</strong> gedung — aplikasi otomatis memilih yang terdekat.')}
{catatan('Presensi pulang baru terbuka mengikuti <strong>jam pelajaran terakhir hari itu</strong> (Senin 15:10, Jumat 14:00). Jam ini tertera di bagian bawah halaman presensi.')}
{catatan('Bila lokasi tidak terdeteksi atau Anda di luar radius, presensi tetap bisa dikirim dan ditandai <em>perlu ditinjau</em> — guru piket yang memutuskan. Jangan panik.', 'awas')}
''', '340px')

+ fitur('3.2 Jadwal Pelajaran', 'siswa-jadwal', f'''
<p>Menampilkan jadwal satu pekan: hari, jam, mata pelajaran, guru pengampu, dan ruang.</p>
{catatan('Jadwal diisi oleh guru masing-masing. Bila ada mapel yang belum muncul, gurunya belum mengambil jam mengajar — laporkan ke wali kelas.')}
''', '340px')

+ fitur('3.3 Materi Belajar', 'siswa-materi', f'''
{langkah(
  'Buka menu <strong>Materi Belajar</strong>.',
  'Pilih materi dari daftar di sebelah atas.',
  'Video YouTube diputar langsung di halaman; berkas Google Drive dibuka di tab baru.',
)}
''', '340px')

+ fitur('3.4 Tugas dan Kuis', 'siswa-tugas', f'''
{langkah(
  'Buka menu <strong>Tugas & Kuis</strong>. Tugas diurutkan dari tenggat terdekat.',
  'Tekan tugas yang ingin dikerjakan.',
  'Tulis jawaban pada kolom yang tersedia, atau lampirkan tautan berkas.',
  'Tekan <strong>Kumpulkan</strong>.',
)}
{catatan('Status tugas: <strong>Belum dikerjakan</strong>, <strong>Terkumpul</strong>, <strong>Terlambat</strong>, atau <strong>Dinilai</strong> beserta nilainya.')}
''', '340px')

+ fitur('3.5 Ujian CBT', 'siswa-ujian', f'''
<p>Ini menu yang paling perlu dipahami sebelum hari ujian.</p>
{langkah(
  'Buka menu <strong>Ujian</strong>. Ujian yang sudah diterbitkan guru akan tampil.',
  'Tekan ujian yang akan dikerjakan.',
  'Masukkan <strong>token</strong> yang diumumkan pengawas, lalu tekan Mulai.',
  'Kerjakan soal. Gunakan nomor soal di bagian bawah untuk berpindah.',
  'Tandai <strong>Ragu-ragu</strong> pada soal yang ingin ditinjau ulang.',
  'Setelah selesai, tekan <strong>Kumpulkan</strong>.',
)}
<h4>Empat bentuk soal</h4>
<table class="tabel">
  <tr><th>Pilihan Ganda</th><td>Pilih <strong>satu</strong> jawaban benar</td></tr>
  <tr><th>PG Kompleks</th><td>Jawaban benar <strong>lebih dari satu</strong> — pilih semuanya. Dinilai utuh</td></tr>
  <tr><th>Benar / Salah</th><td>Beberapa pernyataan; tiap pernyataan dinilai Benar atau Salah. Bentuk yang dipakai TKA</td></tr>
  <tr><th>Esai</th><td>Jawaban uraian, dinilai guru setelah ujian selesai</td></tr>
</table>
{catatan('Jawaban tersimpan otomatis di HP Anda. Bila halaman tertutup atau HP mati, masuk lagi dan jawaban sebelumnya dipulihkan.', 'tips')}
{catatan('Jangan berganti HP di tengah ujian, dan jangan membersihkan data peramban — jawaban tersimpan di perangkat itu saja dan tidak ikut berpindah.', 'awas')}
{catatan('Waktu pengerjaan dihitung di server. Menutup aplikasi <strong>tidak</strong> menghentikan hitungan. Berpindah ke aplikasi lain akan tercatat dan dilaporkan ke pengawas.', 'awas')}
''', '340px')

+ fitur('3.6 Jurnal Pembiasaan', 'siswa-pembiasaan', f'''
<p>Catatan kebiasaan baik harian. Wali kelas dapat melihatnya sebagai bahan pembinaan.</p>
{langkah(
  'Pilih jenis pembiasaan: <strong>Ibadah</strong>, <strong>Literasi</strong>, <strong>Kebersihan</strong>, atau <strong>Sosial</strong>.',
  'Tulis kegiatannya, misalnya &ldquo;Membaca buku 15 menit&rdquo;.',
  'Tambahkan refleksi bila ingin, lalu tekan <strong>Simpan Catatan</strong>.',
)}
''', '340px')

+ fitur('3.7 Buku Disiplin', 'siswa-disiplin', f'''
<p>Menampilkan catatan pelanggaran beserta poinnya, dan daftar acuan jenis
pelanggaran yang berlaku di sekolah.</p>
{catatan('Poin yang tercatat tidak berubah meski sekolah mengubah nilai poin di kemudian hari — setiap catatan menyimpan poinnya sendiri saat dibuat.')}
''', '340px')

+ fitur('3.8 Perpustakaan, Forum, dan Profil', None, f'''
<div class="dua-kolom">{img('siswa-perpustakaan', '250px')}{img('siswa-forum', '250px')}{img('siswa-profil', '250px')}</div>
<p><strong>Perpustakaan Digital</strong> — daftar e-book dan jurnal yang bisa diunduh.</p>
<p><strong>Forum Diskusi</strong> — tempat bertanya kepada guru dan teman sekelas.</p>
<p><strong>Profil</strong> — data diri, rombel, wali kelas, dan tombol ganti password.</p>
{catatan('Ganti password Anda pada saat pertama kali masuk, terutama bila password awal diberikan seragam oleh sekolah.', 'tips')}
''')
)

# ---------------------------------------------------------------- 4 GURU
b4 = bagian(4, 'Panduan Guru', f'''
<p>Beranda guru memuat pengingat jurnal harian, daftar kelas yang diampu, dan dua
belas modul manajemen.</p>
{img('guru-beranda')}

''' + fitur('4.1 Menentukan Kelas dan Mapel yang Diampu', 'guru-kelas', f'''
<p><strong>Langkah pertama bagi guru baru.</strong> Selama belum mengambil kelas,
hampir semua menu lain akan kosong.</p>
{langkah(
  'Buka menu <strong>Kelas Saya</strong>.',
  'Pilih rombel dan mata pelajaran yang Anda ampu.',
  'Tekan <strong>Ambil</strong>. Berlaku seketika, tanpa menunggu persetujuan admin.',
  'Ulangi untuk setiap kombinasi kelas dan mapel yang Anda ampu.',
)}
{catatan('Satu guru boleh mengampu beberapa mapel, dan satu mapel boleh diampu beberapa guru di kelas berbeda.')}
''')

+ fitur('4.2 Jadwal Mengajar', 'guru-jadwal', f'''
<p>Jam pelajaran sudah ditetapkan admin. Guru tinggal mengambil sesi yang tersedia.</p>
{langkah(
  'Buka menu <strong>Jadwal Mandiri</strong>.',
  'Pilih hari.',
  'Centang sesi yang diambil. Untuk mapel 2–3 jam pelajaran, centang beberapa sesi <strong>berurutan</strong>.',
  'Pilih kelas &amp; mapel, isi ruang, lalu tekan <strong>Ambil Jam Ini</strong>.',
)}
{catatan('Sesi yang sudah Anda ambil ditandai &ldquo;sudah diambil&rdquo;. Bentrok dengan guru lain, kelas lain, atau ruang yang sama akan ditolak beserta alasannya.')}
{catatan('Jam istirahat tampil sebagai pembatas dan tidak bisa dipilih, tetapi blok dua jam yang terpisah istirahat tetap boleh diambil sekaligus.')}
''')

+ fitur('4.3 Jurnal Mengajar', 'guru-jurnal', f'''
{langkah(
  'Buka <strong>Jurnal Mengajar</strong>, atau tekan <strong>Isi Jurnal Cepat</strong> di beranda.',
  'Pilih kelas dan mapel, isi jam ke berapa, judul materi, dan uraian kegiatan.',
  'Isi jumlah siswa hadir.',
  'Tekan Simpan.',
)}
''')

+ fitur('4.4 Memberi dan Menilai Tugas', 'guru-tugas', f'''
{langkah(
  'Buka menu <strong>Beri Tugas</strong>, tekan tombol <strong>Beri Tugas</strong>.',
  'Pilih kelas &amp; mapel, tulis judul dan instruksi.',
  'Tentukan batas pengumpulan dan nilai maksimal.',
  'Tentukan apakah pengumpulan terlambat masih diterima.',
  'Tekan <strong>Beri Tugas</strong> — langsung tampil di akun siswa.',
)}
<p>Untuk menilai: tekan <strong>Periksa &amp; Nilai</strong> pada tugas, lalu isi nilai tiap siswa.</p>
{catatan('Angka &ldquo;x dari y siswa mengumpulkan&rdquo; hanya menghitung yang benar-benar mengirim jawaban, bukan yang sekadar membuka tugas.')}
''')

+ fitur('4.5 Presensi Kelas', 'guru-presensi', f'''
<p>Untuk mencatat kehadiran secara manual — misalnya siswa sakit, izin, atau HP-nya bermasalah.</p>
{langkah(
  'Buka <strong>Presensi Kelas</strong>, pilih kelas dan tanggal.',
  'Tentukan status tiap siswa: Hadir, Sakit, Izin, atau Alfa.',
  'Tekan Simpan.',
)}
''')

+ fitur('4.6 Membuat Ujian CBT', 'guru-ujian', f'''
<p>Ada tiga cara memasukkan soal. Cara <strong>tempel</strong> paling cepat untuk soal
yang sudah diketik di Word.</p>
<h4>Cara A — tempel dari Word (disarankan)</h4>
{langkah(
  'Buka <strong>Ujian</strong> → <strong>Buat Ujian</strong> → tab <strong>Tempel</strong>.',
  'Salin seluruh soal dari Word, tempel ke kotak besar.',
  'Tekan <strong>Import Soal</strong>. Aplikasi mendeteksi sendiri jenis tiap soal.',
)}
<h4>Menandai jawaban benar dengan tanda bintang</h4>
<pre class="kode">1. Apa itu HTML?
A. Bahasa markup *
B. Bahasa pemrograman
C. Database

2. Manakah topologi jaringan?
A. Star *
B. Bus *
C. HTTP
D. Ring *

3. Tentukan benar atau salah pernyataan berikut.
- Switch bekerja pada lapisan data link *
- Alamat IPv4 terdiri dari 128 bit
- Router menghubungkan dua jaringan berbeda *

4. Jelaskan perbedaan HUB dan SWITCH.
Poin: 20</pre>
<table class="tabel">
  <tr><th>Satu bintang</th><td>menjadi Pilihan Ganda biasa</td></tr>
  <tr><th>Dua bintang atau lebih</th><td>otomatis menjadi PG Kompleks</td></tr>
  <tr><th>Soal tanpa opsi</th><td>otomatis menjadi Esai</td></tr>
  <tr><th>Soal berbunyi &ldquo;benar atau salah&rdquo; + baris diawali <code>-</code></th><td>menjadi soal Benar/Salah; yang berbintang berarti BENAR</td></tr>
</table>
{catatan('Bintang boleh ditulis di awal (<code>*A. Semarang</code>) maupun akhir (<code>A. Semarang *</code>). Cara lama memakai baris <code>Jawaban: A,B,D</code> tetap berfungsi.', 'tips')}

<h4>Cara B — unggah Excel</h4>
<p>Tekan <strong>Unduh Templat</strong>, isi kolomnya, lalu unggah kembali. Templat berisi
lembar Petunjuk beserta contoh tiap jenis soal.</p>

<h4>Cara C — ketik satu per satu</h4>
<p>Tab <strong>Manual</strong>, tambahkan soal satu demi satu.</p>

<h4>Gambar pada soal</h4>
{langkah(
  'Unggah gambar ke Google Drive.',
  'Klik kanan berkas → <strong>Bagikan</strong> → ubah menjadi <strong>&ldquo;Siapa saja yang memiliki link&rdquo;</strong>.',
  'Salin tautannya apa adanya, tempel ke kolom gambar atau baris <code>Gambar:</code>.',
)}
{catatan('Aplikasi otomatis mengubah tautan Drive menjadi tautan gambar langsung. Yang wajib Anda lakukan hanyalah mengatur izin berbaginya — bila masih &ldquo;Terbatas&rdquo;, gambar tidak akan muncul di HP siswa.', 'awas')}

<h4>Menerbitkan ujian</h4>
{langkah(
  'Pada daftar ujian, tekan label <strong>DRAF</strong> untuk menerbitkannya.',
  'Pastikan token sudah diisi — lewat <strong>Kelola</strong> untuk token khusus ujian, atau token CBT global dari admin.',
  'Ujian berstatus DRAF <strong>tidak tampil</strong> di akun siswa.',
)}
{catatan('Menu <strong>Kelola</strong> pada tiap ujian berisi penyunting soal: mengubah teks, gambar, jenis soal, kunci jawaban, dan bobot; menambah dan menghapus soal. Setelah mengubah kunci pada ujian yang sudah dikerjakan, jalankan <strong>Hitung Ulang</strong>.')}
''')

+ fitur('4.7 Rekap Penilaian', 'guru-nilai', f'''
<p>Rekap nilai seluruh tugas dan ujian per kelas dan mapel, siap disalin ke
administrasi sekolah.</p>
''')

+ fitur('4.8 Cetak Laporan', 'guru-cetak', f'''
<p>Mencetak tiga jenis laporan lengkap dengan kop sekolah dan ruang tanda tangan
kepala sekolah.</p>
{langkah(
  'Buka <strong>Cetak Laporan</strong>.',
  'Pilih jenis: <strong>Jurnal Pembelajaran</strong>, <strong>Nilai</strong>, atau <strong>Kehadiran</strong>.',
  'Pilih kelas, mapel, dan rentang tanggal.',
  'Tekan Cetak, lalu pilih pencetak atau simpan sebagai PDF.',
)}
{catatan('Bila kop surat masih kosong, mintalah admin mengisi <strong>Identitas Sekolah</strong> terlebih dahulu.')}
''')

+ fitur('4.9 Pelanggaran dan Pembiasaan', None, f'''
<div class="dua-kolom">{img('guru-pelanggaran', '330px')}{img('guru-pembiasaan', '330px')}</div>
<p><strong>Catat Pelanggaran</strong> — tombol di beranda, pilih kelas, siswa, jenis
pelanggaran, lalu simpan. Poin mengikuti daftar yang ditetapkan admin.</p>
<p><strong>Riwayat Pelanggaran</strong> — daftar catatan yang Anda buat beserta tindak lanjutnya.</p>
<p><strong>Pembiasaan Kelas</strong> — khusus <strong>wali kelas</strong>: memantau jurnal
pembiasaan anak wali, siapa yang sudah dan belum mengisi.</p>
{catatan('Guru yang bukan wali kelas akan melihat keterangan bahwa menu ini untuk wali kelas — itu bukan kerusakan.')}
''')
)

# ---------------------------------------------------------------- 5 ADMIN
b5 = bagian(5, 'Panduan Admin', f'''
<p>Beranda admin menampilkan ringkasan jumlah pengguna dan daftar
<strong>Kesiapan Data</strong> — peringatan otomatis bila ada yang belum lengkap,
misalnya siswa tanpa rombel atau ujian tanpa soal.</p>
{img('admin-beranda')}
{catatan('Bacalah bagian Kesiapan Data lebih dulu setiap kali membuka beranda. Daftar itu menjelaskan sebab paling sering dari keluhan &ldquo;menu saya kosong&rdquo;.', 'tips')}

<h3>Urutan pengisian data yang benar</h3>
<p>Urutan ini penting. Mengisi terbalik membuat sebagian menu tampak kosong.</p>
{langkah(
  '<strong>Identitas Sekolah</strong> — nama, alamat, kepala sekolah, logo untuk kop surat.',
  '<strong>Rombel</strong> — buat rombel dan tetapkan wali kelasnya.',
  '<strong>Sesi / Jam Pelajaran</strong> — jam pelajaran tiap hari.',
  '<strong>Mapel</strong> — daftar mata pelajaran.',
  '<strong>Pengguna</strong> — impor guru dan siswa, sekaligus menempatkan siswa ke rombel.',
  '<strong>Aturan Presensi</strong> — titik koordinat sekolah dan jam presensi.',
  'Setelah itu guru mengambil sendiri kelas, mapel, dan jam mengajarnya.',
)}

''' + fitur('5.1 Kelola Pengguna dan Impor Massal', 'admin-pengguna', f'''
{langkah(
  'Buka <strong>Manajemen Akun</strong>.',
  'Tekan <strong>Import Excel / CSV</strong>, lalu unduh templat yang sesuai (siswa / guru / lainnya).',
  'Isi templat. Kolom <strong>Kelas</strong> harus ditulis <strong>persis sama</strong> dengan nama rombel — lembar &ldquo;Daftar Rombel&rdquo; di dalam templat menjadi acuannya.',
  'Unggah kembali, periksa pratinjaunya, lalu tekan Import.',
)}
{catatan('Buat <strong>rombel terlebih dahulu</strong> sebelum mengimpor siswa. Bila rombel belum ada, siswa masuk tanpa kelas dan seluruh menunya akan kosong.', 'awas')}
<p>Ikon kunci pada tiap baris dipakai untuk mengganti password pengguna; ikon tempat
sampah untuk menghapus akun.</p>
''')

+ fitur('5.2 Rombel dan Wali Kelas', 'admin-rombel', f'''
{langkah(
  'Buka <strong>Master Rombel</strong>.',
  'Tekan Tambah Rombel, isi nama (contoh: <code>X TKJ 1</code>) dan tingkat.',
  'Pilih <strong>wali kelas</strong> dari daftar guru.',
)}
{catatan('Wali kelas menentukan siapa yang dapat memantau Jurnal Pembiasaan anak walinya.')}
''')

+ fitur('5.3 Sesi / Jam Pelajaran', 'admin-sesi', f'''
{langkah(
  'Buka <strong>Master Sesi</strong>, pilih hari.',
  'Tambahkan tiap jam pelajaran: nama (Jam 1, Istirahat, Upacara), jam mulai, jam selesai, dan jenisnya.',
  'Gunakan <strong>Salin ke hari lain</strong> agar tidak mengetik ulang.',
)}
{catatan('Jam pelajaran ini dipakai dua kali: guru memilih jam mengajar dari daftar ini, dan <strong>jam presensi pulang siswa</strong> mengikuti jam pelajaran terakhir hari itu.')}
''')

+ fitur('5.4 Mapel, Jadwal, dan Aturan Presensi', None, f'''
<div class="dua-kolom">{img('admin-mapel', '330px')}{img('admin-jadwal', '330px')}</div>
<p><strong>Master Mapel</strong> — daftar mata pelajaran. Pengampunya dipilih sendiri oleh guru.</p>
<p><strong>Plotting Jadwal</strong> — admin dapat memplot jadwal, atau menyerahkannya
kepada guru. Sakelar &ldquo;penjadwalan mandiri&rdquo; menentukan apakah guru boleh mengatur sendiri.</p>
{img('admin-presensi')}
<p><strong>Aturan Presensi (GPS)</strong> — titik koordinat sekolah dan jam presensi.</p>
{langkah(
  'Isi koordinat <strong>Gedung 1</strong>, beri nama yang dikenal siswa.',
  'Bila sekolah menempati dua gedung, isi juga <strong>Gedung 2</strong>. Presensi sah di salah satunya.',
  'Tekan <strong>Pakai Lokasi Saya Sekarang</strong> bila Anda sedang berada di gedung itu.',
  'Isi batas waktu masuk. Jam pulang mengikuti jam pelajaran terakhir secara otomatis.',
)}
{catatan('Koordinat yang terisi sebagian akan ditolak. Bila radius kedua gedung saling bertumpuk, aplikasi memperingatkan — perkecil radiusnya.', 'awas')}
''')

+ fitur('5.5 Token Ujian, Kesiswaan, dan Perpustakaan', None, f'''
<div class="dua-kolom">{img('admin-ujian', '330px')}{img('admin-pelanggaran', '330px')}</div>
<p><strong>Token CBT global</strong> — token cadangan yang dipakai bila sebuah ujian
tidak memiliki token sendiri. Tekan tombol acak untuk memperbarui.</p>
<p><strong>Kesiswaan</strong> — daftar jenis pelanggaran beserta poinnya. Daftar ini
dipakai guru saat mencatat, sekaligus menjadi acuan yang dibaca siswa.</p>
{catatan('Mengubah poin di sini <strong>tidak</strong> mengubah catatan yang sudah terjadi — riwayat siswa tetap utuh.')}
<div class="dua-kolom">{img('admin-perpustakaan', '330px')}{img('admin-pkl', '330px')}</div>
<p><strong>Perpustakaan Digital</strong> — tambahkan e-book berupa tautan.</p>
<p><strong>PKL / Prakerin</strong> — data mitra DUDI dan penempatan siswa PKL.</p>
''')

+ fitur('5.6 Pengumuman, Identitas Sekolah, dan Backup', None, f'''
{img('admin-pengumuman')}
<p><strong>Pengumuman</strong> — kirim pengumuman ke semua pengguna, hanya siswa, hanya
guru, atau satu rombel. Tiap kartu menampilkan jumlah pembaca, dan ikon tempat
sampah untuk menghapusnya.</p>
{catatan('Menghapus pengumuman juga menghapus catatan &ldquo;sudah dibaca&rdquo; milik penerimanya, dan tidak dapat dikembalikan.', 'awas')}
<div class="dua-kolom">{img('admin-sekolah', '330px')}{img('admin-backup', '330px')}</div>
<p><strong>Identitas Sekolah</strong> — nama, alamat, NPSN, kepala sekolah, NIP, dan logo.
Data ini muncul pada kop surat semua laporan cetak.</p>
<p><strong>Backup</strong> — halaman informasi cadangan basis data.</p>
{catatan('Basis data PELITA dicadangkan otomatis setiap malam pukul 22:00 di server sekolah. Pastikan salinan backup juga dikirim ke luar server — cadangan yang hanya ada di mesin yang sama tidak menolong bila mesinnya rusak.', 'awas')}
''')
)

# ---------------------------------------------------------------- 6 DUDI
b6 = bagian(6, 'Panduan Mitra DUDI', f'''
<p>Akun DUDI diberikan kepada pembimbing industri tempat siswa melaksanakan PKL.</p>
{langkah(
  'Masuk memakai akun yang diberikan sekolah.',
  'Beranda menampilkan daftar siswa PKL di tempat Anda.',
  'Periksa jurnal kegiatan harian siswa dan berikan verifikasi.',
  'Pantau presensi siswa selama masa PKL.',
)}
{catatan('Penempatan siswa PKL diatur oleh admin sekolah lewat menu PKL / Prakerin. Bila daftar siswa masih kosong, hubungi admin sekolah.')}
''')

# ---------------------------------------------------------------- 7
b7 = bagian(7, 'Masalah yang Sering Terjadi', f'''
<table class="tabel masalah">
  <tr><th>Gejala</th><th>Sebab &amp; solusi</th></tr>
  <tr><td>Menu siswa kosong semua</td><td>Siswa belum ditempatkan di rombel. Admin membukanya lewat Manajemen Akun dan mengisi kolom rombel.</td></tr>
  <tr><td>Menu guru kosong</td><td>Guru belum mengambil kelas &amp; mapel. Buka <strong>Kelas Saya</strong> lalu tekan Ambil.</td></tr>
  <tr><td>Jadwal siswa kosong</td><td>Guru belum mengambil jam mengajar di menu Jadwal Mandiri.</td></tr>
  <tr><td>Ujian tidak muncul di akun siswa</td><td>Ujian masih berstatus DRAF. Guru menekan label DRAF untuk menerbitkannya.</td></tr>
  <tr><td>Token ujian ditolak</td><td>Token salah, atau ujian belum dibuka / sudah ditutup menurut jadwalnya.</td></tr>
  <tr><td>Gambar soal tidak muncul, hanya tulisan</td><td>Berkas Drive belum dibagikan. Atur ke &ldquo;Siapa saja yang memiliki link&rdquo;.</td></tr>
  <tr><td>Presensi tidak bisa dikirim</td><td>Izin lokasi belum diberikan, atau berada di luar radius kedua gedung. Presensi tetap dapat dikirim dan ditandai perlu ditinjau.</td></tr>
  <tr><td>Presensi pulang belum bisa</td><td>Belum mencapai jam pelajaran terakhir hari itu. Jamnya tertera di halaman presensi.</td></tr>
  <tr><td>Jawaban ujian hilang</td><td>Berganti HP di tengah ujian, atau data peramban dibersihkan. Jawaban tersimpan di perangkat tersebut saja.</td></tr>
  <tr><td>Menu baru tidak muncul</td><td>Peramban menyimpan versi lama. Tekan segarkan (refresh) atau tutup lalu buka kembali.</td></tr>
  <tr><td>Kop surat cetakan kosong</td><td>Admin belum mengisi Identitas Sekolah.</td></tr>
  <tr><td>Halaman terasa lambat saat pertama dibuka</td><td>Wajar pada kunjungan pertama. Minta siswa membuka aplikasi sehari sebelum ujian agar berkasnya tersimpan.</td></tr>
</table>
''')

# ---------------------------------------------------------------- 8
b8 = bagian(8, 'Daftar Istilah', '''
<table class="tabel">
  <tr><th>CBT</th><td><em>Computer Based Test</em> — ujian berbasis komputer/HP</td></tr>
  <tr><th>TKA</th><td>Tes Kemampuan Akademik. Bentuk soalnya: PG, PG Kompleks, dan Benar/Salah</td></tr>
  <tr><th>Rombel</th><td>Rombongan belajar — kelas tempat siswa dikelompokkan</td></tr>
  <tr><th>Pengampu</th><td>Guru yang mengajar suatu mapel di suatu rombel</td></tr>
  <tr><th>Sesi / Jam Pelajaran</th><td>Pembagian waktu belajar, misalnya Jam 1 pukul 07:00–07:40</td></tr>
  <tr><th>Geofencing</th><td>Pemeriksaan lokasi GPS agar presensi hanya sah di area sekolah</td></tr>
  <tr><th>Token</th><td>Kode yang diumumkan pengawas untuk membuka ujian</td></tr>
  <tr><th>Draf / Terbit</th><td>Ujian berstatus Draf belum tampil ke siswa; Terbit sudah tampil</td></tr>
  <tr><th>PKL / Prakerin</th><td>Praktik Kerja Lapangan di dunia industri</td></tr>
  <tr><th>DUDI</th><td>Dunia Usaha dan Dunia Industri — mitra tempat siswa PKL</td></tr>
  <tr><th>PWA</th><td>Aplikasi web yang dapat dipasang di layar utama HP seperti aplikasi biasa</td></tr>
</table>

<div class="penutup">
  <p>Petunjuk ini disusun berdasarkan aplikasi yang berjalan pada
  <strong>''' + TANGGAL + '''</strong>. Seluruh tangkapan layar diambil dari aplikasi
  sungguhan memakai akun demo, sehingga tidak memuat data siswa asli.</p>
  <p>Bila tampilan aplikasi berbeda dengan gambar di buku ini, kemungkinan ada
  pembaruan. Hubungi admin sekolah.</p>
  <p class="ttd">SMK Negeri 1 Kemangkon<br><span>pelita.smkn1kemangkon.sch.id</span></p>
</div>
''')

# =====================================================================
GAYA = '''
@page { size: A4; margin: 16mm 14mm 18mm 14mm; }
* { box-sizing: border-box; }
body { font-family: "Segoe UI", "Helvetica Neue", Arial, sans-serif; color: #1f2937;
       font-size: 10.5pt; line-height: 1.55; margin: 0; }
h1, h2, h3, h4 { color: #1e3a8a; margin: 0 0 .4em; line-height: 1.25; }
.bab { page-break-before: always; }
.bab > h1 { font-size: 20pt; border-bottom: 3px solid #1e3a8a; padding-bottom: .3em;
            margin-bottom: .8em; display: flex; align-items: baseline; gap: .5em; }
.nomor { background: #1e3a8a; color: #fff; font-size: 12pt; width: 1.6em; height: 1.6em;
         border-radius: 50%; display: inline-flex; align-items: center;
         justify-content: center; flex: none; }
h3 { font-size: 13pt; margin-top: 1.2em; color: #b45309; }
h4 { font-size: 11pt; margin-top: 1em; color: #334155; }
p { margin: .5em 0; text-align: justify; }
code { background: #f1f5f9; padding: .1em .35em; border-radius: 3px;
       font-family: Consolas, monospace; font-size: .92em; }
pre.kode { background: #f8fafc; border: 1px solid #e2e8f0; border-left: 4px solid #b45309;
           padding: .8em 1em; border-radius: 6px; font-family: Consolas, monospace;
           font-size: 9pt; line-height: 1.5; white-space: pre-wrap; page-break-inside: avoid; }
ol.langkah { margin: .6em 0 .8em; padding-left: 1.4em; }
ol.langkah li { margin-bottom: .35em; }
.kotak { border-radius: 6px; padding: .6em .9em; margin: .7em 0; font-size: 9.8pt;
         page-break-inside: avoid; }
.kotak.info { background: #eff6ff; border-left: 4px solid #2563eb; }
.kotak.awas { background: #fef2f2; border-left: 4px solid #dc2626; }
.kotak.tips { background: #f0fdf4; border-left: 4px solid #16a34a; }
.tabel { width: 100%; border-collapse: collapse; margin: .7em 0; font-size: 9.8pt;
         page-break-inside: avoid; }
.tabel th, .tabel td { border: 1px solid #e2e8f0; padding: .45em .7em; text-align: left;
                       vertical-align: top; }
.tabel th { background: #f8fafc; color: #1e3a8a; width: 30%; }
.tabel.masalah th { width: 34%; }
.tabel.masalah tr:first-child th { width: auto; }
img.ss { display: block; margin: .8em auto; border: 1px solid #cbd5e1; border-radius: 8px;
         box-shadow: 0 2px 8px rgba(15,23,42,.08); max-width: 100%; page-break-inside: avoid; }
.dua-kolom { display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;
             page-break-inside: avoid; }
.dua-kolom img.ss { margin: .5em 0; }
.fitur { page-break-inside: auto; margin-top: 1.4em; }
.hilang { color: #dc2626; font-style: italic; }

.sampul { text-align: center; padding-top: 55mm; page-break-after: always; }
.sampul p { text-align: center; }
.sampul img { margin: 0 auto 8mm; border: 0; box-shadow: none; }
.sampul h1 { font-size: 17pt; letter-spacing: .22em; text-transform: uppercase;
             color: #64748b; font-weight: 600; }
.sampul .nama { font-size: 58pt; font-weight: 800; color: #1e3a8a; letter-spacing: .04em;
                line-height: 1; margin: .1em 0 .25em; }
.sampul .tagline { font-size: 10.5pt; color: #475569; max-width: 110mm; margin: 0 auto; }
.sampul .sekolah { font-size: 15pt; font-weight: 700; color: #b45309; margin-top: 10mm; }
.sampul .alamat { font-family: Consolas, monospace; font-size: 10pt; color: #1e3a8a;
                  background: #eff6ff; display: inline-block; padding: .4em 1em;
                  border-radius: 20px; margin-top: 4mm; }
.sampul .versi { margin-top: 22mm; font-size: 9.5pt; color: #64748b; }

.daftar-isi { page-break-before: auto; }
ol.toc { font-size: 12pt; line-height: 2.1; padding-left: 1.2em; }
ol.toc span { color: #1e3a8a; font-weight: 600; }

.penutup { margin-top: 2em; padding: 1em 1.2em; background: #f8fafc;
           border: 1px solid #e2e8f0; border-radius: 8px; font-size: 9.8pt; }
.penutup .ttd { text-align: right; margin-top: 1.2em; font-weight: 700; color: #1e3a8a; }
.penutup .ttd span { font-weight: 400; font-family: Consolas, monospace; font-size: 9pt; }
'''

doc = f'''<!doctype html>
<html lang="id"><head><meta charset="utf-8">
<title>Petunjuk Penggunaan PELITA — SMK Negeri 1 Kemangkon</title>
<style>{GAYA}</style></head><body>
{sampul}{daftar_isi}{b1}{b2}{b3}{b4}{b5}{b6}{b7}{b8}
</body></html>'''

io.open(KELUAR, 'w', encoding='utf-8').write(doc)
print(f'HTML tersusun: {KELUAR}  ({len(doc)//1024} KB)')
