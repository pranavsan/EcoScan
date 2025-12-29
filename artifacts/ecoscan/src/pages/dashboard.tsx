import { useGetAnalyticsSummary, useGetTrends, useListReports, useGetWasteTypeStats, useGetHotspots } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, CheckCircle2, Clock, Trash2, MapPin } from "lucide-react";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, LineChart, Line, CartesianGrid } from "recharts";
import { Link } from "wouter";

export default function Dashboard() {
  const { data: summary, isLoading: loadingSummary } = useGetAnalyticsSummary();
  const { data: trends, isLoading: loadingTrends } = useGetTrends({ days: 14 });
  const { data: reports, isLoading: loadingReports } = useListReports({ limit: 5 });
  const { data: hotspots, isLoading: loadingHotspots } = useGetHotspots();

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Overview of environmental ops and recent activity.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/scan" className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md font-medium inline-flex items-center gap-2 transition-colors">
            <MapPin className="w-4 h-4" />
            Report Waste
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reports</CardTitle>
            <Trash2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loadingSummary ? <Skeleton className="h-8 w-16" /> : summary?.totalReports}</div>
            <div className="text-xs text-muted-foreground mt-1">
              {loadingSummary ? <Skeleton className="h-4 w-24" /> : `+${summary?.reportsTodayCount} today`}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            <AlertCircle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loadingSummary ? <Skeleton className="h-8 w-16" /> : summary?.pendingReports}</div>
            <div className="text-xs text-muted-foreground mt-1">Needs attention</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loadingSummary ? <Skeleton className="h-8 w-16" /> : summary?.inProgressReports}</div>
            <div className="text-xs text-muted-foreground mt-1">Currently being handled</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolved</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loadingSummary ? <Skeleton className="h-8 w-16" /> : summary?.resolvedReports}</div>
            <div className="text-xs text-muted-foreground mt-1">Successfully cleaned</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Reports Over Time</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            {loadingTrends ? (
              <div className="h-[300px] flex items-center justify-center">
                <Skeleton className="h-full w-full" />
              </div>
            ) : (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trends} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted" />
                    <XAxis dataKey="date" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
                    <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} />
                    <Line type="monotone" dataKey="count" name="Total" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="resolved" name="Resolved" stroke="hsl(var(--chart-2))" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Recent Reports</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingReports ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : reports?.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No reports found.</div>
            ) : (
              <div className="space-y-4">
                {reports?.map((report) => (
                  <div key={report.id} className="flex items-center gap-4">
                    <div className="bg-muted p-2 rounded-md">
                      <AlertCircle className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium leading-none capitalize">{report.wasteType.replace('_', ' ')}</p>
                      <p className="text-sm text-muted-foreground">{report.location}</p>
                    </div>
                    <div className="text-xs text-muted-foreground font-mono">
                      {new Date(report.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
