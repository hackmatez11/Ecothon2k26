// ============================================================
//  heatmap.js — Map initialization & pollution heatmap overlay
// ============================================================

const Heatmap = (() => {

  let map = null;
  const markers = [];             // Circle markers for heatmap
  const popups  = [];

  /**
   * Initialize the TomTom map and return the map instance.
   */
  function initMap() {
    map = tt.map({
      key:       CONFIG.TOMTOM_API_KEY,
      container: 'map',
      center:    [CONFIG.DEFAULT_CENTER.lng, CONFIG.DEFAULT_CENTER.lat],
      zoom:      CONFIG.DEFAULT_ZOOM,
      style:     'tomtom://vector/1/basic-night',   // dark style
    });

    map.addControl(new tt.NavigationControl(), 'bottom-right');
    map.addControl(new tt.FullscreenControl(),  'bottom-right');

    map.on('load', () => {
      // Add TomTom traffic flow tile layer
      addTrafficLayer();
    });

    return map;
  }

  /**
   * Add the TomTom traffic flow overlay to the map.
   */
  function addTrafficLayer() {
    try {
      map.addSource('traffic-flow', {
        type: 'raster',
        tiles: [
          `https://api.tomtom.com/traffic/map/4/tile/flow/relative0/{z}/{x}/{y}.png?key=${CONFIG.TOMTOM_API_KEY}&tileSize=256`
        ],
        tileSize: 256,
      });
      map.addLayer({
        id:     'traffic-flow-layer',
        type:   'raster',
        source: 'traffic-flow',
        paint:  { 'raster-opacity': 0.65 },
      });
    } catch (e) {
      console.warn('[Heatmap] Could not add traffic tile layer:', e);
    }
  }

  /**
   * Render pollution heatmap circles for each segment.
   * @param {Array} segments — enriched segment data from Traffic + Emissions
   */
  function renderHeatmap(segments) {
    // Clear old markers
    markers.forEach(m => m.remove());
    markers.length = 0;

    segments.forEach(seg => {
      const color  = levelToColor(seg.level);
      const radius = levelToRadius(seg.level);

      // Create a colored circle element
      const el = document.createElement('div');
      el.style.cssText = `
        width: ${radius}px; height: ${radius}px;
        background: ${color}33;
        border: 2px solid ${color};
        border-radius: 50%;
        cursor: pointer;
        transition: all 0.2s ease;
        box-shadow: 0 0 ${radius / 2}px ${color}66;
        position: relative;
      `;

      // Pulse ring
      const ring = document.createElement('div');
      ring.style.cssText = `
        position: absolute; inset: -4px;
        border-radius: 50%;
        border: 2px solid ${color}55;
        animation: ring-pulse 2s ease-out infinite;
      `;
      el.appendChild(ring);

      // Inject pulse animation if not already done
      injectPulseStyle(color);

      // Popup content
      const popupHTML = `
        <div class="popup-card">
          <h4>📍 ${seg.name}</h4>
          <div class="popup-row"><span>Speed</span><span>${seg.currentSpeed} km/h${seg._simulated ? ' ⚡' : ''}</span></div>
          <div class="popup-row"><span>Free-flow</span><span>${seg.freeFlowSpeed} km/h</span></div>
          <div class="popup-row"><span>Congestion</span><span>${Math.round((1 - seg.currentSpeed / Math.max(seg.freeFlowSpeed, 1)) * 100)}%</span></div>
          <div class="popup-row"><span>Vehicles/km</span><span>${seg.vehicleDensity}</span></div>
          <hr style="border-color:rgba(255,255,255,0.08);margin:8px 0"/>
          <div class="popup-row"><span>CO₂</span><span>${(seg.co2_kg_h || 0).toFixed(1)} kg/h</span></div>
          <div class="popup-row"><span>NOₓ</span><span>${(seg.nox_g_h  || 0).toFixed(0)} g/h</span></div>
          <div class="popup-row"><span>PM2.5</span><span>${(seg.pm25_g_h || 0).toFixed(1)} g/h</span></div>
          <div class="popup-row"><span>Level</span><span style="color:${color};font-weight:700;text-transform:capitalize">${seg.level}</span></div>
        </div>
      `;

      const popup = new tt.Popup({ offset: 10, closeButton: false })
        .setHTML(popupHTML);

      const marker = new tt.Marker({ element: el, anchor: 'center' })
        .setLngLat([seg.lng, seg.lat])
        .setPopup(popup)
        .addTo(map);

      el.addEventListener('mouseenter', () => popup.addTo(map));
      el.addEventListener('mouseleave', () => popup.remove());

      markers.push(marker);
    });
  }

  function levelToColor(level) {
    const map = {
      low:      '#22c55e',
      moderate: '#eab308',
      high:     '#f97316',
      severe:   '#ef4444',
    };
    return map[level] || '#60a5fa';
  }

  function levelToRadius(level) {
    const map = { low: 28, moderate: 36, high: 44, severe: 54 };
    return map[level] || 32;
  }

  let pulseInjected = false;
  function injectPulseStyle() {
    if (pulseInjected) return;
    pulseInjected = true;
    const style = document.createElement('style');
    style.textContent = `
      @keyframes ring-pulse {
        0%   { transform: scale(1);   opacity: 0.8; }
        80%  { transform: scale(1.6); opacity: 0; }
        100% { transform: scale(1.6); opacity: 0; }
      }
    `;
    document.head.appendChild(style);
  }

  function getMap() { return map; }

  return { initMap, renderHeatmap, getMap };

})();
