# Klabox

Project Final Mobile App Development: marketplace React Native dengan Firebase Authentication dan json-server.

## Menjalankan

1. Pasang Node.js >= 22.11 dan siapkan Android SDK/emulator.
2. Jalankan `npm install` dan `npm run server:install`.
3. Salin `src/config/firebase.example.js` ke `src/config/firebase.js`, isi konfigurasi Web App Firebase sendiri, lalu aktifkan Authentication Email/Password.
4. Jalankan `npm run server`. Database lokal otomatis dibuat dari `server/marketplace.example.json` jika belum ada.
5. Pada terminal terpisah jalankan `npm start` dan `npm run android`.

Database akun, konfigurasi Firebase lokal, dependensi, dan cadangan tidak disimpan di Git. Database lokal yang sudah ada tetap dipertahankan.

## Fitur

Login/daftar, pencarian dan kategori barang, jual barang, moderasi admin, favorit, chat jual/beli, pesanan COD, rating penjual, profil, laporan barang, dan bantuan pelanggan.

Lihat [panduan marketplace](MARKETPLACE.md) untuk akun admin, pengaturan koneksi perangkat, alur demo, dan batasan API simulasi.

## Validasi

- `npm run test:marketplace`
- `npm run lint:marketplace`
