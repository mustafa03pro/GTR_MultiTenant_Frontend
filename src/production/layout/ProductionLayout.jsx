
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import {
    Settings, Factory, List, MapPin, Package, Layers,
    SlidersHorizontal, LayoutGrid, Box, ArrowLeft, Menu, X,
    LogOut
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_BASE_URL;

export const productionNavLinks = [
    { name: 'General', icon: Settings, color: 'text-cyan-500' },
    { name: 'Workgroup', icon: Factory, color: 'text-orange-500' },
    { name: 'Manage Process', icon: Layers, color: 'text-green-500' },
    { name: 'Parameter', icon: SlidersHorizontal, color: 'text-indigo-500' },
    { name: 'Categories', icon: LayoutGrid, color: 'text-rose-500' },
    { name: 'Raw Materials', icon: Package, color: 'text-amber-500' },
    { name: 'Semi Finished', icon: Box, color: 'text-teal-500' },
    { name: 'Finished Good', icon: Box, color: 'text-blue-600' },
    { name: 'BOM', icon: List, color: 'text-purple-500' },
];

const ProductionLayout = ({ children, activeTab, onTabChange, title = "Production Configuration", headerActions }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [locations, setLocations] = useState([]);
    const [selectedLocation, setSelectedLocation] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLocations = async () => {
            setLoading(true);
            try {
                const token = localStorage.getItem('token');
                const res = await axios.get(`${API_URL}/locations`, { headers: { Authorization: `Bearer ${token}` } });
                setLocations(res.data);
                if (res.data.length > 0) {
                    setSelectedLocation('all');
                }
            } catch (err) {
                console.error("Failed to fetch locations:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchLocations();
    }, []);

    // Helper to handle navigation
    const handleNavClick = (linkName) => {
        setIsSidebarOpen(false);
        if (onTabChange) {
            onTabChange(linkName);
        } else {
            // Default behavior: Navigate to settings with tab param
            navigate(`/production-settings?tab=${encodeURIComponent(linkName)}`);
        }
    };

    const activeTabClass = 'bg-blue-50 border-l-4 border-blue-600 text-blue-700 font-semibold';
    const inactiveTabClass = 'border-l-4 border-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-800';

    return (
        <div className="flex flex-col h-screen bg-slate-50 overflow-hidden">
            {/* Header */}
            <header className="bg-white shadow-sm p-4 border-b border-slate-200 z-20 flex-shrink-0">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-slate-100">
                            <ArrowLeft className="h-5 w-5 text-slate-600" />
                        </button>
                        <button onClick={() => setIsSidebarOpen(true)} className="md:hidden p-2 rounded-full hover:bg-slate-100">
                            <Menu className="h-5 w-5 text-slate-600" />
                        </button>
                        <div>
                            <h1 className="text-xl font-bold text-slate-800">{title}</h1>
                            <p className="text-sm text-slate-500">Manage company-wide settings for the Production module.</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        {headerActions && <div>{headerActions}</div>}

                        <div className="relative">
                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                            <select
                                value={selectedLocation}
                                onChange={(e) => setSelectedLocation(e.target.value)}
                                className="pl-10 pr-8 py-2 text-sm border border-slate-300 rounded-md focus:ring-blue-500 focus:border-blue-500 w-full sm:w-56"
                                disabled={loading}
                            >
                                <option value="all">All Locations</option>
                                {loading ? <option>Loading...</option> : locations.map(loc => <option key={loc.id} value={loc.id}>{loc.name}</option>)}
                            </select>
                        </div>
                    </div>
                </div>
            </header>

            <div className="flex-grow flex overflow-hidden">
                {/* Overlay for mobile */}
                {isSidebarOpen && (
                    <div className="fixed inset-0 bg-black/50 z-30 md:hidden" onClick={() => setIsSidebarOpen(false)}></div>
                )}

                {/* Sidebar */}
                <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-slate-200 p-4 md:p-6 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} overflow-y-auto`}>
                    <button onClick={() => setIsSidebarOpen(false)} className="md:hidden p-2 rounded-full hover:bg-slate-100 absolute top-2 right-2">
                        <X className="h-5 w-5 text-slate-600" />
                    </button>
                    <nav className="flex flex-col space-y-2 mt-10 md:mt-0">
                        {productionNavLinks.map(link => (
                            <button
                                key={link.name}
                                onClick={() => handleNavClick(link.name)}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all ${activeTab === link.name ? activeTabClass : inactiveTabClass}`}
                            >
                                <link.icon className={`h-5 w-5 ${link.color}`} />
                                <span>{link.name}</span>
                            </button>
                        ))}
                    </nav>
                </aside>

                <main className="flex-grow p-6 md:p-8 w-full md:w-auto overflow-y-auto">
                    {/* Inject selectedLocation into children if possible, or context */}
                    {React.Children.map(children, child => {
                        if (React.isValidElement(child) && typeof child.type !== 'string') {
                            return React.cloneElement(child, { locationId: selectedLocation });
                        }
                        return child;
                    })}
                </main>
            </div>
        </div>
    );
};

export default ProductionLayout;
