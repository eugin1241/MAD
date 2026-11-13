import React from 'react';
import {useMarketplace} from '../context/MarketplaceContext';
import {
  Screen,
  Title,
  Card,
  Button,
  Empty,
  Body,
} from '../components/MarketplaceUI';
import {ProductCard} from './ExploreScreen';

export default function FavoritesScreen({navigation}) {
  const {user, data, actions, loading, refresh} = useMarketplace();
  const favorites = data.favorites.filter(item => item.userId === user.uid);
  return (
    <Screen refreshing={loading} onRefresh={refresh}>
      <Title subtitle="Simpan dulu, temukan lagi kapan saja.">Favoritmu</Title>
      {favorites.length === 0 && (
        <Empty
          title="Belum ada favorit"
          description="Buka detail barang di Jelajahi, lalu tekan Simpan ke favorit."
        />
      )}
      {favorites.map(favorite => {
        const product = data.products.find(
          item => item.id === favorite.productId && item.status === 'approved',
        );
        const remove = (
          <Button
            title="Hapus dari favorit"
            variant="secondary"
            onPress={() => actions.toggleFavorite(favorite.productId)}
          />
        );
        return product ? (
          <ProductCard
            key={favorite.id}
            product={product}
            orders={data.orders}
            onPress={() =>
              navigation.navigate('ProductDetails', {productId: product.id})
            }
            footer={remove}
          />
        ) : (
          <Card key={favorite.id}>
            <Body>Barang ini sudah tidak tersedia di marketplace.</Body>
            {remove}
          </Card>
        );
      })}
    </Screen>
  );
}
