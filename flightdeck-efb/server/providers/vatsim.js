const DATA_URL = "https://data.vatsim.net/v3/vatsim-data.json";
const METAR_URL = "https://metar.vatsim.net/";

export async function getNetworkData() {
  const response = await fetch(DATA_URL, { headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error(`VATSIM returned HTTP ${response.status}.`);
  return response.json();
}

export async function getMetar(icao) {
  const url = new URL(METAR_URL);
  url.searchParams.set("id", icao.toUpperCase());
  const response = await fetch(url);
  if (!response.ok) throw new Error(`METAR returned HTTP ${response.status}.`);
  return { icao: icao.toUpperCase(), raw: await response.text() };
}

export async function getTaf(icao) {
  const url = new URL(METAR_URL);
  url.searchParams.set("id", icao.toUpperCase());
  url.searchParams.set("format", "json");
  const response = await fetch(url);
  if (!response.ok) throw new Error(`TAF request returned HTTP ${response.status}.`);
  const data = await response.json().catch(() => null);
  return data;
}
