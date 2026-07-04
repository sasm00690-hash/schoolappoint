"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Calendar, Mail, Lock, AlertCircle, RefreshCw, Sparkles, ArrowRight, Sun, Moon } from "lucide-react";
import SmaLogo from "@/components/SmaLogo";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [darkMode, setDarkMode] = useState(false);

  // Clear auth and load theme on page load
  useEffect(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    const isDark = localStorage.getItem("theme") === "dark";
    setDarkMode(isDark);
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  const toggleDarkMode = () => {
    const newDark = !darkMode;
    setDarkMode(newDark);
    if (newDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password.trim()) {
      setError("Email-ka iyo Password-ka waa muhiim.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Galaha la geliyay waa qalad");
      }

      // Save token & user
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      if (data.sessionId) {
        localStorage.setItem("sessionId", data.sessionId);
      }

      // Redirect depending on user role
      if (data.user.role === "SuperAdmin") {
        router.push("/superadmin/dashboard");
      } else {
        router.push("/admin/dashboard");
      }
    } catch (err: any) {
      setError(err.message || "Wax baa khaldamay. Fadlan hubi macluumaadkaaga.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-textPrimary dark:bg-slate-950 dark:text-slate-100 flex flex-col justify-between transition-colors duration-200">
      {/* Header */}
      <header className="w-full glass-panel border-b border-border dark:bg-slate-900/80 dark:border-slate-800 h-16 flex items-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex items-center justify-between">
           <Link href="/" className="flex items-center">
             <SmaLogo className="h-9" />
           </Link>
          <div className="flex items-center gap-4">
            <button 
              type="button"
              onClick={toggleDarkMode} 
              className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-textSecondary dark:text-slate-400 hover:text-primary transition-colors"
            >
              {darkMode ? <Sun className="w-4 h-4 text-yellow-500" /> : <Moon className="w-4 h-4" />}
            </button>
            <Link href="/book" className="text-sm font-semibold text-primary dark:text-blue-400 hover:underline">
              Book Appointment
            </Link>
          </div>
        </div>
      </header>

      {/* Login Form Container */}
      <main className="flex-grow flex items-center justify-center px-4 py-12 relative overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/5 rounded-full blur-3xl -z-10" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-secondary/5 rounded-full blur-3xl -z-10" />

        <div className="w-full max-w-md space-y-8 animate-fadeIn">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full text-xs font-semibold text-primary dark:text-blue-400 dark:bg-blue-900/20 uppercase tracking-wide">
              <Sparkles className="w-3.5 h-3.5" /> Qaybta Shaqaalaha
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight text-textPrimary dark:text-slate-100">Gali Dashboard-ka</h2>
            <p className="text-sm text-textSecondary dark:text-slate-400">
              Gal oo maamul ballamaha la qabsaday, waqtiyada furan, iyo qorshayaashaada.
            </p>
          </div>

          {error && (
            <div className="p-4 bg-danger/10 text-danger border border-danger/20 rounded-xl flex items-start gap-3 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="p-8 bg-white dark:bg-slate-900 border border-border dark:border-slate-800 rounded-card shadow-soft">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-textPrimary dark:text-slate-300">Email-kaaga ama ID-gaaga (SMA-ID)</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-textSecondary dark:text-slate-500" />
                  <input
                    type="text"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tusaale@iskuul.com ama SMA-101"
                    className="w-full pl-10 pr-4 py-2.5 bg-background dark:bg-slate-950 border border-border dark:border-slate-850 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/15 focus:border-primary transition-all dark:text-slate-100 dark:focus:ring-blue-500/20"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-textPrimary dark:text-slate-300">Password-ka</label>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-textSecondary dark:text-slate-500" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-2.5 bg-background dark:bg-slate-950 border border-border dark:border-slate-850 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/15 focus:border-primary transition-all dark:text-slate-100 dark:focus:ring-blue-500/20"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-primary dark:bg-blue-600 dark:hover:bg-blue-700 text-white font-semibold text-sm rounded-lg hover:bg-primary-hover transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> Lagu guda jiraa gelitaanka...
                  </>
                ) : (
                  <>
                    Gali System-ka <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>

          <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 rounded-xl text-xs text-emerald-800 dark:text-emerald-300 text-center flex flex-col items-center gap-3">
            <div className="flex items-center gap-2 bg-white dark:bg-slate-900 px-2.5 py-1 rounded-lg border border-emerald-200/40 dark:border-emerald-950/40 shadow-sm">
              <SmaLogo className="h-5" />
              <div className="h-3.5 w-px bg-slate-200 dark:bg-slate-800" />
              <img src="/logo1.png" alt="SMA Logo" className="h-5 object-contain rounded" />
            </div>
            <div className="space-y-0.5">
              <span>Ma u baahan tahay caawinaad ama maamulista akoonkaaga?</span>
              <a 
                href="https://wa.me/252611143700" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="block font-bold underline hover:text-emerald-950 dark:hover:text-emerald-250 transition-colors"
              >
                Kala xiriir Taageerada Nidaamka SMA WhatsApp-ka
              </a>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border dark:border-slate-800 bg-slate-50 dark:bg-slate-950 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <div className="flex items-center gap-4 justify-center opacity-70 hover:opacity-100 transition-opacity">
            <SmaLogo className="h-8" />
            <div className="h-5 w-px bg-slate-350 dark:bg-slate-700" />
            <img src="/logo1.png" alt="SMA Logo" className="h-8 object-contain rounded" />
          </div>
          <div className="space-y-1">
            <p className="text-xs text-textSecondary dark:text-slate-400">
              © 2026 SMA SaaS. All rights reserved.
            </p>
            <p className="text-[9px] text-textSecondary/50 font-bold uppercase tracking-wider">
              Official School Management Appointment System
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
