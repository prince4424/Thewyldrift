const WHATSAPP_BUSINESS_NUMBER = "918219672237";
const categories = ["T-Shirts", "Jeans", "Shoes", "Accessories"];
let allProducts = [];

const fallbackProducts = [
  {
    id: "sample-shoe-1",
    productName: "Nikee Dunk Street Pair",
    description: "Premium sneaker style with box packaging.",
    price: 25000,
    discountPrice: 3500,
    category: "Shoes",
    stock: 8,
    sku: "TW-SHOE-001",
    active: true,
    images: [{ url: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=80" }],
  },
  {
    id: "sample-shoe-2",
    productName: "White Air Street Sneaker",
    description: "Clean white sneaker for daily outfits.",
    price: 6200,
    discountPrice: 3700,
    category: "Shoes",
    stock: 12,
    sku: "TW-SHOE-002",
    active: true,
    images: [{ url: "https://images.unsplash.com/photo-1608231387042-66d1773070a5?auto=format&fit=crop&w=900&q=80" }],
  },
  {
    id: "sample-tee-1",
    productName: "Oversized Wyld Tee",
    description: "Soft cotton oversized tee.",
    price: 1299,
    discountPrice: 699,
    category: "T-Shirts",
    stock: 18,
    sku: "TW-TEE-001",
    active: true,
    images: [{ url: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=80" }],
  },
  {
    id: "sample-jeans-1",
    productName: "Straight Fit Denim",
    description: "Everyday blue denim jeans.",
    price: 2499,
    discountPrice: 1499,
    category: "Jeans",
    stock: 10,
    sku: "TW-JEAN-001",
    active: true,
    images: [{ url: "https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=900&q=80" }],
  },
];

const whatsappIcon = `
  <svg viewBox="0 0 32 32" aria-hidden="true" focusable="false">
    <path fill="currentColor" d="M16.02 3.2A12.7 12.7 0 0 0 5.1 22.38L3.5 28.8l6.56-1.54a12.72 12.72 0 1 0 5.96-24.06Zm0 22.9c-2 0-3.86-.58-5.44-1.58l-.42-.26-3.9.92.94-3.8-.28-.44A10.1 10.1 0 1 1 16.02 26.1Zm5.86-7.56c-.32-.16-1.9-.94-2.2-1.04-.3-.12-.52-.16-.74.16-.22.32-.84 1.04-1.04 1.26-.18.22-.38.24-.7.08-.32-.16-1.36-.5-2.58-1.6-.96-.86-1.6-1.9-1.8-2.22-.18-.32-.02-.5.14-.66.14-.14.32-.38.48-.56.16-.2.22-.32.32-.54.12-.22.06-.4-.02-.56-.08-.16-.74-1.78-1.02-2.44-.26-.64-.54-.56-.74-.56h-.64c-.22 0-.56.08-.86.4-.3.32-1.14 1.12-1.14 2.72s1.16 3.14 1.32 3.36c.16.22 2.28 3.48 5.52 4.88.78.34 1.38.54 1.84.68.78.24 1.48.2 2.04.12.62-.1 1.9-.78 2.16-1.52.26-.74.26-1.38.18-1.52-.08-.14-.3-.22-.62-.38Z"/>
  </svg>
`;

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

function formatOriginalPrice(product) {
  if (!product.discountPrice || Number(product.discountPrice) >= Number(product.price)) {
    return "";
  }

  return `₹${Number(product.price).toLocaleString("en-IN")}.00`;
}

function productCard(product) {
  const isSoldOut = Number(product.stock) <= 0;
  const image = product.images?.[0]?.url || product.image || "";

  return `
    <article class="product-card">
      <div class="product-image-wrap">
        <img src="${image}" alt="${product.productName}" loading="lazy" />
        <a class="whatsapp-fab ${isSoldOut ? "disabled" : ""}" href="${isSoldOut ? "#" : makeWhatsappUrl(product)}" target="_blank" rel="noreferrer" aria-label="Order ${product.productName} on WhatsApp">
          ${whatsappIcon}
        </a>
      </div>
      <div class="product-info">
        <h4>${product.productName}</h4>
        <p class="product-meta">${product.description}</p>
        <div class="price-row">
          <span class="price">${formatPrice(product)}</span>
          ${formatOriginalPrice(product) ? `<span class="compare-price">${formatOriginalPrice(product)}</span>` : ""}
        </div>
        <span class="stock-pill ${isSoldOut ? "sold-out" : ""}">
          ${isSoldOut ? "Sold out" : `${product.stock} in stock`}
        </span>
      </div>
    </article>
  `;
}

async function getProducts() {
  const response = await fetch("/api/products?active=true&limit=100");

  if (!response.ok) {
    throw new Error("Could not load products");
  }

  const data = await response.json();
  return data.products || [];
}

async function renderProducts() {
  allProducts = await getProducts();
  renderProductGroups(allProducts);
}

function renderProductGroups(products) {
  document.querySelectorAll(".product-grid").forEach((grid) => {
    const categoryProducts = products.filter((product) => product.category === grid.dataset.category);
    grid.innerHTML = categoryProducts.length
      ? categoryProducts.map(productCard).join("")
      : `<p class="empty-message">New ${grid.dataset.category.toLowerCase()} coming soon.</p>`;
  });
}

function setupSearch() {
  const form = document.querySelector("#store-search");
  const input = document.querySelector("#store-search-input");

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const query = input.value.trim().toLowerCase();
    const products = query
      ? allProducts.filter((product) =>
          [product.productName, product.category, product.description, product.sku].join(" ").toLowerCase().includes(query)
        )
      : allProducts;
    renderProductGroups(products);
    document.querySelector("#products").scrollIntoView({ behavior: "smooth" });
  });
}

function renderGeneralWhatsappLink() {
  const link = document.querySelector("#general-whatsapp");
  const message = "Hello The Wyldrift, I want to know more about your products.";
  link.href = `https://wa.me/${WHATSAPP_BUSINESS_NUMBER}?text=${encodeURIComponent(message)}`;
}

renderProducts().catch(() => {
  allProducts = fallbackProducts;
  renderProductGroups(fallbackProducts);
});
renderGeneralWhatsappLink();
setupSearch();
