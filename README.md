# FlightDeck EFB — Hosted Electronic Flight Bag

A large, server-hosted Electronic Flight Bag for flight simulation.

## What this build contains

- Aircraft-first EFB launcher with searchable aircraft catalogue
- Dashboard / flight center
- SimBrief OFP import
- VATSIM live traffic, controllers and ATIS
- METAR / TAF
- Airport briefing workspace
- Route planner and flight-plan tools
- Fuel, time, distance, wind and crosswind calculators
- TOD / descent planning
- Weight & balance workspace
- Checklists
- Scratchpad
- Flight timer
- Flight log
- Integration manager
- Account/settings shell
- PWA install support
- PostgreSQL-ready persistence
- Server-side secrets
- Single Render web service deployment
- API adapter architecture so more providers can be added without rebuilding the UI

## Important simulator architecture

The EFB itself is hosted in the cloud. Cloud servers cannot directly read a simulator process running on your PC.

Therefore:
- cloud EFB: always available in browser/tablet
- cloud APIs: SimBrief, VATSIM, weather, account data
- optional future simulator bridge: a tiny local connector only when you want live MSFS/X-Plane telemetry

The bridge is NOT required for the hosted EFB, dispatch, weather, planning, checklists, calculators, VATSIM, or flight log.

## Deploy on Render

1. Push this repository to GitHub.
2. Create a Render Web Service from the repository, or use the included `render.yaml`.
3. Render builds the Vite client and starts Express.
4. Add a PostgreSQL database (Neon or Render Postgres).
5. Add the database connection string as `DATABASE_URL`.
6. Add your SimBrief user ID as `SIMBRIEF_USER_ID` if you want a server default.
7. If you add VATSIM login later, create OAuth credentials and add the three VATSIM variables.
8. Open the Render URL. The frontend and API share the same origin.

## Local development (optional)

Node 20+ is recommended.

```bash
npm run install:all
npm run dev
```

This is only for development. Production is intended to run on Render or another Node host.

## Database

The backend automatically creates the core tables when `DATABASE_URL` is present.

Tables:
- users
- user_settings
- saved_flights
- flight_logs
- scratchpads
- checklists

## Integration philosophy

The UI never pretends an unavailable API exists. Providers are represented by adapters and clearly show configuration state.

Current real public integrations:
- SimBrief OFP endpoint
- VATSIM live data
- VATSIM METAR
- VATSIM TAF

Planned adapters:
- VATSIM OAuth
- Navigraph
- NewSky
- IVAO
- MSFS/X-Plane telemetry bridge
- Discord
- Volanta
