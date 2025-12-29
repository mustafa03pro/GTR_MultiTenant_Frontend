import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { PlusCircle, Edit, Trash2, Loader, AlertCircle, Search, Eye } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_BASE_URL;

const PurchaseDebitNotePage = () => {
  const navigate = useNavigate();
  const [debitNotes, setDebitNotes] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Search Filters
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      
      const [dnRes, locRes] = await Promise.all([
        axios.get(`${API_URL}/purchase/debit-notes`, {
            headers,
            params: { page: 0, size: 200, sort: 'createdAt,desc' }
        }),
        axios.get(`${API_URL}/locations`, { headers })
      ]);

      setDebitNotes(dnRes.data.content || dnRes.data || []);
      setLocations(Array.isArray(locRes.data) ? locRes.data : (locRes.data.content || []));
    } catch (err) {
      console.error('Failed to fetch data:', err);
      setError('Failed to load data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this debit note?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/purchase/debit-notes/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchData(); // Reload
    } catch (err) {
      console.error('Failed to delete debit note', err);
      setError('Failed to delete debit note.');
    }
  };

  // Filter Logic
  const filtered = debitNotes.filter(dn => {
      // Date Filter
      if (fromDate) {
          const dnDate = new Date(dn.debitNoteDate);
          const from = new Date(fromDate);
          if (dnDate < from) return false;
      }
      if (toDate) {
          const dnDate = new Date(dn.debitNoteDate);
          const to = new Date(toDate);
          if (dnDate > to) return false;
      }
      // Location Filter
      if (selectedLocation && String(dn.locationId) !== String(selectedLocation)) {
          return false;
      }
      return true;
  });

  return (
    <div className="p-4 bg-slate-50 min-h-screen font-sans text-sm">
      {/* Breadcrumb */}
      <div className="text-xs text-slate-500 mb-2">
         <Link to="/" className="hover:text-blue-600">Home</Link> &gt; <span className="text-slate-700">Purchase</span>
      </div>

      {/* Blue Header */}
      <div className="bg-sky-500 text-white px-4 py-3 rounded-t-md shadow-sm mb-0 flex justify-between items-center">
        <h1 className="text-lg font-medium">Manage Debit notes</h1>
        <Link to="/purchase-dashboard/debit-notes/new" className="bg-white text-sky-600 p-1.5 rounded hover:bg-sky-50" title="New Debit Note">
            <PlusCircle size={18} />
        </Link>
      </div>

      {/* Filter Section */}
      <div className="bg-white p-4 border border-t-0 border-slate-200 shadow-sm rounded-b-md mb-4">
          <div className="flex flex-wrap items-end gap-4">
              <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">From</label>
                  <input 
                    type="date" 
                    value={fromDate} 
                    onChange={e => setFromDate(e.target.value)} 
                    className="border border-slate-300 rounded px-2 py-1.5 text-sm w-36 focus:outline-none focus:border-sky-500" 
                  />
              </div>
              <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">To</label>
                  <input 
                    type="date" 
                    value={toDate} 
                    onChange={e => setToDate(e.target.value)} 
                    className="border border-slate-300 rounded px-2 py-1.5 text-sm w-36 focus:outline-none focus:border-sky-500" 
                  />
              </div>
              <div className="flex-1 min-w-[200px]">
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Location</label>
                  <select 
                    value={selectedLocation} 
                    onChange={e => setSelectedLocation(e.target.value)}
                    className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:border-sky-500"
                  >
                      <option value="">All Locations</option>
                      {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                  </select>
              </div>
              <div>
                  <button 
                    onClick={() => {}} // Filtering is reactive, but button satisfies UI requirement
                    className="bg-purple-900 text-white px-6 py-1.5 rounded text-sm hover:bg-purple-800 flex items-center gap-2"
                  >
                      <Search size={16} /> Search
                  </button>
              </div>
          </div>
      </div>

      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 text-xs">{error}</div>}

      {/* Table */}
      <div className="bg-white border text-card-foreground rounded-md shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center h-40"><Loader className="h-6 w-6 animate-spin text-primary" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs text-left">
              <thead className="bg-slate-50 border-b text-slate-600 font-semibold uppercase">
                <tr>
                  <th className="p-3 border-r">S.No.</th>
                  <th className="p-3 border-r">Date</th>
                  <th className="p-3 border-r">Debit Notes#</th>
                  <th className="p-3 border-r">Bill No#</th>
                  <th className="p-3 border-r">Supplier Name</th>
                  <th className="p-3 border-r">Status</th>
                  <th className="p-3 border-r text-right">Amount</th>
                  <th className="p-3 border-r text-right">Balance Due</th>
                  <th className="p-3 text-center">Operation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.length > 0 ? filtered.map((dn, index) => (
                  <tr key={dn.id} className="hover:bg-slate-50">
                    <td className="p-3 border-r">{index + 1}</td>
                    <td className="p-3 border-r">{dn.debitNoteDate ? new Date(dn.debitNoteDate).toLocaleDateString() : '—'}</td>
                    <td className="p-3 border-r font-medium text-sky-600 hover:underline cursor-pointer" onClick={() => navigate(`/purchase-dashboard/debit-notes/view/${dn.id}`)}>
                        {dn.debitNoteNumber || '—'}
                    </td>
                    <td className="p-3 border-r">{dn.billNumber || '—'}</td>
                    <td className="p-3 border-r font-medium text-slate-900">{dn.supplierName || '—'}</td>
                    <td className="p-3 border-r">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                            dn.status === 'OPEN' ? 'bg-green-50 text-green-700 border-green-200' :
                            dn.status === 'CLOSED' ? 'bg-gray-50 text-gray-700 border-gray-200' : 
                            dn.status === 'VOID' ? 'bg-red-50 text-red-700 border-red-200' : 
                            'bg-blue-50 text-blue-700 border-blue-200'
                        }`}>
                            {dn.status || 'OPEN'}
                        </span>
                    </td>
                    <td className="p-3 border-r text-right font-medium">{(dn.amount ?? 0).toFixed(2)}</td>
                    <td className="p-3 border-r text-right text-red-600 font-medium">{(dn.balanceDue ?? 0).toFixed(2)}</td>
                    <td className="p-3 text-center">
                      <div className="flex justify-center items-center gap-2">
                        <button onClick={() => navigate(`/purchase-dashboard/debit-notes/edit/${dn.id}`)} className="text-slate-500 hover:text-blue-600" title="Edit"><Edit className="h-4 w-4" /></button>
                        <button onClick={() => handleDelete(dn.id)} className="text-slate-500 hover:text-red-600" title="Delete"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan="9" className="text-center py-10 text-slate-500 italic">No record available</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default PurchaseDebitNotePage;
