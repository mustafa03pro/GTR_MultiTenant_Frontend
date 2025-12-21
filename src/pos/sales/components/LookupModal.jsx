import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { X, Loader, AlertCircle, Printer, Edit, Search, CreditCard, Trash2 } from 'lucide-react';
import { formatPrice } from '../utils';

const API_URL = import.meta.env.VITE_API_BASE_URL;
const TABS = ['All Sales', 'On Delivery', 'Pending', 'Completed'];

const LookupModal = ({ isOpen, onClose, onResumeSale, onRemoveSale }) => {
    const [activeTab, setActiveTab] = useState(TABS[0]);
    const [isPrinting, setIsPrinting] = useState(null);
    const [processingId, setProcessingId] = useState(null);
    const [sales, setSales] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (isOpen) {
            setLoading(true);
            setError('');
            const token = localStorage.getItem('token');
            axios.get(`${API_URL}/pos/sales`, { headers: { "Authorization": `Bearer ${token}` } })
                .then(res => {
                    setSales(res.data.sort((a, b) => new Date(b.invoiceDate) - new Date(a.invoiceDate)));
                })
                .catch(err => {
                    console.error("Error fetching sales:", err);
                    setError('Failed to load sales data.');
                })
                .finally(() => setLoading(false));
        }
    }, [isOpen]);

    const filteredSales = useMemo(() => {
        let salesToFilter = sales;

        if (activeTab === 'On Delivery') {
            salesToFilter = sales.filter(s => s.status === 'delivering');
        } else if (activeTab === 'Pending') {
            salesToFilter = sales.filter(s => s.paymentStatus !== 'paid');
        } else if (activeTab === 'Completed') {
            salesToFilter = sales.filter(s => s.status === 'completed' && s.paymentStatus === 'paid');
        }

        if (!searchTerm.trim()) {
            return salesToFilter;
        }

        const lowercasedSearchTerm = searchTerm.toLowerCase();
        return salesToFilter.filter(sale =>
            (sale.invoiceNo && sale.invoiceNo.toLowerCase().includes(lowercasedSearchTerm)) ||
            (sale.customerName && sale.customerName.toLowerCase().includes(lowercasedSearchTerm))
        );
    }, [sales, activeTab, searchTerm]);

    const handlePrint = async (saleId) => {
        setIsPrinting(saleId);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}/pos/sales/${saleId}/invoice/pdf`, {
                headers: { "Authorization": `Bearer ${token}` },
                responseType: 'blob',
            });

            const file = new Blob([response.data], { type: 'application/pdf' });
            const fileURL = URL.createObjectURL(file);
            window.open(fileURL, '_blank');
        } catch (err) {
            console.error("Error fetching invoice PDF:", err);
            alert("Could not load the invoice. Please try again.");
        } finally {
            setIsPrinting(null);
        }
    };

    const handleAction = async (id, action) => {
        if (processingId) return;
        setProcessingId(id);
        try {
            await action(id);
        } catch (error) {
            console.error("Action failed", error);
        } finally {
            setProcessingId(null);
        }
    };


    if (!isOpen) return null;

    const renderContent = () => {
        if (loading) {
            return <div className="flex justify-center items-center py-10"><Loader className="animate-spin h-8 w-8 text-blue-600" /></div>;
        }
        if (error) {
            return <div className="text-center text-red-500 py-10"><AlertCircle className="mx-auto h-8 w-8" /><p>{error}</p></div>;
        }
        if (filteredSales.length === 0) {
            return <div className="text-center text-slate-500 py-10"><p>No sales found for '{activeTab}'.</p></div>;
        }

        return (
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                        <tr>
                            <th className="th-cell">Invoice #</th>
                            <th className="th-cell">Date</th>
                            <th className="th-cell">Customer</th>
                            <th className="th-cell">Status</th>
                            <th className="th-cell text-right">Total</th>
                            {(activeTab === 'Completed' || activeTab === 'Pending') && <th className="th-cell">Actions</th>}
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200 text-slate-700">
                        {filteredSales.map(sale => (
                            <tr key={sale.id}>
                                <td className="td-cell font-medium">{sale.invoiceNo}</td>
                                <td className="td-cell text-sm">{new Date(sale.invoiceDate).toLocaleString()}</td>
                                <td className="td-cell">{sale.customerName || 'Walk-in'}</td>
                                <td className="td-cell capitalize">{sale.status} ({sale.paymentStatus})</td>
                                <td className="td-cell text-right font-semibold">{formatPrice(sale.totalCents)}</td>
                                {activeTab === 'Completed' && (
                                    <td className="td-cell">
                                        <div className="flex items-center gap-2">
                                            <button onClick={() => handlePrint(sale.id)} className="p-1.5 text-slate-500 hover:text-blue-600 rounded-full" title="Print Invoice" disabled={isPrinting === sale.id}>
                                                {isPrinting === sale.id ? <Loader className="animate-spin h-4 w-4" /> : <Printer size={16} />}
                                            </button>
                                            <button onClick={() => handleEdit(sale.id)} className="p-1.5 text-slate-500 hover:text-green-600 rounded-full" title="Edit Sale">
                                                <Edit size={16} />
                                            </button>
                                        </div>
                                    </td>
                                )}
                                {activeTab === 'Pending' && (
                                    <td className="td-cell">
                                        <div className="flex items-center gap-2">
                                            <button onClick={() => handleAction(sale.id, onResumeSale)} className="p-1.5 text-slate-500 hover:text-green-600 rounded-full" title="Resume and Pay" disabled={!!processingId}>
                                                {processingId === sale.id ? <Loader className="animate-spin h-4 w-4" /> : <CreditCard size={16} />}
                                            </button>
                                            <button onClick={() => handleAction(sale.id, onRemoveSale)} className="p-1.5 text-slate-500 hover:text-red-600 rounded-full" title="Remove Sale" disabled={!!processingId}>
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl flex flex-col max-h-[80vh]" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b flex justify-between items-center flex-shrink-0">
                    <h3 className="text-xl font-semibold">Lookup Sales</h3>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-100"><X size={20} /></button>
                </div>
                <div className="border-b border-slate-200 flex-shrink-0">
                    <nav className="-mb-px flex space-x-4 px-4" aria-label="Tabs">
                        {TABS.map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === tab
                                        ? 'border-blue-600 text-blue-600'
                                        : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                                    }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </nav>
                </div>
                <div className="p-4 border-b border-slate-200 flex-shrink-0">
                    <div className="relative">
                        <input type="text" placeholder="Search by Invoice # or Customer Name..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="input w-full pl-10" />
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    </div>
                </div>
                <div className="flex-grow overflow-y-auto p-6 pt-0">{renderContent()}</div>
            </div>
        </div>
    );
};

export default LookupModal;