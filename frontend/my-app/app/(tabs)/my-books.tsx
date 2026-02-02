import React, { useState, useCallback, useEffect } from 'react';
import { StatusBar, ScrollView, RefreshControl, TouchableOpacity, Image, Alert, View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '@/utils/api';
import { useFocusEffect } from 'expo-router';

type Book = {
    _id: string;
    transactionId: string;
    title: string;
    author: string;
    status: 'available' | 'borrowed' | 'pending' | 'approved' | 'return_pending' | 'returned' | 'rejected';
    borrowDate?: string;
    dueDate?: string;
    image?: string;
};

// Helper for image URLs
const getBookImage = (book: any) => {
    if (book.image) {
        if (book.image.startsWith('http')) return book.image;
        if (book.image.startsWith('/uploads')) {
            const baseUrl = api.defaults.baseURL || 'http://localhost:3000';
            // Clean up double slashes just in case
            const cleanPath = book.image.startsWith('/') ? book.image : `/${book.image}`;
            return `${baseUrl.replace(/\/$/, '')}${cleanPath}`;
        }
    }
    return 'https://via.placeholder.com/150'; // Fallback
};

export default function MyBooksTab() {
    const [books, setBooks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');

    // Filter books based on active tab
    const filteredBooks = books.filter(book => {
        if (activeTab === 'active') {
            return ['pending', 'approved', 'borrowed', 'return_pending'].includes(book.status);
        } else {
            return ['returned', 'rejected'].includes(book.status);
        }
    });

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        if (userId) {
            fetchMyBooks(userId).then(() => setRefreshing(false));
        } else {
            setRefreshing(false);
        }
    }, [userId]);

    useEffect(() => {
        const loadUser = async () => {
            try {
                const id = await AsyncStorage.getItem('userId');
                if (id) {
                    setUserId(id);
                    fetchMyBooks(id);
                } else {
                    // Handle no user logic if needed
                }
            } catch (e) {
                console.error("Failed to load user", e);
            }
        };
        loadUser();
    }, []);

    const fetchMyBooks = async (id: string) => {
        try {
            // Only show loading spinner on initial empty load
            if (books.length === 0) setLoading(true);

            // Fetch history which should include all necessary statuses
            const response = await api.get(`/history/${id}`);

            // Defensive coding: Ensure every item has a unique transactionId
            const safeData = response.data.map((item: any, index: number) => ({
                ...item,
                transactionId: item.transactionId || `${item._id}-${index}-${Date.now()}`
            }));

            setBooks(safeData);
        } catch (error) {
            console.error('Error fetching my books:', error);
            // Alert.alert('Error', 'Could not load your books.');
        } finally {
            setLoading(false);
        }
    };

    const handleReturn = async (bookId: string) => {
        if (!userId) return;
        try {
            await api.post('/return', { userId, bookId });
            Alert.alert('Success', 'Return request submitted successfully');
            fetchMyBooks(userId);
        } catch (error: any) {
            Alert.alert('Error', 'Failed to return book');
            console.error(error);
        }
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-GB', {
            day: 'numeric', month: 'short', year: 'numeric'
        });
    };

    // --- RENDER HELPERS ---
    const getStatusColor = (status: string) => {
        if (status === 'borrowed' || status === 'approved') return '#dcfce7'; // green-100
        if (status === 'pending') return '#fef9c3'; // yellow-100
        return '#f3f4f6'; // gray-100
    };

    const getStatusTextColor = (status: string) => {
        if (status === 'borrowed' || status === 'approved') return '#15803d'; // green-700
        if (status === 'pending') return '#a16207'; // yellow-700
        return '#374151'; // gray-700
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#f9fafb" />

            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>My Shelf</Text>
                <Text style={styles.headerSubtitle}>Books currently in your possession</Text>
            </View>

            {/* Tabs */}
            <View style={styles.tabContainer}>
                <TouchableOpacity
                    style={[styles.tabButton, activeTab === 'active' && styles.activeTabButton]}
                    onPress={() => setActiveTab('active')}
                >
                    <Text style={[styles.tabText, activeTab === 'active' && styles.activeTabText]}>Current Loans</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tabButton, activeTab === 'history' && styles.activeTabButton]}
                    onPress={() => setActiveTab('history')}
                >
                    <Text style={[styles.tabText, activeTab === 'history' && styles.activeTabText]}>History</Text>
                </TouchableOpacity>
            </View>

            {loading && !refreshing ? (
                <View style={styles.centerContent}>
                    <ActivityIndicator size="large" color="#007AFF" />
                </View>
            ) : (
                filteredBooks.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyStateEmoji}>📚</Text>
                        <Text style={styles.emptyStateTitle}>No {activeTab === 'active' ? 'Active Loans' : 'History'} Yet</Text>
                        <Text style={styles.emptyStateDescription}>
                            {activeTab === 'active' ? 'Go to Browse tab to borrow books!' : 'Your past returns will render here.'}
                        </Text>
                    </View>
                ) : (
                    <ScrollView
                        style={styles.scrollView}
                        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#007AFF" />}
                        contentContainerStyle={styles.scrollContent}
                    >
                        {filteredBooks.map((item) => (
                            <View key={item.transactionId} style={styles.card}>
                                {/* Book Cover */}
                                <View style={styles.coverImageContainer}>
                                    <Image
                                        source={{ uri: getBookImage(item) }}
                                        style={styles.coverImage}
                                        resizeMode="cover"
                                    />
                                </View>

                                {/* Book Details */}
                                <View style={styles.cardContent}>
                                    <View>
                                        <Text style={styles.bookTitle} numberOfLines={2}>
                                            {item.title}
                                        </Text>
                                        <Text style={styles.bookAuthor}>
                                            {item.author}
                                        </Text>
                                    </View>

                                    <View style={styles.statusSection}>
                                        {/* Status Badge */}
                                        <View style={styles.statusRow}>
                                            <Text style={styles.statusLabel}>Status:</Text>
                                            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
                                                <Text style={[styles.statusText, { color: getStatusTextColor(item.status) }]}>
                                                    {item.status}
                                                </Text>
                                            </View>
                                        </View>

                                        {/* Due Date (Borrowed/Approved only) */}
                                        {(item.status === 'approved' || item.status === 'borrowed') && (
                                            <View style={styles.dueDateContainer}>
                                                <Text style={styles.dueDateText}>
                                                    Due: {formatDate(item.dueDate)}
                                                </Text>
                                            </View>
                                        )}

                                        {/* Return Button */}
                                        {(item.status === 'approved' || item.status === 'borrowed') && activeTab === 'active' && (
                                            <TouchableOpacity
                                                onPress={() => handleReturn(item._id)}
                                                style={styles.returnButton}
                                            >
                                                <Text style={styles.returnButtonText}>Return Book</Text>
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                </View>
                            </View>
                        ))}
                        <View style={{ height: 40 }} />
                    </ScrollView>
                )
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f9fafb', // background-50
    },
    header: {
        paddingTop: 64, // pt-16
        paddingHorizontal: 24, // px-6
        paddingBottom: 24, // pb-6
        backgroundColor: 'white',
        borderBottomLeftRadius: 24, // rounded-b-3xl
        borderBottomRightRadius: 24, // rounded-b-3xl
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
        marginBottom: 16, // mb-4
        zIndex: 10,
    },
    headerTitle: {
        fontSize: 32, // text-2xl
        fontWeight: 'bold',
        color: '#1a1a1a', // text-secondary-900
        marginBottom: 4, // mb-1
    },
    headerSubtitle: {
        fontSize: 16,
        color: '#737373', // text-typography-500
        marginBottom: 16, // mb-4
    },
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: '#f3f4f6', // bg-background-100
        padding: 4, // p-1
        borderRadius: 12, // rounded-xl
        marginHorizontal: 24, // px-6
        marginBottom: 16,
    },
    tabButton: {
        flex: 1,
        paddingVertical: 8, // py-2
        borderRadius: 8, // rounded-lg
        alignItems: 'center',
    },
    activeTabButton: {
        backgroundColor: 'white',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    tabText: {
        fontWeight: 'bold',
        color: '#9ca3af', // text-typography-400
    },
    activeTabText: {
        color: '#1a1a1a', // text-typography-900
    },
    centerContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 20, // padding: 20
        paddingBottom: 100,
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32, // px-8
        opacity: 0.7,
        marginTop: 50, // Adjust as needed for vertical centering
    },
    emptyStateEmoji: {
        fontSize: 60, // text-5xl
        marginBottom: 16, // mb-4
        opacity: 0.7, // grayscale effect
    },
    emptyStateTitle: {
        fontSize: 24, // text-lg
        fontWeight: 'bold',
        color: '#1a1a1a', // text-typography-900
        textAlign: 'center',
        marginBottom: 8, // mb-2
    },
    emptyStateDescription: {
        fontSize: 16,
        color: '#737373', // text-typography-500
        textAlign: 'center',
    },
    card: {
        flexDirection: 'row',
        backgroundColor: 'white',
        padding: 16,
        marginBottom: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e5e5e5',
    },
    coverImageContainer: {
        width: 80,
        height: 120,
        borderRadius: 8,
        overflow: 'hidden',
        backgroundColor: '#eee',
        marginRight: 16,
    },
    coverImage: {
        width: '100%',
        height: '100%',
    },
    cardContent: {
        flex: 1,
        justifyContent: 'space-between',
        paddingVertical: 4,
    },
    bookTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1a1a1a',
        marginBottom: 4,
    },
    bookAuthor: {
        fontSize: 14,
        color: '#666',
        fontWeight: '500',
    },
    statusSection: {
        marginTop: 8,
    },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
    },
    statusLabel: {
        fontSize: 12,
        color: '#666',
        marginRight: 8,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
    },
    statusText: {
        fontSize: 12,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    dueDateContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff7ed',
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        marginTop: 8,
        marginBottom: 8,
    },
    dueDateText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#c2410c',
    },
    returnButton: {
        backgroundColor: '#EF4444',
        padding: 8,
        borderRadius: 8,
        marginTop: 4,
        alignItems: 'center',
    },
    returnButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 12,
    },
});
