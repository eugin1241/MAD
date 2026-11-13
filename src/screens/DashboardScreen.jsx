import React, {useCallback, useState} from 'react';
import {
  ActivityIndicator,
  AppState,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useFocusEffect} from '@react-navigation/native';
import {useMarketplace} from '../context/MarketplaceContext';
import {useAuth} from '../context/AuthContext';
import {KlaboxLogo} from '../components/AuthUI';
import {Button, Body, colors, Screen, Title} from '../components/MarketplaceUI';
import {unreadCount} from '../utils/marketplace';
import ExploreScreen from './ExploreScreen';
import ChatScreen from './ChatScreen';
import ActivityScreen from './ActivityScreen';
import ProfileScreen from './ProfileScreen';

const tabs = [
  {id: 'explore', label: 'Jelajahi', icon: '◇'},
  {id: 'chat', label: 'Chat', icon: '◌'},
  {id: 'sell', label: 'Jual', icon: '+'},
  {id: 'activity', label: 'Aktivitas', icon: '≡'},
  {id: 'profile', label: 'Profil', icon: '○'},
];
const screens = {
  explore: ExploreScreen,
  chat: ChatScreen,
  activity: ActivityScreen,
  profile: ProfileScreen,
};
export default function DashboardScreen({navigation}) {
  const [tab, setTab] = useState('explore');
  const {profile, user, data, loading, error, refresh} = useMarketplace();
  const {logout} = useAuth();
  useFocusEffect(
    useCallback(() => {
      refresh();
      const timer = setInterval(() => {
        if (AppState.currentState === 'active') {
          refresh();
        }
      }, 10000);
      return () => clearInterval(timer);
    }, [refresh]),
  );
  if (!profile) {
    return (
      <SafeAreaView style={styles.page}>
        <Screen>
          <Title subtitle="Temukan barang, mulai percakapan, dan jual milikmu.">
            Klabox
          </Title>
          {loading ? (
            <ActivityIndicator color={colors.primary} />
          ) : (
            <>
              <Body>{error || 'Menyiapkan profil marketplace...'}</Body>
              <Button title="Coba lagi" onPress={refresh} />
              <Button
                title="Keluar"
                variant="secondary"
                onPress={async () => {
                  const result = await logout();
                  if (!result.success) {
                    throw new Error(result.error);
                  }
                }}
              />
            </>
          )}
        </Screen>
      </SafeAreaView>
    );
  }
  const ActiveScreen = screens[tab];
  const unread = data.conversations
    .filter(item => [item.buyerId, item.sellerId].includes(user.uid))
    .reduce(
      (sum, item) => sum + unreadCount(item.id, user.uid, data.messages),
      0,
    );
  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.page}>
      <View style={styles.brand}>
        <KlaboxLogo />
        <Text style={styles.brandCaption}>
          TEMUKAN. TAWARKAN. TEMUKAN LAGI.
        </Text>
      </View>
      {error ? (
        <View style={styles.error}>
          <Body muted>{error}</Body>
          <Button title="Muat ulang" variant="secondary" onPress={refresh} />
        </View>
      ) : null}
      <ActiveScreen navigation={navigation} />
      <View style={styles.tabs}>
        {tabs.map(item => (
          <Pressable
            key={item.id}
            accessibilityRole="tab"
            accessibilityState={{selected: tab === item.id}}
            accessibilityLabel={item.label}
            onPress={() =>
              item.id === 'sell'
                ? navigation.navigate('SellProduct')
                : setTab(item.id)
            }
            style={[styles.tab, item.id === 'sell' && styles.sellTab]}
          >
            <Text
              style={[
                styles.icon,
                tab === item.id && styles.active,
                item.id === 'sell' && styles.sellIcon,
              ]}
            >
              {item.icon}
            </Text>
            <Text style={[styles.tabLabel, tab === item.id && styles.active]}>
              {item.label}
              {item.id === 'chat' && unread > 0
                ? ` (${Math.min(unread, 99)})`
                : ''}
            </Text>
          </Pressable>
        ))}
      </View>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  page: {flex: 1, backgroundColor: colors.background},
  brand: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  brandCaption: {
    fontSize: 8,
    color: colors.muted,
    letterSpacing: 1.4,
    marginTop: 2,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 6,
    paddingVertical: 7,
  },
  tab: {flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: 52},
  icon: {fontSize: 24, color: colors.muted},
  tabLabel: {
    fontSize: 10,
    color: colors.muted,
    fontWeight: '600',
    marginTop: 3,
  },
  active: {color: colors.primary, fontWeight: '800'},
  sellTab: {
    backgroundColor: colors.accent,
    borderRadius: 16,
    marginHorizontal: 6,
  },
  sellIcon: {fontSize: 28, color: colors.primary},
  error: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: '#FFF0DB',
    gap: 5,
  },
});
