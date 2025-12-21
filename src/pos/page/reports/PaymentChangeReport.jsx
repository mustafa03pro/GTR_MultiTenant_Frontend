import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, RotateCcw, Printer, FileText, Download } from 'lucide-react';
import * as XLSX from 'xlsx';

const PaymentChangeReport = () => {
    const [filters, setFilters] = useState({
        fromDate: new Date().toISOString().split('T')[0],
        toDate: new Date().toISOString().split('T')[0],
        storeId: '',
        userId: '',
        orderNo: '',
    });
    const [stores, setStores] = useState([]);
    const [users, setUsers] = useState([]);
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const API_URL = import.meta.env.VITE_API_BASE_URL;

    useEffect(() => {
        fetchStores();
        fetchUsers();
    }, []);

    const fetchStores = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}/pos/stores`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setStores(response.data);
        } catch (err) {
            console.error("Error fetching stores:", err);
        }
    };

    const fetchUsers = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}/users`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUsers(response.data);
        } catch (err) {
            console.error("Error fetching users:", err);
        }
    };

    const fetchReport = async () => {
        setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem('token');
            const params = {
                fromDate: filters.fromDate,
                toDate: filters.toDate,
            };
            if (filters.storeId) params.storeId = filters.storeId;
            if (filters.userId) params.userId = filters.userId;
            if (filters.orderNo) params.orderNo = filters.orderNo;

            const response = await axios.get(`${API_URL}/pos/reports/payment-change-report`, {
                headers: { Authorization: `Bearer ${token}` },
                params: params
            });

            setData(response.data);
        } catch (err) {
            console.error("Error fetching report:", err);
            setError("Failed to load report data.");
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const handleSearch = (e) => {
        e.preventDefault();
        fetchReport();
    };

    const handleReset = () => {
        setFilters({
            fromDate: new Date().toISOString().split('T')[0],
            toDate: new Date().toISOString().split('T')[0],
            storeId: '',
            userId: '',
            orderNo: '',
        });
        setData([]);
        setError(null);
    };

    const exportToExcel = () => {
        if (!data.length) return;
        const exportData = data.map((item, index) => ({
            "#": index + 1,
            "Order No": item.orderNo,
            "Trans No": item.transNo,
            "User": item.user,
            "Card Assigned User": item.cardAssignedUser,
            "Branch": item.branch,
            "From Account": item.fromAccount,
            "To Account": item.toAccount,
            "Date": item.date,
        }));
        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Payment Changes");
        XLSX.writeFile(workbook, "Payment_Change_Report.xlsx");
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold text-slate-800 mb-6">Payment Change Report</h1>

            {/* Filters */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-6 no-print">
                <form onSubmit={handleSearch}>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Company</label>
                            <select className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                                <option value="">All</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Company Branch</label>
                            <select
                                name="storeId"
                                value={filters.storeId}
                                onChange={handleFilterChange}
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                                <option value="">All Branches</option>
                                {stores.map(store => (
                                    <option key={store.id} value={store.id}>{store.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">User</label>
                            <select
                                name="userId"
                                value={filters.userId}
                                onChange={handleFilterChange}
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                                <option value="">All</option>
                                {users.map(user => (
                                    <option key={user.id} value={user.id}>{user.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Order Number</label>
                            <input
                                type="text"
                                name="orderNo"
                                value={filters.orderNo}
                                onChange={handleFilterChange}
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                    </div>
                    
                    <div className="flex flex-wrap items-end gap-4">
                         <div className="w-full sm:w-auto flex-1">
                            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">From</label>
                            <input
                                type="date"
                                name="fromDate"
                                value={filters.fromDate}
                                onChange={handleFilterChange}
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                        <div className="w-full sm:w-auto flex-1">
                            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">To</label>
                            <input
                                type="date"
                                name="toDate"
                                value={filters.toDate}
                                onChange={handleFilterChange}
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                        <button
                            type="submit"
                            className="bg-indigo-900 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-indigo-800 transition-colors shadow-sm"
                            disabled={loading}
                        >
                            {loading ? 'Loading...' : 'Show'}
                        </button>
                    </div>
                </form>
            </div>

            {/* Error Message */}
            {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6 text-sm border border-red-100">
                    {error}
                </div>
            )}

            {/* Report Header & Actions */}
             <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-indigo-900">
                    Payment Change Report from <span className="text-slate-600">{filters.fromDate}</span> to <span className="text-slate-600">{filters.toDate}</span>
                </h2>
                <div className="flex gap-2 no-print">
                    <button onClick={handlePrint} className="p-2 bg-indigo-900 text-white rounded hover:bg-indigo-800 transition-colors" title="Print">
                        <Printer size={18} />
                    </button>
                    <button onClick={exportToExcel} className="p-2 bg-indigo-900 text-white rounded hover:bg-indigo-800 transition-colors" title="Export to Excel">
                       <FileText size={18} />
                    </button>
                    {/* Placeholder for PDF if library available, or just use print to PDF */}
                     <button onClick={() => window.print()} className="p-2 bg-indigo-900 text-white rounded hover:bg-indigo-800 transition-colors" title="PDF">
                        <Download size={18} />
                    </button>
                </div>
            </div>


            {/* Table */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-indigo-900 text-white font-medium">
                            <tr>
                                <th className="px-4 py-3 whitespace-nowrap">#</th>
                                <th className="px-4 py-3 whitespace-nowrap">Order No</th>
                                <th className="px-4 py-3 whitespace-nowrap">Trans No</th>
                                <th className="px-4 py-3 whitespace-nowrap">User</th>
                                <th className="px-4 py-3 whitespace-nowrap">Card Assigned User</th>
                                <th className="px-4 py-3 whitespace-nowrap">Branch</th>
                                <th className="px-4 py-3 whitespace-nowrap">From Account</th>
                                <th className="px-4 py-3 whitespace-nowrap">To Account</th>
                                <th className="px-4 py-3 whitespace-nowrap">Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan="9" className="px-6 py-8 text-center text-slate-500">
                                        Loading report...
                                    </td>
                                </tr>
                            ) : data.length === 0 ? (
                                <tr>
                                    <td colSpan="9" className="px-6 py-8 text-center text-slate-500">
                                        No data available.
                                    </td>
                                </tr>
                            ) : (
                                data.map((item, index) => (
                                    <tr key={index} className="hover:bg-slate-50 transition-colors text-slate-700">
                                        <td className="px-4 py-3 border-r border-slate-100">{index + 1}</td>
                                        <td className="px-4 py-3 border-r border-slate-100">{item.orderNo}</td>
                                        <td className="px-4 py-3 border-r border-slate-100">{item.transNo}</td>
                                        <td className="px-4 py-3 border-r border-slate-100">{item.user}</td>
                                        <td className="px-4 py-3 border-r border-slate-100">{item.cardAssignedUser}</td>
                                        <td className="px-4 py-3 border-r border-slate-100">{item.branch}</td>
                                        <td className="px-4 py-3 border-r border-slate-100">{item.fromAccount}</td>
                                        <td className="px-4 py-3 border-r border-slate-100">{item.toAccount}</td>
                                        <td className="px-4 py-3">{item.date}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            
            {/* Print Styles */}
            <style>{`
                @media print {
                    .no-print {
                        display: none;
                    }
                    body {
                        background: white;
                    }
                    .p-6 {
                        padding: 0;
                    }
                }
            `}</style>
        </div>
    );
};

export default PaymentChangeReport;
