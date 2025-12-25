import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Save, FileText, ChevronDown, ChevronRight, Calculator, Calendar as CalendarIcon, Loader, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ViewBomInformation from './ViewBomInformation';

const API_URL = import.meta.env.VITE_API_BASE_URL;

const ManufacturingOrderForm = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditing = !!id;

    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        productionHouseId: '',
        moNumber: '',
        salesOrderId: '',
        customerId: '',
        referenceNo: '',
        itemId: '',
        quantity: '',
        status: 'SCHEDULED', // Default
        scheduleStart: '',
        scheduleFinish: '',
        dueDate: '',
        actualStart: '',
        actualFinish: '',
        assignToId: '',
        batchNo: '',
        samplingRequestStatus: '',
        bomId: '',
    });

    const [existingFiles, setExistingFiles] = useState([]);
    const [file, setFile] = useState(null);

    // Dropdown Data
    const [locations, setLocations] = useState([]);
    const [salesOrders, setSalesOrders] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [items, setItems] = useState([]); // ProSemiFinished
    const [employees, setEmployees] = useState([]);
    const [boms, setBoms] = useState([]);

    const authHeaders = useMemo(() => ({
        headers: { "Authorization": `Bearer ${localStorage.getItem('token')}` }
    }), []);

    const fetchDependencies = useCallback(async () => {
        setLoading(true);
        try {
            const [locRes, custRes, itemRes, empRes, bomRes, soRes] = await Promise.all([
                axios.get(`${API_URL}/locations`, authHeaders).catch(() => ({ data: [] })),
                axios.get(`${API_URL}/parties`, { ...authHeaders, params: { type: 'CUSTOMER', size: 1000 } }).catch(() => ({ data: { content: [] } })),
                axios.get(`${API_URL}/production/semi-finished`, { ...authHeaders, params: { size: 1000 } }).catch(() => ({ data: { content: [] } })),
                axios.get(`${API_URL}/employees/all`, authHeaders).catch(() => ({ data: [] })),
                axios.get(`${API_URL}/production/bom-semi-finished`, { ...authHeaders, params: { size: 1000 } }).catch(() => ({ data: { content: [] } })),
                axios.get(`${API_URL}/sales/orders`, { ...authHeaders, params: { size: 1000 } }).catch(() => ({ data: { content: [] } }))
            ]);

            setLocations(locRes.data || []);
            setCustomers(custRes.data.content || custRes.data || []);
            setItems(itemRes.data.content || []);
            setEmployees(empRes.data || []);
            setBoms(bomRes.data.content || []);
            setSalesOrders(soRes.data.content || []);

            if (isEditing) {
                const response = await axios.get(`${API_URL}/production/manufacturing-orders/${id}`, authHeaders);
                populateForm(response.data);
            } else {
                setFormData(prev => ({
                    ...prev,
                    moNumber: `MO-${Date.now().toString().slice(-6)}`
                }));
            }
        } catch (err) {
            console.error("Failed to load dependencies", err);
            // alert("Failed to load necessary data.");
        } finally {
            setLoading(false);
        }
    }, [isEditing, id, authHeaders]);

    const [showBOMModal, setShowBOMModal] = useState(false);
    const [selectedBOMData, setSelectedBOMData] = useState(null);

    useEffect(() => {
        fetchDependencies();
    }, [fetchDependencies]);

    const populateForm = (data) => {
        setFormData({
            productionHouseId: data.productionHouseId || '',
            moNumber: data.moNumber || '',
            salesOrderId: data.salesOrderId || '',
            customerId: data.customerId || '',
            referenceNo: data.referenceNo || '',
            itemId: data.itemId || '',
            quantity: data.quantity || '',
            status: data.status || 'SCHEDULED',
            scheduleStart: data.scheduleStart ? data.scheduleStart.slice(0, 16) : '',
            scheduleFinish: data.scheduleFinish ? data.scheduleFinish.slice(0, 16) : '',
            dueDate: data.dueDate ? data.dueDate.slice(0, 16) : '',
            actualStart: data.actualStart ? data.actualStart.slice(0, 16) : '',
            actualFinish: data.actualFinish ? data.actualFinish.slice(0, 16) : '',
            assignToId: data.assignToId || '',
            batchNo: data.batchNo || '',
            samplingRequestStatus: data.samplingRequestStatus || '',
            bomId: data.bomId || '',
        });
        setExistingFiles(data.files || []);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        if (name === 'itemId') {
            const relatedBom = boms.find(b => b.item?.id === parseInt(value) || b.itemId === parseInt(value));
            if (relatedBom) {
                setFormData(prev => ({ ...prev, [name]: value, bomId: relatedBom.id }));
            }
        }

        if (name === 'salesOrderId' && value) {
            const so = salesOrders.find(s => s.id === parseInt(value));
            if (so) {
                setFormData(prev => ({
                    ...prev,
                    [name]: value,
                    customerId: so.customerId || '',
                    referenceNo: so.reference || '',
                }));
            }
        }
    };

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
    };

    const handleViewFile = async (fileId, fileName) => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}/production/manufacturing-orders/files/${fileId}`, {
                headers: { Authorization: `Bearer ${token}` },
                responseType: 'blob'
            });

            const file = new Blob([response.data], { type: response.headers['content-type'] });
            const fileURL = URL.createObjectURL(file);
            window.open(fileURL, '_blank');
        } catch (error) {
            console.error("Error viewing file:", error);
            alert("Failed to view file. Please try again.");
        }
    };

    const handleViewBOM = (bomId) => {
        const bom = boms.find(b => b.id === parseInt(bomId));
        if (bom) {
            setSelectedBOMData(bom);
            setShowBOMModal(true);
        }
    };

    const handleSaveBOM = async (bomData) => {
        // Since we are likely in a context where we just want to VIEW, saving might not be desired or might need to update the global BOM.
        // For now, we'll try to save it to the backend if the user edits it.
        try {
            const token = localStorage.getItem('token');
            // We need to know if we are updating. `selectedBOMData` has `id`.

            if (selectedBOMData && selectedBOMData.id) {
                await axios.put(`${API_URL}/production/bom-semi-finished/${selectedBOMData.id}`, bomData, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                alert('BOM updated successfully');
                setShowBOMModal(false);
                // Refresh BOMs list
                if (formData.itemId) {
                    const response = await axios.get(`${API_URL}/production/bom-semi-finished?itemId=${formData.itemId}`, authHeaders);
                    setBoms(response.data.content || []);
                }
            }
        } catch (err) {
            console.error("Error saving BOM:", err);
            alert("Failed to save BOM changes.");
        }
    };


    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            const payload = {
                ...formData,
                itemId: formData.itemId ? parseInt(formData.itemId) : null,
                quantity: formData.quantity ? parseFloat(formData.quantity) : 0,
                scheduleStart: formData.scheduleStart ? new Date(formData.scheduleStart).toISOString() : null,
                scheduleFinish: formData.scheduleFinish ? new Date(formData.scheduleFinish).toISOString() : null,
                dueDate: formData.dueDate ? new Date(formData.dueDate).toISOString() : null,
                actualStart: formData.actualStart ? new Date(formData.actualStart).toISOString() : null,
                actualFinish: formData.actualFinish ? new Date(formData.actualFinish).toISOString() : null,
            };

            let response;
            if (isEditing) {
                response = await axios.put(`${API_URL}/production/manufacturing-orders/${id}`, payload, authHeaders);
            } else {
                response = await axios.post(`${API_URL}/production/manufacturing-orders`, payload, authHeaders);
            }

            const orderId = response.data.id;

            if (file && orderId) {
                const uploadData = new FormData();
                uploadData.append('file', file);
                await axios.post(`${API_URL}/production/manufacturing-orders/${orderId}/files`, uploadData, {
                    headers: {
                        ...authHeaders.headers,
                        'Content-Type': 'multipart/form-data'
                    }
                });
            }

            navigate('/production-dashboard/manage-manufacturing-order');
        } catch (err) {
            console.error(err);
            alert(`Error: ${err.response?.data?.message || 'Failed to save manufacturing order.'}`);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="flex justify-center items-center h-screen"><Loader className="animate-spin h-8 w-8 text-primary" /></div>;

    return (
        <div className="flex flex-col h-screen bg-slate-50">
            {/* Header - Using the requested color */}
            <header className="bg-primary text-white shadow-md p-4 flex items-center justify-between sticky top-0 z-10">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/production-dashboard/manage-manufacturing-order')} className="p-2 rounded-full hover:bg-white/20 transition-colors">
                        <ArrowLeft className="h-6 w-6" />
                    </button>
                    <h1 className="text-xl font-bold">{isEditing ? 'Edit Manufacturing Order' : 'Add Manufacturing Order'}</h1>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={() => navigate('/production-dashboard/manage-manufacturing-order')}
                        className="px-4 py-2 text-sm font-medium bg-white text-primary rounded hover:bg-gray-100 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        form="mo-form"
                        disabled={submitting}
                        className="px-4 py-2 text-sm font-medium bg-green-600 text-white rounded hover:bg-green-700 transition-colors flex items-center gap-2 shadow-sm"
                    >
                        {submitting ? <Loader className="animate-spin h-4 w-4" /> : <Save size={16} />}
                        {isEditing ? 'Update Order' : 'Create Order'}
                    </button>
                </div>
            </header>

            <main className="flex-grow overflow-y-auto p-6 md:p-8">
                <form id="mo-form" onSubmit={handleSubmit} className="max-w-7xl mx-auto space-y-8">

                    {/* Basic Information */}
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Basic Details</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">MO Number <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    name="moNumber"
                                    required
                                    value={formData.moNumber}
                                    onChange={handleChange}
                                    className="input w-full border-gray-300 focus:border-primary focus:ring-primary"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Location</label>
                                <select
                                    name="productionHouseId"
                                    value={formData.productionHouseId}
                                    onChange={handleChange}
                                    className="input w-full border-gray-300 focus:border-primary focus:ring-primary"
                                >
                                    <option value="">Select Location</option>
                                    {locations.map(loc => (
                                        <option key={loc.id} value={loc.id}>{loc.name || loc.locationName}</option>
                                    ))}
                                    {!locations.length && <option value="HO">HO</option>}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Sales Order</label>
                                <select
                                    name="salesOrderId"
                                    value={formData.salesOrderId}
                                    onChange={handleChange}
                                    className="input w-full border-gray-300 focus:border-primary focus:ring-primary"
                                >
                                    <option value="">Select Sales Order</option>
                                    {salesOrders.map(so => (
                                        <option key={so.id} value={so.id}>{so.salesOrderNumber} - {so.customerName}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Customer</label>
                                <select
                                    name="customerId"
                                    value={formData.customerId}
                                    onChange={handleChange}
                                    className="input w-full border-gray-300 focus:border-primary focus:ring-primary"
                                >
                                    <option value="">Select Customer</option>
                                    {customers.map(c => (
                                        <option key={c.id} value={c.id}>{c.companyName || c.primaryContactPerson}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Reference No</label>
                                <input
                                    type="text"
                                    name="referenceNo"
                                    value={formData.referenceNo}
                                    onChange={handleChange}
                                    className="input w-full border-gray-300 focus:border-primary focus:ring-primary"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Production Details */}
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Production Settings</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Item <span className="text-red-500">*</span></label>
                                <select
                                    name="itemId"
                                    required
                                    value={formData.itemId}
                                    onChange={handleChange}
                                    className="input w-full border-gray-300 focus:border-primary focus:ring-primary"
                                >
                                    <option value="">Select Item</option>
                                    {items.map(item => (
                                        <option key={item.id} value={item.id}>{item.name} ({item.itemCode})</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Bill of Materials (BOM)</label>
                                <select
                                    name="bomId"
                                    value={formData.bomId}
                                    onChange={handleChange}
                                    className="input w-full border-gray-300 focus:border-primary focus:ring-primary"
                                >
                                    <option value="">Select BOM</option>
                                    {boms.map(bom => (
                                        <option key={bom.id} value={bom.id}>{bom.bomName}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Quantity <span className="text-red-500">*</span></label>
                                <input
                                    type="number"
                                    name="quantity"
                                    required
                                    step="0.01"
                                    value={formData.quantity}
                                    onChange={handleChange}
                                    className="input w-full border-gray-300 focus:border-primary focus:ring-primary"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Batch No</label>
                                <input
                                    type="text"
                                    name="batchNo"
                                    value={formData.batchNo}
                                    onChange={handleChange}
                                    className="input w-full border-gray-300 focus:border-primary focus:ring-primary"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Assign To</label>
                                <select
                                    name="assignToId"
                                    value={formData.assignToId}
                                    onChange={handleChange}
                                    className="input w-full border-gray-300 focus:border-primary focus:ring-primary"
                                >
                                    <option value="">Select Employee</option>
                                    {employees.map(e => (
                                        <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Status</label>
                                <select
                                    name="status"
                                    value={formData.status}
                                    onChange={handleChange}
                                    className="input w-full border-gray-300 focus:border-primary focus:ring-primary"
                                >
                                    <option value="SCHEDULED">Scheduled</option>
                                    <option value="IN_PROGRESS">In Progress</option>
                                    <option value="COMPLETED">Completed</option>
                                    <option value="CANCELLED">Cancelled</option>
                                </select>
                            </div>
                        </div>

                        {/* Selected BOM Details Table */}
                        {formData.bomId && (() => {
                            const selectedBom = boms.find(b => b.id === parseInt(formData.bomId));
                            if (selectedBom) {
                                return (
                                    <div className="mt-6 border-t pt-4">
                                        <h4 className="text-sm font-semibold text-gray-800 mb-3">Bill of Materials</h4>
                                        <div className="overflow-x-auto border rounded-lg">
                                            <table className="w-full text-xs text-left">
                                                <thead className="bg-gray-100 text-gray-700 font-semibold border-b">
                                                    <tr>
                                                        <th className="py-2 px-3 border-r w-16">Number</th>
                                                        <th className="py-2 px-3 border-r">Name</th>
                                                        <th className="py-2 px-3 border-r">Approximate Cost</th>
                                                        <th className="py-2 px-3 border-r">Earliest Start Date</th>
                                                        <th className="py-2 px-3 border-r">Earliest End Date</th>
                                                        <th className="py-2 px-3 w-24"></th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    <tr className="border-b last:border-0 hover:bg-gray-50">
                                                        <td className="py-2 px-3 border-r">1</td>
                                                        <td className="py-2 px-3 border-r font-medium text-gray-900">{selectedBom.bomName || selectedBom.name}</td>
                                                        <td className="py-2 px-3 border-r">{selectedBom.approximateCost || '0.26'}</td>
                                                        <td className="py-2 px-3 border-r">{formData.actualStart ? new Date(formData.actualStart).toLocaleString() : '-'}</td>
                                                        <td className="py-2 px-3 border-r">{formData.actualFinish ? new Date(formData.actualFinish).toLocaleString() : '-'}</td>
                                                        <td className="py-2 px-3 text-center">
                                                            <button type="button" onClick={() => handleViewBOM(formData.bomId)} className="text-purple-700 font-bold hover:underline text-xs">View BOM</button>
                                                        </td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                );
                            }
                            return null;
                        })()}
                    </div>

                    {/* Schedule & Timeline */}
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Schedule & Timeline</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Schedule Start</label>
                                <input
                                    type="datetime-local"
                                    name="scheduleStart"
                                    value={formData.scheduleStart}
                                    onChange={handleChange}
                                    className="input w-full border-gray-300 focus:border-primary focus:ring-primary"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Schedule Finish</label>
                                <input
                                    type="datetime-local"
                                    name="scheduleFinish"
                                    value={formData.scheduleFinish}
                                    onChange={handleChange}
                                    className="input w-full border-gray-300 focus:border-primary focus:ring-primary"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Due Date</label>
                                <input
                                    type="datetime-local"
                                    name="dueDate"
                                    value={formData.dueDate}
                                    onChange={handleChange}
                                    className="input w-full border-gray-300 focus:border-primary focus:ring-primary"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Actual Start</label>
                                <input
                                    type="datetime-local"
                                    name="actualStart"
                                    value={formData.actualStart}
                                    onChange={handleChange}
                                    className="input w-full border-gray-300 focus:border-primary focus:ring-primary"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Actual Finish</label>
                                <input
                                    type="datetime-local"
                                    name="actualFinish"
                                    value={formData.actualFinish}
                                    onChange={handleChange}
                                    className="input w-full border-gray-300 focus:border-primary focus:ring-primary"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Attachments */}
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Attachments</h3>
                        <div className="flex flex-col items-start gap-4">
                            <div className="flex items-center gap-4">
                                <input
                                    type="file"
                                    onChange={handleFileChange}
                                    className="block w-full text-sm text-slate-500
                                    file:mr-4 file:py-2 file:px-4
                                    file:rounded-full file:border-0
                                    file:text-sm file:font-semibold
                                    file:bg-blue-50 file:text-blue-700
                                    hover:file:bg-blue-100 cursor-pointer"
                                />
                            </div>
                            {existingFiles && existingFiles.length > 0 && (
                                <div className="space-y-2 w-full mt-2">
                                    {existingFiles.map((f, i) => (
                                        <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded border border-gray-200">
                                            <div className="flex items-center gap-2">
                                                <FileText size={18} className="text-blue-500" />
                                                <button
                                                    type="button"
                                                    onClick={() => handleViewFile(f.id, f.fileName)}
                                                    className="text-blue-600 hover:align-baseline text-sm font-medium hover:underline focus:outline-none text-left"
                                                >
                                                    {f.fileName}
                                                </button>
                                            </div>
                                            {/* Deletion logic if needed */}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                </form>
            </main>

            <AnimatePresence>
                {showBOMModal && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-40" onClick={() => setShowBOMModal(false)} />
                        <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', stiffness: 300, damping: 30 }} className="fixed top-0 right-0 h-full w-full max-w-5xl bg-card shadow-2xl z-50 flex flex-col bg-white">
                            <ViewBomInformation
                                bomId={selectedBOMData?.id}
                                onClose={() => setShowBOMModal(false)}
                                quantity={formData.quantity || 1}
                                startDate={formData.actualStart}
                                endDate={formData.actualFinish}
                            />
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ManufacturingOrderForm;
