import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Calendar, Loader, Printer, Info } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_BASE_URL;

const formatCurrency = (value) => {
    if (value === undefined || value === null) return '0.00';
    return new Intl.NumberFormat('en-AE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
};

const ClosingReport = () => {
    const [dateRange, setDateRange] = useState({
        fromDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
        toDate: new Date().toISOString().split('T')[0]
    });
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchReports = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}/pos/reports/closing-reports`, {
                headers: { "Authorization": `Bearer ${token}` },
                params: {
                    fromDate: dateRange.fromDate,
                    toDate: dateRange.toDate
                }
            });
            setReports(response.data);
        } catch (error) {
            console.error("Error fetching closing reports:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReports();
    }, []);

    const handleDateRangeChange = (e) => {
        const { name, value } = e.target;
        setDateRange(prev => ({ ...prev, [name]: value }));
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="space-y-6">
            {/* Header - Hidden in Print */}
            <div className="flex flex-col gap-4 mb-6 print:hidden">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">
                            Closing Report
                        </h1>
                        <p className="text-slate-500 text-sm mt-1">
                            View cash register closing details and discrepancies
                        </p>
                    </div>
                </div>

                {/* Controls */}
                <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-4 flex-wrap">
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
                            onClick={fetchReports}
                            className="px-4 py-1.5 bg-blue-900 text-white text-sm font-medium rounded-lg hover:bg-blue-800 transition-colors shadow-sm"
                        >
                            Search
                        </button>
                    </div>

                    <div className="flex gap-2">
                        <button className="btn-secondary p-2.5" title="Print" onClick={handlePrint}>
                            <Printer size={18} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Print Header */}
            <div className="hidden print:block p-4 border-b border-black mb-4">
                <h2 className="text-xl font-bold">Closing Report</h2>
                <p>From {dateRange.fromDate} to {dateRange.toDate}</p>
            </div>

            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <Loader className="animate-spin text-blue-600" size={32} />
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden print:shadow-none print:border-none">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-blue-900 text-white border-b border-blue-800 print:bg-slate-100 print:text-black print:border-black">
                                <tr>
                                    <th className="px-6 py-3 text-left font-medium min-w-[60px]">ID</th>
                                    <th className="px-6 py-3 text-left font-medium min-w-[120px]">Opening Date</th>
                                    <th className="px-6 py-3 text-right font-medium min-w-[100px]">Opening Float</th>
                                    <th className="px-6 py-3 text-left font-medium min-w-[100px]">Running Date</th>
                                    <th className="px-6 py-3 text-left font-medium min-w-[120px]">Closing Date</th>
                                    <th className="px-6 py-3 text-right font-medium min-w-[100px]">Expected Cash</th>
                                    <th className="px-6 py-3 text-right font-medium min-w-[100px]">Counted Cash</th>
                                    <th className="px-6 py-3 text-right font-medium min-w-[100px]">Difference</th>
                                    <th className="px-6 py-3 text-left font-medium min-w-[150px]">Notes</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {reports.length > 0 ? (
                                    reports.map((report, index) => (
                                        <tr key={index} className="hover:bg-slate-50">
                                            <td className="px-6 py-3 text-slate-700">{report.id}</td>
                                            <td className="px-6 py-3 text-slate-700 whitespace-nowrap">
                                                {report.openingDate ? new Date(report.openingDate).toLocaleString() : '-'}
                                            </td>
                                            <td className="px-6 py-3 text-right text-slate-700 font-medium">
                                                {formatCurrency(report.openingFloat)}
                                            </td>
                                            <td className="px-6 py-3 text-slate-700">
                                                {report.runningDate}
                                            </td>
                                            <td className="px-6 py-3 text-slate-700 whitespace-nowrap">
                                                {report.closingDate ? new Date(report.closingDate).toLocaleString() : '-'}
                                            </td>
                                            <td className="px-6 py-3 text-right text-slate-700">
                                                {formatCurrency(report.expectedCashAmount)}
                                            </td>
                                            <td className="px-6 py-3 text-right text-slate-700">
                                                {formatCurrency(report.countedCashAmount)}
                                            </td>
                                            <td className={`px-6 py-3 text-right font-medium ${report.closedCashDifference < 0 ? 'text-red-600' :
                                                    report.closedCashDifference > 0 ? 'text-green-600' : 'text-slate-700'
                                                }`}>
                                                {formatCurrency(report.closedCashDifference)}
                                            </td>
                                            <td className="px-6 py-3 text-slate-500 italic max-w-xs truncate" title={report.notes}>
                                                {report.notes || '-'}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="9" className="px-6 py-12 text-center text-slate-400">
                                            <div className="flex flex-col items-center gap-2">
                                                <Info size={24} className="text-slate-300" />
                                                <p>No closing reports found for the selected period.</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ClosingReport;
