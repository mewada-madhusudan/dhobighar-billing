// import {Stack} from 'expo-router';
//
// export default function Layout() {
//     return (
//         <Stack>
//             <Stack.Screen name="index" options={{title: 'Home'}}/>
//             <Stack.Screen name="screens/InvoicesScreen" options={{title: 'Invoices'}}/>
//             <Stack.Screen name="screens/new-bill" options={{title: 'New Bill'}}/>
//             <Stack.Screen name="screens/customer-details" options={{title: 'Customer Details'}}/>
//         </Stack>
//
//     );
// }
import { Stack } from 'expo-router';
import {AuthProvider, useAuth} from "@/app/services/AuthContext";
function StackNavigator() {
    const { user } = useAuth();

    return (
        <Stack>
            <Stack.Screen name="index" options={{ title: '' }} />
            <Stack.Screen name="screens/auth" options={{ title: '' }} />
            {user?.isApproved && (
                <>
                    <Stack.Screen name="screens/InvoicesScreen" options={{ title: '' }} />
                    <Stack.Screen name="screens/new-bill" options={{ title: '' }} />
                    <Stack.Screen name="screens/customerdetails" options={{ title: '' }} />
                </>
            )}
            {user?.isAdmin && (
                <>
                    <Stack.Screen name="screens/settings" options={{ title: 'Service Items' }} />
                    <Stack.Screen name="screens/admin-panel" options={{ title: 'Admin Panel' }} />
                </>
            )}
        </Stack>
    );
}

export default function Layout() {
    return (
        <AuthProvider>
            <StackNavigator />
        </AuthProvider>
    );
}