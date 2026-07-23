# Local PostgreSQL and Prisma

ScentIQ uses PostgreSQL through Prisma. Development should use a disposable local database named `scentiq_dev`; production/Supabase requires the separate safety process in the root `DATABASE.md`.

## Local URLs

```env
DATABASE_URL="postgresql://scentiq:scentiq_local_password@localhost:5432/scentiq_dev?schema=public"
DIRECT_URL="postgresql://scentiq:scentiq_local_password@localhost:5432/scentiq_dev?schema=public"
```

Both URLs are the same locally. In deployed Supabase they are deliberately different: runtime traffic uses the 6543 transaction pooler; migrations and seed use the 5432 session pooler.

## Native PostgreSQL

Install PostgreSQL 16, keep port 5432, and remember the administrator password. In pgAdmin create login `scentiq`, then database `scentiq_dev` owned by it. Or run as a PostgreSQL administrator:

```sql
CREATE USER scentiq WITH PASSWORD 'scentiq_local_password';
CREATE DATABASE scentiq_dev OWNER scentiq;
```

Verify from a terminal:

```powershell
psql "postgresql://scentiq:scentiq_local_password@localhost:5432/scentiq_dev" -c "SELECT 1;"
```

## Docker option

```powershell
docker compose up -d postgres
docker compose ps
docker compose logs postgres
```

Stop the container without deleting data:

```powershell
docker compose stop postgres
```

Remove the container and local volume only when you intentionally want to delete this Docker database:

```powershell
docker compose down -v
```

## Prisma commands

- `pnpm prisma:generate`: regenerate Prisma Client after schema changes.
- `pnpm prisma:migrate`: local `prisma migrate dev`; applies migrations and can create a new one.
- `pnpm prisma:migrate:deploy`: apply reviewed existing migrations in deployment/shared environments.
- `pnpm prisma:migrate:status`: report migration state without changing data.
- `pnpm prisma:studio`: inspect local rows in a browser.
- `pnpm seed:core`: repeatable structure without fake activity.
- `pnpm seed:dev`: core plus clearly marked development catalog/activity.
- `pnpm seed:production`: guarded production-safe core only; read `SEEDING.md` first.

## Safe reset

`pnpm db:reset` deletes data, so ScentIQ wraps Prisma's reset with three hard gates:

1. Host must be `localhost`, `127.0.0.1`, or `::1`.
2. Database name must be exactly `scentiq_dev`.
3. `SCENTIQ_ENVIRONMENT` must be development, local, or test.

It then applies migrations and runs `seed:dev`. The command refuses Supabase and any other remote database. Do not bypass the guard.

## Existing Supabase database

Do not run `prisma migrate dev`, `db:reset`, or `seed:dev` against it. If it was originally created with `prisma db push`, make a backup, verify the two pooler URLs, establish the documented migration baseline, review the additive migration, and use `prisma:migrate:deploy`. The authoritative steps are in the root `DATABASE.md`.
