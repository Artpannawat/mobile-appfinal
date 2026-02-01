import React, { useState, useCallback, useEffect } from 'react';
import { Alert, StatusBar, ScrollView } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';
import { Button, ButtonText } from '@/components/ui/button';
import { HStack } from '@/components/ui/hstack';
import { VStack } from '@/components/ui/vstack';
import { Spinner } from '@/components/ui/spinner';
import { Heading } from '@/components/ui/heading';
import { Image } from '@/components/ui/image';
import api from '../utils/api';

type Book = {
    _id: string;
    title: string;
    author: string;
    status: 'available' | 'borrowed';
};

export default function MyBooksScreen() {
    const [books, setBooks] = useState<Book[]>([]);
    const [loading, setLoading] = useState(true);
    const [userId, setUserId] = useState<string | null>(null);
    const router = useRouter();

    useEffect(() => {
        AsyncStorage.getItem('userId').then(id => {
            if (id) setUserId(id);
            else router.back();
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
            Alert.alert('Error', 'Failed to fetch my books.');
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
        if (!userId) return;
        try {
            await api.post('/return', {
                userId: userId,
                bookId: bookId
            });
            Alert.alert('Success', 'Book returned successfully');
            fetchMyBooks();
        } catch (error: any) {
            const msg = error.response?.data?.error || 'Failed to return book';
            Alert.alert('Error', msg);
        }
    };

    const getBookImage = (id: string) => {
        const seed = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        return `https://picsum.photos/seed/${seed}/200/300`;
    };

    return (
        <Box className="flex-1 bg-background-light">
            <StatusBar barStyle="dark-content" />

            {/* Header */}
            <Box className="pt-12 px-4 pb-4 bg-white border-b border-outline-100">
                <HStack className="items-center" space="md">
                    <Button size="sm" variant="link" onPress={() => router.back()} className="p-0">
                        <Text className="text-primary-500 font-bold text-lg">← Back</Text>
                    </Button>
                    <Heading size="lg" className="text-typography-900">My Shelf</Heading>
                </HStack>
            </Box>

            {loading ? (
                <Box className="flex-1 justify-center items-center">
                    <Spinner size="large" className="text-primary-500" />
                </Box>
            ) : (
                books.length === 0 ? (
                    <Box className="flex-1 justify-center items-center px-8">
                        <Text size="4xl" className="mb-4">📚</Text>
                        <Heading size="md" className="text-typography-900 text-center mb-2">No Books Borrowed</Heading>
                        <Text className="text-typography-500 text-center">
                            Your shelf is empty. Go back and borrow some amazing books!
                        </Text>
                    </Box>
                ) : (
                    <ScrollView contentContainerStyle={{ padding: 16 }}>
                        {books.map((item) => (
                            <Box
                                key={item._id}
                                className="bg-white p-4 mb-4 rounded-xl shadow-md"
                            >
                                <HStack space="md">
                                    <Image
                                        source={{ uri: getBookImage(item._id) }}
                                        alt={item.title}
                                        size="lg"
                                        className="rounded-md w-20 h-28 bg-background-200"
                                    />
                                    <VStack className="flex-1 justify-between py-1">
                                        <VStack>
                                            <Heading size="sm" className="text-typography-900" numberOfLines={2}>{item.title}</Heading>
                                            <Text size="xs" className="text-typography-500 mt-1">by {item.author}</Text>
                                        </VStack>

                                        <Button
                                            size="sm"
                                            action="negative"
                                            onPress={() => handleReturn(item._id)}
                                            variant="outline"
                                            className="rounded-full border-error-500"
                                        >
                                            <ButtonText className="text-error-500 text-xs">Return Book</ButtonText>
                                        </Button>
                                    </VStack>
                                </HStack>
                            </Box>
                        ))}
                    </ScrollView>
                )
            )}
        </Box>
    );
}
