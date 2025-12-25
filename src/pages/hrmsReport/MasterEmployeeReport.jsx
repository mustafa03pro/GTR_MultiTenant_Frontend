
import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { Download, Loader, Search, RefreshCw, AlertCircle } from 'lucide-react';
import axios from 'axios';

const MasterEmployeeReport = () => {
    const [employees, setEmployees] = useState([]);
    const [filteredEmployees, setFilteredEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [exporting, setExporting] = useState(false);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');

    const API_URL = import.meta.env.VITE_API_BASE_URL;

    // Fetch employee data for the table view
    const fetchEmployees = async () => {
        setLoading(true);
        setError('');
        try {
            const token = localStorage.getItem('token');
            const headers = { "Authorization": `Bearer ${token}` };

            // We'll use the existing /employees/all endpoint to populate the UI table
            // This displays a preview/list, while the export button gets the full detailed report
            const response = await axios.get(`${API_URL}/employees/all`, { headers });

            setEmployees(response.data);
            setFilteredEmployees(response.data);
        } catch (err) {
            console.error("Error fetching employees:", err);
            setError("Failed to load employee list.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEmployees();
    }, []);

    useEffect(() => {
        const lowercasedFilter = searchTerm.toLowerCase();
        const filtered = employees.filter(emp => {
            const matchesSearch = (
                (emp.firstName && emp.firstName.toLowerCase().includes(lowercasedFilter)) ||
                (emp.lastName && emp.lastName.toLowerCase().includes(lowercasedFilter)) ||
                (emp.employeeCode && emp.employeeCode.toLowerCase().includes(lowercasedFilter)) ||
                (emp.emailWork && emp.emailWork.toLowerCase().includes(lowercasedFilter))
            );

            const matchesStatus = statusFilter === 'ALL' || emp.status === statusFilter;

            return matchesSearch && matchesStatus;
        });
        setFilteredEmployees(filtered);
    }, [searchTerm, statusFilter, employees]);

    const handleExport = async () => {
        setExporting(true);
        try {
            const token = localStorage.getItem('token');
            // Append status parameter if not ALL
            const params = statusFilter !== 'ALL' ? `?status=${statusFilter}` : '';
            const response = await axios.get(`${API_URL}/reports/employee-master${params}`, {
                headers: { "Authorization": `Bearer ${token}` },
                responseType: 'blob', // Important for file download
            });

            // Create a url for the blob
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;

            // Extract filename from header if possible, or generate one
            const contentDisposition = response.headers['content-disposition'];
            let filename = 'Employee_Master_Report.xlsx';
            if (contentDisposition) {
                const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
                if (filenameMatch && filenameMatch.length === 2)
                    filename = filenameMatch[1];
            }

            link.setAttribute('download', filename);
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
        <div className="flex flex-col h-full">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Employee Master Report</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">View and export comprehensive employee details.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={fetchEmployees}
                        className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Refresh List"
                    >
                        <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
                    </button>
                    <button
                        onClick={handleExport}
                        disabled={exporting || loading}
                        className={`flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-sm ${exporting ? 'opacity-70 cursor-not-allowed' : ''}`}
                    >
                        {exporting ? <Loader className="animate-spin h-5 w-5" /> : <Download size={20} />}
                        <span>{exporting ? 'Exporting...' : 'Export to Excel'}</span>
                    </button>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex-1 flex flex-col overflow-hidden">
                {/* Toolbar */}
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search employees..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 w-full sm:w-64"
                            />
                        </div>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 w-full sm:w-auto"
                        >
                            <option value="ALL">All Status</option>
                            <option value="ACTIVE">Active</option>
                            <option value="INACTIVE">Inactive</option>
                            <option value="TERMINATED">Terminated</option>
                        </select>
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                        Showing {filteredEmployees.length} records
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-auto flex-1">
                    {loading && employees.length === 0 ? (
                        <div className="flex justify-center items-center h-full">
                            <Loader className="animate-spin h-8 w-8 text-blue-600" />
                        </div>
                    ) : error ? (
                        <div className="flex flex-col justify-center items-center h-full text-red-500">
                            <AlertCircle className="h-10 w-10 mb-2" />
                            <p>{error}</p>
                        </div>
                    ) : (
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-900/50 sticky top-0 z-10">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Employee Code</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Email</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Phone</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Gender</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-gray-700">
                                {filteredEmployees.map((emp) => (
                                    <tr key={emp.id || emp.employeeCode} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                                            {emp.employeeCode}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                                            {emp.firstName} {emp.lastName}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                            {emp.emailWork || '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                            {emp.phonePrimary || '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${emp.status === 'ACTIVE'
                                                ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300'
                                                : 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'
                                                }`}>
                                                {emp.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 capitalize">
                                            {emp.gender ? emp.gender.toLowerCase() : '-'}
                                        </td>
                                    </tr>
                                ))}
                                {filteredEmployees.length === 0 && (
                                    <tr>
                                        <td colSpan="6" className="px-6 py-10 text-center text-gray-500 dark:text-gray-400">
                                            No employees found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MasterEmployeeReport;
