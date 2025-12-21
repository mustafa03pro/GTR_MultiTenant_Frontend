import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, RotateCcw, Download, Printer } from 'lucide-react';
import * as XLSX from 'xlsx';

const CancellationReport = () => {
    const [stores, setStores] = useState([]);
    const [reportData, setReportData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Filters
    const [fromDate, setFromDate] = useState(new Date().toISOString().split('T')[0]);
    const [toDate, setToDate] = useState(new Date().toISOString().split('T')[0]);
    const [storeId, setStoreId] = useState('');
    // Placeholder for Company if needed, though usually tenant is implied. 
    // Image shows "Company" dropdown, but backend only asks for storeId.
    // We can add a static or fetched company name if strictly required, but for now focusing on functionality.

    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

    useEffect(() => {
        const fetchStores = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await axios.get(`${API_BASE_URL}/api/pos/stores`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setStores(response.data);
            } catch (err) {
                console.error("Error fetching stores:", err);
            }
        };
        fetchStores();
    }, []);

    const handleFetchReport = async () => {
        setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem('token');
            const params = {
                fromDate,
                toDate,
                storeId: storeId || undefined
            };

            const response = await axios.get(`${API_BASE_URL}/api/pos/reports/cancellation-report`, {
                headers: { Authorization: `Bearer ${token}` },
                params
            });
            setReportData(response.data);
        } catch (err) {
            console.error("Error fetching cancellation report:", err);
            setError("Failed to load report data.");
        } finally {
            setLoading(false);
        }
    };

    // Calculate Total Amount
    const totalAmount = reportData.reduce((sum, item) => sum + (item.amount || 0), 0);

    const handleExport = () => {
        const dataToExport = reportData.map(item => ({
            "Bill No": item.billNo,
            "Ref": item.ref,
            "Order Type": item.orderType,
            "POS": item.pos,
            "Order Taken By": item.orderTakenBy,
            "Card User": item.cardUser,
            "Date": item.date,
            "Reason": item.reason,
            "Amount": item.amount,
            "Order Placed Time": item.orderPlacedTime,
            "Order Cancelled Time": item.orderCancelledTime,
            "Payment Method": item.paymentMethod
        }));

        const ws = XLSX.utils.json_to_sheet(dataToExport);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Cancellation Report");
        XLSX.writeFile(wb, "Cancellation_Report.xlsx");
    };

    const handlePrint = () => {
        window.print();
    };

    // Helper to get store name for header
    const getSelectedStoreName = () => {
        if (!storeId) return "All Branches";
        const store = stores.find(s => s.id === parseInt(storeId));
        return store ? store.name : "Unknown Branch";
    };

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Cancellation Report</h1>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-lg shadow mb-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    {/* Company Filter - Visual Only based on requirements */}
                    <div>
                         <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                         <select className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500" disabled>
                            <option>Service 4 U LLC</option>
                         </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Company Branch</label>
                        <select
                            value={storeId}
                            onChange={(e) => setStoreId(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="">All Branches</option>
                            {stores.map(store => (
                                <option key={store.id} value={store.id}>{store.name}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">From</label>
                        <input
                            type="date"
                            value={fromDate}
                            onChange={(e) => setFromDate(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
                        <input
                            type="date"
                            value={toDate}
                            onChange={(e) => setToDate(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                </div>
                
                <div className="mt-4 flex justify-start">
                    <button
                        onClick={handleFetchReport}
                        className="bg-blue-900 text-white px-6 py-2 rounded-md hover:bg-blue-800 flex items-center gap-2"
                    >
                        <Search size={18} />
                        Show
                    </button>
                </div>
            </div>

            {/* Report Content */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                    <h2 className="text-lg font-semibold text-gray-700">
                        Cancellation Report - {getSelectedStoreName()} from {fromDate} to {toDate}
                    </h2>
                    <div className="flex gap-2">
                        <button onClick={handlePrint} className="p-2 text-blue-900 hover:bg-blue-50 rounded border border-blue-900" title="Print">
                            <Printer size={18} />
                        </button>
                        <button onClick={handleExport} className="p-2 text-blue-900 hover:bg-blue-50 rounded border border-blue-900" title="Export to Excel">
                            <Download size={18} />
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-600">
                        <thead className="text-xs text-white uppercase bg-blue-900">
                            <tr>
                                <th className="px-4 py-3">Bill No</th>
                                <th className="px-4 py-3">Ref</th>
                                <th className="px-4 py-3">Order Type</th>
                                <th className="px-4 py-3">POS</th>
                                <th className="px-4 py-3">Order Taken by</th>
                                <th className="px-4 py-3">Card User</th>
                                <th className="px-4 py-3">Date</th>
                                <th className="px-4 py-3">Reason</th>
                                <th className="px-4 py-3 text-right">Amount</th>
                                <th className="px-4 py-3">Order Placed Time</th>
                                <th className="px-4 py-3">Order Cancelled Time</th>
                                <th className="px-4 py-3">Payment Method</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="12" className="text-center py-4">Loading...</td>
                                </tr>
                            ) : error ? (
                                <tr>
                                    <td colSpan="12" className="text-center py-4 text-red-500">{error}</td>
                                </tr>
                            ) : reportData.length === 0 ? (
                                <tr>
                                    <td colSpan="12" className="text-center py-4">No data found</td>
                                </tr>
                            ) : (
                                <>
                                    {reportData.map((item, index) => (
                                        <tr key={index} className="border-b hover:bg-gray-50">
                                            <td className="px-4 py-3">{item.billNo}</td>
                                            <td className="px-4 py-3">{item.ref}</td>
                                            <td className="px-4 py-3">{item.orderType}</td>
                                            <td className="px-4 py-3">{item.pos}</td>
                                            <td className="px-4 py-3">{item.orderTakenBy}</td>
                                            <td className="px-4 py-3">{item.cardUser}</td>
                                            <td className="px-4 py-3">{item.date}</td>
                                            <td className="px-4 py-3">{item.reason}</td>
                                            <td className="px-4 py-3 text-right">{item.amount?.toFixed(2)}</td>
                                            <td className="px-4 py-3">{item.orderPlacedTime}</td>
                                            <td className="px-4 py-3">{item.orderCancelledTime}</td>
                                            <td className="px-4 py-3">{item.paymentMethod}</td>
                                        </tr>
                                    ))}
                                    {/* Total Row */}
                                    <tr className="bg-gray-100 font-bold border-t-2 border-gray-300">
                                        <td colSpan="8" className="px-4 py-3 text-left">Total</td>
                                        <td className="px-4 py-3 text-right">{totalAmount.toFixed(2)}</td>
                                        <td colSpan="3"></td>
                                    </tr>
                                </>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default CancellationReport;
