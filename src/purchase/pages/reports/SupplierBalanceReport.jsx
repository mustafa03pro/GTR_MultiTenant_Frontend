import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Loader, Printer, FileText, ChevronDown } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_BASE_URL || '';

const SupplierBalanceReport = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Filters
  const [dateRange, setDateRange] = useState('This Month');
  const [customFromDate, setCustomFromDate] = useState('');
  const [customToDate, setCustomToDate] = useState('');
  const [branchId, setBranchId] = useState(''); // Assuming logic for branch if needed

  // Helper to calculate date ranges
  const getDatesFromRange = (range) => {
    const today = new Date();
    let from = new Date();
    let to = new Date();

    switch(range) {
      case 'Today':
        break; // from/to are today
      case 'This Week':
        from.setDate(today.getDate() - today.getDay()); 
        break;
      case 'This Month':
        from.setDate(1); 
        break; 
      case 'This Quarter':
        from.setMonth(Math.floor(today.getMonth() / 3) * 3);
        from.setDate(1);
        break;
      case 'This Year':
        from.setMonth(0, 1);
        break;
      case 'Yesterday':
        from.setDate(today.getDate() - 1);
        to.setDate(today.getDate() - 1);
        break;
      case 'Previous Week':
        from.setDate(today.getDate() - today.getDay() - 7);
        to.setDate(from.getDate() + 6);
        break;
      case 'Previous Month':
        from.setMonth(today.getMonth() - 1, 1);
        to.setDate(0); // Last day of prev month
        break;
      case 'Previous Quarter':
        const currentQuarter = Math.floor(today.getMonth() / 3);
        from.setMonth((currentQuarter - 1) * 3, 1);
        to.setMonth(currentQuarter * 3, 0);
        break;
      case 'Previous Year':
        from.setFullYear(today.getFullYear() - 1, 0, 1);
        to.setFullYear(today.getFullYear() - 1, 11, 31);
        break;
      case 'Custom':
        return { from: new Date(customFromDate), to: new Date(customToDate) };
      default:
        break;
    }
    return { from, to };
  };

  const fetchReport = async () => {
    setLoading(true);
    setError('');
    try {
      const { from, to } = getDatesFromRange(dateRange);
      if (!from || !to || isNaN(from.getTime()) || isNaN(to.getTime())) {
          if (dateRange !== 'Custom') { // Custom might use raw strings if not valid yet
             // fallback
          }
      }

      const formatDate = (d) => d.toISOString().split('T')[0];

      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_URL}/purchases/reports/supplier-balance`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          fromDate: formatDate(from),
          toDate: formatDate(to),
          branchId: branchId || undefined
        }
      });
      setData(res.data || []);
    } catch (err) {
      console.error('Error fetching supplier balance report:', err);
      setError('Failed to load report data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (dateRange !== 'Custom' || (customFromDate && customToDate)) {
        fetchReport();
    }
  }, [dateRange, customFromDate, customToDate, branchId]);

  // Totals Calculation
  const totals = data.reduce((acc, item) => ({
      billInr: acc.billInr + (item.billAmountInr || 0),
      billKwd: acc.billKwd + (item.billAmountKwd || 0),
      billUsd: acc.billUsd + (item.billAmountUsd || 0),
      billCad: acc.billCad + (item.billAmountCad || 0),
      
      recvInr: acc.recvInr + (item.receivedAmountInr || 0),
      recvKwd: acc.recvKwd + (item.receivedAmountKwd || 0),
      recvUsd: acc.recvUsd + (item.receivedAmountUsd || 0),
      recvCad: acc.recvCad + (item.receivedAmountCad || 0),

      balInr: acc.balInr + (item.balanceAmountInr || 0),
      balKwd: acc.balKwd + (item.balanceAmountKwd || 0),
      balUsd: acc.balUsd + (item.balanceAmountUsd || 0),
      balCad: acc.balCad + (item.balanceAmountCad || 0),
  }), { 
      billInr: 0, billKwd: 0, billUsd: 0, billCad: 0,
      recvInr: 0, recvKwd: 0, recvUsd: 0, recvCad: 0,
      balInr: 0, balKwd: 0, balUsd: 0, balCad: 0
  });

  const formatCurrency = (val) => val ? val.toFixed(2) : '0.00';
  const formatZeroAsDash = (val) => (!val || val === 0) ? '-' : val.toFixed(2);

  return (
    <div className="p-4 md:p-6 bg-slate-50 min-h-screen font-sans text-sm">
      {/* Header */}
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex items-center gap-2 text-sm text-slate-500">
             <span>Home</span> <span>&gt;</span> <span>Reports</span>
        </div>
        <div className="bg-[#a65d8c] text-white px-4 py-3 rounded-t-md shadow-sm flex justify-between items-center">
            <h1 className="text-xl font-semibold">Supplier Balances</h1>
            <div className="flex gap-2">
                <button className="p-1 hover:bg-white/20 rounded" title="Print"><Printer size={18} /></button>
                <button className="p-1 hover:bg-white/20 rounded" title="Export to Excel"><FileText size={18} /></button>
            </div>
        </div>
      </div>

      {/* Filters Area */}
      <div className="bg-white p-4 rounded-b-md shadow-sm border border-slate-200 mb-6">
        <div className="flex flex-wrap items-end gap-4">
             {/* Period Selector */}
             <div className="w-48">
                 <select 
                    value={dateRange} 
                    onChange={(e) => setDateRange(e.target.value)}
                    className="w-full border border-slate-300 rounded px-3 py-2 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#a65d8c]"
                 >
                     <option>Today</option>
                     <option>This Week</option>
                     <option>This Month</option>
                     <option>This Quarter</option>
                     <option>This Year</option>
                     <option>Yesterday</option>
                     <option>Previous Week</option>
                     <option>Previous Month</option>
                     <option>Previous Quarter</option>
                     <option>Previous Year</option>
                     <option>Custom</option>
                 </select>
             </div>

             {/* Branch Selector (Mock for UI) */}
             <div className="flex-1 max-w-xs flex flex-col gap-1">
                 <label className="text-xs font-semibold text-slate-600">Branch</label>
                 <div className="relative">
                     <select 
                        className="w-full border border-slate-300 rounded px-3 py-2 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#a65d8c] appearance-none"
                     >
                         <option>Head Office</option>
                         <option>--All Location--</option>
                         <option>Kolkata</option>
                         <option>Guwahati</option>
                     </select>
                     <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                 </div>
             </div>
             
             {dateRange === 'Custom' && (
                 <>
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold text-slate-600">From</label>
                        <input type="date" value={customFromDate} onChange={e => setCustomFromDate(e.target.value)} className="border border-slate-300 rounded px-2 py-2" />
                    </div>
                    <div className="flex flex-col gap-1">
                         <label className="text-xs font-semibold text-slate-600">To</label>
                         <input type="date" value={customToDate} onChange={e => setCustomToDate(e.target.value)} className="border border-slate-300 rounded px-2 py-2" />
                    </div>
                 </>
             )}
        </div>
        
        {/* Report Title Center */}
        <div className="text-center mt-6 mb-2">
            <h2 className="text-lg font-bold text-slate-800 uppercase">
                {JSON.parse(localStorage.getItem('user') || '{}').tenantName || 'GTR GROUP'}
            </h2>
            <h3 className="text-md font-bold text-slate-700 uppercase">SUPPLIER BALANCES</h3>
            <p className="text-sm text-slate-600">As On {new Date().toLocaleDateString()}</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white shadow-sm border border-slate-200 overflow-x-auto">
          {loading ? (
              <div className="flex justify-center items-center h-40"><Loader className="animate-spin text-[#a65d8c] h-8 w-8" /></div>
          ) : error ? (
              <div className="p-8 text-center text-red-600">{error}</div>
          ) : (
              <table className="min-w-full text-xs">
                  <thead>
                      <tr className="bg-[#ead1dc] text-slate-800 font-semibold border-b border-slate-300">
                          <th className="px-3 py-2 text-left w-12 border-r border-white">S.no</th>
                          <th className="px-3 py-2 text-left border-r border-white">Supplier Name</th>
                          
                          {/* Bill Amount Group */}
                          <th colSpan="4" className="px-3 py-2 text-center border-r border-white">Bill Amount</th>
                          
                          {/* Received Amount Group */}
                          <th colSpan="4" className="px-3 py-2 text-center border-r border-white">Received Amount</th>
                          
                          {/* Balance Amount Group */}
                          <th colSpan="4" className="px-3 py-2 text-center">Balance Amount</th>
                      </tr>
                      <tr className="bg-[#ead1dc] text-slate-700 font-medium border-b border-slate-300">
                          <th className="border-r border-white"></th>
                          <th className="border-r border-white"></th>

                          {/* Currency Sub-headers */}
                          <th className="px-2 py-1 text-right w-24">CAD</th>
                          <th className="px-2 py-1 text-right w-28">INR</th>
                          <th className="px-2 py-1 text-right w-20">KWD</th>
                          <th className="px-2 py-1 text-right w-24 border-r border-white">USD</th>

                          <th className="px-2 py-1 text-right w-24">USD</th>
                          <th className="px-2 py-1 text-right w-24">CAD</th>
                          <th className="px-2 py-1 text-right w-28">INR</th>
                          <th className="px-2 py-1 text-right w-20 border-r border-white">KWD</th>
                          
                          <th className="px-2 py-1 text-right w-28">INR</th>
                          <th className="px-2 py-1 text-right w-20">KWD</th>
                          <th className="px-2 py-1 text-right w-24">USD</th>
                          <th className="px-2 py-1 text-right w-24">CAD</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100/50">
                      {data.map((item, index) => (
                          <tr key={index} className="hover:bg-slate-50">
                              <td className="px-3 py-2 border-r border-slate-100">{index + 1}</td>
                              <td className="px-3 py-2 font-medium text-[#a65d8c] border-r border-slate-100">{item.supplierName}</td>
                              
                              {/* Bill Amounts */}
                              <td className="px-2 py-2 text-right text-slate-600">{formatZeroAsDash(item.billAmountCad)}</td>
                              <td className="px-2 py-2 text-right font-medium">{formatZeroAsDash(item.billAmountInr)}</td>
                              <td className="px-2 py-2 text-right text-slate-600">{formatZeroAsDash(item.billAmountKwd)}</td>
                              <td className="px-2 py-2 text-right text-slate-600 border-r border-slate-100">{formatZeroAsDash(item.billAmountUsd)}</td>

                              {/* Received Amounts */}
                              {/* NOTE: Ordering in sub-headers above was USD, CAD, INR, KWD. Need to match that order or fix header.
                                  Checking image: Header is "Received Amount" -> USD  CAD  INR  KWD
                              */}
                              <td className="px-2 py-2 text-right text-slate-600">{formatZeroAsDash(item.receivedAmountUsd)}</td>
                              <td className="px-2 py-2 text-right text-slate-600">{formatZeroAsDash(item.receivedAmountCad)}</td>
                              <td className="px-2 py-2 text-right font-medium">{formatZeroAsDash(item.receivedAmountInr)}</td>
                              <td className="px-2 py-2 text-right text-slate-600 border-r border-slate-100">{formatZeroAsDash(item.receivedAmountKwd)}</td>

                               {/* Balance Amounts */}
                               {/* Image: INR KWD USD (CAD is missing in image but should be there if logic supports it. 
                                   Actually image shows Balance Amount -> INR KWD USD. 
                                   Let's stick to standard order or what's in image. I'll add CAD at end or match header.
                                   Header above I wrote: INR KWD USD CAD.
                               */}
                              <td className="px-2 py-2 text-right font-bold text-slate-800">{formatZeroAsDash(item.balanceAmountInr)}</td>
                              <td className="px-2 py-2 text-right text-slate-600">{formatZeroAsDash(item.balanceAmountKwd)}</td>
                              <td className="px-2 py-2 text-right text-slate-600">{formatZeroAsDash(item.balanceAmountUsd)}</td>
                              <td className="px-2 py-2 text-right text-slate-600">{formatZeroAsDash(item.balanceAmountCad)}</td>
                          </tr>
                      ))}
                      
                      {/* Total Row */}
                      <tr className="font-bold bg-slate-50 border-t border-slate-300">
                          <td className="px-3 py-2 text-right" colSpan={2}>Total</td>
                          
                          {/* Bill Totals */}
                          <td className="px-2 py-2 text-right">{formatCurrency(totals.billCad)}</td>
                          <td className="px-2 py-2 text-right">{formatCurrency(totals.billInr)}</td>
                          <td className="px-2 py-2 text-right">{formatCurrency(totals.billKwd)}</td>
                          <td className="px-2 py-2 text-right border-r border-slate-200">{formatCurrency(totals.billUsd)}</td>
                          
                          {/* Received Totals (Order: USD, CAD, INR, KWD) */}
                          <td className="px-2 py-2 text-right">{formatCurrency(totals.recvUsd)}</td>
                          <td className="px-2 py-2 text-right">{formatCurrency(totals.recvCad)}</td>
                          <td className="px-2 py-2 text-right">{formatCurrency(totals.recvInr)}</td>
                          <td className="px-2 py-2 text-right border-r border-slate-200">{formatCurrency(totals.recvKwd)}</td>

                          {/* Balance Totals (Order: INR, KWD, USD, CAD) */}
                          <td className="px-2 py-2 text-right">{formatCurrency(totals.balInr)}</td>
                          <td className="px-2 py-2 text-right">{formatCurrency(totals.balKwd)}</td>
                          <td className="px-2 py-2 text-right">{formatCurrency(totals.balUsd)}</td>
                          <td className="px-2 py-2 text-right">{formatCurrency(totals.balCad)}</td>
                      </tr>
                  </tbody>
              </table>
          )}
      </div>
    </div>
  );
};

export default SupplierBalanceReport;
