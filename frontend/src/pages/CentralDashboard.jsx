import React, { useState, useEffect } from 'react';
import api from '../services/api';
import {
    IndianRupee,
    ShoppingCart,
    TrendingUp,
    LayoutDashboard,
    AlertCircle,
    ArrowUpRight,
    ArrowDownRight,
    Store,
    ShieldAlert,
    Zap,
    History,
    Package
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import CrisisDashboard from '../components/CrisisDashboard';
import RecoveryDashboard from '../components/RecoveryDashboard';

const CentralDashboard = () => {
    const [stats, setStats] = useState(null);
    const [procurement, setProcurement] = useState([]);
    const [recoveryStatus, setRecoveryStatus] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isCrisisModalOpen, setIsCrisisModalOpen] = useState(false);
    const [isRecoveryModalOpen, setIsRecoveryModalOpen] = useState(false);

    useEffect(() => {
        fetchDashboardData();
        fetchRecoveryStatus();
    }, []);

    const fetchRecoveryStatus = async () => {
        try {
            const res = await api.get('/recovery/status');
            setRecoveryStatus(res.data);
        } catch (error) {
            console.error('Recovery fetch error:', error);
        }
    };

    const fetchDashboardData = async () => {
        try {
            try {
                const statsRes = await api.get('/reports/central-overview');
                if (statsRes.data) {
                    setStats(statsRes.data);
                } else {
                    console.error('Empty stats data received');
                }
            } catch (error) {
                console.error('Stats fetch error:', error);
                toast.error('Failed to fetch sales overview');
            }

            try {
                const procRes = await api.get('/purchase-orders/central-procurement');
                setProcurement(procRes.data || []);
            } catch (error) {
                console.error('Procurement fetch error:', error);
                if (error.response?.status !== 403) {
                    toast.error('Failed to fetch procurement alerts');
                }
            }
        } catch (error) {
            console.error('Dashboard data fetch general error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleGrowthEngine = async (e) => {
        if (e) e.stopPropagation();
        try {
            const res = await api.post('/recovery/toggle-engine');
            toast.success(res.data.message);
            fetchRecoveryStatus();
        } catch (error) {
            toast.error('Failed to toggle Growth Engine');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="relative w-16 h-16">
                    <div className="absolute top-0 left-0 w-full h-full border-4 border-brand-primary/10 rounded-full" />
                    <div className="absolute top-0 left-0 w-full h-full border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
                </div>
            </div>
        );
    }

    // Defensive check: if stats failed and we have no data to show
    if (!stats && !loading) {
        return (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-slate-400">
                <AlertCircle size={48} />
                <p className="font-bold text-lg">Failed to load dashboard data.</p>
                <button
                    onClick={() => { setLoading(true); fetchDashboardData(); fetchRecoveryStatus(); }}
                    className="btn-primary"
                >
                    Retry Connection
                </button>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-8 animate-fade-in">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                    <h1 className="text-3xl font-black text-brand-primary italic tracking-tighter">POWER HOUSE DASHBOARD</h1>
                    <p className="text-slate-400 font-bold text-xs uppercase tracking-[0.3em] mt-1">Smart. Simple. Scalable.</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={handleToggleGrowthEngine}
                        className={`btn-primary flex items-center gap-2 shadow-lg transition-all ${recoveryStatus?.is_recovering ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200' : 'bg-slate-700 hover:bg-slate-800 shadow-slate-200'}`}
                    >
                        <Zap size={18} fill="currentColor" />
                        {recoveryStatus?.is_recovering ? 'GROWTH_ACTIVE' : 'LAUNCH_GROWTH_ENGINE'}
                    </button>
                    <button
                        onClick={() => setIsCrisisModalOpen(true)}
                        className="btn-primary bg-red-600 hover:bg-red-700 flex items-center gap-2 shadow-lg shadow-red-200"
                    >
                        <Zap size={18} fill="currentColor" />
                        CRISIS_ADVISOR
                    </button>
                </div>
            </div>

            {/* Strategic Intelligence Banner */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div
                    onClick={() => setIsCrisisModalOpen(true)}
                    className="group relative overflow-hidden rounded-[2rem] bg-slate-900 p-8 shadow-2xl cursor-pointer hover:scale-[1.01] transition-all duration-500"
                >
                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-125 transition-transform duration-700">
                        <ShieldAlert size={120} className="text-white" />
                    </div>
                    <div className="relative z-10 flex flex-col h-full justify-between gap-8">
                        <div>
                            <span className="inline-block px-3 py-1 bg-red-500 text-white text-[10px] font-black rounded-full uppercase tracking-widest mb-4">Urgent</span>
                            <h3 className="text-2xl font-black text-white leading-tight uppercase">AI Crisis<br />Monitor</h3>
                        </div>
                        <div className="flex items-center gap-2 text-red-400 font-black text-xs tracking-widest uppercase group-hover:gap-4 transition-all">
                            Analyze Emergency <ArrowUpRight size={18} />
                        </div>
                    </div>
                </div>

                <div
                    onClick={() => recoveryStatus?.is_recovering ? setIsRecoveryModalOpen(true) : handleToggleGrowthEngine()}
                    className={`group relative overflow-hidden rounded-[2rem] p-8 shadow-2xl transition-all duration-500 cursor-pointer hover:scale-[1.01] ${recoveryStatus?.is_recovering
                        ? 'bg-emerald-900'
                        : 'bg-slate-100 hover:bg-slate-200'}`}
                >
                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-125 transition-transform duration-700">
                        <TrendingUp size={120} className="text-white" />
                    </div>
                    <div className="relative z-10 flex flex-col h-full justify-between gap-8">
                        <div>
                            <span className={`inline-block px-3 py-1 text-white text-[10px] font-black rounded-full uppercase tracking-widest mb-4 ${recoveryStatus?.is_recovering ? 'bg-emerald-500' : 'bg-slate-400'}`}>
                                {recoveryStatus?.is_recovering ? 'Active Recovery' : 'Monitoring'}
                            </span>
                            <h3 className={`text-2xl font-black leading-tight uppercase ${recoveryStatus?.is_recovering ? 'text-white' : 'text-slate-600'}`}>Growth<br />Engine v2</h3>
                        </div>
                        <div className={`flex items-center gap-2 font-black text-xs tracking-widest uppercase group-hover:gap-4 transition-all ${recoveryStatus?.is_recovering ? 'text-emerald-400' : 'text-slate-400'}`}>
                            {recoveryStatus?.is_recovering ? 'View Growth Plan' : 'Optimization Dormant (Launch)'} <ArrowUpRight size={18} />
                        </div>
                    </div>
                </div>
            </div>

            {/* KPI Performance Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Gross Revenue"
                    value={`₹${(stats?.total_revenue || 0).toLocaleString()}`}
                    icon={<IndianRupee size={24} className="text-white" strokeWidth={3} />}
                    trend="+12.5%"
                    isPositive={true}
                    color="brand"
                />
                <StatCard
                    title="Volume Metrics"
                    value={(stats?.total_orders || 0).toLocaleString()}
                    icon={<ShoppingCart size={24} className="text-white" strokeWidth={3} />}
                    trend="+8.2%"
                    isPositive={true}
                    color="indigo"
                />
                <StatCard
                    title="Transaction Avg"
                    value={`₹${stats ? (stats.total_revenue / (stats.total_orders || 1)).toFixed(2) : '0.00'}`}
                    icon={<TrendingUp size={24} className="text-white" strokeWidth={3} />}
                    trend="-2.4%"
                    isPositive={false}
                    color="slate"
                />
                <StatCard
                    title="Active Branches"
                    value={stats?.branch_performance?.length || 0}
                    icon={<Store size={24} className="text-white" strokeWidth={3} />}
                    trend="Operational"
                    isPositive={true}
                    color="amber"
                />
            </div>

            {/* Main Insights Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                {/* Branch Operations Table */}
                <div className="premium-card p-8 border-2 border-slate-50 flex flex-col h-full">
                    <div className="flex justify-between items-center mb-8">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl"><LayoutDashboard size={20} /></div>
                            <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight italic">Branch Performance</h2>
                        </div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Global Status: Healthy</span>
                    </div>

                    <div className="flex-1 overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50">
                                    <th className="pb-4">Branch</th>
                                    <th className="pb-4 text-right">Gross Sales</th>
                                    <th className="pb-4 text-right">Transactions</th>
                                    <th className="pb-4 text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {stats?.branch_performance?.map((branch, idx) => (
                                    <tr key={idx} className="group hover:bg-slate-50/50 transition-colors">
                                        <td className="py-5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                                <span className="font-bold text-slate-700 text-sm uppercase">{branch.branch_name}</span>
                                            </div>
                                        </td>
                                        <td className="py-5 text-right font-black text-slate-900 text-sm">₹{(branch.total_sales || 0).toLocaleString()}</td>
                                        <td className="py-5 text-right font-bold text-slate-500 text-sm">{branch.total_orders || 0}</td>
                                        <td className="py-5 text-center">
                                            <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-[9px] font-black uppercase tracking-tighter">Peak</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Procurement & Supply Chain */}
                <div className="premium-card p-8 border-2 border-red-50 flex flex-col h-full">
                    <div className="flex justify-between items-center mb-8">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-red-50 text-red-600 rounded-xl"><AlertCircle size={20} /></div>
                            <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight italic">Procurement Alerts</h2>
                        </div>
                        <button className="text-[10px] font-black text-brand-primary bg-indigo-50 px-3 py-1 rounded-full uppercase tracking-widest hover:bg-brand-primary hover:text-white transition-all">Consolidate All</button>
                    </div>

                    <div className="flex-1 space-y-4 overflow-y-auto no-scrollbar max-h-[400px]">
                        {(procurement || []).length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 grayscale opacity-30">
                                <Package size={48} strokeWidth={1} className="mb-4" />
                                <p className="font-black text-xs uppercase tracking-widest">Supply Chain Healthy</p>
                            </div>
                        ) : procurement.map((supplier, idx) => (
                            <div key={idx} className="bg-white rounded-2xl border border-red-100 p-6 shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="font-black text-red-800 uppercase text-xs tracking-widest">{supplier.supplier_name}</h3>
                                    <span className="px-2 py-1 bg-red-100 text-red-700 text-[10px] font-black rounded-lg">{supplier.items?.length || 0} SHORTAGES</span>
                                </div>
                                <div className="grid grid-cols-1 gap-2">
                                    {supplier.items?.map((item, iidx) => (
                                        <div key={iidx} className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
                                            <div className="flex flex-col">
                                                <span className="text-xs font-black text-slate-700 uppercase tracking-tight">{item.raw_material_name}</span>
                                                <span className="text-[10px] font-bold text-slate-400 italic">Branch: {item.branch_name}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] font-black text-red-500 uppercase tracking-widest">Deficit:</span>
                                                <span className="font-black text-sm text-slate-800">{item.shortage}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Global Logs Section */}
            <div className="premium-card p-8 border-2 border-slate-50">
                <div className="flex items-center gap-3 mb-8">
                    <div className="p-2 bg-slate-100 text-slate-600 rounded-xl"><History size={20} /></div>
                    <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight italic text-brand-primary">Global Transaction Stream</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50">
                                <th className="pb-4">Transaction ID</th>
                                <th className="pb-4">Branch</th>
                                <th className="pb-4 text-right">Amount</th>
                                <th className="pb-4 text-right">Timestamp</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {stats?.recent_global_sales?.map((sale, idx) => (
                                <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="py-4 font-black text-indigo-500 text-xs tracking-widest">#S_{sale.id}</td>
                                    <td className="py-4 font-bold text-slate-500 text-xs uppercase">{sale.branch_name || 'SYSTEM'}</td>
                                    <td className="py-4 text-right font-black text-slate-800 text-sm">₹{(sale.amount || 0).toFixed(2)}</td>
                                    <td className="py-4 text-right font-medium text-slate-400 text-xs">{sale.date ? new Date(sale.date).toLocaleString() : 'N/A'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {isCrisisModalOpen && <CrisisDashboard onClose={() => setIsCrisisModalOpen(false)} />}
            {isRecoveryModalOpen && <RecoveryDashboard onClose={() => setIsRecoveryModalOpen(false)} />}
        </div>
    );
};

const StatCard = ({ title, value, icon, trend, isPositive, color }) => {
    const colorMap = {
        brand: 'bg-brand-primary shadow-brand-primary/20',
        indigo: 'bg-indigo-600 shadow-indigo-200',
        slate: 'bg-slate-800 shadow-slate-200',
        amber: 'bg-brand-accent shadow-brand-accent/30',
    };

    return (
        <div className="premium-card p-8 border-2 border-slate-50 group hover:border-brand-primary/10 hover:scale-[1.02] transition-all">
            <div className="flex justify-between items-start mb-6">
                <div className={`p-4 rounded-2xl ${colorMap[color]} shadow-lg group-hover:rotate-12 transition-transform duration-500`}>
                    {icon}
                </div>
                <div className={`flex items-center gap-1 text-[10px] font-black uppercase tracking-widest ${isPositive ? 'text-emerald-500' : 'text-red-500'}`}>
                    {isPositive ? <ArrowUpRight size={14} strokeWidth={3} /> : <ArrowDownRight size={14} strokeWidth={3} />}
                    {trend}
                </div>
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{title}</p>
            <p className="text-3xl font-black text-slate-800 tracking-tighter">{value}</p>
        </div>
    );
};

export default CentralDashboard;
