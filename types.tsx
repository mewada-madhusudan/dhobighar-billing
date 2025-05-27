// export interface LaundryItem {
//     id: string;
//     name: string;
//     price: number;
// }

export type Category = 'Wash' | 'WashAndIron' | 'DryCleaning' | 'Package';

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

// Package-related interfaces
export interface PackageItem {
    item: string;
    quantity: number;
}

export interface PackageInfo {
    packageName: string;
    weight: number;
    rate: number;
    total: number;
    items: PackageItem[];
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
    // Optional package information for package-based invoices
    packageInfo?: PackageInfo;
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