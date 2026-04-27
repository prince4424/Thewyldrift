const form = document.querySelector("#product-form");
const formTitle = document.querySelector("#form-title");
const formMessage = document.querySelector("#form-message");
const resetButton = document.querySelector("#reset-form");
const productList = document.querySelector("#admin-product-list");
const searchInput = document.querySelector("#search");
const fields = ["product-id", "name", "category", "price", "stock", "image", "details", "active"].reduce(
  (items, id) => ({ ...items, [id]: document.getElementById(id) }),
  {}
);

let products = [];

async function requestJson(url, options = {}) {
  const response = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
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
    price: fields.price.value,
    stock: fields.stock.value,
    image: fields.image.value,
    details: fields.details.value,
    active: fields.active.checked,
  };
}

function setForm(product) {
  fields["product-id"].value = product.id;
  fields.name.value = product.name;
  fields.category.value = product.category;
  fields.price.value = product.price;
  fields.stock.value = product.stock;
  fields.image.value = product.image;
  fields.details.value = product.details;
  fields.active.checked = product.active;
  formTitle.textContent = "Update product";
  formMessage.textContent = "";
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function clearForm() {
  form.reset();
  fields["product-id"].value = "";
  fields.stock.value = 1;
  fields.active.checked = true;
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

loadProducts().catch((error) => {
  productList.innerHTML = `<p class="empty-message">${error.message}</p>`;
});
