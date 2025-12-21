import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Plus, Edit, Trash2, Loader2, Search, Eye } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_BASE_URL;

const RecievedAmount = () => {
    const navigate = useNavigate();
    const [receipts, setReceipts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Filters
    const [filters, setFilters] = useState({
        customerName: '',
        fromDate: '',
        toDate: '',
        searchBy: 'depositDate' // Default search criteria based on screenshot
    });

    const [currentPage, setCurrentPage] = useState(0);
    const [pageSize, setPageSize] = useState(10);
    const [totalPages, setTotalPages] = useState(0);

    const authHeaders = useMemo(() => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }), []);

    const fetchReceipts = useCallback(async () => {
        setLoading(true);
        try {
            // Note: Backend Controller currently only has getAll(HttpServletRequest) which returns List<RecievedResponse>
            // It might not support server-side filtering/pagination yet based on the provided code snippet.
            // I will assume for now we fetch all and filter client-side if needed, OR the backend supports query params implicitly.
            // Given the snippet: public ResponseEntity<List<RecievedResponse>> getAll(HttpServletRequest request)
            // It calls recievedRepository.findByTenant_Id(tenant.getId())
            // So it returns ALL records for the tenant. Filtering will be done client-side for now to match the UI requirements.

            const response = await axios.get(`${API_URL}/recieved`, authHeaders);

            let data = response.data || [];

            // Client-side filtering
            if (filters.customerName) {
                data = data.filter(item => item.customerName?.toLowerCase().includes(filters.customerName.toLowerCase()));
            }
            if (filters.fromDate) {
                data = data.filter(item => new Date(item[filters.searchBy]) >= new Date(filters.fromDate));
            }
            if (filters.toDate) {
                data = data.filter(item => new Date(item[filters.searchBy]) <= new Date(filters.toDate));
            }

            // Client-side pagination
            setTotalPages(Math.ceil(data.length / pageSize));
            const startIndex = currentPage * pageSize;
            const paginatedData = data.slice(startIndex, startIndex + pageSize);

            setReceipts(paginatedData);
            setError(null);
        } catch (err) {
            console.error("Failed to fetch received amounts", err);
            setError('Failed to fetch data');
            setReceipts([]);
        } finally {
            setLoading(false);
        }
    }, [currentPage, pageSize, filters, authHeaders]);

    useEffect(() => {
        fetchReceipts();
    }, [fetchReceipts]);

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
        setCurrentPage(0); // Reset to first page on filter change
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this received amount?')) {
            try {
                await axios.delete(`${API_URL}/recieved/${id}`, authHeaders);
                fetchReceipts();
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
                    <h1 className="text-xl font-bold">Manage Amount Received</h1>
                    <div className="text-xs opacity-80 mt-1 flex items-center gap-1">
                        Home <span>&gt;</span> Sales <span>&gt;</span> Manage Amount Received
                    </div>
                </div>
                <button
                    onClick={() => navigate('/sales/recieved-amounts/new')}
                    className="bg-white text-primary border-none px-4 py-2 rounded text-sm hover:bg-gray-100 flex items-center gap-2 font-bold shadow-sm transition-colors"
                >
                    <Plus size={16} /> New Amount Received
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
                                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                                placeholder="Search Customer..."
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
                        {/* Location Placeholder - if needed based on API support */}
                        {/* <div>
                           <label className="block text-xs font-bold text-gray-700 mb-1">Location</label>
                           <select className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary">
                               <option>HO</option>
                           </select>
                        </div> */}
                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1">Search By</label>
                            <select
                                name="searchBy"
                                value={filters.searchBy}
                                onChange={handleFilterChange}
                                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                            >
                                <option value="depositDate">Deposit Date</option>
                                <option value="receivingDate">Receiving Date</option>
                            </select>
                        </div>
                        <div>
                            <button
                                onClick={fetchReceipts}
                                className="w-full bg-primary text-white px-4 py-2 rounded font-bold text-sm hover:bg-opacity-90 transition-colors flex items-center justify-center gap-2 h-[38px]"
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
                                            <th className="px-4 py-3 border-r">Receiving Date</th>
                                            <th className="px-4 py-3 border-r">Deposit Date</th>
                                            <th className="px-4 py-3 border-r">Received#</th>
                                            <th className="px-4 py-3 border-r">Reference#</th>
                                            <th className="px-4 py-3 border-r">Customer Name</th>
                                            <th className="px-4 py-3 border-r">Invoice#</th>
                                            <th className="px-4 py-3 border-r">Mode</th>
                                            <th className="px-4 py-3 border-r">Deposit To</th>
                                            <th className="px-4 py-3 border-r text-right">Amount</th>
                                            <th className="px-4 py-3 border-r text-right">TDS</th>
                                            <th className="px-4 py-3 border-r text-right">Advance Amount</th>
                                            <th className="px-4 py-3 text-center w-28">Operation</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {receipts.length === 0 ? (
                                            <tr><td colSpan="13" className="px-4 py-8 text-center text-gray-500">No record available</td></tr>
                                        ) : (
                                            receipts.map((item, index) => (
                                                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                                                    <td className="px-4 py-3 text-center text-gray-500 border-r">{currentPage * pageSize + index + 1}</td>
                                                    <td className="px-4 py-3 text-gray-600 border-r">{item.receivingDate ? new Date(item.receivingDate).toLocaleDateString() : '-'}</td>
                                                    <td className="px-4 py-3 text-gray-600 border-r">{item.depositDate ? new Date(item.depositDate).toLocaleDateString() : '-'}</td>
                                                    <td className="px-4 py-3 text-blue-600 font-medium border-r cursor-pointer hover:underline" onClick={() => navigate(`/sales/recieved-amounts/${item.id}`)}>{item.receivedNumber || item.id}</td>
                                                    <td className="px-4 py-3 text-gray-600 border-r">{item.reference || '-'}</td>
                                                    <td className="px-4 py-3 font-medium text-gray-800 border-r">{item.customerName}</td>
                                                    <td className="px-4 py-3 text-gray-600 border-r">{item.invoiceNumber || '-'}</td>
                                                    <td className="px-4 py-3 text-gray-600 border-r">{item.depositMode || '-'}</td>
                                                    <td className="px-4 py-3 text-gray-600 border-r">{'HO'}</td> {/* Location currently hardcoded or needing logic */}
                                                    <td className="px-4 py-3 text-gray-800 font-bold text-right border-r">{item.amount?.toFixed(2)}</td>
                                                    <td className="px-4 py-3 text-gray-600 text-right border-r">{item.tds?.toFixed(2) || '0.00'}</td>
                                                    <td className="px-4 py-3 text-gray-600 text-right border-r">{item.advanceAmount?.toFixed(2) || '0.00'}</td>
                                                    <td className="px-4 py-3 text-center">
                                                        <div className="flex items-center justify-center gap-2">
                                                            <button
                                                                onClick={() => navigate(`/sales/recieved-amounts/edit/${item.id}`)}
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
                                        Showing {currentPage * pageSize + 1} to {Math.min((currentPage + 1) * pageSize, receipts.length + currentPage * pageSize)} entries
                                    </span>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
                                            disabled={currentPage === 0}
                                            className="px-3 py-1 bg-white border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Previous
                                        </button>
                                        <div className="flex gap-1">
                                            {[...Array(totalPages)].map((_, i) => (
                                                <button
                                                    key={i}
                                                    onClick={() => setCurrentPage(i)}
                                                    className={`w-7 h-7 flex items-center justify-center rounded border ${currentPage === i
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

export default RecievedAmount;
