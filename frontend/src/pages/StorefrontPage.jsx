import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import WyldriftLogo from "../components/WyldriftLogo.jsx";
import { resolveApiUrl } from "../lib/http.js";

const WHATSAPP_BUSINESS_NUMBER = "918219672237";

/**
 * Landing hero collage (large panel + two stacked). Always these URLs — not tied to /api/products.
 * Swap `src` values for your own assets under `public/` (e.g. `/hero/main.jpg`) when ready.
 */
const LANDING_HERO_COLLAGE_IMAGES = [
  {
    src: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=960&q=80",
    alt: "Featured footwear",
  },
  {
    src: "https://images.unsplash.com/photo-1719204718581-5c95889c8ec9?auto=format&fit=crop&w=800&q=80",
    alt: "WhatsApp chat on a phone",
  },
  {
    src: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=800&q=80",
    alt: "Boutique interior",
  },
];

function LandingHeroCollage({ images = LANDING_HERO_COLLAGE_IMAGES }) {
  const triple = [0, 1, 2].map((i) => images[i] || LANDING_HERO_COLLAGE_IMAGES[i]);
  return (
    <div className="store-hero-collage">
      <figure className="store-hero-collage-main">
        <img
          src={triple[0].src}
          alt={triple[0].alt || "Featured look"}
          width={640}
          height={800}
          decoding="async"
        />
      </figure>
      <div className="store-hero-collage-stack">
        <figure className="store-hero-collage-cell store-hero-collage-cell--shift">
          <img
            src={triple[1].src}
            alt={triple[1].alt || ""}
            width={400}
            height={480}
            loading="lazy"
            decoding="async"
          />
        </figure>
        <figure className="store-hero-collage-cell">
          <img
            src={triple[2].src}
            alt={triple[2].alt || ""}
            width={400}
            height={360}
            loading="lazy"
            decoding="async"
          />
        </figure>
      </div>
      <div className="store-hero-collage-orbit" aria-hidden="true" />
      <span className="store-hero-collage-badge">New season</span>
    </div>
  );
}

function makeGeneralWhatsappUrl(message = "Hello The Wyldrift! I'd like to know more about your products.") {
  return `https://wa.me/${WHATSAPP_BUSINESS_NUMBER}?text=${encodeURIComponent(message)}`;
}

function formatPrice(product) {
  const amount = product.discountPrice ?? product.price;
  const n = Number(amount);
  if (!Number.isFinite(n) || n < 0) return "—";
  return `₹ ${n.toLocaleString("en-IN")}.00`;
}

function pickImage(product, seed) {
  const image = product.images?.[0]?.url || product.image;
  if (image) return image;
  const safe = String(seed || product.sku || product.id || "wyldrift").replace(/[^a-z0-9]/gi, "-");
  return `https://picsum.photos/seed/${encodeURIComponent(safe)}/1000/900`;
}

/** Stable string for `/product/:id` (API may send `id` string or `_id` ObjectId). */
function getProductDetailId(product) {
  const raw = product?.id ?? product?._id;
  if (raw == null || raw === "") return "";
  return String(raw);
}

/** Matches admin product categories; used for stable section order on the storefront. */
const CATEGORY_DISPLAY_ORDER = ["T-Shirts", "Jeans", "Shoes", "Shirts"];

function getProductCategoryLabel(product) {
  const c = product?.category;
  if (c != null && String(c).trim()) return String(c).trim();
  return "Other";
}

function orderedCategoriesFromProducts(productList) {
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

function CategoryPickTile({ category, items, onPick }) {
  const preview = pickImage(items[0], `${category}-category-tile`);
  return (
    <button type="button" className="store-category-tile" onClick={() => onPick(category)}>
      <span className="store-category-tile-visual">
        <img src={preview} alt="" loading="lazy" decoding="async" />
      </span>
      <span className="store-category-tile-body">
        <span className="store-category-tile-name serif">{category}</span>
        <span className="store-category-tile-meta">
          {items.length} {items.length === 1 ? "item" : "items"}
        </span>
      </span>
    </button>
  );
}

function useReveal() {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) el.classList.add("in");
        });
      },
      { threshold: 0.12 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return ref;
}

function ProductShowcaseCard({ product }) {
  const image = pickImage(product, `${product.category}-${product.sku}`);
  const detailId = getProductDetailId(product);
  const detailTo = detailId ? `/product/${encodeURIComponent(detailId)}` : "";

  const hitContent = (
    <>
      <img src={image} alt={product.productName} loading="lazy" />

      <div className="product-overlay">
        <h3 className="product-title serif">{product.productName}</h3>
        <span className="price-pill">{formatPrice(product)}</span>
      </div>
      {product.category ? <span className="product-category-chip">{product.category}</span> : null}
    </>
  );

  return (
    <article className="product-card catalog-card">
      <div className="product-image-wrap">
        {detailTo ? (
          <Link to={detailTo} className="product-card-hit" aria-label={`View details for ${product.productName}`}>
            {hitContent}
          </Link>
        ) : (
          <div className="product-card-hit" role="img" aria-label={product.productName}>
            {hitContent}
          </div>
        )}
      </div>
    </article>
  );
}

export default function StorefrontPage() {
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [query, setQuery] = useState("");
  /** `null` = show category tiles only; a string = show products in that category. */
  const [pickedCategory, setPickedCategory] = useState(null);
  const [site, setSite] = useState({
    homeLatestTitle: "All products",
    homeCategoryKicker: "Shop",
    homeCategoryTitle: "By category",
    cartBadge: 0,
  });

  const heroRef = useReveal();
  const latestRef = useReveal();

  useEffect(() => {
    setProductsLoading(true);
    fetch(resolveApiUrl("/api/products?limit=100"))
      .then((r) => r.json())
      .then((d) => setProducts(d.products || []))
      .catch(() => setProducts([]))
      .finally(() => setProductsLoading(false));
  }, []);

  useEffect(() => {
    fetch(resolveApiUrl("/api/settings"))
      .then((r) => r.json())
      .then((data) => {
        if (data?.settings) {
          setSite((prev) => ({ ...prev, ...(data.settings || {}) }));
        }
      })
      .catch(() => {});
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) =>
      [p.productName, p.category, p.description, p.sku].join(" ").toLowerCase().includes(q)
    );
  }, [products, query]);

  const categoryOrder = useMemo(() => orderedCategoriesFromProducts(filtered), [filtered]);

  const itemsInPickedCategory = useMemo(() => {
    if (!pickedCategory) return [];
    return filtered.filter((p) => getProductCategoryLabel(p) === pickedCategory);
  }, [filtered, pickedCategory]);

  useEffect(() => {
    if (pickedCategory == null) return;
    if (!categoryOrder.includes(pickedCategory)) setPickedCategory(null);
  }, [pickedCategory, categoryOrder]);

  return (
    <div className="store-body store-theme-light">
      <header className="store-header">
        <a className="store-logo" href="#top" aria-label="The Wyldrift home">
          <WyldriftLogo className="logo-svg" size={30} tone="light" />
        </a>

        <div className="store-actions store-actions--minimal">
          <a
            className="round-action wa-header-btn"
            href={makeGeneralWhatsappUrl()}
            target="_blank"
            rel="noreferrer"
            aria-label="Chat on WhatsApp"
            title="WhatsApp"
          >
            <svg viewBox="0 0 32 32" aria-hidden="true" width="22" height="22">
              <path
                fill="currentColor"
                d="M16.02 3.2A12.7 12.7 0 0 0 5.1 22.38L3.5 28.8l6.56-1.54a12.72 12.72 0 1 0 5.96-24.06Zm0 22.9c-2 0-3.86-.58-5.44-1.58l-.42-.26-3.9.92.94-3.8-.28-.44A10.1 10.1 0 1 1 16.02 26.1Zm5.86-7.56c-.32-.16-1.9-.94-2.2-1.04-.3-.12-.52-.16-.74.16-.22.32-.84 1.04-1.04 1.26-.18.22-.38.24-.7.08-.32-.16-1.36-.5-2.58-1.6-.96-.86-1.6-1.9-1.8-2.22-.18-.32-.02-.5.14-.66.14-.14.32-.38.48-.56.16-.2.22-.32.32-.54.12-.22.06-.4-.02-.56-.08-.16-.74-1.78-1.02-2.44-.26-.64-.54-.56-.74-.56h-.64c-.22 0-.56.08-.86.4-.3.32-1.14 1.12-1.14 2.72s1.16 3.14 1.32 3.36c.16.22 2.28 3.48 5.52 4.88.78.34 1.38.54 1.84.68.78.24 1.48.2 2.04.12.62-.1 1.9-.78 2.16-1.52.26-.74.26-1.38.18-1.52-.08-.14-.3-.22-.62-.38Z"
              />
            </svg>
          </a>
          <Link className="round-action" to="/admin" aria-label="Admin login" title="Admin">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5Zm0 2c-4.42 0-8 2.24-8 5v1h16v-1c0-2.76-3.58-5-8-5Z" />
            </svg>
          </Link>
        </div>
        <span className="nav-gold-rule" aria-hidden="true" />
      </header>

      <main id="top">
        <section className="store-hero reveal in" aria-labelledby="hero-title">
          <div className="store-hero-inner">
            <p className="store-hero-eyebrow">New season · WhatsApp concierge</p>
            <h1 id="hero-title" className="store-hero-title serif">
              Style that speaks. <span className="store-hero-accent">Guided on WhatsApp.</span>
            </h1>
            <p className="store-hero-lede">
              Browse here, then open WhatsApp — our bot walks you through product info, price, how to buy, and delivery
              in one thread.
            </p>
            <div className="store-hero-actions">
              <a className="store-hero-btn-primary" href={makeGeneralWhatsappUrl()} target="_blank" rel="noreferrer">
                <svg viewBox="0 0 32 32" width="22" height="22" aria-hidden="true">
                  <path
                    fill="currentColor"
                    d="M16.02 3.2A12.7 12.7 0 0 0 5.1 22.38L3.5 28.8l6.56-1.54a12.72 12.72 0 1 0 5.96-24.06Zm0 22.9c-2 0-3.86-.58-5.44-1.58l-.42-.26-3.9.92.94-3.8-.28-.44A10.1 10.1 0 1 1 16.02 26.1Zm5.86-7.56c-.32-.16-1.9-.94-2.2-1.04-.3-.12-.52-.16-.74.16-.22.32-.84 1.04-1.04 1.26-.18.22-.38.24-.7.08-.32-.16-1.36-.5-2.58-1.6-.96-.86-1.6-1.9-1.8-2.22-.18-.32-.02-.5.14-.66.14-.14.32-.38.48-.56.16-.2.22-.32.32-.54.12-.22.06-.4-.02-.56-.08-.16-.74-1.78-1.02-2.44-.26-.64-.54-.56-.74-.56h-.64c-.22 0-.56.08-.86.4-.3.32-1.14 1.12-1.14 2.72s1.16 3.14 1.32 3.36c.16.22 2.28 3.48 5.52 4.88.78.34 1.38.54 1.84.68.78.24 1.48.2 2.04.12.62-.1 1.9-.78 2.16-1.52.26-.74.26-1.38.18-1.52-.08-.14-.3-.22-.62-.38Z"
                  />
                </svg>
                Start on WhatsApp
              </a>
              <a className="store-hero-btn-ghost" href="#products">
                View catalogue
              </a>
            </div>
            <ul className="store-hero-stats" aria-label="Store highlights">
              <li>
                <strong>WhatsApp</strong>
                <span>Bot handles the chat</span>
              </li>
              <li>
                <strong>Curated</strong>
                <span>Limited runs</span>
              </li>
              <li>
                <strong>India</strong>
                <span>Trusted delivery</span>
              </li>
            </ul>
          </div>
          <div className="store-hero-visual" aria-hidden="true">
            <LandingHeroCollage />
          </div>
        </section>

        <section className="search-section reveal in" aria-label="Search products" ref={heroRef}>
          <form
            className="store-search"
            onSubmit={(e) => {
              e.preventDefault();
              document.querySelector("#products")?.scrollIntoView({ behavior: "smooth" });
            }}
          >
            <input
              type="search"
              placeholder="Search for Store products"
              aria-label="Search products"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <button type="submit" aria-label="Search">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="m21 19.6-5.2-5.2a7.5 7.5 0 1 0-1.4 1.4l5.2 5.2L21 19.6ZM5 10a5 5 0 1 1 5 5 5 5 0 0 1-5-5Z" />
              </svg>
            </button>
          </form>
        </section>

        <section id="products" className="products-section reveal" aria-labelledby="products-title" ref={latestRef}>
          {pickedCategory ? (
            <div className="store-category-toolbar">
              <button type="button" className="store-category-back" onClick={() => setPickedCategory(null)}>
                ← All categories
              </button>
            </div>
          ) : null}

          <div className="section-title gold-left">
            <div className="section-title-left">
              <span className="section-kicker">
                {pickedCategory ? "Category" : site.homeCategoryKicker || "Shop"}
              </span>
              <h2 id="products-title" className="serif">
                {pickedCategory || site.homeCategoryTitle || "Shop by category"}
              </h2>
            </div>
            {!productsLoading && filtered.length > 0 ? (
              <span className="store-product-count">
                {pickedCategory
                  ? `${itemsInPickedCategory.length} ${itemsInPickedCategory.length === 1 ? "item" : "items"}`
                  : `${categoryOrder.length} ${categoryOrder.length === 1 ? "category" : "categories"}`}
              </span>
            ) : null}
          </div>

          {productsLoading ? (
            <div className="store-products-loading" aria-busy="true" aria-live="polite">
              <div
                className={
                  pickedCategory
                    ? "store-skeleton-grid store-skeleton-grid--catalog"
                    : "store-skeleton-grid store-skeleton-grid--categories"
                }
              >
                {Array.from({ length: pickedCategory ? 8 : 6 }).map((_, i) => (
                  <div key={i} className="store-skeleton-card" />
                ))}
              </div>
            </div>
          ) : null}

          {!productsLoading && products.length === 0 ? (
            <div className="store-empty-panel">
              <p className="store-empty-title serif">Catalogue is updating</p>
              <p className="store-empty-text">Tell us what you are looking for — we will share photos and availability on WhatsApp.</p>
              <a className="store-hero-btn-primary" href={makeGeneralWhatsappUrl()} target="_blank" rel="noreferrer">
                Message us
              </a>
            </div>
          ) : null}

          {!productsLoading && products.length > 0 && filtered.length === 0 ? (
            <p className="store-no-results">No products match your search. Try a different keyword.</p>
          ) : null}

          {!productsLoading && filtered.length > 0 && !pickedCategory ? (
            <div className="store-category-pick-grid" role="list">
              {categoryOrder.map((cat) => {
                const items = filtered.filter((p) => getProductCategoryLabel(p) === cat);
                if (!items.length) return null;
                return (
                  <div key={cat} className="store-category-tile-wrap" role="listitem">
                    <CategoryPickTile category={cat} items={items} onPick={setPickedCategory} />
                  </div>
                );
              })}
            </div>
          ) : null}

          {!productsLoading && pickedCategory && itemsInPickedCategory.length > 0 ? (
            <div className="store-all-products-grid stagger in">
              {itemsInPickedCategory.map((p) => (
                <ProductShowcaseCard key={p.id || p._id} product={p} />
              ))}
            </div>
          ) : null}

          {!productsLoading && pickedCategory && itemsInPickedCategory.length === 0 ? (
            <p className="store-no-results">Nothing in this category matches your search.</p>
          ) : null}
        </section>
      </main>

      <a
        className="whatsapp-global-fab"
        href={makeGeneralWhatsappUrl()}
        target="_blank"
        rel="noreferrer"
        aria-label="Open WhatsApp to chat with The Wyldrift"
      >
        <svg viewBox="0 0 32 32" aria-hidden="true" width="30" height="30">
          <path
            fill="currentColor"
            d="M16.02 3.2A12.7 12.7 0 0 0 5.1 22.38L3.5 28.8l6.56-1.54a12.72 12.72 0 1 0 5.96-24.06Zm0 22.9c-2 0-3.86-.58-5.44-1.58l-.42-.26-3.9.92.94-3.8-.28-.44A10.1 10.1 0 1 1 16.02 26.1Zm5.86-7.56c-.32-.16-1.9-.94-2.2-1.04-.3-.12-.52-.16-.74.16-.22.32-.84 1.04-1.04 1.26-.18.22-.38.24-.7.08-.32-.16-1.36-.5-2.58-1.6-.96-.86-1.6-1.9-1.8-2.22-.18-.32-.02-.5.14-.66.14-.14.32-.38.48-.56.16-.2.22-.32.32-.54.12-.22.06-.4-.02-.56-.08-.16-.74-1.78-1.02-2.44-.26-.64-.54-.56-.74-.56h-.64c-.22 0-.56.08-.86.4-.3.32-1.14 1.12-1.14 2.72s1.16 3.14 1.32 3.36c.16.22 2.28 3.48 5.52 4.88.78.34 1.38.54 1.84.68.78.24 1.48.2 2.04.12.62-.1 1.9-.78 2.16-1.52.26-.74.26-1.38.18-1.52-.08-.14-.3-.22-.62-.38Z"
          />
        </svg>
      </a>

      <footer className="site-footer site-footer--branded">
        <a className="site-footer-logo" href="#top" aria-label="The Wyldrift home">
          <WyldriftLogo className="logo-svg logo-svg--footer" size={34} tone="light" />
        </a>
        <p className="site-footer-copy">© 2026 The Wyldrift. All rights reserved.</p>
      </footer>
    </div>
  );
}

