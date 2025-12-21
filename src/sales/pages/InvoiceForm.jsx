import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Plus, Trash2, Save, Upload, Loader2, Paperclip } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_BASE_URL;

const InvoiceForm = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const salesOrderId = searchParams.get('salesOrderId');
    const quotationId = searchParams.get('quotationId');
    const proformaInvoiceId = searchParams.get('proformaInvoiceId');
    const isEditMode = !!id;

    const [loading, setLoading] = useState(false);
    const [fetchingData, setFetchingData] = useState(true);
    const [customers, setCustomers] = useState([]);
    const [products, setProducts] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [categories, setCategories] = useState([]);
    const [error, setError] = useState(null);

    // Items state
    const [items, setItems] = useState([
        {
            crmProductId: '', itemCode: '', itemName: '', description: '',
            categoryId: '', subcategoryId: '', availableSubcategories: [],
            quantityGross: 0, quantityNet: 0, sendQuantity: 0, invoiceQuantity: 1, packingType: '',
            rate: 0, amount: 0,
            taxPercentage: 5, taxValue: 0, isTaxExempt: false
        }
    ]);

    // Attachments
    const [attachmentFiles, setAttachmentFiles] = useState([]);
    const [existingAttachments, setExistingAttachments] = useState([]);

    const [formData, setFormData] = useState({
        invoiceLedger: 'Sales',
        invoiceDate: new Date().toISOString().split('T')[0],
        customerId: '',
        invoiceNumber: '',
        reference: '',
        orderNumber: '',
        dueDate: '',
        dateOfSupply: '',
        salespersonId: '',
        enableGrossNetWeight: false,
        delayReason: '',

        amountReceived: 0,
        balanceDue: 0,

        subTotal: 0,
        totalDiscount: 0,
        grossTotal: 0,
        totalTax: 0,
        otherCharges: 0,
        netTotal: 0,

        termsAndConditions: '',
        notes: '',
        template: 'Standard',
        emailTo: '',
        status: 'DRAFT'
    });

    const [billingAddress, setBillingAddress] = useState('');
    const [shippingAddress, setShippingAddress] = useState('');

    useEffect(() => {
        const loadDependencies = async () => {
            setFetchingData(true);
            try {
                const token = localStorage.getItem('token');
                const headers = { Authorization: `Bearer ${token}` };

                // Parallel fetch for dependencies
                const [custRes, prodRes, empRes, catRes] = await Promise.all([
                    axios.get(`${API_URL}/parties`, { headers }),
                    axios.get(`${API_URL}/crm/sales-products`, { headers }),
                    axios.get(`${API_URL}/employees/all`, { headers }),
                    axios.get(`${API_URL}/production/categories`, { headers })
                ]);

                setCustomers(custRes.data.content || custRes.data || []);
                setProducts(prodRes.data.content || prodRes.data || []);
                setEmployees(empRes.data || []);
                setCategories(catRes.data || []);

                if (isEditMode) {
                    const res = await axios.get(`${API_URL}/sales/sales-invoices/${id}`, { headers });
                    const data = res.data;

                    setFormData({
                        ...data,
                        invoiceLedger: data.invoiceLedger || 'Sales',
                        invoiceDate: data.invoiceDate || '',
                        customerId: data.customerId || '',
                        reference: data.reference || '',
                        orderNumber: data.orderNumber || '',
                        dueDate: data.dueDate || '',
                        dateOfSupply: data.dateOfSupply || '',
                        salespersonId: data.salespersonId || '',
                        enableGrossNetWeight: data.enableGrossNetWeight || false,
                        delayReason: data.delayReason || '',
                        amountReceived: data.amountReceived || 0,
                        balanceDue: data.balanceDue || 0,
                        termsAndConditions: data.termsAndConditions || '',
                        notes: data.notes || '',
                        template: data.template || 'Standard',
                        emailTo: data.emailTo || '',
                        status: data.status || 'DRAFT'
                    });

                    // Set addresses
                    const cust = (custRes.data.content || custRes.data || []).find(c => c.id === data.customerId);
                    if (cust) {
                        setBillingAddress(formatAddress(cust.billingAddress));
                        setShippingAddress(formatAddress(cust.shippingAddress));
                    }

                    if (data.items && data.items.length > 0) {
                        const mappedItems = await Promise.all(data.items.map(async (item) => {
                            let availableSubcategories = [];
                            if (item.categoryId) { // Assuming categoryId might be part of response if we added it to DTO, but DTO doesn't explicitly have it in response, only request. 
                                // Actually DTO SalesInvoiceItemResponse only has crmProductId. We might not receive category ID back. 
                                // We will have to rely on productId to find category if needed, or just leave category empty in edit mode if not critical. 
                                // For now, let's just map what we have.
                            }
                            return {
                                ...item,
                                crmProductId: item.crmProductId || '',
                                description: item.description || '',
                                quantityGross: item.quantityGross || 0,
                                quantityNet: item.quantityNet || 0,
                                sendQuantity: item.sendQuantity || 0,
                                invoiceQuantity: item.invoiceQuantity || 0,
                                packingType: item.packingType || '',
                                isTaxExempt: item.isTaxExempt || false
                            };
                        }));
                        setItems(mappedItems);
                    } else {
                        setItems([]);
                    }
                    setExistingAttachments(data.attachments || []);
                    setExistingAttachments(data.attachments || []);
                } else if (salesOrderId) {
                    const soRes = await axios.get(`${API_URL}/sales/orders/${salesOrderId}`, { headers });
                    const data = soRes.data;

                    setFormData(prev => ({
                        ...prev,
                        customerId: data.customerId || '',
                        orderNumber: data.salesOrderNumber || '',
                        salespersonId: data.salespersonId || '',
                        termsAndConditions: data.termsAndConditions || '',
                        notes: data.notes || '',
                        // Map totals? Or let recalculation handle it?
                        // We should map discount/charges percentages if possible, but form uses absolute values. 
                        // We'll let totals recalc based on items.
                        totalDiscount: data.totalDiscount || 0,
                        otherCharges: data.otherCharges || 0
                    }));
                    // Set addresses
                    const cust = (custRes.data.content || custRes.data || []).find(c => c.id === data.customerId);
                    if (cust) {
                        setBillingAddress(formatAddress(cust.billingAddress));
                        setShippingAddress(formatAddress(cust.shippingAddress));
                    }

                    if (data.items) {
                        const mappedItems = data.items.map(item => ({
                            crmProductId: item.crmProductId || '',
                            itemCode: item.productCode || '', // Assuming SO item has productCode
                            itemName: item.productName || '',
                            description: item.description || '',
                            categoryId: item.categoryId || '',
                            subcategoryId: item.subcategoryId || '',
                            availableSubcategories: [], // Would need to fetch if critical, or let user re-select
                            quantityGross: 0,
                            quantityNet: 0,
                            sendQuantity: item.quantity || 0,
                            invoiceQuantity: item.quantity || 0,
                            packingType: '',
                            rate: item.rate || 0,
                            amount: (item.quantity || 0) * (item.rate || 0),
                            taxPercentage: item.taxPercentage || 0,
                            taxValue: 0, // Will be calc by hook
                            isTaxExempt: false
                        }));
                        setItems(mappedItems);
                    }
                } else if (quotationId) {
                    const quotRes = await axios.get(`${API_URL}/sales/quotations/${quotationId}`, { headers });
                    const data = quotRes.data;

                    setFormData(prev => ({
                        ...prev,
                        customerId: data.customerId || '',
                        reference: data.quotationNumber || '',
                        salespersonId: data.salespersonId || '',
                        termsAndConditions: data.termsAndConditions || '',
                        notes: data.notes || '',
                        totalDiscount: data.totalDiscount || 0,
                        otherCharges: data.otherCharges || 0
                    }));

                    const cust = (custRes.data.content || custRes.data || []).find(c => c.id === data.customerId);
                    if (cust) {
                        setBillingAddress(formatAddress(cust.billingAddress));
                        setShippingAddress(formatAddress(cust.shippingAddress));
                    }

                    if (data.items) {
                        const mappedItems = data.items.map(item => ({
                            crmProductId: item.crmProductId || '',
                            itemCode: item.productCode || item.itemCode || '',
                            itemName: item.productName || item.itemName || '',
                            description: item.description || '',
                            categoryId: item.categoryId || '',
                            subcategoryId: item.subcategoryId || '',
                            availableSubcategories: [],
                            quantityGross: 0,
                            quantityNet: 0,
                            sendQuantity: item.quantity || 0,
                            invoiceQuantity: item.quantity || 0,
                            packingType: '',
                            rate: item.rate || 0,
                            amount: (item.quantity || 0) * (item.rate || 0),
                            taxPercentage: item.taxPercentage || 0,
                            taxValue: 0,
                            isTaxExempt: item.isTaxExempt || false
                        }));
                        setItems(mappedItems);
                    }
                } else if (proformaInvoiceId) {
                    const piRes = await axios.get(`${API_URL}/sales/proforma-invoices/${proformaInvoiceId}`, { headers });
                    const data = piRes.data;

                    setFormData(prev => ({
                        ...prev,
                        customerId: data.customerId || '',
                        // reference: data.invoiceNumber || '', // Maybe reference or order number
                        orderNumber: data.poNumber || '', // Map PO Number if available
                        salespersonId: data.salespersonId || '',
                        termsAndConditions: data.termsAndConditions || '',
                        notes: data.notes || '',
                        totalDiscount: data.totalDiscount || 0,
                        otherCharges: data.otherCharges || 0
                    }));

                    // Set addresses
                    const cust = (custRes.data.content || custRes.data || []).find(c => c.id === data.customerId);
                    if (cust) {
                        setBillingAddress(formatAddress(cust.billingAddress));
                        setShippingAddress(formatAddress(cust.shippingAddress));
                    }

                    if (data.items) {
                        const mappedItems = data.items.map(item => ({
                            crmProductId: item.crmProductId || '',
                            itemCode: item.productCode || item.itemCode || '',
                            itemName: item.productName || item.itemName || '',
                            description: item.description || '',
                            categoryId: item.categoryId || '',
                            subcategoryId: item.subcategoryId || '',
                            availableSubcategories: [],
                            quantityGross: 0,
                            quantityNet: 0,
                            sendQuantity: item.quantity || 0,
                            invoiceQuantity: item.quantity || 0,
                            packingType: '',
                            rate: item.rate || 0,
                            amount: (item.quantity || 0) * (item.rate || 0),
                            taxPercentage: item.taxPercentage || 0,
                            taxValue: 0,
                            isTaxExempt: item.isTaxExempt || false
                        }));
                        setItems(mappedItems);
                    }
                }
            } catch (err) {
                console.error("Failed to load data", err);
                setError("Failed to load initial data");
            } finally {
                setFetchingData(false);
            }
        };
        loadDependencies();
    }, [id, isEditMode, salesOrderId, quotationId, proformaInvoiceId]);

    const formatAddress = (addr) => {
        if (!addr) return '';
        if (typeof addr === 'string') return addr;
        return [addr.addressLine, addr.city, addr.country].filter(Boolean).join(', ');
    };

    const handleHeaderChange = (e) => {
        const { name, value, type, checked } = e.target;
        const val = type === 'checkbox' ? checked : value;
        setFormData(prev => ({ ...prev, [name]: val }));

        if (name === 'customerId') {
            const cust = customers.find(c => c.id.toString() === value);
            if (cust) {
                setBillingAddress(formatAddress(cust.billingAddress));
                setShippingAddress(formatAddress(cust.shippingAddress));
            } else {
                setBillingAddress('');
                setShippingAddress('');
            }
        }
    };

    const handleItemChange = (index, e) => {
        const { name, value, type, checked } = e.target;
        const newItems = [...items];

        if (type === 'checkbox') {
            newItems[index][name] = checked;
        } else {
            newItems[index][name] = value;
        }

        if (name === 'crmProductId') {
            const product = products.find(p => p.id.toString() === value);
            if (product) {
                newItems[index].itemName = product.name;
                newItems[index].itemCode = product.itemCode;
                newItems[index].rate = product.salesPrice;
                newItems[index].description = product.description || '';
            }
        }

        if (name === 'categoryId') {
            newItems[index].subcategoryId = '';
            const categoryId = value;
            if (categoryId) {
                const token = localStorage.getItem('token');
                axios.get(`${API_URL}/production/sub-categories?categoryId=${categoryId}`, { headers: { Authorization: `Bearer ${token}` } })
                    .then(res => {
                        newItems[index].availableSubcategories = res.data || [];
                    });
            } else {
                newItems[index].availableSubcategories = [];
            }
        }

        // Recalculate row
        const qty = Number(newItems[index].invoiceQuantity) || 0; // Usage Invoice Qty for calc
        const rate = Number(newItems[index].rate) || 0;
        const amount = qty * rate;
        newItems[index].amount = amount;

        let tax = 0;
        if (!newItems[index].isTaxExempt) {
            const taxPct = Number(newItems[index].taxPercentage) || 5;
            tax = (amount * taxPct) / 100;
            newItems[index].taxPercentage = taxPct;
        } else {
            newItems[index].taxPercentage = 0;
        }
        newItems[index].taxValue = tax;

        setItems(newItems);
    };

    const addItem = () => {
        setItems([...items, {
            crmProductId: '', itemCode: '', itemName: '', description: '',
            categoryId: '', subcategoryId: '', availableSubcategories: [],
            quantityGross: 0, quantityNet: 0, sendQuantity: 0, invoiceQuantity: 1, packingType: '',
            rate: 0, amount: 0, taxPercentage: 5, taxValue: 0, isTaxExempt: false
        }]);
    };

    const removeItem = (index) => {
        setItems(items.filter((_, i) => i !== index));
    };

    const handleFileChange = (e) => {
        if (e.target.files) {
            setAttachmentFiles([...attachmentFiles, ...Array.from(e.target.files)]);
        }
    };

    // Calculate totals
    useEffect(() => {
        let sub = 0;
        let tax = 0;
        items.forEach(item => {
            sub += Number(item.amount) || 0;
            tax += Number(item.taxValue) || 0;
        });

        const discount = Number(formData.totalDiscount) || 0;
        const other = Number(formData.otherCharges) || 0;
        const gross = sub - discount;
        const net = gross + tax + other;

        // Balance due calc
        const received = Number(formData.amountReceived) || 0;
        const balance = net - received;

        setFormData(prev => ({
            ...prev,
            subTotal: sub,
            totalTax: tax,
            grossTotal: gross,
            netTotal: net,
            balanceDue: balance
        }));
    }, [items, formData.totalDiscount, formData.otherCharges, formData.amountReceived]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const dataToSubmit = {
                ...formData,
                items: items.map(item => ({
                    crmProductId: item.crmProductId ? Number(item.crmProductId) : null,
                    itemCode: item.itemCode,
                    itemName: item.itemName,
                    description: item.description,
                    quantityGross: Number(item.quantityGross),
                    quantityNet: Number(item.quantityNet),
                    sendQuantity: Number(item.sendQuantity),
                    invoiceQuantity: Number(item.invoiceQuantity),
                    packingType: item.packingType,
                    rate: Number(item.rate),
                    taxValue: Number(item.taxValue),
                    isTaxExempt: item.isTaxExempt,
                    taxPercentage: Number(item.taxPercentage)
                }))
            };

            const payload = new FormData();
            payload.append('data', new Blob([JSON.stringify(dataToSubmit)], { type: 'application/json' }));
            attachmentFiles.forEach(file => payload.append('files', file));

            const config = { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' } };

            if (isEditMode) {
                await axios.put(`${API_URL}/sales/sales-invoices/${id}`, payload, config);
            } else {
                await axios.post(`${API_URL}/sales/sales-invoices`, payload, config);

                // Update Quotation status if created from Quotation
                if (quotationId) {
                    try {
                        await axios.patch(`${API_URL}/sales/quotations/${quotationId}/status`, null, {
                            params: {
                                status: 'INVOICED'
                            },
                            headers: { Authorization: `Bearer ${token}` }
                        });
                        console.log("Quotation status updated automatically");
                    } catch (statusErr) {
                        console.warn("Failed to update quotation status automatically", statusErr);
                    }
                }
                // Update Sales Order status if created from Sales Order
                if (salesOrderId) {
                    try {
                        await axios.patch(`${API_URL}/sales/orders/${salesOrderId}/status`, null, {
                            params: {
                                status: 'INVOICED'
                            },
                            headers: { Authorization: `Bearer ${token}` }
                        });
                    } catch (statusErr) {
                        console.warn("Failed to update sales order status automatically", statusErr);
                    }
                }

                // Update Proforma Invoice status if created from Proforma Invoice
                if (proformaInvoiceId) {
                    try {
                        await axios.patch(`${API_URL}/sales/proforma-invoices/${proformaInvoiceId}/status`, null, {
                            params: {
                                status: 'INVOICED' // Assuming INVOICED is the correct status
                            },
                            headers: { Authorization: `Bearer ${token}` }
                        });
                    } catch (statusErr) {
                        console.warn("Failed to update proforma invoice status automatically", statusErr);
                    }
                }
            }
            navigate('/sales/invoices');
        } catch (err) {
            console.error("Submit error", err);
            alert("Failed to save invoices");
        } finally {
            setLoading(false);
        }
    };

    if (fetchingData) return <div className="flex justify-center items-center h-screen"><Loader2 className="animate-spin text-primary" /></div>;

    return (
        <div className="flex flex-col h-screen bg-slate-50">
            <header className="bg-primary text-white shadow-sm p-4 flex items-center justify-between sticky top-0 z-10">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/sales/invoices')} className="text-gray-300 hover:text-white"><ArrowLeft /></button>
                    <h1 className="text-xl font-bold">{isEditMode ? 'Edit Sales Invoice' : 'Add New Sales Invoice'}</h1>
                </div>
                <div className="flex items-center gap-4">
                    <button type="button" onClick={() => navigate('/sales/invoices')} className="px-4 py-2 bg-gray-600 rounded hover:bg-gray-700 font-medium text-sm">Cancel</button>
                    <button type="submit" form="inv-form" disabled={loading} className="px-4 py-2 bg-green-600 rounded hover:bg-green-700 flex items-center gap-2 font-medium text-sm">
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        {isEditMode ? 'Update' : 'Save'}
                    </button>
                </div>
            </header>

            <main className="flex-grow overflow-y-auto p-6">
                <form id="inv-form" onSubmit={handleSubmit} className="space-y-6">
                    {/* Header Details */}
                    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">Invoice Ledgers*</label>
                                    <select name="invoiceLedger" value={formData.invoiceLedger} onChange={handleHeaderChange} className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm bg-gray-50">
                                        <option value="Sales">Sales</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">Customer Name *</label>
                                    <select name="customerId" value={formData.customerId} onChange={handleHeaderChange} required className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:border-primary">
                                        <option value="">Select Customer</option>
                                        {customers.map(c => <option key={c.id} value={c.id}>{c.companyName}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">Billing Address</label>
                                    <textarea readOnly value={billingAddress} rows="3" className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm bg-gray-100"></textarea>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">Invoice Date</label>
                                    <input type="date" name="invoiceDate" value={formData.invoiceDate} onChange={handleHeaderChange} className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:border-primary" />
                                </div>
                                <div className="flex justify-end pt-6">
                                    <div className="bg-primary text-white px-3 py-1 text-sm font-bold rounded">AED</div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">Shipping Address</label>
                                    <textarea readOnly value={shippingAddress} rows="3" className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm bg-gray-100"></textarea>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6 pt-4 border-t border-gray-100">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1">Invoice#</label>
                                <input type="text" value={formData.invoiceNumber || 'Auto-generated'} readOnly className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm bg-gray-100 text-gray-500" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1">Order Number</label>
                                <input type="text" name="orderNumber" value={formData.orderNumber} onChange={handleHeaderChange} className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:border-primary" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1">Due Date</label>
                                <input type="date" name="dueDate" value={formData.dueDate} onChange={handleHeaderChange} className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:border-primary" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1">Date Of Supply</label>
                                <input type="date" name="dateOfSupply" value={formData.dateOfSupply} onChange={handleHeaderChange} className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:border-primary" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1">Salesperson</label>
                                <select name="salespersonId" value={formData.salespersonId} onChange={handleHeaderChange} className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:border-primary">
                                    <option value="">Select Salesperson</option>
                                    {employees.map(e => <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1">Reference#</label>
                                <input type="text" name="reference" value={formData.reference} onChange={handleHeaderChange} className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:border-primary" />
                            </div>
                        </div>

                        <div className="mt-4 flex items-center gap-2">
                            <input type="checkbox" name="enableGrossNetWeight" checked={formData.enableGrossNetWeight} onChange={handleHeaderChange} className="rounded text-primary focus:ring-primary" id="grossNetCheck" />
                            <label htmlFor="grossNetCheck" className="text-xs font-bold text-gray-700 cursor-pointer">Would you like to enable Gross Weight and Net Weight?</label>
                        </div>
                    </div>

                    {/* Items Table */}
                    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 overflow-x-auto">
                        <div className="mb-2 p-2 bg-gray-100 text-sm font-semibold flex justify-between rounded">
                            <span>Item & Description</span>
                        </div>
                        <table className="w-full text-xs min-w-[1000px] border-collapse">
                            <thead>
                                <tr className="bg-gray-50 border-b">
                                    <th className="p-2 w-48 text-left font-bold text-gray-700">Item Details</th>
                                    {formData.enableGrossNetWeight && <th className="p-2 w-20 text-left font-bold text-gray-700">Qty(Gross)</th>}
                                    {formData.enableGrossNetWeight && <th className="p-2 w-20 text-left font-bold text-gray-700">Qty(Net)</th>}
                                    <th className="p-2 w-20 text-left font-bold text-gray-700">Send Qty</th>
                                    <th className="p-2 w-20 text-left font-bold text-gray-700">Inv Qty</th>
                                    <th className="p-2 w-24 text-left font-bold text-gray-700">Rate</th>
                                    <th className="p-2 w-24 text-left font-bold text-gray-700">Amount</th>
                                    <th className="p-2 w-32 text-left font-bold text-gray-700">Tax Value</th>
                                    <th className="p-2 w-24 text-left font-bold text-gray-700">Packing Type</th>
                                    <th className="p-2 w-10 text-center font-bold text-gray-700">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map((item, index) => (
                                    <tr key={index} className="border-b align-top hover:bg-gray-50">
                                        <td className="p-2 space-y-2">
                                            <div className="grid grid-cols-2 gap-2">
                                                <select name="categoryId" value={item.categoryId} onChange={(e) => handleItemChange(index, e)} className="border border-gray-300 rounded px-2 py-1 w-full bg-white">
                                                    <option value="">Category</option>
                                                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                                </select>
                                                <select name="subcategoryId" value={item.subcategoryId} onChange={(e) => handleItemChange(index, e)} className="border border-gray-300 rounded px-2 py-1 w-full bg-white" disabled={!item.categoryId}>
                                                    <option value="">Sub Category</option>
                                                    {item.availableSubcategories?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                                </select>
                                            </div>
                                            <select name="crmProductId" value={item.crmProductId} onChange={(e) => handleItemChange(index, e)} className="border border-gray-300 rounded px-2 py-1 w-full bg-white">
                                                <option value="">Select Item</option>
                                                {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                            </select>
                                            <textarea name="description" value={item.description} onChange={(e) => handleItemChange(index, e)} placeholder="Description" rows="2" className="border border-gray-300 rounded px-2 py-1 w-full"></textarea>
                                        </td>
                                        {formData.enableGrossNetWeight && (
                                            <td className="p-2">
                                                <input type="number" name="quantityGross" value={item.quantityGross} onChange={(e) => handleItemChange(index, e)} className="border border-gray-300 rounded px-2 py-1 w-full" />
                                            </td>
                                        )}
                                        {formData.enableGrossNetWeight && (
                                            <td className="p-2">
                                                <input type="number" name="quantityNet" value={item.quantityNet} onChange={(e) => handleItemChange(index, e)} className="border border-gray-300 rounded px-2 py-1 w-full" />
                                            </td>
                                        )}
                                        <td className="p-2">
                                            <input type="number" name="sendQuantity" value={item.sendQuantity} onChange={(e) => handleItemChange(index, e)} className="border border-gray-300 rounded px-2 py-1 w-full" />
                                        </td>
                                        <td className="p-2">
                                            <input type="number" name="invoiceQuantity" value={item.invoiceQuantity} onChange={(e) => handleItemChange(index, e)} className="border border-gray-300 rounded px-2 py-1 w-full" min="1" />
                                        </td>
                                        <td className="p-2">
                                            <input type="number" name="rate" value={item.rate} onChange={(e) => handleItemChange(index, e)} className="border border-gray-300 rounded px-2 py-1 w-full" />
                                        </td>
                                        <td className="p-2">
                                            <input type="number" value={item.amount} readOnly className="border border-gray-300 rounded px-2 py-1 w-full bg-gray-50" />
                                        </td>
                                        <td className="p-2 space-y-1">
                                            <input type="number" value={item.taxValue} readOnly className="border border-gray-300 rounded px-2 py-1 w-full bg-gray-50" />
                                            <div className="flex items-center gap-1">
                                                <input type="checkbox" name="isTaxExempt" checked={item.isTaxExempt} onChange={(e) => handleItemChange(index, e)} className="rounded text-primary focus:ring-primary" />
                                                <span className="text-[10px] text-gray-500">Is Tax Exempt</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <input type="number" name="taxPercentage" value={item.taxPercentage || 0} onChange={(e) => handleItemChange(index, e)} className="border border-gray-300 rounded px-1 py-0.5 w-10 text-[10px]" disabled={item.isTaxExempt} />
                                                <span className="text-[10px] text-gray-500">%</span>
                                            </div>
                                        </td>
                                        <td className="p-2">
                                            <input type="text" name="packingType" value={item.packingType} onChange={(e) => handleItemChange(index, e)} className="border border-gray-300 rounded px-2 py-1 w-full" />
                                        </td>
                                        <td className="p-2 text-center">
                                            <button type="button" onClick={() => removeItem(index)} className="p-1.5 bg-red-50 text-red-500 rounded hover:bg-red-100 transition-colors"><Trash2 size={14} /></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <button type="button" onClick={addItem} className="mt-4 px-3 py-1.5 bg-primary text-white text-xs font-bold rounded hover:bg-opacity-90 flex items-center gap-1 transition-colors">
                            <Plus size={12} /> Add Item
                        </button>
                    </div>

                    {/* Footer Totals & Payment */}
                    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                        <div className="flex flex-col md:flex-row justify-end gap-12">
                            {/* Payment Info */}
                            <div className="w-full md:w-1/3">
                                {/* Can add specific payment method fields here if needed */}
                            </div>

                            {/* Totals */}
                            <div className="w-full md:w-1/3 space-y-2 text-sm bg-gray-50 p-4 rounded-lg">
                                <div className="flex justify-between border-b border-gray-200 pb-2"><span>Sub Total</span><span className="font-medium">{formData.subTotal?.toFixed(2)}</span></div>
                                <div className="flex justify-between border-b border-gray-200 pb-2 items-center">
                                    <span>Total Discount</span>
                                    <input type="number" name="totalDiscount" value={formData.totalDiscount} onChange={handleHeaderChange} className="w-24 border border-gray-300 rounded px-2 py-1 text-right focus:outline-none focus:border-primary" placeholder="0.00" />
                                </div>
                                <div className="flex justify-between border-b border-gray-200 pb-2"><span>Gross Total</span><span className="font-medium">{formData.grossTotal?.toFixed(2)}</span></div>
                                <div className="flex justify-between border-b border-gray-200 pb-2"><span>Total Tax</span><span className="font-medium">{formData.totalTax?.toFixed(2)}</span></div>
                                <div className="flex justify-between border-b border-gray-200 pb-2 items-center">
                                    <span>Other Charges</span>
                                    <input type="number" name="otherCharges" value={formData.otherCharges} onChange={handleHeaderChange} className="w-24 border border-gray-300 rounded px-2 py-1 text-right focus:outline-none focus:border-primary" placeholder="0.00" />
                                </div>
                                <div className="flex justify-between pt-2 text-base font-bold text-gray-800"><span>Net Total</span><span>{formData.netTotal?.toFixed(2)}</span></div>

                                <div className="border-t border-gray-200 pt-4 mt-2">
                                    <div className="flex justify-between border-b border-gray-200 pb-2 items-center">
                                        <span className="font-bold text-gray-700">Amount Received</span>
                                        <input type="number" name="amountReceived" value={formData.amountReceived} onChange={handleHeaderChange} className="w-24 border border-gray-300 rounded px-2 py-1 text-right focus:outline-none focus:border-primary" placeholder="0.00" />
                                    </div>
                                    <div className="flex justify-between pt-2 text-base font-bold text-red-600"><span>Balance Due</span><span>{formData.balanceDue?.toFixed(2)}</span></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Extras */}
                    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1">Attach File</label>
                                <div className="flex gap-2 items-center border border-dashed border-gray-300 rounded-lg p-4 bg-gray-50">
                                    <label className="cursor-pointer bg-white border border-gray-300 px-3 py-1.5 rounded text-sm hover:bg-gray-50 flex items-center gap-1 shadow-sm transition-colors font-medium">
                                        <Paperclip size={14} /> Browse... <input type="file" multiple onChange={handleFileChange} className="hidden" />
                                    </label>
                                    <span className="text-xs text-gray-500">{attachmentFiles.length} file(s) selected</span>
                                </div>
                                <p className="text-[10px] text-gray-400 mt-1">Max 5 files, 5MB each</p>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1">Delay Reason</label>
                                <textarea name="delayReason" value={formData.delayReason} onChange={handleHeaderChange} rows="2" className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:border-primary" placeholder="Reason for any delay"></textarea>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1">Terms & Conditions</label>
                                <textarea name="termsAndConditions" value={formData.termsAndConditions} onChange={handleHeaderChange} rows="3" className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:border-primary" placeholder="Delivery, Lead Time, Payment Terms, Validity etc."></textarea>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1">Notes</label>
                                <textarea name="notes" value={formData.notes} onChange={handleHeaderChange} rows="2" className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:border-primary" placeholder="Will be displayed on Invoice"></textarea>
                            </div>
                        </div>
                    </div>

                    {/* Email To */}
                    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                        <label className="block text-xs font-bold text-gray-700 mb-1">Email To</label>
                        <div className="flex items-center gap-2">
                            <input type="text" name="emailTo" value={formData.emailTo} onChange={handleHeaderChange} className="w-full md:w-1/2 border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:border-primary" placeholder="Email address" />
                        </div>
                    </div>
                </form>
            </main>
        </div>
    );
};

export default InvoiceForm;
