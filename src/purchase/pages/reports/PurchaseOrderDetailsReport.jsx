import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Loader, Printer, FileText, ChevronDown, Search, ArrowUpDown } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_BASE_URL || '';

const PurchaseOrderDetailsReport = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Filters
  const [dateRange, setDateRange] = useState('This Month');
  const [customFromDate, setCustomFromDate] = useState('');
  const [customToDate, setCustomToDate] = useState('');
  const [branchId, setBranchId] = useState('');
  
  // Client-side Table State
  const [searchTerm, setSearchTerm] = useState('');
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' });
  const [displayRange, setDisplayRange] = useState({ from: '', to: '' });

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
      const res = await axios.get(`${API_URL}/purchases/reports/purchase-order-details`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          fromDate: fDate,
          toDate: tDate,
          branchId: branchId === 'all' ? undefined : branchId || undefined
        }
      });
      setData(res.data || []);
      setCurrentPage(1);
    } catch (err) {
      console.error('Error fetching report:', err);
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

  // Client-Side Sorting & Filtering
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedData = React.useMemo(() => {
    let sortableItems = [...data];
    if (sortConfig.key) {
      sortableItems.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [data, sortConfig]);

  const filteredData = React.useMemo(() => {
    return sortedData.filter(item => 
      (item.poNumber && item.poNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.supplierName && item.supplierName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.reference && item.reference.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [sortedData, searchTerm]);

  const paginatedData = React.useMemo(() => {
    const firstPageIndex = (currentPage - 1) * pageSize;
    const lastPageIndex = firstPageIndex + pageSize;
    return filteredData.slice(firstPageIndex, lastPageIndex);
  }, [filteredData, currentPage, pageSize]);

  // Totals
  const totalAmount = filteredData.reduce((sum, item) => sum + (item.amount || 0), 0);
  const totalAmountInDefaultCurrency = filteredData.reduce((sum, item) => sum + (item.amountInDefaultCurrency || 0), 0);

  const formatCurrency = (val) => val ? val.toFixed(2) : '0';
  const formatDateDisplay = (dateStr) => {
      if(!dateStr) return '';
      return new Date(dateStr).toLocaleDateString('en-GB'); // DD/MM/YYYY
  };

  return (
    <div className="p-4 md:p-6 bg-slate-50 min-h-screen font-sans text-sm">
      {/* Header */}
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex items-center gap-2 text-sm text-slate-500">
             <span>Home</span> <span>&gt;</span> <span>Reports</span>
        </div>
        <div className="bg-[#a65d8c] text-white px-4 py-3 rounded-t-md shadow-sm flex justify-between items-center">
            <h1 className="text-xl font-semibold">Purchase Order Details</h1>
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

             {/* Branch Selector */}
             <div className="flex-1 max-w-xs flex flex-col gap-1">
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
             
             {dateRange === 'Custom' && (
                 <>
                    <input type="date" value={customFromDate} onChange={e => setCustomFromDate(e.target.value)} className="border border-slate-300 rounded px-2 py-2" />
                    <input type="date" value={customToDate} onChange={e => setCustomToDate(e.target.value)} className="border border-slate-300 rounded px-2 py-2" />
                 </>
             )}
        </div>
        
        {/* Report Title Center */}
        <div className="text-center mt-6 mb-2">
            <h2 className="text-lg font-bold text-slate-800 uppercase">
                {JSON.parse(localStorage.getItem('user') || '{}').tenantName || 'ABSOLUTE ERP'}
            </h2>
            <h3 className="text-md font-bold text-slate-700 uppercase">PURCHASE ORDER DETAILS</h3>
            <p className="text-sm text-slate-600">From {displayRange.from} To {displayRange.to}</p>
        </div>
      </div>

      {/* Controls: Page Size & Search */}
      <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
          <div className="flex items-center gap-2">
              <select 
                  value={pageSize}
                  onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                  className="border border-slate-300 rounded px-2 py-1 bg-[#fffec8] text-sm focus:outline-none"
              >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
              </select>
              <span className="text-sm font-semibold text-slate-700">records per page</span>
          </div>
          
          <div className="relative w-full sm:w-64">
              <input 
                  type="text" 
                  placeholder="Search..." 
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                  className="w-full pl-3 pr-10 py-1.5 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          </div>
      </div>

      {/* Table */}
      <div className="bg-white shadow-sm border border-slate-200 overflow-x-auto rounded-t-md">
          {loading ? (
              <div className="flex justify-center items-center h-40"><Loader className="animate-spin text-[#a65d8c] h-8 w-8" /></div>
          ) : error ? (
              <div className="p-8 text-center text-red-600">{error}</div>
          ) : (
              <table className="min-w-full text-xs">
                  <thead>
                      <tr className="bg-[#ead1dc] text-slate-800 font-semibold border-b border-white">
                          {[
                            { label: 'Status', key: 'status' },
                            { label: 'P.O#', key: 'poNumber' },
                            { label: 'Date', key: 'date' },
                            { label: 'Delivery Date', key: 'deliveryDate' },
                            { label: 'Reference#', key: 'reference' },
                            { label: 'Supplier Name', key: 'supplierName' },
                            { label: 'Amount', key: 'amount', align: 'right' },
                            { label: 'Amount (in Default Currency)', key: 'amountInDefaultCurrency', align: 'right' },
                          ].map((col) => (
                              <th 
                                key={col.key} 
                                className={`px-3 py-3 text-${col.align || 'left'} cursor-pointer hover:bg-[#dabba9] transition-colors border-r border-white last:border-none`}
                                onClick={() => handleSort(col.key)}
                              >
                                  <div className={`flex items-center gap-1 ${col.align === 'right' ? 'justify-end' : 'justify-start'}`}>
                                      {col.label}
                                      <ArrowUpDown size={12} className="text-slate-500" />
                                  </div>
                              </th>
                          ))}
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                      {paginatedData.length > 0 ? paginatedData.map((item, index) => (
                          <tr key={index} className="hover:bg-slate-50 text-slate-700">
                              <td className="px-3 py-2 text-green-600 font-medium border-r border-slate-100">{item.status}</td>
                              <td className="px-3 py-2 font-medium text-[#a65d8c] border-r border-slate-100">{item.poNumber}</td>
                              <td className="px-3 py-2 border-r border-slate-100">{formatDateDisplay(item.date)}</td>
                              <td className="px-3 py-2 border-r border-slate-100">{formatDateDisplay(item.deliveryDate)}</td>
                              <td className="px-3 py-2 border-r border-slate-100">{item.reference}</td>
                              <td className="px-3 py-2 font-medium border-r border-slate-100">{item.supplierName}</td>
                              <td className="px-3 py-2 text-right font-medium border-r border-slate-100">
                                  {formatCurrency(item.amount)}
                              </td>
                              <td className="px-3 py-2 text-right font-medium">
                                  {formatCurrency(item.amountInDefaultCurrency)}
                              </td>
                          </tr>
                      )) : (
                          <tr><td colSpan="8" className="text-center py-10 text-slate-500">No records found</td></tr>
                      )}
                      
                      {/* Total Row */}
                      {filteredData.length > 0 && (
                          <tr className="font-bold bg-slate-50 border-t border-slate-300 text-slate-800">
                              <td className="px-3 py-2" colSpan={6}>Total</td>
                              <td className="px-3 py-2 text-right">{formatCurrency(totalAmount)}</td>
                              <td className="px-3 py-2 text-right">{formatCurrency(totalAmountInDefaultCurrency)}</td>
                          </tr>
                      )}
                  </tbody>
              </table>
          )}
      </div>

      {/* Pagination Footer */}
      {!loading && !error && filteredData.length > 0 && (
          <div className="flex flex-col sm:flex-row justify-between items-center mt-4 text-sm text-slate-600">
              <div>
                  Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, filteredData.length)} of {filteredData.length} entries
              </div>
              <div className="flex gap-1 mt-2 sm:mt-0">
                  <button 
                      onClick={() => setCurrentPage(curr => Math.max(curr - 1, 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1 border rounded hover:bg-slate-100 disabled:opacity-50"
                  >
                      Previous
                  </button>
                  <div className="px-3 py-1 bg-[#5b2c4c] text-white rounded">{currentPage}</div>
                  <button 
                      onClick={() => setCurrentPage(curr => curr < Math.ceil(filteredData.length / pageSize) ? curr + 1 : curr)}
                      disabled={currentPage >= Math.ceil(filteredData.length / pageSize)}
                      className="px-3 py-1 border rounded hover:bg-slate-100 disabled:opacity-50"
                  >
                      Next
                  </button>
              </div>
          </div>
      )}
    </div>
  );
};

export default PurchaseOrderDetailsReport;
