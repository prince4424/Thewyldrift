import React, { useEffect, useMemo, useRef, useState, useCallback, memo } from "react";
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

function ProductImageSlider({ product, seed }) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  
  // Get all images for the product
  const getAllImages = (product, seed) => {
    const images = [];
    
    // Add uploaded images if available
    if (product.images && Array.isArray(product.images) && product.images.length > 0) {
      product.images.forEach(img => {
        if (img.url) images.push(img.url);
      });
    }
    
    // Add fallback single image
    if (product.image) {
      images.push(product.image);
    }
    
    // If no images, generate placeholder
    if (images.length === 0) {
      const safe = String(seed || product.sku || product.id || "wyldrift").replace(/[^a-z0-9]/gi, "-");
      images.push(`https://picsum.photos/seed/${encodeURIComponent(safe)}/1000/900`);
    }
    
    return images;
  };
  
  const images = getAllImages(product, seed);
  
  // Auto-play functionality
  useEffect(() => {
    if (!isAutoPlaying || images.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % images.length);
    }, 3000); // Change image every 3 seconds
    
    return () => clearInterval(interval);
  }, [isAutoPlaying, images.length]);
  
  // Manual navigation functions
  const goToPrevious = () => {
    setIsAutoPlaying(false);
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };
  
  const goToNext = () => {
    setIsAutoPlaying(false);
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };
  
  const goToSlide = (index) => {
    setIsAutoPlaying(false);
    setCurrentImageIndex(index);
  };
  
  // If only one image, show regular image
  if (images.length <= 1) {
    return (
      <div className="product-image-wrap">
        <img src={images[0]} alt={product.productName} loading="lazy" />
      </div>
    );
  }
  
  return (
    <div className="product-image-slider">
      <div className="slider-container">
        <div className="slider-track" style={{ transform: `translateX(-${currentImageIndex * 100}%)` }}>
          {images.map((image, index) => (
            <div key={index} className="slide">
              <img src={image} alt={`${product.productName} - Image ${index + 1}`} loading="lazy" />
            </div>
          ))}
        </div>
        
        {/* Navigation arrows */}
        <button className="slider-arrow slider-prev" onClick={goToPrevious} aria-label="Previous image">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
          </svg>
        </button>
        <button className="slider-arrow slider-next" onClick={goToNext} aria-label="Next image">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
          </svg>
        </button>
        
        {/* Dots indicator */}
        <div className="slider-dots">
          {images.map((_, index) => (
            <button
              key={index}
              className={`slider-dot ${index === currentImageIndex ? 'active' : ''}`}
              onClick={() => goToSlide(index)}
              aria-label={`Go to image ${index + 1}`}
            />
          ))}
        </div>
        
        {/* Auto-play toggle */}
        <button 
          className={`auto-play-toggle ${isAutoPlaying ? 'playing' : 'paused'}`}
          onClick={() => setIsAutoPlaying(!isAutoPlaying)}
          aria-label={isAutoPlaying ? 'Pause slideshow' : 'Play slideshow'}
        >
          {isAutoPlaying ? (
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z"/>
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}

function BentoCard({ product, variantClass, onQuickAdd, onProductClick }) {
  const isSoldOut = Number(product.stock) <= 0;
  const hasDiscount = product.discountPrice && product.discountPrice < product.price;
  const discountPercentage = hasDiscount ? Math.round(((product.price - product.discountPrice) / product.price) * 100) : 0;
  const image = pickImage(product, `${product.category}-${product.sku}`);
  
  return (
    <article 
      className={`product-card ${variantClass} ${isSoldOut ? 'sold-out' : ''} ${hasDiscount ? 'has-discount' : ''} clickable-card`}
      onClick={() => onProductClick && onProductClick(product)}
    >
      <div className="product-image-wrap">
        <img src={image} alt={product.productName} loading="lazy" />
        
        {/* Discount badge */}
        {hasDiscount && (
          <div className="discount-badge">
            -{discountPercentage}%
          </div>
        )}
        
        {/* Stock indicator */}
        <div className={`stock-indicator ${isSoldOut ? 'sold-out' : 'in-stock'}`}>
          {isSoldOut ? 'Sold Out' : `${product.stock} left`}
        </div>

        <div className="product-overlay">
          <div className="product-info">
            <h3 className="product-title serif">{product.productName}</h3>
            <div className="price-info">
              {hasDiscount ? (
                <>
                  <span className="original-price">₹ {Number(product.price).toLocaleString("en-IN")}</span>
                  <span className="discount-price">{formatPrice(product)}</span>
                </>
              ) : (
                <span className="price-pill">{formatPrice(product)}</span>
              )}
            </div>
          </div>
        </div>

        <div className="quick-add" onClick={(e) => e.stopPropagation()}>
          <button type="button" onClick={onQuickAdd} disabled={isSoldOut}>
            {isSoldOut ? "Sold Out" : "Quick Add"}
          </button>
        </div>

        <a
          className={`whatsapp-fab ${isSoldOut ? "disabled" : ""}`}
          href={isSoldOut ? "#" : makeWhatsappUrl(product)}
          target="_blank"
          rel="noreferrer"
          aria-label={`Order ${product.productName} on WhatsApp`}
          onClick={(e) => {
            e.stopPropagation();
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

function ProductDetailModal({ product, isOpen, onClose, onQuickAdd }) {
  if (!isOpen || !product) return null;

  const isSoldOut = Number(product.stock) <= 0;
  const hasDiscount = product.discountPrice && product.discountPrice < product.price;
  const discountPercentage = hasDiscount ? Math.round(((product.price - product.discountPrice) / product.price) * 100) : 0;

  return (
    <div className="product-detail-modal-overlay" onClick={onClose}>
      <div className="product-detail-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close product details">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
          </svg>
        </button>

        <div className="modal-content">
          <div className="modal-image-section">
            <ProductImageSlider product={product} seed={`detail-${product.category}-${product.sku}`} />
          </div>

          <div className="modal-info-section">
            <div className="modal-header">
              <h1 className="modal-product-title serif">{product.productName}</h1>
              <div className="modal-category-badge">{product.category}</div>
            </div>

            <div className="modal-price-section">
              {hasDiscount ? (
                <div className="modal-price-info">
                  <span className="modal-original-price">₹ {Number(product.price).toLocaleString("en-IN")}</span>
                  <span className="modal-discount-price">{formatPrice(product)}</span>
                  <span className="modal-discount-badge">-{discountPercentage}% OFF</span>
                </div>
              ) : (
                <div className="modal-price-info">
                  <span className="modal-price">{formatPrice(product)}</span>
                </div>
              )}
            </div>

            <div className="modal-stock-section">
              <div className={`modal-stock-status ${isSoldOut ? 'sold-out' : 'in-stock'}`}>
                {isSoldOut ? 'Sold Out' : `${product.stock} items in stock`}
              </div>
            </div>

            {product.description && (
              <div className="modal-description">
                <h3>Description</h3>
                <p>{product.description}</p>
              </div>
            )}

            {product.sizes && product.sizes.length > 0 && (
              <div className="modal-sizes">
                <h3>Available Sizes</h3>
                <div className="size-options">
                  {product.sizes.map((size, index) => (
                    <span key={index} className="size-option">{size}</span>
                  ))}
                </div>
              </div>
            )}

            {product.colors && product.colors.length > 0 && (
              <div className="modal-colors">
                <h3>Available Colors</h3>
                <div className="color-options">
                  {product.colors.map((color, index) => (
                    <span key={index} className="color-option">{color}</span>
                  ))}
                </div>
              </div>
            )}

            <div className="modal-actions">
              <button 
                className="modal-quick-add" 
                onClick={() => onQuickAdd()}
                disabled={isSoldOut}
              >
                {isSoldOut ? "Sold Out" : "Quick Add to Cart"}
              </button>
              
              <a
                className={`modal-whatsapp-btn ${isSoldOut ? "disabled" : ""}`}
                href={isSoldOut ? "#" : makeWhatsappUrl(product)}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => {
                  if (isSoldOut) e.preventDefault();
                }}
              >
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91s-4.45-9.91-9.91-9.91zm0 17.75c-1.48 0-2.93-.38-4.13-1.09l-.3-.18-3.06.8.8-2.98-.19-.31c-.78-1.24-1.18-2.63-1.18-4.09 0-4.54 3.7-8.23 8.23-8.23s8.23 3.69 8.23 8.23c0 4.54-3.69 8.23-8.23 8.23z"/>
                  <path d="M9.05 7.24c-.24-.58-.73-.58-.97-.58h-.97c-.34 0-.87.13-1.32.63s-1.78 1.73-1.78 4.23 1.82 4.9 2.07 5.14c.24.24 3.56 5.43 8.62 7.61.3.13.58.2.85.2.34 0 .68-.13.97-.38.29-.24.48-.63.48-1.02 0-.15-.01-.29-.04-.43-.04-.15-.29-1.73-.41-2.37-.12-.63-.05-.87.15-1.07.19-.19.38-.29.58-.29s.39.1.58.29c.19.19.77.77 1.46 1.46.68.68 1.36 1.07 1.75 1.07s1.36-.39 2.05-1.07c.68-.68 1.07-1.36 1.07-1.75s-.39-1.36-1.07-2.05c-.68-.68-1.46-1.46-1.46-1.46z"/>
                </svg>
                {isSoldOut ? "Unavailable" : "Order on WhatsApp"}
              </a>
            </div>

            {product.tags && product.tags.length > 0 && (
              <div className="modal-tags">
                <div className="tags-list">
                  {product.tags.map((tag, index) => (
                    <span key={index} className="tag">#{tag}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function StorefrontPage() {
  const [products, setProducts] = useState([]);
  const [query, setQuery] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [cartCount, setCartCount] = useState(44);
  const [selectedProduct, setSelectedProduct] = useState(null);
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
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
    
    fetch("/api/products?active=true&limit=100", { 
      signal: controller.signal,
      headers: { 'Cache-Control': 'max-age=300' } // Cache for 5 minutes
    })
      .then((r) => {
        if (!r.ok) throw new Error('Failed to fetch products');
        return r.json();
      })
      .then((d) => setProducts(d.products || []))
      .catch((err) => {
        if (err.name !== 'AbortError') {
          console.error('Failed to load products:', err);
          setProducts([]);
        }
      })
      .finally(() => clearTimeout(timeoutId));
    
    return () => {
      controller.abort();
      clearTimeout(timeoutId);
    };
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout
    
    fetch("/api/settings", { 
      signal: controller.signal,
      headers: { 'Cache-Control': 'max-age=600' } // Cache for 10 minutes
    })
      .then((r) => {
        if (!r.ok) throw new Error('Failed to fetch settings');
        return r.json();
      })
      .then((data) => {
        if (data?.settings) {
          setSite((prev) => ({ ...prev, ...data.settings }));
          if (typeof data.settings.cartBadge === "number") setCartCount(data.settings.cartBadge);
        }
      })
      .catch((err) => {
        if (err.name !== 'AbortError') {
          console.error('Failed to load settings:', err);
        }
      })
      .finally(() => clearTimeout(timeoutId));
    
    return () => {
      controller.abort();
      clearTimeout(timeoutId);
    };
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

  const sectionId = useCallback((category) => {
    return category.toLowerCase().replace(/\s+/g, "-");
  }, []);

  function renderBento(category) {
    const list = byCategory.get(category) || [];
    const id = sectionId(category);
    
    return (
      <section key={category} className="product-group" id={id} aria-label={category}>
        <div className="section-title">
          <div className="section-title-left gold-left">
            <h2 className="serif">{category}</h2>
            <span className="section-kicker">All Products</span>
            {list.length > 0 && (
              <span className="product-count">{list.length} products</span>
            )}
          </div>
        </div>

        <div className={`category-products-grid ${list.length ? "stagger in" : ""}`}>
          {list.length > 0 ? (
            list.map((product) => (
              <BentoCard 
                key={product.id} 
                product={product} 
                variantClass="category-product" 
                onQuickAdd={() => setCartCount((c) => c + 1)}
                onProductClick={setSelectedProduct}
              />
            ))
          ) : (
            <div className="empty-category-message">
              <h4>No {category.toLowerCase()} available</h4>
              <p>Check back soon for new {category.toLowerCase()}!</p>
            </div>
          )}
        </div>
        {/* Upsell section - related products */}
        {list.length > 2 && (
          <div className="upsell-section">
            <h3 className="upsell-title">You might also like</h3>
            <div className="upsell-grid">
              {list.slice(1, 4).map((product, index) => (
                <div key={product.id} className="upsell-item">
                  <img src={pickImage(product, `upsell-${product.sku}`)} alt={product.productName} />
                  <div className="upsell-info">
                    <h4>{product.productName}</h4>
                    <span className="upsell-price">{formatPrice(product)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    );
  }

  return (
    <div className={`store-body ${menuOpen ? "menu-open" : ""} ${selectedProduct ? "modal-open" : ""}`}>
      <header className="modern-navbar">
        <div className="navbar-container">
          <div className="navbar-left">
            <a className="brand-logo" href="#top" aria-label="The Wyldrift home">
              <WyldriftLogo className="logo-svg" size={32} />
            </a>
          </div>

          <div className="navbar-center">
            <nav className="desktop-nav" aria-label="Main navigation">
              <Link to="#home" className="nav-link">Home</Link>
              <Link to="#shop" className="nav-link">Shop</Link>
              <Link to="#about" className="nav-link">About</Link>
              <Link to="#contact" className="nav-link">Contact</Link>
            </nav>
          </div>

          <div className="navbar-right">
            <div className="search-container">
              <input 
                type="text" 
                placeholder="Search products..."
                className="search-input"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <circle cx="11" cy="11" r="8"/>
                <path d="m21 21-4.35-4.35"/>
              </svg>
            </div>
            
            <Link to="/admin" className="icon-btn profile-btn" aria-label="Admin Profile">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5Zm0 2c-4.42 0-8 2.24-8 5v1h16v-1c0-2.76-3.58-5-8-5Z"/>
              </svg>
            </Link>

            <button className="icon-btn cart-btn" aria-label="Cart" onClick={() => alert('Cart feature coming soon!')}>
              <span className="cart-badge">{cartCount}</span>
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M7 8V7a5 5 0 0 1 10 0v1h2v13H5V8h2Zm2 0h6V7a3 3 0 0 0-6 0v1Z"/>
              </svg>
            </button>

            <button className="icon-btn whatsapp-btn" aria-label="WhatsApp">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91s-4.45-9.91-9.91-9.91zm0 17.75c-1.48 0-2.93-.38-4.13-1.09l-.3-.18-3.06.8.8-2.98-.19-.31c-.78-1.24-1.18-2.63-1.18-4.09 0-4.54 3.7-8.23 8.23-8.23s8.23 3.69 8.23 8.23c0 4.54-3.69 8.23-8.23 8.23z"/>
                <path d="M9.05 7.24c-.24-.58-.73-.58-.97-.58h-.97c-.34 0-.87.13-1.32.63s-1.78 1.73-1.78 4.23 1.82 4.9 2.07 5.14c.24.24 3.56 5.43 8.62 7.61.3.13.58.2.85.2.34 0 .68-.13.97-.38.29-.24.48-.63.48-1.02 0-.15-.01-.29-.04-.43-.04-.15-.29-1.73-.41-2.37-.12-.63-.05-.87.15-1.07.19-.19.38-.29.58-.29s.39.1.58.29c.19.19.77.77 1.46 1.46.68.68 1.36 1.07 1.75 1.07s1.36-.39 2.05-1.07c.68-.68 1.07-1.36 1.07-1.75s-.39-1.36-1.07-2.05c-.68-.68-1.46-1.46-1.46-1.46z"/>
              </svg>
            </button>

            <button
              className="mobile-menu-btn"
              type="button"
              aria-controls="mobile-nav"
              aria-expanded={menuOpen ? "true" : "false"}
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              onClick={() => setMenuOpen((v) => !v)}
            >
              <span className={`hamburger ${menuOpen ? 'active' : ''}`}>
                <span></span>
                <span></span>
                <span></span>
              </span>
            </button>
          </div>
        </div>
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
              <a 
                key={c} 
                className="category-tile" 
                href={`#${sectionId(c)}`}
                onClick={(e) => {
                  e.preventDefault();
                  const element = document.getElementById(sectionId(c));
                  if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }
                }}
              >
                <div className="category-icon">
                  {c === "T-Shirts" && (
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M7 2a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H7zm0 2h10v6H7V4zm1 1v4h8V5H8z"/>
                    </svg>
                  )}
                  {c === "Jeans" && (
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2V7zm0 8h2v2h-2v-2z"/>
                    </svg>
                  )}
                  {c === "Shoes" && (
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M2 18v2h20v-2H2zm1.5-2.5L3 13l9-4 9 4-.5 2.5-8.5-4-8.5 4z"/>
                    </svg>
                  )}
                  {c === "Accessories" && (
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2l-5.5 9h11L12 2zm0 3.84L13.93 9h-3.87L12 5.84zM17.5 13c-2.49 0-4.5 2.01-4.5 4.5s2.01 4.5 4.5 4.5 4.5-2.01 4.5-4.5-2.01-4.5-4.5-4.5zm0 7c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5zM3 21.5h8v-8H3v8zm2-6h4v4H5v-4z"/>
                    </svg>
                  )}
                </div>
                <h3>{c}</h3>
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

      <ProductDetailModal 
        product={selectedProduct}
        isOpen={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onQuickAdd={() => setCartCount((c) => c + 1)}
      />
    </div>
  );
}

