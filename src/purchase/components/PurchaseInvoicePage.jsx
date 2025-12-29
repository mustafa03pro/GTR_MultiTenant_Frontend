import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { PlusCircle, Edit, Trash2, Loader, AlertCircle, Search } from 'lucide-react';
import Pagination from '../../components/Pagination';

const API_URL = import.meta.env.VITE_API_BASE_URL || '';

const PurchaseInvoicePage = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  // Pagination State
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  const fetchInvoices = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_URL}/purchases/invoices`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { page, size, sort: 'createdAt,desc' }
      });
      // Handle page response
      if (res.data.content) {
          setInvoices(res.data.content);
          setTotalPages(res.data.totalPages);
          setTotalElements(res.data.totalElements);
      } else {
          const data = res.data.content || res.data || []; // Handle case where API might return wrapped or unwrapped array
          if (Array.isArray(data)) {
            setInvoices(data);
            setTotalPages(1);
            setTotalElements(data.length);
          } else {
             // If response itself is page object but axios didn't parse content automatically? 
             // Should be covered by first check.
             setInvoices([]);
             setTotalPages(0);
             setTotalElements(0);
          }
      }
    } catch (err) {
      console.error('Failed to fetch purchase invoices:', err);
      setError('Failed to fetch purchase invoices. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [page, size]);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this purchase invoice?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/purchases/invoices/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchInvoices(); // Refresh to update pagination
    } catch (err) {
      console.error('Failed to delete purchase invoice:', err);
      setError('Failed to delete purchase invoice.');
    }
  };

  const filtered = invoices.filter(inv =>
    (inv.billNumber && inv.billNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (inv.supplierName && inv.supplierName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="p-6 md:p-8 font-sans">
      <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
        <h1 className="text-3xl font-bold text-slate-900">Purchase Invoices (Bills)</h1>
        <div className="flex items-center gap-2">
          <div className="relative">
            <input
              type="text"
              placeholder="Search by Bill# or Supplier..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:w-64 pl-4 pr-10 py-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          </div>
          <Link to="/purchase-dashboard/bills/new" className="bg-blue-600 text-white px-4 py-2 rounded-full flex items-center gap-2 hover:bg-blue-700 transition font-medium">
            <PlusCircle size={18} /> New Bill
          </Link>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded relative mb-4 flex items-center gap-2">
          <AlertCircle size={18} />
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center h-80"><Loader className="h-8 w-8 animate-spin text-blue-500" /></div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b">
                  <tr>
                    <th className="px-6 py-4">Bill Date</th>
                    <th className="px-6 py-4">Bill Number</th>
                    <th className="px-6 py-4">Supplier</th>
                    <th className="px-6 py-4">Due Date</th>
                    <th className="px-6 py-4 text-right">Net Total</th>
                    <th className="px-6 py-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.length > 0 ? filtered.map(inv => (
                    <tr key={inv.id} className="hover:bg-slate-50 transition">
                      <td className="px-6 py-4 text-slate-600">
                          {inv.billDate ? new Date(inv.billDate).toLocaleDateString() : '-'}
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-800">
                        <Link to={`/purchase-dashboard/bills/view/${inv.id}`} className="hover:text-blue-600 hover:underline">
                          {inv.billNumber}
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-slate-600">{inv.supplierName}</td>
                      <td className="px-6 py-4 text-slate-600">
                          {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-right font-mono text-slate-700">
                          {(inv.netTotal ?? 0).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button 
                              onClick={() => navigate(`/purchase-dashboard/bills/edit/${inv.id}`)} 
                              className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition" 
                              title="Edit"
                          >
                            <Edit size={16} />
                          </button>
                          <button 
                              onClick={() => handleDelete(inv.id)} 
                              className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-full transition" 
                              title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="6" className="text-center py-12">
                        <div className="flex flex-col items-center justify-center text-slate-400">
                            <AlertCircle size={48} className="mb-3 opacity-20" />
                            <h3 className="text-lg font-medium text-slate-600">No invoices found</h3>
                            <p className="text-sm">Get started by creating a new bill.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            <Pagination 
              currentPage={page}
              totalPages={totalPages}
              onPageChange={setPage}
              pageSize={size}
              onPageSizeChange={(newSize) => { setSize(newSize); setPage(0); }}
              totalElements={totalElements}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default PurchaseInvoicePage;
