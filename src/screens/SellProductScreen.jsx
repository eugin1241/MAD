import React, {useEffect, useRef, useState} from 'react';
import {Alert, StyleSheet, Text, View} from 'react-native';
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
import {availableStock, money} from '../utils/marketplace';

const blankForm = location => ({
  title: '',
  description: '',
  price: '',
  stock: '1',
  categoryId: '',
  condition: 'Bekas',
  location: location || '',
  imageUrl: '',
});

export default function SellProductScreen({navigation, route}) {
  const {user, profile, data, actions, loading, refresh} = useMarketplace();
  const productId = route?.params?.productId;
  const product = data.products.find(item => item.id === productId);
  const hydrated = useRef(null);
  const [form, setForm] = useState(() => blankForm(profile?.location));
  const ownProducts = data.products
    .filter(item => item.sellerId === user.uid)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const update = (key, value) =>
    setForm(previous => ({...previous, [key]: value}));

  useEffect(() => {
    if (productId && product && hydrated.current !== productId) {
      setForm({
        title: product.title,
        description: product.description,
        price: String(product.price),
        stock: String(product.stock),
        categoryId: product.categoryId,
        condition: product.condition,
        location: product.location,
        imageUrl: product.imageUrl || '',
      });
      hydrated.current = productId;
    } else if (!productId && hydrated.current) {
      setForm(blankForm(profile?.location));
      hydrated.current = null;
    }
  }, [productId, product, profile?.location]);

  if (
    productId &&
    (!product || product.sellerId !== user.uid || product.status === 'removed')
  ) {
    return (
      <Screen>
        <Empty
          title="Barang tidak bisa diedit"
          description="Pilih barang milikmu yang belum dihapus."
        />
        <Button
          title="Kembali"
          variant="secondary"
          onPress={() => navigation.goBack()}
        />
      </Screen>
    );
  }

  const submit = async () => {
    if (
      !form.title.trim() ||
      !form.description.trim() ||
      !form.location.trim() ||
      !form.categoryId
    ) {
      throw new Error('Lengkapi nama, deskripsi, kategori, dan lokasi barang.');
    }
    if (!Number.isSafeInteger(Number(form.price)) || Number(form.price) <= 0) {
      throw new Error(
        'Harga harus berupa angka rupiah bulat lebih dari 0, tanpa titik pemisah.',
      );
    }
    if (!Number.isSafeInteger(Number(form.stock)) || Number(form.stock) < 1) {
      throw new Error('Stok harus berupa jumlah bulat minimal 1.');
    }
    if (
      form.imageUrl.trim() &&
      !/^https:\/\/\S+$/i.test(form.imageUrl.trim())
    ) {
      throw new Error(
        'Gunakan URL foto yang diawali https:// atau kosongkan kolom foto.',
      );
    }
    await actions.saveProduct(
      {...form, price: Number(form.price), stock: Number(form.stock)},
      productId,
    );
    if (!productId) {
      setForm(blankForm(profile?.location));
    }
    Alert.alert(
      'Barang diajukan',
      'Admin akan memeriksa barangmu. Barang akan tampil di marketplace setelah disetujui.',
      productId
        ? [{text: 'Lihat barang', onPress: () => navigation.goBack()}]
        : [{text: 'Mengerti'}],
    );
  };

  return (
    <Screen refreshing={loading} onRefresh={refresh}>
      <Title
        subtitle={
          productId
            ? 'Perubahan akan diperiksa kembali oleh admin.'
            : 'Barangmu bisa jadi temuan berharga untuk orang lain.'
        }
      >
        {productId ? 'Edit barang' : 'Mulai berjualan'}
      </Title>
      <Card style={styles.tip}>
        <Text style={styles.tipTitle}>
          Foto jelas. Cerita jujur. Harga pas.
        </Text>
        <Body>
          Lengkapi informasi barang agar pembeli mudah menentukan pilihan.
        </Body>
      </Card>
      <Card>
        <Field
          label="Nama barang *"
          placeholder="Contoh: Headphone wireless kondisi mulus"
          value={form.title}
          onChangeText={value => update('title', value)}
          maxLength={100}
        />
        <Field
          label="Deskripsi *"
          placeholder="Jelaskan kondisi, kelengkapan, dan alasan dijual"
          value={form.description}
          onChangeText={value => update('description', value)}
          multiline
          maxLength={2000}
        />
        <Body>Kategori *</Body>
        {data.categories.length ? (
          <Chips
            options={data.categories.map(item => ({
              id: item.id,
              label: item.name,
            }))}
            value={form.categoryId}
            onChange={value => update('categoryId', value)}
          />
        ) : (
          <Body muted>
            Belum ada kategori. Minta admin menambahkan kategori terlebih
            dahulu.
          </Body>
        )}
        <Body>Kondisi *</Body>
        <Chips
          options={[
            {id: 'Baru', label: 'Baru'},
            {id: 'Bekas', label: 'Bekas'},
          ]}
          value={form.condition}
          onChange={value => update('condition', value)}
        />
        <Field
          label="Harga per unit (Rp) *"
          placeholder="Contoh: 150000"
          keyboardType="number-pad"
          value={form.price}
          onChangeText={value => update('price', value)}
          maxLength={12}
        />
        <Field
          label={productId ? 'Jumlah unit total *' : 'Jumlah unit tersedia *'}
          keyboardType="number-pad"
          value={form.stock}
          onChangeText={value => update('stock', value)}
          maxLength={5}
        />
        {productId && (
          <Body muted>
            Jumlah total mencakup unit yang sudah dipesan atau terjual. Saat ini
            tersisa {availableStock(product, data.orders)} unit.
          </Body>
        )}
        <Field
          label="Lokasi barang *"
          placeholder="Contoh: Manado, sekitar kampus"
          value={form.location}
          onChangeText={value => update('location', value)}
          maxLength={180}
        />
        <Field
          label="URL foto (opsional, HTTPS)"
          placeholder="https://.../foto-barang.jpg"
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          value={form.imageUrl}
          onChangeText={value => update('imageUrl', value)}
          maxLength={2000}
        />
        <Body muted>
          Masukkan tautan langsung ke gambar yang dapat diakses publik.
        </Body>
        {!!form.imageUrl && (
          <View style={styles.preview}>
            <ProductImage uri={form.imageUrl} size={160} />
          </View>
        )}
        <Button
          title={productId ? 'Simpan & ajukan ulang' : 'Ajukan barang ke admin'}
          disabled={!data.categories.length}
          onPress={submit}
        />
      </Card>
      {!productId && (
        <>
          <Text style={styles.sectionTitle}>
            Barang jualanmu · {ownProducts.length}
          </Text>
          {!ownProducts.length && (
            <Empty
              title="Belum ada barang jualan"
              description="Isi formulir di atas untuk mengajukan barang pertamamu."
            />
          )}
          {ownProducts.map(item => (
            <Card key={item.id}>
              <View style={styles.itemRow}>
                <ProductImage uri={item.imageUrl} size={64} />
                <View style={styles.itemInfo}>
                  <Text style={styles.itemTitle}>{item.title}</Text>
                  <Body>{money(item.price)}</Body>
                </View>
              </View>
              <Badge status={item.status} />
              {item.status === 'rejected' && (
                <Body muted>
                  Alasan:{' '}
                  {item.rejectionReason || 'Hubungi admin untuk detail.'}
                </Body>
              )}
              <Button
                title="Lihat & kelola barang"
                variant="secondary"
                onPress={() =>
                  navigation.navigate('ProductDetails', {productId: item.id})
                }
              />
            </Card>
          ))}
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  tip: {backgroundColor: '#E7EFCD', borderWidth: 0},
  tipTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#173F35',
    marginBottom: 8,
  },
  preview: {alignItems: 'center', marginVertical: 14},
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#173F35',
    marginTop: 18,
    marginBottom: 14,
  },
  itemRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  itemInfo: {flex: 1},
  itemTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#173F35',
    marginBottom: 5,
  },
});
