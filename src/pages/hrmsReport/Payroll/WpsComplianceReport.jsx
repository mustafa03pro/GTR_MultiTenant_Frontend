import React, { useState, useEffect } from 'react';
import { Loader, AlertCircle, CheckCircle, XCircle, Clock, PieChart } from 'lucide-react';
import axios from 'axios';

const WpsComplianceReport = () => {
    const [loading, setLoading] = useState(false);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    const [reportData, setReportData] = useState(null);
    const [error, setError] = useState('');

    const API_URL = import.meta.env.VITE_API_BASE_URL;

    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 7 }, (_, i) => currentYear - 5 + i);

    const months = [
        { value: 1, label: 'January' },
        { value: 2, label: 'February' },
        { value: 3, label: 'March' },
        { value: 4, label: 'April' },
        { value: 5, label: 'May' },
        { value: 6, label: 'June' },
        { value: 7, label: 'July' },
        { value: 8, label: 'August' },
        { value: 9, label: 'September' },
        { value: 10, label: 'October' },
        { value: 11, label: 'November' },
        { value: 12, label: 'December' },
    ];

    useEffect(() => {
        handleGenerateReport();
    }, [selectedYear, selectedMonth]);

    const handleGenerateReport = async () => {
        setLoading(true);
        setError('');
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}/payroll/wps/compliance`, {
                params: { year: selectedYear, month: selectedMonth },
                headers: { "Authorization": `Bearer ${token}` }
            });
            setReportData(response.data);
        } catch (err) {
            console.error("Error generating compliance report:", err);
            setError('Failed to generate compliance report.');
        } finally {
            setLoading(false);
        }
    };

    const handleExportReport = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}/payroll/wps/compliance/export`, {
                params: { year: selectedYear, month: selectedMonth },
                headers: { "Authorization": `Bearer ${token}` },
                responseType: 'blob',
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `WPS-Compliance-${selectedMonth}-${selectedYear}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            console.error("Error exporting compliance report:", err);
            alert('Failed to export compliance report.');
        }
    };

    // Helper for status badge
    const getStatusBadge = (status) => {
        if (status === 'PAID') return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"><CheckCircle size={12} className="mr-1" /> Paid</span>;
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800"><XCircle size={12} className="mr-1" /> Unpaid</span>;
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">WPS Compliance Report</h2>
                    <p className="text-sm text-gray-500">Monitor salary payments and delay tracking for compliance.</p>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-4">
                <div className="flex gap-4 mb-6">
                    {/* Year Selector */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Year</label>
                        <select
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                            className="w-32 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            {years.map(year => (
                                <option key={year} value={year}>{year}</option>
                            ))}
                        </select>
                    </div>

                    {/* Month Selector */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Month</label>
                        <select
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                            className="w-40 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            {months.map(month => (
                                <option key={month.value} value={month.value}>{month.label}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center p-12">
                        <Loader className="animate-spin h-8 w-8 text-blue-600 mb-4" />
                        <p className="text-gray-500">Calculating compliance metrics...</p>
                    </div>
                ) : error ? (
                    <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg flex items-center gap-2">
                        <AlertCircle size={20} />
                        <span>{error}</span>
                    </div>
                ) : reportData && (
                    <div className="space-y-6">
                        {/* Stats Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-lg flex items-center gap-4">
                                <div className="p-3 bg-indigo-100 dark:bg-indigo-800 rounded-full text-indigo-600 dark:text-indigo-200">
                                    <PieChart size={24} />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Compliance Rate</p>
                                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{reportData.compliantPercentage}%</h3>
                                </div>
                            </div>

                            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg flex items-center gap-4">
                                <div className="p-3 bg-green-100 dark:bg-green-800 rounded-full text-green-600 dark:text-green-200">
                                    <CheckCircle size={24} />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Paid Employees</p>
                                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{reportData.paidEmployees}</h3>
                                </div>
                            </div>

                            <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg flex items-center gap-4">
                                <div className="p-3 bg-red-100 dark:bg-red-800 rounded-full text-red-600 dark:text-red-200">
                                    <XCircle size={24} />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Unpaid Employees</p>
                                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{reportData.unpaidEmployees}</h3>
                                </div>
                            </div>

                            <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg flex items-center gap-4">
                                <div className="p-3 bg-gray-200 dark:bg-gray-600 rounded-full text-gray-600 dark:text-gray-200">
                                    <Clock size={24} />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Total Employees</p>
                                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{reportData.totalEmployees}</h3>
                                </div>
                            </div>
                        </div>

                        {/* Details Table */}
                        <div className="overflow-x-auto border rounded-lg">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-gray-700 uppercase bg-gray-100 dark:bg-gray-700 dark:text-gray-400">
                                    <tr>
                                        <th className="px-6 py-3">Employee</th>
                                        <th className="px-6 py-3">Status</th>
                                        <th className="px-6 py-3">Pay Date</th>
                                        <th className="px-6 py-3">Delay (Days)</th>
                                        <th className="px-6 py-3">Remarks</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {reportData.details.map((row, index) => (
                                        <tr key={index} className="bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700/50">
                                            <td className="px-6 py-4 font-medium text-gray-900 dark:text-gray-300">
                                                <div>{row.employeeName}</div>
                                                <div className="text-xs text-gray-500">{row.employeeCode}</div>
                                            </td>
                                            <td className="px-6 py-4">{getStatusBadge(row.status)}</td>
                                            <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{row.payDate || '-'}</td>
                                            <td className={`px-6 py-4 font-medium ${row.delayDays > 0 ? 'text-red-600' : 'text-gray-500'}`}>
                                                {row.delayDays}
                                            </td>
                                            <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{row.remarks}</td>
                                        </tr>
                                    ))}
                                    {reportData.details.length === 0 && (
                                        <tr>
                                            <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                                                No employee records found.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default WpsComplianceReport;
