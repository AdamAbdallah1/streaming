// Business configuration.
//
// Every value here must be verifiable. Do not invent contact details,
// prices, fees, or claims. Anything that cannot be verified is omitted
// rather than guessed at.

export const BUSINESS = {
  name: "Cedars Tech",
  country: "LB",
  currency: "USD",

  /**
   * Verified: identical to the WhatsApp number used by the previous
   * integration and published on the Cedars Tech store profile.
   */
  whatsapp: "96181090757",

  /**
   * Whish Money transfer number carried over from the existing payment
   * instructions. No account holder name is published anywhere verified,
   * so none is shown to customers.
   */
  whish: {
    label: "Whish Money",
    number: "81090757",
    holderName: "",
  },
};

/** Lebanese Lira rate used by the existing storefront. */
export const LBP_RATE = 89500;

export const CURRENCIES = [
  { code: "USD", label: "USD" },
  { code: "LBP", label: "L.L." },
];

export const ORDER = {
  prefix: "CT",
  collection: "orders",
};

export const ORDER_STATUS = {
  PENDING_PAYMENT: "pending_payment",
  AWAITING_VERIFICATION: "awaiting_verification",
  CONFIRMED: "confirmed",
  CANCELLED: "cancelled",
};

export const ORDER_STATUS_META = {
  [ORDER_STATUS.PENDING_PAYMENT]: {
    label: "Pending payment",
    tone: "warning",
    blurb: "Waiting for your Whish transfer.",
  },
  [ORDER_STATUS.AWAITING_VERIFICATION]: {
    label: "Awaiting verification",
    tone: "info",
    blurb: "Payment marked as sent — Cedars Tech is verifying it.",
  },
  [ORDER_STATUS.CONFIRMED]: {
    label: "Confirmed",
    tone: "positive",
    blurb: "Your payment has been verified by Cedars Tech.",
  },
  [ORDER_STATUS.CANCELLED]: {
    label: "Cancelled",
    tone: "danger",
    blurb: "This order was cancelled.",
  },
};

export const STORAGE_KEYS = {
  theme: "theme",
  cart: "cedars_cart_v1",
  customer: "cedars_customer_v1",
  currency: "cedars_currency_v1",
  adminAuth: "cedars_admin_auth",
};

export const ROUTES = {
  storefront: "/prices",
  product: (slug) => `/prices/product/${slug}`,
  cart: "/prices/cart",
  checkout: "/prices/checkout",
  order: (reference) => `/prices/order/${reference}`,
};
