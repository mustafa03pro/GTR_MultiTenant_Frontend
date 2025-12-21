import React, { useState, useEffect } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { Download, Printer } from 'lucide-react';

const ItemMovementReport = () => {
    const [filters, setFilters] = useState({
        fromDate: new Date().toISOString().split('T')[0],
        toDate: new Date().toISOString().split('T')[0],
        storeId: '',
        itemName: ''
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
            if (filters.itemName) {
                params.itemName = filters.itemName;
            }

            const response = await axios.get(`${API_URL}/pos/reports/item-movement-report`, {
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
        return data.reduce((sum, item) => sum + (item.qtyOut || 0), 0);
    };

    const calculateTotalCost = () => {
        return data.reduce((sum, item) => sum + (item.cost || 0), 0).toFixed(2);
    };

    const exportToExcel = () => {
        if (!data.length) return;

        const exportData = data.map(item => ({
            "Stock ID": item.stockId,
            "Item Name": item.itemName,
            "Description": item.description,
            "Qty Out": item.qtyOut,
            "Cost": item.cost,
            "Date": item.date
        }));

        const worksheet = XLSX.utils.json_to_sheet(exportData);
        // Add total row to export
        const totalRow = {
            "Stock ID": "Total:",
            "Item Name": "",
            "Description": "",
            "Qty Out": calculateTotalQuantity(),
            "Cost": calculateTotalCost(),
            "Date": ""
        };
        XLSX.utils.sheet_add_json(worksheet, [totalRow], { skipHeader: true, origin: -1 });

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Item Movement Report");
        XLSX.writeFile(workbook, "Item_Movement_Report.xlsx");
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="p-4 bg-gray-50 min-h-screen font-sans">
            <h1 className="text-2xl font-bold mb-6 text-gray-800">Item movement</h1>

            {/* Filters */}
            <div className="bg-white p-6 rounded-lg shadow mb-6 border border-gray-100">
                <h3 className="text-blue-900 font-semibold mb-4">Search</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Item:</label>
                        <input
                            type="text"
                            name="itemName"
                            value={filters.itemName}
                            onChange={handleFilterChange}
                            placeholder="Item name..."
                            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm text-gray-700"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">From Location:</label>
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
                        <label className="block text-sm font-medium text-gray-600 mb-1">From:</label>
                        <input
                            type="date"
                            name="fromDate"
                            value={filters.fromDate}
                            onChange={handleFilterChange}
                            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm text-gray-700"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">To:</label>
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
                    Show Movements
                </button>
            </div>

            {/* Report Table */}
            <div className="bg-white rounded-lg shadow border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                    <h2 className="text-lg font-semibold text-blue-900">
                        Details
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
                                    <th className="px-4 py-3 font-semibold">Stock ID</th>
                                    <th className="px-4 py-3 font-semibold">Item Name</th>
                                    <th className="px-4 py-3 font-semibold">Description</th>
                                    <th className="px-4 py-3 font-semibold">Qty Out</th>
                                    <th className="px-4 py-3 font-semibold">Cost</th>
                                    <th className="px-4 py-3 font-semibold">Date</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {data.length > 0 ? (
                                    data.map((item, index) => (
                                        <tr key={index} className="hover:bg-gray-50">
                                            <td className="px-4 py-3 text-gray-800">{item.stockId}</td>
                                            <td className="px-4 py-3 text-gray-600">{item.itemName}</td>
                                            <td className="px-4 py-3 text-gray-600">{item.description}</td>
                                            <td className="px-4 py-3 text-gray-800">{item.qtyOut}</td>
                                            <td className="px-4 py-3 text-gray-800">{Number(item.cost).toFixed(2)}</td>
                                            <td className="px-4 py-3 text-gray-800">{item.date}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="6" className="px-4 py-8 text-center text-gray-500">No records found</td>
                                    </tr>
                                )}
                            </tbody>
                            <tfoot className="bg-gray-100 font-semibold text-gray-800">
                                <tr>
                                    <td className="px-4 py-3">Total</td>
                                    <td colSpan="2"></td>
                                    <td className="px-4 py-3">{calculateTotalQuantity().toFixed(3)}</td>
                                    <td className="px-4 py-3">{calculateTotalCost()}</td>
                                    <td></td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ItemMovementReport;
