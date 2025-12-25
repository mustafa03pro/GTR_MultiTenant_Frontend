
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Upload, Loader, X, HelpCircle, ImageIcon } from 'lucide-react';
import axios from 'axios';
import ProductionLayout from '../layout/ProductionLayout';

const API_URL = import.meta.env.VITE_API_BASE_URL;

const ProFinishedGoodForm = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditMode = Boolean(id);

    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [categories, setCategories] = useState([]);
    const [subCategories, setSubCategories] = useState([]);
    const [units, setUnits] = useState([]);
    const [taxes, setTaxes] = useState([]);
    const [locations, setLocations] = useState([]);

    // Image Preview
    const [imagePreview, setImagePreview] = useState(null);
    const [barcodePreview, setBarcodePreview] = useState(null);
    const [existingProcess, setExistingProcess] = useState(null);

    const [formData, setFormData] = useState({
        inventoryType: 'FINISHED_GOOD',
        itemType: 'PRODUCT',
        forPurchase: true,
        forSales: true,
        categoryId: '',
        subCategoryId: '',
        itemCode: '',
        name: '',
        barcode: '',
        description: '',
        imageFile: null,
        issueUnitId: '',
        purchaseUnitId: '',
        unitRelation: 1,
        tolerancePercentage: 0,
        reorderLimit: 0,
        hsnSacCode: '',
        purchasePrice: 0,
        salesPrice: 0,
        isTaxInclusive: false,
        taxId: '',
        locationId: ''
    });

    const authHeaders = useMemo(() => ({
        "Authorization": `Bearer ${localStorage.getItem('token')}`
    }), []);

    // Fetch existing process if Edit Mode
    useEffect(() => {
        if (isEditMode) {
            const fetchProcess = async () => {
                try {
                    // Using getAll and filtering as temporary workaround
                    const res = await axios.get(`${API_URL}/production/process-finished-goods`, { headers: authHeaders });
                    const process = res.data?.content?.find(p => String(p.itemId) === String(id))
                        || res.data?.find(p => String(p.itemId) === String(id));
                    setExistingProcess(process || null);
                } catch (err) {
                    console.error("Error fetching process:", err);
                }
            };
            fetchProcess();
        }
    }, [isEditMode, id, authHeaders]);

    // Fetch master data (Categories, Units, Taxes)
    useEffect(() => {
        const fetchMasterData = async () => {
            try {
                const [catRes, unitRes, taxRes, locRes] = await Promise.all([
                    axios.get(`${API_URL}/production/categories`, { headers: authHeaders }),
                    axios.get(`${API_URL}/production/units`, { headers: authHeaders }), // Assuming endpoints match typical pattern
                    axios.get(`${API_URL}/production/taxes`, { headers: authHeaders }),
                    axios.get(`${API_URL}/locations`, { headers: authHeaders })
                ]);
                setCategories(Array.isArray(catRes.data) ? catRes.data : []);
                setUnits(Array.isArray(unitRes.data) ? unitRes.data : []);
                setTaxes(Array.isArray(taxRes.data) ? taxRes.data : []);
                setLocations(Array.isArray(locRes.data) ? locRes.data : []);
            } catch (err) {
                console.error("Error fetching master data:", err);
            }
        };
        fetchMasterData();
    }, [authHeaders]);

    // Fetch existing item if Edit mode
    useEffect(() => {
        if (isEditMode) {
            const fetchItem = async () => {
                setLoading(true);
                try {
                    const response = await axios.get(`${API_URL}/production/finished-goods/${id}`, { headers: authHeaders });
                    const item = response.data;

                    setFormData({
                        inventoryType: item.inventoryType || 'FINISHED_GOOD',
                        itemType: item.itemType || 'PRODUCT',
                        forPurchase: item.forPurchase,
                        forSales: item.forSales,
                        categoryId: item.categoryId || '',
                        subCategoryId: item.subCategoryId || '',
                        itemCode: item.itemCode || '',
                        name: item.name || '',
                        barcode: item.barcode || '',
                        description: item.description || '',
                        imageFile: null, // Keep null, we handle preview separately
                        issueUnitId: item.issueUnitId || '',
                        purchaseUnitId: item.purchaseUnitId || '',
                        unitRelation: item.unitRelation || 1,
                        tolerancePercentage: item.tolerancePercentage || 0,
                        reorderLimit: item.reorderLimit || 0,
                        hsnSacCode: item.hsnSacCode || '',
                        purchasePrice: item.purchasePrice || 0,
                        salesPrice: item.salesPrice || 0,
                        isTaxInclusive: item.isTaxInclusive,
                        taxId: item.taxId || '',
                        locationId: item.locationId || ''
                    });

                    // Load Product Image
                    if (item.picturePath) {
                        try {
                            const imageRes = await axios.get(`${API_URL}/production/finished-goods/${id}/image`, {
                                headers: authHeaders,
                                responseType: 'blob'
                            });
                            const imageUrl = URL.createObjectURL(imageRes.data);
                            setImagePreview(imageUrl);
                        } catch (imgErr) {
                            console.error("Failed to load image:", imgErr);
                        }
                    }

                    // Load Barcode Image (if exists)
                    if (item.barcodeImgUrl) {
                        try {
                            const barcodeRes = await axios.get(`${API_URL}/production/finished-goods/${id}/barcode-image`, {
                                headers: authHeaders,
                                responseType: 'blob'
                            });
                            const barcodeUrl = URL.createObjectURL(barcodeRes.data);
                            setBarcodePreview(barcodeUrl);
                        } catch (bcErr) {
                            console.error("Failed to load barcode:", bcErr);
                        }
                    }
                } catch (err) {
                    console.error("Error fetching item:", err);
                    alert("Failed to load item details.");
                    navigate('/production/finished-goods');
                } finally {
                    setLoading(false);
                }
            };
            fetchItem();
        }
    }, [id, isEditMode, authHeaders, navigate]);

    // Fetch subcategories when category changes
    useEffect(() => {
        if (formData.categoryId) {
            const fetchSub = async () => {
                try {
                    const res = await axios.get(`${API_URL}/production/sub-categories?categoryId=${formData.categoryId}`, { headers: authHeaders });
                    setSubCategories(res.data);
                } catch (err) { console.error(err); }
            };
            fetchSub();
        } else {
            setSubCategories([]);
        }
    }, [formData.categoryId, authHeaders]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setFormData(prev => ({ ...prev, imageFile: file }));
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);

        const data = new FormData();
        // Append all fields
        Object.keys(formData).forEach(key => {
            if (key !== 'imageFile') {
                data.append(key, formData[key]);
            }
        });
        if (formData.imageFile) {
            data.append('imageFile', formData.imageFile);
        }

        try {
            const url = isEditMode
                ? `${API_URL}/production/${id}`
                : `${API_URL}/production/`;
            const method = isEditMode ? 'put' : 'post';

            await axios({
                method,
                url,
                data,
                headers: {
                    ...authHeaders,
                    'Content-Type': 'multipart/form-data'
                }
            });

            // alert(isEditMode ? "Item updated successfully!" : "Item created successfully!");
            navigate('/production/finished-goods');
        } catch (err) {
            console.error("Submission failed:", err);
            alert(`Error: ${err.response?.data?.message || 'Operation failed.'}`);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader className="animate-spin h-8 w-8 text-purple-600" />
            </div>
        );
    }

    return (
        <ProductionLayout activeTab="Finished Good" title={isEditMode ? "Edit Finished Good" : "New Finished Good"}>
            <div className="max-w-7xl mx-auto">

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Top Section: Inventory Type & Flags */}
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                            <div>
                                <label className="label block mb-1 font-medium text-sm text-gray-700 dark:text-gray-300">Inventory Type</label>
                                <select
                                    name="inventoryType"
                                    value={formData.inventoryType}
                                    onChange={handleChange}
                                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-slate-900"
                                >
                                    <option value="FINISHED_GOOD">Finished Good</option>
                                    <option value="SEMI_FINISHED">Semi Finished</option> {/* Optional if needed */}
                                </select>
                            </div>
                            <div>
                                <label className="label block mb-1 font-medium text-sm text-gray-700 dark:text-gray-300">Item Type</label>
                                <div className="flex gap-4 mt-2">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="itemType"
                                            value="PRODUCT"
                                            checked={formData.itemType === 'PRODUCT'}
                                            onChange={handleChange}
                                            className="text-purple-600 focus:ring-purple-500"
                                        />
                                        <span>Product</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="itemType"
                                            value="SERVICE"
                                            checked={formData.itemType === 'SERVICE'}
                                            onChange={handleChange}
                                            className="text-purple-600 focus:ring-purple-500"
                                        />
                                        <span>Service</span>
                                    </label>
                                </div>
                            </div>
                            <div>
                                <label className="label block mb-1 font-medium text-sm text-gray-700 dark:text-gray-300">Item For</label>
                                <div className="flex gap-4 mt-2">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            name="forPurchase"
                                            checked={formData.forPurchase}
                                            onChange={handleChange}
                                            className="rounded text-purple-600 focus:ring-purple-500"
                                        />
                                        <span>Purchase</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            name="forSales"
                                            checked={formData.forSales}
                                            onChange={handleChange}
                                            className="rounded text-purple-600 focus:ring-purple-500"
                                        />
                                        <span>Sales</span>
                                    </label>
                                </div>
                            </div>
                        </div>

                        {/* General Info */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <div>
                                <label className="label block mb-1 font-medium text-sm text-gray-700 dark:text-gray-300">Category</label>
                                <select
                                    name="categoryId"
                                    value={formData.categoryId}
                                    onChange={handleChange}
                                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-slate-900"
                                >
                                    <option value="">Select Category</option>
                                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="label block mb-1 font-medium text-sm text-gray-700 dark:text-gray-300">Sub Category</label>
                                <select
                                    name="subCategoryId"
                                    value={formData.subCategoryId}
                                    onChange={handleChange}
                                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-slate-900"
                                    disabled={!formData.categoryId}
                                >
                                    <option value="">Select Sub Category</option>
                                    {subCategories.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="label block mb-1 font-medium text-sm text-gray-700 dark:text-gray-300">Item Code *</label>
                                <input
                                    type="text"
                                    name="itemCode"
                                    value={formData.itemCode}
                                    onChange={handleChange}
                                    required
                                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-slate-900"
                                />
                            </div>

                            <div className="md:col-span-2 lg:col-span-2">
                                <label className="label block mb-1 font-medium text-sm text-gray-700 dark:text-gray-300">Item Name *</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-slate-900"
                                />
                            </div>
                            <div>
                                <label className="label block mb-1 font-medium text-sm text-gray-700 dark:text-gray-300">Barcode</label>
                                <input
                                    type="text"
                                    name="barcode"
                                    value={formData.barcode}
                                    onChange={handleChange}
                                    placeholder="Leave empty to auto-generate"
                                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-slate-900"
                                />
                                {barcodePreview && (
                                    <div className="mt-2 text-center p-2 border rounded bg-white">
                                        <img src={barcodePreview} alt="Barcode" className="h-12 mx-auto" />
                                    </div>
                                )}
                            </div>

                            <div className="md:col-span-3">
                                <label className="label block mb-1 font-medium text-sm text-gray-700 dark:text-gray-300">Description</label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    rows={3}
                                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-slate-900"
                                />
                            </div>
                        </div>

                        {/* Image Upload Area */}
                        <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-6">
                            <label className="label block mb-2 font-medium text-sm text-gray-700 dark:text-gray-300">Product Image</label>
                            <div className="flex items-center gap-6">
                                <div className="h-32 w-32 bg-gray-100 dark:bg-gray-800 border rounded-lg flex items-center justify-center overflow-hidden">
                                    {imagePreview ? (
                                        <img src={imagePreview} alt="Preview" className="h-full w-full object-cover" />
                                    ) : (
                                        <ImageIcon className="text-gray-400 h-10 w-10" />
                                    )}
                                </div>
                                <div>
                                    <label className="cursor-pointer bg-white dark:bg-slate-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-slate-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors inline-flex items-center gap-2">
                                        <Upload size={16} />
                                        <span>Choose File</span>
                                        <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                                    </label>
                                    <p className="text-xs text-gray-500 mt-2">JPG, PNG or WEBP up to 2MB</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Units & Pricing */}
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                        <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-100">Units & Pricing</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                            <div>
                                <label className="label block mb-1 font-medium text-sm text-gray-700 dark:text-gray-300">Issue/Sale Unit</label>
                                <select
                                    name="issueUnitId"
                                    value={formData.issueUnitId}
                                    onChange={handleChange}
                                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-slate-900"
                                >
                                    <option value="">Select Unit</option>
                                    {units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="label block mb-1 font-medium text-sm text-gray-700 dark:text-gray-300">Purchase Unit</label>
                                <select
                                    name="purchaseUnitId"
                                    value={formData.purchaseUnitId}
                                    onChange={handleChange}
                                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-slate-900"
                                >
                                    <option value="">Select Unit</option>
                                    {units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                                </select>
                            </div>
                            <div className="col-span-2">
                                <label className="label block mb-1 font-medium text-sm text-gray-700 dark:text-gray-300">Unit Relation</label>
                                <div className="flex items-center gap-2 text-sm">
                                    <span>1 Purchase Unit =</span>
                                    <input
                                        type="number"
                                        name="unitRelation"
                                        value={formData.unitRelation}
                                        onChange={handleChange}
                                        step="0.01"
                                        className="w-24 p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-slate-900"
                                    />
                                    <span>Issue Unit(s)</span>
                                </div>
                            </div>

                            <div>
                                <label className="label block mb-1 font-medium text-sm text-gray-700 dark:text-gray-300">Tolerance (%)</label>
                                <input
                                    type="number"
                                    name="tolerancePercentage"
                                    value={formData.tolerancePercentage}
                                    onChange={handleChange}
                                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-slate-900"
                                />
                            </div>
                            <div>
                                <label className="label block mb-1 font-medium text-sm text-gray-700 dark:text-gray-300">Reorder Limit</label>
                                <input
                                    type="number"
                                    name="reorderLimit"
                                    value={formData.reorderLimit}
                                    onChange={handleChange}
                                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-slate-900"
                                />
                            </div>
                            <div className="col-span-2">
                                <label className="label block mb-1 font-medium text-sm text-gray-700 dark:text-gray-300">HSN/SAC Code</label>
                                <input
                                    type="text"
                                    name="hsnSacCode"
                                    value={formData.hsnSacCode}
                                    onChange={handleChange}
                                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-slate-900"
                                />
                            </div>

                            <div>
                                <label className="label block mb-1 font-medium text-sm text-gray-700 dark:text-gray-300">Purchase Price (₹)</label>
                                <input
                                    type="number"
                                    name="purchasePrice"
                                    value={formData.purchasePrice}
                                    onChange={handleChange}
                                    step="0.01"
                                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-slate-900"
                                />
                            </div>
                            <div>
                                <label className="label block mb-1 font-medium text-sm text-gray-700 dark:text-gray-300">Sales Price (₹)</label>
                                <div className="flex flex-col gap-2">
                                    <input
                                        type="number"
                                        name="salesPrice"
                                        value={formData.salesPrice}
                                        onChange={handleChange}
                                        step="0.01"
                                        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-slate-900"
                                    />
                                    <label className="flex items-center gap-2 cursor-pointer text-sm">
                                        <input
                                            type="checkbox"
                                            name="isTaxInclusive"
                                            checked={formData.isTaxInclusive}
                                            onChange={handleChange}
                                            className="rounded text-purple-600 focus:ring-purple-500"
                                        />
                                        <span>Tax Inclusive?</span>
                                    </label>
                                </div>
                            </div>

                            <div>
                                <label className="label block mb-1 font-medium text-sm text-gray-700 dark:text-gray-300">Tax</label>
                                <select
                                    name="taxId"
                                    value={formData.taxId}
                                    onChange={handleChange}
                                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-slate-900"
                                >
                                    <option value="">Select Tax</option>
                                    {taxes.map(t => <option key={t.id} value={t.id}>{t.name} ({t.rate}%)</option>)}
                                </select>
                            </div>

                            {/* Location - optional based on screenshot */}
                            <div>
                                <label className="label block mb-1 font-medium text-sm text-gray-700 dark:text-gray-300">Location</label>
                                <select
                                    name="locationId"
                                    value={formData.locationId}
                                    onChange={handleChange}
                                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-slate-900"
                                >
                                    <option value="">All Locations</option>
                                    {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                                </select>
                            </div>
                        </div>
                    </div> {/* End Units & Pricing Card */}

                    <div className="flex justify-end gap-4">
                        <button
                            type="button"
                            onClick={() => navigate('/production/finished-goods')}
                            className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="px-6 py-2 bg-purple-700 text-white rounded-lg hover:bg-purple-800 transition-colors flex items-center gap-2 shadow-lg hover:shadow-xl"
                        >
                            {submitting ? <Loader className="animate-spin h-5 w-5" /> : <Save size={20} />}
                            <span>{isEditMode ? 'Update Finished Good' : 'Save Finished Good'}</span>
                        </button>
                    </div>
                </form>

                {/* Process & BOM Section (Only in Edit Mode) */}
                {isEditMode && (
                    <div className="mt-8 space-y-6">
                        {/* Process Section */}
                        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                            <div className="flex justify-between items-center mb-4 border-b border-gray-100 dark:border-gray-700 pb-2">
                                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Process</h3>
                                <button
                                    onClick={() => navigate(`/production/finished-goods/${id}/process`)}
                                    className="text-purple-600 hover:text-purple-800 text-sm font-medium hover:underline"
                                >
                                    {existingProcess ? 'Edit Process' : 'Add Process'}
                                </button>
                            </div>

                            <div className="bg-gray-50 dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-gray-700">
                                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                    <thead className="bg-gray-100 dark:bg-slate-800">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Number</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Name</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Created By</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                        {existingProcess ? (
                                            <tr>
                                                <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">{existingProcess.id}</td>
                                                <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">{existingProcess.processFlowName}</td>
                                                <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">System User</td> {/* Placeholder for user */}
                                            </tr>
                                        ) : (
                                            <tr>
                                                <td colSpan="3" className="px-4 py-8 text-center text-sm text-gray-500">
                                                    No process flow defined. <button onClick={() => navigate(`/production/finished-goods/${id}/process`)} className="text-purple-600 hover:underline">Create one now</button>.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* BOM Section (Placeholder matching image) */}
                        {/* BOM Section */}
                        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                            <div className="flex justify-between items-center mb-4 border-b border-gray-100 dark:border-gray-700 pb-2">
                                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">BOM</h3>
                                <button
                                    onClick={() => navigate(`/production/finished-goods/${id}/bom`)}
                                    className="text-purple-600 hover:text-purple-800 text-sm font-medium hover:underline"
                                >
                                    Manage BOM
                                </button>
                            </div>
                            <div className="bg-gray-50 dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-gray-700 p-8 text-center text-sm text-gray-500">
                                Configure the Bill of Materials (Components, Quantities, Costs) for this item.
                                <br />
                                <button onClick={() => navigate(`/production/finished-goods/${id}/bom`)} className="mt-2 text-purple-600 font-medium hover:underline">
                                    Click here to manage BOM
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </ProductionLayout>
    );
};

export default ProFinishedGoodForm;
