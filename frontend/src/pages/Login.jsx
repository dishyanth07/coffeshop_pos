import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Coffee, Lock, User, ArrowRight, Loader2 } from 'lucide-react';
import Logo from '../components/Logo';
import { toast } from 'react-hot-toast';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await login(username, password);
            toast.success('Welcome back!');
            window.location.href = '/pos';
        } catch (error) {
            console.error("LOGIN ERROR FULL OBJECT:", error);
            let detail = "Invalid credentials or Server Error";
            if (error.response) {
                detail = `Error ${error.response.status}: ${JSON.stringify(error.response.data)}`;
                console.error("RESPONSE DATA:", error.response.data);
                console.error("RESPONSE STATUS:", error.response.status);
            } else if (error.request) {
                detail = "Network Error: No response from server. Check if port 8000 is open in firewall.";
            } else {
                detail = error.message;
            }
            toast.error(detail, { duration: 5000 });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="h-screen flex items-center justify-center bg-brand-bg relative overflow-hidden font-sans">
            {/* Background Decor */}
            <div className="absolute top-0 left-0 w-full h-full">
                <div className="absolute -top-24 -left-24 w-96 h-96 bg-brand-primary/5 rounded-full blur-3xl opacity-50" />
                <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-brand-accent/5 rounded-full blur-3xl opacity-50" />
            </div>

            <div className="w-full max-w-md p-4 relative z-10 animate-fade-in-up">
                <div className="bg-white rounded-[2rem] shadow-premium border border-slate-100 overflow-hidden transform transition-all duration-500 hover:shadow-premium-hover">
                    {/* Header */}
                    <div className="bg-brand-primary p-6 text-center relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                            <Coffee className="absolute -top-4 -left-4 w-24 h-24" />
                            <Coffee className="absolute -bottom-4 -right-4 w-24 h-24" />
                        </div>

                        <div className="animate-scale-in flex justify-center py-2">
                            <Logo size="xl" />
                        </div>
                    </div>

                    {/* Form Container */}
                    <div className="p-8">
                        <form onSubmit={handlePasswordSubmit} className="space-y-6">
                            <div className="space-y-5">
                                <div className="space-y-2 group">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 transition-colors group-focus-within:text-brand-primary">
                                        Access Identifier
                                    </label>
                                    <div className="relative">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-brand-primary transition-colors">
                                            <User size={20} strokeWidth={2.5} />
                                        </div>
                                        <input
                                            type="text"
                                            required
                                            className="w-full pl-12 pr-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-brand-primary/5 focus:border-brand-primary outline-none transition-all font-bold text-slate-700 placeholder:text-slate-300 shadow-inner"
                                            value={username}
                                            onChange={(e) => setUsername(e.target.value)}
                                            placeholder="username_id"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2 group">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 transition-colors group-focus-within:text-brand-primary">
                                        Secure Key
                                    </label>
                                    <div className="relative">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-brand-primary transition-colors">
                                            <Lock size={20} strokeWidth={2.5} />
                                        </div>
                                        <input
                                            type="password"
                                            required
                                            className="w-full pl-12 pr-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-brand-primary/5 focus:border-brand-primary outline-none transition-all font-bold text-slate-700 placeholder:text-slate-300 shadow-inner"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="••••••••"
                                        />
                                    </div>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-brand-primary text-white py-4 rounded-2xl font-black text-lg flex items-center justify-center gap-3 hover:bg-brand-secondary active:scale-[0.97] transition-all shadow-xl shadow-brand-primary/30 group disabled:opacity-50"
                            >
                                {loading ? <Loader2 className="animate-spin" size={24} /> : (
                                    <>
                                        LOG IN <ArrowRight size={24} strokeWidth={3} />
                                    </>
                                )}
                            </button>
                        </form>

                        <div className="mt-6 pt-5 border-t border-slate-50 text-center">
                            <p className="text-slate-400 text-xs font-bold leading-relaxed">
                                Diagnostic v1 - Authorized Personnel Only.<br />
                                Unauthorized access is strictly prohibited.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="mt-4 flex justify-center items-center gap-6 opacity-30 grayscale transition-all hover:opacity-60 hover:grayscale-0 duration-500">
                    <span className="text-[10px] font-black text-slate-500 tracking-widest">SECURED BY POWERHOUSE</span>
                    <div className="w-1.5 h-1.5 bg-slate-400 rounded-full" />
                    <span className="text-[10px] font-black text-slate-500 tracking-widest">V2.4.0 STABLE</span>
                </div>
            </div>
        </div>
    );
};

export default Login;
