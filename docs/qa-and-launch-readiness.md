# Final QA and launch readiness

Step 26 makes release confidence evidence-based. **Perfume Studio → QA & Launch** is the working record for staging tests, reproducible defects, accountable approvals, and the final server-enforced Live Mode decision.

## Environments

- Development: fast automated and local functional checks against disposable data.
- Staging: production-like database, Cloudinary, HTTPS, domain, cache and environment configuration. Human device/browser evidence belongs here.
- Production: controlled smoke testing and monitoring only. Do not seed fake orders, reviews, ratings, analytics, or social proof.

Never use production customer data in development. Staging accounts, media and databases must remain isolated from production.

## Readiness rule

Live Mode is allowed only when all of these are true:

1. Overall score is at least 90%. Each category contributes equally; checks inside a category use their recorded weight.
2. Every critical category scores 100% and every individually critical check is `PASSED`.
3. No `CRITICAL` or `HIGH` bug remains `OPEN`, `IN_PROGRESS`, `FIXED`, or `NEEDS_REVIEW`. A fix stops blocking only after `VERIFIED` or `CLOSED`.
4. Business owner, developer, QA, SEO, security, content, inventory, and delivery approvals are all recorded.
5. Existing Store Setup gates for real products, approved non-placeholder media, active delivery fees, and SEO templates also pass.

`NOT_APPLICABLE` is excluded only for noncritical evidence. It cannot bypass a critical check. Database seed creates the checklist and empty approvals but never marks evidence passed.

## Workflow

1. Apply migrations and run the safe seed for the target environment.
2. Run `pnpm qa:check` against the exact release commit.
3. Deploy privately to staging, set `QA_BASE_URL`, and run `pnpm qa:smoke`.
4. Test the matrix in `staging-test-matrix.md`. Record environment, device, browser, evidence and notes for every result.
5. Create a complete bug report for every failure. Follow `bug-triage.md` and rerun related regression paths after fixes.
6. Approvers review evidence for their own area and record the approval themselves.
7. Confirm **System Health** has no failures, then attempt Live Mode through **Store Setup**. The server recalculates readiness; hiding a control cannot bypass it.

## Automated commands

```bash
pnpm qa:audit
pnpm qa:check

# After a private staging deployment
QA_BASE_URL=https://staging.example.com pnpm qa:smoke
```

The audit proves required structures exist. The smoke test checks public routes, 404 behavior, anonymous Studio protection, robots, sitemap and unauthorized revalidation. Neither command replaces checkout, inventory, RBAC, accessibility, browser or business-owner testing.

## Regression boundary

For every bug fix, rerun the original reproduction, the nearest happy path, the related Arabic/English route, the relevant mobile viewport, permissions for affected admin roles, and checkout/inventory integrity when shared data or server actions changed.
