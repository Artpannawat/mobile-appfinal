import React, { useState, useCallback, useEffect } from 'react';
import { StatusBar, ScrollView, RefreshControl, TouchableOpacity, Dimensions, Image } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';
import { Button, ButtonText } from '@/components/ui/button';
import { HStack } from '@/components/ui/hstack';
import { VStack } from '@/components/ui/vstack';
import { Spinner } from '@/components/ui/spinner';
import { Heading } from '@/components/ui/heading';
import { LinearGradient } from 'expo-linear-gradient'; // Ensure this is installed or use Box bg
import api from '../../utils/api';

type Book = {
    _id: string;
    title: string;
    author: string;
    status: 'available' | 'borrowed';
    image?: string;
    description?: string;
};

export default function HomeTab() {
    const [books, setBooks] = useState<Book[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchBooks().then(() => setRefreshing(false));
    }, []);
    const router = useRouter();

    useEffect(() => {
        checkLogin();
    }, []);

    const checkLogin = async () => {
        const storedUserId = await AsyncStorage.getItem('userId');
        if (!storedUserId) {
            router.replace('/login');
        } else {
            setUserId(storedUserId);
            fetchBooks();
        }
    };

    const fetchBooks = async () => {
        try {
            setLoading(true);
            const response = await api.get('/books');
            setBooks(response.data);
        } catch (error) {
            console.error('Error fetching books:', error);
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            if (userId) fetchBooks();
        }, [userId])
    );

    const handleBorrow = async (bookId: string) => {
        try {
            const userId = await AsyncStorage.getItem('userId');
            if (!userId) {
                router.replace('/login');
                return;
            }
            await api.post('/borrow', { userId, bookId });
            // Optimistic Update
            setBooks(books.map(b => b._id === bookId ? { ...b, status: 'borrowed' } : b));
            fetchBooks();
        } catch (error) {
            console.error(error);
            fetchBooks();
        }
    };

    // Helper to validate/fix image URL
    const getBookImage = (item: any) => {
        if (item.image && typeof item.image === 'string' && item.image.trim().length > 0) {
            // Check if it's a valid remote URL
            if (item.image.startsWith('http')) {
                return item.image;
            }
            // If it's a local file path or something else that won't load on mobile, fallback.
            // But if it's a data URI or valid local asset require, we might keep it. 
            // For this app, assuming mostly remote URLs or placeholders.
        }

        // Fallback: Generate a consistent placeholder based on ID
        const seed = item._id ? item._id.substring(0, 5) : 'book';
        return `https://picsum.photos/seed/${seed}/200/300`;
    };

    return (
        <Box className="flex-1 bg-background-50">
            <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

            {/* Search/Header Area */}
            <Box className="pt-16 pb-6 px-6 bg-white rounded-b-3xl shadow-sm z-10">
                <HStack className="justify-between items-center mb-4">
                    <VStack>
                        <Text size="sm" className="text-secondary-500 font-bold tracking-widest uppercase">Discover</Text>
                        <Heading size="2xl" className="text-typography-900">Library</Heading>
                    </VStack>
                </HStack>
                {/* Search Bar Placeholder (Visual Only) */}
                <Box className="bg-background-50 p-3 rounded-xl border border-outline-100 flex-row items-center">
                    <Text className="text-typography-400 ml-2">🔍 Search for books...</Text>
                </Box>
            </Box>

            {loading && !refreshing ? (
                <Box className="flex-1 justify-center items-center">
                    <Spinner size="large" color="$primary500" />
                </Box>
            ) : (
                <ScrollView
                    contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#007AFF" />}
                    showsVerticalScrollIndicator={false}
                >
                    <Heading size="md" className="mb-4 text-typography-800">Trending Now</Heading>

                    {/* Books Grid/List */}
                    <VStack space="lg">
                        {books.map((item) => (
                            <TouchableOpacity
                                key={item._id}
                                activeOpacity={0.9}
                                onPress={() => { /* Navigate to Details if implemented */ }}
                            >
                                <Box className="bg-white p-3 rounded-2xl shadow-sm border border-outline-100 flex-row">
                                    {/* Book Cover */}
                                    <Box className="w-24 h-36 rounded-xl overflow-hidden bg-gray-200 shadow-md elevation-2 mr-4">
                                        <Image
                                            source={{ uri: getBookImage(item) }}
                                            alt={item.title}
                                            style={{ width: '100%', height: '100%' }}
                                            resizeMode="cover"
                                        />
                                    </Box>

                                    {/* Info */}
                                    <VStack className="flex-1 justify-between py-1">
                                        <VStack>
                                            <Heading size="sm" numberOfLines={2} className="text-typography-900 mb-1">{item.title}</Heading>
                                            <Text size="xs" className="text-typography-500 font-medium">{item.author}</Text>
                                            {item.description && (
                                                <Text size="xs" numberOfLines={2} className="text-typography-400 mt-2 leading-xs">{item.description}</Text>
                                            )}
                                        </VStack>

                                        <HStack className="justify-between items-center mt-3">
                                            {item.status === 'available' ? (
                                                <Box className="bg-success-50 px-2 py-1 rounded-md">
                                                    <Text className="text-success-700 text-xs font-bold">● Available</Text>
                                                </Box>
                                            ) : (
                                                <Box className="bg-secondary-50 px-2 py-1 rounded-md">
                                                    <Text className="text-secondary-700 text-xs font-bold">● Borrowed</Text>
                                                </Box>
                                            )}

                                            <TouchableOpacity
                                                onPress={() => item.status === 'available' && handleBorrow(item._id)}
                                                disabled={item.status !== 'available'}
                                                style={{
                                                    backgroundColor: item.status === 'available' ? '#007AFF' : '#E5E5E5',
                                                    paddingVertical: 8,
                                                    paddingHorizontal: 16,
                                                    borderRadius: 12,
                                                }}
                                            >
                                                <Text style={{
                                                    color: item.status === 'available' ? '#FFF' : '#A3A3A3',
                                                    fontWeight: '700',
                                                    fontSize: 12
                                                }}>
                                                    {item.status === 'available' ? 'Borrow' : 'Waitlist'}
                                                </Text>
                                            </TouchableOpacity>
                                        </HStack>
                                    </VStack>
                                </Box>
                            </TouchableOpacity>
                        ))}
                    </VStack>
                </ScrollView>
            )}
        </Box>
    );
}
