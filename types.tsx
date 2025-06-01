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

// Single package info (backward compatibility)
export interface PackageInfo {
    packageName: string;
    weight: number;
    rate: number;
    total: number;
    items: PackageItem[];
}

// Multiple packages support
export interface PackageEntry {
    packageId: string;
    packageName: string;
    rate: number;
    weight: number;
    total: number;
    items: PackageItem[];
}

export interface MultiplePackageInfo {
    packages: PackageEntry[];
    grandTotal: number;
}

// Updated Invoice interface to support both single and multiple packages
export interface Invoice {
    id: string;
    customerName: string;
    address?: string;
    date: string;
    items: {
        id?: string;
        name: string;
        category: string;
        quantity: number;
        price: number;
    }[];
    total: number;
    phone: string;
    // Optional package information for package-based invoices
    // Can be either single package (backward compatibility) or multiple packages
    packageInfo?: PackageInfo | MultiplePackageInfo;
}

// Type guard to check if packageInfo contains multiple packages
export function isMultiplePackageInfo(packageInfo: PackageInfo | MultiplePackageInfo): packageInfo is MultiplePackageInfo {
    return 'packages' in packageInfo && Array.isArray(packageInfo.packages);
}

// Firebase package item interface (from your payPerkg.tsx)
export interface FirebasePackageItem {
    id: string;
    package_name: string;
    rate: number;
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