import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Edit, Trash2, Loader, AlertCircle, Settings } from 'lucide-react';
import * as leaveApi from './leaveApi';
import Modal from './Modal'; // A generic modal component

const LeaveTypes = ({ onSetupClick }) => {
    const [leaveTypes, setLeaveTypes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentLeaveType, setCurrentLeaveType] = useState(null);

    const fetchLeaveTypes = useCallback(async () => {
        try {
            setLoading(true);
            const response = await leaveApi.getAllLeaveTypes();
            setLeaveTypes(response.data);
        } catch (err) {
            setError('Failed to fetch leave types.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchLeaveTypes();
    }, [fetchLeaveTypes]);

    const handleOpenModal = (leaveType = null) => {
        setCurrentLeaveType(leaveType);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setCurrentLeaveType(null);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this leave type?')) {
            try {
                await leaveApi.deleteLeaveType(id);
                fetchLeaveTypes(); // Refresh list
            } catch (err) {
                setError('Failed to delete leave type.');
                console.error(err);
            }
        }
    };

    const handleSave = async (formData) => {
        try {
            if (currentLeaveType?.id) {
                await leaveApi.updateLeaveType(currentLeaveType.id, formData);
            } else {
                await leaveApi.createLeaveType(formData);
            }
            fetchLeaveTypes();
            handleCloseModal();
        } catch (err) {
            console.error("Save failed:", err);
            alert("Failed to save leave type. Check console for details.");
        }
    };

    if (loading) {
        return <div className="flex justify-center items-center p-8"><Loader className="animate-spin h-8 w-8 text-blue-600" /></div>;
    }

    if (error) {
        return <div className="text-red-600 bg-red-100 p-4 rounded-lg flex items-center"><AlertCircle className="mr-2" />{error}</div>;
    }

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-slate-700">Manage Leave Types</h2>
                <button onClick={() => handleOpenModal()} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2">
                    <Plus size={18} /> Add New
                </button>
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full">
                    <thead className="bg-slate-100">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Leave Type</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Description</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Paid</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Max Days/Year</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Start Time</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">End Time</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                        {leaveTypes.map((type) => (
                            <tr key={type.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{type.leaveType}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{type.description}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{type.isPaid ? 'Yes' : 'No'}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{type.maxDaysPerYear}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{type.startTime || '-'}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{type.endTime || '-'}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-right">
                                    <button onClick={() => handleOpenModal(type)} className="text-blue-600 hover:text-blue-800 mr-4"><Edit size={18} /></button>
                                    {onSetupClick && (
                                        <button onClick={() => onSetupClick(type)} className="text-gray-600 hover:text-gray-800 mr-4"><Settings size={18} /></button>
                                    )}
                                    <button onClick={() => handleDelete(type.id)} className="text-red-600 hover:text-red-800"><Trash2 size={18} /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {isModalOpen && (
                <LeaveTypeFormModal
                    isOpen={isModalOpen}
                    onClose={handleCloseModal}
                    onSave={handleSave}
                    leaveType={currentLeaveType}
                />
            )}
        </div>
    );
};

// This would be a new component, likely in the same file or a separate one.
const LeaveTypeFormModal = ({ isOpen, onClose, onSave, leaveType }) => {
    const [formData, setFormData] = useState({
        leaveType: leaveType?.leaveType || '',
        description: leaveType?.description || '',
        isPaid: leaveType?.isPaid || false,
        maxDaysPerYear: leaveType?.maxDaysPerYear || 0,
        startTime: leaveType?.startTime || '',
        endTime: leaveType?.endTime || '',
    });

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={leaveType ? 'Edit Leave Type' : 'Add Leave Type'}>
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label htmlFor="leaveType" className="block text-sm font-medium text-slate-700">Leave Type Name</label>
                    <input type="text" name="leaveType" id="leaveType" value={formData.leaveType} onChange={handleChange} required className="input mt-1" />
                </div>
                <div>
                    <label htmlFor="description" className="block text-sm font-medium text-slate-700">Description</label>
                    <textarea name="description" id="description" value={formData.description} onChange={handleChange} rows="3" className="input mt-1" />
                </div>
                <div>
                    <label htmlFor="maxDaysPerYear" className="block text-sm font-medium text-slate-700">Max Days Per Year</label>
                    <input type="number" name="maxDaysPerYear" id="maxDaysPerYear" value={formData.maxDaysPerYear} onChange={handleChange} className="input mt-1" placeholder="e.g., 12" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="startTime" className="block text-sm font-medium text-slate-700">Start Time</label>
                        <input type="time" name="startTime" id="startTime" value={formData.startTime} onChange={handleChange} className="input mt-1" />
                    </div>
                    <div>
                        <label htmlFor="endTime" className="block text-sm font-medium text-slate-700">End Time</label>
                        <input type="time" name="endTime" id="endTime" value={formData.endTime} onChange={handleChange} className="input mt-1" />
                    </div>
                </div>
                <div>
                    <label className="inline-flex items-center">
                        <input
                            type="checkbox"
                            name="isPaid"
                            checked={formData.isPaid}
                            onChange={handleChange}
                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-slate-700">Is Paid Leave</span>
                    </label>
                </div>
                <div className="flex justify-end gap-4 pt-4">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300">Cancel</button>
                    <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Save</button>
                </div>
            </form>
        </Modal>
    );
};

export default LeaveTypes;