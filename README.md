# eCommerce Admin (AdminJS + Sequelize + PostgreSQL)

Small **course project**: admin UI for users, catalog, orders, and settings. Stack: **Express**, **Sequelize**, **PostgreSQL**, **AdminJS**, **bcrypt**, **JWT**.

## What it does

- **6 tables**: User, Category, Product, Order, OrderItem, Setting  
- **AdminJS** at `/admin` (login with email + password, session cookie)  
- **`POST /api/login`** returns a **JWT** + user info (same users as AdminJS)  
- **Roles**: `admin` sees everything; `user` cannot open the Users/Settings resources and only sees **their own orders** (see `admin/resources.js`)

## Project layout

```text
app.js              # Express + AdminJS router
seed.js             # Fills the DB with demo data (wipes tables!)
config/database.js  # Sequelize + Postgres (supports DATABASE_URL for Supabase)
models/             # Sequelize models
routes/auth.js      # POST /api/login
admin/              # AdminJS config, dashboard + settings page, RBAC per resource
```

## Setup (short)

1. Install [PostgreSQL](https://www.postgresql.org/) or use [Supabase](https://supabase.com/) and copy the DB URI.  
2. `cp .env.example .env` and fill in secrets + database.  
3. `npm install`  
4. Optional: set `DB_SYNC=true`, run `npm run dev` once, set back to `false`.  
5. `npm run seed`  
6. `npm run dev` → open **http://localhost:3000/admin**

**Demo logins** (after seed): `admin@example.com` / `admin123` · `user@example.com` / `user123`

## Environment variables

| Variable | Meaning |
|----------|---------|
| `DATABASE_URL` | Full Postgres URL (e.g. Supabase). If set, `DB_*` are ignored. |
| `DB_NAME`, `DB_USER`, `DB_PASS`, `DB_HOST`, `DB_PORT` | Local Postgres if no URL |
| `DB_SSL` | `true` if your host needs TLS (not needed for localhost) |
| `JWT_SECRET` | Signs API tokens |
| `COOKIE_SECRET` | AdminJS session |
| `DB_SYNC` | `true` = alter tables on startup (dev only) |
| `PORT` | Server port (default 3000) |

## API

| Method | Path | Body / notes |
|--------|------|----------------|
| GET | `/api/health` | `{ ok, db }` — `db` is `up` or `down` (Postgres ping) |
| POST | `/api/login` | `{ "email", "password" }` → `{ token, user }` |

## Git branches (assignment style)

- **`main`** — hand-in version  
- **`dev`** — where you merge features  
- **`feature/models`**, **`feature/auth`**, **`feature/rbac`** — topic branches  

Work on a feature branch → merge into `dev` → merge `dev` into `main` when ready.

## Tech list

Express · AdminJS · Sequelize · PostgreSQL · bcrypt · JWT · dotenv · nodemon (dev)
