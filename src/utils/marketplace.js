const money = value => 'Rp' + Number(value || 0).toLocaleString('id-ID');
const dateLabel = value =>
  value
    ? new Date(value).toLocaleString('id-ID', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';
const availableStock = (product, orders = []) =>
  Math.max(
    0,
    Number(product?.stock || 0) -
      orders.filter(
        order =>
          order.productId === product?.id && order.status !== 'cancelled',
      ).length,
  );
const ratingFor = (sellerId, reviews = []) => {
  const rows = reviews.filter(review => review.sellerId === sellerId);
  return {
    average: rows.length
      ? rows.reduce((total, review) => total + Number(review.rating), 0) /
        rows.length
      : 0,
    count: rows.length,
  };
};
const unreadCount = (conversationId, userId, messages = []) =>
  messages.filter(
    message =>
      message.conversationId === conversationId &&
      message.senderId !== userId &&
      !(message.readBy || []).includes(userId),
  ).length;
module.exports = {money, dateLabel, availableStock, ratingFor, unreadCount};
