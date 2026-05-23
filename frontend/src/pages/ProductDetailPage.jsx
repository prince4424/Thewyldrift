import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import ProductGallery from "../components/ProductGallery.jsx";
import StartStylingButton from "../components/StartStylingButton.jsx";
import StyleStickyBar from "../components/StyleStickyBar.jsx";
import {
  StorefrontFooter,
  StorefrontHeader,
  StorefrontMarquee,
  useScrollReveal,
} from "../components/StorefrontChrome.jsx";
import { getProductById } from "../lib/products.js";
import {
  formatOriginalPrice,
  formatPrice,
  formatPriceAmount,
  getComboSavings,
  isComboProduct,
  makeProductWhatsappUrl,
  parseComboIncludes,
  parseSizes,
} from "../lib/storefront.js";

function AccordionItem({ id, title, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  const panelId = `accordion-${id}`;

  return (
    <div className={`detail-accordion${open ? " detail-accordion--open" : ""}`}>
      <button
        type="button"
        className="detail-accordion-trigger"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
      >
        <span>{title}</span>
        <span className="detail-accordion-icon" aria-hidden="true">
          {open ? "−" : "+"}
        </span>
      </button>
      <div id={panelId} className="detail-accordion-panel" aria-hidden={!open}>
        <div className="detail-accordion-content">{children}</div>
      </div>
    </div>
  );
}

export default function ProductDetailPage() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedSize, setSelectedSize] = useState("");

  useScrollReveal([loading, product?.id]);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      setError("Missing product link.");
      return undefined;
    }
    let cancelled = false;
    setLoading(true);
    setError("");
    getProductById(id)
      .then((p) => {
        if (cancelled) return;
        if (!p) setError("Product not found.");
        else {
          setProduct(p);
          setSelectedSize("");
        }
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
  const isCombo = product ? isComboProduct(product) : false;
  const sizes = product ? parseSizes(product) : [];
  const hasDiscount =
    product?.discountPrice != null && Number(product.discountPrice) < Number(product.price);
  const comboSavings = product ? getComboSavings(product) : null;
  const comboIncludes = product ? parseComboIncludes(product.description) : [];

  const waUrl =
    product && !isSoldOut
      ? makeProductWhatsappUrl(product, {
          size: selectedSize || undefined,
          pageUrl: typeof window !== "undefined" ? window.location.href : undefined,
        })
      : "#";

  const materialCare =
    product?.description?.match(/material[^:]*:\s*([^\n]+)/i)?.[1] ||
    (product?.colors?.length ? `Colours: ${product.colors.join(", ")}` : null);

  const breadcrumbType = isCombo ? "Combos" : "Singles";

  return (
    <div className="store-body store-theme-light store-editorial store-editorial--detail">
      <StorefrontMarquee />
      <StorefrontHeader homeLink="/" />

      <main className="store-product-detail-main">
        <nav className="store-product-detail-back reveal" aria-label="Breadcrumb">
          <ol className="detail-breadcrumb">
            <li>
              <Link to="/">Home</Link>
            </li>
            <li aria-hidden="true">/</li>
            <li>
              <Link to="/#products">{breadcrumbType}</Link>
            </li>
            <li aria-hidden="true">/</li>
            <li aria-current="page">{product?.productName || "Product"}</li>
          </ol>
        </nav>

        {loading ? (
          <div className="store-product-detail-skeleton" aria-busy="true">
            <div className="store-product-detail-skeleton-gallery" />
            <div className="store-product-detail-skeleton-body">
              <div className="store-skeleton-line store-skeleton-line--lg" />
              <div className="store-skeleton-line" />
              <div className="store-skeleton-line" />
            </div>
          </div>
        ) : null}

        {!loading && error ? (
          <div className="store-empty-panel store-product-detail-error reveal">
            <p className="store-empty-title">{error}</p>
            <Link to="/">
              <StartStylingButton />
            </Link>
          </div>
        ) : null}

        {!loading && product ? (
          <article className="store-product-detail store-product-detail--editorial reveal">
            <div className="store-product-detail-gallery">
              <ProductGallery product={product} productName={product.productName} />
            </div>

            <div className="store-product-detail-info">
              {product.category ? <p className="store-product-detail-kicker">{product.category}</p> : null}
              <h1 className="store-product-detail-title">{product.productName}</h1>

              <div className="store-product-detail-price store-product-detail-price--large">
                {hasDiscount ? (
                  <>
                    <span className="store-product-detail-price-was">{formatOriginalPrice(product)}</span>
                    <span className="store-product-detail-price-main store-product-detail-price-main--sale">
                      {formatPriceAmount(product.discountPrice)}
                    </span>
                  </>
                ) : (
                  <span className="store-product-detail-price-main">{formatPrice(product)}</span>
                )}
              </div>

              {isCombo && comboSavings ? (
                <p className="detail-combo-savings">Save {comboSavings} on this combo</p>
              ) : null}

              {isCombo ? (
                <section className="detail-combo-includes" aria-labelledby="combo-includes-heading">
                  <h2 id="combo-includes-heading" className="detail-section-label">
                    What&apos;s included
                  </h2>
                  {comboIncludes.length ? (
                    <ul className="detail-combo-list">
                      {comboIncludes.map((item) => (
                        <li key={item}>
                          <span className="detail-combo-star" aria-hidden="true">
                            ✦
                          </span>{" "}
                          {item}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="detail-combo-desc-block">
                      <p>{product.description}</p>
                    </div>
                  )}
                </section>
              ) : null}

              {sizes.length ? (
                <section className="detail-size-guide" aria-labelledby="size-guide-heading">
                  <h2 id="size-guide-heading" className="detail-section-label">
                    Select size
                  </h2>
                  <div className="detail-size-pills" role="listbox" aria-label="Available sizes">
                    {sizes.map((size) => (
                      <button
                        key={size}
                        type="button"
                        role="option"
                        aria-selected={selectedSize === size}
                        className={`detail-size-pill${selectedSize === size ? " detail-size-pill--selected" : ""}`}
                        onClick={() => setSelectedSize(size)}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </section>
              ) : null}

              <div className="detail-accordions">
                {!isCombo || !comboIncludes.length ? (
                  <AccordionItem id="desc" title="Product description" defaultOpen>
                    <p>{product.description || "—"}</p>
                  </AccordionItem>
                ) : null}
                <AccordionItem id="material" title="Material & Care">
                  <p>
                    {materialCare ||
                      "Premium fabrics selected for comfort and longevity. Hand wash cold or gentle machine cycle. Do not bleach."}
                  </p>
                </AccordionItem>
                <AccordionItem id="delivery" title="Delivery info">
                  <p>We ship across India · WhatsApp us for delivery estimates · Usually ships in 2–4 days</p>
                </AccordionItem>
              </div>

              <div className="store-product-detail-actions store-product-detail-actions--desktop">
                {isSoldOut ? (
                  <span className="btn-style-primary btn-style-primary--full btn-style-primary--disabled">
                    Sold out
                  </span>
                ) : (
                  <StartStylingButton href={waUrl} fullWidth />
                )}
              </div>
            </div>
          </article>
        ) : null}
      </main>

      {product && !loading ? (
        <div className="detail-mobile-wa-bar">
          {isSoldOut ? (
            <span className="detail-mobile-wa-btn detail-mobile-wa-btn--disabled">Sold out</span>
          ) : (
            <StartStylingButton href={waUrl} fullWidth className="detail-mobile-wa-btn" />
          )}
        </div>
      ) : null}

      <StyleStickyBar />
      <StorefrontFooter />
    </div>
  );
}
