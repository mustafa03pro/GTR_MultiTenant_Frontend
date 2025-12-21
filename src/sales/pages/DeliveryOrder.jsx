import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { Plus, Edit, Trash2, Loader2, X, Eye } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_BASE_URL;

const getStatusColor = (status) => {
    switch (status) {
        case 'DRAFT': return 'text-gray-600 bg-gray-100';
        case 'OPEN': return 'text-purple-600 bg-purple-100';
        case 'DELIVERED': return 'text-teal-600 bg-teal-100';
        case 'CANCELLED': return 'text-red-600 bg-red-100';
        default: return 'text-gray-600 bg-gray-100';
    }
};

const DeliveryOrder = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const salesOrderIdParam = searchParams.get('salesOrderId');
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Filter states
    const [customerName, setCustomerName] = useState('');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [selectedTeamMember, setSelectedTeamMember] = useState('');
    const [employees, setEmployees] = useState([]);

    const [currentPage, setCurrentPage] = useState(0);
    const [pageSize, setPageSize] = useState(10);
    const [totalPages, setTotalPages] = useState(0);

    const authHeaders = useMemo(() => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }), []);

    const fetchEmployees = async () => {
        try {
            const response = await axios.get(`${API_URL}/employees/all`, authHeaders);
            setEmployees(response.data || []);
        } catch (err) {
            console.error("Failed to fetch employees", err);
        }
    };

    useEffect(() => {
        fetchEmployees();
    }, []);

    const fetchOrders = useCallback(async () => {
        setLoading(true);
        try {
            const params = {
                page: currentPage,
                size: pageSize,
                customerName: customerName,
                startDate: fromDate,
                endDate: toDate,
                salespersonId: selectedTeamMember,
                salesOrderId: salesOrderIdParam
            };

            const response = await axios.get(`${API_URL}/sales/delivery-orders`, { params, ...authHeaders });
            setOrders(response.data.content || []);
            setTotalPages(response.data.totalPages);
            setError(null);
        } catch (err) {
            setError('Failed to fetch delivery orders. Please try again.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [currentPage, pageSize, authHeaders, customerName, fromDate, toDate, selectedTeamMember, salesOrderIdParam]);

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this delivery order?')) {
            try {
                await axios.delete(`${API_URL}/sales/delivery-orders/${id}`, authHeaders);
                fetchOrders();
            } catch (err) {
                alert(`Error: ${err.response?.data?.message || 'Failed to delete delivery order.'}`);
            }
        }
    };

    const handleView = (id) => {
        navigate(`/sales/delivery-orders/${id}`);
    };

    return (
        <div className="flex flex-col h-full bg-slate-50">
            {/* Header */}
            <div className="bg-primary p-4 flex justify-between items-center text-primary-foreground">
                <div>
                    <h1 className="text-xl font-semibold">Manage Delivery Orders</h1>
                    <div className="text-sm opacity-80">Home &gt; Sales &gt; Manage Delivery Orders</div>
                </div>
                <button onClick={() => navigate('/sales/delivery-orders/new')} className="bg-white text-gray-800 border border-gray-300 px-4 py-2 rounded text-sm hover:bg-gray-50 flex items-center gap-1 font-bold shadow-sm">
                    <Plus size={16} /> New Delivery Order
                </button>
            </div>

            <div className="p-4 space-y-4">
                {/* Filters Section */}
                <div className="bg-white p-4 rounded shadow-sm border border-gray-200">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4 items-end">
                        <div className="md:col-span-1">
                            <label className="block text-xs font-bold text-gray-700 mb-1">Customer Name</label>
                            <input
                                type="text"
                                className="w-full text-sm border border-gray-300 rounded px-2 py-1.5 focus:outline-none focus:border-blue-500"
                                placeholder="Search Customer"
                                value={customerName}
                                onChange={(e) => setCustomerName(e.target.value)}
                            />
                        </div>
                        <div className="md:col-span-1">
                            <label className="block text-xs font-bold text-gray-700 mb-1">From</label>
                            <input
                                type="date"
                                className="w-full text-sm border border-gray-300 rounded px-2 py-1.5 focus:outline-none focus:border-blue-500"
                                value={fromDate}
                                onChange={(e) => setFromDate(e.target.value)}
                            />
                        </div>
                        <div className="md:col-span-1">
                            <label className="block text-xs font-bold text-gray-700 mb-1">To</label>
                            <input
                                type="date"
                                className="w-full text-sm border border-gray-300 rounded px-2 py-1.5 focus:outline-none focus:border-blue-500"
                                value={toDate}
                                onChange={(e) => setToDate(e.target.value)}
                            />
                        </div>
                        <div className="md:col-span-1">
                            <button
                                onClick={fetchOrders}
                                className="bg-primary text-white text-sm font-medium px-6 py-1.5 rounded hover:bg-violet-800 focus:outline-none w-full md:w-auto"
                            >
                                Search
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                        <div className="md:col-span-1">
                            <label className="block text-xs font-bold text-gray-700 mb-1">Sales Person</label>
                            <div className="relative">
                                <select
                                    className="w-full text-sm border border-gray-300 rounded px-2 py-1.5 focus:outline-none focus:border-blue-500 appearance-none bg-white"
                                    value={selectedTeamMember}
                                    onChange={(e) => setSelectedTeamMember(e.target.value)}
                                >
                                    <option value="">All Sales Persons</option>
                                    {employees.map(e => (
                                        <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white rounded shadow-sm border border-gray-200 overflow-hidden">
                    <div className="p-2 border-b flex items-center gap-2">
                        <select
                            className="border border-gray-300 rounded px-2 py-1 text-xs"
                            value={pageSize}
                            onChange={(e) => setPageSize(Number(e.target.value))}
                        >
                            <option value={10}>10</option>
                            <option value={25}>25</option>
                            <option value={50}>50</option>
                        </select>
                        <div className="flex-grow"></div>
                        <input
                            type="text"
                            placeholder="Search..."
                            className="border border-gray-300 rounded px-2 py-1 text-xs"
                        />
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs text-left">
                            <thead className="bg-gray-100 text-gray-700 font-bold border-b">
                                <tr>
                                    <th className="px-4 py-3 border-r w-16">S.No.</th>
                                    <th className="px-4 py-3 border-r">Date</th>
                                    <th className="px-4 py-3 border-r">DO Number</th>
                                    <th className="px-4 py-3 border-r">Sales Order</th>
                                    <th className="px-4 py-3 border-r">Customer Name</th>
                                    <th className="px-4 py-3 border-r">Reference#</th>
                                    <th className="px-4 py-3 border-r">Status</th>
                                    <th className="px-4 py-3 border-r text-right">Net Total</th>
                                    <th className="px-4 py-3 border-r text-center w-24">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan="9" className="text-center py-10"><Loader2 className="h-6 w-6 animate-spin mx-auto text-blue-500" /></td></tr>
                                ) : error ? (
                                    <tr><td colSpan="9" className="text-center py-10 text-red-500">{error}</td></tr>
                                ) : orders.length === 0 ? (
                                    <tr><td colSpan="9" className="text-center py-10 font-medium text-gray-500">No record available</td></tr>
                                ) : (
                                    orders.map((order, index) => (
                                        <tr key={order.id} className="border-b hover:bg-gray-50 text-gray-700">
                                            <td className="px-4 py-2 border-r">{currentPage * pageSize + index + 1}</td>
                                            <td className="px-4 py-2 border-r">{new Date(order.deliveryOrderDate).toLocaleDateString()}</td>
                                            <td className="px-4 py-2 border-r">
                                                <span
                                                    onClick={() => handleView(order.id)}
                                                    className="text-sky-600 cursor-pointer hover:underline font-medium"
                                                >
                                                    {order.deliveryOrderNumber}
                                                </span>
                                            </td>
                                            <td className="px-4 py-2 border-r">{order.salesOrderNumber || '-'}</td>
                                            <td className="px-4 py-2 border-r">{order.customerName || 'N/A'}</td>
                                            <td className="px-4 py-2 border-r">{order.reference || '-'}</td>
                                            <td className="px-4 py-2 border-r font-medium">
                                                <span className={`px-2 py-0.5 rounded text-[10px] ${getStatusColor(order.status)}`}>
                                                    {order.status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-2 border-r text-right">AED {order.netTotal?.toLocaleString('en-AE', { minimumFractionDigits: 2 })}</td>
                                            <td className="px-4 py-2 border-r text-center">
                                                <div className="flex justify-center gap-1">
                                                    <button onClick={() => navigate(`/sales/delivery-orders/edit/${order.id}`)} className="p-1.5 bg-gray-700 text-white rounded hover:bg-gray-600 shadow-sm" title="Edit"><Edit size={12} /></button>
                                                    <button onClick={() => handleView(order.id)} className="p-1.5 bg-blue-500 text-white rounded hover:bg-blue-600 shadow-sm" title="View"><Eye size={12} /></button>
                                                    <button onClick={() => handleDelete(order.id)} className="p-1.5 bg-red-500 text-white rounded hover:bg-red-600 shadow-sm" title="Delete"><Trash2 size={12} /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                    <div className="p-2 border-t flex justify-between items-center text-xs text-gray-500">
                        <span>Showing {orders.length > 0 ? 1 : 0} to {orders.length} of {orders.length} entries</span>
                        <div className="flex gap-1">
                            <button
                                className="px-2 py-1 border rounded hover:bg-gray-100 disabled:opacity-50"
                                onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                                disabled={currentPage === 0}
                            >
                                Previous
                            </button>
                            <span className="px-2 py-1 bg-purple-900 text-white rounded">{currentPage + 1}</span>
                            <button
                                className="px-2 py-1 border rounded hover:bg-gray-100 disabled:opacity-50"
                                onClick={() => setCurrentPage(p => p + 1)}
                                disabled={currentPage >= totalPages - 1}
                            >
                                Next
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DeliveryOrder;
