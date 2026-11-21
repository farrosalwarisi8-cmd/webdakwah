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

### Membedakan alamat stream dari halaman web radio

Yang diisi di dashboard adalah **alamat stream langsung** (audio), bukan alamat
halaman web radio.

| Alamat                               | Jenis             | Dipakai untuk                       |
| ------------------------------------ | ----------------- | ----------------------------------- |
| `https://radio.contoh.com/stream`    | Stream langsung   | Diputar di halaman (mode embed)     |
| `https://radio.contoh.com:8123/live` | Stream langsung   | Diputar di halaman, port nonstandar |
| `http://radio.contoh.com:8000/;`     | Stream langsung   | Tab baru (browser menolak http)     |
| `https://radio.contoh.com/`          | Halaman web radio | **Bukan** untuk pemutar website     |

Petunjuk cepat:

- Alamat stream biasanya berakhiran `/stream`, `/live`, `/:mountpoint`, atau
  `;` (Shoutcast).
- Membuka alamat stream di browser akan memutar audio atau mengunduh berkas
  audio, bukan menampilkan halaman dengan tombol dan menu.
- Halaman web radio (beranda, profil, jadwal) **tidak bisa** diputar sebagai
  audio dan akan gagal di Tes dengar.
- Jika ragu, minta alamat dengar publik langsung ke pengelola radio, atau
  gunakan tombol **Tes dengar** di dashboard.

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
- Alamat dengar publik di dashboard admin menunjuk ke stream langsung (bukan
  halaman web radio) dan memakai https bila ingin diputar di halaman.
- Server radio tidak sedang maintenance.

### Daftar periksa "siap tayang"

Sebelum mengumumkan siaran:

1. Aplikasi penyiar (Winamp/BUTT/OBS) menunjukkan status terhubung.
2. Alamat dengar publik di dashboard sudah benar; tombol **Tes dengar**
   melaporkan berhasil.
3. Mode pemutaran sesuai: **Diputar di halaman ini** untuk stream https
   langsung, **Buka di radio (tab baru)** untuk alamat http atau halaman radio.
4. Jadwal hari ini aktif dan jamnya benar dalam WIB.
5. Satu orang lain mencoba membuka /siaran dari ponselnya.
6. Kata sandi dan stream key tidak pernah ditulis di website, dokumen, atau
   grup chat.

## 5. Mengatur siaran di dashboard admin

Buka **Dashboard → Siaran** (khusus admin).

- **Judul dan deskripsi**: teks yang tampil di halaman /siaran.
- **Alamat dengar publik**: URL yang didengar jamaah. Wajib diawali
  `http://` atau `https://`. Jangan menyertakan username atau kata sandi di URL.
- **Mode pemutaran**:
  - **Diputar di halaman ini** hanya untuk alamat **stream https langsung**,
    bukan halaman web radio.
  - **Buka di radio (tab baru)** untuk alamat http atau bila radio memintanya.
- **Tombol Tes dengar**: memutar alamat di kolom alamat dengar sebentar di
  browser admin dan melaporkan berhasil/gagal. Tidak menyimpan apa pun.
- **URL status siaran** (opsional): alamat **http atau https** yang
  mengembalikan status. Diperiksa oleh server, jadi http tidak menimbulkan
  masalah keamanan halaman. Yang dikenali:
  - JSON sederhana: `{"live": true}`
  - statistik JSON Shoutcast (kunci `streamstatus`)
  - statistik `status-json.xsl` Icecast (adanya `icestats.source`)
  - teks `live`/`offline`

  Server memeriksa paling sering setiap 30 detik dengan batas waktu 3 detik.
  Jika alamat gagal, kosong, atau formatnya tidak dikenali, halaman menampilkan
  **Sesuai jadwal** beserta jadwal berikutnya, bukan error.

- **URL Telegram** (opsional): tombol **Dengarkan di Telegram**.
- **Jadwal**: pilih hari mingguan **atau** tanggal khusus (tidak keduanya),
  isi jam mulai dan durasi dalam WIB. Jadwal nonaktif tidak tampil di publik.

### Membaca status "Sesuai jadwal"

Status **Sesuai jadwal** muncul ketika website tidak bisa memastikan status
radio (alamat status belum diisi, server tidak merespons, atau formatnya tidak
dikenali). Ini **bukan** tanda siaran rusak dan bukan klaim bahwa siaran sedang
mengudara.

- **"Berikutnya: Kajian Subuh, Senin 04.30 WIB"** — acara berikutnya menurut
  jadwal aktif. Jika hari dan jamnya tiba tetapi audio belum berbunyi, cek
  aplikasi penyiar; status website memang tidak bisa memastikan.
- **"Seharusnya sedang berlangsung: …"** — jam sekarang masih di dalam rentang
  jadwal (jam mulai + durasi), tetapi website tetap tidak memastikan siaran
  mengudara. Minta penyiar memastikan koneksinya.
- **"Belum ada jadwal aktif …"** — tidak ada jadwal mingguan/acara khusus yang
  akan datang. Tambahkan jadwal di dashboard bila perlu.

Agar status berubah menjadi **Sedang mengudara** / **Sedang tidak mengudara**,
isi **URL status siaran** dengan alamat statistik radio (lihat bagian 5).

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
