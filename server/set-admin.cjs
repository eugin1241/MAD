// Developer setup command; run locally, never expose this as a signup option.
const base = process.env.API_URL || 'http://127.0.0.1:3001';
async function main() {
  const response = await fetch(base + '/profiles');
  if (!response.ok) { throw new Error('Profil tidak dapat dimuat.'); }
  const profiles = await response.json();
  const uid = process.argv[2];
  if (!uid || uid === '--list') {
    console.table(profiles.map(({id, name, role}) => ({UID: id, Nama: name, Peran: role})));
    console.log('Pilih UID akun milikmu: npm run admin -- UID');
    return;
  }
  if (!profiles.some(profile => profile.id === uid)) { throw new Error('UID tidak ditemukan. Login lewat aplikasi terlebih dahulu.'); }
  const update = await fetch(base + '/profiles/' + encodeURIComponent(uid), {method: 'PATCH', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({role: 'admin'})});
  if (!update.ok) { throw new Error('Gagal mengubah peran admin.'); }
  console.log('Admin disiapkan. Tarik halaman Profil untuk memuat ulang.');
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
