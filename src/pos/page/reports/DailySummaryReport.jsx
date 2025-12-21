import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Calendar, Filter, Loader, Printer } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_BASE_URL;

const formatPrice = (value) => {
    if (value === undefined || value === null) return '0.00';
    return new Intl.NumberFormat('en-AE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
};

const DailySummaryReport = () => {
    const [activeTab, setActiveTab] = useState('cash');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

    // Hourly Report State
    const [dateRange, setDateRange] = useState({
        fromDate: new Date(new Date().setDate(new Date().getDate() - 7)).toISOString().split('T')[0],
        toDate: new Date().toISOString().split('T')[0]
    });
    const [hourlyData, setHourlyData] = useState(null);

    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);

    const fetchDailyData = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}/pos/reports/daily-sales`, {
                headers: { "Authorization": `Bearer ${token}` },
                params: { date }
            });
            setData(response.data);
        } catch (error) {
            console.error("Error fetching daily sales summary:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchHourlyData = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}/pos/reports/sales-by-hour`, {
                headers: { "Authorization": `Bearer ${token}` },
                params: {
                    fromDate: dateRange.fromDate,
                    toDate: dateRange.toDate
                }
            });
            setHourlyData(response.data);
        } catch (error) {
            console.error("Error fetching hourly sales:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'hourly') {
            fetchHourlyData();
        } else {
            fetchDailyData();
        }
    }, [date, activeTab]); // Dependencies trigger fetch

    const handleDateRangeChange = (e) => {
        const { name, value } = e.target;
        setDateRange(prev => ({ ...prev, [name]: value }));
    }; const handlePrint = () => {
        window.print();
    };

    const tabs = [
        { id: 'cash', label: 'Cash Report' },
        { id: 'tax', label: 'Tax Report' },
        { id: 'pos', label: 'POS Report' },
        { id: 'cancelled', label: 'Cancellation Report' },
        { id: 'hourly', label: 'Sales By Hour' },
    ];

    return (
        <div className="space-y-6">
            {/* Header - Hidden in Print */}
            <div className="flex flex-col gap-4 mb-6 print:hidden">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">
                            Daily Sales Report
                        </h1>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-slate-200 overflow-x-auto">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            className={`px-4 py-2 font-medium text-sm transition-colors border-b-2 whitespace-nowrap ${activeTab === tab.id
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-slate-500 hover:text-slate-700'
                                }`}
                            onClick={() => setActiveTab(tab.id)}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Controls */}
                <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200">
                    {activeTab !== 'hourly' ? (
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-slate-700">Date:</span>
                            <div className="relative">
                                <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="date"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    className="pl-9 pr-3 py-1.5 text-sm outline-none bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors"
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-slate-700">From:</span>
                                <div className="relative">
                                    <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type="date"
                                        name="fromDate"
                                        value={dateRange.fromDate}
                                        onChange={handleDateRangeChange}
                                        className="pl-9 pr-3 py-1.5 text-sm outline-none bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors"
                                    />
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-slate-700">To:</span>
                                <div className="relative">
                                    <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type="date"
                                        name="toDate"
                                        value={dateRange.toDate}
                                        onChange={handleDateRangeChange}
                                        className="pl-9 pr-3 py-1.5 text-sm outline-none bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors"
                                    />
                                </div>
                            </div>
                            <button
                                onClick={fetchHourlyData}
                                className="px-4 py-1.5 bg-blue-900 text-white text-sm font-medium rounded-lg hover:bg-blue-800 transition-colors"
                            >
                                Show
                            </button>
                        </div>
                    )}

                    <div className="flex gap-2">
                        <button className="btn-secondary p-2.5" title="Print" onClick={handlePrint}>
                            <Printer size={18} />
                        </button>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <Loader className="animate-spin text-blue-600" size={32} />
                </div>
            ) : (
                <div className="space-y-8 print:space-y-6">
                    {/* Cash Report Section */}
                    {activeTab === 'cash' && data && (
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden print:shadow-none print:border-none">
                            <div className="p-6 border-b border-slate-200 print:px-0">
                                <h2 className="text-xl font-bold text-slate-800">Cash Report - {data.storeName}</h2>
                                <div className="flex justify-between text-sm text-slate-500 mt-1">
                                    <span>Date: {data.date}</span>
                                    <span>Time: {data.time}</span>
                                </div>
                            </div>

                            <div className="p-0">
                                <div className="bg-yellow-50 px-6 py-2 border-y border-slate-100 font-semibold text-slate-700 text-sm print:px-0">
                                    Sales
                                </div>
                                <table className="w-full text-sm">
                                    <thead className="text-slate-500 border-b border-slate-100">
                                        <tr>
                                            <th className="px-6 py-2 text-left font-medium print:px-0">Description</th>
                                            <th className="px-6 py-2 text-left font-medium w-32">Qty</th>
                                            <th className="px-6 py-2 text-right font-medium w-40 print:px-0">Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        <SummaryRow label="Sales" qty={data.cashReport?.sales?.subTotalQty} value={data.cashReport?.sales?.subTotalAmount} />
                                        <SummaryRow label="Sub-Total" value={data.cashReport?.sales?.subTotalAmount} />
                                        <SummaryRow label="Discount" value={data.cashReport?.sales?.discount} />
                                        <SummaryRow label="Shipping Charge" value={data.cashReport?.sales?.shippingCharge} />
                                        <SummaryRow label="VAT" value={data.cashReport?.sales?.vat} />
                                        <SummaryRow label="Bill Amount" value={data.cashReport?.sales?.billAmount} isTotal />
                                    </tbody>
                                </table>

                                {/* Collection Section */}
                                <div className="bg-yellow-50 px-6 py-2 border-y border-slate-100 font-semibold text-slate-700 text-sm mt-4 print:px-0">
                                    Collection
                                </div>
                                <table className="w-full text-sm">
                                    <tbody className="divide-y divide-slate-50">
                                        <SummaryRow label="Net Collection" value={data.cashReport?.collection?.netCollection} />
                                        <SummaryRow label="Tip Amount" value={data.cashReport?.collection?.tipAmount} />
                                        <SummaryRow label="On Account" value={data.cashReport?.collection?.onAccount} />
                                    </tbody>
                                </table>

                                {/* Others Section */}
                                <div className="bg-yellow-50 px-6 py-2 border-y border-slate-100 font-semibold text-slate-700 text-sm mt-4 print:px-0">
                                    Others
                                </div>
                                <table className="w-full text-sm">
                                    <tbody className="divide-y divide-slate-50">
                                        <SummaryRow label="VAT" qty={data.cashReport?.others?.vatQty} value={data.cashReport?.others?.vatAmount} />
                                        <SummaryRow label="Delivery Charges" qty={data.cashReport?.others?.deliveryChargesQty} value={data.cashReport?.others?.deliveryChargesAmount} />
                                        <SummaryRow label="Total" value={data.cashReport?.others?.total} isTotal />
                                    </tbody>
                                </table>

                                {/* Discount Details Section */}
                                <div className="bg-yellow-50 px-6 py-2 border-y border-slate-100 font-semibold text-slate-700 text-sm mt-4 print:px-0">
                                    Discount Details
                                </div>
                                <table className="w-full text-sm mb-4">
                                    <tbody className="divide-y divide-slate-50">
                                        <SummaryRow label="Total" value={data.cashReport?.discountDetails?.total} />
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}


                    {/* Tax Report Section */}
                    {activeTab === 'tax' && data && (
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden print:shadow-none print:border-none print:break-inside-avoid">
                            <div className="p-6 border-b border-slate-200 print:px-0">
                                <h2 className="text-xl font-bold text-blue-900">Tax Report</h2>
                                <div className="flex justify-between text-sm text-slate-500 mt-1">
                                    <span>Date: {data.date}</span>
                                    <span>Time: {data.time}</span>
                                </div>
                            </div>
                            <table className="w-full text-sm">
                                <thead className="bg-slate-50 border-b border-slate-100 text-slate-500">
                                    <tr>
                                        <th className="px-6 py-3 text-left font-medium print:px-0">Rate</th>
                                        <th className="px-6 py-3 text-left font-medium">Total Amount</th>
                                        <th className="px-6 py-3 text-right font-medium print:px-0">Tax Amount</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {data.taxReports?.map((item, index) => (
                                        <tr key={index}>
                                            <td className="px-6 py-3 text-slate-700 print:px-0">{item.rate}</td>
                                            <td className="px-6 py-3 text-slate-700">{formatPrice(item.totalSalesAmount)}</td>
                                            <td className="px-6 py-3 text-right text-slate-700 print:px-0">{formatPrice(item.taxAmount)}</td>
                                        </tr>
                                    ))}
                                    <tr className="font-bold bg-slate-50 border-t border-slate-200">
                                        <td className="px-6 py-3 print:px-0">Total:</td>
                                        <td className="px-6 py-3"></td>
                                        <td className="px-6 py-3 text-right print:px-0">
                                            {formatPrice(data.taxReports?.reduce((sum, item) => sum + (item.taxAmount || 0), 0))}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* POS Report Section */}
                    {activeTab === 'pos' && data && (
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden print:shadow-none print:border-none print:break-inside-avoid">
                            <div className="p-6 border-b border-slate-200 print:px-0">
                                <h2 className="text-xl font-bold text-blue-900">POS Report</h2>
                                <div className="flex justify-between text-sm text-slate-500 mt-1">
                                    <span>Date: {data.date}</span>
                                    <span>Time: {data.time}</span>
                                </div>
                            </div>
                            <table className="w-full text-sm">
                                <thead className="bg-slate-50 border-b border-slate-100 text-slate-500">
                                    <tr>
                                        <th className="px-6 py-3 text-left font-medium print:px-0">Gross Sales</th>
                                        <th className="px-6 py-3 text-center font-medium">Deduction</th>
                                        <th className="px-6 py-3 text-right font-medium print:px-0">Net Sale</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    <tr>
                                        <td className="px-6 py-3 text-slate-700 print:px-0">{formatPrice(data.posReport?.grossSales)}</td>
                                        <td className="px-6 py-3 text-center text-slate-700 bg-slate-50">{formatPrice(data.posReport?.deduction)}</td>
                                        <td className="px-6 py-3 text-right text-slate-700 print:px-0">{formatPrice(data.posReport?.netSale)}</td>
                                    </tr>
                                    <tr className="font-bold bg-slate-50 border-t border-slate-200">
                                        <td className="px-6 py-3 print:px-0">Total</td>
                                        <td className="px-6 py-3 text-center">{formatPrice(data.posReport?.deduction)}</td>
                                        <td className="px-6 py-3 text-right print:px-0">{formatPrice(data.posReport?.total)}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Cancellation Report Section */}
                    {activeTab === 'cancelled' && data && (
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden print:shadow-none print:border-none print:break-inside-avoid">
                            <div className="p-6 border-b border-slate-200 print:px-0">
                                <h2 className="text-xl font-bold text-blue-900">Cancellation Report</h2>
                                <div className="flex justify-between text-sm text-slate-500 mt-1">
                                    <span>Date: {data.date}</span>
                                    <span>Time: {data.time}</span>
                                </div>
                            </div>
                            {data.cancellationReports && data.cancellationReports.length > 0 ? (
                                <table className="w-full text-sm">
                                    <thead className="bg-slate-50 border-b border-slate-100 text-slate-500">
                                        <tr>
                                            <th className="px-6 py-3 text-left font-medium print:px-0">Code</th>
                                            <th className="px-6 py-3 text-left font-medium">Name</th>
                                            <th className="px-6 py-3 text-left font-medium">Quantity</th>
                                            <th className="px-6 py-3 text-right font-medium print:px-0">Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {data.cancellationReports.map((item, index) => (
                                            <tr key={index}>
                                                <td className="px-6 py-3 text-slate-700 print:px-0">{item.code}</td>
                                                <td className="px-6 py-3 text-slate-700">{item.name}</td>
                                                <td className="px-6 py-3 text-slate-700">{item.quantity}</td>
                                                <td className="px-6 py-3 text-right text-slate-700 print:px-0">{formatPrice(item.amount)}</td>
                                            </tr>
                                        ))}
                                        <tr className="font-bold bg-slate-50 border-t border-slate-200">
                                            <td colSpan="3" className="px-6 py-3 text-right print:px-0">Total:</td>
                                            <td className="px-6 py-3 text-right print:px-0">
                                                {formatPrice(data.cancellationReports.reduce((sum, item) => sum + (item.amount || 0), 0))}
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            ) : (
                                <div className="p-6 text-center text-slate-400 italic">No cancellations found for this date.</div>
                            )}
                        </div>
                    )}

                    {/* Sales By Hour Report */}
                    {activeTab === 'hourly' && hourlyData && (
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden print:shadow-none print:border-none">
                            <div className="bg-blue-900 p-4 border-b border-blue-800 print:hidden">
                                <h2 className="text-white font-medium">
                                    Sales by Hour from {dateRange.fromDate} to {dateRange.toDate}
                                </h2>
                            </div>
                            {/* Print-only header for this specific table */}
                            <div className="hidden print:block p-4 border-b border-black">
                                <h2 className="text-xl font-bold">Sales by Hour</h2>
                                <p>From {dateRange.fromDate} to {dateRange.toDate}</p>
                            </div>

                            <table className="w-full text-sm">
                                <thead className="bg-blue-900 text-white border-b border-blue-800 print:bg-slate-100 print:text-black print:border-black">
                                    <tr>
                                        <th className="px-6 py-3 text-left font-medium">Hour</th>
                                        <th className="px-6 py-3 text-center font-medium">Quantity</th>
                                        <th className="px-6 py-3 text-center font-medium">Sales Count</th>
                                        <th className="px-6 py-3 text-right font-medium">Amount</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {hourlyData.map((item, index) => (
                                        <tr key={index} className="hover:bg-slate-50">
                                            <td className="px-6 py-3 text-slate-700 font-medium">{item.hour}</td>
                                            <td className="px-6 py-3 text-center text-slate-700">{item.quantity}</td>
                                            <td className="px-6 py-3 text-center text-slate-700">{item.salesCount}</td>
                                            <td className="px-6 py-3 text-right text-slate-700">{formatPrice(item.amount)}</td>
                                        </tr>
                                    ))}
                                    {hourlyData.length === 0 && (
                                        <tr>
                                            <td colSpan="4" className="px-6 py-8 text-center text-slate-400 italic">
                                                No sales data found for this period.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {!loading && ((activeTab !== 'hourly' && !data) || (activeTab === 'hourly' && !hourlyData)) && (
                        <div className="text-center p-12 text-slate-400">No data available</div>
                    )}
                </div>
            )}
        </div>
    );
};

const SummaryRow = ({ label, qty, value, isTotal }) => (
    <tr className={isTotal ? 'bg-slate-50 font-bold' : ''}>
        <td className={`px-6 py-2 text-slate-700 print:px-0 ${isTotal ? 'font-bold' : ''}`}>{label}</td>
        <td className="px-6 py-2 text-slate-700">{qty !== undefined && qty !== null ? qty : ''}</td>
        <td className="px-6 py-2 text-right text-slate-700 print:px-0">{formatPrice(value)}</td>
    </tr>
);

export default DailySummaryReport;
