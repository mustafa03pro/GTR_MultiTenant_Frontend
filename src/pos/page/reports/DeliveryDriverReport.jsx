import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Download, Printer, Filter, Search } from 'lucide-react';
import { Loader } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_BASE_URL;

const formatPrice = (value) => {
    if (value === undefined || value === null) return '0.00';
    return new Intl.NumberFormat('en-AE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
};

const DeliveryDriverReport = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [drivers, setDrivers] = useState([]);
    
    // Filters
    const [dateRange, setDateRange] = useState({
        fromDate: new Date().toISOString().split('T')[0],
        toDate: new Date().toISOString().split('T')[0]
    });
    const [selectedDriver, setSelectedDriver] = useState('');
    
    useEffect(() => {
        fetchDrivers();
    }, []);

    const fetchDrivers = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}/users`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            // Filter for drivers if role information is available in user object, otherwise show all
            // Assuming user object has a roles array or role string. 
            // Based on backend enum, role is 'POS_DRIVER'. 
            // For now, let's list all or filter if possible. 
            // If the user object structure isn't known perfectly, I'll filter by robust check or just set all.
            // Let's assume we show all users for now to be safe, or filtered by those who have 'driver' in name/role?
            // The request didn't specify strict filtering logic for the dropdown, so all users is a safe fallback 
            // or better yet, if the backend `User` entity has roles.
            // Let's just use all users as potential drivers for now, similar to UserTransfer.
            setDrivers(response.data);
        } catch (error) {
            console.error("Error fetching drivers:", error);
        }
    };

    const handleDateChange = (e) => {
        const { name, value } = e.target;
        setDateRange(prev => ({ ...prev, [name]: value }));
    };

    const fetchData = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const params = {
                fromDate: dateRange.fromDate,
                toDate: dateRange.toDate
            };
            if (selectedDriver) {
                params.driverId = selectedDriver;
            }

            const response = await axios.get(`${API_URL}/pos/reports/delivery-driver-report`, {
                headers: { "Authorization": `Bearer ${token}` },
                params: params
            });
            setData(response.data);
        } catch (error) {
            console.error("Error fetching delivery driver report:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleExport = () => {
        // CSV Export
        const headers = ["Order No", "Status", "Order Date", "Dispatched Time", "Delivered Time", "Riding Time", "Total Amount", "Payment Type", "Address", "Expected Delivery Time"];
        
        const csvContent = [
            headers.join(","),
            ...data.map(item => [
                item.orderNo,
                item.status,
                item.orderDate,
                item.dispatchedTime,
                item.deliveredTime,
                item.ridingTime,
                item.totalAmount,
                `"${item.paymentType}"`,
                `"${item.address}"`,
                item.expectedDeliveryTime
            ].join(","))
        ].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `Delivery_Driver_Report_${dateRange.fromDate}_to_${dateRange.toDate}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-slate-800 print:hidden">Delivery Driver Report</h1>

            {/* Filter Section */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 print:hidden space-y-4">
                <h2 className="text-sm font-semibold text-blue-600 mb-2">Delivery Reports</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    
                    {/* Driver Selection */}
                    <div className="space-y-1">
                        <label className="text-sm font-medium text-slate-700">Driver:</label>
                        <select
                            value={selectedDriver}
                            onChange={(e) => setSelectedDriver(e.target.value)}
                            className="w-full input"
                        >
                            <option value="">All Drivers</option>
                            {drivers.map(driver => (
                                <option key={driver.id} value={driver.id}>{driver.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Date Range */}
                    <div className="space-y-1">
                        <label className="text-sm font-medium text-slate-700">From</label>
                        <input
                            type="date"
                            name="fromDate"
                            value={dateRange.fromDate}
                            onChange={handleDateChange}
                            className="input w-full"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-sm font-medium text-slate-700">To</label>
                         <div className="flex gap-2">
                            <input
                                type="date"
                                name="toDate"
                                value={dateRange.toDate}
                                onChange={handleDateChange}
                                className="input w-full"
                            />
                            <button
                                onClick={fetchData}
                                className="btn-primary flex items-center gap-2"
                                disabled={loading}
                            >
                                {loading ? <Loader size={18} className="animate-spin" /> : "Show"}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Report Header (Visible in print) */}
            <div className="flex justify-between items-center">
                 <h2 className="text-lg font-semibold text-blue-600">
                    Delivery Report (Driver - {dateRange.fromDate} - {dateRange.toDate} )
                 </h2>
                <div className="flex gap-2 print:hidden">
                    <button onClick={() => window.print()} className="btn-secondary p-2" title="Print">
                        <Printer size={20} />
                    </button>
                    <button onClick={handleExport} className="btn-primary p-2" title="Export CSV">
                        <Download size={20} />
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-[#1e3a8a] text-white font-medium">
                            <tr>
                                <th className="px-4 py-3 whitespace-nowrap">Order No</th>
                                <th className="px-4 py-3 whitespace-nowrap">Status</th>
                                <th className="px-4 py-3 whitespace-nowrap">Order Date</th>
                                <th className="px-4 py-3 whitespace-nowrap">Dispatched Time</th>
                                <th className="px-4 py-3 whitespace-nowrap">Delivered Time</th>
                                <th className="px-4 py-3 whitespace-nowrap">Riding Time</th>
                                <th className="px-4 py-3 whitespace-nowrap">Total Amount</th>
                                <th className="px-4 py-3 whitespace-nowrap">Payment Type</th>
                                <th className="px-4 py-3 whitespace-nowrap">Address</th>
                                <th className="px-4 py-3 whitespace-nowrap">Expected Delivery Time</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan="10" className="p-8 text-center text-slate-500">
                                        <Loader className="animate-spin h-6 w-6 mx-auto mb-2" />
                                        Loading data...
                                    </td>
                                </tr>
                            ) : data.length === 0 ? (
                                <tr>
                                    <td colSpan="10" className="p-8 text-center text-slate-500">
                                        No Delivered Orders
                                    </td>
                                </tr>
                            ) : (
                                data.map((item, index) => (
                                    <tr key={index} className="hover:bg-slate-50">
                                        <td className="px-4 py-3 font-medium text-slate-700">{item.orderNo}</td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                item.status === 'completed' ? 'bg-green-100 text-green-700' :
                                                item.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                                                'bg-yellow-100 text-yellow-700'
                                            }`}>
                                                {item.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">{item.orderDate}</td>
                                        <td className="px-4 py-3">{item.dispatchedTime || '-'}</td>
                                        <td className="px-4 py-3">{item.deliveredTime || '-'}</td>
                                        <td className="px-4 py-3">{item.ridingTime}</td>
                                        <td className="px-4 py-3 font-medium">{formatPrice(item.totalAmount)}</td>
                                        <td className="px-4 py-3">{item.paymentType}</td>
                                        <td className="px-4 py-3 truncate max-w-xs" title={item.address}>{item.address}</td>
                                        <td className="px-4 py-3">{item.expectedDeliveryTime || '-'}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default DeliveryDriverReport;
