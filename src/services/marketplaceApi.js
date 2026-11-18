export const COLLECTIONS = [
  'profiles',
  'categories',
  'products',
  'favorites',
  'conversations',
  'messages',
  'orders',
  'reviews',
  'tickets',
  'ticketMessages',
  'reports',
];
export const emptyData = () =>
  Object.fromEntries(COLLECTIONS.map(name => [name, []]));
export function createApi(baseUrl) {
  async function request(path, method = 'GET', body) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12000);
    try {
      const response = await fetch(baseUrl + '/' + path, {
        method,
        signal: controller.signal,
        headers: {'Content-Type': 'application/json'},
        ...(body === undefined ? {} : {body: JSON.stringify(body)}),
      });
      if (!response.ok) {
        throw new Error(
          `Server mengembalikan ${response.status}. Periksa data lalu coba lagi.`,
        );
      }
      return response.status === 204 ? null : await response.json();
    } catch (error) {
      if (
        error.name === 'AbortError' ||
        error.message === 'Network request failed' ||
        error instanceof TypeError
      ) {
        throw new Error(
          'Server marketplace belum terhubung. Jalankan npm run server dan periksa alamat server di src/config/marketplace.js.',
        );
      }
      throw error;
    } finally {
      clearTimeout(timer);
    }
  }
  async function uploadImage(asset) {
    if (!asset?.uri) {
      throw new Error('Foto yang dipilih tidak dapat dibaca.');
    }
    const formData = new FormData();
    formData.append('photo', {
      uri: asset.uri,
      type: asset.type || 'image/jpeg',
      name: asset.fileName || 'product-photo.jpg',
    });
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 20000);
    try {
      const response = await fetch(baseUrl + '/uploads', {
        method: 'POST',
        signal: controller.signal,
        body: formData,
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(
          result.error || `Server mengembalikan ${response.status}.`,
        );
      }
      if (!result.imageUrl) {
        throw new Error('Server tidak mengembalikan lokasi foto.');
      }
      return result.imageUrl;
    } catch (error) {
      if (
        error.name === 'AbortError' ||
        error.message === 'Network request failed' ||
        error instanceof TypeError
      ) {
        throw new Error(
          'Server marketplace belum terhubung. Jalankan npm run server dan periksa alamat server di src/config/marketplace.js.',
        );
      }
      throw error;
    } finally {
      clearTimeout(timer);
    }
  }
  return {
    get: path => request(path),
    post: (path, body) => request(path, 'POST', body),
    patch: (path, body) => request(path, 'PATCH', body),
    remove: path => request(path, 'DELETE'),
    uploadImage,
    readAll: async () =>
      Object.fromEntries(
        await Promise.all(
          COLLECTIONS.map(async name => [name, await request(name)]),
        ),
      ),
  };
}
