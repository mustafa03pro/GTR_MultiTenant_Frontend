
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
    Search, Plus, Filter, Download, Upload,
    MoreVertical, Edit, Trash2, FileText,
    Printer, Loader, Eye, X, ChevronDown, CheckSquare, Square, FileDown, Layers, List
} from 'lucide-react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_BASE_URL;

const AuthenticatedImage = ({ itemId, alt, className }) => {
    const [src, setSrc] = useState(null);
    const authHeaders = useMemo(() => ({ "Authorization": `Bearer ${localStorage.getItem('token')}` }), []);

    useEffect(() => {
        if (!itemId) return;
        let isMounted = true;
        // Use the specific endpoint for image based on ID
        axios.get(`${API_URL}/production/finished-goods/${itemId}/image`, { headers: authHeaders, responseType: 'blob' })
            .then(res => {
                if (isMounted) setSrc(URL.createObjectURL(res.data));
            })
            .catch(err => {
                // Silent fail or console log
                // console.error("Image load error", err);
            });

        return () => { isMounted = false; };
    }, [itemId, authHeaders]);

    if (!src) return <div className={`bg-gray-100 dark:bg-gray-700 animate-pulse rounded ${className}`} />;
    return <img src={src} alt={alt} className={className} onError={(e) => { e.target.src = 'https://via.placeholder.com/40'; }} />;
};

const ProFinishedGood = () => {
    const navigate = useNavigate();

    const [goods, setGoods] = useState([]);
    const [loading, setLoading] = useState(true);
    const [categories, setCategories] = useState([]);
    const [subCategories, setSubCategories] = useState([]);

    // Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [selectedSubCategory, setSelectedSubCategory] = useState('');
    const [onlyDiscontinued, setOnlyDiscontinued] = useState(false); // Placeholder for future use if needed

    // Pagination (Client-side for now based on typical response)
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    const authHeaders = useMemo(() => ({ "Authorization": `Bearer ${localStorage.getItem('token')}` }), []);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [goodsRes, catRes] = await Promise.all([
                axios.get(`${API_URL}/production/finished-goods`, { headers: authHeaders }),
                axios.get(`${API_URL}/production/categories`, { headers: authHeaders })
            ]);
            setGoods(Array.isArray(goodsRes.data) ? goodsRes.data : []);
            setCategories(Array.isArray(catRes.data) ? catRes.data : []);
        } catch (err) {
            console.error("Error fetching data:", err);
            // alert("Failed to fetch finished goods.");
        } finally {
            setLoading(false);
        }
    }, [authHeaders]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    useEffect(() => {
        if (selectedCategory) {
            const fetchSubCats = async () => {
                try {
                    const res = await axios.get(`${API_URL}/production/sub-categories?categoryId=${selectedCategory}`, { headers: authHeaders });
                    setSubCategories(res.data);
                } catch (err) {
                    console.error("Error fetching subcategories:", err);
                }
            };
            fetchSubCats();
        } else {
            setSubCategories([]);
            setSelectedSubCategory('');
        }
    }, [selectedCategory, authHeaders]);

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this item?")) {
            try {
                await axios.delete(`${API_URL}/production/finished-goods/${id}`, { headers: authHeaders });
                setGoods(prev => prev.filter(g => g.id !== id));
            } catch (err) {
                alert("Failed to delete item.");
            }
        }
    };

    // Barcode Modal State
    const [barcodeModalData, setBarcodeModalData] = useState(null);

    const handleOpenBarcodeModal = async (item) => {
        try {
            const response = await axios.get(`${API_URL}/production/finished-goods/${item.id}/barcode-image`, {
                headers: authHeaders,
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            setBarcodeModalData({ item, url });
        } catch (err) {
            console.error("Failed to fetch barcode:", err);
            alert("Could not load barcode image.");
        }
    };

    const handleCloseBarcodeModal = () => {
        if (barcodeModalData?.url) {
            window.URL.revokeObjectURL(barcodeModalData.url); // Clean up
        }
        setBarcodeModalData(null);
    };

    const handlePrintFromModal = () => {
        if (!barcodeModalData) return;
        const { item, url } = barcodeModalData;
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(`
                <html>
                    <head>
                        <title>Print Barcode - ${item.name}</title>
                        <style>
                            body { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; }
                            img { max-width: 100%; height: auto; }
                            .label { text-align: center; font-family: sans-serif; margin-top: 10px; }
                        </style>
                    </head>
                    <body>
                        <img src="${url}" onload="window.print(); window.close();" />
                        <div className="label">${item.itemCode || ''} - ${item.name}</div>
                    </body>
                </html>
            `);
            printWindow.document.close();
        }
    };

    const handleExport = async () => {
        try {
            const response = await axios.get(`${API_URL}/production/finished-goods/export`, {
                headers: authHeaders,
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'finished_goods_export.xlsx');
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            alert("Export failed.");
        }
    };

    const handleDownloadTemplate = async () => {
        try {
            const response = await axios.get(`${API_URL}/production/finished-goods/import-template`, {
                headers: authHeaders,
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'finished_goods_import_template.xlsx');
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            console.error(err);
            alert("Failed to download template.");
        }
    };

    const handleImport = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        try {
            setLoading(true);
            await axios.post(`${API_URL}/production/finished-goods/import`, formData, {
                headers: {
                    ...authHeaders,
                    'Content-Type': 'multipart/form-data'
                }
            });
            alert("Import successful!");
            fetchData(); // Refresh list
        } catch (err) {
            console.error("Import failed:", err);
            alert(`Import failed: ${err.response?.data?.message || err.message}`);
        } finally {
            setLoading(false);
            e.target.value = null; // Reset input
        }
    };

    // ... (Filter Logic)

    // Filter Logic
    const filteredGoods = useMemo(() => {
        return goods.filter(item => {
            const matchesSearch =
                (item.name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
                (item.itemCode?.toLowerCase() || '').includes(searchQuery.toLowerCase());

            const matchesCategory = selectedCategory ? String(item.categoryId) === String(selectedCategory) : true;
            const matchesSubCategory = selectedSubCategory ? String(item.subCategoryId) === String(selectedSubCategory) : true;

            return matchesSearch && matchesCategory && matchesSubCategory;
        });
    }, [goods, searchQuery, selectedCategory, selectedSubCategory]);

    // Pagination Logic
    const totalPages = Math.ceil(filteredGoods.length / itemsPerPage);
    const paginatedGoods = filteredGoods.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    return (
        <div className="p-6 bg-gray-50 dark:bg-slate-900 min-h-screen relative">
            {/* Header / Actions */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Finished Goods</h1>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">Manage your production finished items</p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={handleDownloadTemplate}
                        className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-purple-200 dark:border-purple-900 text-purple-700 dark:text-purple-300 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/30 transition-colors"
                    >
                        <FileDown size={18} />
                        <span>Template</span>
                    </button>
                    <button
                        onClick={handleExport}
                        className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-purple-200 dark:border-purple-900 text-purple-700 dark:text-purple-300 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/30 transition-colors"
                    >
                        <Download size={18} />
                        <span>Export</span>
                    </button>
                    <label className="flex items-center gap-2 px-4 py-2 bg-purple-700 text-white rounded-lg hover:bg-purple-800 transition-colors cursor-pointer">
                        <Upload size={18} />
                        <span>Import</span>
                        <input type="file" accept=".xlsx, .xls" className="hidden" onChange={handleImport} />
                    </label>
                    <button
                        onClick={() => navigate('/production/finished-goods/new')}
                        className="flex items-center gap-2 px-4 py-2 bg-purple-700 text-white rounded-lg hover:bg-purple-800 transition-colors shadow-sm"
                    >
                        <Plus size={18} />
                        <span>New Finished Good</span>
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm mb-6">
                <div className="flex flex-col md:flex-row gap-4 items-center">
                    <div className="w-full md:w-1/4">
                        <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Category</label>
                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="w-full p-2 bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-gray-600 rounded-lg text-sm"
                        >
                            <option value="">All Categories</option>
                            {categories.map(cat => (
                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="w-full md:w-1/4">
                        <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Sub Category</label>
                        <select
                            value={selectedSubCategory}
                            onChange={(e) => setSelectedSubCategory(e.target.value)}
                            className="w-full p-2 bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-gray-600 rounded-lg text-sm"
                            disabled={!selectedCategory}
                        >
                            <option value="">All Sub Categories</option>
                            {subCategories.map(sub => (
                                <option key={sub.id} value={sub.id}>{sub.name}</option>
                            ))}
                        </select>
                    </div>
                    {/* Search Bar - aligned to right or flex grow */}
                    <div className="w-full md:flex-1 flex items-end gap-2">
                        <div className="relative w-full">
                            <input
                                type="text"
                                placeholder="Search by Item Code or Name..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        </div>
                        <button className="px-4 py-2 bg-purple-700 text-white rounded-lg text-sm hover:bg-purple-800">
                            Search
                        </button>
                    </div>
                </div>
            </div>

            {/* Pagination Controls Top (Optional matching screenshot style) */}
            <div className="flex justify-between items-center mb-4 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-center gap-2">
                    <span>Page Size</span>
                    <select
                        value={itemsPerPage}
                        onChange={(e) => setItemsPerPage(Number(e.target.value))}
                        className="p-1 border border-gray-300 rounded"
                    >
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                    </select>
                    <span>Total Records: {filteredGoods.length}</span>
                </div>

                {/* Placeholder for Discontinue Checkbox from screenshot */}
                <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                        type="checkbox"
                        checked={onlyDiscontinued}
                        onChange={(e) => setOnlyDiscontinued(e.target.checked)}
                        className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                    <span>Only Discontinue Item</span>
                </label>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-purple-50 dark:bg-purple-900/20">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">S.No.</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Category</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Sub Category</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Name</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Picture</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Item Code</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Barcode</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">HSN/SAC</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Type</th>
                                <th className="px-6 py-3 text-right text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Rate</th>
                                <th className="px-6 py-3 text-center text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Action</th>
                                <th className="px-6 py-3 text-center text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Print Barcode</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {loading ? (
                                <tr>
                                    <td colSpan="12" className="px-6 py-10 text-center">
                                        <Loader className="animate-spin h-8 w-8 text-purple-600 mx-auto" />
                                    </td>
                                </tr>
                            ) : paginatedGoods.length > 0 ? (
                                paginatedGoods.map((item, index) => (
                                    <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {(currentPage - 1) * itemsPerPage + index + 1}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{item.categoryName || '-'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{item.subCategoryName || '-'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">{item.name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {/* ID-based image fetching for reliability */}
                                            <AuthenticatedImage
                                                itemId={item.id}
                                                alt="Item"
                                                className="h-10 w-10 object-cover rounded border border-gray-200"
                                            />
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{item.itemCode}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{item.barcode}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{item.hsnSacCode}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{item.itemType}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 text-right font-medium">
                                            {item.salesPrice}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <button
                                                    onClick={() => navigate(`/production/finished-goods/edit/${item.id}`)}
                                                    className="p-1.5 bg-purple-100 text-purple-600 rounded hover:bg-purple-200 transition-colors"
                                                    title="Edit"
                                                >
                                                    <Edit size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(item.id)}
                                                    className="p-1.5 bg-red-100 text-red-600 rounded hover:bg-red-200 transition-colors"
                                                    title="Delete"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                                <button
                                                    onClick={() => navigate(`/production/finished-goods/${item.id}/process`)}
                                                    className="p-1.5 bg-blue-100 text-blue-600 rounded hover:bg-blue-200 transition-colors"
                                                    title="Manage Process"
                                                >
                                                    <Layers size={16} />
                                                </button>
                                                <button
                                                    onClick={() => navigate(`/production/finished-goods/${item.id}/bom`)}
                                                    className="p-1.5 bg-amber-100 text-amber-600 rounded hover:bg-amber-200 transition-colors"
                                                    title="Manage BOM"
                                                >
                                                    <List size={16} />
                                                </button>
                                            </div>
                                            {/* Mock Continue Checkbox from screenshot */}
                                            <div className="mt-2 text-xs flex items-center justify-center gap-1 text-gray-500">
                                                <input type="checkbox" className="rounded text-purple-600 focus:ring-purple-500" defaultChecked />
                                                <span>Continue</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            <button
                                                onClick={() => handleOpenBarcodeModal(item)}
                                                className="text-purple-600 hover:text-purple-800 text-sm font-medium hover:underline"
                                            >
                                                Print Barcode
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="12" className="px-6 py-12 text-center text-gray-500">
                                        No items found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Footer / Pagination matching screenshot roughly */}
                <div className="bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 px-6 py-3 flex items-center justify-between">
                    <div className="text-sm text-gray-500">
                        Showing {paginatedGoods.length} of {filteredGoods.length} entries
                    </div>
                    <div className="flex gap-1">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                            <button
                                key={page}
                                onClick={() => setCurrentPage(page)}
                                className={`px-3 py-1 rounded border text-sm ${currentPage === page
                                    ? 'bg-purple-600 text-white border-purple-600'
                                    : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                                    }`}
                            >
                                {page}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Barcode Print Modal */}
            {barcodeModalData && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-md w-full overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">Print Barcode</h3>
                            <button onClick={handleCloseBarcodeModal} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded-full p-1 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-8 flex flex-col items-center justify-center space-y-4 bg-gray-50 dark:bg-slate-900/50">
                            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                                <img src={barcodeModalData.url} alt="Barcode Preview" className="max-w-full h-auto" />
                            </div>
                            <div className="text-center">
                                <p className="font-mono font-medium text-lg text-gray-800 dark:text-gray-200">{barcodeModalData.item.itemCode}</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{barcodeModalData.item.name}</p>
                            </div>
                        </div>
                        <div className="p-4 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-3 bg-gray-50 dark:bg-slate-900">
                            <button
                                onClick={handleCloseBarcodeModal}
                                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handlePrintFromModal}
                                className="flex items-center gap-2 px-4 py-2 bg-purple-700 text-white rounded-lg hover:bg-purple-800 shadow-md hover:shadow-lg transition-all"
                            >
                                <Printer size={18} />
                                <span>Print</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
export default ProFinishedGood;
