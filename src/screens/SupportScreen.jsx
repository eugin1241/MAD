import React, {useState} from 'react';
import {StyleSheet, Text} from 'react-native';
import {useMarketplace} from '../context/MarketplaceContext';
import {
  Badge,
  Body,
  Button,
  Card,
  Chips,
  Empty,
  Field,
  Screen,
  Title,
} from '../components/MarketplaceUI';
import {dateLabel} from '../utils/marketplace';

export default function SupportScreen({navigation}) {
  const {user, profile, data, actions, loading, refresh, error} =
    useMarketplace();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [filter, setFilter] = useState('all');
  const isAdmin = profile?.role === 'admin';
  const tickets = data.tickets.filter(
    ticket =>
      (isAdmin || ticket.userId === user?.uid) &&
      (filter === 'all' || ticket.status === filter),
  );

  async function create() {
    if (!subject.trim() || !message.trim()) {
      throw new Error('Isi judul dan ceritakan masalahmu terlebih dahulu.');
    }
    const ticket = await actions.createTicket(subject.trim(), message.trim());
    setSubject('');
    setMessage('');
    navigation.navigate('SupportThread', {ticketId: ticket.id});
  }

  return (
    <Screen refreshing={loading} onRefresh={refresh}>
      <Title
        subtitle={
          isAdmin
            ? 'Bantu pengguna menyelesaikan kendalanya'
            : 'Kami siap membantu transaksi dan akunmu'
        }
      >
        Pusat bantuan
      </Title>
      {error ? <Body>{error}</Body> : null}
      {!isAdmin ? (
        <Card>
          <Text style={styles.heading}>Buat permintaan bantuan</Text>
          <Field
            label="Judul masalah"
            value={subject}
            onChangeText={setSubject}
            maxLength={120}
            placeholder="Contoh: kendala pada pesanan"
          />
          <Field
            label="Ceritakan masalahmu"
            value={message}
            onChangeText={setMessage}
            multiline
            numberOfLines={4}
            maxLength={2000}
            textAlignVertical="top"
            placeholder="Sertakan nama barang atau informasi pesanan yang berkaitan."
          />
          <Button title="Kirim ke customer service" onPress={create} />
        </Card>
      ) : null}
      <Chips
        options={[
          {id: 'all', label: 'Semua'},
          {id: 'open', label: 'Terbuka'},
          {id: 'closed', label: 'Selesai'},
        ]}
        value={filter}
        onChange={setFilter}
      />
      {!tickets.length ? (
        <Empty
          title="Belum ada permintaan bantuan"
          description="Percakapan dengan customer service akan tersimpan di sini."
        />
      ) : null}
      {tickets
        .slice()
        .reverse()
        .map(ticket => (
          <Card key={ticket.id}>
            <Badge status={ticket.status} />
            <Text style={styles.heading}>{ticket.subject}</Text>
            {isAdmin ? (
              <Body muted>
                {data.profiles.find(item => item.id === ticket.userId)?.name ||
                  'Pengguna'}
              </Body>
            ) : null}
            <Body muted>{dateLabel(ticket.createdAt)}</Body>
            <Button
              title="Buka percakapan"
              variant="secondary"
              onPress={() =>
                navigation.navigate('SupportThread', {ticketId: ticket.id})
              }
            />
          </Card>
        ))}
    </Screen>
  );
}
const styles = StyleSheet.create({
  heading: {fontSize: 17, fontWeight: '700', color: '#173F35'},
});
