import React, { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Heart, MessageCircle, Share2, ShoppingCart, Users, Zap, MapPin, VideoOff, Send, Video, MapPinOff, ShieldCheck } from 'lucide-react';
import api from '../services/api';
import { toast } from 'react-hot-toast';

const LiveStream = () => {
    const { branchId = 1 } = useParams();
    const [searchParams] = useSearchParams();
    const qrCode = searchParams.get('qr');
    const [viewers] = useState(1243);
    const [likes, setLikes] = useState(8500);
    const [comments, setComments] = useState([
        { id: 1, user: 'CoffeeLover', text: 'That latte art is insane! 😍' },
        { id: 2, user: 'MorningBrew', text: 'Need one of those right now.' },
        { id: 3, user: 'AlexJ', text: 'Is the caramel macchiato available?' }
    ]);
    const [newComment, setNewComment] = useState('');
    const [soldCount, setSoldCount] = useState(0);
    const [isOrdering, setIsOrdering] = useState(false);
    const [products, setProducts] = useState([]);
    const [featuredProduct, setFeaturedProduct] = useState(null);
    const [isStreamLive, setIsStreamLive] = useState(false);
    const [location, setLocation] = useState(null);
    const [geoError, setGeoError] = useState(null);

    // Mock products fallback
    const mockProducts = [
        { id: 1, name: 'Premium Espresso', price: 4.50 },
        { id: 2, name: 'Cloud Caramel Latte', price: 5.95 }
    ];

    const socket = useRef(null);

    // Get location on mount for Geo-Fencing
    useEffect(() => {
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    setLocation({
                        lat: pos.coords.latitude,
                        lng: pos.coords.longitude
                    });
                    setGeoError(null);
                    console.log('Location synchronized for geo-fencing');
                },
                (err) => {
                    setGeoError(err.message);
                    console.warn('Geolocation failed:', err.message);
                },
                { enableHighAccuracy: true }
            );
        }
    }, []);

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const res = await api.get(`/products/public/${branchId}`);
                setProducts(res.data.length > 0 ? res.data : mockProducts);
            } catch (err) {
                setProducts(mockProducts);
            }
        };

        const fetchInitialData = async () => {
            try {
                const [statsRes, statusRes] = await Promise.all([
                    api.get('/live-commerce/stats'),
                    api.get('/live-commerce/status')
                ]);
                setSoldCount(statsRes.data.live_order_count);
                setIsStreamLive(statusRes.data.is_live);
                if (statusRes.data.featured_product) {
                    setFeaturedProduct(statusRes.data.featured_product);
                }
            } catch (err) {
                console.error('Failed to fetch initial stream data');
            }
        };

        fetchProducts();
        fetchInitialData();

        const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        socket.current = new WebSocket(`${wsProtocol}//${window.location.host}/ws/live-commerce`);
        socket.current.onmessage = (event) => {
            const msg = JSON.parse(event.data);
            if (msg.type === 'NEW_ORDER') {
                setSoldCount(msg.data.live_stats.count);
                setComments(prev => [...prev.slice(-8), {
                    id: Date.now(),
                    user: 'System',
                    text: `🔥 ${msg.data.customer} just ordered!`,
                    isSystem: true
                }]);
            } else if (msg.type === 'FEATURE_UPDATE') {
                setFeaturedProduct(msg.data);
                toast.success(`Host featured: ${msg.data.name}`, {
                    icon: '✨',
                    style: { borderRadius: '1rem', background: '#1e1b4b', color: '#fff' }
                });
            } else if (msg.type === 'STREAM_STATUS') {
                setIsStreamLive(msg.data.is_live);
                if (!msg.data.is_live) setFeaturedProduct(null);
            }
        };

        return () => socket.current.close();
    }, [branchId]);

    const handleLike = () => setLikes(prev => prev + 1);

    const handleComment = (e) => {
        e.preventDefault();
        if (!newComment.trim()) return;
        setComments(prev => [...prev.slice(-8), { id: Date.now(), user: 'You', text: newComment }]);
        setNewComment('');
    };

    const placeOrder = async (productId) => {
        setIsOrdering(true);
        try {
            const product = products.find(p => p.id === productId) || products[0];

            // Geo-Fencing Check
            let finalPos = location;
            if (!finalPos && qrCode !== 'CAFE_SPECIAL') {
                try {
                    const pos = await new Promise((resolve, reject) => {
                        navigator.geolocation.getCurrentPosition(resolve, reject);
                    });
                    finalPos = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                    setLocation(finalPos);
                } catch (err) {
                    toast.error('Geo-Fencing: Location required to verify store proximity');
                    setIsOrdering(false);
                    return;
                }
            }

            await api.post('/live-commerce/order', {
                items: [{ product_id: product.id, quantity: 1 }],
                customer_name: 'Live Viewer',
                branch_id: parseInt(branchId),
                latitude: finalPos?.lat,
                longitude: finalPos?.lng,
                qr_access_code: qrCode
            });
            toast.success(`Order Placed: ${product.name}!`);
        } catch (err) {
            const errorMsg = err.response?.data?.detail || 'Order failed';
            toast.error(errorMsg, { duration: 4000 });
        } finally {
            setIsOrdering(false);
        }
    };

    const currentFeaturedProduct = featuredProduct || products[0] || mockProducts[0];

    return (
        <div className="relative h-screen w-full bg-black overflow-hidden flex items-center justify-center font-sans antialiased text-white">
            {/* Live Feed Mock */}
            <div className="absolute inset-0 z-0">
                <div className="w-full h-full bg-slate-900 flex items-center justify-center">
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/60 z-10" />
                    <img
                        src="https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&q=80&w=2070"
                        className="w-full h-full object-cover opacity-60"
                        alt="Stream"
                    />
                </div>
            </div>

            {/* Header Overlay */}
            <div className="absolute top-0 left-0 right-0 p-6 z-20 flex justify-between items-start">
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                        <div className="bg-red-600 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest animate-pulse border border-red-500/50 shadow-lg shadow-red-500/20">
                            Live
                        </div>
                        <div className="bg-black/30 backdrop-blur-xl px-3 py-1 rounded-lg flex items-center gap-2 border border-white/10">
                            <Users size={14} className="text-blue-400" />
                            <span className="text-xs font-black">{viewers.toLocaleString()}</span>
                        </div>
                    </div>
                    {/* Geo-Fencing Badge */}
                    <div className={`flex items-center gap-2 px-3 py-1 rounded-lg border text-[10px] font-black uppercase tracking-widest backdrop-blur-md transition-all ${location ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-amber-500/10 border-amber-500/30 text-amber-400'}`}>
                        {location ? <ShieldCheck size={12} /> : <MapPinOff size={12} />}
                        {location ? 'Geo-Verified Area' : 'Detecting Location...'}
                    </div>
                </div>

                <div className="bg-indigo-600/90 backdrop-blur-xl px-5 py-3 rounded-2xl flex items-center gap-3 border border-indigo-400/30 shadow-2xl animate-fade-in shadow-indigo-500/20">
                    <Zap size={20} className="text-amber-400 fill-amber-400" />
                    <div>
                        <div className="text-[9px] uppercase font-black text-indigo-200 tracking-widest leading-none">Flash Sales</div>
                        <div className="text-xl font-black leading-none mt-1">{soldCount}</div>
                    </div>
                </div>
            </div>

            {/* Offline Shield */}
            {!isStreamLive && (
                <div className="absolute inset-0 z-40 bg-slate-950/90 backdrop-blur-xl flex items-center justify-center p-8 text-center animate-fade-in">
                    <div className="max-w-xs space-y-6">
                        <div className="w-24 h-24 bg-slate-900 rounded-[2.5rem] flex items-center justify-center mx-auto border border-slate-800 shadow-2xl">
                            <VideoOff size={40} className="text-slate-600" />
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-3xl font-black italic tracking-tighter uppercase">Signal Lost</h2>
                            <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">The host is preparing the next brew. Stay tuned.</p>
                        </div>
                        <div className="pt-4">
                            <button className="w-full bg-indigo-600 py-4 rounded-2xl font-black uppercase tracking-[0.2em] text-xs shadow-xl shadow-indigo-900/40 active:scale-95 transition-all">
                                Get Notified
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Interaction Layer */}
            <div className="absolute inset-0 z-10 flex flex-col justify-end p-6 gap-6 pointer-events-none">
                {/* Chat Feed */}
                <div className="flex flex-col gap-3 max-w-[85%] pointer-events-auto overflow-hidden">
                    <div className="space-y-2 max-h-48 overflow-y-auto no-scrollbar">
                        {comments.map((c) => (
                            <div key={c.id} className={`flex gap-3 items-start animate-fade-in-up ${c.isSystem ? 'bg-indigo-500/10 p-2 rounded-xl border border-indigo-500/20' : ''}`}>
                                <span className={`text-[10px] font-black uppercase tracking-widest mt-0.5 ${c.isSystem ? 'text-indigo-400' : 'text-amber-400'}`}>{c.user}</span>
                                <span className="text-sm font-medium text-slate-100/90 leading-tight">{c.text}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Bottom Console */}
                <div className="space-y-4">
                    {/* Featured Product Overlay */}
                    <div className="pointer-events-auto bg-white rounded-[2rem] p-4 flex items-center justify-between shadow-2xl animate-scale-in text-slate-900 border border-slate-100">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-3xl shadow-inner border border-slate-100">
                                ☕
                            </div>
                            <div>
                                <div className="flex items-center gap-1.5 mb-1">
                                    <div className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />
                                    <span className="text-[10px] font-black text-red-600 uppercase tracking-widest">In Stock Now</span>
                                </div>
                                <h3 className="font-black text-lg leading-none uppercase italic tracking-tighter truncate w-32 md:w-auto">{currentFeaturedProduct.name}</h3>
                                <p className="text-xl font-black text-slate-900 mt-1 italic tracking-tighter">₹{currentFeaturedProduct.price.toFixed(2)}</p>
                            </div>
                        </div>
                        <button
                            onClick={() => placeOrder(currentFeaturedProduct.id)}
                            disabled={isOrdering}
                            className="bg-slate-950 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center gap-2 hover:bg-black active:scale-95 transition-all shadow-xl disabled:opacity-50"
                        >
                            {isOrdering ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <ShoppingCart size={18} />}
                            {isOrdering ? 'Securing...' : 'Claim Offer'}
                        </button>
                    </div>

                    {/* Inputs */}
                    <div className="flex items-center gap-4 pointer-events-auto">
                        <form onSubmit={handleComment} className="flex-1 relative group">
                            <input
                                type="text"
                                className="w-full bg-white/10 backdrop-blur-2xl border border-white/20 rounded-2xl px-6 py-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:bg-white/20 transition-all placeholder:text-white/30"
                                placeholder="Message host..."
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                            />
                            <button className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 group-focus-within:text-indigo-400 transition-colors">
                                <Send size={18} />
                            </button>
                        </form>
                        <div className="flex gap-3">
                            <button onClick={handleLike} className="w-14 h-14 bg-white/10 backdrop-blur-2xl border border-white/20 rounded-2xl flex flex-col items-center justify-center hover:bg-white/20 active:scale-90 transition-all group">
                                <Heart size={20} className="group-hover:text-pink-500 group-hover:fill-pink-500 transition-all" />
                                <span className="text-[10px] font-black mt-1 text-white/60">{likes > 1000 ? (likes / 1000).toFixed(1) + 'k' : likes}</span>
                            </button>
                            <button className="w-14 h-14 bg-white/10 backdrop-blur-2xl border border-white/20 rounded-2xl flex items-center justify-center hover:bg-white/20 active:scale-90 transition-all">
                                <Share2 size={20} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LiveStream;
