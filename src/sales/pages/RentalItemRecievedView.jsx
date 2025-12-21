import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Printer, FileText, Mail, Edit, Trash2, ChevronDown, Paperclip, Loader2 } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_BASE_URL;

const getStatusColor = (status) => {
    switch (status) {
        case 'FULLY_RETURNED': return 'bg-green-100 text-green-800';
        case 'PARTIAL_RETURNED': return 'bg-yellow-100 text-yellow-800';
        case 'OPEN': return 'bg-blue-100 text-blue-800';
        default: return 'bg-gray-100 text-gray-800';
    }
};

const RentalItemRecievedView = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [company, setCompany] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showMoreMenu, setShowMoreMenu] = useState(false);
    const moreMenuRef = useRef(null);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const token = localStorage.getItem('token');
                const headers = { Authorization: `Bearer ${token}` };

                const [dataRes, companyRes] = await Promise.all([
                    axios.get(`${API_URL}/sales/rental-item-received/${id}`, { headers }),
                    axios.get(`${API_URL}/company-info`, { headers }).catch(() => ({ data: null }))
                ]);

                setData(dataRes.data);
                setCompany(companyRes.data);
            } catch (err) {
                console.error("Error loading data", err);
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

    const handlePrint = () => {
        window.print();
    };

    if (loading) return <div className="flex justify-center items-center h-screen"><Loader2 className="animate-spin h-8 w-8 text-blue-600" /></div>;
    if (!data) return <div className="p-8 text-center">Record not found</div>;

    return (
        <div className="flex flex-col h-screen bg-slate-50 print:bg-white print:h-auto">
            {/* Breadcrumb & Header */}
            <div className="bg-white border-b shadow-sm print:hidden">
                <div className="px-6 py-2 text-xs text-gray-500 flex items-center gap-1">
                    <span className="cursor-pointer hover:text-blue-600" onClick={() => navigate('/')}>Home</span> &gt;
                    <span className="cursor-pointer hover:text-blue-600" onClick={() => navigate('/sales')}>Sales</span> &gt;
                    <span className="font-medium text-gray-700">View Received Item</span>
                </div>
                <div className="px-6 py-3 bg-primary text-white flex justify-between items-center">
                    <h1 className="text-xl font-semibold">View Received Item</h1>
                    <div className="flex gap-2">
                        <button onClick={() => navigate('/sales/rental-item-received')} className="px-3 py-1 bg-primary hover:bg-violet-800 text-sm rounded transition-colors">All Receipts</button>
                        <button onClick={() => navigate('/sales/rental-item-received/new')} className="px-3 py-1 bg-primary hover:bg-violet-800 text-sm rounded transition-colors">+ New Receipt</button>
                    </div>
                </div>
            </div>

            {/* Toolbar */}
            <div className="px-6 py-3 flex flex-wrap gap-2 items-center bg-white border-b print:hidden">
                <button onClick={() => navigate(`/sales/rental-item-received/edit/${id}`)} className="p-2 bg-[#5bc0de] text-white rounded hover:bg-[#46b8da]" title="Edit"><Edit size={16} /></button>
                <button className="p-2 bg-[#d9534f] text-white rounded hover:bg-[#d43f3a]" title="PDF"><FileText size={16} /></button>
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
                            <button className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-red-600 flex items-center gap-2">
                                <Trash2 size={14} /> Delete
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Status Bar */}
            <div className="px-6 py-2 bg-[#f9f9f9] border-b text-xs text-gray-500 flex flex-col gap-1 print:hidden">
                <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold text-white ${getStatusColor(data.status)}`.replace('text-', 'text-opacity-90 ').replace('bg-', 'bg-opacity-100 ')}>{data.status}</span>
                </div>
                {/* Fallback for status color if not using my helper exactly or if classes need tweaking. 
                    Actually, reference uses: bg-blue-100 text-blue-800 etc.
                    Let's stick to reference simple classes.
                 */}
            </div>

            {/* Document View */}
            <div className="flex-grow overflow-y-auto p-6 bg-slate-50 print:p-0 print:bg-white print:overflow-visible">
                <div className="w-full bg-white border shadow-sm p-8 relative text-sm print:w-full print:border-none print:shadow-none print:p-0 min-h-[1000px]">

                    {/* Company Header */}
                    <div className="text-center mb-8">
                        <h2 className="text-xl font-bold text-gray-800">{company?.companyName || 'Your Company Name'}</h2>
                        <p className="text-gray-600">{company?.address || 'Address Line 1'}, {company?.city || 'City'} {company?.country || 'Country'} {company?.email || 'email@example.com'}</p>
                    </div>

                    {/* Info Header */}
                    <div className="flex justify-between items-start border-t border-b border-gray-300 py-4 mb-6">
                        <div className="space-y-1">
                            <div className="flex"><span className="w-32 font-semibold">DO Date</span><span>: {new Date(data.doDate).toLocaleDateString()}</span></div>
                            <div className="flex"><span className="w-32 font-semibold">DO No.</span><span>: {data.doNumber}</span></div>
                            <div className="flex"><span className="w-32 font-semibold">Order No.</span><span>: {data.orderNumber}</span></div>

                        </div>
                        <div className="text-right">
                            <h2 className="text-2xl font-bold text-gray-800">ITEM RECEIPT</h2>
                            <p className="text-xs font-semibold mt-1">Ref: {data.id}</p>
                        </div>
                    </div>

                    {/* Address Section */}
                    {/* Bill To */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div className="bg-gray-100 p-2">
                            <h3 className="font-bold mb-1">Received From (Customer)</h3>
                            <div className="text-gray-700">
                                <p className="font-semibold">{data.customerName}</p>
                                <p className="whitespace-pre-wrap">{data.billingAddress}</p>
                            </div>
                        </div>
                        <div className="bg-gray-100 p-2">
                            <h3 className="font-bold mb-1">Delivered To (Shipping)</h3>
                            <div className="text-gray-700">
                                <p className="whitespace-pre-wrap">{data.shippingAddress}</p>
                            </div>
                        </div>
                    </div>

                    {/* Items Table */}
                    <table className="w-full mb-8">
                        <thead>
                            <tr className="border-t border-b border-gray-300 bg-gray-50 text-xs text-black">
                                <th className="py-2 text-center w-12">S.N</th>
                                <th className="py-2 text-left">Item & Description</th>
                                <th className="py-2 text-center w-32">DO Qty</th>
                                <th className="py-2 text-center w-32">Prev Received</th>
                                <th className="py-2 text-right w-32">Received Now</th>
                            </tr>
                        </thead>
                        <tbody className="text-xs">
                            {data.items?.map((item, index) => (
                                <tr key={index} className="border-b border-gray-200">
                                    <td className="py-3 text-center">{index + 1}</td>
                                    <td className="py-3">
                                        <p className="font-semibold">{item.itemName}</p>
                                        <p className="text-gray-500">{item.itemCode}</p>
                                        {item.description && <p className="text-gray-400 italic text-[10px]">{item.description}</p>}
                                    </td>
                                    <td className="py-3 text-center">{item.doQuantity}</td>
                                    <td className="py-3 text-center">{item.receivedQuantity}</td>
                                    <td className="py-3 text-right font-bold text-black">{item.currentReceiveQuantity}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* Footer Section */}
                    <div className="mt-12 pt-8 border-t border-gray-200 grid grid-cols-2 gap-8">
                        <div>
                            <p className="text-xs text-gray-500 mb-8">Received By:</p>
                            <div className="border-b border-gray-400 w-48"></div>
                        </div>
                        <div className="text-right">
                            <p className="text-xs text-gray-500 mb-8">Authorized Signature:</p>
                            <div className="border-b border-gray-400 w-48 ml-auto"></div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default RentalItemRecievedView;

