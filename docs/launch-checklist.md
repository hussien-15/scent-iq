# Store launch checklist

The technical deployment can exist privately in **Setup** or **Preview** mode. Launch occurs only after the store is operationally truthful and ready.

- [ ] Custom canonical domain and HTTPS work on mobile and desktop; aliases redirect once.
- [ ] Deployment and database production checklists are complete; backup restore and rollback contacts are confirmed.
- [ ] Every public product is real, priced, stocked, categorized, described bilingually, and has approved durable media and accurate performance claims.
- [ ] Delivery providers, Iraqi cities, fees, timing text, COD flow, support WhatsApp/phone, and confirmation process are real and tested.
- [ ] Privacy, terms, shipping, returns/contact, authenticity language, and trust badges are approved. No fake review, rating, counter, trend, or popularity claim exists.
- [ ] Arabic RTL, English, keyboard navigation, focus, mobile tap targets, images, loading, empty states, 404, and retry/error screens pass.
- [ ] Review moderation, photo approval, admin replies, inventory adjustments, order status rules, and activity/audit logs work with correct permissions.
- [ ] `robots.txt` is non-indexable in Setup/Preview. After Live Mode, it allows public pages, blocks private/checkout/admin routes, and publishes the canonical sitemap.
- [ ] Monitoring owners can see Vercel, PostgreSQL, Cloudinary, System Health, and Studio Performance without logging PII.
- [ ] Operations know how to pause ordering independently and how to activate the branded storefront maintenance page.
- [ ] Final QA is at least 90%; all critical systems are 100%; every critical check is Passed; no unresolved Critical/High bug remains.
- [ ] All eight launch approvals are recorded by the responsible owner after reviewing evidence.

Final sequence: backup → migration → production seed only if required → deploy → System Health → smoke test → confirm maintenance Off → Store Setup Live → confirm robots/sitemap → monitor first real orders.
