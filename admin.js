const tokenKey = "thewyldriftAdminToken";
const loginPanel = document.querySelector("#login-panel");
const adminHero = document.querySelector(".admin-hero");
const adminLayout = document.querySelector("#admin-layout");
const loginForm = document.querySelector("#login-form");
const loginMessage = document.querySelector("#login-message");
const logoutButton = document.querySelector("#logout-button");
const form = document.querySelector("#product-form");
const formTitle = document.querySelector("#form-title");
const formMessage = document.querySelector("#form-message");
const resetButton = document.querySelector("#reset-form");
const productList = document.querySelector("#admin-product-list");
const searchInput = document.querySelector("#search");
const imagePreview = document.querySelector("#image-preview");
const fields = [
  "product-id",
  "existing-images",
  "productName",
  "category",
  "price",
  "discountPrice",
  "stock",
  "sku",
  "sizes",
  "colors",
  "tags",
  "images",
  "featured",
  "description",
  "active",
].reduce((items, id) => ({ ...items, [id]: document.getElementById(id) }), {});

let products = [];

function getToken() {
  return localStorage.getItem(tokenKey);
}

function setAuthenticated(isAuthenticated) {
  loginPanel.hidden = isAuthenticated;
  adminHero.hidden = !isAuthenticated;
  adminLayout.hidden = !isAuthenticated;
  logoutButton.hidden = !isAuthenticated;
}

async function requestJson(url, options = {}) {
  const headers = new Headers(options.headers || {});

  if (getToken()) {
    headers.set("Authorization", `Bearer ${getToken()}`);
  }

  if (!(options.body instanceof FormData) && options.body) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || data.error || "Request failed");
  }

  return data;
}

function createFormData() {
  const data = new FormData();
  const existingImages = fields["existing-images"].value || "[]";

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
  ].forEach((key) => data.append(key, fields[key].value));

  data.append("featured", fields.featured.checked);
  data.append("active", fields.active.checked);
  data.append("existingImages", existingImages);

  Array.from(fields.images.files).forEach((file) => data.append("images", file));

  return data;
}

function formatPrice(product) {
  const amount = product.discountPrice || product.price;
  return `Rs. ${Number(amount).toLocaleString("en-IN")}`;
}

function renderImagePreview(images = []) {
  imagePreview.innerHTML = images.length
    ? images
        .map(
          (image) => `
            <div>
              <img src="${image.url}" alt="Product image" />
              <span>Saved</span>
            </div>
          `
        )
        .join("")
    : `<p>No saved images yet.</p>`;
}

function setForm(product) {
  fields["product-id"].value = product.id;
  fields["existing-images"].value = JSON.stringify(product.images || []);
  fields.productName.value = product.productName;
  fields.category.value = product.category;
  fields.price.value = product.price;
  fields.discountPrice.value = product.discountPrice || "";
  fields.stock.value = product.stock;
  fields.sku.value = product.sku;
  fields.sizes.value = (product.sizes || []).join(", ");
  fields.colors.value = (product.colors || []).join(", ");
  fields.tags.value = (product.tags || []).join(", ");
  fields.description.value = product.description;
  fields.featured.checked = product.featured;
  fields.active.checked = product.active;
  fields.images.value = "";
  formTitle.textContent = "Update product";
  formMessage.textContent = "Add new images only if you want to append them.";
  renderImagePreview(product.images || []);
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function clearForm() {
  form.reset();
  fields["product-id"].value = "";
  fields["existing-images"].value = "[]";
  fields.stock.value = 1;
  fields.active.checked = true;
  fields.featured.checked = false;
  formTitle.textContent = "Add product";
  formMessage.textContent = "";
  renderImagePreview();
}

function updateStats() {
  document.querySelector("#total-products").textContent = products.length;
  document.querySelector("#live-products").textContent = products.filter((product) => product.active).length;
  document.querySelector("#total-stock").textContent = products.reduce((sum, product) => sum + Number(product.stock), 0);
}

function productRow(product) {
  const status = product.active ? "Live" : "Hidden";
  const stockClass = Number(product.stock) <= 0 ? "danger" : "";
  const thumbnail = product.images?.[0]?.url || product.image || "";

  return `
    <article class="admin-product-card">
      <img src="${thumbnail}" alt="${product.productName}" loading="lazy" />
      <div class="admin-product-main">
        <div>
          <h3>${product.productName}</h3>
          <p>${product.category} | ${formatPrice(product)} | ${product.sku}</p>
        </div>
        <p>${product.description}</p>
        <div class="admin-badges">
          <span>${status}</span>
          <span>${product.featured ? "Featured" : "Standard"}</span>
          <span class="${stockClass}">${product.stock} in stock</span>
        </div>
      </div>
      <div class="admin-card-actions">
        <button type="button" data-action="edit" data-id="${product.id}">Edit</button>
        <button type="button" data-action="delete" data-id="${product.id}">Delete</button>
      </div>
    </article>
  `;
}

function renderProducts() {
  const query = searchInput.value.trim().toLowerCase();
  const visibleProducts = products.filter((product) =>
    [product.productName, product.category, product.sku, product.description, (product.tags || []).join(" ")]
      .join(" ")
      .toLowerCase()
      .includes(query)
  );

  productList.innerHTML = visibleProducts.length
    ? visibleProducts.map(productRow).join("")
    : `<p class="empty-message">No products found.</p>`;
  updateStats();
}

async function loadProducts() {
  const data = await requestJson("/api/products?limit=100");
  products = data.products || [];
  renderProducts();
}

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  loginMessage.textContent = "";

  try {
    const data = await requestJson("/api/admin/login", {
      method: "POST",
      body: JSON.stringify({ passkey: document.querySelector("#passkey").value }),
    });
    localStorage.setItem(tokenKey, data.token);
    setAuthenticated(true);
    await loadProducts();
  } catch (error) {
    loginMessage.textContent = error.message;
  }
});

logoutButton.addEventListener("click", () => {
  localStorage.removeItem(tokenKey);
  setAuthenticated(false);
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const id = fields["product-id"].value;
  const submitButton = form.querySelector("[type='submit']");
  submitButton.disabled = true;
  formMessage.textContent = "Saving...";

  try {
    await requestJson(id ? `/api/products/${id}` : "/api/products", {
      method: id ? "PUT" : "POST",
      headers: { "Idempotency-Key": crypto.randomUUID() },
      body: createFormData(),
    });

    clearForm();
    formMessage.textContent = id ? "Product updated." : "Product added.";
    await loadProducts();
  } catch (error) {
    formMessage.textContent = error.message;
  } finally {
    submitButton.disabled = false;
  }
});

resetButton.addEventListener("click", clearForm);
searchInput.addEventListener("input", renderProducts);

productList.addEventListener("click", async (event) => {
  const button = event.target.closest("button");

  if (!button) return;

  const product = products.find((item) => item.id === button.dataset.id);

  if (button.dataset.action === "edit" && product) {
    setForm(product);
  }

  if (button.dataset.action === "delete" && product && confirm(`Delete ${product.productName}?`)) {
    await requestJson(`/api/products/${product.id}`, {
      method: "DELETE",
      headers: { "Idempotency-Key": crypto.randomUUID() },
    });
    await loadProducts();
  }
});

setAuthenticated(Boolean(getToken()));
clearForm();

if (getToken()) {
  loadProducts().catch((error) => {
    localStorage.removeItem(tokenKey);
    setAuthenticated(false);
    loginMessage.textContent = error.message;
  });
}
