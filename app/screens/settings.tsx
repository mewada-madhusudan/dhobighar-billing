import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
    ScrollView,
    Animated,
    FlatList,
    Modal,
    SafeAreaView,
} from 'react-native';
import { collection, addDoc, doc, updateDoc, deleteDoc, getDocs } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { useItems } from '@/stores/useItems';
import { MaterialIcons } from '@expo/vector-icons';

type Category = 'Wash' | 'WashAndIron' | 'DryCleaning';
type SettingsTab = 'items' | 'packages';

interface ItemForm {
    name: string;
    price: string;
    category: Category;
}

interface PackageForm {
    package_name: string;
    rate: string;
}

interface PackageItem {
    id: string;
    package_name: string;
    rate: number;
}

export default function SettingsScreen() {
    const { items, fetchItems } = useItems();
    const [activeTab, setActiveTab] = useState<SettingsTab>('items');
    const [showAddForm, setShowAddForm] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<Category>('Wash');
    const [searchQuery, setSearchQuery] = useState('');
    const [form, setForm] = useState<ItemForm>({
        name: '',
        price: '',
        category: 'Wash'
    });
    const [packageForm, setPackageForm] = useState<PackageForm>({
        package_name: '',
        rate: ''
    });
    const [packages, setPackages] = useState<PackageItem[]>([]);
    const [updateModalVisible, setUpdateModalVisible] = useState(false);
    const [selectedItem, setSelectedItem] = useState<any>(null);
    const [selectedPackage, setSelectedPackage] = useState<PackageItem | null>(null);
    const [packageUpdateModalVisible, setPackageUpdateModalVisible] = useState(false);

    const slideAnim = useRef(new Animated.Value(0)).current;

    const categories: Category[] = ['Wash', 'WashAndIron', 'DryCleaning'];

    // Fetch items when component mounts or when activeTab changes to items
    useEffect(() => {
        if (activeTab === 'items') {
            fetchItems();
        } else if (activeTab === 'packages') {
            fetchPackages();
        }
    }, [activeTab]);

    const fetchPackages = async () => {
        try {
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
            Alert.alert('Error', 'Failed to load packages');
        }
    };

    const toggleAddForm = () => {
        const toValue = showAddForm ? 0 : 1;
        setShowAddForm(!showAddForm);
        Animated.spring(slideAnim, {
            toValue,
            useNativeDriver: true,
            tension: 20,
            friction: 7
        }).start();
    };

    const resetForm = () => {
        setForm({
            name: '',
            price: '',
            category: 'Wash'
        });
        setPackageForm({
            package_name: '',
            rate: ''
        });
    };

    const handleAddItem = async () => {
        try {
            if (!form.name || !form.price) {
                Alert.alert('Error', 'Please fill all fields');
                return;
            }

            const itemsRef = collection(db, 'laundryItems');
            await addDoc(itemsRef, {
                name: form.name,
                price: Number(form.price),
                category: form.category
            });

            Alert.alert('Success', 'Item added successfully');
            resetForm();
            toggleAddForm();
            fetchItems();
        } catch (error) {
            console.error('Error adding item:', error);
            Alert.alert('Error', 'Failed to add item');
        }
    };

    const handleAddPackage = async () => {
        try {
            if (!packageForm.package_name || !packageForm.rate) {
                Alert.alert('Error', 'Please fill all fields');
                return;
            }

            const packagesRef = collection(db, 'packages');
            await addDoc(packagesRef, {
                package_name: packageForm.package_name,
                rate: Number(packageForm.rate)
            });

            Alert.alert('Success', 'Package added successfully');
            resetForm();
            toggleAddForm();
            fetchPackages();
        } catch (error) {
            console.error('Error adding package:', error);
            Alert.alert('Error', 'Failed to add package');
        }
    };

    const handleUpdateItem = async () => {
        try {
            if (!selectedItem) return;

            const itemRef = doc(db, 'laundryItems', selectedItem.id);
            await updateDoc(itemRef, {
                name: form.name,
                price: Number(form.price),
                category: form.category
            });

            Alert.alert('Success', 'Item updated successfully');
            setUpdateModalVisible(false);
            resetForm();
            fetchItems();
        } catch (error) {
            console.error('Error updating item:', error);
            Alert.alert('Error', 'Failed to update item');
        }
    };

    const handleUpdatePackage = async () => {
        try {
            if (!selectedPackage) return;

            const packageRef = doc(db, 'packages', selectedPackage.id);
            await updateDoc(packageRef, {
                package_name: packageForm.package_name,
                rate: Number(packageForm.rate)
            });

            Alert.alert('Success', 'Package updated successfully');
            setPackageUpdateModalVisible(false);
            resetForm();
            fetchPackages();
        } catch (error) {
            console.error('Error updating package:', error);
            Alert.alert('Error', 'Failed to update package');
        }
    };

    const handleDeleteItem = (item: any) => {
        Alert.alert(
            'Confirm Delete',
            `Are you sure you want to delete ${item.name}?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteDoc(doc(db, 'laundryItems', item.id));
                            Alert.alert('Success', 'Item deleted successfully');
                            fetchItems();
                        } catch (error) {
                            console.error('Error deleting item:', error);
                            Alert.alert('Error', 'Failed to delete item');
                        }
                    },
                },
            ]
        );
    };

    const handleDeletePackage = (pkg: PackageItem) => {
        Alert.alert(
            'Confirm Delete',
            `Are you sure you want to delete ${pkg.package_name}?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteDoc(doc(db, 'packages', pkg.id));
                            Alert.alert('Success', 'Package deleted successfully');
                            fetchPackages();
                        } catch (error) {
                            console.error('Error deleting package:', error);
                            Alert.alert('Error', 'Failed to delete package');
                        }
                    },
                },
            ]
        );
    };

    const openUpdateModal = (item: any) => {
        setSelectedItem(item);
        setForm({
            name: item.name,
            price: item.price.toString(),
            category: item.category
        });
        setUpdateModalVisible(true);
    };

    const openPackageUpdateModal = (pkg: PackageItem) => {
        setSelectedPackage(pkg);
        setPackageForm({
            package_name: pkg.package_name,
            rate: pkg.rate.toString()
        });
        setPackageUpdateModalVisible(true);
    };

    // Fixed filteredItems with better error handling
    const filteredItems = React.useMemo(() => {
        // Check if items exist and has the selected category
        if (!items || !items[selectedCategory]) {
            console.log('No items found for category:', selectedCategory);
            console.log('Available items:', items);
            return [];
        }

        const categoryItems = items[selectedCategory];

        if (!searchQuery.trim()) {
            return categoryItems;
        }

        return categoryItems.filter(item =>
            item.name && item.name.toLowerCase().includes(searchQuery.toLowerCase().trim())
        );
    }, [items, selectedCategory, searchQuery]);

    const filteredPackages = React.useMemo(() => {
        if (!searchQuery.trim()) {
            return packages;
        }
        return packages.filter(pkg =>
            pkg.package_name.toLowerCase().includes(searchQuery.toLowerCase().trim())
        );
    }, [packages, searchQuery]);

    // Handle tab switching with proper cleanup
    const handleTabSwitch = (tab: SettingsTab) => {
        setActiveTab(tab);
        setShowAddForm(false);
        slideAnim.setValue(0);
        setSearchQuery('');
        resetForm();
    };

    const renderItemsTab = () => (
        <>
            <Animated.View style={[
                styles.addFormContainer,
                {
                    transform: [{
                        translateY: slideAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [-300, 0]
                        })
                    }]
                }
            ]}>
                {showAddForm && (
                    <View style={styles.form}>
                        <TextInput
                            style={styles.input}
                            placeholder="Item Name"
                            value={form.name}
                            onChangeText={(text) => setForm({ ...form, name: text })}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Price"
                            value={form.price}
                            onChangeText={(text) => setForm({ ...form, price: text })}
                            keyboardType="numeric"
                        />
                        <View style={styles.categoryButtonsContainer}>
                            {categories.map((category) => (
                                <TouchableOpacity
                                    key={category}
                                    style={[
                                        styles.categoryButton,
                                        form.category === category && styles.selectedCategory,
                                    ]}
                                    onPress={() => setForm({ ...form, category })}
                                >
                                    <MaterialIcons
                                        name={
                                            category === 'Wash' ? 'wash' :
                                                category === 'WashAndIron' ? 'local-laundry-service' :
                                                    'dry-cleaning'
                                        }
                                        size={24}
                                        color={form.category === category ? '#fff' : '#4CAF50'}
                                    />
                                    <Text style={[
                                        styles.categoryText,
                                        form.category === category && styles.selectedCategoryText
                                    ]}>
                                        {category.replace(/([A-Z])/g, ' $1').trim()}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                        <TouchableOpacity
                            style={styles.submitButton}
                            onPress={handleAddItem}
                        >
                            <Text style={styles.submitButtonText}>Add Item</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </Animated.View>

            <View style={styles.categoryContainer}>
                {categories.map((category) => (
                    <TouchableOpacity
                        key={category}
                        style={[
                            styles.categoryTab,
                            selectedCategory === category && styles.selectedCategoryTab,
                        ]}
                        onPress={() => setSelectedCategory(category)}
                    >
                        <MaterialIcons
                            name={
                                category === 'Wash' ? 'wash' :
                                    category === 'WashAndIron' ? 'local-laundry-service' :
                                        'dry-cleaning'
                            }
                            size={24}
                            color={selectedCategory === category ? '#fff' : '#4CAF50'}
                        />
                        <Text style={[
                            styles.categoryTabText,
                            selectedCategory === category && styles.selectedCategoryTabText
                        ]}>
                            {category.replace(/([A-Z])/g, ' $1').trim()}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            <FlatList
                data={filteredItems}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.listContainer}
                renderItem={({ item }) => (
                    <View style={styles.itemContainer}>
                        <View style={styles.itemInfo}>
                            <Text style={styles.itemName}>{item.name}</Text>
                            <Text style={styles.itemPrice}>₹{item.price}</Text>
                        </View>
                        <View style={styles.itemActions}>
                            <TouchableOpacity
                                style={[styles.actionButton, styles.updateButton]}
                                onPress={() => openUpdateModal(item)}
                            >
                                <MaterialIcons name="edit" size={20} color="#fff" />
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.actionButton, styles.deleteButton]}
                                onPress={() => handleDeleteItem(item)}
                            >
                                <MaterialIcons name="delete" size={20} color="#fff" />
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <MaterialIcons name="list" size={64} color="#ccc" />
                        <Text style={styles.emptyText}>
                            No items found in {selectedCategory.replace(/([A-Z])/g, ' $1').trim()} category
                        </Text>
                        {!searchQuery && (
                            <Text style={styles.emptySubText}>
                                Add your first item using the button above
                            </Text>
                        )}
                    </View>
                }
            />
        </>
    );

    const renderPackagesTab = () => (
        <>
            <Animated.View style={[
                styles.addFormContainer,
                {
                    transform: [{
                        translateY: slideAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [-300, 0]
                        })
                    }]
                }
            ]}>
                {showAddForm && (
                    <View style={styles.form}>
                        <TextInput
                            style={styles.input}
                            placeholder="Package Name"
                            value={packageForm.package_name}
                            onChangeText={(text) => setPackageForm({ ...packageForm, package_name: text })}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Rate per KG"
                            value={packageForm.rate}
                            onChangeText={(text) => setPackageForm({ ...packageForm, rate: text })}
                            keyboardType="numeric"
                        />
                        <TouchableOpacity
                            style={styles.submitButton}
                            onPress={handleAddPackage}
                        >
                            <Text style={styles.submitButtonText}>Add Package</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </Animated.View>

            <FlatList
                data={filteredPackages}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.listContainer}
                renderItem={({ item }) => (
                    <View style={styles.packageContainer}>
                        <View style={styles.packageInfo}>
                            <Text style={styles.packageName}>{item.package_name}</Text>
                            <Text style={styles.packageRate}>₹{item.rate}/KG</Text>
                        </View>
                        <View style={styles.itemActions}>
                            <TouchableOpacity
                                style={[styles.actionButton, styles.updateButton]}
                                onPress={() => openPackageUpdateModal(item)}
                            >
                                <MaterialIcons name="edit" size={20} color="#fff" />
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.actionButton, styles.deleteButton]}
                                onPress={() => handleDeletePackage(item)}
                            >
                                <MaterialIcons name="delete" size={20} color="#fff" />
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <MaterialIcons name="inventory" size={64} color="#ccc" />
                        <Text style={styles.emptyText}>No packages found</Text>
                        {!searchQuery && (
                            <Text style={styles.emptySubText}>
                                Add your first package using the button above
                            </Text>
                        )}
                    </View>
                }
            />
        </>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}></Text>
                <TouchableOpacity
                    style={styles.addButton}
                    onPress={toggleAddForm}
                >
                    <MaterialIcons name={showAddForm ? "close" : "add"} size={24} color="#fff" />
                    <Text style={styles.addButtonText}>
                        {showAddForm ? 'Close' : `Add ${activeTab === 'items' ? 'Item' : 'Package'}`}
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Tab Selector */}
            <View style={styles.tabContainer}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'items' && styles.activeTab]}
                    onPress={() => handleTabSwitch('items')}
                >
                    <MaterialIcons name="list" size={24} color={activeTab === 'items' ? '#fff' : '#4CAF50'} />
                    <Text style={[styles.tabText, activeTab === 'items' && styles.activeTabText]}>
                        Items
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'packages' && styles.activeTab]}
                    onPress={() => handleTabSwitch('packages')}
                >
                    <MaterialIcons name="inventory" size={24} color={activeTab === 'packages' ? '#fff' : '#4CAF50'} />
                    <Text style={[styles.tabText, activeTab === 'packages' && styles.activeTabText]}>
                        Packages
                    </Text>
                </TouchableOpacity>
            </View>

            <View style={styles.searchBarContainer}>
                <MaterialIcons name="search" size={24} color="#666" style={styles.searchIcon} />
                <TextInput
                    style={styles.searchBar}
                    placeholder={`Search ${activeTab}...`}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    placeholderTextColor="#666"
                />
            </View>

            {activeTab === 'items' ? renderItemsTab() : renderPackagesTab()}

            {/* Item Update Modal */}
            <Modal
                visible={updateModalVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setUpdateModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Update Item</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Item Name"
                            value={form.name}
                            onChangeText={(text) => setForm({ ...form, name: text })}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Price"
                            value={form.price}
                            onChangeText={(text) => setForm({ ...form, price: text })}
                            keyboardType="numeric"
                        />
                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.cancelButton]}
                                onPress={() => setUpdateModalVisible(false)}
                            >
                                <Text style={styles.modalButtonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.saveButton]}
                                onPress={handleUpdateItem}
                            >
                                <Text style={styles.modalButtonText}>Update</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Package Update Modal */}
            <Modal
                visible={packageUpdateModalVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setPackageUpdateModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>"Update Package"</Text>
                            <TextInput
                            style={styles.input}
                            placeholder="Package Name"
                            value={packageForm.package_name}
                            onChangeText={(text) => setPackageForm({ ...packageForm, package_name: text })}
                            />
                            <TextInput
                            style={styles.input}
                              placeholder="Rate per KG"
                              value={packageForm.rate}
                              onChangeText={(text) => setPackageForm({ ...packageForm, rate: text })}
                              keyboardType="numeric"
                        />
                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.cancelButton]}
                                onPress={() => setPackageUpdateModalVisible(false)}
                            >
                                <Text style={styles.modalButtonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.saveButton]}
                                onPress={handleUpdatePackage}
                            >
                                <Text style={styles.modalButtonText}>Update</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#4CAF50',
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#4CAF50',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
    },
    addButtonText: {
        color: '#fff',
        marginLeft: 8,
        fontWeight: '500',
    },
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: '#f5f5f5',
        margin: 16,
        borderRadius: 12,
        padding: 4,
    },
    tab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
    },
    activeTab: {
        backgroundColor: '#4CAF50',
    },
    tabText: {
        marginLeft: 8,
        fontSize: 16,
        fontWeight: '500',
        color: '#4CAF50',
    },
    activeTabText: {
        color: '#fff',
    },
    addFormContainer: {
        backgroundColor: '#f5f5f5',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    form: {
        gap: 12,
    },
    input: {
        backgroundColor: '#fff',
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#ddd',
    },
    searchBarContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        margin: 16,
        paddingHorizontal: 16,
        backgroundColor: '#f5f5f5',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#eee',
    },
    searchIcon: {
        marginRight: 8,
    },
    searchBar: {
        flex: 1,
        height: 48,
        fontSize: 16,
        color: '#333',
    },
    categoryContainer: {
        flexDirection: 'row',
        paddingHorizontal: 12,
        marginBottom: 16,
    },
    categoryTab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 12,
        marginHorizontal: 4,
        borderRadius: 12,
        backgroundColor: '#f5f5f5',
        borderWidth: 1,
        borderColor: '#4CAF50',
    },
    selectedCategoryTab: {
        backgroundColor: '#4CAF50',
    },
    categoryTabText: {
        marginLeft: 8,
        fontSize: 14,
        color: '#4CAF50',
    },
    selectedCategoryTabText: {
        color: '#fff',
    },
    categoryButtonsContainer: {
        flexDirection: 'row',
        gap: 8,
    },
    categoryButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 12,
        borderRadius: 8,
        backgroundColor: '#f5f5f5',
        borderWidth: 1,
        borderColor: '#4CAF50',
    },
    selectedCategory: {
        backgroundColor: '#4CAF50',
    },
    categoryText: {
        marginLeft: 8,
        fontSize: 14,
        color: '#4CAF50',
    },
    selectedCategoryText: {
        color: '#fff',
    },
    submitButton: {
        backgroundColor: '#4CAF50',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    listContainer: {
        padding: 16,
        flexGrow: 1,
    },
    itemContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        marginBottom: 12,
        backgroundColor: '#fff',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#eee',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    packageContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        marginBottom: 12,
        backgroundColor: '#fff',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#eee',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    itemInfo: {
        flex: 1,
    },
    packageInfo: {
        flex: 1,
    },
    itemName: {
        fontSize: 16,
        fontWeight: '500',
        color: '#333',
        marginBottom: 4,
    },
    packageName: {
        fontSize: 16,
        fontWeight: '500',
        color: '#333',
        marginBottom: 4,
    },
    itemPrice: {
        fontSize: 16,
        color: '#4CAF50',
        fontWeight: 'bold',
    },
    packageRate: {
        fontSize: 16,
        color: '#4CAF50',
        fontWeight: 'bold',
    },
    itemActions: {
        flexDirection: 'row',
        gap: 8,
    },
    actionButton: {
        padding: 8,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    updateButton: {
        backgroundColor: '#4CAF50',
    },
    deleteButton: {
        backgroundColor: '#FF6B6B',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 50,
    },
    emptyText: {
        fontSize: 16,
        color: '#666',
        marginTop: 16,
        textAlign: 'center',
    },
    emptySubText: {
        fontSize: 14,
        color: '#999',
        marginTop: 8,
        textAlign: 'center',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 24,
        width: '80%',
        maxWidth: 400,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 16,
        color: '#333',
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: 16,
        gap: 12,
    },
    modalButton: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 8,
        minWidth: 80,
        alignItems: 'center',
    },
    cancelButton: {
        backgroundColor: '#a39b9b',
    },
    saveButton: {
        backgroundColor: '#4CAF50',
    },
    modalButtonText: {
        fontSize: 16,
        fontWeight: '500',
        color: '#fff',
    },
});