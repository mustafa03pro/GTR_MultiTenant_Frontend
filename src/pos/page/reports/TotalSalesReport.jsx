import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Loader, Printer, FileText, Download } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

const TotalSalesReport = () => {
    const [loading, setLoading] = useState(false);
    const [stores, setStores] = useState([]);
    
    // Filters
    const [selectedStore, setSelectedStore] = useState('');
    const [fromDate, setFromDate] = useState(new Date().toISOString().split('T')[0]);
    const [toDate, setToDate] = useState(new Date().toISOString().split('T')[0]);

    const [data, setData] = useState([]);
    const componentRef = useRef();

    useEffect(() => {
        fetchStores();
    }, []);

    const fetchStores = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}/pos/stores`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            setStores(response.data);
            // Optional: Select first store by default or leave as 'All'
            // if (response.data.length > 0) setSelectedStore(response.data[0].id);
        } catch (error) {
            console.error("Error fetching stores:", error);
        }
    };

    const handleSearch = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}/pos/reports/total-sales-report`, {
                headers: { "Authorization": `Bearer ${token}` },
                params: {
                    fromDate,
                    toDate,
                    storeId: selectedStore || null
                }
            });
            setData(response.data);
        } catch (error) {
            console.error("Error fetching total sales report:", error);
            setData([]);
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const handleExportCSV = () => {
        if (!data || data.length === 0) return;

        const headers = [
            'Ref', 'Order Type', 'Location', 'Customer', 'Debtor', 
            'Sales Source', 'Sales Source Reference', 'Order Date', 'Order Time',
            'Sub Total', 'Discount', 'VAT', 'Shipping Charge', 'Order Total',
            'Customer Paid Amount', 'Returned Amount', 'Payment Method', 'Settlement Time'
        ];

        const csvRows = [
            headers.join(','),
            ...data.map(item => [
                item.ref,
                item.orderType,
                item.location,
                `"${item.customer}"`,
                `"${item.debtor || ''}"`,
                item.salesSource,
                item.salesSourceReference,
                item.orderDate,
                item.orderTime,
                item.subTotal,
                item.discount,
                item.vat,
                item.shippingCharge,
                item.orderTotal,
                item.customerPaidAmount,
                item.returnedAmount,
                `"${item.paymentMethod}"`,
                item.settlementTime
            ].join(','))
        ];

        const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Total_Sales_Report_${fromDate}_to_${toDate}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    };

    return (
        <div className="p-6 bg-slate-50 min-h-screen font-sans text-slate-800">
            <h1 className="text-2xl font-bold mb-6 text-slate-800">total sales report</h1>

            {/* Filters */}
            <div className="bg-white p-6 rounded-lg shadow mb-6 border border-slate-200">
                <h2 className="text-blue-900 font-bold mb-4 text-sm">Total Sales Report</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 items-end">
                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Company:</label>
                        <select className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500 bg-slate-100" disabled>
                            <option>All</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Company Branch:</label>
                        <select 
                            className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                            value={selectedStore}
                            onChange={(e) => setSelectedStore(e.target.value)}
                        >
                            <option value="">All Branches</option>
                            {stores.map(store => (
                                <option key={store.id} value={store.id}>{store.name}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">From</label>
                        <input 
                            type="date"
                            className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                            value={fromDate}
                            onChange={(e) => setFromDate(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">To</label>
                        <input 
                            type="date"
                            className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                            value={toDate}
                            onChange={(e) => setToDate(e.target.value)}
                        />
                    </div>

                    <div>
                        <button 
                            onClick={handleSearch}
                            disabled={loading}
                            className="bg-blue-900 text-white px-6 py-2 rounded text-sm font-semibold hover:bg-blue-800 transition disabled:opacity-50 w-full md:w-auto"
                        >
                            {loading ? <Loader className="animate-spin inline mr-1" size={16} /> : 'Show'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Results Header & Actions */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-4">
                <h3 className="text-blue-900 font-bold text-sm mb-2 md:mb-0">
                    Total Sales Report {selectedStore ? 'Selected Branch' : 'All Branches'} from {fromDate} to {toDate}
                </h3>
                <div className="flex gap-2">
                    <button onClick={handlePrint} className="bg-blue-900 text-white p-2 rounded hover:bg-blue-800 transition" title="Print">
                        <Printer size={18} />
                    </button>
                    <button onClick={handleExportCSV} className="bg-blue-900 text-white p-2 rounded hover:bg-blue-800 transition" title="Export CSV">
                        <FileText size={18} />
                    </button>
                    {/* Placeholder for PDF if needed usually implemented via print to pdf or backend generation */}
                    <button className="bg-blue-900 text-white p-2 rounded hover:bg-blue-800 transition" title="Export PDF">
                         <Download size={18} />
                    </button>
                </div>
            </div>

            {/* Results Table */}
            <div className="bg-white rounded-lg shadow border border-slate-200 overflow-x-auto" ref={componentRef}>
                <style>
                    {`
                        @media print {
                            body { margin: 0; padding: 20px; font-size: 10px; }
                            table { width: 100%; border-collapse: collapse; }
                            th, td { border: 1px solid #ddd; padding: 4px; }
                            th { background-color: #1e3a8a !important; color: white !important; -webkit-print-color-adjust: exact; }
                        }
                    `}
                </style>
                <table className="w-full text-xs text-left whitespace-nowrap">
                    <thead className="bg-blue-900 text-white font-medium">
                        <tr>
                            <th className="px-2 py-3">#</th>
                            <th className="px-2 py-3">Ref</th>
                            <th className="px-2 py-3">Order Type</th>
                            <th className="px-2 py-3">Location</th>
                            <th className="px-2 py-3">Customer</th>
                            <th className="px-2 py-3">Debtor</th>
                            <th className="px-2 py-3">Sales Source</th>
                            <th className="px-2 py-3">Sales Source Reference</th>
                            <th className="px-2 py-3">Order Date</th>
                            <th className="px-2 py-3">Order Time</th>
                            <th className="px-2 py-3 text-right">Sub Total</th>
                            <th className="px-2 py-3 text-right">Discount</th>
                            <th className="px-2 py-3 text-right">VAT</th>
                            <th className="px-2 py-3 text-right">Shipping Charge</th>
                            <th className="px-2 py-3 text-right">Order Total</th>
                            <th className="px-2 py-3 text-right">Customer Paid Amount</th>
                            <th className="px-2 py-3 text-right">Returned Amount</th>
                            <th className="px-2 py-3">Payment Method</th>
                            <th className="px-2 py-3">Settlement Time</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {loading ? (
                            <tr>
                                <td colSpan="19" className="px-4 py-8 text-center text-slate-500">
                                    <div className="flex justify-center items-center gap-2">
                                        <Loader className="animate-spin text-blue-600" size={20} /> Loading...
                                    </div>
                                </td>
                            </tr>
                        ) : data.length === 0 ? (
                            <tr>
                                <td colSpan="19" className="px-4 py-8 text-center text-slate-500">No records found.</td>
                            </tr>
                        ) : (
                            data.map((item, index) => (
                                <tr key={index} className="hover:bg-slate-50 transition">
                                    <td className="px-2 py-2">{index + 1}</td>
                                    <td className="px-2 py-2">{item.ref}</td>
                                    <td className="px-2 py-2">{item.orderType}</td>
                                    <td className="px-2 py-2">{item.location}</td>
                                    <td className="px-2 py-2">{item.customer}</td>
                                    <td className="px-2 py-2">{item.debtor || '-'}</td>
                                    <td className="px-2 py-2">{item.salesSource || '-'}</td>
                                    <td className="px-2 py-2">{item.salesSourceReference || '-'}</td>
                                    <td className="px-2 py-2">{item.orderDate}</td>
                                    <td className="px-2 py-2">{item.orderTime}</td>
                                    <td className="px-2 py-2 text-right">{item.subTotal?.toFixed(2)}</td>
                                    <td className="px-2 py-2 text-right">{item.discount?.toFixed(2)}</td>
                                    <td className="px-2 py-2 text-right">{item.vat?.toFixed(2)}</td>
                                    <td className="px-2 py-2 text-right">{item.shippingCharge?.toFixed(2)}</td>
                                    <td className="px-2 py-2 text-right font-medium">{item.orderTotal?.toFixed(2)}</td>
                                    <td className="px-2 py-2 text-right">{item.customerPaidAmount?.toFixed(2)}</td>
                                    <td className="px-2 py-2 text-right">{item.returnedAmount?.toFixed(2)}</td>
                                    <td className="px-2 py-2">{item.paymentMethod}</td>
                                    <td className="px-2 py-2">{item.settlementTime || '-'}</td>
                                </tr>
                            ))
                        )}
                        {/* Totals Row */}
                         {data.length > 0 && (
                            <tr className="bg-orange-50 font-bold border-t border-orange-200">
                                <td colSpan="10" className="px-2 py-2 text-right">Total:</td>
                                <td className="px-2 py-2 text-right">{data.reduce((sum, i) => sum + (i.subTotal || 0), 0).toFixed(2)}</td>
                                <td className="px-2 py-2 text-right">{data.reduce((sum, i) => sum + (i.discount || 0), 0).toFixed(2)}</td>
                                <td className="px-2 py-2 text-right">{data.reduce((sum, i) => sum + (i.vat || 0), 0).toFixed(2)}</td>
                                <td className="px-2 py-2 text-right">{data.reduce((sum, i) => sum + (i.shippingCharge || 0), 0).toFixed(2)}</td>
                                <td className="px-2 py-2 text-right">{data.reduce((sum, i) => sum + (i.orderTotal || 0), 0).toFixed(2)}</td>
                                <td className="px-2 py-2 text-right">{data.reduce((sum, i) => sum + (i.customerPaidAmount || 0), 0).toFixed(2)}</td>
                                <td className="px-2 py-2 text-right">{data.reduce((sum, i) => sum + (i.returnedAmount || 0), 0).toFixed(2)}</td>
                                <td colSpan="2"></td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default TotalSalesReport;
