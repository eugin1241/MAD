# Klabox

Project Final Mobile App Development: marketplace React Native dengan Firebase Authentication dan json-server.

## Mulai dari komputer teman

Konfigurasi Firebase aplikasi sudah disertakan di `src/config/firebase.js`. Tidak perlu membuat proyek Firebase baru atau menyalin konfigurasi. Semua pengguna memakai proyek Firebase yang sama dan membutuhkan internet untuk login/daftar. Gunakan akun demo masing-masing.

Siapkan Git, Node.js >= 22.11, JDK 17, Android Studio dan Android SDK. Proyek memakai Android SDK 36, Build Tools 36.0.0, dan NDK 27.1.12297006. Pastikan konfigurasi `ANDROID_HOME` serta emulator/perangkat Android sudah siap.

```powershell
git clone https://github.com/jildeanymaindoka-ai/Klabox.git
cd Klabox
npm ci
npm run server:install
```

Buka emulator Android, lalu jalankan tiga terminal di folder Klabox:

Terminal 1 - backend marketplace:

```powershell
npm run server
```

Terminal 2 - Metro:

```powershell
npm start
```

Terminal 3 - pasang dan buka aplikasi:

```powershell
npm run android
```

Daftar melalui aplikasi, kemudian mulai menambahkan barang. Server otomatis membuat `server/marketplace.json` dari template pada pemakaian pertama. Katalog awal kosong dengan kategori tersedia; database yang sudah ada tidak ditimpa.

Form jual barang dapat memilih satu foto dari galeri (JPG, PNG, atau WebP, maksimal 5 MB). Foto disimpan oleh server lokal di `server/public/uploads`; biarkan `npm run server` tetap berjalan agar foto dapat diunggah dan dilihat oleh perangkat yang memakai server tersebut.

## Firebase bersama dan data marketplace

Firebase menyimpan akun login bersama. Produk, profil marketplace, peran admin, chat, dan pesanan berada di json-server lokal pada masing-masing komputer. Menjalankan server masing-masing berarti data marketplace terpisah, meskipun Firebase-nya sama.

Untuk demo jual/beli dan chat antarperangkat, gunakan satu server pada laptop yang sama. Pada jaringan Wi-Fi tepercaya, jalankan di laptop server:

```powershell
$env:HOST='0.0.0.0'
npm run server
```

Ganti alamat `API_BASE_URL` di `src/config/marketplace.js` pada semua aplikasi peserta menjadi `http://IP_LAPTOP_SERVER:3001`, misalnya `http://192.168.1.10:3001`. Gunakan alamat IPv4 laptop yang sebenarnya. Izinkan port 3001 pada jaringan privat jika firewall memblokirnya. Semua peserta perlu terhubung ke jaringan yang sama.

API json-server ini untuk simulasi kelas dan belum memverifikasi token Firebase atau izin akses di server. Jalankan demo hanya pada jaringan tepercaya; jangan publikasikan API ke internet.

## HP Android melalui USB

Aktifkan USB debugging, sambungkan HP, lalu jalankan:

```powershell
adb devices
adb reverse tcp:3001 tcp:3001
adb reverse tcp:8081 tcp:8081
```

Ubah alamat Android di `src/config/marketplace.js` menjadi `http://127.0.0.1:3001`, lalu jalankan aplikasi. Untuk emulator Android Studio, alamat bawaan `http://10.0.2.2:3001` sudah sesuai.

## Menambahkan admin

Daftar/login melalui aplikasi saat server berjalan agar profil dibuat. Pada terminal lain yang terhubung ke server tersebut:

```powershell
npm run admin -- --list
npm run admin -- UID_AKUN_YANG_DIPILIH
```

Ganti UID dengan nilai dari daftar, lalu tarik halaman Profil untuk memuat ulang. Panel admin dapat menyetujui barang dan menangani laporan/bantuan. Akun baru berperan sebagai pengguna; tidak ada password admin bawaan. Peran admin berlaku pada database marketplace server yang digunakan.

## Isi repositori

Kode aplikasi, konfigurasi Firebase klien, lockfile dependensi, template database kosong, dan panduan disertakan. Data akun/profil lokal, chat, pesanan, `node_modules`, hasil build, dan cadangan tidak diunggah. Dependensi dipasang dengan perintah di atas dan database dibuat otomatis.

Jika ingin memakai Firebase sendiri, sesuaikan `src/config/firebase.js` berdasarkan `firebase.example.js` dan aktifkan metode Authentication Email/Password pada proyek tersebut. Jangan memasukkan service account atau private key ke kode aplikasi.

## Fitur

Login/daftar, pencarian dan kategori barang, jual barang, moderasi admin, favorit, chat jual/beli, pesanan COD, rating penjual, profil, laporan barang, dan bantuan pelanggan.

Lihat [panduan marketplace](MARKETPLACE.md) untuk alur demo dan batasan fitur.

## Pemeriksaan dan kendala umum

```powershell
npm run test:marketplace
npm run lint:marketplace
```

- Data marketplace tidak muncul: pastikan server berjalan dan alamat API sesuai perangkat.
- Login/daftar gagal: periksa internet dan status metode Email/Password pada Firebase bersama.
- Perangkat tidak ditemukan: periksa `adb devices` atau nyalakan emulator.
- Build Android gagal karena SDK: periksa Android SDK, JDK, dan konfigurasi Android lokal.

Pengujian otomatis tidak menggantikan pengujian pada emulator/HP. Build iOS memerlukan macOS dan Xcode; panduan utama ini menggunakan Android.
