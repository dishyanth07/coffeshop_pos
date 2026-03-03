import React, { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Plus, Trash2, Database, AlertCircle, Store, Layers, Weight, Tag, Truck, Search, ChevronRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const RawMaterials = () => {
    const [materials, setMaterials] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '', unit: '', stock: 0, min_level: 5, supplier_id: ''
    });
    const { user } = useAuth();

    useEffect(() => {
        fetchMaterials();
        fetchSuppliers();
    }, []);

    const fetchMaterials = async () => {
        try {
            const response = await api.get('/raw-materials/');
            setMaterials(response.data);
        } catch (error) {
            toast.error('Failed to load material inventory');
        }
    };

    const fetchSuppliers = async () => {
        try {
            const response = await api.get('/suppliers/');
            setSuppliers(response.data);
        } catch (error) {
            console.error('Supplier link offline');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const payload = {
                ...formData,
                stock: parseFloat(formData.stock),
                min_level: parseFloat(formData.min_level),
                supplier_id: formData.supplier_id ? parseInt(formData.supplier_id) : null
            };
            await api.post('/raw-materials/', payload);
            toast.success('Raw material added');
            setFormData({ name: '', unit: '', stock: 0, min_level: 5, supplier_id: '' });
            fetchMaterials();
        } catch (error) {
            toast.error('Failed to add material');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this material?')) return;
        try {
            await api.delete(`/raw-materials/${id}`);
            toast.success('Material deleted');
            fetchMaterials();
        } catch (error) {
            toast.error('Deletion failed: Item is used in products');
        }
    };

    const handleStockUpdate = async (id, currentStock) => {
        const newStock = prompt(`Update stock for this material:`, currentStock);
        if (newStock === null) return;

        const stockValue = parseFloat(newStock);
        if (isNaN(stockValue)) {
            toast.error("Invalid number format");
            return;
        }

        try {
            // Find the material to get its current data
            const material = materials.find(m => m.id === id);
            if (!material) return;

            // Update only the stock field
            await api.put(`/raw-materials/${id}`, {
                ...material,
                stock: stockValue
            });
            toast.success("Stock level updated");
            fetchMaterials();
        } catch {
            toast.error("Failed to update stock");
        }
    };

    return (
        <div className="flex flex-col gap-8 animate-fade-in">
            {/* Header */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                    <h1 className="text-4xl font-black text-slate-800 tracking-tighter italic flex items-center gap-3">
                        <Database className="text-brand-primary" size={36} />
                        Raw Materials
                    </h1>
                    <p className="text-slate-400 font-bold text-xs uppercase tracking-[0.3em] mt-1">Inventory & Stock Management</p>
                </div>
                {user?.branch_id && (
                    <div className="px-4 py-2 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center gap-3">
                        <Store size={14} className="text-indigo-400" />
                        <span className="text-[10px] font-black text-indigo-700 uppercase tracking-widest">Node ID: #{user.branch_id}</span>
                    </div>
                )}
            </header>

            {/* Add New Material */}
            <div className="premium-card p-1">
                <div className="bg-slate-50/50 p-8 rounded-[1.4rem]">
                    <div className="flex items-center gap-3 mb-8">
                        <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic text-brand-primary">Add New Material</h2>
                    </div>

                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                        <AssetInput label="Material Name" value={formData.name} onChange={(v) => setFormData({ ...formData, name: v })} placeholder="e.g. Fresh Milk" icon={<Layers size={14} />} required />
                        <AssetInput label="Unit" value={formData.unit} onChange={(v) => setFormData({ ...formData, unit: v })} placeholder="kg / ml / pc" icon={<Weight size={14} />} required />
                        <AssetInput label="Stock Level" type="number" value={formData.stock} onChange={(v) => setFormData({ ...formData, stock: v })} icon={<Database size={14} />} />
                        <AssetInput label="Low Stock Alert" type="number" value={formData.min_level} onChange={(v) => setFormData({ ...formData, min_level: v })} icon={<AlertCircle size={14} />} />

                        <div className="space-y-2 group">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Supplier</label>
                            <div className="relative">
                                <Truck size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                                <select
                                    value={formData.supplier_id}
                                    onChange={(e) => setFormData({ ...formData, supplier_id: e.target.value })}
                                    className="w-full pl-10 pr-5 py-3.5 bg-white border border-slate-200 rounded-xl font-bold text-slate-700 text-xs focus:ring-4 focus:ring-brand-primary/5 focus:border-brand-primary outline-none transition-all appearance-none"
                                >
                                    <option value="">Select Supplier</option>
                                    {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="lg:col-span-1 flex items-end">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full btn-primary py-3.5 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest"
                            >
                                {loading ? 'ADDING...' : 'Add Material'} <ChevronRight size={14} strokeWidth={3} />
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Material Inventory */}
            <div className="premium-card p-8 border-2 border-slate-50 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] italic border-b border-slate-50">
                                <th className="pb-6">Material</th>
                                <th className="pb-6">Stock Level</th>
                                <th className="pb-6">Low Stock Alert</th>
                                <th className="pb-6">Supplier</th>
                                <th className="pb-6 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {materials.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="py-20 text-center opacity-30">
                                        <Layers size={48} className="mx-auto mb-4" strokeWidth={1} />
                                        <p className="font-black text-[10px] uppercase tracking-widest">Inventory Empty: No Materials Found</p>
                                    </td>
                                </tr>
                            ) : materials.map((m, idx) => (
                                <tr key={m.id} className="group hover:bg-slate-50/50 transition-all animate-fade-in" style={{ animationDelay: `${idx * 50}ms` }}>
                                    <td className="py-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 font-black text-[10px] group-hover:bg-brand-primary group-hover:text-white transition-colors">
                                                #{m.id}
                                            </div>
                                            <div>
                                                <div className="font-black text-slate-800 text-sm uppercase italic tracking-tight">{m.name}</div>
                                                <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Unit: {m.unit}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-6">
                                        <button
                                            onClick={() => handleStockUpdate(m.id, m.stock)}
                                            className={`flex items-center gap-2 font-black text-sm tracking-tight px-3 py-1.5 rounded-xl border-2 transition-all hover:scale-105 ${m.stock <= m.min_level ? 'bg-red-50 text-red-500 border-red-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}
                                        >
                                            {m.stock} {m.unit}
                                            {m.stock <= m.min_level && <AlertCircle size={14} className="animate-pulse" />}
                                        </button>
                                    </td>
                                    <td className="py-6 font-bold text-slate-500 text-xs">
                                        {m.min_level} {m.unit}
                                    </td>
                                    <td className="py-6">
                                        <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${m.supplier_name ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' : 'bg-slate-50 text-slate-400'}`}>
                                            {m.supplier_name || 'Unassigned'}
                                        </span>
                                    </td>
                                    <td className="py-6 text-right">
                                        <button
                                            onClick={() => handleDelete(m.id)}
                                            className="p-2.5 bg-white border border-slate-100 text-slate-400 hover:text-red-500 hover:border-red-100 rounded-xl transition-all"
                                            title="Delete Material"
                                        >
                                            <Trash2 size={16} />
                                        </button>
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

const AssetInput = ({ label, value, onChange, placeholder, icon, type = "text", required = false }) => (
    <div className="space-y-2 group">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>
        <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-brand-primary transition-colors">{icon}</div>
            <input
                type={type}
                required={required}
                className="w-full pl-10 pr-5 py-3.5 bg-white border border-slate-200 rounded-xl font-bold text-slate-700 text-xs outline-none focus:ring-4 focus:ring-brand-primary/5 focus:border-brand-primary transition-all placeholder:text-slate-300 shadow-sm"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
            />
        </div>
    </div>
);

export default RawMaterials;
