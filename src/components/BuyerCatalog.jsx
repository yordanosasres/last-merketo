import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  ShoppingBag, Sparkles, LogOut, LogIn, Search, ChevronRight, ChevronDown, Briefcase, 
  DollarSign, ArrowRight, ShieldCheck, Cpu, Play, CheckCircle, 
  Sun, Moon, ShieldAlert, Image as ImageIcon, Plus, Minus, BarChart3, Trash2, SlidersHorizontal,
  Menu, X, Tag, ListFilter, ShoppingCart, Bell
} from "lucide-react";
import PaymentGateway from "./PaymentGateway";
import LogoSelectorModal, { getActiveLogoPath } from "./LogoSelectorModal";

export default function BuyerCatalog({ user, onLogout, onUpdateUser, theme, toggleTheme, onOpenLogin }) {
  const [activeLogo, setActiveLogo] = useState(() => getActiveLogoPath());
  const [isLogoModalOpen, setIsLogoModalOpen] = useState(false);
  const currentUser = user || { id: "guest", name: "Guest Visitor", companyName: "Marketplace Guest", balance: 100000 };
  const [products, setProducts] = useState([]);
  const [plannerItems, setPlannerItems] = useState(() => {
    try {
      const saved = localStorage.getItem(`planner_${currentUser.id}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [alertNotification, setAlertNotification] = useState(null);

  useEffect(() => {
    localStorage.setItem(`planner_${currentUser.id}`, JSON.stringify(plannerItems));
  }, [plannerItems, currentUser.id]);

  const handleAddToPlanner = (product) => {
    setPlannerItems((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { id: product.id, title: product.title, price: product.price, quantity: 1, category: product.category }];
    });
    setAlertNotification({
      id: product.id,
      title: product.title,
      category: product.category,
      price: product.price,
      visible: true
    });
  };

  const handleUpdatePlannerQty = (productId, delta) => {
    setPlannerItems((prev) => {
      return prev
        .map((item) => {
          if (item.id === productId) {
            const newQty = item.quantity + delta;
            return { ...item, quantity: newQty };
          }
          return item;
        })
        .filter((item) => item.quantity > 0);
    });
  };

  const handleRemoveFromPlanner = (productId) => {
    setPlannerItems((prev) => prev.filter((item) => item.id !== productId));
  };
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dynamicCategories, setDynamicCategories] = useState([]);

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/categories");
      if (res.ok) {
        const data = await res.json();
        setDynamicCategories(data);
      }
    } catch (err) {
      console.error("Failed to fetch dynamic categories", err);
    }
  };

  // Active Tab: 'catalog' | 'acquisitions' | 'cart'
  const [activeTab, setActiveTab] = useState('catalog');
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [isCartCheckoutOpen, setIsCartCheckoutOpen] = useState(false);

  // Checkout overlay state
  const [checkoutProduct, setCheckoutProduct] = useState(null);
  const [problemAlert, setProblemAlert] = useState(null);

  // AI Strategy generation state
  const [selectedProductForStrategy, setSelectedProductForStrategy] = useState(null);
  const [businessDescription, setBusinessDescription] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [strategyResult, setStrategyResult] = useState(null);

  useEffect(() => {
    fetchData();
  }, [currentUser.id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [resProducts, resOrders] = await Promise.all([
        fetch("/api/products"),
        fetch("/api/orders")
      ]);

      if (!resProducts.ok || !resOrders.ok) {
        throw new Error("Failed to load catalog offerings.");
      }

      const dataProducts = await resProducts.json();
      const dataOrders = await resOrders.json();

      setProducts(dataProducts);
      setOrders(dataOrders);
      await fetchCategories();
    } catch (err) {
      setError(err.message || "Something went wrong loading catalog listings.");
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = (updatedUser, order) => {
    onUpdateUser(updatedUser);
    setOrders((prev) => [...prev, order]);
    // Refresh products count in background
    fetchData();
  };

  const handleCartPaymentSuccess = (updatedUser, ordersList) => {
    onUpdateUser(updatedUser);
    setOrders((prev) => {
      // Avoid duplicate order entries if any exist
      const existingIds = new Set(prev.map(o => o.id));
      const filteredNew = ordersList.filter(o => !existingIds.has(o.id));
      return [...prev, ...filteredNew];
    });
    setPlannerItems([]); // empty the cart/chart
    fetchData(); // Refresh background counts
  };

  const handleGenerateStrategy = async () => {
    if (!selectedProductForStrategy) return;
    setAiLoading(true);
    setStrategyResult(null);

    try {
      const res = await fetch("/api/gemini/generate-strategy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productTitle: selectedProductForStrategy.title,
          companyDescription: businessDescription || "A high-ticket company seeking rapid strategic authority"
        })
      });

      if (!res.ok) throw new Error("Gemini strategist failed.");
      const data = await res.json();
      setStrategyResult(data.strategy);
    } catch (err) {
      setProblemAlert({
        title: "AI Strategist Failed",
        message: "AI Strategist compilation failed. Please check your company description details and try compiling again.",
        type: "error"
      });
    } finally {
      setAiLoading(false);
    }
  };

  const handleAcquireSingleOffering = (product) => {
    if (product.stock === 0) {
      setProblemAlert({
        title: "Offering Sold Out",
        message: `The selected solution "${product.title}" is currently sold out and unavailable.`,
        type: "error"
      });
      return;
    }

    // Add product to chart/planner and pop alert notification
    handleAddToPlanner(product);
  };

  const categories = dynamicCategories.length > 0 ? ["All", ...dynamicCategories] : ["All", "Public Relations", "Paid Acquisition", "Brand Strategy", "Influencer Marketing", "Conversion Optimization"];

  const filteredProducts = products.filter(p => {
    const matchesCategory = selectedCategory === "All" || p.category?.toLowerCase() === selectedCategory.toLowerCase();
    const query = searchQuery.trim().toLowerCase();
    const matchesSearch = !query || 
      p.title.toLowerCase().includes(query) || 
      p.description.toLowerCase().includes(query) ||
      p.category?.toLowerCase().includes(query) ||
      p.tags.some(t => t.toLowerCase().includes(query));
    return matchesCategory && matchesSearch;
  });

  // Find products purchased by current buyer
  const buyerAcquisitions = orders
    .filter(o => o.buyerId === currentUser.id && o.status === "succeeded")
    .map(o => {
      // Fetch current or mock product structure
      const prod = products.find(p => p.id === o.productId);
      return {
        orderId: o.id,
        date: o.date,
        price: o.price,
        cardNumberLast4: o.cardNumberLast4,
        product: prod || {
          id: o.productId,
          title: o.productTitle,
          description: "Exclusive corporate acquired solution.",
          price: o.price,
          stock: 0,
          category: "Acquired",
          tags: ["Acquired"]
        }
      };
    });

  // Find pending requests purchased by current buyer
  const buyerPendingRequests = orders
    .filter(o => o.buyerId === currentUser.id && o.status === "pending")
    .map(o => {
      const prod = products.find(p => p.id === o.productId);
      return {
        orderId: o.id,
        date: o.date,
        price: o.price,
        cardNumberLast4: o.cardNumberLast4,
        product: prod || {
          id: o.productId,
          title: o.productTitle,
          description: "Exclusive corporate pending solution.",
          price: o.price,
          stock: 0,
          category: "Pending",
          tags: ["Pending"]
        }
      };
    });

  // Find rejected requests purchased by current buyer
  const buyerRejectedRequests = orders
    .filter(o => o.buyerId === currentUser.id && o.status === "rejected")
    .map(o => {
      const prod = products.find(p => p.id === o.productId);
      return {
        orderId: o.id,
        date: o.date,
        price: o.price,
        cardNumberLast4: o.cardNumberLast4,
        product: prod || {
          id: o.productId,
          title: o.productTitle,
          description: "Exclusive corporate rejected solution.",
          price: o.price,
          stock: 0,
          category: "Rejected",
          tags: ["Rejected"]
        }
      };
    });

  // Theme support visual definitions
  const isLight = theme === "light";
  const bgClass = isLight ? "bg-[#e3f0eb] text-slate-900" : "bg-[#0d1d1a] text-white";
  const navClass = isLight ? "border-slate-200 bg-white/90" : "border-slate-900 bg-slate-950/80";
  const subNavbarClass = isLight ? "border-slate-200 bg-white/50" : "border-slate-900 bg-slate-950/40";
  const cardClass = isLight ? "bg-white border-slate-200/80 shadow-sm hover:shadow-md hover:bg-white" : "bg-slate-900/40 border-slate-900 hover:border-slate-800/80 hover:bg-slate-900/60";
  const innerCardClass = isLight ? "bg-slate-100/70 border-slate-200" : "bg-slate-950 border border-slate-900";
  const textTitleClass = isLight ? "text-slate-800" : "text-white";
  const textMutedClass = isLight ? "text-slate-500" : "text-slate-400";
  const inputClass = isLight ? "bg-white border-slate-300 focus:border-amber-500 text-slate-900 placeholder-slate-400" : "bg-slate-950/50 border-slate-800 focus:border-amber-500/50 text-white placeholder-slate-700";

  const totalPlannerCost = plannerItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const userBalance = currentUser.balance !== undefined ? currentUser.balance : 100000;
  const allocationPercent = Math.min(100, Math.round((totalPlannerCost / userBalance) * 100));

  return (
    <div className={`min-h-screen ${bgClass} flex flex-col font-sans transition-colors duration-300`}>
      {/* Dynamic Slide-out Corporate Navigation Drawer */}
      <AnimatePresence>
        {isNavOpen && (
          <div className="fixed inset-0 z-50 flex">
            {/* Backdrop overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsNavOpen(false)}
              className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm"
            />

            {/* Sidebar panel */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className={`relative flex flex-col w-full max-w-xs h-full p-6 shadow-2xl border-r z-50 ${
                isLight 
                  ? "bg-white border-slate-200 text-slate-900" 
                  : "bg-slate-900 border-slate-800 text-white"
              }`}
            >
              {/* Header inside sidebar */}
              <div className="flex justify-between items-center pb-5 border-b border-slate-500/10">
                <div className="flex items-center gap-2">
                  <img 
                    src={activeLogo} 
                    alt="Merkato Online Store Logo" 
                    className="h-8 w-auto rounded-md border border-slate-500/10 shrink-0 object-cover" 
                    referrerPolicy="no-referrer"
                  />
                  <div>
                    <h3 className="text-sm font-bold tracking-tight">Merkato Navigation</h3>
                    <p className={`text-[9px] ${textMutedClass} font-mono uppercase tracking-wider`}>Member Services</p>
                  </div>
                </div>

                <button
                  onClick={() => setIsNavOpen(false)}
                  className={`p-1.5 rounded-lg border cursor-pointer transition-colors ${
                    isLight 
                      ? "bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-600 hover:text-slate-800" 
                      : "bg-slate-950/50 hover:bg-slate-950/80 text-slate-400 hover:text-white border border-slate-800/40"
                  }`}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Sidebar content links */}
              <div className="flex-1 py-6 space-y-6 overflow-y-auto">
                <div className="space-y-1.5">
                  <span className={`text-[10px] font-bold ${textMutedClass} uppercase tracking-wider block px-2`}>
                    Core Portals
                  </span>
                  <button
                    onClick={() => {
                      setActiveTab('catalog');
                      setIsNavOpen(false);
                    }}
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                      activeTab === 'catalog'
                        ? "bg-amber-500 text-slate-950 font-bold shadow-lg shadow-amber-500/15"
                        : `hover:bg-slate-500/10 ${isLight ? "text-slate-700 hover:text-slate-900" : "text-slate-300 hover:text-white"}`
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      <ShoppingBag className="w-4 h-4" />
                      <span>Marketplace Offerings</span>
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 opacity-55" />
                  </button>

                  <button
                    onClick={() => {
                      setActiveTab('acquisitions');
                      setIsNavOpen(false);
                    }}
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                      activeTab === 'acquisitions'
                        ? "bg-amber-500 text-slate-950 font-bold shadow-lg shadow-amber-500/15"
                        : `hover:bg-slate-500/10 ${isLight ? "text-slate-700 hover:text-slate-900" : "text-slate-300 hover:text-white"}`
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      <Briefcase className="w-4 h-4" />
                      <span>My Acquisitions Portfolio</span>
                    </span>
                    {buyerAcquisitions.length > 0 && (
                      <span className="bg-amber-500/20 text-amber-500 text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                        {buyerAcquisitions.length}
                      </span>
                    )}
                  </button>

                  <button
                    onClick={() => {
                      setActiveTab('cart');
                      setIsNavOpen(false);
                    }}
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                      activeTab === 'cart'
                        ? "bg-amber-500 text-slate-950 font-bold shadow-lg shadow-amber-500/15"
                        : `hover:bg-slate-500/10 ${isLight ? "text-slate-700 hover:text-slate-900" : "text-slate-300 hover:text-white"}`
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      <ShoppingCart className="w-4 h-4" />
                      <span>My Campaign Cart / Chart</span>
                    </span>
                    {plannerItems.length > 0 && (
                      <span className="bg-amber-500 text-slate-950 text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow-sm">
                        {plannerItems.reduce((acc, item) => acc + item.quantity, 0)}
                      </span>
                    )}
                  </button>
                </div>

                {/* Categories filtering section inside Navbar */}
                <div className="space-y-1.5 pt-4 border-t border-slate-500/10">
                  <span className={`text-[10px] font-bold ${textMutedClass} uppercase tracking-wider block px-2 flex items-center gap-1`}>
                    <ListFilter className="w-3 h-3 text-amber-500" />
                    <span>Filter By Vertical</span>
                  </span>
                  
                  {categories.map((cat, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setSelectedCategory(cat);
                        setActiveTab('catalog');
                        setIsNavOpen(false);
                      }}
                      className={`w-full flex items-center gap-2.5 p-2 rounded-lg text-xs font-medium transition-all text-left cursor-pointer ${
                        selectedCategory === cat
                          ? "text-amber-500 font-bold bg-amber-500/10"
                          : `${isLight ? "text-slate-600 hover:bg-slate-50" : "text-slate-400 hover:bg-slate-950 hover:text-white"}`
                      }`}
                    >
                      <Tag className="w-3.5 h-3.5 shrink-0 opacity-70" />
                      <span className="truncate">{cat}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Sidebar footer section */}
              <div className="pt-4 border-t border-slate-500/10 space-y-3">
                {user ? (
                  <>
                    <div className={`p-3 border rounded-xl text-left ${innerCardClass}`}>
                      <span className={`text-[9px] ${textMutedClass} uppercase tracking-widest block font-bold`}>Current Balance</span>
                      <div className="flex items-center gap-1 mt-0.5">
                        <DollarSign className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span className="text-sm font-bold font-mono text-emerald-500">
                          {(user.balance || 0).toLocaleString()}
                        </span>
                        <span className={`text-[9px] ${textMutedClass} font-mono ml-1`}>USD</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between px-2 text-xs">
                      <span className={textMutedClass}>Buyer ID:</span>
                      <span className="font-mono text-[10px] opacity-75">{user.id.slice(0, 8)}...</span>
                    </div>

                    <button
                      onClick={() => {
                        setIsNavOpen(false);
                        onLogout();
                      }}
                      className={`w-full py-2 border rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                        isLight 
                          ? "bg-slate-100 hover:bg-red-50 border-slate-200 text-slate-600 hover:text-red-500" 
                          : "bg-slate-950 hover:bg-red-500/10 border-slate-800 hover:border-red-500/20 text-slate-400 hover:text-red-400"
                      }`}
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Exit Session</span>
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => {
                      setIsNavOpen(false);
                      if (onOpenLogin) onOpenLogin();
                    }}
                    className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md transition-all cursor-pointer"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>Log In to Account</span>
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Premium Header */}
      <nav className={`border-b ${navClass} backdrop-blur-md sticky top-0 z-40 px-4 sm:px-6 pt-3 pb-2 flex flex-col gap-2.5 transition-colors`}>
        {/* Top Header Row */}
        <div className="flex justify-between items-center w-full gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsNavOpen(true)}
              className={`p-2 rounded-lg border transition-all cursor-pointer ${
                isLight 
                  ? "bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-600" 
                  : "bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-300"
              }`}
              title="Open Navigation Menu"
            >
              <Menu className="w-4 h-4" />
            </button>
            
            <div className="flex items-center gap-3">
              <img 
                src={activeLogo} 
                alt="Merkato Online Store Logo" 
                className="h-10 w-auto rounded-lg shadow-sm border border-slate-500/10 shrink-0 object-cover" 
                referrerPolicy="no-referrer"
              />
              <div>
                <h1 className="text-base font-semibold tracking-tight flex items-center gap-1.5">
                  <span className={isLight ? "text-slate-900" : "text-white"}>Merkato Elite Store</span>
                </h1>
                <p className={`text-[9px] ${textMutedClass} font-mono tracking-widest uppercase`}>
                  {user ? "Verified Corporate Channel" : "Public Marketplace Catalog"}
                </p>
              </div>
            </div>
          </div>

          {/* Corporate Marketing Budget Indicator / Guest Status & User Actions */}
          <div className="flex items-center gap-3 sm:gap-4">
            {user ? (
              <div className={`border px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl text-left shadow-sm ${isLight ? "bg-white border-slate-200" : "bg-slate-900/80 border-slate-800"}`}>
                <span className={`text-[9px] ${textMutedClass} uppercase tracking-widest block font-bold`}>Marketing Line-of-Credit</span>
                <div className="flex items-center gap-1 mt-0.5">
                  <DollarSign className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span className="text-sm sm:text-base font-bold font-mono text-emerald-500">
                    {(user.balance || 0).toLocaleString()}
                  </span>
                  <span className={`text-[10px] ${textMutedClass} font-mono ml-1`}>USD</span>
                </div>
              </div>
            ) : null}

            <div className={`h-8 w-[1px] hidden sm:block ${isLight ? "bg-slate-200" : "bg-slate-900"}`} />

            {/* Theme Switcher Button */}
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-lg border transition-all cursor-pointer ${
                isLight 
                  ? "bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-600" 
                  : "bg-slate-900 hover:bg-slate-800 border-slate-800 text-amber-400"
              }`}
              title={isLight ? "Toggle Dark Mode" : "Toggle Light Mode"}
            >
              {isLight ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>

            {/* Log In Button in Top Right Corner */}
            {user ? (
              <div className="flex items-center gap-3">
                <div className="hidden sm:block text-right">
                  <span className={`text-xs font-semibold block ${isLight ? "text-slate-800" : "text-white"}`}>{user.name}</span>
                  <span className={`text-[9px] ${textMutedClass} font-mono block uppercase`}>{user.companyName || "Member"}</span>
                </div>
                <button
                  onClick={onLogout}
                  className={`p-2 rounded-lg border cursor-pointer transition-colors ${
                    isLight 
                      ? "bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-600" 
                      : "bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-400 hover:text-white"
                  }`}
                  title="Exit Store"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenLogin}
                className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-md shadow-amber-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                <span>Log In</span>
              </button>
            )}
          </div>
        </div>

        {/* Sub-Header Navigation Tabs directly under the logo (Hidden on mobile, visible on desktop) */}
        <div className="hidden md:flex items-center justify-between pt-2 border-t border-slate-500/10 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => { setActiveTab('catalog'); setStrategyResult(null); setSelectedProductForStrategy(null); }}
              className={`px-3 py-1.5 sm:px-3.5 sm:py-1.5 rounded-lg text-xs font-bold tracking-wide transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'catalog'
                  ? "bg-amber-500 text-slate-950 shadow-sm font-extrabold"
                  : `${isLight ? "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60" : "text-slate-400 hover:text-white hover:bg-slate-800/60"}`
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Market catalog</span>
            </button>

            <button
              onClick={() => { setActiveTab('acquisitions'); setStrategyResult(null); setSelectedProductForStrategy(null); }}
              className={`px-3 py-1.5 sm:px-3.5 sm:py-1.5 rounded-lg text-xs font-bold tracking-wide transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap relative ${
                activeTab === 'acquisitions'
                  ? "bg-amber-500 text-slate-950 shadow-sm font-extrabold"
                  : `${isLight ? "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60" : "text-slate-400 hover:text-white hover:bg-slate-800/60"}`
              }`}
            >
              <Briefcase className="w-3.5 h-3.5" />
              <span>My Acquisitions</span>
              {(buyerAcquisitions?.length > 0 || buyerPendingRequests?.length > 0) && (
                <span className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
              )}
            </button>

            <button
              onClick={() => { setActiveTab('cart'); setStrategyResult(null); setSelectedProductForStrategy(null); }}
              className={`px-3 py-1.5 sm:px-3.5 sm:py-1.5 rounded-lg text-xs font-bold tracking-wide transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap relative ${
                activeTab === 'cart'
                  ? "bg-amber-500 text-slate-950 shadow-sm font-extrabold"
                  : `${isLight ? "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60" : "text-slate-400 hover:text-white hover:bg-slate-800/60"}`
              }`}
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              <span>My Cart / Chart</span>
              {plannerItems.length > 0 && (
                <span className="bg-amber-500 text-slate-950 text-[9px] font-extrabold px-1.5 py-0.25 rounded-full shadow-xs">
                  {plannerItems.reduce((acc, item) => acc + item.quantity, 0)}
                </span>
              )}
            </button>
          </div>

          <span className={`text-[10px] font-mono hidden md:inline shrink-0 ${textMutedClass}`}>NODE_SECURED_SSL_256</span>
        </div>
      </nav>

      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center py-20">
          <span className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin mb-4"></span>
          <p className={`text-xs font-mono ${textMutedClass}`}>Syncing luxury offerings catalog...</p>
        </div>
      ) : (
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6 sm:space-y-8">
          {activeTab === 'catalog' ? (
            /* ================================================================
               OFFERING CATALOG VIEW
               ================================================================ */
            <div className="space-y-6">
              <div className="flex flex-col xl:flex-row xl:justify-between xl:items-center gap-4 border-b pb-5 border-slate-500/5">
                <div>
                  <h2 className={`text-lg font-semibold tracking-wide ${isLight ? "text-slate-800" : "text-white"}`}>Curated Solutions Catalog</h2>
                  <p className={`text-xs ${textMutedClass} mt-0.5`}>Discover premium curated products across multiple vertical categories</p>
                </div>

                <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 shrink-0">
                  {/* Premium Search Bar */}
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="text"
                      placeholder="Search offerings, descriptions, tags..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className={`pl-9 pr-8 py-2 w-full md:w-64 text-xs rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500/25 ${inputClass}`}
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery("")}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-amber-500 transition-colors"
                        title="Clear search"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Categories Filter Selector Dropdown & Quick Selector */}
                  <div className="relative w-full md:w-auto shrink-0">
                    <div className="flex items-center gap-2 w-full">
                      <div className="relative w-full sm:w-auto">
                        <select
                          value={selectedCategory}
                          onChange={(e) => setSelectedCategory(e.target.value)}
                          className={`appearance-none w-full sm:w-auto pl-8 pr-8 py-2 text-xs font-bold rounded-xl border focus:outline-none focus:ring-1 focus:ring-amber-500/25 cursor-pointer uppercase tracking-wider ${
                            selectedCategory !== "All"
                              ? "bg-amber-500 border-amber-500 text-slate-950 shadow-md font-extrabold"
                              : `${isLight ? "bg-white border-slate-200 text-slate-800 hover:bg-slate-50" : "bg-slate-900 border-slate-800 text-slate-200 hover:bg-slate-800"}`
                          }`}
                        >
                          {categories.map((cat, i) => (
                            <option key={i} value={cat} className={isLight ? "bg-white text-slate-900" : "bg-slate-900 text-white"}>
                              Category: {cat}
                            </option>
                          ))}
                        </select>
                        <Tag className={`w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none ${selectedCategory !== "All" ? "text-slate-950" : "text-amber-500"}`} />
                        <ChevronDown className={`w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none transition-transform ${selectedCategory !== "All" ? "text-slate-950" : "text-slate-400"}`} />
                      </div>

                      {/* Quick Pill options for desktop */}
                      <div className="hidden lg:flex items-center gap-1.5 overflow-x-auto max-w-xs">
                        {categories.slice(0, 4).map((cat, i) => (
                          <button
                            key={i}
                            onClick={() => setSelectedCategory(cat)}
                            className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold tracking-wide uppercase whitespace-nowrap transition-all cursor-pointer border ${
                              selectedCategory === cat
                                ? "bg-amber-500 border-amber-500 text-slate-950 font-extrabold shadow-sm"
                                : `${isLight ? "bg-white border-slate-200 text-slate-600 hover:bg-slate-50" : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"}`
                            }`}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Products Catalog Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.length === 0 ? (
                  <div className={`col-span-full py-16 text-center border border-dashed rounded-2xl ${isLight ? "bg-slate-100 border-slate-200/80" : "bg-slate-900/10 border-slate-800"}`}>
                    <ShoppingBag className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                    <p className={`text-xs font-mono ${textMutedClass}`}>No offerings found under this filter vertical.</p>
                  </div>
                ) : (
                  filteredProducts.map((prod) => (
                    <motion.div
                      key={prod.id}
                      layout
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`border p-6 rounded-2xl flex flex-col justify-between shadow-sm transition-all duration-300 relative group overflow-hidden ${cardClass}`}
                    >
                      {/* Interactive visual line on hover */}
                      <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-amber-500/0 via-amber-500/0 to-amber-500/0 group-hover:via-amber-500/80 transition-all duration-500" />

                      <div className="space-y-4">
                        {prod.imageUrl && (
                          <div className="h-40 sm:h-44 w-full rounded-xl overflow-hidden border border-slate-500/10 relative shrink-0 shadow-inner">
                            <img 
                              src={prod.imageUrl} 
                              alt={prod.title} 
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out" 
                              referrerPolicy="no-referrer"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/20 via-transparent to-transparent" />
                          </div>
                        )}

                        <div className="flex justify-between items-start gap-4">
                          <span className="text-[9px] font-extrabold text-amber-500 bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded font-mono uppercase tracking-wider">
                            {prod.category}
                          </span>
                          <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                            prod.stock === 0 
                              ? "bg-red-500/10 text-red-500 border border-red-500/15" 
                              : prod.stock <= 3 
                                ? "bg-rose-500/10 text-rose-500 border border-rose-500/15 animate-pulse"
                                : `${isLight ? "bg-emerald-500/10 border-emerald-500/15 text-emerald-600" : "bg-emerald-950/20 border-emerald-900/60 text-emerald-500"}`
                          }`}>
                            {prod.stock === 0 ? "Sold Out" : prod.stock <= 3 ? `Only ${prod.stock} left` : `${prod.stock} left`}
                          </span>
                        </div>

                        <div>
                          <h3 className={`text-sm font-semibold tracking-tight group-hover:text-amber-500 transition-colors ${isLight ? "text-slate-800" : "text-white"}`}>{prod.title}</h3>
                          <p className={`text-xs mt-2 leading-relaxed line-clamp-3 ${isLight ? "text-slate-600" : "text-slate-400"}`}>{prod.description}</p>
                        </div>

                        {/* tags */}
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {prod.tags.map((tag, i) => (
                            <span key={i} className={`text-[9px] px-2 py-0.5 rounded font-mono border ${isLight ? "bg-slate-50 border-slate-200 text-slate-500" : "bg-slate-950 border-slate-900/60 text-slate-500"}`}>
                              #{tag}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className={`border-t mt-6 pt-4 flex items-center justify-between ${isLight ? "border-slate-100" : "border-slate-900/80"}`}>
                        <div>
                          <span className={`text-[9px] ${textMutedClass} font-bold uppercase tracking-wider block`}>Corporate Value</span>
                          <span className={`text-lg font-bold font-mono ${isLight ? "text-slate-800" : "text-white"}`}>${prod.price.toLocaleString()}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleAddToPlanner(prod)}
                            className={`p-2 rounded-xl border transition-all cursor-pointer ${
                              isLight 
                                ? "bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-600" 
                                : "bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-400 hover:text-white"
                            }`}
                            title="Simulate / Track in Chart"
                          >
                            <BarChart3 className="w-4 h-4 text-amber-500" />
                          </button>

                          <button
                            disabled={prod.stock === 0}
                            onClick={() => handleAcquireSingleOffering(prod)}
                            className={`px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                              prod.stock === 0
                                ? "bg-slate-200 text-slate-400 cursor-not-allowed border-none"
                                : "bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold shadow-md hover:shadow-amber-500/10 active:scale-[0.98]"
                            }`}
                            title="Add offering to chart and pop alert"
                          >
                            <Plus className="w-4 h-4 stroke-[3px]" />
                            <span className="font-extrabold text-xs">+</span>
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </div>
          ) : activeTab === 'acquisitions' ? (
            /* ================================================================
               MY ACQUISITIONS VIEW
               ================================================================ */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Acquisitions Catalog List */}
              <div className="lg:col-span-6 space-y-8">
                {/* Section 1: Pending Approval Requests */}
                {buyerPendingRequests.length > 0 && (
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-xs font-bold tracking-wider uppercase flex items-center gap-2 text-amber-500">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                        <span>Awaiting Admin Approval ({buyerPendingRequests.length})</span>
                      </h3>
                      <p className={`text-[10px] ${textMutedClass} mt-0.5`}>These premium campaigns are submitted and waiting for admin verification</p>
                    </div>
                    
                    <div className="space-y-3">
                      {buyerPendingRequests.map((req, idx) => (
                        <div key={idx} className={`p-4 border rounded-xl flex flex-col justify-between transition-colors bg-amber-500/5 border-amber-500/20`}>
                          <div className="flex items-start gap-3 justify-between">
                            <div className="flex gap-2.5 items-center">
                              {req.product.imageUrl ? (
                                <img src={req.product.imageUrl} alt={req.product.title} className="w-10 h-10 object-cover rounded-lg border border-slate-500/10 shrink-0" referrerPolicy="no-referrer" />
                              ) : (
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border ${isLight ? "bg-slate-100 border-slate-200 text-slate-400" : "bg-slate-950 border-slate-900 text-slate-500"}`}>
                                  <ImageIcon className="w-4 h-4" />
                                </div>
                              )}
                              <div>
                                <span className="text-[8px] text-amber-500 font-extrabold uppercase tracking-wider bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded font-mono">
                                  {req.product.category}
                                </span>
                                <h4 className={`text-xs font-semibold tracking-tight mt-1 ${isLight ? "text-slate-800" : "text-white"}`}>{req.product.title}</h4>
                              </div>
                            </div>
                            <span className="text-xs font-bold font-mono text-amber-500 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded shrink-0">
                              ${req.price.toLocaleString()}
                            </span>
                          </div>
                          <p className={`text-[9px] ${textMutedClass} font-mono mt-3 border-t border-amber-500/10 pt-2 flex justify-between`}>
                            <span>Transaction Held: {req.orderId}</span>
                            <span>Submitted: {new Date(req.date).toLocaleDateString()}</span>
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Section 2: Approved Acquisitions */}
                <div className="space-y-4">
                  <div>
                    <h2 className={`text-lg font-semibold tracking-wide ${isLight ? "text-slate-800" : "text-white"}`}>Corporate Acquisitions Cabinet</h2>
                    <p className={`text-xs ${textMutedClass} mt-0.5`}>Secure, authenticated roster of high-ticket campaign blueprints and properties</p>
                  </div>

                  {buyerAcquisitions.length === 0 ? (
                    <div className={`py-16 text-center border border-dashed rounded-2xl ${isLight ? "bg-white border-slate-200" : "bg-slate-900/10 border-slate-800"}`}>
                      <Briefcase className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                      <p className={`text-xs font-mono ${textMutedClass}`}>No active acquisitions recorded for this buyer account.</p>
                    </div>
                  ) : (
                    buyerAcquisitions.map((acq, idx) => {
                      const isSelected = selectedProductForStrategy?.id === acq.product.id;
                      return (
                        <div
                          key={idx}
                          className={`p-5 border rounded-2xl flex flex-col justify-between transition-all ${
                            isSelected 
                              ? "border-amber-500 bg-amber-500/5 shadow-md shadow-amber-500/5" 
                              : `${isLight ? "bg-white border-slate-200" : "bg-slate-900/30 border-slate-900"}`
                          }`}
                        >
                          <div className="flex items-start gap-4 justify-between">
                            <div className="flex gap-3 items-center">
                              {acq.product.imageUrl ? (
                                <img 
                                  src={acq.product.imageUrl} 
                                  alt={acq.product.title} 
                                  className="w-12 h-12 object-cover rounded-xl border border-slate-500/10 shadow-sm shrink-0" 
                                  referrerPolicy="no-referrer"
                                />
                              ) : (
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border ${isLight ? "bg-slate-100 border-slate-200 text-slate-400" : "bg-slate-950 border-slate-900 text-slate-500"}`}>
                                  <ImageIcon className="w-5 h-5" />
                                </div>
                              )}
                              <div>
                                <span className="text-[9px] text-amber-500 font-extrabold uppercase tracking-wider bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded font-mono">
                                  {acq.product.category}
                                </span>
                                <h3 className={`text-sm font-semibold tracking-tight mt-1 ${isLight ? "text-slate-800" : "text-white"}`}>{acq.product.title}</h3>
                              </div>
                            </div>
                            <span className="text-xs font-bold font-mono text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded shrink-0">
                              ${acq.price.toLocaleString()}
                            </span>
                          </div>

                          <div className={`border-t mt-5 pt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-[10px] ${textMutedClass} font-mono ${isLight ? "border-slate-100" : "border-slate-900/80"}`}>
                            <div>
                              <p>Transaction: <strong className={isLight ? "text-slate-700" : "text-slate-300"}>{acq.orderId}</strong></p>
                              <p className="mt-0.5">Captured: {new Date(acq.date).toLocaleString()}</p>
                            </div>
                            
                            <button
                              onClick={() => {
                                setSelectedProductForStrategy(acq.product);
                                setStrategyResult(null);
                                setBusinessDescription("");
                              }}
                              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold tracking-wide uppercase flex items-center gap-1.5 transition-all cursor-pointer shrink-0 border ${
                                isSelected 
                                  ? "bg-amber-500 border-amber-500 text-slate-950 font-bold" 
                                  : `${isLight ? "bg-white border-slate-200 hover:bg-slate-50 text-amber-600" : "bg-slate-950 border-slate-800 text-amber-500 hover:text-amber-400"}`
                              }`}
                            >
                              <Cpu className="w-3 h-3" />
                              <span>AI Strategy Panel</span>
                              <ChevronRight className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Section 3: Rejected / Declined Requests */}
                {buyerRejectedRequests.length > 0 && (
                  <div className="space-y-4 pt-4 border-t border-slate-500/10">
                    <div>
                      <h3 className="text-xs font-bold tracking-wider uppercase text-red-500">
                        <span>Declined Purchase Requests ({buyerRejectedRequests.length})</span>
                      </h3>
                      <p className={`text-[10px] ${textMutedClass} mt-0.5`}>These purchase requests were declined by board administrators</p>
                    </div>
                    
                    <div className="space-y-3">
                      {buyerRejectedRequests.map((req, idx) => (
                        <div key={idx} className={`p-4 border rounded-xl flex flex-col justify-between transition-colors bg-red-500/5 border-red-500/10`}>
                          <div className="flex items-start gap-3 justify-between">
                            <div className="flex gap-2.5 items-center">
                              {req.product.imageUrl ? (
                                <img src={req.product.imageUrl} alt={req.product.title} className="w-10 h-10 object-cover rounded-lg border border-slate-500/10 shrink-0" referrerPolicy="no-referrer" />
                              ) : (
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border ${isLight ? "bg-slate-100 border-slate-200 text-slate-400" : "bg-slate-950 border-slate-900 text-slate-500"}`}>
                                  <ImageIcon className="w-4 h-4" />
                                </div>
                              )}
                              <div>
                                <span className="text-[8px] text-red-500 font-extrabold uppercase tracking-wider bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded font-mono">
                                  {req.product.category}
                                </span>
                                <h4 className={`text-xs font-semibold tracking-tight mt-1 line-through ${isLight ? "text-slate-500" : "text-slate-500"}`}>{req.product.title}</h4>
                              </div>
                            </div>
                            <span className="text-xs font-bold font-mono text-red-500 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded shrink-0 line-through">
                              ${req.price.toLocaleString()}
                            </span>
                          </div>
                          <p className={`text-[9px] ${textMutedClass} font-mono mt-3 border-t border-red-500/10 pt-2 flex justify-between`}>
                            <span>Ref: {req.orderId}</span>
                            <span>Processed: {new Date(req.date).toLocaleDateString()}</span>
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Strategy Panel View */}
              <div className={`border p-6 rounded-2xl min-h-[400px] flex flex-col justify-between transition-colors ${cardClass}`}>
                {selectedProductForStrategy ? (
                  <div className="flex flex-col h-full justify-between space-y-6">
                    <div>
                      <div className="flex items-start justify-between">
                        <div>
                          <span className={`text-[9px] font-extrabold tracking-wider uppercase font-mono ${textMutedClass}`}>Premium AI Integration</span>
                          <h3 className={`text-sm font-semibold mt-1 ${isLight ? "text-slate-800" : "text-white"}`}>Bespoke 30-Day Deployment Campaign</h3>
                        </div>
                        <span className="p-1 rounded bg-amber-500/10 border border-amber-500/20 text-amber-500">
                          <Cpu className="w-4 h-4" />
                        </span>
                      </div>

                      <div className={`border rounded-xl p-4 my-4 transition-colors ${innerCardClass}`}>
                        <p className={`text-[10px] font-bold uppercase tracking-wider ${isLight ? "text-slate-500" : "text-slate-500"}`}>Solution Anchor</p>
                        <h4 className={`text-xs font-bold mt-1 ${isLight ? "text-slate-800" : "text-white"}`}>{selectedProductForStrategy.title}</h4>
                        <p className={`text-[10px] mt-1 line-clamp-2 leading-relaxed ${isLight ? "text-slate-600" : "text-slate-400"}`}>{selectedProductForStrategy.description}</p>
                      </div>

                      {!strategyResult ? (
                        /* Input business details */
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <label className={`block text-xs font-semibold uppercase tracking-wider ${isLight ? "text-slate-600" : "text-slate-400"}`}>Enterprise Audit Description</label>
                            <textarea
                              value={businessDescription}
                              onChange={(e) => setBusinessDescription(e.target.value)}
                              rows={4}
                              placeholder="e.g. A high-growth B2B SaaS startup specializing in digital logistics, currently launching in North America and targeting supply-chain executives..."
                              className={`w-full focus:ring-1 focus:ring-amber-500/20 focus:outline-none rounded-lg p-3 text-xs leading-relaxed resize-none ${inputClass}`}
                            />
                          </div>

                          <button
                            onClick={handleGenerateStrategy}
                            disabled={aiLoading}
                            className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold py-3 rounded-lg shadow-md shadow-amber-500/10 flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-55 active:scale-[0.98]"
                          >
                            {aiLoading ? (
                              <>
                                <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></span>
                                <span className="text-xs font-bold uppercase tracking-wider">Assembling Strategy Playbook...</span>
                              </>
                            ) : (
                              <>
                                <Sparkles className="w-4 h-4" />
                                <span className="text-xs font-bold uppercase tracking-wider">Compile AI 30-Day Blueprint</span>
                              </>
                            )}
                          </button>
                        </div>
                      ) : (
                        /* Strategy results printout */
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className={`border rounded-xl p-5 overflow-y-auto max-h-[300px] text-xs leading-relaxed font-sans ${innerCardClass}`}
                        >
                          <div className="flex items-center gap-2 text-amber-500 font-bold border-b border-slate-500/10 pb-3 mb-3 uppercase tracking-wider text-[10px]">
                            <ShieldCheck className="w-4 h-4" />
                            <span>Verified Strategy Document</span>
                          </div>

                          <div className={`prose prose-sm ${isLight ? "prose-slate" : "prose-invert"}`}>
                            {strategyResult.split('\n').map((line, i) => {
                              if (line.startsWith('###')) {
                                return <h4 key={i} className={`font-bold mt-4 mb-2 border-b pb-1 text-xs ${isLight ? "text-slate-800 border-slate-200" : "text-white border-slate-900/60"}`}>{line.replace('###', '').trim()}</h4>;
                              }
                              if (line.startsWith('**') || line.startsWith('- **')) {
                                return <p key={i} className={`mt-1 font-semibold ${isLight ? "text-slate-700" : "text-slate-200"}`}>{line}</p>;
                              }
                              return <p key={i} className={`mt-1 ${isLight ? "text-slate-600" : "text-slate-300"}`}>{line}</p>;
                            })}
                          </div>
                        </motion.div>
                      )}
                    </div>

                    {strategyResult && (
                      <button
                        onClick={() => setStrategyResult(null)}
                        className={`w-full py-2.5 rounded-xl text-xs font-semibold cursor-pointer transition-all border ${
                          isLight 
                            ? "bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700" 
                            : "bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-400 hover:text-white"
                        }`}
                      >
                        Re-Generate Strategy
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center py-10">
                    <div className={`border p-4 rounded-full text-slate-400 mb-4 animate-pulse ${isLight ? "bg-slate-100 border-slate-200" : "bg-slate-950 border-slate-900"}`}>
                      <Cpu className="w-8 h-8 text-amber-500" />
                    </div>
                    <h4 className={`text-sm font-semibold ${isLight ? "text-slate-800" : "text-white"}`}>AI Strategy Center</h4>
                    <p className={`text-xs max-w-xs mt-1 leading-relaxed ${textMutedClass}`}>
                      Select one of your corporate acquisitions from the cabinet list to activate the Gemini campaign generator.
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* ================================================================
               MY CART / CHART VIEW
               ================================================================ */
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                <div>
                  <h2 className={`text-lg font-semibold tracking-wide ${isLight ? "text-slate-800" : "text-white"}`}>
                    Corporate Cart & Simulation Chart
                  </h2>
                  <p className={`text-xs ${textMutedClass} mt-0.5`}>
                    Consolidate campaign solution mixes, configure multipliers, and authorize multi-procurement lines
                  </p>
                </div>
              </div>

              {plannerItems.length === 0 ? (
                <div className={`py-20 text-center border border-dashed rounded-2xl ${isLight ? "bg-slate-100/50 border-slate-200" : "bg-slate-900/10 border-slate-800"}`}>
                  <ShoppingCart className="w-12 h-12 text-slate-500 mx-auto mb-4 animate-bounce" />
                  <h3 className={`text-sm font-semibold ${isLight ? "text-slate-800" : "text-white"}`}>Your Campaign Cart / Chart is Empty</h3>
                  <p className={`text-xs ${textMutedClass} max-w-sm mx-auto mt-1 leading-relaxed`}>
                    Please navigate to the Market Catalog and allocate some of your marketing reserves to premium campaign solution blocks.
                  </p>
                  <button
                    onClick={() => setActiveTab('catalog')}
                    className="mt-5 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-xl shadow-md cursor-pointer active:scale-95 transition-all animate-pulse"
                  >
                    Browse Marketplace Offerings
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                  {/* Left: Cart Items List */}
                  <div className="lg:col-span-7 space-y-4">
                    <div className="flex justify-between items-center px-1">
                      <span className={`text-[10px] font-bold ${textMutedClass} uppercase tracking-wider`}>
                        Solutions Selected ({plannerItems.length})
                      </span>
                      <button
                        onClick={() => {
                          setPlannerItems([]);
                          localStorage.removeItem(`planner_${currentUser.id}`);
                          setAlertNotification("All campaign items cleared from cart.");
                          setTimeout(() => setAlertNotification(null), 3000);
                        }}
                        className="text-[10px] font-bold text-red-500 hover:text-red-400 flex items-center gap-1 cursor-pointer transition-colors px-2 py-1 rounded-lg hover:bg-red-500/10"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Clear All Items
                      </button>
                    </div>

                    <div className="space-y-3">
                      {plannerItems.map((item) => {
                        const originalProduct = products.find(p => p.id === item.id);
                        return (
                          <div
                            key={item.id}
                            className={`p-4 border rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all duration-300 ${cardClass}`}
                          >
                            <div className="flex gap-3.5 items-center">
                              {originalProduct?.imageUrl ? (
                                <img
                                  src={originalProduct.imageUrl}
                                  alt={item.title}
                                  className="w-12 h-12 object-cover rounded-xl border border-slate-500/10 shadow-sm shrink-0"
                                  referrerPolicy="no-referrer"
                                />
                              ) : (
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border ${isLight ? "bg-slate-100 border-slate-200 text-slate-400" : "bg-slate-950 border-slate-900 text-slate-500"}`}>
                                  <ImageIcon className="w-5 h-5" />
                                </div>
                              )}
                              <div>
                                <span className="text-[8px] text-amber-500 font-extrabold uppercase tracking-wider bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded font-mono">
                                  {item.category}
                                </span>
                                <h3 className={`text-xs font-semibold tracking-tight mt-1 ${isLight ? "text-slate-800" : "text-white"}`}>
                                  {item.title}
                                </h3>
                                <p className={`text-[10px] font-mono mt-0.5 ${textMutedClass}`}>
                                  Unit Cost: ${item.price.toLocaleString()}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-500/10">
                              <div className="flex items-center gap-1.5">
                                <button
                                  onClick={() => handleUpdatePlannerQty(item.id, -1)}
                                  className={`w-7 h-7 rounded-lg border font-bold text-xs flex items-center justify-center transition-colors cursor-pointer ${
                                    isLight 
                                      ? "bg-white border-slate-200 hover:bg-slate-50 text-slate-600" 
                                      : "bg-slate-900 border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white"
                                  }`}
                                  title="Decrease quantity"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                
                                <span className={`w-6 text-center font-mono text-xs font-bold ${isLight ? "text-slate-700" : "text-slate-300"}`}>
                                  {item.quantity}
                                </span>

                                <button
                                  onClick={() => handleUpdatePlannerQty(item.id, 1)}
                                  className={`w-7 h-7 rounded-lg border font-bold text-xs flex items-center justify-center transition-colors cursor-pointer ${
                                    isLight 
                                      ? "bg-white border-slate-200 hover:bg-slate-50 text-slate-600" 
                                      : "bg-slate-900 border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white"
                                  }`}
                                  title="Increase quantity"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>

                              <div className="text-right font-mono min-w-[80px]">
                                <span className="text-xs font-bold text-amber-500">
                                  ${(item.price * item.quantity).toLocaleString()}
                                </span>
                              </div>

                              <button
                                onClick={() => handleRemoveFromPlanner(item.id)}
                                className={`p-1.5 rounded-lg border cursor-pointer transition-colors ${
                                  isLight 
                                    ? "bg-white border-slate-200 hover:bg-red-50 hover:border-red-200 text-slate-400 hover:text-red-500" 
                                    : "bg-slate-900 border-slate-800 hover:bg-red-500/10 hover:border-red-500/20 text-slate-400 hover:text-red-400"
                                }`}
                                title="Remove item"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Right: Cart Summary / Allocation Chart Analysis */}
                  <div className="lg:col-span-5 space-y-6">
                    <div className={`border p-6 rounded-2xl transition-all ${cardClass} relative overflow-hidden`}>
                      <h3 className={`text-sm font-bold tracking-tight mb-4 ${isLight ? "text-slate-900" : "text-white"}`}>
                        Corporate Allocation Ledger
                      </h3>

                      <div className="space-y-3.5">
                        <div className="flex justify-between items-center text-xs">
                          <span className={textMutedClass}>Subtotal (Solution Value)</span>
                          <span className={`font-mono font-bold ${isLight ? "text-slate-800" : "text-white"}`}>
                            ${totalPlannerCost.toLocaleString()}
                          </span>
                        </div>

                        <div className="flex justify-between items-center text-xs">
                          <span className={textMutedClass}>Allocated Funding Weight</span>
                          <span className="font-mono text-amber-500 font-bold">
                            {allocationPercent}% of reserves
                          </span>
                        </div>

                        <div className="flex justify-between items-center text-xs">
                          <span className={textMutedClass}>Remaining Capital Reserves</span>
                          <span className={`font-mono font-bold ${totalPlannerCost > userBalance ? "text-red-500" : "text-emerald-500"}`}>
                            ${(userBalance - totalPlannerCost).toLocaleString()}
                          </span>
                        </div>

                        {/* Progress bar visually depicting remaining percentage */}
                        <div className={`h-1.5 rounded-full overflow-hidden ${isLight ? "bg-slate-100" : "bg-slate-950"}`}>
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${totalPlannerCost > userBalance ? "bg-red-500" : "bg-amber-500"}`}
                            style={{ width: `${Math.min(100, allocationPercent)}%` }}
                          />
                        </div>

                        {/* Warnings */}
                        {totalPlannerCost > userBalance && (
                          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-[10px] text-red-400 leading-normal flex gap-2">
                            <ShieldAlert className="w-4 h-4 shrink-0 animate-pulse" />
                            <span>
                              <strong>Exceeds Authorized Budget:</strong> Your total campaign value exceeds your current Line-of-Credit reserves. Please trim solution slots before submitting.
                            </span>
                          </div>
                        )}

                        <div className="border-t border-slate-500/10 my-4 pt-4">
                          <button
                            disabled={user && totalPlannerCost > userBalance}
                            onClick={() => {
                              if (!user) {
                                if (onOpenLogin) onOpenLogin();
                              } else {
                                setIsCartCheckoutOpen(true);
                              }
                            }}
                            className={`w-full py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
                              user && totalPlannerCost > userBalance
                                ? "bg-slate-200 text-slate-400 cursor-not-allowed border-none dark:bg-slate-800 dark:text-slate-600"
                                : "bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold shadow-lg shadow-amber-500/10 hover:scale-[1.01] active:scale-[0.99]"
                            }`}
                          >
                            <ShoppingCart className="w-4 h-4" />
                            <span>Buy Now</span>
                          </button>
                        </div>

                        <p className={`text-[9px] text-center uppercase tracking-widest ${textMutedClass} font-mono mt-2`}>
                          *Requests are held pending board admin clearance
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      )}

      {/* Payment Gateway Modal Integration & Floating Alerts */}
      <AnimatePresence>
        {problemAlert && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-55">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`w-full max-w-md border rounded-2xl p-6 shadow-2xl relative overflow-hidden ${
                isLight ? "bg-white border-slate-200" : "bg-slate-900 border-slate-800"
              }`}
            >
              {/* Header colored bar */}
              <div className={`absolute top-0 inset-x-0 h-1 ${
                problemAlert.type === "error" ? "bg-red-500" : "bg-amber-500"
              }`} />

              <button
                onClick={() => setProblemAlert(null)}
                className={`absolute top-4 right-4 p-1.5 rounded-lg border transition-colors cursor-pointer ${
                  isLight 
                    ? "bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-500" 
                    : "bg-slate-950/50 hover:bg-slate-950/80 border-slate-800/40 text-slate-400"
                }`}
                title="Close warning"
              >
                <X className="w-4.5 h-4.5" />
              </button>

              <div className="flex items-start gap-4 mt-2">
                <div className={`p-3 rounded-full shrink-0 border ${
                  problemAlert.type === "error" 
                    ? "bg-red-500/10 border-red-500/20 text-red-500" 
                    : "bg-amber-500/10 border-amber-500/20 text-amber-500"
                }`}>
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <div className="space-y-1 flex-1">
                  <h3 className={`text-sm font-bold tracking-tight ${
                    isLight ? "text-slate-800" : "text-white"
                  }`}>
                    {problemAlert.title}
                  </h3>
                  <p className={`text-xs mt-1.5 leading-relaxed ${
                    isLight ? "text-slate-600" : "text-slate-400"
                  }`}>
                    {problemAlert.message}
                  </p>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setProblemAlert(null)}
                  className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-xl cursor-pointer transition-all active:scale-[0.98] ${
                    problemAlert.type === "error"
                      ? "bg-red-500 text-white hover:bg-red-600"
                      : "bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 hover:from-amber-400 hover:to-amber-500"
                  }`}
                >
                  Acknowledge & Close
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {checkoutProduct && (
          <PaymentGateway
            product={checkoutProduct}
            user={user}
            onClose={() => setCheckoutProduct(null)}
            onPaymentSuccess={handlePaymentSuccess}
          />
        )}
        {isCartCheckoutOpen && (
          <PaymentGateway
            cartItems={plannerItems}
            user={user}
            onClose={() => setIsCartCheckoutOpen(false)}
            onCartPaymentSuccess={handleCartPaymentSuccess}
          />
        )}

        {/* Dynamic Floating Alert Notification Center */}
        {alertNotification && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 350 }}
            className={`fixed bottom-6 right-6 z-50 rounded-2xl border p-4 shadow-2xl backdrop-blur-md transition-all ${
              alertNotification.visible
                ? isLight 
                  ? "bg-white/95 border-amber-200 text-slate-900 shadow-amber-500/10 w-[90%] sm:w-80" 
                  : "bg-slate-900/95 border-amber-500/30 text-white shadow-amber-500/10 w-[90%] sm:w-80"
                : isLight
                  ? "bg-amber-100/95 border-amber-200 text-slate-800 p-2.5 rounded-xl shadow-md w-44"
                  : "bg-amber-500/10 border-amber-500/20 text-amber-400 p-2.5 rounded-xl shadow-md w-44"
            }`}
          >
            {alertNotification.visible ? (
              <div>
                {/* Header of alert */}
                <div className="flex justify-between items-start mb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="p-1 rounded-lg bg-amber-500/10 text-amber-500 border border-amber-500/20">
                      <Bell className="w-4 h-4 animate-bounce" />
                    </span>
                    <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest font-mono">
                      Staged Solution
                    </span>
                  </div>
                  <div className="flex gap-1.5">
                    {/* Hide Button */}
                    <button
                      onClick={() => setAlertNotification(prev => prev ? { ...prev, visible: false } : null)}
                      className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded border transition-colors cursor-pointer ${
                        isLight
                          ? "bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-600"
                          : "bg-slate-850 hover:bg-slate-800 border-slate-800 text-slate-400 hover:text-white"
                      }`}
                      title="Hide/Minimize notification"
                    >
                      Hide
                    </button>
                    {/* Close/Remove Button */}
                    <button
                      onClick={() => setAlertNotification(null)}
                      className={`p-1 rounded hover:bg-slate-500/10 transition-colors cursor-pointer ${
                        isLight ? "text-slate-400 hover:text-slate-600" : "text-slate-500 hover:text-slate-300"
                      }`}
                      title="Dismiss notification"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Content of alert */}
                <div className="space-y-1">
                  <h4 className={`text-xs font-semibold ${isLight ? "text-slate-800" : "text-white"}`}>
                    Campaign Solution Added
                  </h4>
                  <p className={`text-[11px] leading-relaxed line-clamp-2 ${textMutedClass}`}>
                    Added <strong className={isLight ? "text-slate-900" : "text-amber-400"}>"{alertNotification.title}"</strong> to your campaign planner.
                  </p>
                  <div className="flex justify-between items-center pt-2.5 mt-2 border-t border-slate-500/10 text-[10px]">
                    <span className="font-mono text-amber-500 font-bold bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded uppercase">
                      {alertNotification.category}
                    </span>
                    <button
                      onClick={() => {
                        setActiveTab('cart');
                        setAlertNotification(prev => prev ? { ...prev, visible: false } : null);
                      }}
                      className="text-amber-500 hover:text-amber-400 font-bold uppercase tracking-wider flex items-center gap-0.5 cursor-pointer"
                    >
                      View Cart <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              // Minimized state: Simple small pill button/badge to Show
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider truncate">
                  <Bell className="w-3.5 h-3.5 text-amber-500 animate-pulse shrink-0" />
                  <span className="truncate">Staged Added</span>
                </span>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => setAlertNotification(prev => prev ? { ...prev, visible: true } : null)}
                    className="text-[9px] font-extrabold uppercase bg-amber-500 text-slate-950 px-1.5 py-0.5 rounded cursor-pointer hover:bg-amber-400 transition-colors"
                  >
                    Show
                  </button>
                  <button
                    onClick={() => setAlertNotification(null)}
                    className="p-0.5 rounded hover:bg-slate-500/10 transition-colors cursor-pointer text-slate-500 hover:text-slate-300"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

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
