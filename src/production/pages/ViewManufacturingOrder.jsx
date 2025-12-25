import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Edit, FileText, Printer, Mail, Paperclip, ChevronDown, ArrowLeft, Loader2, Factory, Calendar, Settings } from 'lucide-react';
import BOMInformation from './BOMInformation'; // Reusing BOM component logic or embedding similar table

const API_URL = import.meta.env.VITE_API_BASE_URL;

const ViewManufacturingOrder = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [order, setOrder] = useState(null);
    const [company, setCompany] = useState(null);
    const [bom, setBom] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Using refs for print/scroll similar to reference
    const attachmentRef = useRef(null);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const token = localStorage.getItem('token');
                const headers = { Authorization: `Bearer ${token}` };

                const [orderRes, companyRes] = await Promise.all([
                    axios.get(`${API_URL}/production/manufacturing-orders/${id}`, { headers }),
                    axios.get(`${API_URL}/company-info`, { headers }).catch(() => ({ data: null }))
                ]);

                const orderData = orderRes.data;
                setOrder(orderData);
                setCompany(companyRes.data);

                // Fetch BOM if exists
                if (orderData.bomId) {
                    try {
                        const bomRes = await axios.get(`${API_URL}/production/bom-semi-finished/${orderData.bomId}`, { headers });
                        setBom(bomRes.data);
                    } catch (e) {
                        console.error("Failed to load BOM", e);
                    }
                }

            } catch (err) {
                console.error("Error fetching data:", err);
                setError("Failed to load manufacturing order details.");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id]);

    const handlePrint = () => {
        window.print();
    };

    const scrollToAttachments = () => {
        if (attachmentRef.current) {
            attachmentRef.current.scrollIntoView({ behavior: 'smooth' });
        } else if (!order.files || order.files.length === 0) {
            alert("No attachments found.");
        }
    };

    const handleViewFile = async (fileId, fileName) => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}/production/manufacturing-orders/files/${fileId}`, {
                headers: { Authorization: `Bearer ${token}` },
                responseType: 'blob'
            });

            const file = new Blob([response.data], { type: response.headers['content-type'] });
            const fileURL = URL.createObjectURL(file);
            window.open(fileURL, '_blank');

            // cleanup is tricky with window.open, but usually fine for small blobs or browser handles it eventually
        } catch (error) {
            console.error("Error viewing file:", error);
            alert("Failed to view file. Please try again.");
        }
    };

    if (loading) return <div className="flex justify-center items-center h-screen"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>;
    if (error) return <div className="p-8 text-center text-red-600">{error}</div>;
    if (!order) return <div className="p-8 text-center">Manufacturing Order not found.</div>;

    const formatDate = (date) => date ? new Date(date).toLocaleString() : '-';

    return (
        <div className="flex flex-col h-screen bg-slate-50 print:bg-white print:h-auto">
            {/* Breadcrumb & Header */}
            <div className="bg-white border-b shadow-sm print:hidden">
                <div className="px-6 py-2 text-xs text-gray-500 flex items-center gap-1">
                    <span className="cursor-pointer hover:text-primary" onClick={() => navigate('/production-dashboard')}>Production</span> &gt;
                    <span className="cursor-pointer hover:text-primary" onClick={() => navigate('/production-dashboard/manage-manufacturing-order')}>Manufacturing Orders</span> &gt;
                    <span className="font-medium text-gray-700">View Order</span>
                </div>
                <div className="px-6 py-3 bg-primary text-white flex justify-between items-center">
                    <h1 className="text-xl font-semibold">View Manufacturing Order</h1>
                    <div className="flex gap-2">
                        <button onClick={() => navigate('/production-dashboard/manage-manufacturing-order')} className="px-3 py-1 bg-white/20 hover:bg-white/30 text-sm rounded transition-colors">All Orders</button>
                        <button onClick={() => navigate('/production-dashboard/manage-manufacturing-order/new')} className="px-3 py-1 bg-white/20 hover:bg-white/30 text-sm rounded transition-colors">+ New Order</button>
                    </div>
                </div>
            </div>

            {/* Toolbar */}
            <div className="px-6 py-3 flex flex-wrap gap-2 items-center bg-white border-b print:hidden">
                <button onClick={() => navigate(`/production-dashboard/manage-manufacturing-order/edit/${id}`)} className="p-2 bg-[#5bc0de] text-white rounded hover:bg-[#46b8da]" title="Edit"><Edit size={16} /></button>
                <button onClick={handlePrint} className="p-2 bg-[#0275d8] text-white rounded hover:bg-[#025aa5]" title="Print"><Printer size={16} /></button>
                <button onClick={scrollToAttachments} className="p-2 bg-[#aeb6bf] text-white rounded hover:bg-[#8e99a4]" title="Attachments"><Paperclip size={16} /></button>
            </div>

            {/* Status Bar */}
            <div className="px-6 py-2 bg-[#f9f9f9] border-b text-xs text-gray-500 flex flex-col gap-1 print:hidden">
                <div className="flex justify-between w-full max-w-4xl">
                    {order.status && (
                        <div className="flex items-center gap-2">
                            <span className="font-bold">Status:</span>
                            <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold text-white 
                                ${order.status === 'SCHEDULED' ? 'bg-blue-500' :
                                    order.status === 'IN_PROGRESS' ? 'bg-amber-500' :
                                        order.status === 'COMPLETED' ? 'bg-green-500' : 'bg-gray-500'}`}>
                                {order.status}
                            </span>
                        </div>
                    )}
                    {order.salesOrderId && <span>Source: Sales Order #{order.soNumber}</span>}
                </div>
            </div>

            {/* Document View */}
            <div className="flex-grow overflow-y-auto p-6 bg-slate-50 print:p-0 print:bg-white print:overflow-visible">
                <div className="w-full bg-white border shadow-sm p-8 relative text-sm print:w-full print:border-none print:shadow-none print:p-0">

                    {/* Company Header */}
                    <div className="text-center mb-8 border-b pb-6">
                        <h2 className="text-xl font-bold text-gray-800">{company?.companyName || 'Factory Operations'}</h2>
                        <p className="text-gray-600">{company?.address || 'Production Facility'}, {company?.city || ''}</p>
                    </div>

                    {/* Order Details Grid */}
                    <div className="grid grid-cols-2 gap-x-12 gap-y-4 mb-8">
                        <div>
                            <h3 className="font-bold text-primary border-b border-gray-200 pb-1 mb-3">Order Details</h3>
                            <table className="w-full text-xs">
                                <tbody>
                                    <tr><td className="py-1 font-medium text-gray-500 w-32">MO Number</td><td className="font-bold">{order.moNumber}</td></tr>
                                    <tr><td className="py-1 font-medium text-gray-500">Ref Number</td><td>{order.referenceNo || '-'}</td></tr>
                                    <tr><td className="py-1 font-medium text-gray-500">Created Date</td><td>{formatDate(order.createdDate)}</td></tr>
                                    <tr><td className="py-1 font-medium text-gray-500">Scheduled Start</td><td>{formatDate(order.scheduleStart)}</td></tr>
                                    <tr><td className="py-1 font-medium text-gray-500">Scheduled Finish</td><td>{formatDate(order.scheduleFinish)}</td></tr>
                                    <tr><td className="py-1 font-medium text-gray-500">Assigned To</td><td>{order.assignToName || '-'}</td></tr>
                                </tbody>
                            </table>
                        </div>
                        <div>
                            <h3 className="font-bold text-primary border-b border-gray-200 pb-1 mb-3">Item & Production</h3>
                            <table className="w-full text-xs">
                                <tbody>
                                    <tr><td className="py-1 font-medium text-gray-500 w-32">Item Name</td><td className="font-bold">{order.itemName}</td></tr>
                                    <tr><td className="py-1 font-medium text-gray-500">Item Code</td><td className="font-mono">{order.itemCode}</td></tr>
                                    <tr><td className="py-1 font-medium text-gray-500">Batch No</td><td>{order.batchNo || '-'}</td></tr>
                                    <tr><td className="py-1 font-medium text-gray-500">Quantity</td><td className="font-bold text-lg">{order.quantity}</td></tr>
                                    <tr><td className="py-1 font-medium text-gray-500">Production House</td><td>{order.productionHouseName}</td></tr>
                                    <tr><td className="py-1 font-medium text-gray-500">BOM Used</td><td>{order.bomName || '-'}</td></tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Customer Info if applicable */}
                    {order.customerName && (
                        <div className="mb-8">
                            <h3 className="font-bold text-primary border-b border-gray-200 pb-1 mb-3">For Customer</h3>
                            <div className="text-sm">
                                <span className="font-bold">{order.customerName}</span>
                                {order.soNumber && <span className="text-gray-500 ml-2">(Ref: SO #{order.soNumber})</span>}
                            </div>
                        </div>
                    )}

                    {/* BOM / Materials Table */}
                    {bom && (
                        <div className="mb-8">
                            <h3 className="font-bold text-primary border-b border-gray-200 pb-1 mb-3">Bill of Materials / Components</h3>
                            <table className="w-full text-xs text-left">
                                <thead className="bg-gray-100 text-gray-700 font-bold border-b border-t border-gray-300">
                                    <tr>
                                        <th className="py-2 px-2 text-center w-12">Seq</th>
                                        <th className="py-2 px-2">Component</th>
                                        <th className="py-2 px-2">Type</th>
                                        <th className="py-2 px-2">Process</th>
                                        <th className="py-2 px-2 text-right">Qty/Unit</th>
                                        <th className="py-2 px-2 text-right">Total Req ({order.quantity})</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {bom.details && bom.details.map((detail, index) => {
                                        const compName = detail.rawMaterial ? detail.rawMaterial.name : detail.childSemiFinished?.name;
                                        const compType = detail.rawMaterial ? 'Raw Material' : 'Sub-Assembly';
                                        const qtyPerUnit = detail.quantity;
                                        const totalReq = qtyPerUnit * order.quantity;

                                        return (
                                            <tr key={index} className="border-b border-gray-200">
                                                <td className="py-2 px-2 text-center">{detail.sequence}</td>
                                                <td className="py-2 px-2 font-medium">{compName}</td>
                                                <td className="py-2 px-2 text-gray-500">{compType}</td>
                                                <td className="py-2 px-2">{detail.process?.name || '-'}</td>
                                                <td className="py-2 px-2 text-right">{qtyPerUnit}</td>
                                                <td className="py-2 px-2 text-right font-bold">{totalReq.toFixed(4)}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Attachments Section */}
                    {order.files && order.files.length > 0 && (
                        <div className="mt-8 border-t pt-4" ref={attachmentRef}>
                            <h3 className="font-bold text-sm mb-2">Attachments</h3>
                            <div className="flex flex-wrap gap-2">
                                {order.files.map((file, index) => (
                                    <button
                                        key={index}
                                        onClick={() => handleViewFile(file.id, file.fileName)}
                                        className="px-3 py-1 bg-gray-100 rounded text-blue-600 hover:underline text-xs flex items-center gap-1 border cursor-pointer focus:outline-none"
                                    >
                                        <Paperclip size={12} /> {file.fileName}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};

export default ViewManufacturingOrder;
