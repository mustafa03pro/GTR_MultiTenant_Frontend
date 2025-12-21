import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { Save, X, Plus, Trash2, Upload, FileText, ArrowLeft, Loader2 } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_BASE_URL;

const RentalInvoiceForm = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const [searchParams] = useSearchParams();
    // Potential query params for conversion/cloning in future, but for now standard create/edit
    // const cloneId = searchParams.get('cloneId');

    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [error, setError] = useState(null);

    // Dropdown Data
    const [customers, setCustomers] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);

    const [formData, setFormData] = useState({
        invoiceLedger: 'Rental Sales',
        invoiceDate: new Date().toISOString().split('T')[0],
        customerId: '',
        customerName: '', // For display or manual entry if needed
        invoiceNumber: '', // Backend generates if empty usually, but screenshot shows field
        doNumber: '',
        lpoNumber: '',
        requiredDate: '',
        dueDate: '',
        salespersonId: '',
        poNumber: '',
        reference: '',
        invoiceType: 'WITH_DISCOUNT_AT_INVOICE_LEVEL', // Default
        enableGrossNetWeight: false,
        items: [
            {
                crmProductId: '',
                categoryId: '',
                subcategoryId: '',
                itemName: '',
                description: '',
                quantity: 1,
                duration: 1,
                rentalValue: 0,
                amount: 0,
                taxPercentage: 0,
                taxValue: 0,
                isTaxExempt: false
            }
        ],
        subTotal: 0,
        totalDiscount: 0,
        grossTotal: 0,
        totalTax: 0,
        otherCharges: 0,
        netTotal: 0,
        status: 'OPEN', // Default status
        termsAndConditions: '',
        notes: '',
        template: 'Rental Invoice',
        emailTo: '',
        attachments: []
    });

    const token = localStorage.getItem('token');
    const authHeaders = useMemo(() => ({ headers: { Authorization: `Bearer ${token}` } }), [token]);

    // Data Fetching
    const loadDependencies = useCallback(async () => {
        try {
            const [custRes, empRes, prodRes, catRes] = await Promise.all([
                axios.get(`${API_URL}/parties`, authHeaders), // Assuming parties endpoint for customers
                axios.get(`${API_URL}/employees/all`, authHeaders),
                axios.get(`${API_URL}/crm/sales-products`, authHeaders),
                axios.get(`${API_URL}/production/categories`, authHeaders)
            ]);

            setCustomers(custRes.data.content || custRes.data || []);
            setEmployees(empRes.data || []);
            setProducts(prodRes.data.content || prodRes.data || []);
            setCategories(catRes.data || []);

            // If editing, fetch invoice data
            if (id) {
                const invoiceRes = await axios.get(`${API_URL}/sales/rental-invoices/${id}`, authHeaders);
                const data = invoiceRes.data;
                // Map response to form data
                setFormData(prev => ({
                    ...prev,
                    ...data,
                    customerId: data.customerId || '',
                    salespersonId: data.salespersonId || '',
                    items: data.items.map(item => ({
                        ...item,
                        crmProductId: item.crmProductId || '',
                        categoryId: item.categoryId || '',
                        subcategoryId: item.subcategoryId || ''
                    }))
                }));
            }
            // If creating new from quotation
            const quotationId = searchParams.get('quotationId');
            if (quotationId && !id) {
                const quoteRes = await axios.get(`${API_URL}/sales/rental-quotations/${quotationId}`, authHeaders);
                console.log("Fetched quotation for conversion:", quoteRes.data);
                const quote = quoteRes.data;

                // Fetch subcategories for all items
                const mappedItems = await Promise.all(quote.items.map(async (item) => {
                    let availableSubcategories = [];
                    if (item.categoryId) {
                        try {
                            const subRes = await axios.get(`${API_URL}/production/sub-categories?categoryId=${item.categoryId}`, authHeaders);
                            availableSubcategories = subRes.data || [];
                        } catch (e) {
                            console.error("Failed to fetch subcategories", e);
                        }
                    }
                    return {
                        ...item,
                        availableSubcategories
                    };
                }));

                // Map quotation to invoice
                setFormData(prev => ({
                    ...prev,
                    customerId: quote.customerId || '',
                    customerName: quote.customerName || '',
                    salespersonId: quote.salespersonId || '',
                    reference: quote.quotationNumber || '',
                    requiredDate: quote.fromDate || '',
                    dueDate: quote.toDate || '',
                    // invoiceType: quote.quotationType || 'WITH_DISCOUNT_AT_INVOICE_LEVEL',
                    items: mappedItems.map(item => ({
                        crmProductId: item.crmProductId || '',
                        categoryId: item.categoryId || '',
                        subcategoryId: item.subcategoryId || '',
                        itemName: item.itemName,
                        description: item.description,
                        quantity: item.quantity,
                        duration: quote.rentalDurationDays || 1, // Use quote duration
                        rentalValue: item.rentalValue,
                        amount: item.amount,
                        taxPercentage: item.taxPercentage,
                        taxValue: item.taxValue,
                        isTaxExempt: item.isTaxExempt || false,
                        discount: 0, // Reset discount
                        availableSubcategories: item.availableSubcategories || []
                    })),
                    termsAndConditions: quote.termsAndConditions || '',
                    notes: quote.notes || '',
                    subTotal: 0,
                    totalTax: 0,
                    grossTotal: 0,
                    netTotal: 0
                }));
                // Trigger recalculation after setting data
                setFormData(prev => calculateTotals(prev));
            }

            // If creating new from Rental Sales Order
            const orderId = searchParams.get('orderId');
            if (orderId && !id) {
                const orderRes = await axios.get(`${API_URL}/sales/rental-sales-orders/${orderId}`, authHeaders);
                console.log("Fetched order for conversion:", orderRes.data);
                const order = orderRes.data;

                // Fetch subcategories for all items
                const mappedItems = await Promise.all(order.items.map(async (item) => {
                    let availableSubcategories = [];
                    if (item.categoryId) {
                        try {
                            const subRes = await axios.get(`${API_URL}/production/sub-categories?categoryId=${item.categoryId}`, authHeaders);
                            availableSubcategories = subRes.data || [];
                        } catch (e) {
                            console.error("Failed to fetch subcategories", e);
                        }
                    }
                    return {
                        ...item,
                        availableSubcategories
                    };
                }));

                // Map order to invoice
                setFormData(prev => ({
                    ...prev,
                    customerId: order.customerId || '',
                    customerName: order.customerParty?.companyName || order.customerName || '',
                    salespersonId: order.salespersonId || '',
                    // reference: order.orderNumber || '', // Maybe keep original reference or use order number
                    doNumber: '', // Usually new
                    lpoNumber: order.lpoNumber || '',
                    requiredDate: order.shipmentDate || '', // Mapping shipment to required
                    dueDate: '',
                    invoiceType: 'WITH_DISCOUNT_AT_INVOICE_LEVEL', // Default or from order if exists
                    items: mappedItems.map(item => ({
                        crmProductId: item.crmProductId || '',
                        categoryId: item.categoryId || '',
                        subcategoryId: item.subcategoryId || '',
                        itemName: item.itemName,
                        description: item.description,
                        quantity: item.quantity,
                        duration: order.rentalDurationDays || 1,
                        rentalValue: item.rentalValue,
                        amount: item.amount,
                        taxPercentage: item.taxPercentage,
                        taxValue: item.taxValue,
                        isTaxExempt: item.isTaxExempt || false,
                        discount: 0,
                        availableSubcategories: item.availableSubcategories || []
                    })),
                    termsAndConditions: order.termsAndConditions || '',
                    notes: order.notes || '',
                    subTotal: 0,
                    totalTax: 0,
                    grossTotal: 0,
                    netTotal: 0
                }));
                // Trigger recalculation after setting data
                setFormData(prev => calculateTotals(prev));
            }

        } catch (err) {
            console.error("Failed to load dependencies", err);
            setError("Failed to load necessary data.");
        } finally {
            setInitialLoading(false);
        }
    }, [id, authHeaders]);

    useEffect(() => {
        loadDependencies();
    }, [loadDependencies]);

    // Handlers
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleItemChange = (index, field, value) => {
        const newItems = [...formData.items];
        newItems[index] = { ...newItems[index], [field]: value };

        // Auto-fill logic for Product selection
        if (field === 'crmProductId') {
            const product = products.find(p => p.id === parseInt(value));
            if (product) {
                newItems[index].itemName = product.itemName;
                newItems[index].description = product.description;
                newItems[index].rentalValue = product.salesPrice || 0; // Assuming salesPrice as base rental value
                // Trigger subcategory fetch for this new category
                newItems[index].subcategoryId = '';
                if (product.categoryId) {
                    axios.get(`${API_URL}/production/sub-categories?categoryId=${product.categoryId}`, authHeaders)
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
        }

        // Handle Category Change -> Fetch Subcategories
        if (field === 'categoryId') {
            newItems[index].subcategoryId = '';
            const categoryId = value;
            if (categoryId) {
                axios.get(`${API_URL}/production/sub-categories?categoryId=${categoryId}`, authHeaders)
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

        // Calculation Logic
        const quantity = parseFloat(newItems[index].quantity) || 0;
        const duration = parseFloat(newItems[index].duration) || 0;
        const rentalValue = parseFloat(newItems[index].rentalValue) || 0;
        const discount = parseFloat(newItems[index].discount) || 0;
        const taxPercentage = parseFloat(newItems[index].taxPercentage) || 0;

        // Base Amount
        let amount = quantity * duration * rentalValue;

        // Item Level Discount Logic
        if (formData.invoiceType === 'WITH_DISCOUNT_AT_ITEM_LEVEL') {
            amount = amount - discount;
        }

        newItems[index].amount = amount;

        if (!newItems[index].isTaxExempt) {
            newItems[index].taxValue = (amount * taxPercentage) / 100;
        } else {
            newItems[index].taxValue = 0;
        }

        setFormData(prev => {
            const updated = { ...prev, items: newItems };
            return calculateTotals(updated);
        });
    };

    const calculateTotals = (data) => {
        const subTotal = data.items.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
        const totalTax = data.items.reduce((sum, item) => sum + (parseFloat(item.taxValue) || 0), 0);

        let grossTotal = subTotal;
        let totalDiscount = 0;

        if (data.invoiceType === 'WITH_DISCOUNT_AT_INVOICE_LEVEL') {
            totalDiscount = parseFloat(data.totalDiscount) || 0;
        } else if (data.invoiceType === 'WITH_DISCOUNT_AT_ITEM_LEVEL') {
            // Total discount is sum of item discounts (just for display if needed, but 'totalDiscount' field usually represents invoice level discount)
            // If item level, usually we don't apply global discount on top, or it depends. 
            // Requirement implies EITHER item level OR invoice level.
            totalDiscount = 0; // We don't apply global discount
            // If we want to show sum of item discounts, we could calculate it, but usually 'totalDiscount' state is for the global field.
        } else {
            // WITHOUT_DISCOUNT
            totalDiscount = 0;
        }

        const otherCharges = parseFloat(data.otherCharges) || 0;

        const netTotal = subTotal + totalTax + otherCharges - totalDiscount;

        return {
            ...data,
            subTotal,
            totalTax,
            grossTotal,
            totalDiscount: data.invoiceType === 'WITH_DISCOUNT_AT_INVOICE_LEVEL' ? totalDiscount : 0,
            netTotal
        };
    };

    const handleAddItem = () => {
        setFormData(prev => ({
            ...prev,
            items: [...prev.items, {
                crmProductId: '',
                categoryId: '',
                subcategoryId: '',
                itemName: '',
                description: '',
                quantity: 1,
                duration: 1,
                rentalValue: 0,
                amount: 0,
                discount: 0,
                taxPercentage: 0,
                taxValue: 0,
                isTaxExempt: false
            }]
        }));
    };

    const handleRemoveItem = (index) => {
        if (formData.items.length > 1) {
            setFormData(prev => {
                const newItems = prev.items.filter((_, i) => i !== index);
                return calculateTotals({ ...prev, items: newItems });
            });
        }
    };

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        setFormData(prev => ({ ...prev, attachments: [...prev.attachments, ...files] }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        const dataToSend = new FormData();
        // Append JSON blob for the main object
        const jsonBlob = new Blob([JSON.stringify({
            ...formData,
            items: formData.items.map(item => ({
                ...item,
                // Ensure IDs are valid or null
                crmProductId: item.crmProductId || null,
                categoryId: item.categoryId || null,
                subcategoryId: item.subcategoryId || null
            })),
            customerId: formData.customerId || null,
            salespersonId: formData.salespersonId || null
        })], { type: 'application/json' });

        dataToSend.append('rentalInvoice', jsonBlob);

        // Append files
        if (formData.attachments && formData.attachments.length > 0) {
            formData.attachments.forEach(file => {
                // If it's a File object (new upload)
                if (file instanceof File) {
                    dataToSend.append('attachments', file);
                }
                // Existing URLs are handled by keeping them in entity/state, but this specific backend implementation
                // seems to take multipart 'attachments' only for NEW files. 
                // Creating/Updating logic might need to separate existing URLs from new Files.
                // The backend controller `updateRentalInvoice` accepts `MultipartFile[] attachments`.
                // It appends them. It doesn't seem to delete old ones or handle existing ones in that array.
                // So checking `file instanceof File` is correct for the `attachments` part.
            });
        }

        try {
            if (id) {
                await axios.put(`${API_URL}/sales/rental-invoices/${id}`, dataToSend, {
                    headers: {
                        ...authHeaders.headers,
                        'Content-Type': 'multipart/form-data'
                    }
                });
            } else {
                await axios.post(`${API_URL}/sales/rental-invoices`, dataToSend, {
                    headers: {
                        ...authHeaders.headers,
                        'Content-Type': 'multipart/form-data'
                    }
                });

                // Update Quotation Status if quotationId is present
                const quotationId = searchParams.get('quotationId');
                if (quotationId) {
                    try {
                        await axios.patch(`${API_URL}/sales/rental-quotations/${quotationId}/status`, null, {
                            params: {
                                status: 'RENTAL_INVOICED'
                            },
                            headers: authHeaders.headers
                        });
                        console.log("Quotation status updated to INVOICED");
                    } catch (statusErr) {
                        console.error("Failed to update quotation status", statusErr);
                    }
                }

                // Update Rental Sales Order Status if orderId is present
                const orderId = searchParams.get('orderId');
                if (orderId) {
                    try {
                        await axios.patch(`${API_URL}/sales/rental-sales-orders/${orderId}/status`, null, {
                            params: {
                                status: 'RENTAL_INVOICED'
                            },
                            headers: authHeaders.headers
                        });
                        console.log("Order status updated to RENTAL_INVOICED");
                    } catch (statusErr) {
                        console.error("Failed to update order status", statusErr);
                    }
                }
            }
            navigate('/sales/rental-invoices');
        } catch (err) {
            console.error("Failed to save rental invoice", err);
            setError("Failed to save rental invoice. Please check fields.");
        } finally {
            setLoading(false);
        }
    };

    if (initialLoading) return <div className="flex justify-center items-center h-screen"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="flex flex-col h-full bg-slate-50">
            {/* Header */}
            <div className="bg-primary p-4 flex justify-between items-center text-primary-foreground shadow-sm">
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate('/sales/rental-invoices')} className="hover:bg-white/20 p-1 rounded">
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-xl font-bold">{id ? 'Edit Rental Invoice' : 'Add New Rental Invoice'}</h1>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="p-4 space-y-4 flex-grow overflow-auto">
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    {error && <div className="bg-red-50 text-red-600 p-3 rounded mb-4 text-sm">{error}</div>}

                    {/* Top Fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1">Invoice Ledgers</label>
                            <select
                                name="invoiceLedger"
                                value={formData.invoiceLedger}
                                onChange={handleChange}
                                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary bg-gray-50"
                            >
                                <option value="Rental Sales">Rental Sales</option>
                                <option value="General Sales">General Sales</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1">Invoice Date</label>
                            <input
                                type="date"
                                name="invoiceDate"
                                value={formData.invoiceDate}
                                onChange={handleChange}
                                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-xs font-bold text-gray-700 mb-1">Customer Name</label>
                            <select
                                name="customerId"
                                value={formData.customerId}
                                onChange={(e) => {
                                    const cust = customers.find(c => c.id === parseInt(e.target.value));
                                    setFormData(prev => ({
                                        ...prev,
                                        customerId: e.target.value,
                                        customerName: cust ? cust.companyName : ''
                                    }));
                                }}
                                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                            >
                                <option value="">Type Here...</option>
                                {customers.map(c => (
                                    <option key={c.id} value={c.id}>{c.companyName}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1">Invoice#</label>
                            <input
                                type="text"
                                name="invoiceNumber"
                                value={formData.invoiceNumber}
                                onChange={handleChange}
                                placeholder="Auto-generated"
                                className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-gray-50"
                                readOnly={!!id} // Usually read-only on edit or auto-gen
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1">DO Number</label>
                            <input
                                type="text"
                                name="doNumber"
                                value={formData.doNumber}
                                onChange={handleChange}
                                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1">LPO Number</label>
                            <input
                                type="text"
                                name="lpoNumber"
                                value={formData.lpoNumber}
                                onChange={handleChange}
                                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1">Required Date</label>
                            <input
                                type="date"
                                name="requiredDate"
                                value={formData.requiredDate}
                                onChange={handleChange}
                                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1">Due Date</label>
                            <input
                                type="date"
                                name="dueDate"
                                value={formData.dueDate}
                                onChange={handleChange}
                                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1">Salesperson</label>
                            <select
                                name="salespersonId"
                                value={formData.salespersonId}
                                onChange={handleChange}
                                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                            >
                                <option value="">Type Here...</option>
                                {employees.map(e => (
                                    <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1">PO #</label>
                            <input
                                type="text"
                                name="poNumber"
                                value={formData.poNumber}
                                onChange={handleChange}
                                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1">Reference</label>
                            <input
                                type="text"
                                name="reference"
                                value={formData.reference}
                                onChange={handleChange}
                                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                            />
                        </div>
                    </div>

                    {/* Invoice Type & Checkbox */}
                    <div className="flex justify-between items-center mb-4 text-sm">
                        <div className="flex gap-4 items-center">
                            <label className="font-bold text-gray-700">Invoice Type</label>
                            <select
                                name="invoiceType"
                                value={formData.invoiceType}
                                onChange={(e) => {
                                    const newType = e.target.value;
                                    setFormData(prev => {
                                        // Reset discounts when switching types
                                        const updatedItems = prev.items.map(item => ({ ...item, discount: 0 }));
                                        // Recalculate with new type and reset discounts
                                        const newData = { ...prev, invoiceType: newType, items: updatedItems, totalDiscount: 0 };

                                        // We need to re-run calculation for items for item-level discount removal/addition effect on amount?
                                        // Actually amount calculation depends on type in handleItemChange. 
                                        // For clean switch, we should probably re-calculate amounts.
                                        // But simplified: just updating state description here. 
                                        // Real re-calc happens on next edit or we can force it.
                                        // Let's force re-calc of all items amounts:
                                        const recalculatedItems = updatedItems.map(item => {
                                            const qty = parseFloat(item.quantity) || 0;
                                            const dur = parseFloat(item.duration) || 0;
                                            const val = parseFloat(item.rentalValue) || 0;
                                            // Discount is 0 reset above
                                            let amt = qty * dur * val;
                                            // Tax
                                            let tax = 0;
                                            if (!item.isTaxExempt) tax = (amt * (parseFloat(item.taxPercentage) || 0)) / 100;
                                            return { ...item, amount: amt, taxValue: tax };
                                        });

                                        return calculateTotals({ ...newData, items: recalculatedItems });
                                    });
                                }}
                                className="border border-gray-300 rounded px-2 py-1 focus:outline-none"
                            >
                                <option value="WITH_DISCOUNT_AT_INVOICE_LEVEL">With Discount At Invoice Level</option>
                                <option value="WITH_DISCOUNT_AT_ITEM_LEVEL">With Discount At Item Level</option>
                                <option value="WITHOUT_DISCOUNT">Without Discount</option>
                            </select>
                        </div>
                        <div className="flex gap-2 items-center">
                            <input
                                type="checkbox"
                                name="enableGrossNetWeight"
                                checked={formData.enableGrossNetWeight}
                                onChange={handleChange}
                                id="enableGrossNetWeight"
                            />
                            <label htmlFor="enableGrossNetWeight" className="text-gray-700">Would you like to enable Gross Weight and Net Weight?</label>
                        </div>
                    </div>

                    {/* Items Table */}
                    <div className="overflow-x-auto mb-6">
                        <table className="w-full text-xs text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-100 border-b">
                                    <th className="p-2 border font-bold text-gray-700 w-32">Category</th>
                                    <th className="p-2 border font-bold text-gray-700 w-32">Subcategory</th>
                                    <th className="p-2 border font-bold text-gray-700 w-48">Item Name</th>
                                    <th className="p-2 border font-bold text-gray-700 w-16">Quantity</th>
                                    <th className="p-2 border font-bold text-gray-700 w-16">Duration</th>
                                    <th className="p-2 border font-bold text-gray-700 w-24">Rental Value</th>
                                    {formData.invoiceType === 'WITH_DISCOUNT_AT_ITEM_LEVEL' && (
                                        <th className="p-2 border font-bold text-gray-700 w-24">Discount</th>
                                    )}
                                    <th className="p-2 border font-bold text-gray-700 w-24">Amount</th>
                                    <th className="p-2 border font-bold text-gray-700 w-24">Tax Value</th>
                                    <th className="p-2 border font-bold text-gray-700 w-10 text-center">Del</th>
                                </tr>
                            </thead>
                            <tbody>
                                {formData.items.map((item, index) => (
                                    <tr key={index} className="border-b">
                                        <td className="p-2 border">
                                            <select
                                                value={item.categoryId}
                                                onChange={(e) => handleItemChange(index, 'categoryId', e.target.value)}
                                                className="w-full outline-none bg-transparent"
                                            >
                                                <option value="">Select...</option>
                                                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                            </select>
                                        </td>
                                        <td className="p-2 border">
                                            <select
                                                value={item.subcategoryId}
                                                onChange={(e) => handleItemChange(index, 'subcategoryId', e.target.value)}
                                                className="w-full outline-none bg-transparent"
                                            >
                                                <option value="">Select...</option>
                                                {item.availableSubcategories?.map(sc => (
                                                    <option key={sc.id} value={sc.id}>{sc.name}</option>
                                                ))}
                                            </select>
                                        </td>
                                        <td className="p-2 border">
                                            <div className="space-y-1">
                                                <select
                                                    value={item.crmProductId}
                                                    onChange={(e) => handleItemChange(index, 'crmProductId', e.target.value)}
                                                    className="w-full outline-none bg-transparent"
                                                >
                                                    <option value="">Type Here...</option>
                                                    {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.itemCode})</option>)}
                                                </select>
                                                <input
                                                    type="text"
                                                    value={item.description || ''}
                                                    onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                                                    placeholder="Description"
                                                    className="w-full text-xs text-gray-500 outline-none bg-transparent border-t border-dashed border-gray-200 pt-1"
                                                />
                                            </div>
                                        </td>
                                        <td className="p-2 border">
                                            <input
                                                type="number"
                                                value={item.quantity}
                                                onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                                                className="w-full outline-none bg-transparent"
                                                min="1"
                                            />
                                        </td>
                                        <td className="p-2 border">
                                            <input
                                                type="number"
                                                value={item.duration}
                                                onChange={(e) => handleItemChange(index, 'duration', e.target.value)}
                                                className="w-full outline-none bg-transparent"
                                                min="1"
                                            />
                                        </td>
                                        <td className="p-2 border">
                                            <input
                                                type="number"
                                                value={item.rentalValue}
                                                onChange={(e) => handleItemChange(index, 'rentalValue', e.target.value)}
                                                className="w-full outline-none bg-transparent"
                                            />
                                        </td>
                                        {formData.invoiceType === 'WITH_DISCOUNT_AT_ITEM_LEVEL' && (
                                            <td className="p-2 border">
                                                <input
                                                    type="number"
                                                    value={item.discount}
                                                    onChange={(e) => handleItemChange(index, 'discount', e.target.value)}
                                                    className="w-full outline-none bg-transparent"
                                                />
                                            </td>
                                        )}
                                        <td className="p-2 border bg-gray-50 text-right">
                                            {item.amount?.toFixed(2)}
                                        </td>
                                        <td className="p-2 border">
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-1">
                                                    <input
                                                        type="checkbox"
                                                        checked={item.isTaxExempt}
                                                        onChange={(e) => handleItemChange(index, 'isTaxExempt', e.target.checked)}
                                                        className="h-3 w-3"
                                                        title="Is Tax Exempt"
                                                    />
                                                    <span className="text-[10px]">Exempt</span>
                                                </div>
                                                <input
                                                    type="number"
                                                    value={item.taxPercentage}
                                                    onChange={(e) => handleItemChange(index, 'taxPercentage', e.target.value)}
                                                    className="w-full outline-none bg-transparent text-xs"
                                                    placeholder="%"
                                                    disabled={item.isTaxExempt}
                                                />
                                                <div className="text-[10px] text-gray-500 text-right">{item.taxValue?.toFixed(2)}</div>
                                            </div>
                                        </td>
                                        <td className="p-2 border text-center">
                                            <button onClick={() => handleRemoveItem(index)} className="text-red-500 hover:text-red-700">
                                                <Trash2 size={14} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <button
                            type="button"
                            onClick={handleAddItem}
                            className="text-primary text-xs font-bold mt-2 flex items-center gap-1 hover:underline"
                        >
                            <Plus size={14} /> Add another line
                        </button>
                    </div>

                    {/* Bottom Calculation Section */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-2">Attach File(s)</label>
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 flex flex-col items-center justify-center text-center">
                                <Upload size={24} className="text-gray-400 mb-2" />
                                <span className="text-xs text-gray-500 mb-2">Drag & Drop or Click to Upload</span>
                                <input
                                    type="file"
                                    multiple
                                    onChange={handleFileChange}
                                    className="hidden"
                                    id="file-upload"
                                />
                                <label htmlFor="file-upload" className="bg-gray-200 px-3 py-1 rounded text-xs cursor-pointer hover:bg-gray-300">Browse...</label>
                                {formData.attachments.length > 0 && (
                                    <div className="mt-2 text-xs text-left w-full">
                                        <p className="font-bold">Selected files:</p>
                                        <ul className="list-disc pl-4">
                                            {formData.attachments.map((file, i) => (
                                                <li key={i}>{file.name || file}</li> // handle File obj or string URL
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>

                            <div className="mt-4">
                                <label className="block text-xs font-bold text-gray-700 mb-1">Terms & Conditions</label>
                                <textarea
                                    name="termsAndConditions"
                                    value={formData.termsAndConditions}
                                    onChange={handleChange}
                                    rows="3"
                                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                                    placeholder="Mention your company's Terms and Conditions..."
                                ></textarea>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between items-center text-sm">
                                <span className="font-bold text-gray-700">Sub Total</span>
                                <span>{formData.subTotal?.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="font-bold text-gray-700">Total Discount</span>
                                <input
                                    type="number"
                                    name="totalDiscount"
                                    value={formData.totalDiscount}
                                    onChange={(e) => {
                                        const val = parseFloat(e.target.value) || 0;
                                        setFormData(prev => calculateTotals({ ...prev, totalDiscount: val }));
                                    }}
                                    className="w-24 border border-gray-300 rounded px-2 py-1 text-right focus:outline-none"
                                    disabled={formData.invoiceType !== 'WITH_DISCOUNT_AT_INVOICE_LEVEL'}
                                    title={formData.invoiceType !== 'WITH_DISCOUNT_AT_INVOICE_LEVEL' ? "Change invoice type to enable" : ""}
                                />
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="font-bold text-gray-700">Gross Total</span>
                                <span>{formData.grossTotal?.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="font-bold text-gray-700">Total Tax</span>
                                <span>{formData.totalTax?.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="font-bold text-gray-700">Other Charges</span>
                                <input
                                    type="number"
                                    name="otherCharges"
                                    value={formData.otherCharges}
                                    onChange={(e) => {
                                        const val = parseFloat(e.target.value) || 0;
                                        setFormData(prev => calculateTotals({ ...prev, otherCharges: val }));
                                    }}
                                    className="w-24 border border-gray-300 rounded px-2 py-1 text-right focus:outline-none"
                                />
                            </div>
                            <div className="flex justify-between items-center text-base font-bold border-t pt-2">
                                <span className="text-gray-900">Net Total</span>
                                <span>AED {formData.netTotal?.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6">
                        <label className="block text-xs font-bold text-gray-700 mb-1">Notes</label>
                        <textarea
                            name="notes"
                            value={formData.notes}
                            onChange={handleChange}
                            rows="2"
                            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                            placeholder="Will be displayed on Invoice"
                        ></textarea>
                    </div>

                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1">Template</label>
                            <input type="text" name="template" value={formData.template} readOnly className="border-none bg-transparent font-bold text-sm" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1">Email To</label>
                            <input
                                type="email"
                                name="emailTo"
                                value={formData.emailTo}
                                onChange={handleChange}
                                placeholder="Start adding custom fields..."
                                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                            />
                        </div>
                    </div>
                </div>

                {/* Footer Buttons */}
                <div className="flex gap-2">
                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-green-600 text-white px-6 py-2 rounded text-sm font-bold hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
                    >
                        {loading && <Loader2 className="animate-spin" size={16} />} Save
                    </button>
                    <button
                        type="button"
                        onClick={() => navigate('/sales/rental-invoices')}
                        className="bg-white border border-gray-300 text-gray-700 px-6 py-2 rounded text-sm font-bold hover:bg-gray-50"
                    >
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    );
};

export default RentalInvoiceForm;
