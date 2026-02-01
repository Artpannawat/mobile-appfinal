import React, { useState, useCallback, useEffect } from 'react';
import { StatusBar, ScrollView, RefreshControl, TouchableOpacity, Image } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';
import { HStack } from '@/components/ui/hstack';
import { VStack } from '@/components/ui/vstack';
import { Spinner } from '@/components/ui/spinner';
import { Heading } from '@/components/ui/heading';
import api from '../../utils/api';

type Book = {
    _id: string;
    title: string;
    author: string;
    status: 'available' | 'borrowed';
    borrowDate?: string;
    image?: string;
};

export default function MyBooksTab() {
    const [books, setBooks] = useState<Book[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);
    const router = useRouter();

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchMyBooks().then(() => setRefreshing(false));
    }, [userId]);

    useEffect(() => {
        AsyncStorage.getItem('userId').then(id => {
            if (id) setUserId(id);
        });
    }, []);

    const fetchMyBooks = async () => {
        if (!userId) return;
        try {
            setLoading(true);
            const response = await api.get(`/history/${userId}`);
            setBooks(response.data);
        } catch (error) {
            console.error('Error fetching my books:', error);
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            if (userId) fetchMyBooks();
        }, [userId])
    );

    const handleReturn = async (bookId: string) => {
        try {
            const userId = await AsyncStorage.getItem('userId');
            if (!userId) return;
            await api.post('/return', { userId, bookId });
            setBooks(prevBooks => prevBooks.filter(b => b._id !== bookId));
            fetchMyBooks();
        } catch (error: any) {
            console.error('Error returning book:', error);
            fetchMyBooks();
        }
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { // Changed to EN for global appeal or keep TH if preferred
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const getBookImage = (item: any) => {
        if (item.image && (item.image.startsWith('http') || item.image.startsWith('https'))) {
            return item.image;
        }
        const seed = item._id.substring(0, 5);
        return `https://picsum.photos/seed/${seed}/200/300`;
    };

    return (
        <Box className="flex-1 bg-background-50">
            <StatusBar barStyle="dark-content" />

            {/* Header */}
            <Box className="pt-16 pb-6 px-6 bg-white rounded-b-3xl shadow-sm z-10 mb-4">
                <Heading size="2xl" className="text-secondary-900 mb-1">My Shelf</Heading>
                <Text className="text-typography-500">Books currently in your possession</Text>
            </Box>

            {loading && !refreshing ? (
                <Box className="flex-1 justify-center items-center">
                    <Spinner size="large" color="$primary500" />
                </Box>
            ) : (
                books.length === 0 ? (
                    <Box className="flex-1 justify-center items-center px-8 opacity-70">
                        <Text size="5xl" className="mb-4 grayscale">📚</Text>
                        <Heading size="lg" className="text-typography-900 text-center mb-2">No Books Yet</Heading>
                        <Text className="text-typography-500 text-center">
                            Go to Browse tab and find something amazing to read!
                        </Text>
                    </Box>
                ) : (
                    <ScrollView
                        contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
                        refreshControl={
                            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#007AFF" />
                        }
                    >
                        {books.map((item) => (
                            <Box
                                key={item._id}
                                className="bg-white p-4 mb-4 rounded-2xl shadow-sm border border-outline-100"
                            >
                                <HStack space="md" className="items-start">
                                    <Box className="w-20 h-32 rounded-lg overflow-hidden bg-gray-200 shadow-sm">
                                        <Image
                                            source={{ uri: getBookImage(item) }}
                                            style={{ width: '100%', height: '100%' }}
                                            resizeMode="cover"
                                        />
                                    </Box>

                                    <VStack className="flex-1 justify-between h-32">
                                        <VStack>
                                            <Heading size="md" numberOfLines={2} className="text-typography-900 mb-1">{item.title}</Heading>
                                            <Text size="sm" className="text-typography-500 font-medium">{item.author}</Text>
                                        </VStack>

                                        <VStack space="sm">
                                            <HStack className="items-center bg-orange-50 self-start px-2 py-1 rounded-md">
                                                <Text size="xs" className="text-orange-700 font-bold">
                                                    Due: {formatDate(item.borrowDate)}
                                                </Text>
                                            </HStack>

                                            <TouchableOpacity
                                                onPress={() => handleReturn(item._id)}
                                                style={{
                                                    backgroundColor: '#FFF0F0',
                                                    paddingVertical: 8,
                                                    borderRadius: 10,
                                                    alignItems: 'center',
                                                    borderWidth: 1,
                                                    borderColor: '#FECACA'
                                                }}
                                            >
                                                <Text style={{ color: '#DC2626', fontWeight: '700', fontSize: 13 }}>
                                                    Return Book
                                                </Text>
                                            </TouchableOpacity>
                                        </VStack>
                                    </VStack>
                                </HStack>
                            </Box>
                        ))}
                        <Box className="h-10" />
                    </ScrollView>
                )
            )}
        </Box>
    );
}
