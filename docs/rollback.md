# Rollback and incident procedure

Rollback restores service; it must not destroy orders placed after a backup.

1. Pause ordering from **Settings → Maintenance and ordering**. If Studio or the database is unavailable, set `ORDERING_DISABLED=true`; use `MAINTENANCE_MODE=storefront` only when the public site itself is unsafe.
2. Record the incident time, deployment ID, affected routes, migration versions, and safe error classes. Do not paste tokens, database URLs, phone numbers, or addresses into tickets/logs.
3. If code-only and schema-compatible, use Vercel's previous successful deployment/instant rollback. Confirm the canonical domain points to it.
4. If a migration caused the incident, prefer a reviewed forward-fix migration. Do not manually edit `_prisma_migrations`, reset production, or blindly apply a down migration.
5. Restore a database backup only after identifying the lost-write window and approving reconciliation for orders, stock, reviews, and admin actions. Restore first into isolation when time permits.
6. Validate System Health, one controlled checkout, inventory reservation, admin access, media, robots/sitemap, and logs. Release full maintenance first, then ordering.
7. Rotate exposed credentials, document the root cause, add a regression test/checklist item, and record the final deployment and data reconciliation.

Keep application changes backward-compatible for at least one release whenever practical. This makes the common rollback a fast code rollback instead of a risky database restore.
