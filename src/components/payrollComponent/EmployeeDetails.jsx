import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Banknote, HandCoins, Receipt, Search, Loader, Edit, Check, X, ArrowLeft, Eye, Trash2 } from 'lucide-react';
import axios from 'axios';

// --- Helper Components ---
const InputField = ({ label, id, ...props }) => (
    <div>
        <label htmlFor={id} className="block text-sm font-medium text-slate-700">{label}</label>
        <input id={id} {...props} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm shadow-sm placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500" />
    </div>
);

const InfoDisplay = ({ label, value }) => (
    <div>
        <p className="text-sm text-slate-500">{label}</p>
        <p className="font-medium text-slate-800">{value || <span className="text-slate-400">N/A</span>}</p>
    </div>
);

const statusStyles = {
    SUBMITTED: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
    APPROVED: { bg: 'bg-green-100', text: 'text-green-800' },
    REJECTED: { bg: 'bg-red-100', text: 'text-red-800' },
    ACTIVE: { bg: 'bg-blue-100', text: 'text-blue-800' },
    COMPLETED: { bg: 'bg-gray-100', text: 'text-gray-800' },
};

// --- Bank Account Tab ---
const BankAccountTab = ({ employee }) => {
    const [account, setAccount] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saveLoading, setSaveLoading] = useState(false);
    const [error, setError] = useState('');
    const API_URL = import.meta.env.VITE_API_BASE_URL;

    const initialFormData = {
        bankName: '', accountNumber: '', ifscCode: '', iban: '', accountHolderName: '', routingCode: '', primary: true
    };
    const [formData, setFormData] = useState(initialFormData);

    const fetchAccount = useCallback(() => {
        setLoading(true);
        setError('');
        const token = localStorage.getItem('token');
        axios.get(`${API_URL}/employee-bank-accounts/${employee.employeeCode}`, { headers: { "Authorization": `Bearer ${token}` } })
            .then(response => {
                setAccount(response.data);
                setFormData(response.data);
            })
            .catch(err => {
                if (err.response && err.response.status === 404) {
                    setAccount(null);
                    setFormData(initialFormData);
                } else {
                    setError('Failed to load bank account details.');
                }
            })
            .finally(() => setLoading(false));
    }, [API_URL, employee.employeeCode]);

    useEffect(() => {
        fetchAccount();
    }, [fetchAccount]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setSaveLoading(true);
        const token = localStorage.getItem('token');
        axios.put(`${API_URL}/employee-bank-accounts/${employee.employeeCode}`, formData, { headers: { "Authorization": `Bearer ${token}` } })
            .then(response => {
                setAccount(response.data);
                setFormData(response.data);
                setIsEditing(false);
                alert('Bank account details saved successfully!');
            })
            .catch(err => {
                alert(err.response?.data?.message || 'Failed to save bank account details.');
            })
            .finally(() => setSaveLoading(false));
    };

    if (loading) {
        return <div className="flex justify-center items-center p-8"><Loader className="animate-spin h-8 w-8 text-blue-600" /></div>;
    }

    if (error) {
        return <div className="text-center text-red-600 p-4 bg-red-50 rounded-md">{error}</div>;
    }

    if (!isEditing && !account) {
        return (
            <div className="text-center py-10 border-2 border-dashed border-slate-300 rounded-lg">
                <h3 className="text-sm font-medium text-slate-900">No Bank Account Found</h3>
                <p className="mt-1 text-sm text-slate-500">Add bank account details for this employee.</p>
                <div className="mt-6">
                    <button onClick={() => setIsEditing(true)} className="btn-primary">Add Account Details</button>
                </div>
            </div>
        );
    }

    return (
        <div>
            {!isEditing && (
                <div className="flex justify-end mb-4">
                    <button onClick={() => setIsEditing(true)} className="btn-secondary flex items-center gap-2"><Edit size={16} /> Edit</button>
                </div>
            )}
            {isEditing ? (
                <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
                    <InputField label="Bank Name" name="bankName" value={formData.bankName} onChange={handleChange} required />
                    <InputField label="Account Holder Name" name="accountHolderName" value={formData.accountHolderName} onChange={handleChange} required />
                    <InputField label="Account Number" name="accountNumber" value={formData.accountNumber} onChange={handleChange} required />
                    <InputField label="IFSC Code" name="ifscCode" value={formData.ifscCode} onChange={handleChange} required />
                    <InputField label="Account Number" name="accountNumber" value={formData.accountNumber} onChange={handleChange} required />
                    <InputField label="IFSC Code" name="ifscCode" value={formData.ifscCode} onChange={handleChange} required />
                    <InputField label="IBAN" name="iban" value={formData.iban} onChange={handleChange} />
                    <InputField label="Routing Code / Agent ID" name="routingCode" value={formData.routingCode} onChange={handleChange} />
                    <div className="flex items-center">
                        <input type="checkbox" id="isPrimary" name="primary" checked={formData.primary} onChange={handleChange} className="h-4 w-4" />
                        <label htmlFor="isPrimary" className="ml-2 text-sm">Set as primary account</label>
                    </div>
                    <div className="flex justify-end gap-2">
                        <button type="button" onClick={() => setIsEditing(false)} className="btn-secondary" disabled={saveLoading}>Cancel</button>
                        <button type="submit" className="btn-primary flex items-center" disabled={saveLoading}>
                            {saveLoading && <Loader className="animate-spin h-4 w-4 mr-2" />} Save
                        </button>
                    </div>
                </form>
            ) : (
                <div className="space-y-4 max-w-lg">
                    <InfoDisplay label="Bank Name" value={account.bankName} />
                    <InfoDisplay label="Account Holder Name" value={account.accountHolderName} />
                    <InfoDisplay label="Account Number" value={account.accountNumber} />
                    <InfoDisplay label="IFSC Code" value={account.ifscCode} />
                    <InfoDisplay label="Account Number" value={account.accountNumber} />
                    <InfoDisplay label="IFSC Code" value={account.ifscCode} />
                    <InfoDisplay label="IBAN" value={account.iban} />
                    <InfoDisplay label="Routing Code / Agent ID" value={account.routingCode} />
                    <InfoDisplay label="Primary Account" value={account.primary ? 'Yes' : 'No'} />
                </div>
            )}
        </div>
    );
};

// --- Loans Tab ---
const LoansTab = ({ employee }) => {
    const [loans, setLoans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [viewingReceipt, setViewingReceipt] = useState(null);
    const API_URL = import.meta.env.VITE_API_BASE_URL;

    const fetchLoans = useCallback(() => {
        setLoading(true);
        const token = localStorage.getItem('token');
        axios.get(`${API_URL}/employee-loans/employee/${employee.employeeCode}`, { headers: { "Authorization": `Bearer ${token}` } })
            .then(res => setLoans(res.data))
            .catch(err => console.error("Error fetching loans:", err))
            .finally(() => setLoading(false));
    }, [API_URL, employee.employeeCode]);

    useEffect(() => { fetchLoans(); }, [fetchLoans]);

    const handleAction = async (loanId, action) => {
        if (!window.confirm(`Are you sure you want to ${action} this loan?`)) return;
        try {
            const token = localStorage.getItem('token');
            await axios.put(`${API_URL}/employee-loans/${loanId}/${action}`, {}, { headers: { "Authorization": `Bearer ${token}` } });
            fetchLoans();
        } catch (err) {
            alert(`Failed to ${action} loan.`);
        }
    };

    if (loading) return <div className="flex justify-center items-center p-8"><Loader className="animate-spin h-8 w-8 text-blue-600" /></div>;

    return (
        <div>
            <h3 className="text-lg font-semibold mb-4">Loan History</h3>
            <div className="overflow-x-auto border border-slate-200 rounded-lg">
                <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                        <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Product</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Amount</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">EMI</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Installments</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200 text-slate-700">
                        {loans.length > 0 ? loans.map(loan => (
                            <tr key={loan.id}>
                                <td className="px-4 py-3 whitespace-nowrap text-sm">{loan.loanProductName}</td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm">{loan.loanAmount}</td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm">{loan.emiAmount}</td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm">{loan.remainingInstallments}/{loan.totalInstallments}</td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${statusStyles[loan.status]?.bg || 'bg-slate-100'} ${statusStyles[loan.status]?.text || 'text-slate-800'}`}>
                                        {loan.status.toLowerCase()}
                                    </span>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm">
                                    {loan.status === 'SUBMITTED' && (
                                        <div className="flex gap-2">
                                            <button onClick={() => handleAction(loan.id, 'approve')} className="text-green-600 hover:underline text-xs">Approve</button>
                                            <button onClick={() => handleAction(loan.id, 'reject')} className="text-red-600 hover:underline text-xs">Reject</button>
                                        </div>
                                    )}
                                </td>
                            </tr>
                        )) : (
                            <tr><td colSpan="6" className="text-center py-10 text-slate-500">No loan history found.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// --- Expenses Tab ---
const ExpensesTab = ({ employee }) => {
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [viewingReceipt, setViewingReceipt] = useState(null);
    const API_URL = import.meta.env.VITE_API_BASE_URL;

    const fetchExpenses = useCallback(() => {
        setLoading(true);
        const token = localStorage.getItem('token');
        axios.get(`${API_URL}/expenses/employee/${employee.employeeCode}`, { headers: { "Authorization": `Bearer ${token}` } })
            .then(res => setExpenses(res.data))
            .catch(err => console.error("Error fetching expenses:", err))
            .finally(() => setLoading(false));
    }, [API_URL, employee.employeeCode]);

    useEffect(() => { fetchExpenses(); }, [fetchExpenses]);

    const handleAction = async (expenseId, action) => {
        if (!window.confirm(`Are you sure you want to ${action} this expense?`)) return;
        try {
            const token = localStorage.getItem('token');
            await axios.put(`${API_URL}/expenses/${expenseId}/${action}`, {}, { headers: { "Authorization": `Bearer ${token}` } });
            fetchExpenses();
        } catch (err) {
            alert(`Failed to ${action} expense.`);
        }
    };

    const handleDelete = async (expenseId) => {
        if (!window.confirm(`Are you sure you want to delete this expense claim? This action cannot be undone.`)) return;
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${API_URL}/expenses/${expenseId}`, { headers: { "Authorization": `Bearer ${token}` } });
            fetchExpenses();
            alert('Expense claim deleted successfully.');
        } catch (err) {
            alert(`Failed to delete expense: ${err.response?.data?.message || 'Please try again.'}`);
        }
    };

    const handleViewReceipt = async (expense) => {
        if (!expense.receiptPath) return;
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}/expenses/${expense.id}/receipt`, {
                headers: { "Authorization": `Bearer ${token}` },
                responseType: 'blob'
            });
            const file = new Blob([response.data], { type: response.headers['content-type'] });
            const fileURL = URL.createObjectURL(file);
            setViewingReceipt(fileURL);
        } catch (err) {
            console.error("Error fetching receipt:", err);
            alert("Could not load the receipt. It may have been deleted.");
        }
    };

    if (loading) return <div className="flex justify-center items-center p-8"><Loader className="animate-spin h-8 w-8 text-blue-600" /></div>;

    return (
        <>
            <h3 className="text-lg font-semibold mb-4">Expense Claims</h3>
            <div className="overflow-x-auto border border-slate-200 rounded-lg">
                <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                        <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Date</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Category</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Amount</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Receipt</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Review</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Review</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200 text-slate-700">
                        {expenses.length > 0 ? expenses.map(exp => (
                            <tr key={exp.id}>
                                <td className="px-4 py-3 whitespace-nowrap text-sm">{new Date(exp.expenseDate).toLocaleDateString()}</td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm">{exp.category}</td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm">{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'AED' }).format(exp.amount)}</td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${statusStyles[exp.status]?.bg || 'bg-slate-100'} ${statusStyles[exp.status]?.text || 'text-slate-800'}`}>
                                        {exp.status.toLowerCase()}
                                    </span>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm">
                                    {exp.receiptPath && (
                                        <button onClick={() => handleViewReceipt(exp)} className="text-blue-600 hover:underline text-xs flex items-center gap-1">
                                            <Eye size={14} /> View
                                        </button>
                                    )}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm space-x-2">
                                    {exp.status === 'SUBMITTED' && (
                                        <div className="flex gap-2">
                                            <button onClick={() => handleAction(exp.id, 'approve')} className="p-1.5 text-green-600 hover:bg-green-100 rounded-full" title="Approve"><Check size={14} /></button>
                                            <button onClick={() => handleAction(exp.id, 'reject')} className="p-1.5 text-red-600 hover:bg-red-100 rounded-full" title="Reject"><X size={14} /></button>
                                        </div>
                                    )}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm">
                                    <button onClick={() => handleDelete(exp.id)} className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-100 rounded-full" title="Delete"><Trash2 size={14} /></button>
                                </td>
                            </tr>
                        )) : (
                            <tr><td colSpan="8" className="text-center py-10 text-slate-500">No expense claims found.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
            {viewingReceipt && (
                <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex justify-center items-center p-4" onClick={() => setViewingReceipt(null)}>
                    <div className="bg-white p-2 rounded-lg max-w-4xl max-h-[90vh]" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-end">
                            <button onClick={() => setViewingReceipt(null)} className="p-2 rounded-full hover:bg-slate-100 -mr-2 -mt-2 mb-2">
                                <X size={20} />
                            </button>
                        </div>
                        <img src={viewingReceipt} alt="Expense Receipt" className="max-w-full max-h-[80vh] object-contain" />
                    </div>
                </div>
            )}
        </>
    );
};

// --- Main Component ---
const EmployeeDetails = () => {
    const [allEmployees, setAllEmployees] = useState([]);
    const [employee, setEmployee] = useState(null);
    const [listLoading, setListLoading] = useState(true);
    const [error, setError] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [activeSubTab, setActiveSubTab] = useState('Bank Account');
    const API_URL = import.meta.env.VITE_API_BASE_URL;

    useEffect(() => {
        const fetchAllEmployees = async () => {
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
        fetchAllEmployees();
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

    const subTabs = [
        { name: 'Bank Account', icon: Banknote, component: BankAccountTab },
        { name: 'Loans', icon: HandCoins, component: LoansTab },
        { name: 'Expenses', icon: Receipt, component: ExpensesTab },
    ];

    const ActiveSubComponent = subTabs.find(tab => tab.name === activeSubTab)?.component;

    return (
        <div>
            {!employee ? (
                <div className="relative mb-6">
                    <input
                        type="text"
                        placeholder="Search by name or employee ID..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="input w-full pl-10"
                    />
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                </div>
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
                        <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xl">
                            {employee.firstName.charAt(0)}{employee.lastName.charAt(0)}
                        </div>
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
                                    onClick={() => setActiveSubTab(tab.name)}
                                    className={`whitespace-nowrap flex items-center py-3 px-1 border-b-2 font-medium text-sm transition-colors ${activeSubTab === tab.name
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

export default EmployeeDetails;