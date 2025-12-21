import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Edit, Printer, Loader2 } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_BASE_URL;

const DeliveryOrderView = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchOrder = async () => {
            try {
                const token = `Bearer ${localStorage.getItem('token')}`;
                const response = await axios.get(`${API_URL}/sales/delivery-orders/${id}`, { headers: { Authorization: token } });
                setOrder(response.data);
            } catch (err) {
                setError('Failed to fetch delivery order details.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchOrder();
    }, [id]);

    if (loading) return <div className="flex justify-center items-center h-screen"><Loader2 className="h-8 w-8 animate-spin text-blue-500" /></div>;
    if (error) return <div className="p-6 text-red-500">{error}</div>;
    if (!order) return <div className="p-6">Delivery Order not found.</div>;

    return (
        <div className="flex flex-col h-screen bg-slate-50">
            {/* Header */}
            <div className="bg-white shadow-sm p-4 border-b flex items-center justify-between sticky top-0 z-10 print:hidden">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/sales/delivery-orders')} className="p-2 rounded-full hover:bg-slate-100"><ArrowLeft className="h-5 w-5 text-slate-600" /></button>
                    <h1 className="text-xl font-bold text-slate-800">{order.deliveryOrderNumber}</h1>
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${order.status === 'OPEN' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>{order.status}</span>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => navigate(`/sales/delivery-orders/edit/${id}`)} className="btn-secondary flex items-center gap-1"><Edit size={16} /> Edit</button>
                    <button onClick={() => window.print()} className="btn-primary flex items-center gap-1"><Printer size={16} /> Print</button>
                </div>
            </div>

            {/* Content */}
            <main className="flex-grow overflow-y-auto p-6 print:p-0">
                <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-lg p-8 print:shadow-none">
                    {/* Header Details */}
                    <div className="flex justify-between mb-8">
                        <div>
                            <h2 className="text-2xl font-bold text-slate-800 mb-1">Delivery Order</h2>
                            <p className="text-sm text-gray-500">{order.deliveryOrderNumber}</p>
                        </div>
                        <div className="text-right">
                            <h3 className="text-lg font-bold">{order.customerName}</h3>
                            <p className="text-sm text-gray-600">Sales Order: {order.salesOrderNumber || '-'}</p>
                            <p className="text-sm text-gray-600">Date: {new Date(order.deliveryOrderDate).toLocaleDateString()}</p>
                            <p className="text-sm text-gray-600">Shipment Date: {order.shipmentDate ? new Date(order.shipmentDate).toLocaleDateString() : '-'}</p>
                        </div>
                    </div>

                    {/* Items Table */}
                    <table className="w-full text-sm mb-6">
                        <thead>
                            <tr className="bg-gray-100 border-b">
                                <th className="py-2 px-4 text-left">#</th>
                                <th className="py-2 px-4 text-left">Item & Description</th>
                                <th className="py-2 px-4 text-right">Qty</th>
                                <th className="py-2 px-4 text-right">Rate</th>
                                <th className="py-2 px-4 text-right">Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {order.items.map((item, index) => (
                                <tr key={item.id} className="border-b">
                                    <td className="py-2 px-4">{index + 1}</td>
                                    <td className="py-2 px-4">
                                        <div className="font-medium">{item.itemName}</div>
                                        <div className="text-xs text-gray-500">{item.itemCode}</div>
                                    </td>
                                    <td className="py-2 px-4 text-right">{item.quantity}</td>
                                    <td className="py-2 px-4 text-right">{item.rate?.toFixed(2)}</td>
                                    <td className="py-2 px-4 text-right">{item.amount?.toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* Totals */}
                    <div className="flex justify-end">
                        <div className="w-64 space-y-2">
                            <div className="flex justify-between text-sm"><span>Sub Total</span><span>AED {order.subTotal?.toFixed(2)}</span></div>
                            <div className="flex justify-between text-sm"><span>Total Discount</span><span>- AED {order.totalDiscount?.toFixed(2)}</span></div>
                            <div className="flex justify-between text-sm"><span>Total Tax</span><span>AED {order.totalTax?.toFixed(2)}</span></div>
                            <div className="flex justify-between text-sm"><span>Other Charges</span><span>AED {order.otherCharges?.toFixed(2)}</span></div>
                            <div className="flex justify-between font-bold border-t pt-2"><span>Net Total</span><span>AED {order.netTotal?.toFixed(2)}</span></div>
                        </div>
                    </div>

                    {/* Footer - Terms & Notes */}
                    <div className="mt-8 grid grid-cols-2 gap-8">
                        <div>
                            <h4 className="font-bold text-sm mb-2">Terms & Conditions</h4>
                            <p className="text-xs text-gray-600 whitespace-pre-wrap">{order.termsAndConditions || '-'}</p>
                        </div>
                        <div>
                            <h4 className="font-bold text-sm mb-2">Notes</h4>
                            <p className="text-xs text-gray-600 whitespace-pre-wrap">{order.notes || '-'}</p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default DeliveryOrderView;
