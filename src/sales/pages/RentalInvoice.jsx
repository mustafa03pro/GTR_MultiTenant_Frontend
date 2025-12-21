import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Plus, Edit, Trash2, Loader2, Search, ChevronLeft, ChevronRight, Eye } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_BASE_URL;

const getStatusColor = (status) => {
    switch (status) {
        case 'DRAFT': return 'text-gray-600 bg-gray-100';
        case 'SENT': return 'text-blue-600 bg-blue-100';
        case 'ACCEPTED': return 'text-green-600 bg-green-100';
        case 'REJECTED': return 'text-red-600 bg-red-100';
        case 'PAID': return 'text-emerald-600 bg-emerald-100';
        case 'PARTIAL': return 'text-amber-600 bg-amber-100';
        case 'OVERDUE': return 'text-rose-600 bg-rose-100';
        case 'OPEN': return 'text-purple-600 bg-purple-100';
        default: return 'text-gray-600 bg-gray-100';
    }
};

const RentalInvoice = () => {
    const navigate = useNavigate();
    const [invoices, setInvoices] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [filters, setFilters] = useState({
        search: '',
        fromDate: '',
        toDate: '',
        status: 'All',
        salespersonId: ''
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

    const fetchInvoices = useCallback(async () => {
        setLoading(true);
        try {
            const params = {
                page: currentPage,
                size: pageSize,
                search: filters.search || undefined,
                fromDate: filters.fromDate || undefined,
                toDate: filters.toDate || undefined,
                salespersonId: filters.salespersonId || undefined
            };

            const response = await axios.get(`${API_URL}/sales/rental-invoices`, { ...authHeaders, params });
            setInvoices(response.data.content || []);
            setTotalPages(response.data.totalPages || 0);
            setError(null);
        } catch (err) {
            console.error("Failed to fetch rental invoices", err);
            setError("Failed to load rental invoices.");
            setInvoices([]);
        } finally {
            setLoading(false);
        }
    }, [currentPage, pageSize, authHeaders, filters]);

    useEffect(() => {
        fetchEmployees();
    }, [fetchEmployees]);

    useEffect(() => {
        fetchInvoices();
    }, [fetchInvoices]);

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
        // Since backend doesn't support filtering, we can't really "reset page" effectively for server search
        // If we want client side filtering, we'd need to fetch all or filter current page.
        // For now leaving as is.
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this rental invoice?')) {
            try {
                await axios.delete(`${API_URL}/sales/rental-invoices/${id}`, authHeaders);
                fetchInvoices();
            } catch (err) {
                console.error("Failed to delete rental invoice", err);
                alert("Failed to delete rental invoice");
            }
        }
    };

    return (
        <div className="flex flex-col h-full bg-slate-50">
            {/* Header */}
            <div className="bg-primary p-4 flex justify-between items-center text-primary-foreground shadow-sm">
                <div>
                    <h1 className="text-xl font-bold">Manage Rental Invoices</h1>
                    <div className="text-xs opacity-80 mt-1 flex items-center gap-1">
                        Home <span>&gt;</span> Sales <span>&gt;</span> Manage Rental Invoices
                    </div>
                </div>
                <button
                    onClick={() => navigate('/sales/rental-invoices/new')}
                    className="bg-white text-primary px-4 py-2 rounded-md font-bold text-sm hover:bg-opacity-90 transition-colors flex items-center gap-2 shadow-sm"
                >
                    <Plus size={16} /> New Invoices
                </button>
            </div>

            <div className="p-4 space-y-4 flex-grow overflow-auto">
                {/* Filters */}
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                        <div className="md:col-span-2">
                            <label className="block text-xs font-bold text-gray-700 mb-1">Search (Customer, Invoice#, Ref)</label>
                            <input
                                type="text"
                                name="search"
                                value={filters.search}
                                onChange={handleFilterChange}
                                placeholder="Search by Name, Invoice No, Reference..."
                                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1">From</label>
                            <input
                                type="date"
                                name="fromDate"
                                value={filters.fromDate}
                                onChange={handleFilterChange}
                                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1">To</label>
                            <input
                                type="date"
                                name="toDate"
                                value={filters.toDate}
                                onChange={handleFilterChange}
                                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                            />
                        </div>
                        <div>
                            <button
                                onClick={() => { setCurrentPage(0); fetchInvoices(); }}
                                className="bbox bg-gray-800 text-white px-6 py-2 rounded text-sm font-bold hover:bg-gray-700 w-full"
                            >
                                Search
                            </button>
                        </div>
                        <div className="md:col-span-1">
                            <label className="block text-xs font-bold text-gray-700 mb-1">Salesperson</label>
                            <select
                                name="salespersonId"
                                value={filters.salespersonId}
                                onChange={handleFilterChange}
                                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                            >
                                <option value="">All</option>
                                {employees.map(emp => (
                                    <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
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
                            <div className="flex-grow"></div>
                        </div>
                        {loading ? (
                            <div className="flex justify-center items-center p-8">
                                <Loader2 className="animate-spin text-primary h-8 w-8" />
                            </div>
                        ) : (
                            <>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-xs text-left">
                                        <thead className="bg-gray-200 text-gray-700 font-bold border-b">
                                            <tr>
                                                <th className="px-4 py-3 w-16 text-center">S.No.</th>
                                                <th className="px-4 py-3">Date</th>
                                                <th className="px-4 py-3">Due Date</th>
                                                <th className="px-4 py-3">Invoices#</th>
                                                <th className="px-4 py-3">Reference#</th>
                                                <th className="px-4 py-3">Customer Name</th>
                                                <th className="px-4 py-3">Status</th>
                                                <th className="px-4 py-3 text-right">Amount</th>
                                                <th className="px-4 py-3 text-right">Amount Received</th>
                                                <th className="px-4 py-3 text-right">Balance Due</th>
                                                <th className="px-4 py-3 text-center w-20">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {invoices.length > 0 ? (
                                                invoices.map((invoice, index) => (
                                                    <tr key={invoice.id} className="hover:bg-gray-50 transition-colors">
                                                        <td className="px-4 py-3 text-center text-gray-500">{currentPage * pageSize + index + 1}</td>
                                                        <td className="px-4 py-3 text-gray-600">{invoice.invoiceDate}</td>
                                                        <td className="px-4 py-3 text-gray-600">{invoice.dueDate}</td>
                                                        <td className="px-4 py-3 font-medium text-gray-700">
                                                            <button
                                                                onClick={() => navigate(`/sales/rental-invoices/${invoice.id}`)}
                                                                className="text-primary hover:underline hover:text-primary/80"
                                                            >
                                                                {invoice.invoiceNumber}
                                                            </button>
                                                        </td>
                                                        <td className="px-4 py-3 text-gray-600">{invoice.reference || '-'}</td>
                                                        <td className="px-4 py-3 font-medium text-gray-800">{invoice.customerName}</td>
                                                        <td className="px-4 py-3">
                                                            <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${getStatusColor(invoice.status)}`}>
                                                                {invoice.status}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3 text-right">AED {invoice.netTotal?.toLocaleString('en-AE', { minimumFractionDigits: 2 })}</td>
                                                        <td className="px-4 py-3 text-right text-gray-600">AED 0.00</td>
                                                        <td className="px-4 py-3 text-right font-medium">AED {invoice.netTotal?.toLocaleString('en-AE', { minimumFractionDigits: 2 })}</td>
                                                        <td className="px-4 py-3 text-center">
                                                            <div className="flex items-center justify-center gap-2">
                                                                <button
                                                                    onClick={() => navigate(`/sales/rental-invoices/edit/${invoice.id}`)}
                                                                    className="p-1 bg-gray-800 text-white rounded hover:bg-gray-700 shadow-sm"
                                                                    title="Edit"
                                                                >
                                                                    <Edit size={12} />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDelete(invoice.id)}
                                                                    className="p-1 bg-red-500 text-white rounded hover:bg-red-600 shadow-sm"
                                                                    title="Delete"
                                                                >
                                                                    <Trash2 size={12} />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan="11" className="px-4 py-8 text-center text-gray-500">
                                                        No rental invoices found.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Pagination */}
                                <div className="p-4 border-t flex justify-between items-center text-xs text-gray-500 bg-white">
                                    <span>
                                        Showing {invoices.length > 0 ? (currentPage * pageSize) + 1 : 0} to {Math.min((currentPage + 1) * pageSize, totalPages * pageSize)} of {totalPages * pageSize} entries
                                    </span>
                                    <div className="flex gap-1">
                                        <button
                                            onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
                                            disabled={currentPage === 0}
                                            className="px-2 py-1 border rounded hover:bg-gray-100 disabled:opacity-50"
                                        >
                                            Previous
                                        </button>
                                        <button className="px-2 py-1 bg-purple-900 text-white rounded">{currentPage + 1}</button>
                                        {/* Simplified pagination for now */}
                                        <button
                                            onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))}
                                            disabled={currentPage >= totalPages - 1}
                                            className="px-2 py-1 border rounded hover:bg-gray-100 disabled:opacity-50"
                                        >
                                            Next
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RentalInvoice;
