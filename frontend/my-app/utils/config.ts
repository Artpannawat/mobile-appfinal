import { Platform } from 'react-native';

// Use localhost for Web/iOS Simulator, and 10.0.2.2 for Android Emulator
// If testing on real device, use your machine's IP (e.g., 192.168.1.41)
const SERVER_IP = Platform.OS === 'web' || Platform.OS === 'ios' ? 'localhost' : '10.0.2.2';

export const API_URL = `http://${SERVER_IP}:3000`;
