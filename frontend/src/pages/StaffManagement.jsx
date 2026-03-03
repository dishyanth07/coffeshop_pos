import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Plus, Users, UserPlus, Shield, Trash2, Key, Loader2, ChevronRight, UserCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const StaffManagement = () => {
    const [staff, setStaff] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [formData, setFormData] = useState({ username: '', password: '', role: 'cashier' });
    const { user } = useAuth();

    useEffect(() => {
        fetchStaff();
    }, []);

    const fetchStaff = async () => {
        try {
            const response = await api.get('/users/staff');
            setStaff(response.data);
        } catch (error) {
            toast.error('Failed to fetch staff data');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateStaff = async (e) => {
        e.preventDefault();
        setIsCreating(true);
        try {
            await api.post('/users/staff', {
                ...formData,
                branch_id: user.branch_id
            });
            toast.success('Staff account created');
            setShowAddModal(false);
            setFormData({ username: '', password: '', role: 'cashier' });
            fetchStaff();
        } catch (error) {
            toast.error(error.response?.data?.detail || 'Handshake failed');
        } finally {
            setIsCreating(false);
        }
    };

    const handleDeleteStaff = async (staffId) => {
        if (!window.confirm('Are you sure you want to delete this staff member?')) {
            return;
        }

        try {
            await api.delete(`/users/staff/${staffId}`);
            toast.success('Staff member deleted');
            fetchStaff();
        } catch (error) {
            toast.error(error.response?.data?.detail || 'Delete failed');
        }
    };

    return (
        <div className="flex flex-col gap-8 animate-fade-in">
            {/* Header */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                    <h1 className="text-4xl font-black text-slate-800 tracking-tighter italic">Staff Management</h1>
                    <p className="text-slate-400 font-bold text-xs uppercase tracking-[0.3em] mt-1">Staff Access & Permissions</p>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="btn-primary flex items-center gap-2 px-6 py-4 text-[10px] font-black uppercase tracking-widest shadow-xl shadow-brand-primary/20"
                >
                    <UserPlus size={18} strokeWidth={3} />
                    Add New Staff
                </button>
            </header>

            {/* Content Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {loading ? (
                    <div className="col-span-full flex justify-center py-20">
                        <div className="w-12 h-12 border-4 border-brand-primary/10 border-t-brand-primary rounded-full animate-spin" />
                    </div>
                ) : staff.length === 0 ? (
                    <div className="col-span-full py-40 bg-white rounded-[2.5rem] border-2 border-dashed border-slate-100 flex flex-col items-center justify-center opacity-40">
                        <Users size={64} strokeWidth={1} className="mb-6 text-slate-300" />
                        <h3 className="font-black uppercase tracking-[0.3em] text-xs text-slate-400">No active staff found</h3>
                    </div>
                ) : (
                    staff.map((member, index) => (
                        <div
                            key={member.id}
                            className="premium-card p-8 border-2 border-slate-50 relative group hover:border-brand-primary/20 animate-fade-in-up"
                            style={{ animationDelay: `${index * 50}ms` }}
                        >
                            <div className="flex items-start justify-between mb-8">
                                <div className="flex items-center gap-4">
                                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-inner ${member.role === 'branch_manager' ? 'bg-brand-primary text-white' : 'bg-slate-100 text-slate-400'}`}>
                                        <UserCircle size={32} strokeWidth={1.5} />
                                    </div>
                                    <div>
                                        <h3 className="font-black text-slate-800 text-lg uppercase leading-none mb-1.5">{member.username}</h3>
                                        <div className="flex gap-2">
                                            <span className={`text-[8px] font-black px-2 py-0.5 rounded-lg uppercase tracking-widest border ${member.role === 'branch_manager' ? 'bg-amber-100 text-amber-700 border-amber-200' : 'bg-slate-50 text-slate-500 border-slate-100'}`}>
                                                {member.role === 'cashier' ? 'Cashier' : 'Manager'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className={`w-2 h-2 rounded-full ${member.is_active ? 'bg-emerald-500 shadow-lg shadow-emerald-200' : 'bg-red-500 shadow-lg shadow-red-200'}`} />
                            </div>

                            <div className="space-y-4 mb-8 bg-slate-50/50 p-4 rounded-2xl border border-slate-50">
                                <div className="flex items-center justify-between text-[10px] uppercase font-black tracking-widest text-slate-400">
                                    <span className="flex items-center gap-2"><Shield size={12} /> Security Status</span>
                                    <span className={member.is_active ? 'text-emerald-600' : 'text-red-500'}>{member.is_active ? 'ACTIVE' : 'LOCKED'}</span>
                                </div>
                                <div className="flex items-center justify-between text-[10px] uppercase font-black tracking-widest text-slate-400">
                                    <span className="flex items-center gap-2"><Key size={12} /> Password Policy</span>
                                    <span className={member.require_password_change ? 'text-amber-600' : 'text-slate-600'}>{member.require_password_change ? 'MUST CHANGE' : 'STABLE'}</span>
                                </div>
                            </div>

                            <button
                                onClick={() => handleDeleteStaff(member.id)}
                                disabled={member.id === user?.id}
                                className="w-full py-4 bg-white border border-slate-200 rounded-2xl font-black text-[10px] text-slate-400 uppercase tracking-[0.2em] hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-all flex items-center justify-center gap-2 disabled:opacity-30 disabled:pointer-events-none group/del"
                            >
                                <Trash2 size={16} className="group-hover/del:scale-110 transition-transform" />
                                Delete Staff Member
                            </button>
                        </div>
                    ))
                )}
            </div>

            {/* Modal - Modern Design */}
            {showAddModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
                    <div className="bg-white rounded-[2.5rem] max-w-md w-full p-1 shadow-2xl animate-scale-in">
                        <div className="bg-slate-50 p-10 rounded-[2.4rem]">
                            <div className="flex items-center gap-3 mb-10">
                                <div className="p-3 bg-brand-primary text-white rounded-2xl shadow-lg shadow-brand-primary/20"><UserPlus size={24} /></div>
                                <div>
                                    <h2 className="text-xl font-black text-slate-800 uppercase italic tracking-tighter">Add Staff</h2>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Setup New Staff Account</p>
                                </div>
                            </div>

                            <form onSubmit={handleCreateStaff} className="space-y-6">
                                <div className="space-y-2 group">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 group-focus-within:text-brand-primary">Username</label>
                                    <div className="relative">
                                        <Users className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                                        <input
                                            type="text"
                                            required
                                            className="w-full pl-12 pr-5 py-3.5 bg-white border border-slate-200 rounded-2xl font-bold text-slate-700 outline-none focus:ring-4 focus:ring-brand-primary/5 focus:border-brand-primary transition-all"
                                            value={formData.username}
                                            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                            placeholder="worker_x"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2 group">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 group-focus-within:text-brand-primary">Password</label>
                                    <div className="relative">
                                        <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                                        <input
                                            type="password"
                                            required
                                            className="w-full pl-12 pr-5 py-3.5 bg-white border border-slate-200 rounded-2xl font-bold text-slate-700 outline-none focus:ring-4 focus:ring-brand-primary/5 focus:border-brand-primary transition-all"
                                            value={formData.password}
                                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                            placeholder="••••••••"
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
                                        disabled={isCreating}
                                        className="flex-1 btn-primary py-4 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2"
                                    >
                                        {isCreating ? <Loader2 className="animate-spin" size={16} /> : 'Save Staff Member'}
                                        {!isCreating && <ChevronRight size={14} strokeWidth={3} />}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StaffManagement;
