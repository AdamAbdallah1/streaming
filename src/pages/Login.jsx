import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { FiLock, FiEye, FiEyeOff, FiArrowLeft, FiUser, FiArrowRight } from "react-icons/fi";
import { db } from "../../firebase.js";
import { doc, getDoc } from "firebase/firestore";
import Logo from '../assets/logo-white.png';

export default function Login({ setIsAuthed }) {
  const [pass, setPass] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();

  const login = async () => {
    setLoading(true);
    try {
      const docRef = doc(db, "admin", "main");
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        alert("Admin password not set!");
        return;
      }

      const correctPass = docSnap.data().password;

      if (pass === correctPass) {
        if (remember) {
          localStorage.setItem("cedars_admin_auth", "true");
        } else {
          sessionStorage.setItem("cedars_admin_auth", "true");
        }
        setIsAuthed(true);
        nav("/admin");
      } else {
        alert("Incorrect password");
      }
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white antialiased selection:bg-blue-500/30 font-sans">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-2xl h-64 bg-blue-600/5 blur-[120px] rounded-full pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-[360px] px-6"
      >
        <div className="flex flex-col items-center mb-10 text-center">
          <div className="w-40 h-10 rounded-lg flex items-center justify-center shadow-lg mb-4">
            <img src={Logo} alt="" />
          </div>
          <h1 className="text-xl font-bold tracking-tight mb-1">Cedars Tech</h1>
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.2em]">Management Portal</p>
        </div>

        <div className="bg-zinc-950/40 backdrop-blur-md border border-white/5 p-6 rounded-[1.5rem] shadow-2xl">
          <div className="space-y-5">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 ml-1">Password</label>
              <div className="relative group">
                <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-blue-500 transition-colors" size={14} />
                <input
                  type={showPass ? "text" : "password"}
                  className="w-full bg-zinc-900/40 border border-white/5 p-3.5 pl-11 rounded-xl outline-none focus:ring-1 ring-blue-500/30 transition-all text-sm"
                  placeholder="Enter admin key"
                  value={pass}
                  onChange={(e) => setPass(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && login()}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(prev => !prev)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-white transition-colors"
                >
                  {showPass ? <FiEyeOff size={14} /> : <FiEye size={14} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between px-1">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="hidden"
                />
                <div className={`w-4 h-4 rounded border transition-all flex items-center justify-center ${remember ? 'bg-blue-600 border-blue-600' : 'border-zinc-800 bg-transparent'}`}>
                  {remember && <div className="w-1.5 h-1.5 bg-white rounded-full shadow-sm" />}
                </div>
                <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-500 group-hover:text-zinc-400">Keep session active</span>
              </label>
            </div>

            <div className="pt-2">
              <button
                onClick={login}
                disabled={loading}
                className="w-full relative group overflow-hidden bg-white text-black py-3.5 rounded-xl font-bold text-[10px] uppercase tracking-[0.2em] hover:bg-blue-600 hover:text-white transition-all active:scale-[0.98] disabled:opacity-50"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {loading ? "Authenticating..." : "Sign In"}
                  {!loading && <FiArrowRight size={14} />}
                </span>
              </button>
            </div>
          </div>
        </div>

        <button
          onClick={() => nav("/prices")}
          className="mt-8 flex items-center justify-center gap-2 w-full text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-600 hover:text-zinc-400 transition-colors"
        >
          <FiArrowLeft size={12} />
          Back to Shop
        </button>
      </motion.div>

      <div className="absolute bottom-10 opacity-10 text-[8px] font-bold uppercase tracking-[0.4em]">
        © 2026 Cedars Tech Lebanon
      </div>
    </div>
  );
}