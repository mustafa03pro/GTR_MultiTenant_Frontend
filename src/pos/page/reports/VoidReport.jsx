import React, { useState, useEffect } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { Download, Printer } from 'lucide-react';

const VoidReport = () => {
    const [filters, setFilters] = useState({
        fromDate: new Date().toISOString().split('T')[0],
        toDate: new Date().toISOString().split('T')[0],
        storeId: ''
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
            console.error("Failed to fetch stores", err);
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
            if (filters.storeId) {
                params.storeId = filters.storeId;
            }

            const response = await axios.get(`${API_URL}/pos/reports/void-report`, {
                headers: { Authorization: `Bearer ${token}` },
                params: params
            });
            setData(response.data);
        } catch (err) {
            setError("Failed to load report data.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const calculateTotalQuantity = () => {
        return data.reduce((sum, item) => sum + (item.quantity || 0), 0);
    };

    const calculateTotalAmount = () => {
        return data.reduce((sum, item) => sum + (item.amount || 0), 0).toFixed(2);
    };

    const exportToExcel = () => {
        if (!data.length) return;

        const exportData = data.map(item => ({
            "Code": item.code,
            "Order Type": item.orderType,
            "POS": item.pos,
            "Order Taken by": item.orderTakenBy,
            "Name": item.name,
            "Quantity": item.quantity,
            "Amount": item.amount
        }));

        const worksheet = XLSX.utils.json_to_sheet(exportData);
        // Add total row to export
        const totalRow = {
            "Code": "Total:",
            "Order Type": "",
            "POS": "",
            "Order Taken by": "",
            "Name": "",
            "Quantity": calculateTotalQuantity(),
            "Amount": calculateTotalAmount()
        };
        XLSX.utils.sheet_add_json(worksheet, [totalRow], { skipHeader: true, origin: -1 });

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Void Report");
        XLSX.writeFile(workbook, "Void_Report.xlsx");
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="p-4 bg-gray-50 min-h-screen font-sans">
            <h1 className="text-2xl font-bold mb-6 text-gray-800">Void Report</h1>

            {/* Filters */}
            <div className="bg-white p-6 rounded-lg shadow mb-6 border border-gray-100">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Company:</label>
                        <select className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm text-gray-700 bg-gray-50" disabled>
                            <option>All</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Company Branch:</label>
                        <select
                            name="storeId"
                            value={filters.storeId}
                            onChange={handleFilterChange}
                            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm text-gray-700"
                        >
                            <option value="">All Branches</option>
                            {stores.map(store => (
                                <option key={store.id} value={store.id}>{store.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">From</label>
                        <input
                            type="date"
                            name="fromDate"
                            value={filters.fromDate}
                            onChange={handleFilterChange}
                            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm text-gray-700"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">To</label>
                        <input
                            type="date"
                            name="toDate"
                            value={filters.toDate}
                            onChange={handleFilterChange}
                            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm text-gray-700"
                        />
                    </div>
                </div>
                <button
                    onClick={fetchReport}
                    className="bg-blue-900 text-white px-6 py-2 rounded shadow hover:bg-blue-800 transition-colors text-sm font-medium"
                >
                    Show
                </button>
            </div>

            {/* Report Table */}
            <div className="bg-white rounded-lg shadow border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                    <h2 className="text-lg font-semibold text-blue-900">
                        Void Report from {filters.fromDate} to {filters.toDate}
                    </h2>
                    <div className="flex space-x-2">
                         <button onClick={handlePrint} className="p-2 bg-blue-900 text-white rounded hover:bg-blue-800 transition-colors" title="Print">
                            <Printer size={18} />
                        </button>
                        <button onClick={exportToExcel} className="p-2 bg-blue-900 text-white rounded hover:bg-blue-800 transition-colors" title="Export to Excel">
                            <Download size={18} />
                        </button>
                    </div>
                </div>

                {error && <div className="p-4 text-red-500 text-center">{error}</div>}
                
                {loading ? (
                    <div className="p-8 text-center text-gray-500">Loading...</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-blue-900 text-white">
                                <tr>
                                    <th className="px-4 py-3 font-semibold">Code</th>
                                    <th className="px-4 py-3 font-semibold">Order Type</th>
                                    <th className="px-4 py-3 font-semibold">POS</th>
                                    <th className="px-4 py-3 font-semibold">Order Taken by</th>
                                    <th className="px-4 py-3 font-semibold">Name</th>
                                    <th className="px-4 py-3 font-semibold text-right">Quantity</th>
                                    <th className="px-4 py-3 font-semibold text-right">Amount</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {data.length > 0 ? (
                                    data.map((item, index) => (
                                        <tr key={index} className="hover:bg-gray-50">
                                            <td className="px-4 py-3 text-gray-800">{item.code}</td>
                                            <td className="px-4 py-3 text-gray-600">{item.orderType}</td>
                                            <td className="px-4 py-3 text-gray-600">{item.pos}</td>
                                            <td className="px-4 py-3 text-gray-600">{item.orderTakenBy}</td>
                                            <td className="px-4 py-3 text-gray-600">{item.name}</td>
                                            <td className="px-4 py-3 text-gray-800 text-right">{item.quantity}</td>
                                            <td className="px-4 py-3 text-gray-800 text-right">{Number(item.amount).toFixed(2)}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="7" className="px-4 py-8 text-center text-gray-500">No records found</td>
                                    </tr>
                                )}
                            </tbody>
                            <tfoot className="bg-gray-100 font-semibold text-gray-800">
                                <tr>
                                    <td className="px-4 py-3">Total:</td>
                                    <td colSpan="4"></td>
                                    <td className="px-4 py-3 text-right">{calculateTotalQuantity()}</td>
                                    <td className="px-4 py-3 text-right">{calculateTotalAmount()}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default VoidReport;
