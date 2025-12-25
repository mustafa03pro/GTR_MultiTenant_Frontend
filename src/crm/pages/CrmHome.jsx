import React, { useState } from 'react';
import { 
    Calendar, 
    Settings, 
    ChevronDown, 
    ChevronUp, 
    User,
    CheckCircle2,
    Clock,
    AlertCircle,
    X,
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

// Mock Data
const salesOverviewData = [
    { id: 1, employee: 'Admin', salesCount: 1, salesAmount: 3000.00, taxAmount: 540.00, totalSale: 3540.00 },
];

const valuableOpsData = [
    { id: 1, name: 'test opportunity13082025', value: 10000.00, stage: 'Instruction Initiate' },
    { id: 2, name: '', value: 0.00, stage: 'Instruction Initiate' },
    { id: 3, name: '', value: 0.00, stage: 'Instruction Initiate' },
    { id: 4, name: '', value: 0.00, stage: 'Instruction Initiate' },
    { id: 5, name: '', value: 0.00, stage: 'Instruction Initiate' },
    { id: 6, name: '', value: 0.00, stage: 'Instruction Initiate' },
    { id: 7, name: '', value: 0.00, stage: 'Instruction Initiate' },
];

const teamStats = [
    { title: 'Team Active Leads', count: 2, color: 'text-red-500', bg: 'bg-red-100' },
    { title: 'Team New Leads', count: 16, color: 'text-red-500', bg: 'bg-red-100' },
    { title: 'Team Active Operations', count: 1, color: 'text-red-500', bg: 'bg-red-100' },
    { title: 'Team New Operations', count: 6, color: 'text-red-500', bg: 'bg-red-100' },
    { title: 'Team Sales Order', count: 1, color: 'text-red-500', bg: 'bg-red-100' },
    { title: 'Team Today\'s Demo', count: 0, color: 'text-red-500', bg: 'bg-red-100' },
    { title: 'Recently-Viewed Leads', count: 3, color: 'text-red-500', bg: 'bg-red-100' },
    { title: 'Recently-Viewed Operations', count: 3, color: 'text-red-500', bg: 'bg-red-100' },
];

const operationCrusherUsers = [
    { id: 1, name: 'User 1', score: '1/1', rank: 1, status: 'gold' },
    { id: 2, name: 'User 2', score: '8/1', rank: 2, status: 'silver' },
    { id: 3, name: 'User 3', score: '0/0', rank: 3, status: 'bronze' },
    { id: 4, name: 'User 4', score: '3/0', rank: 4, status: 'normal' },
    { id: 5, name: 'User 5', score: '0/0', rank: 5, status: 'normal' },
    { id: 6, name: 'User 6', score: '0/0', rank: 6, status: 'normal' },
];

const forecastData = [
    { name: 'Achieved', value: 100 },
];
const FORECAST_COLORS = ['#10b981', '#e5e7eb']; // Emerald-500 for success

const CrmHome = () => {
    const [period, setPeriod] = useState('This Quarter');
    const [viewMode, setViewMode] = useState('Team'); // Team or Self

    return (
        <div className="flex h-full gap-4">
            {/* Main Content Area */}
            <div className="flex-1 flex flex-col gap-4 overflow-y-auto pr-2">
                
                {/* Top Bar */}
                <div className="bg-card rounded-lg p-3 shadow-sm flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="bg-purple-800 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">
                            NA
                        </div>
                        <div className="relative">
                            <select 
                                value={period}
                                onChange={(e) => setPeriod(e.target.value)}
                                className="appearance-none bg-background border border-border text-foreground text-sm rounded-md pl-3 pr-8 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary"
                            >
                                <option>This Quarter</option>
                                <option>Last Quarter</option>
                                <option>This Year</option>
                            </select>
                            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                        </div>
                        <button className="p-1.5 hover:bg-muted rounded-full text-muted-foreground">
                            <Settings className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="flex bg-muted rounded-full p-1">
                            <button 
                                onClick={() => setViewMode('Team')}
                                className={`px-4 py-1 rounded-full text-sm font-medium transition-colors ${viewMode === 'Team' ? 'bg-purple-800 text-white' : 'text-muted-foreground hover:text-foreground'}`}
                            >
                                Team
                            </button>
                            <button 
                                onClick={() => setViewMode('Self')}
                                className={`px-4 py-1 rounded-full text-sm font-medium transition-colors ${viewMode === 'Self' ? 'bg-purple-800 text-white' : 'text-muted-foreground hover:text-foreground'}`}
                            >
                                Self
                            </button>
                        </div>
                        <button className="flex items-center gap-2 bg-purple-800 text-white px-4 py-1.5 rounded-lg text-sm hover:bg-purple-900 transition-colors">
                            <Calendar className="w-4 h-4" />
                            View Calendar
                        </button>
                        <button className="bg-purple-800 text-white px-4 py-1.5 rounded-lg text-sm hover:bg-purple-900 transition-colors">
                            Appointment
                        </button>
                    </div>
                </div>

                {/* Dashboard Widgets Row 1 */}
                <div className="grid grid-cols-12 gap-4">
                    
                    {/* Operation Crusher */}
                    <div className="col-span-12 lg:col-span-6 bg-card rounded-lg p-4 shadow-sm border border-border">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-semibold text-foreground">Operation Crusher</h3>
                            <div className="flex items-center gap-2 text-sm text-blue-500 font-medium">
                                <span>Total</span>
                                <span className="bg-blue-50 px-2 py-0.5 rounded">20/2</span>
                                <Settings className="w-4 h-4 text-muted-foreground cursor-pointer" />
                            </div>
                        </div>
                        <div className="flex justify-around items-end pt-2 pb-4">
                            {operationCrusherUsers.map((user) => (
                                <div key={user.id} className="flex flex-col items-center gap-1">
                                    <div className={`relative w-12 h-12 rounded-full border-2 flex items-center justify-center
                                        ${user.status === 'gold' ? 'border-yellow-400' : 
                                          user.status === 'silver' ? 'border-slate-300' : 
                                          user.status === 'bronze' ? 'border-amber-600' : 'border-slate-100'}
                                    `}>
                                        <User className="w-6 h-6 text-slate-400" />
                                        {user.rank <= 3 && (
                                            <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white
                                                ${user.status === 'gold' ? 'bg-yellow-500' : 
                                                  user.status === 'silver' ? 'bg-slate-400' : 'bg-amber-700'}
                                            `}>
                                                {user.rank}
                                            </div>
                                        )}
                                    </div>
                                    <div className="text-black font-bold mt-1 text-sm">{user.score}</div>
                                    <div className="text-pink-500 text-xs font-bold">...</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Forecast Accuracy */}
                    <div className="col-span-12 md:col-span-6 lg:col-span-3 bg-card rounded-lg p-4 shadow-sm border border-border flex flex-col">
                        <h3 className="font-semibold text-foreground mb-4">Forecast Accuracy</h3>
                        <div className="flex-1 flex items-center justify-center relative">
                            <div className="w-32 h-32">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={forecastData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={40}
                                            outerRadius={55}
                                            startAngle={90}
                                            endAngle={-270}
                                            dataKey="value"
                                            stroke="none"
                                        >
                                            {forecastData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={FORECAST_COLORS[index % FORECAST_COLORS.length]} />
                                            ))}
                                        </Pie>
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="text-xl font-bold text-foreground">100%</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sale Value */}
                    <div className="col-span-12 md:col-span-6 lg:col-span-3 bg-card rounded-lg p-4 shadow-sm border border-border flex flex-col">
                        <h3 className="font-semibold text-foreground mb-2">Sale Value</h3>
                        <div className="flex-1 flex items-center justify-center">
                            <span className="text-2xl font-bold text-foreground">3,540.00</span>
                        </div>
                    </div>
                </div>

                {/* Dashboard Tables Row */}
                <div className="grid grid-cols-12 gap-4">
                    
                    {/* Sales Overview */}
                    <div className="col-span-12 lg:col-span-5 bg-card rounded-lg shadow-sm border border-border overflow-hidden">
                        <div className="p-4 border-b border-border">
                            <h3 className="font-semibold text-foreground">Sales Overview</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-muted text-muted-foreground">
                                    <tr>
                                        <th className="px-4 py-3 text-left font-medium">#</th>
                                        <th className="px-4 py-3 text-left font-medium">Employee</th>
                                        <th className="px-4 py-3 text-center font-medium">No. of Sales</th>
                                        <th className="px-4 py-3 text-right font-medium">Sales Amount</th>
                                        <th className="px-4 py-3 text-right font-medium">Tax Amount</th>
                                        <th className="px-4 py-3 text-right font-medium">Total Sale</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {salesOverviewData.map((row) => (
                                        <tr key={row.id} className="border-b border-border last:border-0 hover:bg-muted/50">
                                            <td className="px-4 py-3 text-muted-foreground">{row.id}</td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center">
                                                        <User className="w-3 h-3 text-slate-500" />
                                                    </div>
                                                    <span className="text-blue-600 font-medium">{row.employee}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-center text-blue-600 font-medium cursor-pointer">{row.salesCount}</td>
                                            <td className="px-4 py-3 text-right">SAR {row.salesAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                            <td className="px-4 py-3 text-right">SAR {row.taxAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                            <td className="px-4 py-3 text-right font-semibold">SAR {row.totalSale.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Most Valuable Operations */}
                    <div className="col-span-12 lg:col-span-7 bg-card rounded-lg shadow-sm border border-border overflow-hidden">
                        <div className="p-4 border-b border-border flex justify-between items-center">
                            <h3 className="font-semibold text-foreground">Most Valuable Operations</h3>
                            <Settings className="w-4 h-4 text-muted-foreground cursor-pointer" />
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-muted text-muted-foreground">
                                    <tr>
                                        <th className="px-4 py-3 text-left font-medium">#</th>
                                        <th className="px-4 py-3 text-left font-medium">Opp. Name</th>
                                        <th className="px-4 py-3 text-right font-medium">Opp. Value</th>
                                        <th className="px-4 py-3 text-right font-medium">Stage</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {valuableOpsData.map((row) => (
                                        <tr key={row.id} className="border-b border-border last:border-0 hover:bg-muted/50">
                                            <td className="px-4 py-3 text-muted-foreground">{row.id}</td>
                                            <td className="px-4 py-3 text-foreground">{row.name}</td>
                                            <td className="px-4 py-3 text-right font-medium">SAR {row.value.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                            <td className="px-4 py-3 text-right">
                                                <span className="inline-block px-2 py-1 rounded bg-[#1e293b] text-white text-xs font-medium">
                                                    {row.stage}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

            </div>

            {/* Right Sidebar Stats */}
            <div className="w-80 flex-shrink-0 flex flex-col gap-2">
                {teamStats.map((stat, index) => (
                    <div key={index} className="bg-card border border-border rounded-lg overflow-hidden">
                        <button className="w-full flex items-center justify-between p-3 hover:bg-muted/50 transition-colors">
                            <div className="flex items-center gap-2">
                                <ChevronDown className="w-4 h-4 text-muted-foreground" />
                                <span className="font-sm text-foreground">{stat.title}</span>
                                {stat.count > 0 && (
                                    <span className={`${stat.bg} ${stat.color} text-xs px-1.5 py-0.5 rounded font-bold`}>
                                        {stat.count}
                                    </span>
                                )}
                            </div>
                            <span className="text-xs text-teal-600 bg-teal-50 px-2 py-0.5 rounded cursor-pointer hover:bg-teal-100">
                                View All
                            </span>
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default CrmHome;
