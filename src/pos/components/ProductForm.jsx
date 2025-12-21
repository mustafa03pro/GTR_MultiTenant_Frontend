import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { PlusCircle, X, Trash2, Barcode } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_BASE_URL;

const constructImageUrl = (relativeUrl) => {
    if (!relativeUrl || relativeUrl.startsWith('data:') || relativeUrl.startsWith('http')) {
        return relativeUrl;
    }
    const pathParts = relativeUrl.split('/').filter(p => p);
    if (pathParts[0] === 'uploads' && pathParts.length >= 4) {
        return `${API_URL}/pos/uploads/view/${pathParts.slice(1).join('/')}`;
    }
    return `${API_URL}${relativeUrl}`;
};

const ProductForm = ({ product, onSave, onCancel, isSubmitting, onGenerateBarcode }) => {
    const [formData, setFormData] = useState(product || { name: '', sku: '', description: '', categoryId: null, active: true, variants: [{ sku: '', barcode: '', price: 0, cost: 0, attributes: {}, imageUrl: null, imageFile: null, taxRateId: null, active: true }] });
    const [taxRates, setTaxRates] = useState([]);
    const [categories, setCategories] = useState([]);

    useEffect(() => {
        const initialVariants = [{ sku: '', barcode: '', price: 0, cost: 0, attributes: {}, imageUrl: null, imageFile: null, taxRateId: null, active: true }];
        if (product) {
            setFormData({
                ...product,
                variants: product.variants.map(v => ({
                    ...v,
                    imageFile: null,
                    price: v.priceCents ? v.priceCents / 100 : 0,
                    cost: v.costCents ? v.costCents / 100 : 0
                }))
            });
        } else {
            setFormData({ name: '', sku: '', description: '', categoryId: null, active: true, variants: initialVariants });
        }
    }, [product]);

    useEffect(() => {
        const fetchTaxRates = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await axios.get(`${API_URL}/pos/tax-rates`, { headers: { "Authorization": `Bearer ${token}` } });
                setTaxRates(response.data);
            } catch (err) { console.error("Failed to fetch tax rates:", err); }
        };
        fetchTaxRates();

        const fetchCategories = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await axios.get(`${API_URL}/pos/categories`, { headers: { "Authorization": `Bearer ${token}` } });
                setCategories(response.data);
            } catch (err) { console.error("Failed to fetch categories:", err); }
        };
        fetchCategories();
    }, []);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleVariantChange = (index, e) => {
        const { name, value, type, checked } = e.target;
        const newVariants = [...formData.variants];
        newVariants[index][name] = type === 'checkbox' ? checked : value;
        setFormData(prev => ({ ...prev, variants: newVariants }));
    };

    const handleAttributeChange = (variantIndex, attrIndex, field, value) => {
        const newVariants = [...formData.variants];
        let newAttributes = { ...newVariants[variantIndex].attributes };
        const oldKey = Object.keys(newAttributes)[attrIndex];

        if (field === 'key') {
            const oldValue = newAttributes[oldKey];
            const { [oldKey]: _, ...rest } = newAttributes;
            newAttributes = { ...rest, [value]: oldValue };
        } else {
            newAttributes[oldKey] = value;
        }
        newVariants[variantIndex].attributes = newAttributes;
        setFormData(prev => ({ ...prev, variants: newVariants }));
    };

    const addAttribute = (variantIndex) => {
        const newVariants = [...formData.variants];
        newVariants[variantIndex].attributes[`new_attribute_${Object.keys(newVariants[variantIndex].attributes).length + 1}`] = '';
        setFormData(prev => ({ ...prev, variants: newVariants }));
    };

    const removeAttribute = (variantIndex, keyToRemove) => {
        const newVariants = [...formData.variants];
        const newAttributes = { ...newVariants[variantIndex].attributes };
        delete newAttributes[keyToRemove];
        newVariants[variantIndex].attributes = newAttributes;
        setFormData(prev => ({ ...prev, variants: newVariants }));
    }

    const handleVariantImageChange = (index, e) => {
        const file = e.target.files[0];
        if (file) {
            const newVariants = [...formData.variants];
            newVariants[index].imageFile = file;
            const reader = new FileReader();
            reader.onloadend = () => {
                newVariants[index].imageUrl = reader.result;
                setFormData(prev => ({ ...prev, variants: newVariants }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleUpload = async (imageFile) => {
        try {
            const formData = new FormData();
            formData.append("file", imageFile);
            const token = localStorage.getItem('token');
            const response = await axios.post(`${API_URL}/pos/uploads/product-image`, formData, {
                headers: { "Authorization": `Bearer ${token}`, "Content-Type": "multipart/form-data" },
            });
            return response.data.imageUrl;
        } catch (error) {
            console.error("Upload failed:", error);
            alert("Failed to upload image. Please try again.");
            return null;
        }
    };

    const addVariant = () => {
        setFormData(prev => ({ ...prev, variants: [...prev.variants, { sku: '', barcode: '', price: 0, cost: 0, attributes: {}, imageUrl: '', taxRateId: null, active: true }] }));
    };

    const removeVariant = (index) => {
        setFormData(prev => ({ ...prev, variants: prev.variants.filter((_, i) => i !== index) }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const submitProduct = async () => {
            const uploadedVariants = await Promise.all(
                (formData.variants || []).map(async (variant) => {
                    let updatedVariant = { ...variant };
                    if (updatedVariant.imageFile) {
                        const imageUrl = await handleUpload(updatedVariant.imageFile);
                        updatedVariant.imageUrl = imageUrl;
                    }

                    // Convert dollars back to cents
                    updatedVariant.priceCents = Math.round((parseFloat(updatedVariant.price) || 0) * 100);
                    updatedVariant.costCents = Math.round((parseFloat(updatedVariant.cost) || 0) * 100);

                    // Remove temporary fields if needed, or backend can ignore them
                    // delete updatedVariant.price;
                    // delete updatedVariant.cost;

                    return updatedVariant;
                })
            );
            const productData = { ...formData, categoryId: formData.categoryId === '' ? null : formData.categoryId, variants: uploadedVariants };
            onSave(productData);
        };
        submitProduct().catch(error => console.error("Error during product save:", error));
    };

    return (
        <form id="product-form" onSubmit={handleSubmit} className="p-6 flex-grow overflow-y-auto pb-28">
            <div className="space-y-4">
                <h3 className="text-lg font-medium text-slate-800">Product Details</h3>
                <div><label htmlFor="name" className="label">Name</label><input id="name" name="name" value={formData.name} onChange={handleChange} required className="input" /></div>
                <div><label htmlFor="sku" className="label">SKU</label><input id="sku" name="sku" value={formData.sku} onChange={handleChange} className="input" /></div>
                <div><label htmlFor="description" className="label">Description</label><textarea id="description" name="description" value={formData.description} onChange={handleChange} rows="3" className="input" /></div>
                <div>
                    <label htmlFor="categoryId" className="label">Category</label>
                    <select id="categoryId" name="categoryId" value={formData.categoryId || ''} onChange={handleChange} className="input">
                        <option value="">Uncategorized</option>
                        {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                    </select>
                </div>
                <label className="flex items-center gap-2"><input type="checkbox" name="active" checked={formData.active} onChange={handleChange} className="h-4 w-4 rounded" /> Active</label>
            </div>

            <div className="mt-8">
                <div className="flex justify-between items-center mb-2">
                    <h3 className="text-lg font-medium text-slate-800">Variants</h3>
                    <button type="button" onClick={addVariant} className="btn-secondary text-xs py-1 px-2 flex items-center gap-1"><PlusCircle size={14} /> Add Variant</button>
                </div>
                <div className="space-y-4">
                    {formData.variants.map((variant, index) => (
                        <div key={index} className="p-4 border rounded-lg bg-slate-50 relative">
                            {formData.variants.length > 1 && <button type="button" onClick={() => removeVariant(index)} className="absolute top-2 right-2 p-1 text-slate-400 hover:text-red-600"><X size={16} /></button>}
                            {onGenerateBarcode && variant.barcodeImageUrl && (
                                <button type="button" onClick={() => onGenerateBarcode(variant)} className="absolute top-2 right-10 p-1.5 text-slate-500 hover:text-blue-600 bg-white/50 backdrop-blur-sm rounded-full" title="View Barcode">
                                    <Barcode size={16} />
                                </button>
                            )}
                            <div className="space-y-2 mb-4">
                                <h4 className="text-sm font-medium text-slate-600">Attributes</h4>
                                {Object.entries(variant.attributes).map(([key, value], attrIndex) => (
                                    <div key={attrIndex} className="flex items-center gap-2">
                                        <input type="text" value={key} onChange={(e) => handleAttributeChange(index, attrIndex, 'key', e.target.value)} className="input input-xs flex-1" placeholder="Attribute Name" />
                                        <input type="text" value={value} onChange={(e) => handleAttributeChange(index, attrIndex, 'value', e.target.value)} className="input input-xs flex-1" placeholder="Attribute Value" />
                                        <button type="button" onClick={() => removeAttribute(index, key)} className="p-1 text-slate-400 hover:text-red-600"><Trash2 size={14} /></button>
                                    </div>
                                ))}
                                <button type="button" onClick={() => addAttribute(index)} className="btn-secondary text-xs py-1 px-2 mt-2">Add Attribute</button>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="label text-xs">SKU</label><input name="sku" value={variant.sku} onChange={(e) => handleVariantChange(index, e)} className="input" /></div>
                                <div><label className="label text-xs">Barcode</label><input name="barcode" value={variant.barcode || ''} onChange={(e) => handleVariantChange(index, e)} className="input" /></div>
                                <div><label className="label text-xs">Price</label><input name="price" type="number" step="0.01" value={variant.price} onChange={(e) => handleVariantChange(index, e)} className="input" /></div>
                                <div><label className="label text-xs">Cost</label><input name="cost" type="number" step="0.01" value={variant.cost} onChange={(e) => handleVariantChange(index, e)} className="input" /></div>
                                <div>
                                    <label className="label text-xs">Image</label>
                                    <input type="file" accept="image/*" onChange={(e) => handleVariantImageChange(index, e)} className="input" />
                                </div>
                                <div>
                                    <label className="label text-xs">Tax Rate</label>
                                    <select name="taxRateId" value={variant.taxRateId || ''} onChange={(e) => handleVariantChange(index, e)} className="input">
                                        <option value="">No Tax</option>
                                        {taxRates.map(rate => <option key={rate.id} value={rate.id}>{rate.name} ({rate.percent}%)</option>)}
                                    </select>
                                </div>
                                <div className="col-span-2 flex items-center">
                                    <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="active" checked={variant.active} onChange={(e) => handleVariantChange(index, e)} className="h-4 w-4 rounded" /> Active Variant</label>
                                </div>
                                {variant.imageUrl && (
                                    <div className="col-span-2">
                                        <label className="label text-xs">Image Preview</label>
                                        <img src={constructImageUrl(variant.imageUrl)} alt="Variant Preview" className="w-24 h-24 object-cover rounded-md border" />
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </form>
    );
};

export default ProductForm;