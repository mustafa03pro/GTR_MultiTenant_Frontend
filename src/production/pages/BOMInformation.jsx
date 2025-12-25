import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X, Loader, Layers, Settings, Package, FileText } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_BASE_URL;

const BOMInformation = ({ bomId, onClose }) => {
    const [bom, setBom] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchBOM = async () => {
            if (!bomId) return;
            setLoading(true);
            try {
                const token = localStorage.getItem('token');
                // Fetch BOM details
                // Assuming the endpoint returns full details including nested objects
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

    const formatComponent = (detail) => {
        if (detail.rawMaterial) {
            return {
                type: 'Raw Material',
                name: detail.rawMaterial.name,
                code: detail.rawMaterial.itemCode || '-',
                uom: detail.rawMaterial.uom?.name || 'Units'
            };
        } else if (detail.childSemiFinished) {
            return {
                type: 'Semi-Finished',
                name: detail.childSemiFinished.name,
                code: detail.childSemiFinished.itemCode || '-',
                uom: 'Units' // Assumption
            };
        }
        return { type: 'Unknown', name: '-', code: '-', uom: '-' };
    };

    if (loading) return <div className="h-full flex items-center justify-center"><Loader className="animate-spin h-8 w-8 text-primary" /></div>;
    if (error) return <div className="h-full flex items-center justify-center text-red-500">{error}</div>;
    if (!bom) return null;

    return (
        <div className="flex flex-col h-full bg-card text-foreground">
            {/* Header */}
            <div className="p-4 border-b border-border flex justify-between items-center bg-purple-900 text-white">
                <h2 className="text-xl font-bold flex items-center gap-2">
                    <Layers size={24} /> BOM Information
                </h2>
                <button onClick={onClose} className="p-1 hover:bg-purple-800 rounded transition-colors">
                    <X size={24} />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
                {/* BOM Header Info */}
                <div className="bg-background-muted p-4 rounded-lg border border-border mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-foreground-muted uppercase">BOM Name</label>
                            <p className="font-medium text-lg">{bom.bomName}</p>
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-foreground-muted uppercase">Item Name</label>
                            <p className="font-medium">{bom.item?.name}</p>
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-foreground-muted uppercase">Item Code</label>
                            <p className="font-medium font-mono">{bom.item?.itemCode}</p>
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-foreground-muted uppercase">Status</label>
                            <span className={`inline-flex px-2 py-0.5 rounded text-xs font-bold ${bom.isLocked ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                                {bom.isLocked ? 'LOCKED' : 'ACTIVE'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Details Table */}
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-foreground">
                    <Settings size={20} /> Components & Processes
                </h3>

                <div className="border border-border rounded-lg overflow-hidden bg-white dark:bg-card shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-border text-sm">
                            <thead className="bg-background-muted text-foreground-muted">
                                <tr>
                                    <th className="px-4 py-3 text-left font-semibold">Seq</th>
                                    <th className="px-4 py-3 text-left font-semibold">Process Name</th>
                                    <th className="px-4 py-3 text-left font-semibold">Component Type</th>
                                    <th className="px-4 py-3 text-left font-semibold">Component Name</th>
                                    <th className="px-4 py-3 text-right font-semibold">Qty Required</th>
                                    <th className="px-4 py-3 text-left font-semibold">UOM</th>
                                    <th className="px-4 py-3 text-left font-semibold">Notes</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {bom.details && bom.details.length > 0 ? (
                                    bom.details.sort((a, b) => a.sequence - b.sequence).map((detail, index) => {
                                        const component = formatComponent(detail);
                                        return (
                                            <tr key={index} className="hover:bg-background-muted/50">
                                                <td className="px-4 py-3 text-center w-12">{detail.sequence}</td>
                                                <td className="px-4 py-3 font-medium text-purple-700">
                                                    {detail.process ? detail.process.name : <span className="text-gray-400 italic">No Process</span>}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${component.type === 'Raw Material' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
                                                        {component.type}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 font-medium">
                                                    {component.name}
                                                    <span className="text-xs text-foreground-muted block font-mono">{component.code}</span>
                                                </td>
                                                <td className="px-4 py-3 text-right font-mono font-bold">{detail.quantity}</td>
                                                <td className="px-4 py-3 text-xs">{component.uom}</td>
                                                <td className="px-4 py-3 text-xs text-foreground-muted max-w-xs truncate" title={detail.notes}>{detail.notes || '-'}</td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan="7" className="px-4 py-8 text-center text-foreground-muted">
                                            No components or processes defined for this BOM.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* operations summary table if needed, inferred from unique processes */}
                {/* 
                <div className="mt-8">
                     <h3 className="text-lg font-bold mb-4">Operations Summary</h3>
                     ... Logic to aggregate by process ...
                </div> 
                */}

            </div>

            {/* Footer actions if any */}
            <div className="p-4 border-t border-border flex justify-end">
                <button onClick={onClose} className="btn-secondary px-6">Close</button>
            </div>
        </div>
    );
};

export default BOMInformation;
