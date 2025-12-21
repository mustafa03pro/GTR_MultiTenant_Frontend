import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Printer, FileText, Download } from 'lucide-react';
import * as XLSX from 'xlsx';

const SalesDiscountReport = () => {
    const [filters, setFilters] = useState({
        fromDate: new Date().toISOString().split('T')[0],
        toDate: new Date().toISOString().split('T')[0],
        storeId: '',
        discountType: '',
        showSummary: 'Yes', // Placeholder for now, backend doesn't seem to use it yet but UI has it
    });
    const [stores, setStores] = useState([]);
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const API_URL = import.meta.env.VITE_API_BASE_URL;

    useEffect(() => {
        fetchStores();
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
            if (filters.discountType) params.discountType = filters.discountType;

            const response = await axios.get(`${API_URL}/pos/reports/sales-discount-report`, {
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

    const exportToExcel = () => {
        if (!data.length) return;
        const exportData = data.map((item, index) => ({
            "Branch": item.branch,
            "Discount Type": item.discountType,
            "Count": item.count,
            "Order Amount After Discount": item.orderAmountAfterDiscount,
            "Discount Amount": item.discountAmount,
            "Order Date": item.orderDate,
            "Order Hour": item.orderHour,
        }));
        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Sales Discount");
        XLSX.writeFile(workbook, "Sales_Discount_Report.xlsx");
    };

    const handlePrint = () => {
        window.print();
    };

    // Calculate totals
    const totalOrderAmount = data.reduce((sum, item) => sum + (item.orderAmountAfterDiscount || 0), 0);
    const totalDiscountAmount = data.reduce((sum, item) => sum + (item.discountAmount || 0), 0);
    const totalCount = data.reduce((sum, item) => sum + (item.count || 0), 0);

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold text-slate-800 mb-6">Sales Discount Report</h1>

            {/* Filters */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-6 no-print">
                <form onSubmit={handleSearch}>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                        <div>
                             <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Discount Type</label>
                            <select
                                name="discountType"
                                value={filters.discountType}
                                onChange={handleFilterChange}
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                                <option value="">All</option>
                                <option value="Test">Test</option>
                                <option value="Seasonal">Seasonal</option>
                                <option value="Coupon">Coupon</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Company</label>
                            <select className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                                <option value="">Service 4 U LLC</option>
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
                         <div className="w-full sm:w-auto flex-1">
                            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Show Summary</label>
                            <select
                                name="showSummary"
                                value={filters.showSummary}
                                onChange={handleFilterChange}
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                                <option value="Yes">Yes</option>
                                <option value="No">No</option>
                            </select>
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
                    Sales Discount Report {filters.storeId ? stores.find(s => s.id == filters.storeId)?.name : 'All Branches'} from <span className="text-slate-600">{filters.fromDate}</span> to <span className="text-slate-600">{filters.toDate}</span>
                </h2>
                <div className="flex gap-2 no-print">
                    <button onClick={handlePrint} className="p-2 bg-indigo-900 text-white rounded hover:bg-indigo-800 transition-colors" title="Print">
                        <Printer size={18} />
                    </button>
                    <button onClick={exportToExcel} className="p-2 bg-indigo-900 text-white rounded hover:bg-indigo-800 transition-colors" title="Export to Excel">
                       <FileText size={18} />
                    </button>
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
                                <th className="px-4 py-3 whitespace-nowrap">Branch</th>
                                <th className="px-4 py-3 whitespace-nowrap">Discount Type</th>
                                <th className="px-4 py-3 whitespace-nowrap">Count</th>
                                <th className="px-4 py-3 whitespace-nowrap text-right">Order Amount After Discount</th>
                                <th className="px-4 py-3 whitespace-nowrap text-right">Discount Amount</th>
                                <th className="px-4 py-3 whitespace-nowrap">Order Date</th>
                                <th className="px-4 py-3 whitespace-nowrap">Order Hour</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan="7" className="px-6 py-8 text-center text-slate-500">
                                        Loading report...
                                    </td>
                                </tr>
                            ) : data.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="px-6 py-8 text-center text-slate-500">
                                        No data available.
                                    </td>
                                </tr>
                            ) : (
                                <>
                                {data.map((item, index) => (
                                    <tr key={index} className="hover:bg-slate-50 transition-colors text-slate-700">
                                        <td className="px-4 py-3 border-r border-slate-100">{item.branch}</td>
                                        <td className="px-4 py-3 border-r border-slate-100">{item.discountType}</td>
                                        <td className="px-4 py-3 border-r border-slate-100">{item.count}</td>
                                        <td className="px-4 py-3 border-r border-slate-100 text-right">{item.orderAmountAfterDiscount?.toFixed(2)}</td>
                                        <td className="px-4 py-3 border-r border-slate-100 text-right">{item.discountAmount?.toFixed(2)}</td>
                                        <td className="px-4 py-3 border-r border-slate-100">{item.orderDate}</td>
                                        <td className="px-4 py-3">{item.orderHour}</td>
                                    </tr>
                                ))}
                                {/* Total Row */}
                                <tr className="bg-slate-50 font-bold text-slate-800">
                                     <td className="px-4 py-3 border-r border-slate-200">Total:</td>
                                     <td className="px-4 py-3 border-r border-slate-200"></td>
                                     <td className="px-4 py-3 border-r border-slate-200">{totalCount}</td>
                                     <td className="px-4 py-3 border-r border-slate-200 text-right">{totalOrderAmount.toFixed(2)}</td>
                                     <td className="px-4 py-3 border-r border-slate-200 text-right">{totalDiscountAmount.toFixed(2)}</td>
                                     <td className="px-4 py-3 border-r border-slate-200"></td>
                                     <td className="px-4 py-3"></td>
                                </tr>
                                </>
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

export default SalesDiscountReport;
