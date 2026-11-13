import React from 'react';
import {View, ActivityIndicator, StyleSheet} from 'react-native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {useAuth} from '../context/AuthContext';

import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import DashboardScreen from '../screens/DashboardScreen';
import ProductDetailsScreen from '../screens/ProductDetailsScreen';
import SellProductScreen from '../screens/SellProductScreen';
import FavoritesScreen from '../screens/FavoritesScreen';
import ConversationScreen from '../screens/ConversationScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import SellerProfileScreen from '../screens/SellerProfileScreen';
import SupportScreen from '../screens/SupportScreen';
import SupportThreadScreen from '../screens/SupportThreadScreen';
import AdminScreen from '../screens/AdminScreen';

const detailScreens = [
  ['ProductDetails', ProductDetailsScreen, 'Detail barang'],
  ['SellProduct', SellProductScreen, 'Jual barang'],
  ['Favorites', FavoritesScreen, 'Favorit'],
  ['Conversation', ConversationScreen, 'Percakapan'],
  ['EditProfile', EditProfileScreen, 'Edit profil'],
  ['SellerProfile', SellerProfileScreen, 'Profil penjual'],
  ['Support', SupportScreen, 'Pusat bantuan'],
  ['SupportThread', SupportThreadScreen, 'Customer service'],
  ['AdminPanel', AdminScreen, 'Panel admin'],
];

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  const {user, loading} = useAuth();

  // Tampilkan loading screen saat memeriksa status login Firebase
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#173F35" />
      </View>
    );
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      {user ? (
        // Rute untuk pengguna yang sudah login
        <Stack.Group navigationKey={user.uid}>
          <Stack.Screen name="Dashboard" component={DashboardScreen} />
          {detailScreens.map(([name, component, title]) => (
            <Stack.Screen
              key={name}
              name={name}
              component={component}
              options={{
                headerShown: true,
                title,
                headerTintColor: '#173F35',
                headerStyle: {backgroundColor: '#F6F5F0'},
                headerShadowVisible: false,
              }}
            />
          ))}
        </Stack.Group>
      ) : (
        // Rute untuk pengguna yang belum login
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen
            name="Register"
            component={RegisterScreen}
            options={{
              headerShown: false,
            }}
          />
        </>
      )}
    </Stack.Navigator>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F6F5F0',
  },
});

export default AppNavigator;
