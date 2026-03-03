import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import {
    Calendar, IndianRupee, ShoppingBag, TrendingUp, Store,
    ArrowLeft, ChevronRight, Filter, Download, History
} from 'lucide-react';

const Reports = () => {
    const [salesData, setSalesData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [filterPeriod, setFilterPeriod] = useState('all');
    const navigate = useNavigate();
    const { user } = useAuth();

    useEffect(() => {
        if (!['owner', 'admin', 'branch_manager'].includes(user?.role)) {
            toast.error('Access Denied: Management Only');
            navigate('/pos');
            return;
        }
        fetchSalesHistory();
    }, []);

    const fetchSalesHistory = async (start = null, end = null) => {
        setLoading(true);
        try {
            const params = {};
            if (start) params.start_date = start;
            if (end) params.end_date = end;

            const response = await api.get('/sales/history', { params });
            setSalesData(response.data);
        } catch {
            toast.error('Failed to fetch sales history');
        } finally {
            setLoading(false);
        }
    };

    const handlePeriodFilter = (period) => {
        setFilterPeriod(period);
        const today = new Date();
        let start = new Date();

        switch (period) {
            case 'today': start = today; break;
            case 'week': start.setDate(today.getDate() - 7); break;
            case 'month': start.setMonth(today.getMonth() - 1); break;
            case 'all': fetchSalesHistory(); return;
        }

        const startStr = start.toISOString().split('T')[0];
        const endStr = today.toISOString().split('T')[0];
        setStartDate(startStr);
        setEndDate(endStr);
        fetchSalesHistory(startStr, endStr);
    };

    const handleCustomFilter = () => {
        if (!startDate && !endDate) {
            toast.error('Protocol Error: Start or End date required');
            return;
        }
        fetchSalesHistory(startDate, endDate);
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString('en-US', {
            year: 'numeric', month: 'short', day: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="w-12 h-12 border-4 border-brand-primary/10 border-t-brand-primary rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-8 animate-fade-in">
            {/* Header */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-3 md:gap-4">
                <div>
                    <h1 className="text-3xl md:text-4xl font-black text-slate-800 tracking-tighter italic leading-none md:leading-normal">SALES_INTELLIGENCE</h1>
                    <p className="text-slate-400 font-bold text-[10px] md:text-xs uppercase tracking-[0.3em] mt-1">Analytical Yield & Transaction manifest</p>
                </div>
                {user?.branch_id && (
                    <div className="px-3 md:px-4 py-1.5 md:py-2 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center gap-2 md:gap-3">
                        <Store size={14} className="text-indigo-400" />
                        <span className="text-[9px] md:text-[10px] font-black text-indigo-700 uppercase tracking-widest">Node ID: #{user.branch_id}</span>
                    </div>
                )}
            </header>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                <KPICard title="Gross Yield" value={`₹${salesData?.total_sales?.toFixed(0) || '0'}`} icon={<IndianRupee size={20} />} color="emerald" />
                <KPICard title="Order Volume" value={salesData?.total_orders || 0} icon={<ShoppingBag size={20} />} color="indigo" />
                <KPICard title="Mean Transaction" value={`₹${salesData?.total_orders > 0 ? (salesData.total_sales / salesData.total_orders).toFixed(0) : '0'}`} icon={<TrendingUp size={20} />} color="amber" />
            </div>

            {/* Filter Terminal */}
            <div className="premium-card p-0.5 md:p-1">
                <div className="bg-slate-50/50 p-5 md:p-8 rounded-[1rem] md:rounded-[1.4rem]">
                    <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-6">
                        <Filter size={16} className="text-slate-400" />
                        <h2 className="text-[9px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest italic">Period Filter Logic</h2>
                    </div>

                    <div className="flex flex-wrap gap-2 md:gap-3 mb-6 md:mb-8">
                        {['all', 'today', 'week', 'month'].map((period) => (
                            <button
                                key={period}
                                onClick={() => handlePeriodFilter(period)}
                                className={`flex-1 md:flex-none px-3 md:px-6 py-2 md:py-2.5 rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all ${filterPeriod === period
                                    ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/20 scale-105'
                                    : 'bg-white text-slate-400 hover:text-slate-600 border border-slate-100'
                                    }`}
                            >
                                {period}
                            </button>
                        ))}
                    </div>

                    <div className="flex flex-wrap gap-4 items-end">
                        <DateInput label="Start Vector" value={startDate} onChange={setStartDate} />
                        <DateInput label="End Vector" value={endDate} onChange={setEndDate} />
                        <button
                            onClick={handleCustomFilter}
                            className="bg-slate-900 text-white px-8 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all active:scale-95 shadow-lg"
                        >
                            Execute_Filter
                        </button>
                    </div>
                </div>
            </div>

            {/* Logs Table */}
            <div className="premium-card p-8 border-2 border-slate-50">
                <div className="flex justify-between items-center mb-8">
                    <div className="flex items-center gap-3">
                        <History size={20} className="text-slate-400" />
                        <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight italic">Transaction Logs</h2>
                    </div>
                    <button className="p-2 bg-slate-50 text-slate-400 hover:text-brand-primary hover:bg-brand-primary/5 rounded-xl transition-all" title="Export Manifest">
                        <Download size={20} />
                    </button>
                </div>

                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50">
                                <th className="pb-5">Bill_ID</th>
                                <th className="pb-5">Terminal_Timestamp</th>
                                <th className="pb-5">Assigned_Operator</th>
                                <th className="pb-5 text-right">Settled_Amount</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {salesData?.sales?.length > 0 ? (
                                salesData.sales.map((sale, idx) => (
                                    <tr key={sale.id} className="group hover:bg-slate-50/50 transition-colors">
                                        <td className="py-5 font-black text-indigo-500 text-sm tracking-widest">#BILL_{sale.id}</td>
                                        <td className="py-5 font-bold text-slate-500 text-xs">{formatDate(sale.created_at)}</td>
                                        <td className="py-5 font-black text-slate-700 text-xs uppercase">{sale.cashier}</td>
                                        <td className="py-5 text-right font-black text-emerald-600 text-sm tracking-tighter">₹{sale.total_amount.toFixed(2)}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="4" className="py-20 text-center">
                                        <div className="flex flex-col items-center opacity-30 grayscale">
                                            <Calendar size={48} strokeWidth={1} className="mb-4" />
                                            <p className="font-black text-[10px] uppercase tracking-widest">No Intelligence for current Period</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Mobile Logs List */}
                <div className="md:hidden space-y-3">
                    {salesData?.sales?.length > 0 ? (
                        salesData.sales.map((sale) => (
                            <div key={sale.id} className="p-4 bg-slate-50/50 rounded-2xl border border-slate-50 flex justify-between items-center group animate-fade-in-up">
                                <div className="flex flex-col">
                                    <span className="font-black text-indigo-500 text-[10px] tracking-widest uppercase mb-0.5">#BILL_{sale.id}</span>
                                    <span className="text-[10px] font-bold text-slate-400 italic mb-1">{formatDate(sale.created_at)}</span>
                                    <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">{sale.cashier}</span>
                                </div>
                                <div className="text-right">
                                    <p className="text-base font-black text-emerald-600 tracking-tighter italic">₹{sale.total_amount.toFixed(0)}</p>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="py-10 text-center opacity-30 grayscale">
                            <Calendar size={32} strokeWidth={1} className="mx-auto mb-2" />
                            <p className="font-black text-[9px] uppercase tracking-widest">No transaction logic found</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const KPICard = ({ title, value, icon, color }) => {
    const colors = {
        emerald: 'bg-emerald-500 shadow-emerald-200',
        indigo: 'bg-indigo-600 shadow-indigo-200',
        amber: 'bg-brand-accent shadow-brand-accent/30',
    };

    return (
        <div className="premium-card p-4 md:p-8 border-2 border-slate-50 group hover:scale-[1.02] transition-all">
            <div className="flex justify-between items-center mb-4 md:mb-6">
                <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{title}</p>
                <div className={`p-2 md:p-3 rounded-xl text-white ${colors[color]} group-hover:rotate-12 transition-transform`}>{icon}</div>
            </div>
            <p className="text-2xl md:text-3xl font-black text-slate-800 tracking-tighter leading-none">{value}</p>
        </div>
    );
};

const DateInput = ({ label, value, onChange }) => (
    <div className="flex-1 min-w-[200px] space-y-2">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>
        <input
            type="date"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full px-5 py-3 bg-white border border-slate-200 rounded-xl font-bold text-slate-700 text-xs focus:ring-4 focus:ring-brand-primary/5 focus:border-brand-primary outline-none transition-all shadow-sm"
        />
    </div>
);

export default Reports;
