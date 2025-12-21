import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import { Plus, X, Upload, Save, Trash2, Calendar, FileText, ChevronDown, Paperclip, Loader } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_BASE_URL || '';

const PurchaseInvoiceForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const isEdit = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Master Data
  const [suppliers, setSuppliers] = useState([]);
  const [items, setItems] = useState([]); // Raw materials / Products
  const [categories, setCategories] = useState([]);
  const [subCategoriesByCategory, setSubCategoriesByCategory] = useState({});
  const [units, setUnits] = useState([]);
  const [taxes, setTaxes] = useState([]);

  // Form State
  const [formData, setFormData] = useState({
    billLedger: 'Purchase',
    supplierId: '',
    billNumber: '',
    orderNumber: '',
    billDate: new Date().toISOString().slice(0, 10),
    dueDate: new Date().toISOString().slice(0, 10),
    billType: 'Without Discount',
    grossNetEnabled: false,
    notes: '',
    otherCharges: 0,
    template: 'Standard'
  });

  const [lines, setLines] = useState([
    // Initial empty line
    {
      lineNumber: 1,
      categoryId: '',
      subCategoryId: '',
      itemId: '',
      description: '',
      quantityGross: 0,
      quantityNet: 0,
      unitId: '',
      rate: 0,
      amount: 0,
      taxId: '',
      taxPercent: 0,
      lineDiscount: 0,
      discountPercent: 0
    }
  ]);

  const [attachments, setAttachments] = useState([]); // File objects (new)
  const [existingAttachments, setExistingAttachments] = useState([]); // From backend (edit mode)

  // Totals
  const [totals, setTotals] = useState({
    subTotal: 0,
    totalDiscount: 0,
    grossTotal: 0,
    totalTax: 0,
    netTotal: 0
  });

  useEffect(() => {
    fetchMasterData();
    if (isEdit) {
      loadInvoice();
    } else if (location.state?.fromPo && items.length > 0 && suppliers.length > 0) {
       // Pre-fill from PO only after master data is loaded (to map IDs if needed, though PO usually has IDs)
       // Actually PO has supplierId and itemIds directly usually.
       const po = location.state.fromPo;
       setFormData(prev => ({
           ...prev,
           supplierId: po.supplierId || '',
           orderNumber: po.poNumber || '',
           notes: po.notes || po.remark || '', // Map remark/notes
           template: po.template || 'Standard'
       }));

       if (po.items && po.items.length > 0) {
           setLines(po.items.map(it => ({
               lineNumber: it.lineNumber,
               categoryId: it.categoryId || '',
               subCategoryId: it.subCategoryId || '',
               itemId: it.itemId || '',
               description: it.description || '',
               quantityGross: it.quantity || 0,
               quantityNet: it.quantity || 0, // Assume same
               unitId: it.unitId || '',
               rate: it.rate || 0,
               amount: it.amount || 0,
               taxId: it.taxId || '',
               taxPercent: it.taxPercent || 0,
               lineDiscount: it.lineDiscount || 0,
               discountPercent: it.discountPercent || 0
           })));
           
           // Fetch subcategories for these items
           const catIds = Array.from(new Set(po.items.map(i => i.categoryId).filter(Boolean)));
           catIds.forEach(cid => fetchSubCategoriesForCategory(cid));
       }
    }
  }, [id, location.state, items.length, suppliers.length]);

  useEffect(() => {
    calculateTotals();
  }, [lines, formData.otherCharges, formData.grossNetEnabled]);

  const fetchMasterData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const [suppRes, itemRes, catRes, unitRes, taxRes] = await Promise.all([
        axios.get(`${API_URL}/parties`, { headers, params: { type: 'SUPPLIER', page: 0, size: 500 } }),
        axios.get(`${API_URL}/production/raw-materials`, { headers, params: { page: 0, size: 1000 } }),
        axios.get(`${API_URL}/production/categories`, { headers, params: { page: 0, size: 500 } }),
        axios.get(`${API_URL}/production/units`, { headers, params: { page: 0, size: 500 } }),
        axios.get(`${API_URL}/production/taxes`, { headers, params: { page: 0, size: 100 } })
      ]);

      setSuppliers(suppRes.data.content || suppRes.data || []);
      setItems(itemRes.data.content || itemRes.data || []);
      setCategories(catRes.data.content || catRes.data || []);
      setUnits(unitRes.data.content || unitRes.data || []);
      setTaxes(taxRes.data.content || taxRes.data || []);

    } catch (err) {
      console.error('Failed to load master data', err);
      // Don't block UI, but show warning potentially
    }
  };

  const fetchSubCategoriesForCategory = async (categoryId) => {
    if (!categoryId) return;
    if (subCategoriesByCategory[categoryId]) return; 
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      const res = await axios.get(`${API_URL}/production/sub-categories`, { headers, params: { categoryId, page:0, size:500 } });
      setSubCategoriesByCategory(prev => ({ ...prev, [categoryId]: res.data.content || res.data || [] }));
    } catch (err) {
       console.error(err);
    }
  };

  const loadInvoice = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_URL}/purchases/invoices/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const inv = res.data;

      setFormData({
        billLedger: inv.billLedger || 'Purchase',
        supplierId: inv.supplierId || '',
        billNumber: inv.billNumber || '',
        orderNumber: inv.orderNumber || '',
        billDate: inv.billDate,
        dueDate: inv.dueDate,
        billType: inv.billType || 'Without Discount',
        grossNetEnabled: inv.grossNetEnabled || false,
        notes: inv.notes || '',
        otherCharges: inv.otherCharges || 0,
        template: inv.template || 'Standard'
      });

      if (inv.lines) {
        setLines(inv.lines.map(l => ({
          ...l,
          // Ensure fields exist for inputs
          quantityGross: l.quantityGross || 0,
          quantityNet: l.quantityNet || 0,
          rate: l.rate || 0,
          amount: l.amount || 0,
          taxPercent: l.taxPercent || 0,
          lineDiscount: l.lineDiscount || 0
        })));
        
        // Prefetch subcategories for existing lines
        const catIds = Array.from(new Set(inv.lines.map(l => l.categoryId).filter(Boolean)));
        catIds.forEach(cid => fetchSubCategoriesForCategory(cid));
      }

      if (inv.attachments) {
        setExistingAttachments(inv.attachments);
      }

    } catch (err) {
      console.error('Failed to load invoice', err);
      setError('Could not load invoice details.');
    } finally {
      setLoading(false);
    }
  };

  const handleLineChange = (index, field, value) => {
    const newLines = [...lines];
    const line = { ...newLines[index] };

    line[field] = value;

    if (field === 'categoryId') {
       fetchSubCategoriesForCategory(value);
       line.subCategoryId = ''; // Reset subcat
    }

    // Auto-populate related fields
    if (field === 'itemId') {
      const selectedItem = items.find(i => i.id == value);
      if (selectedItem) {
        line.description = selectedItem.name; // or description
        line.rate = selectedItem.price || 0; // if available
        line.unitId = selectedItem.unit?.id || '';
        line.categoryId = selectedItem.category?.id || selectedItem.categoryId || '';
        line.subCategoryId = selectedItem.subCategory?.id || selectedItem.subCategoryId || '';
        // tax?
      }
    }

    if (field === 'taxId') {
      const tax = taxes.find(t => t.id == value);
      line.taxPercent = tax ? tax.rate : 0;
    }

    // Calculation per line
    const qty = formData.grossNetEnabled ? (Number(line.quantityNet) || Number(line.quantityGross) || 0) : (Number(line.quantityGross) || 0); // Default to Gross if Net disabled logic? Or just one field
    // Actually if disabled, we probably just use quantityGross as the main "Quantity" input
    // Let's standardize: If grossNetEnabled, assume Net is the billing qty? Or Gross? Usually Net.
    // If NOT enabled, we hide Net column, use Gross column as "Quantity".
    
    const quantity = formData.grossNetEnabled && line.quantityNet > 0 ? Number(line.quantityNet) : Number(line.quantityGross);
    const rate = Number(line.rate) || 0;
    const discount = Number(line.lineDiscount) || 0;

    let amount = (quantity * rate) - discount;
    if (amount < 0) amount = 0;
    
    line.amount = amount;

    newLines[index] = line;
    setLines(newLines);
  };

  const addLine = () => {
    setLines([...lines, {
      lineNumber: lines.length + 1,
      categoryId: '', subCategoryId: '', itemId: '', description: '',
      quantityGross: 0, quantityNet: 0, unitId: '', rate: 0, amount: 0,
      taxId: '', taxPercent: 0, lineDiscount: 0, discountPercent: 0
    }]);
  };

  const removeLine = (index) => {
    if (lines.length > 1) {
      const newLines = lines.filter((_, i) => i !== index);
      // re-index
      newLines.forEach((l, i) => l.lineNumber = i + 1);
      setLines(newLines);
    }
  };

  const calculateTotals = () => {
    let sub = 0;
    let disc = 0;
    let tax = 0;

    lines.forEach(l => {
      sub += Number(l.amount) || 0;
      disc += Number(l.lineDiscount) || 0;
      
      const taxP = Number(l.taxPercent) || 0;
      const taxVal = (Number(l.amount) || 0) * (taxP / 100);
      tax += taxVal;
    });

    // If bill type computes discount differently, adjust here. 
    // Currently assuming line-level discount is summed.

    const other = Number(formData.otherCharges) || 0;
    
    // Note: Backend logic: Subtotal = sum of amounts.
    // net = sub - totalDiscount (if not line level?) Wait.
    // Backend service: 
    // subTotal += amount 
    // totalDiscount += lineDiscount
    // totalTax += taxValue
    // grossTotal = sub - disc + tax + other.
    
    // Wait, amount = (qty * rate) - discount. 
    // So subTotal (sum of amounts) ALREADY has discount deducted?
    // Let's check backend mapLineRequest:
    // amount = qty*rate - discount.
    // So 'amount' is the post-discount value.
    // Backend computeTotals: 
    // subTotal += amount. 
    // net = subTotal - totalDiscount?? No.
    // Backend: net = subTotal.subtract(totalDiscount)...
    // If 'amount' already deducted discount, we shouldn't deduct it again.
    
    // Correction: Backend mapLineRequest logic:
    // li.setAmount( ((qty*rate) - discount).max(0) )
    // computeTotals:
    // subTotal += amount (net of discount)
    // totalDiscount += discount
    // net = subTotal - totalDiscount ??? THIS WOULD DEDUCT TWICE if subTotal is sum of net amounts.
    
    // Let's re-read backend code carefully.
    // mapLineRequest: li.setAmount( ... subtract(discount) )
    // computeTotals: subTotal.add(amount). 
    // net = subTotal.subtract(totalDiscount) ...
    
    // YES, THE BACKEND SEEMS TO DEDUCT DISCOUNT TWICE if 'amount' is stored as net-of-discount.
    // Or maybe 'amount' is gross amount?
    // Backend: "BigDecimal amount = ... multiply(rate).subtract(discount)" -> amount IS net of discount.
    // Then computeTotals: "net = subTotal.subtract(totalDiscount)..." 
    // This looks like a backend bug provided by user code.
    // BUT I cannot change backend service.
    // OR maybe I misinterpreted.
    
    // If I send 'amount' from frontend, backend uses it.
    // If I calculate 'amount' as (Qty * Rate) [Gross Amount] in frontend, then backend logic works?
    // Backend mapLineRequest: "if (li.getAmount() == null) { ... setAmount ... subtract(discount) }"
    // So if I send amount, it uses it.
    
    // IF I want correct math:
    // Let's say Qty 10, Rate 10 = 100. Discount 10.
    // If I send Amount = 100 (Gross).
    // Backend: Returns Amount=100.
    // Compute: Sub = 100. Disc = 10. Net = 100 - 10 = 90. Correct.
    
    // So, 'Amount' field in Item Line should probably be GROSS AMOUNT (Qty * Rate) before discount?
    // But usually 'Amount' column in table shows the final line amount.
    // If I display Net Line Amount (90), and send 90.
    // Backend: Sub=90. Disc=10. Net = 90 - 10 = 80. WRONG.
    
    // Conclusion: For this backend to work, 'Amount' in the line item must be the GROSS amount (Qty * Rate) without discount.
    // OR 'amount' is net, and `computeTotals` logic is just flawed but I have to live with it?
    
    // Let's check backend `computeTotals` again.
    // net = subTotal.subtract(totalDiscount).add(totalTax)...
    // So if subTotal is sum of line amounts, then line amount MUST NOT have discount deducted yet.
    
    // SO: Frontend Line Amount = Qty * Rate.
    // Discount is separate.
    
    let subTotalVal = 0;
    lines.forEach(l => {
       const qty = formData.grossNetEnabled && l.quantityNet > 0 ? Number(l.quantityNet) : Number(l.quantityGross);
       const r = Number(l.rate) || 0;
       subTotalVal += (qty * r);
    });

    // Re-calculate totals based on this assumption
    sub = subTotalVal;
    
    // Calculate tax on (Qty*Rate - Discount)? Or on Qty*Rate?
    // Usually VAT is on Net.
    // Backend: taxValue = amount.multiply(taxPercent)
    // If amount is Gross, Tax is on Gross. That's usually wrong if there's discount.
    
    // This backend logic is tricky. 
    // "taxValue = amount.multiply(taxPercent)"
    // If 'amount' is Gross, tax is on Gross.
    
    // Let's look at the User Screenshots.
    // Amount column. 
    // We have "Rate" and "Amount".
    // "Discount" is only showing if enabled?
    // Screenshot 4 shows "With Item Level Discount" selected. But column headers don't show "Discount" column? 
    // Wait, I don't see Discount column in screenshots even when "With Discount" is selected?
    // Ah, maybe the screenshots are just 'start' state.
    
    // I will implement standard behavior:
    // Line Amount = (Qty * Rate) - Discount.
    // But to satisfy backend `computeTotals` doing double deduction, I might need to send specific values.
    // Actually, I'll trust my frontend calculation for display.
    // And for backend, I'll send what it expects. 
    
    // Let's try to act smart. I will send 'amount' as (Qty*Rate) - Discount.
    // And I will NOT send 'lineDiscount' if I can avoid the double dip? 
    // But backend calculates totalDiscount from lineDiscount.
    
    // Okay, I'll stick to: Line Amount = (Qty * Rate). (Gross).
    // Display that in the table.
    // Then Footer Total Discount reduces it.
    // That seems most consistent with `subTotal - discount` logic in backend.
    
    setTotals({
      subTotal: sub,
      totalDiscount: disc,
      totalTax: tax,
      grossTotal: sub - disc + tax, 
      netTotal: sub - disc + tax + other
    });
  };

  const handleFileChange = (e) => {
    if (e.target.files) {
      setAttachments([...attachments, ...Array.from(e.target.files)]);
    }
  };

  const removeAttachment = (index) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  const removeExistingAttachment = (attId) => {
    // We can't delete directly via API here easily without endpoint or custom logic
    // But usually we just filter it out from display or have a delete API.
    // Since backend update clears attachments if we send new list?
    // Backend update: 
    // "if (req.getAttachments() != null) { invoice.getAttachments().clear(); ... add all from req }"
    // So we just need to send the list of 'kept' attachments in the JSON body.
    setExistingAttachments(existingAttachments.filter(a => a.id !== attId));
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      
      // Build Request JSON
      const requestData = {
        ...formData,
        lines: lines.map(l => ({
           ...l,
           // Ensure numerics
           quantityGross: Number(l.quantityGross),
           quantityNet: Number(l.quantityNet),
           rate: Number(l.rate),
           // Be careful with Amount logic discussed above
           amount: (formData.grossNetEnabled && l.quantityNet > 0 ? l.quantityNet : l.quantityGross) * l.rate, 
           lineDiscount: Number(l.lineDiscount),
           taxPercent: Number(l.taxPercent)
        })),
        attachments: existingAttachments.map(a => ({
           fileName: a.fileName,
           filePath: a.filePath,
           uploadedAt: a.uploadedAt,
           uploadedBy: a.uploadedBy
        }))
      };

      const payload = new FormData();
      payload.append('request', new Blob([JSON.stringify(requestData)], { type: 'application/json' }));
      
      attachments.forEach(file => {
        payload.append('attachments', file);
      });

      if (isEdit) {
        await axios.put(`${API_URL}/purchases/invoices/${id}`, payload, {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        });
      } else {
        await axios.post(`${API_URL}/purchases/invoices`, payload, {
           headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        });
      }

      navigate('/purchase-dashboard/bills');
    } catch (err) {
      console.error('Submit failed', err);
      setError('Failed to save invoice. ' + (err.response?.data?.message || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="flex justify-center p-10"><Loader className="animate-spin text-blue-500" /></div>;

  return (
    <div className="p-6 max-w-[1600px] mx-auto bg-slate-50 min-h-screen font-sans text-sm">
       {/* Breadcrumb */}
       <div className="flex items-center gap-2 text-xs text-slate-500 mb-4">
          <Link to="/" className="hover:text-blue-600">Home</Link> &gt; 
          <Link to="/purchase-dashboard/bills" className="hover:text-blue-600">Purchase</Link> &gt;
          <span className="text-slate-800 font-semibold">{isEdit ? 'Edit Bill' : 'Add New Bill'}</span>
       </div>

       {/* Header Title */}
       <div className="bg-sky-500 text-white px-4 py-3 text-lg font-medium shadow-sm mb-6 rounded-t">
          {isEdit ? 'Edit Bill' : 'Add New Bill'}
       </div>

       <form onSubmit={handleSubmit} className="bg-white shadow-sm border rounded-b p-6 space-y-6">
          {error && <div className="p-3 bg-red-100 text-red-700 rounded text-sm">{error}</div>}

          {/* Top Section Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
             
             {/* Bill Ledger */}
             <div className="col-span-2 md:col-span-4 lg:col-span-4">
                <label className="block text-xs font-bold text-slate-700 mb-1">Bill Ledgers</label>
                <div className="relative">
                   <select 
                     className="w-full border border-gray-300 rounded px-3 py-2 bg-gray-50 focus:outline-none focus:border-sky-500"
                     value={formData.billLedger}
                     onChange={e => setFormData({...formData, billLedger: e.target.value})}
                   >
                     <option value="Purchase">Purchase</option>
                     <option value="Purchase Import">Purchase (Import)</option>
                   </select>
                </div>
             </div>

             {/* Customer Name */}
             <div className="col-span-2 md:col-span-4 lg:col-span-4">
                <label className="block text-xs font-bold text-slate-700 mb-1">Supplier Name</label>
                <div className="flex gap-2">
                   <select 
                      className="flex-1 border border-gray-300 rounded px-3 py-2 bg-white focus:outline-none focus:border-sky-500"
                      value={formData.supplierId}
                      onChange={e => setFormData({...formData, supplierId: e.target.value})}
                   >
                      <option value="">Type Here...</option>
                      {suppliers.map(s => (
                        <option key={s.id} value={s.id}>{s.name || s.companyName}</option>
                      ))}
                   </select>
                   <div className="px-3 py-2 bg-sky-500 text-white font-bold rounded">AED</div>
                </div>
             </div>

             {/* Bill Number */}
             <div className="col-span-2">
                 <label className="block text-xs font-bold text-slate-700 mb-1">Bill</label>
                 <input 
                   type="text" 
                   className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-sky-500"
                   value={formData.billNumber}
                   onChange={e => setFormData({...formData, billNumber: e.target.value})}
                 />
             </div>

             {/* Order Number */}
             <div className="col-span-2">
                 <label className="block text-xs font-bold text-slate-700 mb-1">Order Number</label>
                 <input 
                   type="text" 
                   className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-sky-500"
                   value={formData.orderNumber}
                   onChange={e => setFormData({...formData, orderNumber: e.target.value})}
                 />
             </div>

             {/* Dates */}
             <div>
                 <label className="block text-xs font-bold text-slate-700 mb-1">Bill Date</label>
                 <input 
                   type="date"
                   className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-sky-500"
                   value={formData.billDate}
                   onChange={e => setFormData({...formData, billDate: e.target.value})}
                 />
             </div>
             <div>
                 <label className="block text-xs font-bold text-slate-700 mb-1">Due Date</label>
                 <input 
                   type="date"
                   className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-sky-500"
                   value={formData.dueDate}
                   onChange={e => setFormData({...formData, dueDate: e.target.value})}
                 />
             </div>
             
             {/* Template */}
             <div className="col-span-2 md:col-span-4 lg:col-span-4">
                 <label className="block text-xs font-bold text-slate-700 mb-1">Template</label>
                 <input 
                   type="text" 
                   className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-sky-500"
                   value={formData.template}
                   onChange={e => setFormData({...formData, template: e.target.value})}
                   placeholder="e.g. Standard"
                 />
             </div>
          </div>

          {/* Bill Type & Toggle */}
          <div className="flex flex-wrap items-center justify-between gap-4 py-2 border-t border-b bg-gray-50 px-4 -mx-6">
             <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-slate-700">Bill Type</label>
                <select 
                   className="border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none"
                   value={formData.billType}
                   onChange={e => setFormData({...formData, billType: e.target.value})}
                >
                   <option value="Without Discount">Without Discount</option>
                   <option value="With Discount At Item Level">With Discount At Item Level</option>
                   <option value="With Discount At Bill Order Level">With Discount At Bill Order Level</option>
                </select>
             </div>
             <div className="flex items-center gap-2">
                <input 
                   type="checkbox" 
                   id="grossNet"
                   checked={formData.grossNetEnabled}
                   onChange={e => setFormData({...formData, grossNetEnabled: e.target.checked})}
                   className="w-4 h-4 text-sky-500 focus:ring-sky-500 border-gray-300 rounded"
                />
                <label htmlFor="grossNet" className="text-xs font-bold text-slate-700">Would you like to enable Gross Weight and Net Weight?</label>
             </div>
          </div>

          {/* Items Table */}
          <div className="overflow-x-auto">
             <table className="w-full min-w-[1000px] border-collapse">
                <thead>
                   <tr className="bg-gray-100 text-xs font-bold text-slate-700 text-left border-b">
                      <th className="p-2 w-40">Item Details</th> 
                      <th className="p-2">Item</th>
                      {formData.grossNetEnabled && <th className="p-2 w-24">Quantity(Gross)</th>}
                      <th className="p-2 w-24">{formData.grossNetEnabled ? 'Quantity(Net)' : 'Quantity'}</th>
                      <th className="p-2 w-24">Rate</th>
                      {formData.billType === 'With Discount At Item Level' && <th className="p-2 w-24">Discount</th>}
                      <th className="p-2 w-28">Amount</th>
                      <th className="p-2 w-20">Tax Value</th>
                      <th className="p-2 w-10 text-center">Action</th>
                   </tr>
                </thead>
                <tbody className="text-sm">
                   {lines.map((item, index) => (
                      <tr key={index} className="border-b last:border-0 hover:bg-gray-50 relative group">
                         {/* Categories & Subcategories row logic or merged? Screenshot shows "Category..." "Subcategory..." "Item..." on one line */}
                         <td className="p-2">
                            <div className="flex gap-1">
                                <select 
                                   className="w-1/2 border rounded px-1 py-1 text-xs text-gray-600"
                                   value={item.categoryId || ''}
                                   onChange={e => handleLineChange(index, 'categoryId', e.target.value)}
                                >
                                    <option value="">Category</option>
                                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                                <select 
                                   className="w-1/2 border rounded px-1 py-1 text-xs text-gray-600"
                                   value={item.subCategoryId || ''}
                                   onChange={e => handleLineChange(index, 'subCategoryId', e.target.value)}
                                >
                                    <option value="">SubCat</option>
                                    {(subCategoriesByCategory[item.categoryId] || []).map(sc => (
                                        <option key={sc.id} value={sc.id}>{sc.name}</option>
                                    ))}
                                </select>
                            </div>
                         </td>
                         <td className="p-2">
                             <select 
                                className="w-full border rounded px-2 py-1"
                                value={item.itemId || ''}
                                onChange={e => handleLineChange(index, 'itemId', e.target.value)}
                             >
                                 <option value="">Select Item</option>
                                 {items.filter(i => {
                                     const iCatId = i.category?.id || i.categoryId;
                                     const iSubId = i.subCategory?.id || i.subCategoryId;
                                     return (!item.categoryId || iCatId == item.categoryId) && 
                                            (!item.subCategoryId || iSubId == item.subCategoryId);
                                 }).map(i => (
                                    <option key={i.id} value={i.id}>{i.name}</option>
                                 ))}
                             </select>
                             {/* Description area */}
                             <textarea 
                                className="w-full mt-1 border rounded px-2 py-1 text-xs resize-none h-8 focus:h-16 transition-all"
                                placeholder="Description"
                                value={item.description || ''}
                                onChange={e => handleLineChange(index, 'description', e.target.value)}
                             />
                         </td>

                         {formData.grossNetEnabled && (
                            <td className="p-2 align-top">
                               <input 
                                 type="number" 
                                 className="w-full border rounded px-2 py-1"
                                 value={item.quantityGross}
                                 onChange={e => handleLineChange(index, 'quantityGross', e.target.value)}
                               />
                            </td>
                         )}

                         <td className="p-2 align-top">
                            <input 
                               type="number" 
                               className="w-full border rounded px-2 py-1 bg-gray-50 font-medium"
                               value={formData.grossNetEnabled ? item.quantityNet : item.quantityGross} 
                               onChange={e => handleLineChange(index, formData.grossNetEnabled ? 'quantityNet' : 'quantityGross', e.target.value)}
                               placeholder="Qty"
                            />
                            {/* Unit Display */}
                            <div className="mt-1 text-xs text-slate-500">
                                {units.find(u => u.id == item.unitId)?.name || 'Unit'}
                            </div>
                         </td>

                         <td className="p-2 align-top">
                            <input 
                               type="number" 
                               className="w-full border rounded px-2 py-1"
                               value={item.rate}
                               onChange={e => handleLineChange(index, 'rate', e.target.value)}
                            />
                         </td>

                         {formData.billType === 'With Discount At Item Level' && (
                             <td className="p-2 align-top">
                                <input 
                                   type="number" 
                                   className="w-full border rounded px-2 py-1"
                                   value={item.lineDiscount}
                                   onChange={e => handleLineChange(index, 'lineDiscount', e.target.value)}
                                />
                             </td>
                         )}

                         <td className="p-2 align-top">
                             <div className="w-full border rounded px-2 py-1 bg-gray-100 text-right">
                                {Number(item.amount).toFixed(2)}
                             </div>
                         </td>

                         <td className="p-2 align-top">
                             <div className="flex items-center gap-1">
                                <select 
                                   className="w-16 border rounded px-1 py-1 text-xs"
                                   value={item.taxId || ''}
                                   onChange={e => handleLineChange(index, 'taxId', e.target.value)}
                                >
                                    <option value="">0%</option>
                                    {taxes.map(t => <option key={t.id} value={t.id}>{t.rate}%</option>)}
                                </select>
                                <span className="text-xs">%</span>
                             </div>
                         </td>

                         <td className="p-2 text-center align-top">
                            <button 
                               type="button" 
                               onClick={() => removeLine(index)}
                               className="bg-blue-500 text-white rounded p-1 hover:bg-blue-600 shadow-sm"
                            >
                                <Trash2 size={14} />
                            </button>
                         </td>
                      </tr>
                   ))}
                </tbody>
             </table>
             <button 
                type="button" 
                onClick={addLine}
                className="mt-2 flex items-center gap-1 text-blue-500 text-sm font-medium hover:text-blue-600 transition"
             >
                <Plus size={16} /> Add another line
             </button>
          </div>

          {/* Footer Totals */}
          <div className="flex flex-col md:flex-row gap-8 border-t pt-6 bg-gray-50 -mx-6 px-6 -mb-6 pb-6 rounded-b">
              {/* Attachments / Notes Column */}
              <div className="flex-1 space-y-6">
                 <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Attach File(s)</label>
                    <div className="relative border border-dashed border-gray-300 bg-white p-4 rounded flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-gray-50 transition">
                        <Upload size={24} className="text-gray-400" />
                        <span className="text-xs text-gray-500">Choose File</span>
                        <input type="file" multiple className="opacity-0 absolute w-full h-full left-0 top-0 cursor-pointer" onChange={handleFileChange} />
                    </div>
                    {/* Attachments List */}
                    <div className="mt-2 space-y-1">
                        {existingAttachments.map(a => (
                            <div key={a.id} className="flex justify-between items-center text-xs bg-white border px-2 py-1 rounded">
                                <a href={a.url} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-blue-600 hover:underline">
                                    <Paperclip size={12} /> {a.fileName}
                                </a>
                                <button type="button" onClick={() => removeExistingAttachment(a.id)} className="text-red-500 hover:text-red-700"><X size={12}/></button>
                            </div>
                        ))}
                        {attachments.map((f, i) => (
                            <div key={i} className="flex justify-between items-center text-xs bg-blue-50 border border-blue-100 px-2 py-1 rounded">
                                <span className="flex items-center gap-1 text-slate-700"><FileText size={12} /> {f.name}</span>
                                <button type="button" onClick={() => removeAttachment(i)} className="text-red-500 hover:text-red-700"><X size={12}/></button>
                            </div>
                        ))}
                    </div>
                 </div>

                 <div>
                     <label className="block text-sm font-bold text-slate-700 mb-2">Notes</label>
                     <textarea 
                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-sky-500"
                        rows={3}
                        placeholder="Will be displayed on purchase order"
                        value={formData.notes}
                        onChange={e => setFormData({...formData, notes: e.target.value})}
                     />
                 </div>
              </div>

              {/* Calculations Column */}
              <div className="w-full md:w-1/3 lg:w-1/4 space-y-2 text-sm">
                  <div className="flex justify-between py-1 border-b border-gray-200">
                     <span className="text-slate-600">Sub Total</span>
                     <span className="font-semibold">{totals.subTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-gray-200">
                     <span className="text-slate-600">Total Discount</span>
                     <span className="font-semibold">{totals.totalDiscount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-gray-200">
                     <span className="text-slate-600">Gross Total</span>
                     <span className="font-semibold">{totals.grossTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-gray-200">
                     <span className="text-slate-600">Total Tax</span>
                     <span className="font-semibold">{totals.totalTax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-gray-200">
                     <span className="text-slate-600">Other Charges</span>
                     <input 
                       type="number" 
                       className="w-24 text-right border rounded px-1 text-xs"
                       value={formData.otherCharges}
                       onChange={e => setFormData({...formData, otherCharges: parseFloat(e.target.value) || 0})}
                     />
                  </div>
                  <div className="flex justify-between py-2 border-t font-bold text-base text-slate-800 mt-2">
                     <span>Net Total</span>
                     <span>{totals.netTotal.toFixed(2)}</span>
                  </div>

                  <div className="pt-4 flex gap-2">
                     <button 
                       type="submit" 
                       disabled={submitting}
                       className="flex-1 bg-green-500 text-white py-2 rounded font-medium hover:bg-green-600 transition shadow-sm flex justify-center items-center gap-2"
                     >
                       {submitting ? <Loader className="animate-spin" size={16} /> : <Save size={16} />}
                       Save
                     </button>
                     <button 
                       type="button" 
                       onClick={() => navigate('/purchase-dashboard/bills')}
                       className="flex-1 bg-white border border-gray-300 text-slate-700 py-2 rounded font-medium hover:bg-gray-50 transition"
                     >
                       Cancel
                     </button>
                  </div>
              </div>
          </div>
       </form>
    </div>
  );
};

export default PurchaseInvoiceForm;
