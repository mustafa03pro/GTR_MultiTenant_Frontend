import React from 'react';
import { NavLink, Outlet, Navigate, useLocation } from 'react-router-dom';
import { TrendingUp } from 'lucide-react';

const tabs = [
    { name: 'Accrual Report', href: 'accrual', icon: TrendingUp, color: 'text-amber-500', activeColor: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20' },
    // Future tabs: 'Leave History', 'Balance Summary', etc.
];

const LeaveReports = () => {
    const location = useLocation();

    // Redirect to 'accrual' if strictly at '/reports/leave' or '/reports/leave/'
    if (location.pathname === '/reports/leave' || location.pathname === '/reports/leave/') {
        return <Navigate to="accrual" replace />;
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

export default LeaveReports;
