# ScentIQ Step 28 — final implementation roadmap

This document is the release-oriented interpretation of the Step 28 brief. It records what exists in the repository, what was closed in this step, and which launch gates require real infrastructure or business data. A feature is not called complete merely because a database model exists.

## Delivery rules

- Arabic storefront is the default, English remains available, and public routes keep the existing `[lang]` App Router structure.
- The store is single-vendor, cash-on-delivery first, and prices and stock are recalculated on the server.
- Public catalog content can use caching/revalidation; Studio, cart, checkout, account and order work stay dynamic.
- Admin changes require server-side permission checks and important mutations create activity/audit records.
- Production seed mode does not create fake customers, orders, reviews, analytics or popularity claims.
- Rule-based recommendations are the default; no paid AI dependency is required.

## Phase ledger

| Phase | Scope | Repository status | Evidence / next gate |
|---:|---|---|---|
| 0 | Audit and inventory | Operational | This ledger plus `roadmap:audit`, QA audit and System Health provide repeatable evidence. |
| 1 | Design system | Operational | Tailwind tokens, global styles, shared Button/EmptyState/Toast/Confirm/StatusBadge components. |
| 2 | Database and seed | Operational | Comprehensive Prisma schema, migrations, idempotent seed modes and core production-safe seed. Production DB migration remains a deployment gate. |
| 3 | Authentication and roles | Operational | Auth.js, middleware, session versioning, server authorization and granular role permissions. |
| 4 | Perfume Studio shell | Operational | Protected layout, sidebar, mobile navigation, product search, notifications and session timeout. |
| 5 | Product management | Operational | Step 28 adds real create/edit forms, bilingual content, pricing, audited initial stock, notes, media, tags, SEO and publishing permissions. Import remains available. |
| 6 | Brand/category/note/tag data | Operational | Brands/categories support create/edit/archive, while Step 29 adds dedicated note/tag management with granular permissions and in-use deletion protection. |
| 7 | Media system | Operational | Authenticated upload API, reusable Media Library, metadata, browse/search and product assignment. Cloud object storage is a production environment choice. |
| 8 | Public architecture | Operational | Locale-prefixed App Router, canonical redirects, shared storefront layout and dynamic/private route separation. |
| 9 | Homepage | Operational | Real database-backed sections and product selections; final merchandising copy/images are business-content work. |
| 10 | Product detail | Operational | Bilingual product data, price/stock, notes, recommendations, reviews and structured signals. |
| 11 | Brands and categories | Operational | Public listing/detail routes are backed by real records and Studio-managed status/content. |
| 12 | Collections | Operational | Full manual/dynamic/hybrid collection editor, ordering, rules, relations and public routes. |
| 13 | Search and filters | Operational | Server search, aliases, filtering, sorting and mobile filter drawer. Search quality tuning depends on real catalog/query data. |
| 14 | Cart | Operational | Persistent cart with server-side validation and inventory-aware product/variant selection. |
| 15 | Checkout and COD | Operational | Iraqi delivery fields, COD order creation, price/stock validation and confirmation flow. Production delivery rules need final business values. |
| 16 | Orders | Operational | Studio order queue/detail/status timeline, delivery integration points and inventory lifecycle. |
| 17 | Inventory | Operational | Atomic reservations/movements, variants, alerts, import/export, bulk controls and complete movement history. |
| 18 | Reviews and trust | Operational | Moderation, verified-purchase priority, helpful voting, filters, replies and real-data-only trust presentation. |
| 19 | Recommendations | Operational | Transparent rule-based engine, configurable data, logs and Studio diagnostics; no paid AI requirement. |
| 20 | SEO | Operational | Metadata, canonical/hreflang, sitemap, robots and structured data. Domain/indexing verification is a launch gate. |
| 21 | Analytics | Operational | Internal event and commerce dashboards. Conclusions remain empty until real events exist. |
| 22 | Settings and delivery | Operational | Database-backed settings, delivery companies, homepage controls, setup workflow and validation. |
| 23 | Performance | Operational | Image strategy, pagination, caching/revalidation and automated performance budget. Real-device Lighthouse is a staging gate. |
| 24 | Security and audit | Operational | Permissions, rate limits, validation, secure headers, log redaction, audit/activity trails and session controls. |
| 25 | UI polish | Operational | Step 27 shared feedback/empty states, responsive cards/drawers, truthful copy and interaction audits. |
| 26 | QA and release | Code-complete; environment-gated | Automated tests/type/lint/build/budget plus launch runbooks. Requires real `.env`, migrated PostgreSQL, private staging smoke test, domain and operational approval. |

## Step 28 changes

1. Replaced the unfinished Add Product message with a real database-backed product editor.
2. Added a product edit route and edit links from both desktop and mobile product lists.
3. Kept inventory auditable: creation can make an `INITIAL_STOCK` movement; later stock edits stay in Inventory Manager.
4. Added operational brand and category create/update/archive workflows with permission checks and activity logs.
5. Added role-aware Studio mobile navigation and changed the inert global search field into a real product/SKU search.
6. Added `pnpm roadmap:audit` and Step 28 architecture tests to protect these release-critical paths.

## Priority order from here

1. **Attach production-like infrastructure:** set the real environment variables, migrate PostgreSQL, configure durable media storage and create the first approved admin.
2. **Enter real catalog and operating data:** brands, categories, notes/tags, products, IQD prices, stock, delivery zones/fees, support contacts and policies.
3. **Run private staging acceptance:** execute `pnpm release:check`, then `QA_BASE_URL=https://… pnpm qa:smoke`; test Arabic/English, mobile, COD, order transitions, stock rollback and admin permissions.
4. **Complete launch authority gates:** approve legal/policy copy, domain/DNS, backups, monitoring contacts and go-live checklist.
5. **Post-MVP improvements:** dedicated note/tag editors, autosave/live preview for long product edits, review-request messaging integrations, and search/recommendation tuning from real behavior.

## Definition of launch-ready

Launch-ready means the exact release commit passes automated checks, the same commit is deployed privately with a migrated database, staging smoke and manual mobile/RTL journeys pass, real delivery and support settings are approved, backups are tested, and no production page depends on demo claims or placeholder data.
