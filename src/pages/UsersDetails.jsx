import React, { useState, useEffect, useMemo } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { Plus, Edit, Loader, AlertCircle, X, UploadCloud, MapPin } from 'lucide-react';
import axios from 'axios';

// Roles relevant to the HRMS module that can be assigned or viewed.
const HRMS_ROLES = [
    'HRMS_ADMIN',
    'HR',
    'MANAGER',
    'EMPLOYEE',
    // // SUPER_ADMIN is a tenant-level role that might also be managed here.
    // 'SUPER_ADMIN',
];

const UserModal = ({ isOpen, onClose, onSave, user, loading }) => {
    const [formData, setFormData] = useState({ name: '', email: '', password: '', confirmPassword: '', roles: new Set(['EMPLOYEE']), isActive: true, isLocked: false, locationId: null });
    const [modalError, setModalError] = useState('');
    const [locations, setLocations] = useState([]);
    const API_URL = import.meta.env.VITE_API_BASE_URL;

    useEffect(() => {
        if (user) {
            setFormData({ name: user.name, email: user.email, password: '', confirmPassword: '', roles: new Set(user.roles || ['EMPLOYEE']), isActive: user.isActive, isLocked: user.isLocked, locationId: user.locationId });
        } else {
            setFormData({ name: '', email: '', password: '', confirmPassword: '', roles: new Set(['EMPLOYEE']), isActive: true, isLocked: false, locationId: null });
        }
        setModalError('');

        const fetchDropdowns = async () => {
            if (isOpen) {
                try {
                    const token = localStorage.getItem('token');
                    const headers = { "Authorization": `Bearer ${token}` };
                    const [locationsRes] = await Promise.all([
                        axios.get(`${API_URL}/locations`, { headers }).catch(() => ({ data: [] }))
                    ]);
                    setLocations(locationsRes.data);
                } catch (err) {
                    setModalError('Failed to load locations.');
                }
            }
        };

        fetchDropdowns();

    }, [user, isOpen]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleRoleChange = (role) => {
        setFormData(prev => {
            const newRoles = new Set(prev.roles);
            if (newRoles.has(role)) {
                newRoles.delete(role);
            } else {
                newRoles.add(role);
            }
            return { ...prev, roles: newRoles };
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (formData.password !== formData.confirmPassword) {
            setModalError('Passwords do not match.');
            return;
        }
        if (!user && !formData.password) {
            setModalError('Password is required for new users.');
            return;
        }
        const payload = { ...formData, roles: Array.from(formData.roles) };
        // Ensure null is sent if no selection is made
        if (payload.locationId === '') payload.locationId = null;
        onSave(payload);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
                <div className="p-4 border-b flex justify-between items-center">
                    <h2 className="text-xl font-semibold">{user ? 'Edit' : 'Add'} User</h2>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100"><X className="h-5 w-5" /></button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[70vh] overflow-y-auto">
                        <div className="md:col-span-2"><label htmlFor="name" className="block text-sm font-medium text-slate-700">Name</label><input id="name" name="name" value={formData.name} onChange={handleChange} required className="mt-1 block w-full input" /></div>
                        <div className="md:col-span-2"><label htmlFor="email" className="block text-sm font-medium text-slate-700">Email</label><input id="email" name="email" type="email" value={formData.email} onChange={handleChange} required className="mt-1 block w-full input" /></div>
                        <div><label htmlFor="password" className="block text-sm font-medium text-slate-700">Password</label><input id="password" name="password" type="password" value={formData.password} onChange={handleChange} required={!user} className="mt-1 block w-full input" placeholder={user ? 'Leave blank to keep current' : ''} /></div>
                        <div><label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700">Confirm Password</label><input id="confirmPassword" name="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleChange} required={!user || !!formData.password} className="mt-1 block w-full input" /></div>
                        <div className="md:col-span-2"><label className="block text-sm font-medium text-slate-700">Roles</label><div className="mt-2 flex flex-wrap gap-x-4 gap-y-2">{HRMS_ROLES.map(role => (<label key={role} className="inline-flex items-center"><input type="checkbox" checked={formData.roles.has(role)} onChange={() => handleRoleChange(role)} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" /> <span className="ml-2 text-sm text-slate-600">{role}</span></label>))}</div></div>
                        <div className="flex items-center gap-4"><label className="inline-flex items-center"><input type="checkbox" name="isActive" checked={formData.isActive} onChange={handleChange} className="h-4 w-4 rounded" /> <span className="ml-2 text-sm">Is Active</span></label><label className="inline-flex items-center"><input type="checkbox" name="isLocked" checked={formData.isLocked} onChange={handleChange} className="h-4 w-4 rounded" /> <span className="ml-2 text-sm">Is Locked</span></label></div>
                        {modalError && <p className="md:col-span-2 text-red-500 text-sm">{modalError}</p>}
                        <div className="md:col-span-2 pt-2 border-t">
                            <label htmlFor="locationId" className="block text-sm font-medium text-slate-700">Assign to Location (Optional)</label><select id="locationId" name="locationId" value={formData.locationId || ''} onChange={handleChange} className="mt-1 block w-full input"><option value="">No specific location</option>{locations.map(loc => (<option key={loc.id} value={loc.id}>{loc.name}</option>))}</select></div>
                    </div>
                    <div className="p-4 border-t bg-slate-50 flex justify-end gap-2">
                        <button type="button" onClick={onClose} className="btn-secondary" disabled={loading}>Cancel</button>
                        <button type="submit" className="btn-primary flex items-center" disabled={loading}>{loading && <Loader className="animate-spin h-4 w-4 mr-2" />} Save</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const BulkUserModal = ({ isOpen, onClose, onUpload, loading }) => {
    const [file, setFile] = useState(null);
    const [uploadError, setUploadError] = useState('');

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
        setUploadError('');
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!file) {
            setUploadError('Please select a file to upload.');
            return;
        }
        onUpload(file);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
                <div className="p-4 border-b flex justify-between items-center"><h2 className="text-xl font-semibold">Bulk Add Users</h2><button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100"><X className="h-5 w-5" /></button></div>
                <form onSubmit={handleSubmit}>
                    <div className="p-6 space-y-4">
                        <p className="text-sm text-slate-600">Upload an Excel file with user data. Required columns: Name, Email, Password, Roles (comma-separated), IsActive, IsLocked.</p>
                        <input type="file" onChange={handleFileChange} accept=".xlsx, .xls" className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                        {uploadError && <p className="text-red-500 text-sm">{uploadError}</p>}
                    </div>
                    <div className="p-4 border-t bg-slate-50 flex justify-end gap-2">
                        <button type="button" onClick={onClose} className="btn-secondary" disabled={loading}>Cancel</button>
                        <button type="submit" className="btn-primary flex items-center" disabled={loading}>{loading && <Loader className="animate-spin h-4 w-4 mr-2" />} Upload</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const UsersDetails = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isUserModalOpen, setIsUserModalOpen] = useState(false);
    const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [modalLoading, setModalLoading] = useState(false);
    // State to hold location and store names for display
    const [locations, setLocations] = useState([]);


    const API_URL = import.meta.env.VITE_API_BASE_URL;

    const fetchUsers = async () => {
        setLoading(true);
        setError('');
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}/users`, { headers: { "Authorization": `Bearer ${token}` } });
            const [locationsRes] = await Promise.all([
                axios.get(`${API_URL}/locations`, { headers: { "Authorization": `Bearer ${token}` } }).catch(() => ({ data: [] }))
            ]);
            setUsers(response.data);
            setLocations(locationsRes.data);
        } catch (err) {
            setError('Failed to fetch users. Please try again later.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchUsers(); }, []);

    const handleAdd = () => { setEditingUser(null); setIsUserModalOpen(true); };
    const handleEdit = (user) => { setEditingUser(user); setIsUserModalOpen(true); };

    const handleSave = async (userData) => {
        setModalLoading(true);
        setError('');
        try {
            const token = localStorage.getItem('token');
            const { confirmPassword, ...payload } = userData;
            if (editingUser) {
                await axios.put(`${API_URL}/users/${editingUser.id}`, payload, { headers: { "Authorization": `Bearer ${token}` } });
            } else {
                await axios.post(`${API_URL}/users/register`, payload, { headers: { "Authorization": `Bearer ${token}` } });
            }
            setIsUserModalOpen(false);
            fetchUsers();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to save user. The email might already exist.');
            console.error(err);
        } finally {
            setModalLoading(false);
        }
    };

    const handleBulkUpload = async (file) => {
        setModalLoading(true);
        setError('');
        const formData = new FormData();
        formData.append('file', file);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.post(`${API_URL}/users/bulkUsers`, formData, { headers: { "Authorization": `Bearer ${token}`, "Content-Type": "multipart/form-data" } });
            alert(response.data);
            setIsBulkModalOpen(false);
            fetchUsers();
        } catch (err) {
            const errorMessage = err.response?.data || 'Failed to upload file.';
            setError(errorMessage);
            alert(`Upload failed:\n${errorMessage}`);
        } finally {
            setModalLoading(false);
        }
    };

    // Filter users to show only those with roles relevant to HRMS.
    const filteredUsers = useMemo(() => {
        const relevantRoles = new Set(['HRMS_ADMIN', 'HR', 'MANAGER', 'EMPLOYEE']);
        return users.filter(user =>
            user.roles.some(role => relevantRoles.has(role))
        );
    }, [users]);

    // Create maps for quick lookup of location and store names
    const locationMap = useMemo(() => new Map(locations.map(loc => [loc.id, loc.name])), [locations]);

    return (
        <DashboardLayout>
            <div className="p-6 md:p-8">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold text-slate-800">Users</h1>
                </div>

                {error && (<div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert"><strong className="font-bold">Error: </strong><span className="block sm:inline whitespace-pre-wrap">{error}</span></div>)}

                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                    {loading ? (
                        <div className="flex justify-center items-center h-80"><Loader className="h-8 w-8 animate-spin text-blue-600" /></div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full bg-white">
                                <thead className="bg-slate-50">
                                    <tr>
                                        <th className="th-cell">Name</th>
                                        <th className="th-cell">Email</th>
                                        <th className="th-cell">Roles</th>
                                        <th className="th-cell">Location</th>
                                        <th className="th-cell">Status</th>
                                        <th className="th-cell">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="text-slate-700">
                                    {filteredUsers.length > 0 ? (
                                        filteredUsers.map(user => (
                                            <tr key={user.id} className="border-b border-slate-200 hover:bg-slate-50">
                                                <td className="td-cell font-medium">{user.name}</td>
                                                <td className="td-cell text-sm text-slate-500">{user.email}</td>
                                                <td className="td-cell"><div className="flex flex-wrap gap-1">{user.roles.map(role => (<span key={role} className="px-2 py-0.5 text-xs font-semibold rounded-full bg-slate-100 text-slate-700">{role}</span>))}</div></td>
                                                <td className="td-cell text-sm text-slate-500">
                                                    {user.locationId ? <div className="flex items-center gap-1.5"><MapPin size={14} /><span>{locationMap.get(user.locationId) || 'N/A'}</span></div> : '-'}
                                                </td>
                                                <td className="td-cell"><div className="flex items-center gap-2">{user.isActive ? (<span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-green-100 text-green-800">Active</span>) : (<span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-slate-100 text-slate-600">Inactive</span>)}{user.isLocked && (<span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-red-100 text-red-800">Locked</span>)}</div></td>
                                                <td className="td-cell"><button onClick={() => handleEdit(user)} className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-100 rounded-full transition-colors" title="Edit"><Edit className="h-4 w-4" /></button></td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr><td colSpan="6" className="text-center py-10 text-slate-500"><AlertCircle className="mx-auto h-12 w-12 text-slate-400" /><h3 className="mt-2 text-sm font-medium text-slate-900">No users found</h3><p className="mt-1 text-sm text-slate-500">Get started by creating a new user.</p></td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
            <UserModal isOpen={isUserModalOpen} onClose={() => setIsUserModalOpen(false)} onSave={handleSave} user={editingUser} loading={modalLoading} />
            <BulkUserModal isOpen={isBulkModalOpen} onClose={() => setIsBulkModalOpen(false)} onUpload={handleBulkUpload} loading={modalLoading} />
        </DashboardLayout>
    );
}

export default UsersDetails;
