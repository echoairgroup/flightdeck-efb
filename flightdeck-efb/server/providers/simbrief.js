import { parseStringPromise } from "xml2js";

export async function getLatestOFP(identifier) {
  if (!identifier) throw new Error("SimBrief user ID is required.");
  const url = new URL("https://www.simbrief.com/api/xml.fetcher.php");
  url.searchParams.set("username", identifier);

  const response = await fetch(url);
  if (!response.ok) throw new Error(`SimBrief returned HTTP ${response.status}.`);

  const xml = await response.text();
  const parsed = await parseStringPromise(xml, { explicitArray: false, mergeAttrs: true });

  const root = parsed?.OFP || parsed?.ofp || parsed;
  return normalizeOFP(root);
}

function normalizeOFP(o) {
  const general = o?.general || {};
  const origin = o?.origin || {};
  const destination = o?.destination || {};
  const alternate = o?.alternate || {};
  const times = o?.times || {};
  const fuel = o?.fuel || {};
  const weights = o?.weights || {};

  return {
    source: "SimBrief",
    flightNumber: general.fltno || general.flight_number || "",
    callsign: general.callsign || "",
    aircraft: general.icao_aircraft || general.aircraft || "",
    origin: origin.icao_code || origin.icao || "",
    destination: destination.icao_code || destination.icao || "",
    alternate: alternate.icao_code || alternate.icao || "",
    route: general.route || "",
    distanceNm: Number(general.air_distance || general.distance || 0),
    cruiseAltitude: general.initial_altitude || "",
    etd: times.est_out || times.sched_out || "",
    eta: times.est_in || times.sched_in || "",
    enrouteMinutes: Number(times.est_time_enroute || times.sched_time_enroute || 0),
    fuelPlan: Number(fuel.plan_ramp || fuel.plan_ramp_fuel || 0),
    fuelTaxi: Number(fuel.taxi || 0),
    fuelTrip: Number(fuel.enroute_burn || fuel.trip || 0),
    fuelReserve: Number(fuel.reserve || 0),
    takeoffWeight: Number(weights.est_tow || weights.takeoff || 0),
    landingWeight: Number(weights.est_ldw || weights.landing || 0),
    raw: o
  };
}
