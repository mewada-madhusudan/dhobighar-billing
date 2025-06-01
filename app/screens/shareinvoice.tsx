import * as Print from 'expo-print';
import { Invoice } from "@/types";
import { LOGO_BASE64 } from '@/assets/logo';

const getCategoryDisplay = (category: string): string => {
    switch (category.toLowerCase()) {
        case 'drycleaning':
            return 'DC';
        case 'washandiron':
            return 'W&I';
        case 'wash':
            return 'WASH';
        case 'package':
            return 'PKG';
        case 'package items':
            return 'INC';
        default:
            if (category.startsWith('Package ') && category.includes(' Items')) {
                return 'INC';
            }
            if (category.startsWith('Package ')) {
                return 'PKG';
            }
            return category;
    }
};

export const generateInvoicePDF = async (invoice: Invoice) => {
    // Check if this is a package-based invoice
    const isPackageInvoice = invoice.packageInfo || invoice.items.some(item =>
        item.category === 'Package' || item.category.startsWith('Package ')
    );

    let itemsTableContent = '';
    let packageSummaryContent = '';

    if (isPackageInvoice && invoice.packageInfo) {
        // Handle multiple packages
        if ("packages" in invoice.packageInfo && invoice.packageInfo.packages && Array.isArray(invoice.packageInfo.packages)) {
            const totalWeight = invoice.packageInfo.packages.reduce((sum: number, pkg: any) => sum + (pkg?.weight || 0), 0);
            const totalItems = invoice.packageInfo.packages.reduce((sum: number, pkg: any) => {
                return sum + (pkg?.items?.length || 0);
            }, 0);

            // Generate package summary for multiple packages
            packageSummaryContent = `
                <div class="package-summary">
                    <div class="package-title">📦 Multiple Packages Details</div>
                    <div class="package-detail"><strong>Total Packages:</strong> ${invoice.packageInfo.packages.length}</div>
                    <div class="package-detail"><strong>Total Weight:</strong> ${totalWeight} KG</div>
                    <div class="package-detail"><strong>Total Items:</strong> ${totalItems} items</div>
                    
                    ${invoice.packageInfo.packages.map((pkg: any, index: number) => `
                        <div class="individual-package">
                            <div class="individual-package-title">Package ${index + 1}: ${pkg?.packageName || 'Unknown Package'}</div>
                            <div class="individual-package-details">${pkg?.weight || 0} KG × ₹${pkg?.rate || 0}/KG = ₹${(pkg?.total || 0).toFixed(2)}</div>
                            <div class="individual-package-items">Items: ${pkg?.items?.map((item: any) => item?.item || 'Unknown Item').join(', ') || 'No items'}</div>
                        </div>
                    `).join('')}
                </div>
            `;

            // Generate table rows for multiple packages
            let packageNumber = 1;
            invoice.packageInfo.packages.forEach((pkg: any, pkgIndex: number) => {
                // Main package row
                itemsTableContent += `
                    <tr>
                        <td class="sn-cell">${packageNumber++}</td>
                        <td class="particular-cell">${pkg?.packageName || 'Unknown Package'} (${pkg?.weight || 0} KG)</td>
                        <td class="type-cell">PKG</td>
                        <td class="qty-cell">${pkg?.weight || 0}</td>
                        <td class="rate-cell">₹${pkg?.rate || 0}</td>
                        <td class="amt-cell">₹${(pkg?.total || 0).toFixed(2)}</td>
                    </tr>
                `;

                // Individual items as included (no numbering)
                if (pkg?.items && Array.isArray(pkg.items)) {
                    pkg.items.forEach((item: any, itemIndex: number) => {
                        itemsTableContent += `
                            <tr style="background-color: #f8f9fa;">
                                <td class="sn-cell">-</td>
                                <td class="particular-cell included-item">├─ ${item?.item || 'Unknown Item'} (Included)</td>
                                <td class="type-cell">INC</td>
                                <td class="qty-cell">${item?.quantity || 0}</td>
                                <td class="rate-cell">₹0</td>
                                <td class="amt-cell">₹0</td>
                            </tr>
                        `;
                    });
                }
            });
        }
        // Handle single package (backward compatibility)
        else if ("packageName" in invoice.packageInfo && invoice.packageInfo.packageName) {
            // Generate package summary for single package
            packageSummaryContent = `
                <div class="package-summary">
                    <div class="package-title">📦 Package Details</div>
                    <div class="package-detail"><strong>Package:</strong> ${invoice.packageInfo.packageName}</div>
                    <div class="package-detail"><strong>Weight:</strong> ${invoice.packageInfo.weight || 0} KG</div>
                    <div class="package-detail"><strong>Rate:</strong> ₹${invoice.packageInfo.rate || 0}/KG</div>
                    <div class="package-detail"><strong>Items Included:</strong> ${invoice.packageInfo.items?.length || 0} items</div>
                </div>
            `;

            // Main package row
            itemsTableContent += `
                <tr>
                    <td class="sn-cell">1</td>
                    <td class="particular-cell">${invoice.packageInfo.packageName} (${invoice.packageInfo.weight || 0} KG)</td>
                    <td class="type-cell">PKG</td>
                    <td class="qty-cell">${invoice.packageInfo.weight || 0}</td>
                    <td class="rate-cell">₹${invoice.packageInfo.rate || 0}</td>
                    <td class="amt-cell">₹${invoice.packageInfo.total || 0}</td>
                </tr>
            `;

            // Individual items as included (no numbering)
            if (invoice.packageInfo.items && Array.isArray(invoice.packageInfo.items)) {
                invoice.packageInfo.items.forEach((item: any, index: number) => {
                    itemsTableContent += `
                        <tr style="background-color: #f8f9fa;">
                            <td class="sn-cell">-</td>
                            <td class="particular-cell included-item">├─ ${item?.item || 'Unknown Item'} (Included)</td>
                            <td class="type-cell">INC</td>
                            <td class="qty-cell">${item?.quantity || 0}</td>
                            <td class="rate-cell">₹0</td>
                            <td class="amt-cell">₹0</td>
                        </tr>
                    `;
                });
            }
        }
    } else {
        // Regular invoice - show all items normally
        itemsTableContent = invoice.items.map((item, index) => `
            <tr>
                <td class="sn-cell">${index + 1}</td>
                <td class="particular-cell">${item.name}</td>
                <td class="type-cell">${getCategoryDisplay(item.category)}</td>
                <td class="qty-cell">${item.quantity}</td>
                <td class="rate-cell">₹${item.price}</td>
                <td class="amt-cell">₹${(item.quantity * item.price).toFixed(2)}</td>
            </tr>
        `).join('');
    }

    const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                @page {
                    size: A4;
                    margin: 0;
                }
                body {
                    font-family: Arial, sans-serif;
                    padding: 40px;
                    margin: 0;
                    color: #333;
                    width: 210mm;
                    min-height: 297mm;
                    box-sizing: border-box;
                }
                .header-container {
                    display: flex;
                    align-items: center;
                    margin-bottom: 30px;
                    padding-top: 20px;
                }
                .logo {
                    width: 100px;
                    height: 100px;
                }
                .header-text {
                    flex: 1;
                    text-align: center;
                }
                .title {
                    font-size: 48px;
                    font-weight: bold;
                    color: #000;
                    letter-spacing: 3px;
                    margin: 0;
                }
                .subtitle-container {
                    background-color: #4CAF50;
                    padding: 4px 20px;
                    border-radius: 6px;
                    margin-top: 10px;
                    display: inline-block;
                }
                .subtitle {
                    color: #fff;
                    font-size: 20px;
                    font-weight: 500;
                    margin: 0;
                }
                .details-container {
                    border: 2px solid #4CAF50;
                    padding: 20px;
                    margin-bottom: 30px;
                    font-size: 16px;
                }
                .detail-row {
                    display: flex;
                    margin-bottom: 10px;
                }
                .detail-label {
                    width: 100px;
                    font-weight: 500;
                    color: #4CAF50;
                }
                .date-container {
                    text-align: right;
                    margin-top: 10px;
                }
                .table {
                    width: 100%;
                    border: 2px solid #4CAF50;
                    border-collapse: collapse;
                    margin-bottom: 30px;
                }
                .table-header {
                    background-color: #4CAF50;
                    color: #fff;
                    font-weight: 500;
                }
                .table th, .table td {
                    padding: 12px;
                    font-size: 14px;
                    border: 1px solid #4CAF50;
                    text-align: left;
                }
                .sn-cell { width: 8%; text-align: center; }
                .particular-cell { width: 40%; }
                .type-cell { width: 10%; text-align: center; }
                .qty-cell { width: 10%; text-align: center; }
                .rate-cell { width: 12%; text-align: right; }
                .amt-cell { width: 15%; text-align: right; }
                .included-item {
                    color: #666;
                    font-style: italic;
                }
                .total-row {
                    background-color: #f0f9f0;
                    font-weight: bold;
                    color: #4CAF50;
                    font-size: 16px;
                }
                .package-summary {
                    background-color: #e8f5e8;
                    padding: 20px;
                    margin-bottom: 25px;
                    border-radius: 8px;
                    border: 2px solid #4CAF50;
                }
                .package-title {
                    font-size: 20px;
                    font-weight: bold;
                    color: #4CAF50;
                    margin-bottom: 15px;
                }
                .package-detail {
                    margin-bottom: 8px;
                    font-size: 16px;
                    color: #2e7d32;
                }
                .individual-package {
                    background-color: #f1f8e9;
                    padding: 15px;
                    border-radius: 6px;
                    margin-top: 15px;
                    border: 1px solid #c8e6c9;
                }
                .individual-package-title {
                    font-size: 16px;
                    font-weight: bold;
                    color: #2e7d32;
                    margin-bottom: 8px;
                }
                .individual-package-details {
                    font-size: 14px;
                    color: #388e3c;
                    margin-bottom: 8px;
                }
                .individual-package-items {
                    font-size: 13px;
                    color: #4caf50;
                    font-style: italic;
                }
                .locations-container {
                    margin-top: 40px;
                }
                .locations-title {
                    color: #4CAF50;
                    font-weight: 500;
                    margin-bottom: 10px;
                    font-size: 18px;
                }
                .location-text {
                    font-size: 16px;
                    margin-bottom: 5px;
                    color: #666;
                }
                .contact-container {
                    margin-top: 20px;
                    color: #666;
                    font-size: 16px;
                }
                .note-container {
                    margin-top: 30px;
                    padding: 20px;
                    background-color: #fff9c4;
                    border-radius: 6px;
                }
                .note-text {
                    font-size: 16px;
                    color: #f57c00;
                    margin: 5px 0;
                }
            </style>
        </head>
        <body>
            <div class="header-container">
                <img src="data:image/png;base64,${LOGO_BASE64}" class="logo" alt="Dhobighar Logo">
                <div class="header-text">
                    <h1 class="title">DHOBIGHAR</h1>
                    <div class="subtitle-container">
                        <p class="subtitle">LAUNDRY & DRY CLEANING</p>
                    </div>
                </div>
            </div>

            <div class="details-container">
                <div class="detail-row">
                    <span class="detail-label">Invoice:</span>
                    <span>${invoice.id}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">To:</span>
                    <span>${invoice.customerName}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Add:</span>
                    <span>${invoice.address || ''}</span>
                </div>
                <div class="date-container">
                    <span class="detail-label">Date:</span>
                    <span>${new Date(invoice.date).toLocaleDateString()}</span>
                </div>
            </div>

            ${packageSummaryContent}

            <table class="table">
                <thead class="table-header">
                    <tr>
                        <th class="sn-cell">S.N</th>
                        <th class="particular-cell">Particulars</th>
                        <th class="type-cell">Type</th>
                        <th class="qty-cell">Qty</th>
                        <th class="rate-cell">Rate</th>
                        <th class="amt-cell">Amt</th>
                    </tr>
                </thead>
                <tbody>
                    ${itemsTableContent}
                    <tr class="total-row">
                        <td colspan="5" style="text-align: right; font-weight: bold;">Total</td>
                        <td class="amt-cell" style="font-weight: bold;">₹${invoice.total.toFixed(2)}</td>
                    </tr>
                </tbody>
            </table>

            <div class="locations-container">
                <div class="locations-title">Our Locations:</div>
                <div class="location-text">LIG-95, Khusilal Road, Nehur Nagar, Bhopal</div>
                <div class="location-text">UG-09 Kolar Plaza, Bhopal</div>
                <div class="location-text">H-132, Rajharsh Colony, Nayapura, Kolar road, Bhopal</div>
            </div>

            <div class="contact-container">
                📞 7222981927, 8989706473
            </div>

            <div class="note-container">
                <p class="note-text">Note: Shop stays closed on Thursday and all services remains unavailable</p>
                <p class="note-text">Service Duration: 2 Days (Excluding Pickup and Delivery)</p>
            </div>
        </body>
        </html>
    `;

    try {
        const { uri } = await Print.printToFileAsync({
            html: htmlContent,
            base64: true
        });
        return uri;
    } catch (error) {
        console.error('Error generating PDF:', error);
        throw error;
    }
};