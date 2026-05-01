import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
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
        const s = data.settings || {};
        setSettings((prev) => ({ ...prev, ...s }));
      })
      .catch(() => {});
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
      category: product.category,
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
      if (form.id) await updateProduct(form.id, data);
      else await createProduct(data);
      clearForm();
      addToast("Saved", form.id ? "Product updated." : "Product added.", "success");
      await load();
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
    <div className="admin-body">
      <header className="store-header admin-topbar">
        <Link className="store-logo" to="/" aria-label="The Wyldrift storefront">
          <span>The</span>
          <strong>Wyldrift</strong>
        </Link>
        <nav className="nav-links" aria-label="Admin navigation">
          <Link to="/">Storefront</Link>
          <a href="#product-form">Add Product</a>
          {isAuthenticated ? (
            <button className="nav-button" type="button" onClick={onLogout}>
              Logout
            </button>
          ) : null}
        </nav>
      </header>

      <main className="admin-shell">
        {!isAuthenticated ? (
          <section className="login-panel" aria-labelledby="login-title">
            <LoginCard disabled={busy} onLogin={onLogin} />
          </section>
        ) : (
          <>
            <section className="admin-hero" aria-labelledby="admin-title">
              <div>
                <p className="eyebrow">Store manager</p>
                <h1 id="admin-title">Products</h1>
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

            <section className="admin-layout" id="admin-layout">
              <form className="admin-form" id="product-form" onSubmit={onSubmit}>
                <h2>{form.id ? "Update product" : "Add product"}</h2>
                {formError ? <div className="form-error" role="alert">{formError}</div> : null}

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
                    <option value="Accessories">Accessories</option>
                  </select>
                </label>

                <div className="form-grid-2">
                  <label>
                    Price
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
                    />
                  </label>
                </div>

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
                    placeholder="streetwear, cotton, new"
                  />
                </label>

                <label>
                  Product images
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/avif"
                    multiple
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []);
                      setLocalFiles(files);
                    }}
                  />
                </label>

                <div className="image-preview" aria-label="Image preview">
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
                    <p>No images selected.</p>
                  )}
                </div>

                <label className="toggle-row">
                  <input
                    checked={form.featured}
                    onChange={(e) => setForm((s) => ({ ...s, featured: e.target.checked }))}
                    type="checkbox"
                  />
                  Featured product
                </label>

                <label>
                  Product details
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
                    rows={4}
                    required
                    aria-invalid={fieldErrors.description ? "true" : "false"}
                  />
                  {fieldErrors.description ? <span className="field-error">{fieldErrors.description}</span> : null}
                </label>

                <label className="toggle-row">
                  <input
                    checked={form.active}
                    onChange={(e) => setForm((s) => ({ ...s, active: e.target.checked }))}
                    type="checkbox"
                  />
                  Show on storefront
                </label>

                <div className="form-actions">
                  <button type="submit" className="primary-button" disabled={busy}>
                    {busy ? "Saving..." : "Save product"}
                  </button>
                  <button type="button" className="secondary-button" onClick={clearForm} disabled={busy}>
                    Clear
                  </button>
                </div>
              </form>

              <section className="admin-products" aria-labelledby="list-title">
                <div className="list-toolbar">
                  <h2 id="list-title">Product listing</h2>
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
                          <p>{p.description}</p>
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
            </section>

            <section className="admin-layout" style={{ marginTop: 18 }}>
              <form
                className="admin-form"
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
                <h2>Homepage settings</h2>
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
                  Featured category (bento)
                  <select
                    value={settings.homeFeaturedCategory || "T-Shirts"}
                    onChange={(e) => setSettings((s) => ({ ...s, homeFeaturedCategory: e.target.value }))}
                  >
                    <option value="T-Shirts">T-Shirts</option>
                    <option value="Jeans">Jeans</option>
                    <option value="Shoes">Shoes</option>
                    <option value="Accessories">Accessories</option>
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
      <p className="eyebrow">Protected admin</p>
      <h1 id="login-title">Login</h1>
      <label>
        Admin passkey
        <input
          value={passkey}
          onChange={(e) => setPasskey(e.target.value)}
          type="password"
          autoComplete="current-password"
          required
        />
      </label>
      <button type="submit" className="primary-button" disabled={disabled}>
        {disabled ? "Signing in..." : "Login"}
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

