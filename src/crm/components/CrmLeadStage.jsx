import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { Edit, Trash2, PlusCircle, Loader, Search, X, AlertCircle, ArrowUp, ArrowDown, Star } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_BASE_URL;

const Modal = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4" onClick={onClose}>
            <div className="bg-card text-card-foreground rounded-lg shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b border-border flex justify-between items-center">
                    <h3 className="text-xl font-semibold text-foreground">{title}</h3>
                    <button onClick={onClose} className="p-1 rounded-full text-foreground-muted hover:bg-background-muted"><X size={20} /></button>
                </div>
                <div className="p-6">{children}</div>
            </div>
        </div>
    );
};

const LeadStageForm = ({ item, onSave, onCancel, loading, locations }) => {
    const [formData, setFormData] = useState({ name: '', isDefault: false, locationId: '', moveTo: '' });

    useEffect(() => {
        if (item) {
            setFormData({
                name: item.name || '',
                isDefault: item.isDefault || false,
                locationId: item.locationId || '',
                moveTo: item.moveTo || '',
            });
        } else {
            setFormData({ name: '', isDefault: false, locationId: '', moveTo: '' });
        }
    }, [item]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave({ id: item?.id, ...formData });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label htmlFor="name" className="block text-sm font-medium text-foreground-muted">Stage Name</label>
                <input id="name" name="name" value={formData.name} onChange={handleChange} required className="input mt-1 bg-background-muted border-border text-foreground" placeholder="e.g., New, Qualified, Proposal" />
            </div>
            <div>
                <label htmlFor="locationId" className="block text-sm font-medium text-foreground-muted">Location (Optional)</label>
                <select id="locationId" name="locationId" value={formData.locationId} onChange={handleChange} className="input mt-1 bg-background-muted border-border text-foreground">
                    <option value="">Select Location</option>
                    {locations.map(loc => <option key={loc.id} value={loc.id}>{loc.name}</option>)}
                </select>
            </div>
            <div>
                <label htmlFor="moveTo" className="block text-sm font-medium text-foreground-muted">Move To (Action)</label>
                <select id="moveTo" name="moveTo" value={formData.moveTo} onChange={handleChange} className="input mt-1 bg-background-muted border-border text-foreground">
                    <option value="">Select Action</option>
                    <option value="Quotation">Quotation</option>
                    <option value="Sale Order">Sale Order</option>
                </select>
                <p className="text-xs text-foreground-muted mt-1">Select an action to trigger when this stage is reached.</p>
            </div>
            <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" name="isDefault" checked={formData.isDefault} onChange={handleChange} className="h-4 w-4 rounded" /> Set as default stage</label>
            </div>
            <div className="flex justify-end gap-2 pt-4">
                <button type="button" onClick={onCancel} className="btn-secondary" disabled={loading}>Cancel</button>
                <button type="submit" className="btn-primary flex items-center" disabled={loading}>
                    {loading && <Loader className="animate-spin h-4 w-4 mr-2" />} Save
                </button>
            </div>
        </form>
    );
};

const CrmLeadStage = ({ locationId }) => {
    const [stages, setStages] = useState([]);
    const [locations, setLocations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [modalLoading, setModalLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const authHeaders = useMemo(() => ({ "Authorization": `Bearer ${localStorage.getItem('token')}` }), []);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const [stagesRes, locationsRes] = await Promise.all([
                axios.get(`${API_URL}/crm/lead-stages`, { headers: authHeaders }),
                axios.get(`${API_URL}/locations`, { headers: authHeaders }),
            ]);
            setStages(Array.isArray(stagesRes.data) ? stagesRes.data : []);
            setLocations(Array.isArray(locationsRes.data) ? locationsRes.data : []);
        } catch (err) {
            setError('Failed to fetch data.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [authHeaders]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleAdd = () => {
        setEditingItem({ locationId: locationId !== 'all' ? locationId : '' });
        setIsModalOpen(true);
    };
    const handleEdit = (item) => { setEditingItem(item); setIsModalOpen(true); };
    const handleCloseModal = () => { setIsModalOpen(false); setEditingItem(null); };

    const handleSave = async (itemData) => {
        setModalLoading(true);
        const payload = { ...itemData, locationId: itemData.locationId || null };
        const isUpdating = Boolean(itemData.id);
        const url = isUpdating ? `${API_URL}/crm/lead-stages/${itemData.id}` : `${API_URL}/crm/lead-stages`;
        const method = isUpdating ? 'put' : 'post';

        try {
            await axios[method](url, itemData, { headers: authHeaders });
            await fetchData();
            handleCloseModal();
        } catch (err) {
            alert(`Error: ${err.response?.data?.message || 'Failed to save lead stage.'}`);
        } finally {
            setModalLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this lead stage?')) {
            try {
                await axios.delete(`${API_URL}/crm/lead-stages/${id}`, { headers: authHeaders });
                await fetchData();
            } catch (err) {
                alert(`Error: ${err.response?.data?.message || 'Failed to delete lead stage.'}`);
            }
        }
    };

    const handleMove = async (id, direction) => {
        try {
            await axios.post(`${API_URL}/crm/lead-stages/${id}/move-${direction}`, {}, { headers: authHeaders });
            await fetchData();
        } catch (err) {
            alert(`Error moving stage: ${err.response?.data?.message || 'Operation failed.'}`);
        }
    };

    const handleSetDefault = async (id) => {
        try {
            await axios.post(`${API_URL}/crm/lead-stages/${id}/set-default`, {}, { headers: authHeaders });
            await fetchData();
        } catch (err) {
            alert(`Error setting default: ${err.response?.data?.message || 'Operation failed.'}`);
        }
    };

    const filteredData = useMemo(() => {
        let filtered = stages;
        if (locationId === 'none') {
            filtered = stages.filter(item => !item.locationId);
        } else if (locationId && locationId !== 'all') {
            filtered = stages.filter(item => String(item.locationId) === String(locationId));
        }
        return filtered.filter(item => !searchTerm || item.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [stages, searchTerm, locationId]);

    return (
        <div className="p-6 bg-card rounded-xl shadow-sm">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-foreground">Manage Lead Stages</h3>
                <div className="flex items-center gap-2">
                    <div className="relative"><input type="text" placeholder="Search..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="input w-full sm:w-64 pr-10 bg-background-muted border-border" /><Search className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-foreground-muted" /></div>
                    <button onClick={handleAdd} className="flex items-center gap-2 btn-secondary"><PlusCircle size={16} /> Add Stage</button>
                </div>
            </div>

            {error && <p className="text-red-500 mb-4">{error}</p>}

            <div className="overflow-x-auto border border-border rounded-lg">
                <table className="min-w-full divide-y divide-border">
                    <thead className="bg-background-muted">
                        <tr>
                            <th className="th-cell w-16">Order</th>
                            <th className="th-cell">Stage Name</th>
                            <th className="th-cell">Location</th>
                            <th className="th-cell">Move To</th>
                            <th className="th-cell">Is Default</th>
                            <th className="th-cell w-24">Reorder</th>
                            <th className="th-cell w-48">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-card divide-y divide-border text-foreground-muted">
                        {loading ? (
                            <tr><td colSpan="7" className="text-center py-10"><Loader className="animate-spin h-8 w-8 text-primary mx-auto" /></td></tr>
                        ) : filteredData.length > 0 ? (
                            filteredData.map((item, index, arr) => (
                                <tr key={item.id} className="hover:bg-background-muted transition-colors">
                                    <td className="td-cell font-medium">{item.sortOrder}</td>
                                    <td className="td-cell font-medium text-foreground">{item.name}</td>
                                    <td className="td-cell">{item.locationName || 'N/A'}</td>
                                    <td className="td-cell">
                                        {item.moveTo ? (
                                            <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                                                {item.moveTo}
                                            </span>
                                        ) : '-'}
                                    </td>
                                    <td className="td-cell">{item.isDefault ? <Star size={16} className="text-amber-500 fill-amber-400" title="Default Stage" /> : null}</td>
                                    <td className="td-cell"><div className="flex items-center gap-1"><button onClick={() => handleMove(item.id, 'up')} disabled={index === 0} className="p-1 disabled:opacity-30"><ArrowUp size={16} /></button><button onClick={() => handleMove(item.id, 'down')} disabled={index === arr.length - 1} className="p-1 disabled:opacity-30"><ArrowDown size={16} /></button></div></td>
                                    <td className="td-cell"><div className="flex items-center gap-2"><button onClick={() => handleSetDefault(item.id)} disabled={item.isDefault} className="btn-secondary btn-sm disabled:opacity-50">Set Default</button><button onClick={() => handleEdit(item)} className="text-primary hover:text-primary/80 p-1" title="Edit"><Edit size={16} /></button><button onClick={() => handleDelete(item.id)} className="text-red-500 hover:text-red-600 p-1" title="Delete"><Trash2 size={16} /></button></div></td>
                                </tr>
                            ))
                        ) : (
                            <tr><td colSpan="7" className="text-center py-10"><AlertCircle className="mx-auto h-12 w-12 text-foreground-muted/50" /><h3 className="mt-2 text-sm font-medium text-foreground">No lead stages found</h3><p className="mt-1 text-sm">Get started by adding a new lead stage.</p></td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingItem?.id ? 'Edit Lead Stage' : 'Add Lead Stage'}>
                <LeadStageForm item={editingItem} onSave={handleSave} onCancel={handleCloseModal} loading={modalLoading} locations={locations} />
            </Modal>
        </div>
    );
}

export default CrmLeadStage;