import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiShoppingBag, FiSearch, FiUser, FiZap, FiSun, FiMoon, FiArrowUpRight, FiFilter } from "react-icons/fi";
import { HiOutlineSparkles } from "react-icons/hi2";
import { useNavigate } from "react-router-dom";
import { db } from "../../firebase.js";
import { collection, onSnapshot } from "firebase/firestore";

import WhiteLogo from '../assets/logo-white.png';
import BlackLogo from '../assets/logo-black.png';

export default function Prices() {
  const nav = useNavigate();
  const [services, setServices] = useState([]);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("priceLow");
  const [duration, setDuration] = useState("All");
  const [darkMode, setDarkMode] = useState(true);

  useEffect(() => {
    const colRef = collection(db, "services");
    const unsubscribe = onSnapshot(colRef, (snapshot) => {
      setServices(snapshot.docs.map(d => ({ 
        id: d.id, 
        ...d.data(), 
        plans: d.data().plans || [] 
      })));
    });
    return () => unsubscribe();
  }, []);

  const processedServices = useMemo(() => {
    let bestDealId = null;
    let maxProfit = 0;

    services.forEach(s => {
      s.plans.forEach(p => {
        if (p.costPrice && p.sellPrice) {
          const profit = ((p.sellPrice - p.costPrice) / p.costPrice) * 100;
          if (profit > maxProfit) {
            maxProfit = profit;
            bestDealId = `${s.id}-${p.label}`;
          }
        }
      });
    });

    const filtered = services.map(s => {
      let plans = [...s.plans].filter(p => 
        s.name.toLowerCase().includes(search.toLowerCase()) || 
        (p.label || "").toLowerCase().includes(search.toLowerCase())
      );
      if (duration !== "All") plans = plans.filter(p => p.duration === duration);
      plans.sort((a, b) => {
        if (sortBy === "priceLow") return (+a.sellPrice || 0) - (+b.sellPrice || 0);
        if (sortBy === "priceHigh") return (+b.sellPrice || 0) - (+a.sellPrice || 0);
        return (a.label || "").localeCompare(b.label || "");
      });
      return { ...s, plans };
    }).filter(s => s.plans.length > 0);

    return { filtered, bestDealId };
  }, [services, search, sortBy, duration]);

  const t = {
    bg: darkMode ? "bg-[#000000]" : "bg-[#ffffff]",
    text: darkMode ? "text-zinc-100" : "text-zinc-900",
    card: darkMode ? "bg-zinc-950/40 border-zinc-800/40" : "bg-zinc-50 border-zinc-200",
    item: darkMode ? "bg-zinc-900/40 border-white/[0.03]" : "bg-white border-zinc-200",
    accent: "from-blue-500 to-indigo-600",
    glass: "backdrop-blur-md"
  };

  return (
    <div className={`min-h-screen transition-all duration-500 ${t.bg} ${t.text} antialiased selection:bg-blue-500/30 font-sans`}>
      
      <nav className={`fixed top-0 w-full z-50 border-b ${darkMode ? 'border-white/5' : 'border-zinc-200'} ${t.glass}`}>
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div 
            className="flex items-center gap-3 group cursor-pointer" 
            onClick={() => window.scrollTo({top:0, behavior:'smooth'})}
          >
            <div className="relative w-20 h-20 flex items-center justify-center">
              <img 
                src={darkMode ? WhiteLogo : BlackLogo} 
                alt="Cedars Tech" 
                className="w-full h-full object-contain transition-all duration-300"
              />
            </div>
            <span className="text-[11px] font-black tracking-[0.4em] uppercase opacity-80 group-hover:opacity-100 transition-opacity">
              Cedars Tech
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={() => setDarkMode(!darkMode)} 
              className="p-2.5 rounded-xl hover:bg-zinc-500/10 transition-all active:scale-95 text-inherit"
            >
              {darkMode ? <FiSun size={18} /> : <FiMoon size={18} />}
            </button>
            <button 
              onClick={() => nav("/login")} 
              className="p-2.5 rounded-xl border border-transparent hover:border-zinc-500/20 hover:bg-zinc-500/5 transition-all text-inherit"
            >
              <FiUser size={18} />
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 pt-32 pb-20">
        
        <div className="relative mb-14 ml-1">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="absolute -top-16 left-0 w-48 h-48 bg-blue-600/10 blur-[100px] rounded-full pointer-events-none" 
          />
          <motion.h1 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-6xl font-black tracking-tighter mb-4"
          >
            Digital <span className="bg-gradient-to-r from-blue-500 to-indigo-400 bg-clip-text text-transparent">Marketplace</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className={`text-sm md:text-lg ${darkMode ? 'text-zinc-500' : 'text-zinc-400'} font-medium max-w-xl leading-relaxed`}
          >
            Premium subscriptions and digital assets for the Lebanese tech ecosystem. Instantly delivered, professionally managed.
          </motion.p>
        </div>

        <div className="flex flex-col lg:flex-row gap-4 mb-12">
          <div className={`relative flex-grow lg:max-w-md ${t.glass} rounded-2xl border ${darkMode ? 'border-white/10' : 'border-zinc-200'} shadow-xl shadow-black/5`}>
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={20} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search services (Netflix, ChatGPT...)"
              className="w-full bg-transparent pl-12 pr-4 py-4 text-base outline-none focus:ring-2 ring-blue-500/20 transition-all rounded-2xl"
            />
          </div>

          <div className="flex gap-3">
            <div className={`flex items-center gap-1 p-1.5 rounded-2xl border ${darkMode ? 'border-white/10' : 'border-zinc-200'} ${t.glass}`}>
              {['All', 'Monthly', 'Yearly'].map((d) => (
                <button
                  key={d}
                  onClick={() => setDuration(d)}
                  className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${duration === d ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'hover:bg-zinc-500/10'}`}
                >
                  {d}
                </button>
              ))}
            </div>
            <select
              className={`px-4 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest border outline-none cursor-pointer bg-transparent transition-all ${darkMode ? 'border-white/10' : 'border-zinc-200'}`}
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
            >
              <option value="priceLow" className={darkMode ? "bg-black" : "bg-white"}>Sort: Lowest</option>
              <option value="priceHigh" className={darkMode ? "bg-black" : "bg-white"}>Sort: Highest</option>
            </select>
          </div>
        </div>

        <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence mode="popLayout">
            {processedServices.filtered.map((s) => (
              <motion.div
                layout
                key={s.id}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className={`group border p-5 rounded-[1.5rem] transition-all duration-300 ${t.card} hover:border-blue-500/30 shadow-sm`}
              >
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-sm font-bold tracking-tight uppercase mb-1">{s.name}</h2>
                    {s.featured && (
                      <div className="flex items-center gap-1 text-blue-400">
                        <HiOutlineSparkles size={10} />
                        <span className="text-[8px] font-black uppercase tracking-tighter">Verified</span>
                      </div>
                    )}
                  </div>
                  <FiShoppingBag className="text-zinc-600 group-hover:text-blue-500 transition-colors" size={14} />
                </div>

                <div className="space-y-2">
                  {s.plans.map((p, i) => {
                    const isBestDeal = `${s.id}-${p.label}` === processedServices.bestDealId;
                    return (
                      <div key={i} className={`flex items-center justify-between p-3 rounded-xl border ${t.item} hover:bg-zinc-500/5 transition-all`}>
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide">{p.label}</span>
                          {isBestDeal && <span className="text-[8px] text-emerald-500 font-black italic">BEST DEAL</span>}
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-black tracking-tight">${p.sellPrice}</span>
                          <a
                            href={`https://wa.me/96181090757?text=Hi%20Ace,%20I'd%20like%20to%20order%20${encodeURIComponent(s.name + " " + p.label)}`}
                            target="_blank"
                            rel="noreferrer"
                            className="w-7 h-7 flex items-center justify-center rounded-lg bg-gradient-to-br from-zinc-100 to-zinc-300 dark:from-zinc-800 dark:to-zinc-900 shadow-sm hover:from-blue-500 hover:to-indigo-600 group/btn transition-all active:scale-90"
                          >
                            <FiArrowUpRight className="text-zinc-900 dark:text-zinc-100 group-hover/btn:text-white transition-colors" size={12} />
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        {processedServices.filtered.length === 0 && (
          <div className="py-24 text-center opacity-30">
            <FiFilter className="mx-auto mb-4" size={32} />
            <p className="text-[11px] font-black uppercase tracking-widest">No matching services</p>
          </div>
        )}
      </main>

      <footer className={`py-12 border-t ${darkMode ? 'border-white/5' : 'border-zinc-100'}`}>
        <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-6 opacity-40">
          <span className="text-[9px] font-black uppercase tracking-[0.4em]">© {new Date().getFullYear()} Cedars Tech. All rights reserved.</span>
          <div className="flex gap-8 text-[9px] font-black uppercase tracking-[0.4em]">
            <a href="#" className="hover:text-blue-500 transition-colors">Instagram</a>
            <a href="#" className="hover:text-blue-500 transition-colors">WhatsApp</a>
          </div>
        </div>
      </footer>
    </div>
  );
}