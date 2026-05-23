import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import HowItWorksSection from "../components/HowItWorksSection.jsx";
import StartStylingButton from "../components/StartStylingButton.jsx";
import StyleStickyBar from "../components/StyleStickyBar.jsx";
import {
  StorefrontFooter,
  StorefrontHeader,
  StorefrontMarquee,
  useScrollReveal,
} from "../components/StorefrontChrome.jsx";
import { resolveApiUrl } from "../lib/http.js";
import {
  buildHeroSlidesFromProducts,
  formatOriginalPrice,
  formatPrice,
  formatPriceAmount,
  getProductCategoryLabel,
  getProductDetailId,
  getProductDetailUrl,
  getProductTypeLabel,
  isComboProduct,
  makeProductWhatsappUrl,
  orderedCategoriesFromProducts,
  parseSizes,
  pickImage,
  pickSecondImage,
  resolveHeroSlides,
} from "../lib/storefront.js";

function EditorialHero({ slides, loading }) {
  const [active, setActive] = useState(0);
  const [isMobileCarousel, setIsMobileCarousel] = useState(false);
  const [pauseAuto, setPauseAuto] = useState(false);
  const carouselRef = useRef(null);
  const scrollRafRef = useRef(null);
  const scrollBehaviorRef = useRef("auto");
  const resumeAutoTimerRef = useRef(null);
  const count = slides.length;

  const pauseAutoAdvance = useCallback((ms = 6000) => {
    setPauseAuto(true);
    if (resumeAutoTimerRef.current) window.clearTimeout(resumeAutoTimerRef.current);
    resumeAutoTimerRef.current = window.setTimeout(() => setPauseAuto(false), ms);
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 900px)");
    const update = () => setIsMobileCarousel(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    return () => {
      if (resumeAutoTimerRef.current) window.clearTimeout(resumeAutoTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (count <= 1 || pauseAuto) return undefined;
    const id = window.setInterval(() => {
      scrollBehaviorRef.current = "auto";
      setActive((i) => (i + 1) % count);
    }, 5000);
    return () => window.clearInterval(id);
  }, [count, pauseAuto]);

  useEffect(() => {
    if (active >= count) setActive(0);
  }, [active, count]);

  useEffect(() => {
    if (!isMobileCarousel || count <= 1) return undefined;
    const el = carouselRef.current;
    if (!el) return undefined;

    const syncScroll = () => {
      const target = active * el.clientWidth;
      if (Math.abs(el.scrollLeft - target) > 2) {
        el.scrollTo({ left: target, behavior: scrollBehaviorRef.current });
      }
      scrollBehaviorRef.current = "auto";
    };

    syncScroll();
    window.addEventListener("resize", syncScroll);
    return () => window.removeEventListener("resize", syncScroll);
  }, [active, isMobileCarousel, count]);

  const handleCarouselScroll = useCallback(() => {
    pauseAutoAdvance();
    if (scrollRafRef.current) return;
    scrollRafRef.current = window.requestAnimationFrame(() => {
      scrollRafRef.current = null;
      const el = carouselRef.current;
      if (!el || count <= 1) return;
      const idx = Math.round(el.scrollLeft / Math.max(el.clientWidth, 1));
      const clamped = Math.max(0, Math.min(idx, count - 1));
      setActive((prev) => (prev === clamped ? prev : clamped));
    });
  }, [count, pauseAutoAdvance]);

  const goToSlide = useCallback(
    (index) => {
      scrollBehaviorRef.current = "smooth";
      pauseAutoAdvance(8000);
      setActive(index);
    },
    [pauseAutoAdvance]
  );

  return (
    <section className="editorial-hero editorial-hero--v2" aria-labelledby="hero-title">
      <div className="editorial-hero-content">
        <span className="editorial-hero-gold-line" aria-hidden="true" />
        <p className="editorial-hero-kicker">Limited edits · Fresh drops weekly</p>
        <h1 id="hero-title" className="editorial-hero-title">
          <em>Wear what you mean.</em>
        </h1>
        <div className="editorial-hero-copy">
          <p className="editorial-hero-sub-lead">Curated combos &amp; singles</p>
          <p className="editorial-hero-sub-body">
            Hand-picked coord sets and standalone pieces — styled with intention, not noise. Browse the
            collection, choose your fit, and order in one WhatsApp chat.
          </p>
        </div>
        <div className="editorial-hero-actions">
          <StartStylingButton />
          <a className="btn-editorial btn-editorial--ghost" href="#categories">
            Browse Combos
          </a>
        </div>
      </div>

      <div className="editorial-hero-media">
        {loading ? <div className="editorial-hero-media-loading" aria-hidden="true" /> : null}
        {!loading ? (
          <div
            ref={carouselRef}
            className="editorial-hero-carousel"
            onScroll={handleCarouselScroll}
            onTouchStart={() => pauseAutoAdvance(8000)}
            onPointerDown={() => pauseAutoAdvance(8000)}
            role="region"
            aria-roledescription="carousel"
            aria-label="Featured looks"
          >
            {slides.map((slide, i) => {
              const isActive = i === active;
              const bg = (
                <div
                  className={`editorial-hero-slide-bg${isActive ? " editorial-hero-slide-bg--active" : ""}`}
                  style={{ backgroundImage: `url(${slide.url})` }}
                />
              );

              return (
                <div
                  key={slide.productId || slide.key || slide.url || i}
                  className={`editorial-hero-slide${isActive ? " editorial-hero-slide--active" : ""}`}
                  aria-hidden={isMobileCarousel ? false : !isActive}
                >
                  {slide.detailTo ? (
                    <Link
                      to={slide.detailTo}
                      className="editorial-hero-slide-hit"
                      aria-label={slide.productName ? `View ${slide.productName}` : "View product"}
                      tabIndex={isMobileCarousel || isActive ? 0 : -1}
                    >
                      {bg}
                    </Link>
                  ) : (
                    <div className="editorial-hero-slide-hit">{bg}</div>
                  )}
                  {slide.productName && slide.detailTo ? (
                    <Link to={slide.detailTo} className="editorial-hero-caption">
                      <span className="editorial-hero-caption-name">{slide.productName}</span>
                      {slide.price ? <span className="editorial-hero-caption-price">{slide.price}</span> : null}
                    </Link>
                  ) : null}
                </div>
              );
            })}
          </div>
        ) : null}

        {count > 1 ? (
          <div className="hero-dots" role="tablist" aria-label="Hero slides">
            {slides.map((slide, i) => (
              <button
                key={slide.productId || slide.url || i}
                type="button"
                role="tab"
                aria-selected={i === active}
                aria-label={`Slide ${i + 1}`}
                className={`hero-dot${i === active ? " hero-dot--active" : ""}`}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  goToSlide(i);
                }}
              />
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}

function TrustStripItem({ item, clone = false }) {
  return (
    <article
      className={`trust-strip-item${clone ? " trust-strip-item--clone" : ""}`}
      aria-hidden={clone ? true : undefined}
    >
      <h3 className="trust-strip-title">
        <span className="trust-strip-star" aria-hidden="true">
          ✦
        </span>{" "}
        {item.title}
      </h3>
      <p className="trust-strip-body">{item.body}</p>
    </article>
  );
}

function TrustStrip() {
  const items = [
    { title: "Curated Weekly", body: "New drops every Friday" },
    { title: "WhatsApp Orders", body: "Chat to order, get instant updates" },
    { title: "Hassle-Free Returns", body: "7-day easy exchange policy" },
  ];

  return (
    <section className="trust-strip reveal" aria-label="Store highlights">
      <div className="trust-strip-viewport">
        <div className="trust-strip-track">
          {items.map((item) => (
            <TrustStripItem key={item.title} item={item} />
          ))}
          {items.map((item) => (
            <TrustStripItem key={`${item.title}-clone`} item={item} clone />
          ))}
        </div>
      </div>
    </section>
  );
}

function CategoryTile({ category, items, active, onPick }) {
  const preview = pickImage(items[0], `${category}-category`);
  const hasImage = Boolean(items[0]?.images?.[0]?.url || items[0]?.image);

  return (
    <button
      type="button"
      className={`category-portrait-tile${active ? " category-portrait-tile--active" : ""}`}
      onClick={() => onPick(category)}
      aria-pressed={active}
    >
      <span
        className="category-portrait-tile-visual"
        style={hasImage ? undefined : { background: "var(--color-tile-fallback, #E8E3DC)" }}
      >
        {hasImage ? <img src={preview} alt="" loading="lazy" decoding="async" /> : null}
        <span className="category-portrait-tile-overlay" />
        <span className="category-portrait-tile-name">
          <em>{category}</em>
        </span>
      </span>
    </button>
  );
}

function ProductTypeBadge({ product }) {
  const label = getProductTypeLabel(product);
  const isCombo = isComboProduct(product);
  return (
    <span className={`product-type-badge${isCombo ? " product-type-badge--combo" : " product-type-badge--single"}`}>
      {label}
    </span>
  );
}

function ProductCard({ product }) {
  const image = pickImage(product, product.sku);
  const imageAlt = pickSecondImage(product, product.sku);
  const hasSecond = imageAlt !== image;
  const detailId = getProductDetailId(product);
  const detailTo = detailId ? `/product/${encodeURIComponent(detailId)}` : "";
  const sizes = parseSizes(product);
  const hasDiscount =
    product.discountPrice != null && Number(product.discountPrice) < Number(product.price);
  const waUrl = makeProductWhatsappUrl(product, { pageUrl: getProductDetailUrl(product) });

  return (
    <article className="editorial-product-card">
      <div className="editorial-product-card-media">
        <ProductTypeBadge product={product} />
        {detailTo ? (
          <Link to={detailTo} className="editorial-product-card-link" aria-label={`View ${product.productName}`}>
            <img className="editorial-product-img editorial-product-img--primary" src={image} alt={product.productName} loading="lazy" />
            {hasSecond ? (
              <img className="editorial-product-img editorial-product-img--hover" src={imageAlt} alt="" loading="lazy" aria-hidden="true" />
            ) : null}
          </Link>
        ) : (
          <img className="editorial-product-img editorial-product-img--primary" src={image} alt={product.productName} loading="lazy" />
        )}
        <div className="editorial-product-card-hover-cta">
          <StartStylingButton href={waUrl} className="btn-style-primary--card" />
        </div>
      </div>
      <div className="editorial-product-card-body">
        {product.category ? <span className="editorial-product-tag">{product.category}</span> : null}
        <h3 className="editorial-product-name">
          {detailTo ? <Link to={detailTo}>{product.productName}</Link> : product.productName}
        </h3>
        <p className="editorial-product-price">
          {hasDiscount ? (
            <>
              <span className="editorial-product-price-was">{formatOriginalPrice(product)}</span>
              <span className="editorial-product-price-sale">{formatPriceAmount(product.discountPrice)}</span>
            </>
          ) : (
            <span>{formatPrice(product)}</span>
          )}
        </p>
        {sizes.length ? (
          <p className="editorial-product-sizes" aria-label="Available sizes">
            {sizes.join(" · ")}
          </p>
        ) : null}
      </div>
    </article>
  );
}

function SearchIcon() {
  return (
    <svg className="catalog-search__icon-svg" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        d="m21 19.6-5.2-5.2a7.5 7.5 0 1 0-1.4 1.4l5.2 5.2L21 19.6ZM5 10a5 5 0 1 1 5 5 5 5 0 0 1-5-5Z"
      />
    </svg>
  );
}

function CatalogSearch({ query, onQueryChange, resultCount, onSubmit }) {
  const inputId = "catalog-search-input";
  const trimmed = query.trim();
  const hasQuery = trimmed.length > 0;

  return (
    <section className="catalog-search-section reveal" aria-label="Search the collection">
      <div className="catalog-search-section__head">
        <label htmlFor={inputId} className="catalog-search-section__label">
          Find your style
        </label>
        {!hasQuery ? (
          <p className="catalog-search-section__hint">Name, category, colour, or SKU</p>
        ) : (
          <p className="catalog-search-section__meta" role="status" aria-live="polite">
            {resultCount} {resultCount === 1 ? "piece" : "pieces"} match
            <span className="catalog-search-section__query"> &ldquo;{trimmed}&rdquo;</span>
          </p>
        )}
      </div>

      <form
        className="catalog-search"
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
      >
        <span className="catalog-search__icon" aria-hidden="true">
          <SearchIcon />
        </span>
        <input
          id={inputId}
          className="catalog-search__input"
          type="search"
          name="q"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Search combos, tees, denim…"
          autoComplete="off"
          enterKeyHint="search"
        />
        {hasQuery ? (
          <button
            type="button"
            className="catalog-search__clear"
            aria-label="Clear search"
            onClick={() => {
              onQueryChange("");
              document.getElementById(inputId)?.focus();
            }}
          >
            Clear
          </button>
        ) : null}
        <button type="submit" className="catalog-search__submit" aria-label="Search and view results">
          Go
        </button>
      </form>
    </section>
  );
}

async function fetchHeroProducts() {
  const tryFetch = async (url) => {
    const r = await fetch(resolveApiUrl(url));
    if (!r.ok) return [];
    const d = await r.json();
    return d.products || [];
  };

  let list = await tryFetch("/api/products?limit=8&featured=true");
  if (buildHeroSlidesFromProducts(list).length < 3) {
    const more = await tryFetch("/api/products?limit=8");
    const seen = new Set(list.map((p) => p.id || p._id));
    for (const p of more) {
      const id = p.id || p._id;
      if (!seen.has(id)) {
        list.push(p);
        seen.add(id);
      }
    }
  }
  return list;
}

export default function StorefrontPage() {
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [heroSlides, setHeroSlides] = useState([]);
  const [heroLoading, setHeroLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [pickedCategory, setPickedCategory] = useState(null);
  const [site, setSite] = useState({
    homeCategoryTitle: "Shop by Style",
    homeCategoryKicker: "Collections",
  });

  useEffect(() => {
    setHeroLoading(true);
    fetchHeroProducts()
      .then((list) => setHeroSlides(resolveHeroSlides(list)))
      .catch(() => setHeroSlides(resolveHeroSlides([])))
      .finally(() => setHeroLoading(false));
  }, []);

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

  useScrollReveal([productsLoading, pickedCategory, filtered.length, heroLoading]);

  const itemsInPickedCategory = useMemo(() => {
    if (!pickedCategory) return [];
    return filtered.filter((p) => getProductCategoryLabel(p) === pickedCategory);
  }, [filtered, pickedCategory]);

  const gridProducts = pickedCategory ? itemsInPickedCategory : filtered;
  const gridTitle = pickedCategory ? `Showing: ${pickedCategory}` : "All Styles";
  const gridCount = gridProducts.length;

  useEffect(() => {
    if (pickedCategory == null) return;
    if (!categoryOrder.includes(pickedCategory)) setPickedCategory(null);
  }, [pickedCategory, categoryOrder]);

  return (
    <div className="store-body store-theme-light store-editorial">
      <StorefrontMarquee />
      <StorefrontHeader homeLink="#top" />

      <main id="top">
        <EditorialHero slides={heroSlides} loading={heroLoading} />
        <TrustStrip />

        <CatalogSearch
          query={query}
          onQueryChange={setQuery}
          resultCount={filtered.length}
          onSubmit={() => document.querySelector("#products")?.scrollIntoView({ behavior: "smooth" })}
        />

        <section id="categories" className="categories-section reveal" aria-labelledby="categories-title">
          <div className="section-heading">
            <span className="section-kicker">{site.homeCategoryKicker || "Collections"}</span>
            <h2 id="categories-title">{site.homeCategoryTitle || "Shop by Style"}</h2>
          </div>
          {!productsLoading && categoryOrder.length > 0 ? (
            <div className="category-portrait-scroll">
              {categoryOrder.map((cat) => {
                const items = filtered.filter((p) => getProductCategoryLabel(p) === cat);
                if (!items.length) return null;
                return (
                  <CategoryTile
                    key={cat}
                    category={cat}
                    items={items}
                    active={pickedCategory === cat}
                    onPick={(c) => {
                      setPickedCategory(c);
                      document.querySelector("#products")?.scrollIntoView({ behavior: "smooth" });
                    }}
                  />
                );
              })}
            </div>
          ) : null}
        </section>

        <section id="products" className="products-section" aria-labelledby="products-title">
          {pickedCategory ? (
            <button type="button" className="store-category-back" onClick={() => setPickedCategory(null)}>
              ← All styles
            </button>
          ) : null}

          <div className="products-section-heading">
            <h2 id="products-title" className="products-grid-title">
              <em>{gridTitle}</em>
            </h2>
            {!productsLoading && gridCount > 0 ? (
              <span className="products-grid-count">
                {gridCount} {gridCount === 1 ? "piece" : "pieces"}
              </span>
            ) : null}
          </div>

          {productsLoading ? (
            <div className="editorial-products-grid editorial-products-grid--loading" aria-busy="true">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="store-skeleton-card" />
              ))}
            </div>
          ) : null}

          {!productsLoading && products.length === 0 ? (
            <div className="store-empty-panel">
              <p className="store-empty-title">Catalogue is updating</p>
              <p className="store-empty-text">New pieces arrive weekly. Browse categories above or start styling on WhatsApp.</p>
              <StartStylingButton />
            </div>
          ) : null}

          {!productsLoading && products.length > 0 && filtered.length === 0 ? (
            <div className="store-empty-panel store-empty-panel--search">
              <p className="store-empty-title">
                No styles found for &ldquo;{query.trim()}&rdquo;
              </p>
              <p className="store-empty-text">Try browsing our combos or chat with us on WhatsApp</p>
              <StartStylingButton />
            </div>
          ) : null}

          {!productsLoading && gridProducts.length > 0 ? (
            <div className="editorial-products-grid">
              {gridProducts.map((p) => (
                <ProductCard key={p.id || p._id} product={p} />
              ))}
            </div>
          ) : null}
        </section>

        <HowItWorksSection />
      </main>

      <StyleStickyBar />
      <StorefrontFooter />
    </div>
  );
}
