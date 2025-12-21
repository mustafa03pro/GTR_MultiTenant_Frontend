import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Edit, FileText, Printer, Mail, Paperclip, ChevronDown, ArrowLeft, Loader2 } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_BASE_URL;

const RentalSalesOrderView = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [order, setOrder] = useState(null);
    const [company, setCompany] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showConvertMenu, setShowConvertMenu] = useState(false);
    const [showMoreMenu, setShowMoreMenu] = useState(false);

    const convertMenuRef = useRef(null);
    const moreMenuRef = useRef(null);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const token = localStorage.getItem('token');
                const headers = { Authorization: `Bearer ${token}` };

                const [orderRes, companyRes] = await Promise.all([
                    axios.get(`${API_URL}/sales/rental-sales-orders/${id}`, { headers }),
                    axios.get(`${API_URL}/company-info`, { headers }).catch(() => ({ data: null }))
                ]);

                let orderData = orderRes.data;
                let partyData = null;

                if (orderData.customerId) {
                    try {
                        const partyRes = await axios.get(`${API_URL}/parties/${orderData.customerId}`, { headers });
                        partyData = partyRes.data;
                    } catch (error) {
                        console.error("Failed to fetch party details", error);
                    }
                }

                setOrder({ ...orderData, customerParty: partyData });
                setCompany(companyRes.data);
            } catch (err) {
                console.error("Error fetching data:", err);
                setError("Failed to load rental sales order details.");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (convertMenuRef.current && !convertMenuRef.current.contains(event.target)) {
                setShowConvertMenu(false);
            }
            if (moreMenuRef.current && !moreMenuRef.current.contains(event.target)) {
                setShowMoreMenu(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const numberToWords = (amount) => {
        // Placeholder for number to words conversion
        return `${amount} Dirhams`;
    };

    const handleDownloadPdf = async () => {
        try {
            const response = await axios.get(`${API_URL}/sales/rental-sales-orders/${id}/pdf`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
                responseType: 'blob',
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Rental_Sales_Order_${order.orderNumber}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            console.error("Failed to download PDF", err);
            alert("Failed to download PDF. Please try again.");
        }
    };

    const handleStatusUpdate = async (newStatus) => {
        if (!window.confirm(`Are you sure you want to mark this order as ${newStatus}?`)) return;
        try {
            const token = localStorage.getItem('token');
            // Assuming the backend accepts status as a request param
            await axios.patch(`${API_URL}/sales/rental-sales-orders/${id}/status`, null, {
                params: { status: newStatus },
                headers: { Authorization: `Bearer ${token}` }
            });
            setOrder(prev => ({ ...prev, status: newStatus }));
            setShowMoreMenu(false);
            alert(`Order status updated to ${newStatus}`);
        } catch (err) {
            console.error("Failed to update status", err);
            alert("Failed to update status");
        }
    };

    const handleWhatsApp = () => {
        const message = `Rental Sales Order #${order.orderNumber} for ${order.customerName}. Total: ${order.netTotal}`;
        const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
        window.open(url, '_blank');
    };

    const handleEmail = () => {
        const subject = `Rental Sales Order #${order.orderNumber}`;
        const body = `Dear Customer,\n\nPlease find attached the Rental Sales Order #${order.orderNumber}.\n\nTotal Amount: ${order.netTotal}\n\nRegards,\n${company?.companyName || 'Company Name'}`;
        const url = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        window.location.href = url;
    };

    const formatAddress = (address) => {
        if (!address) return 'Address not available';
        if (typeof address === 'string') return address;
        const parts = [
            address.addressLine,
            address.city,
            address.state,
            address.country,
            address.zipCode
        ].filter(Boolean);
        return parts.join(', ');
    };

    if (loading) return <div className="flex justify-center items-center h-screen"><Loader2 className="animate-spin h-8 w-8 text-blue-600" /></div>;
    if (error) return <div className="p-8 text-center text-red-600">{error}</div>;
    if (!order) return <div className="p-8 text-center">Rental Sales Order not found.</div>;

    return (
        <div className="flex flex-col h-screen bg-slate-50 print:bg-white print:h-auto">
            {/* Breadcrumb & Header */}
            <div className="bg-white border-b shadow-sm print:hidden">
                <div className="px-6 py-2 text-xs text-gray-500 flex items-center gap-1">
                    <span className="cursor-pointer hover:text-blue-600" onClick={() => navigate('/')}>Home</span> &gt;
                    <span className="cursor-pointer hover:text-blue-600" onClick={() => navigate('/sales')}>Sales</span> &gt;
                    <span className="font-medium text-gray-700">View Rental Sales Order</span>
                </div>
                <div className="px-6 py-3 bg-primary text-white flex justify-between items-center">
                    <h1 className="text-xl font-semibold">View Rental Sales Order</h1>
                    <div className="flex gap-2">
                        <button onClick={() => navigate('/sales/rental-sales-orders')} className="px-3 py-1 bg-primary hover:bg-violet-800 text-sm rounded transition-colors">All Orders</button>
                        <button onClick={() => navigate('/sales/rental-sales-orders/new')} className="px-3 py-1 bg-primary hover:bg-violet-800 text-sm rounded transition-colors">+ New Order</button>
                    </div>
                </div>
            </div>

            {/* Toolbar */}
            <div className="px-6 py-3 flex flex-wrap gap-2 items-center bg-white border-b print:hidden">
                <button onClick={() => navigate(`/sales/rental-sales-orders/edit/${id}`)} className="p-2 bg-[#5bc0de] text-white rounded hover:bg-[#46b8da]" title="Edit"><Edit size={16} /></button>
                <button onClick={handleDownloadPdf} className="p-2 bg-[#d9534f] text-white rounded hover:bg-[#d43f3a]" title="PDF"><FileText size={16} /></button>
                <button onClick={handleWhatsApp} className="p-2 bg-[#5cb85c] text-white rounded hover:bg-[#4cae4c]" title="WhatsApp"><span className="font-bold text-xs">WA</span></button>
                <button onClick={() => window.print()} className="p-2 bg-[#0275d8] text-white rounded hover:bg-[#025aa5]" title="Print"><Printer size={16} /></button>
                <button onClick={() => window.print()} className="px-3 py-1.5 bg-[#0275d8] text-white rounded text-sm hover:bg-[#025aa5] flex items-center gap-1"><Printer size={14} /> Print On Letterhead</button>
                <button onClick={handleEmail} className="p-2 bg-[#f0ad4e] text-white rounded hover:bg-[#eea236]" title="Email"><Mail size={16} /></button>
                <button className="p-2 bg-[#aeb6bf] text-white rounded hover:bg-[#8e99a4]" title="Attachments" onClick={() => alert("Attachments feature coming soon!")}><Paperclip size={16} /></button>

                <div className="relative" ref={convertMenuRef}>
                    <button onClick={() => setShowConvertMenu(!showConvertMenu)} className="px-3 py-1.5 bg-primary text-white rounded text-sm hover:bg-violet-800 flex items-center gap-1">
                        Convert <ChevronDown size={14} />
                    </button>
                    {showConvertMenu && (
                        <div className="absolute top-full left-0 mt-1 w-48 bg-white border rounded shadow-lg z-10 text-sm">

                            <button className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-[#0099cc]" onClick={() => navigate(`/sales/rental-invoices/new?orderId=${id}`)}>Convert to Rental Invoice</button>
                        </div>
                    )}
                </div>

                <div className="relative" ref={moreMenuRef}>
                    <button onClick={() => setShowMoreMenu(!showMoreMenu)} className="px-3 py-1.5 bg-primary text-white rounded text-sm hover:bg-violet-800 flex items-center gap-1">
                        More <ChevronDown size={14} />
                    </button>
                    {showMoreMenu && (
                        <div className="absolute top-full left-0 mt-1 w-48 bg-white border rounded shadow-lg z-10 text-sm">
                            <button className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-gray-700" onClick={() => navigate(`/sales/rental-sales-orders/new?cloneId=${id}`)}>Clone</button>

                            {/* Status Actions */}
                            {order.status !== 'SENT' && order.status !== 'ACCEPTED' && order.status !== 'CANCELLED' && (
                                <button className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-blue-600" onClick={() => handleStatusUpdate('SENT')}>Mark as Sent</button>
                            )}
                            {order.status !== 'ACCEPTED' && order.status !== 'CANCELLED' && (
                                <button className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-green-600" onClick={() => handleStatusUpdate('ACCEPTED')}>Mark as Accepted</button>
                            )}
                            {order.status !== 'REJECTED' && order.status !== 'CANCELLED' && (
                                <button className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-red-600" onClick={() => handleStatusUpdate('REJECTED')}>Mark as Rejected</button>
                            )}
                            {order.status !== 'CANCELLED' && (
                                <button className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-orange-600" onClick={() => handleStatusUpdate('CANCELLED')}>Mark as Canceled</button>
                            )}

                            <button className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-red-600" onClick={() => {
                                if (window.confirm('Delete this order?')) {
                                    axios.delete(`${API_URL}/sales/rental-sales-orders/${id}`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } })
                                        .then(() => navigate('/sales/rental-sales-orders'))
                                        .catch(err => alert("Failed to delete"));
                                }
                            }}>Delete</button>
                        </div>
                    )}
                </div>
            </div>

            {/* Status Bar */}
            <div className="px-6 py-2 bg-[#f9f9f9] border-b text-xs text-gray-500 flex flex-col gap-1 print:hidden">
                <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold text-white ${order.status === 'SENT' ? 'bg-blue-500' : order.status === 'ACCEPTED' ? 'bg-green-500' : (order.status === 'RENTAL_INVOICED' || order.status === 'INVOICED') ? 'bg-purple-500' : order.status === 'CANCELLED' ? 'bg-orange-500' : order.status === 'REJECTED' ? 'bg-red-500' : 'bg-gray-400'}`}>{order.status}</span>
                </div>
                <div className="flex justify-between w-full max-w-3xl">
                    {order.updatedAt && (
                        <span>{new Date(order.updatedAt).toLocaleString()}  Updated by {order.updatedBy || 'System'}</span>
                    )}
                </div>
                <div className="flex justify-between w-full max-w-3xl">
                    <span>{order.createdAt ? new Date(order.createdAt).toLocaleString() : '-'}  Created by {order.createdBy || 'System'}</span>
                </div>
            </div>

            {/* Document View */}
            <div className="flex-grow overflow-y-auto p-6 bg-slate-50 print:p-0 print:bg-white print:overflow-visible">
                <div className="w-full bg-white border shadow-sm p-8 relative text-sm print:w-full print:border-none print:shadow-none print:p-0">

                    {/* Company Header */}
                    <div className="text-center mb-8">
                        <h2 className="text-xl font-bold text-gray-800">{company?.companyName || 'Your Company Name'}</h2>
                        <p className="text-gray-600">{company?.address || 'Address Line 1'}, {company?.city || 'City'} {company?.country || 'Country'} {company?.email || 'email@example.com'}</p>
                    </div>

                    {/* Order Info Header */}
                    <div className="flex justify-between items-start border-t border-b border-gray-300 py-4 mb-6">
                        <div className="space-y-1">
                            <div className="flex"><span className="w-32 font-semibold">Order No.</span><span>: {order.orderNumber}</span></div>
                            <div className="flex"><span className="w-32 font-semibold">Order Date</span><span>: {new Date(order.orderDate).toLocaleDateString()}</span></div>
                            <div className="flex"><span className="w-32 font-semibold">Shipment Date</span><span>: {order.shipmentDate ? new Date(order.shipmentDate).toLocaleDateString() : '-'}</span></div>
                            <div className="flex"><span className="w-32 font-semibold">Reference No.</span><span>: {order.reference || '-'}</span></div>
                            {order.salespersonName && (
                                <div className="flex"><span className="w-32 font-semibold">Salesperson</span><span>: {order.salespersonName}</span></div>
                            )}
                        </div>
                        <div className="text-right">
                            <h2 className="text-2xl font-bold text-gray-800">Rental Sales Order</h2>
                            <p className="text-xs font-semibold mt-1">TRN : {company?.pan || '104349488700003'}</p>
                        </div>
                    </div>

                    {/* Bill To */}
                    <div className="mb-6 bg-gray-100 p-2">
                        <h3 className="font-bold mb-1">Bill To</h3>
                        <div className="text-gray-700">
                            <p className="font-semibold">{order.customerParty?.companyName || order.customerName}</p>
                            <p>{formatAddress(order.customerParty?.billingAddress)}</p>
                            <p className="font-semibold mt-1">TRN : {order.customerParty?.vatTrnNumber || 'N/A'}</p>
                            {order.dearSir && <p className="mt-1">Attn: {order.dearSir}</p>}
                        </div>
                    </div>

                    {/* Items Table */}
                    <table className="w-full mb-8">
                        <thead>
                            <tr className="border-t border-b border-gray-300 bg-gray-50 text-xs">
                                <th className="py-2 text-center w-12">S.N</th>
                                <th className="py-2 text-left">Item & Description</th>
                                <th className="py-2 text-center w-24">Qty (Unit)</th>
                                <th className="py-2 text-right w-24">Rent/Unit</th>
                                <th className="py-2 text-center w-20">Days</th>
                                <th className="py-2 text-center w-20">VAT (%)</th>
                                <th className="py-2 text-right w-24">VAT Amount</th>
                                <th className="py-2 text-right w-24">Amount</th>
                            </tr>
                        </thead>
                        <tbody className="text-xs">
                            {order.items.map((item, index) => {
                                const qty = Number(item.quantity) || 0;
                                const rent = Number(item.rentalValue) || 0;
                                const duration = Number(order.rentalDurationDays) || 1;
                                const amount = qty * rent * duration;
                                const vat = item.taxValue || ((amount * (item.taxPercentage || 0)) / 100);

                                return (
                                    <tr key={item.id || index} className="border-b border-gray-200">
                                        <td className="py-3 text-center">{index + 1}</td>
                                        <td className="py-3">
                                            <p className="font-semibold">{item.itemName}</p>
                                            <p className="text-gray-500">{item.itemCode}</p>
                                            {item.description && <p className="text-gray-400 italic text-[10px]">{item.description}</p>}
                                        </td>
                                        <td className="py-3 text-center">{qty}</td>
                                        <td className="py-3 text-right">{rent.toFixed(2)}</td>
                                        <td className="py-3 text-center">{duration}</td>
                                        <td className="py-3 text-center">{item.taxPercentage || '0'}%</td>
                                        <td className="py-3 text-right">{vat.toFixed(2)}</td>
                                        <td className="py-3 text-right">{amount.toFixed(2)}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>

                    {/* Footer Section */}
                    <div className="flex flex-col md:flex-row gap-8">
                        <div className="flex-1 space-y-6">
                            <div>
                                <h4 className="font-bold text-sm mb-1">Amount in Words :</h4>
                                <p className="text-sm text-gray-600">{numberToWords(order.netTotal)}</p>
                            </div>
                            {order.notes && (
                                <div>
                                    <h4 className="font-bold text-sm mb-1">Notes</h4>
                                    <p className="text-xs text-gray-600 whitespace-pre-wrap">{order.notes}</p>
                                </div>
                            )}
                            {order.termsAndConditions && (
                                <div>
                                    <h4 className="font-bold text-sm mb-1">Terms & Conditions</h4>
                                    <p className="text-xs text-gray-600 whitespace-pre-wrap">{order.termsAndConditions}</p>
                                </div>
                            )}
                        </div>

                        <div className="w-full md:w-80">
                            <div className="flex justify-between py-1 text-sm border-b border-gray-100">
                                <span>Total Net Rental / Day</span>
                                <span>{order.subTotalPerDay?.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between py-1 text-sm border-b border-gray-100">
                                <span>Rental Duration</span>
                                <span>{order.rentalDurationDays} Days</span>
                            </div>
                            <div className="flex justify-between py-1 text-sm border-b border-gray-100 font-medium">
                                <span>Total Rental Price</span>
                                <span>{order.totalRentalPrice?.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between py-1 text-sm border-b border-gray-100">
                                <span>Total Discount</span>
                                <span>{order.totalDiscount?.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between py-1 text-sm border-b border-gray-100">
                                <span>Gross Total</span>
                                <span>{order.grossTotal?.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between py-1 text-sm border-b border-gray-100">
                                <span>Total VAT</span>
                                <span>{order.totalTax?.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between py-1 text-sm border-b border-gray-100">
                                <span>Other Charges</span>
                                <span>{order.otherCharges?.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between py-2 text-base font-bold border-t border-gray-300 mt-2">
                                <span>Net Total</span>
                                <span>AED {order.netTotal?.toLocaleString('en-AE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default RentalSalesOrderView;
