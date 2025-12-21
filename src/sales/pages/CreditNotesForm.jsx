import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Save, Loader2, Upload, Paperclip } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_BASE_URL;

const CreditNotesForm = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditMode = !!id;

    const [loading, setLoading] = useState(false);
    const [fetchingData, setFetchingData] = useState(true);

    const [formData, setFormData] = useState({
        locationId: '',
        customerId: '',
        creditNoteNumber: '',
        invoiceNumber: '',
        creditNoteDate: new Date().toISOString().split('T')[0],
        amount: '',
        taxPercentage: '',
        termsAndConditions: 'Mention your company\'s Terms and Conditions.',
        notes: '',
        template: 'Standard',
        emailTo: '',
        attachments: []
    });

    const [customers, setCustomers] = useState([]);
    const [locations, setLocations] = useState([]);
    // Using a simpler state for files for now as per previous impl, but styled better
    const [attachmentFiles, setAttachmentFiles] = useState([]);

    useEffect(() => {
        const loadDependencies = async () => {
            setFetchingData(true);
            try {
                const token = localStorage.getItem('token');
                const headers = { Authorization: `Bearer ${token}` };

                // Fetch Customers
                const custRes = await axios.get(`${API_URL}/parties`, { headers });
                setCustomers(custRes.data.content || custRes.data || []);

                // Fetch Locations
                try {
                    const locRes = await axios.get(`${API_URL}/locations`, { headers });
                    setLocations(locRes.data || []);
                } catch (e) {
                    setLocations([{ id: 1, name: 'HO' }]);
                }

                if (isEditMode) {
                    const response = await axios.get(`${API_URL}/credit-notes/${id}`, { headers });
                    const data = response.data;
                    setFormData({
                        locationId: data.locationId || '',
                        customerId: data.customerId || '',
                        creditNoteNumber: data.creditNoteNumber || '',
                        invoiceNumber: data.invoiceNumber || '',
                        creditNoteDate: data.creditNoteDate || new Date().toISOString().split('T')[0],
                        amount: data.amount || '',
                        taxPercentage: data.taxPercentage || '',
                        termsAndConditions: data.termsAndConditions || '',
                        notes: data.notes || '',
                        template: data.template || 'Standard',
                        emailTo: data.emailTo || '',
                        attachments: data.attachments || []
                    });
                }

            } catch (err) {
                console.error("Failed to load data", err);
            } finally {
                setFetchingData(false);
            }
        };

        loadDependencies();
    }, [id, isEditMode]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleFileChange = (e) => {
        // Placeholder for consistency with InvoiceForm logic, though backend might not accept files directly yet
        // standardizing UI first.
        if (e.target.files) {
            // For now just logging or simple text attachment logic if needed
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const headers = { Authorization: `Bearer ${token}` };

            const payload = {
                ...formData,
                amount: formData.amount ? Number(formData.amount) : null,
                taxPercentage: formData.taxPercentage ? Number(formData.taxPercentage) : null,
                locationId: formData.locationId ? Number(formData.locationId) : null,
                customerId: formData.customerId ? Number(formData.customerId) : null,
            };

            if (isEditMode) {
                await axios.put(`${API_URL}/credit-notes/${id}`, payload, { headers });
            } else {
                await axios.post(`${API_URL}/credit-notes`, payload, { headers });
            }
            navigate('/sales/credit-notes');
        } catch (err) {
            console.error("Submit error", err);
            alert(`Failed to save: ${err.response?.data?.message || err.message}`);
        } finally {
            setLoading(false);
        }
    };

    if (fetchingData) return <div className="flex justify-center items-center h-screen"><Loader2 className="animate-spin text-primary lg:w-12 lg:h-12" /></div>;

    return (
        <div className="flex flex-col h-screen bg-slate-50">
            {/* Header */}
            <header className="bg-primary text-white shadow-sm p-4 flex items-center justify-between sticky top-0 z-10">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/sales/credit-notes')} className="text-gray-300 hover:text-white"><ArrowLeft /></button>
                    <h1 className="text-xl font-bold">{isEditMode ? 'Edit Credit Notes' : 'New Credit Notes'}</h1>
                </div>
                <div className="flex items-center gap-4">
                    <button type="button" onClick={() => navigate('/sales/credit-notes')} className="px-4 py-2 bg-gray-600 rounded hover:bg-gray-700 font-medium text-sm">Cancel</button>
                    <button
                        type="submit"
                        form="credit-note-form"
                        disabled={loading}
                        className="px-4 py-2 bg-green-600 rounded hover:bg-green-700 flex items-center gap-2 font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        {isEditMode ? 'Update' : 'Save'}
                    </button>
                </div>
            </header>

            <main className="flex-grow overflow-y-auto p-6">
                <form id="credit-note-form" onSubmit={handleSubmit} className="space-y-6">

                    {/* Header Details */}
                    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">Location <span className="text-red-500">*</span></label>
                                    <select
                                        name="locationId"
                                        value={formData.locationId}
                                        onChange={handleChange}
                                        className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:border-primary bg-white"
                                        required
                                    >
                                        <option value="">Select Location</option>
                                        {locations.map(loc => (
                                            <option key={loc.id} value={loc.id}>{loc.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">Customer Name <span className="text-red-500">*</span></label>
                                    <select
                                        name="customerId"
                                        value={formData.customerId}
                                        onChange={handleChange}
                                        className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:border-primary bg-white"
                                        required
                                    >
                                        <option value="">Select Customer</option>
                                        {customers.map(cust => (
                                            <option key={cust.id} value={cust.id}>
                                                {cust.companyName} {cust.contactPersonName ? `(${cust.contactPersonName})` : ''}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">Credit Notes Date</label>
                                    <input
                                        type="date"
                                        name="creditNoteDate"
                                        value={formData.creditNoteDate}
                                        onChange={handleChange}
                                        className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:border-primary"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">Invoice No.</label>
                                    <input
                                        type="text"
                                        name="invoiceNumber"
                                        value={formData.invoiceNumber}
                                        onChange={handleChange}
                                        className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:border-primary"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6 pt-4 border-t border-gray-100">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1">Credit Notes#</label>
                                <input
                                    type="text"
                                    name="creditNoteNumber"
                                    value={formData.creditNoteNumber}
                                    onChange={handleChange}
                                    className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:border-primary"
                                    placeholder="Auto / CN-001"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Financials / Footer Totals equivalent */}
                    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                        <div className="flex flex-col md:flex-row justify-end gap-12">
                            <div className="w-full md:w-1/3"></div> {/* Spacer */}

                            <div className="w-full md:w-1/3 space-y-2 text-sm bg-gray-50 p-4 rounded-lg">
                                <h3 className="font-semibold text-gray-700 border-b pb-2 mb-2">Financial Details</h3>
                                <div className="flex justify-between border-b border-gray-200 pb-2 items-center">
                                    <span className="font-bold text-gray-700">Amount</span>
                                    <input
                                        type="number"
                                        name="amount"
                                        value={formData.amount}
                                        onChange={handleChange}
                                        className="w-32 border border-gray-300 rounded px-2 py-1 text-right focus:outline-none focus:border-primary"
                                        placeholder="0.00"
                                    />
                                </div>
                                <div className="flex justify-between border-b border-gray-200 pb-2 items-center">
                                    <span className="text-gray-600">Tax Percentage (%)</span>
                                    <input
                                        type="number"
                                        name="taxPercentage"
                                        value={formData.taxPercentage}
                                        onChange={handleChange}
                                        className="w-24 border border-gray-300 rounded px-2 py-1 text-right focus:outline-none focus:border-primary"
                                        placeholder="%"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Extras */}
                    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1">Attach File</label>
                                <div className="flex gap-2 items-center border border-dashed border-gray-300 rounded-lg p-4 bg-gray-50">
                                    <label className="cursor-pointer bg-white border border-gray-300 px-3 py-1.5 rounded text-sm hover:bg-gray-50 flex items-center gap-1 shadow-sm transition-colors font-medium">
                                        <Paperclip size={14} /> Browse... <input type="file" multiple onChange={handleFileChange} className="hidden" />
                                    </label>
                                    <span className="text-xs text-gray-500">No file selected</span>
                                </div>
                                <p className="text-[10px] text-gray-400 mt-1">Max 5 files, 5MB each</p>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1">Terms & Conditions</label>
                                <textarea name="termsAndConditions" value={formData.termsAndConditions} onChange={handleChange} rows="3" className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:border-primary" placeholder="Mention your company's Terms and Conditions."></textarea>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1">Notes</label>
                                <textarea name="notes" value={formData.notes} onChange={handleChange} rows="2" className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:border-primary" placeholder="Will be displayed on Credit Notes"></textarea>
                            </div>
                        </div>
                    </div>

                    {/* Email To */}
                    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                        <label className="block text-xs font-bold text-gray-700 mb-1">Email To</label>
                        <div className="flex items-center gap-2">
                            <input type="text" name="emailTo" value={formData.emailTo} onChange={handleChange} className="w-full md:w-1/2 border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:border-primary" placeholder="Email address" />
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                            <input type="checkbox" id="addFields" className="rounded text-primary focus:ring-primary" />
                            <label htmlFor="addFields" className="text-xs text-gray-600 font-bold">Additional Fields: <span className="font-normal text-gray-500">Start adding custom fields...</span></label>
                        </div>
                    </div>

                </form>
            </main>
        </div>
    );
};

export default CreditNotesForm;
