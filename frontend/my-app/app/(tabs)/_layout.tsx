import React from 'react';
import { Tabs } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import { useColorScheme } from 'react-native';
import Colors from '@/constants/Colors';

function TabBarIcon(props: {
    name: React.ComponentProps<typeof FontAwesome>['name'];
    color: string;
}) {
    return <FontAwesome size={24} style={{ marginBottom: -3 }} {...props} />;
}

export default function TabLayout() {
    const colorScheme = useColorScheme();
    const activeColor = '#007AFF'; // Blue for active

    return (
        <Tabs screenOptions={{
            tabBarActiveTintColor: activeColor,
            headerShown: false,
            tabBarStyle: {
                height: 80, // Increased height for safe area
                paddingBottom: 20, // Avoid system nav overlap
                paddingTop: 10,
                borderTopWidth: 0,
                elevation: 10,
                shadowOpacity: 0.1
            }
        }}>
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Browse',
                    tabBarIcon: ({ color }) => <TabBarIcon name="search" color={color} />,
                }}
            />
            <Tabs.Screen
                name="my-books"
                options={{
                    title: 'My Shelf',
                    tabBarIcon: ({ color }) => <TabBarIcon name="book" color={color} />,
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: 'Account',
                    tabBarIcon: ({ color }) => <TabBarIcon name="user-circle" color={color} />,
                }}
            />
        </Tabs>
    );
}
