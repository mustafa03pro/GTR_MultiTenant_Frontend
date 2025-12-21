import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Loader, Printer, ArrowLeft, Mail, Paperclip, FileText, Edit, ChevronDown } from 'lucide-react';

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

const PurchaseInvoiceView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showMore, setShowMore] = useState(false);
  const [tenantInfo, setTenantInfo] = useState({ name: 'Transcold Air conditioner spare parts trading llc', address: 'Abu Dhabi', logo: '/logo.png' }); // Placeholder

  const [supplierInfo, setSupplierInfo] = useState(null);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const headers = { Authorization: `Bearer ${token}` };
        
        const res = await axios.get(`${API_URL}/purchases/invoices/${id}`, { headers });
        const data = res.data;
        setInvoice(data);

        // Fetch Tenant Info
        const tenantId = localStorage.getItem('tenantId');
        if (tenantId) {
             try {
                const tRes = await axios.get(`${API_URL}/tenants/${tenantId}`, { headers });
                setTenantInfo(tRes.data);
             } catch (e) { console.warn(e); }
        }

        // Fetch Supplier Info
        if (data.supplierId) {
             try {
                const sRes = await axios.get(`${API_URL}/parties/${data.supplierId}`, { headers });
                setSupplierInfo(sRes.data);
             } catch (e) { console.warn(e); }
        }

      } catch (err) {
        console.error('Failed to load Invoice', err);
        setError('Unable to load purchase invoice.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  const handleConvertToPayment = async () => {
    if(!window.confirm('Are you sure you want to convert this bill to a payment?')) return;
    try {
      setLoading(true); // temporary lock
      const token = localStorage.getItem('token');
      const res = await axios.post(`${API_URL}/purchases/invoices/${id}/convert-to-payment`, {}, {
         headers: { Authorization: `Bearer ${token}` }
      });
      navigate(`/purchase-dashboard/payments/edit/${res.data.id}`);
    } catch (err) {
      console.error(err);
      alert('Failed to convert to payment: ' + (err.response?.data?.message || err.message));
      setLoading(false); 
    }
  };

  if (loading) return <div className="flex justify-center items-center h-screen"><Loader className="animate-spin text-blue-600" size={40} /></div>;
  if (!invoice) return <div className="p-8 text-center text-red-500">{error || 'Invoice not found'}</div>;

  const totalAmountWords = numberToWords(Math.floor(invoice.netTotal || 0));

  return (
    <div className="bg-slate-50 min-h-screen pb-12 print:bg-white print:pb-0 font-sans">
      {/* Breadcrumb & Top Bar - Hidden in Print */}
      <div className="print:hidden">
          <div className="bg-white border-b px-6 py-3 flex justify-between items-center text-xs text-slate-600">
             <div className="flex items-center gap-2">
                <Link to="/" className="hover:text-blue-600">Home</Link> / 
                <Link to="/purchase-dashboard/bills" className="hover:text-blue-600">Purchase Bills</Link> / 
                <span className="text-slate-900 font-medium">View Bill</span>
             </div>
             <div className="flex gap-2">
                 <Link to="/purchase-dashboard/bills" className="px-3 py-1.5 bg-blue-500 text-white rounded hover:bg-blue-600 transition">All Bills</Link>
                 <Link to="/purchase-dashboard/bills/new" className="px-3 py-1.5 bg-blue-500 text-white rounded hover:bg-blue-600 transition">+ New Bill</Link>
             </div>
          </div>

          <div className="bg-sky-500 px-6 py-4 text-white text-xl font-medium shadow-sm">
             View Bill # {invoice.billNumber}
          </div>

          {/* Action Toolbar */}
          <div className="px-6 py-4 flex flex-wrap gap-2 items-center border-b bg-white shadow-sm sticky top-0 z-10">
             <Link to={`/purchase-dashboard/bills/edit/${invoice.id}`} className="p-2 bg-sky-500 text-white rounded hover:bg-sky-600 transition shadow-sm" title="Edit">
                <Edit size={18} />
             </Link>
             <button className="p-2 bg-red-500 text-white rounded hover:bg-red-600 transition shadow-sm" title="PDF">
                <FileText size={18} />
             </button>
             <button onClick={handlePrint} className="p-2 bg-sky-600 text-white rounded hover:bg-sky-700 transition shadow-sm" title="Print">
                <Printer size={18} />
             </button>
             <button onClick={handlePrint} className="px-3 py-2 bg-white border border-slate-300 text-slate-700 rounded hover:bg-slate-50 text-xs font-medium flex items-center gap-2 shadow-sm">
                <Printer size={16} /> Print On Letterhead
             </button>
             <button className="p-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition shadow-sm" title="Email">
                <Mail size={18} />
             </button>
             
             {/* Attachments Dropdown Logic or Modal could be here, simply linking to them for now */}
             {invoice.attachments && invoice.attachments.length > 0 && (
                <div className="relative group">
                   <button className="p-2 bg-green-500 text-white rounded hover:bg-green-600 transition shadow-sm" title="Attachments">
                      <Paperclip size={18} />
                   </button>
                   <div className="absolute top-full left-0 mt-1 w-48 bg-white border rounded shadow-lg py-1 z-20 hidden group-hover:block">
                      {invoice.attachments.map(a => (
                         <a key={a.id} href={a.url} target="_blank" rel="noreferrer" className="block px-4 py-2 hover:bg-slate-100 text-xs truncate">
                            {a.fileName}
                         </a>
                      ))}
                   </div>
                </div>
             )}

             <div className="relative">
                 <button onClick={() => setShowMore(!showMore)} className="px-3 py-2 bg-slate-700 text-white rounded text-xs font-medium flex items-center gap-1 hover:bg-slate-800 transition shadow-sm">
                    More <ChevronDown size={14} />
                 </button>
                 {showMore && (
                     <div className="absolute top-full left-0 mt-1 w-48 bg-white border rounded shadow-lg py-1 z-20 text-xs text-slate-700" onMouseLeave={() => setShowMore(false)}>
                         {/* <button onClick={() => navigate('/purchase-dashboard/payments/new', { state: { supplierId: invoice.supplierId, invoiceId: invoice.id } })} className="block w-full text-left px-4 py-2 hover:bg-slate-100">Make Payment</button> */}
                         <button onClick={handleConvertToPayment} className="block w-full text-left px-4 py-2 hover:bg-slate-100 text-green-600 font-medium">Convert to Payment</button>
                     </div>
                 )}
             </div>
          </div>
          
          <div className="px-6 py-2 flex gap-4 text-xs text-slate-500 bg-white border-b">
              <div>Created: {invoice.createdAt ? new Date(invoice.createdAt).toLocaleString() : ''} by {invoice.createdBy || 'System'}</div>
          </div>
      </div>

      {/* DOCUMENT PREVIEW AREA */}
      <div className="max-w-[210mm] mx-auto mt-6 bg-white shadow-lg print:shadow-none print:mt-0 print:w-full print:max-w-none border p-8 min-h-[297mm] text-slate-800 relative">
         
         {/* Letterhead Header Section */}
         <div className="flex justify-between items-start mb-8 pb-4 border-b-2 border-slate-800">
             <div className="flex gap-4 items-center">
                 {/* Logo */}
                 {tenantInfo.logo && (
                     <div className="w-16 h-16 bg-slate-100 flex items-center justify-center rounded">
                        <img src={tenantInfo.logo.startsWith('/') ? tenantInfo.logo : `${API_URL}/uploads/${tenantInfo.logo}`} alt="Logo" className="max-w-full max-h-full" onError={(e) => e.target.style.display='none'} />
                     </div>
                 )}
                 <div>
                     <h1 className="text-xl font-bold uppercase tracking-wide">{tenantInfo.companyName || tenantInfo.name}</h1>
                     <p className="text-sm font-medium text-slate-600">
                         {tenantInfo.address || tenantInfo.location || ''}<br/>
                         {tenantInfo.email && <span className='lowercase'>{tenantInfo.email}</span>}
                     </p>
                 </div>
             </div>
         </div>

         {/* Title & Meta Grid */}
         <div className="flex justify-between items-end mb-6">
             <div className="border border-slate-300 rounded p-0 overflow-hidden text-sm w-1/2">
                 <div className="grid grid-cols-[120px_1fr] border-b border-slate-200">
                     <div className="bg-slate-50 px-3 py-1 font-semibold text-slate-700 border-r border-slate-200">Bill No.</div>
                     <div className="px-3 py-1 font-bold text-slate-900">: {invoice.billNumber}</div>
                 </div>
                 {invoice.billLedger && (
                   <div className="grid grid-cols-[120px_1fr] border-b border-slate-200">
                       <div className="bg-slate-50 px-3 py-1 font-semibold text-slate-700 border-r border-slate-200">Bill Ledger</div>
                       <div className="px-3 py-1">: {invoice.billLedger}</div>
                   </div>
                 )}
                 {invoice.billType && (
                   <div className="grid grid-cols-[120px_1fr] border-b border-slate-200">
                       <div className="bg-slate-50 px-3 py-1 font-semibold text-slate-700 border-r border-slate-200">Bill Type</div>
                       <div className="px-3 py-1">: {invoice.billType}</div>
                   </div>
                 )}
                 <div className="grid grid-cols-[120px_1fr] border-b border-slate-200">
                     <div className="bg-slate-50 px-3 py-1 font-semibold text-slate-700 border-r border-slate-200">Bill Date</div>
                     <div className="px-3 py-1">: {invoice.billDate ? new Date(invoice.billDate).toLocaleDateString() : '-'}</div>
                 </div>
                 <div className="grid grid-cols-[120px_1fr] border-b border-slate-200">
                     <div className="bg-slate-50 px-3 py-1 font-semibold text-slate-700 border-r border-slate-200">Due Date</div>
                     <div className="px-3 py-1">: {invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : '-'}</div>
                 </div>
                 {invoice.orderNumber && (
                    <div className="grid grid-cols-[120px_1fr] border-b border-slate-200">
                        <div className="bg-slate-50 px-3 py-1 font-semibold text-slate-700 border-r border-slate-200">Ref Order.</div>
                        <div className="px-3 py-1">: {invoice.orderNumber}</div>
                    </div>
                 )}
                 {invoice.template && (
                    <div className="grid grid-cols-[120px_1fr]">
                        <div className="bg-slate-50 px-3 py-1 font-semibold text-slate-700 border-r border-slate-200">Template</div>
                        <div className="px-3 py-1">: {invoice.template}</div>
                    </div>
                 )}
             </div>
             
             <div className="text-right">
                 <h2 className="text-3xl font-bold text-slate-900 uppercase mb-1">Purchase Bill</h2>
                 <p className="text-sm font-bold text-slate-600">TRN : {tenantInfo.trnNumber || tenantInfo.taxId || '-'}</p>
             </div>
         </div>

         {/* Addresses */}
         <div className="mb-8">
             <div className="font-bold text-slate-800 border-b border-slate-300 mb-2 pb-1">Supplier Details</div>
             <div className="bg-slate-50 p-3 border rounded text-sm">
                 <div className="font-bold text-lg">{supplierInfo ? (supplierInfo.companyName || supplierInfo.name) : invoice.supplierName}</div>
                 <div className="text-slate-600 whitespace-pre-wrap">
                    {supplierInfo ? (
                        <>
                           {supplierInfo.addressLine1} {supplierInfo.addressLine2}<br/>
                           {supplierInfo.city} {supplierInfo.state} {supplierInfo.country}<br/>
                           {supplierInfo.phone && <>Ph: {supplierInfo.phone}<br/></>}
                           {supplierInfo.email && <>{supplierInfo.email}</>}
                        </>
                    ) : 'Address information not loaded'}
                 </div>
                 <div className="mt-1 text-slate-500">TRN: {supplierInfo ? (supplierInfo.trnNumber || supplierInfo.taxId) : '-'}</div>
             </div>
         </div>

         {/* Items Table */}
         <table className="w-full border-collapse border border-slate-300 text-sm mb-6">
             <thead className="bg-slate-100 text-slate-800 font-bold">
                 <tr>
                     <th className="border border-slate-300 px-2 py-2 w-12 text-center">S.N</th>
                     <th className="border border-slate-300 px-3 py-2 text-left">Item & Description</th>
                     <th className="border border-slate-300 px-2 py-2 text-center w-24">Qty</th>
                     <th className="border border-slate-300 px-2 py-2 text-right w-24">Rate</th>
                     <th className="border border-slate-300 px-2 py-2 text-right w-20">Discount</th>
                     <th className="border border-slate-300 px-2 py-2 text-center w-20">Tax (%)</th>
                     <th className="border border-slate-300 px-2 py-2 text-right w-28">Amount</th>
                 </tr>
             </thead>
             <tbody>
                 {(invoice.lines || []).map((it, i) => {
                     // Deciding qty display
                     const qty = invoice.grossNetEnabled && it.quantityNet > 0 ? it.quantityNet : it.quantityGross;
                     
                     return (
                         <tr key={i}>
                             <td className="border border-slate-300 px-2 py-2 text-center">{it.lineNumber || i + 1}</td>
                             <td className="border border-slate-300 px-3 py-2">
                                 <div className="font-semibold">{it.itemName || '-'}</div>
                                 <div className="text-xs text-slate-500">{it.description}</div>
                             </td>
                             <td className="border border-slate-300 px-2 py-2 text-center">{Number(qty).toFixed(2)} {it.unitName}</td>
                             <td className="border border-slate-300 px-2 py-2 text-right">{Number(it.rate).toFixed(2)}</td>
                             <td className="border border-slate-300 px-2 py-2 text-right">{Number(it.lineDiscount || 0).toFixed(2)}</td>
                             <td className="border border-slate-300 px-2 py-2 text-center">{Number(it.taxPercent || 0)}%</td>
                             <td className="border border-slate-300 px-2 py-2 text-right">{Number(it.amount).toFixed(2)}</td>
                         </tr>
                     );
                 })}
             </tbody>
         </table>

         {/* Footer / Totals Section */}
         <div className="flex gap-8 items-stretch h-full min-h-[200px]">
             {/* Left Column: Words, Notes */}
             <div className="flex-1 flex flex-col justify-between border border-slate-300 p-0">
                  <div className="p-3 border-b border-slate-300">
                      <div className="font-bold text-sm mb-1">Amount in Words :</div>
                      <div className="text-sm italic text-slate-700 capitalize">
                          {totalAmountWords} AED Only
                      </div>
                  </div>
                  
                  <div className="p-3 flex-1">
                      {invoice.notes && (
                          <div className="mb-4">
                              <div className="font-bold text-sm mb-1">Notes :</div>
                              <div className="text-xs text-slate-600 whitespace-pre-wrap">{invoice.notes}</div>
                          </div>
                      )}
                  </div>
             </div>

             {/* Right Column: Totals */}
             <div className="w-[300px] flex flex-col border border-slate-300 p-0">
                  <div className="text-sm">
                      <div className="flex justify-between p-2 border-b border-slate-200">
                          <span className="font-semibold text-slate-700">Sub Total</span>
                          <span>{Number(invoice.subTotal || 0).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between p-2 border-b border-slate-200">
                          <span className="font-semibold text-slate-700">Total Discount</span>
                          <span>{Number(invoice.totalDiscount || 0).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between p-2 border-b border-slate-200 bg-slate-50">
                          <span className="font-semibold text-slate-700">Gross Total</span>
                          <span>{Number(invoice.grossTotal || 0).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between p-2 border-b border-slate-200">
                          <span className="font-semibold text-slate-700">Total Tax</span>
                          <span>{Number(invoice.totalTax || 0).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between p-2 border-b border-slate-200">
                          <span className="font-semibold text-slate-700">Other Charges</span>
                          <span>{Number(invoice.otherCharges || 0).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between p-3 bg-slate-100 font-bold text-lg text-slate-900">
                          <span>Net Total</span>
                          <span>AAD {Number(invoice.netTotal || 0).toFixed(2)}</span>
                      </div>
                  </div>
             </div>
         </div>

         {/* Signature Block */}
         <div className="mt-12 pt-8 flex justify-end">
              <div className="text-center w-48">
                  <div className="mb-4 h-16">
                      {/* Authorized Signature Image Placeholder */}
                  </div>
                  <div className="border-t border-slate-400 pt-2 font-bold text-slate-700 text-sm">Authorized Signature</div>
              </div>
         </div>

         {/* Footer Line */}
         <div className="absolute bottom-0 left-0 w-full text-center text-[10px] text-slate-400 p-4 border-t print:block hidden">
             Computer generated document.
         </div>

      </div>
    </div>
  );
};

export default PurchaseInvoiceView;
