import React, {useState} from 'react';
import {Alert, StyleSheet, Text, View} from 'react-native';
import {useMarketplace} from '../context/MarketplaceContext';
import {
  Badge,
  Body,
  Button,
  Card,
  Chips,
  Empty,
  Field,
  ProductImage,
  Row,
  Screen,
  Title,
} from '../components/MarketplaceUI';
import {dateLabel, money} from '../utils/marketplace';

const roleOptions = [
  {id: 'buy', label: 'Pembelian'},
  {id: 'sell', label: 'Penjualan'},
];
const statuses = [
  {id: 'all', label: 'Semua'},
  {id: 'pending', label: 'Menunggu'},
  {id: 'confirmed', label: 'Dikonfirmasi'},
  {id: 'completed', label: 'Selesai'},
  {id: 'cancelled', label: 'Dibatalkan'},
];
const ratings = [1, 2, 3, 4, 5].map(rating => ({
  id: String(rating),
  label: `${rating} ★`,
}));

function askConfirmation(title, message, label) {
  return new Promise(resolve => {
    Alert.alert(
      title,
      message,
      [
        {text: 'Kembali', style: 'cancel', onPress: () => resolve(false)},
        {text: label, onPress: () => resolve(true)},
      ],
      {cancelable: true, onDismiss: () => resolve(false)},
    );
  });
}

function OrderCard({order, navigation}) {
  const {user, data, actions} = useMarketplace();
  const [rating, setRating] = useState('5');
  const [comment, setComment] = useState('');
  const buyer = order.buyerId === user.uid;
  const product = data.products.find(item => item.id === order.productId);
  const partner = data.profiles.find(
    item => item.id === (buyer ? order.sellerId : order.buyerId),
  );
  const review = data.reviews.find(item => item.orderId === order.id);

  const transition = async status => {
    const cancelling = status === 'cancelled';
    const completing = status === 'completed';
    const title = cancelling
      ? 'Batalkan pesanan?'
      : completing
      ? 'Barang sudah diterima?'
      : 'Terima pesanan ini?';
    const message = cancelling
      ? 'Pesanan akan dibatalkan dan barang tersedia kembali untuk dibeli.'
      : completing
      ? 'Konfirmasi setelah kamu menerima barang dan menyelesaikan pembayaran COD.'
      : 'Pastikan barang tersedia dan sepakati waktu serah terima dengan pembeli.';
    const accepted = await askConfirmation(title, message, 'Konfirmasi');
    if (accepted) {
      await actions.updateOrder(order.id, status);
    }
  };

  return (
    <Card>
      <Row>
        <ProductImage uri={product?.imageUrl} size={60} />
        <View style={styles.flex}>
          <Text style={styles.productTitle}>{order.productTitle}</Text>
          <Text style={styles.price}>{money(order.price)}</Text>
          <Body muted>1 barang · COD / serah terima</Body>
        </View>
      </Row>
      <View style={styles.space}>
        <Badge status={order.status} />
      </View>
      <Body>
        {buyer ? 'Penjual' : 'Pembeli'}: {partner?.name || 'Pengguna'}
      </Body>
      <Body muted>Lokasi serah terima: {order.meetingPoint}</Body>
      {order.note ? <Body muted>Catatan: {order.note}</Body> : null}
      <Body muted>{dateLabel(order.createdAt)}</Body>
      <View style={styles.actions}>
        <Button
          title="Lihat produk"
          variant="secondary"
          onPress={() =>
            navigation.navigate('ProductDetails', {productId: order.productId})
          }
        />
        {!buyer && order.status === 'pending' ? (
          <Button
            title="Terima pesanan"
            onPress={() => transition('confirmed')}
          />
        ) : null}
        {buyer && order.status === 'confirmed' ? (
          <Button
            title="Barang diterima · selesaikan"
            onPress={() => transition('completed')}
          />
        ) : null}
        {order.status === 'pending' || order.status === 'confirmed' ? (
          <Button
            title="Batalkan pesanan"
            variant="danger"
            onPress={() => transition('cancelled')}
          />
        ) : null}
      </View>
      {buyer && order.status === 'completed' && !review ? (
        <View style={styles.review}>
          <Text style={styles.reviewTitle}>
            Bagaimana pengalaman belanjamu?
          </Text>
          <Body muted>Ulasanmu membantu pembeli lain mengenal penjual.</Body>
          <Chips options={ratings} value={rating} onChange={setRating} />
          <Field
            label="Ulasan"
            placeholder="Ceritakan kondisi barang dan pelayanan penjual"
            value={comment}
            onChangeText={setComment}
            multiline
            maxLength={500}
          />
          <Button
            title="Kirim ulasan"
            disabled={!comment.trim()}
            onPress={() =>
              actions.reviewOrder(order.id, Number(rating), comment)
            }
          />
        </View>
      ) : null}
      {review ? (
        <View style={styles.review}>
          <Text style={styles.reviewTitle}>
            {buyer ? 'Ulasanmu' : 'Ulasan pembeli'} · {review.rating} ★
          </Text>
          <Body>{review.comment}</Body>
        </View>
      ) : null}
    </Card>
  );
}

export default function ActivityScreen({navigation}) {
  const {user, data, loading, refresh} = useMarketplace();
  const [tab, setTab] = useState('buy');
  const [status, setStatus] = useState('all');
  const role = tab === 'buy' ? 'buyerId' : 'sellerId';
  const orders = data.orders
    .filter(
      order =>
        order[role] === user.uid &&
        (status === 'all' || order.status === status),
    )
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <Screen refreshing={loading} onRefresh={refresh}>
      <Title subtitle="Pantau transaksi dari kesepakatan sampai selesai.">
        Aktivitas
      </Title>
      <Chips options={roleOptions} value={tab} onChange={setTab} />
      <Chips options={statuses} value={status} onChange={setStatus} />
      <Body muted>
        {tab === 'buy'
          ? 'Setelah penjual menerima pesanan, sepakati serah terima lewat chat.'
          : 'Terima pesanan yang tersedia, lalu hubungi pembeli untuk serah terima.'}
      </Body>
      {orders.length === 0 ? (
        <Empty
          title="Belum ada transaksi"
          description={
            status === 'all'
              ? 'Pesanan pembelian dan penjualan akan tercatat di sini.'
              : 'Tidak ada pesanan dengan status yang dipilih.'
          }
        />
      ) : (
        orders.map(order => (
          <OrderCard key={order.id} order={order} navigation={navigation} />
        ))
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: {flex: 1},
  productTitle: {fontSize: 16, color: '#173F35', fontWeight: '700'},
  price: {fontSize: 18, color: '#173F35', fontWeight: '800', marginTop: 4},
  space: {marginVertical: 12},
  actions: {marginTop: 12, gap: 8},
  review: {
    marginTop: 18,
    borderTopWidth: 1,
    borderTopColor: '#E3E7DD',
    paddingTop: 16,
  },
  reviewTitle: {
    fontSize: 15,
    color: '#173F35',
    fontWeight: '700',
    marginBottom: 8,
  },
});
