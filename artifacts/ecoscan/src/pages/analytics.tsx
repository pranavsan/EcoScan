import { useState, useMemo } from "react";
import { useGetWasteTypeStats, useGetHotspots, useGetTrends, useGetAnalyticsSummary, useListAreas, useListReports } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UKHeatmap } from "@/components/map/uk-heatmap";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { TrendingUp, MapPin, BarChart2, AlertCircle, Layers } from "lucide-react";

const WASTE_TYPES = ["plastic", "organic", "electronic", "hazardous", "paper", "metal", "glass", "mixed"];

const WASTE_COLORS: Record<string, string> = {
  plastic: "#3b82f6",
  organic: "#22c55e",
  electronic: "#a855f7",
  hazardous: "#ef4444",
  paper: "#f59e0b",
  metal: "#64748b",
  glass: "#06b6d4",
  mixed: "#f97316",
};

const CHART_COLORS = Object.values(WASTE_COLORS);

const SEVERITY_COLOR: Record<string, string> = {
  low: "bg-emerald-100 text-emerald-800",
  medium: "bg-amber-100 text-amber-800",
  high: "bg-red-100 text-red-800",
};

export default function Analytics() {
  const [filterArea, setFilterArea] = useState("all");
  const [trendDays, setTrendDays] = useState<number>(30);
  const [activeWasteTypes, setActiveWasteTypes] = useState<Set<string>>(new Set());

  const { data: areas } = useListAreas();
  const { data: summary, isLoading: loadingSummary } = useGetAnalyticsSummary();
  const { data: wasteStats, isLoading: loadingWasteStats } = useGetWasteTypeStats({
    area: filterArea !== "all" ? filterArea : undefined,
  });
  const { data: hotspots, isLoading: loadingHotspots } = useGetHotspots();
  const { data: trends, isLoading: loadingTrends } = useGetTrends({ days: trendDays });
  const { data: allReports, isLoading: loadingReports } = useListReports({ limit: 500 });

  const resolutionRate = summary
    ? Math.round((summary.resolvedReports / Math.max(summary.totalReports, 1)) * 100)
    : 0;

  function toggleWasteType(type: string) {
    setActiveWasteTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  }

  const heatmapReports = useMemo(
    () =>
      (allReports ?? []).map((r) => ({
        wasteType: r.wasteType,
        latitude: r.latitude,
        longitude: r.longitude,
        severity: r.severity,
      })),
    [allReports]
  );

  const plotted = heatmapReports.filter((r) => r.latitude != null).length;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground">UK-wide waste intelligence — patterns, hotspots, and heatmaps.</p>
      </div>

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Resolution Rate", value: loadingSummary ? null : `${resolutionRate}%`, sub: "of all reports resolved" },
          { label: "Top Waste Type", value: loadingSummary ? null : summary?.topWasteType, sub: "most reported", capitalize: true },
          { label: "Worst Hotspot", value: loadingSummary ? null : summary?.topArea, sub: "area with most reports" },
          { label: "Reports Today", value: loadingSummary ? null : String(summary?.reportsTodayCount), sub: "new submissions" },
        ].map((stat, i) => (
          <Card key={i}>
            <CardContent className="pt-4">
              {stat.value === null ? (
                <Skeleton className="h-8 w-20 mb-1" />
              ) : (
                <p className={`text-2xl font-bold ${stat.capitalize ? "capitalize" : ""}`}>{stat.value}</p>
              )}
              <p className="text-xs text-muted-foreground mt-0.5">{stat.sub}</p>
              <p className="text-sm font-medium mt-1 text-muted-foreground">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* UK Heatmap */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Layers className="w-4 h-4" />
                UK Waste Heatmap
              </CardTitle>
              <CardDescription>
                Interactive map of all {plotted} geolocated reports across the UK. Toggle waste types to filter.
              </CardDescription>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            <Button
              size="sm"
              variant={activeWasteTypes.size === 0 ? "default" : "outline"}
              className="h-7 text-xs"
              onClick={() => setActiveWasteTypes(new Set())}
            >
              All Waste
            </Button>
            {WASTE_TYPES.map((type) => {
              const active = activeWasteTypes.has(type);
              return (
                <Button
                  key={type}
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs capitalize gap-1.5"
                  style={
                    active
                      ? { background: WASTE_COLORS[type] + "22", borderColor: WASTE_COLORS[type], color: WASTE_COLORS[type] }
                      : {}
                  }
                  onClick={() => toggleWasteType(type)}
                >
                  <span
                    className="w-2 h-2 rounded-full inline-block shrink-0"
                    style={{ background: WASTE_COLORS[type] }}
                  />
                  {type}
                </Button>
              );
            })}
          </div>
        </CardHeader>
        <CardContent className="p-3">
          <div className="h-[500px] rounded-lg overflow-hidden border border-border">
            {loadingReports ? (
              <Skeleton className="h-full w-full" />
            ) : (
              <UKHeatmap reports={heatmapReports} activeTypes={activeWasteTypes} />
            )}
          </div>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
            {WASTE_TYPES.map((type) => (
              <div key={type} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="w-3 h-3 rounded-full inline-block" style={{ background: WASTE_COLORS[type] }} />
                <span className="capitalize">{type}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BarChart2 className="w-4 h-4" />
                Waste Type Distribution
              </CardTitle>
              <CardDescription>Breakdown by category</CardDescription>
            </div>
            <Select value={filterArea} onValueChange={setFilterArea}>
              <SelectTrigger className="w-36 h-8 text-xs">
                <SelectValue placeholder="All Areas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Areas</SelectItem>
                {areas?.map((a) => (
                  <SelectItem key={a.name} value={a.name}>{a.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent>
            {loadingWasteStats ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={wasteStats}
                      dataKey="count"
                      nameKey="wasteType"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ wasteType, percentage }) => `${wasteType} ${percentage}%`}
                      labelLine={false}
                    >
                      {wasteStats?.map((entry, i) => (
                        <Cell key={i} fill={WASTE_COLORS[entry.wasteType] ?? CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }}
                      formatter={(v: number, name: string) => [`${v} reports`, name]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart2 className="w-4 h-4" />
              Count by Type
            </CardTitle>
            <CardDescription>Number of reports per waste category</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingWasteStats ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={wasteStats} layout="vertical" margin={{ left: 16, right: 16 }}>
                    <XAxis type="number" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis type="category" dataKey="wasteType" fontSize={11} tickLine={false} axisLine={false} width={80} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }}
                    />
                    <Bar dataKey="count" name="Reports" radius={[0, 4, 4, 0]}>
                      {wasteStats?.map((entry, i) => (
                        <Cell key={i} fill={WASTE_COLORS[entry.wasteType] ?? CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Reports Over Time
            </CardTitle>
            <CardDescription>New and resolved reports trend</CardDescription>
          </div>
          <Select value={String(trendDays)} onValueChange={(v) => setTrendDays(Number(v))}>
            <SelectTrigger className="w-28 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="14">Last 14 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          {loadingTrends ? (
            <Skeleton className="h-72 w-full" />
          ) : (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trends} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted" />
                  <XAxis dataKey="date" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="count" name="New Reports" stroke="#006633" strokeWidth={2.5} dot={false} />
                  <Line type="monotone" dataKey="resolved" name="Resolved" stroke="#f59e0b" strokeWidth={2.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            UK Hotspots
          </CardTitle>
          <CardDescription>Areas ranked by report volume</CardDescription>
        </CardHeader>
        <CardContent>
          {loadingHotspots ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : hotspots?.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-30" />
              No hotspot data yet
            </div>
          ) : (
            <div className="space-y-2">
              {hotspots?.map((h, i) => (
                <div key={h.area} className="flex items-center gap-4 p-3 rounded-lg hover:bg-accent/30 transition-colors">
                  <span className="font-mono text-sm font-bold text-muted-foreground w-6 text-center">#{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{h.area}</p>
                    <p className="text-xs text-muted-foreground">
                      Top waste: <span className="capitalize">{h.topWasteType}</span>
                    </p>
                  </div>
                  <div className="text-right space-y-1">
                    <p className="font-bold text-sm">{h.count} reports</p>
                    <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200">
                      {h.pendingCount} pending
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
