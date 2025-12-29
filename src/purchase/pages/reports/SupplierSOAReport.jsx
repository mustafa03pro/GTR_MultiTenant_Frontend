import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Loader, Printer, FileText, ChevronDown, Search, ArrowUpDown } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_BASE_URL || '';

const SupplierSOAReport = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Filters
  const [dateRange, setDateRange] = useState('This Month');
  const [customFromDate, setCustomFromDate] = useState('');
  const [customToDate, setCustomToDate] = useState('');
  const [branchId, setBranchId] = useState('');
  const [supplierId, setSupplierId] = useState('');
  
  // Masters
  const [suppliers, setSuppliers] = useState([]);
  const [filteredSuppliers, setFilteredSuppliers] = useState([]);
  const [supplierSearch, setSupplierSearch] = useState('');
  const [showSupplierDropdown, setShowSupplierDropdown] = useState(false);
  const supplierDropdownRef = useRef(null);

  // Client-side Table State
  const [displayRange, setDisplayRange] = useState({ from: '', to: '' });

  // Load Suppliers
  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`${API_URL}/parties`, { 
            headers: { Authorization: `Bearer ${token}` },
            params: { type: 'SUPPLIER', page: 0, size: 1000 } 
        });
        const list = res.data.content ?? res.data ?? [];
        setSuppliers(list);
        setFilteredSuppliers(list);
      } catch (err) {
        console.error('Failed to load suppliers', err);
      }
    };
    fetchSuppliers();
  }, []);

  // Filter Suppliers
  useEffect(() => {
    setFilteredSuppliers(
        suppliers.filter(s => 
            (s.companyName || '').toLowerCase().includes(supplierSearch.toLowerCase()) ||
            (s.name || '').toLowerCase().includes(supplierSearch.toLowerCase())
        )
    );
  }, [supplierSearch, suppliers]);

  // Click outside to close dropdown
  useEffect(() => {
      const handleClickOutside = (event) => {
          if (supplierDropdownRef.current && !supplierDropdownRef.current.contains(event.target)) {
              setShowSupplierDropdown(false);
          }
      };
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);


  // Date Range Helper
  const getDatesFromRange = (range) => {
    const today = new Date();
    let from = new Date();
    let to = new Date();

    switch(range) {
      case 'Today':
        break; 
      case 'This Week': 
        const day = today.getDay(); 
        const diff = today.getDate() - day + (day === 0 ? -6 : 1);
        from.setDate(diff);
        to.setDate(diff + 6);
        break;
      case 'This Month':
        from.setDate(1); 
        to.setMonth(today.getMonth() + 1, 0); 
        break; 
      case 'This Quarter':
        const quarterMonth = Math.floor(today.getMonth() / 3) * 3;
        from.setMonth(quarterMonth, 1);
        to.setMonth(quarterMonth + 3, 0);
        break;
      case 'This Year':
        from.setMonth(0, 1);
        to.setMonth(11, 31);
        break;
      case 'Yesterday':
        from.setDate(today.getDate() - 1);
        to.setDate(today.getDate() - 1);
        break;
      case 'Previous Week':
        const prevDay = today.getDay();
        const prevDiff = today.getDate() - prevDay - 7 + (prevDay === 0 ? -6 : 1);
        from.setDate(prevDiff);
        to.setDate(prevDiff + 6);
        break;
      case 'Previous Month':
        from.setMonth(today.getMonth() - 1, 1);
        to.setDate(0); 
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
    // Supplier is mandatory
    if (!supplierId) {
        if (dateRange !== 'Custom' || (customFromDate && customToDate)) {
           // Don't show error on initial load or if just browsing, but maybe specific action required?
           // Actually for SOA, usually you select supplier first.
           // We can just return or show "Select Supplier" hint.
           return; 
        }
    }

    setLoading(true);
    setError('');
    try {
      const { from, to } = getDatesFromRange(dateRange);
      
      const formatDate = (d) => d && !isNaN(d.getTime()) ? d.toISOString().split('T')[0] : '';

      // Validate dates
      if (!from || !to || isNaN(from.getTime()) || isNaN(to.getTime())) {
          if (dateRange === 'Custom') return; // Wait for valid custom dates
      }
      
      const fDate = formatDate(from);
      const tDate = formatDate(to);
      
      if (!fDate || !tDate) return;

      setDisplayRange({ from: fDate.split('-').reverse().join('/'), to: tDate.split('-').reverse().join('/') });

      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_URL}/purchases/reports/supplier-soa`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          fromDate: fDate,
          toDate: tDate,
          supplierId: supplierId,
          branchId: branchId === 'all' ? undefined : branchId || undefined
        }
      });
      setData(res.data || []);
    } catch (err) {
      console.error('Error fetching report:', err);
      // Only show error if we actually tried to fetch (i.e. supplier was selected)
      if (supplierId) setError('Failed to load report data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (supplierId) {
        fetchReport();
    }
  }, [dateRange, customFromDate, customToDate, branchId, supplierId]);
  
  // Format helpers
  const formatCurrency = (val) => val ? val.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00';
  const formatDrCr = (val, type = 'Ref') => {
      // Backend didn't send Dr/Cr, but usually:
      // Opening/Pending > 0 => Dr (Payable)
      // Received => Cr (Paid)
      // We can append Dr/Cr based on column context or value sign
      // The image shows: Opening Dr, Received Cr, Pending Dr, Final Dr.
      if (!val) return '0.00';
      const absVal = Math.abs(val);
      const str = absVal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      
      // Simple logic: If it's a "Received" column, typically Cr. If Balance/Opening is positive, Dr.
      // But let's check negative values too.
      // If val is negative in Opening/Balance => Cr (Advance/Overpaid).
      
      // For Opening/Pending/Final:
      if (type === 'Balance' || type === 'Opening' || type === 'Pending') {
          return `${str} ${val >= 0 ? 'Dr' : 'Cr'}`;
      }
      // For Received:
      if (type === 'Received') {
          return `${str} Cr`;
      }
      
      return str;
  };

  const formatDateDisplay = (dateStr) => {
      if(!dateStr) return '';
      return new Date(dateStr).toLocaleDateString('en-GB'); // DD/MM/YYYY
  };

  // Find selected supplier details
  const selectedSupplierDetails = suppliers.find(s => s.id == supplierId) || {};
  const companyInfo = JSON.parse(localStorage.getItem('user') || '{}');

  // Totals
  const totalOpening = data.reduce((sum, item) => sum + (item.openingAmount || 0), 0); // Usually just first row but checking
  // Actually opening is only on first row usually.
  const totalReceived = data.reduce((sum, item) => sum + (item.receivedAmount || 0), 0);
  const totalPending = data.reduce((sum, item) => sum + (item.pendingAmount || 0), 0);
  const totalPostDated = data.reduce((sum, item) => sum + (item.postDatedAmount || 0), 0);
  const finalBalance = data.length > 0 ? data[data.length - 1].finalBalance : 0; // Last row final balance

  return (
    <div className="p-4 md:p-6 bg-slate-50 min-h-screen font-sans text-sm">
      {/* Header */}
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex items-center gap-2 text-sm text-slate-500">
             <span>Home</span> <span>&gt;</span> <span>Reports</span>
        </div>
        <div className="bg-[#a65d8c] text-white px-4 py-3 rounded-t-md shadow-sm flex justify-between items-center">
            <h1 className="text-xl font-semibold">Supplier SOA</h1>
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
             <div className="w-40">
                 <label className="text-xs font-semibold text-slate-600 block mb-1">Period</label>
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
             
             {dateRange === 'Custom' && (
                 <>
                    <div className="w-32">
                         <label className="text-xs font-semibold text-slate-600 block mb-1">From</label>
                         <input type="date" value={customFromDate} onChange={e => setCustomFromDate(e.target.value)} className="w-full border border-slate-300 rounded px-2 py-2" />
                    </div>
                    <div className="w-32">
                         <label className="text-xs font-semibold text-slate-600 block mb-1">To</label>
                         <input type="date" value={customToDate} onChange={e => setCustomToDate(e.target.value)} className="w-full border border-slate-300 rounded px-2 py-2" />
                    </div>
                 </>
             )}

             {/* Supplier Search */}
             <div className="w-64 relative" ref={supplierDropdownRef}>
                 <label className="text-xs font-semibold text-slate-600 block mb-1">Supplier Name</label>
                 <input 
                    type="text"
                    value={supplierSearch}
                    onClick={() => setShowSupplierDropdown(true)}
                    onChange={(e) => {
                        setSupplierSearch(e.target.value);
                        setShowSupplierDropdown(true);
                    }}
                    placeholder="Type to search..."
                    className="w-full border border-slate-300 rounded px-3 py-2 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#a65d8c]"
                 />
                 {supplierId && (
                     <button 
                        onClick={() => { setSupplierId(''); setSupplierSearch(''); }}
                        className="absolute right-2 top-8 text-slate-400 hover:text-red-500"
                     >
                         ×
                     </button>
                 )}
                 
                 {showSupplierDropdown && (
                     <div className="absolute z-10 w-full bg-white border border-slate-300 mt-1 rounded shadow-lg max-h-60 overflow-y-auto">
                         {filteredSuppliers.length > 0 ? filteredSuppliers.map(s => (
                             <div 
                                key={s.id} 
                                className="px-3 py-2 hover:bg-slate-100 cursor-pointer text-sm"
                                onClick={() => {
                                    setSupplierId(s.id);
                                    setSupplierSearch(s.companyName || s.name || '');
                                    setShowSupplierDropdown(false);
                                }}
                             >
                                 {s.companyName || s.name}
                             </div>
                         )) : (
                             <div className="px-3 py-2 text-slate-500 text-sm">No suppliers found</div>
                         )}
                     </div>
                 )}
             </div>

             {/* Branch Selector */}
             <div className="w-40 flex flex-col gap-1">
                 <label className="text-xs font-semibold text-slate-600">Branch</label>
                 <div className="relative">
                     <select 
                        className="w-full border border-slate-300 rounded px-3 py-2 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#a65d8c] appearance-none"
                        value={branchId}
                        onChange={(e) => setBranchId(e.target.value)}
                     >
                         <option value="">Head Office</option>
                         <option value="all">--All Location--</option>
                     </select>
                     <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                 </div>
             </div>

             <button 
                onClick={fetchReport}
                className="bg-[#5b2c4c] text-white px-6 py-2 rounded hover:bg-[#4a243d] transition-colors mb-[1px]"
             >
                 Search
             </button>
        </div>
        
        {/* Report Title Center */}
        {supplierId && data.length > 0 && (
            <div className="text-center mt-8 mb-4">
                <h2 className="text-lg font-bold text-slate-800 uppercase">
                    {companyInfo.tenantName || 'GTR Group'}
                </h2>
                <div className="text-sm text-slate-600">
                    {/* Placeholder address - ideally from company settings */}
                    Plot 12121,<br/>
                    Contact: info@erpabsolute.com<br/>
                    GST: 09AAAPG7885R002
                </div>
                <h3 className="text-md font-bold text-slate-700 uppercase mt-2">Creditors Statement Of Accounts</h3>
                <div className="text-sm font-semibold text-slate-600">Bill Wise Detail</div>
                <div className="text-md font-bold text-slate-800">{selectedSupplierDetails.companyName || ''}</div>
                <p className="text-sm text-slate-600">From {displayRange.from} To {displayRange.to}</p>
            </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-white shadow-sm border border-slate-200 overflow-x-auto rounded-t-md">
          {loading ? (
              <div className="flex justify-center items-center h-40"><Loader className="animate-spin text-[#a65d8c] h-8 w-8" /></div>
          ) : error ? (
              <div className="p-8 text-center text-red-600">{error}</div>
          ) : !supplierId ? (
              <div className="p-12 text-center text-slate-500">Please select a supplier to view the Statement of Account.</div>
          ) : (
              <table className="min-w-full text-xs">
                  <thead>
                      <tr className="bg-white text-slate-800 font-bold border-b-2 border-slate-800">
                          <th className="px-3 py-2 text-left">Date</th>
                          <th className="px-3 py-2 text-left">Ref. No.</th>
                          <th className="px-3 py-2 text-right">Opening Amount</th>
                          <th className="px-3 py-2 text-right">Received Amount</th>
                          <th className="px-3 py-2 text-right">Pending Amount</th>
                          <th className="px-3 py-2 text-right">Post-Dated Amount</th>
                          <th className="px-3 py-2 text-right">Final Balance</th>
                          <th className="px-3 py-2 text-left">Due on</th>
                          <th className="px-3 py-2 text-right">Overdue by days</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                      {data.length > 0 ? data.map((item, index) => (
                          <tr key={index} className="hover:bg-slate-50 text-slate-700 font-medium">
                              <td className="px-3 py-2 text-slate-600">{formatDateDisplay(item.date)}</td>
                              <td className="px-3 py-2 font-bold text-slate-800">{item.refNo}</td>
                              <td className="px-3 py-2 text-right">{item.openingAmount ? formatDrCr(item.openingAmount, 'Opening') : ''}</td>
                              <td className="px-3 py-2 text-right">{item.receivedAmount ? formatDrCr(item.receivedAmount, 'Received') : ''}</td>
                              <td className="px-3 py-2 text-right">{item.pendingAmount ? formatDrCr(item.pendingAmount, 'Pending') : ''}</td>
                              <td className="px-3 py-2 text-right">{item.postDatedAmount ? formatDrCr(item.postDatedAmount, 'Post') : ''}</td>
                              <td className="px-3 py-2 text-right">{item.finalBalance ? formatDrCr(item.finalBalance, 'Balance') : ''}</td>
                              <td className="px-3 py-2">{formatDateDisplay(item.dueOn)}</td>
                              <td className="px-3 py-2 text-right">{item.overdueDays ? `${item.overdueDays} days` : ''}</td>
                          </tr>
                      )) : (
                          <tr><td colSpan="9" className="text-center py-10 text-slate-500">No records found</td></tr>
                      )}
                      
                      {/* Total Row */}
                      {data.length > 0 && (
                          <tr className="font-bold bg-slate-50 border-t-2 border-slate-300 text-slate-800">
                              <td className="px-3 py-2" colSpan={2}>Total</td>
                              <td className="px-3 py-2 text-right">
                                  {/* Opening total usually not summed like this in SOA, just the initial Opening, but strictly following column sums if needed. 
                                      The image shows a total row at bottom. 
                                      Actually for opening, it matches the sum of Opening Column.
                                      Let's verify with image: Top row "Opening" has Opening Amount. Subsequent rows have Opening Amount populated?
                                      Wait, look at image.
                                      Row 1: Opening ... 40,80,768.50 Dr ... 40,80,768.50 Dr ... 40,80,768.50 Dr
                                      Row 2: 28/11/2025 ... 525.00 Dr ... 525.00 Dr ... 525.00 Dr
                                      
                                      The logic seems:
                                      Opening Column: Amount of the Bill (Debit)
                                      Received Column: Payment (Credit)
                                      Pending Column: Remaining for that bill?
                                      Final Balance: Running Balance? OR Line Balance?
                                      
                                      Let's re-read backend DTO logic:
                                      Item.openingAmount = Bill Amount (Net Total)
                                      Item.receivedAmount = Allocated Amount
                                      Item.pendingAmount = Net - Alloc
                                      Item.finalBalance = pendingAmount (Same as pending?)
                                      
                                      Wait, "Final Balance" in the image for the first row (Opening) is same as Opening.
                                      For second row (Bill), Final Balance is same as Pending.
                                      So it seems "Final Balance" is just the line balance.
                                      
                                      There is a Total Row in the image:
                                      42,97,774.50 Dr (Sum of Opening/Bill Amts) | 4,360.00 Cr (Sum Received) | 42,93,414.50 Dr (Sum Pending) | 0.00 Cr | 42,93,414.50 Dr (Sum Final)
                                      
                                      So yes, we sum the columns.
                                  */}
                                  {formatDrCr(totalOpening, 'Opening')}
                              </td>
                              <td className="px-3 py-2 text-right">{formatDrCr(totalReceived, 'Received')}</td>
                              <td className="px-3 py-2 text-right">{formatDrCr(totalPending, 'Pending')}</td>
                              <td className="px-3 py-2 text-right">{formatDrCr(totalPostDated, 'Post')}</td>
                              <td className="px-3 py-2 text-right">{formatDrCr(data.reduce((sum, i) => sum + (i.finalBalance || 0), 0), 'Balance')}</td>
                              <td colSpan="2"></td>
                          </tr>
                      )}
                  </tbody>
              </table>
          )}
      </div>
    </div>
  );
};

export default SupplierSOAReport;
