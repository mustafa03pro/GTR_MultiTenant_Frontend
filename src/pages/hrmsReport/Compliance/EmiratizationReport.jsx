import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Download, Loader, PieChart, CheckCircle, AlertTriangle } from 'lucide-react';

const EmiratizationReport = () => {
    const [loading, setLoading] = useState(false);
    const [reportData, setReportData] = useState(null);
    const [error, setError] = useState('');

    const API_URL = import.meta.env.VITE_API_BASE_URL;

    useEffect(() => {
        fetchReport();
    }, []);

    const fetchReport = async () => {
        setLoading(true);
        setError('');
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}/reports/compliance/emiratization`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            console.log("Emiratization Report Data:", response.data);
            setReportData(response.data);
        } catch (err) {
            console.error("Error fetching Emiratization report:", err);
            setError('Failed to load emiratization report.');
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadExcel = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}/reports/compliance/emiratization/export`, {
                headers: { "Authorization": `Bearer ${token}` },
                responseType: 'blob',
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'Emiratization-Report.xlsx');
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            console.error("Error exporting Emiratization report:", err);
            alert("Failed to export Emiratization report.");
        }
    };

    const isCompliant = reportData?.status === 'COMPLIANT';

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Emiratization Compliance</h3>
                    <p className="text-sm text-gray-500">Tracking nationalization targets and ratios</p>
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
            ) : reportData ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Compliance Status Card */}
                    <div className={`md:col-span-1 rounded-xl border p-6 flex flex-col items-center justify-center text-center ${isCompliant ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800' : 'bg-orange-50 border-orange-200 dark:bg-orange-900/20 dark:border-orange-800'}`}>
                        {isCompliant ? (
                            <CheckCircle size={64} className="text-green-600 dark:text-green-400 mb-4" />
                        ) : (
                            <AlertTriangle size={64} className="text-orange-600 dark:text-orange-400 mb-4" />
                        )}
                        <h4 className={`text-xl font-bold mb-1 ${isCompliant ? 'text-green-800 dark:text-green-300' : 'text-orange-800 dark:text-orange-300'}`}>
                            {reportData.status}
                        </h4>
                        <p className={`text-sm ${isCompliant ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'}`}>
                            Current Emiratization Status
                        </p>
                    </div>

                    {/* Stats & Chart */}
                    <div className="md:col-span-2 bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-6">
                        <div className="flex flex-col sm:flex-row gap-8 items-center justify-around h-full">

                            {/* Simple Pie Chart Representation */}
                            <div className="relative w-40 h-40">
                                <svg viewBox="0 0 32 32" className="w-full h-full transform -rotate-90">
                                    <circle r="16" cx="16" cy="16" fill="transparent" stroke="#e2e8f0" strokeWidth="32" className="dark:stroke-slate-700" />
                                    <circle
                                        r="16" cx="16" cy="16"
                                        fill="transparent"
                                        stroke="#10b981"
                                        strokeWidth="32"
                                        strokeDasharray={`${reportData.emiratizationPercentage} 100`}
                                        className="text-emerald-500"
                                    />
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                    <span className="text-lg font-bold text-white drop-shadow-md">{reportData.emiratizationPercentage}%</span>
                                </div>
                            </div>

                            <div className="flex-1 w-full sm:w-auto grid grid-cols-2 gap-4">
                                <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-center">
                                    <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-widest block mb-1">Total Employees</span>
                                    <span className="text-2xl font-bold text-gray-900 dark:text-white">{reportData.totalEmployees}</span>
                                </div>
                                <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg text-center">
                                    <span className="text-xs text-emerald-600 dark:text-emerald-400 uppercase tracking-widest block mb-1">Nationals</span>
                                    <span className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">{reportData.totalNationals}</span>
                                </div>
                                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-center">
                                    <span className="text-xs text-blue-600 dark:text-blue-400 uppercase tracking-widest block mb-1">Expats</span>
                                    <span className="text-2xl font-bold text-blue-700 dark:text-blue-300">{reportData.totalExpats}</span>
                                </div>
                                {/* Metric Target Placeholder */}
                                <div className="p-4 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-center flex flex-col justify-center">
                                    <span className="text-xs text-gray-400 uppercase tracking-widest block mb-1">Target</span>
                                    <span className="text-lg font-semibold text-gray-500 dark:text-gray-400">2.0%</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="p-10 text-center text-gray-500 dark:text-gray-400 bg-white dark:bg-slate-800 rounded-xl border-dashed border-2 border-gray-300">
                    No emiratization data available.
                </div>
            )}
        </div>
    );
};

export default EmiratizationReport;
