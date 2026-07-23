# /actions

Next.js Server Actions (mutations invoked directly from forms/components).

Real ones now: `search.ts` (logs a search to `SearchHistory`), `product.ts`
(`updateProductStatus` — Perfume Studio's status dropdown), `review.ts`
(`setReviewApproval` — Perfume Studio's review moderation). Both admin
actions also write an `ActivityLog` row.

Still to come: `order.ts` with a `createOrder()` action once Phase 2
checkout exists, and the full product-editor actions once the 10-step
wizard is built.
