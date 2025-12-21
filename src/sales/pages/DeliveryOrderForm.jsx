import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Save, Loader2, Plus, Trash2, Paperclip } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_BASE_URL;

const DeliveryOrderForm = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const [searchParams] = useSearchParams();
    const salesOrderId = searchParams.get('salesOrderId');
    const isEditing = !!id;

    const [formData, setFormData] = useState({
        deliveryOrderDate: '',
        shipmentDate: '',
        customerId: '',
        salesOrderId: '',
        reference: '',
        poNumber: '',
        salespersonId: '',
        status: 'DRAFT',
        items: [],
        totalDiscount: 0,
        otherCharges: 0,
        termsAndConditions: '',
        notes: '',
        emailTo: '',
        template: 'Standard',
        // UI only
        totalDiscountPercentage: 0,
        otherChargesPercentage: 0
    });

    const [selectData, setSelectData] = useState({ customers: [], products: [], categories: [], employees: [], salesOrders: [] });
    const [loading, setLoading] = useState(true);
    const [attachmentFiles, setAttachmentFiles] = useState([]);
    const [error, setError] = useState(null);

    const fetchDependencies = useCallback(async () => {
        setLoading(true);
        try {
            const token = `Bearer ${localStorage.getItem('token')}`;
            const [customersRes, productsRes, categoriesRes, employeesRes, salesOrdersRes] = await Promise.all([
                axios.get(`${API_URL}/parties`, { headers: { Authorization: token } }),
                axios.get(`${API_URL}/crm/sales-products`, { headers: { Authorization: token }, params: { size: 1000 } }),
                axios.get(`${API_URL}/production/categories`, { headers: { Authorization: token } }),
                axios.get(`${API_URL}/employees/all`, { headers: { Authorization: token } }),
                axios.get(`${API_URL}/sales/orders`, { headers: { Authorization: token } }) // Fetch generic list for dropdown
            ]);

            setSelectData({
                customers: customersRes.data.content || [],
                products: productsRes.data.content || [],
                categories: categoriesRes.data || [],
                employees: employeesRes.data || [],
                salesOrders: salesOrdersRes.data.content || []
            });

            if (isEditing) {
                const orderRes = await axios.get(`${API_URL}/sales/delivery-orders/${id}`, { headers: { Authorization: token } });
                const data = orderRes.data;
                const subTotal = data.subTotal || 0;
                const discountPercentage = subTotal > 0 ? ((data.totalDiscount || 0) / subTotal) * 100 : 0;
                const chargesPercentage = subTotal > 0 ? ((data.otherCharges || 0) / subTotal) * 100 : 0;

                setFormData({
                    ...data,
                    deliveryOrderDate: data.deliveryOrderDate ? new Date(data.deliveryOrderDate).toISOString().split('T')[0] : '',
                    shipmentDate: data.shipmentDate ? new Date(data.shipmentDate).toISOString().split('T')[0] : '',
                    items: data.items.map(item => ({
                        ...item,
                        taxPercentage: item.taxPercentage || 0,
                    })),
                    totalDiscountPercentage: discountPercentage.toFixed(2),
                    otherChargesPercentage: chargesPercentage.toFixed(2),
                });
            } else if (salesOrderId) {
                // Populate from Sales Order
                const soRes = await axios.get(`${API_URL}/sales/orders/${salesOrderId}`, { headers: { Authorization: token } });
                const data = soRes.data;
                const subTotal = data.subTotal || 0;
                const discountPercentage = subTotal > 0 ? ((data.totalDiscount || 0) / subTotal) * 100 : 0;
                const chargesPercentage = subTotal > 0 ? ((data.otherCharges || 0) / subTotal) * 100 : 0;

                setFormData(prev => ({
                    ...prev,
                    customerId: data.customerId,
                    salesOrderId: data.id,
                    reference: data.salesOrderNumber, // Use SO Number as reference??
                    salespersonId: data.salespersonId || '',
                    items: data.items.map(item => ({
                        ...item,
                        id: undefined, // Clear ID
                        taxPercentage: item.taxPercentage || 0,
                    })),
                    totalDiscountPercentage: discountPercentage.toFixed(2),
                    otherChargesPercentage: chargesPercentage.toFixed(2),
                }));
            }
        } catch (err) {
            setError('Failed to load data. Please try again.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [id, isEditing, salesOrderId]);

    useEffect(() => {
        fetchDependencies();
    }, [fetchDependencies]);

    const handleHeaderChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleItemChange = (index, e) => {
        const { name, value, type, checked } = e.target;
        const newItems = [...formData.items];

        if (type === 'checkbox') {
            newItems[index][name] = checked;
        } else {
            newItems[index][name] = value;
        }

        if (name === 'crmProductId') {
            const product = selectData.products.find(p => p.id.toString() === value);
            if (product) {
                newItems[index].itemName = product.name;
                newItems[index].itemCode = product.itemCode;
                newItems[index].rate = product.salesPrice;

                // Auto-select category if available
                if (product.categoryId) {
                    newItems[index].categoryId = product.categoryId;
                    newItems[index].subcategoryId = '';

                    const token = `Bearer ${localStorage.getItem('token')}`;
                    axios.get(`${API_URL}/production/sub-categories?categoryId=${product.categoryId}`, { headers: { Authorization: token } })
                        .then(res => {
                            setFormData(current => {
                                const updatedItems = [...current.items];
                                updatedItems[index] = {
                                    ...updatedItems[index],
                                    availableSubcategories: res.data || []
                                };
                                return { ...current, items: updatedItems };
                            });
                        }).catch(err => console.error("Failed to fetch subcategories", err));
                }
            }
        }

        if (name === 'categoryId') {
            newItems[index].subcategoryId = '';
            const categoryId = value;
            if (categoryId) {
                const token = `Bearer ${localStorage.getItem('token')}`;
                axios.get(`${API_URL}/production/sub-categories?categoryId=${categoryId}`, { headers: { Authorization: token } })
                    .then(res => {
                        setFormData(current => {
                            const updatedItems = [...current.items];
                            updatedItems[index] = {
                                ...updatedItems[index],
                                availableSubcategories: res.data || []
                            };
                            return { ...current, items: updatedItems };
                        });
                    }).catch(err => console.error("Failed to fetch subcategories", err));
            } else {
                newItems[index].availableSubcategories = [];
            }
        }

        setFormData(prev => ({ ...prev, items: newItems }));
    };

    const addItem = () => {
        setFormData(prev => ({
            ...prev,
            items: [...prev.items, { crmProductId: '', quantity: 1, rate: 0, taxPercentage: 0, taxValue: 0, isTaxExempt: false, categoryId: '', subcategoryId: '', availableSubcategories: [] }]
        }));
    };

    const removeItem = (index) => {
        setFormData(prev => ({ ...prev, items: prev.items.filter((_, i) => i !== index) }));
    };

    const handleFileChange = (e) => {
        if (e.target.files) {
            setAttachmentFiles(prev => [...prev, ...Array.from(e.target.files)]);
        }
    };

    const removeFile = (index) => {
        setAttachmentFiles(prev => prev.filter((_, i) => i !== index));
    };

    const getAttachmentUrl = (path) => `${API_URL}/sales/attachments/${path}`;

    const calculateTotals = () => {
        let subTotal = 0;
        let totalTax = 0;
        formData.items.forEach(item => {
            const amount = (item.quantity || 0) * (item.rate || 0);
            subTotal += amount;
            if (!item.isTaxExempt) {
                const taxRate = parseFloat(item.taxPercentage || 0);
                const taxValue = amount * (taxRate / 100);
                totalTax += taxValue;
            }
        });

        const discountPercentage = parseFloat(formData.totalDiscountPercentage) || 0;
        const chargesPercentage = parseFloat(formData.otherChargesPercentage) || 0;

        const discount = subTotal * (discountPercentage / 100);
        const charges = subTotal * (chargesPercentage / 100);

        const grossTotal = subTotal - discount;
        const netTotal = grossTotal + totalTax + charges;

        return { subTotal, totalTax, discount, charges, grossTotal, netTotal };
    };

    const totals = calculateTotals();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const token = `Bearer ${localStorage.getItem('token')}`;

            const orderData = {
                ...formData,
                items: formData.items.map(item => {
                    const amount = (item.quantity || 0) * (item.rate || 0);
                    const taxValue = !item.isTaxExempt ? amount * (parseFloat(item.taxPercentage || 0) / 100) : 0;
                    return {
                        ...item,
                        crmProductId: parseInt(item.crmProductId, 10) || null,
                        categoryId: item.categoryId ? parseInt(item.categoryId, 10) : null,
                        subcategoryId: item.subcategoryId ? parseInt(item.subcategoryId, 10) : null,
                        taxValue: taxValue.toFixed(2),
                        taxPercentage: parseFloat(item.taxPercentage || 0)
                    };
                }),
                totalDiscount: totals.discount.toFixed(2),
                otherCharges: totals.charges.toFixed(2),
                // Remove UI-only fields
                totalDiscountPercentage: undefined,
                otherChargesPercentage: undefined,
                availableSubcategories: undefined
            };

            const payload = new FormData();
            payload.append('data', new Blob([JSON.stringify(orderData)], { type: 'application/json' }));

            attachmentFiles.forEach(file => {
                payload.append('attachments', file);
            });

            const config = {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    Authorization: token,
                },
            };

            if (isEditing) {
                await axios.put(`${API_URL}/sales/delivery-orders/${id}`, payload, config);
            } else {
                await axios.post(`${API_URL}/sales/delivery-orders`, payload, config);
            }
            navigate('/sales/delivery-orders');
        } catch (err) {
            setError(err.response?.data?.message || `Failed to ${isEditing ? 'update' : 'create'} delivery order.`);
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (loading && !formData.customerId) {
        return <div className="flex justify-center items-center h-screen"><Loader2 className="h-8 w-8 animate-spin text-blue-500" /></div>;
    }

    return (
        <div className="flex flex-col h-screen bg-slate-50">
            <header className="bg-white shadow-sm p-4 border-b flex items-center justify-between sticky top-0 z-10">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/sales/delivery-orders')} className="p-2 rounded-full hover:bg-slate-100"><ArrowLeft className="h-5 w-5 text-slate-600" /></button>
                    <h1 className="text-xl font-bold text-slate-800">{isEditing ? 'Edit Delivery Order' : 'New Delivery Order'}</h1>
                </div>
                <div className="flex items-center gap-4">
                    <button type="button" onClick={() => navigate('/sales/delivery-orders')} className="btn-secondary">Cancel</button>
                    <button type="submit" form="do-form" disabled={loading} className="btn-primary flex items-center gap-2">
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        {isEditing ? 'Save Changes' : 'Create Delivery Order'}
                    </button>
                </div>
            </header>

            <main className="flex-grow overflow-y-auto p-6">
                <form id="do-form" onSubmit={handleSubmit} className="space-y-6">
                    {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md">{error}</div>}

                    {/* Header Fields */}
                    <div className="p-4 border rounded-lg bg-white grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="label">Customer Name *</label>
                            <select name="customerId" value={formData.customerId} onChange={handleHeaderChange} required className="input">
                                <option value="">Select Customer</option>
                                {selectData.customers.map(c => <option key={c.id} value={c.id}>{c.companyName}</option>)}
                            </select>
                        </div>
                        <div><label className="label">Delivery Order Date *</label><input type="date" name="deliveryOrderDate" value={formData.deliveryOrderDate} onChange={handleHeaderChange} required className="input" /></div>
                        <div><label className="label">Shipment Date</label><input type="date" name="shipmentDate" value={formData.shipmentDate} onChange={handleHeaderChange} className="input" /></div>
                        <div><label className="label">Reference</label><input type="text" name="reference" value={formData.reference} onChange={handleHeaderChange} className="input" /></div>
                        <div><label className="label">PO Number</label><input type="text" name="poNumber" value={formData.poNumber} onChange={handleHeaderChange} className="input" /></div>

                        <div>
                            <label className="label">Sales Order</label>
                            <select name="salesOrderId" value={formData.salesOrderId} onChange={handleHeaderChange} className="input">
                                <option value="">Select Sales Order</option>
                                {selectData.salesOrders.map(so => <option key={so.id} value={so.id}>{so.salesOrderNumber}</option>)}
                            </select>
                        </div>

                        <div>
                            <label className="label">Salesperson</label>
                            <select name="salespersonId" value={formData.salespersonId} onChange={handleHeaderChange} className="input">
                                <option value="">Select Salesperson</option>
                                {selectData.employees.map(e => (
                                    <option key={e.id} value={e.id}>
                                        {e.firstName} {e.lastName}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="label">Template</label>
                            <select name="template" value={formData.template} onChange={handleHeaderChange} className="input">
                                <option value="Standard">Standard</option>
                            </select>
                        </div>
                    </div>

                    {/* Items Table */}
                    <div className="p-4 border rounded-lg bg-white">
                        <h3 className="font-semibold mb-4">Item & Description</h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b">
                                        <th className="py-2 px-2 text-left font-medium">Product</th>
                                        <th className="py-2 px-2 text-left font-medium">Category</th>
                                        <th className="py-2 px-2 text-left font-medium">Subcategory</th>
                                        <th className="py-2 px-2 text-left font-medium w-24">Qty</th>
                                        <th className="py-2 px-2 text-left font-medium w-32">Rate</th>
                                        <th className="py-2 px-2 text-left font-medium w-32">Tax (%)</th>
                                        <th className="py-2 px-2 text-left font-medium w-32">Amount</th>
                                        <th className="py-2 px-2 text-left font-medium w-12"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {formData.items.map((item, index) => (
                                        <tr key={index} className="border-b">
                                            <td className="p-2">
                                                <select name="crmProductId" value={item.crmProductId} onChange={(e) => handleItemChange(index, e)} className="input text-sm" required>
                                                    <option value="">Select Product</option>
                                                    {selectData.products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                                </select>
                                            </td>
                                            <td className="p-2">
                                                <select name="categoryId" value={item.categoryId} onChange={(e) => handleItemChange(index, e)} className="input text-sm">
                                                    <option value="">Select Category</option>
                                                    {selectData.categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                                </select>
                                            </td>
                                            <td className="p-2">
                                                <select name="subcategoryId" value={item.subcategoryId} onChange={(e) => handleItemChange(index, e)} className="input text-sm" disabled={!item.categoryId}>
                                                    <option value="">Select Subcategory</option>
                                                    {(item.availableSubcategories || [])
                                                        .map(sc => <option key={sc.id} value={sc.id}>{sc.name}</option>)}
                                                </select>
                                            </td>
                                            <td className="p-2"><input type="number" name="quantity" value={item.quantity} onChange={(e) => handleItemChange(index, e)} className="input text-sm" min="1" /></td>
                                            <td className="p-2"><input type="number" name="rate" value={item.rate} onChange={(e) => handleItemChange(index, e)} className="input text-sm" /></td>
                                            <td className="p-2">
                                                <div className="flex flex-col gap-1">
                                                    <input type="number" name="taxPercentage" value={item.taxPercentage || 0} onChange={(e) => handleItemChange(index, e)} className="input text-sm" disabled={item.isTaxExempt} />
                                                    <label className="flex items-center gap-1 text-xs text-gray-500">
                                                        <input type="checkbox" name="isTaxExempt" checked={item.isTaxExempt} onChange={(e) => handleItemChange(index, e)} /> Exempt
                                                    </label>
                                                </div>
                                            </td>
                                            <td className="p-2 text-right font-medium">AED {((item.quantity || 0) * (item.rate || 0)).toFixed(2)}</td>
                                            <td className="p-2 text-center"><button type="button" onClick={() => removeItem(index)} className="p-1 text-red-500 hover:bg-red-100 rounded-full"><Trash2 size={16} /></button></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <button type="button" onClick={addItem} className="mt-4 btn-secondary flex items-center gap-2"><Plus size={16} /> Add Item</button>
                    </div>

                    {/* Attachments */}
                    <div className="p-4 border rounded-lg bg-white">
                        <h3 className="font-semibold mb-4">Attach File</h3>
                        <div className="flex items-center gap-4">
                            <input type="file" multiple onChange={handleFileChange} className="hidden" id="attachment-upload" />
                            <label htmlFor="attachment-upload" className="btn-secondary cursor-pointer flex items-center gap-2">
                                <Paperclip size={16} /> Browse...
                            </label>
                            <span className="text-sm text-gray-500">{attachmentFiles.length > 0 ? `${attachmentFiles.length} file(s) selected` : 'No file selected.'}</span>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">You can upload a maximum of 5 files, 5MB each</p>

                        {(attachmentFiles.length > 0 || (isEditing && formData.attachments?.length > 0)) && (
                            <div className="mt-4 space-y-3">
                                {isEditing && formData.attachments?.map((att, index) => (
                                    <div key={index} className="text-sm flex items-center justify-between p-2 bg-slate-100 rounded">
                                        <a href={getAttachmentUrl(att)} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline truncate">{att.split('/').pop()}</a>
                                    </div>
                                ))}
                                {attachmentFiles.map((file, index) => (
                                    <div key={index} className="text-sm flex items-center justify-between p-2 bg-blue-50 rounded">
                                        <span className="truncate">{file.name}</span>
                                        <button type="button" onClick={() => removeFile(index)} className="p-1 text-red-500 hover:bg-red-100 rounded-full"><Trash2 size={14} /></button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Totals and Notes */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div><label className="label">Terms & Conditions</label><textarea name="termsAndConditions" value={formData.termsAndConditions} onChange={handleHeaderChange} rows="4" className="input" placeholder="Mention your company's Terms and Conditions."></textarea></div>
                            <div><label className="label">Notes</label><textarea name="notes" value={formData.notes} onChange={handleHeaderChange} rows="3" className="input" placeholder="Will be displayed on Delivery Order"></textarea></div>
                            <div className="flex items-center gap-2">
                                <input type="checkbox" name="emailTo" checked={!!formData.emailTo} onChange={(e) => setFormData(prev => ({ ...prev, emailTo: e.target.checked ? 'on' : '' }))} id="emailTo" />
                                <label htmlFor="emailTo" className="label mb-0">Email To Client</label>
                            </div>
                        </div>
                        <div className="p-4 border rounded-lg bg-white space-y-2">
                            <div className="flex justify-between items-center"><span className="text-sm text-gray-600">Sub Total</span><span className="font-medium">AED {totals.subTotal.toFixed(2)}</span></div>
                            <div className="flex justify-between items-center">
                                <label className="text-sm text-gray-600">Total Discount</label>
                                <div className="flex items-center gap-2">
                                    <input type="number" name="totalDiscountPercentage" value={formData.totalDiscountPercentage} onChange={handleHeaderChange} className="input text-sm w-20 text-right" placeholder="%" />
                                    <span className="text-sm">%</span>
                                    <span className="font-medium w-24 text-right">{totals.discount.toFixed(2)}</span>
                                </div>
                            </div>
                            <div className="flex justify-between items-center"><span className="text-sm text-gray-600">Gross Total</span><span className="font-medium">AED {totals.grossTotal.toFixed(2)}</span></div>
                            <div className="flex justify-between items-center"><span className="text-sm text-gray-600">Total Tax</span><span className="font-medium">AED {totals.totalTax.toFixed(2)}</span></div>
                            <div className="flex justify-between items-center">
                                <label className="text-sm text-gray-600">Other Charges</label>
                                <div className="flex items-center gap-2">
                                    <input type="number" name="otherChargesPercentage" value={formData.otherChargesPercentage} onChange={handleHeaderChange} className="input text-sm w-20 text-right" placeholder="%" />
                                    <span className="text-sm">%</span>
                                    <span className="font-medium w-24 text-right">{totals.charges.toFixed(2)}</span>
                                </div>
                            </div>
                            <div className="flex justify-between items-center text-lg font-bold border-t pt-2 mt-2"><span className="">Net Total</span><span className="">AED {totals.netTotal.toLocaleString('en-AE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
                        </div>
                    </div>
                </form>
            </main>
        </div>
    );
};

export default DeliveryOrderForm;
