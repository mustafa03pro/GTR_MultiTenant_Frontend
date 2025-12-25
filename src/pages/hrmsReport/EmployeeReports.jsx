
import React from 'react';
import { NavLink, Outlet, Navigate, useLocation } from 'react-router-dom';
import { UserCog, Users, PieChart, Briefcase, FileText } from 'lucide-react';

const tabs = [
    { name: 'Master Employee Reports', href: 'master', icon: UserCog, color: 'text-blue-500', activeColor: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
    { name: 'Headcount', href: 'count', icon: Users, color: 'text-emerald-500', activeColor: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
    { name: 'Demographics', href: 'demographics', icon: PieChart, color: 'text-purple-500', activeColor: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/20' },
    { name: 'Employment Status', href: 'employment-status', icon: Briefcase, color: 'text-amber-500', activeColor: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20' },
    { name: 'Employee Documents', href: 'documents', icon: FileText, color: 'text-rose-500', activeColor: 'text-rose-600', bg: 'bg-rose-50 dark:bg-rose-900/20' },
];

const EmployeeReports = () => {
    const location = useLocation();

    // Redirect to 'master' if strictly at '/reports/employee' or '/reports/employee/'
    if (location.pathname === '/reports/employee' || location.pathname === '/reports/employee/') {
        return <Navigate to="master" replace />;
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

export default EmployeeReports;
