# Store Rating Platform

A full-stack web application where users submit 1–5 star ratings for stores. A
single login serves three roles — **System Administrator**, **Normal User**, and
**Store Owner** — each unlocking different functionality.

## Tech stack

| Layer    | Technology                                  |
| -------- | ------------------------------------------- |
| Backend  | NestJS (TypeScript), TypeORM, JWT (Passport)|
| Database | PostgreSQL                                  |
| Frontend | React + Vite (TypeScript), Tailwind CSS     |
| Auth     | Stateless JWT access token                  |
| Docs     | Swagger / OpenAPI at `/api/docs`            |

## Production-grade features

- **Security** — Helmet security headers, strict CORS (no wildcard), global
  rate limiting (60 req/min/IP; 5/min on login, 10/min on rating submits), and a
  global `ValidationPipe` (`whitelist` + `forbidNonWhitelisted`) that blocks
  mass-assignment.
- **Fail-fast config** — environment variables are validated with Joi at boot;
  the API refuses to start if anything required is missing.
- **Consistent errors** — every error returns `{ statusCode, error, code,
  message, path, timestamp }` with a stable, machine-readable `code`
  (e.g. `RESOURCE_NOT_FOUND`, `DUPLICATE_ENTRY`, `RATE_LIMITED`).
- **OpenAPI docs** — explore and try every endpoint at `http://localhost:3000/api/docs`
  (non-production only). Click **Authorize** and paste an access token to call
  protected routes.
- **Observability** — request/response logging interceptor + a `GET /health`
  liveness probe.
- **Pagination** — all list endpoints support `page` / `limit` and return a
  `{ data, total, page, limit, totalPages }` envelope.

## Features by role

- **System Administrator** — analytics dashboard (KPI cards, rating-distribution
  chart, top-rated stores, recent-activity feed); create admin, normal, and
  store-owner users; list & filter users and stores; view user detail (with a
  store owner's average rating); sortable, filterable, **paginated** tables.
- **Normal User** — sign up & log in; browse/search stores; see each store's
  overall rating and their own rating; submit and update a rating (one per
  store); change password.
- **Store Owner** — log in (created by an admin, no self-registration);
  dashboard with the store's average rating and the list of users who rated it;
  change password.

## Project structure

```
.
├── backend/            NestJS API (auth, users, stores, ratings, admin)
│   └── src/
│       ├── auth/  users/  stores/  ratings/  admin/  common/  config/
│       └── database/   migrations + seed.ts
├── frontend/           React + Vite SPA (role-based routing & pages)
├── docker-compose.yml  postgres + backend + frontend
└── README.md
```

---

## Quick start with Docker (recommended)

Requires Docker + Docker Compose.

```bash
docker compose up --build
```

This starts PostgreSQL, runs migrations, seeds the default admin, starts the API
on `http://localhost:3000`, and serves the SPA on `http://localhost:5173`.

Open **http://localhost:5173** and log in with the default admin credentials
below.

---

## Manual setup

### Prerequisites

- Node.js 20+
- PostgreSQL 14+ (a database the app can connect to)

### 1. Backend

```bash
cd backend
cp .env.example .env          # then edit values (see table below)
npm install
npm run migration:run         # create tables (users, stores, ratings)
npm run seed                  # create the default admin user
npm run start:dev             # http://localhost:3000
```

### 2. Frontend

```bash
cd frontend
cp .env.example .env          # VITE_API_URL=http://localhost:3000
npm install
npm run dev                   # http://localhost:5173
```

---

## Environment variables

### Backend (`backend/.env`)

| Variable         | Description                                            | Example                                                  |
| ---------------- | ------------------------------------------------------ | -------------------------------------------------------- |
| `NODE_ENV`       | `development` \| `production` \| `test`                | `development`                                            |
| `PORT`           | API port                                               | `3000`                                                   |
| `CORS_ORIGIN`    | Allowed frontend origin(s), comma-separated            | `http://localhost:5173`                                  |
| `DATABASE_URL`   | PostgreSQL connection string (preferred)               | `postgres://postgres:postgres@localhost:5432/store_rating` |
| `JWT_SECRET`     | Secret used to sign access tokens                      | `a-long-random-string`                                   |
| `JWT_EXPIRY`     | Access-token lifetime                                  | `1d`                                                     |
| `ADMIN_NAME`     | Seeded admin name                                      | `System Administrator`                                   |
| `ADMIN_EMAIL`    | Seeded admin email                                     | `admin@example.com`                                      |
| `ADMIN_PASSWORD` | Seeded admin password                                  | `Admin@123`                                              |

> If `DATABASE_URL` is not set, the app falls back to discrete `DB_HOST`,
> `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_NAME` variables.

### Frontend (`frontend/.env`)

| Variable       | Description           | Example                 |
| -------------- | --------------------- | ----------------------- |
| `VITE_API_URL` | Base URL of the API   | `http://localhost:3000` |

---

## Seeding demo data

After running migrations, seed a fully-populated demo dataset:

```bash
cd backend
npm run seed
```

The seeder ([backend/src/database/seed.ts](backend/src/database/seed.ts)) is
**idempotent** at the row level — re-running only fills in what is missing and
never duplicates. It creates the default admin plus 3 store owners (each with a
store), 9 more stores, 5 normal users, and randomised ratings, so the app is
explorable on first run.

### Default credentials

| Role           | Email                        | Password      |
| -------------- | ---------------------------- | ------------- |
| Administrator  | `admin@example.com`          | `Admin@123`   |
| Store Owner    | `olivia.bennett@example.com` | `Password@1`  |
| Normal User    | `william.turner@example.com` | `Password@1`  |

> The admin credentials are configurable via `ADMIN_NAME` / `ADMIN_EMAIL` /
> `ADMIN_PASSWORD`. All seeded owners and normal users share the password
> `Password@1`. Additional users are created from the Admin panel; normal users
> can also self-register at `/register`.

---

## Validation rules (enforced on client **and** server)

- **Name** — 20–60 characters
- **Email** — standard email format
- **Password** — 8–16 characters, ≥1 uppercase letter, ≥1 special character
- **Address** — up to 400 characters (optional)
- **Rating** — integer 1–5

## API overview

Full interactive reference at **`/api/docs`** (Swagger UI).

| Method & path                  | Role        | Purpose                                  |
| ------------------------------ | ----------- | ---------------------------------------- |
| `GET /health`                  | public      | Liveness probe (`{ status, uptime }`)    |
| `POST /auth/register`          | public      | Normal-user signup                       |
| `POST /auth/login`             | all         | Login → `{ accessToken, user }`          |
| `PATCH /auth/change-password`  | any auth    | Change own password (verifies current)   |
| `GET /admin/stats`             | admin       | Totals: users, stores, ratings           |
| `GET /admin/analytics`         | admin       | KPIs, distribution, top stores, activity |
| `POST /users`                  | admin       | Create a user of any role                |
| `GET /users`                   | admin       | List users (filter/sort/paginate)        |
| `GET /users/:id`               | admin       | User detail (avg rating if store owner)  |
| `GET /users/store-owners`      | admin       | Store owners (for the store owner picker)|
| `POST /stores`                 | admin       | Create a store                           |
| `GET /stores`                  | any auth    | Stores + overall (+ own) rating (paged)  |
| `GET /admin/stores`            | admin       | Stores with overall rating (paged)       |
| `POST /ratings`                | normal      | Submit a rating                          |
| `PATCH /ratings/:id`           | normal      | Update own rating                        |
| `GET /store-owner/dashboard`   | store_owner | Average rating + raters                  |

## Database migrations

Schema is managed exclusively via TypeORM migrations (`synchronize: false`):

```bash
npm run migration:run       # apply
npm run migration:revert    # roll back the last migration
npm run migration:generate -- src/database/migrations/<Name>   # generate from entities
```

## Code style

Both packages share a Prettier config (`.prettierrc`):

```bash
npm run format         # write
npm run format:check   # verify (CI-friendly)
```
