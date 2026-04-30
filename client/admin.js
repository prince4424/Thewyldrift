const form = document.querySelector("#product-form");
const formTitle = document.querySelector("#form-title");
const formMessage = document.querySelector("#form-message");
const resetButton = document.querySelector("#reset-form");
const productList = document.querySelector("#admin-product-list");
const searchInput = document.querySelector("#search");
const loginForm = document.querySelector("#login-form");
const loginMessage = document.querySelector("#login-message");
const loginSection = document.querySelector("#login-section");
const adminContent = document.querySelector("#admin-content");
const fields = ["product-id", "name", "category", "sizes", "price", "stock", "image", "details", "active"].reduce(
  (items, id) => ({ ...items, [id]: document.getElementById(id) }),
  {}
);
const imageFileInput = document.querySelector("#image-file");
const imagePreview = document.querySelector("#image-preview");
let currentPreviewUrl = "";

let products = [];
let isAuthenticated = false;
let adminPassword = "";

function getAuthHeaders() {
  return isAuthenticated ? { "X-Admin-Password": adminPassword } : {};
}

async function requestJson(url, options = {}) {
  const requestUrl = url.startsWith("http")
    ? url
    : `${API_BASE}${url}`;

  const headers = { ...getAuthHeaders() };

  if (options.body) {
    headers["Content-Type"] = "application/json";
  }

  let response;
  try {
    response = await fetch(requestUrl, {
      headers,
      ...options,
    });
  } catch (error) {
    throw new Error(error.message || "Network request failed");
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || "Request failed");
  }

  return data;
}

function getFormData() {
  return {
    name: fields.name.value,
    category: fields.category.value,
    sizes: Array.from(fields.sizes.selectedOptions).map((option) => option.value),
    price: fields.price.value,
    stock: fields.stock.value,
    image: fields.image.value,
    details: fields.details.value,
    active: fields.active.checked,
  };
}

function showPreview(src) {
  if (!imagePreview) return;
  if (currentPreviewUrl) {
    URL.revokeObjectURL(currentPreviewUrl);
    currentPreviewUrl = "";
  }

  imagePreview.innerHTML = "";
  if (!src) {
    imagePreview.classList.remove("has-preview");
    return;
  }

  const img = document.createElement("img");
  img.src = src;
  img.alt = "Selected product image preview";
  imagePreview.appendChild(img);
  imagePreview.classList.add("has-preview");
}

function clearPreview() {
  showPreview("");
}

function hasFileToUpload() {
  return imageFileInput && imageFileInput.files && imageFileInput.files.length > 0;
}

if (fields.image) {
  fields.image.addEventListener("input", () => {
    if (!hasFileToUpload()) {
      showPreview(fields.image.value.trim());
    }
  });
}

if (imageFileInput) {
  imageFileInput.addEventListener("change", () => {
    if (hasFileToUpload()) {
      const file = imageFileInput.files[0];
      const previewUrl = URL.createObjectURL(file);
      currentPreviewUrl = previewUrl;
      showPreview(previewUrl);
    } else {
      showPreview(fields.image.value.trim());
    }
  });
}

async function uploadFile(file) {
  const reader = new FileReader();

  return new Promise((resolve, reject) => {
    reader.onload = async () => {
      try {
        const fileData = reader.result;
        const data = await requestJson("/api/upload", {
          method: "POST",
          body: JSON.stringify({ fileName: file.name, fileData }),
        });

        resolve(data.url);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => reject(new Error("Failed to read image file"));
    reader.readAsDataURL(file);
  });
}

function setForm(product) {
  fields["product-id"].value = product.id;
  fields.name.value = product.name;
  fields.category.value = product.category;
  Array.from(fields.sizes.options).forEach((option) => {
    option.selected = Array.isArray(product.sizes) && product.sizes.includes(option.value);
  });
  fields.price.value = product.price;
  fields.stock.value = product.stock;
  fields.image.value = product.image;
  fields.details.value = product.details;
  fields.active.checked = product.active;
  if (imageFileInput) {
    imageFileInput.value = "";
  }
  showPreview(product.image);
  formTitle.textContent = "Update product";
  formMessage.textContent = "";
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function clearForm() {
  form.reset();
  fields["product-id"].value = "";
  fields.stock.value = 1;
  fields.active.checked = true;
  if (imageFileInput) {
    imageFileInput.value = "";
  }
  clearPreview();
  formTitle.textContent = "Add product";
  formMessage.textContent = "";
}

function updateStats() {
  document.querySelector("#total-products").textContent = products.length;
  document.querySelector("#live-products").textContent = products.filter((product) => product.active).length;
  document.querySelector("#total-stock").textContent = products.reduce((sum, product) => sum + Number(product.stock), 0);
}

function productRow(product) {
  const status = product.active ? "Live" : "Hidden";
  const stockClass = Number(product.stock) <= 0 ? "danger" : "";

  return `
    <article class="admin-product-card">
      <img src="${product.image}" alt="${product.name}" loading="lazy" />
      <div class="admin-product-main">
        <div>
          <h3>${product.name}</h3>
          <p>${product.category} | ${product.price}</p>
          <p class="admin-product-sizes">Sizes: ${product.sizes?.join(", ") || "N/A"}</p>
        </div>
        <p>${product.details}</p>
        <div class="admin-badges">
          <span>${status}</span>
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
    [product.name, product.category, product.price, product.details].join(" ").toLowerCase().includes(query)
  );

  productList.innerHTML = visibleProducts.length
    ? visibleProducts.map(productRow).join("")
    : `<p class="empty-message">No products found.</p>`;
  updateStats();
}

async function loadProducts() {
  products = await requestJson("/api/products");
  renderProducts();
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const id = fields["product-id"].value;
  const payload = getFormData();

  try {
    if (hasFileToUpload()) {
      const file = imageFileInput.files[0];
      const imageUrl = await uploadFile(file);
      payload.image = imageUrl;
      showPreview(imageUrl);
    }

    if (id) {
      await requestJson(`/api/products/${id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      formMessage.textContent = "Product updated.";
    } else {
      await requestJson("/api/products", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      formMessage.textContent = "Product added.";
    }

    clearForm();
    await loadProducts();
  } catch (error) {
    formMessage.textContent = error.message;
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

  if (button.dataset.action === "delete" && product && confirm(`Delete ${product.name}?`)) {
    await requestJson(`/api/products/${product.id}`, { method: "DELETE" });
    await loadProducts();
  }
});

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const password = document.querySelector("#login-password").value;

  try {
    const data = await requestJson("/api/admin/login", {
      method: "POST",
      body: JSON.stringify({ password }),
    });

    if (data.ok) {
      isAuthenticated = true;
      adminPassword = password;
      loginSection.style.display = "none";
      adminContent.style.display = "block";
      loginMessage.textContent = "";
      await loadProducts();
      return;
    }

    loginMessage.textContent = "Incorrect password.";
  } catch (error) {
    loginMessage.textContent = error.message;
  }
});

loadProducts().catch((error) => {
  productList.innerHTML = `<p class="empty-message">${error.message}</p>`;
});
