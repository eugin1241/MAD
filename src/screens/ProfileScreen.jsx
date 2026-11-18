import React from 'react';
import {Alert, StyleSheet, Text, View} from 'react-native';
import {useAuth} from '../context/AuthContext';
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
  money,
  productBadgeStatus,
  ratingFor,
} from '../utils/marketplace';

export default function ProfileScreen({navigation}) {
  const {user, profile, data, loading, error, refresh} = useMarketplace();
  const {logout, resetPassword} = useAuth();
  const listings = data.products.filter(item => item.sellerId === user?.uid);
  const rating = ratingFor(user?.uid, data.reviews);
  const completed = data.orders.filter(
    item => item.sellerId === user?.uid && item.status === 'completed',
  ).length;

  async function sendReset() {
    if (!user?.email) {
      throw new Error('Alamat email akun belum tersedia.');
    }
    const result = await resetPassword(user.email);
    if (!result.success) {
      throw new Error(result.error);
    }
    Alert.alert(
      'Periksa email',
      'Tautan untuk mengganti kata sandi sudah dikirim.',
    );
  }

  function confirmLogout() {
    Alert.alert('Keluar dari akun?', 'Kamu dapat masuk kembali kapan saja.', [
      {text: 'Batal', style: 'cancel'},
      {
        text: 'Keluar',
        style: 'destructive',
        onPress: async () => {
          const result = await logout();
          if (!result.success) {
            Alert.alert('Belum berhasil', result.error);
          }
        },
      },
    ]);
  }

  return (
    <Screen refreshing={loading} onRefresh={refresh}>
      <Title subtitle="Ruang untuk akun dan lapakmu">Profil saya</Title>
      {error ? <Body>{error}</Body> : null}
      <Card style={styles.hero}>
        <Row>
          <ProductImage uri={profile?.avatarUrl} size={72} />
          <View style={styles.flex}>
            <Text style={styles.name}>
              {profile?.name || user?.displayName || 'Pengguna'}
            </Text>
            <Body muted>{user?.email}</Body>
            <Body>{profile?.location || 'Tambahkan lokasi di profil'}</Body>
          </View>
        </Row>
        <View style={styles.stats}>
          <View style={styles.stat}>
            <Text style={styles.value}>
              {rating.count ? Number(rating.average).toFixed(1) : '—'}
            </Text>
            <Body muted>{rating.count} ulasan</Body>
          </View>
          <View style={styles.stat}>
            <Text style={styles.value}>
              {
                listings.filter(
                  item =>
                    item.status === 'approved' && item.saleStatus !== 'sold',
                ).length
              }
            </Text>
            <Body muted>Barang aktif</Body>
          </View>
          <View style={styles.stat}>
            <Text style={styles.value}>{completed}</Text>
            <Body muted>Terjual</Body>
          </View>
        </View>
        <Button
          title="Edit profil"
          variant="secondary"
          onPress={() => navigation.navigate('EditProfile')}
        />
      </Card>
      <Card>
        <Button
          title="Barang favorit"
          variant="secondary"
          onPress={() => navigation.navigate('Favorites')}
        />
        <Button
          title="Bantuan & customer service"
          variant="secondary"
          onPress={() => navigation.navigate('Support')}
        />
        {profile?.role === 'admin' ? (
          <Button
            title="Buka dashboard admin"
            onPress={() => navigation.navigate('AdminPanel')}
          />
        ) : null}
      </Card>
      <Title subtitle="Pantau persetujuan dan perbarui barangmu">
        Lapak saya
      </Title>
      {!listings.length ? (
        <Empty
          title="Lapakmu masih kosong"
          description="Mulai jual barang pertamamu melalui menu Jual."
        />
      ) : null}
      {listings
        .slice()
        .reverse()
        .map(product => (
          <Card key={product.id}>
            <Row>
              <ProductImage uri={product.imageUrl} size={72} />
              <View style={styles.flex}>
                <Text style={styles.productTitle}>{product.title}</Text>
                <Body>{money(product.price)}</Body>
                <Badge status={productBadgeStatus(product)} />
              </View>
            </Row>
            {product.rejectionReason ? (
              <Body muted>Catatan admin: {product.rejectionReason}</Body>
            ) : null}
            {product.status !== 'removed' ? (
              <>
                <Button
                  title="Lihat barang"
                  variant="secondary"
                  onPress={() =>
                    navigation.navigate('ProductDetails', {
                      productId: product.id,
                    })
                  }
                />
                <Button
                  title="Edit barang"
                  variant="secondary"
                  onPress={() =>
                    navigation.navigate('SellProduct', {productId: product.id})
                  }
                />
              </>
            ) : (
              <Body muted>Barang ini sudah dinonaktifkan.</Body>
            )}
          </Card>
        ))}
      <Card>
        <Button
          title="Ganti kata sandi melalui email"
          variant="secondary"
          onPress={sendReset}
        />
        <Button
          title="Keluar dari akun"
          variant="danger"
          onPress={confirmLogout}
        />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {borderColor: '#DCE5D4', backgroundColor: '#F0F3E8'},
  flex: {flex: 1, gap: 4},
  name: {fontSize: 22, fontWeight: '800', color: '#173F35'},
  stats: {
    flexDirection: 'row',
    marginVertical: 16,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#DCE5D4',
  },
  stat: {flex: 1, alignItems: 'center', gap: 4},
  value: {fontSize: 23, fontWeight: '800', color: '#173F35'},
  productTitle: {fontSize: 16, fontWeight: '700', color: '#173F35'},
});
