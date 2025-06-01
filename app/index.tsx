import React, {useEffect} from 'react';
import {router} from 'expo-router';
import {setupOfflineSync} from './services/offline-queue';
import {View, TouchableOpacity, Text, StyleSheet, SafeAreaView, Image} from 'react-native';
import {MaterialIcons} from '@expo/vector-icons';
import {useAuth} from "@/app/services/AuthContext";

export default function Index() {
    const {user, loading} = useAuth();

    useEffect(() => {
        const initApp = async () => {
            setupOfflineSync();
        };

        initApp();
    }, []);

    useEffect(() => {
        if (!loading && !user) {
            router.replace('/screens/auth');
        }
    }, [user, loading]);

    if (loading) {
        return (
            <View style={[styles.container, styles.centerContent]}>
                <Text>Loading...</Text>
            </View>
        );
    }

    if (!user?.isApproved) {
        return (
            <View style={[styles.container, styles.centerContent]}>
                <Text style={styles.pendingText}>Your account is pending approval.</Text>
                <Text style={styles.pendingSubText}>Please wait for admin approval to access the app.</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Image
                    source={require('@/assets/dhobighar-logo.png')}
                    style={styles.logo}
                />
                <Text style={styles.headerTitle}>DHOBIGHAR</Text>
            </View>
            <View style={styles.container}>
                <TouchableOpacity
                    style={styles.card}
                    onPress={() => router.push('/screens/new-bill')}
                >
                    <MaterialIcons name="receipt" size={24} color="#4CAF50"/>
                    <View style={styles.cardContent}>
                        <Text style={styles.cardTitle}>New Invoice</Text>
                        <Text style={styles.cardDescription}>Create a new invoice</Text>
                    </View>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.card}
                    onPress={() => router.push('/screens/payPerkg')}
                >
                    <MaterialIcons name="scale" size={24} color="#4CAF50"/>
                    <View style={styles.cardContent}>
                        <Text style={styles.cardTitle}>Pay by KG</Text>
                        <Text style={styles.cardDescription}>Create invoice based on weight</Text>
                    </View>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.card}
                    onPress={() => router.push('/screens/InvoicesScreen')}
                >
                    <MaterialIcons name="history" size={24} color="#4CAF50"/>
                    <View style={styles.cardContent}>
                        <Text style={styles.cardTitle}>Invoice History</Text>
                        <Text style={styles.cardDescription}>View and manage past invoices</Text>
                    </View>
                </TouchableOpacity>

                {user.isAdmin && (
                    <>
                        <TouchableOpacity
                            style={styles.card}
                            onPress={() => router.push('/screens/settings')}
                        >
                            <MaterialIcons name="settings" size={24} color="#4CAF50"/>
                            <View style={styles.cardContent}>
                                <Text style={styles.cardTitle}>Service Items</Text>
                                <Text style={styles.cardDescription}>Manage items and categories</Text>
                            </View>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.card}
                            onPress={() => router.push('/screens/adminPanel')}
                        >
                            <MaterialIcons name="admin-panel-settings" size={24} color="#4CAF50"/>
                            <View style={styles.cardContent}>
                                <Text style={styles.cardTitle}>Admin Panel</Text>
                                <Text style={styles.cardDescription}>Manage user access and approvals</Text>
                            </View>
                        </TouchableOpacity>
                    </>
                )}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    logo: {
        width: 40,
        height: 40,
        marginRight: 12,
    },
    headerTitle: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#4CAF50',
        textAlign: 'center',
    },
    container: {
        flex: 1,
        padding: 16,
        backgroundColor: '#fff',
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
        padding: 20,
        borderRadius: 8,
        marginBottom: 16,
    },
    cardContent: {
        marginLeft: 16,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    cardDescription: {
        fontSize: 14,
        color: '#666',
        marginTop: 4,
    },
    centerContent: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    pendingText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#666',
        textAlign: 'center',
    },
    pendingSubText: {
        fontSize: 16,
        color: '#888',
        textAlign: 'center',
        marginTop: 8,
    },
});