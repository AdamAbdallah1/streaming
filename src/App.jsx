import { Suspense, lazy, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import ErrorBoundary from "./components/ui/ErrorBoundary";
import Storefront from "./pages/Storefront";
import { findService } from "./lib/catalog";
import { useCatalog } from "./hooks/useCatalog";
import { ROUTES, STORAGE_KEYS } from "./lib/config";

const Product = lazy(() => import("./pages/Product"));
const Cart = lazy(() => import("./pages/Cart"));
const Checkout = lazy(() => import("./pages/Checkout"));
const OrderStatus = lazy(() => import("./pages/OrderStatus"));
const Login = lazy(() => import("./pages/Login"));
const Admin = lazy(() => import("./pages/Admin"));

function readStoredAuth() {
  return (
    localStorage.getItem(STORAGE_KEYS.adminAuth) === "true" ||
    sessionStorage.getItem(STORAGE_KEYS.adminAuth) === "true"
  );
}

function RouteFallback() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="size-8 animate-spin rounded-full border-2 border-brand border-t-transparent" />
    </div>
  );
}

export default function App() {
  const [isAuthed, setIsAuthed] = useState(readStoredAuth);

  return (
    <ErrorBoundary>
      <Routes>
        <Route path="/" element={<Navigate to="/prices" replace />} />

        <Route path="/prices" element={<Storefront />} />
        <Route
          path="/prices/product/:slug"
          element={
            <Suspense fallback={<RouteFallback />}>
              <Product />
            </Suspense>
          }
        />
        <Route
          path="/prices/cart"
          element={
            <Suspense fallback={<RouteFallback />}>
              <Cart />
            </Suspense>
          }
        />
        <Route
          path="/prices/checkout"
          element={
            <Suspense fallback={<RouteFallback />}>
              <Checkout />
            </Suspense>
          }
        />
        <Route
          path="/prices/order/:reference"
          element={
            <Suspense fallback={<RouteFallback />}>
              <OrderStatus />
            </Suspense>
          }
        />

        <Route
          path="/login"
          element={
            <Suspense fallback={<RouteFallback />}>
              <Login setIsAuthed={setIsAuthed} />
            </Suspense>
          }
        />
        <Route
          path="/admin"
          element={
            isAuthed ? (
              <Suspense fallback={<RouteFallback />}>
                <Admin setIsAuthed={setIsAuthed} />
              </Suspense>
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
