import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, Terminal } from "lucide-react";
import Login from "./components/Login";
import AdminDashboard from "./components/AdminDashboard";
import BuyerCatalog from "./components/BuyerCatalog";

export default function App() {
  const [user, setUser] = useState(null);
  const [showLogin, setShowLogin] = useState(false);
  const [appLoading, setAppLoading] = useState(true);
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("merkato_theme") || "dark";
  });

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    localStorage.setItem("merkato_theme", nextTheme);
  };

  useEffect(() => {
    // Check if user session is active in local storage
    const savedUser = localStorage.getItem("merkato_user_session");
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (err) {
        console.error("Failed to parse user session", err);
        localStorage.removeItem("merkato_user_session");
      }
    }
    // Simulate short network loading for premium branding feel
    const timer = setTimeout(() => {
      setAppLoading(false);
    }, 800);

    return () => clearTimeout(timer);
  }, []);

  const handleLoginSuccess = (authenticatedUser) => {
    setUser(authenticatedUser);
    setShowLogin(false);
    localStorage.setItem("merkato_user_session", JSON.stringify(authenticatedUser));
  };

  const handleLogout = () => {
    setUser(null);
    setShowLogin(false);
    localStorage.removeItem("merkato_user_session");
  };

  const handleUpdateUser = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem("merkato_user_session", JSON.stringify(updatedUser));
  };

  if (appLoading) {
    return (
      <div className={`min-h-screen flex flex-col justify-center items-center font-sans transition-colors duration-300 ${
        theme === "light" ? "bg-[#e3f0eb] text-slate-900" : "bg-[#0d1d1a] text-white"
      }`}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center space-y-4"
        >
          <div className="inline-flex items-center justify-center bg-amber-500 text-slate-950 p-3 rounded-2xl shadow-lg shadow-amber-500/10 animate-pulse">
            <Sparkles className="w-8 h-8 text-slate-950" />
          </div>
          <h2 className="text-xl font-semibold tracking-tight">MERKATO PROTOCOL</h2>
          <p className="text-slate-500 text-xs font-mono tracking-widest uppercase">Initializing Secure Full-Stack Node...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen w-full flex flex-col font-sans transition-colors duration-300 ${
      theme === "light" 
        ? "bg-[#e3f0eb] text-slate-900 selection:bg-amber-500 selection:text-white" 
        : "bg-[#0d1d1a] text-white selection:bg-amber-500 selection:text-slate-950"
    }`}>
      <AnimatePresence mode="wait">
        {showLogin && !user ? (
          <motion.div
            key="login"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full min-h-screen flex flex-col flex-1"
          >
            <Login 
              onLoginSuccess={handleLoginSuccess} 
              theme={theme} 
              toggleTheme={toggleTheme} 
              onBackToCatalog={() => setShowLogin(false)}
            />
          </motion.div>
        ) : user && user.role === "admin" ? (
          <motion.div
            key="admin-dashboard"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full min-h-screen flex flex-col flex-1"
          >
            <AdminDashboard user={user} onLogout={handleLogout} theme={theme} toggleTheme={toggleTheme} />
          </motion.div>
        ) : (
          <motion.div
            key="buyer-catalog"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full min-h-screen flex flex-col flex-1"
          >
            <BuyerCatalog 
              user={user} 
              onLogout={handleLogout} 
              onUpdateUser={handleUpdateUser} 
              theme={theme}
              toggleTheme={toggleTheme}
              onOpenLogin={() => setShowLogin(true)}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
