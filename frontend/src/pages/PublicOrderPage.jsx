import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import toast, { Toaster } from 'react-hot-toast';
import {
    ShoppingCart, Send, Coffee, ChevronRight, X,
    CheckCircle2, Smartphone, UtensilsCrossed, Zap,
    Star, Clock, Info, Video
} from 'lucide-react';

const PublicOrderPage = () => {
    const { branchId, tableId } = useParams();
    const [products, setProducts] = useState([]);
    const [cart, setCart] = useState({});
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [customerPhone, setCustomerPhone] = useState('');
    const [orderStatus, setOrderStatus] = useState(null);
    const [orderId, setOrderId] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        fetchMenu();
    }, [branchId]);

    const fetchMenu = async () => {
        try {
            const response = await api.get(`/products/public/${branchId}`);
            setProducts(response.data);
        } catch {
            toast.error('GUEST_ERROR: Menu matrix offline');
        } finally {
            setLoading(false);
        }
    };

    const addToCart = (product) => {
        setCart(prev => ({
            ...prev,
            [product.id]: {
                ...product,
                qty: (prev[product.id]?.qty || 0) + 1
            }
        }));
        toast.success(`+1 ${product.name}`, {
            duration: 1500,
            position: 'bottom-center',
            style: {
                background: '#000',
                color: '#fff',
                borderRadius: '1rem',
                fontSize: '12px',
                fontWeight: 'bold',
                textTransform: 'uppercase'
            }
        });
    };

    const removeFromCart = (productId) => {
        setCart(prev => {
            const newCart = { ...prev };
            if (newCart[productId]?.qty > 1) {
                newCart[productId].qty -= 1;
            } else {
                delete newCart[productId];
            }
            return newCart;
        });
    };

    const cartTotal = Object.values(cart).reduce((sum, item) => sum + (item.price * item.qty), 0);
    const cartItemsCount = Object.values(cart).reduce((sum, item) => sum + item.qty, 0);

    const handlePlaceOrder = async () => {
        if (cartItemsCount === 0) return;

        setSubmitting(true);
        try {
            const payload = {
                table_id: parseInt(tableId),
                branch_id: parseInt(branchId),
                items: Object.values(cart).map(item => ({
                    product_id: item.id,
                    quantity: item.qty
                })),
                customer_name: "GUEST_USER",
                customer_phone: customerPhone || null
            };
            const response = await api.post('/customer-orders/', payload);
            setOrderId(response.data.id);
            setOrderStatus('TRANSMITTED');
            setCart({});
            toast.success('ORDER_AUTHORIZED');
        } catch {
            toast.error('ORDER_REJECTED: Sync error');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return (
        <div className="h-screen flex flex-col items-center justify-center bg-white">
            <div className="relative">
                <div className="w-16 h-16 border-4 border-slate-100 border-t-brand-primary rounded-full animate-spin" />
                <Coffee className="absolute inset-0 m-auto text-brand-primary animate-pulse" size={24} />
            </div>
            <p className="mt-8 text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 animate-pulse italic">Catalog_Sync_In_Progress</p>
        </div>
    );

    if (orderStatus) {
        return (
            <div className="min-h-screen bg-white p-12 flex flex-col items-center justify-center text-center animate-fade-in">
                <div className="w-24 h-24 bg-emerald-500 text-white rounded-[2rem] flex items-center justify-center shadow-2xl shadow-emerald-200 mb-10 relative">
                    <CheckCircle2 size={48} strokeWidth={1.5} />
                    <div className="absolute -top-2 -right-2 bg-white rounded-full p-2 shadow-lg">
                        <Zap size={16} className="text-amber-500 fill-amber-500" />
                    </div>
                </div>
                <h1 className="text-4xl font-black text-slate-900 mb-2 italic tracking-tighter uppercase">ORDER_AUTHORIZED</h1>
                <p className="text-slate-400 font-bold text-xs uppercase tracking-[0.2em] mb-12">Vector_Link: #ORD-{orderId}</p>

                <div className="w-full max-w-sm bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-5">
                        <Clock size={80} />
                    </div>
                    <div className="flex justify-between items-center mb-6">
                        <span className="text-slate-400 font-black uppercase tracking-widest text-[10px]">CURRENT_STATE</span>
                        <span className="px-4 py-1.5 bg-brand-primary text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-brand-primary/20 animate-pulse">
                            {orderStatus}
                        </span>
                    </div>
                    <p className="text-xs font-bold text-slate-500 leading-relaxed uppercase tracking-tight">
                        Our baristas have received your request. Sit back and await asset delivery.
                    </p>
                </div>

                <button
                    onClick={() => setOrderStatus(null)}
                    className="mt-16 group flex items-center gap-2 text-brand-primary font-black uppercase tracking-[0.2em] text-[10px] hover:scale-105 transition-all"
                >
                    Initialize New Request <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50/50 pb-40 font-sans">
            <Toaster />

            {/* Fluid Header */}
            <div className="bg-white/80 backdrop-blur-md px-8 py-8 shadow-sm sticky top-0 z-50 border-b border-slate-100">
                <div className="flex justify-between items-center max-w-lg mx-auto w-full">
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 leading-none italic uppercase tracking-tighter">POWER HOUSE</h1>
                        <div className="flex items-center gap-2 mt-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Digital Proxy: Table #{tableId}</p>
                        </div>
                    </div>
                    <div className="relative group">
                        <div className="absolute -inset-1 bg-brand-primary/20 blur rounded-full group-hover:opacity-100 transition-opacity opacity-50" />
                        <div className="relative bg-black text-white px-6 py-3 rounded-2xl flex items-center font-black text-xs uppercase tracking-widest">
                            <ShoppingCart size={16} className="mr-3 text-brand-primary" />
                            {cartItemsCount}
                        </div>
                    </div>
                </div>
            </div>

            {/* Menu Matrix */}
            <div className="p-8 space-y-12 max-w-lg mx-auto">
                <div>
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-xl font-black text-slate-800 uppercase italic tracking-tighter flex items-center gap-3">
                            <UtensilsCrossed size={20} className="text-brand-primary" />
                            ASSET_CATALOG
                        </h2>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{products.length} RESOURCES</span>
                    </div>

                    <div className="grid grid-cols-1 gap-6">
                        {products.map((product, idx) => (
                            <div
                                key={product.id}
                                className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-50 flex gap-6 group hover:border-brand-primary/20 hover:shadow-xl hover:shadow-slate-200/50 transition-all animate-fade-in-up"
                                style={{ animationDelay: `${idx * 50}ms` }}
                            >
                                <div className="w-24 h-24 bg-slate-50 rounded-[1.5rem] flex items-center justify-center text-slate-300 relative overflow-hidden group-hover:scale-105 transition-transform">
                                    <Coffee size={40} strokeWidth={1} className="group-hover:text-brand-primary transition-colors" />
                                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Star size={12} className="text-amber-400 fill-amber-400" />
                                    </div>
                                </div>
                                <div className="flex-1 flex flex-col justify-between py-1">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="font-black text-slate-900 uppercase italic tracking-tighter text-lg">{product.name}</h3>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight mt-1 line-clamp-1">{product.description || 'Raw asset: High resolution taste profile'}</p>
                                        </div>
                                        <span className="font-black text-brand-primary text-xl tracking-tighter italic">₹{product.price.toFixed(2)}</span>
                                    </div>
                                    <button
                                        onClick={() => addToCart(product)}
                                        className="mt-4 w-full bg-slate-950 text-white py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-slate-200 hover:bg-brand-primary hover:shadow-brand-primary/30 transition-all flex items-center justify-center gap-2 group/btn"
                                    >
                                        Incorporate <Plus size={14} strokeWidth={3} className="group-hover/btn:rotate-90 transition-transform" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Social Commerce Hook */}
                    <div className="mt-8">
                        <button
                            onClick={() => navigate(`/live/${branchId}`)}
                            className="w-full bg-indigo-50 border-2 border-indigo-100 p-6 rounded-[2rem] flex items-center justify-between group hover:border-indigo-300 transition-all shadow-sm"
                        >
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-200">
                                    <Video size={20} strokeWidth={2.5} />
                                </div>
                                <div className="text-left">
                                    <h3 className="font-black text-indigo-900 uppercase italic tracking-tighter text-sm">Experience the Brew</h3>
                                    <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest mt-0.5">Watch Live & Order Fast</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest animate-pulse">
                                Live <ChevronRight size={14} strokeWidth={3} />
                            </div>
                        </button>
                    </div>
                </div>
            </div>

            {/* Ingestion Layer Console */}
            {cartItemsCount > 0 && (
                <div className="fixed bottom-0 left-0 right-0 p-8 bg-white/90 backdrop-blur-xl border-t border-slate-100 z-50 animate-fade-in-up">
                    <div className="max-w-lg mx-auto space-y-6">
                        <div className="flex items-center space-x-3 bg-slate-50 p-2 rounded-[1.5rem] border border-slate-100 group focus-within:border-brand-primary transition-colors">
                            <div className="p-3 bg-white rounded-xl shadow-sm text-slate-400 group-focus-within:text-brand-primary transition-colors">
                                <Smartphone size={18} />
                            </div>
                            <input
                                type="text"
                                placeholder="WhatsApp_Identity (Optional)"
                                className="flex-1 bg-transparent border-none focus:ring-0 text-xs font-black uppercase tracking-widest py-2 text-slate-800 placeholder:text-slate-200"
                                value={customerPhone}
                                onChange={(e) => setCustomerPhone(e.target.value)}
                            />
                        </div>
                        <button
                            onClick={handlePlaceOrder}
                            disabled={submitting}
                            className="w-full btn-primary py-6 rounded-[2rem] shadow-2xl shadow-brand-primary/30 flex justify-between items-center px-10 active:scale-[0.98] transition-all group"
                        >
                            <span className="flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.3em]">
                                {submitting ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Send size={20} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />}
                                {submitting ? 'TRANSMITTING...' : 'AUTHORIZE_TRANSFER'}
                            </span>
                            <span className="text-2xl font-black italic tracking-tighter opacity-90">₹{cartTotal.toFixed(2)}</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

const Plus = ({ size, strokeWidth, className }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
);

export default PublicOrderPage;
