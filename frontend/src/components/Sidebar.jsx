import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
    ShoppingCart,
    Package,
    Users,
    BarChart3,
    LogOut,
    Coffee,
    Truck,
    Database,
    ClipboardList,
    Store,
    ArrowLeftRight,
    PieChart,
    QrCode,
    ShieldAlert,
    UserCheck,
    UserCircle,
    Bot,
    TrendingUp,
    Video,
    Menu,
    X
} from 'lucide-react';
import { useChat } from '../context/ChatContext';
import Logo from './Logo';

const Sidebar = () => {
    const { logout, user } = useAuth();
    const { toggleChat, isChatOpen } = useChat();
    const navigate = useNavigate();
    const location = useLocation();
    const [isCrisis, setIsCrisis] = useState(false);

    const checkHealth = async () => {
        try {
            const res = await api.get('/assistant/crisis-status');
            setIsCrisis(res.data.status === 'CRISIS');
        } catch {
            console.error('Sidebar health check failed');
        }
    };

    useEffect(() => {
        if (['owner', 'admin'].includes(user?.role)) {
            checkHealth();
            const interval = setInterval(checkHealth, 30000);
            return () => clearInterval(interval);
        }
    }, [user]);

    const menuItems = [
        { path: '/dashboard', icon: PieChart, title: 'Central Dashboard', roles: ['owner', 'admin'] },
        { path: '/branches', icon: Store, title: 'Branches', roles: ['owner', 'admin'] },
        { path: '/pos', icon: ShoppingCart, title: 'POS', roles: ['owner', 'admin', 'branch_manager', 'cashier'] },
        { path: '/inventory', icon: Package, title: 'Inventory', roles: ['owner', 'admin', 'branch_manager'] },
        { path: '/raw-materials', icon: Database, title: 'Raw Materials', roles: ['owner', 'admin', 'branch_manager'] },
        { path: '/transfers', icon: ArrowLeftRight, title: 'Stock Transfers', roles: ['owner', 'admin', 'branch_manager'] },
        { path: '/suppliers', icon: Truck, title: 'Suppliers', roles: ['owner', 'admin', 'branch_manager'] },
        { path: '/customers', icon: UserCircle, title: 'Customers', roles: ['owner', 'admin', 'branch_manager', 'cashier'] },
        { path: '/reports', icon: BarChart3, title: 'Reports', roles: ['owner', 'admin', 'branch_manager'] },
        { path: '/tables', icon: QrCode, title: 'Tables', roles: ['owner', 'admin', 'branch_manager'] },
        { path: '/social-dashboard', icon: TrendingUp, title: 'Social Commerce', roles: ['owner', 'admin'] },
        { path: '/staff', icon: UserCheck, title: 'Staff Management', roles: ['owner', 'admin', 'branch_manager'] },
        { path: '/security', icon: ShieldAlert, title: 'Security & Fraud', roles: ['owner', 'admin'] },
        { id: 'ai-assistant', icon: Bot, title: 'AI Assistant', roles: ['owner', 'admin'], isAction: true },
    ];

    // Top items for mobile bottom nav
    const mobileNavItems = menuItems
        .filter(item => item.roles.includes(user?.role))
        .slice(0, 5);

    return (
        <>
            {/* === DESKTOP SIDEBAR (hidden on mobile) === */}
            <div className="hidden md:flex w-20 bg-brand-primary text-white flex-col items-center py-8 shadow-2xl z-40 transition-all duration-500 border-r border-white/5">
                <div className="mb-10 cursor-pointer hover:scale-110 transition-transform" onClick={() => navigate('/dashboard')}>
                    <Logo size="sm" />
                </div>

                <div className="flex-1 flex flex-col items-center space-y-2 overflow-y-auto no-scrollbar w-full px-2">
                    {menuItems.map((item, index) => {
                        if (item.roles && !item.roles.includes(user?.role)) return null;
                        const Icon = item.icon;
                        const isActive = item.isAction ? isChatOpen : location.pathname === item.path;
                        const clickHandler = item.isAction ? toggleChat : () => navigate(item.path);

                        return (
                            <button
                                key={item.id || item.path}
                                onClick={clickHandler}
                                className={`w-12 h-12 flex items-center justify-center rounded-xl transition-all duration-300 relative group animate-fade-in`}
                                style={{ animationDelay: `${index * 50}ms` }}
                            >
                                <div className={`absolute left-0 w-1 rounded-r-full transition-all duration-300 ${isActive ? 'h-6 bg-brand-accent opacity-100' : 'h-0 bg-transparent opacity-0'}`} />

                                <div className={`flex items-center justify-center transition-all duration-300 ${isActive
                                    ? 'text-brand-accent bg-white/10 shadow-inner'
                                    : 'text-slate-400 hover:text-white hover:bg-white/5'} 
                                    w-10 h-10 rounded-xl`}
                                >
                                    <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                                </div>

                                {/* Tooltip */}
                                <div className="absolute left-16 px-3 py-2 bg-slate-800 text-white text-xs font-bold rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 whitespace-nowrap z-50 shadow-xl border border-white/10">
                                    {item.title}
                                    <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 bg-slate-800 rotate-45 border-l border-b border-white/10" />
                                </div>

                                {item.path === '/security' && isCrisis && (
                                    <span className="absolute top-2 right-2 flex h-3 w-3">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600 shadow-sm shadow-red-900/50"></span>
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>

                <button
                    onClick={logout}
                    className="mt-6 p-4 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-2xl transition-all duration-300 group relative"
                >
                    <LogOut size={24} strokeWidth={2} />
                    <div className="absolute left-16 px-3 py-2 bg-red-600 text-white text-xs font-bold rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 whitespace-nowrap z-50 shadow-xl">
                        Logout
                        <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 bg-red-600 rotate-45" />
                    </div>
                </button>
            </div>

            {/* === MOBILE BOTTOM NAV (hidden on desktop) === */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-brand-primary/95 backdrop-blur-lg border-t border-white/10 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.3)]">
                <div className="flex items-center justify-around px-1 py-1 safe-area-bottom">
                    {mobileNavItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = item.isAction ? isChatOpen : location.pathname === item.path;
                        const clickHandler = item.isAction ? toggleChat : () => navigate(item.path);
                        return (
                            <button
                                key={item.id || item.path}
                                onClick={clickHandler}
                                className="flex flex-col items-center justify-center min-w-[64px] py-1.5 rounded-xl transition-all duration-300 relative active:scale-90"
                            >
                                <div className={`transition-all duration-300 p-1.5 rounded-lg ${isActive ? 'bg-brand-accent text-brand-primary' : 'text-slate-400'}`}>
                                    <Icon size={18} strokeWidth={isActive ? 3 : 2} />
                                </div>
                                <span className={`text-[8px] font-black uppercase tracking-widest mt-0.5 ${isActive ? 'text-brand-accent' : 'text-slate-500'}`}>
                                    {item.title.split(' ')[0]}
                                </span>
                                {item.path === '/security' && isCrisis && (
                                    <span className="absolute top-1.5 right-4 flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600 shadow-sm"></span>
                                    </span>
                                )}
                            </button>
                        );
                    })}
                    {/* Logout button on mobile nav */}
                    <button
                        onClick={logout}
                        className="flex flex-col items-center justify-center min-w-[64px] py-1.5 rounded-xl transition-all duration-300 active:scale-90 text-slate-500 hover:text-red-400"
                    >
                        <div className="p-1.5">
                            <LogOut size={18} strokeWidth={2} />
                        </div>
                        <span className="text-[8px] font-black uppercase tracking-widest mt-0.5">Exit</span>
                    </button>
                </div>
            </div>
        </>
    );
};

export default Sidebar;
