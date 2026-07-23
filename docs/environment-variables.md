# Environment variables

Copy `.env.example` to `.env`. Next.js loads `.env` when the server starts, so restart `pnpm dev` after editing it. `.env` and all real environment variants are ignored by Git.

## Required locally

| Variable               | Purpose                                                                 | Local example           |
| ---------------------- | ----------------------------------------------------------------------- | ----------------------- |
| `DATABASE_URL`         | Prisma runtime connection                                               | Local `scentiq_dev` URL |
| `DIRECT_URL`           | Migrations and seed connection                                          | Same local URL          |
| `AUTH_SECRET`          | Auth.js signing/HMAC secret; Auth.js v5 equivalent of `NEXTAUTH_SECRET` | Unique 32+ characters   |
| `AUTH_URL`             | Auth callback origin; equivalent of `NEXTAUTH_URL`                      | `http://localhost:3000` |
| `NEXT_PUBLIC_SITE_URL` | Canonical/public app origin; ScentIQ equivalent of `APP_URL`            | `http://localhost:3000` |

Run `pnpm doctor` to validate presence, URL protocols, secret length, and grouped variables. It prints names/status only, never values.

## Seed and environment safety

| Variable                  | Purpose                                                       |
| ------------------------- | ------------------------------------------------------------- |
| `SCENTIQ_ENVIRONMENT`     | `development`, `staging`, or `production` safety context      |
| `SCENTIQ_SEED_MODE`       | `core`, `dev`, `staging`, `products`, `demo`, or `production` |
| `SEED_ADMIN_NAME`         | First Super Admin name                                        |
| `SEED_ADMIN_EMAIL`        | First Super Admin email                                       |
| `SEED_ADMIN_PASSWORD`     | Strong first-admin password; never printed                    |
| `SEED_PRODUCTION_CONFIRM` | Exact production confirmation required by `seed:production`   |

Set all three `SEED_ADMIN_*` values together or leave all empty in local development. Production never accepts the development fallback.

## Optional integrations

- `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`: Google admin login.
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`: image uploads. Configure all three together.
- `NEXT_PUBLIC_WEB_VITAL_SAMPLE_RATE`: real-user performance sample ratio.
- `REVALIDATION_SECRET`: independent bearer secret for allowlisted cache revalidation.
- `QA_BASE_URL`: staging origin used only by the read-only/unauthenticated smoke-test command.
- `WEBHOOK_SECRET` and provider-specific webhook secrets: future HMAC receivers.
- Stripe variables are placeholders for a future method; COD remains authoritative now.

Never prefix a server secret with `NEXT_PUBLIC_`; that prefix exposes a value to browser bundles. Never commit `.env`, reuse production customer data locally, or point local development at production by convenience.

## Hosted staging and production

Start from `.env.staging.example` or `.env.production.example`, but enter real values in the hosting provider rather than creating a committed file. Preview/staging and production require HTTPS, non-local PostgreSQL, a 32+ character `REVALIDATION_SECRET`, `STORAGE_PROVIDER=cloudinary`, and all Cloudinary credentials. `AUTH_URL` and `NEXT_PUBLIC_SITE_URL` must have the same canonical origin.

| Variable                       | Scope        | Purpose                                                                      |
| ------------------------------ | ------------ | ---------------------------------------------------------------------------- |
| `MAINTENANCE_MODE`             | server       | Emergency override: `off`, `ordering`, or `storefront`                       |
| `ORDERING_DISABLED`            | server       | Independent emergency kill switch for new orders                             |
| `DEPLOYMENT_ID`                | server       | Release identifier when the platform does not expose `VERCEL_GIT_COMMIT_SHA` |
| `NEXT_PUBLIC_SUPPORT_WHATSAPP` | browser-safe | Digits-only public WhatsApp support number                                   |
| `NEXT_PUBLIC_SUPPORT_PHONE`    | browser-safe | Public customer-support phone number                                         |
| `NEXT_PUBLIC_SUPPORT_EMAIL`    | browser-safe | Public customer-support email                                                |

Vercel Preview variables belong to the protected staging database and staging Cloudinary context. Production variables belong only to the production deployment. Generate `AUTH_SECRET` and `REVALIDATION_SECRET` independently; do not reuse database, Cloudinary, GitHub, or admin passwords.

Hosted preflight requires at least one verified public support channel. Configure only channels that are staffed and approved; the contact page renders the values directly.

`pnpm deploy:check` validates file/configuration readiness without a database connection. `pnpm deploy:check:db` performs read-only target checks and must be run only when you intentionally selected the staging or production database. Neither command migrates, seeds, deploys, or prints secret values.
