import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import WyldriftLogo from "../components/WyldriftLogo.jsx";

const WHATSAPP_BUSINESS_NUMBER = "918219672237";
const categories = ["T-Shirts", "Jeans", "Shoes", "Accessories"];

function makeWhatsappUrl(product) {
  const message = [
    "Hello The Wyldrift, I want to order this product:",
    `Product: ${product.productName}`,
    `Category: ${product.category}`,
    `Price: ${formatPrice(product)}`,
    `SKU: ${product.sku}`,
    `Details: ${product.description}`,
  ].join("\n");
  return `https://wa.me/${WHATSAPP_BUSINESS_NUMBER}?text=${encodeURIComponent(message)}`;
}

function formatPrice(product) {
  const amount = product.discountPrice || product.price;
  return `₹ ${Number(amount).toLocaleString("en-IN")}.00`;
}

function pickImage(product, seed) {
  const image = product.images?.[0]?.url || product.image;
  if (image) return image;
  const safe = String(seed || product.sku || product.id || "wyldrift").replace(/[^a-z0-9]/gi, "-");
  return `https://picsum.photos/seed/${encodeURIComponent(safe)}/1000/900`;
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

function BentoCard({ product, variantClass, onQuickAdd }) {
  const isSoldOut = Number(product.stock) <= 0;
  const image = pickImage(product, `${product.category}-${product.sku}`);
  return (
    <article className={`product-card ${variantClass}`}>
      <div className="product-image-wrap">
        <img src={image} alt={product.productName} loading="lazy" />

        <div className="product-overlay">
          <h3 className="product-title serif">{product.productName}</h3>
          <span className="price-pill">{formatPrice(product)}</span>
        </div>

        <div className="quick-add">
          <button type="button" onClick={onQuickAdd} disabled={isSoldOut}>
            {isSoldOut ? "Sold out" : "Quick Add"}
          </button>
        </div>

        <a
          className={`whatsapp-fab ${isSoldOut ? "disabled" : ""}`}
          href={isSoldOut ? "#" : makeWhatsappUrl(product)}
          target="_blank"
          rel="noreferrer"
          aria-label={`Order ${product.productName} on WhatsApp`}
          onClick={(e) => {
            if (isSoldOut) e.preventDefault();
          }}
        >
          <svg viewBox="0 0 32 32" aria-hidden="true" focusable="false">
            <path
              fill="currentColor"
              d="M16.02 3.2A12.7 12.7 0 0 0 5.1 22.38L3.5 28.8l6.56-1.54a12.72 12.72 0 1 0 5.96-24.06Zm0 22.9c-2 0-3.86-.58-5.44-1.58l-.42-.26-3.9.92.94-3.8-.28-.44A10.1 10.1 0 1 1 16.02 26.1Zm5.86-7.56c-.32-.16-1.9-.94-2.2-1.04-.3-.12-.52-.16-.74.16-.22.32-.84 1.04-1.04 1.26-.18.22-.38.24-.7.08-.32-.16-1.36-.5-2.58-1.6-.96-.86-1.6-1.9-1.8-2.22-.18-.32-.02-.5.14-.66.14-.14.32-.38.48-.56.16-.2.22-.32.32-.54.12-.22.06-.4-.02-.56-.08-.16-.74-1.78-1.02-2.44-.26-.64-.54-.56-.74-.56h-.64c-.22 0-.56.08-.86.4-.3.32-1.14 1.12-1.14 2.72s1.16 3.14 1.32 3.36c.16.22 2.28 3.48 5.52 4.88.78.34 1.38.54 1.84.68.78.24 1.48.2 2.04.12.62-.1 1.9-.78 2.16-1.52.26-.74.26-1.38.18-1.52-.08-.14-.3-.22-.62-.38Z"
            />
          </svg>
        </a>
      </div>
    </article>
  );
}

export default function StorefrontPage() {
  const [products, setProducts] = useState([]);
  const [query, setQuery] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [cartCount, setCartCount] = useState(44);
  const [site, setSite] = useState({
    homeCategoryTitle: "By Category",
    homeCategoryKicker: "Shop",
    homeLatestTitle: "Latest Products",
    homeFeaturedCategory: "T-Shirts",
    cartBadge: 44,
    footerLinks: [
      { label: "About", href: "#top" },
      { label: "Contact", href: "#top" },
      { label: "Instagram", href: "#top" },
      { label: "Returns", href: "#top" },
    ],
  });

  const heroRef = useReveal();
  const categoryRef = useReveal();
  const latestRef = useReveal();

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === "Escape") setMenuOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    fetch("/api/products?active=true&limit=100")
      .then((r) => r.json())
      .then((d) => setProducts(d.products || []))
      .catch(() => setProducts([]));
  }, []);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        if (data?.settings) {
          setSite((prev) => ({ ...prev, ...data.settings }));
          if (typeof data.settings.cartBadge === "number") setCartCount(data.settings.cartBadge);
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

  const byCategory = useMemo(() => {
    const map = new Map();
    categories.forEach((c) => map.set(c, []));
    filtered.forEach((p) => {
      if (!map.has(p.category)) map.set(p.category, []);
      map.get(p.category).push(p);
    });
    return map;
  }, [filtered]);

  function sectionId(category) {
    return category.toLowerCase().replace(/[^a-z]/g, "");
  }

  function renderBento(category) {
    const list = (byCategory.get(category) || []).slice(0, 4);
    const id = sectionId(category);
    return (
      <section key={category} className="product-group" id={id} aria-label={category}>
        <div className="section-title">
          <div className="section-title-left gold-left">
            <h2 className="serif">{site.homeLatestTitle || "Latest Products"}</h2>
            <span className="section-kicker">{category}</span>
          </div>
          <a className="browse-link" href={`#${id}`}>
            Browse All →
          </a>
        </div>

        <div className={`bento-grid ${list.length ? "stagger in" : ""}`}>
          {list[0] ? (
            <BentoCard product={list[0]} variantClass="bento-hero" onQuickAdd={() => setCartCount((c) => c + 1)} />
          ) : null}
          {list[1] ? (
            <BentoCard product={list[1]} variantClass="bento-a" onQuickAdd={() => setCartCount((c) => c + 1)} />
          ) : null}
          {list[2] ? (
            <BentoCard product={list[2]} variantClass="bento-b" onQuickAdd={() => setCartCount((c) => c + 1)} />
          ) : null}
          {list[3] ? (
            <BentoCard product={list[3]} variantClass="bento-wide" onQuickAdd={() => setCartCount((c) => c + 1)} />
          ) : (
            <div className="bento-wide empty-message">New {category.toLowerCase()} coming soon.</div>
          )}
        </div>
      </section>
    );
  }

  return (
    <div className={`store-body ${menuOpen ? "menu-open" : ""}`}>
      <header className="store-header">
        <a className="store-logo" href="#top" aria-label="The Wyldrift home">
          <WyldriftLogo className="logo-svg" size={30} />
        </a>

        <div className="store-actions">
          <a className="round-action cart-action" href="#products" aria-label="Cart">
            <span className="cart-count">{cartCount}</span>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M7 8V7a5 5 0 0 1 10 0v1h2v13H5V8h2Zm2 0h6V7a3 3 0 0 0-6 0v1Z" />
            </svg>
          </a>
          <Link className="round-action" to="/admin" aria-label="Admin">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5Zm0 2c-4.42 0-8 2.24-8 5v1h16v-1c0-2.76-3.58-5-8-5Z" />
            </svg>
          </Link>
          <button
            className="icon-ghost"
            type="button"
            aria-controls="mobile-nav"
            aria-expanded={menuOpen ? "true" : "false"}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            onClick={() => setMenuOpen((v) => !v)}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" width="22" height="22">
              <path
                fill="currentColor"
                d="M4 6.5h16v2H4v-2Zm0 7h16v2H4v-2Zm0 7h16v2H4v-2Z"
              />
            </svg>
          </button>
        </div>
        <span className="nav-gold-rule" aria-hidden="true" />
      </header>

      <div
        className={`mobile-nav-overlay ${menuOpen ? "open" : ""}`}
        role="presentation"
        aria-hidden={menuOpen ? "false" : "true"}
        onClick={() => setMenuOpen(false)}
      />
      <nav
        className={`mobile-nav ${menuOpen ? "open" : ""}`}
        id="mobile-nav"
        aria-label="Mobile navigation"
        aria-hidden={menuOpen ? "false" : "true"}
      >
        <div className="mobile-nav-header">
          <span className="mobile-nav-title">Menu</span>
          <button className="mobile-nav-close" type="button" onClick={() => setMenuOpen(false)}>
            Close
          </button>
        </div>
        {categories.map((c) => (
          <a key={c} href={`#${sectionId(c)}`} onClick={() => setMenuOpen(false)}>
            {c}
          </a>
        ))}
        <a href="#products" onClick={() => setMenuOpen(false)}>
          All products
        </a>
        <Link to="/admin" onClick={() => setMenuOpen(false)}>
          Admin
        </Link>
      </nav>

      <main id="top">
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

        <section className="category-band reveal" aria-labelledby="category-title" ref={categoryRef}>
          <div className="section-title gold-left">
            <div className="section-title-left">
              <span className="section-kicker">{site.homeCategoryKicker || "Shop"}</span>
              <h2 id="category-title">{site.homeCategoryTitle || "By Category"}</h2>
            </div>
          </div>
          <div className="category-grid">
            {categories.map((c) => (
              <a key={c} className="category-tile" href={`#${sectionId(c)}`}>
                <span>{c}</span>
              </a>
            ))}
          </div>
        </section>

        <section id="products" className="products-section reveal" aria-labelledby="products-title" ref={latestRef}>
          <h2 id="products-title" className="sr-only">
            Latest Products
          </h2>

          {[site.homeFeaturedCategory || "T-Shirts", ...categories.filter((c) => c !== (site.homeFeaturedCategory || "T-Shirts"))].map(
            (category) => renderBento(category)
          )}
        </section>
      </main>

      <footer className="site-footer">
        <p>© 2026 The Wyldrift. All rights reserved.</p>
        <div className="footer-links">
          {(site.footerLinks || []).map((l) => (
            <a key={l.label + l.href} href={l.href}>
              {l.label}
            </a>
          ))}
        </div>
      </footer>
    </div>
  );
}

