import { useGetWasteTypeStats, useGetHotspots, useGetTrends, useGetAnalyticsSummary, useListAreas } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { useState } from "react";
import { TrendingUp, MapPin, BarChart2, AlertCircle } from "lucide-react";

const CHART_COLORS = [
  "hsl(155, 100%, 20%)",
  "hsl(45, 93%, 47%)",
  "hsl(210, 80%, 55%)",
  "hsl(0, 75%, 55%)",
  "hsl(270, 60%, 55%)",
  "hsl(30, 85%, 55%)",
  "hsl(180, 70%, 40%)",
  "hsl(320, 60%, 55%)",
];

const SEVERITY_COLOR: Record<string, string> = {
  low: "bg-emerald-100 text-emerald-800",
  medium: "bg-amber-100 text-amber-800",
  high: "bg-red-100 text-red-800",
};

export default function Analytics() {
  const [filterArea, setFilterArea] = useState("all");
  const [trendDays, setTrendDays] = useState<number>(30);

  const { data: areas } = useListAreas();
  const { data: summary, isLoading: loadingSummary } = useGetAnalyticsSummary();
  const { data: wasteStats, isLoading: loadingWasteStats } = useGetWasteTypeStats({
    area: filterArea !== "all" ? filterArea : undefined,
  });
  const { data: hotspots, isLoading: loadingHotspots } = useGetHotspots();
  const { data: trends, isLoading: loadingTrends } = useGetTrends({ days: trendDays });

  const resolutionRate = summary
    ? Math.round((summary.resolvedReports / Math.max(summary.totalReports, 1)) * 100)
    : 0;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground">Environmental intelligence — waste patterns, hotspots, and trends.</p>
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
              <SelectTrigger className="w-36 h-8 text-xs" data-testid="select-area-filter">
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
            ) : wasteStats?.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-muted-foreground">No data available</div>
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
                      {wasteStats?.map((_, i) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
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
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BarChart2 className="w-4 h-4" />
                By Waste Type
              </CardTitle>
              <CardDescription>Count per category</CardDescription>
            </div>
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
                      {wasteStats?.map((_, i) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
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
            <SelectTrigger className="w-28 h-8 text-xs" data-testid="select-trend-days">
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
          ) : trends?.length === 0 ? (
            <div className="h-72 flex items-center justify-center text-muted-foreground">No trend data for this period.</div>
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
                  <Line type="monotone" dataKey="count" name="New Reports" stroke="hsl(155, 100%, 20%)" strokeWidth={2.5} dot={false} />
                  <Line type="monotone" dataKey="resolved" name="Resolved" stroke="hsl(45, 93%, 47%)" strokeWidth={2.5} dot={false} />
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
            Waste Hotspots
          </CardTitle>
          <CardDescription>Areas ranked by number of reports</CardDescription>
        </CardHeader>
        <CardContent>
          {loadingHotspots ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : hotspots?.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p>No hotspot data yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {hotspots?.map((h, i) => (
                <div key={h.area} className="flex items-center gap-4 p-3 rounded-lg hover:bg-accent/30 transition-colors" data-testid={`hotspot-${i}`}>
                  <span className="font-mono text-sm font-bold text-muted-foreground w-6 text-center">#{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{h.area}</p>
                    <p className="text-xs text-muted-foreground">Top waste: <span className="capitalize">{h.topWasteType}</span></p>
                  </div>
                  <div className="text-right space-y-1">
                    <p className="font-bold text-sm">{h.count} reports</p>
                    <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200">{h.pendingCount} pending</Badge>
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
