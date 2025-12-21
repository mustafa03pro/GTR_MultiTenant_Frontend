import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Building, Users, Server, Activity, ArrowUpRight, ArrowDownRight, Loader, LogOut, Sparkles, Trash2, Check, X, PlusCircle, Edit, LayoutDashboard, Menu, AlertCircle, Calendar, Hash, MapPin, Store, Eye, Palette, Search } from 'lucide-react';
import axios from 'axios';
import { AnimatePresence, motion } from 'framer-motion';
import ProvisionTenant from './ProvisionTenant';

const serviceModulesOptions = [
    { value: 'HRMS_CORE', label: 'HRMS Core' },
    { value: 'HRMS_ATTENDANCE', label: 'HRMS Attendance' },
    { value: 'HRMS_LEAVE', label: 'HRMS Leave' },
    { value: 'HRMS_PAYROLL', label: 'HRMS Payroll' },
    { value: 'HRMS_RECRUITMENT', label: 'HRMS Recruitment' },
    { value: 'POS', label: 'Point of Sale (POS)' },
    { value: 'CRM', label: 'CRM' },
    { value: 'PRODUCTION', label: 'Production' },
    { value: 'SALES', label: 'Sales' },
    { value: 'PURCHASES', label: 'Purchase' }
];

const adminRoleOptions = [
    { value: 'SUPER_ADMIN', label: 'Super Admin' },
    { value: 'HRMS_ADMIN', label: 'HRMS Admin' },
    { value: 'HR', label: 'HR' },
    { value: 'MANAGER', label: 'Manager' },
    { value: 'EMPLOYEE', label: 'Employee' },
    { value: 'POS_ADMIN', label: 'POS Admin' },
    { value: 'POS_MANAGER', label: 'POS Manager' },
    { value: 'POS_CASHIER', label: 'POS Cashier' },
];

const masterRoleOptions = [
    { value: 'MASTER_ADMIN', label: 'Master Admin' },
];

const masterNavLinks = [
    { name: 'Dashboard', view: 'dashboard', icon: LayoutDashboard, color: 'text-sky-500' },
    { name: 'Tenants', view: 'tenants', icon: Building, color: 'text-orange-500' },
    { name: 'Requests', view: 'requests', icon: Activity, color: 'text-yellow-500' },
];

const InputField = ({ label, ...props }) => (
    <div>
        <label htmlFor={props.name} className="block text-sm font-medium text-foreground-muted">{label}</label>
        <input id={props.name} {...props} className="input bg-background-muted border-border text-foreground" />
    </div>
);

const UpdateTenantModal = ({ isOpen, onClose, onUpdate, tenant, isLoading }) => {
    const [selectedModules, setSelectedModules] = useState([]);
    const [formData, setFormData] = useState({});
    const [adminRoles, setAdminRoles] = useState(new Set());
    const [error, setError] = useState('');

    useEffect(() => {
        if (tenant) {
            setSelectedModules(tenant.serviceModules || []);
            setFormData({
                companyName: tenant.companyName || '',
                numberOfLocations: tenant.numberOfLocations || 1,
                numberOfUsers: tenant.numberOfUsers || 5,
                numberOfStore: tenant.numberOfStore || 1,
                hrmsAccessCount: tenant.hrmsAccessCount || 5,
                subscriptionStartDate: tenant.subscriptionStartDate ? new Date(tenant.subscriptionStartDate).toISOString().split('T')[0] : '',
                subscriptionEndDate: tenant.subscriptionEndDate ? new Date(tenant.subscriptionEndDate).toISOString().split('T')[0] : '',
            });
            // Assuming we fetch or know the current admin roles. For now, we'll default based on modules.
            setAdminRoles(new Set(tenant.adminRoles || []));
        }
    }, [tenant]);

    const handleModuleChange = (e) => {
        const { value, checked } = e.target;
        setSelectedModules(prev => checked ? [...prev, value] : prev.filter(m => m !== value));
    };

    const handleChange = (e) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleAdminRoleChange = (e) => {
        const { value, checked } = e.target;
        setAdminRoles(prev => {
            const newRoles = new Set(prev);
            if (checked) newRoles.add(value);
            else newRoles.delete(value);
            return newRoles;
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        const payload = {
            details: formData,
            serviceModules: selectedModules,
            adminRoles: Array.from(adminRoles),
        };

        try {
            await onUpdate(tenant.tenantId, payload.details, { serviceModules: payload.serviceModules, adminRoles: payload.adminRoles });
            onClose();
        } catch (err) {
            setError(err.response?.data?.message || err.message || 'An error occurred during the update.');
        }
    };

    if (!isOpen || !tenant) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4">
            <div className="bg-card text-card-foreground rounded-lg shadow-xl w-full max-w-lg">
                <div className="p-4 border-b border-border flex justify-between items-center">
                    <h3 className="text-xl font-semibold text-foreground">Update Tenant: {tenant.tenantId}</h3>
                    <button onClick={onClose} className="p-1 rounded-full text-foreground-muted hover:bg-background-muted"><X size={20} /></button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
                        <h4 className="text-md font-semibold text-foreground-muted border-b border-border pb-2">Tenant Details</h4>
                        <InputField label="Company Name" name="companyName" value={formData.companyName} onChange={handleChange} required />

                        <h4 className="text-md font-semibold text-foreground-muted border-b border-border pb-2 pt-4">Subscription Details</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <InputField label="Number of Locations" name="numberOfLocations" type="number" value={formData.numberOfLocations} onChange={handleChange} required min="1" />
                            <InputField label="Number of Users" name="numberOfUsers" type="number" value={formData.numberOfUsers} onChange={handleChange} required min="1" />
                            <InputField label="Number of Stores" name="numberOfStore" type="number" value={formData.numberOfStore} onChange={handleChange} required min="1" />
                            <InputField label="HRMS Access Count" name="hrmsAccessCount" type="number" value={formData.hrmsAccessCount} onChange={handleChange} required min="1" />
                            <InputField label="Subscription Start Date" name="subscriptionStartDate" type="date" value={formData.subscriptionStartDate} onChange={handleChange} required />
                            <InputField label="Subscription End Date" name="subscriptionEndDate" type="date" value={formData.subscriptionEndDate} onChange={handleChange} required />
                        </div>

                        <h4 className="text-md font-semibold text-foreground-muted border-b border-border pb-2 pt-4">Service Modules</h4>
                        <label className="block text-sm font-medium text-foreground-muted">Service Modules</label>
                        <div className="mt-2 space-y-2">
                            {serviceModulesOptions.map(module => (
                                <label key={module.value} className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        value={module.value}
                                        checked={selectedModules.includes(module.value)}
                                        onChange={handleModuleChange}
                                        className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                                    />
                                    <span>{module.label}</span>
                                </label>
                            ))}
                        </div>

                        <h4 className="text-md font-semibold text-foreground-muted border-b border-border pb-2 pt-4">Admin Roles</h4>
                        <div className="mt-2 space-y-2">
                            {adminRoleOptions.map(role => (
                                <label key={role.value} className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        value={role.value}
                                        checked={adminRoles.has(role.value)}
                                        onChange={handleAdminRoleChange}
                                        className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                                    />
                                    <span>{role.label}</span>
                                </label>
                            ))}
                        </div>
                        {error && <p className="text-sm text-red-500 text-center">{error}</p>}
                    </div>

                    <div className="p-4 bg-background-muted border-t border-border flex justify-end gap-2">
                        <button type="button" onClick={onClose} className="btn-secondary" disabled={isLoading}>Cancel</button>
                        <button type="submit" className="btn-primary flex items-center" disabled={isLoading}>
                            {isLoading ? <Loader className="animate-spin h-4 w-4 mr-2" /> : <Check className="h-4 w-4 mr-2" />} Update Tenant
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const TenantDetailsModal = ({ isOpen, onClose, tenant, onEditClick }) => {
    if (!isOpen || !tenant) return null;

    const DetailItem = ({ icon: Icon, label, value, isDate = false }) => (
        <div className="flex items-start gap-3">
            <Icon className="h-5 w-5 text-foreground-muted mt-0.5" />
            <div>
                <p className="text-sm text-foreground-muted">{label}</p>
                <p className="font-medium text-foreground">
                    {isDate && value ? new Date(value).toLocaleDateString() : (value ?? 'N/A')}
                </p>
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4">
            <div className="bg-card text-card-foreground rounded-lg shadow-xl w-full max-w-2xl">
                <div className="p-4 border-b border-border flex justify-between items-center">
                    <div>
                        <h3 className="text-xl font-semibold">{tenant.companyName}</h3>
                        <p className="text-sm text-foreground-muted">{tenant.tenantId}</p>
                    </div>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-background-muted"><X size={20} /></button>
                </div>
                <div className="p-6 max-h-[75vh] overflow-y-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <DetailItem icon={Building} label="Company Name" value={tenant.companyName} />
                        <DetailItem icon={Hash} label="Tenant ID" value={tenant.tenantId} />
                        <DetailItem icon={MapPin} label="Locations Allowed" value={tenant.numberOfLocations} />
                        <DetailItem icon={Users} label="Users Allowed" value={tenant.numberOfUsers} />
                        <DetailItem icon={Store} label="Stores Allowed" value={tenant.numberOfStore} />
                        <DetailItem icon={Users} label="HRMS Access Count" value={tenant.hrmsAccessCount} />
                        <DetailItem icon={Calendar} label="Subscription Start" value={tenant.subscriptionStartDate} isDate />
                        <DetailItem icon={Calendar} label="Subscription End" value={tenant.subscriptionEndDate} isDate />
                        <div className="md:col-span-2">
                            <DetailItem icon={Activity} label="Status" value={tenant.status} />
                        </div>
                        <div className="md:col-span-2">
                            <DetailItem icon={Server} label="JDBC URL" value={tenant.jdbcUrl} />
                        </div>
                    </div>
                </div>
                <div className="p-4 border-t border-border bg-background-muted flex justify-end">
                    <button onClick={() => onEditClick(tenant)} className="btn-secondary flex items-center gap-2">
                        <Edit size={16} />
                        Edit Tenant
                    </button>
                </div>
            </div>
        </div>
    );
};

const MasterUserModal = ({ isOpen, onClose, onSave, user, loading }) => {
    const [formData, setFormData] = useState({ username: '', password: '', confirmPassword: '', roles: new Set(['MASTER_ADMIN']) });
    const [modalError, setModalError] = useState('');

    useEffect(() => {
        if (user) {
            setFormData({ username: user.username, password: '', confirmPassword: '', roles: new Set(user.roles || ['MASTER_ADMIN']) });
        } else {
            setFormData({ username: '', password: '', confirmPassword: '', roles: new Set(['MASTER_ADMIN']) });
        }
        setModalError('');
    }, [user, isOpen]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleRoleChange = (role) => {
        setFormData(prev => {
            const newRoles = new Set(prev.roles);
            if (newRoles.has(role)) newRoles.delete(role);
            else newRoles.add(role);
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
        onSave({ ...formData, roles: Array.from(formData.roles) });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4">
            <div className="bg-card text-card-foreground rounded-lg shadow-xl w-full max-w-lg">
                <div className="p-4 border-b border-border flex justify-between items-center">
                    <h2 className="text-xl font-semibold">{user ? 'Edit' : 'Add'} Master User</h2>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-background-muted"><X className="h-5 w-5" /></button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2"><InputField label="Username" name="username" value={formData.username} onChange={handleChange} required /></div>
                        <div><InputField label="Password" name="password" type="password" value={formData.password} onChange={handleChange} required={!user} placeholder={user ? 'Leave blank to keep current' : ''} /></div>
                        <div><InputField label="Confirm Password" name="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleChange} required={!user || !!formData.password} /></div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-foreground-muted">Roles</label>
                            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2">
                                {masterRoleOptions.map(role => (
                                    <label key={role.value} className="inline-flex items-center">
                                        <input type="checkbox" checked={formData.roles.has(role.value)} onChange={() => handleRoleChange(role.value)} className="h-4 w-4 rounded border-border text-primary focus:ring-primary" />
                                        <span className="ml-2 text-sm text-foreground-muted">{role.label}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                        {modalError && <p className="md:col-span-2 text-red-500">{modalError}</p>}
                    </div>
                    <div className="p-4 border-t border-border bg-background-muted flex justify-end gap-2">
                        <button type="button" onClick={onClose} className="btn-secondary" disabled={loading}>Cancel</button>
                        <button type="submit" className="btn-primary flex items-center" disabled={loading}>{loading && <Loader className="animate-spin h-4 w-4 mr-2" />} Save</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const MasterUsers = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [modalLoading, setModalLoading] = useState(false);
    const API_URL = import.meta.env.VITE_API_BASE_URL;

    const fetchUsers = async () => {
        setLoading(true);
        setError('');
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}/master/users`, { headers: { "Authorization": `Bearer ${token}` } });
            setUsers(response.data);
        } catch (err) {
            setError('Failed to fetch master users.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchUsers(); }, [API_URL]);

    const handleAdd = () => { setEditingUser(null); setIsModalOpen(true); };
    const handleEdit = (user) => { setEditingUser(user); setIsModalOpen(true); };

    const handleSave = async (userData) => {
        setModalLoading(true);
        setError('');
        try {
            const token = localStorage.getItem('token');
            const { confirmPassword, ...payload } = userData;
            if (editingUser) {
                await axios.put(`${API_URL}/master/users/${editingUser.id}`, payload, { headers: { "Authorization": `Bearer ${token}` } });
            } else {
                await axios.post(`${API_URL}/master/users`, payload, { headers: { "Authorization": `Bearer ${token}` } });
            }
            setIsModalOpen(false);
            fetchUsers();
        } catch (err) {
            setError(err.response?.data || 'Failed to save user.');
            console.error(err);
        } finally {
            setModalLoading(false);
        }
    };

    const handleDelete = async (userId) => {
        if (!window.confirm('Are you sure you want to delete this master user?')) return;
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${API_URL}/master/users/${userId}`, { headers: { "Authorization": `Bearer ${token}` } });
            fetchUsers();
        } catch (err) {
            setError(err.response?.data || 'Failed to delete user.');
            console.error(err);
        }
    };

    return (
        <div className="p-6 md:p-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-foreground">Master Users</h1>
                <button onClick={handleAdd} className="btn-primary flex items-center"><PlusCircle className="h-5 w-5 mr-2" /> Add Master User</button>
            </div>

            {error && (<div className="bg-red-500/10 border border-red-500/20 text-red-500 px-4 py-3 rounded relative mb-4" role="alert"><strong className="font-bold">Error: </strong><span className="block sm:inline">{error}</span></div>)}

            <div className="bg-card text-card-foreground rounded-xl shadow-sm overflow-hidden">
                {loading ? (
                    <div className="flex justify-center items-center h-80"><Loader className="h-8 w-8 animate-spin text-primary" /></div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full">
                            <thead className="bg-background-muted">
                                <tr>
                                    <th className="th-cell">Username</th>
                                    <th className="th-cell">Roles</th>
                                    <th className="th-cell">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="text-foreground-muted">
                                {users.length > 0 ? (
                                    users.map(user => (
                                        <tr key={user.id} className="border-b border-border hover:bg-background-muted">
                                            <td className="td-cell font-medium text-foreground">{user.username}</td>
                                            <td className="td-cell"><div className="flex flex-wrap gap-1">{user.roles.map(role => (<span key={role} className="px-2 py-0.5 text-xs font-semibold rounded-full bg-background-muted text-foreground-muted">{role}</span>))}</div></td>
                                            <td className="td-cell">
                                                <button onClick={() => handleEdit(user)} className="p-2 hover:text-primary hover:bg-background-muted rounded-full transition-colors" title="Edit"><Edit className="h-4 w-4" /></button>
                                                <button onClick={() => handleDelete(user.id)} className="p-2 hover:text-red-600 hover:bg-background-muted rounded-full transition-colors" title="Delete"><Trash2 className="h-4 w-4" /></button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr><td colSpan="3" className="text-center py-10 text-foreground-muted"><AlertCircle className="mx-auto h-12 w-12 text-foreground-muted/50" /><h3 className="mt-2 text-sm font-medium text-foreground">No master users found</h3><p className="mt-1 text-sm">Get started by creating a new master user.</p></td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
            <MasterUserModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSave} user={editingUser} loading={modalLoading} />
        </div>
    );
};

const MasterSidebar = ({ activeView, setActiveView, onLinkClick, theme, cycleTheme }) => {
    const navigate = useNavigate();
    const username = localStorage.getItem('username') || 'Master Admin';

    const handleLogout = () => {
        localStorage.clear();
        navigate('/login');
    };

    const NavItem = ({ item }) => (
        <button
            onClick={() => {
                setActiveView(item.view);
                onLinkClick && onLinkClick();
            }}
            className={`flex items-center px-4 py-2.5 text-sm font-medium rounded-lg transition-colors w-full text-left ${activeView === item.view
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-foreground-muted hover:bg-background-muted'
                }`}
        >
            <item.icon className={`h-5 w-5 mr-3 flex-shrink-0 transition-colors ${activeView === item.view ? 'text-primary-foreground' : item.color}`} />
            <span>{item.name}</span>
        </button>
    );

    return (
        <div className="flex flex-col h-full bg-card text-card-foreground">
            <div className="p-4 border-b border-border flex-shrink-0">
                <Link to="/master-admin" className="flex items-center gap-3">
                    <Sparkles className="h-7 w-7 text-primary" />
                    <span className="font-bold text-xl text-foreground">Master Panel</span>
                </Link>
            </div>
            <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto">
                {masterNavLinks.map((item) => (
                    <NavItem key={item.name} item={item} />
                ))}
                <div className="pt-4 mt-4 border-t border-border">
                    <NavItem item={{ name: 'Users', view: 'users', icon: Users, color: 'text-blue-500' }} />
                </div>
            </nav>
            <div className="p-4 border-t border-border flex-shrink-0">
                <div className="flex items-center justify-between">
                    <div className="flex items-center min-w-0">
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary flex-shrink-0">
                            {username.charAt(0).toUpperCase()}
                        </div>
                        <div className="ml-3 min-w-0">
                            <p className="text-sm font-semibold text-foreground truncate">{username}</p>
                            <p className="text-xs text-foreground-muted">Master Admin</p>
                        </div>
                    </div>
                    <button onClick={handleLogout} className="text-foreground-muted hover:text-red-600 ml-2 flex-shrink-0" title="Logout">
                        <LogOut className="h-5 w-5" />
                    </button>
                </div>
                <div className="mt-4 flex items-center justify-between capitalize">
                    <span className="text-sm text-foreground-muted">{theme} Mode</span>
                    <button
                        onClick={cycleTheme}
                        className="p-2 rounded-full hover:bg-background-muted text-foreground-muted"
                        title="Cycle Theme"
                    >
                        <Palette className="h-5 w-5" />
                    </button>
                </div>
            </div>
        </div>
    );
};

const DashboardView = ({ stats, loading, error }) => (
    <>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
            {stats.map((stat, index) => (
                <StatCard key={index} {...stat} />
            ))}
        </div>
    </>
);

const TenantsView = ({ tenants, loading, error, onDelete, onEdit, onProvisionClick, onViewDetails }) => {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredTenants = useMemo(() => {
        if (!searchTerm) return tenants;
        const lowercasedFilter = searchTerm.toLowerCase();
        return tenants.filter(tenant =>
            tenant.companyName.toLowerCase().includes(lowercasedFilter) ||
            tenant.tenantId.toLowerCase().includes(lowercasedFilter)
        );
    }, [tenants, searchTerm]);

    return (
        <>
            <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
                <h1 className="text-3xl font-bold text-foreground">Registered Tenants</h1>
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <input type="text" placeholder="Search by name or ID..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="input w-full sm:w-64 pr-10 bg-background-muted border-border" />
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-foreground-muted" />
                    </div>
                    <button onClick={onProvisionClick} className="btn-primary flex items-center gap-2"><PlusCircle size={18} /> New Tenant</button>
                </div>
            </div>
            <div className="bg-card text-card-foreground p-6 rounded-xl shadow-sm">
                {loading ? <div className="flex justify-center items-center h-40"><Loader className="h-8 w-8 animate-spin text-primary" /></div> : error ? <p className="text-red-500 text-center">{error}</p> : <TenantList tenants={filteredTenants} onDelete={onDelete} onEdit={onEdit} onViewDetails={onViewDetails} />}
            </div>
        </>
    );
};

const RequestsView = ({ requests, loading, error, onApprove, onReject }) => (
    <>
        <h1 className="text-3xl font-bold text-foreground">Pending Tenant Requests</h1>
        <div className="mt-6 bg-card text-card-foreground p-6 rounded-xl shadow-sm">
            {loading ? <div className="flex justify-center items-center h-40"><Loader className="h-8 w-8 animate-spin text-primary" /></div> : error ? <p className="text-red-500 text-center">{error}</p> : <TenantRequestList requests={requests} onApprove={onApprove} onReject={onReject} />}
        </div>
    </>
);

export const MasterAdminHeader = () => {
    const navigate = useNavigate();
    const username = localStorage.getItem('username') || 'Master Admin';

    const handleLogout = () => {
        localStorage.clear();
        navigate('/login');
    };

    return (
        <header className="bg-card text-card-foreground shadow-sm p-4 flex justify-between items-center">
            <div className="flex items-center gap-3">
                <div className="flex items-center gap-3">
                    <Sparkles className="h-7 w-7 text-primary" />
                    <span className="font-bold text-xl text-foreground">Master Panel</span>
                </div>
            </div>
            <div className="flex items-center gap-4">
                <p className="text-sm text-foreground-muted">Welcome, <span className="font-semibold">{username}</span></p>
                <button onClick={handleLogout} className="text-foreground-muted hover:text-red-600" title="Logout"><LogOut className="h-5 w-5" /></button>
            </div>
        </header>
    );
};

const StatCard = ({ icon: Icon, title, value, change, changeType }) => (
    <div className="bg-card text-card-foreground p-6 rounded-xl shadow-sm flex items-start justify-between">
        <div>
            <p className="text-sm font-medium text-foreground-muted">{title}</p>
            <p className="text-3xl font-bold text-foreground mt-1">{value}</p>
            {change && (
                <div className={`mt-2 flex items-center text-sm ${changeType === 'increase' ? 'text-green-600' : 'text-red-600'}`}>
                    {changeType === 'increase' ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                    <span>{change}</span>
                </div>
            )}
        </div>
        <div className="bg-primary/10 text-primary p-3 rounded-lg">
            <Icon className="h-6 w-6" />
        </div>
    </div>
);

const TenantCard = ({ tenant, onDelete, onEdit, onViewDetails }) => {
    const statusColor = tenant.status === 'ACTIVE' ? 'bg-green-500' : 'bg-red-500';
    return (
        <div className="bg-background-muted rounded-lg p-4 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow">
            <div>
                <div className="flex justify-between items-start">
                    <h3 className="font-bold text-foreground">{tenant.companyName}</h3>
                    <span className={`px-2 py-0.5 text-xs font-semibold rounded-full capitalize ${tenant.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {tenant.status.toLowerCase()}
                    </span>
                </div>
                <p className="text-sm text-foreground-muted font-mono">{tenant.tenantId}</p>
                <div className="mt-3 text-xs space-y-1 text-foreground-muted">
                    <p><span className="font-semibold">DB User:</span> {tenant.username}</p>
                    <p className="truncate"><span className="font-semibold">DB URL:</span> {tenant.jdbcUrl}</p>
                </div>
            </div>
            <div className="flex items-center justify-end gap-1 mt-4 pt-3 border-t border-border">
                <button onClick={() => onViewDetails(tenant)} className="p-2 text-foreground-muted hover:text-green-500 hover:bg-background rounded-full transition-colors" title={`View ${tenant.tenantId}`}>
                    <Eye className="h-4 w-4" />
                </button>
                <button onClick={() => onEdit(tenant)} className="p-2 text-foreground-muted hover:text-blue-500 hover:bg-background rounded-full transition-colors" title={`Edit ${tenant.tenantId}`}>
                    <Edit className="h-4 w-4" />
                </button>
                <button onClick={() => onDelete(tenant.tenantId)} className="p-2 text-foreground-muted hover:text-red-500 hover:bg-background rounded-full transition-colors" title={`Delete ${tenant.tenantId}`}>
                    <Trash2 className="h-4 w-4" />
                </button>
            </div>
        </div>
    );
};

const TenantList = ({ tenants, onDelete, onEdit, onViewDetails }) => {
    if (tenants.length === 0) {
        return (
            <div className="text-center py-16 text-foreground-muted">
                <Search className="mx-auto h-12 w-12 text-foreground-muted/50" />
                <h3 className="mt-2 text-sm font-medium text-foreground">No Tenants Found</h3>
                <p className="mt-1 text-sm">No tenants match your search criteria.</p>
            </div>
        );
    }
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {tenants.map(tenant => (
                <TenantCard key={tenant.id} tenant={tenant} onDelete={onDelete} onEdit={onEdit} onViewDetails={onViewDetails} />
            ))}
        </div>
    );
};

const TenantRequestList = ({ requests, onApprove, onReject }) => (
    <div className="overflow-x-auto">
        <table className="min-w-full">
            <thead className="bg-background-muted">
                <tr>
                    <th className="th-cell">Requested ID</th>
                    <th className="th-cell">Company Name</th>
                    <th className="th-cell">Admin Email</th>
                    <th className="th-cell">Admin Password</th>
                    <th className="th-cell">Actions</th>
                </tr>
            </thead>
            <tbody className="text-foreground-muted">
                {requests.length === 0 ? (
                    <tr>
                        <td colSpan="4" className="text-center py-10">No pending tenant requests.</td>
                    </tr>
                ) : (
                    requests.map(request => (
                        <tr key={request.id} className="border-b border-border hover:bg-background-muted">
                            <td className="td-cell font-medium text-foreground">{request.tenantId}</td>
                            <td className="td-cell">{request.companyName}</td>
                            <td className="td-cell">{request.adminEmail}</td>
                            <td className="td-cell">{request.adminPassword}</td>
                            <td className="py-3 px-4 flex items-center gap-2">
                                <button
                                    onClick={() => onApprove(request)}
                                    className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full hover:bg-green-200 transition-colors"
                                    title={`Approve ${request.tenantId}`}
                                >
                                    <Check className="h-3 w-3" /> Approve
                                </button>
                                <button
                                    onClick={() => onReject(request.id, request.tenantId)}
                                    className="flex items-center gap-1 px-3 py-1 bg-red-100 text-red-800 text-xs font-semibold rounded-full hover:bg-red-200 transition-colors"
                                    title={`Reject ${request.tenantId}`}
                                >
                                    <X className="h-3 w-3" /> Reject
                                </button>
                            </td>
                        </tr>
                    ))
                )}
            </tbody>
        </table>
    </div>
);

const MasterAdmin = () => {
    const [activeView, setActiveView] = useState('dashboard');
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [tenants, setTenants] = useState([]);
    const [tenantRequests, setTenantRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalLoading, setModalLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [viewingTenant, setViewingTenant] = useState(null);
    const [editingTenant, setEditingTenant] = useState(null);
    const [error, setError] = useState('');
    const API_URL = import.meta.env.VITE_API_BASE_URL;

    const themes = ['light', 'dark', 'greenish', 'blueish'];
    const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');

    useEffect(() => {
        const root = document.documentElement;
        themes.forEach(t => root.classList.remove(t));
        if (theme !== 'light') {
            root.classList.add(theme);
        }
        localStorage.setItem('theme', theme);
    }, [theme]);

    const cycleTheme = () => {
        const currentIndex = themes.indexOf(theme);
        const nextIndex = (currentIndex + 1) % themes.length;
        setTheme(themes[nextIndex]);
    };

    // Stats data
    const stats = useMemo(() => [
        { title: 'Active Tenants', value: tenants.length, icon: Building, change: '+2 this month', changeType: 'increase' },
        { title: 'Total Users', value: '1,420', icon: Users, change: '+5.1%', changeType: 'increase' },
        { title: 'Pending Requests', value: tenantRequests.length, icon: Activity, change: 'Needs review', changeType: 'decrease' },
        { title: 'System Status', value: 'Operational', icon: Server, change: 'All systems normal', changeType: 'increase' },
    ], [tenants.length, tenantRequests.length]);

    const fetchData = async () => {
        setLoading(true);
        setError('');
        try {
            const token = localStorage.getItem('token');
            const headers = { "Authorization": `Bearer ${token}` };

            const [tenantsRes, requestsRes] = await Promise.all([
                axios.get(`${API_URL}/master/tenants`, { headers }),
                axios.get(`${API_URL}/master/tenant-requests`, { headers })
            ]);

            setTenants(tenantsRes.data);
            setTenantRequests(requestsRes.data);
        } catch (err) {
            setError('Failed to fetch data. Please try again later.');
            console.error("Error fetching data:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [API_URL]);

    const handleDelete = async (tenantId) => {
        if (!window.confirm(`Are you sure you want to delete tenant "${tenantId}"? This action cannot be undone.`)) {
            return;
        }

        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${API_URL}/master/tenants/${tenantId}`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            setTenants(prevTenants => prevTenants.filter(tenant => tenant.tenantId !== tenantId));
        } catch (err) {
            setError(`Failed to delete tenant "${tenantId}". Please try again.`);
            console.error("Error deleting tenant:", err);
        }
    };

    const handleApprove = async (request) => {
        if (!window.confirm(`Are you sure you want to approve and create tenant "${request.tenantId}"?`)) {
            return;
        }
        // For approving, we just open the provisioning modal pre-filled with the request data.
        setFormDataForProvision(request);
        setIsModalOpen(true);
    };

    const handleReject = async (requestId, tenantId) => {
        if (!window.confirm(`Are you sure you want to reject the request for tenant "${tenantId}"?`)) {
            return;
        }

        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${API_URL}/master/tenant-requests/${requestId}`, { headers: { "Authorization": `Bearer ${token}` } });
            setTenantRequests(prev => prev.filter(r => r.id !== requestId));
        } catch (err) {
            setError(`Failed to reject tenant request for "${tenantId}". Please try again.`);
            console.error("Error rejecting tenant request:", err);
        }
    };

    const setFormDataForProvision = (request) => {
        setFormData({
            tenantId: request.tenantId,
            companyName: request.companyName,
            adminEmail: request.adminEmail,
            adminPassword: request.adminPassword,
            numberOfLocations: 1,
            numberOfUsers: 5,
            numberOfStore: 1,
            hrmsAccessCount: 5,
            subscriptionStartDate: new Date().toISOString().split('T')[0],
            subscriptionEndDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
        });
    };

    const handleProvision = async (payload) => {
        try {
            const token = localStorage.getItem('token');
            await axios.post(`${API_URL}/master/tenants/provision`, payload, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            alert(`Tenant "${payload.tenantId}" has been provisioned successfully!`);
            // If this provision came from a request, find and delete the request
            const approvedRequest = tenantRequests.find(r => r.tenantId === payload.tenantId);
            if (approvedRequest) {
                await axios.delete(`${API_URL}/master/tenant-requests/${approvedRequest.id}`, { headers: { "Authorization": `Bearer ${token}` } });
            }
            fetchData(); // Refresh data after provisioning
        } catch (err) {
            console.error('Tenant provisioning failed:', err);
            const errorMessage = err.response?.data?.message || `Failed to provision tenant. The ID "${payload.tenantId}" might already be taken.`;
            throw new Error(errorMessage);
        }
    };

    const handleUpdate = async (tenantId, detailsPayload, servicesPayload) => {
        setModalLoading(true);
        try {
            const token = localStorage.getItem('token');
            const headers = { "Authorization": `Bearer ${token}` };

            // Create an array of promises for the API calls
            const updatePromises = [];

            // 1. Update general subscription details
            // updatePromises.push(axios.put(`${API_URL}/master/tenants/${tenantId}`, detailsPayload, { headers }));

            // 2. Update service modules and admin roles
            updatePromises.push(axios.put(`${API_URL}/master/tenants/${tenantId}/services`, servicesPayload, { headers }));

            // Execute all promises
            await Promise.all(updatePromises);

        } catch (err) {
            console.error('Tenant update failed:', err);
            const errorMessage = err.response?.data?.message || `Failed to update tenant.`;
            throw new Error(errorMessage);
        }
    };

    const handleOpenUpdateModal = (tenant) => {
        setEditingTenant(tenant);
        setIsUpdateModalOpen(true);
    };

    const handleViewDetails = (tenant) => {
        setViewingTenant(tenant);
        setIsDetailsModalOpen(true);
    };

    const handleEditFromDetails = (tenant) => {
        setIsDetailsModalOpen(false);
        handleOpenUpdateModal(tenant);
    };

    const renderContent = () => {
        switch (activeView) {
            case 'dashboard':
                return <DashboardView stats={stats} loading={loading} error={error} />;
            case 'tenants':
                return <TenantsView tenants={tenants} loading={loading} error={error} onDelete={handleDelete} onEdit={handleOpenUpdateModal} onProvisionClick={() => setActiveView('provision')} onViewDetails={handleViewDetails} />;
            case 'requests':
                return <RequestsView requests={tenantRequests} loading={loading} error={error} onApprove={handleApprove} onReject={handleReject} />;
            case 'users':
                return <MasterUsers />;
            case 'provision':
                return <ProvisionTenant onProvision={handleProvision} onCancel={() => setActiveView('tenants')} />;
            default:
                return <DashboardView stats={stats} loading={loading} error={error} />;
        }
    };

    return (
        <div className="min-h-screen bg-background text-foreground">
            <div className="flex h-screen bg-background">
                {/* Static sidebar for desktop */}
                <div className="hidden lg:flex lg:flex-shrink-0">
                    <div className="flex flex-col w-64 border-r border-border">
                        <MasterSidebar activeView={activeView} setActiveView={setActiveView} theme={theme} cycleTheme={cycleTheme} />
                    </div>
                </div>

                <div className="flex-1 flex flex-col overflow-hidden">
                    {/* Top bar for mobile */}
                    <header className="lg:hidden sticky top-0 z-10 flex-shrink-0 flex h-16 bg-card shadow-sm">
                        <button type="button" className="px-4 border-r border-border text-foreground-muted focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary" onClick={() => setSidebarOpen(true)}>
                            <Menu className="h-6 w-6" />
                        </button>
                        <div className="flex-1 px-4 flex justify-between items-center">
                            <Link to="/master-admin" className="flex items-center gap-2">
                                <Sparkles className="h-6 w-6 text-primary" />
                                <span className="font-bold text-lg text-foreground">Master Panel</span>
                            </Link>
                        </div>
                    </header>

                    {/* Main content */}
                    <main className="flex-1 overflow-x-hidden overflow-y-auto p-6 md:p-8">
                        <div className="max-w-7xl mx-auto">
                            {renderContent()}
                        </div>
                    </main>
                </div>

                {/* Mobile menu overlay */}
                <AnimatePresence>
                    {sidebarOpen && (
                        <>
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="fixed top-0 left-0 h-full w-64 z-30"
                            >
                                <MasterSidebar activeView={activeView} setActiveView={setActiveView} onLinkClick={() => setSidebarOpen(false)} theme={theme} cycleTheme={cycleTheme} />
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>

                <UpdateTenantModal isOpen={isUpdateModalOpen} onClose={() => setIsUpdateModalOpen(false)} onUpdate={handleUpdate} tenant={editingTenant} isLoading={modalLoading} />
                <TenantDetailsModal isOpen={isDetailsModalOpen} onClose={() => setIsDetailsModalOpen(false)} tenant={viewingTenant} onEditClick={handleEditFromDetails} />
            </div>
        </div>
    );
}

export default MasterAdmin;
