
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
    Save, Plus, Trash2, Edit, Check,
    ArrowUp, ArrowDown, Package, Layers, Settings, List,
    Loader
} from 'lucide-react';
import ProductionLayout from '../layout/ProductionLayout';

const API_URL = import.meta.env.VITE_API_BASE_URL;

const BomFinishedGood = () => {
    const { itemId } = useParams();
    const navigate = useNavigate();

    // Loading States
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Core Data
    const [existingBomId, setExistingBomId] = useState(null);
    const [itemDetails, setItemDetails] = useState({ name: '', code: '' });
    const [headerData, setHeaderData] = useState({
        bomName: '',
        quantity: 1, // Base Quantity
        routingId: '',
        approximateCost: 0,
        isActive: true,
        locationId: ''
    });

    const [details, setDetails] = useState([]);

    // Master Data
    const [processes, setProcesses] = useState([]); // Available Process Steps from the Routing
    const [allRoutings, setAllRoutings] = useState([]); // All Routings to select headers (though usually filtered by item)
    const [rawMaterials, setRawMaterials] = useState([]);
    const [semiFinished, setSemiFinished] = useState([]);
    const [units, setUnits] = useState([]);
    const [locations, setLocations] = useState([]);

    // Form State for Adding Row
    const [rowForm, setRowForm] = useState({
        processId: '',
        type: 'RAW_MATERIAL', // RAW_MATERIAL or SEMI_FINISHED
        componentId: '',
        quantity: 0,
        uomId: '',
        rate: 0,
        amount: 0,
        notes: ''
    });

    const [isEditingRow, setIsEditingRow] = useState(false);
    const [editingIndex, setEditingIndex] = useState(-1);

    const authHeaders = useMemo(() => ({ "Authorization": `Bearer ${localStorage.getItem('token')}` }), []);

    // Fetch All Data
    useEffect(() => {
        const fetchInitialData = async () => {
            setLoading(true);
            try {
                // 1. Fetch Item Details
                const itemRes = await axios.get(`${API_URL}/production/finished-goods/${itemId}`, { headers: authHeaders });
                setItemDetails({ name: itemRes.data.name, code: itemRes.data.itemCode });

                // 2. Fetch Master Data
                const [locRes, unitRes, rmRes, sfRes, routingRes, bomRes] = await Promise.all([
                    axios.get(`${API_URL}/locations`, { headers: authHeaders }),
                    axios.get(`${API_URL}/production/units`, { headers: authHeaders }),
                    axios.get(`${API_URL}/production/raw-materials`, { headers: authHeaders }),
                    axios.get(`${API_URL}/production/semi-finished`, { headers: authHeaders }), // Assuming endpoint
                    axios.get(`${API_URL}/production/process-finished-goods`, { headers: authHeaders }),
                    axios.get(`${API_URL}/production/bom-finished-goods?size=100`, { headers: authHeaders })
                ]);

                setLocations(Array.isArray(locRes.data) ? locRes.data : []);
                setUnits(Array.isArray(unitRes.data) ? unitRes.data : []);
                setRawMaterials(Array.isArray(rmRes.data?.content) ? rmRes.data.content : (Array.isArray(rmRes.data) ? rmRes.data : []));
                setSemiFinished(Array.isArray(sfRes.data?.content) ? sfRes.data.content : (Array.isArray(sfRes.data) ? sfRes.data : []));

                // Routings - Need to find the one associated with this item to populate dropdown
                const routingList = Array.isArray(routingRes.data?.content) ? routingRes.data.content : (Array.isArray(routingRes.data) ? routingRes.data : []);
                setAllRoutings(routingList);

                // Check for existing BOM
                const bomList = Array.isArray(bomRes.data?.content) ? bomRes.data.content : (Array.isArray(bomRes.data) ? bomRes.data : []);
                const existingBom = bomList.find(b => String(b.item?.id || b.itemId) === String(itemId));

                // Helper to load routing steps
                const loadRoutingSteps = (routingId) => {
                    const routing = routingList.find(r => String(r.id) === String(routingId));
                    if (routing && routing.details) {
                        // We need "Processes" that are part of this routing
                        // The routing.details contains processId and processName
                        // We will map them to a list of options
                        const steps = routing.details.map(d => ({
                            id: d.processId,
                            name: d.processName,
                            sequence: d.sequence
                        })).sort((a, b) => a.sequence - b.sequence);
                        setProcesses(steps);
                    } else {
                        setProcesses([]);
                    }
                };

                if (existingBom) {
                    setExistingBomId(existingBom.id);
                    setHeaderData({
                        bomName: existingBom.bomName,
                        quantity: existingBom.quantity,
                        routingId: existingBom.routing?.id || existingBom.routingId || '',
                        approximateCost: existingBom.approximateCost,
                        isActive: existingBom.isActive,
                        locationId: existingBom.locationId || ''
                    });

                    // Load processes for the selected routing
                    if (existingBom.routing?.id) loadRoutingSteps(existingBom.routing.id);

                    // Map details
                    const mappedDetails = existingBom.details.map(d => ({
                        processId: d.process?.id || d.processId,
                        processName: d.process?.name || d.processName,
                        type: d.rawMaterial ? 'RAW_MATERIAL' : 'SEMI_FINISHED',
                        componentId: d.rawMaterial ? (d.rawMaterial.id || d.rawMaterialId) : (d.semiFinished ? (d.semiFinished.id || d.semiFinishedId) : ''),
                        componentName: d.rawMaterial ? d.rawMaterial.name : (d.semiFinished ? d.semiFinished.name : ''),
                        quantity: d.quantity,
                        uomId: d.uom?.id || d.uomId,
                        uomName: d.uom?.name || d.uomName,
                        rate: d.rate,
                        amount: d.amount,
                        notes: d.notes || '',
                        sequence: d.sequence
                    }));
                    setDetails(mappedDetails);

                } else {
                    // Pre-fill fields
                    const defaultRouting = routingList.find(r => String(r.itemId) === String(itemId));
                    if (defaultRouting) {
                        setHeaderData(prev => ({ ...prev, routingId: defaultRouting.id, bomName: `${itemRes.data.name} BOM` }));
                        loadRoutingSteps(defaultRouting.id);
                    } else {
                        setHeaderData(prev => ({ ...prev, bomName: `${itemRes.data.name} BOM` }));
                    }
                }

            } catch (err) {
                console.error("Error loading BOM data:", err);
                // alert("Failed to load data.");
            } finally {
                setLoading(false);
            }
        };

        if (itemId) fetchInitialData();
    }, [itemId, authHeaders]);

    // Handle Header Changes
    const handleHeaderChange = (e) => {
        const { name, value, type, checked } = e.target;

        if (name === 'routingId') {
            // Update processes when routing changes
            const routing = allRoutings.find(r => String(r.id) === String(value));
            if (routing && routing.details) {
                const steps = routing.details.map(d => ({
                    id: d.processId, // Ensure your routing API returns this structure!
                    name: d.processName,
                    sequence: d.sequence
                })).sort((a, b) => a.sequence - b.sequence);
                setProcesses(steps);
            } else {
                setProcesses([]);
            }
        }

        setHeaderData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    // Handle Row Form Changes
    const handleRowChange = (e) => {
        const { name, value } = e.target;
        setRowForm(prev => {
            const updated = { ...prev, [name]: value };

            // Auto-calculate amount
            if (name === 'quantity' || name === 'rate') {
                updated.amount = Number(updated.quantity) * Number(updated.rate);
            }

            return updated;
        });
    };

    // Add / Update Row
    const handleAddRow = () => {
        // Validation
        if (!rowForm.processId || !rowForm.componentId || !rowForm.quantity) {
            alert("Process, Component, and Quantity are required.");
            return;
        }

        const selectedProcess = processes.find(p => String(p.id) === String(rowForm.processId));
        const selectedComponent = rowForm.type === 'RAW_MATERIAL'
            ? rawMaterials.find(r => String(r.id) === String(rowForm.componentId))
            : semiFinished.find(s => String(s.id) === String(rowForm.componentId));
        const selectedUom = units.find(u => String(u.id) === String(rowForm.uomId));

        const newRow = {
            ...rowForm,
            processName: selectedProcess?.name,
            componentName: selectedComponent?.name,
            uomName: selectedUom?.name,
            sequence: details.length + 1
        };

        if (isEditingRow && editingIndex >= 0) {
            const updatedDetails = [...details];
            updatedDetails[editingIndex] = { ...updatedDetails[editingIndex], ...newRow };
            setDetails(updatedDetails);
            setIsEditingRow(false);
            setEditingIndex(-1);
        } else {
            setDetails(prev => [...prev, newRow]);
        }

        // Reset Row Form (keep process and type for convenience? Maybe not)
        setRowForm({
            processId: '',
            type: 'RAW_MATERIAL',
            componentId: '',
            quantity: 0,
            uomId: '',
            rate: 0,
            amount: 0,
            notes: ''
        });
    };

    const editRow = (index) => {
        const row = details[index];
        setRowForm({
            processId: row.processId,
            type: row.type,
            componentId: row.componentId,
            quantity: row.quantity,
            uomId: row.uomId,
            rate: row.rate,
            amount: row.amount,
            notes: row.notes || ''
        });
        setEditingIndex(index);
        setIsEditingRow(true);
    };

    const removeRow = (index) => {
        if (window.confirm("Remove this item?")) {
            setDetails(prev => prev.filter((_, i) => i !== index));
        }
    };

    // Total Cost Calculation Effect
    useEffect(() => {
        const total = details.reduce((sum, item) => sum + Number(item.amount || 0), 0);
        // Only update if significantly different to verify loops
        if (Math.abs(total - headerData.approximateCost) > 0.01) {
            setHeaderData(prev => ({ ...prev, approximateCost: total }));
        }
    }, [details]);

    // Save BOM
    const handleSave = async () => {
        setSaving(true);
        try {
            const payload = {
                itemId: itemId,
                bomName: headerData.bomName,
                quantity: Number(headerData.quantity),
                routingId: headerData.routingId,
                approximateCost: Number(headerData.approximateCost),
                isActive: headerData.isActive,
                details: details.map((d, idx) => ({
                    processId: d.processId,
                    rawMaterialId: d.type === 'RAW_MATERIAL' ? d.componentId : null,
                    semiFinishedId: d.type === 'SEMI_FINISHED' ? d.componentId : null,
                    quantity: Number(d.quantity),
                    uomId: d.uomId,
                    rate: Number(d.rate),
                    amount: Number(d.amount),
                    notes: d.notes,
                    sequence: idx + 1
                }))
            };

            if (existingBomId) {
                await axios.put(`${API_URL}/production/bom-finished-goods/${existingBomId}`, payload, { headers: authHeaders });
                alert("BOM updated successfully!");
            } else {
                await axios.post(`${API_URL}/production/bom-finished-goods`, payload, { headers: authHeaders });
                alert("BOM created successfully!");
            }
            navigate(-1);
        } catch (err) {
            console.error("Save failed:", err);
            alert("Failed to save BOM.");
        } finally {
            setSaving(false);
        }
    };

    const handleExport = async () => {
        if (!existingBomId) return;
        try {
            const response = await axios.get(`${API_URL}/production/bom-finished-goods/${existingBomId}/export`, {
                headers: authHeaders,
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `bom_export_${existingBomId}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            console.error(err);
            alert("Export failed.");
        }
    };

    if (loading) return <div className="flex justify-center items-center h-screen"><Loader className="animate-spin text-purple-600" /></div>;

    const headerActions = (
        <div className="flex gap-2">
            {existingBomId && (
                <button
                    onClick={handleExport}
                    className="px-4 py-2 bg-white text-purple-700 border border-purple-200 rounded-lg hover:bg-purple-50 flex items-center gap-2"
                >
                    <List size={18} /> Export Excel
                </button>
            )}
            <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2 bg-purple-700 text-white rounded-lg hover:bg-purple-800 transition-colors flex items-center gap-2 shadow-sm"
            >
                {saving ? <span className="animate-spin">⌛</span> : <Save size={18} />}
                Save BOM
            </button>
        </div>
    );

    return (
        <ProductionLayout
            activeTab="Finished Good"
            title={`Manage BOM: ${itemDetails.name}`}
            headerActions={headerActions}
        >
            <div className="max-w-7xl mx-auto space-y-6">

                {/* Header Section */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                    <h3 className="text-md font-semibold mb-4 text-gray-700 dark:text-gray-300 flex items-center gap-2"><Settings size={18} /> BOM Header</h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                            <label className="label block text-xs font-semibold uppercase text-gray-500 mb-1">BOM Name *</label>
                            <input
                                type="text"
                                name="bomName"
                                value={headerData.bomName}
                                onChange={handleHeaderChange}
                                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-gray-50 dark:bg-slate-900"
                            />
                        </div>
                        <div>
                            <label className="label block text-xs font-semibold uppercase text-gray-500 mb-1">Routing (Process Flow) *</label>
                            <select
                                name="routingId"
                                value={headerData.routingId}
                                onChange={handleHeaderChange}
                                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-gray-50 dark:bg-slate-900"
                            >
                                <option value="">Select Routing</option>
                                {allRoutings.filter(r => String(r.itemId) === String(itemId)).map(r => (
                                    <option key={r.id} value={r.id}>{r.processFlowName}</option>
                                ))}
                            </select>
                            {allRoutings.filter(r => String(r.itemId) === String(itemId)).length === 0 && (
                                <p className="text-xs text-red-500 mt-1">No routing found for this item.</p>
                            )}
                        </div>
                        <div>
                            <label className="label block text-xs font-semibold uppercase text-gray-500 mb-1">Base Quantity</label>
                            <input
                                type="number"
                                name="quantity"
                                value={headerData.quantity}
                                onChange={handleHeaderChange}
                                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-gray-50 dark:bg-slate-900"
                            />
                        </div>
                        <div>
                            <label className="label block text-xs font-semibold uppercase text-gray-500 mb-1">Total Approx Cost</label>
                            <input
                                type="number"
                                name="approximateCost"
                                value={headerData.approximateCost}
                                readOnly
                                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-gray-100 dark:bg-slate-800 text-gray-500"
                            />
                        </div>
                    </div>
                </div>

                {/* Add Item Form */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                    <h3 className="text-md font-semibold mb-4 text-gray-700 dark:text-gray-300 flex items-center gap-2">
                        {isEditingRow ? <Edit size={18} className="text-blue-500" /> : <Plus size={18} className="text-purple-500" />}
                        {isEditingRow ? 'Edit Component' : 'Add Component'}
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end">
                        <div className="md:col-span-1">
                            <label className="block text-xs font-semibold text-gray-500 mb-1">Process Step</label>
                            <select
                                name="processId"
                                value={rowForm.processId}
                                onChange={handleRowChange}
                                className="w-full p-2 border rounded text-sm"
                            >
                                <option value="">Select Step</option>
                                {processes.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                        </div>
                        <div className="md:col-span-1">
                            <label className="block text-xs font-semibold text-gray-500 mb-1">Type</label>
                            <select
                                name="type"
                                value={rowForm.type}
                                onChange={handleRowChange}
                                className="w-full p-2 border rounded text-sm"
                            >
                                <option value="RAW_MATERIAL">Raw Material</option>
                                <option value="SEMI_FINISHED">Semi Finished</option>
                            </select>
                        </div>
                        <div className="md:col-span-1">
                            <label className="block text-xs font-semibold text-gray-500 mb-1">Component</label>
                            <select
                                name="componentId"
                                value={rowForm.componentId}
                                onChange={handleRowChange}
                                className="w-full p-2 border rounded text-sm"
                            >
                                <option value="">Select Component</option>
                                {(rowForm.type === 'RAW_MATERIAL' ? rawMaterials : semiFinished).map(item => (
                                    <option key={item.id} value={item.id}>{item.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="md:col-span-1">
                            <label className="block text-xs font-semibold text-gray-500 mb-1">Qty</label>
                            <input type="number" name="quantity" value={rowForm.quantity} onChange={handleRowChange} className="w-full p-2 border rounded text-sm" />
                        </div>
                        <div className="md:col-span-1">
                            <label className="block text-xs font-semibold text-gray-500 mb-1">Rate</label>
                            <input type="number" name="rate" value={rowForm.rate} onChange={handleRowChange} className="w-full p-2 border rounded text-sm" />
                        </div>
                        <div className="md:col-span-1">
                            <button
                                onClick={handleAddRow}
                                className={`w-full py-2 rounded text-white flex justify-center items-center gap-2 ${isEditingRow ? 'bg-blue-600 hover:bg-blue-700' : 'bg-purple-600 hover:bg-purple-700'}`}
                            >
                                {isEditingRow ? <Check size={16} /> : <Plus size={16} />}
                                {isEditingRow ? 'Update' : 'Add'}
                            </button>
                        </div>

                        {/* 2nd Row for UOM, Amount, Notes */}
                        <div className="md:col-span-1">
                            <label className="block text-xs font-semibold text-gray-500 mb-1">UOM</label>
                            <select
                                name="uomId"
                                value={rowForm.uomId}
                                onChange={handleRowChange}
                                className="w-full p-2 border rounded text-sm"
                            >
                                <option value="">Select UOM</option>
                                {units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                            </select>
                        </div>
                        <div className="md:col-span-1">
                            <label className="block text-xs font-semibold text-gray-500 mb-1">Amount</label>
                            <input type="number" name="amount" value={rowForm.amount} readOnly className="w-full p-2 border rounded text-sm bg-gray-50" />
                        </div>
                        <div className="md:col-span-3">
                            <label className="block text-xs font-semibold text-gray-500 mb-1">Notes</label>
                            <input type="text" name="notes" value={rowForm.notes} onChange={handleRowChange} className="w-full p-2 border rounded text-sm" placeholder="Optional notes..." />
                        </div>
                        <div className="md:col-span-1">
                            {isEditingRow && <button onClick={() => { setIsEditingRow(false); setEditingIndex(-1); }} className="w-full py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300">Cancel</button>}
                        </div>


                    </div>
                </div>

                {/* Items Table */}
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-slate-700/50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Process</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Type</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Component</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Qty</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">UOM</th>
                                    <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase">Rate</th>
                                    <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase">Amount</th>
                                    <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {details.length > 0 ? details.map((row, idx) => (
                                    <tr key={idx} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 text-sm">{row.processName || '-'}</td>
                                        <td className="px-4 py-3 text-sm">
                                            <span className={`px-2 py-1 rounded text-[10px] ${row.type === 'RAW_MATERIAL' ? 'bg-amber-100 text-amber-800' : 'bg-teal-100 text-teal-800'}`}>
                                                {row.type === 'RAW_MATERIAL' ? 'Raw Mat' : 'Semi Fin'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-sm font-medium">{row.componentName}</td>
                                        <td className="px-4 py-3 text-sm">{row.quantity}</td>
                                        <td className="px-4 py-3 text-sm">{row.uomName}</td>
                                        <td className="px-4 py-3 text-sm text-right">{row.rate}</td>
                                        <td className="px-4 py-3 text-sm text-right font-medium">{row.amount}</td>
                                        <td className="px-4 py-3 text-center flex justify-center gap-2">
                                            <button onClick={() => editRow(idx)} className="text-blue-500 hover:text-blue-700"><Edit size={16} /></button>
                                            <button onClick={() => removeRow(idx)} className="text-red-500 hover:text-red-700"><Trash2 size={16} /></button>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr><td colSpan="8" className="p-8 text-center text-gray-500">No components added.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </ProductionLayout>
    );
};

export default BomFinishedGood;
