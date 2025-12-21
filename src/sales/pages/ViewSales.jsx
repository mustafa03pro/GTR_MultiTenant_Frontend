import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { X, Edit, FileText, Loader2, ArrowLeft } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_BASE_URL;

const getStatusColor = (status) => {
    switch (status) {
        case 'DRAFT': return 'bg-gray-400';
        case 'OPEN': return 'bg-blue-500';
        case 'PARTIALLY_INVOICED': return 'bg-orange-500';
        case 'INVOICED': return 'bg-green-500';
        case 'CANCELLED': return 'bg-red-500';
        default: return 'bg-gray-400';
    }
};

const ViewSales = () => {
    const { id: orderId } = useParams();
    const navigate = useNavigate();
    const [viewingOrder, setViewingOrder] = useState(null);
    const [loading, setLoading] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    const [showConvertDropdown, setShowConvertDropdown] = useState(false);
    const [showMoreDropdown, setShowMoreDropdown] = useState(false);


    const [company, setCompany] = useState(null);
    const attachmentRef = React.useRef(null);

    const authHeaders = useMemo(() => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }), []);

    useEffect(() => {
        const fetchCompany = async () => {
            try {
                const res = await axios.get(`${API_URL}/company-info`, authHeaders);
                setCompany(res.data);
            } catch (e) {
                console.error("Failed to fetch company info", e);
            }
        };
        fetchCompany();

        if (orderId) {
            const fetchOrderDetails = async () => {
                setLoading(true);
                try {
                    const response = await axios.get(`${API_URL}/sales/orders/${orderId}`, authHeaders);
                    setViewingOrder(response.data);
                } catch (err) {
                    console.error("Failed to fetch order details", err);
                } finally {
                    setLoading(false);
                }
            };
            fetchOrderDetails();
        }
    }, [orderId, authHeaders]);

    const handleWhatsApp = () => {
        const phoneNumber = viewingOrder?.customerParty?.phone || '';
        const text = `Hi, here is the Sales Order ${viewingOrder?.salesOrderNumber}.`;
        window.open(`https://wa.me/${phoneNumber}?text=${encodeURIComponent(text)}`, '_blank');
    };

    const handleEmail = () => {
        const email = viewingOrder?.customerParty?.email || '';
        const subject = `Sales Order ${viewingOrder?.salesOrderNumber}`;
        const body = `Dear Customer,\n\nPlease find attached the Sales Order ${viewingOrder?.salesOrderNumber}.\n\nRegards,\n${company?.companyName || ''}`;
        window.location.href = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    };

    const handlePrintLetterhead = () => {
        window.print();
    };

    const scrollToAttachments = () => {
        if (attachmentRef.current) {
            attachmentRef.current.scrollIntoView({ behavior: 'smooth' });
        } else if (!viewingOrder?.attachments || viewingOrder.attachments.length === 0) {
            alert("No attachments found.");
        }
    };

    const handleCancelOrder = async () => {
        if (!window.confirm('Are you sure you want to mark this order as CANCELLED (Void)?')) return;
        try {
            await axios.patch(`${API_URL}/sales/orders/${orderId}/status`, null, {
                params: { status: 'CANCELLED' },
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            setViewingOrder(prev => ({ ...prev, status: 'CANCELLED' }));
            setShowMoreDropdown(false);
        } catch (err) {
            console.error("Failed to cancel order", err);
            alert("Failed to update status. Please try again.");
        }
    };

    const handleDeleteOrder = async () => {
        if (!window.confirm('Are you sure you want to PERMANENTLY DELETE this sales order? This action cannot be undone.')) return;
        try {
            await axios.delete(`${API_URL}/sales/orders/${orderId}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            alert("Sales Order deleted successfully.");
            navigate('/sales/orders');
        } catch (err) {
            console.error("Failed to delete order", err);
            alert("Failed to delete order. Please try again.");
        }
    };

    // No modal overlay needed, just full page content
    return (
        <div className="flex flex-col h-full bg-slate-50">
            {/* Breadcrumb / Top Bar - Similar to View Quotation screenshot */}
            <div className="bg-white border-b px-6 py-2 text-sm text-gray-500 mb-4">
                <span>Home</span> &gt; <span>Sales</span> &gt; <span className="font-semibold text-gray-800">View Sale Order</span>
            </div>

            <main className="flex-grow px-6 pb-6 overflow-auto">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                    {/* Header - Blue Bar */}
                    <div className="bg-primary text-white px-6 py-3 rounded-t-lg flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <button onClick={() => navigate('/sales/orders')} className="hover:bg-primary p-1 rounded transition-colors" title="Back"><ArrowLeft size={20} /></button>
                            <h2 className="text-xl font-bold">View Sale Order</h2>
                        </div>
                        <div className="flex gap-2">
                            <button className="bg-primary hover:bg-violet-800 px-3 py-1 rounded text-sm font-medium transition-colors">All Sales Orders</button>
                            <button onClick={() => navigate('/sales/orders/new')} className="bg-primary hover:bg-violet-800 px-3 py-1 rounded text-sm font-medium transition-colors flex items-center gap-1">+ New Sale Order</button>
                        </div>
                    </div>

                    {/* Toolbar */}
                    <div className="bg-gray-50 border-b p-3 flex flex-wrap gap-2 items-center relative z-10 print:hidden">
                        <button onClick={() => navigate(`/sales/orders/edit/${orderId}`)} className="flex items-center gap-1 bg-blue-500 text-white px-3 py-1.5 rounded text-sm hover:bg-primary transition-colors" title="Edit"><Edit size={16} /></button>
                        <button onClick={() => alert('PDF feature coming soon')} className="flex items-center gap-1 bg-red-500 text-white px-3 py-1.5 rounded text-sm hover:bg-red-600 transition-colors" title="PDF"><FileText size={16} /></button>
                        <button onClick={handleWhatsApp} className="flex items-center gap-1 bg-green-500 text-white px-3 py-1.5 rounded text-sm hover:bg-green-600 transition-colors" title="WhatsApp"><span className="font-bold">WhatsApp</span></button>
                        <button onClick={() => window.print()} className="flex items-center gap-1 bg-blue-600 text-white px-3 py-1.5 rounded text-sm hover:bg-blue-700 transition-colors" title="Print"><span className="font-bold">Print</span></button>
                        <button onClick={handlePrintLetterhead} className="flex items-center gap-1 bg-sky-600 text-white px-3 py-1.5 rounded text-sm hover:bg-sky-700 transition-colors">Print On Letterhead</button>
                        <button onClick={handleEmail} className="flex items-center gap-1 bg-yellow-500 text-white px-3 py-1.5 rounded text-sm hover:bg-yellow-600 transition-colors" title="Email"><span className="font-bold">Email</span></button>
                        <button onClick={scrollToAttachments} className="flex items-center gap-1 bg-gray-500 text-white px-3 py-1.5 rounded text-sm hover:bg-gray-600 transition-colors" title="Attachments"><span className="font-bold">Attachments</span></button>

                        <div className="ml-auto flex gap-2 relative">
                            {/* Convert Dropdown */}
                            <div className="relative">
                                <button
                                    onClick={() => { setShowConvertDropdown(!showConvertDropdown); setShowMoreDropdown(false); }}
                                    className="bg-primary text-white px-4 py-1.5 rounded text-sm hover:bg-violet-800 flex items-center gap-1 transition-colors"
                                >
                                    Convert <span className="text-xs">▼</span>
                                </button>
                                {showConvertDropdown && (
                                    <div className="absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-20">
                                        <button
                                            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                            onClick={() => navigate(`/sales/invoices/new?salesOrderId=${orderId}`)}
                                        >
                                            Convert to Invoice
                                        </button>
                                        <button
                                            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                            onClick={() => navigate(`/sales/proforma-invoices/new?salesOrderId=${orderId}`)}
                                        >
                                            Convert to Proforma Invoice
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* More Dropdown */}
                            <div className="relative">
                                <button
                                    onClick={() => { setShowMoreDropdown(!showMoreDropdown); setShowConvertDropdown(false); }}
                                    className="bg-primary text-white px-4 py-1.5 rounded text-sm hover:bg-violet-800 flex items-center gap-1 transition-colors"
                                >
                                    More <span className="text-xs">▼</span>
                                </button>
                                {showMoreDropdown && (
                                    <div className="absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-20">
                                        <button className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" onClick={() => navigate(`/sales/orders/new?cloneId=${orderId}`)}>Clone</button>
                                        <button className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50" onClick={handleDeleteOrder}>Delete</button>
                                        <button className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" onClick={handleCancelOrder}>Void</button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Status Bar */}
                    {viewingOrder && (
                        <div className="px-6 py-2 bg-[#f9f9f9] border-b text-xs text-gray-500 flex flex-col gap-1 print:hidden">
                            <div className="flex items-center gap-2">
                                <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold text-white ${getStatusColor(viewingOrder.status)}`}>{viewingOrder.status}</span>
                            </div>
                            <div className="flex justify-between w-full max-w-3xl">
                                {viewingOrder.updatedAt && (
                                    <span>{new Date(viewingOrder.updatedAt).toLocaleString()}  Updated by {viewingOrder.updatedBy || 'System'}</span>
                                )}
                            </div>
                            <div className="flex justify-between w-full max-w-3xl">
                                <span>{viewingOrder.createdAt ? new Date(viewingOrder.createdAt).toLocaleString() : '-'}  Created by {viewingOrder.createdBy || 'System'}</span>
                            </div>
                        </div>
                    )}

                    <div className="p-8 bg-gray-50/50 min-h-[600px] overflow-y-auto">
                        {loading ? (
                            <div className="flex justify-center items-center h-64"><Loader2 className="h-10 w-10 animate-spin text-blue-500" /></div>
                        ) : viewingOrder ? (
                            <div className="w-full space-y-4">

                                {/* Invoice Document */}
                                <div id="printable-invoice" className="bg-white p-10 shadow-lg border border-gray-300 text-black font-sans leading-snug print:shadow-none print:border-none print:p-0 print:m-0 print:w-full">
                                    <style>
                                        {`
                                            @media print {
                                                body * {
                                                    visibility: hidden;
                                                }
                                                #printable-invoice, #printable-invoice * {
                                                    visibility: visible;
                                                }
                                                #printable-invoice {
                                                    position: fixed;
                                                    left: 0;
                                                    top: 0;
                                                    width: 100%;
                                                    height: 100%;
                                                    z-index: 9999;
                                                    margin: 0;
                                                    padding: 20px; /* Optional padding for print */
                                                    overflow: visible;
                                                }
                                                @page {
                                                    margin: 0;
                                                    size: auto;
                                                }
                                            }
                                        `}
                                    </style>

                                    {/* Company Header */}
                                    <div className="text-center mb-8">
                                        <h1 className="text-xl font-bold uppercase tracking-wide">Tact Plastic Industries LLC</h1>
                                        <p className="text-sm text-gray-700">Modern Industrial Area, Umm Al Qaiwain UAE | saleem@tactplastic.com</p>
                                    </div>

                                    {/* Order Details Grid */}
                                    <div className="border-t-2 border-b-2 border-gray-800 py-4 mb-6 flex justify-between items-start">
                                        <div className="text-sm font-bold space-y-1">
                                            <div className="grid grid-cols-[100px_1fr] gap-2">
                                                <span>Order No.</span><span>: {viewingOrder.salesOrderNumber}</span>
                                            </div>
                                            <div className="grid grid-cols-[100px_1fr] gap-2">
                                                <span>Order Date</span><span>: {new Date(viewingOrder.salesOrderDate).toLocaleDateString()}</span>
                                            </div>
                                            <div className="grid grid-cols-[100px_1fr] gap-2">
                                                <span>Expiry Date</span><span>: {viewingOrder.expiryDate ? new Date(viewingOrder.expiryDate).toLocaleDateString() : 'N/A'}</span>
                                            </div>
                                            <div className="grid grid-cols-[100px_1fr] gap-2">
                                                <span>Reference No.</span><span>: {viewingOrder.reference || 'N/A'}</span>
                                            </div>
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-bold uppercase text-right">Sales Order</h2>
                                        </div>
                                    </div>

                                    {/* Bill To */}
                                    <div className="mb-6">
                                        <h3 className="font-bold mb-1 border-b border-gray-300 pb-1 w-full text-sm">Bill To</h3>
                                        <p className="font-bold text-lg uppercase">{viewingOrder.customerName}</p>
                                    </div>

                                    {/* Items Table */}
                                    <div className="mb-6">
                                        <table className="w-full text-xs border-collapse">
                                            <thead>
                                                <tr className="border-t-2 border-b-2 border-gray-800 font-bold bg-white">
                                                    <th className="py-2 text-left w-12">S.N</th>
                                                    <th className="py-2 text-left">Item & Description</th>
                                                    <th className="py-2 text-right">Quantity(Gross)</th>
                                                    <th className="py-2 text-right">Quantity(Net)</th>
                                                    <th className="py-2 text-right">Rate</th>
                                                    <th className="py-2 text-right">VAT (%)</th>
                                                    <th className="py-2 text-right">VAT Amount</th>
                                                    <th className="py-2 text-right">Amount</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {viewingOrder.items.map((item, i) => (
                                                    <tr key={i} className="border-b border-gray-200">
                                                        <td className="py-2">{i + 1}</td>
                                                        <td className="py-2">
                                                            <div className="font-bold">{item.itemName}</div>
                                                            <div className="text-gray-500">{item.description}</div>
                                                        </td>
                                                        <td className="py-2 text-right text-gray-500">(kgs)</td>
                                                        <td className="py-2 text-right">{item.quantity} (kgs)</td>
                                                        <td className="py-2 text-right">{item.rate.toLocaleString('en-AE', { minimumFractionDigits: 2 })}</td>
                                                        <td className="py-2 text-right">0.05%</td>
                                                        <td className="py-2 text-right">{(item.amount * 0.05).toLocaleString('en-AE', { minimumFractionDigits: 2 })}</td>
                                                        <td className="py-2 text-right">{item.amount.toLocaleString('en-AE', { minimumFractionDigits: 2 })}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Totals Section */}
                                    <div className="flex justify-between items-start text-sm mt-8 border-t pt-4">
                                        <div className="w-1/2 pr-8">
                                            <div className="mb-6">
                                                <span className="font-bold">Amount in Words :</span>
                                                <p className="mt-1 italic text-gray-700">Thirty-Nine Thousand Nineteen Dirhams and Fifty fils</p>
                                            </div>

                                            <div className="mb-4">
                                                <h4 className="font-bold mb-1">Notes</h4>
                                                <p className="text-xs text-gray-600">{viewingOrder.notes || 'No notes'}</p>
                                            </div>

                                            <div>
                                                <h4 className="font-bold mb-1">Terms & Conditions</h4>
                                                <p className="text-xs text-gray-600">{viewingOrder.termsAndConditions || 'No specific terms.'}</p>
                                            </div>
                                        </div>

                                        <div className="w-1/2 pl-8 border-l border-gray-300">
                                            <div className="space-y-2">
                                                <div className="flex justify-between"><span>Sub Total</span><span>{viewingOrder.subTotal.toLocaleString('en-AE', { minimumFractionDigits: 2 })}</span></div>
                                                <div className="flex justify-between"><span>Total Discount</span><span>{viewingOrder.totalDiscount.toLocaleString('en-AE', { minimumFractionDigits: 2 })}</span></div>
                                                <div className="flex justify-between"><span>Sub Total</span><span>{(viewingOrder.subTotal - viewingOrder.totalDiscount).toLocaleString('en-AE', { minimumFractionDigits: 2 })}</span></div>
                                                <div className="flex justify-between"><span>Total VAT</span><span>{viewingOrder.totalTax.toLocaleString('en-AE', { minimumFractionDigits: 2 })}</span></div>
                                                <div className="flex justify-between"><span>Other Charges</span><span>{viewingOrder.otherCharges.toLocaleString('en-AE', { minimumFractionDigits: 2 })}</span></div>
                                                <div className="flex justify-between font-bold text-lg mt-2 pt-2 border-t border-gray-800">
                                                    <span>Total</span>
                                                    <span>AED {viewingOrder.netTotal.toLocaleString('en-AE', { minimumFractionDigits: 2 })}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Signature */}
                                    <div className="mt-20 flex justify-end">
                                        <div className="text-center w-64">
                                            <div className="border-t border-gray-400 pt-2 font-bold text-sm">Authorized Signature</div>
                                        </div>
                                    </div>

                                </div>

                                {/* Attachments Section */}
                                {viewingOrder.attachments && viewingOrder.attachments.length > 0 && (
                                    <div className="mt-8 border-t pt-4 bg-white p-6 shadow-sm border border-gray-200" ref={attachmentRef}>
                                        <h3 className="font-bold text-sm mb-2">Attachments</h3>
                                        <div className="flex flex-wrap gap-2">
                                            {viewingOrder.attachments.map((file, index) => (
                                                <a key={index} href={`${API_URL}/sales/attachments/${file}`} target="_blank" rel="noreferrer" className="px-3 py-1 bg-gray-100 rounded text-blue-600 hover:underline text-xs flex items-center gap-1 border">
                                                    {file.split('/').pop()}
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                                <h3 className="text-xl font-semibold mb-2">Order Not Found</h3>
                                <p>Unable to load sales order details. Please check the ID or try again.</p>
                                <button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">Retry</button>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default ViewSales;