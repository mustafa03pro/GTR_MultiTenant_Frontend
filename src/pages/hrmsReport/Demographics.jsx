
import React, { useState, useEffect } from 'react';
import { Download, Loader, User, BarChart } from 'lucide-react';
import axios from 'axios';

const Demographics = () => {
    const [loading, setLoading] = useState(true);
    const [exporting, setExporting] = useState(false);
    const [stats, setStats] = useState({
        total: 0,
        byGender: {},
        byMaritalStatus: {},
        byAgeGroup: {}
    });

    const API_URL = import.meta.env.VITE_API_BASE_URL;

    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = localStorage.getItem('token');
                const headers = { "Authorization": `Bearer ${token}` };

                // Fetch basic list (contains Gender, Marital Status usually)
                const employeesRes = await axios.get(`${API_URL}/employees/all`, { headers });
                const employees = employeesRes.data;

                // Fetch full profile for DOB to calculate Age
                // We use Promise.all to fetch JobDetails/Profile or just rely on what we can find.
                // Assuming DOB is in Employee Profile which might require a different endpoint or included in 'all' if expanded.
                // Based on backend 'Employee' entity has 'dob', so we MIGHT have it in /all if the DTO includes it.
                // MasterEmployeeReport didn't use DOB. Let's check if 'dob' is in the basic fetch.
                // If not, we might need to fetch individual records. 
                // Given the HeadCount pattern, we will fetch individual records to be safe and accurate.

                // Note: Employee entity has 'dob'. Let's hope /all returns it. 
                // If the user's backend code: 'employees = employeeRepository.findAll();' 
                // The Controller likely returns the Entity or a DTO. If Entity, 'dob' is there.
                // If DTO, maybe not. To be safe, let's assume we might need to fetch if 'dob' is missing.

                // However, fetching 100s of profiles is slow. 
                // We will try to calculate from 'employees' first. If 'dob' is missing, we fetch details.

                // Actually, let's just do the fetching to be consistent with HeadCount and guarantee data.
                // We need 'dob' for Age.

                // In Employee.jsx, DOB seemed to be part of the form/profile.

                setStats(processStats(employees)); // Try to process with basic data first? 
                // No, sticking to safe robust method:

                // Optimization: Check the first employee. If 'dob' exists, use it. Else fetch.
                let dataToProcess = employees;
                if (employees.length > 0 && !employees[0].dob) {
                    const employeesWithDetails = await Promise.all(
                        employees.map(async (emp) => {
                            try {
                                // Maybe fetch profile? Or just job-details?
                                // Backend service uses 'EmployeeProfile' for some fields but 'Employee' entity has 'dob'.
                                // If 'dob' is null in /all response, we are stuck unless we fetch full employee object.
                                // Endpoint /employees/{id} usually returns full object.
                                const fullEmpRes = await axios.get(`${API_URL}/employees/${emp.employeeCode}`, { headers });
                                return fullEmpRes.data;
                            } catch (err) {
                                return emp;
                            }
                        })
                    );
                    dataToProcess = employeesWithDetails;
                }

                setStats(processStats(dataToProcess));

            } catch (err) {
                console.error("Error fetching data:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const calculateAge = (dobString) => {
        if (!dobString) return -1;
        const dob = new Date(dobString);
        const diff_ms = Date.now() - dob.getTime();
        const age_dt = new Date(diff_ms);
        return Math.abs(age_dt.getUTCFullYear() - 1970);
    };

    const processStats = (data) => {
        const newStats = {
            total: data.length,
            byGender: {},
            byMaritalStatus: {},
            byAgeGroup: {
                'Under 20': 0,
                '20-29': 0,
                '30-39': 0,
                '40-49': 0,
                '50-59': 0,
                '60+': 0,
                'Unknown': 0
            }
        };

        data.forEach(emp => {
            // Gender
            const gender = emp.gender || 'Unspecified';
            newStats.byGender[gender] = (newStats.byGender[gender] || 0) + 1;

            // Marital Status
            // Check spelling: 'MartialStatus' (sic) in backend entity based on previous context, or 'maritalStatus'
            const marital = emp.martialsStatus || emp.maritalStatus || 'Unspecified';
            newStats.byMaritalStatus[marital] = (newStats.byMaritalStatus[marital] || 0) + 1;

            // Age
            const age = calculateAge(emp.dob);
            if (age === -1) {
                newStats.byAgeGroup['Unknown']++;
            } else if (age < 20) {
                newStats.byAgeGroup['Under 20']++;
            } else if (age < 30) {
                newStats.byAgeGroup['20-29']++;
            } else if (age < 40) {
                newStats.byAgeGroup['30-39']++;
            } else if (age < 50) {
                newStats.byAgeGroup['40-49']++;
            } else if (age < 60) {
                newStats.byAgeGroup['50-59']++;
            } else {
                newStats.byAgeGroup['60+']++;
            }
        });

        return newStats;
    };

    const handleExport = async () => {
        setExporting(true);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}/reports/demographics`, {
                headers: { "Authorization": `Bearer ${token}` },
                responseType: 'blob',
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'Demographic_Report.xlsx');
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
                <p className="text-gray-500">Loading demographic data...</p>
                <p className="text-xs text-gray-400 mt-2">Determining age and distribution</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Demographic Analysis</h2>
                    <p className="text-sm text-gray-500">Age, Gender, and Marital Status Distribution</p>
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
                {/* Gender Table */}
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-purple-50 dark:bg-purple-900/20 flex items-center gap-2">
                        <User size={18} className="text-purple-600" />
                        <h3 className="font-semibold text-gray-700 dark:text-gray-200">Gender Distribution</h3>
                    </div>
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-900/50 dark:text-gray-400">
                            <tr>
                                <th className="px-6 py-3">Gender</th>
                                <th className="px-6 py-3 text-right">Count</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {Object.entries(stats.byGender).map(([key, val]) => (
                                <tr key={key} className="bg-white dark:bg-slate-800">
                                    <td className="px-6 py-4 capitalize">{key.toLowerCase()}</td>
                                    <td className="px-6 py-4 text-right">{val}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Marital Status Table */}
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-pink-50 dark:bg-pink-900/20 flex items-center gap-2">
                        <User size={18} className="text-pink-600" />
                        <h3 className="font-semibold text-gray-700 dark:text-gray-200">Marital Status</h3>
                    </div>
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-900/50 dark:text-gray-400">
                            <tr>
                                <th className="px-6 py-3">Status</th>
                                <th className="px-6 py-3 text-right">Count</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {Object.entries(stats.byMaritalStatus).map(([key, val]) => (
                                <tr key={key} className="bg-white dark:bg-slate-800">
                                    <td className="px-6 py-4 capitalize">{key.toLowerCase().replace('_', ' ')}</td>
                                    <td className="px-6 py-4 text-right">{val}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Age Group Table */}
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-orange-50 dark:bg-orange-900/20 flex items-center gap-2">
                        <BarChart size={18} className="text-orange-600" />
                        <h3 className="font-semibold text-gray-700 dark:text-gray-200">Age Groups</h3>
                    </div>
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-900/50 dark:text-gray-400">
                            <tr>
                                <th className="px-6 py-3">Age Range</th>
                                <th className="px-6 py-3 text-right">Count</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {Object.entries(stats.byAgeGroup).map(([key, val]) => (
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

export default Demographics;
