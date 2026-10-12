import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  FiAlertCircle,
  FiCheckCircle,
  FiClock,
  FiDollarSign,
  FiFileText,
  FiHash,
  FiLoader,
  FiMessageCircle,
  FiRefreshCw,
} from "react-icons/fi";
import Header from "../components/storefront/Header";
import StoreLayout from "../components/storefront/StoreLayout";
import Button from "../components/ui/Button";
import CopyButton from "../components/ui/CopyButton";
import { Spinner } from "../components/ui/Feedback";
import Money from "../components/ui/Money";
import { PageState } from "../components/ui/EmptyState";
import { useCatalog } from "../hooks/useCatalog";
import { useCurrency } from "../lib/currency";
import { cn } from "../lib/cn";
import { BUSINESS, ORDER_STATUS, ORDER_STATUS_META, ROUTES } from "../lib/config";
import { buildOrderSummary, formatWhishNumber, whatsappLink } from "../lib/invoice";
import { markPaymentSent, subscribeOrder } from "../lib/orders";

const TONES = {
  warning: {
    wrap: "border-warning-line bg-warning-soft",
    icon: "text-warning",
    Icon: FiClock,
  },
  info: {
    wrap: "border-brand-line bg-brand-soft",
    icon: "text-brand-strong",
    Icon: FiLoader,
  },
  positive: {
    wrap: "border-positive-line bg-positive-soft",
    icon: "text-positive",
    Icon: FiCheckCircle,
  },
  danger: {
    wrap: "border-danger-line bg-danger-soft",
    icon: "text-danger",
    Icon: FiAlertCircle,
  },
};

export default function OrderStatus() {
  const { reference } = useParams();
  const { services } = useCatalog();
  const { currency } = useCurrency();

  const [order, setOrder] = useState(undefined);
  const [loadError, setLoadError] = useState(false);
  const [marking, setMarking] = useState(false);

  useEffect(
    () =>
      subscribeOrder(
        reference,
        (next) => setOrder(next),
        () => setLoadError(true)
      ),
    [reference]
  );

  const status = order?.status ?? ORDER_STATUS.PENDING_PAYMENT;
  const meta = ORDER_STATUS_META[status] ?? ORDER_STATUS_META[ORDER_STATUS.PENDING_PAYMENT];
  const tone = TONES[meta.tone] ?? TONES.warning;
  const orderCurrency = order?.currency || currency;

  const message = useMemo(() => (order ? buildOrderSummary(order) : ""), [order]);

  const markSent = async () => {
    setMarking(true);
    try {
      await markPaymentSent(reference);
    } catch {
      setLoadError(true);
    } finally {
      setMarking(false);
    }
  };

  if (order === undefined) {
    return (
      <StoreLayout>
        <Header services={services} />
        <main className="mx-auto max-w-2xl px-5 py-24">
          <Spinner className="size-5 text-ink-tertiary" />
        </main>
      </StoreLayout>
    );
  }

  if (order === null || loadError) {
    return (
      <StoreLayout>
        <Header services={services} />
        <PageState
          icon={<FiAlertCircle size={20} />}
          title="Order not found"
          description={`We could not find an order with the reference ${reference}.`}
          action={
            <Button variant="secondary" onClick={() => window.location.assign(ROUTES.storefront)}>
              Back to subscriptions
            </Button>
          }
        />
      </StoreLayout>
    );
  }

  const lines = order.lines || [];

  return (
    <StoreLayout>
      <Header services={services} />

      <main id="main" className="mx-auto max-w-2xl px-5 pb-16 pt-8 lg:px-8 lg:pt-12">
        {/* Status — re-animates on every status change so the customer can
            see the transition happen live. */}
        <div
          key={status}
          className={cn(
            "anim-scale-in rounded-[var(--radius-lg)] border px-4 py-4",
            tone.wrap
          )}
        >
          <div className="flex items-start gap-3.5">
            <tone.Icon size={19} className={cn("mt-0.5 shrink-0", tone.icon)} aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <h1 className="text-[17px] font-semibold text-ink">{meta.label}</h1>
              <p className="mt-1 text-[14px] leading-6 text-ink-secondary">{meta.blurb}</p>
            </div>
          </div>
          <p className="mt-3 flex items-center gap-1.5 border-t border-current/10 pt-3 text-[12px] text-ink-tertiary">
            <FiRefreshCw size={12} className="shrink-0" aria-hidden="true" />
            This page updates automatically — no need to refresh.
          </p>
        </div>

        {/* Invoice */}
        <section className="anim-rise mt-5 overflow-hidden rounded-[var(--radius-lg)] border border-line bg-surface shadow-card">
          <div className="flex flex-wrap items-end justify-between gap-4 border-b border-line bg-inset px-5 py-5">
            <div>
              <h2 className="text-[13px] font-semibold uppercase tracking-[0.06em] text-ink-tertiary">
                Invoice
              </h2>
              <p className="mt-1.5 tnum text-[22px] font-semibold tracking-[-0.02em] text-ink">
                {order.reference}
              </p>
              <p className="mt-1 text-[12px] text-ink-tertiary tnum">
                {order.placedAtLabel || "—"}
              </p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <CopyButton value={order.reference} label="Copy reference" />
              <Money
                amount={order.total ?? 0}
                currency={orderCurrency}
                emphasis
                className="text-[26px] text-ink"
              />
            </div>
          </div>

          <ul className="divide-y divide-hairline px-5">
            {lines.map((line, index) => (
              <li
                key={`${line.serviceId}-${line.label}-${index}`}
                className="flex items-start justify-between gap-4 py-4"
              >
                <div className="min-w-0">
                  <p className="text-[15px] font-medium text-ink">{line.serviceName}</p>
                  <p className="mt-0.5 text-[13px] text-ink-secondary">
                    {[line.label, line.type, line.duration].filter(Boolean).join(" · ")}
                  </p>
                  <p className="mt-0.5 text-[12px] text-ink-tertiary tnum">
                    {line.quantity} × <Money amount={line.unitPrice} currency={orderCurrency} />
                  </p>
                </div>
                <Money
                  amount={line.lineTotal}
                  currency={orderCurrency}
                  className="shrink-0 text-[15px] font-semibold text-ink"
                />
              </li>
            ))}
          </ul>

          <dl className="space-y-2.5 border-t border-line px-5 py-4 text-[14px]">
            <div className="flex items-baseline justify-between gap-3">
              <dt className="text-ink-secondary">Subtotal</dt>
              <dd className="tnum text-ink">
                <Money amount={order.subtotal ?? 0} currency={orderCurrency} />
              </dd>
            </div>
            <div className="flex items-baseline justify-between gap-3">
              <dt className="text-ink-secondary">Payment method</dt>
              <dd className="text-ink">{order.payment?.method || BUSINESS.whish.label}</dd>
            </div>
            <div className="flex items-baseline justify-between gap-3 border-t border-line pt-3.5">
              <dt className="text-[16px] font-semibold text-ink">Total</dt>
              <dd>
                <Money
                  amount={order.total ?? 0}
                  currency={orderCurrency}
                  emphasis
                  className="text-[22px] text-ink"
                />
              </dd>
            </div>
          </dl>
        </section>

        {/* Payment instructions */}
        <section
          className="anim-rise mt-5 rounded-[var(--radius-lg)] border border-line bg-surface p-5 shadow-card"
          style={{ animationDelay: "80ms" }}
        >
          <h2 className="text-[15px] font-semibold text-ink">Payment instructions</h2>

          <div className="mt-3.5 flex flex-wrap items-center gap-2.5 rounded-[var(--radius-md)] border border-brand bg-brand-soft p-3.5">
            <span className="text-[13px] font-medium text-brand-strong">Whish</span>
            <span className="tnum ml-auto text-[19px] font-semibold tracking-[-0.01em] text-ink">
              {formatWhishNumber(order.payment?.number || BUSINESS.whish.number)}
            </span>
            <CopyButton
              value={order.payment?.number || BUSINESS.whish.number}
              label="Copy"
            />
          </div>

          <ol className="mt-4 space-y-2">
            {[
              {
                icon: FiDollarSign,
                text:
                  orderCurrency === "LBP"
                    ? "Send the total in Lebanese Lira by Whish."
                    : "Send the total in USD by Whish.",
              },
              {
                icon: FiHash,
                text: "Use your invoice reference as the transfer note.",
              },
              {
                icon: FiMessageCircle,
                text: "Send the order summary on WhatsApp so it can be verified.",
              },
            ].map((item) => (
              <li key={item.text} className="flex gap-2.5 text-[13px] leading-6 text-ink-secondary">
                <item.icon size={14} className="mt-[5px] shrink-0 text-ink-tertiary" aria-hidden="true" />
                {item.text}
              </li>
            ))}
          </ol>
        </section>

        {/* Actions */}
        <div
          className="anim-rise mt-5 flex flex-col gap-2.5 sm:flex-row"
          style={{ animationDelay: "140ms" }}
        >
          <Button
            as="a"
            size="lg"
            block
            href={whatsappLink(message)}
            target="_blank"
            rel="noopener noreferrer"
          >
            <FiMessageCircle size={16} />
            Send order on WhatsApp
          </Button>

          {status === ORDER_STATUS.PENDING_PAYMENT && (
            <Button
              size="lg"
              variant="secondary"
              block
              onClick={markSent}
              disabled={marking}
            >
              {marking ? <Spinner /> : <FiFileText size={15} />}
              I have sent the payment
            </Button>
          )}
        </div>

        {status === ORDER_STATUS.PENDING_PAYMENT && (
          <p className="mt-3 text-[12px] leading-5 text-ink-tertiary">
            Confirming here lets Cedars Tech know the transfer is on its way. Your
            order stays “pending payment” until they verify it.
          </p>
        )}

        <p className="mt-7 text-[12px] leading-5 text-ink-tertiary">
          Questions about this order? Message Cedars Tech on WhatsApp with your
          invoice reference.{" "}
          <Link
            to={ROUTES.storefront}
            className="text-ink-secondary underline decoration-line-strong underline-offset-2 transition-colors hover:text-ink"
          >
            Continue browsing
          </Link>
        </p>
      </main>
    </StoreLayout>
  );
}
