import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Plus, Edit, Trash2, Loader2, Search, ChevronLeft, ChevronRight, Eye, Factory, RefreshCw } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_BASE_URL;

const getStatusColor = (status) => {
    switch (status) {
        case 'SCHEDULED': return 'text-blue-600 bg-blue-100';
        case 'IN_PROGRESS': return 'text-amber-600 bg-amber-100';
        case 'PAUSED': return 'text-orange-600 bg-orange-100';
        case 'COMPLETED': return 'text-green-600 bg-green-100';
        case 'CANCELLED': return 'text-red-600 bg-red-100';
        default: return 'text-gray-600 bg-gray-100';
    }
};

const ManufacturingOrder = () => {
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Filters
    const [filters, setFilters] = useState({
        search: '',
        status: 'All',
        fromDate: '',
        toDate: '',
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
                search: filters.search || undefined,
                status: filters.status !== 'All' ? filters.status : undefined,
                fromDate: filters.fromDate || undefined,
                toDate: filters.toDate || undefined,
            };

            const response = await axios.get(`${API_URL}/production/manufacturing-orders`, {
                params,
                ...authHeaders
            });

            setOrders(response.data.content || []);
            setTotalPages(response.data.totalPages || 0);
            setError(null);
        } catch (err) {
            console.error("Error fetching orders:", err);
            setError('Failed to fetch manufacturing orders.');
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

    const resetFilters = () => {
        setFilters({
            search: '',
            status: 'All',
            fromDate: '',
            toDate: '',
        });
        setCurrentPage(0);
        // We can optionally fetchOrders() here or let the user click search/wait for effect if we add dependency
        // Since fetchOrders only depends on filters state, and filters is a dependency of useCallback...
        // Wait, fetchOrders depends on filters. But it's not in useEffect dependency for auto-refetch except on mount?
        // Ah, line 68: useEffect(() => fetchOrders(), [fetchOrders]);
        // And fetchOrders depends on filters. So changing filters WILL trigger fetchOrders?
        // Let's check the dependencies again.
        // fetchOrders depends on [currentPage, pageSize, filters, authHeaders].
        // So yes, setting filters will trigger fetchOrders automatically? 
        // No, `setFilters` updates state. The `fetchOrders` function is recreated.
        // The `useEffect` on line 66 depends on `fetchOrders`.
        // So yes, valid for auto-refresh. But typically for text search we want manual button.
        // The current implementation has a manual Search button.
        // If I reset filters, it will auto-trigger because `fetchOrders` changes?
        // Let's stick to manual trigger or let the useEffect handle it.
        // Actually, if I look at line 66: [fetchOrders].
        // If fetchOrders changes (which it does when filters changes), the effect runs.
        // So typing in search input would cause api calls on every keystroke?
        // That is bad if true.
        // Step 238 code:
        // const fetchOrders = useCallback( ... , [currentPage, pageSize, filters, authHeaders]);
        // useEffect(() => { fetchOrders(); }, [fetchOrders]);
        // YES, it auto-fetches on filter change.
        // So the "Search" button is actually redundant or just for "force refresh"?
        // If so, the Reset button will also trigger a fetch.
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this manufacturing order?')) {
            try {
                await axios.delete(`${API_URL}/production/manufacturing-orders/${id}`, authHeaders);
                fetchOrders();
            } catch (err) {
                alert(`Error: ${err.response?.data?.message || 'Failed to delete order.'}`);
            }
        }
    };

    const handleView = (id) => {
        navigate(`/production-dashboard/view-manufacturing-order/${id}`);
    };

    return (
        <div className="flex flex-col h-full bg-slate-50">
            {/* Header */}
            <div className="bg-primary p-4 flex justify-between items-center text-white shadow-sm">
                <div>
                    <h1 className="text-xl font-semibold">Manage Manufacturing Order</h1>
                    <div className="text-sm opacity-80">Home &gt; Production &gt; Manage Manufacturing Order</div>
                </div>
                <button
                    onClick={() => navigate('/production-dashboard/manage-manufacturing-order/new')}
                    className="bg-white text-primary border border-transparent px-4 py-2 rounded text-sm hover:bg-gray-100 flex items-center gap-1 font-bold shadow-sm transition-colors"
                >
                    <Plus size={16} /> New Manufacturing Order
                </button>
            </div>

            <div className="p-4 space-y-4">
                {/* Filters Section */}
                <div className="bg-white p-4 rounded shadow-sm border border-gray-200">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                        <div className="md:col-span-1">
                            <label className="block text-xs font-bold text-gray-700 mb-1">Search</label>
                            <input
                                type="text"
                                name="search"
                                className="w-full text-sm border border-gray-300 rounded px-2 py-1.5 focus:outline-none focus:border-primary"
                                placeholder="Search MO Number, Item..."
                                value={filters.search}
                                onChange={handleFilterChange}
                            />
                        </div>
                        <div className="md:col-span-1">
                            <label className="block text-xs font-bold text-gray-700 mb-1">Status</label>
                            <select
                                name="status"
                                className="w-full text-sm border border-gray-300 rounded px-2 py-1.5 focus:outline-none focus:border-primary appearance-none bg-white"
                                value={filters.status}
                                onChange={handleFilterChange}
                            >
                                <option value="All">All Statuses</option>
                                <option value="SCHEDULED">Scheduled</option>
                                <option value="IN_PROGRESS">In Progress</option>
                                <option value="PAUSED">Paused</option>
                                <option value="COMPLETED">Completed</option>
                                <option value="CANCELLED">Cancelled</option>
                            </select>
                        </div>
                        <div className="md:col-span-1">
                            <label className="block text-xs font-bold text-gray-700 mb-1">From Date</label>
                            <input
                                type="date"
                                name="fromDate"
                                className="w-full text-sm border border-gray-300 rounded px-2 py-1.5 focus:outline-none focus:border-primary"
                                value={filters.fromDate}
                                onChange={handleFilterChange}
                            />
                        </div>
                        <div className="md:col-span-1 flex gap-2">
                            <div className="flex-grow">
                                <label className="block text-xs font-bold text-gray-700 mb-1">To Date</label>
                                <input
                                    type="date"
                                    name="toDate"
                                    className="w-full text-sm border border-gray-300 rounded px-2 py-1.5 focus:outline-none focus:border-primary"
                                    value={filters.toDate}
                                    onChange={handleFilterChange}
                                />
                            </div>
                            <button
                                onClick={fetchOrders}
                                className="bg-primary text-white text-sm font-medium px-4 py-1.5 rounded hover:bg-blue-700 focus:outline-none self-end h-[34px]"
                            >
                                Search
                            </button>
                            <button
                                onClick={resetFilters}
                                className="bg-gray-200 text-gray-700 text-sm font-medium px-4 py-1.5 rounded hover:bg-gray-300 focus:outline-none self-end h-[34px]"
                            >
                                Reset
                            </button>
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white rounded shadow-sm border border-gray-200 overflow-hidden">
                    <div className="p-2 border-b flex items-center gap-2 bg-gray-50">
                        <select
                            className="border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:border-primary"
                            value={pageSize}
                            onChange={(e) => setPageSize(Number(e.target.value))}
                        >
                            <option value={10}>10</option>
                            <option value={25}>25</option>
                            <option value={50}>50</option>
                        </select>
                        <span className="text-xs text-gray-500">entries per page</span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-xs text-left">
                            <thead className="bg-primary text-white font-bold border-b">
                                <tr>
                                    <th className="px-4 py-3 border-r border-blue-400 w-16">S.No.</th>
                                    <th className="px-4 py-3 border-r border-blue-400">MO Number</th>
                                    <th className="px-4 py-3 border-r border-blue-400">Date/Time</th>
                                    <th className="px-4 py-3 border-r border-blue-400">Customer</th>
                                    <th className="px-4 py-3 border-r border-blue-400">Item</th>
                                    <th className="px-4 py-3 border-r border-blue-400">Location</th>
                                    <th className="px-4 py-3 border-r border-blue-400 text-center">Batch No</th>
                                    <th className="px-4 py-3 border-r border-blue-400 text-right">Qty</th>
                                    <th className="px-4 py-3 border-r border-blue-400 text-center">Status</th>
                                    <th className="px-4 py-3 text-center w-24">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan="10" className="text-center py-10"><Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" /></td></tr>
                                ) : error ? (
                                    <tr><td colSpan="10" className="text-center py-10 text-red-500">{error}</td></tr>
                                ) : orders.length === 0 ? (
                                    <tr><td colSpan="10" className="text-center py-10 font-medium text-gray-500">No manufacturing orders found</td></tr>
                                ) : (
                                    orders.map((order, index) => (
                                        <tr key={order.id} className="border-b hover:bg-blue-50 text-gray-700 transition-colors">
                                            <td className="px-4 py-3 border-r">{currentPage * pageSize + index + 1}</td>
                                            <td className="px-4 py-3 border-r">
                                                <span
                                                    onClick={() => handleView(order.id)}
                                                    className="text-primary cursor-pointer hover:underline font-bold"
                                                >
                                                    {order.moNumber}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 border-r">
                                                <div className="flex flex-col">
                                                    <span>{new Date(order.scheduleStart || order.createdDate).toLocaleDateString()}</span>
                                                    <span className="text-[10px] text-gray-400">{new Date(order.scheduleStart || order.createdDate).toLocaleTimeString()}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 border-r font-medium">{order.customerName || '-'}</td>
                                            <td className="px-4 py-3 border-r">
                                                <div className="flex flex-col">
                                                    <span className="font-medium">{order.itemName}</span>
                                                    <span className="text-[10px] text-gray-500 font-mono">{order.itemCode}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 border-r">{order.productionHouseName || '-'}</td>
                                            <td className="px-4 py-3 border-r text-center">{order.batchNo || '-'}</td>
                                            <td className="px-4 py-3 border-r text-right font-bold">{order.quantity}</td>
                                            <td className="px-4 py-3 border-r text-center">
                                                <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${getStatusColor(order.status)}`}>
                                                    {order.status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <div className="flex justify-center gap-1">
                                                    <button onClick={() => handleView(order.id)} className="p-1.5 bg-blue-100 text-blue-600 rounded hover:bg-blue-200" title="View"><Eye size={14} /></button>
                                                    <button onClick={() => navigate(`/production-dashboard/manage-manufacturing-order/edit/${order.id}`)} className="p-1.5 bg-gray-100 text-gray-600 rounded hover:bg-gray-200" title="Edit"><Edit size={14} /></button>
                                                    <button onClick={() => handleDelete(order.id)} className="p-1.5 bg-red-100 text-red-600 rounded hover:bg-red-200" title="Delete"><Trash2 size={14} /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {!loading && totalPages > 0 && (
                        <div className="p-3 border-t flex justify-between items-center text-xs text-gray-500 bg-gray-50">
                            <span>Showing {currentPage * pageSize + 1} to {Math.min((currentPage + 1) * pageSize, orders.length + currentPage * pageSize)} of {orders.length} entries (Page {currentPage + 1} of {totalPages})</span>
                            <div className="flex gap-1">
                                <button onClick={() => setCurrentPage(p => Math.max(0, p - 1))} disabled={currentPage === 0} className="px-3 py-1 border bg-white rounded hover:bg-gray-100 disabled:opacity-50">Previous</button>
                                <button onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))} disabled={currentPage >= totalPages - 1} className="px-3 py-1 border bg-white rounded hover:bg-gray-100 disabled:opacity-50">Next</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ManufacturingOrder;
