import express from "express";
import path from "path";
import { MongoClient, Db } from "mongodb";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Parse JSON request bodies
app.use(express.json());

// MongoDB Configuration & Client
const MONGODB_URI = process.env.MONGODB_URI;
let mongoDbClient: MongoClient | null = null;
let mongoDb: Db | null = null;
let isMongoConnected = false;

// Initialize Database structure
const initialDb = {
  users: [
    {
      id: "usr-admin",
      email: "yordiasres@gamil.com",
      password: "yordi1234",
      role: "admin",
      name: "Yordi Asres",
      companyName: "Merkato Global Group",
      approved: true
    },
    {
      id: "usr-buyer",
      email: "buyer@merkato.com",
      password: "buyer123",
      role: "buyer",
      name: "Marcus Aurelius",
      companyName: "Stoic Analytics Ltd",
      balance: 100000,
      approved: true
    },
    {
      id: "usr-pending",
      email: "demo-pending@merkato.com",
      password: "buyer123",
      role: "buyer",
      name: "Arthur Pendragon",
      companyName: "Camelot Consulting",
      balance: 100000,
      approved: false
    }
  ],
  products: [
    {
      id: "prod-electronics",
      title: "Omni Pro Noise-Cancelling Headphones",
      description: "Experience premium, rich sound quality with industry-leading hybrid active noise cancellation, smart touch gestures, and a luxury ergonomic leather headband.",
      price: 350,
      stock: 12,
      category: "ELECTRONICS",
      tags: ["Audio", "Wireless", "ANC", "Premium"],
      imageUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80"
    },
    {
      id: "prod-clothes",
      title: "Classic Cashmere Trench Coat",
      description: "Bespoke double-breasted trench coat tailored from pure Mongolian cashmere. Offers superior warmth, a silken touch, and a sophisticated classic drape.",
      price: 1250,
      stock: 8,
      category: "clothes",
      tags: ["Cashmere", "Coat", "Tailored", "Winter"],
      imageUrl: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=600&q=80"
    },
    {
      id: "prod-spices",
      title: "Organic Iranian Saffron & Cardamom Blend",
      description: "A highly aromatic selection of the finest hand-harvested royal saffron filaments coupled with ground organic green cardamom pods. Sourced responsibly.",
      price: 145,
      stock: 25,
      category: "SPICES",
      tags: ["Saffron", "Cardamom", "Spices", "Organic"],
      imageUrl: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=600&q=80"
    },
    {
      id: "prod-foode",
      title: "Certified A5 Miyazaki Japanese Wagyu Ribeye",
      description: "The peak of culinary luxury. Certified Japanese A5 beef with unparalleled snowflake marbling, giving it a rich, buttery melt-in-your-mouth experience.",
      price: 495,
      stock: 5,
      category: "FOODE",
      tags: ["Wagyu", "Steak", "Certified", "Luxury"],
      imageUrl: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80"
    },
    {
      id: "prod-firuts",
      title: "Deluxe Golden Honey Mango Basket",
      description: "Premium selection of handpicked, export-quality Golden Honey Mangoes. Celebrated for their rich, nectarous sweetness, floral fragrance, and stringless flesh.",
      price: 75,
      stock: 18,
      category: "FIRUTS",
      tags: ["Mango", "Fruits", "Organic", "Fresh"],
      imageUrl: "https://images.unsplash.com/photo-1553279768-865429fa0078?auto=format&fit=crop&w=600&q=80"
    },
    {
      id: "prod-accessories",
      title: "Minimalist Full-Grain Leather Wallet",
      description: "Handcrafted from full-grain vegetable-tanned leather. Features an ultra-slim profile, RFID protective lining, and robust hand-stitched reinforcements.",
      price: 85,
      stock: 30,
      category: "accessories",
      tags: ["Leather", "Wallet", "Minimalist", "Everyday"],
      imageUrl: "https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=600&q=80"
    },
    {
      id: "prod-shose",
      title: "Vanguard Full-Grain Derby Shoes",
      description: "Classic Italian leather Derby shoes. Features a hand-burnished finish, full leather lining, durable storm welt, and high-traction cushioned leather soles.",
      price: 320,
      stock: 14,
      category: "SHOSE",
      tags: ["Derby", "Italian Leather", "Classic", "Premium"],
      imageUrl: "https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=600&q=80"
    }
  ],
  orders: [
    {
      id: "ord-seed-1",
      buyerId: "usr-buyer",
      buyerName: "Marcus Aurelius",
      buyerCompany: "Stoic Analytics Ltd",
      productId: "prod-clothes",
      productTitle: "Classic Cashmere Trench Coat",
      price: 1250,
      date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
      status: "succeeded",
      cardNumberLast4: "4242"
    },
    {
      id: "ord-seed-2",
      buyerId: "usr-buyer",
      buyerName: "Marcus Aurelius",
      buyerCompany: "Stoic Analytics Ltd",
      productId: "prod-spices",
      productTitle: "Organic Iranian Saffron & Cardamom Blend",
      price: 145,
      date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      status: "succeeded",
      cardNumberLast4: "9876"
    }
  ],
  categories: [
    "ELECTRONICS",
    "clothes",
    "SPICES",
    "FOODE",
    "FIRUTS",
    "accessories",
    "SHOSE"
  ]
};

// In-Memory state store (synchronized with MongoDB when connected)
let currentDb = JSON.parse(JSON.stringify(initialDb));

// MongoDB Sync Functions
async function initMongo() {
  const uri = MONGODB_URI ? MONGODB_URI.trim() : "";
  if (!uri || (!uri.startsWith("mongodb://") && !uri.startsWith("mongodb+srv://"))) {
    console.log("[MongoDB] MONGODB_URI is not set or valid. Using active memory store.");
    return;
  }
  try {
    mongoDbClient = new MongoClient(uri);
    await mongoDbClient.connect();
    mongoDb = mongoDbClient.db();
    isMongoConnected = true;
    console.log("[MongoDB] Successfully connected to MongoDB database!");

    // Fetch existing data from MongoDB if present
    const mongoUsers = await mongoDb.collection("users").find({}).toArray();
    const mongoProducts = await mongoDb.collection("products").find({}).toArray();
    const mongoOrders = await mongoDb.collection("orders").find({}).toArray();
    const mongoCatDoc = await mongoDb.collection("categories").findOne({ name: "categories_list" });

    if (mongoUsers.length > 0) {
      currentDb.users = mongoUsers.map(({ _id, ...u }) => u as any);
    } else {
      await mongoDb.collection("users").insertMany(initialDb.users.map(u => ({ ...u })));
    }

    if (mongoProducts.length > 0) {
      currentDb.products = mongoProducts.map(({ _id, ...p }) => p as any);
    } else {
      await mongoDb.collection("products").insertMany(initialDb.products.map(p => ({ ...p })));
    }

    if (mongoOrders.length > 0) {
      currentDb.orders = mongoOrders.map(({ _id, ...o }) => o as any);
    } else {
      await mongoDb.collection("orders").insertMany(initialDb.orders.map(o => ({ ...o })));
    }

    if (mongoCatDoc && Array.isArray(mongoCatDoc.items) && mongoCatDoc.items.length > 0) {
      currentDb.categories = mongoCatDoc.items;
    } else {
      await mongoDb.collection("categories").updateOne(
        { name: "categories_list" },
        { $set: { name: "categories_list", items: initialDb.categories } },
        { upsert: true }
      );
    }
  } catch (err: any) {
    console.warn("[MongoDB] Failed to connect to MongoDB, defaulting to in-memory store:", err.message);
    isMongoConnected = false;
  }
}

async function syncToMongo(data: typeof initialDb) {
  if (!isMongoConnected || !mongoDb) return;
  try {
    // Sync users
    await mongoDb.collection("users").deleteMany({});
    if (data.users.length > 0) {
      await mongoDb.collection("users").insertMany(data.users.map(u => ({ ...u })));
    }

    // Sync products
    await mongoDb.collection("products").deleteMany({});
    if (data.products.length > 0) {
      await mongoDb.collection("products").insertMany(data.products.map(p => ({ ...p })));
    }

    // Sync orders
    await mongoDb.collection("orders").deleteMany({});
    if (data.orders.length > 0) {
      await mongoDb.collection("orders").insertMany(data.orders.map(o => ({ ...o })));
    }

    // Sync categories
    await mongoDb.collection("categories").updateOne(
      { name: "categories_list" },
      { $set: { name: "categories_list", items: data.categories } },
      { upsert: true }
    );
  } catch (err: any) {
    console.error("[MongoDB] Sync error:", err.message);
  }
}

function readDb() {
  return currentDb;
}

function writeDb(data: typeof initialDb) {
  currentDb = data;
  syncToMongo(data).catch(err => console.error("[MongoDB] Write async error:", err));
}

// Ensure database is initialized
let dbUpdated = false;

// Force-update categories
currentDb.categories = [
  "ELECTRONICS",
  "clothes",
  "SPICES",
  "FOODE",
  "FIRUTS",
  "accessories",
  "SHOSE"
];
dbUpdated = true;

// Ensure products are present
if (!currentDb.products || currentDb.products.length === 0 || currentDb.products.some(p => p.category === "Public Relations")) {
  currentDb.products = [...initialDb.products];
  dbUpdated = true;
}

// Force-update the seed admin's password and email
const adminUser = currentDb.users?.find(u => u.id === "usr-admin");
if (adminUser) {
  adminUser.email = "yordiasres@gamil.com";
  adminUser.password = "yordi1234";
  adminUser.role = "admin";
  adminUser.name = "Yordi Asres";
  adminUser.approved = true;
  dbUpdated = true;
}

// Add a pending user if not present
if (currentDb.users && !currentDb.users.some(u => u.id === "usr-pending")) {
  currentDb.users.push({
    id: "usr-pending",
    email: "demo-pending@merkato.com",
    password: "buyer123",
    role: "buyer",
    name: "Arthur Pendragon",
    companyName: "Camelot Consulting",
    balance: 100000,
    approved: false
  });
  dbUpdated = true;
}

// Add requested user accounts
if (currentDb.users && !currentDb.users.some(u => u.email.toLowerCase() === "yordiasres@gamil.com")) {
  currentDb.users.push({
    id: "usr-yordi-gamil",
    email: "yordiasres@gamil.com",
    password: "yordi68757436",
    role: "buyer",
    name: "Yordi Asres",
    companyName: "Individual Operator",
    balance: 100000,
    approved: true,
    age: 24,
    gender: "Male"
  });
  dbUpdated = true;
}

if (currentDb.users && !currentDb.users.some(u => u.email.toLowerCase() === "yordiasres@gmail.com")) {
  currentDb.users.push({
    id: "usr-yordi-gmail",
    email: "yordiasres@gmail.com",
    password: "yordi68757436",
    role: "buyer",
    name: "Yordi Asres",
    companyName: "Individual Operator",
    balance: 100000,
    approved: true,
    age: 24,
    gender: "Male"
  });
  dbUpdated = true;
}

if (dbUpdated) {
  writeDb(currentDb);
}


// Lazy Gemini API initialization helper
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    console.warn("GEMINI_API_KEY is not set or is a placeholder.");
    return null;
  }
  return new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
};

// ============================================================================
// API ROUTES
// ============================================================================

// Auth Routes
app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;
  const db = readDb();
  
  const user = db.users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
  if (!user) {
    return res.status(401).json({ message: "Invalid email or password" });
  }

  // Check if buyer user is approved
  if (user.role === "buyer" && user.approved === false) {
    return res.status(403).json({ message: "Access Denied: Your account is pending administrator verification." });
  }
  
  // Return user info (excluding password for security)
  const { password: _, ...safeUser } = user;
  res.json({ user: safeUser });
});

app.post("/api/auth/register", (req, res) => {
  const { email, password, role, name, companyName, age, gender, phone } = req.body;
  const db = readDb();
  
  if (db.users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
    return res.status(400).json({ message: "An account with this email already exists" });
  }

  // Validate Age (must be 18+)
  if (age !== undefined && Number(age) < 18) {
    return res.status(400).json({ message: "Registration failed: You must be 18 years or older to access the corporate channel." });
  }
  
  const newUser = {
    id: `usr-${Math.random().toString(36).substr(2, 9)}`,
    email,
    password,
    role: role || "buyer",
    name,
    companyName: companyName || "Individual Operator",
    balance: (role || "buyer") === "buyer" ? 100000 : undefined, // Start buyers with $100,000
    approved: (role || "buyer") === "admin" ? true : false, // Admins are auto-approved, buyers need approval
    age: age ? Number(age) : undefined,
    gender: gender || undefined,
    phone: phone || undefined
  };
  
  db.users.push(newUser);
  writeDb(db);
  
  const { password: _, ...safeUser } = newUser;
  res.status(201).json({ user: safeUser });
});

// Users Management Routes (Admin Only)
app.get("/api/users", (req, res) => {
  const db = readDb();
  // Map to exclude password for security
  const safeUsers = db.users.map(({ password, ...u }) => u);
  res.json(safeUsers);
});

app.post("/api/users/:id/approve", (req, res) => {
  const { id } = req.params;
  const db = readDb();
  
  const userIndex = db.users.findIndex(u => u.id === id);
  if (userIndex === -1) {
    return res.status(404).json({ message: "User not found" });
  }
  
  db.users[userIndex].approved = true;
  writeDb(db);
  
  const { password, ...safeUser } = db.users[userIndex];
  res.json({ success: true, user: safeUser });
});

app.post("/api/users/:id/reject", (req, res) => {
  const { id } = req.params;
  const db = readDb();
  
  const initialCount = db.users.length;
  db.users = db.users.filter(u => u.id !== id);
  
  if (db.users.length === initialCount) {
    return res.status(404).json({ message: "User not found" });
  }
  
  writeDb(db);
  res.json({ success: true, message: "User request declined and profile purged." });
});

// Admin Add Member Route
app.post("/api/users", (req, res) => {
  const { email, password, role, name, companyName, age, gender, phone, balance } = req.body;
  const db = readDb();
  
  if (db.users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
    return res.status(400).json({ message: "An account with this email already exists" });
  }

  const newUser = {
    id: `usr-${Math.random().toString(36).substr(2, 9)}`,
    email,
    password: password || "temp123", // default temp password
    role: role || "buyer",
    name,
    companyName: companyName || "Individual Operator",
    balance: role === "admin" ? undefined : (balance !== undefined ? Number(balance) : 100000),
    approved: true, // Auto-approved when added by Admin
    age: age ? Number(age) : undefined,
    gender: gender || undefined,
    phone: phone || undefined
  };
  
  db.users.push(newUser);
  writeDb(db);
  
  const { password: _, ...safeUser } = newUser;
  res.status(201).json({ success: true, user: safeUser });
});

// Admin Kick Member Route
app.delete("/api/users/:id", (req, res) => {
  const { id } = req.params;
  const db = readDb();
  
  const user = db.users.find(u => u.id === id);
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }
  
  // Prevent kicking admin themselves if possible
  db.users = db.users.filter(u => u.id !== id);
  writeDb(db);
  
  res.json({ success: true, message: `Member ${user.name} has been kicked and deleted from directory.` });
});

// Inventory (Products) Routes
app.get("/api/products", (req, res) => {
  const db = readDb();
  res.json(db.products);
});

app.post("/api/products", (req, res) => {
  const { title, description, price, stock, category, tags, imageUrl } = req.body;
  const db = readDb();
  
  const newProduct = {
    id: `prod-${Math.random().toString(36).substr(2, 9)}`,
    title,
    description,
    price: Number(price),
    stock: Number(stock),
    category,
    tags: Array.isArray(tags) ? tags : [tags],
    imageUrl: imageUrl || ""
  };
  
  db.products.push(newProduct);
  writeDb(db);
  res.status(201).json(newProduct);
});

app.put("/api/products/:id", (req, res) => {
  const { id } = req.params;
  const { title, description, price, stock, category, tags, imageUrl } = req.body;
  const db = readDb();
  
  const productIndex = db.products.findIndex(p => p.id === id);
  if (productIndex === -1) {
    return res.status(404).json({ message: "Product not found" });
  }
  
  db.products[productIndex] = {
    ...db.products[productIndex],
    title,
    description,
    price: Number(price),
    stock: Number(stock),
    category,
    tags: Array.isArray(tags) ? tags : [tags],
    imageUrl: imageUrl !== undefined ? imageUrl : db.products[productIndex].imageUrl
  };
  
  writeDb(db);
  res.json(db.products[productIndex]);
});

app.delete("/api/products/:id", (req, res) => {
  const { id } = req.params;
  const db = readDb();
  
  const initialCount = db.products.length;
  db.products = db.products.filter(p => p.id !== id);
  
  if (db.products.length === initialCount) {
    return res.status(404).json({ message: "Product not found" });
  }
  
  writeDb(db);
  res.json({ success: true, message: "Product deleted" });
});

// Categories Routes
app.get("/api/categories", (req, res) => {
  const db = readDb();
  res.json(db.categories || []);
});

app.post("/api/categories", (req, res) => {
  const { name } = req.body;
  if (!name || typeof name !== "string" || !name.trim()) {
    return res.status(400).json({ message: "Category name is required" });
  }
  const db = readDb();
  if (!db.categories) {
    db.categories = [];
  }
  const cleanName = name.trim();
  if (db.categories.some((c: string) => c.toLowerCase() === cleanName.toLowerCase())) {
    return res.status(400).json({ message: "Category already exists" });
  }
  db.categories.push(cleanName);
  writeDb(db);
  res.status(201).json({ success: true, categories: db.categories });
});

app.delete("/api/categories", (req, res) => {
  const { name } = req.body;
  if (!name) {
    return res.status(400).json({ message: "Category name is required" });
  }
  const db = readDb();
  if (db.categories) {
    db.categories = db.categories.filter((c: string) => c.toLowerCase() !== name.toLowerCase());
    writeDb(db);
  }
  res.json({ success: true, categories: db.categories || [] });
});

// Checkout / Payment Gateway Route
app.post("/api/checkout", (req, res) => {
  const { productId, buyerId, cardDetails } = req.body;
  const db = readDb();
  
  const product = db.products.find(p => p.id === productId);
  if (!product) {
    return res.status(404).json({ message: "Marketing product not found." });
  }
  
  if (product.stock <= 0) {
    return res.status(400).json({ message: "This item is currently out of stock." });
  }
  
  const buyerIndex = db.users.findIndex(u => u.id === buyerId);
  if (buyerIndex === -1) {
    return res.status(404).json({ message: "Buyer user profile not found." });
  }
  
  const buyer = db.users[buyerIndex];
  if (buyer.role !== "buyer") {
    return res.status(400).json({ message: "Only buyer accounts can purchase products." });
  }
  
  // Verify buyer balance (Merkato Store expensive marketing items!)
  if (buyer.balance !== undefined && buyer.balance < product.price) {
    return res.status(400).json({ message: `Insufficient marketing funds. This premium item requires $${product.price.toLocaleString()}, but your corporate account only has $${buyer.balance.toLocaleString()}.` });
  }
  
  // Basic mock CC validation (ensure 16-digit structure and correct length)
  const ccNumber = String(cardDetails.number || "").replace(/\s/g, "");
  if (ccNumber.length < 15 || ccNumber.length > 16) {
    return res.status(400).json({ message: "Invalid payment credentials. Please check your card number." });
  }
  
  // Process purchase request (keep stock and balance untouched, set status to pending)
  const newOrder = {
    id: `ord-${Math.random().toString(36).substr(2, 9)}`,
    buyerId: buyer.id,
    buyerName: buyer.name,
    buyerCompany: buyer.companyName,
    productId: product.id,
    productTitle: product.title,
    price: product.price,
    date: new Date().toISOString(),
    status: "pending" as const,
    cardNumberLast4: ccNumber.slice(-4)
  };
  
  db.orders.push(newOrder);
  writeDb(db);
  
  // Respond with the order and buyer data
  const { password: _, ...safeBuyer } = buyer;
  res.json({ order: newOrder, user: safeBuyer });
});

// Bulk Cart Checkout / Payment Route
app.post("/api/checkout/cart", (req, res) => {
  const { cartItems, buyerId, cardDetails } = req.body;
  if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
    return res.status(400).json({ message: "Cart is empty." });
  }
  
  const db = readDb();
  
  const buyerIndex = db.users.findIndex(u => u.id === buyerId);
  if (buyerIndex === -1) {
    return res.status(404).json({ message: "Buyer user profile not found." });
  }
  
  const buyer = db.users[buyerIndex];
  if (buyer.role !== "buyer") {
    return res.status(400).json({ message: "Only buyer accounts can purchase products." });
  }
  
  // Verify all products exist and calculate total
  let totalCost = 0;
  const verifiedProducts = [];
  
  for (const item of cartItems) {
    const product = db.products.find(p => p.id === item.id);
    if (!product) {
      return res.status(404).json({ message: `Marketing product "${item.title || item.id}" not found.` });
    }
    if (product.stock <= 0) {
      return res.status(400).json({ message: `"${product.title}" is currently out of stock.` });
    }
    totalCost += product.price * item.quantity;
    verifiedProducts.push({ product, quantity: item.quantity });
  }
  
  // Verify balance
  if (buyer.balance !== undefined && buyer.balance < totalCost) {
    return res.status(400).json({ message: `Insufficient marketing funds. This premium cart requires $${totalCost.toLocaleString()}, but your corporate account only has $${buyer.balance.toLocaleString()}.` });
  }
  
  // Basic mock CC validation
  const ccNumber = String(cardDetails.number || "").replace(/\s/g, "");
  if (ccNumber.length < 15 || ccNumber.length > 16) {
    return res.status(400).json({ message: "Invalid payment credentials. Please check your card number." });
  }
  
  // Create pending orders for each unit
  const createdOrders = [];
  for (const verified of verifiedProducts) {
    for (let q = 0; q < verified.quantity; q++) {
      const newOrder = {
        id: `ord-${Math.random().toString(36).substr(2, 9)}`,
        buyerId: buyer.id,
        buyerName: buyer.name,
        buyerCompany: buyer.companyName,
        productId: verified.product.id,
        productTitle: verified.product.title,
        price: verified.product.price,
        date: new Date().toISOString(),
        status: "pending" as const,
        cardNumberLast4: ccNumber.slice(-4)
      };
      db.orders.push(newOrder);
      createdOrders.push(newOrder);
    }
  }
  
  writeDb(db);
  const { password: _, ...safeBuyer } = buyer;
  res.json({ orders: createdOrders, user: safeBuyer });
});

// Orders Route
app.get("/api/orders", (req, res) => {
  const db = readDb();
  res.json(db.orders);
});

// Approve Order Route
app.post("/api/orders/:id/approve", (req, res) => {
  const { id } = req.params;
  const db = readDb();
  
  const orderIndex = db.orders.findIndex(o => o.id === id);
  if (orderIndex === -1) {
    return res.status(404).json({ message: "Order not found." });
  }
  
  const order = db.orders[orderIndex];
  if (order.status !== "pending") {
    return res.status(400).json({ message: `Order is already ${order.status}.` });
  }
  
  const product = db.products.find(p => p.id === order.productId);
  if (!product) {
    return res.status(404).json({ message: "Product not found." });
  }
  
  if (product.stock <= 0) {
    return res.status(400).json({ message: "This solution is currently out of stock." });
  }
  
  const buyer = db.users.find(u => u.id === order.buyerId);
  if (!buyer) {
    return res.status(404).json({ message: "Buyer not found." });
  }
  
  if (buyer.balance !== undefined && buyer.balance < order.price) {
    return res.status(400).json({ message: `Buyer has insufficient balance ($${buyer.balance.toLocaleString()}) to approve this purchase.` });
  }
  
  // Deduct stock and buyer balance
  product.stock -= 1;
  if (buyer.balance !== undefined) {
    buyer.balance -= order.price;
  }
  
  // Set status to succeeded
  order.status = "succeeded";
  
  writeDb(db);
  
  res.json({ success: true, order, user: buyer });
});

// Reject Order Route
app.post("/api/orders/:id/reject", (req, res) => {
  const { id } = req.params;
  const db = readDb();
  
  const orderIndex = db.orders.findIndex(o => o.id === id);
  if (orderIndex === -1) {
    return res.status(404).json({ message: "Order not found." });
  }
  
  const order = db.orders[orderIndex];
  if (order.status !== "pending") {
    return res.status(400).json({ message: `Order is already ${order.status}.` });
  }
  
  order.status = "rejected";
  
  writeDb(db);
  
  res.json({ success: true, order });
});

// Gemini Routes
app.post("/api/gemini/generate-copy", async (req, res) => {
  const { title, tags, price, category } = req.body;
  const ai = getGeminiClient();
  
  if (!ai) {
    // Elegant fallback descriptions when API Key is missing
    const fallbackDesc = `Exclusive high-ticket ${category || "marketing"} solution for '${title}'. Optimized to drive premium branding, targeting tags: [${(tags || []).join(", ")}]. Specially tuned for elite high-net-worth brand positioning at $${Number(price || 10000).toLocaleString()}. Includes custom deployment playbooks and persistent analytical tracking channels.`;
    return res.json({ copy: fallbackDesc });
  }
  
  try {
    const prompt = `Write a high-end, premium, elite marketing product description for a marketing service/product called "${title}".
Category: ${category}
Price: $${price}
Marketing tags: ${(tags || []).join(", ")}

Write 2 paragraphs. Focus on extreme return-on-investment, absolute luxury narrative positioning, authoritative media dominance, and the high-ticket status of this solution. Make it sound elegant, expensive, and incredibly compelling to elite corporate buyers.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
    });
    
    res.json({ copy: response.text });
  } catch (error: any) {
    console.error("Gemini copywriter error:", error);
    res.status(500).json({ message: "AI Copywriter failed to generate copy.", error: error.message });
  }
});

app.post("/api/gemini/generate-strategy", async (req, res) => {
  const { productTitle, companyDescription } = req.body;
  const ai = getGeminiClient();
  
  if (!ai) {
    // Elegant fallback strategy when API Key is missing
    const fallbackStrategy = `### 30-Day Deployment Roadmap for '${productTitle}'

**Phase 1: Brand Alignment (Days 1-10)**
- Conduct deep audit of ${companyDescription || "your target market"}.
- Refine communication parameters and deploy initial premium media notifications.

**Phase 2: Funnel Escalation (Days 11-20)**
- Activate custom capture networks and sync corporate lead capture points.
- Implement responsive visual banners and scale high-value targeted promotions.

**Phase 3: Authority Capture (Days 21-30)**
- Release premium narrative content pieces.
- Establish monthly performance indicators and optimize pipeline velocity.`;
    return res.json({ strategy: fallbackStrategy });
  }
  
  try {
    const prompt = `Generate a customized 30-day corporate deployment strategy for the premium marketing product "${productTitle}".
The buyer's company description is: "${companyDescription || "A high-growth business looking to capture premium market share."}"

Structure your response with clear Markdown headings:
1. "### Corporate Audit & Setup (Days 1-10)"
2. "### Market Escalation (Days 11-20)"
3. "### Velocity & Authority Lock-in (Days 21-30)"

Make it sound highly strategic, professional, consultative, and incredibly detailed for high-end corporate clients.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
    });
    
    res.json({ strategy: response.text });
  } catch (error: any) {
    console.error("Gemini strategist error:", error);
    res.status(500).json({ message: "AI Strategist failed to generate roadmap.", error: error.message });
  }
});

// ============================================================================
// VITE DEV SERVER AND PRODUCTION SERVING MIDDLEWARE
// ============================================================================

async function startServer() {
  await initMongo();

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
