export const nmToKm = nm => nm * 1.852;
export const kmToNm = km => km / 1.852;
export const kgToLb = kg => kg * 2.2046226218;
export const lbToKg = lb => lb / 2.2046226218;
export const cToF = c => c * 9/5 + 32;
export const ktToKmh = kt => kt * 1.852;

export function crosswind(windDir, windSpeed, runway) {
  const delta = ((windDir - runway + 540) % 360) - 180;
  const rad = delta * Math.PI / 180;
  return {
    crosswind: Math.abs(windSpeed * Math.sin(rad)),
    headwind: windSpeed * Math.cos(rad),
    angle: Math.abs(delta)
  };
}

export function tod(distanceNm, altitudeToLoseFt, descentRateFtMin = 1000, groundspeedKt = 250) {
  const minutes = altitudeToLoseFt / descentRateFtMin;
  return { minutes, distanceNm: (groundspeedKt * minutes / 60) };
}

export function windComponent(windDir, windSpeed, course) {
  const delta = ((windDir - course + 540) % 360) - 180;
  const rad = delta * Math.PI / 180;
  return {
    headwind: windSpeed * Math.cos(rad),
    crosswind: windSpeed * Math.sin(rad)
  };
}
