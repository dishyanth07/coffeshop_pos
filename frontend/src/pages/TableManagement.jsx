import React, { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import {
    Plus, Trash2, QrCode, Store, ExternalLink, Printer,
    ChevronRight, MapPin, Tablet, Monitor, RefreshCw
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const TableManagement = () => {
    const [tables, setTables] = useState([]);
    const [loading, setLoading] = useState(false);
    const [newTableNumber, setNewTableNumber] = useState('');
    const { user } = useAuth();

    useEffect(() => {
        fetchTables();
    }, []);

    const fetchTables = async () => {
        try {
            const response = await api.get('/tables/');
            setTables(response.data);
        } catch (error) {
            toast.error('Failed to load table matrix');
        }
    };

    const handleCreateTable = async (e) => {
        e.preventDefault();
        if (!newTableNumber) return;

        setLoading(true);
        try {
            await api.post('/tables/', {
                table_number: newTableNumber,
                branch_id: user.branch_id
            });
            toast.success('Table node initialized');
            setNewTableNumber('');
            fetchTables();
        } catch (error) {
            toast.error('Handshake failed: Table creation blocked');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('CRITICAL: Purge this table from the spatial matrix?')) return;
        try {
            await api.delete(`/tables/${id}`);
            toast.success('Table node decommissioned');
            fetchTables();
        } catch (error) {
            toast.error('Decommissioning failed');
        }
    };

    const handlePrintQR = (table) => {
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html>
                <head>
                    <title>Table ${table.table_number} QR</title>
                    <style>
                        body { font-family: 'Inter', sans-serif; text-align: center; padding: 60px; background: #fafafa; }
                        .qr-card { 
                            background: white; 
                            border-radius: 40px; 
                            padding: 60px; 
                            display: inline-block; 
                            box-shadow: 0 20px 50px rgba(0,0,0,0.05);
                            border: 2px solid #f0f0f0;
                        }
                        h1 { font-weight: 900; font-size: 48px; margin: 0; color: #1e293b; letter-spacing: -2px; }
                        p { color: #64748b; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; font-size: 14px; margin-top: 10px; }
                        #qrcode { margin: 40px 0; }
                        #qrcode img { margin: 0 auto; border: 8px solid #fff; box-shadow: 0 0 0 2px #f0f0f0; border-radius: 20px; }
                        .url { font-family: monospace; font-size: 10px; color: #cbd5e1; margin-top: 40px; }
                    </style>
                </head>
                <body>
                    <div class="qr-card">
                        <p>Scan to Order</p>
                        <h1>TABLE ${table.table_number}</h1>
                        <div id="qrcode"></div>
                        <div class="url">${table.qr_url}</div>
                    </div>
                    <script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>
                    <script>
                        new QRCode(document.getElementById("qrcode"), {
                            text: "${table.qr_url}",
                            width: 256,
                            height: 256,
                            colorDark: "#1e293b",
                            colorLight: "#ffffff",
                            correctLevel: QRCode.CorrectLevel.H
                        });
                        setTimeout(() => {
                            window.print();
                            window.close();
                        }, 1000);
                    </script>
                </body>
            </html>
        `);
        printWindow.document.close();
    };

    return (
        <div className="flex flex-col gap-8 animate-fade-in">
            {/* Header */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                    <h1 className="text-4xl font-black text-slate-800 tracking-tighter italic">SPATIAL_MATRIX</h1>
                    <p className="text-slate-400 font-bold text-xs uppercase tracking-[0.3em] mt-1">Table QR & Seating Configuration</p>
                </div>
                {user?.branch_id && (
                    <div className="px-4 py-2 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center gap-3">
                        <Store size={14} className="text-indigo-400" />
                        <span className="text-[10px] font-black text-indigo-700 uppercase tracking-widest">Node ID: #{user.branch_id}</span>
                    </div>
                )}
            </header>

            {/* Quick Add Console */}
            <div className="premium-card p-1 max-w-2xl">
                <div className="bg-slate-50/50 p-8 rounded-[1.4rem]">
                    <div className="flex items-center gap-3 mb-6">
                        <Plus size={18} className="text-brand-primary" strokeWidth={3} />
                        <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">Initialize Table Vector</h2>
                    </div>
                    <form onSubmit={handleCreateTable} className="flex gap-4">
                        <input
                            type="text"
                            placeholder="Designation (e.g. T-01)"
                            value={newTableNumber}
                            onChange={(e) => setNewTableNumber(e.target.value)}
                            className="flex-1 px-5 py-3.5 bg-white border border-slate-200 rounded-2xl font-bold text-slate-700 text-sm focus:ring-4 focus:ring-brand-primary/5 focus:border-brand-primary outline-none transition-all placeholder:text-slate-300 shadow-sm"
                            required
                        />
                        <button
                            type="submit"
                            disabled={loading || !newTableNumber}
                            className="btn-primary px-8 py-3.5 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest shadow-xl shadow-brand-primary/20"
                        >
                            {loading ? <RefreshCw className="animate-spin" size={16} /> : <Plus size={16} strokeWidth={3} />}
                            Add Node
                        </button>
                    </form>
                </div>
            </div>

            {/* Matrix Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {tables.length === 0 ? (
                    <div className="col-span-full py-40 bg-white rounded-[2.5rem] border-2 border-dashed border-slate-100 flex flex-col items-center justify-center opacity-40">
                        <QrCode size={64} strokeWidth={1} className="mb-6 text-slate-300" />
                        <h3 className="font-black uppercase tracking-[0.3em] text-xs text-slate-400">Zero Tables Synchronized</h3>
                    </div>
                ) : tables.map((table, index) => (
                    <div
                        key={table.id}
                        className="premium-card p-8 border-2 border-slate-50 flex flex-col group hover:border-brand-primary/20 animate-fade-in-up"
                        style={{ animationDelay: `${index * 50}ms` }}
                    >
                        <div className="flex justify-between items-start mb-8">
                            <div className="bg-brand-primary/5 w-16 h-16 rounded-[1.5rem] flex items-center justify-center text-brand-primary text-2xl font-black italic tracking-tighter shadow-inner border border-brand-primary/10">
                                {table.table_number.includes('-') ? table.table_number.split('-')[1] : table.table_number}
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => handlePrintQR(table)}
                                    className="p-2.5 bg-slate-50 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                                    title="Physical QR Print"
                                >
                                    <Printer size={18} />
                                </button>
                                <button
                                    onClick={() => handleDelete(table.id)}
                                    className="p-2.5 bg-slate-50 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                    title="Purge Vector"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>

                        <div className="mb-8">
                            <h3 className="font-black text-slate-800 text-lg uppercase italic tracking-tighter">Table {table.table_number}</h3>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">QR Self-Ordering: <span className="text-emerald-500">Active</span></p>
                        </div>

                        <a
                            href={table.qr_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full py-4 bg-slate-50 text-brand-primary text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl flex items-center justify-center hover:bg-brand-primary hover:text-white transition-all border border-dashed border-brand-primary/20"
                        >
                            <ExternalLink size={14} className="mr-2" />
                            Test Order Link
                        </a>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TableManagement;
