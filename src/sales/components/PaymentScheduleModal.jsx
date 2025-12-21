import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X, Loader2, Edit, Trash2 } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_BASE_URL;

const PaymentScheduleModal = ({ isOpen, onClose, rentalSalesOrder, onSuccess }) => {
    console.log("PaymentScheduleModal Rendered", { isOpen, rentalSalesOrder });
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [schedules, setSchedules] = useState([]);

    // Form State
    const [formData, setFormData] = useState({
        id: null,
        dueDate: '',
        amount: '',
        status: 'PENDING',
        note: ''
    });

    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        if (isOpen && rentalSalesOrder?.id) {
            fetchSchedules();
            resetForm();
        }
    }, [isOpen, rentalSalesOrder]);

    const fetchSchedules = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const headers = { Authorization: `Bearer ${token}` };
            const response = await axios.get(`${API_URL}/sales/payment-schedules`, {
                params: { rentalSalesOrderId: rentalSalesOrder.id, size: 100 }, // Fetch all for this order
                headers
            });
            setSchedules(response.data.content || []);
        } catch (err) {
            console.error("Failed to fetch payment schedules", err);
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({
            id: null,
            dueDate: '',
            amount: rentalSalesOrder?.netTotal || '', // Auto-fill amount or remaining balance if we calculate it
            status: 'PENDING',
            note: ''
        });
        setIsEditing(false);
    };

    const handleEdit = (schedule) => {
        setFormData({
            id: schedule.id,
            dueDate: schedule.dueDate,
            amount: schedule.amount,
            status: schedule.status,
            note: schedule.note || ''
        });
        setIsEditing(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this schedule?")) return;
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${API_URL}/sales/payment-schedules/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchSchedules();
        } catch (err) {
            console.error("Failed to delete schedule", err);
            alert("Failed to delete schedule");
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const token = localStorage.getItem('token');
            const headers = { Authorization: `Bearer ${token}` };

            const payload = {
                rentalSalesOrderId: rentalSalesOrder.id,
                customerId: rentalSalesOrder.customerId,
                dueDate: formData.dueDate,
                amount: formData.amount,
                status: formData.status,
                note: formData.note
            };

            if (isEditing && formData.id) {
                await axios.put(`${API_URL}/sales/payment-schedules/${formData.id}`, payload, { headers });
            } else {
                await axios.post(`${API_URL}/sales/payment-schedules`, payload, { headers });
            }

            resetForm();
            fetchSchedules();
            if (onSuccess) onSuccess();
        } catch (err) {
            console.error("Failed to save payment schedule", err);
            alert("Failed to save payment schedule");
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
                    <div>
                        <h2 className="text-lg font-bold">PAYMENT SCHEDULE DETAIL</h2>
                        <div className="text-sm opacity-90 mt-1 flex gap-4">
                            <span>#{rentalSalesOrder?.orderNumber}</span>
                            <span>|</span>
                            <span>{rentalSalesOrder?.customerParty?.companyName || rentalSalesOrder?.customerName}</span>
                            <span>|</span>
                            <span>Total: {rentalSalesOrder?.netTotal?.toLocaleString('en-AE', { style: 'currency', currency: 'AED' })}</span>
                        </div>
                    </div>
                    <button onClick={onClose} className="hover:bg-white/20 p-1 rounded"><X size={20} /></button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-4 bg-gray-50 p-4 rounded border">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1">Due Date</label>
                                <input
                                    type="date"
                                    required
                                    value={formData.dueDate}
                                    onChange={e => setFormData({ ...formData, dueDate: e.target.value })}
                                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-purple-900"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1">Amount</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    required
                                    value={formData.amount}
                                    onChange={e => setFormData({ ...formData, amount: e.target.value })}
                                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-purple-900"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1">Status</label>
                                <select
                                    required
                                    value={formData.status}
                                    onChange={e => setFormData({ ...formData, status: e.target.value })}
                                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-purple-900"
                                >
                                    <option value="PENDING">PENDING</option>
                                    <option value="PAID">PAID</option>
                                    <option value="PARTIAL">PARTIAL</option>
                                    <option value="OVERDUE">OVERDUE</option>
                                </select>
                            </div>
                            <div className="flex items-end">
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="w-full bg-[#870058] text-white px-4 py-2 rounded text-sm font-bold hover:bg-purple-900 disabled:opacity-50"
                                >
                                    {submitting ? 'Saving...' : (isEditing ? 'Update Schedule' : 'Add Schedule')}
                                </button>
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1">Note</label>
                            <textarea
                                rows="2"
                                value={formData.note}
                                onChange={e => setFormData({ ...formData, note: e.target.value })}
                                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-purple-900"
                                placeholder="Enter notes..."
                            ></textarea>
                        </div>
                        {isEditing && (
                            <div className="flex justify-end">
                                <button type="button" onClick={resetForm} className="text-xs text-gray-500 hover:text-gray-700 underline">Cancel Edit</button>
                            </div>
                        )}
                    </form>

                    {/* List */}
                    <div>
                        <h3 className="text-sm font-bold text-gray-700 mb-2 border-b pb-1">Scheduled Payments</h3>
                        <div className="bg-white border rounded-lg overflow-hidden">
                            {loading ? (
                                <div className="flex justify-center p-8"><Loader2 className="animate-spin text-purple-900" /></div>
                            ) : (
                                <table className="w-full text-xs text-left">
                                    <thead className="bg-purple-100 text-purple-900 font-bold">
                                        <tr>
                                            <th className="p-3 border-r w-16 text-center">S.No.</th>
                                            <th className="p-3 border-r">Due Date</th>
                                            <th className="p-3 border-r text-right">Amount</th>
                                            <th className="p-3 border-r text-center">Status</th>
                                            <th className="p-3 border-r">Note</th>
                                            <th className="p-3 border-r">Updated By</th>
                                            <th className="p-3 text-center w-24">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {schedules.length === 0 ? (
                                            <tr><td colSpan="7" className="p-4 text-center text-gray-500">No schedules found</td></tr>
                                        ) : (
                                            schedules.map((schedule, index) => (
                                                <tr key={schedule.id} className="hover:bg-gray-50">
                                                    <td className="p-2 text-center border-r">{index + 1}</td>
                                                    <td className="p-2 border-r">{schedule.dueDate}</td>
                                                    <td className="p-2 border-r text-right">{schedule.amount?.toLocaleString('en-AE', { style: 'currency', currency: 'AED' })}</td>
                                                    <td className="p-2 border-r text-center">
                                                        <span className={`px-2 py-0.5 rounded text-[10px] ${schedule.status === 'PAID' ? 'bg-green-100 text-green-800' :
                                                            schedule.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                                                                'bg-gray-100 text-gray-800'
                                                            }`}>
                                                            {schedule.status}
                                                        </span>
                                                    </td>
                                                    <td className="p-2 border-r">{schedule.note || '-'}</td>
                                                    <td className="p-2 border-r">{schedule.updatedBy || schedule.createdBy || '-'}</td>
                                                    <td className="p-2 text-center flex gap-2 justify-center">
                                                        <button onClick={() => handleEdit(schedule)} className="text-blue-600 hover:text-blue-800"><Edit size={14} /></button>
                                                        <button onClick={() => handleDelete(schedule.id)} className="text-red-600 hover:text-red-800"><Trash2 size={14} /></button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PaymentScheduleModal;
