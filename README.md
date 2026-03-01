# Zervia MVP Monorepo (zervia.eu)

EU-first booking platform MVP (Germany first), built API-first for future native app/AI integrations.

## Tech Stack

- Frontend: Next.js App Router + TypeScript + Tailwind + PWA
- Backend: NestJS + TypeScript
- Database: MongoDB Atlas
- Auth: JWT Access Token + Refresh Token
- Roles: `customer` / `business` / `admin`
- i18n: `de` + `en`
- Region defaults: `country=DE`, timezone `Europe/Berlin`

## Monorepo Structure

```text
.
├─ apps/
│  ├─ web/                # Next.js PWA app
│  └─ api/                # NestJS API service
├─ packages/
│  └─ shared/             # Shared types/constants (roles, locale, country, DTO-like contracts)
├─ turbo.json             # Task pipeline
├─ tsconfig.base.json     # Base TypeScript config
└─ .eslintrc.cjs          # Unified lint config
```

## Prerequisites

- Node.js 20+
- pnpm 10+
- MongoDB Atlas cluster

## Environment Variables

1. Copy `apps/api/.env.example` to `apps/api/.env`
2. Copy `apps/web/.env.example` to `apps/web/.env.local`

## Install

```bash
pnpm install
```

## Run (Local)

```bash
pnpm dev
```

Services:

- Web: `http://localhost:3000`
- API: `http://localhost:4000/api/v1`
- Health checks:
  - Web: `GET /api/health`
  - API: `GET /api/v1/health`

## Build

```bash
pnpm build
```

## Minimal API Endpoints

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `GET /api/v1/businesses?country=DE`
- `POST /api/v1/businesses` (`business` or `admin`)
- `GET /api/v1/bookings?country=DE` (`business` or `admin`)
- `POST /api/v1/bookings` (`customer` or `admin`)
- `GET /api/v1/admin/overview` (`admin`)

## Deployment Notes (Hetzner VPS)

- Deploy `apps/api` as a Node service (PM2/systemd + reverse proxy).
- Set production env vars on VPS (do not commit `.env`).
- Keep MongoDB Atlas IP allowlist aligned with Hetzner outbound IP.
