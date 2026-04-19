# eCommerce Admin (AdminJS + Sequelize + PostgreSQL)

**admin panel** for a small e-commerce backend: **Express** API, **Sequelize** models on **PostgreSQL**, **AdminJS** UI, **bcrypt** passwords, and **JWT** for JSON API access.

**Requirements:** Node.js **18+**, a running **PostgreSQL** database (local or hosted, e.g. Supabase).

## Features

- **Models:** User, Category, Product, Order, OrderItem, Setting (`models/`)
- **AdminJS** at **`/admin`** — browser login (email + password), session cookie; role-based resources (`admin/resources.js`)
- **Custom AdminJS UI:** dashboard with stats (admins) or profile + recent orders (users); **Site configuration** page for key/value settings (admins only) (`admin/`)
- **REST API:** login (JWT), optional profile route, health check
- **OpenAPI 3** spec and **Swagger UI** at **`/api/docs`** (`docs/openapi.yaml`)

## Project layout

```text
app.js                 # Express app, DB connect, AdminJS + API + Swagger
config/database.js     # Sequelize; DATABASE_URL or DB_*; SSL for Supabase hosts
docs/openapi.yaml      # OpenAPI 3 specification (source for Swagger UI)
models/                # Sequelize models + associations (index.js)
routes/
  auth.js              # POST /api/login, GET /api/me (JWT)
  health.js            # GET /api/health
middleware/
  requestLogger.js     # Logs method, URL, status, duration
  requireJwt.js        # Bearer JWT guard (used on /api/me)
services/authService.js
admin/                 # AdminJS setup, resources, RBAC, dashboard & settings pages
seed.js                # Demo data (uses sync { force: true } — resets tables)
```

## Quick start

1. **Database** — Install PostgreSQL locally, or create a project on [Supabase](https://supabase.com/) and copy the connection string from **Project Settings → Database**.

2. **Environment** — Copy the example file and edit values:

   ```bash
   cp .env.example .env
   ```

   Set at least **`JWT_SECRET`**, **`COOKIE_SECRET`**, and either **`DATABASE_URL`** or the **`DB_*`** variables. For Supabase, prefer the URI from the dashboard; if the password contains **`@`**, URL-encode it as **`%40`**. Session/transaction **pooler** URIs often work better than a raw direct host if you see connection timeouts.

3. **Install and run**

   ```bash
   npm install
   ```

   First time only — create tables (then turn this off for normal work):

   - Set **`DB_SYNC=true`** in `.env`, run **`npm run dev`** or **`npm start`** once, then set **`DB_SYNC=false`**.

4. **Demo data** (optional — **wipes existing data** in the synced tables):

   ```bash
   npm run seed
   ```

5. **Run the server**

   ```bash
   npm run dev    # nodemon — auto-restart on file changes
   # or
   npm start      # plain node
   ```

   - **Admin UI:** [http://localhost:3000/admin](http://localhost:3000/admin) (or `PORT` from `.env`)
   - **API docs:** [http://localhost:3000/api/docs](http://localhost:3000/api/docs)
   - Root **`/`** redirects to **`/admin`**

After **`npm run seed`**, demo accounts:

| Email               | Password  | Role  |
|---------------------|-----------|-------|
| `admin@example.com` | `admin123` | admin |
| `user@example.com`  | `user123`  | user  |

## npm scripts

| Script            | Command           | Purpose                          |
|-------------------|-------------------|----------------------------------|
| `npm start`       | `node app.js`     | Production-style run             |
| `npm run dev`     | `nodemon app.js`  | Development with restarts      |
| `npm run seed`    | `node seed.js`    | Reset DB schema + insert demo rows |
| `npm run build:admin` | `adminjs bundle` | AdminJS asset bundle (if needed) |

## Environment variables

| Variable          | Required | Description |
|-------------------|----------|-------------|
| `JWT_SECRET`      | Yes      | Secret used to sign JWT access tokens |
| `COOKIE_SECRET`   | Yes      | Secret for AdminJS / express-session cookie encryption |
| `DATABASE_URL`    | One of…  | Full Postgres connection URI (Supabase, etc.). When set, separate `DB_*` fields are not used by `config/database.js`. |
| `DB_NAME`         | …or this set | Database name (local Postgres) |
| `DB_USER`         |          | Database user                    |
| `DB_PASS`         |          | Database password                |
| `DB_HOST`         |          | Host (default `localhost`)       |
| `DB_PORT`         |          | Port (default `5432`)            |
| `DB_SSL`          | No       | Set `true` if you need TLS without a Supabase-style URL |
| `JWT_EXPIRES_IN`  | No       | JWT lifetime (default `8h`)    |
| `DB_SYNC`         | No       | `true` = run `sequelize.sync({ alter: true })` on startup (dev only) |
| `PORT`            | No       | HTTP port (default `3000`)       |

SSL to Postgres is enabled automatically when **`DATABASE_URL`** or **`DB_HOST`** matches Supabase (`supabase.co` / `pooler.supabase.com`) or when **`DB_SSL=true`**.

## HTTP API

Base URL: **`http://localhost:<PORT>/api`**

| Method | Path            | Auth | Description |
|--------|-----------------|------|-------------|
| `GET`  | `/api/health`   | No   | Pings PostgreSQL via Sequelize. **200** if DB is up; **503** if not. |
| `POST` | `/api/login`    | No   | JSON body `{ "email", "password" }`. **200** + JWT on success; **400** validation; **401** bad credentials; **500** server error. |
| `GET`  | `/api/me`       | Yes  | Header `Authorization: Bearer <token>`. Returns current user from DB. |

### Example: login

```bash
curl -s -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}'
```

Success shape (simplified): `{ "success": true, "data": { "token", "tokenType": "Bearer", "expiresIn", "user": { "id", "email", "role" } } }`.

### Example: health

**200** response:

```json
{
  "status": "ok",
  "uptime": 12.34,
  "timestamp": "2026-04-19T12:00:00.000Z",
  "database": "connected"
}
```

**503** when the database cannot be reached: `status` is `error`, `database` is `disconnected`, plus an `error` message string.

### OpenAPI

Machine-readable spec: **`docs/openapi.yaml`**. Interactive docs: **`GET /api/docs`** (Swagger UI).

## Roles (AdminJS)

- **`admin`** — Full resources, user management, settings resource, custom dashboard aggregates, **Site configuration** page.
- **`user`** — No Users or Settings resources; orders scoped to that user; limited dashboard (`admin/resources.js`, `admin/setup.js`).

## Git workflow

Use a simple branch flow if your course requires it, for example:

- **`main`** — stable hand-in version  
- **`dev`** — integration branch  
- **`feature/*`** — one branch per feature (models, auth, RBAC, etc.)

Merge feature → `dev` → `main` when ready.

## Dependencies (high level)

Express, AdminJS (`adminjs`, `@adminjs/express`, `@adminjs/sequelize`), Sequelize, `pg`, bcrypt, jsonwebtoken, dotenv, express-session, express-formidable, **swagger-ui-express**, **yaml** (parse OpenAPI for Swagger UI), nodemon (dev).
