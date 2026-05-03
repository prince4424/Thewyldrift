import { generateIdempotencyKey, requestJson } from "./http.js";

export async function getProductById(id) {
  const data = await requestJson(`/api/products/${encodeURIComponent(id)}`);
  return data?.product ?? null;
}

export async function getActiveProducts() {
  const data = await requestJson("/api/products?active=true&limit=100");
  return data.products || [];
}

export async function getAllProducts() {
  const data = await requestJson("/api/admin/products?limit=500");
  return Array.isArray(data?.products) ? data.products : [];
}

export async function createProduct(formData) {
  await requestJson("/api/products", {
    method: "POST",
    headers: { "Idempotency-Key": generateIdempotencyKey() },
    body: formData,
  });
}

export async function updateProduct(id, formData) {
  await requestJson(`/api/products/${id}`, {
    method: "PUT",
    headers: { "Idempotency-Key": generateIdempotencyKey() },
    body: formData,
  });
}

export async function deleteProduct(id) {
  await requestJson(`/api/products/${id}`, {
    method: "DELETE",
    headers: { "Idempotency-Key": generateIdempotencyKey() },
  });
}

