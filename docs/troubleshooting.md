# Local troubleshooting

Start with:

```powershell
pnpm doctor
pnpm doctor:db
```

The commands do not print passwords, tokens or database credentials.

## `node` is not recognized

Install a supported Node.js LTS release, close every terminal, reopen VS Code, and run `node -v`. ScentIQ supports Node 20, 22, or 24 LTS.

## `pnpm` is not recognized

```powershell
corepack enable
corepack prepare pnpm@11.7.0 --activate
pnpm -v
```

If PowerShell blocks the script, use `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`, reopen VS Code, and try again.

## VS Code terminal does not open

Use **View → Terminal**, then **Terminal → Select Default Profile → PowerShell**. Restart VS Code. If PowerShell itself fails, select Command Prompt temporarily and run the same pnpm commands.

## Port 3000 is already in use

Stop the old server with `Ctrl+C`, or find its Windows process:

```powershell
netstat -ano | findstr :3000
taskkill /PID THE_PID /F
```

Or run ScentIQ on another port:

```powershell
pnpm dev -- -p 3001
```

Update `AUTH_URL` and `NEXT_PUBLIC_SITE_URL` to `http://localhost:3001`, restart, and open that address.

## Cannot connect to PostgreSQL

The useful message is: **Cannot connect to PostgreSQL. Check that PostgreSQL is running and DATABASE_URL is correct in .env.**

Check the PostgreSQL Windows service or `docker compose ps`; verify database `scentiq_dev`, username, password, host and port; then run `pnpm doctor:db`. A firewall normally should not block localhost.

## Prisma Client is missing or stale

```powershell
pnpm prisma:generate
pnpm typecheck
```

After changing `prisma/schema.prisma`, create/apply a local migration with `pnpm prisma:migrate`. Do not use `db push` for deployment.

## Migration failed

Read the first Prisma error, confirm the local database is reachable, and run `pnpm prisma:migrate:status`. For disposable `scentiq_dev` only, `pnpm db:reset` is available. It is intentionally blocked for remote databases. Existing Supabase needs the baseline workflow in `DATABASE.md`.

## Seed failed

Run `pnpm doctor`, confirm the migration is applied, and check `SCENTIQ_ENVIRONMENT`, seed mode, and that all three `SEED_ADMIN_*` fields are either present or absent. Production requires its explicit confirmation. Never run a development seed on production.

## `.env` missing or variables rejected

Copy `.env.example` to `.env`, fill every required value, and restart Next.js. ScentIQ reports missing variable names without revealing values. A placeholder `AUTH_SECRET` is rejected.

## Admin login fails

Follow [admin-setup.md](admin-setup.md). Verify `pnpm doctor:db`, account status, seed email and the Auth URLs. A role/status change invalidates existing sessions.

## Next.js build fails

```powershell
pnpm prisma:generate
pnpm test
pnpm typecheck
pnpm lint
pnpm build
```

Fix the first error, not the last cascade. Delete `.next` only as a cache cleanup; do not delete source or migrations.

## Tailwind styles look missing

Confirm the terminal has no CSS/PostCSS error, restart `pnpm dev`, hard refresh the browser, and verify the edited file remains inside paths scanned by Tailwind. Do not open a Next.js page by double-clicking an HTML file.

## Images do not load or upload

Local SVG placeholders work without Cloudinary. Real upload needs all three Cloudinary variables. Only JPG, PNG, WebP and AVIF with valid signatures up to 8 MB are accepted. Confirm alt text and the approved media record in Studio.

## Empty database

Empty states are supported, but a usable Studio needs core setup. Run `pnpm seed:core` or `pnpm seed:dev` against local `scentiq_dev`, then `pnpm doctor:db`.
