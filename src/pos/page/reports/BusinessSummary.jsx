import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Download, Printer, Filter, Calendar } from 'lucide-react';
import { Loader } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_BASE_URL;

const formatPrice = (value) => {
    if (value === undefined || value === null) return '0.00';
    return new Intl.NumberFormat('en-AE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
};

const BusinessSummary = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [dateRange, setDateRange] = useState({
        fromDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
        toDate: new Date().toISOString().split('T')[0]
    });

    const handleDateChange = (e) => {
        const { name, value } = e.target;
        setDateRange(prev => ({ ...prev, [name]: value }));
    };

    const fetchData = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}/pos/reports/business-summary`, {
                headers: { "Authorization": `Bearer ${token}` },
                params: {
                    fromDate: dateRange.fromDate,
                    toDate: dateRange.toDate
                }
            });
            setData(response.data);
        } catch (error) {
            console.error("Error fetching business summary:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}/pos/reports/business-summary/export`, {
                headers: { "Authorization": `Bearer ${token}` },
                params: {
                    fromDate: dateRange.fromDate,
                    toDate: dateRange.toDate
                },
                responseType: 'blob'
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Business_Summary_${dateRange.fromDate}_to_${dateRange.toDate}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error("Error downloading report:", error);
            alert("Failed to download report.");
        }
    };

    useEffect(() => {
        fetchData();
    }, [dateRange]); // Refetch when dates change

    return (
        <div className="space-y-6">
            {/* Header - Hidden in Print */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 print:hidden">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Business Summary</h1>
                    <p className="text-slate-500 text-sm">Period: {dateRange.fromDate} to {dateRange.toDate}</p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-2 bg-white p-1 rounded-lg border border-slate-200 shadow-sm">
                        <div className="relative">
                            <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="date"
                                name="fromDate"
                                value={dateRange.fromDate}
                                onChange={handleDateChange}
                                className="pl-9 pr-3 py-1.5 text-sm outline-none bg-transparent w-36 hover:bg-slate-50 rounded"
                            />
                        </div>
                        <span className="text-slate-400">-</span>
                        <div className="relative">
                            <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="date"
                                name="toDate"
                                value={dateRange.toDate}
                                onChange={handleDateChange}
                                className="pl-9 pr-3 py-1.5 text-sm outline-none bg-transparent w-36 hover:bg-slate-100 rounded"
                            />
                        </div>
                        <button onClick={fetchData} className="p-1.5 hover:bg-slate-100 rounded text-slate-500 hover:text-blue-600 transition-colors">
                            <Filter size={18} />
                        </button>
                    </div>
                    <button className="btn-secondary p-2.5" title="Print" onClick={() => window.print()}>
                        <Printer size={18} />
                    </button>
                    <button className="btn-primary p-2.5" title="Download" onClick={handleDownload}>
                        <Download size={18} />
                    </button>
                </div>
            </div>

            {/* Print Header - Visible Only in Print */}
            <div className="hidden print:block mb-8 border-b border-slate-900 pb-4">
                <div className="flex justify-between items-end">
                    <div className="text-3xl font-bold uppercase tracking-wider text-slate-900">Business Summary</div>
                    <div className="text-right">
                        <div className="text-sm text-slate-600">Generated On</div>
                        <div className="font-mono font-bold">{new Date().toLocaleString()}</div>
                    </div>
                </div>
                <div className="mt-4 flex gap-8 text-sm">
                    <div>
                        <span className="font-bold block text-xs uppercase text-slate-500">From Date</span>
                        <span className="font-mono text-lg">{dateRange.fromDate}</span>
                    </div>
                    <div>
                        <span className="font-bold block text-xs uppercase text-slate-500">To Date</span>
                        <span className="font-mono text-lg">{dateRange.toDate}</span>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <Loader className="animate-spin text-blue-600" size={32} />
                </div>
            ) : data ? (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 print:block print:columns-2 print:gap-6">
                    {/* Sales Table */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden print:break-inside-avoid print:mb-6">
                        <div className="bg-slate-50 px-6 py-3 border-b border-slate-200 flex justify-between items-center print:bg-slate-100 print:border-black">
                            <h2 className="font-bold text-slate-800">Sales</h2>
                        </div>
                        <div className="p-4 space-y-3">
                            <table className="w-full text-sm">
                                <tbody className="divide-y divide-slate-100">
                                    <SummaryRow label="Sales" value={data.salesSummary?.sales} />
                                    <SummaryRow label="Delivery Charge" value={data.salesSummary?.deliveryCharge} />
                                    <SummaryRow label="Paid Modifiers" value={data.salesSummary?.paidModifiers} />
                                    <SummaryRow label="Gross Sales" value={data.salesSummary?.grossSales} isTotal />
                                    <SummaryRow label="Discounts" value={data.salesSummary?.discounts} textRed />
                                    <SummaryRow label="Net Sales Including VAT" value={data.salesSummary?.netSalesIncludingVat} isHighlight />
                                    <SummaryRow label="VAT" value={data.salesSummary?.vat} />
                                    <SummaryRow label="Net Sales Excluding VAT" value={data.salesSummary?.netSalesExcludingVat} />
                                    <SummaryRow label="F&B Sales Minus VAT" value={data.salesSummary?.fnbSalesMinusVat} />
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Order Types */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden print:break-inside-avoid print:mb-6">
                        <div className="bg-slate-50 px-6 py-3 border-b border-slate-200 print:bg-slate-100 print:border-black">
                            <h2 className="font-bold text-slate-800">Order Types</h2>
                        </div>
                        <div className="p-0">
                            <table className="w-full text-sm">
                                <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-100">
                                    <tr>
                                        <th className="px-6 py-3 text-left">Order Types</th>
                                        <th className="px-6 py-3 text-right">Orders</th>
                                        <th className="px-6 py-3 text-right">Value</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {data.orderTypes?.map((item, index) => (
                                        <tr key={index} className={item.orderType === 'Total' ? 'bg-slate-50 font-bold' : ''}>
                                            <td className="px-6 py-3 text-slate-700">{item.orderType}</td>
                                            <td className="px-6 py-3 text-right text-slate-700">{item.ordersCount}</td>
                                            <td className="px-6 py-3 text-right text-slate-700">{formatPrice(item.value)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Guest Count */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="bg-white px-6 py-3 border-b border-slate-100">
                            <h2 className="font-bold text-slate-700">Guest Count</h2>
                        </div>
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-100">
                                <tr>
                                    <th className="px-6 py-3 text-left">Description</th>
                                    <th className="px-6 py-3 text-right">Count</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {data.guestCounts?.map((item, index) => (
                                    <tr key={index} className={item.description === 'Total' ? 'bg-slate-50 font-bold' : ''}>
                                        <td className="px-6 py-3 text-slate-700">{item.description}</td>
                                        <td className="px-6 py-3 text-right text-slate-700">{item.count}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Sales Source */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="bg-blue-900 px-6 py-3 border-b border-blue-800">
                            <h2 className="font-bold text-white">Sales Source</h2>
                        </div>
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-100">
                                <tr>
                                    <th className="px-6 py-3 text-left">Name</th>
                                    <th className="px-6 py-3 text-right">Qty</th>
                                    <th className="px-6 py-3 text-right">Amount</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {data.salesSources?.map((item, index) => (
                                    <tr key={index} className={item.salesSource === 'Total' ? 'bg-slate-50 font-bold' : ''}>
                                        <td className="px-6 py-3 text-slate-700">{item.salesSource}</td>
                                        <td className="px-6 py-3 text-right text-slate-700">{item.quantity}</td>
                                        <td className="px-6 py-3 text-right text-slate-700">{formatPrice(item.amount)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Cost and Profit */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="bg-blue-900 px-6 py-3 border-b border-blue-800">
                            <h2 className="font-bold text-white">Cost and Profit</h2>
                        </div>
                        <div className="p-0">
                            <table className="w-full text-sm">
                                <tbody className="divide-y divide-slate-100">
                                    <SummaryRow label="COGS" value={data.costProfit?.cogs} />
                                    <SummaryRow label="Wastage" value={data.costProfit?.wastage} />
                                    <SummaryRow label="Gross Profit" value={data.costProfit?.grossProfit} isTotal />
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Collections */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="bg-blue-900 px-6 py-3 border-b border-blue-800">
                            <h2 className="font-bold text-white">Collections</h2>
                        </div>
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-100">
                                <tr>
                                    <th className="px-6 py-3 text-left">Account</th>
                                    <th className="px-6 py-3 text-right">Qty</th>
                                    <th className="px-6 py-3 text-right">Amount</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {data.collections?.map((item, index) => (
                                    <tr key={index}>
                                        <td className="px-6 py-3 text-slate-700">{item.method}</td>
                                        <td className="px-6 py-3 text-right text-slate-700">{item.quantity}</td>
                                        <td className="px-6 py-3 text-right text-slate-700">{formatPrice(item.amount)}</td>
                                    </tr>
                                ))}
                                {/* Create manual Total row if needed, relying on backend for now if list doesn't have it */}
                            </tbody>
                        </table>
                    </div>

                    {/* Tax Report */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden md:col-span-2">
                        <div className="bg-blue-900 px-6 py-3 border-b border-blue-800">
                            <h2 className="font-bold text-white">Tax Report</h2>
                        </div>
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-100">
                                <tr>
                                    <th className="px-6 py-3 text-left">Rate</th>
                                    <th className="px-6 py-3 text-right">Total Sales Amount</th>
                                    <th className="px-6 py-3 text-right">Tax Amount</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {data.taxReports?.map((item, index) => (
                                    <tr key={index}>
                                        <td className="px-6 py-3 text-slate-700">{item.rateName}</td>
                                        <td className="px-6 py-3 text-right text-slate-700">{formatPrice(item.salesAmount)}</td>
                                        <td className="px-6 py-3 text-right text-slate-700">{formatPrice(item.taxAmount)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Staff Report */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden md:col-span-2">
                        <div className="bg-blue-900 px-6 py-3 border-b border-blue-800">
                            <h2 className="font-bold text-white">Staff Report</h2>
                        </div>
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-100">
                                <tr>
                                    <th className="px-6 py-3 text-left">Waiter</th>
                                    <th className="px-6 py-3 text-right">Qty</th>
                                    <th className="px-6 py-3 text-right">Amount</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {data.staffReports?.map((item, index) => (
                                    <tr key={index}>
                                        <td className="px-6 py-3 text-slate-700">{item.staffName}</td>
                                        <td className="px-6 py-3 text-right text-slate-700">{item.quantity}</td>
                                        <td className="px-6 py-3 text-right text-slate-700">{formatPrice(item.amount)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Category Report */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden md:col-span-2">
                        <div className="bg-blue-900 px-6 py-3 border-b border-blue-800">
                            <h2 className="font-bold text-white">Item Category Sales Report</h2>
                        </div>
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-100">
                                <tr>
                                    <th className="px-6 py-3 text-left">Category</th>
                                    <th className="px-6 py-3 text-right">Quantity</th>
                                    <th className="px-6 py-3 text-right">Amount</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {data.categoryReports?.map((item, index) => (
                                    <tr key={index}>
                                        <td className="px-6 py-3 text-slate-700">{item.categoryName}</td>
                                        <td className="px-6 py-3 text-right text-slate-700">{item.quantity}</td>
                                        <td className="px-6 py-3 text-right text-slate-700">{formatPrice(item.amount)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                </div>
            ) : (
                <div className="text-center p-12 text-slate-400">No data available</div>
            )}
        </div>
    );
};

const SummaryRow = ({ label, value, isTotal, textRed, isHighlight }) => (
    <tr className={`${isTotal ? 'border-t-2 border-slate-100' : ''} ${isHighlight ? 'bg-blue-50' : ''}`}>
        <td className={`px-6 py-3 text-slate-600 ${isTotal || isHighlight ? 'font-bold' : ''}`}>{label}</td>
        <td className={`px-6 py-3 text-right font-medium ${textRed ? 'text-red-500' : 'text-slate-800'} ${isHighlight ? 'text-blue-700' : ''}`}>
            {formatPrice(value)}
        </td>
    </tr>
);

export default BusinessSummary;
