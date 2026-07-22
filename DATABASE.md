# ScentIQ database foundation

Step 22 turns the accumulated Prisma models into a migration-backed PostgreSQL foundation while preserving every table and feature from Steps 1–21. Step 23 adds only additive homepage-section enum values and the production-safe setup/seed workflow documented in `SEEDING.md`. Step 26 adds evidence-backed QA checks, defect triage, and launch approvals through a separate additive migration.

## Naming and compatibility

Some established Prisma names intentionally remain because changing them would break the working storefront, Auth.js adapter, Studio queries, and deployed data. The business meaning is unchanged:

| Business model     | Prisma model               | PostgreSQL table    |
| ------------------ | -------------------------- | ------------------- |
| Product            | `Perfume`                  | `Perfume`           |
| Admin user         | `User` with `role = ADMIN` | `User`              |
| Product note       | `ProductNote`              | `PerfumeNote`       |
| Product tag        | `ProductTag`               | `PerfumeTag`        |
| Collection product | `CollectionProduct`        | `PerfumeCollection` |
| Wishlist item      | `WishlistItem`             | `Wishlist`          |
| Search log         | `SearchLog`                | `SearchHistory`     |
| Site setting       | `SiteSetting`              | `Settings`          |

Prisma `@@map` preserves the physical table names, so the application gets clearer domain names without destructive table renames.

## Core domains

- Catalog: bilingual products, variants, brands, hierarchical categories, fragrance notes, tags, curated collections, SEO fields, status enums, soft deletion, publication dates, counters, and indexed availability.
- Reusable media: legacy product media remains valid; `ProductMedia` adds ordered reusable galleries, while explicit media relations cover product main/video, variants, brands, categories, notes, collections, delivery companies, and homepage sections.
- Admin security: Auth.js continues to use `User`; `AdminRole`, `Permission`, `AdminRolePermission`, and `AdminUserRole` add normalized multi-role RBAC. Permission checks read relational grants and retain the legacy enum as a safe deployment fallback.
- Customers and orders: guest customers are normalized by phone. Orders keep customer/contact snapshots, readable unique order numbers, item name/brand/SKU snapshots, currency, discounts, status timestamps, inventory state, and complete status history.
- Commerce: wishlists support account, customer, or anonymous session identity. `Cart` and `CartItem` are future-ready without replacing the current fast browser cart. Inventory movements remain transactional.
- Trust and intelligence: reviews can link to the verified customer/order; product rating caches are refreshed after moderation. Search clicks have real foreign keys. Recommendation impressions/clicks write to `RecommendationLog`. Analytics can link to a normalized customer when known.
- Operations: JSON site settings, editable homepage sections, redirects, media, activity feed, immutable security audit log, rate limits, Core Web Vitals, webhook replay receipts, QA evidence, defect triage, and accountable launch approvals.

## Migration paths

Always back up production before applying a database migration.

### New database

The baseline builds the complete Steps 1–21 schema, Step 22 applies the normalized foundation/backfills, Step 23 expands homepage section types, and Step 26 adds the QA launch-gate tables:

```bash
pnpm prisma:generate
pnpm prisma:migrate:deploy
```

For a local/development database only, run `pnpm seed:dev` afterward. Production uses the guarded `pnpm seed:production` command and never the development seed; see `SEEDING.md`.

### Existing ScentIQ database created with `prisma db push`

Mark only the baseline as already present, then deploy Step 22 and the additive Step 23 and Step 26 migrations:

```bash
pnpm prisma:generate
npx prisma migrate resolve --applied 20260713000000_step21_baseline
pnpm prisma:migrate:deploy
```

Do not run `prisma migrate reset` on a database containing real orders.
Do not run the development seed on production. `SCENTIQ_ENVIRONMENT=production` blocks every non-production seed mode.

The Step 22 transition migration preserves `Settings.value` while converting it to JSONB, creates customers from existing order phones, links historical orders, generates legacy order numbers, fills order-item snapshots, backfills rating caches and published dates, copies legacy gallery media into `ProductMedia`, and clears only invalid loose search-click identifiers before foreign keys are enforced.

The Step 26 migration creates only new enums, `QaCheck`, `QaBug`, `LaunchApproval`, indexes, and User audit relationships. It does not update products, orders, customers, inventory, reviews, evidence status, or approvals. Safe seed inserts checklist structure as `NOT_TESTED` and all approvals as false.

## Data safety rules

- Passwords, reset tokens, recovery codes, identifiers used for throttling, IP data, and user agents are stored only as hashes or encrypted values where applicable.
- Customer phone/address fields never belong in public queries or analytics metadata.
- Orders are retained; lifecycle changes use status/history rather than deletion.
- Product, brand, category, and collection deletion is soft by default through `deletedAt`.
- Public queries must require published/non-hidden/non-deleted records.
- Money, discounts, delivery fees, stock, and verification status remain server-authoritative.

## Index and constraint strategy

Unique constraints protect emails, slugs, SKUs, media hashes, order submission IDs/numbers, setting keys, redirect paths, and join-table pairs. Compound indexes cover public catalog status/availability, inventory status/available stock, order status/date, review status/date, customer phone/city, search and recommendation activity, analytics dimensions, media uploads, RBAC joins, and audit history.

JSON is limited to flexible configuration and event/audit metadata. Products, media, categories, roles, permissions, orders, reviews, customers, and recommendation relationships remain normalized foreign-keyed data.
