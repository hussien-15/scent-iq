# Production database and first admin

Production and staging are separate managed PostgreSQL databases. Local development must use a disposable local database. `DATABASE_URL` is the pooled/runtime connection when the provider supports it; `DIRECT_URL` is the non-pooler migration/seed connection. Both must belong to the same intended environment.

## Migration procedure

1. Review `prisma/migrations` and run the release against staging.
2. Capture a provider backup and verify point-in-time recovery retention.
3. Run `pnpm prisma:migrate:status`, then `pnpm prisma:migrate:deploy` using `DIRECT_URL`.
4. Run `pnpm deploy:check:db`. It is read-only: it checks connectivity, unfinished migrations, an active Super Admin, and known demo business rows.
5. Deploy compatible application code and complete the smoke test.

Never run `prisma migrate dev`, `prisma db push`, `db:reset`, or `seed:dev` against staging/production. Prefer expand-and-contract migrations: add compatible schema first, deploy code that supports both versions, backfill safely, and remove old schema only in a later reviewed release.

## First Super Admin

For the first production setup only, set `SEED_ADMIN_NAME`, `SEED_ADMIN_EMAIL`, and a unique strong `SEED_ADMIN_PASSWORD` in a secure operator shell. Set `SCENTIQ_ENVIRONMENT=production`, `SCENTIQ_SEED_MODE=production`, and the exact `SEED_PRODUCTION_CONFIRM` value documented by the seed command, then run `pnpm seed:production` once. Remove the seed password from the environment immediately, sign in over HTTPS, and rotate the password. Existing admin credentials are never overwritten by seed.

Production seed creates safe roles, permissions, settings, SEO structure, and the first admin when explicitly supplied. It must not create fake reviews, ratings, analytics, customers, orders, popularity claims, delivery claims, or inventory history.

## Backups and recovery

- Enable daily automated backups and point-in-time recovery appropriate to the order volume. Retain monthly restore points outside the shortest retention window.
- Record provider, project, region, retention, encryption, owner, and restore instructions in the private operations inventory—not in Git.
- Cloudinary assets need provider retention/versioning or a scheduled export independent of the database backup.
- Perform a quarterly restore into an isolated database, run migrations if needed, and verify core counts and System Health. A backup is not proven until it restores.
- Never restore production customer data into a developer laptop. Use redacted/synthetic staging data.
