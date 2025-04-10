// stores/useItems.ts
import { create } from 'zustand';
import { fetchLaundryItems } from '@/firebase/services';

interface ItemsStore {
    items: { [key: string]: any[] };
    loading: boolean;
    error: string | null;
    fetchItems: () => Promise<void>;
}

export const useItems = create<ItemsStore>((set) => ({
    items: {},
    loading: false,
    error: null,
    fetchItems: async () => {
        set({ loading: true, error: null });
        try {
            const items = await fetchLaundryItems();
            set({ items, loading: false });
        } catch (error) {
            set({ error: (error as Error).message, loading: false });
        }
    },
}));