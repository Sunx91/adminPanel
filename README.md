# Role-Based eCommerce Admin Dashboard

Admin panel for a minimal eCommerce schema using **Node.js**, **Express**, **AdminJS**, **Sequelize**, **PostgreSQL**, **bcrypt**, and **JWT**.

## Prerequisites

- Node.js 18+
- A **PostgreSQL** database — this repo is set up for **[Supabase](https://supabase.com/)** (still Postgres + Sequelize, as required)

## Setup (Supabase)

1. In [Supabase](https://supabase.com/), create a project and wait until the database is ready.

2. Open **Project Settings → Database** and copy the **URI** connection string (mode: use **Session** if you use the pooler on port `6543`, or **Direct** on `5432` if you prefer; both work with Sequelize for this app).

3. Paste it into `.env` as `DATABASE_URL=...` and replace `[YOUR-PASSWORD]` with your actual database password.

4. Copy the rest of the env file and set secrets:

   ```bash
   cp .env.example .env
   ```

5. Install dependencies:

   ```bash
   npm install
   ```

6. **First run only** — create tables: set `DB_SYNC=true` in `.env`, run `npm run dev` once until the server starts, then set `DB_SYNC=false` again. (`seed.js` also runs `sync({ force: true })`, which recreates tables — use only when you want a clean demo database.)

7. Seed demo data (destructive reset of all tables):

   ```bash
   npm run seed
   ```

8. Start the server:

   ```bash
   npm run dev
   ```

If the app cannot reach Supabase from your network, check Supabase **Database → Network restrictions** and their docs on **IPv4 add-on** / connection pooling.

Other hosted Postgres (not Supabase) using discrete `DB_*` variables: set `DB_SSL=true` in `.env` so Sequelize uses TLS.

### Setup (local PostgreSQL instead)

1. Create a database: `createdb ecommerce_admin`

2. In `.env`, **do not** set `DATABASE_URL`. Use `DB_NAME`, `DB_USER`, `DB_PASS`, `DB_HOST`, `DB_PORT`, and set `DB_SSL=false` (or omit `DATABASE_URL` and leave host as `localhost` without Supabase in the hostname).

3. Continue from step 5 above.

- **App**: [http://localhost:3000](http://localhost:3000) (redirects to AdminJS)
- **Admin UI**: [http://localhost:3000/admin](http://localhost:3000/admin)

### HTTP API (JWT)

Shared logic lives in [`services/authService.js`](services/authService.js) and is used by both **`POST /api/login`** and the **AdminJS** login form (same password rules and bcrypt path).

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/login` | Body: `{ "email", "password" }`. Success: `{ success, data: { token, tokenType, expiresIn, user } }`. Errors: `{ success: false, error: { code, message } }`. |
| `GET` | `/api/me` | Header: `Authorization: Bearer <token>`. Returns `{ success, data: { user } }` from the database (fresh role). |

- **Email** matching is **case-insensitive** on login.
- **JWT** includes fixed **`iss`** (`adminjs-ecom`); override lifetime with **`JWT_EXPIRES_IN`** (default `8h`).

### Seed accounts

| Role  | Email               | Password  |
|-------|---------------------|-----------|
| admin | admin@example.com   | admin123  |
| user  | user@example.com    | user123   |

## Features

- Six Sequelize models: `User`, `Category`, `Product`, `Order`, `OrderItem`, `Setting`
- AdminJS with authenticated router (session); `POST /api/login` returns a JWT
- Password hashes hidden from list/show/filter; new users created in Admin get a random initial password if the field is left empty (change via DB or future flow)
- **Admin**: all resources, full dashboard stats, **Configuration** custom page for key/value settings
- **User**: no Users or Settings resources in the nav; orders scoped to their account; **OrderItem** list is admin-only (line items visible on their order detail)

## Git branch workflow (assignment)

| Branch             | Purpose                          |
|--------------------|----------------------------------|
| `main`             | Production-ready releases only   |
| `dev`              | Integration of completed features |
| `feature/models`   | Database models                    |
| `feature/auth`     | JWT + AdminJS authentication       |
| `feature/rbac`     | RBAC + dashboards + settings UI    |
| `feature/*`        | Other work (e.g. production hardening) |

**Recommended flow:** open a feature branch from `dev` → implement → merge into `dev` (PR or local merge) → when stable, merge `dev` → `main` and tag a release.

Example (local merges):

```bash
git checkout dev
git pull origin dev   # if using a remote
git checkout -b feature/your-topic
# ... commit work ...
git checkout dev
git merge feature/your-topic -m "Merge feature/your-topic into dev"
git checkout main
git merge dev -m "Release: sync main from dev"
git push origin main dev
```

Push `main` and `dev` to your **public** GitHub repository.

### Branch scope notes (for reviewers)

Each feature branch carries a short scope file merged into `dev` / `main`:

- [`docs/branch-scope-models.md`](docs/branch-scope-models.md)
- [`docs/branch-scope-auth.md`](docs/branch-scope-auth.md)
- [`docs/branch-scope-rbac.md`](docs/branch-scope-rbac.md)
- [`docs/branch-scope-production.md`](docs/branch-scope-production.md)

## Production

1. Set **`NODE_ENV=production`** on the host.
2. Set **`JWT_SECRET`** and **`COOKIE_SECRET`** to **different** random strings, **each at least 32 characters** (the app refuses shorter values in production).
3. Set **`DATABASE_URL`** (or discrete `DB_*` + `DB_SSL` for hosted Postgres).
4. Behind HTTPS (Render, Railway, Fly, etc.):
   - Set **`TRUST_PROXY=true`** so Express respects `X-Forwarded-*` headers.
   - Set **`SESSION_COOKIE_SECURE=true`** so the AdminJS session cookie is `Secure` (omit or `false` only for local HTTPS experiments).
5. **Never** set `DB_SYNC=true` in production unless you explicitly add **`ALLOW_DB_SYNC_IN_PRODUCTION=true`** (schema should be managed via migrations or a controlled deploy step).
6. **Do not** run `npm run seed` against production unless you set **`ALLOW_SEED_IN_PRODUCTION=true`** (it drops all tables).
7. **`GET /health`** — use for load balancer / platform health checks.
8. Start with **`npm run start:prod`** (or `npm start` with `NODE_ENV=production` set by the platform). Optional: [`Procfile`](Procfile) and [`render.yaml`](render.yaml) are included as examples.

**Security middleware:** [`helmet`](https://helmetjs.github.io/) is enabled with **CSP disabled** so AdminJS’s UI and bundles keep working. **`POST /api/login`** is rate-limited (see `API_LOGIN_MAX_ATTEMPTS` in `.env.example`).

## Submission checklist

- [ ] Public GitHub repository created
- [ ] Branch strategy (`main`, `dev`, `feature/*`) followed
- [ ] All six models created
- [ ] AdminJS configured with all models and relationships
- [ ] Password field not exposed in list/show/filter
- [ ] `POST /api/login` returns JWT
- [ ] AdminJS protected with login
- [ ] Admin role: full access + dashboard summary
- [ ] Regular user: no Users / Settings resources; limited dashboard
- [ ] Custom dashboard (AdminJS `dashboard` handler + component)
- [ ] Custom Settings page (`pages.SiteConfiguration`)
- [ ] `.env` gitignored
- [ ] README with setup instructions

## Optional: deploy

Use Railway, Render, or similar: set the same environment variables, use a managed Postgres URL, and run `node seed.js` once against production if you need demo data.
