import React, {useEffect, useRef, useState} from 'react';
import {Alert, StyleSheet, Text, View} from 'react-native';
import {launchImageLibrary} from 'react-native-image-picker';
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
  const {
    user,
    profile,
    data,
    actions,
    loading,
    refresh,
    uploadProductImage,
  } = useMarketplace();
  const productId = route?.params?.productId;
  const product = data.products.find(item => item.id === productId);
  const hydrated = useRef(null);
  const [form, setForm] = useState(() => blankForm(profile?.location));
  const [selectedImage, setSelectedImage] = useState(null);
  const ownProducts = data.products
    .filter(item => item.sellerId === user.uid)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const update = (key, value) =>
    setForm(previous => ({...previous, [key]: value}));
  const selectPhoto = async () => {
    const result = await launchImageLibrary({
      mediaType: 'photo',
      selectionLimit: 1,
      maxWidth: 1600,
      maxHeight: 1600,
      quality: 0.8,
    });
    if (result.didCancel) {
      return;
    }
    if (result.errorCode) {
      throw new Error(result.errorMessage || 'Foto tidak dapat dipilih.');
    }
    const image = result.assets?.[0];
    if (!image?.uri) {
      throw new Error('Foto yang dipilih tidak dapat dibaca.');
    }
    if (image.fileSize > 5 * 1024 * 1024) {
      throw new Error('Ukuran foto maksimal 5 MB.');
    }
    setSelectedImage(image);
  };

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
      setSelectedImage(null);
      hydrated.current = productId;
    } else if (!productId && hydrated.current) {
      setForm(blankForm(profile?.location));
      setSelectedImage(null);
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
    const imageUrl = selectedImage
      ? await uploadProductImage(selectedImage)
      : form.imageUrl;
    await actions.saveProduct(
      {
        ...form,
        imageUrl,
        price: Number(form.price),
        stock: Number(form.stock),
      },
      productId,
    );
    if (!productId) {
      setForm(blankForm(profile?.location));
    } else {
      setForm(previous => ({...previous, imageUrl}));
    }
    setSelectedImage(null);
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
        <Button
          title={
            selectedImage || form.imageUrl
              ? 'Pilih foto lain dari galeri'
              : 'Pilih foto dari galeri'
          }
          variant="secondary"
          onPress={selectPhoto}
        />
        <Body muted>Opsional · Pilih satu foto JPG, PNG, atau WebP (maks. 5 MB).</Body>
        {!!(selectedImage?.uri || form.imageUrl) && (
          <View style={styles.preview}>
            <ProductImage
              uri={selectedImage?.uri || form.imageUrl}
              size={160}
            />
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
              <Badge status={productBadgeStatus(item)} />
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
