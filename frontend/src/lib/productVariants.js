import { parseSizes, pickImage } from "./storefront.js";

const SIZE_ORDER = ["S", "M", "L", "XL", "XXL"];

const COLOR_CSS = {
  black: "#141414",
  white: "#f5f5f5",
  cream: "#f0e6d8",
  beige: "#d4c4a8",
  brown: "#6b4423",
  navy: "#1e2a5a",
  blue: "#3b6fd4",
  red: "#c41e3a",
  maroon: "#6b1a2a",
  green: "#2d6a4f",
  olive: "#6b7c3e",
  pink: "#e8a0bf",
  purple: "#7c3aed",
  lavender: "#b794f6",
  grey: "#9ca3af",
  gray: "#9ca3af",
  gold: "#d4af37",
  yellow: "#f4d35e",
  orange: "#f77f00",
  peach: "#ffb89a",
  rust: "#b5522a",
  wine: "#722f37",
  charcoal: "#36454f",
  ivory: "#fffff0",
  tan: "#d2b48c",
  teal: "#0d9488",
  coral: "#ff7f6a",
  mustard: "#e3b505",
  denim: "#4a6fa5",
};

function normalizeColorKey(name) {
  return String(name || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ");
}

/** Unique admin colors with a representative image per color. */
export function getProductColors(product) {
  if (!product) return [];
  if (Array.isArray(product.variants) && product.variants.length) {
    const map = new Map();
    for (const v of product.variants) {
      const color = String(v.color || "").trim();
      if (!color || map.has(color)) continue;
      map.set(color, {
        color,
        imageUrl: v.image?.url || null,
      });
    }
    return [...map.values()];
  }
  return (product.colors || [])
    .map((c) => String(c).trim())
    .filter(Boolean)
    .map((color) => ({ color, imageUrl: null }));
}

export function colorToCss(colorName) {
  const key = normalizeColorKey(colorName);
  for (const [token, hex] of Object.entries(COLOR_CSS)) {
    if (key === token || key.includes(token)) return hex;
  }
  let hash = 0;
  for (let i = 0; i < key.length; i += 1) hash = key.charCodeAt(i) + ((hash << 5) - hash);
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue} 48% 42%)`;
}

export function getImageForColor(product, color) {
  if (!product || !color) return pickImage(product, product?.sku);
  const match = product.variants?.find((v) => String(v.color).trim() === color);
  if (match?.image?.url) return match.image.url;
  const opt = getProductColors(product).find((c) => c.color === color);
  if (opt?.imageUrl) return opt.imageUrl;
  return pickImage(product, `${product?.sku}-${color}`);
}

export function getImagesForColor(product, color) {
  if (!product) return [];
  const urls = new Set();
  const push = (url) => {
    if (url) urls.add(url);
  };

  if (color && Array.isArray(product.variants)) {
    for (const v of product.variants) {
      if (String(v.color).trim() === color) push(v.image?.url);
    }
  }

  if (Array.isArray(product.bannerImages)) {
    for (const img of product.bannerImages) push(img?.url);
  }

  if (!urls.size) {
    push(getImageForColor(product, color));
  }

  return [...urls].map((url) => ({ url }));
}

export function parseSizesForColor(product, color) {
  if (!product) return [];
  if (!color || !Array.isArray(product.variants) || !product.variants.length) {
    return parseSizes(product);
  }
  const inStock = product.variants
    .filter((v) => String(v.color).trim() === color && Number(v.stock) > 0)
    .map((v) => String(v.size || "").trim())
    .filter(Boolean);
  const sizes = inStock.length
    ? inStock
    : product.variants
        .filter((v) => String(v.color).trim() === color)
        .map((v) => String(v.size || "").trim())
        .filter(Boolean);
  const unique = [...new Set(sizes)];
  return unique.sort((a, b) => SIZE_ORDER.indexOf(a) - SIZE_ORDER.indexOf(b));
}

export function isColorInStock(product, color, size) {
  if (!product?.variants?.length) return Number(product?.stock) > 0;
  return product.variants.some(
    (v) =>
      String(v.color).trim() === color &&
      (!size || String(v.size).trim() === size) &&
      Number(v.stock) > 0
  );
}
