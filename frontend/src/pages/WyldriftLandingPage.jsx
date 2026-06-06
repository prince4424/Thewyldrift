import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  Copy,
  Droplet,
  Leaf,
  MessageCircle,
  Moon,
  Printer,
  Share2,
  Shirt,
  ShoppingBag,
  Sun,
  Zap,
} from "lucide-react";
import { WHATSAPP_BUSINESS_NUMBER } from "../lib/storefront.js";
import "../wyldrift-landing.css";

const THEME_KEY = "wyldrift-theme";
const DROP_KEY = "wyldrift-drop-at";
const SIZES = ["XS", "S", "M", "L", "XL", "XXL"];

const PRODUCTS = [
  {
    id: 1,
    name: "FLOWERS ACID WASH",
    price: 791,
    originalPrice: 999,
    image:
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&h=800&fit=crop&q=80",
    colors: ["#1a3a2a", "#2d2d44", "#4a3728", "#2c3e50", "#5c4033", "#3d2817", "#1a2a3a", "#3a3a3a", "#4a4a4a"],
    colorNames: ["Forest", "Indigo", "Earth", "Navy", "Brown", "Espresso", "Midnight", "Charcoal", "Slate"],
    description: "Premium acid wash oversized tee with botanical print",
    features: ["Acid wash finish", "Soft cotton blend", "Oversized unisex fit"],
    stock: 3,
  },
  {
    id: 2,
    name: "BURGUNDY + GREY COMBO",
    price: 1299,
    originalPrice: 1598,
    image:
      "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800&h=800&fit=crop&q=80",
    colors: ["#722f37", "#9ca3af"],
    colorNames: ["Burgundy", "Grey"],
    description: "Burgundy acid-wash tee + light grey North Face utility pants",
    features: ["Premium acid wash tee", "Utility cargo pants", "Tricity same-day combo"],
    stock: 5,
  },
  {
    id: 3,
    name: "FLOWERS — MIDNIGHT",
    price: 791,
    image:
      "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=600&h=600&fit=crop&q=80",
    colors: ["#1a2a3a", "#2d2d44", "#3a3a3a"],
    colorNames: ["Midnight", "Indigo", "Charcoal"],
    description: "Dark wash botanical oversized tee",
    features: ["Acid wash", "Oversized fit", "Front print"],
  },
  {
    id: 4,
    name: "FLOWERS — FOREST",
    price: 791,
    image:
      "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=600&h=600&fit=crop&q=80",
    colors: ["#1a3a2a", "#2c3e50", "#4a3728"],
    colorNames: ["Forest", "Navy", "Earth"],
    description: "Earthy green acid wash drop",
    features: ["Soft cotton", "Unisex", "Limited run"],
  },
  {
    id: 5,
    name: "FLOWERS — EARTH TONE",
    price: 791,
    image:
      "https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=600&h=600&fit=crop&q=80",
    colors: ["#4a3728", "#5c4033", "#3d2817"],
    colorNames: ["Earth", "Brown", "Espresso"],
    description: "Warm neutral acid wash essential",
    features: ["Premium wash", "Breathable", "Street fit"],
  },
];

const FEATURES = [
  { icon: Droplet, label: "PREMIUM ACID WASH" },
  { icon: Shirt, label: "SOFT & BREATHABLE" },
  { icon: Leaf, label: "OVERSIZED FIT" },
  { icon: Printer, label: "HIGH QUALITY PRINT" },
];

function waUrl(productName, extras = "") {
  const text = `Hi! I'm interested in ${productName}${extras ? ` — ${extras}` : ""}`;
  return `https://wa.me/${WHATSAPP_BUSINESS_NUMBER}?text=${encodeURIComponent(text)}`;
}

function formatInr(n) {
  return `₹${Number(n).toLocaleString("en-IN")}`;
}

function useTheme() {
  const [theme, setTheme] = useState(() => {
    if (typeof window === "undefined") return "dark";
    return localStorage.getItem(THEME_KEY) === "light" ? "light" : "dark";
  });
  const [spinning, setSpinning] = useState(false);

  const toggle = useCallback(() => {
    setSpinning(true);
    setTheme((t) => {
      const next = t === "dark" ? "light" : "dark";
      localStorage.setItem(THEME_KEY, next);
      return next;
    });
    window.setTimeout(() => setSpinning(false), 320);
  }, []);

  return { theme, toggle, spinning };
}

function useCountdown() {
  const [target] = useState(() => {
    if (typeof window === "undefined") return Date.now() + 48 * 3600000;
    const stored = Number(localStorage.getItem(DROP_KEY));
    if (stored > Date.now()) return stored;
    const drop = Date.now() + 48 * 3600000;
    localStorage.setItem(DROP_KEY, String(drop));
    return drop;
  });

  const [now, setNow] = useState(Date.now());
  const prev = useRef({ d: 0, h: 0, m: 0, s: 0 });
  const [pop, setPop] = useState({ d: false, h: false, m: false, s: false });

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const remaining = Math.max(0, target - now);
  const days = Math.floor(remaining / 86400000);
  const hours = Math.floor((remaining % 86400000) / 3600000);
  const minutes = Math.floor((remaining % 3600000) / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);

  useEffect(() => {
    const next = { d: days, h: hours, m: minutes, s: seconds };
    const pops = {};
    for (const k of ["d", "h", "m", "s"]) {
      pops[k] = prev.current[k] !== next[k];
    }
    setPop(pops);
    prev.current = next;
  }, [days, hours, minutes, seconds]);

  return { days, hours, minutes, seconds, pop };
}

function CountdownUnit({ label, value, animate }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <span
        className={`min-w-[4.5rem] rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] px-4 py-3 text-center font-bold tabular-nums text-[var(--accent)] sm:min-w-[5.5rem] sm:text-4xl ${animate ? "wyld-count-pop" : ""}`}
      >
        {String(value).padStart(2, "0")}
      </span>
      <span className="text-xs uppercase tracking-[0.2em] text-[var(--text-secondary)]">{label}</span>
    </div>
  );
}

function ProductShowcase({
  product,
  badge,
  showStock = true,
  delayClass = "",
  combo = false,
}) {
  const [colorIdx, setColorIdx] = useState(0);
  const [size, setSize] = useState("M");
  const selectedColor = product.colorNames?.[colorIdx] || product.colors[colorIdx];

  const extras = `Colour: ${selectedColor}, Size: ${size}`;

  return (
    <section
      className={`wyld-animate-slide-up grid gap-8 lg:grid-cols-2 lg:items-center ${delayClass}`}
      aria-labelledby={`product-${product.id}-title`}
    >
      <div className="relative aspect-square overflow-hidden rounded-xl shadow-2xl shadow-[var(--shadow)]">
        <img
          src={product.image}
          alt={product.name}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover transition-transform duration-500 hover:scale-[1.03]"
        />
        {combo ? (
          <span className="absolute left-4 top-4 rounded-full bg-[var(--accent)] px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[#0a0a0a]">
            Combo Deal
          </span>
        ) : null}
      </div>

      <div className="rounded-xl border border-[var(--border)] bg-[var(--glass)] p-6 backdrop-blur-xl sm:p-8">
        <span className="text-xs font-semibold uppercase tracking-[0.25em] text-[var(--accent)]">{badge}</span>
        <h2 id={`product-${product.id}-title`} className="mt-3 text-2xl font-bold sm:text-[32px]">
          {product.name}
        </h2>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">{product.description}</p>

        <div className="mt-5 flex flex-wrap items-end gap-3">
          <p className="text-3xl font-bold text-[var(--accent)] sm:text-[36px]">{formatInr(product.price)}</p>
          {product.originalPrice ? (
            <>
              <p className="pb-1 text-lg text-[var(--text-secondary)] line-through">
                {formatInr(product.originalPrice)}
              </p>
              <p className="pb-1 text-sm font-semibold text-[var(--accent)]">
                Save {formatInr(product.originalPrice - product.price)}
              </p>
            </>
          ) : null}
        </div>

        {showStock && product.stock ? (
          <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-orange-400">
            Only {product.stock} left
          </p>
        ) : null}

        <ul className="mt-6 space-y-2">
          {product.features.map((f) => (
            <li key={f} className="flex items-center gap-2 text-[13px] text-[var(--text-secondary)]">
              <Zap className="h-4 w-4 shrink-0 text-[var(--accent)]" aria-hidden="true" />
              {f}
            </li>
          ))}
        </ul>

        <div className="mt-6">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-[var(--text-secondary)]">Colour</p>
          <div className="flex flex-wrap gap-3" role="listbox" aria-label="Select colour">
            {product.colors.map((hex, i) => (
              <button
                key={hex}
                type="button"
                role="option"
                aria-selected={colorIdx === i}
                aria-label={product.colorNames?.[i] || `Colour ${i + 1}`}
                onClick={() => setColorIdx(i)}
                className={`h-10 w-10 rounded-full border-2 transition-transform hover:scale-[1.15] ${
                  colorIdx === i ? "border-[var(--accent)] ring-2 ring-[var(--accent)] ring-offset-2 ring-offset-[var(--bg-primary)]" : "border-[var(--border)]"
                }`}
                style={{ backgroundColor: hex }}
              />
            ))}
          </div>
        </div>

        <div className="mt-6">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-[var(--text-secondary)]">Size</p>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Select size">
            {SIZES.map((s) => (
              <button
                key={s}
                type="button"
                aria-pressed={size === s}
                onClick={() => setSize(s)}
                className={`min-h-[44px] min-w-[44px] rounded-lg border px-3 text-sm font-semibold transition-all hover:-translate-y-0.5 ${
                  size === s
                    ? "border-[var(--accent)] bg-[var(--accent)] text-[#0a0a0a]"
                    : "border-[var(--border)] text-[var(--text-primary)] hover:border-[var(--accent)]"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <a
            href={waUrl(product.name, extras)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-lg bg-[var(--accent)] px-6 text-sm font-bold uppercase tracking-wider text-[#0a0a0a] shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-xl"
          >
            <ShoppingBag className="h-4 w-4" aria-hidden="true" />
            Buy Now
          </a>
          <a
            href={waUrl(product.name, extras)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-lg border-2 border-[var(--accent)] px-6 text-sm font-bold uppercase tracking-wider text-[var(--accent)] transition-all hover:-translate-y-0.5 hover:bg-[var(--accent)] hover:text-[#0a0a0a]"
          >
            <MessageCircle className="h-4 w-4" aria-hidden="true" />
            WhatsApp
          </a>
        </div>

        <p className="wyld-animate-pulse-badge mt-6 inline-flex rounded-full border border-[var(--accent)] px-4 py-2 text-xs font-semibold uppercase tracking-wider text-[var(--accent)]">
          ⚡ 60-MIN LOCAL DELIVERY • TRICITY
        </p>
      </div>
    </section>
  );
}

function InstagramIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export default function WyldriftLandingPage() {
  const { theme, toggle, spinning } = useTheme();
  const { days, hours, minutes, seconds, pop } = useCountdown();
  const [email, setEmail] = useState("");
  const [copied, setCopied] = useState(false);
  const hero = PRODUCTS[0];
  const combo = PRODUCTS[1];

  const copyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }, []);

  const carouselItems = useMemo(() => PRODUCTS, []);

  return (
    <div
      className="wyldrift-landing min-h-screen bg-[var(--bg-primary)] font-sans text-[var(--text-primary)] antialiased"
      data-theme={theme}
    >
      <header className="fixed inset-x-0 top-0 z-[1000] border-b border-[var(--border)] bg-[var(--bg-primary)]/80 backdrop-blur-[10px]">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link
            to="/"
            className="text-lg font-bold tracking-[0.2em] text-[var(--accent)] sm:text-xl"
            aria-label="WYLDRIFT home"
          >
            WYLDRIFT
          </Link>
          <nav className="hidden items-center gap-6 text-sm font-medium sm:flex">
            <a href="#hero" className="text-[var(--text-secondary)] hover:text-[var(--accent)]">
              Collection
            </a>
            <a href="#drops" className="text-[var(--text-secondary)] hover:text-[var(--accent)]">
              New Drops
            </a>
            <Link to="/join" className="text-[var(--text-secondary)] hover:text-[var(--accent)]">
              Join Drop
            </Link>
            <Link to="/shop" className="text-[var(--text-secondary)] hover:text-[var(--accent)]">
              Full Shop
            </Link>
          </nav>
          <button
            type="button"
            onClick={toggle}
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            className={`flex h-11 w-11 items-center justify-center rounded-full border-2 border-[var(--accent)] text-[var(--accent)] transition-transform hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] ${spinning ? "rotate-180" : ""}`}
            style={{ transition: "transform 0.3s ease, background-color 0.3s ease, color 0.3s ease" }}
          >
            {theme === "dark" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 pb-20 pt-24 sm:px-6 lg:px-8">
        <section id="hero" className="mb-20 sm:mb-28">
          <ProductShowcase product={hero} badge="NEW COLLECTION" />
        </section>

        <section id="combo" className="mb-20 sm:mb-28" aria-labelledby="combo-heading">
          <h2 id="combo-heading" className="wyld-animate-slide-up mb-10 text-center text-2xl font-bold sm:text-3xl">
            Combo <span className="text-[var(--accent)]">Deal</span>
          </h2>
          <ProductShowcase product={combo} badge="BEST VALUE" combo showStock delayClass="[animation-delay:120ms]" />
        </section>

        <section className="mb-20 sm:mb-28" aria-labelledby="features-heading">
          <h2 id="features-heading" className="sr-only">
            Product features
          </h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 sm:gap-6">
            {FEATURES.map(({ icon: Icon, label }, i) => (
              <div
                key={label}
                className="wyld-animate-slide-up group flex flex-col items-center rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] p-6 text-center transition-all hover:border-[var(--accent)]"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <Icon
                  className="mb-3 h-8 w-8 text-[var(--accent)] transition-transform group-hover:scale-110"
                  aria-hidden="true"
                />
                <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)] transition-colors group-hover:text-[var(--accent)] sm:text-xs">
                  {label}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-20 sm:mb-28" aria-labelledby="carousel-heading">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[var(--accent)]">Curated picks</p>
              <h2 id="carousel-heading" className="mt-2 text-2xl font-bold sm:text-3xl">
                FLOWERS &amp; Combos
              </h2>
            </div>
            <Share2 className="hidden h-5 w-5 text-[var(--text-secondary)] sm:block" aria-hidden="true" />
          </div>
          <div className="carousel-track -mx-4 flex gap-4 overflow-x-auto px-4 pb-4 sm:-mx-6 sm:px-6">
            {carouselItems.map((p) => (
              <article
                key={p.id}
                className="carousel-card w-[72vw] shrink-0 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] sm:w-[280px] lg:w-[300px]"
              >
                <div className="aspect-square overflow-hidden">
                  <img src={p.image} alt={p.name} loading="lazy" className="h-full w-full object-cover" />
                </div>
                <div className="p-4">
                  <h3 className="font-bold">{p.name}</h3>
                  <p className="mt-1 text-lg font-bold text-[var(--accent)]">{formatInr(p.price)}</p>
                  <div className="mt-3 flex gap-2">
                    {p.colors.slice(0, 3).map((c) => (
                      <span
                        key={c}
                        className="h-4 w-4 rounded-full border border-[var(--border)]"
                        style={{ backgroundColor: c }}
                        aria-hidden="true"
                      />
                    ))}
                  </div>
                  <a
                    href={waUrl(p.name)}
                    className="mt-4 inline-flex min-h-[44px] w-full items-center justify-center rounded-lg border border-[var(--accent)] text-sm font-semibold uppercase tracking-wider text-[var(--accent)] transition-all hover:-translate-y-0.5 hover:bg-[var(--accent)] hover:text-[#0a0a0a]"
                  >
                    View
                  </a>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section
          id="drops"
          className="wyld-animate-slide-up rounded-2xl border border-[var(--border)] bg-[var(--bg-secondary)] px-6 py-14 text-center sm:px-12 sm:py-20"
          aria-labelledby="drops-heading"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--accent)]">New Drops</p>
          <h2 id="drops-heading" className="mt-4 text-3xl font-bold sm:text-5xl">
            Coming in 48 hours
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-[var(--text-secondary)]">
            Next FLOWERS colourway lands across Tricity — Chandigarh · Mohali · Panchkula
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4 sm:gap-6">
            <CountdownUnit label="Days" value={days} animate={pop.d} />
            <span className="hidden self-center text-2xl text-[var(--accent)] sm:inline">:</span>
            <CountdownUnit label="Hours" value={hours} animate={pop.h} />
            <span className="hidden self-center text-2xl text-[var(--accent)] sm:inline">:</span>
            <CountdownUnit label="Minutes" value={minutes} animate={pop.m} />
            <span className="hidden self-center text-2xl text-[var(--accent)] sm:inline">:</span>
            <CountdownUnit label="Seconds" value={seconds} animate={pop.s} />
          </div>
          <Link
            to="/join"
            className="mt-10 inline-flex min-h-[44px] items-center justify-center rounded-lg border-2 border-[var(--accent)] px-8 text-sm font-bold uppercase tracking-wider text-[var(--accent)] transition-all hover:-translate-y-0.5 hover:bg-[var(--accent)] hover:text-[#0a0a0a]"
          >
            View rules &amp; join drop
          </Link>
        </section>

        <section className="mt-20 border-t border-[var(--border)] pt-16" aria-labelledby="newsletter-heading">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
            <div>
              <h2 id="newsletter-heading" className="text-2xl font-bold sm:text-3xl">
                Stay ahead of the drop
              </h2>
              <p className="mt-3 text-[var(--text-secondary)]">
                Early access, restock alerts, and Tricity-only flash deals.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Instagram"
                  className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-[var(--border)] text-[var(--text-primary)] hover:border-[var(--accent)] hover:text-[var(--accent)]"
                >
                  <InstagramIcon className="h-5 w-5" />
                </a>
                <a
                  href={waUrl("WYLDRIFT drops")}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="WhatsApp"
                  className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-[var(--border)] text-[var(--text-primary)] hover:border-[var(--accent)] hover:text-[var(--accent)]"
                >
                  <MessageCircle className="h-5 w-5" />
                </a>
                <button
                  type="button"
                  onClick={copyLink}
                  aria-label="Copy page link"
                  className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-[var(--border)] px-4 text-sm font-medium hover:border-[var(--accent)] hover:text-[var(--accent)]"
                >
                  <Copy className="h-4 w-4" />
                  {copied ? "Copied!" : "Copy link"}
                </button>
              </div>
            </div>
            <form
              className="flex flex-col gap-3 sm:flex-row"
              onSubmit={(e) => {
                e.preventDefault();
                window.open(waUrl("newsletter signup", email), "_blank", "noreferrer");
              }}
            >
              <label htmlFor="newsletter-email" className="sr-only">
                Email for drop alerts
              </label>
              <input
                id="newsletter-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@email.com"
                className="min-h-[44px] flex-1 rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] px-4 text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30"
              />
              <button
                type="submit"
                className="min-h-[44px] rounded-lg bg-[var(--accent)] px-6 text-sm font-bold uppercase tracking-wider text-[#0a0a0a] transition-all hover:-translate-y-0.5 hover:shadow-lg"
              >
                Notify Me
              </button>
            </form>
          </div>
          <p className="mt-12 text-center text-xs text-[var(--text-secondary)]">
            © {new Date().getFullYear()} THE WYLDRIFT · Tricity streetwear · Premium acid wash drops
          </p>
        </section>
      </main>
    </div>
  );
}
