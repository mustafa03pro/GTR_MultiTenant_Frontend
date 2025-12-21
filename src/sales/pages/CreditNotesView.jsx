import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Printer, Edit, Trash2, Loader2 } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_BASE_URL;

const CreditNotesView = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [company, setCompany] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const token = localStorage.getItem('token');
                const headers = { Authorization: `Bearer ${token}` };

                const [dataRes, companyRes] = await Promise.all([
                    axios.get(`${API_URL}/credit-notes/${id}`, { headers }),
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

    const handlePrint = () => {
        window.print();
    };

    const handleDelete = async () => {
        if (window.confirm('Are you sure you want to delete this record?')) {
            try {
                const token = localStorage.getItem('token');
                await axios.delete(`${API_URL}/credit-notes/${id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                navigate('/sales/credit-notes');
            } catch (err) {
                alert("Failed to delete record");
            }
        }
    };

    if (loading) return <div className="flex justify-center items-center h-screen"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>;
    if (!data) return <div className="p-8 text-center">Record not found</div>;

    return (
        <div className="flex flex-col h-screen bg-slate-50 print:bg-white print:h-auto">
            {/* Header - Hidden on Print */}
            <div className="bg-white border-b shadow-sm print:hidden">
                <div className="px-6 py-2 text-xs text-gray-500 flex items-center gap-1">
                    <span className="cursor-pointer hover:text-blue-600" onClick={() => navigate('/sales')}>Sales</span> &gt;
                    <span className="cursor-pointer hover:text-blue-600" onClick={() => navigate('/sales/credit-notes')}>Credit Notes</span> &gt;
                    <span className="font-medium text-gray-700">View Credit Note</span>
                </div>
                <div className="px-6 py-3 bg-primary text-white flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate(-1)} className="hover:bg-white/20 p-1 rounded-full"><ArrowLeft /></button>
                        <h1 className="text-xl font-semibold">Credit Note Details</h1>
                    </div>
                </div>
            </div>

            {/* Toolbar - Hidden on Print */}
            <div className="px-6 py-3 flex gap-2 items-center bg-white border-b print:hidden">
                <button onClick={handlePrint} className="p-2 bg-[#0275d8] text-white rounded hover:bg-[#025aa5]" title="Print"><Printer size={16} /></button>
                <div className="h-6 border-l border-gray-300 mx-1"></div>
                <button onClick={() => navigate(`/sales/credit-notes/edit/${id}`)} className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 flex items-center gap-1 text-sm border border-gray-300">
                    <Edit size={14} /> Edit
                </button>
                <button onClick={handleDelete} className="px-3 py-1.5 bg-red-50 text-red-600 rounded hover:bg-red-100 flex items-center gap-1 text-sm border border-red-200">
                    <Trash2 size={14} /> Delete
                </button>
            </div>

            {/* Document View */}
            <div className="flex-grow overflow-y-auto p-6 bg-slate-50 print:p-0 print:bg-white print:overflow-visible">
                <div className="w-full bg-white border shadow-sm p-8 relative text-sm print:w-full print:border-none print:shadow-none print:p-0 min-h-[800px] max-w-4xl mx-auto">

                    {/* Company Header */}
                    <div className="text-center mb-8 border-b pb-4">
                        <h2 className="text-xl font-bold text-gray-800">{company?.companyName || 'Your Company Name'}</h2>
                        <p className="text-gray-600">{company?.address || 'Address Line 1'}, {company?.city || 'City'}</p>
                    </div>

                    <div className="flex justify-between items-start mb-8">
                        <div>
                            <h3 className="text-lg font-bold text-primary mb-1">CREDIT NOTE</h3>
                            <div className="space-y-1 text-gray-700">
                                <div className="flex"><span className="w-32 font-semibold">Credit Note #:</span><span>{data.creditNoteNumber || '-'}</span></div>
                                <div className="flex"><span className="w-32 font-semibold">Date:</span><span>{data.creditNoteDate}</span></div>
                                <div className="flex"><span className="w-32 font-semibold">Reference Invoice:</span><span>{data.invoiceNumber || '-'}</span></div>
                            </div>
                        </div>
                        <div className="text-right">
                            <h3 className="text-lg font-bold text-gray-800">Total Amount</h3>
                            <div className="text-3xl font-bold text-red-600 mt-2">
                                {data.amount?.toLocaleString('en-AE', { style: 'currency', currency: 'AED' })}
                            </div>
                            <div className="mt-1 text-xs text-gray-500 uppercase">{data.status}</div>
                        </div>
                    </div>

                    <div className="mb-8">
                        <h4 className="font-bold bg-gray-100 p-2 mb-2 border-b">Bill To</h4>
                        <div className="px-2 space-y-1">
                            <div className="font-semibold text-lg">{data.customerName}</div>
                            <div className="text-gray-600">ID: {data.customerId}</div>
                        </div>
                    </div>

                    {/* Financial Breakdown Table - Simplified for Credit Notes */}
                    <div className="mb-8">
                        <table className="w-full text-sm border-collapse border border-gray-300">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="border border-gray-300 px-4 py-2 text-left">Description</th>
                                    <th className="border border-gray-300 px-4 py-2 text-right w-40">Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td className="border border-gray-300 px-4 py-2">Credit Amount</td>
                                    <td className="border border-gray-300 px-4 py-2 text-right font-medium">{data.amount?.toFixed(2)}</td>
                                </tr>
                                <tr>
                                    <td className="border border-gray-300 px-4 py-2">Balance Due</td>
                                    <td className="border border-gray-300 px-4 py-2 text-right">{data.balanceDue?.toFixed(2) || '0.00'}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* Terms & Notes */}
                    <div className="grid grid-cols-2 gap-8 mb-8">
                        <div>
                            <h4 className="font-bold text-gray-700 text-xs uppercase mb-2">Terms & Conditions</h4>
                            <p className="text-gray-600 text-xs whitespace-pre-wrap">{data.termsAndConditions || 'No terms specified.'}</p>
                        </div>
                        <div>
                            <h4 className="font-bold text-gray-700 text-xs uppercase mb-2">Notes</h4>
                            <p className="text-gray-600 text-xs whitespace-pre-wrap">{data.notes || '-'}</p>
                        </div>
                    </div>

                    <div className="mt-12 pt-8 border-t border-gray-200 grid grid-cols-2 gap-8">
                        <div className="text-left">
                            <p className="text-xs text-gray-500 mb-8">Authorized Signature:</p>
                            <div className="border-b border-gray-400 w-48"></div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default CreditNotesView;
