import React, { useState } from 'react';
import { Alert, StatusBar } from 'react-native';
import { useRouter, Link } from 'expo-router'; // Added Link
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';
import { Button, ButtonText } from '@/components/ui/button';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Input, InputField } from '@/components/ui/input';
import { Heading } from '@/components/ui/heading';
import { Card } from '@/components/ui/card'; // Ensure this exists or use Box if not
import { LinkText } from '@/components/ui/link'; // Assuming this exists or use Text
import api from '../utils/api';

export default function LoginScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleLogin = async () => {
        setError('');
        if (!email || !password) {
            setError('Please fill in both email and password.');
            return;
        }

        try {
            setLoading(true);
            const response = await api.post('/login', {
                email: email.trim(),
                password: password.trim()
            });

            const { userId, name, email: responseEmail, avatar } = response.data;

            await AsyncStorage.setItem('userId', userId);
            await AsyncStorage.setItem('userName', name);
            if (responseEmail) await AsyncStorage.setItem('userEmail', responseEmail);
            if (avatar) await AsyncStorage.setItem('userAvatar', avatar);

            // Alert.alert('Success', `Welcome back, ${name}!`); // Optional: remove success alert for smoother flow

            if (response.data.isAdmin) {
                router.replace('/admin-dashboard');
            } else {
                router.replace('/(tabs)');
            }
        } catch (error: any) {
            console.error(error);
            const msg = error.response?.data?.error || 'Invalid email or password. Please try again.';
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box className="flex-1 bg-background-50 justify-center px-4">
            <StatusBar barStyle="dark-content" />

            <Box className="w-full max-w-md mx-auto">
                <VStack space="xl" className="mb-10 items-center">
                    <Box className="bg-primary-500 w-16 h-16 rounded-2xl items-center justify-center shadow-lg mb-2">
                        <Text className="text-white text-3xl">📚</Text>
                    </Box>
                    <VStack className="items-center">
                        <Heading size="3xl" className="text-primary-900 font-bold">Library App</Heading>
                        <Text className="text-typography-500 mt-2 text-center">
                            Discover a world of knowledge.{'\n'}Sign in to continue.
                        </Text>
                    </VStack>
                </VStack>

                <Box className="bg-white p-6 rounded-2xl shadow-xl border border-outline-100">
                    <VStack space="lg">

                        <VStack space="xs">
                            <Text size="sm" bold className="text-typography-900 ml-1">Email</Text>
                            <Input size="xl" variant="outline" className="rounded-xl border-outline-200 bg-background-50 focus:border-primary-500 focus:bg-white">
                                <InputField
                                    placeholder="Enter your email"
                                    value={email}
                                    onChangeText={setEmail}
                                    autoCapitalize="none"
                                    keyboardType="email-address"
                                />
                            </Input>
                        </VStack>

                        <VStack space="xs">
                            <Text size="sm" bold className="text-typography-900 ml-1">Password</Text>
                            <Input size="xl" variant="outline" className={`rounded-xl border-outline-200 bg-background-50 focus:border-primary-500 focus:bg-white ${error ? 'border-error-500' : ''}`}>
                                <InputField
                                    placeholder="Enter your password"
                                    value={password}
                                    onChangeText={(text) => {
                                        setPassword(text);
                                        setError(''); // Clear error on typing
                                    }}
                                    type="password"
                                />
                            </Input>
                        </VStack>

                        {error ? (
                            <Box className="bg-error-50 p-3 rounded-lg border border-error-200 flex-row items-center">
                                <Text className="mr-2">⚠️</Text>
                                <Text className="text-error-600 text-sm font-medium flex-1">
                                    {error}
                                </Text>
                            </Box>
                        ) : null}

                        <Button
                            size="xl"
                            onPress={handleLogin}
                            isDisabled={loading}
                            className="rounded-xl bg-primary-600 shadow-md mt-2 active:bg-primary-700"
                        >
                            <ButtonText className="font-bold">{loading ? 'Signing In...' : 'Sign In'}</ButtonText>
                        </Button>

                        <HStack className="justify-center mt-4 items-center space-x-1">
                            <Text size="sm" className="text-typography-500">New here?</Text>
                            <Link href="/signup" asChild>
                                <Button variant="link" size="sm">
                                    <ButtonText className="text-primary-600 font-bold underline">Create Account</ButtonText>
                                </Button>
                            </Link>
                        </HStack>

                    </VStack>
                </Box>

                <Text size="xs" className="text-center text-typography-400 mt-10">
                    v1.0.0 • Library Operations System
                </Text>
            </Box>
        </Box>
    );
}
