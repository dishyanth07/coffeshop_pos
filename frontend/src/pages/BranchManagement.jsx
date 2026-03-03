import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Plus, Store, MapPin, User, Settings, AlertCircle, CheckCircle2, Trash2, Map, Globe, ShieldCheck, ChevronRight, Copy } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const BranchManagement = () => {
    const [branches, setBranches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [newBranch, setNewBranch] = useState({ name: '', location: '', radius: 5.0 });
    const [credentials, setCredentials] = useState(null);
    const { user } = useAuth();

    useEffect(() => {
        fetchBranches();
    }, []);

    const fetchBranches = async () => {
        try {
            const response = await api.get('/branches/');
            setBranches(response.data);
        } catch (error) {
            toast.error('Failed to fetch branch network');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateBranch = async (e) => {
        e.preventDefault();
        try {
            const response = await api.post('/branches/', {
                ...newBranch,
                owner_id: user.id
            });
            toast.success('New branch initialized');
            setCredentials({
                username: response.data.manager_username,
                password: response.data.manager_password,
                branchName: response.data.name
            });
            setShowAddModal(false);
            setNewBranch({ name: '', location: '', radius: 5.0 });
            fetchBranches();
        } catch (error) {
            toast.error(error.response?.data?.detail || 'Handshake failed');
        }
    };

    const handleToggleStatus = async (branchId, currentStatus) => {
        try {
            await api.put(`/branches/${branchId}`, {
                is_active: !currentStatus
            });
            toast.success(`Branch ${!currentStatus ? 'activated' : 'deactivated'}`);
            fetchBranches();
        } catch (error) {
            toast.error('Failed to update branch status');
        }
    };
    const handleUpdateRadius = async (branchId, currentRadius) => {
        const newRadius = prompt("Enter new allowed radius (KM):", currentRadius || "5.0");
        if (newRadius === null || newRadius === "") return;

        try {
            await api.put(`/branches/${branchId}`, {
                radius: parseFloat(newRadius)
            });
            toast.success(`Radius updated to ${newRadius} KM`);
            fetchBranches();
        } catch (error) {
            toast.error('Failed to update radius');
        }
    };

    const handleSetGeoLocation = async (branchId) => {
        if (!navigator.geolocation) {
            toast.error('Geolocation is not supported by your browser');
            return;
        }

        const radius = prompt("Enter allowed radius (KM) for this branch:", "5.0");
        if (radius === null) return;

        toast.loading('Capturing current location...');

        navigator.geolocation.getCurrentPosition(async (position) => {
            const { latitude, longitude } = position.coords;
            try {
                await api.put(`/branches/${branchId}`, {
                    latitude,
                    longitude,
                    radius: parseFloat(radius)
                });
                toast.dismiss();
                toast.success(`Branch Geo-Locked: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
                fetchBranches();
            } catch (error) {
                toast.dismiss();
                toast.error('Failed to update branch geo-lock');
            }
        }, (err) => {
            toast.dismiss();
            toast.error(`Location Capture Failed: ${err.message}`);
        });
    };

    const handleDeleteBranch = async (branchId) => {
        if (!window.confirm('WARNING: PERMANENT DELETE of branch requested. Associated records may block this action. Proceed with caution.')) {
            return;
        }

        try {
            await api.delete(`/branches/${branchId}?hard=true`);
            toast.success('Branch deleted from system');
            fetchBranches();
        } catch (error) {
            toast.error(error.response?.data?.detail || 'Branch deletion blocked (active associations)');
        }
    };

    return (
        <div className="flex flex-col gap-8 animate-fade-in">
            {/* Header */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                    <h1 className="text-4xl font-black text-slate-800 tracking-tighter italic">Branch Management</h1>
                    <p className="text-slate-400 font-bold text-xs uppercase tracking-[0.3em] mt-1">Global Branch Control & Oversight</p>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="btn-primary flex items-center gap-3 px-6 py-4 text-[10px] font-black uppercase tracking-widest shadow-xl shadow-brand-primary/20"
                >
                    <Plus size={18} strokeWidth={3} />
                    Add New Branch
                </button>
            </header>

            {/* Nodes Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {loading ? (
                    <div className="col-span-full flex justify-center py-20">
                        <div className="w-12 h-12 border-4 border-brand-primary/10 border-t-brand-primary rounded-full animate-spin" />
                    </div>
                ) : branches.length === 0 ? (
                    <div className="col-span-full py-40 bg-white rounded-[2.5rem] border-2 border-dashed border-slate-100 flex flex-col items-center justify-center opacity-40">
                        <Store size={64} strokeWidth={1} className="mb-6 text-slate-300" />
                        <h3 className="font-black uppercase tracking-[0.3em] text-xs text-slate-400">No Branch Active</h3>
                    </div>
                ) : (
                    branches.map((branch, index) => (
                        <div
                            key={branch.id}
                            className="premium-card p-0 flex flex-col border-2 border-slate-50 relative group hover:border-brand-primary/20 animate-fade-in-up overflow-hidden"
                            style={{ animationDelay: `${index * 50}ms` }}
                        >
                            <div className="p-8">
                                <div className="flex justify-between items-start mb-6">
                                    <div className={`p-4 rounded-2xl ${branch.is_active ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/20' : 'bg-slate-100 text-slate-400 opacity-50'}`}>
                                        <Store size={24} strokeWidth={2} />
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${branch.is_active ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-red-50 text-red-500 border-red-100'}`}>
                                        {branch.is_active ? 'Active' : 'Offline'}
                                    </span>
                                </div>

                                <h3 className="text-xl font-black text-slate-800 mb-2 uppercase italic tracking-tighter group-hover:text-brand-primary transition-colors">{branch.name}</h3>

                                <div className="space-y-4 pt-4">
                                    <div className="flex items-center gap-3 text-slate-500">
                                        <MapPin size={16} className="text-slate-300" />
                                        <span className="text-xs font-bold uppercase tracking-tight line-clamp-1">{branch.location || 'Location Unknown'}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-slate-500">
                                        <Globe size={16} className="text-slate-300" />
                                        <div className="flex items-center gap-2 group/radius">
                                            <span className="text-xs font-bold uppercase tracking-tight">Radius: {branch.radius} KM</span>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleUpdateRadius(branch.id, branch.radius); }}
                                                className="opacity-0 group-hover/radius:opacity-100 p-1 hover:text-brand-primary transition-all"
                                            >
                                                <Settings size={12} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-auto px-8 py-6 bg-slate-50/50 border-t border-slate-50 flex justify-between items-center group-hover:bg-brand-primary/5 transition-colors">
                                <button
                                    onClick={() => handleToggleStatus(branch.id, branch.is_active)}
                                    className={`text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all ${branch.is_active ? 'text-red-400 hover:text-red-600' : 'text-emerald-500 hover:text-emerald-700'}`}
                                >
                                    <Globe size={14} />
                                    {branch.is_active ? 'Deactivate' : 'Activate'}
                                </button>

                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleDeleteBranch(branch.id)}
                                        className="p-2.5 bg-white border border-slate-100 text-slate-300 hover:text-red-500 hover:border-red-100 rounded-xl transition-all"
                                        title="Delete Branch"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                    <button
                                        onClick={() => handleSetGeoLocation(branch.id)}
                                        className={`p-2.5 bg-white border border-slate-100 rounded-xl transition-all ${branch.latitude ? 'text-emerald-500 border-emerald-100' : 'text-slate-300 hover:text-brand-primary hover:border-brand-primary/20'}`}
                                        title="Set Location Lock"
                                    >
                                        <MapPin size={16} />
                                    </button>
                                    <button className="p-2.5 bg-white border border-slate-100 text-slate-300 hover:text-brand-primary hover:border-brand-primary/20 rounded-xl transition-all">
                                        <Settings size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Deploy Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
                    <div className="bg-white rounded-[2.5rem] max-w-md w-full p-1 shadow-2xl animate-scale-in">
                        <div className="bg-slate-50 p-10 rounded-[2.4rem]">
                            <div className="flex items-center gap-3 mb-10">
                                <div className="p-3 bg-brand-primary text-white rounded-2xl shadow-lg shadow-brand-primary/20"><Store size={24} /></div>
                                <div>
                                    <h2 className="text-xl font-black text-slate-800 uppercase italic tracking-tighter">Setup Branch</h2>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">New Location Setup</p>
                                </div>
                            </div>

                            <form onSubmit={handleCreateBranch} className="space-y-6">
                                <div className="space-y-2 group">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 group-focus-within:text-brand-primary">Branch Name</label>
                                    <div className="relative">
                                        <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                                        <input
                                            type="text"
                                            required
                                            className="w-full pl-12 pr-5 py-3.5 bg-white border border-slate-200 rounded-2xl font-bold text-slate-700 outline-none focus:ring-4 focus:ring-brand-primary/5 focus:border-brand-primary transition-all"
                                            value={newBranch.name}
                                            onChange={(e) => setNewBranch({ ...newBranch, name: e.target.value })}
                                            placeholder="Downtown Hive"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2 group">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 group-focus-within:text-brand-primary">Address / Location</label>
                                    <div className="relative">
                                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                                        <input
                                            type="text"
                                            className="w-full pl-12 pr-5 py-3.5 bg-white border border-slate-200 rounded-2xl font-bold text-slate-700 outline-none focus:ring-4 focus:ring-brand-primary/5 focus:border-brand-primary transition-all"
                                            value={newBranch.location}
                                            onChange={(e) => setNewBranch({ ...newBranch, location: e.target.value })}
                                            placeholder="Sector 7, Block B"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2 group">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 group-focus-within:text-brand-primary">Allowed Radius (KM)</label>
                                    <div className="relative">
                                        <Settings className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                                        <input
                                            type="number"
                                            step="0.1"
                                            required
                                            className="w-full pl-12 pr-5 py-3.5 bg-white border border-slate-200 rounded-2xl font-bold text-slate-700 outline-none focus:ring-4 focus:ring-brand-primary/5 focus:border-brand-primary transition-all"
                                            value={newBranch.radius}
                                            onChange={(e) => setNewBranch({ ...newBranch, radius: e.target.value })}
                                            placeholder="5.0"
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-4 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowAddModal(false)}
                                        className="flex-1 py-4 bg-white border border-slate-200 rounded-2xl font-black text-[10px] text-slate-400 uppercase tracking-widest hover:bg-slate-50 transition-all"
                                    >
                                        Abort
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 btn-primary py-4 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2"
                                    >
                                        Setup <ChevronRight size={14} strokeWidth={3} />
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Credentials Reveal */}
            {credentials && (
                <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-xl flex items-center justify-center p-4 z-[60] animate-fade-in">
                    <div className="bg-white rounded-[3rem] max-w-md w-full p-12 shadow-2xl relative overflow-hidden animate-scale-in">
                        <div className="absolute top-0 right-0 p-8 opacity-5">
                            <ShieldCheck size={160} />
                        </div>

                        <div className="flex justify-center mb-8">
                            <div className="bg-emerald-500/10 p-6 rounded-full text-emerald-500 animate-pulse">
                                <CheckCircle2 size={64} />
                            </div>
                        </div>

                        <h2 className="text-3xl font-black text-center text-slate-800 mb-2 italic tracking-tighter uppercase">Branch Access Ready</h2>
                        <p className="text-center text-slate-400 text-xs font-bold uppercase tracking-widest mb-10">Credentials generated for <span className="text-brand-primary">{credentials.branchName}</span></p>

                        <div className="bg-slate-50 rounded-3xl p-8 border border-slate-100 space-y-6 mb-8 relative">
                            <div className="group">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Username</label>
                                <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-100 group-hover:border-brand-primary/20 transition-all">
                                    <code className="text-lg font-black text-slate-800 tracking-widest">{credentials.username}</code>
                                    <button onClick={() => { navigator.clipboard.writeText(credentials.username); toast.success('Copied'); }} className="text-brand-primary hover:scale-110 transition-transform"><Copy size={18} /></button>
                                </div>
                            </div>
                            <div className="group">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Temporary Password</label>
                                <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-100 group-hover:border-brand-primary/20 transition-all">
                                    <code className="text-lg font-black text-slate-800 tracking-widest">{credentials.password}</code>
                                    <button onClick={() => { navigator.clipboard.writeText(credentials.password); toast.success('Copied'); }} className="text-brand-primary hover:scale-110 transition-transform"><Copy size={18} /></button>
                                </div>
                            </div>
                        </div>

                        <div className="bg-amber-500/10 border-2 border-amber-500/20 p-6 rounded-2xl flex gap-4 items-start mb-10">
                            <AlertCircle className="text-amber-600 shrink-0" size={20} />
                            <p className="text-[10px] text-amber-900 font-bold leading-relaxed uppercase tracking-tight">
                                Important: Transfer these credentials to the branch manager immediately. The password will be hidden upon closing this window.
                            </p>
                        </div>

                        <button
                            onClick={() => setCredentials(null)}
                            className="w-full btn-primary py-5 rounded-2xl font-black text-sm uppercase tracking-[0.2em] shadow-2xl shadow-brand-primary/30"
                        >
                            Confirm & Close Link
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BranchManagement;
