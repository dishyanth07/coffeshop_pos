import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import {
    Search, Smartphone, User, Calendar, CreditCard, ArrowLeft,
    ShoppingCart, Package, BarChart3, Users, LogOut, Coffee,
    Store, ChevronRight, UserCircle, History, Info
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const CustomerHistory = () => {
    const [phone, setPhone] = useState('');
    const [customerData, setCustomerData] = useState(null);
    const [allCustomers, setAllCustomers] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const { user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        fetchAllCustomers();
    }, []);

    const fetchAllCustomers = async () => {
        try {
            const response = await api.get('/sales/customers');
            setAllCustomers(response.data.customers);
        } catch (error) {
            toast.error('Failed to load entity registry');
        } finally {
            setIsInitialLoading(false);
        }
    };

    const fetchHistory = async (searchPhone) => {
        const phoneToSearch = searchPhone || phone;
        if (!phoneToSearch) return;

        setIsLoading(true);
        try {
            const response = await api.get(`/sales/customer/${phoneToSearch}`);
            setCustomerData(response.data);
            setPhone(phoneToSearch);
        } catch (error) {
            toast.error('Entity not found in current matrix');
            setCustomerData(null);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSearch = (e) => {
        if (e) e.preventDefault();
        fetchHistory();
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'SIGNAL_LOST';
        return new Date(dateString).toLocaleString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
        });
    };

    if (isInitialLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="w-12 h-12 border-4 border-brand-primary/10 border-t-brand-primary rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-8 animate-fade-in">
            {/* Header */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div className="flex items-center gap-6">
                    {customerData && (
                        <button
                            onClick={() => { setCustomerData(null); setPhone(''); }}
                            className="p-3 bg-white border border-slate-100 text-slate-400 hover:text-brand-primary hover:border-brand-primary/20 rounded-2xl transition-all shadow-sm"
                        >
                            <ArrowLeft size={24} />
                        </button>
                    )}
                    <div>
                        <h1 className="text-4xl font-black text-slate-800 tracking-tighter italic uppercase">
                            {customerData ? 'ENTITY_HISTORY' : 'ENTITY_REGISTRY'}
                        </h1>
                        <p className="text-slate-400 font-bold text-xs uppercase tracking-[0.3em] mt-1">
                            {customerData ? 'Atomic Transaction Manifest' : 'Global Customer Identity Database'}
                        </p>
                    </div>
                </div>
                {user?.branch_id && (
                    <div className="px-4 py-2 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center gap-3">
                        <Store size={14} className="text-indigo-400" />
                        <span className="text-[10px] font-black text-indigo-700 uppercase tracking-widest">Node ID: #{user.branch_id}</span>
                    </div>
                )}
            </header>

            {/* Search Console */}
            {!customerData && (
                <div className="premium-card p-1 max-w-2xl">
                    <form onSubmit={handleSearch} className="bg-slate-50/50 p-8 rounded-[1.4rem] flex gap-4">
                        <div className="flex-1 relative group">
                            <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-brand-primary transition-colors" size={20} />
                            <input
                                type="text"
                                placeholder="IDENT_PHONE_VECTOR"
                                className="w-full pl-12 pr-5 py-4 bg-white border border-slate-200 rounded-2xl font-black text-slate-800 text-sm tracking-widest outline-none focus:ring-4 focus:ring-brand-primary/5 focus:border-brand-primary transition-all placeholder:text-slate-200 shadow-sm"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={isLoading || !phone}
                            className="btn-primary px-10 py-4 text-[10px] font-black uppercase tracking-widest shadow-xl shadow-brand-primary/20 disabled:grayscale transition-all"
                        >
                            {isLoading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Execute_Scan'}
                        </button>
                    </form>
                </div>
            )}

            {customerData ? (
                <div className="space-y-8 animate-fade-in">
                    {/* Entity Profile Card */}
                    <div className="premium-card p-10 border-2 border-brand-primary/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-10 bg-gradient-to-br from-white to-slate-50/50">
                        <div className="flex items-center gap-8">
                            <div className="w-24 h-24 bg-brand-primary text-white rounded-[2rem] flex items-center justify-center shadow-2xl shadow-brand-primary/30 border-4 border-white">
                                <User size={48} strokeWidth={1.5} />
                            </div>
                            <div>
                                <h2 className="text-3xl font-black text-slate-800 uppercase italic tracking-tighter">{customerData.customer.name || 'ANON_ENTITY'}</h2>
                                <div className="flex items-center gap-3 mt-1.5 font-black text-indigo-500 text-sm tracking-widest bg-indigo-50 px-3 py-1 rounded-lg w-fit">
                                    <Smartphone size={14} /> {customerData.customer.phone}
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <StatBox label="Total Yield" value={`$${customerData.total_spent.toFixed(2)}`} color="emerald" />
                            <StatBox label="Order Cycle" value={customerData.order_count} color="indigo" />
                        </div>
                    </div>

                    {/* Transaction Stream */}
                    <div className="premium-card p-10 border-2 border-slate-50">
                        <div className="flex items-center gap-4 mb-10">
                            <div className="p-3 bg-slate-50 text-slate-400 rounded-2xl"><History size={20} /></div>
                            <h2 className="text-xl font-black text-slate-800 uppercase italic tracking-tighter">Transaction_Stream</h2>
                        </div>

                        <div className="space-y-6">
                            {customerData.sales.length > 0 ? (
                                customerData.sales.map((sale, idx) => (
                                    <div key={sale.id} className="p-8 border border-slate-50 rounded-[2rem] hover:border-brand-primary/20 transition-all group bg-slate-50/30 animate-fade-in-up" style={{ animationDelay: `${idx * 50}ms` }}>
                                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                                            <div>
                                                <div className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-1">BILL_#{sale.id}</div>
                                                <div className="flex items-center gap-3 text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                                                    <Calendar size={14} /> {formatDate(sale.created_at)}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-3xl font-black text-slate-900 tracking-tighter italic">${sale.total_amount.toFixed(2)}</div>
                                            </div>
                                        </div>
                                        <div className="bg-white/80 backdrop-blur-sm rounded-[1.5rem] p-6 border border-slate-100/50 space-y-3 shadow-sm shadow-slate-100">
                                            {sale.items.map((item, id) => (
                                                <div key={id} className="flex justify-between items-center group/item">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-slate-200 group-hover/item:bg-brand-primary transition-colors" />
                                                        <span className="text-xs font-black text-slate-700 uppercase italic truncate max-w-[200px]">{item.product_name}</span>
                                                        <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">×{item.quantity}</span>
                                                    </div>
                                                    <span className="text-xs font-black text-slate-400 tracking-widest">${(item.price * item.quantity).toFixed(2)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="py-20 text-center opacity-30">
                                    <Info size={48} className="mx-auto mb-4" strokeWidth={1} />
                                    <p className="font-black text-[10px] uppercase tracking-widest">No transaction logic detected</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="premium-card p-0 border-2 border-slate-50 overflow-hidden">
                    <div className="bg-slate-50/50 px-8 py-5 border-b border-slate-50 flex justify-between items-center">
                        <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">Global Entity Manifest</h2>
                        <span className="px-3 py-1 bg-white text-slate-400 text-[9px] font-black rounded-full border border-slate-100 uppercase tracking-[0.2em]">{allCustomers.length} TOTAL_NODES</span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] border-b border-slate-50 italic">
                                    <th className="px-8 py-6">Identity / Link</th>
                                    <th className="px-8 py-6">Cycle_Count</th>
                                    <th className="px-8 py-6">Gross_Yield</th>
                                    <th className="px-8 py-6">Last_Signal</th>
                                    <th className="px-8 py-6 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {allCustomers.length > 0 ? (
                                    allCustomers.map((cust, idx) => (
                                        <tr key={cust.id} className="group hover:bg-brand-primary/5 transition-all cursor-pointer animate-fade-in" style={{ animationDelay: `${idx * 20}ms` }} onClick={() => fetchHistory(cust.phone)}>
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 font-black text-[10px] group-hover:bg-brand-primary group-hover:text-white transition-colors">
                                                        {(cust.name || 'X').charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <div className="font-black text-slate-800 text-sm italic uppercase tracking-tight group-hover:text-brand-primary">{cust.name || 'ANON_ENTITY'}</div>
                                                        <div className="text-[10px] font-bold text-slate-400 tracking-widest">{cust.phone}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 font-black text-slate-600 text-xs tracking-widest">{cust.order_count}</td>
                                            <td className="px-8 py-6 font-black text-emerald-600 text-sm tracking-tighter">${cust.total_spent.toFixed(2)}</td>
                                            <td className="px-8 py-6 text-[10px] font-bold text-slate-400 uppercase tracking-tight">{formatDate(cust.last_order_date)}</td>
                                            <td className="px-8 py-6 text-right">
                                                <div className="flex justify-end group-hover:translate-x-1 transition-transform">
                                                    <ChevronRight size={18} className="text-slate-300 group-hover:text-brand-primary" />
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="5" className="px-8 py-20 text-center opacity-30 italic">
                                            <Users size={40} className="mx-auto mb-4" strokeWidth={1} />
                                            <p className="font-black text-[10px] uppercase tracking-widest">Entity Database Offline</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

const StatBox = ({ label, value, color }) => {
    const colors = {
        emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100 shadow-emerald-50',
        indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100 shadow-indigo-50',
    };
    return (
        <div className={`px-6 py-4 rounded-3xl border-2 flex flex-col items-center justify-center min-w-[120px] shadow-lg ${colors[color]}`}>
            <span className="text-[9px] font-black uppercase tracking-widest opacity-60 mb-1">{label}</span>
            <span className="text-xl font-black tracking-tighter italic">{value}</span>
        </div>
    );
};

export default CustomerHistory;
