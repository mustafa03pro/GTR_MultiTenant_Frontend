import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Download, Loader, Users, PieChart, Briefcase } from 'lucide-react';

const CompanyQuotaReport = () => {
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
            const response = await axios.get(`${API_URL}/reports/compliance/company-quota`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            console.log("Company Quota Report Data:", response.data);
            setReportData(response.data);
        } catch (err) {
            console.error("Error fetching Company Quota report:", err);
            setError('Failed to load company quota report.');
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadExcel = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}/reports/compliance/company-quota/export`, {
                headers: { "Authorization": `Bearer ${token}` },
                responseType: 'blob',
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'Company-Quota-Report.xlsx');
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            console.error("Error exporting Company Quota report:", err);
            alert("Failed to export Company Quota report.");
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Company Visa Quota</h3>
                    <p className="text-sm text-gray-500">Utilization of allocated visa quota</p>
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Quota Summary Card */}
                    <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-6 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <Briefcase size={120} className="text-blue-500" />
                        </div>

                        <div className="mb-6">
                            <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Company Name</h4>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{reportData.companyName || 'N/A'}</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase">Total Quota</span>
                                <div className="text-3xl font-bold text-blue-700 dark:text-blue-300 mt-1">{reportData.totalVisaQuota}</div>
                            </div>
                            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                                <span className="text-xs font-semibold text-green-600 dark:text-green-400 uppercase">Available</span>
                                <div className="text-3xl font-bold text-green-700 dark:text-green-300 mt-1">{reportData.availableVisaQuota}</div>
                            </div>
                        </div>
                    </div>

                    {/* Utilization Chart Card */}
                    <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-6 flex flex-col justify-center items-center relative">
                        <div className="absolute top-4 left-4">
                            <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Utilization</h4>
                        </div>

                        <div className="relative w-48 h-48 flex items-center justify-center">
                            {/* Simple CSS-based circular progress or just percentage for now */}
                            <svg className="w-full h-full transform -rotate-90">
                                <circle
                                    className="text-gray-200 dark:text-gray-700"
                                    strokeWidth="12"
                                    stroke="currentColor"
                                    fill="transparent"
                                    r="70"
                                    cx="96"
                                    cy="96"
                                />
                                <circle
                                    className={`${reportData.utilizationPercentage > 90 ? 'text-red-500' : 'text-blue-500'}`}
                                    strokeWidth="12"
                                    strokeDasharray={440}
                                    strokeDashoffset={440 - (440 * reportData.utilizationPercentage) / 100}
                                    strokeLinecap="round"
                                    stroke="currentColor"
                                    fill="transparent"
                                    r="70"
                                    cx="96"
                                    cy="96"
                                />
                            </svg>
                            <div className="absolute flex flex-col items-center">
                                <span className="text-4xl font-bold text-gray-900 dark:text-white">{reportData.utilizationPercentage}%</span>
                                <span className="text-xs text-gray-500">Used</span>
                            </div>
                        </div>

                        <div className="mt-6 w-full px-10">
                            <div className="flex justify-between text-sm mb-1">
                                <span className="text-gray-600 dark:text-gray-400">Used Quota</span>
                                <span className="font-semibold text-gray-900 dark:text-white">{reportData.usedVisaQuota}</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                                <div className={`h-2.5 rounded-full ${reportData.utilizationPercentage > 90 ? 'bg-red-500' : 'bg-blue-600'}`} style={{ width: `${Math.min(reportData.utilizationPercentage, 100)}%` }}></div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="p-10 text-center text-gray-500 dark:text-gray-400 bg-white dark:bg-slate-800 rounded-xl border-dashed border-2 border-gray-300">
                    No company quota information available.
                </div>
            )}
        </div>
    );
};

export default CompanyQuotaReport;
