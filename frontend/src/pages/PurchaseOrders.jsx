import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import { ClipboardList, CheckCircle, Package, Clock, Truck, Store, ChevronRight, IndianRupee, Calendar } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const PurchaseOrders = () => {
    const [orders, setOrders] = useState([]);
    const { user } = useAuth();
    const [searchParams] = useSearchParams();
    const supplierId = searchParams.get('supplierId');

    const fetchOrders = async () => {
        try {
            const response = await api.get('/purchase-orders/', {
                params: { supplier_id: supplierId }
            });
            setOrders(response.data);
        } catch {
            toast.error('Failed to load stock orders');
        }
    };

    useEffect(() => {
        fetchOrders();
    }, [supplierId]);

    const handleReceive = async (id) => {
        try {
            await api.patch(`/purchase-orders/${id}/receive`);
            toast.success('Stock received and inventory updated');
            fetchOrders();
        } catch {
            toast.error('Failed to receive stock');
        }
    };

    const getStatusStyles = (status) => {
        switch (status) {
            case 'pending': return 'bg-amber-50 text-amber-600 border-amber-100';
            case 'ordered': return 'bg-indigo-50 text-indigo-600 border-indigo-100';
            case 'received': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
            default: return 'bg-slate-50 text-slate-500 border-slate-100';
        }
    };

    return (
        <div className="flex flex-col gap-8 animate-fade-in">
            {/* Header */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                    <h1 className="text-4xl font-black text-slate-800 tracking-tighter italic flex items-center gap-3">
                        <ClipboardList className="text-brand-primary" size={36} />
                        Stock Orders
                    </h1>
                    <p className="text-slate-400 font-bold text-xs uppercase tracking-[0.3em] mt-1">Purchase Orders & Material Procurement</p>
                </div>
                {user?.branch_id && (
                    <div className="px-4 py-2 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center gap-3">
                        <Store size={14} className="text-indigo-400" />
                        <span className="text-[10px] font-black text-indigo-700 uppercase tracking-widest">Node ID: #{user.branch_id}</span>
                    </div>
                )}
            </header>

            <div className="grid grid-cols-1 gap-8">
                {orders.length === 0 ? (
                    <div className="py-40 bg-white rounded-[2.5rem] border-2 border-dashed border-slate-100 flex flex-col items-center justify-center opacity-40">
                        <Clock size={64} strokeWidth={1} className="mb-6 text-slate-300" />
                        <h3 className="font-black uppercase tracking-[0.3em] text-xs text-slate-400">Zero Pending Manifests</h3>
                        <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest mt-2">Orders are auto-triggered on critical stock breach</p>
                    </div>
                ) : (
                    orders.map((order, idx) => (
                        <div key={order.id} className="premium-card p-0 overflow-hidden border-2 border-slate-50 group hover:border-brand-primary/20 animate-fade-in-up" style={{ animationDelay: `${idx * 50}ms` }}>
                            <div className="p-8 border-b border-slate-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-slate-50/30">
                                <div className="flex items-center gap-6">
                                    <div className="w-14 h-14 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center justify-center text-brand-primary">
                                        <Truck size={28} />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-3 mb-1">
                                            <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">MANIFEST_#{order.id}</span>
                                            <span className={`px-2.5 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest border ${getStatusStyles(order.status)}`}>
                                                {order.status}
                                            </span>
                                        </div>
                                        <h2 className="text-xl font-black text-slate-800 uppercase italic tracking-tighter">{order.supplier_name}</h2>
                                        <div className="flex items-center gap-3 text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">
                                            <Calendar size={12} /> {new Date(order.created_at).toLocaleDateString()} @ {new Date(order.created_at).toLocaleTimeString()}
                                        </div>
                                    </div>
                                </div>

                                {order.status === 'pending' && (
                                    <button
                                        onClick={() => handleReceive(order.id)}
                                        className="btn-primary px-6 py-3 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest shadow-lg shadow-brand-primary/20"
                                    >
                                        <CheckCircle size={16} strokeWidth={3} />
                                        Confirm Receipt
                                    </button>
                                )}
                            </div>

                            <div className="p-8">
                                <div className="space-y-4">
                                    {order.items.map((item) => (
                                        <div key={item.id} className="flex justify-between items-center p-4 bg-white border border-slate-50 rounded-2xl group/item hover:border-slate-200 transition-colors">
                                            <div className="flex items-center gap-4">
                                                <div className="p-2 bg-slate-50 text-slate-400 rounded-xl group-hover/item:text-brand-primary group-hover/item:bg-brand-primary/5 transition-colors">
                                                    <Package size={18} />
                                                </div>
                                                <div>
                                                    <div className="font-black text-slate-800 text-sm uppercase italic tracking-tight">{item.raw_material_name}</div>
                                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Units: <span className="text-slate-600">{item.quantity}</span></div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="font-black text-slate-900 text-sm tracking-tighter">₹{(item.quantity * item.unit_price).toFixed(2)}</div>
                                                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">₹{item.unit_price.toFixed(2)} / UNIT</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-8 pt-8 border-t border-slate-50 flex justify-between items-center">
                                    <div className="flex items-center gap-3 text-slate-400">
                                        <IndianRupee size={18} />
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">Manifest Total Yield</span>
                                    </div>
                                    <span className="text-3xl font-black text-slate-900 tracking-tighter italic">₹{order.total_amount.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default PurchaseOrders;
