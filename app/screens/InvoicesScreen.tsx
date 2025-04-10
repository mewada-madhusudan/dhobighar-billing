// InvoicesScreen.tsx
import React, { useEffect, useState } from 'react';
import {
    View,
    FlatList,
    Text,
    StyleSheet,
    TouchableOpacity,
    Alert,
    Platform,
    Linking, TextInput
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Invoice } from '@/types';
import { InvoiceDetailsModal } from './InvoiceDetailsModal';
import { getInvoices } from "@/firebase/services";
import { generateInvoicePDF } from "@/app/screens/shareinvoice";
import {router} from "expo-router";

export default function InvoicesScreen() {
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadInvoices();
    }, []);

    useEffect(() => {
        filterInvoices();
    }, [searchQuery, invoices]);

    const loadInvoices = async () => {
        const loadedInvoices = await getInvoices();
        setInvoices(loadedInvoices);
    };

    const filterInvoices = () => {
        if (!searchQuery.trim()) {
            setFilteredInvoices(invoices);
            return;
        }

        const query = searchQuery.toLowerCase().trim();
        const filtered = invoices.filter(invoice => {
            const matchesName = invoice.customerName.toLowerCase().includes(query);
            const matchesId = invoice.id.toLowerCase().includes(query);
            const matchesDate = new Date(invoice.date)
                .toLocaleString()
                .toLowerCase()
                .includes(query);

            return matchesName || matchesId || matchesDate;
        });

        setFilteredInvoices(filtered);
    };

    const formatWhatsAppInvoice = (invoice: Invoice) => {
        // Group items by category
        const groupedItems = invoice.items.reduce((acc, item) => {
            if (!acc[item.category]) {
                acc[item.category] = [];
            }
            acc[item.category].push(item);
            return acc;
        }, {} as Record<string, typeof invoice.items>);

        // Format items by category
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
            `${invoice.address ? `Address: ${invoice.address}\n` : ''}` +
            `Phone: ${invoice.phone}\n\n` +
            `📋 *Order Details*\n` +
            `${formattedItems}\n\n` +
            `💰 *Total Amount: ₹${invoice.total}*\n\n` +
            `Date: ${formattedDate}\n\n` +
            `*Service Duration*: 2 days (Excluding pickup and delivery)\n\n` +
            `Thank you! 🙏`;
    };

    const downloadPDF = async (invoice: Invoice) => {
        try {
            setLoading(true);
            const pdfUri = await generateInvoicePDF(invoice);

            if (!pdfUri) {
                throw new Error('Failed to generate PDF');
            }

            if (Platform.OS === 'android') {
                const downloadPath = `${FileSystem.documentDirectory}invoice_${invoice.id}.pdf`;
                await FileSystem.copyAsync({
                    from: pdfUri,
                    to: downloadPath
                });

                if (await Sharing.isAvailableAsync()) {
                    await Sharing.shareAsync(downloadPath);
                } else {
                    Alert.alert('Error', 'Sharing is not available on this device');
                }
            } else {
                // For iOS, just use the share dialog
                await Sharing.shareAsync(pdfUri);
            }

            Alert.alert('Success', 'Invoice PDF has been downloaded successfully!');
        } catch (error) {
            console.error('Error downloading PDF:', error);
            Alert.alert('Error', 'Failed to download PDF. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const shareInvoice = async (invoice: Invoice) => {
        try {
            const whatsappUrl = `whatsapp://send?phone=${invoice.phone}&text=${encodeURIComponent(formatWhatsAppInvoice(invoice))}`;
            const supported = await Linking.canOpenURL(whatsappUrl);

            if (supported) {
                await Linking.openURL(whatsappUrl);
                router.replace('/');
            } else {
                Alert.alert('Error', 'WhatsApp is not installed on this device');
            }
        } catch (error) {
            console.error('Error sharing invoice:', error);
            // @ts-ignore
            const errorMessage = error.response?.data?.error?.message || error.message || 'Failed to send invoice. Please try again.';
            Alert.alert('Error', errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const showInvoiceDetails = (invoice: Invoice) => {
        setSelectedInvoice(invoice);
        setModalVisible(true);
    };

    const renderInvoice = ({ item }: { item: Invoice }) => (
        <View style={styles.invoiceItem}>
            <TouchableOpacity
                onPress={() => showInvoiceDetails(item)}
                style={styles.invoiceHeader}
            >
                <Text style={styles.invoiceId}>{item.id}</Text>
                <View style={styles.invoiceDetails}>
                    <Text style={styles.customerName}>{item.customerName}</Text>
                    <Text style={styles.date}>{new Date(item.date).toLocaleString()}</Text>
                    <Text style={styles.amount}>₹{item.total}</Text>
                </View>
            </TouchableOpacity>
            <View style={styles.actionButtons}>
                <TouchableOpacity
                    style={[styles.actionButton, styles.downloadButton]}
                    onPress={() => downloadPDF(item)}
                    disabled={loading}
                >
                    <MaterialIcons name="file-download" size={20} color="#fff" />
                    <Text style={styles.actionButtonText}>Download</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.actionButton, styles.shareButton]}
                    onPress={() => shareInvoice(item)}
                    disabled={loading}
                >
                    <MaterialIcons name="share" size={20} color="#fff" />
                    <Text style={styles.actionButtonText}>Share</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.searchContainer}>
                <MaterialIcons name="search" size={20} color="#666" style={styles.searchIcon} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search by name, invoice number, or date..."
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    placeholderTextColor="#999"
                />
                {searchQuery ? (
                    <TouchableOpacity
                        onPress={() => setSearchQuery('')}
                        style={styles.clearButton}
                    >
                        <MaterialIcons name="close" size={20} color="#666" />
                    </TouchableOpacity>
                ) : null}
            </View>

            <FlatList
                data={filteredInvoices}
                renderItem={renderInvoice}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.listContainer}
            />
            <InvoiceDetailsModal
                invoice={selectedInvoice}
                visible={modalVisible}
                onClose={() => setModalVisible(false)}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        margin: 16,
        marginBottom: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#e0e0e0',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        paddingVertical: 12,
        fontSize: 16,
        color: '#333',
    },
    clearButton: {
        padding: 8,
    },
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    listContainer: {
        padding: 16,
        paddingTop: 8,
    },
    invoiceItem: {
        backgroundColor: '#fff',
        borderRadius: 12,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    invoiceHeader: {
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    invoiceDetails: {
        marginTop: 8,
    },
    invoiceId: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#4CAF50',
    },
    customerName: {
        fontSize: 16,
        color: '#333',
    },
    date: {
        fontSize: 14,
        color: '#666',
        marginTop: 4,
    },
    amount: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginTop: 4,
    },
    actionButtons: {
        flexDirection: 'row',
        padding: 12,
        justifyContent: 'space-around',
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        borderRadius: 8,
        flex: 1,
        marginHorizontal: 6,
        justifyContent: 'center',
    },
    downloadButton: {
        backgroundColor: '#2196F3',
    },
    shareButton: {
        backgroundColor: '#4CAF50',
    },
    actionButtonText: {
        color: '#fff',
        marginLeft: 8,
        fontWeight: '500',
    },
});