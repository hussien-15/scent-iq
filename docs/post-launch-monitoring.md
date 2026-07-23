# First 72 hours after launch

Assign one technical owner and one store-operations owner before switching to Live. Keep rollback instructions, database/hosting/media dashboards, support channels and the exact release ID available.

## First hour

- Confirm canonical HTTPS, `/ar`, `/en`, robots, sitemap, product media, search and the support page.
- Place one controlled COD order with real configured delivery data; verify totals, confirmation, reservation and Studio visibility.
- Confirm no unexpected 5xx, authentication loop, revalidation failure or upload failure.
- Confirm Core Web Vitals events arrive without PII.

## First 24 hours

- Review order creation/success, duplicate submissions, cancellations, stock/reservations and delivery-fee anomalies.
- Review error logs by release and route, database saturation/slow queries, media errors and authentication/rate-limit failures.
- Review customer support contacts and negative delivery/review signals; create bugs rather than keeping defects in chat.
- Check p75 mobile LCP, INP and CLS after representative traffic exists.

## 24–72 hours

- Compare orders, conversion steps, AOV and delivery selections against real operational expectations; do not manufacture baselines.
- Reconcile a sample of product/variant stock with movement history and orders.
- Review search terms with no results, product gaps, 404s and redirect traffic.
- Close only verified defects and update QA evidence after any hotfix.

## Escalation

- Disable ordering for checkout, money, inventory or order-integrity risk while keeping the catalog available when safe.
- Use full storefront maintenance for security, privacy, database integrity or broad public failure.
- Roll back application code only when the previous build remains compatible with deployed migrations. Restore a database only under the database rollback procedure; never improvise destructive recovery.
