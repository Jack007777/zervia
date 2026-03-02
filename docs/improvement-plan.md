# Zervia Improvement Plan (Treatwell Benchmark)

## Current Audit (2026-03-02)

### Stack and architecture
- Monorepo: `apps/web` (Next.js App Router + TypeScript + Tailwind + PWA), `apps/api` (NestJS + TypeScript), `packages/shared`.
- Frontend routing: locale-prefixed app routes (`/[locale]`), with dynamic pages for search, business detail, booking, auth, dashboard.
- i18n: locale segment (`de/en`) + JSON message files; runtime locale resolver in middleware.
- API shape: REST endpoints from NestJS (`/api/v1`), JWT + refresh token, RBAC roles customer/business/admin.
- Deployment:
  - Web: Cloudflare Pages/Workers (`apps/web/wrangler.toml`, `nodejs_compat` enabled).
  - API: Hetzner VPS via Docker Compose + Nginx reverse proxy + TLS.

### Gaps vs Treatwell
- Homepage conversion lacks strong preview/trust framing and robust empty-state guidance.
- Search filters/sorting/pagination were too light and not query-contract aligned (`/search?category=&city=&zip=&date=`).
- Detail page trust modules (reviews, cancellation policy, structured data) and booking path depth were limited.
- Supply-side acquisition page for business onboarding was missing.

## Delivery Plan

### P0 (must-have, conversion-critical)
1. Homepage IA upgrade
- Add sample result preview cards (with skeleton state).
- Add trust strip (rating/review visual treatment).
- Improve primary CTA text by locale and keep mobile-first tap targets.
- Add empty-state actions (expand radius / switch city).

2. Search results page upgrade
- Support query contract: `category`, `city`, `zip`, `date` (+ existing filters).
- Add sorting (recommended/distance/price/rating).
- Add filters (time slot, gender service, price range, rating).
- Add simple pagination.

3. Business detail + booking MVP
- Detail modules: intro, address + map link, opening hours, service list, review list with pagination, cancellation policy.
- Booking shortest path: service -> date/time -> contact details -> confirmation.
- Keep payment as future-ready placeholder: "Pay online (coming soon)".

### P1 (product depth)
4. Reviews and trust data model
- Frontend supports review fields and aggregated rating/reviewCount.
- Add star component and review sorting.
- Add LocalBusiness + AggregateRating JSON-LD on detail page.

5. Business acquisition page
- Add `/[locale]/partners` with DE/EN messaging.
- Add lead form (MVP capture endpoint at `POST /api/partner-leads`).

### P2 (quality and scale)
6. i18n consistency
- Centralized UI dictionary for new conversion modules.
- Keep locale/country switching state and query params during navigation.

7. Performance/accessibility
- Keep map iframe lazy-loaded.
- Improve form labels, clickable areas, and baseline semantic structure.
- Continue with Lighthouse tuning in follow-up iterations.

## Iteration Notes
- Used mock/fallback marketplace data for resilience when API has limited data.
- Kept implementation incremental and compatible with existing routes and auth.
- Next step: wire review and partner-lead persistence to backend DB endpoints.
