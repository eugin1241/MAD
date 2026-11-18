import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {useMarketplace} from '../context/MarketplaceContext';
import {
  Badge,
  Body,
  Button,
  Card,
  Empty,
  ProductImage,
  Row,
  Screen,
  Title,
} from '../components/MarketplaceUI';
import {
  dateLabel,
  money,
  productBadgeStatus,
  ratingFor,
} from '../utils/marketplace';

export default function SellerProfileScreen({route, navigation}) {
  const {sellerId} = route.params || {};
  const {data, loading, refresh, error} = useMarketplace();
  const seller = data.profiles.find(item => item.id === sellerId);
  const products = data.products.filter(
    item => item.sellerId === sellerId && item.status === 'approved',
  );
  const reviews = data.reviews.filter(item => item.sellerId === sellerId);
  const rating = ratingFor(sellerId, data.reviews);
  return (
    <Screen refreshing={loading} onRefresh={refresh}>
      <Title subtitle="Kenali penjual sebelum bertransaksi">
        Profil penjual
      </Title>
      {error ? <Body>{error}</Body> : null}
      {!seller ? (
        <Empty
          title="Penjual belum ditemukan"
          description="Tarik layar untuk memuat kembali profil penjual."
        />
      ) : (
        <>
          <Card>
            <Row>
              <ProductImage uri={seller.avatarUrl} size={80} />
              <View style={styles.flex}>
                <Text style={styles.name}>{seller.name}</Text>
                <Body muted>
                  {seller.location || 'Lokasi belum ditambahkan'}
                </Body>
                <Body>
                  ★{' '}
                  {rating.count
                    ? Number(rating.average).toFixed(1)
                    : 'Belum ada rating'}{' '}
                  · {rating.count} ulasan
                </Body>
              </View>
            </Row>
          </Card>
          <Title subtitle={`${products.length} barang terdaftar di lapak`}>
            Barang penjual
          </Title>
          {!products.length ? (
            <Empty
              title="Belum ada barang aktif"
              description="Barang yang disetujui akan muncul di sini."
            />
          ) : null}
          {products.map(product => (
            <Card key={product.id}>
              <Row>
                <ProductImage uri={product.imageUrl} size={76} />
                <View style={styles.flex}>
                  <Text style={styles.productTitle}>{product.title}</Text>
                  <Body>{money(product.price)}</Body>
                  <Body muted>{product.condition}</Body>
                  <Badge status={productBadgeStatus(product)} />
                </View>
              </Row>
              <Button
                title="Lihat barang"
                variant="secondary"
                onPress={() =>
                  navigation.navigate('ProductDetails', {productId: product.id})
                }
              />
            </Card>
          ))}
          <Title subtitle="Dari pembeli dengan transaksi selesai">
            Ulasan pembeli
          </Title>
          {!reviews.length ? (
            <Empty
              title="Belum ada ulasan"
              description="Rating akan muncul setelah pembeli menyelesaikan transaksi."
            />
          ) : null}
          {reviews
            .slice()
            .reverse()
            .map(review => (
              <Card key={review.id}>
                <Text style={styles.productTitle}>
                  {data.profiles.find(item => item.id === review.buyerId)
                    ?.name || 'Pembeli'}
                </Text>
                <Body>★ {review.rating} / 5</Body>
                {review.comment ? <Body>{review.comment}</Body> : null}
                <Body muted>{dateLabel(review.createdAt)}</Body>
              </Card>
            ))}
        </>
      )}
    </Screen>
  );
}
const styles = StyleSheet.create({
  flex: {flex: 1, gap: 5},
  name: {fontSize: 22, fontWeight: '800', color: '#173F35'},
  productTitle: {fontSize: 16, fontWeight: '700', color: '#173F35'},
});
