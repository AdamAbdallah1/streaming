import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FiShoppingBag, FiSearch, FiUser, FiZap, FiSun, FiMoon, 
  FiArrowUpRight, FiFilter, FiInfo, FiX, FiClock 
} from "react-icons/fi";
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
  const [category, setCategory] = useState("All");
  const [categories, setCategories] = useState(["All"]);
  const [darkMode, setDarkMode] = useState(true);
  const [showPayment, setShowPayment] = useState(false);
  const [currency, setCurrency] = useState("USD");
  const [recentOrder, setRecentOrder] = useState(null);
  const lbpRate = 89500;

  useEffect(() => {
    const colRef = collection(db, "services");
    const unsubscribe = onSnapshot(colRef, (snapshot) => {
      const fetched = snapshot.docs.map(d => ({
        id: d.id,
        ...d.data(),
        plans: d.data().plans || [],
        category: d.data().category || "Other"
      }));
      setServices(fetched);

      // Collect unique categories dynamically
      const uniqueCats = Array.from(new Set(fetched.map(s => s.category || "Other")));
      setCategories(["All", ...uniqueCats]);
    });

    // Floating Orders Logic
    const names = ["Adam", "Rami", "Samer", "Laila", "Maya", "Hassan"];
    const items = ["Netflix", "ChatGPT", "Spotify", "Canva"];
    const interval = setInterval(() => {
      setRecentOrder({
        name: names[Math.floor(Math.random() * names.length)],
        item: items[Math.floor(Math.random() * items.length)]
      });
      setTimeout(() => setRecentOrder(null), 4000);
    }, 15000);

    return () => { unsubscribe(); clearInterval(interval); };
  }, []);

  const processedServices = useMemo(() => {
    let bestDealId = null;
    let maxProfit = 0;

    const filtered = services.map(s => {
      const monthlyPlan = s.plans.find(p => p.duration === "Monthly");
      const yearlyPlan = s.plans.find(p => p.duration === "Yearly");
      let savingsPercent = 0;
      if (monthlyPlan && yearlyPlan) {
        const expectedYearly = monthlyPlan.sellPrice * 12;
        savingsPercent = Math.round(((expectedYearly - yearlyPlan.sellPrice) / expectedYearly) * 100);
      }

      s.plans.forEach(p => {
        if (p.costPrice && p.sellPrice) {
          const profit = ((p.sellPrice - p.costPrice) / p.costPrice) * 100;
          if (profit > maxProfit) {
            maxProfit = profit;
            bestDealId = `${s.id}-${p.label}`;
          }
        }
      });

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

      return { ...s, plans, savingsPercent };
    }).filter(s => {
      const matchesSearch = s.plans.length > 0;
      const matchesCategory = category === "All" || s.category === category;
      return matchesSearch && matchesCategory;
    });

    return { filtered, bestDealId };
  }, [services, search, sortBy, duration, category]);

  const formatPrice = (usd) => {
    if (currency === "LBP") return (usd * lbpRate).toLocaleString() + " L.L.";
    return "$" + usd;
  };

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
      
      {/* Floating Recent Order */}
      <AnimatePresence>
        {recentOrder && (
          <motion.div 
            initial={{ opacity: 0, y: 20, x: 20 }} animate={{ opacity: 1, y: 0, x: 0 }} exit={{ opacity: 0, scale: 0.9 }}
            className="fixed bottom-6 right-6 z-[60] p-4 rounded-2xl bg-zinc-900/90 border border-white/10 backdrop-blur-xl shadow-2xl flex items-center gap-3"
          >
            <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-500"><FiZap size={14} /></div>
            <div>
              <p className="text-[10px] font-black uppercase text-white">{recentOrder.name} just bought</p>
              <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">{recentOrder.item} Premium</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showPayment && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowPayment(false)} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className={`relative w-full max-w-md p-6 rounded-[2rem] border ${darkMode ? 'border-white/10 bg-zinc-950' : 'border-zinc-200 bg-white shadow-2xl'}`}>
              <button onClick={() => setShowPayment(false)} className="absolute top-6 right-6 opacity-50 hover:opacity-100"><FiX size={20}/></button>
              <h3 className="text-xl font-black mb-6 uppercase tracking-tighter">Payment Methods</h3>
              <div className="space-y-4">
                {[
                  { name: "Whish Money", detail: "Contact for ID: +961 81 090 757", color: "text-blue-500" },
                  { name: "OMT", detail: "Standard Transfer", color: "text-orange-500" },
                  { name: "USDT", detail: "Binance / TRC20", color: "text-emerald-500" }
                ].map((m, i) => (
                  <div key={i} className={`p-4 rounded-2xl border ${darkMode ? 'border-white/5 bg-white/5' : 'border-zinc-100 bg-zinc-50'}`}>
                    <p className={`text-[10px] font-black uppercase tracking-widest ${m.color} mb-1`}>{m.name}</p>
                    <p className="text-sm font-bold opacity-80">{m.detail}</p>
                  </div>
                ))}
              </div>
              <p className="mt-6 text-[9px] font-bold opacity-40 uppercase text-center tracking-widest">Screenshot receipt and send to WhatsApp</p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <nav className={`fixed top-0 w-full z-50 border-b ${darkMode ? 'border-white/5' : 'border-zinc-200'} ${t.glass}`}>
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 md:gap-3 group cursor-pointer" onClick={() => window.scrollTo({top:0, behavior:'smooth'})}>
            <div className="relative w-8 h-8 md:w-10 md:h-10 flex items-center justify-center">
              <img src={darkMode ? WhiteLogo : BlackLogo} alt="Cedars Tech" className="w-full h-full object-contain" />
            </div>
            <span className="text-[9px] md:text-[11px] font-black tracking-[0.2em] md:tracking-[0.4em] uppercase opacity-80">Cedars Tech</span>
          </div>

          <div className="flex items-center gap-1 md:gap-2">
            <button onClick={() => setCurrency(currency === "USD" ? "LBP" : "USD")} className={`px-3 py-1.5 rounded-lg text-[9px] font-black border transition-all ${darkMode ? 'border-white/10 hover:bg-white/5' : 'border-zinc-200 hover:bg-zinc-50'}`}>{currency}</button>
            <button onClick={() => setShowPayment(true)} className="p-2 md:p-2.5 rounded-xl hover:bg-zinc-500/10 transition-all text-inherit"><FiInfo size={18} /></button>
            <button onClick={() => setDarkMode(!darkMode)} className="p-2 md:p-2.5 rounded-xl hover:bg-zinc-500/10 transition-all text-inherit">{darkMode ? <FiSun size={18} /> : <FiMoon size={18} />}</button>
            <button onClick={() => nav("/login")} className="p-2 md:p-2.5 rounded-xl border border-transparent hover:border-zinc-500/20 hover:bg-zinc-500/5 transition-all text-inherit"><FiUser size={18} /></button>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 pt-28 md:pt-32 pb-20">
        
        {/* Filters */}
        <div className="flex flex-col lg:flex-row gap-4 mb-8 md:mb-12">
          <div className={`relative flex-grow lg:max-w-md ${t.glass} rounded-2xl border ${darkMode ? 'border-white/10' : 'border-zinc-200'}`}>
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search services..." className="w-full bg-transparent pl-12 pr-4 py-3.5 md:py-4 text-sm md:text-base outline-none rounded-2xl" />
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            {/* Duration Filter */}
            <div className={`flex items-center gap-1 p-1.5 rounded-2xl border ${darkMode ? 'border-white/10' : 'border-zinc-200'} ${t.glass}`}>
              {['All', 'Monthly', 'Yearly'].map((d) => (
                <button key={d} onClick={() => setDuration(d)} className={`flex-1 sm:flex-none px-4 md:px-6 py-2.5 rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all ${duration === d ? 'bg-blue-600 text-white shadow-lg' : 'hover:bg-zinc-500/10'}`}>{d}</button>
              ))}
            </div>

            {/* Category Filter */}
            <div className={`flex items-center gap-1 p-1.5 rounded-2xl border ${darkMode ? 'border-white/10' : 'border-zinc-200'} ${t.glass}`}>
              {categories.map((c) => (
                <button key={c} onClick={() => setCategory(c)} className={`flex-1 sm:flex-none px-4 md:px-6 py-2.5 rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all ${category === c ? 'bg-blue-600 text-white shadow-lg' : 'hover:bg-zinc-500/10'}`}>{c}</button>
              ))}
            </div>

            <select className={`px-4 py-3 rounded-2xl text-[9px] md:text-[10px] font-black uppercase border bg-transparent ${darkMode ? 'border-white/10' : 'border-zinc-200'}`} value={sortBy} onChange={e => setSortBy(e.target.value)}>
              <option value="priceLow" className={darkMode ? "bg-black" : "bg-white"}>Sort: Lowest</option>
              <option value="priceHigh" className={darkMode ? "bg-black" : "bg-white"}>Sort: Highest</option>
            </select>
          </div>
        </div>

        {/* Services Grid */}
        <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence mode="popLayout">
            {processedServices.filtered.map((s) => (
              <motion.div layout key={s.id} initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} className={`group border p-4 md:p-5 rounded-[1.5rem] md:rounded-[2rem] transition-all duration-300 ${t.card} hover:border-blue-500/30`}>
                <div className="flex justify-between items-start mb-5 md:mb-6">
                  <div>
                    <h2 className="text-xs md:text-sm font-bold tracking-tight uppercase mb-1">{s.name}</h2>
                    <div className="flex gap-2 items-center">
                      <div className="flex items-center gap-1.5">
                        <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[7px] font-black uppercase text-zinc-500">In Stock</span>
                      </div>
                      {s.savingsPercent > 0 && (
                        <span className="text-[7px] font-black uppercase bg-emerald-500/10 text-emerald-500 px-1.5 py-0.5 rounded">Save {s.savingsPercent}%</span>
                      )}
                    </div>
                  </div>
                  <FiShoppingBag className="text-zinc-600 group-hover:text-blue-500 transition-colors" size={14} />
                </div>

                <div className="space-y-2">
                  {s.plans.map((p, i) => {
                    const isBestDeal = `${s.id}-${p.label}` === processedServices.bestDealId;
                    return (
                      <div key={i} className={`flex items-center justify-between p-3 rounded-xl border ${t.item} hover:bg-zinc-500/5 transition-all`}>
                        <div className="flex flex-col">
                          <span className="text-[9px] md:text-[10px] font-bold text-zinc-400 uppercase tracking-wide">{p.label}</span>
                          {isBestDeal && <span className="text-[7px] md:text-[8px] text-blue-500 font-black italic tracking-tighter uppercase">Recommended</span>}
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs md:text-sm font-black tracking-tight">{formatPrice(p.sellPrice)}</span>
                          <a
                            href={`https://wa.me/96181090757?text=Hello,%20I'd%20like%20to%20order%20${encodeURIComponent(s.name + " " + p.label)}`}
                            target="_blank" rel="noreferrer"
                            className="w-7 h-7 flex items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-blue-600 transition-all active:scale-90 shadow-sm"
                          >
                            <FiArrowUpRight className="text-zinc-900 dark:text-zinc-100 hover:text-white transition-colors" size={12} />
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
          <div className="py-20 text-center opacity-30">
            <FiFilter className="mx-auto mb-4" size={28} />
            <p className="text-[10px] md:text-[11px] font-black uppercase tracking-widest">No matching services</p>
          </div>
        )}
      </main>

      <footer className={`py-10 md:py-12 border-t ${darkMode ? 'border-white/5' : 'border-zinc-100'}`}>
        <div className="max-w-6xl mx-auto px-4 flex flex-col items-center text-center md:flex-row md:justify-between opacity-40">
          <span className="text-[8px] md:text-[9px] font-black uppercase tracking-[0.2em]">© {new Date().getFullYear()} Cedars Tech Lebanon.</span>
          <div className="flex gap-6 text-[8px] md:text-[9px] font-black uppercase tracking-[0.2em]">
            <a href="#" className="hover:text-blue-500">Instagram</a>
            <a href="#" className="hover:text-blue-500">WhatsApp</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
