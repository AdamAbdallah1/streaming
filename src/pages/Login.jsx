import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiArrowLeft, FiArrowRight, FiEye, FiEyeOff, FiLock } from "react-icons/fi";
import Logo from "../assets/logo-black.png";
import Button from "../components/ui/Button";
import { inputClasses } from "../lib/inputStyles";
import { cn } from "../lib/cn";
import { db } from "../../firebase.js";
import { doc, getDoc } from "firebase/firestore";
import { STORAGE_KEYS } from "../lib/config";

export default function Login({ setIsAuthed }) {
  const nav = useNavigate();
  const [pass, setPass] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const login = async () => {
    setLoading(true);
    setError(null);
    try {
      const docRef = doc(db, "admin", "main");
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        setError("Admin password is not configured.");
        return;
      }

      if (pass === docSnap.data().password) {
        // Previously the "remember" flag decided between localStorage and
        // sessionStorage while the app only read localStorage, so a reload
        // logged you out. Both stores are now written and both are read.
        const value = "true";
        localStorage.setItem(STORAGE_KEYS.adminAuth, value);
        sessionStorage.setItem(STORAGE_KEYS.adminAuth, value);
        setIsAuthed(true);
        nav("/admin");
      } else {
        setError("Incorrect password.");
      }
    } catch {
      setError("Could not sign in. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-canvas px-5">
      <div className="w-full max-w-[22rem]">
        <div className="flex flex-col items-center text-center">
          <img src={Logo} alt="" className="size-9" width={36} height={36} />
          <h1 className="mt-4 text-[20px] font-semibold tracking-[-0.02em] text-ink">
            Cedars Tech
          </h1>
          <p className="mt-1 text-[13px] text-ink-tertiary">Store management</p>
        </div>

        <form
          className="mt-8 rounded-[var(--radius-lg)] border border-line bg-surface p-6 shadow-card"
          onSubmit={(event) => {
            event.preventDefault();
            if (!loading) login();
          }}
        >
          <label
            htmlFor="admin-password"
            className="block text-[13px] font-medium text-ink-secondary"
          >
            Password
          </label>
          <div className="relative mt-2">
            <FiLock
              className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-tertiary"
              aria-hidden="true"
            />
            <input
              id="admin-password"
              type={showPass ? "text" : "password"}
              autoComplete="current-password"
              value={pass}
              onChange={(event) => setPass(event.target.value)}
              placeholder="Enter the admin password"
              className={cn(inputClasses(Boolean(error)), "pl-10")}
            />
            <button
              type="button"
              onClick={() => setShowPass((previous) => !previous)}
              aria-label={showPass ? "Hide password" : "Show password"}
              className="absolute right-3 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-[var(--radius-sm)] text-ink-tertiary transition-colors hover:bg-muted hover:text-ink"
            >
              {showPass ? <FiEyeOff size={15} /> : <FiEye size={15} />}
            </button>
          </div>

          {error && <p className="mt-2 text-[13px] text-danger">{error}</p>}

          <label className="mt-4 flex cursor-pointer items-center gap-2.5 text-[13px] text-ink-secondary">
            <span
              className={cn(
                "grid size-4 place-items-center rounded-[5px] border transition-colors duration-150",
                remember ? "border-brand bg-brand" : "border-line-strong bg-surface"
              )}
            >
              {remember && (
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </span>
            Keep me signed in
            <input
              type="checkbox"
              checked={remember}
              onChange={(event) => setRemember(event.target.checked)}
              className="sr-only"
            />
          </label>

          <Button type="submit" size="lg" block className="mt-6" disabled={loading}>
            {loading ? "Signing in…" : "Sign in"}
            {!loading && <FiArrowRight size={16} />}
          </Button>
        </form>

        <button
          type="button"
          onClick={() => nav("/prices")}
          className="mt-6 flex w-full items-center justify-center gap-1.5 rounded-[var(--radius-sm)] text-[13px] text-ink-tertiary transition-colors hover:text-ink"
        >
          <FiArrowLeft size={14} />
          Back to the store
        </button>
      </div>
    </div>
  );
}
