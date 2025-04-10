export interface LaundryItem {
    id: string;
    name: string;
    price: number;
}

export type Category = 'Wash' | 'WashAndIron' | 'DryCleaning';

export interface LaundryItem {
    id: string;
    name: string;
    price: number;
    category: 'Wash' | 'WashAndIron' | 'DryCleaning';
}

export interface InvoiceItem extends Omit<LaundryItem, 'category'> {
    quantity: number;
    category: string;
}

export interface Invoice {
    id: string;
    customerName: string;
    address?: string;
    date: string;
    items: {
        name: string;
        category: string;
        quantity: number;
        price: number;
    }[];
    total: number;
    phone: string;
}

// types/index.ts
export interface User {
    id: string;
    email: string;
    isAdmin: boolean;
    isApproved: boolean;
    createdAt: Date;
    displayName?: string;
}