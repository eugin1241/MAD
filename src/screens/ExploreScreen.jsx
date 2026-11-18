import React, {useMemo, useState} from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {useMarketplace} from '../context/MarketplaceContext';
import {
  Screen,
  Title,
  Card,
  Button,
  Field,
  Chips,
  Empty,
  Badge,
  ProductImage,
  Body,
} from '../components/MarketplaceUI';
import {
  availableStock,
  money,
  productBadgeStatus,
} from '../utils/marketplace';

export function ProductCard({product, orders, onPress, footer}) {
  const stock = availableStock(product, orders);
  return (
    <Card style={styles.productCard}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Lihat ${product.title}, ${money(product.price)}`}
        onPress={onPress}
        style={styles.productRow}
      >
        <ProductImage uri={product.imageUrl} size={104} />
        <View style={styles.productInfo}>
          <Text style={styles.productCondition}>
            {product.condition} ·{' '}
            {stock > 0 ? `${stock} tersedia` : 'Stok habis'}
          </Text>
          <Text style={styles.productTitle} numberOfLines={2}>
            {product.title}
          </Text>
          <Text style={styles.productPrice}>{money(product.price)}</Text>
          <Text style={styles.location} numberOfLines={1}>
            {product.location || 'Lokasi belum diisi'}
          </Text>
          <Badge status={productBadgeStatus(product)} />
        </View>
      </Pressable>
      {footer}
    </Card>
  );
}

export default function ExploreScreen({navigation}) {
  const {data, loading, refresh, profile} = useMarketplace();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [condition, setCondition] = useState('all');
  const [sort, setSort] = useState('newest');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [limit, setLimit] = useState(12);
  const invalidRange =
    (minPrice !== '' &&
      (!Number.isFinite(Number(minPrice)) || Number(minPrice) < 0)) ||
    (maxPrice !== '' &&
      (!Number.isFinite(Number(maxPrice)) || Number(maxPrice) < 0)) ||
    (minPrice !== '' && maxPrice !== '' && Number(minPrice) > Number(maxPrice));
  const products = useMemo(() => {
    const search = query.trim().toLocaleLowerCase();
    const result = data.products.filter(
      product =>
        product.status === 'approved' &&
        (category === 'all' || product.categoryId === category) &&
        (condition === 'all' || product.condition === condition) &&
        (!search ||
          `${product.title} ${product.description} ${product.location}`
            .toLocaleLowerCase()
            .includes(search)) &&
        (minPrice === '' || product.price >= Number(minPrice)) &&
        (maxPrice === '' || product.price <= Number(maxPrice)),
    );
    return result.sort((a, b) =>
      sort === 'low'
        ? a.price - b.price
        : sort === 'high'
        ? b.price - a.price
        : new Date(b.createdAt) - new Date(a.createdAt),
    );
  }, [data.products, query, category, condition, sort, minPrice, maxPrice]);
  const resetFilters = () => {
    setQuery('');
    setCategory('all');
    setCondition('all');
    setSort('newest');
    setMinPrice('');
    setMaxPrice('');
    setLimit(12);
  };

  return (
    <Screen refreshing={loading} onRefresh={refresh}>
      <Title
        subtitle={`Halo, ${
          profile?.name?.split(' ')[0] || 'teman'
        }! Temukan barang pilihanmu.`}
      >
        Jelajahi
      </Title>
      <View style={styles.hero}>
        <Text style={styles.eyebrow}>BARANG PILIHAN, CERITA BARU</Text>
        <Text style={styles.heroTitle}>Temukan yang kamu cari.</Text>
        <Text style={styles.heroBody}>
          Belanja, ngobrol dengan penjual, dan beri barang kesempatan baru.
        </Text>
        <View style={styles.heroBadge}>
          <Text style={styles.heroBadgeText}>Jual beli jadi lebih dekat</Text>
        </View>
      </View>
      <Field
        label="Cari barang"
        placeholder="Nama barang, deskripsi, atau lokasi"
        value={query}
        onChangeText={value => {
          setQuery(value);
          setLimit(12);
        }}
        returnKeyType="search"
      />
      <Chips
        options={[
          {id: 'all', label: 'Semua'},
          ...data.categories.map(item => ({id: item.id, label: item.name})),
        ]}
        value={category}
        onChange={value => {
          setCategory(value);
          setLimit(12);
        }}
      />
      <Button
        title={showFilters ? 'Tutup filter' : 'Filter & urutkan'}
        variant="secondary"
        onPress={() => setShowFilters(value => !value)}
      />
      {showFilters && (
        <Card>
          <Body>Kondisi barang</Body>
          <Chips
            options={[
              {id: 'all', label: 'Semua kondisi'},
              {id: 'Baru', label: 'Baru'},
              {id: 'Bekas', label: 'Bekas'},
            ]}
            value={condition}
            onChange={setCondition}
          />
          <Field
            label="Harga minimum (Rp)"
            placeholder="0"
            value={minPrice}
            onChangeText={setMinPrice}
            keyboardType="number-pad"
          />
          <Field
            label="Harga maksimum (Rp)"
            placeholder="Tanpa batas"
            value={maxPrice}
            onChangeText={setMaxPrice}
            keyboardType="number-pad"
          />
          {invalidRange && (
            <Text style={styles.error}>
              Isi rentang harga yang valid. Harga minimum tidak boleh melebihi
              maksimum.
            </Text>
          )}
          <Body>Urutkan</Body>
          <Chips
            options={[
              {id: 'newest', label: 'Terbaru'},
              {id: 'low', label: 'Termurah'},
              {id: 'high', label: 'Termahal'},
            ]}
            value={sort}
            onChange={setSort}
          />
          <Button
            title="Reset pencarian & filter"
            variant="secondary"
            onPress={resetFilters}
          />
        </Card>
      )}
      <View style={styles.sectionRow}>
        <Text style={styles.sectionTitle}>Pilihan untukmu</Text>
        <Text style={styles.location}>
          {invalidRange ? 0 : products.length} barang
        </Text>
      </View>
      {!invalidRange &&
        products
          .slice(0, limit)
          .map(product => (
            <ProductCard
              key={product.id}
              product={product}
              orders={data.orders}
              onPress={() =>
                navigation.navigate('ProductDetails', {productId: product.id})
              }
            />
          ))}
      {(invalidRange || products.length === 0) && (
        <Empty
          title="Belum ada barang yang cocok"
          description="Coba kata kunci atau kategori lain. Barang baru akan tampil setelah disetujui admin."
        />
      )}
      {!invalidRange && products.length > limit && (
        <Button
          title="Lihat lebih banyak"
          variant="secondary"
          onPress={() => setLimit(value => value + 12)}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    backgroundColor: '#173F35',
    borderRadius: 24,
    padding: 24,
    marginBottom: 22,
  },
  eyebrow: {
    color: '#D7F27B',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.6,
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 30,
    fontWeight: '800',
    lineHeight: 36,
    marginTop: 12,
    maxWidth: 260,
  },
  heroBody: {color: '#D6E4DF', fontSize: 14, lineHeight: 22, marginTop: 12},
  heroBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#D7F27B',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 20,
  },
  heroBadgeText: {color: '#173F35', fontWeight: '700', fontSize: 12},
  sectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 12,
  },
  sectionTitle: {fontSize: 19, fontWeight: '800', color: '#173F35'},
  productCard: {padding: 12, marginBottom: 12},
  productRow: {flexDirection: 'row', alignItems: 'center', gap: 14},
  productInfo: {flex: 1},
  productCondition: {
    fontSize: 10,
    color: '#64736D',
    marginBottom: 6,
    fontWeight: '600',
  },
  productTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#213C33',
    lineHeight: 21,
  },
  productPrice: {
    fontSize: 17,
    color: '#173F35',
    fontWeight: '800',
    marginTop: 7,
    marginBottom: 5,
  },
  location: {fontSize: 12, color: '#64736D'},
  error: {fontSize: 13, color: '#B43E2D', marginBottom: 12},
});
