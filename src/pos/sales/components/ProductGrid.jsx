import React from 'react';
import { ShoppingCart, Download, Plus, Package, Tag } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatPrice, constructImageUrl, formatVariantAttributes } from '../utils';

const ProductCard = ({ product, variant, onAddToCart, onDownloadBarcode }) => {
    const mainAction = () => onAddToCart(product, variant, variant.quantity);
    const isOutOfStock = variant.quantity <= 0;

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            whileHover={{ y: -5 }}
            transition={{ duration: 0.2 }}
            className="group relative bg-white rounded-2xl shadow-sm hover:shadow-xl hover:shadow-blue-900/5 border border-slate-100 overflow-hidden h-full flex flex-col will-change-transform"
        >
            {/* Quick Actions Overlay - Top Right */}
            <div className="absolute top-3 right-3 z-20 flex gap-2">
                <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={(e) => onDownloadBarcode(e, variant.id, variant.sku)}
                    className="p-2 bg-white/80 backdrop-blur-md text-slate-400 hover:text-blue-600 hover:bg-white rounded-full shadow-sm border border-slate-100 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0"
                    title="Download QR Code"
                >
                    <Download size={16} strokeWidth={2} />
                </motion.button>
            </div>

            {/* Main Click Area */}
            <button
                onClick={mainAction}
                className="flex-grow flex flex-col text-left focus:outline-none w-full"
                disabled={isOutOfStock}
            >
                {/* Image Container */}
                <div className="relative w-full aspect-[4/3] bg-slate-50 overflow-hidden p-6 flex items-center justify-center">
                    {/* Background decoration */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-slate-50 to-white opacity-50" />

                    {variant.imageUrl && !isOutOfStock ? (
                        <motion.img
                            whileHover={{ scale: 1.05 }}
                            transition={{ duration: 0.4 }}
                            src={constructImageUrl(variant.imageUrl)}
                            alt={product.name}
                            className="w-full h-full object-contain mix-blend-multiply relative z-10"
                        />
                    ) : (
                        <div className="flex flex-col items-center justify-center text-slate-300 gap-3 relative z-10">
                            <div className="p-4 bg-white rounded-full shadow-sm">
                                <ShoppingCart size={24} strokeWidth={1.5} />
                            </div>
                            <span className="text-xs font-medium text-slate-400">No Image</span>
                        </div>
                    )}

                    {/* Stock Badge Overlay */}
                    {isOutOfStock ? (
                        <div className="absolute inset-0 z-20 bg-slate-50/60 backdrop-blur-[2px] flex items-center justify-center">
                            <span className="bg-red-50 text-red-600 text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wider border border-red-100 shadow-sm">
                                Out of Stock
                            </span>
                        </div>
                    ) : (
                        <div className="absolute bottom-3 left-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <span className="bg-white/90 backdrop-blur text-blue-700 text-[10px] font-bold px-2 py-1 rounded-md shadow-sm border border-blue-100 flex items-center gap-1">
                                <Package size={10} />
                                {variant.quantity} left
                            </span>
                        </div>
                    )}
                </div>

                {/* Content Container */}
                <div className="p-4 flex flex-col flex-grow relative bg-white">
                    {/* Header: Name & Variant */}
                    <div className="mb-3 space-y-1">
                        <div className="flex justify-between items-start gap-2">
                            <h3 className="font-bold text-slate-800 leading-tight text-sm line-clamp-2 group-hover:text-blue-600 transition-colors" title={product.name}>
                                {product.name}
                            </h3>
                        </div>

                        {formatVariantAttributes(variant.attributes) && (
                            <div className="flex items-center gap-1.5">
                                <Tag size={12} className="text-slate-400" />
                                <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                                    {formatVariantAttributes(variant.attributes)}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Description - Optional/Collapsible could go here but keeping simple */}

                    {/* Barcode Image */}
                    {variant.barcodeImageUrl && (
                        <div className="mt-2 mb-1 h-12 flex items-center justify-center overflow-hidden">
                            <img
                                src={constructImageUrl(variant.barcodeImageUrl)}
                                alt="Barcode"
                                className="h-full max-w-full object-contain mix-blend-multiply opacity-90 hover:opacity-100 transition-opacity"
                            />
                        </div>
                    )}

                    {/* Footer: Price & SKU */}
                    <div className="mt-auto pt-3 border-t border-slate-50 flex items-end justify-between">
                        <div>
                            <div className="flex items-baseline gap-1">
                                <span className="text-lg font-extrabold text-slate-900 tracking-tight">
                                    {formatPrice(variant.priceCents)}
                                </span>
                            </div>
                            {variant.sku && (
                                <p className="text-[10px] text-slate-400 font-mono mt-0.5 ml-0.5">
                                    #{variant.sku}
                                </p>
                            )}
                        </div>

                        {!isOutOfStock && (
                            <motion.div
                                className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300"
                            >
                                <Plus size={18} strokeWidth={2.5} />
                            </motion.div>
                        )}
                    </div>
                </div>
            </button>
        </motion.div>
    );
};

const ProductGrid = ({ products, onAddToCart, onDownloadBarcode }) => (
    <div className="flex-grow overflow-y-auto p-1">
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-5 md:gap-6 pb-20 p-2">
            <AnimatePresence>
                {products.flatMap(product => product.variants.map(variant => (
                    <ProductCard
                        key={variant.id}
                        product={product}
                        variant={variant}
                        onAddToCart={onAddToCart}
                        onDownloadBarcode={onDownloadBarcode}
                    />
                )))}
            </AnimatePresence>
        </div>
    </div>
);

export default ProductGrid;