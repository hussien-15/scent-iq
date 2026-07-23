# ScentIQ Step 29 — production specification compliance

Step 29 is a full-product specification, not a request to replace the working application. This pass compared the specification with the current repository, preserved the existing Next.js App Router architecture, closed operational gaps, and recorded the remaining environment-owned launch gates honestly.

## Architecture decisions

- The canonical admin application remains **Perfume Studio** at `/studio`. `/admin/login` remains the login route and `/admin/*` requests are compatibility-redirected to the matching protected Studio route by middleware. This satisfies existing links without duplicating an admin application.
- Arabic remains the default storefront locale and the customer experience keeps locale-prefixed `/ar` and `/en` routes with RTL/LTR layout handling.
- COD is the authoritative payment method. Product prices, delivery fees, totals and stock are resolved on the server.
- Public SEO pages use revalidation/ISR; Studio and customer-specific commerce routes remain dynamic.
- The existing pinned framework generation was retained to avoid an unscoped major migration inside a business-feature step. A framework upgrade must be a dedicated, tested change against private staging before launch.

## Compliance matrix

| Area | Status | Evidence |
|---|---|---|
| Arabic-first storefront and RTL | Implemented | Locale middleware, Arabic default, dictionaries and RTL-aware public layouts. |
| Single-vendor COD commerce | Implemented | Checkout service recalculates product, delivery and order totals on the server. |
| PostgreSQL/Prisma domain | Implemented | UUID models, relations, indexes, order snapshots, soft deletion and migrations. |
| Authentication and RBAC | Implemented | Auth.js, hashed passwords, session versioning, protected middleware and server permissions. |
| Product management | Implemented | Create/edit/import, notes/tags/media/SEO, completion score, private preview, duplicate-as-draft and safe archive. |
| Catalog management | Implemented | Brand, category, collection, fragrance-note and product-tag management in Studio. |
| SEO slug continuity | Implemented | Product, brand, category and note edits automatically create permanent redirect records when slugs change. |
| Media library | Implemented; storage-gated | Upload validation and reusable media records exist. Durable production object storage credentials are required. |
| Search and discovery | Implemented | Arabic normalization, aliases, autocomplete, filters, logs and real-data rule recommendations. |
| Cart, checkout and orders | Implemented | Guest COD checkout, server totals, immutable item snapshots and order status history. |
| Inventory accuracy | Implemented | Atomic reservation/release/deduction, variants, movement history, alerts and negative-stock protection. |
| Reviews and trust | Implemented | Moderation, verified-purchase logic, helpful votes, replies and no production fake-review seeding. |
| Analytics and insights | Implemented | First-party events and rule-based dashboards; empty until real events exist. |
| ISR and revalidation | Implemented | Public SEO routes export revalidation intervals and admin mutations refresh affected paths. |
| Security and audit | Implemented | Validation, rate limits, server permissions, secure environment handling, activity and audit logs. |
| Local setup and operations | Implemented | Windows-friendly local, environment, database, troubleshooting, deployment, rollback and monitoring docs. |
| Production launch | Environment-gated | Requires real secrets, migrated managed PostgreSQL, persistent media, domain/HTTPS, backups and private staging evidence. |

## What Step 29 added

1. Product duplication that copies reusable content into a **draft** while intentionally excluding stock, variants, barcode, sales and engagement counters.
2. Product soft archive with server permission checks, hidden public availability, preserved historical relations and before/after audit records.
3. A protected product preview route that can display draft or hidden data without exposing it to customers or search engines.
4. A visible completion score and missing-field checklist inside the product editor.
5. Dedicated Notes & Tags management with create/edit/delete, granular permissions, usage counts and deletion protection for records still in use.
6. Automatic SEO redirects when product, brand, category or fragrance-note slugs change through their normal editors.
7. A structural Step 29 audit wired into QA and release commands.

## Files added or materially changed

- `src/actions/product.ts`, `src/components/studio/ProductLifecycleActions.tsx`, product editor and product preview route.
- `src/actions/taxonomy.ts`, `src/components/studio/TaxonomyManager.tsx`, `/studio/taxonomy` and Studio navigation/permissions.
- `src/actions/catalog.ts` for automatic slug redirects.
- `scripts/step29-audit.mjs`, Step 29 tests, package scripts, README and this compliance record.

## Remaining launch gates

1. Supply real `.env` values and connect the managed PostgreSQL database.
2. Run `pnpm prisma migrate deploy` and production-safe seeding with owner-approved admin credentials.
3. Configure persistent cloud media storage and replace all demo/placeholders with licensed, verified product data.
4. Run `pnpm release:check` on the exact release commit and `QA_BASE_URL=… pnpm qa:smoke` against private staging.
5. Complete real mobile/RTL checkout, order/inventory lifecycle, permissions, media and recovery tests.
6. Approve delivery fees, support contacts, policies, domain, HTTPS, backups, monitoring and rollback ownership.

## What to test next

- Duplicate a product and confirm the copy is draft with zero stock and unique SKU/slug.
- Preview a draft, publish it, change its slug and verify the previous URL permanently redirects.
- Archive a published product and verify it disappears publicly while old order items and inventory movements remain.
- Create/edit notes and tags, verify they appear in the product editor, and confirm in-use records cannot be deleted.
- Test the full Arabic mobile COD journey with real delivery fees and stock on private staging.
