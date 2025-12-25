import React, { useState } from 'react';
import { Loader, Check, ArrowLeft } from 'lucide-react';

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
    { value: 'PURCHASE', label: 'Purchase' },
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

const InputField = ({ label, ...props }) => (
    <div>
        <label htmlFor={props.name} className="block text-sm font-medium text-foreground-muted">{label}</label>
        <input id={props.name} {...props} className="input bg-background-muted border-border text-foreground placeholder-foreground-muted/70" />
    </div>
);

const ProvisionTenant = ({ onProvision, onCancel }) => {
    const [formData, setFormData] = useState({
        tenantId: '',
        companyName: '',
        adminEmail: '',
        adminPassword: '',
        numberOfLocations: 1,
        numberOfUsers: 5,
        numberOfStore: 1,
        hrmsAccessCount: 5,
        subscriptionStartDate: new Date().toISOString().split('T')[0],
        subscriptionEndDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
    });
    const [selectedModules, setSelectedModules] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedRoles, setSelectedRoles] = useState([]);
    const [error, setError] = useState('');

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleModuleChange = (e) => {
        const { value, checked } = e.target;
        setSelectedModules(prev => checked ? [...prev, value] : prev.filter(m => m !== value));
    };

    const handleRoleChange = (e) => {
        setSelectedRoles(Array.from(e.target.selectedOptions, option => option.value));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (selectedRoles.length === 0) {
            setError('You must select at least one admin role.');
            return;
        }
        setIsLoading(true);
        setError('');
        const payload = { ...formData, serviceModules: selectedModules, adminRoles: selectedRoles };
        try {
            await onProvision(payload);
        } catch (err) {
            setError(err.message || 'An error occurred during provisioning.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-card text-card-foreground p-6 rounded-xl shadow-sm">
            <div className="flex items-center gap-4 mb-6">
                <button onClick={onCancel} className="p-2 rounded-full hover:bg-background-muted">
                    <ArrowLeft size={20} />
                </button>
                <h1 className="text-2xl font-bold text-foreground">Provision New Tenant</h1>
            </div>
            <form onSubmit={handleSubmit}>
                <div className="space-y-6">
                    <h4 className="text-md font-semibold text-foreground-muted border-b border-border pb-2">Tenant & Admin Details</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <InputField label="Tenant ID" name="tenantId" value={formData.tenantId} onChange={handleChange} placeholder="e.g., my-company" required />
                        <InputField label="Company Name" name="companyName" value={formData.companyName} onChange={handleChange} placeholder="e.g., My Awesome Company" required />
                        <InputField label="Admin Email" name="adminEmail" type="email" value={formData.adminEmail} onChange={handleChange} placeholder="e.g., admin@mycompany.com" required />
                        <InputField label="Admin Password" name="adminPassword" type="password" value={formData.adminPassword} onChange={handleChange} placeholder="A secure password for the tenant admin" required />
                    </div>

                    <h4 className="text-md font-semibold text-foreground-muted border-b border-border pb-2 pt-4">Subscription Details</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <InputField label="Locations" name="numberOfLocations" type="number" value={formData.numberOfLocations} onChange={handleChange} required min="1" />
                        <InputField label="Users" name="numberOfUsers" type="number" value={formData.numberOfUsers} onChange={handleChange} required min="1" />
                        <InputField label="Stores" name="numberOfStore" type="number" value={formData.numberOfStore} onChange={handleChange} required min="1" />
                        <InputField label="HRMS Access" name="hrmsAccessCount" type="number" value={formData.hrmsAccessCount} onChange={handleChange} required min="1" />
                        <InputField label="Start Date" name="subscriptionStartDate" type="date" value={formData.subscriptionStartDate} onChange={handleChange} required />
                        <InputField label="End Date" name="subscriptionEndDate" type="date" value={formData.subscriptionEndDate} onChange={handleChange} required />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                        <div>
                            <label className="block text-sm font-medium text-foreground-muted">Service Modules</label>
                            <div className="mt-2 space-y-2">{serviceModulesOptions.map(module => (<label key={module.value} className="flex items-center gap-2"><input type="checkbox" value={module.value} onChange={handleModuleChange} className="h-4 w-4 rounded border-border text-primary focus:ring-primary" /><span>{module.label}</span></label>))}</div>
                        </div>
                        <div>
                            <label htmlFor="adminRoles" className="block text-sm font-medium text-foreground-muted">Admin Roles</label>
                            <select id="adminRoles" multiple value={selectedRoles} onChange={handleRoleChange} className="input bg-background-muted border-border text-foreground" size={5}><option disabled value="">Select roles...</option>{adminRoleOptions.map(role => (<option key={role.value} value={role.value}>{role.label}</option>))}</select>
                            <p className="mt-1 text-xs text-foreground-muted">Hold Ctrl (or Cmd on Mac) to select multiple roles.</p>
                        </div>
                    </div>

                    {error && <p className="text-sm text-red-500 text-center">{error}</p>}
                </div>
                <div className="flex justify-end gap-2 pt-8">
                    <button type="button" onClick={onCancel} className="btn-secondary" disabled={isLoading}>Cancel</button>
                    <button type="submit" className="btn-primary flex items-center w-40 justify-center" disabled={isLoading}>{isLoading ? <Loader className="animate-spin h-4 w-4" /> : <><Check className="h-4 w-4 mr-2" />Provision Tenant</>}</button>
                </div>
            </form>
        </div>
    );
};

export default ProvisionTenant;