# eCommerce Admin Panel

Express app with **AdminJS** (Sequelize adapter) on **PostgreSQL**, a small **JWT** JSON API, and **Swagger UI** for `/api` routes. Intended as a demo store: users, catalog, orders, line items, and key/value **settings** (tax rate, currency) used by the admin dashboard.

**Requirements:** **Node.js 18+** and a **PostgreSQL** database (local or hosted, e.g. Supabase).

**Stack (from `package.json`):** Express 4, AdminJS 6.8, `@adminjs/express` 5, `@adminjs/sequelize` 3, Sequelize 6, `pg`, bcrypt, jsonwebtoken, dotenv, express-session, swagger-ui-express, yaml.

---

## What you get

| Area | Details |
|------|---------|
| **Data model** | `User` (name, email, password hash, role), `Category`, `Product`, `Order` (userId, status, total), `OrderItem`, `Setting` — see `models/` and `models/index.js` for associations. |
| **Admin UI** | **`/admin`** — cookie session login (same `User` rows as the API). Branding title from `SITE_NAME` or default `eCommerce Admin` (`admin/setup.js`). |
| **Custom pages** | **Dashboard** — admins: store metrics, revenue-by-month chart (paid orders, UTC), last 5 orders with customer name + email. Users: profile (name + email), last 5 orders, recent line items. **Settings** (sidebar page) — admins only: edit `tax_rate` and `currency` stored in `settings`; `site_name` / `support_email` shown as read-only defaults from env (`admin/setup.js`, `admin/settings.jsx`). |
| **Resources** | Users, Categories, Products, Orders, Order Items — RBAC in `admin/resources.js`. Orders list **Customer** column is `userId` with `reference: 'users'` so the related user’s **name** appears (User `name` is `isTitle`). |
| **REST API** | `POST /api/login`, `GET /api/me` (Bearer JWT), `GET /api/health` — `routes/`, `services/authService.js`. Public user includes **`id`, `name`, `email`, `role`**. |
| **Docs** | OpenAPI source: `docs/openapi.yaml`. **Swagger UI:** `GET /api/docs`. |

**Order statuses:** `pending`, `paid`, `cancelled` (enum on `Order`).

---

## Repository layout

```text
app.js                 # Express: DB auth, optional sync, AdminJS router, API, Swagger
config/database.js     # Sequelize instance: DATABASE_URL or DB_*; SSL for Supabase / DB_SSL
models/                # Sequelize models + associate() in index.js
routes/
  auth.js              # POST /api/login, GET /api/me
  health.js            # GET /api/health
middleware/
  requestLogger.js
  requireJwt.js
services/authService.js
admin/
  setup.js             # AdminJS instance, dashboard + Settings page handlers
  resources.js         # Resource definitions, RBAC, Order line-item preview hook
  dashboard.jsx        # Custom dashboard UI (AdminJS component bundle)
  settings.jsx         # Custom Settings page UI
docs/openapi.yaml
seed.js                # Full reset: sequelize.sync({ force: true }) + demo data
```

---

## Quick start

### 1. PostgreSQL

Create a database (local or [Supabase](https://supabase.com/) **Project Settings → Database**). If the password contains `@`, URL-encode it as `%40` in `DATABASE_URL`. Pooler URIs often behave better than a flaky direct host.

### 2. Environment

```bash
cp .env.example .env
```

Set **`JWT_SECRET`** and **`COOKIE_SECRET`** (required — `app.js` throws if missing). Set either **`DATABASE_URL`** or **`DB_NAME`**, **`DB_USER`**, **`DB_PASS`**, plus **`DB_HOST`** / **`DB_PORT`** as in `.env.example`.

Optional:

| Variable | Purpose |
|----------|---------|
| `SITE_NAME` | AdminJS `companyName` and default **site name** on Settings page |
| `SUPPORT_EMAIL` | Default **support email** on Settings page |
| `JWT_EXPIRES_IN` | JWT lifetime (default `8h`) |
| `PORT` | HTTP port (default `3000`) |
| `DB_SYNC` | `true` runs `sequelize.sync({ alter: true })` on startup — **dev only** |
| `DB_SSL` | `true` to require TLS when not using a Supabase-style host/URL |

### 3. Install

```bash
npm install
```

### 4. Create or align tables

- **First time / after model changes:** set **`DB_SYNC=true`**, run the server once (`npm run dev` or `npm start`), then set **`DB_SYNC=false`** for normal use.  
- **`npm run seed`** (below) already runs **`sequelize.sync({ force: true })`**, which **drops and recreates** all tables — use only when you want a clean demo DB.

### 5. Demo data (optional)

```bash
npm run seed
```

**Warning:** `seed.js` calls **`sync({ force: true })`** — **all data in the affected tables is deleted**.

After seeding, the script prints a summary. Approximate counts:

- **31 users:** 1 admin + **30** customers (named accounts, e.g. `sunath@example.com`).
- **3** categories, **13** products, **44** orders (mix of paid/pending, dates spread over ~12 months), plus order line items.  
- **Settings:** `tax_rate` (e.g. `0.08`), `currency` (`USD`).

### 6. Run

```bash
npm run dev     # nodemon
# or
npm start       # node app.js
```

| URL | Purpose |
|-----|---------|
| `http://localhost:<PORT>/admin` | AdminJS (or `PORT` from `.env`) |
| `http://localhost:<PORT>/api/docs` | Swagger UI |
| `GET /` | Redirects to `/admin` |

---

## Demo logins (after `npm run seed`)

| Role | Email | Password |
|------|-------|----------|
| **Admin** | `admin@example.com` | `admin123` |
| **Customer** | Any seeded customer email (e.g. `sunath@example.com`, `priya@example.com`, …) | `user123` |

All customers use the same password **`user123`**. Use the **seed** output or `users` table for the full email list.

---

## npm scripts

| Script | Command | Purpose |
|--------|---------|---------|
| `npm start` | `node app.js` | Run server |
| `npm run dev` | `nodemon app.js` | Dev with auto-restart |
| `npm run seed` | `node seed.js` | **Wipe** DB tables and insert full demo dataset |
| `npm run build:admin` | `adminjs bundle` | Rebuild AdminJS frontend bundle if you change bundled components |

---

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `JWT_SECRET` | Yes | Signs JWT access tokens |
| `COOKIE_SECRET` | Yes | Encrypts the AdminJS / express-session cookie |
| `DATABASE_URL` | One of… | Full Postgres URI (when set, `DB_*` are not used by `config/database.js`) |
| `DB_NAME`, `DB_USER`, `DB_PASS` | …or URL | Local-style connection with `DB_HOST` (default `localhost`), `DB_PORT` (default `5432`) |
| `DB_SSL` | No | `true` enables TLS (`rejectUnauthorized: false` dialect option) |
| `JWT_EXPIRES_IN` | No | JWT expiry (default `8h`) |
| `DB_SYNC` | No | `true` = `sync({ alter: true })` on startup |
| `PORT` | No | HTTP port (default `3000`) |
| `SITE_NAME` | No | Branding + Settings page default site name |
| `SUPPORT_EMAIL` | No | Settings page default support email |

TLS to Postgres is turned on when **`DATABASE_URL`** or **`DB_HOST`** matches `supabase.co` / `pooler.supabase.com`, or when **`DB_SSL=true`**.

---

## HTTP API

Base path: **`/api`** (JSON body where noted).

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/health` | No | DB connectivity via Sequelize; **503** if DB down |
| `POST` | `/api/login` | No | Body `{ "email", "password" }` → JWT + public user |
| `GET` | `/api/me` | Bearer JWT | Current user from DB (`id`, `name`, `email`, `role`, `createdAt`) |

### Example: login

```bash
curl -s -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}'
```

Success payload (conceptually): `success`, `data.token`, `data.user` with **`id`**, **`name`**, **`email`**, **`role`**.

### OpenAPI

Machine-readable: **`docs/openapi.yaml`**. Interactive: **`/api/docs`**.

---

## Roles (AdminJS + API user rows)

- **`admin`** — Full CRUD on Users, Categories, Products, Orders, Order Items; **Settings** custom page; dashboard aggregates; can create users (auto-generated password if left blank on create — see `admin/resources.js`).
- **`user`** — No Users resource; **Orders** and **Order Items** scoped to `currentAdmin.id` via list filters and show access hooks; dashboard shows only that user’s orders and line items.

Admin login returns `currentAdmin` with `id`, `name`, `email`, `role` (`app.js` authenticate handler).

---

## Dependencies (high level)

express, adminjs, @adminjs/express, @adminjs/sequelize, sequelize, pg, bcrypt, jsonwebtoken, dotenv, express-session, express-formidable, swagger-ui-express, yaml, nodemon and @adminjs/bundler (dev).

---

## Git workflow (optional)

Use whatever fits your team; one simple pattern:

- **`main`** — stable releases  
- **`dev`** — integration  
- **`feature/*`** — short-lived branches per change  

Merge toward `main` when reviewed and green.
