import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Printer, FileText, Mail, Edit, Trash2, ChevronDown, Paperclip, Loader2 } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_BASE_URL;

const getStatusColor = (status) => {
    switch (status) {
        case 'DRAFT': return 'bg-gray-100 text-gray-800';
        case 'SENT': return 'bg-blue-100 text-blue-800';
        case 'PAID': return 'bg-green-100 text-green-800';
        case 'PARTIALLY_PAID': return 'bg-yellow-100 text-yellow-800';
        case 'OVERDUE': return 'bg-red-100 text-red-800';
        case 'VOID': return 'bg-gray-200 text-gray-600';
        case 'OPEN': return 'bg-purple-100 text-purple-800';
        default: return 'bg-gray-100 text-gray-800';
    }
};

const RentalInvoiceView = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [invoice, setInvoice] = useState(null);
    const [company, setCompany] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showMoreMenu, setShowMoreMenu] = useState(false);
    const moreMenuRef = useRef(null);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const token = localStorage.getItem('token');
                const headers = { Authorization: `Bearer ${token}` };

                const [invoiceRes, companyRes] = await Promise.all([
                    axios.get(`${API_URL}/sales/rental-invoices/${id}`, { headers }),
                    axios.get(`${API_URL}/company-info`, { headers }).catch(() => ({ data: null }))
                ]);

                setInvoice(invoiceRes.data);
                setCompany(companyRes.data);
            } catch (err) {
                console.error("Error fetching data", err);
                setError("Failed to load rental invoice details.");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (moreMenuRef.current && !moreMenuRef.current.contains(event.target)) {
                setShowMoreMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const numberToWords = (amount) => {
        if (!amount) return 'Zero Dirhams';
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

    const handleDownloadPDF = async () => {
        alert("PDF Generation for Rental Invoices coming soon!");
        /* 
        // Backend for Rental Invoice PDF not yet available
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}/sales/rental-invoices/pdf/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `RentalInvoice_${invoice.invoiceNumber}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            console.error("PDF Download failed", err);
            alert("Failed to download PDF.");
        }
        */
    };

    const handleDelete = async () => {
        if (window.confirm('Are you sure you want to delete this rental invoice?')) {
            try {
                const token = localStorage.getItem('token');
                await axios.delete(`${API_URL}/sales/rental-invoices/${id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                navigate('/sales/rental-invoices');
            } catch (err) {
                alert("Failed to delete rental invoice");
            }
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
    if (!invoice) return <div className="p-8 text-center">Rental Invoice not found</div>;

    return (
        <div className="flex flex-col h-screen bg-slate-50 print:bg-white print:h-auto">
            {/* Breadcrumb & Header */}
            <div className="bg-white border-b shadow-sm print:hidden">
                <div className="px-6 py-2 text-xs text-gray-500 flex items-center gap-1">
                    <span className="cursor-pointer hover:text-blue-600" onClick={() => navigate('/')}>Home</span> &gt;
                    <span className="cursor-pointer hover:text-blue-600" onClick={() => navigate('/sales')}>Sales</span> &gt;
                    <span className="font-medium text-gray-700">View Rental Invoice</span>
                </div>
                <div className="px-6 py-3 bg-primary text-white flex justify-between items-center">
                    <h1 className="text-xl font-semibold">View Rental Invoice</h1>
                    <div className="flex gap-2">
                        <button onClick={() => navigate('/sales/rental-invoices')} className="px-3 py-1 bg-primary hover:bg-violet-800 text-sm rounded transition-colors">All Invoices</button>
                        <button onClick={() => navigate('/sales/rental-invoices/new')} className="px-3 py-1 bg-primary hover:bg-violet-800 text-sm rounded transition-colors">+ New Invoice</button>
                    </div>
                </div>
            </div>

            {/* Toolbar */}
            <div className="px-6 py-3 flex flex-wrap gap-2 items-center bg-white border-b print:hidden">
                <button onClick={() => navigate(`/sales/rental-invoices/edit/${id}`)} className="p-2 bg-[#5bc0de] text-white rounded hover:bg-[#46b8da]" title="Edit"><Edit size={16} /></button>
                <button onClick={handleDownloadPDF} className="p-2 bg-[#d9534f] text-white rounded hover:bg-[#d43f3a]" title="PDF"><FileText size={16} /></button>
                <button className="p-2 bg-[#5cb85c] text-white rounded hover:bg-[#4cae4c]" title="WhatsApp"><span className="font-bold text-xs">WA</span></button>
                <button onClick={handlePrint} className="p-2 bg-[#0275d8] text-white rounded hover:bg-[#025aa5]" title="Print"><Printer size={16} /></button>
                <button className="px-3 py-1.5 bg-[#0275d8] text-white rounded text-sm hover:bg-[#025aa5] flex items-center gap-1"><Printer size={14} /> Print On Letterhead</button>
                <button className="p-2 bg-[#f0ad4e] text-white rounded hover:bg-[#eea236]" title="Email"><Mail size={16} /></button>
                <button className="p-2 bg-[#aeb6bf] text-white rounded hover:bg-[#8e99a4]" title="Attachments"><Paperclip size={16} /></button>

                <div className="relative" ref={moreMenuRef}>
                    <button onClick={() => setShowMoreMenu(!showMoreMenu)} className="px-3 py-1.5 bg-primary text-white rounded text-sm hover:bg-violet-800 flex items-center gap-1">
                        More <ChevronDown size={14} />
                    </button>
                    {showMoreMenu && (
                        <div className="absolute top-full left-0 mt-1 w-40 bg-white border rounded shadow-lg z-10 text-sm">
                            <button className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-red-600 flex items-center gap-2" onClick={handleDelete}>
                                <Trash2 size={14} /> Delete
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Status Bar */}
            <div className="px-6 py-2 bg-[#f9f9f9] border-b text-xs text-gray-500 flex flex-col gap-1 print:hidden">
                <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold text-white ${getStatusColor(invoice.status)}`}>{invoice.status}</span>
                </div>
                <div className="flex justify-between w-full max-w-3xl">
                    {invoice.updatedAt && (
                        <span>{new Date(invoice.updatedAt).toLocaleString()}  Updated by {invoice.updatedBy || 'System'}</span>
                    )}
                </div>
                <div className="flex justify-between w-full max-w-3xl">
                    <span>{invoice.createdAt ? new Date(invoice.createdAt).toLocaleString() : '-'}  Created by {invoice.createdBy || 'System'}</span>
                </div>
            </div>

            {/* Document View */}
            <div className="flex-grow overflow-y-auto p-6 bg-slate-50 print:p-0 print:bg-white print:overflow-visible">
                <div className="w-full bg-white border shadow-sm p-8 relative text-sm print:w-full print:border-none print:shadow-none print:p-0 min-h-[1000px]">

                    {/* Company Header */}
                    <div className="text-center mb-8">
                        <h2 className="text-xl font-bold text-gray-800">{company?.companyName || 'Your Company Name'}</h2>
                        <p className="text-gray-600">{company?.address || 'Address Line 1'}, {company?.city || 'City'} {company?.country || 'Country'} {company?.email || 'email@example.com'}</p>
                    </div>

                    {/* Invoice Info Header */}
                    <div className="flex justify-between items-start border-t border-b border-gray-300 py-4 mb-6">
                        <div className="space-y-1">
                            <div className="flex"><span className="w-32 font-semibold">Invoice No.</span><span>: {invoice.invoiceNumber}</span></div>
                            <div className="flex"><span className="w-32 font-semibold">Invoice Date</span><span>: {new Date(invoice.invoiceDate).toLocaleDateString()}</span></div>
                            <div className="flex"><span className="w-32 font-semibold">Due Date</span><span>: {invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : '-'}</span></div>
                            <div className="flex"><span className="w-32 font-semibold">DO No.</span><span>: {invoice.doNumber || '-'}</span></div>
                            <div className="flex"><span className="w-32 font-semibold">Order No.</span><span>: {invoice.poNumber || '-'}</span></div>
                            {invoice.salespersonName && (
                                <div className="flex"><span className="w-32 font-semibold">Salesperson</span><span>: {invoice.salespersonName}</span></div>
                            )}
                        </div>
                        <div className="text-right">
                            <h2 className="text-2xl font-bold text-gray-800">RENTAL INVOICE</h2>
                            <p className="text-xs font-semibold mt-1">TRN : {company?.pan || '104349488700003'}</p>
                            <div className="mt-4 bg-gray-100 p-2 rounded inline-block text-left">
                                <span className="block text-xs text-gray-500 uppercase">Balance Due</span>
                                <span className="block text-xl font-bold text-red-600">AED {invoice.netTotal?.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Bill To */}
                    <div className="mb-6 bg-gray-100 p-2">
                        <h3 className="font-bold mb-1">Bill To</h3>
                        <div className="text-gray-700">
                            <p className="font-semibold">{invoice.customerName}</p>
                            {/* Rental Invoice DTO doesn't explicitly have address field in response but in entity 'customer' is BaseCustomer.
                                If the backend maps customer details fully, we might have it.
                                But DTO provided has `customerId` and `customerName` only.
                                Assuming we don't have full address unless we fetch customer separately or it's not in DTO.
                                I'll leave basic mapping or placeholder.
                             */}
                            <p className="font-semibold mt-1">TRN : {invoice.customerTrn || 'N/A'}</p>
                        </div>
                    </div>

                    {/* Items Table */}
                    <table className="w-full mb-8">
                        <thead>
                            <tr className="border-t border-b border-gray-300 bg-gray-50 text-xs text-black">
                                <th className="py-2 text-center w-12">S.N</th>
                                <th className="py-2 text-left">Item & Description</th>
                                <th className="py-2 text-center w-24">Qty</th>
                                <th className="py-2 text-center w-24">Duration</th>
                                <th className="py-2 text-right w-24">Rental Value</th>
                                <th className="py-2 text-center w-20">Tax %</th>
                                <th className="py-2 text-right w-24">Tax Amt</th>
                                <th className="py-2 text-right w-24">Amount</th>
                            </tr>
                        </thead>
                        <tbody className="text-xs">
                            {invoice.items?.map((item, index) => (
                                <tr key={index} className="border-b border-gray-200">
                                    <td className="py-3 text-center">{index + 1}</td>
                                    <td className="py-3">
                                        <p className="font-semibold">{item.itemName}</p>
                                        <p className="text-gray-500">{item.itemCode}</p>
                                        {item.description && <p className="text-gray-400 italic text-[10px]">{item.description}</p>}
                                    </td>
                                    <td className="py-3 text-center">{item.quantity}</td>
                                    <td className="py-3 text-center">{item.duration}</td>
                                    <td className="py-3 text-right">{item.rentalValue?.toFixed(2)}</td>
                                    <td className="py-3 text-center">{item.taxPercentage || 0}%</td>
                                    <td className="py-3 text-right">{item.taxValue?.toFixed(2)}</td>
                                    <td className="py-3 text-right">{item.amount?.toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* Footer Section */}
                    <div className="flex flex-col md:flex-row gap-8">
                        <div className="flex-1 space-y-6">
                            <div>
                                <h4 className="font-bold text-sm mb-1">Amount in Words :</h4>
                                <p className="text-sm text-gray-600">{numberToWords(invoice.netTotal)}</p>
                            </div>
                            {invoice.notes && (
                                <div>
                                    <h4 className="font-bold text-sm mb-1">Notes</h4>
                                    <p className="text-xs text-gray-600 whitespace-pre-wrap">{invoice.notes}</p>
                                </div>
                            )}
                            {invoice.termsAndConditions && (
                                <div>
                                    <h4 className="font-bold text-sm mb-1">Terms & Conditions</h4>
                                    <p className="text-xs text-gray-600 whitespace-pre-wrap">{invoice.termsAndConditions}</p>
                                </div>
                            )}
                        </div>

                        <div className="w-full md:w-80">
                            <div className="flex justify-between py-1 text-sm border-b border-gray-100">
                                <span>Sub Total</span>
                                <span>{invoice.subTotal?.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between py-1 text-sm border-b border-gray-100">
                                <span>Total Discount</span>
                                <span>{invoice.totalDiscount?.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between py-1 text-sm border-b border-gray-100">
                                <span>Total Tax</span>
                                <span>{invoice.totalTax?.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between py-1 text-sm border-b border-gray-100">
                                <span>Other Charges</span>
                                <span>{invoice.otherCharges?.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between py-2 text-base font-bold border-t border-gray-300 mt-2">
                                <span>Net Total</span>
                                <span>AED {invoice.netTotal?.toLocaleString('en-AE', { minimumFractionDigits: 2 })}</span>
                            </div>
                            {/* 
                            <div className="flex justify-between py-1 text-sm border-b border-gray-100 text-green-600 font-semibold">
                                <span>Amount Received</span>
                                <span>(-) AED 0.00</span>
                            </div>
                            <div className="flex justify-between py-2 text-base font-bold border-t border-gray-300 mt-2 text-red-600">
                                <span>Balance Due</span>
                                <span>AED {invoice.netTotal?.toLocaleString('en-AE', { minimumFractionDigits: 2 })}</span>
                            </div>
                             */}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default RentalInvoiceView;
