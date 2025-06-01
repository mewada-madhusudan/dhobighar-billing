import {Stack} from 'expo-router';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {AuthProvider, useAuth} from "@/app/services/AuthContext";

// function StackNavigator() {
//     const {user} = useAuth();
//
//     return (
//         <Stack>
//             <Stack.Screen name="index" options={{headerShown: false}}/>
//             <Stack.Screen name="screens/auth" options={{headerShown: false}}/>
//             {user?.isApproved && (
//                 <>
//                     <Stack.Screen name="screens/InvoicesScreen" options={{headerShown: false}}/>
//                     <Stack.Screen name="screens/new-bill" options={{headerShown: false}}/>
//                     <Stack.Screen name="screens/payPerkg" options={{headerShown: false}}/>
//                     <Stack.Screen name="screens/customerdetails" options={{headerShown: false}}/>
//                 </>
//             )}
//             {user?.isAdmin && (
//                 <>
//                     <Stack.Screen name="screens/settings" options={{headerShown: false}}/>
//                     <Stack.Screen name="screens/admin-panel" options={{headerShown: false}}/>
//                 </>
//             )}
//         </Stack>
//     );
// }
function StackNavigator() {
    const {user} = useAuth();

    const approvedScreens = user?.isApproved ? [
        <Stack.Screen key="invoices" name="screens/InvoicesScreen" options={{title: 'Order History'}}/>,
        <Stack.Screen key="new-bill" name="screens/new-bill" options={{title: 'New invoice'}}/>,
        <Stack.Screen key="payPerkg" name="screens/payPerkg" options={{title: 'Invoice By KG'}}/>,
        <Stack.Screen key="customerdetails" name="screens/customerdetails" options={{title: 'Details'}}/>,
    ] : [];

    const adminScreens = user?.isAdmin ? [
        <Stack.Screen key="settings" name="screens/settings" options={{title: 'Service Items'}}/>,
        <Stack.Screen key="admin-panel" name="screens/adminPanel" options={{title: 'Admin Panel'}}/>,
    ] : [];

    return (
        <Stack>
            <Stack.Screen name="index" options={{title: ''}}/>
            <Stack.Screen name="screens/auth" options={{title: ''}}/>
            {approvedScreens}
            {adminScreens}
        </Stack>
    );
}

export default function Layout() {
    return (
        <SafeAreaProvider>
            <AuthProvider>
                <StackNavigator/>
            </AuthProvider>
        </SafeAreaProvider>
    );
}