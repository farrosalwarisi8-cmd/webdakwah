# Panduan Siaran Radio Mitra

Dokumen ini untuk **penyiar** dan **pengurus radio**, bukan untuk pengembang.
Website ini **tidak** menyediakan server radio. Server siaran tetap milik
pengelola radio (misalnya Radio Islam Mantingan). Website hanya menampilkan
pemutar dan jadwal.

> **PENTING — kredensial tidak boleh ditulis di mana pun.**
> Kata sandi (password) siaran, server, port, dan stream key hanya dimasukkan
> langsung ke aplikasi penyiar di komputer Anda. Jangan menulisnya di dokumen
> ini, di README, di website, di grup chat, atau di log. Jika perlu mencatat,
> gunakan pengelola kata sandi milik pengelola radio.

## 1. Hal yang perlu diminta ke pengelola radio

Minta data berikut secara langsung (bukan lewat dokumen publik):

| Data                     | Contoh                         | Catatan                                            |
| ------------------------ | ------------------------------ | -------------------------------------------------- |
| Server / Host            | `<diisi dari pengelola radio>` | Alamat server siaran                               |
| Port                     | `<diisi dari pengelola radio>` | Biasanya port khusus siaran                        |
| Nama pengguna (username) | `<diisi dari pengelola radio>` | Bila ada                                           |
| Kata sandi siaran        | `<diisi dari pengelola radio>` | **Jangan dicatat di sini**                         |
| Nama mount / stream ID   | `<diisi dari pengelola radio>` | Bila server memintanya                             |
| Alamat dengar publik     | `https://...`                  | URL yang didengar jamaah; diisi admin di dashboard |

Alamat dengar publik yang ideal memakai **https** agar bisa diputar langsung di
halaman website. Alamat **http** tetap bisa dipakai, tetapi browser memblokir
audio http di halaman https, jadi website akan menampilkan tombol
**Dengarkan di radio** yang membuka tab baru.

## 2. Siaran dengan Winamp (Shoutcast Source DSP)

1. Pasang **Winamp** dan plugin **Shoutcast Source DSP** di komputer penyiar.
2. Buka Winamp, lalu buka jendela **Shoutcast Source DSP**.
3. Pada tab **Output**, pilih **Encoder 1** dan isi:
   - **Address / Server**: `<diisi dari pengelola radio>`
   - **Port**: `<diisi dari pengelola radio>`
   - **Password**: masukkan kata sandi siaran dari pengelola radio (jangan
     disimpan di dokumen).
   - **Encoder**: pilih MP3 atau AAC sesuai arahan pengelola.
4. Pada tab **Input**, pilih **Soundcard Input** (atau **Winamp Input** bila
   memutar lagu dari Winamp). Atur volume agar suara tidak pecah.
5. Tekan **Connect**. Bila berhasil, indikator koneksi menyala dan status
   siaran menjadi **LIVE**.
6. Uji dengan membuka alamat dengar publik di browser atau ponsel.

## 3. Siaran dengan BUTT (Broadcast Using This Tool)

BUTT lebih ringan dan tersedia untuk Windows, macOS, dan Linux.

1. Unduh dan pasang **BUTT** dari situs resminya.
2. Buka **Settings → Main**:
   - **Server**: `<diisi dari pengelola radio>`
   - **Port**: `<diisi dari pengelola radio>`
   - **Password**: kata sandi siaran dari pengelola radio.
   - **Type**: pilih **Icecast** atau **Shoutcast** sesuai server.
   - **Mountpoint / Stream ID**: `<diisi dari pengelola radio>` (bila diminta).
3. Pada **Settings → Audio**, pilih mikrofon yang benar dan atur level suara.
4. Klik **Add** untuk menyimpan konfigurasi, lalu tekan **Start** (tombol play)
   untuk mulai siaran.
5. Perhatikan indikator koneksi dan level audio. Bila terputus, tekan **Start**
   lagi.

## 4. Menguji siaran

1. Mulai siaran dari Winamp atau BUTT dan pastikan status terhubung.
2. Buka halaman **/siaran** di website.
3. Tekan **Putar siaran**. Audio seharusnya terdengar dalam beberapa detik.
4. Bila memakai alamat http atau mode **Buka di radio**, tekan
   **Dengarkan di radio**.
5. Minta satu orang lain membuka halaman yang sama dari ponselnya.
6. Setelah selesai, hentikan siaran dari aplikasi penyiar (Disconnect/Stop).

Bila muncul pesan **"Siaran sedang tidak mengudara. Lihat jadwal di bawah."**,
periksa:

- Aplikasi penyiar masih terhubung ke server.
- Alamat dengar publik di dashboard admin sudah benar dan memakai https.
- Server radio tidak sedang maintenance.

## 5. Mengatur siaran di dashboard admin

Buka **Dashboard → Siaran** (khusus admin).

- **Judul dan deskripsi**: teks yang tampil di halaman /siaran.
- **Alamat dengar publik**: URL yang didengar jamaah. Wajib diawali
  `http://` atau `https://`. Jangan menyertakan username atau kata sandi di URL.
- **Mode pemutaran**:
  - **Diputar di halaman ini** hanya untuk alamat https.
  - **Buka di radio (tab baru)** untuk alamat http atau bila radio memintanya.
- **URL status siaran** (opsional): alamat https yang mengembalikan status.
  Contoh isi: `{"live": true}` atau teks `live`/`offline`. Server memeriksa
  paling sering setiap 30 detik dengan batas waktu 3 detik. Jika gagal,
  halaman menampilkan **Status tidak tersedia**, bukan error.
- **URL Telegram** (opsional): tombol **Dengarkan di Telegram**.
- **Jadwal**: pilih hari mingguan **atau** tanggal khusus (tidak keduanya),
  isi jam mulai dan durasi dalam WIB. Jadwal nonaktif tidak tampil di publik.

## 6. Siaran ke Telegram (manual lewat OBS)

Siaran ke Telegram dilakukan **manual**, di luar website ini.

1. Buat/masuk ke channel atau grup Telegram yang akan dipakai.
2. Mulai **Video Chat / Live Stream** di Telegram, lalu pilih sumber
   **Stream Key**.
3. Salin **Server URL** dan **Stream Key** yang ditampilkan Telegram.
4. Di **OBS**, buka **Settings → Stream → Service: Custom**.
5. Isi **Server**: `<diisi dari pengelola radio>` (Server URL dari Telegram).
6. Isi **Stream Key**: `<diisi dari pengelola radio>` (Stream Key dari
   Telegram). Jangan menuliskan nilai ini di dokumen atau website.
7. Tekan **Start Streaming** di OBS, lalu mulai siaran di Telegram.
8. Setelah selesai, hentikan siaran di OBS dan Telegram.

Catatan: stream key Telegram bersifat rahasia dan dapat berubah. Jika bocor,
buat ulang siaran di Telegram agar kunci lama tidak berlaku.
