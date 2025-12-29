import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { Plus, X, Upload, Save, Trash2, Loader, Paperclip } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_BASE_URL || '';

const PurchaseDebitNoteForm = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEdit = Boolean(id);

    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    // Master Data
    const [locations, setLocations] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [items, setItems] = useState([]);
    const [taxes, setTaxes] = useState([]);
    const [units, setUnits] = useState([]); // Needed for display?

    // Form State
    const [formData, setFormData] = useState({
        locationId: '',
        billLedger: 'Purchase',
        supplierId: '',
        debitNoteNumber: '', // User input or auto? Screenshot implies input "DN-00003"
        billNumber: '',
        debitNoteDate: new Date().toISOString().slice(0, 10),
        debitNoteDueDate: new Date().toISOString().slice(0, 10),
        otherReferences: '',
        billOfLading: '',
        motorVehicleNo: '',
        termsAndConditions: '',
        notes: '',
        status: 'OPEN', // Default
        amount: 0, // Calculated
        balanceDue: 0, // Calculated usually same as amount initially
        taxPercentage: 0, // Global tax?
        template: 'Standard',
        emailTo: ''
    });

    const [lines, setLines] = useState([
        {
            itemId: '',
            locationId: '',
            quantity: 1,
            rate: 0,
            discount: 0,
            discountType: 'Flat', // UI state only
            amount: 0,
            taxId: '',
            taxValue: 0, // Rate
            taxAmount: 0
        }
    ]);

    const [attachments, setAttachments] = useState([]); // New files
    const [existingAttachments, setExistingAttachments] = useState([]); // From backend

    useEffect(() => {
        fetchMasterData();
        if (isEdit) {
            loadDebitNote();
        }
    }, [id]);

    // Recalculate totals whenever lines change
    useEffect(() => {
        calculateTotals();
    }, [lines]);

    const fetchMasterData = async () => {
        try {
            const token = localStorage.getItem('token');
            const headers = { Authorization: `Bearer ${token}` };

            const [locRes, suppRes, itemRes, taxRes, unitRes] = await Promise.all([
                axios.get(`${API_URL}/locations`, { headers }),
                axios.get(`${API_URL}/parties`, { headers, params: { type: 'SUPPLIER', page: 0, size: 500 } }),
                axios.get(`${API_URL}/production/raw-materials`, { headers, params: { page: 0, size: 1000 } }),
                axios.get(`${API_URL}/production/taxes`, { headers, params: { page: 0, size: 100 } }),
                axios.get(`${API_URL}/production/units`, { headers, params: { page: 0, size: 500 } })
            ]);

            setLocations(Array.isArray(locRes.data) ? locRes.data : (locRes.data.content || []));
            setSuppliers(suppRes.data.content || suppRes.data || []);
            setItems(itemRes.data.content || itemRes.data || []);
            setTaxes(taxRes.data.content || taxRes.data || []);
            setUnits(unitRes.data.content || unitRes.data || []);

        } catch (err) {
            console.error('Failed to load master data', err);
            setError('Failed to load master data. Please refresh.');
        }
    };

    const loadDebitNote = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${API_URL}/purchase/debit-notes/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = res.data;

            setFormData({
                locationId: data.locationId || '',
                billLedger: data.billLedger || 'Purchase',
                supplierId: data.supplierId || '',
                debitNoteNumber: data.debitNoteNumber || '',
                billNumber: data.billNumber || '',
                debitNoteDate: data.debitNoteDate,
                debitNoteDueDate: data.debitNoteDueDate,
                otherReferences: data.otherReferences || '',
                billOfLading: data.billOfLading || '',
                motorVehicleNo: data.motorVehicleNo || '',
                termsAndConditions: data.termsAndConditions || '',
                notes: data.notes || '',
                status: data.status || 'OPEN',
                amount: data.amount || 0,
                balanceDue: data.balanceDue || 0,
                taxPercentage: data.taxPercentage || 0,
                template: data.template || 'Standard',
                emailTo: data.emailTo || ''
            });

            if (data.items) {
                setLines(data.items.map(i => ({
                    itemId: i.itemId || '',
                    locationId: i.locationId || '',
                    quantity: i.quantity || 1,
                    rate: i.rate || 0,
                    discount: i.discount || 0,
                    discountType: 'Flat', // Default back to flat as we don't store type
                    amount: i.amount || 0,
                    taxId: i.taxId || '',
                    taxValue: i.taxValue || 0,
                    taxAmount: i.taxAmount || 0
                })));
            }

            if (data.attachments) {
                setExistingAttachments(data.attachments.map((path, idx) => ({
                    id: idx, // No real ID from list<string>
                    path: path,
                    fileName: path.split('/').pop() || `File ${idx+1}`
                })));
            }

        } catch (err) {
            console.error('Failed to load debit note', err);
            setError('Could not load debit note details.');
        } finally {
            setLoading(false);
        }
    };

    const handleLineChange = (index, field, value) => {
        const newLines = [...lines];
        const line = { ...newLines[index] };

        line[field] = value;

        // Auto-fill Item Details
        if (field === 'itemId') {
            const selectedItem = items.find(i => i.id == value);
            if (selectedItem) {
                line.rate = selectedItem.price || 0; // Assuming price is available
                // line.locationId = formData.locationId; // Default to header loc? Or keep empty? Screenshot has specific loc.
                // line.taxId = selectedItem.taxId ... if available
            }
        }

        // Tax logic
        if (field === 'taxId') {
            const tax = taxes.find(t => t.id == value);
            line.taxValue = tax ? tax.rate : 0;
        }

        // Calculation
        const qty = Number(line.quantity) || 0;
        const rate = Number(line.rate) || 0;
        let discount = 0;
        
        // Handle Discount
        // If we had input for Discount %, we would calculate here.
        // Assuming 'discount' field is the AMOUNT.
        // If UI allows %, we need separate state for that.
        // But for now, let's treat 'discount' as value.
        // If discountType is %, calculate value.
        // But standard backend approach matches value.
        
        discount = Number(line.discount) || 0;

        let amount = (qty * rate) - discount;
        if (amount < 0) amount = 0;
        line.amount = amount;

        // Tax Amount
        const taxRate = Number(line.taxValue) || 0;
        line.taxAmount = amount * (taxRate / 100);

        newLines[index] = line;
        setLines(newLines);
    };

    const addLine = () => {
        setLines([...lines, {
            itemId: '',
            locationId: formData.locationId || '', // Default to header location
            quantity: 1,
            rate: 0,
            discount: 0,
            amount: 0,
            taxId: '',
            taxValue: 0,
            taxAmount: 0
        }]);
    };

    const removeLine = (index) => {
        if (lines.length > 1) {
            setLines(lines.filter((_, i) => i !== index));
        }
    };

    const calculateTotals = () => {
        let totalAmt = 0;
        let totalTax = 0;

        lines.forEach(l => {
            totalAmt += Number(l.amount) || 0;
            totalTax += Number(l.taxAmount) || 0;
        });
        
        // Does 'amount' in header include tax?
        // Usually headers: SubTotal, TotalTax, Total.
        // Backend 'amount' usually means Total Amount (Payable).
        // Let's set amount = SubTotal + Tax ?? 
        // Screenshot Footer: Sub Total + Total Tax = Total.
        
        setFormData(prev => ({
            ...prev,
            amount: totalAmt + totalTax,
            balanceDue: totalAmt + totalTax // Initially
        }));
    };

    const handleFileChange = (e) => {
        if (e.target.files) {
            setAttachments([...attachments, ...Array.from(e.target.files)]);
        }
    };

    const removeAttachment = (index) => {
        setAttachments(attachments.filter((_, i) => i !== index));
    };

    const removeExistingAttachment = (idx) => {
        setExistingAttachments(existingAttachments.filter((_, i) => i !== idx));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');

        if (!formData.locationId || !formData.supplierId || !formData.billNumber) {
            setError('Please fill in all required fields (Location, Supplier, Bill Number).');
            setSubmitting(false);
            window.scrollTo(0, 0);
            return;
        }

        try {
            const token = localStorage.getItem('token');
            
            const requestData = {
                ...formData,
                items: lines.map(l => ({
                    itemId: l.itemId,
                    locationId: l.locationId,
                    quantity: Number(l.quantity),
                    rate: Number(l.rate),
                    discount: Number(l.discount),
                    amount: Number(l.amount), // Net amount
                    taxId: l.taxId || null,
                    taxValue: Number(l.taxValue),
                    taxAmount: Number(l.taxAmount)
                })),
                attachments: existingAttachments.map(a => a.path) // Send back kept paths
            };

            const payload = new FormData();
            payload.append('request', new Blob([JSON.stringify(requestData)], { type: 'application/json' }));
            
            attachments.forEach(file => {
                payload.append('files', file);
            });

            if (isEdit) {
                await axios.put(`${API_URL}/purchase/debit-notes/${id}`, payload, {
                    headers: { 
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'multipart/form-data'
                    }
                });
            } else {
                await axios.post(`${API_URL}/purchase/debit-notes`, payload, {
                    headers: { 
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'multipart/form-data'
                    }
                });
            }

            navigate('/purchase-dashboard/debit-notes');
        } catch (err) {
            console.error('Submit failed', err);
            setError('Failed to save debit note. ' + (err.response?.data?.message || err.message));
            window.scrollTo(0, 0);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="flex justify-center p-10"><Loader className="animate-spin text-blue-500" /></div>;

    const subTotal = lines.reduce((sum, l) => sum + (Number(l.amount) || 0), 0);
    const totalTax = lines.reduce((sum, l) => sum + (Number(l.taxAmount) || 0), 0);
    const totalPayable = subTotal + totalTax;

    return (
        <div className="p-6 max-w-[1600px] mx-auto bg-slate-50 min-h-screen font-sans text-sm">
             {/* Header Title */}
             <div className="bg-sky-500 text-white px-4 py-3 text-lg font-medium shadow-sm mb-6 rounded">
                <Link to="/purchase-dashboard/debit-notes" className="hover:underline text-sky-100 mr-2">Debit Notes</Link> / {isEdit ? 'Edit Debit Note' : 'Create Debit Notes'}
            </div>

            <form onSubmit={handleSubmit} className="bg-white shadow-sm border rounded p-6 space-y-6">
                {error && <div className="p-3 bg-red-100 text-red-700 rounded text-sm">{error}</div>}

                {/* Top Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                    {/* Location */}
                    <div className="grid grid-cols-[150px_1fr] items-center">
                        <label className="text-xs font-bold text-slate-700">Location <span className="text-red-500">*</span></label>
                        <select 
                            className="w-full border border-gray-300 rounded px-3 py-2 bg-gray-50 focus:outline-none focus:border-sky-500"
                            value={formData.locationId}
                            onChange={e => setFormData({...formData, locationId: e.target.value})}
                            required
                        >
                            <option value="">Select Location</option>
                            {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                        </select>
                    </div>

                    {/* Bill Ledger */}
                    <div className="grid grid-cols-[150px_1fr] items-center">
                        <label className="text-xs font-bold text-slate-700">Bill Ledgers</label>
                        <select 
                             className="w-full border border-gray-300 rounded px-3 py-2 bg-gray-50 focus:outline-none focus:border-sky-500"
                             value={formData.billLedger}
                             onChange={e => setFormData({...formData, billLedger: e.target.value})}
                        >
                            <option value="Purchase">Purchase</option>
                        </select>
                    </div>

                    {/* Supplier */}
                    <div className="grid grid-cols-[150px_1fr] items-center col-span-1 md:col-span-2">
                        <label className="text-xs font-bold text-slate-700">Supplier Name <span className="text-red-500">*</span></label>
                        <div className="flex gap-2 w-full">
                            <select 
                                className="flex-1 border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-sky-500"
                                value={formData.supplierId}
                                onChange={e => setFormData({...formData, supplierId: e.target.value})}
                                required
                            >
                                <option value="">Select Supplier</option>
                                {suppliers.map(s => <option key={s.id} value={s.id}>{s.companyName || s.name}</option>)}
                            </select>
                            <div className="px-3 py-2 bg-sky-500 text-white font-bold rounded text-xs">AED</div>
                        </div>
                    </div>

                    {/* Debit Note # */}
                    <div className="grid grid-cols-[150px_1fr] items-center">
                        <label className="text-xs font-bold text-slate-700">Debit Notes#</label>
                        <input 
                            type="text" 
                            className="w-full border border-gray-300 rounded px-3 py-2 focus:outine-none"
                            value={formData.debitNoteNumber}
                            onChange={e => setFormData({...formData, debitNoteNumber: e.target.value})}
                            placeholder="DN-XXXX"
                        />
                    </div>

                    {/* Bill Number */}
                    <div className="grid grid-cols-[150px_1fr] items-center">
                        <label className="text-xs font-bold text-slate-700">Bill Number <span className="text-red-500">*</span></label>
                        <input 
                            type="text" 
                            className="w-full border border-gray-300 rounded px-3 py-2 focus:outine-none"
                            value={formData.billNumber}
                            onChange={e => setFormData({...formData, billNumber: e.target.value})}
                            required
                        />
                    </div>

                    {/* Dates */}
                    <div className="grid grid-cols-[150px_1fr] items-center">
                        <label className="text-xs font-bold text-slate-700">Debit Notes Date</label>
                        <input 
                            type="date" 
                            className="w-full border border-gray-300 rounded px-3 py-2 focus:outine-none"
                            value={formData.debitNoteDate}
                            onChange={e => setFormData({...formData, debitNoteDate: e.target.value})}
                        />
                    </div>

                    <div className="grid grid-cols-[150px_1fr] items-center">
                        <label className="text-xs font-bold text-slate-700">Debit Notes Due Date</label>
                        <input 
                            type="date" 
                            className="w-full border border-gray-300 rounded px-3 py-2 focus:outine-none"
                            value={formData.debitNoteDueDate}
                            onChange={e => setFormData({...formData, debitNoteDueDate: e.target.value})}
                        />
                    </div>

                    {/* Other Refs */}
                    <div className="grid grid-cols-[150px_1fr] items-center">
                         <label className="text-xs font-bold text-slate-700">Other References</label>
                         <input 
                            type="text" 
                            className="w-full border border-gray-300 rounded px-3 py-2 focus:outine-none"
                            value={formData.otherReferences}
                            onChange={e => setFormData({...formData, otherReferences: e.target.value})}
                        />
                    </div>

                    <div className="grid grid-cols-[150px_1fr] items-center">
                         <label className="text-xs font-bold text-slate-700">Bill of Lading/LR-RR No.</label>
                         <input 
                            type="text" 
                            className="w-full border border-gray-300 rounded px-3 py-2 focus:outine-none"
                            value={formData.billOfLading}
                            onChange={e => setFormData({...formData, billOfLading: e.target.value})}
                        />
                    </div>

                    <div className="grid grid-cols-[150px_1fr] items-center">
                         <label className="text-xs font-bold text-slate-700">Motor Vehicle No.</label>
                         <input 
                            type="text" 
                            className="w-full border border-gray-300 rounded px-3 py-2 focus:outine-none"
                            value={formData.motorVehicleNo}
                            onChange={e => setFormData({...formData, motorVehicleNo: e.target.value})}
                        />
                    </div>
                </div>

                {/* Items Table */}
                <div className="overflow-x-auto border rounded mt-6">
                    <table className="w-full min-w-[1000px] border-collapse">
                        <thead>
                            <tr className="bg-gray-100 text-xs font-bold text-slate-700 border-b">
                                <th className="p-2 text-left w-64">Item Details</th>
                                <th className="p-2 text-left w-48">Quantity</th>
                                <th className="p-2 text-left w-24">Rate</th>
                                <th className="p-2 text-left w-24">Discount</th>
                                <th className="p-2 text-left w-24">Amount</th>
                                <th className="p-2 text-left w-24">Tax Value</th>
                                <th className="p-2 text-left w-24">Tax Amount</th>
                                <th className="p-2 text-center w-16">Delete</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm">
                            {lines.map((l, idx) => (
                                <tr key={idx} className="border-b hover:bg-gray-50 align-top">
                                    <td className="p-2">
                                        <select 
                                            className="w-full border rounded px-2 py-1.5 mb-1"
                                            value={l.itemId}
                                            onChange={e => handleLineChange(idx, 'itemId', e.target.value)}
                                        >
                                            <option value="">Select Item</option>
                                            {items.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                                        </select>
                                        <textarea 
                                            className="w-full border rounded px-2 py-1 text-xs h-8 resize-none"
                                            placeholder="Description..."
                                            disabled // Description not in backend item request right now?
                                        />
                                    </td>
                                    <td className="p-2">
                                        <div className="grid grid-cols-2 gap-1 mb-1">
                                            <span className="text-[10px] font-bold text-gray-500">Location</span>
                                            <span className="text-[10px] font-bold text-gray-500">Qty</span>
                                        </div>
                                        <div className="flex gap-1">
                                            <select 
                                                className="w-full border rounded px-1 py-1 text-xs"
                                                value={l.locationId}
                                                onChange={e => handleLineChange(idx, 'locationId', e.target.value)}
                                            >
                                                <option value="">Loc</option>
                                                {locations.map(loc => <option key={loc.id} value={loc.id}>{loc.name}</option>)}
                                            </select>
                                            <input 
                                                type="number" 
                                                className="w-16 border rounded px-1 py-1 text-right"
                                                value={l.quantity}
                                                onChange={e => handleLineChange(idx, 'quantity', e.target.value)}
                                            />
                                        </div>
                                    </td>
                                    <td className="p-2 pt-8">
                                        <input 
                                            type="number" 
                                            className="w-full border rounded px-2 py-1 text-right"
                                            value={l.rate}
                                            onChange={e => handleLineChange(idx, 'rate', e.target.value)}
                                        />
                                    </td>
                                    <td className="p-2 pt-8">
                                        <div className="flex gap-1">
                                            <input 
                                                type="number" 
                                                className="w-full border rounded px-2 py-1 text-right"
                                                value={l.discount}
                                                onChange={e => handleLineChange(idx, 'discount', e.target.value)}
                                            />
                                            {/* Optional: Dropdown for % if needed in future */}
                                        </div>
                                    </td>
                                    <td className="p-2 pt-8">
                                        <div className="font-medium text-right text-gray-700">
                                            {Number(l.amount).toFixed(2)}
                                        </div>
                                    </td>
                                    <td className="p-2 pt-8">
                                         <div className="flex items-center gap-1">
                                            <span className="text-xs">VAT</span>
                                            <select 
                                                className="w-16 border rounded px-1 py-1 text-xs"
                                                value={l.taxId}
                                                onChange={e => handleLineChange(idx, 'taxId', e.target.value)}
                                            >
                                                <option value="">0</option>
                                                {taxes.map(t => <option key={t.id} value={t.id}>{t.rate}</option>)}
                                            </select>
                                            <span className="text-xs">%</span>
                                        </div>
                                    </td>
                                    <td className="p-2 pt-8">
                                        <div className="text-right text-gray-700">{Number(l.taxAmount).toFixed(2)}</div>
                                    </td>
                                    <td className="p-2 pt-8 text-center">
                                         <button type="button" onClick={() => removeLine(idx)} className="text-red-500 hover:text-red-700">
                                            <Trash2 size={16} />
                                         </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <div className="p-2 bg-gray-50 border-t">
                        <button type="button" onClick={addLine} className="text-blue-600 text-xs font-bold flex items-center gap-1">
                            <Plus size={14} /> Add Line
                        </button>
                    </div>
                </div>

                {/* Footer Totals */}
                <div className="flex flex-col md:flex-row justify-end gap-12 mt-4 pr-6">
                    <div className="text-right space-y-2 text-sm">
                        <div className="flex justify-between gap-12 border-b pb-1">
                            <span className="font-bold text-gray-600">Sub Total</span>
                            <span>{subTotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between gap-12 border-b pb-1">
                            <span className="font-bold text-gray-600">Total Tax</span>
                            <span>{totalTax.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between gap-12 border-b pb-1">
                            <span className="font-bold text-gray-600">Other Charges</span>
                            <span>0.00</span> {/* Placeholder if needed */}
                        </div>
                        <div className="flex justify-between gap-12 pt-2 text-lg font-bold text-gray-800">
                            <span>Total</span>
                            <span>{totalPayable.toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                {/* Attachments & Bottom Actions */}
                <div className="border-t pt-6">
                    <div className="mb-4">
                        <label className="block text-sm font-bold text-gray-700 mb-2">Attach File(s)</label>
                         <div className="flex items-center gap-4">
                              <label className="cursor-pointer bg-slate-100 border px-3 py-2 rounded flex items-center gap-2 hover:bg-slate-200 text-sm">
                                  <Upload size={16} /> Upload Files
                                  <input type="file" multiple onChange={handleFileChange} className="hidden" />
                              </label>
                              <span className="text-xs text-gray-500">
                                  {attachments.length} new file(s) selected
                              </span>
                         </div>
                         <div className="mt-2 space-y-1">
                             {existingAttachments.map((a, i) => (
                                 <div key={i} className="flex items-center gap-2 text-sm text-blue-600">
                                     <Paperclip size={14} />
                                     <a href={a.path || '#'} target="_blank" rel="noreferrer" className="hover:underline">{a.fileName}</a>
                                     <button type="button" onClick={() => removeExistingAttachment(i)} className="text-red-500 ml-2"><X size={14}/></button>
                                 </div>
                             ))}
                             {attachments.map((f, i) => (
                                 <div key={`new-${i}`} className="flex items-center gap-2 text-sm text-gray-700">
                                     <Paperclip size={14} /> {f.name}
                                     <button type="button" onClick={() => removeAttachment(i)} className="text-red-500 ml-2"><X size={14}/></button>
                                 </div>
                             ))}
                         </div>
                    </div>

                    <div className="flex justify-end gap-3">
                        <button 
                            type="button" 
                            onClick={() => navigate('/purchase-dashboard/debit-notes')}
                            className="px-6 py-2 border rounded text-gray-700 hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit" 
                            disabled={submitting}
                            className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2"
                        >
                            {submitting ? <Loader className="animate-spin" size={16} /> : <Save size={16} />}
                            {isEdit ? 'Update' : 'Save'}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default PurchaseDebitNoteForm;
