import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScanSearch, Upload, MapPin, AlertTriangle, Loader2, Factory, Wind, Info, Satellite } from "lucide-react";

const API_BASE = import.meta.env.VITE_SENTINEL_API_URL ?? "http://localhost:8000";

interface KilnResult {
  latitude: number; longitude: number; emission_score: number; severity: string;
}
interface DetectionResponse {
  kiln_count: number; predicted_aqi: number; kilns: KilnResult[];
  detection_image: string | null; map_html: string | null; generated_at: string;
}

const SEVERITY_COLOR: Record<string, string> = {
  High: "#dc2626", Medium: "#f97316", Low: "#22c55e",
};
const SEVERITY_BG: Record<string, string> = {
  High:   "bg-red-500/15 text-red-400 border-red-500/30",
  Medium: "bg-orange-500/15 text-orange-400 border-orange-500/30",
  Low:    "bg-green-500/15 text-green-400 border-green-500/30",
};

function severityVariant(s: string): "destructive" | "secondary" | "outline" {
  if (s === "High") return "destructive";
  if (s === "Medium") return "secondary";
  return "outline";
}

function aqiLabel(aqi: number) {
  if (aqi <= 50)  return { label: "Good",       color: "#22c55e" };
  if (aqi <= 100) return { label: "Moderate",   color: "#eab308" };
  if (aqi <= 150) return { label: "Unhealthy*", color: "#f97316" };
  if (aqi <= 200) return { label: "Unhealthy",  color: "#ef4444" };
  return                  { label: "Hazardous", color: "#9333ea" };
}

const IndustrialDetection = () => {
  const [image, setImage]   = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [bbox, setBbox]     = useState({ minLat: "20", minLon: "70", maxLat: "30", maxLon: "80" });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DetectionResponse | null>(null);
  const [error, setError]   = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]; if (!f) return;
    setImage(f); setPreview(URL.createObjectURL(f)); setResult(null); setError(null);
  }

  async function handleDetect() {
    if (!image) return;
    setLoading(true); setError(null); setResult(null);
    try {
      const form = new FormData();
      form.append("image", image);
      form.append("min_lat", bbox.minLat); form.append("min_lon", bbox.minLon);
      form.append("max_lat", bbox.maxLat); form.append("max_lon", bbox.maxLon);
      const res = await fetch(`${API_BASE}/detect-kilns`, { method: "POST", body: form });
      if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.detail ?? `Server error ${res.status}`); }
      setResult(await res.json());
    } catch (e: any) { setError(e.message ?? "Detection failed"); }
    finally { setLoading(false); }
  }

  const highCount = result?.kilns.filter(k => k.severity === "High").length   ?? 0;
  const medCount  = result?.kilns.filter(k => k.severity === "Medium").length ?? 0;
  const lowCount  = result?.kilns.filter(k => k.severity === "Low").length    ?? 0;
  const aqiInfo   = result ? aqiLabel(result.predicted_aqi) : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <ScanSearch className="h-5 w-5 text-red-500" /> Industrial Kiln Detection
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Upload a satellite image to detect industrial kilns using YOLOv8 + LSTM AQI forecasting.
          </p>
        </div>
        <span className="flex items-center gap-1.5 text-[11px] font-medium text-orange-500 bg-orange-500/10 px-2.5 py-1 rounded-full border border-orange-500/20">
          <Satellite className="h-3 w-3" /> YOLOv8 · LSTM
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: inputs */}
        <div className="lg:col-span-1 space-y-4">
          {/* Image upload */}
          <Card>
            <CardHeader className="py-3 px-4 border-b"><CardTitle className="text-sm">Satellite Image</CardTitle></CardHeader>
            <CardContent className="p-4 space-y-3">
              <div
                className="border-2 border-dashed border-border rounded-xl p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => fileRef.current?.click()}
              >
                {preview
                  ? <img src={preview} alt="preview" className="max-h-40 mx-auto rounded-lg object-contain" />
                  : <div className="text-muted-foreground">
                      <Upload className="h-8 w-8 mx-auto mb-2 opacity-40" />
                      <p className="text-sm">Click to upload</p>
                      <p className="text-xs mt-1 opacity-60">PNG, JPG, WEBP</p>
                    </div>
                }
              </div>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
            </CardContent>
          </Card>

          {/* Bbox inputs */}
          <Card>
            <CardHeader className="py-3 px-4 border-b"><CardTitle className="text-sm">Geographic Bounding Box</CardTitle></CardHeader>
            <CardContent className="p-4">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Min Lat",  key: "minLat" },
                  { label: "Min Lon",  key: "minLon" },
                  { label: "Max Lat",  key: "maxLat" },
                  { label: "Max Lon",  key: "maxLon" },
                ].map(({ label, key }) => (
                  <div key={key} className="space-y-1">
                    <Label className="text-xs">{label}</Label>
                    <Input type="number" value={bbox[key as keyof typeof bbox]}
                      onChange={e => setBbox(b => ({ ...b, [key]: e.target.value }))}
                      className="h-8 text-sm" />
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-3">Defines the real-world area the image covers for accurate geo-coordinates.</p>
            </CardContent>
          </Card>

          <Button className="w-full" disabled={!image || loading} onClick={handleDetect}>
            {loading
              ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Analyzing…</>
              : <><ScanSearch className="mr-2 h-4 w-4" />Detect Kilns</>}
          </Button>

          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" /> {error}
            </div>
          )}

          {/* Info */}
          <Card className="bg-muted/40">
            <CardContent className="p-4 space-y-2 text-xs text-muted-foreground">
              <p className="font-semibold text-foreground flex items-center gap-1.5"><Info className="h-3.5 w-3.5" /> How it works</p>
              <p>Upload a satellite image of the area. YOLOv8 detects industrial structures and kilns. An LSTM model then forecasts the AQI contribution from detected emitters.</p>
              <p>Set the bounding box to the real-world coordinates the image covers for accurate geo-mapping.</p>
            </CardContent>
          </Card>
        </div>

        {/* Right: results */}
        <div className="lg:col-span-2 space-y-4">
          {!result && !loading && (
            <Card className="flex items-center justify-center min-h-[300px]">
              <CardContent className="text-center text-muted-foreground py-12">
                <Factory className="h-12 w-12 mx-auto mb-3 opacity-20" />
                <p className="text-sm">Upload a satellite image and click Detect Kilns</p>
              </CardContent>
            </Card>
          )}

          {loading && (
            <Card className="flex items-center justify-center min-h-[300px]">
              <CardContent className="text-center py-12">
                <Loader2 className="h-10 w-10 mx-auto mb-3 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Running YOLOv8 detection + AQI forecast…</p>
              </CardContent>
            </Card>
          )}

          {result && (
            <>
              {/* Stat cards */}
              <div className="grid grid-cols-2 gap-3">
                <Card className="p-4">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Kilns Detected</p>
                  <p className="text-3xl font-bold mt-1">{result.kiln_count}</p>
                </Card>
                <Card className="p-4">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Predicted AQI</p>
                  <p className="text-3xl font-bold mt-1" style={{ color: aqiInfo?.color }}>{result.predicted_aqi.toFixed(1)}</p>
                  <p className="text-[10px] mt-0.5" style={{ color: aqiInfo?.color }}>{aqiInfo?.label}</p>
                </Card>
              </div>

              {/* Severity breakdown */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: "High",   count: highCount, cls: SEVERITY_BG.High   },
                  { label: "Medium", count: medCount,  cls: SEVERITY_BG.Medium },
                  { label: "Low",    count: lowCount,  cls: SEVERITY_BG.Low    },
                ].map(({ label, count, cls }) => (
                  <div key={label} className={`rounded-lg border px-2 py-2 text-center ${cls}`}>
                    <p className="text-lg font-bold">{count}</p>
                    <p className="text-[10px] font-medium">{label}</p>
                  </div>
                ))}
              </div>

              {/* Annotated image */}
              {result.detection_image && (
                <Card>
                  <CardHeader className="py-3 px-4 border-b"><CardTitle className="text-sm flex items-center gap-2"><ScanSearch className="h-4 w-4 text-orange-500" /> Detection Output</CardTitle></CardHeader>
                  <CardContent className="p-3">
                    <img src={`data:image/png;base64,${result.detection_image}`} alt="Detection output"
                      className="w-full rounded-lg border border-border object-contain max-h-[420px]" />
                    <p className="text-xs text-muted-foreground mt-2">Red boxes = industrial kilns detected by YOLOv8.</p>
                  </CardContent>
                </Card>
              )}

              {/* Kiln list */}
              <Card>
                <CardHeader className="py-3 px-4 border-b">
                  <CardTitle className="text-sm flex items-center justify-between">
                    Detected Emitters
                    <Badge variant="outline" className="text-[10px]">{result.kiln_count} found</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {result.kilns.length === 0
                    ? <p className="text-sm text-muted-foreground text-center py-8">No industrial emitters detected.</p>
                    : <div className="divide-y max-h-64 overflow-y-auto">
                        {result.kilns.map((k, i) => (
                          <div key={i} className="px-4 py-3 flex items-start gap-3">
                            <div className="mt-0.5 h-3 w-3 rounded-full shrink-0" style={{ background: SEVERITY_COLOR[k.severity] }} />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-sm font-medium flex items-center gap-1"><MapPin className="h-3 w-3" />Kiln #{i + 1}</span>
                                <Badge variant={severityVariant(k.severity)} className={`text-[10px] shrink-0 ${SEVERITY_BG[k.severity]}`}>{k.severity}</Badge>
                              </div>
                              <p className="text-xs text-muted-foreground mt-0.5">Score: {k.emission_score.toExponential(3)}</p>
                              <p className="text-[10px] text-muted-foreground/60 font-mono mt-0.5">{k.latitude.toFixed(4)}°N, {k.longitude.toFixed(4)}°E</p>
                            </div>
                          </div>
                        ))}
                      </div>
                  }
                  {result && (
                    <div className="px-4 py-2 border-t text-[10px] text-muted-foreground/60 flex items-center gap-1.5">
                      <Satellite className="h-3 w-3" /> YOLOv8 · {new Date(result.generated_at).toLocaleString()}
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default IndustrialDetection;
