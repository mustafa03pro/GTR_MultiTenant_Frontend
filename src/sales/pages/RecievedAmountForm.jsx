import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Save, Loader2, RefreshCcw } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_BASE_URL;

const RecievedAmountForm = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditMode = !!id;

    const [loading, setLoading] = useState(false);
    const [fetchingData, setFetchingData] = useState(true);

    const [formData, setFormData] = useState({
        entryType: 'Domestic',
        locationId: '',
        customerId: '',
        piNumber: '',
        manualPiNumber: '',
        amount: '',
        isReceivedFullAmount: false,
        isTaxDeducted: false,
        depositDate: new Date().toISOString().split('T')[0],
        depositMode: 'Bank Transfer', // Default from screenshot?
        reference: '',
        chequeNumber: '',
        receivingDate: new Date().toISOString().split('T')[0],
        receivedNumber: '', // Backend might generate this? or manual?
        invoiceNumber: '',
        tds: '',
        advanceAmount: '',
        totalPiAmount: '',
        fbc: '',
        expectedInFc: '',
        bankCharges: '',
        fineAndPenalty: '',
        rebateAndDiscount: ''
    });

    const [customers, setCustomers] = useState([]);
    // Location is hardcoded for now as per screenshot 'HO', or fetched if API exists.
    // Assuming a simple list or hardcoded for now since no explicit Location API in context except inside RecievedService which uses LocationRepository.
    // I'll try to fetch locations if API exists, else hardcode for UI demo.
    const [locations, setLocations] = useState([]);

    useEffect(() => {
        const loadDependencies = async () => {
            setFetchingData(true);
            try {
                const token = localStorage.getItem('token');
                const headers = { Authorization: `Bearer ${token}` };

                // Fetch Customers
                const custRes = await axios.get(`${API_URL}/parties`, { headers });
                setCustomers(custRes.data.content || custRes.data || []);

                // Fetch Locations (Try-catch in case endpoint doesn't exist or is different)
                try {
                    const locRes = await axios.get(`${API_URL}/locations`, { headers }); // Guessing endpoint
                    setLocations(locRes.data || []);
                } catch (e) {
                    // Fallback or ignore
                    console.warn("Could not fetch locations, defaulting to HO");
                    setLocations([{ id: 1, name: 'HO' }]); // Mock for display if fail
                }

                if (isEditMode) {
                    const response = await axios.get(`${API_URL}/recieved/${id}`, { headers });
                    const data = response.data;
                    setFormData({
                        entryType: data.entryType || 'Domestic',
                        locationId: data.locationId || '',
                        customerId: data.customerId || '',
                        piNumber: data.piNumber || '',
                        manualPiNumber: data.manualPiNumber || '',
                        amount: data.amount || '',
                        isReceivedFullAmount: data.isReceivedFullAmount || false,
                        isTaxDeducted: data.isTaxDeducted || false,
                        depositDate: data.depositDate || new Date().toISOString().split('T')[0],
                        depositMode: data.depositMode || '',
                        reference: data.reference || '',
                        chequeNumber: data.chequeNumber || '',
                        receivingDate: data.receivingDate || new Date().toISOString().split('T')[0],
                        receivedNumber: data.receivedNumber || '', // Read-only usually?
                        invoiceNumber: data.invoiceNumber || '',
                        tds: data.tds || '',
                        advanceAmount: data.advanceAmount || '',
                        totalPiAmount: data.totalPiAmount || '',
                        fbc: data.fbc || '',
                        expectedInFc: data.expectedInFc || '',
                        bankCharges: data.bankCharges || '',
                        fineAndPenalty: data.fineAndPenalty || '',
                        rebateAndDiscount: data.rebateAndDiscount || ''
                    });
                }

            } catch (err) {
                console.error("Failed to load data", err);
                alert("Failed to load dependency data or record.");
            } finally {
                setFetchingData(false);
            }
        };

        loadDependencies();
    }, [id, isEditMode]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const headers = { Authorization: `Bearer ${token}` };

            // Convert numeric strings to numbers/null
            const payload = {
                ...formData,
                amount: formData.amount ? Number(formData.amount) : null,
                tds: formData.tds ? Number(formData.tds) : null,
                advanceAmount: formData.advanceAmount ? Number(formData.advanceAmount) : null,
                totalPiAmount: formData.totalPiAmount ? Number(formData.totalPiAmount) : null,
                fbc: formData.fbc ? Number(formData.fbc) : null,
                expectedInFc: formData.expectedInFc ? Number(formData.expectedInFc) : null,
                bankCharges: formData.bankCharges ? Number(formData.bankCharges) : null,
                fineAndPenalty: formData.fineAndPenalty ? Number(formData.fineAndPenalty) : null,
                rebateAndDiscount: formData.rebateAndDiscount ? Number(formData.rebateAndDiscount) : null,
                locationId: formData.locationId ? Number(formData.locationId) : null,
                customerId: formData.customerId ? Number(formData.customerId) : null,
            };

            if (isEditMode) {
                await axios.put(`${API_URL}/recieved/${id}`, payload, { headers });
            } else {
                await axios.post(`${API_URL}/recieved`, payload, { headers });
            }
            navigate('/sales/recieved-amounts');
        } catch (err) {
            console.error("Submit error", err);
            alert(`Failed to save: ${err.response?.data?.message || err.message}`);
        } finally {
            setLoading(false);
        }
    };

    if (fetchingData) return <div className="flex justify-center items-center h-screen"><Loader2 className="animate-spin text-primary lg:w-12 lg:h-12" /></div>;

    return (
        <div className="flex flex-col h-full bg-slate-50 overflow-y-auto">
            {/* Header */}
            <div className="bg-white border-b p-4 flex justify-between items-center sticky top-0 z-10 shadow-sm">
                <div className="flex items-center gap-2">
                    <button onClick={() => navigate(-1)} className="text-gray-500 hover:text-gray-700"><ArrowLeft size={20} /></button>
                    <h1 className="text-xl font-bold text-gray-800">{isEditMode ? 'Edit Amount Received' : 'New Amount Received'}</h1>
                </div>
                <div className="flex gap-2">
                    <button type="button" onClick={() => navigate('/sales/recieved-amounts')} className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 font-medium">Cancel</button>
                    <button
                        type="submit"
                        form="recieved-form"
                        disabled={loading}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        {isEditMode ? 'Update' : 'Save'}
                    </button>
                </div>
            </div>

            <div className="p-6 w-full space-y-6">
                <form id="recieved-form" onSubmit={handleSubmit} className="w-full space-y-6">

                    {/* Main Details Card */}
                    <div className="bg-white p-6 rounded shadow-sm border border-gray-200">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                            {/* Entry Type */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Entry Type <span className="text-red-500">*</span></label>
                                <select
                                    name="entryType"
                                    value={formData.entryType}
                                    onChange={handleChange}
                                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                                >
                                    <option value="Domestic">Domestic</option>
                                    <option value="International">International</option>
                                </select>
                            </div>

                            {/* Location */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Location</label>
                                <select
                                    name="locationId"
                                    value={formData.locationId}
                                    onChange={handleChange}
                                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                                >
                                    <option value="">Select Location</option>
                                    {locations.map(loc => (
                                        <option key={loc.id} value={loc.id}>{loc.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Customer Name */}
                            <div className="md:col-span-2">
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Customer Name <span className="text-red-500">*</span></label>
                                <select
                                    name="customerId"
                                    value={formData.customerId}
                                    onChange={handleChange}
                                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                                    required
                                >
                                    <option value="">Select Customer</option>
                                    {customers.map(cust => (
                                        <option key={cust.id} value={cust.id}>{cust.companyName} ({cust.contactPersonName})</option>
                                    ))}
                                </select>
                            </div>

                            {/* PI Number */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">PI Number</label>
                                <input
                                    type="text"
                                    name="piNumber"
                                    value={formData.piNumber}
                                    onChange={handleChange}
                                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="Enter PI Number"
                                />
                            </div>

                            {/* Manual PI Number */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Manual PI Number</label>
                                <input
                                    type="text"
                                    name="manualPiNumber"
                                    value={formData.manualPiNumber}
                                    onChange={handleChange}
                                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="Manual PI Number"
                                />
                            </div>

                        </div>
                    </div>

                    {/* Financial Details Card */}
                    <div className="bg-white p-6 rounded shadow-sm border border-gray-200">
                        <h2 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b">Payment Details</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Amount */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Amount <span className="text-red-500">*</span></label>
                                <input
                                    type="number"
                                    name="amount"
                                    value={formData.amount}
                                    onChange={handleChange}
                                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="0.00"
                                    required
                                />
                                <div className="mt-2 flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        name="isReceivedFullAmount"
                                        checked={formData.isReceivedFullAmount}
                                        onChange={handleChange}
                                        id="receivedFull"
                                        className="rounded text-blue-600 focus:ring-blue-500"
                                    />
                                    <label htmlFor="receivedFull" className="text-sm text-gray-600">Received full amount</label>
                                </div>
                            </div>

                            {/* Tax Deducted */}
                            <div>
                                <div className="flex items-center gap-2 mt-6">
                                    <input
                                        type="checkbox"
                                        name="isTaxDeducted"
                                        checked={formData.isTaxDeducted}
                                        onChange={handleChange}
                                        id="taxDeducted"
                                        className="rounded text-blue-600 focus:ring-blue-500"
                                    />
                                    <label htmlFor="taxDeducted" className="text-sm font-bold text-gray-700">Tax deducted?</label>
                                </div>
                                {formData.isTaxDeducted && (
                                    <div className="mt-2">
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">TDS Amount</label>
                                        <input
                                            type="number"
                                            name="tds"
                                            value={formData.tds}
                                            onChange={handleChange}
                                            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                            placeholder="TDS Amount"
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Deposit Date */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Deposit Date</label>
                                <input
                                    type="date"
                                    name="depositDate"
                                    value={formData.depositDate}
                                    onChange={handleChange}
                                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>

                            {/* Receiving Date */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Receiving Date</label>
                                <input
                                    type="date"
                                    name="receivingDate"
                                    value={formData.receivingDate}
                                    onChange={handleChange}
                                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>

                            {/* Deposit Mode */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Deposit Mode</label>
                                <select
                                    name="depositMode"
                                    value={formData.depositMode}
                                    onChange={handleChange}
                                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                                >
                                    <option value="Bank Transfer">Bank Transfer</option>
                                    <option value="Cheque">Cheque</option>
                                    <option value="Cash">Cash</option>
                                    <option value="Online">Online</option>
                                </select>
                            </div>

                            {/* Reference */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Reference</label>
                                <input
                                    type="text"
                                    name="reference"
                                    value={formData.reference}
                                    onChange={handleChange}
                                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="Transaction Reference"
                                />
                            </div>

                            {/* Cheque Number */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Cheque Number</label>
                                <input
                                    type="text"
                                    name="chequeNumber"
                                    value={formData.chequeNumber}
                                    onChange={handleChange}
                                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="Cheque No."
                                />
                            </div>

                            {/* Invoice Number */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Invoice Number</label>
                                <input
                                    type="text"
                                    name="invoiceNumber"
                                    value={formData.invoiceNumber}
                                    onChange={handleChange}
                                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="Invoice No."
                                />
                            </div>

                        </div>
                    </div>

                    {/* Additional Financials */}
                    <div className="bg-white p-6 rounded shadow-sm border border-gray-200">
                        <h2 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b">Other Financial Details</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Total PI Amount</label>
                                <input type="number" name="totalPiAmount" value={formData.totalPiAmount} onChange={handleChange} className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="0.00" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Advance Amount</label>
                                <input type="number" name="advanceAmount" value={formData.advanceAmount} onChange={handleChange} className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="0.00" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">F.B.C</label>
                                <input type="number" name="fbc" value={formData.fbc} onChange={handleChange} className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="0.00" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Expected In FC</label>
                                <input type="number" name="expectedInFc" value={formData.expectedInFc} onChange={handleChange} className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="0.00" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Bank Charges</label>
                                <input type="number" name="bankCharges" value={formData.bankCharges} onChange={handleChange} className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="0.00" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Fine/Penalty</label>
                                <input type="number" name="fineAndPenalty" value={formData.fineAndPenalty} onChange={handleChange} className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="0.00" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Rebate & Discount</label>
                                <input type="number" name="rebateAndDiscount" value={formData.rebateAndDiscount} onChange={handleChange} className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="0.00" />
                            </div>
                        </div>
                    </div>

                </form>
            </div>
        </div>
    );
};

export default RecievedAmountForm;
