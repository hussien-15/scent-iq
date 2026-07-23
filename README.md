# ScentIQ — Phase 1 Foundation + Step 29 Production Specification

## Step 29 — production specification compliance

Step 29 audits the complete product specification against the working platform and closes the remaining catalog-operation gaps without replacing the current App Router structure. Products can now be duplicated safely as zero-stock drafts, soft-archived with audit evidence, privately previewed before publication, and reviewed against a visible completion checklist. Perfume Studio now includes dedicated fragrance-note and product-tag management with granular permissions and deletion protection for in-use records. Product, brand, category and note slug edits automatically preserve old URLs through permanent redirect records.

Run `pnpm step29:audit` for the Step 29 structural compliance checks. The full matrix, intentional architecture decisions, environment-owned launch gates and manual test sequence are in [`docs/step29-production-compliance.md`](docs/step29-production-compliance.md).

Next.js + TypeScript + Prisma + PostgreSQL + Auth.js. Cart, checkout, and order
management are implemented for Cash-on-Delivery in Iraq
per the spec. Every "Add to Bag" button, sticky buy bar, and empty Orders
page from the last nine passes was waiting for exactly this.

## Step 28 — final implementation roadmap and operational admin gaps

Step 28 turns the final developer brief into an auditable phase ledger and closes the most important mismatch found during inspection: product creation is now a real, permission-protected workflow instead of an unfinished message. Perfume Studio now provides product create/edit, structured bilingual content, server-validated pricing, audited initial stock, fragrance notes, media, tags, performance facets, SEO and publish controls. Brands and categories have create/edit/archive workflows, and mobile Studio navigation plus topbar product/SKU search are functional.

Run `pnpm roadmap:audit` to verify the release-critical Step 28 invariants. The full phase ledger, evidence and environment-dependent launch gates are in [`docs/final-implementation-roadmap.md`](docs/final-implementation-roadmap.md).

## Step 27 — UI polish, copy, empty states and microinteractions

- Bilingual storefront copy now uses a calmer premium voice, honest trust language, plain-language perfume performance help, and consistent IQD formatting.
- Shared button, empty-state, toast, confirmation-dialog, and status-badge components unify customer and Studio feedback.
- Product cards derive low/out-of-stock and discount signals from real inventory and price data, add safe quick-add behavior, and preserve variant selection.
- Designed empty/loading states cover shop, search, cart, wishlist, checkout, reviews, products, orders, customers, analytics, categories, brands, and media.
- Mobile shop filters use an RTL-safe bottom sheet; Studio product/order tables become readable mobile cards.
- Media Library is now an operational protected browse/search/upload surface instead of an unfinished placeholder.
- `pnpm ui:audit` and `tests/ui-polish.test.ts` protect translation parity, shared primitives, honest copy, and data-backed merchandising signals.

See [the UI polish system](docs/ui-polish-system.md) for copy, component, accessibility, motion, and release rules.

## Developer Quick Start

ScentIQ uses **pnpm only** and requires Node.js 22.13 or newer (Node.js 22 or 24 LTS). For a new local PostgreSQL database named `scentiq_dev`:

```bash
pnpm install
cp .env.example .env
# Windows PowerShell: Copy-Item .env.example .env

# Start PostgreSQL locally, or: docker compose up -d postgres
pnpm doctor
pnpm prisma:generate
pnpm prisma:migrate
pnpm seed:dev
pnpm doctor:db
pnpm dev
```

Open the Arabic storefront at `http://localhost:3000/ar`, admin login at
`http://localhost:3000/admin/login`, and the Super Admin health page at
`http://localhost:3000/admin/system-health`.

Read [docs/local-development.md](docs/local-development.md) for the Windows-first walkthrough. Existing Supabase databases must follow `DATABASE.md`; never run `db:reset` or `seed:dev` on them.

## Step 26 — Final QA, bug fixing and launch readiness

- **Studio → QA & Launch** records weighted evidence across 11 system categories, reproducible defects, device/browser/environment context, and eight accountable approvals.
- Readiness requires at least 90% overall, 100% across critical systems, every critical check passed, no unresolved Critical/High defects, and all approvals recorded.
- The Store Setup action recalculates these rules on the server before allowing Live Mode; UI changes cannot bypass the gate.
- Safe seed creates the QA catalog and unapproved sign-off structure without manufacturing passing evidence or trust.
- `pnpm qa:audit`, `pnpm qa:smoke`, `pnpm qa:check`, CI/release checks, System Health and staging/post-launch runbooks cover the technical and operational release path.
- Public launch copy now avoids obsolete checkout placeholders, demo claims and a fake support address; hosted environments require at least one configured public support channel.

Start with [Final QA and launch readiness](docs/qa-and-launch-readiness.md), then use the [staging matrix](docs/staging-test-matrix.md), [bug triage](docs/bug-triage.md), and [post-launch monitoring](docs/post-launch-monitoring.md).

## Step 25 — Production deployment and live operations

- Vercel/GitHub configuration now uses locked pnpm installs, a secret-safe pre-deployment gate, CI for `main`/`dev` and PRs, and production builds that never run migrations or seed implicitly.
- Dedicated staging and production templates enforce HTTPS, canonical origins, remote PostgreSQL, independent revalidation secrets, persistent Cloudinary media, and explicit deployment identity.
- A database-backed maintenance control can pause ordering while the catalog remains visible or replace the public storefront with a branded bilingual maintenance page. Server checkout enforcement and emergency environment overrides prevent bypasses; Perfume Studio stays accessible.
- Production canonical redirects, non-indexable Setup/Preview/maintenance behavior, protected revalidation, durable media, branded global/Studio errors, and an expanded Super Admin System Health screen cover the operational path.
- System Health now verifies the environment, PostgreSQL, Prisma migration state, first Super Admin, RBAC/core data, Cloudinary connectivity, deployment identity, launch/maintenance state, and sitemap readiness without exposing secrets.
- Production runbooks cover [deployment](docs/deployment.md), [preflight](docs/production-checklist.md), [database and backups](docs/database-production.md), [rollback](docs/rollback.md), and [launch](docs/launch-checklist.md).

Run `pnpm deploy:check` before a hosted build. Database migration and production seed remain deliberate operator steps outside the Vercel build.

## Step 24 — Local Development, Installation & Running

- A Windows 10/11-first setup now covers Node LTS, Corepack/pnpm, Git, VS Code,
  PostgreSQL, PowerShell, Command Prompt, terminal recovery, alternate ports,
  local testing, ISR differences, and production preview.
- `.env.example` defaults to the disposable local `scentiq_dev` database and
  documents the Auth.js v5 names. Runtime validation reports missing variable
  names clearly without ever printing secret values.
- `pnpm doctor` validates the toolchain/environment; `pnpm doctor:db` also
  checks PostgreSQL, Prisma, the active Super Admin, RBAC and core seed data.
- **Studio → System Health** gives the same secret-safe operational checks to
  Super Admins inside the application.
- Optional Docker Compose starts PostgreSQL 16 with a persistent volume. Native
  PostgreSQL remains fully supported and Docker is not required.
- Cross-platform scripts now cover tests, formatting, Prisma Studio, health,
  migrations, seed modes and local reset. `db:reset` hard-blocks remote hosts,
  every database except `scentiq_dev`, and production-like environments.
- VS Code recommendations/settings, EditorConfig, Prettier, Docker ignore,
  expanded Git ignore, and dedicated local/database/environment/admin/
  troubleshooting guides remove hidden setup steps.

Documentation map:

- [Local development](docs/local-development.md)
- [Local PostgreSQL and Prisma](docs/database.md)
- [Environment variables](docs/environment-variables.md)
- [Admin setup](docs/admin-setup.md)
- [Troubleshooting](docs/troubleshooting.md)
- [Production migration safety](DATABASE.md)
- [Seed modes and product import](SEEDING.md)

## Step 23 — Seed Data, Initial Products & Admin Setup

- Seed modes now separate production-safe structure from development catalog,
  orders, customers, pending test reviews, searches, recommendations, and
  analytics. Production mode can never create fake business activity.
- The first Super Admin comes from `SEED_ADMIN_*`; production refuses silent
  defaults, while development has one clearly documented local-only account.
  Passwords are hashed and existing admin credentials are never overwritten.
- Eight roles, granular permissions, 12 categories, 15 brand structures, 28
  fragrance notes, 20 tags, 15 draft collections, Iraqi delivery placeholders,
  settings, SEO templates, 13 homepage sections, and approved-media
  placeholders are repeatable and idempotent.
- **Studio → Store Setup** provides a launch checklist and Setup / Preview /
  Live gate. Non-live stores are excluded from robots and the sitemap; Live is
  blocked until real products, approved media, delivery fees, and SEO exist.
- **Products → Import products** downloads a CSV template and previews CSV,
  JSON, or Excel XML rows before saving. It reports duplicates, missing
  taxonomy/media/SEO, invalid price/stock, and completion scores; error rows
  block the import and incomplete/image-less products remain Draft.
- Seed completion prints a validation report without passwords or hashes.

Read `SEEDING.md` before seeding any shared or production database.

## Step 22 — Prisma Schema, Models & Relationships

- PostgreSQL now has a real two-stage migration history: a Steps 1–21 baseline
  for clean installs and a non-destructive Step 22 transition for existing data.
- Normalized multi-role RBAC adds roles, permissions and join tables while
  keeping Auth.js and current admin sessions compatible.
- Guest checkout upserts a private Customer by normalized phone, assigns a
  readable unique order number, and stores customer, product, brand, SKU and
  price snapshots for accurate history.
- Reusable product galleries, explicit media relationships, hierarchical
  categories, soft deletion, publication dates, status enums, JSON site
  settings and configurable homepage sections are modeled and indexed.
- Wishlist sessions, future carts, recommendation logs, customer-linked
  analytics/reviews, rating caches and an immutable security AuditLog complete
  the commerce and intelligence relationships.
- The transition migration preserves settings, backfills customers/orders,
  snapshots, ratings, media and publication dates, then enforces the new
  indexes and foreign keys.
- Development seed now creates normalized roles/permissions, assigns the demo
  Super Admin, seeds structured settings and homepage sections, and retains all
  existing catalog, collection, delivery and review data.

Read `DATABASE.md` before applying the migration, especially if the current
Supabase database was created with `prisma db push`.

## Step 21 — Backend Architecture & API Foundation

- Route Handlers, Server Actions, Services, Repositories, validators, shared
  types, security helpers, and utilities now have explicit responsibilities.
- JSON endpoints use one success/error envelope and central safe error mapping;
  validation, auth, permission, conflict, rate-limit, and unexpected failures
  no longer expose raw Prisma messages or stack traces.
- Checkout is a thin Server Action over a dedicated service. Prices, delivery,
  totals, product state, and stock are re-read server-side; serializable stock
  reservation and a unique submission id protect the last unit and retries.
- Order status rules and inventory movements live in one transactional service,
  with history, analytics, audit logs, and targeted cache invalidation.
- Search, availability and media use bounded repositories/services. Shared Zod
  schemas cap IDs, query lengths, page sizes, and safe sort inputs.
- Allowlisted on-demand revalidation supports an active authorized admin or an
  independent bearer secret; arbitrary paths are never accepted.
- HMAC-verified, 1 MB-capped, replay-resistant webhook receivers are ready for
  delivery/payment/notification integrations but intentionally make no external
  business mutation until a provider contract is added.
- Node tests cover checkout math/validation, Iraqi phones, inventory bounds,
  order transitions, permissions, Arabic search and slug collision candidates.

See `BACKEND.md` for contracts, layer ownership, transaction rules, webhook
headers, caching and the release checklist.

## Step 20 — Performance, Mobile & Core Web Vitals

- Product cards are now server-rendered shells with tiny interactive islands;
  the storefront no longer hydrates every card just to render its text.
- Card queries return only the fields they render plus one responsive primary
  image. Product and editorial imagery has fixed aspect ratios, mobile-aware
  sizes, AVIF/WebP negotiation, and lazy loading below the fold.
- The shop is server-paginated at 16 products, while Studio products, orders,
  customers, reviews, and activity logs are paginated at bounded page sizes.
- Search remains Arabic-aware and typo-tolerant, but its candidate pool and
  API response are bounded, timed, and briefly cached by query.
- Home sections use indexable deferred rendering; CSS replaces the previous
  hero animation runtime; dense product links avoid wasteful prefetching on
  average mobile connections.
- Recharts is code-split and intersection-gated inside Studio, so closed or
  distant analytics sections no longer inflate the initial dashboard bundle.
- Route-level skeletons, a friendly retry boundary, checkout delivery loading,
  reserved image space, 44 px touch targets, small-screen header behavior,
  safe-area sticky checkout actions, RTL, and reduced-motion handling are in
  place.
- Privacy-safe real-user monitoring samples 10% of visits and exposes p75 LCP,
  CLS, INP, FCP, and TTFB by route and device in **Studio → Performance**.
- New compound database indexes support common storefront, order, review,
  media, and activity queries. A gzip-aware route budget blocks oversized
  initial JavaScript with `pnpm perf:budget`.

See `PERFORMANCE.md` for targets, architecture decisions, and the launch test
matrix. Run `pnpm prisma db push` once for the new Core Web Vitals table and
indexes before collecting production metrics.

## July 12, 2026 maintenance pass

The original architecture and luxury visual system were preserved. This pass
focused on correctness and the Step 12 search experience:

- Fixed TypeScript build blockers across Prisma Decimal prices, interactive
  transactions, review moderation, order seeding, and recommendation scoring.
- Split the Edge-safe Auth.js configuration from the database/credentials
  implementation, removing unsupported middleware runtime imports.
- Completed Arabic-aware catalog matching (diacritics and letter variants),
  aliases, perfume notes, keywords, fragrance families, and one-character typo
  tolerance without a paid search service.
- Search suggestions now rank matches, handle loading/race states, support
  keyboard navigation, open the selected perfume directly, and record clicks.
- Shop filters now combine instead of replacing one another, remain available
  during search, can be toggled individually, and show result count/clear state.
- Added a reproducible ESLint configuration. TypeScript, ESLint, and the
  optimized Next.js production build pass successfully.
- Completed Step 13 wishlist UX: persistent saved perfumes, working heart
  controls across catalog/product cards, a header count, and a responsive
  wishlist page with remove, clear, and add-to-bag actions.

## Step 14 — Editorial Collections System

Collections are now full shopping guides instead of basic product groups:

- Manual, dynamic, and hybrid collections with pinned products, editorial
  ordering, featured labels, and selection reasons.
- Bilingual hero copy, introductions, buying guides, FAQs, related
  collections, SEO metadata, canonical URLs, Open Graph, ItemList, and FAQ
  structured data.
- Public collection pages include collection-aware cards, quick add,
  wishlist, ratings, availability, responsive featured rows, desktop/mobile
  filters, eight sort modes, and pagination. Detail pages use a 15-minute ISR
  revalidation window.
- Perfume Studio now creates and edits collections, uploads covers to
  Cloudinary, configures dynamic rules, schedules publication, chooses
  homepage placement, manages products, and displays 30-day performance and
  actionable insights.
- Views, product clicks, add-to-cart events, purchases, and attributed revenue
  are recorded. Signed-in collection behavior now feeds the personalized
  recommendation query.
- The seed includes a manual Signature Collection and a dynamic Winter
  Perfumes guide so both modes can be tested immediately.

## Step 15 — Reviews, Ratings & Trust System

The former one-line review list is now a moderated buying-confidence system:

- Overall 1–5 rating plus longevity, projection, sillage, value, smell,
  packaging, and delivery ratings; recommendation intent; season, occasion,
  age range, gender, and optional customer photo.
- Review photos upload through Cloudinary with automatic format, quality, and
  width optimization, then remain hidden until approved separately.
- Reviews start as Pending and support Approved, Rejected, Hidden, and
  Reported states. The public product page never displays unapproved content.
- Verified Purchase is calculated only from a matching Delivered order. The
  order phone is hashed for duplicate prevention and is never stored on the
  review or shown publicly.
- Public sorting, detailed filters, mobile filter drawer, expandable comments,
  helpful yes/no votes, duplicate-vote prevention, reporting, approved photos,
  featured reviews, and professional admin replies.
- Product JSON-LD now includes aggregate rating and approved review markup.
  Trust badges also appear at checkout, and social-proof messages render only
  when real database signals exist.
- Perfume Studio includes a full Reviews Manager with search, product/rating/
  status filters, moderation, photo approval, featured controls, replies,
  spam deletion, review growth, product gaps, common note/complaint signals,
  and actionable performance insights.
- Delivered orders expose a manual “ready for review request” workflow and
  copyable product review links. Nothing is sent automatically and no paid
  messaging API is required in this version.

## Step 16 — Inventory, Stock & Product Availability

Inventory now follows a real COD reservation lifecycle instead of reducing
physical stock as soon as checkout is submitted:

- Pending, Confirmed, and Preparing orders reserve inventory. Shipping deducts
  physical stock and releases the reservation. A pre-shipping cancellation
  releases it without changing physical stock. Returns require an explicit
  admin decision before sellable stock is restored.
- Every movement records before/after physical and reserved quantities,
  signed quantity, movement type, reason, admin note, admin identity, related
  order, optional variant, and timestamp.
- Available Stock (`stock - reservedStock`) and the automatic In Stock, Low
  Stock, Out of Stock, Reserved, Hidden, and Discontinued status are cached
  for indexed admin filtering, while checkout recalculates the authoritative
  formula inside a serializable database transaction.
- Product variants support independent size/name, price, cost, SKU, barcode,
  stock, reserved stock, low limit, availability, warehouse location, and
  optional image URLs. Customers choose the actual purchasable variant and
  the order keeps that selection.
- Perfume Studio Inventory Manager includes pagination, server-side search and
  filters, responsive product cards, stock adjustment, corrections, damaged/
  missing/returned stock, limits, warehouse locations, status controls,
  variants, movement history, and bulk stock/price/status operations.
- CSV, JSON, and Excel-compatible XML inventory export and import work without
  a paid service. Imports identify main products and variants by stable SKU.
- Dashboard and Inventory surfaces show real low/out/high-reserved alerts,
  fast and slow movers, 30-day returns/cancellation impact, restock candidates,
  stock value, cost value, potential profit, and value by brand/category.
- Public product pages show exact availability and genuine low-stock counts,
  disable unavailable purchasing, offer variant selection, and store optional
  “notify me” requests for future messaging. Hidden inventory is excluded from
  search, shop, home, brands, collections, and recommendations.

## Step 17 — Analytics, Business Intelligence & Smart Insights

Perfume Studio now has a real decision dashboard instead of catalog-count
placeholders:

- Baghdad-aware date ranges for Today, Yesterday, 7/30 days, this/last month,
  and a custom range, with equal-period revenue comparison.
- Delivered-order revenue, active order value, AOV, order status, daily trend,
  peak order hour/day, product/brand/category/city revenue, and delivery partner
  success, issue, cancellation, return, and average-delivery metrics.
- A first-party anonymous event stream for page/product views, cart and wishlist
  actions, checkout starts, collections, orders, and recommendation blocks.
  Browser sessions use a random session UUID; IP addresses and fingerprints are
  not stored. Product views and repeated impressions are de-duplicated for 30
  minutes to reduce accidental inflation.
- A complete funnel from homepage visit through delivered order, real drop-off,
  cart abandonment, most-abandoned products, average tracked cart value, traffic
  source, device conversion, bounce, session duration, and recommendation
  impression/click/order-session performance.
- Product, brand, collection, search, customer, city, delivery, inventory,
  review, and on-site SEO views. Customer reporting groups guest orders by
  normalized phone and includes lifetime value plus observed favorite brand and
  category without forcing an account.
- Search demand includes Arabic/English use, no-result terms, result clicks, and
  matched brand/note/season/occasion intent. Actual Google indexing is never
  fabricated: the SEO panel distinguishes eligible pages and tracked organic
  landings from Search Console-only metrics.
- A deterministic smart-insight engine creates Critical/High/Medium/Low cards
  with measured evidence, recommended action, and a direct Studio destination.
  It covers demand without stock, low stock, views without delivered sales,
  missing reviews/SEO, no-result searches, weak collection conversion, and
  delivery partner issue rates. No paid AI or analytics API is required.
- Admin-authenticated CSV and Excel-compatible exports for orders, delivered
  revenue, inventory, products, search, and customers. Spreadsheet formula
  injection is neutralized before export.
- Financial truth remains server-side: cancelled and returned orders do not
  count as recognized revenue, and client event values never affect order or
  revenue totals. Query caps protect the first version; the UI warns when a
  narrower range or future scheduled aggregation is needed.

## Step 18 — SEO, Arabic Content & Search Visibility

The storefront now has an Arabic-first technical and editorial SEO foundation:

- Dynamic bilingual titles, descriptions, keywords, canonical URLs, language
  alternates, Open Graph, Twitter cards, and index controls across homepage,
  products, brands, collections, categories, fragrance notes, and guides.
- Product, brand, collection, category, note, article, breadcrumb, FAQ,
  aggregate-rating, review, offer, organization, and website/search structured
  data use absolute production URLs and safe JSON serialization.
- New indexable category and fragrance-note guides create useful paths into the
  catalog. Product pages link to their category, brand, collections, and note
  guides instead of leaving those concepts as inert labels.
- Public SEO-heavy pages use ISR and on-demand revalidation. Search and filtered
  combinations are canonicalized to the clean page and marked `noindex`; admin,
  cart, checkout, API, and private paths are excluded in dynamic robots rules.
- The dynamic sitemap includes only public products and editorial entities.
  Draft/hidden catalog data and private storefront routes are not submitted.
- Next Image now handles product and collection media with responsive sizing,
  AVIF/WebP output, descriptive bilingual alt text, lazy loading, and priority
  loading for primary hero media.
- Perfume Studio has a real SEO Manager for every public entity, homepage
  metadata, reusable templates, missing-field completion, FAQ/content editing,
  image alt text, score-based issue detection, and automatic redirect rules
  when a slug changes.
- Redirects preserve the visitor's language and track real hits. A localized
  404 offers search plus useful routes to perfumes, brands, and collections.
- A future-ready editorial article model and public guide renderer support
  perfume guides, comparisons, seasonal content, brand guides, and note guides
  without adding a paid CMS. No indexed-page count or Search Console metric is
  fabricated.

## Step 19 — Security, Authentication & Admin Permissions

Security now sits behind every sensitive operation instead of relying on
hidden buttons or a single generic `ADMIN` check:

- Eight enforced roles: Super Admin, Manager, Content Editor, Order Manager,
  Inventory Manager, Customer Support, SEO Editor, and read-only Viewer.
  Permission checks query the current database account on every server action;
  disabled, suspended, or stale sessions cannot mutate data.
- The professional `/admin/login` route uses generic errors, persistent failed-
  attempt tracking, hashed email/IP identifiers, a 15-minute brute-force lock,
  bcrypt password verification, short-lived JWT sessions, and automatic logout
  after 30 minutes of Studio inactivity. Admin aliases redirect safely to the
  existing `/studio` architecture.
- Super Admin can create admins, assign roles, disable/suspend accounts, and
  change access. Passwords require 12+ characters and character variety. Role
  or status changes increment a session version so existing tokens are forced
  to re-authenticate. The last active Super Admin cannot be removed.
- Products, collections, orders, inventory, review moderation, SEO, admin-user
  management, media uploads, and analytics/inventory exports all enforce their
  own server-side permission. Customer/order exports also write audit events.
- Database-backed rate limits protect admin login, checkout, reviews, review
  votes/reports, stock alerts, search logging/autocomplete, delivery lookup,
  collection tracking, analytics events, and media upload across server
  instances.
- Checkout accepts Iraqi mobile formats, validates all field lengths and UUIDs,
  recalculates prices/delivery/stock server-side, and carries an idempotency UUID
  so a double-click cannot create a second order. Guest confirmation pages also
  require a server-signed token instead of exposing order details from a UUID.
- Image uploads verify extension, MIME type, magic bytes, and size; duplicate
  content is reused by SHA-256; Cloudinary receives unique non-overwriting
  filenames and serves stripped, compressed images. Inventory imports allow
  only the documented data formats and size.
- Content Security Policy, HSTS in production, anti-framing, MIME sniffing,
  strict referrer, browser feature restrictions, same-origin checks, Auth.js
  CSRF handling, and private-route robots rules are enabled centrally.
- Activity Logs can search and filter by admin, action, date, and entity. Login,
  role, order, inventory, review, SEO, media, and export events retain actor and
  before/after context without exposing raw passwords, tokens, or IP addresses.
- Auth adapter, magic-link token, password-reset token, encrypted 2FA fields,
  recovery-code hashes, and replay-resistant webhook receipt models are ready
  for future integrations; no reset email, 2FA provider, or webhook endpoint is
  falsely presented as active today.

### Highest-priority follow-ups

1. Connect the chosen PostgreSQL provider, push the Step 19 schema, and seed a
   non-production environment for full checkout/reservation/shipping testing.
2. Add the private Cloudinary credentials and test customer photo moderation.
3. Replace demo catalog entries and placeholder bottle art with the first real
   Iraqi-market products, prices, stock, and media.
4. Add the store's real WhatsApp and phone details before exposing support
   actions publicly; the current copy deliberately makes no unavailable claim.
5. Complete the intentionally deferred Studio CRUD screens before a public
   launch. Wishlist is now functional locally; account syncing can follow after
   customer registration is enabled.

## Try the full flow

1. Browse `/ar/shop` or `/en/shop`, add a couple of perfumes to the bag
2. `/cart` → adjust quantities → Checkout
3. Fill in the form, pick a city (Baghdad/Basra/Erbil have seeded delivery
   options), select a delivery company, confirm
4. Land on the order confirmation page with a real order number
5. Sign in at `/admin/login` as the seeded admin and open **Orders** — the order
   you just placed is there, with full details, status history, and an
   internal-notes box
6. Open **Inventory** to see the reservation, then move the order to Shipped
   and confirm the physical/reserved movement history changes exactly once

## What's real

- **Cart** — Zustand + `persist` (installed in Step 3, unused until now),
  so it survives a page refresh via localStorage — the spec's own
  requirement, and the right tool for a real app (not a claude.ai
  artifact, where localStorage is off-limits for a different reason)
- **Checkout** — one page, React Hook Form + Zod, mobile-first with a
  sticky confirm bar. Delivery company options load dynamically per city
  (`/api/delivery-options`) with real per-city fees
- **Guest checkout, properly modeled** — `Order.userId` is now optional;
  every order stores its own `customerName`/`phone`/`city`/`address`
  directly, whether or not the customer is signed in. This reconciles two
  things that sound contradictory but aren't: Step 3 confirmed customers
  _can_ have accounts (wishlist, order history); this spec says checkout
  itself must never _require_ one. Both are true at once — same pattern
  Shopify uses.
- **Server-side price/stock revalidation** (`src/actions/order.ts`) — the
  client only ever sends perfume IDs and quantities. Prices, stock checks,
  the delivery fee, and the free-delivery threshold are all re-derived from
  the database inside the action, never trusted from the request, per the
  spec's own Order Security section.
- **Full 7-status flow** (Pending → Confirmed → Preparing → Shipped →
  Delivered / Cancelled / Returned), replacing the old 5-status
  placeholder — every change writes an `OrderStatusHistory` row (previous
  status, new status, admin, optional note), and cancelling/returning an
  order restores the stock it held
- **Delivery companies & city-based fees** — new `DeliveryCompany` +
  `DeliveryFee` models, seeded with two companies and Baghdad/Basra/Erbil
  pricing matching the spec's own examples; free-delivery threshold lives
  in `Settings` (`delivery.freeThreshold`)
- **Admin order management** — list with real data, a full order-detail
  page (customer info, items, delivery/payment, status control, internal
  notes, full status history)

## Deliberately simplified or deferred

- **Multiple warehouses, suppliers, purchase orders, barcode scanning, and
  automated restock messages** remain future expansion points. The current
  product/variant, warehouse-location, movement-ledger, and stock-subscription
  data model leaves room for them without weakening single-warehouse daily use.
- **Invoice printing, CSV export, order search/filter by date/city/company**
  — Admin Order Management asks for all of these; the detail page and list
  are real, but these specific actions aren't wired up yet.
- **SMS/WhatsApp/Email notifications** — explicitly "future version" in the
  spec itself; skipped entirely for this pass, same as the spec says to.
- **Delivery company add/edit UI, free-delivery campaign management** —
  read-only admin view for now, same deferred-CRUD pattern as Brands/
  Categories from the Perfume Studio pass.
- **External ad-platform attribution and Google Search Console data** remain
  future integrations. Step 17 reports first-party traffic and eligible SEO
  pages honestly; it never invents indexing, ad spend, or campaign results.

## Manual setup summary

```bash
pnpm install

cp .env.example .env
# Windows PowerShell: Copy-Item .env.example .env
# Replace AUTH_SECRET and keep .env private.

pnpm doctor
pnpm prisma:generate
# Fresh local scentiq_dev database only:
pnpm prisma:migrate
pnpm seed:dev
pnpm doctor:db

pnpm dev
```

For an existing Supabase database that was originally created with `db push`,
do not use the local migration/reset commands. Follow the reviewed baseline and
deployment sequence in `DATABASE.md`.

Schema changes now also include `ProductVariant`, `InventoryMovement`,
`InventoryNotification`, `StockAlertSubscription`, `AnalyticsEvent`, its event/
traffic/device enums, cached/indexed availability snapshots, funnel indexes,
`OrderInventoryState`, per-entity SEO FAQs, SEO templates and redirects, and the
future-ready editorial guide models. Step 19 adds admin roles/status/session
versioning, Auth.js adapter records, hashed login attempts, database rate-limit
buckets, reset/2FA preparation, webhook replay receipts, media hashes, and order
submission IDs. The repository now includes the reviewed baseline and additive
Step 22/23 migrations; do not use `db push` as a production deployment method.

## Verification boundary

Prisma Client generation, schema validation, TypeScript, ESLint, and the
optimized Next.js build run successfully. A live database/Cloudinary
end-to-end test still requires the owner's private Supabase and Cloudinary
environment values; those secrets should stay in the local `.env` file and
must never be sent in chat or committed.

## Tech stack recap

Next.js 15 (App Router) · TypeScript · Tailwind CSS · Prisma · PostgreSQL ·
Auth.js (NextAuth v5) · Zustand · React Hook Form · Zod · Recharts ·
Lucide React · Framer Motion · pnpm
