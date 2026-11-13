# Klabox — final project React Native

Proyek tetap memakai React Native CLI dan login Firebase yang sudah ada. Data marketplace terpisah di `server/marketplace.json`; `db.json` latihan tidak diubah. Nama aplikasi sementara di tampilan: Klabox.

## Menjalankan

Di folder proyek, pasang paket backend satu kali:

```powershell
npm run server:install
```

Terminal pertama:

```powershell
npm run server
```

Terminal kedua:

```powershell
npm run android
```

Jika Metro belum aktif, jalankan `npm start` pada terminal lain. Setup native Android yang sudah ada dipertahankan.

Default Android emulator: `http://10.0.2.2:3001`. Untuk HP Android tersambung USB, jalankan `adb reverse tcp:3001 tcp:3001` dan ganti alamat Android pada `src/config/marketplace.js` menjadi `http://127.0.0.1:3001`. Untuk LAN, gunakan IP laptop dan jalankan server dengan `$env:HOST='0.0.0.0'` hanya pada jaringan demo tepercaya. Jangan gunakan mode LAN tanpa kebutuhan. Firebase tetap membutuhkan internet dan konfigurasi akun yang sudah dipakai proyek ini.

## Akun admin

Daftar/login melalui aplikasi terlebih dahulu; profil otomatis dibuat ketika server tersambung. Pada terminal baru saat server berjalan:

```powershell
npm run admin -- --list
npm run admin -- UID_AKUN_YANG_DIPILIH
```

Ganti UID dengan nilai dari daftar. Tarik halaman Profil; tombol Panel admin akan muncul. Akun baru selalu mendapat peran pengguna. Tidak ada password admin bawaan.

## Fitur dan alur demo

1. Buat tiga akun Firebase milik sendiri: admin, penjual, pembeli. Tetapkan admin melalui perintah di atas.
2. Penjual membuka Jual; isi nama, kategori, harga rupiah, stok, kondisi, lokasi, deskripsi, dan tautan foto HTTPS opsional. Barang masuk status menunggu.
3. Admin membuka Profil → Panel admin → barang menunggu; setujui atau tolak dengan alasan.
4. Pembeli mencari/filter produk di Jelajahi, membuka detail, menyimpan favorit, dan mengirim pesan. Percakapan muncul sebagai Beli di akun pembeli dan Jual di akun penjual.
5. Pembeli memesan satu unit, mengusulkan titik COD/serah terima. Penjual mengonfirmasi dari Aktivitas → Penjualan. Kedua pihak dapat membatalkan pesanan pending/confirmed. Pembeli menandai selesai setelah menerima barang.
6. Pembeli memberikan satu ulasan/rating setelah selesai. Profil penjual menampilkan rata-rata dan jumlah ulasan.
7. Laporkan produk dari detail. Admin memeriksa laporan. Buat tiket bantuan dari Profil → Bantuan; admin membalas dan menutup tiket.

Stok adalah jumlah total unit pada listing, termasuk unit yang terjual/dipesan. Unit pesanan pending, confirmed, dan completed mengurangi sisa stok; pembatalan mengembalikan ketersediaan. Pengubahan barang mengirimnya kembali untuk persetujuan. Penghapusan menyembunyikan barang dan mempertahankan data pesanan.

## Batasan versi kelas

- json-server adalah API simulasi lokal. Firebase memverifikasi login, tetapi endpoint json-server belum memverifikasi token Firebase. Pengecekan kepemilikan/admin ada pada logika aplikasi; API langsung tetap dapat diakses. Jangan gunakan untuk transaksi/data pribadi nyata atau publikasikan server ini ke internet.
- Antrean aksi mencegah benturan dari satu sesi aplikasi, tetapi pemesanan bersamaan dari beberapa perangkat belum atomik. Backend produksi perlu pemeriksaan stok, izin akses, dan transaksi di server.
- Chat menggunakan polling setiap 5 detik saat percakapan aktif. Dashboard memuat ulang setiap 10 detik saat aktif. Notifikasi berupa indikator dalam aplikasi, tanpa push notification.
- Foto menggunakan URL HTTPS, belum unggah galeri/kamera. COD merupakan pencatatan transaksi, tanpa payment gateway, ekspedisi, atau escrow.
- API lokal menggunakan HTTP untuk debug Android. Build rilis dan iOS perlu konfigurasi HTTPS/transport yang sesuai; tidak ada pelonggaran keamanan rilis dalam perubahan ini.
- Katalog awal kosong agar tidak ada penjual palsu yang tidak bisa membalas chat. Enam kategori sudah disiapkan.

## Pengujian

```powershell
npm run test:marketplace
npm run lint:marketplace
```

Tes aturan transaksi mencakup peran, stok, urutan status, chat, ulasan, profil, dan CS. Uji manual dengan tiga akun di atas tetap diperlukan untuk Firebase, jaringan emulator, keyboard, dan tampilan native.

Referensi: https://github.com/typicode/json-server/tree/v0.17.4 dan https://reactnative.dev/docs/network
