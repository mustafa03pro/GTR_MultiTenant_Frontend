import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Plus, Trash2, Save, Upload, Loader2, Link as LinkIcon, Download, Edit } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_BASE_URL;

const RentalSalesOrderForm = () => {
    const { id } = useParams();
    const [searchParams] = useSearchParams();
    const quotationId = searchParams.get('quotationId');
    const navigate = useNavigate();
    const isEditMode = !!id;

    const [sourceQuotationNumber, setSourceQuotationNumber] = useState(null);

    const [loading, setLoading] = useState(false);
    const [fetchingData, setFetchingData] = useState(true);
    const [customers, setCustomers] = useState([]);
    const [products, setProducts] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [categories, setCategories] = useState([]);
    // Items state
    const [items, setItems] = useState([
        {
            crmProductId: '', itemCode: '', itemName: '', description: '',
            categoryId: '', subcategoryId: '', availableSubcategories: [],
            quantity: 1, rentalValue: 0, amount: 0,
            taxPercentage: 0, taxValue: 0, isTaxExempt: false
        }
    ]);

    // Attachments
    const [attachments, setAttachments] = useState([]);
    const [existingAttachments, setExistingAttachments] = useState([]);

    const [formData, setFormData] = useState({
        orderDate: new Date().toISOString().split('T')[0],
        customerId: '',
        salespersonId: '',
        reference: '',
        shipmentDate: '',
        fromDate: '',
        toDate: '',
        deliveryLead: '',
        validity: '',
        paymentTerms: '',
        priceBasis: '',
        dearSir: '',
        rentalDurationDays: 1,
        subTotalPerDay: 0,
        totalRentalPrice: 0,
        totalDiscount: 0,
        otherCharges: 0,
        grossTotal: 0,
        totalTax: 0,
        netTotal: 0,
        termsAndConditions: '',
        notes: '',
        manufacture: '',
        remarks: '',
        emailTo: '',
        status: 'DRAFT',
        template: 'Standard'
    });

    useEffect(() => {
        const loadDependencies = async () => {
            setFetchingData(true);
            try {
                const token = localStorage.getItem('token');
                const headers = { Authorization: `Bearer ${token}` };

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
                    const orderRes = await axios.get(`${API_URL}/sales/rental-sales-orders/${id}`, { headers });
                    const order = orderRes.data;

                    setFormData({
                        ...order,
                        customerId: order.customerId || '',
                        salespersonId: order.salespersonId || '',
                        orderDate: order.orderDate || '',
                        shipmentDate: order.shipmentDate || '',
                        fromDate: order.fromDate || '',
                        toDate: order.toDate || '',
                    });

                    if (order.items && order.items.length > 0) {
                        const mappedItems = await Promise.all(order.items.map(async (item) => {
                            let availableSubcategories = [];
                            if (item.categoryId) {
                                try {
                                    const subRes = await axios.get(`${API_URL}/production/sub-categories?categoryId=${item.categoryId}`, { headers });
                                    availableSubcategories = subRes.data;
                                } catch (e) { console.error("Failed to load subcats for item", e); }
                            }
                            return {
                                ...item,
                                crmProductId: item.crmProductId || '',
                                categoryId: item.categoryId || '',
                                subcategoryId: item.subcategoryId || '',
                                availableSubcategories
                            };
                        }));
                        setItems(mappedItems);
                    } else {
                        setItems([]);
                    }

                    setExistingAttachments(order.attachments || []);
                } else if (quotationId) {
                    const quoteRes = await axios.get(`${API_URL}/sales/rental-quotations/${quotationId}`, { headers });
                    const quote = quoteRes.data;

                    setSourceQuotationNumber(quote.quotationNumber);

                    setFormData(prev => ({
                        ...prev,
                        customerId: quote.customerId || '',
                        salespersonId: quote.salespersonId || '',
                        reference: quote.quotationNumber, // Use quotation number as reference
                        fromDate: quote.fromDate || '',
                        toDate: quote.toDate || '',
                        rentalDurationDays: quote.rentalDurationDays || 1,
                        termsAndConditions: quote.termsAndConditions || '',
                        notes: quote.notes || '',
                        dearSir: quote.dearSir || '',
                        // Map financial totals if needed or let them recalculate
                    }));

                    if (quote.items && quote.items.length > 0) {
                        const mappedItems = await Promise.all(quote.items.map(async (item) => {
                            let availableSubcategories = [];
                            if (item.categoryId) {
                                try {
                                    const subRes = await axios.get(`${API_URL}/production/sub-categories?categoryId=${item.categoryId}`, { headers });
                                    availableSubcategories = subRes.data;
                                } catch (e) { console.error("Failed to load subcats for item", e); }
                            }
                            return {
                                ...item,
                                id: undefined, // Clear ID
                                quantity: Number(item.quantity) || 1,
                                rentalValue: Number(item.rentalValue) || 0,
                                amount: Number(item.amount) || 0,
                                taxPercentage: Number(item.taxPercentage) || 0,
                                taxValue: Number(item.taxValue) || 0,
                                availableSubcategories,
                                isTaxExempt: false
                            };
                        }));
                        setItems(mappedItems);
                    }
                }
            } catch (err) {
                console.error("Failed to load data", err);
                alert("Failed to load initial data");
            } finally {
                setFetchingData(false);
            }
        };
        loadDependencies();
    }, [id, isEditMode, quotationId]);

    // Derived Logic for Duration
    useEffect(() => {
        if (formData.fromDate && formData.toDate) {
            const start = new Date(formData.fromDate);
            const end = new Date(formData.toDate);
            const diffTime = Math.abs(end - start);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // Inclusive
            if (diffDays > 0) {
                setFormData(prev => ({ ...prev, rentalDurationDays: diffDays }));
            }
        }
    }, [formData.fromDate, formData.toDate]);

    // Recalculate Totals whenever items or duration changes
    useEffect(() => {
        const duration = formData.rentalDurationDays || 1;
        let subTotalStart = 0; // Per day total
        let taxTotal = 0;

        const newItems = items.map(item => {
            const qty = Number(item.quantity) || 0;
            const rate = Number(item.rentalValue) || 0;
            const amount = qty * rate * duration;

            // Tax calculation
            let taxVal = 0;
            if (!item.isTaxExempt && item.taxPercentage > 0) {
                taxVal = (amount * item.taxPercentage) / 100;
            }

            subTotalStart += (qty * rate); // This is per day subtotal if rate is per day
            taxTotal += taxVal;

            return { ...item, amount, taxValue: taxVal };
        });

        // We don't want to cause infinite loop by updating items here if only calculation changed derived values
        // But for display we need these values. 
        // Let's just calculate totals for formData.

        const totalRentalPrice = subTotalStart * duration;
        const grossTotal = totalRentalPrice - (Number(formData.totalDiscount) || 0);
        const netTotal = grossTotal + taxTotal + (Number(formData.otherCharges) || 0);

        setFormData(prev => ({
            ...prev,
            subTotalPerDay: subTotalStart,
            totalRentalPrice,
            totalTax: taxTotal,
            grossTotal,
            netTotal
        }));

    }, [items, formData.rentalDurationDays, formData.totalDiscount, formData.otherCharges]);


    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleCustomerChange = (e) => {
        const customerId = e.target.value;
        const customer = customers.find(c => c.id == customerId);

        setFormData(prev => ({
            ...prev,
            customerId: customerId,
            paymentTerms: customer?.paymentTerms || '',
            // Mapping priceBasis from priceCategory as per previous logic
            priceBasis: customer?.priceCategory || '',
            dearSir: customer?.primaryContactPerson || customer?.primaryFirstName || '',
            // contactNumber: customer?.mobile || customer?.contactPhone || '' // If we had this field in DTO
        }));
    };

    // Item handlers
    const handleItemChange = (index, field, value) => {
        const newItems = [...items];
        newItems[index][field] = value;

        if (field === 'crmProductId') {
            const product = products.find(p => p.id == value);
            console.log("Selected Product ID:", value);
            console.log("Found Product:", product);
            if (product) {
                // Populate defaults from product if available
                newItems[index].itemCode = product.itemCode || '';
                newItems[index].itemName = product.name || '';
                newItems[index].description = product.description || '';
                newItems[index].rentalValue = product.salesPrice || 0; // Assuming salesPrice as base rental
                console.log("Auto-filled Items:", newItems[index]);
                // Categories match?
            }
        }

        if (field === 'categoryId') {
            // Fetch subcategories
            const categoryId = value;
            newItems[index].subcategoryId = '';
            newItems[index].availableSubcategories = [];
            if (categoryId) {
                const token = localStorage.getItem('token');
                axios.get(`${API_URL}/production/sub-categories?categoryId=${categoryId}`, { headers: { Authorization: `Bearer ${token}` } })
                    .then(res => {
                        const updatedItems = [...items];
                        updatedItems[index].availableSubcategories = res.data;
                        // Need to update state again because closure capture stale state? 
                        // No, setItems call below will handle it if we do it right.
                        // Actually simpler to use setState functional update or just wait for re-render
                        // But here we are inside the handler.
                        // Let's just update the local variable and set it.
                        newItems[index].availableSubcategories = res.data;
                        setItems([...newItems]);
                    });
            }
        }

        setItems(newItems);
    };

    const addItem = () => {
        setItems([...items, {
            crmProductId: '', itemCode: '', itemName: '', description: '',
            categoryId: '', subcategoryId: '', availableSubcategories: [],
            quantity: 1, rentalValue: 0, amount: 0,
            taxPercentage: 0, taxValue: 0, isTaxExempt: false
        }]);
    };

    const removeItem = (index) => {
        setItems(items.filter((_, i) => i !== index));
    };

    // Attachments
    const handleFileChange = (e) => {
        setAttachments([...attachments, ...Array.from(e.target.files)]);
    };

    const removeAttachment = (index) => {
        setAttachments(attachments.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const payload = new FormData();

            // Construct the Order object matching Request DTO
            const orderPayload = {
                ...formData,
                items: items.map(item => ({
                    crmProductId: item.crmProductId || null,
                    itemCode: item.itemCode,
                    itemName: item.itemName,
                    description: item.description,
                    categoryId: item.categoryId || null,
                    subcategoryId: item.subcategoryId || null,
                    quantity: Number(item.quantity),
                    rentalValue: Number(item.rentalValue),
                    taxValue: Number(item.taxValue),
                    taxPercentage: Number(item.taxPercentage),
                    isTaxExempt: item.isTaxExempt
                }))
            };

            payload.append('order', new Blob([JSON.stringify(orderPayload)], { type: 'application/json' }));

            attachments.forEach(file => {
                payload.append('attachments', file);
            });

            const token = localStorage.getItem('token');
            const headers = { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" };

            if (isEditMode) {
                await axios.put(`${API_URL}/sales/rental-sales-orders/${id}`, payload, { headers });
            } else {
                await axios.post(`${API_URL}/sales/rental-sales-orders`, payload, { headers });

                // If created from a quotation, update the quotation status to RENTAL_ORDER
                if (quotationId) {
                    try {
                        console.log(`Updating status for quotation: ${quotationId} to RENTAL_ORDER`);
                        await axios.patch(`${API_URL}/sales/rental-quotations/${quotationId}/status`, null, {
                            params: {
                                status: 'RENTAL_ORDER'
                            },
                            headers: {
                                Authorization: `Bearer ${token}`
                            } // Use headers defined above which includes Authorization
                        });
                        console.log("Quotation status updated successfully.");
                    } catch (statusErr) {
                        console.error("Failed to update quotation status", statusErr);
                        // Optionally warn the user, but don't block the success flow
                    }
                }
            }

            navigate('/sales/rental-sales-orders');
        } catch (err) {
            console.error("Submission failed", err);
            alert(`Error: ${err.response?.data?.message || err.message || 'Failed to save order'}`);
        } finally {
            setLoading(false);
        }
    };

    if (fetchingData) return <div className="flex justify-center items-center h-screen"><Loader2 className="animate-spin text-primary lg:w-12 lg:h-12" /></div>;

    return (
        <div className="flex flex-col h-full bg-slate-50">
            {/* Header */}
            <div className="bg-primary p-4 flex justify-between items-center text-primary-foreground sticky top-0 z-10 shadow-md">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/sales/rental-sales-orders')} className="p-1 hover:bg-white/20 rounded-full"><ArrowLeft size={20} /></button>
                    <div>
                        <h1 className="text-xl font-semibold">{isEditMode ? 'Edit Rental Sales Order' : 'New Rental Sales Order'}</h1>
                        <div className="text-sm opacity-80">Sales &gt; Rental Sales Orders &gt; {isEditMode ? 'Edit' : 'New'}</div>
                    </div>
                </div>
                <div className='flex gap-2'>
                    <button type="button" onClick={() => navigate('/sales/rental-sales-orders')} className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded text-sm transition-colors">Cancel</button>
                    <button form="order-form" type="submit" disabled={loading} className="bg-white text-primary px-4 py-2 rounded text-sm font-bold hover:bg-gray-100 flex items-center gap-2 transition-colors shadow-sm">
                        {loading && <Loader2 size={16} className="animate-spin" />} <Save size={16} /> Save
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 md:p-6">
                <form id="order-form" onSubmit={handleSubmit} className="p-6 max-w-full mx-auto w-full space-y-6 bg-white rounded-lg shadow-sm">
                    {/* Basic Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Customer Name<span className="text-red-500">*</span></label>
                            <select name="customerId" required value={formData.customerId} onChange={handleCustomerChange} className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none bg-slate-50 hover:bg-white transition-colors">
                                <option value="">Select Customer</option>
                                {customers.map(c => <option key={c.id} value={c.id}>{c.companyName}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Sales Person</label>
                            <select name="salespersonId" value={formData.salespersonId} onChange={handleInputChange} className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none">
                                <option value="">Select Salesperson</option>
                                {employees.map(e => <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Order Date <span className="text-red-500">*</span></label>
                            <input type="date" name="orderDate" required value={formData.orderDate} onChange={handleInputChange} className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none" />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Shipment Date</label>
                            <input type="date" name="shipmentDate" value={formData.shipmentDate} onChange={handleInputChange} className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none" />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">From Date</label>
                            <input type="date" name="fromDate" value={formData.fromDate} onChange={handleInputChange} className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none" />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">To Date</label>
                            <input type="date" name="toDate" value={formData.toDate} onChange={handleInputChange} className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none" />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Reference</label>
                            <input type="text" name="reference" value={formData.reference} onChange={handleInputChange} className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none" />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Dear Sir</label>
                            <input type="text" name="dearSir" value={formData.dearSir} onChange={handleInputChange} className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none" placeholder="Contact Person" />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Delivery Lead</label>
                            <input type="text" name="deliveryLead" value={formData.deliveryLead} onChange={handleInputChange} className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none" />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Validity</label>
                            <input type="text" name="validity" value={formData.validity} onChange={handleInputChange} className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none" />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Payment Terms</label>
                            <input type="text" name="paymentTerms" value={formData.paymentTerms} onChange={handleInputChange} className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none" />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Price Basis</label>
                            <input type="text" name="priceBasis" value={formData.priceBasis} onChange={handleInputChange} className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none" />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Manufacture</label>
                            <input type="text" name="manufacture" value={formData.manufacture} onChange={handleInputChange} className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none" />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Remarks</label>
                            <textarea name="remarks" rows="1" value={formData.remarks} onChange={handleInputChange} className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none" />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Email To</label>
                            <input type="email" name="emailTo" value={formData.emailTo} onChange={handleInputChange} className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none" placeholder="email@example.com" />
                        </div>
                    </div>

                    {/* Items Section */}
                    <div>
                        <div className="flex justify-between items-center mb-2 mt-8 border-b pb-2">
                            <h3 className="text-lg font-bold text-gray-800">Item Details</h3>
                            <button type="button" onClick={addItem} className="bg-primary/10 text-primary px-3 py-1.5 rounded-full text-sm hover:bg-primary/20 flex items-center gap-1 font-medium transition-colors">
                                <Plus size={16} /> Add Item
                            </button>
                        </div>
                        <div className="overflow-x-auto border rounded-lg bg-gray-50/50">
                            <table className="w-full text-xs">
                                <thead className="bg-[#E0E0E0] text-gray-700 font-bold">
                                    <tr>
                                        <th className="p-3 border-r min-w-[200px]">Item</th>
                                        <th className="p-3 border-r min-w-[150px]">Description</th>
                                        <th className="p-3 border-r w-32">Category</th>
                                        <th className="p-3 border-r w-32">Subcategory</th>
                                        <th className="p-3 border-r w-24">Qty</th>
                                        <th className="p-3 border-r w-32">Rental Value</th>
                                        <th className="p-3 border-r w-24">Tax %</th>
                                        <th className="p-3 border-r w-24 text-right">Amount</th>
                                        <th className="p-3 w-16 text-center">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {items.map((item, index) => (
                                        <tr key={index} className="border-b bg-white hover:bg-gray-50">
                                            <td className="p-2 border-r">
                                                <select value={item.crmProductId} onChange={(e) => handleItemChange(index, 'crmProductId', e.target.value)} className="w-full border border-gray-300 rounded px-2 py-1 mb-1">
                                                    <option value="">Select Item</option>
                                                    {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.itemCode})</option>)}
                                                </select>
                                                <input type="text" placeholder="Item Code" value={item.itemCode} onChange={(e) => handleItemChange(index, 'itemCode', e.target.value)} className="w-full border border-gray-300 rounded px-2 py-1 mb-1" />
                                                <input type="text" placeholder="Item Name" value={item.itemName} onChange={(e) => handleItemChange(index, 'itemName', e.target.value)} className="w-full border border-gray-300 rounded px-2 py-1" />
                                            </td>
                                            <td className="p-2 border-r align-top">
                                                <textarea rows="3" value={item.description} onChange={(e) => handleItemChange(index, 'description', e.target.value)} className="w-full border border-gray-300 rounded px-2 py-1 resize-none" />
                                            </td>
                                            <td className="p-2 border-r align-top">
                                                <select value={item.categoryId} onChange={(e) => handleItemChange(index, 'categoryId', e.target.value)} className="w-full border border-gray-300 rounded px-2 py-1">
                                                    <option value="">Select</option>
                                                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                                </select>
                                            </td>
                                            <td className="p-2 border-r align-top">
                                                <select value={item.subcategoryId} onChange={(e) => handleItemChange(index, 'subcategoryId', e.target.value)} className="w-full border border-gray-300 rounded px-2 py-1">
                                                    <option value="">Select</option>
                                                    {item.availableSubcategories?.map(sc => <option key={sc.id} value={sc.id}>{sc.name}</option>)}
                                                </select>
                                            </td>
                                            <td className="p-2 border-r align-top">
                                                <input type="number" min="1" value={item.quantity} onChange={(e) => handleItemChange(index, 'quantity', e.target.value)} className="w-full border border-gray-300 rounded px-2 py-1" />
                                            </td>
                                            <td className="p-2 border-r align-top">
                                                <input type="number" step="0.01" value={item.rentalValue} onChange={(e) => handleItemChange(index, 'rentalValue', e.target.value)} className="w-full border border-gray-300 rounded px-2 py-1" />
                                            </td>
                                            <td className="p-2 border-r align-top">
                                                <div className="flex flex-col gap-1">
                                                    <input type="number" step="0.01" value={item.taxPercentage} onChange={(e) => handleItemChange(index, 'taxPercentage', e.target.value)} className="w-full border border-gray-300 rounded px-2 py-1" placeholder="%" />
                                                    <label className="flex items-center gap-1 text-[10px] text-gray-500">
                                                        <input type="checkbox" checked={item.isTaxExempt} onChange={(e) => handleItemChange(index, 'isTaxExempt', e.target.checked)} /> Exempt
                                                    </label>
                                                </div>
                                            </td>
                                            <td className="p-2 border-r font-medium text-right align-top">
                                                {item.amount?.toFixed(2)}
                                            </td>
                                            <td className="p-2 text-center align-top">
                                                <button type="button" onClick={() => removeItem(index)} className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded-full"><Trash2 size={16} /></button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Totals Section */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-4">
                        {/* Other Inputs */}
                        <div className="space-y-4">
                            <div>
                                <h4 className="font-bold text-gray-700 mb-2">Attachments</h4>
                                <div className="border border-dashed border-gray-300 rounded-lg p-4 text-center hover:bg-gray-50 transition-colors">
                                    <input type="file" multiple onChange={handleFileChange} className="hidden" id="file-upload" />
                                    <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center gap-2 text-gray-500">
                                        <Upload size={24} />
                                        <span className="text-sm">Click to upload files</span>
                                    </label>
                                </div>
                                <div className="space-y-2 mt-2">
                                    {attachments.map((file, idx) => (
                                        <div key={idx} className="flex justify-between items-center bg-gray-100 px-3 py-1.5 rounded text-sm">
                                            <span className="truncate max-w-[200px]">{file.name}</span>
                                            <button type="button" onClick={() => removeAttachment(idx)} className="text-red-500 hover:text-red-700"><Trash2 size={14} /></button>
                                        </div>
                                    ))}
                                    {existingAttachments.map((url, idx) => {
                                        // Use SalesAttachmentController /view endpoint
                                        const fullUrl = url.startsWith('http')
                                            ? url
                                            : `${API_URL}/sales/attachments/view?file=${encodeURIComponent(url.startsWith('/') ? url.slice(1) : url)}`;

                                        return (
                                            <div key={idx} className="flex justify-between items-center bg-blue-50 px-3 py-1.5 rounded text-sm">
                                                <a href={fullUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-blue-600 hover:underline truncate max-w-[200px]">
                                                    <LinkIcon size={14} /> {url.split('/').pop()}
                                                </a>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Terms & Conditions</label>
                                <textarea name="termsAndConditions" rows="3" value={formData.termsAndConditions} onChange={handleInputChange} className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Notes</label>
                                <textarea name="notes" rows="2" value={formData.notes} onChange={handleInputChange} className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none" />
                            </div>
                        </div>

                        {/* Calculation Card */}
                        <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                            <h4 className="font-bold text-gray-800 border-b pb-2 mb-4">Order Summary</h4>
                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Rental Duration</span>
                                    <span className="font-medium">{formData.rentalDurationDays} Days</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Total Net Rental per day</span>
                                    <span className="font-medium">AED {formData.subTotalPerDay?.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between font-medium">
                                    <span className="text-gray-700">Total Rental Price (for {formData.rentalDurationDays} days)</span>
                                    <span>AED {formData.totalRentalPrice?.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between items-center gap-4">
                                    <span className="text-gray-600">Discount</span>
                                    <input type="number" name="totalDiscount" value={formData.totalDiscount} onChange={handleInputChange} className="w-24 text-right border border-gray-300 rounded px-2 py-1 text-sm bg-white" placeholder="0.00" />
                                </div>
                                <div className="flex justify-between border-t pt-2">
                                    <span className="font-medium text-gray-700">Gross Total</span>
                                    <span className="font-medium">AED {formData.grossTotal?.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Total Tax</span>
                                    <span className="font-medium">AED {formData.totalTax?.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between items-center gap-4">
                                    <span className="text-gray-600">Other Charges</span>
                                    <input type="number" name="otherCharges" value={formData.otherCharges} onChange={handleInputChange} className="w-24 text-right border border-gray-300 rounded px-2 py-1 text-sm bg-white" placeholder="0.00" />
                                </div>
                                <div className="flex justify-between border-t border-gray-300 pt-3 mt-2">
                                    <span className="text-lg font-bold text-primary">Net Total</span>
                                    <span className="text-lg font-bold text-primary">AED {formData.netTotal?.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default RentalSalesOrderForm;
