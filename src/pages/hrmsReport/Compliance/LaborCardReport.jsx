import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Download, Loader, Search, FileBadge, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

const LaborCardReport = () => {
    const [loading, setLoading] = useState(false);
    const [reportData, setReportData] = useState([]);
    const [filteredData, setFilteredData] = useState([]);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    const API_URL = import.meta.env.VITE_API_BASE_URL;

    useEffect(() => {
        fetchReport();
    }, []);

    const fetchReport = async () => {
        setLoading(true);
        setError('');
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}/reports/compliance/labor-card`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            console.log("Labor Card Report Data:", response.data);
            setReportData(response.data);
            setFilteredData(response.data);
        } catch (err) {
            console.error("Error fetching Labor Card report:", err);
            setError('Failed to load labor card report.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!searchTerm) {
            setFilteredData(reportData);
        } else {
            const lowerSearch = searchTerm.toLowerCase();
            const filtered = reportData.filter(item =>
                (item.employeeName && item.employeeName.toLowerCase().includes(lowerSearch)) ||
                (item.employeeCode && item.employeeCode.toLowerCase().includes(lowerSearch)) ||
                (item.laborCardNumber && item.laborCardNumber.toLowerCase().includes(lowerSearch))
            );
            setFilteredData(filtered);
        }
    }, [searchTerm, reportData]);

    const handleDownloadExcel = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}/reports/compliance/labor-card/export`, {
                headers: { "Authorization": `Bearer ${token}` },
                responseType: 'blob',
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'Labor-Card-Report.xlsx');
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            console.error("Error exporting Labor Card report:", err);
            alert("Failed to export Labor Card report.");
        }
    };

    const getStatusBadge = (status) => {
        if (status === 'ACTIVE') {
            return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"><CheckCircle size={12} className="mr-1" /> Active</span>;
        } else if (status === 'EXPIRING_SOON') {
            return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800"><Clock size={12} className="mr-1" /> Expiring Soon</span>;
        } else {
            return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800"><AlertTriangle size={12} className="mr-1" /> Expired</span>;
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row justify-between items-center gap-4 bg-gray-50 dark:bg-gray-900/50">
                    <div>
                        <h3 className="font-semibold text-gray-700 dark:text-gray-200">Labor Card Status</h3>
                        <p className="text-xs text-slate-500">Track labor card validity and expiry</p>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                            <input
                                type="text"
                                placeholder="Search..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-9 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <button onClick={handleDownloadExcel} className="btn-secondary flex items-center gap-2 text-sm bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 px-3 py-2 rounded-lg transition-colors">
                            <Download size={16} /> Export
                        </button>
                    </div>
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
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-800">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Employee</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Labor Card No</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Expiry Date</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Days to Expiry</th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-gray-700">
                                {filteredData.length > 0 ? (
                                    filteredData.map((item) => (
                                        <tr key={item.employeeId} className="hover:bg-gray-50 dark:hover:bg-slate-700/50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900 dark:text-white">{item.employeeName}</div>
                                                <div className="text-xs text-gray-500 dark:text-gray-400">{item.employeeCode}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                <div className="flex items-center gap-1">
                                                    <FileBadge size={14} className="text-gray-400" />
                                                    {item.laborCardNumber || '-'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                {item.expiryDate}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                                <span className={`${item.daysToExpiry <= 30 ? 'text-red-600 font-semibold' : 'text-gray-700 dark:text-gray-300'}`}>
                                                    {item.daysToExpiry}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                {getStatusBadge(item.status)}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
                                            No labor card records found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LaborCardReport;
