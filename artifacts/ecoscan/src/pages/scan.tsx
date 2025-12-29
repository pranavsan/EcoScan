import { useState, useRef } from "react";
import { useScanWaste, useCreateReport, getListReportsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Upload, Camera, AlertTriangle, CheckCircle2, Leaf, Cpu, Package, Zap, FileText, Layers, Wine, Shirt, Building2 } from "lucide-react";
import { useLocation } from "wouter";

const WASTE_TYPE_ICONS: Record<string, React.ElementType> = {
  plastic: Package,
  organic: Leaf,
  electronic: Cpu,
  hazardous: AlertTriangle,
  paper: FileText,
  metal: Layers,
  glass: Wine,
  mixed: Layers,
  textile: Shirt,
  construction: Building2,
};

const WASTE_TYPE_COLORS: Record<string, string> = {
  plastic: "bg-blue-100 text-blue-800 border-blue-200",
  organic: "bg-green-100 text-green-800 border-green-200",
  electronic: "bg-purple-100 text-purple-800 border-purple-200",
  hazardous: "bg-red-100 text-red-800 border-red-200",
  paper: "bg-amber-100 text-amber-800 border-amber-200",
  metal: "bg-slate-100 text-slate-800 border-slate-200",
  glass: "bg-cyan-100 text-cyan-800 border-cyan-200",
  mixed: "bg-orange-100 text-orange-800 border-orange-200",
  textile: "bg-pink-100 text-pink-800 border-pink-200",
  construction: "bg-stone-100 text-stone-800 border-stone-200",
};

const SEVERITY_COLORS: Record<string, string> = {
  low: "bg-emerald-100 text-emerald-800",
  medium: "bg-amber-100 text-amber-800",
  high: "bg-red-100 text-red-800",
};

const AREAS = [
  "Downtown", "Riverside District", "North Park", "East Side", "Westfield",
  "Harbor View", "Old Town", "Greenfields", "Industrial Zone", "Lakeside",
];

export default function Scan() {
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [reportForm, setReportForm] = useState({
    location: "",
    area: "",
    reporterName: "",
    description: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const scanWaste = useScanWaste();
  const createReport = useCreateReport();

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      const base64 = dataUrl.split(",")[1];
      setImageBase64(base64);
      setImagePreview(dataUrl);
      setSubmitted(false);
      scanWaste.reset();
    };
    reader.readAsDataURL(file);
  }

  function handleScan() {
    if (!imageBase64) return;
    scanWaste.mutate(
      { data: { imageBase64 } },
      {
        onError: () => {
          toast({ title: "Scan failed", description: "Could not classify image. Try again.", variant: "destructive" });
        },
      }
    );
  }

  function handleSubmitReport() {
    if (!scanWaste.data || !reportForm.location || !reportForm.area) {
      toast({ title: "Missing info", description: "Please fill in location and area.", variant: "destructive" });
      return;
    }

    createReport.mutate(
      {
        data: {
          wasteType: scanWaste.data.wasteType,
          severity: scanWaste.data.severity ?? "medium",
          location: reportForm.location,
          area: reportForm.area,
          description: reportForm.description || scanWaste.data.description,
          reporterName: reportForm.reporterName || null,
          imageBase64: imageBase64,
          latitude: null,
          longitude: null,
        },
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListReportsQueryKey() });
          setSubmitted(true);
          toast({ title: "Report submitted", description: "Waste report sent to local authorities." });
        },
        onError: () => {
          toast({ title: "Failed to submit", description: "Please try again.", variant: "destructive" });
        },
      }
    );
  }

  const result = scanWaste.data;
  const WasteIcon = result ? (WASTE_TYPE_ICONS[result.wasteType] ?? Layers) : null;

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Scan Waste</h1>
        <p className="text-muted-foreground">Upload an image to classify waste with AI, then submit a report.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="w-5 h-5" />
            Image Upload
          </CardTitle>
          <CardDescription>Upload a clear photo of the waste for accurate classification.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary/60 hover:bg-accent/30 transition-all duration-200 flex flex-col items-center justify-center min-h-[200px] relative overflow-hidden group"
            data-testid="upload-zone"
          >
            {imagePreview ? (
              <img src={imagePreview} alt="Uploaded waste" className="max-h-64 object-contain rounded-md" />
            ) : (
              <div className="text-center p-8 space-y-2">
                <Upload className="w-10 h-10 text-muted-foreground mx-auto group-hover:text-primary transition-colors" />
                <p className="font-medium">Click to upload image</p>
                <p className="text-sm text-muted-foreground">JPG, PNG, WEBP supported</p>
              </div>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
            data-testid="input-file"
          />
          <Button
            onClick={handleScan}
            disabled={!imageBase64 || scanWaste.isPending}
            className="w-full"
            data-testid="button-scan"
          >
            {scanWaste.isPending ? "Analyzing with AI..." : "Classify Waste"}
          </Button>
        </CardContent>
      </Card>

      {scanWaste.isPending && (
        <Card>
          <CardContent className="pt-6 space-y-3">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </CardContent>
        </Card>
      )}

      {result && (
        <Card className="border-primary/30 bg-gradient-to-br from-background to-accent/20" data-testid="scan-result">
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                {WasteIcon && (
                  <div className="p-2 rounded-lg bg-primary/10">
                    <WasteIcon className="w-6 h-6 text-primary" />
                  </div>
                )}
                <div>
                  <CardTitle className="text-xl capitalize">{result.wasteType}</CardTitle>
                  <CardDescription>AI Classification Result</CardDescription>
                </div>
              </div>
              <div className="flex gap-2 flex-wrap justify-end">
                <Badge className={WASTE_TYPE_COLORS[result.wasteType] ?? ""}>{result.wasteType}</Badge>
                {result.severity && (
                  <Badge className={SEVERITY_COLORS[result.severity] ?? ""}>{result.severity} severity</Badge>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Confidence</span>
                <span className="font-mono font-medium">{Math.round(result.confidence * 100)}%</span>
              </div>
              <Progress value={result.confidence * 100} className="h-2" />
            </div>

            <p className="text-sm text-foreground/80 leading-relaxed">{result.description}</p>

            <div className="space-y-2">
              <p className="text-sm font-semibold">Disposal Suggestions</p>
              <ul className="space-y-1.5">
                {result.suggestions.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      )}

      {result && !submitted && (
        <Card>
          <CardHeader>
            <CardTitle>Report This Waste</CardTitle>
            <CardDescription>Submit this waste report to local authorities for action.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="location">Location Description</Label>
                <Input
                  id="location"
                  placeholder="e.g. Main Street near the park"
                  value={reportForm.location}
                  onChange={(e) => setReportForm((f) => ({ ...f, location: e.target.value }))}
                  data-testid="input-location"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="area">Area / District</Label>
                <Select
                  value={reportForm.area}
                  onValueChange={(v) => setReportForm((f) => ({ ...f, area: v }))}
                >
                  <SelectTrigger data-testid="select-area">
                    <SelectValue placeholder="Select area" />
                  </SelectTrigger>
                  <SelectContent>
                    {AREAS.map((a) => (
                      <SelectItem key={a} value={a}>{a}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="reporterName">Your Name (optional)</Label>
                <Input
                  id="reporterName"
                  placeholder="Anonymous"
                  value={reportForm.reporterName}
                  onChange={(e) => setReportForm((f) => ({ ...f, reporterName: e.target.value }))}
                  data-testid="input-reporter-name"
                />
              </div>
              <div className="space-y-2 sm:col-span-1">
                <Label htmlFor="description">Additional Notes (optional)</Label>
                <Textarea
                  id="description"
                  placeholder="Any additional context..."
                  value={reportForm.description}
                  onChange={(e) => setReportForm((f) => ({ ...f, description: e.target.value }))}
                  className="resize-none"
                  rows={2}
                  data-testid="input-description"
                />
              </div>
            </div>
            <Button
              onClick={handleSubmitReport}
              disabled={createReport.isPending || !reportForm.location || !reportForm.area}
              className="w-full"
              data-testid="button-submit-report"
            >
              {createReport.isPending ? "Submitting..." : "Submit Report to Authorities"}
            </Button>
          </CardContent>
        </Card>
      )}

      {submitted && (
        <Card className="border-green-200 bg-green-50/50">
          <CardContent className="pt-6 flex flex-col items-center text-center gap-3 py-8">
            <CheckCircle2 className="w-12 h-12 text-green-600" />
            <h3 className="text-lg font-semibold text-green-800">Report Submitted</h3>
            <p className="text-sm text-green-700">Your waste report has been logged and sent to local authorities.</p>
            <div className="flex gap-2 mt-2">
              <Button variant="outline" onClick={() => { setImageBase64(null); setImagePreview(null); scanWaste.reset(); setSubmitted(false); }} data-testid="button-scan-another">
                Scan Another
              </Button>
              <Button onClick={() => setLocation("/reports")} data-testid="button-view-reports">
                View All Reports
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
