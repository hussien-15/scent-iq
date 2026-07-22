# ScentIQ performance baseline

Step 20 establishes a mobile-first performance contract instead of treating
speed as a launch-week cleanup.

## Production targets

Measured at the 75th percentile of real visits:

- LCP: at most 2.5 seconds
- CLS: at most 0.10
- INP: at most 200 milliseconds
- FCP: at most 1.8 seconds
- TTFB: at most 800 milliseconds

Perfume Studio → Performance records a privacy-safe 10% sample. It stores only
the route, locale, broad device class, metric, rating, and navigation type.

## Guardrails now in code

- Public listing cards are Server Components; only wishlist and tracked
  recommendation links hydrate.
- Storefront card queries select only card fields and one optimized image.
- The shop uses server pagination (16 products) and URL-backed filters.
- Product and collection images use `next/image`, fixed aspect ratios,
  responsive `sizes`, AVIF/WebP negotiation, and long image cache TTLs.
- Below-the-fold home sections use `content-visibility` without removing their
  server-rendered, indexable HTML.
- Recharts is Studio-only and loads near the viewport through an intersection
  gate; closed analytics sections do not download chart code.
- Products, orders, customers, reviews, activity logs, inventory, and
  collection products use bounded result sets or pagination.
- Public ISR pages revalidate every 15–30 minutes and admin mutations trigger
  on-demand `revalidatePath` calls. Cart, checkout, orders, and Studio stay
  dynamic.
- Search is debounced in the browser, bounded on the server, and briefly cached
  by query. Availability is explicitly `no-store`.
- Skeletons reserve the product/gallery layout and prevent blank screens on
  slow mobile connections.
- System font stacks avoid font downloads and font-induced layout shift.

## Release verification

```bash
pnpm prisma:generate
pnpm typecheck
pnpm lint
pnpm build
pnpm perf:budget
```

`perf:budget` measures initial route JavaScript after gzip. Public routes are
limited to 220 kB and Studio routes to 350 kB. Dynamic chart chunks are not
counted as initial JavaScript because they load only near the viewport.

Before launch, also test a real production deployment at 320, 390, 768, 1024,
and 1440 px, Android mid-tier throttling, slow 4G, image failures, checkout
submission, Arabic RTL, keyboard navigation, and reduced-motion mode.
