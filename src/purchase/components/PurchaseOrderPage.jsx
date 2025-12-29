import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { PlusCircle, Edit, Trash2, Loader, AlertCircle, Search, X } from 'lucide-react';
import Pagination from '../../components/Pagination';

const API_URL = import.meta.env.VITE_API_BASE_URL || '';

const PurchaseOrderPage = () => {
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  // Pagination State
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  const [showGrnHistory, setShowGrnHistory] = useState(false);
  const [grnHistoryData, setGrnHistoryData] = useState([]);
  const [grnHistoryLoading, setGrnHistoryLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const fetchPurchaseOrders = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_URL}/purchase/orders`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { page, size, sort: 'createdAt,desc' }
      });
      // Handle page response
      if (res.data.content) {
          setPurchaseOrders(res.data.content);
          setTotalPages(res.data.totalPages);
          setTotalElements(res.data.totalElements);
      } else {
          // Fallback if API doesn't return page structure
          const data = res.data || [];
          setPurchaseOrders(data);
          setTotalPages(1);
          setTotalElements(data.length);
      }
    } catch (err) {
      console.error('Failed to fetch purchase orders:', err);
      setError('Failed to fetch purchase orders.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPurchaseOrders();
  }, [page, size]); // Re-fetch when page or size changes

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this PO?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/purchase/orders/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      fetchPurchaseOrders(); // Refresh list
    } catch (err) {
      console.error('Failed to delete PO', err);
      setError('Failed to delete purchase order.');
    }
  };

  const handleViewGrnHistory = async (order) => {
    setSelectedOrder(order);
    setShowGrnHistory(true);
    setGrnHistoryLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_URL}/purchase/grns/by-order/${order.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setGrnHistoryData(res.data || []);
    } catch (err) {
      console.error('Failed to load GRN history', err);
      setError('Failed to load GRN history for the selected order.');
    } finally {
      setGrnHistoryLoading(false);
    }
  };

  // Client-side search filtering on current page
  const filtered = purchaseOrders.filter(order =>
    (order.poNumber && order.poNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (order.supplierName && order.supplierName ? order.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) : false) ||
    (order.reference && order.reference.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const statusClass = (s) => {
    if (!s) return 'bg-slate-100 text-slate-800';
    switch (s.toLowerCase()) {
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'draft': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  return (
    <div className="p-6 md:p-8">
      <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
        <h1 className="text-3xl font-bold">Purchase Orders</h1>
        <div className="flex items-center gap-2">
          <div className="relative">
            <input
              type="text"
              placeholder="Search by PO# / Supplier / Reference..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input w-full sm:w-72 pr-10 bg-background-muted border-border"
            />
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-foreground-muted" />
          </div>
          <Link to="/purchase-dashboard/purchase-orders/new" className="btn-primary flex items-center gap-2">
            <PlusCircle size={18} /> New PO
          </Link>
        </div>
      </div>

      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}

      <div className="bg-card rounded-xl shadow-sm overflow-hidden border">
        {loading ? (
          <div className="flex justify-center items-center h-80"><Loader className="h-8 w-8 animate-spin text-primary" /></div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-background-muted">
                  <tr>
                    <th className="th-cell">Date</th>
                    <th className="th-cell">PO Number</th>
                    <th className="th-cell">Supplier</th>
                    <th className="th-cell">Reference</th>
                    <th className="th-cell">Location</th>
                    <th className="th-cell">Project</th>
                    <th className="th-cell">Status</th>
                    <th className="th-cell text-right">Total Amount</th>
                    <th className="th-cell">Actions</th>
                    <th className="th-cell">Goods Receipt Note</th>
                  </tr>
                </thead>
                <tbody className="text-foreground-muted">
                  {filtered.length > 0 ? filtered.map(order => (
                    <tr key={order.id} className="border-b hover:bg-background-muted">
                      <td className="td-cell">{order.date ? new Date(order.date).toLocaleDateString() : ''}</td>

                      {/* clickable PO number */}
                      <td className="td-cell font-medium text-foreground">
                        <button
                          onClick={() => navigate(`/purchase-dashboard/purchase-orders/view/${order.id}`)}
                          className="text-primary underline hover:text-primary/80"
                          title={`View PO ${order.poNumber || order.id}`}
                        >
                          {order.poNumber || `PO-${order.id}`}
                        </button>
                      </td>

                      <td className="td-cell">{order.supplierName || '-'}</td>
                      <td className="td-cell">{order.reference || '-'}</td>
                      <td className="td-cell">{order.locationName || '-'}</td>
                      <td className="td-cell">{order.projectNumber || '-'}</td>
                      <td className="td-cell">
                        <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${statusClass(order.status)}`}>
                          {order.status || 'N/A'}
                        </span>
                      </td>
                      <td className="td-cell text-right font-mono">{(order.totalAmount || 0).toFixed(2)} {order.currency || ''}</td>
                      <td className="td-cell">
                        <div className="flex items-center gap-1">
                          <button onClick={() => navigate(`/purchase-dashboard/purchase-orders/edit/${order.id}`)} className="p-2 hover:text-primary hover:bg-background-muted rounded-full" title="Edit"><Edit className="h-4 w-4" /></button>
                          <button onClick={() => handleDelete(order.id)} className="p-2 hover:text-red-600 hover:bg-background-muted rounded-full" title="Delete"><Trash2 className="h-4 w-4" /></button>
                        </div>
                      </td>

                      {/* GRN column */}
                      <td className="td-cell">
                        <div className="flex flex-col items-stretch gap-2">
                          <Link to={`/purchase-dashboard/purchase-orders/${order.id}/grn/new`} className="btn-primary-sm text-center bg-green-600 hover:bg-green-700 text-white">
                            Add GRN
                          </Link>
                          <button onClick={() => handleViewGrnHistory(order)} className="btn-secondary-sm text-center">
                            View History
                          </button>
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr><td colSpan="10" className="text-center py-10 text-foreground-muted"><AlertCircle className="mx-auto h-12 w-12 text-foreground-muted/50" /><h3 className="mt-2 text-sm font-medium">No purchase orders found</h3><p className="mt-1 text-sm">Create a new PO to get started.</p></td></tr>
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

      {/* GRN History Modal */}
      {showGrnHistory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
          <div className="bg-card rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-xl font-semibold">GRN History for PO: {selectedOrder?.poNumber}</h3>
              <button onClick={() => setShowGrnHistory(false)} className="p-2 rounded-full hover:bg-background-muted">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto">
              {grnHistoryLoading ? (
                <div className="flex justify-center items-center h-40"><Loader className="animate-spin h-8 w-8 text-primary" /></div>
              ) : grnHistoryData.length === 0 ? (
                <div className="text-center py-10 text-foreground-muted">
                  <AlertCircle className="mx-auto h-12 w-12 text-foreground-muted/50" />
                  <h3 className="mt-2 text-sm font-medium">No GRNs found</h3>
                  <p className="mt-1 text-sm">No Goods Receipt Notes have been recorded for this Purchase Order.</p>
                </div>
              ) : (
                <table className="min-w-full">
                  <thead className="bg-background-muted">
                    <tr>
                      <th className="th-cell">GRN #</th>
                      <th className="th-cell">Date</th>
                      <th className="th-cell">Items Received</th>
                      <th className="th-cell">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {grnHistoryData.map(grn => (
                      <tr key={grn.id} className="border-b">
                        <td className="td-cell font-medium">{grn.grnNumber}</td>
                        <td className="td-cell">{grn.grnDate ? new Date(grn.grnDate).toLocaleDateString() : ''}</td>
                        <td className="td-cell">
                          {(grn.items || []).map(item => (
                            <div key={item.id} className="text-sm">{item.itemName || item.description || '--'} — Qty: {item.receivedQuantity}</div>
                          ))}
                        </td> 
                        <td className="td-cell">
                          <button onClick={() => navigate(`/purchase-dashboard/grns/${grn.id}`)} className="btn-secondary-sm">View</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PurchaseOrderPage;
