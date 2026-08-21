/**
 * Open Location Code (Plus Code) decoder — offline, no API (house rule: Plus Codes / local data,
 * never a geocoding service). Full codes only (e.g. "8Q98HXCR+2X", 10–15 chars, no locality
 * suffix). Returns the cell center. Spec: github.com/google/open-location-code.
 */
const ALPHABET = '23456789CFGHJMPQRVWX';
const SEP = '+';
const PAIR_CODE_LENGTH = 10;
const GRID_COLUMNS = 4;
const GRID_ROWS = 5;
const LAT_MAX = 90;
const LNG_MAX = 180;

export interface LatLng { lat: number; lng: number }

export function isFullPlusCode(code: string | null | undefined): boolean {
  if (!code) return false;
  const c = code.trim().toUpperCase();
  const sepIdx = c.indexOf(SEP);
  if (sepIdx !== 8) return false;                    // full codes have the separator after 8 chars
  if (c.indexOf(SEP, sepIdx + 1) !== -1) return false;
  const body = c.replace(SEP, '');
  if (body.length < PAIR_CODE_LENGTH || body.length > 15) return false;
  if (body.includes('0')) return false;              // padding not accepted for a venue
  return [...body].every((ch) => ALPHABET.includes(ch));
}

export function decodePlusCode(code: string): LatLng | null {
  if (!isFullPlusCode(code)) return null;
  const c = code.trim().toUpperCase().replace(SEP, '');
  let lat = -LAT_MAX, lng = -LNG_MAX;
  let latRes = 400, lngRes = 400;                   // degrees per first-pair cell
  let i = 0;
  // pairs
  while (i < Math.min(c.length, PAIR_CODE_LENGTH)) {
    latRes /= 20; lngRes /= 20;
    lat += ALPHABET.indexOf(c[i]) * latRes;
    lng += ALPHABET.indexOf(c[i + 1]) * lngRes;
    i += 2;
  }
  // grid refinement
  while (i < c.length) {
    latRes /= GRID_ROWS; lngRes /= GRID_COLUMNS;
    const v = ALPHABET.indexOf(c[i]);
    lat += Math.floor(v / GRID_COLUMNS) * latRes;
    lng += (v % GRID_COLUMNS) * lngRes;
    i += 1;
  }
  return { lat: +(lat + latRes / 2).toFixed(6), lng: +(lng + lngRes / 2).toFixed(6) };
}
