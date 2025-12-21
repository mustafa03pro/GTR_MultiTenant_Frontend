import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Edit, FileText, Printer, Mail, Paperclip, ChevronDown, ArrowLeft, Loader2 } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_BASE_URL;

const ViewQuotation = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [quotation, setQuotation] = useState(null);
    const [company, setCompany] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showConvertMenu, setShowConvertMenu] = useState(false);
    const [showMoreMenu, setShowMoreMenu] = useState(false);

    const convertMenuRef = useRef(null);
    const moreMenuRef = useRef(null);
    const attachmentRef = useRef(null);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const token = localStorage.getItem('token');
                const headers = { Authorization: `Bearer ${token}` };

                const [quotationRes, companyRes] = await Promise.all([
                    axios.get(`${API_URL}/sales/quotations/${id}`, { headers }),
                    axios.get(`${API_URL}/company-info`, { headers }).catch(() => ({ data: null }))
                ]);

                let quotationData = quotationRes.data;
                let partyData = null;

                if (quotationData.customerId) {
                    try {
                        const partyRes = await axios.get(`${API_URL}/parties/${quotationData.customerId}`, { headers });
                        partyData = partyRes.data;
                    } catch (error) {
                        console.error("Failed to fetch party details", error);
                    }
                }

                setQuotation({ ...quotationData, customerParty: partyData });
                setCompany(companyRes.data);
            } catch (err) {
                console.error("Error fetching data:", err);
                setError("Failed to load quotation details.");
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
        // In a real app, use a library like 'to-words'
        return `${amount} Dirhams`;
    };

    const handleDownloadPdf = async () => {
        try {
            const response = await axios.get(`${API_URL}/sales/quotations/${id}/pdf`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
                responseType: 'blob',
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Quotation_${quotation.quotationNumber}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            console.error("Failed to download PDF", err);
            alert("Failed to download PDF. Please try again.");
        }
    };

    const handleCancelQuotation = async () => {
        if (!window.confirm('Are you sure you want to mark this quotation as CANCELLED?')) return;
        try {
            await axios.patch(`${API_URL}/sales/quotations/status/by-number`, null, {
                params: {
                    quotationNumber: quotation.quotationNumber,
                    status: 'CANCELLED'
                },
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            // Update local state or reload
            setQuotation(prev => ({ ...prev, status: 'CANCELLED' }));
            setShowMoreMenu(false);
        } catch (err) {
            console.error("Failed to cancel quotation", err);
            alert("Failed to update status");
        }
    };

    const handleWhatsApp = () => {
        const phoneNumber = quotation.customerParty?.phone || ''; // Assuming phone field
        const text = `Hi, here is the quotation ${quotation.quotationNumber}.`;
        window.open(`https://wa.me/${phoneNumber}?text=${encodeURIComponent(text)}`, '_blank');
    };

    const handleEmail = () => {
        const email = quotation.customerParty?.email || '';
        const subject = `Quotation ${quotation.quotationNumber}`;
        const body = `Dear Customer,\n\nPlease find attached the quotation ${quotation.quotationNumber}.\n\nRegards,\n${company?.companyName || ''}`;
        window.location.href = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    };

    const scrollToAttachments = () => {
        if (attachmentRef.current) {
            attachmentRef.current.scrollIntoView({ behavior: 'smooth' });
        } else if (!quotation.attachments || quotation.attachments.length === 0) {
            alert("No attachments found.");
        }
    };

    const handlePrintLetterhead = () => {
        // Logic to hide header/footer for letterhead printing could be added here via state/class
        window.print();
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
    if (!quotation) return <div className="p-8 text-center">Quotation not found.</div>;

    return (
        <div className="flex flex-col h-screen bg-slate-50 print:bg-white print:h-auto">
            {/* Breadcrumb & Header */}
            <div className="bg-white border-b shadow-sm print:hidden">
                <div className="px-6 py-2 text-xs text-gray-500 flex items-center gap-1">
                    <span className="cursor-pointer hover:text-blue-600" onClick={() => navigate('/')}>Home</span> &gt;
                    <span className="cursor-pointer hover:text-blue-600" onClick={() => navigate('/sales')}>Sales</span> &gt;
                    <span className="font-medium text-gray-700">View Quotation</span>
                </div>
                <div className="px-6 py-3 bg-[#0099cc] text-white flex justify-between items-center">
                    <h1 className="text-xl font-semibold">View Quotation</h1>
                    <div className="flex gap-2">
                        <button onClick={() => navigate('/sales/quotations')} className="px-3 py-1 bg-[#0088b5] hover:bg-[#00779e] text-sm rounded transition-colors">All Quotation</button>
                        <button onClick={() => navigate('/sales/quotations/new')} className="px-3 py-1 bg-[#0088b5] hover:bg-[#00779e] text-sm rounded transition-colors">+ New Quotation</button>
                    </div>
                </div>
            </div>

            {/* Toolbar */}
            <div className="px-6 py-3 flex flex-wrap gap-2 items-center bg-white border-b print:hidden">
                <button onClick={() => navigate(`/sales/quotations/edit/${id}`)} className="p-2 bg-[#5bc0de] text-white rounded hover:bg-[#46b8da]" title="Edit"><Edit size={16} /></button>
                <button onClick={handleDownloadPdf} className="p-2 bg-[#d9534f] text-white rounded hover:bg-[#d43f3a]" title="PDF"><FileText size={16} /></button>
                <button onClick={handleWhatsApp} className="p-2 bg-[#5cb85c] text-white rounded hover:bg-[#4cae4c]" title="WhatsApp"><span className="font-bold text-xs">WA</span></button>
                <button onClick={() => window.print()} className="p-2 bg-[#0275d8] text-white rounded hover:bg-[#025aa5]" title="Print"><Printer size={16} /></button>
                <button onClick={handlePrintLetterhead} className="px-3 py-1.5 bg-[#0275d8] text-white rounded text-sm hover:bg-[#025aa5] flex items-center gap-1"><Printer size={14} /> Print On Letterhead</button>
                <button onClick={handleEmail} className="p-2 bg-[#f0ad4e] text-white rounded hover:bg-[#eea236]" title="Email"><Mail size={16} /></button>
                <button onClick={scrollToAttachments} className="p-2 bg-[#aeb6bf] text-white rounded hover:bg-[#8e99a4]" title="Attachments"><Paperclip size={16} /></button>

                <div className="relative" ref={convertMenuRef}>
                    <button onClick={() => setShowConvertMenu(!showConvertMenu)} className="px-3 py-1.5 bg-[#333] text-white rounded text-sm hover:bg-[#222] flex items-center gap-1">
                        Convert <ChevronDown size={14} />
                    </button>
                    {showConvertMenu && (
                        <div className="absolute top-full left-0 mt-1 w-40 bg-white border rounded shadow-lg z-10 text-sm">
                            <button className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-[#0099cc]" onClick={() => navigate(`/sales/orders/new?quotationId=${id}`)}>Convert to Sale</button>
                            <button className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-[#0099cc]" onClick={() => navigate(`/sales/invoices/new?quotationId=${id}`)}>Convert to Invoice</button>
                            <button className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-[#0099cc]" onClick={() => navigate(`/sales/proforma-invoices/new?quotationId=${id}`)}>Convert to Proforma Invoice</button>
                        </div>
                    )}
                </div>

                <div className="relative" ref={moreMenuRef}>
                    <button onClick={() => setShowMoreMenu(!showMoreMenu)} className="px-3 py-1.5 bg-[#333] text-white rounded text-sm hover:bg-[#222] flex items-center gap-1">
                        More <ChevronDown size={14} />
                    </button>
                    {showMoreMenu && (
                        <div className="absolute top-full left-0 mt-1 w-40 bg-white border rounded shadow-lg z-10 text-sm">
                            <button className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-[#333]" onClick={() => navigate(`/sales/quotations/new?cloneId=${id}`)}>Clone</button>
                            <button className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-[#333]" onClick={handleCancelQuotation}>Mark as Cancelled</button>
                            <div className="border-t my-1"></div>
                            <button className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-red-600" onClick={() => {
                                if (window.confirm('Delete this quotation?')) {
                                    // Delete logic
                                }
                            }}>Delete</button>
                        </div>
                    )}
                </div>
            </div>

            {/* Status Bar */}
            <div className="px-6 py-2 bg-[#f9f9f9] border-b text-xs text-gray-500 flex flex-col gap-1 print:hidden">
                <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-[#5cb85c] text-white rounded text-[10px] uppercase">+ View more</span>
                    <span className="px-2 py-0.5 bg-[#d9534f] text-white rounded text-[10px] uppercase">- View less</span>
                </div>
                <div className="flex justify-between w-full max-w-3xl">
                    {quotation.updatedAt && (
                        <span>{new Date(quotation.updatedAt).toLocaleString()}  Quotation Updated by {quotation.updatedBy || 'System'}</span>
                    )}
                </div>
                <div className="flex justify-between w-full max-w-3xl">
                    <span>{quotation.createdAt ? new Date(quotation.createdAt).toLocaleString() : '-'}  Quotation Created by {quotation.createdBy || 'System'}</span>
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

                    {/* Quotation Info Header */}
                    <div className="flex justify-between items-start border-t border-b border-gray-300 py-4 mb-6">
                        <div className="space-y-1">
                            <div className="flex"><span className="w-32 font-semibold">Quotation No.</span><span>: {quotation.quotationNumber}</span></div>
                            <div className="flex"><span className="w-32 font-semibold">Quotation Date</span><span>: {new Date(quotation.quotationDate).toLocaleDateString()}</span></div>
                            <div className="flex"><span className="w-32 font-semibold">Expiry Date</span><span>: {quotation.expiryDate ? new Date(quotation.expiryDate).toLocaleDateString() : '-'}</span></div>
                            <div className="flex"><span className="w-32 font-semibold">Reference No.</span><span>: {quotation.reference || '-'}</span></div>
                            {quotation.salespersonName && (
                                <div className="flex"><span className="w-32 font-semibold">Salesperson</span><span>: {quotation.salespersonName}</span></div>
                            )}
                        </div>
                        <div className="text-right">
                            <h2 className="text-2xl font-bold text-gray-800">Quotation</h2>
                            <p className="text-xs font-semibold mt-1">TRN : {company?.pan || '104349488700003'}</p>
                        </div>
                    </div>

                    {/* Bill To */}
                    <div className="mb-6 bg-gray-100 p-2">
                        <h3 className="font-bold mb-1">Bill To</h3>
                        <div className="text-gray-700">
                            <p className="font-semibold">{quotation.customerParty?.companyName || quotation.customerName}</p>
                            <p>{formatAddress(quotation.customerParty?.billingAddress)}</p>
                            <p className="font-semibold mt-1">TRN : {quotation.customerParty?.vatTrnNumber || 'N/A'}</p>
                        </div>
                    </div>

                    {/* Items Table */}
                    <table className="w-full mb-8">
                        <thead>
                            <tr className="border-t border-b border-gray-300 bg-gray-50 text-xs">
                                <th className="py-2 text-center w-12">S.N</th>
                                <th className="py-2 text-left">Item & Description</th>
                                <th className="py-2 text-center w-24">Qty (Unit)</th>
                                <th className="py-2 text-right w-24">Rate</th>
                                <th className="py-2 text-center w-20">VAT (%)</th>
                                <th className="py-2 text-right w-24">VAT Amount</th>
                                <th className="py-2 text-right w-24">Amount</th>
                            </tr>
                        </thead>
                        <tbody className="text-xs">
                            {quotation.items.map((item, index) => (
                                <tr key={item.id} className="border-b border-gray-200">
                                    <td className="py-3 text-center">{index + 1}</td>
                                    <td className="py-3">
                                        <p className="font-semibold">{item.itemName}</p>
                                        <p className="text-gray-500">{item.itemCode}</p>
                                    </td>
                                    <td className="py-3 text-center">{item.quantity}</td>
                                    <td className="py-3 text-right">{item.rate.toFixed(2)}</td>
                                    <td className="py-3 text-center">{item.taxPercentage || '0'}%</td>
                                    <td className="py-3 text-right">{item.taxValue?.toFixed(2) || '0.00'}</td>
                                    <td className="py-3 text-right">{item.amount.toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* Footer Section */}
                    <div className="flex flex-col md:flex-row gap-8">
                        <div className="flex-1 space-y-6">
                            <div>
                                <h4 className="font-bold text-sm mb-1">Amount in Words :</h4>
                                <p className="text-sm text-gray-600">{numberToWords(quotation.netTotal)}</p>
                            </div>
                            {quotation.notes && (
                                <div>
                                    <h4 className="font-bold text-sm mb-1">Notes</h4>
                                    <p className="text-xs text-gray-600 whitespace-pre-wrap">{quotation.notes}</p>
                                </div>
                            )}
                            {quotation.termsAndConditions && (
                                <div>
                                    <h4 className="font-bold text-sm mb-1">Terms & Conditions</h4>
                                    <p className="text-xs text-gray-600 whitespace-pre-wrap">{quotation.termsAndConditions}</p>
                                </div>
                            )}
                        </div>

                        <div className="w-full md:w-80">
                            <div className="flex justify-between py-1 text-sm border-b border-gray-100">
                                <span>Sub Total</span>
                                <span>{quotation.subTotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between py-1 text-sm border-b border-gray-100">
                                <span>Total Discount</span>
                                <span>{quotation.totalDiscount.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between py-1 text-sm border-b border-gray-100">
                                <span>Sub Total</span>
                                <span>{(quotation.subTotal - quotation.totalDiscount).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between py-1 text-sm border-b border-gray-100">
                                <span>Total VAT</span>
                                <span>{quotation.totalTax.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between py-1 text-sm border-b border-gray-100">
                                <span>Other Charges</span>
                                <span>{quotation.otherCharges.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between py-2 text-base font-bold border-t border-gray-300 mt-2">
                                <span>Total</span>
                                <span>AED {quotation.netTotal.toLocaleString('en-AE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            </div>
                        </div>
                    </div>

                    {/* Attachments Section */}
                    {quotation.attachments && quotation.attachments.length > 0 && (
                        <div className="mt-8 border-t pt-4" ref={attachmentRef}>
                            <h3 className="font-bold text-sm mb-2">Attachments</h3>
                            <div className="flex flex-wrap gap-2">
                                {quotation.attachments.map((file, index) => (
                                    <a key={index} href={`${API_URL}/sales/attachments/${file}`} target="_blank" rel="noreferrer" className="px-3 py-1 bg-gray-100 rounded text-blue-600 hover:underline text-xs flex items-center gap-1 border">
                                        <Paperclip size={12} /> {file.split('/').pop()}
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};

export default ViewQuotation;
