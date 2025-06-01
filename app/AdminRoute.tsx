// components/AdminRoute.tsx
import React from 'react';
import {View, Text} from 'react-native';
import {useAuth} from "@/app/services/AuthContext";

const AdminRoute = ({children}: { children: React.ReactNode }) => {
    const {user, loading} = useAuth();

    if (loading) {
        return (
            <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
                <Text>Loading...</Text>
            </View>
        );
    }

    if (!user?.isAdmin) {
        return (
            <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
                <Text>Access Denied</Text>
            </View>
        );
    }

    return <>{children}</>;
};

export default AdminRoute;