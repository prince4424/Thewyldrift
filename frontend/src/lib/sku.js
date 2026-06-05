/** Category codes for SKUs — keep in sync with backend/scripts/seedProducts.js */
export const CATEGORY_SKU_PREFIX = {
  "T-Shirts": "TEE",
  Shirts: "SRT",
  Jeans: "JEA",
  Trousers: "TRS",
  Shorts: "SHT",
  Jackets: "JKT",
  Hoodies: "HOD",
  Shoes: "SHO",
  Socks: "SOC",
  Underwear: "UND",
  Sleepwear: "SLP",
  Loungewear: "LNG",
  Activewear: "ACT",
  Dresses: "DRS",
  Accessories: "ACC",
};

function slugPart(value, maxLen = 4) {
  const cleaned = String(value || "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "");
  return (cleaned || "X").slice(0, maxLen);
}

/**
 * Build a Wyldrift SKU: TW-{CAT}-{NAME}-{COLOR}-{SIZE}
 * Example: TW-TEE-NIGH-BLK-M
 */
export function generateVariantSku({ category, productName, color, size }, usedSkus = new Set()) {
  const cat = CATEGORY_SKU_PREFIX[category] || slugPart(category, 3);
  const name = slugPart(productName, 4);
  const col = slugPart(color || "DEF", 3);
  const sz = slugPart(size || "M", 3);

  let base = `TW-${cat}-${name}-${col}-${sz}`;
  let sku = base;
  let suffix = 2;

  while (usedSkus.has(sku)) {
    sku = `${base}${suffix}`;
    suffix += 1;
  }

  usedSkus.add(sku);
  return sku;
}

export function generateSkusForVariants(form, variants) {
  const used = new Set();
  return variants.map((variant) => ({
    ...variant,
    sku: generateVariantSku(
      {
        category: form.category,
        productName: form.productName,
        color: variant.color,
        size: variant.size,
      },
      used
    ),
  }));
}
