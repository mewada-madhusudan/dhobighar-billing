// screens/AdminPanel.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { approveUser, rejectUser } from '@/firebase/auth';

interface PendingUser {
    id: string;
    userId: string;
    email: string;
    displayName: string;
    createdAt: Date;
}

export default function AdminPanel() {
    const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);

    useEffect(() => {
        const q = query(
            collection(db, 'adminNotifications'),
            where('status', '==', 'PENDING')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const users: PendingUser[] = [];
            snapshot.forEach((doc) => {
                users.push({ id: doc.id, ...doc.data() } as PendingUser);
            });
            setPendingUsers(users);
        });

        return unsubscribe;
    }, []);

    const handleApprove = async (userId: string) => {
        try {
            await approveUser(userId);
        } catch (error) {
            console.error('Error approving user:', error);
        }
    };

    const handleReject = async (userId: string) => {
        try {
            await rejectUser(userId);
        } catch (error) {
            console.error('Error rejecting user:', error);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Pending Approvals</Text>
            <FlatList
                data={pendingUsers}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <View style={styles.userCard}>
                        <View style={styles.userInfo}>
                            <Text style={styles.userName}>{item.displayName}</Text>
                            <Text style={styles.userEmail}>{item.email}</Text>
                            <Text style={styles.userDate}>
                                Requested: {new Date(item.createdAt).toLocaleDateString()}
                            </Text>
                        </View>
                        <View style={styles.actions}>
                            <TouchableOpacity
                                style={[styles.button, styles.approveButton]}
                                onPress={() => handleApprove(item.userId)}
                            >
                                <Text style={styles.buttonText}>Approve</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.button, styles.rejectButton]}
                                onPress={() => handleReject(item.userId)}
                            >
                                <Text style={styles.buttonText}>Reject</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
        backgroundColor: '#fff',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 16,
        color: '#333',
    },
    userCard: {
        backgroundColor: '#f5f5f5',
        borderRadius: 8,
        padding: 16,
        marginBottom: 12,
    },
    userInfo: {
        marginBottom: 12,
    },
    userName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    userEmail: {
        fontSize: 16,
        color: '#666',
        marginTop: 4,
    },
    userDate: {
        fontSize: 14,
        color: '#888',
        marginTop: 4,
    },
    actions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
    },
    button: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 4,
        marginLeft: 8,
    },
    approveButton: {
        backgroundColor: '#4CAF50',
    },
    rejectButton: {
        backgroundColor: '#FF6B6B',
    },
    buttonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
});