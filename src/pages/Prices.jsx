import { useEffect, useState, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FiShoppingBag, FiSearch, FiUser, FiZap, FiSun, FiMoon, 
  FiArrowUpRight, FiFilter, FiInfo, FiX, FiClock, FiActivity, FiCheckCircle, FiChevronLeft,
  FiCopy, FiShare2, FiSlash, FiMessageSquare, FiTag, FiStar, FiTrendingUp, FiBox, FiSmartphone, FiMail,
  FiShield, FiLock, FiHeadphones, FiPlay, FiCpu, FiGlobe, FiLayers, FiPlus, FiPlusCircle
} from "react-icons/fi";
import { useNavigate, useLocation } from "react-router-dom";
import { db } from "../../firebase.js";
import { collection, onSnapshot } from "firebase/firestore";

import WhiteLogo from '../assets/logo-white.png';
import BlackLogo from '../assets/logo-black.png';

// --- 11. CATEGORY CONFIG ---
const categoryConfig = {
  "Streaming": { icon: <FiPlay />, color: "text-red-500", bg: "bg-red-500/10" },
  "Gaming": { icon: <FiCpu />, color: "text-purple-500", bg: "bg-purple-500/10" },
  "Design": { icon: <FiLayers />, color: "text-pink-500", bg: "bg-pink-500/10" },
  "VPN": { icon: <FiShield />, color: "text-cyan-500", bg: "bg-cyan-500/10" },
  "Web": { icon: <FiGlobe />, color: "text-blue-500", bg: "bg-blue-500/10" },
  "Other": { icon: <FiBox />, color: "text-zinc-500", bg: "bg-zinc-500/10" }
};

export default function Prices() {
  const nav = useNavigate();
  const location = useLocation();
  const [services, setServices] = useState([]);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("priceLow");
  const [duration, setDuration] = useState("All");
  const [category, setCategory] = useState("All");
  const [categories, setCategories] = useState(["All"]);
  const [darkMode, setDarkMode] = useState(true);
  const [showPayment, setShowPayment] = useState(false);
  const [currency, setCurrency] = useState("USD");
  const [selectedService, setSelectedService] = useState(null);
  const [subType, setSubType] = useState("All");
  const [copyStatus, setCopyStatus] = useState(null);
  const [activeTooltip, setActiveTooltip] = useState(null); 
  const [onlyInStock, setOnlyInStock] = useState(false);
  const [onlyBestDeals, setOnlyBestDeals] = useState(false);

  // --- NEW STATES ---
  const [showCheckout, setShowCheckout] = useState(false);
  const [pendingOrder, setPendingOrder] = useState(null);
  const [customerInfo, setCustomerInfo] = useState({ email: "", phone: "" });
  const [bundle, setBundle] = useState([]); // 13. Bundle Builder
  const [showHelp, setShowHelp] = useState(false); // Confusion Detector
  const lastInteractionTime = useRef(Date.now());

  const lbpRate = 89500;

  const typeDescriptions = {
    "Full Account": ["Full account access", "Change password", "No interruptions", "Works on all devices"],
    "1 User": ["Private Profile", "Shared Login", "Do not change password", "4K Ultra HD"],
    "Private": ["Exclusive access", "Customized to your email", "Warranty included", "All regions"],
    "Shared": ["Most affordable", "Standard support", "Quick delivery", "No interruptions"],
    "Standard": ["Official activation", "Full duration", "Replacement guarantee", "Secure"]
  };

  // 14. CONFUSION DETECTOR
  useEffect(() => {
    const timer = setInterval(() => {
      if (selectedService && (Date.now() - lastInteractionTime.current > 15000)) {
        setShowHelp(true);
      }
    }, 5000);
    return () => clearInterval(timer);
  }, [selectedService]);

  // 12. MEMORY-BASED PERSONALIZATION
  useEffect(() => {
    const pref = localStorage.getItem("preferredType");
    if (pref) setSubType(pref);
  }, []);

  useEffect(() => {
    const handleClickOutside = () => setActiveTooltip(null);
    if (activeTooltip) {
      window.addEventListener("click", handleClickOutside);
    }
    return () => window.removeEventListener("click", handleClickOutside);
  }, [activeTooltip]);

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
      const uniqueCats = Array.from(new Set(fetched.map(s => s.category || "Other")));
      setCategories(["All", ...uniqueCats]);

      const params = new URLSearchParams(window.location.search);
      const serviceId = params.get("s");
      if (serviceId) {
        const found = fetched.find(s => 
          s.id === serviceId || 
          s.name.toLowerCase().replace(/\s+/g, '-') === serviceId.toLowerCase()
        );
        if (found) setSelectedService(found);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleSelectService = (service) => {
    setSelectedService(service);
    lastInteractionTime.current = Date.now();
    const slug = service.name.toLowerCase().replace(/\s+/g, '-');
    const newUrl = `${window.location.pathname}?s=${slug}`;
    window.history.pushState({ path: newUrl }, '', newUrl);
  };

  const handleBack = () => {
    setSelectedService(null);
    setShowHelp(false);
    window.history.replaceState(null, '', window.location.pathname);
  };

  // 12. Preference storage
  const handleTypeChange = (type) => {
    setSubType(type);
    localStorage.setItem("preferredType", type);
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopyStatus(id);
    setTimeout(() => setCopyStatus(null), 2000);
  };

  // 13. STACK & SAVE LOGIC
  const addToBundle = (plan, service) => {
    setBundle([...bundle, { ...plan, serviceName: service.name, id: Date.now() }]);
  };

  const bundleTotal = useMemo(() => {
    const raw = bundle.reduce((acc, p) => acc + ((+p.sellPrice || 0) - (+p.discount || 0)), 0);
    return bundle.length >= 3 ? raw * 0.9 : raw; // 10% off for 3+ items
  }, [bundle]);

  const initiateOrder = (plan, service) => {
    setPendingOrder({ plan, service });
    setShowCheckout(true);
  };

  const finalizeOrder = (e) => {
    e.preventDefault();
    const { plan, service } = pendingOrder;
    const finalPrice = (+plan.sellPrice || 0) - (+plan.discount || 0);
    const orderID = Math.floor(1000 + Math.random() * 9000);
    
    const message = `🚀 NEW ORDER: #${orderID}
---
📦 ASSET: ${service.name}
💎 PLAN: ${plan.label} (${plan.type || 'Standard'})
⏳ DURATION: ${plan.duration}
💰 TOTAL: ${formatPrice(finalPrice)}
---
👤 CUSTOMER:
📧 EMAIL: ${customerInfo.email}
📱 PHONE: ${customerInfo.phone}`;

    const whatsappUrl = `https://wa.me/96181090757?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
    setShowCheckout(false);
  };

  const processedServices = useMemo(() => {
    const filtered = services.map(s => {
      let plans = [...s.plans].filter(p => {
        const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase()) || (p.label || "").toLowerCase().includes(search.toLowerCase());
        const matchesStock = onlyInStock ? p.inStock !== false : true;
        const matchesDeals = onlyBestDeals ? (p.discount && parseFloat(p.discount) > 0) : true;
        return matchesSearch && matchesStock && matchesDeals;
      });

      if (duration !== "All") plans = plans.filter(p => p.duration === duration);
      
      // 12. Move preferred type to top
      const pref = localStorage.getItem("preferredType");
      plans.sort((a, b) => {
        if (a.type === pref) return -1;
        if (b.type === pref) return 1;
        if (sortBy === "priceLow") return (+a.sellPrice || 0) - (+b.sellPrice || 0);
        return (+b.sellPrice || 0) - (+a.sellPrice || 0);
      });
      return { ...s, plans };
    }).filter(s => {
      const matchesSearch = s.plans.length > 0;
      const matchesCategory = category === "All" || s.category === category;
      return matchesSearch && matchesCategory;
    });
    return { filtered };
  }, [services, search, sortBy, duration, category, onlyInStock, onlyBestDeals]);

  const availableSubTypes = useMemo(() => {
    if (!selectedService) return ["All"];
    const types = selectedService.plans.map(p => p.type).filter(t => t && t.trim() !== "");
    return ["All", ...new Set(types)];
  }, [selectedService]);

  const formatPrice = (usd) => {
    if (currency === "LBP") return (usd * lbpRate).toLocaleString() + " L.L.";
    return "$" + usd;
  };

  const t = {
    bg: darkMode ? "bg-[#050505]" : "bg-[#fafafa]",
    text: darkMode ? "text-zinc-100" : "text-zinc-900",
    card: darkMode ? "bg-zinc-900/40 border-white/[0.05]" : "bg-white border-zinc-200 shadow-sm",
    item: darkMode ? "bg-white/[0.02] border-white/[0.05]" : "bg-zinc-50 border-zinc-100",
    glass: "backdrop-blur-xl"
  };

  return (
    <div className={`min-h-screen transition-all duration-700 ${t.bg} ${t.text} antialiased selection:bg-blue-500/30 font-sans`}>
      
      <nav className={`fixed top-0 w-full z-50 border-b ${darkMode ? 'border-white/[0.05]' : 'border-zinc-200'} ${t.glass}`}>
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 group cursor-pointer" onClick={() => {handleBack(); window.scrollTo({top:0, behavior:'smooth'})}}>
            <img src={darkMode ? WhiteLogo : BlackLogo} alt="Cedars Tech" className="w-10 h-10 object-contain transition-transform group-hover:scale-110" />
            <span className="hidden md:block text-[11px] font-black tracking-[0.4em] uppercase">Cedars Tech</span>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={() => setCurrency(currency === "USD" ? "LBP" : "USD")} className={`px-3 py-1.5 rounded-lg text-[9px] font-black border transition-all ${darkMode ? 'border-white/10 hover:bg-white/5 text-zinc-400' : 'border-zinc-200 hover:bg-zinc-50'}`}>
              {currency}
            </button>
            <button onClick={() => setDarkMode(!darkMode)} className="p-2 rounded-xl hover:bg-zinc-500/10 transition-all">{darkMode ? <FiSun size={17} /> : <FiMoon size={17} />}</button>
            <button onClick={() => nav("/login")} className="px-4 py-2 rounded-xl bg-blue-600 text-white text-[9px] font-black uppercase tracking-widest">Account</button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 pt-28 pb-32">
        <AnimatePresence mode="wait">
          {!selectedService ? (
            <motion.div key="grid-view" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                  <h1 className="text-4xl md:text-6xl font-black tracking-tighter leading-none uppercase mb-4">
                    Advanced <span className="text-blue-600">Packages.</span>
                  </h1>
                </div>

                <div className="flex flex-col gap-3">
                   <div className={`relative w-full md:w-72 ${t.glass} rounded-xl border ${darkMode ? 'border-white/10' : 'border-zinc-200'}`}>
                      <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" size={15} />
                      <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search services..." className="w-full bg-transparent pl-10 pr-4 py-3 text-[10px] font-bold uppercase tracking-widest outline-none" />
                   </div>
                   <div className="flex gap-2">
                      <button onClick={() => setOnlyInStock(!onlyInStock)} className={`flex-1 py-3 rounded-xl border text-[9px] font-black uppercase tracking-widest transition-all ${onlyInStock ? 'bg-blue-600 border-blue-600 text-white' : 'border-white/5 bg-white/5'}`}>In Stock</button>
                      <button onClick={() => setShowPayment(true)} className="px-4 py-3 rounded-xl border border-white/5 bg-white/5 text-[9px] font-black uppercase tracking-widest">Payments</button>
                   </div>
                </div>
              </div>

              {/* 11. Category Icons */}
              <div className="mb-8 flex flex-wrap gap-1.5">
                {categories.map((c) => {
                    const conf = categoryConfig[c] || categoryConfig["Other"];
                    return (
                        <button key={c} onClick={() => setCategory(c)} className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all border ${category === c ? 'bg-white text-black border-white' : 'border-white/10 text-zinc-500 hover:border-white/30'}`}>
                            {conf.icon} {c}
                        </button>
                    )
                })}
              </div>

              <motion.div layout className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-5 space-y-5">
                {processedServices.filtered.map((s, idx) => (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: idx * 0.03 }}
                    layout key={s.id} onClick={() => handleSelectService(s)}
                    className={`break-inside-avoid cursor-pointer group p-5 rounded-3xl border ${t.card} relative overflow-hidden transition-all duration-500 hover:border-blue-500/30 mb-5`}
                  >
                    <div className="flex justify-between items-start mb-6">
                      <div className="flex flex-col gap-1">
                        <span className={`text-[8px] font-black uppercase tracking-widest ${categoryConfig[s.category]?.color || 'text-blue-500'}`}>{s.category}</span>
                        <h2 className="text-base font-black uppercase tracking-tight leading-none">{s.name}</h2>
                      </div>
                      <FiArrowUpRight size={18} className="opacity-20 group-hover:opacity-100 transition-all" />
                    </div>
                    <p className="text-[10px] font-bold text-zinc-500 uppercase">View Plans & Options</p>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
          ) : (
            <motion.div key="detail-view" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <button onClick={handleBack} className="flex items-center gap-2 mb-8 text-[10px] font-black uppercase opacity-60 hover:opacity-100">
                <FiChevronLeft size={16} /> Back to Assets
              </button>
              
              <div className="mb-10">
                <h1 className="text-5xl md:text-7xl font-black tracking-tighter uppercase mb-6">{selectedService.name}</h1>
                
                {/* Trust Signals (Critical) */}
                <div className="flex flex-wrap items-center gap-6 mb-8 py-4 border-y border-white/5">
                    <div className="flex items-center gap-2 text-[9px] font-black uppercase text-emerald-500"><FiLock size={14}/> Secure Payment</div>
                    <div className="flex items-center gap-2 text-[9px] font-black uppercase text-blue-500"><FiZap size={14}/> Instant Delivery</div>
                    <div className="flex items-center gap-2 text-[9px] font-black uppercase text-orange-500"><FiHeadphones size={14}/> 24/7 Support</div>
                </div>

                <div className="flex flex-wrap gap-2 mb-8">
                  {availableSubTypes.map((type) => (
                    <button 
                      key={type} onClick={() => handleTypeChange(type)}
                      className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border ${subType === type ? 'bg-blue-600 text-white border-blue-600' : 'border-white/10 text-zinc-500 hover:border-white/20'}`}
                    >
                      {type} {localStorage.getItem("preferredType") === type && "✨"}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {selectedService.plans
                  .filter(p => subType === "All" || p.type === subType)
                  .map((p, i) => {
                    const isStock = p.inStock !== false;
                    const finalPriceUSD = (+p.sellPrice || 0) - (+p.discount || 0);

                    return (
                    <div key={i} className={`p-6 rounded-3xl border ${t.item} relative group overflow-hidden ${!isStock && 'opacity-80'}`}>
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-xl font-black uppercase tracking-tight">{p.label}</h3>
                          <span className="text-[9px] font-black text-blue-500 uppercase">{p.type || "Standard"}</span>
                        </div>
                        <span className="text-2xl font-black tracking-tighter">{formatPrice(finalPriceUSD)}</span>
                      </div>
                      
                      {/* 3. "What You Actually Get" Breakdown */}
                      <div className="mb-6 space-y-2">
                        {(typeDescriptions[p.type] || typeDescriptions["Standard"]).map((bullet, idx) => (
                           <div key={idx} className="flex items-center gap-2 text-[9px] font-bold text-zinc-400 uppercase">
                                <FiCheckCircle className="text-emerald-500" size={10} /> {bullet}
                           </div>
                        ))}
                      </div>

                      {/* Risk Reversal */}
                      <div className="flex flex-col gap-1 mb-6 opacity-40">
                         <p className="text-[7px] font-black uppercase tracking-widest">🛡️ Replacement if not working</p>
                         <p className="text-[7px] font-black uppercase tracking-widest">🛠️ Support included</p>
                         <p className="text-[7px] font-black uppercase tracking-widest">💎 No hidden fees</p>
                      </div>

                      <div className="flex gap-2">
                        {isStock ? (
                            <>
                                <button onClick={() => initiateOrder(p, selectedService)} className="flex-1 py-4 flex items-center justify-center gap-2 rounded-2xl bg-white text-black font-black text-[10px] uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all">
                                    Buy Now
                                </button>
                                <button onClick={() => addToBundle(p, selectedService)} className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all">
                                    <FiPlusCircle size={18} />
                                </button>
                            </>
                        ) : (
                            <div className="w-full py-4 text-center text-zinc-500 font-black text-[10px] uppercase border border-white/5 rounded-2xl">Sold Out</div>
                        )}
                      </div>
                    </div>
                  )})}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* 13. Bundle Drawer (Stack & Save) */}
      <AnimatePresence>
        {bundle.length > 0 && (
           <motion.div initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }} className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[150] w-[90%] max-w-lg">
                <div className="bg-zinc-900 border border-blue-500/30 p-4 rounded-3xl shadow-2xl backdrop-blur-2xl">
                    <div className="flex justify-between items-center mb-4">
                        <span className="text-[10px] font-black uppercase">Your Bundle ({bundle.length})</span>
                        <button onClick={() => setBundle([])} className="text-[10px] font-black uppercase text-red-500">Clear</button>
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
                        {bundle.map((item, idx) => (
                            <div key={idx} className="shrink-0 px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-[9px] font-black uppercase">
                                {item.serviceName}
                            </div>
                        ))}
                    </div>
                    <div className="flex items-center justify-between gap-4">
                        <div>
                            <p className="text-[8px] font-black uppercase text-zinc-500">Total Price {bundle.length >= 3 && <span className="text-emerald-500">(10% Bundle Discount Applied)</span>}</p>
                            <p className="text-xl font-black">{formatPrice(bundleTotal)}</p>
                        </div>
                        <button onClick={() => { setPendingOrder({ plan: { label: 'Bundle Order', sellPrice: bundleTotal, discount: 0 }, service: { name: 'Custom Bundle' } }); setShowCheckout(true); }} className="px-6 py-3 bg-blue-600 rounded-xl text-[10px] font-black uppercase">Checkout Bundle</button>
                    </div>
                </div>
           </motion.div>
        )}
      </AnimatePresence>

      {/* 14. Confusion Detector Popup */}
      <AnimatePresence>
        {showHelp && (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="fixed bottom-24 right-6 z-[200] max-w-[200px] p-4 bg-blue-600 rounded-2xl shadow-2xl">
                <button onClick={() => setShowHelp(false)} className="absolute -top-2 -right-2 bg-white text-black rounded-full p-1"><FiX size={10}/></button>
                <p className="text-[10px] font-black uppercase text-white mb-2">Need help choosing?</p>
                <button onClick={() => window.open('https://wa.me/96181090757', '_blank')} className="w-full py-2 bg-black text-white text-[8px] font-black uppercase rounded-lg">Chat with Us</button>
            </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showCheckout && pendingOrder && (
          <div className="fixed inset-0 z-[210] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowCheckout(false)} className="absolute inset-0 bg-black/90 backdrop-blur-xl" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative w-full max-w-md p-8 rounded-[2.5rem] border border-white/10 bg-zinc-950 overflow-hidden">
                <h3 className="text-2xl font-black mb-8 uppercase tracking-tight">Checkout</h3>
                
                <form onSubmit={finalizeOrder} className="space-y-4">
                    <input required type="email" placeholder="YOUR EMAIL" className="w-full bg-white/5 border border-white/10 rounded-xl py-4 px-4 text-[10px] font-black uppercase outline-none focus:border-blue-500" value={customerInfo.email} onChange={e => setCustomerInfo({...customerInfo, email: e.target.value})} />
                    <input required type="tel" placeholder="WHATSAPP NUMBER" className="w-full bg-white/5 border border-white/10 rounded-xl py-4 px-4 text-[10px] font-black uppercase outline-none focus:border-blue-500" value={customerInfo.phone} onChange={e => setCustomerInfo({...customerInfo, phone: e.target.value})} />
                    <button type="submit" className="w-full py-5 rounded-2xl bg-blue-600 text-white font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl shadow-blue-600/20 hover:bg-blue-700 transition-all">
                        Complete Order via WhatsApp
                    </button>
                </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showPayment && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowPayment(false)} className="absolute inset-0 bg-black/80 backdrop-blur-md" />
            <motion.div initial={{ scale: 0.98, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative w-full max-w-sm p-8 rounded-[2rem] border border-white/10 bg-zinc-950">
              <h3 className="text-xl font-black mb-6 uppercase tracking-tight">Channels</h3>
              <div className="space-y-3">
                {[
                  { name: "Whish Money", detail: "81 090 757", color: "text-blue-500", bg: "bg-blue-500/5" },
                  { name: "OMT", detail: "Adam Abdallah", color: "text-orange-500", bg: "bg-orange-500/5" },
                ].map((m, i) => (
                  <div key={i} className={`p-4 rounded-xl border border-white/5 ${m.bg} flex justify-between items-center group`}>
                    <div className="flex-1">
                      <p className={`text-[9px] font-black uppercase tracking-widest ${m.color} mb-0.5`}>{m.name}</p>
                      <p className="text-xs font-bold text-white/80">{m.detail}</p>
                    </div>
                    <button onClick={() => copyToClipboard(m.detail, i)} className={`p-2 rounded-lg transition-all ${copyStatus === i ? 'bg-emerald-500/20 text-emerald-500' : 'bg-white/5 text-zinc-500 hover:text-white'}`}>
                      {copyStatus === i ? <FiCheckCircle size={14} /> : <FiCopy size={14} />}
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <footer className="py-12 border-t border-white/[0.05] opacity-30 text-center">
         <span className="text-[9px] font-black uppercase tracking-[0.4em]">Cedars Tech LB // {new Date().getFullYear()}</span>
      </footer>
    </div>
  );
}