//
// import React, {useState} from 'react';
// import {Alert, Linking, StyleSheet, Text, TextInput, TouchableOpacity, View} from 'react-native';
// import {router, useLocalSearchParams} from 'expo-router';
// import type {Invoice} from '@/types';
// import {useItems} from '@/stores/useItems';
// import {getNextInvoiceId, saveInvoice} from "@/firebase/services";
//
// export default function CustomerDetails() {
//     const [name, setName] = useState('');
//     const [phone, setPhone] = useState('');
//     const [address, setAddress] = useState('');
//     const params = useLocalSearchParams();
//     const cart = params.cart ? JSON.parse(params.cart as string) : {};
//     const {items} = useItems();
//
//     const calculateTotal = () => {
//         return Object.entries(cart).reduce((total, [itemId, quantity]) => {
//             const itemDetails = Object.values(items)
//                 .flat()
//                 .find(item => item.id === itemId);
//             return total + (itemDetails?.price || 0) * (quantity as number);
//         }, 0);
//     };
//
//     const formatPhoneNumber = (number: string) => {
//         const cleaned = number.replace(/\D/g, '');
//         return cleaned.startsWith('91') ? cleaned : `91${cleaned}`;
//     };
//
//     const formatWhatsAppInvoice = (invoice: Invoice) => {
//         // Group items by category
//         const groupedItems = invoice.items.reduce((acc, item) => {
//             if (!acc[item.category]) {
//                 acc[item.category] = [];
//             }
//             acc[item.category].push(item);
//             return acc;
//         }, {} as Record<string, typeof invoice.items>);
//
//         // Format items by category
//         const formattedItems = Object.entries(groupedItems)
//             .map(([category, items]) => {
//                 const itemsList = items
//                     .map(item =>
//                         `   • ${item.name}\n     Qty: ${item.quantity} × ₹${item.price} = ₹${item.quantity * item.price}`
//                     )
//                     .join('\n');
//
//                 return `📦 *${category}*\n${itemsList}`;
//             })
//             .join('\n\n');
//
//         // Format date in a more readable way
//         const formattedDate = new Date(invoice.date).toLocaleString('en-IN', {
//             day: '2-digit',
//             month: 'short',
//             year: 'numeric',
//             hour: '2-digit',
//             minute: '2-digit',
//             hour12: true
//         });
//
//         return `*Dhobighar*\n\n` +
//             `🧾 *Invoice Details:*\n` +
//             `Invoice ID: ${invoice.id}\n\n` +
//             `👤 *Customer Details:*\n` +
//             `Name: ${invoice.customerName}\n` +
//             `${address ? `Address: ${invoice.address}\n` : ''}` +
//             `Phone: ${invoice.phone}\n\n` +
//             `📋 *Order Details*\n` +
//             `${formattedItems}\n\n` +
//             `💰 *Total Amount: ₹${invoice.total}*\n\n` +
//             `Date: ${formattedDate}\n\n` +
//             `Thank you! 🙏`;
//     };
//
//     const handleSubmit = async () => {
//         try {
//             const invoiceId = await getNextInvoiceId();
//             const itemsList = Object.entries(cart).map(([itemId, quantity]) => {
//                 const itemDetails = Object.values(items)
//                     .flat()
//                     .find(item => item.id === itemId);
//                 return {
//                     id: itemId,
//                     name: itemDetails?.name || '',
//                     quantity: quantity as number,
//                     price: itemDetails?.price || 0,
//                     category: itemDetails?.category || ''
//                 };
//             });
//
//             const invoice: Invoice = {
//                 id: invoiceId,
//                 customerName: name,
//                 phone: formatPhoneNumber(phone),
//                 address: address,
//                 items: itemsList,
//                 total: calculateTotal(),
//                 date: new Date().toISOString()
//             };
//
//             await saveInvoice(invoice);
//
//             // Generate WhatsApp message and open WhatsApp
//             const whatsappUrl = `whatsapp://send?phone=${formatPhoneNumber(phone)}&text=${encodeURIComponent(formatWhatsAppInvoice(invoice))}`;
//
//             const supported = await Linking.canOpenURL(whatsappUrl);
//
//             if (supported) {
//                 await Linking.openURL(whatsappUrl);
//                 router.replace('/');
//             } else {
//                 Alert.alert(
//                     'Error',
//                     'WhatsApp is not installed on this device'
//                 );
//             }
//         } catch (error) {
//             console.error('Error:', error);
//             Alert.alert(
//                 'Error',
//                 'There was an error generating or sharing the bill. Please try again.'
//             );
//         }
//     };
//
//     return (
//         <View style={styles.container}>
//             <TextInput
//                 style={styles.input}
//                 placeholder="Customer Name"
//                 value={name}
//                 onChangeText={setName}
//             />
//             <TextInput
//                 style={styles.input}
//                 placeholder="Phone Number"
//                 value={phone}
//                 onChangeText={setPhone}
//                 keyboardType="phone-pad"
//                 maxLength={12}
//             />
//             <TextInput
//                 style={styles.input}
//                 placeholder="Address"
//                 value={address}
//                 onChangeText={setAddress}
//             />
//             <TouchableOpacity
//                 style={[styles.button, (!name || !phone) && styles.disabledButton]}
//                 onPress={handleSubmit}
//                 disabled={!name || !phone}
//             >
//                 <Text style={styles.buttonText}>Generate & Share Bill</Text>
//             </TouchableOpacity>
//         </View>
//     );
// }
//
// const styles = StyleSheet.create({
//     container: {
//         flex: 1,
//         padding: 16,
//         backgroundColor: '#fff',
//     },
//     input: {
//         height: 40,
//         borderColor: '#ddd',
//         borderWidth: 1,
//         borderRadius: 8,
//         paddingHorizontal: 16,
//         marginBottom: 16,
//     },
//     button: {
//         backgroundColor: '#4CAF50',
//         padding: 16,
//         borderRadius: 8,
//         alignItems: 'center',
//     },
//     buttonText: {
//         color: '#fff',
//         fontSize: 16,
//         fontWeight: 'bold',
//     },
//     disabledButton: {
//         backgroundColor: '#ccc',
//     },
// });
import React, {useState} from 'react';
import {View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Linking, Share} from 'react-native';
import {router, useLocalSearchParams} from 'expo-router';
import type {Invoice} from '@/types';
import {useItems} from '@/stores/useItems';
import {getNextInvoiceId, saveInvoice} from "@/firebase/services";


export default function Customerdetails() {
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState('');

    const params = useLocalSearchParams();
    const cart = params.cart ? JSON.parse(params.cart as string) : {};
    const customPrices = params.prices ? JSON.parse(params.prices as string) : {};
    const {items} = useItems();

    const calculateTotal = () => {
        return Object.entries(cart).reduce((total, [itemId, quantity]) => {
            const itemDetails = Object.values(items)
                .flat()
                .find(item => item.id === itemId);
            const price = customPrices[itemId] || itemDetails?.price || 0;
            return total + price * (quantity as number);
        }, 0);
    };

    const formatPhoneNumber = (number: string) => {
        const cleaned = number.replace(/\D/g, '');
        return cleaned.startsWith('91') ? cleaned : `91${cleaned}`;
    };

    const formatWhatsAppInvoice = (invoice: Invoice) => {
        const groupedItems = invoice.items.reduce((acc, item) => {
            if (!acc[item.category]) {
                acc[item.category] = [];
            }
            acc[item.category].push(item);
            return acc;
        }, {} as Record<string, typeof invoice.items>);

        const formattedItems = Object.entries(groupedItems)
            .map(([category, items]) => {
                const itemsList = items
                    .map(item =>
                        `   • ${item.name}\n     Qty: ${item.quantity} × ₹${item.price} = ₹${item.quantity * item.price}`
                    )
                    .join('\n');

                return `📦 *${category}*\n${itemsList}`;
            })
            .join('\n\n');

        const formattedDate = new Date(invoice.date).toLocaleString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });

        return `*Dhobighar*\n\n` +
            `🧾 *Invoice Details:*\n` +
            `Invoice ID: ${invoice.id}\n\n` +
            `👤 *Customer Details:*\n` +
            `Name: ${invoice.customerName}\n` +
            `${address ? `Address: ${invoice.address}\n` : ''}` +
            `Phone: ${invoice.phone}\n\n` +
            `📋 *Order Details*\n` +
            `${formattedItems}\n\n` +
            `💰 *Total Amount: ₹${invoice.total}*\n\n` +
            `Date: ${formattedDate}\n\n` +
            `*Service Duration*: 2 days (Excluding pickup and delivery)\n\n` +
            `Thank you! 🙏`;
    };

    const handleSubmit = async () => {
        try {
            const invoiceId = await getNextInvoiceId();
            const itemsList = Object.entries(cart).map(([itemId, quantity]) => {
                const itemDetails = Object.values(items)
                    .flat()
                    .find(item => item.id === itemId);
                return {
                    id: itemId,
                    name: itemDetails?.name || '',
                    quantity: quantity as number,
                    price: customPrices[itemId] || itemDetails?.price || 0, // Use custom price if available
                    category: itemDetails?.category || ''
                };
            });

            const invoice: Invoice = {
                id: invoiceId,
                customerName: name,
                phone: formatPhoneNumber(phone),
                address: address,
                items: itemsList,
                total: calculateTotal(),
                date: new Date().toISOString()
            };

            await saveInvoice(invoice);
            const whatsappUrl = `whatsapp://send?phone=${formatPhoneNumber(phone)}&text=${encodeURIComponent(formatWhatsAppInvoice(invoice))}`;
            const supported = await Linking.canOpenURL(whatsappUrl);

            if (supported) {
                await Linking.openURL(whatsappUrl);
                router.replace('/');
            } else {
                Alert.alert('Error', 'WhatsApp is not installed on this device');
            }
        } catch (error) {
            console.error('Error:', error);
            Alert.alert('Error', 'There was an error generating or sharing the bill. Please try again.');
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.card}>
                <Text style={styles.heading}>Customer Details</Text>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Name</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Enter customer name"
                        placeholderTextColor="#9CA3AF"
                        value={name}
                        onChangeText={setName}
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Phone Number</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Enter phone number"
                        placeholderTextColor="#9CA3AF"
                        value={phone}
                        onChangeText={setPhone}
                        keyboardType="phone-pad"
                        maxLength={12}
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Address</Text>
                    <TextInput
                        style={[styles.input, styles.addressInput]}
                        placeholder="Enter delivery address"
                        placeholderTextColor="#9CA3AF"
                        value={address}
                        onChangeText={setAddress}
                        multiline
                        numberOfLines={3}
                    />
                </View>

                <TouchableOpacity
                    style={[styles.button, (!name || !phone) && styles.disabledButton]}
                    onPress={handleSubmit}
                    disabled={!name || !phone}
                >
                    <Text style={styles.buttonText}>
                        Generate & Share Bill
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
        backgroundColor: '#F3F4F6',
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    heading: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 24,
    },
    inputGroup: {
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: '500',
        color: '#374151',
        marginBottom: 6,
    },
    input: {
        height: 44,
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 8,
        paddingHorizontal: 16,
        fontSize: 16,
        color: '#111827',
    },
    addressInput: {
        height: 80,
        textAlignVertical: 'top',
        paddingTop: 12,
    },
    button: {
        backgroundColor: '#4F46E5',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 8,
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    disabledButton: {
        backgroundColor: '#E5E7EB',
    },
});