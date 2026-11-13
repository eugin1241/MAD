import React, {useMemo, useState} from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {useMarketplace} from '../context/MarketplaceContext';
import {
  Body,
  Card,
  Chips,
  Empty,
  ProductImage,
  Row,
  Screen,
  Title,
} from '../components/MarketplaceUI';
import {dateLabel, unreadCount} from '../utils/marketplace';

const tabs = [
  {id: 'buy', label: 'Beli'},
  {id: 'sell', label: 'Jual'},
];

export default function ChatScreen({navigation}) {
  const {user, data, loading, refresh} = useMarketplace();
  const [tab, setTab] = useState('buy');
  const conversations = useMemo(() => {
    const role = tab === 'buy' ? 'buyerId' : 'sellerId';
    return data.conversations
      .filter(conversation => conversation[role] === user.uid)
      .map(conversation => {
        const messages = data.messages
          .filter(message => message.conversationId === conversation.id)
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        return {conversation, latest: messages[0]};
      })
      .sort((a, b) =>
        (b.latest?.createdAt || b.conversation.createdAt).localeCompare(
          a.latest?.createdAt || a.conversation.createdAt,
        ),
      );
  }, [data.conversations, data.messages, tab, user.uid]);

  return (
    <Screen refreshing={loading} onRefresh={refresh}>
      <Title subtitle="Tanya barang, buat kesepakatan, lalu bertemu.">
        Chat
      </Title>
      <Chips options={tabs} value={tab} onChange={setTab} />
      <Body muted>
        {tab === 'buy'
          ? 'Percakapan tentang barang yang ingin kamu beli.'
          : 'Percakapan dengan calon pembeli barangmu.'}
      </Body>
      {conversations.length === 0 ? (
        <Empty
          title="Belum ada percakapan"
          description={
            tab === 'buy'
              ? 'Buka detail produk dan pilih Chat penjual untuk memulai.'
              : 'Pesan dari calon pembeli akan muncul di sini.'
          }
        />
      ) : (
        conversations.map(({conversation, latest}) => {
          const product = data.products.find(
            item => item.id === conversation.productId,
          );
          const partnerId =
            tab === 'buy' ? conversation.sellerId : conversation.buyerId;
          const partner = data.profiles.find(item => item.id === partnerId);
          const unread = unreadCount(conversation.id, user.uid, data.messages);
          return (
            <Pressable
              key={conversation.id}
              accessibilityRole="button"
              accessibilityLabel={`Chat ${
                partner?.name || 'Pengguna'
              } tentang ${product?.title || 'produk'}`}
              onPress={() =>
                navigation.navigate('Conversation', {
                  conversationId: conversation.id,
                })
              }
            >
              <Card>
                <Row>
                  <ProductImage uri={product?.imageUrl} size={64} />
                  <View style={styles.flex}>
                    <Text style={styles.name}>
                      {partner?.name || 'Pengguna'}
                    </Text>
                    <Text style={styles.product} numberOfLines={1}>
                      {product?.title || 'Produk tidak tersedia'}
                    </Text>
                    <Text style={styles.preview} numberOfLines={1}>
                      {latest
                        ? `${latest.senderId === user.uid ? 'Kamu: ' : ''}${
                            latest.text
                          }`
                        : 'Mulai percakapan'}
                    </Text>
                  </View>
                  {unread > 0 ? (
                    <View style={styles.unread}>
                      <Text style={styles.unreadText}>
                        {unread > 99 ? '99+' : unread}
                      </Text>
                    </View>
                  ) : null}
                </Row>
                <Text style={styles.time}>
                  {dateLabel(latest?.createdAt || conversation.createdAt)}
                </Text>
              </Card>
            </Pressable>
          );
        })
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: {flex: 1},
  name: {fontSize: 16, fontWeight: '700', color: '#173F35'},
  product: {fontSize: 13, color: '#52635B', marginTop: 3},
  preview: {fontSize: 14, color: '#34473F', marginTop: 7},
  time: {fontSize: 11, color: '#708078', marginTop: 10, textAlign: 'right'},
  unread: {
    minWidth: 25,
    height: 25,
    paddingHorizontal: 6,
    borderRadius: 13,
    backgroundColor: '#173F35',
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadText: {fontSize: 12, fontWeight: '700', color: '#FFFFFF'},
});
