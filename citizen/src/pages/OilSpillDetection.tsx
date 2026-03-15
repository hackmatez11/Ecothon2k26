import { useState, useCallback, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Droplets, Satellite, AlertTriangle, Info, RotateCcw, Map } from "lucide-react";
import {
  MapContainer, TileLayer, Rectangle, useMapEvents, CircleMarker, Popup, useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { fetchOilSpills, OilSpill } from "@/lib/environmental";

// ── Types ──────────────────────────────────────────────────────────────────────
type BBox = { minLat: number; minLon: number; maxLat: number; maxLon: number };

const SEVERITY_COLOR: Record<string, string> = {
  Major:    "#dc2626",
  Moderate: "#f97316",
  Minor:    "#facc15",
};

const SEVERITY_BG: Record<string, string> = {
  Major:    "bg-red-500/15 text-red-400 border-red-500/30",
  Moderate: "bg-orange-500/15 text-orange-400 border-orange-500/30",
  Minor:    "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
};

// ── BBox draw interaction ──────────────────────────────────────────────────────
function BBoxDrawer({
  onBBoxChange,
  drawing,
}: {
  onBBoxChange: (bbox: BBox | null) => void;
  drawing: boolean;
}) {
  const map = useMap();
  const startRef = useRef<L.LatLng | null>(null);
  const [current, setCurrent] = useState<BBox | null>(null);

  // Disable/enable map drag + scroll zoom based on drawing mode
  useEffect(() => {
    if (drawing) {
      map.dragging.disable();
      map.scrollWheelZoom.disable();
      map.doubleClickZoom.disable();
    } else {
      map.dragging.enable();
      map.scrollWheelZoom.enable();
      map.doubleClickZoom.enable();
      startRef.current = null;
      setCurrent(null);
    }
  }, [drawing, map]);

  useMapEvents({
    mousedown(e) {
      if (!drawing) return;
      startRef.current = e.latlng;
      onBBoxChange(null);
      setCurrent(null);
    },
    mousemove(e) {
      if (!drawing || !startRef.current) return;
      const s = startRef.current;
      setCurrent({
        minLat: Math.min(s.lat, e.latlng.lat),
        maxLat: Math.max(s.lat, e.latlng.lat),
        minLon: Math.min(s.lng, e.latlng.lng),
        maxLon: Math.max(s.lng, e.latlng.lng),
      });
    },
    mouseup(e) {
      if (!drawing || !startRef.current) return;
      const s = startRef.current;
      const bbox: BBox = {
        minLat: Math.min(s.lat, e.latlng.lat),
        maxLat: Math.max(s.lat, e.latlng.lat),
        minLon: Math.min(s.lng, e.latlng.lng),
        maxLon: Math.max(s.lng, e.latlng.lng),
      };
      startRef.current = null;
      setCurrent(null);
      onBBoxChange(bbox);
    },
  });

  if (!current) return null;
  return (
    <Rectangle
      bounds={[[current.minLat, current.minLon], [current.maxLat, current.maxLon]]}
      pathOptions={{ color: "#3b82f6", fillColor: "#3b82f6", fillOpacity: 0.15, weight: 2, dashArray: "6 4" }}
    />
  );
}

function CursorStyle({ drawing }: { drawing: boolean }) {
  const map = useMap();
  useEffect(() => {
    map.getContainer().style.cursor = drawing ? "crosshair" : "";
  }, [drawing, map]);
  return null;
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function OilSpillDetection() {
  const [drawing,   setDrawing]   = useState(false);
  const [bbox,      setBbox]      = useState<BBox | null>(null);
  const [loading,   setLoading]   = useState(false);
  const [spills,    setSpills]    = useState<OilSpill[] | null>(null);
  const [error,     setError]     = useState<string | null>(null);
  const [scanDate,  setScanDate]  = useState<string | null>(null);
  const [satellite, setSatellite] = useState(false);

  const handleBBoxChange = useCallback((b: BBox | null) => {
    setBbox(b);
    setSpills(null);
    setError(null);
    if (b) setDrawing(false);
  }, []);

  const handleDetect = async () => {
    if (!bbox) return;
    const w = bbox.maxLon - bbox.minLon;
    const h = bbox.maxLat - bbox.minLat;
    if (w > 5 || h > 5) {
      setError("Area too large — keep the box under 5° × 5°.");
      return;
    }
    setLoading(true);
    setError(null);
    setSpills(null);
    try {
      const res = await fetchOilSpills(
        (bbox.minLat + bbox.maxLat) / 2,
        (bbox.minLon + bbox.maxLon) / 2,
        Math.max(w, h) / 2,
      );
      setSpills(res.spills);
      setScanDate(new Date(res.generated_at).toLocaleString());
    } catch (e: any) {
      setError(e.message ?? "Detection failed");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setBbox(null);
    setSpills(null);
    setError(null);
    setDrawing(false);
  };

  const totalArea = spills?.reduce((s, sp) => s + sp.area_km2, 0) ?? 0;
  const majorCount    = spills?.filter(s => s.severity === "Major").length    ?? 0;
  const moderateCount = spills?.filter(s => s.severity === "Moderate").length ?? 0;
  const minorCount    = spills?.filter(s => s.severity === "Minor").length    ?? 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Droplets className="h-5 w-5 text-orange-500" />
            Oil Spill Detection
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Draw a bounding box on the map to scan for oil spills using Sentinel-1 SAR satellite imagery.
          </p>
        </div>
        <span className="flex items-center gap-1.5 text-[11px] font-medium text-sky-500 bg-sky-500/10 px-2.5 py-1 rounded-full border border-sky-500/20">
          <Satellite className="h-3 w-3" /> Sentinel-1 SAR · CDSE
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map panel */}
        <div className="lg:col-span-2 space-y-3">
          {/* Toolbar */}
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              size="sm"
              variant={drawing ? "default" : "outline"}
              onClick={() => { setDrawing(d => !d); setBbox(null); setSpills(null); setError(null); }}
              className={drawing ? "bg-blue-600 hover:bg-blue-700 text-white" : ""}
            >
              {drawing ? "Drawing… click & drag" : "Draw Area"}
            </Button>

            <Button
              size="sm"
              disabled={!bbox || loading}
              onClick={handleDetect}
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              {loading
                ? <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />Scanning…</>
                : <><Droplets className="h-3.5 w-3.5 mr-1.5" />Detect Spills</>
              }
            </Button>

            {(bbox || spills) && (
              <Button size="sm" variant="ghost" onClick={handleReset}>
                <RotateCcw className="h-3.5 w-3.5 mr-1.5" /> Reset
              </Button>
            )}

            <Button
              size="sm"
              variant="outline"
              onClick={() => setSatellite(s => !s)}
              className={satellite ? "border-sky-500 text-sky-500 bg-sky-500/10" : ""}
            >
              {satellite
                ? <><Map className="h-3.5 w-3.5 mr-1.5" />Street View</>
                : <><Satellite className="h-3.5 w-3.5 mr-1.5" />Satellite View</>
              }
            </Button>

            {bbox && !loading && !spills && (
              <span className="text-xs text-muted-foreground">
                Box: {(bbox.maxLon - bbox.minLon).toFixed(2)}° × {(bbox.maxLat - bbox.minLat).toFixed(2)}°
              </span>
            )}
          </div>

          {/* Map */}
          <Card className="overflow-hidden">
            <div className="relative h-[480px]">
              <MapContainer
                center={[20, 78]}
                zoom={4}
                style={{ height: "100%", width: "100%" }}
                scrollWheelZoom
              >
                <CursorStyle drawing={drawing} />
                {satellite ? (
                  <TileLayer
                    attribution="Tiles &copy; Esri &mdash; Esri, Maxar, Earthstar Geographics"
                    url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                    maxZoom={19}
                  />
                ) : (
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                )}

                {/* Drawn bbox */}
                {bbox && (
                  <Rectangle
                    bounds={[[bbox.minLat, bbox.minLon], [bbox.maxLat, bbox.maxLon]]}
                    pathOptions={{ color: "#3b82f6", fillColor: "#3b82f6", fillOpacity: 0.1, weight: 2 }}
                  />
                )}

                {/* Live draw preview */}
                <BBoxDrawer drawing={drawing} onBBoxChange={handleBBoxChange} />

                {/* Spill markers */}
                {spills?.map((spill, i) => {
                  const color  = SEVERITY_COLOR[spill.severity] ?? "#f97316";
                  const radius = Math.max(7, Math.min(22, spill.area_km2 * 10));
                  return (
                    <CircleMarker
                      key={i}
                      center={[spill.latitude, spill.longitude]}
                      radius={radius}
                      pathOptions={{ color, fillColor: color, fillOpacity: 0.6, weight: 2 }}
                    >
                      <Popup>
                        <div style={{ minWidth: 170 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                            <span>🛢️</span>
                            <strong style={{ fontSize: 13 }}>Oil Spill #{i + 1}</strong>
                          </div>
                          <table style={{ fontSize: 11, width: "100%", borderCollapse: "collapse" }}>
                            <tbody>
                              <tr><td style={{ opacity: 0.6, paddingRight: 8 }}>Severity</td><td><strong>{spill.severity}</strong></td></tr>
                              <tr><td style={{ opacity: 0.6, paddingRight: 8 }}>Area</td><td><strong>{spill.area_km2.toFixed(3)} km²</strong></td></tr>
                              <tr><td style={{ opacity: 0.6, paddingRight: 8 }}>Lat</td><td>{spill.latitude.toFixed(5)}°</td></tr>
                              <tr><td style={{ opacity: 0.6, paddingRight: 8 }}>Lon</td><td>{spill.longitude.toFixed(5)}°</td></tr>
                            </tbody>
                          </table>
                          <div style={{ marginTop: 6, fontSize: 10, background: color, color: "#fff", borderRadius: 4, padding: "2px 8px", textAlign: "center", fontWeight: 700 }}>
                            {spill.severity} Spill
                          </div>
                        </div>
                      </Popup>
                    </CircleMarker>
                  );
                })}
              </MapContainer>

              {/* Loading overlay */}
              {loading && (
                <div className="absolute inset-0 z-[1000] flex flex-col items-center justify-center bg-background/70 backdrop-blur-sm gap-3">
                  <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
                  <p className="text-sm font-medium">Fetching Sentinel-1 SAR data…</p>
                  <p className="text-xs text-muted-foreground">This may take up to 30 seconds</p>
                </div>
              )}

              {/* Hint overlay when nothing selected */}
              {!drawing && !bbox && !loading && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[1000] bg-background/90 backdrop-blur-sm rounded-full border px-4 py-1.5 shadow text-xs text-muted-foreground pointer-events-none">
                  Click "Draw Area" then drag on the map to select a region
                </div>
              )}
            </div>
          </Card>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
              {error}
            </div>
          )}
        </div>

        {/* Results panel */}
        <div className="space-y-4">
          {/* Summary cards */}
          {spills !== null && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <Card className="p-3">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Total Spills</p>
                  <p className="text-2xl font-bold mt-1">{spills.length}</p>
                </Card>
                <Card className="p-3">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Total Area</p>
                  <p className="text-2xl font-bold mt-1">{totalArea.toFixed(2)}<span className="text-sm font-normal ml-1">km²</span></p>
                </Card>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: "Major",    count: majorCount,    cls: SEVERITY_BG.Major    },
                  { label: "Moderate", count: moderateCount, cls: SEVERITY_BG.Moderate },
                  { label: "Minor",    count: minorCount,    cls: SEVERITY_BG.Minor    },
                ].map(({ label, count, cls }) => (
                  <div key={label} className={`rounded-lg border px-2 py-2 text-center ${cls}`}>
                    <p className="text-lg font-bold">{count}</p>
                    <p className="text-[10px] font-medium">{label}</p>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Spill list */}
          <Card>
            <CardHeader className="py-3 px-4 border-b">
              <CardTitle className="text-sm flex items-center justify-between">
                Detected Spills
                {spills !== null && (
                  <Badge variant="outline" className="text-[10px]">{spills.length} found</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {spills === null && !loading && (
                <div className="flex flex-col items-center justify-center py-10 px-4 text-center gap-2">
                  <Info className="h-8 w-8 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">Draw a bounding box and click Detect Spills to scan the area.</p>
                </div>
              )}

              {loading && (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              )}

              {spills !== null && spills.length === 0 && (
                <div className="flex flex-col items-center justify-center py-10 px-4 text-center gap-2">
                  <Droplets className="h-8 w-8 text-green-500/60" />
                  <p className="text-sm text-muted-foreground">No oil spills detected in this area.</p>
                  {scanDate && <p className="text-[10px] text-muted-foreground/60">Scanned: {scanDate}</p>}
                </div>
              )}

              {spills && spills.length > 0 && (
                <div className="divide-y max-h-[380px] overflow-y-auto">
                  {spills.map((spill, i) => (
                    <div key={i} className="px-4 py-3 flex items-start gap-3">
                      <div
                        className="mt-0.5 h-3 w-3 rounded-full shrink-0"
                        style={{ background: SEVERITY_COLOR[spill.severity] }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-medium">Spill #{i + 1}</span>
                          <Badge
                            variant="outline"
                            className={`text-[10px] shrink-0 ${SEVERITY_BG[spill.severity]}`}
                          >
                            {spill.severity}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {spill.area_km2.toFixed(3)} km²
                        </p>
                        <p className="text-[10px] text-muted-foreground/60 font-mono mt-0.5">
                          {spill.latitude.toFixed(4)}°, {spill.longitude.toFixed(4)}°
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {scanDate && spills && spills.length > 0 && (
                <div className="px-4 py-2 border-t text-[10px] text-muted-foreground/60 flex items-center gap-1.5">
                  <Satellite className="h-3 w-3" /> Sentinel-1 SAR · {scanDate}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Info card */}
          <Card className="bg-muted/40">
            <CardContent className="p-4 space-y-2 text-xs text-muted-foreground">
              <p className="font-semibold text-foreground flex items-center gap-1.5">
                <Info className="h-3.5 w-3.5" /> How it works
              </p>
              <p>Sentinel-1 SAR radar imagery is fetched from the Copernicus Data Space Ecosystem for your selected area.</p>
              <p>Oil spills appear as dark patches (low backscatter) on the VV polarization band. The pipeline applies median blur, adaptive thresholding, and morphological filtering to isolate them.</p>
              <p className="text-[10px] opacity-70">Sentinel-1 revisit time is ~6–12 days. Results reflect the most recent available pass.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
