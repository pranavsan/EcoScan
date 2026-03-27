import { useEffect, useMemo, useRef } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import * as L from "leaflet";

const WASTE_COLORS: Record<string, string> = {
  plastic: "#3b82f6",
  organic: "#22c55e",
  electronic: "#a855f7",
  hazardous: "#ef4444",
  paper: "#f59e0b",
  metal: "#64748b",
  glass: "#06b6d4",
  mixed: "#f97316",
  textile: "#ec4899",
  construction: "#a16207",
};

interface Report {
  wasteType: string;
  latitude: number | null;
  longitude: number | null;
  severity: string;
}

interface HeatLayerProps {
  reports: Report[];
  activeTypes: Set<string>;
}

function HeatLayer({ reports, activeTypes }: HeatLayerProps) {
  const map = useMap();
  const layerGroupRef = useRef<L.LayerGroup | null>(null);

  const filtered = useMemo(
    () =>
      reports.filter(
        (r) =>
          r.latitude != null &&
          r.longitude != null &&
          (activeTypes.size === 0 || activeTypes.has(r.wasteType))
      ),
    [reports, activeTypes]
  );

  useEffect(() => {
    if (layerGroupRef.current) {
      layerGroupRef.current.clearLayers();
    } else {
      layerGroupRef.current = L.layerGroup().addTo(map);
    }

    filtered.forEach((report) => {
      const color = WASTE_COLORS[report.wasteType] ?? "#94a3b8";
      const severityRadius = report.severity === "high" ? 28000 : report.severity === "medium" ? 20000 : 14000;

      L.circle([report.latitude!, report.longitude!], {
        radius: severityRadius,
        color: color,
        fillColor: color,
        fillOpacity: 0.18,
        weight: 0,
      }).addTo(layerGroupRef.current!);

      L.circleMarker([report.latitude!, report.longitude!], {
        radius: 5,
        color: color,
        fillColor: color,
        fillOpacity: 0.85,
        weight: 1.5,
      }).addTo(layerGroupRef.current!);
    });

    return () => {
      layerGroupRef.current?.clearLayers();
    };
  }, [filtered, map]);

  return null;
}

interface UKHeatmapProps {
  reports: Report[];
  activeTypes: Set<string>;
}

export function UKHeatmap({ reports, activeTypes }: UKHeatmapProps) {
  return (
    <MapContainer
      center={[54.0, -2.5]}
      zoom={6}
      style={{ height: "100%", width: "100%" }}
      className="rounded-lg z-0"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <HeatLayer reports={reports} activeTypes={activeTypes} />
    </MapContainer>
  );
}
