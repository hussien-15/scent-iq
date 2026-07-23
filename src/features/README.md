# /features

Feature-based modules go here once they exist — each self-contained with its
own components, hooks, and types. Nothing lives here yet because Phase 1 only
has simple, page-level features (catalog browsing) that don't need their own
module.

Expected first tenant: `features/cart/` in Phase 2 — cart state (Zustand
store), `<CartDrawer />`, `<CartItem />`, and cart-specific types, all in one
place instead of scattered across `components/` and `lib/`.
