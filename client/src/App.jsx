import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import StorefrontPage from "./pages/StorefrontPage.jsx";
import AdminPage from "./pages/AdminPage.jsx";
import AdminLayout from "./components/AdminLayout.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import ProductsPage from "./pages/ProductsPage.jsx";

// Admin wrapper component that handles authentication
function AdminWrapper({ Component }) {
  return (
    <AdminLayout>
      <Component />
    </AdminLayout>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<StorefrontPage />} />
      <Route path="/admin" element={<AdminPage />} />
      <Route path="/admin/dashboard" element={<AdminWrapper Component={DashboardPage} />} />
      <Route path="/admin/products" element={<AdminWrapper Component={ProductsPage} />} />
            <Route path="/admin/orders" element={<AdminWrapper Component={() => <div className="p-6"><h1 className="text-2xl font-bold">Orders Page (Coming Soon)</h1></div>} />} />
      <Route path="/admin.html" element={<Navigate to="/admin" replace />} />
      <Route path="/index.html" element={<Navigate to="/" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

