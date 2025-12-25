import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import axios from 'axios';
import { Edit, Trash2, PlusCircle, Loader, Search, X, AlertCircle, Download, Upload, FileSpreadsheet, ChevronLeft, ChevronRight, Eye, Box, Tag, DollarSign, CheckCircle, XCircle, Layers, SlidersHorizontal, Warehouse } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import SemiFinishedFormPage from './SemiFinishedFormPage';

const API_URL = import.meta.env.VITE_API_BASE_URL;

const ManageSemiFinished = ({ locationId }) => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [viewingItem, setViewingItem] = useState(null);
    const [formLoading, setFormLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(0);
    const [pageSize, setPageSize] = useState(10);
    const [totalPages, setTotalPages] = useState(0);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef(null);

    const authHeaders = useMemo(() => ({ "Authorization": `Bearer ${localStorage.getItem('token')}` }), []);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const response = await axios.get(`${API_URL}/production/semi-finished`, {
                headers: authHeaders,
                params: { page: currentPage, size: pageSize, locationId: locationId === 'all' ? null : locationId, search: searchTerm }
            });
            setItems(response.data.content || []);
            setTotalPages(response.data.totalPages || 0);
        } catch (err) {
            setError('Failed to fetch data. Please ensure the backend is running and all endpoints exist.');
        } finally {
            setLoading(false);
        }
    }, [authHeaders, currentPage, pageSize, locationId, searchTerm]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleAdd = () => { setEditingItem(null); setIsFormOpen(true); };
    const handleEdit = (item) => { setEditingItem(item); setIsFormOpen(true); };
    const handleCloseForm = () => { setIsFormOpen(false); setEditingItem(null); };
    const handleView = (item) => { setViewingItem(item); };

    const handleSave = async (itemData) => {
        setFormLoading(true);
        const isUpdating = Boolean(editingItem?.id);
        const url = isUpdating ? `${API_URL}/production/semi-finished/${editingItem.id}` : `${API_URL}/production/semi-finished`;
        const method = isUpdating ? 'put' : 'post';
        try {
            await axios[method](url, itemData, { headers: authHeaders });
            await fetchData();
            handleCloseForm();
        } catch (err) {
            alert(`Error: ${err.response?.data?.message || 'Failed to save semi-finished product.'}`);
        } finally {
            setFormLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this semi-finished product?')) {
            try {
                await axios.delete(`${API_URL}/production/semi-finished/${id}`, { headers: authHeaders });
                await fetchData();
            } catch (err) {
                alert(`Error: ${err.response?.data?.message || 'Failed to delete product.'}`);
            }
        }
    };

    const handleDownloadTemplate = async () => {
        try {
            const response = await axios.get(`${API_URL}/production/semi-finished/bulk-template`, { headers: authHeaders, responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'semi_finished_bulk_upload_template.xlsx');
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) { alert('Failed to download template.'); }
    };

    const handleFileUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;
        setIsUploading(true);
        const formData = new FormData();
        formData.append('file', file);
        try {
            await axios.post(`${API_URL}/production/semi-finished/bulk`, formData, { headers: { ...authHeaders, 'Content-Type': 'multipart/form-data' } });
            alert('Semi-finished products imported successfully!');
            fetchData();
        } catch (err) {
            const errors = err.response?.data;
            const errorMessage = Array.isArray(errors) ? `Upload failed:\n- ${errors.join('\n- ')}` : (errors || 'An unknown error occurred.');
            alert(errorMessage);
        } finally {
            setIsUploading(false);
            event.target.value = null;
        }
    };

    const handleExport = async () => {
        try {
            const response = await axios.get(`${API_URL}/production/semi-finished/export`, { headers: authHeaders, responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'semi_finished_export.xlsx');
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) { alert('Failed to export data.'); }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-foreground">Manage Semi-Finished Products</h3>
                <div className="flex items-center gap-2 flex-wrap">
                    <div className="relative"><input type="text" placeholder="Search..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="input w-full sm:w-64 pr-10 bg-background-muted border-border" /><Search className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-foreground-muted" /></div>
                    <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept=".xlsx, .xls" />
                    <button onClick={handleDownloadTemplate} className="btn-secondary flex items-center gap-2" title="Download Template"><Download size={16} /></button>
                    <button onClick={() => fileInputRef.current.click()} className="btn-secondary flex items-center gap-2" disabled={isUploading}>{isUploading ? <Loader className="animate-spin h-4 w-4" /> : <Upload size={16} />}<span className="hidden sm:inline">Bulk Upload</span></button>
                    <button onClick={handleExport} className="btn-secondary flex items-center gap-2"><FileSpreadsheet size={16} /><span className="hidden sm:inline">Export</span></button>
                    <button onClick={handleAdd} className="flex items-center gap-2 btn-secondary"><PlusCircle size={16} /> Add Product</button>
                </div>
            </div>
            {error && <p className="text-red-500 mb-4">{error}</p>}
            <div className="overflow-x-auto border border-border rounded-lg">
                <table className="min-w-full divide-y divide-border">
                    <thead className="bg-background-muted">
                        <tr>
                            <th className="th-cell">#</th>
                            <th className="th-cell">Item Code</th><th className="th-cell">Name</th><th className="th-cell">Category</th><th className="th-cell">Purchase Price</th><th className="th-cell">Sales Price</th><th className="th-cell w-32">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-card divide-y divide-border text-foreground-muted">
                        {loading ? (
                            <tr><td colSpan="7" className="text-center py-10"><Loader className="animate-spin h-8 w-8 text-primary mx-auto" /></td></tr>
                        ) : items.length > 0 ? (
                            items.map((item, index) => (
                                <tr key={item.id}>
                                    <td className="td-cell">{currentPage * pageSize + index + 1}</td>
                                    <td className="td-cell font-mono text-xs">{item.itemCode}</td>
                                    <td className="td-cell font-medium text-foreground">{item.name}</td>
                                    <td className="td-cell">{item.categoryName || 'N/A'}</td>
                                    <td className="td-cell">{item.purchasePrice?.toFixed(2) || 'N/A'}</td>
                                    <td className="td-cell">{item.salesPrice?.toFixed(2) || 'N/A'}</td>
                                    <td className="td-cell">
                                        <div className="flex items-center gap-3">
                                            <button onClick={() => handleView(item)} className="text-blue-500 hover:text-blue-600" title="View"><Eye size={16} /></button>
                                            <button onClick={() => handleEdit(item)} className="text-primary hover:text-primary/80" title="Edit"><Edit size={16} /></button>
                                            <button onClick={() => handleDelete(item.id)} className="text-red-500 hover:text-red-600" title="Delete"><Trash2 size={16} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr><td colSpan="7" className="text-center py-10"><AlertCircle className="mx-auto h-12 w-12 text-foreground-muted/50" /><h3 className="mt-2 text-sm font-medium text-foreground">No Products Found</h3><p className="mt-1 text-sm">Get started by adding a new semi-finished product.</p></td></tr>
                        )}
                    </tbody>
                </table>
            </div>
            <div className="flex justify-between items-center mt-4 text-sm">
                <p className="text-foreground-muted">Page {currentPage + 1} of {totalPages}</p>
                <div className="flex items-center gap-2">
                    <button onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 0} className="btn-secondary disabled:opacity-50"><ChevronLeft size={16} /></button>
                    <button onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage >= totalPages - 1} className="btn-secondary disabled:opacity-50"><ChevronRight size={16} /></button>
                </div>
            </div>

            <AnimatePresence>
                {isFormOpen && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-40" onClick={handleCloseForm} />
                        <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', stiffness: 300, damping: 30 }} className="fixed top-0 right-0 h-full w-full max-w-2xl bg-card shadow-2xl z-50 flex flex-col">
                            <SemiFinishedFormPage item={editingItem} onSave={handleSave} onCancel={handleCloseForm} loading={formLoading} locationId={locationId} />
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {viewingItem && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-40" onClick={() => setViewingItem(null)} />
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="fixed inset-0 m-auto h-fit max-h-[90vh] w-full max-w-2xl bg-card shadow-2xl z-50 rounded-lg flex flex-col">
                            <header className="p-4 border-b flex items-center justify-between flex-shrink-0">
                                <h3 className="text-lg font-semibold text-foreground flex items-center gap-2"><Box size={20} /> Semi-Finished Product Details</h3>
                                <button onClick={() => setViewingItem(null)} className="p-1.5 rounded-full hover:bg-background-muted"><X size={20} /></button>
                            </header>
                            <div className="p-6 overflow-y-auto">
                                <div className="space-y-4">
                                    <DetailItem icon={Tag} label="Item Name" value={viewingItem.name} />
                                    <DetailItem icon={Tag} label="Item Code" value={viewingItem.itemCode} />
                                    <DetailItem icon={Layers} label="Category" value={viewingItem.categoryName || 'N/A'} />
                                    <DetailItem icon={SlidersHorizontal} label="Sub-Category" value={viewingItem.subCategoryName || 'N/A'} />
                                    <DetailItem icon={Warehouse} label="Location" value={viewingItem.locationName || 'All Locations'} />
                                    <DetailItem icon={DollarSign} label="Purchase Price" value={viewingItem.purchasePrice?.toFixed(2) || 'N/A'} />
                                    <DetailItem icon={DollarSign} label="Sales Price" value={viewingItem.salesPrice?.toFixed(2) || 'N/A'} />
                                    <div className="grid grid-cols-3 gap-4 pt-2">
                                        <FlagItem label="For Purchase" active={viewingItem.forPurchase} />
                                        <FlagItem label="For Sales" active={viewingItem.forSales} />
                                        <FlagItem label="Is Roll" active={viewingItem.isRoll} />
                                        <FlagItem label="Is Scrap" active={viewingItem.isScrapItem} />
                                        <FlagItem label="Tax Inclusive" active={viewingItem.isTaxInclusive} />
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};

const DetailItem = ({ icon: Icon, label, value }) => (
    <div className="flex items-start">
        <Icon className="h-5 w-5 text-foreground-muted mt-1 mr-3 flex-shrink-0" />
        <div>
            <p className="text-sm text-foreground-muted">{label}</p>
            <p className="font-semibold text-foreground">{value}</p>
        </div>
    </div>
);

const FlagItem = ({ label, active }) => (
    <div className="flex items-center gap-2 p-3 bg-background-muted rounded-lg">
        {active
            ? <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
            : <XCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
        }
        <span className="text-sm font-medium text-foreground">{label}</span>
    </div>
);

export default ManageSemiFinished;