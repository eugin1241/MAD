import React, {useCallback, useState} from 'react';
import {AppState, StyleSheet, Text, View} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import {useMarketplace} from '../context/MarketplaceContext';
import {
  Badge,
  Body,
  Button,
  Card,
  Empty,
  Field,
  Screen,
  Title,
} from '../components/MarketplaceUI';
import {dateLabel} from '../utils/marketplace';

export default function SupportThreadScreen({route}) {
  const {ticketId} = route.params || {};
  const {user, profile, data, actions, loading, refresh, error} =
    useMarketplace();
  const [text, setText] = useState('');
  const ticket = data.tickets.find(item => item.id === ticketId);
  const isAdmin = profile?.role === 'admin';
  const allowed = ticket && (isAdmin || ticket.userId === user?.uid);
  const replies = data.ticketMessages
    .filter(item => item.ticketId === ticketId)
    .slice()
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  const messages = ticket?.initialMessage
    ? [
        {
          id: `initial-${ticket.id}`,
          senderId: ticket.userId,
          text: ticket.initialMessage,
          createdAt: ticket.createdAt,
        },
        ...replies,
      ]
    : replies;

  useFocusEffect(
    useCallback(() => {
      if (!allowed) {
        return undefined;
      }
      const timer = setInterval(() => {
        if (AppState.currentState === 'active') {
          Promise.resolve(refresh()).catch(() => {});
        }
      }, 5000);
      return () => clearInterval(timer);
    }, [allowed, refresh]),
  );

  async function send() {
    if (!text.trim()) {
      throw new Error('Tulis pesan terlebih dahulu.');
    }
    await actions.replyTicket(ticketId, text.trim());
    setText('');
  }

  if (!allowed) {
    return (
      <Screen refreshing={loading} onRefresh={refresh}>
        <Empty
          title="Percakapan tidak tersedia"
          description="Permintaan ini tidak ditemukan atau tidak dapat diakses oleh akunmu."
        />
        {error ? <Body>{error}</Body> : null}
      </Screen>
    );
  }

  return (
    <Screen refreshing={loading} onRefresh={refresh}>
      <Title subtitle="Percakapan dengan customer service">
        {ticket.subject}
      </Title>
      {error ? <Body>{error}</Body> : null}
      <Card>
        <Badge status={ticket.status} />
        <Body muted>Dibuat {dateLabel(ticket.createdAt)}</Body>
        {isAdmin ? (
          <Body>
            Pengguna:{' '}
            {data.profiles.find(item => item.id === ticket.userId)?.name ||
              'Pengguna'}
          </Body>
        ) : null}
      </Card>
      {!messages.length ? (
        <Empty
          title="Belum ada pesan"
          description="Mulai percakapan melalui kolom di bawah."
        />
      ) : null}
      {messages.map(message => {
        const mine = message.senderId === user?.uid;
        const sender = data.profiles.find(item => item.id === message.senderId);
        return (
          <View
            key={message.id}
            style={[styles.bubble, mine ? styles.mine : styles.theirs]}
          >
            <Text style={styles.sender}>
              {mine
                ? 'Kamu'
                : sender?.role === 'admin'
                ? 'Customer service'
                : sender?.name || 'Pengguna'}
            </Text>
            <Body>{message.text}</Body>
            <Body muted style={styles.time}>
              {dateLabel(message.createdAt)}
            </Body>
          </View>
        );
      })}
      {ticket.status === 'open' ? (
        <Card>
          <Field
            label="Pesan"
            value={text}
            onChangeText={setText}
            placeholder="Tulis balasan…"
            multiline
            maxLength={2000}
            textAlignVertical="top"
          />
          <Button title="Kirim pesan" onPress={send} disabled={!text.trim()} />
          {isAdmin ? (
            <Button
              title="Tandai bantuan selesai"
              variant="secondary"
              onPress={() => actions.closeTicket(ticketId)}
            />
          ) : null}
        </Card>
      ) : (
        <Card>
          <Body muted>
            Permintaan bantuan ini sudah selesai. Buat permintaan baru jika kamu
            masih membutuhkan bantuan.
          </Body>
        </Card>
      )}
    </Screen>
  );
}
const styles = StyleSheet.create({
  bubble: {padding: 16, borderRadius: 18, gap: 6, maxWidth: '92%'},
  mine: {
    alignSelf: 'flex-end',
    backgroundColor: '#E5F1CF',
    borderBottomRightRadius: 4,
  },
  theirs: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 4,
  },
  sender: {fontWeight: '700', color: '#173F35', fontSize: 12},
  time: {fontSize: 11},
});
