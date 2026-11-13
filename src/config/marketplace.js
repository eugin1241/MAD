import {Platform} from 'react-native';

// Android emulator reaches the laptop using 10.0.2.2.
// For a real phone use: adb reverse tcp:3001 tcp:3001 and set Android to
// http://127.0.0.1:3001, or replace it with your laptop's LAN IP address.
export const API_BASE_URL =
  Platform.OS === 'android' ? 'http://10.0.2.2:3001' : 'http://localhost:3001';
