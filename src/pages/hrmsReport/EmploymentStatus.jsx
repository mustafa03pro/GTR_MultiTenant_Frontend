
import React, { useState, useEffect } from 'react';
import { Download, Loader, Briefcase, CheckCircle } from 'lucide-react';
import axios from 'axios';

const EmploymentStatus = () => {
    const [loading, setLoading] = useState(true);
    const [exporting, setExporting] = useState(false);
    const [stats, setStats] = useState({
        total: 0,
        byStatus: {},
        byProbation: {
            'Confirmed': 0,
            'Probation': 0
        },
        byContractType: {}
    });

    const API_URL = import.meta.env.VITE_API_BASE_URL;

    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = localStorage.getItem('token');
                const headers = { "Authorization": `Bearer ${token}` };

                // Fetch basic list (contains Status)
                const employeesRes = await axios.get(`${API_URL}/employees/all`, { headers });
                const employees = employeesRes.data;

                // For Contract Type and Probation, we need Job Details again
                // Optimization: If status is 'TERMINATED' or 'INACTIVE', we might skip certain checks, 
                // but let's fetch consistent details for active employees at least.
                // Actually, for Employment Status, user expects full data. 
                // We will fetch job details for ALL.

                const employeesWithDetails = await Promise.all(
                    employees.map(async (emp) => {
                        try {
                            const jobDetailsRes = await axios.get(`${API_URL}/job-details/${emp.employeeCode}`, { headers });
                            return { ...emp, jobDetails: jobDetailsRes.data };
                        } catch (err) {
                            return { ...emp, jobDetails: null };
                        }
                    })
                );

                processStats(employeesWithDetails);
            } catch (err) {
                console.error("Error fetching data:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const processStats = (data) => {
        const newStats = {
            total: data.length,
            byStatus: {},
            byProbation: {
                'Confirmed': 0,
                'Probation': 0
            },
            byContractType: {}
        };

        const today = new Date();

        data.forEach(emp => {
            // Status
            const status = emp.status || 'Unknown';
            newStats.byStatus[status] = (newStats.byStatus[status] || 0) + 1;

            // Contract Type
            const contractType = emp.jobDetails?.contractType || 'Permanent'; // Default per backend logic
            newStats.byContractType[contractType] = (newStats.byContractType[contractType] || 0) + 1;

            // Probation
            // Only relevant if Active usually, but let's count all based on end date
            if (emp.jobDetails?.probationEndDate) {
                const probationEnd = new Date(emp.jobDetails.probationEndDate);
                if (probationEnd > today) {
                    newStats.byProbation['Probation']++;
                } else {
                    newStats.byProbation['Confirmed']++;
                }
            } else {
                newStats.byProbation['Confirmed']++; // Default if no probation date
            }
        });

        setStats(newStats);
    };

    const handleExport = async () => {
        setExporting(true);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}/reports/employment-status`, {
                headers: { "Authorization": `Bearer ${token}` },
                responseType: 'blob',
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'Employment_Status_Report.xlsx');
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
        } catch (err) {
            console.error("Export failed:", err);
            alert("Failed to export report.");
        } finally {
            setExporting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-96">
                <Loader className="animate-spin h-8 w-8 text-blue-600 mb-4" />
                <p className="text-gray-500">Loading employment status data...</p>
                <p className="text-xs text-gray-400 mt-2">Checking contract details</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Employment Status</h2>
                    <p className="text-sm text-gray-500">Contract Types and Status Distribution</p>
                </div>
                <button
                    onClick={handleExport}
                    disabled={exporting}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-70"
                >
                    {exporting ? <Loader className="animate-spin h-4 w-4" /> : <Download size={18} />}
                    <span>Export Excel</span>
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Status Table */}
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-green-50 dark:bg-green-900/20 flex items-center gap-2">
                        <CheckCircle size={18} className="text-green-600" />
                        <h3 className="font-semibold text-gray-700 dark:text-gray-200">Current Status</h3>
                    </div>
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-900/50 dark:text-gray-400">
                            <tr>
                                <th className="px-6 py-3">Status</th>
                                <th className="px-6 py-3 text-right">Count</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {Object.entries(stats.byStatus).map(([key, val]) => (
                                <tr key={key} className="bg-white dark:bg-slate-800">
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${key === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                            }`}>
                                            {key}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">{val}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Contract Type Table */}
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-blue-50 dark:bg-blue-900/20 flex items-center gap-2">
                        <Briefcase size={18} className="text-blue-600" />
                        <h3 className="font-semibold text-gray-700 dark:text-gray-200">Contract Types</h3>
                    </div>
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-900/50 dark:text-gray-400">
                            <tr>
                                <th className="px-6 py-3">Type</th>
                                <th className="px-6 py-3 text-right">Count</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {Object.entries(stats.byContractType).map(([key, val]) => (
                                <tr key={key} className="bg-white dark:bg-slate-800">
                                    <td className="px-6 py-4 capitalize">{key.toLowerCase().replace('_', ' ')}</td>
                                    <td className="px-6 py-4 text-right">{val}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Probation Table */}
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-yellow-50 dark:bg-yellow-900/20 flex items-center gap-2">
                        <CheckCircle size={18} className="text-yellow-600" />
                        <h3 className="font-semibold text-gray-700 dark:text-gray-200">Confirmation Status</h3>
                    </div>
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-900/50 dark:text-gray-400">
                            <tr>
                                <th className="px-6 py-3">Status</th>
                                <th className="px-6 py-3 text-right">Count</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {Object.entries(stats.byProbation).map(([key, val]) => (
                                <tr key={key} className="bg-white dark:bg-slate-800">
                                    <td className="px-6 py-4">{key}</td>
                                    <td className="px-6 py-4 text-right">{val}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

            </div>
        </div>
    );
};

export default EmploymentStatus;
