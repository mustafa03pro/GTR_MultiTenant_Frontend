import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Plus, Edit, Trash2, Loader2, Search, User, Monitor, ChevronLeft, ChevronRight, Eye } from 'lucide-react';

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

const Invoice = () => {
    const navigate = useNavigate();
    const [invoices, setInvoices] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [filters, setFilters] = useState({
        customerName: '',
        fromDate: '', // First day of current month
        toDate: '', // Last day of current month
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

    const fetchInvoices = useCallback(async () => {
        setLoading(true);
        try {
            const params = {
                page: currentPage,
                size: pageSize,
                search: filters.customerName || null,
                fromDate: filters.fromDate || null,
                toDate: filters.toDate || null,
                salespersonId: filters.teamMember || null,
                // status: filters.status !== 'All' ? filters.status : null // Endpoint might not support status filtering directly yet based on provided code, but usually it does or we filter client side if needed. provided repo code only searches by string.
            };

            const response = await axios.get(`${API_URL}/sales/sales-invoices`, { ...authHeaders, params });
            // content is in response.data.content usually for Spring Data REST/Pageable
            setInvoices(response.data.content || []);
            setTotalPages(response.data.totalPages || 0);
            setError(null);
        } catch (err) {
            console.error("Failed to fetch invoices", err);
            setError("Failed to load invoices.");
            setInvoices([]);
        } finally {
            setLoading(false);
        }
    }, [currentPage, pageSize, filters, authHeaders]);

    useEffect(() => {
        fetchEmployees();
    }, [fetchEmployees]);

    useEffect(() => {
        fetchInvoices();
    }, [fetchInvoices]);

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
        setCurrentPage(0); // Reset to first page on filter change
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this invoice?')) {
            try {
                await axios.delete(`${API_URL}/sales/sales-invoices/${id}`, authHeaders);
                fetchInvoices();
            } catch (err) {
                console.error("Failed to delete invoice", err);
                alert("Failed to delete invoice");
            }
        }
    };

    return (
        <div className="flex flex-col h-full bg-slate-50">
            {/* Header */}
            <div className="bg-primary p-4 flex justify-between items-center text-primary-foreground shadow-sm">
                <div>
                    <h1 className="text-xl font-bold">Manage Sales Invoices</h1>
                    <div className="text-xs opacity-80 mt-1 flex items-center gap-1">
                        Home <span>&gt;</span> Sales <span>&gt;</span> Manage Sales Invoices
                    </div>
                </div>
                <button
                    onClick={() => navigate('/sales/invoices/new')}
                    className="bg-white text-primary px-4 py-2 rounded-md font-bold text-sm hover:bg-opacity-90 transition-colors flex items-center gap-2 shadow-sm"
                >
                    <Plus size={16} /> New Invoice
                </button>
            </div>

            <div className="p-4 space-y-4 flex-grow overflow-auto">
                {/* Filters */}
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1">Customer Name</label>
                            <input
                                type="text"
                                name="customerName"
                                value={filters.customerName}
                                onChange={handleFilterChange}
                                placeholder="Search Customer..."
                                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
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
                            <label className="block text-xs font-bold text-gray-700 mb-1">To Date</label>
                            <input
                                type="date"
                                name="toDate"
                                value={filters.toDate}
                                onChange={handleFilterChange}
                                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1">Team Member</label>
                            <select
                                name="teamMember"
                                value={filters.teamMember}
                                onChange={handleFilterChange}
                                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                            >
                                <option value="">All Members</option>
                                {employees.map(emp => (
                                    <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <button
                                onClick={fetchInvoices}
                                className="w-full bg-primary text-white py-2 rounded font-bold text-sm hover:bg-opacity-90 transition-colors flex items-center justify-center gap-2"
                            >
                                <Search size={16} /> Search
                            </button>
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
                                            <th className="px-4 py-3 w-16 text-center">S.No.</th>
                                            <th className="px-4 py-3">Date</th>
                                            <th className="px-4 py-3">Due Date</th>
                                            <th className="px-4 py-3">Invoices#</th>
                                            <th className="px-4 py-3">Reference#</th>
                                            <th className="px-4 py-3">Customer Name</th>
                                            <th className="px-4 py-3 text-center">Status</th>
                                            <th className="px-4 py-3 text-right">Amount</th>
                                            <th className="px-4 py-3 text-right">Amount Received</th>
                                            <th className="px-4 py-3 text-right">Balance Due</th>
                                            <th className="px-4 py-3 text-center w-24">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {invoices.length > 0 ? (
                                            invoices.map((invoice, index) => (
                                                <tr key={invoice.id} className="hover:bg-gray-50 transition-colors">
                                                    <td className="px-4 py-3 text-center text-gray-500">{currentPage * pageSize + index + 1}</td>
                                                    <td className="px-4 py-3 text-gray-600">{invoice.invoiceDate}</td>
                                                    <td className="px-4 py-3 text-gray-600">{invoice.dueDate}</td>
                                                    <td className="px-4 py-3">
                                                        <span
                                                            onClick={() => navigate(`/sales/invoices/${invoice.id}`)}
                                                            className="text-primary font-medium cursor-pointer hover:underline"
                                                        >
                                                            {invoice.invoiceNumber}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-gray-600">{invoice.reference || '-'}</td>
                                                    <td className="px-4 py-3 font-medium text-gray-800">{invoice.customerName}</td>
                                                    <td className="px-4 py-3 text-center">
                                                        <span className={`px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wide border ${getStatusColor(invoice.status)} border-opacity-20`}>
                                                            {invoice.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-right font-medium text-gray-700">AED {invoice.netTotal?.toFixed(2)}</td>
                                                    <td className="px-4 py-3 text-right text-gray-600">{invoice.amountReceived ? `AED ${invoice.amountReceived.toFixed(2)}` : '-'}</td>
                                                    <td className="px-4 py-3 text-right font-medium text-red-600">{invoice.balanceDue ? `AED ${invoice.balanceDue.toFixed(2)}` : '-'}</td>
                                                    <td className="px-4 py-3 text-center">
                                                        <div className="flex items-center justify-center gap-2">
                                                            <button
                                                                onClick={() => navigate(`/sales/invoices/${invoice.id}`)}
                                                                className="p-1.5 bg-sky-500 text-white rounded hover:bg-sky-600 shadow-sm transition-colors"
                                                                title="View"
                                                            >
                                                                <Eye size={14} />
                                                            </button>
                                                            <button
                                                                onClick={() => navigate(`/sales/invoices/edit/${invoice.id}`)}
                                                                className="p-1.5 bg-gray-700 text-white rounded hover:bg-gray-600 shadow-sm transition-colors"
                                                                title="Edit"
                                                            >
                                                                <Edit size={14} />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDelete(invoice.id)}
                                                                className="p-1.5 bg-red-500 text-white rounded hover:bg-red-600 shadow-sm transition-colors"
                                                                title="Delete"
                                                            >
                                                                <Trash2 size={14} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="11" className="px-4 py-8 text-center text-gray-500">
                                                    No invoices found. Try adjusting filters or create a new one.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            <div className="p-4 border-t flex justify-between items-center text-xs text-gray-500 bg-gray-50">
                                <span>
                                    Showing {invoices.length} of {totalPages * pageSize} entries
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

export default Invoice;
