import React from 'react';
import { NavLink, Outlet, Link } from 'react-router-dom';
import { Users, CalendarClock, Calendar, DollarSign, ArrowLeft, ShieldCheck } from 'lucide-react';

const reportCategories = [
    { name: 'Employee', href: '/reports/employee', icon: Users, color: 'text-blue-500', activeColor: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
    { name: 'Attendance', href: '/reports/attendance', icon: CalendarClock, color: 'text-purple-500', activeColor: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/20' },
    { name: 'Leave', href: '/reports/leave', icon: Calendar, color: 'text-amber-500', activeColor: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20' },
    { name: 'Payroll', href: '/reports/payroll', icon: DollarSign, color: 'text-emerald-500', activeColor: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
    { name: 'End of Service', href: '/reports/eos', icon: Users, color: 'text-rose-500', activeColor: 'text-rose-600', bg: 'bg-rose-50 dark:bg-rose-900/20' },
    { name: 'HR Compliance', href: '/reports/compliance', icon: ShieldCheck, color: 'text-cyan-500', activeColor: 'text-cyan-600', bg: 'bg-cyan-50 dark:bg-cyan-900/20' },
];

const ReportsLayout = () => {
    return (
        <div className="flex h-screen bg-background text-foreground">
            {/* Reports Sidebar */}
            <div className="w-full md:w-64 bg-card border-r border-border flex-shrink-0 flex flex-col">
                <div className="p-4 border-b border-border">
                    <div className="flex items-center gap-2 mb-2">
                        <Link to="/hrdashboard" className="p-1 hover:bg-background-muted rounded-full transition-colors" title="Back to Dashboard">
                            <ArrowLeft size={20} className="text-foreground-muted" />
                        </Link>
                        <h2 className="text-lg font-bold text-foreground">Reports</h2>
                    </div>
                    <p className="text-sm text-foreground-muted ml-1">Select a category</p>
                </div>
                <nav className="p-3 space-y-1 flex-1 overflow-y-auto">
                    {reportCategories.map((category) => (
                        <NavLink
                            key={category.name}
                            to={category.href}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${isActive
                                    ? `${category.bg} ${category.activeColor} shadow-sm`
                                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                                }`
                            }
                        >
                            <category.icon size={20} className={category.color} />
                            <span>{category.name}</span>
                        </NavLink>
                    ))}
                </nav>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-auto bg-background-muted">
                <Outlet />
            </div>
        </div>
    );
};

export default ReportsLayout;
