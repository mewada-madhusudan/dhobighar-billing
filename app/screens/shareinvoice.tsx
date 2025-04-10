import * as Print from 'expo-print';
import { Invoice } from "@/types";
import { LOGO_BASE64 } from '@/assets/logo';

const getCategoryDisplay = (category: string): string => {
    switch (category.toLowerCase()) {
        case 'DryCleaning':
            return 'DC';
        case 'WashAndIron':
            return 'W&I';
        case 'Wash':
            return 'Wash';
        default:
            return category;
    }
};

export const generateInvoicePDF = async (invoice: Invoice) => {
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
                    width: 230mm; /* A3 width */
                    min-height: 420mm; /* A3 height */
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
                    padding: 15px;
                    font-size: 16px;
                    border: 1px solid #4CAF50;
                }
                .sn-cell { width: 5%; }
                .particular-cell { width: 35%; }
                .type-cell { width: 10%; text-align: center; }
                .qty-cell { width: 10%; text-align: center; }
                .rate-cell { width: 15%; text-align: right; }
                .amt-cell { width: 15%; text-align: right; }
                .total-row {
                    background-color: #f0f9f0;
                    font-weight: bold;
                    color: #4CAF50;
                    font-size: 18px;
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
                    margin: 0;
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
                    ${invoice.items.map((item, index) => `
                        <tr>
                            <td class="sn-cell">${index + 1}</td>
                            <td class="particular-cell">${item.name}</td>
                            <td class="type-cell">${getCategoryDisplay(item.category)}</td>
                            <td class="qty-cell">${item.quantity}</td>
                            <td class="rate-cell">₹${item.price}</td>
                            <td class="amt-cell">₹${item.quantity * item.price}</td>
                        </tr>
                    `).join('')}
                    <tr class="total-row">
                        <td colspan="5" style="text-align: right;">Total</td>
                        <td class="amt-cell">₹${invoice.total}</td>
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