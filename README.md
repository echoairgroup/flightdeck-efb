# FlightDeck EFB

FlightDeck is a mobile-friendly, multi-user electronic flight bag for flight simulation. It is designed as a cloud-hosted web application, with an optional Windows companion for Microsoft Flight Simulator 2024 telemetry.

## Current implementation

- Responsive cockpit-style interface with dark and light themes
- Account registration and sign-in using bcrypt password hashes and HTTP-only session cookies
- PostgreSQL storage for user preferences, scratchpad, dispatches, logbook entries, simulator pairing and latest telemetry
- SimBrief latest-OFP import, normalized into readable dispatch data; it does not create a new OFP
- Aviation Weather Center METAR/TAF proxy with server-side caching
- VATSIM public network feed with data returned by the provider
- Airport lookup using provider responses, with optional AirportDB enrichment using the server-only AIRPORTDB_TOKEN
- Calculators, checklists, logbook, notes and integration-status view
- PWA manifest and offline shell. Dynamic API data is deliberately never cached as if it were current
- One-time pairing API for the optional MSFS 2024 companion

## Local development

Requirements: Node.js 20 or later and a PostgreSQL database.

1. Copy .env.example to .env and set DATABASE_URL and SESSION_SECRET.
2. Run npm install.
3. Run npm run dev.
4. The Vite UI runs on port 5173 and proxies /api to the Express API at port 10000.
5. Run npm run check to check backend JavaScript syntax and build the frontend.

If DATABASE_URL is omitted, public provider endpoints can still be tested, but registration, cloud persistence and simulator pairing are unavailable.

## Render deployment

The supplied render.yaml describes a Node web service. Before public use, set DATABASE_URL to a persistent PostgreSQL database. Keep SESSION_SECRET generated and private. AIRPORTDB_TOKEN is optional. Never expose database credentials, companion tokens or other provider secrets in frontend environment variables.

After deployment, check /api/health. A responding HTTP server is not enough: the health response must also report database: true before account and cloud features can work.

## Install on a phone

FlightDeck is a Progressive Web App. Serve it over HTTPS, open the deployed website in the phone browser and choose the browser's install/add-to-home-screen action. The responsive interface and bottom navigation are designed for touch. Provider APIs and cloud-synced account data require an internet connection. The offline shell does not pretend cached weather, flight plans or traffic are live.

## MSFS 2024 bridge

See companion/msfs-bridge/README.md. The bridge is a separate Windows desktop process because a hosted browser cannot read a simulator process on a different device. It uses SimConnect from the Microsoft Flight Simulator 2024 SDK, pairs using a short-lived one-time code, and uploads an authenticated telemetry payload to the server.

## Integrations and limitations

- SimBrief: fetches an existing latest OFP by Pilot ID or username. A valid identifier and an available OFP are required.
- Weather: the provider can return no report for some ICAOs, or can be temporarily unavailable.
- Airport data: only fields returned by a configured provider are displayed. AirportDB adds an optional data source.
- VATSIM: the live page reads the public feed, but it does not connect a user to VATSIM.
- Navigraph Charts, NewSky airline-specific sync, X-Plane and other private or licensed integrations remain unimplemented until access, API contract and adapters are configured.
- This is a flight-simulation tool, not certified aviation equipment. Verify critical data against your specific aircraft add-on documentation and applicable network rules.

## Security notes

- User-provided values are parameterized in database queries and validated at the API boundary.
- Passwords are hashed using bcrypt. Session tokens are stored in HTTP-only cookies.
- Companion tokens are shown once, stored hashed in PostgreSQL and required for telemetry upload.
- Use HTTPS for production. Provide a strong SESSION_SECRET and persistent database before opening public registration.
