import { generateVariantSku } from "./sku.js";

export const VARIANT_SIZES = ["S", "M", "L", "XL", "XXL"];

export function newClientKey() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `key-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function emptyColorGroup() {
  return {
    clientKey: newClientKey(),
    color: "",
    enabledSizes: ["S", "M", "L", "XL"],
    stockBySize: { S: 0, M: 0, L: 0, XL: 0 },
    skuBySize: {},
    variantIdsBySize: {},
    existingImage: null,
    imageFile: null,
  };
}

/** Flat API/edit rows → matrix grouped by color. */
export function variantsToColorGroups(variantRows) {
  const groups = [];
  const indexByColor = new Map();

  for (const row of variantRows || []) {
    const colorLabel = String(row.color || "").trim();
    const colorKey = colorLabel.toLowerCase() || "__empty__";
    let group = indexByColor.get(colorKey);

    if (!group) {
      group = {
        clientKey: newClientKey(),
        color: colorLabel,
        enabledSizes: [],
        stockBySize: {},
        skuBySize: {},
        variantIdsBySize: {},
        existingImage: row.existingImage || null,
        imageFile: null,
      };
      indexByColor.set(colorKey, group);
      groups.push(group);
    }

    const size = VARIANT_SIZES.includes(row.size) ? row.size : "M";
    if (!group.enabledSizes.includes(size)) {
      group.enabledSizes.push(size);
    }
    group.stockBySize[size] = Number(row.stock) || 0;
    if (row.sku) group.skuBySize[size] = row.sku;
    if (row._id) group.variantIdsBySize[size] = row._id;
    if (!group.existingImage && row.existingImage) {
      group.existingImage = row.existingImage;
    }
  }

  for (const group of groups) {
    group.enabledSizes = sortSizes(group.enabledSizes);
  }

  return groups.length ? groups : [emptyColorGroup()];
}

/** Matrix → flat variant rows for API (one row per color × size). */
export function flattenColorGroups(colorGroups) {
  const variants = [];

  for (const group of colorGroups || []) {
    const color = String(group.color || "").trim();
    for (const size of sortSizes(group.enabledSizes || [])) {
      variants.push({
        clientKey: `${group.clientKey}-${size}`,
        _id: group.variantIdsBySize?.[size] || "",
        color,
        size,
        stock: Number(group.stockBySize?.[size]) || 0,
        sku: group.skuBySize?.[size] || "",
        existingImage: group.existingImage || null,
        imageFile: group.imageFile || null,
      });
    }
  }

  return variants;
}

export function sortSizes(sizes) {
  return [...new Set(sizes)].sort((a, b) => VARIANT_SIZES.indexOf(a) - VARIANT_SIZES.indexOf(b));
}

export function toggleColorSize(group, size) {
  const enabled = new Set(group.enabledSizes || []);
  const stockBySize = { ...(group.stockBySize || {}) };

  if (enabled.has(size)) {
    if (enabled.size <= 1) return group;
    enabled.delete(size);
    delete stockBySize[size];
  } else {
    enabled.add(size);
    stockBySize[size] = stockBySize[size] ?? 0;
  }

  return {
    ...group,
    enabledSizes: sortSizes([...enabled]),
    stockBySize,
  };
}

export function setColorStock(group, size, stock) {
  return {
    ...group,
    stockBySize: {
      ...(group.stockBySize || {}),
      [size]: stock,
    },
  };
}

export function applyStockToAllSizes(group, stock) {
  const value = Number(stock) || 0;
  const stockBySize = {};
  for (const size of group.enabledSizes || []) {
    stockBySize[size] = value;
  }
  return { ...group, stockBySize };
}

export function generateSkusForColorGroups(form, colorGroups) {
  const used = new Set();
  const nextGroups = colorGroups.map((group) => {
    const skuBySize = { ...(group.skuBySize || {}) };
    for (const size of group.enabledSizes || []) {
      skuBySize[size] = generateVariantSku(
        {
          category: form.category,
          productName: form.productName,
          color: group.color,
          size,
        },
        used
      );
    }
    return { ...group, skuBySize };
  });
  return nextGroups;
}

export function validateColorGroups(colorGroups) {
  if (!colorGroups?.length) {
    return "Add at least one color.";
  }

  const names = new Set();
  for (let i = 0; i < colorGroups.length; i += 1) {
    const group = colorGroups[i];
    const color = String(group.color || "").trim();
    if (!color) {
      return `Color ${i + 1}: enter a color name (e.g. Black).`;
    }
    const key = color.toLowerCase();
    if (names.has(key)) {
      return `Duplicate color "${color}". Use one block per color.`;
    }
    names.add(key);

    if (!group.enabledSizes?.length) {
      return `${color}: pick at least one size.`;
    }

    if (!group.existingImage && !group.imageFile) {
      return `${color}: upload an image for this color.`;
    }
  }

  const flat = flattenColorGroups(colorGroups);
  if (!flat.length) {
    return "Enable at least one size for your colors.";
  }

  const comboKeys = flat.map((v) => `${v.color.toLowerCase()}:${v.size}`);
  if (new Set(comboKeys).size !== comboKeys.length) {
    return "Duplicate color and size combination.";
  }

  const missingSku = flat.find((v) => !String(v.sku || "").trim());
  if (missingSku) {
    return `Enter or auto-generate SKUs (missing for ${missingSku.color} · ${missingSku.size}).`;
  }

  return "";
}

/** Load product from API into matrix editor state. */
export function productToColorGroups(product) {
  const rows = [];

  if (Array.isArray(product?.variants) && product.variants.length) {
    for (const variant of product.variants) {
      rows.push({
        _id: variant._id || "",
        stock: variant.stock ?? 0,
        sku: variant.sku ?? "",
        color: variant.color ?? "",
        size: VARIANT_SIZES.includes(variant.size) ? variant.size : "M",
        existingImage: variant.image || null,
      });
    }
  } else {
    const legacySize = Array.isArray(product?.sizes)
      ? product.sizes.find((s) => VARIANT_SIZES.includes(s))
      : null;
    rows.push({
      _id: "",
      stock: product?.stock ?? 0,
      sku: product?.sku ?? "",
      color: Array.isArray(product?.colors) ? product.colors[0] || "" : "",
      size: legacySize || "M",
      existingImage: product?.images?.[0] || null,
    });
  }

  return variantsToColorGroups(rows);
}
