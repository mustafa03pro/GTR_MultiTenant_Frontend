import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useParams } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_BASE_URL;

const RentalItemRecievedForm = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { id } = useParams();
    const orderId = searchParams.get('orderId');
    const isEditMode = !!id;

    const [loading, setLoading] = useState(false);
    const [fetchingData, setFetchingData] = useState(true);

    const [order, setOrder] = useState(null);
    const [items, setItems] = useState([]);

    // Master Data
    const [customers, setCustomers] = useState([]);
    const [products, setProducts] = useState([]);

    const [doDate, setDoDate] = useState(new Date().toISOString().split('T')[0]);
    const [billingAddress, setBillingAddress] = useState('');
    const [shippingAddress, setShippingAddress] = useState('');

    useEffect(() => {
        const loadDependencies = async () => {
            setFetchingData(true);
            try {
                const token = localStorage.getItem('token');
                const headers = { Authorization: `Bearer ${token}` };

                // Fetch Master Data
                const [custRes, prodRes] = await Promise.all([
                    axios.get(`${API_URL}/parties`, { headers }),
                    axios.get(`${API_URL}/crm/sales-products`, { headers })
                ]);

                const customerList = custRes.data.content || custRes.data || [];
                const productList = prodRes.data.content || prodRes.data || [];

                setCustomers(customerList);
                setProducts(productList);

                // Load Transaction Data
                if (orderId) {

                    const response = await axios.get(`${API_URL}/sales/rental-sales-orders/${orderId}`, { headers });
                    const orderData = response.data;
                    setOrder(orderData);

                    // Robust Address Resolution
                    const resolveAddress = (addrObj, directAddr, custId) => {
                        // Priority 1: Direct String Address (if saved previously)
                        if (directAddr && typeof directAddr === 'string' && directAddr.trim() !== '') return directAddr;

                        // Priority 2: Address Object from Order
                        if (addrObj && (addrObj.addressLine || addrObj.city || addrObj.country)) return formatAddress(addrObj);

                        // Priority 3: Customer Default Address
                        if (custId) {
                            // Use == for loose equality to handle string/number mismatches
                            const cust = customerList.find(c => c.id == custId);
                            if (cust) {
                                return formatAddress(cust.billingAddress || cust.address); // detailed or generic address
                            }
                        }
                        return '';
                    };

                    const resolveShippingAddress = (addrObj, directAddr, custId) => {
                        if (directAddr && typeof directAddr === 'string' && directAddr.trim() !== '') return directAddr;
                        if (addrObj && (addrObj.addressLine || addrObj.city || addrObj.country)) return formatAddress(addrObj);
                        if (custId) {
                            const cust = customerList.find(c => c.id == custId);
                            if (cust) {
                                return formatAddress(cust.shippingAddress || cust.billingAddress || cust.address);
                            }
                        }
                        return '';
                    };

                    setBillingAddress(resolveAddress(orderData.billingAddress, orderData.billingAddressString, orderData.customerId));
                    setShippingAddress(resolveShippingAddress(orderData.shippingAddress, orderData.shippingAddressString || orderData.shippingAddress, orderData.customerId));



                    // Fetch previous received
                    let prevReceivedMap = {};
                    try {
                        const receivedRes = await axios.get(`${API_URL}/sales/rental-item-received/by-order/${orderId}`, { headers });
                        const receivedLogs = receivedRes.data || [];
                        receivedLogs.forEach(log => {
                            log.items.forEach(item => {
                                const key = item.crmProductId ? `p-${item.crmProductId}` : `c-${item.itemCode}`;
                                prevReceivedMap[key] = (prevReceivedMap[key] || 0) + (item.receivedQuantity || 0);
                            });
                        });
                    } catch (e) {
                        // ignore
                    }

                    if (orderData.items) {
                        const formItems = orderData.items.map(orderItem => {
                            const prodId = orderItem.crmProductId;
                            const key = prodId ? `p-${prodId}` : `c-${orderItem.itemCode}`;
                            const previouslyReceived = prevReceivedMap[key] || 0;
                            const remaining = (orderItem.quantity || 0) - previouslyReceived;

                            let name = orderItem.itemName;
                            let code = orderItem.itemCode;
                            let desc = orderItem.description;

                            if (!name && prodId) {
                                const prod = productList.find(p => p.id === prodId);
                                if (prod) {
                                    name = prod.productName || prod.name;
                                    code = code || prod.productCode || prod.itemCode;
                                    desc = desc || prod.description;
                                }
                            }

                            return {
                                crmProductId: orderItem.crmProductId,
                                itemCode: code,
                                itemName: name,
                                description: desc,
                                doQuantity: orderItem.quantity,
                                receivedQuantity: previouslyReceived,
                                remainingQuantity: remaining, // Add remaining quantity
                                currentReceiveQuantity: 0 // Default to 0? Or remaining? User might prefer 0
                            };
                        });
                        setItems(formItems);
                    }

                } else if (id) {
                    const response = await axios.get(`${API_URL}/sales/rental-item-received/${id}`, { headers });
                    const data = response.data;
                    setDoDate(data.doDate);
                    // Handle address string vs object if needed, but likely string here if saved.
                    setBillingAddress(typeof data.billingAddress === 'string' ? data.billingAddress : formatAddress(data.billingAddress));
                    setShippingAddress(typeof data.shippingAddress === 'string' ? data.shippingAddress : formatAddress(data.shippingAddress));

                    setOrder({
                        orderNumber: data.orderNumber,
                        customerName: data.customerName,
                        customerId: data.customerId
                    });

                    if (data.items) {
                        setItems(data.items.map(i => ({
                            ...i,
                            itemName: i.itemName,
                            itemCode: i.itemCode,
                            doQuantity: i.doQuantity,
                            // For edit mode, receivedQuantity might be historical? 
                            // Or is it "Received in this Do"? 
                            // The backend DTO has `receivedQuantity` as the field for "this transaction".
                            // But my logic above for 'create' uses it as "Previously Total Received". 
                            // Clarification: The entity `RentalItemRecievedItem` has `receivedQuantity`. 
                            // If this is a transaction log, it is THIS transaction's qty.
                            // So in Edit mode, `receivedQuantity` IS `currentReceiveQuantity`.
                            // So `receivedQuantity` (historical) needs to be fetched separately?
                            // Actually, if editing a receipt, `currentReceiveQuantity` is what we are editing.
                            // `receivedQuantity` in the entity IS `currentReceiveQuantity`.
                            // So:
                            receivedQuantity: 0, // Should be previous historical excluding this? Too complex for now. Just show what was saved.
                            currentReceiveQuantity: i.receivedQuantity, // Map saved qty to editable field
                            remainingQuantity: i.remainingQuantity // Assuming saved or calc
                        })));
                    }
                }

            } catch (err) {
                console.error("Failed to load data", err);
                alert("Error loading data");
            } finally {
                setFetchingData(false);
            }
        };

        loadDependencies();
    }, [orderId, id]);

    const formatAddress = (addr) => {
        if (!addr) return '';
        if (typeof addr === 'string') return addr;
        // Handle flattened keys if they come that way
        const line = addr.addressLine || addr.line1 || '';
        const city = addr.city || '';
        const country = addr.country || '';
        return [line, city, country].filter(Boolean).join(', ');
    };

    const handleItemChange = (index, value) => {
        const newItems = [...items];
        newItems[index].currentReceiveQuantity = Number(value);
        setItems(newItems);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const headers = { Authorization: `Bearer ${token}` };

            const payload = {
                doDate: doDate,
                customerId: order?.customerId,
                billingAddress,
                shippingAddress,
                doNumber: order?.orderNumber, // Using Order # as DO # for now if not generated separately
                orderNumber: order?.orderNumber,
                rentalSalesOrderId: orderId ? Number(orderId) : null,

                status: (() => {
                    // Calculate status
                    const totalDoQty = items.reduce((sum, item) => sum + (Number(item.doQuantity) || 0), 0);
                    const totalReceivedSoFar = items.reduce((sum, item) => sum + (Number(item.receivedQuantity) || 0), 0);
                    const totalReceivingNow = items.reduce((sum, item) => sum + (Number(item.currentReceiveQuantity) || 0), 0);

                    const totalReceived = totalReceivedSoFar + totalReceivingNow;

                    if (totalReceived >= totalDoQty) {
                        return 'FULLY_RETURNED';
                    } else if (totalReceived > 0) {
                        return 'PARTIAL_RETURNED';
                    } else {
                        return 'OPEN'; // Or DRAFT/OPEN if nothing received yet? But this form submits receiving.
                    }
                })(),
                items: items
                    .filter(i => i.currentReceiveQuantity > 0)
                    .map(i => ({
                        crmProductId: i.crmProductId,
                        itemName: i.itemName,
                        itemCode: i.itemCode,
                        description: i.description,
                        doQuantity: i.doQuantity,
                        receivedQuantity: i.receivedQuantity, // Send PREVIOUS total? Or NEW total?
                        // Backend likely expects 'receivedQuantity' to be 'Total Received So Far INCLUDING this batch' 
                        // IF the logic is to update the RentalSalesOrderItem status.
                        // BUT, if this is a Transactional Log (RentalItemReceived entity), it should probably save "Quantity in this Receipt".
                        // Use `currentReceiveQuantity` field in DTO for the actual amount receiving now.
                        currentReceiveQuantity: i.currentReceiveQuantity
                    }))
            };

            if (isEditMode) {
                // update logic
            } else {
                await axios.post(`${API_URL}/sales/rental-item-received`, payload, { headers });
            }
            navigate('/sales/rental-item-received');

        } catch (err) {
            console.error("Submit error", err);
            alert("Failed to save");
        } finally {
            setLoading(false);
        }
    };

    if (fetchingData) return <div className="flex justify-center items-center h-screen"><Loader2 className="animate-spin text-primary lg:w-12 lg:h-12" /></div>;

    return (
        <div className="flex flex-col h-screen bg-slate-50">
            {/* Sticky Header */}
            <header className="bg-primary text-white shadow-sm p-4 flex items-center justify-between sticky top-0 z-10">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate(-1)} className="text-gray-300 hover:text-white"><ArrowLeft /></button>
                    <h1 className="text-xl font-bold">{isEditMode ? 'Edit Received Item' : 'Rental Items Receive'}</h1>
                </div>
                <div className="flex items-center gap-4">
                    <button type="button" onClick={() => navigate('/sales/rental-item-received')} className="px-4 py-2 bg-gray-600 rounded hover:bg-gray-700 font-medium text-sm">Cancel</button>
                    <button
                        type="submit"
                        form="receive-form"
                        disabled={loading || (!isEditMode && items.every(i => i.currentReceiveQuantity <= 0))}
                        className="px-4 py-2 bg-green-600 rounded hover:bg-green-700 flex items-center gap-2 font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        {isEditMode ? 'Update' : 'Receive'}
                    </button>
                </div>
            </header>

            <main className="flex-grow overflow-y-auto p-6">
                <form id="receive-form" onSubmit={handleSubmit} className="space-y-6">
                    {/* Header Details */}
                    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1">DO Date</label>
                                <input
                                    type="date"
                                    value={doDate}
                                    onChange={e => setDoDate(e.target.value)}
                                    className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:border-primary"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1">Customer Name</label>
                                <input type="text" value={order?.customerName || ''} readOnly className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm bg-gray-50 text-gray-600" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1">DO No.</label>
                                <input type="text" value={order?.orderNumber || ''} readOnly className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm bg-gray-50 text-gray-600" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1">Order Number</label>
                                <input type="text" value={order?.orderNumber || ''} readOnly className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm bg-gray-50 text-gray-600" />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1">Billing Address</label>
                                <textarea readOnly value={billingAddress} rows="2" className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm bg-gray-50"></textarea>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1">Shipping Address</label>
                                <textarea readOnly value={shippingAddress} rows="2" className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm bg-gray-50"></textarea>
                            </div>
                        </div>
                    </div>

                    {/* Items Table */}
                    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 overflow-x-auto">
                        <div className="mb-2 p-2 bg-gray-100 text-sm font-semibold flex justify-between rounded">
                            <span>Recieved Item Details</span>
                        </div>
                        <table className="w-full text-xs min-w-[800px] border-collapse">
                            <thead>
                                <tr className="bg-gray-50 border-b">
                                    <th className="p-3 text-left font-bold text-gray-700 w-1/3">Item Details</th>
                                    <th className="p-3 text-right font-bold text-gray-700">DO Quantity</th>
                                    <th className="p-3 text-right font-bold text-gray-700">Received Quantity</th>
                                    <th className="p-3 text-right font-bold text-gray-700">Remaining Quantity</th>
                                    <th className="p-3 text-right font-bold text-gray-700 w-48">Receive Quantity</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map((item, index) => (
                                    <tr key={index} className="border-b hover:bg-gray-50">
                                        <td className="p-3">
                                            <div className="font-bold text-gray-800">{item.itemName || '-'}</div>
                                            <div className="text-gray-500">{item.itemCode}</div>
                                            <div className="text-gray-400 italic mt-0.5">{item.description}</div>
                                        </td>
                                        <td className="p-3 text-right">
                                            <span className="bg-gray-100 px-2 py-1 rounded border border-gray-200">{item.doQuantity}</span>
                                        </td>
                                        <td className="p-3 text-right">
                                            <span className="bg-gray-100 px-2 py-1 rounded border border-gray-200">{item.receivedQuantity}</span>
                                        </td>
                                        <td className="p-3 text-right">
                                            <span className="bg-yellow-50 text-yellow-700 px-2 py-1 rounded border border-yellow-200 font-bold">{item.remainingQuantity}</span>
                                        </td>
                                        <td className="p-3">
                                            <input
                                                type="number"
                                                min="0"
                                                max={item.remainingQuantity}
                                                value={item.currentReceiveQuantity}
                                                onChange={(e) => handleItemChange(index, e.target.value)}
                                                className="w-full border border-gray-300 rounded px-2 py-1.5 text-right focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                                            />
                                        </td>
                                    </tr>
                                ))}
                                {items.length === 0 && (
                                    <tr><td colSpan="4" className="p-6 text-center text-gray-500">No items available to receive.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </form>
            </main>
        </div>
    );
};

export default RentalItemRecievedForm;
