# Production checklist

## Before deployment

- [ ] PR reviewed and CI green on the exact release commit.
- [ ] `pnpm qa:check` passes on the exact release commit; `QA_BASE_URL=… pnpm qa:smoke` passes against the private staging deployment.
- [ ] Studio QA score is at least 90%, every critical category is 100%, every critical check is Passed, and evidence is attached.
- [ ] No Critical or High bug remains Open, In Progress, Fixed, or Needs Review; every blocker is independently Verified or Closed.
- [ ] Business owner, developer, QA, SEO, security, content, inventory, and delivery approvals are recorded.
- [ ] Staging preview passed storefront, Arabic/English, Studio, cart, checkout, order, inventory, review, media, SEO, 404, and error-boundary checks.
- [ ] `pnpm deploy:check` passes with production variables; `pnpm deploy:check:db` confirms the intended database, migrations, active Super Admin, and absence of Step 23 demo business rows.
- [ ] Production database and media backup policies are active; a fresh database restore test has been recorded.
- [ ] Migration SQL was reviewed for locks, destructive changes, backfill duration, and backward compatibility.
- [ ] Real Cloudinary, canonical HTTPS, Auth.js, revalidation, support, database, and deployment values are set in the correct Vercel scope.
- [ ] No `.env`, credentials, customer export, local upload, `package-lock.json`, or test database is committed.

## Release

- [ ] Put ordering in maintenance if the change can affect checkout or inventory.
- [ ] Create an on-demand provider backup and record the release commit and migration list.
- [ ] Run `pnpm prisma:migrate:deploy` once, outside the Vercel build.
- [ ] Run production seed only when required and with the explicit confirmation phrase.
- [ ] Deploy the reviewed `main` commit; confirm custom-domain HTTPS and canonical redirect.
- [ ] System Health has no failures. Confirm database, migrations, storage, active Super Admin, Final QA gate, launch mode, maintenance, sitemap, and deployment ID.

## Smoke test

- [ ] `/ar` and `/en`, navigation, search, product, collection, mobile/RTL, images, 404, robots, and sitemap.
- [ ] Admin login, permission denial, settings, products, inventory, orders, reviews, analytics, media upload, and error recovery.
- [ ] Add to cart, checkout validation, COD totals/delivery, one controlled real order, confirmation token, inventory reservation, and admin status transition. Cancel the test operationally and label it; never seed fake production trust data.
- [ ] Cache invalidation after a product/settings change and ISR behavior after its revalidation window.
- [ ] Logs and monitoring contain no PII or secret values.

## Launch

- [ ] Real products, prices, stock, media, delivery fees, support details, legal pages, SEO, and trust statements are approved.
- [ ] Store Setup is **Live**, full maintenance is **Off**, ordering is enabled, and `robots.txt` links the canonical sitemap.
- [ ] Support and operations owners are present for the first orders; rollback owner and provider dashboards are available.
