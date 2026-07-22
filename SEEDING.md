# ScentIQ initial setup and seed system

Step 23 provides one idempotent entry point at `prisma/seed.ts`. It always
creates safe platform structure first, then adds demo catalog/activity only in
an explicitly non-production mode.

## Modes

| Mode         | Safe core | Demo products | Fake orders/reviews/analytics          |
| ------------ | --------- | ------------- | -------------------------------------- |
| `core`       | Yes       | No            | No                                     |
| `dev`        | Yes       | Yes           | Yes, clearly marked and non-production |
| `staging`    | Yes       | Yes           | Yes, clearly marked                    |
| `products`   | Yes       | Yes           | No                                     |
| `demo`       | Yes       | Yes           | Yes, clearly marked                    |
| `production` | Yes       | No            | Never                                  |

Safe core data includes roles, permissions, the first admin, categories,
brands, fragrance notes, tags, draft collections, disabled delivery-provider
placeholders, delivery defaults, site settings, SEO templates, homepage
sections, and local luxury-dark placeholder media.
Step 26 also adds the untested QA checklist and eight unapproved launch areas.
Seed never marks a check passed, resolves a defect, or grants an approval.

The seed uses unique emails, keys, slugs, SKUs, deterministic fixture numbers,
and join-table constraints. Re-running it does not duplicate these records.
Existing admin passwords and account status are never overwritten.

## Development

```bash
pnpm prisma:generate
pnpm prisma:migrate:deploy
pnpm seed:dev
pnpm dev
```

If `SEED_ADMIN_*` is empty, development creates this local-only account:

- Email: `admin@scentiq.example`
- Password: `ScentIQ-Dev-Only-2026!`

The command prints a warning but never prints a password. Replace the defaults
before sharing the environment. Demo reviews remain `PENDING` and start with
`[TEST DATA]`; fake trust signals are never public.

For a disposable local database only, `prisma migrate reset` can recreate the
schema and run the development seed. Never run reset against Supabase or any
database containing real users, products, inventory, reviews, or orders.

## Production

Back up the database and verify that `DIRECT_URL` points to the Supabase 5432
session pooler. Production setup is blocked unless the environment and explicit
confirmation are present:

```env
SCENTIQ_ENVIRONMENT=production
SCENTIQ_SEED_MODE=production
SEED_PRODUCTION_CONFIRM=SCENTIQ_PRODUCTION_SETUP
SEED_ADMIN_NAME=Store Owner
SEED_ADMIN_EMAIL=owner@example.com
SEED_ADMIN_PASSWORD=use-a-strong-unique-secret
```

Then run:

```bash
pnpm prisma:generate
pnpm prisma:migrate:deploy
pnpm seed:production
```

If an active Super Admin already exists, the three admin variables may be left
empty and the existing account is preserved. A partial admin configuration is
always rejected. Production mode never creates products, orders, customers,
reviews, search history, recommendation activity, or analytics.

## Product import and the first 100 products

Open **Perfume Studio → Products → Import products** and download the CSV
template. CSV, JSON, and Excel XML (`.xls`) files are supported up to 5 MB and
1,000 rows.

The first click only previews validation. It shows valid rows, errors,
duplicates, unmatched brands/categories/notes, invalid price/stock, missing
media, missing SEO, and a completion score. Nothing is written until the admin
clicks the second import action. Error rows block the entire import. Missing
taxonomy is never created silently. Products below the completion threshold or
without approved matched media stay in Draft.

Recommended launch workflow:

1. Review/create brands, categories, notes, and tags.
2. Prepare the CSV/JSON/Excel file with real prices and stock.
3. Upload approved media and name each image by SKU or the import filename.
4. Preview the file and fix every error.
5. Import products in manageable batches.
6. Review completion, SEO, notes, images, and inventory.
7. Publish only verified products.

## First-login setup

Open `/studio/setup`. The checklist covers logo/media, delivery and fees,
products, product images, homepage sections, SEO templates, identity/currency,
checkout, inventory, Final QA evidence/approvals, and launch status.

- `SETUP`: configuration phase; robots block indexing.
- `PREVIEW`: storefront review phase; robots still block indexing.
- `LIVE`: public/indexable. The action refuses Live Mode until published
  products, approved non-placeholder media, active delivery fees, all SEO
  templates, at least 90% overall QA readiness, 100% critical systems, no
  unresolved Critical/High bugs, and all eight approvals exist.

## Seed report and failures

Every successful run reports counts for admins, roles, permissions, categories,
brands, notes, tags, collections, products, settings, delivery companies,
homepage sections, SEO templates, QA checks, and launch approval areas. It also validates the active Super Admin,
core datasets, duplicate slugs/SKUs, and uncategorized products.

Errors are explicit for invalid modes, unsafe production commands, partial or
weak admin configuration, duplicate catalog identifiers, missing required core
data, and database failures. Secrets and password hashes are never logged.
