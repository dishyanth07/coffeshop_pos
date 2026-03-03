import React, { useState, useEffect } from 'react';
import api from '../services/api';
import {
    TrendingUp,
    Users,
    IndianRupee,
    Zap,
    X,
    Calendar,
    Star,
    Menu as MenuIcon,
    Award,
    CheckCircle,
    ChevronRight,
    MessageSquare,
    RefreshCw,
    ArrowUpRight
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const RecoveryDashboard = ({ onClose }) => {
    const [status, setStatus] = useState(null);
    const [winBack, setWinBack] = useState([]);
    const [profitOpts, setProfitOpts] = useState([]);
    const [reputation, setReputation] = useState([]);
    const [menuOpts, setMenuOpts] = useState({ to_remove: [], to_promote: [] });
    const [staffKpis, setStaffKpis] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');
    const [selectedStaff, setSelectedStaff] = useState(null);
    const [incentiveAmount, setIncentiveAmount] = useState('');
    const [showIncentiveModal, setShowIncentiveModal] = useState(false);

    useEffect(() => {
        fetchAllData();
    }, []);

    const fetchAllData = async () => {
        setLoading(true);
        try {
            // Fetch status (Growth Plan) first as it's the core
            try {
                const statusRes = await api.get('/recovery/status');
                setStatus(statusRes.data);
            } catch (error) {
                console.error('Failed to fetch recovery status:', error);
            }

            // Fetch other supplementary data in parallel
            const fetchers = [
                { key: 'winBack', fn: () => api.get('/recovery/win-back'), setter: setWinBack },
                { key: 'profit', fn: () => api.get('/recovery/profit-optimization'), setter: setProfitOpts },
                { key: 'reputation', fn: () => api.get('/recovery/reputation-repair'), setter: setReputation },
                { key: 'menu', fn: () => api.get('/recovery/menu-optimization'), setter: setMenuOpts },
                { key: 'staff', fn: () => api.get('/recovery/staff-motivation'), setter: setStaffKpis }
            ];

            await Promise.all(fetchers.map(async ({ key, fn, setter }) => {
                try {
                    const res = await fn();
                    setter(res.data);
                } catch (error) {
                    console.error(`Failed to fetch ${key}:`, error);
                }
            }));

            if (!status) {
                // If we don't have basic status, we might want to warn the user, 
                // but let's see what we got.
            }
        } catch (error) {
            console.error('Failed to fetch recovery data:', error);
            toast.error('Partial data loaded. Some growth insights may be missing.');
        } finally {
            setLoading(false);
        }
    };

    const handleAction = (message) => {
        toast.success(message, {
            icon: '🚀',
            style: {
                borderRadius: '12px',
                background: '#10b981',
                color: '#fff',
            },
        });
    };

    const handleSetIncentive = (staff) => {
        setSelectedStaff(staff);
        setIncentiveAmount('');
        setShowIncentiveModal(true);
    };

    const submitIncentive = () => {
        if (!incentiveAmount) return toast.error('Please enter an amount');
        handleAction(`Incentive of ₹${incentiveAmount} set for ${selectedStaff.name}`);
        setShowIncentiveModal(false);
    };

    if (loading) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                <div className="bg-white p-8 rounded-2xl shadow-xl flex flex-col items-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mb-4"></div>
                    <p className="text-gray-600 font-medium">Detecting Growth Signals...</p>
                </div>
            </div>
        );
    }

    const tabs = [
        { id: 'overview', label: 'Recovery Score', icon: TrendingUp },
        { id: 'growth', label: '30-Day Plan', icon: Calendar },
        { id: 'customers', label: 'Win-Back', icon: Users },
        { id: 'profit', label: 'Optimization', icon: IndianRupee },
        { id: 'staff', label: 'Incentives', icon: Award }
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
            <div className="bg-white w-full max-w-5xl max-h-[90vh] rounded-3xl shadow-2xl overflow-hidden border border-emerald-100 flex flex-col">
                {/* Header */}
                <div className="p-6 bg-gradient-to-r from-emerald-600 to-teal-500 text-white flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <Zap size={32} />
                        <div>
                            <h2 className="text-2xl font-bold uppercase tracking-tight">Recovery Mode Dashboard</h2>
                            <p className="text-sm opacity-90">Post-Crisis Growth & Profit Optimization</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {/* Main Content Area */}
                <div className="flex flex-1 overflow-hidden">
                    {/* Sidebar Tabs */}
                    <div className="w-64 bg-gray-50 border-r border-gray-100 p-4 space-y-2 overflow-y-auto">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === tab.id
                                    ? 'bg-emerald-600 text-white shadow-md'
                                    : 'text-gray-500 hover:bg-emerald-50 hover:text-emerald-600'
                                    }`}
                            >
                                <tab.icon size={20} />
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Content Section */}
                    <div className="flex-1 overflow-y-auto p-8">
                        {activeTab === 'overview' && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="bg-emerald-50 rounded-2xl p-8 border border-emerald-100 relative overflow-hidden">
                                        <div className="absolute -right-4 -top-4 text-emerald-100 opacity-50">
                                            <TrendingUp size={160} />
                                        </div>
                                        <h3 className="text-emerald-800 font-bold uppercase tracking-wider text-sm mb-2">Recovery Progress</h3>
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-6xl font-black text-emerald-600">{status?.recovery_score || 0}%</span>
                                            <span className="text-emerald-500 font-bold">Stable Growth</span>
                                        </div>
                                        <p className="mt-4 text-emerald-700 text-sm leading-relaxed max-w-xs">
                                            Your business is showing a <strong>{status?.growth_pct || 0}%</strong> revenue increase over the last 7 days. Crisis mitigation successful.
                                        </p>
                                    </div>

                                    <div className="space-y-4">
                                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Reputation Repair</h3>
                                        {(reputation || []).map((rep, idx) => (
                                            <div key={idx} className="bg-white border border-gray-100 rounded-xl p-4 flex items-center justify-between shadow-sm">
                                                <div className="flex items-center gap-3">
                                                    <div className="bg-amber-100 p-2 rounded-lg text-amber-600">
                                                        <Star size={18} fill="currentColor" />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-gray-800">{rep.name}</p>
                                                        <p className="text-xs text-gray-500">{rep.visit_count} visits this week</p>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => handleAction(`Review request sent to ${rep.name}`)}
                                                    className="text-emerald-600 text-xs font-bold hover:underline"
                                                >
                                                    Request Review
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-4">
                                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Menu Re-Optimization</h3>
                                        <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
                                            <div className="p-4 bg-red-50 text-red-700 font-bold text-xs flex items-center gap-2">
                                                <X size={14} /> POTENTIAL REMOVALS (LOW PERFORMANCE)
                                            </div>
                                            <div className="p-4 space-y-3">
                                                {(menuOpts?.to_remove || []).map((item) => (
                                                    <div key={item.id} className="flex justify-between items-center text-sm">
                                                        <span className="text-gray-600">{item.name}</span>
                                                        <span className="font-bold text-red-500">{item.sold} sold</span>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="p-4 bg-emerald-50 text-emerald-700 font-bold text-xs flex items-center gap-2 border-t border-emerald-100">
                                                <ArrowUpRight size={14} /> PROMOTE BEST SELLERS
                                            </div>
                                            <div className="p-4 space-y-3">
                                                {(menuOpts?.to_promote || []).map((item) => (
                                                    <div key={item.id} className="flex justify-between items-center text-sm">
                                                        <span className="text-gray-600">{item.name}</span>
                                                        <span className="font-bold text-emerald-600">{item.sold} sold</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Growth Plan Snapshot</h3>
                                        <div className="space-y-3">
                                            {(status?.growth_plan || []).slice(0, 3).map((task, idx) => (
                                                <div key={idx} className="flex gap-4 items-start bg-gray-50 p-4 rounded-xl">
                                                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shrink-0 shadow-sm font-bold text-emerald-600 border border-emerald-100">
                                                        {task.day}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-gray-800">{task.task}</p>
                                                        <p className="text-xs text-emerald-600 font-medium mt-1 uppercase">Day {task.day}</p>
                                                    </div>
                                                </div>
                                            ))}
                                            <button
                                                onClick={() => setActiveTab('growth')}
                                                className="w-full py-2 text-sm font-bold text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                            >
                                                View Full Roadmap
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'growth' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                                <h3 className="text-xl font-bold text-gray-800">30-Day Recovery Roadmap</h3>
                                <div className="space-y-4">
                                    {(status?.growth_plan || []).map((task, idx) => (
                                        <div key={idx} className="relative pl-12 pb-8 last:pb-0">
                                            {idx !== (status?.growth_plan?.length || 0) - 1 && (
                                                <div className="absolute left-5 top-10 bottom-0 w-0.5 bg-gray-100"></div>
                                            )}
                                            <div className="absolute left-0 top-0 w-10 h-10 bg-emerald-600 text-white rounded-full flex items-center justify-center shadow-lg font-bold z-10">
                                                {task.day}
                                            </div>
                                            <div className="bg-white border border-gray-100 p-6 rounded-2xl shadow-sm">
                                                <h4 className="font-bold text-lg text-gray-800 mb-1">{task.task}</h4>
                                                <p className="text-sm text-gray-500">Recovery Phase Milestone {idx + 1}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {activeTab === 'customers' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                                <h3 className="text-xl font-bold text-gray-800">Win-Back Opportunities</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {winBack.map((c) => (
                                        <div key={c.id} className="bg-white border border-gray-100 p-5 rounded-2xl shadow-sm flex flex-col justify-between">
                                            <div className="flex justify-between items-start mb-4">
                                                <div>
                                                    <h4 className="font-bold text-gray-800">{c.name}</h4>
                                                    <p className="text-xs text-gray-500">{c.phone}</p>
                                                </div>
                                                <span className="bg-red-50 text-red-600 text-[10px] font-bold px-2 py-1 rounded-full">
                                                    Inactive {c.last_visit_days} days
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <div className="text-[10px] text-gray-400 font-bold uppercase">
                                                    Total Orders: {c.total_orders}
                                                </div>
                                                <button
                                                    onClick={() => handleAction(`${c.suggested_offer} sent to ${c.name}`)}
                                                    className="bg-gray-900 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-emerald-600 transition-colors flex items-center gap-2"
                                                >
                                                    Send {c.suggested_offer} <ChevronRight size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                    {winBack.length === 0 && (
                                        <div className="col-span-2 py-12 text-center text-gray-400">
                                            <Users size={48} className="mx-auto mb-4 opacity-20" />
                                            <p>No inactive regular customers identified currently.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === 'profit' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                                <h3 className="text-xl font-bold text-gray-800">Profit Optimization Engine</h3>
                                <div className="space-y-4">
                                    {profitOpts.map((opt, idx) => (
                                        <div key={idx} className="bg-emerald-50 border border-emerald-100 p-6 rounded-2xl flex items-center justify-between">
                                            <div>
                                                <h4 className="font-bold text-emerald-900 text-lg">{opt.name}</h4>
                                                <div className="flex gap-4 mt-2">
                                                    <span className="text-xs font-bold text-emerald-700 bg-white px-3 py-1 rounded-full border border-emerald-200">
                                                        Margin: {opt.margin_estimate}
                                                    </span>
                                                    <span className="text-xs font-bold text-gray-500 px-3 py-1">
                                                        {opt.strategy}
                                                    </span>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleAction(`Promotion Applied: ${opt.name}`)}
                                                className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:scale-105 transition-all"
                                            >
                                                Apply Promotion
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {activeTab === 'staff' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                                <h3 className="text-xl font-bold text-gray-800">Staff Motivation & Incentives</h3>
                                <div className="space-y-4">
                                    {staffKpis.map((staff, idx) => (
                                        <div key={idx} className="bg-white border border-gray-100 p-6 rounded-2xl shadow-sm flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-gray-900 text-white rounded-full flex items-center justify-center font-bold">
                                                    {staff.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-gray-800">{staff.name}</h4>
                                                    <p className="text-sm text-emerald-600 font-bold">{staff.growth} Sales Growth</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs text-gray-400 font-bold uppercase mb-1">Weekly Sales</p>
                                                <p className="font-black text-gray-900 text-xl">₹{staff.this_week_sales.toLocaleString()}</p>
                                            </div>
                                            <button
                                                onClick={() => handleSetIncentive(staff)}
                                                className="bg-emerald-50 text-emerald-700 px-4 py-2 rounded-xl text-xs font-bold border border-emerald-100 hover:bg-emerald-100 transition-colors"
                                            >
                                                Set Incentive
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 bg-gray-50 border-t border-gray-100 text-center text-[10px] text-gray-400 font-bold tracking-widest uppercase">
                    Recovery Module Activated • Intelligence Engine v3.0 stable
                </div>

                {/* Incentive Modal */}
                {showIncentiveModal && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                        <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                            <div className="p-6 bg-gray-900 text-white flex justify-between items-center">
                                <h3 className="font-bold flex items-center gap-2">
                                    <Award size={20} className="text-emerald-400" />
                                    Set Incentive
                                </h3>
                                <button onClick={() => setShowIncentiveModal(false)}>
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="p-6 space-y-4">
                                <div>
                                    <p className="text-xs font-bold text-gray-400 uppercase mb-2">Staff Member</p>
                                    <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl">
                                        <div className="w-8 h-8 bg-gray-900 text-white rounded-full flex items-center justify-center text-xs font-bold">
                                            {selectedStaff?.name.charAt(0).toUpperCase()}
                                        </div>
                                        <span className="font-bold text-gray-800">{selectedStaff?.name}</span>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-400 uppercase mb-2 block">
                                        Incentive Amount (₹)
                                    </label>
                                    <input
                                        type="number"
                                        value={incentiveAmount}
                                        onChange={(e) => setIncentiveAmount(e.target.value)}
                                        placeholder="e.g. 500"
                                        className="w-full bg-gray-50 border border-gray-100 rounded-xl p-4 text-lg font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-gray-900"
                                        autoFocus
                                    />
                                </div>
                                <button
                                    onClick={submitIncentive}
                                    className="w-full bg-emerald-600 text-white py-4 rounded-xl font-bold shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-all"
                                >
                                    Confirm Incentive
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};



export default RecoveryDashboard;
