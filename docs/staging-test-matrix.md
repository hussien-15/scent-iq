# Staging test matrix

Record the test build/deployment ID, date, tester, data fixtures, device, OS, browser/version and evidence link in **Studio → QA & Launch**.

| Area             | Minimum staging coverage                                                                                       | Launch expectation                                              |
| ---------------- | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| Storefront       | Home, product, brand, category, collection, guide, note, search, filters, sort, pagination, wishlist, cart     | Published data only; no broken links or private records         |
| Checkout and COD | Iraqi phone/address validation, city/company/fee, totals, duplicate submit, confirmation, controlled order     | Server totals match; one order; valid number; no oversell       |
| Order lifecycle  | Pending, confirmed, preparing, shipped, delivered, cancel, return                                              | Valid transitions, history and inventory exactly once           |
| Inventory        | Product/variant stock, reservations, low/out/hidden states, imports/exports, movements                         | No negative available stock; public availability truthful       |
| Studio           | Login/logout, session change, dashboard, catalog, media, reviews, SEO, delivery, settings, analytics, activity | Real data and useful empty/error states                         |
| RBAC             | Super Admin, Manager, content, order, inventory, support, SEO and Viewer                                       | Hidden navigation plus server denial for unauthorized mutations |
| SEO              | Metadata, canonicals, hreflang, JSON-LD, robots, sitemap, redirects, 404                                       | Only Live public content is indexable                           |
| Security         | Action/API validation, upload/import limits, revalidation, webhooks, secret boundaries                         | Unauthorized and malformed requests fail safely                 |
| Arabic/RTL       | Navigation, forms, prices, mixed text, cards, truncation, errors                                               | Natural RTL without reversed controls or overflow               |
| English/LTR      | Same critical routes and forms                                                                                 | Complete content and correct alignment                          |
| Accessibility    | Keyboard, focus, labels, landmarks, contrast, reduced motion, alt text                                         | Critical journeys usable without a pointer                      |
| Performance      | Route budget, image sizing, loading states, cache/ISR, p75 CWV                                                 | Automated budget passes; field evidence reviewed                |

## Viewports and browsers

- Small mobile: 320×568 and a current 360–390 px Android/iPhone viewport.
- Tablet: 768×1024 in portrait and landscape where layout changes.
- Desktop: 1280×720 and 1440×900 or larger.
- Current stable Chrome, Safari, Firefox and Edge. Use real iOS Safari and Android Chrome for checkout when available.

## Iraqi market cases

- Arabic and English customer names and Iraqi mobile formats.
- Baghdad plus at least one configured non-Baghdad destination.
- An unsupported city/area, missing fee and disabled delivery company.
- IQD rounding, COD wording, support channels and order-confirmation follow-up.
- Low stock, final available unit, simultaneous checkout attempt, cancellation before shipping, delivery and return decision.
