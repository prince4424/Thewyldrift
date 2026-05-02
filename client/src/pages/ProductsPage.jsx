import React, { useEffect, useMemo, useState } from "react";
import { createProduct, deleteProduct, getAllProducts, updateProduct } from "../lib/products.js";
import { requestJson } from "../lib/http.js";
import { useToasts } from "../hooks/useToasts.js";
import ToastStack from "../components/ToastStack.jsx";

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

export default function ProductsPage() {
  const { toasts, addToast, removeToast } = useToasts();
  const [busy, setBusy] = useState(false);
  const [products, setProducts] = useState([]);
  const [query, setQuery] = useState("");
  const [form, setForm] = useState({
    productName: "",
    category: "T-Shirts",
    price: "",
    discountPrice: "",
    stock: "",
    sku: "",
    sizes: "",
    colors: "",
    tags: "",
    description: "",
    featured: false,
    active: true,
    existingImages: "[]",
  });
  const [formError, setFormError] = useState("");
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);

  const visibleProducts = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) =>
      [p.productName, p.category, p.description, p.sku]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [products, query]);

  const stats = useMemo(() => {
    const total = products.length;
    const live = products.filter((p) => p.active).length;
    const stock = products.filter((p) => Number(p.stock) > 0).length;
    return { total, live, stock };
  }, [products]);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setBusy(true);
    try {
      const all = await getAllProducts();
      setProducts(all);
    } catch (e) {
      addToast("Load failed", e.message, "danger");
    } finally {
      setBusy(false);
    }
  }

  async function onSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setFormError("");
    try {
      const data = buildFormData(form, form.existingImages, imageFiles);
      if (form.id) {
        await updateProduct(form.id, data);
        addToast("Updated", "Product updated successfully.", "success");
      } else {
        await createProduct(data);
        addToast("Created", "Product created successfully.", "success");
      }
      resetForm();
      load();
    } catch (e) {
      setFormError(e.message);
    } finally {
      setBusy(false);
    }
  }

  function resetForm() {
    setForm({
      productName: "",
      category: "T-Shirts",
      price: "",
      discountPrice: "",
      stock: "",
      sku: "",
      sizes: "",
      colors: "",
      tags: "",
      description: "",
      featured: false,
      active: true,
      existingImages: "[]",
    });
    setImageFiles([]);
    setImagePreviews([]);
    setFormError("");
  }

  function editProduct(product) {
    setForm({
      ...product,
      sizes: toCommaString(product.sizes),
      colors: toCommaString(product.colors),
      tags: toCommaString(product.tags),
      existingImages: JSON.stringify(product.images || []),
    });
    setImagePreviews(product.images || []);
    setImageFiles([]);
    setFormError("");
  }

  async function onDelete(product) {
    if (!confirm(`Delete "${product.productName}"?`)) return;
    setBusy(true);
    try {
      await deleteProduct(product.id);
      addToast("Deleted", "Product deleted successfully.", "success");
      load();
    } catch (e) {
      addToast("Delete failed", e.message, "danger");
    } finally {
      setBusy(false);
    }
  }

  function handleImageChange(e) {
    const files = Array.from(e.target.files);
    setImageFiles(files);
    
    // Create previews
    const previews = files.map(file => URL.createObjectURL(file));
    setImagePreviews(previews);
  }

  function removeImagePreview(index) {
    const newFiles = imageFiles.filter((_, i) => i !== index);
    const newPreviews = imagePreviews.filter((_, i) => i !== index);
    setImageFiles(newFiles);
    setImagePreviews(newPreviews);
  }

  return (
    <div className="flex">
      {/* Left Panel - Form */}
      <div className="w-1/2 p-6 bg-white border-r border-gray-200">
        <div className="max-w-lg">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            {form.id ? "Update Product" : "Add Product"}
          </h2>
          
          {formError && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-md">
              {formError}
            </div>
          )}

          <form onSubmit={onSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Product Name
              </label>
              <input
                type="text"
                value={form.productName}
                onChange={(e) => setForm((s) => ({ ...s, productName: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                value={form.category}
                onChange={(e) => setForm((s) => ({ ...s, category: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="T-Shirts">T-Shirts</option>
                <option value="Jeans">Jeans</option>
                <option value="Shoes">Shoes</option>
                <option value="Accessories">Accessories</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price
                </label>
                <input
                  type="number"
                  value={form.price}
                  onChange={(e) => setForm((s) => ({ ...s, price: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="0"
                  step="1"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Discount Price
                </label>
                <input
                  type="number"
                  value={form.discountPrice}
                  onChange={(e) => setForm((s) => ({ ...s, discountPrice: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="0"
                  step="1"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Stock
                </label>
                <input
                  type="number"
                  value={form.stock}
                  onChange={(e) => setForm((s) => ({ ...s, stock: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="0"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  SKU
                </label>
                <input
                  type="text"
                  value={form.sku}
                  onChange={(e) => setForm((s) => ({ ...s, sku: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sizes (comma-separated)
              </label>
              <input
                type="text"
                value={form.sizes}
                onChange={(e) => setForm((s) => ({ ...s, sizes: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="S, M, L, XL"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Colors (comma-separated)
              </label>
              <input
                type="text"
                value={form.colors}
                onChange={(e) => setForm((s) => ({ ...s, colors: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Black, White, Blue"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tags (comma-separated)
              </label>
              <input
                type="text"
                value={form.tags}
                onChange={(e) => setForm((s) => ({ ...s, tags: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="new, summer, sale"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={form.description}
                onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={4}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Product Images
              </label>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              
              {imagePreviews.length > 0 && (
                <div className="mt-4 grid grid-cols-3 gap-4">
                  {imagePreviews.map((preview, index) => (
                    <div key={index} className="relative">
                      <img
                        src={preview}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-24 object-cover rounded-md"
                      />
                      <button
                        type="button"
                        onClick={() => removeImagePreview(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center space-x-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={form.featured}
                  onChange={(e) => setForm((s) => ({ ...s, featured: e.target.checked }))}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">Featured</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={(e) => setForm((s) => ({ ...s, active: e.target.checked }))}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">Active</span>
              </label>
            </div>

            <div className="flex space-x-4">
              <button
                type="submit"
                disabled={busy}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {busy ? "Saving..." : (form.id ? "Update Product" : "Add Product")}
              </button>
              
              {form.id && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>
      </div>

      {/* Right Panel - Product List */}
      <div className="w-1/2 p-6 bg-gray-50">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Product Listing</h2>
        
        {/* Search */}
        <div className="relative mb-4">
          <input
            type="search"
            placeholder="Search products..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <svg
            className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        
        {/* Product List */}
        {visibleProducts.length ? (
          <div className="space-y-4">
            {visibleProducts.map((product) => (
              <div
                key={product.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start space-x-4">
                  <img
                    src={product.images?.[0]?.url || product.image || ""}
                    alt={product.productName}
                    className="w-20 h-20 object-cover rounded-md"
                    loading="lazy"
                  />
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 truncate">
                          {product.productName}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">
                          {product.category} • {formatPrice(product)} • {product.sku}
                        </p>
                        <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                          {product.description}
                        </p>
                      </div>
                      
                      <div className="flex space-x-2 ml-4">
                        <button
                          onClick={() => editProduct(product)}
                          className="px-3 py-1.5 text-sm font-medium text-blue-700 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => onDelete(product)}
                          className="px-3 py-1.5 text-sm font-medium text-red-700 bg-red-50 rounded-md hover:bg-red-100 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4 mt-3">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          product.active
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {product.active ? "Live" : "Hidden"}
                      </span>
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          product.featured
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {product.featured ? "Featured" : "Standard"}
                      </span>
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          Number(product.stock) <= 0
                            ? "bg-red-100 text-red-800"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {product.stock} in stock
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-500">
              {busy ? "Loading products..." : "No products found."}
            </div>
          </div>
        )}
      </div>

      <ToastStack toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
