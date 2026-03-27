import { useMemo } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import { Link } from "wouter";

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

const STATUS_COLORS: Record<string, string> = {
  pending: "#f59e0b",
  reported: "#3b82f6",
  in_progress: "#a855f7",
  resolved: "#22c55e",
};

interface Report {
  id: number;
  wasteType: string;
  location: string;
  area: string;
  severity: string;
  status: string;
  latitude: number | null;
  longitude: number | null;
  createdAt: string;
}

interface ReportsMapProps {
  reports: Report[];
  colorBy?: "wasteType" | "status";
}

export function ReportsMap({ reports, colorBy = "wasteType" }: ReportsMapProps) {
  const validReports = useMemo(
    () => reports.filter((r) => r.latitude != null && r.longitude != null),
    [reports]
  );

  const getColor = (report: Report) =>
    colorBy === "status"
      ? (STATUS_COLORS[report.status] ?? "#94a3b8")
      : (WASTE_COLORS[report.wasteType] ?? "#94a3b8");

  const getRadius = (severity: string) =>
    severity === "high" ? 10 : severity === "medium" ? 7 : 5;

  return (
    <MapContainer
      center={[54.5, -3.5]}
      zoom={6}
      style={{ height: "100%", width: "100%" }}
      className="rounded-lg z-0"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {validReports.map((report) => (
        <CircleMarker
          key={report.id}
          center={[report.latitude!, report.longitude!]}
          radius={getRadius(report.severity)}
          pathOptions={{
            color: getColor(report),
            fillColor: getColor(report),
            fillOpacity: 0.75,
            weight: 1.5,
            opacity: 0.9,
          }}
        >
          <Popup className="report-popup">
            <div className="space-y-1.5 text-sm min-w-[180px]">
              <div className="font-semibold capitalize">{report.wasteType} waste</div>
              <div className="text-muted-foreground text-xs">{report.location}</div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span
                  className="inline-block px-1.5 py-0.5 rounded text-xs font-medium"
                  style={{ background: STATUS_COLORS[report.status] + "22", color: STATUS_COLORS[report.status] }}
                >
                  {report.status.replace("_", " ")}
                </span>
                <span className="text-xs text-muted-foreground">
                  {report.severity} severity
                </span>
              </div>
              <div className="pt-1">
                <Link href={`/reports/${report.id}`} className="text-xs text-primary underline underline-offset-2">
                  View report →
                </Link>
              </div>
            </div>
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}
