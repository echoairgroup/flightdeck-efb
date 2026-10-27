# FlyTech — Flight Simulation Workspace

FlyTech is a responsive, multi-user flight-simulation workspace with a clean light-first interface and separate shareable pages for flight planning, weather, airports, live network traffic, logbook, checklists, aviation news, virtual airlines, community events and simulator setup.

It is designed for simulation use. It is not certified navigation equipment and it does not replace aircraft add-on documentation, official weather sources or network rules.

## Product areas

- **Flight planning:** import an existing SimBrief operational flight plan, review route details and save dispatch records to your account.
- **Aviation weather:** request METAR and TAF reports from the Aviation Weather Center where reports are available.
- **Airport desk:** query airport data and optionally enrich responses using a server-side AirportDB token.
- **Live network:** read the public VATSIM data feed. This is a public-information view, not a VATSIM network connection.
- **Pilot tools:** aircraft-aware checklists, calculators, scratchpad and a personal logbook.
- **Aviation news:** current aviation and flight-simulation headlines are retrieved from public Google News RSS searches, cached briefly and linked to their original feed destinations.
- **Virtual airlines:** browse public airlines, inspect listed fleet/routes/crew, join an airline, or create a new one with a signed-in account.
- **Community events:** publish group flights or training sessions, RSVP and manage events you organised.
- **Pilot academy:** guided paths linking to the relevant FlyTech tools.
- **MSFS 2024 companion:** a separate Windows application reads supported simulator values with Microsoft SimConnect and posts account-scoped telemetry over HTTPS.
- **Installable web app:** the responsive interface can be installed from a supported mobile browser. Offline caching is limited to the app shell and static assets; live API data is not presented as current while offline.

The app uses real provider responses where available and labels integrations that need additional configuration. It does not fabricate live telemetry, airline records, news stories, charts or weather reports.

## Accounts and data

Account passwords are stored as bcrypt hashes. Browser sessions use HTTP-only cookies over HTTPS. PostgreSQL stores account profiles, preferences, dispatch records, logbook entries, scratchpad data, simulator pairing records, virtual-airline records and community events.

A persistent PostgreSQL database is required for account registration, cloud sync, airlines, events and simulator pairing. If the database is not connected, the health endpoint reports `database: false`.

## Welcome emails (optional)

Welcome emails are sent through [Resend](https://resend.com) only when both server-side environment variables are configured:

- `RESEND_API_KEY`: a private Resend API key.
- `EMAIL_FROM`: a sender identity on a domain verified with Resend, for example `FlyTech <welcome@your-domain.example>` after replacing the example domain with one you control.

Set these values in Render's **Environment** page for the FlyTech web service, or in your local `.env` file during development. Never put the key in frontend code, Vite variables, GitHub, screenshots or a public issue. Keep the key private and configure a real verified sender before expecting delivery. With no email provider configured, account creation still works but the server reports that welcome-email delivery is not configured. A failed email delivery is logged by the server and does not undo account creation.

The welcome email is not an email-verification flow, and password recovery is not implemented in this version. Do not describe an email address as verified unless a separate verification flow is added.

## Local development

Requirements: Node.js 20 or later and PostgreSQL.

1. Copy `.env.example` to `.env`.
2. Set `DATABASE_URL` and a long random `SESSION_SECRET`.
3. Run `npm install`.
4. Run `npm run dev`.
5. The Vite UI runs on port 5173 and proxies `/api` to the Express API on port 10000.
6. Run `npm run check` to check the backend syntax and create a production frontend build.

Optional environment variables:

- `AIRPORTDB_TOKEN` — enrich airport details.
- `RESEND_API_KEY` and `EMAIL_FROM` — enable welcome emails.

## Deploy on Render

The repository's `render.yaml` describes a Node **Web Service**. Keep the existing Render service and database when deploying an upgrade. Verify the service's repository, branch, build/start commands and environment in Render before making changes.

Expected build command: `npm install && npm run check`

Expected start command: `npm start`

Expected health-check path: `/api/health`

Set `DATABASE_URL` to the persistent PostgreSQL database intended for this app, `SESSION_SECRET` to a private random secret, and `NODE_ENV=production`. Add `RESEND_API_KEY` and `EMAIL_FROM` only when welcome emails should be enabled. Do not reuse another project's database URL or secrets.

After deployment, open `/api/health`. It should return `ok: true`, `service: "flightdeck-efb"`, and `database: true`. A responding web server alone does not confirm that database-backed features are ready.

## GitHub Pages frontend

A static frontend deployment is available through `.github/workflows/pages.yml`. It builds only `client/dist` and publishes it to the repository's GitHub Pages site. The Express API, PostgreSQL database, account endpoints and email delivery still need a server host; GitHub Pages cannot run the Node server.

### Enable the Pages workflow

1. In the repository, open **Settings → Pages** and choose **GitHub Actions** as the build/deployment source if it is not already selected.
2. Open **Settings → Secrets and variables → Actions → Variables** and create a repository variable named `VITE_API_BASE_URL`.
3. Set that variable to the public base URL of the existing FlyTech backend on Render, without a trailing slash and without `/api`. Use the URL shown on the Render service's Overview page — do not use a database URL or a secret.
4. The workflow publishes `https://echoairgroup.github.io/flightdeck-efb/` whenever the `refresh/flytech-product-experience` branch is updated. Check the **Actions** tab for the deployment result and the Pages environment URL.

The URL is a public frontend setting, not a secret. The build uses the hash router so direct page links work on GitHub Pages' project subpath (for example, `/#/news` and `/#/simulator-setup`). The site also uses the `/flightdeck-efb/` asset base path for scripts, icons, the web manifest and the service worker.

### Connect the frontend to the API

The client sends API calls to `VITE_API_BASE_URL + /api`. The Express server in `server/index.js` allows credentialed browser requests from `https://echoairgroup.github.io` and supports additional exact origins via `FRONTEND_ORIGIN` or comma-separated `FRONTEND_ORIGINS`. The server-side CORS changes in this branch must also be deployed to the existing Render service before the Pages frontend can use its account and data endpoints.

**Important browser limitation:** GitHub Pages and the default Render hostname are different sites. Login currently relies on an HTTP-only cookie, so cross-site sign-in can be affected by browsers that block third-party cookies. The API sets a secure cross-site cookie for the Pages frontend, but that does not override browser privacy settings. For reliable production account sessions across modern browsers, use a custom domain setup that makes the frontend and API same-site, or keep the full-stack app served from Render.

If `VITE_API_BASE_URL` is empty, the static frontend can still render, but server-backed areas show a setup message instead of silently calling the wrong `/api` endpoint. Do not place database credentials, `SESSION_SECRET`, Resend keys or other private tokens in GitHub Actions variables exposed to Vite.

## MSFS 2024 pairing

See [the Windows companion guide](companion/msfs-bridge/README.md) for SDK requirements and the build steps.

In brief:

1. Sign in to FlyTech in the browser and open **MSFS 2024 setup**.
2. Generate a one-time pairing code. It expires after five minutes and can be used once.
3. On the simulator PC, install the MSFS 2024 SDK from Developer Mode and build the companion in Visual Studio as Release x64, referencing the managed SimConnect assembly installed with your SDK.
4. Run the companion on the same Windows PC as MSFS 2024. Enter the public HTTPS FlyTech URL and the code.
5. Load into a flight and verify that telemetry arrives in the web app.

The companion has not been compiled against every local SDK revision in this environment. Use the SDK files installed on your computer; do not copy private SDK assemblies into this repository. Treat companion tokens like passwords and revoke a device if its token is exposed.

## Integrations and limits

- **SimBrief:** imports an existing OFP by Pilot ID or username; it does not generate a flight plan.
- **Aviation Weather:** depends on the upstream service and report availability.
- **VATSIM:** reads public feed data but does not sign pilots into the network.
- **AirportDB:** optional provider enrichment requiring a server-side token.
- **NewSky, Navigraph Charts and X-Plane telemetry:** require additional provider access and/or adapters. The interface must not imply those are fully connected until that work is implemented and verified.
- **News feeds:** external services may be unavailable, delayed or editorially biased; always open the source publisher for context.

## Security and operational notes

- Keep database credentials, session secrets, Resend keys and companion tokens out of source control and client bundles.
- The API uses parameterized SQL for user-submitted records and validates write requests.
- The companion token is shown once and stored hashed in PostgreSQL.
- Use HTTPS in production and a persistent database before offering public account registration.
- Verify route, weather, performance and procedure information with the appropriate official source and the aircraft add-on you are using.
