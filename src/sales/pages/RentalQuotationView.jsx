import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Edit, FileText, Printer, Mail, Paperclip, ChevronDown, ArrowLeft, Loader2, Trash2 } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_BASE_URL;

const RentalQuotationView = () => {
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

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const token = localStorage.getItem('token');
                const headers = { Authorization: `Bearer ${token}` };

                const [quotationRes, companyRes] = await Promise.all([
                    axios.get(`${API_URL}/sales/rental-quotations/${id}`, { headers }),
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

    const [isLetterhead, setIsLetterhead] = useState(false);
    const [showAttachments, setShowAttachments] = useState(false);

    const numberToWords = (amount) => {
        const units = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
        const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
        const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
        const scales = ['', 'Thousand', 'Million', 'Billion', 'Trillion'];

        const convertChunk = (num) => {
            let str = '';
            if (num >= 100) {
                str += units[Math.floor(num / 100)] + ' Hundred ';
                num %= 100;
            }
            if (num >= 20) {
                str += tens[Math.floor(num / 10)] + ' ';
                num %= 10;
            }
            if (num >= 10) {
                str += teens[num - 10] + ' ';
                num = 0;
            }
            if (num > 0) {
                str += units[num] + ' ';
            }
            return str;
        };

        if (amount === 0) return 'Zero Dirhams';

        let num = Math.floor(amount);
        let decimal = Math.round((amount - num) * 100);
        let words = '';
        let i = 0;

        do {
            let chunk = num % 1000;
            if (chunk !== 0) {
                words = convertChunk(chunk) + scales[i] + ' ' + words;
            }
            num = Math.floor(num / 1000);
            i++;
        } while (num > 0);

        words = words.trim();
        if (words) {
            words += ' Dirhams';
        }

        if (decimal > 0) {
            words += ` and ${decimal}/100 Fils`;
        }

        return words;
    };

    const handlePrint = () => {
        window.print();
    };

    const handlePrintLetterhead = () => {
        setIsLetterhead(true);
        setTimeout(() => {
            window.print();
            setIsLetterhead(false);
        }, 500);
    };

    const handleWhatsApp = () => {
        const text = `Hi ${quotation.customerName}, Here is your Rental Quotation ${quotation.quotationNumber}. Net Total: AED ${quotation.netTotal}`;
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    };

    const handleEmail = () => {
        const subject = `Rental Quotation ${quotation.quotationNumber}`;
        const body = `Hi ${quotation.customerName},\n\nPlease find attached Rental Quotation ${quotation.quotationNumber}.\n\nNet Total: AED ${quotation.netTotal}\n\nRegards,\n${company?.companyName || ''}`;
        window.location.href = `mailto:${quotation.email || ''}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    };

    const handleAttachments = () => {
        if (quotation.attachments && quotation.attachments.length > 0) {
            setShowAttachments(true);
        } else {
            alert("No attachments found.");
        }
    };

    const handleDownloadPdf = async () => {
        try {
            const response = await axios.get(`${API_URL}/sales/rental-quotations/${id}/pdf`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
                responseType: 'blob',
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Rental_Quotation_${quotation.quotationNumber}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            console.error("Failed to download PDF", err);
            alert("Failed to download PDF. Please try again.");
        }
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
                    <span className="font-medium text-gray-700">View Rental Quotation</span>
                </div>
                <div className="px-6 py-3 bg-primary text-white flex justify-between items-center">
                    <h1 className="text-xl font-semibold">View Rental Quotation</h1>
                    <div className="flex gap-2">
                        <button onClick={() => navigate('/sales/rental-quotations')} className="px-3 py-1 bg-primary hover:bg-violet-800 text-sm rounded transition-colors">All Quotations</button>
                        <button onClick={() => navigate('/sales/rental-quotations/new')} className="px-3 py-1 bg-primary hover:bg-violet-800 text-sm rounded transition-colors">+ New Quotation</button>
                    </div>
                </div>
            </div>

            {/* Toolbar */}
            <div className="px-6 py-3 flex flex-wrap gap-2 items-center bg-white border-b print:hidden">
                <button onClick={() => navigate(`/sales/rental-quotations/edit/${id}`)} className="p-2 bg-[#5bc0de] text-white rounded hover:bg-[#46b8da]" title="Edit"><Edit size={16} /></button>
                <button onClick={handleDownloadPdf} className="p-2 bg-[#d9534f] text-white rounded hover:bg-[#d43f3a]" title="PDF"><FileText size={16} /></button>
                <button onClick={handleWhatsApp} className="p-2 bg-[#5cb85c] text-white rounded hover:bg-[#4cae4c]" title="WhatsApp"><span className="font-bold text-xs">WA</span></button>
                <button onClick={handlePrint} className="p-2 bg-[#0275d8] text-white rounded hover:bg-[#025aa5]" title="Print"><Printer size={16} /></button>
                <button onClick={handlePrintLetterhead} className="px-3 py-1.5 bg-[#0275d8] text-white rounded text-sm hover:bg-[#025aa5] flex items-center gap-1"><Printer size={14} /> Print On Letterhead</button>
                <button onClick={handleEmail} className="p-2 bg-[#f0ad4e] text-white rounded hover:bg-[#eea236]" title="Email"><Mail size={16} /></button>
                <button onClick={handleAttachments} className="p-2 bg-[#aeb6bf] text-white rounded hover:bg-[#8e99a4]" title="Attachments"><Paperclip size={16} /></button>

                <div className="relative" ref={convertMenuRef}>
                    <button onClick={() => setShowConvertMenu(!showConvertMenu)} className="px-3 py-1.5 bg-primary text-white rounded text-sm hover:bg-violet-800 flex items-center gap-1">
                        Convert <ChevronDown size={14} />
                    </button>
                    {showConvertMenu && (
                        <div className="absolute top-full left-0 mt-1 w-48 bg-white border rounded shadow-lg z-10 text-sm">
                            <button className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-[#0099cc]" onClick={() => navigate(`/sales/rental-sales-orders/new?quotationId=${id}`)}>Convert to Rental Order</button>
                            <button className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-[#0099cc]" onClick={() => navigate(`/sales/rental-invoices/new?quotationId=${id}`, { state: { quotationId: id } })}>Convert to Rental Invoice</button>
                        </div>
                    )}
                </div>

                <div className="relative" ref={moreMenuRef}>
                    <button onClick={() => setShowMoreMenu(!showMoreMenu)} className="px-3 py-1.5 bg-primary text-white rounded text-sm hover:bg-violet-800 flex items-center gap-1">
                        More <ChevronDown size={14} />
                    </button>
                    {showMoreMenu && (
                        <div className="absolute top-full left-0 mt-1 w-48 bg-white border rounded shadow-lg z-10 text-sm">
                            <button className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-gray-700" onClick={() => navigate(`/sales/rental-quotations/new?cloneId=${id}`)}>Clone</button>

                            {quotation.status !== 'CANCELLED' && (
                                <button className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-orange-600" onClick={() => {
                                    if (window.confirm('Are you sure you want to cancel this quotation?')) {
                                        axios.patch(`${API_URL}/sales/rental-quotations/${id}/status`, null, {
                                            params: {
                                                status: 'CANCELLED'
                                            },
                                            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                                        })
                                            .then(() => {
                                                setQuotation(prev => ({ ...prev, status: 'CANCELLED' }));
                                                setShowMoreMenu(false);
                                            })
                                            .catch(err => alert("Failed to cancel quotation"));
                                    }
                                }}>Mark as Canceled</button>
                            )}
                            <button className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-red-600" onClick={() => {
                                if (window.confirm('Delete this quotation?')) {
                                    axios.delete(`${API_URL}/sales/rental-quotations/${id}`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } })
                                        .then(() => navigate('/sales/rental-quotations'))
                                        .catch(err => alert("Failed to delete"));
                                }
                            }}>Delete</button>
                        </div>
                    )}
                </div>
            </div>

            {/* Attachments Modal */}
            {showAttachments && (
                <div className="fixed inset-0 bg-black/50 z-50 flex justify-center items-center">
                    <div className="bg-white p-6 rounded shadow-lg w-96 max-h-[80vh] overflow-y-auto relative">
                        <button onClick={() => setShowAttachments(false)} className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"><Trash2 size={16} className="rotate-45" /></button>
                        <h3 className="text-lg font-bold mb-4">Attachments</h3>
                        <div className="space-y-2">
                            {quotation.attachments && quotation.attachments.map((file, idx) => (
                                <a key={idx} href={`${API_URL}/${file}`} target="_blank" rel="noopener noreferrer" className="block p-2 bg-gray-50 hover:bg-blue-50 text-blue-600 truncate border rounded">
                                    {`Attachment ${idx + 1}`}
                                </a>
                            ))}
                        </div>
                        <div className="mt-4 text-right">
                            <button onClick={() => setShowAttachments(false)} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 text-sm">Close</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Status Bar */}
            <div className="px-6 py-2 bg-[#f9f9f9] border-b text-xs text-gray-500 flex flex-col gap-1 print:hidden">
                <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold text-white ${quotation.status === 'SENT' ? 'bg-blue-500' : quotation.status === 'ACCEPTED' ? 'bg-green-500' : 'bg-gray-400'}`}>{quotation.status}</span>
                </div>
                <div className="flex justify-between w-full max-w-3xl">
                    {quotation.updatedAt && (
                        <span>{new Date(quotation.updatedAt).toLocaleString()}  Updated by {quotation.updatedBy || 'System'}</span>
                    )}
                </div>
                <div className="flex justify-between w-full max-w-3xl">
                    <span>{quotation.createdAt ? new Date(quotation.createdAt).toLocaleString() : '-'}  Created by {quotation.createdBy || 'System'}</span>
                </div>
            </div>

            {/* Document View */}
            <div className="flex-grow overflow-y-auto p-6 bg-slate-50 print:p-0 print:bg-white print:overflow-visible">
                <div className="w-full bg-white border shadow-sm p-8 relative text-sm print:w-full print:border-none print:shadow-none print:p-0">

                    {/* Company Header */}
                    {!isLetterhead && (
                        <div className="text-center mb-8">
                            <h2 className="text-xl font-bold text-gray-800">{company?.companyName || 'Your Company Name'}</h2>
                            <p className="text-gray-600">{company?.address || 'Address Line 1'}, {company?.city || 'City'} {company?.country || 'Country'} {company?.email || 'email@example.com'}</p>
                        </div>
                    )}

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
                            <h2 className="text-2xl font-bold text-gray-800">Rental Quotation</h2>
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
                            {quotation.dearSir && <p className="mt-1">Attn: {quotation.dearSir}</p>}
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
                            {quotation.items.map((item, index) => {
                                const qty = Number(item.quantity) || 0;
                                const rent = Number(item.rentalValue) || 0;
                                const duration = Number(quotation.rentalDurationDays) || 1;
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
                                <span>Total Net Rental / Day</span>
                                <span>{quotation.subTotalPerDay?.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between py-1 text-sm border-b border-gray-100">
                                <span>Rental Duration</span>
                                <span>{quotation.rentalDurationDays} Days</span>
                            </div>
                            <div className="flex justify-between py-1 text-sm border-b border-gray-100 font-medium">
                                <span>Total Rental Price</span>
                                <span>{quotation.totalRentalPrice?.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between py-1 text-sm border-b border-gray-100">
                                <span>Total Discount</span>
                                <span>{quotation.totalDiscount?.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between py-1 text-sm border-b border-gray-100">
                                <span>Gross Total</span>
                                <span>{quotation.grossTotal?.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between py-1 text-sm border-b border-gray-100">
                                <span>Total VAT</span>
                                <span>{quotation.totalTax?.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between py-1 text-sm border-b border-gray-100">
                                <span>Other Charges</span>
                                <span>{quotation.otherCharges?.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between py-2 text-base font-bold border-t border-gray-300 mt-2">
                                <span>Net Total</span>
                                <span>AED {quotation.netTotal?.toLocaleString('en-AE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div >
    );
};

export default RentalQuotationView;
