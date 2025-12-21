import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Plus, Edit, Trash2, Loader2, Search, User, Monitor } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_BASE_URL;

const getStatusColor = (status) => {
    switch (status) {
        case 'DRAFT': return 'text-gray-600 bg-gray-100';
        case 'SENT': return 'text-blue-600 bg-blue-100';
        case 'ACCEPTED': return 'text-green-600 bg-green-100';
        case 'REJECTED': return 'text-red-600 bg-red-100';
        case 'INVOICED': return 'text-purple-600 bg-purple-100';
        case 'OPEN': return 'text-purple-600 bg-purple-100'; // Added OPEN based on screenshot
        default: return 'text-gray-600 bg-gray-100';
    }
};

const ProformaInvoice = () => {
    const navigate = useNavigate();
    const [invoices, setInvoices] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

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

    const fetchInvoices = useCallback(async () => {
        setLoading(true);
        try {
            const params = {
                page: currentPage,
                size: pageSize,
                search: filters.customerName,
                fromDate: filters.fromDate,
                toDate: filters.toDate,
                salespersonId: filters.teamMember || undefined
            };
            const response = await axios.get(`${API_URL}/sales/proforma-invoices`, { params, ...authHeaders });

            // Backend returns Page<ProformaInvoiceResponse> which has customerName directly populated
            setInvoices(response.data.content || []);
            setTotalPages(response.data.totalPages);
            setError(null);
        } catch (err) {
            setError('Failed to fetch proforma invoices. Please try again.');
            console.error(err);
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
        setCurrentPage(0);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this proforma invoice?')) {
            try {
                await axios.delete(`${API_URL}/sales/proforma-invoices/${id}`, authHeaders);
                fetchInvoices();
            } catch (err) {
                alert(`Error: ${err.response?.data?.message || 'Failed to delete invoice.'}`);
            }
        }
    };

    return (
        <div className="flex flex-col h-full bg-slate-50">
            {/* Header */}
            <div className="bg-primary p-4 flex justify-between items-center text-primary-foreground">
                <div>
                    <h1 className="text-xl font-semibold">Manage Proforma Invoices</h1>
                    <div className="text-sm opacity-80">Home &gt; Sales &gt; Manage Proforma Invoices</div>
                </div>
                <button onClick={() => navigate('/sales/proforma-invoices/new')} className="bg-white text-gray-800 border border-gray-300 px-4 py-2 rounded text-sm hover:bg-gray-50 flex items-center gap-1 font-bold shadow-sm">
                    <Plus size={16} /> New Invoices
                </button>
            </div>

            <div className="p-4 space-y-4">
                {/* Filters Section */}
                <div className="bg-white p-4 rounded shadow-sm border border-gray-200">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4 items-end">
                        <div>
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
                        <div>
                            <button onClick={fetchInvoices} className="bg-primary text-white px-6 py-1.5 rounded text-sm hover:bg-violet-800 font-medium">Search</button>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                        <div className="md:col-span-1">
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
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white rounded shadow-sm border border-gray-200 overflow-hidden">
                    <div className="p-2 border-b flex items-center gap-2">
                        <select className="border border-gray-300 rounded px-2 py-1 text-xs" value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))}>
                            <option value="10">10</option>
                            <option value="25">25</option>
                            <option value="50">50</option>
                        </select>
                        <div className="flex-grow"></div>
                        <input type="text" placeholder="Search..." className="border border-gray-300 rounded px-2 py-1 text-xs" />
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs text-left">
                            <thead className="bg-gray-100 text-gray-700 font-bold border-b">
                                <tr>
                                    <th className="px-4 py-3 border-r w-16">S.No.</th>
                                    <th className="px-4 py-3 border-r">Date</th>
                                    <th className="px-4 py-3 border-r">Due Date</th>
                                    <th className="px-4 py-3 border-r">Invoices#</th>
                                    <th className="px-4 py-3 border-r">Reference#</th>
                                    <th className="px-4 py-3 border-r">Customer Name</th>
                                    <th className="px-4 py-3 border-r">Status</th>
                                    <th className="px-4 py-3 border-r text-right">Amount</th>
                                    <th className="px-4 py-3 text-center w-24">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan="9" className="text-center py-10"><Loader2 className="h-6 w-6 animate-spin mx-auto text-blue-500" /></td></tr>
                                ) : error ? (
                                    <tr><td colSpan="9" className="text-center py-10 text-red-500">{error}</td></tr>
                                ) : invoices.length === 0 ? (
                                    <tr><td colSpan="9" className="text-center py-10 font-medium text-gray-500">No record available</td></tr>
                                ) : (
                                    invoices.map((inv, index) => (
                                        <tr key={inv.id} className="border-b hover:bg-gray-50 text-gray-700">
                                            <td className="px-4 py-2 border-r">{currentPage * pageSize + index + 1}</td>
                                            <td className="px-4 py-2 border-r">{inv.invoiceDate ? new Date(inv.invoiceDate).toLocaleDateString() : '-'}</td>
                                            <td className="px-4 py-2 border-r">{inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : '-'}</td>
                                            <td className="px-4 py-2 border-r text-sky-600 cursor-pointer hover:underline font-medium" onClick={() => navigate(`/sales/proforma-invoices/${inv.id}`)}>{inv.invoiceNumber}</td>
                                            <td className="px-4 py-2 border-r">{inv.reference || '-'}</td>
                                            <td className="px-4 py-2 border-r">{inv.customerName || 'N/A'}</td>
                                            <td className="px-4 py-2 border-r font-medium">
                                                <span className={`px-2 py-0.5 rounded text-[10px] ${getStatusColor(inv.status)}`}>{inv.status || 'OPEN'}</span>
                                            </td>
                                            <td className="px-4 py-2 border-r font-medium text-right">AED {inv.netTotal?.toLocaleString('en-AE', { minimumFractionDigits: 2 })}</td>
                                            <td className="px-4 py-2 flex justify-center gap-1">
                                                <button onClick={() => navigate(`/sales/proforma-invoices/edit/${inv.id}`)} className="p-1.5 bg-gray-700 text-white rounded hover:bg-gray-600 shadow-sm" title="Edit"><Edit size={12} /></button>
                                                <button onClick={() => handleDelete(inv.id)} className="p-1.5 bg-red-500 text-white rounded hover:bg-red-600 shadow-sm" title="Delete"><Trash2 size={12} /></button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                    <div className="p-2 border-t flex justify-between items-center text-xs text-gray-500">
                        <span>Showing {invoices.length > 0 ? 1 : 0} to {invoices.length} of {invoices.length} entries</span>
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

export default ProformaInvoice;
