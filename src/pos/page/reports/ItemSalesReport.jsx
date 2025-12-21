import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Download, Printer, Search, ArrowLeft } from 'lucide-react';
import * as XLSX from 'xlsx';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const ItemSalesReport = () => {
    const [fromDate, setFromDate] = useState(new Date().toISOString().split('T')[0]);
    const [toDate, setToDate] = useState(new Date().toISOString().split('T')[0]);
    const [storeId, setStoreId] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [itemName, setItemName] = useState('');
    const [showComboItems, setShowComboItems] = useState(false);
    
    const [stores, setStores] = useState([]);
    const [categories, setCategories] = useState([]);
    const [reportData, setReportData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const componentRef = useRef();

    useEffect(() => {
        fetchStores();
        fetchCategories();
    }, []);

    const fetchStores = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_BASE_URL}/pos/stores`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setStores(response.data);
        } catch (err) {
            console.error('Failed to fetch stores:', err);
        }
    };

    const fetchCategories = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_BASE_URL}/production/categories`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setCategories(response.data || []);
        } catch (err) {
            console.error('Failed to fetch categories:', err);
        }
    };

    const fetchReport = async () => {
        setLoading(true);
        setError('');
        try {
            const token = localStorage.getItem('token');
            const params = {
                fromDate,
                toDate,
                ...(storeId && { storeId }),
                ...(categoryId && { categoryId }),
                ...(itemName && { itemName }),
                // Backend does not support showComboItems yet, but UI has the toggle.
            };

            const response = await axios.get(`${API_BASE_URL}/api/pos/reports/item-sales-report`, {
                headers: { Authorization: `Bearer ${token}` },
                params
            });
            setReportData(response.data);
        } catch (err) {
            setError('Failed to fetch report data.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const handleExport = () => {
        if (reportData.length === 0) return;

        const dataToExport = reportData.map(item => ({
            'Stock ID': item.stockId,
            'Item Name': item.itemName,
            'Quantity': item.quantity,
            'Unit Price': item.unitPrice,
            'Total without Discount': item.totalWithoutDiscount,
            'Discount Amount': item.discountAmount,
            'Total with Discount': item.totalWithDiscount
        }));

        // Calculate totals for export
        const totals = reportData.reduce((acc, item) => ({
            quantity: acc.quantity + item.quantity,
            totalWithoutDiscount: acc.totalWithoutDiscount + item.totalWithoutDiscount,
            discountAmount: acc.discountAmount + item.discountAmount,
            totalWithDiscount: acc.totalWithDiscount + item.totalWithDiscount
        }), { quantity: 0, totalWithoutDiscount: 0, discountAmount: 0, totalWithDiscount: 0 });

        dataToExport.push({
            'Stock ID': 'Total',
            'Item Name': '',
            'Quantity': totals.quantity,
            'Unit Price': '',
            'Total without Discount': totals.totalWithoutDiscount,
            'Discount Amount': totals.discountAmount,
            'Total with Discount': totals.totalWithDiscount
        });

        const ws = XLSX.utils.json_to_sheet(dataToExport);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Item Sales Report");
        XLSX.writeFile(wb, "Item_Sales_Report.xlsx");
    };

    // Calculate totals for footer
    const totals = reportData.reduce((acc, item) => ({
        quantity: acc.quantity + (item.quantity || 0),
        totalWithoutDiscount: acc.totalWithoutDiscount + (item.totalWithoutDiscount || 0),
        discountAmount: acc.discountAmount + (item.discountAmount || 0),
        totalWithDiscount: acc.totalWithDiscount + (item.totalWithDiscount || 0)
    }), { quantity: 0, totalWithoutDiscount: 0, discountAmount: 0, totalWithDiscount: 0 });

    return (
        <div className="p-6">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-slate-800">Item Sales Report</h1>
                <p className="text-slate-500">View sales by item and category.</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                     {/* Company Link (Static as per image or dynamic if needed, usually just displayed) */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Company</label>
                        <input type="text" value="Service 4 U LLC" disabled className="input w-full bg-slate-50" />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Company Branch</label>
                        <select 
                            value={storeId} 
                            onChange={(e) => setStoreId(e.target.value)}
                            className="input w-full"
                        >
                            <option value="">All Branches</option>
                            {stores.map(store => (
                                <option key={store.id} value={store.id}>{store.name}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                        <select 
                            value={categoryId} 
                            onChange={(e) => setCategoryId(e.target.value)}
                            className="input w-full"
                        >
                            <option value="">All Categories</option>
                            {categories.map(cat => (
                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Item</label>
                        <input 
                            type="text" 
                            placeholder="Item Name" 
                            value={itemName} 
                            onChange={(e) => setItemName(e.target.value)} 
                            className="input w-full" 
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">From</label>
                        <input 
                            type="date" 
                            value={fromDate} 
                            onChange={(e) => setFromDate(e.target.value)} 
                            className="input w-full" 
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">To</label>
                        <input 
                            type="date" 
                            value={toDate} 
                            onChange={(e) => setToDate(e.target.value)} 
                            className="input w-full" 
                        />
                    </div>
                    
                    <div className="pb-3">
                         <div className="flex items-center gap-2">
                            <label htmlFor="comboToggle" className="text-sm font-medium text-slate-700 cursor-pointer select-none">Show Combo Items</label>
                            <div 
                                className={`w-10 h-5 rounded-full p-1 cursor-pointer transition-colors ${showComboItems ? 'bg-blue-600' : 'bg-slate-300'}`}
                                onClick={() => setShowComboItems(!showComboItems)}
                            >
                                <div className={`w-3 h-3 bg-white rounded-full shadow-sm transform transition-transform ${showComboItems ? 'translate-x-5' : 'translate-x-0'}`} />
                            </div>
                        </div>
                    </div>

                    <div>
                        <button 
                            onClick={fetchReport} 
                            disabled={loading}
                            className="btn-primary w-full flex items-center justify-center gap-2"
                        >
                            {loading ? 'Loading...' : <><Search size={18} /> Show</>}
                        </button>
                    </div>
                </div>
            </div>

            {reportData.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                    <div className="p-4 border-b flex justify-between items-center bg-slate-50">
                        <h2 className="font-semibold text-slate-700">
                            Item Sales Report - {storeId ? stores.find(s => s.id == storeId)?.name : 'All Branches'} from {fromDate} to {toDate}
                        </h2>
                        <div className="flex gap-2">
                             <button onClick={handlePrint} className="btn-secondary flex items-center gap-2">
                                <Printer size={16} /> Print
                            </button>
                            <button onClick={handleExport} className="btn-primary flex items-center gap-2">
                                <Download size={16} /> Export
                            </button>
                        </div>
                    </div>

                   <div ref={componentRef} className="p-4">
                        {/* Print Header */}
                        <div className="hidden print:block mb-8 text-center">
                            <h1 className="text-2xl font-bold">Item Sales Report</h1>
                            <p className="text-sm text-gray-500">
                                {storeId ? stores.find(s => s.id == storeId)?.name : 'All Branches'} | {fromDate} to {toDate}
                            </p>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-[#1e3a8a] text-white print:bg-gray-100 print:text-black">
                                    <tr>
                                        <th className="px-4 py-3 font-medium rounded-tl-lg">Stock ID</th>
                                        <th className="px-4 py-3 font-medium">Item Name</th>
                                        <th className="px-4 py-3 font-medium text-center">Quantity</th>
                                        <th className="px-4 py-3 font-medium text-right">Unit Price</th>
                                        <th className="px-4 py-3 font-medium text-right">Total without Discount</th>
                                        <th className="px-4 py-3 font-medium text-right">Discount Amount</th>
                                        <th className="px-4 py-3 font-medium text-right rounded-tr-lg">Total with Discount</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {reportData.map((item, index) => (
                                        <tr key={index} className="hover:bg-slate-50">
                                            <td className="px-4 py-3 font-medium text-slate-900">{item.stockId}</td>
                                            <td className="px-4 py-3 text-slate-600">{item.itemName}</td>
                                            <td className="px-4 py-3 text-center text-slate-600 font-medium">{item.quantity}</td>
                                            <td className="px-4 py-3 text-right text-slate-600">{item.unitPrice?.toFixed(2)}</td>
                                            <td className="px-4 py-3 text-right text-slate-600">{item.totalWithoutDiscount?.toFixed(2)}</td>
                                            <td className="px-4 py-3 text-right text-slate-600">{item.discountAmount?.toFixed(2)}</td>
                                            <td className="px-4 py-3 text-right font-medium text-slate-900">{item.totalWithDiscount?.toFixed(2)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot className="bg-slate-50 font-bold border-t border-slate-200">
                                    <tr>
                                        <td colSpan="2" className="px-4 py-3 text-slate-800">Total</td>
                                        <td className="px-4 py-3 text-center text-slate-800">{totals.quantity}</td>
                                        <td className="px-4 py-3 text-right"></td>
                                        <td className="px-4 py-3 text-right text-slate-800">{totals.totalWithoutDiscount.toFixed(2)}</td>
                                        <td className="px-4 py-3 text-right text-slate-800">{totals.discountAmount.toFixed(2)}</td>
                                        <td className="px-4 py-3 text-right text-slate-800">{totals.totalWithDiscount.toFixed(2)}</td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                   </div>
                </div>
            )}
             {reportData.length === 0 && !loading && !error && (
                <div className="text-center py-12 text-slate-500 bg-white rounded-xl shadow-sm">
                    <p>No data found for the selected criteria.</p>
                </div>
            )}
            {error && (
                <div className="text-center py-12 text-red-500 bg-white rounded-xl shadow-sm">
                    <p>{error}</p>
                </div>
            )}
        </div>
    );
};

export default ItemSalesReport;
