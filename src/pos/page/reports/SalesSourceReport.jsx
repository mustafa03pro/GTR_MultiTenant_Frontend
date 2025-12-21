import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Loader } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

const SalesSourceReport = () => {
    const [loading, setLoading] = useState(false);
    const [stores, setStores] = useState([]);
    
    // Filters
    const [selectedStore, setSelectedStore] = useState('');
    const [salesSource, setSalesSource] = useState('All');
    const [fromDate, setFromDate] = useState(new Date().toISOString().split('T')[0]);
    const [toDate, setToDate] = useState(new Date().toISOString().split('T')[0]);
    const [reference, setReference] = useState('');

    const [data, setData] = useState([]);
    const [totalAmount, setTotalAmount] = useState(0);

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
            if (response.data.length > 0) {
                setSelectedStore(response.data[0].id);
            }
        } catch (error) {
            console.error("Error fetching stores:", error);
        }
    };

    const handleSearch = async () => {
        if (!selectedStore) return;
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}/pos/reports/sales-source-report`, {
                headers: { "Authorization": `Bearer ${token}` },
                params: {
                    fromDate,
                    toDate,
                    storeId: selectedStore,
                    source: salesSource === 'All' ? null : salesSource,
                    reference: reference || null
                }
            });
            setData(response.data);
            
            // Calculate total
            const total = response.data.reduce((sum, item) => sum + (item.salesTotalAmount || 0), 0);
            setTotalAmount(total);

        } catch (error) {
            console.error("Error fetching sales source report:", error);
            setData([]);
            setTotalAmount(0);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 bg-slate-50 min-h-screen font-sans text-slate-800">
            <h1 className="text-2xl font-bold mb-6 text-slate-800 border-b pb-2">Sales Source Inquiry</h1>

            {/* Filters */}
            <div className="bg-white p-6 rounded-lg shadow mb-6 border border-slate-200">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Branches</label>
                        <select 
                            className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                            value={selectedStore}
                            onChange={(e) => setSelectedStore(e.target.value)}
                        >
                            {stores.map(store => (
                                <option key={store.id} value={store.id}>{store.name}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Sales Source</label>
                        <select 
                            className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                            value={salesSource}
                            onChange={(e) => setSalesSource(e.target.value)}
                        >
                            <option value="All">All</option>
                            <option value="Facebook">Facebook</option>
                            <option value="Instagram">Instagram</option>
                            <option value="Referral">Referral</option>
                            <option value="Enquiry">Enquiry</option>
                            <option value="Walk-in">Walk-in</option>
                            <option value="Website">Website</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">From:</label>
                        <input 
                            type="date"
                            className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                            value={fromDate}
                            onChange={(e) => setFromDate(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">To:</label>
                        <input 
                            type="date"
                            className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                            value={toDate}
                            onChange={(e) => setToDate(e.target.value)}
                        />
                    </div>

                    <div className="md:col-span-2">
                        <label className="block text-xs font-bold text-slate-700 mb-1">Sales Source Reference:</label>
                        <input 
                            type="text"
                            placeholder="Enter reference..."
                            className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500 bg-slate-50"
                            value={reference}
                            onChange={(e) => setReference(e.target.value)}
                        />
                    </div>

                    <div className="flex items-end">
                        <button 
                            onClick={handleSearch}
                            disabled={loading || !selectedStore}
                            className="bg-blue-900 text-white px-6 py-2 rounded text-sm font-semibold hover:bg-blue-800 transition disabled:opacity-50"
                        >
                            {loading ? <Loader className="animate-spin" size={16} /> : 'Search'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Results Table */}
            <div className="bg-white rounded-lg shadow border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-200">
                     <h2 className="text-sm font-bold text-blue-900">Transactions</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-blue-900 text-white font-medium">
                            <tr>
                                <th className="px-4 py-3">Order No</th>
                                <th className="px-4 py-3">Ref</th>
                                <th className="px-4 py-3">Source</th>
                                <th className="px-4 py-3">Sales Source Reference</th>
                                <th className="px-4 py-3">Customer</th>
                                <th className="px-4 py-3">Date</th>
                                <th className="px-4 py-3 text-right">Sales Total Amount</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan="7" className="px-4 py-8 text-center text-slate-500">
                                        <div className="flex justify-center items-center gap-2">
                                            <Loader className="animate-spin text-blue-600" size={20} /> Loading data...
                                        </div>
                                    </td>
                                </tr>
                            ) : data.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="px-4 py-8 text-center text-slate-500">No records found.</td>
                                </tr>
                            ) : (
                                data.map((item, index) => (
                                    <tr key={index} className="hover:bg-slate-50 transition">
                                        <td className="px-4 py-3">{item.orderNo}</td>
                                        <td className="px-4 py-3">{item.reference}</td>
                                        <td className="px-4 py-3">{item.source || '-'}</td>
                                        <td className="px-4 py-3">{item.salesSourceReference || '-'}</td>
                                        <td className="px-4 py-3">{item.customerName}</td>
                                        <td className="px-4 py-3">
                                            {item.date ? new Date(item.date).toLocaleDateString() : '-'}
                                        </td>
                                        <td className="px-4 py-3 text-right font-medium">
                                            {item.salesTotalAmount?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                        {data.length > 0 && (
                            <tfoot className="bg-orange-50 font-bold border-t border-orange-100">
                                <tr>
                                    <td className="px-4 py-3 text-slate-800" colSpan="6">Total</td>
                                    <td className="px-4 py-3 text-right text-slate-900">
                                        {totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </td>
                                </tr>
                            </tfoot>
                        )}
                    </table>
                </div>
            </div>
        </div>
    );
};

export default SalesSourceReport;
