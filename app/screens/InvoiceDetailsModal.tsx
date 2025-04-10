import React from 'react';
import { View, Text, StyleSheet, Modal, ScrollView, TouchableOpacity, Image } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import type { Invoice } from '@/types';

interface InvoiceDetailsModalProps {
    invoice: Invoice | null;
    visible: boolean;
    onClose: () => void;
}

const getCategoryDisplay = (category: string): string => {
    switch (category.toLowerCase()) {
        case 'DryCleaning':
            return 'DC';
        case 'WashAndIron':
            return 'W&I';
        case 'Wash':
            return 'WASH';
        default:
            return category;
    }
};

export function InvoiceDetailsModal({ invoice, visible, onClose }: InvoiceDetailsModalProps) {
    if (!invoice) return null;

    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <View style={styles.modalBackground}>
                <View style={styles.modalContent}>
                    <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                        <MaterialIcons name="close" size={24} color="#4CAF50" />
                    </TouchableOpacity>

                    <ScrollView style={styles.scrollView}>
                        <View style={styles.invoice}>
                            <View style={styles.headerContainer}>
                                <Image
                                    source={require('@/assets/dhobighar-logo.png')}
                                    style={styles.logo}
                                />
                                <View style={styles.headerText}>
                                    <Text style={styles.title}>DHOBIGHAR</Text>
                                    <View style={styles.subtitleContainer}>
                                        <Text style={styles.subtitle}>LAUNDRY & DRY CLEANING</Text>
                                    </View>
                                </View>
                            </View>

                            <View style={styles.detailsContainer}>
                                <View style={styles.detailRow}>
                                    <Text style={styles.detailLabel}>Invoice:</Text>
                                    <Text style={styles.detailValue}>{invoice.id}</Text>
                                </View>
                                <View style={styles.detailRow}>
                                    <Text style={styles.detailLabel}>To:     </Text>
                                    <Text style={styles.detailValue}>{invoice.customerName}</Text>
                                </View>
                                <View style={styles.detailRow}>
                                    <Text style={styles.detailLabel}>Add:    </Text>
                                    <Text style={styles.detailValue}>{invoice.address}</Text>
                                </View>
                                <View style={styles.dateContainer}>
                                    <Text style={styles.detailLabel}>Date:   </Text>
                                    <Text style={styles.detailValue}>
                                        {new Date(invoice.date).toLocaleDateString()}
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.table}>
                                <View style={styles.tableHeader}>
                                    <Text style={[styles.headerCell, styles.snCell]}>S.N</Text>
                                    <Text style={[styles.headerCell, styles.particularCell]}>Particulars</Text>
                                    <Text style={[styles.headerCell, styles.typeCell]}>Type</Text>
                                    <Text style={[styles.headerCell, styles.qtyCell]}>Qty</Text>
                                    <Text style={[styles.headerCell, styles.rateCell]}>Rate</Text>
                                    <Text style={[styles.headerCell, styles.amtCell]}>Amt</Text>
                                </View>

                                {invoice.items.map((item, index) => (
                                    <View key={index} style={styles.tableRow}>
                                        <Text style={[styles.cell, styles.snCell]}>{index + 1}</Text>
                                        <Text style={[styles.cell, styles.particularCell]}>{item.name}</Text>
                                        <Text style={[styles.cell, styles.typeCell]}>
                                            {getCategoryDisplay(item.category)}
                                        </Text>
                                        <Text style={[styles.cell, styles.qtyCell]}>{item.quantity}</Text>
                                        <Text style={[styles.cell, styles.rateCell]}>₹{item.price}</Text>
                                        <Text style={[styles.cell, styles.amtCell]}>
                                            ₹{item.quantity * item.price}
                                        </Text>
                                    </View>
                                ))}

                                <View style={styles.totalRow}>
                                    <Text style={styles.totalLabel}>Total</Text>
                                    <Text style={styles.totalAmount}>₹{invoice.total}</Text>
                                </View>
                            </View>

                            <View style={styles.locationsContainer}>
                                <Text style={styles.locationsTitle}>Our Locations:</Text>
                                <Text style={styles.locationText}>
                                    LIG-95, Khusilal Road, Nehur Nagar, Bhopal
                                </Text>
                                <Text style={styles.locationText}>
                                    UG-09 Kolar Plaza, Bhopal
                                </Text>
                                <Text style={styles.locationText}>
                                    H-132, Rajharsh Colony, Nayapura, Kolar road, Bhopal
                                </Text>
                            </View>

                            <View style={styles.contactContainer}>
                                <MaterialIcons name="phone" size={16} color="#4CAF50" />
                                <Text style={styles.contactText}>7222981927, 8989706473</Text>
                            </View>

                            <View style={styles.noteContainer}>
                                <Text style={styles.noteText}>
                                    Note: Shop stays closed on Thursday and all services remains unavailable
                                </Text>
                                <Text style={styles.noteText}>
                                    Service Duration: 2 Days (Excluding Pickup and Delivery)
                                </Text>
                            </View>
                        </View>
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalBackground: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
    },
    modalContent: {
        backgroundColor: '#fff',
        margin: 20,
        borderRadius: 8,
        maxHeight: '90%',
        borderWidth: 2,
        borderColor: '#4CAF50',
    },
    closeButton: {
        position: 'absolute',
        right: 10,
        top: 10,
        zIndex: 1,
    },
    scrollView: {
        padding: 15,
    },
    invoice: {
        backgroundColor: '#fff',
    },
    headerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
        paddingTop: 10,
    },
    logo: {
        width: 60,
        height: 60,
        resizeMode: 'contain',
    },
    headerText: {
        flex: 1,
        alignItems: 'center',
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#000',
        letterSpacing: 2,
    },
    subtitleContainer: {
        backgroundColor: '#4CAF50',
        paddingHorizontal: 10,
        paddingVertical: 2,
        borderRadius: 4,
        marginTop: 5,
    },
    subtitle: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '500',
    },
    detailsContainer: {
        borderWidth: 1,
        borderColor: '#4CAF50',
        padding: 10,
        marginBottom: 15,
    },
    detailRow: {
        flexDirection: 'row',
        marginBottom: 5,
    },
    detailLabel: {
        width: 60,
        fontWeight: '500',
        color: '#4CAF50',
    },
    detailValue: {
        flex: 1,
    },
    dateContainer: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: 5,
    },
    table: {
        borderWidth: 1,
        borderColor: '#4CAF50',
        marginBottom: 15,
    },
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: '#4CAF50',
        padding: 8,
    },
    headerCell: {
        color: '#fff',
        fontWeight: '500',
        fontSize: 12,
        textAlign: 'center',
    },
    snCell: {
        flex: 0.5,
    },
    particularCell: {
        flex: 2,
    },
    typeCell: {
        flex: 0.8,
        textAlign: 'center',
    },
    qtyCell: {
        flex: 0.5,
        textAlign: 'center',
    },
    rateCell: {
        flex: 0.8,
        textAlign: 'right',
    },
    amtCell: {
        flex: 1,
        textAlign: 'right',
    },
    tableRow: {
        flexDirection: 'row',
        borderTopWidth: 1,
        borderColor: '#4CAF50',
        padding: 8,
    },
    cell: {
        fontSize: 12,
        fontFamily: 'Nunito',
        textAlign: 'center',
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 8,
        borderTopWidth: 1,
        borderColor: '#4CAF50',
        backgroundColor: '#f0f9f0',
    },
    totalLabel: {
        fontWeight: 'bold',
        color: '#4CAF50',
    },
    totalAmount: {
        fontWeight: 'bold',
        color: '#4CAF50',
    },
    locationsContainer: {
        marginTop: 20,
    },
    locationsTitle: {
        color: '#4CAF50',
        fontWeight: '500',
        marginBottom: 5,
    },
    locationText: {
        fontSize: 12,
        marginBottom: 3,
        color: '#666',
    },
    contactContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 10,
    },
    contactText: {
        fontSize: 12,
        color: '#666',
        marginLeft: 5,
    },
    noteContainer: {
        marginTop: 15,
        padding: 10,
        backgroundColor: '#fff9c4',
        borderRadius: 4,
    },
    noteText: {
        fontSize: 12,
        color: '#f57c00',
    },
});