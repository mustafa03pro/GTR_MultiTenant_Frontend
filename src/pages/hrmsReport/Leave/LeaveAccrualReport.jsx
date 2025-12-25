import React, { useState, useEffect } from 'react';
import { Download, Loader, Calendar, Search, AlertCircle } from 'lucide-react';
import axios from 'axios';
import * as XLSX from 'xlsx';

const LeaveAccrualReport = () => {
    const [exporting, setExporting] = useState(false);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

    // Table state
    const [loading, setLoading] = useState(false);
    const [tableData, setTableData] = useState([]);
    const [filteredData, setFilteredData] = useState([]);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    const API_URL = import.meta.env.VITE_API_BASE_URL;

    useEffect(() => {
        if (selectedDate) {
            fetchReport();
        }
    }, [selectedDate]);

    useEffect(() => {
        if (!searchTerm) {
            setFilteredData(tableData);
        } else {
            const lowerTerm = searchTerm.toLowerCase();
            const filtered = tableData.filter(row =>
                (row.employeeCode && row.employeeCode.toLowerCase().includes(lowerTerm)) ||
                (row.employeeName && row.employeeName.toLowerCase().includes(lowerTerm)) ||
                (row.department && row.department.toLowerCase().includes(lowerTerm)) ||
                (row.leaveType && row.leaveType.toLowerCase().includes(lowerTerm))
            );
            setFilteredData(filtered);
        }
    }, [searchTerm, tableData]);

    const fetchReport = async () => {
        setLoading(true);
        setError('');
        setTableData([]);
        setFilteredData([]);

        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}/reports/leave/accrual`, {
                params: { asOfDate: selectedDate },
                headers: { "Authorization": `Bearer ${token}` }
            });

            console.log("Report Data:", response.data);
            setTableData(response.data);
            setFilteredData(response.data);
        } catch (err) {
            console.error("Failed to load report data:", err);
            setError('Could not load leave accrual data. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleExport = async () => {
        if (!selectedDate) {
            alert("Please select a date.");
            return;
        }

        setExporting(true);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}/reports/leave/accrual/export`, {
                params: { asOfDate: selectedDate },
                headers: { "Authorization": `Bearer ${token}` },
                responseType: 'blob',
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `LeaveAccrualReport_${selectedDate}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error("Export failed:", err);
            alert("Failed to export report. Please try again.");
        } finally {
            setExporting(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Leave Accrual Report</h2>
                    <p className="text-sm text-gray-500">View employee leave accruals, taken leaves, and balances.</p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <button
                        onClick={handleExport}
                        disabled={exporting || !selectedDate}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed text-sm"
                    >
                        {exporting ? <Loader className="animate-spin h-4 w-4" /> : <Download size={16} />}
                        <span>Export Excel</span>
                    </button>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row justify-between items-center gap-4 bg-gray-50 dark:bg-gray-900/50">
                    <h3 className="font-semibold text-gray-700 dark:text-gray-200">Accrual Details - {selectedDate}</h3>
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search employee, dept..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center p-12">
                        <Loader className="animate-spin h-8 w-8 text-purple-600 mb-4" />
                        <p className="text-gray-500">Loading details...</p>
                    </div>
                ) : error ? (
                    <div className="flex flex-col items-center justify-center p-12 text-center">
                        <AlertCircle className="h-12 w-12 text-red-500 mb-4 opacity-50" />
                        <p className="text-gray-800 dark:text-gray-200 font-medium mb-2">Error loading data</p>
                        <p className="text-gray-500 text-sm max-w-sm">{error}</p>
                        <button onClick={fetchReport} className="mt-4 text-purple-600 hover:underline">Try Again</button>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-gray-700 uppercase bg-gray-100 dark:bg-gray-700 dark:text-gray-400">
                                <tr>
                                    <th className="px-6 py-3 whitespace-nowrap">Employee Code</th>
                                    <th className="px-6 py-3 whitespace-nowrap">Employee Name</th>
                                    <th className="px-6 py-3 whitespace-nowrap">Department</th>
                                    <th className="px-6 py-3 whitespace-nowrap">Designation</th>
                                    <th className="px-6 py-3 whitespace-nowrap">Joining Date</th>
                                    <th className="px-6 py-3 whitespace-nowrap">Leave Type</th>
                                    <th className="px-6 py-3 whitespace-nowrap text-right">Accrued</th>
                                    <th className="px-6 py-3 whitespace-nowrap text-right">Taken</th>
                                    <th className="px-6 py-3 whitespace-nowrap text-right">Balance</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {filteredData.length > 0 ? (
                                    filteredData.map((row, index) => (
                                        <tr key={`${row.employeeCode}-${index}`} className="bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700/50">
                                            <td className="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-gray-300 font-medium">{row.employeeCode}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-gray-300">{row.employeeName}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-gray-500 dark:text-gray-400">{row.department}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-gray-500 dark:text-gray-400">{row.designation}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-gray-500 dark:text-gray-400">{row.joiningDate}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-gray-300">{row.leaveType}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-gray-900 dark:text-gray-300 font-medium">{row.accruedDays}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-red-600 dark:text-red-400">{row.takenDays}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-green-600 dark:text-green-400 font-bold">{row.balanceDays}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="9" className="px-6 py-8 text-center text-gray-500">
                                            {tableData.length === 0 ? "No records found for this date." : "No records match your search."}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
                <div className="p-2 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 text-xs text-center text-gray-400">
                    Showing {filteredData.length} records
                </div>
            </div>
        </div>
    );
};

export default LeaveAccrualReport;
