import React, { useState, useEffect } from 'react';
import { Download, Loader, Calendar, Clock, ShieldCheck, Search, AlertCircle } from 'lucide-react';
import axios from 'axios';
import * as XLSX from 'xlsx';

const OvertimeReport = () => {
    const [exporting, setExporting] = useState(false);
    // Default to current month YYYY-MM
    const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));

    // Table state
    const [loading, setLoading] = useState(false);
    const [tableData, setTableData] = useState([]);
    const [filteredData, setFilteredData] = useState([]);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    const API_URL = import.meta.env.VITE_API_BASE_URL;

    useEffect(() => {
        if (selectedMonth) {
            fetchAndParseReport();
        }
    }, [selectedMonth]);

    useEffect(() => {
        if (!searchTerm) {
            setFilteredData(tableData);
        } else {
            const lowerTerm = searchTerm.toLowerCase();
            const filtered = tableData.filter(row =>
                Object.values(row).some(val =>
                    String(val).toLowerCase().includes(lowerTerm)
                )
            );
            setFilteredData(filtered);
        }
    }, [searchTerm, tableData]);

    const fetchAndParseReport = async () => {
        setLoading(true);
        setError('');
        setTableData([]);
        setFilteredData([]);

        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}/reports/attendance/overtime`, {
                params: { month: selectedMonth },
                headers: { "Authorization": `Bearer ${token}` },
                responseType: 'arraybuffer',
            });

            const workbook = XLSX.read(response.data, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];
            const data = XLSX.utils.sheet_to_json(sheet);

            setTableData(data);
            setFilteredData(data);
        } catch (err) {
            console.error("Failed to load report data:", err);
            setError('Could not load overtime details. You can still try to download the file.');
        } finally {
            setLoading(false);
        }
    };

    const handleExport = async () => {
        if (!selectedMonth) {
            alert("Please select a month.");
            return;
        }

        setExporting(true);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}/reports/attendance/overtime`, {
                params: { month: selectedMonth },
                headers: { "Authorization": `Bearer ${token}` },
                responseType: 'blob',
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Overtime_Report_${selectedMonth}.xlsx`);
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
                    <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Overtime Report</h2>
                    <p className="text-sm text-gray-500">View and export overtime details.</p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                        <input
                            type="month"
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                            className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <button
                        onClick={handleExport}
                        disabled={exporting || !selectedMonth}
                        className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed text-sm"
                    >
                        {exporting ? <Loader className="animate-spin h-4 w-4" /> : <Download size={16} />}
                        <span>Export Excel</span>
                    </button>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row justify-between items-center gap-4 bg-gray-50 dark:bg-gray-900/50">
                    <h3 className="font-semibold text-gray-700 dark:text-gray-200">Overtime Details - {selectedMonth}</h3>
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search employee..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center p-12">
                        <Loader className="animate-spin h-8 w-8 text-amber-600 mb-4" />
                        <p className="text-gray-500">Loading overtime details...</p>
                    </div>
                ) : error ? (
                    <div className="flex flex-col items-center justify-center p-12 text-center">
                        <AlertCircle className="h-12 w-12 text-red-500 mb-4 opacity-50" />
                        <p className="text-gray-800 dark:text-gray-200 font-medium mb-2">Error loading data</p>
                        <p className="text-gray-500 text-sm max-w-sm">{error}</p>
                        <button onClick={fetchAndParseReport} className="mt-4 text-amber-600 hover:underline">Try Again</button>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-gray-700 uppercase bg-gray-100 dark:bg-gray-700 dark:text-gray-400">
                                <tr>
                                    {tableData.length > 0 && Object.keys(tableData[0]).map((key) => (
                                        <th key={key} className="px-6 py-3 whitespace-nowrap">{key}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {filteredData.length > 0 ? (
                                    filteredData.map((row, idx) => (
                                        <tr key={idx} className="bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700/50">
                                            {Object.values(row).map((val, i) => (
                                                <td key={i} className="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-gray-300">
                                                    {val}
                                                </td>
                                            ))}
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={tableData.length > 0 ? Object.keys(tableData[0]).length : 1} className="px-6 py-8 text-center text-gray-500">
                                            {tableData.length === 0 ? "No overtime records found for this month." : "No records match your search."}
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

export default OvertimeReport;
