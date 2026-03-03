import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { Send, Bot, User, X, MessageSquare, Loader2, BarChart3, TrendingUp, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useChat } from '../context/ChatContext';

const AssistantChat = () => {
    const { isChatOpen, closeChat } = useChat();
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [metrics, setMetrics] = useState(null);
    const scrollRef = useRef(null);

    const quickSuggestions = [
        "How are sales today?",
        "Any low stock alerts?",
        "Main Branch performance",
        "Analyze business health",
        "Profit margins",
        "What can you do?"
    ];

    useEffect(() => {
        if (isChatOpen && messages.length === 0) {
            fetchHistory();
        }
    }, [isChatOpen]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const fetchHistory = async () => {
        try {
            const response = await api.get('/assistant/history');
            setMessages(response.data);
            if (response.data.length === 0) {
                setMessages([{
                    id: 0,
                    role: 'assistant',
                    content: 'Hello! I am your AI Business Assistant. I can help you analyze sales, inventory, and branch performance. How can I assist you today?',
                    timestamp: new Date().toISOString()
                }]);
            }
        } catch (error) {
            console.error('Failed to fetch history:', error);
        }
    };

    const handleSend = async (e, customMsg = null) => {
        if (e) e.preventDefault();
        const msgText = customMsg || input;
        if (!msgText.trim() || loading) return;

        const userMsg = { role: 'user', content: msgText, timestamp: new Date().toISOString() };
        setMessages(prev => [...prev, userMsg]);
        if (!customMsg) setInput('');
        setLoading(true);

        try {
            const response = await api.post('/assistant/query', { query: msgText });
            const aiMsg = {
                role: 'assistant',
                content: response.data.response,
                timestamp: new Date().toISOString()
            };
            setMessages(prev => [...prev, aiMsg]);
            setMetrics(response.data.metrics);
        } catch (error) {
            toast.error('Assistant is currently unavailable');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    if (!isChatOpen) return null;

    return (
        <div className="fixed top-6 left-24 z-50 flex flex-col items-start gap-2">
            {/* Chat Window */}
            <div className="bg-white w-96 h-[600px] rounded-[2rem] shadow-2xl border border-slate-100 flex flex-col overflow-hidden animate-in slide-in-from-left-5 duration-300">
                {/* Header */}
                <div className="bg-blue-600 p-4 text-white flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-2">
                        <div className="bg-white/20 p-2 rounded-lg">
                            <Bot size={20} />
                        </div>
                        <div>
                            <h3 className="font-bold">Virtual Business Assistant</h3>
                            <p className="text-[10px] text-blue-100 uppercase tracking-widest font-bold">Data-Driven Insights</p>
                        </div>
                    </div>
                    <button onClick={closeChat} className="hover:bg-white/20 p-1 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Quick Metrics Bar (if available from last query) */}
                {metrics && (
                    <div className="bg-gray-50 border-b border-gray-100 p-3 grid grid-cols-2 gap-2 shrink-0">
                        <div className="bg-white p-2 rounded border border-gray-100 flex items-center gap-2">
                            <TrendingUp size={14} className="text-green-500" />
                            <div className="text-[10px]">
                                <div className="text-gray-400 font-bold uppercase">Today</div>
                                <div className="font-bold text-gray-800">${metrics.today_sales.toFixed(0)}</div>
                            </div>
                        </div>
                        <div className="bg-white p-2 rounded border border-gray-100 flex items-center gap-2">
                            <AlertCircle size={14} className={metrics.low_stock_alerts > 0 ? "text-red-500" : "text-gray-300"} />
                            <div className="text-[10px]">
                                <div className="text-gray-400 font-bold uppercase">Alerts</div>
                                <div className="font-bold text-gray-800">{metrics.low_stock_alerts}</div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Messages Area */}
                <div
                    ref={scrollRef}
                    className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50"
                >
                    {messages.map((msg, idx) => (
                        <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[85%] p-3 rounded-2xl text-sm shadow-sm ${msg.role === 'user'
                                ? 'bg-blue-600 text-white rounded-br-none'
                                : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none'
                                }`}>
                                <div className="flex items-center gap-1 mb-1 opacity-50 text-[10px] font-bold uppercase">
                                    {msg.role === 'user' ? <User size={10} /> : <Bot size={10} />}
                                    {msg.role}
                                </div>
                                <p className="leading-relaxed">{msg.content}</p>
                            </div>
                        </div>
                    ))}
                    {loading && (
                        <div className="flex justify-start">
                            <div className="bg-white border border-gray-100 p-3 rounded-2xl rounded-bl-none shadow-sm flex items-center gap-2">
                                <Loader2 size={16} className="animate-spin text-blue-600" />
                                <span className="text-xs text-gray-400 font-medium">Analyzing business data...</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Quick Suggestions */}
                <div className="px-4 py-2 border-t border-gray-100 bg-white overflow-x-auto whitespace-nowrap scrollbar-hide shrink-0">
                    <div className="flex gap-2">
                        {quickSuggestions.map((suggestion, idx) => (
                            <button
                                key={idx}
                                onClick={() => handleSend(null, suggestion)}
                                className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-full text-[10px] font-bold border border-blue-100 hover:bg-blue-100 transition-colors"
                            >
                                {suggestion}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Input Area */}
                <form onSubmit={handleSend} className="p-4 border-t border-gray-100 bg-white shrink-0">
                    <div className="relative">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Ask about sales, stock, or profit..."
                            className="w-full pl-4 pr-12 py-3 bg-gray-100 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                        />
                        <button
                            type="submit"
                            disabled={!input.trim() || loading}
                            className="absolute right-2 top-1/2 -translate-y-1/2 bg-blue-600 text-white p-2 rounded-lg disabled:opacity-50 hover:bg-blue-700 transition-colors shadow-sm"
                        >
                            <Send size={16} />
                        </button>
                    </div>
                    <p className="text-[10px] text-gray-400 mt-2 text-center font-medium">
                        Try: "How are sales today?" or "Any low stock alerts?"
                    </p>
                </form>
            </div>
        </div>
    );
};

export default AssistantChat;
