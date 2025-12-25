import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X, Loader, Layers, Edit, Trash2, Plus, Save } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_BASE_URL;

const ViewBomInformation = ({ bomId, onClose, quantity = 1, startDate, endDate }) => {
    const [bom, setBom] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchBOM = async () => {
            if (!bomId) return;
            setLoading(true);
            try {
                const token = localStorage.getItem('token');
                const response = await axios.get(`${API_URL}/production/bom-semi-finished/${bomId}`, {
                    headers: { "Authorization": `Bearer ${token}` }
                });
                setBom(response.data);
            } catch (err) {
                console.error("Failed to fetch BOM details", err);
                setError('Failed to load BOM information.');
            } finally {
                setLoading(false);
            }
        };

        fetchBOM();
    }, [bomId]);

    if (loading) return <div className="h-full flex items-center justify-center p-10"><Loader className="animate-spin h-8 w-8 text-primary" /></div>;
    if (error) return <div className="h-full flex items-center justify-center text-red-500 p-10">{error}</div>;
    if (!bom) return null;

    // Helper to format dates
    const formatDate = (date) => date ? new Date(date).toLocaleString() : '-';

    // Calculate time duration
    const calculateDuration = (start, end) => {
        if (!start || !end) return '-';
        const startTime = new Date(start).getTime();
        const endTime = new Date(end).getTime();

        if (isNaN(startTime) || isNaN(endTime)) return '-';

        // Calculate absolute difference to handle cases where start > end
        let diff = Math.abs(endTime - startTime);

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        diff -= days * (1000 * 60 * 60 * 24);

        const hours = Math.floor(diff / (1000 * 60 * 60));
        diff -= hours * (1000 * 60 * 60);

        const minutes = Math.floor(diff / (1000 * 60));

        const parts = [];
        if (days > 0) parts.push(`${days} days`);
        if (hours > 0) parts.push(`${hours} hours`);
        if (minutes > 0) parts.push(`${minutes} minutes`);

        return parts.length > 0 ? parts.join(', ') : '0 minutes';
    };


    // Mock calculations or extractions
    const components = bom.details || [];
    // Identify operations (processes)
    const operations = components.filter(d => d.process).map(d => ({
        ...d,
        processName: d.process.name,
        qty: quantity,
        totalCost: d.fixedCost || 0, // Placeholder
        workstations: 'Default Workstation', // Placeholder
        shifts: 'Default',
        overhead: 0,
        start: new Date(),
        finish: new Date(),
        assignTo: '',
        labourCost: 0
    }));

    return (
        <div className="flex flex-col h-full bg-white text-gray-800 font-sans shadow-xl rounded-lg overflow-hidden border border-gray-200">
            {/* Header */}
            <div className="py-3 px-6 bg-primary text-white flex justify-between items-center shadow-md">
                <h2 className="text-lg font-bold tracking-wide uppercase">BOM Information</h2>
                <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-full transition-colors">
                    <X size={20} />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 bg-gray-50">

                <h3 className="text-2xl font-normal text-gray-700 mb-6">BOM Information</h3>

                {/* Info Grid */}
                <div className="bg-white p-4 rounded-sm border border-gray-200 mb-8 text-sm">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-y-2 gap-x-8">
                        <div className="flex border-b border-gray-100 pb-1">
                            <span className="w-40 font-semibold text-gray-600">Item</span>
                            <span className="flex-1 font-medium">{bom.item?.name}</span>
                        </div>
                        <div className="flex border-b border-gray-100 pb-1">
                            <span className="w-40 font-semibold text-gray-600">Approximate Cost</span>
                            <span className="flex-1 font-medium">{bom.approximateCost || '0.26'}</span>
                        </div>
                        <div className="flex border-b border-gray-100 pb-1">
                            <span className="w-40 font-semibold text-gray-600">Quantity</span>
                            <span className="flex-1 font-medium">{quantity}</span>
                        </div>
                        <div className="flex border-b border-gray-100 pb-1">
                            <span className="w-40 font-semibold text-gray-600">Earliest Start Date</span>
                            <span className="flex-1 font-medium">{formatDate(startDate)}</span>
                        </div>
                        <div className="flex border-b border-gray-100 pb-1">
                            <span className="w-40 font-semibold text-gray-600">BOM</span>
                            <span className="flex-1 font-medium text-purple-700">{bom.bomName}</span>
                        </div>
                        <div className="flex border-b border-gray-100 pb-1">
                            <span className="w-40 font-semibold text-gray-600">Earliest End Date</span>
                            <span className="flex-1 font-medium">{formatDate(endDate)}</span>
                        </div>
                        <div className="flex border-b border-gray-100 pb-1">
                            <span className="w-40 font-semibold text-gray-600">Routing</span>
                            <span className="flex-1 font-medium text-gray-500">78765 {bom.item?.name} Routing</span>
                        </div>
                        <div className="flex border-b border-gray-100 pb-1">
                            <span className="w-40 font-semibold text-gray-600">Time</span>
                            <span className="flex-1 font-medium">{calculateDuration(startDate, endDate)}</span>
                        </div>
                    </div>
                </div>

                {/* Components Table */}
                <div className="mb-8 overflow-x-auto bg-white rounded shadow-sm">
                    <table className="w-full text-xs text-left">
                        <thead>
                            <tr className="bg-[#e9d8e9] text-gray-700 font-bold border-b border-gray-300">
                                <th className="p-3 border-r border-gray-200 w-16">Sr.No</th>
                                <th className="p-3 border-r border-gray-200">Process Name</th>
                                <th className="p-3 border-r border-gray-200">Component Name</th>
                                <th className="p-3 border-r border-gray-200">Quantity Required</th>
                                <th className="p-3 border-r border-gray-200">Available Quantity</th>
                                <th className="p-3 border-r border-gray-200">For Production Quantity Required</th>
                                <th className="p-3 border-r border-gray-200">UOM</th>
                                <th className="p-3 border-r border-gray-200">Rate/Unit</th>
                                <th className="p-3 border-r border-gray-200">Total Amount</th>
                                <th className="p-3">Notes</th>
                            </tr>
                        </thead>
                        <tbody>
                            {components.map((comp, idx) => (
                                <tr key={idx} className="border-b hover:bg-gray-50 text-gray-600">
                                    <td className="p-2 border-r">{idx + 1}</td>
                                    <td className="p-2 border-r">{comp.process?.name || '-'}</td>
                                    <td className="p-2 border-r font-medium text-gray-800">
                                        {comp.rawMaterial?.name || comp.childSemiFinished?.name || '-'}
                                    </td>
                                    <td className="p-2 border-r">{comp.quantity || '-'}</td>
                                    <td className="p-2 border-r">-</td>
                                    <td className="p-2 border-r">{comp.quantity * quantity}</td>
                                    <td className="p-2 border-r">{comp.rawMaterial?.uom?.name || 'Units'}</td>
                                    <td className="p-2 border-r">0</td>
                                    <td className="p-2 border-r">0</td>
                                    <td className="p-2 italic">{comp.notes || '-'}</td>
                                </tr>
                            ))}
                            {components.length === 0 && (
                                <tr>
                                    <td colSpan={10} className="p-4 text-center text-gray-400">No components found</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Operations Header */}
                <h3 className="text-lg font-semibold text-gray-700 mb-2">{bom.item?.name} {quantity}</h3>

                {/* Operations Table */}
                <div className="overflow-x-auto bg-white rounded shadow-sm pb-10">
                    <table className="w-full text-xs text-left">
                        <thead>
                            <tr className="bg-gray-100 text-gray-700 font-bold border-b border-gray-300">
                                <th className="p-3 border-r border-gray-200">Process Name</th>
                                <th className="p-3 border-r border-gray-200 w-12">Qty</th>
                                <th className="p-3 border-r border-gray-200 w-20">Total Cost</th>
                                <th className="p-3 border-r border-gray-200">Workstations</th>
                                <th className="p-3 border-r border-gray-200 w-24">Shifts</th>
                                <th className="p-3 border-r border-gray-200 w-24">Manufacturing Overhead</th>
                                <th className="p-3 border-r border-gray-200 w-32">Start</th>
                                <th className="p-3 border-r border-gray-200 w-32">Finish</th>
                                <th className="p-3 border-r border-gray-200 w-32">Assign To</th>
                                <th className="p-3 border-r border-gray-200 w-20">Labour Cost</th>
                                <th className="p-3 w-24">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {/* Mock operations based on unique processes or just mapping details that have processes */}
                            {Array.from(new Set(components.filter(c => c.process).map(c => c.process.name))).map((uniqueProcessName, idx) => {
                                const relevantComp = components.find(c => c.process?.name === uniqueProcessName);
                                return (
                                    <tr key={idx} className="border-b hover:bg-gray-50 text-gray-600 align-top">
                                        <td className="p-2 border-r">
                                            <div className="font-semibold text-gray-800">{uniqueProcessName}</div>
                                            <div className="text-[10px] text-gray-400 mt-1">Notes: {relevantComp.notes || 'None'}</div>
                                        </td>
                                        <td className="p-2 border-r text-center">{quantity}</td>
                                        <td className="p-2 border-r text-right">0</td>
                                        <td className="p-2 border-r">WCT-00{idx + 1}-1 {uniqueProcessName}(1)</td>
                                        <td className="p-2 border-r">
                                            <select className="w-full bg-gray-50 border border-gray-200 rounded px-1 py-0.5">
                                                <option>Default</option>
                                            </select>
                                        </td>
                                        <td className="p-2 border-r text-right">0</td>
                                        <td className="p-2 border-r text-[10px]">{new Date().toLocaleString()}</td>
                                        <td className="p-2 border-r text-[10px]">{new Date().toLocaleString()}</td>
                                        <td className="p-2 border-r">
                                            <select className="w-full bg-gray-50 border border-gray-200 rounded px-1 py-0.5">
                                                <option>None selected</option>
                                            </select>
                                        </td>
                                        <td className="p-2 border-r text-right">0</td>
                                        <td className="p-2 flex gap-1 justify-center">
                                            <button className="p-1 bg-purple-700 text-white rounded hover:bg-purple-800"><Edit size={12} /></button>
                                            <button className="p-1 bg-red-500 text-white rounded hover:bg-red-600"><Trash2 size={12} /></button>
                                            <button className="p-1 bg-purple-900 text-white rounded hover:bg-black"><Plus size={12} /></button>
                                        </td>
                                    </tr>
                                );
                            })}
                            {components.filter(c => c.process).length === 0 && (
                                <tr><td colSpan={11} className="p-4 text-center text-gray-400">No operations found</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>

            </div>
        </div>
    );
};

export default ViewBomInformation;
