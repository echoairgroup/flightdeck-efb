# FlightDeck EFB

A multi-user, server-hosted electronic flight bag for flight simulation.

## Production

Deploy the repository root as a Render Web Service. Build command: npm install && npm run build. Start command: npm start. Add DATABASE_URL and SESSION_SECRET in Render. The service binds to 0.0.0.0 and exposes /api/health.

## Integrations

SimBrief provides dispatch/OFP retrieval. VATSIM provides public live network data and weather. Other integrations are adapter targets so provider credentials stay server-side.

## Simulator telemetry

A hosted browser cannot directly read a simulator process running on a user's PC. Live MSFS/X-Plane telemetry therefore requires an optional local companion bridge. The EFB itself remains cloud-hosted.

This is a flight-simulation tool, not certified aviation equipment. Verify critical data against aircraft/add-on documentation and applicable network rules.