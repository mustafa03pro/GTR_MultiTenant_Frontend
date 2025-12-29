import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { PlusCircle, Edit, Trash2, Loader, AlertCircle, Search } from 'lucide-react';
import Pagination from '../../components/Pagination';

const API_URL = import.meta.env.VITE_API_BASE_URL;

const PurchasePaymentPage = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  // Pagination State
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  const fetchPayments = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_URL}/purchases/payments`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { page, size, sort: 'createdAt,desc' }
      });
      if (res.data.content) {
          setPayments(res.data.content);
          setTotalPages(res.data.totalPages);
          setTotalElements(res.data.totalElements);
      } else {
        const data = res.data.content || res.data || [];
        if (Array.isArray(data)) {
            setPayments(data);
            setTotalPages(1);
            setTotalElements(data.length);
        } else {
            setPayments([]);
            setTotalPages(0);
            setTotalElements(0);
        }
      }
    } catch (err) {
      console.error('Failed to fetch purchase payments:', err);
      setError('Failed to load payments.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [page, size]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this payment?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/purchases/payments/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchPayments();
    } catch (err) {
      console.error('Failed to delete payment', err);
      setError('Failed to delete payment.');
    }
  };

  const filtered = payments.filter(p =>
    (p.supplierName && p.supplierName.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (p.reference && p.reference.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (p.paymentMode && p.paymentMode.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="p-6 md:p-8">
      <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
        <h1 className="text-3xl font-bold text-foreground">Purchase Payments</h1>
        <div className="flex items-center gap-2">
          <div className="relative">
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input w-full sm:w-64 pr-10 bg-background-muted border-border px-3 py-2 rounded border"
            />
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-foreground-muted" />
          </div>
          <Link to="/purchase-dashboard/payments/new" className="btn-primary flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
            <PlusCircle size={18} /> New Payment
          </Link>
        </div>
      </div>

      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}

      <div className="bg-card text-card-foreground rounded-xl shadow-sm overflow-hidden bg-white border">
        {loading ? (
          <div className="flex justify-center items-center h-80"><Loader className="h-8 w-8 animate-spin text-primary" /></div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 border-b">
                  <tr>
                    <th className="p-3 text-left font-medium text-gray-600">Date</th>
                    <th className="p-3 text-left font-medium text-gray-600">Supplier</th>
                    <th className="p-3 text-left font-medium text-gray-600">Reference</th>
                    <th className="p-3 text-left font-medium text-gray-600">Mode</th>
                    <th className="p-3 text-right font-medium text-gray-600">Amount</th>
                    <th className="p-3 text-right font-medium text-gray-600">Used</th>
                    <th className="p-3 text-right font-medium text-gray-600">Excess</th>
                    <th className="p-3 text-right font-medium text-gray-600 w-24">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filtered.length > 0 ? filtered.map(p => (
                    <tr key={p.id} className="hover:bg-slate-50">
                      <td className="p-3">{p.paymentDate ? new Date(p.paymentDate).toLocaleDateString() : '—'}</td>
                      <td className="p-3 font-medium text-gray-900">{p.supplierName || '—'}</td>
                      <td className="p-3">
                          <Link to={`/purchase-dashboard/payments/view/${p.id}`} className="text-blue-600 hover:underline">
                              {p.reference || `#${p.id}`}
                          </Link>
                      </td>
                      <td className="p-3 text-gray-500">{p.paymentMode || '—'}</td>
                      <td className="p-3 text-right font-mono font-medium">{(p.amount ?? 0).toFixed(2)}</td>
                      <td className="p-3 text-right text-gray-500">{(p.amountPaid ?? 0).toFixed(2)}</td>
                      <td className="p-3 text-right text-green-600">{(p.amountInExcess ?? 0).toFixed(2)}</td>
                      <td className="p-3 text-right">
                        <div className="flex justify-end items-center gap-1">
                          <button onClick={() => navigate(`/purchase-dashboard/payments/edit/${p.id}`)} className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full" title="Edit"><Edit className="h-4 w-4" /></button>
                          <button onClick={() => handleDelete(p.id)} className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-full" title="Delete"><Trash2 className="h-4 w-4" /></button>
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr><td colSpan="8" className="text-center py-10 text-gray-500"><AlertCircle className="mx-auto h-12 w-12 text-gray-300" /><h3 className="mt-2 text-sm font-medium">No payments found</h3></td></tr>
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

export default PurchasePaymentPage;
