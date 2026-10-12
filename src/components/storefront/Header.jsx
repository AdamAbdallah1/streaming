import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FiChevronDown,
  FiMoon,
  FiSearch,
  FiShoppingBag,
  FiSun,
  FiX,
} from "react-icons/fi";
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

  const searchField = onSearchChange ? (
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
  );

  return (
    <header
      className={cn(
        "sticky top-0 z-40 border-b bg-surface",
        scrolled ? "border-line shadow-card" : "border-transparent"
      )}
    >
      {/* ── Desktop: one quiet row ─────────────────────────────── */}
      <div className="mx-auto hidden h-16 max-w-[76rem] items-center gap-8 px-8 md:flex">
        <BrandLockup />

        <div className="w-full max-w-md flex-1">{searchField}</div>

        <div className="ml-auto flex items-center gap-1.5">
          <CurrencyText currency={currency} onChange={setCurrency} />
          <ThemeButton isDark={isDark} onToggle={toggle} />
          <CartButton count={count} onOpen={() => navigate(ROUTES.cart)} />
        </div>
      </div>

      {/* ── Mobile: brand row, then search row ─────────────────── */}
      <div className="px-4 pb-3 pt-2 md:hidden">
        <div className="flex h-11 items-center justify-between gap-2">
          <BrandLockup compact />
          <div className="flex items-center gap-0.5">
            <CurrencyText currency={currency} onChange={setCurrency} />
            <CartButton count={count} onOpen={() => navigate(ROUTES.cart)} />
          </div>
        </div>

        <div className="mt-1.5 flex items-center gap-2">
          <div className="min-w-0 flex-1">{searchField}</div>
          <ThemeButton
            isDark={isDark}
            onToggle={toggle}
            bordered
          />
        </div>
      </div>
    </header>
  );
}

/** Brand lockup: cedar mark + wordmark. Always shows the name. */
function BrandLockup({ compact = false }) {
  return (
    <Link
      to={ROUTES.storefront}
      aria-label={`${BUSINESS.name} home`}
      className="flex min-h-[40px] min-w-[40px] shrink-0 items-center gap-2.5 rounded-[var(--radius-sm)]"
    >
      <img
        src={Logo}
        alt=""
        width={compact ? 24 : 28}
        height={compact ? 24 : 28}
        className={compact ? "size-6" : "size-7"}
      />
      <span className="flex flex-col leading-none">
        <span
          className={cn(
            "font-semibold tracking-[-0.02em] text-ink",
            compact ? "text-[15px]" : "text-[16px]"
          )}
        >
          {BUSINESS.name}
        </span>
        <span className="label-xs mt-[3px] text-ink-tertiary">Streaming</span>
      </span>
    </Link>
  );
}

/** Currency as quiet text, not a pill. Still a 40px target. */
function CurrencyText({ currency, onChange }) {
  const other = CURRENCIES.find((option) => option.code !== currency);
  return (
    <button
      type="button"
      onClick={() => onChange(other.code)}
      aria-label={`Currency, currently ${currency}. Switch to ${other.code}.`}
      title={`Switch to ${other.code}`}
      className="flex h-10 min-w-[40px] items-center gap-1 rounded-[var(--radius-sm)] px-2 text-[13px] font-medium text-ink-secondary transition-colors duration-150 hover:text-ink"
    >
      <span className="tnum">{currency}</span>
      <FiChevronDown size={12} className="text-ink-tertiary" aria-hidden="true" />
    </button>
  );
}

function ThemeButton({ isDark, onToggle, bordered = false }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      className={cn(
        "grid size-10 shrink-0 place-items-center rounded-[var(--radius-sm)] text-ink-secondary transition-colors duration-150 hover:bg-muted hover:text-ink",
        bordered && "rounded-[var(--radius-md)] border border-line bg-surface"
      )}
    >
      {isDark ? <FiSun size={18} /> : <FiMoon size={18} />}
    </button>
  );
}

function CartButton({ count, onOpen }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={`Cart, ${count} ${count === 1 ? "item" : "items"}`}
      className="relative grid size-10 shrink-0 place-items-center rounded-[var(--radius-sm)] text-ink transition-colors duration-150 hover:bg-muted"
    >
      <FiShoppingBag size={19} />
      {count > 0 && (
        <span
          key={count}
          className="anim-pop anim-ring absolute right-0.5 top-0.5 grid min-w-[17px] place-items-center rounded-[var(--radius-pill)] bg-brand px-1 text-[10px] font-semibold leading-[15px] text-white tnum"
        >
          {count}
        </span>
      )}
    </button>
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
        placeholder="Search subscriptions"
        aria-label="Search subscriptions"
        className={cn(
          "h-10 w-full rounded-[var(--radius-pill)] border border-line bg-canvas pl-10 pr-9",
          "text-[14px] text-ink transition-colors duration-150 placeholder:text-ink-tertiary",
          "hover:border-line-strong focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/15",
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
