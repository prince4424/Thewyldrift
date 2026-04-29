const WHATSAPP_BUSINESS_NUMBER = "918219672237";
const categories = ["T-Shirts", "Jeans", "Shoes", "Accessories"];

const whatsappIcon = `
  <svg viewBox="0 0 32 32" aria-hidden="true" focusable="false">
    <path fill="currentColor" d="M16.02 3.2A12.7 12.7 0 0 0 5.1 22.38L3.5 28.8l6.56-1.54a12.72 12.72 0 1 0 5.96-24.06Zm0 22.9c-2 0-3.86-.58-5.44-1.58l-.42-.26-3.9.92.94-3.8-.28-.44A10.1 10.1 0 1 1 16.02 26.1Zm5.86-7.56c-.32-.16-1.9-.94-2.2-1.04-.3-.12-.52-.16-.74.16-.22.32-.84 1.04-1.04 1.26-.18.22-.38.24-.7.08-.32-.16-1.36-.5-2.58-1.6-.96-.86-1.6-1.9-1.8-2.22-.18-.32-.02-.5.14-.66.14-.14.32-.38.48-.56.16-.2.22-.32.32-.54.12-.22.06-.4-.02-.56-.08-.16-.74-1.78-1.02-2.44-.26-.64-.54-.56-.74-.56h-.64c-.22 0-.56.08-.86.4-.3.32-1.14 1.12-1.14 2.72s1.16 3.14 1.32 3.36c.16.22 2.28 3.48 5.52 4.88.78.34 1.38.54 1.84.68.78.24 1.48.2 2.04.12.62-.1 1.9-.78 2.16-1.52.26-.74.26-1.38.18-1.52-.08-.14-.3-.22-.62-.38Z"/>
  </svg>
`;

function makeWhatsappUrl(product) {
  const message = [
    "Hello The Wyldrift, I want to order this product:",
    `Product: ${product.name}`,
    `Category: ${product.category}`,
    `Price: ${product.price}`,
    `Details: ${product.details}`,
  ].join("\n");

  return `https://wa.me/${WHATSAPP_BUSINESS_NUMBER}?text=${encodeURIComponent(message)}`;
}

function productCard(product) {
  const isSoldOut = Number(product.stock) <= 0;

  return `
    <article class="product-card">
      <img src="${product.image}" alt="${product.name}" loading="lazy" />
      <div class="product-info">
        <div class="product-title-row">
          <h4>${product.name}</h4>
          <span class="price">${product.price}</span>
        </div>
        <p class="product-meta">${product.details}</p>
        <span class="stock-pill ${isSoldOut ? "sold-out" : ""}">
          ${isSoldOut ? "Sold out" : `${product.stock} in stock`}
        </span>
        <a class="whatsapp-link ${isSoldOut ? "disabled" : ""}" href="${isSoldOut ? "#" : makeWhatsappUrl(product)}" target="_blank" rel="noreferrer" aria-label="Order ${product.name} on WhatsApp">
          ${whatsappIcon}
          <span>${isSoldOut ? "Currently unavailable" : "Order on WhatsApp"}</span>
        </a>
      </div>
    </article>
  `;
}

async function getProducts() {
  const response = await fetch("/api/products");

  if (!response.ok) {
    throw new Error("Could not load products");
  }

  return response.json();
}

async function renderProducts() {
  const products = (await getProducts()).filter((product) => product.active);

  document.querySelectorAll(".product-grid").forEach((grid) => {
    const categoryProducts = products.filter((product) => product.category === grid.dataset.category);
    grid.innerHTML = categoryProducts.length
      ? categoryProducts.map(productCard).join("")
      : `<p class="empty-message">New ${grid.dataset.category.toLowerCase()} coming soon.</p>`;
  });
}

function renderGeneralWhatsappLink() {
  const link = document.querySelector("#general-whatsapp");
  const message = "Hello The Wyldrift, I want to know more about your products.";
  link.href = `https://wa.me/${WHATSAPP_BUSINESS_NUMBER}?text=${encodeURIComponent(message)}`;
}

renderProducts().catch(() => {
  document.querySelectorAll(".product-grid").forEach((grid) => {
    grid.innerHTML = `<p class="empty-message">Products could not load. Please try again.</p>`;
  });
});
renderGeneralWhatsappLink();
