import React, { useState, useEffect } from 'react';
import api from '../services/api';
import {
    AlertTriangle,
    TrendingDown,
    ShieldAlert,
    ChevronRight,
    Zap,
    X,
    TrendingUp,
    RefreshCw
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const CrisisDashboard = ({ onClose }) => {
    const [statusData, setStatusData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [executingAction, setExecutingAction] = useState(null);

    useEffect(() => {
        fetchStatus();
    }, []);

    const fetchStatus = async () => {
        setLoading(true);
        try {
            const res = await api.get('/assistant/crisis-status');
            setStatusData(res.data);
        } catch (error) {
            console.error('Failed to fetch crisis status:', error);
            toast.error('Could not load Crisis Monitor');
        } finally {
            setLoading(false);
        }
    };

    const runAction = async (actionId) => {
        setExecutingAction(actionId);
        try {
            const res = await api.post(`/assistant/crisis-actions?action_id=${actionId}`);
            toast.success(res.data.message);
        } catch (error) {
            toast.error('Failed to initiate action');
        } finally {
            setExecutingAction(null);
        }
    };

    if (loading) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                <div className="bg-white p-8 rounded-2xl shadow-xl flex flex-col items-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mb-4"></div>
                    <p className="text-gray-600 font-medium">Analyzing Business Health...</p>
                </div>
            </div>
        );
    }

    const { status, alerts, recommendations, daily_trends, decline_pct } = statusData || {};

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
            <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl overflow-hidden border border-red-100 flex flex-col">
                {/* Header */}
                <div className={`p-6 flex justify-between items-center ${status === 'CRISIS' ? 'bg-red-600' : 'bg-green-600'} text-white`}>
                    <div className="flex items-center gap-3">
                        {status === 'CRISIS' ? <ShieldAlert size={32} /> : <Zap size={32} />}
                        <div>
                            <h2 className="text-2xl font-bold uppercase tracking-tight">AI Crisis Advisor</h2>
                            <p className="text-sm opacity-90">{status === 'CRISIS' ? 'Emergency Status Detected' : 'Business Health: Stable'}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <div className="flex-1 overflow-auto p-8">
                    {!statusData && !loading ? (
                        <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-4">
                            <AlertTriangle size={48} />
                            <p className="font-bold">Failed to load crisis health data.</p>
                            <button onClick={fetchStatus} className="btn-primary">Retry</button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* Left Column: Metrics & Alerts */}
                            <div className="space-y-6">
                                <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                                    <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Revenue Trend (Last 7 Days)</h3>
                                    <div className="flex items-end gap-1 h-32">
                                        {(daily_trends || []).map((val, idx) => {
                                            const max = Math.max(...(daily_trends || []), 1);
                                            const height = (val / max) * 100;
                                            return (
                                                <div key={idx} className="flex-1 flex flex-col items-center gap-2 group">
                                                    <div
                                                        className={`w-full rounded-t-sm transition-all duration-500 ${idx >= 4 ? 'bg-red-400 group-hover:bg-red-500' : 'bg-blue-400 group-hover:bg-blue-500'}`}
                                                        style={{ height: `${height}%` }}
                                                    ></div>
                                                    <span className="text-[8px] text-gray-400 font-bold">D{idx + 1}</span>
                                                </div>
                                            )
                                        })}
                                        {(!daily_trends || daily_trends.length === 0) && (
                                            <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-slate-300 uppercase tracking-widest">
                                                Insufficient Data Stream
                                            </div>
                                        )}
                                    </div>
                                    <div className="mt-4 flex justify-between items-center">
                                        <div className={`flex items-center gap-2 font-bold ${decline_pct > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                                            {decline_pct > 0 ? <TrendingDown size={20} /> : <TrendingUp size={20} />}
                                            <span>{Math.abs(decline_pct || 0)}% {decline_pct > 0 ? 'Decline' : 'Growth'}</span>
                                        </div>
                                        <button onClick={fetchStatus} className="text-gray-400 hover:text-blue-600 transition-colors">
                                            <RefreshCw size={16} />
                                        </button>
                                    </div>
                                </div>

                                {alerts?.length > 0 && (
                                    <div className="space-y-3">
                                        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Critical Alerts</h3>
                                        {alerts.map((alert, idx) => (
                                            <div key={idx} className="flex gap-3 bg-red-50 p-4 rounded-xl border border-red-100 text-red-800">
                                                <AlertTriangle className="shrink-0" size={20} />
                                                <p className="text-sm font-medium">{alert}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Right Column: Recovery Recommendations */}
                            <div className="space-y-6">
                                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">AI Recovery Recommendations</h3>
                                <div className="space-y-4">
                                    {(recommendations || []).map((rec) => (
                                        <div key={rec.id} className="bg-white border border-gray-200 rounded-2xl p-5 hover:border-red-200 transition-all shadow-sm hover:shadow-md group">
                                            <div className="flex justify-between items-start mb-2">
                                                <h4 className="font-bold text-gray-800 flex items-center gap-2">
                                                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                                                    {rec.title}
                                                </h4>
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${rec.impact === 'High' ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'}`}>
                                                    {rec.impact} Impact
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-600 mb-4">{rec.description}</p>
                                            <button
                                                onClick={() => runAction(rec.id)}
                                                disabled={executingAction !== null}
                                                className="w-full flex items-center justify-center gap-2 py-2 bg-gray-900 text-white rounded-xl text-sm font-bold hover:bg-red-600 transition-colors group-hover:scale-[1.02] active:scale-95 disabled:opacity-50"
                                            >
                                                {executingAction === rec.id ? (
                                                    <RefreshCw className="animate-spin" size={16} />
                                                ) : (
                                                    <>Apply Recommendation <ChevronRight size={16} /></>
                                                )}
                                            </button>
                                        </div>
                                    ))}
                                    {(!recommendations || recommendations.length === 0) && (
                                        <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-300">
                                            <Zap className="mx-auto text-gray-300 mb-2" size={32} />
                                            <p className="text-gray-500 text-sm">No emergency actions required.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 bg-gray-50 border-t border-gray-100 text-center">
                    <p className="text-xs text-gray-400 font-medium italic">
                        Recovery recommendations are powered by Business Intelligence Engine v2.0
                    </p>
                </div>
            </div>
        </div>
    );
};

export default CrisisDashboard;
