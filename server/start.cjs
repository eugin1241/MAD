const path = require('node:path');
const fs = require('node:fs');
const crypto = require('node:crypto');
const multer = require('multer');
const databasePath = path.join(__dirname, 'marketplace.json');
const uploadDirectory = path.join(__dirname, 'public', 'uploads');
const imageTypes = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};
fs.mkdirSync(uploadDirectory, {recursive: true});
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
app.use(jsonServer.defaults({logger: true, static: path.join(__dirname, 'public')}));
const upload = multer({
  storage: multer.diskStorage({
    destination: uploadDirectory,
    filename: (_request, file, callback) => {
      callback(null, crypto.randomUUID() + imageTypes[file.mimetype]);
    },
  }),
  limits: {fileSize: 5 * 1024 * 1024, files: 1},
  fileFilter: (_request, file, callback) => {
    if (!imageTypes[file.mimetype]) {
      callback(new Error('Pilih foto JPG, PNG, atau WebP.'));
      return;
    }
    callback(null, true);
  },
});
app.post('/uploads', (request, response) => {
  upload.single('photo')(request, response, error => {
    if (error) {
      response
        .status(error instanceof multer.MulterError ? 400 : 415)
        .json({error: error.message});
      return;
    }
    if (!request.file) {
      response.status(400).json({error: 'Pilih satu foto untuk diunggah.'});
      return;
    }
    response
      .status(201)
      .json({imageUrl: '/uploads/' + request.file.filename});
  });
});
app.use(jsonServer.bodyParser);
app.use(jsonServer.router(path.join(__dirname, 'marketplace.json')));
const port = Number(process.env.PORT || 3001);
const host = process.env.HOST || '127.0.0.1';
app.listen(port, host, () => {
  console.log(`Klabox demo API: http://${host}:${port}`);
  console.log('Server simulasi kelas. Data/API belum memiliki autentikasi server.');
});
