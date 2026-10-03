import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { initDb, getPool } from "./db.js";
import { getLatestOFP } from "./providers/simbrief.js";
import { getNetworkData, getMetar, getTaf } from "./providers/vatsim.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = Number(process.env.PORT || 10000);

app.use(express.json({ limit: "1mb" }));
app.use(cors({ origin: true, credentials: true }));

app.get("/api/health", async (_req, res) => {
  let db = false;
  try { db = Boolean(getPool()); } catch {}
  res.json({
    ok: true,
    service: "flightdeck-efb",
    version: "2.0.0",
    databaseConfigured: db,
    time: new Date().toISOString()
  });
});

app.get("/api/config", (_req, res) => {
  res.json({
    integrations: {
      simbrief: Boolean(process.env.SIMBRIEF_USER_ID),
      vatsim: true,
      vatsimOAuth: Boolean(process.env.VATSIM_CLIENT_ID && process.env.VATSIM_CLIENT_SECRET),
      navigraph: false,
      newsKy: false,
      msfsBridge: false,
      xplaneBridge: false
    }
  });
});

app.get("/api/simbrief/latest", async (req, res) => {
  try {
    const identifier = req.query.user || process.env.SIMBRIEF_USER_ID;
    if (!identifier) return res.status(400).json({ error: "Pass ?user=SIMBRIEF_ID or configure SIMBRIEF_USER_ID." });
    res.json({ ok: true, ofp: await getLatestOFP(identifier) });
  } catch (error) {
    res.status(502).json({ error: error.message });
  }
});

app.get("/api/weather/metar/:icao", async (req, res) => {
  try { res.json({ ok: true, data: await getMetar(req.params.icao) }); }
  catch (error) { res.status(502).json({ error: error.message }); }
});

app.get("/api/weather/taf/:icao", async (req, res) => {
  try { res.json({ ok: true, data: await getTaf(req.params.icao) }); }
  catch (error) { res.status(502).json({ error: error.message }); }
});

app.get("/api/vatsim/data", async (_req, res) => {
  try {
    const data = await getNetworkData();
    res.json({
      ok: true,
      updated: data.update_timestamp,
      connected: data.general?.connected_clients || 0,
      pilots: data.pilots || [],
      controllers: data.controllers || [],
      atis: data.atis || []
    });
  } catch (error) {
    res.status(502).json({ error: error.message });
  }
});

app.get("/api/profile", async (_req, res) => {
  res.json({ ok: true, user: { id: "demo", displayName: "Pilot", mode: "guest" } });
});

app.post("/api/tools/flight-log", async (req, res) => {
  const body = req.body || {};
  const db = getPool();
  if (!db) return res.json({ ok: true, saved: false, mode: "memory", flight: body });
  try {
    const user = await db.query(
      `INSERT INTO users (external_id, display_name) VALUES ($1,$2)
       ON CONFLICT (external_id) DO UPDATE SET updated_at=NOW()
       RETURNING id`,
      ["demo", "Pilot"]
    );
    const userId = user.rows[0].id;
    const r = await db.query(
      `INSERT INTO flight_logs (user_id,callsign,origin,destination,aircraft,block_time_min,distance_nm,rating,notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [userId, body.callsign || "", body.origin || "", body.destination || "", body.aircraft || "",
       Number(body.blockTimeMin || 0), Number(body.distanceNm || 0), body.rating ?? null, body.notes || ""]
    );
    res.json({ ok: true, saved: true, flight: r.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const clientDist = path.resolve(__dirname, "../client/dist");
app.use(express.static(clientDist));
app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api/")) return next();
  res.sendFile(path.join(clientDist, "index.html"));
});

app.listen(PORT, async () => {
  try { await initDb(); } catch (e) { console.error("DB init failed:", e.message); }
  console.log(`FlightDeck EFB listening on ${PORT}`);
});
