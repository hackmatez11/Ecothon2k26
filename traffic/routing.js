// ============================================================
//  routing.js — TomTom Routing API: normal + eco routes
// ============================================================

const Routing = (() => {

  let routeLayers = [];  // Track added map layers/sources for cleanup

  /**
   * Geocode a text address → { lat, lng } using TomTom Fuzzy Search API.
   */
  async function geocode(query) {
    const url = `https://api.tomtom.com/search/2/geocode/${encodeURIComponent(query)}.json`
              + `?key=${CONFIG.TOMTOM_API_KEY}&limit=1&countrySet=IN`;
    const resp = await fetch(url);
    if (!resp.ok) throw new Error(`Geocode failed: ${resp.status}`);
    const json = await resp.json();
    const result = json.results?.[0];
    if (!result) throw new Error(`No geocode result for: "${query}"`);
    return {
      lat: result.position.lat,
      lng: result.position.lon,
      label: result.address?.freeformAddress || query,
    };
  }

  /**
   * Fetch a single route via TomTom Routing API.
   * @param {object} origin  { lat, lng }
   * @param {object} dest    { lat, lng }
   * @param {string} type    'fastest' | 'eco'
   */
  async function fetchRoute(origin, dest, type = 'fastest') {
    const params = new URLSearchParams({
      key:           CONFIG.TOMTOM_API_KEY,
      traffic:       'true',
      travelMode:    'car',
      routeType:     type === 'eco' ? 'eco' : 'fastest',
      computeTravelTimeFor: 'all',
    });

    const coords = `${origin.lat},${origin.lng}:${dest.lat},${dest.lng}`;
    const url = `https://api.tomtom.com/routing/1/calculateRoute/${coords}/json?${params}`;

    const resp = await fetch(url);
    if (!resp.ok) throw new Error(`Routing API error ${resp.status}`);
    const json = await resp.json();

    const route   = json.routes?.[0];
    if (!route) throw new Error('No route returned');

    const summary = route.summary;
    const points  = route.legs[0].points.map(p => [p.longitude, p.latitude]);

    return { summary, points, type };
  }

  /**
   * Get both routes (normal + eco) for origin→destination.
   * Falls back gracefully if API key is invalid.
   */
  async function findRoutes(originQuery, destQuery) {
    const [origin, dest] = await Promise.all([
      geocode(originQuery),
      geocode(destQuery),
    ]);

    const [normalRoute, ecoRoute] = await Promise.all([
      fetchRoute(origin, dest, 'fastest'),
      fetchRoute(origin, dest, 'eco'),
    ]);

    const delta = Emissions.routeEmissionDelta(normalRoute.summary, ecoRoute.summary);

    return { origin, dest, normalRoute, ecoRoute, delta };
  }

  /**
   * Draw both routes on the map.
   */
  function drawRoutes(map, normalRoute, ecoRoute) {
    clearRoutes(map);

    drawSingleRoute(map, normalRoute.points, 'normal', CONFIG.ROUTE_NORMAL_COLOR, 5);
    drawSingleRoute(map, ecoRoute.points,    'eco',    CONFIG.ROUTE_ECO_COLOR,    5);
  }

  function drawSingleRoute(map, points, id, color, width) {
    const sourceId = `route-${id}`;
    const layerId  = `route-${id}-layer`;

    map.addSource(sourceId, {
      type: 'geojson',
      data: {
        type: 'Feature',
        geometry: { type: 'LineString', coordinates: points },
      },
    });

    // Glow border (wider, dimmer)
    map.addLayer({
      id:     `${layerId}-glow`,
      type:   'line',
      source: sourceId,
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: {
        'line-color': color,
        'line-width': width + 6,
        'line-opacity': 0.25,
        'line-blur': 4,
      },
    });

    // Main route line
    map.addLayer({
      id:     layerId,
      type:   'line',
      source: sourceId,
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: {
        'line-color': color,
        'line-width': width,
        'line-opacity': 0.9,
      },
    });

    routeLayers.push(sourceId, `${layerId}-glow`, layerId);
  }

  function clearRoutes(map) {
    routeLayers.forEach(id => {
      try { if (map.getLayer(id))   map.removeLayer(id); } catch{}
      try { if (map.getSource(id))  map.removeSource(id); } catch{}
    });
    routeLayers = [];
  }

  /**
   * Fit map view to show both routes.
   */
  function fitRoutes(map, origin, dest) {
    const bounds = new tt.LngLatBounds();
    bounds.extend([origin.lng, origin.lat]);
    bounds.extend([dest.lng,   dest.lat]);
    map.fitBounds(bounds, { padding: 80, maxZoom: 15 });
  }

  return { findRoutes, drawRoutes, fitRoutes, clearRoutes };

})();
