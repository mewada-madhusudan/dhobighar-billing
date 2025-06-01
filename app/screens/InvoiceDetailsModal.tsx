import React, {JSX} from 'react';
import {View, Text, StyleSheet, Modal, ScrollView, TouchableOpacity, Image} from 'react-native';
import {MaterialIcons} from '@expo/vector-icons';
import type {Invoice} from '@/types';

interface InvoiceDetailsModalProps {
    invoice: Invoice | null;
    visible: boolean;
    onClose: () => void;
}

const getCategoryDisplay = (category: string): string => {
    switch (category.toLowerCase()) {
        case 'drycleaning':
            return 'DC';
        case 'washandiron':
            return 'W&I';
        case 'wash':
            return 'WASH';
        case 'package':
            return 'PKG';
        case 'package items':
            return 'INC';
        default:
            if (category.startsWith('Package ') && category.includes(' Items')) {
                return 'INC';
            }
            if (category.startsWith('Package ')) {
                return 'PKG';
            }
            return category;
    }
};

export function InvoiceDetailsModal({invoice, visible, onClose}: InvoiceDetailsModalProps) {
    if (!invoice) return null;

    // Check if this is a package-based invoice
    const isPackageInvoice = invoice.packageInfo || invoice.items.some(item =>
        item.category === 'Package' || item.category.startsWith('Package ')
    );

    const renderPackageSummary = () => {
        if (!isPackageInvoice || !invoice.packageInfo) return null;

        // Handle multiple packages
        if ("packages" in invoice.packageInfo && invoice.packageInfo.packages && Array.isArray(invoice.packageInfo.packages)) {
            const totalWeight = invoice.packageInfo.packages.reduce((sum: number, pkg: any) => sum + (pkg?.weight || 0), 0);
            const totalItems = invoice.packageInfo.packages.reduce((sum: number, pkg: any) => {
                return sum + (pkg?.items?.length || 0);
            }, 0);

            return (
                <View style={styles.packageSummary}>
                    <View style={styles.packageHeader}>
                        <MaterialIcons name="inventory" size={20} color="#4CAF50"/>
                        <Text style={styles.packageTitle}>Multiple Packages Details</Text>
                    </View>
                    <View style={styles.packageDetails}>
                        <View style={styles.packageRow}>
                            <Text style={styles.packageLabel}>Total Packages:</Text>
                            <Text style={styles.packageValue}>{invoice.packageInfo.packages.length}</Text>
                        </View>
                        <View style={styles.packageRow}>
                            <Text style={styles.packageLabel}>Total Weight:</Text>
                            <Text style={styles.packageValue}>{totalWeight} KG</Text>
                        </View>
                        <View style={styles.packageRow}>
                            <Text style={styles.packageLabel}>Total Items:</Text>
                            <Text style={styles.packageValue}>{totalItems} items</Text>
                        </View>

                        {/* Individual package breakdown */}
                        {invoice.packageInfo.packages.map((pkg: any, index: number) => (
                            <View key={index} style={styles.individualPackage}>
                                <Text style={styles.individualPackageTitle}>
                                    Package {index + 1}: {pkg?.packageName || 'Unknown Package'}
                                </Text>
                                <Text style={styles.individualPackageDetails}>
                                    {pkg?.weight || 0} KG × ₹{pkg?.rate || 0}/KG = ₹{(pkg?.total || 0).toFixed(2)}
                                </Text>
                                <Text style={styles.individualPackageItems}>
                                    Items: {pkg?.items?.map((item: any) => item?.item || 'Unknown Item').join(', ') || 'No items'}
                                </Text>
                            </View>
                        ))}
                    </View>
                </View>
            );
        }

        // Handle single package (backward compatibility)
        else {
            return (
                <View style={styles.packageSummary}>
                    <View style={styles.packageHeader}>
                        <MaterialIcons name="inventory" size={20} color="#4CAF50"/>
                        <Text style={styles.packageTitle}>Package Details</Text>
                    </View>
                    <View style={styles.packageDetails}>
                        <View style={styles.packageRow}>
                            <Text style={styles.packageLabel}>Package:</Text>
                            <Text
                                style={styles.packageValue}>{"packageName" in invoice.packageInfo && invoice.packageInfo.packageName || 'Unknown Package'}</Text>
                        </View>
                        <View style={styles.packageRow}>
                            <Text style={styles.packageLabel}>Weight:</Text>
                            <Text style={styles.packageValue}>{"weight" in invoice.packageInfo && invoice.packageInfo.weight || 0} KG</Text>
                        </View>
                        <View style={styles.packageRow}>
                            <Text style={styles.packageLabel}>Rate:</Text>
                            <Text style={styles.packageValue}>₹{"rate" in invoice.packageInfo && invoice.packageInfo.rate || 0}/KG</Text>
                        </View>
                        <View style={styles.packageRow}>
                            <Text style={styles.packageLabel}>Items:</Text>
                            <Text style={styles.packageValue}>{"items" in invoice.packageInfo && invoice.packageInfo.items?.length || 0} items</Text>
                        </View>
                    </View>
                </View>
            );
        }
    };

    const renderItemsTable = () => {
        if (isPackageInvoice && invoice.packageInfo) {
            // Handle multiple packages
            if ("packages" in invoice.packageInfo && invoice.packageInfo.packages && Array.isArray(invoice.packageInfo.packages)) {
                let packageNumber = 1;
                const rows: JSX.Element[] = [];

                invoice.packageInfo.packages.forEach((pkg: any, pkgIndex: number) => {
                    // Main package row
                    rows.push(
                        <View key={`pkg-${pkgIndex}`} style={styles.tableRow}>
                            <Text style={[styles.cell, styles.snCell]}>{packageNumber++}</Text>
                            <Text style={[styles.cell, styles.particularCell]}>
                                {pkg?.packageName || 'Unknown Package'} ({pkg?.weight || 0} KG)
                            </Text>
                            <Text style={[styles.cell, styles.typeCell]}>PKG</Text>
                            <Text style={[styles.cell, styles.qtyCell]}>{pkg?.weight || 0}</Text>
                            <Text style={[styles.cell, styles.rateCell]}>₹{pkg?.rate || 0}</Text>
                            <Text style={[styles.cell, styles.amtCell]}>₹{(pkg?.total || 0).toFixed(2)}</Text>
                        </View>
                    );

                    // Individual items as included (no numbering)
                    if (pkg?.items && Array.isArray(pkg.items)) {
                        pkg.items.forEach((item: any, itemIndex: number) => {
                            rows.push(
                                <View key={`item-${pkgIndex}-${itemIndex}`}
                                      style={[styles.tableRow, styles.includedItemRow]}>
                                    <Text style={[styles.cell, styles.snCell]}>-</Text>
                                    <Text style={[styles.cell, styles.particularCell, styles.includedItem]}>
                                        ├─ {item?.item || 'Unknown Item'} (Included)
                                    </Text>
                                    <Text style={[styles.cell, styles.typeCell]}>INC</Text>
                                    <Text style={[styles.cell, styles.qtyCell]}>{item?.quantity || 0}</Text>
                                    <Text style={[styles.cell, styles.rateCell]}>₹0</Text>
                                    <Text style={[styles.cell, styles.amtCell]}>₹0</Text>
                                </View>
                            );
                        });
                    }
                });

                return rows;
            }
            // Handle single package (backward compatibility)
            else if ("packageName" in invoice.packageInfo && invoice.packageInfo.packageName) {
                const rows: JSX.Element[] = [];

                // Main package row
                rows.push(
                    <View key="main-package" style={styles.tableRow}>
                        <Text style={[styles.cell, styles.snCell]}>1</Text>
                        <Text style={[styles.cell, styles.particularCell]}>
                            {invoice.packageInfo.packageName} ({invoice.packageInfo.weight || 0} KG)
                        </Text>
                        <Text style={[styles.cell, styles.typeCell]}>PKG</Text>
                        <Text style={[styles.cell, styles.qtyCell]}>{invoice.packageInfo.weight || 0}</Text>
                        <Text style={[styles.cell, styles.rateCell]}>₹{invoice.packageInfo.rate || 0}</Text>
                        <Text style={[styles.cell, styles.amtCell]}>₹{invoice.packageInfo.total || 0}</Text>
                    </View>
                );

                // Individual items as included (no numbering)
                if (invoice.packageInfo.items && Array.isArray(invoice.packageInfo.items)) {
                    invoice.packageInfo.items.forEach((item: any, index: number) => {
                        rows.push(
                            <View key={`included-${index}`} style={[styles.tableRow, styles.includedItemRow]}>
                                <Text style={[styles.cell, styles.snCell]}>-</Text>
                                <Text style={[styles.cell, styles.particularCell, styles.includedItem]}>
                                    ├─ {item?.item || 'Unknown Item'} (Included)
                                </Text>
                                <Text style={[styles.cell, styles.typeCell]}>INC</Text>
                                <Text style={[styles.cell, styles.qtyCell]}>{item?.quantity || 0}</Text>
                                <Text style={[styles.cell, styles.rateCell]}>₹0</Text>
                                <Text style={[styles.cell, styles.amtCell]}>₹0</Text>
                            </View>
                        );
                    });
                }

                return rows;
            }
        }

        // Regular invoice - show all items normally
        return invoice.items.map((item, index) => (
            <View key={index} style={styles.tableRow}>
                <Text style={[styles.cell, styles.snCell]}>{index + 1}</Text>
                <Text style={[styles.cell, styles.particularCell]}>{item.name}</Text>
                <Text style={[styles.cell, styles.typeCell]}>
                    {getCategoryDisplay(item.category)}
                </Text>
                <Text style={[styles.cell, styles.qtyCell]}>{item.quantity}</Text>
                <Text style={[styles.cell, styles.rateCell]}>₹{item.price}</Text>
                <Text style={[styles.cell, styles.amtCell]}>
                    ₹{(item.quantity * item.price).toFixed(2)}
                </Text>
            </View>
        ));
    };

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
                        <MaterialIcons name="close" size={24} color="#4CAF50"/>
                    </TouchableOpacity>

                    <ScrollView style={styles.scrollView}>
                        <View style={styles.invoice}>
                            <View style={styles.headerContainer}>
                                <Image
                                    source={require('@/assets/dhobighar-logo.png')}
                                    style={styles.logo}
                                    resizeMode='contain'
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
                                    <Text style={styles.detailLabel}>To: </Text>
                                    <Text style={styles.detailValue}>{invoice.customerName}</Text>
                                </View>
                                <View style={styles.detailRow}>
                                    <Text style={styles.detailLabel}>Add: </Text>
                                    <Text style={styles.detailValue}>{invoice.address}</Text>
                                </View>
                                <View style={styles.dateContainer}>
                                    <Text style={styles.detailLabel}>Date: </Text>
                                    <Text style={styles.detailValue}>
                                        {new Date(invoice.date).toLocaleDateString()}
                                    </Text>
                                </View>
                            </View>

                            {renderPackageSummary()}

                            <View style={styles.table}>
                                <View style={styles.tableHeader}>
                                    <Text style={[styles.headerCell, styles.snCell]}>S.N</Text>
                                    <Text style={[styles.headerCell, styles.particularCell]}>Particulars</Text>
                                    <Text style={[styles.headerCell, styles.typeCell]}>Type</Text>
                                    <Text style={[styles.headerCell, styles.qtyCell]}>Qty</Text>
                                    <Text style={[styles.headerCell, styles.rateCell]}>Rate</Text>
                                    <Text style={[styles.headerCell, styles.amtCell]}>Amt</Text>
                                </View>

                                {renderItemsTable()}

                                <View style={styles.totalRow}>
                                    <Text style={styles.totalLabel}>Total</Text>
                                    <Text style={styles.totalAmount}>₹{invoice.total.toFixed(2)}</Text>
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
                                <MaterialIcons name="phone" size={16} color="#4CAF50"/>
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
    packageSummary: {
        backgroundColor: '#e8f5e8',
        borderRadius: 8,
        padding: 15,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: '#4CAF50',
    },
    packageHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    packageTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#4CAF50',
        marginLeft: 8,
    },
    packageDetails: {
        paddingLeft: 8,
    },
    packageRow: {
        flexDirection: 'row',
        marginBottom: 4,
    },
    packageLabel: {
        width: 120,
        fontWeight: '500',
        color: '#2e7d32',
        fontSize: 14,
    },
    packageValue: {
        flex: 1,
        color: '#1b5e20',
        fontSize: 14,
    },
    individualPackage: {
        backgroundColor: '#f1f8e9',
        padding: 10,
        borderRadius: 6,
        marginTop: 8,
        borderWidth: 1,
        borderColor: '#c8e6c9',
    },
    individualPackageTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#2e7d32',
        marginBottom: 4,
    },
    individualPackageDetails: {
        fontSize: 13,
        color: '#388e3c',
        marginBottom: 4,
    },
    individualPackageItems: {
        fontSize: 12,
        color: '#4caf50',
        fontStyle: 'italic',
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
    includedItemRow: {
        backgroundColor: '#f8f9fa',
    },
    cell: {
        fontSize: 12,
        fontFamily: 'Nunito',
        textAlign: 'center',
    },
    includedItem: {
        color: '#666',
        fontStyle: 'italic',
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
        marginBottom: 5,
    },
});