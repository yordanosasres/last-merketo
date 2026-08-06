// Fallback product image if an image URL fails to load
export const FALLBACK_PRODUCT_IMAGE = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='600' height='400' viewBox='0 0 600 400' fill='%231e293b'><rect width='600' height='400' fill='%230f172a'/><circle cx='300' cy='180' r='60' fill='%23334155'/><path d='M250,260 L350,260 L330,220 L300,240 L280,210 Z' fill='%2364748b'/><text x='300' y='320' font-family='sans-serif' font-size='20' font-weight='bold' fill='%2394a3b8' text-anchor='middle'>MERKATO PRODUCT</text></svg>";

export const DEFAULT_INITIAL_CATEGORIES = [
  "ELECTRONICS",
  "clothes",
  "SPICES",
  "FOODE",
  "FIRUTS",
  "accessories",
  "SHOSE"
];

export const DEFAULT_INITIAL_PRODUCTS = [
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
];

export function getClientProducts() {
  try {
    const saved = localStorage.getItem("merkato_products");
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn("Failed to load products from localStorage", e);
  }
  return DEFAULT_INITIAL_PRODUCTS;
}

export function saveClientProducts(products) {
  try {
    localStorage.setItem("merkato_products", JSON.stringify(products));
  } catch (e) {
    console.warn("Failed to save products to localStorage", e);
  }
}

export function getClientCategories() {
  try {
    const saved = localStorage.getItem("merkato_categories");
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn("Failed to load categories from localStorage", e);
  }
  return DEFAULT_INITIAL_CATEGORIES;
}

export function saveClientCategories(categories) {
  try {
    localStorage.setItem("merkato_categories", JSON.stringify(categories));
  } catch (e) {
    console.warn("Failed to save categories to localStorage", e);
  }
}
