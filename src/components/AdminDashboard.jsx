import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Plus, Minus, Edit, Trash2, Sparkles, TrendingUp, DollarSign, Package, 
  ShoppingBag, Receipt, AlertCircle, X, Check, Eye, Sun, Moon, 
  Users, UserCheck, ShieldAlert, ChevronRight, CheckCircle2, Ban,
  Image as ImageIcon, Upload, Link, Home, ArrowRight, Shield, Activity, Phone, Tag, Search
} from "lucide-react";

import LogoSelectorModal, { getActiveLogoPath } from "./LogoSelectorModal";
import { 
  getClientProducts, 
  saveClientProducts, 
  getClientCategories, 
  saveClientCategories, 
  FALLBACK_PRODUCT_IMAGE 
} from "../data/initialProducts";

export default function AdminDashboard({ user, onLogout, theme, toggleTheme }) {
  const [activeLogo, setActiveLogo] = useState(() => getActiveLogoPath());
  const [isLogoModalOpen, setIsLogoModalOpen] = useState(false);
  const [products, setProducts] = useState([]);
  const [productSearchQuery, setProductSearchQuery] = useState("");
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [usersLoading, setUsersLoading] = useState(false);
  const [error, setError] = useState(null);

  // Active Admin Screen Tab
  const [activeTab, setActiveTab] = useState('home');

  // Categories list & creation state
  const [categories, setCategories] = useState([]);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [categoryLoading, setCategoryLoading] = useState(false);

  // Form State for creating/editing products
  const [showProductModal, setShowProductModal] = useState(false);
  const [editProductId, setEditProductId] = useState(null);
  const [formTitle, setFormTitle] = useState("");
  const [formPrice, setFormPrice] = useState("");
  const [formStock, setFormStock] = useState("");
  const [formCategory, setFormCategory] = useState("ELECTRONICS");
  const [formTags, setFormTags] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formImageUrl, setFormImageUrl] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [selectedOrderForInvoice, setSelectedOrderForInvoice] = useState(null);

  // Batch Ingress Form State
  const [isBatchMode, setIsBatchMode] = useState(false);
  const [keepModalOpen, setKeepModalOpen] = useState(false);
  const [batchRows, setBatchRows] = useState([
    { title: "", price: "", stock: "5", description: "", tags: "" }
  ]);

  // Form State for creating users
  const [showUserModal, setShowUserModal] = useState(false);
  const [userFormName, setUserFormName] = useState("");
  const [userFormEmail, setUserFormEmail] = useState("");
  const [userFormPassword, setUserFormPassword] = useState("");
  const [userFormRole, setUserFormRole] = useState("buyer");
  const [userFormCompanyName, setUserFormCompanyName] = useState("");
  const [userFormAge, setUserFormAge] = useState("");
  const [userFormGender, setUserFormGender] = useState("");
  const [userFormPhone, setUserFormPhone] = useState("");
  const [userFormBalance, setUserFormBalance] = useState("100000");

  useEffect(() => {
    fetchData();
    fetchUsers();
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/categories");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setCategories(data);
          saveClientCategories(data);
          if (data.length > 0 && !data.includes(formCategory)) {
            setFormCategory(data[0]);
          }
          return;
        }
      }
    } catch (err) {
      console.warn("API categories unavailable, loading client categories", err);
    }
    const localCats = getClientCategories();
    setCategories(localCats);
    if (localCats.length > 0 && !localCats.includes(formCategory)) {
      setFormCategory(localCats[0]);
    }
  };

  const handleSaveCategory = async (e) => {
    e.preventDefault();
    if (!newCategoryName.trim()) {
      alert("Category name cannot be empty.");
      return;
    }
    try {
      setCategoryLoading(true);
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newCategoryName })
      });
      if (res.ok) {
        setNewCategoryName("");
        fetchCategories();
        return;
      }
    } catch (err) {
      console.warn("API save category failed, updating client categories", err);
    } finally {
      setCategoryLoading(false);
    }
    const currentCats = getClientCategories();
    if (!currentCats.includes(newCategoryName.trim())) {
      const updated = [...currentCats, newCategoryName.trim()];
      saveClientCategories(updated);
      setCategories(updated);
    }
    setNewCategoryName("");
  };

  const handleDeleteCategory = async (name) => {
    if (!confirm(`Are you sure you want to delete the category "${name}"? Existing products in this category will not be deleted, but they will lose this category reference.`)) {
      return;
    }
    try {
      setCategoryLoading(true);
      const res = await fetch("/api/categories", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name })
      });
      if (res.ok) {
        fetchCategories();
        return;
      }
    } catch (err) {
      console.warn("API delete category failed, updating client categories", err);
    } finally {
      setCategoryLoading(false);
    }
    const currentCats = getClientCategories();
    const updated = currentCats.filter((c) => c !== name);
    saveClientCategories(updated);
    setCategories(updated);
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      let dataProducts = null;
      let dataOrders = [];

      try {
        const resProducts = await fetch("/api/products");
        if (resProducts.ok) {
          const json = await resProducts.json();
          if (Array.isArray(json) && json.length > 0) {
            dataProducts = json;
            saveClientProducts(json);
          }
        }
      } catch (err) {
        console.warn("API products unavailable, falling back to local products", err);
      }

      try {
        const resOrders = await fetch("/api/orders");
        if (resOrders.ok) {
          dataOrders = await resOrders.json();
        }
      } catch (err) {
        console.warn("API orders unavailable", err);
      }

      if (!dataProducts || !Array.isArray(dataProducts) || dataProducts.length === 0) {
        dataProducts = getClientProducts();
      }

      setProducts(dataProducts);
      setOrders(dataOrders);
      fetchCategories();
    } catch (err) {
      console.error("Dashboard load error, defaulting to local products:", err);
      setProducts(getClientProducts());
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      setUsersLoading(true);
      const res = await fetch("/api/users");
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (err) {
      console.error("Failed to fetch users", err);
    } finally {
      setUsersLoading(false);
    }
  };

  const handleApproveUser = async (userId) => {
    try {
      const res = await fetch(`/api/users/${userId}/approve`, { method: "POST" });
      if (!res.ok) throw new Error("Approval request failed.");
      fetchUsers();
    } catch (err) {
      alert(err.message || "Failed to approve user.");
    }
  };

  const handleRejectUser = async (userId) => {
    if (!confirm("Are you absolutely sure you want to decline this registration and purge their credentials?")) {
      return;
    }
    try {
      const res = await fetch(`/api/users/${userId}/reject`, { method: "POST" });
      if (!res.ok) throw new Error("Decline request failed.");
      fetchUsers();
    } catch (err) {
      alert(err.message || "Failed to decline user.");
    }
  };

  const handleApproveOrder = async (orderId) => {
    try {
      const res = await fetch(`/api/orders/${orderId}/approve`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Approval request failed.");
      fetchData(); // reload orders and products (to update revenue/stock)
      fetchUsers(); // reload users (since buyer balance might be updated)
    } catch (err) {
      alert(err.message || "Failed to approve purchase.");
    }
  };

  const handleRejectOrder = async (orderId) => {
    if (!confirm("Are you sure you want to decline this purchase request?")) {
      return;
    }
    try {
      const res = await fetch(`/api/orders/${orderId}/reject`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Decline request failed.");
      fetchData();
    } catch (err) {
      alert(err.message || "Failed to reject purchase.");
    }
  };

  const handleKickUser = async (userId) => {
    if (userId === user.id) {
      alert("You cannot kick your own administrator account!");
      return;
    }
    const member = users.find(u => u.id === userId);
    const roleText = member?.role === "buyer" ? "buyer representative" : "administrator";
    if (!confirm(`Are you sure you want to remove and delete this ${roleText} (${member?.name || "Member"}) from the directory? All their access will be revoked immediately.`)) {
      return;
    }
    try {
      const res = await fetch(`/api/users/${userId}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to remove member.");
      fetchUsers();
    } catch (err) {
      alert(err.message || "Failed to remove member.");
    }
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();
    if (!userFormName || !userFormEmail) {
      alert("Please enter both name and email.");
      return;
    }
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: userFormName,
          email: userFormEmail,
          password: userFormPassword || "temp123",
          role: userFormRole,
          companyName: userFormCompanyName || "Individual Operator",
          age: userFormAge ? Number(userFormAge) : undefined,
          gender: userFormGender || undefined,
          phone: userFormPhone || undefined,
          balance: userFormRole === "buyer" ? (userFormBalance ? Number(userFormBalance) : 100000) : undefined
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to add member.");
      
      // Reset form and close modal
      setUserFormName("");
      setUserFormEmail("");
      setUserFormPassword("");
      setUserFormRole("buyer");
      setUserFormCompanyName("");
      setUserFormAge("");
      setUserFormGender("");
      setUserFormPhone("");
      setUserFormBalance("100000");
      setShowUserModal(false);
      
      fetchUsers();
    } catch (err) {
      alert(err.message || "Failed to add member.");
    }
  };

  const handleOpenProductModal = (product) => {
    setIsBatchMode(false);
    setKeepModalOpen(false);
    setBatchRows([{ title: "", price: "", stock: "5", description: "", tags: "" }]);
    if (product) {
      setEditProductId(product.id);
      setFormTitle(product.title);
      setFormPrice(String(product.price));
      setFormStock(String(product.stock));
      setFormCategory(product.category);
      setFormTags(product.tags.join(", "));
      setFormDescription(product.description);
      setFormImageUrl(product.imageUrl || "");
    } else {
      setEditProductId(null);
      setFormTitle("");
      setFormPrice("");
      setFormStock("");
      setFormCategory(categories[0] || "ELECTRONICS");
      setFormTags("");
      setFormDescription("");
      setFormImageUrl("");
    }
    setShowProductModal(true);
  };

  const handleGenerateAiCopy = async () => {
    if (!formTitle) {
      alert("Please specify a Product Title first so Gemini has context.");
      return;
    }
    setAiLoading(true);
    try {
      const tagsArray = formTags.split(",").map(t => t.trim()).filter(Boolean);
      const res = await fetch("/api/gemini/generate-copy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formTitle,
          price: formPrice || "10000",
          category: formCategory,
          tags: tagsArray
        })
      });

      if (!res.ok) throw new Error("Gemini Copywriter failed.");
      const data = await res.json();
      setFormDescription(data.copy);
    } catch (err) {
      alert("AI Copy generation failed. Please enter manually or try again.");
    } finally {
      setAiLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert("Image is too large. Please select an image under 2MB for optimized storage.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === "string") {
        setFormImageUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();

    if (isBatchMode && !editProductId) {
      // Validate all batch rows
      const invalidRow = batchRows.some(row => !row.title || !row.price || !row.stock || !row.description);
      if (invalidRow) {
        alert("Please fill in Title, Price, Stock, and Description for all product rows.");
        return;
      }

      try {
        setLoading(true);
        for (const row of batchRows) {
          const tagsArray = row.tags.split(",").map(t => t.trim()).filter(Boolean);
          const payload = {
            title: row.title,
            price: Number(row.price),
            stock: Number(row.stock),
            category: formCategory,
            tags: tagsArray,
            description: row.description,
            imageUrl: "" // Batch mode default empty image
          };

          const res = await fetch("/api/products", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
          });

          if (!res.ok) {
            const errData = await res.json();
            throw new Error(errData.message || `Failed to save product: ${row.title}`);
          }
        }

        setShowProductModal(false);
        fetchData();
        alert(`Successfully added ${batchRows.length} products to category "${formCategory}"!`);
      } catch (err) {
        alert(err.message || "Failed to save batch products.");
      } finally {
        setLoading(false);
      }
      return;
    }

    if (!formTitle || !formPrice || !formStock || !formDescription) {
      alert("Please fill in all product details.");
      return;
    }

    const tagsArray = formTags.split(",").map(t => t.trim()).filter(Boolean);
    const payload = {
      title: formTitle,
      price: Number(formPrice),
      stock: Number(formStock),
      category: formCategory,
      tags: tagsArray,
      description: formDescription,
      imageUrl: formImageUrl
    };

    try {
      const endpoint = editProductId ? `/api/products/${editProductId}` : "/api/products";
      const method = editProductId ? "PUT" : "POST";

      let apiSuccess = false;
      try {
        const res = await fetch(endpoint, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          apiSuccess = true;
        }
      } catch (err) {
        console.warn("API product save failed, updating local client products", err);
      }

      if (!apiSuccess) {
        let currentLocalProds = getClientProducts();
        if (editProductId) {
          currentLocalProds = currentLocalProds.map(p => p.id === editProductId ? { ...p, ...payload } : p);
        } else {
          const newProd = { id: `prod-${Date.now()}`, ...payload };
          currentLocalProds = [newProd, ...currentLocalProds];
        }
        saveClientProducts(currentLocalProds);
        setProducts(currentLocalProds);
      } else {
        fetchData();
      }

      if (keepModalOpen && !editProductId) {
        setFormTitle("");
        setFormPrice("");
        setFormStock("");
        setFormDescription("");
        setFormImageUrl("");
      } else {
        setShowProductModal(false);
      }
    } catch (err) {
      alert(err.message || "Something went wrong saving the product.");
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!confirm("Are you absolutely sure you want to delete this marketing product? This is irreversible.")) {
      return;
    }

    let apiSuccess = false;
    try {
      const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
      if (res.ok) {
        apiSuccess = true;
        fetchData();
      }
    } catch (err) {
      console.warn("API delete product failed, updating local client products", err);
    }

    if (!apiSuccess) {
      const currentLocalProds = getClientProducts().filter(p => p.id !== id);
      saveClientProducts(currentLocalProds);
      setProducts(currentLocalProds);
    }
  };

  // Compute dashboard metrics
  const totalRevenue = orders.reduce((sum, o) => sum + o.price, 0);
  const activeProducts = products.length;
  const outOfStockItems = products.filter(p => p.stock === 0).length;
  const totalOrdersCount = orders.length;

  // Compute Users metrics
  const totalUsers = users.length;
  const pendingUsers = users.filter(u => u.approved === false);
  const approvedBuyersCount = users.filter(u => u.role === "buyer" && u.approved !== false).length;

  // Custom Category sales data for custom SVG rendering
  const chartCategories = categories.length > 0 ? categories : ["Public Relations", "Paid Acquisition", "Brand Strategy", "Influencer Marketing", "Conversion Optimization"];
  const categorySales = chartCategories.map(cat => {
    const count = orders.filter(o => {
      const prod = products.find(p => p.id === o.productId);
      return prod ? prod.category === cat : false;
    }).length;
    const value = orders.filter(o => {
      const prod = products.find(p => p.id === o.productId);
      return prod ? prod.category === cat : false;
    }).reduce((sum, o) => sum + o.price, 0);

    return { name: cat, count, value };
  });

  const maxVal = Math.max(...categorySales.map(c => c.value), 10000);

  // Theme variable styles definitions for Light / Dark Mode support
  const isLight = theme === "light";
  const bgClass = isLight ? "bg-[#e3f0eb] text-slate-900" : "bg-[#0d1d1a] text-white";
  const navClass = isLight ? "border-slate-200 bg-white/90" : "border-slate-900 bg-slate-950/80";
  const cardClass = isLight ? "bg-white border-slate-200/80 shadow-sm" : "bg-slate-900/60 border-slate-900";
  const textMutedClass = isLight ? "text-slate-500" : "text-slate-400";
  const textTitleClass = isLight ? "text-slate-800" : "text-white";
  const secondaryBtnClass = isLight 
    ? "bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700" 
    : "bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-400 hover:text-white";
  const inputClass = isLight ? "bg-white border-slate-300 focus:border-amber-500 text-slate-900 focus:ring-1 focus:ring-amber-500/20" : "bg-slate-950/50 border-slate-800 focus:border-amber-500/50 text-white focus:ring-1 focus:ring-amber-500/20";
  const selectOptionClass = isLight ? "bg-white text-slate-900" : "bg-slate-900 text-white";
  const tableHeaderClass = isLight ? "bg-slate-100 border-b border-slate-200 text-slate-600" : "bg-slate-950 border-b border-slate-900 text-slate-400";
  const tableBorderClass = isLight ? "border-slate-100" : "border-slate-900/60";
  const itemBorderClass = isLight ? "border-slate-150" : "border-slate-800/40";

  return (
    <div className={`min-h-screen ${bgClass} flex flex-col font-sans transition-colors duration-300`}>
      {/* Admin Navbar */}
      <nav className={`border-b ${navClass} backdrop-blur-md sticky top-0 z-40 px-6 py-4 flex justify-between items-center transition-colors`}>
        <div className="flex items-center gap-3">
          <img 
            src={activeLogo} 
            alt="Merkato Online Store Logo" 
            className="h-10 w-auto rounded-lg shadow-sm border border-slate-500/10 shrink-0 object-cover" 
            referrerPolicy="no-referrer"
          />
          <div>
            <h1 className="text-md font-semibold tracking-tight">Merkato Store Manager</h1>
            <p className={`text-[10px] ${textMutedClass} uppercase tracking-widest font-mono`}>Secure Corporate Terminal</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:block text-right">
            <span className="text-xs font-semibold text-amber-500 tracking-wide uppercase">{user.name}</span>
            <p className={`text-[9px] ${textMutedClass} font-mono tracking-wider`}>{user.companyName}</p>
          </div>

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

          <button
            onClick={onLogout}
            className={`px-3.5 py-1.5 rounded-lg border text-xs font-medium cursor-pointer transition-colors ${
              isLight 
                ? "bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700" 
                : "bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            Exit Terminal
          </button>
        </div>
      </nav>

      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center py-20">
          <span className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4"></span>
          <p className={`text-sm font-mono tracking-wide ${textMutedClass}`}>Syncing corporate database registers...</p>
        </div>
      ) : (
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6 sm:space-y-8">
          
          {/* Admin Navigation Tabs */}
          <div className="flex border-b border-slate-500/10 gap-2 overflow-x-auto">
            <button
              onClick={() => setActiveTab('home')}
              className={`pb-3 px-4 text-xs sm:text-sm font-semibold transition-all border-b-2 cursor-pointer flex items-center gap-2 shrink-0 ${
                activeTab === 'home' 
                  ? "border-amber-500 text-amber-500" 
                  : `${textMutedClass} border-transparent hover:text-amber-500/75`
              }`}
            >
              <Home className="w-4 h-4" />
              <span>Dashboard Home</span>
            </button>
            <button
              onClick={() => setActiveTab('inventory')}
              className={`pb-3 px-4 text-xs sm:text-sm font-semibold transition-all border-b-2 cursor-pointer flex items-center gap-2 shrink-0 ${
                activeTab === 'inventory' 
                  ? "border-amber-500 text-amber-500" 
                  : `${textMutedClass} border-transparent hover:text-amber-500/75`
              }`}
            >
              <Package className="w-4 h-4" />
              <span>Products & Revenue</span>
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`pb-3 px-4 text-xs sm:text-sm font-semibold transition-all border-b-2 cursor-pointer flex items-center gap-2 relative shrink-0 ${
                activeTab === 'users' 
                  ? "border-amber-500 text-amber-500" 
                  : `${textMutedClass} border-transparent hover:text-amber-500/75`
              }`}
            >
              <Users className="w-4 h-4" />
              <span>User Verifications</span>
              {pendingUsers.length > 0 && (
                <span className="absolute -top-1 right-0 bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full animate-pulse">
                  {pendingUsers.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('categories')}
              className={`pb-3 px-4 text-xs sm:text-sm font-semibold transition-all border-b-2 cursor-pointer flex items-center gap-2 relative shrink-0 ${
                activeTab === 'categories' 
                  ? "border-amber-500 text-amber-500" 
                  : `${textMutedClass} border-transparent hover:text-amber-500/75`
              }`}
            >
              <Tag className="w-4 h-4" />
              <span>Category Manager</span>
            </button>
          </div>

          <AnimatePresence mode="wait">
            {activeTab === 'home' && (
              <motion.div
                key="home-tab"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-6 sm:space-y-8"
              >
                {/* Executive Welcome Card */}
                <div className={`border p-6 sm:p-8 rounded-3xl relative overflow-hidden transition-colors ${cardClass}`}>
                  <div className="absolute top-[-40%] right-[-10%] w-[45%] h-[150%] rounded-full bg-amber-500/5 blur-[100px] pointer-events-none" />
                  <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-2 max-w-2xl">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 text-amber-500 rounded-full text-xs font-semibold uppercase tracking-wider border border-amber-500/10">
                        <Shield className="w-3.5 h-3.5" />
                        <span>Executive Access Only</span>
                      </div>
                      <h2 className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${isLight ? "text-slate-900" : "text-white"}`}>
                        Welcome Back, <span className="text-amber-500">{user.name}</span>
                      </h2>
                      <p className={`text-sm leading-relaxed ${textMutedClass}`}>
                        You have successfully authenticated with the Merkato Secure Node. As the <strong>Store Manager</strong>, you are vested with full authorization to curate campaign products, audit financial transactions, verify buyer ingress registries, and supervise market expansion.
                      </p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3 md:self-center shrink-0">
                      <button
                        onClick={() => setActiveTab('inventory')}
                        className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-amber-500/10 hover:shadow-amber-500/25 flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-[0.98]"
                      >
                        <span>Inventory Desk</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleOpenProductModal()}
                        className={`px-5 py-2.5 border rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${secondaryBtnClass}`}
                      >
                        <Plus className="w-4 h-4" />
                        <span>Launch Solution</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Micro KPIs Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <button
                    onClick={() => setActiveTab('inventory')}
                    className={`border p-5 rounded-2xl relative overflow-hidden flex items-center gap-4 text-left transition-all hover:scale-[1.01] hover:border-amber-500/40 cursor-pointer ${cardClass}`}
                  >
                    <div className="p-3 bg-amber-500/10 text-amber-500 rounded-xl">
                      <DollarSign className="w-6 h-6" />
                    </div>
                    <div>
                      <p className={`text-[10px] ${textMutedClass} font-bold uppercase tracking-wider`}>Total Capture Revenue</p>
                      <h3 className={`text-2xl font-bold font-mono mt-1 ${isLight ? "text-slate-900" : "text-white"}`}>${totalRevenue.toLocaleString()}</h3>
                      <p className="text-[9px] text-amber-500 font-semibold mt-1 flex items-center gap-0.5">
                        <span>View Revenue Desk</span>
                        <ChevronRight className="w-3 h-3" />
                      </p>
                    </div>
                    <div className="absolute top-0 right-0 p-3 text-slate-500/5 font-bold text-5xl font-mono pointer-events-none select-none">$</div>
                  </button>

                  <button
                    onClick={() => setActiveTab('users')}
                    className={`border p-5 rounded-2xl relative overflow-hidden flex items-center gap-4 text-left transition-all hover:scale-[1.01] hover:border-amber-500/40 cursor-pointer ${cardClass}`}
                  >
                    <div className="p-3 bg-blue-500/10 text-blue-500 rounded-xl">
                      <Users className="w-6 h-6" />
                    </div>
                    <div>
                      <p className={`text-[10px] ${textMutedClass} font-bold uppercase tracking-wider`}>Board Registrants</p>
                      <h3 className={`text-2xl font-bold font-mono mt-1 ${isLight ? "text-slate-900" : "text-white"}`}>{totalUsers}</h3>
                      <p className="text-[9px] text-blue-400 font-semibold mt-1 flex items-center gap-0.5">
                        <span>Directory Registry</span>
                        <ChevronRight className="w-3 h-3" />
                      </p>
                    </div>
                    <div className="absolute top-0 right-0 p-3 text-slate-500/5 font-bold text-5xl font-mono pointer-events-none select-none">U</div>
                  </button>

                  <button
                    onClick={() => setActiveTab('users')}
                    className={`border p-5 rounded-2xl relative overflow-hidden flex items-center gap-4 text-left transition-all hover:scale-[1.01] hover:border-red-500/40 cursor-pointer ${cardClass}`}
                  >
                    <div className="p-3 bg-red-500/10 text-red-500 rounded-xl">
                      <ShieldAlert className="w-6 h-6" />
                    </div>
                    <div>
                      <p className={`text-[10px] ${textMutedClass} font-bold uppercase tracking-wider`}>Pending Ingress Requests</p>
                      <h3 className={`text-2xl font-bold font-mono mt-1 ${pendingUsers.length > 0 ? "text-red-500 font-extrabold" : (isLight ? "text-slate-900" : "text-white")}`}>{pendingUsers.length}</h3>
                      <p className="text-[9px] text-red-400 font-semibold mt-1 flex items-center gap-0.5">
                        <span>Review Admissions</span>
                        <ChevronRight className="w-3 h-3" />
                      </p>
                    </div>
                    {pendingUsers.length > 0 && (
                      <span className="absolute top-2 right-2 flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                      </span>
                    )}
                    <div className="absolute top-0 right-0 p-3 text-slate-500/5 font-bold text-5xl font-mono pointer-events-none select-none">!</div>
                  </button>

                  <button
                    onClick={() => setActiveTab('inventory')}
                    className={`border p-5 rounded-2xl relative overflow-hidden flex items-center gap-4 text-left transition-all hover:scale-[1.01] hover:border-amber-500/40 cursor-pointer ${cardClass}`}
                  >
                    <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl">
                      <Package className="w-6 h-6" />
                    </div>
                    <div>
                      <p className={`text-[10px] ${textMutedClass} font-bold uppercase tracking-wider`}>Active Core Solutions</p>
                      <h3 className={`text-2xl font-bold font-mono mt-1 ${isLight ? "text-slate-900" : "text-white"}`}>{activeProducts}</h3>
                      <p className="text-[9px] text-emerald-400 font-semibold mt-1 flex items-center gap-0.5">
                        <span>Manage Solutions</span>
                        <ChevronRight className="w-3 h-3" />
                      </p>
                    </div>
                    <div className="absolute top-0 right-0 p-3 text-slate-500/5 font-bold text-5xl font-mono pointer-events-none select-none">P</div>
                  </button>
                </div>

                {/* Secondary Overview Blocks */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* System Analytics Indicator */}
                  <div className={`lg:col-span-5 border p-5 sm:p-6 rounded-2xl transition-colors flex flex-col justify-between ${cardClass}`}>
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-amber-500/10 text-amber-500 rounded-lg">
                          <Activity className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold tracking-wide">Secure Node Activity Status</h4>
                          <p className="text-[10px] text-slate-500 font-mono">System Telemetry Log</p>
                        </div>
                      </div>

                      <div className="space-y-3 pt-2">
                        <div className={`p-3 rounded-xl flex items-center justify-between text-xs ${isLight ? "bg-slate-50" : "bg-slate-950/40"}`}>
                          <span className={textMutedClass}>Core Security Engine</span>
                          <span className="font-mono text-emerald-500 font-bold uppercase tracking-wider text-[10px]">Active</span>
                        </div>
                        <div className={`p-3 rounded-xl flex items-center justify-between text-xs ${isLight ? "bg-slate-50" : "bg-slate-950/40"}`}>
                          <span className={textMutedClass}>Direct Client Connection</span>
                          <span className="font-mono text-emerald-500 font-bold uppercase tracking-wider text-[10px]">Secure TLS</span>
                        </div>
                        <div className={`p-3 rounded-xl flex items-center justify-between text-xs ${isLight ? "bg-slate-50" : "bg-slate-950/40"}`}>
                          <span className={textMutedClass}>Merkato Node Authority</span>
                          <span className="font-mono text-amber-500 font-bold uppercase tracking-wider text-[10px]">Store Manager</span>
                        </div>
                        <div className={`p-3 rounded-xl flex items-center justify-between text-xs ${isLight ? "bg-slate-50" : "bg-slate-950/40"}`}>
                          <span className={textMutedClass}>Authorized Buyers Registered</span>
                          <span className={`font-mono font-bold ${isLight ? "text-slate-900" : "text-white"}`}>{approvedBuyersCount} entities</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-6 border-t border-slate-500/10 mt-6 flex justify-between items-center text-[11px]">
                      <span className={textMutedClass}>Merkato Protocol v2.4.0</span>
                      <span className="text-emerald-500 animate-pulse font-bold flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        ONLINE
                      </span>
                    </div>
                  </div>

                  {/* Immediate Attention: Pending Users Queue Preview */}
                  <div className={`lg:col-span-7 border p-5 sm:p-6 rounded-2xl transition-colors ${cardClass}`}>
                    <div className="flex justify-between items-center mb-6">
                      <div>
                        <h4 className="text-sm font-semibold tracking-wide">Admission Queue Preview</h4>
                        <p className={`text-[10px] ${textMutedClass} mt-0.5`}>Most recent registered operators awaiting executive ingress clearance</p>
                      </div>
                      {pendingUsers.length > 0 && (
                        <span className="bg-red-500 text-white font-extrabold text-[9px] px-2 py-0.5 rounded-full animate-bounce">
                          {pendingUsers.length} pending
                        </span>
                      )}
                    </div>

                    {pendingUsers.length === 0 ? (
                      <div className="text-center py-12 flex flex-col items-center justify-center">
                        <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-full mb-3">
                          <Check className="w-5 h-5 stroke-[3px]" />
                        </div>
                        <h5 className={`text-xs font-semibold ${isLight ? "text-slate-700" : "text-slate-300"}`}>Queue is Completely Empty</h5>
                        <p className={`text-[11px] ${textMutedClass} max-w-xs mt-1`}>No operators are currently awaiting ingress approval. The ledger is clean!</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {pendingUsers.slice(0, 3).map((pu) => (
                          <div
                            key={pu.id}
                            className={`p-3 border rounded-xl flex items-center justify-between gap-3 text-xs ${isLight ? "bg-slate-50 border-slate-200/80" : "bg-slate-950/40 border-slate-900"}`}
                          >
                            <div className="min-w-0">
                              <span className={`font-semibold block truncate ${isLight ? "text-slate-800" : "text-white"}`}>{pu.name}</span>
                              <span className={`text-[10px] ${textMutedClass} block truncate`}>{pu.email}</span>
                              {pu.phone && (
                                <span className="text-[9px] text-amber-500/95 font-mono flex items-center gap-1 mt-0.5">
                                  <Phone className="w-3.5 h-3.5" />
                                  <span>{pu.phone}</span>
                                </span>
                              )}
                            </div>
                            <button
                              onClick={() => setActiveTab('users')}
                              className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-[10px] rounded-lg transition-colors cursor-pointer shrink-0"
                            >
                              Action
                            </button>
                          </div>
                        ))}
                        {pendingUsers.slice(0, 3).length < pendingUsers.length && (
                          <button
                            onClick={() => setActiveTab('users')}
                            className="w-full text-center py-2 text-[10px] font-bold text-amber-500 hover:text-amber-400 uppercase tracking-wider"
                          >
                            Show remaining {pendingUsers.length - 3} admissions
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Pending Purchase Requests Queue */}
                <div className={`border p-5 sm:p-6 rounded-2xl transition-colors ${cardClass}`}>
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h4 className="text-sm font-semibold tracking-wide flex items-center gap-2">
                        <ShoppingBag className="w-4 h-4 text-amber-500" />
                        <span>Pending Purchase Approvals Queue</span>
                      </h4>
                      <p className={`text-[10px] ${textMutedClass} mt-0.5`}>Member transaction requests waiting for board verification and capital capture</p>
                    </div>
                    {orders.filter(o => o.status === "pending").length > 0 && (
                      <span className="bg-amber-500 text-slate-950 font-extrabold text-[9px] px-2.5 py-0.5 rounded-full animate-pulse">
                        {orders.filter(o => o.status === "pending").length} requests
                      </span>
                    )}
                  </div>

                  {orders.filter(o => o.status === "pending").length === 0 ? (
                    <div className="text-center py-16 flex flex-col items-center justify-center border border-dashed rounded-xl border-slate-500/10">
                      <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-full mb-3">
                        <CheckCircle2 className="w-6 h-6 stroke-[2px]" />
                      </div>
                      <h5 className={`text-xs font-semibold ${isLight ? "text-slate-700" : "text-slate-300"}`}>All Purchases Fully Audited</h5>
                      <p className={`text-[11px] ${textMutedClass} max-w-sm mt-1 mx-auto`}>There are no pending member purchases awaiting authorization at this time.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {orders.filter(o => o.status === "pending").map((order) => (
                        <div
                          key={order.id}
                          className={`p-4 border rounded-xl flex flex-col justify-between transition-colors ${isLight ? "bg-slate-50 border-slate-200" : "bg-slate-950/60 border-slate-900"}`}
                        >
                          <div className="space-y-3">
                            <div className="flex justify-between items-start">
                              <div>
                                <span className="text-[8px] text-amber-500 font-extrabold uppercase tracking-wider bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded font-mono">
                                  Held: ${order.price.toLocaleString()}
                                </span>
                                <h4 className={`text-xs font-semibold tracking-tight mt-1.5 ${isLight ? "text-slate-800" : "text-white"}`}>{order.productTitle}</h4>
                              </div>
                            </div>

                            <div className={`p-2.5 rounded-lg border text-[10px] space-y-1 ${isLight ? "bg-white border-slate-200" : "bg-slate-900/30 border-slate-900"}`}>
                              <p className={textMutedClass}>Buyer: <strong className={isLight ? "text-slate-800" : "text-white"}>{order.buyerName}</strong></p>
                              {order.buyerCompany && (
                                <p className={textMutedClass}>Company: <strong className={isLight ? "text-slate-800" : "text-white"}>{order.buyerCompany}</strong></p>
                              )}
                              <p className={textMutedClass}>Card ending: <span className="font-mono">{order.cardNumberLast4}</span></p>
                              <p className={textMutedClass}>Submitted: {new Date(order.date).toLocaleString()}</p>
                            </div>
                          </div>

                          <div className="flex gap-2 mt-4 pt-3 border-t border-slate-500/10">
                            <button
                              onClick={() => handleRejectOrder(order.id)}
                              className="flex-1 py-1.5 border border-red-500/20 bg-red-500/5 text-red-500 hover:bg-red-500/10 font-bold text-[10px] rounded-lg transition-colors cursor-pointer text-center"
                            >
                              Decline Request
                            </button>
                            <button
                              onClick={() => handleApproveOrder(order.id)}
                              className="flex-1 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-[10px] rounded-lg transition-colors cursor-pointer text-center"
                            >
                              Approve Purchase
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === 'inventory' && (
              <motion.div
                key="inventory-tab"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-6 sm:space-y-8"
              >
                {/* Financial Metrics Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className={`border p-5 rounded-2xl relative overflow-hidden flex items-center gap-4 transition-colors ${cardClass}`}>
                    <div className="p-3 bg-amber-500/10 text-amber-500 rounded-xl">
                      <DollarSign className="w-6 h-6" />
                    </div>
                    <div>
                      <p className={`text-[10px] ${textMutedClass} font-bold uppercase tracking-wider`}>Total Capture Revenue</p>
                      <h3 className={`text-2xl font-bold font-mono mt-1 ${isLight ? "text-slate-900" : "text-white"}`}>${totalRevenue.toLocaleString()}</h3>
                    </div>
                    <div className="absolute top-0 right-0 p-3 text-slate-500/5 font-bold text-5xl font-mono pointer-events-none select-none">$</div>
                  </div>

                  <div className={`border p-5 rounded-2xl relative overflow-hidden flex items-center gap-4 transition-colors ${cardClass}`}>
                    <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl">
                      <ShoppingBag className="w-6 h-6" />
                    </div>
                    <div>
                      <p className={`text-[10px] ${textMutedClass} font-bold uppercase tracking-wider`}>Executed Contracts</p>
                      <h3 className={`text-2xl font-bold font-mono mt-1 ${isLight ? "text-slate-900" : "text-white"}`}>{totalOrdersCount}</h3>
                    </div>
                    <div className="absolute top-0 right-0 p-3 text-slate-500/5 font-bold text-5xl font-mono pointer-events-none select-none">#</div>
                  </div>

                  <div className={`border p-5 rounded-2xl relative overflow-hidden flex items-center gap-4 transition-colors ${cardClass}`}>
                    <div className="p-3 bg-blue-500/10 text-blue-500 rounded-xl">
                      <Package className="w-6 h-6" />
                    </div>
                    <div>
                      <p className={`text-[10px] ${textMutedClass} font-bold uppercase tracking-wider`}>Active Inventory Solutions</p>
                      <h3 className={`text-2xl font-bold font-mono mt-1 ${isLight ? "text-slate-900" : "text-white"}`}>{activeProducts}</h3>
                    </div>
                    <div className="absolute top-0 right-0 p-3 text-slate-500/5 font-bold text-5xl font-mono pointer-events-none select-none">P</div>
                  </div>

                  <div className={`border p-5 rounded-2xl relative overflow-hidden flex items-center gap-4 transition-colors ${cardClass}`}>
                    <div className="p-3 bg-red-500/10 text-red-500 rounded-xl">
                      <AlertCircle className="w-6 h-6" />
                    </div>
                    <div>
                      <p className={`text-[10px] ${textMutedClass} font-bold uppercase tracking-wider`}>Stock Shortage Items</p>
                      <h3 className={`text-2xl font-bold font-mono mt-1 ${outOfStockItems > 0 ? "text-red-500 font-extrabold" : (isLight ? "text-slate-900" : "text-white")}`}>{outOfStockItems}</h3>
                    </div>
                    <div className="absolute top-0 right-0 p-3 text-slate-500/5 font-bold text-5xl font-mono pointer-events-none select-none">!</div>
                  </div>
                </div>

                {/* Analytical Insights Panels */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Category Performance Custom Bar Graph */}
                  <div className={`lg:col-span-7 border p-5 sm:p-6 rounded-2xl transition-colors ${cardClass}`}>
                    <div className="flex justify-between items-center mb-6">
                      <div>
                        <h3 className="text-sm font-semibold tracking-wide">Category Performance</h3>
                        <p className={`text-[10px] ${textMutedClass} mt-0.5`}>Direct capital capture by high-end solution vertical</p>
                      </div>
                      <TrendingUp className="w-4 h-4 text-amber-500" />
                    </div>

                    <div className="space-y-4">
                      {categorySales.map((cat, idx) => {
                        const percentage = (cat.value / maxVal) * 100;
                        return (
                          <div key={idx} className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span className={`${isLight ? "text-slate-700" : "text-slate-300"} truncate max-w-[180px] sm:max-w-[240px]`}>{cat.name}</span>
                              <div className="font-mono text-right shrink-0">
                                <span className={`text-[10px] ${textMutedClass} mr-2`}>({cat.count} order{cat.count !== 1 ? 's' : ''})</span>
                                <span className={`font-semibold ${isLight ? "text-slate-900" : "text-slate-100"}`}>${cat.value.toLocaleString()}</span>
                              </div>
                            </div>
                            <div className={`h-2 w-full rounded-full overflow-hidden border ${isLight ? "bg-slate-100 border-slate-200" : "bg-slate-950 border-slate-900"}`}>
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${percentage}%` }}
                                transition={{ duration: 0.8, delay: idx * 0.1, ease: "easeOut" }}
                                className="h-full bg-gradient-to-r from-amber-500 to-amber-600 rounded-full"
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Secure Transaction Log */}
                  <div className={`lg:col-span-5 border p-5 sm:p-6 rounded-2xl flex flex-col h-full transition-colors ${cardClass}`}>
                    <div className="mb-4">
                      <h3 className="text-sm font-semibold tracking-wide">Secure Transaction Log</h3>
                      <p className={`text-[10px] ${textMutedClass} mt-0.5`}>Real-time ledger entries from audited payment gateway</p>
                    </div>

                    <div className="flex-1 overflow-y-auto max-h-[220px] space-y-3 pr-1">
                      {orders.length === 0 ? (
                        <div className={`h-full flex items-center justify-center ${textMutedClass} text-xs py-8 font-mono`}>
                          No transactions captured.
                        </div>
                      ) : (
                        [...orders].reverse().map((order, idx) => (
                          <div key={idx} className={`flex justify-between items-center p-3 border rounded-xl transition-colors ${isLight ? "bg-slate-50 border-slate-200/60" : "bg-slate-950/60 border-slate-800/40"}`}>
                            <div className="min-w-0 mr-3">
                              <p className={`text-xs font-semibold truncate max-w-[160px] sm:max-w-[220px] ${isLight ? "text-slate-800" : "text-white"}`}>{order.productTitle}</p>
                              <p className={`text-[9px] ${textMutedClass} mt-1 truncate`}>Buyer: {order.buyerCompany || order.buyerName}</p>
                            </div>
                            <div className="text-right shrink-0 flex items-center gap-2">
                              <div>
                                <p className="text-xs font-bold font-mono text-amber-500">${order.price.toLocaleString()}</p>
                                {order.status === "pending" && (
                                  <span className="text-[7px] text-amber-400 font-extrabold uppercase bg-amber-400/15 border border-amber-400/25 px-1 rounded block mt-0.5 font-mono text-center">Pending</span>
                                )}
                                {order.status === "rejected" && (
                                  <span className="text-[7px] text-red-400 font-extrabold uppercase bg-red-400/15 border border-red-400/25 px-1 rounded block mt-0.5 font-mono text-center">Declined</span>
                                )}
                                {order.status === "succeeded" && (
                                  <span className="text-[7px] text-emerald-400 font-extrabold uppercase bg-emerald-400/15 border border-emerald-400/25 px-1 rounded block mt-0.5 font-mono text-center font-semibold">Approved</span>
                                )}
                                <p className={`text-[8px] ${textMutedClass} mt-1`}>{new Date(order.date).toLocaleDateString()}</p>
                              </div>
                              <button
                                onClick={() => setSelectedOrderForInvoice(order)}
                                className={`p-1.5 rounded transition-all cursor-pointer ${isLight ? "bg-white hover:bg-slate-100 border border-slate-200 text-slate-600" : "bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400"}`}
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* Inventory Manager Panel */}
                <div className={`border rounded-2xl p-4 sm:p-6 transition-colors ${cardClass}`}>
                  <div className="flex flex-col xl:flex-row xl:justify-between xl:items-center gap-4 mb-6">
                    <div>
                      <h2 className={`text-md font-semibold tracking-wide ${isLight ? "text-slate-800" : "text-white"}`}>Active Product Catalogue</h2>
                      <p className={`text-xs ${textMutedClass} mt-0.5`}>Manage live stock, prices, categories and copywriting</p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
                      {/* Premium Search Bar */}
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                        <input
                          type="text"
                          placeholder="Search admin offerings..."
                          value={productSearchQuery}
                          onChange={(e) => setProductSearchQuery(e.target.value)}
                          className={`pl-9 pr-8 py-2 w-full sm:w-56 text-xs rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500/25 ${inputClass}`}
                        />
                        {productSearchQuery && (
                          <button
                            type="button"
                            onClick={() => setProductSearchQuery("")}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-amber-500 transition-colors"
                            title="Clear search"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      <button
                        onClick={() => handleOpenProductModal()}
                        className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-amber-500/10 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.98] shrink-0"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Establish Solution Offering</span>
                      </button>
                    </div>
                  </div>

                  <div className={`overflow-x-auto border rounded-xl ${isLight ? "border-slate-200" : "border-slate-900"}`}>
                    <table className="w-full text-left text-xs border-collapse min-w-[700px]">
                      <thead>
                        <tr className={`${tableHeaderClass} uppercase tracking-wider text-[10px] font-bold`}>
                          <th className="p-4">Solution Title & Category</th>
                          <th className="p-4">Corporate Value</th>
                          <th className="p-4">Available Slots</th>
                          <th className="p-4">Marketing Scope</th>
                          <th className="p-4 text-right">System Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-500/10 font-medium">
                        {(() => {
                          const filtered = products.filter(p => {
                            const q = productSearchQuery.trim().toLowerCase();
                            if (!q) return true;
                            return (
                              p.title.toLowerCase().includes(q) ||
                              p.description.toLowerCase().includes(q) ||
                              p.category?.toLowerCase().includes(q) ||
                              p.tags.some(tag => tag.toLowerCase().includes(q))
                            );
                          });

                          if (filtered.length === 0) {
                            return (
                              <tr>
                                <td colSpan={5} className={`p-8 text-center font-mono ${textMutedClass}`}>
                                  {products.length === 0 ? "No active solutions catalogued." : "No matching solutions found."}
                                </td>
                              </tr>
                            );
                          }

                          return filtered.map((prod) => (
                            <tr key={prod.id} className={`${isLight ? "hover:bg-slate-50/55" : "hover:bg-slate-900/20"} transition-colors`}>
                              <td className="p-4">
                                <div className="flex items-center gap-3">
                                  {prod.imageUrl ? (
                                    <img 
                                      src={prod.imageUrl} 
                                      alt={prod.title} 
                                      className="w-10 h-10 object-cover rounded-lg border border-slate-500/10 shadow-sm shrink-0" 
                                      referrerPolicy="no-referrer"
                                      onError={(e) => { e.currentTarget.src = FALLBACK_PRODUCT_IMAGE; }}
                                    />
                                  ) : (
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border ${isLight ? "bg-slate-100 border-slate-200 text-slate-400" : "bg-slate-950 border-slate-900 text-slate-500"}`}>
                                      <ImageIcon className="w-4 h-4" />
                                    </div>
                                  )}
                                  <div>
                                    <span className={`font-semibold block ${isLight ? "text-slate-800" : "text-white"}`}>{prod.title}</span>
                                    <span className={`text-[10px] font-mono tracking-wider block mt-0.5 uppercase ${textMutedClass}`}>{prod.category}</span>
                                  </div>
                                </div>
                              </td>
                              <td className="p-4 font-mono font-bold text-amber-500">
                                ${prod.price.toLocaleString()}
                              </td>
                              <td className="p-4">
                                <span className={`px-2.5 py-1 rounded font-mono text-[10px] ${
                                  prod.stock === 0 
                                    ? "bg-red-500/10 text-red-500 border border-red-500/20 font-bold" 
                                    : prod.stock <= 3 
                                      ? "bg-rose-500/10 text-rose-500 border border-rose-500/20 font-bold animate-pulse" 
                                      : `${isLight ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600" : "bg-emerald-950/20 border-emerald-850 text-emerald-500"} font-semibold border`
                                }`}>
                                  {prod.stock === 0 ? "Out of Stock" : `${prod.stock} left`}
                                </span>
                              </td>
                              <td className="p-4">
                                <div className="flex flex-wrap gap-1 max-w-[280px]">
                                  {prod.tags.map((tag, i) => (
                                    <span key={i} className={`text-[9px] px-2 py-0.5 rounded font-mono ${isLight ? "bg-slate-100 border-slate-200 text-slate-600" : "bg-slate-900 border-slate-800 text-slate-400"} border`}>
                                      #{tag}
                                    </span>
                                  ))}
                                </div>
                              </td>
                              <td className="p-4 text-right">
                                <div className="inline-flex items-center gap-1.5">
                                  <button
                                    onClick={() => handleOpenProductModal(prod)}
                                    className={`p-2 rounded-lg border transition-colors cursor-pointer ${isLight ? "bg-white hover:bg-slate-100 border-slate-200 text-slate-600" : "bg-slate-950 hover:bg-slate-900 border-slate-800 text-slate-400 hover:text-white"}`}
                                    title="Edit product"
                                  >
                                    <Edit className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteProduct(prod.id)}
                                    className={`p-2 rounded-lg border transition-colors cursor-pointer ${isLight ? "bg-white hover:bg-red-50 border-slate-200 hover:border-red-200 text-slate-400 hover:text-red-500" : "bg-slate-950 hover:bg-red-500/10 border-slate-800 hover:border-red-500/20 text-slate-400 hover:text-red-400"}`}
                                    title="Delete product"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ));
                        })()}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'users' && (
              <motion.div
                key="users-tab"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-6 sm:space-y-8"
              >
                {/* Users Metric Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className={`border p-5 rounded-2xl relative overflow-hidden flex items-center gap-4 transition-colors ${cardClass}`}>
                    <div className="p-3 bg-blue-500/10 text-blue-500 rounded-xl">
                      <Users className="w-6 h-6" />
                    </div>
                    <div>
                      <p className={`text-[10px] ${textMutedClass} font-bold uppercase tracking-wider`}>Active Directory Accounts</p>
                      <h3 className={`text-2xl font-bold font-mono mt-1 ${isLight ? "text-slate-900" : "text-white"}`}>{totalUsers}</h3>
                    </div>
                  </div>

                  <div className={`border p-5 rounded-2xl relative overflow-hidden flex items-center gap-4 transition-colors ${cardClass}`}>
                    <div className="p-3 bg-red-500/10 text-red-500 rounded-xl">
                      <ShieldAlert className="w-6 h-6" />
                    </div>
                    <div>
                      <p className={`text-[10px] ${textMutedClass} font-bold uppercase tracking-wider`}>Pending Board Verification</p>
                      <h3 className={`text-2xl font-bold font-mono mt-1 ${pendingUsers.length > 0 ? "text-red-500 font-extrabold" : (isLight ? "text-slate-900" : "text-white")}`}>{pendingUsers.length}</h3>
                    </div>
                    {pendingUsers.length > 0 && (
                      <span className="absolute top-2 right-2 flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                      </span>
                    )}
                  </div>

                  <div className={`border p-5 rounded-2xl relative overflow-hidden flex items-center gap-4 transition-colors ${cardClass}`}>
                    <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl">
                      <UserCheck className="w-6 h-6" />
                    </div>
                    <div>
                      <p className={`text-[10px] ${textMutedClass} font-bold uppercase tracking-wider`}>Authorized Buyer Entities</p>
                      <h3 className={`text-2xl font-bold font-mono mt-1 ${isLight ? "text-slate-900" : "text-white"}`}>{approvedBuyersCount}</h3>
                    </div>
                  </div>
                </div>

                {/* User Verification Action Center */}
                <div className={`border rounded-2xl p-4 sm:p-6 transition-colors ${cardClass}`}>
                  <div className="mb-6">
                    <h2 className={`text-md font-semibold tracking-wide ${isLight ? "text-slate-800" : "text-white"}`}>Pending Board Registrations</h2>
                    <p className={`text-xs ${textMutedClass} mt-0.5`}>Review, authorize, or purge registered corporate buyers requesting platform ingress</p>
                  </div>

                  {pendingUsers.length === 0 ? (
                    <div className={`text-center py-10 border border-dashed rounded-xl ${isLight ? "bg-slate-50 border-slate-200" : "bg-slate-950/20 border-slate-900"} p-8`}>
                      <div className="inline-flex items-center justify-center bg-emerald-500/10 text-emerald-500 p-3 rounded-full mb-3">
                        <CheckCircle2 className="w-6 h-6" />
                      </div>
                      <h3 className={`text-sm font-semibold ${isLight ? "text-slate-800" : "text-white"}`}>Board Queue Entirely Empty</h3>
                      <p className={`text-xs ${textMutedClass} mt-1 max-w-sm mx-auto`}>All registered buyer representatives have been fully verified and audited according to platform protocols.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {pendingUsers.map((pendingUser) => (
                        <div 
                          key={pendingUser.id} 
                          className={`flex flex-col md:flex-row md:items-center justify-between p-4 sm:p-5 border rounded-xl gap-4 transition-colors ${isLight ? "bg-slate-50 border-slate-200/80 hover:bg-slate-100/40" : "bg-slate-950/60 border-slate-900/80 hover:bg-slate-900/30"}`}
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`font-semibold text-sm ${isLight ? "text-slate-800" : "text-white"}`}>{pendingUser.name}</span>
                              <span className="text-[9px] uppercase font-mono tracking-wider px-2 py-0.5 rounded bg-red-500/15 text-red-500 font-bold border border-red-500/10">PENDING BOARD TRUST</span>
                            </div>
                            <p className={`text-xs ${textMutedClass}`}>Representative of <strong className={isLight ? "text-slate-700" : "text-slate-300"}>{pendingUser.companyName || "Independent Operator"}</strong></p>
                            <p className={`text-[11px] font-mono ${textMutedClass}`}>{pendingUser.email}</p>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              {pendingUser.age && (
                                <span className={`text-[10px] px-2 py-0.5 rounded font-mono ${isLight ? "bg-slate-100 text-slate-600" : "bg-slate-900 text-slate-400"}`}>
                                  Age: {pendingUser.age}
                                </span>
                              )}
                              {pendingUser.gender && (
                                <span className={`text-[10px] px-2 py-0.5 rounded font-mono ${isLight ? "bg-slate-100 text-slate-600" : "bg-slate-900 text-slate-400"}`}>
                                  Gender: {pendingUser.gender}
                                </span>
                              )}
                              {pendingUser.phone && (
                                <span className="text-[10px] text-amber-500 font-mono flex items-center gap-1">
                                  <Phone className="w-3.5 h-3.5" />
                                  <span>{pendingUser.phone}</span>
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 justify-end shrink-0 pt-2 md:pt-0">
                            <button
                              onClick={() => handleRejectUser(pendingUser.id)}
                              className={`px-3 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer flex items-center gap-1.5 transition-colors ${
                                isLight 
                                  ? "bg-white hover:bg-red-50 border-slate-200 text-slate-500 hover:text-red-500" 
                                  : "bg-slate-900 hover:bg-red-500/10 border-slate-800 hover:border-red-500/20 text-slate-400 hover:text-red-400"
                              }`}
                            >
                              <Ban className="w-3.5 h-3.5" />
                              <span>Decline Ingress</span>
                            </button>
                            <button
                              onClick={() => handleApproveUser(pendingUser.id)}
                              className="px-4 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs rounded-lg shadow-md shadow-amber-500/10 flex items-center gap-1.5 cursor-pointer transition-all active:scale-[0.98]"
                            >
                              <Check className="w-3.5 h-3.5 stroke-[3px]" />
                              <span>Verify & Authorize</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Active Directory Registry */}
                <div className={`border rounded-2xl p-4 sm:p-6 transition-colors ${cardClass}`}>
                  <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h2 className={`text-md font-semibold tracking-wide ${isLight ? "text-slate-800" : "text-white"}`}>Active Directory Registry</h2>
                      <p className={`text-xs ${textMutedClass} mt-0.5`}>Consolidated board record of verified administrators and authorized corporate entities</p>
                    </div>
                    <button
                      onClick={() => {
                        setUserFormName("");
                        setUserFormEmail("");
                        setUserFormPassword("");
                        setUserFormRole("buyer");
                        setUserFormCompanyName("");
                        setUserFormAge("");
                        setUserFormGender("");
                        setUserFormPhone("");
                        setUserFormBalance("100000");
                        setShowUserModal(true);
                      }}
                      className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-amber-500/10 flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-[0.98] self-start sm:self-auto"
                    >
                      <Plus className="w-3.5 h-3.5 stroke-[3px]" />
                      <span>Add Member</span>
                    </button>
                  </div>

                  <div className={`overflow-x-auto border rounded-xl ${isLight ? "border-slate-200" : "border-slate-900"}`}>
                    <table className="w-full text-left text-xs border-collapse min-w-[600px]">
                      <thead>
                        <tr className={`${tableHeaderClass} uppercase tracking-wider text-[10px] font-bold`}>
                          <th className="p-4">Identified Executive</th>
                          <th className="p-4">Corporate Association</th>
                          <th className="p-4">System Node Authority</th>
                          <th className="p-4">Capital Reserves</th>
                          <th className="p-4 text-right">Status / Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-500/10 font-medium">
                        {users.filter(u => u.approved !== false).map((activeUser) => (
                          <tr key={activeUser.id} className={`${isLight ? "hover:bg-slate-50/55" : "hover:bg-slate-900/20"} transition-colors`}>
                            <td className="p-4">
                              <span className={`font-semibold block ${isLight ? "text-slate-800" : "text-white"}`}>{activeUser.name}</span>
                              <span className={`text-[10px] font-mono tracking-wider block mt-1 ${textMutedClass}`}>{activeUser.email}</span>
                              <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                                {activeUser.age && (
                                  <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono ${isLight ? "bg-slate-100 text-slate-500" : "bg-slate-900/60 text-slate-400"}`}>
                                    {activeUser.age} yrs
                                  </span>
                                )}
                                {activeUser.gender && (
                                  <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono ${isLight ? "bg-slate-100 text-slate-500" : "bg-slate-900/60 text-slate-400"}`}>
                                    {activeUser.gender}
                                  </span>
                                )}
                                {activeUser.phone && (
                                  <span className="text-[9px] text-amber-500 font-mono flex items-center gap-0.5">
                                    <Phone className="w-3 h-3" />
                                    <span>{activeUser.phone}</span>
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="p-4">
                              <span className={isLight ? "text-slate-700" : "text-slate-200"}>{activeUser.companyName || "Merkato Board Admin"}</span>
                            </td>
                            <td className="p-4">
                              <span className={`px-2 py-0.5 rounded font-mono text-[9px] font-bold tracking-wide uppercase ${
                                activeUser.role === "admin" 
                                  ? "bg-amber-500/10 text-amber-500 border border-amber-500/20" 
                                  : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                              }`}>
                                {activeUser.role} node
                              </span>
                            </td>
                            <td className="p-4 font-mono font-bold">
                              {activeUser.balance !== undefined ? (
                                <span className="text-emerald-500">${activeUser.balance.toLocaleString()}</span>
                              ) : (
                                <span className={textMutedClass}>N/A (ADMIN)</span>
                              )}
                            </td>
                            <td className="p-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <span className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded text-[10px] font-bold border border-emerald-500/10 uppercase tracking-wide">
                                  <CheckCircle2 className="w-3 h-3 stroke-[3px]" />
                                  <span>Verified</span>
                                </span>
                                {activeUser.id !== user.id && (
                                  <button
                                    onClick={() => handleKickUser(activeUser.id)}
                                    className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                                      isLight 
                                        ? "bg-white hover:bg-red-55 border-slate-200 hover:border-red-200 text-slate-400 hover:text-red-500" 
                                        : "bg-slate-950 hover:bg-red-500/10 border-slate-800 hover:border-red-500/20 text-slate-400 hover:text-red-400"
                                    }`}
                                    title="Kick Member from Directory"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'categories' && (
              <motion.div
                key="categories-tab"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-6 sm:space-y-8"
              >
                {/* Header overview card */}
                <div className={`border p-6 rounded-2xl relative overflow-hidden transition-colors ${cardClass}`}>
                  <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
                  <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-1.5">
                      <h2 className={`text-lg font-bold tracking-tight ${isLight ? "text-slate-900" : "text-white"}`}>
                        Dynamic Category Architecture
                      </h2>
                      <p className={`text-xs ${textMutedClass}`}>
                        Configure high-ticket product verticals. Categories defined here will immediately populate member catalog navigation menus and product creation guidelines.
                      </p>
                    </div>
                    <div className={`p-4 border rounded-xl shrink-0 font-mono text-center min-w-[150px] ${isLight ? "bg-slate-50 border-slate-200" : "bg-slate-950/40 border-slate-800"}`}>
                      <span className={`${textMutedClass} text-[10px] uppercase font-bold tracking-wider block`}>Active Verticals</span>
                      <span className="font-bold text-2xl text-amber-500 mt-1 block">{categories.length}</span>
                    </div>
                  </div>
                </div>

                {/* Main Management Workspace */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
                  {/* Left Column: Create Category Card */}
                  <div className={`border rounded-2xl p-5 sm:p-6 transition-colors ${cardClass} h-fit`}>
                    <h3 className={`text-sm font-bold uppercase tracking-wider mb-4 ${isLight ? "text-slate-800" : "text-amber-500"}`}>
                      Establish New Vertical
                    </h3>
                    <form onSubmit={handleSaveCategory} className="space-y-4">
                      <div>
                        <label className={`block text-[10px] font-bold ${isLight ? "text-slate-600" : "text-slate-400"} uppercase tracking-wider mb-2`}>
                          Category / Vertical Name
                        </label>
                        <input
                          type="text"
                          required
                          value={newCategoryName}
                          onChange={(e) => setNewCategoryName(e.target.value)}
                          placeholder="e.g. Account-Based Marketing"
                          className={`w-full focus:ring-1 focus:ring-amber-500/20 focus:outline-none rounded-lg py-2 px-3 text-sm ${inputClass}`}
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={categoryLoading}
                        className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-amber-500/15 flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-[0.98]"
                      >
                        {categoryLoading ? (
                          <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></span>
                        ) : (
                          <>
                            <Plus className="w-4 h-4 stroke-[3.5px]" />
                            <span>Create Corporate Vertical</span>
                          </>
                        )}
                      </button>
                    </form>
                  </div>

                  {/* Right Column: Registered Category List (span 2) */}
                  <div className={`border rounded-2xl p-5 sm:p-6 transition-colors ${cardClass} lg:col-span-2`}>
                    <h3 className={`text-sm font-bold uppercase tracking-wider mb-4 ${isLight ? "text-slate-800" : "text-white"}`}>
                      Active Platform Verticals
                    </h3>
                    
                    {categories.length === 0 ? (
                      <div className={`text-center py-12 border border-dashed rounded-xl ${isLight ? "bg-slate-50 border-slate-200" : "bg-slate-950/20 border-slate-900"} p-8`}>
                        <div className="inline-flex items-center justify-center bg-amber-500/10 text-amber-500 p-3 rounded-full mb-3">
                          <Tag className="w-6 h-6" />
                        </div>
                        <h4 className={`text-sm font-semibold ${isLight ? "text-slate-800" : "text-white"}`}>No Categories Defined</h4>
                        <p className={`text-xs ${textMutedClass} mt-1 max-w-sm mx-auto`}>Create custom corporate solution categories in the workspace panel to configure your catalog.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {categories.map((cat, i) => {
                          // Calculate number of products in this category
                          const productCount = products.filter(p => p.category?.toLowerCase() === cat.toLowerCase()).length;
                          
                          return (
                            <div 
                              key={i}
                              className={`flex items-center justify-between p-4 border rounded-xl transition-all ${
                                isLight 
                                  ? "bg-slate-50 hover:bg-slate-100/50 border-slate-200/80" 
                                  : "bg-slate-950/40 hover:bg-slate-900/30 border-slate-900/80"
                              }`}
                            >
                              <div className="space-y-1 truncate pr-2">
                                <span className={`font-semibold text-sm block truncate ${isLight ? "text-slate-800" : "text-white"}`}>
                                  {cat}
                                </span>
                                <span className="font-mono text-[9px] uppercase tracking-wider text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/10 font-bold">
                                  {productCount} {productCount === 1 ? 'solution' : 'solutions'} active
                                </span>
                              </div>

                              <button
                                onClick={() => handleDeleteCategory(cat)}
                                disabled={categoryLoading}
                                className={`p-2 rounded-lg border transition-colors cursor-pointer shrink-0 ${
                                  isLight 
                                    ? "bg-white hover:bg-red-55 border-slate-200 text-slate-400 hover:text-red-500 hover:border-red-200" 
                                    : "bg-slate-900 hover:bg-red-500/10 border-slate-800 text-slate-400 hover:text-red-400 hover:border-red-500/25"
                                }`}
                                title="Delete Platform Vertical"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </main>
      )}

      {/* Edit/Create Product Offer Modal */}
      <AnimatePresence>
        {showProductModal && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`w-full max-w-xl border rounded-2xl shadow-2xl overflow-hidden ${isLight ? "bg-white border-slate-200" : "bg-slate-900 border-slate-800"}`}
            >
              <div className="h-1 bg-gradient-to-r from-amber-500 to-amber-600" />
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className={`text-md font-semibold ${isLight ? "text-slate-900" : "text-white"}`}>
                    {editProductId ? "Refine Solution Offering" : "Establish Solution Offering"}
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowProductModal(false)}
                    className={`p-1.5 rounded-lg cursor-pointer ${isLight ? "bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-500 hover:text-slate-700" : "bg-slate-950/50 hover:bg-slate-950/80 text-slate-400 hover:text-white border border-slate-800/40"}`}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {!editProductId && (
                  <div className="flex border-b border-slate-500/10 mb-5">
                    <button
                      type="button"
                      onClick={() => setIsBatchMode(false)}
                      className={`flex-1 pb-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                        !isBatchMode ? "text-amber-500 border-amber-500" : `${textMutedClass} border-transparent hover:text-amber-500`
                      }`}
                    >
                      Single Offering
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsBatchMode(true)}
                      className={`flex-1 pb-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                        isBatchMode ? "text-amber-500 border-amber-500" : `${textMutedClass} border-transparent hover:text-amber-500`
                      }`}
                    >
                      Batch Mode (Add Multiple)
                    </button>
                  </div>
                )}

                <form onSubmit={handleSaveProduct} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Category Selector is always at the top */}
                    <div className="md:col-span-2">
                      <label className={`block text-xs font-semibold ${isLight ? "text-slate-600" : "text-slate-400"} uppercase tracking-wider mb-1.5`}>Category Vertical</label>
                      <select
                        value={formCategory}
                        onChange={(e) => setFormCategory(e.target.value)}
                        className={`w-full focus:ring-1 focus:ring-amber-500/20 focus:outline-none rounded-lg py-2 px-3 text-sm ${inputClass}`}
                      >
                        {categories.map((cat, i) => (
                          <option key={i} value={cat} className={selectOptionClass}>{cat}</option>
                        ))}
                      </select>
                    </div>

                    {isBatchMode && !editProductId ? (
                      /* ==========================================
                         BATCH INGRESS MODE
                         ========================================== */
                      <div className="space-y-4 md:col-span-2">
                        <div className={`p-4 rounded-xl border flex flex-col gap-1 ${isLight ? "bg-slate-50 border-slate-200" : "bg-slate-950/40 border-slate-850"}`}>
                          <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest font-mono">Batch Ingress Active</span>
                          <p className={`text-[11px] ${textMutedClass}`}>
                            Add multiple marketing products in a single operation under the <strong>{formCategory}</strong> vertical.
                          </p>
                        </div>

                        <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1">
                          {batchRows.map((row, index) => (
                            <div key={index} className={`p-4 border rounded-xl space-y-3 relative ${isLight ? "bg-white border-slate-200" : "bg-slate-900/60 border-slate-800"}`}>
                              <div className="flex justify-between items-center">
                                <span className="text-[10px] font-mono uppercase tracking-wider text-amber-500 font-bold">Product #{index + 1}</span>
                                {batchRows.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setBatchRows(batchRows.filter((_, idx) => idx !== index));
                                    }}
                                    className="text-[10px] text-red-500 hover:text-red-400 font-bold cursor-pointer transition-colors"
                                  >
                                    Remove Row
                                  </button>
                                )}
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div className="sm:col-span-2">
                                  <label className={`block text-[10px] font-bold ${textMutedClass} uppercase tracking-wider mb-1`}>Solution Title</label>
                                  <input
                                    type="text"
                                    required
                                    value={row.title}
                                    onChange={(e) => {
                                      const updated = [...batchRows];
                                      updated[index].title = e.target.value;
                                      setBatchRows(updated);
                                    }}
                                    placeholder="e.g. PR Blast Package"
                                    className={`w-full focus:ring-1 focus:ring-amber-500/20 focus:outline-none rounded-lg py-1.5 px-2.5 text-xs ${inputClass}`}
                                  />
                                </div>

                                <div>
                                  <label className={`block text-[10px] font-bold ${textMutedClass} uppercase tracking-wider mb-1`}>Price (USD)</label>
                                  <input
                                    type="number"
                                    required
                                    value={row.price}
                                    onChange={(e) => {
                                      const updated = [...batchRows];
                                      updated[index].price = e.target.value;
                                      setBatchRows(updated);
                                    }}
                                    placeholder="12000"
                                    className={`w-full focus:ring-1 focus:ring-amber-500/20 focus:outline-none rounded-lg py-1.5 px-2.5 text-xs font-mono ${inputClass}`}
                                  />
                                </div>

                                <div>
                                  <label className={`block text-[10px] font-bold ${textMutedClass} uppercase tracking-wider mb-1`}>Stock (Slots)</label>
                                  <input
                                    type="number"
                                    required
                                    value={row.stock}
                                    onChange={(e) => {
                                      const updated = [...batchRows];
                                      updated[index].stock = e.target.value;
                                      setBatchRows(updated);
                                    }}
                                    placeholder="5"
                                    className={`w-full focus:ring-1 focus:ring-amber-500/20 focus:outline-none rounded-lg py-1.5 px-2.5 text-xs font-mono ${inputClass}`}
                                  />
                                </div>

                                <div className="sm:col-span-2">
                                  <label className={`block text-[10px] font-bold ${textMutedClass} uppercase tracking-wider mb-1`}>Tags (comma-separated)</label>
                                  <input
                                    type="text"
                                    value={row.tags}
                                    onChange={(e) => {
                                      const updated = [...batchRows];
                                      updated[index].tags = e.target.value;
                                      setBatchRows(updated);
                                    }}
                                    placeholder="PR, Blitz, Media"
                                    className={`w-full focus:ring-1 focus:ring-amber-500/20 focus:outline-none rounded-lg py-1.5 px-2.5 text-xs ${inputClass}`}
                                  />
                                </div>

                                <div className="sm:col-span-3">
                                  <label className={`block text-[10px] font-bold ${textMutedClass} uppercase tracking-wider mb-1`}>Solution Copy / Description</label>
                                  <textarea
                                    required
                                    rows={2}
                                    value={row.description}
                                    onChange={(e) => {
                                      const updated = [...batchRows];
                                      updated[index].description = e.target.value;
                                      setBatchRows(updated);
                                    }}
                                    placeholder="Brief tactical description of parameters..."
                                    className={`w-full focus:ring-1 focus:ring-amber-500/20 focus:outline-none rounded-lg py-1.5 px-2.5 text-xs leading-relaxed resize-none ${inputClass}`}
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setBatchRows([...batchRows, { title: "", price: "", stock: "5", description: "", tags: "" }]);
                          }}
                          className={`w-full py-2 border border-dashed rounded-xl text-xs font-bold tracking-wide uppercase transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                            isLight 
                              ? "bg-slate-50 border-slate-300 hover:bg-slate-100 text-slate-600 hover:text-slate-800" 
                              : "bg-slate-950/45 border-slate-800 hover:bg-slate-950/80 text-slate-400 hover:text-white"
                          }`}
                        >
                          <Plus className="w-3.5 h-3.5" /> Add Another Product Row
                        </button>
                      </div>
                    ) : (
                      /* ==========================================
                         SINGLE SOLUTION MODE
                         ========================================== */
                      <>
                        <div className="md:col-span-2">
                          <label className={`block text-xs font-semibold ${isLight ? "text-slate-600" : "text-slate-400"} uppercase tracking-wider mb-1.5`}>Solution Title</label>
                          <input
                            type="text"
                            required
                            value={formTitle}
                            onChange={(e) => setFormTitle(e.target.value)}
                            placeholder="e.g. Forbes PR & Media Launch"
                            className={`w-full focus:ring-1 focus:ring-amber-500/20 focus:outline-none rounded-lg py-2 px-3 text-sm ${inputClass}`}
                          />
                        </div>

                        <div>
                          <label className={`block text-xs font-semibold ${isLight ? "text-slate-600" : "text-slate-400"} uppercase tracking-wider mb-1.5`}>Price (USD)</label>
                          <input
                            type="number"
                            required
                            value={formPrice}
                            onChange={(e) => setFormPrice(e.target.value)}
                            placeholder="e.g. 15000"
                            className={`w-full focus:ring-1 focus:ring-amber-500/20 focus:outline-none rounded-lg py-2 px-3 text-sm font-mono ${inputClass}`}
                          />
                        </div>

                        <div>
                          <label className={`block text-xs font-semibold ${isLight ? "text-slate-600" : "text-slate-400"} uppercase tracking-wider mb-1.5`}>Stock Capacity</label>
                          <input
                            type="number"
                            required
                            value={formStock}
                            onChange={(e) => setFormStock(e.target.value)}
                            placeholder="e.g. 5"
                            className={`w-full focus:ring-1 focus:ring-amber-500/20 focus:outline-none rounded-lg py-2 px-3 text-sm font-mono ${inputClass}`}
                          />
                        </div>

                        <div className="md:col-span-2">
                          <label className={`block text-xs font-semibold ${isLight ? "text-slate-600" : "text-slate-400"} uppercase tracking-wider mb-1.5`}>Marketing Tags (comma-separated)</label>
                          <input
                            type="text"
                            value={formTags}
                            onChange={(e) => setFormTags(e.target.value)}
                            placeholder="e.g. Forbes, PR, Launch"
                            className={`w-full focus:ring-1 focus:ring-amber-500/20 focus:outline-none rounded-lg py-2 px-3 text-sm ${inputClass}`}
                          />
                        </div>

                        {/* Product Image Selection & Upload Area */}
                        <div className="md:col-span-2 border border-slate-500/10 rounded-xl p-4 bg-slate-500/5">
                          <label className={`block text-xs font-semibold ${isLight ? "text-slate-700" : "text-slate-300"} uppercase tracking-wider mb-2`}>Product Image & Visuals</label>
                          
                          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                            {/* Image Preview */}
                            <div className={`h-24 w-24 sm:h-28 sm:w-28 rounded-xl overflow-hidden border ${isLight ? "bg-slate-100 border-slate-200" : "bg-slate-950 border-slate-800"} flex flex-col items-center justify-center shrink-0 relative group shadow-inner`}>
                              {formImageUrl ? (
                                <>
                                  <img 
                                    src={formImageUrl} 
                                    alt="Product Preview" 
                                    className="h-full w-full object-cover" 
                                    referrerPolicy="no-referrer" 
                                    onError={(e) => { e.currentTarget.src = FALLBACK_PRODUCT_IMAGE; }}
                                  />
                                  <button
                                    type="button"
                                    onClick={() => setFormImageUrl("")}
                                    className="absolute inset-0 bg-red-600/70 text-white font-bold opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-[10px] uppercase tracking-wide rounded-xl cursor-pointer"
                                  >
                                    Remove
                                  </button>
                                </>
                              ) : (
                                <div className="flex flex-col items-center text-slate-500 text-center p-2">
                                  <ImageIcon className="w-6 h-6 mb-1 text-slate-400" />
                                  <span className="text-[9px] font-mono">No Image</span>
                                </div>
                              )}
                            </div>

                            {/* Image Inputs */}
                            <div className="flex-1 w-full space-y-3">
                              {/* File input and text input toggles */}
                              <div className="space-y-2">
                                <span className={`text-[10px] font-bold ${textMutedClass} uppercase tracking-wider block`}>Add via Web URL or Upload File</span>
                                <div className="flex gap-2">
                                  <div className="relative flex-1">
                                    <Link className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
                                    <input
                                      type="url"
                                      placeholder="Paste image web URL..."
                                      value={formImageUrl.startsWith("data:") ? "" : formImageUrl}
                                      onChange={(e) => setFormImageUrl(e.target.value)}
                                      className={`w-full focus:ring-1 focus:ring-amber-500/20 focus:outline-none rounded-lg py-1.5 pl-8 pr-3 text-xs ${inputClass}`}
                                    />
                                  </div>
                                  
                                  <label className={`px-3 py-1.5 border rounded-lg text-xs font-semibold cursor-pointer flex items-center gap-1.5 transition-colors shrink-0 ${
                                    isLight 
                                      ? "bg-white hover:bg-slate-55 border-slate-200 text-slate-700" 
                                      : "bg-slate-950 hover:bg-slate-900 border-slate-800 text-slate-300"
                                  }`}>
                                    <Upload className="w-3.5 h-3.5" />
                                    <span className="hidden sm:inline">Upload File</span>
                                    <input
                                      type="file"
                                      accept="image/*"
                                      onChange={handleFileChange}
                                      className="hidden"
                                    />
                                  </label>
                                </div>
                              </div>

                              {/* Quick Presets Gallery */}
                              <div>
                                <span className={`text-[9px] font-bold ${textMutedClass} uppercase tracking-wider block mb-1.5`}>Premium Visual Presets (Recommended)</span>
                                <div className="flex flex-wrap gap-1.5">
                                  {[
                                    { name: "PR Blitz", url: "https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=600&q=80" },
                                    { name: "Acquisition", url: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=600&q=80" },
                                    { name: "Visual Identity", url: "https://images.unsplash.com/photo-1542744094-3a31f103e35f?auto=format&fit=crop&w=600&q=80" },
                                    { name: "Influencer", url: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=600&q=80" },
                                    { name: "Growth", url: "https://images.unsplash.com/photo-1551434678-e076c223a692?auto=format&fit=crop&w=600&q=80" }
                                  ].map((preset, idx) => (
                                    <button
                                      key={idx}
                                      type="button"
                                      onClick={() => setFormImageUrl(preset.url)}
                                      className={`px-2 py-1 rounded-md border text-[9px] font-mono font-medium transition-all cursor-pointer ${
                                        formImageUrl === preset.url
                                          ? "bg-amber-500 border-amber-500 text-slate-950 font-bold font-semibold"
                                          : `${isLight ? "bg-white hover:bg-slate-50 border-slate-200 text-slate-600" : "bg-slate-950 hover:bg-slate-900 border-slate-800 text-slate-400 hover:text-white"}`
                                      }`}
                                    >
                                      {preset.name}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="md:col-span-2">
                          <div className="flex justify-between items-center mb-1.5">
                            <label className={`block text-xs font-semibold ${isLight ? "text-slate-600" : "text-slate-400"} uppercase tracking-wider`}>Solution Copy / Pitch</label>
                            <button
                              type="button"
                              onClick={handleGenerateAiCopy}
                              disabled={aiLoading}
                              className={`px-2.5 py-1 rounded-md border text-[10px] font-bold text-amber-500 hover:text-amber-400 flex items-center gap-1.5 transition-colors disabled:opacity-55 cursor-pointer ${
                                isLight 
                                  ? "bg-slate-50 hover:bg-slate-100 border-slate-200 hover:border-amber-500/30" 
                                  : "bg-slate-950 hover:bg-slate-950/80 border-slate-800 hover:border-amber-500/30"
                              }`}
                            >
                              {aiLoading ? (
                                <>
                                  <span className="w-3 h-3 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></span>
                                  <span>Writing...</span>
                                </>
                              ) : (
                                <>
                                  <Sparkles className="w-3 h-3" />
                                  <span>Draft with Gemini AI</span>
                                </>
                              )}
                            </button>
                          </div>
                          <textarea
                            required
                            value={formDescription}
                            onChange={(e) => setFormDescription(e.target.value)}
                            rows={4}
                            placeholder="Detail the complete high-end parameters of this corporate marketing campaign or product strategy..."
                            className={`w-full focus:ring-1 focus:ring-amber-500/20 focus:outline-none rounded-lg p-3 text-xs leading-relaxed resize-none ${inputClass}`}
                          />
                        </div>

                        {!editProductId && (
                          <div className="md:col-span-2 flex items-center gap-2 pt-2 border-t border-slate-500/10">
                            <input
                              type="checkbox"
                              id="keepModalOpen"
                              checked={keepModalOpen}
                              onChange={(e) => setKeepModalOpen(e.target.checked)}
                              className="rounded border-slate-300 text-amber-500 focus:ring-amber-500"
                            />
                            <label htmlFor="keepModalOpen" className={`text-xs font-semibold ${isLight ? "text-slate-600" : "text-slate-400"} cursor-pointer`}>
                              Keep modal open to add more products under <strong>{formCategory}</strong> category
                            </label>
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  <div className={`flex justify-end gap-3 pt-4 border-t ${isLight ? "border-slate-100" : "border-slate-800"}`}>
                    <button
                      type="button"
                      onClick={() => setShowProductModal(false)}
                      className={`px-4 py-2 border font-medium text-xs rounded-xl cursor-pointer transition-colors ${
                        isLight 
                          ? "bg-white hover:bg-slate-55 border-slate-200 text-slate-500" 
                          : "bg-slate-950 hover:bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
                      }`}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs rounded-xl transition-all cursor-pointer shadow-md shadow-amber-500/10"
                    >
                      {editProductId ? "Apply Solutions" : "Establish Solution"}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Corporate Invoice View Modal */}
      <AnimatePresence>
        {selectedOrderForInvoice && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`w-full max-w-md border rounded-2xl shadow-2xl overflow-hidden relative ${isLight ? "bg-white border-slate-200" : "bg-slate-900 border-slate-850"}`}
            >
              <div className="h-1 bg-gradient-to-r from-amber-500 to-amber-600" />
              <button
                onClick={() => setSelectedOrderForInvoice(null)}
                className={`absolute top-4 right-4 p-1.5 rounded-lg cursor-pointer ${isLight ? "bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-500 hover:text-slate-700" : "bg-slate-950/50 hover:bg-slate-950/80 text-slate-400 hover:text-white border border-slate-800/40"}`}
              >
                <X className="w-4 h-4" />
              </button>

              <div className="p-6 md:p-8">
                <div className={`text-center pb-6 border-b ${isLight ? "border-slate-100" : "border-slate-800/80"}`}>
                  <Receipt className="w-10 h-10 text-amber-500 mx-auto mb-3" />
                  <h3 className={`text-lg font-semibold ${isLight ? "text-slate-900" : "text-white"}`}>Corporate Invoice Ledger</h3>
                  <p className={`text-[10px] ${textMutedClass} uppercase tracking-widest font-mono mt-0.5`}>Secure Transaction Log</p>
                </div>

                <div className={`py-6 space-y-4 font-mono text-xs ${isLight ? "text-slate-600" : "text-slate-400"}`}>
                  <div className="flex justify-between">
                    <span>Transaction ID:</span>
                    <span className={`font-semibold ${isLight ? "text-slate-800" : "text-white"}`}>{selectedOrderForInvoice.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Captured Date:</span>
                    <span className={`font-semibold ${isLight ? "text-slate-800" : "text-white"}`}>{new Date(selectedOrderForInvoice.date).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Acquired Offering:</span>
                    <span className={`font-semibold text-right max-w-[200px] truncate ${isLight ? "text-slate-800" : "text-white"}`}>{selectedOrderForInvoice.productTitle}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Buyer Corporate Name:</span>
                    <span className={`font-semibold text-right ${isLight ? "text-slate-800" : "text-white"}`}>{selectedOrderForInvoice.buyerCompany || "External entity"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Authorized Representative:</span>
                    <span className={`font-semibold text-right ${isLight ? "text-slate-800" : "text-white"}`}>{selectedOrderForInvoice.buyerName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Corporate Credit Line:</span>
                    <span className={`font-semibold ${isLight ? "text-slate-800" : "text-white"}`}>VISA •••• {selectedOrderForInvoice.cardNumberLast4}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Verification Status:</span>
                    <span className="text-emerald-500 font-bold bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded text-[10px]">AUTHORIZED SUCCESS</span>
                  </div>

                  <div className={`border-t pt-4 mt-2 flex justify-between items-center text-sm ${isLight ? "border-slate-100" : "border-slate-800/80"}`}>
                    <span className={`font-semibold ${isLight ? "text-slate-500" : "text-slate-300"}`}>Total Capital Captured:</span>
                    <span className="text-amber-500 font-bold text-lg">${selectedOrderForInvoice.price.toLocaleString()}</span>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedOrderForInvoice(null)}
                  className={`w-full border text-center py-2.5 rounded-xl text-xs font-semibold cursor-pointer transition-colors ${
                    isLight 
                      ? "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600 hover:text-slate-800" 
                      : "bg-slate-850 hover:bg-slate-800 text-slate-300 border-slate-800"
                  }`}
                >
                  Dismiss Ledger
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Member Modal */}
      <AnimatePresence>
        {showUserModal && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`w-full max-w-lg border rounded-2xl shadow-2xl overflow-hidden ${isLight ? "bg-white border-slate-200" : "bg-slate-900 border-slate-800"}`}
            >
              <div className="h-1 bg-gradient-to-r from-amber-500 to-amber-600" />
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className={`text-md font-semibold ${isLight ? "text-slate-900" : "text-white"}`}>
                    Register Corporate Member
                  </h3>
                  <button
                    onClick={() => setShowUserModal(false)}
                    className={`p-1.5 rounded-lg cursor-pointer ${isLight ? "bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-500 hover:text-slate-700" : "bg-slate-950/50 hover:bg-slate-950/80 text-slate-400 hover:text-white border border-slate-800/40"}`}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleSaveUser} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className={`block text-xs font-semibold ${isLight ? "text-slate-600" : "text-slate-400"} uppercase tracking-wider mb-1.5`}>Full Name</label>
                      <input
                        type="text"
                        required
                        value={userFormName}
                        onChange={(e) => setUserFormName(e.target.value)}
                        placeholder="e.g. Alexander Mercer"
                        className={`w-full focus:ring-1 focus:ring-amber-500/20 focus:outline-none rounded-lg py-2 px-3 text-sm ${inputClass}`}
                      />
                    </div>

                    <div>
                      <label className={`block text-xs font-semibold ${isLight ? "text-slate-600" : "text-slate-400"} uppercase tracking-wider mb-1.5`}>Email Address</label>
                      <input
                        type="email"
                        required
                        value={userFormEmail}
                        onChange={(e) => setUserFormEmail(e.target.value)}
                        placeholder="e.g. alex@mercer.com"
                        className={`w-full focus:ring-1 focus:ring-amber-500/20 focus:outline-none rounded-lg py-2 px-3 text-sm ${inputClass}`}
                      />
                    </div>

                    <div>
                      <label className={`block text-xs font-semibold ${isLight ? "text-slate-600" : "text-slate-400"} uppercase tracking-wider mb-1.5`}>Password</label>
                      <input
                        type="text"
                        value={userFormPassword}
                        onChange={(e) => setUserFormPassword(e.target.value)}
                        placeholder="Default: temp123"
                        className={`w-full focus:ring-1 focus:ring-amber-500/20 focus:outline-none rounded-lg py-2 px-3 text-sm ${inputClass}`}
                      />
                    </div>

                    <div>
                      <label className={`block text-xs font-semibold ${isLight ? "text-slate-600" : "text-slate-400"} uppercase tracking-wider mb-1.5`}>Corporate Association</label>
                      <input
                        type="text"
                        value={userFormCompanyName}
                        onChange={(e) => setUserFormCompanyName(e.target.value)}
                        placeholder="e.g. Mercer Capital"
                        className={`w-full focus:ring-1 focus:ring-amber-500/20 focus:outline-none rounded-lg py-2 px-3 text-sm ${inputClass}`}
                      />
                    </div>

                    <div>
                      <label className={`block text-xs font-semibold ${isLight ? "text-slate-600" : "text-slate-400"} uppercase tracking-wider mb-1.5`}>System Node Authority</label>
                      <select
                        value={userFormRole}
                        onChange={(e) => setUserFormRole(e.target.value)}
                        className={`w-full focus:ring-1 focus:ring-amber-500/20 focus:outline-none rounded-lg py-2 px-3 text-sm ${inputClass}`}
                      >
                        <option value="buyer" className={selectOptionClass}>buyer node</option>
                        <option value="admin" className={selectOptionClass}>admin node</option>
                      </select>
                    </div>

                    {userFormRole === "buyer" && (
                      <div>
                        <label className={`block text-xs font-semibold ${isLight ? "text-slate-600" : "text-slate-400"} uppercase tracking-wider mb-1.5`}>Initial Capital Reserves ($)</label>
                        <input
                          type="number"
                          value={userFormBalance}
                          onChange={(e) => setUserFormBalance(e.target.value)}
                          placeholder="e.g. 100000"
                          className={`w-full focus:ring-1 focus:ring-amber-500/20 focus:outline-none rounded-lg py-2 px-3 text-sm font-mono ${inputClass}`}
                        />
                      </div>
                    )}

                    <div>
                      <label className={`block text-xs font-semibold ${isLight ? "text-slate-600" : "text-slate-400"} uppercase tracking-wider mb-1.5`}>Age (18+)</label>
                      <input
                        type="number"
                        min="18"
                        value={userFormAge}
                        onChange={(e) => setUserFormAge(e.target.value)}
                        placeholder="e.g. 35"
                        className={`w-full focus:ring-1 focus:ring-amber-500/20 focus:outline-none rounded-lg py-2 px-3 text-sm font-mono ${inputClass}`}
                      />
                    </div>

                    <div>
                      <label className={`block text-xs font-semibold ${isLight ? "text-slate-600" : "text-slate-400"} uppercase tracking-wider mb-1.5`}>Gender</label>
                      <select
                        value={userFormGender}
                        onChange={(e) => setUserFormGender(e.target.value)}
                        className={`w-full focus:ring-1 focus:ring-amber-500/20 focus:outline-none rounded-lg py-2 px-3 text-sm ${inputClass}`}
                      >
                        <option value="" className={selectOptionClass}>Select Gender</option>
                        <option value="Male" className={selectOptionClass}>Male</option>
                        <option value="Female" className={selectOptionClass}>Female</option>
                        <option value="Non-binary" className={selectOptionClass}>Non-binary</option>
                      </select>
                    </div>

                    <div className="md:col-span-2">
                      <label className={`block text-xs font-semibold ${isLight ? "text-slate-600" : "text-slate-400"} uppercase tracking-wider mb-1.5`}>Mobile Contact Phone</label>
                      <input
                        type="tel"
                        value={userFormPhone}
                        onChange={(e) => setUserFormPhone(e.target.value)}
                        placeholder="e.g. +1 (555) 019-2834"
                        className={`w-full focus:ring-1 focus:ring-amber-500/20 focus:outline-none rounded-lg py-2 px-3 text-sm ${inputClass}`}
                      />
                    </div>
                  </div>

                  <div className={`flex justify-end gap-3 pt-4 border-t ${isLight ? "border-slate-100" : "border-slate-800"}`}>
                    <button
                      type="button"
                      onClick={() => setShowUserModal(false)}
                      className={`px-4 py-2 border font-medium text-xs rounded-xl cursor-pointer transition-colors ${
                        isLight 
                          ? "bg-white hover:bg-slate-50 border-slate-200 text-slate-500" 
                          : "bg-slate-950 hover:bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
                      }`}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs rounded-xl transition-all cursor-pointer shadow-md shadow-amber-500/10"
                    >
                      Verify & Add Member
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
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
