const {test} = require('node:test');
const assert = require('node:assert/strict');
const {createActions} = require('../src/services/marketplaceActions');
const {availableStock, ratingFor, unreadCount} = require('../src/utils/marketplace');
const initial = require('../server/marketplace.example.json');

function fixture() {
  const db = structuredClone(initial);
  for (const key of Object.keys(db)) { if (key !== 'categories') { db[key] = []; } }
  db.profiles = ['buyer', 'seller', 'stranger', 'admin'].map(id => ({id, name: id, role: id === 'admin' ? 'admin' : 'user'}));
  db.products = [{id: 'item', sellerId: 'seller', title: 'Buku', description: 'Buku kuliah bekas layak pakai', price: 50000, stock: 1, categoryId: 'books', condition: 'Bekas', location: 'Kampus', imageUrl: '', status: 'approved'}];
  let uid = 'buyer';
  const api = {
    readAll: async () => structuredClone(db),
    post: async (collection, values) => {
      assert(!db[collection].some(item => item.id === values.id), 'duplicate id');
      db[collection].push(structuredClone(values));
      return structuredClone(values);
    },
    patch: async (path, values) => {
      const [collection, id] = path.split('/');
      const row = db[collection].find(item => item.id === id);
      assert(row, `missing ${path}`);
      Object.assign(row, structuredClone(values));
      return structuredClone(row);
    },
    remove: async path => {
      const [collection, id] = path.split('/');
      db[collection] = db[collection].filter(item => item.id !== id);
    },
  };
  const actions = createActions({api, getUser: () => uid ? {uid} : null});
  return {db, api, actions, as: id => {uid = id;}};
}
const details = {meetingPoint: 'Lobi kampus', note: 'Pukul 12'};
const form = {title: 'Tas kuliah', description: 'Tas bersih, resleting baik', price: '120000', stock: '2', categoryId: 'fashion', condition: 'Bekas', location: 'Kampus', imageUrl: ''};

test('seller submits pending; only admin approves; important edits require approval again', async () => {
  const f = fixture(); f.as('seller');
  const product = await f.actions.saveProduct(form);
  assert.equal(product.status, 'pending');
  await assert.rejects(f.actions.moderateProduct(product.id, 'approved'), /admin/);
  f.as('admin'); await f.actions.moderateProduct(product.id, 'approved');
  f.as('stranger'); await assert.rejects(f.actions.saveProduct(form, product.id), /sendiri/);
  f.as('seller'); await f.actions.saveProduct({...form, price: 100000}, product.id);
  assert.equal(f.db.products.find(item => item.id === product.id).status, 'pending');
});
test('validation rejects bad currency, stock, category, and photo URLs', async () => {
  const f = fixture(); f.as('seller');
  for (const changes of [{price: -1}, {price: 'abc'}, {stock: 1.2}, {categoryId: 'missing'}, {imageUrl: 'javascript:bad'}, {imageUrl: '/uploads/../private.jpg'}]) {
    await assert.rejects(f.actions.saveProduct({...form, ...changes}));
  }
  assert.equal(f.db.products.length, 1);
});
test('a gallery upload path can be saved as a product photo', async () => {
  const f = fixture();
  f.as('seller');
  const imageUrl = '/uploads/51abc123-1234-4321-9234-123456789abc.jpg';
  const product = await f.actions.saveProduct({...form, imageUrl});
  assert.equal(product.imageUrl, imageUrl);
});
test('rejection requires reason; removal preserves order snapshots', async () => {
  const f = fixture(); const order = await f.actions.placeOrder('item', details);
  f.as('admin'); await f.actions.removeProduct('item', 'Barang dilaporkan');
  assert.equal(f.db.orders[0].productTitle, 'Buku');
  assert.equal(f.db.orders[0].id, order.id);
  assert.equal(f.db.products[0].status, 'removed');
  f.db.products[0].status = 'pending';
  await assert.rejects(f.actions.moderateProduct('item', 'rejected', ''), /Alasan/);
});
test('cannot buy own, pending, removed, or out-of-stock product', async () => {
  const f = fixture(); f.as('seller');
  await assert.rejects(f.actions.placeOrder('item', details), /sendiri/);
  f.as('buyer');
  for (const status of ['pending', 'rejected', 'removed']) {
    f.db.products[0].status = status;
    await assert.rejects(f.actions.placeOrder('item', details), /tersedia/);
  }
  f.db.products[0].status = 'approved'; f.db.products[0].stock = 0;
  await assert.rejects(f.actions.placeOrder('item', details), /tersedia/);
});
test('seller controls sold status and sold listings cannot be ordered or newly messaged', async () => {
  const f = fixture();
  await assert.rejects(
    f.actions.setProductSaleStatus('item', 'sold'),
    /barang sendiri/,
  );
  f.as('seller');
  await f.actions.setProductSaleStatus('item', 'sold');
  assert.equal(f.db.products[0].saleStatus, 'sold');
  f.as('buyer');
  await assert.rejects(f.actions.placeOrder('item', details), /tidak tersedia/);
  await assert.rejects(f.actions.startConversation('item'), /tidak tersedia/);
  f.as('seller');
  await f.actions.setProductSaleStatus('item', 'available');
  assert.equal(f.db.products[0].saleStatus, 'available');
});
test('reservation consumes stock; cancellation returns it; price is frozen', async () => {
  const f = fixture(); const order = await f.actions.placeOrder('item', details);
  assert.equal(availableStock(f.db.products[0], f.db.orders), 0);
  await assert.rejects(f.actions.placeOrder('item', details), /habis/);
  f.db.products[0].price = 90000;
  assert.equal(f.db.orders[0].price, 50000);
  await f.actions.updateOrder(order.id, 'cancelled');
  assert.equal(availableStock(f.db.products[0], f.db.orders), 1);
  const replacement = await f.actions.placeOrder('item', details);
  assert.equal(replacement.price, 90000);
});
test('only seller confirms and only buyer completes; terminal order cannot change', async () => {
  const f = fixture(); const order = await f.actions.placeOrder('item', details);
  await assert.rejects(f.actions.updateOrder(order.id, 'confirmed'), /diizinkan/);
  await assert.rejects(f.actions.updateOrder(order.id, 'completed'), /diizinkan/);
  f.as('stranger'); await assert.rejects(f.actions.updateOrder(order.id, 'cancelled'), /milik/);
  f.as('seller'); await f.actions.updateOrder(order.id, 'confirmed');
  await assert.rejects(f.actions.updateOrder(order.id, 'completed'), /diizinkan/);
  f.as('buyer'); await f.actions.updateOrder(order.id, 'completed');
  await assert.rejects(f.actions.updateOrder(order.id, 'cancelled'), /diizinkan/);
});
test('confirmed order can be cancelled by either participant', async () => {
  for (const actor of ['buyer', 'seller']) {
    const f = fixture(); const order = await f.actions.placeOrder('item', details);
    f.as('seller'); await f.actions.updateOrder(order.id, 'confirmed');
    f.as(actor); await f.actions.updateOrder(order.id, 'cancelled');
    assert.equal(availableStock(f.db.products[0], f.db.orders), 1);
  }
});
test('local action queue prevents duplicate rapid reservations', async () => {
  const f = fixture();
  const results = await Promise.allSettled([f.actions.placeOrder('item', details), f.actions.placeOrder('item', details)]);
  assert.equal(results.filter(result => result.status === 'fulfilled').length, 1);
  assert.equal(f.db.orders.length, 1);
});
test('one review per completed order by its buyer, rating 1–5', async () => {
  const f = fixture(); const order = await f.actions.placeOrder('item', details);
  await assert.rejects(f.actions.reviewOrder(order.id, 5, 'Bagus'), /selesai/);
  f.as('seller'); await f.actions.updateOrder(order.id, 'confirmed');
  f.as('buyer'); await f.actions.updateOrder(order.id, 'completed');
  await assert.rejects(f.actions.reviewOrder(order.id, 6, 'Bagus'), /rating/);
  f.as('stranger'); await assert.rejects(f.actions.reviewOrder(order.id, 5, 'Bagus'), /pembeli/);
  f.as('buyer'); await f.actions.reviewOrder(order.id, 4, 'Sesuai deskripsi');
  await assert.rejects(f.actions.reviewOrder(order.id, 5, 'Lagi'), /sudah/);
  assert.deepEqual(ratingFor('seller', f.db.reviews), {average: 4, count: 1});
});
test('conversation is reused, outsiders cannot send/read, read badge clears', async () => {
  const f = fixture(); const conversation = await f.actions.startConversation('item');
  assert.equal((await f.actions.startConversation('item')).id, conversation.id);
  assert.equal(f.db.conversations.length, 1);
  await f.actions.sendMessage(conversation.id, 'Masih ada?');
  assert.equal(unreadCount(conversation.id, 'seller', f.db.messages), 1);
  f.as('stranger');
  await assert.rejects(f.actions.sendMessage(conversation.id, 'spam'), /milik/);
  await assert.rejects(f.actions.markRead(conversation.id), /milik/);
  f.as('seller'); await f.actions.markRead(conversation.id);
  assert.equal(unreadCount(conversation.id, 'seller', f.db.messages), 0);
});
test('favorite can be removed after product becomes unavailable', async () => {
  const f = fixture(); await f.actions.toggleFavorite('item');
  f.db.products[0].status = 'removed';
  await f.actions.toggleFavorite('item');
  assert.equal(f.db.favorites.length, 0);
  await assert.rejects(f.actions.toggleFavorite('item'), /tersedia/);
});
test('profile update cannot promote role or change identity', async () => {
  const f = fixture();
  await f.actions.updateProfile({name: 'Nama baru', location: 'Kota', avatarUrl: '', role: 'admin', id: 'admin'});
  assert.equal(f.db.profiles[0].role, 'user');
  assert.equal(f.db.profiles[0].id, 'buyer');
  assert.equal(f.db.profiles[0].name, 'Nama baru');
});
test('ticket description is persisted atomically; replies and closing respect ownership', async () => {
  const f = fixture(); const ticket = await f.actions.createTicket('Butuh bantuan', 'Barang bermasalah');
  assert.equal(ticket.initialMessage, 'Barang bermasalah');
  f.as('stranger'); await assert.rejects(f.actions.replyTicket(ticket.id, 'Tidak boleh'), /milik/);
  f.as('buyer'); await f.actions.replyTicket(ticket.id, 'Informasi tambahan');
  await assert.rejects(f.actions.closeTicket(ticket.id), /admin/);
  f.as('admin'); await f.actions.replyTicket(ticket.id, 'Akan diperiksa'); await f.actions.closeTicket(ticket.id);
  f.as('buyer'); await assert.rejects(f.actions.replyTicket(ticket.id, 'Lagi'), /ditutup/);
});
test('category/report moderation is admin-only and names are unique', async () => {
  const f = fixture(); await f.actions.reportProduct('item', 'Deskripsi salah');
  await assert.rejects(f.actions.reportProduct('item', 'Lagi'), /ditangani/);
  await assert.rejects(f.actions.resolveReport(f.db.reports[0].id), /admin/);
  await assert.rejects(f.actions.saveCategory('Baru'), /admin/);
  f.as('admin'); await f.actions.resolveReport(f.db.reports[0].id);
  await f.actions.saveCategory('Musik');
  await assert.rejects(f.actions.saveCategory('musik'), /sudah/);
});
test('queued actions cannot run under a changed account', async () => {
  const f = fixture(); const action = f.actions.placeOrder('item', details); f.as('stranger');
  await assert.rejects(action, /Sesi berubah/);
  assert.equal(f.db.orders.length, 0);
});
