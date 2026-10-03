# Deployment checklist

## Render

Use one Render Web Service so `/` and `/api/*` are served by the same process.

### Environment variables

Required for the full hosted stack:
- `NODE_ENV=production`
- `DATABASE_URL=<PostgreSQL connection string>`
- `SESSION_SECRET=<long random value>`

Optional:
- `SIMBRIEF_USER_ID=<your SimBrief user ID>`
- `VATSIM_CLIENT_ID=<OAuth client id>`
- `VATSIM_CLIENT_SECRET=<OAuth client secret>`
- `VATSIM_REDIRECT_URI=https://YOUR-RENDER-DOMAIN/api/auth/vatsim/callback`

### Database

Neon is fine. Copy the pooled connection string into `DATABASE_URL`.

The server creates its tables automatically on startup.

## What you need to provide

1. A GitHub repository for the code.
2. A Render Web Service connected to that repository.
3. A PostgreSQL database.
4. Your SimBrief user ID if you want automatic OFP loading.
5. VATSIM OAuth credentials only if you want VATSIM account login.

## What does not need a key

The VATSIM public live network feed and public METAR service can be queried by the server without a user API key.

## What needs a separate agreement / credential

Chart providers, navigation databases, simulator telemetry bridges and private virtual-airline APIs depend on the provider and their access rules. The application deliberately exposes adapters instead of scraping or pretending access exists.
