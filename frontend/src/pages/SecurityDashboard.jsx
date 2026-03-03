import React, { useState, useEffect } from 'react';
import {
    ShieldAlert,
    History,
    UserX,
    AlertTriangle,
    CheckCircle,
    Search,
    Filter,
    ArrowUpRight,
    ArrowDownRight,
    Ban,
    Zap,
    Lock,
    Eye,
    ShieldCheck
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import api from '../services/api';

const SecurityDashboard = () => {
    const [activeTab, setActiveTab] = useState('alerts');
    const [alerts, setAlerts] = useState([]);
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 30000);
        return () => clearInterval(interval);
    }, [activeTab]);

    const fetchData = async () => {
        try {
            setLoading(true);
            if (activeTab === 'alerts') {
                const res = await api.get('/fraud/alerts');
                setAlerts(res.data);
            } else {
                const res = await api.get('/fraud/audit-logs');
                setLogs(res.data);
            }
        } catch (error) {
            toast.error('Failed to load security alerts');
        } finally {
            setLoading(false);
        }
    };

    const resolveAlert = async (id) => {
        try {
            await api.post(`/fraud/alerts/${id}/resolve`, {});
            toast.success('Alert resolved and logged');
            fetchData();
        } catch (error) {
            toast.error('Failed to resolve alert');
        }
    };

    return (
        <div className="flex flex-col gap-8 animate-fade-in">
            {/* Header */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div>
                    <h1 className="text-4xl font-black text-slate-800 tracking-tighter italic flex items-center gap-3">
                        <ShieldAlert className="text-red-500 animate-pulse" size={36} />
                        Security Dashboard
                    </h1>
                    <p className="text-slate-400 font-bold text-xs uppercase tracking-[0.3em] mt-1">POS Activity Monitoring & Fraud Detection</p>
                </div>

                <div className="flex bg-slate-200/50 p-1.5 rounded-[1.4rem] backdrop-blur-sm">
                    <button
                        onClick={() => setActiveTab('alerts')}
                        className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'alerts' ? 'bg-red-500 text-white shadow-lg shadow-red-200' : 'text-slate-500 hover:text-slate-800'}`}
                    >
                        Security Alerts ({alerts.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('logs')}
                        className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'logs' ? 'bg-slate-900 text-white shadow-lg shadow-slate-200' : 'text-slate-500 hover:text-slate-800'}`}
                    >
                        Activity Logs
                    </button>
                </div>
            </header>

            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="w-12 h-12 border-4 border-slate-200 border-t-red-500 rounded-full animate-spin" />
                </div>
            ) : activeTab === 'alerts' ? (
                <div className="grid gap-6">
                    {alerts.length === 0 ? (
                        <div className="premium-card p-20 flex flex-col items-center justify-center border-2 border-emerald-50 bg-emerald-50/10">
                            <div className="bg-emerald-500 p-6 rounded-full text-white mb-6 shadow-xl shadow-emerald-100">
                                <ShieldCheck size={48} />
                            </div>
                            <h3 className="text-2xl font-black text-slate-800 uppercase italic tracking-tighter">System Sanitized</h3>
                            <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mt-1">No active fraud flags in the current cycle</p>
                        </div>
                    ) : (
                        alerts.map((alert, index) => (
                            <div
                                key={alert.id}
                                className="premium-card p-0 flex border-2 border-red-50 overflow-hidden group hover:border-red-200 transition-all animate-fade-in-up shadow-red-50/50"
                                style={{ animationDelay: `${index * 50}ms` }}
                            >
                                <div className="bg-red-500 p-8 flex flex-col items-center justify-center gap-4">
                                    <AlertTriangle className="text-white animate-bounce" size={32} />
                                    <span className="text-[10px] font-black text-white/80 uppercase vertical-rl tracking-[0.3em]">Critical</span>
                                </div>
                                <div className="flex-1 p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-4">
                                            <h3 className="text-xl font-black text-slate-900 uppercase italic tracking-tighter">{alert.username}</h3>
                                            <span className="px-3 py-1 bg-slate-900 text-white text-[9px] font-black rounded-lg uppercase tracking-widest">Node #{alert.branch_id}</span>
                                            <div className="flex items-center gap-1.5 px-3 py-1 bg-red-50 text-red-600 rounded-lg border border-red-100">
                                                <Zap size={12} fill="currentColor" />
                                                <span className="text-[9px] font-black uppercase tracking-widest">Risk: +{alert.risk_score}</span>
                                            </div>
                                        </div>
                                        <p className="text-slate-600 font-bold text-sm tracking-tight">{alert.reason}</p>
                                        <div className="flex items-center gap-3 text-slate-400 font-bold text-[10px] uppercase tracking-widest">
                                            <History size={14} />
                                            Detect Timestamp: {new Date(alert.timestamp).toLocaleString()}
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => resolveAlert(alert.id)}
                                        className="bg-white border-2 border-slate-100 text-slate-400 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-all flex items-center gap-2"
                                    >
                                        <Lock size={14} /> Mark Resolved
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            ) : (
                <div className="premium-card p-8 border-2 border-slate-50">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="p-2 bg-slate-100 text-slate-500 rounded-xl"><Eye size={20} /></div>
                        <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight italic">System Activity Logs</h2>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50">
                                    <th className="pb-5">Timestamp</th>
                                    <th className="pb-5">Staff Member</th>
                                    <th className="pb-5">Action</th>
                                    <th className="pb-5">Target</th>
                                    <th className="pb-5 text-right">Details</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 font-sans">
                                {logs.map((log, index) => {
                                    const details = JSON.parse(log.details || '{}');
                                    return (
                                        <tr key={log.id} className="group hover:bg-slate-50/50 transition-colors animate-fade-in">
                                            <td className="py-5 font-bold text-slate-400 text-[10px] uppercase">
                                                {new Date(log.timestamp).toLocaleTimeString()}
                                                <div className="text-[8px] opacity-70">{new Date(log.timestamp).toLocaleDateString()}</div>
                                            </td>
                                            <td className="py-5">
                                                <span className="font-black text-slate-800 text-xs uppercase tracking-tight">{log.username}</span>
                                            </td>
                                            <td className="py-5">
                                                <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${log.action.includes('void') ? 'bg-red-50 text-red-500' :
                                                    log.action.includes('reconcile') ? 'bg-amber-50 text-amber-600' :
                                                        'bg-slate-100 text-slate-500'
                                                    }`}>
                                                    {log.action.replace('_', ' ')}
                                                </span>
                                            </td>
                                            <td className="py-5 text-[10px] font-bold text-slate-400 uppercase">
                                                {log.target_type} <span className="text-indigo-500">#{log.target_id || 'X'}</span>
                                            </td>
                                            <td className="py-5 text-right">
                                                <div className="flex flex-wrap justify-end gap-1.5">
                                                    {Object.entries(details).map(([key, val]) => (
                                                        <div key={key} className="bg-slate-50 border border-slate-100 px-2 py-1 rounded-lg text-[8px] font-black text-slate-400 uppercase">
                                                            <span className="text-indigo-400 mr-1">{key}:</span> {val}
                                                        </div>
                                                    ))}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SecurityDashboard;
