import React, { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Plus, Trash2, Edit2, Truck, Store, MapPin, User, Mail, Phone, ChevronRight, Search, X, ClipboardList } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Suppliers = () => {
    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        name: '', contact_name: '', email: '', phone: '', address: ''
    });
    const [editingId, setEditingId] = useState(null);
    const { user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        fetchSuppliers();
    }, []);

    const fetchSuppliers = async () => {
        try {
            const response = await api.get('/suppliers/');
            setSuppliers(response.data);
        } catch (error) {
            toast.error('Failed to load suppliers');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (editingId) {
                await api.put(`/suppliers/${editingId}`, formData);
                toast.success('Supplier updated');
            } else {
                await api.post('/suppliers/', formData);
                toast.success('Supplier added');
            }
            setFormData({ name: '', contact_name: '', email: '', phone: '', address: '' });
            setShowForm(false);
            setEditingId(null);
            fetchSuppliers();
        } catch (error) {
            toast.error('Failed to save supplier');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (supplier) => {
        setFormData(supplier);
        setEditingId(supplier.id);
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this supply node?')) return;
        try {
            await api.delete(`/suppliers/${id}`);
            toast.success('Supply node decommissioned');
            fetchSuppliers();
        } catch (error) {
            toast.error('Purge failed: Active material dependencies');
        }
    };

    return (
        <div className="flex flex-col gap-8 animate-fade-in">
            {/* Header */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                    <h1 className="text-4xl font-black text-slate-800 tracking-tighter italic">SUPPLY_NETWORK</h1>
                    <p className="text-slate-400 font-bold text-xs uppercase tracking-[0.3em] mt-1">External Vendor & Logistics Registry</p>
                </div>
                <button
                    onClick={() => { setShowForm(true); setEditingId(null); setFormData({ name: '', contact_name: '', email: '', phone: '', address: '' }); }}
                    className="btn-primary flex items-center gap-3 px-6 py-4 text-[10px] font-black uppercase tracking-widest shadow-xl shadow-brand-primary/20"
                >
                    <Plus size={18} strokeWidth={3} />
                    Register Vendor
                </button>
            </header>

            {/* Form Modal */}
            {showForm && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
                    <div className="bg-white rounded-[2.5rem] max-w-2xl w-full p-1 shadow-2xl animate-scale-in">
                        <div className="bg-slate-50 p-10 rounded-[2.4rem]">
                            <div className="flex justify-between items-center mb-10">
                                <div className="flex items-center gap-3">
                                    <div className="p-3 bg-brand-primary text-white rounded-2xl shadow-lg shadow-brand-primary/20"><Truck size={24} /></div>
                                    <div>
                                        <h2 className="text-xl font-black text-slate-800 uppercase italic tracking-tighter">{editingId ? 'Modify Vendor' : 'Initialize Vendor'}</h2>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Supply Chain Protocol Layer</p>
                                    </div>
                                </div>
                                <button onClick={() => setShowForm(false)} className="p-2 hover:bg-slate-200 rounded-xl transition-colors"><X size={20} /></button>
                            </div>

                            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <FormGroup label="Company Identity" value={formData.name} onChange={(val) => setFormData({ ...formData, name: val })} placeholder="Apex Beans Ltd." icon={<Truck size={18} />} required />
                                <FormGroup label="Primary Point of Contact" value={formData.contact_name} onChange={(val) => setFormData({ ...formData, contact_name: val })} placeholder="John Vector" icon={<User size={18} />} />
                                <FormGroup label="Comm Link (Email)" value={formData.email} onChange={(val) => setFormData({ ...formData, email: val })} placeholder="ops@apex.com" icon={<Mail size={18} />} type="email" />
                                <FormGroup label="Signal Line (Phone)" value={formData.phone} onChange={(val) => setFormData({ ...formData, phone: val })} placeholder="+1 (555) 0123" icon={<Phone size={18} />} />
                                <div className="md:col-span-2">
                                    <FormGroup label="Physical Coordinate (Address)" value={formData.address} onChange={(val) => setFormData({ ...formData, address: val })} placeholder="Sector 4, Logistics Hub B" icon={<MapPin size={18} />} />
                                </div>

                                <div className="md:col-span-2 flex gap-4 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowForm(false)}
                                        className="flex-1 py-4 bg-white border border-slate-200 rounded-2xl font-black text-[10px] text-slate-400 uppercase tracking-widest hover:bg-slate-50 transition-all"
                                    >
                                        Abort
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="flex-1 btn-primary py-4 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2"
                                    >
                                        {loading ? 'Processing...' : 'Sync Node'} <ChevronRight size={14} strokeWidth={3} />
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* List Table */}
            <div className="premium-card p-8 border-2 border-slate-50 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-50">
                        <thead>
                            <tr className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] italic">
                                <th className="px-6 py-5 text-left pb-6">Vendor_ID / Identity</th>
                                <th className="px-6 py-5 text-left pb-6">Lead_Agent</th>
                                <th className="px-6 py-5 text-left pb-6">Comm_Vectors</th>
                                <th className="px-6 py-5 text-right pb-6">Protocols</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {suppliers.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="py-20 text-center opacity-30">
                                        <Truck size={48} className="mx-auto mb-4" strokeWidth={1} />
                                        <p className="font-black text-[10px] uppercase tracking-widest">No Vendors Registered</p>
                                    </td>
                                </tr>
                            ) : suppliers.map((supplier, idx) => (
                                <tr key={supplier.id} className="group hover:bg-slate-50/50 transition-all animate-fade-in" style={{ animationDelay: `${idx * 50}ms` }}>
                                    <td className="px-6 py-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 font-black text-[10px] group-hover:bg-brand-primary group-hover:text-white transition-colors">
                                                ID_{supplier.id}
                                            </div>
                                            <div>
                                                <div className="font-black text-slate-800 text-sm uppercase italic tracking-tight">{supplier.name}</div>
                                                <div className="text-[10px] font-bold text-slate-400 mt-0.5">{supplier.address || 'LOC_UNKNOWN'}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-6">
                                        <div className="flex items-center gap-2 text-slate-600">
                                            <User size={14} className="text-slate-300" />
                                            <span className="text-xs font-bold uppercase tracking-tight">{supplier.contact_name || 'AGENT_NOT_SET'}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-6">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2 text-[10px] font-bold text-indigo-500">
                                                <Mail size={12} /> {supplier.email || 'N/A'}
                                            </div>
                                            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500">
                                                <Phone size={12} /> {supplier.phone || 'N/A'}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-6 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={() => navigate(`/purchase-orders?supplierId=${supplier.id}`)}
                                                className="p-2.5 bg-white border border-slate-100 text-slate-400 hover:text-brand-primary hover:border-brand-primary/20 rounded-xl transition-all group/btn"
                                                title="View Supply Manifest"
                                            >
                                                <ClipboardList size={16} />
                                            </button>
                                            <button onClick={() => handleEdit(supplier)} className="p-2.5 bg-white border border-slate-100 text-slate-400 hover:text-indigo-600 hover:border-indigo-100 rounded-xl transition-all">
                                                <Edit2 size={16} />
                                            </button>
                                            <button onClick={() => handleDelete(supplier.id)} className="p-2.5 bg-white border border-slate-100 text-slate-400 hover:text-red-500 hover:border-red-100 rounded-xl transition-all">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

const FormGroup = ({ label, value, onChange, placeholder, icon, type = "text", required = false }) => (
    <div className="space-y-2 group">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 group-focus-within:text-brand-primary transition-colors">{label}</label>
        <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-brand-primary transition-colors">{icon}</div>
            <input
                type={type}
                required={required}
                className="w-full pl-12 pr-5 py-3.5 bg-white border border-slate-200 rounded-2xl font-bold text-slate-700 text-xs outline-none focus:ring-4 focus:ring-brand-primary/5 focus:border-brand-primary transition-all placeholder:text-slate-300"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
            />
        </div>
    </div>
);

export default Suppliers;
