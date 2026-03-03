import React, { useState, useEffect } from 'react';
import api from '../services/api';
import {
    ArrowLeftRight,
    Plus,
    Clock,
    CheckCircle2,
    Truck,
    AlertCircle,
    ArrowRight,
    Search,
    Store,
    Layers,
    ChevronRight,
    X,
    ArrowUpRight,
    ArrowDownLeft
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const StockTransfers = () => {
    const [transfers, setTransfers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showRequestModal, setShowRequestModal] = useState(false);
    const [branches, setBranches] = useState([]);
    const [rawMaterials, setRawMaterials] = useState([]);
    const [newRequest, setNewRequest] = useState({
        to_branch_id: '',
        raw_material_id: '',
        quantity: ''
    });

    const { user } = useAuth();

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [transRes, branchRes, rmRes] = await Promise.all([
                api.get('/transfers/'),
                api.get('/branches/'),
                api.get('/raw-materials/')
            ]);
            setTransfers(transRes.data);
            setBranches(branchRes.data);
            setRawMaterials(rmRes.data);
        } catch (error) {
            toast.error('Failed to load transfers');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateRequest = async (e) => {
        e.preventDefault();
        if (!user || !user.branch_id) {
            toast.error('Error: Branch ID required');
            return;
        }
        try {
            await api.post('/transfers/', {
                ...newRequest,
                from_branch_id: newRequest.to_branch_id,
                to_branch_id: user.branch_id
            });
            toast.success('Transfer requested');
            setShowRequestModal(false);
            setNewRequest({ to_branch_id: '', raw_material_id: '', quantity: '' });
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.detail || 'Request failed');
        }
    };

    const handleApprove = async (id) => {
        try {
            await api.patch(`/transfers/${id}/approve`);
            toast.success('Transfer authorized');
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.detail || 'Authorization failed');
        }
    };

    const handleReceive = async (id) => {
        try {
            await api.patch(`/transfers/${id}/receive`);
            toast.success('Stock received and updated');
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.detail || 'Sync failed');
        }
    };

    const handleCancel = async (id) => {
        try {
            await api.patch(`/transfers/${id}/cancel`);
            toast.success('Transfer cancelled');
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.detail || 'Cancellation failed');
        }
    };

    const getStatusStyles = (status) => {
        switch (status) {
            case 'pending': return 'bg-amber-50 text-amber-600 border-amber-100';
            case 'approved': return 'bg-indigo-50 text-indigo-600 border-indigo-100';
            case 'completed': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
            case 'cancelled': return 'bg-red-50 text-red-600 border-red-100';
            default: return 'bg-slate-50 text-slate-500 border-slate-100';
        }
    };

    return (
        <div className="flex flex-col gap-8 animate-fade-in">
            {/* Header */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div>
                    <h1 className="text-4xl font-black text-slate-800 tracking-tighter italic flex items-center gap-3">
                        <ArrowLeftRight className="text-brand-primary" size={36} />
                        Stock Transfers
                    </h1>
                    <p className="text-slate-400 font-bold text-xs uppercase tracking-[0.3em] mt-1">Inter-Branch Material Transfers</p>
                </div>
                <button
                    onClick={() => setShowRequestModal(true)}
                    className="btn-primary flex items-center gap-3 px-6 py-4 text-[10px] font-black uppercase tracking-widest shadow-xl shadow-brand-primary/20"
                >
                    <Plus size={18} strokeWidth={3} />
                    New Transfer
                </button>
            </header>

            {/* Transfer History */}
            <div className="premium-card p-8 border-2 border-slate-50 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] italic border-b border-slate-50">
                                <th className="px-6 py-5 pb-6">Transfer ID</th>
                                <th className="px-6 py-5 pb-6">From / To</th>
                                <th className="px-6 py-5 pb-6">Material</th>
                                <th className="px-6 py-5 pb-6">Quantity</th>
                                <th className="px-6 py-5 pb-6">Status</th>
                                <th className="px-6 py-5 pb-6 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="py-20 text-center">
                                        <div className="w-10 h-10 border-4 border-slate-100 border-t-brand-primary rounded-full animate-spin mx-auto" />
                                    </td>
                                </tr>
                            ) : transfers.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="py-20 text-center opacity-30">
                                        <ArrowLeftRight size={48} className="mx-auto mb-4" strokeWidth={1} />
                                        <p className="font-black text-[10px] uppercase tracking-widest">No active transfers</p>
                                    </td>
                                </tr>
                            ) : transfers.map((t, idx) => (
                                <tr key={t.id} className="group hover:bg-slate-50/50 transition-all animate-fade-in" style={{ animationDelay: `${idx * 50}ms` }}>
                                    <td className="px-6 py-6 font-black text-indigo-500 text-sm tracking-widest">#TR_{t.id}</td>
                                    <td className="px-6 py-6">
                                        <div className="flex items-center gap-3">
                                            <span className="text-[10px] font-black text-slate-800 uppercase tracking-tighter truncate max-w-[80px]">{t.from_branch_name}</span>
                                            <ArrowRight size={14} className="text-brand-primary animate-pulse" />
                                            <span className="text-[10px] font-black text-slate-800 uppercase tracking-tighter truncate max-w-[80px]">{t.to_branch_name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-6 font-bold text-slate-700 text-xs italic">{t.raw_material_name}</td>
                                    <td className="px-6 py-6 font-black text-slate-900 text-sm tracking-tighter">{t.quantity} <span className="text-[10px] text-slate-400 font-bold uppercase">{t.unit}</span></td>
                                    <td className="px-6 py-6">
                                        <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border flex items-center gap-1.5 w-fit ${getStatusStyles(t.status)}`}>
                                            <div className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                                            {t.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-6 text-right">
                                        <div className="flex justify-end gap-2">
                                            {t.status === 'pending' && t.from_branch_id === user.branch_id && (
                                                <button onClick={() => handleApprove(t.id)} className="bg-brand-primary text-white px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg shadow-brand-primary/20 hover:scale-105 transition-transform">Approve</button>
                                            )}
                                            {t.status === 'approved' && t.to_branch_id === user.branch_id && (
                                                <button onClick={() => handleReceive(t.id)} className="bg-emerald-500 text-white px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg shadow-emerald-200 hover:scale-105 transition-transform">Receive Stock</button>
                                            )}
                                            {['pending', 'approved'].includes(t.status) && [t.from_branch_id, t.to_branch_id].includes(user.branch_id) && (
                                                <button onClick={() => handleCancel(t.id)} className="p-2 border border-slate-100 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"><X size={16} /></button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Request Console Modal */}
            {showRequestModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
                    <div className="bg-white rounded-[2.5rem] max-w-md w-full p-1 shadow-2xl animate-scale-in">
                        <div className="bg-slate-50 p-10 rounded-[2.4rem]">
                            <div className="flex justify-between items-center mb-10">
                                <div className="flex items-center gap-3">
                                    <div className="p-3 bg-brand-primary text-white rounded-2xl shadow-lg shadow-brand-primary/20"><ArrowLeftRight size={24} /></div>
                                    <div>
                                        <h2 className="text-xl font-black text-slate-800 uppercase italic tracking-tighter">Transfer Details</h2>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Initialize Stock Transfer</p>
                                    </div>
                                </div>
                                <button onClick={() => setShowRequestModal(false)} className="p-2 hover:bg-slate-200 rounded-xl transition-colors"><X size={20} /></button>
                            </div>

                            <form onSubmit={handleCreateRequest} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Source Branch</label>
                                    <div className="relative">
                                        <ArrowUpRight size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                                        <select
                                            required
                                            className="w-full pl-12 pr-5 py-3.5 bg-white border border-slate-200 rounded-2xl font-bold text-slate-700 text-xs appearance-none outline-none focus:ring-4 focus:ring-brand-primary/5 focus:border-brand-primary transition-all"
                                            value={newRequest.to_branch_id}
                                            onChange={(e) => setNewRequest({ ...newRequest, to_branch_id: e.target.value })}
                                        >
                                            <option value="">Select Target Branch...</option>
                                            {branches.filter(b => b.id !== user.branch_id).map(b => (
                                                <option key={b.id} value={b.id}>{b.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Material Selection</label>
                                    <div className="relative">
                                        <Layers size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                                        <select
                                            required
                                            className="w-full pl-12 pr-5 py-3.5 bg-white border border-slate-200 rounded-2xl font-bold text-slate-700 text-xs appearance-none outline-none focus:ring-4 focus:ring-brand-primary/5 focus:border-brand-primary transition-all"
                                            value={newRequest.raw_material_id}
                                            onChange={(e) => setNewRequest({ ...newRequest, raw_material_id: e.target.value })}
                                        >
                                            <option value="">Select Resource...</option>
                                            {rawMaterials.map(rm => (
                                                <option key={rm.id} value={rm.id}>{rm.name} ({rm.unit})</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Transfer Quantity</label>
                                    <div className="relative">
                                        <Plus size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                                        <input
                                            type="number"
                                            step="0.1"
                                            required
                                            className="w-full pl-12 pr-5 py-3.5 bg-white border border-slate-200 rounded-2xl font-bold text-slate-700 text-xs outline-none focus:ring-4 focus:ring-brand-primary/5 focus:border-brand-primary transition-all"
                                            value={newRequest.quantity}
                                            onChange={(e) => setNewRequest({ ...newRequest, quantity: e.target.value })}
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    className="w-full btn-primary py-4 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl shadow-brand-primary/20"
                                >
                                    Submit Transfer <ChevronRight size={14} strokeWidth={3} />
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StockTransfers;
