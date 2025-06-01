import React, {useState} from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    StyleSheet,
    Alert,
    Linking,
    ScrollView, Platform
} from 'react-native';
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
    const packageInfo = params.packageInfo ? JSON.parse(params.packageInfo as string) : null;
    const {items} = useItems();

    const calculateTotal = () => {
        if (packageInfo) {
            // For package-based billing - check if it's single or multiple packages
            if (packageInfo.packages && Array.isArray(packageInfo.packages)) {
                // Multiple packages: use grandTotal
                return packageInfo.grandTotal;
            } else {
                // Single package: use total (backward compatibility)
                return packageInfo.total;
            }
        }

        // For regular item-based billing
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
        let formattedItems: string;

        if (packageInfo) {
            if (packageInfo.packages && Array.isArray(packageInfo.packages)) {
                // Multiple packages format
                formattedItems = packageInfo.packages
                    .map((pkg: any, index: number) => {
                        const itemsList = pkg.items
                            .map((item: any) => `     • ${item.item} (Qty: ${item.quantity})`)
                            .join('\n');

                        return `📦 *Package ${index + 1}: ${pkg.packageName}*\n` +
                            `   Weight: ${pkg.weight} KG × ₹${pkg.rate}/KG = ₹${pkg.total.toFixed(2)}\n\n` +
                            `   📋 *Items Included:*\n${itemsList}`;
                    })
                    .join('\n\n');
            } else {
                // Single package format (backward compatibility)
                const itemsList = packageInfo.items
                    .map((item: any) => `   • ${item.item} (Qty: ${item.quantity})`)
                    .join('\n');

                formattedItems = `📦 *${packageInfo.packageName}*\n` +
                    `Weight: ${packageInfo.weight} KG × ₹${packageInfo.rate}/KG = ₹${packageInfo.total}\n\n` +
                    `📋 *Items Included:*\n${itemsList}`;
            }
        } else {
            // Format for regular item-based billing
            const groupedItems = invoice.items.reduce((acc, item) => {
                if (!acc[item.category]) {
                    acc[item.category] = [];
                }
                acc[item.category].push(item);
                return acc;
            }, {} as Record<string, typeof invoice.items>);

            formattedItems = Object.entries(groupedItems)
                .map(([category, items]) => {
                    const itemsList = items
                        .map(item =>
                            `   • ${item.name}\n     Qty: ${item.quantity} × ₹${item.price} = ₹${item.quantity * item.price}`
                        )
                        .join('\n');

                    return `📦 *${category}*\n${itemsList}`;
                })
                .join('\n\n');
        }

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
            let itemsList: any[] = [];

            if (packageInfo) {
                if (packageInfo.packages && Array.isArray(packageInfo.packages)) {
                    // Multiple packages - create items for each package
                    packageInfo.packages.forEach((pkg: any, pkgIndex: number) => {
                        // Add package entry
                        itemsList.push({
                            id: `pkg_${pkgIndex}_${Date.now()}`,
                            name: `${pkg.packageName} (${pkg.weight} KG)`,
                            quantity: pkg.weight,
                            price: pkg.rate,
                            category: `Package ${pkgIndex + 1}`
                        });

                        // Add individual items as additional entries for record keeping
                        pkg.items.forEach((item: any, itemIndex: number) => {
                            itemsList.push({
                                id: `item_${pkgIndex}_${itemIndex}_${Date.now()}`,
                                name: `${item.item} (Included in ${pkg.packageName})`,
                                quantity: item.quantity,
                                price: 0, // Price is 0 since it's included in package
                                category: `Package ${pkgIndex + 1} Items`
                            });
                        });
                    });
                } else {
                    // Single package (backward compatibility)
                    itemsList = [{
                        id: `pkg_${Date.now()}`,
                        name: `${packageInfo.packageName} (${packageInfo.weight} KG)`,
                        quantity: packageInfo.weight,
                        price: packageInfo.rate,
                        category: 'Package'
                    }];

                    // Add individual items as additional entries for record keeping
                    packageInfo.items.forEach((item: any, index: number) => {
                        itemsList.push({
                            id: `item_${Date.now()}_${index}`,
                            name: `${item.item} (Included)`,
                            quantity: item.quantity,
                            price: 0, // Price is 0 since it's included in package
                            category: 'Package Items'
                        });
                    });
                }
            } else {
                // Create items list for regular billing
                itemsList = Object.entries(cart).map(([itemId, quantity]) => {
                    const itemDetails = Object.values(items)
                        .flat()
                        .find(item => item.id === itemId);
                    return {
                        id: itemId,
                        name: itemDetails?.name || '',
                        quantity: quantity as number,
                        price: customPrices[itemId] || itemDetails?.price || 0,
                        category: itemDetails?.category || ''
                    };
                });
            }

            const invoice: Invoice = {
                id: invoiceId,
                customerName: name,
                phone: formatPhoneNumber(phone),
                address: address,
                items: itemsList,
                total: calculateTotal(),
                date: new Date().toISOString(),
                // Add package info for tracking if it exists
                ...(packageInfo && {packageInfo})
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

    const renderOrderSummary = () => {
        if (packageInfo) {
            if (packageInfo.packages && Array.isArray(packageInfo.packages)) {
                // Multiple packages summary
                const totalWeight = packageInfo.packages.reduce((sum: number, pkg: any) => sum + (pkg?.weight || 0), 0);
                const totalItems = packageInfo.packages.reduce((sum: number, pkg: any) => {
                    return sum + (pkg?.items?.length || 0);
                }, 0);

                return (
                    <View style={styles.summaryContainer}>
                        <Text style={styles.summaryTitle}>Order Summary</Text>
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Packages:</Text>
                            <Text style={styles.summaryValue}>{packageInfo.packages.length} packages</Text>
                        </View>
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Total Weight:</Text>
                            <Text style={styles.summaryValue}>{totalWeight} KG</Text>
                        </View>
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Total Items:</Text>
                            <Text style={styles.summaryValue}>{totalItems} items</Text>
                        </View>

                        {/* Individual package details */}
                        {packageInfo.packages.map((pkg: any, index: number) => (
                            <View key={index} style={styles.packageDetailContainer}>
                                <Text style={styles.packageDetailTitle}>
                                    Package {index + 1}: {pkg?.packageName || 'Unknown Package'}
                                </Text>
                                <View style={styles.packageDetailRow}>
                                    <Text style={styles.packageDetailLabel}>
                                        Weight: {pkg?.weight || 0} KG × ₹{pkg?.rate || 0}/KG
                                    </Text>
                                    <Text style={styles.packageDetailValue}>₹{(pkg?.total || 0).toFixed(2)}</Text>
                                </View>
                                <Text style={styles.packageDetailItems}>
                                    Items: {pkg?.items?.map((item: any) => item?.item || 'Unknown Item').join(', ') || 'No items'}
                                </Text>
                            </View>
                        ))}

                        <View style={[styles.summaryRow, styles.totalRow]}>
                            <Text style={styles.totalLabel}>Grand Total:</Text>
                            <Text style={styles.totalValue}>₹{(packageInfo.grandTotal || 0).toFixed(2)}</Text>
                        </View>
                    </View>
                );
            } else {
                // Single package summary (backward compatibility)
                return (
                    <View style={styles.summaryContainer}>
                        <Text style={styles.summaryTitle}>Order Summary</Text>
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Package:</Text>
                            <Text style={styles.summaryValue}>{packageInfo.packageName || 'Unknown Package'}</Text>
                        </View>
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Weight:</Text>
                            <Text style={styles.summaryValue}>{packageInfo.weight || 0} KG</Text>
                        </View>
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Rate:</Text>
                            <Text style={styles.summaryValue}>₹{packageInfo.rate || 0}/KG</Text>
                        </View>
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Items:</Text>
                            <Text style={styles.summaryValue}>{packageInfo.items?.length || 0} items</Text>
                        </View>
                        <View style={[styles.summaryRow, styles.totalRow]}>
                            <Text style={styles.totalLabel}>Total:</Text>
                            <Text style={styles.totalValue}>₹{(packageInfo.total || 0).toFixed(2)}</Text>
                        </View>
                    </View>
                );
            }
        }

        // Regular item summary
        const totalAmount = calculateTotal();
        const itemCount = Object.values(cart).reduce((sum: number, qty) => sum + (qty as number), 0);

        return (
            <View style={styles.summaryContainer}>
                <Text style={styles.summaryTitle}>Order Summary</Text>
                <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Items:</Text>
                    <Text style={styles.summaryValue}>{itemCount} items</Text>
                </View>
                <View style={[styles.summaryRow, styles.totalRow]}>
                    <Text style={styles.totalLabel}>Total:</Text>
                    <Text style={styles.totalValue}>₹{totalAmount.toFixed(2)}</Text>
                </View>
            </View>
        );
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={'position'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
        >
            <ScrollView
                contentContainerStyle={styles.scrollContainer}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.card}>
                    <Text style={styles.heading}>Customer Details</Text>

                    {renderOrderSummary()}

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Name</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Enter customer name"
                            placeholderTextColor="#9CA3AF"
                            value={name}
                            onChangeText={setName}
                            returnKeyType="next"
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
                            returnKeyType="next"
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
                            returnKeyType="done"
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
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F3F4F6',
    },
    scrollContainer: {
        flexGrow: 1,
        padding: 10,
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 10,
        margin: 8,
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
        marginBottom: 20,
    },
    summaryContainer: {
        backgroundColor: '#F0F9FF',
        borderRadius: 8,
        padding: 16,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#E0F2FE',
    },
    summaryTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#0F172A',
        marginBottom: 12,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    summaryLabel: {
        fontSize: 14,
        color: '#64748B',
    },
    summaryValue: {
        fontSize: 14,
        color: '#1E293B',
        fontWeight: '500',
    },
    packageDetailContainer: {
        backgroundColor: '#FFFFFF',
        padding: 12,
        borderRadius: 6,
        marginVertical: 8,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    packageDetailTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#1E293B',
        marginBottom: 4,
    },
    packageDetailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    packageDetailLabel: {
        fontSize: 13,
        color: '#64748B',
    },
    packageDetailValue: {
        fontSize: 13,
        color: '#1E293B',
        fontWeight: '500',
    },
    packageDetailItems: {
        fontSize: 12,
        color: '#64748B',
        fontStyle: 'italic',
    },
    totalRow: {
        borderTopWidth: 1,
        borderTopColor: '#E2E8F0',
        paddingTop: 8,
        marginTop: 8,
    },
    totalLabel: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#0F172A',
    },
    totalValue: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#4F46E5',
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