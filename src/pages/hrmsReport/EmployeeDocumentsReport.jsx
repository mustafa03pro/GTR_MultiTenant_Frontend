import React, { useState, useEffect } from 'react';
import { Download, Loader, FileText, ShieldCheck, Search, AlertCircle } from 'lucide-react';
import axios from 'axios';
import * as XLSX from 'xlsx';

const EmployeeDocumentsReport = () => {
    const [exporting, setExporting] = useState(false);
    const [loading, setLoading] = useState(true);
    const [tableData, setTableData] = useState([]);
    const [filteredData, setFilteredData] = useState([]);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [columns, setColumns] = useState([]);
    const API_URL = import.meta.env.VITE_API_BASE_URL;

    useEffect(() => {
        fetchAndParseReport();
    }, []);

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
        setColumns([]); // Reset columns on new fetch

        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}/employee-documents/export`, {
                headers: { "Authorization": `Bearer ${token}` },
                responseType: 'arraybuffer', // Important for parsing
            });

            const workbook = XLSX.read(response.data, { type: 'array' });
            const sheetName = workbook.SheetNames[0]; // Assuming data is in the first sheet
            const sheet = workbook.Sheets[sheetName];

            // 1. Get headers explicitly from the first row
            const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1 });
            let extractedHeaders = [];
            if (rawData.length > 0) {
                // Ensure headers are strings and trim them
                extractedHeaders = rawData[0].map(h => String(h).trim());
            }

            // 2. Parse data with defval to ensure all keys exist and handle empty cells
            // Use the extracted headers to ensure consistent column order and access
            const data = XLSX.utils.sheet_to_json(sheet, { defval: "" });

            if (data.length > 0) {
                setColumns(extractedHeaders);
                setTableData(data);
                setFilteredData(data);
            } else {
                setTableData([]);
                setFilteredData([]);
                setColumns([]);
            }

        } catch (err) {
            console.error("Failed to load report data:", err);
            setError('Could not load report preview. You can still try to download the file.');
        } finally {
            setLoading(false);
        }
    };

    const handleExport = async () => {
        setExporting(true);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}/employee-documents/export`, {
                headers: { "Authorization": `Bearer ${token}` },
                responseType: 'blob',
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'Employee_Documents_Report.xlsx');
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
                    <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Employee Documents Report</h2>
                    <p className="text-sm text-gray-500">Overview of all uploaded documents and their status.</p>
                </div>
                <button
                    onClick={handleExport}
                    disabled={exporting}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    {exporting ? <Loader className="animate-spin h-4 w-4" /> : <Download size={18} />}
                    <span>Export Excel</span>
                </button>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900/50">
                    <div className="relative w-full max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search documents..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center p-12">
                        <Loader className="animate-spin h-8 w-8 text-blue-600 mb-4" />
                        <p className="text-gray-500">Loading document data...</p>
                    </div>
                ) : error ? (
                    <div className="flex flex-col items-center justify-center p-12 text-center">
                        <AlertCircle className="h-12 w-12 text-red-500 mb-4 opacity-50" />
                        <p className="text-gray-800 dark:text-gray-200 font-medium mb-2">Error loading data</p>
                        <p className="text-gray-500 text-sm max-w-sm">{error}</p>
                        <button onClick={fetchAndParseReport} className="mt-4 text-blue-600 hover:underline">Try Again</button>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-gray-700 uppercase bg-gray-100 dark:bg-gray-700 dark:text-gray-400">
                                <tr>
                                    {columns.map((key, idx) => (
                                        <th key={idx} className="px-6 py-3 whitespace-nowrap">{key}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {filteredData.length > 0 ? (
                                    filteredData.map((row, idx) => (
                                        <tr key={idx} className="bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700/50">
                                            {columns.map((colKey, i) => (
                                                <td key={i} className="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-gray-300">
                                                    {row[colKey] !== undefined ? row[colKey] : ''}
                                                </td>
                                            ))}
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={columns.length > 0 ? columns.length : 1} className="px-6 py-8 text-center text-gray-500">
                                            No documents found matching your search.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                        {tableData.length === 0 && !loading && (
                            <div className="p-8 text-center text-gray-500">
                                No records found in the report.
                            </div>
                        )}
                    </div>
                )}
                <div className="p-2 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 text-xs text-center text-gray-400">
                    Showing {filteredData.length} records
                </div>
            </div>
        </div>
    );
};

export default EmployeeDocumentsReport;
