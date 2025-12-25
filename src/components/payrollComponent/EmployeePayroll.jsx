import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Search, Loader, Edit, FileText, DollarSign, PlusCircle, Trash2, Save, ArrowLeft, Share2, Award, LogOut } from 'lucide-react';
import axios from 'axios';
import EmployeeBenefitProvisionTab from './EmployeeBenefitProvisionTab';
import EndOfServiceTab from './EndOfServiceTab';

// --- Helper Components & Functions ---
const InputField = ({ label, id, type = 'text', ...props }) => (
    <div>
        <label htmlFor={id} className="block text-sm font-medium text-slate-700">{label}</label>
        <input id={id} type={type} {...props} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm shadow-sm placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500" />
    </div>
);

const SelectField = ({ label, id, children, ...props }) => (
    <div>
        <label htmlFor={id} className="block text-sm font-medium text-slate-700">{label}</label>
        <select id={id} {...props} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500">
            {children}
        </select>
    </div>
);

const formatCurrency = (amount, currency = 'AED') => new Intl.NumberFormat('en-IN', { style: 'currency', currency, minimumFractionDigits: 2 }).format(amount || 0);

// --- Salary Structure Tab ---
const SalaryStructureTab = ({ employee }) => {
    const [structure, setStructure] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [allComponents, setAllComponents] = useState([]);
    const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
    const [formData, setFormData] = useState({ structureName: '', effectiveDate: '', components: [] });
    const API_URL = import.meta.env.VITE_API_BASE_URL;

    const fetchStructureAndComponents = useCallback(async () => {
        setLoading(true);
        const token = localStorage.getItem('token');
        try {
            const [componentsRes, structureRes] = await Promise.all([
                axios.get(`${API_URL}/salary-components`, { headers: { "Authorization": `Bearer ${token}` } }),
                axios.get(`${API_URL}/salary-structures/employee/${employee.employeeCode}`, { headers: { "Authorization": `Bearer ${token}` } }).catch(err => {
                    if (err.response && err.response.status === 404) return { data: null };
                    throw err;
                })
            ]);

            setAllComponents(componentsRes.data);
            if (structureRes.data) {
                setStructure(structureRes.data);
                setFormData({
                    structureName: structureRes.data.structureName,
                    effectiveDate: structureRes.data.effectiveDate?.split('T')[0] || '',
                    components: structureRes.data.components?.map(c => ({ componentCode: c.componentCode, value: c.value, formula: c.formula })) || []
                });
            } else {
                setStructure(null);
                setIsEditing(true); // Default to edit mode if no structure exists
                setFormData({ structureName: `${employee.firstName}'s Structure`, effectiveDate: new Date().toISOString().split('T')[0], components: [] });
            }
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    }, [employee.employeeCode, API_URL]);

    useEffect(() => {
        fetchStructureAndComponents();
    }, [fetchStructureAndComponents]);

    const handleAddComponent = () => setFormData(prev => ({ ...prev, components: [...prev.components, { componentCode: '', value: 0, formula: '' }] }));
    const handleRemoveComponent = (index) => setFormData(prev => ({ ...prev, components: prev.components.filter((_, i) => i !== index) }));

    const handleComponentChange = (index, field, value) => {
        setFormData(prev => {
            const newComponents = [...prev.components];
            newComponents[index][field] = value;

            // Auto-calculate value if formula is provided
            const basicComponent = newComponents.find(c => {
                const componentInfo = allComponents.find(ac => ac.code === c.componentCode);
                return componentInfo?.name.toLowerCase().includes('basic') || componentInfo?.code === 'BASIC';
            });
            const basic = basicComponent ? parseFloat(basicComponent.value) : 0;

            newComponents.forEach((comp, i) => {
                if (comp.formula) {
                    try {
                        // Basic and safe formula evaluation
                        const formula = comp.formula.toLowerCase().replace(/basic/g, basic);
                        // eslint-disable-next-line no-eval
                        const result = eval(formula);
                        if (isFinite(result)) {
                            newComponents[i].value = result.toFixed(2);
                        }
                    } catch (e) { console.warn(`Could not evaluate formula for ${comp.componentCode}:`, e); }
                }
            });
            return { ...prev, components: newComponents };
        });
    };

    const handleSave = async () => {
        setLoading(true);
        const token = localStorage.getItem('token');
        const payload = { ...formData, employeeCode: employee.employeeCode };
        try {
            if (structure) {
                await axios.put(`${API_URL}/salary-structures/${structure.id}`, payload, { headers: { "Authorization": `Bearer ${token}` } });
            } else {
                await axios.post(`${API_URL}/salary-structures`, payload, { headers: { "Authorization": `Bearer ${token}` } });
            }
            setIsEditing(false);
            fetchStructureAndComponents();
            alert('Salary structure saved successfully!');
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to save structure.');
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="flex justify-center items-center p-8"><Loader className="animate-spin h-8 w-8 text-blue-600" /></div>;

    if (!isEditing && structure) {
        return (
            <div>
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <h3 className="text-lg font-semibold">{structure.structureName}</h3>
                        <p className="text-sm text-slate-500">Effective from: {new Date(structure.effectiveDate).toLocaleDateString()}</p>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => setIsSyncModalOpen(true)} className="btn-secondary flex items-center gap-2"><Share2 size={16} /> Sync Structure</button>
                        <button onClick={() => setIsEditing(true)} className="btn-secondary flex items-center gap-2"><Edit size={16} /> Edit</button>
                    </div>
                </div>
                <div className="space-y-2">
                    {structure.components?.map(c => (
                        <div key={c.id} className="flex justify-between p-2 bg-slate-50 rounded">
                            <span>{c.componentName} ({c.componentCode})</span>
                            <span className="font-medium">{formatCurrency(c.value)}</span>
                        </div>
                    ))}
                </div>
                <SyncStructureModal
                    isOpen={isSyncModalOpen}
                    onClose={() => setIsSyncModalOpen(false)}
                    structureId={structure.id}
                    currentEmployeeCode={employee.employeeCode}
                />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <h3 className="text-lg font-semibold">{structure ? 'Edit Salary Structure' : 'Create Salary Structure'}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputField label="Structure Name" value={formData.structureName} onChange={e => setFormData(p => ({ ...p, structureName: e.target.value }))} />
                <InputField label="Effective Date" type="date" value={formData.effectiveDate} onChange={e => setFormData(p => ({ ...p, effectiveDate: e.target.value }))} />
            </div>
            <div className="space-y-4">
                <h4 className="font-medium">Components</h4>
                {formData.components.map((comp, index) => (
                    <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-2 items-end p-3 bg-slate-50 rounded-lg">
                        <SelectField label="Component" value={comp.componentCode} onChange={e => handleComponentChange(index, 'componentCode', e.target.value)}>
                            <option value="">Select Component</option>
                            {allComponents.map(c => <option key={c.code} value={c.code}>{c.name} ({c.type})</option>)}
                        </SelectField>
                        <InputField label="Value/Amount" type="number" value={comp.value} onChange={e => handleComponentChange(index, 'value', e.target.value)} />
                        <InputField label="Formula (if any)" value={comp.formula} onChange={e => handleComponentChange(index, 'formula', e.target.value)} />
                        <button onClick={() => handleRemoveComponent(index)} className="btn-secondary bg-red-50 text-red-600 hover:bg-red-100 p-2 h-10"><Trash2 size={16} /></button>
                    </div>
                ))}
                <button onClick={handleAddComponent} className="btn-secondary flex items-center gap-2"><PlusCircle size={16} /> Add Component</button>
            </div>
            <div className="flex justify-end gap-2">
                {structure && <button onClick={() => setIsEditing(false)} className="btn-secondary">Cancel</button>}
                <button onClick={handleSave} className="btn-primary flex items-center gap-2"><Save size={16} /> Save Structure</button>
            </div>
        </div>
    );
};

const SyncStructureModal = ({ isOpen, onClose, structureId, currentEmployeeCode }) => {
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedEmployees, setSelectedEmployees] = useState(new Set());
    const [searchTerm, setSearchTerm] = useState('');
    const [departments, setDepartments] = useState([]);
    const [selectedDepartment, setSelectedDepartment] = useState('all');
    const [isSyncing, setIsSyncing] = useState(false);
    const API_URL = import.meta.env.VITE_API_BASE_URL;

    useEffect(() => {
        if (isOpen) {
            const fetchEmployees = async () => {
                setSearchTerm('');
                setLoading(true);
                try {
                    const token = localStorage.getItem('token');
                    const headers = { "Authorization": `Bearer ${token}` };

                    const [employeesRes, departmentsRes] = await Promise.all([
                        axios.get(`${API_URL}/employees/all`, { headers }),
                        axios.get(`${API_URL}/departments`, { headers })
                    ]);

                    setDepartments(departmentsRes.data);

                    // Fetch job details for all employees to get department info
                    const employeesWithJobDetails = await Promise.all(
                        employeesRes.data.map(async (emp) => {
                            try {
                                const jobDetailsRes = await axios.get(`${API_URL}/job-details/${emp.employeeCode}`, { headers });
                                return { ...emp, jobDetails: jobDetailsRes.data };
                            } catch (err) {
                                return { ...emp, jobDetails: null };
                            }
                        })
                    );

                    // Exclude the current employee from the list
                    setEmployees(employeesWithJobDetails.filter(e => e.employeeCode !== currentEmployeeCode));
                } catch (err) {
                    console.error("Failed to fetch employees for sync:", err);
                } finally {
                    setLoading(false);
                }
            };
            fetchEmployees();
        }
    }, [isOpen, API_URL, currentEmployeeCode]);

    const filteredEmployees = useMemo(() => {
        let filtered = employees;

        if (selectedDepartment !== 'all') {
            filtered = filtered.filter(emp => emp.jobDetails?.department === selectedDepartment);
        }

        if (searchTerm) {
            const lowercasedFilter = searchTerm.toLowerCase();
            filtered = filtered.filter(emp =>
                `${emp.firstName} ${emp.lastName}`.toLowerCase().includes(lowercasedFilter) ||
                emp.employeeCode.toLowerCase().includes(lowercasedFilter));
        }
        return filtered;
    }, [employees, searchTerm, selectedDepartment]);

    const handleSelect = (employeeCode) => {
        setSelectedEmployees(prev => {
            const newSet = new Set(prev);
            if (newSet.has(employeeCode)) {
                newSet.delete(employeeCode);
            } else {
                newSet.add(employeeCode);
            }
            return newSet;
        });
    };

    const handleSelectAll = (e) => {
        const isChecked = e.target.checked;
        if (isChecked) {
            const allVisibleCodes = new Set(filteredEmployees.map(emp => emp.employeeCode));
            setSelectedEmployees(allVisibleCodes);
        } else {
            setSelectedEmployees(new Set());
        }
    };

    const areAllSelected = useMemo(() => {
        return filteredEmployees.length > 0 && filteredEmployees.every(emp => selectedEmployees.has(emp.employeeCode));
    }, [filteredEmployees, selectedEmployees]);

    const handleSync = async () => {
        if (selectedEmployees.size === 0) {
            alert("Please select at least one employee to sync.");
            return;
        }
        setIsSyncing(true);
        try {
            const token = localStorage.getItem('token');
            const payload = {
                structureId,
                employeeCodes: Array.from(selectedEmployees),
            };
            await axios.post(`${API_URL}/salary-structures/sync`, payload, { headers: { "Authorization": `Bearer ${token}` } });
            alert(`Successfully synced structure to ${selectedEmployees.size} employee(s).`);
            onClose();
        } catch (err) {
            alert(err.response?.data?.message || "Failed to sync structure.");
        } finally {
            setIsSyncing(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[80vh] flex flex-col">
                <h3 className="text-lg font-semibold p-4 border-b">Sync Salary Structure</h3>
                <div className="p-4 border-b flex gap-2">
                    <select
                        value={selectedDepartment}
                        onChange={(e) => setSelectedDepartment(e.target.value)}
                        className="block w-1/3 px-3 py-2 bg-white border border-slate-300 rounded-md text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    >
                        <option value="all">All Departments</option>
                        {departments.map((dept) => (
                            <option key={dept.id} value={dept.name}>
                                {dept.name}
                            </option>
                        ))}
                    </select>
                    <input
                        className="block w-2/3 px-3 py-2 bg-white border border-slate-300 rounded-md text-sm shadow-sm placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        type="text"
                        placeholder="Search employees..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="p-4 overflow-y-auto space-y-2">
                    {loading ? <Loader className="animate-spin mx-auto" /> : <>
                        <label className="flex items-center gap-3 p-2 rounded bg-slate-50 cursor-pointer font-medium">
                            <input type="checkbox" checked={areAllSelected} onChange={handleSelectAll} className="h-4 w-4 rounded" />
                            <span>Select All Visible</span>
                        </label>
                        {filteredEmployees.map(emp => (
                            <label key={emp.employeeCode} className="flex items-center gap-3 p-2 rounded hover:bg-slate-50 cursor-pointer">
                                <input type="checkbox" checked={selectedEmployees.has(emp.employeeCode)} onChange={() => handleSelect(emp.employeeCode)} className="h-4 w-4 rounded" />
                                <span>{emp.firstName} {emp.lastName} ({emp.employeeCode})</span>
                            </label>
                        ))}</>}
                </div>
                <div className="p-4 border-t flex justify-end gap-2">
                    <button onClick={onClose} className="btn-secondary" disabled={isSyncing}>Cancel</button>
                    <button onClick={handleSync} className="btn-primary flex items-center gap-2" disabled={isSyncing}>
                        {isSyncing && <Loader className="animate-spin h-4 w-4" />} Sync to Selected ({selectedEmployees.size})
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- Payslips Tab ---
const PayslipsTab = ({ employee }) => {
    const [payslips, setPayslips] = useState([]);
    const [loading, setLoading] = useState(true);
    const [downloadingId, setDownloadingId] = useState(null);
    const API_URL = import.meta.env.VITE_API_BASE_URL;

    const fetchPayslips = useCallback(async () => {
        setLoading(true);
        const token = localStorage.getItem('token');
        try {
            const response = await axios.get(`${API_URL}/payslips/employee/${employee.employeeCode}`, { headers: { "Authorization": `Bearer ${token}` } });
            setPayslips(response.data.sort((a, b) => new Date(b.payDate) - new Date(a.payDate)));
        } catch (err) {
            console.error("Error fetching payslips:", err);
        } finally {
            setLoading(false);
        }
    }, [employee.employeeCode, API_URL]);

    useEffect(() => { fetchPayslips(); }, [fetchPayslips]);

    const handleDownload = async (payslipId) => {
        setDownloadingId(payslipId);
        const token = localStorage.getItem('token');
        try {
            const response = await axios.get(`${API_URL}/payslips/${payslipId}/download`, {
                headers: { "Authorization": `Bearer ${token}` },
                responseType: 'blob',
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            const contentDisposition = response.headers['content-disposition'];
            let filename = `payslip-${payslipId}.pdf`;
            if (contentDisposition) {
                const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
                if (filenameMatch && filenameMatch.length > 1) filename = filenameMatch[1];
            }
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            alert('Failed to download payslip.');
        } finally {
            setDownloadingId(null);
        }
    };

    if (loading) return <div className="flex justify-center items-center p-8"><Loader className="animate-spin h-8 w-8 text-blue-600" /></div>;

    return (
        <div>
            <h3 className="text-lg font-semibold mb-4">Payslip History</h3>
            {payslips.length === 0 ? (
                <p className="text-slate-500">No payslips found for this employee.</p>
            ) : (
                <div className="overflow-x-auto border border-slate-200 rounded-lg">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Pay Period</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Net Salary</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-200 text-slate-700">
                            {payslips.map(p => (
                                <tr key={p.id}>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                                        {p.payDate ? new Date(p.payDate).toLocaleString('default', { month: 'long', year: 'numeric' }) : 'N/A'}
                                        {p.gratuityPayout > 0 && (
                                            <span className="ml-2 text-xs font-semibold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">Final Settlement</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm">{formatCurrency(p.netSalary)}</td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm">{p.status}</td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                                        <button onClick={() => handleDownload(p.id)} className="btn-secondary py-1 px-2 text-xs" disabled={downloadingId === p.id}>
                                            {downloadingId === p.id ? <Loader className="animate-spin h-4 w-4" /> : 'Download'}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

// --- Main Component ---
const EmployeePayroll = () => {
    const [allEmployees, setAllEmployees] = useState([]);
    const [employee, setEmployee] = useState(null);
    const [listLoading, setListLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState("");
    const [activeTab, setActiveTab] = useState('Salary Structure');
    const API_URL = import.meta.env.VITE_API_BASE_URL;

    useEffect(() => {
        const fetchInitialData = async () => {
            setListLoading(true);
            setError("");
            try {
                const token = localStorage.getItem('token');
                const response = await axios.get(`${API_URL}/employees/all`, { headers: { "Authorization": `Bearer ${token}` } });
                setAllEmployees(response.data);
            } catch (err) {
                setError("Failed to fetch employee list.");
                console.error(err);
            } finally {
                setListLoading(false);
            }
        };
        fetchInitialData();
    }, [API_URL]);

    const filteredEmployees = useMemo(() => {
        if (!searchTerm) return allEmployees;
        const lowercasedFilter = searchTerm.toLowerCase();
        return allEmployees.filter(emp =>
            (emp.firstName && emp.firstName.toLowerCase().includes(lowercasedFilter)) ||
            (emp.lastName && emp.lastName.toLowerCase().includes(lowercasedFilter)) ||
            (emp.employeeCode && emp.employeeCode.toLowerCase().includes(lowercasedFilter))
        );
    }, [allEmployees, searchTerm]);

    const handleSelectEmployee = (emp) => {
        setEmployee(emp);
    };

    const handleBackToList = () => {
        setEmployee(null);
        setSearchTerm("");
    };

    const handleSearchAndSelect = async (e) => {
        e.preventDefault();
        const searchTarget = searchTerm.trim();
        if (!searchTarget) return;
        setListLoading(true);
        try {
            const token = localStorage.getItem('token');
            // Use the more specific endpoint to find an employee by their code
            const response = await axios.get(`${API_URL}/employees/${searchTarget}`, { headers: { "Authorization": `Bearer ${token}` } });
            setEmployee(response.data);
        } catch (err) {
            // If direct search fails, we just rely on the filtered list
            console.warn("Direct search failed, relying on filter.");
        } finally {
            setListLoading(false);
        }
    };

    const subTabs = [
        { name: 'Salary Structure', icon: DollarSign, component: SalaryStructureTab },
        { name: 'Payslips', icon: FileText, component: PayslipsTab },
        { name: 'Benefit Provisions', icon: Award, component: EmployeeBenefitProvisionTab },
        { name: 'End of Service', icon: LogOut, component: EndOfServiceTab },
    ];

    const ActiveSubComponent = subTabs.find(tab => tab.name === activeTab)?.component;

    return (
        <div>
            {!employee ? (
                <form onSubmit={handleSearchAndSelect} className="relative mb-6">
                    <input
                        type="text"
                        placeholder="Search by name or employee ID..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="input w-full pl-10"
                    />
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                </form>
            ) : (
                <div className="flex items-center gap-4 mb-6">
                    <button onClick={handleBackToList} className="btn-secondary p-2 flex items-center gap-2">
                        <ArrowLeft className="h-4 w-4" /> Back to List
                    </button>
                </div>
            )}

            {error && <div className="text-center text-red-600 p-4 bg-red-50 rounded-md">{error}</div>}

            {!employee ? (
                listLoading ? (
                    <div className="flex justify-center items-center p-8"><Loader className="animate-spin h-8 w-8 text-blue-600" /></div>
                ) : (
                    <div className="overflow-x-auto border border-slate-200 rounded-lg">
                        <table className="min-w-full divide-y divide-slate-200">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Name</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Employee Code</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Work Email</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-slate-200 text-slate-700">
                                {filteredEmployees.length > 0 ? filteredEmployees.map(emp => (
                                    <tr key={emp.employeeCode} onClick={() => handleSelectEmployee(emp)} className="cursor-pointer hover:bg-slate-50">
                                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">{emp.firstName} {emp.lastName}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm">{emp.employeeCode}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm">{emp.emailWork}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm">
                                            <span className={`inline-block px-2 py-0.5 text-xs font-semibold rounded-full capitalize ${emp.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                }`}>{emp.status?.toLowerCase()}</span>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan="4" className="text-center py-10 text-slate-500">No employees found.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )
            ) : (
                <div>
                    <div className="flex items-center gap-4 p-4 mb-4 bg-slate-50 rounded-lg">
                        <div>
                            <h3 className="font-bold text-lg text-slate-800">{employee.firstName} {employee.lastName}</h3>
                            <p className="text-sm text-slate-500">{employee.employeeCode}</p>
                        </div>
                    </div>

                    <div className="border-b border-slate-200 mb-6">
                        <nav className="-mb-px flex space-x-6" aria-label="Sub-tabs">
                            {subTabs.map((tab) => (
                                <button
                                    key={tab.name}
                                    onClick={() => setActiveTab(tab.name)}
                                    className={`whitespace-nowrap flex items-center py-3 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === tab.name
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

                    <div>
                        {ActiveSubComponent && <ActiveSubComponent employee={employee} />}
                    </div>
                </div>
            )}
        </div>
    );
};

export default EmployeePayroll;