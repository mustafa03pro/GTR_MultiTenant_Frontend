import React, { useState, useEffect } from 'react';
import { Download, Loader, AlertCircle } from 'lucide-react';
import axios from 'axios';

const WpsSifReport = () => {
    const [downloading, setDownloading] = useState(false);
    const [loading, setLoading] = useState(false);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    const [error, setError] = useState('');
    const [payrollRun, setPayrollRun] = useState(null);
    const [checkingRun, setCheckingRun] = useState(false);

    // Table Data
    const [tableData, setTableData] = useState([]);
    const [tableHeaders, setTableHeaders] = useState([]);

    const API_URL = import.meta.env.VITE_API_BASE_URL;

    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 7 }, (_, i) => currentYear - 5 + i);

    const months = [
        { value: 1, label: 'January' },
        { value: 2, label: 'February' },
        { value: 3, label: 'March' },
        { value: 4, label: 'April' },
        { value: 5, label: 'May' },
        { value: 6, label: 'June' },
        { value: 7, label: 'July' },
        { value: 8, label: 'August' },
        { value: 9, label: 'September' },
        { value: 10, label: 'October' },
        { value: 11, label: 'November' },
        { value: 12, label: 'December' },
    ];

    // Effect to check for existing payroll run when year/month changes
    useEffect(() => {
        const findAndFetch = async () => {
            setCheckingRun(true);
            setPayrollRun(null);
            setError('');
            setTableData([]);
            setTableHeaders([]); // Clear headers

            try {
                const token = localStorage.getItem('token');
                const response = await axios.get(`${API_URL}/payroll-runs`, {
                    headers: { "Authorization": `Bearer ${token}` }
                });

                const runs = response.data;
                const match = runs.find(r => r.year === selectedYear && r.month === selectedMonth);

                if (match) {
                    if (match.status === 'COMPLETED' || match.status === 'PAID' || match.status === 'GENERATED') {
                        setPayrollRun(match);
                        fetchPreview(match.id);
                    } else {
                        setError(`Payroll run exists but is in '${match.status}' status. SIF file is only available for completed runs.`);
                    }
                }
            } catch (err) {
                console.error("Failed to check payroll runs:", err);
            } finally {
                setCheckingRun(false);
            }
        };

        findAndFetch();
    }, [selectedYear, selectedMonth, API_URL]);

    const fetchPreview = async (runId) => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}/payroll/wps/${runId}/sif`, {
                headers: { "Authorization": `Bearer ${token}` },
                responseType: 'text',
            });

            const content = response.data;
            if (!content) return;

            // Parse SIF Content (Simple CSV/Pipe detection)
            const lines = content.split('\n').filter(line => line.trim() !== '');
            if (lines.length > 0) {
                // heuristic to detect delimiter
                const firstLine = lines[0];
                const delimiter = firstLine.includes(',') ? ',' : '|'; // Common SIF delimiters

                // Assuming first line might NOT be header in standard SIF, but for table display we need something.
                // If it's a standard .csv with header, fine. 
                // If it's specific SIF format (Header Record, Body Records, Footer Record), we might strictly just split.

                // Let's assume user wants to see raw data for now, or we can try to infer headers.
                // Given User Request: "MOL employee ID, IBAN, Salary amount, Salary period"
                // If the file doesn't have headers, we can map manually if we knew the order.
                // For now, let's treat the first line as headers if it looks like text, or generate generic headers.

                const parsedData = lines.map(line => line.split(delimiter).map(cell => cell.trim()));

                // Check if first row looks like headers (string keys) vs data (numbers/IBANs)
                // This is a bit loose, but improves UX if headers are present
                const hasHeaders = parsedData[0].some(cell => isNaN(cell) && cell.length > 0);

                if (hasHeaders) {
                    setTableHeaders(parsedData[0]);
                    setTableData(parsedData.slice(1));
                } else {
                    // Generate generic headers
                    const maxCols = Math.max(...parsedData.map(r => r.length));
                    setTableHeaders(Array.from({ length: maxCols }, (_, i) => `Column ${i + 1}`));
                    setTableData(parsedData);
                }
            }
        } catch (err) {
            console.error("Preview load failed:", err);
            // Don't error out the whole UI, just maybe show data unavailable
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = async () => {
        if (!payrollRun) return;

        setDownloading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}/payroll/wps/${payrollRun.id}/sif`, {
                headers: { "Authorization": `Bearer ${token}` },
                responseType: 'blob',
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;

            const contentDisposition = response.headers['content-disposition'];
            let fileName = `WPS_SIF_${selectedMonth}_${selectedYear}.txt`;
            if (contentDisposition) {
                const fileNameMatch = contentDisposition.match(/filename="?(.+)"?/);
                if (fileNameMatch && fileNameMatch.length === 2)
                    fileName = fileNameMatch[1];
            }

            link.setAttribute('download', fileName);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error("Download failed:", err);
            setError("Failed to download SIF file.");
        } finally {
            setDownloading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">WPS Salary Transfer Report (SIF)</h2>
                    <p className="text-sm text-gray-500">Generate and preview SIF file for bank salary transfers.</p>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end mb-4">
                    {/* Year Selector */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Year</label>
                        <select
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            {years.map(year => (
                                <option key={year} value={year}>{year}</option>
                            ))}
                        </select>
                    </div>

                    {/* Month Selector */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Month</label>
                        <select
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            {months.map(month => (
                                <option key={month.value} value={month.value}>{month.label}</option>
                            ))}
                        </select>
                    </div>

                    <button
                        onClick={handleDownload}
                        disabled={downloading || !payrollRun}
                        className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed h-[42px]"
                    >
                        {downloading ? <Loader className="animate-spin h-4 w-4" /> : <Download size={18} />}
                        <span>Download SIF File</span>
                    </button>
                </div>

                {checkingRun && (
                    <div className="mb-4 text-sm text-gray-500 flex items-center gap-2">
                        <Loader className="animate-spin h-4 w-4" /> Checking payroll status...
                    </div>
                )}

                {!checkingRun && !payrollRun && !error && (
                    <div className="mb-6 p-3 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 rounded-lg flex items-center gap-2 text-sm">
                        <AlertCircle size={16} />
                        <span>No completed payroll run found for this period.</span>
                    </div>
                )}

                {error && (
                    <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg flex items-center gap-2 text-sm">
                        <AlertCircle size={16} />
                        <span>{error}</span>
                    </div>
                )}

                {/* Table View */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center p-12">
                        <Loader className="animate-spin h-8 w-8 text-cyan-600 mb-4" />
                        <p className="text-gray-500">Loading SIF data...</p>
                    </div>
                ) : tableData.length > 0 ? (
                    <div className="overflow-x-auto border rounded-lg mt-4">
                        <table className="w-full text-sm text-left whitespace-nowrap">
                            <thead className="text-xs text-gray-700 uppercase bg-gray-100 dark:bg-gray-700 dark:text-gray-400">
                                <tr>
                                    {tableHeaders.map((header, i) => (
                                        <th key={i} className="px-6 py-3 border-b dark:border-gray-600">{header}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {tableData.map((row, idx) => (
                                    <tr key={idx} className="bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700/50">
                                        {row.map((cell, i) => (
                                            <td key={i} className="px-6 py-4 text-gray-900 dark:text-gray-300 border-r border-gray-100 dark:border-gray-700 last:border-0">
                                                {cell}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : payrollRun && !loading && (
                    <div className="mt-4 p-8 text-center text-gray-500 border rounded-lg border-dashed">
                        No preview data available or file is empty.
                    </div>
                )}

                {tableData.length > 0 && (
                    <div className="p-2 mt-2 text-xs text-center text-gray-400">
                        Showing {tableData.length} rows from SIF file preview
                    </div>
                )}
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-lg border border-blue-100 dark:border-blue-900/30">
                <h4 className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-2">Notice</h4>
                <p className="text-xs text-blue-600 dark:text-blue-400">
                    The preview above parses the raw SIF text file. The actual format is determined by the WpsService in the backend.
                </p>
            </div>
        </div>
    );
};

export default WpsSifReport;
