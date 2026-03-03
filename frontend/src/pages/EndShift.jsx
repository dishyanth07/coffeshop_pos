import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import toast, { Toaster } from 'react-hot-toast';
import { Coins, ArrowLeft, ArrowRight, CheckCircle2, AlertCircle, ShieldCheck, History, IndianRupee, Wallet } from 'lucide-react';

const EndShift = () => {
    const navigate = useNavigate();
    const [expectedAmount, setExpectedAmount] = useState(0);
    const [actualAmount, setActualAmount] = useState('');
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);

    useEffect(() => {
        fetchExpected();
    }, []);

    const fetchExpected = async () => {
        try {
            const res = await api.get('/reports/central-overview');
            // Mocking logic for expected if not explicitly available
            setExpectedAmount(450.75);
        } catch (error) {
            console.error('Handshake failed: Stats matrix unreachable');
        }
    };

    const handleSubmit = async () => {
        if (!actualAmount) return toast.error('PROTOCOL_ERR: Cash quantification required');

        try {
            setLoading(true);
            const res = await api.post('/fraud/reconcile-cash', {
                expected_amount: expectedAmount,
                actual_amount: parseFloat(actualAmount)
            });
            setResult(res.data);
            setStep(3);
            toast.success('Reconciliation sequence complete');
        } catch (error) {
            toast.error('Sync failed: Data integrity mismatch');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex-1 bg-slate-950 flex flex-col items-center justify-center p-8 relative overflow-hidden">
            {/* Background Glows */}
            <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] bg-brand-primary/5 blur-[150px] rounded-full" />
            <div className="absolute bottom-[-20%] left-[-10%] w-[60%] h-[60%] bg-indigo-500/5 blur-[150px] rounded-full" />

            <div className="bg-white w-full max-w-lg rounded-[3rem] shadow-2xl overflow-hidden animate-scale-in relative z-10 border border-white/20 backdrop-blur-3xl">
                <div className="bg-slate-900 p-12 text-white relative">
                    <div className="absolute top-0 right-0 p-8 opacity-10">
                        <Wallet size={120} strokeWidth={1} />
                    </div>
                    <div className="bg-brand-primary w-20 h-20 rounded-3xl flex items-center justify-center mb-6 shadow-2xl shadow-brand-primary/20">
                        <Coins size={40} strokeWidth={1.5} />
                    </div>
                    <h1 className="text-4xl font-black italic tracking-tighter mb-1 uppercase">SHIFT_TERMINATION</h1>
                    <p className="text-slate-400 font-bold text-xs uppercase tracking-[0.3em]">Cash Reconciliation & Node Closure</p>
                </div>

                <div className="p-12">
                    <button
                        onClick={() => navigate('/pos')}
                        className="mb-10 flex items-center gap-2 text-[10px] font-black text-slate-400 hover:text-brand-primary uppercase tracking-widest transition-all group"
                    >
                        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" strokeWidth={3} /> Return to POS_TERMINAL
                    </button>

                    {step === 1 && (
                        <div className="space-y-10 animate-fade-in">
                            <div className="p-8 bg-slate-50 rounded-[2rem] border border-slate-100/50 relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 opacity-5">
                                    <ShieldCheck size={80} />
                                </div>
                                <span className="text-[10px] uppercase font-black text-slate-400 tracking-widest mb-3 block">EXPECTED_MATRIX_BALANCE</span>
                                <div className="text-5xl font-black text-slate-900 tracking-tighter italic">₹{expectedAmount.toFixed(2)}</div>
                            </div>

                            <p className="text-slate-400 text-[10px] font-bold leading-relaxed uppercase tracking-tight">
                                Execute physical cash audit. Quantify all liquid assets in the drawer and synchro-input the total below.
                            </p>

                            <button
                                onClick={() => setStep(2)}
                                className="w-full btn-primary py-6 rounded-[1.5rem] font-black uppercase text-xs tracking-[0.25em] flex items-center justify-center gap-3 shadow-2xl shadow-brand-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                            >
                                Initiate Audit Sequence
                                <ArrowRight size={20} strokeWidth={3} />
                            </button>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-10 animate-fade-in">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">PHYSICAL_CASH_TOTAL</label>
                                <div className="relative group">
                                    <span className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 font-black text-2xl tracking-tighter group-focus-within:text-brand-primary transition-colors">₹</span>
                                    <input
                                        type="number"
                                        value={actualAmount}
                                        onChange={(e) => setActualAmount(e.target.value)}
                                        className="w-full pl-14 pr-8 py-6 bg-slate-50 border-2 border-slate-100 rounded-[2rem] text-4xl font-black tracking-tighter text-slate-900 focus:border-brand-primary focus:bg-white focus:ring-8 focus:ring-brand-primary/5 outline-none transition-all placeholder:text-slate-200"
                                        placeholder="0.00"
                                        autoFocus
                                    />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <button
                                    onClick={handleSubmit}
                                    disabled={loading}
                                    className="w-full btn-primary py-6 rounded-[1.5rem] font-black uppercase text-xs tracking-[0.25em] flex items-center justify-center gap-3 shadow-2xl shadow-brand-primary/20 transition-all"
                                >
                                    {loading ? <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'SYNCHRONIZE & CLOSE_NODE'}
                                </button>

                                <button
                                    onClick={() => setStep(1)}
                                    className="w-full text-slate-400 font-black text-[10px] py-4 uppercase tracking-widest flex items-center justify-center gap-2 hover:text-slate-600 transition-colors"
                                >
                                    <ArrowLeft size={16} strokeWidth={3} />
                                    Re-verify Expected
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 3 && result && (
                        <div className="text-center space-y-10 animate-fade-in">
                            <div className={`w-24 h-24 rounded-[2rem] flex items-center justify-center mx-auto shadow-2xl ${Math.abs(result.difference) > 1 ? 'bg-amber-500 text-white shadow-amber-200' : 'bg-brand-primary text-white shadow-brand-primary/20'}`}>
                                {Math.abs(result.difference) > 1 ? <AlertCircle size={48} strokeWidth={1.5} /> : <CheckCircle2 size={48} strokeWidth={1.5} />}
                            </div>

                            <div>
                                <h2 className="text-3xl font-black text-slate-900 uppercase italic tracking-tighter">NODE_CLOSED</h2>
                                <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em] mt-1">Reconciliation Matrix Summary</p>
                            </div>

                            <div className="grid grid-cols-2 gap-6 pb-4">
                                <div className="bg-slate-50 p-6 rounded-[1.8rem] text-left border border-slate-100/50">
                                    <span className="text-[9px] uppercase font-black text-slate-400 tracking-widest block mb-2">VECTOR_DIFF</span>
                                    <div className={`text-2xl font-black tracking-tighter italic ${result.difference < 0 ? 'text-red-500' : result.difference > 0 ? 'text-emerald-500' : 'text-slate-900'}`}>
                                        {result.difference >= 0 ? '+' : ''}₹{result.difference.toFixed(2)}
                                    </div>
                                </div>
                                <div className="bg-slate-50 p-6 rounded-[1.8rem] text-left border border-slate-100/50">
                                    <span className="text-[9px] uppercase font-black text-slate-400 tracking-widest block mb-2">INTEGRITY_STAT</span>
                                    <div className={`text-xs font-black uppercase tracking-[0.2em] mt-2 ${Math.abs(result.difference) > 5 ? 'text-amber-500' : 'text-indigo-600'}`}>
                                        {Math.abs(result.difference) > 5 ? 'SIGNAL_FLAGGED' : 'NOMINAL_STATE'}
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={() => navigate('/pos')}
                                className="w-full bg-slate-900 text-white py-6 rounded-[1.5rem] font-black uppercase text-xs tracking-[0.25em] shadow-2xl shadow-slate-200 hover:scale-[1.02] active:scale-[0.98] transition-all"
                            >
                                EXIT_TO_MAIN_TERMINAL
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default EndShift;
