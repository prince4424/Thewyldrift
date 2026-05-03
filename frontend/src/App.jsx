import React, { Suspense, lazy } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import StorefrontPage from "./pages/StorefrontPage.jsx";
import AdminPage from "./pages/AdminPage.jsx";

const ProductDetailPage = lazy(() => import("./pages/ProductDetailPage.jsx"));
// code 
function ProductDetailFallback() {
  return (
    <div className="store-body store-theme-light" style={{ padding: "clamp(24px, 5vw, 48px)", textAlign: "center" }}>
      <p className="serif" style={{ margin: 0, fontSize: "1.1rem", color: "rgba(20,20,20,0.72)" }}>
        Loading product…
      </p>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<StorefrontPage />} />
      <Route
        path="/product/:id"
        element={
          <Suspense fallback={<ProductDetailFallback />}>
            <ProductDetailPage />
          </Suspense>
        }
      />
      <Route path="/admin" element={<AdminPage />} />
      <Route path="/admin.html" element={<Navigate to="/admin" replace />} />
      <Route path="/index.html" element={<Navigate to="/" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

