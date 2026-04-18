# Pre-publish checklist

- [ ] `DATABASE_URL` (or `DB_*`) set on the hosting provider
- [ ] `JWT_SECRET` and `COOKIE_SECRET` are long, random, and different (≥32 chars each in production)
- [ ] `NODE_ENV=production`, `TRUST_PROXY=true`, and `SESSION_COOKIE_SECURE=true` where HTTPS is used
- [ ] Never run `npm run seed` against production without `ALLOW_SEED_IN_PRODUCTION=true`
- [ ] Push `main` (and optionally `dev`) to GitHub; open repository visibility as **Public** if required for submission
