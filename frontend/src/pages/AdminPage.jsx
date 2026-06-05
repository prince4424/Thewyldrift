import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import WyldriftLogo from "../components/WyldriftLogo.jsx";
import ToastStack from "../components/ToastStack.jsx";
import { useToasts } from "../hooks/useToasts.js";
import { clearToken, getToken, requestJson, setToken } from "../lib/http.js";
import { DEFAULT_PRODUCT_CATEGORY, PRODUCT_CATEGORIES } from "../lib/categories.js";
import ProductColorMatrix from "../components/ProductColorMatrix.jsx";
import { createProduct, deleteProduct, getAllProducts, updateProduct } from "../lib/products.js";
import {
  emptyColorGroup,
  flattenColorGroups,
  generateSkusForColorGroups,
  productToColorGroups,
  validateColorGroups,
} from "../lib/variantMatrix.js";

function newClientKey() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `variant-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function formatPrice(product) {
  const amount = product.discountPrice || product.price;
  return `Rs. ${Number(amount).toLocaleString("en-IN")}`;
}

const MAX_BANNER_IMAGES = 5;

function emptyBannerSlot() {
  return {
    clientKey: newClientKey(),
    existingImage: null,
    imageFile: null,
  };
}

function productToBannerRows(product) {
  if (!Array.isArray(product?.bannerImages) || !product.bannerImages.length) {
    return [];
  }

  return product.bannerImages.map((image) => ({
    clientKey: newClientKey(),
    existingImage: image,
    imageFile: null,
  }));
}

function buildFormData(form, variants, banners = []) {
  const data = new FormData();

  ["productName", "category", "price", "discountPrice", "description"].forEach((key) => {
    data.append(key, form[key] ?? "");
  });

  data.append("featured", Boolean(form.featured));
  data.append("active", Boolean(form.active));

  const filledBanners = banners.filter((row) => row.existingImage || row.imageFile);
  const bannerPayload = filledBanners.map((row) => ({
    ...(row.existingImage && !row.imageFile ? { existingImage: row.existingImage } : {}),
  }));
  data.append("bannerImages", JSON.stringify(bannerPayload));

  filledBanners.forEach((row, index) => {
    if (row.imageFile) {
      data.append(`bannerImage_${index}`, row.imageFile);
    }
  });

  const payload = variants.map((variant) => ({
    ...(variant._id ? { _id: variant._id } : {}),
    stock: Number(variant.stock) || 0,
    sku: variant.sku,
    color: variant.color,
    size: variant.size,
    ...(variant.existingImage && !variant.imageFile ? { existingImage: variant.existingImage } : {}),
  }));

  data.append("variants", JSON.stringify(payload));

  variants.forEach((variant, index) => {
    if (variant.imageFile) {
      data.append(`variantImage_${index}`, variant.imageFile);
    }
  });

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
    homeFeaturedCategory: DEFAULT_PRODUCT_CATEGORY,
    cartBadge: 44,
  });

  const [form, setForm] = useState({
    id: "",
    productName: "",
    category: DEFAULT_PRODUCT_CATEGORY,
    price: "",
    discountPrice: "",
    description: "",
    featured: false,
    active: true,
  });

  const [colorGroups, setColorGroups] = useState([emptyColorGroup()]);
  const [banners, setBanners] = useState([]);

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
        if (!PRODUCT_CATEGORIES.includes(s.homeFeaturedCategory)) {
          s.homeFeaturedCategory = DEFAULT_PRODUCT_CATEGORY;
        }
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
    return products.filter((p) => {
      const variantSkus = (p.variants || []).map((v) => v.sku).join(" ");
      return [p.productName, p.category, p.sku, variantSkus, p.description, (p.tags || []).join(" ")]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
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
      category: DEFAULT_PRODUCT_CATEGORY,
      price: "",
      discountPrice: "",
      description: "",
      featured: false,
      active: true,
    });
    setColorGroups([emptyColorGroup()]);
    setBanners([]);
  }

  function editProduct(product) {
    setForm({
      id: product.id,
      productName: product.productName,
      category: PRODUCT_CATEGORIES.includes(product.category) ? product.category : DEFAULT_PRODUCT_CATEGORY,
      price: product.price,
      discountPrice: product.discountPrice || "",
      description: product.description,
      featured: Boolean(product.featured),
      active: Boolean(product.active),
    });
    setColorGroups(productToColorGroups(product));
    setBanners(productToBannerRows(product));
    setAdminPanel("add");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function updateBanner(clientKey, patch) {
    setBanners((rows) => rows.map((row) => (row.clientKey === clientKey ? { ...row, ...patch } : row)));
  }

  function addBannerSlot() {
    setBanners((rows) => (rows.length >= MAX_BANNER_IMAGES ? rows : [...rows, emptyBannerSlot()]));
  }

  function removeBannerSlot(clientKey) {
    setBanners((rows) => rows.filter((row) => row.clientKey !== clientKey));
  }

  function updateColorGroup(clientKey, patch) {
    setColorGroups((rows) => rows.map((row) => (row.clientKey === clientKey ? { ...row, ...patch } : row)));
  }

  function addColorGroup() {
    setColorGroups((rows) => [...rows, emptyColorGroup()]);
  }

  function removeColorGroup(clientKey) {
    setColorGroups((rows) => (rows.length <= 1 ? rows : rows.filter((row) => row.clientKey !== clientKey)));
  }

  function autoGenerateAllSkus() {
    if (!form.productName?.trim()) {
      addToast("Product name required", "Enter a product name before generating SKUs.", "danger");
      return;
    }
    setColorGroups((rows) => generateSkusForColorGroups(form, rows));
    addToast("SKUs generated", "SKUs filled for every color × size.", "success");
  }

  async function onSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setFormError("");
    setFieldErrors({});

    const matrixError = validateColorGroups(colorGroups);
    if (matrixError) {
      setFormError(matrixError);
      setBusy(false);
      return;
    }

    const variants = flattenColorGroups(colorGroups);

    try {
      const data = buildFormData(form, variants, banners);
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
                  <p className="admin-hub-lede">Pick one step. Add apparel by color, sizes, and stock in a grid.</p>
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
                      <span className="admin-hub-card-desc">Name, banners, price, then colors with sizes and stock in a simple grid.</span>
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
              <div className="admin-mode admin-mode--add admin-mode-add-shell">
                <nav className="admin-panel-nav admin-panel-nav--add" aria-label="Admin sections">
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
                      {form.id
                        ? "Editing the selected product. Save to push changes live."
                        : "Add each color once, pick its sizes, set stock in the grid, and upload one photo per color."}
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
                        {PRODUCT_CATEGORIES.map((category) => (
                          <option key={category} value={category}>
                            {category}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>

                  <div className="admin-form-section">
                    <div className="admin-variant-section-head">
                      <div>
                        <h3 className="admin-form-section-title">Banner images</h3>
                        <p className="admin-form-hint">
                          Optional gallery images for the product page. Add up to {MAX_BANNER_IMAGES} (shown before variant photos).
                        </p>
                      </div>
                      {banners.length < MAX_BANNER_IMAGES ? (
                        <button type="button" className="secondary-button admin-variant-add" onClick={addBannerSlot}>
                          + Add banner
                        </button>
                      ) : null}
                    </div>

                    {banners.length ? (
                      <div className="admin-banner-list">
                        {banners.map((row, index) => (
                          <article key={row.clientKey} className="admin-banner-card">
                            <div className="admin-variant-card-head">
                              <strong>Banner {index + 1}</strong>
                              <button type="button" className="admin-variant-remove" onClick={() => removeBannerSlot(row.clientKey)}>
                                Remove
                              </button>
                            </div>

                            <label className="admin-file-field admin-variant-image-field">
                              <span className="admin-file-label-text">Banner image</span>
                              <input
                                className="admin-input-file"
                                type="file"
                                accept="image/png,image/jpeg,image/webp,image/avif"
                                onChange={(e) => {
                                  const file = e.target.files?.[0] || null;
                                  updateBanner(row.clientKey, { imageFile: file });
                                }}
                              />
                            </label>

                            <VariantImagePreview
                              file={row.imageFile}
                              savedUrl={!row.imageFile ? row.existingImage?.url : null}
                              label={row.imageFile ? "New" : "Saved"}
                              emptyMessage="Choose an image for this banner slot."
                            />
                          </article>
                        ))}
                      </div>
                    ) : (
                      <p className="admin-form-hint admin-banner-empty">No banner images yet. Use “Add banner” if you want a product gallery.</p>
                    )}
                  </div>

                  <div className="admin-form-section">
                    <h3 className="admin-form-section-title">Pricing</h3>
                    <div className="form-grid-2">
                      <label>
                        Price each unit (₹)
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
                        Discount price (optional)
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
                    <ProductColorMatrix
                      colorGroups={colorGroups}
                      productName={form.productName}
                      onChangeGroup={updateColorGroup}
                      onAddColor={addColorGroup}
                      onRemoveColor={removeColorGroup}
                      onAutoGenerateSkus={autoGenerateAllSkus}
                    />
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
                        <img src={p.bannerImages?.[0]?.url || p.images?.[0]?.url || p.image || ""} alt={p.productName} loading="lazy" />
                        <div className="admin-product-main">
                          <div>
                            <h3>{p.productName}</h3>
                            <p>
                              {p.category} | {formatPrice(p)} | {(p.variants || []).length || 1} variant
                              {(p.variants || []).length === 1 ? "" : "s"}
                            </p>
                          </div>
                          <p className="admin-product-desc">{p.description}</p>
                          <div className="admin-badges">
                            <span>{p.active ? "Live" : "Hidden"}</span>
                            <span>{p.featured ? "Featured" : "Standard"}</span>
                            <span className={Number(p.stock) <= 0 ? "danger" : ""}>
                              {p.stock} total stock
                              {(p.variants || []).length
                                ? ` · ${[...new Set((p.variants || []).map((v) => v.size))].join(", ")}`
                                : ""}
                            </span>
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
                    value={settings.homeFeaturedCategory || DEFAULT_PRODUCT_CATEGORY}
                    onChange={(e) => setSettings((s) => ({ ...s, homeFeaturedCategory: e.target.value }))}
                  >
                    {PRODUCT_CATEGORIES.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
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

function VariantImagePreview({ file, savedUrl, label, emptyMessage = "Image required for this row." }) {
  const [objectUrl, setObjectUrl] = useState("");
  const [lightboxOpen, setLightboxOpen] = useState(false);

  useEffect(() => {
    if (!file) {
      setObjectUrl("");
      return undefined;
    }
    const url = URL.createObjectURL(file);
    setObjectUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  useEffect(() => {
    if (!lightboxOpen) return undefined;

    const onKey = (event) => {
      if (event.key === "Escape") setLightboxOpen(false);
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [lightboxOpen]);

  const previewSrc = objectUrl || savedUrl || "";

  if (!previewSrc) {
    return (
      <div className="admin-variant-preview admin-variant-preview--empty" aria-label="Variant image preview">
        <p className="image-preview-empty">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <>
      <div className="admin-variant-preview" aria-label="Variant image preview">
        <button
          type="button"
          className="admin-variant-preview-frame"
          onClick={() => setLightboxOpen(true)}
          aria-label={`View full size — ${label}`}
        >
          <img src={previewSrc} alt="Product preview" loading="lazy" />
          <span className="admin-variant-preview-badge">{label}</span>
          <span className="admin-variant-preview-hint">Tap to view full size</span>
        </button>
      </div>

      {lightboxOpen ? (
        <div
          className="admin-image-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label="Full size product image"
          onClick={() => setLightboxOpen(false)}
        >
          <button type="button" className="admin-image-lightbox-close" onClick={() => setLightboxOpen(false)}>
            Close
          </button>
          <img src={previewSrc} alt="Product full view" onClick={(e) => e.stopPropagation()} />
        </div>
      ) : null}
    </>
  );
}

