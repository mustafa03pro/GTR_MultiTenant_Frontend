import React, { useState, useRef } from 'react';
import axios from 'axios';
import { Loader, Printer, FileText, Download } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

const SalesStatusReport = () => {
    const [loading, setLoading] = useState(false);
    
    // Filters
    const [status, setStatus] = useState('');
    const [fromDate, setFromDate] = useState(new Date().toISOString().split('T')[0]);
    const [toDate, setToDate] = useState(new Date().toISOString().split('T')[0]);

    const [data, setData] = useState([]);

    const handleSearch = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}/pos/reports/sales-status-report`, {
                headers: { "Authorization": `Bearer ${token}` },
                params: {
                    fromDate,
                    toDate,
                    status: status || null
                }
            });
            // Handle both flat list or grouped object if backend changes. 
            // Assuming flat list based on DTO, but might be grouped based on "Users Task Reports" header in image.
            // For now, handling as array.
            if (Array.isArray(response.data)) {
                setData(response.data);
            } else {
                setData([]); // Or handle object structure if needed
            }
        } catch (error) {
            console.error("Error fetching sales status report:", error);
            // Mock data for UI Testing since backend throws exception currently
            // setData([
            //     { orderNo: 'ORD-001', carNo: 'ABC-123', status: 'Completed', orderDate: '2025-08-03', deliveredTime: '10:00:00', totalAmount: 150.00, paymentType: 'Cash' }
            // ]);
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
            'Order No', 'Car No', 'Status', 'Order Date', 'Delivered Time', 'Total Amount', 'Payment Type'
        ];

        const csvRows = [
            headers.join(','),
            ...data.map(item => [
                item.orderNo,
                item.carNo,
                item.status,
                item.orderDate,
                item.deliveredTime,
                item.totalAmount,
                item.paymentType
            ].join(','))
        ];

        const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Sales_Status_Report_${fromDate}_to_${toDate}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    };

    return (
        <div className="p-6 bg-slate-50 min-h-screen font-sans text-slate-800">
            <h1 className="text-2xl font-bold mb-6 text-slate-800">Sales Status Reports</h1>

            {/* Filters */}
            <div className="bg-white p-6 rounded-lg shadow mb-6 border border-slate-200">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Status:</label>
                        <select 
                            className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                        >
                            <option value="">All Statuses</option>
                            <option value="Completed">Completed</option>
                            <option value="Pending">Pending</option>
                            <option value="Cancelled">Cancelled</option>
                            <option value="Car Wash">Car Wash</option>
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
            <div className="bg-white rounded-lg shadow border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                     <h3 className="text-blue-900 font-bold text-sm">
                        Users Task Reports ({fromDate} - {toDate})
                    </h3>
                    <div className="flex gap-2">
                        <button onClick={handlePrint} className="bg-blue-900 text-white p-2 rounded hover:bg-blue-800 transition" title="Print">
                            <Printer size={16} />
                        </button>
                        <button onClick={handleExportCSV} className="bg-blue-900 text-white p-2 rounded hover:bg-blue-800 transition" title="Export CSV">
                            <FileText size={16} />
                        </button>
                         <button className="bg-blue-900 text-white p-2 rounded hover:bg-blue-800 transition" title="Export PDF">
                             <Download size={16} />
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
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
                                <th className="px-4 py-3">Order No</th>
                                <th className="px-4 py-3">Car No.</th>
                                <th className="px-4 py-3">Status</th>
                                <th className="px-4 py-3">Order Date</th>
                                <th className="px-4 py-3">Delivered Time</th>
                                <th className="px-4 py-3">Total Amount</th>
                                <th className="px-4 py-3">Payment Type</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan="7" className="px-4 py-8 text-center text-slate-500">
                                        <div className="flex justify-center items-center gap-2">
                                            <Loader className="animate-spin text-blue-600" size={20} /> Loading...
                                        </div>
                                    </td>
                                </tr>
                            ) : data.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="px-4 py-8 text-left text-slate-500 bg-slate-50">No Delivered Orders</td>
                                </tr>
                            ) : (
                                data.map((item, index) => (
                                    <tr key={index} className="hover:bg-slate-50 transition">
                                        <td className="px-4 py-2 border-r border-slate-100">{item.orderNo}</td>
                                        <td className="px-4 py-2 border-r border-slate-100">{item.carNo}</td>
                                        <td className="px-4 py-2 border-r border-slate-100">{item.status}</td>
                                        <td className="px-4 py-2 border-r border-slate-100">{item.orderDate}</td>
                                        <td className="px-4 py-2 border-r border-slate-100">{item.deliveredTime}</td>
                                        <td className="px-4 py-2 border-r border-slate-100">{item.totalAmount?.toFixed(2)}</td>
                                        <td className="px-4 py-2">{item.paymentType}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default SalesStatusReport;
