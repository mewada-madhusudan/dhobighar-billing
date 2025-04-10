import React, { useEffect, useState, useMemo } from 'react';
import {
    View,
    TextInput,
    FlatList,
    Text,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    SafeAreaView,
    Image,
    Dimensions,
    Modal,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import type { Category } from '@/types';
import { useItems } from "@/stores/useItems";

const windowWidth = Dimensions.get('window').width;

export default function NewBillScreen() {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<Category>('Wash');
    const { items, loading, error, fetchItems } = useItems();
    const [cart, setCart] = useState<Record<string, { quantity: number; price: number }>>({});
    const [editingItem, setEditingItem] = useState<string | null>(null);
    const [editPrice, setEditPrice] = useState('');

    useEffect(() => {
        fetchItems();
    }, []);

    const filteredItems = useMemo(() => {
        const categoryItems = items[selectedCategory] || [];
        if (!searchQuery.trim()) {
            return categoryItems;
        }

        return categoryItems.filter(item =>
            item.name.toLowerCase().includes(searchQuery.toLowerCase().trim())
        );
    }, [items, selectedCategory, searchQuery]);

    const navigateToCustomerDetails = () => {
        const cartData = Object.entries(cart).reduce((acc, [itemId, data]) => {
            acc[itemId] = data.quantity;
            return acc;
        }, {} as Record<string, number>);

        router.push({
            pathname: '/screens/customerdetails',
            params: {
                cart: JSON.stringify(cartData),
                prices: JSON.stringify(Object.entries(cart).reduce((acc, [itemId, data]) => {
                    acc[itemId] = data.price;
                    return acc;
                }, {} as Record<string, number>))
            }
        });
    };

    const updateQuantity = (itemId: string, increment: boolean) => {
        setCart(prevCart => {
            const currentItem = prevCart[itemId] || {
                quantity: 0,
                price: filteredItems.find(item => item.id === itemId)?.price || 0
            };

            const newQuantity = Math.max(0, currentItem.quantity + (increment ? 1 : -1));

            if (newQuantity === 0) {
                const { [itemId]: _, ...rest } = prevCart;
                return rest;
            }

            return {
                ...prevCart,
                [itemId]: {
                    ...currentItem,
                    quantity: newQuantity,
                }
            };
        });
    };

    const handlePriceEdit = (itemId: string) => {
        const item = filteredItems.find(item => item.id === itemId);
        if (item) {
            setEditingItem(itemId);
            setEditPrice(String(cart[itemId]?.price || item.price));
        }
    };

    const savePriceEdit = () => {
        if (editingItem && editPrice) {
            const newPrice = parseFloat(editPrice);
            if (!isNaN(newPrice) && newPrice >= 0) {
                setCart(prevCart => ({
                    ...prevCart,
                    [editingItem]: {
                        quantity: prevCart[editingItem]?.quantity || 1,
                        price: newPrice,
                    }
                }));
            }
        }
        setEditingItem(null);
        setEditPrice('');
    };

    const getTotalAmount = (): number => {
        return Object.entries(cart).reduce((total, [itemId, data]) => {
            return total + data.price * data.quantity;
        }, 0);
    };

    const getTotalItems = (): number => {
        return Object.values(cart).reduce((total, data) => total + data.quantity, 0);
    };

    const categories: Category[] = ['Wash', 'WashAndIron', 'DryCleaning'];

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#4CAF50" />
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.errorContainer}>
                <MaterialIcons name="error-outline" size={48} color="#FF6B6B" />
                <Text style={styles.errorText}>Error loading items: {error}</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Image
                    source={require('@/assets/dhobighar-logo.png')}
                    style={styles.logo}
                />
                <Text style={styles.headerTitle}>New Invoice</Text>
            </View>

            <View style={styles.searchBarContainer}>
                <MaterialIcons name="search" size={24} color="#666" style={styles.searchIcon} />
                <TextInput
                    style={styles.searchBar}
                    placeholder="Search items..."
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    placeholderTextColor="#666"
                />
            </View>

            <View style={styles.categoryContainer}>
                {categories.map((category) => (
                    <TouchableOpacity
                        key={category}
                        style={[
                            styles.categoryButton,
                            selectedCategory === category && styles.selectedCategory,
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
                            styles.categoryText,
                            selectedCategory === category && styles.selectedCategoryText
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
                            <TouchableOpacity
                                onPress={() => handlePriceEdit(item.id)}
                                style={styles.priceContainer}
                            >
                                <Text style={styles.itemPrice}>
                                    ₹{cart[item.id]?.price || item.price}
                                </Text>
                                <MaterialIcons name="edit" size={16} color="#4CAF50" style={styles.editIcon} />
                            </TouchableOpacity>
                        </View>
                        <View style={styles.quantityContainer}>
                            <TouchableOpacity
                                style={[
                                    styles.quantityButton,
                                    !cart[item.id]?.quantity && styles.quantityButtonDisabled
                                ]}
                                onPress={() => updateQuantity(item.id, false)}
                                disabled={!cart[item.id]?.quantity}
                            >
                                <MaterialIcons name="remove" size={24} color={cart[item.id]?.quantity ? "#FF6B6B" : "#ccc"} />
                            </TouchableOpacity>
                            <Text style={styles.quantityText}>{cart[item.id]?.quantity || 0}</Text>
                            <TouchableOpacity
                                style={styles.quantityButton}
                                onPress={() => updateQuantity(item.id, true)}
                            >
                                <MaterialIcons name="add" size={24} color="#4CAF50" />
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
            />

            <Modal
                visible={editingItem !== null}
                transparent
                animationType="fade"
                onRequestClose={() => setEditingItem(null)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Edit Price</Text>
                        <TextInput
                            style={styles.priceInput}
                            value={editPrice}
                            onChangeText={setEditPrice}
                            keyboardType="numeric"
                            placeholder="Enter new price"
                            autoFocus
                        />
                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.cancelButton]}
                                onPress={() => setEditingItem(null)}
                            >
                                <Text style={styles.modalButtonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.saveButton]}
                                onPress={savePriceEdit}
                            >
                                <Text style={styles.modalButtonText}>Save</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {Object.values(cart).some(data => data.quantity > 0) && (
                <TouchableOpacity
                    style={styles.nextButton}
                    onPress={navigateToCustomerDetails}
                >
                    <View style={styles.nextButtonContent}>
                        <View style={styles.totalInfo}>
                            <Text style={styles.totalItems}>{getTotalItems()} items</Text>
                            <Text style={styles.totalAmount}>₹{getTotalAmount()}</Text>
                        </View>
                        <View style={styles.nextButtonRight}>
                            <Text style={styles.nextButtonText}>Next</Text>
                            <MaterialIcons name="arrow-forward" size={24} color="#fff" />
                        </View>
                    </View>
                </TouchableOpacity>
            )}
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
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    logo: {
        width: 40,
        height: 40,
        marginRight: 12,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#4CAF50',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    errorText: {
        marginTop: 12,
        color: '#FF6B6B',
        textAlign: 'center',
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
    categoryButton: {
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
    listContainer: {
        padding: 16,
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
    itemInfo: {
        flex: 1,
    },
    itemName: {
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
    quantityContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
        borderRadius: 8,
        padding: 4,
    },
    quantityButton: {
        padding: 8,
        borderRadius: 6,
        backgroundColor: '#fff',
    },
    quantityButtonDisabled: {
        opacity: 0.5,
    },
    quantityText: {
        marginHorizontal: 16,
        fontSize: 16,
        fontWeight: 'bold',
        minWidth: 24,
        textAlign: 'center',
    },
    nextButton: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#4CAF50',
        padding: 16,
        margin: 16,
        borderRadius: 12,
    },
    nextButtonContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    totalInfo: {
        flex: 1,
    },
    totalItems: {
        color: '#fff',
        opacity: 0.9,
        fontSize: 14,
    },
    totalAmount: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold',
    },
    nextButtonRight: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    nextButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        marginRight: 8,
    },
    priceContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    editIcon: {
        marginLeft: 8,
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
    priceInput: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        marginBottom: 16,
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
    },
    modalButton: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 8,
        marginLeft: 12,
    },
    cancelButton: {
        backgroundColor: '#f5f5f5',
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