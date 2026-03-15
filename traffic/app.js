// ============================================================
//  app.js — Main orchestrator: wires all modules together
// ============================================================

(async () => {

  // ── Helpers ────────────────────────────────────────────────
  function $(id) { return document.getElementById(id); }

  function showToast(msg, type = 'info') {
    const tc   = $('toast-container');
    const div  = document.createElement('div');
    const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️';
    div.className = `toast ${type}`;
    div.innerHTML = `<span>${icon}</span><span>${msg}</span>`;
    tc.appendChild(div);
    setTimeout(() => div.remove(), 4000);
  }

  function fmt(n, decimals = 0) {
    return Number(n).toLocaleString('en-IN', { maximumFractionDigits: decimals });
  }

  function setStatCard(id, value, suffix = '') {
    const el = $(id);
    if (el) { el.textContent = value + suffix; }
  }

  function setBar(barId, pct) {
    const el = $(barId);
    if (el) el.style.width = Math.min(100, Math.round(pct)) + '%';
  }

  function aqiBadgeClass(aqi) {
    if (aqi < 100) return 'aqi-good';
    if (aqi < 200) return 'aqi-moderate';
    if (aqi < 300) return 'aqi-high';
    return 'aqi-severe';
  }

  function levelBadgeClass(level) {
    const map = { low: 'aqi-good', moderate: 'aqi-moderate', high: 'aqi-high', severe: 'aqi-severe' };
    return map[level] || 'aqi-good';
  }

  function aqiLabel(aqi) {
    if (aqi < 100) return 'Good';
    if (aqi < 200) return 'Moderate';
    if (aqi < 300) return 'High';
    return 'Severe';
  }

  function segmentColor(level) {
    return { low: '#22c55e', moderate: '#eab308', high: '#f97316', severe: '#ef4444' }[level] || '#60a5fa';
  }

  // ── Map init ───────────────────────────────────────────────
  const map = Heatmap.initMap();

  // ── State ──────────────────────────────────────────────────
  let segments   = [];
  let lastRoutes = null;

  // ── Update dashboard ───────────────────────────────────────
  function updateDashboard(stats) {
    setStatCard('stat-speed',      stats.avgSpeed);
    setStatCard('stat-congestion', stats.congestionPct);
    setStatCard('stat-vehicles',   fmt(stats.avgVehicles));
    setStatCard('stat-aqi',        stats.aqi);

    // Emission bars — scale relative to reasonable maximums
    const co2Max  = 80;   // kg/h
    const noxMax  = 8000; // g/h
    const pmMax   = 600;  // g/h

    $('val-co2').textContent = `${fmt(stats.totalCo2_kg_h, 1)} kg/h`;
    $('val-nox').textContent = `${fmt(stats.totalNox_g_h,  0)} g/h`;
    $('val-pm').textContent  = `${fmt(stats.totalPm25_g_h, 1)} g/h`;

    setBar('bar-co2', (stats.totalCo2_kg_h / co2Max)  * 100);
    setBar('bar-nox', (stats.totalNox_g_h  / noxMax)  * 100);
    setBar('bar-pm',  (stats.totalPm25_g_h / pmMax)   * 100);

    // AQI badges
    const aqiClass = aqiBadgeClass(stats.aqi);
    ['badge-co2','badge-nox','badge-pm'].forEach(id => {
      const el = $(id);
      if (!el) return;
      el.textContent = aqiLabel(stats.aqi);
      el.className   = `aqi-badge ${aqiClass}`;
    });
  }

  // ── Update segment table ───────────────────────────────────
  function updateSegmentList(segs) {
    const list = $('segment-list');
    if (!list) return;

    // Sort worst first
    const sorted = [...segs].sort((a, b) => (b.co2_kg_h || 0) - (a.co2_kg_h || 0));

    list.innerHTML = sorted.map(seg => `
      <div class="segment-row" onclick="flyTo(${seg.lat},${seg.lng})">
        <div class="segment-dot" style="background:${segmentColor(seg.level)}"></div>
        <div class="segment-name">${seg.name}</div>
        <div class="segment-speed" title="Current speed">${seg.currentSpeed} km/h</div>
        <div class="segment-co2"  title="CO₂ emission">${(seg.co2_kg_h||0).toFixed(1)} kg/h</div>
      </div>
    `).join('');
  }

  // Fly-to helper (called from inline onclick)
  window.flyTo = function(lat, lng) {
    map.flyTo({ center: [lng, lat], zoom: 15, speed: 1.5 });
  };

  // ── Fetch + refresh cycle ─────────────────────────────────
  async function refresh() {
    try {
      segments = await Traffic.fetchAllSegments();
      const stats = Traffic.aggregateStats(segments);

      updateDashboard(stats);
      updateSegmentList(segments);

      // Wait for map to be ready before rendering heatmap
      if (map.isStyleLoaded()) {
        Heatmap.renderHeatmap(segments);
      } else {
        map.once('load', () => Heatmap.renderHeatmap(segments));
      }

      const simulated = segments.some(s => s._simulated);
      if (simulated) {
        showToast('Using simulated data (API key needed for live data)', 'info');
      } else {
        showToast('Live traffic data loaded ✓', 'success');
      }
    } catch (err) {
      console.error('[App] refresh error:', err);
      showToast('Failed to load traffic data: ' + err.message, 'error');
    }
  }

  // ── Route optimization ─────────────────────────────────────
  async function handleFindRoute() {
    const originQ = $('input-origin').value.trim();
    const destQ   = $('input-dest').value.trim();

    if (!originQ || !destQ) {
      showToast('Please enter both origin and destination', 'error');
      return;
    }

    const btnText = $('btn-route-text');
    const btn     = $('btn-route');
    btn.disabled  = true;
    btnText.innerHTML = '<span class="spinner"></span> Finding routes…';

    $('route-results').innerHTML = '';
    $('btn-eco').style.display   = 'none';

    try {
      const { origin, dest, normalRoute, ecoRoute, delta } = await Routing.findRoutes(originQ, destQ);
      lastRoutes = { origin, dest, normalRoute, ecoRoute };

      // Draw on map
      if (map.isStyleLoaded()) {
        Routing.drawRoutes(map, normalRoute, ecoRoute);
      } else {
        map.once('load', () => Routing.drawRoutes(map, normalRoute, ecoRoute));
      }
      Routing.fitRoutes(map, origin, dest);

      // Build result cards
      renderRouteCards(normalRoute, ecoRoute, delta);
      showToast('Routes found! Green = Eco route 🌿', 'success');
    } catch (err) {
      console.error('[App] route error:', err);
      showToast('Route error: ' + err.message, 'error');
      // Show simulated route result for demo
      renderDemoRoute();
    } finally {
      btn.disabled  = false;
      btnText.textContent = '🔍 Find Routes';
    }
  }

  function fmtDuration(seconds) {
    const m = Math.round(seconds / 60);
    if (m < 60) return `${m} min`;
    return `${Math.floor(m/60)}h ${m%60}m`;
  }

  function fmtKm(meters) {
    return (meters / 1000).toFixed(1) + ' km';
  }

  function renderRouteCards(normalRoute, ecoRoute, delta) {
    const rr = $('route-results');
    rr.innerHTML = `
      <div class="route-card">
        <div class="rc-header">
          <div class="rc-type">
            <div class="route-color" style="background:${CONFIG.ROUTE_NORMAL_COLOR}"></div>
            Fastest Route
          </div>
          <span class="rc-badge badge-blue">Normal</span>
        </div>
        <div class="rc-stats">
          <div class="rc-stat">
            <div class="rv" style="color:${CONFIG.ROUTE_NORMAL_COLOR}">${fmtDuration(normalRoute.summary.travelTimeInSeconds)}</div>
            <div class="rl">Travel Time</div>
          </div>
          <div class="rc-stat">
            <div class="rv" style="color:${CONFIG.ROUTE_NORMAL_COLOR}">${fmtKm(normalRoute.summary.lengthInMeters)}</div>
            <div class="rl">Distance</div>
          </div>
          <div class="rc-stat">
            <div class="rv" style="color:#f97316">${fmt(delta.normalCO2_g)} g</div>
            <div class="rl">CO₂ Est.</div>
          </div>
        </div>
      </div>

      <div class="route-card">
        <div class="rc-header">
          <div class="rc-type">
            <div class="route-color" style="background:${CONFIG.ROUTE_ECO_COLOR}"></div>
            Eco Route
          </div>
          <span class="rc-badge badge-green">🌿 Eco</span>
        </div>
        <div class="rc-stats">
          <div class="rc-stat">
            <div class="rv" style="color:${CONFIG.ROUTE_ECO_COLOR}">${fmtDuration(ecoRoute.summary.travelTimeInSeconds)}</div>
            <div class="rl">Travel Time</div>
          </div>
          <div class="rc-stat">
            <div class="rv" style="color:${CONFIG.ROUTE_ECO_COLOR}">${fmtKm(ecoRoute.summary.lengthInMeters)}</div>
            <div class="rl">Distance</div>
          </div>
          <div class="rc-stat">
            <div class="rv" style="color:#22c55e">${fmt(delta.ecoCO2_g)} g</div>
            <div class="rl">CO₂ Est.</div>
          </div>
        </div>
      </div>

      ${delta.co2Saved_g > 0 ? `
      <div class="savings-banner">
        <div class="sb-icon">🌱</div>
        <div>
          <div class="sb-val">Save ${fmt(delta.co2Saved_g)} g CO₂ (${delta.percent}%)</div>
          <div class="sb-text">≈ ${delta.fuelSaved_l}L fuel saved per trip via Eco Route</div>
        </div>
      </div>` : ''}
    `;
  }

  function renderDemoRoute() {
    // Demo fallback when API key isn't valid yet
    const rr = $('route-results');
    rr.innerHTML = `
      <div class="route-card">
        <div class="rc-header">
          <div class="rc-type"><div class="route-color" style="background:#60a5fa"></div>Fastest Route</div>
          <span class="rc-badge badge-blue">Demo</span>
        </div>
        <div class="rc-stats">
          <div class="rc-stat"><div class="rv" style="color:#60a5fa">28 min</div><div class="rl">Travel Time</div></div>
          <div class="rc-stat"><div class="rv" style="color:#60a5fa">7.3 km</div><div class="rl">Distance</div></div>
          <div class="rc-stat"><div class="rv" style="color:#f97316">1,300 g</div><div class="rl">CO₂ Est.</div></div>
        </div>
      </div>
      <div class="route-card">
        <div class="rc-header">
          <div class="rc-type"><div class="route-color" style="background:#4ade80"></div>Eco Route</div>
          <span class="rc-badge badge-green">🌿 Eco</span>
        </div>
        <div class="rc-stats">
          <div class="rc-stat"><div class="rv" style="color:#4ade80">33 min</div><div class="rl">Travel Time</div></div>
          <div class="rc-stat"><div class="rv" style="color:#4ade80">8.1 km</div><div class="rl">Distance</div></div>
          <div class="rc-stat"><div class="rv" style="color:#22c55e">980 g</div><div class="rl">CO₂ Est.</div></div>
        </div>
      </div>
      <div class="savings-banner">
        <div class="sb-icon">🌱</div>
        <div>
          <div class="sb-val">Save 320 g CO₂ (24%)</div>
          <div class="sb-text">≈ 0.13L fuel saved per trip — Demo values</div>
        </div>
      </div>
      <div class="text-muted" style="margin-top:8px;text-align:center">
        ⚡ Add your TomTom API key in config.js for live routes
      </div>
    `;
    showToast('Showing demo route data — add your API key for live results', 'info');
  }

  // ── Wire up buttons ────────────────────────────────────────
  $('btn-route').addEventListener('click', handleFindRoute);

  // ── Initial load ───────────────────────────────────────────
  await refresh();

  // ── Auto-refresh every 60s ─────────────────────────────────
  setInterval(refresh, CONFIG.POLL_INTERVAL_MS);

  console.log('[TrafficAir] App initialized ✓');

})();
