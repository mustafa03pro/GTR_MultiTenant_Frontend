import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Loader2, Search, ChevronLeft, ChevronRight, Eye, MousePointerClick } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_BASE_URL;

const RentalItemRecieved = () => {
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [orderStats, setOrderStats] = useState({}); // { [orderId]: { received: 0, remaining: 0, status: '' } }
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Fetch stats for loaded orders
    useEffect(() => {
        const fetchStats = async () => {
            if (orders.length === 0) return;

            const statsMap = {};
            const token = localStorage.getItem('token');
            const headers = { Authorization: `Bearer ${token}` };

            await Promise.all(orders.map(async (order) => {
                try {
                    const res = await axios.get(`${API_URL}/sales/rental-item-received/by-order/${order.id}`, { headers });
                    const logs = res.data || [];

                    let totalReceived = 0;
                    logs.forEach(log => {
                        log.items?.forEach(i => totalReceived += (i.currentReceiveQuantity || 0));
                    });

                    const totalOrdered = order.items?.reduce((acc, item) => acc + (item.quantity || 0), 0) || 0;
                    const remaining = Math.max(0, totalOrdered - totalReceived);

                    let status = 'PENDING';
                    if (totalReceived >= totalOrdered && totalOrdered > 0) status = 'FULLY_RETURNED';
                    else if (totalReceived > 0) status = 'PARTIAL_RETURNED';

                    statsMap[order.id] = { received: totalReceived, remaining: remaining, status: status };
                } catch (e) {
                    console.error(`Failed to fetch stats for order ${order.id}`, e);
                    // Fallback
                    statsMap[order.id] = { received: 0, remaining: order.items?.reduce((acc, item) => acc + (item.quantity || 0), 0) || 0, status: 'PENDING' };
                }
            }));

            setOrderStats(prev => ({ ...prev, ...statsMap }));
        };

        fetchStats();
    }, [orders]);

    // Filters
    const [filters, setFilters] = useState({
        customerName: '',
        fromDate: '',
        toDate: ''
    });

    const [currentPage, setCurrentPage] = useState(0);
    const [pageSize, setPageSize] = useState(10);
    const [totalPages, setTotalPages] = useState(0);

    const authHeaders = useMemo(() => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }), []);

    const fetchOrders = useCallback(async () => {
        setLoading(true);
        try {
            const params = {
                page: currentPage,
                size: pageSize,
                search: filters.customerName || null,
                fromDate: filters.fromDate || null,
                toDate: filters.toDate || null
            };

            const response = await axios.get(`${API_URL}/sales/rental-sales-orders`, { params, ...authHeaders });

            setOrders(response.data.content || []);
            setTotalPages(response.data.totalPages || 0);
            setError(null);
        } catch (err) {
            console.error("Error fetching orders:", err);
            setError('Failed to fetch data');
            setOrders([]);
        } finally {
            setLoading(false);
        }
    }, [currentPage, pageSize, filters, authHeaders]);

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
        setCurrentPage(0);
    };

    return (
        <div className="flex flex-col h-full bg-slate-50">
            {/* Header */}
            <div className="bg-primary p-4 flex justify-between items-center text-primary-foreground shadow-sm">
                <div>
                    <h1 className="text-xl font-bold">Manage Rental Items Return Pending</h1>
                    <div className="text-xs opacity-80 mt-1 flex items-center gap-1">
                        Home <span>&gt;</span> Sales <span>&gt;</span> Manage Rental Items Return Pending
                    </div>
                </div>
            </div>

            <div className="p-4 space-y-4 flex-grow overflow-auto">
                {/* Filters */}
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                        <div className='col-span-2'>
                            <label className="block text-xs font-bold text-gray-700 mb-1">Customer Name</label>
                            <input
                                type="text"
                                name="customerName"
                                value={filters.customerName}
                                onChange={handleFilterChange}
                                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                                placeholder="Search Customer..."
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1">From Date</label>
                            <input
                                type="date"
                                name="fromDate"
                                value={filters.fromDate}
                                onChange={handleFilterChange}
                                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                            />
                        </div>
                        <div>
                            <div className="flex gap-2">
                                <div className="w-full">
                                    <label className="block text-xs font-bold text-gray-700 mb-1">To Date</label>
                                    <input
                                        type="date"
                                        name="toDate"
                                        value={filters.toDate}
                                        onChange={handleFilterChange}
                                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                                    />
                                </div>
                                <button
                                    onClick={fetchOrders}
                                    className="mb-[1px] bg-primary text-white px-4 py-2 rounded font-bold text-sm hover:bg-opacity-90 transition-colors flex items-center justify-center gap-2 h-[38px] self-end"
                                >
                                    <Search size={16} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    {loading ? (
                        <div className="flex justify-center items-center p-8">
                            <Loader2 className="animate-spin text-primary h-8 w-8" />
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-gray-100 text-gray-700 font-bold border-b">
                                        <tr>
                                            <th className="px-4 py-3 border-r w-16 text-center">S.No.</th>
                                            <th className="px-4 py-3 border-r">Date</th>
                                            <th className="px-4 py-3 border-r">Due Date</th>
                                            <th className="px-4 py-3 border-r">DC No.</th>
                                            <th className="px-4 py-3 border-r">Reference No.</th>
                                            <th className="px-4 py-3 border-r">Customer Name</th>
                                            <th className="px-4 py-3 border-r text-center">Received Qty</th>
                                            <th className="px-4 py-3 border-r text-center">Remaining Qty</th>
                                            <th className="px-4 py-3 border-r text-center">Return Status</th>
                                            <th className="px-4 py-3 text-center w-48">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {orders.length === 0 ? (
                                            <tr><td colSpan="8" className="px-4 py-8 text-center text-gray-500">No records found</td></tr>
                                        ) : (
                                            orders.map((order, index) => {
                                                // Calculate stats from localized state if available, else fallback (though fallback is likely 0)
                                                // We'll trust the async fetched stats once they arrive.
                                                // Actually, let's inject the stats into the order object or use a lookup.
                                                // Since I'm using a separate state `orderStats`, I'll look it up.
                                                const stats = orderStats[order.id] || { received: 0, remaining: 0, status: 'PENDING' };

                                                // Fallback calculation from order items if stats not yet loaded (though likely 0)
                                                const totalOrdered = order.items?.reduce((acc, item) => acc + (item.quantity || 0), 0) || 0;
                                                // If we have stats, use them. If not, showing 0 is safer than showing misleading data from older logic.
                                                // But wait, initially stats are empty. User will see 0. Then it flickers to actual value.
                                                // That is acceptable.

                                                return (
                                                    <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                                                        <td className="px-4 py-3 text-center text-gray-500 border-r">{currentPage * pageSize + index + 1}</td>
                                                        <td className="px-4 py-3 text-gray-600 border-r">{order.orderDate ? new Date(order.orderDate).toLocaleDateString() : '-'}</td>
                                                        <td className="px-4 py-3 text-gray-600 border-r">{order.toDate ? new Date(order.toDate).toLocaleDateString() : '-'}</td>
                                                        <td className="px-4 py-3 text-gray-800 font-medium border-r cursor-pointer hover:text-blue-600 hover:underline" onClick={() => navigate(`/sales/rental-item-received/by-order/${order.id}`)}>{order.orderNumber}</td>
                                                        <td className="px-4 py-3 text-gray-600 border-r">{order.reference || '-'}</td>
                                                        <td className="px-4 py-3 font-medium text-gray-800 border-r">{order.customerName}</td>
                                                        <td className="px-4 py-3 text-center border-r font-medium text-blue-600">
                                                            {stats.received}
                                                        </td>
                                                        <td className="px-4 py-3 text-center border-r font-medium text-orange-600">
                                                            {Math.max(0, totalOrdered - stats.received)}
                                                        </td>
                                                        <td className="px-4 py-3 text-center border-r">
                                                            <span className={`px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wide border ${stats.status === 'FULLY_RETURNED' ? 'text-green-600 bg-green-100 border-green-200' :
                                                                stats.status === 'PARTIAL_RETURNED' ? 'text-amber-600 bg-amber-100 border-amber-200' :
                                                                    'text-gray-600 bg-gray-100 border-gray-200'
                                                                }`}>
                                                                {stats.status.replace('_', ' ')}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3 text-center">
                                                            <div className="flex flex-col gap-2">
                                                                <button
                                                                    onClick={() => navigate(`/sales/rental-item-received/new?orderId=${order.id}`)}
                                                                    className="w-full bg-primary text-white px-3 py-1.5 rounded text-xs hover:bg-opacity-90 flex items-center justify-center gap-2 transition-colors"
                                                                >
                                                                    <MousePointerClick size={14} /> Click To Receive Item
                                                                </button>
                                                                <button
                                                                    onClick={() => navigate(`/sales/rental-item-received/by-order/${order.id}`)}
                                                                    className="w-full border border-gray-300 bg-white text-gray-700 px-3 py-1.5 rounded text-xs hover:bg-gray-50 flex items-center justify-center gap-2 transition-colors"
                                                                >
                                                                    <Eye size={14} /> View Receive Item
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            <div className="p-4 border-t flex justify-between items-center text-xs text-gray-500 bg-gray-50">
                                <span>
                                    Showing {orders.length} of {totalPages * pageSize} entries
                                </span>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
                                        disabled={currentPage === 0}
                                        className="px-3 py-1 bg-white border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                                    >
                                        <ChevronLeft size={14} className="mr-1" /> Previous
                                    </button>
                                    <div className="flex gap-1">
                                        {[...Array(Math.min(5, totalPages))].map((_, i) => (
                                            <button
                                                key={i}
                                                onClick={() => setCurrentPage(i)}
                                                className={`w-8 h-8 flex items-center justify-center rounded border ${currentPage === i
                                                    ? 'bg-primary text-white border-primary'
                                                    : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                                                    }`}
                                            >
                                                {i + 1}
                                            </button>
                                        ))}
                                    </div>
                                    <button
                                        onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))}
                                        disabled={currentPage >= totalPages - 1}
                                        className="px-3 py-1 bg-white border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                                    >
                                        Next <ChevronRight size={14} className="ml-1" />
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default RentalItemRecieved;
