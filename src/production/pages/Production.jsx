import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
    Factory,
    List,
    Calendar,
    Activity,
    User,
    ClipboardList,
    FileText,
    Settings,
    LogOut,
    Menu,
    ArrowLeft
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

const productionNavLinks = [
    { name: 'Manage Manufacturing Order', icon: Factory, href: '/production-dashboard/manage-manufacturing-order', color: 'text-blue-600' },
    { name: 'Production Schedule', icon: Calendar, href: '/production-dashboard/production-schedule', color: 'text-purple-600' },
    { name: 'Production Operation', icon: Activity, href: '/production-dashboard/production-operation', color: 'text-rose-600' },
    { name: 'My Production', icon: User, href: '/production-dashboard/my-production', color: 'text-amber-600' },
    { name: 'Material Requisition', icon: ClipboardList, href: '/production-dashboard/material-requisition', color: 'text-emerald-600' },
    { name: 'Work Order Report', icon: FileText, href: '/production-dashboard/work-order-report', color: 'text-indigo-600' },
];

const SidebarContent = ({ onLinkClick }) => {
    const location = useLocation();
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.clear();
        navigate('/login');
    };

    const NavItem = ({ item }) => (
        <NavLink
            to={item.href}
            onClick={onLinkClick}
            end={item.href !== '/production-dashboard/manage-manufacturing-order'}
            className={({ isActive }) => `flex items-center px-4 py-2.5 text-sm font-medium rounded-lg transition-colors group ${isActive ? 'bg-primary text-primary-foreground shadow-sm' : 'text-foreground-muted hover:bg-background-muted'}`}
        >
            <item.icon className={`h-5 w-5 mr-3 flex-shrink-0 ${item.color}`} />
            <span>{item.name}</span>
        </NavLink>
    );

    return (
        <div className="flex flex-col h-full bg-card text-card-foreground">
            <div className="p-4 border-b border-border flex-shrink-0">
                <button onClick={() => navigate('/company-dashboard')} className="flex items-center gap-3 w-full text-left">
                    <ArrowLeft className="h-6 w-6 text-primary" />
                    <span className="font-bold text-xl text-foreground">Company Hub</span>
                </button>
            </div>
            <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
                {productionNavLinks.map((item) => <NavItem key={item.name} item={item} />)}
            </nav>
            <div className="p-4 border-t border-border flex-shrink-0 space-y-2">
                <NavLink to="/production-settings" onClick={onLinkClick} className={({ isActive }) => `flex items-center px-4 py-2.5 text-sm font-medium rounded-lg transition-colors group ${isActive ? 'bg-primary text-primary-foreground shadow-sm' : 'text-foreground-muted hover:bg-background-muted'}`}>
                    <Settings className="h-5 w-5 mr-3 text-slate-500" />
                    <span>Settings</span>
                </NavLink>
                <button onClick={handleLogout} className="w-full flex items-center px-4 py-2.5 text-sm font-medium rounded-lg text-foreground-muted hover:bg-background-muted group" title="Logout">
                    <LogOut className="h-5 w-5 mr-3 text-foreground-muted group-hover:text-red-600" />
                    <span>Logout</span>
                </button>
            </div>
        </div>
    );
};

const ProductionLayout = ({ children }) => {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="flex h-screen bg-background text-foreground">
            {/* Static sidebar for desktop */}
            <div className="hidden lg:flex lg:flex-shrink-0">
                <div className="flex flex-col w-72 border-r border-border">
                    <SidebarContent />
                </div>
            </div>

            {/* Mobile sidebar */}
            <AnimatePresence>
                {sidebarOpen && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="fixed inset-0 bg-black/50 z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />
                        <motion.div initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} transition={{ type: 'spring', stiffness: 300, damping: 30 }} className="fixed top-0 left-0 h-full w-72 z-30 bg-card text-card-foreground">
                            <SidebarContent onLinkClick={() => setSidebarOpen(false)} />
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            <main className="flex-1 flex flex-col overflow-hidden">
                <header className="lg:hidden sticky top-0 z-10 flex-shrink-0 flex h-16 bg-card shadow-sm items-center px-4">
                    <button type="button" className="text-foreground-muted" onClick={() => setSidebarOpen(true)}><Menu className="h-6 w-6" /></button>
                    <div className="flex-1 flex justify-center items-center"><span className="font-bold text-lg text-foreground">Production Module</span></div>
                </header>
                <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-background-muted">{children}</div>
            </main>
        </div>
    );
};

const Production = () => {
    return (
        <ProductionLayout>
            <Outlet />
        </ProductionLayout>
    );
}

export default Production;
