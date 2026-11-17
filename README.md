# Simulasi CAT UBTK UKPPPG 2026 – Pendidikan Pancasila

Website statis untuk latihan mandiri CAT UBTK. Dapat dipasang langsung di GitHub Pages tanpa hosting berbayar, database, atau backend.

## Isi paket

```text
cat-ubtq-ukpppg-2026/
├── index.html
├── style.css
├── app.js
├── .nojekyll
├── README.md
└── data/
    └── questions.json
```

## Bank soal

- 90 soal yang diekstrak dari dua PDF latihan yang diberikan: 50 PCK Pendidikan Pancasila dan 40 Pedagogi Umum.
- 60 soal pengembangan latihan yang disusun mengikuti kisi-kisi kompetensi.
- Total 150 soal.
- Setiap sesi mengambil 80 soal secara acak dari bank.
- Jenis soal: Pilihan Ganda, PGK Kategori, dan PGK MCMA.
- Kisi-kisi: PF.1–PF.5, P.1–P.6, K.1–K.3, dan S.1–S.3.
- Setiap soal memiliki level kesulitan, kunci jawaban, dan pembahasan.

**Catatan akurasi:** 90 butir dari PDF adalah materi bank soal latihan yang Anda unggah, bukan klaim soal resmi/bocoran ujian. 60 butir tambahan merupakan soal pengembangan untuk latihan dan bukan soal resmi pemerintah. Periksa kembali isi bank sebelum digunakan untuk kegiatan penilaian formal.

## Fitur

1. Input nama dan jurusan/bidang studi.
2. Halaman petunjuk pengerjaan.
3. Ujian 80 soal dengan waktu 180 menit.
4. Acak urutan soal.
5. Navigasi Sebelumnya, Selanjutnya, dan matriks nomor.
6. Penanda Ragu-ragu.
7. Autosubmit ketika waktu habis.
8. Konfirmasi sebelum menyelesaikan ujian secara manual.
9. Hasil skor 0–100, jumlah benar, parsial, salah/kosong, dan terjawab.
10. Pembahasan dan kunci setiap soal.
11. Reset untuk sesi baru dengan pemilihan 80 soal acak lagi.

### Cara penilaian

- PG: benar = 1 poin; salah/kosong = 0.
- PGK Kategori: poin parsial berdasarkan proporsi kategori yang benar.
- PGK MCMA: poin parsial; pilihan salah mengurangi poin, dan nilai butir tidak kurang dari 0.
- Skor akhir = total poin dibagi 80, dikalikan 100.

Skema ini adalah skema penilaian latihan pada aplikasi, bukan formula penskoran resmi UKPPPG.

## Cara memasang di GitHub Pages

### A. Buat repositori

1. Masuk ke https://github.com dan login.
2. Klik **New repository**.
3. Isi nama repositori, misalnya `simulasi-cat-ubtq-ukpppg`.
4. Pilih **Public** jika ingin GitHub Pages gratis dan mudah dibagikan.
5. Klik **Create repository**.

### B. Unggah file

1. Ekstrak ZIP paket ini di komputer.
2. Buka repositori yang baru dibuat.
3. Klik **Add file → Upload files**.
4. Unggah seluruh isi folder, bukan hanya file ZIP. Pastikan `index.html` berada langsung di root repositori.
5. Pastikan folder `data` ikut terunggah dan berisi `questions.json`.
6. Klik **Commit changes**.

### C. Aktifkan GitHub Pages

1. Buka **Settings** pada repositori.
2. Pilih **Pages** pada menu sebelah kiri.
3. Pada bagian **Build and deployment**, pilih **Deploy from a branch**.
4. Branch pilih `main`, folder pilih `/(root)`.
5. Klik **Save**.
6. Tunggu proses publikasi selesai. URL akan berbentuk:

   `https://USERNAME.github.io/NAMA-REPOSITORY/`

Ganti `USERNAME` dengan nama akun GitHub dan `NAMA-REPOSITORY` dengan nama repositori Anda. Alamat persisnya akan ditampilkan di halaman **Settings → Pages**.

## Cara memperbarui bank soal

1. Buka `data/questions.json` di repositori.
2. Pilih ikon pensil untuk mengedit atau unggah file pengganti.
3. Pertahankan format JSON dan nama properti yang digunakan.
4. Setiap soal setidaknya harus memiliki properti:
   - `id`, `source`, `code`, `type`, `difficulty`, `stem`, `options`, `answer`, `explanation`.
   - Untuk PGK Kategori, tambahkan `categories`.
5. Simpan perubahan dengan **Commit changes**.
6. Muat ulang website. Aplikasi mengambil data bank dari `data/questions.json`.

### Bentuk data tiap tipe

**PG**
```json
{
  "id": "LAT-101",
  "source": "Pengembangan",
  "code": "PF.2",
  "type": "PG",
  "difficulty": "Sedang",
  "stem": "Contoh pertanyaan?",
  "options": [
    {"id": "A", "text": "Pilihan A"},
    {"id": "B", "text": "Pilihan B"}
  ],
  "answer": "A",
  "explanation": "Penjelasan jawaban."
}
```

**PGK Kategori**
```json
{
  "id": "LAT-102",
  "source": "Pengembangan",
  "code": "P.6",
  "type": "PGK Kategori",
  "difficulty": "Sulit",
  "stem": "Nilailah pernyataan berikut.",
  "options": [
    {"id": "1", "text": "Pernyataan pertama"},
    {"id": "2", "text": "Pernyataan kedua"}
  ],
  "categories": ["Tepat", "Tidak Tepat"],
  "answer": ["Tepat", "Tidak Tepat"],
  "explanation": "Penjelasan jawaban."
}
```

**PGK MCMA**
```json
{
  "id": "LAT-103",
  "source": "Pengembangan",
  "code": "S.1",
  "type": "PGK MCMA",
  "difficulty": "Sedang",
  "stem": "Pilih semua jawaban yang tepat.",
  "options": [
    {"id": "A", "text": "Pilihan A"},
    {"id": "B", "text": "Pilihan B"},
    {"id": "C", "text": "Pilihan C"}
  ],
  "answer": ["A", "C"],
  "explanation": "Penjelasan jawaban."
}
```

## Hal penting tentang penyimpanan dan keamanan

- GitHub Pages adalah hosting **statis**. File `questions.json` disimpan di repositori GitHub dan disajikan kepada browser sebagai file JSON. Dengan demikian, bank soal dapat diperbarui dari repositori, tetapi ini bukan database dinamis.
- Karena GitHub Pages statis dan bank soal berisi kunci jawaban untuk koreksi di browser, pengguna yang memahami teknis dapat melihat file bank soal dan kuncinya. Ini cocok untuk simulasi belajar mandiri, bukan ujian berisiko tinggi yang membutuhkan pengamanan jawaban.
- Aplikasi ini tidak menyimpan identitas peserta atau hasil ujian ke server. Hasil ditampilkan di browser saat sesi selesai. Jika halaman ditutup atau dimuat ulang, sesi berjalan tidak dijamin tersimpan.
- Untuk penyimpanan hasil peserta, login, panel admin, bank soal privat, atau pengacakan yang kuncinya tidak terlihat di browser, diperlukan backend/database terpisah. GitHub Pages saja tidak menyediakan fitur tersebut.
- Google Fonts digunakan sebagai font tambahan; jika tidak tersedia, browser memakai font cadangan.

## Domain

GitHub Pages memberikan alamat bawaan `USERNAME.github.io/NAMA-REPOSITORY`. Domain sendiri (misalnya `.com` atau `.id`) dapat ditambahkan dari **Settings → Pages → Custom domain**, tetapi Anda harus memiliki dan mengatur DNS domain tersebut.

## Pengujian lokal

Buka folder melalui editor seperti VS Code, lalu jalankan dengan ekstensi Live Server atau server lokal lain. Jangan hanya membuka `index.html` dengan klik ganda karena browser dapat membatasi `fetch()` terhadap file JSON lokal.
