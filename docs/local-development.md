# Local development guide

This is the primary ScentIQ setup guide. It assumes no previous Next.js or Prisma experience and focuses on Windows 10/11. macOS and Linux use the same project commands after installing the prerequisites.

## 1. Install the required software

Install:

- Node.js 20, 22, or 24 LTS
- Git
- VS Code
- pnpm through Corepack
- PostgreSQL 16 locally, or Docker Desktop for the optional container
- Chrome or Edge

Open **VS Code → Terminal → New Terminal**. On Windows, choose PowerShell from the terminal dropdown. Verify the tools:

```powershell
node -v
corepack --version
git --version
```

Enable pnpm:

```powershell
corepack enable
corepack prepare pnpm@11.7.0 --activate
pnpm -v
```

If PowerShell blocks a trusted pnpm script, open PowerShell as your normal user and run once:

```powershell
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
```

Close and reopen the VS Code terminal afterward. Do not change the machine-wide policy.

## 2. Open and install ScentIQ

Clone the repository, or extract the supplied ZIP. Then open the folder that contains `package.json`:

```powershell
git clone YOUR_PRIVATE_REPOSITORY_URL scentiq
cd scentiq
code .
pnpm install
```

Use pnpm only. Do not run npm install or yarn in this project. `pnpm-lock.yaml` is the authoritative dependency lock.

## 3. Create the environment file

PowerShell:

```powershell
Copy-Item .env.example .env
```

Command Prompt:

```bat
copy .env.example .env
```

macOS/Linux:

```bash
cp .env.example .env
```

Open `.env`, keep it private, and replace `AUTH_SECRET` with a unique value. Never paste the secret into source code, chat, screenshots, or GitHub. See [environment-variables.md](environment-variables.md).

## 4. Start PostgreSQL

Choose one option.

### Option A — PostgreSQL installed on Windows

Create a user/database matching `.env` through pgAdmin, or use `psql`:

```sql
CREATE USER scentiq WITH PASSWORD 'scentiq_local_password';
CREATE DATABASE scentiq_dev OWNER scentiq;
```

Ensure the Windows PostgreSQL service is running. The default port is 5432.

### Option B — Docker Desktop

With Docker Desktop running:

```powershell
docker compose up -d postgres
docker compose ps
```

The included container uses the exact local credentials in `.env.example` and persists data in a named Docker volume. Docker is optional; the Next.js app still runs on your computer.

## 5. Create the schema and initial data

For a brand-new local `scentiq_dev` database:

```powershell
pnpm prisma:generate
pnpm prisma:migrate
pnpm seed:dev
pnpm doctor:db
```

- `prisma:generate` creates the type-safe Prisma Client.
- `prisma:migrate` applies the migration history in development and records it.
- `seed:dev` creates safe core data plus clearly marked local demo data.
- `doctor:db` verifies the environment, connection, Super Admin, roles, permissions, and settings.

Do not use these local instructions on an existing Supabase schema. Follow `DATABASE.md` for its baseline procedure. Never use `migrate reset` or a development seed on production.

## 6. Start and open the site

```powershell
pnpm dev
```

Open:

- Arabic storefront: <http://localhost:3000/ar>
- English storefront: <http://localhost:3000/en>
- Admin login: <http://localhost:3000/admin/login>
- Perfume Studio: <http://localhost:3000/admin> or <http://localhost:3000/studio>
- Super Admin health page: <http://localhost:3000/admin/system-health>

The development seed uses the local fallback account documented in `SEEDING.md` only when all `SEED_ADMIN_*` values are empty. Prefer setting your own local credentials. Stop the server with `Ctrl+C`; start it again with `pnpm dev`.

## 7. Useful daily commands

| Command               | Purpose                                         |
| --------------------- | ----------------------------------------------- |
| `pnpm dev`            | Development server with hot reload              |
| `pnpm test`           | Cross-platform Node test suite                  |
| `pnpm typecheck`      | TypeScript errors without generating files      |
| `pnpm lint`           | Next.js/ESLint checks                           |
| `pnpm format`         | Format supported source and documentation files |
| `pnpm doctor`         | Check software and environment variables        |
| `pnpm doctor:db`      | Also test PostgreSQL and seeded core data       |
| `pnpm prisma:studio`  | Open Prisma's local data browser                |
| `pnpm prisma:migrate` | Create/apply a local development migration      |
| `pnpm seed:dev`       | Repeatable development seed                     |
| `pnpm db:reset`       | Delete/recreate **only** local `scentiq_dev`    |
| `pnpm build`          | Create an optimized production build            |
| `pnpm start`          | Run the completed production build              |
| `pnpm verify`         | Full release checks                             |

`db:reset` is guarded in code. It refuses remote hosts, refuses any database except `scentiq_dev`, and refuses production-like environments.

## 8. VS Code setup

When VS Code asks, install the workspace recommendations: Prisma, ESLint, Prettier, Tailwind CSS IntelliSense, and optional GitLens. Formatting on save and ESLint fixes are configured in `.vscode/settings.json`.

If the terminal panel is missing, use **View → Terminal** or `Ctrl+``. If no shell opens, use **Terminal → Select Default Profile → PowerShell**, then restart VS Code.

## 9. Folder structure

| Path               | Responsibility                                                       |
| ------------------ | -------------------------------------------------------------------- |
| `src/app`          | App Router pages, layouts, loading/error boundaries and API handlers |
| `src/actions`      | Server Actions called by forms and client components                 |
| `src/components`   | Reusable storefront and Perfume Studio UI                            |
| `src/services`     | Business rules and transactions                                      |
| `src/repositories` | Reusable bounded Prisma access                                       |
| `src/lib`          | Auth, security, environment, Prisma and shared infrastructure        |
| `src/validators`   | Server-side Zod schemas                                              |
| `src/types`        | Shared TypeScript contracts                                          |
| `src/utils`        | Pure deterministic helpers                                           |
| `prisma`           | Schema, migrations and safe seed system                              |
| `public`           | Static local assets and placeholders                                 |
| `tests`            | Cross-platform unit/schema/seed tests                                |
| `docs`             | Setup, database, environment, admin and troubleshooting guides       |

## 10. Local acceptance checklist

After setup, verify:

- Homepage, shop, product, brand and collection pages load in Arabic and English.
- Arabic/English autocomplete, aliases, filters and no-result states work.
- Cart survives refresh, quantity changes work, and checkout revalidates price/stock.
- An order reserves inventory; admin status changes create history and movements.
- Admin login/logout, permissions, product import/edit, inventory, review moderation, SEO, media, settings, activity and analytics pages load.
- Empty products/brands/collections/reviews/orders/analytics/media show empty states instead of crashes.
- Allowed images upload; invalid/large images fail safely; alt text is stored.
- `pnpm build && pnpm start` works before deployment.

ISR can look immediate during `pnpm dev`. Test real revalidation with `pnpm build` and `pnpm start`: public product, brand and collection pages use ISR; admin, cart and checkout remain dynamic.
