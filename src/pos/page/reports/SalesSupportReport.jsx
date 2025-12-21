import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Download, Printer, Filter, Calendar, Search } from 'lucide-react';
import { Loader } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_BASE_URL;

const formatPrice = (value) => {
    if (value === undefined || value === null) return '0.00';
    return new Intl.NumberFormat('en-AE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
};

const SalesSupportReport = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [stores, setStores] = useState([]);
    
    // Filters
    const [dateRange, setDateRange] = useState({
        fromDate: new Date().toISOString().split('T')[0],
        toDate: new Date().toISOString().split('T')[0]
    });
    const [selectedStore, setSelectedStore] = useState('');
    const [refFilter, setRefFilter] = useState('');

    useEffect(() => {
        fetchStores();
    }, []);

    const fetchStores = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}/pos/stores`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            setStores(response.data);
            // Optional: Default to first store if available, or keep empty for "All"
            // if (response.data.length > 0) setSelectedStore(response.data[0].id);
        } catch (error) {
            console.error("Error fetching stores:", error);
        }
    };

    const handleDateChange = (e) => {
        const { name, value } = e.target;
        setDateRange(prev => ({ ...prev, [name]: value }));
    };

    const fetchData = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const params = {
                fromDate: dateRange.fromDate,
                toDate: dateRange.toDate
            };
            if (selectedStore) {
                params.storeId = selectedStore;
            }

            const response = await axios.get(`${API_URL}/pos/reports/sales-support-report`, {
                headers: { "Authorization": `Bearer ${token}` },
                params: params
            });
            setData(response.data);
        } catch (error) {
            console.error("Error fetching sales support report:", error);
        } finally {
            setLoading(false);
        }
    };

    // Derived state for filtered data (Client-side filtering for Ref #)
    const filteredData = data.filter(item => {
        if (!refFilter) return true;
        return item.ref?.toLowerCase().includes(refFilter.toLowerCase());
    });

    // Calculate Totals
    const totals = filteredData.reduce((acc, item) => {
        acc.subTotal += item.subTotal || 0;
        acc.discount += item.discount || 0;
        acc.vat += item.vat || 0;
        acc.shippingCharge += item.shippingCharge || 0;
        acc.orderTotal += item.orderTotal || 0;
        acc.customerPaidAmount += item.customerPaidAmount || 0;
        acc.returnedAmount += item.returnedAmount || 0;
        return acc;
    }, {
        subTotal: 0,
        discount: 0,
        vat: 0,
        shippingCharge: 0,
        orderTotal: 0,
        customerPaidAmount: 0,
        returnedAmount: 0
    });

    const handleExport = () => {
        // Simple CSV Export
        const headers = ["Ref", "Order Type", "Customer", "Order Taken By", "Order Date", "Order Time", "Sales Source", "Sales Source Reference", "Sub Total", "Discount", "VAT", "Shipping Charge", "Order Total", "Customer Paid Amount", "Returned Amount", "Payment Method", "Bill Received By"];
        
        const csvContent = [
            headers.join(","),
            ...filteredData.map(item => [
                item.ref,
                item.orderType,
                item.customer,
                item.orderTakenBy,
                item.orderDate,
                item.orderTime,
                item.salesSource,
                item.salesSourceReference,
                item.subTotal,
                item.discount,
                item.vat,
                item.shippingCharge,
                item.orderTotal,
                item.customerPaidAmount,
                item.returnedAmount,
                `"${item.paymentMethod}"`, // Quote to handle commas
                item.billReceivedBy
            ].join(","))
        ].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `Sales_Support_Report_${dateRange.fromDate}_to_${dateRange.toDate}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-slate-800 print:hidden">Sales Support Report</h1>

            {/* Filter Section */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 print:hidden space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Ref # Filter */}
                    <div className="space-y-1">
                         <label className="text-sm font-medium text-slate-700">Ref #</label>
                        <div className="relative">
                            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search Ref..."
                                value={refFilter}
                                onChange={(e) => setRefFilter(e.target.value)}
                                className="pl-10 w-full input"
                            />
                        </div>
                    </div>

                    {/* Company (Static for now) */}
                    <div className="space-y-1">
                        <label className="text-sm font-medium text-slate-700">Company</label>
                        <select className="w-full input bg-slate-50" disabled>
                            <option>Current Company</option>
                        </select>
                    </div>

                    {/* Company Branch (Store) */}
                    <div className="space-y-1">
                        <label className="text-sm font-medium text-slate-700">Company Branch</label>
                        <select
                            value={selectedStore}
                            onChange={(e) => setSelectedStore(e.target.value)}
                            className="w-full input"
                        >
                            <option value="">All Branches</option>
                            {stores.map(store => (
                                <option key={store.id} value={store.id}>{store.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Date Range */}
                    <div className="space-y-1 col-span-1 md:col-span-2 lg:col-span-1">
                        <label className="text-sm font-medium text-slate-700">Date Range</label>
                        <div className="flex items-center gap-2">
                            <input
                                type="date"
                                name="fromDate"
                                value={dateRange.fromDate}
                                onChange={handleDateChange}
                                className="input w-full"
                            />
                            <span className="text-slate-400">to</span>
                            <input
                                type="date"
                                name="toDate"
                                value={dateRange.toDate}
                                onChange={handleDateChange}
                                className="input w-full"
                            />
                        </div>
                    </div>
                </div>

                <div className="flex justify-end pt-2">
                    <button
                        onClick={fetchData}
                        className="btn-primary flex items-center gap-2"
                        disabled={loading}
                    >
                        {loading ? <Loader size={18} className="animate-spin" /> : <Filter size={18} />}
                        Show Record
                    </button>
                </div>
            </div>

            {/* Actions */}
            <div className="flex justify-between items-center print:hidden">
                 <h2 className="text-lg font-semibold text-slate-700">
                    Sales Report from {dateRange.fromDate} to {dateRange.toDate}
                 </h2>
                <div className="flex gap-2">
                    <button onClick={() => window.print()} className="btn-secondary p-2" title="Print">
                        <Printer size={20} />
                    </button>
                    <button onClick={handleExport} className="btn-primary p-2" title="Export CSV">
                        <Download size={20} />
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-[#1e3a8a] text-white font-medium">
                            <tr>
                                <th className="px-4 py-3 whitespace-nowrap">#</th>
                                <th className="px-4 py-3 whitespace-nowrap">Ref</th>
                                <th className="px-4 py-3 whitespace-nowrap">Order Type</th>
                                <th className="px-4 py-3 whitespace-nowrap">Customer</th>
                                <th className="px-4 py-3 whitespace-nowrap">Order Taken By</th>
                                <th className="px-4 py-3 whitespace-nowrap">Order Date</th>
                                <th className="px-4 py-3 whitespace-nowrap">Order Time</th>
                                <th className="px-4 py-3 whitespace-nowrap">Sales Source</th>
                                <th className="px-4 py-3 whitespace-nowrap">Sales Source Ref</th>
                                <th className="px-4 py-3 whitespace-nowrap text-right">Sub Total</th>
                                <th className="px-4 py-3 whitespace-nowrap text-right">Discount</th>
                                <th className="px-4 py-3 whitespace-nowrap text-right">VAT</th>
                                <th className="px-4 py-3 whitespace-nowrap text-right">Shipping Charge</th>
                                <th className="px-4 py-3 whitespace-nowrap text-right">Order Total</th>
                                <th className="px-4 py-3 whitespace-nowrap text-right">Paid Amount</th>
                                <th className="px-4 py-3 whitespace-nowrap text-right">Returned Amount</th>
                                <th className="px-4 py-3 whitespace-nowrap">Payment Method</th>
                                <th className="px-4 py-3 whitespace-nowrap">Bill Received By</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan="18" className="p-8 text-center text-slate-500">
                                        <Loader className="animate-spin h-6 w-6 mx-auto mb-2" />
                                        Loading data...
                                    </td>
                                </tr>
                            ) : filteredData.length === 0 ? (
                                <tr>
                                    <td colSpan="18" className="p-8 text-center text-slate-500">
                                        No records found.
                                    </td>
                                </tr>
                            ) : (
                                <>
                                    {filteredData.map((item, index) => (
                                        <tr key={index} className="hover:bg-slate-50">
                                            <td className="px-4 py-3">{index + 1}</td>
                                            <td className="px-4 py-3 font-medium text-slate-700">{item.ref}</td>
                                            <td className="px-4 py-3">{item.orderType}</td>
                                            <td className="px-4 py-3">{item.customer}</td>
                                            <td className="px-4 py-3">{item.orderTakenBy}</td>
                                            <td className="px-4 py-3">{item.orderDate}</td>
                                            <td className="px-4 py-3">{item.orderTime}</td>
                                            <td className="px-4 py-3">{item.salesSource}</td>
                                            <td className="px-4 py-3">{item.salesSourceReference}</td>
                                            <td className="px-4 py-3 text-right">{formatPrice(item.subTotal)}</td>
                                            <td className="px-4 py-3 text-right">{formatPrice(item.discount)}</td>
                                            <td className="px-4 py-3 text-right">{formatPrice(item.vat)}</td>
                                            <td className="px-4 py-3 text-right">{formatPrice(item.shippingCharge)}</td>
                                            <td className="px-4 py-3 text-right font-medium">{formatPrice(item.orderTotal)}</td>
                                            <td className="px-4 py-3 text-right text-green-600">{formatPrice(item.customerPaidAmount)}</td>
                                            <td className="px-4 py-3 text-right text-red-500">{formatPrice(item.returnedAmount)}</td>
                                            <td className="px-4 py-3">{item.paymentMethod}</td>
                                            <td className="px-4 py-3">{item.billReceivedBy}</td>
                                        </tr>
                                    ))}
                                    {/* Total Row */}
                                    <tr className="bg-slate-100 font-bold">
                                        <td className="px-4 py-3" colSpan="9">Total</td>
                                        <td className="px-4 py-3 text-right">{formatPrice(totals.subTotal)}</td>
                                        <td className="px-4 py-3 text-right">{formatPrice(totals.discount)}</td>
                                        <td className="px-4 py-3 text-right">{formatPrice(totals.vat)}</td>
                                        <td className="px-4 py-3 text-right">{formatPrice(totals.shippingCharge)}</td>
                                        <td className="px-4 py-3 text-right">{formatPrice(totals.orderTotal)}</td>
                                        <td className="px-4 py-3 text-right">{formatPrice(totals.customerPaidAmount)}</td>
                                        <td className="px-4 py-3 text-right">{formatPrice(totals.returnedAmount)}</td>
                                        <td className="px-4 py-3" colSpan="2"></td>
                                    </tr>
                                </>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default SalesSupportReport;
