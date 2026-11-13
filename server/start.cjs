const path = require('node:path');
const fs = require('node:fs');
const databasePath = path.join(__dirname, 'marketplace.json');
if (!fs.existsSync(databasePath)) {
  fs.copyFileSync(path.join(__dirname, 'marketplace.example.json'), databasePath, fs.constants.COPYFILE_EXCL);
}
let jsonServer;
try {
  jsonServer = require('json-server');
} catch {
  console.error('Paket server belum terpasang. Jalankan: npm run server:install');
  process.exit(1);
}
const app = jsonServer.create();
app.use(jsonServer.defaults({logger: true}));
app.use(jsonServer.bodyParser);
app.use(jsonServer.router(path.join(__dirname, 'marketplace.json')));
const port = Number(process.env.PORT || 3001);
const host = process.env.HOST || '127.0.0.1';
app.listen(port, host, () => {
  console.log(`Klabox demo API: http://${host}:${port}`);
  console.log('Server simulasi kelas. Data/API belum memiliki autentikasi server.');
});
