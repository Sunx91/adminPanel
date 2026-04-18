# Role-Based eCommerce Admin Dashboard

Admin panel for a minimal eCommerce schema using **Node.js**, **Express**, **AdminJS**, **Sequelize**, **PostgreSQL**, **bcrypt**, and **JWT**.

## Prerequisites

- Node.js 18+
- PostgreSQL (local or hosted, e.g. Supabase)

## Setup

1. Create a database:

   ```bash
   createdb ecommerce_admin
   ```

2. Copy environment variables and edit secrets:

   ```bash
   cp .env.example .env
   ```

3. Install dependencies:

   ```bash
   npm install
   ```

4. **First run only** — create tables (set `DB_SYNC=true` in `.env`, start once, then set back to `false` for normal use), or use Sequelize migrations in your own workflow.

5. Seed demo data:

   ```bash
   node seed.js
   ```

6. Start the server:

   ```bash
   npm run dev
   ```

- **App**: [http://localhost:3000](http://localhost:3000) (redirects to AdminJS)
- **Admin UI**: [http://localhost:3000/admin](http://localhost:3000/admin)
- **API login**: `POST /api/login` with JSON `{ "email", "password" }` → `{ token, user }`

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

| Branch           | Purpose                          |
|------------------|----------------------------------|
| `main`           | Production-ready code            |
| `dev`            | Active development               |
| `feature/models` | Database models                  |
| `feature/auth`   | JWT + AdminJS authentication     |
| `feature/rbac`   | RBAC + dashboards + settings UI |

Initialize locally:

```bash
git init
git checkout -b main
git add .
git commit -m "Initial implementation"
git branch dev
git branch feature/models
git branch feature/auth
git branch feature/rbac
```

Push `main` to a new **public** GitHub repository and merge feature branches via PRs as you complete each milestone.

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
- [ ] Custom Settings page (`pages.configuration`)
- [ ] `.env` gitignored
- [ ] README with setup instructions

## Optional: deploy

Use Railway, Render, or similar: set the same environment variables, use a managed Postgres URL, and run `node seed.js` once against production if you need demo data.
