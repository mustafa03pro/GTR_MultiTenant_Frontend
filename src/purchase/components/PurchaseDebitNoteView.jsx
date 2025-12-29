import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Loader, Printer, ArrowLeft, Mail, Paperclip, FileText, Edit, Trash2 } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_BASE_URL || '';

// Basic number to words converter
const numberToWords = (num) => {
    if (!num) return 'Zero';
    const a = ['','One ','Two ','Three ','Four ','Five ','Six ','Seven ','Eight ','Nine ','Ten ','Eleven ','Twelve ','Thirteen ','Fourteen ','Fifteen ','Sixteen ','Seventeen ','Eighteen ','Nineteen '];
    const b = ['', '', 'Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];
    
    const n = ('000000000' + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
    if (!n) return ''; 
    let str = '';
    str += (n[1] != 0) ? (a[Number(n[1])] || b[n[1][0]] + ' ' + a[n[1][1]]) + 'Crore ' : '';
    str += (n[2] != 0) ? (a[Number(n[2])] || b[n[2][0]] + ' ' + a[n[2][1]]) + 'Lakh ' : '';
    str += (n[3] != 0) ? (a[Number(n[3])] || b[n[3][0]] + ' ' + a[n[3][1]]) + 'Thousand ' : '';
    str += (n[4] != 0) ? (a[Number(n[4])] || b[n[4][0]] + ' ' + a[n[4][1]]) + 'Hundred ' : '';
    str += (n[5] != 0) ? ((str != '') ? 'and ' : '') + (a[Number(n[5])] || b[n[5][0]] + ' ' + a[n[5][1]]) : '';
    return str.trim();
};

const PurchaseDebitNoteView = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [debitNote, setDebitNote] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [tenantInfo, setTenantInfo] = useState({ name: 'Transcold Air conditioner spare parts trading llc', address: 'Abu Dhabi', logo: '/logo.png' });

    useEffect(() => {
        const load = async () => {
             setLoading(true);
             try {
                 const token = localStorage.getItem('token');
                 const headers = { Authorization: `Bearer ${token}` };

                 const res = await axios.get(`${API_URL}/purchase/debit-notes/${id}`, { headers });
                 setDebitNote(res.data);

                // Fetch Tenant Info
                const tenantId = localStorage.getItem('tenantId');
                if (tenantId) {
                     try {
                        const tRes = await axios.get(`${API_URL}/tenants/${tenantId}`, { headers });
                        setTenantInfo(tRes.data);
                     } catch (e) { console.warn(e); }
                }

             } catch (err) {
                 console.error(err);
                 setError('Failed to load debit note.');
             } finally {
                 setLoading(false);
             }
        };
        load();
    }, [id]);

    const handlePrint = () => {
        window.print();
    };

    const handleDelete = async () => {
        if (!window.confirm('Delete this Debit Note permanently?')) return;
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${API_URL}/purchase/debit-notes/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            navigate('/purchase-dashboard/debit-notes');
        } catch (err) {
            alert('Failed to delete: ' + err.message);
        }
    };

    if (loading) return <div className="flex justify-center items-center h-screen"><Loader className="animate-spin text-blue-600" size={40} /></div>;
    if (!debitNote) return <div className="p-8 text-center text-red-500">{error || 'Record not found'}</div>;

    // Calculate totals from items if not in header
    const items = debitNote.items || [];
    const subTotal = items.reduce((sum, it) => sum + (Number(it.amount) || 0), 0);
    const totalTax = items.reduce((sum, it) => sum + (Number(it.taxAmount) || 0), 0);
    // Note: 'it.amount' in our Form was "Net Amount". 
    // Backend 'amount' usually stored as Line Total.
    const totalAmount = subTotal + totalTax; 

    return (
        <div className="bg-slate-50 min-h-screen pb-12 print:bg-white print:pb-0 font-sans">
             {/* Nav Bar */}
             <div className="print:hidden">
                <div className="bg-white border-b px-6 py-3 flex justify-between items-center text-xs text-slate-600">
                    <div className="flex items-center gap-2">
                         <Link to="/purchase-dashboard/debit-notes" className="flex items-center gap-1 hover:text-blue-600">
                            <ArrowLeft size={14} /> Back to List
                         </Link>
                    </div>
                </div>

                <div className="bg-rose-500 px-6 py-4 text-white text-xl font-medium shadow-sm flex justify-between items-center">
                    <div>
                         View Debit Note # {debitNote.debitNoteNumber || '...'}
                    </div>
                    <div className={`px-2 py-1 rounded font-bold uppercase text-xs ${
                        debitNote.status === 'OPEN' ? 'bg-green-100 text-green-800' :
                        debitNote.status === 'CLOSED' ? 'bg-gray-100 text-gray-800' :
                        debitNote.status === 'VOID' ? 'bg-red-100 text-red-800' :
                        'bg-blue-100 text-blue-800'
                    }`}>
                        {debitNote.status}
                    </div>
                </div>

                {/* Toolbar */}
                 <div className="px-6 py-4 flex flex-wrap gap-2 items-center border-b bg-white shadow-sm sticky top-0 z-10">
                     <Link to={`/purchase-dashboard/debit-notes/edit/${id}`} className="p-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition shadow-sm" title="Edit">
                        <Edit size={18} />
                     </Link>
                     <button onClick={handleDelete} className="p-2 bg-red-500 text-white rounded hover:bg-red-600 transition shadow-sm" title="Delete">
                        <Trash2 size={18} />
                     </button>
                      <span className="w-px h-6 bg-slate-300 mx-2"></span>
                     <button onClick={handlePrint} className="p-2 bg-slate-700 text-white rounded hover:bg-slate-800 transition shadow-sm" title="Print">
                        <Printer size={18} />
                     </button>
                     <button className="p-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition shadow-sm" title="Email">
                        <Mail size={18} />
                     </button>
                     
                      {debitNote.attachments && debitNote.attachments.length > 0 && (
                        <div className="relative group ml-auto">
                            <button className="flex items-center gap-2 px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition text-xs font-bold">
                                <Paperclip size={14} /> {debitNote.attachments.length} Attachment(s)
                            </button>
                             <div className="absolute right-0 top-full mt-1 w-64 bg-white border rounded shadow-lg py-1 z-20 hidden group-hover:block">
                                {debitNote.attachments.map((path, i) => (
                                    <a key={i} href={path.startsWith('http') ? path : `${API_URL}/uploads/${path}`} target="_blank" rel="noreferrer" className="block px-4 py-2 hover:bg-slate-100 text-xs truncate text-blue-600">
                                        {path.split('/').pop()}
                                    </a>
                                ))}
                             </div>
                        </div>
                     )}
                 </div>
             </div>

             {/* Document */}
             <div className="max-w-[210mm] mx-auto mt-6 bg-white shadow-lg print:shadow-none print:mt-0 print:w-full print:max-w-none border p-8 min-h-[297mm] text-slate-800 relative">
                 
                 {/* Header */}
                 <div className="flex justify-between items-start mb-8 pb-4 border-b-2 border-slate-800">
                     <div className="flex gap-4 items-center">
                        {tenantInfo.logo && (
                            <div className="w-16 h-16 bg-slate-100 flex items-center justify-center rounded overflow-hidden">
                                <img src={tenantInfo.logo.startsWith('http') ? tenantInfo.logo : (tenantInfo.logo.startsWith('/') ? tenantInfo.logo : `${API_URL}/uploads/${tenantInfo.logo}`)} alt="Logo" className="object-contain w-full h-full" onError={(e) => e.target.style.display='none'} />
                            </div>
                        )}
                        <div>
                             <h1 className="text-xl font-bold uppercase tracking-wide">{tenantInfo.companyName || tenantInfo.name}</h1>
                             <p className="text-sm font-medium text-slate-600">
                                 {tenantInfo.address}<br/>
                                 {tenantInfo.email && <span className='lowercase'>{tenantInfo.email}</span>}
                             </p>
                        </div>
                     </div>
                     <div className="text-right">
                         <h2 className="text-3xl font-bold text-slate-900 uppercase mb-1">Debit Note</h2>
                         <p className="text-sm font-bold text-slate-600">#{debitNote.debitNoteNumber}</p>
                     </div>
                 </div>

                 {/* Info Grid */}
                 <div className="flex justify-between items-start mb-8 gap-8">
                     <div className="flex-1">
                         <div className="font-bold text-slate-800 border-b border-slate-300 mb-2 pb-1 text-sm uppercase">Bill To / Vendor</div>
                         <div className="text-sm">
                             <div className="font-bold text-lg">{debitNote.supplierName}</div>
                             <div className="text-slate-600">
                                 {/* Assuming supplier details are not fully in debitNote object, showing what we have or '...' */}
                                 {/* If needed we can fetch supplier details separately like in InvoiceView */}
                                 {/* For now keeping it simple */}
                             </div>
                         </div>
                     </div>

                     <div className="w-[300px] text-sm">
                         <div className="grid grid-cols-[100px_1fr] border-b border-slate-200 py-1">
                             <span className="font-semibold text-slate-600">Date:</span>
                             <span>{debitNote.debitNoteDate ? new Date(debitNote.debitNoteDate).toLocaleDateString() : '-'}</span>
                         </div>
                         <div className="grid grid-cols-[100px_1fr] border-b border-slate-200 py-1">
                             <span className="font-semibold text-slate-600">Due Date:</span>
                             <span>{debitNote.debitNoteDueDate ? new Date(debitNote.debitNoteDueDate).toLocaleDateString() : '-'}</span>
                         </div>
                         <div className="grid grid-cols-[100px_1fr] border-b border-slate-200 py-1">
                             <span className="font-semibold text-slate-600">Ref Bill #:</span>
                             <span>{debitNote.billNumber}</span>
                         </div>
                         {debitNote.otherReferences && (
                             <div className="grid grid-cols-[100px_1fr] border-b border-slate-200 py-1">
                                 <span className="font-semibold text-slate-600">Reference:</span>
                                 <span>{debitNote.otherReferences}</span>
                             </div>
                         )}
                     </div>
                 </div>

                 {/* Items */}
                 <table className="w-full border-collapse border border-slate-300 text-sm mb-6">
                    <thead className="bg-slate-100 text-slate-800 font-bold">
                        <tr>
                            <th className="border border-slate-300 px-2 py-2 w-12 text-center">#</th>
                            <th className="border border-slate-300 px-3 py-2 text-left">Item Details</th>
                            <th className="border border-slate-300 px-3 py-2 text-left w-32">Location</th>
                            <th className="border border-slate-300 px-2 py-2 text-center w-20">Qty</th>
                            <th className="border border-slate-300 px-2 py-2 text-right w-24">Rate</th>
                            <th className="border border-slate-300 px-2 py-2 text-right w-24">Discount</th>
                            <th className="border border-slate-300 px-2 py-2 text-center w-20">Tax</th>
                            <th className="border border-slate-300 px-2 py-2 text-right w-28">Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map((it, i) => (
                            <tr key={i}>
                                <td className="border border-slate-300 px-2 py-2 text-center">{i + 1}</td>
                                <td className="border border-slate-300 px-3 py-2">
                                    <div className="font-semibold">{it.itemName || 'Item ' + it.itemId}</div>
                                </td>
                                <td className="border border-slate-300 px-3 py-2 text-xs truncate max-w-[150px]">
                                    {it.locationName || it.locationId}
                                </td>
                                <td className="border border-slate-300 px-2 py-2 text-center">{Number(it.quantity).toFixed(2)}</td>
                                <td className="border border-slate-300 px-2 py-2 text-right">{Number(it.rate).toFixed(2)}</td>
                                <td className="border border-slate-300 px-2 py-2 text-right">{Number(it.discount).toFixed(2)}</td>
                                <td className="border border-slate-300 px-2 py-2 text-center">{Number(it.taxValue || 0)}%</td>
                                <td className="border border-slate-300 px-2 py-2 text-right font-medium">{Number(it.amount).toFixed(2)}</td>
                            </tr>
                        ))}
                        {items.length === 0 && <tr><td colSpan="8" className="p-4 text-center text-gray-400">No items found</td></tr>}
                    </tbody>
                 </table>

                 {/* Totals */}
                 <div className="flex gap-8 items-stretch min-h-[150px]">
                     <div className="flex-1 flex flex-col justify-between p-3 border border-slate-200 bg-slate-50 rounded">
                          <div>
                              <div className="font-bold text-xs text-slate-500 uppercase mb-2">Total In Words</div>
                              <div className="font-medium text-slate-800 capitalize italic">{numberToWords(Math.floor(totalAmount))} AED Only</div>
                          </div>
                          {debitNote.notes && (
                              <div className="mt-4">
                                  <div className="font-bold text-xs text-slate-500 uppercase mb-1">Notes</div>
                                  <div className="text-sm text-slate-700">{debitNote.notes}</div>
                              </div>
                          )}
                     </div>

                     <div className="w-[300px] text-sm">
                         <div className="flex justify-between py-2 border-b border-slate-200">
                             <span className="font-semibold text-slate-700">Sub Total</span>
                             <span>{subTotal.toFixed(2)}</span>
                         </div>
                         <div className="flex justify-between py-2 border-b border-slate-200">
                             <span className="font-semibold text-slate-700">Tax Total</span>
                             <span>{totalTax.toFixed(2)}</span>
                         </div>
                         <div className="flex justify-between py-3 font-bold text-lg bg-slate-100 px-2 rounded mt-2">
                             <span>Total</span>
                             <span>AED {totalAmount.toFixed(2)}</span>
                         </div>
                     </div>
                 </div>

                 {/* Signature */}
                 <div className="mt-16 flex justify-end">
                     <div className="text-center w-48 border-t border-slate-400 pt-2">
                         <div className="font-bold text-slate-700 text-sm">Authorized Signature</div>
                     </div>
                 </div>

             </div>
        </div>
    );
};

export default PurchaseDebitNoteView;
