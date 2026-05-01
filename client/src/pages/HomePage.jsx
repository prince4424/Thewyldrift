import React, { useMemo, useState } from "react";

function ProductCard({ product }) {
  return (
    <div className="tap relative overflow-hidden rounded-card bg-white shadow-soft">
      <div className="relative">
        <img
          src={product.image}
          alt={product.name}
          className="h-44 w-full object-cover md:h-48"
          loading="lazy"
        />
        <button
          type="button"
          className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-white/85 shadow-soft backdrop-blur"
          aria-label="Save"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5 text-brownDark" fill="none" aria-hidden="true">
            <path
              d="M7 4.8h10A1.2 1.2 0 0 1 18.2 6v15.2L12 18.2 5.8 21.2V6A1.2 1.2 0 0 1 7 4.8Z"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      <div className="space-y-1.5 p-3">
        <div className="truncate text-[15px] font-semibold text-text">{product.name}</div>
        <div className="flex items-center gap-1 text-[12px] text-muted">
          <Star className="h-3.5 w-3.5 text-gold" />
          <span>
            {product.rating} ({product.reviews})
          </span>
        </div>
        <div className="text-[16px] font-bold text-brown">₹{product.price.toFixed(2)}</div>
      </div>
    </div>
  );
}

function Star({ className = "" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 17.3 6.5 20.2l1.1-6.2L3 9.6l6.3-.9L12 3l2.7 5.7 6.3.9-4.6 4.4 1.1 6.2L12 17.3Z" />
    </svg>
  );
}

const circles = [
  { label: "SHOES", seed: "shoes" },
  { label: "CASUAL", seed: "casual" },
  { label: "OUTWEAR", seed: "outwear" },
  { label: "PARTY", seed: "party" },
];

export default function HomePage() {
  const [selected, setSelected] = useState("SHOES");

  const products = useMemo(() => {
    // Placeholder products (mobile-first screen replication).
    return Array.from({ length: 8 }).map((_, i) => ({
      id: i + 1,
      name: `Wyld ${selected} ${i + 1}`,
      rating: "4.9",
      reviews: 160,
      price: 399,
      image: `https://picsum.photos/seed/wyldrift-${selected}-${i}/300/400`,
    }));
  }, [selected]);

  return (
    <div className="space-y-4">
      {/* Top Nav */}
      <header className="fade-up flex items-center justify-between pt-2">
        <button type="button" className="text-[11px] font-semibold tracking-[0.22em] text-muted">
          MENS <span className="align-middle opacity-70">∨</span>
        </button>
        <div className="font-serif text-[18px] font-semibold text-text">The Wyldrift</div>
        <button type="button" className="text-[11px] font-semibold tracking-[0.22em] text-brown">
          SEARCH
        </button>
      </header>

      {/* Category Circles */}
      <section className="fade-up-delay-1">
        <div className="-mx-4 flex gap-4 overflow-x-auto px-4 pb-1 md:mx-0 md:overflow-visible md:px-0">
          {circles.map((c) => {
            const active = selected === c.label;
            return (
              <button
                key={c.label}
                type="button"
                onClick={() => setSelected(c.label)}
                className="tap flex w-[76px] shrink-0 flex-col items-center gap-2"
              >
                <div
                  className={`relative h-[60px] w-[60px] overflow-hidden rounded-full ${
                    active ? "ring-2 ring-gold" : "ring-1 ring-black/5"
                  } bg-white shadow-soft`}
                >
                  <img
                    src={`https://picsum.photos/seed/wyldrift-circle-${c.seed}/120/120`}
                    alt={c.label}
                    className="h-full w-full object-cover"
                  />
                  {active ? (
                    <span className="absolute right-1 top-1 h-3 w-3 rounded-full bg-badge shadow-soft" />
                  ) : null}
                </div>
                <div className="text-[10px] font-semibold tracking-[0.22em] text-muted">{c.label}</div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Products */}
      <section className="fade-up-delay-2 space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-[11px] font-semibold tracking-[0.22em] text-muted">PRODUCTS</div>
          <div className="flex items-center gap-2 text-brownDark">
            <button type="button" className="tap rounded-full bg-white p-2 shadow-soft" aria-label="Grid">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
                <path
                  d="M4.5 4.5h6.8v6.8H4.5V4.5Zm8.2 0h6.8v6.8h-6.8V4.5ZM4.5 12.7h6.8v6.8H4.5v-6.8Zm8.2 0h6.8v6.8h-6.8v-6.8Z"
                  stroke="currentColor"
                  strokeWidth="1.6"
                />
              </svg>
            </button>
            <button type="button" className="tap rounded-full bg-white p-2 shadow-soft" aria-label="List">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
                <path d="M6 7h14M6 12h14M6 17h14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                <path d="M4 7h.01M4 12h.01M4 17h.01" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>
    </div>
  );
}

