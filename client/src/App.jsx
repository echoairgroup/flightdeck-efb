import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Activity, AlertCircle, ArrowDownRight, ArrowRight, BookOpen, Check, CheckCircle2,
  ChevronDown, ChevronRight, CircleDot, Clock3, Cloud, CloudSun, Compass, Database,
  ExternalLink, FileText, Fuel, Gauge, Globe2, LayoutDashboard, LockKeyhole, LogIn,
  LogOut, Map, MapPin, Menu, Moon, Navigation, NotebookPen, Plane, Plug, Plus,
  Radio, RefreshCw, Route, Save, Search, Settings as SettingsIcon, ShieldCheck, Smartphone, Sun, Server,
  Trash2, UserRound, Users, Wifi, Wind, Wrench, X, Zap, ClipboardCheck,
  Building2, CalendarDays, GraduationCap, Mail, Newspaper, ArrowUpRight, CircleHelp
} from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const AIRCRAFT = [
  { icao: "A20N", name: "Airbus A320neo", family: "Airbus A320 family" },
  { icao: "A21N", name: "Airbus A321neo", family: "Airbus A320 family" },
  { icao: "A319", name: "Airbus A319", family: "Airbus A320 family" },
  { icao: "A320", name: "Airbus A320-200", family: "Airbus A320 family" },
  { icao: "A321", name: "Airbus A321-200", family: "Airbus A320 family" },
  { icao: "A332", name: "Airbus A330-200", family: "Airbus widebody" },
  { icao: "A333", name: "Airbus A330-300", family: "Airbus widebody" },
  { icao: "A339", name: "Airbus A330-900neo", family: "Airbus widebody" },
  { icao: "A359", name: "Airbus A350-900", family: "Airbus widebody" },
  { icao: "A35K", name: "Airbus A350-1000", family: "Airbus widebody" },
  { icao: "A388", name: "Airbus A380-800", family: "Airbus widebody" },
  { icao: "B738", name: "Boeing 737-800", family: "Boeing 737 family" },
  { icao: "B38M", name: "Boeing 737 MAX 8", family: "Boeing 737 family" },
  { icao: "B39M", name: "Boeing 737 MAX 9", family: "Boeing 737 family" },
  { icao: "B752", name: "Boeing 757-200", family: "Boeing 757 family" },
  { icao: "B763", name: "Boeing 767-300", family: "Boeing 767 family" },
  { icao: "B772", name: "Boeing 777-200", family: "Boeing 777 family" },
  { icao: "B77W", name: "Boeing 777-300ER", family: "Boeing 777 family" },
  { icao: "B788", name: "Boeing 787-8", family: "Boeing 787 family" },
  { icao: "B789", name: "Boeing 787-9", family: "Boeing 787 family" },
  { icao: "B78X", name: "Boeing 787-10", family: "Boeing 787 family" },
  { icao: "B748", name: "Boeing 747-8", family: "Boeing 747 family" },
  { icao: "E175", name: "Embraer E175", family: "Regional" },
  { icao: "E190", name: "Embraer E190", family: "Regional" },
  { icao: "E195", name: "Embraer E195-E2", family: "Regional" },
  { icao: "CRJ9", name: "Bombardier CRJ-900", family: "Regional" },
  { icao: "AT76", name: "ATR 72-600", family: "Turboprop" },
  { icao: "DH8D", name: "De Havilland Dash 8 Q400", family: "Turboprop" },
  { icao: "C172", name: "Cessna 172 Skyhawk", family: "General aviation" },
  { icao: "C208", name: "Cessna 208 Caravan", family: "General aviation" },
  { icao: "PC12", name: "Pilatus PC-12", family: "General aviation" },
  { icao: "PC24", name: "Pilatus PC-24", family: "Business aviation" },
  { icao: "GLF6", name: "Gulfstream G650", family: "Business aviation" }
];

const NAV = [
  { group: "FLIGHT OPERATIONS", items: [
    { id: "home", label: "Overview", icon: LayoutDashboard },
    { id: "dispatch", label: "Flight planning", icon: Route },
    { id: "airports", label: "Airports", icon: MapPin },
    { id: "weather", label: "Weather", icon: CloudSun },
    { id: "traffic", label: "Live network", icon: Radio }
  ]},
  { group: "PILOT WORKSPACE", items: [
    { id: "checklists", label: "Checklists", icon: ClipboardCheck },
    { id: "logbook", label: "Logbook", icon: BookOpen },
    { id: "tools", label: "Calculators", icon: Gauge },
    { id: "scratch", label: "Scratchpad", icon: NotebookPen },
    { id: "simulator", label: "MSFS 2024 setup", icon: Activity }
  ]},
  { group: "DISCOVER & COMMUNITY", items: [
    { id: "news", label: "Aviation news", icon: Newspaper },
    { id: "airlines", label: "Virtual airlines", icon: Building2 },
    { id: "events", label: "Community events", icon: CalendarDays },
    { id: "learn", label: "Pilot academy", icon: GraduationCap }
  ]},
  { group: "ACCOUNT & SYSTEM", items: [
    { id: "integrations", label: "Connections", icon: Plug },
    { id: "settings", label: "Account & settings", icon: SettingsIcon }
  ]}
];

const PAGE_PATHS = {
  home: "/",
  dispatch: "/flight-planning",
  airports: "/airports",
  weather: "/weather",
  traffic: "/live-network",
  tools: "/calculators",
  checklists: "/checklists",
  logbook: "/logbook",
  scratch: "/scratchpad",
  simulator: "/simulator-setup",
  news: "/news",
  airlines: "/airlines",
  events: "/community",
  learn: "/academy",
  integrations: "/connections",
  settings: "/settings"
};
const pageFromLocation = () => Object.entries(PAGE_PATHS).find(([, path]) => path === window.location.pathname)?.[0] || "home";

const CHECKLISTS = {
  "Pre-flight": ["Route and destination verified", "Weather and NOTAM sources reviewed", "Aircraft and livery selected", "Fuel and payload entered in the aircraft add-on", "Performance figures checked against the add-on", "Flight plan loaded in the FMS", "Required simulator/network rules reviewed"],
  "Before start": ["Parking brake and ground state checked", "Doors, stairs and ground equipment checked", "Fuel quantity checked against the plan", "Beacon and engine-start procedure reviewed", "Pushback clearance obtained where applicable"],
  "Taxi": ["Taxi route reviewed", "Flight controls checked where appropriate", "Taxiway and runway signs followed", "Departure runway confirmed", "Take-off configuration checked using the aircraft checklist"],
  "Departure": ["Departure clearance and SID confirmed", "Initial altitude and constraints set", "Take-off performance checked in the aircraft add-on", "Runway and wind reviewed", "Transponder and lights configured for the phase"],
  "En route": ["Autopilot and navigation mode cross-checked", "Altitude and route constraints monitored", "Fuel remaining compared with plan", "Destination weather and alternate reviewed", "Descent planning started at an appropriate time"],
  "Arrival": ["Arrival and approach charts available in a licensed source", "Approach and minima checked for the simulation", "Landing configuration reviewed", "Landing distance/performance source checked", "Go-around procedure reviewed"],
  "Shutdown": ["Runway vacated and taxi route followed", "Parking position and brake state checked", "Aircraft shutdown according to add-on checklist", "Flight data saved before closing the simulator", "Flight log completed"]
};

const api = async (path, options = {}) => {
  const headers = { Accept: "application/json", ...(options.headers || {}) };
  if (options.body && !headers["Content-Type"]) headers["Content-Type"] = "application/json";
  const response = await fetch("/api" + path, {
    credentials: "include",
    ...options,
    headers
  });
  const bodyText = response.status === 204 ? "" : await response.text();
  let data = {};
  if (bodyText) {
    try { data = JSON.parse(bodyText); } catch { data = { message: bodyText }; }
  }
  if (!response.ok) {
    throw new Error(data.error || data.message || "The request could not be completed.");
  }
  return data;
};

const readStored = (key, fallback) => {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch { return fallback; }
};
const saveStored = (key, value) => {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
};
const formatNumber = (value, digits = 0) => {
  if (value === null || value === undefined || value === "" || !Number.isFinite(Number(value))) return "—";
  return new Intl.NumberFormat("en-GB", { maximumFractionDigits: digits, minimumFractionDigits: digits }).format(Number(value));
};
const formatDate = value => {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};
const titleCase = value => String(value || "").replace(/[_-]/g, " ").replace(/\b\w/g, letter => letter.toUpperCase());
const icaoValid = value => /^[A-Z0-9]{4}$/.test(String(value || "").trim().toUpperCase());
const userInitials = user => String(user?.display_name || user?.username || "P").slice(0, 1).toUpperCase();
const displayDuration = value => {
  if (value === null || value === undefined || value === "") return "—";
  const num = Number(value);
  if (Number.isFinite(num) && num >= 0) return Math.floor(num / 60) + "h " + String(Math.round(num % 60)).padStart(2, "0") + "m";
  return String(value);
};
const normalizedAirport = point => ({
  icao: point?.icao || point?.icao_code || "",
  name: point?.name || "",
  lat: Number(point?.lat ?? point?.pos_lat),
  lon: Number(point?.lon ?? point?.pos_long)
});
const routeEndpoints = plan => {
  const raw = plan?.raw_data || plan?.rawData || plan || {};
  return {
    origin: normalizedAirport(plan?.origin || plan?.departure || raw?.origin || raw?.departure),
    destination: normalizedAirport(plan?.destination || plan?.arrival || raw?.destination || raw?.arrival)
  };
};
const greatCirclePoints = (start, end, count = 72) => {
  if (![start.lat, start.lon, end.lat, end.lon].every(Number.isFinite)) return [];
  const rad = Math.PI / 180;
  const toRad = n => n * rad;
  const toDeg = n => n / rad;
  const a = { lat: toRad(start.lat), lon: toRad(start.lon) };
  const b = { lat: toRad(end.lat), lon: toRad(end.lon) };
  const d = 2 * Math.asin(Math.sqrt(Math.pow(Math.sin((b.lat - a.lat) / 2), 2) + Math.cos(a.lat) * Math.cos(b.lat) * Math.pow(Math.sin((b.lon - a.lon) / 2), 2)));
  if (!Number.isFinite(d) || d === 0) return [[start.lat, start.lon], [end.lat, end.lon]];
  const result = [];
  for (let i = 0; i <= count; i++) {
    const f = i / count;
    const A = Math.sin((1 - f) * d) / Math.sin(d);
    const B = Math.sin(f * d) / Math.sin(d);
    const x = A * Math.cos(a.lat) * Math.cos(a.lon) + B * Math.cos(b.lat) * Math.cos(b.lon);
    const y = A * Math.cos(a.lat) * Math.sin(a.lon) + B * Math.cos(b.lat) * Math.sin(b.lon);
    const z = A * Math.sin(a.lat) + B * Math.sin(b.lat);
    result.push([toDeg(Math.atan2(z, Math.sqrt(x * x + y * y))), toDeg(Math.atan2(y, x))]);
  }
  return result;
};

function IconButton({ icon: Icon, label, onClick, variant = "", disabled = false }) {
  return <button className={"icon-button " + variant} aria-label={label} title={label} onClick={onClick} disabled={disabled}><Icon size={17} strokeWidth={1.8} /></button>;
}
function Pill({ children, tone = "muted" }) { return <span className={"pill pill-" + tone}><span className="pill-dot" />{children}</span>; }
function SectionHeading({ eyebrow, title, subtitle, action }) {
  return <div className="section-heading"><div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1>{subtitle && <p>{subtitle}</p>}</div>{action && <div className="heading-action">{action}</div>}</div>;
}
function Panel({ title, subtitle, action, children, className = "" }) {
  return <section className={"panel " + className}><div className="panel-heading"><div><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div>{action && <div className="panel-action">{action}</div>}</div>{children}</section>;
}
function EmptyState({ icon: Icon = FileText, title, text, action }) {
  return <div className="empty-state"><div className="empty-icon"><Icon size={21} /></div><strong>{title}</strong><p>{text}</p>{action}</div>;
}
function Field({ label, hint, children }) { return <label className="field"><span>{label}</span>{children}{hint && <small>{hint}</small>}</label>; }
function RouteMap({ plan }) {
  const host = useRef(null);
  const endPoints = useMemo(() => routeEndpoints(plan), [plan]);
  useEffect(() => {
    if (!host.current) return undefined;
    const map = L.map(host.current, { zoomControl: false, scrollWheelZoom: false, attributionControl: true }).setView([48, 11], 4);
    L.control.zoom({ position: "bottomright" }).addTo(map);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 18,
      attribution: "&copy; OpenStreetMap contributors"
    }).addTo(map);
    const a = endPoints.origin;
    const b = endPoints.destination;
    if ([a.lat, a.lon, b.lat, b.lon].every(Number.isFinite)) {
      const line = L.polyline(greatCirclePoints(a, b), { color: "#b4d94d", weight: 3, opacity: 0.95, dashArray: "7 5" }).addTo(map);
      L.circleMarker([a.lat, a.lon], { radius: 6, color: "#0f2018", weight: 2, fillColor: "#b4d94d", fillOpacity: 1 }).addTo(map).bindTooltip(a.icao || "Departure");
      L.circleMarker([b.lat, b.lon], { radius: 6, color: "#0f2018", weight: 2, fillColor: "#ffffff", fillOpacity: 1 }).addTo(map).bindTooltip(b.icao || "Arrival");
      map.fitBounds(line.getBounds(), { padding: [34, 34], maxZoom: 6 });
    }
    const resize = () => map.invalidateSize();
    const timer = window.setTimeout(resize, 150);
    return () => { window.clearTimeout(timer); map.remove(); };
  }, [endPoints]);
  const hasRoute = [endPoints.origin.lat, endPoints.origin.lon, endPoints.destination.lat, endPoints.destination.lon].every(Number.isFinite);
  return <div className="route-map-wrap"><div className="route-map" ref={host} />{!hasRoute && <div className="map-empty"><div className="map-empty-mark"><Route size={22} /></div><strong>Your route will appear here</strong><span>Import a SimBrief flight plan to plot the departure and arrival airports.</span></div>}{hasRoute && <div className="map-legend"><span><i className="legend-origin" />{endPoints.origin.icao || "Origin"}</span><ArrowRight size={13} /><span><i className="legend-destination" />{endPoints.destination.icao || "Destination"}</span><small>Great-circle overview · not a navigational chart</small></div>}</div>;
}

function App() {
  const [page, setPage] = useState(() => pageFromLocation());
  const [theme, setTheme] = useState(() => localStorage.getItem("fd-theme-v2") || "light");
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [aircraft, setAircraft] = useState(() => localStorage.getItem("fd-aircraft") || "A21N");
  const [user, setUser] = useState(null);
  const [health, setHealth] = useState(null);
  const [plans, setPlans] = useState([]);
  const [flights, setFlights] = useState([]);
  const [weather, setWeather] = useState(null);
  const [airport, setAirport] = useState(null);
  const [traffic, setTraffic] = useState(null);
  const [telemetry, setTelemetry] = useState(null);
  const [telemetryError, setTelemetryError] = useState("");
  const [scratch, setScratch] = useState(() => localStorage.getItem("fd-scratch") || "");
  const [scratchSaved, setScratchSaved] = useState(true);
  const [preferences, setPreferences] = useState(() => readStored("fd-preferences", {}));
  const [checkState, setCheckState] = useState(() => readStored("fd-checks", {}));
  const [integrations, setIntegrations] = useState(null);
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pairingCode, setPairingCode] = useState(null);
  const toastTimer = useRef(null);

  const selectedAircraft = AIRCRAFT.find(item => item.icao === aircraft) || AIRCRAFT[0];
  const navItem = NAV.flatMap(group => group.items).find(item => item.id === page) || NAV[0].items[0];
  const latestPlan = plans[0] || null;
  const lastFlight = flights[0] || null;

  const notify = useCallback((message, tone = "success") => {
    setToast({ message, tone });
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 4200);
  }, []);

  const loadPrivateData = useCallback(async () => {
    const results = await Promise.allSettled([
      api("/flight-plans"),
      api("/logbook"),
      api("/preferences"),
      api("/scratchpad")
    ]);
    if (results[0].status === "fulfilled") setPlans(results[0].value.plans || []);
    if (results[1].status === "fulfilled") setFlights(results[1].value.flights || []);
    if (results[2].status === "fulfilled") {
      const prefs = results[2].value.preferences || {};
      setPreferences(prev => ({ ...prev, ...prefs }));
      if (prefs.aircraft && AIRCRAFT.some(item => item.icao === prefs.aircraft)) setAircraft(prefs.aircraft);
      if (prefs.checklists) setCheckState(prefs.checklists);
    }
    if (results[3].status === "fulfilled" && typeof results[3].value.scratchpad === "string") {
      setScratch(results[3].value.scratchpad);
      localStorage.setItem("fd-scratch", results[3].value.scratchpad);
      setScratchSaved(true);
    }
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("fd-theme-v2", theme);
  }, [theme]);

  useEffect(() => {
    document.title = navItem.label + " · FlyTech";
  }, [navItem.label]);

  useEffect(() => {
    const handlePopState = () => {
      setPage(pageFromLocation());
      setMobileMenu(false);
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const h = await api("/health");
        if (alive) setHealth(h);
      } catch (error) {
        if (alive) setHealth({ ok: false, error: error.message, database: false });
      }
      try {
        const auth = await api("/auth/me");
        if (!alive) return;
        setUser(auth.user || null);
        if (auth.user) await loadPrivateData();
      } catch {}
    })();
    return () => { alive = false; };
  }, [loadPrivateData]);

  useEffect(() => {
    if (!user) {
      setTelemetry(null);
      setTelemetryError("");
      return undefined;
    }
    let alive = true;
    const poll = async () => {
      try {
        const result = await api("/telemetry/latest");
        if (alive) {
          setTelemetry(result);
          setTelemetryError("");
        }
      } catch (error) {
        if (alive) setTelemetryError(error.message);
      }
    };
    poll();
    const interval = window.setInterval(poll, 5000);
    return () => { alive = false; window.clearInterval(interval); };
  }, [user]);

  useEffect(() => {
    if (page !== "integrations") return;
    api("/integrations/status").then(setIntegrations).catch(error => setIntegrations({ error: error.message, integrations: [] }));
  }, [page]);

  useEffect(() => {
    saveStored("fd-preferences", preferences);
  }, [preferences]);

  useEffect(() => {
    saveStored("fd-checks", checkState);
  }, [checkState]);

  const navigate = id => {
    const target = PAGE_PATHS[id] || "/";
    if (window.location.pathname !== target) window.history.pushState({ page: id }, "", target);
    setPage(id);
    setMobileMenu(false);
    setToast(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const refreshPrivateData = async () => {
    await loadPrivateData();
    notify("Your cloud data has been refreshed.");
  };

  const savePlan = async plan => {
    setLoading(true);
    try {
      const response = await api("/flight-plans", {
        method: "POST",
        body: JSON.stringify({
          title: [plan.flightNumber || "Flight", plan.departure?.icao, plan.destination?.icao].filter(Boolean).join(" "),
          source: "SimBrief",
          simbrief_id: plan.simbriefId || null,
          flight_number: plan.flightNumber || null,
          dep: plan.departure?.icao || null,
          arr: plan.destination?.icao || null,
          aircraft: plan.aircraft?.icao || plan.aircraft?.name || null,
          flight_date: plan.date || null,
          etd: plan.etd || null,
          ete: plan.eteMinutes || null,
          distance_nm: plan.distanceNm || null,
          cruise_altitude: plan.cruiseAltitude || null,
          fuel: plan.blockFuel || null,
          route: plan.route || null,
          raw_data: plan
        })
      });
      const saved = response.plan;
      setPlans(prev => [saved, ...prev.filter(item => item.id !== saved.id)]);
      notify("Flight plan saved to your cloud dispatch library.");
      return saved;
    } catch (error) {
      notify(error.message, "error");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const saveManualFlight = async flight => {
    try {
      const result = await api("/logbook", { method: "POST", body: JSON.stringify(flight) });
      setFlights(prev => [result.flight, ...prev]);
      notify("Flight added to your logbook.");
      return result.flight;
    } catch (error) {
      notify(error.message, "error");
      throw error;
    }
  };

  const updateAircraft = value => {
    setAircraft(value);
    localStorage.setItem("fd-aircraft", value);
    setPreferences(prev => ({ ...prev, aircraft: value }));
    if (user) api("/preferences", { method: "PUT", body: JSON.stringify({ aircraft: value }) }).catch(error => notify(error.message, "error"));
  };

  const updateChecklist = value => {
    setCheckState(value);
    setPreferences(prev => ({ ...prev, checklists: value }));
    if (user) api("/preferences", { method: "PUT", body: JSON.stringify({ checklists: value }) }).catch(error => notify("Checklist is saved on this device, but cloud sync failed: " + error.message, "error"));
  };

  const saveScratchpad = async () => {
    localStorage.setItem("fd-scratch", scratch);
    if (user) {
      try {
        await api("/scratchpad", { method: "PUT", body: JSON.stringify({ scratchpad: scratch }) });
        setScratchSaved(true);
        notify("Scratchpad saved to your account.");
      } catch (error) {
        setScratchSaved(false);
        notify("Saved on this device. Cloud sync failed: " + error.message, "error");
      }
    } else {
      setScratchSaved(true);
      notify("Scratchpad saved on this device. Sign in to sync it across devices.");
    }
  };

  const generatePairingCode = async () => {
    try {
      const result = await api("/bridge/pairing", { method: "POST", body: JSON.stringify({}) });
      setPairingCode(result);
      notify("A one-time pairing code has been created.");
    } catch (error) { notify(error.message, "error"); }
  };

  const refreshWeather = async icao => {
    setLoading(true);
    try {
      const result = await api("/weather/" + encodeURIComponent(icao.toUpperCase()));
      setWeather(result);
      notify("Weather updated from " + result.source + ".");
      return result;
    } catch (error) {
      notify(error.message, "error");
      throw error;
    } finally { setLoading(false); }
  };

  const refreshAirport = async icao => {
    setLoading(true);
    try {
      const result = await api("/airports/" + encodeURIComponent(icao.toUpperCase()));
      setAirport(result.airport);
      notify("Airport information loaded from " + result.source + ".");
    } catch (error) {
      setAirport({ error: error.message, icao });
      notify(error.message, "error");
    } finally { setLoading(false); }
  };

  const refreshTraffic = async () => {
    setLoading(true);
    try {
      const result = await api("/network/vatsim");
      setTraffic(result);
    } catch (error) { notify(error.message, "error"); }
    finally { setLoading(false); }
  };

  const removePlan = async id => {
    try {
      await api("/flight-plans/" + encodeURIComponent(id), { method: "DELETE" });
      setPlans(prev => prev.filter(item => String(item.id) !== String(id)));
      notify("Flight plan deleted.");
    } catch (error) { notify(error.message, "error"); }
  };

  const signOut = async () => {
    try { await api("/auth/logout", { method: "POST", body: JSON.stringify({}) }); } catch {}
    setUser(null);
    setPlans([]);
    setFlights([]);
    setTelemetry(null);
    setPairingCode(null);
    notify("You have signed out.");
  };

  const activeTelemetry = telemetry?.connected && telemetry?.data ? telemetry.data : null;
  const telemetryAge = telemetry?.updatedAt ? Math.max(0, Math.round((Date.now() - new Date(telemetry.updatedAt).getTime()) / 1000)) : null;

  return <div className={"fd-shell " + (collapsed ? "sidebar-collapsed " : "") + (mobileMenu ? "mobile-menu-open" : "")}>
    {mobileMenu && <button className="mobile-scrim" aria-label="Close navigation" onClick={() => setMobileMenu(false)} />}
    <aside className="sidebar">
      <div className="brand-row">
        <div className="brand-mark"><Plane size={21} fill="currentColor" strokeWidth={1.5} /></div>
        <div className="brand-type"><strong>FLYTECH</strong><span>FLIGHT SIMULATION SUITE</span></div>
        <IconButton icon={X} label="Close navigation" onClick={() => setMobileMenu(false)} variant="sidebar-close" />
      </div>
      <div className="profile-strip">
        <div className="profile-avatar">{userInitials(user)}</div>
        <div className="profile-meta"><strong>{user ? (user.display_name || user.username) : "Guest cockpit"}</strong><span>{user ? "Synced pilot profile" : "Local workspace"}</span></div>
        <span className={"sync-indicator " + (user ? "is-connected" : "")} title={user ? "Signed in" : "Not signed in"} />
      </div>
      <nav className="side-nav" aria-label="Main navigation">
        {NAV.map(group => <div className="nav-group" key={group.group}>
          <div className="nav-group-label">{group.group}</div>
          {group.items.map(item => {
            const Icon = item.icon;
            return <button key={item.id} className={"nav-item " + (page === item.id ? "active" : "")} onClick={() => navigate(item.id)} title={collapsed ? item.label : undefined}>
              <Icon size={18} strokeWidth={1.8} /><span>{item.label}</span>{page === item.id && <span className="nav-active-mark" />}
            </button>;
          })}
        </div>)}
      </nav>
      <div className="sidebar-footer">
        <div className="connection-note"><span className={"connection-led " + (health?.ok ? "ok" : "unknown")} /><div><strong>{health?.ok ? "EFB services" : health ? "Service check failed" : "Checking services"}</strong><small>{health?.database ? "Database connected" : health ? "Database not connected" : "Reading service status"}</small></div></div>
        <button className="collapse-btn" onClick={() => setCollapsed(value => !value)}><ChevronRight size={16} className={collapsed ? "" : "rotate-180"} /><span>{collapsed ? "Expand sidebar" : "Collapse sidebar"}</span></button>
      </div>
    </aside>

    <main className="main-area">
      <header className="topbar">
        <div className="topbar-left">
          <IconButton icon={Menu} label="Open navigation" onClick={() => setMobileMenu(true)} variant="mobile-menu-button" />
          <div className="breadcrumb"><span>FLYTECH</span><ChevronRight size={13} /><strong>{navItem.label}</strong></div>
        </div>
        <div className="topbar-actions">
          <label className="aircraft-switch"><Plane size={15} /><select aria-label="Selected aircraft" value={aircraft} onChange={event => updateAircraft(event.target.value)}>{AIRCRAFT.map(item => <option key={item.icao} value={item.icao}>{item.icao} · {item.name}</option>)}</select><ChevronDown size={14} /></label>
          <span className="topbar-divider" />
          <button className="top-user" onClick={() => navigate("settings")} title="Account and settings"><span className="profile-avatar small">{userInitials(user)}</span><span className="top-user-name">{user ? (user.display_name || user.username) : "Sign in"}</span></button>
        </div>
      </header>

      <div className="page-content">
        {page === "home" && <Dashboard user={user} health={health} aircraft={selectedAircraft} latestPlan={latestPlan} lastFlight={lastFlight} plans={plans} flights={flights} telemetry={telemetry} telemetryError={telemetryError} telemetryAge={telemetryAge} navigate={navigate} refreshPrivateData={refreshPrivateData} refreshWeather={refreshWeather} loading={loading} />}
        {page === "dispatch" && <Dispatch user={user} plans={plans} savePlan={savePlan} removePlan={removePlan} loading={loading} navigate={navigate} />}
        {page === "airports" && <Airports airport={airport} refreshAirport={refreshAirport} loading={loading} />}
        {page === "weather" && <Weather weather={weather} refreshWeather={refreshWeather} loading={loading} />}
        {page === "traffic" && <Traffic traffic={traffic} refreshTraffic={refreshTraffic} loading={loading} />}
        {page === "tools" && <Tools />}
        {page === "checklists" && <Checklists aircraft={selectedAircraft} state={checkState} onChange={updateChecklist} user={user} />}
        {page === "logbook" && <Logbook flights={flights} plans={plans} saveFlight={saveManualFlight} navigate={navigate} />}
        {page === "scratch" && <Scratchpad value={scratch} setValue={value => { setScratch(value); setScratchSaved(false); localStorage.setItem("fd-scratch", value); }} save={saveScratchpad} saved={scratchSaved} user={user} />}
        {page === "integrations" && <Integrations status={integrations} error={integrations?.error} onRefresh={() => api("/integrations/status").then(setIntegrations).catch(error => setIntegrations({ error: error.message, integrations: [] }))} navigate={navigate} />}
        {page === "simulator" && <PairingGuide user={user} health={health} pairingCode={pairingCode} generatePairingCode={generatePairingCode} navigate={navigate} notify={notify} />}
        {page === "news" && <NewsPage />}
        {page === "airlines" && <AirlinesPage user={user} navigate={navigate} notify={notify} />}
        {page === "events" && <CommunityPage user={user} navigate={navigate} notify={notify} />}
        {page === "learn" && <AcademyPage navigate={navigate} />}
        {page === "settings" && <Settings user={user} setUser={setUser} onSignedIn={loadPrivateData} theme={theme} setTheme={setTheme} aircraft={aircraft} setAircraft={updateAircraft} signOut={signOut} pairingCode={pairingCode} generatePairingCode={generatePairingCode} health={health} navigate={navigate} notify={notify} />}
      </div>
    </main>

    <nav className="mobile-tabbar" aria-label="Quick navigation">
      {[{ id: "home", icon: LayoutDashboard, label: "Deck" }, { id: "dispatch", icon: Route, label: "Flight plan" }, { id: "weather", icon: CloudSun, label: "Weather" }, { id: "logbook", icon: BookOpen, label: "Logbook" }, { id: "settings", icon: UserRound, label: "Account" }].map(item => {
        const Icon = item.icon;
        return <button key={item.id} className={page === item.id ? "active" : ""} onClick={() => navigate(item.id)}><Icon size={19} /><span>{item.label}</span></button>;
      })}
    </nav>
    {toast && <div className={"toast toast-" + toast.tone} role="status"><span className="toast-symbol">{toast.tone === "error" ? <AlertCircle size={17} /> : <CheckCircle2 size={17} />}</span><span>{toast.message}</span><button onClick={() => setToast(null)} aria-label="Dismiss notification"><X size={15} /></button></div>}
  </div>;
}

function Dashboard({ user, health, aircraft, latestPlan, lastFlight, plans, flights, telemetry, telemetryError, telemetryAge, navigate, refreshPrivateData, refreshWeather, loading }) {
  const [weatherIcao, setWeatherIcao] = useState(latestPlan?.dep || "LIRF");
  const [localWeather, setLocalWeather] = useState(null);
  const [weatherError, setWeatherError] = useState("");
  useEffect(() => {
    if (latestPlan?.dep) setWeatherIcao(latestPlan.dep);
  }, [latestPlan?.dep]);
  const connected = telemetry?.connected && telemetry?.data;
  const planMap = latestPlan ? {
    dep: latestPlan.dep,
    arr: latestPlan.arr,
    raw_data: latestPlan.raw_data || latestPlan.rawData || {}
  } : null;
  const timeGreeting = new Date().getHours() < 12 ? "Good morning" : new Date().getHours() < 18 ? "Good afternoon" : "Good evening";
  const updateWeather = async () => {
    if (!icaoValid(weatherIcao)) { setWeatherError("Enter a valid four-character ICAO code."); return; }
    setWeatherError("");
    try {
      const result = await refreshWeather(weatherIcao);
      setLocalWeather(result);
    } catch (error) { setWeatherError(error.message); }
  };
  return <>
    <div className="welcome-row">
      <div><div className="eyebrow">FLIGHT OPERATIONS / OVERVIEW</div><h1>{timeGreeting}{user ? ", " + (user.display_name || user.username) : "."}</h1><p>Your planning desk, weather and flight records in one place.</p></div>
      <div className="welcome-date"><Clock3 size={15} /><span>{new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}</span></div>
    </div>

    <div className="status-ribbon">
      <div className="status-ribbon-item"><span className={"status-icon " + (health?.ok ? "green" : "amber")}><Server size={17} /></span><div><span>Platform</span><strong>{health?.ok ? "Service responding" : health ? "Service unavailable" : "Checking…"}</strong></div><span className={"status-dot " + (health?.ok ? "green" : "amber")} /></div>
      <div className="status-ribbon-item"><span className={"status-icon " + (health?.database ? "green" : "amber")}><Database size={17} /></span><div><span>Cloud database</span><strong>{health?.database ? "Connected" : "Not configured"}</strong></div><span className={"status-dot " + (health?.database ? "green" : "amber")} /></div>
      <div className="status-ribbon-item"><span className={"status-icon " + (connected ? "green" : "muted")}><Activity size={17} /></span><div><span>MSFS companion</span><strong>{connected ? "Telemetry received" : "Not connected"}</strong></div><span className={"status-dot " + (connected ? "green" : "muted")} /></div>
      <button className="status-ribbon-action" onClick={() => navigate("integrations")}>Connection details <ArrowRight size={15} /></button>
    </div>

    <div className="dashboard-grid">
      <div className="dashboard-main-column">
        <section className="welcome-flight-card">
          <div className="welcome-flight-copy">
            <div className="eyebrow">YOUR FLIGHT DESK</div>
            <h2>{latestPlan ? "Ready for " + (latestPlan.dep || "departure") + " → " + (latestPlan.arr || "arrival") : "Plan the next flight."}</h2>
            <p>{latestPlan ? "Your most recent dispatch is saved in your cloud library. Open it to review the plan before loading your simulator." : "Bring your SimBrief dispatch into FlyTech and keep the plan, weather and flight notes together."}</p>
            <div className="hero-actions"><button className="button-primary" onClick={() => navigate("dispatch")}><Route size={16} /> {latestPlan ? "Open flight planning" : "Import a flight plan"} <ArrowRight size={15} /></button><button className="button-secondary" onClick={() => navigate("checklists")}><ClipboardCheck size={16} /> Checklists</button></div>
          </div>
          <div className="flight-card-stamp"><div className="stamp-line">FLYTECH</div><Plane size={46} strokeWidth={1.1} /><div className="stamp-code">{latestPlan?.flight_number || aircraft.icao}</div><div className="stamp-caption">{latestPlan ? (latestPlan.dep || "----") + " / " + (latestPlan.arr || "----") : aircraft.name}</div></div>
        </section>

        <Panel title="Route overview" subtitle={latestPlan ? "Saved dispatch · Great-circle line between airport coordinates" : "Your most recent dispatch will appear here"} action={<button className="text-action" onClick={() => navigate("dispatch")}>Flight planning <ArrowRight size={14} /></button>} className="route-panel">
          <RouteMap plan={planMap} />
          {latestPlan && <div className="route-summary"><div><span>DEPARTURE</span><strong>{latestPlan.dep || "—"}</strong><small>{latestPlan.raw_data?.departure?.name || latestPlan.raw_data?.origin?.name || "Origin airport"}</small></div><div className="route-arrow"><ArrowRight size={17} /></div><div><span>DESTINATION</span><strong>{latestPlan.arr || "—"}</strong><small>{latestPlan.raw_data?.destination?.name || "Arrival airport"}</small></div><div className="route-summary-stat"><span>PLANNED DISTANCE</span><strong>{latestPlan.distance_nm ? formatNumber(latestPlan.distance_nm) + " NM" : "—"}</strong></div></div>}
        </Panel>

        <Panel title="Recent flight activity" subtitle="Flight records saved to your account" action={<button className="text-action" onClick={() => navigate("logbook")}>Open logbook <ArrowRight size={14} /></button>}>
          {flights.length ? <div className="data-table-wrap"><table className="data-table"><thead><tr><th>Flight</th><th>Route</th><th>Aircraft</th><th>Duration</th><th>Date</th></tr></thead><tbody>{flights.slice(0, 5).map(flight => <tr key={flight.id}><td className="strong-cell">{flight.flight || "Manual entry"}</td><td><span className="route-code">{flight.dep || "—"} <ArrowRight size={12} /> {flight.arr || "—"}</span></td><td>{flight.aircraft || "—"}</td><td>{displayDuration(flight.duration)}</td><td>{formatDate(flight.flight_date || flight.created_at)}</td></tr>)}</tbody></table></div> : <EmptyState icon={BookOpen} title="Your logbook starts here" text={user ? "Save a completed flight and it will show up here across your devices." : "Sign in to keep a cloud logbook, or open Logbook to start a session."} action={<button className="button-secondary small" onClick={() => navigate("logbook")}>Open logbook <ArrowRight size={14} /></button>} />}
        </Panel>
      </div>

      <div className="dashboard-side-column">
        <Panel title="Simulator telemetry" subtitle="Live data from your local companion" action={<span className={"mini-status " + (connected ? "online" : "")}><span />{connected ? "LIVE" : "OFFLINE"}</span>}>
          {connected ? <div className="telemetry-content">
            <div className="telemetry-head"><div><span>Aircraft altitude</span><strong>{formatNumber(telemetry.data.altitudeFt)} <small>ft</small></strong></div><div className="telemetry-aircraft"><Plane size={24} /><small>{telemetry.data.title || aircraft.icao}</small></div></div>
            <div className="telemetry-grid"><div><span>Indicated airspeed</span><strong>{formatNumber(telemetry.data.iasKt)} <small>kt</small></strong></div><div><span>Ground speed</span><strong>{formatNumber(telemetry.data.groundSpeedKt)} <small>kt</small></strong></div><div><span>Vertical speed</span><strong>{formatNumber(telemetry.data.verticalSpeedFpm)} <small>fpm</small></strong></div><div><span>Heading</span><strong>{formatNumber(telemetry.data.headingDeg)}<small>°</small></strong></div></div>
            <div className="telemetry-footer"><span><CircleDot size={12} /> Updated {telemetryAge !== null ? telemetryAge + "s ago" : "recently"}</span><button className="text-action" onClick={() => navigate("integrations")}>Bridge status</button></div>
          </div> : <div className="telemetry-offline"><div className="telemetry-offline-icon"><Activity size={23} /></div><strong>No simulator data received</strong><p>Start the FlyTech companion on the same PC as MSFS 2024, then pair it to your account.</p><button className="button-secondary full" onClick={() => navigate("settings")}>Set up MSFS connection <ArrowRight size={14} /></button>{telemetryError && <small className="subtle-note">{telemetryError}</small>}</div>}
        </Panel>

        <Panel title="Weather quick-look" subtitle="Latest aviation weather report">
          <div className="weather-quick-form"><label className="input-with-icon"><MapPin size={15} /><input aria-label="Weather ICAO code" value={weatherIcao} maxLength={4} onChange={event => setWeatherIcao(event.target.value.toUpperCase())} onKeyDown={event => { if (event.key === "Enter") updateWeather(); }} /></label><button className="icon-button" onClick={updateWeather} disabled={loading} title="Fetch weather"><RefreshCw size={16} className={loading ? "spin" : ""} /></button></div>
          {weatherError && <div className="inline-error">{weatherError}</div>}
          {localWeather ? <div className="weather-result"><div className="weather-code">{localWeather.icao}</div><div><strong>{localWeather.metar?.raw || localWeather.metar?.rawOb || "No current METAR returned"}</strong><small>Source: {localWeather.source} · {localWeather.fetchedAt ? new Date(localWeather.fetchedAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) : "just now"}</small></div></div> : <div className="quiet-callout"><CloudSun size={20} /><span>Enter an airport ICAO code to fetch current METAR and TAF data.</span></div>}
          <button className="text-action block-action" onClick={() => navigate("weather")}>Open weather desk <ArrowRight size={14} /></button>
        </Panel>

        <Panel title="Your workspace" subtitle="Personal profile and saved tools">
          <div className="workspace-list"><button onClick={() => navigate("dispatch")}><span className="workspace-icon"><FileText size={16} /></span><span><strong>Saved dispatches</strong><small>{plans.length} flight plan{plans.length === 1 ? "" : "s"}</small></span><ChevronRight size={16} /></button><button onClick={() => navigate("logbook")}><span className="workspace-icon"><BookOpen size={16} /></span><span><strong>Flight logbook</strong><small>{flights.length} saved record{flights.length === 1 ? "" : "s"}</small></span><ChevronRight size={16} /></button><button onClick={() => navigate("scratch")}><span className="workspace-icon"><NotebookPen size={16} /></span><span><strong>Flight notes</strong><small>{user ? "Cloud sync available" : "Saved on this device"}</small></span><ChevronRight size={16} /></button></div>
        </Panel>
      </div>
    </div>
    <div className="dashboard-footnote"><ShieldCheck size={14} /><span>Designed for flight simulation. Always verify performance and procedure details against your aircraft add-on and applicable network rules.</span><button className="text-action" onClick={refreshPrivateData}>Refresh cloud data <RefreshCw size={13} /></button></div>
  </>;
}

function Dispatch({ user, plans, savePlan, removePlan, loading, navigate }) {
  const [identifier, setIdentifier] = useState("");
  const [identifierType, setIdentifierType] = useState("userid");
  const [plan, setPlan] = useState(null);
  const [error, setError] = useState("");
  const [savedOnly, setSavedOnly] = useState(false);
  const loadPlan = async event => {
    event.preventDefault();
    if (!identifier.trim()) { setError("Enter your SimBrief Pilot ID or username."); return; }
    setError("");
    setSavedOnly(false);
    try {
      const result = await api("/integrations/simbrief?identifier=" + encodeURIComponent(identifier.trim()) + "&kind=" + encodeURIComponent(identifierType));
      setPlan(result.plan);
    } catch (failure) { setError(failure.message); }
  };
  const loadSaved = item => {
    const raw = item.raw_data || {};
    setPlan({
      ...raw,
      flightNumber: item.flight_number || raw.flightNumber || "",
      departure: raw.departure || { icao: item.dep },
      destination: raw.destination || { icao: item.arr },
      aircraft: raw.aircraft || { icao: item.aircraft },
      route: item.route || raw.route,
      distanceNm: item.distance_nm || raw.distanceNm,
      cruiseAltitude: item.cruise_altitude || raw.cruiseAltitude,
      eteMinutes: item.ete || raw.eteMinutes,
      blockFuel: item.fuel || raw.blockFuel,
      simbriefId: item.simbrief_id || raw.simbriefId,
      savedId: item.id
    });
    setSavedOnly(true);
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const save = async () => {
    if (!user) { setError("Sign in first to save flight plans to the cloud."); return; }
    if (!plan) return;
    try {
      const result = await savePlan(plan);
      setPlan({ ...plan, savedId: result.id || plan.savedId });
      setSavedOnly(false);
    } catch {}
  };
  return <>
    <SectionHeading eyebrow="DISPATCH & FLIGHT PLANNING" title="Flight planning" subtitle="Import your SimBrief dispatch, review the key figures and keep a saved copy in your FlyTech account." action={<Pill tone={user ? "green" : "amber"}>{user ? "Cloud library enabled" : "Sign in to save"}</Pill>} />
    <div className="dispatch-layout">
      <div className="dispatch-main">
        <Panel title="Import a dispatch" subtitle="Uses SimBrief's published latest-OFP endpoint. FlyTech does not generate a new SimBrief OFP itself.">
          <form className="dispatch-form" onSubmit={loadPlan}>
            <Field label="SimBrief Pilot ID or username" hint="Use the Pilot ID shown in SimBrief account settings, or your public username."><input value={identifier} onChange={event => setIdentifier(event.target.value)} placeholder="e.g. 123456 or pilotname" autoComplete="off" /></Field>
            <Field label="Identifier type"><select value={identifierType} onChange={event => setIdentifierType(event.target.value)}><option value="userid">Pilot ID</option><option value="username">Username</option></select></Field>
            <button className="button-primary" type="submit" disabled={loading}><Cloud size={16} /> {loading ? "Contacting SimBrief…" : "Fetch latest OFP"} <ArrowRight size={15} /></button>
          </form>
          {error && <div className="notice notice-error"><AlertCircle size={17} /><span>{error}</span></div>}
        </Panel>

        {plan ? <Panel title="Dispatch summary" subtitle={savedOnly ? "Loaded from your saved flight plan library." : "Flight details returned by SimBrief."} action={<Pill tone={savedOnly ? "muted" : "green"}>{savedOnly ? "SAVED PLAN" : "OFP IMPORTED"}</Pill>} className="ofp-panel">
          <div className="ofp-route">
            <div><span>DEPARTURE</span><strong>{plan.departure?.icao || "----"}</strong><small>{plan.departure?.name || "Origin airport"}</small></div>
            <div className="ofp-route-line"><span>{plan.distanceNm ? formatNumber(plan.distanceNm) + " NM" : "ROUTE"}</span><div><i /><i /><i /><i /><i /></div><ArrowRight size={20} /></div>
            <div><span>DESTINATION</span><strong>{plan.destination?.icao || "----"}</strong><small>{plan.destination?.name || "Arrival airport"}</small></div>
          </div>
          <div className="ofp-data-grid">
            <OFPValue label="Flight" value={plan.flightNumber || "Not specified"} />
            <OFPValue label="Aircraft" value={(plan.aircraft?.icao || plan.aircraft?.name || "—") + (plan.aircraft?.name && plan.aircraft?.icao ? " · " + plan.aircraft.name : "")} />
            <OFPValue label="Departure UTC" value={plan.etd || "Not provided"} />
            <OFPValue label="Estimated en route" value={plan.ete || displayDuration(plan.eteMinutes)} />
            <OFPValue label="Cruise altitude" value={plan.cruiseAltitude ? (String(plan.cruiseAltitude).match(/^\d+$/) ? "FL" + String(plan.cruiseAltitude).padStart(3, "0") : plan.cruiseAltitude) : "—"} />
            <OFPValue label="Block fuel" value={plan.blockFuel ? formatNumber(plan.blockFuel) + " (SimBrief units)" : "Not provided"} />
          </div>
          <div className="route-string"><div className="eyebrow">ROUTE STRING</div><p>{plan.route || "No route string was returned by SimBrief."}</p></div>
          <div className="notice notice-info"><AlertCircle size={16} /><span>The line on the map is a great-circle overview between airport coordinates, not a substitute for the OFP, airway routing or licensed navigation charts.</span></div>
          <div className="panel-button-row"><button className="button-primary" onClick={save} disabled={loading || savedOnly}>{savedOnly ? <Check size={16} /> : <Save size={16} />}{savedOnly ? "Already saved" : "Save to cloud library"}</button><button className="button-secondary" onClick={() => navigate("weather")}>Check weather <CloudSun size={16} /></button>{plan.simbriefUrl && <a className="button-secondary link-button" href={plan.simbriefUrl} target="_blank" rel="noreferrer">Open SimBrief <ExternalLink size={15} /></a>}</div>
        </Panel> : <Panel title="What happens after import?" subtitle="The imported plan is converted into usable flight data rather than displayed as a raw XML document."><div className="dispatch-benefits"><div><span>01</span><strong>Review the route</strong><p>Departure, arrival, route and aircraft are separated into readable fields.</p></div><div><span>02</span><strong>Check current conditions</strong><p>Open the weather desk to fetch reports directly from the aviation weather provider.</p></div><div><span>03</span><strong>Keep your own record</strong><p>Signed-in pilots can save dispatches to the cloud and access them from other devices.</p></div></div></Panel>}
      </div>
      <aside className="dispatch-side">
        <Panel title="Saved dispatches" subtitle={user ? "Your most recent cloud flight plans" : "Sign in to sync dispatches between devices"} action={<span className="count-chip">{plans.length}</span>}>
          {plans.length ? <div className="saved-plan-list">{plans.map(item => <div className="saved-plan" key={item.id}><button className="saved-plan-open" onClick={() => loadSaved(item)}><span className="saved-plan-mark"><Route size={17} /></span><span className="saved-plan-detail"><strong>{item.flight_number || item.title || "Flight plan"}</strong><small>{item.dep || "----"} <ArrowRight size={11} /> {item.arr || "----"}</small><em>{formatDate(item.flight_date || item.created_at)}</em></span><ChevronRight size={15} /></button><button className="saved-plan-delete" onClick={() => { if (window.confirm("Delete this saved flight plan?")) removePlan(item.id); }} title="Delete flight plan" aria-label="Delete flight plan"><Trash2 size={14} /></button></div>)}</div> : <EmptyState icon={FileText} title="No saved dispatches" text={user ? "Imported flight plans that you save will be available here." : "You can import a plan as a guest. Sign in to save it to your cloud library."} />}
        </Panel>
        <Panel title="Dispatch note" subtitle="Data provenance">
          <div className="provenance-note"><ShieldCheck size={18} /><p>FlyTech only shows fields returned by the provider. Missing fields remain blank. Check the source OFP and your aircraft add-on before using any plan for a simulated flight.</p></div>
          <a className="source-link" href="https://www.simbrief.com/" target="_blank" rel="noreferrer">SimBrief website <ExternalLink size={13} /></a>
        </Panel>
      </aside>
    </div>
  </>;
}
function OFPValue({ label, value }) { return <div className="ofp-value"><span>{label}</span><strong>{value || "—"}</strong></div>; }

function Airports({ airport, refreshAirport, loading }) {
  const [icao, setIcao] = useState("LIRF");
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState("");
  const search = async event => {
    if (event) event.preventDefault();
    if (!icaoValid(icao)) { setError("Enter a valid four-character ICAO code, such as LIRF."); return; }
    setError("");
    setSearched(true);
    await refreshAirport(icao.toUpperCase());
  };
  return <>
    <SectionHeading eyebrow="AIRPORT INFORMATION" title="Airport desk" subtitle="Look up real airport metadata, then use dedicated provider data for runway and frequency detail." />
    <Panel title="Find an airport" subtitle="Worldwide ICAO search">
      <form className="airport-search" onSubmit={search}><label className="input-with-icon airport-code-input"><MapPin size={17} /><input aria-label="Airport ICAO code" value={icao} maxLength={4} onChange={event => setIcao(event.target.value.toUpperCase())} placeholder="ICAO, e.g. LIRF" /></label><button className="button-primary" type="submit" disabled={loading}><Search size={16} /> {loading ? "Searching…" : "Look up airport"}</button></form>
      {error && <div className="inline-error">{error}</div>}
    </Panel>
    {searched && airport && <div className="airport-results">
      {airport.error ? <div className="notice notice-error"><AlertCircle size={17} /><span>{airport.error}</span></div> : <>
        <div className="airport-identity"><div className="airport-code-large">{airport.icao || airport.id || icao}</div><div><div className="eyebrow">{airport.country || airport.state || "AIRPORT"}</div><h2>{airport.name || "Airport details"}</h2><p>{airport.municipality || airport.city || airport.location || "Location not supplied by the data provider"}</p></div><Pill tone="green">Provider data</Pill></div>
        <div className="airport-facts"><Fact label="ICAO" value={airport.icao || airport.id || icao} /><Fact label="IATA" value={airport.iata || airport.iata_code || "Not provided"} /><Fact label="Elevation" value={airport.elevationFt !== null && airport.elevationFt !== undefined && Number.isFinite(Number(airport.elevationFt)) ? formatNumber(airport.elevationFt) + " ft" : airport.elevation !== null && airport.elevation !== undefined && Number.isFinite(Number(airport.elevation)) ? formatNumber(airport.elevation) + " ft" : "Not provided"} /><Fact label="Coordinates" value={airport.lat !== null && airport.lat !== undefined && airport.lon !== null && airport.lon !== undefined && Number.isFinite(Number(airport.lat)) && Number.isFinite(Number(airport.lon)) ? Number(airport.lat).toFixed(4) + ", " + Number(airport.lon).toFixed(4) : "Not provided"} /></div>
        <div className="airport-detail-grid"><Panel title="Runways" subtitle="AirportDB enrichment when configured">{airport.runways?.length ? <div className="data-table-wrap"><table className="data-table"><thead><tr><th>Ident</th><th>Length</th><th>Surface</th></tr></thead><tbody>{airport.runways.map((r, i) => <tr key={r.id || i}><td className="strong-cell">{r.le_ident || r.ident || r.name || "—"}{r.he_ident ? " / " + r.he_ident : ""}</td><td>{r.length_ft ? formatNumber(r.length_ft) + " ft" : "—"}</td><td>{r.surface || "—"}</td></tr>)}</tbody></table></div> : <EmptyState icon={Map} title="Runway detail unavailable" text="Runway and frequency data are only shown when the configured airport data provider returns them. FlyTech will not fill gaps with guessed values." />}</Panel><Panel title="Frequencies" subtitle="Provider-supplied radio data">{airport.frequencies?.length ? <div className="frequency-list">{airport.frequencies.map((f, i) => <div key={f.id || i}><span>{f.type || f.description || "Frequency"}</span><strong>{f.frequency_mhz || f.frequency || "—"}</strong><small>{f.name || ""}</small></div>)}</div> : <EmptyState icon={Radio} title="No frequencies supplied" text="This data provider did not return frequency information for the selected airport." />}</Panel></div>
        <div className="source-caption"><ShieldCheck size={14} />Source: {airport.source || "airport data provider"}{airport.updatedAt ? " · retrieved " + new Date(airport.updatedAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) : ""}</div>
      </>}
    </div>}
    {!searched && <EmptyState icon={MapPin} title="Search for an airport" text="Airport codes are validated before a request is sent. Data not returned by the provider is left blank." />}
  </>;
}
function Fact({ label, value }) { return <div className="airport-fact"><span>{label}</span><strong>{value || "—"}</strong></div>; }

function Weather({ weather, refreshWeather, loading }) {
  const [icao, setIcao] = useState("LIRF");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const fetchWeather = async event => {
    if (event) event.preventDefault();
    if (!icaoValid(icao)) { setError("Enter a valid four-character ICAO code."); return; }
    setError("");
    try { setResult(await refreshWeather(icao.toUpperCase())); }
    catch (failure) { setError(failure.message); }
  };
  useEffect(() => { if (weather?.icao) setIcao(weather.icao); }, [weather?.icao]);
  const metar = result?.metar;
  const taf = result?.taf;
  return <>
    <SectionHeading eyebrow="AVIATION WEATHER" title="Weather desk" subtitle="Fetch current METAR observations and terminal forecasts from the Aviation Weather Center API." action={<Pill tone="green">Live provider</Pill>} />
    <Panel title="Station lookup" subtitle="Weather reports are retrieved on demand, with provider status and timestamps.">
      <form className="airport-search" onSubmit={fetchWeather}><label className="input-with-icon airport-code-input"><CloudSun size={17} /><input aria-label="Weather ICAO code" value={icao} maxLength={4} onChange={event => setIcao(event.target.value.toUpperCase())} placeholder="ICAO, e.g. LIRF" /></label><button className="button-primary" type="submit" disabled={loading}><RefreshCw size={16} className={loading ? "spin" : ""} /> {loading ? "Fetching…" : "Fetch current weather"}</button></form>
      {error && <div className="notice notice-error"><AlertCircle size={17} /><span>{error}</span></div>}
    </Panel>
    {result ? <>
      <div className="weather-meta-row"><span><span className="source-indicator" />{result.source || "Aviation weather provider"}</span><span>Retrieved {result.fetchedAt ? new Date(result.fetchedAt).toLocaleString("en-GB") : "just now"}</span><Pill tone={result.metar?.raw || result.metar?.rawOb ? "green" : "amber"}>{result.metar?.raw || result.metar?.rawOb ? "METAR returned" : "No current METAR"}</Pill></div>
      <div className="weather-grid">
        <Panel title="METAR observation" subtitle={result.metar?.observationTime ? "Observation time " + new Date(result.metar.observationTime).toLocaleString("en-GB") : "Latest available station report"}><div className="weather-report"><div className="weather-report-icon"><Wind size={22} /></div><p>{result.metar?.raw || result.metar?.rawOb || result.metar?.raw_text || "The provider returned no current METAR for this station."}</p></div><div className="weather-subfacts"><Fact label="Wind" value={result.metar?.wind || "See raw report"} /><Fact label="Visibility" value={result.metar?.visibility || "See raw report"} /><Fact label="Temperature" value={result.metar?.temperature !== undefined && result.metar?.temperature !== null ? result.metar.temperature + "°C" : "See raw report"} /><Fact label="Altimeter" value={result.metar?.altimeter || "See raw report"} /></div></Panel>
        <Panel title="Terminal forecast (TAF)" subtitle="Forecast validity depends on the report issued by the provider"><div className="weather-report"><div className="weather-report-icon forecast"><CloudSun size={22} /></div><p>{result.taf?.raw || result.taf?.rawTAF || result.taf?.raw_text || "The provider returned no TAF for this station."}</p></div><div className="notice notice-info"><AlertCircle size={15} /><span>METARs are observations; TAFs are forecasts. Check report issue times and validity periods before relying on them in your simulation.</span></div></Panel>
      </div>
    </> : <EmptyState icon={CloudSun} title="No weather loaded" text="Search an ICAO code to fetch a current report. FlyTech does not fabricate missing observations or forecasts." />}
    <div className="source-caption"><ShieldCheck size={14} />Public aviation data via Aviation Weather Center. Subject to upstream availability and rate limits.</div>
  </>;
}

function Traffic({ traffic, refreshTraffic, loading }) {
  const [filter, setFilter] = useState("");
  useEffect(() => { refreshTraffic(); }, []);
  const pilots = traffic?.pilots || [];
  const controllers = traffic?.controllers || [];
  const matching = pilots.filter(item => [item.callsign, item.name, item.flight_plan?.departure, item.flight_plan?.arrival, item.flight_plan?.aircraft].join(" ").toLowerCase().includes(filter.toLowerCase()));
  return <>
    <SectionHeading eyebrow="ONLINE NETWORK" title="Live network" subtitle="Public VATSIM network data, retrieved directly through the FlyTech server." action={<button className="button-secondary" onClick={refreshTraffic} disabled={loading}><RefreshCw size={15} className={loading ? "spin" : ""} /> Refresh feed</button>} />
    {traffic?.update_timestamp && <div className="weather-meta-row"><span><span className="source-indicator" />VATSIM public data feed</span><span>Feed timestamp {new Date(traffic.update_timestamp).toLocaleString("en-GB")}</span><Pill tone="green">Live source</Pill></div>}
    {traffic?.error && <div className="notice notice-error"><AlertCircle size={17} />{traffic.error}</div>}
    <div className="network-summary"><div><span>Logged-on pilots</span><strong>{formatNumber(pilots.length)}</strong><small>Current provider response</small></div><div><span>Controllers</span><strong>{formatNumber(controllers.length)}</strong><small>Current provider response</small></div><div><span>Flight plans</span><strong>{formatNumber(pilots.filter(p => p.flight_plan).length)}</strong><small>Pilots with a flight plan</small></div><div><span>Feed status</span><strong className="network-feed-status">{traffic ? "Retrieved" : "Not loaded"}</strong><small>{traffic ? "Actual data, not a simulated counter" : "Fetch the current feed to begin"}</small></div></div>
    <Panel title="Aircraft and flight plans" subtitle="Search callsigns, pilot names or route codes." action={<label className="table-search"><Search size={14} /><input value={filter} onChange={event => setFilter(event.target.value)} placeholder="Filter traffic…" /></label>}>
      {matching.length ? <div className="data-table-wrap"><table className="data-table"><thead><tr><th>Callsign</th><th>Pilot</th><th>Route</th><th>Aircraft</th><th>Altitude</th><th>Speed</th></tr></thead><tbody>{matching.slice(0, 200).map((pilot, index) => <tr key={pilot.cid || pilot.callsign + "-" + index}><td className="strong-cell">{pilot.callsign || "—"}</td><td>{pilot.name || "—"}</td><td><span className="route-code">{pilot.flight_plan?.departure || "—"} <ArrowRight size={12} /> {pilot.flight_plan?.arrival || "—"}</span></td><td>{pilot.flight_plan?.aircraft || "—"}</td><td>{pilot.altitude !== undefined ? formatNumber(pilot.altitude) + " ft" : "—"}</td><td>{pilot.groundspeed !== undefined ? formatNumber(pilot.groundspeed) + " kt" : "—"}</td></tr>)}</tbody></table></div> : <EmptyState icon={Radio} title={traffic ? "No traffic matched" : "Network feed not loaded"} text={traffic ? "Try a different filter. This view only shows records returned in the selected provider response." : "Fetch the current VATSIM feed to list actual active pilots."} action={!traffic && <button className="button-primary small" onClick={refreshTraffic}>Load network feed <ArrowRight size={14} /></button>} />}
    </Panel>
    <div className="source-caption"><ShieldCheck size={14} />VATSIM's public feed may lag slightly. Network status can change between refreshes.</div>
  </>;
}

function Tools() {
  const [windSpeed, setWindSpeed] = useState("12");
  const [windDirection, setWindDirection] = useState("270");
  const [runwayDirection, setRunwayDirection] = useState("250");
  const [windResult, setWindResult] = useState(null);
  const [distance, setDistance] = useState("520");
  const [groundSpeed, setGroundSpeed] = useState("145");
  const [ete, setEte] = useState(null);
  const [altitude, setAltitude] = useState("35000");
  const [tod, setTod] = useState(null);
  const [fuelBurn, setFuelBurn] = useState("2400");
  const [flightHours, setFlightHours] = useState("2.5");
  const [fuel, setFuel] = useState(null);
  const [nm, setNm] = useState("100");
  const [km, setKm] = useState(null);
  const calculateWind = event => {
    event.preventDefault();
    const values = [windSpeed, windDirection, runwayDirection].map(Number);
    if (values.some(value => !Number.isFinite(value) || value < 0)) { setWindResult({ error: "Enter valid non-negative values." }); return; }
    const angle = (values[1] - values[2]) * Math.PI / 180;
    setWindResult({ cross: Math.abs(values[0] * Math.sin(angle)), head: values[0] * Math.cos(angle) });
  };
  const calculateEte = event => {
    event.preventDefault();
    const dist = Number(distance), gs = Number(groundSpeed);
    if (!(dist >= 0) || !(gs > 0)) { setEte({ error: "Distance must be zero or greater and groundspeed must be above zero." }); return; }
    const mins = dist / gs * 60;
    setEte({ minutes: mins, display: Math.floor(mins / 60) + "h " + String(Math.round(mins % 60)).padStart(2, "0") + "m" });
  };
  const calculateTod = event => {
    event.preventDefault();
    const feet = Number(altitude);
    if (!(feet > 0)) { setTod({ error: "Enter a cruise altitude above zero." }); return; }
    setTod({ nm: feet / 1000 * 3, minutes: feet / 1000 * 3 });
  };
  const calculateFuel = event => {
    event.preventDefault();
    const burn = Number(fuelBurn), hours = Number(flightHours);
    if (!(burn >= 0) || !(hours >= 0)) { setFuel({ error: "Enter non-negative numbers." }); return; }
    setFuel({ value: burn * hours });
  };
  const convert = event => {
    event.preventDefault();
    const value = Number(nm);
    if (!(value >= 0)) { setKm({ error: "Enter a non-negative distance." }); return; }
    setKm(value * 1.852);
  };
  return <>
    <SectionHeading eyebrow="PILOT TOOLS" title="Flight calculators" subtitle="Small, transparent calculations for simulation planning. Inputs and formulas are visible; outputs are estimates, not aircraft performance data." />
    <div className="calculator-grid">
      <Panel title="Wind component" subtitle="Crosswind and headwind/tailwind component">
        <form className="calculator-form" onSubmit={calculateWind}><div className="form-two"><Field label="Wind speed (kt)"><input type="number" min="0" step="any" value={windSpeed} onChange={event => setWindSpeed(event.target.value)} required /></Field><Field label="Wind direction (° true)"><input type="number" min="0" max="360" value={windDirection} onChange={event => setWindDirection(event.target.value)} required /></Field><Field label="Runway direction (° true)"><input type="number" min="0" max="360" value={runwayDirection} onChange={event => setRunwayDirection(event.target.value)} required /></Field></div><button className="button-primary" type="submit"><Wind size={16} /> Calculate components</button></form>
        {windResult && (windResult.error ? <div className="inline-error">{windResult.error}</div> : <div className="calculation-result"><div><span>Crosswind</span><strong>{formatNumber(windResult.cross, 1)} kt</strong></div><div><span>{windResult.head >= 0 ? "Headwind" : "Tailwind"}</span><strong>{formatNumber(Math.abs(windResult.head), 1)} kt</strong></div></div>)}
        <div className="formula-note">Crosswind = wind speed × sin(angle difference). The entered wind and runway directions must use the same reference.</div>
      </Panel>
      <Panel title="Estimated en-route time" subtitle="Simple distance ÷ groundspeed calculation">
        <form className="calculator-form" onSubmit={calculateEte}><div className="form-two"><Field label="Distance (NM)"><input type="number" min="0" step="any" value={distance} onChange={event => setDistance(event.target.value)} required /></Field><Field label="Average groundspeed (kt)"><input type="number" min="0.1" step="any" value={groundSpeed} onChange={event => setGroundSpeed(event.target.value)} required /></Field></div><button className="button-primary" type="submit"><Clock3 size={16} /> Calculate ETE</button></form>
        {ete && (ete.error ? <div className="inline-error">{ete.error}</div> : <div className="large-calculation"><span>Estimated time en route</span><strong>{ete.display}</strong><small>{formatNumber(ete.minutes, 1)} minutes, excluding taxi, climb/descent variation and delays.</small></div>)}
      </Panel>
      <Panel title="Top of descent estimate" subtitle="Rule-of-thumb estimate only">
        <form className="calculator-form" onSubmit={calculateTod}><Field label="Cruise altitude (ft)"><input type="number" min="1" step="1" value={altitude} onChange={event => setAltitude(event.target.value)} required /></Field><button className="button-primary" type="submit"><ArrowDownRight size={16} /> Estimate TOD distance</button></form>
        {tod && (tod.error ? <div className="inline-error">{tod.error}</div> : <div className="large-calculation"><span>Approximate distance before level-off target</span><strong>{formatNumber(tod.nm)} NM</strong><small>Uses 3 NM per 1,000 ft to a sea-level reference. Adjust for actual constraints, winds, descent profile and add-on procedures.</small></div>)}
      </Panel>
      <Panel title="Fuel burn estimate" subtitle="Uses the burn rate you enter; not an aircraft-specific performance model">
        <form className="calculator-form" onSubmit={calculateFuel}><div className="form-two"><Field label="Burn rate (units/hour)"><input type="number" min="0" step="any" value={fuelBurn} onChange={event => setFuelBurn(event.target.value)} required /></Field><Field label="Flight time (hours)"><input type="number" min="0" step="any" value={flightHours} onChange={event => setFlightHours(event.target.value)} required /></Field></div><button className="button-primary" type="submit"><Fuel size={16} /> Calculate fuel used</button></form>
        {fuel && (fuel.error ? <div className="inline-error">{fuel.error}</div> : <div className="large-calculation"><span>Estimated consumption</span><strong>{formatNumber(fuel.value, 1)} units</strong><small>Burn rate × flight time. Add reserves and taxi fuel separately using your aircraft/add-on documentation.</small></div>)}
      </Panel>
      <Panel title="Distance conversion" subtitle="Nautical miles to kilometres">
        <form className="calculator-form" onSubmit={convert}><Field label="Distance (NM)"><input type="number" min="0" step="any" value={nm} onChange={event => setNm(event.target.value)} required /></Field><button className="button-primary" type="submit"><ArrowRight size={16} /> Convert to kilometres</button></form>
        {km !== null && (typeof km === "object" ? <div className="inline-error">{km.error}</div> : <div className="large-calculation"><span>Equivalent distance</span><strong>{formatNumber(km, 2)} km</strong><small>1 nautical mile = 1.852 kilometres.</small></div>)}
      </Panel>
      <Panel title="Calculator policy" subtitle="How to interpret results">
        <div className="provenance-note"><ShieldCheck size={19} /><p>FlyTech shows the calculation and the assumptions beside the result. These tools do not validate take-off/landing performance, fuel reserves, alternate requirements, or certified operational limits. Use the documentation for your specific add-on and the rules of your simulation network.</p></div>
      </Panel>
    </div>
  </>;
}

function Checklists({ aircraft, state, onChange, user }) {
  const [phase, setPhase] = useState("Pre-flight");
  const checklist = CHECKLISTS[phase] || [];
  const checked = state[phase] || {};
  const complete = checklist.filter((_, index) => checked[index]).length;
  const toggle = index => onChange({ ...state, [phase]: { ...checked, [index]: !checked[index] } });
  const reset = () => { if (window.confirm("Reset the checked items in this phase?")) onChange({ ...state, [phase]: {} }); };
  return <>
    <SectionHeading eyebrow="COCKPIT WORKFLOW" title="Checklists" subtitle="A configurable general-purpose flow for flight simulation. These are not manufacturer-approved aircraft checklists." action={<Pill tone="muted">{aircraft.icao} selected</Pill>} />
    <div className="checklist-layout">
      <aside className="checklist-phases panel">
        <div className="panel-heading"><div><h2>Phases</h2><p>Choose the current stage</p></div></div>
        {Object.keys(CHECKLISTS).map((item, index) => <button key={item} className={phase === item ? "active" : ""} onClick={() => setPhase(item)}><span className="phase-number">{String(index + 1).padStart(2, "0")}</span><span>{item}</span><ChevronRight size={15} /></button>)}
        <div className="checklist-sync-note"><ShieldCheck size={15} /><span>{user ? "Your progress syncs to your account when changes are saved." : "Progress is saved in this browser. Sign in to sync between devices."}</span></div>
      </aside>
      <div className="checklist-workspace">
        <Panel title={phase} subtitle={aircraft.name + " · General simulation workflow"} action={<span className="count-chip">{complete}/{checklist.length}</span>}>
          <div className="check-progress"><div><span>Phase progress</span><strong>{Math.round(complete / checklist.length * 100)}%</strong></div><div className="progress-track"><span style={{ width: (complete / checklist.length * 100) + "%" }} /></div></div>
          <div className="checklist-items">{checklist.map((item, index) => <label key={item} className={"checklist-item " + (checked[index] ? "done" : "")}><input type="checkbox" checked={!!checked[index]} onChange={() => toggle(index)} /><span className="custom-check">{checked[index] && <Check size={14} />}</span><span className="checklist-item-text">{item}</span><span className="item-state">{checked[index] ? "Checked" : "Pending"}</span></label>)}</div>
          <div className="panel-button-row"><button className="button-secondary" onClick={reset}><RefreshCw size={15} /> Reset this phase</button><button className="button-primary" onClick={() => setPhase(Object.keys(CHECKLISTS)[(Object.keys(CHECKLISTS).indexOf(phase) + 1) % Object.keys(CHECKLISTS).length])}>Next phase <ArrowRight size={15} /></button></div>
        </Panel>
        <div className="notice notice-info"><AlertCircle size={16} /><span>Use the aircraft add-on's actual checklist for aircraft-specific procedure items. FlyTech's general list is a personal workflow aid only.</span></div>
      </div>
    </div>
  </>;
}

function Logbook({ flights, plans, saveFlight, navigate }) {
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ flight: "", dep: "", arr: "", aircraft: "", duration: "", flight_date: new Date().toISOString().slice(0, 10), notes: "" });
  const [filter, setFilter] = useState("");
  const [saving, setSaving] = useState(false);
  const visible = flights.filter(item => [item.flight, item.dep, item.arr, item.aircraft, item.notes].join(" ").toLowerCase().includes(filter.toLowerCase()));
  const update = key => event => setForm(prev => ({ ...prev, [key]: event.target.value }));
  const submit = async event => {
    event.preventDefault();
    if (form.dep && !icaoValid(form.dep)) { alert("Departure must be a four-character ICAO code."); return; }
    if (form.arr && !icaoValid(form.arr)) { alert("Arrival must be a four-character ICAO code."); return; }
    setSaving(true);
    try {
      await saveFlight({ ...form, dep: form.dep.toUpperCase(), arr: form.arr.toUpperCase(), source: "manual" });
      setForm({ flight: "", dep: "", arr: "", aircraft: "", duration: "", flight_date: new Date().toISOString().slice(0, 10), notes: "" });
      setAdding(false);
    } finally { setSaving(false); }
  };
  const usePlan = plan => {
    setForm(prev => ({ ...prev, flight: plan.flight_number || "", dep: plan.dep || "", arr: plan.arr || "", aircraft: plan.aircraft || "", duration: plan.ete ? String(plan.ete) : "", flight_date: plan.flight_date || new Date().toISOString().slice(0, 10), notes: "Added from saved dispatch " + (plan.title || "") }));
    setAdding(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  return <>
    <SectionHeading eyebrow="PERSONAL FLIGHT RECORDS" title="Flight logbook" subtitle="Record and review your simulator flights. Records saved after sign-in are available across devices." action={<button className="button-primary" onClick={() => setAdding(value => !value)}><Plus size={16} /> Add flight</button>} />
    {adding && <Panel title="New logbook entry" subtitle="Enter the information you want to retain. Leave fields blank if you do not know them.">
      <form className="logbook-form" onSubmit={submit}>
        <Field label="Flight number / callsign"><input value={form.flight} onChange={update("flight")} placeholder="e.g. ECV214" /></Field>
        <Field label="Departure ICAO"><input value={form.dep} onChange={update("dep")} maxLength={4} placeholder="LIRF" /></Field>
        <Field label="Arrival ICAO"><input value={form.arr} onChange={update("arr")} maxLength={4} placeholder="LGTS" /></Field>
        <Field label="Aircraft"><select value={form.aircraft} onChange={update("aircraft")}><option value="">Choose aircraft</option>{AIRCRAFT.map(item => <option value={item.icao} key={item.icao}>{item.icao} — {item.name}</option>)}</select></Field>
        <Field label="Duration in minutes"><input type="number" min="0" max="2000" value={form.duration} onChange={update("duration")} placeholder="e.g. 95" /></Field>
        <Field label="Flight date"><input type="date" value={form.flight_date} onChange={update("flight_date")} /></Field>
        <Field label="Notes"><textarea value={form.notes} onChange={update("notes")} rows={2} placeholder="Optional notes about the flight" /></Field>
        <div className="form-actions"><button className="button-primary" type="submit" disabled={saving}><Save size={16} /> {saving ? "Saving…" : "Save flight"}</button><button type="button" className="button-secondary" onClick={() => setAdding(false)}>Cancel</button></div>
      </form>
    </Panel>}
    {plans.length > 0 && <Panel title="Start from a saved dispatch" subtitle="Pre-fill a logbook entry with one of your saved flight plans"><div className="dispatch-shortcuts">{plans.slice(0, 3).map(item => <button key={item.id} onClick={() => usePlan(item)}><span><strong>{item.dep || "----"} <ArrowRight size={13} /> {item.arr || "----"}</strong><small>{item.flight_number || item.title || "Flight plan"}</small></span><Plus size={16} /></button>)}</div></Panel>}
    <Panel title="Flight history" subtitle={flights.length + " saved flight record" + (flights.length === 1 ? "" : "s")} action={<label className="table-search"><Search size={14} /><input value={filter} onChange={event => setFilter(event.target.value)} placeholder="Search logbook…" /></label>}>
      {visible.length ? <div className="data-table-wrap"><table className="data-table"><thead><tr><th>Flight</th><th>Route</th><th>Aircraft</th><th>Duration</th><th>Date</th><th>Entry type</th></tr></thead><tbody>{visible.map(item => <tr key={item.id}><td className="strong-cell">{item.flight || "Manual flight"}</td><td><span className="route-code">{item.dep || "—"} <ArrowRight size={12} /> {item.arr || "—"}</span></td><td>{item.aircraft || "—"}</td><td>{displayDuration(item.duration)}</td><td>{formatDate(item.flight_date || item.created_at)}</td><td><Pill tone={item.source === "simulator" ? "green" : "muted"}>{item.source === "simulator" ? "Simulator" : "Manual"}</Pill></td></tr>)}</tbody></table></div> : <EmptyState icon={BookOpen} title={flights.length ? "No matching flights" : "No flights recorded yet"} text={flights.length ? "Try another search term." : "Create your first entry manually or start from a saved dispatch. Automatic recording will require a connected simulator companion."} action={!adding && <button className="button-secondary small" onClick={() => setAdding(true)}><Plus size={14} /> Add a flight</button>} />}
    </Panel>
    <div className="source-caption"><ShieldCheck size={14} />Manually entered records are not independently verified. Automatic records are labelled separately when simulator telemetry is connected.</div>
  </>;
}

function Scratchpad({ value, setValue, save, saved, user }) {
  const [tab, setTab] = useState("notes");
  return <>
    <SectionHeading eyebrow="PERSONAL FLIGHT NOTES" title="Scratchpad" subtitle="Keep clearances, ATIS, frequencies, taxi notes and quick reminders together. This is a note-taking aid, not a recording of ATC communications." action={<button className="button-primary" onClick={save}><Save size={16} /> Save notes</button>} />
    <div className="scratch-layout">
      <Panel title="Flight notes" subtitle={user ? "Cloud save is available for this account." : "Saved locally on this device until you sign in."} action={<Pill tone={saved ? "green" : "amber"}>{saved ? "SAVED" : "UNSAVED CHANGES"}</Pill>}>
        <div className="scratch-toolbar"><button className={tab === "notes" ? "active" : ""} onClick={() => setTab("notes")}><NotebookPen size={15} /> Notes</button><button className={tab === "template" ? "active" : ""} onClick={() => setTab("template")}><FileText size={15} /> Clearance template</button></div>
        {tab === "notes" ? <textarea className="scratch-editor" value={value} onChange={event => setValue(event.target.value)} placeholder={"ATIS / weather:\n\nClearance:\n\nTaxi route:\n\nApproach notes:\n\nOther:"} spellCheck /> : <div className="clearance-template"><strong>Quick clearance note</strong><p>Copy this outline into Notes and fill in the details received from your simulation network.</p><pre>{"Clearance limit:\nSID / initial heading:\nInitial altitude:\nSquawk:\nDeparture frequency:\nTaxi route:\nATIS:\nApproach / runway:\n"} </pre><button className="button-secondary" onClick={() => { setValue(value + (value ? "\n\n" : "") + "Clearance limit:\nSID / initial heading:\nInitial altitude:\nSquawk:\nDeparture frequency:\nTaxi route:\nATIS:\nApproach / runway:\n"); setTab("notes"); }}><Plus size={14} /> Add template to notes</button></div>}
        <div className="scratch-footer"><span>{value.length} characters · {value.split(/\s+/).filter(Boolean).length} words</span><span>{user ? "Cloud account" : "This browser only"}</span></div>
      </Panel>
      <aside className="scratch-aside"><Panel title="A note on sync" subtitle="Where this information is stored"><div className="provenance-note"><Database size={18} /><p>When signed in, Save notes sends the current scratchpad to your account over the authenticated API. Without an account, it is saved only in this browser's local storage.</p></div><button className="button-secondary full" onClick={() => navigator.clipboard?.writeText(value).then(() => window.dispatchEvent(new CustomEvent("flightdeck-copy-ok"))).catch(() => {})}><FileText size={15} /> Copy notes to clipboard</button></Panel><Panel title="Keep in mind" subtitle="Simulation use"><div className="quiet-callout"><ShieldCheck size={19} /><span>Do not store passwords, access tokens or other secrets in cockpit notes. Treat the scratchpad as ordinary text.</span></div></Panel></aside>
    </div>
  </>;
}

function Integrations({ status, error, onRefresh, navigate }) {
  const items = status?.integrations || [];
  const IconFor = name => name === "SimBrief" ? Route : name === "Aviation Weather" ? CloudSun : name === "Aviation news" ? Newspaper : name === "Welcome email" ? Mail : name === "VATSIM" ? Radio : name === "Airport data" ? MapPin : name === "MSFS 2024" ? Activity : name === "Navigraph Charts" ? Map : name === "NewSky" ? Plane : Plug;
  const toneFor = state => state === "available" || state === "configured" ? "green" : state === "needs-setup" ? "amber" : "muted";
  return <>
    <SectionHeading eyebrow="EXTERNAL SERVICES" title="Connections" subtitle="A transparent view of available data providers, optional services and local simulator requirements." action={<button className="button-secondary" onClick={onRefresh}><RefreshCw size={15} /> Refresh status</button>} />
    <div className="integration-callout"><div className="integration-callout-icon"><ShieldCheck size={20} /></div><div><strong>No hidden connected accounts</strong><p>FlyTech shows a service as connected only when it is actually configured or has returned data. Optional integrations remain clearly marked until they are set up.</p></div></div>
    {error && <div className="notice notice-error"><AlertCircle size={16} />{error}</div>}
    <div className="integration-grid">{items.map(item => { const Icon = IconFor(item.name); return <article className="integration-card" key={item.name}><div className="integration-card-top"><div className="integration-icon"><Icon size={20} /></div><Pill tone={toneFor(item.status)}>{item.label || titleCase(item.status)}</Pill></div><h2>{item.name}</h2><p>{item.description}</p>{item.detail && <small>{item.detail}</small>}{item.url && <a href={item.url} target="_blank" rel="noreferrer" className="source-link">Provider documentation <ExternalLink size={13} /></a>}{item.name === "MSFS 2024" && <button className="text-action" onClick={() => navigate("simulator")}>Open setup guide <ArrowRight size={14} /></button>}</article>; })}</div>
    {!items.length && !error && <EmptyState icon={Plug} title="Loading connection status" text="FlyTech is checking server configuration and provider availability." />}
    <div className="integration-disclaimer"><LockKeyhole size={16} /><span>API tokens remain on the server. Never put provider secrets in frontend environment variables or public JavaScript files.</span></div>
  </>;
}

function Settings({ user, setUser, onSignedIn, theme, setTheme, aircraft, setAircraft, signOut, pairingCode, generatePairingCode, health, navigate, notify }) {
  const [mode, setMode] = useState("login");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [authBusy, setAuthBusy] = useState(false);
  const [authError, setAuthError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [accountSaved, setAccountSaved] = useState(false);
  const submitAuth = async event => {
    event.preventDefault();
    setAuthError("");
    setAuthBusy(true);
    try {
      const endpoint = mode === "login" ? "/auth/login" : "/auth/register";
      const body = mode === "login" ? { username, password } : { username, email, display_name: displayName || username, password };
      const result = await api(endpoint, { method: "POST", body: JSON.stringify(body) });
      setUser(result.user);
      setPassword("");
      setAccountSaved(true);
      if (mode === "register" && notify) notify(result.welcomeEmail === "enabled" ? "Welcome to FlyTech. Your welcome email is being sent." : "Account created. Welcome-email delivery needs server configuration.", "success");
      await onSignedIn();
    } catch (error) { setAuthError(error.message); }
    finally { setAuthBusy(false); }
  };
  const copyPairingCode = () => {
    if (!pairingCode?.code || !navigator.clipboard) return;
    navigator.clipboard.writeText(pairingCode.code).catch(() => {});
  };
  return <>
    <SectionHeading eyebrow="PERSONAL CONFIGURATION" title="Settings" subtitle="Manage your pilot account, preferred aircraft, appearance and simulator connection." />
    <div className="settings-grid">
      <div className="settings-main">
        <Panel title="Pilot account" subtitle={user ? "Your profile is authenticated and can sync data." : "Create an account to keep saved flight plans, logbook entries and notes across devices."}>
          {user ? <div className="account-summary"><div className="account-avatar">{userInitials(user)}</div><div className="account-summary-meta"><strong>{user.display_name || user.username}</strong><span>@{user.username}</span><small>Member since {formatDate(user.created_at)}</small></div><Pill tone="green">Signed in</Pill><button className="button-secondary" onClick={signOut}><LogOut size={15} /> Sign out</button></div> : <form className="account-form" onSubmit={submitAuth}>
            <div className="auth-mode"><button type="button" className={mode === "login" ? "active" : ""} onClick={() => { setMode("login"); setAuthError(""); }}>Sign in</button><button type="button" className={mode === "register" ? "active" : ""} onClick={() => { setMode("register"); setAuthError(""); }}>Create account</button></div>
            {mode === "register" && <Field label="Display name"><input value={displayName} onChange={event => setDisplayName(event.target.value)} placeholder="How other pilots see you" maxLength={60} /></Field>}
            <Field label="Username"><input value={username} onChange={event => setUsername(event.target.value)} autoComplete="username" required minLength={3} maxLength={24} placeholder="Your username" /></Field>
            {mode === "register" && <Field label="Email address" hint="Required for your welcome email. Password recovery is not enabled yet."><input type="email" value={email} onChange={event => setEmail(event.target.value)} autoComplete="email" placeholder="you@example.com" required /></Field>}
            <Field label="Password" hint={mode === "register" ? "Use at least 8 characters." : undefined}><div className="password-field"><input type={showPassword ? "text" : "password"} value={password} onChange={event => setPassword(event.target.value)} autoComplete={mode === "login" ? "current-password" : "new-password"} minLength={mode === "register" ? 8 : undefined} required /><button type="button" aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword(value => !value)}>{showPassword ? <LockKeyhole size={15} /> : <UserRound size={15} />}</button></div></Field>
            {authError && <div className="notice notice-error"><AlertCircle size={16} /><span>{authError}</span></div>}
            <button className="button-primary full" type="submit" disabled={authBusy}>{authBusy ? "Please wait…" : mode === "login" ? <><LogIn size={16} /> Sign in securely</> : <><UserRound size={16} /> Create your account</>}</button>
            <div className="auth-privacy"><LockKeyhole size={14} /><span>Passwords are processed by the server. Your session uses an HTTP-only cookie when deployed over HTTPS.</span></div>
          </form>}
        </Panel>

        <Panel title="Microsoft Flight Simulator 2024" subtitle="Connect the desktop simulator to FlyTech so your other devices can receive live telemetry.">
          <div className="bridge-summary"><div className="bridge-icon"><Activity size={21} /></div><div><strong>{health?.database ? "Pairing service available" : "Cloud database required"}</strong><p>The Windows companion uses Microsoft SimConnect on the same PC as the simulator. It sends a limited live telemetry snapshot to your signed-in FlyTech account; a phone browser cannot read the simulator process directly.</p></div><Pill tone={health?.database && user ? "green" : "amber"}>{user ? (health?.database ? "READY TO PAIR" : "SETUP REQUIRED") : "SIGN IN FIRST"}</Pill></div>
          {user ? <div className="pairing-area"><div className="pairing-instructions"><strong>1. Create a one-time pairing code</strong><p>Open this page on the device where you are signed in, generate a code, then enter it in the Windows companion running on the PC with MSFS 2024.</p><button className="button-primary" onClick={generatePairingCode} disabled={!health?.database}><Zap size={15} /> Generate pairing code</button></div>{pairingCode && <div className="pairing-code-box"><span>ONE-TIME CODE</span><strong>{pairingCode.code}</strong><small>Expires {pairingCode.expiresAt ? new Date(pairingCode.expiresAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) : "soon"} · use once</small><button className="button-secondary" onClick={copyPairingCode}>Copy code</button></div>}</div> : <div className="notice notice-info"><LockKeyhole size={16} /><span>Sign in to create a pairing code. Pairing is specific to your account. The companion receives its own revocable token and never receives your browser session cookie.</span></div>}
          <div className="bridge-next-steps"><span>2</span><p><strong>Install the companion</strong><br />The Windows companion requires the Microsoft Flight Simulator 2024 SDK's managed SimConnect library. Build instructions are included in the repository under <code>companion/msfs-bridge</code>.</p></div>
          <div className="bridge-next-steps"><span>3</span><p><strong>Keep the companion running</strong><br />With MSFS open and a flight loaded, the companion sends current position, altitude, airspeed, groundspeed, heading and vertical speed to FlyTech. The status updates after live telemetry reaches FlyTech.</p></div>
          <button className="button-secondary" onClick={() => navigate("simulator")}><Activity size={15} /> Open the complete MSFS setup guide <ArrowRight size={14} /></button>
        </Panel>

        <Panel title="Data and privacy" subtitle="Understand what syncs and where it is stored">
          <div className="privacy-list"><div><Database size={17} /><span><strong>Cloud records</strong><small>Flight plans, logbook entries and scratchpad are tied to your account.</small></span></div><div><Smartphone size={17} /><span><strong>Local settings</strong><small>Theme and temporary form state are kept on this browser unless saved to account preferences.</small></span></div><div><ShieldCheck size={17} /><span><strong>Simulator telemetry</strong><small>The last received telemetry snapshot belongs to your account and is not shown publicly.</small></span></div></div>
        </Panel>
      </div>
      <aside className="settings-side">
        <Panel title="Appearance" subtitle="Display preferences">
          <div className="theme-choice"><button className={theme === "dark" ? "active" : ""} onClick={() => setTheme("dark")}><Moon size={17} /><span><strong>Dark</strong><small>Low-glare cockpit</small></span>{theme === "dark" && <Check size={15} />}</button><button className={theme === "light" ? "active" : ""} onClick={() => setTheme("light")}><Sun size={17} /><span><strong>Light</strong><small>Bright workspace</small></span>{theme === "light" && <Check size={15} />}</button></div>
        </Panel>
        <Panel title="Default aircraft" subtitle="Used in the EFB header and cockpit tools">
          <Field label="Aircraft profile"><select value={aircraft} onChange={event => setAircraft(event.target.value)}>{AIRCRAFT.map(item => <option key={item.icao} value={item.icao}>{item.icao} — {item.name}</option>)}</select></Field><div className="aircraft-detail"><div className="aircraft-detail-mark"><Plane size={22} /></div><div><strong>{AIRCRAFT.find(item => item.icao === aircraft)?.name || aircraft}</strong><span>{AIRCRAFT.find(item => item.icao === aircraft)?.family || "Aircraft profile"}</span><small>Profile selection only; aircraft performance data is not automatically assumed.</small></div></div>
        </Panel>
        <Panel title="Connection status" subtitle="Current environment checks"><div className="connection-status-list"><div><span>API process</span><Pill tone={health?.ok ? "green" : "amber"}>{health?.ok ? "Responding" : "Unavailable"}</Pill></div><div><span>Database</span><Pill tone={health?.database ? "green" : "amber"}>{health?.database ? "Connected" : "Not configured"}</Pill></div><div><span>Account</span><Pill tone={user ? "green" : "muted"}>{user ? "Signed in" : "Guest"}</Pill></div></div></Panel>
      </aside>
    </div>
  </>;
}



function NewsPage() {
  const [articles, setArticles] = useState([]);
  const [category, setCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await api("/news");
      setArticles(result.articles || []);
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { void load(); }, [load]);
  const filtered = articles.filter(article => {
    const matchesCategory = category === "all" || article.category === category;
    const searchable = [article.title, article.source, article.summary].join(" ").toLowerCase();
    return matchesCategory && searchable.includes(search.toLowerCase());
  });
  return <>
    <SectionHeading eyebrow="THE FLYTECH BRIEFING" title="Aviation news" subtitle="A live reading list for airline operations, aviation technology and flight simulation. Articles open at their original publishers." action={<button className="button-secondary" onClick={() => void load()} disabled={loading}><RefreshCw size={15} /> Refresh feed</button>} />
    <div className="news-intro">
      <div className="news-intro-icon"><Newspaper size={22} /></div>
      <div><strong>Stay current between flights</strong><p>Stories are fetched from public news feeds and cached briefly to keep the page responsive. FlyTech does not write or alter publisher articles.</p></div>
      <div className="news-intro-meta"><span className="status-dot green" /> Public RSS feed</div>
    </div>
    <div className="news-tools">
      <div className="filter-tabs" aria-label="Filter news">
        {[["all", "All stories"], ["aviation", "Aviation"], ["simulation", "Flight simulation"]].map(([value, label]) => <button key={value} className={category === value ? "active" : ""} onClick={() => setCategory(value)}>{label}</button>)}
      </div>
      <label className="news-search"><Search size={16} /><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search headlines or publishers" /></label>
    </div>
    {error && <div className="notice notice-error"><AlertCircle size={16} /><span>{error} The news provider may be temporarily unavailable; try again in a moment.</span></div>}
    {loading ? <EmptyState icon={Newspaper} title="Loading the briefing" text="Fetching current stories from the public news feeds." /> : filtered.length ? <div className="news-grid">
      {filtered.map((article, index) => <article className="news-card" key={article.link || article.title || index}>
        <div className="news-card-meta"><span className="news-source">{article.source || "External publisher"}</span><Pill tone={article.category === "simulation" ? "blue" : "muted"}>{article.category === "simulation" ? "SIMULATION" : "AVIATION"}</Pill></div>
        <h2>{article.title}</h2>
        {article.summary && <p>{article.summary}</p>}
        <div className="news-card-footer"><time>{formatDate(article.publishedAt)}</time><a href={article.link} target="_blank" rel="noreferrer">Read original <ArrowUpRight size={14} /></a></div>
      </article>)}
    </div> : <EmptyState icon={Newspaper} title={error ? "The briefing is unavailable" : "No matching stories"} text={error ? "The feed did not return any current stories. Your other FlyTech tools are unaffected." : "Try another category or clear the search field."} action={error ? <button className="button-secondary" onClick={() => void load()}><RefreshCw size={14} /> Try again</button> : undefined} />}
    <p className="provider-footnote">External news can contain errors or opinions. Check the original publisher for full context; headlines and summaries are not operational flight information.</p>
  </>;
}

function PairingGuide({ user, health, pairingCode, generatePairingCode, navigate, notify }) {
  const [copied, setCopied] = useState(false);
  const copyCode = async () => {
    if (!pairingCode?.code) return;
    try {
      await navigator.clipboard.writeText(pairingCode.code);
      setCopied(true);
      if (notify) notify("Pairing code copied.");
    } catch {
      if (notify) notify("Clipboard access is unavailable. Select and copy the code manually.", "error");
    }
  };
  return <>
    <SectionHeading eyebrow="SIMULATOR CONNECTION" title="Connect MSFS 2024" subtitle="Pair the Windows companion once, then keep FlyTech open on your PC, tablet or phone while you fly." action={<a className="button-secondary" href="https://github.com/echoairgroup/flightdeck-efb/tree/build/real-efb-platform/companion/msfs-bridge" target="_blank" rel="noreferrer"><FileText size={15} /> Companion guide <ExternalLink size={13} /></a>} />
    <div className="pairing-hero">
      <div className="pairing-hero-icon"><Activity size={26} /></div>
      <div className="pairing-hero-copy"><span className="eyebrow">HOW THE CONNECTION WORKS</span><h2>Your simulator stays on your PC.</h2><p>MSFS 2024 exposes aircraft data through SimConnect. A small Windows companion reads supported values and sends them over HTTPS to your FlyTech account. The website itself cannot inspect the simulator on another device.</p></div>
      <div className="pairing-hero-status"><Pill tone={health?.database && user ? "green" : "amber"}>{health?.database && user ? "READY TO PAIR" : user ? "DATABASE CHECK NEEDED" : "SIGN IN FIRST"}</Pill><span>{health?.database ? "Cloud storage responding" : "Cloud storage not confirmed"}</span></div>
    </div>
    {!user && <div className="notice notice-info"><LockKeyhole size={17} /><span>Sign in to your FlyTech account before generating a pairing code. <button className="inline-link" onClick={() => navigate("settings")}>Open account settings</button></span></div>}
    <div className="pairing-guide-grid">
      <Panel title="Before you start" subtitle="Check these requirements on the simulator PC">
        <div className="pairing-checklist">
          <div><CheckCircle2 size={18} /><span><strong>Windows PC</strong><small>The companion must run on the same PC as MSFS 2024.</small></span></div>
          <div><CheckCircle2 size={18} /><span><strong>MSFS 2024 SDK</strong><small>Install it through Developer Mode in the simulator.</small></span></div>
          <div><CheckCircle2 size={18} /><span><strong>Visual Studio</strong><small>Install the .NET desktop workload and .NET Framework 4.8 targeting pack.</small></span></div>
          <div><CheckCircle2 size={18} /><span><strong>Cloud account</strong><small>Your signed-in account and FlyTech database must both be available.</small></span></div>
        </div>
        <a className="source-link pairing-resource-link" href="https://docs.flightsimulator.com/msfs2024/retail/programming-apis/simconnect/simconnect-sdk/" target="_blank" rel="noreferrer">Microsoft SimConnect documentation <ExternalLink size={13} /></a>
      </Panel>
      <Panel title="Pair your device" subtitle="Use a one-time code that expires after five minutes">
        <ol className="pairing-steps">
          <li><span>1</span><div><strong>Sign in here</strong><p>Use the FlyTech account that should own this simulator connection.</p></div></li>
          <li><span>2</span><div><strong>Generate the code</strong><p>Create a short-lived code below. It can be used once and should not be shared.</p></div></li>
          <li><span>3</span><div><strong>Open the Windows companion</strong><p>Enter the public HTTPS URL of this website and the code in the companion window.</p></div></li>
          <li><span>4</span><div><strong>Load into a flight</strong><p>Keep the companion running after MSFS is open and a flight is loaded.</p></div></li>
          <li><span>5</span><div><strong>Confirm live data</strong><p>Return to Overview. Status only changes to connected after genuine telemetry reaches the server.</p></div></li>
        </ol>
        {user ? <div className="pairing-code-actions">
          <button className="button-primary" onClick={() => { setCopied(false); generatePairingCode(); }} disabled={!health?.database}><Zap size={15} /> Generate one-time code</button>
          {!health?.database && <small>Pairing is disabled until the cloud database responds.</small>}
          {pairingCode && <div className="pairing-code-box pairing-code-large"><span>ONE-TIME PAIRING CODE</span><strong>{pairingCode.code}</strong><small>Expires {pairingCode.expiresAt ? new Date(pairingCode.expiresAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) : "in five minutes"} · single use</small><button className="button-secondary" onClick={copyCode}><FileText size={14} /> {copied ? "Copied" : "Copy code"}</button></div>}
        </div> : <button className="button-primary" onClick={() => navigate("settings")}><LogIn size={15} /> Sign in to continue</button>}
      </Panel>
    </div>
    <Panel title="Troubleshooting" subtitle="The checks that solve most pairing issues">
      <div className="troubleshooting-grid">
        <div><strong>Code rejected or expired</strong><p>Generate a new code and enter it once. Pairing codes expire after five minutes.</p></div>
        <div><strong>Companion cannot open SimConnect</strong><p>Start MSFS 2024 first, confirm the managed SimConnect reference points to your installed SDK, then rebuild the Release x64 configuration.</p></div>
        <div><strong>Pairing works but values do not update</strong><p>Load into an actual flight, keep the companion running, and confirm the website URL uses HTTPS and its health endpoint reports database true.</p></div>
        <div><strong>You changed accounts or lost a device</strong><p>Pairing is user-specific. Revoke the old companion token/device before pairing a replacement if the token may be exposed.</p></div>
      </div>
    </Panel>
    <div className="pairing-disclaimer"><ShieldCheck size={17} /><p>FlyTech is built for flight simulation, not certified navigation. Telemetry is account-scoped, and a connected status is shown only after the server receives real data. Use your aircraft add-on documentation and official sources for operational procedures.</p></div>
  </>;
}

function AirlinesPage({ user, navigate, notify }) {
  const [airlines, setAirlines] = useState([]);
  const [mine, setMine] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: "", icao_code: "", iata_code: "", callsign: "", base_icao: "", description: "" });
  const [openId, setOpenId] = useState(null);
  const [details, setDetails] = useState({});
  const [busyId, setBusyId] = useState(null);
  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await api("/airlines");
      setAirlines(result.airlines || []);
      if (user) {
        try {
          const membership = await api("/airlines/mine");
          setMine(membership.airlines || []);
        } catch { setMine([]); }
      } else setMine([]);
    } catch (loadError) {
      setError(loadError.message);
    } finally { setLoading(false); }
  }, [user]);
  useEffect(() => { void load(); }, [load]);
  const filtered = airlines.filter(item => [item.name, item.slug, item.icao_code, item.base_icao, item.description].join(" ").toLowerCase().includes(search.toLowerCase()));
  const setField = (key, value) => setForm(prev => ({ ...prev, [key]: value }));
  const createAirline = async event => {
    event.preventDefault();
    setCreating(true);
    try {
      await api("/airlines", { method: "POST", body: JSON.stringify(form) });
      setForm({ name: "", icao_code: "", iata_code: "", callsign: "", base_icao: "", description: "" });
      setFormOpen(false);
      await load();
      notify("Virtual airline created.");
    } catch (createError) { notify(createError.message, "error"); }
    finally { setCreating(false); }
  };
  const joinAirline = async item => {
    if (!user) { navigate("settings"); return; }
    setBusyId(item.id);
    try { await api("/airlines/" + encodeURIComponent(item.id) + "/join", { method: "POST", body: JSON.stringify({}) }); await load(); notify("You joined " + item.name + "."); }
    catch (joinError) { notify(joinError.message, "error"); }
    finally { setBusyId(null); }
  };
  const toggleDetails = async item => {
    if (String(openId) === String(item.id)) { setOpenId(null); return; }
    setOpenId(item.id);
    if (details[item.id]) return;
    try { const result = await api("/airlines/" + encodeURIComponent(item.id)); setDetails(prev => ({ ...prev, [item.id]: result })); }
    catch (detailError) { notify(detailError.message, "error"); }
  };
  return <>
    <SectionHeading eyebrow="VIRTUAL AVIATION" title="Virtual airlines" subtitle="Find a group to fly with, explore its fleet and routes, or create an airline for your own community." action={<button className="button-primary" onClick={() => user ? setFormOpen(value => !value) : navigate("settings")}><Plus size={15} /> {user ? "Create airline" : "Sign in to create"}</button>} />
    {formOpen && <Panel title="Create a virtual airline" subtitle="Start with the basics. You can build your fleet and route list after creation.">
      <form className="airline-create-form" onSubmit={createAirline}>
        <Field label="Airline name"><input value={form.name} onChange={event => setField("name", event.target.value)} minLength={3} maxLength={80} placeholder="Example: Skyway Virtual" required /></Field>
        <Field label="ICAO code" hint="Optional · three characters"><input value={form.icao_code} onChange={event => setField("icao_code", event.target.value.toUpperCase())} maxLength={3} placeholder="SKY" /></Field>
        <Field label="IATA code" hint="Optional · two characters"><input value={form.iata_code} onChange={event => setField("iata_code", event.target.value.toUpperCase())} maxLength={2} placeholder="SW" /></Field>
        <Field label="Callsign"><input value={form.callsign} onChange={event => setField("callsign", event.target.value)} maxLength={32} placeholder="Skyway" /></Field>
        <Field label="Home base" hint="ICAO airport code"><input value={form.base_icao} onChange={event => setField("base_icao", event.target.value.toUpperCase())} maxLength={4} placeholder="EHAM" /></Field>
        <Field label="Short description"><input value={form.description} onChange={event => setField("description", event.target.value)} maxLength={500} placeholder="What makes your airline special?" /></Field>
        <div className="airline-create-actions"><button type="button" className="button-secondary" onClick={() => setFormOpen(false)}>Cancel</button><button className="button-primary" type="submit" disabled={creating}>{creating ? "Creating…" : "Create airline"}</button></div>
      </form>
    </Panel>}
    <div className="airline-toolbar"><label className="news-search"><Search size={16} /><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search by airline, base or code" /></label><span>{airlines.length} listed {airlines.length === 1 ? "airline" : "airlines"}</span></div>
    {!user && <div className="notice notice-info"><Users size={17} /><span>You can browse airlines without signing in. Sign in to create an airline or join a crew.</span></div>}
    {error && <div className="notice notice-error"><AlertCircle size={16} />{error}</div>}
    {loading ? <EmptyState icon={Building2} title="Loading airlines" text="Fetching public airline directories." /> : filtered.length ? <div className="airline-grid">
      {filtered.map(item => {
        const joined = mine.some(membership => String(membership.id) === String(item.id));
        const detail = details[item.id];
        return <article className="airline-card" key={item.id}>
          <div className="airline-card-top"><div className="airline-emblem"><Plane size={22} /></div><Pill tone={joined ? "green" : "muted"}>{joined ? "YOUR AIRLINE" : "VIRTUAL AIRLINE"}</Pill></div>
          <h2>{item.name}</h2><p>{item.description || "A virtual airline community for flight-simulation pilots."}</p>
          <div className="airline-identifiers">{item.icao_code && <span><small>ICAO</small><strong>{item.icao_code}</strong></span>}{item.iata_code && <span><small>IATA</small><strong>{item.iata_code}</strong></span>}{item.base_icao && <span><small>BASE</small><strong>{item.base_icao}</strong></span>}</div>
          <div className="airline-stats"><span><Users size={14} /> {item.member_count || 0} pilots</span><span><Plane size={14} /> {item.fleet_count || 0} aircraft</span><span><Route size={14} /> {item.route_count || 0} routes</span></div>
          <div className="airline-card-actions"><button className="button-secondary" onClick={() => void toggleDetails(item)}>{String(openId) === String(item.id) ? "Hide details" : "Explore airline"} <ChevronRight size={14} /></button>{!joined && <button className="button-primary" onClick={() => void joinAirline(item)} disabled={busyId === item.id}>{busyId === item.id ? "Joining…" : "Join crew"}</button>}</div>
          {String(openId) === String(item.id) && <div className="airline-detail">
            {!detail ? <p>Loading airline details…</p> : <>
              <strong>Fleet</strong>{detail.fleet?.length ? <ul>{detail.fleet.map(aircraft => <li key={aircraft.id}>{aircraft.aircraft_icao} {aircraft.aircraft_name || ""}{aircraft.registration ? " · " + aircraft.registration : ""}</li>)}</ul> : <p>No aircraft have been listed yet.</p>}
              <strong>Routes</strong>{detail.routes?.length ? <ul>{detail.routes.map(route => <li key={route.id}>{route.flight_number ? route.flight_number + " · " : ""}{route.dep} → {route.arr}{route.aircraft_icao ? " · " + route.aircraft_icao : ""}</li>)}</ul> : <p>No routes have been listed yet.</p>}
              <strong>Crew</strong><p>{(detail.members || []).length ? detail.members.map(member => member.display_name || member.username).join(", ") : "No crew members listed yet."}</p>
            </>}
          </div>}
        </article>;
      })}
    </div> : <EmptyState icon={Building2} title="No airlines found" text={error ? "Public listings are not available until cloud storage is configured." : "Try another search, or create the first airline for your community."} action={user && !error ? <button className="button-primary" onClick={() => setFormOpen(true)}><Plus size={14} /> Create airline</button> : undefined} />}
  </>;
}

function CommunityPage({ user, navigate, notify }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const localDateTime = value => {
    const date = new Date(value.getTime() - value.getTimezoneOffset() * 60000);
    return date.toISOString().slice(0, 16);
  };
  const [form, setForm] = useState(() => ({ title: "", description: "", event_type: "group_flight", location: "", start_at: localDateTime(new Date(Date.now() + 86400000)), end_at: localDateTime(new Date(Date.now() + 90000000)) }));
  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try { const result = await api("/events"); setEvents(result.events || []); }
    catch (loadError) { setError(loadError.message); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);
  const setField = (key, value) => setForm(prev => ({ ...prev, [key]: value }));
  const createEvent = async event => {
    event.preventDefault();
    setCreating(true);
    try {
      await api("/events", { method: "POST", body: JSON.stringify({ ...form, start_at: new Date(form.start_at).toISOString(), end_at: new Date(form.end_at).toISOString() }) });
      setFormOpen(false);
      setForm(prev => ({ ...prev, title: "", description: "", location: "" }));
      await load();
      notify("Community event published.");
    } catch (createError) { notify(createError.message, "error"); }
    finally { setCreating(false); }
  };
  const rsvp = async (eventItem, status) => {
    if (!user) { navigate("settings"); return; }
    try {
      if (!status) await api("/events/" + encodeURIComponent(eventItem.id) + "/rsvp", { method: "DELETE" });
      else await api("/events/" + encodeURIComponent(eventItem.id) + "/rsvp", { method: "POST", body: JSON.stringify({ status }) });
      await load();
      notify(status === "going" ? "You are on the attendee list." : status === "interested" ? "Event saved as interesting." : "Your RSVP was removed.");
    } catch (rsvpError) { notify(rsvpError.message, "error"); }
  };
  const removeEvent = async eventItem => {
    if (!window.confirm("Delete this event? This cannot be undone.")) return;
    try { await api("/events/" + encodeURIComponent(eventItem.id), { method: "DELETE" }); await load(); notify("Event deleted."); }
    catch (deleteError) { notify(deleteError.message, "error"); }
  };
  return <>
    <SectionHeading eyebrow="FLYTECH COMMUNITY" title="Events & group flights" subtitle="Plan a shared flight, publish a training session, or find other pilots to fly with." action={<button className="button-primary" onClick={() => user ? setFormOpen(value => !value) : navigate("settings")}><Plus size={15} /> {user ? "Create event" : "Sign in to join"}</button>} />
    <div className="community-summary">
      <div><div className="community-summary-icon"><CalendarDays size={20} /></div><strong>{events.length}</strong><span>Upcoming events</span></div>
      <div><div className="community-summary-icon"><Users size={20} /></div><strong>{events.reduce((total, item) => total + Number(item.going_count || 0), 0)}</strong><span>Attendee places</span></div>
      <div className="community-summary-copy"><strong>Better flights together</strong><p>Use event notes to agree on simulator, aircraft, route and voice-chat details before departure.</p></div>
    </div>
    {formOpen && <Panel title="Publish a community event" subtitle="Everyone can view events; pilots need an account to RSVP.">
      <form className="event-create-form" onSubmit={createEvent}>
        <Field label="Event title"><input value={form.title} onChange={event => setField("title", event.target.value)} minLength={4} maxLength={100} placeholder="Friday evening group flight" required /></Field>
        <Field label="Event type"><select value={form.event_type} onChange={event => setField("event_type", event.target.value)}><option value="group_flight">Group flight</option><option value="training">Training</option><option value="fly_in">Fly-in</option><option value="community">Community meetup</option><option value="other">Other</option></select></Field>
        <Field label="Meeting point / voice channel"><input value={form.location} onChange={event => setField("location", event.target.value)} maxLength={120} placeholder="Discord voice channel or airport ICAO" /></Field>
        <Field label="Start"><input type="datetime-local" value={form.start_at} onChange={event => setField("start_at", event.target.value)} required /></Field>
        <Field label="End"><input type="datetime-local" value={form.end_at} onChange={event => setField("end_at", event.target.value)} required /></Field>
        <Field label="Description"><textarea value={form.description} onChange={event => setField("description", event.target.value)} maxLength={3000} rows={3} placeholder="Route, aircraft, simulator, network and preparation notes" /></Field>
        <div className="event-form-actions"><button type="button" className="button-secondary" onClick={() => setFormOpen(false)}>Cancel</button><button type="submit" className="button-primary" disabled={creating}>{creating ? "Publishing…" : "Publish event"}</button></div>
      </form>
    </Panel>}
    {!user && <div className="notice notice-info"><Users size={17} /><span>Browse upcoming events freely. Sign in to RSVP, or create an event for the community.</span></div>}
    {error && <div className="notice notice-error"><AlertCircle size={16} /><span>{error}</span></div>}
    {loading ? <EmptyState icon={CalendarDays} title="Loading the community calendar" text="Fetching published events." /> : events.length ? <div className="event-list">
      {events.map(eventItem => <article className="event-card" key={eventItem.id}>
        <div className="event-date-block"><span>{new Date(eventItem.start_at).toLocaleDateString("en-GB", { month: "short" }).toUpperCase()}</span><strong>{new Date(eventItem.start_at).toLocaleDateString("en-GB", { day: "2-digit" })}</strong><small>{new Date(eventItem.start_at).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}</small></div>
        <div className="event-card-main"><div className="event-type-row"><Pill tone="blue">{titleCase(eventItem.event_type || "group_flight")}</Pill><span>Organised by {eventItem.creator_name || "FlyTech pilot"}</span></div><h2>{eventItem.title}</h2><p>{eventItem.description || "No additional details yet."}</p><div className="event-meta-row"><span><Clock3 size={14} /> {new Date(eventItem.start_at).toLocaleString("en-GB", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>{eventItem.location && <span><MapPin size={14} /> {eventItem.location}</span>}<span><Users size={14} /> {eventItem.going_count || 0} going · {eventItem.interested_count || 0} interested</span></div></div>
        <div className="event-actions">{eventItem.my_rsvp ? <button className="button-secondary" onClick={() => void rsvp(eventItem, null)}>Cancel RSVP</button> : <><button className="button-primary" onClick={() => void rsvp(eventItem, "going")}>I'm going</button><button className="button-secondary" onClick={() => void rsvp(eventItem, "interested")}>Interested</button></>}{user && String(user.id) === String(eventItem.created_by) && <button className="icon-button" aria-label="Delete event" title="Delete event" onClick={() => void removeEvent(eventItem)}><Trash2 size={15} /></button>}</div>
      </article>)}
    </div> : <EmptyState icon={CalendarDays} title="The calendar is clear" text="No upcoming events have been published. Start the first group flight or training session." action={user ? <button className="button-primary" onClick={() => setFormOpen(true)}><Plus size={14} /> Create event</button> : undefined} />}
  </>;
}

function AcademyPage({ navigate }) {
  const learningPaths = [
    { number: "01", title: "Prepare a flight", description: "Import a SimBrief OFP, check the route and save your dispatch briefing.", icon: Route, page: "dispatch", action: "Open flight planning", level: "CORE WORKFLOW" },
    { number: "02", title: "Read aviation weather", description: "Look up METAR and TAF reports and understand the freshness of the source data.", icon: CloudSun, page: "weather", action: "Open weather", level: "WEATHER BASICS" },
    { number: "03", title: "Build your flight routine", description: "Use phase-based checklists and write down clear notes before and during a flight.", icon: ClipboardCheck, page: "checklists", action: "Open checklists", level: "COCKPIT HABITS" },
    { number: "04", title: "Connect the simulator", description: "Set up the local Windows companion and verify that real telemetry reaches your account.", icon: Activity, page: "simulator", action: "Pair MSFS 2024", level: "TECHNICAL SETUP" },
    { number: "05", title: "Review your flying", description: "Keep a simple flight history, track route details and organise your own records.", icon: BookOpen, page: "logbook", action: "Open logbook", level: "PERSONAL RECORDS" },
    { number: "06", title: "Fly with others", description: "Discover virtual airlines and publish or join community events.", icon: Users, page: "events", action: "Explore community", level: "COMMUNITY" }
  ];
  return <>
    <SectionHeading eyebrow="FLYTECH ACADEMY" title="Build your flight routine" subtitle="Short, practical guides that help you get more from your simulator setup. These are learning resources, not certified flight training." />
    <div className="academy-hero"><div className="academy-hero-icon"><GraduationCap size={28} /></div><div><span className="eyebrow">YOUR LEARNING HUB</span><h2>From planning to post-flight</h2><p>Work through the paths in any order. Each guide takes you to a real FlyTech feature so you can practise with your own setup.</p></div></div>
    <div className="academy-grid">{learningPaths.map(item => { const Icon = item.icon; return <article className="academy-card" key={item.number}><div className="academy-card-top"><span>{item.number}</span><Icon size={20} /></div><small>{item.level}</small><h2>{item.title}</h2><p>{item.description}</p><button className="text-action" onClick={() => navigate(item.page)}>{item.action} <ArrowRight size={14} /></button></article>; })}</div>
    <div className="academy-note"><ShieldCheck size={18} /><p>Always verify aircraft-specific procedures, performance calculations and operational decisions using the documentation for your aircraft add-on and the rules of the network you fly on. FlyTech is a simulator companion, not a certified electronic flight bag for real-world operations.</p></div>
  </>;
}

export default App;
