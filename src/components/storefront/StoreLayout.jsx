import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { FiArrowLeft } from "react-icons/fi";
import Logo from "../../assets/logo-black.png";
import { BUSINESS, ROUTES } from "../../lib/config";

export default function StoreLayout({ children }) {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [pathname]);

  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-50 focus:rounded-[var(--radius-sm)] focus:bg-brand focus:px-3 focus:py-2 focus:text-[13px] focus:text-ink-inverse"
      >
        Skip to content
      </a>
      <div className="flex-1">{children}</div>
      <StoreFooter />
    </div>
  );
}

export function StoreFooter() {
  return (
    <footer className="mt-20 border-t border-line">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-5 py-9 sm:flex-row sm:items-center sm:justify-between lg:px-8">
        <div className="flex items-center gap-2.5">
          <img src={Logo} alt="" className="size-6" width={24} height={24} />
          <span className="text-[13px] font-medium text-ink-secondary">
            {BUSINESS.name}
          </span>
        </div>
        <p className="text-[12px] text-ink-tertiary">
          © {new Date().getFullYear()} {BUSINESS.name}
        </p>
        <div className="flex items-center gap-6">
          <Link
            to={ROUTES.storefront}
            className="text-[13px] text-ink-secondary transition-colors hover:text-ink"
          >
            Subscriptions
          </Link>
          <Link
            to={ROUTES.cart}
            className="text-[13px] text-ink-secondary transition-colors hover:text-ink"
          >
            Cart
          </Link>
          <Link
            to="/login"
            className="text-[13px] text-ink-secondary transition-colors hover:text-ink"
          >
            Store login
          </Link>
        </div>
      </div>
    </footer>
  );
}

export function BackLink({ to, children = "Back" }) {
  return (
    <Link
      to={to}
      className="inline-flex items-center gap-1.5 rounded-[var(--radius-sm)] text-[13px] font-medium text-ink-secondary transition-colors hover:text-ink"
    >
      <FiArrowLeft size={15} />
      {children}
    </Link>
  );
}
