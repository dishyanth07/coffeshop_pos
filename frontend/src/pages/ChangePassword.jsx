import React, { useState } from 'react';
import api from '../services/api';
import { Lock, ShieldCheck, AlertTriangle, ChevronRight, ShieldAlert, Key, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const ChangePassword = () => {
    const [passwords, setPasswords] = useState({ old: '', new: '', confirm: '' });
    const [loading, setLoading] = useState(false);
    const { logout } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (passwords.new !== passwords.confirm) {
            toast.error('Passwords do not match');
            return;
        }
        if (passwords.new.length < 6) {
            toast.error('Password too short (min 6 characters)');
            return;
        }

        setLoading(true);
        try {
            await api.post('/auth/change-password', {
                old_password: passwords.old,
                new_password: passwords.new
            });
            toast.success('Password updated successfully');
            setTimeout(() => {
                logout();
            }, 2000);
        } catch (error) {
            toast.error('Incorrect current password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-950 flex items-center justify-center p-8 overflow-hidden">
            {/* Background elements */}
            <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] bg-brand-primary/10 blur-[120px] rounded-full animate-pulse" />
            <div className="absolute bottom-[-10%] left-[-5%] w-[40%] h-[40%] bg-indigo-500/10 blur-[120px] rounded-full animate-pulse delay-1000" />

            <div className="max-w-md w-full relative group">
                {/* Glow effect wrap */}
                <div className="absolute -inset-1 bg-gradient-to-r from-brand-primary/20 to-indigo-500/20 rounded-[3rem] blur opacity-25 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>

                <div className="relative bg-white rounded-[2.5rem] shadow-2xl p-12 border border-white/20 backdrop-blur-3xl animate-scale-in">
                    <div className="flex flex-col items-center mb-10 text-center">
                        <div className="relative mb-6">
                            <div className="bg-brand-primary text-white p-6 rounded-[1.8rem] shadow-2xl shadow-brand-primary/30 relative z-10">
                                <ShieldAlert size={48} strokeWidth={1.5} className="animate-pulse" />
                            </div>
                            <div className="absolute -bottom-2 -right-2 bg-amber-500 text-white p-2 rounded-xl shadow-lg z-20">
                                <Lock size={16} strokeWidth={3} />
                            </div>
                        </div>

                        <h2 className="text-3xl font-black text-slate-800 uppercase italic tracking-tighter">Change Password</h2>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1.5 max-w-[280px]">Securely update your login credentials</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <SecurityInput label="Current Password" value={passwords.old} onChange={(v) => setPasswords({ ...passwords, old: v })} placeholder="••••••••" icon={<Key size={16} />} />
                        <SecurityInput label="New Password" value={passwords.new} onChange={(v) => setPasswords({ ...passwords, new: v })} placeholder="••••••••" icon={<Key size={16} />} />
                        <SecurityInput label="Confirm New Password" value={passwords.confirm} onChange={(v) => setPasswords({ ...passwords, confirm: v })} placeholder="••••••••" icon={<Key size={16} />} />

                        <div className="bg-indigo-50 border border-indigo-100/50 p-5 rounded-[1.5rem] flex gap-4 items-start mb-4">
                            <ShieldCheck className="text-indigo-500 shrink-0" size={20} />
                            <p className="text-[9px] text-indigo-900 font-bold leading-relaxed uppercase tracking-tight">
                                For your security, updating your password will log you out of all devices immediately.
                            </p>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full btn-primary py-5 rounded-[1.4rem] font-black text-xs uppercase tracking-[0.25em] shadow-2xl shadow-brand-primary/30 flex items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-[0.98]"
                        >
                            {loading ? <Loader2 className="animate-spin" size={18} /> : (
                                <>Update Password <ChevronRight size={16} strokeWidth={3} /></>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

const SecurityInput = ({ label, value, onChange, placeholder, icon }) => (
    <div className="space-y-2 group">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 group-focus-within:text-brand-primary transition-colors">{label}</label>
        <div className="relative">
            <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-brand-primary transition-colors">{icon}</div>
            <input
                type="password"
                required
                className="w-full pl-12 pr-5 py-4 bg-slate-50/50 border border-slate-200 rounded-2xl font-black text-slate-800 text-sm tracking-[0.3em] outline-none focus:ring-4 focus:ring-brand-primary/5 focus:border-brand-primary transition-all placeholder:text-slate-200"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
            />
        </div>
    </div>
);

export default ChangePassword;
