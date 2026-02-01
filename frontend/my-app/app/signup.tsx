import React, { useState } from 'react';
import { Alert, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';
import { Button, ButtonText } from '@/components/ui/button';
import { VStack } from '@/components/ui/vstack';
import { Input, InputField } from '@/components/ui/input';
import { Heading } from '@/components/ui/heading';
import { FormControl, FormControlLabel, FormControlLabelText } from '@/components/ui/form-control';
import api from '../utils/api';

export default function SignupScreen() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSignup = async () => {
        if (!name || !email || !password) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        try {
            setLoading(true);
            await api.post('/signup', { name, email, password });
            Alert.alert('Success', 'Account created! Please login.');
            router.replace('/login');
        } catch (error: any) {
            console.error(error);
            const msg = error.response?.data?.error || 'Signup failed';
            Alert.alert('Error', msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box className="flex-1 bg-background-light justify-center p-6">
            <StatusBar barStyle="dark-content" />

            <Box className="bg-white p-6 rounded-xl shadow-lg border border-outline-100">
                <VStack space="xl">
                    <VStack>
                        <Heading size="2xl" className="text-primary-600 mb-2">Create Account</Heading>
                        <Text className="text-typography-500">Sign up to get started</Text>
                    </VStack>

                    <VStack space="md">
                        <FormControl>
                            <FormControlLabel mb="$1">
                                <FormControlLabelText>Full Name</FormControlLabelText>
                            </FormControlLabel>
                            <Input className="rounded-md border-outline-300">
                                <InputField value={name} onChangeText={setName} placeholder="John Doe" />
                            </Input>
                        </FormControl>

                        <FormControl>
                            <FormControlLabel mb="$1">
                                <FormControlLabelText>Email</FormControlLabelText>
                            </FormControlLabel>
                            <Input className="rounded-md border-outline-300">
                                <InputField
                                    value={email}
                                    onChangeText={setEmail}
                                    placeholder="john@example.com"
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                />
                            </Input>
                        </FormControl>

                        <FormControl>
                            <FormControlLabel mb="$1">
                                <FormControlLabelText>Password</FormControlLabelText>
                            </FormControlLabel>
                            <Input className="rounded-md border-outline-300">
                                <InputField
                                    value={password}
                                    onChangeText={setPassword}
                                    placeholder="Enter password"
                                    type="password"
                                />
                            </Input>
                        </FormControl>
                    </VStack>

                    <Button
                        onPress={handleSignup}
                        isDisabled={loading}
                        className="rounded-full mt-4"
                    >
                        <ButtonText>{loading ? 'Creating Account...' : 'Sign Up'}</ButtonText>
                    </Button>

                    <Button
                        variant="link"
                        onPress={() => router.push('/login')}
                        className="mt-2"
                    >
                        <ButtonText className="text-primary-500">Already have an account? Login</ButtonText>
                    </Button>
                </VStack>
            </Box>
        </Box>
    );
}
