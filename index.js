/**
 * @format
 */

import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

// Mendaftarkan nama project baru ('MyProject') dan nama project lama ('MyMobileProject')
// agar aplikasi dapat berjalan lancar baik saat dibuka via APK baru maupun APK lama
AppRegistry.registerComponent(appName, () => App);
AppRegistry.registerComponent('MyMobileProject', () => App);
