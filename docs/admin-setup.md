# Local admin setup

The admin interface is Perfume Studio. `/admin` aliases redirect to the existing `/studio` routes.

## Create the first Super Admin

In `.env` set all three values:

```env
SEED_ADMIN_NAME="Local Store Owner"
SEED_ADMIN_EMAIL="owner@scentiq.local"
SEED_ADMIN_PASSWORD="choose-a-strong-local-password"
```

Then run:

```powershell
pnpm seed:dev
pnpm doctor:db
pnpm dev
```

Open <http://localhost:3000/admin/login>. The seed hashes the password and never prints it. Re-running the seed does not overwrite an existing password or duplicate the account.

If all three values are empty, development can create the documented fallback in `SEEDING.md`. This is local-only and must be replaced before sharing the environment. A partial set is rejected.

## First login

1. Open **Store Setup** and review identity, currency, language and launch status.
2. Add a real local test delivery company/fee.
3. Import or create products and attach approved media.
4. Verify inventory and create a test checkout/order.
5. Open **System Health** as Super Admin.
6. Keep the store in Setup or Preview until the launch checklist passes.

## Permissions

The eight roles are Super Admin, Manager, Content Editor, Order Manager, Inventory Manager, Customer Support, SEO Editor and Viewer. UI visibility is convenience only; Server Actions and Route Handlers enforce permissions again. System Health and admin-user management are Super Admin-only.

## Login problems

- Confirm the email is identical to `.env` and rerun the correct seed mode.
- Check `pnpm doctor:db` finds an active Super Admin.
- After changing a role/status, sign in again because session versions invalidate stale access.
- Five failed attempts in 15 minutes trigger the database-backed lock window. Wait for it to expire rather than editing production security data.
- Confirm `AUTH_SECRET` and `AUTH_URL`, then restart `pnpm dev`.
