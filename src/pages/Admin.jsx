import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiTrash2, FiPlus, FiLogOut, FiDownload, FiSearch,
  FiChevronDown, FiChevronUp, FiEye, FiSettings, FiPackage, FiPercent, FiDatabase, FiInfo
} from "react-icons/fi";
import { db } from "../../firebase.js";
import {
  collection, onSnapshot, doc, updateDoc, addDoc, deleteDoc, serverTimestamp
} from "firebase/firestore";

import Logo from '../assets/logo-white.png';

export default function Admin({ setIsAuthed }) {
  const nav = useNavigate();
  const [services, setServices] = useState([]);
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState(null);

  const durations = ["Instant", "1-24 Hours", "Monthly", "Yearly"];
  const planTypes = ["Full Account", "1 User", "Private", "Shared", "Coins", "Top-Up"];
  const categories = ["Streaming", "Productivity", "Entertainment", "Tools", "Games", "Gift Cards", "Other"];

  useEffect(() => {
    const colRef = collection(db, "services");
    const unsubscribe = onSnapshot(colRef, snapshot => {
      const data = snapshot.docs.map(d => ({
        id: d.id,
        ...d.data(),
        plans: d.data().plans || [],
        category: d.data().category || "Other",
        serviceNote: d.data().serviceNote || ""
      }));
      setServices(data);
    });
    return () => unsubscribe();
  }, []);

  const logout = () => {
    localStorage.removeItem("cedars_admin_auth");
    setIsAuthed(false);
    nav("/login");
  };

  const addService = async () => {
    await addDoc(collection(db, "services"), {
      name: "New Service",
      plans: [],
      category: "Other",
      serviceNote: "",
      imageUrl: "",
      updatedAt: serverTimestamp()
    });
  };

  const removeService = async (id) => {
    if (window.confirm("Delete this service?")) {
      await deleteDoc(doc(db, "services", id));
    }
  };

  const updateServiceField = async (id, field, value) => {
    await updateDoc(doc(db, "services", id), { [field]: value, updatedAt: serverTimestamp() });
  };

  const updatePlanField = async (serviceId, plans, index, field, value) => {
    const updatedPlans = [...plans];
    updatedPlans[index] = { ...updatedPlans[index], [field]: value };
    await updateDoc(doc(db, "services", serviceId), { plans: updatedPlans, updatedAt: serverTimestamp() });
  };

  const addPlan = async (service) => {
    const newPlans = [...service.plans, {
      label: "New Plan",
      costPrice: "0",
      sellPrice: "0",
      discount: "0",
      duration: "Instant",
      type: "Coins",
      inStock: true
    }];
    await updateDoc(doc(db, "services", service.id), { plans: newPlans, updatedAt: serverTimestamp() });
  };

  const removePlan = async (service, index) => {
    const newPlans = [...service.plans];
    newPlans.splice(index, 1);
    await updateDoc(doc(db, "services", service.id), { plans: newPlans, updatedAt: serverTimestamp() });
  };

  const exportToCSV = () => {
    let csv = "Service,Category,Plan,Type,Duration,Cost,Sell,Discount,FinalPrice,Profit,Stock\n";
    services.forEach(s => {
      (s.plans || []).forEach(p => {
        const finalPrice = (+p.sellPrice || 0) - (+p.discount || 0);
        const profit = finalPrice - (+p.costPrice || 0);
        csv += `"${s.name}","${s.category || 'Other'}","${p.label}","${p.type || 'N/A'}","${p.duration}",${p.costPrice},${p.sellPrice},${p.discount || 0},${finalPrice},${profit},${p.inStock !== false ? 'In Stock' : 'Out of Stock'}\n`;
      });
    });
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cedars_report_${new Date().toLocaleDateString()}.csv`;
    a.click();
  };

  const filteredServices = services.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-black text-zinc-100 antialiased font-sans selection:bg-blue-500/30 pb-20">
      
      <nav className="border-b border-white/5 bg-zinc-950/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="w-10 h-10 md:w-20 md:h-20 rounded-lg flex items-center justify-center overflow-hidden">
              <img src={Logo} alt="" className="w-full h-full object-contain" />
            </div>
            <div>
              <span className="text-[10px] md:text-xs font-black uppercase tracking-[0.2em] md:tracking-[0.3em] block">Cedars Admin</span>
              <div className="flex items-center gap-1.5">
                <div className="w-1 h-1 md:w-1.5 md:h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[7px] md:text-[8px] font-bold text-zinc-500 uppercase tracking-widest">System Live</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-1 md:gap-2">
            <button onClick={() => nav("/prices")} className="p-2 md:p-2.5 rounded-xl hover:bg-white/5 transition-all text-zinc-400 hover:text-white">
              <FiEye size={18} />
            </button>
            <button onClick={logout} className="p-2 md:p-2.5 rounded-xl hover:bg-red-500/10 transition-all text-zinc-400 hover:text-red-500">
              <FiLogOut size={18} />
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 pt-6 md:pt-10">
        
        <div className="flex flex-col md:flex-row gap-3 md:gap-4 mb-8">
          <div className="relative flex-grow">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
            <input 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search services..."
              className="w-full bg-zinc-900/40 border border-white/5 rounded-2xl py-3.5 pl-12 pr-4 text-sm outline-none focus:ring-1 ring-blue-500/50 transition-all"
            />
          </div>
          <div className="flex gap-2">
            <button onClick={exportToCSV} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 md:px-6 bg-zinc-900 border border-white/5 rounded-2xl text-[9px] md:text-[10px] font-black uppercase tracking-widest hover:bg-zinc-800 transition-all py-3 md:py-0">
              <FiDownload size={14} /> Export
            </button>
            <button onClick={addService} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 md:px-6 bg-blue-600 rounded-2xl text-[9px] md:text-[10px] font-black uppercase tracking-widest hover:bg-blue-500 transition-all shadow-lg shadow-blue-600/20 py-3 md:py-0">
              <FiPlus size={14} /> Add Service
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <AnimatePresence>
            {filteredServices.map((s) => (
              <motion.div
                key={s.id}
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={`border rounded-[1.5rem] md:rounded-[2rem] transition-all overflow-hidden ${expanded === s.id ? 'bg-zinc-900/40 border-white/10' : 'bg-zinc-950/40 border-white/5 hover:border-zinc-700'}`}
              >
                <div 
                  className="p-4 md:p-5 flex items-center justify-between cursor-pointer"
                  onClick={() => setExpanded(expanded === s.id ? null : s.id)}
                >
                  <div className="flex items-center gap-3 md:gap-4 flex-grow">
                    <input
                      onClick={(e) => e.stopPropagation()}
                      className="bg-transparent text-sm font-bold tracking-tight outline-none border-b border-transparent focus:border-blue-500 pb-0.5 w-full max-w-[120px] md:max-w-[200px]"
                      value={s.name}
                      onChange={e => updateServiceField(s.id, "name", e.target.value)}
                    />
                    <span className="text-[8px] md:text-[10px] font-bold text-zinc-600 uppercase tracking-widest bg-white/5 px-2 py-1 rounded-md">
                      {s.plans.length} Items
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2 md:gap-4">
                    <button 
                      onClick={(e) => { e.stopPropagation(); removeService(s.id); }}
                      className="text-zinc-600 hover:text-red-500 transition-colors p-1"
                    >
                      <FiTrash2 size={16} />
                    </button>
                    <div className="text-zinc-500">
                      {expanded === s.id ? <FiChevronUp size={20} /> : <FiChevronDown size={20} />}
                    </div>
                  </div>
                </div>

                <AnimatePresence>
                  {expanded === s.id && (
                    <motion.div 
                      initial={{ height: 0 }}
                      animate={{ height: 'auto' }}
                      exit={{ height: 0 }}
                      className="border-t border-white/5 p-4 md:p-5 bg-black/20"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Category</label>
                          <select
                            className="w-full bg-zinc-900/50 border border-white/5 rounded-xl py-2 px-3 text-xs font-bold uppercase outline-none focus:border-blue-500"
                            value={s.category || "Other"}
                            onChange={(e) => updateServiceField(s.id, "category", e.target.value)}
                          >
                            {categories.map(c => <option key={c} value={c} className="bg-zinc-900">{c}</option>)}
                          </select>
                        </div>
                        
                        <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase tracking-widest text-amber-500 flex items-center gap-1">
                            <FiInfo size={10}/> Service Note
                          </label>
                          <input
                            className="w-full bg-zinc-900/50 border border-white/5 rounded-xl py-2 px-3 text-xs font-bold outline-none focus:border-amber-500/50 transition-all placeholder:text-zinc-700"
                            placeholder="e.g. Instant via Player ID or Only for US region"
                            value={s.serviceNote || ""}
                            onChange={(e) => updateServiceField(s.id, "serviceNote", e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="space-y-3">
                        {s.plans.map((p, pi) => {
                          const planProfit = (+p.sellPrice || 0) - (+p.discount || 0) - (+p.costPrice || 0);
                          const isStock = p.inStock !== false;
                          const isCoin = p.type === "Coins" || p.type === "Top-Up";

                          return (
                            <div key={pi} className={`grid grid-cols-1 md:grid-cols-8 gap-3 md:gap-4 p-4 rounded-2xl border items-center transition-colors ${isCoin ? 'bg-amber-500/5 border-amber-500/10' : 'bg-zinc-900/50 border-white/5'}`}>
                              <div className="space-y-1">
                                <label className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">{isCoin ? 'Units' : 'Plan Name'}</label>
                                <input
                                  className="w-full bg-transparent text-xs font-bold outline-none"
                                  value={p.label}
                                  onChange={e => updatePlanField(s.id, s.plans, pi, "label", e.target.value)}
                                />
                              </div>
                              <div className="space-y-1">
                                <label className={`text-[8px] font-black uppercase tracking-widest flex items-center gap-1 ${isCoin ? 'text-amber-500' : 'text-blue-500'}`}>
                                  {isCoin ? <FiDatabase size={8}/> : <FiPackage size={8}/>} Type
                                </label>
                                <select
                                  className="w-full bg-transparent text-xs font-bold outline-none uppercase"
                                  value={p.type || "Full Account"}
                                  onChange={e => updatePlanField(s.id, s.plans, pi, "type", e.target.value)}
                                >
                                  {planTypes.map(t => <option key={t} value={t} className="bg-zinc-900">{t}</option>)}
                                </select>
                              </div>
                              <div className="space-y-1">
                                <label className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">Cost ($)</label>
                                <input
                                  className="w-full bg-transparent text-xs font-bold outline-none text-red-400"
                                  value={p.costPrice}
                                  onChange={e => updatePlanField(s.id, s.plans, pi, "costPrice", e.target.value)}
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">Sell ($)</label>
                                <input
                                  className="w-full bg-transparent text-xs font-bold outline-none text-emerald-400"
                                  value={p.sellPrice}
                                  onChange={e => updatePlanField(s.id, s.plans, pi, "sellPrice", e.target.value)}
                                />
                              </div>

                              <div className="space-y-1 bg-amber-500/5 p-1 rounded-lg border border-amber-500/10">
                                <label className="text-[8px] font-black text-amber-500 uppercase tracking-widest flex items-center gap-1">
                                  <FiPercent size={8}/> Discount
                                </label>
                                <input
                                  className="w-full bg-transparent text-xs font-black outline-none text-amber-500"
                                  value={p.discount || "0"}
                                  onChange={e => updatePlanField(s.id, s.plans, pi, "discount", e.target.value)}
                                />
                              </div>

                              <div className="space-y-1">
                                <label className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">Profit</label>
                                <div className={`text-xs font-black ${planProfit >= 0 ? 'text-blue-400' : 'text-red-500'}`}>
                                  ${planProfit.toFixed(2)}
                                </div>
                              </div>

                              <div className="space-y-1">
                                <label className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">Stock</label>
                                <button 
                                  onClick={() => updatePlanField(s.id, s.plans, pi, "inStock", !isStock)}
                                  className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border transition-all text-[9px] font-bold uppercase ${isStock ? 'border-emerald-500/20 text-emerald-500 bg-emerald-500/5' : 'border-red-500/20 text-red-500 bg-red-500/5'}`}
                                >
                                  <div className={`w-1.5 h-1.5 rounded-full ${isStock ? 'bg-emerald-500' : 'bg-red-500'}`} />
                                  {isStock ? 'In Stock' : 'Out'}
                                </button>
                              </div>
                              <div className="space-y-1 flex flex-col justify-between">
                                <select
                                  className="bg-transparent text-[10px] font-black uppercase outline-none cursor-pointer text-zinc-400"
                                  value={p.duration}
                                  onChange={e => updatePlanField(s.id, s.plans, pi, "duration", e.target.value)}
                                >
                                  {durations.map(d => <option key={d} value={d} className="bg-zinc-900">{d}</option>)}
                                </select>
                                <button onClick={() => removePlan(s, pi)} className="text-zinc-600 hover:text-red-500 transition-colors mt-1">
                                  <FiTrash2 size={14} />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <div className="mt-6 flex flex-col md:flex-row justify-between items-center gap-4">
                        <button 
                          onClick={() => addPlan(s)}
                          className="w-full md:w-auto flex items-center justify-center gap-2 py-3 px-4 md:px-0 md:py-0 text-[10px] font-black uppercase tracking-widest text-blue-500 hover:text-blue-400 transition-colors bg-white/5 md:bg-transparent rounded-xl md:rounded-none"
                        >
                          <FiPlus /> Add Item
                        </button>
                        
                        <div className="w-full md:w-auto flex items-center justify-between md:justify-end gap-3 bg-zinc-900 px-4 py-3 rounded-xl border border-white/5">
                          <span className="text-[9px] md:text-[10px] font-black text-zinc-500 uppercase tracking-widest">Total Srv. Profit</span>
                          <span className="text-sm font-black text-emerald-400">
                            ${(s.plans.reduce((acc, p) => acc + ((+p.sellPrice || 0) - (+p.discount || 0) - (+p.costPrice || 0)), 0)).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {filteredServices.length === 0 && (
          <div className="py-20 text-center opacity-20">
            <FiSettings className="mx-auto mb-4 animate-spin-slow" size={40} />
            <p className="text-xs font-black uppercase tracking-widest">No matching records found</p>
          </div>
        )}
      </main>

      <footer className="mt-20 border-t border-white/5 py-10 opacity-30 text-center px-4">
        <p className="text-[8px] md:text-[9px] font-black uppercase tracking-[0.3em] md:tracking-[0.5em]">Cedars Tech Admin Framework v2.1 • Ace 2026</p>
      </footer>
    </div>
  );
}