// ============================================================
//  emissions.js — COPERT-based emission estimation engine
// ============================================================

const Emissions = (() => {

  /**
   * Compute congestion ratio.
   *   ratio < 1 → moving faster than free-flow (unusual)
   *   ratio = 1 → free-flow, no congestion
   *   ratio > 1 → congested (speed reduced below free-flow)
   */
  function congestionRatio(currentSpeed, freeFlowSpeed) {
    if (!freeFlowSpeed || freeFlowSpeed === 0) return 1;
    // Higher ratio = more congested = higher emissions
    return Math.max(1, freeFlowSpeed / Math.max(currentSpeed, 1));
  }

  /**
   * Estimate vehicle density (vehicles/km) from congestion.
   * Based on Greenshields model: density ∝ congestion level.
   */
  function estimateVehicleDensity(congRatio, laneCount = 2) {
    // Jam density (~120 veh/km/lane), scale by how congested
    const jamDensity = 120;
    // At free-flow (ratio=1): ~10% of jam density
    // At full congestion (ratio≥3): ~70% of jam density
    const density = jamDensity * laneCount * Math.min(0.7, 0.1 * congRatio);
    return Math.round(density);
  }

  /**
   * Estimate emissions for a road segment.
   * @param {number} currentSpeed   km/h — current traffic speed
   * @param {number} freeFlowSpeed  km/h — normal/reference speed
   * @param {number} segmentLengthKm km  — length of the road segment
   * @param {number} laneCount       lanes on the road
   * @returns {{ co2_kg_h, nox_g_h, pm25_g_h, vehicleDensity, congRatio, level }}
   */
  function estimateSegment(currentSpeed, freeFlowSpeed, segmentLengthKm = 1, laneCount = 2) {
    const congRatio    = congestionRatio(currentSpeed, freeFlowSpeed);
    const vehicleDensity = estimateVehicleDensity(congRatio, laneCount);

    const factors = CONFIG.EMISSION_FACTORS;

    // g/km → apply congestion multiplier
    const co2PerVehicleKm  = factors.CO2.base  * Math.pow(congRatio, 0.8) * (factors.CO2.congestion_mult  / 1.6);
    const noxPerVehicleKm  = factors.NOx.base  * Math.pow(congRatio, 1.1) * (factors.NOx.congestion_mult  / 1.9);
    const pm25PerVehicleKm = factors.PM25.base * Math.pow(congRatio, 1.3) * (factors.PM25.congestion_mult / 2.2);

    // Hourly emissions = vehicles_on_segment × g/km × km × (km/h ÷ km) = g/h
    const vehiclesOnSegment = vehicleDensity * segmentLengthKm;

    // vehicles travel (currentSpeed) km in 1 hour → multiply by distance ratio
    const travelFactor = Math.min(currentSpeed / segmentLengthKm, 60); // cap

    const co2_g_h  = vehiclesOnSegment * co2PerVehicleKm  * segmentLengthKm;
    const nox_g_h  = vehiclesOnSegment * noxPerVehicleKm  * segmentLengthKm;
    const pm25_g_h = vehiclesOnSegment * pm25PerVehicleKm * segmentLengthKm;

    return {
      co2_kg_h:      co2_g_h / 1000,
      nox_g_h,
      pm25_g_h,
      vehicleDensity,
      congRatio,
      level: pollutionLevel(co2_g_h),
    };
  }

  /**
   * Map raw CO₂ (g/h) to a qualitative pollution level.
   */
  function pollutionLevel(co2_g_h) {
    if (co2_g_h < 2000)  return 'low';
    if (co2_g_h < 4500)  return 'moderate';
    if (co2_g_h < 8000)  return 'high';
    return 'severe';
  }

  /**
   * Derive an estimated AQI (0-500) from NOx and PM2.5 values.
   * Uses a simplified linear model calibrated to Delhi ranges.
   */
  function estimateAQI(totalNox_g_h, totalPm25_g_h, segmentCount) {
    if (segmentCount === 0) return 0;
    const noxPerSeg  = totalNox_g_h  / segmentCount;
    const pm25PerSeg = totalPm25_g_h / segmentCount;
    // Scale to 0-500 range
    const aqi = Math.round(
      Math.min(500,
        (noxPerSeg  / 800)  * 200 +
        (pm25PerSeg / 50)   * 300
      )
    );
    return aqi;
  }

  /**
   * Estimate CO₂ savings between two routes.
   * @param normalRoute  TomTom route summary object
   * @param ecoRoute     TomTom route summary object
   * Returns { co2Saved_g, fuelSaved_l, percent }
   */
  function routeEmissionDelta(normalRoute, ecoRoute) {
    // COPERT average: 178 g CO₂/km for mixed urban fleet
    const factor = CONFIG.EMISSION_FACTORS.CO2.base; // g/km

    const normalKm = (normalRoute.lengthInMeters || 0) / 1000;
    const ecoKm    = (ecoRoute.lengthInMeters    || 0) / 1000;

    // Time adjustments: congestion raises emission factor
    const normalTimeFactor = Math.min(2.0, 1 + (normalRoute.travelTimeInSeconds - normalRoute.noTrafficTravelTimeInSeconds) / normalRoute.noTrafficTravelTimeInSeconds || 0);
    const ecoTimeFactor    = Math.min(2.0, 1 + (ecoRoute.travelTimeInSeconds    - ecoRoute.noTrafficTravelTimeInSeconds)    / ecoRoute.noTrafficTravelTimeInSeconds    || 0);

    const normalCO2_g = normalKm * factor * normalTimeFactor;
    const ecoCO2_g    = ecoKm    * factor * ecoTimeFactor;

    const saved   = Math.max(0, normalCO2_g - ecoCO2_g);
    const percent = normalCO2_g > 0 ? (saved / normalCO2_g) * 100 : 0;
    const fuelSaved_l = saved / 2392; // 1 litre petrol ≈ 2392 g CO₂

    return {
      co2Saved_g:  Math.round(saved),
      fuelSaved_l: fuelSaved_l.toFixed(2),
      percent:     Math.round(percent),
      normalCO2_g: Math.round(normalCO2_g),
      ecoCO2_g:    Math.round(ecoCO2_g),
    };
  }

  return { estimateSegment, estimateAQI, routeEmissionDelta, pollutionLevel };

})();
