const {availableStock} = require('../utils/marketplace');

const assert = (condition, message) => {
  if (!condition) {
    throw new Error(message);
  }
};
const text = (value, label, max = 1000) => {
  const result = String(value || '').trim();
  assert(
    result.length > 0 && result.length <= max,
    `${label} wajib diisi (maksimal ${max} karakter).`,
  );
  return result;
};
const now = () => new Date().toISOString();
const idFor = prefix =>
  prefix +
  '-' +
  Date.now().toString(36) +
  '-' +
  Math.random().toString(36).slice(2, 10);
const find = (rows, id, label) => {
  const row = rows.find(item => item.id === id);
  assert(row, `${label} tidak ditemukan. Tarik layar untuk memuat ulang.`);
  return row;
};
const photo = value => {
  const url = String(value || '').trim();
  assert(
    !url ||
      /^https:\/\/[^\s]+$/i.test(url) ||
      /^\/uploads\/[a-f0-9-]+\.(?:jpg|png|webp)$/i.test(url),
    'Foto harus berupa tautan HTTPS atau foto yang diunggah.',
  );
  return url;
};

// json-server is a local classroom mock. These checks enforce app workflows,
// not API security: a production backend must validate identity and permissions.
function createActions({api, getUser, onChanged = async () => {}}) {
  let queue = Promise.resolve();
  const operations = {
    async saveProduct(data, actor, form, productId) {
      const title = text(form.title, 'Nama barang', 100);
      const description = text(form.description, 'Deskripsi', 2000);
      const price = Number(form.price);
      const stock = Number(form.stock);
      assert(
        Number.isSafeInteger(price) && price > 0 && price <= 1000000000,
        'Harga harus berupa rupiah bulat antara 1 dan 1 miliar.',
      );
      assert(
        Number.isSafeInteger(stock) && stock >= 1 && stock <= 10000,
        'Stok harus berupa angka bulat 1–10.000.',
      );
      find(data.categories, form.categoryId, 'Kategori');
      assert(
        ['Baru', 'Bekas'].includes(form.condition),
        'Pilih kondisi barang.',
      );
      const values = {
        title,
        description,
        price,
        stock,
        categoryId: form.categoryId,
        condition: form.condition,
        location: text(form.location, 'Lokasi', 150),
        imageUrl: photo(form.imageUrl),
        saleStatus: productId
          ? find(data.products, productId, 'Barang').saleStatus || 'available'
          : 'available',
        status: 'pending',
        rejectionReason: '',
        updatedAt: now(),
      };
      if (productId) {
        const product = find(data.products, productId, 'Barang');
        assert(
          product.sellerId === actor.id,
          'Anda hanya boleh mengedit barang sendiri.',
        );
        assert(
          product.status !== 'removed',
          'Barang yang dihapus tidak dapat diedit.',
        );
        const allocated = data.orders.filter(
          order =>
            order.productId === productId && order.status !== 'cancelled',
        ).length;
        assert(
          stock >= allocated,
          `Stok total tidak boleh kurang dari ${allocated} unit yang sudah dipesan/terjual.`,
        );
        return api.patch('products/' + productId, values);
      }
      return api.post('products', {
        ...values,
        id: idFor('product'),
        sellerId: actor.id,
        createdAt: now(),
      });
    },
    async setProductSaleStatus(data, actor, id, status) {
      assert(
        ['available', 'sold'].includes(status),
        'Status ketersediaan barang tidak valid.',
      );
      const product = find(data.products, id, 'Barang');
      assert(
        product.sellerId === actor.id,
        'Anda hanya boleh mengubah status barang sendiri.',
      );
      assert(
        product.status === 'approved',
        'Hanya barang yang sudah disetujui yang dapat diubah statusnya.',
      );
      return api.patch('products/' + id, {saleStatus: status, updatedAt: now()});
    },
    async moderateProduct(data, actor, id, status, reason) {
      assert(
        actor.role === 'admin',
        'Hanya admin yang dapat memoderasi barang.',
      );
      const product = find(data.products, id, 'Barang');
      assert(
        product.status === 'pending',
        'Barang ini sudah diperiksa. Muat ulang daftar.',
      );
      assert(
        ['approved', 'rejected'].includes(status),
        'Status persetujuan tidak valid.',
      );
      return api.patch('products/' + id, {
        status,
        rejectionReason:
          status === 'rejected' ? text(reason, 'Alasan penolakan', 500) : '',
        updatedAt: now(),
      });
    },
    async removeProduct(data, actor, id, reason) {
      const product = find(data.products, id, 'Barang');
      assert(
        actor.role === 'admin' || product.sellerId === actor.id,
        'Anda tidak dapat menghapus barang ini.',
      );
      return api.patch('products/' + id, {
        status: 'removed',
        rejectionReason: String(reason || 'Barang dinonaktifkan')
          .trim()
          .slice(0, 500),
        updatedAt: now(),
      });
    },
    async toggleFavorite(data, actor, productId) {
      const existing = data.favorites.find(
        item => item.productId === productId && item.userId === actor.id,
      );
      if (existing) {
        return api.remove('favorites/' + existing.id);
      }
      const product = find(data.products, productId, 'Barang');
      assert(
        product.status === 'approved' && product.saleStatus !== 'sold',
        'Barang sudah tidak tersedia.',
      );
      return api.post('favorites', {
        id: actor.id + '-' + productId,
        userId: actor.id,
        productId,
      });
    },
    async startConversation(data, actor, productId) {
      const product = find(data.products, productId, 'Barang');
      assert(
        product.sellerId !== actor.id,
        'Anda tidak dapat menghubungi diri sendiri.',
      );
      const existing = data.conversations.find(
        item => item.productId === productId && item.buyerId === actor.id,
      );
      if (existing) {
        return existing;
      }
      assert(
        product.status === 'approved' && product.saleStatus !== 'sold',
        'Barang sudah tidak tersedia.',
      );
      return api.post('conversations', {
        id: actor.id + '-' + productId,
        productId,
        buyerId: actor.id,
        sellerId: product.sellerId,
        createdAt: now(),
      });
    },
    async sendMessage(data, actor, conversationId, value) {
      const conversation = find(
        data.conversations,
        conversationId,
        'Percakapan',
      );
      assert(
        [conversation.buyerId, conversation.sellerId].includes(actor.id),
        'Percakapan ini bukan milik Anda.',
      );
      return api.post('messages', {
        id: idFor('message'),
        conversationId,
        senderId: actor.id,
        text: text(value, 'Pesan', 2000),
        createdAt: now(),
        readBy: [actor.id],
      });
    },
    async markRead(data, actor, conversationId) {
      const conversation = find(
        data.conversations,
        conversationId,
        'Percakapan',
      );
      assert(
        [conversation.buyerId, conversation.sellerId].includes(actor.id),
        'Percakapan ini bukan milik Anda.',
      );
      const unread = data.messages.filter(
        message =>
          message.conversationId === conversationId &&
          !(message.readBy || []).includes(actor.id),
      );
      await Promise.all(
        unread.map(message =>
          api.patch('messages/' + message.id, {
            readBy: [...(message.readBy || []), actor.id],
          }),
        ),
      );
    },
    async placeOrder(data, actor, productId, details) {
      const product = find(data.products, productId, 'Barang');
      assert(
        product.sellerId !== actor.id,
        'Anda tidak dapat membeli barang sendiri.',
      );
      assert(
        product.status === 'approved' &&
          product.saleStatus !== 'sold' &&
          availableStock(product, data.orders) > 0,
        'Barang sudah habis atau tidak tersedia.',
      );
      assert(
        !data.orders.some(
          order =>
            order.productId === productId &&
            order.buyerId === actor.id &&
            ['pending', 'confirmed'].includes(order.status),
        ),
        'Anda sudah memiliki pesanan aktif untuk barang ini.',
      );
      return api.post('orders', {
        id: idFor('order'),
        productId,
        buyerId: actor.id,
        sellerId: product.sellerId,
        productTitle: product.title,
        price: product.price,
        meetingPoint: text(details?.meetingPoint, 'Lokasi serah terima', 200),
        note: String(details?.note || '')
          .trim()
          .slice(0, 500),
        status: 'pending',
        createdAt: now(),
        updatedAt: now(),
      });
    },
    async updateOrder(data, actor, id, status) {
      const order = find(data.orders, id, 'Pesanan');
      const buyer = order.buyerId === actor.id;
      const seller = order.sellerId === actor.id;
      assert(buyer || seller, 'Pesanan ini bukan milik Anda.');
      const allowed =
        (['pending', 'confirmed'].includes(order.status) &&
          status === 'cancelled') ||
        (order.status === 'pending' && status === 'confirmed' && seller) ||
        (order.status === 'confirmed' && status === 'completed' && buyer);
      assert(allowed, 'Perubahan status pesanan tidak diizinkan.');
      return api.patch('orders/' + id, {status, updatedAt: now()});
    },
    async reviewOrder(data, actor, orderId, rating, comment) {
      const order = find(data.orders, orderId, 'Pesanan');
      assert(
        order.buyerId === actor.id && order.status === 'completed',
        'Ulasan hanya untuk pembeli setelah transaksi selesai.',
      );
      assert(
        !data.reviews.some(review => review.orderId === orderId),
        'Pesanan ini sudah diberi ulasan.',
      );
      assert(
        Number.isInteger(Number(rating)) &&
          Number(rating) >= 1 &&
          Number(rating) <= 5,
        'Pilih rating 1–5.',
      );
      return api.post('reviews', {
        id: orderId,
        orderId,
        buyerId: actor.id,
        sellerId: order.sellerId,
        rating: Number(rating),
        comment: text(comment, 'Ulasan', 1000),
        createdAt: now(),
      });
    },
    async updateProfile(data, actor, form) {
      return api.patch('profiles/' + actor.id, {
        name: text(form.name, 'Nama', 80),
        location: String(form.location || '')
          .trim()
          .slice(0, 150),
        avatarUrl: photo(form.avatarUrl),
      });
    },
    async createTicket(data, actor, subject, message) {
      const values = {
        id: idFor('ticket'),
        userId: actor.id,
        subject: text(subject, 'Judul bantuan', 120),
        status: 'open',
        createdAt: now(),
      };
      const content = text(message, 'Pesan', 2000);
      const ticket = await api.post('tickets', {
        ...values,
        initialMessage: content,
      });
      // Store the initial message in the same record, so a ticket cannot be
      // created without its description if a later network request fails.
      return ticket;
    },
    async replyTicket(data, actor, ticketId, value) {
      const ticket = find(data.tickets, ticketId, 'Tiket');
      assert(
        actor.role === 'admin' || ticket.userId === actor.id,
        'Tiket ini bukan milik Anda.',
      );
      assert(
        ticket.status === 'open',
        'Tiket sudah ditutup. Buat tiket baru bila perlu.',
      );
      return api.post('ticketMessages', {
        id: idFor('reply'),
        ticketId,
        senderId: actor.id,
        text: text(value, 'Pesan', 2000),
        createdAt: now(),
      });
    },
    async closeTicket(data, actor, ticketId) {
      assert(actor.role === 'admin', 'Hanya admin yang dapat menutup tiket.');
      find(data.tickets, ticketId, 'Tiket');
      return api.patch('tickets/' + ticketId, {status: 'closed'});
    },
    async reportProduct(data, actor, productId, reason) {
      find(data.products, productId, 'Barang');
      assert(
        !data.reports.some(
          report =>
            report.productId === productId &&
            report.userId === actor.id &&
            report.status === 'open',
        ),
        'Laporan Anda untuk barang ini masih ditangani.',
      );
      return api.post('reports', {
        id: idFor('report'),
        userId: actor.id,
        productId,
        reason: text(reason, 'Alasan laporan', 1000),
        status: 'open',
        createdAt: now(),
      });
    },
    async resolveReport(data, actor, id) {
      assert(
        actor.role === 'admin',
        'Hanya admin yang dapat menangani laporan.',
      );
      find(data.reports, id, 'Laporan');
      return api.patch('reports/' + id, {status: 'resolved'});
    },
    async saveCategory(data, actor, name, id) {
      assert(
        actor.role === 'admin',
        'Hanya admin yang dapat mengubah kategori.',
      );
      const label = text(name, 'Kategori', 40);
      assert(
        !data.categories.some(
          category =>
            category.id !== id &&
            category.name.toLowerCase() === label.toLowerCase(),
        ),
        'Nama kategori sudah digunakan.',
      );
      if (id) {
        find(data.categories, id, 'Kategori');
        return api.patch('categories/' + id, {name: label});
      }
      return api.post('categories', {id: idFor('category'), name: label});
    },
  };
  return Object.fromEntries(
    Object.entries(operations).map(([name, operation]) => [
      name,
      (...args) => {
        const uidAtCall = getUser()?.uid;
        const task = queue.then(async () => {
          assert(
            uidAtCall && getUser()?.uid === uidAtCall,
            'Sesi berubah. Silakan masuk kembali.',
          );
          const data = await api.readAll();
          assert(
            getUser()?.uid === uidAtCall,
            'Sesi berubah. Silakan masuk kembali.',
          );
          const actor = find(data.profiles, uidAtCall, 'Profil');
          const result = await operation(data, actor, ...args);
          await onChanged();
          return result;
        });
        queue = task.catch(() => {});
        return task;
      },
    ]),
  );
}
module.exports = {createActions};
