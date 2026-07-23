# Bug triage and regression

Every bug report must contain a concise title, impact/context, numbered reproduction steps, expected result, actual result, environment, affected route, device/browser when relevant, reporter, assignee and optional screenshot URL. Do not paste customer PII, credentials, tokens or connection strings into evidence.

## Severity

| Severity | Meaning                                                                        | Examples                                                                                              |
| -------- | ------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------- |
| Critical | Launch, security, money or inventory integrity is unsafe; no viable workaround | Checkout unavailable, secret exposure, unauthorized admin action, overselling or corrupt order totals |
| High     | A core journey is broken or materially misleading                              | Product unavailable incorrectly, order cannot progress, major mobile/RTL failure                      |
| Medium   | Important behavior is impaired with a reasonable workaround                    | Filter inconsistency, incomplete admin feedback, noncritical browser issue                            |
| Low      | Cosmetic or minor usability/content issue                                      | Small spacing, nonblocking copy or alignment defect                                                   |

`CRITICAL` and `HIGH` block launch until the fix is independently `VERIFIED` or the report is `CLOSED` with evidence. `FIXED` means the developer believes a change is ready for retest; it is not verification.

## Status flow

`OPEN` → `IN_PROGRESS` → `FIXED` → `NEEDS_REVIEW` → `VERIFIED` → `CLOSED`

Return a bug to `OPEN` or `IN_PROGRESS` if the original reproduction still fails. Record a new bug when the fix causes a different defect with its own cause and regression boundary.

## Regression after a fix

- Repeat the exact reproduction with the original data conditions.
- Test the nearest successful path and failure/empty path.
- Check Arabic and English when copy, layout or routing changed.
- Check mobile and keyboard interaction when UI changed.
- Check RBAC denial and audit/activity rows when admin mutations changed.
- Check totals, idempotency, reservations and movements when order/inventory code changed.
- Run `pnpm qa:check`; rerun staging smoke when public routing, middleware, environment, SEO or deployment code changed.
