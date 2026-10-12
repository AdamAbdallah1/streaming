import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiShoppingBag, FiTrash2 } from "react-icons/fi";
import Header from "../components/storefront/Header";
import ServiceLogo from "../components/storefront/ServiceLogo";
import StoreLayout from "../components/storefront/StoreLayout";
import Button from "../components/ui/Button";
import { PageState } from "../components/ui/EmptyState";
import { ServiceRowSkeleton } from "../components/ui/Feedback";
import Money from "../components/ui/Money";
import QuantityStepper from "../components/ui/QuantityStepper";
import { useCatalog } from "../hooks/useCatalog";
import { cartStore, resolveCart, useCart, MAX_CART_QUANTITY } from "../lib/cart";
import { useCurrency } from "../lib/currency";
import { cn } from "../lib/cn";
import { ROUTES } from "../lib/config";

export default function Cart() {
  const navigate = useNavigate();
  const { services, loading } = useCatalog();
  const { currency } = useCurrency();
  const items = useCart();
  const [removing, setRemoving] = useState(null);

  const { lines, count, subtotal, hasUnavailable, loading: cartLoading } =
    resolveCart(items, services, { loading });
  const hasPurchasable = lines.some((line) => line.inStock);

  const removeWithFeedback = (serviceId, planKey) => {
    const key = `${serviceId}:${planKey}`;
    setRemoving(key);
    window.setTimeout(() => {
      cartStore.remove(serviceId, planKey);
      setRemoving(null);
    }, 160);
  };

  const clearWithFeedback = () => {
    if (lines.length === 0) return;
    setRemoving("__all__");
    window.setTimeout(() => {
      cartStore.clear();
      setRemoving(null);
    }, 160);
  };

  return (
    <StoreLayout>
      <Header services={services} />

      <main id="main" className="mx-auto max-w-6xl px-5 pb-16 pt-9 lg:px-8 lg:pt-12">
        <h1 className="text-[28px] font-semibold leading-[1.15] tracking-[-0.03em] text-ink sm:text-[34px]">
          Your cart
        </h1>
        <p className="mt-2 text-[14px] text-ink-secondary tnum">
          {cartLoading ? "Loading…" : `${count} ${count === 1 ? "item" : "items"}`}
        </p>

        {cartLoading ? (
          <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
            <div className="divide-y divide-line overflow-hidden rounded-[var(--radius-lg)] border border-line bg-surface">
              {Array.from({ length: count || 1 }).map((_, index) => (
                <ServiceRowSkeleton key={index} />
              ))}
            </div>
            <SummarySkeleton />
          </div>
        ) : lines.length === 0 ? (
          <PageState
            icon={<FiShoppingBag size={20} />}
            title="Your cart is empty"
            description="Browse the subscriptions and add a plan to get started."
            action={
              <Button onClick={() => navigate(ROUTES.storefront)}>
                Browse subscriptions
              </Button>
            }
          />
        ) : (
          <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
            {/* Line items */}
            <ul className="divide-y divide-line overflow-hidden rounded-[var(--radius-lg)] border border-line bg-surface">
              {lines.map((line) => {
                const service = services.find((entry) => entry.id === line.serviceId);
                const lineKey = `${line.serviceId}:${line.planKey}`;
                const isLeaving = removing === lineKey || removing === "__all__";
                return (
                  <li
                    key={lineKey}
                    className={cn(
                      "px-4 py-3.5 sm:px-5",
                      !line.inStock && "opacity-60",
                      isLeaving && "anim-leave"
                    )}
                  >
                    <div className="flex items-start gap-3.5">
                      <ServiceLogo service={{ name: line.serviceName }} size="md" />

                      <div className="min-w-0 flex-1">
                        {line.unavailable || !service ? (
                          <p className="text-[15px] font-medium text-ink">
                            {line.serviceName}
                          </p>
                        ) : (
                          <Link
                            to={ROUTES.product(service.slug)}
                            className="text-[15px] font-medium text-ink hover:underline"
                          >
                            {line.serviceName}
                          </Link>
                        )}
                        <p className="mt-0.5 text-[13px] text-ink-secondary">
                          {[line.label, line.type, line.duration].filter(Boolean).join(" · ")}
                        </p>
                        <p className="mt-0.5 text-[12px] text-ink-tertiary tnum">
                          <Money amount={line.unitPrice} currency={currency} /> each
                        </p>
                      </div>

                      <div className="flex shrink-0 items-center gap-1">
                        <Money
                          key={line.lineTotal}
                          amount={line.lineTotal}
                          currency={currency}
                          strong
                          className="anim-num text-[16px] text-ink"
                        />
                        <button
                          type="button"
                          aria-label={`Remove ${line.serviceName} ${line.label}`}
                          onClick={() => removeWithFeedback(line.serviceId, line.planKey)}
                          className="grid size-9 place-items-center rounded-[var(--radius-sm)] text-ink-tertiary transition-colors duration-150 hover:bg-danger-soft hover:text-danger active:scale-95"
                        >
                          <FiTrash2 size={16} />
                        </button>
                      </div>
                    </div>

                    {/* Controls */}
                    <div className="mt-3 flex items-center justify-between gap-3 pl-0 sm:pl-[54px]">
                      <QuantityStepper
                        size="sm"
                        value={line.quantity}
                        max={MAX_CART_QUANTITY}
                        disabled={!line.inStock}
                        onChange={(next) =>
                          cartStore.setQuantity(line.serviceId, line.planKey, next)
                        }
                      />
                      {!line.inStock && (
                        <p className="text-[12px] font-medium text-warning">
                          {line.unavailable
                            ? "No longer available — remove it to continue"
                            : "Out of stock — remove it to continue"}
                        </p>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>

            <aside className="lg:sticky lg:top-[calc(var(--header-h)+1.5rem)]">
              <div className="rounded-[var(--radius-lg)] border border-line bg-surface p-5 shadow-card">
                <h2 className="text-[15px] font-semibold text-ink">Summary</h2>

                <dl className="mt-4 space-y-2.5 text-[14px]">
                  <div className="flex items-baseline justify-between gap-3">
                    <dt className="text-ink-secondary">Subtotal</dt>
                    <dd className="tnum text-ink">
                      <Money
                        key={subtotal}
                        amount={subtotal}
                        currency={currency}
                        className="anim-num"
                      />
                    </dd>
                  </div>
                  <div className="flex items-baseline justify-between gap-3">
                    <dt className="text-ink-secondary">Payment fee</dt>
                    <dd className="tnum text-ink-tertiary">None</dd>
                  </div>
                  <div className="flex items-baseline justify-between gap-3 border-t border-line pt-3.5">
                    <dt className="text-[16px] font-semibold text-ink">Total</dt>
                    <dd>
                      <Money
                        key={`total-${subtotal}`}
                        amount={subtotal}
                        currency={currency}
                        emphasis
                        className="anim-num text-[22px] text-ink"
                      />
                    </dd>
                  </div>
                </dl>

                <Button
                  size="lg"
                  block
                  className="mt-5"
                  disabled={!hasPurchasable}
                  onClick={() => navigate(ROUTES.checkout)}
                >
                  Continue to checkout
                </Button>

                {hasUnavailable && (
                  <p className="mt-3 text-[12px] leading-5 text-ink-tertiary">
                    Unavailable or out-of-stock items are not included in the
                    total.
                  </p>
                )}

                <button
                  type="button"
                  onClick={clearWithFeedback}
                  className="mt-3 w-full rounded-[var(--radius-sm)] py-1.5 text-[13px] text-ink-tertiary transition-colors duration-150 hover:text-danger active:scale-[0.99]"
                >
                  Clear cart
                </button>
              </div>
            </aside>
          </div>
        )}
      </main>
    </StoreLayout>
  );
}

function SummarySkeleton() {
  return (
    <div className="rounded-[var(--radius-lg)] border border-line bg-surface p-5">
      <div className="h-4 w-24 animate-pulse rounded bg-muted" />
      <div className="mt-4 space-y-3">
        <div className="h-3 w-full animate-pulse rounded bg-muted" />
        <div className="h-3 w-full animate-pulse rounded bg-muted" />
        <div className="h-5 w-28 animate-pulse rounded bg-muted" />
      </div>
      <div className="mt-5 h-12 w-full animate-pulse rounded-[var(--radius-lg)] bg-muted" />
    </div>
  );
}
