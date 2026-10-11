# Cedars Tech — Streaming Storefront

A premium, minimal subscription storefront. Customers browse, build a cart,
pay by **Whish transfer**, get a real invoice reference, and confirm the
order on **WhatsApp**.

Built with Vite + React 19 + Tailwind v4, backed by Firestore. Deployed under
the `/streaming` sub-path.

## Commands

```bash
npm run dev      # local dev server
npm run build    # production build to dist/
npm run lint     # eslint
npm run preview  # serve the production build
```

## Customer journey

| Route | Purpose |
| --- | --- |
| `/prices` | Browse subscriptions, search, filter, sort |
| `/prices/product/:slug` | Pick a real plan option, quantity, add to cart |
| `/prices/cart` | Edit quantities, review line items and totals |
| `/prices/checkout` | Name + WhatsApp number, then Whish payment |
| `/prices/order/:reference` | Invoice, payment instructions, live status |
| `/login`, `/admin` | Store management |

Legacy links are preserved: `/streaming?s=netflix` redirects to the product
page, `?c=streaming` selects the category, `/` redirects to `/prices`.

## Order status model

```
pending_payment  →  awaiting_verification  →  confirmed
```

- `pending_payment` — order created, no transfer seen yet.
- `awaiting_verification` — the customer has tapped **“I have sent the
  payment”**. The customer is *claiming* they paid; nothing is verified.
- `confirmed` — set **only** by a human from the Admin → Orders tab after
  checking the Whish app. The app never auto-confirms.
- `cancelled` — also an owner action.

Statuses live in the Firestore `orders` collection and stream live to the
invoice page, so both sides always see the same state.

## Design system

Tokens live in `src/index.css`.

- **Palette** — a warm paper canvas (`#f4f2ec`) with white surfaces, warm
  near-black ink, and one cedar-blue accent reserved for action and signal.
  Dark mode mirrors the structure on a warm near-black.
- **Identity** — every service in the catalogue has its **genuine brand
  mark** in `src/assets/logos/`. The plate tint and accent for each service
  are sampled directly from that artwork's own pixels, so a service's
  identity colour always matches the mark we are allowed to display.
  Services without a legitimate asset fall back to a typographic monogram —
  never to a substitute or invented logo.
- **Type** — one optical treatment for headings (tracking `-0.028em`),
  tabular numerals anywhere a number changes, uppercase tracked
  micro-labels for metadata, and `display-price` for price anchors.
- **Radii / elevation** — a single radius scale and three restrained shadow
  levels.
- **Motion** — 160ms `cubic-bezier(0.2, 0, 0, 1)` on hover/selection only,
  a 220ms cart-badge pop, and full `prefers-reduced-motion` support.

## Architecture

```
src/
  lib/
    config.js       business constants (WhatsApp, Whish number, order prefix)
    catalog.js      Firestore → normalized services + pricing helpers
    cart.js         cart store (localStorage) + live price resolution
    orders.js       Firestore order CRUD + live subscriptions
    invoice.js      reference generation + WhatsApp message builder
    serviceBrand.js service → brand asset mapping
    validation.js   customer detail validation
    format.js       money / date formatting
    inputStyles.js  shared control styling
  hooks/            useCatalog, useTheme, useCustomerDetails
  components/ui/    Button, Field, Money, Badge, QuantityStepper, CopyButton…
  components/storefront/  Header, ProductCard, ServiceLogo, StoreLayout
  pages/            Storefront, Product, Cart, Checkout, OrderStatus, Login, Admin
```

### Pricing

A plan's final price is `sellPrice − discount`, with missing or non-numeric
values treated as `0` — the same arithmetic the store has always used.
Cart lines store only *references* (`serviceId` + `planKey` + quantity) and
resolve prices from the live catalogue at render time, so an admin price
change can never leave a stale total on screen.

## Service logo assets

All logos in `src/assets/logos/` are genuine brand marks sourced from
Wikimedia Commons. `src/assets/logos/CREDITS.json` records the source file,
author and licence for each. Logos are bundled at build time — no hotlinking.

Services are mapped only when a legitimate asset exists. The current
catalogue maps all six: Netflix, Disney+, Amazon Prime Video, OSN+, Shahid
and Anghami.

## Known issues worth fixing

1. **Firestore rules are wide open.** The `services` and `orders` collections
   are readable *and* writable by anyone holding the public API key. `admin/`
   is also world-readable and stores the admin password in plain text.
   Recommended: lock `orders` to create-only, move the admin password to
   Firebase Auth, and restrict `services` writes to the owner.
2. **Data hygiene in Firestore.** `inStock` is missing on many plans (treated
   as in stock), `duration` is missing on several, and the Netflix 1-year
   Full Account has `discount: "02"`, which reads as $2 off. The storefront
   does not silently “fix” these — they are surfaced from the data as-is.
3. **Bundle size.** Firebase + icons dominate the single JS chunk.
   Route-level `React.lazy` would split the admin panel out of the
   storefront bundle.
