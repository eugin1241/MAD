/**
 * @format
 */

import React from 'react';
import {StatusBar, useColorScheme} from 'react-native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {NavigationContainer} from '@react-navigation/native';
import {AuthProvider} from './src/context/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';
import {MarketplaceProvider} from './src/context/MarketplaceContext';

function App() {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <SafeAreaProvider>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <AuthProvider>
        <MarketplaceProvider>
          <NavigationContainer>
            <AppNavigator />
          </NavigationContainer>
        </MarketplaceProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

export default App;
