import React, { useEffect, useRef, useState } from "react";
import { Activity, AlertCircle, ArrowRight, ArrowDownRight, Check, CheckCircle2, Database, Download, FileText, LockKeyhole, MapPin, Plane, Plus, RefreshCw, Save, Search, ShieldCheck, Trash2, Upload, UserRound } from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const AIRPORTS = [
  { icao: "LIRF", name: "Rome Fiumicino", lat: 41.8045, lon: 12.2508, elevation: 13 },
  { icao: "EGLL", name: "London Heathrow", lat: 51.4700, lon: -0.4543, elevation: 83 },
  { icao: "EHAM", name: "Amsterdam Schiphol", lat: 52.3086, lon: 4.7639, elevation: -11 },
  { icao: "EDDL", name: "Dusseldorf", lat: 51.2895, lon: 6.7668, elevation: 147 },
  { icao: "EDDF", name: "Frankfurt", lat: 50.0379, lon: 8.5622, elevation: 364 },
  { icao: "LFPG", name: "Paris Charles de Gaulle", lat: 49.0097, lon: 2.5479, elevation: 392 },
  { icao: "LEMD", name: "Madrid Barajas", lat: 40.4983, lon: -3.5676, elevation: 1998 },
  { icao: "LEBL", name: "Barcelona", lat: 41.2974, lon: 2.0833, elevation: 12 },
  { icao: "LGAV", name: "Athens", lat: 37.9364, lon: 23.9445, elevation: 308 },
  { icao: "LGTS", name: "Thessaloniki", lat: 40.5197, lon: 22.9709, elevation: 22 },
  { icao: "LOWW", name: "Vienna", lat: 48.1103, lon: 16.5697, elevation: 600 },
  { icao: "LSZH", name: "Zurich", lat: 47.4581, lon: 8.5555, elevation: 1416 },
  { icao: "EDDM", name: "Munich", lat: 48.3538, lon: 11.7861, elevation: 1487 },
  { icao: "EKCH", name: "Copenhagen", lat: 55.6180, lon: 12.6560, elevation: 17 },
  { icao: "EIDW", name: "Dublin", lat: 53.4213, lon: -6.2701, elevation: 242 },
  { icao: "KJFK", name: "New York JFK", lat: 40.6413, lon: -73.7781, elevation: 13 },
  { icao: "KLAX", name: "Los Angeles", lat: 33.9416, lon: -118.4085, elevation: 128 },
  { icao: "KORD", name: "Chicago O'Hare", lat: 41.9742, lon: -87.9073, elevation: 672 },
  { icao: "KSEA", name: "Seattle Tacoma", lat: 47.4502, lon: -122.3088, elevation: 433 },
  { icao: "KDEN", name: "Denver", lat: 39.8561, lon: -104.6737, elevation: 5431 },
  { icao: "KATL", name: "Atlanta", lat: 33.6407, lon: -84.4277, elevation: 1026 },
  { icao: "KSFO", name: "San Francisco", lat: 37.6213, lon: -122.3790, elevation: 13 },
  { icao: "CYYZ", name: "Toronto Pearson", lat: 43.6777, lon: -79.6248, elevation: 569 },
  { icao: "CYVR", name: "Vancouver", lat: 49.1967, lon: -123.1815, elevation: 14 },
  { icao: "OMDB", name: "Dubai", lat: 25.2532, lon: 55.3657, elevation: 62 },
  { icao: "RJTT", name: "Tokyo Haneda", lat: 35.5494, lon: 139.7798, elevation: 35 },
  { icao: "VHHH", name: "Hong Kong", lat: 22.3080, lon: 113.9185, elevation: 28 },
  { icao: "YSSY", name: "Sydney", lat: -33.9399, lon: 151.1753, elevation: 21 },
  { icao: "FACT", name: "Cape Town", lat: -33.9715, lon: 18.6021, elevation: 151 },
  { icao: "SBGR", name: "Sao Paulo Guarulhos", lat: -23.4356, lon: -46.4731, elevation: 2459 },
  { icao: "NZAA", name: "Auckland", lat: -37.0082, lon: 174.7917, elevation: 23 },
  { icao: "TNCM", name: "Princess Juliana", lat: 18.0409, lon: -63.1089, elevation: 14 },
  { icao: "CYYC", name: "Calgary", lat: 51.1215, lon: -114.0076, elevation: 3557 },
  { icao: "KPDX", name: "Portland", lat: 45.5898, lon: -122.5951, elevation: 31 },
  { icao: "KPHX", name: "Phoenix Sky Harbor", lat: 33.4342, lon: -112.0116, elevation: 1135 },
  { icao: "KBOS", name: "Boston Logan", lat: 42.3656, lon: -71.0096, elevation: 20 },
  { icao: "KMIA", name: "Miami", lat: 25.7959, lon: -80.2870, elevation: 8 },
  { icao: "CYUL", name: "Montreal Trudeau", lat: 45.4706, lon: -73.7408, elevation: 118 }
];

const seed = code => AIRPORTS.find(item => item.icao === String(code || "").trim().toUpperCase()) || null;
const hasCoordinates = point => Boolean(point && point.lat !== "" && point.lat !== null && point.lat !== undefined && point.lon !== "" && point.lon !== null && point.lon !== undefined && Number.isFinite(Number(point.lat)) && Number.isFinite(Number(point.lon)) && Number(point.lat) >= -90 && Number(point.lat) <= 90 && Number(point.lon) >= -180 && Number(point.lon) <= 180);
const storedPlanner = () => { try { return JSON.parse(localStorage.getItem("fd-msfs-planner-v1") || "{}"); } catch { return {}; } };

function distanceNm(a, b) {
  if (!hasCoordinates(a) || !hasCoordinates(b)) return 0;
  const rad = Math.PI / 180, lat1 = Number(a.lat) * rad, lat2 = Number(b.lat) * rad;
  const dLat = (Number(b.lat) - Number(a.lat)) * rad, dLon = (Number(b.lon) - Number(a.lon)) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 3440.065 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(Math.max(0, 1 - h)));
}

function dms(value, latitude) {
  const n = Number(value), hemi = latitude ? (n < 0 ? "S" : "N") : (n < 0 ? "W" : "E"), absolute = Math.abs(n);
  let degrees = Math.floor(absolute), minuteFloat = (absolute - degrees) * 60, minutes = Math.floor(minuteFloat), seconds = Number(((minuteFloat - minutes) * 60).toFixed(2));
  if (seconds >= 60) { seconds = 0; minutes += 1; }
  if (minutes >= 60) { minutes = 0; degrees += 1; }
  return hemi + degrees + "° " + String(minutes).padStart(2, "0") + "' " + seconds.toFixed(2) + '"';
}
function worldPosition(point, altitude) {
  const elevation = Number.isFinite(Number(altitude)) ? Math.round(Number(altitude)) : 0;
  return dms(point.lat, true) + ", " + dms(point.lon, false) + "," + (elevation < 0 ? "-" : "+") + String(Math.abs(elevation)).padStart(6, "0") + ".00";
}
function xmlEscape(value) {
  return String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}
function parseWorldPosition(value) {
  const matches = [...String(value || "").matchAll(/([NSEW])\s*(\d+)\s*°\s*(\d+)\s*'\s*([\d.]+)\s*"/gi)];
  const lat = matches.find(match => ["N", "S"].includes(match[1].toUpperCase()));
  const lon = matches.find(match => ["E", "W"].includes(match[1].toUpperCase()));
  if (!lat || !lon) return null;
  const parse = match => {
    const decimal = Number(match[2]) + Number(match[3]) / 60 + Number(match[4]) / 3600;
    return ["S", "W"].includes(match[1].toUpperCase()) ? -decimal : decimal;
  };
  return { lat: parse(lat), lon: parse(lon) };
}
function createPln(plan) {
  const origin = plan.origin, destination = plan.destination;
  if (!hasCoordinates(origin) || !hasCoordinates(destination)) throw new Error("Load coordinate data for departure and destination before exporting.");
  const departure = String(origin.icao || "").toUpperCase(), arrival = String(destination.icao || "").toUpperCase();
  if (!/^[A-Z0-9]{4}$/.test(departure) || !/^[A-Z0-9]{4}$/.test(arrival)) throw new Error("Departure and destination need valid four-character ICAO codes.");
  const cruise = Math.max(0, Math.min(60000, Math.round(Number(plan.cruiseAltitude) || 0)));
  const routeWaypoints = (plan.waypoints || []).filter(item => hasCoordinates(item) && String(item.ident || "").trim()).map(item => {
    const ident = String(item.ident || "WPT").trim().replace(/[^A-Za-z0-9_.-]/g, "_").slice(0, 16) || "WPT";
    return '    <ATCWaypoint id="' + xmlEscape(ident) + '"><ATCWaypointType>User</ATCWaypointType><WorldPosition>' + worldPosition(item, item.altitude || 0) + '</WorldPosition></ATCWaypoint>';
  });
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<SimBase.Document>',
    '  <FlightPlan.FlightPlan>',
    '    <DepartureID>' + departure + '</DepartureID>',
    '    <DestinationID>' + arrival + '</DestinationID>',
    '    <Title>' + xmlEscape(departure + " to " + arrival) + '</Title>',
    '    <Descr>' + xmlEscape((plan.route || departure + " DCT " + arrival) + " | Generated by FlyTech") + '</Descr>',
    '    <FPType>' + xmlEscape(plan.routeType || "IFR") + '</FPType>',
    '    <CruisingAlt>' + cruise + '</CruisingAlt>',
    '    <AppVersion><AppVersionMajor>12</AppVersionMajor></AppVersion>',
    ...routeWaypoints,
    '  </FlightPlan.FlightPlan>',
    '</SimBase.Document>',
    ''
  ].join("\n");
}
function PlannerMap({ origin, destination, waypoints, onMapPick }) {
  const host = useRef(null), mapRef = useRef(null), layerRef = useRef(null), pickRef = useRef(onMapPick);
  useEffect(() => { pickRef.current = onMapPick; }, [onMapPick]);
  useEffect(() => {
    if (!host.current) return undefined;
    const map = L.map(host.current, { zoomControl: false, scrollWheelZoom: true }).setView([45, 8], 4);
    L.control.zoom({ position: "bottomright" }).addTo(map);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 18, attribution: "&copy; OpenStreetMap contributors" }).addTo(map);
    map.on("click", event => pickRef.current?.({ lat: Number(event.latlng.lat.toFixed(4)), lon: Number(event.latlng.lng.toFixed(4)) }));
    mapRef.current = map;
    const timer = window.setTimeout(() => map.invalidateSize(), 180);
    return () => { window.clearTimeout(timer); map.remove(); mapRef.current = null; layerRef.current = null; };
  }, []);
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (layerRef.current) layerRef.current.remove();
    const layer = L.layerGroup().addTo(map);
    layerRef.current = layer;
    const points = [];
    if (hasCoordinates(origin)) points.push({ ...origin, kind: "departure", label: (origin.icao || "DEP") + " · departure" });
    (waypoints || []).forEach((item, index) => { if (hasCoordinates(item)) points.push({ ...item, kind: "waypoint", label: (item.ident || "WPT" + (index + 1)) + " · waypoint" }); });
    if (hasCoordinates(destination)) points.push({ ...destination, kind: "arrival", label: (destination.icao || "ARR") + " · arrival" });
    if (points.length > 1) L.polyline(points.map(point => [Number(point.lat), Number(point.lon)]), { color: "#267dc3", weight: 3, opacity: 0.92, dashArray: "8 5" }).addTo(layer);
    points.forEach(point => L.circleMarker([Number(point.lat), Number(point.lon)], {
      radius: point.kind === "waypoint" ? 5 : 7,
      color: point.kind === "departure" ? "#176aa6" : point.kind === "arrival" ? "#328565" : "#9b6b20",
      weight: 2, fillColor: point.kind === "departure" ? "#267dc3" : point.kind === "arrival" ? "#70c79f" : "#f6c96b", fillOpacity: 1
    }).addTo(layer).bindTooltip(point.label, { permanent: true, direction: "top", offset: [0, -5], className: "planner-map-label" }));
    if (points.length > 1) map.fitBounds(L.latLngBounds(points.map(point => [Number(point.lat), Number(point.lon)])), { padding: [42, 42], maxZoom: 5 });
    else if (points.length === 1) map.setView([Number(points[0].lat), Number(points[0].lon)], 5);
  }, [origin, destination, waypoints]);
  return <div className="planner-map-shell"><div className="planner-map" ref={host} /><div className="planner-map-hint"><MapPin size={14} /> Click the map to add a user waypoint</div></div>;
}

function PlannerCard({ title, subtitle, action, children }) {
  return <section className="panel planner-card"><div className="panel-heading"><div><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div>{action && <div className="panel-action">{action}</div>}</div>{children}</section>;
}
function PlannerPill({ children, tone = "muted" }) { return <span className={"pill pill-" + tone}>{children}</span>; }

export default function MSFSPlanner({ user, aircraft, lookupAirport, savePlan, notify }) {
  const [stored] = useState(storedPlanner);
  const [departureCode, setDepartureCode] = useState(stored.departureCode || stored.origin?.icao || "LIRF");
  const [arrivalCode, setArrivalCode] = useState(stored.arrivalCode || stored.destination?.icao || "EGLL");
  const [origin, setOrigin] = useState(() => stored.origin || seed(stored.departureCode || "LIRF"));
  const [destination, setDestination] = useState(() => stored.destination || seed(stored.arrivalCode || "EGLL"));
  const [waypoints, setWaypoints] = useState(() => Array.isArray(stored.waypoints) ? stored.waypoints : []);
  const [routeType, setRouteType] = useState(stored.routeType === "VFR" ? "VFR" : "IFR");
  const [cruiseAltitude, setCruiseAltitude] = useState(String(stored.cruiseAltitude || "35000"));
  const [cruiseSpeed, setCruiseSpeed] = useState(String(stored.cruiseSpeed || "450"));
  const [flightNumber, setFlightNumber] = useState(stored.flightNumber || "");
  const [lookupBusy, setLookupBusy] = useState("");
  const [lookupMessage, setLookupMessage] = useState("");
  const [error, setError] = useState("");
  const [fileBusy, setFileBusy] = useState(false);

  useEffect(() => {
    try { localStorage.setItem("fd-msfs-planner-v1", JSON.stringify({ departureCode, arrivalCode, origin, destination, waypoints, routeType, cruiseAltitude, cruiseSpeed, flightNumber })); } catch {}
  }, [departureCode, arrivalCode, origin, destination, waypoints, routeType, cruiseAltitude, cruiseSpeed, flightNumber]);

  const setEndpoint = (which, airport) => {
    if (which === "origin") { setOrigin(airport); setDepartureCode(airport?.icao || ""); }
    else { setDestination(airport); setArrivalCode(airport?.icao || ""); }
  };
  const lookup = async which => {
    const code = String(which === "origin" ? departureCode : arrivalCode).trim().toUpperCase();
    if (!/^[A-Z0-9]{4}$/.test(code)) { setError("Enter a four-character ICAO code."); return; }
    setError(""); setLookupMessage(""); setLookupBusy(which);
    const fallback = seed(code);
    try {
      const result = await lookupAirport(code), provider = result.airport || {};
      const point = {
        ...(fallback || {}), ...provider, icao: code,
        name: provider.name || fallback?.name || code,
        lat: provider.lat !== null && provider.lat !== undefined && Number.isFinite(Number(provider.lat)) ? Number(provider.lat) : fallback?.lat,
        lon: provider.lon !== null && provider.lon !== undefined && Number.isFinite(Number(provider.lon)) ? Number(provider.lon) : fallback?.lon,
        elevation: provider.elevation !== null && provider.elevation !== undefined && Number.isFinite(Number(provider.elevation)) ? Number(provider.elevation) : fallback?.elevation
      };
      if (!hasCoordinates(point)) throw new Error("The provider did not return coordinates for this airport.");
      setEndpoint(which, point);
      setLookupMessage("Loaded " + code + " airport data.");
    } catch (requestError) {
      if (fallback) { setEndpoint(which, fallback); setLookupMessage("Using built-in coordinates for " + code + ". A backend connection enables more airports."); }
      else { if (which === "origin") setOrigin(null); else setDestination(null); setError(requestError.message || ("Could not find " + code + ".")); }
    } finally { setLookupBusy(""); }
  };

  const validWaypoints = waypoints.filter(hasCoordinates);
  const points = [origin, ...validWaypoints, destination].filter(hasCoordinates);
  const distance = points.length > 1 ? points.slice(1).reduce((sum, point, index) => sum + distanceNm(points[index], point), 0) : 0;
  const speed = Math.max(60, Math.min(700, Number(cruiseSpeed) || 450));
  const eteMinutes = distance > 0 ? Math.round(distance / speed * 60) : 0;
  const showDuration = value => value > 0 ? Math.floor(value / 60) + "h " + String(value % 60).padStart(2, "0") + "m" : "—";
  const route = [origin?.icao, ...waypoints.map(item => String(item.ident || "").trim()).filter(Boolean), destination?.icao].filter(Boolean).join(" DCT ");
  const ready = hasCoordinates(origin) && hasCoordinates(destination) && Boolean(origin?.icao && destination?.icao);
  const plan = {
    source: "FlyTech Planner", flightNumber: flightNumber.trim(), departure: origin, destination,
    aircraft: { icao: aircraft?.icao || "A21N", name: aircraft?.name || "Selected aircraft" },
    route, routeType, waypoints: validWaypoints, distanceNm: Math.round(distance), eteMinutes,
    cruiseAltitude: Number(cruiseAltitude) || 0, blockFuel: null
  };
  const addWaypoint = coords => setWaypoints(previous => [...previous, { ident: "WPT" + (previous.length + 1), lat: Number(Number(coords.lat).toFixed(4)), lon: Number(Number(coords.lon).toFixed(4)), altitude: 0 }]);
  const reset = () => {
    setEndpoint("origin", seed("LIRF")); setEndpoint("destination", seed("EGLL")); setWaypoints([]);
    setRouteType("IFR"); setCruiseAltitude("35000"); setCruiseSpeed("450"); setFlightNumber(""); setError(""); setLookupMessage("");
  };
  const exportPlan = () => {
    setError("");
    try {
      const xml = createPln({ ...plan, origin, destination, waypoints: validWaypoints });
      const url = URL.createObjectURL(new Blob([xml], { type: "application/xml;charset=utf-8" }));
      const anchor = document.createElement("a");
      anchor.href = url; anchor.download = (origin.icao + "-" + destination.icao + "-FlyTech.pln").replace(/[^A-Za-z0-9_.-]/g, "_");
      document.body.appendChild(anchor); anchor.click(); anchor.remove(); window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      notify?.("MSFS 2024 .pln file generated. Load it using the simulator's flight-plan import workflow.");
    } catch (exportError) { setError(exportError.message); }
  };
  const importPlan = async event => {
    const file = event.target.files?.[0]; if (!file) return;
    setFileBusy(true); setError("");
    try {
      const doc = new DOMParser().parseFromString(await file.text(), "application/xml");
      if (doc.querySelector("parsererror")) throw new Error("This file is not valid flight-plan XML.");
      const textOf = name => doc.getElementsByTagName(name)[0]?.textContent?.trim() || "";
      const departure = textOf("DepartureID").toUpperCase(), arrival = textOf("DestinationID").toUpperCase();
      if (!/^[A-Z0-9]{4}$/.test(departure) || !/^[A-Z0-9]{4}$/.test(arrival)) throw new Error("The .pln file needs DepartureID and DestinationID airport codes.");
      const departureLla = parseWorldPosition(textOf("DepartureLLA")), arrivalLla = parseWorldPosition(textOf("DestinationLLA"));
      const parsedWaypoints = [...doc.getElementsByTagName("ATCWaypoint")].map(node => {
        const ident = node.getAttribute("id") || "WPT";
        const icaoIdent = node.getElementsByTagName("ICAOIdent")[0]?.textContent?.trim()?.toUpperCase() || ident.toUpperCase();
        const coords = parseWorldPosition(node.getElementsByTagName("WorldPosition")[0]?.textContent || "");
        if (!coords || icaoIdent === departure || icaoIdent === arrival || ident.toUpperCase() === departure || ident.toUpperCase() === arrival) return null;
        return { ident: ident.slice(0, 16), lat: coords.lat, lon: coords.lon, altitude: 0 };
      }).filter(Boolean);
      const resolveImportedAirport = async (code, name, coords) => {
        const known = seed(code);
        let point = { ...(known || {}), icao: code, name: name || known?.name || code, ...(coords || {}) };
        if (!hasCoordinates(point)) {
          try {
            const result = await lookupAirport(code), provider = result.airport || {};
            point = { ...point, ...provider, icao: code, name: provider.name || point.name };
          } catch {}
        }
        return point;
      };
      const [importedOrigin, importedDestination] = await Promise.all([
        resolveImportedAirport(departure, textOf("DepartureName"), departureLla),
        resolveImportedAirport(arrival, textOf("DestinationName"), arrivalLla)
      ]);
      setEndpoint("origin", importedOrigin);
      setEndpoint("destination", importedDestination);
      setWaypoints(parsedWaypoints);
      setRouteType(textOf("FPType").toUpperCase() === "VFR" ? "VFR" : "IFR");
      if (textOf("CruisingAlt")) setCruiseAltitude(String(Math.max(0, Math.min(60000, Number(textOf("CruisingAlt")) || 0))));
      setLookupMessage("Imported " + file.name + ". Review the route before exporting again.");
      notify?.("Flight plan imported.");
    } catch (importError) { setError(importError.message || "Could not import that flight plan."); }
    finally { setFileBusy(false); event.target.value = ""; }
  };
  const copyRoute = async () => {
    try { await navigator.clipboard.writeText(route); notify?.("Route string copied."); }
    catch { notify?.("Could not copy the route string in this browser.", "error"); }
  };
  const saveLocal = () => {
    try {
      localStorage.setItem("fd-msfs-planner-v1", JSON.stringify({ departureCode, arrivalCode, origin, destination, waypoints, routeType, cruiseAltitude, cruiseSpeed, flightNumber }));
      notify?.("Planner draft saved on this device.");
    } catch { notify?.("Could not save the local planner draft.", "error"); }
  };

  if (!user) {
    return <div className="planner-auth-gate">
      <div className="planner-auth-icon"><LockKeyhole size={26} /></div>
      <div className="eyebrow">PILOT ACCOUNT REQUIRED</div>
      <h1>Sign in to use the MSFS Flight Planner</h1>
      <p>Create a FlyTech account or sign in to build routes, edit waypoints, import and export MSFS 2024 flight plans, and save your planning work. No welcome email is sent, and no email address is required for registration.</p>
      <div className="planner-auth-actions"><button type="button" className="button-primary" onClick={() => navigate("settings")}><UserRound size={15} /> Create account or sign in</button></div>
      <div className="planner-auth-footnote"><ShieldCheck size={15} /><span>Planner drafts stay in this browser. Cloud saving requires a signed-in account and connected backend.</span></div>
    </div>;
  }

  return <>
    <div className="section-heading planner-heading"><div><div className="eyebrow">BUILT INTO FLYTECH</div><h1>MSFS Flight Planner</h1><p>Create a route on the map, add user waypoints, estimate distance and export a Microsoft Flight Simulator flight plan.</p></div><button className="button-secondary" type="button" onClick={reset}><RefreshCw size={15} /> Reset</button></div>
    <div className="planner-intro-banner"><div className="planner-intro-icon"><Plane size={24} /></div><div><strong>Your own flight-planning workspace</strong><p>The core planner works on GitHub Pages without a domain or account. A backend connection adds wider airport lookup and cloud saving.</p></div><span className="pill pill-green">MSFS 2024 · .PLN</span></div>
    {error && <div className="notice notice-error"><AlertCircle size={17} /><span>{error}</span></div>}
    {lookupMessage && <div className="notice notice-info"><CheckCircle2 size={16} /><span>{lookupMessage}</span></div>}
    <div className="planner-workspace">
      <div className="planner-main-column">
        <PlannerCard title="Route setup" subtitle="Choose the departure and arrival airports. The built-in list contains popular airports; use Load to request wider data from the FlyTech backend.">
          <div className="planner-airport-grid">
            <div className="planner-airport-field"><label htmlFor="planner-departure-code">Departure airport</label><div className="planner-code-row"><input id="planner-departure-code" value={departureCode} maxLength={4} onChange={event => { const value = event.target.value.toUpperCase(); setDepartureCode(value); if (origin?.icao !== value) setOrigin(null); }} placeholder="ICAO · e.g. LIRF" autoComplete="off" /><button type="button" className="button-secondary" onClick={() => void lookup("origin")} disabled={Boolean(lookupBusy)}><Search size={14} />{lookupBusy === "origin" ? "Loading…" : "Load"}</button></div><small>{origin ? (origin.name || origin.icao) + " · " + Number(origin.lat).toFixed(3) + ", " + Number(origin.lon).toFixed(3) : "Enter an ICAO code and select Load."}</small></div>
            <div className="planner-route-divider"><ArrowDownRight size={19} /></div>
            <div className="planner-airport-field"><label htmlFor="planner-arrival-code">Destination airport</label><div className="planner-code-row"><input id="planner-arrival-code" value={arrivalCode} maxLength={4} onChange={event => { const value = event.target.value.toUpperCase(); setArrivalCode(value); if (destination?.icao !== value) setDestination(null); }} placeholder="ICAO · e.g. EGLL" autoComplete="off" /><button type="button" className="button-secondary" onClick={() => void lookup("destination")} disabled={Boolean(lookupBusy)}><Search size={14} />{lookupBusy === "destination" ? "Loading…" : "Load"}</button></div><small>{destination ? (destination.name || destination.icao) + " · " + Number(destination.lat).toFixed(3) + ", " + Number(destination.lon).toFixed(3) : "Enter an ICAO code and select Load."}</small></div>
          </div>
          <div className="planner-parameters-grid">
            <label className="field"><span>Flight rules</span><select value={routeType} onChange={event => setRouteType(event.target.value)}><option value="IFR">IFR · Instrument</option><option value="VFR">VFR · Visual</option></select></label>
            <label className="field"><span>Cruise altitude (ft)</span><input type="number" min="0" max="60000" step="500" value={cruiseAltitude} onChange={event => setCruiseAltitude(event.target.value)} /></label>
            <label className="field"><span>Average cruise speed (kt)</span><input type="number" min="60" max="700" value={cruiseSpeed} onChange={event => setCruiseSpeed(event.target.value)} /></label>
            <label className="field"><span>Flight number (optional)</span><input value={flightNumber} onChange={event => setFlightNumber(event.target.value)} maxLength={20} placeholder="e.g. FT123" /></label>
          </div>
        </PlannerCard>
        <PlannerCard title="Route map" subtitle="Pan and zoom around the world. Click any location to add a custom waypoint to the route.">
          <PlannerMap origin={origin} destination={destination} waypoints={waypoints} onMapPick={addWaypoint} />
          <div className="planner-map-actions"><button type="button" className="button-secondary" onClick={() => addWaypoint({ lat: 48.8566, lon: 2.3522 })}><Plus size={14} /> Add waypoint near Paris</button><button type="button" className="button-secondary" onClick={() => setWaypoints([])} disabled={!waypoints.length}><Trash2 size={14} /> Clear waypoints</button></div>
        </PlannerCard>
        <PlannerCard title="En-route waypoints" subtitle="Add fixes by clicking the map or typing coordinates. Custom points are exported as MSFS user waypoints.">
          <div className="planner-waypoint-list">
            {waypoints.map((waypoint, index) => <div className="planner-waypoint-row" key={index}>
              <div className="planner-waypoint-index">{String(index + 1).padStart(2, "0")}</div>
              <label><span>Fix name</span><input value={waypoint.ident || ""} maxLength={16} onChange={event => setWaypoints(previous => previous.map((item, i) => i === index ? { ...item, ident: event.target.value } : item))} placeholder={"WPT" + (index + 1)} /></label>
              <label><span>Latitude</span><input type="number" step="0.0001" min="-90" max="90" value={waypoint.lat ?? ""} onChange={event => setWaypoints(previous => previous.map((item, i) => i === index ? { ...item, lat: event.target.value === "" ? "" : Number(event.target.value) } : item))} placeholder="48.8566" /></label>
              <label><span>Longitude</span><input type="number" step="0.0001" min="-180" max="180" value={waypoint.lon ?? ""} onChange={event => setWaypoints(previous => previous.map((item, i) => i === index ? { ...item, lon: event.target.value === "" ? "" : Number(event.target.value) } : item))} placeholder="2.3522" /></label>
              <button type="button" className="icon-button" aria-label={"Remove waypoint " + (waypoint.ident || index + 1)} onClick={() => setWaypoints(previous => previous.filter((_, i) => i !== index))}><Trash2 size={15} /></button>
            </div>)}
            {!waypoints.length && <div className="planner-empty-waypoints"><MapPin size={20} /><strong>No intermediate waypoints</strong><span>Fly direct between airports, or add custom points to shape the route.</span></div>}
          </div>
          <button type="button" className="button-secondary" onClick={() => setWaypoints(previous => [...previous, { ident: "WPT" + (previous.length + 1), lat: "", lon: "", altitude: 0 }])}><Plus size={15} /> Add waypoint manually</button>
        </PlannerCard>
      </div>
      <aside className="planner-side-column">
        <PlannerCard title="Flight summary" subtitle="Planning estimates only." action={<span className={"pill " + (ready ? "pill-green" : "pill-amber")}>{ready ? "ROUTE READY" : "NEEDS AIRPORTS"}</span>}>
          <div className="planner-summary-route"><div><small>FROM</small><strong>{origin?.icao || departureCode || "----"}</strong><span>{origin?.name || "Departure airport"}</span></div><ArrowRight size={20} /><div><small>TO</small><strong>{destination?.icao || arrivalCode || "----"}</strong><span>{destination?.name || "Destination airport"}</span></div></div>
          <div className="planner-summary-metrics"><div><span>Route distance</span><strong>{distance > 0 ? Math.round(distance).toLocaleString("en-GB") + " NM" : "—"}</strong></div><div><span>Estimated en-route</span><strong>{showDuration(eteMinutes)}</strong></div><div><span>Waypoints</span><strong>{validWaypoints.length}</strong></div><div><span>Cruise profile</span><strong>{Number(cruiseAltitude) > 0 ? "FL" + String(Math.round(Number(cruiseAltitude) / 100)).padStart(3, "0") : "—"}</strong></div></div>
          <div className="planner-route-string"><span>ROUTE STRING</span><p>{route || "Choose departure and arrival airports."}</p><button type="button" className="text-action" onClick={copyRoute} disabled={!route}><FileText size={14} /> Copy route string</button></div>
          <div className="planner-primary-actions">
            <button type="button" className="button-primary" onClick={exportPlan} disabled={!ready}><Download size={15} /> Export MSFS .pln</button>
            <label className="button-secondary planner-import-button"><Upload size={15} />{fileBusy ? "Reading file…" : "Import .pln"}<input type="file" accept=".pln,.xml,application/xml,text/xml" onChange={importPlan} disabled={fileBusy} /></label>
            <button type="button" className="button-secondary" onClick={saveLocal}><Save size={15} /> Save on this device</button>
          </div>
          <button type="button" className="button-secondary planner-cloud-save" onClick={() => { if (!ready) { notify?.("Load both airports before saving.", "error"); return; } void savePlan(plan).catch(() => {}); }}><Database size={15} /> Save to cloud library</button>
          <div className="planner-source-note"><ShieldCheck size={15} /><span>Built-in airport coordinates are bundled with the page. Additional airport lookups require the FlyTech backend.</span></div>
        </PlannerCard>
        <PlannerCard title="Aircraft profile" subtitle="No aircraft performance data is assumed."><div className="planner-aircraft"><div className="planner-aircraft-icon"><Plane size={22} /></div><div><strong>{aircraft?.name || "Selected aircraft"}</strong><span>{aircraft?.icao || "Aircraft not selected"}</span><small>Speed is a user-editable estimate and should reflect your planned cruise speed.</small></div></div></PlannerCard>
        <PlannerCard title="Before you fly" subtitle="Important checks"><div className="planner-checklist"><div><Check size={15} /><span>Verify the route and waypoints in the simulator.</span></div><div><Check size={15} /><span>Check current weather, NOTAMs and network rules.</span></div><div><Check size={15} /><span>Confirm fuel, payload and performance using your aircraft add-on.</span></div></div></PlannerCard>
      </aside>
    </div>
    <div className="planner-disclaimer"><ShieldCheck size={16} /><p>FlyTech generates a basic MSFS-compatible .pln route file. It does not calculate clearances, airway validity, SIDs/STARs, approaches, winds aloft or aircraft-specific fuel. Validate the route and procedures in MSFS 2024 and your aircraft add-on.</p></div>
  </>;
}
