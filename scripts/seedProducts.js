require("dotenv").config();

const mongoose = require("mongoose");
const connectDb = require("../config/db");
const Product = require("../models/Product");

const CATEGORIES = [
  { name: "T-Shirts", skuPrefix: "TEE" },
  { name: "Jeans", skuPrefix: "JEA" },
  { name: "Shoes", skuPrefix: "SHO" },
  { name: "Accessories", skuPrefix: "ACC" },
];

function money(min, max) {
  return Math.round(min + Math.random() * (max - min));
}

function pick(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function uniqueSku(prefix, i) {
  const stamp = new Date().toISOString().slice(2, 10).replace(/-/g, "");
  return `TW-${prefix}-${stamp}-${String(i).padStart(3, "0")}`;
}

function makeImages(category, i) {
  // Cloudinary image schema requires {url, publicId}. For dummy data we store stable placeholders.
  const safeCategory = category.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  return [
    {
      url: `https://picsum.photos/seed/thewyldrift-${safeCategory}-${i}/900/700`,
      publicId: `seed/thewyldrift/${safeCategory}/${i}`,
    },
  ];
}

function buildProduct(category, idx, globalIdx) {
  const drops = ["DROP", "ARCHIVE", "CORE", "LIMITED", "STUDIO", "NIGHT"];
  const fits = ["Oversized", "Relaxed", "Straight", "Slim", "Wide", "Classic"];
  const materials = ["Cotton", "Denim", "Canvas", "Leather", "Mesh", "Twill"];
  const colorways = ["Black", "Cream", "Charcoal", "Stone", "Olive", "Midnight"];

  const fit = pick(fits);
  const mat = pick(materials);
  const color = pick(colorways);
  const drop = pick(drops);

  const basePrice = category.name === "Shoes" ? money(2499, 7999) : money(899, 3999);
  const discounted = Math.random() < 0.55 ? Math.max(199, basePrice - money(100, 900)) : null;

  return {
    productName: `${drop} ${fit} ${category.name.slice(0, -1)} — ${color}`,
    description: `Premium ${mat} build. ${fit} fit with clean finishing, designed for daily rotation. Gen‑Z streetwear vibe with luxury black aesthetic.`,
    price: basePrice,
    discountPrice: discounted,
    category: category.name,
    stock: money(0, 25),
    sku: uniqueSku(category.skuPrefix, idx),
    sizes:
      category.name === "Shoes"
        ? ["6", "7", "8", "9", "10"]
        : ["S", "M", "L", "XL"],
    colors: [color],
    tags: ["streetwear", "premium", "drop", category.name.toLowerCase()],
    featured: globalIdx % 7 === 0,
    active: true,
    images: makeImages(category.name, globalIdx),
  };
}

async function seedProducts() {
  const PER_CATEGORY = Number(process.env.SEED_PRODUCTS_PER_CATEGORY || 10);

  await connectDb({ throwOnError: true });

  const docs = [];
  let globalIdx = 1;
  for (const cat of CATEGORIES) {
    for (let i = 1; i <= PER_CATEGORY; i++) {
      docs.push(buildProduct(cat, i, globalIdx));
      globalIdx++;
    }
  }

  // Insert without deleting existing data. Skips duplicates by SKU if already seeded.
  const existingSkus = new Set(
    (
      await Product.find(
        { sku: { $in: docs.map((d) => d.sku) } },
        { sku: 1, _id: 0 }
      ).lean()
    ).map((d) => d.sku)
  );

  const toInsert = docs.filter((d) => !existingSkus.has(d.sku));
  if (!toInsert.length) {
    console.log("No new products to seed (already present).");
  } else {
    await Product.insertMany(toInsert, { ordered: false });
    console.log(`Seeded ${toInsert.length} products.`);
  }

  const counts = await Product.aggregate([
    { $group: { _id: "$category", count: { $sum: 1 } } },
    { $sort: { _id: 1 } },
  ]);
  console.log("Counts by category:", counts);

  await mongoose.disconnect();
}

seedProducts().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect();
  process.exit(1);
});

