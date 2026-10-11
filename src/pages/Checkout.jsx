import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiArrowRight, FiCheck, FiLock, FiPhone } from "react-icons/fi";
import Header from "../components/storefront/Header";
import ServiceLogo from "../components/storefront/ServiceLogo";
import StoreLayout from "../components/storefront/StoreLayout";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import CopyButton from "../components/ui/CopyButton";
import { PanelSkeleton, Spinner } from "../components/ui/Feedback";
import Field from "../components/ui/Field";
import Money from "../components/ui/Money";
import { PageState } from "../components/ui/EmptyState";
import { useCustomerDetails } from "../hooks/useCustomerDetails";
import { useCatalog } from "../hooks/useCatalog";
import { cartStore, resolveCart, useCart } from "../lib/cart";
import { useCurrency } from "../lib/currency";
import { BUSINESS, ROUTES } from "../lib/config";
import { formatDateTime } from "../lib/format";
import { inputClasses, textareaClasses } from "../lib/inputStyles";
import { createReference, formatWhishNumber } from "../lib/invoice";
import { createOrder, orderExists } from "../lib/orders";
import { validateDetails } from "../lib/validation";
import { cn } from "../lib/cn";

const STEPS = [
  { label: "Details", description: "Name and WhatsApp number" },
  { label: "Payment", description: "Whish transfer instructions" },
  { label: "Invoice", description: "Reference and order summary" },
];

export default function Checkout() {
  const navigate = useNavigate();
  const { services, loading } = useCatalog();
  const { currency } = useCurrency();
  const items = useCart();
  const { details, update } = useCustomerDetails();

  const [step, setStep] = useState(0);
  const [touched, setTouched] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const placedRef = useRef(false);

  const { lines, count, subtotal, loading: cartLoading } = resolveCart(
    items,
    services,
    { loading }
  );
  const purchasable = lines.filter((line) => line.inStock);

  useEffect(() => {
    if (!placedRef.current && !cartLoading && items.length === 0)
      navigate(ROUTES.cart, { replace: true });
  }, [items.length, cartLoading, navigate]);

  const errors = validateDetails(details);
  const detailsValid = Object.keys(errors).length === 0;

  const placeOrder = async () => {
    setTouched(true);
    if (!detailsValid || purchasable.length === 0) return;

    setPlacing(true);
    setSubmitError(null);

    try {
      const now = new Date();

      // Guarantee a unique reference before we write.
      let reference = createReference(now);
      for (let attempt = 0; attempt < 5 && (await orderExists(reference)); attempt++) {
        reference = createReference(now);
      }

      await createOrder({
        reference,
        currency,
        lines: purchasable.map((line) => ({
          serviceId: line.serviceId,
          serviceName: line.serviceName,
          label: line.label,
          type: line.type,
          duration: line.duration,
          unitPrice: line.unitPrice,
          quantity: line.quantity,
          lineTotal: line.lineTotal,
        })),
        subtotal,
        fees: [],
        total: subtotal,
        payment: {
          method: BUSINESS.whish.label,
          number: BUSINESS.whish.number,
        },
        customer: {
          name: details.name.trim(),
          phone: details.phone.trim(),
          notes: details.notes.trim(),
        },
        placedAtLabel: formatDateTime(now),
      });

      placedRef.current = true;
      navigate(ROUTES.order(reference), { replace: true });
      cartStore.clear();
    } catch {
      placedRef.current = false;
      setSubmitError(
        "We could not create your order. Please try again or contact us on WhatsApp."
      );
    } finally {
      setPlacing(false);
    }
  };

  return (
    <StoreLayout>
      <Header services={services} />

      <main id="main" className="mx-auto max-w-6xl px-5 pb-16 pt-9 lg:px-8 lg:pt-12">
        <h1 className="text-[28px] font-semibold leading-[1.15] tracking-[-0.03em] text-ink sm:text-[34px]">
          Checkout
        </h1>

        <Stepper current={step} />

        {cartLoading ? (
          <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
            <PanelSkeleton />
            <PanelSkeleton />
          </div>
        ) : (
          <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
            <div>
              {step === 0 && (
                <section
                  key="details"
                  className="anim-fade rounded-[var(--radius-lg)] border border-line bg-surface p-5 shadow-card sm:p-6"
                >                  <h2 className="text-[17px] font-semibold text-ink">Your details</h2>
                  <p className="mt-1.5 max-w-md text-[14px] leading-6 text-ink-secondary">
                    {BUSINESS.name} uses this to process your order and reach you
                    on WhatsApp.
                  </p>

                  <div className="mt-6 space-y-5">
                    <Field
                      label="Full name"
                      id="full-name"
                      required
                      error={touched ? errors.name : undefined}
                    >
                      <input
                        id="full-name"
                        autoComplete="name"
                        value={details.name}
                        onChange={(event) => update("name", event.target.value)}
                        onBlur={() => setTouched(true)}
                        placeholder="e.g. Rami Haddad"
                        className={inputClasses(Boolean(touched && errors.name))}
                      />
                    </Field>

                    <Field
                      label="WhatsApp number"
                      id="whatsapp-number"
                      required
                      error={touched ? errors.phone : undefined}
                      hint="Include the country code, e.g. 961 71 234 567."
                    >
                      <div className="relative">
                        <FiPhone
                          className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-tertiary"
                          aria-hidden="true"
                        />
                        <input
                          id="whatsapp-number"
                          type="tel"
                          inputMode="tel"
                          autoComplete="tel"
                          value={details.phone}
                          onChange={(event) => update("phone", event.target.value)}
                          onBlur={() => setTouched(true)}
                          placeholder="961 71 234 567"
                          className={inputClasses(
                            Boolean(touched && errors.phone),
                            "pl-10"
                          )}
                        />
                      </div>
                    </Field>

                    <Field
                      label="Notes"
                      id="order-notes"
                      hint="Optional — anything Cedars Tech should know, such as a profile email or delivery timing."
                    >
                      <textarea
                        id="order-notes"
                        rows={3}
                        value={details.notes}
                        onChange={(event) => update("notes", event.target.value)}
                        placeholder="Optional"
                        className={textareaClasses(false)}
                      />
                    </Field>
                  </div>

                  <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
                    <Button size="lg" onClick={() => setStep(1)} disabled={!detailsValid}>
                      Continue to payment
                      <FiArrowRight size={16} />
                    </Button>
                    {!detailsValid && (
                      <p className="text-[13px] text-ink-tertiary">
                        Add your name and WhatsApp number to continue.
                      </p>
                    )}
                  </div>
                </section>
              )}

              {step === 1 && (
                <section
                  key="payment"
                  className="anim-fade rounded-[var(--radius-lg)] border border-line bg-surface p-5 shadow-card sm:p-6"
                >                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-[17px] font-semibold text-ink">
                        Payment method
                      </h2>
                      <p className="mt-1.5 text-[14px] text-ink-secondary">
                        Whish transfer, confirmed on WhatsApp.
                      </p>
                    </div>
                    <FiLock size={16} className="mt-1 shrink-0 text-ink-tertiary" aria-hidden="true" />
                  </div>

                  {/* The selected method */}
                  <div className="mt-5 rounded-[var(--radius-lg)] border-2 border-brand bg-brand-soft p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-[15px] font-semibold text-brand-strong">
                        {BUSINESS.whish.label}
                      </p>
                      <span
                        className="grid size-5 shrink-0 place-items-center rounded-full bg-brand text-ink-inverse"
                        aria-hidden="true"
                      >
                        <FiCheck size={12} />
                      </span>
                    </div>
                    <p className="mt-1 text-[13px] text-ink-secondary">
                      Send the exact total to the number below.
                    </p>

                    <div className="mt-3.5 flex flex-wrap items-center gap-2.5">
                      <span className="tnum text-[20px] font-semibold tracking-[-0.01em] text-ink">
                        {formatWhishNumber(BUSINESS.whish.number)}
                      </span>
                      <CopyButton value={BUSINESS.whish.number} label="Copy number" />
                    </div>
                  </div>

                  <div className="mt-4 rounded-[var(--radius-lg)] border border-line bg-inset p-4">
                    <p className="text-[13px] font-semibold text-ink">How to pay</p>
                    <ol className="mt-2.5 space-y-2">
                      {[
                        "Place your order to generate the invoice reference.",
                        "Send the total to the Whish number above, using your invoice reference as the transfer note.",
                        "Confirm the order on WhatsApp so Cedars Tech can verify the transfer.",
                      ].map((text, index) => (
                        <li key={text} className="flex gap-2.5 text-[13px] leading-6 text-ink-secondary">
                          <span className="grid size-5 shrink-0 place-items-center rounded-full border border-line bg-surface text-[11px] font-semibold text-ink-tertiary tnum">
                            {index + 1}
                          </span>
                          {text}
                        </li>
                      ))}
                    </ol>
                  </div>

                  <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
                    <Button variant="secondary" onClick={() => setStep(0)}>
                      Back
                    </Button>
                    <Button
                      size="lg"
                      onClick={placeOrder}
                      disabled={placing || cartLoading || purchasable.length === 0}
                    >
                      {placing ? (
                        <>
                          <Spinner /> Placing order…
                        </>
                      ) : cartLoading ? (
                        <>
                          <Spinner /> Loading cart…
                        </>
                      ) : (
                        <>
                          Place order · <Money amount={subtotal} currency={currency} />
                        </>
                      )}
                    </Button>
                  </div>

                  {submitError && (
                    <p role="alert" className="anim-rise mt-3 text-[13px] text-danger">
                      {submitError}
                    </p>
                  )}

                  <p className="mt-5 text-[12px] leading-5 text-ink-tertiary">
                    You will be redirected to your invoice, where you can send the
                    order summary to Cedars Tech on WhatsApp.
                  </p>
                </section>
              )}

              {step === 2 && (
                <section className="rounded-[var(--radius-lg)] border border-line bg-surface p-6 shadow-card">
                  <h2 className="text-[17px] font-semibold text-ink">Order created</h2>
                  <p className="mt-1.5 text-[14px] text-ink-secondary">
                    Taking you to your invoice…
                  </p>
                </section>
              )}
            </div>

            {/* Order summary */}
            <aside className="lg:sticky lg:top-[calc(var(--header-h)+1.5rem)]">
              <div className="rounded-[var(--radius-lg)] border border-line bg-surface p-5 shadow-card">
                <div className="flex items-baseline justify-between gap-3">
                  <h2 className="text-[15px] font-semibold text-ink">Order summary</h2>
                  <span className="text-[12px] text-ink-tertiary tnum">
                    {count} {count === 1 ? "item" : "items"}
                  </span>
                </div>

                <ul className="mt-4 space-y-3.5">
                  {purchasable.map((line) => (
                    <li
                      key={`${line.serviceId}:${line.planKey}`}
                      className="flex items-start gap-3"
                    >
                      <ServiceLogo service={{ name: line.serviceName }} size="xs" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[14px] font-medium text-ink">
                          {line.serviceName}
                        </p>
                        <p className="truncate text-[12px] text-ink-tertiary">
                          {[line.label, line.type].filter(Boolean).join(" · ")}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <Money
                          key={line.lineTotal}
                          amount={line.lineTotal}
                          currency={currency}
                          className="anim-num justify-end text-[14px] font-medium text-ink"
                        />
                        {line.quantity > 1 && (
                          <p className="text-[12px] text-ink-tertiary tnum">
                            × {line.quantity}
                          </p>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>

                <dl className="mt-4 space-y-2.5 border-t border-line pt-4 text-[14px]">
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

                <div className="mt-4 flex items-center justify-between gap-3 border-t border-hairline pt-4">
                  <span className="text-[13px] text-ink-tertiary">Payment</span>
                  <Badge tone="brand">{BUSINESS.whish.label}</Badge>
                </div>
              </div>
            </aside>
          </div>
        )}
      </main>
    </StoreLayout>
  );
}

function Stepper({ current }) {
  return (
    <ol className="mt-7 flex items-center gap-2 sm:gap-3">
      {STEPS.map((step, index) => {
        const state = index < current ? "done" : index === current ? "current" : "todo";
        return (
          <li key={step.label} className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
            <span
              className={cn(
                "flex items-center gap-2 rounded-[var(--radius-pill)] border py-1.5 pl-1.5 pr-3 transition-colors duration-150",
                state === "current" && "border-brand bg-brand-soft",
                state === "done" && "border-line bg-surface",
                state === "todo" && "border-transparent bg-transparent"
              )}
              aria-current={state === "current" ? "step" : undefined}
            >
              <span
                className={cn(
                  "grid size-6 shrink-0 place-items-center rounded-full text-[12px] font-semibold tnum transition-all duration-200 ease-out",
                  state === "current" && "bg-brand text-ink-inverse",
                  state === "done" && "bg-brand text-ink-inverse",
                  state === "todo" && "border border-line bg-surface text-ink-tertiary"
                )}
              >
                {state === "done" ? (
                  <FiCheck key={`done-${index}`} size={12} className="anim-tick" />
                ) : (
                  <span key={`num-${index}-${state}`} className="anim-num inline-block">
                    {index + 1}
                  </span>
                )}
              </span>
              <span
                className={cn(
                  "truncate text-[13px] font-medium",
                  state === "todo" ? "text-ink-tertiary" : "text-ink"
                )}
              >
                {step.label}
              </span>
            </span>

            {index < STEPS.length - 1 && (
              <span
                aria-hidden="true"
                className={cn(
                  "hidden h-px flex-1 sm:block",
                  index < current ? "bg-brand" : "bg-line"
                )}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
