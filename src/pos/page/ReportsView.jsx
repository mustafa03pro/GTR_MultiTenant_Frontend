import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { Loader, AlertCircle, Calendar } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_BASE_URL;

const formatPrice = (cents) => `AED ${(cents / 100).toFixed(2)}`;

const StatCard = ({ title, value }) => (
    <div className="bg-white p-6 rounded-xl shadow-sm">
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <p className="text-3xl font-bold text-slate-800 mt-1">{value}</p>
    </div>
);

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const ReportsView = () => {
    const navigate = useNavigate();
    const [sales, setSales] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [dateRange, setDateRange] = useState({
        start: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0],
    });

    useEffect(() => {
        const fetchSales = async () => {
            if (!dateRange.start || !dateRange.end) return;

            setLoading(true);
            setError('');
            try {
                const token = localStorage.getItem('token');
                const response = await axios.get(`${API_URL}/pos/sales`, {
                    headers: { "Authorization": `Bearer ${token}` },
                    params: {
                        startDate: dateRange.start,
                        endDate: dateRange.end,
                    }
                });
                setSales(response.data);
            } catch (err) {
                setError('Failed to load sales data.');
                console.error("Error fetching sales:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchSales();
    }, [dateRange]);

    const filteredData = useMemo(() => {
        const filteredSales = sales;
        if (!filteredSales.length) return { filteredSales: [], salesByDay: [], topProducts: [] };

        const salesByDay = filteredSales.reduce((acc, sale) => {
            const day = new Date(sale.invoiceDate).toLocaleDateString('en-CA'); // YYYY-MM-DD
            if (!acc[day]) {
                acc[day] = { date: day, revenue: 0 };
            }
            acc[day].revenue += sale.totalCents / 100;
            return acc;
        }, {});

        const productSales = filteredSales.flatMap(s => s.items).reduce((acc, item) => {
            acc[item.productName] = (acc[item.productName] || 0) + item.quantity;
            return acc;
        }, {});

        const topProducts = Object.entries(productSales)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 5);

        return {
            filteredSales,
            salesByDay: Object.values(salesByDay).sort((a, b) => new Date(a.date) - new Date(b.date)),
            topProducts,
        };
    }, [sales]);

    const stats = useMemo(() => {
        const totalRevenue = filteredData.filteredSales.reduce((sum, sale) => sum + sale.totalCents, 0);
        const totalTransactions = filteredData.filteredSales.length;
        const avgTransactionValue = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;
        return { totalRevenue, totalTransactions, avgTransactionValue };
    }, [filteredData.filteredSales]);

    const dateTickFormatter = (tick) => {
        const date = new Date(tick);
        // Show month and day, but if it's the first of the month, also show the year.
        if (date.getDate() === 1) {
            return date.toLocaleDateString('en-US', { year: '2-digit', month: 'short', day: 'numeric' });
        }
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    if (loading) return <div className="p-8 flex justify-center items-center h-full"><Loader className="h-8 w-8 animate-spin text-blue-600" /></div>;
    if (error) return <div className="p-8 text-center text-red-500"><AlertCircle className="mx-auto h-12 w-12" />{error}</div>;

    return (
        <div className="p-6 md:p-8 space-y-6">
            <div className="flex flex-wrap justify-between items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800">Reports & Analytics</h1>
                    <p className="text-slate-500 mt-1">Analyze your sales performance.</p>
                </div>
                <div className="flex items-center gap-4 bg-white p-2 rounded-lg shadow-sm">
                    <Calendar className="h-5 w-5 text-slate-400" />
                    <input type="date" value={dateRange.start} onChange={e => setDateRange(prev => ({ ...prev, start: e.target.value }))} className="input-sm" />
                    <span className="text-slate-500">to</span>
                    <input type="date" value={dateRange.end} onChange={e => setDateRange(prev => ({ ...prev, end: e.target.value }))} className="input-sm" />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard title="Total Revenue" value={formatPrice(stats.totalRevenue)} />
                <StatCard title="Transactions" value={stats.totalTransactions.toLocaleString()} />
                <StatCard title="Avg. Sale Value" value={formatPrice(stats.avgTransactionValue)} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <div className="lg:col-span-3 bg-white p-6 rounded-xl shadow-sm">
                    <h2 className="text-xl font-semibold text-slate-800 mb-4">Sales Over Time</h2>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={filteredData.salesByDay}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" fontSize={12} tickLine={false} axisLine={false} tickFormatter={dateTickFormatter} />
                            <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `AED ${value}`} />
                            <Tooltip formatter={(value) => formatPrice(value * 100)} />
                            <Legend />
                            <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
                <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm">
                    <h2 className="text-xl font-semibold text-slate-800 mb-4">Top Selling Products</h2>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie data={filteredData.topProducts} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} fill="#8884d8" label>
                                {filteredData.topProducts.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip formatter={(value) => `${value} units sold`} />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Detailed Reports Section */}
            <div className="bg-white p-6 rounded-xl shadow-sm">
                <h2 className="text-xl font-semibold text-slate-800 mb-6 border-b pb-2">Detailed Reports</h2>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {[
                        {
                            title: "Business Summary",
                            path: "/pos-reports/business-summary",
                            description: "This essential tool provides a concise yet thorough overview of your company's sales activities. It presents key information such as item counts and total amounts across crucial categories including gross sales, net sales, returns, discounts, and total VAT.",
                        },
                        {
                            title: "Abstract Report",
                            description: "Designed primarily for comparative purposes, this report empowers you to efficiently evaluate total sales figures across different company brands. By utilizing this insightful report, you can gain a comprehensive understanding of the performance variations between your various brands.",
                        },
                        {
                            title: "Weekly Sales Analysis",
                            description: "This insightful report provides a comprehensive overview of sales performance on a weekly basis. By tracking sales trends over time, the report allows you to analyze and compare the growth between the current and previous weeks.",
                        },
                        {
                            title: "Daily Sales Report",
                            description: "This report provides a concise overview of the sales made on a daily basis. It serves as an end-of-day summary, offering valuable insights into the revenue generated during each business day.",
                        },
                        {
                            title: "Total Daily Sales Report",
                            description: "This report provides a concise and comprehensive summary of sales for each selected date. By generating this report, you gain valuable insights into the total sales achieved on a daily basis.",
                        },
                        {
                            title: "Closing Report",
                            description: "This comprehensive report serves as an end-of-day summary, providing you with detailed information about the day's sales activities. It offers a comprehensive breakdown of sales details, enabling you to review key metrics and track performance effectively.",
                        },
                    ].map((report, index) => (
                        <div key={index} onClick={() => report.path && navigate(report.path)} className="group cursor-pointer hover:bg-slate-50 p-4 rounded-xl border border-transparent hover:border-slate-100 transition-all duration-200">
                            <h3 className="text-base font-bold text-blue-600 mb-2 group-hover:underline decoration-blue-300 underline-offset-2">
                                {report.title}
                            </h3>
                            <p className="text-sm text-slate-500 leading-relaxed text-justify">
                                {report.description}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default ReportsView;
