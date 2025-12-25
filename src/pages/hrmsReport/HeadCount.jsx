
import React, { useState, useEffect } from 'react';
import { Download, Loader, Users, Building, Briefcase } from 'lucide-react';
import axios from 'axios';

const HeadCount = () => {
    const [loading, setLoading] = useState(true);
    const [exporting, setExporting] = useState(false);
    const [stats, setStats] = useState({
        total: 0,
        active: 0,
        inactive: 0,
        byDepartment: {},
        byDesignation: {}
    });

    const API_URL = import.meta.env.VITE_API_BASE_URL;

    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = localStorage.getItem('token');
                const headers = { "Authorization": `Bearer ${token}` };

                // Fetch basic list
                const employeesRes = await axios.get(`${API_URL}/employees/all`, { headers });
                const employees = employeesRes.data;

                // Fetch job details for all employees to get Department and Designation
                // We limit concurrency or just await all for simplicity given likely small-medium dataset
                // In a real large-scale app, this should be paginated or backend-supported.
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
            active: data.filter(e => e.status === 'ACTIVE').length,
            inactive: data.filter(e => e.status !== 'ACTIVE').length,
            byDepartment: {},
            byDesignation: {}
        };

        data.forEach(emp => {
            const dept = emp.jobDetails?.department || 'Unassigned';
            const desig = emp.jobDetails?.designation || 'Unassigned';

            newStats.byDepartment[dept] = (newStats.byDepartment[dept] || 0) + 1;
            newStats.byDesignation[desig] = (newStats.byDesignation[desig] || 0) + 1;
        });

        setStats(newStats);
    };

    const handleExport = async () => {
        setExporting(true);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}/reports/headcount`, {
                headers: { "Authorization": `Bearer ${token}` },
                responseType: 'blob',
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'Headcount_Report.xlsx');
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
                <p className="text-gray-500">Loading headcount statistics...</p>
                <p className="text-xs text-gray-400 mt-2">Fetching detailed records</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Headcount Overview</h2>
                    <p className="text-sm text-gray-500">Distribution by Department and Role</p>
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

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-lg">
                            <Users size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Total Employees</p>
                            <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100">{stats.total}</h3>
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-lg">
                            <Users size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Active</p>
                            <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100">{stats.active}</h3>
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-lg">
                            <Users size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Inactive/Terminated</p>
                            <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100">{stats.inactive}</h3>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Department Table */}
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex items-center gap-2">
                        <Building size={18} className="text-gray-500" />
                        <h3 className="font-semibold text-gray-700 dark:text-gray-200">Department Wise</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-900/50 dark:text-gray-400">
                                <tr>
                                    <th className="px-6 py-3">Department</th>
                                    <th className="px-6 py-3 text-right">Count</th>
                                    <th className="px-6 py-3 text-right">%</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {Object.entries(stats.byDepartment).map(([dept, count]) => (
                                    <tr key={dept} className="bg-white dark:bg-slate-800">
                                        <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{dept}</td>
                                        <td className="px-6 py-4 text-right">{count}</td>
                                        <td className="px-6 py-4 text-right text-gray-500">
                                            {((count / stats.total) * 100).toFixed(1)}%
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Designation Table */}
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex items-center gap-2">
                        <Briefcase size={18} className="text-gray-500" />
                        <h3 className="font-semibold text-gray-700 dark:text-gray-200">Role Wise</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-900/50 dark:text-gray-400">
                                <tr>
                                    <th className="px-6 py-3">Role / Designation</th>
                                    <th className="px-6 py-3 text-right">Count</th>
                                    <th className="px-6 py-3 text-right">%</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {Object.entries(stats.byDesignation).map(([role, count]) => (
                                    <tr key={role} className="bg-white dark:bg-slate-800">
                                        <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{role}</td>
                                        <td className="px-6 py-4 text-right">{count}</td>
                                        <td className="px-6 py-4 text-right text-gray-500">
                                            {((count / stats.total) * 100).toFixed(1)}%
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HeadCount;
