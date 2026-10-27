import express from "express";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import cookieParser from "cookie-parser";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import rateLimit from "express-rate-limit";
import { initDb, query, pool } from "./db.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const app = express();
const PORT = Number(process.env.PORT || 10000);
const production = process.env.NODE_ENV === "production";
const SECRET = process.env.SESSION_SECRET || (production ? "" : "local-development-only-change-me");
if (production && !SECRET) throw new Error("SESSION_SECRET must be configured in production.");

app.disable("x-powered-by");
app.set("trust proxy", 1);
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  next();
});
app.use(express.json({ limit: "1mb", strict: true }));
app.use(cookieParser());
app.use(rateLimit({ windowMs: 60000, limit: 240, standardHeaders: "draft-8", legacyHeaders: false }));

const loginLimiter = rateLimit({ windowMs: 15 * 60000, limit: 20, standardHeaders: "draft-8", legacyHeaders: false, message: { error: "Too many sign-in attempts. Try again in 15 minutes." } });
const registerLimiter = rateLimit({ windowMs: 60 * 60000, limit: 10, standardHeaders: "draft-8", legacyHeaders: false, message: { error: "Too many account creation attempts. Try again later." } });
const pairingLimiter = rateLimit({ windowMs: 10 * 60000, limit: 8, standardHeaders: "draft-8", legacyHeaders: false, message: { error: "Too many pairing attempts. Try again in a few minutes." } });
const auth = (req, res, next) => {
  try {
    const token = req.cookies.fd_session;
    if (!token) return res.status(401).json({ error: "Sign in to use this feature." });
    req.user = jwt.verify(token, SECRET, { issuer: "flightdeck-efb" });
    return next();
  } catch {
    return res.status(401).json({ error: "Your session has expired. Sign in again." });
  }
};
const sessionToken = user => jwt.sign({ id: user.id, username: user.username }, SECRET, { expiresIn: "30d", issuer: "flightdeck-efb" });
const cookieOptions = { httpOnly: true, secure: production, sameSite: "lax", path: "/", maxAge: 30 * 24 * 60 * 60 * 1000 };
const hashSecret = value => crypto.createHash("sha256").update(String(value)).digest("hex");
const cleanString = (value, max = 300) => typeof value === "string" ? value.trim().slice(0, max) : "";
const validIcao = value => /^[A-Z0-9]{4}$/.test(String(value || "").toUpperCase());
const numericOrNull = value => value === null || value === undefined || value === "" || !Number.isFinite(Number(value)) ? null : Number(value);
const publicUser = user => ({ id: user.id, username: user.username, email: user.email || null, display_name: user.display_name || user.username, created_at: user.created_at });

const providerCache = new Map();
async function cached(key, ttl, loader) {
  const current = providerCache.get(key);
  const now = Date.now();
  if (current?.promise) return current.promise;
  if (current && current.expiresAt > now && current.value !== undefined) return current.value;
  const promise = loader().then(value => {
    providerCache.set(key, { value, expiresAt: Date.now() + ttl });
    return value;
  }).catch(error => {
    providerCache.delete(key);
    throw error;
  });
  providerCache.set(key, { promise, expiresAt: now + ttl });
  return promise;
}
async function providerJson(url, key, ttl = 0) {
  const load = async () => {
    const response = await fetch(url, { headers: { Accept: "application/json", "User-Agent": "FlightDeck-EFB/2.1" }, signal: AbortSignal.timeout(10000) });
    const body = await response.text();
    if (!response.ok) {
      const error = new Error("Provider returned HTTP " + response.status + ".");
      error.status = response.status;
      throw error;
    }
    if (!body) return null;
    try { return JSON.parse(body); }
    catch {
      const error = new Error("The provider returned an unreadable response.");
      error.status = 502;
      throw error;
    }
  };
  return ttl > 0 ? cached(key, ttl, load) : load();
}
function firstValue(...values) {
  for (const value of values) if (value !== null && value !== undefined && String(value).trim() !== "") return value;
  return null;
}
function coordinate(value, min, max) {
  const number = Number(value);
  return Number.isFinite(number) && number >= min && number <= max ? number : null;
}
function durationMinutes(value) {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const raw = String(value).trim();
  if (/^\d+(\.\d+)?$/.test(raw)) return Number(raw);
  const parts = raw.split(":").map(Number);
  if (parts.length === 2 && parts.every(Number.isFinite)) return parts[0] * 60 + parts[1];
  if (parts.length === 3 && parts.every(Number.isFinite)) return parts[0] * 60 + parts[1] + parts[2] / 60;
  return null;
}
function normalizeSimBrief(payload, identifier) {
  const data = payload?.ofp || payload || {};
  const general = data.general || {};
  const org = data.origin || {};
  const dest = data.destination || {};
  const ac = data.aircraft || {};
  const times = data.times || {};
  const fuel = data.fuel || {};
  const navlog = data.navlog || {};
  const departure = {
    icao: String(firstValue(org.icao_code, org.icao, "")).toUpperCase(),
    name: String(firstValue(org.name, org.airport_name, "")),
    lat: coordinate(firstValue(org.pos_lat, org.lat), -90, 90),
    lon: coordinate(firstValue(org.pos_long, org.lon, org.lng), -180, 180)
  };
  const destination = {
    icao: String(firstValue(dest.icao_code, dest.icao, "")).toUpperCase(),
    name: String(firstValue(dest.name, dest.airport_name, "")),
    lat: coordinate(firstValue(dest.pos_lat, dest.lat), -90, 90),
    lon: coordinate(firstValue(dest.pos_long, dest.lon, dest.lng), -180, 180)
  };
  const ete = firstValue(general.air_time, times.est_time_enroute, general.est_time_enroute, times.sched_time_enroute);
  const flightNumber = [general.icao_airline, general.flight_number].filter(Boolean).join("").trim();
  const date = firstValue(general.date, times.date, null);
  return {
    source: "SimBrief",
    simbriefId: String(identifier),
    flightNumber: flightNumber || String(firstValue(general.callsign, general.flight, "")),
    departure,
    destination,
    aircraft: { icao: String(firstValue(ac.icaocode, ac.icao_code, ac.icao, general.aircraft_icao, "")).toUpperCase(), name: String(firstValue(ac.name, ac.type, "")) },
    date: /^\d{4}-\d{2}-\d{2}$/.test(String(date || "")) ? String(date) : null,
    etd: firstValue(times.sched_out, times.est_out, general.sched_out, null),
    ete: ete === null ? null : String(ete),
    eteMinutes: durationMinutes(ete),
    distanceNm: numericOrNull(firstValue(general.distance, general.gc_distance, general.route_distance, null)),
    cruiseAltitude: firstValue(general.cruise_altitude, general.initial_altitude, null),
    blockFuel: numericOrNull(firstValue(fuel.plan_ramp, fuel.plan_block, fuel.block, fuel.plan_takeoff, null)),
    route: String(firstValue(general.route, general.route_text, "")),
    waypoints: Array.isArray(navlog.fix) ? navlog.fix.slice(0, 400).map(item => ({
      ident: String(firstValue(item.ident, item.name, "")),
      lat: coordinate(firstValue(item.pos_lat, item.lat), -90, 90),
      lon: coordinate(firstValue(item.pos_long, item.lon, item.lng), -180, 180),
      altitude: numericOrNull(firstValue(item.altitude_feet, item.altitude, null)),
      distanceNm: numericOrNull(firstValue(item.distance, item.leg_distance, null))
    })) : [],
    simbriefUrl: "https://www.simbrief.com/system/dispatch.php",
    rawData: data
  };
}
function normalizeWeather(value, kind) {
  const row = Array.isArray(value) ? value[0] : value;
  if (!row) return null;
  return {
    raw: row.rawOb || row.rawTAF || row.raw_text || row.raw || row.metar || row.taf || "",
    observationTime: row.obsTime || row.observation_time || row.issueTime || row.validTimeFrom || null,
    wind: row.wdir !== undefined ? String(row.wdir) + "° / " + String(row.wspd ?? "—") + " kt" : null,
    visibility: row.visib !== undefined ? String(row.visib) : null,
    temperature: row.temp !== undefined ? row.temp : null,
    altimeter: row.altim !== undefined ? String(row.altim) : row.altim_hg !== undefined ? String(row.altim_hg) : null,
    reportType: kind,
    rawData: row
  };
}

app.get("/api/health", async (req, res) => {
  let database = false;
  if (pool) {
    try { await query("SELECT 1"); database = true; } catch {}
  }
  res.json({ ok: true, service: "flightdeck-efb", version: "2.1.0", database, environment: production ? "production" : "development" });
});

app.get("/api/auth/me", async (req, res) => {
  try {
    const token = req.cookies.fd_session;
    if (!token) return res.json({ user: null });
    const session = jwt.verify(token, SECRET, { issuer: "flightdeck-efb" });
    const result = await query("SELECT id,username,email,display_name,created_at FROM users WHERE id=$1", [session.id]);
    return res.json({ user: result.rows[0] ? publicUser(result.rows[0]) : null });
  } catch {
    return res.json({ user: null });
  }
});

app.post("/api/auth/register", registerLimiter, async (req, res) => {
  if (!pool) return res.status(503).json({ error: "Cloud database is not configured. Add DATABASE_URL to the hosting environment before creating accounts." });
  const username = cleanString(req.body?.username, 24).toLowerCase();
  const email = cleanString(req.body?.email, 254).toLowerCase() || null;
  const displayName = cleanString(req.body?.display_name || username, 60) || username;
  const password = typeof req.body?.password === "string" ? req.body.password : "";
  if (!/^[a-z0-9_.-]{3,24}$/.test(username)) return res.status(400).json({ error: "Username must be 3–24 characters and use letters, numbers, dots, underscores or hyphens." });
  if (password.length < 8 || password.length > 128) return res.status(400).json({ error: "Password must contain between 8 and 128 characters." });
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: "Enter a valid email address or leave it empty." });
  try {
    const hash = await bcrypt.hash(password, 12);
    const result = await query("INSERT INTO users(username,email,display_name,password_hash) VALUES($1,$2,$3,$4) RETURNING id,username,email,display_name,created_at", [username, email, displayName, hash]);
    res.cookie("fd_session", sessionToken(result.rows[0]), cookieOptions);
    res.status(201).json({ user: publicUser(result.rows[0]) });
  } catch (error) {
    if (error.code === "23505") return res.status(409).json({ error: "That username or email is already in use." });
    console.error("Registration failed:", error.message);
    res.status(503).json({ error: "Could not create the account. Check the database connection and try again." });
  }
});

app.post("/api/auth/login", loginLimiter, async (req, res) => {
  if (!pool) return res.status(503).json({ error: "Cloud database is not configured." });
  const username = cleanString(req.body?.username, 254).toLowerCase();
  const password = typeof req.body?.password === "string" ? req.body.password : "";
  if (!username || !password) return res.status(400).json({ error: "Enter your username and password." });
  try {
    const result = await query("SELECT id,username,email,display_name,password_hash,created_at FROM users WHERE username=$1 OR lower(COALESCE(email,''))=$1 LIMIT 1", [username]);
    const user = result.rows[0];
    if (!user || !(await bcrypt.compare(password, user.password_hash))) return res.status(401).json({ error: "Username or password is incorrect." });
    res.cookie("fd_session", sessionToken(user), cookieOptions);
    res.json({ user: publicUser(user) });
  } catch (error) {
    console.error("Sign-in failed:", error.message);
    res.status(503).json({ error: "The account service is temporarily unavailable." });
  }
});
app.post("/api/auth/logout", (req, res) => {
  res.clearCookie("fd_session", { httpOnly: true, secure: production, sameSite: "lax", path: "/" });
  res.json({ ok: true });
});

app.get("/api/preferences", auth, async (req, res) => {
  const result = await query("SELECT preferences FROM users WHERE id=$1", [req.user.id]);
  res.json({ preferences: result.rows[0]?.preferences || {} });
});
app.put("/api/preferences", auth, async (req, res) => {
  const allowed = {};
  if (typeof req.body?.aircraft === "string" && /^[A-Z0-9]{3,5}$/.test(req.body.aircraft.toUpperCase())) allowed.aircraft = req.body.aircraft.toUpperCase();
  if (req.body?.checklists && typeof req.body.checklists === "object" && !Array.isArray(req.body.checklists)) {
    const safe = {};
    for (const [phase, entries] of Object.entries(req.body.checklists).slice(0, 20)) {
      if (!entries || typeof entries !== "object" || Array.isArray(entries)) continue;
      const normalized = {};
      for (const [index, value] of Object.entries(entries).slice(0, 100)) {
        if (/^\d{1,3}$/.test(index) && typeof value === "boolean") normalized[index] = value;
      }
      safe[cleanString(phase, 60)] = normalized;
    }
    allowed.checklists = safe;
  }
  const result = await query("UPDATE users SET preferences=COALESCE(preferences,'{}'::jsonb) || $2::jsonb WHERE id=$1 RETURNING preferences", [req.user.id, JSON.stringify(allowed)]);
  res.json({ preferences: result.rows[0]?.preferences || {} });
});
app.get("/api/scratchpad", auth, async (req, res) => {
  const result = await query("SELECT scratchpad FROM users WHERE id=$1", [req.user.id]);
  res.json({ scratchpad: result.rows[0]?.scratchpad || "" });
});
app.put("/api/scratchpad", auth, async (req, res) => {
  if (typeof req.body?.scratchpad !== "string") return res.status(400).json({ error: "Scratchpad text must be a string." });
  if (req.body.scratchpad.length > 50000) return res.status(413).json({ error: "Scratchpad is limited to 50,000 characters." });
  await query("UPDATE users SET scratchpad=$2 WHERE id=$1", [req.user.id, req.body.scratchpad]);
  res.json({ ok: true, length: req.body.scratchpad.length });
});

app.get("/api/flight-plans", auth, async (req, res) => {
  const result = await query("SELECT * FROM flight_plans WHERE user_id=$1 ORDER BY created_at DESC LIMIT 100", [req.user.id]);
  res.json({ plans: result.rows });
});
app.post("/api/flight-plans", auth, async (req, res) => {
  const body = req.body || {};
  const dep = body.dep ? String(body.dep).toUpperCase() : null;
  const arr = body.arr ? String(body.arr).toUpperCase() : null;
  if (dep && !validIcao(dep)) return res.status(400).json({ error: "Departure airport must be a four-character ICAO code." });
  if (arr && !validIcao(arr)) return res.status(400).json({ error: "Arrival airport must be a four-character ICAO code." });
  const raw = body.raw_data && typeof body.raw_data === "object" && !Array.isArray(body.raw_data) ? body.raw_data : {};
  const result = await query(
    "INSERT INTO flight_plans (user_id,title,source,simbrief_id,flight_number,dep,arr,aircraft,flight_date,etd,ete,distance_nm,cruise_altitude,fuel,route,raw_data) " +
    "VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16::jsonb) RETURNING *",
    [req.user.id, cleanString(body.title, 160) || [body.flight_number, dep, arr].filter(Boolean).join(" "),
      cleanString(body.source, 40) || "SimBrief", cleanString(body.simbrief_id, 80) || null, cleanString(body.flight_number, 40) || null,
      dep, arr, cleanString(body.aircraft, 24) || null, /^\d{4}-\d{2}-\d{2}$/.test(String(body.flight_date || "")) ? body.flight_date : null,
      cleanString(body.etd, 40) || null, Math.max(0, Math.min(100000, Math.round(Number(body.ete)))) || null,
      numericOrNull(body.distance_nm), cleanString(String(body.cruise_altitude || ""), 40) || null,
      body.fuel === null || body.fuel === undefined ? null : cleanString(String(body.fuel), 50),
      cleanString(body.route, 20000) || null, JSON.stringify(raw)]
  );
  res.status(201).json({ plan: result.rows[0] });
});
app.delete("/api/flight-plans/:id", auth, async (req, res) => {
  if (!/^\d+$/.test(req.params.id)) return res.status(400).json({ error: "Invalid flight plan ID." });
  const result = await query("DELETE FROM flight_plans WHERE id=$1 AND user_id=$2 RETURNING id", [req.params.id, req.user.id]);
  if (!result.rowCount) return res.status(404).json({ error: "Flight plan not found." });
  res.json({ ok: true, id: result.rows[0].id });
});

app.get("/api/logbook", auth, async (req, res) => {
  const result = await query("SELECT * FROM flights WHERE user_id=$1 ORDER BY created_at DESC LIMIT 500", [req.user.id]);
  res.json({ flights: result.rows });
});
app.post("/api/logbook", auth, async (req, res) => {
  const body = req.body || {};
  const dep = body.dep ? String(body.dep).trim().toUpperCase() : null;
  const arr = body.arr ? String(body.arr).trim().toUpperCase() : null;
  if (dep && !validIcao(dep)) return res.status(400).json({ error: "Departure must be a valid four-character ICAO code." });
  if (arr && !validIcao(arr)) return res.status(400).json({ error: "Arrival must be a valid four-character ICAO code." });
  const duration = body.duration === "" || body.duration === null || body.duration === undefined ? null : String(body.duration).slice(0, 20);
  const flightDate = /^\d{4}-\d{2}-\d{2}$/.test(String(body.flight_date || "")) ? body.flight_date : null;
  const source = body.source === "simulator" ? "simulator" : "manual";
  const result = await query(
    "INSERT INTO flights(user_id,flight,dep,arr,aircraft,duration,notes,flight_date,distance_nm,source,simbrief_id) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *",
    [req.user.id, cleanString(body.flight, 60) || null, dep, arr, cleanString(body.aircraft, 40) || null, duration,
      cleanString(body.notes, 5000) || null, flightDate, numericOrNull(body.distance_nm), source, cleanString(body.simbrief_id, 80) || null]
  );
  res.status(201).json({ flight: result.rows[0] });
});

app.get("/api/integrations/simbrief", async (req, res) => {
  const identifier = cleanString(req.query.identifier, 100);
  const kind = req.query.kind === "username" ? "username" : "userid";
  if (!identifier) return res.status(400).json({ error: "Enter a SimBrief Pilot ID or username." });
  if (!/^[a-zA-Z0-9_. -]{1,100}$/.test(identifier)) return res.status(400).json({ error: "The SimBrief identifier contains unsupported characters." });
  try {
    const plan = await cached("simbrief:" + kind + ":" + identifier.toLowerCase(), 15000, async () => {
      const url = new URL("https://www.simbrief.com/api/xml.fetcher.php");
      url.searchParams.set(kind, identifier);
      url.searchParams.set("json", "1");
      const response = await fetch(url, { headers: { Accept: "application/json", "User-Agent": "FlightDeck-EFB/2.1" }, signal: AbortSignal.timeout(12000) });
      const text = await response.text();
      if (!response.ok) {
        const error = new Error(response.status === 400 ? "SimBrief did not return an OFP for that identifier. Check the Pilot ID/username and make sure a plan exists." : "SimBrief returned HTTP " + response.status + ".");
        error.status = response.status === 400 ? 404 : 502;
        throw error;
      }
      let payload;
      try { payload = JSON.parse(text); } catch {
        const error = new Error("SimBrief returned a response that could not be read as JSON.");
        error.status = 502;
        throw error;
      }
      const normalized = normalizeSimBrief(payload, identifier);
      if (!normalized.departure.icao || !normalized.destination.icao) {
        const error = new Error("SimBrief returned a response without departure or destination airport codes. Check the OFP in SimBrief.");
        error.status = 502;
        throw error;
      }
      return normalized;
    });
    res.json({ plan });
  } catch (error) {
    if ((error.status || 502) >= 500) console.warn("SimBrief request failed:", error.message);
    res.status(error.status || 502).json({ error: error.message || "SimBrief is unavailable right now." });
  }
});

app.get("/api/weather/:icao", async (req, res) => {
  const icao = String(req.params.icao || "").toUpperCase();
  if (!validIcao(icao)) return res.status(400).json({ error: "Enter a valid four-character ICAO code." });
  const base = "https://aviationweather.gov/api/data/";
  try {
    const results = await Promise.allSettled([
      providerJson(base + "metar?ids=" + encodeURIComponent(icao) + "&format=json", "metar:" + icao, 60000),
      providerJson(base + "taf?ids=" + encodeURIComponent(icao) + "&format=json", "taf:" + icao, 600000)
    ]);
    const metar = results[0].status === "fulfilled" ? normalizeWeather(results[0].value, "METAR") : null;
    const taf = results[1].status === "fulfilled" ? normalizeWeather(results[1].value, "TAF") : null;
    if (results[0].status === "rejected" && results[1].status === "rejected") throw new Error("Aviation weather provider unavailable.");
    res.json({
      icao, source: "Aviation Weather Center", fetchedAt: new Date().toISOString(), metar, taf,
      warnings: [
        ...(results[0].status === "rejected" ? ["METAR request failed: " + results[0].reason.message] : []),
        ...(results[1].status === "rejected" ? ["TAF request failed: " + results[1].reason.message] : [])
      ]
    });
  } catch (error) {
    console.warn("Aviation weather lookup failed:", error.message);
    res.status(502).json({ error: "Aviation weather could not be retrieved right now. Try again later." });
  }
});

app.get("/api/airports/:icao", async (req, res) => {
  const icao = String(req.params.icao || "").toUpperCase();
  if (!validIcao(icao)) return res.status(400).json({ error: "Enter a valid four-character ICAO code." });
  try {
    const errors = [];
    let core = null;
    let enriched = null;
    const coreRequest = providerJson("https://aviationweather.gov/api/data/airport?ids=" + encodeURIComponent(icao) + "&format=json", "airport:" + icao, 86400000)
      .then(value => { core = Array.isArray(value) ? value.find(row => String(row.icaoId || row.icao || row.id || "").toUpperCase() === icao) || value[0] : value; })
      .catch(error => errors.push(error.message));
    const enrichedRequest = process.env.AIRPORTDB_TOKEN
      ? providerJson("https://airportdb.io/api/v1/airport/" + encodeURIComponent(icao) + "?apiToken=" + encodeURIComponent(process.env.AIRPORTDB_TOKEN), "airportdb:" + icao, 86400000)
          .then(value => { enriched = value; })
          .catch(error => errors.push(error.message))
      : Promise.resolve();
    await Promise.all([coreRequest, enrichedRequest]);
    if (!core && !enriched) return res.status(404).json({ error: "No airport record could be retrieved for " + icao + (errors.length ? ". " + errors.join(" ") : ".") });
    const airport = {
      icao,
      name: String(firstValue(enriched?.name, core?.name, core?.site, core?.arptName, "")),
      country: String(firstValue(enriched?.country, core?.country, core?.state, "")),
      municipality: String(firstValue(enriched?.municipality, enriched?.city, core?.city, "")),
      iata: String(firstValue(enriched?.iata, enriched?.iata_code, core?.iata, "")),
      lat: numericOrNull(firstValue(enriched?.latitude, core?.lat, core?.latitude)),
      lon: numericOrNull(firstValue(enriched?.longitude, core?.lon, core?.longitude)),
      elevation: numericOrNull(firstValue(enriched?.elevation, core?.elev, core?.elevation)),
      runways: Array.isArray(enriched?.runways) ? enriched.runways : [],
      frequencies: Array.isArray(enriched?.freqs) ? enriched.freqs : Array.isArray(enriched?.frequencies) ? enriched.frequencies : [],
      source: [core ? "Aviation Weather Center" : null, enriched ? "AirportDB" : null].filter(Boolean).join(" + "),
      enrichmentConfigured: Boolean(enriched),
      updatedAt: new Date().toISOString()
    };
    res.json({ airport, source: airport.source });
  } catch (error) {
    console.warn("Airport lookup failed:", error.message);
    res.status(502).json({ error: "Airport data provider is temporarily unavailable. Try again later." });
  }
});

app.get("/api/network/vatsim", async (req, res) => {
  try {
    const data = await providerJson("https://data.vatsim.net/v3/vatsim-data.json", "vatsim:network", 12000);
    if (!data || !Array.isArray(data.pilots)) throw new Error("The VATSIM feed did not include a pilots list.");
    res.json({
      source: "VATSIM public data feed", fetchedAt: new Date().toISOString(),
      update_timestamp: data.general?.update_timestamp || data.general?.update_time || null,
      pilots: data.pilots, controllers: Array.isArray(data.controllers) ? data.controllers : [],
      servers: Array.isArray(data.servers) ? data.servers : [], prefiles: Array.isArray(data.prefiles) ? data.prefiles : []
    });
  } catch (error) {
    console.warn("VATSIM data lookup failed:", error.message);
    res.status(502).json({ error: "The public VATSIM feed is temporarily unavailable. Refresh in a little while." });
  }
});

app.get("/api/integrations/status", (req, res) => {
  res.json({
    generatedAt: new Date().toISOString(),
    integrations: [
      { name: "SimBrief", status: "available", label: "AVAILABLE", description: "Imports the latest OFP by Pilot ID or username through SimBrief's public fetch endpoint.", detail: "FlightDeck does not generate a new SimBrief OFP.", url: "https://beta.docs.navigraph.com/simbrief/fetching-ofp-data" },
      { name: "Aviation Weather", status: "available", label: "PUBLIC API", description: "Fetches METAR observations and TAF forecasts when the provider has a current record.", detail: "Subject to upstream availability and rate limits.", url: "https://aviationweather.gov/data/api/" },
      { name: "VATSIM", status: "available", label: "PUBLIC FEED", description: "Loads the public network data feed with actual pilots and controllers.", detail: "This does not connect a user to the VATSIM network.", url: "https://data.vatsim.net/" },
      { name: "Airport data", status: process.env.AIRPORTDB_TOKEN ? "configured" : "needs-setup", label: process.env.AIRPORTDB_TOKEN ? "ENRICHMENT ENABLED" : "BASIC LOOKUP", description: "Airport data is fetched from provider responses; AirportDB may add runway and frequency detail.", detail: process.env.AIRPORTDB_TOKEN ? "Server-side AirportDB token detected." : "Add AIRPORTDB_TOKEN to the server environment for enriched airport data.", url: "https://airportdb.io/" },
      { name: "MSFS 2024", status: "needs-setup", label: "LOCAL COMPANION", description: "The Windows companion reads simulator variables through Microsoft's SimConnect SDK and uploads account-scoped telemetry.", detail: "Not connected until you build, run and pair the companion on the simulator PC.", url: "https://docs.flightsimulator.com/msfs2024/retail/programming-apis/simconnect/simconnect-sdk/" },
      { name: "Navigraph Charts", status: "needs-setup", label: "ACCESS REQUIRED", description: "Licensed aeronautical charts are not embedded in this release.", detail: "Provider access and user entitlement are required; no chart data is fabricated.", url: "https://developers.navigraph.com/docs/request-access" },
      { name: "NewSky", status: process.env.NEWSKY_API_TOKEN ? "configured" : "needs-setup", label: process.env.NEWSKY_API_TOKEN ? "TOKEN DETECTED" : "NOT CONNECTED", description: "Airline synchronisation can use a valid server-side NewSky token.", detail: process.env.NEWSKY_API_TOKEN ? "Token detected; airline-specific synchronisation is not implemented yet." : "No NewSky token configured.", url: "https://newsky.app/apidocs/" },
      { name: "X-Plane", status: "planned", label: "NOT IMPLEMENTED", description: "A separate local telemetry adapter is needed before X-Plane data can be read.", detail: "This release does not claim live X-Plane telemetry." }
    ]
  });
});

app.post("/api/bridge/pairing", auth, pairingLimiter, async (req, res) => {
  if (!pool) return res.status(503).json({ error: "Cloud database is required to create a secure companion pairing." });
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const code = Array.from({ length: 8 }, () => alphabet[crypto.randomInt(0, alphabet.length)]).join("");
  try {
    await query("UPDATE bridge_pairings SET used_at=NOW() WHERE user_id=$1 AND used_at IS NULL", [req.user.id]);
    const row = await query("INSERT INTO bridge_pairings(user_id,code_hash,expires_at) VALUES($1,$2,NOW() + INTERVAL '5 minutes') RETURNING expires_at", [req.user.id, hashSecret(code)]);
    res.status(201).json({ code, expiresAt: row.rows[0].expires_at, expiresInSeconds: 300 });
  } catch (error) {
    console.error("Pairing code creation failed:", error.message);
    res.status(503).json({ error: "Could not create a pairing code. Check database availability and try again." });
  }
});

app.post("/api/bridge/connect", pairingLimiter, async (req, res) => {
  if (!pool) return res.status(503).json({ error: "Cloud database is not configured." });
  const code = cleanString(req.body?.code, 12).toUpperCase();
  const name = cleanString(req.body?.name, 80) || "FlightDeck MSFS Companion";
  if (!/^[A-HJ-NP-Z2-9]{8}$/.test(code)) return res.status(400).json({ error: "Enter the eight-character pairing code shown in FlightDeck settings." });
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const pairing = await client.query("SELECT id,user_id FROM bridge_pairings WHERE code_hash=$1 AND used_at IS NULL AND expires_at>NOW() FOR UPDATE", [hashSecret(code)]);
    if (!pairing.rows[0]) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "This pairing code is invalid, expired or already used. Generate a new code." });
    }
    const token = crypto.randomBytes(32).toString("hex");
    const device = await client.query("INSERT INTO bridge_devices(user_id,token_hash,name,last_seen_at) VALUES($1,$2,$3,NOW()) RETURNING id", [pairing.rows[0].user_id, hashSecret(token), name]);
    await client.query("UPDATE bridge_pairings SET used_at=NOW() WHERE id=$1", [pairing.rows[0].id]);
    await client.query("COMMIT");
    res.status(201).json({ token, deviceId: device.rows[0].id, message: "Companion paired. Keep its token private." });
  } catch (error) {
    try { await client.query("ROLLBACK"); } catch {}
    console.error("Companion pairing failed:", error.message);
    res.status(503).json({ error: "Could not pair the companion. Try again." });
  } finally { client.release(); }
});

const bridgeAuth = async (req, res, next) => {
  const match = String(req.get("authorization") || "").match(/^Bearer ([a-fA-F0-9]{64})$/);
  if (!match) return res.status(401).json({ error: "A valid companion bearer token is required." });
  try {
    const result = await query("SELECT id,user_id FROM bridge_devices WHERE token_hash=$1 AND revoked_at IS NULL LIMIT 1", [hashSecret(match[1])]);
    if (!result.rows[0]) return res.status(401).json({ error: "Companion token is invalid or revoked." });
    req.bridgeDevice = result.rows[0];
    return next();
  } catch {
    return res.status(503).json({ error: "Cloud database is unavailable." });
  }
};
app.post("/api/bridge/telemetry", bridgeAuth, async (req, res) => {
  const body = req.body || {};
  const payload = {};
  for (const field of ["latitude","longitude","altitudeFt","iasKt","groundSpeedKt","headingDeg","verticalSpeedFpm","pitchDeg","bankDeg"]) {
    const value = numericOrNull(body[field]);
    if (value !== null) payload[field] = value;
  }
  if (payload.latitude === undefined || payload.longitude === undefined) return res.status(400).json({ error: "Latitude and longitude are required from SimConnect." });
  if (payload.latitude < -90 || payload.latitude > 90 || payload.longitude < -180 || payload.longitude > 180) return res.status(400).json({ error: "Telemetry coordinates are outside valid ranges." });
  payload.title = cleanString(body.title, 120) || null;
  payload.onGround = typeof body.onGround === "boolean" ? body.onGround : null;
  payload.simTime = cleanString(body.simTime, 80) || null;
  payload.source = "Microsoft Flight Simulator / SimConnect";
  const result = await query(
    "INSERT INTO telemetry_snapshots(user_id,device_id,payload,updated_at) VALUES($1,$2,$3::jsonb,NOW()) " +
    "ON CONFLICT(user_id) DO UPDATE SET device_id=EXCLUDED.device_id,payload=EXCLUDED.payload,updated_at=NOW() RETURNING updated_at",
    [req.bridgeDevice.user_id, req.bridgeDevice.id, JSON.stringify(payload)]
  );
  await query("UPDATE bridge_devices SET last_seen_at=NOW() WHERE id=$1", [req.bridgeDevice.id]);
  res.json({ ok: true, updatedAt: result.rows[0].updated_at });
});
app.get("/api/telemetry/latest", auth, async (req, res) => {
  const result = await query(
    "SELECT s.payload,s.updated_at,d.name,d.last_seen_at FROM telemetry_snapshots s LEFT JOIN bridge_devices d ON d.id=s.device_id WHERE s.user_id=$1 LIMIT 1",
    [req.user.id]
  );
  const row = result.rows[0];
  if (!row) return res.json({ connected: false, data: null, lastSeenAt: null, deviceName: null, updatedAt: null });
  const ageSeconds = Math.max(0, (Date.now() - new Date(row.updated_at).getTime()) / 1000);
  res.setHeader("Cache-Control", "no-store");
  res.json({ connected: ageSeconds <= 30, data: ageSeconds <= 30 ? row.payload : null, lastSeenAt: row.last_seen_at, updatedAt: row.updated_at, ageSeconds: Math.round(ageSeconds), deviceName: row.name || null });
});
app.post("/api/bridge/revoke", auth, async (req, res) => {
  const id = cleanString(String(req.body?.deviceId || ""), 30);
  if (!/^\d+$/.test(id)) return res.status(400).json({ error: "Invalid companion device ID." });
  await query("UPDATE bridge_devices SET revoked_at=NOW() WHERE id=$1 AND user_id=$2 AND revoked_at IS NULL", [id, req.user.id]);
  res.json({ ok: true });
});

app.use("/api", (req, res) => res.status(404).json({ error: "This API endpoint does not exist." }));
app.use(express.static(path.join(root, "client", "dist"), { maxAge: production ? "1h" : 0, etag: true }));
app.get("/{*splat}", (req, res) => res.sendFile(path.join(root, "client", "dist", "index.html")));
app.use((error, req, res, next) => {
  console.error("Unhandled request error:", error?.message || error);
  if (res.headersSent) return next(error);
  const status = Number(error?.status) >= 400 && Number(error?.status) < 600 ? Number(error.status) : 500;
  res.status(status).json({ error: status === 500 ? "An unexpected server error occurred." : error.message });
});

initDb().then(databaseReady => {
  if (!databaseReady) console.warn("FlightDeck started without cloud storage. Account/sync features require DATABASE_URL.");
  app.listen(PORT, "0.0.0.0", () => console.log("FlightDeck EFB listening on 0.0.0.0:" + PORT));
}).catch(error => {
  console.error("Database initialization failed:", error);
  process.exit(1);
});
