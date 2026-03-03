import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import {
    Trash2, Plus, Save, Package, Database, ShieldAlert,
    ChevronRight, Tag, Info, AlertTriangle, Layers
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Inventory = () => {
    const [products, setProducts] = useState([]);
    const [rawMaterials, setRawMaterials] = useState([]);
    const [newProduct, setNewProduct] = useState({ name: '', price: '', category: '', description: '' });
    const [recipeItems, setRecipeItems] = useState([]);
    const [customizationItems, setCustomizationItems] = useState([]);
    const [editingProduct, setEditingProduct] = useState(null);
    const [loading, setLoading] = useState(false);
    const { user } = useAuth();
    const navigate = useNavigate();

    const fetchProducts = useCallback(async () => {
        try {
            const response = await api.get('/products');
            setProducts(response.data);
        } catch {
            toast.error('Failed to load products');
        }
    }, []);

    const fetchRawMaterials = useCallback(async () => {
        try {
            const response = await api.get('/raw-materials/');
            setRawMaterials(response.data);
        } catch {
            console.error('Failed to load raw materials');
        }
    }, []);

    useEffect(() => {
        fetchProducts();
        fetchRawMaterials();
    }, [fetchProducts, fetchRawMaterials]);

    const addRecipeItem = () => {
        setRecipeItems([...recipeItems, { raw_material_id: '', quantity: '' }]);
    };

    const removeRecipeItem = (index) => {
        setRecipeItems(recipeItems.filter((_, i) => i !== index));
    };

    const updateRecipeItem = (index, field, value) => {
        const updated = [...recipeItems];
        updated[index][field] = value;
        setRecipeItems(updated);
    };

    const addCustomizationItem = () => {
        setCustomizationItems([...customizationItems, { name: '', extra_price: '', raw_material_id: '', quantity: '' }]);
    };

    const removeCustomizationItem = (index) => {
        setCustomizationItems(customizationItems.filter((_, i) => i !== index));
    };

    const updateCustomizationItem = (index, field, value) => {
        const updated = [...customizationItems];
        updated[index][field] = value;
        setCustomizationItems(updated);
    };

    const handleCreateProduct = async (e) => {
        e.preventDefault();
        if (!newProduct.name || !newProduct.price) return;

        setLoading(true);
        try {
            const formattedRecipe = recipeItems
                .filter(item => item.raw_material_id && item.quantity)
                .map(item => ({
                    raw_material_id: parseInt(item.raw_material_id),
                    quantity: parseFloat(item.quantity)
                }));

            const formattedCustomizations = customizationItems
                .filter(item => item.name && item.extra_price)
                .map(item => ({
                    name: item.name,
                    extra_price: parseFloat(item.extra_price),
                    raw_material_id: item.raw_material_id ? parseInt(item.raw_material_id) : null,
                    quantity: item.quantity ? parseFloat(item.quantity) : 0.0
                }));

            await api.post('/products/', {
                ...newProduct,
                price: parseFloat(newProduct.price),
                recipe_items: formattedRecipe,
                customizations: formattedCustomizations
            });
            toast.success('Product created with recipe');
            setNewProduct({ name: '', price: '', category: '', description: '' });
            setRecipeItems([]);
            fetchProducts();
        } catch {
            toast.error('Failed to create product');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure? This will permanently delete the product.')) return;
        try {
            await api.delete(`/products/${id}`);
            toast.success('Product removed from system');
            fetchProducts();
        } catch {
            toast.error('Failed to delete product');
        }
    };

    const handleStockUpdate = async (id, currentStock) => {
        const newStock = prompt('Enter new stock quantity:', currentStock);
        if (newStock === null) return;

        const quantity = parseInt(newStock);
        if (isNaN(quantity)) {
            toast.error("Invalid number format");
            return;
        }

        try {
            await api.post(`/inventory/${id}`, { quantity });
            toast.success("Inventory stock adjusted");
            fetchProducts();
        } catch {
            toast.error("Failed to update stock");
        }
    };

    const handleManualAudit = async (id, currentStock) => {
        const actualStockInput = prompt(`MANUAL AUDIT: Physical count for this product:`, currentStock);
        if (actualStockInput === null) return;

        const actualStock = parseInt(actualStockInput);
        if (isNaN(actualStock)) {
            toast.error("Invalid input");
            return;
        }

        try {
            await api.post(`/fraud/stock-count`, {
                product_id: id,
                expected_stock: currentStock,
                actual_stock: actualStock
            });
            toast.success("Security audit recorded");
            fetchProducts();
        } catch {
            toast.error("Audit log failed to save");
        }
    };

    const handleAddCustomizationToProduct = async (productId, customization) => {
        if (!customization.name.trim()) {
            toast.error("Option name is required");
            return;
        }

        const price = parseFloat(customization.extra_price);
        if (isNaN(price)) {
            toast.error("Valid extra price is required");
            return;
        }

        try {
            const payload = {
                name: customization.name.trim(),
                extra_price: price,
                raw_material_id: customization.raw_material_id ? parseInt(customization.raw_material_id) : null,
                quantity: parseFloat(customization.quantity) || 0.0
            };

            await api.post(`/products/${productId}/customizations`, payload);
            toast.success("Extra option added");
            fetchProducts();
        } catch {
            toast.error("Failed to add customization");
        }
    };

    return (
        <div className="flex flex-col gap-8 animate-fade-in">
            {/* Header */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-3">
                <div>
                    <h1 className="text-3xl md:text-4xl font-black text-slate-800 tracking-tighter italic leading-none">INVENTORY_CORE</h1>
                    <p className="text-slate-400 font-bold text-[10px] md:text-xs uppercase tracking-[0.2em] md:tracking-[0.3em] mt-1">Master Product Control Node</p>
                </div>
                {user?.branch_id && (
                    <div className="px-3 py-1.5 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                        <span className="text-[9px] font-black text-indigo-700 uppercase tracking-widest">Branch Vector: #{user.branch_id}</span>
                    </div>
                )}
            </header>

            {/* Creation Console */}
            <div className="premium-card p-0.5 md:p-1">
                <div className="bg-slate-50/50 p-4 md:p-8 rounded-[1rem] md:rounded-[1.4rem]">
                    <div className="flex items-center gap-3 mb-6 md:mb-8">
                        <div className="p-2 bg-brand-primary text-white rounded-xl shadow-lg shadow-brand-primary/20"><Package size={18} /></div>
                        <h2 className="text-base md:text-lg font-black text-slate-800 uppercase tracking-tight italic">Initialize Product</h2>
                    </div>

                    <form onSubmit={handleCreateProduct} className="space-y-6 md:space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                            <InputField label="Product Designation" value={newProduct.name} onChange={(val) => setNewProduct({ ...newProduct, name: val })} placeholder="e.g. Espresso Gold" />
                            <InputField label="Yield Value (₹)" value={newProduct.price} onChange={(val) => setNewProduct({ ...newProduct, price: val })} placeholder="0.00" type="number" />
                            <InputField label="Category Logic" value={newProduct.category} onChange={(val) => setNewProduct({ ...newProduct, category: val })} placeholder="Hot Drinks" />
                            <InputField label="Telemetry / Desc" value={newProduct.description} onChange={(val) => setNewProduct({ ...newProduct, description: val })} placeholder="Brief description..." />
                        </div>

                        {/* Recipe System */}
                        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-inner group">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-2 text-slate-400 group-hover:text-brand-primary transition-colors">
                                    <Layers size={16} strokeWidth={3} />
                                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em]">Recipe Dependency Matrix</h3>
                                </div>
                                <button type="button" onClick={addRecipeItem} className="text-[10px] font-black text-brand-primary uppercase tracking-widest hover:text-indigo-700 transition-colors flex items-center gap-1">
                                    <Plus size={14} strokeWidth={3} /> Add Dependency
                                </button>
                            </div>

                            <div className="space-y-3">
                                {recipeItems.length === 0 ? (
                                    <div className="py-4 text-center text-slate-300 italic text-xs tracking-wider">No raw material dependencies linked.</div>
                                ) : recipeItems.map((item, index) => (
                                    <div key={index} className="flex gap-3 items-center animate-fade-in-up">
                                        <select
                                            value={item.raw_material_id}
                                            onChange={(e) => updateRecipeItem(index, 'raw_material_id', e.target.value)}
                                            className="flex-1 px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-slate-700 focus:ring-2 focus:ring-brand-primary/10 outline-none"
                                        >
                                            <option value="">Select Resource</option>
                                            {rawMaterials.map(rm => (
                                                <option key={rm.id} value={rm.id}>{rm.name} ({rm.unit})</option>
                                            ))}
                                        </select>
                                        <input
                                            type="number"
                                            step="0.01"
                                            placeholder="QTY"
                                            value={item.quantity}
                                            onChange={(e) => updateRecipeItem(index, 'quantity', e.target.value)}
                                            className="w-24 px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-slate-700 outline-none"
                                        />
                                        <button type="button" onClick={() => removeRecipeItem(index)} className="p-2 text-red-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"><Trash2 size={16} /></button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Customization System */}
                        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-inner group">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-2 text-slate-400 group-hover:text-amber-500 transition-colors">
                                    <Tag size={16} strokeWidth={3} />
                                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em]">Product Customizations (Add-ons)</h3>
                                </div>
                                <button type="button" onClick={addCustomizationItem} className="text-[10px] font-black text-amber-500 uppercase tracking-widest hover:text-amber-700 transition-colors flex items-center gap-1">
                                    <Plus size={14} strokeWidth={3} /> Add Extra Option
                                </button>
                            </div>

                            <div className="space-y-4">
                                {customizationItems.length === 0 ? (
                                    <div className="py-4 text-center text-slate-300 italic text-xs tracking-wider">No customization options defined.</div>
                                ) : customizationItems.map((item, index) => (
                                    <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end animate-fade-in-up">
                                        <div className="space-y-1">
                                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Option Name</span>
                                            <input placeholder="e.g. Extra Milk" value={item.name} onChange={(e) => updateCustomizationItem(index, 'name', e.target.value)} className="w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-slate-700 outline-none" />
                                        </div>
                                        <div className="space-y-1">
                                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Extra Price (₹)</span>
                                            <input type="number" step="0.01" placeholder="0.00" value={item.extra_price} onChange={(e) => updateCustomizationItem(index, 'extra_price', e.target.value)} className="w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-slate-700 outline-none" />
                                        </div>
                                        <div className="space-y-1">
                                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Linked Resource (Optional)</span>
                                            <select value={item.raw_material_id} onChange={(e) => updateCustomizationItem(index, 'raw_material_id', e.target.value)} className="w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-slate-700 outline-none">
                                                <option value="">None</option>
                                                {rawMaterials.map(rm => <option key={rm.id} value={rm.id}>{rm.name}</option>)}
                                            </select>
                                        </div>
                                        <div className="flex gap-2 items-center">
                                            <div className="flex-1 space-y-1">
                                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">QTY</span>
                                                <input type="number" step="0.01" placeholder="0.00" value={item.quantity} onChange={(e) => updateCustomizationItem(index, 'quantity', e.target.value)} className="w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-slate-700 outline-none" />
                                            </div>
                                            <button type="button" onClick={() => removeCustomizationItem(index)} className="p-2 text-red-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all mb-0.5"><Trash2 size={16} /></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex justify-end">
                            <button
                                type="submit"
                                disabled={loading}
                                className="btn-primary flex items-center gap-3 px-10 py-4 text-sm tracking-widest uppercase font-black"
                            >
                                {loading ? 'DEPLOYING...' : 'INITIALIZE_PRODUCT'}
                                <ChevronRight size={18} strokeWidth={3} />
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Content Table */}
            <div className="premium-card p-8 border-2 border-slate-50">
                <div className="flex items-center gap-3 mb-8">
                    <div className="p-2 bg-brand-primary/5 text-brand-primary rounded-xl"><Database size={20} /></div>
                    <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight italic">Product Manifest</h2>
                </div>

                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50">
                                <th className="pb-5">Product_Data</th>
                                <th className="pb-5">Logic_Cat</th>
                                <th className="pb-5 text-right">Unit_Price</th>
                                <th className="pb-5 text-center">Available_Stock</th>
                                <th className="pb-5 text-right">Admin_Control</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {products.map((product) => (
                                <tr key={product.id} className="group hover:bg-slate-50/50 transition-colors">
                                    <td className="py-5">
                                        <div className="flex flex-col">
                                            <span className="font-black text-slate-800 text-sm uppercase tracking-tight group-hover:text-brand-primary transition-colors">{product.name}</span>
                                            <span className="text-[10px] font-bold text-slate-400 italic mt-1 line-clamp-1">{product.description || 'No description provided.'}</span>
                                            {(product.recipe_items?.length > 0 || product.customizations?.length > 0) && (
                                                <div className="mt-3 flex flex-wrap gap-1.5">
                                                    {product.recipe_items?.map((ri, ridx) => (
                                                        <span key={`ri-${ridx}`} className="text-[8px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-black uppercase tracking-tighter border border-slate-200">
                                                            {ri.raw_material_name} ({ri.quantity}{ri.unit})
                                                        </span>
                                                    ))}
                                                    {product.customizations?.map((cust, cidx) => (
                                                        <span key={`cust-${cidx}`} className="text-[8px] bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full font-black uppercase tracking-tighter border border-amber-100">
                                                            + {cust.name} (+₹ {cust.extra_price.toFixed(2)})
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="py-5">
                                        <span className="text-[10px] font-black bg-indigo-50 text-indigo-600 px-2.5 py-1 rounded-lg uppercase tracking-widest border border-indigo-100">
                                            {product.category || 'GENERAL'}
                                        </span>
                                    </td>
                                    <td className="py-5 text-right font-black text-slate-900 text-sm tracking-tighter">₹{product.price.toFixed(2)}</td>
                                    <td className="py-5 text-center">
                                        <button
                                            onClick={() => handleStockUpdate(product.id, product.stock)}
                                            className={`text-xs font-black uppercase px-3 py-1.5 rounded-xl border-2 transition-all hover:scale-105 ${product.stock < 10 ? 'bg-red-50 text-red-500 border-red-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}
                                        >
                                            {product.stock} Units
                                        </button>
                                    </td>
                                    <td className="py-5 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button onClick={() => setEditingProduct(product)} className="p-2.5 bg-brand-primary/5 text-brand-primary hover:bg-brand-primary hover:text-white rounded-xl transition-all" title="Manage Extras"><Tag size={18} /></button>
                                            <button onClick={() => handleManualAudit(product.id, product.stock)} className="p-2.5 bg-slate-50 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-all" title="Security Audit"><ShieldAlert size={18} /></button>
                                            <button onClick={() => handleDelete(product.id)} className="p-2.5 bg-slate-50 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"><Trash2 size={18} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Mobile Manifest Cards */}
                <div className="md:hidden space-y-4">
                    {products.map((product) => (
                        <div key={product.id} className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100 space-y-4">
                            <div className="flex justify-between items-start">
                                <div>
                                    <span className="text-[8px] font-black bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-md uppercase tracking-widest border border-indigo-100 mb-1 inline-block">
                                        {product.category || 'GENERAL'}
                                    </span>
                                    <h3 className="font-black text-slate-800 text-sm uppercase tracking-tight">{product.name}</h3>
                                </div>
                                <span className="font-black text-brand-primary text-sm italic tracking-tighter">₹{product.price.toFixed(2)}</span>
                            </div>

                            <button
                                onClick={() => handleStockUpdate(product.id, product.stock)}
                                className={`w-full text-[10px] font-black uppercase py-3 rounded-xl border-2 transition-all ${product.stock < 10 ? 'bg-red-50 text-red-500 border-red-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}
                            >
                                {product.stock} UNITS IN STOCK
                            </button>

                            <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                                <div className="flex gap-2">
                                    <button onClick={() => setEditingProduct(product)} className="p-2 bg-brand-primary/10 text-brand-primary rounded-lg" title="Manage Extras"><Tag size={16} /></button>
                                    <button onClick={() => handleManualAudit(product.id, product.stock)} className="p-2 bg-white text-slate-400 rounded-lg shadow-sm" title="Security Audit"><ShieldAlert size={16} /></button>
                                </div>
                                <button onClick={() => handleDelete(product.id)} className="p-2 text-red-400 hover:text-red-600 transition-colors"><Trash2 size={18} /></button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Manage Extras Modal */}
            {editingProduct && (
                <ManageExtrasModal
                    product={editingProduct}
                    rawMaterials={rawMaterials}
                    onClose={() => setEditingProduct(null)}
                    onAdd={handleAddCustomizationToProduct}
                />
            )}
        </div>
    );
};

const ManageExtrasModal = ({ product, rawMaterials, onClose, onAdd }) => {
    const [newCust, setNewCust] = useState({ name: '', extra_price: '', raw_material_id: '', quantity: '' });

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-scale-in">
                <div className="p-8 bg-brand-primary text-white flex justify-between items-center">
                    <div>
                        <h3 className="text-2xl font-black italic tracking-tighter uppercase">Manage Extras: {product.name}</h3>
                        <p className="text-[10px] font-bold text-white/50 uppercase tracking-[0.2em] mt-1">Configure Add-ons and Dynamic Pricing</p>
                    </div>
                    <button onClick={onClose} className="p-2 bg-white/10 rounded-xl hover:bg-white/20 transition-all">
                        <Trash2 size={20} className="rotate-45" />
                    </button>
                </div>

                <div className="p-8 space-y-6">
                    {/* Existing List */}
                    <div>
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Active Customizations</h4>
                        <div className="space-y-2">
                            {product.customizations?.length === 0 ? (
                                <p className="text-xs text-slate-300 italic">No add-ons configured for this product.</p>
                            ) : product.customizations?.map((c) => (
                                <div key={c.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100">
                                    <div className="flex flex-col">
                                        <span className="font-bold text-slate-700 text-sm">{c.name}</span>
                                        <span className="text-[10px] text-slate-400 uppercase font-black tracking-widest">+ ₹{c.extra_price.toFixed(2)}</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        {c.raw_material_name && (
                                            <span className="text-[8px] bg-indigo-50 text-indigo-500 px-2 py-0.5 rounded-full font-black uppercase">
                                                {c.raw_material_name} ({c.quantity})
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Quick Add Form */}
                    <div className="pt-6 border-t border-slate-100">
                        <h4 className="text-[10px] font-black text-brand-primary uppercase tracking-widest mb-4">Add New Option</h4>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div className="space-y-1">
                                <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Option Name</label>
                                <input placeholder="e.g. Extra Syrup" value={newCust.name} onChange={(e) => setNewCust({ ...newCust, name: e.target.value })} className="w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Extra Price (₹)</label>
                                <input type="number" step="0.01" placeholder="0.00" value={newCust.extra_price} onChange={(e) => setNewCust({ ...newCust, extra_price: e.target.value })} className="w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none" />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div className="space-y-1">
                                <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Linked Resource</label>
                                <select value={newCust.raw_material_id} onChange={(e) => setNewCust({ ...newCust, raw_material_id: e.target.value })} className="w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none">
                                    <option value="">None</option>
                                    {rawMaterials.map(rm => <option key={rm.id} value={rm.id}>{rm.name}</option>)}
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">QTY</label>
                                <input type="number" step="0.01" placeholder="0.00" value={newCust.quantity} onChange={(e) => setNewCust({ ...newCust, quantity: e.target.value })} className="w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none" />
                            </div>
                        </div>
                        <button
                            onClick={() => {
                                onAdd(product.id, newCust);
                                setNewCust({ name: '', extra_price: '', raw_material_id: '', quantity: '' });
                            }}
                            className="w-full bg-brand-primary text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-brand-secondary transition-all shadow-xl shadow-brand-primary/20"
                        >
                            Confirm and Deploy Option
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const InputField = ({ label, value, onChange, placeholder, type = "text" }) => (
    <div className="space-y-1.5 md:space-y-2 group">
        <label className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 group-focus-within:text-brand-primary transition-colors">{label}</label>
        <input
            type={type}
            step={type === 'number' ? '0.01' : undefined}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full px-4 md:px-5 py-2.5 md:py-3.5 bg-white border border-slate-200 rounded-xl md:rounded-2xl font-bold text-slate-700 text-xs md:text-sm focus:ring-4 focus:ring-brand-primary/5 focus:border-brand-primary outline-none transition-all placeholder:text-slate-300 shadow-sm"
        />
    </div>
);

export default Inventory;
