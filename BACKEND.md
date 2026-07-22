# ScentIQ backend architecture

Step 21 keeps the Next.js App Router foundation and makes backend boundaries explicit. The storefront and Perfume Studio remain in the same application; no paid service or second backend is required.

Step 22 database models, compatibility mappings, backfills, and migration paths are documented in `DATABASE.md`.

Step 23 environment modes, idempotent core/demo data, first-admin rules,
product-import validation, setup checklist, and production launch gates are
documented in `SEEDING.md`.

## Layer map

| Layer | Responsibility | Examples |
| --- | --- | --- |
| `src/app/api` | HTTP parsing, authentication, rate limits and response status | search, availability, media, webhooks, revalidation |
| `src/actions` | Server Action boundary used by React forms/components | checkout, order status, products, collections |
| `src/validators` | Shared Zod schemas; every client value is untrusted | checkout, UUID lists, pagination, safe sorting |
| `src/services` | Business rules and transaction orchestration | checkout pricing/reservation, order state machine, search ranking, media |
| `src/repositories` | Reusable Prisma reads/writes with bounded selections | products, orders, media |
| `src/lib` | Cross-cutting infrastructure | auth, RBAC, Prisma, safe errors, API envelopes, security |
| `src/types` | Transport contracts | `ApiResponse<T>`, `ActionResult<T>` |
| `src/utils` | Pure deterministic helpers | Arabic matching, slug generation, formatting |

Route Handlers must not contain reusable product/order rules. Services may call repositories and Prisma transactions, but neither services nor repositories trust browser prices, permissions or arbitrary sort/path values.

## API contract

JSON success:

```json
{ "success": true, "data": {}, "message": "optional" }
```

JSON failure:

```json
{ "success": false, "error": "Safe public message", "code": "VALIDATION_ERROR", "details": {} }
```

Supported safe codes include `VALIDATION_ERROR`, `AUTHENTICATION_REQUIRED`, `PERMISSION_DENIED`, `NOT_FOUND`, `CONFLICT`, `RATE_LIMITED`, `INVALID_ORIGIN`, and `INTERNAL_ERROR`. Unexpected exceptions are logged server-side and returned without stack traces, SQL, secrets, tokens or raw database messages. File download endpoints return CSV/XLS/JSON on success but use the same JSON failure contract.

## Critical flows

### Checkout

1. `createOrder` applies a database-backed rate limit and parses `checkoutSchema`.
2. `checkout.service` re-reads published products, variants, prices, availability, delivery fee and free-delivery threshold.
3. A serializable transaction re-checks stock, creates the order/history, reserves inventory, and records attribution/analytics.
4. `submissionId` is unique and makes retries idempotent. A concurrent unique conflict resolves to the existing order.
5. The client never submits an authoritative price, discount, subtotal or total.

### Order and inventory state

Allowed order transitions live in `order.service.ts`. Status, status history, inventory movement, and related analytics are written together in one serializable transaction. Pending/Confirmed/Preparing reserve stock; Shipped deducts physical stock; pre-shipping cancellation releases a reservation; a return restores sellable stock only when the admin explicitly selects that option.

Inventory invariants are enforced by `applyInventoryMovement`: physical stock and reserved stock cannot be negative, and reserved stock cannot exceed physical stock.

### Search and pagination

Autocomplete is debounced in the browser, rate-limited, limited to 80 input characters, ranks at most 150 bounded candidates, and returns at most 10 rows. Arabic normalization, aliases, notes and one-character typo tolerance remain deterministic. Shared pagination caps page size at 100. New sort inputs must use an allowlist mapped to Prisma fields; never pass a raw query-string field into `orderBy`.

## Security and permissions

- All Studio writes call `requirePermission` on the server. Hidden UI is not authorization.
- POST routes use same-origin checks unless they are authenticated by a purpose-built signature/secret.
- Rate limits use hashed network/browser keys and database buckets, so they work across server instances.
- Media uploads validate extension, MIME, magic bytes, size, hash duplicates, and record the admin actor.
- Export cells neutralize spreadsheet formula prefixes.

## Caching and revalidation

Public editorial/product pages continue to use ISR. `revalidation.service.ts` maps a strict entity type to known routes; callers cannot submit an arbitrary path. `POST /api/revalidate` accepts either an active admin with `settings.edit` or `Authorization: Bearer <REVALIDATION_SECRET>`, then rate-limits the request. Product/order services also invalidate their exact storefront and Studio paths after successful mutations.

## Webhook foundation

`POST /api/webhooks/{delivery|payment|notifications}` requires:

- `x-scentiq-event-id`: stable provider event id
- `x-scentiq-signature`: `sha256=<hex HMAC of the raw request body>`
- `WEBHOOK_SECRET_<PROVIDER>` or fallback `WEBHOOK_SECRET`

The receiver caps payload size at 1 MB, verifies the raw-body HMAC with constant-time comparison, hashes the payload, and uses `(provider,eventId)` as replay protection. A reused event id with a different payload is rejected. The first version records verified events but deliberately performs no payment/order mutation until a provider-specific contract is implemented.

## Testing and release

```bash
pnpm prisma:generate
pnpm test
pnpm typecheck
pnpm lint
pnpm build
pnpm perf:budget
```

Tests cover checkout totals and duplicate items, Iraqi phone normalization, order transitions, inventory boundaries, RBAC, Arabic search, and slug candidates. Database integration tests should use a disposable PostgreSQL schema and cover concurrent last-unit checkout, duplicate submission replay, cancellation release, shipping deduction, and return restoration before enabling online payment or automated webhooks.
