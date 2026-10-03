const json = async (res) => {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
};

export const api = {
  health: () => fetch("/api/health").then(json),
  config: () => fetch("/api/config").then(json),
  profile: () => fetch("/api/profile").then(json),
  simbrief: (user) => fetch(`/api/simbrief/latest${user ? `?user=${encodeURIComponent(user)}` : ""}`).then(json),
  metar: (icao) => fetch(`/api/weather/metar/${encodeURIComponent(icao)}`).then(json),
  taf: (icao) => fetch(`/api/weather/taf/${encodeURIComponent(icao)}`).then(json),
  vatsim: () => fetch("/api/vatsim/data").then(json),
  saveFlight: (flight) => fetch("/api/tools/flight-log", {
    method: "POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify(flight)
  }).then(json)
};
