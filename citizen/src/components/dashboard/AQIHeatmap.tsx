import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.heat";
import { AreaAQI } from "./CityAQIAreas";

// Augment leaflet with heatLayer
declare module "leaflet" {
  function heatLayer(
    latlngs: Array<[number, number, number]>,
    options?: {
      minOpacity?: number;
      maxZoom?: number;
      max?: number;
      radius?: number;
      blur?: number;
      gradient?: Record<string, string>;
    }
  ): L.Layer & { setLatLngs: (latlngs: Array<[number, number, number]>) => void };
}

interface HeatmapLayerProps {
  points: Array<[number, number, number]>;
  forecastDay: number;
}

function HeatmapLayer({ points, forecastDay }: HeatmapLayerProps) {
  const map = useMap();
  const heatRef = useRef<ReturnType<typeof L.heatLayer> | null>(null);

  // Create the layer once on mount
  useEffect(() => {
    heatRef.current = L.heatLayer(points, {
      radius: 40,
      blur: 30,
      maxZoom: 13,
      max: 300,
      minOpacity: 0.4,
      gradient: {
        0.0: "#00e400",
        0.2: "#ffff00",
        0.4: "#ff7e00",
        0.6: "#ff0000",
        0.8: "#8f3f97",
        1.0: "#7e0023",
      },
    });
    heatRef.current.addTo(map);
    return () => {
      if (heatRef.current) map.removeLayer(heatRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map]);

  // Update data whenever forecastDay or points change — use setLatLngs for in-place update
  useEffect(() => {
    if (heatRef.current && points.length > 0) {
      heatRef.current.setLatLngs(points);
      // Force redraw
      (heatRef.current as any)._update?.();
      map.invalidateSize();
    }
  }, [forecastDay, points, map]);

  return null;
}

interface Props {
  areas: AreaAQI[];
  cityCenter: [number, number];
  cityName: string;
  forecastDay?: number; // 0 = current, 1-6 = forecast day index
}

export function AQIHeatmap({ areas, cityCenter, cityName, forecastDay = 0 }: Props) {
  // Build heatmap points from area coords + AQI
  const points: Array<[number, number, number]> = areas
    .filter((a) => a.lat != null && a.lng != null)
    .map((a) => {
      const aqi = forecastDay === 0
        ? a.currentAQI
        : (a.forecast[forecastDay - 1]?.aqi ?? a.currentAQI);
      return [a.lat!, a.lng!, aqi] as [number, number, number];
    });

  return (
    <div className="relative h-[380px] w-full rounded-xl overflow-hidden border">
      <MapContainer
        center={cityCenter}
        zoom={11}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom={false}
        zoomControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {points.length > 0 && <HeatmapLayer points={points} forecastDay={forecastDay} />}
      </MapContainer>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 z-[1000] bg-background/90 backdrop-blur-sm rounded-xl border p-3 shadow-lg">
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">AQI Scale</p>
        <div className="space-y-1">
          {[
            { label: "Good", color: "#00e400", range: "0–50" },
            { label: "Moderate", color: "#ffff00", range: "51–100" },
            { label: "Unhealthy*", color: "#ff7e00", range: "101–150" },
            { label: "Unhealthy", color: "#ff0000", range: "151–200" },
            { label: "Very Unhealthy", color: "#8f3f97", range: "201–300" },
            { label: "Hazardous", color: "#7e0023", range: "300+" },
          ].map((l) => (
            <div key={l.label} className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: l.color }} />
              <span className="text-[10px] text-muted-foreground">{l.label}</span>
              <span className="text-[10px] text-muted-foreground/60 ml-auto">{l.range}</span>
            </div>
          ))}
        </div>
      </div>

      {/* City label */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[1000] bg-background/90 backdrop-blur-sm rounded-full border px-3 py-1 shadow">
        <span className="text-xs font-semibold text-foreground">
          {cityName} — {forecastDay === 0 ? "Current AQI" : `${areas[forecastDay - 1]?.forecast[forecastDay - 1]?.day ?? `Day ${forecastDay}`} Forecast`}
        </span>
      </div>
    </div>
  );
}
