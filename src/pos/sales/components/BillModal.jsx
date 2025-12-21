import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X, User, Printer, CreditCard, DollarSign, Loader, ParkingSquare } from 'lucide-react';
import { formatPrice, formatVariantAttributes, constructImageUrl } from '../utils';

const API_URL = import.meta.env.VITE_API_BASE_URL;

const BillModal = ({
    isOpen,
    onClose,
    cart,
    customer,
    subtotal,
    tax,
    discountCents,
    total,
    onProcessSale,
    onOpenDiscountModal,
    onParkSale,
    loading,
    initialOrderId,
    initialDetails
}) => {
    const [orderId, setOrderId] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('CASH');
    const [receivedAmount, setReceivedAmount] = useState('');
    const [companyInfo, setCompanyInfo] = useState(null);

    // New Fields
    const [orderType, setOrderType] = useState('DINE_IN');
    const [adultsCount, setAdultsCount] = useState(0);
    const [kidsCount, setKidsCount] = useState(0);
    const [salesSource, setSalesSource] = useState('POS');

    useEffect(() => {
        const fetchCompanyInfo = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await axios.get(`${API_URL}/company-info`, {
                    headers: { "Authorization": `Bearer ${token}` }
                });
                setCompanyInfo(response.data);
            } catch (error) {
                console.error("Error fetching company info for receipt:", error);
            }
        };

        fetchCompanyInfo();
    }, []);



    useEffect(() => {
        if (isOpen) {
            setOrderId(initialOrderId || `ORD-${Date.now().toString().slice(-6)}`);
            // Reset payment fields
            setReceivedAmount('');
            // Reset or Set details
            setOrderType(initialDetails?.orderType || 'DINE_IN');
            setAdultsCount(initialDetails?.adultsCount || 0);
            setKidsCount(initialDetails?.kidsCount || 0);
            setSalesSource(initialDetails?.salesSource || 'POS');
        }
    }, [isOpen, initialOrderId, initialDetails]);

    const balanceAmount = total;
    const changeAmount = receivedAmount ? (parseFloat(receivedAmount) * 100) - total : 0;

    const handlePay = () => {
        if (loading) return;
        onProcessSale(orderId, {
            method: paymentMethod,
            amountCents: paymentMethod === 'CASH' && receivedAmount ? parseFloat(receivedAmount) * 100 : total,
            reference: paymentMethod === 'CARD' ? 'CARD_TRANSACTION' : null
        }, {
            orderType, adultsCount, kidsCount, salesSource
        });
    };

    const handlePrintOrder = () => {
        window.print();
    };

    if (!isOpen) return null;

    return (
        <>
            <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4 print:hidden" onClick={onClose}>
                <div id="bill-modal-content" className="bg-white rounded-lg shadow-xl w-full max-w-4xl flex max-h-[90vh]" onClick={e => e.stopPropagation()}>
                    {/* Left Side: Sale Summary */}
                    <div className="w-3/5 flex flex-col border-r border-slate-200">
                        <div className="p-4 border-b">
                            <h3 className="text-xl font-semibold">Sale Summary</h3>
                            <div className="flex justify-between items-center text-sm text-slate-500 mt-1">
                                <span>Order ID: <span className="font-medium text-slate-700">{orderId}</span></span>
                                <div className="flex items-center gap-2">
                                    <User size={14} />
                                    <span>{customer?.name || 'Walk-in Customer'}</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex-grow overflow-y-auto p-4 space-y-2">
                            {/* Order Details Inputs */}
                            <div className="p-2 mb-2 bg-slate-50 border rounded-lg text-sm grid grid-cols-2 gap-3">
                                <div className="col-span-2 flex gap-2">
                                    {['DINE_IN', 'TAKEAWAY', 'DELIVERY'].map(type => (
                                        <button
                                            key={type}
                                            onClick={() => setOrderType(type)}
                                            className={`flex-1 py-1.5 rounded-md border text-xs font-medium transition-colors ${orderType === type
                                                ? 'bg-blue-600 text-white border-blue-600'
                                                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                                                }`}
                                        >
                                            {type.replace('_', ' ')}
                                        </button>
                                    ))}
                                </div>
                                {orderType === 'DINE_IN' && (
                                    <>
                                        <div className="flex items-center gap-2">
                                            <span className="text-slate-500 w-16">Adults:</span>
                                            <div className="flex items-center border rounded-md bg-white">
                                                <button onClick={() => setAdultsCount(Math.max(0, adultsCount - 1))} className="px-2 py-1 hover:bg-slate-100">-</button>
                                                <input
                                                    type="number"
                                                    value={adultsCount}
                                                    onChange={(e) => setAdultsCount(parseInt(e.target.value) || 0)}
                                                    className="w-12 text-center focus:outline-none"
                                                />
                                                <button onClick={() => setAdultsCount(adultsCount + 1)} className="px-2 py-1 hover:bg-slate-100">+</button>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-slate-500 w-16">Kids:</span>
                                            <div className="flex items-center border rounded-md bg-white">
                                                <button onClick={() => setKidsCount(Math.max(0, kidsCount - 1))} className="px-2 py-1 hover:bg-slate-100">-</button>
                                                <input
                                                    type="number"
                                                    value={kidsCount}
                                                    onChange={(e) => setKidsCount(parseInt(e.target.value) || 0)}
                                                    className="w-12 text-center focus:outline-none"
                                                />
                                                <button onClick={() => setKidsCount(kidsCount + 1)} className="px-2 py-1 hover:bg-slate-100">+</button>
                                            </div>
                                        </div>
                                    </>
                                )}
                                <div className="col-span-2 flex items-center gap-2">
                                    <span className="text-slate-500 w-16">Source:</span>
                                    <select
                                        value={salesSource}
                                        onChange={(e) => setSalesSource(e.target.value)}
                                        className="flex-1 p-1 border rounded-md text-slate-700 focus:outline-none focus:border-blue-500 bg-white"
                                    >
                                        <option value="POS">POS</option>
                                        <option value="Phone">Phone</option>
                                        <option value="Online">Online</option>
                                        <option value="Aggregator">Aggregator</option>
                                    </select>
                                </div>
                            </div>

                            {cart.map(item => (
                                <div key={item.productVariantId} className="flex justify-between items-center text-sm">
                                    <div>
                                        <p className="font-medium">{item.productName}</p>
                                        <p className="text-xs text-slate-500">{formatVariantAttributes(item.attributes)}</p>
                                    </div>
                                    <div className="text-right">
                                        <p>{item.quantity} x {formatPrice(item.priceCents)}</p>
                                        <p className="font-semibold">{formatPrice(item.quantity * item.priceCents)}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="p-4 border-t bg-slate-50 space-y-1 text-sm">
                            <div className="flex justify-between"><span className="text-slate-600">Subtotal</span><span className="font-medium">{formatPrice(subtotal)}</span></div>
                            {discountCents > 0 && <div className="flex justify-between text-green-600"><span className="font-medium">Discount</span><span className="font-medium">-{formatPrice(discountCents)}</span></div>}
                            <div className="flex justify-between"><span className="text-slate-600">Delivery Charge</span><span>AED 0.00</span></div>
                            <div className="flex justify-between"><span className="text-slate-600">Tax (estimated)</span><span>{formatPrice(tax)}</span></div>
                            <div className="flex justify-between text-lg font-bold pt-2 border-t mt-2"><span >Total</span><span>{formatPrice(total)}</span></div>
                        </div>
                        <div className="p-4 border-t grid grid-cols-4 gap-2">
                            <button className="btn-secondary text-sm" onClick={onClose}>Close</button>
                            <button className="btn-secondary text-sm" onClick={onOpenDiscountModal}>Discount</button>
                            <button onClick={handlePrintOrder} className="btn-secondary text-sm flex items-center justify-center gap-2">
                                <Printer size={14} /> Print Order
                            </button>
                            <button onClick={() => onParkSale(orderId, { orderType, adultsCount, kidsCount, salesSource })} className="btn-primary text-sm flex items-center justify-center gap-2" disabled={loading}>
                                <ParkingSquare size={14} /> Park Sale
                            </button>
                        </div>
                    </div>

                    {/* Right Side: Payment */}
                    <div className="w-2/5 flex flex-col bg-slate-50">
                        <div className="p-4 border-b border-slate-200 flex justify-end">
                            <button className="btn-secondary text-sm" onClick={() => alert('New Sale clicked')}>New Sale</button>
                        </div>
                        <div className="p-6 space-y-4 flex-grow">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="label">Paid Amount</label>
                                    <p className="input-display">{formatPrice(receivedAmount ? parseFloat(receivedAmount) * 100 : 0)}</p>
                                </div>
                                <div>
                                    <label className="label">Balance Amount</label>
                                    <p className="input-display font-bold text-blue-600">{formatPrice(balanceAmount)}</p>
                                </div>
                            </div>
                            <div>
                                <label className="label">Received Amount</label>
                                <input
                                    type="number"
                                    value={receivedAmount}
                                    onChange={e => setReceivedAmount(e.target.value)}
                                    className="input text-lg text-center"
                                    placeholder="0.00"
                                    disabled={paymentMethod !== 'CASH'}
                                />
                            </div>
                            <div>
                                <label className="label">Change Amount</label>
                                <p className="input-display font-bold text-green-600">{formatPrice(changeAmount > 0 ? changeAmount : 0)}</p>
                            </div>

                            <div className="pt-4">
                                <label className="label">Mode of Payment</label>
                                <div className="flex gap-2 mt-1">
                                    <button onClick={() => setPaymentMethod('CASH')} className={`flex-1 btn-secondary flex items-center justify-center gap-2 ${paymentMethod === 'CASH' && 'ring-2 ring-blue-500'}`}>
                                        <DollarSign size={16} /> Cash
                                    </button>
                                    <button onClick={() => setPaymentMethod('CARD')} className={`flex-1 btn-secondary flex items-center justify-center gap-2 ${paymentMethod === 'CARD' && 'ring-2 ring-blue-500'}`}>
                                        <CreditCard size={16} /> Card
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div className="p-4">
                            <button onClick={handlePay} className="w-full btn-primary text-lg" disabled={loading}>
                                {loading ? <Loader className="animate-spin h-5 w-5 mr-2" /> : null}
                                Pay
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Printable Receipt Section */}
            <div className="hidden print:block fixed inset-0 bg-white z-[9999] p-8 text-black font-mono">
                {/* Header */}
                <div className="text-center mb-6 pb-4 border-b border-black border-dashed">
                    {companyInfo?.logoUrl && (
                        <img
                            src={constructImageUrl(companyInfo.logoUrl)}
                            alt="Logo"
                            className="h-16 mx-auto mb-2 object-contain grayscale"
                        />
                    )}
                    <h1 className="text-2xl font-bold uppercase tracking-wider mb-1">{companyInfo?.companyName || 'POS System'}</h1>
                    <p className="text-sm">{companyInfo?.address}</p>
                    <p className="text-sm">{[companyInfo?.city, companyInfo?.state, companyInfo?.country].filter(Boolean).join(', ')}</p>
                    <p className="text-sm mt-1">
                        {[
                            companyInfo?.phone && `Tel: ${companyInfo.phone}`,
                            companyInfo?.email && `Email: ${companyInfo.email}`
                        ].filter(Boolean).join(' | ')}
                    </p>
                    {companyInfo?.pan && <p className="text-sm">TRN: {companyInfo.pan}</p>}
                </div>

                {/* Metadata */}
                <div className="mb-6 text-sm flex justify-between">
                    <div>
                        <p><span className="font-bold">Order ID:</span> {orderId}</p>
                        <p><span className="font-bold">Date:</span> {new Date().toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                        <p><span className="font-bold">Customer:</span> {customer?.name || 'Walk-in'}</p>
                        <p><span className="font-bold">Cashier:</span> Admin</p>
                    </div>
                </div>

                {/* Items Table */}
                <table className="w-full text-sm mb-6">
                    <thead>
                        <tr className="border-b border-black border-dashed">
                            <th className="text-left py-2">Item</th>
                            <th className="text-center py-2">Qty</th>
                            <th className="text-right py-2">Price</th>
                            <th className="text-right py-2">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {cart.map((item, index) => (
                            <tr key={index} className="border-b border-slate-200">
                                <td className="py-2">
                                    <div className="font-bold">{item.productName}</div>
                                    {item.attributes && Object.keys(item.attributes).length > 0 && (
                                        <div className="text-xs text-slate-500">{formatVariantAttributes(item.attributes)}</div>
                                    )}
                                </td>
                                <td className="text-center py-2 align-top">{item.quantity}</td>
                                <td className="text-right py-2 align-top">{formatPrice(item.priceCents)}</td>
                                <td className="text-right py-2 align-top font-medium">{formatPrice(item.quantity * item.priceCents)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Financials */}
                <div className="flex justify-end mb-6">
                    <div className="w-1/2 space-y-1 text-sm">
                        <div className="flex justify-between">
                            <span>Subtotal:</span>
                            <span>{formatPrice(subtotal)}</span>
                        </div>
                        {discountCents > 0 && (
                            <div className="flex justify-between">
                                <span>Discount:</span>
                                <span>-{formatPrice(discountCents)}</span>
                            </div>
                        )}
                        <div className="flex justify-between">
                            <span>Tax (Included):</span>
                            <span>{formatPrice(tax)}</span>
                        </div>
                        <div className="flex justify-between font-bold text-lg border-t border-black border-dashed pt-2 mt-2">
                            <span>Total:</span>
                            <span>{formatPrice(total)}</span>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="text-center text-xs mt-8 border-t border-black border-dashed pt-4">
                    <p className="font-bold mb-1">Thank you for your business!</p>
                    <p>Please keep this receipt for warranty purposes.</p>
                </div>
            </div>
        </>
    );
};

export default BillModal;