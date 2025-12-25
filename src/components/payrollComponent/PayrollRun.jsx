import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Loader, PlusCircle, Play, Eye, CheckCircle, FileClock, AlertTriangle, Download } from 'lucide-react';
import ProcessPayrollRun from './ProcessPayrollRun';

// --- Helper Components (copied from PayrollSettings for encapsulation) ---
const InputField = ({ label, id, type = 'text', children, ...props }) => (
    <div>
        <label htmlFor={id} className="block text-sm font-medium text-slate-700">{label}</label>
        <input id={id} type={type} {...props} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm shadow-sm placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500" />
    </div>
);

const Modal = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">{title}</h3>
                    <button onClick={onClose} className="text-slate-500 hover:text-slate-800">&times;</button>
                </div>
                {children}
            </div>
        </div>
    );
};

// --- Payroll Run Component Logic ---
const statusStyles = {
    DRAFT: 'bg-yellow-100 text-yellow-800',
    PROCESSING: 'bg-blue-100 text-blue-800',
    COMPLETED: 'bg-green-100 text-green-800',
    PAID: 'bg-green-100 text-green-800', // Using same as completed for consistency
    GENERATED: 'bg-green-100 text-green-800',
    FAILED: 'bg-red-100 text-red-800',
};

const CreateRunModal = ({ isOpen, onClose, onCreate }) => {
    const [year, setYear] = useState(new Date().getFullYear());
    const [month, setMonth] = useState(new Date().getMonth() + 1);

    const handleSubmit = (e) => {
        e.preventDefault();
        onCreate(year, month);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Create New Payroll Run">
            <form onSubmit={handleSubmit} className="space-y-4">
                <InputField label="Year" type="number" value={year} onChange={(e) => setYear(e.target.value)} required />
                <InputField label="Month" type="number" min="1" max="12" value={month} onChange={(e) => setMonth(e.target.value)} required />
                <div className="flex justify-end gap-3 pt-4">
                    <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
                    <button type="submit" className="btn-primary">Create Draft</button>
                </div>
            </form>
        </Modal>
    );
};

const PayslipsModal = ({ isOpen, onClose, run, payslips, loading, onUpdateStatus, employees }) => {
    if (!run) return null;

    // Helper to get employee display info
    const getEmployeeDisplay = (p) => {
        // First check directly on payslip object (if backend fixed)
        if (p.employeeName) {
            return { name: p.employeeName, code: p.employeeCode || p.employeeId };
        }
        // Fallback: look up in employees list
        if (employees && employees.length > 0) {
            const emp = employees.find(e => e.id === p.employeeId || e.employeeCode === p.employeeCode); // Match by ID or Code
            if (emp) {
                return { name: emp.name || `${emp.firstName} ${emp.lastName}`, code: emp.employeeCode };
            }
        }
        // Last resort
        return { name: null, code: p.employeeCode || p.employeeId };
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Payslips for ${new Date(run.payPeriodStart).toLocaleString('default', { month: 'long' })} ${run.year}`}>
            {loading ? (
                <div className="flex justify-center items-center p-8"><Loader className="animate-spin h-8 w-8 text-blue-600" /></div>
            ) : (
                <div className="overflow-y-auto max-h-[60vh]">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Employee</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Net Salary</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Action</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-slate-200 text-slate-700">
                                {payslips.map(p => {
                                    const { name, code } = getEmployeeDisplay(p);
                                    return (
                                        <tr key={p.id}>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                                                {name ? (
                                                    <span>{name} <span className="text-gray-500">({code})</span></span>
                                                ) : (
                                                    <span className="text-gray-500">{code}</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm">{p.netSalary}</td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm">
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${p.status === 'PAID' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                                    {p.status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm">
                                                {p.status !== 'PAID' && (
                                                    <button
                                                        onClick={() => onUpdateStatus(p.id, 'PAID')}
                                                        className="text-green-600 hover:text-green-800 font-medium text-xs flex items-center gap-1"
                                                    >
                                                        <CheckCircle size={14} /> Mark Paid
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </Modal>
    );
};

const PayrollRun = () => {
    const [runs, setRuns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isCreateModalOpen, setCreateModalOpen] = useState(false);
    const [isPayslipsModalOpen, setPayslipsModalOpen] = useState(false);
    const [selectedRun, setSelectedRun] = useState(null);
    const [view, setView] = useState('list'); // 'list' or 'process'
    const [payslips, setPayslips] = useState([]);
    const [payslipsLoading, setPayslipsLoading] = useState(false);
    const [employees, setEmployees] = useState([]); // Store employee details for lookup

    const API_URL = import.meta.env.VITE_API_BASE_URL;

    const fetchRuns = useCallback((showLoading = true) => {
        if (showLoading) setLoading(true);

        const token = localStorage.getItem('token');
        axios.get(`${API_URL}/payroll-runs`, { headers: { "Authorization": `Bearer ${token}` } })
            .then(res => setRuns(res.data.sort((a, b) => new Date(b.payPeriodStart) - new Date(a.payPeriodStart))))
            .catch(err => {
                console.error("Error fetching payroll runs:", err);
                setError('Failed to load payroll runs.');
            })
            .finally(() => setLoading(false));
    }, [API_URL]);

    // Fetch employees for name lookup
    useEffect(() => {
        const fetchEmployees = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await axios.get(`${API_URL}/employees/all`, { headers: { "Authorization": `Bearer ${token}` } });
                setEmployees(response.data);
            } catch (err) {
                console.error("Error fetching employees for lookup:", err);
            }
        };
        fetchEmployees();
    }, [API_URL]);

    useEffect(() => { fetchRuns(); }, [fetchRuns]);

    const handleCreateRun = async (year, month) => {
        try {
            const token = localStorage.getItem('token');
            await axios.post(`${API_URL}/payroll-runs`, { year, month }, { headers: { "Authorization": `Bearer ${token}` } });
            setCreateModalOpen(false);
            fetchRuns();
            alert('Payroll run created successfully as a draft.');
        } catch (err) {
            console.error("Error creating payroll run:", err);
            alert(err.response?.data?.message || 'Failed to create payroll run.');
        }
    };

    const handleExecuteRun = async (runId) => {
        const runToProcess = runs.find(r => r.id === runId);
        if (!runToProcess) return;
        setSelectedRun(runToProcess);
        setView('process');
    };

    const handleViewPayslips = async (run) => {
        setSelectedRun(run);
        setPayslipsModalOpen(true);
        setPayslipsLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}/payroll-runs/${run.id}/payslips`, { headers: { "Authorization": `Bearer ${token}` } });
            setPayslips(response.data);
        } catch (err) {
            console.error("Error fetching payslips:", err);
            alert('Failed to fetch payslips for this run.');
        } finally {
            setPayslipsLoading(false);
        }
    };

    const handleUpdatePayslipStatus = async (payslipId, newStatus) => {
        try {
            const token = localStorage.getItem('token');
            await axios.put(`${API_URL}/payslips/${payslipId}/status`, null, {
                params: { status: newStatus },
                headers: { "Authorization": `Bearer ${token}` }
            });

            // Update local state
            setPayslips(prev => prev.map(p => p.id === payslipId ? { ...p, status: newStatus } : p));
        } catch (err) {
            console.error("Error updating payslip status:", err);
            alert('Failed to update payslip status.');
        }
    };

    const handleDownloadWpsSif = async (runId) => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}/payroll-runs/${runId}/wps-sif`, {
                headers: { "Authorization": `Bearer ${token}` },
                responseType: 'blob', // Important for file download
            });

            // Create a temporary URL for the blob
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;

            // Extract filename from content-disposition header if available, or generate one
            const contentDisposition = response.headers['content-disposition'];
            let fileName = 'wps_sif.SIF';
            if (contentDisposition) {
                const fileNameMatch = contentDisposition.match(/filename="?(.+)"?/);
                if (fileNameMatch.length === 2)
                    fileName = fileNameMatch[1];
            }

            link.setAttribute('download', fileName);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            console.error("Error downloading WPS SIF:", err);
            alert('Failed to download WPS SIF file.');
        }
    };

    const handleUpdateStatus = async (runId, newStatus) => {
        if (!window.confirm(`Are you sure you want to mark this run as ${newStatus}? This will update all employee payslips.`)) {
            return;
        }

        try {
            const token = localStorage.getItem('token');
            await axios.put(`${API_URL}/payroll-runs/${runId}/status`, null, {
                params: { status: newStatus },
                headers: { "Authorization": `Bearer ${token}` }
            });
            fetchRuns(false); // Refresh list
            alert(`Payroll run marked as ${newStatus} successfully.`);
        } catch (err) {
            console.error("Error updating status:", err);
            alert('Failed to update payroll run status.');
        }
    };

    if (loading) return <div className="flex justify-center items-center p-8"><Loader className="animate-spin h-8 w-8 text-blue-600" /></div>;
    if (error) return <div className="text-center text-red-600 p-4 bg-red-50 rounded-md">{error}</div>;

    if (view === 'process' && selectedRun) {
        return <ProcessPayrollRun run={selectedRun} onBack={() => setView('list')} onRunComplete={() => { setView('list'); fetchRuns(false); }} />;
    }

    return (
        <>
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Payroll Runs</h3>
                <button onClick={() => setCreateModalOpen(true)} className="btn-primary flex items-center gap-2">
                    <PlusCircle size={16} /> Create Payroll Run
                </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {runs.map(run => (
                    <div key={run.id} className="bg-white border border-slate-200 rounded-lg shadow-sm flex flex-col">
                        <div className="p-4 border-b">
                            <div className="flex justify-between items-start">
                                <h4 className="text-lg font-bold text-slate-800">{new Date(run.payPeriodStart).toLocaleString('default', { month: 'long' })} {run.year}</h4>
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusStyles[run.status] || 'bg-slate-100 text-slate-800'}`}>
                                    {run.status}
                                </span>
                            </div>
                            <p className="text-xs text-slate-500 mt-1">
                                Period: {new Date(run.payPeriodStart).toLocaleDateString()} - {new Date(run.payPeriodEnd).toLocaleDateString()}
                            </p>
                        </div>
                        <div className="p-4 space-y-3 text-sm text-slate-600 flex-grow">
                            <div className="flex items-center gap-2">
                                {run.status === 'DRAFT' ? <FileClock className="h-4 w-4 text-yellow-500" /> : run.status === 'FAILED' ? <AlertTriangle className="h-4 w-4 text-red-500" /> : <CheckCircle className="h-4 w-4 text-green-500" />}
                                <span>Status: {run.status}</span>
                            </div>
                            {run.executedAt && <p className="text-xs">Executed on: {new Date(run.executedAt).toLocaleString()}</p>}
                        </div>
                        <div className="p-4 bg-slate-50 border-t flex justify-end flex-wrap gap-2">
                            {run.status === 'DRAFT' && (
                                <button onClick={() => handleExecuteRun(run.id)} className="btn-primary py-1 px-3 text-sm flex items-center gap-2">
                                    <Play size={14} /> Process Payroll
                                </button>
                            )}
                            {run.status === 'PROCESSING' && (
                                <span className="text-sm italic text-slate-500 flex items-center gap-2"><Loader className="animate-spin h-4 w-4" /> Processing...</span>
                            )}
                            {(run.status === 'GENERATED' || run.status === 'COMPLETED') && (
                                <>
                                    <button onClick={() => handleViewPayslips(run)} className="btn-secondary py-1 px-3 text-sm flex items-center gap-2">
                                        <Eye size={14} /> View Payslips
                                    </button>
                                    <button onClick={() => handleUpdateStatus(run.id, 'PAID')} className="bg-green-600 hover:bg-green-700 text-white py-1 px-3 rounded-md text-sm flex items-center gap-2 transition-colors">
                                        <CheckCircle size={14} /> Mark as Paid
                                    </button>
                                </>
                            )}
                            {(run.status === 'PAID') && (
                                <>
                                    <button onClick={() => handleViewPayslips(run)} className="btn-secondary py-1 px-3 text-sm flex items-center gap-2">
                                        <Eye size={14} /> View Payslips
                                    </button>
                                    <button onClick={() => handleDownloadWpsSif(run.id)} className="bg-cyan-600 hover:bg-cyan-700 text-white py-1 px-3 rounded-md text-sm flex items-center gap-2 transition-colors" title="Download WPS SIF File">
                                        <Download size={14} /> WPS SIF
                                    </button>
                                    {/* Optional: Allow reverting if needed, though usually strict */}
                                    {/* <button onClick={() => handleUpdateStatus(run.id, 'GENERATED')} className="text-red-600 hover:text-red-800 text-sm ml-2">Revert</button> */}
                                </>
                            )}
                        </div>
                    </div>
                ))}
            </div>
            <CreateRunModal isOpen={isCreateModalOpen} onClose={() => setCreateModalOpen(false)} onCreate={handleCreateRun} />
            <PayslipsModal
                isOpen={isPayslipsModalOpen}
                onClose={() => setPayslipsModalOpen(false)}
                run={selectedRun}
                payslips={payslips}
                loading={payslipsLoading}
                onUpdateStatus={handleUpdatePayslipStatus}
            />
        </>
    );
};

export default PayrollRun;