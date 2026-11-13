import React, {useEffect, useMemo, useRef, useState} from 'react';
import {
  AppState,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {useIsFocused} from '@react-navigation/native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useMarketplace} from '../context/MarketplaceContext';
import {
  Body,
  Button,
  Empty,
  Field,
  ProductImage,
  Row,
} from '../components/MarketplaceUI';
import {dateLabel, money} from '../utils/marketplace';

function MessageBubble({message, mine, partnerId}) {
  return (
    <View style={[styles.bubble, mine ? styles.mine : styles.theirs]}>
      <Text style={[styles.message, mine && styles.mineText]}>
        {message.text}
      </Text>
      <Text style={[styles.timestamp, mine && styles.mineTimestamp]}>
        {dateLabel(message.createdAt)}
        {mine && message.readBy?.includes(partnerId) ? ' · Dibaca' : ''}
      </Text>
    </View>
  );
}

export default function ConversationScreen({route, navigation}) {
  const {conversationId} = route.params;
  const {user, data, actions, refresh} = useMarketplace();
  const focused = useIsFocused();
  const [text, setText] = useState('');
  const [syncError, setSyncError] = useState('');
  const list = useRef(null);
  const inFlight = useRef(false);
  const latest = useRef({refresh, actions});
  latest.current = {refresh, actions};

  const conversation = data.conversations.find(
    item =>
      item.id === conversationId &&
      (item.buyerId === user.uid || item.sellerId === user.uid),
  );
  const product = data.products.find(
    item => item.id === conversation?.productId,
  );
  const partnerId =
    conversation?.buyerId === user.uid
      ? conversation?.sellerId
      : conversation?.buyerId;
  const partner = data.profiles.find(item => item.id === partnerId);
  const messages = useMemo(
    () =>
      data.messages
        .filter(message => message.conversationId === conversationId)
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    [data.messages, conversationId],
  );
  const canRead = Boolean(conversation);

  useEffect(() => {
    if (!focused || !canRead) {
      return undefined;
    }
    let alive = true;
    let timer;
    const sync = async () => {
      if (!alive || AppState.currentState !== 'active' || inFlight.current) {
        return;
      }
      inFlight.current = true;
      try {
        await latest.current.refresh();
        if (alive && AppState.currentState === 'active') {
          await latest.current.actions.markRead(conversationId);
          if (alive) {
            setSyncError('');
          }
        }
      } catch (error) {
        if (alive) {
          setSyncError(error.message || 'Pesan belum berhasil diperbarui.');
        }
      } finally {
        inFlight.current = false;
      }
    };
    const start = () => {
      clearInterval(timer);
      if (AppState.currentState === 'active') {
        sync();
        timer = setInterval(sync, 5000);
      }
    };
    start();
    const subscription = AppState.addEventListener('change', state => {
      clearInterval(timer);
      if (state === 'active') {
        start();
      }
    });
    return () => {
      alive = false;
      clearInterval(timer);
      subscription.remove();
    };
  }, [focused, canRead, conversationId]);

  if (!conversation) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <Empty
          title="Percakapan tidak tersedia"
          description="Percakapan ini tidak ditemukan atau bukan milikmu."
        />
      </SafeAreaView>
    );
  }

  const send = async () => {
    const outgoing = text.trim();
    if (!outgoing) {
      return;
    }
    await actions.sendMessage(conversationId, outgoing);
    setText(current => (current.trim() === outgoing ? '' : current));
    setSyncError('');
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
      >
        <View style={styles.header}>
          <Text style={styles.partner}>{partner?.name || 'Pengguna'}</Text>
          <Body muted>
            {conversation.sellerId === user.uid ? 'Calon pembeli' : 'Penjual'}
          </Body>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Lihat produk dalam percakapan"
            disabled={!product}
            onPress={() =>
              navigation.navigate('ProductDetails', {
                productId: conversation.productId,
              })
            }
          >
            <View style={styles.product}>
              <Row>
                <ProductImage uri={product?.imageUrl} size={48} />
                <View style={styles.flex}>
                  <Text style={styles.productTitle} numberOfLines={1}>
                    {product?.title || 'Produk tidak tersedia'}
                  </Text>
                  <Body>{product ? money(product.price) : '—'}</Body>
                </View>
                <Text style={styles.chevron}>›</Text>
              </Row>
            </View>
          </Pressable>
        </View>
        {syncError ? (
          <Text accessibilityRole="alert" style={styles.error}>
            {syncError} Mencoba kembali otomatis.
          </Text>
        ) : null}
        <FlatList
          ref={list}
          data={messages}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.messages}
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={() =>
            list.current?.scrollToEnd({animated: true})
          }
          ListEmptyComponent={
            <Empty
              title="Mulai dengan sapaan"
              description="Tanyakan kondisi barang atau sepakati tempat bertemu."
            />
          }
          renderItem={({item}) => (
            <MessageBubble
              message={item}
              mine={item.senderId === user.uid}
              partnerId={partnerId}
            />
          )}
        />
        <View style={styles.composer}>
          <Field
            label="Pesan"
            placeholder="Tulis pesan…"
            value={text}
            onChangeText={setText}
            multiline
            maxLength={1000}
          />
          <Button title="Kirim pesan" onPress={send} disabled={!text.trim()} />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#F6F5F0'},
  flex: {flex: 1},
  header: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
  },
  partner: {fontSize: 20, fontWeight: '800', color: '#173F35'},
  product: {
    backgroundColor: '#F6F5F0',
    padding: 10,
    borderRadius: 14,
    marginTop: 12,
  },
  productTitle: {fontSize: 14, fontWeight: '600', color: '#173F35'},
  chevron: {fontSize: 26, color: '#173F35'},
  messages: {padding: 20, flexGrow: 1},
  bubble: {maxWidth: '85%', padding: 13, borderRadius: 18, marginBottom: 12},
  mine: {
    alignSelf: 'flex-end',
    backgroundColor: '#173F35',
    borderBottomRightRadius: 4,
  },
  theirs: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 4,
  },
  message: {fontSize: 15, lineHeight: 22, color: '#173F35'},
  mineText: {color: '#FFFFFF'},
  timestamp: {fontSize: 10, color: '#738178', marginTop: 8},
  mineTimestamp: {color: '#CEE1D6'},
  composer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 14,
    backgroundColor: '#FFFFFF',
  },
  error: {
    backgroundColor: '#FBE9D8',
    color: '#7C461C',
    padding: 12,
    fontSize: 12,
  },
});
