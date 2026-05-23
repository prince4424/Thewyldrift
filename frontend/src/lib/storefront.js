export const WHATSAPP_BUSINESS_NUMBER = "917719672237";

const START_STYLING_MESSAGE = "Hey Wyldrift! 🔥 Just checked out your collection and I'm obsessed! Ready to order — can you help me out? 🛍️✨";
const HERO_SLIDESHOW_DEFAULT = [
  "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200",
  "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1200",
  "https://images.unsplash.com/photo-1469334031218-e42a5046fc4f?w=1200",
];

const COMBO_PATTERN = /combo|set|coord|bundle/i;

export function isRealProductImageUrl(url) {
  if (!url || typeof url !== "string") return false;
  const u = url.toLowerCase();
  if (u.includes("picsum.photos") || u.includes("placeholder") || u.includes("placehold")) return false;
  return u.includes("cloudinary.com");
}

export function getHeroSlideshowImages() {
  const raw = import.meta.env.VITE_LANDING_HERO_COLLAGE_IMAGES || import.meta.env.LANDING_HERO_COLLAGE_IMAGES;
  if (!raw || typeof raw !== "string") return HERO_SLIDESHOW_DEFAULT;
  const urls = raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return urls.length ? urls : HERO_SLIDESHOW_DEFAULT;
}

export function buildHeroSlidesFromProducts(products) {
  const slides = [];
  for (const p of products || []) {
    const url = p.images?.[0]?.url || p.image;
    if (!isRealProductImageUrl(url)) continue;
    const productId = getProductDetailId(p);
    slides.push({
      url,
      productId,
      productName: p.productName,
      price: formatPrice(p),
      detailTo: productId ? `/product/${encodeURIComponent(productId)}` : null,
    });
  }
  return slides;
}

export function buildHeroFallbackSlides(urls = HERO_SLIDESHOW_DEFAULT) {
  return urls.map((url, i) => ({
    url,
    productId: null,
    productName: null,
    price: null,
    detailTo: null,
    key: `fallback-${i}`,
  }));
}

export function resolveHeroSlides(products) {
  const fromApi = buildHeroSlidesFromProducts(products);
  if (fromApi.length >= 3) return fromApi;

  const fallback = buildHeroFallbackSlides();
  const merged = [...fromApi];
  for (const slide of fallback) {
    if (merged.length >= 3) break;
    if (!merged.some((s) => s.url === slide.url)) merged.push(slide);
  }
  return merged.length ? merged : fallback;
}

export function makeStartStylingUrl(message = START_STYLING_MESSAGE) {
  return `https://wa.me/${WHATSAPP_BUSINESS_NUMBER}?text=${encodeURIComponent(message)}`;
}

export function makeGeneralWhatsappUrl(message = START_STYLING_MESSAGE) {
  return makeStartStylingUrl(message);
}

export function formatPriceAmount(amount) {
  const n = Number(amount);
  if (!Number.isFinite(n) || n < 0) return null;
  return `₹${n.toLocaleString("en-IN")}`;
}

export function formatPrice(product) {
  const amount = product?.discountPrice ?? product?.price;
  return formatPriceAmount(amount) ?? "—";
}

export function formatOriginalPrice(product) {
  return formatPriceAmount(product?.price);
}

export function getComboSavings(product) {
  if (!product?.discountPrice || !product?.price) return null;
  const save = Number(product.price) - Number(product.discountPrice);
  if (!Number.isFinite(save) || save <= 0) return null;
  return formatPriceAmount(save);
}

export function isComboProduct(product) {
  if (!product) return false;
  const parts = [
    product.category,
    product.productName,
    product.description,
    ...(Array.isArray(product.tags) ? product.tags : []),
  ]
    .filter(Boolean)
    .join(" ");
  return COMBO_PATTERN.test(parts);
}

export function getProductTypeLabel(product) {
  return isComboProduct(product) ? "COMBO SET" : "SINGLE";
}

export function parseComboIncludes(description) {
  if (!description) return [];
  const lines = String(description)
    .split(/\n+/)
    .map((l) => l.trim())
    .filter(Boolean);

  const items = lines
    .filter((l) => /^[✦•\-*–]/.test(l) || /^(\d+[\).]|included)/i.test(l))
    .map((l) => l.replace(/^[✦•\-*–]\s*/, "").trim());

  if (items.length) return items;

  const includesBlock = description.match(/includes?:?\s*([\s\S]*?)(?:\n\n|$)/i);
  if (includesBlock) {
    return includesBlock[1]
      .split(/\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 2);
  }

  return [];
}

export function getProductImages(product) {
  if (!product) return [];
  if (Array.isArray(product.gallery) && product.gallery.length) {
    return product.gallery.map((g) => (typeof g === "string" ? { url: g } : g)).filter((g) => g?.url);
  }
  if (Array.isArray(product.images) && product.images.length) {
    return product.images.filter((img) => img?.url);
  }
  if (product.image) return [{ url: product.image }];
  return [];
}

export function pickImage(product, seed) {
  const image = product?.images?.[0]?.url || product?.image;
  if (image && isRealProductImageUrl(image)) return image;
  if (image && !image.includes("picsum.photos")) return image;
  const safe = String(seed || product?.sku || product?.id || "wyldrift").replace(/[^a-z0-9]/gi, "-");
  return `https://picsum.photos/seed/${encodeURIComponent(safe)}/800/1067`;
}

export function pickSecondImage(product, seed) {
  const imgs = getProductImages(product);
  if (imgs[1]?.url) return imgs[1].url;
  const second = product?.images?.[1]?.url;
  if (second) return second;
  return pickImage(product, `${seed}-alt`);
}

export function getProductDetailId(product) {
  const raw = product?.id ?? product?._id;
  if (raw == null || raw === "") return "";
  return String(raw);
}

export function getProductDetailUrl(product) {
  const id = getProductDetailId(product);
  if (!id) return "";
  if (typeof window !== "undefined") {
    return `${window.location.origin}/product/${encodeURIComponent(id)}`;
  }
  return `/product/${encodeURIComponent(id)}`;
}

export function parseSizes(product) {
  if (Array.isArray(product?.sizes) && product.sizes.length) {
    return product.sizes.map((s) => String(s).trim()).filter(Boolean);
  }
  const desc = product?.description || "";
  const sizeLine = desc.match(/sizes?\s*[:=]\s*([^\n.]+)/i);
  if (sizeLine) {
    return sizeLine[1]
      .split(/[,/|·•]/)
      .map((s) => s.trim())
      .filter(Boolean);
  }
  const upperSizes = desc.match(/\b(XXS|XS|S|M|L|XL|XXL|2XL|3XL|\d{2})\b/gi);
  if (upperSizes?.length) return [...new Set(upperSizes.map((s) => s.toUpperCase()))];
  return [];
}

export function makeProductWhatsappUrl(product, { size, pageUrl } = {}) {
  const price = formatPrice(product);
  const url = pageUrl || getProductDetailUrl(product);
  const parts = [
    `Hi, I'm interested in ${product.productName} - ${price}.`,
    size ? `Size: ${size}.` : null,
    url ? `Product Link: ${url}` : null,
  ].filter(Boolean);
  return `https://wa.me/${WHATSAPP_BUSINESS_NUMBER}?text=${encodeURIComponent(parts.join(" "))}`;
}

export const CATEGORY_DISPLAY_ORDER = ["T-Shirts", "Jeans", "Shoes", "Shirts"];

export function getProductCategoryLabel(product) {
  const c = product?.category;
  if (c != null && String(c).trim()) return String(c).trim();
  return "Other";
}

export function orderedCategoriesFromProducts(productList) {
  const present = new Set((productList || []).map(getProductCategoryLabel));
  const out = [];
  for (const c of CATEGORY_DISPLAY_ORDER) {
    if (present.has(c)) out.push(c);
  }
  const extras = [...present]
    .filter((c) => !CATEGORY_DISPLAY_ORDER.includes(c))
    .filter((c) => c !== "Other")
    .sort((a, b) => a.localeCompare(b));
  const merged = [...out, ...extras];
  if (present.has("Other")) merged.push("Other");
  return merged;
}
