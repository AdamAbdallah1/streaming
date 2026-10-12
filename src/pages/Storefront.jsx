import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { FiSearch } from "react-icons/fi";
import Header from "../components/storefront/Header";
import ProductCard from "../components/storefront/ProductCard";
import StoreLayout from "../components/storefront/StoreLayout";
import Button from "../components/ui/Button";
import { CardGridSkeleton } from "../components/ui/Feedback";
import EmptyState from "../components/ui/EmptyState";
import { useCatalog } from "../hooks/useCatalog";
import { useCurrency } from "../lib/currency";
import { cn } from "../lib/cn";
import { findService, serviceMinPrice, slugify } from "../lib/catalog";
import { BUSINESS, ROUTES } from "../lib/config";

const SORTS = [
  { value: "name", label: "Name (A–Z)" },
  { value: "price-asc", label: "Price · low to high" },
  { value: "price-desc", label: "Price · high to low" },
  { value: "updated", label: "Recently updated" },
];

function sortServices(services, sort) {
  const list = [...services];
  switch (sort) {
    case "price-asc":
      return list.sort((a, b) => (serviceMinPrice(a) ?? Infinity) - (serviceMinPrice(b) ?? Infinity));
    case "price-desc":
      return list.sort((a, b) => (serviceMinPrice(b) ?? -Infinity) - (serviceMinPrice(a) ?? Infinity));
    case "updated":
      return list.sort((a, b) => (b.updatedAt?.getTime() ?? 0) - (a.updatedAt?.getTime() ?? 0));
    default:
      return list.sort((a, b) => a.name.localeCompare(b.name));
  }
}

export default function Storefront() {
  const navigate = useNavigate();
  const { services, loading, error } = useCatalog();
  const { currency } = useCurrency();
  const [params, setParams] = useSearchParams();

  const [search, setSearch] = useState(params.get("q") ?? "");
  const [category, setCategory] = useState("All");
  const [sort, setSort] = useState("name");
  const [inStockOnly, setInStockOnly] = useState(false);

  const categories = useMemo(
    () => ["All", ...[...new Set(services.map((s) => s.category))].sort()],
    [services]
  );

  // Search lives in the URL so it can be shared and reached from any page.
  const changeSearch = (value) => {
    setSearch(value);
    const next = new URLSearchParams(params);
    if (value.trim()) next.set("q", value);
    else next.delete("q");
    setParams(next, { replace: true });
  };

  // Legacy deep links: /prices?s=netflix
  const legacyService = params.get("s");
  useEffect(() => {
    if (!legacyService || !services.length) return;
    const match = findService(services, legacyService);
    if (match) navigate(ROUTES.product(match.slug), { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [legacyService, services]);

  // Legacy category deep links: ?c=streaming
  const requestedCategory = params.get("c");
  const activeCategory = useMemo(() => {
    if (!requestedCategory) return category;
    return categories.find((c) => c !== "All" && slugify(c) === slugify(requestedCategory)) ?? category;
  }, [requestedCategory, categories, category]);

  const totalPlans = useMemo(
    () => services.reduce((sum, s) => sum + s.plans.length, 0),
    [services]
  );

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    return sortServices(
      services.filter((service) => {
        if (activeCategory !== "All" && service.category !== activeCategory) return false;
        if (inStockOnly && !service.plans.some((plan) => plan.inStock)) return false;
        if (!term) return true;
        return (
          service.name.toLowerCase().includes(term) ||
          service.plans.some(
            (plan) =>
              plan.label.toLowerCase().includes(term) ||
              (plan.type || "").toLowerCase().includes(term)
          )
        );
      }),
      sort
    );
  }, [services, search, activeCategory, sort, inStockOnly]);

  const filtersActive = Boolean(search.trim()) || activeCategory !== "All" || inStockOnly;

  const clearFilters = () => {
    const next = new URLSearchParams(params);
    next.delete("q");
    next.delete("c");
    setSearch("");
    setCategory("All");
    setInStockOnly(false);
    setParams(next, { replace: true });
  };

  return (
    <StoreLayout>
      <Header search={search} onSearchChange={changeSearch} services={services} />

      <main id="main" className="mx-auto max-w-[76rem] px-4 pb-4 pt-8 sm:pt-10 lg:px-8 lg:pt-12">
        {/* Hero: the title is the composition. Utility link sits right,
            Apple-style — out of the way, useful, not decorative. */}
        <div className="stagger max-w-3xl">
          <p className="label-xs text-ink-tertiary">Cedars Tech · Digital subscriptions</p>
          <h1 className="mt-3 text-[36px] leading-[1.04] tracking-[-0.04em] text-ink sm:text-[52px] lg:text-[60px]">
            Your favourite streaming services.{" "}
            <span className="text-ink-tertiary">One simple order.</span>
          </h1>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <p className="max-w-lg text-[14px] leading-6 text-ink-secondary sm:text-[15px]">
              Choose your subscription, pay with {BUSINESS.whish.label}, and
              confirm your order with us on WhatsApp.
            </p>
            <a
              href="#how-ordering"
              className="hidden shrink-0 text-[13px] font-medium text-ink-secondary underline decoration-line-strong underline-offset-4 transition-colors hover:text-ink sm:block"
            >
              How ordering works ↓
            </a>
          </div>
          <p className="mt-4 text-[13px] text-ink-tertiary tnum">
            {loading ? (
              "Loading catalogue…"
            ) : (
              <>
                {services.length} {services.length === 1 ? "service" : "services"} ·{" "}
                {totalPlans} {totalPlans === 1 ? "plan" : "plans"} · {BUSINESS.whish.label} available
              </>
            )}
          </p>
        </div>

        {/* Catalogue toolbar: section heading and controls read as one row. */}
        <div className="mt-8 border-t border-line pt-5 sm:mt-10">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-baseline justify-between gap-3 sm:justify-start">
              <h2 className="text-[19px] font-semibold tracking-[-0.02em] text-ink">
                {activeCategory === "All" ? (
                  <>All services. <span className="text-ink-tertiary">Take your pick.</span></>
                ) : (
                  activeCategory
                )}
              </h2>
              <p className="text-[12px] text-ink-tertiary tnum sm:hidden">
                {loading ? "…" : `${visible.length} ${visible.length === 1 ? "service" : "services"}`}
              </p>
            </div>

            <div className="anim-rise flex items-center gap-2.5" style={{ animationDelay: "120ms" }}>
              <div className="min-w-0 flex-1 sm:flex-none">
                <label htmlFor="sort" className="sr-only">Sort by</label>
                <select
                  id="sort"
                  value={sort}
                  onChange={(event) => setSort(event.target.value)}
                  className="h-10 w-full rounded-[var(--radius-md)] border border-line bg-surface pl-3.5 text-[13px] font-medium text-ink transition-colors duration-150 hover:border-line-strong focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/15 sm:w-[200px]"
                >
                  {SORTS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <label
                className={cn(
                  "flex h-10 shrink-0 cursor-pointer select-none items-center gap-2.5 rounded-[var(--radius-md)] border px-3.5 text-[13px] font-medium transition-colors duration-150",
                  inStockOnly
                    ? "border-brand bg-brand-soft text-brand-strong"
                    : "border-line bg-surface text-ink-secondary hover:border-line-strong"
                )}
              >
                <span
                  className={cn(
                    "grid size-4 place-items-center rounded-[5px] border transition-colors duration-150",
                    inStockOnly ? "border-brand bg-brand" : "border-line-strong bg-surface"
                  )}
                >
                  {inStockOnly && (
                    <svg className="anim-tick" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </span>
                In stock
                <input
                  type="checkbox"
                  checked={inStockOnly}
                  onChange={(event) => setInStockOnly(event.target.checked)}
                  className="sr-only"
                />
              </label>
            </div>
          </div>

          <p className="mt-2 hidden text-[12px] text-ink-tertiary tnum sm:block">
            {loading ? (
              "Loading catalogue…"
            ) : (
              <>
                {visible.length} {visible.length === 1 ? "service" : "services"}
                {" · "}
                {visible.reduce((sum, s) => sum + s.plans.length, 0)} plans
              </>
            )}
          </p>
        </div>

        {/* Categories */}
        {categories.length > 2 && (
          <nav className="flex flex-wrap gap-2 pt-5" aria-label="Categories">
            {categories.map((entry) => {
              const active = activeCategory === entry;
              return (
                <button
                  key={entry}
                  type="button"
                  aria-pressed={active}
                  onClick={() => {
                    setCategory(entry);
                    const next = new URLSearchParams(params);
                    if (entry === "All") next.delete("c");
                    else next.set("c", slugify(entry));
                    setParams(next, { replace: true });
                  }}
                  className={cn(
                    "h-8 rounded-[var(--radius-pill)] border px-3.5 text-[13px] font-medium transition-all duration-150 ease-out active:scale-[0.97]",
                    active
                      ? "border-ink bg-ink text-canvas"
                      : "border-line bg-surface text-ink-secondary hover:border-line-strong hover:text-ink"
                  )}
                >
                  {entry}
                </button>
              );
            })}
          </nav>
        )}

        {/* Catalogue */}
        {loading ? (
          <CardGridSkeleton />
        ) : error ? (
          <EmptyState
            className="mt-6"
            title="Could not load the catalogue"
            description="Please check your connection and try again."
            action={
              <Button variant="secondary" onClick={() => window.location.reload()}>
                Retry
              </Button>
            }
          />
        ) : visible.length === 0 ? (
          <EmptyState
            className="mt-6"
            icon={<FiSearch size={18} />}
            title={search.trim() ? "No matching subscriptions" : "Nothing here yet"}
            description={
              search.trim()
                ? `Nothing matched “${search.trim()}”. Try a different name.`
                : "New plans are added regularly — please check back soon."
            }
            action={
              filtersActive && (
                <Button variant="secondary" onClick={clearFilters}>
                  Clear filters
                </Button>
              )
            }
          />
        ) : (
            <div
              className="stagger mt-4 grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3"
              role="list"
              aria-label="Service catalogue"
            >
              {visible.map((service, index) => (
                <ProductCard
                  key={service.id}
                  service={service}
                  currency={currency}
                  index={index}
                />
              ))}
            </div>
        )}

        {/* How ordering works — truthful, and it answers the first question
            every customer of a WhatsApp store has. */}
        {!loading && !error && visible.length > 0 && (
          <section id="how-ordering" className="mt-14 scroll-mt-24 border-t border-line pt-9">
            <h2 className="text-[17px] font-semibold tracking-[-0.02em] text-ink">
              How ordering works
            </h2>
            <ol className="mt-5 grid gap-5 sm:grid-cols-3 sm:gap-8">
              {[
                {
                  step: "01",
                  title: "Pick your plan",
                  body: "Choose the service, account type and duration you want, then add it to your cart.",
                },
                {
                  step: "02",
                  title: "Pay by Whish",
                  body: "Send the total to the Whish number on your invoice, using your invoice reference as the transfer note.",
                },
                {
                  step: "03",
                  title: "Confirm on WhatsApp",
                  body: "Send the order summary to Cedars Tech. They verify the transfer and confirm your order on this page.",
                },
              ].map((item) => (
                <li key={item.step} className="flex gap-3.5">
                  <span className="label-xs mt-0.5 shrink-0 text-ink-tertiary tnum">
                    {item.step}
                  </span>
                  <div>
                    <h3 className="text-[14px] font-semibold text-ink">{item.title}</h3>
                    <p className="mt-1 text-[13px] leading-6 text-ink-secondary">
                      {item.body}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        )}
      </main>
    </StoreLayout>
  );
}
