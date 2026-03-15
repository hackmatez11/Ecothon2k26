// ============================================================
//  config.js — Central configuration
//  Replace TOMTOM_API_KEY with your key from developer.tomtom.com
// ============================================================

const CONFIG = {
  // ── TomTom API key ─────────────────────────────────────────
  TOMTOM_API_KEY: "FDy9uaiwMsknW0uDjBZ1YdYhGsDoPPAP",   // loaded from .env

  // ── Default city centre (New Delhi) ───────────────────────
  DEFAULT_CENTER: { lat: 28.6139, lng: 77.2090 },
  DEFAULT_ZOOM: 13,

  // ── Traffic polling interval (ms) ─────────────────────────
  POLL_INTERVAL_MS: 60_000,

  // ── COPERT-based emission factors (g/km per vehicle) ──────
  //    Adjusted for mixed urban fleet (petrol + diesel)
  EMISSION_FACTORS: {
    CO2:  { base: 178,  congestion_mult: 1.6 },  // g/km
    NOx:  { base: 0.62, congestion_mult: 1.9 },  // g/km
    PM25: { base: 0.04, congestion_mult: 2.2 },  // g/km
  },

  // ── Traffic segment grid (bounding boxes around New Delhi) ─
  //    Each entry: { name, bbox: [minLng, minLat, maxLng, maxLat], lat, lng }
  SEGMENTS: [
    { name: "Connaught Place",   lat: 28.6315, lng: 77.2167, bbox: [77.205, 28.625, 77.230, 28.640] },
    { name: "India Gate",        lat: 28.6129, lng: 77.2295, bbox: [77.220, 28.605, 77.242, 28.622] },
    { name: "Lajpat Nagar",      lat: 28.5700, lng: 77.2430, bbox: [77.232, 28.562, 77.256, 28.578] },
    { name: "Saket",             lat: 28.5244, lng: 77.2066, bbox: [77.196, 28.517, 77.218, 28.533] },
    { name: "Nehru Place",       lat: 28.5494, lng: 77.2519, bbox: [77.242, 28.542, 77.263, 28.558] },
    { name: "Dwarka Sec-10",     lat: 28.5823, lng: 77.0589, bbox: [77.048, 28.575, 77.072, 28.591] },
    { name: "Rohini",            lat: 28.7495, lng: 77.0840, bbox: [77.073, 28.742, 77.097, 28.758] },
    { name: "Shahdara",          lat: 28.6751, lng: 77.3004, bbox: [77.290, 28.668, 77.313, 28.684] },
    { name: "Pitampura",         lat: 28.7073, lng: 77.1430, bbox: [77.132, 28.700, 77.156, 28.716] },
    { name: "Okhla Industrial",  lat: 28.5355, lng: 77.2880, bbox: [77.278, 28.528, 77.300, 28.544] },
    { name: "Karol Bagh",        lat: 28.6466, lng: 77.1900, bbox: [77.180, 28.639, 77.202, 28.655] },
    { name: "Janakpuri",         lat: 28.6266, lng: 77.0800, bbox: [77.069, 28.619, 77.093, 28.635] },
  ],

  // ── Emission heatmap colour ramp (pollution level → color) ─
  EMISSION_COLORS: {
    low:    { max: 2000,  color: "#22c55e" },  // green
    medium: { max: 4500,  color: "#eab308" },  // yellow
    high:   { max: 8000,  color: "#f97316" },  // orange
    severe: {             color: "#ef4444" },   // red
  },

  // ── Route colors ───────────────────────────────────────────
  ROUTE_NORMAL_COLOR: "#60a5fa",   // blue
  ROUTE_ECO_COLOR:    "#4ade80",   // green
};
