import React, {useState, useEffect} from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    TouchableOpacity,
    TextInput,
    ScrollView,
    Alert,
    ActivityIndicator, Image
} from 'react-native';
import {MaterialIcons} from '@expo/vector-icons';
import {router} from 'expo-router';
import {Picker} from '@react-native-picker/picker';
import {collection, getDocs} from 'firebase/firestore';
import {db} from "@/firebase/config";

interface PackageItem {
    id: string;
    package_name: string;
    rate: number;
}

interface InvoiceItem {
    item: string;
    quantity: number;
}

interface PackageEntry {
    packageId: string;
    packageName: string;
    rate: number;
    weight: number;
    total: number;
    items: InvoiceItem[];
}

export default function PayByKGScreen() {
    // Current package being added
    const [selectedPackage, setSelectedPackage] = useState<string>('');
    const [rate, setRate] = useState<string>('');
    const [weight, setWeight] = useState<string>('');
    const [total, setTotal] = useState<number>(0);
    const [item, setItem] = useState<string>('');
    const [quantity, setQuantity] = useState<string>('');
    const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([]);

    // All packages data and added packages
    const [packages, setPackages] = useState<PackageItem[]>([]);
    const [addedPackages, setAddedPackages] = useState<PackageEntry[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        fetchPackages();
    }, []);

    useEffect(() => {
        // Calculate total when rate or weight changes
        const rateNum = parseFloat(rate) || 0;
        const weightNum = parseFloat(weight) || 0;
        setTotal(rateNum * weightNum);
    }, [rate, weight]);

    const fetchPackages = async () => {
        try {
            setLoading(true);
            const packagesRef = collection(db, 'packages');
            const snapshot = await getDocs(packagesRef);

            const packagesData: PackageItem[] = [];
            snapshot.forEach((doc) => {
                const data = doc.data();
                packagesData.push({
                    id: doc.id,
                    package_name: data.package_name || '',
                    rate: data.rate || 0,
                });
            });

            setPackages(packagesData);
        } catch (error) {
            console.error('Error fetching packages:', error);
            Alert.alert('Error', 'Failed to load packages. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handlePackageChange = (packageId: string) => {
        setSelectedPackage(packageId);
        const selectedPkg = packages.find(pkg => pkg.id === packageId);
        if (selectedPkg) {
            setRate(selectedPkg.rate.toString());
        }
    };

    const addInvoiceItem = () => {
        if (!item.trim() || !quantity || parseFloat(quantity) <= 0) {
            Alert.alert('Error', 'Please enter valid item name and quantity');
            return;
        }

        const newItem: InvoiceItem = {
            item: item.trim(),
            quantity: parseFloat(quantity)
        };

        setInvoiceItems([...invoiceItems, newItem]);

        // Reset item fields
        setItem('');
        setQuantity('');
    };

    const removeInvoiceItem = (index: number) => {
        const updatedItems = invoiceItems.filter((_, i) => i !== index);
        setInvoiceItems(updatedItems);
    };

    const addPackageToInvoice = () => {
        if (!selectedPackage || !weight || parseFloat(weight) <= 0) {
            Alert.alert('Error', 'Please select a package and enter valid weight');
            return;
        }

        if (invoiceItems.length === 0) {
            Alert.alert('Error', 'Please add at least one item for this package');
            return;
        }

        // Check if this package is already added
        const existingPackageIndex = addedPackages.findIndex(pkg => pkg.packageId === selectedPackage);

        if (existingPackageIndex >= 0) {
            Alert.alert(
                'Package Already Added',
                'This package is already in the invoice. Do you want to replace it or cancel?',
                [
                    { text: 'Cancel', style: 'cancel' },
                    {
                        text: 'Replace',
                        onPress: () => {
                            const updatedPackages = [...addedPackages];
                            updatedPackages[existingPackageIndex] = createPackageEntry();
                            setAddedPackages(updatedPackages);
                            resetCurrentPackage();
                        }
                    }
                ]
            );
            return;
        }

        // Add new package entry
        const newPackageEntry = createPackageEntry();
        setAddedPackages([...addedPackages, newPackageEntry]);
        resetCurrentPackage();
    };

    const createPackageEntry = (): PackageEntry => {
        const selectedPkg = packages.find(pkg => pkg.id === selectedPackage);
        return {
            packageId: selectedPackage,
            packageName: selectedPkg?.package_name || '',
            rate: parseFloat(rate),
            weight: parseFloat(weight),
            total: total,
            items: [...invoiceItems]
        };
    };

    const resetCurrentPackage = () => {
        setSelectedPackage('');
        setRate('');
        setWeight('');
        setTotal(0);
        setInvoiceItems([]);
        setItem('');
        setQuantity('');
    };

    const removePackageFromInvoice = (index: number) => {
        Alert.alert(
            'Remove Package',
            'Are you sure you want to remove this package from the invoice?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Remove',
                    style: 'destructive',
                    onPress: () => {
                        const updatedPackages = addedPackages.filter((_, i) => i !== index);
                        setAddedPackages(updatedPackages);
                    }
                }
            ]
        );
    };

    const calculateGrandTotal = () => {
        return addedPackages.reduce((sum, pkg) => sum + pkg.total, 0);
    };

    const proceedToCustomerDetails = () => {
        if (addedPackages.length === 0) {
            Alert.alert('Error', 'Please add at least one package to proceed');
            return;
        }

        // Create cart structure for multiple packages
        const cart: Record<string, number> = {};
        const prices: Record<string, number> = {};

        addedPackages.forEach((pkg, index) => {
            const cartItemId = `pkg_${pkg.packageId}_${index}`;
            cart[cartItemId] = pkg.weight;
            prices[cartItemId] = pkg.rate;
        });

        // Navigate to customer details with all package info
        router.push({
            pathname: '/screens/customerdetails',
            params: {
                cart: JSON.stringify(cart),
                prices: JSON.stringify(prices),
                packageInfo: JSON.stringify({
                    packages: addedPackages,
                    grandTotal: calculateGrandTotal()
                })
            }
        });
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView
                style={styles.content}
            >
                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#4CAF50"/>
                        <Text style={styles.loadingText}>Loading packages...</Text>
                    </View>
                ) : (
                    <View>
                        {/* Current Package Form */}
                        <View style={styles.formContainer}>
                            <Text style={styles.sectionTitle}>Add Package</Text>

                            {/* Package Dropdown */}
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>PACKAGES</Text>
                                <View style={styles.pickerContainer}>
                                    <Picker
                                        selectedValue={selectedPackage}
                                        onValueChange={handlePackageChange}
                                        style={styles.picker}
                                    >
                                        <Picker.Item label="Select Package" value=""/>
                                        {packages.map(pkg => (
                                            <Picker.Item
                                                key={pkg.id}
                                                label={pkg.package_name}
                                                value={pkg.id}
                                            />
                                        ))}
                                    </Picker>
                                </View>
                            </View>

                            {/* Rate, Weight, Total Row */}
                            <View style={styles.topRow}>
                                <View style={styles.rateInput}>
                                    <Text style={styles.label}>RATE</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={rate}
                                        onChangeText={setRate}
                                        placeholder="Rate per KG"
                                        keyboardType="numeric"
                                    />
                                </View>

                                <View style={styles.weightInput}>
                                    <Text style={styles.label}>WEIGHT</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={weight}
                                        onChangeText={setWeight}
                                        placeholder="KG"
                                        keyboardType="numeric"
                                    />
                                </View>

                                <View style={styles.totalInput}>
                                    <Text style={styles.label}>TOTAL</Text>
                                    <View style={[styles.input, styles.totalDisplay]}>
                                        <Text style={styles.totalText}>₹{total.toFixed(2)}</Text>
                                    </View>
                                </View>
                            </View>

                            {/* Item and Quantity Row */}
                            <View style={styles.itemRow}>
                                <View style={styles.itemInput}>
                                    <Text style={styles.label}>ITEM</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={item}
                                        onChangeText={setItem}
                                        placeholder="Enter item name"
                                    />
                                </View>

                                <View style={styles.quantityInput}>
                                    <Text style={styles.label}>Quantity</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={quantity}
                                        onChangeText={setQuantity}
                                        placeholder="Qty"
                                        keyboardType="numeric"
                                    />
                                </View>

                                <TouchableOpacity style={styles.addButton} onPress={addInvoiceItem}>
                                    <MaterialIcons name="add" size={24} color="#4CAF50"/>
                                </TouchableOpacity>
                            </View>

                            {/* Current Package Items List */}
                            {invoiceItems.length > 0 && (
                                <View style={styles.itemsList}>
                                    <Text style={styles.itemsListTitle}>Items for this package:</Text>
                                    {invoiceItems.map((invoiceItem, index) => (
                                        <View key={index} style={styles.itemRowDisplay}>
                                            <View style={styles.itemDetails}>
                                                <Text style={styles.itemName}>{invoiceItem.item}</Text>
                                                <Text style={styles.itemInfo}>Quantity: {invoiceItem.quantity}</Text>
                                            </View>
                                            <TouchableOpacity
                                                onPress={() => removeInvoiceItem(index)}
                                                style={styles.removeButton}
                                            >
                                                <MaterialIcons name="delete" size={20} color="#f44336"/>
                                            </TouchableOpacity>
                                        </View>
                                    ))}
                                </View>
                            )}

                            <TouchableOpacity
                                style={[
                                    styles.addPackageButton,
                                    (!selectedPackage || !weight || parseFloat(weight) <= 0 || invoiceItems.length === 0) && styles.disabledButton
                                ]}
                                onPress={addPackageToInvoice}
                                disabled={!selectedPackage || !weight || parseFloat(weight) <= 0 || invoiceItems.length === 0}
                            >
                                <Text style={styles.addPackageButtonText}>Add Package to Invoice</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Added Packages List */}
                        {addedPackages.length > 0 && (
                            <View style={styles.addedPackagesContainer}>
                                <Text style={styles.sectionTitle}>Added Packages</Text>
                                {addedPackages.map((pkg, index) => (
                                    <View key={index} style={styles.packageCard}>
                                        <View style={styles.packageHeader}>
                                            <Text style={styles.packageName}>{pkg.packageName}</Text>
                                            <TouchableOpacity
                                                onPress={() => removePackageFromInvoice(index)}
                                                style={styles.removePackageButton}
                                            >
                                                <MaterialIcons name="delete" size={20} color="#f44336"/>
                                            </TouchableOpacity>
                                        </View>
                                        <Text style={styles.packageDetails}>
                                            Weight: {pkg.weight} KG | Rate: ₹{pkg.rate}/KG | Total: ₹{pkg.total.toFixed(2)}
                                        </Text>
                                        <View style={styles.packageItems}>
                                            <Text style={styles.itemsTitle}>Items:</Text>
                                            {pkg.items.map((item, itemIndex) => (
                                                <Text key={itemIndex} style={styles.packageItemText}>
                                                    • {item.item} (Qty: {item.quantity})
                                                </Text>
                                            ))}
                                        </View>
                                    </View>
                                ))}

                                <View style={styles.grandTotalContainer}>
                                    <Text style={styles.grandTotalText}>
                                        Grand Total: ₹{calculateGrandTotal().toFixed(2)}
                                    </Text>
                                </View>
                            </View>
                        )}

                        <TouchableOpacity
                            style={[
                                styles.generateButton,
                                addedPackages.length === 0 && styles.disabledButton
                            ]}
                            onPress={proceedToCustomerDetails}
                            disabled={addedPackages.length === 0}
                        >
                            <Text style={styles.generateButtonText}>Proceed to Customer Details</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginLeft: 16,
    },
    content: {
        flex: 1,
        padding: 16,
    },
    formContainer: {
        backgroundColor: '#fff',
        borderWidth: 3,
        borderColor: '#4CAF50',
        padding: 20,
        borderRadius: 8,
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 16,
        textAlign: 'center',
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#035725',
        marginBottom: 8,
        letterSpacing: 1,
    },
    input: {
        borderWidth: 2,
        borderColor: '#4CAF50',
        padding: 12,
        fontSize: 16,
        backgroundColor: '#f9f9f9',
        borderRadius: 4,
    },
    pickerContainer: {
        borderWidth: 2,
        borderColor: '#4CAF50',
        backgroundColor: '#f9f9f9',
        borderRadius: 4,
    },
    picker: {
        height: 50,
    },
    topRow: {
        flexDirection: 'row',
        marginBottom: 20,
        gap: 12,
    },
    rateInput: {
        flex: 1,
    },
    weightInput: {
        flex: 1,
    },
    totalInput: {
        flex: 1,
    },
    totalDisplay: {
        justifyContent: 'center',
        backgroundColor: '#e8f5e8',
    },
    totalText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#4CAF50',
        textAlign: 'center',
    },
    itemRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        marginBottom: 20,
        gap: 12,
    },
    itemInput: {
        flex: 1,
    },
    quantityInput: {
        width: 100,
    },
    addButton: {
        width: 48,
        height: 48,
        borderWidth: 2,
        borderColor: '#4CAF50',
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 4,
    },
    itemsList: {
        marginBottom: 20,
    },
    itemsListTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 10,
        color: '#333',
    },
    itemRowDisplay: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#f0f8f0',
        padding: 12,
        marginBottom: 8,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#4CAF50',
    },
    itemDetails: {
        flex: 1,
    },
    itemName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    itemInfo: {
        fontSize: 14,
        color: '#666',
        marginTop: 2,
    },
    removeButton: {
        padding: 4,
    },
    addPackageButton: {
        backgroundColor: '#2196F3',
        padding: 16,
        alignItems: 'center',
        borderRadius: 8,
        marginTop: 10,
    },
    addPackageButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    addedPackagesContainer: {
        backgroundColor: '#fff',
        borderWidth: 2,
        borderColor: '#FF9800',
        padding: 20,
        borderRadius: 8,
        marginBottom: 16,
    },
    packageCard: {
        backgroundColor: '#fff3cd',
        padding: 16,
        borderRadius: 8,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#ffeaa7',
    },
    packageHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    packageName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        flex: 1,
    },
    removePackageButton: {
        padding: 4,
    },
    packageDetails: {
        fontSize: 14,
        color: '#666',
        marginBottom: 8,
    },
    packageItems: {
        marginTop: 8,
    },
    itemsTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 4,
    },
    packageItemText: {
        fontSize: 13,
        color: '#555',
        marginLeft: 8,
    },
    grandTotalContainer: {
        backgroundColor: '#e8f5e8',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 8,
    },
    grandTotalText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#4CAF50',
    },
    generateButton: {
        backgroundColor: '#4CAF50',
        padding: 16,
        alignItems: 'center',
        borderRadius: 8,
        marginTop: 10,
        marginBottom:30
    },
    generateButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    disabledButton: {
        backgroundColor: '#ccc',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 50,
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: '#666',
    },
    logo: {
        width: 40,
        height: 40,
        marginRight: 12,
    }
});