
import React, { useState } from 'react';
import { Download, Loader, FileSpreadsheet } from 'lucide-react';
import axios from 'axios';

const SummaryReportView = ({ title, description, endpoint, filename }) => {
    const [exporting, setExporting] = useState(false);
    const API_URL = import.meta.env.VITE_API_BASE_URL;

    const handleExport = async () => {
        setExporting(true);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}${endpoint}`, {
                headers: { "Authorization": `Bearer ${token}` },
                responseType: 'blob',
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;

            // Use filename prop or extract from header
            let finalFilename = filename || 'Report.xlsx';
            const contentDisposition = response.headers['content-disposition'];
            if (contentDisposition) {
                const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
                if (filenameMatch && filenameMatch.length === 2)
                    finalFilename = filenameMatch[1];
            }

            link.setAttribute('download', finalFilename);
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
        <div className="flex flex-col h-full p-6 md:p-12 items-center justify-center text-center">
            <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-8">
                <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <FileSpreadsheet size={32} />
                </div>

                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">{title}</h2>
                <p className="text-gray-500 dark:text-gray-400 mb-8">{description}</p>

                <button
                    onClick={handleExport}
                    disabled={exporting}
                    className="w-full flex items-center justify-center gap-3 px-6 py-3.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-md hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    {exporting ? (
                        <>
                            <Loader className="animate-spin h-5 w-5" />
                            <span>Generating Report...</span>
                        </>
                    ) : (
                        <>
                            <Download size={20} />
                            <span>Download Excel Report</span>
                        </>
                    )}
                </button>

                <p className="mt-4 text-xs text-gray-400 dark:text-gray-500">
                    This report will be downloaded as an .xlsx file.
                </p>
            </div>
        </div>
    );
};

export default SummaryReportView;
