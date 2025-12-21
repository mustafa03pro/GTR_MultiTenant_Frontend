
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Plus, Edit, Trash2, Loader2, Search, ChevronLeft, ChevronRight, Eye, User, Monitor, Repeat } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_BASE_URL;

const getStatusColor = (status) => {
    switch (status) {
        case 'DRAFT': return 'text-gray-600 bg-gray-100';
        case 'SENT': return 'text-blue-600 bg-blue-100';
        case 'ACCEPTED': return 'text-green-600 bg-green-100';
        case 'REJECTED': return 'text-red-600 bg-red-100';
        case 'INVOICED': return 'text-teal-600 bg-teal-100';
        default: return 'text-gray-600 bg-gray-100';
    }
};

import FollowUpModal from '../components/FollowUpModal';
import FollowUpHistoryModal from '../components/FollowUpHistoryModal';

const Quotation = () => {
    const navigate = useNavigate();
    const [quotations, setQuotations] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Follow Up Modals State
    const [showFollowUp, setShowFollowUp] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    const [selectedQuotationId, setSelectedQuotationId] = useState(null);

    // Filters
    const [filters, setFilters] = useState({
        customerName: '',
        fromDate: '',
        toDate: '',
        type: 'All',
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

    const fetchQuotations = useCallback(async () => {
        setLoading(true);
        try {
            const params = {
                page: currentPage,
                size: pageSize,
                customerName: filters.customerName,
                startDate: filters.fromDate || null,
                endDate: filters.toDate || null,
                status: filters.status !== 'All' ? filters.status : null,
                quotationType: filters.type !== 'All' ? filters.type : null,
                salespersonId: filters.teamMember || null
            };
            const response = await axios.get(`${API_URL}/sales/quotations`, { params, ...authHeaders });
            let fetchedQuotations = response.data.content || [];

            // Extract unique customer IDs
            // Extract unique customer IDs
            const customerIds = [...new Set(fetchedQuotations.map(q => q.customerId).filter(id => id))];

            // Fetch party details for each customer ID
            let partyMap = {};
            if (customerIds.length > 0) {
                const partyPromises = customerIds.map(id =>
                    axios.get(`${API_URL}/parties/${id}`, authHeaders)
                        .then(res => ({ id, data: res.data }))
                        .catch(err => ({ id, data: null }))
                );

                const parties = await Promise.all(partyPromises);
                partyMap = parties.reduce((acc, curr) => {
                    if (curr.data) acc[curr.id] = curr.data;
                    return acc;
                }, {});
            }

            // Fetch Follow Ups for each quotation to get the latest date
            const followUpPromises = fetchedQuotations.map(q =>
                axios.get(`${API_URL}/sales/followups/by-quotation/${q.id}`, authHeaders)
                    .then(res => {
                        const history = res.data || [];
                        if (history.length > 0) {
                            // Sort descending by id to get latest entry
                            const latest = history.sort((a, b) => b.id - a.id)[0];
                            return { id: q.id, nextFollowupDate: latest.nextFollowupDate };
                        }
                        return { id: q.id, nextFollowupDate: null };
                    })
                    .catch(err => ({ id: q.id, nextFollowupDate: null }))
            );

            const followUpResults = await Promise.all(followUpPromises);
            const followUpMap = followUpResults.reduce((acc, curr) => {
                acc[curr.id] = curr.nextFollowupDate;
                return acc;
            }, {});

            // Merge details into quotations
            fetchedQuotations = fetchedQuotations.map(q => ({
                ...q,
                customerParty: partyMap[q.customerId] || q.customerParty, // Fallback to existing if fetch fails or not found
                nextFollowupDate: followUpMap[q.id] || null
            }));

            setQuotations(fetchedQuotations);
            setTotalPages(response.data.totalPages);
            setError(null);
        } catch (err) {
            setError('Failed to fetch quotations. Please try again.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [currentPage, pageSize, filters, authHeaders]);

    useEffect(() => {
        fetchEmployees();
    }, [fetchEmployees]);

    useEffect(() => {
        const handler = setTimeout(() => {
            fetchQuotations();
        }, 300);
        return () => clearTimeout(handler);
    }, [fetchQuotations]);

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
        setCurrentPage(0); // Reset to first page on filter change
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this quotation?')) {
            try {
                await axios.delete(`${API_URL}/sales/quotations/${id}`, authHeaders);
                fetchQuotations();
            } catch (err) {
                alert(`Error: ${err.response?.data?.message || 'Failed to delete quotation.'}`);
            }
        }
    };

    const handleView = (id) => {
        navigate(`/sales/quotations/${id}`);
    };

    const openFollowUp = (id) => {
        setSelectedQuotationId(id);
        setShowFollowUp(true);
    };

    const openHistory = (id) => {
        setSelectedQuotationId(id);
        setShowHistory(true);
    };

    return (
        <div className="flex flex-col h-full bg-slate-50">
            {/* Header */}
            <div className="bg-primary p-4 flex justify-between items-center text-primary-foreground">
                <div>
                    <h1 className="text-xl font-semibold">Manage Quotation</h1>
                    <div className="text-sm opacity-80">Home &gt; Sales &gt; Manage Quotation</div>
                </div>
                <button onClick={() => navigate('/sales/quotations/new')} className="bg-white text-gray-800 border border-gray-300 px-4 py-2 rounded text-sm hover:bg-gray-50 flex items-center gap-1 font-bold shadow-sm">
                    <Plus size={16} /> New Quotation
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
                                name="customerName"
                                className="w-full text-sm border border-gray-300 rounded px-2 py-1.5 focus:outline-none focus:border-blue-500"
                                placeholder="Search Customer"
                                value={filters.customerName}
                                onChange={handleFilterChange}
                            />
                        </div>
                        <div className="md:col-span-1">
                            <label className="block text-xs font-bold text-gray-700 mb-1">From</label>
                            <input
                                type="date"
                                name="fromDate"
                                className="w-full text-sm border border-gray-300 rounded px-2 py-1.5 focus:outline-none focus:border-blue-500"
                                value={filters.fromDate}
                                onChange={handleFilterChange}
                            />
                        </div>
                        <div className="md:col-span-1">
                            <label className="block text-xs font-bold text-gray-700 mb-1">To</label>
                            <input
                                type="date"
                                name="toDate"
                                className="w-full text-sm border border-gray-300 rounded px-2 py-1.5 focus:outline-none focus:border-blue-500"
                                value={filters.toDate}
                                onChange={handleFilterChange}
                            />
                        </div>
                        <div className="md:col-span-1">
                            <label className="block text-xs font-bold text-gray-700 mb-1">Type</label>
                            <select
                                name="type"
                                className="w-full text-sm border border-gray-300 rounded px-2 py-1.5 focus:outline-none focus:border-blue-500 appearance-none bg-white"
                                value={filters.type}
                                onChange={handleFilterChange}
                            >
                                <option value="All">All</option>
                                <option value="WITHOUT_DISCOUNT">Without Discount</option>
                                <option value="WITH_DISCOUNT_AT_ITEM_LEVEL">Discount at Item Level</option>
                                <option value="WITH_DISCOUNT_AT_ORDER_LEVEL">Discount at Order Level</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                        <div className="md:col-span-1">
                            <label className="block text-xs font-bold text-gray-700 mb-1">Quotation Status</label>
                            <select
                                name="status"
                                className="w-full text-sm border border-gray-300 rounded px-2 py-1.5 focus:outline-none focus:border-blue-500 appearance-none bg-white"
                                value={filters.status}
                                onChange={handleFilterChange}
                            >
                                <option value="All">All</option>
                                <option value="DRAFT">Draft</option>
                                <option value="SENT">Sent</option>
                                <option value="ACCEPTED">Accepted</option>
                                <option value="REJECTED">Rejected</option>
                            </select>
                        </div>
                        <div className="md:col-span-1">
                            <label className="block text-xs font-bold text-gray-700 mb-1">Team Members</label>
                            <div className="relative">
                                <select
                                    name="teamMember"
                                    className="w-full text-sm border border-gray-300 rounded px-2 py-1.5 focus:outline-none focus:border-blue-500 appearance-none bg-white"
                                    value={filters.teamMember}
                                    onChange={handleFilterChange}
                                >
                                    <option value="">Select Team Member</option>
                                    {employees.map(emp => (
                                        <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="md:col-span-1">
                            <button
                                onClick={fetchQuotations}
                                className="bg-primary text-white text-sm font-medium px-6 py-1.5 rounded hover:bg-violet-800 focus:outline-none w-full md:w-auto"
                            >
                                Search
                            </button>
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
                                    <th className="px-4 py-3 border-r">Quotation Type</th>
                                    <th className="px-4 py-3 border-r">Follow Up</th>
                                    <th className="px-4 py-3 border-r">Next Followup Date</th>
                                    <th className="px-4 py-3 border-r">Quotation#</th>
                                    <th className="px-4 py-3 border-r">Company Name</th>
                                    <th className="px-4 py-3 border-r">Customer Name</th>
                                    <th className="px-4 py-3 border-r">Contact Person Name</th>
                                    <th className="px-4 py-3 border-r">Contact Person Number</th>
                                    <th className="px-4 py-3 border-r">Status</th>
                                    <th className="px-4 py-3 border-r text-right">Amount</th>
                                    <th className="px-4 py-3 text-center w-24">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan="13" className="text-center py-10"><Loader2 className="h-6 w-6 animate-spin mx-auto text-blue-500" /></td></tr>
                                ) : error ? (
                                    <tr><td colSpan="13" className="text-center py-10 text-red-500">{error}</td></tr>
                                ) : quotations.length === 0 ? (
                                    <tr><td colSpan="13" className="text-center py-10 font-medium text-gray-500">No data available in table</td></tr>
                                ) : (
                                    quotations.map((q, index) => (
                                        <tr key={q.id} className="border-b hover:bg-gray-50 text-gray-700">
                                            <td className="px-4 py-2 border-r">{currentPage * pageSize + index + 1}</td>
                                            <td className="px-4 py-2 border-r">{new Date(q.quotationDate).toLocaleDateString()}</td>
                                            <td className="px-4 py-2 border-r">{q.quotationType || '-'}</td>
                                            <td className="px-4 py-2 border-r space-y-1">
                                                <button onClick={() => openFollowUp(q.id)} className="flex items-center gap-1 bg-green-500 hover:bg-green-600 text-white px-2 py-0.5 rounded text-[10px] w-full justify-center transition-colors"><User size={10} /> Follow Up</button>
                                                <button onClick={() => openHistory(q.id)} className="flex items-center gap-1 bg-sky-500 hover:bg-sky-600 text-white px-2 py-0.5 rounded text-[10px] w-full justify-center transition-colors"><Monitor size={10} /> View History</button>
                                            </td>
                                            <td className="px-4 py-2 border-r"></td>
                                            <td className="px-4 py-2 border-r">
                                                <span
                                                    onClick={() => handleView(q.id)}
                                                    className="text-sky-600 cursor-pointer hover:underline font-medium"
                                                >
                                                    {q.quotationNumber}
                                                </span>
                                            </td>
                                            <td className="px-4 py-2 border-r">{q.customerParty?.companyName || 'N/A'}</td>
                                            <td className="px-4 py-2 border-r">{q.customerParty?.primaryContactPerson || q.customerName || 'N/A'}</td>
                                            <td className="px-4 py-2 border-r">{q.customerParty?.primaryContactPerson || 'N/A'}</td>
                                            <td className="px-4 py-2 border-r">
                                                <div>{q.customerParty?.mobile}</div>
                                                <div>{q.customerParty?.contactPhone}</div>
                                            </td>
                                            <td className="px-4 py-2 border-r font-medium">
                                                <span className={`px-2 py-0.5 rounded text-[10px] ${getStatusColor(q.status)}`}>{q.status}</span>
                                            </td>
                                            <td className="px-4 py-2 border-r text-right">AED {q.netTotal.toLocaleString('en-AE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                            <td className="px-4 py-2 text-center border-r">
                                                <div className="flex justify-center gap-1">
                                                    <button onClick={() => navigate(`/sales/quotations/revise/${q.id}`)} className="p-1.5 bg-yellow-500 text-white rounded hover:bg-yellow-600 shadow-sm" title="Revise"><Repeat size={12} /></button>
                                                    <button onClick={() => navigate(`/sales/quotations/edit/${q.id}`)} className="p-1.5 bg-gray-700 text-white rounded hover:bg-gray-600 shadow-sm" title="Edit"><Edit size={12} /></button>
                                                    <button onClick={() => handleDelete(q.id)} className="p-1.5 bg-red-500 text-white rounded hover:bg-red-600 shadow-sm" title="Delete"><Trash2 size={12} /></button>
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
                        <div className="p-2 border-t flex justify-between items-center text-xs text-gray-500">
                            <span>Showing {currentPage * pageSize + 1} to {Math.min((currentPage + 1) * pageSize, quotations.length + currentPage * pageSize)} of {quotations.length} entries</span>
                            <div className="flex gap-1">
                                <button onClick={() => setCurrentPage(p => Math.max(0, p - 1))} disabled={currentPage === 0} className="px-2 py-1 border rounded hover:bg-gray-100 disabled:opacity-50">Previous</button>
                                <span className="px-2 py-1 bg-purple-900 text-white rounded">{currentPage + 1}</span>
                                <button onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))} disabled={currentPage >= totalPages - 1} className="px-2 py-1 border rounded hover:bg-gray-100 disabled:opacity-50">Next</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Modals */}
            <FollowUpModal
                isOpen={showFollowUp}
                onClose={() => setShowFollowUp(false)}
                quotationId={selectedQuotationId}
                onSuccess={() => {
                    // Refresh data or just close
                    fetchQuotations();
                }}
            />
            <FollowUpHistoryModal
                isOpen={showHistory}
                onClose={() => setShowHistory(false)}
                quotationId={selectedQuotationId}
            />
        </div>
    );
};

export default Quotation;

