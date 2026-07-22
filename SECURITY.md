# ScentIQ production security checklist

The application enforces authentication, role permissions, validation, rate
limits, secure media rules, audit logs, and server-authoritative order totals.
Deployment still determines whether those controls are operated safely.

Before production:

1. Generate a unique `AUTH_SECRET` of at least 32 random bytes and configure the
   exact HTTPS `AUTH_URL` and `NEXT_PUBLIC_SITE_URL`. Never reuse development
   secrets or commit `.env`.
2. Apply the reviewed Prisma schema to a non-production Supabase database, test
   login/lockout/role changes/order inventory transitions, then migrate
   production with a backup and rollback plan.
3. Do not expose the seeded demonstration admin. Create a named Super Admin with
   a unique password, verify access, then disable the demo account.
4. Configure Cloudinary server credentials privately and test JPG, PNG, WebP,
   AVIF, oversize, renamed executable, duplicate, and corrupted-file cases.
5. Keep the site behind HTTPS. Confirm CSP, HSTS, `nosniff`, anti-framing,
   referrer, and permissions-policy headers at the production origin.
6. Review Admin Users and Activity Logs regularly. Suspended/disabled accounts
   are rejected server-side; role/status changes invalidate their existing
   Studio session version.
7. Restrict database and deployment-console access separately. App-level Super
   Admin permission does not grant Supabase, hosting, DNS, or Cloudinary access.
8. Back up PostgreSQL and media before schema or bulk inventory changes. Test a
   restore, not only backup creation.

Future integrations must verify webhook signatures before parsing trusted data,
reject replayed provider event IDs, store only payload hashes in receipts, and
never expose revalidation or reset-token endpoints without secret validation.

Report a suspected incident by disabling the affected admin, rotating
`AUTH_SECRET` (which signs everyone out), rotating affected provider keys,
preserving Activity/LoginAttempt logs, and reviewing orders, inventory, exports,
media, and SEO changes during the incident window.
