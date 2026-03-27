import { useState } from "react";
import { useListReports, useUpdateReport, useDeleteReport, getListReportsQueryKey, useListAreas } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { ReportsMap } from "@/components/map/reports-map";
import { Search, Trash2, Eye, CheckCircle2, Clock, AlertCircle, MapPin, Filter, Map, List } from "lucide-react";
import { Link } from "wouter";

const STATUS_BADGES: Record<string, { label: string; className: string; icon: React.ElementType }> = {
  pending: { label: "Pending", className: "bg-amber-100 text-amber-800 border-amber-200", icon: AlertCircle },
  reported: { label: "Reported", className: "bg-blue-100 text-blue-800 border-blue-200", icon: MapPin },
  in_progress: { label: "In Progress", className: "bg-purple-100 text-purple-800 border-purple-200", icon: Clock },
  resolved: { label: "Resolved", className: "bg-green-100 text-green-800 border-green-200", icon: CheckCircle2 },
};

const SEVERITY_BADGES: Record<string, string> = {
  low: "bg-emerald-50 text-emerald-700 border-emerald-200",
  medium: "bg-amber-50 text-amber-700 border-amber-200",
  high: "bg-red-50 text-red-700 border-red-200",
};

export default function Reports() {
  const [search, setSearch] = useState("");
  const [filterArea, setFilterArea] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterWasteType, setFilterWasteType] = useState("all");
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [colorBy, setColorBy] = useState<"wasteType" | "status">("wasteType");

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: areas } = useListAreas();
  const { data: reports, isLoading } = useListReports({
    area: filterArea !== "all" ? filterArea : undefined,
    status: filterStatus !== "all" ? filterStatus : undefined,
    wasteType: filterWasteType !== "all" ? filterWasteType : undefined,
    limit: 500,
  });

  const updateReport = useUpdateReport();
  const deleteReport = useDeleteReport();

  const filtered = reports?.filter(
    (r) =>
      search === "" ||
      r.location.toLowerCase().includes(search.toLowerCase()) ||
      r.wasteType.toLowerCase().includes(search.toLowerCase()) ||
      r.area.toLowerCase().includes(search.toLowerCase())
  );

  function handleStatusChange(id: number, status: string) {
    updateReport.mutate(
      { id, data: { status } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListReportsQueryKey() });
          toast({ title: "Status updated" });
        },
        onError: () => toast({ title: "Update failed", variant: "destructive" }),
      }
    );
  }

  function handleDelete() {
    if (!deleteId) return;
    deleteReport.mutate(
      { id: deleteId },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListReportsQueryKey() });
          setDeleteId(null);
          toast({ title: "Report deleted" });
        },
        onError: () => toast({ title: "Delete failed", variant: "destructive" }),
      }
    );
  }

  const filterBar = (
    <div className="flex flex-col sm:flex-row gap-3">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by location, type, area..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>
      <div className="flex gap-2 flex-wrap">
        <Select value={filterArea} onValueChange={setFilterArea}>
          <SelectTrigger className="w-40">
            <Filter className="w-3 h-3 mr-1" />
            <SelectValue placeholder="Area" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Areas</SelectItem>
            {areas?.map((a) => (
              <SelectItem key={a.name} value={a.name}>{a.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="reported">Reported</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterWasteType} onValueChange={setFilterWasteType}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Waste Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {["plastic", "organic", "electronic", "hazardous", "paper", "metal", "glass", "mixed"].map((t) => (
              <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
          <p className="text-muted-foreground">All waste reports submitted across the UK.</p>
        </div>
        <Link href="/scan">
          <Button>
            <MapPin className="w-4 h-4 mr-2" />
            New Report
          </Button>
        </Link>
      </div>

      <Tabs defaultValue="list">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <TabsList>
            <TabsTrigger value="list" className="gap-1.5">
              <List className="w-3.5 h-3.5" />
              List
            </TabsTrigger>
            <TabsTrigger value="map" className="gap-1.5">
              <Map className="w-3.5 h-3.5" />
              Map
            </TabsTrigger>
          </TabsList>
          {filterBar}
        </div>

        <TabsContent value="list" className="mt-0">
          <Card>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-6 space-y-3">
                  {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
                </div>
              ) : filtered?.length === 0 ? (
                <div className="py-16 text-center text-muted-foreground">
                  <MapPin className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="font-medium">No reports found</p>
                  <p className="text-sm">Try adjusting your filters</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead>Waste Type</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Area</TableHead>
                        <TableHead>Severity</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filtered?.map((report) => {
                        const statusInfo = STATUS_BADGES[report.status] ?? STATUS_BADGES["pending"];
                        const StatusIcon = statusInfo.icon;
                        return (
                          <TableRow key={report.id} className="group">
                            <TableCell className="font-medium capitalize">{report.wasteType}</TableCell>
                            <TableCell className="max-w-[200px] truncate text-muted-foreground">{report.location}</TableCell>
                            <TableCell>{report.area}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className={SEVERITY_BADGES[report.severity] ?? ""}>{report.severity}</Badge>
                            </TableCell>
                            <TableCell>
                              <Select
                                value={report.status}
                                onValueChange={(v) => handleStatusChange(report.id, v)}
                              >
                                <SelectTrigger className={`w-36 h-7 text-xs font-medium border ${statusInfo.className}`}>
                                  <StatusIcon className="w-3 h-3 mr-1" />
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="pending">Pending</SelectItem>
                                  <SelectItem value="reported">Reported</SelectItem>
                                  <SelectItem value="in_progress">In Progress</SelectItem>
                                  <SelectItem value="resolved">Resolved</SelectItem>
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell className="font-mono text-xs text-muted-foreground">
                              {new Date(report.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "2-digit" })}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Link href={`/reports/${report.id}`}>
                                  <Button size="icon" variant="ghost" className="h-7 w-7">
                                    <Eye className="w-3.5 h-3.5" />
                                  </Button>
                                </Link>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-7 w-7 text-destructive hover:text-destructive"
                                  onClick={() => setDeleteId(report.id)}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="map" className="mt-0">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-sm font-medium text-muted-foreground">Colour by:</span>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant={colorBy === "wasteType" ? "default" : "outline"}
                    className="h-7 text-xs"
                    onClick={() => setColorBy("wasteType")}
                  >
                    Waste Type
                  </Button>
                  <Button
                    size="sm"
                    variant={colorBy === "status" ? "default" : "outline"}
                    className="h-7 text-xs"
                    onClick={() => setColorBy("status")}
                  >
                    Status
                  </Button>
                </div>
                {filtered && (
                  <span className="text-xs text-muted-foreground ml-auto">
                    {filtered.filter((r) => r.latitude != null).length} of {filtered.length} plotted
                  </span>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-3">
              <div className="h-[520px] rounded-lg overflow-hidden border border-border">
                {isLoading ? (
                  <Skeleton className="h-full w-full" />
                ) : (
                  <ReportsMap reports={filtered ?? []} colorBy={colorBy} />
                )}
              </div>
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
                {colorBy === "wasteType"
                  ? [
                      { label: "Plastic", color: "#3b82f6" },
                      { label: "Organic", color: "#22c55e" },
                      { label: "Electronic", color: "#a855f7" },
                      { label: "Hazardous", color: "#ef4444" },
                      { label: "Paper", color: "#f59e0b" },
                      { label: "Metal", color: "#64748b" },
                      { label: "Glass", color: "#06b6d4" },
                      { label: "Mixed", color: "#f97316" },
                    ].map(({ label, color }) => (
                      <div key={label} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <span className="w-3 h-3 rounded-full inline-block" style={{ background: color }} />
                        {label}
                      </div>
                    ))
                  : [
                      { label: "Pending", color: "#f59e0b" },
                      { label: "Reported", color: "#3b82f6" },
                      { label: "In Progress", color: "#a855f7" },
                      { label: "Resolved", color: "#22c55e" },
                    ].map(({ label, color }) => (
                      <div key={label} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <span className="w-3 h-3 rounded-full inline-block" style={{ background: color }} />
                        {label}
                      </div>
                    ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Report</DialogTitle>
            <DialogDescription>Are you sure you want to delete this report? This cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteReport.isPending}>
              {deleteReport.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
