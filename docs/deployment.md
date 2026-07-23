# Production deployment

This runbook uses GitHub, Vercel, managed PostgreSQL, and Cloudinary while preserving the current Next.js architecture. Hosting providers may be replaced only when they provide equivalent preview deployments, encrypted secrets, HTTPS, logs, and rollback.

## Environments and branches

| Environment | Git branch / source  | Database                        | Public behavior   |
| ----------- | -------------------- | ------------------------------- | ----------------- |
| Development | local feature branch | disposable local `scentiq_dev`  | local only        |
| Staging     | `dev`                | dedicated staging PostgreSQL    | protected preview |
| Production  | `main`               | dedicated production PostgreSQL | custom domain     |

Never copy the production database URL into local or preview variables. Use `feature/*` branches, open a PR into `dev`, verify the preview, then promote a reviewed PR to `main`. CI verifies every PR; it never migrates, seeds, or deploys a database.

## First deployment

1. Create two managed PostgreSQL projects: staging and production. Enable provider backups before writing data.
2. Create a persistent Cloudinary account/folder policy. Local disk and Vercel's filesystem are not product-media storage.
3. Import the GitHub repository into Vercel. Keep the detected Next.js preset, `pnpm install --frozen-lockfile`, and `pnpm vercel-build`.
4. Assign `.env.staging.example` variables to Preview and `.env.production.example` variables to Production. Replace every placeholder in Vercel; never upload a real `.env` file or expose server secrets with `NEXT_PUBLIC_`.
5. Keep Preview Deployment Protection enabled. Restrict production deployments to `main`; use the `dev` branch for the named staging deployment.
6. Run `pnpm deploy:check` with the target variables. Run `pnpm deploy:check:db` only against the intended staging database first.
7. Back up staging, run `pnpm prisma:migrate:deploy`, then `pnpm seed:staging`. Verify the preview and migration status.
8. Back up production. Run `pnpm prisma:migrate:deploy`; run `pnpm seed:production` only for core structure or the intentional first Super Admin described in `database-production.md`.
9. Deploy `main`, then open **Perfume Studio → System Health** and resolve every failure before Live Mode.
10. Add the custom domain in Vercel, verify DNS, wait for the managed TLS certificate, and set both `AUTH_URL` and `NEXT_PUBLIC_SITE_URL` to the exact HTTPS canonical origin. The middleware redirects alternate production hosts with HTTP 308.
11. Complete `production-checklist.md`, switch Store Setup from Preview to Live, and monitor the first orders.

## Safe release commands

```bash
pnpm install --frozen-lockfile
pnpm deploy:check
pnpm prisma:generate
pnpm test
pnpm typecheck
pnpm lint
pnpm build
pnpm perf:budget
```

Database commands are intentionally separate from the build. Vercel builds must not migrate or seed. A human/operator applies reviewed migrations once per target before promoting traffic.

## Revalidation, media, and domain

- `REVALIDATION_SECRET` is a unique 32+ character server-only value. Rotate it after suspected exposure.
- Cloudinary credentials are server-only; the application stores durable optimized URLs, not uploaded bytes on the deployment filesystem.
- Use one production hostname. Redirect `www` or the Vercel alias to the canonical origin; do not create duplicate indexable domains.
- Setup and Preview modes remain non-indexable. Full maintenance also disables indexing and returns an empty sitemap.

## Monitoring

Use Vercel function/build logs, managed database metrics, Cloudinary usage, Studio Performance, and System Health. Alerts should cover error rate, database saturation, failed deployments, media failures, and Core Web Vitals. Logs may contain release IDs and safe error classes, never passwords, tokens, full addresses, phone numbers, or database URLs.
