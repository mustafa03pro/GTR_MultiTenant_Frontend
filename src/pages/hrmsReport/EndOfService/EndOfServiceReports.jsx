import React from 'react';
import { NavLink, Outlet, Navigate, useLocation } from 'react-router-dom';
import { Calculator, Banknote, UserMinus } from 'lucide-react';

const tabs = [
    { name: 'EOSB Calculation Report', href: 'eosb', icon: Calculator, color: 'text-blue-500', activeColor: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
    { name: 'Final Settlement Report', href: 'final-settlement', icon: Banknote, color: 'text-emerald-500', activeColor: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
    { name: 'Termination Reason Report', href: 'termination-reason', icon: UserMinus, color: 'text-rose-500', activeColor: 'text-rose-600', bg: 'bg-rose-50 dark:bg-rose-900/20' },
];

const EndOfServiceReports = () => {
    const location = useLocation();

    // Redirect to 'eosb' if strictly at '/reports/eos' or '/reports/eos/'
    if (location.pathname === '/reports/eos' || location.pathname === '/reports/eos/') {
        return <Navigate to="eosb" replace />;
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

export default EndOfServiceReports;
