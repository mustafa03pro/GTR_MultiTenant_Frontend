import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

const PurchasePaymentForm = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const isEditing = Boolean(id);

    const [form, setForm] = useState({
        supplierId: '',
        amount: '',
        paymentDate: new Date().toISOString().split('T')[0],
        paymentMode: 'Cash',
        reference: '',
        notes: '',
        payFullAmount: false,
        taxDeducted: false,
        tdsAmount: '',
        tdsSection: '',
        paidThrough: '',
        chequeNumber: '',
        allocations: []
    });

    const [suppliers, setSuppliers] = useState([]);
    const [unpaidInvoices, setUnpaidInvoices] = useState([]);
    const [attachments, setAttachments] = useState([]);
    const [newFiles, setNewFiles] = useState([]);
    const [loading, setLoading] = useState(false);

    // Derived states
    const [totalUnpaid, setTotalUnpaid] = useState(0);

    useEffect(() => {
        fetchSuppliers();
        if (isEditing) {
            fetchPayment();
        }
    }, [id]);

    useEffect(() => {
        // Pre-fill from navigation state
        if (!isEditing && location.state) {
            const { supplierId, amount, reference, notes, fromPo } = location.state;
            if (supplierId) {
                setForm(prev => ({
                    ...prev,
                    supplierId,
                    amount: amount || '',
                    reference: reference || '',
                    notes: notes || ''
                }));
                fetchUnpaidInvoices(supplierId);
            }
        }
    }, [location.state, isEditing]);


    const fetchSuppliers = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${API_URL}/parties`, {
                headers: { Authorization: `Bearer ${token}` },
                params: { page: 0, size: 1000 }
            });
            setSuppliers(res.data.content || []);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchPayment = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const res = await axios.get(`${API_URL}/purchases/payments/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = res.data;
            setForm({
                supplierId: data.supplierId,
                amount: data.amount,
                paymentDate: data.paymentDate,
                paymentMode: data.paymentMode || 'Cash',
                reference: data.reference || '',
                notes: data.notes || '',
                payFullAmount: data.payFullAmount || false,
                taxDeducted: data.taxDeducted || false,
                tdsAmount: data.tdsAmount || '',
                tdsSection: data.tdsSection || '',
                paidThrough: data.paidThrough || '',
                chequeNumber: data.chequeNumber || '',
                allocations: data.allocations || []
            });
            
            // Backend returns attachments list in 'attachments' field
            if (data.attachments) {
                 // Map to format we can display and use
                 setAttachments(data.attachments);
            }

            if (data.supplierId) {
                // Fetch invoices. Note: If editing, we might need to be careful not to exclude the invoices already paid by this payment.
                // The logical assumption: 'unpaid-invoices' endpoint returns currently unpaid ones. 
                // We need to manually add back the ones this payment allocated if they are fully paid now, 
                // OR the endpoint logic accounts for this if we pass paymentId? (Backend 'getUnpaidInvoices' doesn't take paymentId).
                // So, we rely on 'allocations' from the payment to show what was paid.
                // We will fetch unpaid invoices to show *other* available bills.
                // And for the ones already in 'allocations', we should ensure they are in the list.
                
                await fetchUnpaidInvoices(data.supplierId, data.allocations);
            }
        } catch (err) {
            alert('Failed to load payment');
        } finally {
            setLoading(false);
        }
    };

    const fetchUnpaidInvoices = async (supplierId, existingAllocations = []) => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${API_URL}/purchases/payments/unpaid-invoices`, {
                headers: { Authorization: `Bearer ${token}` },
                params: { supplierId }
            });
            
            let invoices = res.data.map(inv => ({
                ...inv,
                thisAllocation: 0
            }));

            // If we have existing allocations (Editing mode), we need to make sure these invoices are in the list.
            // If the invoice is fully paid (balance=0), it might not be in 'unpaid-invoices'.
            // However, since we don't have a way to fetch *any* invoice by ID easily without N+1 calls,
            // we will try to rely on what we have. 
            // Better approach: backend should probably support fetching 'relevant invoices for payment'.
            // For now, we will just map what matches.
            
            if (existingAllocations.length > 0) {
                 // For each existing allocation, if the invoice is in the list, update 'thisAllocation'.
                 invoices = invoices.map(inv => {
                    const alloc = existingAllocations.find(a => a.invoiceId === inv.id);
                     if (alloc) {
                         // The balance returned by 'unpaid-invoices' is the current balance.
                         // But for editing a payment, the "effective balance before this payment" was: Balance + AllocatedAmount.
                         // So we should add the allocated amount back to the balance for display purposes?
                         // BUT: if the invoice is fully paid, it might not be in the list at all.
                         // Assuming the user only edits allocation amounts for now or adds new ones from unpaid list.
                         return { 
                             ...inv, 
                             thisAllocation: alloc.allocatedAmount,
                             // Adjust balance to show what it would be without this payment? 
                             // balance: inv.balance + alloc.allocatedAmount 
                         };
                     }
                     return inv;
                 });
                 
                 // Note: If an allocated invoice is NOT in the list (because it's fully paid), we lose it here.
                 // This is a limitation of the current 'unpaid-invoices' endpoint.
                 // We will proceed with this limitation for now or ask user if this is critical.
                 // Ideally, we would inject the allocated invoice details from the 'allocations' list itself into 'unpaidInvoices'
                 // but the allocation object might not have all invoice details (date, bill number etc) unless backend sends it.
                 // Checking backend DTO: PurPurchasePaymentAllocationResponse has invoiceId, invoiceNumber. 
                 // It lacks date, netTotal. So we can't fully reconstruct the row.
                 // We will rely on what is available.
            }

            setUnpaidInvoices(invoices);
            const total = invoices.reduce((sum, inv) => sum + (inv.balance || 0), 0);
            setTotalUnpaid(total);

        } catch (err) {
            console.error(err);
        }
    };

    const handleSupplierChange = (e) => {
        const sid = e.target.value;
        setForm(prev => ({ ...prev, supplierId: sid, allocations: [] }));
        setUnpaidInvoices([]);
        if (sid) fetchUnpaidInvoices(sid);
    };

    const handleAllocationChange = (invoiceId, amount) => {
        const val = parseFloat(amount) || 0;
        setUnpaidInvoices(prev => prev.map(inv => 
            inv.id === invoiceId ? { ...inv, thisAllocation: val } : inv
        ));
    };

    const handleFileChange = (e) => {
        setNewFiles([...e.target.files]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.supplierId || !form.amount || !form.paymentDate || !form.paidThrough) {
             alert('Please fill required fields');
             return;
        }

        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const allocations = unpaidInvoices
                .filter(inv => inv.thisAllocation > 0)
                .map(inv => ({
                    invoiceId: inv.id,
                    allocatedAmount: inv.thisAllocation
                }));

            const formData = new FormData();

            if (isEditing) {
                // UPDATE: Backend expects @RequestPart("request") JSON blob
                const payload = {
                    ...form,
                    allocations,
                    attachments: attachments // Send back existing attachments to keep them
                };
                formData.append('request', new Blob([JSON.stringify(payload)], { type: 'application/json' }));
                
                // For update, files go as "attachments"
                newFiles.forEach(f => {
                    formData.append('attachments', f);
                });

                await axios.put(`${API_URL}/purchases/payments/${id}`, formData, {
                    headers: { 
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'multipart/form-data'
                    }
                });
            } else {
                // CREATE: Backend expects @ModelAttribute (flat form fields)
                // Append simple fields
                formData.append('supplierId', form.supplierId || '');
                formData.append('amount', form.amount || '0');
                formData.append('payFullAmount', form.payFullAmount || false);
                formData.append('taxDeducted', form.taxDeducted || false);
                formData.append('tdsAmount', form.tdsAmount || '0');
                formData.append('tdsSection', form.tdsSection || '');
                formData.append('paymentDate', form.paymentDate || '');
                formData.append('paymentMode', form.paymentMode || '');
                formData.append('paidThrough', form.paidThrough || '');
                formData.append('reference', form.reference || '');
                formData.append('chequeNumber', form.chequeNumber || '');
                formData.append('notes', form.notes || '');
                formData.append('createdBy', form.createdBy || 'Admin');

                // Append allocations with indexed notation
                allocations.forEach((alloc, index) => {
                    formData.append(`allocations[${index}].invoiceId`, alloc.invoiceId);
                    formData.append(`allocations[${index}].allocatedAmount`, alloc.allocatedAmount);
                });

                // For create, files go as "files"
                newFiles.forEach(f => {
                    formData.append('files', f);
                });

                await axios.post(`${API_URL}/purchases/payments`, formData, {
                    headers: { 
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'multipart/form-data'
                    }
                });
            }
            navigate('/purchase-dashboard/payments');
        } catch (err) {
            alert('Error saving payment: ' + (err.response?.data?.message || err.message));
        } finally {
            setLoading(false);
        }
    };

    // Calculate totals
    const totalAllocated = unpaidInvoices.reduce((sum, inv) => sum + (parseFloat(inv.thisAllocation) || 0), 0);
    const amountVal = parseFloat(form.amount) || 0;
    const excess = Math.max(0, amountVal - totalAllocated);

    useEffect(() => {
        if (form.payFullAmount && totalUnpaid > 0) {
            setForm(prev => ({ ...prev, amount: totalUnpaid.toFixed(2) })); // fixed to 2 decimals
        }
    }, [form.payFullAmount, totalUnpaid]);

    return (
        <div className="p-6 bg-gray-50 min-h-screen font-sans text-sm">
            {/* Header */}
            <div className="bg-sky-500 text-white px-6 py-3 rounded-t-md shadow-sm mb-6 flex justify-between items-center">
                <h1 className="text-xl font-semibold">{isEditing ? 'Edit Payment' : 'Add New Payments Made'}</h1>
            </div>

            <form onSubmit={handleSubmit} className="bg-white p-6 shadow rounded-md">
                
                {/* Top Section Grid */}
                <div className="grid grid-cols-12 gap-y-4 gap-x-6 mb-8">
                    
                    {/* Supplier */}
                    <div className="col-span-12 md:col-span-6 flex items-center">
                        <label className="w-1/3 text-gray-700 font-medium">Party / Supplier <span className="text-red-500">*</span></label>
                        <div className="flex-1 flex gap-2">
                             <select 
                                className="w-full border border-gray-300 rounded p-1.5 focus:outline-none focus:border-sky-500"
                                value={form.supplierId}
                                onChange={handleSupplierChange}
                                required
                            >
                                <option value="">Select or Type Here...</option>
                                {suppliers.map(s => (
                                    <option key={s.id} value={s.id}>
                                        {s.companyName || s.name} {s.code ? `(${s.code})` : ''} - {s.eventType || s.type}
                                    </option>
                                ))}
                            </select>
                            <button type="button" className="bg-sky-600 text-white px-3 py-1 rounded text-xs">AED</button>
                        </div>
                    </div>

                    {/* Spacer / Right side could have "View Payment History" */}
                    <div className="col-span-12 md:col-span-6 flex justify-end">
                         {form.supplierId && <button type="button" className="text-sky-600 hover:underline text-xs">View Payment History</button>}
                    </div>

                    {/* Amount */}
                    <div className="col-span-12 md:col-span-6 flex items-start">
                        <label className="w-1/3 text-gray-700 font-medium mt-1.5">Amount <span className="text-red-500">*</span></label>
                        <div className="flex-1">
                            <div className="flex items-center gap-2">
                                 <div className="bg-yellow-300 px-2 py-1 rounded font-bold w-1/3 text-center text-xs">
                                      AED
                                 </div>
                                 <input 
                                    type="number" 
                                    className="w-full border border-gray-300 rounded p-1.5 focus:outline-none focus:border-sky-500"
                                    value={form.amount}
                                    onChange={e => setForm({...form, amount: e.target.value})}
                                    required
                                    step="0.01"
                                />
                            </div>
                            <div className="mt-2 flex items-center gap-2">
                                <input 
                                    type="checkbox" 
                                    id="payFull" 
                                    checked={form.payFullAmount}
                                    onChange={e => setForm({...form, payFullAmount: e.target.checked})}
                                    className="accent-sky-500"
                                />
                                <label htmlFor="payFull" className="text-gray-600 text-xs">Pay full amount ({totalUnpaid.toFixed(2)})</label>
                            </div>
                        </div>
                    </div>

                    {/* Tax Deducted */}
                    <div className="col-span-12 md:col-span-12 flex items-center">
                        <label className="w-1/6 text-gray-700 font-medium">Tax deducted?</label>
                        <div className="flex-1 flex items-center gap-4">
                             <div className="flex items-center gap-2">
                                <input 
                                    type="checkbox"
                                    id="taxDed"
                                    checked={form.taxDeducted}
                                    onChange={e => setForm({...form, taxDeducted: e.target.checked})}
                                    className="accent-sky-500"
                                />
                                <label htmlFor="taxDed" className="text-gray-600">Yes, the customer has deducted tax</label>
                             </div>
                             
                             {form.taxDeducted && (
                                <div className="flex items-center gap-2 border bg-gray-50 p-2 rounded ml-4">
                                     <span className="text-gray-600 text-xs">TDS Amount</span>
                                     <input 
                                        type="number"
                                        className="border border-gray-300 rounded p-1 w-24 text-xs"
                                        value={form.tdsAmount}
                                        onChange={e => setForm({...form, tdsAmount: e.target.value})}
                                     />
                                     <span className="text-gray-600 text-xs ml-2">Section <span className="text-red-500">*</span></span>
                                     <select
                                        className="border border-gray-300 rounded p-1 w-32 text-xs"
                                        value={form.tdsSection}
                                        onChange={e => setForm({...form, tdsSection: e.target.value})}
                                     >
                                         <option value="">Select...</option>
                                         <option value="194C">194C</option>
                                         <option value="194J">194J</option>
                                         <option value="194H">194H</option>
                                         <option value="194I">194I</option>
                                     </select>
                                </div>
                             )}
                        </div>
                    </div>

                    {/* Payment Date */}
                    <div className="col-span-12 md:col-span-6 flex items-center">
                        <label className="w-1/3 text-gray-700 font-medium">Payment Date <span className="text-red-500">*</span></label>
                        <input 
                            type="date"
                            className="flex-1 border border-gray-300 rounded p-1.5 focus:outline-none focus:border-sky-500"
                            value={form.paymentDate}
                            onChange={e => setForm({...form, paymentDate: e.target.value})}
                            required
                        />
                    </div>

                    {/* Payment Mode */}
                    <div className="col-span-12 md:col-span-6 flex items-center">
                        <label className="w-1/3 text-gray-700 font-medium">Payment Mode</label>
                        <select 
                            className="flex-1 border border-gray-300 rounded p-1.5 focus:outline-none focus:border-sky-500"
                            value={form.paymentMode}
                            onChange={e => setForm({...form, paymentMode: e.target.value})}
                        >
                            <option value="Cash">Cash</option>
                            <option value="Bank Transfer">Bank Transfer</option>
                            <option value="Cheque">Cheque</option>
                            <option value="Credit Card">Credit Card</option>
                        </select>
                    </div>

                    {/* Paid Through */}
                    <div className="col-span-12 md:col-span-6 flex items-center">
                        <label className="w-1/3 text-gray-700 font-medium">Paid Through <span className="text-red-500">*</span></label>
                        <select 
                            className="flex-1 border border-gray-300 rounded p-1.5 focus:outline-none focus:border-sky-500"
                            value={form.paidThrough}
                            onChange={e => setForm({...form, paidThrough: e.target.value})}
                            required
                        >
                            <option value="">Select...</option>
                            <option value="Petty Cash">Petty Cash</option>
                            <option value="Undeposited Funds">Undeposited Funds</option>
                            <option value="Employee Advance">Employee Advance</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>

                    {/* Reference */}
                    <div className="col-span-12 md:col-span-6 flex items-center">
                        <label className="w-1/3 text-gray-700 font-medium">Reference</label>
                         <input 
                            type="text"
                            className="flex-1 border border-gray-300 rounded p-1.5 focus:outline-none focus:border-sky-500"
                            value={form.reference}
                            onChange={e => setForm({...form, reference: e.target.value})}
                        />
                    </div>
                    
                    {/* Cheque Number */}
                     <div className="col-span-12 md:col-span-6 flex items-center">
                        <label className="w-1/3 text-gray-700 font-medium">Cheque Number</label>
                         <input 
                            type="text"
                            className="flex-1 border border-gray-300 rounded p-1.5 focus:outline-none focus:border-sky-500"
                            value={form.chequeNumber}
                            onChange={e => setForm({...form, chequeNumber: e.target.value})}
                        />
                    </div>

                </div>

                <div className="border-t border-gray-200 my-6"></div>

                {/* Unpaid Bill Section */}
                <h2 className="text-lg font-semibold mb-4 text-gray-800">Unpaid Bill</h2>
                
                <div className="overflow-x-auto border border-gray-200 rounded mb-6">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-100 border-b">
                            <tr>
                                <th className="p-3 font-medium text-gray-600">Date</th>
                                <th className="p-3 font-medium text-gray-600">Bill Number</th>
                                <th className="p-3 font-medium text-gray-600">Bill Amount</th>
                                <th className="p-3 font-medium text-gray-600">Due Amount</th>
                                <th className="p-3 font-medium text-gray-600 w-32">Payment</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {unpaidInvoices.length === 0 ? (
                                <tr><td colSpan="5" className="p-4 text-center text-gray-500">No unpaid bills found (or select a supplier)</td></tr>
                            ) : (
                                unpaidInvoices.map(inv => (
                                    <tr key={inv.id} className="hover:bg-gray-50">
                                        <td className="p-3 text-gray-700">{inv.billDate}</td>
                                        <td className="p-3 text-sky-600">{inv.billNumber}</td>
                                        <td className="p-3 text-gray-700">{inv.netTotal}</td>
                                        <td className="p-3 text-gray-700">{inv.balance}</td>
                                        <td className="p-3">
                                            <input 
                                                type="number"
                                                className="border border-gray-300 rounded p-1 w-full focus:border-sky-500 text-right"
                                                value={inv.thisAllocation || ''}
                                                onChange={e => handleAllocationChange(inv.id, e.target.value)}
                                            />
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                        <tfoot className="bg-gray-50 font-medium">
                            <tr>
                                <td colSpan="4" className="p-3 text-right">Total Allocated</td>
                                <td className="p-3 text-right">{totalAllocated.toFixed(2)}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>

                {/* Bottom Section: Summary & Notes */}
                <div className="grid grid-cols-12 gap-8">
                    
                    {/* Left: Notes & Attachments */}
                    <div className="col-span-12 md:col-span-8">
                         <div className="mb-4">
                            <label className="block text-gray-700 font-medium mb-1">Notes (Internal use. Not visible to Supplier)</label>
                            <textarea 
                                className="w-full border border-gray-300 rounded p-2 focus:outline-none focus:border-sky-500 h-24"
                                value={form.notes}
                                onChange={e => setForm({...form, notes: e.target.value})}
                            ></textarea>
                         </div>
                         
                         <div className="mb-4">
                            <label className="block text-gray-700 font-medium mb-1">Attach File(s)</label>
                            <div className="flex flex-col gap-2">
                                <label className="cursor-pointer bg-gray-100 border border-gray-300 px-3 py-1.5 rounded text-gray-700 text-sm hover:bg-gray-200 w-fit">
                                    Choose File
                                    <input type="file" multiple className="hidden" onChange={handleFileChange} />
                                </label>
                                <span className="text-gray-500 text-xs">
                                    {newFiles.length > 0 ? `${newFiles.length} file(s) chosen` : 'No file chosen'}
                                </span>
                            </div>
                            <div className="text-xs text-start text-gray-400 mt-1">You can upload a maximum of 5 files, 5MB each</div>
                            
                            {/* Existing attachments */}
                            {attachments.length > 0 && (
                                <div className="mt-2 text-sm text-gray-600">
                                    <p className="font-semibold text-xs text-gray-500 uppercase">Attached:</p>
                                    <ul className="list-disc pl-5 mt-1">
                                        {attachments.map(att => (
                                            <li key={att.id}>
                                                <a href={att.url} target="_blank" rel="noreferrer" className="text-sky-600 hover:underline">{att.fileName}</a>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                         </div>
                    </div>

                    {/* Right: Summary Table */}
                    <div className="col-span-12 md:col-span-4">
                        <div className="bg-gray-50 border border-gray-200 rounded p-4 text-sm">
                             <div className="flex justify-between py-2 border-b border-gray-200">
                                 <span className="text-gray-600">Amount Paid</span>
                                 <span className="font-semibold">{amountVal.toFixed(2)}</span>
                             </div>
                             <div className="flex justify-between py-2 border-b border-gray-200">
                                 <span className="text-gray-600">Amount used for payments</span>
                                 <span className="text-gray-800">{totalAllocated.toFixed(2)}</span>
                             </div>
                             <div className="flex justify-between py-2 border-b border-gray-200">
                                 <span className="text-gray-600">Amount Refunded</span>
                                 <span className="text-gray-800">0.00</span> 
                             </div>
                             <div className="flex justify-between py-2">
                                 <span className="text-gray-600">Amount in excess</span>
                                 <span className="text-green-600 font-semibold">{excess.toFixed(2)}</span>
                             </div>
                        </div>
                    </div>
                </div>


                {/* Dynamic Fields Note */}
                <div className="bg-yellow-50 border border-yellow-200 p-2 rounded text-xs text-yellow-800 mt-4 mb-6">
                    Additional Fields: Start adding custom fields for your payments received by going to Settings - Preferences - Payments Made.
                </div>

                {/* Footer Buttons */}
                <div className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 p-4 flex gap-4 pl-64 z-10 shadow-[0_-2px_4px_rgba(0,0,0,0.1)]"> 
                    <button 
                        type="submit" 
                        disabled={loading}
                        className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded shadow-sm font-medium"
                    >
                        {loading ? 'Saving...' : 'Save'}
                    </button>
                    <button 
                        type="button" 
                        onClick={() => navigate('/purchase-dashboard/payments')}
                        className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-2 rounded shadow-sm font-medium border border-gray-300"
                    >
                        Cancel
                    </button>
                </div>
                <div className="h-16"></div> {/* Spacer for fixed footer */}

            </form>
        </div>
    );
};

export default PurchasePaymentForm;
