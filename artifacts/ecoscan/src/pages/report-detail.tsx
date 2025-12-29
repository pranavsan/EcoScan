import { useRoute, useLocation } from "wouter";
import { useGetReport, useUpdateReport, getListReportsQueryKey, getGetReportQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, MapPin, Calendar, User, AlertCircle, CheckCircle2, Clock } from "lucide-react";

const STATUS_BADGES: Record<string, { label: string; className: string }> = {
  pending: { label: "Pending", className: "bg-amber-100 text-amber-800" },
  reported: { label: "Reported", className: "bg-blue-100 text-blue-800" },
  in_progress: { label: "In Progress", className: "bg-purple-100 text-purple-800" },
  resolved: { label: "Resolved", className: "bg-green-100 text-green-800" },
};

const SEVERITY_BADGES: Record<string, string> = {
  low: "bg-emerald-100 text-emerald-800",
  medium: "bg-amber-100 text-amber-800",
  high: "bg-red-100 text-red-800",
};

export default function ReportDetail() {
  const [, params] = useRoute("/reports/:id");
  const [, setLocation] = useLocation();
  const id = Number(params?.id);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: report, isLoading } = useGetReport(id, {
    query: { enabled: !!id, queryKey: getGetReportQueryKey(id) },
  });

  const updateReport = useUpdateReport();

  function handleStatusChange(status: string) {
    updateReport.mutate(
      { id, data: { status } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListReportsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetReportQueryKey(id) });
          toast({ title: "Status updated" });
        },
        onError: () => toast({ title: "Update failed", variant: "destructive" }),
      }
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => setLocation("/reports")} data-testid="button-back">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Report Detail</h1>
          {report && <p className="text-muted-foreground">#{report.id}</p>}
        </div>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="pt-6 space-y-4">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </CardContent>
        </Card>
      ) : !report ? (
        <Card>
          <CardContent className="pt-6 text-center py-12">
            <AlertCircle className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
            <p className="font-medium">Report not found</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="space-y-1">
                  <CardTitle className="text-xl capitalize">{report.wasteType} Waste</CardTitle>
                  <div className="flex gap-2 flex-wrap">
                    <Badge className={SEVERITY_BADGES[report.severity] ?? ""}>{report.severity} severity</Badge>
                    <Badge className={STATUS_BADGES[report.status]?.className ?? ""}>{STATUS_BADGES[report.status]?.label}</Badge>
                  </div>
                </div>
                <Select value={report.status} onValueChange={handleStatusChange}>
                  <SelectTrigger className="w-40" data-testid="select-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="reported">Reported</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium">Location</p>
                    <p className="text-muted-foreground">{report.location}</p>
                    <p className="text-muted-foreground">{report.area}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium">Reported</p>
                    <p className="text-muted-foreground">
                      {new Date(report.createdAt).toLocaleDateString(undefined, {
                        weekday: "long", year: "numeric", month: "long", day: "numeric",
                      })}
                    </p>
                  </div>
                </div>
                {report.reporterName && (
                  <div className="flex items-start gap-2">
                    <User className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div>
                      <p className="font-medium">Reporter</p>
                      <p className="text-muted-foreground">{report.reporterName}</p>
                    </div>
                  </div>
                )}
                {(report.latitude != null && report.longitude != null) && (
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div>
                      <p className="font-medium">Coordinates</p>
                      <p className="text-muted-foreground font-mono text-xs">
                        {report.latitude?.toFixed(6)}, {report.longitude?.toFixed(6)}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {report.description && (
                <div className="pt-2 border-t">
                  <p className="text-sm font-medium mb-1">Description</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">{report.description}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {report.imageBase64 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Submitted Image</CardTitle>
              </CardHeader>
              <CardContent>
                <img
                  src={`data:image/jpeg;base64,${report.imageBase64}`}
                  alt="Waste report"
                  className="rounded-lg max-h-64 object-contain"
                  data-testid="img-report"
                />
              </CardContent>
            </Card>
          )}

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setLocation("/reports")} data-testid="button-back-list">
              Back to Reports
            </Button>
            {report.status !== "resolved" && (
              <Button
                onClick={() => handleStatusChange("resolved")}
                disabled={updateReport.isPending}
                data-testid="button-mark-resolved"
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Mark Resolved
              </Button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
