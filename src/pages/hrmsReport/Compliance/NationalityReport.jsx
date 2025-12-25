import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Download, Loader, Search, Flag, ChevronDown, ChevronUp } from 'lucide-react';

const NationalityReport = () => {
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
            const response = await axios.get(`${API_URL}/reports/compliance/nationality`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            console.log("Nationality Report Data:", response.data);
            setReportData(response.data);
        } catch (err) {
            console.error("Error fetching Nationality report:", err);
            setError('Failed to load nationality report.');
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadExcel = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}/reports/compliance/nationality/export`, {
                headers: { "Authorization": `Bearer ${token}` },
                responseType: 'blob',
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'Nationality-Report.xlsx');
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            console.error("Error exporting Nationality report:", err);
            alert("Failed to export Nationality report.");
        }
    };

    const toggleRow = (nationality) => {
        setExpandedRows(prev => ({
            ...prev,
            [nationality]: !prev[nationality]
        }));
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Employee Nationality Distribution</h3>
                    <p className="text-sm text-gray-500">Demographic breakdown by nationality</p>
                </div>
                <button onClick={handleDownloadExcel} className="btn-secondary flex items-center gap-2 text-sm bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 px-3 py-2 rounded-lg transition-colors">
                    <Download size={16} /> Export Report
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center items-center py-20">
                    <Loader className="animate-spin text-blue-600 h-8 w-8" />
                </div>
            ) : error ? (
                <div className="p-6 text-center text-red-600 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <p>{error}</p>
                    <button onClick={fetchReport} className="text-sm underline hover:text-red-800 mt-2">Retry</button>
                </div>
            ) : (
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                    <div className="divide-y divide-gray-200 dark:divide-gray-700">
                        {reportData.length > 0 ? (
                            reportData.map((item) => (
                                <div key={item.nationality} className="bg-white dark:bg-slate-800">
                                    <div
                                        className="px-6 py-4 flex justify-between items-center cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors"
                                        onClick={() => toggleRow(item.nationality)}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg text-indigo-600 dark:text-indigo-400">
                                                <Flag size={20} />
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                                                    {item.nationality || 'Unknown'}
                                                </h4>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                                        {item.employeeCount} Employee{item.employeeCount !== 1 ? 's' : ''}
                                                    </span>
                                                    <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-1.5 py-0.5 rounded">
                                                        {item.percentage}%
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {expandedRows[item.nationality] ?
                                            <ChevronUp size={20} className="text-gray-400" /> :
                                            <ChevronDown size={20} className="text-gray-400" />
                                        }
                                    </div>

                                    {/* Expanded Details */}
                                    {expandedRows[item.nationality] && (
                                        <div className="bg-gray-50 dark:bg-slate-900/50 px-6 py-3 border-t border-gray-100 dark:border-gray-800">
                                            <table className="min-w-full text-sm">
                                                <thead>
                                                    <tr>
                                                        <th className="text-left font-medium text-gray-500 py-2 w-24">Code</th>
                                                        <th className="text-left font-medium text-gray-500 py-2">Name</th>
                                                        <th className="text-right font-medium text-gray-500 py-2">Designation</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {item.employees && item.employees.map((emp, idx) => (
                                                        <tr key={idx} className="border-b border-gray-100 dark:border-gray-800 last:border-0 hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                                                            <td className="py-2 text-gray-700 dark:text-gray-300">{emp.employeeCode}</td>
                                                            <td className="py-2 text-gray-700 dark:text-gray-300 font-medium">{emp.employeeName}</td>
                                                            <td className="py-2 text-right text-gray-700 dark:text-gray-300">{emp.designation || '-'}</td>
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
                                No nationality data found.
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default NationalityReport;
