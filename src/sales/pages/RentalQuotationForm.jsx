import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { Save, X, Plus, Trash2, ArrowLeft, Paperclip, Upload, Loader2 } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_BASE_URL;

const RentalQuotationForm = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEditMode = !!id;

    const [loading, setLoading] = useState(false);
    const [searchParams] = useSearchParams();
    const cloneId = searchParams.get('cloneId');

    const [fetchingData, setFetchingData] = useState(true);



    // Dropdown Data
    const [customers, setCustomers] = useState([]);
    const [products, setProducts] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [categories, setCategories] = useState([]);

    // Form State
    const [formData, setFormData] = useState({
        quotationDate: new Date().toISOString().split('T')[0],
        customerId: '',
        quotationNumber: '', // Backend generates on create, but might need display
        reference: '',
        expiryDate: '',
        deliveryLead: '',
        validity: '',
        paymentTerms: '',
        priceBasis: '',
        dearSir: '',
        salespersonId: '',
        quotationType: 'WITH_DISCOUNT_AT_ORDER_LEVEL', // Default enum
        rentalDurationDays: 1, // Default 1 day
        totalDiscount: 0,
        otherCharges: 0,
        termsAndConditions: '',
        notes: '',
        manufacture: '',
        remarks: '',
        emailTo: '',
        status: 'DRAFT',
        template: 'Standard',
        contactNumber: ''
    });

    const [items, setItems] = useState([
        { crmProductId: '', itemCode: '', itemName: '', description: '', quantity: 1, rentalValue: 0, discount: 0, taxPercentage: 0, taxValue: 0, amount: 0, isTaxExempt: false }
    ]);

    const [attachments, setAttachments] = useState([]);
    const [existingAttachments, setExistingAttachments] = useState([]);

    // Calculated Totals
    const [totals, setTotals] = useState({
        subTotalPerDay: 0,
        totalTaxPerDay: 0,
        grossTotal: 0, // Per Day after discount
        totalRentalPrice: 0, // Gross * Days
        totalTax: 0, // Tax Per Day * Days
        netTotal: 0
    });

    const authHeaders = useMemo(() => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }), []);

    // Fetch Dependencies
    useEffect(() => {
        const fetchData = async () => {
            try {
                // Mimic OrderForm.jsx endpoints
                const token = `Bearer ${localStorage.getItem('token')}`;
                const config = { headers: { Authorization: token } };

                const [custRes, prodRes, empRes, catRes] = await Promise.all([
                    axios.get(`${API_URL}/parties`, config),
                    axios.get(`${API_URL}/crm/sales-products`, { ...config, params: { size: 1000 } }),
                    axios.get(`${API_URL}/employees/all`, config),
                    axios.get(`${API_URL}/production/categories`, config)
                ]);

                setCustomers(custRes.data.content || []);
                setProducts(prodRes.data.content || []);
                setEmployees(empRes.data || []);
                setCategories(catRes.data || []);
            } catch (err) {
                console.error("Failed to fetch dependencies", err);
            } finally {
                setFetchingData(false);
            }
        };
        fetchData();
    }, []);

    // Fetch Data for Edit or Clone
    useEffect(() => {
        if ((isEditMode || cloneId) && !fetchingData) {
            const fetchQuotation = async () => {
                try {
                    const targetId = isEditMode ? id : cloneId;
                    const response = await axios.get(`${API_URL}/sales/rental-quotations/${targetId}`, authHeaders);
                    const data = response.data;

                    setFormData({
                        quotationDate: isEditMode ? data.quotationDate : new Date().toISOString().split('T')[0], // Reset date for clone
                        customerId: data.customerId,
                        quotationNumber: isEditMode ? data.quotationNumber : '', // Clear number for clone
                        reference: data.reference,
                        expiryDate: isEditMode ? data.expiryDate : '',
                        deliveryLead: data.deliveryLead,
                        validity: data.validity,
                        paymentTerms: data.paymentTerms,
                        priceBasis: data.priceBasis,
                        dearSir: data.dearSir,
                        salespersonId: data.salespersonId,
                        quotationType: data.quotationType || 'WITH_DISCOUNT_AT_ORDER_LEVEL',
                        rentalDurationDays: data.rentalDurationDays || 1,
                        totalDiscount: data.totalDiscount || 0,
                        otherCharges: data.otherCharges || 0,
                        termsAndConditions: data.termsAndConditions,
                        notes: data.notes,
                        manufacture: data.manufacture,
                        remarks: data.remarks,
                        emailTo: data.emailTo,
                        status: isEditMode ? data.status : 'DRAFT', // Reset status for clone
                        template: data.template
                    });

                    // Map items and fetch subcategories
                    const mappedItems = await Promise.all(data.items.map(async (item) => {
                        let availableSubcategories = [];
                        if (item.categoryId) {
                            try {
                                const token = `Bearer ${localStorage.getItem('token')}`;
                                const res = await axios.get(`${API_URL}/production/sub-categories?categoryId=${item.categoryId}`, { headers: { Authorization: token } });
                                availableSubcategories = res.data || [];
                            } catch (e) {
                                console.error(`Failed to fetch subcategories for category ${item.categoryId}`, e);
                            }
                        }
                        return {
                            ...item,
                            crmProductId: item.crmProductId || '',
                            itemCode: item.itemCode,
                            itemName: item.itemName,
                            description: item.description,
                            categoryId: item.categoryId || '',
                            subcategoryId: item.subcategoryId || '',
                            quantity: item.quantity,
                            rentalValue: item.rentalValue,
                            taxPercentage: item.taxPercentage,
                            taxValue: item.taxValue,
                            amount: item.amount,
                            isTaxExempt: item.isTaxExempt || false,
                            availableSubcategories
                        };
                    }));

                    setItems(mappedItems);

                    if (isEditMode && data.attachments) {
                        setExistingAttachments(data.attachments);
                    }
                    // For clone, we typically don't clone attachments unless requested, let's skip for now to avoid complexity or file reference issues

                } catch (err) {
                    console.error("Failed to fetch quotation details", err);
                    alert("Failed to load quotation details");
                }
            };
            fetchQuotation();
        }
    }, [id, cloneId, isEditMode, fetchingData, authHeaders]);


    // Calculations
    useEffect(() => {
        let subTotalPerDay = 0;
        let totalTaxPerDay = 0;

        const updatedItems = items.map(item => {
            const qty = parseFloat(item.quantity) || 0;
            const rate = parseFloat(item.rentalValue) || 0;
            const disc = parseFloat(item.discount) || 0;

            let itemAmount = qty * rate;
            if (formData.quotationType === 'WITH_DISCOUNT_AT_ITEM_LEVEL') {
                itemAmount -= disc;
            }

            let taxVal = 0;
            if (!item.isTaxExempt) {
                const taxPct = parseFloat(item.taxPercentage) || 0;
                taxVal = (itemAmount * taxPct) / 100;
            }

            subTotalPerDay += itemAmount;
            totalTaxPerDay += taxVal;

            return { ...item, amount: itemAmount, taxValue: taxVal };
        });

        let grossTotal = subTotalPerDay;
        // Global Discount Logic
        let discount = 0;
        if (formData.quotationType === 'WITH_DISCOUNT_AT_ORDER_LEVEL') {
            discount = parseFloat(formData.totalDiscount) || 0;
            grossTotal = Math.max(0, subTotalPerDay - discount);
        } else if (formData.quotationType === 'WITH_DISCOUNT_AT_ITEM_LEVEL' || formData.quotationType === 'WITHOUT_DISCOUNT') {
            // For item level, discounts are already subtracted from item amounts (subTotalPerDay reflects net of item discounts)
            // So gross total is just subTotalPerDay (which is sum of item amounts)
            // We don't apply global discount.
            grossTotal = subTotalPerDay;
        }

        const days = parseFloat(formData.rentalDurationDays) || 1;

        const totalRentalPrice = grossTotal * days;
        const totalTax = totalTaxPerDay * days;
        const otherCharges = parseFloat(formData.otherCharges) || 0;

        const netTotal = totalRentalPrice + totalTax + otherCharges;

        setTotals({
            subTotalPerDay,
            totalTaxPerDay,
            grossTotal,
            totalRentalPrice,
            totalTax,
            netTotal
        });

    }, [items, formData.totalDiscount, formData.rentalDurationDays, formData.otherCharges, formData.quotationType]);


    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => {
            const updates = { ...prev, [name]: value };

            // Auto-fill customer details
            if (name === 'customerId') {
                const customer = customers.find(c => c.id === parseInt(value));
                if (customer) {
                    updates.paymentTerms = customer.paymentTerms || '';
                    updates.priceBasis = customer.priceCategory || '';
                    updates.dearSir = customer.primaryContactPerson || customer.primaryFirstName || '';
                    updates.contactNumber = customer.mobile || customer.contactPhone || '';
                }
            }

            // Reset discounts if type changes
            if (name === 'quotationType') {
                // If switching away from item level, reset item discounts
                if (value !== 'WITH_DISCOUNT_AT_ITEM_LEVEL') {
                    // We need to update items state, which is separate. 
                    // Since setItems is separate, we'll do it in a useEffect or handle it here by modifying items directly if we could, 
                    // but we can't inside setFormData updater.
                    // So we must handle it outside this callback or triggering a side effect.
                    // Better approach: Handle type change in a dedicated handler or effect, or just let the user manually clear it.
                    // But for good UX, let's auto-clear.
                }

                // If switching away from order level, reset global discount
                if (value !== 'WITH_DISCOUNT_AT_ORDER_LEVEL') {
                    updates.totalDiscount = 0;
                }
            }

            return updates;
        });

        // Handle Item Discount Reset Side Effect
        if (name === 'quotationType' && value !== 'WITH_DISCOUNT_AT_ITEM_LEVEL') {
            setItems(prevItems => prevItems.map(item => ({ ...item, discount: 0 })));
        }
    };

    const handleItemChange = (index, field, value) => {
        const newItems = [...items];
        newItems[index][field] = value;

        // Auto-fill product details
        if (field === 'crmProductId') {
            const product = products.find(p => p.id === parseInt(value));
            if (product) {
                newItems[index].itemCode = product.itemCode || '';
                newItems[index].itemName = product.name || '';
                newItems[index].description = product.description || '';
                newItems[index].rentalValue = product.salesPrice || 0; // Assuming salesPrice as default rental rate? Or 0.
                // Reset tax if needed or set default
                newItems[index].taxPercentage = 5; // Default VAT usually 5% in regions like UAE
            }
        }

        // Handle Category Change -> Fetch Subcategories
        if (field === 'categoryId') {
            newItems[index].subcategoryId = '';
            const categoryId = value;
            if (categoryId) {
                const token = `Bearer ${localStorage.getItem('token')}`;
                axios.get(`${API_URL}/production/sub-categories?categoryId=${categoryId}`, { headers: { Authorization: token } })
                    .then(res => {
                        newItems[index].availableSubcategories = res.data || [];
                        setItems([...newItems]); // Trigger re-render with new subcats
                    }).catch(err => console.error("Failed to fetch subcategories", err));
            } else {
                newItems[index].availableSubcategories = [];
            }
        }

        setItems(newItems);
    };

    const addItem = () => {
        setItems([...items, { crmProductId: '', itemCode: '', itemName: '', description: '', quantity: 1, rentalValue: 0, discount: 0, taxPercentage: 5, taxValue: 0, amount: 0, isTaxExempt: false, categoryId: '', subcategoryId: '', availableSubcategories: [] }]);
    };

    const removeItem = (index) => {
        const newItems = items.filter((_, i) => i !== index);
        setItems(newItems);
    };

    const handleFileChange = (e) => {
        setAttachments([...attachments, ...Array.from(e.target.files)]);
    };

    const handleSubmit = async (e, saveStatus) => {
        e.preventDefault();
        setLoading(true);

        const payload = {
            ...formData,
            status: saveStatus || formData.status,
            items: items.map(item => {
                const quantity = parseFloat(item.quantity) || 0;
                const rentalValue = parseFloat(item.rentalValue) || 0;
                const discount = parseFloat(item.discount) || 0;
                const taxPercentage = parseFloat(item.taxPercentage) || 0;

                let amount = quantity * rentalValue;
                if (formData.quotationType === 'WITH_DISCOUNT_AT_ITEM_LEVEL') {
                    amount = amount - discount;
                }

                const taxValue = !item.isTaxExempt ? (amount * taxPercentage / 100) : 0;

                return {
                    crmProductId: item.crmProductId,
                    itemCode: item.itemCode,
                    itemName: item.itemName,
                    description: item.description,
                    categoryId: item.categoryId || null,
                    subcategoryId: item.subcategoryId || null,
                    quantity: quantity,
                    rentalValue: rentalValue,
                    taxValue: parseFloat(taxValue.toFixed(2)),
                    taxPercentage: taxPercentage,
                    isTaxExempt: item.isTaxExempt
                };
            }),
            // Pass calculated totals for validation/storage if backend requires them explicitly
            subTotalPerDay: totals.subTotalPerDay,
            grossTotal: totals.grossTotal,
            totalRentalPrice: totals.totalRentalPrice,
            totalTax: totals.totalTax,
            netTotal: totals.netTotal
        };

        const formDataObj = new FormData();
        formDataObj.append('quotation', new Blob([JSON.stringify(payload)], { type: 'application/json' }));

        attachments.forEach(file => {
            formDataObj.append('attachments', file);
        });

        const token = `Bearer ${localStorage.getItem('token')}`;
        const config = {
            headers: {
                Authorization: token,
                'Content-Type': 'multipart/form-data'
            }
        };

        try {
            if (isEditMode) {
                await axios.put(`${API_URL}/sales/rental-quotations/${id}`, formDataObj, config);
            } else {
                await axios.post(`${API_URL}/sales/rental-quotations`, formDataObj, config);
            }
            navigate('/sales/rental-quotations');
        } catch (err) {
            console.error("Failed to save quotation", err);
            alert("Failed to save rental quotation.");
        } finally {
            setLoading(false);
        }
    };

    if (fetchingData) return <div className="flex justify-center items-center h-screen"><Loader2 className="animate-spin text-blue-500" /></div>;

    return (
        <div className="flex flex-col h-full bg-slate-50 overflow-y-auto">
            {/* Header */}
            <div className="bg-white border-b p-4 flex justify-between items-center sticky top-0 z-10 shadow-sm">
                <div className="flex items-center gap-2">
                    <button onClick={() => navigate('/sales/rental-quotations')} className="text-gray-500 hover:text-gray-700"><ArrowLeft size={20} /></button>
                    <h1 className="text-xl font-bold text-gray-800">{isEditMode ? 'Edit Rental Quotation' : 'New Rental Quotation'}</h1>
                </div>
                <div className="flex gap-2">
                    <button onClick={(e) => handleSubmit(e, 'DRAFT')} className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 font-medium">Save as Draft</button>
                    <button onClick={(e) => handleSubmit(e, 'SENT')} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium flex items-center gap-2">
                        {loading ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />} Save
                    </button>
                </div>
            </div>

            <div className="p-6 w-full space-y-6">

                {/* Basic Info */}
                <div className="bg-white p-6 rounded shadow-sm border border-gray-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Quotation Date</label>
                                <input type="date" name="quotationDate" value={formData.quotationDate} onChange={handleInputChange} className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Customer Name</label>
                                <select name="customerId" value={formData.customerId} onChange={handleInputChange} className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                                    <option value="">Select Customer</option>
                                    {customers.map(c => (
                                        <option key={c.id} value={c.id}>{c.companyName || c.primaryContactPerson}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Contact Number</label>
                                <input type="text" name="contactNumber" value={formData.contactNumber} onChange={handleInputChange} className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Enter contact number" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Quotation #</label>
                                <input type="text" name="quotationNumber" value={formData.quotationNumber} disabled className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-gray-100 cursor-not-allowed" placeholder="Auto-generated" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Reference</label>
                                <input type="text" name="reference" value={formData.reference} onChange={handleInputChange} className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Enter reference" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Expiry Date</label>
                                <input type="date" name="expiryDate" value={formData.expiryDate} onChange={handleInputChange} className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Delivery Lead</label>
                                <input type="text" name="deliveryLead" value={formData.deliveryLead} onChange={handleInputChange} className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Enter delivery lead time" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Validity</label>
                                <input type="text" name="validity" value={formData.validity} onChange={handleInputChange} className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Enter validity period" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Payment Terms</label>
                                <input type="text" name="paymentTerms" value={formData.paymentTerms} onChange={handleInputChange} className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Enter payment terms" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Price Basis</label>
                                <input type="text" name="priceBasis" value={formData.priceBasis} onChange={handleInputChange} className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Enter price basis" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Salesperson</label>
                                <select name="salespersonId" value={formData.salespersonId} onChange={handleInputChange} className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                                    <option value="">Select Salesperson</option>
                                    {employees.map(e => (
                                        <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                    <div className="mt-4">
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Dear Sir</label>
                        <input type="text" name="dearSir" value={formData.dearSir} onChange={handleInputChange} className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Enter salutation" />
                    </div>
                </div>

                {/* Items Table */}
                <div className="bg-white p-6 rounded shadow-sm border border-gray-200 overflow-hidden">
                    <div className="mb-4 flex justify-between items-center">
                        <h3 className="font-bold text-gray-700">Items & Description</h3>
                        <div className="flex items-center gap-2">
                            <select name="quotationType" value={formData.quotationType} onChange={handleInputChange} className="border border-gray-300 rounded px-2 py-1 text-sm">
                                <option value="WITH_DISCOUNT_AT_ORDER_LEVEL">With Discount At Order Level</option>
                                <option value="WITH_DISCOUNT_AT_ITEM_LEVEL">With Discount At Item Level</option>
                                <option value="WITHOUT_DISCOUNT">Without Discount</option>
                            </select>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 text-gray-700 font-bold border-b">
                                <tr>
                                    <th className="px-2 py-2 w-10">#</th>
                                    <th className="px-2 py-2 w-64">Item Details</th>
                                    <th className="px-2 py-2 w-32">Category</th>
                                    <th className="px-2 py-2 w-32">Subcategory</th>
                                    <th className="px-2 py-2 w-24">Quantity</th>
                                    <th className="px-2 py-2 w-32">Rental Value</th>
                                    {formData.quotationType === 'WITH_DISCOUNT_AT_ITEM_LEVEL' && <th className="px-2 py-2 w-24">Discount</th>}
                                    <th className="px-2 py-2 w-32">Amount</th>
                                    <th className="px-2 py-2 w-32">Tax (VAT)</th>
                                    <th className="px-2 py-2 w-16 text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {items.map((item, index) => (
                                    <tr key={index} className="hover:bg-gray-50 align-top">
                                        <td className="px-2 py-3 text-gray-500">{index + 1}</td>
                                        <td className="px-2 py-3 space-y-2">
                                            <select
                                                value={item.crmProductId}
                                                onChange={(e) => handleItemChange(index, 'crmProductId', e.target.value)}
                                                className="w-full border border-gray-300 rounded px-2 py-1 focus:border-blue-500 outline-none"
                                            >
                                                <option value="">Select Item</option>
                                                {products.map(p => (
                                                    <option key={p.id} value={p.id}>{p.name} ({p.itemCode})</option>
                                                ))}
                                            </select>
                                            <input
                                                type="text"
                                                value={item.description}
                                                onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                                                placeholder="Description"
                                                className="w-full border border-gray-300 rounded px-2 py-1 text-xs text-gray-600 focus:border-blue-500 outline-none"
                                            />
                                        </td>
                                        <td className="px-2 py-3">
                                            <select
                                                value={item.categoryId}
                                                onChange={(e) => handleItemChange(index, 'categoryId', e.target.value)}
                                                className="w-full border border-gray-300 rounded px-2 py-1 focus:border-blue-500 outline-none text-xs"
                                            >
                                                <option value="">Category</option>
                                                {categories.map(c => (
                                                    <option key={c.id} value={c.id}>{c.name}</option>
                                                ))}
                                            </select>
                                        </td>
                                        <td className="px-2 py-3">
                                            <select
                                                value={item.subcategoryId}
                                                onChange={(e) => handleItemChange(index, 'subcategoryId', e.target.value)}
                                                className="w-full border border-gray-300 rounded px-2 py-1 focus:border-blue-500 outline-none text-xs"
                                                disabled={!item.categoryId}
                                            >
                                                <option value="">Sub Category</option>
                                                {item.availableSubcategories?.map(sc => (
                                                    <option key={sc.id} value={sc.id}>{sc.name}</option>
                                                ))}
                                            </select>
                                        </td>
                                        <td className="px-2 py-3">
                                            <div className="flex gap-1">
                                                <input
                                                    type="number"
                                                    min="1"
                                                    value={item.quantity}
                                                    onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                                                    className="w-full border border-gray-300 rounded px-2 py-1 text-center focus:border-blue-500 outline-none"
                                                />
                                                <span className="text-gray-500 text-xs self-center">Piece</span>
                                            </div>
                                        </td>
                                        <td className="px-2 py-3">
                                            <input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                value={item.rentalValue}
                                                onChange={(e) => handleItemChange(index, 'rentalValue', e.target.value)}
                                                className="w-full border border-gray-300 rounded px-2 py-1 text-right focus:border-blue-500 outline-none"
                                            />
                                        </td>
                                        {formData.quotationType === 'WITH_DISCOUNT_AT_ITEM_LEVEL' && (
                                            <td className="px-2 py-3">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    value={item.discount}
                                                    onChange={(e) => handleItemChange(index, 'discount', e.target.value)}
                                                    className="w-full border border-gray-300 rounded px-2 py-1 text-right focus:border-blue-500 outline-none"
                                                />
                                            </td>
                                        )}
                                        <td className="px-2 py-3 text-right font-medium text-gray-700">
                                            {(() => {
                                                let amt = (parseFloat(item.quantity) || 0) * (parseFloat(item.rentalValue) || 0);
                                                if (formData.quotationType === 'WITH_DISCOUNT_AT_ITEM_LEVEL') {
                                                    amt -= (parseFloat(item.discount) || 0);
                                                }
                                                return Math.max(0, amt).toFixed(2);
                                            })()}
                                        </td>
                                        <td className="px-2 py-3 space-y-1">
                                            <div className="flex items-center gap-1">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    value={item.taxPercentage}
                                                    onChange={(e) => handleItemChange(index, 'taxPercentage', e.target.value)}
                                                    className="w-12 border border-gray-300 rounded px-1 py-0.5 text-right text-xs"
                                                />
                                                <span className="text-xs">%</span>
                                            </div>
                                            <div className="text-xs text-gray-500 text-right">
                                                {(!item.isTaxExempt ? ((parseFloat(item.quantity) || 0) * (parseFloat(item.rentalValue) || 0) * (parseFloat(item.taxPercentage) || 0) / 100) : 0).toFixed(2)}
                                            </div>
                                            <label className="flex items-center gap-1 text-[10px] text-gray-500 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={item.isTaxExempt}
                                                    onChange={(e) => handleItemChange(index, 'isTaxExempt', e.target.checked)}
                                                /> Exempt
                                            </label>
                                        </td>
                                        <td className="px-2 py-3 text-center">
                                            <button onClick={() => removeItem(index)} className="text-red-500 hover:text-red-700 p-1"><Trash2 size={16} /></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <button onClick={addItem} className="mt-4 flex items-center gap-1 text-blue-600 hover:text-blue-700 font-medium text-sm"><Plus size={16} /> Add Item</button>

                    {/* Totals Section */}
                    <div className="mt-6 border-t pt-4 flex justify-end">
                        <div className="w-full md:w-1/2 lg:w-1/3 space-y-3">
                            <div className="flex justify-between items-center text-sm font-bold bg-gray-100 p-2 rounded">
                                <span>TOTAL NET RENTAL CHARGES PER DAY (AED)</span>
                                <span>{totals.subTotalPerDay?.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span>Total Discount</span>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    name="totalDiscount"
                                    value={formData.totalDiscount}
                                    onChange={handleInputChange}
                                    className="w-32 border border-gray-300 rounded px-2 py-1 text-right"
                                    disabled={formData.quotationType !== 'WITH_DISCOUNT_AT_ORDER_LEVEL'}
                                    title={formData.quotationType !== 'WITH_DISCOUNT_AT_ORDER_LEVEL' ? "Change quotation type to enable" : ""}
                                />
                            </div>
                            <div className="flex justify-between items-center text-sm font-semibold border-t pt-2">
                                <span>Gross Total</span>
                                <span>{totals.grossTotal?.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm items-center">
                                <div className="flex items-center gap-2">
                                    <span>Total Rental Price for</span>
                                    <input
                                        type="number"
                                        min="1"
                                        name="rentalDurationDays"
                                        value={formData.rentalDurationDays}
                                        onChange={handleInputChange}
                                        className="w-16 border border-gray-300 rounded px-1 py-0.5 text-center font-bold"
                                    />
                                    <span>Days</span>
                                </div>
                                <span className="font-bold">{totals.totalRentalPrice?.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span>Total Tax</span>
                                <span>{totals.totalTax?.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span>Other Charges</span>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    name="otherCharges"
                                    value={formData.otherCharges}
                                    onChange={handleInputChange}
                                    className="w-32 border border-gray-300 rounded px-2 py-1 text-right"
                                />
                            </div>
                            <div className="flex justify-between items-center text-lg font-bold border-t pt-3 text-blue-900">
                                <span>Net Total</span>
                                <span>AED {totals.netTotal?.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Attachments & Additional Info */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white p-6 rounded shadow-sm border border-gray-200">
                        <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2"><Paperclip size={18} /> Attach File</h3>
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:bg-gray-50 transition-colors">
                            <input type="file" multiple onChange={handleFileChange} className="hidden" id="file-upload" />
                            <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center gap-2 text-gray-500">
                                <Upload size={32} className="text-gray-400" />
                                <span className="text-sm font-medium">Click to browse or drag files here</span>
                                <span className="text-xs text-gray-400">Max 5 files, 5MB each</span>
                            </label>
                        </div>
                        {attachments.length > 0 && (
                            <div className="mt-4 space-y-2">
                                {attachments.map((file, idx) => (
                                    <div key={idx} className="flex items-center justify-between bg-gray-50 p-2 rounded text-sm">
                                        <span className="truncate max-w-[200px]">{file.name}</span>
                                        <button onClick={() => setAttachments(attachments.filter((_, i) => i !== idx))} className="text-red-500 hover:text-red-700"><X size={14} /></button>
                                    </div>
                                ))}
                            </div>
                        )}
                        {existingAttachments.length > 0 && (
                            <div className="mt-4 border-t pt-2">
                                <h4 className="text-xs font-bold text-gray-500 mb-2">Existing Attachments</h4>
                                {existingAttachments.map((url, idx) => {
                                    // Use SalesAttachmentController endpoint
                                    // url typically looks like "rental_quotations/filename.jpg"
                                    const fullUrl = url.startsWith('http') ? url : `${API_URL}/sales/attachments/${url.startsWith('/') ? url.slice(1) : url}`;

                                    return (
                                        <div key={idx} className="flex items-center justify-between text-sm py-1">
                                            <a href={fullUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline truncate max-w-[250px]">{url.split('/').pop()}</a>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    <div className="bg-white p-6 rounded shadow-sm border border-gray-200 space-y-4">
                        <h3 className="font-bold text-gray-700 mb-2">Terms & Conditions</h3>
                        <textarea
                            name="termsAndConditions"
                            rows="3"
                            value={formData.termsAndConditions}
                            onChange={handleInputChange}
                            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="Delivery, Lead Time, Payment Terms..."
                        ></textarea>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Notes</label>
                            <textarea name="notes" rows="2" value={formData.notes} onChange={handleInputChange} className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Will be displayed on Quotation"></textarea>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Manufacture</label>
                            <textarea name="manufacture" rows="2" value={formData.manufacture} onChange={handleInputChange} className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Will be displayed on Quotation"></textarea>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Remarks</label>
                            <textarea name="remarks" rows="2" value={formData.remarks} onChange={handleInputChange} className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Internal remarks"></textarea>
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="bg-gray-100 p-4 rounded flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <label className="text-sm font-semibold text-gray-700">Email To</label>
                        <input type="text" name="emailTo" value={formData.emailTo} onChange={handleInputChange} className="border border-gray-300 rounded px-3 py-1.5 text-sm w-64" placeholder="client@example.com" />
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => navigate('/sales/rental-quotations')} className="px-6 py-2 bg-white border border-gray-300 text-gray-700 rounded hover:bg-gray-50 font-medium">Cancel</button>
                        <button onClick={(e) => handleSubmit(e, 'DRAFT')} className="px-6 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 font-medium">Save as Draft</button>
                        <button onClick={(e) => handleSubmit(e, 'SENT')} className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 font-medium">Save</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RentalQuotationForm;
