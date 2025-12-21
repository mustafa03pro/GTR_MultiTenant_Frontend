import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Plus, Loader2, User, Monitor, Edit, Trash2 } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_BASE_URL;

const getStatusColor = (status) => {
    switch (status) {
        case 'DRAFT': return 'text-gray-600 bg-gray-100';
        case 'SENT': return 'text-blue-600 bg-blue-100';
        case 'ACCEPTED': return 'text-green-600 bg-green-100';
        case 'REJECTED': return 'text-red-600 bg-red-100';
        case 'INVOICED': return 'text-purple-600 bg-purple-100';
        case 'RENTAL_INVOICED': return 'text-purple-600 bg-purple-100';
        case 'CANCELLED': return 'text-orange-600 bg-orange-100';
        default: return 'text-gray-600 bg-gray-100';
    }
};

import PaymentScheduleModal from '../components/PaymentScheduleModal';

const RentalSalesOrder = () => {
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Modal State
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);

    // Filters
    const [filters, setFilters] = useState({
        customerName: '',
        fromDate: '',
        toDate: '',
        status: 'All',
        teamMember: ''
    });

    const [currentPage, setCurrentPage] = useState(0);
    const [pageSize, setPageSize] = useState(10);
    const [totalPages, setTotalPages] = useState(0);

    const authHeaders = useMemo(() => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }), []);

    const fetchEmployees = useCallback(async () => {
        try {
            const response = await axios.get(`${API_URL}/employees/all`, authHeaders);
            setEmployees(response.data || []);
        } catch (err) {
            console.error("Failed to fetch employees", err);
        }
    }, [authHeaders]);

    const fetchOrders = useCallback(async () => {
        setLoading(true);
        try {
            const params = {
                page: currentPage,
                size: pageSize,
                search: filters.customerName,
                fromDate: filters.fromDate,
                toDate: filters.toDate,
                status: filters.status !== 'All' ? filters.status : null,
                salespersonId: filters.teamMember
            };
            const response = await axios.get(`${API_URL}/sales/rental-sales-orders`, { params, ...authHeaders });
            let fetchedOrders = response.data.content || [];

            // Extract unique customer IDs
            const customerIds = [...new Set(fetchedOrders.map(q => q.customerId).filter(id => id))];

            // Fetch party details for each customer ID to ensure we have latest names/contacts
            if (customerIds.length > 0) {
                const partyPromises = customerIds.map(id =>
                    axios.get(`${API_URL}/parties/${id}`, authHeaders)
                        .then(res => ({ id, data: res.data }))
                        .catch(err => ({ id, data: null }))
                );

                const parties = await Promise.all(partyPromises);
                const partyMap = parties.reduce((acc, curr) => {
                    if (curr.data) acc[curr.id] = curr.data;
                    return acc;
                }, {});

                fetchedOrders = fetchedOrders.map(q => ({
                    ...q,
                    customerParty: partyMap[q.customerId] || q.customerParty
                }));
            }

            setOrders(fetchedOrders);
            setTotalPages(response.data.totalPages);
            setError(null);
        } catch (err) {
            setError('Failed to fetch rental sales orders. Please try again.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [currentPage, pageSize, filters, authHeaders]);

    useEffect(() => {
        fetchEmployees();
    }, [fetchEmployees]);

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
        setCurrentPage(0);
    };

    const handleOpenPaymentSchedule = (order) => {
        console.log("Setting selected order:", order);
        setSelectedOrder(order);
        setIsPaymentModalOpen(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this rental sales order?')) {
            try {
                await axios.delete(`${API_URL}/sales/rental-sales-orders/${id}`, authHeaders);
                fetchOrders();
            } catch (err) {
                alert(`Error: ${err.response?.data?.message || 'Failed to delete order.'}`);
            }
        }
    };

    return (
        <div className="flex flex-col h-full bg-slate-50">
            {/* Header */}
            <div className="bg-primary p-4 flex justify-between items-center text-primary-foreground">
                <div>
                    <h1 className="text-xl font-semibold">Manage Rental Sales Order</h1>
                    <div className="text-sm opacity-80">Home &gt; Sales &gt; Manage Rental Sales Order</div>
                </div>
            </div>

            <div className="p-4 space-y-4">
                {/* Filters Section */}
                <div className="bg-white p-4 rounded shadow-sm border border-gray-200">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4 items-end">
                        <div className='col-span-2'>
                            <label className="block text-xs font-bold text-gray-700 mb-1">Customer Name</label>
                            <input type="text" name="customerName" value={filters.customerName} onChange={handleFilterChange} className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm" placeholder="Search Customer" />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1">From</label>
                            <input type="date" name="fromDate" value={filters.fromDate} onChange={handleFilterChange} className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1">To</label>
                            <input type="date" name="toDate" value={filters.toDate} onChange={handleFilterChange} className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm" />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                        <div className='col-span-2'>
                            <label className="block text-xs font-bold text-gray-700 mb-1">Team Members</label>
                            <div className="relative">
                                <select name="teamMember" value={filters.teamMember} onChange={handleFilterChange} className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm bg-white">
                                    <option value="">Select Team Member</option>
                                    {employees.map(emp => (
                                        <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div>
                            <button onClick={fetchOrders} className="bg-primary text-white px-6 py-1.5 rounded text-sm hover:bg-violet-900 font-medium">Search</button>
                        </div>
                        <div className="flex justify-end">
                            <button onClick={() => navigate('/sales/rental-sales-orders/new')} className="bg-primary text-primary-foreground px-4 py-1.5 rounded text-sm hover:bg-violet-900 flex items-center gap-1 font-medium">
                                <Plus size={14} /> New Rental Sales Order
                            </button>
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white rounded shadow-sm border border-gray-200 overflow-hidden">
                    <div className="p-2 border-b flex justify-between items-center">
                        <div className='flex items-center gap-2'>
                            <span className="text-xs font-bold text-gray-700">Page Size</span>
                            <select value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))} className="border border-gray-300 rounded px-2 py-1 text-xs">
                                <option value="10">10</option>
                                <option value="25">25</option>
                                <option value="50">50</option>
                            </select>
                            <span className="text-xs text-gray-500">Total Records {orders.length}</span>
                        </div>

                        <div className="flex-grow"></div>
                        <input type="text" placeholder="Search..." className="border border-gray-300 rounded px-2 py-1 text-xs w-48" />
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs text-left">
                            <thead className="bg-[#E0E0E0] text-gray-700 font-bold border-b">
                                <tr>
                                    <th className="px-4 py-3 border-r">S.No.</th>
                                    <th className="px-4 py-3 border-r">Date</th>
                                    <th className="px-4 py-3 border-r">Rental Sales Order</th>
                                    <th className="px-4 py-3 border-r">Shipment Date</th>
                                    <th className="px-4 py-3 border-r">Reference#</th>
                                    <th className="px-4 py-3 border-r">Customer Name</th>
                                    <th className="px-4 py-3 border-r">Status</th>
                                    <th className="px-4 py-3 border-r text-right">Sales order amount</th>
                                    <th className="px-4 py-3 border-r text-right">Invoiced amount</th>
                                    <th className="px-4 py-3 border-r text-right">Balanced</th>
                                    <th className="px-4 py-3 text-center">Operation</th>
                                    <th className="px-4 py-3 text-center">Delivery Challan</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan="12" className="text-center py-10"><Loader2 className="h-6 w-6 animate-spin mx-auto text-blue-500" /></td></tr>
                                ) : error ? (
                                    <tr><td colSpan="12" className="text-center py-10 text-red-500">{error}</td></tr>
                                ) : orders.length === 0 ? (
                                    <tr><td colSpan="12" className="text-center py-10 font-medium text-gray-500">No record available</td></tr>
                                ) : (
                                    orders.map((order, index) => (
                                        <tr key={order.id} className="border-b hover:bg-gray-50 text-gray-700">
                                            <td className="px-4 py-2 border-r">{currentPage * pageSize + index + 1}</td>
                                            <td className="px-4 py-2 border-r">{order.orderDate ? new Date(order.orderDate).toLocaleDateString() : '-'}</td>
                                            <td className="px-4 py-2 border-r text-sky-600 cursor-pointer hover:underline font-medium" onClick={() => navigate(`/sales/rental-sales-orders/${order.id}`)}>{order.orderNumber}</td>
                                            <td className="px-4 py-2 border-r">{order.shipmentDate ? new Date(order.shipmentDate).toLocaleDateString() : '-'}</td>
                                            <td className="px-4 py-2 border-r">{order.reference || '-'}</td>
                                            <td className="px-4 py-2 border-r">{order.customerParty?.companyName || order.customerName || 'N/A'}</td>
                                            <td className="px-4 py-2 border-r font-medium">
                                                <span className={`px-2 py-0.5 rounded text-[10px] ${getStatusColor(order.status)}`}>{order.status}</span>
                                            </td>
                                            <td className="px-4 py-2 border-r font-medium text-right">AED {order.netTotal?.toLocaleString('en-AE', { minimumFractionDigits: 2 }) || '0.00'}</td>
                                            <td className="px-4 py-2 border-r text-right">AED 0.00</td>
                                            <td className="px-4 py-2 border-r text-right">AED {order.netTotal?.toLocaleString('en-AE', { minimumFractionDigits: 2 }) || '0.00'}</td>
                                            <td className="px-4 py-2 border-r text-center">
                                                <div className="flex flex-col gap-1 items-center">
                                                    <button onClick={() => handleOpenPaymentSchedule(order)} className="border border-gray-300 bg-white px-2 py-1 text-[10px] rounded hover:bg-gray-50 w-full">Payment Schedule</button>
                                                    <div className="flex gap-1 w-full">
                                                        <button onClick={() => navigate(`/sales/rental-sales-orders/edit/${order.id}`)} className="flex-1 bg-blue-50 text-blue-600 border border-blue-200 px-2 py-1 text-[10px] rounded hover:bg-blue-100 flex justify-center items-center gap-1"><Edit size={12} /> Update</button>
                                                        <button onClick={() => handleDelete(order.id)} className="flex-1 bg-red-50 text-red-600 border border-red-200 px-2 py-1 text-[10px] rounded hover:bg-red-100 flex justify-center items-center gap-1"><Trash2 size={12} /> Delete</button>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-2 text-center space-y-1">
                                                <button className="w-full bg-gray-800 text-white px-2 py-1 text-[10px] rounded hover:bg-gray-700">Add DO</button>
                                                <button className="w-full border border-gray-300 bg-white px-2 py-1 text-[10px] rounded hover:bg-gray-50">View History of DO</button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <PaymentScheduleModal
                isOpen={isPaymentModalOpen}
                onClose={() => setIsPaymentModalOpen(false)}
                rentalSalesOrder={selectedOrder}
            />
        </div>
    );
};

export default RentalSalesOrder;
