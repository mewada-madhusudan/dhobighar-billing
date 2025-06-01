import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { auth, db } from '@/firebase/config';
import { approveUser, rejectUser } from '@/firebase/auth';

interface PendingUser {
    id: string;
    userId: string;
    email: string;
    displayName: string;
    createdAt: Date;
}

interface Employee {
    id: string;
    email: string;
    displayName: string;
    isAdmin: boolean;
    isApproved: boolean;
    createdAt: Date;
}

type TabType = 'employees' | 'requests';

export default function AdminPanel() {
    const [activeTab, setActiveTab] = useState<TabType>('employees');
    const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const currentUserId = auth.currentUser?.uid;

    useEffect(() => {
        // Listen to pending requests
        const pendingQuery = query(
            collection(db, 'adminNotifications'),
            where('status', '==', 'PENDING')
        );

        const unsubscribePending = onSnapshot(pendingQuery, (snapshot) => {
            const users: PendingUser[] = [];
            snapshot.forEach((doc) => {
                const data = doc.data();
                users.push({
                    id: doc.id,
                    ...data,
                    createdAt: data.createdAt?.toDate() || new Date()
                } as PendingUser);
            });
            setPendingUsers(users);
        });

        // Listen to all approved users (employees)
        const employeesQuery = query(
            collection(db, 'users'),
            where('isApproved', '==', true)
        );

        const unsubscribeEmployees = onSnapshot(employeesQuery, (snapshot) => {
            const users: Employee[] = [];
            snapshot.forEach((doc) => {
                const data = doc.data();
                const userData = {
                    id: doc.id,
                    ...data,
                    createdAt: data.createdAt?.toDate() || new Date()
                } as Employee;
                // Exclude current logged-in user
                if (doc.id !== currentUserId) {
                    users.push(userData);
                }
            });
            setEmployees(users);
        });

        return () => {
            unsubscribePending();
            unsubscribeEmployees();
        };
    }, [currentUserId]);

    const handleApprove = async (userId: string) => {
        try {
            await approveUser(userId);
            Alert.alert('Success', 'User approved successfully');
        } catch (error) {
            console.error('Error approving user:', error);
            Alert.alert('Error', 'Failed to approve user');
        }
    };

    const handleReject = async (userId: string) => {
        try {
            await rejectUser(userId);
            Alert.alert('Success', 'User rejected successfully');
        } catch (error) {
            console.error('Error rejecting user:', error);
            Alert.alert('Error', 'Failed to reject user');
        }
    };

    const handleRemoveAccess = async (userId: string, displayName: string) => {
        Alert.alert(
            'Confirm Removal',
            `Are you sure you want to remove access for ${displayName}?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Remove',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const userRef = doc(db, 'users', userId);
                            await updateDoc(userRef, {
                                isApproved: false
                            });
                            Alert.alert('Success', 'User access removed successfully');
                        } catch (error) {
                            console.error('Error removing user access:', error);
                            Alert.alert('Error', 'Failed to remove user access');
                        }
                    }
                }
            ]
        );
    };

    const renderPendingUser = ({ item }: { item: PendingUser }) => (
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
    );

    const renderEmployee = ({ item }: { item: Employee }) => (
        <View style={styles.userCard}>
            <View style={styles.userInfo}>
                <Text style={styles.userName}>
                    {item.displayName}
                    {item.isAdmin && <Text style={styles.adminBadge}> (Admin)</Text>}
                </Text>
                <Text style={styles.userEmail}>{item.email}</Text>
                <Text style={styles.userDate}>
                    Joined: {new Date(item.createdAt).toLocaleDateString()}
                </Text>
            </View>
            <View style={styles.actions}>
                <TouchableOpacity
                    style={[styles.button, styles.removeButton]}
                    onPress={() => handleRemoveAccess(item.id, item.displayName)}
                >
                    <Text style={styles.buttonText}>Remove Access</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.tabContainer}>
                <TouchableOpacity
                    style={[
                        styles.tab,
                        activeTab === 'employees' && styles.activeTab
                    ]}
                    onPress={() => setActiveTab('employees')}
                >
                    <Text style={[
                        styles.tabText,
                        activeTab === 'employees' && styles.activeTabText
                    ]}>
                        Employees ({employees.length})
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[
                        styles.tab,
                        activeTab === 'requests' && styles.activeTab
                    ]}
                    onPress={() => setActiveTab('requests')}
                >
                    <Text style={[
                        styles.tabText,
                        activeTab === 'requests' && styles.activeTabText
                    ]}>
                        Requests ({pendingUsers.length})
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Content */}
            {activeTab === 'employees' ? (
                <FlatList
                    data={employees}
                    keyExtractor={(item) => item.id}
                    renderItem={renderEmployee}
                    ListEmptyComponent={
                        <Text style={styles.emptyText}>No employees found</Text>
                    }
                />
            ) : (
                <FlatList
                    data={pendingUsers}
                    keyExtractor={(item) => item.id}
                    renderItem={renderPendingUser}
                    ListEmptyComponent={
                        <Text style={styles.emptyText}>No pending requests</Text>
                    }
                />
            )}
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
    tabContainer: {
        flexDirection: 'row',
        marginBottom: 16,
        backgroundColor: '#f0f0f0',
        borderRadius: 8,
        padding: 4,
    },
    tab: {
        flex: 1,
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 6,
        alignItems: 'center',
    },
    activeTab: {
        backgroundColor: '#058e2b',
    },
    tabText: {
        fontSize: 16,
        fontWeight: '500',
        color: '#666',
    },
    activeTabText: {
        color: '#fff',
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
    adminBadge: {
        fontSize: 14,
        color: '#ff0026',
        fontWeight: 'normal',
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
    removeButton: {
        backgroundColor: '#FF8C00',
    },
    buttonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    emptyText: {
        textAlign: 'center',
        fontSize: 16,
        color: '#888',
        marginTop: 32,
    },
});