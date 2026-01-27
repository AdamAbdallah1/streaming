import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { FiSearch, FiUser, FiStar } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { db } from "../../firebase.js";
import { collection, onSnapshot } from "firebase/firestore";

export default function Prices() {
  const nav = useNavigate();
  const [services, setServices] = useState([]);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("priceLow");
  const [duration, setDuration] = useState("All");

  useEffect(() => {
    const colRef = collection(db, "services");
    const unsubscribe = onSnapshot(colRef, snapshot => {
      const data = snapshot.docs.map(d => ({
        id: d.id,
        ...d.data(),
        plans: d.data().plans || []
      }));
      setServices(data);
    });
    return () => unsubscribe();
  }, []);

  let bestDeal = { id: null, profit: 0 };
  services.forEach(s => {
    s.plans.forEach(p => {
      if (p.costPrice && p.sellPrice) {
        const profit = ((p.sellPrice - p.costPrice) / p.costPrice) * 100;
        if (profit > bestDeal.profit) bestDeal = { id: `${s.id}-${p.label}`, profit };
      }
    });
  });

  const filteredServices = services
    .map(s => {
      let plans = [...s.plans];
      plans = plans.filter(
        p =>
          s.name.toLowerCase().includes(search.toLowerCase()) ||
          (p.label || "").toLowerCase().includes(search.toLowerCase())
      );
      if (duration !== "All") plans = plans.filter(p => p.duration === duration);
      if (sortBy === "priceLow") plans.sort((a, b) => (+a.sellPrice || 0) - (+b.sellPrice || 0));
      if (sortBy === "priceHigh") plans.sort((a, b) => (+b.sellPrice || 0) - (+a.sellPrice || 0));
      if (sortBy === "name") plans.sort((a, b) => (a.label || "").localeCompare(b.label || ""));
      return { ...s, plans };
    })
    .filter(s => s.plans.length > 0);

  return (
    <div className="relative min-h-screen p-6 sm:p-10 text-white bg-[#070b1a]">
      <button
        onClick={() => nav("/admin")}
        className="absolute top-5 right-5 bg-gradient-to-r from-blue-600 to-purple-600 p-3 rounded-full shadow-xl"
      >
        <FiUser size={22} />
      </button>

      <h1 className="text-3xl sm:text-4xl font-extrabold text-center mb-8 bg-gradient-to-r from-pink-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent">
        CedarsTech Subscriptions
      </h1>

      <div className="max-w-5xl mx-auto mb-8 grid sm:grid-cols-4 gap-3">
        <input
          placeholder="Search..."
          className="bg-white/5 px-4 py-2 rounded-xl text-sm outline-none backdrop-blur-md"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />

        <select
          className="bg-white/5 px-3 py-2 rounded-xl text-sm outline-none backdrop-blur-md"
          value={sortBy}
          onChange={e => setSortBy(e.target.value)}
        >
          <option value="priceLow">Price: Low → High</option>
          <option value="priceHigh">Price: High → Low</option>
          <option value="name">Plan Name A → Z</option>
        </select>

        <select
          className="bg-white/5 px-3 py-2 rounded-xl text-sm outline-none backdrop-blur-md"
          value={duration}
          onChange={e => setDuration(e.target.value)}
        >
          <option value="All">All Durations</option>
          <option value="Monthly">Monthly</option>
          <option value="Yearly">Yearly</option>
          <option value="Weekly">Weekly</option>
        </select>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {filteredServices.map((s, idx) => (
          <motion.div
            key={s.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.06 }}
            whileHover={{ scale: 1.03 }}
            className={`relative bg-white/5 backdrop-blur-xl p-6 rounded-2xl border border-white/10 shadow-2xl`}
          >
            {s.featured && (
              <div className="absolute -top-3 -right-3 bg-yellow-400 text-black px-3 py-1 text-xs rounded-full flex items-center gap-1 shadow">
                <FiStar /> Featured
              </div>
            )}

            <h2 className="text-lg font-bold mb-4 text-center">{s.name}</h2>

            <ul className="space-y-3">
              {s.plans.map((p, i) => {
                const profitKey = `${s.id}-${p.label}`;
                const isBestDeal = profitKey === bestDeal.id;

                return (
                  <motion.li
                    key={i}
                    whileHover={{ scale: 1.02 }}
                    className="relative flex flex-col sm:flex-row justify-between items-center px-3 py-2 bg-black/30 rounded-lg border border-white/5 text-sm gap-2"
                  >
                    <span className="font-medium">{p.label}</span>

                    <div className="flex items-center gap-2 flex-wrap">
                      {isBestDeal && (
                        <span className="text-xs bg-red-500/90 px-2 py-0.5 rounded-full">
                          🔥 Best Deal
                        </span>
                      )}
                      <span className="font-semibold text-purple-300">{p.sellPrice}$</span>

                      <a
                        href={`https://wa.me/96181090757?text=Hi%20I%20want%20to%20order%20${encodeURIComponent(
                          s.name + " - " + p.label
                        )}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs bg-green-500/90 px-2 py-1 rounded-full hover:bg-green-400 transition"
                      >
                        Order
                      </a>
                    </div>
                  </motion.li>
                );
              })}
            </ul>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
