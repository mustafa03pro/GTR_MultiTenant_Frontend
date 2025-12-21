
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, RotateCcw, Download } from 'lucide-react';
import * as XLSX from 'xlsx';

const SalesForecastingReport = () => {
  const [filters, setFilters] = useState({
    fromDate: new Date().toISOString().split('T')[0],
    toDate: new Date().toISOString().split('T')[0],
    storeId: '',
  });
  const [stores, setStores] = useState([]);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const API_URL = import.meta.env.VITE_API_BASE_URL;

  useEffect(() => {
    fetchStores();
  }, []);

  const fetchStores = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/pos/stores`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStores(response.data);
    } catch (err) {
      console.error("Error fetching stores:", err);
    }
  };

  const fetchReport = async () => {
    setLoading(true);
    setError(null);
    try {
        const token = localStorage.getItem('token');
        const params = {
            fromDate: filters.fromDate,
            toDate: filters.toDate,
        };
        if (filters.storeId) {
            params.storeId = filters.storeId;
        }

        console.log("Fetching Sales Forecasting Report with params:", params);

        const response = await axios.get(`${API_URL}/pos/reports/sales-forecasting-report`, {
            headers: { Authorization: `Bearer ${token}` },
            params: params
        });

        console.log("Report Data:", response.data);
        setData(response.data);
    } catch (err) {
        console.error("Error fetching report:", err);
        setError("Failed to load report data.");
    } finally {
        setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchReport();
  };

  const handleReset = () => {
    setFilters({
      fromDate: new Date().toISOString().split('T')[0],
      toDate: new Date().toISOString().split('T')[0],
      storeId: '',
    });
    setData([]);
    setError(null);
  };

  const exportToExcel = () => {
    if (!data.length) return;

    // Map data for export
    const exportData = data.map(item => ({
      "Month Year": item.monthYear,
      "Actual Sales": item.actualSales,
      "Forecasted Sales": item.forecastedSales,
      "Achieved %": `${item.achievedPercentage}%`
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sales Forecasting");
    XLSX.writeFile(workbook, "Sales_Forecasting_Report.xlsx");
  };

  // Helper to format currency
  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined) return '0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Sales Forecasting Report</h1>
        {data.length > 0 && (
          <button
            onClick={exportToExcel}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
          >
            <Download size={18} />
            Export to Excel
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6">
        <form onSubmit={handleSearch} className="flex flex-wrap items-end gap-4">
          <div className="w-full sm:w-auto">
            <label className="block text-sm font-medium text-slate-700 mb-1">From Date</label>
            <input
              type="date"
              name="fromDate"
              value={filters.fromDate}
              onChange={handleFilterChange}
              className="w-full sm:w-40 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
              required
            />
          </div>

          <div className="w-full sm:w-auto">
            <label className="block text-sm font-medium text-slate-700 mb-1">To Date</label>
            <input
              type="date"
              name="toDate"
              value={filters.toDate}
              onChange={handleFilterChange}
              className="w-full sm:w-40 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
              required
            />
          </div>

          <div className="w-full sm:w-auto">
            <label className="block text-sm font-medium text-slate-700 mb-1">Branch</label>
            <select
                name="storeId"
                value={filters.storeId}
                onChange={handleFilterChange}
                className="w-full sm:w-48 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
            >
                <option value="">Company Branch</option>
                {stores.map(store => (
                    <option key={store.id} value={store.id}>{store.name}</option>
                ))}
            </select>
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2 text-sm font-medium"
              disabled={loading}
            >
              {loading ? 'Loading...' : (
                <>
                  <Search size={16} />
                  Search
                </>
              )}
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors flex items-center gap-2 text-sm font-medium border border-slate-200"
            >
              <RotateCcw size={16} />
              Reset
            </button>
          </div>
        </form>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6 text-sm border border-red-100">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 whitespace-nowrap">Month Year</th>
                <th className="px-6 py-4 whitespace-nowrap text-right">Actual Sales</th>
                <th className="px-6 py-4 whitespace-nowrap text-right">Forecasted Sales</th>
                <th className="px-6 py-4 whitespace-nowrap text-right">Achieved %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                    <td colSpan="4" className="px-6 py-8 text-center text-slate-500">
                        Loading report data...
                    </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-8 text-center text-slate-500">
                    No data found for the selected period.
                  </td>
                </tr>
              ) : (
                data.map((item, index) => (
                  <tr key={index} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-3 font-medium text-slate-700 border-r border-slate-100">{item.monthYear}</td>
                    <td className="px-6 py-3 text-right text-slate-600 font-medium">AED {formatCurrency(item.actualSales)}</td>
                    <td className="px-6 py-3 text-right text-slate-600 font-medium">AED {formatCurrency(item.forecastedSales)}</td>
                    <td className="px-6 py-3 text-right text-slate-600 font-medium">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold
                            ${item.achievedPercentage >= 100 ? 'bg-emerald-100 text-emerald-700' :
                              item.achievedPercentage >= 80 ? 'bg-amber-100 text-amber-700' :
                              'bg-red-100 text-red-700'}`}>
                            {formatCurrency(item.achievedPercentage)}%
                        </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
             {data.length > 0 && (
                <tfoot className="bg-slate-50 font-semibold text-slate-700 border-t border-slate-200">
                    <tr>
                        <td className="px-6 py-4">Total</td>
                        <td className="px-6 py-4 text-right">
                             AED {formatCurrency(data.reduce((sum, item) => sum + (item.actualSales || 0), 0))}
                        </td>
                        <td className="px-6 py-4 text-right">
                             AED {formatCurrency(data.reduce((sum, item) => sum + (item.forecastedSales || 0), 0))}
                        </td>
                        <td className="px-6 py-4 text-right">
                           -
                        </td>
                    </tr>
                </tfoot>
             )}
          </table>
        </div>
      </div>
    </div>
  );
};

export default SalesForecastingReport;
