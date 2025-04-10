// services/offline-queue.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Network from 'expo-network';
import { Invoice } from "@/types";

interface QueueItem {
    id: string;
    type: 'invoice';
    data: Invoice;
    timestamp: number;
}

const QUEUE_STORAGE_KEY = 'offline_queue';
let isProcessing = false;

export const addToQueue = async (invoice: Invoice): Promise<void> => {
    try {
        const queueItem: QueueItem = {
            id: `queue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: 'invoice',
            data: invoice,
            timestamp: Date.now(),
        };

        // Get existing queue
        const existingQueue = await getQueue();
        existingQueue.push(queueItem);

        // Save updated queue
        await AsyncStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(existingQueue));
    } catch (error) {
        console.error('Error adding to queue:', error);
        throw error;
    }
};

export const getQueue = async (): Promise<QueueItem[]> => {
    try {
        const queue = await AsyncStorage.getItem(QUEUE_STORAGE_KEY);
        return queue ? JSON.parse(queue) : [];
    } catch (error) {
        console.error('Error getting queue:', error);
        return [];
    }
};

export const removeFromQueue = async (itemId: string): Promise<void> => {
    try {
        const queue = await getQueue();
        const updatedQueue = queue.filter(item => item.id !== itemId);
        await AsyncStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(updatedQueue));
    } catch (error) {
        console.error('Error removing from queue:', error);
    }
};

export const processQueue = async (): Promise<void> => {
    if (isProcessing) return;

    isProcessing = true;
    try {
        const networkState = await Network.getNetworkStateAsync();
        if (!networkState.isConnected) {
            isProcessing = false;
            return;
        }

        const queue = await getQueue();
        if (queue.length === 0) {
            isProcessing = false;
            return;
        }

        for (const item of queue) {
            try {
                if (item.type === 'invoice') {
                    const { saveInvoice } = await import('@/firebase/services');
                    await saveInvoice(item.data);
                    await removeFromQueue(item.id);
                }
            } catch (error) {
                console.error(`Error processing queue item ${item.id}:`, error);
            }
        }
    } finally {
        isProcessing = false;
    }
};

export const setupOfflineSync = () => {
    // Initial queue process
    processQueue();

    // Set up periodic check for network and queue processing
    setInterval(async () => {
        const networkState = await Network.getNetworkStateAsync();
        if (networkState.isConnected) {
            processQueue();
        }
    }, 30000); // Check every 30 seconds
};
