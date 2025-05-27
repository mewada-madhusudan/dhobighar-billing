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
    ActivityIndicator
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

export default function PayByKGScreen() {
    const [selectedPackage, setSelectedPackage] = useState<string>('');
    const [rate, setRate] = useState<string>('');
    const [weight, setWeight] = useState<string>('');
    const [total, setTotal] = useState<number>(0);
    const [item, setItem] = useState<string>('');
    const [quantity, setQuantity] = useState<string>('');
    const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([]);
    const [packages, setPackages] = useState<PackageItem[]>([]);
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

    const proceedToCustomerDetails = () => {
        if (!selectedPackage || !weight || parseFloat(weight) <= 0) {
            Alert.alert('Error', 'Please select a package and enter valid weight');
            return;
        }

        if (invoiceItems.length === 0) {
            Alert.alert('Error', 'Please add at least one item to proceed');
            return;
        }

        // Create a cart-like structure for the pay-per-kg items
        // We'll create virtual items with unique IDs based on the package and items
        const cart: Record<string, number> = {};
        const prices: Record<string, number> = {};

        // Create a single cart entry for the package-based calculation
        const packageItem = packages.find(p => p.id === selectedPackage);
        if (packageItem) {
            // Use the package ID as the cart item ID
            const cartItemId = `pkg_${selectedPackage}`;
            cart[cartItemId] = parseFloat(weight); // Use weight as quantity
            prices[cartItemId] = parseFloat(rate); // Use rate as price per unit
        }

        // Navigate to customer details with the cart and package info
        router.push({
            pathname: '/screens/customerdetails',
            params: {
                cart: JSON.stringify(cart),
                prices: JSON.stringify(prices),
                packageInfo: JSON.stringify({
                    packageName: packageItem?.package_name,
                    weight: parseFloat(weight),
                    rate: parseFloat(rate),
                    total: total,
                    items: invoiceItems
                })
            }
        });
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <MaterialIcons name="arrow-back" size={24} color="#4CAF50"/>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Pay by KG</Text>
            </View>

            <ScrollView style={styles.content}>
                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#4CAF50"/>
                        <Text style={styles.loadingText}>Loading packages...</Text>
                    </View>
                ) : (
                    <View style={styles.formContainer}>
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

                        {/* Added Items List */}
                        {invoiceItems.length > 0 && (
                            <View style={styles.itemsList}>
                                <Text style={styles.itemsListTitle}>Added Items:</Text>
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
                                styles.generateButton,
                                (!selectedPackage || !weight || parseFloat(weight) <= 0 || invoiceItems.length === 0) && styles.disabledButton
                            ]}
                            onPress={proceedToCustomerDetails}
                            disabled={!selectedPackage || !weight || parseFloat(weight) <= 0 || invoiceItems.length === 0}
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
    generateButton: {
        backgroundColor: '#4CAF50',
        padding: 16,
        alignItems: 'center',
        borderRadius: 8,
        marginTop: 10,
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
});