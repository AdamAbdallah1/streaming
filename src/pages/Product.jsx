import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { FiAlertCircle, FiCheck, FiShoppingBag, FiZap } from "react-icons/fi";
import Header from "../components/storefront/Header";
import ServiceLogo, { ServiceLogoHero } from "../components/storefront/ServiceLogo";
import StoreLayout, { BackLink } from "../components/storefront/StoreLayout";
import Button from "../components/ui/Button";
import { PanelSkeleton } from "../components/ui/Feedback";
import Money from "../components/ui/Money";
import QuantityStepper from "../components/ui/QuantityStepper";
import { PageState } from "../components/ui/EmptyState";
import { useCatalog } from "../hooks/useCatalog";
import { cartStore } from "../lib/cart";
import { useCurrency } from "../lib/currency";
import { findService, planTypes } from "../lib/catalog";
import { cn } from "../lib/cn";
import { getServiceBrand } from "../lib/serviceBrand";
import { ROUTES } from "../lib/config";

/** Monotonic key so a changed value re-triggers its entrance animation. */
function useAnimationKey(value) {
  const [key, setKey] = useState(0);
  const previous = useRef(value);
  useEffect(() => {
    if (previous.current !== value) {
      previous.current = value;
      setKey((current) => current + 1);
    }
  }, [value]);
  return key;
}

export default function Product() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { services, loading, error } = useCatalog();
  const { currency } = useCurrency();

  const [selection, setSelection] = useState({
    serviceId: null,
    type: "All",
    planKey: null,
    quantity: 1,
  });
  const [addedKey, setAddedKey] = useState(null);
  const addedTimer = useRef(null);

  const service = useMemo(
    () => (loading ? null : findService(services, slug)),
    [services, slug, loading]
  );

  const active =
    service && selection.serviceId === service.id
      ? selection
      : { serviceId: service?.id ?? null, type: "All", planKey: null, quantity: 1 };

  const types = useMemo(() => (service ? planTypes(service) : []), [service]);

  const activeType =
    active.type === "All" || types.includes(active.type) ? active.type : "All";

  const visiblePlans = useMemo(() => {
    if (!service) return [];
    return activeType === "All"
      ? service.plans
      : service.plans.filter((plan) => plan.type === activeType);
  }, [service, activeType]);

  const selectedPlan =
    visiblePlans.find((plan) => plan.key === active.planKey && plan.inStock) ??
    visiblePlans.find((plan) => plan.inStock) ??
    null;

  // When showing every account type at once, group plans under their type
  // so Full Account and 1 User options can be compared separately.
  const groupedPlans = useMemo(() => {
    if (activeType !== "All" || types.length < 2) return null;
    return types.map((type) => ({
      type,
      plans: visiblePlans.filter((plan) => plan.type === type),
    })).filter((group) => group.plans.length > 0);
  }, [activeType, types, visiblePlans]);

  // Panel figures and their animation keys are derived before any early
  // return so hook order stays stable.
  const panelTotal = selectedPlan ? selectedPlan.price * active.quantity : 0;
  const panelKey = useAnimationKey(panelTotal);
  const quantityKey = useAnimationKey(active.quantity);

  const related = useMemo(
    () => (service ? services.filter((entry) => entry.id !== service.id).slice(0, 4) : []),
    [services, service]
  );

  const justAdded = Boolean(selectedPlan && addedKey === selectedPlan.key);

  const update = (patch) =>
    setSelection({
      serviceId: service?.id ?? null,
      type: activeType,
      planKey: selectedPlan?.key ?? null,
      quantity: active.quantity,
      ...patch,
    });

  const addToCart = (goToCart) => {
    if (!service || !selectedPlan || !selectedPlan.inStock) return;
    cartStore.add(service, selectedPlan, active.quantity);
    setAddedKey(selectedPlan.key);
    window.clearTimeout(addedTimer.current);
    addedTimer.current = window.setTimeout(() => setAddedKey(null), 2400);
    if (goToCart) navigate(ROUTES.cart);
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && selectedPlan?.inStock) {
      event.preventDefault();
      addToCart(false);
    }
  };

  if (loading) {
    return (
      <StoreLayout>
        <Header services={services} />
        <main className="mx-auto grid max-w-[68rem] gap-6 px-4 py-8 lg:grid-cols-[minmax(0,1fr)_20rem] lg:px-8">
          <PanelSkeleton />
          <PanelSkeleton />
        </main>
      </StoreLayout>
    );
  }

  if (error || !service) {
    return (
      <StoreLayout>
        <Header services={services} />
        <PageState
          icon={<FiAlertCircle size={20} />}
          title="Subscription not found"
          description="This service may have been renamed or removed."
          action={
            <Button onClick={() => navigate(ROUTES.storefront)}>
              Back to subscriptions
            </Button>
          }
        />
      </StoreLayout>
    );
  }

  const brand = getServiceBrand(service);
  const planCount = service.plans.length;

  return (
    <StoreLayout>
      <Header services={services} />

      <main
        id="main"
        key={service.id}
        className="anim-fade mx-auto max-w-[68rem] px-4 pt-6 lg:px-8 lg:pb-16"
      >
        <BackLink to={ROUTES.storefront}>All subscriptions</BackLink>

        {/* Service identity */}
        <div className="stagger mt-5 flex items-start gap-4 sm:gap-5">
          <ServiceLogoHero service={service} />
          <div className="min-w-0 flex-1 pt-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="label-xs text-ink-tertiary">{service.category}</span>
              <span className="text-ink-tertiary">·</span>
              <span className="text-[12px] text-ink-tertiary tnum">
                {planCount} {planCount === 1 ? "option" : "options"}
              </span>
            </div>
            <h1 className="mt-2 text-[26px] leading-[1.1] tracking-[-0.032em] text-ink sm:text-[32px]">
              {service.name}
            </h1>
          </div>
        </div>

        {service.note && (
          <p className="anim-rise mt-5 max-w-2xl rounded-[var(--radius-md)] border border-line bg-inset px-4 py-3 text-[14px] leading-6 text-ink-secondary">
            {service.note}
          </p>
        )}

        {/* Account type */}
        {types.length > 1 && (
          <div className="mt-6 flex flex-wrap gap-2" role="group" aria-label="Account type">
            {["All", ...types].map((type) => {
              const active = activeType === type;
              return (
                <button
                  key={type}
                  type="button"
                  aria-pressed={active}
                  onClick={() => update({ type })}
                  className={cn(
                    "h-9 rounded-[var(--radius-pill)] border px-4 text-[13px] font-medium",
                    "transition-all duration-150 ease-out active:scale-[0.97]",
                    active
                      ? "border-ink bg-ink text-canvas"
                      : "border-line bg-surface text-ink-secondary hover:border-line-strong hover:text-ink"
                  )}
                >
                  {type}
                </button>
              );
            })}
          </div>
        )}

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start lg:gap-8">
          {/* Options */}
          <section aria-label="Available options">
            {visiblePlans.length === 0 ? (
              <PageState
                icon={<FiAlertCircle size={20} />}
                title="No options available"
                description="There are no plans for this account type right now."
              />
            ) : groupedPlans ? (
              <div className="space-y-5">
                {groupedPlans.map((group) => (
                  <section key={group.type} aria-label={`${group.type} plans`}>
                    <div className="mb-2 flex items-baseline justify-between gap-3 px-1">
                      <h2 className="text-[13px] font-semibold uppercase tracking-[0.06em] text-ink-secondary">
                        {group.type}
                      </h2>
                      <p className="text-[12px] text-ink-tertiary tnum">
                        {group.plans.length} {group.plans.length === 1 ? "option" : "options"}
                      </p>
                    </div>
                    <ul className="divide-y divide-line overflow-hidden rounded-[var(--radius-lg)] border border-line bg-surface">
                      {group.plans.map((plan, index) => (
                        <PlanRow
                          key={plan.key}
                          plan={plan}
                          index={index}
                          showType={false}
                          isActive={plan.key === selectedPlan?.key}
                          currency={currency}
                          onSelect={() => update({ planKey: plan.key })}
                          onKeyDown={handleKeyDown}
                        />
                      ))}
                    </ul>
                  </section>
                ))}
              </div>
            ) : (
              <ul className="divide-y divide-line overflow-hidden rounded-[var(--radius-lg)] border border-line bg-surface">
                {visiblePlans.map((plan, index) => (
                  <PlanRow
                    key={plan.key}
                    plan={plan}
                    index={index}
                    showType={activeType === "All"}
                    isActive={plan.key === selectedPlan?.key}
                    currency={currency}
                    onSelect={() => update({ planKey: plan.key })}
                    onKeyDown={handleKeyDown}
                  />
                ))}
              </ul>
            )}
          </section>

          {/* Purchase panel — desktop only; mobile uses the sticky bar */}
          <aside className="hidden lg:sticky lg:top-[calc(var(--header-h)+1.5rem)] lg:block">
            <PurchasePanel
              plan={selectedPlan}
              quantity={active.quantity}
              currency={currency}
              justAdded={justAdded}
              panelKey={panelKey}
              quantityKey={quantityKey}
              onQuantityChange={(next) => update({ quantity: next })}
              onAdd={() => addToCart(false)}
              onBuyNow={() => addToCart(true)}
              brand={brand}
            />
          </aside>
        </div>

        {/* Related */}
        {related.length > 0 && (
          <section className="anim-rise mt-12 lg:mb-4">
            <h2 className="text-[15px] font-semibold text-ink">Other subscriptions</h2>
            <ul className="stagger mt-3 divide-y divide-line overflow-hidden rounded-[var(--radius-lg)] border border-line bg-surface">
              {related.map((entry) => (
                <li key={entry.id}>
                  <Link
                    to={ROUTES.product(entry.slug)}
                    className="group flex items-center gap-3 px-4 py-3 transition-colors duration-150 hover:bg-sunken"
                  >
                    <ServiceLogo service={entry} size="xs" />
                    <span className="min-w-0 flex-1 truncate text-[14px] font-medium text-ink">
                      {entry.name}
                    </span>
                    <span className="shrink-0 text-[12px] text-ink-tertiary tnum">
                      {entry.plans.length} {entry.plans.length === 1 ? "option" : "options"}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>

      {/* Mobile purchase bar — sticky so it can never cover the footer */}
      {selectedPlan && (
        <div className="sticky bottom-0 z-30 -mt-px border-t border-line bg-surface/95 shadow-bar backdrop-blur-xl lg:hidden">
          <div className="mx-auto flex max-w-[68rem] items-center gap-3 px-4 py-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-[12px] text-ink-tertiary">
                {service.name} · {selectedPlan.label}
              </p>
              <Money
                key={panelKey}
                amount={selectedPlan.price * active.quantity}
                currency={currency}
                emphasis
                className="anim-num text-[18px] text-ink"
              />
            </div>
            <QuantityStepper
              size="sm"
              value={active.quantity}
              disabled={!selectedPlan.inStock}
              onChange={(next) => update({ quantity: next })}
            />
            <Button
              className="shrink-0"
              disabled={!selectedPlan.inStock}
              onClick={() => addToCart(false)}
            >
              {justAdded ? <FiCheck size={16} /> : "Add"}
            </Button>
          </div>
        </div>
      )}
    </StoreLayout>
  );
}

function PlanRow({ plan, index, showType, isActive, currency, onSelect, onKeyDown }) {
  return (
    <li
      className="anim-rise"
      style={{ animationDelay: `${Math.min(index, 7) * 35}ms` }}
    >
      <label
        onKeyDown={onKeyDown}
        tabIndex={0}
        className={cn(
          "row-select flex cursor-pointer items-center gap-3.5 px-4 py-4 sm:px-5",
          isActive && "bg-brand-soft",
          !isActive && plan.inStock && "hover:bg-sunken",
          !plan.inStock && "cursor-not-allowed opacity-55"
        )}
      >
        <span
          aria-hidden="true"
          className={cn(
            "grid size-[18px] shrink-0 place-items-center rounded-full border-2 transition-colors duration-150",
            isActive ? "border-brand" : "border-line-strong"
          )}
        >
          {isActive && <span className="anim-tick size-2 rounded-full bg-brand" />}
        </span>
        <input
          type="radio"
          name="plan"
          value={plan.key}
          checked={isActive}
          disabled={!plan.inStock}
          onChange={onSelect}
          className="sr-only"
        />

        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-baseline gap-x-2">
            <span
              className={cn(
                "text-[15px] text-ink",
                isActive ? "font-semibold" : "font-medium"
              )}
            >
              {plan.label}
            </span>
            {showType && plan.type && (
              <span className="text-[13px] text-ink-secondary">
                {plan.type}
              </span>
            )}
          </span>
          {plan.duration && (
            <span className="mt-0.5 block text-[12px] text-ink-tertiary">
              {plan.duration}
            </span>
          )}
        </span>

        <span className="shrink-0 text-right">
          <Money
            amount={plan.price}
            wasAmount={plan.wasPrice}
            currency={currency}
            strong={isActive}
            className="text-[16px] text-ink"
          />
          {plan.saving > 0 && (
            <span className="mt-0.5 block text-[11px] font-medium text-positive tnum">
              Save <Money amount={plan.saving} currency={currency} />
            </span>
          )}
          {!plan.inStock && (
            <span className="mt-0.5 block text-[11px] font-medium text-ink-tertiary">
              Out of stock
            </span>
          )}
        </span>
      </label>
    </li>
  );
}

function PurchasePanel({
  plan,
  quantity,
  currency,
  justAdded,
  panelKey,
  quantityKey,
  onQuantityChange,
  onAdd,
  onBuyNow,
  brand,
}) {
  if (!plan) {
    return (
      <div className="rounded-[var(--radius-lg)] border border-line bg-surface p-5">
        <p className="text-[14px] text-ink-secondary">Select an option to see the total.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-[var(--radius-lg)] border border-line bg-surface shadow-card">
      {/* Service identity strip */}
      {brand && (
        <div
          className="plate-tint flex h-20 items-center justify-center border-b border-hairline"
          style={{ backgroundColor: `color-mix(in srgb, ${brand.wash} 7%, #ffffff)` }}
        >
          <span className="logo-respond flex items-center justify-center">
            <ServiceLogo service={{ name: brand.label }} size="md" plate={false} className="!border-0 !bg-transparent" />
          </span>
        </div>
      )}

      <div className="p-5">
        <p className="text-[13px] text-ink-tertiary">
          {plan.label}
          {plan.type ? ` · ${plan.type}` : ""}
        </p>

        {/* Price re-animates whenever the total changes, so quantity and
            plan switches are immediately visible. */}
        <div className="mt-1 flex items-baseline gap-2">
          <Money
            key={panelKey}
            amount={plan.price * quantity}
            currency={currency}
            emphasis
            className="anim-num text-[30px] leading-none text-ink"
          />
          {quantity > 1 && (
            <span key={quantityKey} className="anim-num text-[13px] text-ink-tertiary tnum">
              × {quantity}
            </span>
          )}
        </div>

        {plan.saving > 0 && (
          <p className="anim-rise mt-2 text-[13px] font-medium text-positive tnum">
            Save <Money amount={plan.saving * quantity} currency={currency} />
          </p>
        )}

        <div className="mt-5 flex items-center justify-between gap-3">
          <span className="text-[13px] text-ink-secondary">Quantity</span>
          <QuantityStepper
            value={quantity}
            disabled={!plan.inStock}
            onChange={onQuantityChange}
          />
        </div>

        <div className="mt-5 space-y-2.5">
          <Button size="lg" block onClick={onAdd}>
            {justAdded ? (
              <>
                <FiCheck size={16} /> Added to cart
              </>
            ) : (
              <>
                <FiShoppingBag size={16} /> Add to cart
              </>
            )}
          </Button>
          <Button size="lg" variant="secondary" block onClick={onBuyNow}>
            <FiZap size={15} /> Buy now
          </Button>
        </div>

        <p className="mt-4 text-[12px] leading-5 text-ink-tertiary">
          You will pay by Whish transfer and confirm the order on WhatsApp.
        </p>
      </div>
    </div>
  );
}
