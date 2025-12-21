import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X, Loader2 } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_BASE_URL;

const FollowUpHistoryModal = ({ isOpen, onClose, quotationId, rentalQuotationId }) => {
    const [loading, setLoading] = useState(false);
    const [history, setHistory] = useState([]);

    useEffect(() => {
        if (isOpen && (quotationId || rentalQuotationId)) {
            fetchHistory();
        }
    }, [isOpen, quotationId, rentalQuotationId]);

    const fetchHistory = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const headers = { Authorization: `Bearer ${token}` };

            let url = '';
            if (quotationId) {
                url = `${API_URL}/sales/followups/by-quotation/${quotationId}`;
            } else if (rentalQuotationId) {
                url = `${API_URL}/sales/followups/by-rental-quotation/${rentalQuotationId}`;
            }

            if (url) {
                const res = await axios.get(url, { headers });
                setHistory(res.data || []);
            }
        } catch (err) {
            console.error("Failed to fetch history", err);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="bg-[#870058] text-white p-4 flex justify-between items-center">
                    <h2 className="text-lg font-bold">FOLLOW UP HISTORY</h2>
                    <button onClick={onClose} className="hover:bg-white/20 p-1 rounded"><X size={20} /></button>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                    <h3 className="text-base font-bold text-gray-800 mb-4 bg-gray-100 p-2 rounded">Previous Follow Up Detail</h3>

                    {loading ? (
                        <div className="flex justify-center items-center p-10">
                            <Loader2 className="animate-spin text-purple-900 w-8 h-8" />
                        </div>
                    ) : (
                        <div className="border rounded-lg overflow-hidden">
                            <table className="w-full text-xs text-left">
                                <thead className="bg-gray-100 text-gray-700 font-bold border-b">
                                    <tr>
                                        <th className="p-3 border-r w-16 text-center">S.No.</th>
                                        <th className="p-3 border-r">Date</th>
                                        <th className="p-3 border-r">Remarks</th>
                                        <th className="p-3 border-r">Next Follow Date</th>
                                        <th className="p-3">Employee</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {history.length === 0 ? (
                                        <tr><td colSpan="5" className="p-4 text-center text-gray-500">No record available</td></tr>
                                    ) : (
                                        history.map((h, index) => (
                                            <tr key={h.id} className="hover:bg-gray-50">
                                                <td className="p-2 text-center border-r">{index + 1}</td>
                                                <td className="p-2 border-r">{new Date(h.createdAt || h.createdDate).toLocaleDateString()}</td>
                                                <td className="p-2 border-r">{h.comment}</td>
                                                <td className="p-2 border-r">{h.nextFollowupDate}</td>
                                                <td className="p-2">{h.employeeName || '-'}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FollowUpHistoryModal;
