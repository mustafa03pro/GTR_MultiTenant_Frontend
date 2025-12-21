import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Loader, ArrowLeft, Package, Tag, AlertCircle, ShoppingCart } from 'lucide-react';
import { motion } from 'framer-motion';

const API_URL = import.meta.env.VITE_API_BASE_URL;

const ProductScanResult = () => {
    const { barcode } = useParams();
    const navigate = useNavigate();
    const [variant, setVariant] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchVariant = async () => {
            try {
                setLoading(true);
                const token = localStorage.getItem('token');
                // The backend controller endpoint provided by user: /api/pos/product-variants/barcode/:barcode
                const response = await axios.get(`${API_URL}/pos/product-variants/barcode/${barcode}`, {
                    headers: { "Authorization": `Bearer ${token}` }
                });
                setVariant(response.data);
            } catch (err) {
                console.error("Error fetching product:", err);
                setError('Product not found or invalid barcode.');
            } finally {
                setLoading(false);
            }
        };

        if (barcode) {
            fetchVariant();
        }
    }, [barcode]);

    const constructImageUrl = (relativeUrl) => {
        if (!relativeUrl) return null;
        if (relativeUrl.startsWith('data:') || relativeUrl.startsWith('http')) return relativeUrl;
        const cleanPath = relativeUrl.startsWith('/') ? relativeUrl.slice(1) : relativeUrl;
        if (cleanPath.startsWith('uploads/')) {
            return `${API_URL}/pos/uploads/view/${cleanPath.replace('uploads/', '')}`;
        }
        return `${API_URL}/pos/uploads/view/${cleanPath}`;
    };

    const formatPrice = (cents) => {
        return new Intl.NumberFormat('en-AE', { style: 'currency', currency: 'AED' }).format(cents / 100);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
                <Loader className="w-12 h-12 text-blue-600 animate-spin mb-4" />
                <h2 className="text-xl font-semibold text-slate-700">Scanning Product...</h2>
            </div>
        );
    }

    if (error || !variant) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <div className="bg-white max-w-md w-full rounded-2xl shadow-xl p-8 text-center">
                    <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                        <AlertCircle size={32} />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800 mb-2">Product Not Found</h2>
                    <p className="text-slate-500 mb-8">{error || "We couldn't find a product matching this barcode."}</p>
                    <button
                        onClick={() => navigate(-1)}
                        className="btn-primary w-full flex items-center justify-center gap-2 py-3"
                    >
                        <ArrowLeft size={20} /> Go Back
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4 md:p-8">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[500px]"
            >
                {/* Image Section */}
                <div className="w-full md:w-1/2 bg-slate-50 p-8 flex items-center justify-center relative">
                    <div className="absolute top-4 left-4 z-10">
                        <button
                            onClick={() => navigate(-1)}
                            className="p-2 bg-white/80 backdrop-blur-sm hover:bg-white rounded-full text-slate-600 hover:text-blue-600 transition-colors shadow-sm"
                        >
                            <ArrowLeft size={24} />
                        </button>
                    </div>

                    {variant.imageUrl ? (
                        <motion.img
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            src={constructImageUrl(variant.imageUrl)}
                            alt={variant.name}
                            className="max-w-full max-h-[400px] object-contain mix-blend-multiply drop-shadow-xl"
                        />
                    ) : (
                        <div className="flex flex-col items-center justify-center text-slate-300">
                            <Package size={80} strokeWidth={1} />
                            <span className="mt-4 text-lg font-medium">No Image Available</span>
                        </div>
                    )}
                </div>

                {/* Details Section */}
                <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center">
                    <div className="mb-2">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase ${variant.active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                            {variant.active ? 'Active' : 'Inactive'}
                        </span>
                    </div>

                    <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-2 leading-tight">
                        {/* Assuming the DTO has product name nested or flattened. The user DTO snippet in Turn 0 showed flat fields like name if mapped properly, 
                           but verifying: User's ProductVariantDto has `sku`, `barcode`, `priceCents`. 
                           Wait, `ProductVariantDto` in Code Turn 0 does NOT seem to have `productName`. 
                           Let's check `toDto` in `ProductVariantService`.
                           It maps: id, sku, barcode, attributes, priceCents, active, costCents, imageUrl...
                           It does NOT map product name!
                           
                           CRITICAL: The updated `toDto` needs to include product name or I fetched it wrong.
                           In `ProductVariantService.java`:
                           `dto.setId(variant.getId()); ...`
                           It seems product name is missing from the DTO in the user's provided code.
                           
                           I will assume for now I might need to fetch the product name separately or the backend was updated.
                           However, `ProductVariant` entity has `product`.
                           
                           If the DTO is missing the name, I'll have to show SKU or something else as the title, or hope the user updated the DTO.
                           Wait, look at `ProductService.java` for `getAllProducts`: it returns `ProductDto` which has `name`.
                           But `getVariantByBarcode` returns `ProductVariantDto`.
                           
                           I will handle this gracefully. If `variant.productName` exists usage it, else use SKU.
                           Actually, looking at `ProductVariantService.java` in Turn 0:
                           `toDto` does NOT set product name.
                           
                           I should probably Update `toDto` in my mental model or asking user? 
                           No, I can't edit backend.
                           
                           I will check if `variant.name` exists in the response structure (maybe generic name?).
                           It's safer to display SKU if Name is missing, or try to display `variant.product?.name` if the backend returns nested object (unlikely for DTO).
                           
                           I will put a placeholder or SKU for now.
                        */}
                        {variant.productName || variant.sku || "Unknown Product"}
                    </h1>

                    <div className="flex items-center gap-2 mb-6 text-slate-500 font-medium">
                        <Tag size={18} />
                        <span>SKU: {variant.sku}</span>
                    </div>

                    <div className="mb-8">
                        <span className="text-5xl font-bold text-blue-600 tracking-tight">
                            {formatPrice(variant.priceCents)}
                        </span>
                        {variant.taxRateName && (
                            <p className="text-sm text-slate-400 mt-2 font-medium">
                                + {variant.taxRatePercent}% {variant.taxRateName}
                            </p>
                        )}
                    </div>

                    {variant.attributes && Object.keys(variant.attributes).length > 0 && (
                        <div className="mb-8 p-6 bg-slate-50 rounded-2xl border border-slate-100">
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Specifications</h3>
                            <div className="grid grid-cols-2 gap-y-4 gap-x-8">
                                {Object.entries(variant.attributes).map(([key, value]) => (
                                    <div key={key}>
                                        <p className="text-xs text-slate-400 uppercase font-semibold">{key}</p>
                                        <p className="text-slate-800 font-medium">{value}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="mt-auto">
                        <div className="w-full bg-slate-900 text-white py-4 rounded-xl flex items-center justify-center gap-3 shadow-lg shadow-slate-900/20">
                            <BarcodeIcon className="w-6 h-6 text-slate-400" />
                            <span className="font-mono text-lg tracking-widest">{variant.barcode}</span>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

const BarcodeIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 5v14" /><path d="M8 5v14" /><path d="M12 5v14" /><path d="M17 5v14" /><path d="M21 5v14" />
    </svg>
);

export default ProductScanResult;
