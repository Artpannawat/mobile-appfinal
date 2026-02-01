import React, { useState, useCallback } from 'react';
import { Alert, StatusBar, ScrollView, TouchableOpacity, Platform, Image } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';
import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';
import { Button, ButtonText } from '@/components/ui/button';
import { HStack } from '@/components/ui/hstack';
import { VStack } from '@/components/ui/vstack';
import { Heading } from '@/components/ui/heading';
import { Input, InputField } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Divider } from '@/components/ui/divider';
import api from '../utils/api';

// Types
type User = { _id: string, name: string, email: string };
type Borrow = { _id: string, user_id: User, book_id: { title: string }, borrowDate: string };

export default function AdminDashboard() {
    const [activeTab, setActiveTab] = useState<'users' | 'add_book' | 'borrows'>('users');
    const [users, setUsers] = useState<User[]>([]);
    const [adminBooks, setAdminBooks] = useState<any[]>([]); // New state for managing books
    const [borrows, setBorrows] = useState<Borrow[]>([]);
    const [newBookTitle, setNewBookTitle] = useState('');
    const [newBookAuthor, setNewBookAuthor] = useState('');
    const [newBookImage, setNewBookImage] = useState('');
    const [newBookDescription, setNewBookDescription] = useState('');

    // Edit Mode State
    const [editingBookId, setEditingBookId] = useState<string | null>(null);

    const router = useRouter();

    useFocusEffect(
        useCallback(() => {
            if (activeTab === 'users') fetchUsers();
            if (activeTab === 'manage_books') fetchAdminBooks();
            if (activeTab === 'borrows') fetchBorrows();
        }, [activeTab])
    );

    const fetchUsers = async () => {
        try {
            const res = await api.get('/admin/users');
            setUsers(res.data);
        } catch (e) {
            console.error(e);
        }
    };

    const fetchBorrows = async () => {
        try {
            const res = await api.get('/admin/borrows');
            setBorrows(res.data);
        } catch (e) {
            console.error(e);
        }
    };

    const fetchAdminBooks = async () => {
        try {
            const res = await api.get('/books');
            setAdminBooks(res.data);
        } catch (e) {
            console.error(e);
        }
    };



    const handleAddOrUpdateBook = async () => {
        if (!newBookTitle || !newBookAuthor) return Alert.alert('Error', 'Fields required');
        try {
            if (editingBookId) {
                // Update Existing
                await api.put(`/admin/books/${editingBookId}`, {
                    title: newBookTitle,
                    author: newBookAuthor,
                    image: newBookImage,
                    description: newBookDescription
                });
                Alert.alert('Success', 'Book updated!');
            } else {
                // Create New
                await api.post('/admin/books', {
                    title: newBookTitle,
                    author: newBookAuthor,
                    image: newBookImage,
                    description: newBookDescription
                });
                Alert.alert('Success', 'Book added!');
            }
            // Reset Form
            setNewBookTitle('');
            setNewBookAuthor('');
            setNewBookImage('');
            setNewBookDescription('');
            setEditingBookId(null);
            fetchAdminBooks(); // Refresh list
        } catch (e) {
            console.error(e);
            Alert.alert('Error', 'Failed to save book');
        }
    };

    const handleDeleteBook = async (id: string) => {
        if (Platform.OS === 'web') {
            if (window.confirm('Delete this book?')) {
                try {
                    await api.delete(`/admin/books/${id}`);
                    fetchAdminBooks();
                } catch (e: any) {
                    console.error(e);
                    alert('Failed to delete: ' + (e.response?.data?.error || e.message));
                }
            }
        } else {
            Alert.alert('Confirm', 'Delete this book?', [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await api.delete(`/admin/books/${id}`);
                            fetchAdminBooks();
                        } catch (e: any) {
                            Alert.alert('Error', 'Failed to delete: ' + (e.response?.data?.error || e.message));
                        }
                    }
                }
            ]);
        }
    };

    const startEditCursor = (book: any) => {
        setEditingBookId(book._id);
        setNewBookTitle(book.title);
        setNewBookAuthor(book.author);
        setNewBookImage(book.image || '');
        setNewBookDescription(book.description || '');
    };

    const cancelEdit = () => {
        setEditingBookId(null);
        setNewBookTitle('');
        setNewBookAuthor('');
        setNewBookImage('');
        setNewBookDescription('');
    };

    const handleLogout = async () => {
        await AsyncStorage.clear();
        router.replace('/login');
    };

    const TabButton = ({ id, label }: { id: typeof activeTab, label: string }) => (
        <TouchableOpacity
            onPress={() => setActiveTab(id)}
            className={`px-4 py-2 rounded-full ${activeTab === id ? 'bg-primary-500' : 'bg-background-200'}`}
        >
            <Text className={`${activeTab === id ? 'text-white' : 'text-typography-600'} font-bold`}>{label}</Text>
        </TouchableOpacity>
    );

    return (
        <Box className="flex-1 bg-background-50">
            <StatusBar barStyle="dark-content" />

            {/* Header */}
            <Box className="pt-12 px-5 pb-4 bg-white shadow-sm z-10">
                <HStack className="justify-between items-center mb-4">
                    <Heading size="xl">Admin Panel</Heading>
                    <Button size="xs" variant="outline" action="negative" onPress={handleLogout}>
                        <ButtonText>Logout</ButtonText>
                    </Button>
                </HStack>

                {/* Navigation Tabs */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <HStack space="sm">
                        <TabButton id="users" label="Users" />
                        <TabButton id="manage_books" label="Manage Books" />
                        <TabButton id="borrows" label="Active Loans" />
                    </HStack>
                </ScrollView>
            </Box>

            {/* Content Area */}
            <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 50 }}>

                {/* VIEW 1: USERS LIST */}
                {activeTab === 'users' && (
                    <VStack space="md">
                        <Box className="flex-row justify-between items-end mb-2">
                            <Heading size="md" className="text-typography-800">Members Directory</Heading>
                            <Box className="bg-primary-100 px-3 py-1 rounded-full">
                                <Text size="xs" className="text-primary-800 font-bold">{users.length} Users</Text>
                            </Box>
                        </Box>

                        {users.map((u, i) => (
                            <Box key={u._id} className="bg-white p-4 rounded-xl border border-outline-100 shadow-sm flex-row justify-between items-center">
                                <HStack space="md" className="items-center">
                                    <Box className="w-10 h-10 rounded-full bg-primary-50 items-center justify-center">
                                        <Text className="text-lg">👤</Text>
                                    </Box>
                                    <VStack>
                                        <Text bold size="md" className="text-typography-900">{u.name}</Text>
                                        <Text size="xs" className="text-typography-500">{u.email}</Text>
                                    </VStack>
                                </HStack>
                                <Box className="bg-success-50 px-2 py-1 rounded">
                                    <Text size="xs" className="text-success-700 font-bold">Active</Text>
                                </Box>
                            </Box>
                        ))}
                    </VStack>
                )}

                {/* VIEW 2: MANAGE BOOKS (ADD / EDIT / LIST) */}
                {activeTab === 'manage_books' && (
                    <VStack space="xl">
                        {/* Form Section */}
                        <Box className="bg-white p-6 rounded-2xl shadow-sm border border-outline-100">
                            <Box className="items-center mb-6">
                                <Box className="w-16 h-16 bg-primary-100 rounded-full items-center justify-center mb-2">
                                    <Text className="text-3xl">{editingBookId ? '✏️' : '📖'}</Text>
                                </Box>
                                <Heading size="lg" className="text-center text-typography-900">
                                    {editingBookId ? 'Edit Book' : 'Add New Book'}
                                </Heading>
                                <Text size="sm" className="text-center text-typography-400">
                                    {editingBookId ? 'Update book details below' : 'Fill details to expand the library'}
                                </Text>
                            </Box>

                            <VStack space="md">
                                <Input size="md" className="rounded-xl bg-background-50 border-outline-200">
                                    <InputField value={newBookTitle} onChangeText={setNewBookTitle} placeholder="Book Title" />
                                </Input>
                                <Input size="md" className="rounded-xl bg-background-50 border-outline-200">
                                    <InputField value={newBookAuthor} onChangeText={setNewBookAuthor} placeholder="Author Name" />
                                </Input>
                                <Input size="md" className="rounded-xl bg-background-50 border-outline-200">
                                    <InputField value={newBookImage} onChangeText={setNewBookImage} placeholder="Cover Image URL (Optional)" />
                                </Input>
                                <Input size="md" className="rounded-xl bg-background-50 border-outline-200">
                                    <InputField value={newBookDescription} onChangeText={setNewBookDescription} placeholder="Description (Optional)" />
                                </Input>

                                <HStack space="sm" className="mt-2">
                                    {editingBookId && (
                                        <Button size="md" variant="outline" action="secondary" onPress={cancelEdit} className="flex-1 rounded-xl">
                                            <ButtonText>Cancel</ButtonText>
                                        </Button>
                                    )}
                                    <Button size="md" onPress={handleAddOrUpdateBook} className="flex-1 rounded-xl bg-primary-600 shadow-md">
                                        <ButtonText className="font-bold">{editingBookId ? 'Update Book' : 'Publish Book'}</ButtonText>
                                    </Button>
                                </HStack>
                            </VStack>
                        </Box>

                        {/* List Section */}
                        <Heading size="md" className="text-typography-800">Library Inventory ({adminBooks.length})</Heading>

                        {adminBooks.map((book) => (
                            <Box key={book._id} className="bg-white p-4 rounded-xl border border-outline-100 shadow-sm flex-row justify-between items-start">
                                <HStack space="md" className="flex-1">
                                    {/* Thumbnail */}
                                    <Box className="w-12 h-16 bg-gray-200 rounded-md overflow-hidden shadow-sm">
                                        <Image
                                            source={{
                                                uri: book.image && book.image.trim().startsWith('http')
                                                    ? book.image
                                                    : `https://picsum.photos/seed/${book._id.substring(0, 5)}/200/300`
                                            }}
                                            style={{ width: '100%', height: '100%' }}
                                            resizeMode="cover"
                                        />
                                    </Box>
                                    <VStack className="flex-1">
                                        <Heading size="sm" numberOfLines={1}>{book.title}</Heading>
                                        <Text size="xs" className="text-typography-500">{book.author}</Text>
                                        {book.description && (
                                            <Text size="xs" numberOfLines={2} className="text-typography-400 mt-1">{book.description}</Text>
                                        )}
                                        <Box className={`mt-2 px-2 py-0.5 rounded self-start ${book.status === 'available' ? 'bg-success-100' : 'bg-warning-100'}`}>
                                            <Text size="xs" className={book.status === 'available' ? 'text-success-700' : 'text-warning-700'}>
                                                {book.status}
                                            </Text>
                                        </Box>
                                    </VStack>
                                </HStack>

                                <VStack space="sm">
                                    <TouchableOpacity
                                        onPress={() => startEditCursor(book)}
                                        className="bg-primary-50 px-3 py-2 rounded-lg"
                                    >
                                        <Text size="xs" className="text-primary-700 font-bold text-center">Edit</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        onPress={() => handleDeleteBook(book._id)}
                                        className="bg-error-50 px-3 py-2 rounded-lg"
                                    >
                                        <Text size="xs" className="text-error-700 font-bold text-center">Delete</Text>
                                    </TouchableOpacity>
                                </VStack>
                            </Box>
                        ))}
                    </VStack>
                )}

                {/* VIEW 3: ACTIVE BORROWS */}
                {activeTab === 'borrows' && (
                    <VStack space="md">
                        <Heading size="md" className="mb-2 text-typography-800">Active Borrowings</Heading>
                        {borrows.length === 0 ? (
                            <Box className="items-center pt-10 px-10">
                                <Text className="text-4xl grayscale opacity-50 mb-4">💤</Text>
                                <Text className="text-center text-typography-400">No books are currently borrowed.</Text>
                            </Box>
                        ) : (
                            borrows.map((b) => (
                                <Box key={b._id} className="bg-white p-4 rounded-xl border-l-4 border-l-warning-400 shadow-sm border border-outline-100">
                                    <VStack space="sm">
                                        <HStack className="justify-between items-start">
                                            <Heading size="sm" className="text-typography-900">{b.book_id?.title || 'Unknown Book'}</Heading>
                                            <Box className="bg-warning-50 px-2 py-1 rounded">
                                                <Text size="xs" className="text-warning-700 font-bold">Borrowed</Text>
                                            </Box>
                                        </HStack>

                                        <Divider className="my-1 bg-outline-100" />

                                        <VStack space="xs">
                                            <HStack className="justify-between">
                                                <Text size="xs" className="text-typography-500">Borrower:</Text>
                                                <Text size="xs" bold className="text-typography-800">{b.user_id?.name || 'Unknown'}</Text>
                                            </HStack>
                                            <HStack className="justify-between">
                                                <Text size="xs" className="text-typography-500">Date:</Text>
                                                <Text size="xs" className="text-typography-800">{new Date(b.borrowDate).toLocaleDateString()}</Text>
                                            </HStack>
                                        </VStack>
                                    </VStack>
                                </Box>
                            ))
                        )}
                    </VStack>
                )}

            </ScrollView>
        </Box>
    );
}
