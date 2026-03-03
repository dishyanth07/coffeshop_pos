import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import {
    Plus, Minus, Trash2, LogOut, ShoppingCart, Coffee, Package,
    Smartphone, User as UserIcon, ExternalLink, QrCode, Clock,
    CheckCircle, ChefHat, Search, Tag, AlertTriangle, MessageSquare, X, ShoppingBag, ChevronDown
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import upiQr from '../assets/upi_qr.jpg';

const OrderCard = ({ order, onUpdateStatus, onPay, isSocial = false }) => (
    <div key={order.id} className={`premium-card overflow-hidden flex flex-col border-2 animate-scale-in ${isSocial ? 'border-indigo-50 shadow-indigo-100/50 shadow-xl' : 'border-slate-50'}`}>
        <div className={`p-4 border-b flex justify-between items-center ${isSocial ? 'bg-indigo-50/50 border-indigo-100' : 'bg-slate-50/50 border-slate-100'}`}>
            <div>
                <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter ${isSocial ? 'bg-indigo-600 text-white' : 'bg-brand-accent text-brand-primary'}`}>
                        {isSocial ? `LIVE SALE` : `TABLE ${order.table_number}`}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 italic">#{order.id}</span>
                </div>
                <h4 className="font-black text-slate-800 text-sm mt-1 uppercase">
                    {order.customer_name || 'Guest Customer'}
                </h4>
            </div>
            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${order.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-indigo-100 text-indigo-700'}`}>
                {order.status}
            </span>
        </div>
        <div className="p-4 flex-1 space-y-3 bg-white">
            {order.items.map(item => (
                <div key={item.id} className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs ${isSocial ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-brand-primary'}`}>
                            {item.quantity}
                        </div>
                        <span className="text-sm font-bold text-slate-600">{item.product_name}</span>
                    </div>
                    <span className="text-xs font-black text-slate-400 tracking-tighter">₹{(item.price_at_order * item.quantity).toFixed(2)}</span>
                </div>
            ))}
        </div>
        <div className="p-4 bg-slate-50/30 border-t border-slate-100">
            <div className="flex justify-between items-center mb-4">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Due</span>
                <span className={`font-black text-xl tracking-tighter ${isSocial ? 'text-indigo-600' : 'text-brand-primary'}`}>
                    ₹{order.total_amount.toFixed(2)}
                </span>
            </div>
            <div className="flex gap-2">
                {order.status === 'pending' && (
                    <button onClick={() => onUpdateStatus(order.id, 'preparing')} className="flex-1 bg-brand-primary text-white py-3 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-brand-secondary transition-all shadow-lg shadow-brand-primary/10">
                        <ChefHat size={14} /> {isSocial ? 'ACCEPT ORDER' : 'START PREP'}
                    </button>
                )}
                {order.status === 'preparing' && (
                    <button onClick={() => onUpdateStatus(order.id, 'served')} className="flex-1 bg-brand-accent text-brand-primary py-3 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-amber-600 hover:text-white transition-all shadow-lg shadow-brand-accent/20">
                        <Coffee size={14} /> {isSocial ? 'MARK READY' : 'MARK SERVED'}
                    </button>
                )}
                {(order.status === 'served' || (isSocial && order.status === 'preparing')) && (
                    <div className="flex-1 flex flex-col gap-2">
                        <div className="flex gap-1 justify-center">
                            {['cash', 'card', 'upi'].map(m => (
                                <button
                                    key={m}
                                    onClick={() => onPay(order.id, m)}
                                    className={`flex-1 py-1 px-2 rounded-lg text-[8px] font-black uppercase tracking-tighter transition-all border-2 ${m === 'cash' ? 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100' :
                                        m === 'card' ? 'bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-100' :
                                            'bg-purple-50 text-purple-600 border-purple-100 hover:bg-purple-100'
                                        }`}
                                >
                                    {m}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    </div>
);

const CustomizationModal = ({ product, onClose, onAdd }) => {
    const [selected, setSelected] = useState([]);

    const toggleOption = (opt) => {
        setSelected(prev =>
            prev.find(i => i.id === opt.id)
                ? prev.filter(i => i.id !== opt.id)
                : [...prev, opt]
        );
    };

    const totalPrice = product.price + selected.reduce((sum, o) => sum + o.extra_price, 0);

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-scale-in">
                <div className="p-8 bg-brand-primary text-white text-center">
                    <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Coffee size={32} />
                    </div>
                    <h3 className="text-2xl font-black italic tracking-tighter uppercase">{product.name}</h3>
                    <p className="text-[10px] font-bold text-white/50 uppercase tracking-[0.2em] mt-1 italic">Power House Personalization</p>
                </div>

                <div className="p-8 space-y-6">
                    <div>
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Extra Add-ons</h4>
                        <div className="grid grid-cols-1 gap-3">
                            {product.customizations?.map((opt) => (
                                <button
                                    key={opt.id}
                                    onClick={() => toggleOption(opt)}
                                    className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${selected.find(i => i.id === opt.id)
                                        ? 'border-brand-primary bg-brand-primary/5 shadow-lg shadow-brand-primary/5'
                                        : 'border-slate-50 hover:border-slate-200'
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${selected.find(i => i.id === opt.id) ? 'bg-brand-primary border-brand-primary' : 'border-slate-200'
                                            }`}>
                                            {selected.find(i => i.id === opt.id) && <CheckCircle size={12} className="text-white" />}
                                        </div>
                                        <span className="font-bold text-sm text-slate-700">{opt.name}</span>
                                    </div>
                                    <span className="font-black text-indigo-600">+₹ {opt.extra_price.toFixed(2)}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Selected Total</p>
                            <p className="text-2xl font-black text-brand-primary tracking-tighter italic">₹{totalPrice.toFixed(2)}</p>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={onClose}
                                className="px-6 py-3 rounded-xl font-bold text-xs text-slate-400 uppercase hover:bg-slate-50 transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => onAdd(product, selected)}
                                className="bg-brand-primary text-white px-8 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-brand-secondary transition-all shadow-lg shadow-brand-primary/10"
                            >
                                Add to Cart
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const POS = () => {
    const [products, setProducts] = useState([]);
    const [cart, setCart] = useState([]);
    const [isCheckingOut, setIsCheckingOut] = useState(false);
    const [lowStockItems, setLowStockItems] = useState([]);
    const [customerPhone, setCustomerPhone] = useState('');
    const [customerName, setCustomerName] = useState('');
    const [checkoutResult, setCheckoutResult] = useState(null);
    const [qrOrders, setQrOrders] = useState([]);
    const [socialOrders, setSocialOrders] = useState([]);
    const [viewMode, setViewMode] = useState('products'); // 'products', 'qr-orders', or 'social-orders'
    const [searchQuery, setSearchQuery] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('cash'); // 'cash', 'card', 'upi'
    const [amountReceived, setAmountReceived] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('ALL');
    const [showMobileCart, setShowMobileCart] = useState(false);
    const [activeAiOffer, setActiveAiOffer] = useState(null);
    const [applyAiOffer, setApplyAiOffer] = useState(false);
    const [manualDiscount, setManualDiscount] = useState('');
    const [showOffers, setShowOffers] = useState(false);
    const navigate = useNavigate();
    const receiptRef = useRef(null);

    useEffect(() => {
        fetchProducts();
        fetchLowStock();
        fetchQrOrders();
        fetchSocialOrders();

        fetchActiveOffer();

        const poller = setInterval(() => {
            fetchQrOrders();
            fetchSocialOrders();
            fetchActiveOffer();
        }, 15000);
        return () => clearInterval(poller);
    }, []);

    useEffect(() => {
        if (checkoutResult) {
            const timer = setTimeout(() => {
                setCheckoutResult(null);
            }, 15000);
            return () => clearTimeout(timer);
        }
    }, [checkoutResult]);

    const fetchProducts = async () => {
        try {
            const response = await api.get('/products');
            setProducts(response.data);
        } catch {
            toast.error('Failed to load products');
        }
    };

    const fetchLowStock = async () => {
        try {
            const response = await api.get('/inventory/low-stock');
            setLowStockItems(response.data);
        } catch {
            console.error('Failed to load low stock items');
        }
    };

    const fetchQrOrders = async () => {
        try {
            const response = await api.get('/customer-orders/live');
            setQrOrders(response.data.filter(o => o.source === 'pos'));
        } catch {
            console.error('Failed to load QR orders');
        }
    };

    const fetchActiveOffer = async () => {
        try {
            const response = await api.get('/assistant/crisis-status');
            const offer = response.data.active_offers;
            if (offer && Object.keys(offer).length > 0) {
                setActiveAiOffer(offer);
                // Auto-apply crisis discount
                setApplyAiOffer(true);
            } else {
                setActiveAiOffer(null);
                setApplyAiOffer(false);
            }
        } catch {
            console.error('Failed to load active offers');
        }
    };

    const fetchSocialOrders = async () => {
        try {
            const response = await api.get('/customer-orders/live');
            setSocialOrders(response.data.filter(o => o.source === 'live_commerce'));
        } catch {
            console.error('Failed to load Social orders');
        }
    };

    const updateOrderStatus = async (orderId, status) => {
        try {
            await api.patch(`/customer-orders/${orderId}/status`, { status });
            toast.success(`Order marked as ${status}`);
            fetchQrOrders();
            fetchSocialOrders();
        } catch {
            toast.error('Failed to update status');
        }
    };

    const payOrder = async (orderId, method = 'cash') => {
        try {
            const response = await api.post(`/customer-orders/${orderId}/pay`, { payment_method: method });
            toast.success(`Order Paid via ${method.toUpperCase()}! Sale #${response.data.id}`);
            setCheckoutResult(response.data);
            fetchQrOrders();
            fetchSocialOrders();
            fetchProducts();
        } catch {
            toast.error('Payment failed');
        }
    };

    const [customizingProduct, setCustomizingProduct] = useState(null);

    const addToCart = (product, selectedCustomizations = []) => {
        if (product.stock <= 0) {
            toast.error('Out of stock');
            return;
        }

        if (product.customizations?.length > 0 && selectedCustomizations.length === 0 && !customizingProduct) {
            setCustomizingProduct(product);
            return;
        }

        const customizationIds = selectedCustomizations.map(c => c.id);
        const customizationPrice = selectedCustomizations.reduce((sum, c) => sum + c.extra_price, 0);

        setCart((prevCart) => {
            const existingIndex = prevCart.findIndex((item) =>
                item.product_id === product.id &&
                JSON.stringify(item.customization_ids?.sort()) === JSON.stringify(customizationIds.sort())
            );

            if (existingIndex !== -1) {
                const updatedCart = [...prevCart];
                if (updatedCart[existingIndex].quantity >= product.stock) {
                    toast.error('Not enough stock');
                    return prevCart;
                }
                updatedCart[existingIndex] = {
                    ...updatedCart[existingIndex],
                    quantity: updatedCart[existingIndex].quantity + 1
                };
                return updatedCart;
            }

            return [...prevCart, {
                id: Date.now(),
                product_id: product.id,
                name: product.name,
                price: product.price,
                extra_price: customizationPrice,
                customizations: selectedCustomizations,
                customization_ids: customizationIds,
                quantity: 1
            }];
        });

        setCustomizingProduct(null);
    };

    const removeFromCart = (cartItemId) => {
        setCart((prevCart) => prevCart.filter((item) => (item.id || item.product_id) !== cartItemId));
    };

    const updateQuantity = (cartItemId, delta) => {
        setCart((prevCart) => {
            return prevCart.map((item) => {
                const id = item.id || item.product_id;
                if (id === cartItemId) {
                    const newQuantity = Math.max(1, item.quantity + delta);
                    const product = products.find(p => p.id === item.product_id);
                    if (delta > 0 && product && newQuantity > product.stock) {
                        toast.error("Max stock reached");
                        return item;
                    }
                    return { ...item, quantity: newQuantity };
                }
                return item;
            });
        });
    };

    const calculateTotal = () => {
        return cart.reduce((total, item) => total + (item.price + (item.extra_price || 0)) * item.quantity, 0);
    };

    const handleCheckout = async () => {
        if (cart.length === 0) return;
        setIsCheckingOut(true);
        try {
            const subtotal = calculateTotal();
            const aiDiscount = applyAiOffer ? (subtotal * (activeAiOffer.discount_pct / 100)) : 0;
            const mDiscount = parseFloat(manualDiscount || 0);
            const totalDiscount = aiDiscount + mDiscount;

            const response = await api.post('/sales/billing', {
                items: cart.map(({ product_id, quantity, customization_ids }) => ({
                    product_id,
                    quantity,
                    customization_ids: customization_ids || []
                })),
                customer_phone: customerPhone || null,
                customer_name: customerName || null,
                payment_method: paymentMethod,
                amount_received: paymentMethod === 'cash' ? parseFloat(amountReceived || 0) : (subtotal - totalDiscount),
                change_amount: paymentMethod === 'cash' ? (parseFloat(amountReceived || 0) - (subtotal - totalDiscount)) : 0,
                discount_amount: totalDiscount,
                discount_reason: applyAiOffer ? `AI Offer + Manual (${aiDiscount.toFixed(0)} + ${mDiscount.toFixed(0)})` : (mDiscount > 0 ? "Manual Discount" : null)
            });

            toast.success(`Sale Complete! Bill #${response.data.id}`);
            setCart([]);
            setCustomerPhone('');
            setCustomerName('');
            setAmountReceived('');

            const orderSnapshot = {
                ...response.data,
                items: [...cart],
                orderSubtotal: subtotal,
                totalDiscount: totalDiscount
            };

            setCheckoutResult(orderSnapshot);
            fetchProducts();
        } catch (error) {
            toast.error(error.response?.data?.detail || 'Checkout failed');
        } finally {
            setIsCheckingOut(false);
        }
    };

    const handleDownloadReceipt = async () => {
        if (!receiptRef.current || !checkoutResult) {
            toast.error("Receipt data not ready");
            return;
        }

        try {
            toast.loading("Generating PDF...", { id: 'pdf-gen' });
            await new Promise(r => setTimeout(r, 200));

            const canvas = await html2canvas(receiptRef.current, {
                scale: 2,
                useCORS: true,
                backgroundColor: "#ffffff",
                onclone: (clonedDoc) => {
                    const styleSheets = clonedDoc.querySelectorAll('style, link[rel="stylesheet"]');
                    styleSheets.forEach(s => s.remove());
                }
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: [80, 250]
            });

            const imgProps = pdf.getImageProperties(imgData);
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`Receipt_${checkoutResult.id || 'Sale'}.pdf`);
            toast.success("Receipt Downloaded", { id: 'pdf-gen' });
        } catch (error) {
            console.error("PDF Error:", error);
            toast.error(`Error: ${error.message || 'Capture failed'}`, { id: 'pdf-gen' });
        }
    };

    const categories = ['ALL', ...new Set(products.map(p => p.category))];

    const filteredProducts = products.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.category.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory === 'ALL' || p.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    return (
        <div className="h-full flex flex-col gap-4 md:gap-6 animate-fade-in">
            {/* Top Bar */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 md:gap-6">
                <div className="flex flex-col">
                    <h1 className="text-2xl md:text-3xl font-black text-slate-800 italic tracking-tighter leading-none">POWER HOUSE POS</h1>
                    <p className="text-slate-400 text-[9px] md:text-xs font-bold uppercase tracking-[0.2em] mt-1">Smart. Simple. Scalable.</p>
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                            type="text"
                            placeholder="Find coffee..."
                            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-brand-primary/5 focus:border-brand-primary outline-none transition-all font-bold text-xs md:text-sm text-slate-700 shadow-sm"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <button
                        onClick={() => navigate('/end-shift')}
                        className="bg-red-50 text-red-600 px-3 md:px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-100 transition-all flex items-center shadow-sm h-[38px] md:h-auto"
                    >
                        <LogOut size={14} className="md:mr-2" strokeWidth={3} />
                        <span className="hidden md:inline">Close Shift</span>
                    </button>
                </div>
            </header>

            <div className="flex-1 flex flex-col md:flex-row gap-6 overflow-hidden min-h-0">
                {/* Left Section - Products */}
                <div className={`flex-1 flex flex-col gap-4 md:gap-6 overflow-hidden ${showMobileCart ? 'hidden md:flex' : 'flex'}`}>
                    {/* View Switcher */}
                    <div className="grid grid-cols-3 gap-2 md:gap-4">
                        <button
                            onClick={() => setViewMode('products')}
                            className={`p-0.5 rounded-xl transition-all ${viewMode === 'products' ? 'bg-brand-primary shadow-lg scale-[1.02]' : 'bg-slate-200 hover:bg-slate-300'}`}
                        >
                            <div className={`p-2 md:p-4 rounded-[calc(0.75rem-2px)] flex flex-col md:flex-row items-center justify-center md:justify-between gap-1 md:gap-3 ${viewMode === 'products' ? 'bg-brand-primary text-white' : 'bg-white text-slate-600'}`}>
                                <div className="flex items-center gap-2">
                                    <div className={`p-1.5 rounded-lg ${viewMode === 'products' ? 'bg-white/10' : 'bg-slate-100'}`}>
                                        <Coffee size={16} strokeWidth={2.5} />
                                    </div>
                                    <span className="font-black text-[8px] md:text-[9px] uppercase tracking-widest hidden md:inline">Menu</span>
                                </div>
                                <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full ${viewMode === 'products' ? 'bg-brand-accent text-brand-primary' : 'bg-slate-100 text-slate-400'}`}>
                                    {products.length}
                                </span>
                            </div>
                        </button>

                        <button
                            onClick={() => setViewMode('qr-orders')}
                            className={`p-0.5 rounded-xl transition-all ${viewMode === 'qr-orders' ? 'bg-brand-primary shadow-lg scale-[1.02]' : 'bg-slate-200 hover:bg-slate-300'}`}
                        >
                            <div className={`p-2 md:p-4 rounded-[calc(0.75rem-2px)] flex flex-col md:flex-row items-center justify-center md:justify-between gap-1 md:gap-3 ${viewMode === 'qr-orders' ? 'bg-brand-primary text-white' : 'bg-white text-slate-600'}`}>
                                <div className="flex items-center gap-2">
                                    <div className={`p-1.5 rounded-lg ${viewMode === 'qr-orders' ? 'bg-white/10' : 'bg-slate-100'}`}>
                                        <QrCode size={16} strokeWidth={2.5} />
                                    </div>
                                    <span className="font-black text-[8px] md:text-[9px] uppercase tracking-widest hidden md:inline">Live</span>
                                </div>
                                <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full ${viewMode === 'qr-orders' ? 'bg-red-500 text-white' : 'bg-slate-100 text-slate-400'} ${qrOrders.length > 0 ? 'animate-pulse' : ''}`}>
                                    {qrOrders.length}
                                </span>
                            </div>
                        </button>

                        <button
                            onClick={() => setViewMode('social-orders')}
                            className={`p-0.5 rounded-xl transition-all ${viewMode === 'social-orders' ? 'bg-indigo-600 shadow-lg scale-[1.02]' : 'bg-slate-200 hover:bg-slate-300'}`}
                        >
                            <div className={`p-2 md:p-4 rounded-[calc(0.75rem-2px)] flex flex-col md:flex-row items-center justify-center md:justify-between gap-1 md:gap-3 ${viewMode === 'social-orders' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600'}`}>
                                <div className="flex items-center gap-2">
                                    <div className={`p-1.5 rounded-lg ${viewMode === 'social-orders' ? 'bg-white/10' : 'bg-slate-100'}`}>
                                        <ExternalLink size={16} strokeWidth={2.5} />
                                    </div>
                                    <span className="font-black text-[8px] md:text-[9px] uppercase tracking-widest hidden md:inline">Social</span>
                                </div>
                                <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full ${viewMode === 'social-orders' ? 'bg-brand-accent text-brand-primary' : 'bg-slate-100 text-slate-400'} ${socialOrders.length > 0 ? 'animate-bounce' : ''}`}>
                                    {socialOrders.length}
                                </span>
                            </div>
                        </button>
                    </div>
                    {/* Category Selection Bar */}
                    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                        {categories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border-2 shadow-sm ${selectedCategory === cat
                                    ? 'bg-brand-primary text-white border-brand-primary shadow-brand-primary/20'
                                    : 'bg-white text-slate-500 border-slate-100 hover:border-slate-200'
                                    }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>

                    {/* Main Content Area */}
                    <div className="flex-1 overflow-y-auto no-scrollbar pb-6">
                        {viewMode === 'products' ? (
                            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4 pb-20">
                                {filteredProducts.map((product, index) => {
                                    const isLowStock = lowStockItems.some(item => item.product_id === product.id);
                                    return (
                                        <button
                                            key={product.id}
                                            disabled={product.stock <= 0}
                                            onClick={() => addToCart(product)}
                                            className={`premium-card group relative p-3 md:p-4 flex flex-col items-start gap-2 md:gap-4 text-left border-2 animate-fade-in hover:border-brand-primary/20 active:scale-95 transition-all ${isLowStock ? 'border-red-100 bg-red-50/30' : 'border-slate-50'}`}
                                            style={{ animationDelay: `${index * 30}ms` }}
                                        >
                                            <div className="w-full aspect-square bg-slate-100 rounded-xl flex items-center justify-center relative overflow-hidden group-hover:bg-brand-primary/5 transition-colors">
                                                <Coffee className={`transition-all duration-500 group-hover:rotate-12 group-hover:scale-110 ${isLowStock ? 'text-red-200' : 'text-slate-300'}`} size={32} md:size={48} strokeWidth={1} />
                                                <div className="absolute top-1.5 left-1.5 flex flex-col gap-1">
                                                    <span className="text-[7px] md:text-[8px] bg-white/90 backdrop-blur-sm text-slate-500 px-1.5 py-0.5 rounded-full font-black uppercase tracking-tighter border border-slate-100 shadow-sm w-fit">
                                                        {product.category}
                                                    </span>
                                                </div>
                                                <div className={`absolute bottom-1.5 right-1.5 px-2 py-0.5 rounded-md text-[7px] md:text-[10px] font-black shadow-sm ${product.stock <= 0 ? 'bg-slate-800 text-white' : isLowStock ? 'bg-red-500 text-white' : 'bg-brand-primary text-white'}`}>
                                                    {product.stock <= 0 ? 'SOLD' : `${product.stock}U`}
                                                </div>
                                            </div>
                                            <div className="w-full">
                                                <h3 className="font-black text-slate-800 leading-tight uppercase text-[10px] md:text-sm tracking-tight mb-0.5 md:mb-1 group-hover:text-brand-primary transition-colors line-clamp-1">{product.name}</h3>
                                                <div className="flex justify-between items-center md:items-end">
                                                    <span className="text-sm md:text-xl font-black text-indigo-600 tracking-tighter">₹{product.price.toFixed(0)}</span>
                                                    <Plus size={16} md:size={20} className="text-brand-accent transform group-active:scale-125 transition-transform" />
                                                </div>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        ) : viewMode === 'qr-orders' ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {qrOrders.length === 0 ? (
                                    <div className="col-span-full py-20 bg-white rounded-3xl border-2 border-dashed border-slate-100 flex flex-col items-center text-slate-300">
                                        <Clock size={48} strokeWidth={1.5} className="mb-4" />
                                        <p className="font-black uppercase tracking-[0.2em] text-xs">Waiting for customer orders</p>
                                    </div>
                                ) : qrOrders.map(order => (
                                    <OrderCard key={order.id} order={order} onUpdateStatus={updateOrderStatus} onPay={payOrder} />
                                ))}
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {socialOrders.length === 0 ? (
                                    <div className="col-span-full py-20 bg-indigo-50/30 rounded-3xl border-2 border-dashed border-indigo-100 flex flex-col items-center text-indigo-300">
                                        <ExternalLink size={48} strokeWidth={1.5} className="mb-4" />
                                        <p className="font-black uppercase tracking-[0.2em] text-xs">No pending social orders</p>
                                    </div>
                                ) : socialOrders.map(order => (
                                    <OrderCard key={order.id} order={order} onUpdateStatus={updateOrderStatus} onPay={payOrder} isSocial={true} />
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Section: Cart (Desktop: sidebar, Mobile: slide-up bottom sheet) */}
                {/* Mobile Backdrop */}
                {showMobileCart && (
                    <div
                        className="fixed inset-0 bg-slate-900/50 z-30 md:hidden backdrop-blur-sm"
                        onClick={() => setShowMobileCart(false)}
                    />
                )}

                <div className={`
                    md:w-[400px] flex flex-col gap-6 animate-scale-in
                    fixed bottom-0 left-0 right-0 z-40 md:relative md:bottom-auto md:left-auto md:right-auto md:z-auto
                    transition-transform duration-300 ease-in-out
                    ${showMobileCart ? 'translate-y-0' : 'translate-y-full md:translate-y-0'}
                `}>
                    <div className="premium-card flex-1 flex flex-col overflow-hidden border-2 border-brand-primary/5 bg-white rounded-b-none md:rounded-b-2xl h-[85vh] md:h-full">
                        {/* Mobile drag handle */}
                        <div className="md:hidden flex justify-center pt-3 pb-1 bg-brand-primary">
                            <div className="w-12 h-1.5 bg-white/20 rounded-full" />
                        </div>
                        <div className="p-4 md:p-6 bg-brand-primary text-white flex justify-between items-center">
                            <div>
                                <h2 className="text-lg md:text-xl font-black italic tracking-tighter">CART_SESSION</h2>
                                <p className="text-[8px] font-bold uppercase tracking-[0.2em] text-white/50">Smart POS Checkout</p>
                            </div>
                            <div className="flex items-center gap-2">
                                {/* Mobile close button */}
                                <button
                                    onClick={() => setShowMobileCart(false)}
                                    className="md:hidden p-2 bg-white/10 rounded-xl hover:bg-white/20 transition-all"
                                >
                                    <X size={20} />
                                </button>
                                <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center relative">
                                    <ShoppingCart size={20} strokeWidth={2.5} />
                                    {cart.length > 0 && <span className="absolute -top-1 -right-1 w-5 h-5 bg-brand-accent text-brand-primary text-[10px] font-black rounded-full flex items-center justify-center border-2 border-brand-primary">{cart.length}</span>}
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto no-scrollbar">
                            <div className="p-4 md:p-6 space-y-4 border-b border-slate-50">
                                {cart.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-slate-300 opacity-50">
                                        <ShoppingCart size={48} strokeWidth={1} className="mb-4" />
                                        <p className="font-bold text-xs uppercase tracking-widest italic">Basket is Empty</p>
                                    </div>
                                ) : cart.map((item) => (
                                    <div key={item.id} className="flex gap-4 items-center group animate-fade-in">
                                        <div className="flex-1">
                                            <h4 className="font-black text-slate-800 text-xs uppercase tracking-tight leading-none mb-1">{item.name}</h4>
                                            <div className="space-y-0.5">
                                                {item.customizations?.map(c => (
                                                    <div key={c.id} className="text-[9px] font-bold text-indigo-500 uppercase tracking-tighter">+ {c.name} (+₹{c.extra_price.toFixed(2)})</div>
                                                ))}
                                            </div>
                                            <p className="text-[10px] font-black tracking-[0.2em] mb-1">POWER HOUSE</p>
                                            <p className="text-[10px] font-bold text-slate-400 mt-1">₹{(item.price + (item.extra_price || 0)).toFixed(2)} / unit</p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="flex items-center bg-slate-50 border border-slate-100 rounded-lg p-1">
                                                <button onClick={() => updateQuantity(item.id, -1)} className="p-1 hover:bg-white hover:shadow-sm rounded-md transition-all text-slate-400"><Minus size={12} strokeWidth={3} /></button>
                                                <span className="w-6 text-center font-black text-xs text-brand-primary">{item.quantity}</span>
                                                <button onClick={() => updateQuantity(item.id, 1)} className="p-1 hover:bg-white hover:shadow-sm rounded-md transition-all text-slate-400"><Plus size={12} strokeWidth={3} /></button>
                                            </div>
                                            <button onClick={() => removeFromCart(item.id)} className="text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Static Billing Section */}
                        <div className="p-4 md:p-6 bg-slate-50 border-t border-slate-200 space-y-4 shadow-[0_-10px_20px_rgba(0,0,0,0.02)] z-10">
                            <div className="grid grid-cols-2 gap-2">
                                <div className="relative group">
                                    <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-brand-primary transition-colors" size={14} />
                                    <input type="text" placeholder="PHONE" className="w-full pl-9 pr-2 py-2 bg-white border border-slate-100 rounded-xl text-[10px] font-black placeholder:text-slate-300 outline-none focus:border-brand-primary transition-all shadow-inner uppercase" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} />
                                </div>
                                <div className="relative group">
                                    <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-brand-primary transition-colors" size={14} />
                                    <input type="text" placeholder="NAME" className="w-full pl-9 pr-2 py-2 bg-white border border-slate-100 rounded-xl text-[10px] font-black placeholder:text-slate-300 outline-none focus:border-brand-primary transition-all shadow-inner uppercase" value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
                                </div>
                            </div>

                            <div className="space-y-3 pt-1">
                                <div className="flex gap-2">
                                    {['cash', 'card', 'upi'].map(m => (
                                        <button
                                            key={m}
                                            onClick={() => setPaymentMethod(m)}
                                            className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border-2 ${paymentMethod === m
                                                ? (m === 'cash' ? 'bg-emerald-500 text-white border-emerald-600' : m === 'card' ? 'bg-blue-500 text-white border-blue-600' : 'bg-purple-500 text-white border-purple-600')
                                                : 'bg-white text-slate-400 border-slate-100 hover:border-slate-200'}`}
                                        >
                                            {m}
                                        </button>
                                    ))}
                                </div>

                                {paymentMethod === 'upi' && (
                                    <div className="animate-scale-in p-3 bg-white border-2 border-purple-100 rounded-2xl shadow-xl shadow-purple-900/5 overflow-hidden group">
                                        <div className="flex flex-col items-center gap-2">
                                            <img
                                                src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent('upi://pay?pa=9092330688@pthdfc&pn=Power House&cu=INR')}`}
                                                alt="UPI QR Payment"
                                                className="w-24 h-24 rounded-lg shadow-lg border-2 border-white"
                                            />
                                            <p className="text-[8px] font-black text-purple-600 uppercase tracking-widest">Scan to Pay</p>
                                        </div>
                                    </div>
                                )}

                                <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
                                    <span>Subtotal</span>
                                    <span>₹{calculateTotal().toFixed(2)}</span>
                                </div>

                                {paymentMethod === 'cash' && (
                                    <div className="space-y-2">
                                        <div className="flex gap-1">
                                            {[100, 200, 500, 2000].map(note => (
                                                <button key={note} onClick={() => setAmountReceived(note.toString())} className="flex-1 py-1 bg-white border border-slate-100 rounded-lg text-[9px] font-black hover:bg-slate-50 transition-colors">₹{note}</button>
                                            ))}
                                        </div>
                                        <input type="number" placeholder="CASH RECEIVED" className="w-full px-4 py-2 bg-white border border-slate-100 rounded-xl text-[10px] font-black outline-none focus:border-brand-primary" value={amountReceived} onChange={(e) => setAmountReceived(e.target.value)} />
                                        {parseFloat(amountReceived) >= (calculateTotal() - (applyAiOffer ? (calculateTotal() * (activeAiOffer.discount_pct / 100)) : 0) - parseFloat(manualDiscount || 0)) && (
                                            <div className="flex justify-between text-xs font-black text-emerald-600 italic tracking-tighter bg-emerald-50 p-2 rounded-xl">
                                                <span>Change Due</span>
                                                <span>₹{(parseFloat(amountReceived) - (calculateTotal() - (applyAiOffer ? (calculateTotal() * (activeAiOffer.discount_pct / 100)) : 0) - parseFloat(manualDiscount || 0))).toFixed(2)}</span>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* OFFERS Header/Button */}
                                <div className="pt-2 border-t border-slate-100/50">
                                    <button
                                        onClick={() => setShowOffers(!showOffers)}
                                        className={`w-full p-3 rounded-xl border-2 transition-all flex items-center justify-between group ${showOffers ? 'bg-indigo-600 border-indigo-700 text-white shadow-lg shadow-indigo-600/20' : 'bg-white border-slate-100 text-slate-500 hover:border-slate-200'}`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`p-1.5 rounded-lg ${showOffers ? 'bg-white/20' : 'bg-brand-primary text-white'}`}>
                                                <Tag size={16} strokeWidth={2.5} />
                                            </div>
                                            <span className="text-[11px] font-black uppercase tracking-[0.1em]">Select Offers & Discounts</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {(applyAiOffer || manualDiscount > 0) && !showOffers && (
                                                <span className="bg-emerald-500 text-white text-[8px] font-black px-2 py-0.5 rounded-full animate-pulse">APPLIED</span>
                                            )}
                                            <ChevronDown size={16} className={`transition-transform duration-300 ${showOffers ? 'rotate-180' : ''}`} />
                                        </div>
                                    </button>

                                    {showOffers && (
                                        <div className="mt-3 space-y-3 animate-fade-in bg-white p-4 rounded-2xl border border-slate-100 shadow-inner">
                                            {activeAiOffer && (
                                                <div className={`p-3 rounded-xl border-2 transition-all cursor-pointer flex items-center justify-between ${applyAiOffer ? 'bg-amber-50 border-amber-200' : 'bg-white border-slate-50 hover:border-slate-100'}`}
                                                    onClick={() => setApplyAiOffer(!applyAiOffer)}>
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${applyAiOffer ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/30' : 'bg-slate-50 text-slate-400'}`}>
                                                            <ChefHat size={20} />
                                                        </div>
                                                        <div>
                                                            <p className="text-[10px] font-black text-slate-800 uppercase leading-none">AI Crisis Deal</p>
                                                            <p className="text-[8px] font-bold text-amber-500 uppercase tracking-tighter mt-1 italic">{activeAiOffer.discount_pct}% OFF Automatically</p>
                                                        </div>
                                                    </div>
                                                    <div className={`w-10 h-5 rounded-full transition-all relative ${applyAiOffer ? 'bg-amber-500' : 'bg-slate-200'}`}>
                                                        <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${applyAiOffer ? 'left-6' : 'left-1'}`} />
                                                    </div>
                                                </div>
                                            )}

                                            <div className="relative group">
                                                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-brand-primary transition-colors" size={14} />
                                                <input
                                                    type="number"
                                                    placeholder="CUSTOM DISCOUNT (₹)"
                                                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-black outline-none focus:bg-white focus:border-brand-primary transition-all shadow-inner"
                                                    value={manualDiscount}
                                                    onChange={(e) => setManualDiscount(e.target.value)}
                                                />
                                            </div>

                                            <button
                                                onClick={() => setShowOffers(false)}
                                                className="w-full py-2 bg-slate-800 text-white text-[9px] font-black uppercase tracking-widest rounded-lg hover:bg-slate-900 transition-colors"
                                            >
                                                Done Selection
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <div className="flex justify-between text-2xl font-black text-brand-primary italic tracking-tighter pt-1 border-t border-slate-100">
                                    <span>TOTAL</span>
                                    <span>₹{(calculateTotal() - (applyAiOffer ? (calculateTotal() * (activeAiOffer.discount_pct / 100)) : 0) - parseFloat(manualDiscount || 0)).toFixed(2)}</span>
                                </div>

                                <button
                                    onClick={handleCheckout}
                                    disabled={cart.length === 0 || isCheckingOut}
                                    className="w-full bg-brand-primary text-white py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-brand-secondary active:scale-[0.98] transition-all shadow-xl shadow-brand-primary/20 disabled:opacity-40"
                                >
                                    {isCheckingOut ? <span className="animate-pulse">PROCESSING...</span> : <><ShoppingBag size={18} /> PROCEED TO CHECKOUT</>}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {checkoutResult && (
                <div className="premium-card p-5 bg-emerald-600/90 backdrop-blur-xl text-white flex flex-col gap-5 animate-scale-in border-none shadow-[0_20px_50px_rgba(16,185,129,0.3)]">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-2 bg-white/20 rounded-xl mb-auto">
                                <CheckCircle size={28} className="text-white" />
                            </div>
                            <div className="flex-1">
                                <p className="font-black text-[10px] uppercase tracking-[0.3em] text-emerald-100">ORDER_CONFIRMED</p>
                                <h3 className="text-lg font-black italic tracking-tighter">Order #{checkoutResult.id} processed.</h3>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mt-2">
                        <button
                            onClick={handleDownloadReceipt}
                            className="bg-white/10 hover:bg-white/20 text-white border border-white/20 py-3 rounded-xl font-black text-[9px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all"
                        >
                            <Package size={14} /> RECEIPT (PDF)
                        </button>
                        {checkoutResult.whatsapp_url && (
                            <button
                                onClick={() => window.open(checkoutResult.whatsapp_url, '_blank')}
                                className="bg-emerald-500 hover:bg-emerald-400 text-white py-3 rounded-xl font-black text-[9px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-900/20 border border-emerald-400/30"
                            >
                                <MessageSquare size={14} /> WHATSAPP
                            </button>
                        )}
                    </div>

                    <button
                        onClick={() => setCheckoutResult(null)}
                        className="w-full mt-2 py-4 bg-slate-900/40 hover:bg-slate-900/60 text-white rounded-xl font-black text-[10px] uppercase tracking-[0.2em] transition-all border border-white/5"
                    >
                        START NEW SALE
                    </button>
                </div>
            )}
            {/* Floating Cart Button for Mobile */}
            {!showMobileCart && (
                <button
                    className="md:hidden fixed bottom-20 right-4 z-40 bg-brand-primary text-white w-16 h-16 rounded-full shadow-2xl shadow-brand-primary/40 flex flex-col items-center justify-center gap-0.5 active:scale-95 transition-transform"
                    onClick={() => setShowMobileCart(true)}
                >
                    <ShoppingCart size={22} strokeWidth={2.5} />
                    {cart.length > 0 && (
                        <span className="absolute -top-1 -right-1 w-6 h-6 bg-brand-accent text-brand-primary text-xs font-black rounded-full flex items-center justify-center shadow-lg">
                            {cart.length}
                        </span>
                    )}
                    {cart.length > 0 && (
                        <span className="text-[8px] font-black uppercase tracking-tighter">Cart</span>
                    )}
                </button>
            )}

            {/* Hidden Receipt Template */}
            <div style={{ position: 'fixed', top: '100%', left: 0, opacity: 0, pointerEvents: 'none' }}>
                <div ref={receiptRef} style={{ width: '80mm', backgroundColor: 'white', padding: '32px', color: '#1e293b', fontFamily: 'sans-serif' }}>
                    <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                        <h1 style={{ fontSize: '24px', fontWeight: '900', fontStyle: 'italic', letterSpacing: '-0.05em', color: '#6366f1', margin: 0 }}>POWER HOUSE</h1>
                        <p style={{ fontSize: '8px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.2em', color: '#94a3b8', margin: '4px 0 0 0' }}>Smart. Simple. Scalable.</p>
                    </div>
                    <div style={{ borderTop: '2px solid #f1f5f9', borderBottom: '2px solid #f1f5f9', padding: '16px 0', marginBottom: '16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', fontWeight: '700' }}>
                            <span style={{ color: '#94a3b8' }}>Receipt #</span>
                            <span>{checkoutResult?.id}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', fontWeight: '700' }}>
                            <span style={{ color: '#94a3b8' }}>Date</span>
                            <span>{new Date().toLocaleString()}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', fontWeight: '700' }}>
                            <span style={{ color: '#94a3b8' }}>Payment Method</span>
                            <span style={{ textTransform: 'uppercase' }}>{checkoutResult?.payment_method}</span>
                        </div>
                    </div>
                    <div style={{ marginBottom: '24px' }}>
                        {checkoutResult?.items?.map((item, idx) => (
                            <div key={idx} style={{ marginBottom: '16px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: '900' }}>
                                    <span>{item.name} x{item.quantity}</span>
                                    <span>₹{(item.price * item.quantity).toFixed(2)}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div style={{ borderTop: '2px solid #f1f5f9', paddingTop: '16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', fontWeight: '700', color: '#94a3b8', marginBottom: '4px' }}>
                            <span>SUBTOTAL</span>
                            <span>₹{(checkoutResult?.orderSubtotal || 0).toFixed(2)}</span>
                        </div>
                        {checkoutResult?.discount_amount > 0 && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', fontWeight: '900', color: '#ef4444', marginBottom: '8px' }}>
                                <span>DISCOUNT ({checkoutResult.discount_reason || 'AI Offer'})</span>
                                <span>-₹{checkoutResult.discount_amount.toFixed(2)}</span>
                            </div>
                        )}
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '18px', fontWeight: '900', color: '#6366f1' }}>
                            <span>TOTAL</span>
                            <span>₹{(checkoutResult?.total_amount || 0).toFixed(2)}</span>
                        </div>
                    </div>
                    {checkoutResult?.payment_method === 'cash' && (
                        <div style={{ marginTop: '8px', borderTop: '1px dashed #e2e8f0', paddingTop: '8px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', fontWeight: '700', color: '#64748b' }}>
                                <span>Amount Received</span>
                                <span>₹{(checkoutResult?.amount_received || 0).toFixed(2)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: '900', color: '#059669', marginTop: '4px' }}>
                                <span>Balance to Give</span>
                                <span>₹{(checkoutResult?.change_amount || 0).toFixed(2)}</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {customizingProduct && (
                <CustomizationModal
                    product={customizingProduct}
                    onClose={() => setCustomizingProduct(null)}
                    onAdd={addToCart}
                />
            )}
        </div>
    );
};

export default POS;
