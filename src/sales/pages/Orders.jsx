import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Plus, Edit, Trash2, Loader2, Search, ChevronLeft, ChevronRight, Eye, X, FileText, Truck } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_BASE_URL;

const getStatusColor = (status) => {
    switch (status) {
        case 'DRAFT': return 'text-gray-600 bg-gray-100';
        case 'OPEN': return 'text-purple-600 bg-purple-100';
        case 'PARTIALLY_INVOICED': return 'text-orange-600 bg-orange-100';
        case 'INVOICED': return 'text-teal-600 bg-teal-100';
        case 'CANCELLED': return 'text-red-600 bg-red-100';
        default: return 'text-gray-600 bg-gray-100';
    }
};

const Orders = () => {
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Filter states
    const [customerName, setCustomerName] = useState('');
    const [fromDate, setFromDate] = useState(''); // Defaulting to 2025 as per screenshot suggestion
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
                customerName: customerName || undefined,
                startDate: fromDate || undefined,
                endDate: toDate || undefined,
                salespersonId: selectedTeamMember || undefined
            };
            // Note: Ensure backend supports these new params. If not, filtering might happen client-side or be ignored.
            const response = await axios.get(`${API_URL}/sales/orders`, { params, ...authHeaders });
            setOrders(response.data.content || []);
            setTotalPages(response.data.totalPages);
            setError(null);
        } catch (err) {
            setError('Failed to fetch sales orders. Please try again.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [currentPage, pageSize, authHeaders, customerName, fromDate, toDate, selectedTeamMember]);

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this sales order?')) {
            try {
                await axios.delete(`${API_URL}/sales/orders/${id}`, authHeaders);
                fetchOrders();
            } catch (err) {
                alert(`Error: ${err.response?.data?.message || 'Failed to delete sales order.'}`);
            }
        }
    };

    const handleView = (id) => {
        navigate(`/sales/orders/${id}`);
    };

    return (
        <div className="flex flex-col h-full bg-slate-50">
            {/* Header */}
            <div className="bg-primary p-4 flex justify-between items-center text-primary-foreground">
                <div>
                    <h1 className="text-xl font-semibold">Manage Sales Orders</h1>
                    <div className="text-sm opacity-80">Home &gt; Sales &gt; Manage Sales Orders</div>
                </div>
                <button onClick={() => navigate('/sales/orders/new')} className="bg-white text-gray-800 border border-gray-300 px-4 py-2 rounded text-sm hover:bg-gray-50 flex items-center gap-1 font-bold shadow-sm">
                    <Plus size={16} /> New Sales Order
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
                            <label className="block text-xs font-bold text-gray-700 mb-1">Team Members</label>
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
                                <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                                    <X className="h-3 w-3 text-gray-400 mr-1" />
                                </div>
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
                                    <th className="px-4 py-3 border-r">Sales Order</th>
                                    <th className="px-4 py-3 border-r">Shipment Date</th>
                                    <th className="px-4 py-3 border-r">Reference#</th>
                                    <th className="px-4 py-3 border-r">Customer Name</th>
                                    <th className="px-4 py-3 border-r">Customer PO No.</th>
                                    <th className="px-4 py-3 border-r">Status</th>
                                    <th className="px-4 py-3 border-r text-right">Sales Order Amt</th>
                                    <th className="px-4 py-3 border-r text-right">Invoiced Amt</th>
                                    <th className="px-4 py-3 border-r text-right">Balanced</th>
                                    <th className="px-4 py-3 border-r text-center w-24">Action</th>
                                    <th className="px-4 py-3 text-center">Delivery Challan</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan="13" className="text-center py-10"><Loader2 className="h-6 w-6 animate-spin mx-auto text-blue-500" /></td></tr>
                                ) : error ? (
                                    <tr><td colSpan="13" className="text-center py-10 text-red-500">{error}</td></tr>
                                ) : orders.length === 0 ? (
                                    <tr><td colSpan="13" className="text-center py-10 font-medium text-gray-500">No record available</td></tr>
                                ) : (
                                    orders.map((order, index) => {
                                        // Calculate dummy values if not present
                                        const invoicedAmount = order.invoicedAmount || 0;
                                        const balancedAmount = order.netTotal - invoicedAmount;
                                        const shipmentDate = order.shipmentDate ? new Date(order.shipmentDate).toLocaleDateString() : new Date(order.salesOrderDate).toLocaleDateString(); // Fallback

                                        return (
                                            <tr key={order.id} className="border-b hover:bg-gray-50 text-gray-700">
                                                <td className="px-4 py-2 border-r">{currentPage * pageSize + index + 1}</td>
                                                <td className="px-4 py-2 border-r">{new Date(order.salesOrderDate).toLocaleDateString()}</td>
                                                <td className="px-4 py-2 border-r">
                                                    <span
                                                        onClick={() => handleView(order.id)}
                                                        className="text-sky-600 cursor-pointer hover:underline font-medium"
                                                    >
                                                        {order.salesOrderNumber}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-2 border-r">{shipmentDate}</td>
                                                <td className="px-4 py-2 border-r">{order.reference || '-'}</td>
                                                <td className="px-4 py-2 border-r">{order.customerName || 'N/A'}</td>
                                                <td className="px-4 py-2 border-r">{order.customerPoNo || ''}</td>
                                                <td className="px-4 py-2 border-r font-medium">
                                                    <span className={`px-2 py-0.5 rounded text-[10px] ${getStatusColor(order.status)}`}>
                                                        {order.status === 'PARTIALLY_INVOICED' ? 'Partially Invoiced' :
                                                            order.status === 'OPEN' ? 'OPEN' : order.status}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-2 border-r text-right">AED {order.netTotal?.toLocaleString('en-AE', { minimumFractionDigits: 2 })}</td>
                                                <td className="px-4 py-2 border-r text-right">AED {invoicedAmount.toLocaleString('en-AE', { minimumFractionDigits: 2 })}</td>
                                                <td className="px-4 py-2 border-r text-right">AED {balancedAmount.toLocaleString('en-AE', { minimumFractionDigits: 2 })}</td>
                                                <td className="px-4 py-2 border-r text-center">
                                                    <div className="flex justify-center gap-1">
                                                        <button onClick={() => navigate(`/sales/orders/edit/${order.id}`)} className="p-1.5 bg-gray-700 text-white rounded hover:bg-gray-600 shadow-sm" title="Edit"><Edit size={12} /></button>
                                                        <button onClick={() => handleDelete(order.id)} className="p-1.5 bg-red-500 text-white rounded hover:bg-red-600 shadow-sm" title="Delete"><Trash2 size={12} /></button>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-2 text-center min-w-[190px]">
                                                    <div className="flex flex-col gap-1 items-center">
                                                        <div className="flex flex-col gap-1 items-center">
                                                            <button
                                                                onClick={() => navigate(`/sales/delivery-orders/new?salesOrderId=${order.id}`)}
                                                                className="w-full bg-blue-600 hover:bg-blue-700 text-white text-[10px] py-1 px-2 rounded shadow-sm font-medium transition-colors"
                                                            >
                                                                Add DO
                                                            </button>
                                                            <button
                                                                onClick={() => navigate(`/sales/invoices/new?salesOrderId=${order.id}`)}
                                                                className="w-full bg-cyan-600 hover:bg-cyan-700 text-white text-[10px] py-1 px-2 rounded shadow-sm font-medium transition-colors"
                                                            >
                                                                Add Invoice From DO
                                                            </button>
                                                            <button
                                                                onClick={() => navigate(`/sales/delivery-orders?salesOrderId=${order.id}`)}
                                                                className="w-full bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-[10px] py-1 px-2 rounded shadow-sm font-medium transition-colors"
                                                            >
                                                                View History of DO
                                                            </button>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                    <div className="p-2 border-t flex justify-between items-center text-xs text-gray-500">
                        <span>Showing {orders.length > 0 ? 1 : 0} to {orders.length} of {orders.length} entries</span>
                        <div className="flex gap-1">
                            <button className="px-2 py-1 border rounded hover:bg-gray-100" disabled>Previous</button>
                            <button className="px-2 py-1 bg-purple-900 text-white rounded">1</button>
                            <button className="px-2 py-1 border rounded hover:bg-gray-100">Next</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Orders;
