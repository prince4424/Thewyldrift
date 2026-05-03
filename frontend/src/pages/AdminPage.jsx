import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import WyldriftLogo from "../components/WyldriftLogo.jsx";
import ToastStack from "../components/ToastStack.jsx";
import { useToasts } from "../hooks/useToasts.js";
import { clearToken, getToken, requestJson, setToken } from "../lib/http.js";
import { createProduct, deleteProduct, getAllProducts, updateProduct } from "../lib/products.js";

function formatPrice(product) {
  const amount = product.discountPrice || product.price;
  return `Rs. ${Number(amount).toLocaleString("en-IN")}`;
}

function toCsvArray(value) {
  return String(value || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function toCommaString(list) {
  return Array.isArray(list) ? list.join(", ") : "";
}

function buildFormData(form, existingImagesJson, imageFiles) {
  const data = new FormData();
  const existingImages = existingImagesJson || "[]";

  [
    "productName",
    "category",
    "price",
    "discountPrice",
    "stock",
    "sku",
    "sizes",
    "colors",
    "tags",
    "description",
  ].forEach((key) => data.append(key, form[key] ?? ""));

  data.append("featured", Boolean(form.featured));
  data.append("active", Boolean(form.active));
  data.append("existingImages", existingImages);

  (imageFiles || []).forEach((file) => data.append("images", file));
  return data;
}

export default function AdminPage() {
  const { toasts, addToast, removeToast } = useToasts();
  const [isAuthenticated, setIsAuthenticated] = useState(Boolean(getToken()));
  const [busy, setBusy] = useState(false);
  const [products, setProducts] = useState([]);
  const [query, setQuery] = useState("");
  /** After login: hub (two choices), add (full form), or list (products + settings). */
  const [adminPanel, setAdminPanel] = useState("hub");
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [settingsBusy, setSettingsBusy] = useState(false);
  const [settings, setSettings] = useState({
    homeCategoryKicker: "Shop",
    homeCategoryTitle: "By Category",
    homeLatestTitle: "Latest Products",
    homeFeaturedCategory: "T-Shirts",
    cartBadge: 44,
  });

  const [form, setForm] = useState({
    id: "",
    productName: "",
    category: "T-Shirts",
    price: "",
    discountPrice: "",
    stock: 1,
    sku: "",
    sizes: "",
    colors: "",
    tags: "",
    description: "",
    featured: false,
    active: true,
  });

  const [existingImagesJson, setExistingImagesJson] = useState("[]");
  const [savedImages, setSavedImages] = useState([]);
  const [localFiles, setLocalFiles] = useState([]);
  const fileInputRef = useRef(null);

  async function load() {
    setBusy(true);
    try {
      const list = await getAllProducts();
      setProducts(list);
    } catch (e) {
      addToast("Load failed", e.message, "danger");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    if (!isAuthenticated) return;
    load();
    // Load current site settings for the CMS panel.
    requestJson("/api/admin/settings")
      .then((data) => {
        const s = { ...(data.settings || {}) };
        if (s.homeFeaturedCategory === "Accessories") s.homeFeaturedCategory = "Shirts";
        setSettings((prev) => ({ ...prev, ...s }));
      })
      .catch(() => {});
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) setAdminPanel("hub");
  }, [isAuthenticated]);

  const visibleProducts = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) =>
      [p.productName, p.category, p.sku, p.description, (p.tags || []).join(" ")].join(" ").toLowerCase().includes(q)
    );
  }, [products, query]);

  const stats = useMemo(() => {
    const total = products.length;
    const live = products.filter((p) => p.active).length;
    const stock = products.reduce((sum, p) => sum + Number(p.stock || 0), 0);
    return { total, live, stock };
  }, [products]);

  async function onLogin(passkey) {
    setBusy(true);
    try {
      const data = await requestJson("/api/admin/login", {
        method: "POST",
        body: JSON.stringify({ passkey }),
      });
      setToken(data.token);
      setIsAuthenticated(true);
      addToast("Welcome back", "You’re now signed in.", "success");
    } catch (e) {
      addToast("Login failed", e.message, "danger");
    } finally {
      setBusy(false);
    }
  }

  function onLogout() {
    if (!confirm("Log out of admin?")) return;
    clearToken();
    setIsAuthenticated(false);
    setProducts([]);
    addToast("Logged out", "You’ve been signed out.", "info");
  }

  function clearForm() {
    setForm({
      id: "",
      productName: "",
      category: "T-Shirts",
      price: "",
      discountPrice: "",
      stock: 1,
      sku: "",
      sizes: "",
      colors: "",
      tags: "",
      description: "",
      featured: false,
      active: true,
    });
    setExistingImagesJson("[]");
    setSavedImages([]);
    setLocalFiles([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function editProduct(product) {
    setForm({
      id: product.id,
      productName: product.productName,
      category: product.category === "Accessories" ? "Shirts" : product.category,
      price: product.price,
      discountPrice: product.discountPrice || "",
      stock: product.stock,
      sku: product.sku,
      sizes: toCommaString(product.sizes),
      colors: toCommaString(product.colors),
      tags: toCommaString(product.tags),
      description: product.description,
      featured: Boolean(product.featured),
      active: Boolean(product.active),
    });
    const images = product.images || [];
    setExistingImagesJson(JSON.stringify(images));
    setSavedImages(images);
    setLocalFiles([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setAdminPanel("add");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function onSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setFormError("");
    setFieldErrors({});
    try {
      const payload = {
        ...form,
        sizes: form.sizes,
        colors: form.colors,
        tags: form.tags,
      };
      // Server expects CSV strings; it parses them.
      const data = buildFormData(payload, existingImagesJson, localFiles);
      const wasUpdate = Boolean(form.id);
      if (form.id) await updateProduct(form.id, data);
      else await createProduct(data);
      clearForm();
      addToast("Saved", wasUpdate ? "Product updated." : "Product added.", "success");
      await load();
      setAdminPanel("list");
    } catch (err) {
      const rawErrors = Array.isArray(err?.validationErrors)
        ? err.validationErrors
        : Array.isArray(err?.payload?.errors)
          ? err.payload.errors
          : [];

      if (rawErrors.length) {
        const nextFieldErrors = {};
        rawErrors.forEach((msg) => {
          const match = String(msg).match(/"([^"]+)"/);
          const field = match?.[1];
          if (field) nextFieldErrors[field] = String(msg);
        });
        setFieldErrors(nextFieldErrors);
        setFormError(rawErrors.join(" "));
      } else {
        setFormError(err?.message || "Save failed");
      }

      addToast("Save failed", err?.message || "Save failed", "danger");
    } finally {
      setBusy(false);
    }
  }

  async function onDelete(product) {
    if (!confirm(`Delete ${product.productName}?`)) return;
    setBusy(true);
    try {
      await deleteProduct(product.id);
      addToast("Deleted", `${product.productName} removed.`, "success");
      await load();
    } catch (err) {
      addToast("Delete failed", err.message, "danger");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="admin-body store-theme-light">
      <header className="store-header admin-header">
        <Link className="store-logo" to="/" aria-label="Back to The Wyldrift storefront">
          <WyldriftLogo className="logo-svg" size={28} tone="light" />
        </Link>
        {isAuthenticated ? (
          <nav className="store-actions store-actions--minimal admin-header-nav" aria-label="Admin navigation">
            <button className="admin-nav-pill admin-nav-pill--danger" type="button" onClick={onLogout}>
              Log out
            </button>
          </nav>
        ) : null}
        <span className="nav-gold-rule" aria-hidden="true" />
      </header>

      <main className="admin-shell">
        {!isAuthenticated ? (
          <section className="login-panel admin-login-panel" aria-labelledby="login-title">
            <LoginCard disabled={busy} onLogin={onLogin} />
          </section>
        ) : (
          <>
            {adminPanel === "hub" ? (
              <>
                <section className="admin-hero" aria-labelledby="admin-title">
                  <div>
                    <p className="eyebrow">Store manager</p>
                    <h1 id="admin-title" className="serif">
                      Dashboard
                    </h1>
                  </div>
                  <div className="admin-stats" aria-label="Store stats">
                    <div>
                      <span>Total</span>
                      <strong>{stats.total}</strong>
                    </div>
                    <div>
                      <span>Live</span>
                      <strong>{stats.live}</strong>
                    </div>
                    <div>
                      <span>Stock</span>
                      <strong>{stats.stock}</strong>
                    </div>
                  </div>
                </section>

                <section className="admin-hub" aria-label="Choose a task">
                  <p className="admin-hub-lede">Pick one step. The product form is unchanged — same fields as before.</p>
                  <div className="admin-hub-grid">
                    <button
                      type="button"
                      className="admin-hub-card"
                      onClick={() => {
                        clearForm();
                        setAdminPanel("add");
                      }}
                    >
                      <span className="admin-hub-card-kicker">Create</span>
                      <span className="admin-hub-card-title">Add new product</span>
                      <span className="admin-hub-card-desc">Full add / edit form with every field you already use.</span>
                    </button>
                    <button type="button" className="admin-hub-card" onClick={() => setAdminPanel("list")}>
                      <span className="admin-hub-card-kicker">Manage</span>
                      <span className="admin-hub-card-title">View product listing</span>
                      <span className="admin-hub-card-desc">Search, edit, delete, and homepage settings below the list.</span>
                    </button>
                  </div>
                  <p className="admin-hub-foot">
                    <Link to="/">← Storefront</Link>
                  </p>
                </section>
              </>
            ) : null}

            {adminPanel === "add" ? (
              <div className="admin-mode admin-mode--add">
                <nav className="admin-panel-nav" aria-label="Admin sections">
                  <button
                    type="button"
                    className="admin-panel-nav-btn"
                    onClick={() => {
                      clearForm();
                      setAdminPanel("hub");
                    }}
                  >
                    ← Dashboard
                  </button>
                  <button type="button" className="admin-panel-nav-btn admin-panel-nav-btn--secondary" onClick={() => setAdminPanel("list")}>
                    View listing
                  </button>
                </nav>
                <form className="admin-form admin-product-form admin-form--fullwidth" id="product-form" onSubmit={onSubmit}>
                  <div className="admin-form-head">
                    <p className="admin-form-kicker">Catalogue</p>
                    <h2 className="admin-form-title serif">{form.id ? "Update product" : "Add product"}</h2>
                    <p className="admin-form-lede">
                      {form.id ? "Editing the selected product. Save to push changes live." : "Create a new product. At least one image is required to save."}
                    </p>
                  </div>

                  {formError ? <div className="form-error" role="alert">{formError}</div> : null}

                  <div className="admin-form-section">
                    <h3 className="admin-form-section-title">Basics</h3>
                    <label>
                      Product name
                      <input
                        value={form.productName}
                        onChange={(e) => setForm((s) => ({ ...s, productName: e.target.value }))}
                        type="text"
                        required
                      />
                    </label>

                    <label>
                      Category
                      <select value={form.category} onChange={(e) => setForm((s) => ({ ...s, category: e.target.value }))}>
                        <option value="T-Shirts">T-Shirts</option>
                        <option value="Jeans">Jeans</option>
                        <option value="Shoes">Shoes</option>
                        <option value="Shirts">Shirts</option>
                      </select>
                    </label>
                  </div>

                  <div className="admin-form-section">
                    <h3 className="admin-form-section-title">Pricing</h3>
                    <div className="form-grid-2">
                      <label>
                        Price (₹)
                        <input
                          value={form.price}
                          onChange={(e) => setForm((s) => ({ ...s, price: e.target.value }))}
                          type="number"
                          min="0"
                          step="1"
                          required
                        />
                      </label>

                      <label>
                        Discount price
                        <input
                          value={form.discountPrice}
                          onChange={(e) => setForm((s) => ({ ...s, discountPrice: e.target.value }))}
                          type="number"
                          min="0"
                          step="1"
                          placeholder="Optional"
                        />
                      </label>
                    </div>
                  </div>

                  <div className="admin-form-section">
                    <h3 className="admin-form-section-title">Inventory</h3>
                    <div className="form-grid-2">
                      <label>
                        Stock
                        <input
                          value={form.stock}
                          onChange={(e) => setForm((s) => ({ ...s, stock: e.target.value }))}
                          type="number"
                          min="0"
                          step="1"
                          required
                        />
                      </label>

                      <label>
                        SKU
                        <input value={form.sku} onChange={(e) => setForm((s) => ({ ...s, sku: e.target.value }))} required />
                      </label>
                    </div>
                  </div>

                  <div className="admin-form-section">
                    <h3 className="admin-form-section-title">Attributes</h3>
                    <p className="admin-form-hint">Comma-separated lists.</p>
                    <div className="form-grid-3">
                      <label>
                        Sizes
                        <input
                          value={form.sizes}
                          onChange={(e) => setForm((s) => ({ ...s, sizes: e.target.value }))}
                          placeholder="S, M, L, XL"
                        />
                      </label>

                      <label>
                        Colors
                        <input
                          value={form.colors}
                          onChange={(e) => setForm((s) => ({ ...s, colors: e.target.value }))}
                          placeholder="Black, White"
                        />
                      </label>

                      <label>
                        Tags
                        <input
                          value={form.tags}
                          onChange={(e) => setForm((s) => ({ ...s, tags: e.target.value }))}
                          placeholder="streetwear, new"
                        />
                      </label>
                    </div>
                  </div>

                  <div className="admin-form-section">
                    <h3 className="admin-form-section-title">Images</h3>
                    <p className="admin-form-hint">PNG, JPEG, WebP or AVIF — up to 8 files.</p>
                    <label className="admin-file-field">
                      <span className="admin-file-label-text">Choose files</span>
                      <input
                        ref={fileInputRef}
                        className="admin-input-file"
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/avif"
                        multiple
                        onChange={(e) => {
                          const files = Array.from(e.target.files || []);
                          setLocalFiles(files);
                        }}
                      />
                    </label>

                    <div className="image-preview image-preview--admin" aria-label="Image preview">
                      {localFiles.length || savedImages.length ? (
                        <>
                          {localFiles.map((f) => (
                            <PreviewTile key={f.name + f.size} file={f} label="New" />
                          ))}
                          {savedImages.map((img) => (
                            <div key={img.publicId || img.url}>
                              <img src={img.url} alt="Product image" loading="lazy" />
                              <span>Saved</span>
                            </div>
                          ))}
                        </>
                      ) : (
                        <p className="image-preview-empty">No images yet. Add files above.</p>
                      )}
                    </div>
                  </div>

                  <div className="admin-form-section">
                    <h3 className="admin-form-section-title">Visibility</h3>
                    <label className="toggle-row">
                      <input
                        checked={form.featured}
                        onChange={(e) => setForm((s) => ({ ...s, featured: e.target.checked }))}
                        type="checkbox"
                      />
                      Featured product
                    </label>

                    <label className="toggle-row">
                      <input
                        checked={form.active}
                        onChange={(e) => setForm((s) => ({ ...s, active: e.target.checked }))}
                        type="checkbox"
                      />
                      Show on storefront
                    </label>
                  </div>

                  <div className="admin-form-section">
                    <h3 className="admin-form-section-title">Description</h3>
                    <label>
                      Details
                      <textarea
                        value={form.description}
                        onChange={(e) => {
                          const value = e.target.value;
                          setForm((s) => ({ ...s, description: value }));
                          if (fieldErrors.description) {
                            setFieldErrors((prev) => {
                              const copy = { ...prev };
                              delete copy.description;
                              return copy;
                            });
                          }
                        }}
                        rows={5}
                        required
                        aria-invalid={fieldErrors.description ? "true" : "false"}
                      />
                      {fieldErrors.description ? <span className="field-error">{fieldErrors.description}</span> : null}
                    </label>
                  </div>

                  <div className="form-actions admin-form-footer-actions">
                    <button type="submit" className="primary-button" disabled={busy}>
                      {busy ? "Saving…" : "Save product"}
                    </button>
                    <button type="button" className="secondary-button" onClick={clearForm} disabled={busy}>
                      Clear form
                    </button>
                  </div>
                </form>
              </div>
            ) : null}

            {adminPanel === "list" ? (
              <div className="admin-mode admin-mode--list">
                <nav className="admin-panel-nav" aria-label="Admin sections">
                  <button type="button" className="admin-panel-nav-btn" onClick={() => setAdminPanel("hub")}>
                    ← Dashboard
                  </button>
                  <button
                    type="button"
                    className="admin-panel-nav-btn admin-panel-nav-btn--secondary"
                    onClick={() => {
                      clearForm();
                      setAdminPanel("add");
                    }}
                  >
                    Add new product
                  </button>
                </nav>
                <div className="admin-products-panel admin-products-panel--solo">
                <section className="admin-products" aria-labelledby="list-title">
                <div className="list-toolbar">
                  <h2 id="list-title" className="serif">
                    Product listing
                  </h2>
                  <div className="search-field">
                    <input
                      type="search"
                      placeholder="Search products"
                      aria-label="Search products"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                    />
                    <span className="search-hint" aria-hidden="true">
                      Ctrl /
                    </span>
                  </div>
                </div>

                <div className="admin-product-list">
                  {visibleProducts.length ? (
                    visibleProducts.map((p) => (
                      <article key={p.id} className="admin-product-card">
                        <img src={p.images?.[0]?.url || p.image || ""} alt={p.productName} loading="lazy" />
                        <div className="admin-product-main">
                          <div>
                            <h3>{p.productName}</h3>
                            <p>
                              {p.category} | {formatPrice(p)} | {p.sku}
                            </p>
                          </div>
                          <p className="admin-product-desc">{p.description}</p>
                          <div className="admin-badges">
                            <span>{p.active ? "Live" : "Hidden"}</span>
                            <span>{p.featured ? "Featured" : "Standard"}</span>
                            <span className={Number(p.stock) <= 0 ? "danger" : ""}>{p.stock} in stock</span>
                          </div>
                        </div>
                        <div className="admin-card-actions">
                          <button type="button" onClick={() => editProduct(p)}>
                            Edit
                          </button>
                          <button type="button" onClick={() => onDelete(p)}>
                            Delete
                          </button>
                        </div>
                      </article>
                    ))
                  ) : (
                    <p className="empty-message">{busy ? "Loading products…" : "No products found."}</p>
                  )}
                </div>
              </section>
              </div>

            <section className="admin-settings-section">
              <form
                className="admin-form admin-settings-form"
                onSubmit={async (e) => {
                  e.preventDefault();
                  setSettingsBusy(true);
                  try {
                    await requestJson("/api/admin/settings", {
                      method: "PUT",
                      body: JSON.stringify({
                        homeCategoryKicker: settings.homeCategoryKicker,
                        homeCategoryTitle: settings.homeCategoryTitle,
                        homeLatestTitle: settings.homeLatestTitle,
                        homeFeaturedCategory: settings.homeFeaturedCategory,
                        cartBadge: Number(settings.cartBadge || 0),
                      }),
                    });
                    addToast("Saved", "Homepage settings updated.", "success");
                  } catch (err) {
                    addToast("Save failed", err?.message || "Could not save settings", "danger");
                  } finally {
                    setSettingsBusy(false);
                  }
                }}
              >
                <div className="admin-form-head">
                  <p className="admin-form-kicker">Site copy</p>
                  <h2 className="admin-form-title serif">Homepage settings</h2>
                  <p className="admin-form-lede">Controls headings on the public shop (where still used).</p>
                </div>
                <label>
                  Category kicker
                  <input
                    value={settings.homeCategoryKicker || ""}
                    onChange={(e) => setSettings((s) => ({ ...s, homeCategoryKicker: e.target.value }))}
                    placeholder="Shop"
                  />
                </label>
                <label>
                  Category title
                  <input
                    value={settings.homeCategoryTitle || ""}
                    onChange={(e) => setSettings((s) => ({ ...s, homeCategoryTitle: e.target.value }))}
                    placeholder="By Category"
                  />
                </label>
                <label>
                  Latest section title
                  <input
                    value={settings.homeLatestTitle || ""}
                    onChange={(e) => setSettings((s) => ({ ...s, homeLatestTitle: e.target.value }))}
                    placeholder="Latest Products"
                  />
                </label>
                <label>
                  Featured category (section order)
                  <select
                    value={settings.homeFeaturedCategory || "T-Shirts"}
                    onChange={(e) => setSettings((s) => ({ ...s, homeFeaturedCategory: e.target.value }))}
                  >
                    <option value="T-Shirts">T-Shirts</option>
                    <option value="Jeans">Jeans</option>
                    <option value="Shoes">Shoes</option>
                    <option value="Shirts">Shirts</option>
                  </select>
                </label>
                <label>
                  Cart badge number
                  <input
                    type="number"
                    min="0"
                    max="999"
                    value={settings.cartBadge ?? 44}
                    onChange={(e) => setSettings((s) => ({ ...s, cartBadge: e.target.value }))}
                  />
                </label>
                <div className="form-actions">
                  <button type="submit" className="primary-button" disabled={settingsBusy}>
                    {settingsBusy ? "Saving..." : "Save homepage"}
                  </button>
                </div>
              </form>
            </section>
              </div>
            ) : null}
          </>
        )}
      </main>

      <ToastStack toasts={toasts} onRemove={removeToast} />
    </div>
  );
}

function LoginCard({ disabled, onLogin }) {
  const [passkey, setPasskey] = useState("");
  return (
    <form
      className="admin-form login-form"
      onSubmit={(e) => {
        e.preventDefault();
        onLogin(passkey);
      }}
    >
      <p className="eyebrow">Multi-factor gate</p>
      <h1 id="login-title" className="serif">
        MFA required
      </h1>
      <p className="admin-login-mfa-blurb">
        This workspace is locked behind <strong>time-based MFA</strong>. Open your authenticator app (Google Authenticator,
        Authy, 1Password, etc.), find <strong>The Wyldrift — Admin</strong>, and enter the <strong>6-digit code</strong>{" "}
        below. Codes rotate every 30 seconds. If you lost your device, use a <strong>backup recovery code</strong> instead
        of the rotating digits.
      </p>
      <label>
        MFA verification code
        <input
          value={passkey}
          onChange={(e) => setPasskey(e.target.value)}
          type="password"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          placeholder="6-digit code or recovery key"
          maxLength={128}
          required
        />
      </label>
      <p className="admin-login-mfa-hint" aria-hidden="true">
        Tip: spaces are ignored. Never share this code with anyone — support will never ask for it.
      </p>
      <button type="submit" className="primary-button" disabled={disabled}>
        {disabled ? "Verifying MFA…" : "Verify MFA & enter"}
      </button>
      <p className="form-message" role="status" />
    </form>
  );
}

function PreviewTile({ file, label }) {
  const [src, setSrc] = useState("");
  useEffect(() => {
    const url = URL.createObjectURL(file);
    setSrc(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);
  return (
    <div>
      <img src={src} alt="Product image" loading="lazy" />
      <span>{label}</span>
    </div>
  );
}

