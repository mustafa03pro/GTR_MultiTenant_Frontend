import React from 'react';
import { NavLink, Outlet, Navigate, useLocation } from 'react-router-dom';
import { Clock, CalendarDays, Timer, ShieldCheck } from 'lucide-react';

const tabs = [
    { name: 'Daily Attendance', href: 'daily', icon: Clock, color: 'text-blue-500', activeColor: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
    { name: 'Monthly Summary', href: 'monthly', icon: CalendarDays, color: 'text-purple-500', activeColor: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/20' },
    { name: 'Overtime', href: 'overtime', icon: Timer, color: 'text-orange-500', activeColor: 'text-orange-600', bg: 'bg-orange-50 dark:bg-orange-900/20' },
    { name: 'Compliance', href: 'compliance', icon: ShieldCheck, color: 'text-emerald-500', activeColor: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
];

const AttendanceReports = () => {
    const location = useLocation();

    // Redirect to 'daily' if strictly at '/reports/attendance' or '/reports/attendance/'
    if (location.pathname === '/reports/attendance' || location.pathname === '/reports/attendance/') {
        return <Navigate to="daily" replace />;
    }

    return (
        <div className="flex flex-col h-full">
            {/* Top Navigation / Tabs */}
            <div className="bg-card border-b border-border px-6 sticky top-0 z-10">
                <div className="flex space-x-2 overflow-x-auto py-3 no-scrollbar">
                    {tabs.map((tab) => (
                        <NavLink
                            key={tab.name}
                            to={tab.href}
                            className={({ isActive }) =>
                                `flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 whitespace-nowrap ${isActive
                                    ? `${tab.bg} ${tab.activeColor} shadow-sm`
                                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                                }`
                            }
                        >
                            <tab.icon size={18} className={tab.color} />
                            <span>{tab.name}</span>
                        </NavLink>
                    ))}
                </div>
            </div>

            {/* Report Content */}
            <div className="flex-1 p-6">
                <Outlet />
            </div>
        </div>
    );
};

export default AttendanceReports;
