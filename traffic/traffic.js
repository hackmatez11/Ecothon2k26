// ============================================================
//  traffic.js — TomTom Traffic Flow API integration
// ============================================================

const Traffic = (() => {

  /**
   * Fetch traffic flow for a single point using TomTom Flow Segment Data API.
   * Docs: https://developer.tomtom.com/traffic-api/documentation/traffic-flow/flow-segment-data
   *
   * @param {number} lat
   * @param {number} lng
   * @returns {Promise<{ currentSpeed, freeFlowSpeed, currentTravelTime, freeFlowTravelTime, confidence }>}
   */
  async function fetchFlowPoint(lat, lng) {
    const style   = 'relative0'; // relative to free-flow
    const zoom    = 13;
    const url = `https://api.tomtom.com/traffic/services/4/flowSegmentData/${style}/${zoom}/json`
              + `?point=${lat},${lng}&unit=KMPH&key=${CONFIG.TOMTOM_API_KEY}`;

    const resp = await fetch(url);
    if (!resp.ok) throw new Error(`Traffic API error ${resp.status}`);
    const json = await resp.json();
    const fd = json.flowSegmentData || {};
    return {
      currentSpeed:       fd.currentSpeed       || 0,
      freeFlowSpeed:      fd.freeFlowSpeed       || 0,
      currentTravelTime:  fd.currentTravelTime   || 0,
      freeFlowTravelTime: fd.freeFlowTravelTime  || 0,
      confidence:         fd.confidence          || 0,
      coordinates:        fd.coordinates?.coordinate || [],
    };
  }

  /**
   * Fetch flow data for ALL configured city segments in parallel.
   * Returns enriched segment objects with emission estimates.
   */
  async function fetchAllSegments() {
    const results = await Promise.allSettled(
      CONFIG.SEGMENTS.map(async (seg) => {
        try {
          const flow = await fetchFlowPoint(seg.lat, seg.lng);
          const emission = Emissions.estimateSegment(
            flow.currentSpeed,
            flow.freeFlowSpeed,
            1.5,   // assumed segment length 1.5 km
            3      // assumed 3-lane road
          );
          return {
            ...seg,
            ...flow,
            ...emission,
          };
        } catch (err) {
          // Graceful fallback with simulated data so demo works offline
          console.warn(`[Traffic] Segment "${seg.name}" failed, using simulated data`, err);
          return simulateSegment(seg);
        }
      })
    );

    return results
      .filter(r => r.status === 'fulfilled')
      .map(r => r.value);
  }

  /**
   * Simulate realistic traffic data when API is unavailable (demo / CORS).
   */
  function simulateSegment(seg) {
    const freeFlowSpeed = 40 + Math.random() * 25;
    const congFactor    = 0.3 + Math.random() * 0.7;   // 0.3–1.0
    const currentSpeed  = freeFlowSpeed * congFactor;

    const emission = Emissions.estimateSegment(
      Math.round(currentSpeed),
      Math.round(freeFlowSpeed),
      1.5,
      3,
    );

    return {
      ...seg,
      currentSpeed:  Math.round(currentSpeed),
      freeFlowSpeed: Math.round(freeFlowSpeed),
      confidence:    0.85,
      ...emission,
      _simulated: true,
    };
  }

  /**
   * Compute city-wide aggregate stats from segment data.
   */
  function aggregateStats(segments) {
    if (!segments.length) return null;

    const avgSpeed      = segments.reduce((s, x) => s + x.currentSpeed, 0)  / segments.length;
    const avgFF         = segments.reduce((s, x) => s + x.freeFlowSpeed, 0) / segments.length;
    const congestionPct = Math.round((avgSpeed / Math.max(avgFF, 1)) * 100);

    const totalCo2  = segments.reduce((s, x) => s + (x.co2_kg_h  || 0), 0);
    const totalNox  = segments.reduce((s, x) => s + (x.nox_g_h   || 0), 0);
    const totalPm25 = segments.reduce((s, x) => s + (x.pm25_g_h  || 0), 0);
    const avgVehicles = Math.round(segments.reduce((s, x) => s + (x.vehicleDensity || 0), 0) / segments.length);

    const aqi = Emissions.estimateAQI(totalNox, totalPm25, segments.length);

    return {
      avgSpeed:       Math.round(avgSpeed),
      congestionPct,
      totalCo2_kg_h:  totalCo2,
      totalNox_g_h:   totalNox,
      totalPm25_g_h:  totalPm25,
      avgVehicles,
      aqi,
    };
  }

  return { fetchAllSegments, aggregateStats };

})();
