const key = "flightdeck-state-v2";
export function loadState() {
  try { return JSON.parse(localStorage.getItem(key)) || {}; } catch { return {}; }
}
export function saveState(state) {
  localStorage.setItem(key, JSON.stringify(state));
}
