// firebase/services.ts
import { collection, addDoc, getDocs, query, orderBy, getDoc, doc, setDoc } from 'firebase/firestore';
import { db } from './config';
import { Invoice } from '@/types';
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Network from 'expo-network';
import { addToQueue } from '@/app/services/offline-queue';

interface LaundryItem {
    id: string;
    name: string;
    price: number;
    category: string;
}

export const fetchLaundryItems = async (): Promise<{ [key: string]: LaundryItem[] }> => {
    const itemsRef = collection(db, 'laundryItems');
    const snapshot = await getDocs(itemsRef);

    return snapshot.docs.reduce((acc, doc) => {
        const item = doc.data() as LaundryItem;
        // console.log(item)
        if (!acc[item.category]) {
            acc[item.category] = [];
        }
        acc[item.category].push({ ...item, id: doc.id });
        return acc;
    }, {} as { [key: string]: LaundryItem[] });
};

export const saveInvoice = async (invoice: Invoice): Promise<string> => {
    try {
        const networkState = await Network.getNetworkStateAsync();

        if (!networkState.isConnected) {
            // Store in offline queue
            await addToQueue(invoice);

            // Store locally for immediate use
            const localInvoices = await AsyncStorage.getItem('local_invoices');
            const invoices = localInvoices ? JSON.parse(localInvoices) : [];
            invoices.unshift(invoice);
            await AsyncStorage.setItem('local_invoices', JSON.stringify(invoices));

            return invoice.id;
        }

        const counterDoc = doc(db, 'counters', 'invoiceId');
        const counterSnapshot = await getDoc(counterDoc);

        let nextNumber = 1;
        if (counterSnapshot.exists()) {
            nextNumber = (counterSnapshot.data().value || 0) + 1;
        }

        const invoiceId = `MA${nextNumber.toString().padStart(6, '0')}`;
        invoice.id = invoiceId;

        await setDoc(doc(db, 'invoices', invoiceId), invoice);
        await setDoc(counterDoc, { value: nextNumber });

        // Update local cache
        const localInvoices = await AsyncStorage.getItem('local_invoices');
        const invoices = localInvoices ? JSON.parse(localInvoices) : [];
        invoices.unshift(invoice);
        await AsyncStorage.setItem('local_invoices', JSON.stringify(invoices));

        return invoiceId;
    } catch (error) {
        console.error('Error saving invoice:', error);
        throw error;
    }
};


export const getInvoices = async (): Promise<Invoice[]> => {
    try {
        // First try to get local invoices
        const localInvoices = await AsyncStorage.getItem('local_invoices');
        const localData = localInvoices ? JSON.parse(localInvoices) : [];

        const networkState = await Network.getNetworkStateAsync();
        if (!networkState.isConnected) {
            return localData;
        }

        // If online, fetch from Firebase and update local cache
        const invoicesRef = collection(db, 'invoices');
        const q = query(invoicesRef, orderBy('date', 'desc'));
        const snapshot = await getDocs(q);
        const firebaseData = snapshot.docs.map(doc => doc.data() as Invoice);

        // Update local cache
        await AsyncStorage.setItem('local_invoices', JSON.stringify(firebaseData));

        return firebaseData;
    } catch (error) {
        console.error('Error fetching invoices:', error);
        // Return local data if available, empty array otherwise
        const localInvoices = await AsyncStorage.getItem('local_invoices');
        return localInvoices ? JSON.parse(localInvoices) : [];
    }
};

export const getNextInvoiceId = async (): Promise<string> => {
    try {
        const lastId = await AsyncStorage.getItem('lastInvoiceId');
        const nextNumber = lastId ? parseInt(lastId.slice(2)) + 1 : 1;
        const paddedNumber = nextNumber.toString().padStart(6, '0');
        const newId = `MA${paddedNumber}`;
        await AsyncStorage.setItem('lastInvoiceId', newId);
        return newId;
    } catch (error) {
        console.error('Error generating invoice ID:', error);
        return `MA${Date.now()}`;
    }
};