import React, { useState, useEffect, useRef } from 'react';
import { TrendingUp, ShoppingBag, Users, Zap, ArrowUpRight, MessageSquare, BarChart3, Video, VideoOff, Search, Coffee, PlayCircle, StopCircle, RefreshCw, ShoppingCart } from 'lucide-react';
import api from '../services/api';
import { toast } from 'react-hot-toast';

const SocialDashboard = () => {
    const [stats, setStats] = useState({
        total_live_sales: 0,
        live_order_count: 0
    });
    const [recentOrders, setRecentOrders] = useState([]);
    const [viewerCount, setViewerCount] = useState(1243);
    const [isLive, setIsLive] = useState(false);
    const [streamStatus, setStreamStatus] = useState(null);
    const [products, setProducts] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isToggling, setIsToggling] = useState(false);
    const socket = useRef(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [statsRes, ordersRes, statusRes, productsRes] = await Promise.all([
                    api.get('/live-commerce/stats'),
                    api.get('/live-commerce/recent-orders'),
                    api.get('/live-commerce/status'),
                    api.get('/products')
                ]);
                setStats(statsRes.data);
                setRecentOrders(ordersRes.data);
                setIsLive(statusRes.data.is_live);
                setStreamStatus(statusRes.data);
                setProducts(productsRes.data);
            } catch (err) {
                console.error('Failed to fetch dashboard data');
            }
        };
        fetchData();

        const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        socket.current = new WebSocket(`${wsProtocol}//${window.location.host}/ws/live-commerce`);
        socket.current.onmessage = (event) => {
            const msg = JSON.parse(event.data);
            if (msg.type === 'NEW_ORDER') {
                setStats({
                    total_live_sales: msg.data.live_stats.total,
                    live_order_count: msg.data.live_stats.count
                });
                setRecentOrders(prev => [msg.data, ...prev].slice(0, 5));
                setViewerCount(v => v + Math.floor(Math.random() * 10));
            } else if (msg.type === 'STREAM_STATUS') {
                setIsLive(msg.data.is_live);
            }
        };

        return () => socket.current.close();
    }, []);

    const toggleLiveSession = async () => {
        setIsToggling(true);
        try {
            const res = await api.post(`/live-commerce/toggle-live?is_live=${!isLive}`);
            setIsLive(res.data.is_live);
            toast.success(res.data.is_live ? 'Streaming is now LIVE!' : 'Stream ended successfully');

            const statusRes = await api.get('/live-commerce/status');
            setStreamStatus(statusRes.data);
        } catch (err) {
            toast.error('Failed to change stream status');
        } finally {
            setIsToggling(false);
        }
    };

    const featureProduct = async (productId) => {
        toast.loading('Updating spotlight...', { id: 'spotlight' });
        try {
            await api.post(`/live-commerce/feature-product?product_id=${productId}`);
            toast.success('Audience view updated!', { id: 'spotlight' });

            const statusRes = await api.get('/live-commerce/status');
            setStreamStatus(statusRes.data);
            setSearchQuery('');
        } catch (err) {
            toast.error('Failed to feature product', { id: 'spotlight' });
        }
    };

    return (
        <div className="p-8 space-y-8 animate-fade-in bg-slate-50 min-h-screen">
            <SocialHeader
                isLive={isLive}
                toggleLiveSession={toggleLiveSession}
                isToggling={isToggling}
                streamStatus={streamStatus}
                products={products}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                featureProduct={featureProduct}
            />

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard
                    title="Live Sales"
                    value={`₹${stats.total_live_sales.toFixed(2)}`}
                    icon={<TrendingUp className="text-amber-500" />}
                    trend="+12.5%"
                />
                <MetricCard
                    title="Orders Placed"
                    value={stats.live_order_count}
                    icon={<ShoppingBag className="text-indigo-600" />}
                    trend="+5 today"
                />
                <MetricCard
                    title="Current Viewers"
                    value={viewerCount.toLocaleString()}
                    icon={<Users className="text-blue-500" />}
                    trend="Peak: 2.1k"
                />
                <MetricCard
                    title="Conversion Rate"
                    value={viewerCount > 0 ? `${((stats.live_order_count / viewerCount) * 100).toFixed(1)}%` : '0%'}
                    icon={<Zap className="text-purple-500" />}
                    trend="High"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Live Order Feed */}
                <div className="lg:col-span-2 premium-card p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold flex items-center gap-2 font-black italic tracking-tighter text-slate-800 uppercase">
                            <MessageSquare size={20} className="text-indigo-600" fill="currentColor" />
                            Engagement Stream
                        </h2>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Real-time Orders</span>
                    </div>

                    <div className="space-y-4">
                        {recentOrders.length === 0 ? (
                            <div className="text-center py-20 text-slate-400 font-medium bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-100 flex flex-col items-center">
                                <RefreshCw className="animate-spin mb-4" size={32} />
                                <span className="text-[10px] font-black uppercase tracking-[0.2em]">Waiting for customers to order...</span>
                            </div>
                        ) : (
                            recentOrders.map((order, idx) => (
                                <div key={idx} className="flex items-center justify-between p-5 bg-white rounded-2xl border border-slate-100 hover:border-indigo-100 hover:shadow-md transition-all animate-fade-in-up">
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 bg-indigo-50 rounded-xl flex items-center justify-center text-2xl shadow-inner">
                                            📦
                                        </div>
                                        <div>
                                            <div className="font-black text-slate-900 uppercase text-sm tracking-tight">{order.customer}</div>
                                            <div className="text-[10px] font-black text-indigo-500 uppercase flex items-center gap-2 mt-1">
                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                                Live Sale • #{order.id}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-black text-slate-900 text-lg tracking-tighter italic">₹{order.amount.toFixed(2)}</div>
                                        <div className="text-[8px] font-black uppercase text-slate-400 tracking-widest mt-1">Payment Pending</div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Performance Chart Mock */}
                <div className="premium-card p-6 flex flex-col">
                    <h2 className="text-xl font-bold mb-6 flex items-center gap-2 font-black italic tracking-tighter text-slate-800 uppercase">
                        <BarChart3 size={20} className="text-indigo-600" fill="currentColor" />
                        Conversion Flow
                    </h2>
                    <div className="flex-1 flex items-end gap-2 px-2 pb-6">
                        {[40, 70, 45, 90, 65, 80, 50, 85, 60, 95].map((h, i) => (
                            <div
                                key={i}
                                className="flex-1 bg-gradient-to-t from-indigo-600 to-indigo-400 rounded-t-lg transition-all duration-500 hover:from-amber-500 hover:to-amber-400 cursor-pointer group relative"
                                style={{ height: `${h}%` }}
                            >
                                <div className="hidden group-hover:block absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] px-2 py-1 rounded-lg font-black italic">
                                    {h}%
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="flex justify-between mt-auto pt-4 border-t border-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">
                        <span>18:00</span>
                        <span>18:30</span>
                        <span>19:00</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

const SocialHeader = ({ isLive, toggleLiveSession, isToggling, streamStatus, products, searchQuery, setSearchQuery, featureProduct }) => (
    <div className="space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
            <div>
                <h1 className="text-4xl font-black text-slate-900 tracking-tighter italic">SOCIAL COMMERCE</h1>
                <p className="text-slate-400 font-bold text-xs uppercase tracking-[0.3em] mt-1">Live Shopping & Engagement Hub</p>
            </div>
            <div className={`flex items-center gap-3 px-6 py-3 rounded-2xl border-2 transition-all shadow-lg ${isLive ? 'bg-red-50 border-red-200 text-red-600 animate-pulse' : 'bg-slate-100 border-slate-200 text-slate-400'}`}>
                {isLive ? <Video size={20} /> : <VideoOff size={20} />}
                <span className="text-sm font-black uppercase tracking-widest">{isLive ? 'Session Active' : 'Stream Offline'}</span>
            </div>
        </div>

        {/* Live Control Center */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            <div className="xl:col-span-2 premium-card p-8 border-2 border-indigo-50 relative overflow-hidden group min-h-[220px]">
                <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:rotate-12 transition-transform duration-700 pointer-events-none">
                    <PlayCircle size={150} />
                </div>

                <div className="relative z-10 flex flex-col md:flex-row gap-8 justify-between h-full">
                    <div className="flex-1 space-y-6">
                        <div>
                            <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight flex items-center gap-3">
                                <Zap className="text-indigo-600" fill="currentColor" size={24} />
                                Live Launchpad
                            </h2>
                            <p className="text-slate-500 text-sm font-medium mt-1">Control your live shopping experience and feature products.</p>
                        </div>

                        <div className="flex flex-wrap gap-4">
                            <button
                                onClick={toggleLiveSession}
                                disabled={isToggling}
                                className={`px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-sm transition-all flex items-center gap-2 shadow-xl active:scale-95 ${isLive ? 'bg-slate-900 text-white hover:bg-black' : 'bg-red-600 text-white hover:bg-red-700 shadow-red-200'}`}
                            >
                                {isToggling ? <RefreshCw className="animate-spin" size={20} /> : (isLive ? <StopCircle size={20} /> : <Video size={20} />)}
                                {isLive ? 'End Session' : 'Go Live Now'}
                            </button>

                            {isLive && (
                                <div className="flex items-center gap-3 bg-indigo-50 px-4 py-2 rounded-2xl border border-indigo-100">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                    <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Broadcasting Live</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="w-full md:w-80 bg-slate-50 rounded-3xl p-6 border border-slate-100 shadow-inner flex flex-col">
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Current Spotlight</h3>
                        {streamStatus?.featured_product ? (
                            <div className="space-y-4 animate-scale-in flex-1 flex flex-col justify-center">
                                <div className="flex items-center gap-4 bg-white p-3 rounded-2xl border border-indigo-100 shadow-sm transition-all hover:scale-105">
                                    <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 text-2xl">
                                        ☕
                                    </div>
                                    <div>
                                        <p className="font-black text-slate-800 text-[10px] uppercase leading-none truncate w-32">{streamStatus.featured_product.name}</p>
                                        <p className="text-indigo-600 font-bold text-[10px] mt-1 italic">₹{streamStatus.featured_product.price.toFixed(0)} - ACTIVE</p>
                                    </div>
                                </div>
                                <p className="text-[8px] text-slate-400 font-black uppercase text-center tracking-widest">Choose another product to switch</p>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-8 text-slate-300 opacity-50 flex-1">
                                <ShoppingCart size={40} strokeWidth={1} />
                                <p className="text-[10px] font-black uppercase mt-2 tracking-widest">No Featured Item</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="premium-card p-8 border-2 border-slate-50 flex flex-col h-full">
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Search size={16} />
                    Feature Product
                </h3>

                <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                    <input
                        type="text"
                        placeholder="Promote something..."
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold outline-none focus:bg-white focus:border-indigo-600 transition-all shadow-inner"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <div className="flex-1 overflow-y-auto space-y-1 max-h-[140px] no-scrollbar">
                    {products
                        .filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
                        .slice(0, 10)
                        .map(product => (
                            <button
                                key={product.id}
                                onClick={() => featureProduct(product.id)}
                                className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 transition-colors group text-left"
                            >
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all scale-90">
                                        <Coffee size={16} />
                                    </div>
                                    <span className="text-[10px] font-bold text-slate-700 uppercase line-clamp-1">{product.name}</span>
                                </div>
                                <span className="text-[9px] font-black text-indigo-500 italic">₹{product.price.toFixed(0)}</span>
                            </button>
                        ))}
                </div>
            </div>
        </div>
    </div>
);

const MetricCard = ({ title, value, icon, trend }) => (
    <div className="premium-card p-6 group cursor-default">
        <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-slate-50 rounded-xl group-hover:bg-white transition-colors">
                {icon}
            </div>
            <span className="text-xs font-bold text-green-600 flex items-center gap-1 bg-green-50 px-2 py-1 rounded-lg">
                <ArrowUpRight size={12} />
                {trend}
            </span>
        </div>
        <h3 className="text-slate-500 font-bold text-sm uppercase tracking-wider">{title}</h3>
        <div className="text-3xl font-black text-slate-900 mt-1">{value}</div>
    </div>
);

export default SocialDashboard;
