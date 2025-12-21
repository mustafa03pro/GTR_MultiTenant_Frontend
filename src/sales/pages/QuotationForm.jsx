import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams, useSearchParams, useLocation } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Save, Loader2, Plus, Trash2, Paperclip } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_BASE_URL;

const QuotationForm = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { id } = useParams();
    const isRevise = location.pathname.includes('/revise');
    const [searchParams] = useSearchParams();
    const cloneId = searchParams.get('cloneId');
    const isEditing = !!id && !isRevise;

    const [formData, setFormData] = useState({
        quotationDate: new Date().toISOString().split('T')[0],
        customerId: '',
        reference: '',
        expiryDate: '',
        quotationType: 'WITHOUT_DISCOUNT',
        items: [],
        termsAndConditions: '',
        notes: '',
        emailTo: '',
        status: 'DRAFT',
        totalDiscountPercentage: 0,
        otherChargesPercentage: 0,
        salespersonId: '',
    });

    const [selectData, setSelectData] = useState({ customers: [], products: [], employees: [] });
    const [loading, setLoading] = useState(true);
    const [attachmentFiles, setAttachmentFiles] = useState([]);
    const [error, setError] = useState(null);

    const fetchDependencies = useCallback(async () => {
        setLoading(true);
        try {
            const token = `Bearer ${localStorage.getItem('token')}`;
            const [customersRes, productsRes, categoriesRes, employeesRes] = await Promise.all([
                axios.get(`${API_URL}/parties`, { headers: { Authorization: token } }),
                axios.get(`${API_URL}/crm/sales-products`, { headers: { Authorization: token }, params: { size: 1000 } }),
                axios.get(`${API_URL}/production/categories`, { headers: { Authorization: token } }),
                axios.get(`${API_URL}/employees/all`, { headers: { Authorization: token } }),
            ]);

            setSelectData({
                customers: customersRes.data.content || [],
                products: productsRes.data.content || [],
                categories: categoriesRes.data || [],
                employees: employeesRes.data || []
            });

            if (id || cloneId) {
                // Fetch data if editing, revising, or cloning
                const fetchId = id || cloneId;
                const quotationRes = await axios.get(`${API_URL}/sales/quotations/${fetchId}`, { headers: { Authorization: token } });
                const data = quotationRes.data;
                const subTotal = data.subTotal || 0;
                const discountPercentage = subTotal > 0 ? ((data.totalDiscount || 0) / subTotal) * 100 : 0;
                const chargesPercentage = subTotal > 0 ? ((data.otherCharges || 0) / subTotal) * 100 : 0;

                setFormData({
                    ...data,
                    id: (isRevise || cloneId) ? undefined : data.id, // Clear ID if revising or cloning
                    quotationNumber: (isRevise || cloneId) ? '' : data.quotationNumber, // Clear Quotation Number if revising or cloning
                    quotationDate: new Date().toISOString().split('T')[0], // Reset date for revision/clone
                    expiryDate: '', // Reset expiry
                    reference: isRevise ? `Revise of ${data.quotationNumber}` : (cloneId ? data.reference : data.reference),
                    items: data.items.map(item => ({
                        ...item,
                        id: undefined, // Clear item IDs
                        taxRate: item.taxPercentage || 0, // taxRate is not sent from backend, initialize for UI
                    })),
                    totalDiscountPercentage: discountPercentage.toFixed(2),
                    otherChargesPercentage: chargesPercentage.toFixed(2),
                    salespersonId: data.salespersonId || '',
                    status: 'DRAFT', // Reset status
                });
            } else if (location.state?.lead) {
                const lead = location.state.lead;
                // Pre-fill from Lead
                setFormData(prev => ({
                    ...prev,
                    customerId: lead.companyId || '',
                    reference: lead.leadNo ? `Lead No: ${lead.leadNo}` : '',
                }));
            }
        } catch (err) {
            setError('Failed to load data. Please try again.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [id, isEditing, isRevise, cloneId, location.state]);

    useEffect(() => {
        fetchDependencies();
    }, [fetchDependencies]);

    const handleHeaderChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleItemChange = (index, e) => {
        const { name, value } = e.target;
        const newItems = [...formData.items];
        newItems[index][name] = value;

        if (name === 'crmProductId') {
            const product = selectData.products.find(p => p.id.toString() === value);
            if (product) {
                newItems[index].itemName = product.name;
                newItems[index].itemCode = product.itemCode;
                newItems[index].rate = product.salesPrice;
            }
        }

        if (name === 'categoryId') {
            // Reset subcategory when category changes
            newItems[index].subcategoryId = '';
            // Fetch subcategories for the new category
            const categoryId = value;
            if (categoryId) {
                const token = `Bearer ${localStorage.getItem('token')}`;
                axios.get(`${API_URL}/production/sub-categories?categoryId=${categoryId}`, { headers: { Authorization: token } })
                    .then(res => {
                        newItems[index].availableSubcategories = res.data || [];
                    }).catch(err => console.error("Failed to fetch subcategories", err));
            }
        }
        setFormData(prev => ({ ...prev, items: newItems }));
    };

    const addItem = () => {
        setFormData(prev => ({
            ...prev,
            items: [...prev.items, { crmProductId: '', quantity: 1, rate: 0, taxRate: 0, taxValue: 0, isTaxExempt: false, categoryId: '', subcategoryId: '', availableSubcategories: [] }]
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
        let itemDiscounts = 0;

        formData.items.forEach(item => {
            const quantity = parseFloat(item.quantity || 0);
            const rate = parseFloat(item.rate || 0);
            let amount = quantity * rate;

            // Calculate item level discount if applicable
            if (formData.quotationType === 'WITH_DISCOUNT_AT_ITEM_LEVEL') {
                const discountPercent = parseFloat(item.discountPercent || 0);
                const discountValue = amount * (discountPercent / 100);
                itemDiscounts += discountValue;
                // amount -= discountValue; // Usually tax is calculated on discounted amount, let's assume standard behavior
            }

            subTotal += amount;

            // Tax calculation
            // If item level discount is applied, tax is usually on the discounted value. 
            // Let's clarifying: Net = (Qty * Rate) - Discount + Tax
            // Tax = ((Qty * Rate) - Discount) * TaxRate%

            let taxableAmount = amount;
            if (formData.quotationType === 'WITH_DISCOUNT_AT_ITEM_LEVEL') {
                taxableAmount -= (amount * (parseFloat(item.discountPercent || 0) / 100));
            }

            if (!item.isTaxExempt) {
                const taxRate = parseFloat(item.taxRate || 0);
                const taxValue = taxableAmount * (taxRate / 100);
                totalTax += taxValue;
            }
        });

        let totalDiscount = 0;
        if (formData.quotationType === 'WITH_DISCOUNT_AT_ORDER_LEVEL') {
            const discountPercentage = parseFloat(formData.totalDiscountPercentage) || 0;
            totalDiscount = subTotal * (discountPercentage / 100);
        } else if (formData.quotationType === 'WITH_DISCOUNT_AT_ITEM_LEVEL') {
            totalDiscount = itemDiscounts;
        }

        const chargesPercentage = parseFloat(formData.otherChargesPercentage) || 0;
        // If order level discount, it's subtracted from subTotal before or after charges? 
        // Typically: SubTotal - Discount + Tax + Charges

        // For item level: SubTotal (sum of amounts) - ItemDiscounts + Tax + Charges
        // But wait, if I used 'amount' above as raw (qty*rate), then subTotal is raw.

        const charges = subTotal * (chargesPercentage / 100);

        const netTotal = subTotal - totalDiscount + totalTax + charges;

        return { subTotal, totalTax, netTotal, totalDiscount };
    };

    const totals = calculateTotals();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const token = `Bearer ${localStorage.getItem('token')}`;
            const subTotal = formData.items.reduce((acc, item) => acc + (item.quantity || 0) * (item.rate || 0), 0);
            const discountAmount = subTotal * (parseFloat(formData.totalDiscountPercentage) / 100);
            const chargesAmount = subTotal * (parseFloat(formData.otherChargesPercentage) / 100);

            const quotationData = {
                ...formData,
                items: formData.items.map(item => {
                    const amount = (item.quantity || 0) * (item.rate || 0);
                    const taxValue = amount * (parseFloat(item.taxRate || 0) / 100);
                    return {
                        ...item,
                        crmProductId: parseInt(item.crmProductId, 10) || null,
                        categoryId: item.categoryId ? parseInt(item.categoryId, 10) : null,
                        subcategoryId: item.subcategoryId ? parseInt(item.subcategoryId, 10) : null,
                        taxValue: taxValue.toFixed(2) // Send calculated tax value
                    };
                }),
                totalDiscount: discountAmount.toFixed(2),
                otherCharges: chargesAmount.toFixed(2),
                salespersonId: formData.salespersonId ? parseInt(formData.salespersonId, 10) : null,
            };

            const payload = new FormData();
            payload.append('quotation', new Blob([JSON.stringify(quotationData)], { type: 'application/json' }));

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
                await axios.put(`${API_URL}/sales/quotations/${id}`, payload, config);
            } else {
                // Post for new or revise
                await axios.post(`${API_URL}/sales/quotations`, payload, config);
            }
            navigate('/sales/quotations');
        } catch (err) {
            setError(err.response?.data?.message || `Failed to ${isEditing ? 'update' : 'create'} quotation.`);
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
                    <button onClick={() => navigate('/sales/quotations')} className="p-2 rounded-full hover:bg-slate-100"><ArrowLeft className="h-5 w-5 text-slate-600" /></button>
                    <h1 className="text-xl font-bold text-slate-800">{isEditing ? 'Edit Quotation' : isRevise ? 'Revise Quotation' : 'New Quotation'}</h1>
                </div>
                <div className="flex items-center gap-4">
                    <button type="button" onClick={() => navigate('/sales/quotations')} className="btn-secondary">Cancel</button>
                    <button type="submit" form="quotation-form" disabled={loading} className="btn-primary flex items-center gap-2">
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        {isEditing ? 'Save Changes' : 'Create Quotation'}
                    </button>
                </div>
            </header>

            <main className="flex-grow overflow-y-auto p-6">
                <form id="quotation-form" onSubmit={handleSubmit} className="space-y-6">
                    {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md">{error}</div>}

                    {/* Header Fields */}
                    <div className="p-4 border rounded-lg bg-white grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="label">Customer *</label>
                            <select name="customerId" value={formData.customerId} onChange={handleHeaderChange} required className="input">
                                <option value="">Select Customer</option>
                                {selectData.customers.map(c => <option key={c.id} value={c.id}>{c.companyName}</option>)}
                            </select>
                        </div>
                        <div><label className="label">Quotation Date *</label><input type="date" name="quotationDate" value={formData.quotationDate} onChange={handleHeaderChange} required className="input" /></div>
                        <div><label className="label">Expiry Date</label><input type="date" name="expiryDate" value={formData.expiryDate} onChange={handleHeaderChange} className="input" /></div>
                        <div><label className="label">Reference</label><input type="text" name="reference" value={formData.reference} onChange={handleHeaderChange} className="input" /></div>
                        <div>
                            <label className="label">Salesperson</label>
                            <select name="salespersonId" value={formData.salespersonId} onChange={handleHeaderChange} className="input">
                                <option value="">Select Salesperson</option>
                                {selectData.employees.map(emp => <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="label">Status</label>
                            <select name="status" value={formData.status} onChange={handleHeaderChange} className="input">
                                <option value="DRAFT">Draft</option>
                                <option value="SENT">Sent</option>
                                <option value="ACCEPTED">Accepted</option>
                                <option value="REJECTED">Rejected</option>
                            </select>
                        </div>
                        <div>
                            <label className="label">Quotation Type</label>
                            <select name="quotationType" value={formData.quotationType} onChange={handleHeaderChange} className="input">
                                <option value="WITHOUT_DISCOUNT">Without Discount</option>
                                <option value="WITH_DISCOUNT_AT_ITEM_LEVEL">Discount at Item Level</option>
                                <option value="WITH_DISCOUNT_AT_ORDER_LEVEL">Discount at Order Level</option>
                            </select>
                        </div>
                    </div>

                    {/* Items Table */}
                    <div className="p-4 border rounded-lg bg-white">
                        <h3 className="font-semibold mb-4">Items</h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b">
                                        <th className="py-2 px-2 text-left font-medium">Product</th>
                                        <th className="py-2 px-2 text-left font-medium">Category</th>
                                        <th className="py-2 px-2 text-left font-medium">Subcategory</th>
                                        <th className="py-2 px-2 text-left font-medium w-24">Qty</th>
                                        <th className="py-2 px-2 text-left font-medium w-32">Rate</th>
                                        {formData.quotationType === 'WITH_DISCOUNT_AT_ITEM_LEVEL' && (
                                            <th className="py-2 px-2 text-left font-medium w-24">Disc (%)</th>
                                        )}
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
                                            {formData.quotationType === 'WITH_DISCOUNT_AT_ITEM_LEVEL' && (
                                                <td className="p-2"><input type="number" name="discountPercent" value={item.discountPercent || 0} onChange={(e) => handleItemChange(index, e)} className="input text-sm" /></td>
                                            )}
                                            <td className="p-2"><input type="number" name="taxRate" value={item.taxRate || 0} onChange={(e) => handleItemChange(index, e)} className="input text-sm" /></td>
                                            <td className="p-2 text-right font-medium">AED {(((item.quantity || 0) * (item.rate || 0)) - (formData.quotationType === 'WITH_DISCOUNT_AT_ITEM_LEVEL' ? ((item.quantity || 0) * (item.rate || 0) * ((item.discountPercent || 0) / 100)) : 0)).toFixed(2)}</td>
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
                        <h3 className="font-semibold mb-4">Attachments</h3>
                        <div className="flex items-center gap-4">
                            <input type="file" multiple onChange={handleFileChange} className="hidden" id="attachment-upload" />
                            <label htmlFor="attachment-upload" className="btn-secondary cursor-pointer flex items-center gap-2">
                                <Paperclip size={16} /> Select Files
                            </label>
                        </div>
                        {(attachmentFiles.length > 0 || (isEditing && formData.attachments?.length > 0)) && (
                            <div className="mt-4 space-y-3">
                                {isEditing && formData.attachments?.map((att, index) => (
                                    <div key={index} className="text-sm flex items-center justify-between p-2 bg-slate-100 rounded">
                                        <a href={getAttachmentUrl(att)} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline truncate">{att.split('/').pop()}</a>
                                        {/* Delete existing attachment logic would go here if needed */}
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
                            <div><label className="label">Terms & Conditions</label><textarea name="termsAndConditions" value={formData.termsAndConditions} onChange={handleHeaderChange} rows="4" className="input"></textarea></div>
                            <div><label className="label">Notes</label><textarea name="notes" value={formData.notes} onChange={handleHeaderChange} rows="3" className="input"></textarea></div>
                        </div>
                        <div className="p-4 border rounded-lg bg-white space-y-2">
                            <div className="flex justify-between items-center"><span className="text-sm text-gray-600">Sub Total:</span><span className="font-medium">AED {totals.subTotal.toFixed(2)}</span></div>
                            <div className="flex justify-between items-center"><span className="text-sm text-gray-600">Total Tax:</span><span className="font-medium">AED {totals.totalTax.toFixed(2)}</span></div>

                            {/* Global Discount Input - Only for Order Level */}
                            {formData.quotationType === 'WITH_DISCOUNT_AT_ORDER_LEVEL' && (
                                <div className="flex justify-between items-center border-t pt-2 mt-2">
                                    <label className="text-sm text-gray-600">Discount (%):</label>
                                    <input type="number" name="totalDiscountPercentage" value={formData.totalDiscountPercentage} onChange={handleHeaderChange} className="input text-sm w-32 text-right" />
                                </div>
                            )}

                            {/* Item Level Discount Display - Read Only */}
                            {formData.quotationType === 'WITH_DISCOUNT_AT_ITEM_LEVEL' && (
                                <div className="flex justify-between items-center border-t pt-2 mt-2">
                                    <span className="text-sm text-gray-600">Total Discount:</span>
                                    <span className="font-medium">AED {totals.totalDiscount.toFixed(2)}</span>
                                </div>
                            )}

                            {/* Order Level Discount Display - Read Only (Amount) */}
                            {formData.quotationType === 'WITH_DISCOUNT_AT_ORDER_LEVEL' && (
                                <div className="flex justify-between items-center mt-1">
                                    <span className="text-sm text-gray-600">Discount Amount:</span>
                                    <span className="font-medium">AED {totals.totalDiscount.toFixed(2)}</span>
                                </div>
                            )}
                            <div className="flex justify-between items-center">
                                <label className="text-sm text-gray-600">Other Charges (%):</label>
                                <input type="number" name="otherChargesPercentage" value={formData.otherChargesPercentage} onChange={handleHeaderChange} className="input text-sm w-32 text-right" />
                            </div>
                            <div className="flex justify-between items-center text-lg font-bold border-t pt-2 mt-2"><span className="">Net Total:</span><span className="">AED {totals.netTotal.toLocaleString('en-AE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
                        </div>
                    </div>
                </form>
            </main>
        </div>
    );
};

export default QuotationForm;