import React, { useState, useEffect } from 'react';
import { Alert, StatusBar, ScrollView, Platform, TouchableOpacity, Image as RNImage } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';
import { Button, ButtonText } from '@/components/ui/button';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Heading } from '@/components/ui/heading';
import { Input, InputField } from '@/components/ui/input';
import { Divider } from '@/components/ui/divider';
import { Avatar, AvatarFallbackText, AvatarImage } from '@/components/ui/avatar';
import api, { getBaseUrl } from '../../utils/api';

export default function ProfileScreen() {
    const router = useRouter();
    const [userId, setUserId] = useState<string | null>(null);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [avatar, setAvatar] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        loadUserProfile();
    }, []);

    const loadUserProfile = async () => {
        try {
            const id = await AsyncStorage.getItem('userId');
            const storedName = await AsyncStorage.getItem('userName');
            // Assuming we store these now, or fetch fresh
            const storedEmail = await AsyncStorage.getItem('userEmail');
            const storedAvatar = await AsyncStorage.getItem('userAvatar');

            if (id) {
                setUserId(id);
                if (storedName) setName(storedName);
                if (storedEmail) setEmail(storedEmail);
                if (storedAvatar) setAvatar(storedAvatar);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const pickImage = async () => {
        if (!isEditing) return; // Only allow picking when editing

        // No permissions request is necessary for launching the image library
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 1,
        });

        if (!result.canceled) {
            handleImageUpload(result.assets[0].uri);
        }
    };

    const handleImageUpload = async (uri: string) => {
        setLoading(true);
        const formData = new FormData();
        const filename = uri.split('/').pop();
        const match = /\.(\w+)$/.exec(filename || '');
        const type = match ? `image/${match[1]}` : `image`;

        formData.append('image', {
            uri: uri,
            name: filename || 'profile.jpg',
            type: type,
        } as any);

        try {
            const res = await api.post('/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            // Store relative path for robustness across IPs
            const relativeUrl = res.data.imageUrl;
            setAvatar(relativeUrl);
            Alert.alert('Image Uploaded', 'Remember to save changes to persist your new avatar.');
        } catch (e: any) {
            console.error("Upload failed", e);
            Alert.alert('Upload Failed', 'Could not upload image. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Helper to resolve display URL
    const getDisplayAvatar = (path: string) => {
        if (!path) return '';
        if (path.startsWith('http')) return path;
        return `${getBaseUrl()}${path}`;
    };



    const handleUpdateProfile = async () => {
        if (!userId) return;
        setLoading(true);
        try {
            const payload: any = { name, email, avatar };
            if (password) payload.password = password;

            const res = await api.put(`/users/${userId}`, payload);

            // Update local storage
            await AsyncStorage.setItem('userName', res.data.user.name);
            await AsyncStorage.setItem('userEmail', res.data.user.email);
            if (res.data.user.avatar) {
                await AsyncStorage.setItem('userAvatar', res.data.user.avatar);
            } else {
                await AsyncStorage.removeItem('userAvatar');
            }

            setName(res.data.user.name);
            setEmail(res.data.user.email);
            setAvatar(res.data.user.avatar || '');
            setPassword(''); // Clear password field
            setIsEditing(false);

            Alert.alert('Success', 'Profile updated successfully!');
        } catch (e: any) {
            console.error(e);
            Alert.alert('Error', 'Failed to update profile: ' + (e.response?.data?.error || e.message));
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        if (Platform.OS === 'web') {
            if (window.confirm('Are you sure you want to logout?')) {
                await AsyncStorage.clear();
                router.replace('/login');
            }
        } else {
            Alert.alert('Logout', 'Are you sure you want to logout?', [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Logout',
                    style: 'destructive',
                    onPress: async () => {
                        await AsyncStorage.clear();
                        router.replace('/login');
                    }
                }
            ]);
        }
    };

    return (
        <Box className="flex-1 bg-background-50">
            <StatusBar barStyle="dark-content" />

            {/* Header */}
            <Box className="pt-12 pb-6 px-6 bg-white shadow-sm rounded-b-3xl z-10">
                <Heading size="2xl" className="text-primary-900 mb-1">My Profile</Heading>
                <Text className="text-typography-500">Manage your account settings</Text>
            </Box>

            <ScrollView contentContainerStyle={{ padding: 20 }}>
                {/* Profile Card */}
                <Box className="bg-white p-6 rounded-2xl shadow-sm border border-outline-100 items-center mb-6">
                    <TouchableOpacity onPress={pickImage} disabled={!isEditing}>
                        <Avatar size="2xl" className="bg-primary-500 mb-4 h-24 w-24 relative">
                            <AvatarFallbackText className="text-white text-2xl">{name || 'User'}</AvatarFallbackText>
                            {avatar ? (
                                <AvatarImage
                                    source={{ uri: getDisplayAvatar(avatar) }}
                                    alt="Profile Avatar"
                                />
                            ) : null}
                            {isEditing && (
                                <Box className="absolute bottom-0 right-0 bg-primary-600 rounded-full p-1 border-2 border-white">
                                    <Text size="xs" className="text-white">📷</Text>
                                </Box>
                            )}
                        </Avatar>
                    </TouchableOpacity>
                    <Heading size="xl" className="text-typography-900">{name || 'Loading...'}</Heading>
                    <Text className="text-typography-500 text-sm">{userId}</Text>
                    {isEditing && <Text size="xs" className="text-primary-600 mt-1">Tap icon to change photo</Text>}
                </Box>

                {/* Edit Form */}
                <VStack space="lg" className="bg-white p-6 rounded-2xl shadow-sm border border-outline-100 mb-6">
                    <HStack className="justify-between items-center">
                        <Heading size="md" className="text-typography-800">Account Details</Heading>
                        <Button
                            size="sm"
                            variant="link"
                            onPress={() => setIsEditing(!isEditing)}
                        >
                            <ButtonText>{isEditing ? 'Cancel' : 'Edit'}</ButtonText>
                        </Button>
                    </HStack>

                    <Divider className="my-1 bg-outline-100" />

                    <VStack space="md">
                        {/* Hidden URL input if not needed, or just read-only/editable if manual URL desired. Keeping it for flexibility */}
                        <VStack space="xs">
                            <Text size="sm" bold className="text-typography-700 ml-1">Profile Picture URL</Text>
                            <Input isDisabled={!isEditing} size="lg" className={`rounded-xl border-outline-200 ${!isEditing ? 'bg-background-50' : 'bg-white'}`}>
                                <InputField value={avatar} onChangeText={setAvatar} placeholder="https://example.com/avatar.jpg" />
                            </Input>
                        </VStack>

                        <VStack space="xs">
                            <Text size="sm" bold className="text-typography-700 ml-1">Full Name</Text>
                            <Input isDisabled={!isEditing} size="lg" className={`rounded-xl border-outline-200 ${!isEditing ? 'bg-background-50' : 'bg-white'}`}>
                                <InputField value={name} onChangeText={setName} />
                            </Input>
                        </VStack>

                        <VStack space="xs">
                            <Text size="sm" bold className="text-typography-700 ml-1">Email Address</Text>
                            <Input isDisabled={!isEditing} size="lg" className={`rounded-xl border-outline-200 ${!isEditing ? 'bg-background-50' : 'bg-white'}`}>
                                <InputField value={email} onChangeText={setEmail} placeholder="Update email" keyboardType="email-address" />
                            </Input>
                        </VStack>

                        {isEditing && (
                            <VStack space="xs">
                                <Text size="sm" bold className="text-typography-700 ml-1">New Password (Optional)</Text>
                                <Input size="lg" className="rounded-xl border-outline-200 bg-white">
                                    <InputField
                                        type="password"
                                        value={password}
                                        onChangeText={setPassword}
                                        placeholder="Leave blank to keep current"
                                    />
                                </Input>
                            </VStack>
                        )}

                        {isEditing && (
                            <Button
                                size="lg"
                                className="mt-4 rounded-xl bg-primary-600 shadow-md"
                                onPress={handleUpdateProfile}
                                isDisabled={loading}
                            >
                                <ButtonText className="font-bold">{loading ? 'Saving...' : 'Save Changes'}</ButtonText>
                            </Button>
                        )}
                    </VStack>
                </VStack>

                <Button variant="outline" action="negative" size="lg" className="rounded-xl border-error-300" onPress={handleLogout}>
                    <ButtonText className="text-error-600 font-bold">Log Out</ButtonText>
                </Button>

                <Box className="h-20" />
            </ScrollView>
        </Box>
    );
}
