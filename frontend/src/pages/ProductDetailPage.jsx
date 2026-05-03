import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import WyldriftLogo from "../components/WyldriftLogo.jsx";
import { getProductById } from "../lib/products.js";

const WHATSAPP_BUSINESS_NUMBER = "918219672237";

function makeGeneralWhatsappUrl(message = "Hello The Wyldrift! I'd like to know more about your products.") {
  return `https://wa.me/${WHATSAPP_BUSINESS_NUMBER}?text=${encodeURIComponent(message)}`;
}

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
  const amount = product.discountPrice ?? product.price;
  const n = Number(amount);
  if (!Number.isFinite(n) || n < 0) return "—";
  return `₹ ${n.toLocaleString("en-IN")}.00`;
}

function listText(arr) {
  if (!Array.isArray(arr) || !arr.length) return "—";
  return arr.join(", ");
}

export default function ProductDetailPage() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) {
      setLoading(false);
      setError("Missing product link.");
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError("");
    getProductById(id)
      .then((p) => {
        if (cancelled) return;
        if (!p) setError("Product not found.");
        else setProduct(p);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e?.message || "Could not load this product.");
        setProduct(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  const isSoldOut = product && Number(product.stock) <= 0;
  const images = product?.images?.length ? product.images : product?.image ? [{ url: product.image }] : [];

  return (
    <div className="store-body store-theme-light">
      <header className="store-header">
        <Link className="store-logo" to="/" aria-label="The Wyldrift home">
          <WyldriftLogo className="logo-svg" size={30} tone="light" />
        </Link>
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

      <main className="store-product-detail-main">
        <nav className="store-product-detail-back" aria-label="Breadcrumb">
          <Link to="/" className="browse-link">
            ← Back to shop
          </Link>
        </nav>

        {loading ? (
          <div className="store-product-detail-skeleton" aria-busy="true" aria-live="polite">
            <div className="store-product-detail-skeleton-gallery" />
            <div className="store-product-detail-skeleton-body">
              <div className="store-skeleton-line store-skeleton-line--lg" />
              <div className="store-skeleton-line" />
              <div className="store-skeleton-line" />
            </div>
          </div>
        ) : null}

        {!loading && error ? (
          <div className="store-empty-panel store-product-detail-error">
            <p className="store-empty-title serif">{error}</p>
            <Link to="/" className="store-hero-btn-primary">
              Return to catalogue
            </Link>
          </div>
        ) : null}

        {!loading && product ? (
          <article className="store-product-detail">
            <div className="store-product-detail-gallery">
              {images.length ? (
                <ul className="store-product-detail-images">
                  {images.map((img, i) => (
                    <li key={img.publicId || img.url || i}>
                      <img src={img.url} alt={`${product.productName} — image ${i + 1}`} loading={i === 0 ? "eager" : "lazy"} />
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="store-product-detail-noimg">No images</div>
              )}
            </div>

            <div className="store-product-detail-info">
              {product.category ? (
                <p className="store-product-detail-kicker">{product.category}</p>
              ) : null}
              <h1 className="store-product-detail-title serif">{product.productName}</h1>
              <p className="store-product-detail-price">
                <span className="store-product-detail-price-main">{formatPrice(product)}</span>
                {product.discountPrice && product.discountPrice < product.price ? (
                  <span className="store-product-detail-price-was">
                    ₹ {Number(product.price).toLocaleString("en-IN")}.00
                  </span>
                ) : null}
              </p>

              <div className="store-product-detail-meta">
                <div>
                  <span className="store-product-detail-label">SKU</span>
                  <span>{product.sku}</span>
                </div>
                <div>
                  <span className="store-product-detail-label">Stock</span>
                  <span className={isSoldOut ? "store-product-detail-soldout" : ""}>
                    {isSoldOut ? "Sold out" : `${product.stock} available`}
                  </span>
                </div>
                <div>
                  <span className="store-product-detail-label">Sizes</span>
                  <span>{listText(product.sizes)}</span>
                </div>
                <div>
                  <span className="store-product-detail-label">Colors</span>
                  <span>{listText(product.colors)}</span>
                </div>
                {product.tags?.length ? (
                  <div className="store-product-detail-tags">
                    <span className="store-product-detail-label">Tags</span>
                    <span>{listText(product.tags)}</span>
                  </div>
                ) : null}
              </div>

              <div className="store-product-detail-badges">
                {product.featured ? <span className="store-product-detail-badge">Featured</span> : null}
                {product.active === false ? <span className="store-product-detail-badge muted">Hidden on shop</span> : null}
              </div>

              <section className="store-product-detail-desc" aria-labelledby="detail-desc-heading">
                <h2 id="detail-desc-heading" className="store-product-detail-desc-title">
                  Details
                </h2>
                <p>{product.description}</p>
              </section>

              <div className="store-product-detail-actions">
                <a
                  className="store-hero-btn-primary"
                  href={isSoldOut ? "#" : makeWhatsappUrl(product)}
                  target="_blank"
                  rel="noreferrer"
                  aria-disabled={isSoldOut}
                  onClick={(e) => {
                    if (isSoldOut) e.preventDefault();
                  }}
                >
                  <svg viewBox="0 0 32 32" width="22" height="22" aria-hidden="true">
                    <path
                      fill="currentColor"
                      d="M16.02 3.2A12.7 12.7 0 0 0 5.1 22.38L3.5 28.8l6.56-1.54a12.72 12.72 0 1 0 5.96-24.06Zm0 22.9c-2 0-3.86-.58-5.44-1.58l-.42-.26-3.9.92.94-3.8-.28-.44A10.1 10.1 0 1 1 16.02 26.1Zm5.86-7.56c-.32-.16-1.9-.94-2.2-1.04-.3-.12-.52-.16-.74.16-.22.32-.84 1.04-1.04 1.26-.18.22-.38.24-.7.08-.32-.16-1.36-.5-2.58-1.6-.96-.86-1.6-1.9-1.8-2.22-.18-.32-.02-.5.14-.66.14-.14.32-.38.48-.56.16-.2.22-.32.32-.54.12-.22.06-.4-.02-.56-.08-.16-.74-1.78-1.02-2.44-.26-.64-.54-.56-.74-.56h-.64c-.22 0-.56.08-.86.4-.3.32-1.14 1.12-1.14 2.72s1.16 3.14 1.32 3.36c.16.22 2.28 3.48 5.52 4.88.78.34 1.38.54 1.84.68.78.24 1.48.2 2.04.12.62-.1 1.9-.78 2.16-1.52.26-.74.26-1.38.18-1.52-.08-.14-.3-.22-.62-.38Z"
                    />
                  </svg>
                  {isSoldOut ? "Sold out" : "Order on WhatsApp"}
                </a>
              </div>
            </div>
          </article>
        ) : null}
      </main>

      <footer className="site-footer site-footer--branded">
        <Link className="site-footer-logo" to="/" aria-label="The Wyldrift home">
          <WyldriftLogo className="logo-svg logo-svg--footer" size={34} tone="light" />
        </Link>
        <p className="site-footer-copy">© 2026 The Wyldrift. All rights reserved.</p>
      </footer>
    </div>
  );
}
