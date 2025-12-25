import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Loader, UserMinus, ChevronDown, ChevronUp, AlertCircle, Download } from 'lucide-react';

const TerminationReasonReport = () => {
    const [loading, setLoading] = useState(false);
    const [reportData, setReportData] = useState([]);
    const [error, setError] = useState('');
    const [expandedRows, setExpandedRows] = useState({});

    const API_URL = import.meta.env.VITE_API_BASE_URL;

    useEffect(() => {
        fetchReport();
    }, []);

    const fetchReport = async () => {
        setLoading(true);
        setError('');
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}/reports/eos/termination-reason`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            console.log("Termination Reason Report Data:", response.data);
            setReportData(response.data);
        } catch (err) {
            console.error("Error fetching Termination Reason report:", err);
            setError('Failed to load termination reason report.');
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadExcel = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}/reports/eos/termination-reason/export`, {
                headers: { "Authorization": `Bearer ${token}` },
                responseType: 'blob',
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'Termination-Reason-Report.xlsx');
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            console.error("Error exporting Termination Reason report:", err);
            alert("Failed to export Termination Reason report.");
        }
    };

    const toggleRow = (reason) => {
        setExpandedRows(prev => ({
            ...prev,
            [reason]: !prev[reason]
        }));
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Summary Cards could go here if we calculated totals */}
                {/* e.g. Total Exits */}
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex justify-between items-center">
                    <div>
                        <h3 className="font-semibold text-gray-700 dark:text-gray-200">Exits by Reason</h3>
                        <p className="text-xs text-slate-500">Breakdown of employee exits grouped by termination reason</p>
                    </div>
                    <button onClick={handleDownloadExcel} className="btn-secondary flex items-center gap-2 text-sm bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 px-3 py-2 rounded-lg transition-colors">
                        <Download size={16} /> Export
                    </button>
                </div>

                {loading ? (
                    <div className="flex justify-center items-center py-20">
                        <Loader className="animate-spin text-blue-600 h-8 w-8" />
                    </div>
                ) : error ? (
                    <div className="p-6 text-center text-red-600 bg-red-50 dark:bg-red-900/20">
                        <p>{error}</p>
                        <button onClick={fetchReport} className="text-sm underline hover:text-red-800 mt-2">Retry</button>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-200 dark:divide-gray-700">
                        {reportData.length > 0 ? (
                            reportData.map((group) => (
                                <div key={group.reason} className="bg-white dark:bg-slate-800">
                                    <div
                                        className="px-6 py-4 flex justify-between items-center cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors"
                                        onClick={() => toggleRow(group.reason)}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg text-red-600 dark:text-red-400">
                                                <UserMinus size={20} />
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-semibold text-gray-900 dark:text-white capitalize">
                                                    {group.reason ? group.reason.replace(/_/g, ' ') : 'Unknown'}
                                                </h4>
                                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                                    {group.employeeCount} Employee{group.employeeCount !== 1 ? 's' : ''}
                                                </span>
                                            </div>
                                        </div>

                                        {expandedRows[group.reason] ?
                                            <ChevronUp size={20} className="text-gray-400" /> :
                                            <ChevronDown size={20} className="text-gray-400" />
                                        }
                                    </div>

                                    {/* Expanded Details */}
                                    {expandedRows[group.reason] && (
                                        <div className="bg-gray-50 dark:bg-slate-900/50 px-6 py-3 border-t border-gray-100 dark:border-gray-800">
                                            <table className="min-w-full text-sm">
                                                <thead>
                                                    <tr>
                                                        <th className="text-left font-medium text-gray-500 py-2">Code</th>
                                                        <th className="text-left font-medium text-gray-500 py-2">Name</th>
                                                        <th className="text-right font-medium text-gray-500 py-2">Last Working Day</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {group.employees.map((emp, idx) => (
                                                        <tr key={idx} className="border-b border-gray-100 dark:border-gray-800 last:border-0">
                                                            <td className="py-2 text-gray-700 dark:text-gray-300">{emp.employeeCode}</td>
                                                            <td className="py-2 text-gray-700 dark:text-gray-300">{emp.employeeName}</td>
                                                            <td className="py-2 text-right text-gray-700 dark:text-gray-300">{emp.lastWorkingDay}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            ))
                        ) : (
                            <div className="p-10 text-center text-gray-500 dark:text-gray-400">
                                No termination data found.
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default TerminationReasonReport;
