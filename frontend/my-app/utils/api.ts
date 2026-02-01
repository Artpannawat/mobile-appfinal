import axios from 'axios';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Dynamically determine the API URL
export const getBaseUrl = () => {
    if (process.env.EXPO_PUBLIC_API_URL) {
        return process.env.EXPO_PUBLIC_API_URL;
    }

    // For Physical Device via Expo Go (uses LAN IP)
    if (Constants.expoConfig?.hostUri) {
        const host = Constants.expoConfig.hostUri.split(':')[0];
        return `http://${host}:3000`;
    }

    // For Android Emulator
    if (Platform.OS === 'android') {
        return 'http://10.0.2.2:3000';
    }

    // For iOS Simulator / Web (localhost)
    return 'http://localhost:3000';
};

const api = axios.create({
    baseURL: getBaseUrl(),
});

export default api;
