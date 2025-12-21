import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X, Loader2, Save } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_BASE_URL;

const FollowUpModal = ({ isOpen, onClose, quotationId, rentalQuotationId, onSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [quotation, setQuotation] = useState(null);
    const [history, setHistory] = useState([]);

    // Form State
    const [formData, setFormData] = useState({
        quotationStatus: '',
        nextFollowupDate: '',
        nextFollowupTime: '',
        comment: ''
    });

    useEffect(() => {
        if (isOpen && (quotationId || rentalQuotationId)) {
            fetchData();
            // Reset form
            setFormData({
                quotationStatus: '',
                nextFollowupDate: '',
                nextFollowupTime: '',
                comment: ''
            });
        }
    }, [isOpen, quotationId, rentalQuotationId]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const headers = { Authorization: `Bearer ${token}` };

            if (quotationId) {
                // Fetch Quotation Details (for items and current status)
                const quoteRes = await axios.get(`${API_URL}/sales/quotations/${quotationId}`, { headers });
                setQuotation(quoteRes.data);
                setFormData(prev => ({ ...prev, quotationStatus: quoteRes.data.status }));

                // Fetch History
                const historyRes = await axios.get(`${API_URL}/sales/followups/by-quotation/${quotationId}`, { headers });
                setHistory(historyRes.data || []);
            } else if (rentalQuotationId) {
                // Fetch Rental Quotation Details
                const quoteRes = await axios.get(`${API_URL}/sales/rental-quotations/${rentalQuotationId}`, { headers });
                setQuotation(quoteRes.data);
                setFormData(prev => ({ ...prev, quotationStatus: quoteRes.data.status }));

                // Fetch History
                const historyRes = await axios.get(`${API_URL}/sales/followups/by-rental-quotation/${rentalQuotationId}`, { headers });
                setHistory(historyRes.data || []);
            }

        } catch (err) {
            console.error("Failed to fetch details", err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const token = localStorage.getItem('token');
            const headers = { Authorization: `Bearer ${token}` };

            // Get current user employee ID if possible, or backend handles it from token
            // Assuming backend might need employeeId explicitly if not extracted from context
            const userStr = localStorage.getItem('user');
            const user = userStr ? JSON.parse(userStr) : null;

            const payload = {
                quotationId: quotationId || null,
                rentalQuotationId: rentalQuotationId || null,
                ...formData,
                employeeId: user?.employeeId // If available in local storage
            };

            await axios.post(`${API_URL}/sales/followups`, payload, { headers });

            // Update parent status if changed
            if (formData.quotationStatus) {
                try {
                    if (rentalQuotationId) {
                        await axios.patch(`${API_URL}/sales/rental-quotations/${rentalQuotationId}/status?status=${formData.quotationStatus}`, null, { headers });
                    } else if (quotationId) {
                        await axios.patch(`${API_URL}/sales/quotations/${quotationId}/status?status=${formData.quotationStatus}`, null, { headers });
                    }
                } catch (statusErr) {
                    console.error("Failed to update parent status", statusErr);
                }
            }

            if (onSuccess) onSuccess();
            onClose();
        } catch (err) {
            console.error("Failed to save follow up", err);
            alert("Failed to save follow up");
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="bg-[#870058] text-white p-4 flex justify-between items-center">
                    <h2 className="text-lg font-bold">FOLLOW UP DETAIL</h2>
                    <button onClick={onClose} className="hover:bg-white/20 p-1 rounded"><X size={20} /></button>
                </div>

                {loading ? (
                    <div className="flex-1 flex justify-center items-center p-20">
                        <Loader2 className="animate-spin text-purple-900 w-8 h-8" />
                    </div>
                ) : (
                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                        {/* Form */}
                        <form id="followup-form" onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">Quotation Status</label>
                                    <select
                                        required
                                        value={formData.quotationStatus}
                                        onChange={e => setFormData({ ...formData, quotationStatus: e.target.value })}
                                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-purple-900"
                                    >
                                        <option value="">Select</option>
                                        <option value="DRAFT">DRAFT</option>
                                        <option value="SENT">SENT</option>
                                        <option value="ACCEPTED">ACCEPTED</option>
                                        <option value="REJECTED">REJECTED</option>
                                        <option value="RENTAL_ORDER">RENTAL ORDER</option>
                                        <option value="RENTAL_INVOICE">RENTAL INVOICE</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">Next Followup Date</label>
                                    <input
                                        type="date"
                                        required
                                        value={formData.nextFollowupDate}
                                        onChange={e => setFormData({ ...formData, nextFollowupDate: e.target.value })}
                                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-purple-900"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">Next Followup Time</label>
                                    <input
                                        type="time"
                                        required
                                        value={formData.nextFollowupTime}
                                        onChange={e => setFormData({ ...formData, nextFollowupTime: e.target.value })}
                                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-purple-900"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1">Comment</label>
                                <textarea
                                    rows="3"
                                    required
                                    value={formData.comment}
                                    onChange={e => setFormData({ ...formData, comment: e.target.value })}
                                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-purple-900"
                                    placeholder="Enter remarks..."
                                ></textarea>
                            </div>
                            <div>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="bg-[#870058] text-white px-6 py-2 rounded text-sm font-bold hover:bg-purple-900 disabled:opacity-50"
                                >
                                    {submitting ? 'Submitting...' : 'Submit'}
                                </button>
                            </div>
                        </form>

                        {/* Items Details */}
                        <div>
                            <h3 className="text-sm font-bold text-gray-700 mb-2 border-b pb-1">Items Details</h3>
                            <div className="bg-gray-50 border rounded-lg overflow-hidden">
                                <table className="w-full text-xs text-left">
                                    <thead className="bg-purple-100 text-purple-900 font-bold">
                                        <tr>
                                            <th className="p-3 border-r w-16 text-center">Sr.No.</th>
                                            <th className="p-3 border-r">Items Details</th>
                                            <th className="p-3 border-r w-24 text-right">Quantity</th>
                                            <th className="p-3 w-32 text-right">Rate</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {quotation?.items?.map((item, index) => (
                                            <tr key={index}>
                                                <td className="p-2 text-center border-r">{index + 1}</td>
                                                <td className="p-2 border-r">
                                                    <div className="font-bold">{item.itemName}</div>
                                                    <div className="text-gray-500">{item.description}</div>
                                                </td>
                                                <td className="p-2 text-right border-r">{item.quantity}</td>
                                                <td className="p-2 text-right">
                                                    {/* Rental items might have rentalValue instead, or salesPrice if mapped differently. Prefer rentalValue if exists (checked schema in RentalQuotationForm), else fallback */}
                                                    {(item.rentalValue || item.unitPrice || 0).toFixed(2)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Previous Follow Up Detail */}
                        <div>
                            <h3 className="text-sm font-bold text-gray-700 mb-2 border-b pb-1">Previous Follow Up Detail</h3>
                            <div className="bg-gray-50 border rounded-lg overflow-hidden">
                                <table className="w-full text-xs text-left">
                                    <thead className="bg-gray-100 text-gray-700 font-bold">
                                        <tr>
                                            <th className="p-3 border-r w-16 text-center">S.No.</th>
                                            <th className="p-3 border-r">Date</th>
                                            <th className="p-3 border-r">Remarks</th>
                                            <th className="p-3 border-r">Next Follow Date</th>
                                            <th className="p-3">Employee</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 bg-white">
                                        {history.length === 0 ? (
                                            <tr><td colSpan="5" className="p-4 text-center text-gray-500">No record available</td></tr>
                                        ) : (
                                            history.map((h, index) => (
                                                <tr key={h.id}>
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
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FollowUpModal;
