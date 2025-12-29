import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation, Routes, Route, Navigate } from 'react-router-dom';
import { 
    LayoutDashboard, 
    ShoppingCart, 
    Receipt, 
    CreditCard, 
    FileMinus,
    Settings, 
    LogOut, 
    Menu,
    ArrowLeft,
    FileText,
    ChevronDown,
    ChevronRight,
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import PurchaseOrderPage from '../components/PurchaseOrderPage';
import PurchaseOrderForm from '../components/PurchaseOrderForm';

import PurchaseInvoicePage from '../components/PurchaseInvoicePage';
import PurchaseInvoiceForm from '../components/PurchaseInvoiceForm';
import PurchasePaymentPage from '../components/PurchasePaymentPage';
import PurchasePaymentForm from '../components/PurchasePaymentForm';
import PurchaseOrderView from '../components/PurchaseOrderView';
import PurchaseInvoiceView from '../components/PurchaseInvoiceView';
import PurchasePaymentView from '../components/PurchasePaymentView';
import PurchaseGrnView from '../components/PurchaseGrnView';
import PurchaseGrnForm from '../components/PurchaseGrnForm';
import PurchaseDebitNotePage from '../components/PurchaseDebitNotePage';
import PurchaseDebitNoteForm from '../components/PurchaseDebitNoteForm';
import PurchaseDebitNoteView from '../components/PurchaseDebitNoteView';
import SupplierBalanceReport from './reports/SupplierBalanceReport';
import BillDetailsReport from './reports/BillDetailsReport';
import PaymentMadeReport from './reports/PaymentMadeReport';
import PurchaseOrdersBySupplierReport from './reports/PurchaseOrdersBySupplierReport';
import PurchaseOrderDetailsReport from './reports/PurchaseOrderDetailsReport';
import SupplierSOAReport from './reports/SupplierSOAReport';


const purchaseNavLinks = [
    { name: 'Dashboard', icon: LayoutDashboard, href: '/purchase-dashboard/dashboard', color: 'text-blue-500' },
    { name: 'Purchase Order', icon: ShoppingCart, href: '/purchase-dashboard/purchase-orders', color: 'text-green-500' },
    { name: 'Invoice', icon: Receipt, href: '/purchase-dashboard/bills', color: 'text-yellow-500' },
    { name: 'Payments', icon: CreditCard, href: '/purchase-dashboard/payments', color: 'text-purple-500' },
    { name: 'Debit Notes', icon: FileMinus, href: '/purchase-dashboard/debit-notes', color: 'text-rose-500' },
];

const SidebarContent = ({ onLinkClick }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const [reportsOpen, setReportsOpen] = useState(true);

    const handleLogout = () => {
        localStorage.clear();
        navigate('/login');
    };

    const NavItem = ({ item }) => {
        return (
            <NavLink to={item.href} onClick={onLinkClick} end className={({ isActive }) => `flex items-center px-4 py-2.5 text-sm font-medium rounded-lg transition-colors group ${ isActive ? 'bg-primary text-primary-foreground shadow-sm' : 'text-foreground-muted hover:bg-background-muted' }`}>
                <item.icon className={`h-5 w-5 mr-3 flex-shrink-0 ${location.pathname.startsWith(item.href) ? '' : item.color}`} />
                <span>{item.name}</span>
            </NavLink>
        );
    };

    return (
        <div className="flex flex-col h-full bg-card text-card-foreground">
            <div className="p-4 border-b border-border flex-shrink-0">
                <button onClick={() => navigate('/company-dashboard')} className="flex items-center gap-3 w-full text-left">
                    <ArrowLeft className="h-6 w-6 text-primary" />
                    <span className="font-bold text-xl text-foreground">Company Hub</span>
                </button>
            </div>
            <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
                {purchaseNavLinks.map((item) => <NavItem key={item.name} item={item} />)}

                {/* Reports Section */}
                <div className="pt-2">
                    <button 
                        onClick={() => setReportsOpen(!reportsOpen)}
                        className="flex items-center w-full px-4 py-2.5 text-sm font-medium rounded-lg text-foreground-muted hover:bg-background-muted group"
                    >
                        <FileText className="h-5 w-5 mr-3 flex-shrink-0 text-indigo-500" />
                        <span className="flex-1 text-left">Reports</span>
                        {reportsOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </button>
                    {reportsOpen && (
                        <div className="pl-4 mt-1 space-y-1">
                            <NavLink 
                                to="/purchase-dashboard/reports/supplier-balance" 
                                onClick={onLinkClick}
                                className={({ isActive }) => `flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors ${ isActive ? 'bg-primary/10 text-primary' : 'text-foreground-muted hover:bg-background-muted' }`}
                            >
                                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mr-3" />
                                Supplier Balances
                            </NavLink>
                            <NavLink 
                                to="/purchase-dashboard/reports/bill-details" 
                                onClick={onLinkClick}
                                className={({ isActive }) => `flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors ${ isActive ? 'bg-primary/10 text-primary' : 'text-foreground-muted hover:bg-background-muted' }`}
                            >
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mr-3" />
                                Bill Details
                            </NavLink>
                            <NavLink 
                                to="/purchase-dashboard/reports/payments-made" 
                                onClick={onLinkClick}
                                className={({ isActive }) => `flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors ${ isActive ? 'bg-primary/10 text-primary' : 'text-foreground-muted hover:bg-background-muted' }`}
                            >
                                <span className="w-1.5 h-1.5 rounded-full bg-purple-500 mr-3" />
                                Payments Made
                            </NavLink>
                            <NavLink 
                                to="/purchase-dashboard/reports/purchase-orders-by-supplier" 
                                onClick={onLinkClick}
                                className={({ isActive }) => `flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors ${ isActive ? 'bg-primary/10 text-primary' : 'text-foreground-muted hover:bg-background-muted' }`}
                            >
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mr-3" />
                               Purchase Orders By Supplier
                            </NavLink>
                            <NavLink 
                                to="/purchase-dashboard/reports/purchase-order-details" 
                                onClick={onLinkClick}
                                className={({ isActive }) => `flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors ${ isActive ? 'bg-primary/10 text-primary' : 'text-foreground-muted hover:bg-background-muted' }`}
                            >
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-3" />
                                Purchase Order Details
                            </NavLink>
                            <NavLink 
                                to="/purchase-dashboard/reports/supplier-soa" 
                                onClick={onLinkClick}
                                className={({ isActive }) => `flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors ${ isActive ? 'bg-primary/10 text-primary' : 'text-foreground-muted hover:bg-background-muted' }`}
                            >
                                <span className="w-1.5 h-1.5 rounded-full bg-pink-500 mr-3" />
                                Supplier SOA
                            </NavLink>

                        </div>
                    )}
                </div>
            </nav>
            <div className="p-4 border-t border-border flex-shrink-0 space-y-2">
                <NavLink to="/company-settings/purchase" onClick={onLinkClick} className={({ isActive }) => `flex items-center px-4 py-2.5 text-sm font-medium rounded-lg transition-colors group ${ isActive ? 'bg-primary text-primary-foreground shadow-sm' : 'text-foreground-muted hover:bg-background-muted' }`}>
                    <Settings className="h-5 w-5 mr-3" />
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

const PurchaseLayout = ({ children }) => {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="flex h-screen bg-background text-foreground">
            {/* Static sidebar for desktop */}
            <div className="hidden lg:flex lg:flex-shrink-0">
                <div className="flex flex-col w-64 border-r border-border">
                    <SidebarContent />
                </div>
            </div>

            {/* Mobile sidebar */}
            <AnimatePresence>
                {sidebarOpen && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="fixed inset-0 bg-black/50 z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />
                        <motion.div initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} transition={{ type: 'spring', stiffness: 300, damping: 30 }} className="fixed top-0 left-0 h-full w-64 z-30 bg-card text-card-foreground">
                            <SidebarContent onLinkClick={() => setSidebarOpen(false)} />
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            <main className="flex-1 flex flex-col overflow-hidden">
                <header className="lg:hidden sticky top-0 z-10 flex-shrink-0 flex h-16 bg-card shadow-sm items-center px-4">
                    <button type="button" className="text-foreground-muted" onClick={() => setSidebarOpen(true)}><Menu className="h-6 w-6" /></button>
                    <div className="flex-1 flex justify-center items-center"><span className="font-bold text-lg text-foreground">Purchases Module</span></div>
                </header>
                <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-background-muted">{children}</div>
            </main>
        </div>
    );
};

const PurchasePlaceholder = ({ pageName }) => (
  <div className="text-center py-20">
    <h1 className="text-3xl font-bold text-foreground">{pageName}</h1>
    <p className="text-foreground-muted mt-2">This page is under construction.</p>
  </div>
);

const PurchaseModule = () => {
    return (
        <PurchaseLayout>
            <Routes>
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<PurchasePlaceholder pageName="Dashboard" />} />
                <Route path="purchase-orders" element={<PurchaseOrderPage />} />
                <Route path="purchase-orders/new" element={<PurchaseOrderForm />} />
                <Route path="purchase-orders/view/:id" element={<PurchaseOrderView />} />
                <Route path="purchase-orders/edit/:id" element={<PurchaseOrderForm />} />
                <Route path="purchase-orders/:id/grn/new" element={<PurchaseGrnForm />} />
                <Route path="grns/:id" element={<PurchaseGrnView />} />



                <Route path="bills" element={<PurchaseInvoicePage />} />
                <Route path="bills/new" element={<PurchaseInvoiceForm />} />
                <Route path="bills/edit/:id" element={<PurchaseInvoiceForm />} />
                <Route path="bills/view/:id" element={<PurchaseInvoiceView />} />
                <Route path="payments" element={<PurchasePaymentPage />} />
                <Route path="payments/new" element={<PurchasePaymentForm />} />
                <Route path="payments/edit/:id" element={<PurchasePaymentForm />} />
                <Route path="payments/view/:id" element={<PurchasePaymentView />} />

                <Route path="debit-notes" element={<PurchaseDebitNotePage />} />
                <Route path="debit-notes/new" element={<PurchaseDebitNoteForm />} />
                <Route path="debit-notes/edit/:id" element={<PurchaseDebitNoteForm />} />
                <Route path="debit-notes/view/:id" element={<PurchaseDebitNoteView />} />
                
                <Route path="reports/supplier-balance" element={<SupplierBalanceReport />} />
                <Route path="reports/bill-details" element={<BillDetailsReport />} />
                <Route path="reports/payments-made" element={<PaymentMadeReport />} />
                <Route path="reports/purchase-orders-by-supplier" element={<PurchaseOrdersBySupplierReport />} />
                <Route path="reports/purchase-order-details" element={<PurchaseOrderDetailsReport />} />
                <Route path="reports/supplier-soa" element={<SupplierSOAReport />} />
                
                {/* Add other purchase module routes here */}
            </Routes>
        </PurchaseLayout>
    );
}

export default PurchaseModule;
