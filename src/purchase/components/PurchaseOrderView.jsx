import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Loader, Printer, ArrowLeft, MoreHorizontal, Mail, Paperclip, FileText, Edit, FileInput, ChevronDown, Check } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_BASE_URL || '';

// Basic number to words converter (simplified for EN)
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

const PurchaseOrderView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [po, setPo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [showMore, setShowMore] = useState(false);
  const [isLetterHead, setIsLetterHead] = useState(false);
  const [tenantInfo, setTenantInfo] = useState({ name: 'Transcold Air conditioner spare parts trading llc', address: 'Abu Dhabi', logo: '/logo.png' }); // Placeholder

  const [supplierInfo, setSupplierInfo] = useState(null);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const headers = { Authorization: `Bearer ${token}` };
        
        // Load PO
        const start = Date.now();
        const res = await axios.get(`${API_URL}/purchase/orders/${id}`, { headers });
        const data = res.data;
        setPo(data);

        // Fetch Tenant Info
        const tenantId = localStorage.getItem('tenantId'); // Assuming stored
        if (tenantId) {
            try {
                // Try fetching tenant details. Endpoint guess based on standard REST
                const tRes = await axios.get(`${API_URL}/tenants/${tenantId}`, { headers });
                setTenantInfo(tRes.data);
            } catch (terr) {
                console.warn('Failed to load tenant info, using defaults', terr);
                // Keep default or try another endpoint like /auth/me if available
                // setTenantInfo({ name: tenantId, address: '' }); 
            }
        }

        // Fetch Supplier Info if ID exists
        if (data.supplierId) {
            try {
                 const sRes = await axios.get(`${API_URL}/parties/${data.supplierId}`, { headers });
                 setSupplierInfo(sRes.data);
            } catch (serr) {
                 console.warn('Failed to load supplier info', serr);
            }
        }

      } catch (err) {
        console.error('Failed to load PO', err);
        setError('Unable to load purchase order.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  const handleConvertToBill = async () => {
    if (!window.confirm('Are you sure you want to convert this PO to a Bill?')) return;
    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(`${API_URL}/purchase/orders/${id}/convert-to-bill`, null, { headers: { Authorization: `Bearer ${token}` } });
      const newInvoiceId = res.data.id;
      alert('Converted to Bill successfully! Please enter the Bill Number.');
      navigate(`/purchase-dashboard/bills/edit/${newInvoiceId}`);
    } catch (err) {
      alert('Failed to convert. ' + (err.response?.data?.message || err.message));
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <div className="flex justify-center items-center h-screen"><Loader className="animate-spin text-blue-600" size={40} /></div>;
  if (!po) return <div className="p-8 text-center text-red-500">{error || 'Purchase Order not found'}</div>;

  const totalAmountWords = numberToWords(Math.floor(po.totalAmount || 0));

  return (
    <div className="bg-slate-50 min-h-screen pb-12 print:bg-white print:pb-0">
      {/* Breadcrumb & Top Bar - Hidden in Print */}
      <div className="print:hidden">
          <div className="bg-white border-b px-6 py-3 flex justify-between items-center text-sm text-slate-600">
             <div className="flex items-center gap-2">
                <Link to="/" className="hover:text-blue-600">Home</Link> / 
                <Link to="/purchase-dashboard/purchase-orders" className="hover:text-blue-600">Purchase Order</Link> / 
                <span className="text-slate-900 font-medium">View Purchase Order</span>
             </div>
             <div className="flex gap-2">
                 <Link to="/purchase-dashboard/purchase-orders" className="px-3 py-1.5 bg-blue-500 text-white rounded text-xs hover:bg-blue-600 transition">All Purchase Order</Link>
                 <Link to="/purchase-dashboard/purchase-orders/new" className="px-3 py-1.5 bg-blue-500 text-white rounded text-xs hover:bg-blue-600 transition">+ New Purchase Order</Link>
             </div>
          </div>

          <div className="bg-sky-500 px-6 py-4 text-white text-xl font-medium shadow-sm">
             View Purchase Order
          </div>

          {/* Action Toolbar */}
          <div className="px-6 py-4 flex flex-wrap gap-2 items-center border-b bg-white shadow-sm sticky top-0 z-10">
             {/* Edit */}
             <Link to={`/purchase-dashboard/purchase-orders/edit/${po.id}`} className="p-2 bg-sky-500 text-white rounded hover:bg-sky-600 transition shadow-sm" title="Edit">
                <Edit size={18} />
             </Link>
             {/* PDF (Placeholder) */}
             <button className="p-2 bg-red-500 text-white rounded hover:bg-red-600 transition shadow-sm" title="PDF">
                <FileText size={18} />
             </button>
             {/* Print Normal */}
             <button onClick={() => { setIsLetterHead(false); setTimeout(handlePrint, 100); }} className="p-2 bg-sky-600 text-white rounded hover:bg-sky-700 transition shadow-sm" title="Print">
                <Printer size={18} />
             </button>
             {/* Print Letterhead */}
             <button onClick={() => { setIsLetterHead(true); setTimeout(handlePrint, 100); }} className="px-3 py-2 bg-white border border-slate-300 text-slate-700 rounded hover:bg-slate-50 text-sm font-medium flex items-center gap-2 shadow-sm">
                <Printer size={16} /> Print On Letterhead
             </button>
             {/* Email */}
             <button className="p-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition shadow-sm" title="Email">
                <Mail size={18} />
             </button>
             {/* Attachments */}
             <button className="p-2 bg-green-500 text-white rounded hover:bg-green-600 transition shadow-sm" title="Attachments">
                <Paperclip size={18} />
             </button>

             {/* Convert - Moved to More */}

             {/* More Dropdown */}
             <div className="relative">
                 <button onClick={() => setShowMore(!showMore)} className="px-3 py-2 bg-slate-700 text-white rounded text-sm font-medium flex items-center gap-1 hover:bg-slate-800 transition shadow-sm">
                    More <ChevronDown size={14} />
                 </button>
                 {showMore && (
                     <div className="absolute top-full left-0 mt-1 w-48 bg-white border rounded shadow-lg py-1 z-20 text-sm text-slate-700" onMouseLeave={() => setShowMore(false)}>
                         <button onClick={() => navigate(`/purchase-dashboard/purchase-orders/${id}/grn/new`)} className="block w-full text-left px-4 py-2 hover:bg-slate-100">Add GRN</button>
                         {po.status !== 'Billed' && (
                              <>
                                  <button onClick={() => navigate('/purchase-dashboard/bills/new', { state: { fromPo: po } })} className="block w-full text-left px-4 py-2 hover:bg-slate-100 text-blue-600">
                                      Convert to Bill
                                  </button>
                                  <button onClick={() => navigate('/purchase-dashboard/payments/new', { state: { fromPo: po } })} className="block w-full text-left px-4 py-2 hover:bg-slate-100 text-green-600">
                                      Convert to Payment
                                  </button>
                              </>
                          )}
                     </div>
                 )}
             </div>
          </div>
          
          {/* Messages / Meta */}
          <div className="px-6 py-3 flex gap-4 text-xs text-slate-500 bg-white border-b">
              {/* Toggle view placeholder */}
              <div className="flex gap-1">
                  <span className="px-2 py-0.5 bg-green-500 text-white rounded cursor-pointer">+ View more</span>
                  <span className="px-2 py-0.5 bg-red-400 text-white rounded cursor-pointer">- View less</span>
              </div>
              <div>{po.createdAt ? new Date(po.createdAt).toLocaleString() : ''}  Purchase Order Created. by {po.createdBy || 'System'} .</div>
          </div>
      </div>

      {/* DOCUMENT PREVIEW AREA */}
      <div className="max-w-[210mm] mx-auto mt-6 bg-white shadow-lg print:shadow-none print:mt-0 print:w-full print:max-w-none border p-8 min-h-[297mm] text-slate-800 font-sans relative">
         
         {/* Letterhead Header Section - Hidden if isLetterHead is true */}
         {!isLetterHead && (
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
                            {tenantInfo.address || tenantInfo.location || ''} <br/>
                            {tenantInfo.email && <span className='lowercase'>{tenantInfo.email}</span>}
                         </p>
                     </div>
                 </div>
             </div>
         )}

         {/* Title & PO Meta Grid */}
         <div className="flex justify-between items-end mb-6">
             <div className="border border-slate-300 rounded p-0 overflow-hidden text-sm w-1/2">
                 <div className="grid grid-cols-[120px_1fr] border-b border-slate-200">
                     <div className="bg-slate-50 px-3 py-1 font-semibold text-slate-700 border-r border-slate-200">Order No.</div>
                     <div className="px-3 py-1 font-bold text-slate-900">: {po.poNumber}</div>
                 </div>
                 <div className="grid grid-cols-[120px_1fr] border-b border-slate-200">
                     <div className="bg-slate-50 px-3 py-1 font-semibold text-slate-700 border-r border-slate-200">Order Date</div>
                     <div className="px-3 py-1">: {po.date ? new Date(po.date).toLocaleDateString() : '-'}</div>
                 </div>
                 <div className="grid grid-cols-[120px_1fr] border-b border-slate-200">
                     <div className="bg-slate-50 px-3 py-1 font-semibold text-slate-700 border-r border-slate-200">Expiry Date</div>
                     <div className="px-3 py-1">: - </div> 
                 </div>
                 <div className="grid grid-cols-[120px_1fr]">
                     <div className="bg-slate-50 px-3 py-1 font-semibold text-slate-700 border-r border-slate-200">Reference No.</div>
                     <div className="px-3 py-1">: {po.reference || '-'}</div>
                 </div>
             </div>
             
             <div className="text-right">
                 <h2 className="text-3xl font-bold text-slate-900 uppercase mb-1">Purchase Order</h2>
                 <p className="text-sm font-bold text-slate-600">TRN : {tenantInfo.trnNumber || tenantInfo.taxId || '-'}</p> 
             </div>
         </div>

         {/* Addresses */}
         <div className="mb-8">
             <div className="font-bold text-slate-800 border-b border-slate-300 mb-2 pb-1">Vendor Address</div>
             <div className="bg-slate-50 p-3 border rounded text-sm">
                 <div className="font-bold text-lg">{supplierInfo ? (supplierInfo.companyName || supplierInfo.name) : po.supplierName}</div>
                 <div className="text-slate-600 whitespace-pre-wrap">
                    {supplierInfo ? (
                        <>
                           {supplierInfo.addressLine1} {supplierInfo.addressLine2}<br/>
                           {supplierInfo.city} {supplierInfo.state} {supplierInfo.country}<br/>
                           {supplierInfo.phone && <>Ph: {supplierInfo.phone}<br/></>}
                           {supplierInfo.email && <>{supplierInfo.email}</>}
                        </>
                    ) : (po.supplierAddress || 'Address not loaded')}
                 </div>
                 <div className="mt-1 text-slate-500">TRN: {supplierInfo ? (supplierInfo.trnNumber || supplierInfo.taxId) : (po.supplierTrn || '-')}</div>
             </div>
             
             {po.deliverToAddress && (
                <div className="mt-4">
                     <div className="font-bold text-slate-800 border-b border-slate-300 mb-2 pb-1">Deliver To</div>
                     <div className="text-sm text-slate-600 whitespace-pre-wrap">{po.deliverToAddress}</div>
                </div>
             )}
         </div>

         {/* Items Table */}
         <table className="w-full border-collapse border border-slate-300 text-sm mb-6">
             <thead className="bg-slate-100 text-slate-800 font-bold">
                 <tr>
                     <th className="border border-slate-300 px-2 py-2 w-12 text-center">S.N</th>
                     <th className="border border-slate-300 px-3 py-2 text-left">Item & Description</th>
                     <th className="border border-slate-300 px-2 py-2 text-center w-24">Qty (Unit)</th>
                     <th className="border border-slate-300 px-2 py-2 text-right w-24">Rate</th>
                     <th className="border border-slate-300 px-2 py-2 text-right w-20">Discount</th>
                     <th className="border border-slate-300 px-2 py-2 text-center w-20">VAT (%)</th>
                     <th className="border border-slate-300 px-2 py-2 text-right w-24">VAT Amount</th>
                     <th className="border border-slate-300 px-2 py-2 text-right w-28">Amount</th>
                 </tr>
             </thead>
             <tbody>
                 {(po.items || []).map((it, i) => {
                     const qty = Number(it.quantity) || 0;
                     const rate = Number(it.rate) || 0;
                     const disc = Number(it.lineDiscount) || 0;
                     const taxPct = Number(it.taxPercent) || 0;
                     const netAmount = (qty * rate) - disc;
                     const taxAmt = netAmount * (taxPct / 100);
                     const total = netAmount + taxAmt;
                     
                     return (
                         <tr key={i}>
                             <td className="border border-slate-300 px-2 py-2 text-center">{it.lineNumber || i + 1}</td>
                             <td className="border border-slate-300 px-3 py-2">
                                 <div className="font-semibold">{it.itemName}</div>
                                 <div className="text-xs text-slate-500">{it.description}</div>
                             </td>
                             <td className="border border-slate-300 px-2 py-2 text-center">{qty} ({it.unitName || ''})</td>
                             <td className="border border-slate-300 px-2 py-2 text-right">{rate.toFixed(2)}</td>
                             <td className="border border-slate-300 px-2 py-2 text-right">{disc.toFixed(2)}</td>
                             <td className="border border-slate-300 px-2 py-2 text-center">{taxPct}%</td>
                             <td className="border border-slate-300 px-2 py-2 text-right">{taxAmt.toFixed(2)}</td>
                             <td className="border border-slate-300 px-2 py-2 text-right">{total.toFixed(2)}</td>
                         </tr>
                     );
                 })}
             </tbody>
         </table>

         {/* Footer / Totals Section */}
         <div className="flex gap-8 items-stretch h-full min-h-[200px]">
             {/* Left Column: Words, Notes, Terms */}
             <div className="flex-1 flex flex-col justify-between border border-slate-300 p-0">
                  <div className="p-3 border-b border-slate-300">
                      <div className="font-bold text-sm mb-1">Amount in Words :</div>
                      <div className="text-sm italic text-slate-700 capitalize">
                          {totalAmountWords} {po.currency} Only
                      </div>
                  </div>
                  
                  <div className="p-3 flex-1">
                      {po.notes && (
                          <div className="mb-4">
                              <div className="font-bold text-sm mb-1">Notes :</div>
                              <div className="text-xs text-slate-600 whitespace-pre-wrap">{po.notes}</div>
                          </div>
                      )}
                      
                      {po.termsAndConditions && (
                          <div>
                              <div className="font-bold text-sm mb-1">Terms & Conditions :</div>
                              <div className="text-xs text-slate-600 whitespace-pre-wrap">{po.termsAndConditions}</div>
                          </div>
                      )}
                  </div>
             </div>

             {/* Right Column: Totals & Signature */}
             <div className="w-[300px] flex flex-col border border-slate-300 p-0">
                  <div className="text-sm">
                      <div className="flex justify-between p-2 border-b border-slate-200">
                          <span className="font-semibold text-slate-700">Total Discount</span>
                          <span>{Number(po.totalDiscount || 0).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between p-2 border-b border-slate-200">
                          <span className="font-semibold text-slate-700">Sub Total</span>
                          <span>{Number(po.subTotal || 0).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between p-2 border-b border-slate-200">
                          <span className="font-semibold text-slate-700">Total VAT</span>
                          <span>{Number(po.totalTax || 0).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between p-2 border-b border-slate-200">
                          <span className="font-semibold text-slate-700">Other Charges</span>
                          <span>{Number(po.otherCharges || 0).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between p-2 bg-slate-100 font-bold border-b border-slate-300">
                          <span>Total</span>
                          <span>{Number(po.totalAmount || 0).toFixed(2)}</span>
                      </div>
                  </div>
                  
                  <div className="flex-1 flex flex-col justify-end items-center p-6 text-center">
                       <div className="h-16 w-full mb-2"></div> {/* Signature Space */}
                       <div className="border-t border-slate-800 w-full pt-2 font-bold text-sm">Authorized Signature</div>
                  </div>
             </div>
         </div>

      </div>
    </div>
  );
};

export default PurchaseOrderView;
