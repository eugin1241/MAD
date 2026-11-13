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
  return {
    get: path => request(path),
    post: (path, body) => request(path, 'POST', body),
    patch: (path, body) => request(path, 'PATCH', body),
    remove: path => request(path, 'DELETE'),
    readAll: async () =>
      Object.fromEntries(
        await Promise.all(
          COLLECTIONS.map(async name => [name, await request(name)]),
        ),
      ),
  };
}
