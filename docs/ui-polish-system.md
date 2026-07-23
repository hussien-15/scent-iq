# ScentIQ UI polish system

Step 27 turns the existing storefront and Perfume Studio into a coherent luxury interface without changing the database schema or replacing the Next.js architecture.

## Voice and trust

- Arabic is primary: clear Modern Standard Arabic with warm, familiar wording and minimal slang.
- English stays short, calm, and operational.
- Trust copy describes the actual process—careful sourcing, packaging checks, configured support, and delivery data—without absolute authenticity guarantees, invented urgency, or fixed delivery times.
- Social proof and stock badges must come from recorded data. Empty data stays empty instead of being replaced with sample numbers.

## Shared interface primitives

- `Button` provides primary, secondary, ghost, danger, icon, text, loading, and disabled states.
- `EmptyState` gives blank areas a clear title, short explanation, icon, and useful next action.
- `ToastProvider` supports success, error, warning, and information feedback, limits concurrent messages, auto-dismisses, and allows manual close.
- `ConfirmDialog` protects destructive or visibility-changing operations and supports Escape, focus restoration, loading, and danger styling.
- `StatusBadge` centralizes readable product, inventory, review, and order states.

Use these components before creating page-specific alternatives. Keep one primary action per section.

## Storefront rules

- Product cards show availability and discount only when backed by `availableStock`, thresholds, variants, and real prices.
- Quick add is available only for a known, available base product. Products with variants send the customer to size selection.
- IQD uses whole-number formatting such as `45,000 د.ع`; another stored currency uses its standard currency formatter.
- Performance labels explain longevity, projection, and sillage in plain language.
- Cart, wishlist, checkout, reviews, search, and shop results never render a blank screen.
- Mobile shop filters use an RTL-safe bottom sheet and keep the existing desktop filter links.

## Studio rules

- Empty products, orders, reviews, analytics, customers, brands, categories, and media offer an operational next step.
- Product and order listings become cards on small screens instead of forcing wide tables.
- Cancellation, return, hiding, archiving, discontinuing, and spam deletion require a styled confirmation.
- Dates that affect operations use an explicit Iraq timezone. Prices use the shared IQD formatter.
- Media Library uploads through the existing protected endpoint, validates supported image formats and size on the server, detects duplicates, and reports the result with a toast.

## Accessibility and motion

- Maintain visible `:focus-visible` outlines, semantic buttons, accessible names, image alt text, and `aria-live` feedback.
- Touch targets should be at least 40–44 px for important controls.
- Drawers lock background scroll and close with Escape; destructive dialogs restore focus.
- Hover, fade, sheet, and toast motion must remain subtle and collapse under `prefers-reduced-motion`.

## Release checks

Run:

```bash
pnpm ui:audit
pnpm test
pnpm typecheck
pnpm lint
pnpm build
```

Before Live Mode, visually test Arabic and English with real product images, long names, missing media, low/out-of-stock products, a populated cart, failed delivery lookup, order confirmation, empty Studio data, and phone/tablet/desktop viewports.
