import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiMoon, FiSearch, FiShoppingBag, FiSun, FiX } from "react-icons/fi";
import Logo from "../../assets/logo-black.png";
import { BUSINESS, CURRENCIES, ROUTES } from "../../lib/config";
import { resolveCart, useCart } from "../../lib/cart";
import { useCurrency } from "../../lib/currency";
import { useTheme } from "../../hooks/useTheme";
import { cn } from "../../lib/cn";

export default function Header({ search, onSearchChange, services }) {
  const navigate = useNavigate();
  const cartItems = useCart();
  const { isDark, toggle } = useTheme();
  const { currency, setCurrency } = useCurrency();
  const { count } = resolveCart(cartItems, services);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 6);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Inline filtering on the catalogue, search-and-go everywhere else.
  const [localSearch, setLocalSearch] = useState("");

  const submitSearch = (event) => {
    event.preventDefault();
    const term = localSearch.trim();
    navigate(term ? `${ROUTES.storefront}?q=${encodeURIComponent(term)}` : ROUTES.storefront);
  };

  return (
    <header
      className={cn(
        "sticky top-0 z-40 border-b bg-surface/90 backdrop-blur-xl transition-shadow duration-200",
        scrolled ? "border-line shadow-card" : "border-transparent"
      )}
    >
      <div className="mx-auto flex h-[var(--header-h)] max-w-[76rem] items-center gap-3 px-4 lg:gap-5 lg:px-8">
        {/* Brand */}
        <Link
          to={ROUTES.storefront}
          className="flex shrink-0 items-center gap-2.5 rounded-[var(--radius-sm)]"
          aria-label={`${BUSINESS.name} home`}
        >
          <img src={Logo} alt="" className="size-[26px]" width={26} height={26} />
          <span className="hidden flex-col leading-none sm:flex">
            <span className="text-[15px] font-semibold tracking-[-0.02em] text-ink">
              {BUSINESS.name}
            </span>
            <span className="label-xs mt-[3px] text-ink-tertiary">Streaming</span>
          </span>
        </Link>

        <span className="hidden h-6 w-px shrink-0 bg-line lg:block" aria-hidden="true" />

        {/* Search */}
        <div className="ml-auto min-w-0 flex-1 lg:ml-0 lg:max-w-sm">
          {onSearchChange ? (
            <SearchInput
              id="header-search"
              value={search}
              onChange={onSearchChange}
              onClear={() => onSearchChange("")}
            />
          ) : (
            <form role="search" onSubmit={submitSearch} className="w-full">
              <SearchInput
                id="header-search-go"
                value={localSearch}
                onChange={setLocalSearch}
                onClear={() => setLocalSearch("")}
              />
            </form>
          )}
        </div>

        {/* Actions */}
        <div className="flex shrink-0 items-center gap-1">
          <CurrencyToggle currency={currency} onChange={setCurrency} />

          <span className="mx-1 hidden h-5 w-px bg-line sm:block" aria-hidden="true" />

          <button
            type="button"
            onClick={toggle}
            aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
            className="grid size-9 place-items-center rounded-[var(--radius-sm)] text-ink-secondary transition-colors duration-150 hover:bg-muted hover:text-ink"
          >
            {isDark ? <FiSun size={17} /> : <FiMoon size={17} />}
          </button>

          <button
            type="button"
            onClick={() => navigate(ROUTES.cart)}
            aria-label={`Cart, ${count} ${count === 1 ? "item" : "items"}`}
            className="relative grid size-9 place-items-center rounded-[var(--radius-sm)] text-ink-secondary transition-colors duration-150 hover:bg-muted hover:text-ink"
          >
            <FiShoppingBag size={18} />
            {count > 0 && (
              <span
                key={count}
                className="anim-pop anim-ring absolute -right-0.5 -top-0.5 grid min-w-[17px] place-items-center rounded-[var(--radius-pill)] bg-brand px-1 text-[10px] font-semibold leading-[15px] text-white tnum"
              >
                {count}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}

function SearchInput({ id, value, onChange, onClear }) {
  return (
    <div className="relative">
      <FiSearch
        className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-tertiary"
        aria-hidden="true"
      />
      <input
        id={id}
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Search"
        aria-label="Search subscriptions"
        className={cn(
          "h-10 w-full rounded-[var(--radius-pill)] border border-line bg-sunken pl-10 pr-9",
          "text-[14px] text-ink transition-colors duration-150 placeholder:text-ink-tertiary",
          "hover:border-line-strong focus:border-brand focus:bg-surface focus:outline-none focus:ring-4 focus:ring-brand/15",
          "[&::-webkit-search-cancel-button]:hidden"
        )}
      />
      {value && (
        <button
          type="button"
          onClick={onClear}
          aria-label="Clear search"
          className="absolute right-2.5 top-1/2 grid size-6 -translate-y-1/2 place-items-center rounded-full text-ink-tertiary transition-colors hover:bg-muted hover:text-ink"
        >
          <FiX size={14} />
        </button>
      )}
    </div>
  );
}

function CurrencyToggle({ currency, onChange }) {
  return (
    <div
      className="flex items-center rounded-[var(--radius-pill)] border border-line bg-sunken p-0.5"
      role="group"
      aria-label="Currency"
    >
      {CURRENCIES.map((option) => (
        <button
          key={option.code}
          type="button"
          aria-pressed={currency === option.code}
          onClick={() => onChange(option.code)}
          className={cn(
            "h-7 rounded-[var(--radius-pill)] px-2.5 text-[12px] font-medium transition-colors duration-150",
            currency === option.code
              ? "bg-surface text-ink shadow-card"
              : "text-ink-tertiary hover:text-ink-secondary"
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
