import React, {useState} from 'react';
import {Alert, StyleSheet, Text, View, useWindowDimensions} from 'react-native';
import {useMarketplace} from '../context/MarketplaceContext';
import {
  Screen,
  Title,
  Card,
  Button,
  Field,
  Empty,
  Badge,
  ProductImage,
  Body,
} from '../components/MarketplaceUI';
import {
  availableStock,
  dateLabel,
  money,
  ratingFor,
} from '../utils/marketplace';

export default function ProductDetailsScreen({navigation, route}) {
  const {user, profile, data, loading, refresh, actions} = useMarketplace();
  const {width} = useWindowDimensions();
  const [showOrder, setShowOrder] = useState(false);
  const [meetingPoint, setMeetingPoint] = useState('');
  const [note, setNote] = useState('');
  const [showReport, setShowReport] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [removeConfirm, setRemoveConfirm] = useState(false);
  const product = data.products.find(
    item => item.id === route.params?.productId,
  );
  const own = product?.sellerId === user.uid;
  const canSee =
    product &&
    (product.status === 'approved' || own || profile?.role === 'admin');
  if (!canSee) {
    return (
      <Screen refreshing={loading} onRefresh={refresh}>
        <Empty
          title="Barang tidak tersedia"
          description="Barang ini belum disetujui atau sudah dihapus dari marketplace."
        />
        <Button
          title="Kembali"
          onPress={() => navigation.goBack()}
          variant="secondary"
        />
      </Screen>
    );
  }
  const seller = data.profiles.find(item => item.id === product.sellerId);
  const rating = ratingFor(product.sellerId, data.reviews);
  const stock = availableStock(product, data.orders);
  const category = data.categories.find(item => item.id === product.categoryId);
  const isFavorite = data.favorites.some(
    item => item.userId === user.uid && item.productId === product.id,
  );
  const available = product.status === 'approved';

  return (
    <Screen refreshing={loading} onRefresh={refresh}>
      <View style={styles.imageWrap}>
        <ProductImage uri={product.imageUrl} size={Math.min(width - 64, 420)} />
      </View>
      <View style={styles.tags}>
        <Text style={styles.category}>{category?.name || 'Lainnya'}</Text>
        <Badge status={product.status} />
      </View>
      <Title subtitle={`${product.condition} · ${product.location}`}>
        {product.title}
      </Title>
      <Text style={styles.price}>{money(product.price)}</Text>
      <Body muted>
        {stock > 0 ? `${stock} unit tersedia` : 'Stok habis'} · Ditambahkan{' '}
        {dateLabel(product.createdAt)}
      </Body>
      {product.rejectionReason && product.status === 'rejected' ? (
        <Card>
          <Body>Alasan penolakan: {product.rejectionReason}</Body>
        </Card>
      ) : null}
      <Card>
        <Text style={styles.sectionTitle}>Tentang barang ini</Text>
        <Body>{product.description}</Body>
      </Card>
      <Card>
        <Text style={styles.sectionTitle}>
          Dijual oleh {seller?.name || 'Penjual'}
        </Text>
        <Body muted>
          {rating.count
            ? `${Number(rating.average).toFixed(1)} / 5 · ${
                rating.count
              } ulasan`
            : 'Belum ada ulasan'}
        </Body>
        <Button
          title="Lihat profil penjual"
          variant="secondary"
          onPress={() =>
            navigation.navigate('SellerProfile', {sellerId: product.sellerId})
          }
        />
      </Card>
      {own ? (
        <Card>
          <Text style={styles.sectionTitle}>Ini barang jualanmu</Text>
          <Body muted>
            Perubahan barang akan dikirim kembali untuk diperiksa admin.
          </Body>
          {product.status !== 'removed' && (
            <>
              <Button
                title="Edit barang"
                onPress={() =>
                  navigation.navigate('SellProduct', {productId: product.id})
                }
              />
              <Button
                title={removeConfirm ? 'Batal hapus' : 'Hapus dari marketplace'}
                variant="secondary"
                onPress={() => setRemoveConfirm(value => !value)}
              />
              {removeConfirm && (
                <>
                  <Body>
                    Barang akan berhenti ditampilkan. Riwayat pesanan tetap
                    tersimpan.
                  </Body>
                  <Button
                    title="Ya, hapus barang"
                    variant="danger"
                    onPress={async () => {
                      await actions.removeProduct(
                        product.id,
                        'Dihapus oleh penjual',
                      );
                      setRemoveConfirm(false);
                      Alert.alert(
                        'Barang dihapus',
                        'Barang tidak lagi tampil di marketplace.',
                      );
                    }}
                  />
                </>
              )}
            </>
          )}
        </Card>
      ) : (
        <>
          {available && (
            <Button
              title={
                isFavorite
                  ? 'Tersimpan di favorit · Hapus'
                  : 'Simpan ke favorit'
              }
              variant="secondary"
              onPress={() => actions.toggleFavorite(product.id)}
            />
          )}
          <Button
            title="Chat penjual"
            disabled={!available}
            variant="secondary"
            onPress={async () => {
              const conversation = await actions.startConversation(product.id);
              navigation.navigate('Conversation', {
                conversationId: conversation.id,
              });
            }}
          />
          <Button
            title={stock > 0 ? 'Beli · COD / serah terima' : 'Stok habis'}
            disabled={!available || stock <= 0}
            onPress={() => {
              setShowOrder(value => !value);
              if (!meetingPoint) {
                setMeetingPoint(product.location || '');
              }
            }}
          />
          {showOrder && available && (
            <Card>
              <Text style={styles.sectionTitle}>Buat pesanan</Text>
              <Body>1 × {product.title}</Body>
              <Text style={styles.orderPrice}>
                Total {money(product.price)}
              </Text>
              <Body muted>
                Bayar langsung saat serah terima. Sepakati lokasi dan waktu
                dengan penjual melalui chat.
              </Body>
              <Field
                label="Usulan lokasi serah terima"
                value={meetingPoint}
                onChangeText={setMeetingPoint}
                placeholder="Contoh: lobi kampus"
                maxLength={180}
              />
              <Field
                label="Catatan untuk penjual (opsional)"
                value={note}
                onChangeText={setNote}
                placeholder="Usulan waktu atau pertanyaan"
                multiline
                maxLength={500}
              />
              <Button
                title="Konfirmasi pesanan"
                disabled={stock <= 0 || !meetingPoint.trim()}
                onPress={async () => {
                  await actions.placeOrder(product.id, {meetingPoint, note});
                  setShowOrder(false);
                  setNote('');
                  Alert.alert(
                    'Pesanan dibuat',
                    'Pesanan menunggu konfirmasi penjual. Pantau statusnya melalui tab Aktivitas.',
                  );
                }}
              />
            </Card>
          )}
          {available && (
            <Button
              title={showReport ? 'Tutup laporan' : 'Laporkan barang'}
              variant="secondary"
              onPress={() => setShowReport(value => !value)}
            />
          )}
          {showReport && available && (
            <Card>
              <Field
                label="Alasan laporan"
                value={reportReason}
                onChangeText={setReportReason}
                placeholder="Jelaskan masalah pada barang ini"
                multiline
                maxLength={1000}
              />
              <Button
                title="Kirim laporan ke admin"
                disabled={!reportReason.trim()}
                onPress={async () => {
                  await actions.reportProduct(product.id, reportReason);
                  setReportReason('');
                  setShowReport(false);
                  Alert.alert(
                    'Laporan terkirim',
                    'Admin akan meninjau laporanmu.',
                  );
                }}
              />
            </Card>
          )}
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  imageWrap: {
    alignItems: 'center',
    backgroundColor: '#E9EDE5',
    borderRadius: 24,
    paddingVertical: 12,
    marginBottom: 20,
  },
  tags: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  category: {fontSize: 12, fontWeight: '700', color: '#173F35'},
  price: {
    fontSize: 28,
    fontWeight: '800',
    color: '#173F35',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#173F35',
    marginBottom: 10,
  },
  orderPrice: {
    fontSize: 21,
    fontWeight: '800',
    color: '#173F35',
    marginVertical: 12,
  },
});
