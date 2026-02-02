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
type Borrow = {
    _id: string,
    user_id: User,
    book_id: { title: string },
    borrowDate?: string,
    dueDate?: string,
    status: 'pending' | 'approved' | 'return_pending' | 'returned'
};

export default function AdminDashboard() {
    const [activeTab, setActiveTab] = useState<'users' | 'manage_books' | 'borrows'>('users');
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

    const handleApprove = async (transactionId: string) => {
        try {
            await api.post('/admin/borrow/approve', { transactionId });
            fetchBorrows();
            Alert.alert('Success', 'Transaction approved');
        } catch (error) { console.error(error); Alert.alert('Error', 'Failed to approve'); }
    };

    const handleReject = async (transactionId: string) => {
        try {
            await api.post('/admin/borrow/reject', { transactionId });
            fetchBorrows();
            Alert.alert('Success', 'Transaction rejected');
        } catch (error) { console.error(error); Alert.alert('Error', 'Failed to reject'); }
    };

    const handleConfirmReturn = async (transactionId: string) => {
        try {
            await api.post('/admin/return/confirm', { transactionId });
            fetchBorrows();
            Alert.alert('Success', 'Return confirmed');
        } catch (error) { console.error(error); Alert.alert('Error', 'Failed to confirm return'); }
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
                        {/* Stats Row */}
                        <HStack space="md" className="mb-2">
                            <Box className="flex-1 bg-primary-500 p-4 rounded-2xl shadow-sm">
                                <Text className="text-white text-xs opacity-80 uppercase font-bold">Total Users</Text>
                                <Heading className="text-white text-3xl">{users.length}</Heading>
                            </Box>
                            <Box className="flex-1 bg-secondary-500 p-4 rounded-2xl shadow-sm">
                                <Text className="text-white text-xs opacity-80 uppercase font-bold">New Today</Text>
                                <Heading className="text-white text-3xl">0</Heading>
                            </Box>
                        </HStack>

                        <Heading size="md" className="text-typography-800 mt-2 mb-1">All Members</Heading>

                        {users.map((u, i) => (
                            <Box key={u._id} className="bg-white p-4 rounded-xl border border-outline-100 shadow-sm flex-row items-center">
                                <Box className="w-12 h-12 rounded-full bg-primary-50 items-center justify-center mr-4 border border-primary-100">
                                    <Text className="text-xl">👤</Text>
                                </Box>
                                <VStack className="flex-1">
                                    <Text bold size="md" className="text-typography-900">{u.name}</Text>
                                    <Text size="xs" className="text-typography-500">{u.email}</Text>
                                    <Text size="xs" className="text-typography-400 mt-1">ID: {u._id.substring(0, 8)}...</Text>
                                </VStack>
                                <Box className="bg-success-50 px-3 py-1.5 rounded-full">
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
                        <Box className="bg-white p-5 rounded-2xl shadow-sm border border-outline-100">
                            <Box className="flex-row items-center mb-4">
                                <Box className="w-10 h-10 bg-primary-100 rounded-full items-center justify-center mr-3">
                                    <Text className="text-xl">{editingBookId ? '✏️' : '📚'}</Text>
                                </Box>
                                <VStack>
                                    <Heading size="md" className="text-typography-900">
                                        {editingBookId ? 'Edit Book' : 'Add New Book'}
                                    </Heading>
                                    <Text size="xs" className="text-typography-400">
                                        manage your library inventory
                                    </Text>
                                </VStack>
                            </Box>

                            <VStack space="sm">
                                <Input size="md" className="bg-background-50 border-outline-200 rounded-lg">
                                    <InputField value={newBookTitle} onChangeText={setNewBookTitle} placeholder="Book Title" />
                                </Input>
                                <Input size="md" className="bg-background-50 border-outline-200 rounded-lg">
                                    <InputField value={newBookAuthor} onChangeText={setNewBookAuthor} placeholder="Author Name" />
                                </Input>
                                <Input size="md" className="bg-background-50 border-outline-200 rounded-lg">
                                    <InputField value={newBookImage} onChangeText={setNewBookImage} placeholder="Cover Image URL (Optional)" />
                                </Input>
                                <Input size="md" className="bg-background-50 border-outline-200 rounded-lg">
                                    <InputField value={newBookDescription} onChangeText={setNewBookDescription} placeholder="Description (Optional)" />
                                </Input>

                                <HStack space="sm" className="mt-2">
                                    {editingBookId && (
                                        <Button size="sm" variant="outline" action="secondary" onPress={cancelEdit} className="flex-1 rounded-lg">
                                            <ButtonText>Cancel</ButtonText>
                                        </Button>
                                    )}
                                    <Button size="sm" onPress={handleAddOrUpdateBook} className="flex-1 rounded-lg bg-primary-600">
                                        <ButtonText className="font-bold">{editingBookId ? 'Save Changes' : 'Add to Library'}</ButtonText>
                                    </Button>
                                </HStack>
                            </VStack>
                        </Box>

                        {/* List Section */}
                        <VStack space="sm">
                            <Heading size="md" className="text-typography-800">Inventory List ({adminBooks.length})</Heading>
                            {adminBooks.map((book) => (
                                <Box key={book._id} className="bg-white p-3 rounded-xl border border-outline-100 shadow-sm flex-row">
                                    <Box className="w-14 h-20 bg-gray-200 rounded-lg overflow-hidden mr-3">
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
                                    <VStack className="flex-1 justify-between">
                                        <VStack>
                                            <Heading size="sm" numberOfLines={1}>{book.title}</Heading>
                                            <Text size="xs" className="text-typography-500">{book.author}</Text>
                                            <Text size="xs" className={`mt-1 font-bold ${book.status === 'available' ? 'text-success-600' : 'text-warning-600'}`}>
                                                • {book.status}
                                            </Text>
                                        </VStack>
                                        <HStack space="xs" className="justify-end">
                                            <TouchableOpacity onPress={() => startEditCursor(book)} className="bg-background-100 px-3 py-1.5 rounded-lg active:opacity-200">
                                                <Text size="xs" className="text-typography-600 font-bold">Edit</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity onPress={() => handleDeleteBook(book._id)} className="bg-error-50 px-3 py-1.5 rounded-lg">
                                                <Text size="xs" className="text-error-600 font-bold">Delete</Text>
                                            </TouchableOpacity>
                                        </HStack>
                                    </VStack>
                                </Box>
                            ))}
                        </VStack>
                    </VStack>
                )}

                {/* VIEW 3: MANAGE BORROWINGS */}
                {activeTab === 'borrows' && (
                    <VStack space="md">
                        <Heading size="md" className="mb-2 text-typography-800">Manage Borrows</Heading>
                        {borrows.length === 0 ? (
                            <Box className="items-center pt-10 px-10">
                                <Text className="text-4xl grayscale opacity-50 mb-4">💤</Text>
                                <Text className="text-center text-typography-400">No active transactions.</Text>
                            </Box>
                        ) : (
                            borrows.map((b) => (
                                <Box key={b._id} className="bg-white p-4 rounded-xl border border-outline-100 shadow-sm">
                                    <VStack space="sm">
                                        <HStack className="justify-between items-start">
                                            <Heading size="sm" className="text-typography-900 flex-1 mr-2">{b.book_id?.title || 'Unknown Book'}</Heading>
                                            <Box className={`px-2 py-1 rounded ${b.status === 'pending' ? 'bg-warning-100' :
                                                b.status === 'return_pending' ? 'bg-secondary-100' :
                                                    'bg-success-100'
                                                }`}>
                                                <Text size="xs" className={`font-bold uppercase ${b.status === 'pending' ? 'text-warning-700' :
                                                    b.status === 'return_pending' ? 'text-secondary-700' :
                                                        'text-success-700'
                                                    }`}>
                                                    {b.status}
                                                </Text>
                                            </Box>
                                        </HStack>

                                        <Divider className="my-1 bg-outline-100" />

                                        <VStack space="xs">
                                            <HStack className="justify-between">
                                                <Text size="xs" className="text-typography-500">User:</Text>
                                                <Text size="xs" bold className="text-typography-800">{b.user_id?.name || 'Unknown'}</Text>
                                            </HStack>
                                            {b.borrowDate && (
                                                <HStack className="justify-between">
                                                    <Text size="xs" className="text-typography-500">Date:</Text>
                                                    <Text size="xs" className="text-typography-800">{new Date(b.borrowDate).toLocaleDateString()}</Text>
                                                </HStack>
                                            )}
                                            {b.dueDate && (
                                                <HStack className="justify-between">
                                                    <Text size="xs" className="text-typography-500">Due Date:</Text>
                                                    <Text size="xs" bold className="text-error-600">{new Date(b.dueDate).toLocaleDateString()}</Text>
                                                </HStack>
                                            )}
                                        </VStack>

                                        {/* Action Buttons */}
                                        <HStack className="justify-end mt-2" space="sm">
                                            {b.status === 'pending' && (
                                                <>
                                                    <TouchableOpacity
                                                        onPress={() => handleApprove(b._id)}
                                                        className="bg-success-500 px-3 py-2 rounded-lg mr-2"
                                                    >
                                                        <Text className="text-white text-xs font-bold">Approve</Text>
                                                    </TouchableOpacity>
                                                    <TouchableOpacity
                                                        onPress={() => handleReject(b._id)}
                                                        className="bg-error-500 px-3 py-2 rounded-lg"
                                                    >
                                                        <Text className="text-white text-xs font-bold">Reject</Text>
                                                    </TouchableOpacity>
                                                </>
                                            )}
                                            {b.status === 'return_pending' && (
                                                <TouchableOpacity
                                                    onPress={() => handleConfirmReturn(b._id)}
                                                    className="bg-secondary-500 px-3 py-2 rounded-lg"
                                                >
                                                    <Text className="text-white text-xs font-bold">Confirm Return</Text>
                                                </TouchableOpacity>
                                            )}
                                        </HStack>
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
