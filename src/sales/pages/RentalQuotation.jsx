import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Plus, Edit, Trash2, Loader2, Search, User, Monitor, History } from 'lucide-react';
import FollowUpModal from '../components/FollowUpModal';
import FollowUpHistoryModal from '../components/FollowUpHistoryModal';

const API_URL = import.meta.env.VITE_API_BASE_URL;

const getStatusColor = (status) => {
    switch (status) {
        case 'DRAFT': return 'text-gray-600 bg-gray-100';
        case 'SENT': return 'text-blue-600 bg-blue-100';
        case 'ACCEPTED': return 'text-green-600 bg-green-100';
        case 'REJECTED': return 'text-red-600 bg-red-100';
        case 'INVOICED': return 'text-purple-600 bg-purple-100';
        default: return 'text-gray-600 bg-gray-100';
    }
};

const RentalQuotation = () => {
    const navigate = useNavigate();
    const [quotations, setQuotations] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Filters matching the image
    const [filters, setFilters] = useState({
        customerName: '',
        fromDate: '',
        toDate: '',
        type: 'All',
        status: 'All',
        teamMember: '' // 'super admin' in image example
    });

    const [currentPage, setCurrentPage] = useState(0);
    const [pageSize, setPageSize] = useState(10);
    const [totalPages, setTotalPages] = useState(0);

    // Follow Up Modal State
    const [selectedQuotationId, setSelectedQuotationId] = useState(null);
    const [showFollowUpModal, setShowFollowUpModal] = useState(false);
    const [showHistoryModal, setShowHistoryModal] = useState(false);

    const fetchQuotations = useCallback(async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const authConfig = { headers: { Authorization: `Bearer ${token}` } };

            // Prepare filters
            const params = {
                page: currentPage,
                size: pageSize,
                customerName: filters.customerName || undefined,
                fromDate: filters.fromDate || undefined,
                toDate: filters.toDate || undefined,
                status: filters.status === 'All' ? undefined : filters.status,
                type: filters.type === 'All' ? undefined : filters.type,
                salespersonId: filters.teamMember || undefined
            };

            const response = await axios.get(`${API_URL}/sales/rental-quotations`, { params, ...authConfig });

            // Robust data extraction
            let fetchedQuotations = response.data.content || (Array.isArray(response.data) ? response.data : []);
            const totalPagesInfo = response.data.totalPages || (Array.isArray(response.data) ? 1 : 0);

            // Extract unique customer IDs
            const customerIds = [...new Set(fetchedQuotations.map(q => q.customerId).filter(id => id))];

            // Fetch party details for each customer ID
            if (customerIds.length > 0) {
                const partyPromises = customerIds.map(id =>
                    axios.get(`${API_URL}/parties/${id}`, authConfig)
                        .then(res => ({ id, data: res.data }))
                        .catch(err => ({ id, data: null }))
                );

                const parties = await Promise.all(partyPromises);
                const partyMap = parties.reduce((acc, curr) => {
                    if (curr.data) acc[curr.id] = curr.data;
                    return acc;
                }, {});

                // Merge party details into quotations
                fetchedQuotations = fetchedQuotations.map(q => ({
                    ...q,
                    customerParty: partyMap[q.customerId] || q.customerParty
                }));
            }

            setQuotations(fetchedQuotations);
            setTotalPages(totalPagesInfo);
            setError(null);
        } catch (err) {
            console.error(err);
            // Don't show generic error if it is just a 404 (no content?) - though 404 usually means endpoint wrong.
            // If it's a search that yields no results, backend might return empty list.
            // If actual error:
            if (err.response && err.response.status === 401) {
                setError("Unauthorized. Please login again.");
            } else {
                setError('Failed to fetch rental quotations. Please check connection or contact support.');
            }
        } finally {
            setLoading(false);
        }
    }, [currentPage, pageSize, filters]);

    const fetchEmployees = useCallback(async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}/employees/all`, { headers: { Authorization: `Bearer ${token}` } });
            setEmployees(response.data || []);
        } catch (err) {
            console.error("Failed to fetch employees", err);
        }
    }, []);

    useEffect(() => {
        fetchEmployees();
    }, [fetchEmployees]);

    useEffect(() => {
        fetchQuotations();
    }, [fetchQuotations]);

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
        setCurrentPage(0);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this rental quotation?')) {
            try {
                const token = localStorage.getItem('token');
                await axios.delete(`${API_URL}/sales/rental-quotations/${id}`, { headers: { Authorization: `Bearer ${token}` } });
                fetchQuotations();
            } catch (err) {
                alert(`Error: ${err.response?.data?.message || 'Failed to delete quotation.'}`);
            }
        }
    };

    return (
        <div className="flex flex-col h-full bg-slate-50">
            {/* Header */}
            <div className="bg-primary p-4 flex justify-between items-center text-primary-foreground">
                <div>
                    <h1 className="text-xl font-semibold">Manage Rental Quotation</h1>
                    <div className="text-sm opacity-80">Home &gt; Sales &gt; Manage Rental Quotation</div>
                </div>
                {/* <button onClick={() => navigate('/sales/rental-quotations/new')} className="bg-primary-foreground text-primary px-4 py-2 rounded text-sm hover:bg-opacity-90 flex items-center gap-1 font-bold">
                    <Plus size={16} /> New Rental Quotation
                </button> */}
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
                            <label className="block text-xs font-bold text-gray-700 mb-1">Type</label>
                            <select name="type" value={filters.type} onChange={handleFilterChange} className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm bg-white">
                                <option value="All">All</option>
                                <option value="WITHOUT_DISCOUNT">Without Discount</option>
                                <option value="WITH_DISCOUNT_AT_ITEM_LEVEL">With Discount At Item Level</option>
                                <option value="WITH_DISCOUNT_AT_ORDER_LEVEL">With Discount At Order Level</option>
                            </select>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1">Quotation Status</label>
                            <select name="status" value={filters.status} onChange={handleFilterChange} className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm bg-white">
                                <option value="All">All</option>
                                <option value="DRAFT">DRAFT</option>
                                <option value="SENT">SENT</option>
                                <option value="ACCEPTED">ACCEPTED</option>
                                <option value="REJECTED">REJECTED</option>
                            </select>
                        </div>
                        <div>
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
                            <button onClick={fetchQuotations} className="bg-primary text-white px-6 py-1.5 rounded text-sm hover:bg-violet-900 font-medium">Search</button>
                        </div>
                        <div className="flex justify-end">
                            <button onClick={() => navigate('/sales/rental-quotations/new')} className="bg-primary text-primary-foreground px-4 py-1.5 rounded text-sm hover:bg-violet-900 flex items-center gap-1 font-medium">
                                <Plus size={14} /> New Rental Quotation
                            </button>
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white rounded shadow-sm border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs text-left">
                            <thead className="bg-gray-50 text-gray-700 font-bold border-b">
                                <tr>
                                    <th className="px-4 py-3 border-r">S.No.</th>
                                    <th className="px-4 py-3 border-r">Date</th>
                                    <th className="px-4 py-3 border-r">Quotation Status</th>
                                    <th className="px-4 py-3 border-r">Follow Up</th>
                                    <th className="px-4 py-3 border-r">Next Followup Date</th>
                                    <th className="px-4 py-3 border-r">Quotation#</th>
                                    <th className="px-4 py-3 border-r">Customer Name</th>
                                    <th className="px-4 py-3 border-r">Contact Person Name</th>
                                    <th className="px-4 py-3 border-r">Contact Person Number</th>
                                    <th className="px-4 py-3 border-r">Status</th>
                                    <th className="px-4 py-3 border-r">Amount</th>
                                    <th className="px-4 py-3 text-center">Operation</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan="12" className="text-center py-10"><Loader2 className="h-6 w-6 animate-spin mx-auto text-blue-500" /></td></tr>
                                ) : error ? (
                                    <tr><td colSpan="12" className="text-center py-10 text-red-500">{error}</td></tr>
                                ) : quotations.length === 0 ? (
                                    <tr><td colSpan="12" className="text-center py-10 font-medium text-gray-500">No record available</td></tr>
                                ) : (
                                    quotations.map((q, index) => (
                                        <tr key={q.id} className="border-b hover:bg-gray-50 text-gray-700">
                                            <td className="px-4 py-2 border-r">{currentPage * pageSize + index + 1}</td>
                                            <td className="px-4 py-2 border-r">{q.quotationDate ? new Date(q.quotationDate).toLocaleDateString() : '-'}</td>
                                            <td className="px-4 py-2 border-r"></td>

                                            <td className="px-4 py-2 border-r space-y-1">
                                                <button
                                                    onClick={() => { setSelectedQuotationId(q.id); setShowFollowUpModal(true); }}
                                                    className="flex items-center gap-1 bg-green-500 text-white px-2 py-0.5 rounded text-[10px] w-full justify-center hover:bg-green-600"
                                                >
                                                    <User size={10} /> Add
                                                </button>
                                                <button
                                                    onClick={() => { setSelectedQuotationId(q.id); setShowHistoryModal(true); }}
                                                    className="flex items-center gap-1 bg-gray-500 text-white px-2 py-0.5 rounded text-[10px] w-full justify-center hover:bg-gray-600"
                                                >
                                                    <History size={10} /> History
                                                </button>
                                            </td>
                                            <td className="px-4 py-2 border-r"></td>
                                            <td className="px-4 py-2 border-r text-sky-600 cursor-pointer hover:underline font-medium" onClick={() => navigate(`/sales/rental-quotations/${q.id}`)}>{q.quotationNumber}</td>
                                            <td className="px-4 py-2 border-r">{q.customerParty?.companyName || q.customerName || 'N/A'}</td>
                                            <td className="px-4 py-2 border-r">{q.customerParty?.primaryContactPerson || '-'}</td>
                                            <td className="px-4 py-2 border-r">{q.customerParty?.mobile || '-'}</td>
                                            <td className="px-4 py-2 border-r font-medium">
                                                <span className={`px-2 py-0.5 rounded text-[10px] ${getStatusColor(q.status)}`}>{q.status}</span>
                                            </td>
                                            <td className="px-4 py-2 border-r font-medium">AED {q.netTotal?.toLocaleString('en-AE', { minimumFractionDigits: 2 })}</td>
                                            <td className="px-4 py-2 flex justify-center gap-1">
                                                <button onClick={() => navigate(`/sales/rental-quotations/edit/${q.id}`)} className="p-1.5 bg-sky-600 text-white rounded hover:bg-sky-700 shadow-sm" title="Edit"><Edit size={12} /></button>
                                                <button onClick={() => navigate('/sales/rental-sales-orders/new', { state: { quotationId: q.id } })} className="p-1.5 bg-green-600 text-white rounded hover:bg-green-700 shadow-sm" title="Convert to Order"><Monitor size={12} /></button>
                                                <button onClick={() => handleDelete(q.id)} className="p-1.5 bg-red-500 text-white rounded hover:bg-red-600 shadow-sm" title="Delete"><Trash2 size={12} /></button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>



            {/* Modals */}
            <FollowUpModal
                isOpen={showFollowUpModal}
                onClose={() => setShowFollowUpModal(false)}
                rentalQuotationId={selectedQuotationId}
                onSuccess={fetchQuotations} // Refresh list to update status if changed
            />

            <FollowUpHistoryModal
                isOpen={showHistoryModal}
                onClose={() => setShowHistoryModal(false)}
                rentalQuotationId={selectedQuotationId}
            />
        </div >
    );
};

export default RentalQuotation;
