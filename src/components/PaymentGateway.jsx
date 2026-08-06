import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { CreditCard, ShieldCheck, X, Receipt, CheckCircle, Info, ChevronRight, Lock, Clock } from "lucide-react";

export default function PaymentGateway({ product, cartItems, user, onClose, onPaymentSuccess, onCartPaymentSuccess }) {
  const [cardNumber, setCardNumber] = useState("");
  const [cardHolder, setCardHolder] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successOrder, setSuccessOrder] = useState(null);

  // Format card number with spaces every 4 digits
  const handleCardNumberChange = (e) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length > 16) value = value.slice(0, 16);
    const formatted = value.replace(/(\d{4})(?=\d)/g, "$1 ");
    setCardNumber(formatted);
  };

  // Format expiry (MM/YY)
  const handleExpiryChange = (e) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length > 4) value = value.slice(0, 4);
    if (value.length > 2) {
      value = `${value.slice(0, 2)}/${value.slice(2)}`;
    }
    setExpiry(value);
  };

  const handleCvcChange = (e) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length > 4) value = value.slice(0, 4);
    setCvc(value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (cardNumber.replace(/\s/g, "").length < 15) {
      setError("Please provide a valid 15 or 16 digit card number.");
      setLoading(false);
      return;
    }

    if (!cardHolder.trim()) {
      setError("Please provide the cardholder's corporate name.");
      setLoading(false);
      return;
    }

    if (expiry.length < 5) {
      setError("Please specify expiration date (MM/YY).");
      setLoading(false);
      return;
    }

    if (cvc.length < 3) {
      setError("Please specify a valid security code.");
      setLoading(false);
      return;
    }

    try {
      const ccNumber = String(cardNumber || "").replace(/\s/g, "");
      
      if (cartItems && cartItems.length > 0) {
        // Bulk cart checkout
        const res = await fetch("/api/checkout/cart", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            cartItems,
            buyerId: user.id,
            cardDetails: {
              number: cardNumber,
              holder: cardHolder,
              expiry,
              cvc
            }
          })
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.message || "Transaction authorization declined.");
        }

        setSuccessOrder({
          id: data.orders[0]?.id || `cart-${Math.random().toString(36).substr(2, 5)}`,
          price: cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0),
          buyerName: user.name,
          cardNumberLast4: ccNumber.slice(-4),
          isCart: true,
          ordersCount: data.orders.length
        });

        if (onCartPaymentSuccess) {
          onCartPaymentSuccess(data.user, data.orders);
        }
      } else if (product) {
        // Single product checkout
        const res = await fetch("/api/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            productId: product.id,
            buyerId: user.id,
            cardDetails: {
              number: cardNumber,
              holder: cardHolder,
              expiry,
              cvc
            }
          })
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.message || "Transaction authorization declined.");
        }

        setSuccessOrder(data.order);
        if (onPaymentSuccess) {
          onPaymentSuccess(data.user, data.order);
        }
      } else {
        throw new Error("No purchase item or cart specified.");
      }
    } catch (err) {
      setError(err.message || "An unexpected error occurred during credit sweep.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-2xl bg-slate-900 border border-slate-800/80 rounded-2xl shadow-2xl overflow-hidden relative"
      >
        {/* Header decoration bar */}
        <div className="h-1 bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700" />

        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg bg-slate-950/50 hover:bg-slate-950/80 text-slate-400 hover:text-white border border-slate-800/40 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {!successOrder ? (
          <div className="p-6 md:p-8">
            <div className="mb-6">
              <span className="text-[10px] font-bold text-amber-500 tracking-wider uppercase bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full">Secure Payment Gateway</span>
              <h2 className="text-xl font-semibold text-white mt-3">Authorize Premium Transaction</h2>
              <p className="text-slate-400 text-sm mt-1">
                Acquiring: <strong className="text-white font-medium">
                  {cartItems && cartItems.length > 0 
                    ? `${cartItems.reduce((acc, item) => acc + item.quantity, 0)} slots across ${cartItems.length} campaigns (Cart / Chart)` 
                    : product?.title || "Premium Offering"}
                </strong>
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left Column: Interactive 3D Card Visualizer */}
              <div className="lg:col-span-5 flex flex-col items-center justify-center space-y-6">
                {/* 3D Card Container */}
                <div className="w-full max-w-[290px] h-[180px] [perspective:1000px] cursor-pointer" onClick={() => setIsFlipped(!isFlipped)}>
                  <div className={`relative w-full h-full transition-transform duration-700 [transform-style:preserve-3d] ${isFlipped ? "[transform:rotateY(180deg)]" : ""}`}>
                    
                    {/* Front of Card */}
                    <div className="absolute inset-0 w-full h-full rounded-xl bg-gradient-to-tr from-slate-950 to-slate-800 border border-slate-700/50 p-5 flex flex-col justify-between shadow-2xl backface-hidden">
                      <div className="flex justify-between items-start">
                        <div className="h-8 w-11 rounded bg-slate-800 border border-slate-700/40 flex items-center justify-center overflow-hidden">
                          {/* Gold Metallic Card Chip */}
                          <div className="grid grid-cols-3 grid-rows-3 gap-[2px] w-6 h-5">
                            {[...Array(9)].map((_, i) => (
                              <div key={i} className="bg-amber-500/60 rounded-[1px] border-[0.5px] border-amber-400/40" />
                            ))}
                          </div>
                        </div>
                        <span className="text-xs font-bold tracking-widest text-slate-400 italic">MERKATO ELITE</span>
                      </div>
                      
                      <div className="space-y-1.5">
                        <span className="text-sm font-mono tracking-[0.18em] text-white block">
                          {cardNumber || "•••• •••• •••• ••••"}
                        </span>
                        <div className="flex justify-between items-end">
                          <div className="max-w-[70%]">
                            <span className="text-[8px] font-bold text-slate-500 uppercase tracking-wider block">Cardholder</span>
                            <span className="text-xs font-medium text-slate-300 tracking-wide uppercase truncate block">
                              {cardHolder || "NAME SURNAME"}
                            </span>
                          </div>
                          <div>
                            <span className="text-[8px] font-bold text-slate-500 uppercase tracking-wider block">Expires</span>
                            <span className="text-xs font-mono text-slate-300 block">
                              {expiry || "MM/YY"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Back of Card */}
                    <div className="absolute inset-0 w-full h-full rounded-xl bg-gradient-to-tr from-slate-900 to-slate-950 border border-slate-800 p-5 flex flex-col justify-between shadow-2xl [transform:rotateY(180deg)] backface-hidden">
                      <div className="w-full h-8 bg-slate-950 -mx-5 mt-1 border-y border-slate-900" />
                      
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <div className="flex-1 h-7 bg-slate-800 rounded flex items-center justify-end px-2.5">
                            <span className="text-xs font-mono tracking-widest text-slate-400 italic">xxx</span>
                          </div>
                          <div className="w-12 h-7 bg-white rounded flex items-center justify-center">
                            <span className="text-xs font-mono font-bold text-slate-950 tracking-wider">
                              {cvc || "•••"}
                            </span>
                          </div>
                        </div>
                        
                        <p className="text-[6px] text-slate-600 text-center leading-normal">
                          This corporate line card is issued by Merkato Financial Services. Transactions processed through this platform are simulated checks strictly authorized under elite merchant standards.
                        </p>
                      </div>
                    </div>

                  </div>
                </div>

                {/* Card Helper Info */}
                <div className="bg-slate-950/50 rounded-xl p-3 border border-slate-800/40 text-[11px] text-slate-500 flex items-start gap-2 max-w-[290px]">
                  <Info className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                  <span>Interactive Card: Click the card to flip, or focus the CVV input field to view the security stripe.</span>
                </div>
              </div>

              {/* Right Column: Checkout Form */}
              <div className="lg:col-span-7">
                <form onSubmit={handleSubmit} className="space-y-4">
                  {error && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs flex items-start gap-2">
                      <Info className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{error}</span>
                    </div>
                  )}

                  <div className="bg-slate-950/60 rounded-xl p-4 border border-slate-800/50 flex justify-between items-center mb-2">
                    <div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Acquisition Price</p>
                      <h3 className="text-2xl font-semibold font-mono text-white mt-0.5">
                        ${cartItems && cartItems.length > 0 
                          ? cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0).toLocaleString() 
                          : product?.price.toLocaleString() || "0"}
                      </h3>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Corporate Balance</p>
                      <p className="text-sm font-semibold font-mono text-slate-300 mt-1">${(user.balance || 0).toLocaleString()}</p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Corporate Card Number</label>
                    <div className="relative">
                      <CreditCard className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                      <input
                        type="text"
                        required
                        value={cardNumber}
                        onChange={handleCardNumberChange}
                        onFocus={() => setIsFlipped(false)}
                        placeholder="4242 4242 4242 4242"
                        className="w-full bg-slate-950/50 border border-slate-800 focus:border-amber-500/50 focus:outline-none rounded-lg py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-700 transition-all font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Cardholder Corporate Name</label>
                    <input
                      type="text"
                      required
                      value={cardHolder}
                      onChange={(e) => setCardHolder(e.target.value)}
                      onFocus={() => setIsFlipped(false)}
                      placeholder="e.g. MARCUS AURELIUS"
                      className="w-full bg-slate-950/50 border border-slate-800 focus:border-amber-500/50 focus:outline-none rounded-lg py-2.5 px-3.5 text-sm text-white placeholder-slate-700 transition-all uppercase"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Expiry Date</label>
                      <input
                        type="text"
                        required
                        value={expiry}
                        onChange={handleExpiryChange}
                        onFocus={() => setIsFlipped(false)}
                        placeholder="MM/YY"
                        className="w-full bg-slate-950/50 border border-slate-800 focus:border-amber-500/50 focus:outline-none rounded-lg py-2.5 px-3.5 text-sm text-white placeholder-slate-700 transition-all font-mono text-center"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">CVV / CVC</label>
                      <input
                        type="password"
                        required
                        value={cvc}
                        onChange={handleCvcChange}
                        onFocus={() => setIsFlipped(true)}
                        onBlur={() => setIsFlipped(false)}
                        placeholder="•••"
                        className="w-full bg-slate-950/50 border border-slate-800 focus:border-amber-500/50 focus:outline-none rounded-lg py-2.5 px-3.5 text-sm text-white placeholder-slate-700 transition-all font-mono text-center"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-medium py-3 rounded-lg shadow-lg shadow-amber-500/10 hover:shadow-amber-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-55 mt-6"
                  >
                    {loading ? (
                      <span className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></span>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        <span>Authorize Payment Sweep</span>
                      </>
                    )}
                  </button>

                  <div className="flex items-center justify-center gap-2 text-[10px] text-slate-500 font-medium uppercase tracking-wider pt-2">
                    <Lock className="w-3 h-3 text-emerald-500" />
                    <span>256-Bit Corporate SSL Encrypted Node</span>
                  </div>
                </form>
              </div>
            </div>
          </div>
        ) : (
          /* Transaction Pending Success State */
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-8 text-center"
          >
            <div className="inline-flex items-center justify-center bg-amber-500/10 border border-amber-500/20 text-amber-500 p-4 rounded-full shadow-lg shadow-amber-500/5 mb-5 animate-pulse">
              <Clock className="w-12 h-12" />
            </div>

            <h2 className="text-2xl font-semibold text-white">Purchase Request Initiated</h2>
            
            {/* Elegant visual alert to them */}
            <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-200 text-sm max-w-md mx-auto mt-3 mb-5 text-left flex items-start gap-3">
              <Info className="w-5 h-5 shrink-0 text-amber-400 mt-0.5" />
              <div>
                <p className="font-semibold text-white">Awaiting Board Approval</p>
                <p className="text-xs text-amber-300/80 mt-1 leading-relaxed">
                  Your purchase request has been submitted to the administration. The corporate line transaction is currently held in a pending queue until approved by board admins. No funds have been deducted yet.
                </p>
              </div>
            </div>

            {/* Premium Invoice Receipt */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-6 my-6 text-left max-w-md mx-auto relative overflow-hidden">
              <div className="absolute top-0 right-0 p-3">
                <Receipt className="w-8 h-8 text-slate-800/80" />
              </div>
              <p className="text-[10px] font-bold text-amber-500 tracking-wider uppercase">Merkato Ledger Request</p>
              <h4 className="text-sm font-semibold text-white mt-1">Pending Request Invoice</h4>
              
              <div className="border-t border-slate-800/80 my-4 pt-4 space-y-2.5 font-mono text-xs">
                <div className="flex justify-between text-slate-500">
                  <span>Request ID:</span>
                  <span className="text-white font-medium">{successOrder.id}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Solutions:</span>
                  <span className="text-white font-medium truncate max-w-[200px]">
                    {successOrder.isCart 
                      ? `${successOrder.ordersCount} Campaigns in Cart` 
                      : product?.title || "Premium Offering"}
                  </span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Buyer:</span>
                  <span className="text-white font-medium">{successOrder.buyerName}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Corporate Line:</span>
                  <span className="text-white font-medium">VISA ending in •••• {successOrder.cardNumberLast4}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Request Status:</span>
                  <span className="text-amber-400 font-semibold uppercase tracking-wider text-[10px]">Pending Approval</span>
                </div>
                <div className="flex justify-between text-slate-500 border-t border-slate-800/60 pt-2.5">
                  <span className="font-semibold text-slate-400">Total Held:</span>
                  <span className="text-amber-500 font-bold text-sm">${successOrder.price.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-center gap-3">
              <button
                onClick={onClose}
                className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-medium text-sm rounded-lg transition-all cursor-pointer"
              >
                Close Gateway
              </button>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
