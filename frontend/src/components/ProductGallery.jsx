import React, { useCallback, useEffect, useRef, useState } from "react";
import { getProductImages } from "../lib/storefront.js";

export default function ProductGallery({ product, productName }) {
  const images = getProductImages(product);
  const [active, setActive] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [fadeKey, setFadeKey] = useState(0);

  const count = images.length;
  const hasMultiple = count > 1;
  const trackRef = useRef(null);

  useEffect(() => {
    const track = trackRef.current;
    if (!track || !hasMultiple) return undefined;

    const onScroll = () => {
      const slide = track.querySelector(".product-gallery-mobile-slide");
      if (!slide) return;
      const w = slide.offsetWidth;
      if (!w) return;
      const idx = Math.round(track.scrollLeft / w);
      setActive(Math.min(Math.max(idx, 0), count - 1));
    };

    track.addEventListener("scroll", onScroll, { passive: true });
    return () => track.removeEventListener("scroll", onScroll);
  }, [count, hasMultiple]);

  const goTo = useCallback((index) => {
    setActive(index);
    setFadeKey((k) => k + 1);
  }, []);

  const goPrev = useCallback(() => {
    if (!count) return;
    goTo((active - 1 + count) % count);
  }, [active, count, goTo]);

  const goNext = useCallback(() => {
    if (!count) return;
    goTo((active + 1) % count);
  }, [active, count, goTo]);

  useEffect(() => {
    if (!lightboxOpen) return undefined;

    const onKey = (e) => {
      if (e.key === "Escape") setLightboxOpen(false);
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [lightboxOpen, goPrev, goNext]);

  if (!count) {
    return <div className="store-product-detail-noimg">No images</div>;
  }

  const current = images[active];

  return (
    <div className={`product-gallery${hasMultiple ? " product-gallery--multi" : ""}`}>
      <div className="product-gallery-desktop">
        <button
          type="button"
          className="detail-gallery-main detail-gallery-main--clickable"
          onClick={() => setLightboxOpen(true)}
          aria-label="Open image fullscreen"
        >
          <img
            key={fadeKey}
            src={current.url}
            alt={`${productName} — image ${active + 1}`}
            className="detail-gallery-main-img"
            loading="eager"
          />
        </button>
        {hasMultiple ? (
          <ul className="detail-gallery-thumbs" aria-label="Product images">
            {images.map((img, i) => (
              <li key={img.publicId || img.url || i}>
                <button
                  type="button"
                  className={`detail-gallery-thumb${i === active ? " detail-gallery-thumb--active" : ""}`}
                  onClick={() => goTo(i)}
                  aria-label={`Show image ${i + 1}`}
                  aria-current={i === active ? "true" : undefined}
                >
                  <img src={img.url} alt="" loading="lazy" />
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <div className="product-gallery-mobile">
        <div ref={trackRef} className="product-gallery-mobile-track" role="region" aria-label="Product images">
          {images.map((img, i) => (
            <figure key={img.publicId || img.url || i} className="product-gallery-mobile-slide">
              <button type="button" className="product-gallery-mobile-hit" onClick={() => { setActive(i); setLightboxOpen(true); }}>
                <img src={img.url} alt={`${productName} — ${i + 1} of ${count}`} loading={i === 0 ? "eager" : "lazy"} />
              </button>
            </figure>
          ))}
        </div>
        {hasMultiple ? (
          <>
            <span className="product-gallery-mobile-index" aria-live="polite">
              {active + 1} / {count}
            </span>
            <div className="product-gallery-dots product-gallery-dots--mobile" role="tablist" aria-label="Image navigation">
              {images.map((img, i) => (
                <button
                  key={img.publicId || img.url || i}
                  type="button"
                  role="tab"
                  aria-selected={i === active}
                  aria-label={`Image ${i + 1}`}
                  className={`hero-dot${i === active ? " hero-dot--active" : ""}`}
                  onClick={() => goTo(i)}
                />
              ))}
            </div>
          </>
        ) : null}
      </div>

      {lightboxOpen ? (
        <div
          className="lightbox-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Product image viewer"
          onClick={() => setLightboxOpen(false)}
        >
          <button type="button" className="lightbox-close" aria-label="Close" onClick={() => setLightboxOpen(false)}>
            ✕
          </button>
          {hasMultiple ? (
            <>
              <button
                type="button"
                className="lightbox-nav lightbox-nav--prev"
                aria-label="Previous image"
                onClick={(e) => {
                  e.stopPropagation();
                  goPrev();
                }}
              >
                ←
              </button>
              <button
                type="button"
                className="lightbox-nav lightbox-nav--next"
                aria-label="Next image"
                onClick={(e) => {
                  e.stopPropagation();
                  goNext();
                }}
              >
                →
              </button>
            </>
          ) : null}
          <img
            src={current.url}
            alt={productName}
            className="lightbox-image"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      ) : null}
    </div>
  );
}
