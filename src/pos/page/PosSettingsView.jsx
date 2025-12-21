import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { Building, Store, Users, Percent, Edit, Trash2, PlusCircle, Loader, Save, X, ClipboardList, Eye, Tag, UploadCloud, FileText } from 'lucide-react';
import { constructImageUrl } from '../sales/utils';
import CompanyInfo from '../../manageCompany/CompanyInfo';

const API_URL = import.meta.env.VITE_API_BASE_URL;

// --- Reusable Components ---

const Modal = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4" onClick={onClose}>
            <div className="bg-card text-card-foreground rounded-lg shadow-xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b border-border flex justify-between items-center">
                    <h3 className="text-xl font-semibold text-foreground">{title}</h3>
                    <button onClick={onClose} className="p-1 rounded-full text-foreground-muted hover:bg-background-muted"><X size={20} /></button>
                </div>
                <div className="p-6">
                    {children}
                </div>
            </div>
        </div>
    );
};

const FormField = ({ label, name, value, onChange, type = 'text', required = false, ...props }) => (
    <div>
        <label htmlFor={name} className="block text-sm font-medium text-foreground-muted">{label}</label>
        <input
            type={type}
            id={name}
            name={name}
            value={value || ''}
            onChange={onChange}
            required={required}
            className="input mt-1 bg-background-muted border-border text-foreground"
            {...props}
        />
    </div>
);

const StoreForm = ({ item, onSave, onCancel }) => {
    const [formData, setFormData] = useState(item || { name: '', address: '', currency: 'AED', timezone: 'Asia/Dubai', vatNumber: '' });
    const handleChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });
    const handleSubmit = e => { e.preventDefault(); onSave(formData); };
    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <FormField label="Store Name" name="name" value={formData.name} onChange={handleChange} required /> {/* No change here, already good */}
            <FormField label="Address" name="address" value={formData.address} onChange={handleChange} /> {/* No change here, already good */}
            <FormField label="Currency" name="currency" value={formData.currency} onChange={handleChange} /> {/* No change here, already good */}
            <FormField label="Timezone" name="timezone" value={formData.timezone} onChange={handleChange} /> {/* No change here, already good */}
            <FormField label="VAT Number" name="vatNumber" value={formData.vatNumber} onChange={handleChange} /> {/* No change here, already good */}
            <div className="flex justify-end gap-2 pt-4"><button type="button" onClick={onCancel} className="btn-secondary">Cancel</button><button type="submit" className="btn-primary">Save</button></div>
        </form>
    );
};

const TaxRateForm = ({ item, onSave, onCancel }) => {
    const [formData, setFormData] = useState(item || { name: '', percent: 0, compound: false });
    const handleChange = e => setFormData({ ...formData, [e.target.name]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });
    const handleSubmit = e => { e.preventDefault(); onSave(formData); };
    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <FormField label="Tax Name" name="name" value={formData.name} onChange={handleChange} required /> {/* No change here, already good */}
            <FormField label="Percent" name="percent" type="number" step="0.01" value={formData.percent} onChange={handleChange} required /> {/* No change here, already good */}
            <label className="flex items-center gap-2 text-foreground-muted"><input type="checkbox" name="compound" checked={formData.compound} onChange={handleChange} className="h-4 w-4 rounded border-border text-primary focus:ring-primary" /> Compound Tax</label>
            <div className="flex justify-end gap-2 pt-4"><button type="button" onClick={onCancel} className="btn-secondary">Cancel</button><button type="submit" className="btn-primary">Save</button></div>
        </form>
    );
};

const CategoryForm = ({ item, onSave, onCancel }) => {
    const [formData, setFormData] = useState(item || { name: '', description: '' });
    const handleChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });
    const handleSubmit = e => { e.preventDefault(); onSave(formData); };
    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <FormField label="Category Name" name="name" value={formData.name} onChange={handleChange} required /> {/* No change here, already good */}
            <FormField label="Description" name="description" value={formData.description} onChange={handleChange} /> {/* No change here, already good */}
            <div className="flex justify-end gap-2 pt-4"><button type="button" onClick={onCancel} className="btn-secondary">Cancel</button><button type="submit" className="btn-primary">Save</button></div>
        </form>
    );
};

const UserForm = ({ item, onSave, onCancel }) => {
    const [formData, setFormData] = useState(item || {
        name: '', // Changed from displayName
        email: '',
        password: '', // This will be the passwordHash
        confirmPassword: '',
        role: 'POS_CASHIER', // Default role
        storeId: null,
    });
    const [formError, setFormError] = useState('');
    const [stores, setStores] = useState([]);
    const [storesLoading, setStoresLoading] = useState(true);

    const API_URL = import.meta.env.VITE_API_BASE_URL;

    useEffect(() => {
        const fetchStores = async () => {
            setStoresLoading(true);
            try {
                const token = localStorage.getItem('token');
                const res = await axios.get(`${API_URL}/pos/stores`, { headers: { "Authorization": `Bearer ${token}` } });
                setStores(res.data);
            } catch (err) {
                console.error("Error fetching stores:", err);
                setFormError("Failed to load stores for selection.");
            } finally {
                setStoresLoading(false);
            }
        };
        fetchStores();
    }, [API_URL]);

    const handleChange = e => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        setFormError('');
    };

    const handleSubmit = e => {
        e.preventDefault();
        if (formData.password !== formData.confirmPassword) {
            setFormError("Passwords do not match.");
            return;
        }
        if (!item && !formData.password) {
            setFormError("Password is required for new users.");
            return;
        }
        if (formData.password && formData.password.length < 6) {
            setFormError("Password must be at least 6 characters long.");
            return;
        }

        const payload = { ...formData };
        if (payload.storeId === '') payload.storeId = null; // Convert empty string to null
        onSave(item ? { ...payload, id: item.id } : payload);
    };

    const posRoles = ['POS_ADMIN', 'POS_MANAGER', 'POS_CASHIER'];

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <FormField label="Email" name="email" type="email" value={formData.email} onChange={handleChange} required />
            <FormField label="Display Name" name="name" value={formData.name} onChange={handleChange} required />
            <FormField label="Password" name="password" type="password" value={formData.password} onChange={handleChange} required={!item} placeholder={item ? 'Leave blank to keep current' : ''} />
            <FormField label="Confirm Password" name="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleChange} required={!item || !!formData.password} />

            <div>
                <label htmlFor="role" className="block text-sm font-medium text-slate-700">Role</label>
                <select id="role" name="role" value={formData.role} onChange={handleChange} required className="input mt-1">
                    {posRoles.map(role => (
                        <option key={role} value={role}>{role.replace(/_/g, ' ')}</option>
                    ))}
                </select>
            </div>

            <div>
                <label htmlFor="storeId" className="block text-sm font-medium text-slate-700">Assign to Store (Optional)</label>
                {storesLoading ? (
                    <Loader className="animate-spin h-5 w-5 text-blue-600 mt-2" />
                ) : (
                    <select id="storeId" name="storeId" value={formData.storeId || ''} onChange={handleChange} className="input mt-1">
                        <option value="">No specific store</option>
                        {stores.map(store => (
                            <option key={store.id} value={store.id}>{store.name}</option>
                        ))}
                    </select>
                )}
            </div>

            {formError && <p className="text-red-500 text-sm">{formError}</p>}

            <div className="flex justify-end gap-2 pt-4">
                <button type="button" onClick={onCancel} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">Save</button>
            </div>
        </form>
    );
};

const InfoDisplay = ({ label, value }) => (
    <div>
        <p className="text-sm text-slate-500">{label}</p>
        <p className="font-medium text-slate-800">{value || <span className="text-slate-400">N/A</span>}</p>
    </div>
);

const CrudTable = ({ title, columns, data, onAdd, onEdit, onDelete, addLabel, canManage }) => (
    <div>
        <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">{title}</h3>
            {canManage && (
                <button onClick={onAdd} className="flex items-center gap-2 btn-secondary">
                    <PlusCircle size={16} /> {addLabel}
                </button>
            )}
        </div>
        <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                    <tr>
                        {columns.map(col => <th key={col.key} className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{col.header}</th>)}
                        {canManage && <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>}
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200 text-slate-700">
                    {data.map(item => (
                        <tr key={item.id}>
                            {columns.map(col => <td key={col.key} className="px-4 py-3 whitespace-nowrap text-sm">{typeof item[col.key] === 'boolean' ? (item[col.key] ? 'Yes' : 'No') : item[col.key]}</td>)}
                            {canManage && (
                                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                                    <button onClick={() => onEdit(item)} className="text-blue-600 hover:text-blue-900 mr-3"><Edit size={16} /></button>
                                    <button onClick={() => onDelete(item.id)} className="text-red-600 hover:text-red-900"><Trash2 size={16} /></button>
                                </td>
                            )}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
);

// --- Auth Hook ---
const usePosAuth = () => {
    const roles = useMemo(() => {
        try {
            return JSON.parse(localStorage.getItem('roles') || '[]');
        } catch {
            return [];
        }
    }, []);

    const isSuperAdmin = roles.includes('SUPER_ADMIN');
    const isPosAdmin = roles.includes('POS_ADMIN') || isSuperAdmin;
    const isPosManager = roles.includes('POS_MANAGER');

    return { isPosAdmin, isPosManager, isSuperAdmin };
};

// --- General Settings Tab ---
const GeneralSettingsTab = () => {
    const [tenant, setTenant] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({ name: '', contactEmail: '', contactPhone: '', address: '' });
    const [logoFile, setLogoFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [logoUrl, setLogoUrl] = useState(null);
    const { isPosAdmin } = usePosAuth();

    const fetchTenant = useCallback(() => {
        const token = localStorage.getItem('token');
        axios.get(`${API_URL}/pos/tenant/current`, { headers: { Authorization: `Bearer ${token}` } })
            .then(res => {
                setTenant(res.data);
                setFormData({
                    name: res.data.name || '',
                    contactEmail: res.data.contactEmail || '',
                    contactPhone: res.data.contactPhone || '',
                    address: res.data.address || '',
                });


                if (res.data.logoImgUrl) {
                    setLogoUrl(constructImageUrl(res.data.logoImgUrl)); // Correct URL with constructImageUrl
                    // axios.get(`${API_URL}/pos/tenant/current/logo`, {
                    //     headers: { Authorization: `Bearer ${token}` },
                    //     responseType: 'blob'
                    // }).then(logoRes => {
                    //     const objectUrl = URL.createObjectURL(logoRes.data);
                    //     setLogoUrl(objectUrl);
                    // }).catch(logoErr => console.error("Could not fetch logo image:", logoErr));

                }
                console.log(logoUrl)

            })
            .catch(err => console.error("Error fetching tenant info:", err))
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => { fetchTenant(); }, [fetchTenant]);

    const handleSave = async () => {
        const token = localStorage.getItem('token');
        setIsUploading(true);

        try {
            // 1. Upload logo if a new one is selected
            if (logoFile) {
                const logoFormData = new FormData();
                logoFormData.append('file', logoFile);
                const logoUploadResponse = await axios.post(`${API_URL}/pos/tenant/current/logo`, logoFormData, {
                    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
                });
                // The response contains the updated tenant, use its logo path
            }

            // 2. Update other tenant details
            const res = await axios.put(`${API_URL}/pos/tenant/current`, formData, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setIsEditing(false);
            setLogoFile(null);
            alert('Tenant information updated successfully.');
            fetchTenant(); // Refetch all tenant data to get the new logo
        } catch (err) {
            console.error("Failed to update tenant:", err);
            alert(`Failed to update tenant information: ${err.response?.data?.message || err.message}`);
        } finally {
            setIsUploading(false);
        }
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setLogoFile(e.target.files[0]);
        }
    };

    if (loading) return <Loader className="animate-spin" />;

    return (
        <div className="max-w-2xl">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">General Information</h3>
                {isPosAdmin && !isEditing && <button onClick={() => setIsEditing(true)} className="btn-secondary flex items-center gap-2"><Edit size={16} /> Edit</button>}
            </div>
            <div className="p-4 border rounded-lg bg-slate-50">
                {isEditing ? (
                    <div className="space-y-4">
                        {/* <FormField label="Tenant/Company Name" name="name" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} /> */}
                        <FormField label="Contact Email" name="contactEmail" type="email" value={formData.contactEmail} onChange={e => setFormData({ ...formData, contactEmail: e.target.value })} />
                        <FormField label="Contact Phone" name="contactPhone" value={formData.contactPhone} onChange={e => setFormData({ ...formData, contactPhone: e.target.value })} />
                        <FormField label="Address" name="address" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} />
                        {/* <div>
                            <label className="block text-sm font-medium text-slate-700">Company Logo</label>
                            <div className="mt-1 flex items-center gap-4">
                                {logoUrl && !logoFile && <img src={logoUrl} alt="Current Logo" className="h-12 w-12 object-contain rounded-md border bg-white" />}
                                {logoFile && <img src={URL.createObjectURL(logoFile)} alt="New Logo Preview" className="h-12 w-12 object-contain rounded-md border bg-white" />}
                                <input type="file" accept="image/*" onChange={handleFileChange} className="text-sm text-slate-500 file:mr-4 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                            </div>
                        </div> */}
                        <div className="flex justify-end gap-2">
                            <button onClick={() => { setIsEditing(false); setLogoFile(null); }} className="btn-secondary" disabled={isUploading}>Cancel</button>
                            <button onClick={handleSave} className="btn-primary flex items-center gap-2" disabled={isUploading}>
                                {isUploading ? <Loader className="animate-spin h-4 w-4" /> : <Save size={16} />}
                                {isUploading ? 'Saving...' : 'Save'}
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <InfoDisplay label="Tenant ID" value={tenant?.tenantId} />
                        {/* <InfoDisplay label="Company Name" value={tenant?.name} /> */}
                        <InfoDisplay label="Contact Email" value={tenant?.contactEmail} />
                        <InfoDisplay label="Contact Phone" value={tenant?.contactPhone} />
                        <div className="md:col-span-2"><InfoDisplay label="Address" value={tenant?.address} /></div>
                        {/* <div>
                            <p className="text-sm text-slate-500">Logo</p>
                            {logoUrl ? <img src={logoUrl} alt="Logo" className="mt-1 h-16 w-auto object-contain rounded-md border p-1 bg-white" /> : <p className="text-slate-400">N/A</p>}
                        </div> */}
                    </div>
                )}
            </div>
        </div>
    );
};

// --- CRUD Factory for other settings ---
const createCrudTab = (config) => () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const { isPosAdmin } = usePosAuth();

    const fetchItems = useCallback(() => {
        setLoading(true);
        const token = localStorage.getItem('token');
        axios.get(`${API_URL}${config.endpoints.getAll}`, { headers: { "Authorization": `Bearer ${token}` } })
            .then(res => {
                let fetchedData = res.data; // res is the axios response object
                // If we are fetching users for the POS settings, filter them.
                if (config.name === 'pos users') {
                    const relevantRoles = new Set(['POS_ADMIN', 'POS_MANAGER', 'POS_CASHIER']);
                    fetchedData = res.data.filter(user =>
                        user.roles && user.roles.some(role => relevantRoles.has(role))
                    ).map(user => ({
                        ...user,
                        role: user.roles.find(r => relevantRoles.has(r))
                    }));
                }
                setData(fetchedData);
            }).catch(err => console.error(`Error fetching ${config.name}:`, err.message, err.toJSON()))
            .finally(() => setLoading(false));
    }, [config.endpoints.getAll, config.name]);

    useEffect(() => { fetchItems(); }, [fetchItems]);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentItem, setCurrentItem] = useState(null);

    const handleAdd = () => { setCurrentItem(null); setIsModalOpen(true); };
    const handleEdit = (item) => { setCurrentItem(item); setIsModalOpen(true); };
    const handleCloseModal = () => { setIsModalOpen(false); setCurrentItem(null); };

    const handleSave = (itemData) => {
        const token = localStorage.getItem('token');
        const isUpdating = itemData.id;
        const url = isUpdating ? `${API_URL}${config.endpoints.update}/${itemData.id}` : `${API_URL}${config.endpoints.create}`;
        const method = isUpdating ? 'put' : 'post';

        const dataToSend = { ...itemData };
        if (config.name === 'pos users') {
            // Always send roles as an array
            dataToSend.roles = [itemData.role];
            delete dataToSend.role;

            // Clean up data before sending to the backend
            if ('confirmPassword' in dataToSend) {
                delete dataToSend.confirmPassword;
            }
            if (isUpdating) {
                // For updates, don't send password if it's empty
                if (dataToSend.password === '') {
                    delete dataToSend.password;
                }
            } else {
                // For creation, ensure we match UserRegisterRequest
                dataToSend.isActive = true;
                dataToSend.isLocked = false;
            }
        }

        axios[method](url, dataToSend, {
            headers: { "Authorization": `Bearer ${token}` }
        })
            .then(() => { fetchItems(); handleCloseModal(); })
            .catch(err => alert(`Error saving ${config.singularName}: ${err.response?.data?.message || err.response?.data || err.message}`));
    };

    const handleDelete = (id) => {
        if (window.confirm(`Are you sure you want to delete this ${config.singularName}?`)) {
            const token = localStorage.getItem('token');
            axios.delete(`${API_URL}${config.endpoints.delete}/${id}`, { headers: { "Authorization": `Bearer ${token}` } })
                .then(() => { fetchItems(); })
                .catch(err => alert(`Error deleting ${config.singularName}: ${err.response?.data?.message || err.message}`));
        }
    };

    if (loading) return <Loader className="animate-spin" />;

    return (
        <>
            <CrudTable
                title={config.title}
                columns={config.columns}
                data={data}
                onAdd={handleAdd}
                onEdit={handleEdit}
                onDelete={handleDelete}
                addLabel={`Add ${config.singularName}`}
                canManage={isPosAdmin}
            />
            <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={currentItem ? `Edit ${config.singularName}` : `Add ${config.singularName}`}>
                <config.FormComponent item={currentItem} onSave={handleSave} onCancel={handleCloseModal} />
            </Modal>
        </>
    );
};

const StoreSettingsTab = createCrudTab({
    name: 'stores', singularName: 'Store', title: 'Manage Stores', addLabel: 'Add Store',
    columns: [
        { header: 'Name', key: 'name' },
        { header: 'Address', key: 'address' },
        { header: 'Currency', key: 'currency' },
        { header: 'Timezone', key: 'timezone' },
        { header: 'VAT Number', key: 'vatNumber' },
    ],
    endpoints: { getAll: '/pos/stores', create: '/pos/stores', update: '/pos/stores', delete: '/pos/stores' },
    FormComponent: StoreForm,
});

const UserSettingsTab = createCrudTab({
    name: 'pos users', singularName: 'User', title: 'Manage Users', addLabel: 'Add User',
    columns: [
        { header: 'Display Name', key: 'name' },
        { header: 'Email', key: 'email' },
        { header: 'Role', key: 'role' },
        { header: 'Store ID', key: 'storeId' },
    ],
    endpoints: {
        getAll: '/users',
        create: '/users/register',
        update: '/users',
        delete: '/users',
    },
    FormComponent: UserForm,
});

const TaxSettingsTab = createCrudTab({
    name: 'tax rates', singularName: 'Tax Rate', title: 'Manage Tax Rates', addLabel: 'Add Tax Rate',
    columns: [
        { header: 'Name', key: 'name' },
        { header: 'Percent (%)', key: 'percent' },
        { header: 'Compound', key: 'compound' },
    ],
    endpoints: { getAll: '/pos/tax-rates', create: '/pos/tax-rates', update: '/pos/tax-rates', delete: '/pos/tax-rates' },
    FormComponent: TaxRateForm,
});

const CategorySettingsTab = createCrudTab({
    name: 'categories', singularName: 'Category', title: 'Manage Categories', addLabel: 'Add Category',
    columns: [
        { header: 'Name', key: 'name' },
        { header: 'Description', key: 'description' },
    ],
    endpoints: { getAll: '/pos/categories', create: '/pos/categories', update: '/pos/categories', delete: '/pos/categories' },
    FormComponent: CategoryForm,
});

// --- Audit Log Tab ---
const AuditEventLogTab = () => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [viewingPayload, setViewingPayload] = useState(null);

    const fetchEvents = useCallback(() => {
        setLoading(true);
        const token = localStorage.getItem('token');
        axios.get(`${API_URL}/pos/audit-events`, { headers: { "Authorization": `Bearer ${token}` } })
            .then(res => setEvents(res.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))))
            .catch(err => {
                console.error("Error fetching audit events:", err);
                setError('Failed to load audit events.');
            })
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => { fetchEvents(); }, [fetchEvents]);

    const formatTimestamp = (ts) => new Date(ts).toLocaleString();

    if (loading) return <Loader className="animate-spin" />;
    if (error) return <p className="text-red-500">{error}</p>;

    return (
        <>
            <div className="overflow-x-auto border border-slate-200 rounded-lg">
                <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                        <tr>
                            <th className="th-cell">Timestamp</th>
                            <th className="th-cell">Actor ID</th>
                            <th className="th-cell">Entity</th>
                            <th className="th-cell">Action</th>
                            <th className="th-cell">Payload</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200 text-slate-700">
                        {events.map(event => (
                            <tr key={event.id}>
                                <td className="td-cell text-sm">{formatTimestamp(event.createdAt)}</td>
                                <td className="td-cell">{event.actorId || 'System'}</td>
                                <td className="td-cell">{event.entityType} ({event.entityId})</td>
                                <td className="td-cell font-medium">{event.action}</td>
                                <td className="td-cell">
                                    <button onClick={() => setViewingPayload(event.payload)} className="p-1.5 text-slate-500 hover:text-blue-600 rounded-full" title="View Payload">
                                        <Eye size={16} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <Modal isOpen={!!viewingPayload} onClose={() => setViewingPayload(null)} title="Event Payload">
                <pre className="bg-slate-100 p-4 rounded-md text-sm overflow-x-auto max-h-96">
                    {JSON.stringify(JSON.parse(viewingPayload || '{}'), null, 2)}
                </pre>
            </Modal>
        </>
    );
};


// --- Main Component ---
const tabs = [
    { name: 'Tenant', icon: Building, component: GeneralSettingsTab },
    { name: 'Company Info', icon: FileText, component: CompanyInfo, requiredRoles: ['POS_ADMIN'] },
    { name: 'Stores', icon: Store, component: StoreSettingsTab },
    { name: 'Users', icon: Users, component: UserSettingsTab },
    { name: 'Taxes', icon: Percent, component: TaxSettingsTab },
    { name: 'Categories', icon: Tag, component: CategorySettingsTab },
    { name: 'Audit Log', icon: ClipboardList, component: AuditEventLogTab, requiredRoles: ['POS_ADMIN', 'POS_MANAGER'] },
];

const PosSettingsView = () => {
    const [activeTab, setActiveTab] = useState(tabs[0].name);
    const { isPosAdmin, isPosManager, isSuperAdmin } = usePosAuth();

    const accessibleTabs = useMemo(() =>
        tabs.filter(tab => {
            if (isSuperAdmin) return true; // Super admin can see all settings tabs
            return !tab.requiredRoles || (isPosAdmin && tab.requiredRoles.includes('POS_ADMIN')) || (isPosManager && tab.requiredRoles.includes('POS_MANAGER'));
        }), [isPosAdmin, isPosManager, isSuperAdmin]);

    const ActiveComponent = tabs.find(tab => tab.name === activeTab)?.component;

    return (
        <div className="p-6 md:p-8 h-full flex flex-col">
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-slate-800">POS Settings</h1>
                <p className="text-slate-500 mt-1">Manage your point of sale system settings.</p>
            </div>

            <div className="border-b border-slate-200">
                <nav className="-mb-px flex space-x-6 overflow-x-auto" aria-label="Tabs">
                    {accessibleTabs.map((tab) => (
                        <button
                            key={tab.name}
                            onClick={() => setActiveTab(tab.name)}
                            className={`whitespace-nowrap flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === tab.name
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                                }`}
                        >
                            <tab.icon className="mr-2 h-5 w-5" />
                            {tab.name}
                        </button>
                    ))}
                </nav>
            </div>

            <div className="mt-6 bg-white p-6 rounded-xl shadow-sm flex-grow">
                {ActiveComponent ? <ActiveComponent /> : <p>Select a setting to view.</p>}
            </div>
        </div>
    );
}

export default PosSettingsView;
