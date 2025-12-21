import React, { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import { Link, useNavigate, useSearchParams, NavLink } from 'react-router-dom';
import {
    Home,
    LayoutDashboard,
    ShoppingCart,
    Package,
    ClipboardList,
    Users,
    BarChart,
    Settings,
    LogOut,
    Sparkles,
    Menu,
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import PosSettingsView from './PosSettingsView';
import CustomersView from './CustomersView';
import ProductsView from './ProductsView';
import SalesView from './SalesView';
import InventoryView from './InventoryView';
import PosDashboardView from './PosDashboardView';
import ReportsView from './ReportsView';
import { constructImageUrl } from '../sales/utils';


const navLinks = [
    { name: 'Dashboard', icon: LayoutDashboard, Component: PosDashboardView },
    { name: 'Sales', icon: ShoppingCart, Component: SalesView },
    { name: 'Products', icon: Package, Component: ProductsView },
    { name: 'Inventory', icon: ClipboardList, Component: InventoryView },
    { name: 'Customers', icon: Users, Component: CustomersView },
    { name: 'Reports', icon: BarChart, Component: ReportsView },
    { name: 'Settings', icon: Settings, Component: PosSettingsView },
];

const NavItem = ({ item, isActive, onClick }) => (
    <button
        onClick={onClick}
        className={`flex items-center px-4 py-2.5 text-sm font-medium rounded-lg transition-colors w-full text-left ${isActive
            ? 'bg-blue-600 text-white shadow-sm'
            : 'text-slate-600 hover:bg-slate-200'
            }`}
    >
        <item.icon className="h-5 w-5 mr-3 flex-shrink-0" />
        <span>{item.name}</span>
    </button>
);

const SidebarContent = ({ activeItem, setActiveItem, onLinkClick, isSuperAdmin }) => {
    const navigate = useNavigate();
    const username = localStorage.getItem('username') || 'User';
    const [tenantLogo, setTenantLogo] = useState(null);
    const [tenantName, setTenantName] = useState('');
    const [logoImgUrl, setLogoImgUrl] = useState(null);
    const API_URL = import.meta.env.VITE_API_BASE_URL;


    const fetchTenantLogo = useCallback(async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}/company-info`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data && response.data.logoUrl) {
                setTenantName(response.data.companyName || 'POS System');
                setLogoImgUrl(response.data.logoUrl);
                setTenantLogo(constructImageUrl(response.data.logoUrl));
            } else {
                setTenantLogo(null);
                setLogoImgUrl(null);
                setTenantName(response.data?.companyName || 'POS System');
            }
        } catch (error) {
            console.error("Could not fetch company info", error);
            setLogoImgUrl(null);
            setTenantLogo(null);
        }
    }, [API_URL]);

    useEffect(() => {
        // Fetch the logo on component mount
        fetchTenantLogo();

    }, [fetchTenantLogo]);

    const handleLogout = () => {
        localStorage.clear();
        navigate('/login');
    };

    const CompanyHubNavItem = () => (
        <NavLink
            to="/company-dashboard"
            onClick={onLinkClick}
            className="flex items-center px-4 py-2.5 text-sm font-medium rounded-lg transition-colors text-slate-600 hover:bg-slate-200"
        >
            <Home className="h-5 w-5 mr-3 flex-shrink-0" />
            <span>Company Hub</span>
        </NavLink>
    );

    return (
        <div className="flex flex-col h-full bg-white">
            <div className="p-4 border-b border-slate-200 flex-shrink-0">
                <Link to="/pos-dashboard" className="flex items-center gap-3">
                    <Sparkles className="h-7 w-7 text-blue-600" />
                    <span className="font-bold text-xl text-slate-800">{tenantName}</span>
                </Link>
                <div className='ml-2 text-sm text-gray-500'>{new Date().toLocaleDateString()}</div>
            </div>


            <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto">
                {navLinks.map((item) => (
                    <NavItem
                        key={item.name}
                        item={item}
                        isActive={activeItem === item.name}
                        onClick={() => {
                            setActiveItem(item.name);
                            if (onLinkClick) onLinkClick();
                        }}
                    />
                ))}
                {isSuperAdmin && (
                    <div className="pt-4 mt-4 border-t border-slate-200">
                        <CompanyHubNavItem />
                    </div>
                )}
            </nav>
            <div className="p-4 border-t border-slate-200 flex-shrink-0">
                <div className="flex items-center justify-between">
                    <div className="flex items-center min-w-0">
                        <div className="w-10 h-10 rounded-full bg-blue-200 flex items-center justify-center font-bold text-blue-700 flex-shrink-0">
                            {username.charAt(0).toUpperCase()}
                        </div>
                        <div className="ml-3 min-w-0">
                            <p className="text-sm font-semibold text-slate-800 truncate">{username}</p>
                            <p className="text-xs text-slate-500">{localStorage.getItem('roles')}</p>
                        </div>
                    </div>
                    <button onClick={handleLogout} className="text-slate-500 hover:text-red-600 ml-2 flex-shrink-0" title="Logout">
                        <LogOut className="h-5 w-5" />
                    </button>
                </div>
            </div>
        </div>
    );

};

const PosDashboard = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [searchParams, setSearchParams] = useSearchParams();
    const activeItem = searchParams.get('view') || 'Dashboard';

    const roles = useMemo(() => {
        try {
            return JSON.parse(localStorage.getItem('roles') || '[]');
        } catch { return []; }
    }, []);
    const isSuperAdmin = roles.includes('SUPER_ADMIN');

    const setActiveItem = (itemName) => {
        setSearchParams({ view: itemName });
    };

    useEffect(() => {
        if (!searchParams.get('view')) {
            setSearchParams({ view: 'Dashboard' }, { replace: true });
        }
    }, [searchParams, setSearchParams]);

    const renderContent = () => {
        const activeLink = navLinks.find(link => link.name === activeItem) || navLinks[0];
        const Component = activeLink.Component;
        return <Component key={activeItem} setActiveItem={setActiveItem} />;
    };


    return (
        <div className="flex h-screen bg-slate-100">
            {/* Static sidebar for desktop */}
            <div className="hidden lg:flex lg:flex-shrink-0">
                <div className="flex flex-col w-64 border-r border-slate-200">
                    <SidebarContent activeItem={activeItem} setActiveItem={setActiveItem} isSuperAdmin={isSuperAdmin} />
                </div>
            </div>

            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Top bar for mobile */}
                <header className="lg:hidden sticky top-0 z-10 flex-shrink-0 flex h-16 bg-white shadow-sm">
                    <button
                        type="button"
                        className="px-4 border-r border-slate-200 text-slate-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
                        onClick={() => setSidebarOpen(true)}
                    >
                        <Menu className="h-6 w-6" />
                    </button>
                    <div className="flex-1 px-4 flex justify-between items-center">
                        <Link to="/pos-dashboard" className="flex items-center gap-2">
                            <Sparkles className="h-6 w-6 text-blue-600" />
                            <span className="font-bold text-lg">POS</span>
                        </Link>
                    </div>
                </header>

                {/* Main content */}
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-50">
                    {renderContent()}
                </main>
            </div>

            {/* Mobile menu overlay */}
            <AnimatePresence>
                {sidebarOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
                            onClick={() => setSidebarOpen(false)}
                        />
                        <motion.div
                            initial={{ x: '-100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '-100%' }}
                            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                            className="fixed top-0 left-0 h-full w-64 z-30"
                        >
                            <SidebarContent
                                activeItem={activeItem}
                                setActiveItem={setActiveItem}
                                isSuperAdmin={isSuperAdmin}
                                onLinkClick={() => setSidebarOpen(false)}
                            />
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}

export default PosDashboard;
