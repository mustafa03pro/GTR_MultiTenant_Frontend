import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Loader2, ArrowLeft, Eye } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_BASE_URL;

const RentalItemReceivedByOrder = () => {
    const { orderId } = useParams();
    const navigate = useNavigate();
    const [receipts, setReceipts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchReceipts = async () => {
            setLoading(true);
            try {
                const token = localStorage.getItem('token');
                if (!token) throw new Error("No token found");

                const response = await axios.get(`${API_URL}/sales/rental-item-received/by-order/${orderId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                setReceipts(response.data || []);
                setError(null);
            } catch (err) {
                console.error("Error fetching receipts:", err);
                setError("Failed to fetch received items.");
            } finally {
                setLoading(false);
            }
        };

        fetchReceipts();
    }, [orderId]);

    if (loading) return <div className="flex justify-center items-center h-screen"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>;
    if (error) return <div className="p-8 text-center text-red-600">{error}</div>;

    return (
        <div className="flex flex-col h-full bg-slate-50 min-h-screen">
            {/* Header */}
            <div className="bg-white border-b shadow-sm">
                <div className="px-6 py-2 text-xs text-gray-500 flex items-center gap-1">
                    <span className="cursor-pointer hover:text-blue-600" onClick={() => navigate('/sales')}>Sales</span> &gt;
                    <span className="cursor-pointer hover:text-blue-600" onClick={() => navigate('/sales/rental-item-received')}>Item Receipts</span> &gt;
                    <span className="font-medium text-gray-700">Receipts for Order #{orderId}</span>
                </div>
                <div className="px-6 py-3 bg-primary text-white flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate(-1)} className="hover:bg-white/20 p-1 rounded-full"><ArrowLeft /></button>
                        <h1 className="text-xl font-semibold">Received Items History</h1>
                    </div>
                </div>
            </div>

            <div className="p-6">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-100 text-gray-700 font-bold border-b">
                                <tr>
                                    <th className="px-4 py-3 border-r w-16 text-center">S.No.</th>
                                    <th className="px-4 py-3 border-r">Date</th>
                                    <th className="px-4 py-3 border-r">Received ID</th>
                                    <th className="px-4 py-3 border-r">Customer</th>
                                    <th className="px-4 py-3 border-r text-center">Items Count</th>
                                    <th className="px-4 py-3 text-center w-32">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {receipts.length === 0 ? (
                                    <tr><td colSpan="6" className="px-4 py-8 text-center text-gray-500">No received items found for this order.</td></tr>
                                ) : (
                                    receipts.map((receipt, index) => (
                                        <tr key={receipt.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-4 py-3 text-center text-gray-500 border-r">{index + 1}</td>
                                            <td className="px-4 py-3 text-gray-600 border-r">{receipt.doDate ? new Date(receipt.doDate).toLocaleDateString() : '-'}</td>
                                            <td className="px-4 py-3 text-gray-800 font-medium border-r">{receipt.id}</td>
                                            <td className="px-4 py-3 text-gray-600 border-r">{receipt.customerName}</td>
                                            <td className="px-4 py-3 text-center border-r">{receipt.items?.length || 0}</td>
                                            <td className="px-4 py-3 text-center">
                                                <button
                                                    onClick={() => navigate(`/sales/rental-item-received/${receipt.id}`)}
                                                    className="bg-white border border-gray-300 text-gray-700 px-3 py-1.5 rounded text-xs hover:bg-gray-50 flex items-center justify-center gap-2 mx-auto transition-colors"
                                                >
                                                    <Eye size={14} /> View
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RentalItemReceivedByOrder;
