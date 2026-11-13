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

function ModerationCard({product, seller, actions, categories}) {
  const [reason, setReason] = useState('');
  async function reject() {
    if (!reason.trim()) {
      throw new Error(
        'Isi alasan penolakan agar penjual dapat memperbaiki barangnya.',
      );
    }
    await actions.moderateProduct(product.id, 'rejected', reason.trim());
  }
  async function remove() {
    if (!reason.trim()) {
      throw new Error('Isi alasan barang dinonaktifkan terlebih dahulu.');
    }
    await actions.removeProduct(product.id, reason.trim());
  }
  return (
    <Card>
      <Row>
        <ProductImage uri={product.imageUrl} size={76} />
        <View style={styles.flex}>
          <Text style={styles.heading}>{product.title}</Text>
          <Body>{money(product.price)}</Body>
          <Badge status={product.status} />
        </View>
      </Row>
      <Body muted>
        Penjual: {seller?.name || 'Pengguna'} ·{' '}
        {product.location || 'Lokasi belum diisi'}
      </Body>
      <Body muted>
        {categories.find(item => item.id === product.categoryId)?.name ||
          'Tanpa kategori'}{' '}
        · {product.condition} · Stok total {product.stock}
      </Body>
      <Body>{product.description}</Body>
      {product.rejectionReason ? (
        <Body muted>Catatan sebelumnya: {product.rejectionReason}</Body>
      ) : null}
      {product.status !== 'removed' ? (
        <>
          <Field
            label="Alasan penolakan / penonaktifan"
            value={reason}
            onChangeText={setReason}
            maxLength={500}
            multiline
            placeholder="Jelaskan masalah yang perlu diperbaiki"
          />
          {product.status === 'pending' ? (
            <>
              <Button
                title="Setujui & tayangkan"
                onPress={() =>
                  actions.moderateProduct(product.id, 'approved', '')
                }
              />
              <Button
                title="Tolak pengajuan"
                variant="secondary"
                onPress={reject}
              />
            </>
          ) : null}
          <Button
            title="Nonaktifkan barang"
            variant="danger"
            onPress={remove}
          />
        </>
      ) : null}
    </Card>
  );
}

function CategoryEditor({category, actions}) {
  const [name, setName] = useState(category.name);
  async function save() {
    if (!name.trim()) {
      throw new Error('Nama kategori wajib diisi.');
    }
    await actions.saveCategory(name.trim(), category.id);
    Alert.alert('Kategori tersimpan', 'Nama kategori berhasil diperbarui.');
  }
  return (
    <Card>
      <Field
        label="Nama kategori"
        value={name}
        onChangeText={setName}
        maxLength={60}
      />
      <Button
        title="Simpan nama kategori"
        variant="secondary"
        onPress={save}
        disabled={name.trim() === category.name}
      />
    </Card>
  );
}

export default function AdminScreen({navigation}) {
  const {profile, data, actions, loading, refresh, error} = useMarketplace();
  const [tab, setTab] = useState('pending');
  const [categoryName, setCategoryName] = useState('');
  if (profile?.role !== 'admin') {
    return (
      <Screen>
        <Empty
          title="Khusus administrator"
          description="Akun ini tidak memiliki akses ke dashboard admin."
        />
      </Screen>
    );
  }
  const pending = data.products.filter(item => item.status === 'pending');
  const reports = data.reports.filter(item => item.status === 'open');
  const tickets = data.tickets.filter(item => item.status === 'open');
  const products = tab === 'pending' ? pending : data.products;

  async function addCategory() {
    if (!categoryName.trim()) {
      throw new Error('Isi nama kategori baru terlebih dahulu.');
    }
    await actions.saveCategory(categoryName.trim());
    setCategoryName('');
  }

  return (
    <Screen refreshing={loading} onRefresh={refresh}>
      <Title subtitle="Jaga marketplace tetap nyaman untuk semua">
        Dashboard admin
      </Title>
      {error ? <Body>{error}</Body> : null}
      <Card style={styles.overview}>
        <Text style={styles.kicker}>PERLU DITINDAKLANJUTI</Text>
        <View style={styles.stats}>
          <View style={styles.stat}>
            <Text style={styles.number}>{pending.length}</Text>
            <Body muted>Pengajuan</Body>
          </View>
          <View style={styles.stat}>
            <Text style={styles.number}>{reports.length}</Text>
            <Body muted>Laporan</Body>
          </View>
          <View style={styles.stat}>
            <Text style={styles.number}>{tickets.length}</Text>
            <Body muted>Tiket CS</Body>
          </View>
        </View>
        <Body muted>
          {data.products.filter(item => item.status === 'approved').length}{' '}
          barang aktif · {data.profiles.length} pengguna ·{' '}
          {data.orders.filter(item => item.status === 'completed').length}{' '}
          transaksi selesai
        </Body>
      </Card>
      <Chips
        options={[
          {id: 'pending', label: 'Persetujuan'},
          {id: 'products', label: 'Semua barang'},
          {id: 'reports', label: 'Laporan'},
          {id: 'support', label: 'Customer service'},
          {id: 'categories', label: 'Kategori'},
        ]}
        value={tab}
        onChange={setTab}
      />
      {tab === 'pending' || tab === 'products' ? (
        <>
          {!products.length ? (
            <Empty
              title={
                tab === 'pending'
                  ? 'Semua pengajuan sudah ditinjau'
                  : 'Belum ada barang'
              }
              description="Pengajuan baru dari penjual akan muncul di sini."
            />
          ) : null}
          {products
            .slice()
            .reverse()
            .map(product => (
              <ModerationCard
                key={product.id}
                product={product}
                seller={data.profiles.find(
                  item => item.id === product.sellerId,
                )}
                actions={actions}
                categories={data.categories}
              />
            ))}
        </>
      ) : null}
      {tab === 'reports' ? (
        <>
          {!reports.length ? (
            <Empty
              title="Tidak ada laporan terbuka"
              description="Laporan barang dari pengguna akan muncul di sini."
            />
          ) : null}
          {reports
            .slice()
            .reverse()
            .map(report => {
              const product = data.products.find(
                item => item.id === report.productId,
              );
              return (
                <Card key={report.id}>
                  <Text style={styles.heading}>
                    {product?.title || 'Barang tidak tersedia'}
                  </Text>
                  <Body>{report.reason}</Body>
                  <Body muted>
                    Pelapor:{' '}
                    {data.profiles.find(item => item.id === report.userId)
                      ?.name || 'Pengguna'}{' '}
                    · {dateLabel(report.createdAt)}
                  </Body>
                  {product && product.status !== 'removed' ? (
                    <Button
                      title="Nonaktifkan barang yang dilaporkan"
                      variant="danger"
                      onPress={() =>
                        actions.removeProduct(
                          product.id,
                          `Laporan pengguna: ${report.reason}`,
                        )
                      }
                    />
                  ) : null}
                  <Button
                    title="Tandai laporan selesai"
                    variant="secondary"
                    onPress={() => actions.resolveReport(report.id)}
                  />
                </Card>
              );
            })}
        </>
      ) : null}
      {tab === 'support' ? (
        <>
          <Button
            title="Lihat seluruh tiket bantuan"
            variant="secondary"
            onPress={() => navigation.navigate('Support')}
          />
          {!tickets.length ? (
            <Empty
              title="Tidak ada tiket terbuka"
              description="Permintaan bantuan baru akan muncul di sini."
            />
          ) : null}
          {tickets
            .slice()
            .reverse()
            .map(ticket => (
              <Card key={ticket.id}>
                <Text style={styles.heading}>{ticket.subject}</Text>
                <Body muted>
                  {data.profiles.find(item => item.id === ticket.userId)
                    ?.name || 'Pengguna'}{' '}
                  · {dateLabel(ticket.createdAt)}
                </Body>
                <Button
                  title="Balas tiket"
                  onPress={() =>
                    navigation.navigate('SupportThread', {ticketId: ticket.id})
                  }
                />
              </Card>
            ))}
        </>
      ) : null}
      {tab === 'categories' ? (
        <>
          <Card>
            <Text style={styles.heading}>Tambah kategori</Text>
            <Field
              label="Nama kategori baru"
              value={categoryName}
              onChangeText={setCategoryName}
              maxLength={60}
              placeholder="Contoh: Perlengkapan kuliah"
            />
            <Button title="Tambah kategori" onPress={addCategory} />
          </Card>
          {data.categories.map(category => (
            <CategoryEditor
              key={`${category.id}-${category.name}`}
              category={category}
              actions={actions}
            />
          ))}
        </>
      ) : null}
    </Screen>
  );
}
const styles = StyleSheet.create({
  flex: {flex: 1, gap: 5},
  heading: {fontSize: 17, fontWeight: '700', color: '#173F35'},
  overview: {backgroundColor: '#EBF1DE', borderColor: '#D5DFBF'},
  kicker: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
    color: '#58704D',
  },
  stats: {flexDirection: 'row', paddingVertical: 16},
  stat: {flex: 1, gap: 3},
  number: {fontSize: 32, fontWeight: '800', color: '#173F35'},
});
