import React, { useState } from "react";
import { motion } from "motion/react";
import { Lock, Mail, Building, User as UserIcon, ShieldAlert, Sparkles, LogIn, Sun, Moon, Calendar, Phone, X, ArrowLeft, Image as ImageIcon } from "lucide-react";
import LogoSelectorModal, { getActiveLogoPath } from "./LogoSelectorModal";

export default function Login({ onLoginSuccess, theme, toggleTheme, onBackToCatalog }) {
  const [activeLogo, setActiveLogo] = useState(() => getActiveLogoPath());
  const [isLogoModalOpen, setIsLogoModalOpen] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  const [role, setRole] = useState("buyer");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [phone, setPhone] = useState("");
  
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!email || !password) {
      setError("Please fill in email and password.");
      setLoading(false);
      return;
    }

    if (isRegister) {
      if (!name) {
        setError("Please enter your name.");
        setLoading(false);
        return;
      }
      if (!age) {
        setError("Please enter your age.");
        setLoading(false);
        return;
      }
      if (Number(age) < 18) {
        setError("Registration failed: You must be 18 years or older to access the store.");
        setLoading(false);
        return;
      }
      if (!gender) {
        setError("Please select your gender.");
        setLoading(false);
        return;
      }
      if (!phone) {
        setError("Please enter your mobile phone number.");
        setLoading(false);
        return;
      }
    }

    try {
      const endpoint = isRegister ? "/api/auth/register" : "/api/auth/login";
      const payload = isRegister 
        ? { 
            email, 
            password, 
            role: "buyer", 
            name, 
            companyName: "Individual Operator", 
            age: Number(age), 
            gender,
            phone
          }
        : { email, password };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Authentication failed");
      }

      onLoginSuccess(data.user);
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const isLight = theme === "light";
  const bgClass = isLight ? "bg-[#e3f0eb] text-slate-900" : "bg-[#0d1d1a] text-white";
  const cardClass = isLight ? "bg-white border-slate-200/80 shadow-xl" : "bg-slate-900/80 border-slate-800/80 shadow-2xl";
  const labelClass = isLight ? "text-slate-600" : "text-slate-400";
  const inputClass = isLight ? "bg-slate-50 border-slate-200 focus:border-amber-500 text-slate-900 placeholder-slate-400 focus:ring-1 focus:ring-amber-500/20" : "bg-slate-950/50 border-slate-800 focus:border-amber-500/50 text-white placeholder-slate-600 focus:ring-1 focus:ring-amber-500/20";
  const secondaryBtnClass = isLight ? "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700" : "bg-slate-950 hover:bg-slate-950/80 border-slate-800/60 text-slate-400 hover:text-white";
  const prefillBgClass = isLight ? "bg-slate-100 border-slate-200 text-slate-700" : "bg-slate-950 hover:bg-slate-950/80 border-slate-800/60 text-slate-400";
  const prefillHeaderClass = isLight ? "text-slate-500" : "text-slate-500";
  const prefillHeadingClass = isLight ? "text-slate-800" : "text-white";

  return (
    <div className={`min-h-screen w-full flex-1 ${bgClass} flex flex-col justify-between relative overflow-x-hidden transition-colors duration-300`}>
      {/* Background Decorative Gradients */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-amber-500/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-blue-500/5 blur-[120px] pointer-events-none" />

      {/* Full Screen Top Affirmation Navigation Bar */}
      <header className={`w-full border-b backdrop-blur-md px-4 sm:px-8 py-3.5 flex items-center justify-between z-20 transition-colors ${
        isLight ? "bg-white/80 border-slate-200/80 text-slate-900 shadow-sm" : "bg-slate-950/80 border-slate-800/80 text-white"
      }`}>
        <div className="flex items-center gap-3">
          <img 
            src={activeLogo} 
            alt="Merkato Store Logo" 
            className="h-9 w-auto rounded-lg shadow-sm border border-slate-500/10 bg-white object-cover" 
            referrerPolicy="no-referrer"
          />
          <div>
            <span className="font-semibold tracking-tight text-sm sm:text-base block">MERKATO STORE</span>
            <span className="text-[10px] text-amber-500 font-mono font-bold tracking-wider uppercase block">Affirmation Portal</span>
          </div>
        </div>

        {/* Center Affirmation Banner */}
        <div className="hidden md:flex items-center gap-2 px-4 py-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-500 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5 shrink-0" />
          <span>Affirmation: Empowering Authentic, Verified & High-Ticket Acquisitions</span>
        </div>

        <div className="flex items-center gap-2.5">
          {onBackToCatalog && (
            <button
              type="button"
              onClick={onBackToCatalog}
              className={`px-3.5 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                isLight 
                  ? "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700 shadow-sm" 
                  : "bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-300"
              }`}
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Back to Store</span>
            </button>
          )}

          <button
            type="button"
            onClick={toggleTheme}
            className={`p-2 rounded-lg border transition-all cursor-pointer ${
              isLight 
                ? "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600 shadow-sm" 
                : "bg-slate-900 hover:bg-slate-800 border-slate-800 text-amber-400"
            }`}
            title={isLight ? "Toggle Dark Mode" : "Toggle Light Mode"}
          >
            {isLight ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Main Full-Screen Form Container */}
      <main className="flex-1 flex flex-col justify-center items-center px-4 py-8 relative z-10 w-full max-w-7xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className={`w-full max-w-md border p-6 sm:p-8 rounded-2xl relative z-10 transition-colors ${cardClass}`}
        >
          <div className="text-center mb-6 flex flex-col items-center">
            <img 
              src={activeLogo} 
              alt="Merkato Store Logo" 
              className="h-16 w-auto rounded-xl shadow-md border border-slate-500/10 mb-3 bg-white object-cover" 
              referrerPolicy="no-referrer"
            />
            <h1 className="font-sans text-xl sm:text-2xl font-semibold tracking-tight">MERKATO STORE</h1>
            <p className={`text-xs mt-1 ${isLight ? "text-slate-500 font-medium" : "text-slate-400"}`}>High-Ticket Corporate Marketing Solutions</p>
          </div>

        {/* Tab Selection */}
        <div className={`flex border-b mb-6 ${isLight ? "border-slate-100" : "border-slate-800"}`}>
          <button
            onClick={() => { setIsRegister(false); setError(null); }}
            className={`flex-1 py-2.5 text-sm font-semibold transition-colors border-b-2 cursor-pointer ${
              !isRegister ? "text-amber-500 border-amber-500" : `${isLight ? "text-slate-400 hover:text-slate-700" : "text-slate-400 hover:text-white"} border-transparent`
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => { setIsRegister(true); setError(null); }}
            className={`flex-1 py-2.5 text-sm font-semibold transition-colors border-b-2 cursor-pointer ${
              isRegister ? "text-amber-500 border-amber-500" : `${isLight ? "text-slate-400 hover:text-slate-700" : "text-slate-400 hover:text-white"} border-transparent`
            }`}
          >
            Sign Up
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-xs flex items-start gap-2"
            >
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
              <span>{error}</span>
            </motion.div>
          )}

          {isRegister && (
            <>
              <div>
                <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${labelClass}`}>Full Name</label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name"
                    className={`w-full focus:outline-none rounded-lg py-2.5 pl-10 pr-4 text-sm transition-all ${inputClass}`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${labelClass}`}>Age (18+)</label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                    <input
                      type="number"
                      required
                      min="1"
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      placeholder="e.g. Yrs"
                      className={`w-full focus:outline-none rounded-lg py-2.5 pl-10 pr-4 text-sm transition-all ${inputClass}`}
                    />
                  </div>
                </div>

                <div>
                  <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${labelClass}`}>Gender</label>
                  <div className="relative">
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      required
                      className={`w-full focus:outline-none rounded-lg py-2.5 px-3 text-sm transition-all cursor-pointer appearance-none ${inputClass}`}
                    >
                      <option value="" disabled className={isLight ? "text-slate-400" : "text-slate-600"}>Select</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Non-binary">Non-binary</option>
                      <option value="Other">Other</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-slate-500">
                      <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                        <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${labelClass}`}>Mobile Phone Number</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. +1 (555) 019-2834"
                    className={`w-full focus:outline-none rounded-lg py-2.5 pl-10 pr-4 text-sm transition-all ${inputClass}`}
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${labelClass}`}>Corporate Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className={`w-full focus:outline-none rounded-lg py-2.5 pl-10 pr-4 text-sm transition-all ${inputClass}`}
              />
            </div>
          </div>

          <div>
            <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${labelClass}`}>Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className={`w-full focus:outline-none rounded-lg py-2.5 pl-10 pr-4 text-sm transition-all ${inputClass}`}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-6 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold py-3 rounded-lg shadow-lg shadow-amber-500/10 hover:shadow-amber-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-55"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                <span>{isRegister ? "Sign Up" : "Log In"}</span>
              </>
            )}
          </button>
        </form>
      </motion.div>
    </main>

    {/* Full Screen Footer */}
    <footer className={`w-full border-t py-4 px-6 text-center text-xs font-mono z-20 transition-colors ${
      isLight ? "bg-white/50 border-slate-200/80 text-slate-500" : "bg-slate-950/50 border-slate-800/80 text-slate-500"
    }`}>
      <span>© 2026 Merkato Store • Affirmation Marketplace • Guaranteed Security & High-Ticket Fulfillment</span>
    </footer>

    <LogoSelectorModal 
      isOpen={isLogoModalOpen} 
      onClose={() => setIsLogoModalOpen(false)} 
      currentLogo={activeLogo} 
      onSelectLogo={(logo) => setActiveLogo(logo)} 
      theme={theme} 
    />
  </div>
);
}
