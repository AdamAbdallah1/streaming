import { Routes, Route, Navigate } from "react-router-dom";
import { useState } from "react";
import ErrorBoundary from "./components/ui/ErrorBoundary";
import Storefront from "./pages/Storefront";
import Product from "./pages/Product";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import OrderStatus from "./pages/OrderStatus";
import Login from "./pages/Login";
import Admin from "./pages/Admin";
import { findService } from "./lib/catalog";
import { useCatalog } from "./hooks/useCatalog";
import { ROUTES, STORAGE_KEYS } from "./lib/config";

function readStoredAuth() {
  return (
    localStorage.getItem(STORAGE_KEYS.adminAuth) === "true" ||
    sessionStorage.getItem(STORAGE_KEYS.adminAuth) === "true"
  );
}

export default function App() {
  const [isAuthed, setIsAuthed] = useState(readStoredAuth);

  return (
    <ErrorBoundary>
      <Routes>
        <Route path="/" element={<Navigate to="/prices" replace />} />

        <Route path="/prices" element={<Storefront />} />
        <Route path="/prices/product/:slug" element={<Product />} />
        <Route path="/prices/cart" element={<Cart />} />
        <Route path="/prices/checkout" element={<Checkout />} />
        <Route path="/prices/order/:reference" element={<OrderStatus />} />

        <Route path="/login" element={<Login setIsAuthed={setIsAuthed} />} />
        <Route
          path="/admin"
          element={
            isAuthed ? (
              <Admin setIsAuthed={setIsAuthed} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* Keeps legacy shared links alive: /streaming?s=netflix */}
        <Route path="*" element={<LegacyRedirect />} />
      </Routes>
    </ErrorBoundary>
  );
}

function LegacyRedirect() {
  const { services } = useCatalog();
  const params = new URLSearchParams(window.location.search);
  const serviceId = params.get("s");

  if (serviceId && services.length) {
    const service = findService(services, serviceId);
    if (service) return <Navigate to={ROUTES.product(service.slug)} replace />;
  }

  const target = params.toString()
    ? `${ROUTES.storefront}?${params.toString()}`
    : ROUTES.storefront;
  return <Navigate to={target} replace />;
}
