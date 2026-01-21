import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiTrash2, FiPlus, FiLogOut, FiDownload, FiSearch,
  FiChevronDown, FiChevronUp, FiMenu
} from "react-icons/fi";
import { db } from "../../firebase.js";
import {
  collection, onSnapshot, doc, updateDoc, addDoc, deleteDoc, serverTimestamp
} from "firebase/firestore";

export default function Admin({ setIsAuthed }) {
  const nav = useNavigate();
  const [services, setServices] = useState([]);
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const durations = ["Monthly", "Yearly"];

  useEffect(() => {
    const colRef = collection(db, "services");
    const unsubscribe = onSnapshot(colRef, snapshot => {
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data(), plans: d.data().plans || [] }));
      setServices(data);
    });
    return () => unsubscribe();
  }, []);

  const logout = () => {
    localStorage.removeItem("cedars_admin_auth");
    setIsAuthed(false);
    nav("/login");
  };

  const viewPrices = () => nav("/prices");

  const addService = async () => {
    await addDoc(collection(db, "services"), {
      name: "",
      icon: "",
      plans: [],
      updatedAt: serverTimestamp()
    });
  };

  const removeService = async (id) => {
    await deleteDoc(doc(db, "services", id));
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
      label: "",
      costPrice: "",
      sellPrice: "",
      duration: "Monthly",
      features: false
    }];
    await updateDoc(doc(db, "services", service.id), { plans: newPlans, updatedAt: serverTimestamp() });
  };

  const removePlan = async (service, index) => {
    const newPlans = [...service.plans];
    newPlans.splice(index, 1);
    await updateDoc(doc(db, "services", service.id), { plans: newPlans, updatedAt: serverTimestamp() });
  };

  const toggleFeature = async (serviceId, plans, index) => {
    const updatedPlans = [...plans];
    updatedPlans[index].features = !updatedPlans[index].features;
    await updateDoc(doc(db, "services", serviceId), { plans: updatedPlans, updatedAt: serverTimestamp() });
  };

  const exportToCSV = () => {
    let csv = "Service,Plan,Duration,Cost,Sell,Profit,Profit%\n";
    services.forEach(s => {
      (s.plans || []).forEach(p => {
        const cost = +p.costPrice || 0;
        const sell = +p.sellPrice || 0;
        const profit = sell - cost;
        const pct = cost ? ((profit / cost) * 100).toFixed(1) : 0;
        csv += `"${s.name}","${p.label}","${p.duration || ""}",${cost},${sell},${profit},${pct}%\n`;
      });
    });
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "cedars_pricing_report.csv";
    a.click();
  };

  const filteredServices = services
    .map(s => {
      const plans = s.plans || [];
      if (s.name.toLowerCase().includes(search.toLowerCase())) return { ...s, plans };
      const matchingPlans = plans.filter(p =>
        (p.label || "").toLowerCase().includes(search.toLowerCase())
      );
      return { ...s, plans: matchingPlans };
    })
    .filter(s => (s.plans || []).length > 0 || s.name.toLowerCase().includes(search.toLowerCase()) || s.name === "");

  return (
    <div className="min-h-screen p-6 sm:p-10 text-white bg-[#070b1a]">
      <div className="max-w-6xl mx-auto flex flex-col gap-6">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-center mb-6 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
          CedarsTech Admin Panel
        </h1>

        {/* Top Menu */}
        <div className="flex flex-col sm:flex-row justify-between gap-3 sticky top-0 z-20 bg-black/30 p-3 rounded-2xl backdrop-blur-md shadow-lg">
          <div className="flex justify-between items-center sm:hidden">
            <span className="font-semibold text-white">Menu</span>
            <button onClick={() => setMenuOpen(!menuOpen)}>
              <FiMenu size={24} />
            </button>
          </div>

          <div className={`${menuOpen ? "flex" : "hidden"} sm:flex flex-wrap sm:flex-nowrap justify-center sm:justify-start gap-2`}>
            <div className="flex items-center bg-white/5 px-3 py-2 rounded-xl shadow-inner flex-1 sm:flex-none">
              <FiSearch className="text-white/60 mr-2" size={20} />
              <input
                type="text"
                placeholder="Search service or plan..."
                className="bg-transparent outline-none text-white w-full"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <button onClick={exportToCSV} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-400 shadow hover:scale-105 transition">
              <FiDownload /> Export CSV
            </button>

            <button onClick={addService} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-400 shadow hover:scale-105 transition">
              <FiPlus /> Add Service
            </button>

            <button onClick={viewPrices} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-400 shadow hover:scale-105 transition">
              View Prices
            </button>

            <button onClick={logout} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-red-600 to-red-400 shadow hover:scale-105 transition">
              <FiLogOut /> Logout
            </button>
          </div>
        </div>

        {/* Services */}
        <div className="flex flex-col gap-5">
          <AnimatePresence>
            {filteredServices.map((s, idx) => {
              const totalProfit = (s.plans || []).reduce((acc, p) => {
                const cost = +p.costPrice || 0;
                const sell = +p.sellPrice || 0;
                return acc + (sell - cost);
              }, 0);

              return (
                <motion.div
                  key={s.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  whileHover={{ scale: 1.03 }}
                  className="relative bg-white/5 backdrop-blur-xl p-4 rounded-2xl border border-white/10 shadow-xl"
                >
                  <div className="flex justify-between items-center mb-4 gap-2 cursor-pointer" onClick={() => setExpanded(expanded === s.id ? null : s.id)}>
                    <input
                      className="bg-white/10 px-3 py-2 rounded-lg outline-none focus:ring-2 focus:ring-purple-400 text-white w-full sm:w-auto"
                      value={s.name}
                      placeholder="Service name"
                      onChange={e => updateServiceField(s.id, "name", e.target.value)}
                    />
                    <div className="flex items-center gap-2">
                      <button onClick={() => removeService(s.id)} className="text-red-400 hover:text-red-500">
                        <FiTrash2 size={22} />
                      </button>
                      {expanded === s.id ? <FiChevronUp size={24} /> : <FiChevronDown size={24} />}
                    </div>
                  </div>

                  {expanded === s.id && (
                    <div className="space-y-2">
                      {(s.plans || []).map((p, pi) => {
                        const cost = +p.costPrice || 0;
                        const sell = +p.sellPrice || 0;
                        const profit = sell - cost;

                        return (
                          <motion.div
                            key={pi}
                            layout
                            whileHover={{ scale: 1.02 }}
                            className="grid grid-cols-2 sm:grid-cols-7 gap-2 items-center bg-black/30 p-2 rounded-lg border border-white/10"
                          >
                            <input
                              className="col-span-1 sm:col-span-2 bg-white/10 px-2 py-1 rounded-lg outline-none focus:ring-2 focus:ring-purple-400 text-white"
                              placeholder="Plan"
                              value={p.label}
                              onChange={e => updatePlanField(s.id, s.plans, pi, "label", e.target.value)}
                            />
                            <input
                              className="bg-white/10 px-2 py-1 rounded-lg outline-none focus:ring-2 focus:ring-purple-400 text-white"
                              placeholder="Cost"
                              value={p.costPrice}
                              onChange={e => updatePlanField(s.id, s.plans, pi, "costPrice", e.target.value)}
                            />
                            <input
                              className="bg-white/10 px-2 py-1 rounded-lg outline-none focus:ring-2 focus:ring-purple-400 text-white"
                              placeholder="Sell"
                              value={p.sellPrice}
                              onChange={e => updatePlanField(s.id, s.plans, pi, "sellPrice", e.target.value)}
                            />
                            <select
                              className="bg-white/10 px-2 py-1 rounded-lg outline-none focus:ring-2 focus:ring-purple-400 text-white"
                              value={p.duration || "Monthly"}
                              onChange={e => updatePlanField(s.id, s.plans, pi, "duration", e.target.value)}
                            >
                              {durations.map(d => <option key={d} value={d}>{d}</option>)}
                            </select>
                            <button
                              onClick={() => toggleFeature(s.id, s.plans, pi)}
                              className={`px-2 py-1 rounded-lg font-medium ${p.features ? "bg-emerald-500" : "bg-white/10"} hover:opacity-80`}
                            >
                              Feature
                            </button>
                            <div className={`text-sm font-semibold ${profit >= 0 ? "text-green-400" : "text-red-400"}`}>
                              {profit >= 0 ? "+" : ""}{profit.toFixed(2)}
                            </div>
                            <button onClick={() => removePlan(s, pi)} className="text-red-400 hover:text-red-500">
                              <FiTrash2 />
                            </button>
                          </motion.div>
                        );
                      })}

                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        onClick={() => addPlan(s)}
                        className="mt-2 flex items-center gap-2 text-blue-400 hover:text-blue-300 font-medium"
                      >
                        <FiPlus /> Add Plan
                      </motion.button>

                      <div className="mt-2 text-right font-semibold text-lg text-purple-400 drop-shadow-lg">
                        Total Profit: {totalProfit.toFixed(2)}
                      </div>

                      {s.updatedAt && (
                        <div className="text-right text-xs text-white/60">
                          Last Updated: {new Date(s.updatedAt.seconds * 1000).toLocaleString()}
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
