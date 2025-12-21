import React, { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { LayoutDashboard, ShoppingCart, Users, FileText, Settings, Menu, X, ArrowLeft, ClipboardList, Package } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

const salesNavLinks = [
    { name: 'Dashboard', icon: LayoutDashboard, href: '/sales-dashboard', color: 'text-sky-500' },
    { name: 'Quotations', icon: ClipboardList, href: '/sales/quotations', color: 'text-yellow-500' },
    { name: 'Rental Quotations', icon: Package, href: '/sales/rental-quotations', color: 'text-orange-500' },
    { name: 'Rental Recieved Item', icon: ClipboardList, href: '/sales/rental-item-received', color: 'text-green-500' },
    { name: 'Rental Sales Order', icon: ClipboardList, href: '/sales/rental-sales-orders', color: 'text-teal-500' },
    { name: 'Orders', icon: ShoppingCart, href: '/sales/orders', color: 'text-blue-500' },
    { name: 'Delivery Orders', icon: Package, href: '/sales/delivery-orders', color: 'text-pink-500' },
    { name: 'Proforma Invoice', icon: FileText, href: '/sales/proforma-invoices', color: 'text-cyan-500' },
    { name: 'Rental Invoices', icon: FileText, href: '/sales/rental-invoices', color: 'text-indigo-500' },
    { name: 'Invoices', icon: FileText, href: '/sales/invoices', color: 'text-purple-500' },
    { name: 'Received Amount', icon: FileText, href: '/sales/recieved-amounts', color: 'text-emerald-600' },
    { name: 'Credit Notes', icon: FileText, href: '/sales/credit-notes', color: 'text-rose-500' },
    { name: 'Settings', icon: Settings, href: '/sales/settings', color: 'text-gray-500' },
];

const SidebarContent = ({ onLinkClick }) => {
    const location = useLocation();
    return (
        <div className="flex flex-col h-full bg-card text-card-foreground">
            <div className="p-4 border-b border-border flex-shrink-0">
                <NavLink to="/company-dashboard" className="flex items-center gap-2 text-sm text-foreground-muted hover:text-foreground">
                    <ArrowLeft size={16} /> Back to Company Hub
                </NavLink>
            </div>
            <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto">
                {salesNavLinks.map((item) => (
                    <NavLink
                        key={item.name}
                        to={item.href}
                        onClick={onLinkClick}
                        end={item.href === '/sales-dashboard'}
                        className={({ isActive }) =>
                            `flex items-center px-4 py-2.5 text-sm font-medium rounded-lg transition-colors group ${isActive ? 'bg-primary text-primary-foreground' : 'text-foreground-muted hover:bg-background-muted'
                            }`
                        }
                    >
                        {({ isActive }) => (
                            <>
                                <item.icon className={`h-5 w-5 mr-3 flex-shrink-0 ${isActive ? 'text-primary-foreground' : item.color}`} />
                                <span>{item.name}</span>
                            </>
                        )}
                    </NavLink>
                ))}
            </nav>
        </div>
    );
};

const SalesLayout = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="flex h-screen bg-background text-foreground print:h-auto print:overflow-visible">
            {/* Static sidebar for desktop */}
            <div className="hidden lg:flex lg:flex-shrink-0 print:hidden">
                <div className="flex flex-col w-64 border-r border-border">
                    <SidebarContent />
                </div>
            </div>

            {/* Mobile sidebar */}
            <AnimatePresence>
                {sidebarOpen && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-30 lg:hidden print:hidden" onClick={() => setSidebarOpen(false)} />
                        <motion.div initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} transition={{ type: 'spring', stiffness: 300, damping: 30 }} className="fixed top-0 left-0 h-full w-64 z-40 print:hidden">
                            <SidebarContent onLinkClick={() => setSidebarOpen(false)} />
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            <main className="flex-1 flex flex-col overflow-hidden print:overflow-visible print:h-auto">
                <header className="lg:hidden sticky top-0 z-10 flex-shrink-0 flex h-16 bg-card shadow-sm items-center px-4 print:hidden">
                    <button type="button" className="text-foreground-muted" onClick={() => setSidebarOpen(true)}><Menu className="h-6 w-6" /></button>
                    <div className="flex-1 flex justify-center items-center"><span className="font-bold text-lg text-foreground">Sales Module</span></div>
                </header>
                <div className="flex-1 overflow-y-auto p-6 md:p-8 print:p-0 print:overflow-visible"><Outlet /></div>
            </main>
        </div>
    );
};

export default SalesLayout;