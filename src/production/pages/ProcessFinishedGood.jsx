import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
    Save, Plus, Trash2, Edit, Check,
    ArrowUp, ArrowDown, Settings
} from 'lucide-react';
import ProductionLayout from '../layout/ProductionLayout';

const API_URL = import.meta.env.VITE_API_BASE_URL;

const ProcessFinishedGood = () => {
    const { itemId } = useParams(); // Using itemId instead of id as we are likely coming from the item context
    const navigate = useNavigate();

    // Core Data
    const [processFlowId, setProcessFlowId] = useState(null);
    const [itemDetails, setItemDetails] = useState({ name: '', code: '' });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Master Data
    const [processes, setProcesses] = useState([]);
    const [workGroups, setWorkGroups] = useState([]);
    const [locations, setLocations] = useState([]);

    // Form Data (Header)
    const [headerData, setHeaderData] = useState({
        processFlowName: '',
        otherFixedCost: 0,
        otherVariableCost: 0,
        isLocked: false,
        locationId: ''
    });

    // Details/Steps Data
    const [details, setDetails] = useState([]);

    // Editing Step State
    const [isEditingStep, setIsEditingStep] = useState(false);
    const [editingIndex, setEditingIndex] = useState(-1);
    const [stepForm, setStepForm] = useState({
        processId: '',
        workGroupId: '',
        setupTime: 0,
        cycleTime: 0,
        fixedCost: 0,
        variableCost: 0,
        isOutsource: false,
        isTesting: false,
        notes: ''
    });

    const authHeaders = useMemo(() => ({ Authorization: `Bearer ${localStorage.getItem('token')}` }), []);

    // 1. Fetch Item Details & Master Data
    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                // Fetch Item Name
                const itemRes = await axios.get(`${API_URL}/production/finished-goods/${itemId}`, { headers: authHeaders });
                setItemDetails({ name: itemRes.data.name, code: itemRes.data.itemCode });

                // Fetch Dropdowns
                const [procRes, wgRes, locRes] = await Promise.all([
                    axios.get(`${API_URL}/production/processes?size=100`, { headers: authHeaders }), // Fetch first 100
                    axios.get(`${API_URL}/production/work-groups`, { headers: authHeaders }),
                    axios.get(`${API_URL}/locations`, { headers: authHeaders })
                ]);

                setProcesses(Array.isArray(procRes.data?.content) ? procRes.data.content : (Array.isArray(procRes.data) ? procRes.data : []));
                setWorkGroups(Array.isArray(wgRes.data) ? wgRes.data : []);
                setLocations(Array.isArray(locRes.data) ? locRes.data : []);

                // Attempt to fetch existing process flow for this item
                // Use getAll for now and filter manually since current API doesn't seem to support byItemId directly
                // This is suboptimal but a temporary workaround given the provided backend code.
                const flowsRes = await axios.get(`${API_URL}/production/process-finished-goods`, { headers: authHeaders });
                let allFlows = [];
                if (Array.isArray(flowsRes.data)) {
                    allFlows = flowsRes.data;
                } else if (flowsRes.data?.content && Array.isArray(flowsRes.data.content)) {
                    allFlows = flowsRes.data.content;
                }
                const existingFlow = allFlows.find(f => String(f.itemId) === String(itemId));

                if (existingFlow) {
                    setProcessFlowId(existingFlow.id);
                    setHeaderData({
                        processFlowName: existingFlow.processFlowName,
                        otherFixedCost: existingFlow.otherFixedCost,
                        otherVariableCost: existingFlow.otherVariableCost,
                        isLocked: existingFlow.isLocked,
                        locationId: existingFlow.locationId || ''
                    });

                    // Sort details by sequence
                    const sortedDetails = (existingFlow.details || []).sort((a, b) => a.sequence - b.sequence);
                    setDetails(sortedDetails);
                } else {
                    // Default Process Name
                    setHeaderData(prev => ({ ...prev, processFlowName: `${itemRes.data.name} Routing` }));
                }

            } catch (err) {
                console.error("Error loading data:", err);
                alert("Failed to load necessary data.");
            } finally {
                setLoading(false);
            }
        };
        if (itemId) fetchInitialData();
    }, [itemId, authHeaders]);

    // Handlers
    const handleHeaderChange = (e) => {
        const { name, value, type, checked } = e.target;
        setHeaderData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleStepChange = (e) => {
        const { name, value, type, checked } = e.target;
        setStepForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const addStep = () => {
        if (!stepForm.processId || !stepForm.workGroupId) {
            alert("Process and Workgroup are required.");
            return;
        }

        const processObj = processes.find(p => String(p.id) === String(stepForm.processId));
        const wgObj = workGroups.find(w => String(w.id) === String(stepForm.workGroupId));

        const newStep = {
            ...stepForm,
            processName: processObj?.name,
            workGroupName: wgObj?.name,
            sequence: details.length + 1 // Default sequence
        };

        if (isEditingStep && editingIndex >= 0) {
            const updated = [...details];
            updated[editingIndex] = { ...updated[editingIndex], ...newStep }; // Preserve ID if exists
            setDetails(updated);
            setIsEditingStep(false);
            setEditingIndex(-1);
        } else {
            setDetails(prev => [...prev, newStep]);
        }

        // Reset Form
        setStepForm({
            processId: '',
            workGroupId: '',
            setupTime: 0,
            cycleTime: 0,
            fixedCost: 0,
            variableCost: 0,
            isOutsource: false,
            isTesting: false,
            notes: ''
        });
    };

    const editStep = (index) => {
        const step = details[index];
        setStepForm({
            processId: step.processId,
            workGroupId: step.workGroupId,
            setupTime: step.setupTime,
            cycleTime: step.cycleTime,
            fixedCost: step.fixedCost,
            variableCost: step.variableCost,
            isOutsource: step.isOutsource,
            isTesting: step.isTesting,
            notes: step.notes || ''
        });
        setEditingIndex(index);
        setIsEditingStep(true);
    };

    const removeStep = (index) => {
        if (window.confirm("Remove this step?")) {
            setDetails(prev => prev.filter((_, i) => i !== index));
        }
    };

    const moveStep = (index, direction) => {
        const newDetails = [...details];
        if (direction === 'up' && index > 0) {
            [newDetails[index], newDetails[index - 1]] = [newDetails[index - 1], newDetails[index]];
        } else if (direction === 'down' && index < newDetails.length - 1) {
            [newDetails[index], newDetails[index + 1]] = [newDetails[index + 1], newDetails[index]];
        }
        setDetails(newDetails);
    };

    const saveProcessFlow = async () => {
        setSaving(true);
        try {
            // Re-assign sequences based on current order
            const finalDetails = details.map((d, idx) => ({
                processId: d.processId,
                workGroupId: d.workGroupId,
                setupTime: Number(d.setupTime),
                cycleTime: Number(d.cycleTime),
                fixedCost: Number(d.fixedCost),
                variableCost: Number(d.variableCost),
                isOutsource: d.isOutsource,
                isTesting: d.isTesting,
                notes: d.notes,
                sequence: idx + 1
            }));

            const payload = {
                itemId: itemId,
                processFlowName: headerData.processFlowName,
                otherFixedCost: Number(headerData.otherFixedCost),
                otherVariableCost: Number(headerData.otherVariableCost),
                isLocked: headerData.isLocked,
                locationId: headerData.locationId || null,
                details: finalDetails
            };

            if (processFlowId) {
                await axios.put(`${API_URL}/production/process-finished-goods/${processFlowId}`, payload, { headers: authHeaders });
            } else {
                await axios.post(`${API_URL}/production/process-finished-goods`, payload, { headers: authHeaders });
            }

            alert("Process Flow saved successfully!");
            navigate(-1); // Go back
        } catch (err) {
            console.error("Save failed:", err);
            alert(`Error: ${err.response?.data?.message || err.message}`);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-10 text-center"><div className="animate-spin inline-block w-8 h-8 border-4 border-current border-t-transparent text-purple-600 rounded-full"></div></div>;

    const saveButton = (
        <button
            onClick={saveProcessFlow}
            disabled={saving}
            className="px-6 py-2 bg-purple-700 text-white rounded-lg hover:bg-purple-800 transition-colors flex items-center gap-2 shadow-sm"
        >
            {saving ? <span className="animate-spin">⌛</span> : <Save size={18} />}
            Save Flow
        </button>
    );

    return (
        <ProductionLayout
            activeTab="Finished Good"
            title={`Manage Process Flow: ${itemDetails.name} (${itemDetails.code})`}
            headerActions={saveButton}
        >
            <div className="max-w-7xl mx-auto space-y-6">

                {/* 1. Header Details Form */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                    <h3 className="text-md font-semibold mb-4 text-gray-700 dark:text-gray-300 flex items-center gap-2"><Settings size={18} /> Process Header</h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="col-span-2">
                            <label className="label block text-xs font-semibold uppercase text-gray-500 mb-1">Process Flow Name *</label>
                            <input
                                type="text"
                                name="processFlowName"
                                value={headerData.processFlowName}
                                onChange={handleHeaderChange}
                                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-gray-50 dark:bg-slate-900"
                            />
                        </div>
                        <div>
                            <label className="label block text-xs font-semibold uppercase text-gray-500 mb-1">Location</label>
                            <select
                                name="locationId"
                                value={headerData.locationId}
                                onChange={handleHeaderChange}
                                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-gray-50 dark:bg-slate-900"
                            >
                                <option value="">Select Location</option>
                                {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                            </select>
                        </div>
                        <div className="flex items-center pt-6">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    name="isLocked"
                                    checked={headerData.isLocked}
                                    onChange={handleHeaderChange}
                                    className="rounded text-purple-600 focus:ring-purple-500"
                                />
                                <span className="text-sm font-medium">Locked?</span>
                            </label>
                        </div>
                        <div>
                            <label className="label block text-xs font-semibold uppercase text-gray-500 mb-1">Other Fixed Cost</label>
                            <input
                                type="number"
                                name="otherFixedCost"
                                value={headerData.otherFixedCost}
                                onChange={handleHeaderChange}
                                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-gray-50 dark:bg-slate-900"
                            />
                        </div>
                        <div>
                            <label className="label block text-xs font-semibold uppercase text-gray-500 mb-1">Other Variable Cost</label>
                            <input
                                type="number"
                                name="otherVariableCost"
                                value={headerData.otherVariableCost}
                                onChange={handleHeaderChange}
                                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-gray-50 dark:bg-slate-900"
                            />
                        </div>
                    </div>
                </div>

                {/* 2. Add/Edit Step Form */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm transition-all">
                    <h3 className="text-md font-semibold mb-4 text-gray-700 dark:text-gray-300 flex items-center gap-2">
                        {isEditingStep ? <Edit size={18} className="text-purple-600" /> : <Plus size={18} />}
                        {isEditingStep ? 'Edit Step' : 'Add New Step'}
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">

                        {/* Process Dropdown */}
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1">Process Name *</label>
                            <select
                                name="processId"
                                value={stepForm.processId}
                                onChange={handleStepChange}
                                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-gray-50 dark:bg-slate-900 text-sm"
                            >
                                <option value="">Select Process</option>
                                {processes.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                        </div>

                        {/* Workgroup Dropdown */}
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1">Workgroup *</label>
                            <select
                                name="workGroupId"
                                value={stepForm.workGroupId}
                                onChange={handleStepChange}
                                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-gray-50 dark:bg-slate-900 text-sm"
                            >
                                <option value="">Select Workgroup</option>
                                {workGroups.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                            </select>
                        </div>

                        <div className="flex gap-2">
                            <div className="w-1/2">
                                <label className="block text-xs font-semibold text-gray-500 mb-1">Setup Time (mins)</label>
                                <input type="number" name="setupTime" value={stepForm.setupTime} onChange={handleStepChange} className="w-full p-2 border rounded text-sm" />
                            </div>
                            <div className="w-1/2">
                                <label className="block text-xs font-semibold text-gray-500 mb-1">Cycle Time (mins)</label>
                                <input type="number" name="cycleTime" value={stepForm.cycleTime} onChange={handleStepChange} className="w-full p-2 border rounded text-sm" />
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <div className="w-1/2">
                                <label className="block text-xs font-semibold text-gray-500 mb-1">Fixed Cost</label>
                                <input type="number" name="fixedCost" value={stepForm.fixedCost} onChange={handleStepChange} className="w-full p-2 border rounded text-sm" />
                            </div>
                            <div className="w-1/2">
                                <label className="block text-xs font-semibold text-gray-500 mb-1">Variable Cost</label>
                                <input type="number" name="variableCost" value={stepForm.variableCost} onChange={handleStepChange} className="w-full p-2 border rounded text-sm" />
                            </div>
                        </div>

                        <div className="col-span-2">
                            <label className="block text-xs font-semibold text-gray-500 mb-1">Notes</label>
                            <input type="text" name="notes" value={stepForm.notes} onChange={handleStepChange} className="w-full p-2 border rounded text-sm" />
                        </div>

                        <div className="flex flex-col gap-2 justify-center">
                            <label className="flex items-center gap-2 text-sm cursor-pointer ml-1">
                                <input type="checkbox" name="isOutsource" checked={stepForm.isOutsource} onChange={handleStepChange} className="rounded text-purple-600" />
                                Is Outsource Process
                            </label>
                            <label className="flex items-center gap-2 text-sm cursor-pointer ml-1">
                                <input type="checkbox" name="isTesting" checked={stepForm.isTesting} onChange={handleStepChange} className="rounded text-purple-600" />
                                Is Testing Process
                            </label>
                        </div>

                        <div className="flex gap-2 h-10">
                            {isEditingStep && (
                                <button
                                    onClick={() => { setIsEditingStep(false); setEditingIndex(-1); }}
                                    className="flex-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                                >
                                    Cancel
                                </button>
                            )}
                            <button
                                onClick={addStep}
                                className={`flex-1 text-white rounded font-medium transition-colors flex items-center justify-center gap-2 ${isEditingStep ? 'bg-green-600 hover:bg-green-700' : 'bg-purple-600 hover:bg-purple-700'}`}
                            >
                                {isEditingStep ? <Check size={18} /> : <Plus size={18} />}
                                {isEditingStep ? 'Update Step' : 'Add Step'}
                            </button>
                        </div>

                    </div>
                </div>

                {/* 3. Steps Table */}
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-slate-700/50">
                                <tr>
                                    <th className="th-cell w-16">Seq</th>
                                    <th className="th-cell">Process Name</th>
                                    <th className="th-cell">Workgroup Name</th>
                                    <th className="th-cell w-20">Setup (m)</th>
                                    <th className="th-cell w-20">Cycle (m)</th>
                                    <th className="th-cell w-24">Fixed Cost</th>
                                    <th className="th-cell w-24">Var. Cost</th>
                                    <th className="th-cell">Notes</th>
                                    <th className="th-cell w-28 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {details.length > 0 ? details.map((step, idx) => (
                                    <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-slate-700/30">
                                        <td className="td-cell font-medium text-center">{idx + 1}</td>
                                        <td className="td-cell">
                                            {step.processName}
                                            {step.isOutsource && <span className="ml-2 text-[10px] bg-amber-100 text-amber-800 px-1 py-0.5 rounded">Outsource</span>}
                                            {step.isTesting && <span className="ml-1 text-[10px] bg-blue-100 text-blue-800 px-1 py-0.5 rounded">Testing</span>}
                                        </td>
                                        <td className="td-cell">{step.workGroupName}</td>
                                        <td className="td-cell">{step.setupTime}</td>
                                        <td className="td-cell">{step.cycleTime}</td>
                                        <td className="td-cell">{step.fixedCost}</td>
                                        <td className="td-cell">{step.variableCost}</td>
                                        <td className="td-cell max-w-xs truncate text-gray-500">{step.notes || '-'}</td>
                                        <td className="td-cell">
                                            <div className="flex items-center justify-center gap-1">
                                                <button onClick={() => moveStep(idx, 'up')} disabled={idx === 0} className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"><ArrowUp size={14} /></button>
                                                <button onClick={() => moveStep(idx, 'down')} disabled={idx === details.length - 1} className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"><ArrowDown size={14} /></button>
                                                <button onClick={() => editStep(idx)} className="p-1 text-blue-500 hover:text-blue-600 ml-2"><Edit size={16} /></button>
                                                <button onClick={() => removeStep(idx)} className="p-1 text-red-500 hover:text-red-600"><Trash2 size={16} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan="9" className="p-8 text-center text-gray-500">No steps added yet. Use the form above to add process steps.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </ProductionLayout>
    );
};

export default ProcessFinishedGood;
