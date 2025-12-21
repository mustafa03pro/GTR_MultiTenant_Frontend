import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Plus, Edit, Trash2, Loader2, Search, Eye } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_BASE_URL;

const CreditNotes = () => {
    const navigate = useNavigate();
    const [creditNotes, setCreditNotes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Filters
    const [filters, setFilters] = useState({
        fromDate: '',
        toDate: '',
        locationId: ''
    });

    const [locations, setLocations] = useState([]);

    const [currentPage, setCurrentPage] = useState(0);
    const [pageSize, setPageSize] = useState(10);
    const [totalPages, setTotalPages] = useState(0);

    const authHeaders = useMemo(() => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }), []);

    // Fetch Locations for filter
    useEffect(() => {
        const fetchLocations = async () => {
            try {
                const response = await axios.get(`${API_URL}/locations`, authHeaders);
                setLocations(response.data || []);
            } catch (err) {
                // Ignore if fails, just empty list
                console.warn("Failed to fetch locations");
                setLocations([{ id: 1, name: 'HO' }]); // Fallback
            }
        };
        fetchLocations();
    }, [authHeaders]);

    const fetchCreditNotes = useCallback(async () => {
        setLoading(true);
        try {
            const response = await axios.get(`${API_URL}/credit-notes`, authHeaders);
            let data = response.data || [];

            // Client-side filtering
            if (filters.fromDate) {
                data = data.filter(item => new Date(item.creditNoteDate) >= new Date(filters.fromDate));
            }
            if (filters.toDate) {
                data = data.filter(item => new Date(item.creditNoteDate) <= new Date(filters.toDate));
            }
            if (filters.locationId) {
                data = data.filter(item => item.locationId === Number(filters.locationId));
            }

            // Client-side pagination
            setTotalPages(Math.ceil(data.length / pageSize));
            const startIndex = currentPage * pageSize;
            const paginatedData = data.slice(startIndex, startIndex + pageSize);

            setCreditNotes(paginatedData);
            setError(null);
        } catch (err) {
            console.error("Failed to fetch credit notes", err);
            setError('Failed to fetch data');
            setCreditNotes([]);
        } finally {
            setLoading(false);
        }
    }, [currentPage, pageSize, filters, authHeaders]);

    useEffect(() => {
        fetchCreditNotes();
    }, [fetchCreditNotes]);

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
        setCurrentPage(0);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this credit note?')) {
            try {
                await axios.delete(`${API_URL}/credit-notes/${id}`, authHeaders);
                fetchCreditNotes();
            } catch (err) {
                alert(`Error: ${err.response?.data?.message || 'Failed to delete record.'}`);
            }
        }
    };

    return (
        <div className="flex flex-col h-full bg-slate-50">
            {/* Header */}
            <div className="bg-primary p-4 flex justify-between items-center text-primary-foreground shadow-sm">
                <div>
                    <h1 className="text-xl font-bold">Manage Credit Notes</h1>
                    <div className="text-xs opacity-80 mt-1 flex items-center gap-1">
                        Home <span>&gt;</span> Sales <span>&gt;</span> Manage Credit Notes
                    </div>
                </div>
                <button
                    onClick={() => navigate('/sales/credit-notes/new')}
                    className="bg-purple-800 text-white border border-purple-700 px-4 py-2 rounded text-sm hover:bg-purple-900 flex items-center gap-2 font-bold shadow-sm transition-colors"
                >
                    <Plus size={16} /> New Credit Notes
                </button>
            </div>

            <div className="p-4 space-y-4 flex-grow overflow-auto">
                {/* Filters */}
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
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
                            <label className="block text-xs font-bold text-gray-700 mb-1">Location</label>
                            <select
                                name="locationId"
                                value={filters.locationId}
                                onChange={handleFilterChange}
                                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary bg-white"
                            >
                                <option value="">All Locations</option>
                                {locations.map(loc => (
                                    <option key={loc.id} value={loc.id}>{loc.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <button
                                onClick={fetchCreditNotes}
                                className="bg-purple-900 text-white px-6 py-2 rounded font-bold text-sm hover:bg-opacity-90 transition-colors flex items-center justify-center gap-2 h-[38px] min-w-[100px]"
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
                                <table className="w-full text-xs text-left">
                                    <thead className="bg-gray-100 text-gray-700 font-bold border-b">
                                        <tr>
                                            <th className="px-4 py-3 border-r w-12 text-center">S.No.</th>
                                            <th className="px-4 py-3 border-r">Date</th>
                                            <th className="px-4 py-3 border-r">Credit Notes#</th>
                                            <th className="px-4 py-3 border-r">Invoice No#</th>
                                            <th className="px-4 py-3 border-r">Customer Name</th>
                                            <th className="px-4 py-3 border-r">Status</th>
                                            <th className="px-4 py-3 border-r text-right">Amount</th>
                                            <th className="px-4 py-3 border-r text-right">Balance Due</th>
                                            <th className="px-4 py-3 text-center w-28">Operation</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {creditNotes.length === 0 ? (
                                            <tr><td colSpan="9" className="px-4 py-8 text-center text-gray-500">No record available</td></tr>
                                        ) : (
                                            creditNotes.map((item, index) => (
                                                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                                                    <td className="px-4 py-3 text-center text-gray-500 border-r">{currentPage * pageSize + index + 1}</td>
                                                    <td className="px-4 py-3 text-gray-600 border-r">{item.creditNoteDate ? new Date(item.creditNoteDate).toLocaleDateString() : '-'}</td>
                                                    <td className="px-4 py-3 text-blue-600 font-medium border-r cursor-pointer hover:underline" onClick={() => navigate(`/sales/credit-notes/${item.id}`)}>{item.creditNoteNumber}</td>
                                                    <td className="px-4 py-3 text-gray-600 border-r">{item.invoiceNumber || '-'}</td>
                                                    <td className="px-4 py-3 font-medium text-gray-800 border-r">{item.customerName}</td>
                                                    <td className="px-4 py-3 border-r">
                                                        <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${item.status === 'OPEN' ? 'bg-green-100 text-green-700' :
                                                                item.status === 'CLOSED' ? 'bg-gray-100 text-gray-700' :
                                                                    'bg-red-100 text-red-700'
                                                            }`}>
                                                            {item.status || 'OPEN'}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-gray-800 font-bold text-right border-r">{item.amount?.toFixed(2)}</td>
                                                    <td className="px-4 py-3 text-gray-600 text-right border-r">{item.balanceDue?.toFixed(2) || '0.00'}</td>
                                                    <td className="px-4 py-3 text-center">
                                                        <div className="flex items-center justify-center gap-2">
                                                            <button
                                                                onClick={() => navigate(`/sales/credit-notes/edit/${item.id}`)}
                                                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                                                title="Edit"
                                                            >
                                                                <Edit size={14} />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDelete(item.id)}
                                                                className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                                                                title="Delete"
                                                            >
                                                                <Trash2 size={14} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination (Client-Side) */}
                            {totalPages > 1 && (
                                <div className="p-4 border-t flex justify-between items-center text-xs text-gray-500 bg-gray-50">
                                    <span>
                                        Showing {currentPage * pageSize + 1} to {Math.min((currentPage + 1) * pageSize, creditNotes.length + currentPage * pageSize)} entries
                                    </span>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
                                            disabled={currentPage === 0}
                                            className="px-3 py-1 bg-white border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Previous
                                        </button>
                                        <button
                                            onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))}
                                            disabled={currentPage >= totalPages - 1}
                                            className="px-3 py-1 bg-white border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Next
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CreditNotes;
